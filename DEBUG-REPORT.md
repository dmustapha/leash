# DEBUG REPORT

## Executive Summary
- **Generated:** 2026-09-12T16:50:00Z
- **Scope:** WS-7 hardening delta (A1-A5 / B1-B3 / C1 / D1 / E1-E2). Main build Phases 0-6 were frozen + previously orchestrator-verified; debug focused the gate on the freshly-written WS-7 code.
- **Mode:** full (deadline ~24h, >6h → all 6 phases)
- **Confidence Score:** 95
- **Unresolved Issues:** 0
- **Security Findings:** CRITICAL: 0, HIGH: 0, MEDIUM: 2 (mock-leaks, handed off to wire)
- **Test Coverage:** unit 44 (6 files) + integration 8 (4 files) + live (vm2 6/6, vm1 3/3, cohold 3/3); test:source ratio 0.88
- **Recommendation:** PROCEED (demoFormat=recorded threshold 65; 95 ≫ 65)

## Baseline Snapshot (Phase 1)
- Test:source ratio 0.88 (PASS ≥0.5). No LEASH-own source without a test at the module level.
- `npm run typecheck`: PASS (tsc --noEmit, 0 errors)
- `npm run test` (unit): 44/44 pass (6 files, incl. new `auth.test.ts` 8, `ratelimit.test.ts` 3)
- `npm run test:integration`: 8/8 pass (4 files, incl. new `replay.integration.ts`, `identity-isolation.integration.ts`)
- `npm run build`: PASS — compiles, 5 pages (`/`, `/app`, `/demo`, `/proof` + APIs)
- Live (fresh): `test:live -- vm2` 6/6, `test:live -- vm1` 3/3, `test:live -- cohold` 3/3
- Dev-server smoke: `/`, `/demo`, `/app`, `/proof`, `/api/feed` all 200

## Known Risks Disposition (Phase 2)
| Risk | Classification | Disposition | Details |
|------|---------------|-------------|---------|
| DEV-030 (new console agent funding DENY) | STRUCTURAL | RISK-CLEARED | Closed by A3 `reconcileFundingAllowlist` — register unions the new agent EVM into the Privy allowlist |
| DEV-035 (raw EAC grantRoles reverts) | STRUCTURAL | RISK-DISMISSED | Correctly handled: `cohold.ts` uses the resolver's scoped `authorizeTextRoles`; proven live (cohold.live 3/3) |
| DEV-033 (A5 Neon dependency on settle, fail-closed) | STRUCTURAL | RISK-ACCEPTED | By design (security > availability, B-05). Handed off: stress (Neon-down fail-closed, DH-3), deploy (keep-warm/Neon reachability, DS-5) |
| DEV-034 (in-process rate-limit/replay, single-instance; XFF spoof) | STRUCTURAL | RISK-ACCEPTED | Correct for single Render instance; documented in LIMITATIONS. Handed off: stress (DH-4) |
| A1 authz IDOR (authed-as-A-targets-B) | TESTABLE | RISK-CLEARED | `auth.test.ts` 8/8 proves 403 on cross-tenant, 401 on no-token/wrong-audience |
| C1 co-hold (additive + scope-guard) | TESTABLE | RISK-CLEARED | `cohold.live.ts` 3/3 on-chain (both hold; out-of-org grant rejected) |

## Delegation Manifest (Phase 3)
**Ownership map:**
| Coverage class | Owner | Where |
|----------------|-------|-------|
| Connections, credentials, integration seams, auth gates on real endpoints, mock-leaks | wire | after debug |
| Demo-path execution (hero flow, once, with teeth) | verify_milestone | after wire |
| Exhaustive journeys, edge/boundary, malformed inputs, attack vectors, fail-closed fault-injection | stress_test | after design_forge |

**Handoff:** 8 owner-routed rows appended to PULSE `## Downstream Items` (DH-1..DH-8) + mirrored in `.debug-state.json delegationHandoff` (see that file). Covers: real authed path (wire), mock-leaks (wire), A5 fail-closed fault-injection (stress), A4 burst (stress), A3 multi-agent union (stress), B1/B2 cross-tenant (stress), C1 persistent co-hold tx (verify_milestone), DEV-014 wording (demo). DS-5/6/7 (from build) already cover keep-warm, demo choreography, and F-016..F-024 gate scoring.

**Smoke:** PASS (`/api/feed` 200 + 4 pages 200).

