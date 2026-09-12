// File: facilitator/authorize.test.ts
// Exhaustive offline unit tests for the PURE gate (Task 2.1). Zero infra, zero mocks.
// Covers all 10 GateReason branches (7 base + REFRAME D1 OVER_DAILY_CAP/OVER_WEEKLY_CAP/OUTSIDE_WINDOW) +
// settle happy path + INVARIANT #7 boundary + malformed + REFRAME D2 windows + D3 rolling SOFT caps.
import { describe, it, expect } from 'vitest';
import { authorize, settleOrReason } from './authorize';
import type { AgentPolicy, PaymentContext, GateDecision } from '../types';

// ---- Fixtures. A "clean" policy+ctx that would SETTLE, so each test mutates one field. ----
const PAYER = '0.0.1001';
const PAYEE = '0.0.2002';
const TOKEN = '0.0.3003';

function policy(over: Partial<AgentPolicy> = {}): AgentPolicy {
  return {
    maxPerCall: '5000000', // 5 USDC in raw smallest units (6 decimals)
    allowedPayees: [PAYEE],
    hederaAccount: PAYER, // binding anchor MUST equal ctx.payer
    token: TOKEN,
    ...over,
  };
}

function ctx(over: Partial<PaymentContext> = {}): PaymentContext {
  return {
    agentName: 'acme.leash.eth',
    payer: PAYER,
    amount: 1000000n, // 1 USDC, well under cap
    payTo: PAYEE,
    asset: TOKEN,
    paymentId: 'pay-0001',
    ...over,
  };
}

// Narrowing helpers so assertions read cleanly and TypeScript keeps the closed union honest.
function expectAbort(d: GateDecision): asserts d is { abort: true; reason: GateReasonLocal } {
  expect('abort' in d && d.abort === true).toBe(true);
}
function expectSettle(d: GateDecision): asserts d is { settle: true; auth: SettleAuthLocal } {
  expect('settle' in d && d.settle === true).toBe(true);
}
// Local aliases (avoid re-exporting internal type names).
type GateReasonLocal = Extract<GateDecision, { abort: true }>['reason'];
type SettleAuthLocal = Extract<GateDecision, { settle: true }>['auth'];

