// File: facilitator/toctou.integration.ts
// Real-dependency integration tests (TEST_TIER=integration) for DP-4 binding + INVARIANT #2 TOCTOU-closed.
// These hit LIVE Sepolia ENS (the deployed POLICY_RESOLVER) and build a REAL frozen Hedera transfer so the
// decode path (toCtx) and the authoritative no-cache settle read are exercised end-to-end. No Hedera submit
// is performed: we assert the PRE-submit gate decision (a REVOKED/BINDING_MISMATCH decision means the
// onBeforeSettle hook aborts and the scheme's signAndSubmitTransaction is never reached).
//
// Task 2.3 step 3 (TOCTOU in-flight, R-6): advisory read ALLOWs, then clearPolicy() revokes on-chain BEFORE
// the settle read runs; the no-cache settle read re-fetches LIVE and returns REVOKED -> no submit.
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  PrivateKey, TransferTransaction, TokenId, AccountId, TransactionId, Client,
} from '@hiero-ledger/sdk';
import { toCtx, type HederaHookContext } from './decode-ctx';
import { readPolicyCached, readPolicyNoCache, _clearAdvisoryCache } from './ens-read';
import { decide } from './server';
import { setPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import type { AgentPolicy } from '../types';

const NAME = 'payments.acme.leash.eth';
const LABEL = 'payments';
const REGISTRY = process.env.SANDBOX_REGISTRY as `0x${string}`;
const TOKEN = process.env.USDC_TOKEN_ID!;
const OPERATOR = process.env.HEDERA_OPERATOR_ID!; // the payer (policy.hederaAccount binding anchor)
const PAYTO = '0.0.98';                            // a distinct receiver (Hedera fee account, always exists)

// The live demo policy (restored EXACTLY in afterAll so the demo state is preserved).
const LIVE_POLICY: AgentPolicy = {
  maxPerCall: '25000000',
  allowedPayees: [OPERATOR],
  hederaAccount: OPERATOR,
  token: TOKEN,
};

// Test policy: payer=OPERATOR pays PAYTO (0.0.98). PAYTO is on the allowlist so a valid transfer would
// SETTLE - which is what lets the TOCTOU test show a live ALLOW flip to REVOKED. hederaAccount stays
// OPERATOR so the binding-mismatch case (payer=0.0.98) is distinguishable.
const TEST_POLICY: AgentPolicy = {
  maxPerCall: '25000000',
  allowedPayees: [OPERATOR, PAYTO],
  hederaAccount: OPERATOR,
  token: TOKEN,
};

// Build a REAL partially-signed transfer of `amount` from `payer` -> `payTo` and wrap it as a hook context.
async function buildHookCtx(payer: string, payTo: string, amount: number): Promise<HederaHookContext> {
  const key = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
  const client = Client.forTestnet();
  const txId = TransactionId.generate(AccountId.fromString(payer));
  const tx = new TransferTransaction()
    .setTransactionId(txId)
    .addTokenTransfer(TokenId.fromString(TOKEN), AccountId.fromString(payer), -amount)
    .addTokenTransfer(TokenId.fromString(TOKEN), AccountId.fromString(payTo), amount)
    .freezeWith(client);
  const signed = await tx.sign(key);
  const b64 = Buffer.from(signed.toBytes()).toString('base64');
  return {
    paymentPayload: { payload: { transaction: b64 } },
    requirements: { payTo, asset: TOKEN },
  };
}

describe('DP-4 binding + INVARIANT #2 TOCTOU (live ENS + real Hedera transfer decode)', () => {
  beforeAll(async () => {
    // Install the test policy (allowlists PAYTO) so a valid transfer would SETTLE; clear advisory cache.
    await setPolicy(NAME, TEST_POLICY, REGISTRY, LABEL);
    _clearAdvisoryCache();
  }, 120_000);

  afterAll(async () => {
    // Restore the live demo policy regardless of test outcome.
    await setPolicy(NAME, LIVE_POLICY, REGISTRY, LABEL);
  }, 120_000);

  it('decodes a real frozen transfer into the correct PaymentContext', async () => {
    const hookCtx = await buildHookCtx(OPERATOR, PAYTO, 3_000_000);
    const ctx = toCtx(hookCtx, NAME);
    expect(ctx.payer).toBe(OPERATOR);
    expect(ctx.payTo).toBe(PAYTO);
    expect(ctx.amount).toBe(3_000_000n);
    expect(ctx.asset).toBe(TOKEN);
    expect(ctx.paymentId).toMatch(/^[0-9a-f]{64}$/); // content-derived
  }, 60_000);

  it('BINDING_MISMATCH: payer != record.hederaAccount aborts before settle (INVARIANT #8)', async () => {
    // Payer 0.0.98 != record.hederaAccount (OPERATOR); payTo OPERATOR is on the allowlist, so ONLY the
    // binding check fails - isolating INVARIANT #8. (payer != payTo keeps the transfer non-degenerate.)
    const hookCtx = await buildHookCtx('0.0.98', OPERATOR, 3_000_000);
    const ctx = toCtx(hookCtx, NAME);
    expect(ctx.payer).toBe('0.0.98');
    const d = await decide(ctx, readPolicyNoCache); // live authoritative read
    expect('settle' in d).toBe(false);
    if (!('settle' in d)) expect(d.reason).toBe('BINDING_MISMATCH');
  }, 60_000);

  it('TOCTOU in-flight: advisory ALLOW, then clearPolicy on-chain, settle re-reads live -> REVOKED, no submit', async () => {
    const hookCtx = await buildHookCtx(OPERATOR, PAYTO, 3_000_000);
    const ctx = toCtx(hookCtx, NAME);

    // 1) Advisory pre-screen reads the LIVE policy and would ALLOW (settle variant).
    _clearAdvisoryCache();
    const advisory = await decide(ctx, readPolicyCached);
    expect('settle' in advisory).toBe(true); // pre-screen says proceed

    // 2) Mid-flight kill: clear the policy text record on-chain BEFORE the settle read runs (R-6).
    const revokeTx = await clearPolicy(NAME);
    console.log(`[TOCTOU] mid-flight clearPolicy tx (Sepolia): ${revokeTx}`);

    // 3) AUTHORITATIVE settle read is NO-cache: it re-fetches live and now sees the cleared record.
    //    A REVOKED decision means the onBeforeSettle hook aborts -> the scheme never calls
    //    signAndSubmitTransaction, so NO Hedera submit occurs (INVARIANT #2 closes TOCTOU).
    let submitCalled = false;
    const settleGate = async (): Promise<boolean> => {
      const d = await decide(ctx, readPolicyNoCache);
      if ('settle' in d) {
        submitCalled = true; // ONLY here would the real submit fire
        return true;
      }
      expect(d.reason).toBe('REVOKED');
      return false;
    };
    const allowed = await settleGate();
    expect(allowed).toBe(false);
    expect(submitCalled).toBe(false); // proven: no Hedera submit on the revoked settle
  }, 180_000);
});
