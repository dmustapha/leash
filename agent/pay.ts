// File: agent/pay.ts
// [DP-3 RESOLVED] The agent client. It performs the real x402 flow against the resource server:
//   1) GET /premium -> 402 PAYMENT-REQUIRED (carries requirements + the facilitator's extra.feePayer).
//   2) Build a partially-signed native TransferTransaction whose transactionId.accountId = feePayer
//      (the gas-free mechanism: the facilitator fee-payer pays gas; the agent only signs the transfer).
//   3) Retry with the X-PAYMENT header + the X-Leash-Agent header (the ENS record selector, DP-2).
//
// DP-3 SIGNABLE-HASH RESOLUTION: the sha384 placeholder in the ARCHITECTURE snapshot is WRONG and is
// dropped. The correct signature is produced by @x402/hedera's client signer (createClientHederaSigner),
// which freezes the transfer and calls the Hiero SDK's tx.sign(agentKey) - the SDK builds the exact
// signable body hash the scheme's Mirror-Node verifyPayerSignature (INVARIANT #8) checks against the
// agent account's on-chain key. No manual preimage construction.
//
// INVARIANT #6: the agent's custody secp256k1 signing lives HERE in agent/, never in the facilitator.
// The payment rail signs the transfer directly with the agent's key; Privy is the funding rail only and
// never co-signs a payment. (Phase 4 wraps this same secp256k1 key behind Privy custody on funding.)
//
// The over-cap demo (Task 3.2) requests 50 USDC against the same endpoint by OVERRIDING the transfer
// amount in the selected requirements before the payload is built (the agent controls the amount; the
// facilitator's ENS cap is what refuses it), exactly as the resource-server note describes (R-11).
import 'dotenv/config';
import { PrivateKey, Client, AccountId, TransferTransaction } from '@hiero-ledger/sdk';
import { ExactHederaScheme, createClientHederaSigner } from '@x402/hedera';
import { x402Client } from '@x402/core/client';
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
  decodePaymentResponseHeader,
} from '@x402/core/http';
import type { PaymentRequired, PaymentRequirements, SettleResponse } from '@x402/core/types';

const HEDERA_NETWORK = 'hedera:testnet';

export interface PayArgs {
  endpoint: string; // resource server /premium URL
  agentName: string; // X-Leash-Agent (ENS record selector, untrusted)
  agentAccountId: string; // agent Hedera account (payer)
  agentKey: string; // agent ECDSA private key (DER or raw hex; the custody signer)
  amountRawOverride?: string; // optional: force a different transfer amount (over-cap demo)
}

export interface PayResult {
  status: number;
  ok: boolean;
  body: unknown;
  settle?: SettleResponse; // decoded X-PAYMENT-RESPONSE (on a 200)
  paymentB64?: string; // the exact X-PAYMENT header sent (for the replay test)
}

// Build an x402 client with the Hedera exact CLIENT scheme registered (the SDK-signing path).
function buildClient(agentAccountId: string, agentKey: string): x402Client {
  const key = PrivateKey.fromStringECDSA(agentKey);
  const signer = createClientHederaSigner(agentAccountId, key, { network: HEDERA_NETWORK });
  // Disable the client's built-in spend controls: LEASH enforcement is the FACILITATOR's ENS-declared
  // cap/allowlist (INVARIANTS #1/#7), not the client-side guard. The client guard also rejects our own
  // (non-default) HTS USDC by default, and it would mask the over-cap demo (the facilitator must be the
  // one that refuses OVER_CAP, not the agent's own SDK).
  return new x402Client().register(HEDERA_NETWORK, new ExactHederaScheme(signer)).setSpendControls(false);
}

// Select the Hedera exact requirement and optionally override its transfer amount (over-cap demo).
function selectRequirement(pr: PaymentRequired, amountRawOverride?: string): PaymentRequired {
  const hedera = pr.accepts.find((a: PaymentRequirements) => a.network === HEDERA_NETWORK && a.scheme === 'exact');
  if (!hedera) throw new Error('no hedera exact requirement in 402');
  const chosen: PaymentRequirements = amountRawOverride
    ? { ...hedera, amount: amountRawOverride }
    : hedera;
  return { ...pr, accepts: [chosen] };
}

// Perform the full pay flow; returns the second-request outcome plus the exact X-PAYMENT header
// (so the replay test can re-present the identical payload - INVARIANT #9).
export async function pay(args: PayArgs): Promise<PayResult> {
  const first = await fetch(args.endpoint, { headers: { 'X-Leash-Agent': args.agentName } });
  if (first.status !== 402) {
    return { status: first.status, ok: first.ok, body: await safeJson(first) };
  }

  const prHeader = first.headers.get('payment-required') ?? first.headers.get('www-authenticate');
  const paymentRequired = prHeader
    ? decodePaymentRequiredHeader(stripAuthScheme(prHeader))
    : ((await first.json()) as PaymentRequired);

  const client = buildClient(args.agentAccountId, args.agentKey);
  const selected = selectRequirement(paymentRequired, args.amountRawOverride);
  const payload = await client.createPaymentPayload(selected);
  const paymentB64 = encodePaymentSignatureHeader(payload);

  return submit(args, paymentB64);
}

