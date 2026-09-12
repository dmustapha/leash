// File: agent/vm3.live.ts
// [REFRAME Group V — V3, the reframe HERO live milestone] Live-tier test (TEST_TIER=live). Drives the FULL
// govern-existing-agents hero chain against the CO-SIGNED /app agent (KeyList threshold-2 spending account
// COSIGN_SPENDING_ACCOUNT=0.0.10508343, ENS vm3cosign.acme.leash.eth, cap 5 USDC, receiver 0.0.10497604) so
// ENS (the leash) + the 2-of-2 Hedera co-sign + dynamic limits all bite the SAME external agent. It is the
// live proof that LEASH is the spend-control plane for an agent that already exists (external key + identity),
// NOT an agent minter. Honest framing (REFRAME §0): control = TRUE (LEASH co-sign veto + caps + revoke),
// trustlessness = FALSE (the cap is LEASH's decision to co-sign, not chain-enforced — same facilitator-trust
// boundary as /demo, INVARIANT #4).
//
// BEATS (each an `it(...)`, real; asserted honestly):
//   1) CO-SIGN SETTLE  - pay() in-cap (3 USDC) through the facilitator on the co-signed account -> 200 + a real
//                        on-chain settle tx id. The facilitator's co-sign path dual-signs operator(fee) +
//                        LEASH_COSIGNER_KEY(authority) at settle; the agent already signed its 1-of-2. Asserts
//                        settle.success, payer == the spending account, and the settle tx SUCCEEDS on the mirror.
//   2) AGENT-ALONE     - payAgentAloneDirect(): the agent submits its own valid 1-of-2 DIRECTLY to Hedera,
//                        bypassing LEASH -> { settled:false, reason:'MISSING_COSIGN' } (F-030: agent can't spend
//                        alone; the threshold-2 network rejects the missing 2nd signature).
//   3) OPERATOR/LEASH-ALONE - a transfer FROM the spending account signed by operator(fee) + LEASH_COSIGNER_KEY
//                        only (NO agent) submitted directly -> rejected (INVALID_SIGNATURE), not settled
//                        (F-031/SR-1: LEASH cannot move the agent's funds without the agent). Reuses the
//                        proto-cosign-gate BEAT-3 pattern.
//   4) OVER-CAP REFUSE - pay() with amountRawOverride (50 USDC) > maxPerCall -> facilitator refuses OVER_CAP,
//                        no settle; the co-sign is NOT emitted (the gate aborts before the single settle site).
//   5) OVER-DAILY REFUSE - set leash.policy.dailyCap below the rolling ALLOW total the beat-1 settle seeded on
//                        the HCS topic; drive one more in-cap pay -> OVER_DAILY_CAP, no settle. Polls the mirror
//                        (HCS -> mirror lag is real) until the beat-1 ALLOW is indexed before driving the pay.
//   6) OUTSIDE-WINDOW REFUSE - set leash.policy.allowedWindows to a range EXCLUDING the current CONSENSUS
//                        minute-of-day, drive a pay -> OUTSIDE_WINDOW, no settle.
//   7) MIRROR-DOWN => RPC_ERROR - the true cross-process outage is not cleanly injectable live (spend-rollup's
//                        mirror base is a hardcoded const with NO env override — faking it would be dishonest).
//                        This beat is proven at the INTEGRATION/UNIT tier instead: facilitator/spend-rollup.test.ts
//                        (a non-ok mirror response THROWS -> RPC_ERROR upstream) + facilitator/spend-rollup.integration.ts
//                        (a transport-refused fetch THROWS and propagates), and server.ts::enrichForDynamicLimits
//                        maps that throw to { abort:true, reason:'RPC_ERROR' }. See the BEAT-7 `it.skip` below for
//                        the provenance pointer — it is NEVER a fabricated live outage-pass.
//   8) REVOKE => FAIL-CLOSED - clearPolicy(vm3cosign) on Sepolia (one tx) -> next in-cap pay fails closed
//                        (REVOKED, no settle); a direct facilitator /settle probe asserts reason REVOKED.
//   RESTORE - rebind the base hero policy so the co-signed sandbox stays in a working state; readPolicy bound.
//
// REAL ONLY: real Hedera co-signed settles on testnet, real direct-submit rejections, a real Sepolia revoke +
// rebind. No mocks, no phantom facade, no fabricated tx/receipt/reason (INVARIANTS #2/#5/#6). The FROZEN floor
// is untouched: this test drives ONLY vm3cosign.acme.leash.eth (a NET-NEW co-signed name), never the /demo hero
// name (data.acme.leash.eth), /api/demo, provision-canonical.ts, ensureCanonicalAgent, or VM-1/VM-2.
//
// SERVERS: like vm2.live.ts, this test SPAWNS the facilitator (:8401) and resource server (:8402) via
// child_process and tears them down in afterAll, so the co-sign SPEND/REFUSE beats hit the live rails.
//
// Excluded from the default unit gate (live tier). Run with: npm run test:live -- vm3
import 'dotenv/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  Status,
} from '@hiero-ledger/sdk';
import type { PaymentRequirements, SettleResponse } from '@x402/core/types';
import { ExactHederaScheme, createClientHederaSigner } from '@x402/hedera';
import { x402Client } from '@x402/core/client';
import { decodePaymentRequiredHeader } from '@x402/core/http';
import type { PaymentRequired } from '@x402/core/types';
import { setPolicy, readPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import { relay } from '../relayer/relay';
import { pay, payAgentAloneDirect } from './pay';
import { mirrorConsensusNow, rollingTotals } from '../facilitator/spend-rollup';
import type { AgentPolicy, TimeWindow } from '../types';

const NET = 'hedera:testnet';
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? 'http://localhost:8401';
const RESOURCE_PORT = process.env.RESOURCE_PORT ?? '8402';
const ENDPOINT = `http://localhost:${RESOURCE_PORT}/premium`;
const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

// The CO-SIGNED /app agent — the ONE KeyList threshold-2 account ENS + 2-of-2 co-sign + dynamic limits bite.
const ORG = process.env.SANDBOX_ORG_NAME!;               // acme.leash.eth
const COSIGN_LABEL = 'vm3cosign';
const COSIGN_NAME = `${COSIGN_LABEL}.${ORG}`;             // vm3cosign.acme.leash.eth (NET-NEW; NOT the /demo hero)
const REGISTRY = process.env.SANDBOX_REGISTRY as `0x${string}`;
const SPENDING_ACCOUNT = process.env.COSIGN_SPENDING_ACCOUNT!; // 0.0.10508343 (KeyList threshold-2)
const AGENT_KEY = process.env.COSIGN_AGENT_KEY!;              // agent's 1-of-2 ECDSA priv (SR-1, external-scoped)
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!;         // fee-payer
const OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY!;
const COSIGNER_KEY = process.env.LEASH_COSIGNER_KEY!;       // LEASH's co-sign authority half of the 2-of-2
const RECEIVER = process.env.RECEIVER_ACCOUNT_ID!;
const USDC = process.env.USDC_TOKEN_ID!;
const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID!;

// The base hero policy (cap 5 USDC; endpoint price is 3 USDC so in-cap pays settle). Beats 5/6 clone this and
// add a dynamic limit; RESTORE writes this back so the co-signed sandbox stays working.
const BASE_POLICY: AgentPolicy = {
  maxPerCall: '5000000', // 5 USDC cap
  allowedPayees: [RECEIVER],
  hederaAccount: SPENDING_ACCOUNT,
  token: USDC,
};

// ---- server lifecycle (spawn the live rails so the co-sign SPEND/REFUSE beats hit them for real) ----
const children: ChildProcess[] = [];

function spawnService(entry: string): ChildProcess {
  const child = spawn('npx', ['tsx', '--env-file=.env', entry], {
    cwd: process.cwd(),
    stdio: ['ignore', 'inherit', 'inherit'],
    env: process.env,
  });
  children.push(child);
  return child;
}

async function waitForHttp(url: string, expectStatus: (s: number) => boolean, timeoutMs = 45_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (expectStatus(res.status)) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`service at ${url} did not become ready within ${timeoutMs}ms`);
}

