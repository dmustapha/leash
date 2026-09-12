// File: web/app/api/org/route.ts
// [Task 5.4b] Real console org provisioning + read (ARCHITECTURE §12 Flow 2). The authenticated user provisions
// their org namespace under the root (leash.eth) - the ENS mint + subregistry deploy are RELAYER-SPONSORED
// (relayer/relay + web/lib/console), so the user pays NO Sepolia gas. The org appears in the orgs table.
//
// AUTH (WS-7 A1): the caller's identity is derived from the verified Privy access token (verifyCaller), NEVER
// from a client-supplied privyUserId. The token's user id KEYs the multi-tenant index rows (users/orgs); it
// never gates a spend (INVARIANT #3). An unauthenticated request is rejected 401.
//
// Isolation (INVARIANT #10): imported only by the console. The /demo tree has no edge to this route.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { users, orgs, agents } from '../../../../db/schema';
import { provisionOrg, publicAgent } from '../../../lib/console';
import { verifyCaller, authErrorResponse } from '../../../lib/auth';
import { enforceRateLimit } from '../../../lib/ratelimit';
import { config } from '../../../lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // org provisioning does real on-chain deploys (subname + subregistry)

// Derive a DNS-safe ENS label from a raw org name (lowercase alnum, <=20 chars, non-empty).
function toLabel(raw: string): string {
  const label = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (!label) throw new Error('org name must contain at least one letter or digit');
  return label;
}

// Ensure a users row exists for this Privy identity (idempotent on privyUserId).
async function ensureUser(privyUserId: string, email: string | null) {
  const existing = await db.select().from(users).where(eq(users.privyUserId, privyUserId)).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(users).values({ privyUserId, email }).returning();
  return inserted[0];
}

// POST: provision (or reuse) the caller's org. Body: { email?, orgName }. Identity comes from the Bearer token.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'org');
  if (limited) return limited;

  let callerUserId: string;
  try {
    callerUserId = await verifyCaller(req);
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }

  let body: { email?: string | null; orgName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.orgName) {
    return NextResponse.json({ error: 'orgName is required' }, { status: 400 });
  }

  try {
    const user = await ensureUser(callerUserId, body.email ?? null);
    const label = toLabel(body.orgName);

    // Reuse an existing org for this user (idempotent: one org per user).
    const existingOrg = await db.select().from(orgs).where(eq(orgs.ownerId, user.id)).limit(1);
    if (existingOrg[0]) {
      return NextResponse.json({ org: existingOrg[0], provisioned: false });
    }

    // [WS-7 A2 / F-017] Namespace collision guard: an org name is bound to its first owner. If the requested
    // label is already provisioned by a DIFFERENT user, reject with a clear taken-error (409) - a second user
    // must NEVER be handed the first user's ENS registry (provisionOrg would otherwise reuse the already-minted
    // subname + registry, silently cross-tenanting them). Step above already ruled out self-reuse, so any hit
    // here is another owner's namespace.
    const orgFullName = `${label}.${config.root}`;
    const taken = await db.select().from(orgs).where(eq(orgs.ensName, orgFullName)).limit(1);
    if (taken[0]) {
      return NextResponse.json(
        { error: 'org name taken', message: `The org name "${label}" is already in use. Pick a different name.` },
        { status: 409 },
      );
    }

    const provisioned = await provisionOrg(label); // relayer-sponsored ENS mint + subregistry deploy
    const inserted = await db.insert(orgs).values({
      ownerId: user.id, ensName: provisioned.ensName, registryAddress: provisioned.registry,
    }).returning();

    return NextResponse.json({ org: inserted[0], mintTx: provisioned.mintTx, provisioned: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'org provisioning failed', message }, { status: 500 });
  }
}

// GET : the caller's org + its agents (the multi-tenant console view). Identity from the Bearer token; index
// reads only. A caller can only ever read their OWN org (the token id keys the lookup).
export async function GET(req: Request) {
  let callerUserId: string;
  try {
    callerUserId = await verifyCaller(req);
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }
  try {
    const user = await db.select().from(users).where(eq(users.privyUserId, callerUserId)).limit(1);
    if (!user[0]) return NextResponse.json({ org: null, agents: [] });
    const org = await db.select().from(orgs).where(eq(orgs.ownerId, user[0].id)).limit(1);
    if (!org[0]) return NextResponse.json({ org: null, agents: [] });
    const list = await db.select().from(agents).where(eq(agents.orgId, org[0].id));
    return NextResponse.json({ org: org[0], agents: list.map(publicAgent) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'org read failed', message }, { status: 502 });
  }
}