// Second request: attach the X-PAYMENT header. Factored out so the replay test can re-submit the SAME
// header a second time without rebuilding (and thus re-signing) the transaction.
export async function submit(args: PayArgs, paymentB64: string): Promise<PayResult> {
  // x402 v2 reads the payment from the PAYMENT-SIGNATURE header (X-PAYMENT is the v1 name and is NOT read
  // by the v2 resource-server extractPayment). Send X-Leash-Agent too (the ENS record selector, DP-2).
  const res = await fetch(args.endpoint, {
    headers: { 'PAYMENT-SIGNATURE': paymentB64, 'X-Leash-Agent': args.agentName },
  });
  const respHeader = res.headers.get('x-payment-response') ?? res.headers.get('payment-response');
  let settle: SettleResponse | undefined;
  if (respHeader) {
    try {
      settle = decodePaymentResponseHeader(respHeader);
    } catch {
      settle = undefined;
    }
  }
  return { status: res.status, ok: res.ok, body: await safeJson(res), settle, paymentB64 };
}

// ============================ REFRAME [SKILL] S3 — agent-alone MISSING_COSIGN beat ============================
// (per REFRAME-SCOPE §4-S2, MISSING_COSIGN surfacing = option (a): an AGENT-SIDE client error.) This models
// the VM-3 "agent-alone can't spend" beat HONESTLY: the agent takes its own valid 1-of-2 signature on the
// KeyList spending account and submits it DIRECTLY to Hedera, bypassing LEASH entirely. Because the account
// is threshold-2 and only the agent's 1 signature is present, the network rejects it. The client detects the
// missing 2nd signature (an INVALID_SIGNATURE receipt / precheck) and NAMES the condition MISSING_COSIGN — a
// CLEAN named client-side condition, NOT a caught raw Hedera INVALID_SIGNATURE bubbled up untyped. It is NOT a
// GateReason (the pure gate never produces it — the gate passes in-cap; the missing co-sign is a submission
// condition on the agent's own bypass attempt), so authorize.ts's union is unchanged.
export type AgentAloneResult =
  | { settled: true; transactionId: string } // should NOT happen for a threshold-2 account
  | { settled: false; reason: 'MISSING_COSIGN'; detail: string };

export interface AgentAloneArgs {
  spendingAccountId: string; // the KeyList threshold-2 spending account ("0.0.N")
  agentKey: string;          // the agent's ECDSA private key (its 1-of-2 half; SR-1 — held by the agent)
  tokenId: string;           // HTS token id
  payToAccountId: string;    // recipient account id
  amountRaw: string;         // raw smallest-unit amount
}

// Submit an agent-signed-ONLY (1-of-2) transfer DIRECTLY to Hedera, bypassing LEASH's co-sign. Expected to be
// rejected for missing the 2nd signature -> MISSING_COSIGN. If it somehow settles, that is a co-ownership
// failure (F-031) and the caller MUST treat `settled:true` as a red flag.
export async function payAgentAloneDirect(args: AgentAloneArgs): Promise<AgentAloneResult> {
  const client = Client.forTestnet();
  // The agent pays its own gas here (no facilitator fee-payer on this bypass path); it is the operator+signer.
  const agentPriv = PrivateKey.fromStringECDSA(args.agentKey);
  client.setOperator(AccountId.fromString(args.spendingAccountId), agentPriv);
  try {
    const frozen = await new TransferTransaction()
      .addTokenTransfer(args.tokenId, AccountId.fromString(args.spendingAccountId), -BigInt(args.amountRaw))
      .addTokenTransfer(args.tokenId, AccountId.fromString(args.payToAccountId), BigInt(args.amountRaw))
      .freezeWith(client);
    const signed = await frozen.sign(agentPriv); // ONLY the agent's 1-of-2 — no LEASH co-signature.
    const resp = await signed.execute(client);
    const receipt = await resp.getReceipt(client);
    client.close();
    // If a threshold-2 account settles on 1 signature, the co-ownership model is broken. Report as settled.
    return { settled: true, transactionId: resp.transactionId!.toString() + ' (' + receipt.status.toString() + ')' };
  } catch (e) {
    client.close();
    const msg = e instanceof Error ? e.message : String(e);
    // The Hedera rejection for a missing threshold signature is INVALID_SIGNATURE (precheck or receipt).
    // Name it cleanly as MISSING_COSIGN rather than surfacing the raw error.
    return { settled: false, reason: 'MISSING_COSIGN', detail: msg };
  }
}

function stripAuthScheme(header: string): string {
  return header.replace(/^Payment\s+/i, '').trim();
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