// ---- direct facilitator /settle probe: read the authoritative abort reason (OVER_CAP / OVER_DAILY_CAP /
// OUTSIDE_WINDOW / REVOKED) for the co-signed agent. Mirrors vm2.live.ts's settleReason, but builds the agent's
// 1-of-2 payload on the KeyList spending account. `amountRawOverride` forces a different transfer (over-cap). ----
async function settleReason(amountRawOverride?: string): Promise<string | undefined> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': COSIGN_NAME } });
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const base = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const chosen: PaymentRequirements = amountRawOverride ? { ...base, amount: amountRawOverride } : base;
  const key = PrivateKey.fromStringECDSA(AGENT_KEY);
  const signer = createClientHederaSigner(SPENDING_ACCOUNT, key, { network: NET });
  const client = new x402Client().register(NET, new ExactHederaScheme(signer)).setSpendControls(false);
  const payload = await client.createPaymentPayload({ ...pr, accepts: [chosen] } as PaymentRequired);
  const res = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-leash-agent': COSIGN_NAME },
    body: JSON.stringify({ paymentPayload: payload, paymentRequirements: chosen }),
  });
  const body = (await res.json()) as SettleResponse;
  return body.errorReason;
}

// ---- co-signed settle proof: confirm the settle tx SUCCEEDED on the mirror (the co-sign completed the 2-of-2). ----
function mirrorTxUrl(settleTxId: string): string {
  const m = settleTxId.match(/^(\d+\.\d+\.\d+)@(\d+)\.(\d+)$/);
  if (!m) throw new Error(`unexpected settle tx id shape: ${settleTxId}`);
  return `${MIRROR_NODE}/transactions/${m[1]}-${m[2]}-${m[3]}`;
}

