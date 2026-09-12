// File: web/lib/auth.ts
// [WS-7 A1 / S1] The ONE authorization helper for the real console. Every mutating console route calls
// requireOwner() as its FIRST line so a caller can only ever touch resources under their OWN org.
//
// THREAT MODEL (adversarial review B-01, BLOCKER): the real IDOR is "authenticated as user A, target user B's
// agentId/orgId", NOT "forge my own id". So we NEVER trust a client-supplied privyUserId / orgId as identity.
// We re-derive the caller from the verified Privy access token, then load the target resource and assert
// resource -> org.ownerId === caller. Token binding (B-06): Bearer header ONLY (never a query string), and the
// token's app-id audience + expiry are checked by verifyAuthToken (jose validates `exp`; we assert `appId`).
//
// Server-only by construction: imported ONLY by the console route handlers (which never run on the client) and
// it pulls in @privy-io/server-auth + the DB client. It is never imported by a 'use client' component.
import { PrivyClient } from '@privy-io/server-auth';
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { users, orgs, agents } from '../../db/schema';

const APP_ID = process.env.PRIVY_APP_ID!;
// Optional offline verification key (dashboard.privy.io). If unset, verifyAuthToken verifies via the app secret.
const VERIFICATION_KEY = process.env.PRIVY_VERIFICATION_KEY || undefined;

const privy = new PrivyClient(APP_ID, process.env.PRIVY_APP_SECRET!);

// A typed authorization failure. Routes translate it to the HTTP status via authErrorResponse().
export class AuthError extends Error {
  constructor(public readonly status: 401 | 403 | 404, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export type OwnerTarget = { orgId: string } | { agentId: string };

export interface OwnerContext {
  callerUserId: string;                        // verified Privy user id (from the token, never client input)
  user: typeof users.$inferSelect;             // the caller's index user row
  org: typeof orgs.$inferSelect;               // the org the caller owns (resolved from the target)
  agent?: typeof agents.$inferSelect;          // present when the target was an agentId
}

// Extract the Bearer token from the Authorization header ONLY (B-06: never a query string).
function bearerToken(req: Request): string {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) throw new AuthError(401, 'missing or malformed Authorization: Bearer token');
  return match[1].trim();
}

// Verify the caller's Privy access token and return the verified Privy user id. Throws AuthError(401) on any
// invalid/expired/wrong-audience token. This is the identity anchor: everything downstream keys off this id,
// NEVER off a client-supplied privyUserId.
export async function verifyCaller(req: Request): Promise<string> {
  const token = bearerToken(req);
  let claims;
  try {
    claims = await privy.verifyAuthToken(token, VERIFICATION_KEY);
  } catch {
    throw new AuthError(401, 'invalid or expired auth token');
  }
  if (claims.appId !== APP_ID) throw new AuthError(401, 'auth token audience mismatch');
  return claims.userId;
}

// Load (never create) the caller's index user row from the verified Privy user id.
async function loadCallerUser(callerUserId: string) {
  const rows = await db.select().from(users).where(eq(users.privyUserId, callerUserId)).limit(1);
  if (!rows[0]) throw new AuthError(403, 'no account for this identity');
  return rows[0];
}

// The ownership JOIN gate. First line of every mutating console route. Resolves the caller from the token,
// loads the TARGET resource, and asserts it belongs to the caller's org. Returns the resolved context so the
// route can reuse the loaded org/agent rows without a second query.
export async function requireOwner(req: Request, target: OwnerTarget): Promise<OwnerContext> {
  const callerUserId = await verifyCaller(req);
  const user = await loadCallerUser(callerUserId);

  if ('agentId' in target) {
    const agentRows = await db.select().from(agents).where(eq(agents.id, target.agentId)).limit(1);
    const agent = agentRows[0];
    if (!agent) throw new AuthError(404, 'agent not found');
    const orgRows = await db.select().from(orgs).where(eq(orgs.id, agent.orgId)).limit(1);
    const org = orgRows[0];
    if (!org) throw new AuthError(404, 'org not found');
    if (org.ownerId !== user.id) throw new AuthError(403, 'not the owner of this agent');
    return { callerUserId, user, org, agent };
  }

  const orgRows = await db.select().from(orgs).where(eq(orgs.id, target.orgId)).limit(1);
  const org = orgRows[0];
  if (!org) throw new AuthError(404, 'org not found');
  if (org.ownerId !== user.id) throw new AuthError(403, 'not the owner of this org');
  return { callerUserId, user, org };
}

// Translate an AuthError into a JSON response with its status; return null for any other error so the caller's
// own catch handles it. Keeps each route's error handling to one line.
export function authErrorResponse(e: unknown): { body: { error: string }; status: 401 | 403 | 404 } | null {
  if (e instanceof AuthError) return { body: { error: e.message }, status: e.status };
  return null;
}