describe('authorize() - the 7 GateReason abort branches (INVARIANT #1 fail-closed)', () => {
  it('REVOKED: null policy fails closed', () => {
    const d = authorize(null, ctx(), new Set());
    expectAbort(d);
    expect(d.reason).toBe('REVOKED');
  });

  it('REPLAY: an already-seen paymentId cannot settle again', () => {
    const seen = new Set<string>(['pay-0001']);
    const d = authorize(policy(), ctx({ paymentId: 'pay-0001' }), seen);
    expectAbort(d);
    expect(d.reason).toBe('REPLAY');
  });

  it('BINDING_MISMATCH: record.hederaAccount != ctx.payer (untrusted-header anti-spoof)', () => {
    const d = authorize(policy({ hederaAccount: '0.0.9999' }), ctx({ payer: PAYER }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('BINDING_MISMATCH');
  });

  it('MALFORMED_POLICY: non-numeric maxPerCall ("abc") caught -> aborts', () => {
    const d = authorize(policy({ maxPerCall: 'abc' }), ctx(), new Set());
    expectAbort(d);
    expect(d.reason).toBe('MALFORMED_POLICY');
  });

  it('OVER_CAP: amount strictly greater than maxPerCall', () => {
    const d = authorize(policy({ maxPerCall: '5000000' }), ctx({ amount: 6000000n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OVER_CAP');
  });

  it('OFF_ALLOWLIST: payTo not in allowedPayees', () => {
    const d = authorize(policy({ allowedPayees: ['0.0.7777'] }), ctx({ payTo: PAYEE }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OFF_ALLOWLIST');
  });

  it('OFF_ALLOWLIST: asset token != policy.token', () => {
    const d = authorize(policy({ token: TOKEN }), ctx({ asset: '0.0.8888' }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OFF_ALLOWLIST');
  });

  // RPC_ERROR is produced by the I/O adapter (server.ts) on read failure, never by the pure
  // gate. We assert here that the closed union CAN carry it and the settle-caller handles it,
  // so all 7 reasons are exercised in this tier (INVARIANT #1 completeness).
  it('RPC_ERROR: closed union carries it and the settle-caller resolves it', () => {
    const d: GateDecision = { abort: true, reason: 'RPC_ERROR' };
    expectAbort(d);
    expect(d.reason).toBe('RPC_ERROR');
    expect(settleOrReason(d)).toBe('RPC_ERROR');
  });
});

// REFRAME [SKILL] S3 — binding reconcile for a co-signed KeyList spending account (INVARIANT #8 addendum).
// The binding assertion is `policy.hederaAccount === ctx.payer` — pure account-id-string equality, AGNOSTIC to
// whether the payer is a single-key or a KeyList threshold-2 account. These tests prove the binding holds
// UNCHANGED when the payer IS the KeyList spending account, and still trips on a mismatch. (The gate logic is
// deliberately NOT weakened for the co-sign path; account-type detection lives in the signer, not the gate.)
describe('authorize() - REFRAME S3 binding reconcile for a KeyList spending account', () => {
  const KEYLIST_ACCOUNT = '0.0.10500001'; // a 2-of-2 KeyList[agentPub, leashCoSignerPub] spending account id.

  it('KeyList spending account payer == policy.hederaAccount -> binding passes (settles in-cap)', () => {
    const d = authorize(
      policy({ hederaAccount: KEYLIST_ACCOUNT }),
      ctx({ payer: KEYLIST_ACCOUNT }),
      new Set(),
    );
    expectSettle(d);
    expect(d.auth.amount).toBe(1000000n);
  });

  it('mismatched payer (not the KeyList spending account) -> BINDING_MISMATCH', () => {
    const d = authorize(
      policy({ hederaAccount: KEYLIST_ACCOUNT }),
      ctx({ payer: '0.0.9999' }), // a different account presenting against the KeyList record.
      new Set(),
    );
    expectAbort(d);
    expect(d.reason).toBe('BINDING_MISMATCH');
  });
});

// REFRAME [SKILL] D2 — stateless time-window check (pure; consensus-time minute-of-day via ctx).
// Boundary semantics: start inclusive, end exclusive. Absent window ctx while a window is declared = fail closed.
describe('authorize() - REFRAME D2 stateless time-window (OUTSIDE_WINDOW)', () => {
  // 09:00 UTC = minute 540; 17:00 UTC = minute 1020. Window [540,1020) on any day.
  const WINDOW = [{ startMinuteUtc: 540, endMinuteUtc: 1020 }];

  it('inside the window -> settles', () => {
    const d = authorize(policy({ allowedWindows: WINDOW }), ctx({ nowMinuteUtc: 600, nowDayUtc: 3 }), new Set());
    expectSettle(d);
  });

  it('at the start minute (inclusive) -> settles', () => {
    const d = authorize(policy({ allowedWindows: WINDOW }), ctx({ nowMinuteUtc: 540, nowDayUtc: 1 }), new Set());
    expectSettle(d);
  });

  it('at the end minute (exclusive) -> OUTSIDE_WINDOW', () => {
    const d = authorize(policy({ allowedWindows: WINDOW }), ctx({ nowMinuteUtc: 1020, nowDayUtc: 1 }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OUTSIDE_WINDOW');
  });

  it('before the window -> OUTSIDE_WINDOW', () => {
    const d = authorize(policy({ allowedWindows: WINDOW }), ctx({ nowMinuteUtc: 539, nowDayUtc: 1 }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OUTSIDE_WINDOW');
  });

  it('day-scoped window: right minute, wrong day -> OUTSIDE_WINDOW', () => {
    const wd = [{ startMinuteUtc: 540, endMinuteUtc: 1020, days: [1, 2, 3, 4, 5] }]; // weekdays only
    const d = authorize(policy({ allowedWindows: wd }), ctx({ nowMinuteUtc: 600, nowDayUtc: 0 }), new Set()); // Sunday
    expectAbort(d);
    expect(d.reason).toBe('OUTSIDE_WINDOW');
  });

  it('day-scoped window: right minute, right day -> settles', () => {
    const wd = [{ startMinuteUtc: 540, endMinuteUtc: 1020, days: [1, 2, 3, 4, 5] }];
    const d = authorize(policy({ allowedWindows: wd }), ctx({ nowMinuteUtc: 600, nowDayUtc: 2 }), new Set());
    expectSettle(d);
  });

  it('multiple windows: matches the second -> settles', () => {
    const two = [
      { startMinuteUtc: 0, endMinuteUtc: 60 },       // 00:00-01:00
      { startMinuteUtc: 1200, endMinuteUtc: 1260 },  // 20:00-21:00
    ];
    const d = authorize(policy({ allowedWindows: two }), ctx({ nowMinuteUtc: 1230, nowDayUtc: 4 }), new Set());
    expectSettle(d);
  });

  it('window declared but ctx has no consensus-time (undefined) -> fail closed OUTSIDE_WINDOW', () => {
    const d = authorize(policy({ allowedWindows: WINDOW }), ctx({ nowMinuteUtc: undefined, nowDayUtc: undefined }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OUTSIDE_WINDOW');
  });

  it('empty allowedWindows array -> no restriction (settles)', () => {
    const d = authorize(policy({ allowedWindows: [] }), ctx(), new Set());
    expectSettle(d);
  });
});

// REFRAME [SKILL] D3 — rolling SOFT-budget caps (OVER_DAILY_CAP / OVER_WEEKLY_CAP). Compare is
// rollingRaw + amount > cap, raw-unit BigInt. A present-but-malformed cap -> MALFORMED_POLICY (not skip).
describe('authorize() - REFRAME D3 rolling SOFT caps (OVER_DAILY_CAP / OVER_WEEKLY_CAP)', () => {
  it('daily: rolling + amount <= dailyCap -> settles', () => {
    // rolling 4 USDC + this 1 USDC = 5 == cap 5 -> inclusive, settles.
    const d = authorize(policy({ dailyCap: '5000000' }), ctx({ amount: 1000000n, rollingDailyRaw: 4000000n }), new Set());
    expectSettle(d);
  });

  it('daily: rolling + amount == dailyCap + 1 -> OVER_DAILY_CAP', () => {
    const d = authorize(policy({ dailyCap: '5000000' }), ctx({ amount: 1000001n, rollingDailyRaw: 4000000n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OVER_DAILY_CAP');
  });

  it('daily: near-full rolling total, next pay tips over -> OVER_DAILY_CAP', () => {
    const d = authorize(policy({ dailyCap: '10000000' }), ctx({ amount: 2000000n, rollingDailyRaw: 9000000n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OVER_DAILY_CAP');
  });

  it('daily: missing rollingDailyRaw treated as 0 (fail-closed default is server RPC_ERROR, gate assumes 0)', () => {
    const d = authorize(policy({ dailyCap: '5000000' }), ctx({ amount: 1000000n }), new Set());
    expectSettle(d);
  });

  it('weekly: rolling + amount > weeklyCap -> OVER_WEEKLY_CAP', () => {
    const d = authorize(policy({ weeklyCap: '20000000' }), ctx({ amount: 5000000n, rollingWeeklyRaw: 18000000n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OVER_WEEKLY_CAP');
  });

  it('daily checked before weekly: over daily even if weekly ok -> OVER_DAILY_CAP', () => {
    const d = authorize(
      policy({ dailyCap: '3000000', weeklyCap: '100000000' }),
      ctx({ amount: 2000000n, rollingDailyRaw: 2000000n, rollingWeeklyRaw: 2000000n }),
      new Set(),
    );
    expectAbort(d);
    expect(d.reason).toBe('OVER_DAILY_CAP');
  });

  it('within daily but over weekly -> OVER_WEEKLY_CAP', () => {
    const d = authorize(
      policy({ dailyCap: '100000000', weeklyCap: '5000000' }),
      ctx({ amount: 2000000n, rollingDailyRaw: 0n, rollingWeeklyRaw: 4000000n }),
      new Set(),
    );
    expectAbort(d);
    expect(d.reason).toBe('OVER_WEEKLY_CAP');
  });

  it('malformed dailyCap ("abc") present -> MALFORMED_POLICY (not skip)', () => {
    const d = authorize(policy({ dailyCap: 'abc' }), ctx({ rollingDailyRaw: 0n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('MALFORMED_POLICY');
  });

  it('malformed weeklyCap ("-1") present -> MALFORMED_POLICY', () => {
    const d = authorize(policy({ weeklyCap: '-1' }), ctx({ rollingWeeklyRaw: 0n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('MALFORMED_POLICY');
  });

  it('no dynamic-limit fields -> unaffected (settles; 94-row back-compat)', () => {
    const d = authorize(policy(), ctx(), new Set());
    expectSettle(d);
  });
});

describe('authorize() - settle happy path (only affirmative proceed)', () => {
  it('returns {settle:true, auth} with amount/payTo/agentName and a policyHash', () => {
    const d = authorize(policy(), ctx(), new Set());
    expectSettle(d);
    expect(d.auth.agentName).toBe('acme.leash.eth');
    expect(d.auth.amount).toBe(1000000n);
    expect(d.auth.payTo).toBe(PAYEE);
    expect(d.auth.policyHash).toMatch(/^0x[0-9a-f]{64}$/); // keccak256 hex
  });

  it('does not mutate the injected seen set (caller owns replay lifetime)', () => {
    const seen = new Set<string>();
    authorize(policy(), ctx(), seen);
    expect(seen.size).toBe(0);
  });
});

describe('INVARIANT #7 - raw smallest-unit BigInt boundary (no float, no human units)', () => {
  it('amount == maxPerCall -> settle (inclusive cap)', () => {
    const d = authorize(policy({ maxPerCall: '5000000' }), ctx({ amount: 5000000n }), new Set());
    expectSettle(d);
    expect(d.auth.amount).toBe(5000000n);
  });

  it('amount == maxPerCall + 1n -> OVER_CAP (off-by-one over)', () => {
    const d = authorize(policy({ maxPerCall: '5000000' }), ctx({ amount: 5000001n }), new Set());
    expectAbort(d);
    expect(d.reason).toBe('OVER_CAP');
  });

  it('decimal-string maxPerCall vs hex-decoded amount compare correctly at the boundary', () => {
    // A real x402 payload may decode the amount from hex. 0x4C4B40 == 5_000_000.
    const decoded = BigInt('0x4C4B40'); // hex -> 5000000n
    expect(decoded).toBe(5000000n);
    const atCap = authorize(policy({ maxPerCall: '5000000' }), ctx({ amount: decoded }), new Set());
    expectSettle(atCap);
    const overByOne = authorize(policy({ maxPerCall: '5000000' }), ctx({ amount: decoded + 1n }), new Set());
    expectAbort(overByOne);
    expect(overByOne.reason).toBe('OVER_CAP');
  });

  it('large 18-decimal-scale amounts compare correctly (no precision loss)', () => {
    const big = '1000000000000000000000'; // 1000 * 1e18, beyond Number.MAX_SAFE_INTEGER
    const atCap = authorize(policy({ maxPerCall: big }), ctx({ amount: BigInt(big) }), new Set());
    expectSettle(atCap);
    const over = authorize(policy({ maxPerCall: big }), ctx({ amount: BigInt(big) + 1n }), new Set());
    expectAbort(over);
    expect(over.reason).toBe('OVER_CAP');
  });
});

describe('MALFORMED_POLICY - every non-numeric / negative / empty maxPerCall aborts', () => {
  it.each([
    ['non-numeric', 'abc'],
    ['negative', '-1'],
    ['empty string', ''],
    ['decimal point', '5.0'],
    ['whitespace', ' 5 '],
    ['hex prefix', '0x5'],
    ['plus sign', '+5'],
  ])('maxPerCall=%s (%s) -> MALFORMED_POLICY', (_label, value) => {
    const d = authorize(policy({ maxPerCall: value }), ctx(), new Set());
    expectAbort(d);
    expect(d.reason).toBe('MALFORMED_POLICY');
  });
});

describe('settleOrReason() - structural exhaustive switch over the closed union', () => {
  it('returns null on settle (proceed) and the reason on every abort', () => {
    expect(settleOrReason(authorize(policy(), ctx(), new Set()))).toBeNull();
    const reasons: GateReasonLocal[] = [
      'OVER_CAP', 'OFF_ALLOWLIST', 'REVOKED', 'BINDING_MISMATCH',
      'MALFORMED_POLICY', 'REPLAY', 'RPC_ERROR',
      // REFRAME [SKILL] D1 — dynamic-limit reasons.
      'OVER_DAILY_CAP', 'OVER_WEEKLY_CAP', 'OUTSIDE_WINDOW',
    ];
    for (const reason of reasons) {
      expect(settleOrReason({ abort: true, reason })).toBe(reason);
    }
  });
});
