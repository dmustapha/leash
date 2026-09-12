// File: facilitator/hedera-scheme.ts
// [DEV-011 APPLIED] The ARCHITECTURE snapshot imported createHederaSignAndSubmitTransaction /
// createHederaVerifyPayerSignature / createHederaClient from '@x402/hedera/exact/facilitator' and passed
// them to `new ExactHederaScheme({ client, signAndSubmit, verifyPayerSignature })`. Verified against the
// pinned install (@x402/hedera 2.25): the helper factories are exported from the PACKAGE ROOT '@x402/hedera',
// and ExactHederaScheme's real constructor is `new ExactHederaScheme(signer: FacilitatorHederaSigner)`.
// The signer is assembled via toFacilitatorHederaSigner({...}) - the exact canonical pattern in the
// x402-foundation reference facilitator (e2e/facilitators/typescript/index.ts). Same package stack Blocky402
// wraps; this is the Blocky402-equivalent self-hosted facilitator (see server.ts E-1 note).
//
// verifyPayerSignature is called UNCONDITIONALLY by ExactHederaScheme.verify() (it cannot be silently
// skipped - see FacilitatorHederaSigner docs). This is what enforces INVARIANT #8's payer-signature binding
// at verify-time, BEFORE any settle. DP-4: the payer-sig gate ships out-of-the-box via the scheme.
//
// ============================ REFRAME [SKILL] S2 — NETWORK/ACCOUNT-TYPED SCHEME SELECTION ============================
// (per REFRAME-SCOPE §4-S2 + REF-1.) The single-key factories are REUSED VERBATIM for the /demo single-key
// path (byte-identical behavior; VM-2 stays green). For a co-signed /app account (KeyList threshold-2), the
// signer BRANCHES: it dual-signs operatorKey(fee) + LEASH_COSIGNER_KEY(authority) at submit, and accepts the
// agent's valid 1-of-2 signature at verify. The branch is chosen per PAYER account type (mirror-node key
// shape lookup) — NOT by mutating the single-key factories. The co-sign is emitted ONLY inside signAndSubmit,
// which the SDK reaches ONLY after the gate returns proceed (the SINGLE post-gate settle emit, INVARIANT #8).
// ====================================================================================================================
import {
  AccountId,
  Client,
  PrivateKey,
  Transaction,
  TransferTransaction,
  createHederaClient,
  createHederaSignAndSubmitTransaction,
  createHederaVerifyPayerSignature,
  createHederaPreflightTransfer,
  toFacilitatorHederaSigner,
} from '@x402/hedera';
// PublicKey is NOT re-exported from '@x402/hedera' (only Transaction/TransferTransaction/etc. are) — import
// the Hiero SDK class directly, matching the frozen provision-canonical.ts import convention.
import { PublicKey } from '@hiero-ledger/sdk';
import { ExactHederaScheme } from '@x402/hedera/exact/facilitator';
import { isKeyListAccount, assertCosignerDistinct } from './cosign';

// The CAIP-2 network this facilitator settles on.
export const HEDERA_NETWORK = 'hedera:testnet';

// ---- Co-sign emit spy (test-observable, INVARIANT #8 single-emit proof) ----
// A module-level counter incremented ONCE each time the co-sign path ACTUALLY adds LEASH's co-signature at
// submit. Tests assert "gate abort => 0 cosign calls" (the SDK never reaches signAndSubmit on an abort) and
// "one in-cap settle => exactly 1 cosign call". This is the single post-gate emit site made observable.
let _cosignCallCount = 0;
export function cosignCallCount(): number {
  return _cosignCallCount;
}
export function _resetCosignCallCount(): void {
  _cosignCallCount = 0;
}

// REF-3: assert LEASH_COSIGNER_KEY !== HEDERA_OPERATOR_KEY at module load (process start). Only enforced when
// a co-signer key is present (the /demo single-key floor does not require one) — the co-sign PATH cannot run
// without it, and if present it MUST differ from the gas key. A throw here fails the process start, by design.
if (process.env.LEASH_COSIGNER_KEY?.trim()) {
  assertCosignerDistinct();
}

// Build a fee-payer-configured SDK client for a given CAIP-2 network. The facilitator operator is the
// fee payer (gas-free for the agent: the agent only partially signs the transfer).
function buildClient(operatorId: string, operatorKey: PrivateKey): (network: string) => Client {
  return (network: string): Client => {
    // [DEV-015] createHederaClient's second arg is a CONSENSUS-NODE gRPC address (host:port), NOT an EVM
    // JSON-RPC URL. Passing HEDERA_EVM_RPC makes the SDK try to parse it as a node address and settle fails.
    const client = createHederaClient(network);
    client.setOperator(AccountId.fromString(operatorId), operatorKey);
    return client;
  };
}

// Parse the SENDER (payer) account id from a base64 TransferTransaction: the account with the NEGATIVE net
// token/HBAR movement. Used ONLY to route the signAndSubmit branch (single-key vs co-sign); a parse failure
// throws so the caller fails closed rather than mis-routing.
function payerFromTransfer(txBase64: string): string {
  const tx = Transaction.fromBytes(Buffer.from(txBase64, 'base64'));
  if (!(tx instanceof TransferTransaction)) {
    throw new Error('expected a TransferTransaction for co-sign routing');
  }
  const t = tx as TransferTransaction;
  // HBAR transfers.
  for (const [account, amount] of t.hbarTransfers) {
    if (amount.toTinybars().toNumber() < 0) return account.toString();
  }
  // HTS token transfers.
  for (const [, perAccount] of t.tokenTransfers) {
    for (const [account, amount] of perAccount) {
      if (amount.toNumber() < 0) return account.toString();
    }
  }
  throw new Error('no negative-net sender found in transfer (cannot route co-sign)');
}

