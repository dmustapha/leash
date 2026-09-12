# LEASH — REFRAME BUILD KICKOFF HANDOFF (paste into the fresh hackathon-build chat)

You are (re)entering the **hackathon-build** phase to execute the **REFRAME** build-delta for LEASH (ETHOnline 2026). A major product pivot was scoped, adversarially reviewed, and locked in the previous chat. This doc is the entry pointer; the SPEC is `docs/REFRAME-SCOPE.md` — **read it FULLY before anything else.** Deadline: **Sunday 2026-09-13 16:00 UTC (HARD).**

---

## 0. THE ONE JOB OF THIS CHAT
Run **hackathon-build** to execute `docs/REFRAME-SCOPE.md` exactly as a WS-7-style build-delta: **Group F (amend + review ALL canonical docs, doc-first) → Group S (2-of-2 co-sign) → S-GATE proto-VM3 → Group R (external identity) → Group D (dynamic limits) → Group V (observables/claims/VM-3)**, re-running the **regression gate after every group**. One phase at a time. Do NOT skip Group F — the canonical docs still describe the OLD create-agent model and MUST be amended before code, or the build builds the wrong thing.

## 1. WHAT LEASH IS NOW (the reframe — locked)
LEASH stops *minting* agents; it becomes the **spend-control plane for agents that already exist**. The agent's identity/logic/LLM/key are EXTERNAL (EVM / ERC-8004). LEASH binds that identity to: an **ENS name (the leash)** + a **2-of-2 co-signed Hedera spending account** (agent holds one key, LEASH the other) + a **policy** (per-call cap, allowlist, rolling daily/weekly caps, time-windows) + **Privy funding** + **one-write revoke**.

**Honest framing (NEVER drift — three distinct properties):**
- **Control = TRUE:** LEASH co-controls spend (its co-signature is required; it refuses over-policy). Caps + revoke are real.
- **Independence = TRUE:** the agent holds its own key (genuine co-owner) and its identity/logic are external.
- **Trustless = FALSE (never claim):** the cap is enforced by LEASH's *decision to co-sign*, not by the chain. Same honest facilitator-trust boundary as today (INVARIANT #4). Corporate-card model: independent employee, company-governed card, freezable.

## 2. THE LINCHPIN (SR-1 — do not lose this)
**The AGENT generates its own Hedera keypair and supplies ONLY its PUBLIC key at register. The agent's Hedera private key is held by the AGENT — NEVER in LEASH's facilitator, DB, or env.** If LEASH ever holds both keys, the 2-of-2 is theater and F-031 ("LEASH can't move funds alone") is false. The x402 client runs AGENT-SIDE; the demo/VM-3 agent is an external process holding its own key. This is the entire honesty of the model.

## 3. SOURCE OF TRUTH + WHAT'S ALREADY DECIDED
- **`docs/REFRAME-SCOPE.md`** — the full spec: decisions, invariant reconciliations (#3/#6/#8/#13), work items (F/S/R/D/V) each with an **Amends** column, the sequence, and **§6 the 9 binding adversarial-review refinements (REF-1..REF-9)** + the SR-1..SR-6 self-review fixes. This is authoritative.
- **3-prize combo LOCKED:** ENS ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K. All three survive the reframe (Hedera is *deeper* — native threshold keys; Privy funds the spending account at its **long-zero EVM address**, DENY beat preserved; ENS gains registry-resolution).
- **Frozen floor (INVARIANT #10):** `/demo`, `/api/demo`, the single-key sandbox account, `scripts/hedera/provision-canonical.ts`, `ensureCanonicalAgent`, and VM-1/VM-2 are **NO-TOUCH**. The reframe is `/app`-only + a **network-typed scheme selection** (the facilitator branches single-key vs KeyList on the account key it already reads at verify).
- **Safety net:** the **S-GATE proto-VM3** right after Group S proves the co-sign works live; if the SDK dual-sign or long-zero funding fails, **fall back to the single-key governed-account** spending model — identity binding + dynamic limits still ship, VM-1/VM-2 stay green.

## 4. WHAT ALREADY HAPPENED (prior chat)
- The full pipeline through **wire** ran on the OLD (create-agent) build: all 3 prize legs + DH-1 (authed 200 + cross-tenant 403, live Privy token) + DH-2 (revoke-sync on live Neon) + A3 funding UNION + full cap/revoke/reactivate lifecycle were PROVEN LIVE. Those proofs stand for the **frozen sandbox path**. The wire artifact was NOT finalized because the reframe supersedes it — the co-sign/dynamic/identity surfaces get FRESH proofs (VM-3 + a re-wire after build).
- **Repo is build-clean:** wire-phase dev servers killed; the DEV-only `__leashToken` hook in `web/app/app/app-console.tsx` reverted; wire test scripts + the captured token removed. **VERIFY** `package.json`/`package-lock.json` diff for a possible stray `playwright` devDependency from the wire phase and drop it if unwanted. `.wire-state.json` (partial) + `docs/REFRAME-SCOPE.md` + this handoff are the new files.

## 5. INVARIANTS / FOOTGUNS (repeat every phase)
- Agent holds its own Hedera key (SR-1). Never say "trustless"/"chain enforces the cap." "verified" ERC-8004 → **"on-chain-resolved"** (ownerOf is not proof-of-control).
- Rolling caps are a **SOFT budget** (mirror is a lagging index): read via `consensus_timestamp`, **fail-CLOSED on mirror error** (never default-0), malformed cap ⇒ `MALFORMED_POLICY`, worst case ≈ C×maxPerCall under concurrency (disclose). `maxPerCall` (live ENS) is the hard per-call bound; `fundingCap` (Privy) the hard aggregate.
- `LEASH_COSIGNER_KEY ≠ HEDERA_OPERATOR_KEY` (assert at startup); co-signer is a raw Hedera key, NOT Privy-held (INVARIANT #6).
- Co-signature emitted at the SINGLE post-gate settle site only (grep-proven); write `leash.policy` LAST in register (partial register = inert); funding UNION behind `requireOwner`.
- Facilitator enforcement reads EXACTLY `leash.policy` (CI module-boundary guard; #13). `authorize.ts` imports no DB.
- NEVER regress `/demo` or the 3 prize legs. Regression gate (vm2 + vm1 + build + check + a /demo settle spot-check) after EVERY group.

## 6. RAILS / COMMANDS
`npm run facilitator` (:8401), `npm run resource` (:8402), `npm run seed`, `npm run test:live -- vm2` (frozen three-prize hero), `-- vm1`, `-- cohold`, `npm run verify:claims`, `npm run check` (typecheck + unit + integration), `npm run build`. New: `-- vm3` (reframe hero) once Group V lands. Key on-chain (frozen sandbox): POLICY_RESOLVER `0xdC460cd7`, USDC HTS `0.0.10496489`, HCS topic `0.0.10496492`, canonical sandbox agent `0.0.10499595`. ERC-8004 registry (Sepolia): `0x8004A818BFB912233c491871b3d84c89A494BD9e`. Full addrs in `.build-state.json` + `submission/proof.md`.

## 7. ON COMPLETION
BUILD-REPORT gets a REFRAME section (new DEVs/observables/risks); PULSE `### build` amended; `.build-state.json` reframe cursor; then re-run **debug → wire → verify_milestone → design_forge → stress_test → deploy → livetest → demo_rehearsal → demo → package → verify_preflight** with all canonical docs coherent. Leave a full block for the 2-4 min human-voice video + submission (deadline 2026-09-13 16:00 UTC).
