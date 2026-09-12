# Wire Report — LEASH (REFRAME re-wire)

**Status:** WIRED
**Date:** 2026-09-12
**Project:** LEASH — ENS-governed 2-of-2 co-signed spend control for external agents
**Pipeline position:** After debug (confidence 96), before verify_milestone
**Mode:** standalone (no conductor), autonomous_mode=false → autonomous continuation authorized by user

## Executive Summary

The REFRAME re-wire proves the register-EXISTING (bind) control plane end-to-end with a **real Privy-signed token**, closes the two wire-owned downstream items (RF-1 P1, DH-2 P2), and re-confirms the LIVE Hedera co-signed paid request (brief's #1 wire requirement) plus the on-chain-resolved identity leg. Zero failures, zero unresolved, no fixes required. Honesty locks intact (Control=TRUE, Trustless=FALSE, ERC-8004=on-chain-resolved, rolling caps=SOFT, SR-1).

**Headless-auth unlock (the RF-1/DH-1 blocker for 2 cycles):** Privy's `getTestAccessToken()` throws `Must specify origin` (auth API requires an Origin header the SDK omits). Replicated the passwordless-test-token flow manually with an allow-listed `Origin: http://localhost:3000` header (`scripts/wire/mint-token.ts`) → a genuine Privy JWT that `verifyAuthToken` accepts. This makes the authed console path testable headlessly and repeatably (verify/stress can reuse it). User enabled Privy Test accounts in the dashboard (Test account 1).

## Project Topology

| Component | Type | Entry Point |
|-----------|------|-------------|
| web (Next.js console + /demo + /proof + /app) | frontend+api | `web/app` |
| facilitator (self-hosted @x402/core+@x402/hedera, Blocky402-equivalent) | service | `facilitator/server.ts` (:8401) |
| resource-server (x402-gated /premium) | service | `resource-server/server.ts` (:8402) |
| relayer (ENS-write sponsor) | lib | `relayer/relay.ts` |
| scripts/ens (subname/policy/identity/erc8004/cohold) | lib | `scripts/ens/*` |
| treasury/privy (funding allowlist reconcile) | lib | `treasury/privy.ts` |
| db (Neon Postgres index + seen_payments) | database | `db/client.ts` |

## Connection Graph (tested)

| From | To | Type | Credential | Priority | Status |
|------|----|------|-----------|----------|:------:|
| web /api/agents (bind) | Privy verifyAuthToken (requireOwner) | sdk-auth | PRIVY_APP_ID/SECRET | critical | PASS |
| web /api/agents (bind) | erc8004 resolve (Sepolia registry 0x8004A818…) | rpc-read | SEPOLIA_RPC_URL | critical | PASS |
| web /api/agents (bind) | Hedera co-signed account provision | sdk | HEDERA_OPERATOR_KEY, COSIGN_* | critical | PASS |
| web /api/agents (bind) | relayer ENS mint + setPolicy (Sepolia) | contract-call | LEASH_DEPLOYER_KEY | critical | PASS |
| web /api/agents (bind) | Neon index insert | database | DATABASE_URL | critical | PASS |
| web /api/revoke | markAgentRevoked → Neon | database | DATABASE_URL | standard | PASS |
| facilitator | Hedera co-signed settle (KeyList 2-of-2) | sdk | HEDERA_OPERATOR_KEY, LEASH_COSIGNER_KEY | critical | PASS |
| facilitator | Hedera Mirror Node (spend rollup, co-sign routing) | api-read | (hardcoded testnet mirror) | critical | PASS |
| web /api/feed | HCS indexer → Neon | database | DATABASE_URL | standard | PASS (debug) |

## Credential Audit

All required credentials present, non-empty, format-valid in `.env` (gitignored, never committed). Key set: `PRIVY_APP_ID/SECRET`, `HEDERA_OPERATOR_ID/KEY`, `LEASH_COSIGNER_KEY` (≠ operator, asserted at startup), `COSIGN_AGENT_PUB/KEY`, `COSIGN_SPENDING_ACCOUNT`, `LEASH_DEPLOYER_KEY/ADDRESS`, `SEPOLIA_RPC_URL`, `HEDERA_EVM_RPC`, `DATABASE_URL`, `USDC_TOKEN_ID`, `RECEIVER_ACCOUNT_ID`, `TREASURY_*`. Resolved: all. Unresolved: none. Mock flags active: none.

## Integration Test Results

| Connection / Beat | Test | Result | Evidence |
|-------------------|------|:------:|----------|
| Auth gate — no token | `POST /api/agents` (bind) no Bearer | **401** | `{"error":"missing or malformed Authorization: Bearer token"}` |
| Auth gate — garbage token | `POST /api/agents` bad Bearer | **401** | `{"error":"invalid or expired auth token"}` |
| **RF-1** authed bind → 200 | `scripts/wire/rf1.ts` (real Privy JWT) | **PASS** | `bound:true`; cosigned acct `0.0.10511140` (long-zero `0x00…a06324`, cosignerPub `033ba0…`); identity erc8004 agentId 7395 → `0x92AAe…`, CAIP `eip155:11155111/erc721:0x8004A818…/7395`, label `on-chain-resolved`; `policyTx 0x4c254de9…`; ENS mint present |
| **RF-1** IDOR → 403 | same token targets `consoleco` org | **PASS** | `403 {"error":"not the owner of this org"}` |
| **DH-2** revoke → index sync (live Neon) | `scripts/wire/dh2-revoke-sync.ts` | **PASS** | `active` → `revoked` against live Neon (unit test had mocked pg) |
| erc8004 resolve (R1) | `npm run test:live -- erc8004` | **3/3** | agentId 7395 → `0x92AAe…`, mismatch+unknown throw |
| **Hedera co-signed paid request** (brief #1) | `npm run test:live -- vm3` | **7 live / 1 integ** | co-signed settle `0.0.10487802@…`; agent-alone MISSING_COSIGN; LEASH-alone can't move (SR-1); over-cap / over-daily / outside-window DENY; revoke fail-closed. HashScan evidence in submission/proof.md |

## Conditional Phases

- **Privacy audit (5.5):** SKIPPED — no FHE/ZK/confidential keywords in the codebase (reframe is 2-of-2 co-signed Hedera accounts, not encrypted state).
- **Cross-account isolation (5.6):** PASS — the RF-1 IDOR test is the isolation proof: authed-as-A (`did:privy:cmtyxugux…`) cannot bind/read/mutate under user B's org (`consoleco`, owner `e2e-user-fixed`) → 403. Multi-user model; ownership JOIN in `requireOwner` re-derives identity from the verified token, never client input.
- **Async latency (5.7):** co-sign routing (`isKeyListAccount`) adds ~1 Hedera Mirror Node GET each at verify + submit to every settle, including the frozen `/demo` path. Category MEDIUM (mirror round-trips, seconds-scale). Routed to demo_rehearsal (RF-6: budget added latency with spinner/wait markers) and stress_test (RF-5: prove /demo settle denies on mirror outage, settles identically when up). Fail-CLOSED confirmed by vm3 BEAT-7 (mirror-down → RPC_ERROR, no wrong-settle).

## Downstream Items — wire actions

| ID | Item | Outcome |
|----|------|---------|
| RF-1 | authed bind e2e with live Privy owner token | **CLOSED — PASS** (200 + 403, real JWT via manual mint) |
| DH-1 | authed console 200 + cross-tenant 403 | **CLOSED** (subsumed by RF-1) |
| DH-2 | real revoke → index sync vs live Neon | **CLOSED — PASS** |
| RF-3 | score F-026..F-032 at every gate | carried → verify_milestone / stress_test / verify_preflight |
| RF-4 | env-configurable mirror base for live BEAT-7 | carried → stress_test (rolling-WIDTH half already consensus-anchored ✓) |
| RF-5 | /demo settle denies on mirror outage | carried → stress_test |
| RF-6 | budget co-sign mirror latency on camera | carried → demo_rehearsal |

## Known Artifacts

- On-chain: `rf1x020998.acme.leash.eth` was minted with a live `leash.policy` during RF-1; only its Neon index row was deleted (cleanup). The stray ENS record is not demo-visible (console reads the index) and harmless. Not clearing on-chain to avoid an unnecessary Sepolia tx.

## Summary

- Components discovered: 7 · Connections tested: 10 · Credentials: all resolved · Mock flags: 0
- Integration tests: **all PASS** (2 auth-gate 401 · RF-1 200+403 · DH-2 · erc8004 3/3 · vm3 7-live/1-integ)
- Fixes required: **0** · Unresolved: **0** · Honesty locks: intact
- **Status: WIRED** → proceed to verify_milestone (Step 3 runs the demo path with teeth).
