// File: scripts/hedera/proto-cosign-gate.ts
// [REFRAME S-GATE — proto-VM3, structural on-chain proof of the 2-of-2 co-sign model]
// Isolates the REF-1 question (does adding LEASH's co-signature to an agent-signed transfer settle a
// KeyList threshold-2 account, and are the single-signer attempts rejected?) from the ENS/facilitator/
// resource stack. This is the go/no-go safety gate: if beat 1 cannot settle live, FALL BACK to the
// single-key governed-account spending model (per REFRAME-SCOPE S-GATE / REF-9).
//
// Fee-payer = operator (gas-free for the agent). The KeyList threshold-2 (agent + cosigner) authorizes the
// DEBIT; operator only pays the transaction fee (operator is NOT a KeyList member).
//   Beat 1 (co-signed)      : operator(fee) + agent + cosigner  -> SUCCESS  (F-030 happy path)
//   Beat 2 (agent-alone)    : operator(fee) + agent             -> REJECTED (F-030: agent can't spend alone)
//   Beat 3 (LEASH-alone)    : operator(fee) + cosigner          -> REJECTED (F-031/SR-1: LEASH can't move funds)
// Beats 4 (over-cap -> 0 cosign) and 5 (revoke -> fail-closed) are gate-level and are proven by the full
// facilitator-integrated agent/vm3.live.ts in Group V; this proto proves the on-chain co-sign PRIMITIVE.
import 'dotenv/config';
import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  Status,
} from '@hiero-ledger/sdk';

const USDC = process.env.USDC_TOKEN_ID!;
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;
const OPERATOR_KEY = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
const COSIGNER_KEY = PrivateKey.fromStringECDSA(process.env.LEASH_COSIGNER_KEY!);
const AGENT_KEY = PrivateKey.fromStringECDSA(process.env.COSIGN_AGENT_KEY!);
const SPENDING = process.env.COSIGN_SPENDING_ACCOUNT!;
const RECEIVER = process.env.RECEIVER_ACCOUNT_ID!;
const AMT = 1_000_000n; // 1 USDC (6 decimals)

function newClient(): Client {
  const c = Client.forTestnet();
  c.setOperator(AccountId.fromString(OPERATOR_ID), OPERATOR_KEY); // operator = fee-payer (auto-signs on execute)
  return c;
}

function transfer(client: Client): TransferTransaction {
  return new TransferTransaction()
    .addTokenTransfer(USDC, AccountId.fromString(SPENDING), -AMT)
    .addTokenTransfer(USDC, AccountId.fromString(RECEIVER), AMT)
    .freezeWith(client);
}

// Returns { settled, status } — settled=true only on a SUCCESS receipt; a rejected sig is settled=false.
async function attempt(label: string, sign: (t: TransferTransaction) => Promise<TransferTransaction>) {
  const client = newClient();
  try {
    const tx = transfer(client);
    const signed = await sign(tx);
    const resp = await signed.execute(client); // client adds operator (fee-payer) sig automatically
    const receipt = await resp.getReceipt(client);
    client.close();
    return { label, settled: receipt.status === Status.Success, status: receipt.status.toString(), tx: resp.transactionId!.toString() };
  } catch (e) {
    client.close();
    const msg = e instanceof Error ? e.message : String(e);
    return { label, settled: false, status: msg.split('\n')[0], tx: null };
  }
}

async function main() {
  console.log(`proto-cosign-gate: KeyList acct ${SPENDING} -> ${RECEIVER}, ${AMT} raw USDC, fee-payer ${OPERATOR_ID}\n`);

  // Beat 1: co-signed (agent + cosigner) -> SUCCESS
  const b1 = await attempt('BEAT-1 co-signed (agent+cosigner)', async (t) => (await t.sign(AGENT_KEY)).sign(COSIGNER_KEY));
  console.log(`${b1.settled ? '✅' : '❌'} ${b1.label}: settled=${b1.settled} status=${b1.status}${b1.tx ? ' tx=' + b1.tx : ''}`);

  // Beat 2: agent-alone (no LEASH) -> REJECTED
  const b2 = await attempt('BEAT-2 agent-alone (1-of-2)', async (t) => t.sign(AGENT_KEY));
  console.log(`${!b2.settled ? '✅' : '❌'} ${b2.label}: settled=${b2.settled} (expect false) status=${b2.status}`);

  // Beat 3: LEASH-alone (operator fee-payer + cosigner, NO agent) -> REJECTED (SR-1 / F-031)
  const b3 = await attempt('BEAT-3 LEASH-alone (operator+cosigner, no agent)', async (t) => t.sign(COSIGNER_KEY));
  console.log(`${!b3.settled ? '✅' : '❌'} ${b3.label}: settled=${b3.settled} (expect false) status=${b3.status}`);

  const pass = b1.settled && !b2.settled && !b3.settled;
  console.log(`\n${pass ? '✅ S-GATE PROTO PASS — 2-of-2 co-sign model proven on-chain (proceed with co-sign)' : '❌ S-GATE PROTO FAIL — fall back to single-key governed-account (REF-9)'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error('proto-gate crashed:', e); process.exit(2); });
