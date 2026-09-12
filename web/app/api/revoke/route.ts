// File: web/app/api/revoke/route.ts
// [Task 5.4b] Real console revoke (ARCHITECTURE §12 / F-003). One RELAYER-SPONSORED clearPolicy write on
// Sepolia empties the agent's leash.policy record, then the index row is synced to 'revoked'. The next payment
// on that agent fails closed - the facilitator reads the now-empty ENS record live (INVARIANT #2/#3), NOT the
// DB flag. The DB update is bookkeeping so the console list shows the revoked state immediately.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { orgs, agents } from '../../../../db/schema';
import { relay } from '../../../../relayer/relay';
import { markAgentRevoked } from '../../../../db/client';
import { publicAgent } from '../../../lib/console';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // the clearPolicy write is a real Sepolia tx

// POST: revoke an agent. Body: { agentId }.
export async function POST(req: Request) {
  let body: { agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  try {
    const rows = await db.select().from(agents).where(eq(agents.id, body.agentId)).limit(1);
    const agent = rows[0];
    if (!agent) return NextResponse.json({ error: 'agent not found' }, { status: 404 });
    const org = await db.select().from(orgs).where(eq(orgs.id, agent.orgId)).limit(1);
    if (!org[0]) return NextResponse.json({ error: 'org not found' }, { status: 404 });

    // Relayer-sponsored on-chain kill: clear the leash.policy text record for this name.
    const tx = await relay(org[0].ensName, { kind: 'revoke', name: agent.ensName });
    // Index sync (bookkeeping only; enforcement reads the live empty ENS record).
    await markAgentRevoked(agent.ensName);

    const updated = await db.select().from(agents).where(eq(agents.id, agent.id)).limit(1);
    return NextResponse.json({ tx, chain: 'sepolia', agent: publicAgent(updated[0]) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'revoke failed', message }, { status: 500 });
  }
}
