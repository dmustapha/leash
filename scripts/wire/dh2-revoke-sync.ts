// [WIRE / DH-2] Prove markAgentRevoked flips the index row status against LIVE Neon (unit test mocks pg).
// Uses the rf1x* test agent (no demo agent touched), then cleans up all wire test rows.
import { eq, like } from 'drizzle-orm';
import { db, markAgentRevoked } from '../../db/client';
import { agents, users } from '../../db/schema';
(async () => {
  const before = await db.select().from(agents).where(like(agents.ensName, 'rf1x%'));
  if (!before.length) { console.log('DH-2 SKIP: no rf1x agent present'); process.exit(0); }
  const a = before[0];
  console.log('target=', a.ensName, 'statusBefore=', a.status);
  await markAgentRevoked(a.ensName);                       // the REAL index-sync helper, live Neon
  const after = (await db.select().from(agents).where(eq(agents.id, a.id)).limit(1))[0];
  const pass = a.status === 'active' && after.status === 'revoked';
  console.log('statusAfter=', after.status, '=> DH-2', pass ? 'PASS' : 'FAIL');
  // Cleanup: delete all wire test agent rows + the seeded test user (keep DB clean for demo).
  const delA = await db.delete(agents).where(like(agents.ensName, 'rf1x%')).returning();
  const delU = await db.delete(users).where(eq(users.privyUserId, 'did:privy:cmtyxugux00un0bjqt8y07ac7')).returning();
  console.log('cleanup: deleted', delA.length, 'agent row(s),', delU.length, 'user row(s)');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('DH2_ERR:', e instanceof Error ? e.message : e); process.exit(2); });
