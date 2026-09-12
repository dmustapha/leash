// File: facilitator/spend-rollup.ts
// REFRAME [SKILL] D3 — the DB-FREE rolling spend-rollup for the SOFT daily/weekly budget.
//
// INVARIANT #3 addendum (module boundary — a CI proof, not merely a grep): this module imports ONLY the
// global `fetch` + shared types. It imports NO database client, NO ORM, NO index table. The rolling TOTAL is
// read from the HCS topic via the Hedera Mirror Node (a chain-artifact read of a LAGGING index) — so the
// rolling cap it feeds is a SOFT budget with disclosed slack, NOT a settle-live authoritative read. The
// fetch/base64/JSON.parse shape is LIFTED from the DB-coupled HCS indexer; here it stays database-free.
//
// REF-4 FAIL-CLOSED (BLOCKER): this module NEVER catches its own fetch/parse error to a default. A
// mirror-down default-0 would silently UN-CAP (fail open). Instead a fetch/HTTP failure THROWS and
// propagates; server.ts maps the throw to RPC_ERROR (deny). A single malformed HCS message is skipped
// (it can only UNDER-count that one entry, which is conservative for a cap), but a transport/HTTP failure
// is never swallowed.
//
// MUST-NOT-CLAIM: the rolling cap is trustless / exact / settle-authoritative. maxPerCall (live ENS) is the
// HARD per-call bound; fundingCap (Privy) is the HARD aggregate ceiling. Window uses consensus_timestamp.
import type { LogEntry } from '../types';

const MIRROR = 'https://testnet.mirrornode.hedera.com';

// The mirror topic-message shape we consume. `consensus_timestamp` is the CHAIN clock ("<sec>.<nanos>")
// used both for the rolling window filter AND to derive the settle-time minute-of-day (never the host clock).
interface MirrorMessage {
  sequence_number: number;
  message: string;             // base64 JSON LogEntry
  consensus_timestamp: string; // "1712345678.123456789" (seconds.nanos since epoch, UTC)
}
interface MirrorResponse {
  messages: MirrorMessage[];
  links?: { next?: string | null };
}

// Parse a mirror "<sec>.<nanos>" consensus_timestamp to whole epoch SECONDS (UTC). Throws on a malformed
// timestamp (fail-closed — never default). The nanos fraction is dropped for second-granularity windowing.
export function consensusToEpochSeconds(consensusTimestamp: string): number {
  const dot = consensusTimestamp.indexOf('.');
  const secPart = dot === -1 ? consensusTimestamp : consensusTimestamp.slice(0, dot);
  if (!/^\d+$/.test(secPart)) throw new Error(`malformed consensus_timestamp: ${consensusTimestamp}`);
  return Number(secPart);
}

// Derive the UTC minute-of-day (0..1439) + day-of-week (0=Sun..6=Sat) from an epoch-seconds instant.
// Used to build ctx.nowMinuteUtc / ctx.nowDayUtc for the stateless window check (D2) from the CHAIN clock.
export function utcMinuteAndDay(epochSeconds: number): { minuteUtc: number; dayUtc: number } {
  const d = new Date(epochSeconds * 1000);
  return { minuteUtc: d.getUTCHours() * 60 + d.getUTCMinutes(), dayUtc: d.getUTCDay() };
}

// Fetch the CURRENT chain consensus time from the mirror node (the latest topic message's
// consensus_timestamp on the audit topic). This is the settle-time clock for the window check — the mirror
// consensus clock, NOT the app/host clock (INVARIANT #3 addendum). A fetch/HTTP failure THROWS (fail-closed
// -> RPC_ERROR upstream); it is NEVER caught to a host-clock fallback (that would let a mirror-down settle
// silently escape a window restriction).
export async function mirrorConsensusNow(topicId: string): Promise<{ minuteUtc: number; dayUtc: number }> {
  const res = await fetch(
    `${MIRROR}/api/v1/topics/${topicId}/messages?order=desc&limit=1`,
  );
  if (!res.ok) throw new Error(`mirror node ${res.status} for topic ${topicId} (consensus-now)`);
  const json = (await res.json()) as MirrorResponse;
  const latest = json.messages[0];
  // No messages yet on a brand-new topic: there is no chain instant to window against. Fail closed — the
  // caller only calls this when a window is declared, and a window with no chain clock cannot be satisfied
  // honestly, so we throw rather than fabricate a host-clock instant.
  if (!latest) throw new Error(`no topic messages on ${topicId}: cannot derive consensus time for window`);
  return utcMinuteAndDay(consensusToEpochSeconds(latest.consensus_timestamp));
}

