// File: agent/vm2.live.ts
// [VM-2 - the mandatory THREE-PRIZE hero milestone] Live-tier test (TEST_TIER=live). Drives the FULL
// three-prize hero chain against the DATA agent (canonical Hedera 0.0.10499595, ENS data.acme.leash.eth,
// cap 5 USDC, receiver 0.0.10497604) on ONE account, so ENS + Hedera + Privy all bite the SAME agent:
//   1) GRANT   - assert data.acme.leash.eth's leash.policy is bound (readPolicy); rebind if a prior revoke
//                left it clear, so the milestone is deterministic.
//   2) SPEND   - Hedera prize: agent pays 3 USDC in-cap via the live rail -> real gas-free settle; assert
//                settle.success, settle.payer == 0.0.10499595, and (via the mirror node) the AGENT paid 0
//                HBAR gas while the fee-payer (operator 0.0.10487802) paid the fee.
//   3) REFUSE  - rail: agent pays 50 USDC over-cap -> facilitator refuses OVER_CAP, no successful settle.
//   4) DENY    - Privy prize: treasury over-funds the agent above fundingCap on the REAL USDC token
//                (0.0.10496489) -> { denied:true, reason:'FUNDING_DENIED' } BEFORE broadcast (no phantom token).
//   5) REVOKE  - ENS prize, fail-closed: clearPolicy(data) on Sepolia (one tx) -> re-run the in-cap 3 USDC
//                pay -> fails closed (REVOKED, no settle); a direct facilitator probe asserts reason REVOKED.
//   6) RESTORE - setPolicy(data) to rebind the hero policy so /demo + the seed stay in the working state;
//                readPolicy(data) is asserted bound again at the end.
//
// REAL ONLY: a real Hedera settle on testnet, a real Sepolia revoke + rebind, a real Privy policy DENY on
// the real USDC token. No mocks, no phantom facade, no fabricated tx/receipt/reason (INVARIANTS #2/#5/#6).
//
// SERVERS: unlike vm1.live.ts (which assumes the rails are already up), this test SPAWNS the facilitator
// (:8401) and resource server (:8402) via child_process (the same `tsx --env-file=.env` entry points the
// npm scripts use), waits for readiness, and tears them down in afterAll - so SPEND/REFUSE hit the live rails.
//
// Excluded from the default unit gate (live tier). Run with: npm run test:live -- agent/vm2.live.ts
import 'dotenv/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrivateKey } from '@hiero-ledger/sdk';
import { ExactHederaScheme, createClientHederaSigner } from '@x402/hedera';
import { x402Client } from '@x402/core/client';
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
  decodePaymentResponseHeader,
} from '@x402/core/http';
import type { PaymentRequired, PaymentRequirements, SettleResponse } from '@x402/core/types';
import { PrivyClient } from '@privy-io/server-auth';
import { setPolicy, readPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import { fundAgent } from '../treasury/privy';
import type { AgentPolicy } from '../types';

const NET = 'hedera:testnet';
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? 'http://localhost:8401';
const RESOURCE_PORT = process.env.RESOURCE_PORT ?? '8402';
const ENDPOINT = `http://localhost:${RESOURCE_PORT}/premium`;
const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

// The DATA agent - the ONE canonical account ENS + Hedera + Privy all bite.
const HERO_NAME = 'data.acme.leash.eth';
const HERO_LABEL = 'data';
const REGISTRY = process.env.SANDBOX_REGISTRY as `0x${string}`;
const AGENT_ACCOUNT = process.env.SANDBOX_AGENT_ACCOUNT!; // 0.0.10499595
const AGENT_KEY = process.env.SANDBOX_AGENT_KEY!;
const AGENT_EVM = process.env.SANDBOX_AGENT_EVM!;
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID!; // fee-payer (gas-free proof)
const REAL_USDC_EVM = process.env.USDC_EVM_ADDRESS!; // real token facade, NOT a phantom
const TREASURY_WALLET_ID = process.env.TREASURY_WALLET_ID!;

const HERO_POLICY: AgentPolicy = {
  maxPerCall: '5000000', // 5 USDC cap
  allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!],
  hederaAccount: AGENT_ACCOUNT,
  token: process.env.USDC_TOKEN_ID!,
};

// Over the treasury fundingCap (10 USDC, per seed/privy.live) by one raw unit -> Privy policy DENY.
const OVER_FUNDING_CAP = '10000001';

interface Outcome {
  status: number;
  ok: boolean;
  settle?: SettleResponse;
}

// ---- server lifecycle (spawn the live rails so SPEND/REFUSE hit them for real) ----
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