interface MirrorTx {
  transactions?: Array<{ result: string; token_transfers?: Array<{ token_id: string; account: string; amount: number }> }>;
}

// Poll the mirror for the settle tx and assert it is SUCCESS with the token DEBIT against the spending account.
async function proveSettledOnChain(settleTxId: string): Promise<{ debitFromSpending: number }> {
  const url = mirrorTxUrl(settleTxId);
  const deadline = Date.now() + 60_000;
  let delay = 2_000;
  while (Date.now() < deadline) {
    const r = await fetch(url);
    if (r.ok) {
      const body = (await r.json()) as MirrorTx;
      const tx = body.transactions?.[0];
      if (tx && tx.result === 'SUCCESS') {
        const debit = (tx.token_transfers ?? [])
          .filter((t) => t.token_id === USDC && t.account === SPENDING_ACCOUNT)
          .reduce((s, t) => s + t.amount, 0);
        return { debitFromSpending: debit };
      }
    }
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  throw new Error(`co-signed settle tx ${settleTxId} did not appear as SUCCESS on the mirror within 60s`);
}

// ---- BEAT-3 helper (operator/LEASH-alone): build a transfer FROM the spending account, fee-payer=operator,
// signed by LEASH_COSIGNER_KEY ONLY (no agent), submit directly. The threshold-2 network rejects it
// (INVALID_SIGNATURE): LEASH cannot move the agent's funds without the agent (F-031/SR-1). Reuses the exact
// proto-cosign-gate BEAT-3 pattern. Returns settled=false with the raw status on a rejection. ----
async function operatorLeashAloneDirect(amountRaw: bigint): Promise<{ settled: boolean; status: string }> {
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(OPERATOR_ID), PrivateKey.fromStringECDSA(OPERATOR_KEY)); // fee-payer
  const cosigner = PrivateKey.fromStringECDSA(COSIGNER_KEY);
  try {
    const tx = new TransferTransaction()
      .addTokenTransfer(USDC, AccountId.fromString(SPENDING_ACCOUNT), -amountRaw)
      .addTokenTransfer(USDC, AccountId.fromString(RECEIVER), amountRaw)
      .freezeWith(client);
    const signed = await tx.sign(cosigner); // operator(fee) auto-signs on execute; NO agent signature.
    const resp = await signed.execute(client);
    const receipt = await resp.getReceipt(client);
    client.close();
    return { settled: receipt.status === Status.Success, status: receipt.status.toString() };
  } catch (e) {
    client.close();
    return { settled: false, status: (e instanceof Error ? e.message : String(e)).split('\n')[0] };
  }
}