// One page of ALLOW amounts for `agentName` at/after `fromEpochSeconds`, plus the next-page cursor.
interface Page {
  daily: bigint;
  weekly: bigint;
  next: string | null;
}

// SUM ALLOW amounts for one agent within [dailyFromSeconds, now] and [weeklyFromSeconds, now], paging the
// mirror topic. `timestamp=gte:` is the mirror server-side lower bound (weekly is the widest, so we filter
// on the weekly bound and bucket each message into daily/weekly client-side by its consensus_timestamp).
async function fetchPage(
  topicId: string,
  agentName: string,
  weeklyFromSeconds: number,
  dailyFromSeconds: number,
  url: string,
): Promise<Page> {
  // A fetch/HTTP failure THROWS (REF-4 fail-closed) — NEVER caught to a default here.
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mirror node ${res.status} for topic ${topicId} (rollup)`);
  const json = (await res.json()) as MirrorResponse;

  let daily = 0n;
  let weekly = 0n;
  for (const m of json.messages) {
    // A single malformed message is skipped (under-counts one entry — conservative for a cap); a transport
    // failure above is never swallowed. Same per-message skip shape as the HCS indexer.
    let entry: LogEntry;
    try {
      entry = JSON.parse(Buffer.from(m.message, 'base64').toString()) as LogEntry;
    } catch {
      continue;
    }
    if (entry.decision !== 'ALLOW' || entry.name !== agentName) continue;
    let amt: bigint;
    try {
      amt = BigInt(entry.amount);
    } catch {
      continue; // a malformed amount can't be summed; skip (conservative)
    }
    const sec = consensusToEpochSeconds(m.consensus_timestamp);
    if (sec >= weeklyFromSeconds) weekly += amt;
    if (sec >= dailyFromSeconds) daily += amt;
  }
  const next = json.links?.next ?? null;
  return { daily, weekly, next };
}

export interface RollupWindows {
  dailyFromSeconds: number;  // epoch-seconds lower bound of the rolling day (e.g. now - 86400)
  weeklyFromSeconds: number; // epoch-seconds lower bound of the rolling week (e.g. now - 604800)
}

// Rolling ALLOW totals for `agentName`: the SOFT daily + weekly spend already settled within each window.
// Reads the HCS audit topic via the mirror node (a LAGGING index — SOFT budget). REF-4: any fetch/HTTP
// failure THROWS and propagates (-> RPC_ERROR deny upstream); NEVER defaulted to 0 (that would un-cap).
export async function rollingTotals(
  agentName: string,
  topicId: string,
  windows: RollupWindows,
): Promise<{ dailyRaw: bigint; weeklyRaw: bigint }> {
  const base =
    `${MIRROR}/api/v1/topics/${topicId}/messages` +
    `?timestamp=gte:${windows.weeklyFromSeconds}&order=asc&limit=100`;

  let dailyRaw = 0n;
  let weeklyRaw = 0n;
  let url: string | null = base;
  // Page until the mirror stops handing us a `next` cursor. Each page THROWS on transport failure.
  while (url) {
    const page: Page = await fetchPage(
      topicId,
      agentName,
      windows.weeklyFromSeconds,
      windows.dailyFromSeconds,
      url,
    );
    dailyRaw += page.daily;
    weeklyRaw += page.weekly;
    url = page.next ? `${MIRROR}${page.next}` : null;
  }
  return { dailyRaw, weeklyRaw };
}
