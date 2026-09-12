// File: facilitator/authorize.ts
// PURE gate decision. Imports ONLY types. No I/O - unit-testable with zero mocks.
// INVARIANT #1: returns a closed GateDecision; "proceed" cannot be produced without {settle:true}.
import { keccak256, toBytes } from 'viem';
import type { AgentPolicy, PaymentContext, GateDecision, TimeWindow } from '../types';

// Parse a raw smallest-unit decimal string to bigint; throws on malformed (caught by caller -> MALFORMED_POLICY).
// Rejects non-numeric ("abc"), negative ("-1"), and empty via the digits-only regex (INVARIANT #7).
function parseRaw(s: string): bigint {
  if (!/^\d+$/.test(s)) throw new Error('malformed');
  return BigInt(s);
}

// REFRAME [SKILL] D2 — PURE stateless window match. A window MATCHES when the settle's consensus-time
// minute-of-day is in [startMinuteUtc, endMinuteUtc) (start inclusive, end exclusive) AND (days omitted
// OR nowDayUtc ∈ days). No I/O, no host clock — driven entirely by the ctx fields the server derived from
// the mirror consensus timestamp (INVARIANT #3 addendum: window by consensus_timestamp, never the app clock).
function matchesWindow(w: TimeWindow, nowMinuteUtc: number, nowDayUtc: number): boolean {
  if (w.days && !w.days.includes(nowDayUtc)) return false;
  return nowMinuteUtc >= w.startMinuteUtc && nowMinuteUtc < w.endMinuteUtc;
}

// seen: replay guard (paymentId set). Injected so the caller owns lifetime/persistence.
export function authorize(
  policy: AgentPolicy | null,
  ctx: PaymentContext,
  seen: Set<string>,
): GateDecision {
  // Revoked / empty policy -> fail closed.
  if (policy === null) return { abort: true, reason: 'REVOKED' };

  // Replay: a paymentId we already settled cannot settle again.
  if (seen.has(ctx.paymentId)) return { abort: true, reason: 'REPLAY' };

  // Binding anti-spoof (INVARIANT #8): the record's hederaAccount MUST equal the actual payer.
  // The X-Leash-Agent header only NAMED which record to read; it is untrusted.
  if (policy.hederaAccount !== ctx.payer) return { abort: true, reason: 'BINDING_MISMATCH' };

  // Cap: raw-unit BigInt compare (INVARIANT #7). Malformed cap -> MALFORMED_POLICY.
  let maxPerCall: bigint;
  try {
    maxPerCall = parseRaw(policy.maxPerCall);
  } catch {
    return { abort: true, reason: 'MALFORMED_POLICY' };
  }
  if (ctx.amount > maxPerCall) return { abort: true, reason: 'OVER_CAP' };

  // Allowlist.
  if (!policy.allowedPayees.includes(ctx.payTo)) return { abort: true, reason: 'OFF_ALLOWLIST' };

  // Token must match the policy's declared token.
  if (policy.token !== ctx.asset) return { abort: true, reason: 'OFF_ALLOWLIST' };

  // REFRAME [SKILL] D2 — stateless time-window check (PURE). If the policy declares a non-empty
  // allowedWindows, the settle's consensus-time minute-of-day (ctx.nowMinuteUtc / ctx.nowDayUtc, derived
  // by the server from the mirror consensus timestamp) MUST fall inside at least one window; else fail
  // closed OUTSIDE_WINDOW (no settle). Absent window ctx while a window is declared also fails closed —
  // the server always sets these before calling the gate when a window is declared; a missing value here
  // is treated as "outside" (fail-closed), never "skip". Boundary: start inclusive, end exclusive.
  if (policy.allowedWindows && policy.allowedWindows.length > 0) {
    const min = ctx.nowMinuteUtc;
    const day = ctx.nowDayUtc;
    const inside =
      min !== undefined &&
      day !== undefined &&
      policy.allowedWindows.some((w) => matchesWindow(w, min, day));
    if (!inside) return { abort: true, reason: 'OUTSIDE_WINDOW' };
  }

  // REFRAME [SKILL] D3 — rolling SOFT-budget caps (over the LAGGING mirror index; NOT trustless/exact/
  // settle-authoritative — INVARIANT #3 addendum). Evaluated ONLY when the policy declares the cap. A
  // present-but-malformed cap ⇒ MALFORMED_POLICY (fail closed, NOT skip), reusing the parseRaw pattern.
  // The rolling total (ctx.rollingDailyRaw/rollingWeeklyRaw) is computed by the server via spend-rollup
  // BEFORE this call; a missing rolling value while a cap is declared is treated as 0n (the server only
  // omits it when it could not be computed, and a spend-rollup THROW already fails the settle upstream as
  // RPC_ERROR — so we never silently un-cap here). Compare is raw-unit BigInt (INVARIANT #7).
  if (policy.dailyCap !== undefined) {
    let dailyCap: bigint;
    try {
      dailyCap = parseRaw(policy.dailyCap);
    } catch {
      return { abort: true, reason: 'MALFORMED_POLICY' };
    }
    const rollingDaily = ctx.rollingDailyRaw ?? 0n;
    if (rollingDaily + ctx.amount > dailyCap) return { abort: true, reason: 'OVER_DAILY_CAP' };
  }
  if (policy.weeklyCap !== undefined) {
    let weeklyCap: bigint;
    try {
      weeklyCap = parseRaw(policy.weeklyCap);
    } catch {
      return { abort: true, reason: 'MALFORMED_POLICY' };
    }
    const rollingWeekly = ctx.rollingWeeklyRaw ?? 0n;
    if (rollingWeekly + ctx.amount > weeklyCap) return { abort: true, reason: 'OVER_WEEKLY_CAP' };
  }

  const policyHash = keccak256(toBytes(JSON.stringify(policy)));
  return {
    settle: true,
    auth: { agentName: ctx.agentName, amount: ctx.amount, payTo: ctx.payTo, policyHash },
  };
}