## Security Audit Results (Phase 4) — structural only
- **Secrets scan:** CLEAN. 153 tracked source files scanned. All `0x[64hex]` matches are the `RESOLVER_ROLES_ALL` bitmap, `ZERO_BYTES32`, or public tx hashes in proof docs. No `sk-`/`ghp_`/`AKIA`/`pk_live`, no hardcoded passwords, no `*_KEY = "0x…"` assignments. Real keys live only in gitignored `.env`.
- **.env hygiene:** no `.env`/`.env.local` tracked by git; `.env`, `.env.*`, `web/.env` all in `.gitignore`.
- **Config:** A4 added the previously-missing rate limiting on `/api/demo` + every console mutation; no exposed admin/debug routes; facilitator is internal (no CORS-wildcard-on-authed surface).
- **New contracts:** none in WS-7 (uses existing ENS contracts via viem) → reentrancy/event/gas contract scans N/A for this delta.
- **Mock-leak scan (MEDIUM ×2, handed off):** `auth.test.ts` mocks Privy + Neon (unit, deliberate — the real authed path can't be exercised without an interactive Privy login) → DH-1 (wire). `db/revoke-sync.test.ts` (build's) mocks the DB → DH-2 (wire).

## Senior Dev Critique (Phase 5) — parallel subagents
- **Backend (code-reviewer):** MUST-FIX 0, SHOULD-FIX 5, NOTE 3. All six target invariants PASS (ownership JOIN from token; union+non-empty funding guard; fail-closed replay persist-before-proceed; additive scope-guarded co-hold; rate limiter sane; no A-acts-on-B on agentId routes).
- **Frontend (code-reviewer):** MUST-FIX 0, SHOULD-FIX 5, NOTE 2. authedFetch attaches Bearer on every mutation; three-state (loading/empty/populated) everywhere; stable list keys; demo tree stays public-only.

## Fix Round Results (Phase 6)
Applied 6 SHOULD-FIX items (MUST-FIX = 0, so this is senior-standard hardening):
1. `relayer/relay.ts` — scope guard `endsWith(org)` → label-boundary (`=== org || endsWith('.'+org)`); closes the `evilacme.leash.eth` substring class. → cohold.live 3/3 confirms.
2. `web/app/api/fund/route.ts` — removed the dead, cross-tenant-capable `agentAddress` branch; fund now requires an owned `agentId` only.
3. `db/index-hcs.ts` — per-message `JSON.parse` try/catch so one malformed HCS message can't abort the whole feed pass.
4. `web/app/app/app-console.tsx` — inlined the `authedFetch` body into `useCallback` (removes the every-render factory call + the exhaustive-deps lint that could fail a lint-on-build).
5. `web/app/app/_components/agent-row.tsx` — `loadActivity` now checks `r.ok` (surfaces feed errors instead of silently showing "no decisions").
6. `web/app/app/_components/register-agent-form.tsx` — guard optional `j.agent`/`j.mintTx`; honest co-hold hint when the embedded wallet isn't ready yet.

Post-fix verification: typecheck PASS, unit 44/44, integration 8/8, build PASS (5 pages), cohold.live 3/3.

**Lens neighbor-behavior check (6.4):** all 5 neighbor contracts SAME (no regression) — VM-1, VM-2, /demo four beats, facilitator pure gate, co-hold grant/scope-guard. None CHANGED, none MISSING.

## Final Snapshot
- Unit: 44/44 (baseline 44). Integration: 8/8 (baseline 8). Live: vm2 6/6, vm1 3/3, cohold 3/3.
- typecheck: PASS. build: PASS (5 pages). Coverage posture: test:source 0.88.
- No new contracts → gas snapshot unchanged from the frozen main build.

## Unresolved Items
None. (2 MEDIUM mock-leaks + all SHOULD-FIX/NOTE items are either fixed or routed as DH-1..DH-8 downstream handoffs.)

## Confidence Score Justification
95. Anchored formula: start 100; MUST-FIX 0, UNRESOLVED 0, SECURITY-CRITICAL/HIGH 0, no unsanctioned skips (full mode, all 6 phases). −5 for the 2 documented MEDIUM mock-leaks (dispositioned as wire handoffs, not shipped-blind). Every WS-7 acceptance (F-016..F-025) has live or unit evidence; both senior critiques approved with zero MUST-FIX; no regression to `/demo` or the 3 prize legs (INVARIANT #10). What would raise it: DH-1/DH-3/DH-6 actioned (real authed path, Neon-down fault-injection, persistent co-hold tx) — those are correctly owned by wire/stress/verify_milestone downstream.
