// File: db/index-hcs.ts
// [Task 5.4b] HCS -> spend_events indexer. Polls the audit topic via the Hedera Mirror Node REST API and
// upserts each ALLOW/DENY the facilitator logged into the index table for fast UI reads.
//
// INVARIANT #3: this is the INDEX layer ONLY. It is NEVER read on any enforcement path - the facilitator
// always reads the live ENS record to gate a payment. The mirror it builds here only powers the console's
// activity feed; a stale/missing row can never change a spend decision.
import { db } from './client';
import { spendEvents } from './schema';
import { desc, eq, like } from 'drizzle-orm';
import type { LogEntry } from '../types';

const MIRROR = 'https://testnet.mirrornode.hedera.com';

type MirrorMessage = { sequence_number: number; message: string };
type MirrorResponse = { messages: MirrorMessage[] };

// The highest sequence number already indexed (so a re-run only pulls new messages). 0 when the table is empty.
async function lastIndexedSeq(): Promise<number> {
  const rows = await db.select({ seq: spendEvents.hcsSequence }).from(spendEvents).orderBy(desc(spendEvents.hcsSequence)).limit(1);
  return rows[0]?.seq ?? 0;
}

// Poll the HCS topic and insert any messages newer than `sinceSeq` into spend_events. Returns the new
// high-water sequence. Idempotent by high-water mark: re-running never double-inserts an already-seen message.
export async function indexTopic(topicId: string, sinceSeq?: number): Promise<number> {
  const from = sinceSeq ?? (await lastIndexedSeq());
  // [WS-7 B3] The mirror rejects `sequencenumber=gt:0` (sequence numbers start at 1). When the index is empty
  // (from=0) fetch from the start with no filter; otherwise only pull messages newer than the high-water mark.
  const seqFilter = from > 0 ? `sequencenumber=gt:${from}&` : '';
  const res = await fetch(`${MIRROR}/api/v1/topics/${topicId}/messages?${seqFilter}order=asc&limit=100`);
  if (!res.ok) throw new Error(`mirror node ${res.status} for topic ${topicId}`);
  const json = (await res.json()) as MirrorResponse;

  let last = from;
  for (const m of json.messages) {
    // A single malformed HCS message must not abort the whole index pass (skip + continue).
    let entry: LogEntry;
    try {
      entry = JSON.parse(Buffer.from(m.message, 'base64').toString()) as LogEntry;
    } catch {
      last = Math.max(last, m.sequence_number); // advance the high-water mark past the bad message
      continue;
    }
    await db.insert(spendEvents).values({
      agentName: entry.name,
      decision: entry.decision,
      amount: entry.amount,
      payTo: entry.payTo,
      reason: entry.reason ?? null,
      hcsSequence: m.sequence_number,
    });
    last = Math.max(last, m.sequence_number);
  }
  return last;
}

// The console activity feed: the most recent indexed spend events (index-only, never gates a payment).
export async function recentSpendEvents(limit = 20) {
  return db.select().from(spendEvents).orderBy(desc(spendEvents.hcsSequence)).limit(limit);
}

// [WS-7 B3] Recent events for a SINGLE agent (its full ENS name), for the /app agent drill-down + the /demo
// audit scroll. Index-only (INVARIANT #3).
export async function recentSpendEventsForAgent(agentName: string, limit = 20) {
  return db.select().from(spendEvents)
    .where(eq(spendEvents.agentName, agentName))
    .orderBy(desc(spendEvents.hcsSequence)).limit(limit);
}

// [WS-7 B3] Recent events across a whole ORG (every agent whose ENS name ends with the org subname), for the
// org-level spend feed. Index-only (INVARIANT #3).
export async function recentSpendEventsForOrg(orgEnsName: string, limit = 50) {
  return db.select().from(spendEvents)
    .where(like(spendEvents.agentName, `%.${orgEnsName}`))
    .orderBy(desc(spendEvents.hcsSequence)).limit(limit);
}
