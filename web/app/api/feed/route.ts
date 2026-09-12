// File: web/app/api/feed/route.ts
// [WS-7 B3 / F-022] The spend feed. On each read it first pulls any NEW HCS messages into the index
// (indexTopic, best-effort so a mirror hiccup never blanks the feed), then returns the recent ALLOW/DENY
// decisions the facilitator logged to the audit topic. Three scopes:
//   ?orgId=...   -> requireOwner({orgId}); every agent under that org (the /app org-level feed).
//   ?agent=<ens> -> that single agent (the /app agent drill-down).
//   (no param)   -> recent global activity (the /demo Scene 6 audit scroll; public HCS ledger data).
//
// INVARIANT #3: this reads the INDEX mirror of the public HCS topic only. It NEVER gates a payment - the
// facilitator always reads the live ENS record. A stale/missing row here can only affect what the UI shows.
import { NextResponse } from 'next/server';
import {
  indexTopic, recentSpendEvents, recentSpendEventsForAgent, recentSpendEventsForOrg,
} from '../../../../db/index-hcs';
import { requireOwner, authErrorResponse } from '../../../lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get('orgId');
  const agent = url.searchParams.get('agent');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50) || 50, 100);

  // Pull new HCS messages into the index (best-effort: a mirror error must not blank the feed).
  const topicId = process.env.HCS_TOPIC_ID;
  let indexed = false;
  if (topicId) {
    try { await indexTopic(topicId); indexed = true; } catch { indexed = false; }
  }

  try {
    // Org-scoped feed: caller must own the org.
    if (orgId) {
      let org;
      try {
        ({ org } = await requireOwner(req, { orgId }));
      } catch (e) {
        const err = authErrorResponse(e);
        if (err) return NextResponse.json(err.body, { status: err.status });
        throw e;
      }
      const events = await recentSpendEventsForOrg(org.ensName, limit);
      return NextResponse.json({ scope: 'org', ensName: org.ensName, indexed, events });
    }

    // Single-agent drill-down (public HCS ledger data).
    if (agent) {
      const events = await recentSpendEventsForAgent(agent, limit);
      return NextResponse.json({ scope: 'agent', agent, indexed, events });
    }

    // Global recent activity (the /demo audit scroll).
    const events = await recentSpendEvents(limit);
    return NextResponse.json({ scope: 'global', indexed, events });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'feed read failed', message }, { status: 502 });
  }
}