// ---- Structural fail-closed proof (INVARIANT #1, R-6) ----
// Exhaustiveness guard: a future GateReason with no branch is a COMPILE ERROR here, not a
// runtime demo failure. This lives in the PURE gate file so the fail-closed structure is
// provable with zero infrastructure (Task 2.1).
function _assertNever(x: never): never {
  throw new Error('unhandled GateReason: ' + String(x));
}

// The settle-caller switch: translates a closed GateDecision into a proceed/deny action.
// Removing any `case` below drops a GateReason from the union covered, so `d.reason` is no
// longer `never` in the default arm and `_assertNever(d.reason)` fails to typecheck.
// Returns null on proceed (settle) and the reason string on abort.
export function settleOrReason(d: GateDecision): string | null {
  if ('settle' in d) return null; // proceed: ONLY affirmative path (narrows to the settle variant)
  switch (d.reason) {
    case 'OVER_CAP':
      return 'OVER_CAP';
    case 'OFF_ALLOWLIST':
      return 'OFF_ALLOWLIST';
    case 'REVOKED':
      return 'REVOKED';
    case 'BINDING_MISMATCH':
      return 'BINDING_MISMATCH';
    case 'MALFORMED_POLICY':
      return 'MALFORMED_POLICY';
    case 'REPLAY':
      return 'REPLAY';
    case 'RPC_ERROR':
      return 'RPC_ERROR';
    // REFRAME [SKILL] D1 — dynamic-limit reasons (a missing case here is a COMPILE error, INVARIANT #1).
    case 'OVER_DAILY_CAP':
      return 'OVER_DAILY_CAP';
    case 'OVER_WEEKLY_CAP':
      return 'OVER_WEEKLY_CAP';
    case 'OUTSIDE_WINDOW':
      return 'OUTSIDE_WINDOW';
    default:
      return _assertNever(d.reason);
  }
}
