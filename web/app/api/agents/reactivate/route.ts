// File: web/app/api/agents/reactivate/route.ts
// [WS-7 B2 / F-021] Un-revoke an agent. Revoke cleared its leash.policy record on-chain (fail-closed). This
// re-binds the policy with the agent's stored cap + allowlist via one RELAYER-SPONSORED setPolicy write, then
// flips the index status revoked->active. The very next in-cap payment settles again (the facilitator reads the
// now-populated ENS record live). Symmetric to /api/revoke.
//
// AUTH (A1/B-08): requireOwner({agentId}) first line - a caller can only re-activate their OWN agent.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../../db/client';
import { agents } from '../../../../../db/schema';
import { relay } from '../../../../../relayer/relay';
import { publicAgent } from '../../../../lib/console';
import { config } from '../../../../lib/config';
import { requireOwner, authErrorResponse } from '../../../../lib/auth';
import { enforceRateLimit } from '../../../../lib/ratelimit';
import type { AgentPolicy } from '../../../../../types';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // the setPolicy rebind is a real Sepolia tx

// POST: re-activate an agent. Body: { agentId }.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'reactivate');
  if (limited) return limited;

  let body: { agentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  // A1/B-08: caller must own the target agent.
  let ctx;
  try {
    ctx = await requireOwner(req, { agentId: body.agentId });
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }
  const agent = ctx.agent!;
  const org = ctx.org;

  try {
    const label = agent.ensName.split('.')[0];
    const policy: AgentPolicy = {
      maxPerCall: agent.maxPerCall,
      allowedPayees: JSON.parse(agent.allowedPayees) as string[],
      hederaAccount: agent.hederaAccount,
      token: config.usdcTokenId,
    };
    // Re-bind the on-chain leash.policy record, then sync the index status back to active.
    const policyTx = await relay(org.ensName, {
      kind: 'setPolicy', registry: org.registryAddress as `0x${string}`, label, name: agent.ensName, policy,
    });
    const updated = await db.update(agents)
      .set({ policyTx, status: 'active' })
      .where(eq(agents.id, agent.id)).returning();
    return NextResponse.json({ agent: publicAgent(updated[0]), policyTx, chain: 'sepolia' });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'reactivate failed', message }, { status: 500 });
  }
}
