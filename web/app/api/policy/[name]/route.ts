// File: web/app/api/policy/[name]/route.ts
// Read the LIVE leash.policy for a name straight from ENS (INVARIANT #3): readPolicy() does a viem
// eth_call to the PermissionedResolver's text(node,'leash.policy') - the SAME primitive the facilitator
// enforces on. This is NOT a DB read, so the SplitScreen can never show a stale/hard-coded policy (F1).
// When the record is empty (post-revoke) readPolicy returns null -> { revoked: true }.
import { NextResponse } from 'next/server';
import { readPolicy } from '../../../../../scripts/ens/policy';
import { readIdentity } from '../../../../../scripts/ens/identity';

export const dynamic = 'force-dynamic'; // never cache: the panel must reflect the on-chain record live

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name: raw } = await ctx.params;
  const name = decodeURIComponent(raw);
  try {
    // [WS-7 D1] Also read the ADVISORY identity records (agent.type/description/avatar). Read on the SAME
    // resolver, but a SEPARATE key namespace - never mixed into the enforcement policy (INVARIANT #13).
    const [policy, identity] = await Promise.all([readPolicy(name), readIdentity(name)]);
    return NextResponse.json({
      name,
      policy,
      identity,
      revoked: policy === null,
      source: 'ENS eth_call: PermissionedResolver.text(namehash(name), "leash.policy")',
      readAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ name, error: 'ENS read failed', message }, { status: 502 });
  }
}
