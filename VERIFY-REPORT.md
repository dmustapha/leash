# VERIFY REPORT — MILESTONE MODE

```
=======================================
HACKATHON VERIFY — MILESTONE REPORT
Project: LEASH (ENS-governed 2-of-2 co-signed spend control for external agents)
Mode: milestone (post-REFRAME, standalone — no conductor)
Time to deadline: ~16h (2026-09-13 16:00 UTC) — status: OK
Run date: 2026-09-12
Kill-Zone Escalation: NONE
=======================================
```

## KILL-ZONES (early-warning, milestone)
- KZ-1 Demo Reliability:        CLEAR — vm2 6/6 (frozen /demo hero) + vm3 7-live/1-integ (reframe hero) + vm1 green
- KZ-2 Submission Completeness: N/A at milestone (package phase later)
- KZ-3 Contract Wrong Network:  CLEAR — ENS on Ethereum Sepolia, x402 on Hedera testnet (matches ARCHITECTURE)
- KZ-4 Sponsor Integration:     CLEAR — ENS deep (live policy/revoke/resolver), Hedera x402 deep (live co-signed settle), Privy B2B (live authed console + funding DENY + policy)
- KZ-5 Eligibility:             CLEAR — ETHOnline 2026 window; 3-prize combo (ENS+Hedera+Privy)
- KZ-6 Claim Integrity:         N/A (milestone)

DECISION: **PROCEED**  ·  Phase completion: ~100%  ·  Architectural drift: NONE (reframe intentional; docs coherent)

## Step 0 — VF Recompute Sampling
Sampled: 0 · Passed: 0 · Failed: 0 · Unverifiable-by-policy: 0
No post-2026-09-06 4-state Verified-Fact entries in PULSE.md — sampling skipped (facts carried as PULSE Active Facts + a machine claims ledger instead).

## Step 0.8 — Claims Ledger
`docs/pipeline/claims.json` — 13 rows. `npm run verify:claims` → **OK: 13 claims, 0 mismatches** (committed recompute matches asserted). Co-hold (C-6) lives in the human CLAIMS.md only (flipped PROVEN this run; not a machine-ledger row).

## Step 1 — Phase Objectives (REFRAME delta + WS-7)
REFRAME groups F→S→S-GATE→R→D→R3+D4→V all built + committed + regression-gated (vm2 6/6, vm1 3/3, build, check after every group). WS-7 delta (A1..E2) complete. Completion 100%.

