// File: agent/vm1.live.ts
// [VM-1 - the mandatory ENS+Hedera two-prize hero milestone] Live-tier test (TEST_TIER=live): drives the
// full sandbox hero chain against the RUNNING facilitator (:8401) + resource server (:8402):
//   grant/rebind -> spend (in-cap 3 USDC, gas-free settle) -> refuse (over-cap 50 USDC, OVER_CAP, no settle)
//   -> revoke (clearPolicy on data.acme.leash.eth, one Sepolia tx) -> fail-closed (next in-cap -> REVOKED).
//
// REAL ONLY: a real Hedera settle on testnet, a real Sepolia revoke tx, a real post-revoke REVOKED. No mocks.
// Prereqs: `npm run facilitator` and `npm run resource` must be running, and the hero policy must be bound
// to the provisioned agent/receiver (scripts/ens/rebind-hero.ts). The test restores the hero policy in an
// afterAll so the demo state is preserved for the next run.
//
// Excluded from the default unit gate (live tier). Run with: npm run test:live -- agent/vm1.live.ts
import 'dotenv/config';
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
import { setPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import type { AgentPolicy } from '../types';

const NET = 'hedera:testnet';
const ENDPOINT = process.env.RESOURCE_URL ?? 'http://localhost:8402/premium';
const HERO_NAME = 'data.acme.leash.eth';
const HERO_LABEL = 'data';
const REGISTRY = process.env.SANDBOX_REGISTRY as `0x${string}`;

const HERO_POLICY: AgentPolicy = {
  maxPerCall: '5000000',
  allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!],
  hederaAccount: process.env.SANDBOX_AGENT_ACCOUNT!,
  token: process.env.USDC_TOKEN_ID!,
};

interface Outcome {
  status: number;
  ok: boolean;
  settle?: SettleResponse;
}

// One paid attempt against the endpoint; optional amount override for the over-cap beat.
async function attempt(amountRawOverride?: string): Promise<Outcome> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': HERO_NAME } });
  expect(first.status).toBe(402);
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const hedera = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const chosen: PaymentRequirements = amountRawOverride ? { ...hedera, amount: amountRawOverride } : hedera;
  const selected: PaymentRequired = { ...pr, accepts: [chosen] };

  const key = PrivateKey.fromStringECDSA(process.env.SANDBOX_AGENT_KEY!);
  const signer = createClientHederaSigner(process.env.SANDBOX_AGENT_ACCOUNT!, key, { network: NET });
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

// Build a fresh in-cap payload and hit the facilitator /settle directly to read the abort reason.
// Used only to PROVE the authoritative settle-layer classification is REVOKED after the on-chain revoke.
async function settleReason(): Promise<string | undefined> {
  const first = await fetch(ENDPOINT, { headers: { 'X-Leash-Agent': HERO_NAME } });
  const pr = decodePaymentRequiredHeader(first.headers.get('payment-required')!);
  const chosen = pr.accepts.find((a: PaymentRequirements) => a.network === NET && a.scheme === 'exact')!;
  const key = PrivateKey.fromStringECDSA(process.env.SANDBOX_AGENT_KEY!);
  const signer = createClientHederaSigner(process.env.SANDBOX_AGENT_ACCOUNT!, key, { network: NET });
  const client = new x402Client().register(NET, new ExactHederaScheme(signer)).setSpendControls(false);
  const payload = await client.createPaymentPayload({ ...pr, accepts: [chosen] });
  const facilitatorUrl = process.env.FACILITATOR_URL ?? 'http://localhost:8401';
  const res = await fetch(`${facilitatorUrl}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-leash-agent': HERO_NAME },
    body: JSON.stringify({ paymentPayload: payload, paymentRequirements: chosen }),
  });
  const body = (await res.json()) as SettleResponse;
  return body.errorReason;
}

describe('VM-1 ENS+Hedera hero path (live: grant -> spend -> refuse -> revoke -> fail-closed)', () => {
  beforeAll(async () => {
    // GRANT: (re)bind the hero policy so the chain starts from a known granted state.
    await setPolicy(HERO_NAME, HERO_POLICY, REGISTRY, HERO_LABEL);
  }, 180_000);

  afterAll(async () => {
    // Restore the granted hero policy so the demo state survives (the last beat REVOKES it).
    await setPolicy(HERO_NAME, HERO_POLICY, REGISTRY, HERO_LABEL);
  }, 180_000);

  it('SPEND: in-cap 3 USDC settles gas-free (200 + real settle tx)', async () => {
    const out = await attempt(); // 3 USDC (endpoint price)
    expect(out.status).toBe(200);
    expect(out.settle?.success).toBe(true);
    expect(out.settle?.payer).toBe(process.env.SANDBOX_AGENT_ACCOUNT);
    // The settle tx id's account is the fee-payer (operator), proving gas-free.
    expect(out.settle?.transaction).toContain(process.env.HEDERA_OPERATOR_ID!);
    console.log('[VM-1 SPEND] settle tx:', out.settle?.transaction);
  }, 180_000);

  it('REFUSE: over-cap 50 USDC is refused (402, no settle)', async () => {
    const out = await attempt('50000000');
    expect(out.status).toBe(402);
    expect(out.settle?.success).not.toBe(true); // no successful settle
  }, 120_000);

  it('REVOKE then FAIL-CLOSED: clearPolicy on Sepolia, next in-cap call does NOT settle (REVOKED)', async () => {
    const revokeTx = await clearPolicy(HERO_NAME);
    console.log('[VM-1 REVOKE] Sepolia clearPolicy tx:', revokeTx);
    expect(revokeTx).toMatch(/^0x[0-9a-f]{64}$/i);

    // FAIL-CLOSED is the security property: after the on-chain revoke, NO payment settles. The exact HTTP
    // status can be 402 (advisory pre-screen already sees the cleared record) OR 5xx (advisory 30s cache
    // still ALLOWs, but the AUTHORITATIVE no-cache onBeforeSettle read returns REVOKED and aborts the
    // submit - INVARIANT #2 TOCTOU-closed). Either way the invariant that matters is: NOT 200 and NO
    // successful settle. We also assert the settle-layer reason is REVOKED via a direct facilitator probe.
    const out = await attempt(); // in-cap, but policy is now cleared
    expect(out.status).not.toBe(200);
    expect(out.settle?.success).not.toBe(true); // fail-closed: no settle after revoke
    console.log('[VM-1 FAIL-CLOSED] post-revoke status:', out.status, 'settle:', JSON.stringify(out.settle));

    // Direct settle probe: the authoritative no-cache read must classify the abort as REVOKED.
    const reason = await settleReason();
    console.log('[VM-1 FAIL-CLOSED] settle-layer reason:', reason);
    expect(reason).toBe('REVOKED');
  }, 180_000);
});
