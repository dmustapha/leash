# DEBUG REPORT — REFRAME RE-RUN (2-of-2 co-sign spend-control plane)

> This is the debug re-run over the **REFRAME build-delta** (Groups F/S/R/D/V — external-identity binding + 2-of-2 co-signed Hedera spending account + dynamic limits + register-existing flow). The WS-7 report is preserved below. The frozen floor (`/demo`, `/api/demo`, `provision-canonical.ts`, `ensureCanonicalAgent`, VM-1/VM-2) is NO-TOUCH and was NOT re-litigated.

## Executive Summary (REFRAME)
- **Generated:** 2026-09-12T21:21:00Z
- **Scope:** REFRAME delta only (co-sign / dynamic-limits / identity-binding / register-bind surfaces). Frozen floor + WS-7 already passed debug; not re-reviewed.
- **Mode:** full (deadline 2026-09-13 16:00 UTC, ~19h out → all 6 phases)
- **Confidence Score:** 96
- **Unresolved Issues:** 0
- **Security Findings:** CRITICAL 0, HIGH 0, MEDIUM 0 (the only test mock — `erc8004.test.ts` viem stub — is backed by `erc8004.live` 3/3, not a leak)
- **Test Coverage:** unit 102/102 (11 files) + integration 8/8 (4 files) + live (erc8004 3/3 + VM-3 hero 7 live/1 integration, re-run post-fix); reframe surfaces cosign/spend-rollup/authorize/erc8004/provision all unit-tested
- **Recommendation:** PROCEED (demoFormat unknown → default threshold 75; 96 ≫ 75). Hand to **wire** (RF-1).

### Honesty locks — verified IN CODE (both senior critiques + orchestrator read)
- **SR-1 (linchpin):** `COSIGN_AGENT_KEY` (agent private key) is NEVER read by `facilitator/`, `db/`, or web runtime — only by `agent/*` + `scripts/hedera/*` (the agent-side actor + demo provisioner). `bindExistingAgent` requires the agent-supplied `agentPub` (400 without it) and indexes `agentKey:''`. **F-031 holds.**
- **Trustless=FALSE / Control=TRUE:** no code or comment implies the chain enforces the cap; the co-sign is the SINGLE post-gate emit (`cosignSignAndSubmit`, spy-counted).
- **Rolling caps = SOFT budget, fail-CLOSED:** `spend-rollup.ts` never catches its fetch to a default-0; a mirror throw → `RPC_ERROR` deny in `server.ts`. `maxPerCall` (live ENS) is the hard bound.
- **ERC-8004 = "on-chain-resolved", never "verified":** `erc8004.ts` labels + required owner-mismatch path confirmed; UI copy verified honest.
- **INVARIANT #8 / #13:** payer==policy.hederaAccount binding intact; enforcement reads only `leash.policy` (module-boundary CI guard).

## Baseline Snapshot (REFRAME Phase 1)
- typecheck PASS · unit **102/102** (11 files) · integration **8/8** (4 files) · `next build` PASS (14 routes incl. frozen `/demo` + reframe `/app`,`/proof`)
- Live (fresh this run): `test:live -- erc8004` **3/3** (agentId 7395 → owner on registry 0x8004A818…); `test:live -- vm3` **7 live / 1 integration** (re-run AFTER the Phase-6 rolling-path fix, 93.8s)
- Frozen floor NO-TOUCH verified: `git diff cb53436^..HEAD` includes NONE of provision-canonical / app/demo / api/demo / ensureCanonical.
- Reframe test:source — cosign(unit) · spend-rollup(unit+integ) · authorize(unit) · erc8004(unit+live) · provision(unit) · hedera-scheme(NO unit; covered by VM-3 live + cosign primitives — a unit test would need heavy SDK mocking).