// ---- payment helpers (mirror agent/pay.ts, kept local so the test drives the exact live HTTP flow) ----
async function attempt(amountRawOverride?: string): Promise<Outcome> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': HERO_NAME } });
  expect(first.status).toBe(402);
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const hedera = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const chosen: PaymentRequirements = amountRawOverride ? { ...hedera, amount: amountRawOverride } : hedera;
  const selected: PaymentRequired = { ...pr, accepts: [chosen] };

  const key = PrivateKey.fromStringECDSA(AGENT_KEY);
  const signer = createClientHederaSigner(AGENT_ACCOUNT, key, { network: NET });
  const client = new x402Client().register(NET, new ExactHederaScheme(signer)).setSpendControls(false);
  const payload = await client.createPaymentPayload(selected);
  const b64 = encodePaymentSignatureHeader(payload);

  const res = await fetch(ENDPOINT, { headers: { 'PAYMENT-SIGNATURE': b64, 'X-Leash-Agent': HERO_NAME } });
  const respHeader = res.headers.get('x-payment-response') ?? res.headers.get('payment-response');
  let settle: SettleResponse | undefined;
  if (respHeader) {
    try {
      settle = decodePaymentResponseHeader(respHeader);
    } catch {
      settle = undefined;
    }
  }
  return { status: res.status, ok: res.ok, settle };
}

// Direct facilitator /settle probe to read the authoritative abort reason (post-revoke REVOKED).
async function settleReason(): Promise<string | undefined> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': HERO_NAME } });
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const chosen = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const key = PrivateKey.fromStringECDSA(AGENT_KEY);
  const signer = createClientHederaSigner(AGENT_ACCOUNT, key, { network: NET });
  const client = new x402Client().register(NET, new ExactHederaScheme(signer)).setSpendControls(false);
  const payload = await client.createPaymentPayload({ ...pr, accepts: [chosen] });
  const res = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-leash-agent': HERO_NAME },
    body: JSON.stringify({ paymentPayload: payload, paymentRequirements: chosen }),
  });
  const body = (await res.json()) as SettleResponse;
  return body.errorReason;
}

// ---- gas-free proof: read the settle tx from the mirror node and assert the AGENT paid 0 HBAR gas ----
// The x402 settle tx id is `0.0.OPERATOR@sec.nanos` (fee-payer = operator). On the mirror node the tx's
// `charged_tx_fee` is paid by the operator, and the HBAR `transfers` show NO debit against the agent.
// That is the gas-free property: the agent only signs the token transfer; the fee-payer covers gas.
function mirrorTxUrl(settleTxId: string): string {
  // settleTxId shape: "0.0.10487802@1699999999.123456789" -> mirror wants "0.0.10487802-1699999999-123456789"
  const m = settleTxId.match(/^(\d+\.\d+\.\d+)@(\d+)\.(\d+)$/);
  if (!m) throw new Error(`unexpected settle tx id shape: ${settleTxId}`);
  return `${MIRROR_NODE}/transactions/${m[1]}-${m[2]}-${m[3]}`;
}

interface MirrorTx {
  transactions?: Array<{
    charged_tx_fee: number;
    transfers?: Array<{ account: string; amount: number }>;
    token_transfers?: Array<{ token_id: string; account: string; amount: number }>;
    result: string;
  }>;
}

async function proveGasFree(settleTxId: string): Promise<{ agentHbarDelta: number; operatorPaidFee: boolean }> {
  const url = mirrorTxUrl(settleTxId);
  const deadline = Date.now() + 60_000;
  let delay = 2_000;
  while (Date.now() < deadline) {
    const r = await fetch(url);
    if (r.ok) {
      const body = (await r.json()) as MirrorTx;
      const tx = body.transactions?.[0];
      if (tx && tx.result === 'SUCCESS') {
        const hbar = tx.transfers ?? [];
        const agentHbar = hbar.filter((t) => t.account === AGENT_ACCOUNT).reduce((s, t) => s + t.amount, 0);
        // The operator (fee-payer) bears a net-negative HBAR delta that covers charged_tx_fee.
        const operatorHbar = hbar.filter((t) => t.account === OPERATOR_ID).reduce((s, t) => s + t.amount, 0);
        const operatorPaidFee = operatorHbar < 0;
        return { agentHbarDelta: agentHbar, operatorPaidFee };
      }
    }
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  throw new Error(`settle tx ${settleTxId} did not appear as SUCCESS on the mirror node within 60s`);
}

function privyClient(): PrivyClient {
  return new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!, {
    walletApi: { authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_KEY },
  });
}

