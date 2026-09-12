// File: db/client.ts
// Neon pooled connection via node-postgres (DATABASE_URL, live-verified). INDEX layer ONLY (INVARIANT #3):
// nothing on the facilitator enforcement path imports this client. Driver choice: node-postgres `pg` Pool
// (installed, ^8) driving drizzle - a standard Postgres wire connection works against Neon's pooled endpoint.
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { agents } from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
export const db = drizzle(pool);

// revoke -> status sync (Task 4.2, step 2): mark an agent 'revoked' in the index after its policy is cleared.
// Index-only bookkeeping - this never gates a payment; enforcement reads the live ENS record (INVARIANT #3).
// Called by web/app/api/revoke/route.ts (route itself is Phase 5) AFTER the on-chain clearPolicy succeeds.
export async function markAgentRevoked(ensName: string): Promise<void> {
  await db.update(agents).set({ status: 'revoked' }).where(eq(agents.ensName, ensName));
}
