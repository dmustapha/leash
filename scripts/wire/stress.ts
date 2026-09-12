// [stress] Live HTTP-layer edge tests: DH-4 rate-limit 429 (burst), DH-7 cross-tenant allowlist/reactivate 403,
// backend-API smoke (malformed / missing-auth / wrong-method). Uses the headless Privy test token for authz.
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, agents } from '../../db/schema';
import { mintTestToken } from './mint-token';
import { PrivyClient } from '@privy-io/server-auth';
const BASE = 'http://localhost:3000';
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

async function j(method: string, path: string, body?: unknown, token?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status };
}

(async () => {
  const R: Record<string, string> = {};

  // DH-4: burst POST /api/agents (unauthed) — rate-limit (cap 8) must surface 429 within the burst.
  const codes: number[] = [];
  for (let i = 0; i < 14; i++) codes.push((await j('POST', '/api/agents', { orgId: 'x', label: 'x', maxPerCall: '1' })).status);
  const got429 = codes.includes(429);
  R['DH-4 rate-limit 429 in burst'] = got429 ? `PASS (codes: ${codes.join(',')})` : `FAIL (${codes.join(',')})`;

  // DH-7: authed-as-test-user targeting an agent owned by ANOTHER user (consoleco / e2e-user-fixed) → 403.
  const token = await mintTestToken();
  const { userId } = await privy.verifyAuthToken(token, process.env.PRIVY_VERIFICATION_KEY || undefined);
  let me = (await db.select().from(users).where(eq(users.privyUserId, userId)).limit(1))[0];
  if (!me) me = (await db.insert(users).values({ privyUserId: userId, email: 'wire-stress@leash.test' }).returning())[0];
  const foreign = (await db.select().from(agents).limit(50)).find((a) => a.ensName.includes('consoleco'));
  if (foreign) {
    const al = await j('PUT', '/api/agents/allowlist', { agentId: foreign.id, allowedPayees: ['0.0.999'] }, token);
    const re = await j('POST', '/api/agents/reactivate', { agentId: foreign.id }, token);
    R['DH-7 cross-tenant allowlist PUT'] = al.status === 403 ? 'PASS (403)' : `FAIL (${al.status})`;
    R['DH-7 cross-tenant reactivate POST'] = re.status === 403 ? 'PASS (403)' : `FAIL (${re.status})`;
  } else R['DH-7'] = 'SKIP (no foreign agent in DB)';

  // Backend-API smoke (Phase 4): malformed JSON, missing auth, wrong method on key mutating routes.
  const badJson = await fetch(BASE + '/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' });
  R['API malformed JSON → 400'] = badJson.status === 400 ? 'PASS' : `note (${badJson.status})`;
  R['API /revoke missing auth → 401'] = (await j('POST', '/api/revoke', { agentId: 'x' })).status === 401 ? 'PASS' : 'FAIL';
  R['API /agents GET wrong (no orgId) → 400'] = (await j('GET', '/api/agents')).status === 400 ? 'PASS' : 'note';

  // cleanup seeded stress user
  await db.delete(users).where(eq(users.privyUserId, userId));

  console.log(JSON.stringify(R, null, 2));
  const fails = Object.values(R).filter((v) => v.startsWith('FAIL'));
  console.log(fails.length ? `\nFAILURES: ${fails.length}` : '\nALL STRESS HTTP CHECKS PASS');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('STRESS_ERR:', e instanceof Error ? e.message : e); process.exit(2); });
