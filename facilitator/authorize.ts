// File: facilitator/authorize.ts
// PURE gate decision. Imports ONLY types. No I/O - unit-testable with zero mocks.
// INVARIANT #1: returns a closed GateDecision; "proceed" cannot be produced without {settle:true}.
import { keccak256, toBytes } from 'viem';
import type { AgentPolicy, PaymentContext, GateDecision } from '../types';

// Parse a raw smallest-unit decimal string to bigint; throws on malformed (caught by caller -> MALFORMED_POLICY).
// Rejects non-numeric ("abc"), negative ("-1"), and empty via the digits-only regex (INVARIANT #7).
function parseRaw(s: string): bigint {
  if (!/^\d+$/.test(s)) throw new Error('malformed');
  return BigInt(s);
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
    default:
      return _assertNever(d.reason);
  }
}