## Known-Risks Disposition (REFRAME Phase 2)
| Item | Class | Disposition | Detail |
|------|-------|-------------|--------|
| DEV-021 (PublicKey import) | STRUCTURAL | DISMISSED | Cosmetic; `hedera-scheme.ts:37` correctly imports `PublicKey` from `@hiero-ledger/sdk`. |
| DEV-R1-ABI (registry ABI) | STRUCTURAL | CLEARED | `erc8004.ts` pins only the real `ownerOf`/`getAgentWallet`; `getAgent`/`resolveByAgentId` absent — matches live contract. |
| DEV-R2-DBPUSH (5 new cols) | TESTABLE | CLEARED | All 5 cols present in BOTH `db/schema.ts` and `db/init.sql`. |
| **DEV-D01 (rolling width)** | TESTABLE | **CLEARED (docs stale)** | Kickoff §3 said "FIXED — confirm": CONFIRMED. `server.ts` anchors the lookback width to `mirrorConsensusNow().epochSeconds`, NOT `Date.now()` (the only `Date.now` mention is the explanatory comment). **PULSE RF-4 + BUILD-REPORT DEV-D01 were STALE — code is ahead.** VM-3 over-daily beat proves it live. |
| DEV-R3D4-01/02 (PUT preserve/clear) | TESTABLE | CLEARED | `route.ts` PUT reads live policy to preserve untouched limits; empty field clears one limit. |
| RF-1 (authed bind e2e) | EXTERNAL | ACCEPTED → wire | Bind branch STRUCTURALLY sound (resolve→provision→mint→identity→policy-LAST→fund→index; requireOwner first). Live authed round-trip needs a captured Privy token = wire's job (headless-auth constraint). |
| Watch: `isKeyListAccount` mirror lookup on /demo settle | STRUCTURAL | HARDENED/ACCEPTED → stress + demo_rehearsal | Co-sign routing adds a mirror GET per settle to the FROZEN /demo path (verify + submit). Mirror-up → identical (VM-2 green); mirror-down → fail-CLOSED deny (never wrong-settle). Not an INVARIANT #10 behavior regression, but adds latency + a mirror dependency to the demo path. |
| Watch: `assertCosignerDistinct` ECDSA-only | STRUCTURAL | DISMISSED | The whole rail is ECDSA by construction; an ED25519 operator key crashes closed at startup (safe). |
| Watch: rolling cap C×maxPerCall under concurrency | STRUCTURAL | ACCEPTED (disclosed) → stress | SOFT budget, documented in LIMITATIONS; `maxPerCall` stays the hard per-call bound. |

## Delegation Manifest (REFRAME Phase 3)
Ownership map unchanged (wire = connections/creds; verify_milestone = demo path; stress = exhaustive/edge/attack/AI-failure). Reframe handoff rows are in PULSE `## Downstream Items` and mirrored in `.debug-state.json.delegationHandoff` — RF-1 (wire), RF-2 (demo), RF-3 (verify+stress), RF-4 (stress; rolling-WIDTH portion now CLEARED, mirror-base-env portion remains), plus the /demo mirror-coupling + rolling-concurrency rows. Single smoke: covered by the fresh live erc8004 + VM-3 runs (real endpoints).

## Security Audit (REFRAME Phase 4)
- Secrets: all `0x{64}` hits in the delta are public **tx hashes** in `docs/pipeline/claims.json` (with etherscan links) — no keys. `.env` untracked + gitignored.
- Config/CORS/routes: no new exposed debug/admin routes; register/PUT/pay all behind `requireOwner` + rate-limited.
- Mock-leak: only `erc8004.test.ts` (viem stub) — backed by `erc8004.live` 3/3, acceptable.
- SR-1 grep clean (see honesty locks).

## Senior Dev Critique (REFRAME Phase 5) — two parallel code-reviewer subagents
- **Backend/facilitator: MUST-FIX 0**, SHOULD-FIX 3, NOTE 5 (`debug-results/phase-5-backend-critique.md`). All six honesty locks verified in code.
- **Frontend/console: MUST-FIX 0**, SHOULD-FIX 3, NOTE 5 (`debug-results/phase-5-frontend-critique.md`). Honest copy PASS, demo-robustness PASS.

## Fix Round (REFRAME Phase 6) — all 6 SHOULD-FIX applied, re-gated GREEN
1. `facilitator/server.ts` — collapsed the double `mirrorConsensusNow` into ONE consensus read reused for window + rolling width (≤ prior round-trips; VM-3 re-run confirms).
2. `web/lib/console.ts` — `provisionSpendingAccount` now rejects non-positive `fundRaw` (public-surface guard).
3. `facilitator/hedera-scheme.ts` — co-sign verify branch throws loud on a KeyList payer when `LEASH_COSIGNER_KEY` is absent (symmetric with signAndSubmit; no more empty-pubkey filter accident).
4. `web/app/app/_components/register-agent-form.tsx` — success reset now also clears cap/payees/agentType/description (a 2nd register can't inherit the previous agent's allowlist/type).
5. `web/app/app/app-console.tsx` — `refresh()` now throws on a non-OK `/api/org` (shows an error instead of an empty console on a flaky network).
6. `web/app/app/_components/agent-row.tsx` — limits success message guards the tx suffix (no "tx undefined").

**Re-gate after fixes:** typecheck PASS · unit 102/102 · integration 8/8 · `next build` EXIT 0 · `test:live -- vm3` 7 live/1 integration (93.8s). **Lens neighbor check:** VM-3 co-sign hero + rolling/window SAME; authorize pure gate SAME; VM-1/VM-2 + /demo frozen SAME (enrich not entered on single-key; single-key paths byte-identical); erc8004 SAME. No CHANGED-without-expected.

