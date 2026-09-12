// File: facilitator/hcs-log.integration.ts
// Task 2.4: real HCS ALLOW + DENY logging (TEST_TIER=integration). Submits one ALLOW and one DENY LogEntry
// to the live HCS_TOPIC_ID and asserts each returns a real consensus sequence number. Mirror-node read-back
// (with propagation delay) is exercised in the live tier / captured by the proof step; here we assert the
// on-chain submit succeeds and prints the sequence numbers for proof capture.
import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import { logDecision } from './hcs-log';
import type { LogEntry } from '../types';

const NAME = 'payments.acme.leash.eth';
const PAYTO = '0.0.98';

describe('Task 2.4 - HCS ALLOW + DENY audit log (live topic)', () => {
  it('submits an ALLOW entry and returns a consensus sequence number', async () => {
    const entry: LogEntry = {
      name: NAME, decision: 'ALLOW', amount: '3000000', payTo: PAYTO, ts: new Date().toISOString(),
    };
    const seq = await logDecision(entry);
    console.log(`[HCS] ALLOW submitted -> topic ${process.env.HCS_TOPIC_ID} seq #${seq}`);
    expect(seq).toBeGreaterThan(0);
  }, 60_000);

  it('submits a DENY entry (with reason) and returns a consensus sequence number', async () => {
    const entry: LogEntry = {
      name: NAME, decision: 'DENY', amount: '50000000', payTo: PAYTO, reason: 'OVER_CAP', ts: new Date().toISOString(),
    };
    const seq = await logDecision(entry);
    console.log(`[HCS] DENY submitted -> topic ${process.env.HCS_TOPIC_ID} seq #${seq}`);
    expect(seq).toBeGreaterThan(0);
  }, 60_000);
});
