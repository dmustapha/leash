# LEASH — DEBUG (REFRAME re-run) KICKOFF HANDOFF (paste this into the fresh debug chat)

You are (re)starting the **debug** phase of the LEASH build for **ETHOnline 2026**, this time over the **REFRAME build-delta** (the product pivot to a 2-of-2 co-signed spend-control plane). Intel + warroom + forge + critique + url_preverify + build (Phases 0-6) + the WS-7 hardening delta + a prior debug + a prior wire + the **REFRAME build-delta (Groups F/S/R/D/V)** + a **3-lens post-code adversarial review** are ALL DONE. This doc is self-contained: read it fully, run the **hackathon-debug** skill (and nothing else), then `/handoff` for the next chat.

---

## 0. THE ONE JOB OF THIS CHAT
Run the **hackathon-debug** skill: the 6-phase quality gate, FOCUSED on the **REFRAME delta** (the frozen sandbox + WS-7 surfaces already passed debug once, and the reframe already survived a 3-lens adversarial review + full live gating — so prioritize the *new* surfaces, don't re-litigate the frozen floor). Consume the reframe DEV-NNN records, prioritize the KNOWN-RISKS, prove/deny each, then `/handoff` to **wire**. Do NOT build features. Do NOT run any other phase. One skill per chat. NEVER commit `.env`.

## 1. WHAT LEASH IS NOW (the REFRAME — locked thesis, do not drift)
LEASH stops *minting* agents; it is the **spend-control plane for agents that already exist**. An agent's real self — logic, LLM, key, identity — lives **outside** LEASH (an EVM address / ERC-8004 registration it controls). LEASH binds that external identity to: an **ENS name (the leash)** + a **2-of-2 co-signed Hedera spending account** (`KeyList[agentPub, leashCoSignerPub]`, threshold-2 — agent holds one key, LEASH the other) + a **policy** (per-call cap, allowlist, rolling daily/weekly caps, time-windows) + **Privy funding** + **one-write revoke**. The create-your-own-agent product is roadmap ("coming soon").
- **Honest framing (three DISTINCT properties — NEVER drift):** Control = TRUE (LEASH's policy-checked co-signature is required; caps + revoke real). Independence = TRUE (agent holds its OWN Hedera key — **SR-1**; identity external). **Trustless = FALSE** (never claim; the chain enforces "two keys signed", not "why"; the cap is LEASH's *decision to co-sign*). A "trustless"/"chain enforces the cap" claim is a Q&A kill.
- ERC-8004 `ownerOf` = **"on-chain-resolved"**, NEVER "verified" (no proof-of-control). Rolling caps = **SOFT budget** (lagging mirror index; worst-case ≈ C×maxPerCall); `maxPerCall` (live ENS) is the hard per-call bound.
- **SR-1 linchpin:** the agent generates its own Hedera keypair and supplies only its PUBLIC key; `agentPriv` is NEVER in LEASH's facilitator/DB/env (grep-proven). If LEASH held it, the 2-of-2 is theater and F-031 is false.
- Source of truth for the reframe = `docs/REFRAME-SCOPE.md` (+ `docs/LEASH-MASTER-BUILD-DOC.md` for the base). Read REFRAME-SCOPE first.
- **Deadline:** Sunday 2026-09-13, 16:00 UTC (HARD). **Track:** Building from Scratch. **3 prizes LOCKED (max 3):** ENS ENSv2 $4,500 + Hedera x402 $6,000 (DEEPER via native threshold keys) + Privy B2B $2,500. **Builder:** solo (Dami) + Claude, Dami at the keyboard.

## 2. WHAT ALREADY HAPPENED (do not redo)
- **Pipeline runs STANDALONE** (no conductor; legacy conductor archived to `_prepipeline-archive/`). Everything on `main`. Per-skill-handoff model: one skill per chat.
- **Base build + WS-7 + prior debug + prior wire DONE** on the OLD create-agent model — all 3 prizes proven live; those proofs STAND for the **frozen sandbox path** (`/demo`, VM-1/VM-2).
- **REFRAME build-delta COMPLETE + gated** (BUILD-REPORT `## REFRAME build-delta`): Group F (9 canonical docs amended doc-first) → Group S (2-of-2 co-sign) → **S-GATE proto-VM3 PASS on-chain (no fallback)** → Group R (external identity + register-existing bind) → Group D (rolling caps + windows) → R3+D4 (/app console UI) → Group V (VM-3 + claims). Regression gate re-run after EVERY group (vm2 6/6, vm1 3/3, build, check). Frozen floor diff-proven untouched across the whole 46-file delta.
- **On-chain proofs (in `submission/proof.md` + BUILD-REPORT):** S-GATE co-signed settle `0.0.10487802@1789241326.656309368`; agent-alone + LEASH-alone both REJECTED `INVALID_SIGNATURE`; **VM-3 hero 7 live + 1 integration** (co-signed settle → agent-alone MISSING_COSIGN → LEASH-alone can't move → over-cap → over-daily → outside-window → revoke); erc8004 resolved live (agentId 7395 → `0x92AA…7522`).
- **3-lens adversarial review DONE (2026-09-12):** security-auditor + code-reviewer + architect on `4b32bdb..HEAD`. **No BLOCKER** (honesty props are network-enforced). 5 findings fixed + re-gated (2 MAJOR: rolling-window width now anchored to the consensus epoch, and the REF-6 module-boundary guard moved to the unit tier so CI runs it; 3 MINOR: per-payer `verifyPayerSignature`, C-13 split, INVARIANT #8 wording). Post-fix GREEN: typecheck 0, **unit 102/102**, integration 8/8, vm2 6/6, vm3 7 live + 1 integration.
- **Canonical docs coherent + reframe-aware:** PRD (§1/§3/§4/§6/§7) · ARCHITECTURE (co-sign scheme, file tree, trust model) · INVARIANTS (#3 soft-budget, #6 Hedera-cosigner, #8 per-payer binding, #13 CI boundary, new #15 SR-1) · FEATURE-OBSERVABLES (F-026..F-032) · DECISIONS (ADR-009/010) · PRIZE-COMPLIANCE · LIMITATIONS · CLAIMS (C-9..C-15 PROVEN) · docs/pipeline/claims.json (7 PROVEN / 0 PENDING) · PULSE · BUILD-REPORT.

## 3. DEBUG'S FOCUS — the reframe DEV-NNN + KNOWN-RISKS (grep `DEV-` in BUILD-REPORT; PULSE `## Downstream Items` RF-*)
Prioritize the NEW reframe surfaces (the frozen floor + WS-7 already passed debug):
- **RF-1 (owned by wire, but validate the structure now):** the register-existing END-TO-END flow (`/api/agents` bind branch → co-signed account) is component-proven (R1 resolve LIVE; account model LIVE via S-GATE; `requireOwner` unit-tested) but NOT yet proven with a live Privy owner token (headless-auth constraint, same as the old DH-1). Confirm the bind branch is structurally sound; the live authed round-trip is wire's job.
- **RF-4 / DEV-D01 (FIXED — confirm):** the rolling-window width now uses the mirror consensus epoch (not `Date.now()`); a live mirror-down `RPC_ERROR` beat is still integration-tier only (no env-configurable mirror base). Confirm the fix holds; a live kill-endpoint beat is a stress/roadmap item.
- **DEVs to consume:** DEV-021 (PublicKey import, cosmetic), DEV-R1-ABI (real ERC-8004 ABI = `ownerOf`; `getAgent`/`resolveByAgentId` don't exist), DEV-R2-DBPUSH (db:push runs init.sql), DEV-R3D4-01/02 (PUT preserves untouched limits; empty field clears a limit).
- **Watch items (from the adversarial review, all fail-closed / non-blocking):** rolling cap is a SOFT budget (C×maxPerCall under concurrency — disclosed); `assertCosignerDistinct` is ECDSA-only (crashes closed on an ED25519 operator key — whole rail is ECDSA by construction); the extra `isKeyListAccount` mirror lookup adds a fail-closed dependency to the /demo settle (deny on mirror outage, never wrong-settle).

## 4. BRIEF HARD REQUIREMENTS (`~/.claude/skills/hackathon-briefs/ethonline-2026.md` §11)
- Real deployments beat mocks everywhere; ENS disqualifies hard-coded values (the reframe RESOLVES identity + loads addresses at runtime — verify); Hedera x402 needs live paid-request evidence (have it — S-GATE + VM-3 settle txs); Privy needs a live funding flow.
- Version-control history is a DQ gate — the reframe shipped as 10 progressive granular commits (satisfied).

## 5. RAILS (all real, testnet)
- `npm run facilitator` (:8401) + `npm run resource` (:8402) — vm1 assumes these UP; vm2/vm3 spawn their own.
- Frozen floor: `npm run test:live -- vm2` (three-prize hero, self-spawns) · `-- vm1` (needs servers up) · `-- cohold`. Reframe: `npm run test:live -- vm3` (co-sign hero, self-spawns; 7 live + 1 integration) · `npm run test:live -- erc8004` (identity resolve, 3/3) · `npx tsx --env-file=.env scripts/hedera/proto-cosign-gate.ts` (on-chain 2-of-2 proto).
- `npm run seed` · `npm run verify:claims` (recompute) · `npm run check` (typecheck + **unit 102** + **integration 8**) · `npm run build`.
- Key on-chain (reframe): co-signed spending account `0.0.10508343` (long-zero EVM `0x00…a05837`); ERC-8004 registry (Sepolia) `0x8004A818BFB912233c491871b3d84c89A494BD9e`; test name `vm3cosign.acme.leash.eth`. Frozen: POLICY_RESOLVER `0xdC460cd7`, USDC HTS `0.0.10496489`, HCS topic `0.0.10496492`, canonical agent `0.0.10499595`, org `acme.leash.eth`. Full set in `.build-state.json` + `submission/proof.md`.

## 6. INVARIANTS / FOOTGUNS (repeat at every phase)
- Never say "trustless" / "the chain enforces the cap." The co-sign is **facilitator-trusted**; the corporate-card model (independent employee, company-governed freezable card).
- Agent holds its own Hedera key (SR-1); `LEASH_COSIGNER_KEY ≠ HEDERA_OPERATOR_KEY` (asserted at process start). ERC-8004 = "on-chain-resolved", not "verified".
- Enforcement path reads EXACTLY `leash.policy` (INVARIANT #13, now CI-gated by `facilitator/identity-isolation.test.ts`); `facilitator/authorize.ts` + `facilitator/spend-rollup.ts` import NO DB (#3). Rolling cap = SOFT budget, fail-CLOSED on mirror error (throw → `RPC_ERROR`, never default-0).
- Every state change is a real on-chain tx; on RPC failure the facilitator ERRORS, never falls back to allow.
- **NEVER regress `/demo` or the 3 prize legs (INVARIANT #10). VM-1/VM-2 are the frozen regression gate; `/demo`, `/api/demo`, `provision-canonical.ts`, `ensureCanonicalAgent` are NO-TOUCH.**

## 7. ON COMPLETION
Write `DEBUG-REPORT.md` (reframe section) + `.debug-state.json` + PULSE `### debug` (reframe) + append `pipeline-log.md`. Flip any actioned RF/DEV rows. Then `/handoff` to **wire** (next in the standalone sequence: **debug → wire → verify_milestone → design_forge → stress_test → deploy → livetest → demo_rehearsal → demo → package → verify_preflight**). wire's #1 job is closing **RF-1** (authed bind POST → co-signed agent, live Privy token) + re-proving the co-sign/dynamic/identity surfaces; the frozen-sandbox wire proofs (3 prize legs, old DH-1/DH-2) still stand. Deadline 2026-09-13 16:00 UTC.