describe('VM-2 three-prize hero (live: grant -> spend gas-free -> refuse -> deny -> revoke -> restore, one account)', () => {
  beforeAll(async () => {
    const required = [
      'SANDBOX_REGISTRY', 'SANDBOX_AGENT_ACCOUNT', 'SANDBOX_AGENT_KEY', 'SANDBOX_AGENT_EVM',
      'RECEIVER_ACCOUNT_ID', 'USDC_TOKEN_ID', 'USDC_EVM_ADDRESS', 'HEDERA_OPERATOR_ID',
      'PRIVY_APP_ID', 'PRIVY_APP_SECRET', 'PRIVY_AUTHORIZATION_KEY', 'TREASURY_WALLET_ID',
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`missing env for VM-2 live hero: ${missing.join(', ')}`);

    // GRANT: ensure the hero policy is bound BEFORE spawning the rails (so SPEND starts from granted state).
    const bound = await readPolicy(HERO_NAME);
    if (!bound || bound.hederaAccount !== AGENT_ACCOUNT) {
      // eslint-disable-next-line no-console
      console.log('[VM-2 GRANT] policy not bound (or stale) - rebinding hero policy for a deterministic milestone');
      await setPolicy(HERO_NAME, HERO_POLICY, REGISTRY, HERO_LABEL);
    }

    // Spawn the live rails (facilitator first, then resource server which syncs feePayer from it on start).
    spawnService('facilitator/server.ts');
    await waitForHttp(`${FACILITATOR_URL}/supported`, (s) => s === 200 || s === 404, 45_000);
    spawnService('resource-server/server.ts');
    await waitForHttp(ENDPOINT, (s) => s === 402, 45_000);
  }, 240_000);

  afterAll(async () => {
    for (const c of children) {
      try {
        c.kill('SIGTERM');
      } catch {
        // best-effort teardown
      }
    }
  }, 30_000);

  it('GRANT: data.acme.leash.eth leash.policy is bound to the canonical agent + cap + allowlist', async () => {
    const p = await readPolicy(HERO_NAME);
    expect(p).not.toBeNull();
    expect(p!.hederaAccount).toBe(AGENT_ACCOUNT);
    expect(p!.maxPerCall).toBe('5000000');
    expect(p!.allowedPayees).toContain(process.env.RECEIVER_ACCOUNT_ID!);
    expect(p!.token).toBe(process.env.USDC_TOKEN_ID!);
    // eslint-disable-next-line no-console
    console.log('[VM-2 GRANT] bound policy:', JSON.stringify(p));
  }, 60_000);

  it('SPEND: in-cap 3 USDC settles gas-free on the canonical agent (200 + real settle tx + 0 HBAR agent gas)', async () => {
    const out = await attempt(); // 3 USDC (endpoint price)
    expect(out.status).toBe(200);
    expect(out.settle?.success).toBe(true);
    expect(out.settle?.payer).toBe(AGENT_ACCOUNT);
    const txId = out.settle?.transaction!;
    // The settle tx id's account is the fee-payer (operator), the first structural gas-free signal.
    expect(txId).toContain(OPERATOR_ID);
    // eslint-disable-next-line no-console
    console.log('[VM-2 SPEND] settle tx:', txId, 'payer:', out.settle?.payer);

    // AUTHORITATIVE gas-free proof: the mirror node shows the agent paid 0 HBAR while the operator paid the fee.
    const proof = await proveGasFree(txId);
    // eslint-disable-next-line no-console
    console.log('[VM-2 SPEND] mirror gas-free proof:', JSON.stringify(proof));
    expect(proof.agentHbarDelta).toBe(0); // agent paid ZERO HBAR gas
    expect(proof.operatorPaidFee).toBe(true); // fee-payer (operator) bore the fee
  }, 240_000);

  it('REFUSE: over-cap 50 USDC is refused at the rail (OVER_CAP, no settle)', async () => {
    const out = await attempt('50000000');
    expect(out.status).toBe(402);
    expect(out.settle?.success).not.toBe(true); // no successful settle
    // The authoritative facilitator reason for the over-cap attempt.
    const reason = await settleReasonFor('50000000');
    // eslint-disable-next-line no-console
    console.log('[VM-2 REFUSE] over-cap settle-layer reason:', reason);
    expect(reason).toBe('OVER_CAP');
  }, 120_000);

  it('DENY: treasury over-fund above fundingCap on the REAL USDC token -> FUNDING_DENIED (no broadcast)', async () => {
    const privy = privyClient();
    // Bind the treasury policy to the DATA agent EVM + real token (idempotent) so the DENY is on THIS account.
    await bindTreasuryToAgent(privy);

    const res = await fundAgent(TREASURY_WALLET_ID, { agentAddress: AGENT_EVM, amountRaw: OVER_FUNDING_CAP }, REAL_USDC_EVM);
    expect(res).toEqual({ denied: true, reason: 'FUNDING_DENIED' });
    expect((res as { txHash?: string }).txHash).toBeUndefined();
    // eslint-disable-next-line no-console
    console.log('[VM-2 DENY] Privy over-fund DENY on real USDC (', REAL_USDC_EVM, ') ->', JSON.stringify(res));
  }, 120_000);

  it('REVOKE then FAIL-CLOSED: clearPolicy on Sepolia, next in-cap call does NOT settle (REVOKED)', async () => {
    const revokeTx = await clearPolicy(HERO_NAME);
    // eslint-disable-next-line no-console
    console.log('[VM-2 REVOKE] Sepolia clearPolicy tx:', revokeTx);
    expect(revokeTx).toMatch(/^0x[0-9a-f]{64}$/i);

    // FAIL-CLOSED: after the on-chain revoke, NO payment settles. Status may be 402 (pre-screen sees cleared)
    // or 5xx (advisory cache still ALLOWs but the authoritative no-cache onBeforeSettle returns REVOKED and
    // aborts - INVARIANT #2 TOCTOU-closed). The invariant that matters: NOT 200 and NO successful settle.
    const out = await attempt(); // in-cap, but policy is now cleared
    expect(out.status).not.toBe(200);
    expect(out.settle?.success).not.toBe(true);
    // eslint-disable-next-line no-console
    console.log('[VM-2 FAIL-CLOSED] post-revoke status:', out.status, 'settle:', JSON.stringify(out.settle));

    const reason = await settleReason();
    // eslint-disable-next-line no-console
    console.log('[VM-2 FAIL-CLOSED] settle-layer reason:', reason);
    expect(reason).toBe('REVOKED');
  }, 180_000);

  it('RESTORE: rebind the hero policy so /demo + the seed survive; readPolicy is bound again', async () => {
    await setPolicy(HERO_NAME, HERO_POLICY, REGISTRY, HERO_LABEL);
    const p = await readPolicy(HERO_NAME);
    expect(p).not.toBeNull();
    expect(p!.hederaAccount).toBe(AGENT_ACCOUNT);
    expect(p!.maxPerCall).toBe('5000000');
    // eslint-disable-next-line no-console
    console.log('[VM-2 RESTORE] hero policy rebound:', JSON.stringify(p));
  }, 180_000);
});

