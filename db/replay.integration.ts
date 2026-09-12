// File: db/replay.integration.ts
// [WS-7 A5 / F-025] Durable replay round-trip against the real Neon store: a fresh paymentId is not seen; after
// markSeen it IS seen (and survives a hypothetical process restart, since it is persisted). markSeen is
// idempotent. Integration tier (hits Neon via DATABASE_URL).
import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { isSeen, markSeen } from './replay';

describe('WS-7 A5 - durable replay store (seen_payments)', () => {
  it('a fresh paymentId is not seen; after markSeen it is seen (durably)', async () => {
    const id = `test-replay-${Date.now()}-${process.pid}`;
    expect(await isSeen(id)).toBe(false);
    await markSeen(id);
    expect(await isSeen(id)).toBe(true);
    // Idempotent: re-marking the same id does not throw (onConflictDoNothing).
    await markSeen(id);
    expect(await isSeen(id)).toBe(true);
  }, 30_000);
});
