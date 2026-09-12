// File: db/revoke-sync.test.ts
// Unit tier (default green gate): proves markAgentRevoked issues the correct index-only status mutation
// (set status='revoked' WHERE ens_name = <name>) WITHOUT touching the network. The pg Pool + drizzle chain
// is mocked; this asserts the helper's SQL intent, not a live DB. Enforcement never reads this (INVARIANT #3).
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture the drizzle update() call chain: db.update(agents).set({...}).where(eq(...)).
const whereSpy = vi.fn().mockResolvedValue(undefined);
const setSpy = vi.fn(() => ({ where: whereSpy }));
const updateSpy = vi.fn(() => ({ set: setSpy }));

vi.mock('pg', () => ({ Pool: class { constructor() {} } }));
vi.mock('drizzle-orm/node-postgres', () => ({ drizzle: vi.fn(() => ({ update: updateSpy })) }));

const { markAgentRevoked } = await import('./client');

describe('markAgentRevoked (index-only revoke->status sync, INVARIANT #3)', () => {
  beforeEach(() => {
    updateSpy.mockClear();
    setSpy.mockClear();
    whereSpy.mockClear();
  });

  it("sets status='revoked' for the given ENS name", async () => {
    await markAgentRevoked('data.acme.leash.eth');
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith({ status: 'revoked' });
    expect(whereSpy).toHaveBeenCalledTimes(1);
  });

  it('awaits the mutation (returns void, no fabricated result)', async () => {
    await expect(markAgentRevoked('data.other.leash.eth')).resolves.toBeUndefined();
    expect(setSpy).toHaveBeenCalledWith({ status: 'revoked' });
  });
});
