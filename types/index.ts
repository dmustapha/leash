// File: types/index.ts
// All shared types. Order: enums -> data structures -> gate decision -> API shapes.

// ---- Rejection codes (surfaced verbatim in README Core-Invariants by deploy) ----
export type GateReason =
  | 'OVER_CAP'
  | 'OFF_ALLOWLIST'
  | 'REVOKED'
  | 'BINDING_MISMATCH'
  | 'MALFORMED_POLICY'
  | 'REPLAY'
  | 'RPC_ERROR'
  // REFRAME [SKILL] D1 — dynamic-limit reasons (rolling SOFT-budget caps + stateless windows).
  | 'OVER_DAILY_CAP'   // rollingDailyRaw + amount > dailyCap (SOFT budget over the lagging mirror index)
  | 'OVER_WEEKLY_CAP'  // rollingWeeklyRaw + amount > weeklyCap (SOFT budget over the lagging mirror index)
  | 'OUTSIDE_WINDOW';  // the settle's consensus-time minute-of-day is not inside any allowedWindows entry

export type FundingReason = 'FUNDING_DENIED';

// ---- REFRAME [SKILL] D1 — a stateless time-window (no persisted state; evaluated against the settle's
// mirror consensus-time). A window MATCHES when the settle's consensus-time minute-of-day is in
// [startMinuteUtc, endMinuteUtc) (start inclusive, end exclusive) AND (days omitted OR nowDayUtc ∈ days),
// where days are UTC day-of-week 0=Sunday..6=Saturday. Minutes are 0..1439 (minute-of-day UTC).
export interface TimeWindow {
  startMinuteUtc: number;   // inclusive lower bound, 0..1439 (UTC minute-of-day)
  endMinuteUtc: number;     // exclusive upper bound, 0..1440 (UTC minute-of-day)
  days?: number[];          // optional UTC day-of-week allowlist (0=Sun..6=Sat); omitted = every day
}

// ---- The org's declared policy, stored as the ENS text record `leash.policy` ----
// All amounts are raw smallest-unit decimal strings (USDC 6 decimals: 5 USDC = "5000000").
// REFRAME [SKILL] D1: dynamic limits are OPTIONAL additive fields. `dailyCap`/`weeklyCap` are SOFT budgets
// over the lagging HCS/mirror index (INVARIANT #3 addendum — NEVER trustless/exact/settle-authoritative);
// `maxPerCall` remains the HARD per-call bound. Field order below is CANONICAL: when the optional fields
// are present they are appended in this exact order so JSON.stringify(policy) -> policyHash stays STABLE.
export interface AgentPolicy {
  maxPerCall: string;        // raw smallest-unit integer as string (HARD per-call bound)
  allowedPayees: string[];   // Hedera account ids "0.0.x"
  hederaAccount: string;     // the agent's Hedera account "0.0.x" (binding anchor)
  token: string;             // the HTS token id "0.0.x"
  dailyCap?: string;         // OPTIONAL raw smallest-unit SOFT daily budget (rolling, over the mirror index)
  weeklyCap?: string;        // OPTIONAL raw smallest-unit SOFT weekly budget (rolling, over the mirror index)
  allowedWindows?: TimeWindow[]; // OPTIONAL stateless time-windows; empty/absent = no window restriction
}

// ---- Decoded payment context handed to the gate ----
export interface PaymentContext {
  agentName: string;   // from X-Leash-Agent header (UNTRUSTED - only names the record)
  payer: string;       // decoded tx payer Hedera account (from the signed payload)
  amount: bigint;      // raw smallest-unit amount decoded from the transfer
  payTo: string;       // recipient Hedera account
  asset: string;       // token id
  paymentId: string;   // unique id of this X-PAYMENT payload (replay key)
  // ---- REFRAME [SKILL] D1 — dynamic-limit context (ALL OPTIONAL: existing call sites compile unchanged;
  // the 94-row back-compat). The server derives these from the mirror consensus clock + spend-rollup ONLY
  // when the relevant policy field is declared; the pure gate reads them only when the policy asks. ----
  nowMinuteUtc?: number;      // window check: minute-of-day (0..1439) from the mirror consensus time
  nowDayUtc?: number;         // window check: UTC day-of-week (0=Sun..6=Sat) from the mirror consensus time
  rollingDailyRaw?: bigint;   // SOFT daily total already ALLOW-settled in the rolling day (from spend-rollup)
  rollingWeeklyRaw?: bigint;  // SOFT weekly total already ALLOW-settled in the rolling week (from spend-rollup)
}

// ---- Affirmative authorization payload (only produced on settle) ----
export interface SettleAuth {
  agentName: string;
  amount: bigint;
  payTo: string;
  policyHash: string;  // keccak of the policy read at settle time (audit anchor)
}

// ---- The closed gate decision. NO third inhabitant, NO void proceed (INVARIANT #1). ----
export type GateDecision =
  | { settle: true; auth: SettleAuth }
  | { abort: true; reason: GateReason };

// ---- HCS audit entry ----
export interface LogEntry {
  name: string;
  decision: 'ALLOW' | 'DENY';
  amount: string;
  payTo: string;
  reason?: GateReason;
  ts: string;          // ISO
}

// ---- Funding (Privy rail) ----
export interface FundingRequest {
  agentAddress: string;  // EVM-facade address of the agent (transfer._to)
  amountRaw: string;     // raw smallest-unit
}
export type FundingResult =
  | { funded: true; txHash: string }
  | { denied: true; reason: FundingReason };

// ---- DB row shapes (index layer only) ----
export interface SpendEvent {
  id: string;
  agentName: string;
  decision: 'ALLOW' | 'DENY';
  amount: string;
  payTo: string;
  reason: string | null;
  hcsSequence: number;
  ts: string;
}