// Direct facilitator probe with an explicit amount override (used for the OVER_CAP reason assertion).
async function settleReasonFor(amountRaw: string): Promise<string | undefined> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': HERO_NAME } });
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const base = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const chosen: PaymentRequirements = { ...base, amount: amountRaw };
  const key = PrivateKey.fromStringECDSA(AGENT_KEY);
  const signer = createClientHederaSigner(AGENT_ACCOUNT, key, { network: NET });
  const client = new x402Client().register(NET, new ExactHederaScheme(signer)).setSpendControls(false);
  const payload = await client.createPaymentPayload({ ...pr, accepts: [chosen] });
  const res = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-leash-agent': HERO_NAME },
    body: JSON.stringify({ paymentPayload: payload, paymentRequirements: chosen }),
  });
  const body = (await res.json()) as SettleResponse;
  return body.errorReason;
}

// Bind the treasury's funding policy to the DATA agent EVM + real USDC token (idempotent), so the DENY beat
// bites the canonical account. Mirrors treasury/privy.live.ts bindRealTokenPolicy.
const TRANSFER_ABI = [{ type: 'function', name: 'transfer', inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }] }];
async function bindTreasuryToAgent(privy: PrivyClient): Promise<void> {
  const wallet = await privy.walletApi.getWallet({ id: TREASURY_WALLET_ID });
  for (const pid of wallet.policyIds ?? []) {
    await privy.walletApi.updatePolicy({
      id: pid,
      rules: [
        {
          name: 'allow-capped-agent-funding',
          method: 'eth_sendTransaction',
          action: 'ALLOW',
          conditions: [
            { fieldSource: 'ethereum_calldata', field: 'transfer._to', abi: TRANSFER_ABI, operator: 'in', value: [AGENT_EVM] },
            { fieldSource: 'ethereum_calldata', field: 'transfer._value', abi: TRANSFER_ABI, operator: 'lte', value: '10000000' },
            { fieldSource: 'ethereum_transaction', field: 'to', operator: 'eq', value: REAL_USDC_EVM },
          ],
        },
      ],
    });
  }
}
