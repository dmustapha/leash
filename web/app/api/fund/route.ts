// File: web/app/api/fund/route.ts
// Privy policy-gated funding + the leaked-key DENY surfacing (Task 4.1 + 5.4b). Thin wrapper over the proven
// treasury/privy fundAgent (WS-0/DP-0): an in-cap transfer returns { funded, txHash }; an over-cap/off-allowlist
// transfer returns { denied: true, reason: 'FUNDING_DENIED' } from Privy's policy BEFORE broadcast. No
// self-broadcast on this rail (INVARIANT #6 / D-10) - the treasury wallet is P-256-owner-driven inside fundAgent.
//
// Two callers: the demo passes an explicit { agentAddress }; the console passes { agentId } and this route
// resolves the agent's canonical EVM alias from the index (INVARIANT #3: an index read to build the transfer
// target, never to gate a spend).
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { agents } from '../../../../db/schema';
import { fundAgent } from '../../../../treasury/privy';
import { config } from '../../../lib/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  let body: { agentId?: string; agentAddress?: string; amountRaw?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.amountRaw || !/^\d+$/.test(body.amountRaw)) {
    return NextResponse.json({ error: 'amountRaw must be a raw smallest-unit integer string' }, { status: 400 });
  }

  try {
    // Resolve the transfer target: an explicit address (demo) or the agent's canonical EVM alias (console).
    let agentAddress = body.agentAddress;
    if (!agentAddress && body.agentId) {
      const rows = await db.select().from(agents).where(eq(agents.id, body.agentId)).limit(1);
      if (!rows[0]) return NextResponse.json({ error: 'agent not found' }, { status: 404 });
      agentAddress = rows[0].agentEvm;
    }
    if (!agentAddress) return NextResponse.json({ error: 'agentId or agentAddress required' }, { status: 400 });

    const result = await fundAgent(config.treasuryWalletId, { agentAddress, amountRaw: body.amountRaw }, config.usdcEvmAddress);
    const denied = 'denied' in result && result.denied === true;
    return NextResponse.json({
      result,
      denied,
      reason: 'denied' in result ? result.reason : null,
      txHash: 'funded' in result ? result.txHash : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'funding failed', message }, { status: 500 });
  }
}