## Step 2 — Architectural Drift
None. The reframe is a user-directed product pivot (spend-control plane for EXTERNAL agents via 2-of-2 co-signed Hedera accounts). All 9 canonical docs amended doc-first; the old create-agent story is roadmap, not headline. Frozen floor (/demo + VM-1/VM-2 + provision-canonical) untouched (INVARIANT #10; `git diff cb53436^..HEAD` touches none).

## Step 2.5 — PRD Feature Delta (reframe observables)
| Claim (reframe) | Status | Evidence |
|---|---|---|
| Register BINDS existing identity (not mint) — F-032 | SHIPPED | RF-1 bind 200; `grep "mint (an )?agent"` = 1 hit, a NEGATION in proof copy |
| On-chain-resolved external identity — F-029 | SHIPPED | erc8004.live 3/3; identity badge says "on-chain-resolved", never "verified" (greps = honest negations) |
| 2-of-2 agent-alone can't spend (MISSING_COSIGN) — F-030 | SHIPPED | vm3 agent-alone beat |
| 2-of-2 LEASH-alone can't move (SR-1) — F-031 | SHIPPED | vm3 LEASH-alone beat; `agentPriv` absent from runtime (greps = comments) |
| Rolling daily/weekly SOFT caps — F-026/F-028 | SHIPPED | vm3 over-daily beat + authorize unit 43/43 |
| Stateless time-window — F-027 | SHIPPED | authorize unit 43/43 (window boundaries) |
Claims extracted (reframe): 7 · SHIPPED: 7 · PARTIAL: 0 · MISSING: 0. Coverage 100% (>70% threshold).

## Step 2.6 — Architecture Component Check
All core components present + functional: web (Next.js console/demo/proof/app), facilitator (:8401), resource-server (:8402), relayer, scripts/ens, treasury/privy, db (Neon). No missing core component.

## Step 2.7 — confirmed_urls
N/A — standalone (no `.conductor-state.json`); not yet deployed (deploy phase downstream). Local rails verified up during testing.

## Step 3 — Demo Path (executed with teeth)
- Frozen /demo three-prize hero: `npm run test:live -- vm2` → **6/6 PASS** (34.9s).
- Reframe hero: `npm run test:live -- vm3` → **7 live / 1 integration PASS** (this session): co-signed settle → agent-alone MISSING_COSIGN → LEASH-alone can't move → over-cap → over-daily → outside-window → revoke fail-closed; mirror-down RPC_ERROR at integration tier.
- **DH-6 (verify_milestone-owned, P1) ACTIONED**: authed `/app`-style register produced a PERSISTENT co-hold grant tx `0x31559a9b…` on Sepolia, `coholdVerified=true` (user + relayer both hold ROLE_SET_TEXT). CLAIMS C-6 flipped PROVEN; recorded in submission/proof.md.

## Step 4 — Kill-Zone Early Warnings
None. Demo path proven; contracts on correct networks; every sponsor integration is a live call (not an import); no eligibility change.

## Post-Build: Thesis + Critique Alignment
- **Thesis re-gate: PASS.** WINNER-BRIEF (`warroom/WINNER-BRIEF.md`) `## Thesis` block present. Its HERO FLOW (mint child names → pay in-cap gas-free → over-cap refused → revoke fails-closed across parent+2children) is demonstrated as the FROZEN /demo floor (Scenes 1,3-5). PRD §6 explicitly reconciles: frozen floor is the regression floor; the reframe bind/co-signed model (VM-3) is the added headline filmed on /app (PRD Flow 0 + Scene 2). Core winning argument (ENS revocable spend-permission graph; one on-chain write kills spending) unchanged and TRUE. No doc surgery required.
- **Critique elevations (4 approved): IMPLEMENTED** — E-1 (Blocky402-equivalent defense wording), E-3 (honest own-HTS-USDC narration), E-4 (headline "the ENS name that can un-pay it"), plus the trimmed E-1 verification. Copy/verification elevations; present in PRD/README/proof.
- **P0 features: BUILT-AND-TESTED** — 3 prize legs (ENS cap/revoke, Hedera gas-free settle, Privy DENY) + reframe co-signed hero, all proven live this session or in the frozen VM-1/VM-2. p0_score ~100 → PROCEED.

## Phase 5 — Feature Observables (F-026..F-032)
observable_score STRONG — all reframe observables PASS (live tests + honest-negation greps). Earlier observables (F-001..F-025) covered by build/debug gates + VM-1/VM-2.

## Downstream Items (milestone scan)
- CLOSED this run: DH-6 (persistent co-hold tx). Already closed in wire: RF-1, DH-1, DH-2.
- Carried (owned by not-yet-run phases, on track): RF-3 (score F-026..F-032 every gate — done here; repeats at stress/preflight), RF-4/RF-5 (stress: mirror-base env-config + /demo mirror-outage), RF-6 (demo_rehearsal: mirror latency), DS-1..DS-7 (demo/deploy/package). No open P1 owned by an already-run phase.

## WINNING PATTERN CHECKS (advisory)
- WP-2 Test Ratio: PASS — unit 102 + integration 8 + live suites over a modest source tree.
- WP-3 Multi-Track: PASS — 3 tracks (ENS, Hedera, Privy) each with real live integration points.
- WP-1/WP-4/WP-5: deferred to preflight (landing/submission-dir/README-story finalized in deploy/package).

=======================================
RECOMMENDATION: **PROCEED** to design → design_forge → stress_test → deploy → livetest.
Honesty locks intact: Control=TRUE, Trustless=FALSE, ERC-8004=on-chain-resolved, rolling caps=SOFT, SR-1.
=======================================
```
```