// ---- The co-sign signAndSubmit: operator(fee) + LEASH_COSIGNER_KEY(authority), then execute + receipt. ----
// This is the SINGLE post-gate settle emit site (the SDK only calls signAndSubmit AFTER onBeforeSettle
// returns proceed). The agent's 1-of-2 is ALREADY embedded in txBase64 (the client signed it). Adding
// operator + cosigner completes the threshold-2; the network enforces the real threshold at submit.
function cosignSignAndSubmit(
  build: (network: string) => Client,
  operatorKey: PrivateKey,
  cosignerKey: PrivateKey,
): (txBase64: string, feePayer: string, network: string) => Promise<{ transactionId: string }> {
  return async (txBase64, _feePayer, network) => {
    const tx = Transaction.fromBytes(Buffer.from(txBase64, 'base64'));
    if (!(tx instanceof TransferTransaction)) {
      throw new Error('cosign path expects a TransferTransaction');
    }
    // operator adds the fee-payer sig, LEASH_COSIGNER_KEY adds the authority sig (the 2nd of the 2-of-2).
    const signed = await (await tx.sign(operatorKey)).sign(cosignerKey);
    _cosignCallCount += 1; // observable: the co-signature was actually applied (post-gate single emit).
    const client = build(network);
    const resp = await signed.execute(client);
    await resp.getReceipt(client); // throws on any non-SUCCESS (e.g. INVALID_SIGNATURE) -> scheme fails closed.
    return { transactionId: resp.transactionId!.toString() };
  };
}

// ---- The co-sign verifyPayerSignature: accept the agent's valid 1-of-2 at verify. ----
// createHederaVerifyPayerSignature fetches the payer account key and, for a KeyList, requires the FULL
// threshold — so it REJECTS a 1-of-2. For a co-signed account we instead confirm a KNOWN MEMBER (the agent's
// public key, COSIGN_AGENT_PUB) signed the tx; the Hedera NETWORK enforces the full threshold at submit.
function cosignVerifyPayerSignature(): (params: {
  payer: string;
  transaction: string;
  network: string;
}) => Promise<{ ok: boolean; reason?: string; message?: string }> {
  return async ({ transaction }) => {
    const agentPubRaw = process.env.COSIGN_AGENT_PUB?.trim();
    if (!agentPubRaw) {
      return { ok: false, reason: 'signature_invalid', message: 'no known agent public key configured' };
    }
    try {
      const tx = Transaction.fromBytes(Buffer.from(transaction, 'base64'));
      const agentPub = PublicKey.fromString(agentPubRaw);
      const signed = agentPub.verifyTransaction(tx); // true iff the agent key (a known KeyList member) signed.
      return signed
        ? { ok: true }
        : { ok: false, reason: 'signature_invalid', message: 'agent 1-of-2 signature not present' };
    } catch (e) {
      return { ok: false, reason: 'signature_invalid', message: e instanceof Error ? e.message : 'verify error' };
    }
  };
}

// Assemble the network/account-typed signer. It BRANCHES per payer account type: a single-key account uses
// the ORIGINAL factories UNCHANGED (byte-identical /demo path); a KeyList account uses the co-sign path.
// Detection uses a mirror-node account-key lookup (isKeyListAccount) — a THROW there fails closed.
function typedSigner(
  operatorId: string,
  operatorKey: PrivateKey,
  build: (network: string) => Client,
): ReturnType<typeof toFacilitatorHederaSigner> {
  // Original single-key implementations — REUSED VERBATIM (REF-1: never mutated).
  const singleSignAndSubmit = createHederaSignAndSubmitTransaction(build, operatorKey);
  const singleVerify = createHederaVerifyPayerSignature();

  // Co-sign implementations are built lazily (only if a cosigner key exists).
  const cosignerRaw = process.env.LEASH_COSIGNER_KEY?.trim();
  const cosignerKey = cosignerRaw ? PrivateKey.fromStringECDSA(cosignerRaw) : null;
  const coSignAndSubmit = cosignerKey ? cosignSignAndSubmit(build, operatorKey, cosignerKey) : null;
  const coVerify = cosignVerifyPayerSignature();

  return toFacilitatorHederaSigner({
    getAddresses: () => [operatorId],

    // SELECT signAndSubmit per payer account type. The payer is parsed from the transfer bytes.
    signAndSubmitTransaction: async (txBase64: string, feePayer: string, network: string) => {
      const payer = payerFromTransfer(txBase64);
      const keyList = await isKeyListAccount(payer, network); // throws -> fail closed
      if (keyList) {
        if (!coSignAndSubmit) {
          throw new Error('co-sign path selected but LEASH_COSIGNER_KEY is not set');
        }
        return coSignAndSubmit(txBase64, feePayer, network);
      }
      return singleSignAndSubmit(txBase64, feePayer, network); // UNCHANGED /demo path.
    },

    // SELECT verifyPayerSignature per payer account type. `payer` is provided directly by the scheme.
    verifyPayerSignature: async (params: { payer: string; transaction: string; network: string }) => {
      const keyList = await isKeyListAccount(params.payer, params.network); // throws -> fail closed
      return keyList ? coVerify(params) : singleVerify(params); // UNCHANGED /demo verify on single-key.
    },

    // Pre-settlement balance / association check - called unconditionally by verify(). Unchanged for both.
    preflightTransfer: createHederaPreflightTransfer(),
  });
}

// The single Hedera scheme wired into the x402Facilitator. Operator credentials come from .env.
export function hederaScheme(): ExactHederaScheme {
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
  const build = buildClient(operatorId, operatorKey);
  return new ExactHederaScheme(typedSigner(operatorId, operatorKey, build));
}
