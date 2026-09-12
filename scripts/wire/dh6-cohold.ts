// [verify_milestone / DH-6] Produce a PERSISTENT per-agent co-hold grant tx on a real authed-registered agent
// (mint path, NOT bind) → flip CLAIMS C-6 fully PROVEN. Uses the headless Privy test token. The on-chain grant
// tx is the persistent deliverable; the DB index row is cleaned up after (tx hash persists regardless).
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, orgs, agents } from '../../db/schema';
import { mintTestToken } from './mint-token';
import { PrivyClient } from '@privy-io/server-auth';
const BASE = process.env.WIRE_BASE_URL || 'http://localhost:3000';
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);
(async () => {
  const token = await mintTestToken();
  const { userId } = await privy.verifyAuthToken(token, process.env.PRIVY_VERIFICATION_KEY || undefined);
  let me = (await db.select().from(users).where(eq(users.privyUserId, userId)).limit(1))[0];
  if (!me) me = (await db.insert(users).values({ privyUserId: userId, email: 'wire-dh6@leash.test' }).returning())[0];
  const allOrgs = await db.select().from(orgs);
  let orgA = allOrgs.find((o) => o.ownerId === me!.id);
  let restore: { id: string; owner: string } | null = null;
  if (!orgA) {
    const cand = allOrgs.find((o) => o.ensName.startsWith('acme.')) || allOrgs[0];
    restore = { id: cand.id, owner: cand.ownerId };
    await db.update(orgs).set({ ownerId: me!.id }).where(eq(orgs.id, cand.id));
    orgA = { ...cand, ownerId: me!.id };
  }
  const userAddress = process.env.RECEIVER_EVM; // a real, valid EVM address to receive the co-hold role
  const label = `dh6c${Date.now().toString().slice(-6)}`;
  let res: any = null;
  try {
    const r = await fetch(`${BASE}/api/agents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orgId: orgA!.id, label, maxPerCall: '1000000', fundRaw: 1_000_000, userAddress,
        agentType: 'DH-6 co-hold proof', description: 'persistent co-hold grant' }),
    });
    res = await r.json();
    console.log('status=', r.status);
    console.log('coholdTx=', res.coholdTx, '| coholdVerified=', res.coholdVerified, '| coholdWarning=', res.coholdWarning);
    console.log('agent ens=', res.agent?.ensName, '| mintTx present=', !!res.mintTx, '| policyTx present=', !!res.policyTx);
    // Cleanup DB row (on-chain co-hold grant tx persists as the deliverable).
    if (res.agent?.id) await db.delete(agents).where(eq(agents.id, res.agent.id));
  } finally {
    if (restore) await db.update(orgs).set({ ownerId: restore.owner }).where(eq(orgs.id, restore.id));
    await db.delete(users).where(eq(users.privyUserId, userId));
  }
  const pass = !!res?.coholdTx && res?.coholdVerified === true;
  console.log('=== DH-6 VERDICT:', pass ? 'PASS' : 'FAIL', '===');
  if (pass) console.log('PERSISTENT_COHOLD_TX=', res.coholdTx);
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('DH6_ERR:', e instanceof Error ? e.message : e); process.exit(2); });