## Final Snapshot (REFRAME)
- unit 102/102 · integration 8/8 · live erc8004 3/3 + VM-3 7-live/1-integration · `next build` PASS
- 0 unresolved · 0 MUST-FIX · 6/6 SHOULD-FIX fixed · 0 security CRITICAL/HIGH/MEDIUM

## Confidence Justification (REFRAME)
Formula → 100 (no unresolved/entangled/abandoned/infra, 0 security HIGH/MEDIUM, 0 unfixed MUST-FIX, no unsanctioned skips). Adjusted to **96 (−4)** for two disclosed structural realities the downstream gates must still exercise live: (a) the `isKeyListAccount` mirror lookup now coupling the frozen /demo settle to the mirror (fail-closed, VM-2 green, but stress must prove mirror-down + demo_rehearsal must budget latency); (b) `hedera-scheme.ts` has no unit test (covered only by the VM-3 live hero). Neither is a defect; both are handoffs. 96 ≫ the 75 threshold → PROCEED to wire.

---

# DEBUG REPORT — WS-7 DELTA (prior run, preserved)

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

## Post-Debug Adversarial Review (2026-09-12, requested)
Two additional dedicated reviews were run after the 6-phase gate, with the full master doc (`docs/LEASH-MASTER-BUILD-DOC.md`) in scope:
- **security-auditor on the WS-7 attack surface:** CRITICAL 0, HIGH 1 → FIX-FIRST. Verdict after fix: SHIP.
- **code-reviewer senior critique on the pre-WS-7 core** (the enforcement/rails code that never got a Phase-5 pass): MUST-FIX 1. Enforcement core judged sound (fail-closed is structural; TOCTOU-closed; every RPC/decode/store error denies).

Findings fixed this round (all re-gated: typecheck, unit 44, integration 8, build, vm2 6/6, vm1 3/3 — no regression):
| Sev | Finding | Fix |
|-----|---------|-----|
| HIGH (H-01) | `/api/feed?agent=` had NO ownership check — cross-tenant spend-feed disclosure (B-08 join missed on this read path) | resolve agent by ENS name → `requireOwner({agentId})` before returning events |
| MUST-FIX (core) | `decode-ctx.ts` checked the REQUESTED `requirements.payTo`/asset, not the ACTUAL settled transfer — a malicious agent could pay a non-allowlisted account while the gate saw the allowlisted requested one (allowlist bypass; fails closed only by luck in the honest demo) | derive `payTo` from the actual sole positive receiver; fail CLOSED if not exactly one receiver in the requested asset. Honest single-receiver case unchanged (vm1/vm2 green) |
| MED (M-01) | replay `isSeen→markSeen` TOCTOU under concurrency | `markSeen` now an atomic claim (`INSERT … ON CONFLICT DO NOTHING RETURNING`); loser of the race → REPLAY abort |
| MED→fix (L-02) | `/api/policy/[name]` public, no rate limit (enumeration/RPC abuse) | added `enforceRateLimit` (read-tier capacity) |
| SHOULD (honest-framing) | demo `refuse`/`revoke` beats fabricated `OVER_CAP`/`REVOKED` on a transport error | only classify when a settle response exists; else `NO_SETTLE_RESPONSE` (verdict stays truthful) |
| SHOULD (robustness) | HCS `logDecision` awaited on the settle hot path — an audit hiccup could abort a legit settle | fire-and-forget with `.catch` (audit log can't fail the payment it audits) |

Disclosed / accepted (no fix, documented): M-02 paymentId keyed on tx bytes (Hedera DUPLICATE_TRANSACTION backstop), L-01 bearer-token replay (B-06, LIMITATIONS), plus the `payTo` no-op guard was subsumed by the decode-ctx fix. `isPolicyDenial` bare-403 clause left as-is (typed `policy_violation` matches first).

## Confidence Score Justification
95. Anchored formula: start 100; MUST-FIX 0, UNRESOLVED 0, SECURITY-CRITICAL/HIGH 0, no unsanctioned skips (full mode, all 6 phases). −5 for the 2 documented MEDIUM mock-leaks (dispositioned as wire handoffs, not shipped-blind). Every WS-7 acceptance (F-016..F-025) has live or unit evidence; both senior critiques approved with zero MUST-FIX; no regression to `/demo` or the 3 prize legs (INVARIANT #10). What would raise it: DH-1/DH-3/DH-6 actioned (real authed path, Neon-down fault-injection, persistent co-hold tx) — those are correctly owned by wire/stress/verify_milestone downstream.
