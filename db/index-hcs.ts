// File: db/index-hcs.ts
// [Task 5.4b] HCS -> spend_events indexer. Polls the audit topic via the Hedera Mirror Node REST API and
// upserts each ALLOW/DENY the facilitator logged into the index table for fast UI reads.
//
// INVARIANT #3: this is the INDEX layer ONLY. It is NEVER read on any enforcement path - the facilitator
// always reads the live ENS record to gate a payment. The mirror it builds here only powers the console's
// activity feed; a stale/missing row can never change a spend decision.
import { db } from './client';
import { spendEvents } from './schema';
import { desc } from 'drizzle-orm';
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
  const res = await fetch(`${MIRROR}/api/v1/topics/${topicId}/messages?sequencenumber=gt:${from}&limit=100`);
  if (!res.ok) throw new Error(`mirror node ${res.status} for topic ${topicId}`);
  const json = (await res.json()) as MirrorResponse;

  let last = from;
  for (const m of json.messages) {
    const entry = JSON.parse(Buffer.from(m.message, 'base64').toString()) as LogEntry;
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
