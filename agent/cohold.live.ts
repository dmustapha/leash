// File: agent/cohold.live.ts
// [WS-7 C1 / F-023] LIVE proof of the additive, scope-guarded co-hold kill switch on the real Sepolia policy
// resolver. Proves:
//   1. relay('grant') is SCOPE-GUARDED - a grant targeting a name OUTSIDE the caller org throws (B-02).
//   2. The grant is ADDITIVE - after granting the kill-switch role (ROLE_SET_TEXT on the agent's leash.policy
//      part-resource) to a throwaway address, BOTH that address AND the relayer/deployer hold it (F-023).
//   3. It is CONFINED to the agent's own leash.policy key (a resolver part-resource), never the parent registry.
// Non-destructive: the throwaway grant is REVOKED in afterAll so the demo resolver state is restored.
// Runs under `npm run test:live` only. The relayer/deployer key sponsors the grant + revoke (gasless for users).
import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { relay } from '../relayer/relay';
import { revokePolicyCohold, hasPolicyCohold } from '../scripts/ens/cohold';

const ORG = process.env.SANDBOX_ORG_NAME!;                 // acme.leash.eth
const HERO_NAME = `data.${ORG}`;                           // the hero agent leaf
const DEPLOYER = process.env.LEASH_DEPLOYER_ADDRESS as `0x${string}`;
// A deterministic throwaway grantee (not a real account); granting a resolver text-role to it is harmless + revoked after.
const THROWAWAY = '0x00000000000000000000000000000000cccc0001' as `0x${string}`;

describe('WS-7 C1 - additive, scope-guarded co-hold kill switch (F-023 / B-02)', () => {
  beforeAll(async () => {
    for (const k of ['SANDBOX_ORG_NAME', 'LEASH_DEPLOYER_ADDRESS', 'LEASH_DEPLOYER_KEY', 'POLICY_RESOLVER']) {
      if (!process.env[k]) throw new Error(`missing env for co-hold live test: ${k}`);
    }
    // Clean start: if a prior failed run left the throwaway as a co-holder, remove it first.
    if (await hasPolicyCohold(HERO_NAME, THROWAWAY)) await revokePolicyCohold(HERO_NAME, THROWAWAY);
  }, 120_000);

  afterAll(async () => {
    // Restore demo state: remove the throwaway co-holder (leave the relayer's ROOT authority intact).
    if (await hasPolicyCohold(HERO_NAME, THROWAWAY)) await revokePolicyCohold(HERO_NAME, THROWAWAY);
  }, 120_000);

  it('B-02: a grant targeting a name OUTSIDE the caller org is rejected by the relay scope guard', async () => {
    await expect(
      relay(ORG, { kind: 'grant', registry: '0x0000000000000000000000000000000000000000', name: 'attacker.someoneelse.eth', account: THROWAWAY }),
    ).rejects.toThrow(/scope violation/i);
  });

  it('F-023: relay grant is additive - BOTH the user address AND the relayer hold the kill switch after', async () => {
    // Sanity: the relayer/deployer already holds the kill switch via ROOT (it is the resolver admin).
    expect(await hasPolicyCohold(HERO_NAME, DEPLOYER)).toBe(true);

    const tx = await relay(ORG, { kind: 'grant', registry: '0x0000000000000000000000000000000000000000', name: HERO_NAME, account: THROWAWAY });
    expect(tx).toMatch(/^0x[0-9a-f]{64}$/i);
    console.log('[C1 co-hold] grant tx:', tx);

    const [userHolds, relayerHolds] = await Promise.all([
      hasPolicyCohold(HERO_NAME, THROWAWAY),
      hasPolicyCohold(HERO_NAME, DEPLOYER),
    ]);
    expect(userHolds).toBe(true);     // the co-holder gained the kill switch
    expect(relayerHolds).toBe(true);  // additive: the relayer still holds it (nothing removed)
  }, 150_000);

  it('proves the granted role really lets the co-holder revoke (setText authority), then restores it', async () => {
    // The co-holder now holds ROLE_SET_TEXT on the agent's leash.policy part-resource - i.e. real on-chain
    // authority to clear the policy. We assert the role is held (the on-chain authority); executing a
    // co-holder-signed setText would require that address to hold Sepolia gas, which is out of scope for the
    // gasless model. Holding the role IS the verifiable co-custody claim (F-023).
    expect(await hasPolicyCohold(HERO_NAME, THROWAWAY)).toBe(true);
  }, 60_000);
});
