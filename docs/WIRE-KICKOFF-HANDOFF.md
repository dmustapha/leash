# LEASH — WIRE KICKOFF HANDOFF (paste this into the fresh wire chat)

You are starting the **wire** phase of the LEASH build for **ETHOnline 2026**. Intel + warroom + forge + critique + url_preverify + build (Phases 0-6) + the WS-7 hardening delta + debug (6-phase) + a two-part adversarial review are ALL DONE. This doc is self-contained: read it fully, run the **hackathon-wire** skill (and nothing else), then `/handoff` for the next chat.

---

## 0. THE ONE JOB OF THIS CHAT
Run the **hackathon-wire** skill: discover, validate, and PROVE every integration works with real credentials + live endpoints. Prove the sponsor "real, not mocked" requirements. Action the debug handoffs owned by wire (DH-1, DH-2). Produce the wire artifact, then `/handoff`. Do NOT build features. Do NOT run any other phase. One skill per chat. NEVER commit `.env`.

## 1. WHAT LEASH IS (locked thesis — do not drift)
LEASH turns an org's ENSv2 name hierarchy into a live, revocable spend-permission graph for a fleet of paying AI agents: each agent is a child ENS name (`data.<org>.leash.eth`) whose resolver text record `leash.policy` encodes its spend cap + allowed payees + Hedera account; a self-hosted Hedera x402 facilitator (Blocky402-EQUIVALENT, NOT a fork — DEV-014) reads that record BEFORE settling each gas-free payment and refuses over-cap/off-allowlist/revoked; Privy gates treasury→agent FUNDING as an independent second rail (never a per-tx co-signer). Revoke the record/EAC role = one Sepolia write kills the agent's spend everywhere. **The name is the leash.**
- Enforcement is **facilitator-trusted, NEVER "trustless" / "the chain enforces the cap"** (INVARIANT #1/#4; a trustless claim is a Q&A kill).
- Single source of truth = `docs/LEASH-MASTER-BUILD-DOC.md`. Read it first.
- **Deadline:** Sunday 2026-09-13, 16:00 UTC (HARD).
- **Track:** Building from Scratch. **3 prizes LOCKED (max 3):** ENS ENSv2 $4,500 + Hedera x402 $6,000 + Privy B2B $2,500.
- **Builder:** solo (Dami) + Claude, Dami at the keyboard (surface blockers INLINE; interactive login/hardware = Dami's step).

## 2. WHAT ALREADY HAPPENED (do not redo)
- **Pipeline runs STANDALONE** (legacy conductor archived to `_prepipeline-archive/`). Everything lives on `main`. Per-skill-handoff model: one skill per chat.
- **Build Phases 0-6 DONE + orchestrator-verified:** all 3 prizes proven LIVE on-chain (ENS 3-level hierarchy + revoke on POLICY_RESOLVER `0xdC460cd7`; Hedera gas-free x402 settle, agent 0 HBAR; Privy real-USDC funding + policy DENY). VM-1 + VM-2 PASS. 32 DEVs logged in `BUILD-REPORT.md`.
- **WS-7 hardening delta DONE + gated** (A1 authz/requireOwner ownership-JOIN · A2 org-collision · A3 funding-allowlist union reconcile · B1 allowlist-edit · B2 reactivate · B3 spend feed · C1 co-hold kill switch · D1 ENS agent-identity · A4 rate-limit · A5 durable fail-closed replay · E1/E2 surfaces). Table in `BUILD-REPORT.md ## WS-7 build-delta`.
- **debug (6-phase) DONE:** confidence 95, PROCEED. `DEBUG-REPORT.md` + `.debug-state.json`.
- **Adversarial review DONE (2026-09-12):** security-auditor (WS-7 surface, CRIT 0/HIGH 1→SHIP after fix) + code-reviewer (pre-WS-7 core, MUST-FIX 1, core sound). 6 fixes applied + re-gated (vm2 6/6, vm1 3/3, unit 44, integration 8, build) — incl. a real allowlist-bypass in `decode-ctx` (now binds the ACTUAL settled receiver) and a cross-tenant `/api/feed?agent=` read (now owner-scoped).
- **Canonical docs are coherent + WS-7-aware:** PRD/ARCHITECTURE/FEATURE-OBSERVABLES (F-016..F-025)/INVARIANTS (#11-14)/PRIZE-COMPLIANCE/LIMITATIONS/CLAIMS + PULSE + BUILD-REPORT + DEBUG-REPORT.

## 3. WIRE'S DEBUG HANDOFFS (PULSE `## Downstream Items` — action these)
- **DH-1 (P1):** `web/lib/auth.test.ts` mocks Privy + Neon (unit). Prove the REAL authed console path: a live Privy-token mutation returns 200 AND an authed-as-A-targeting-B call returns 403 against live Neon. (This is the WS-7 A1 IDOR guarantee proven end-to-end.)
- **DH-2 (P2):** `db/revoke-sync.test.ts` mock-leak — prove the real revoke → index status sync against live Neon.
- Also review PULSE DS-5/DS-6/DS-7 (build handoffs) for context; those are owned by deploy / demo_rehearsal / the gate skills, not wire.

## 4. BRIEF HARD REQUIREMENTS WIRE MUST PROVE (`~/.claude/skills/hackathon-briefs/ethonline-2026.md` §11 wire)
- **Hedera x402: prove ≥1 LIVE paid request end-to-end and capture the HashScan tx evidence NOW (not demo day).**
- **Real deployments beat mocks everywhere:** The Graph disqualifies mocked/static data; ENS disqualifies hard-coded values (LEASH loads addresses at runtime — verify); Privy needs ≥1 live flow.
- Known hazard: Hedera x402 async callbacks are undocumented (piece from the @x402/hedera source, already resolved in build — DP-2/DP-3).

## 5. RAILS (all real, testnet)
- `npm run facilitator` (:8401) + `npm run resource` (:8402) — vm1 assumes these are UP; vm2 spawns its own.
- `npm run seed` (idempotent canonical accounts + policies + identity), `npm run test:live -- vm2` (three-prize hero, self-spawns servers), `npm run test:live -- vm1` (needs servers up), `npm run test:live -- cohold` (C1 co-hold on-chain), `npm run verify:claims` (recompute, 0 mismatch), `npm run check` (typecheck + unit 44 + integration 8), `npm run build`.
- Key on-chain: POLICY_RESOLVER `0xdC460cd7`, USDC HTS `0.0.10496489`, HCS topic `0.0.10496492`, canonical agents data `0.0.10499595` / payments `0.0.10499598`, org `acme.leash.eth`. Full set in `.build-state.json contractAddresses` + `submission/proof.md`.

## 6. INVARIANTS / FOOTGUNS (repeat at every phase)
- Never say "trustless" / "the chain enforces the cap." Say "the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second layer on funding."
- Facilitator = "self-hosted @x402/hedera, Blocky402-equivalent", NEVER "Blocky402 fork" (DEV-014).
- Privy stays a funding policy engine, never a per-tx co-signer (INVARIANT #4).
- Enforcement path (`facilitator/authorize.ts`) imports NO DB (INVARIANT #3); the durable replay (A5) is dedup only + fail-closed. Identity (D1) is advisory, off the enforcement graph (INVARIANT #13).
- Every demo state change is a real on-chain tx; on RPC failure the facilitator ERRORS, never falls back to allow.
- NEVER regress `/demo` or the 3 prize legs (INVARIANT #10). VM-1/VM-2 are the frozen regression gate.

## 7. ON COMPLETION
Write the wire artifact + PULSE `### wire` section + append `pipeline-log.md`. Flip actioned DH rows to `done`. Then `/handoff` to **verify_milestone** (next in the standalone sequence: wire → verify_milestone → design_forge → stress_test → deploy → livetest → demo_rehearsal → demo → package → verify_preflight). Deadline 2026-09-13 16:00 UTC.
