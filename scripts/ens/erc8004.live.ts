// File: scripts/ens/erc8004.integration.ts
// REFRAME [SKILL] R1 integration test (real network — hits the live ERC-8004 registry on Ethereum Sepolia).
// Excluded from the default unit gate; runs under `npm run test:integration` (TEST_TIER=integration). Requires
// a real SEPOLIA_RPC_URL. agentId 7395 is a known live registration (ownerOf == getAgentWallet == 0x92AA…).
import 'dotenv/config'; // self-load .env so test:live has SEPOLIA_RPC_URL (mirrors vm2.live.ts)
import { describe, it, expect } from 'vitest';
import { resolveExternalIdentity } from './erc8004';

const KNOWN_ID = '7395';
const KNOWN_OWNER = '0x92AAe0857979a139344f5b6F008e71F27A507522';

describe('resolveExternalIdentity (R1, live registry)', () => {
  it('resolves the real on-chain owner for agentId 7395', async () => {
    const r = await resolveExternalIdentity({ agentId: KNOWN_ID });
    expect(r.resolvedOwner.toLowerCase()).toBe(KNOWN_OWNER.toLowerCase());
    expect(r.source).toBe('erc8004');
    expect(r.agentId).toBe(KNOWN_ID);
  });

  it('throws owner-mismatch against the live registry for a wrong supplied EVM', async () => {
    await expect(
      resolveExternalIdentity({ agentId: KNOWN_ID, evmAddress: '0x0000000000000000000000000000000000000001' }),
    ).rejects.toThrow(/owner mismatch/i);
  });

  it('throws for a nonexistent agentId (live ownerOf revert)', async () => {
    await expect(resolveExternalIdentity({ agentId: '999999999' })).rejects.toThrow(/unknown|nonexistent|not registered/i);
  });
});
