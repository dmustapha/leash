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
  | 'RPC_ERROR';

export type FundingReason = 'FUNDING_DENIED';

// ---- The org's declared policy, stored as the ENS text record `leash.policy` ----
// All amounts are raw smallest-unit decimal strings (USDC 6 decimals: 5 USDC = "5000000").
export interface AgentPolicy {
  maxPerCall: string;        // raw smallest-unit integer as string
  allowedPayees: string[];   // Hedera account ids "0.0.x"
  hederaAccount: string;     // the agent's Hedera account "0.0.x" (binding anchor)
  token: string;             // the HTS token id "0.0.x"
}

// ---- Decoded payment context handed to the gate ----
export interface PaymentContext {
  agentName: string;   // from X-Leash-Agent header (UNTRUSTED - only names the record)
  payer: string;       // decoded tx payer Hedera account (from the signed payload)
  amount: bigint;      // raw smallest-unit amount decoded from the transfer
  payTo: string;       // recipient Hedera account
  asset: string;       // token id
  paymentId: string;   // unique id of this X-PAYMENT payload (replay key)
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