// Poll rolling ALLOW totals until the mirror has indexed at least `atLeastRaw` for the co-signed agent (the
// HCS -> mirror lag is real). Returns the observed daily total once the threshold is met, or throws on timeout.
async function waitForRollingDaily(atLeastRaw: bigint, timeoutMs = 90_000): Promise<bigint> {
  const deadline = Date.now() + timeoutMs;
  const nowSeconds = Math.floor(Date.now() / 1000);
  while (Date.now() < deadline) {
    const { dailyRaw } = await rollingTotals(COSIGN_NAME, HCS_TOPIC_ID, {
      dailyFromSeconds: nowSeconds - 86_400,
      weeklyFromSeconds: nowSeconds - 604_800,
    });
    if (dailyRaw >= atLeastRaw) return dailyRaw;
    await new Promise((r) => setTimeout(r, 5_000));
  }
  throw new Error(`rolling daily total for ${COSIGN_NAME} did not reach ${atLeastRaw} within ${timeoutMs}ms`);
}

describe('VM-3 reframe hero (live: co-signed settle -> agent-alone DENY -> LEASH-alone DENY -> over-cap/daily/window refuse -> revoke fail-closed)', () => {
  beforeAll(async () => {
    const required = [
      'SANDBOX_ORG_NAME', 'SANDBOX_REGISTRY', 'COSIGN_SPENDING_ACCOUNT', 'COSIGN_AGENT_KEY', 'COSIGN_AGENT_PUB',
      'LEASH_COSIGNER_KEY', 'HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY', 'USDC_TOKEN_ID',
      'RECEIVER_ACCOUNT_ID', 'HCS_TOPIC_ID',
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`missing env for VM-3 live hero: ${missing.join(', ')}`);

    // SETUP (direct — no Privy-authed API, mirroring vm2): ensure the NET-NEW co-signed test name exists and
    // its leash.policy binds the co-signed spending account. Mint the name if it is not yet registered (owner =
    // deployer so the sponsor key can write its resolver + policy), then bind the base hero policy. Idempotent:
    // readPolicy short-circuits the rebind when already bound. This NEVER touches the /demo hero name.
    const bound = await readPolicy(COSIGN_NAME);
    if (!bound || bound.hederaAccount !== SPENDING_ACCOUNT) {
      // eslint-disable-next-line no-console
      console.log(`[VM-3 SETUP] ${COSIGN_NAME} not bound (or stale) — minting (if needed) + binding the co-signed policy`);
      const deployer = process.env.LEASH_DEPLOYER_ADDRESS as `0x${string}`;
      const expires = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600);
      try {
        await relay(ORG, { kind: 'mint', registry: REGISTRY, label: COSIGN_LABEL, agentAddress: deployer, expires });
      } catch (e) {
        // Already minted (register reverts on an existing label) — proceed to setPolicy.
        // eslint-disable-next-line no-console
        console.log('[VM-3 SETUP] mint skipped (likely already registered):', (e as Error).message.split('\n')[0]);
      }
      await setPolicy(COSIGN_NAME, BASE_POLICY, REGISTRY, COSIGN_LABEL);
    }

    // Spawn the live rails (facilitator first, then resource server which syncs feePayer from it on start).
    spawnService('facilitator/server.ts');
    await waitForHttp(`${FACILITATOR_URL}/supported`, (s) => s === 200 || s === 404, 45_000);
    spawnService('resource-server/server.ts');
    await waitForHttp(ENDPOINT, (s) => s === 402, 45_000);
  }, 300_000);

  afterAll(async () => {
    // RESTORE: rebind the base hero policy so the co-signed sandbox survives in a working state (mirror vm2's
    // RESTORE discipline). Best-effort; then tear down the spawned rails.
    try {
      await setPolicy(COSIGN_NAME, BASE_POLICY, REGISTRY, COSIGN_LABEL);
      const p = await readPolicy(COSIGN_NAME);
      // eslint-disable-next-line no-console
      console.log('[VM-3 RESTORE] co-signed hero policy rebound:', JSON.stringify(p));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[VM-3 RESTORE] policy rebind failed (non-fatal to teardown):', (e as Error).message);
    }
    for (const c of children) {
      try {
        c.kill('SIGTERM');
      } catch {
        // best-effort teardown
      }
    }
  }, 120_000);

  it('BEAT-1 CO-SIGN SETTLE: in-cap 3 USDC settles on the co-signed account (200 + real on-chain settle tx)', async () => {
    const out = await pay({
      endpoint: ENDPOINT,
      agentName: COSIGN_NAME,
      agentAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
    });
    expect(out.status).toBe(200);
    expect(out.settle?.success).toBe(true);
    expect(out.settle?.payer).toBe(SPENDING_ACCOUNT); // INVARIANT #8: payer == the co-signed spending account
    const txId = out.settle?.transaction!;
    // The settle tx id's account is the fee-payer (operator) — the facilitator dual-signed operator(fee) +
    // LEASH_COSIGNER_KEY(authority) on top of the agent's 1-of-2 (the single post-gate co-sign emit).
    expect(txId).toContain(OPERATOR_ID);
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-1] co-signed settle tx:', txId, 'payer:', out.settle?.payer);

    // AUTHORITATIVE on-chain proof: the settle tx is SUCCESS on the mirror with the token debit from the
    // spending account (the 2-of-2 completed). If only 1 signature reached the network, this tx would NOT exist.
    const proof = await proveSettledOnChain(txId);
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-1] mirror settle proof:', JSON.stringify(proof));
    expect(proof.debitFromSpending).toBe(-3_000_000); // 3 USDC debited from the co-signed account
  }, 240_000);

  it('BEAT-2 AGENT-ALONE: the agent submits its own 1-of-2 directly (bypassing LEASH) and CANNOT spend (MISSING_COSIGN)', async () => {
    const res = await payAgentAloneDirect({
      spendingAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
      tokenId: USDC,
      payToAccountId: RECEIVER,
      amountRaw: '1000000', // 1 USDC — the amount is irrelevant; the missing co-sign is what rejects it.
    });
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-2] agent-alone direct submit:', JSON.stringify(res));
    expect(res.settled).toBe(false); // a threshold-2 account with only the agent's 1-of-2 does NOT settle
    expect((res as { reason?: string }).reason).toBe('MISSING_COSIGN');
  }, 120_000);

  it('BEAT-3 OPERATOR/LEASH-ALONE: operator(fee) + LEASH_COSIGNER_KEY only (NO agent) CANNOT move the funds (F-031/SR-1)', async () => {
    const res = await operatorLeashAloneDirect(1_000_000n); // 1 USDC attempt, LEASH-only signatures.
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-3] operator+LEASH-alone direct submit:', JSON.stringify(res));
    expect(res.settled).toBe(false); // LEASH alone cannot complete the 2-of-2 -> INVALID_SIGNATURE, no settle
    expect(res.status).toMatch(/INVALID_SIGNATURE/i);
  }, 120_000);

  it('BEAT-4 OVER-CAP REFUSE: over-cap 50 USDC is refused at the rail (OVER_CAP, no settle, co-sign not emitted)', async () => {
    const out = await pay({
      endpoint: ENDPOINT,
      agentName: COSIGN_NAME,
      agentAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
      amountRawOverride: '50000000', // 50 USDC > 5 USDC maxPerCall
    });
    expect(out.status).toBe(402);
    expect(out.settle?.success).not.toBe(true); // no successful settle
    // The authoritative facilitator reason (proves the gate aborted BEFORE the single post-gate co-sign site).
    const reason = await settleReason('50000000');
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-4] over-cap settle-layer reason:', reason);
    expect(reason).toBe('OVER_CAP');
  }, 120_000);

  it('BEAT-5 OVER-DAILY REFUSE: dailyCap below the rolling ALLOW total -> next in-cap pay refuses (OVER_DAILY_CAP, no settle)', async () => {
    // The beat-1 settle wrote an ALLOW (3 USDC) to the HCS topic. Wait for the mirror to index it (real lag),
    // then set a dailyCap so rollingDaily(>=3) + this pay(3) exceeds it. dailyCap=4 USDC: 3 (rolling) + 3 > 4.
    const observed = await waitForRollingDaily(3_000_000n);
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-5] rolling daily total indexed on mirror:', observed.toString());

    await setPolicy(COSIGN_NAME, { ...BASE_POLICY, dailyCap: '4000000' }, REGISTRY, COSIGN_LABEL); // 4 USDC soft daily

    const out = await pay({
      endpoint: ENDPOINT,
      agentName: COSIGN_NAME,
      agentAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
    });
    expect(out.status).not.toBe(200);
    expect(out.settle?.success).not.toBe(true);
    const reason = await settleReason();
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-5] over-daily settle-layer reason:', reason);
    expect(reason).toBe('OVER_DAILY_CAP');
  }, 240_000);

  it('BEAT-6 OUTSIDE-WINDOW REFUSE: allowedWindows excluding the current consensus minute -> refuse (OUTSIDE_WINDOW, no settle)', async () => {
    // Read the CURRENT consensus minute-of-day (the settle-time clock is the mirror consensus clock, not the
    // host clock — INVARIANT #3 addendum). Build a 1-minute window that DOES NOT contain it.
    const { minuteUtc } = await mirrorConsensusNow(HCS_TOPIC_ID);
    // A window 120 minutes away, clamped to [0,1439], 1 minute wide — guaranteed to exclude `minuteUtc`.
    const start = (minuteUtc + 120) % 1440;
    const excludingWindow: TimeWindow = { startMinuteUtc: start, endMinuteUtc: start + 1 };
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-6] consensus minute-of-day:', minuteUtc, 'excluding window:', JSON.stringify(excludingWindow));

    await setPolicy(COSIGN_NAME, { ...BASE_POLICY, allowedWindows: [excludingWindow] }, REGISTRY, COSIGN_LABEL);

    const out = await pay({
      endpoint: ENDPOINT,
      agentName: COSIGN_NAME,
      agentAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
    });
    expect(out.status).not.toBe(200);
    expect(out.settle?.success).not.toBe(true);
    const reason = await settleReason();
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-6] outside-window settle-layer reason:', reason);
    expect(reason).toBe('OUTSIDE_WINDOW');
  }, 180_000);

  // BEAT-7 MIRROR-DOWN => RPC_ERROR — proven at the UNIT/INTEGRATION tier, NOT faked live. The spend-rollup
  // mirror base is a hardcoded const (no env override), so there is NO honest live injection point here.
  // Provenance: facilitator/spend-rollup.test.ts asserts a non-ok mirror response makes rollingTotals /
  // mirrorConsensusNow THROW (never a default-0 / host-clock un-cap); facilitator/spend-rollup.integration.ts
  // asserts a transport-refused fetch also throws and propagates; server.ts::enrichForDynamicLimits maps that
  // throw to { abort:true, reason:'RPC_ERROR' } (fail-closed). Skipped here (not fabricated) — see the header.
  it.skip('BEAT-7 MIRROR-DOWN => RPC_ERROR (proven at unit/integration tier — spend-rollup.test.ts + spend-rollup.integration.ts; NOT faked live)', () => {
    expect(true).toBe(true);
  });

  it('BEAT-8 REVOKE => FAIL-CLOSED: clearPolicy on Sepolia, next in-cap pay does NOT settle (REVOKED)', async () => {
    const revokeTx = await clearPolicy(COSIGN_NAME);
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-8] Sepolia clearPolicy tx:', revokeTx);
    expect(revokeTx).toMatch(/^0x[0-9a-f]{64}$/i);

    // FAIL-CLOSED: after the on-chain revoke the leash.policy record is empty -> the authoritative no-cache
    // onBeforeSettle read returns REVOKED and aborts. NOT 200, NO successful settle.
    const out = await pay({
      endpoint: ENDPOINT,
      agentName: COSIGN_NAME,
      agentAccountId: SPENDING_ACCOUNT,
      agentKey: AGENT_KEY,
    });
    expect(out.status).not.toBe(200);
    expect(out.settle?.success).not.toBe(true);
    const reason = await settleReason();
    // eslint-disable-next-line no-console
    console.log('[VM-3 BEAT-8] post-revoke settle-layer reason:', reason);
    expect(reason).toBe('REVOKED');
    // afterAll RESTORE rebinds BASE_POLICY so the co-signed sandbox stays working.
  }, 180_000);
});
