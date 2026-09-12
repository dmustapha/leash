// File: web/app/api/pay/route.ts
// [Task 5.4b] Trigger a real x402 payment from a console agent (ARCHITECTURE §12). The route looks the agent up
// in the index to get its canonical account + custody key, then drives the PROVEN pay() rail (agent/pay.ts)
// against the resource server. The facilitator enforces the org's LIVE ENS-declared cap/allowlist - so an
// in-cap call settles and an over-cap (amountRawOverride) call is refused (OVER_CAP), proving the leash live.
//
// INVARIANT #6: the agent's custody secp256k1 key signs the transfer here on the PAYMENT rail; Privy is the
// funding rail only and never co-signs. INVARIANT #3: no DB read gates the spend - the facilitator reads ENS
// live; this route only fetches the agent's own account/key material to build the signed payload.
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { agents } from '../../../../db/schema';
import { pay } from '../../../../agent/pay';
import { resourcePremiumUrl } from '../../../lib/demo';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // a real settle round-trips the facilitator + Hedera

// POST: pay from an agent. Body: { agentId, amountRawOverride? }. Default price is the endpoint's in-cap price;
// pass amountRawOverride (e.g. "50000000") to force an over-cap attempt the facilitator must refuse.
export async function POST(req: Request) {
  let body: { agentId?: string; amountRawOverride?: string };
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
    if (!agent.agentKey || !agent.hederaAccount) {
      return NextResponse.json({ error: 'agent has no custody key on this index (re-register)' }, { status: 409 });
    }

    const r = await pay({
      endpoint: resourcePremiumUrl(),
      agentName: agent.ensName,
      agentAccountId: agent.hederaAccount,
      agentKey: agent.agentKey,
      ...(body.amountRawOverride ? { amountRawOverride: body.amountRawOverride } : {}),
    });

    const settled = r.settle?.success === true;
    const reason = settled ? null : r.settle?.errorReason ?? 'REFUSED';
    return NextResponse.json({
      verdict: settled ? 'ALLOW' : 'DENY',
      status: r.status,
      settled,
      txId: r.settle?.transaction ?? null,
      payer: r.settle?.payer ?? null,
      reason,
      note: settled
        ? 'In-cap payment settled on Hedera. Gas paid by the facilitator fee-payer, not the agent.'
        : 'Payment refused by the facilitator against the org ENS-declared policy. No transfer settled.',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'payment failed', message }, { status: 500 });
  }
}
