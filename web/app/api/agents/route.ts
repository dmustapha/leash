// File: web/app/api/agents/route.ts
// [Task 5.4b] Real console agent lifecycle (ARCHITECTURE §12): register (mint + policy), set cap (re-policy),
// and list. Every ENS write is RELAYER-SPONSORED (relayer/relay) so the user pays no gas; every agent gets a
// CANONICAL Hedera account (web/lib/console) so fund -> pay -> ENS all target the SAME account (DEV-020 model).
//
// INVARIANT #3: the DB rows written here are index-only. The facilitator reads the live ENS record to gate a
// payment; a row can never authorize a spend. INVARIANT #6: the agent's custody key is created server-side and
// used ONLY by the pay rail; it is stripped from every response (publicAgent).
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { orgs, agents } from '../../../../db/schema';
import { relay } from '../../../../relayer/relay';
import { provisionAgentAccount, publicAgent } from '../../../lib/console';
import { config } from '../../../lib/config';
import type { AgentPolicy } from '../../../../types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // registration provisions an account, mints a subname, and writes a policy

function toLabel(raw: string): string {
  const label = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (!label) throw new Error('agent name must contain at least one letter or digit');
  return label;
}

async function loadOrg(orgId: string) {
  const rows = await db.select().from(orgs).where(eq(orgs.id, orgId)).limit(1);
  if (!rows[0]) throw new Error(`org ${orgId} not found`);
  return rows[0];
}

// POST: register a new agent under the org. Body: { orgId, label, maxPerCall, allowedPayees?, fundRaw? }.
// Flow: provision canonical account -> relayer mints <label>.<org> to its EVM alias -> relayer writes policy ->
// index the agent row. Returns the public agent (no custody key) + the mint/policy tx hashes.
export async function POST(req: Request) {
  let body: { orgId?: string; label?: string; maxPerCall?: string; allowedPayees?: string[]; fundRaw?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.orgId || !body.label || !body.maxPerCall) {
    return NextResponse.json({ error: 'orgId, label and maxPerCall are required' }, { status: 400 });
  }
  if (!/^\d+$/.test(body.maxPerCall)) {
    return NextResponse.json({ error: 'maxPerCall must be a raw smallest-unit integer string' }, { status: 400 });
  }

  try {
    const org = await loadOrg(body.orgId);
    const label = toLabel(body.label);
    const name = `${label}.${org.ensName}`;
    const registry = org.registryAddress as `0x${string}`;

    // Reject a duplicate leaf (idempotence guard: one agent per ENS name).
    const dup = await db.select().from(agents).where(eq(agents.ensName, name)).limit(1);
    if (dup[0]) return NextResponse.json({ error: `agent ${name} already exists` }, { status: 409 });

    // 1) Canonical Hedera account (funded with real USDC so it can actually pay gas-free).
    const account = await provisionAgentAccount(body.fundRaw ?? 50_000_000);

    // 2) Relayer-sponsored ENS mint (child owned by the agent's EVM alias) + policy write.
    const expires = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);
    const mintTx = await relay(org.ensName, {
      kind: 'mint', registry, label, agentAddress: account.evmAddress as `0x${string}`, expires,
    });
    const allowedPayees = body.allowedPayees?.length ? body.allowedPayees : [process.env.RECEIVER_ACCOUNT_ID!];
    const policy: AgentPolicy = {
      maxPerCall: body.maxPerCall,
      allowedPayees,
      hederaAccount: account.accountId,
      token: config.usdcTokenId,
    };
    const policyTx = await relay(org.ensName, { kind: 'setPolicy', registry, label, name, policy });

    // 3) Index the agent (custody key held index-side per DEV-028; stripped from the response).
    const inserted = await db.insert(agents).values({
      orgId: org.id, ensName: name, maxPerCall: policy.maxPerCall,
      allowedPayees: JSON.stringify(allowedPayees), hederaAccount: account.accountId,
      agentEvm: account.evmAddress, agentKey: account.keyDer, mintTx, policyTx,
    }).returning();

    return NextResponse.json({ agent: publicAgent(inserted[0]), mintTx, policyTx });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'agent registration failed', message }, { status: 500 });
  }
}

// PUT: set an agent's cap. Body: { agentId, maxPerCall }. Rewrites the ENS policy (relayer) + updates the index.
export async function PUT(req: Request) {
  let body: { agentId?: string; maxPerCall?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.agentId || !body.maxPerCall) {
    return NextResponse.json({ error: 'agentId and maxPerCall are required' }, { status: 400 });
  }
  if (!/^\d+$/.test(body.maxPerCall)) {
    return NextResponse.json({ error: 'maxPerCall must be a raw smallest-unit integer string' }, { status: 400 });
  }

  try {
    const rows = await db.select().from(agents).where(eq(agents.id, body.agentId)).limit(1);
    const agent = rows[0];
    if (!agent) return NextResponse.json({ error: 'agent not found' }, { status: 404 });
    const org = await loadOrg(agent.orgId);
    const label = agent.ensName.split('.')[0];

    const policy: AgentPolicy = {
      maxPerCall: body.maxPerCall,
      allowedPayees: JSON.parse(agent.allowedPayees) as string[],
      hederaAccount: agent.hederaAccount,
      token: config.usdcTokenId,
    };
    const policyTx = await relay(org.ensName, {
      kind: 'setPolicy', registry: org.registryAddress as `0x${string}`, label, name: agent.ensName, policy,
    });
    const updated = await db.update(agents)
      .set({ maxPerCall: body.maxPerCall, policyTx, status: 'active' })
      .where(eq(agents.id, agent.id)).returning();
    return NextResponse.json({ agent: publicAgent(updated[0]), policyTx });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'set cap failed', message }, { status: 500 });
  }
}

// GET ?orgId=... : the org's agents (index read; custody keys stripped).
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get('orgId');
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  try {
    const list = await db.select().from(agents).where(and(eq(agents.orgId, orgId)));
    return NextResponse.json({ agents: list.map(publicAgent) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'agent list failed', message }, { status: 502 });
  }
}
