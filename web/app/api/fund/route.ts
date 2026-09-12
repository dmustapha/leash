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
import { fundAgent } from '../../../../treasury/privy';
import { config } from '../../../lib/config';
import { requireOwner, authErrorResponse } from '../../../lib/auth';
import { enforceRateLimit } from '../../../lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'fund');
  if (limited) return limited;

  let body: { agentId?: string; amountRaw?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.amountRaw || !/^\d+$/.test(body.amountRaw)) {
    return NextResponse.json({ error: 'amountRaw must be a raw smallest-unit integer string' }, { status: 400 });
  }
  if (!body.agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 });

  // A1 (WS-7 debug hardening): funding targets an agent the caller OWNS. The former explicit-`agentAddress`
  // branch (no client used it; /demo funds via treasury/privy directly) was a cross-tenant action surface and
  // is removed - the target EVM is always resolved from the caller's own agent row under requireOwner.
  let agentAddress: string;
  try {
    agentAddress = (await requireOwner(req, { agentId: body.agentId })).agent!.agentEvm;
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }

  try {
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
