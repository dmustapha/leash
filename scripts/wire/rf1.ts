// File: scripts/wire/rf1.ts
// [WIRE / RF-1] Prove the authed register-EXISTING (bind) path END-TO-END with a REAL Privy-signed token.
//   200: authed bind POST /api/agents -> co-signed KeyList account + on-chain-resolved identity + leash.policy
//   403: authed-as-A targeting an org owned by user B -> requireOwner rejects (IDOR)
// Token source (in order): PRIVY_TEST_TOKEN env, else privy.getTestAccessToken() (needs dashboard test-creds).
// The 200 test binds under an org OWNED by the token's user; if the token user owns none, we temporarily
// reassign an existing relayer-controlled org (acme) to them and RESTORE its ownerId in a finally block.
import { PrivyClient } from '@privy-io/server-auth';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, orgs } from '../../db/schema';
import { mintTestToken } from './mint-token';

const BASE = process.env.WIRE_BASE_URL || 'http://localhost:3000';
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

async function getToken(): Promise<string> {
  if (process.env.PRIVY_TEST_TOKEN) return process.env.PRIVY_TEST_TOKEN.trim();
  // Privy's auth API rejects the SDK's getTestAccessToken() with "Must specify origin"; mint the same
  // passwordless test token manually WITH an allow-listed Origin header (localhost:3000). Real Privy JWT.
  return mintTestToken();
}

async function post(token: string | null, body: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}/api/agents`, { method: 'POST', headers, body: JSON.stringify(body) });
  let json: any = null;
  try { json = await r.json(); } catch { /* ignore */ }
  return { status: r.status, json };
}

(async () => {
  const token = await getToken();
  const { userId } = await privy.verifyAuthToken(token, process.env.PRIVY_VERIFICATION_KEY || undefined);
  console.log('TOKEN userId=', userId);

  // Ensure an index user row for the token identity.
  let me = (await db.select().from(users).where(eq(users.privyUserId, userId)).limit(1))[0];
  if (!me) {
    me = (await db.insert(users).values({ privyUserId: userId, email: 'wire-rf1@leash.test' }).returning())[0];
    console.log('SEED users row for', userId, '->', me.id);
  }

  // Pick org A (owned by me, for the 200) and org B (owned by someone else, for the 403).
  const allOrgs = await db.select().from(orgs);
  let orgA = allOrgs.find((o) => o.ownerId === me!.id);
  let restore: { id: string; owner: string } | null = null;
  if (!orgA) {
    // Prefer acme.* (relayer-controlled registry, definitely mintable). Temporarily reassign, restore in finally.
    const cand = allOrgs.find((o) => o.ensName.startsWith('acme.')) || allOrgs[0];
    restore = { id: cand.id, owner: cand.ownerId };
    await db.update(orgs).set({ ownerId: me!.id }).where(eq(orgs.id, cand.id));
    orgA = { ...cand, ownerId: me!.id };
    console.log('TEMP reassign', cand.ensName, 'owner ->', me!.id, '(will restore)');
  }
  const orgB = allOrgs.find((o) => o.id !== orgA!.id && o.ownerId !== me!.id);
  console.log('orgA=', orgA!.ensName, '| orgB=', orgB?.ensName ?? '(none)');

  const label = `rf1x${Date.now().toString().slice(-6)}`;
  const results: any = {};
  try {
    // --- 200: authed bind under my org, via ERC-8004 agentId resolve (R1) + agent-supplied Hedera pubkey (SR-1)
    const bind = await post(token, {
      orgId: orgA!.id, label, maxPerCall: '1000000',
      bindExisting: true, erc8004Id: '7395', agentPub: process.env.COSIGN_AGENT_PUB,
      agentType: 'wire RF-1 bound agent', description: 'RF-1 live bind proof',
    });
    results.bind200 = bind;
    console.log('\n[200 TEST] status=', bind.status);
    console.log(JSON.stringify(bind.json, null, 2)?.slice(0, 1400));

    // --- 403: same token, target org B (owned by another user)
    if (orgB) {
      const idor = await post(token, {
        orgId: orgB.id, label: `${label}b`, maxPerCall: '1000000',
        bindExisting: true, erc8004Id: '7395', agentPub: process.env.COSIGN_AGENT_PUB,
      });
      results.idor403 = idor;
      console.log('\n[403 TEST] status=', idor.status, '| body=', JSON.stringify(idor.json));
    } else {
      console.log('\n[403 TEST] SKIPPED — no second-owner org present');
    }
  } finally {
    if (restore) {
      await db.update(orgs).set({ ownerId: restore.owner }).where(eq(orgs.id, restore.id));
      console.log('\nRESTORED org owner');
    }
  }

  // Verdicts
  const b = results.bind200, i = results.idor403;
  const bindOk = b?.status === 200 && b.json?.bound === true && !!b.json?.cosigned?.accountId
    && b.json?.identity?.label === 'on-chain-resolved' && !!b.json?.policyTx;
  const idorOk = !i || i.status === 403;
  console.log('\n=== RF-1 VERDICT ===');
  console.log('authed bind 200 + cosigned + on-chain-resolved + policy:', bindOk ? 'PASS' : 'FAIL');
  console.log('authed-as-A-targets-B 403 (IDOR):', i ? (idorOk ? 'PASS' : 'FAIL') : 'N/A');
  process.exit(bindOk && idorOk ? 0 : 1);
})().catch((e) => { console.error('RF1_ERR:', e instanceof Error ? e.message : e); process.exit(2); });
// (stack helper appended by wire for diagnosis)
