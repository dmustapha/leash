// File: db/replay.ts
// [WS-7 A5 / INVARIANT #9] Durable replay guard for settled x402 paymentIds. The facilitator keeps a fast
// in-memory Set, but that is lost on a Render cold start - so a replay could slip through after a restart. This
// Neon-backed set makes the guard survive restarts.
//
// FAIL-CLOSED (B-05): the CALLER treats any thrown error here as "deny" (a store outage must never be read as
// "not seen, proceed"). Persist happens BEFORE the settle is treated as consumed; Hedera DUPLICATE_TRANSACTION
// is the on-chain backstop. This is the ONLY DB the enforcement adapter touches, and ONLY for dedup - the
// AUTHORIZATION decision still reads ENS live (INVARIANT #3: the pure gate authorize.ts imports no DB).
import { db } from './client';
import { seenPayments } from './schema';
import { eq } from 'drizzle-orm';

// True if this paymentId was already settled (durably). Throws on a store error (caller fails closed).
export async function isSeen(paymentId: string): Promise<boolean> {
  const rows = await db.select().from(seenPayments).where(eq(seenPayments.paymentId, paymentId)).limit(1);
  return !!rows[0];
}

// Durably record a settled paymentId. Idempotent (a re-insert of the same id is a no-op). Throws on a store
// error (caller fails closed and does NOT proceed).
export async function markSeen(paymentId: string): Promise<void> {
  await db.insert(seenPayments).values({ paymentId }).onConflictDoNothing();
}
