# LEASH — CRITIQUE KICKOFF HANDOFF (paste this into the fresh critique chat)

You are starting the **critique** phase of the LEASH build for **ETHOnline 2026**. Intel + warroom + forge are done. This doc is self-contained: you need no prior chat. Read it fully, run the hackathon-critique skill (and nothing else), then run `/handoff` for the next chat.

---

## 0. THE ONE JOB OF THIS CHAT
Run the **hackathon-critique** skill on the forge output: assess LEASH's competitive positioning, sponsor-integration DEPTH, narrative arc, and win-probability against the 3 locked prizes BEFORE build starts. Produce the critique artifact, carry the per-doc adversarial-review discipline forward, then `/handoff` to the next phase. Do NOT build code. Do NOT run any other phase. One skill per chat.

## 1. WHAT LEASH IS (identity — do not drift; this is the locked thesis)
LEASH turns an org's ENSv2 name hierarchy into a live, revocable spend-permission graph for a fleet of paying AI agents: each agent is a child ENS name (`data.<org>.leash.eth`) whose resolver text record `leash.policy` encodes its spend cap + allowed payees + Hedera account; a self-hosted (forked) Hedera x402 facilitator reads that record BEFORE settling each gas-free payment and refuses over-cap/off-allowlist/revoked payments; Privy gates treasury→agent FUNDING as an independent second rail (never a per-tx co-signer). Revoke the resolver record or the EAC role = one Sepolia write kills the agent's spend everywhere. **The name is the leash.**
- Enforcement is **facilitator-trusted, NEVER "trustless" / "the chain enforces the cap"** — a trustless claim is a Q&A kill (thesis DRIFT TRIPWIRE + INVARIANT #4).
- The thesis is locked in `warroom/WINNER-BRIEF.md` `## Thesis` (6 fields + AMEND-1 rename). Never edit it to fit a doc.
- **Deadline:** Sunday 2026-09-13, 16:00 UTC (HARD, no late submissions). ~30h wall-clock from forge, ~15h focused build.
- **Track:** Building from Scratch (Classic).
- **3 prizes LOCKED (max 3):** ENS Best-Use-of-ENSv2 $4,500 + Hedera AI & Agentic Payments (x402) $6,000 + Privy Best B2B Financial Product $2,500 = $13,000 addressable.
- **Builder:** solo (Dami) + Claude, Dami at the keyboard (surface blockers INLINE in the terminal; not remote-control).

## 2. WHAT ALREADY HAPPENED (do not redo)
- **Intel + warroom + forge: DONE.** Winner = LEASH (was "Namescope" in warroom; renamed 2026-09-12, reconciled everywhere).
- **Forge produced + hardened the canonical docs** (each passed a MANDATORY per-doc adversarial review gate by an independent subagent — 12 BLOCKERS caught + fixed to zero-open across INVARIANTS/ARCHITECTURE/PLAN, each re-reviewed):
  - `PRD.md` — 10 sections, two-path scope, 16-risk register, demo script (6/6 metrics).
  - `ARCHITECTURE.md` — single source of truth, 45 tagged code blocks / 35 files, structural fail-closed gate, all 10 INVARIANTS mapped to code (10/10 metrics).
  - `PLAN.md` — 7 phases (WS-0..WS-6), judge-sandbox-first, 10 decision trees incl DP-0..DP-4 build-resolve seams, `## Skill-Ownership Map` (SO-2 routing), franchise skeleton at C0, VM-1/VM-2 (7/7 metrics).
  - `INVARIANTS.md` — 10 NON-NEGOTIABLES (each with Test + Judge-attack→Defense + rejection code), RESOLVED DECISIONS, SOURCE LOCK, ESCALATE law.
  - `FEATURE-OBSERVABLES.md` (15), `DECISIONS.md` (8 ADRs), `LIMITATIONS.md`, `.env.example` + `.input-manifest.json` + `INPUT-MANIFEST.md` (manifest-lint EXIT 0).
- **THESIS-1..5 PASS** + independent Claude cross-review of THESIS-2 AGREE (PULSE `## Cross-Review`).
- **All creds SET+VERIFIED** (Privy incl. owner+auth-sig finding, Hedera 1000 HBAR + chain 296, Alchemy Sepolia, Neon Postgres, deployer 0.05 Sepolia ETH). Two open REQUIRED human/generated inputs: `TREASURY_OWNER_PUBKEY` (generate P-256 at WS-0), `PRIVY_DASHBOARD_LOGIN_TOGGLE` (deploy-time human, real path only).
- **Doc layout:** flat at repo root (`/Users/MAC/ethonline-2026`) — the git repo IS the project; build populates the root per master §12. No nested project subdir.
- **Legacy conductor state archived** to `_prepipeline-archive/` (gitignored) — do NOT resume it. Standalone per-skill-handoff run model.

## 3. INPUTS CRITIQUE READS (priority order)
1. `PRD.md`, `ARCHITECTURE.md`, `PLAN.md`, `INVARIANTS.md`, `FEATURE-OBSERVABLES.md` — the forge output under critique.
2. `warroom/WINNER-BRIEF.md` `## Thesis` — the identity lock (critique must not propose drift).
3. `docs/LEASH-MASTER-BUILD-DOC.md` — authoritative scope (§2 prior art + ENS objection answer; §10 prize alignment matrix; §11 honest-framing footguns).
4. `research/research-brief.md` — competitive landscape (§13 ChainSight is the one visible competitor = read-analyst; §22 Kill List), prize-page qualification bullets (the literal rubric), event class = sponsor_track.
5. `DECISIONS.md` + `LIMITATIONS.md` — the honest-scope boundary critique should pressure-test.
6. `PULSE.md` — read on entry (Active Facts override; act on `## Downstream Items` owned by critique if any; read forge's `For Next Skill`), append your section on exit.
7. `~/.claude/skills/hackathon-briefs/ethonline-2026.md` — the CORRECT event brief. (NOTE: `ethglobal-openagents.md` is a DIFFERENT event — do not use it. See PULSE forge Deviations.)

## 4. WHAT CRITIQUE MUST ASSESS (the win-probability lens)
- **Sponsor-integration DEPTH (governing invariant):** is each of ENS/Hedera/Privy DEEP (load-bearing), not garnish? ENS = the resolver record IS the live settlement policy + hierarchy + EAC revoke (not a KV store). Hedera = native gas-free exact scheme + HCS audit + real HTS value. Privy = P-256-owner org wallet + funding policy + live leaked-key DENY. Flag any that reads as bolted-on against the prize-page bullets (the literal rubric).
- **Competitive positioning:** differentiate from ChainSight (a read-only analyst over Graph+Hedera). LEASH TRANSACTS + gets paid + revokes — the write side. Is that edge sharp in the narrative?
- **Narrative arc / demo:** does the 3:00 demo (PRD §6) land the negative-WOW (revoke → fail-closed) legibly via the A/B split-screen? Is the honest-framing Q&A defense airtight (never "trustless")?
- **Win-probability + gaps:** per the 5 equal judging criteria (Technicality/Originality/Practicality/Usability/WOW, 20% each). Where is LEASH weakest? What would raise it before build?
- **Feasibility realism:** ~15h focused on a hard deadline with ENSv2-alpha provisioning as the day-eater. Is the minimum-eligible tripwire (ENS+Hedera two-prize, Privy cut-first, sandbox always) credible?

## 5. THE PER-DOC ADVERSARIAL DISCIPLINE (carried forward)
Forge ran a mandatory independent adversarial review on each doc (Dami's hard rule). Critique inherits already-hardened docs — you are the competitive/positioning adversary, not the correctness adversary (that's done). If critique surfaces a substantive gap that changes a doc, treat it like a BLOCKER: surface inline to Dami with the fix, get the doc corrected, do not silently proceed. Never edit the thesis to fit a critique finding.

## 6. SURFACING CONTRACT (Dami on PC, inline)
Autonomous by default. STOP-and-ask INLINE only for a genuine blocker: a finding that forces a thesis/identity/scope/naming decision, a credential/human step, or anything hard to reverse. No silent advance, no silent stall. Everything non-blocking: proceed and report.

## 7. RUN MODEL + EXIT
One skill per chat. When critique completes (positioning + depth + narrative + win-probability assessed; gaps surfaced with fixes; PULSE updated), run `/handoff` producing a comprehensive next-chat handoff (same self-contained bar as THIS doc) for the NEXT phase. Pipeline order from here: critique → (url_preverify) → build → debug → wire → verify_milestone → **design (heavy: best UI ever)** → design_forge → stress_test → deploy → livetest → interrogate → demo_rehearsal → demo → package → verify_preflight. Reserve the last ~4h for submission + buffer.

## 8. LAUNCH MECHANICS
- **working_dir:** `/Users/MAC/ethonline-2026`
- Invoke the **hackathon-critique skill directly** (Dami orchestrates across chats via handoffs; do NOT launch the conductor — legacy state archived).
- Commit discipline: granular commits from hour 1 (ETHGlobal requirement). Never commit `.env` (real secrets); `.env.example` (placeholders) IS committed. Verify `git diff --cached` before every commit.
- Fresh terminal: `claude --dangerously-skip-permissions` (no `--rc`, Dami on PC).

## 9. KNOWN SEAMS + RISKS TO CARRY (from forge)
- **DP-0..DP-4 build-resolve seams:** unverifiable SDK/on-chain shapes (Privy owner arg; ENS registrar + UserRegistry ABIs + tokenId scheme; x402 hook context + paymentId; Hedera signable-hash + price format; payer-sig gates settle). Each routed to a PLAN decision tree at its WS. Forge could not verify live SDK shapes (build work); they are honestly seam-marked, not guessed-as-trusted. Critique should note these as the top build-execution risks.
- **G1 [HIGH] ENSv2 alpha provisioning** is the day-eater; WS-1 first; clock-based tripwire tied to absolute UTC.
- **Honest framing is an INVARIANT:** never "trustless" / "chain enforces the cap"; always "the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second rail on funding."
- **Design is first-class (Dami):** "best UI we've ever done" — carried to the design phase (after build ships feature-complete). WS-5 dashboard (the A/B split-screen revoke) is where the WOW/usability score is won.

## 10. EXIT CRITERIA FOR THIS CHAT
Critique complete when: positioning + sponsor-depth + narrative + win-probability + feasibility assessed against the 3 locked prizes and the 5 judging criteria; every material gap surfaced with a concrete fix (and any doc-changing gap resolved under §5); PULSE updated; then `/handoff` to the next phase. If a gap forces a thesis/scope decision, STOP and surface to Dami.
