// File: facilitator/spend-rollup.test.ts
// REFRAME [SKILL] D3 — offline unit tests for the DB-FREE spend-rollup. Covers the pure consensus-time
// helpers + the REF-4 fail-closed contract (a mirror fetch failure THROWS, never defaults to 0 / a host
// clock). Network is stubbed; no real mirror call. Deterministic, zero-credential (unit tier).
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  consensusToEpochSeconds,
  utcMinuteAndDay,
  rollingTotals,
  mirrorConsensusNow,
} from './spend-rollup';

afterEach(() => vi.unstubAllGlobals());

describe('consensusToEpochSeconds - parse mirror "<sec>.<nanos>" (never the host clock)', () => {
  it('parses seconds, drops the nanos fraction', () => {
    expect(consensusToEpochSeconds('1712345678.123456789')).toBe(1712345678);
  });
  it('parses a bare seconds value (no dot)', () => {
    expect(consensusToEpochSeconds('1712345678')).toBe(1712345678);
  });
  it('throws (fail-closed) on a malformed timestamp — never defaults', () => {
    expect(() => consensusToEpochSeconds('not-a-ts')).toThrow(/malformed/);
    expect(() => consensusToEpochSeconds('')).toThrow(/malformed/);
  });
});

describe('utcMinuteAndDay - derive minute-of-day + day-of-week (UTC) from epoch seconds', () => {
  it('2024-01-03 (Wed) 09:00:00 UTC -> minute 540, day 3', () => {
    const epoch = Date.UTC(2024, 0, 3, 9, 0, 0) / 1000; // Jan 3 2024 is a Wednesday
    expect(utcMinuteAndDay(epoch)).toEqual({ minuteUtc: 540, dayUtc: 3 });
  });
  it('2024-01-07 (Sun) 00:00:00 UTC -> minute 0, day 0', () => {
    const epoch = Date.UTC(2024, 0, 7, 0, 0, 0) / 1000; // Sunday
    expect(utcMinuteAndDay(epoch)).toEqual({ minuteUtc: 0, dayUtc: 0 });
  });
  it('23:59 UTC -> minute 1439', () => {
    const epoch = Date.UTC(2024, 0, 3, 23, 59, 0) / 1000;
    expect(utcMinuteAndDay(epoch).minuteUtc).toBe(1439);
  });
});

describe('REF-4 fail-closed: a mirror failure THROWS (never a default-0 / host-clock un-cap)', () => {
  it('rollingTotals throws on a non-ok mirror response (mirror-down -> RPC_ERROR upstream)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })));
    await expect(
      rollingTotals('acme.leash.eth', '0.0.999', { dailyFromSeconds: 0, weeklyFromSeconds: 0 }),
    ).rejects.toThrow(/mirror node 503/);
  });

  it('mirrorConsensusNow throws on a non-ok mirror response (never falls back to the host clock)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await expect(mirrorConsensusNow('0.0.999')).rejects.toThrow(/mirror node 500/);
  });

  it('mirrorConsensusNow throws when the topic has no messages (no chain instant to window against)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ messages: [] }) })));
    await expect(mirrorConsensusNow('0.0.999')).rejects.toThrow(/no topic messages/);
  });
});

describe('rollingTotals - SUM decision===ALLOW amounts per agent within the window (BigInt)', () => {
  function msg(name: string, decision: 'ALLOW' | 'DENY', amount: string, sec: number, seq: number) {
    return {
      sequence_number: seq,
      consensus_timestamp: `${sec}.000000000`,
      message: Buffer.from(JSON.stringify({ name, decision, amount, payTo: '0.0.2002', ts: '' })).toString('base64'),
    };
  }

  it('sums only this agent’s ALLOW amounts; DENY + other agents excluded; day vs week bucketed', async () => {
    const now = 1_000_000;
    const dailyFrom = now - 100;   // recent
    const weeklyFrom = now - 1000; // wider
    const messages = [
      msg('acme.leash.eth', 'ALLOW', '1000000', now - 50, 1),   // in daily + weekly
      msg('acme.leash.eth', 'ALLOW', '2000000', now - 500, 2),  // weekly only (older than dailyFrom)
      msg('acme.leash.eth', 'DENY', '9000000', now - 10, 3),    // excluded (DENY)
      msg('other.leash.eth', 'ALLOW', '5000000', now - 10, 4),  // excluded (other agent)
    ];
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ messages, links: { next: null } }) })));

    const totals = await rollingTotals('acme.leash.eth', '0.0.999', {
      dailyFromSeconds: dailyFrom,
      weeklyFromSeconds: weeklyFrom,
    });
    expect(totals.dailyRaw).toBe(1000000n);          // only the recent ALLOW
    expect(totals.weeklyRaw).toBe(3000000n);         // both ALLOWs (1M + 2M)
  });
});
