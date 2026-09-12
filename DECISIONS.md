# Architecture Decision Records — LEASH

One ADR per load-bearing choice made during PRD + architecture. Each names the rejected alternative and why (mandatory).

## ADR-001: Enforce the spend cap at a self-hosted facilitator, not on-chain
- Context: the headline is "revocable name-scoped spend authority enforced at the payment rail." Where does enforcement live?
- Decision: a self-hosted (forked) Hedera x402 facilitator reads the ENS `leash.policy` record pre-settlement and refuses over-cap/off-allowlist/revoked payments.
- Rejected: (a) on-chain trustless cap enforcement — a multi-day smart-contract build (Hedera contract wallet + cap mirror) that does not fit the window; kept as roadmap. (b) Privy per-tx co-sign — collides with the forbidden Backstop co-signer shape (concern #15).
- Consequence: enforcement is honestly facilitator-trusted (must never be pitched as "trustless"); buys a buildable, demoable interlock in the window.
- Where: `facilitator/authorize.ts` + INVARIANTS #1/#4.

## ADR-002: 3-level ENS hierarchy (root → org → agent), not flat per-agent 2LDs
- Context: ENS must be load-bearing (hierarchy + one-write revoke), not a KV store, to win the ENS prize and avoid the "judge sees a database" risk.
- Decision: `<root>.eth` → `<org>.<root>.eth` → `data.<org>.<root>.eth`, with EAC roles as the kill switch.
- Rejected: flat 2LD per agent — reads as a key-value store, weaker ENS depth, no org-wide multi-tenant story.
- Consequence: deeper ENS integration + real multi-tenant orgs; costs an extra provisioning layer (the day-eater, R-2).
- Where: `scripts/ens/*`, ARCHITECTURE §5.

## ADR-003: Privy P-256-owner wallet driven via server-auth, not owner-less policy_ids
- Context: the Privy leaked-key DENY beat must actually block an over-fund.
- Decision: the treasury wallet is created with a P-256 owner and driven via `@privy-io/server-auth` so the funding policy is enforced.
- Rejected: owner-less wallet + `policy_ids` — proven live 2026-09-12 to FAIL OPEN (both chains reached broadcast). It would make the Privy prize demo silently fake.
- Consequence: the DENY is real and structural (wallet-construction requirement); WS-0 must re-prove against the pinned SDK version.
- Where: `treasury/privy.ts` + INVARIANTS #5 + D-4.

## ADR-004: Settle-time authoritative read (onBeforeSettle), verify advisory
- Context: a revoke landing between verify and settle could let an in-flight payment settle (TOCTOU).
- Decision: the authoritative no-cache policy read is in `onBeforeSettle`, immediately before the fee-payer signature; `onBeforeVerify` is an advisory pre-screen (30s cache allowed).
- Rejected: verify-authoritative with a cache — reintroduces the TOCTOU window; a revoked agent could complete an in-flight payment.
- Consequence: one extra ENS read per settle (latency budget < 1.5s p95); closes the in-flight bypass.
- Where: `facilitator/server.ts` + INVARIANTS #2/#3.

## ADR-005: Mint own 6-decimal HTS USDC, not canonical testnet USDC
- Context: the demo needs real value to move without a flaky faucet.
- Decision: mint an own HTS token (6 decimals) and record both its HTS id and EVM-facade address.
- Rejected: canonical testnet USDC `0.0.429274` — faucet unreliable; no control over association/supply for the demo.
- Consequence: "real value" is our own test token (satisfies "real paid request" without faucet risk); note the EVM-facade duality for the Privy funding policy.
- Where: `scripts/hedera/mint-usdc.ts` + D-5.

## ADR-006: Two-path app (judge sandbox + real console), sandbox-first
- Context: judges need zero-setup; the product needs to be real; the clock is hard.
- Decision: `/demo` (pre-seeded, server-side, scored) built FIRST; `/app` (Privy login, multi-tenant, DB, relayer) second, and never allowed to endanger the sandbox.
- Rejected: single dashboard — weaker Privy+ENS depth and no zero-setup judge path; a login-gated single app risks a dead judge experience.
- Consequence: roughly doubles frontend/infra; the sandbox-first discipline protects the scored floor under the minimum-eligible tripwire.
- Where: `web/*`, ARCHITECTURE §12, INVARIANTS #10, D-6.

## ADR-007: Raw smallest-unit BigInt comparison for all caps
- Context: a human-unit or hex/decimal mismatch silently breaks the cap check (R-4).
- Decision: `amount` and `maxPerCall`/`fundingCap` are raw smallest-unit integers compared as BigInt; malformed → `MALFORMED_POLICY`.
- Rejected: human-unit floats — silent mis-evaluation of the headline invariant.
- Consequence: all policy amounts are decimal strings parsed to bigint; boundary + malformed unit tests required.
- Where: `facilitator/authorize.ts` + INVARIANTS #7 + D-8.

## ADR-008: No custom Solidity; enforcement is ENS (external) + the facilitator
- Context: master §12 lists `contracts/` as "if needed."
- Decision: ship no custom Solidity; the ENSv2 contracts (external) + the TypeScript facilitator ARE the enforcement.
- Rejected: a helper Solidity contract — adds deploy/verify surface with no load-bearing role in the hackathon scope.
- Consequence: smaller attack + build surface; the on-chain cap-mirror (which would need Solidity) is explicitly roadmap.
- Where: ARCHITECTURE §1 file tree (no `contracts/`).
