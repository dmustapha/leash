// File: web/app/api/agents/allowlist/route.ts
// [WS-7 B1 / F-020] Edit an agent's allowlist AFTER registration. One RELAYER-SPONSORED setPolicy write rewrites
// the agent's leash.policy `allowedPayees` on-chain (the SAME record the facilitator reads live to gate a
// payment), then the index row is synced. An off-allowlist pay is then refused OFF_ALLOWLIST by the facilitator.
//
// This is a full REPLACE of the agent's own allowlist (the owner is explicitly declaring the new payee set) -
// distinct from the FUNDING policy union in A3. AUTH (A1/B-08): requireOwner({agentId}) is the first line, so a
// caller can only edit their OWN agent (cross-tenant edit -> 403).
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
export const maxDuration = 120; // the setPolicy rewrite is a real Sepolia tx

// PUT: rewrite an agent's allowlist. Body: { agentId, allowedPayees: string[] }.
export async function PUT(req: Request) {
  const limited = enforceRateLimit(req, 'allowlist');
  if (limited) return limited;

  let body: { agentId?: string; allowedPayees?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.agentId || !Array.isArray(body.allowedPayees)) {
    return NextResponse.json({ error: 'agentId and allowedPayees[] are required' }, { status: 400 });
  }
  const allowedPayees = body.allowedPayees.map((s) => String(s).trim()).filter(Boolean);
  if (allowedPayees.length === 0) {
    return NextResponse.json({ error: 'allowedPayees must contain at least one Hedera account id' }, { status: 400 });
  }
  if (!allowedPayees.every((p) => /^\d+\.\d+\.\d+$/.test(p))) {
    return NextResponse.json({ error: 'each payee must be a Hedera account id like 0.0.123' }, { status: 400 });
  }

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
      allowedPayees,
      hederaAccount: agent.hederaAccount,
      token: config.usdcTokenId,
    };
    // Rewrite the on-chain leash.policy (enforcement reads this live) then sync the index.
    const policyTx = await relay(org.ensName, {
      kind: 'setPolicy', registry: org.registryAddress as `0x${string}`, label, name: agent.ensName, policy,
    });
    const updated = await db.update(agents)
      .set({ allowedPayees: JSON.stringify(allowedPayees), policyTx, status: 'active' })
      .where(eq(agents.id, agent.id)).returning();
    return NextResponse.json({ agent: publicAgent(updated[0]), policyTx });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'allowlist edit failed', message }, { status: 500 });
  }
}
