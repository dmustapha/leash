# LEASH: FORGE KICKOFF HANDOFF (paste this into the fresh forge chat)

You are starting the **forge** phase of the LEASH build for **ETHOnline 2026**. Intel + warroom are already done. This doc is self-contained: you need no prior chat. Read it fully, then run forge and nothing else, then run `/handoff` for the next chat.

---

## 0. THE ONE JOB OF THIS CHAT
Run the **hackathon-forge** skill for LEASH, produce the canonical planning docs, subject EACH doc to the adversarial review gate (§4), then `/handoff`. Do NOT build code. Do NOT run any other phase. One skill per chat is the operating model (§7).

## 1. WHAT LEASH IS (identity, do not drift)
LEASH turns an org's ENSv2 name hierarchy into a live, revocable spend-permission graph for a fleet of paying AI agents: each agent is a child ENS name whose resolver record encodes its spend cap + allowed payees; a self-hosted (forked) Hedera x402 facilitator reads that record before settling each gas-free payment and refuses over-cap/off-allowlist; Privy gates treasury→agent funding as an independent second rail. Revoke the resolver record = one on-chain write kills the agent's spend everywhere. **The name is the leash.**

- **Deadline:** Sunday 2026-09-13, 16:00 UTC (~34h from this handoff). No late submissions.
- **Track:** Building from Scratch (Classic). **Prizes (3):** ENS ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K.
- **Builder:** solo (Dami) + Claude on an M5 Pro Mac, Dami at the keyboard (surface blockers INLINE in the terminal; not remote-control/iPhone).

## 2. WHAT ALREADY HAPPENED (so you don't redo it)
- **Intel + warroom: DONE.** Winner locked = LEASH (was "Namescope" during warroom; renamed 2026-09-12, reconciled everywhere).
- **Pre-forge scoping: DONE + authoritative** in `docs/LEASH-MASTER-BUILD-DOC.md` (verified against live source: pinned ENSv2 Sepolia addresses, x402/Hedera package pins, Privy API, gap register, demo script, credential status). This doc is effectively a pre-written PRD+ARCHITECTURE+PLAN. **forge's job is to TRANSCRIBE + STRUCTURE it into the canonical artifacts + run the gates, NOT to re-derive or invent.** Deviating from the master doc without cause is drift.
- **Pipeline upgraded + merged to live** (`peer-pipeline-batch1` @ `ab41412`, rollback tag `pre-ethonline-merge-2026-09-12`): carries WS-5 binding + WS-3A skill-ownership routing + WS-EX submission-quality standard. All warn-first except WS-5 (loud-stop). This is the pipeline you are running on.
- **Legacy conductor state archived** to `_prepipeline-archive/` (it was pre-merge + a stale dead-PID lock). Do NOT resume it. Start forge fresh in this dir.

## 3. INPUTS FORGE READS (in priority order)
1. `docs/LEASH-MASTER-BUILD-DOC.md`: the AUTHORITATIVE source. Transcribe/structure from this.
2. `warroom/WINNER-BRIEF.md` `## Thesis`: the **identity lock** (six fields + AMEND-1 the rename). Every doc is checked against this (THESIS-1..5). NEVER edit the thesis to fit a doc; fix the doc.
3. `~/.claude/skills/hackathon-briefs/ethglobal-openagents.md`: the ETHOnline brief. READ IT FIRST (house rule) for tracks/judging/submission format; honor §11 skill-specific guidance.
4. `PULSE.md`: rolling context; read on entry, append your section on exit.
5. `research/research-brief.md`: the FULL intel brief (ecosystem/sponsor/competitor research; name-agnostic). Supporting context for positioning + the prize-alignment sections; do not re-run intel.
6. `warroom/SCOPING-LEASH.md`: the raw pre-forge scoping that fed the master doc. **SUPERSEDED by the master doc**; use only as supporting detail. On any conflict the master doc wins (it carries the final identifiers).

**Identifier authority (avoid drift):** the master doc is canonical on exact strings, verified consistent everywhere: ENS text key = `leash.policy`, agent header = `X-Leash-Agent`, parent name = `acme.eth`, child = `data.acme.eth`. The facilitator and agent MUST use these exact strings.

**Historical warroom record (do NOT treat as input):** `warroom/deliberation-transcript.md`, `FINAL-VERDICT-V2.md`, `round0-pool-v2.md`, `round-scorecard-v2.md`, `.warroom-state.json` are the deliberation audit trail, fully reconciled to "Leash" (renamed from Namescope 2026-09-12; zero stray old-name references remain project-wide except the explicit rename-provenance notes in this handoff + WINNER-BRIEF). They are provenance only; WINNER-BRIEF supersedes them.

## 4. THE PER-DOC ADVERSARIAL REVIEW GATE (MANDATORY, BLOCKING: Dami's hard requirement)
"Each forge doc must undergo a serious and extensive adversarial critical review after creation; it affects everything downstream." This is the manual stand-in for the unbuilt WS-3 per-doc review. After forge writes EACH doc (PRD, ARCHITECTURE, PLAN, INVARIANTS, FEATURE-OBSERVABLES), BEFORE moving to the next:

1. Dispatch an **independent subagent** (fresh context, doc-appropriate: `architect` for ARCHITECTURE/PLAN, `security-auditor`/`code-reviewer` for INVARIANTS, `codebase-researcher`+`architect` for PRD) to red-team the doc on **three axes**:
   - **Axis 1: Fidelity:** does it still serve the locked thesis + the master build doc? Any scope creep, drift from the winning argument, easier-problem substitution, non-load-bearing feature.
   - **Axis 2: Pipeline-law compliance:** GOVERNING INVARIANT = deepest legitimate integration of ENS/Hedera/Privy (shallow "garnish" = BLOCKER); N-16 (no wait-loops/new phases); convergence-bar realism (hero flow fits ~14h build + the deadline); honesty/U11 (every claim falsifiable, no unbuildable promise); SO-2 routing (every deliverable tagged to its owning skill+phase, build does build-work only); INVARIANTS depth (headline cheat made structurally unrepresentable where the stack allows; each invariant has Test + Judge-attack→Defense).
   - **Axis 3: Internal quality:** feasibility in the window, dependency/ordering risk, missing edge cases, contradiction with a sibling doc.
2. Findings graded BLOCKER / WARNING / NIT. **A BLOCKER stops forge**: surface it to Dami inline with the recommended fix (§6), get approval, fix, re-review the doc. Only proceed when no BLOCKER remains.
3. The review is genuinely independent (separate agent, blind to forge's own thesis verdict). Capture the findings (they also feed the rebuild's future WS-3).

## 5. RUN MODEL: BASE (automated) + OVERLAY (supervised)
- **BASE:** forge runs its own internal gates (THESIS-1..5, the SO-2 routing pass + `## Skill-Ownership Map`, cross-document audit, INVARIANTS depth). These fire because you invoke the merged skill.
- **OVERLAY (you run by hand):** the §4 adversarial review per doc; deep-integration realism check; honesty check. These are not yet automated: run them deliberately.

## 6. SURFACING CONTRACT (Dami is on PC, inline)
Autonomous by default. STOP-and-ask INLINE in the terminal only for a genuine blocker: a §4 BLOCKER finding, a credential/human step (e.g. fund the deployer address), a thesis/identity/naming decision, or anything hard to reverse. No silent advance, no silent stall. Everything non-blocking: proceed and report.

## 7. THE PER-SKILL HANDOFF LOOP (how the whole run is orchestrated)
One skill per chat. After forge finishes + passes §4: run `/handoff` producing a comprehensive next-chat handoff (same self-contained bar as THIS doc: what happened, current state, what the next skill = **critique** must do, all inputs, the §4 gate carried forward, surfacing contract, deadline/budget). Dami pastes it into a fresh chat and starts critique. Repeat through the pipeline order: forge → critique → (url_preverify) → build → debug → wire → verify_milestone → **design (heavy: best UI ever, see §9)** → design_forge → stress_test → deploy → livetest → interrogate → demo_rehearsal → demo → package → verify_preflight. Reserve the last ~4h for submission + buffer.

## 8. LAUNCH MECHANICS
- **working_dir:** `/Users/MAC/ethonline-2026`
- Invoke the **hackathon-forge skill directly** (Dami orchestrates across chats via handoffs; do not launch the conductor: the legacy conductor state is archived and pre-merge).
- Env: `.env` present (chmod 600, gitignored). Credentials SET+VERIFIED: Privy, Hedera operator (1000 HBAR), Hedera EVM RPC (Hashio 296), Alchemy Sepolia RPC. Node v24.10.0.
- Fresh terminal recommended: `claude --dangerously-skip-permissions` (no `--rc`, Dami on PC) for full autonomy without permission prompts.

## 9. DESIGN IS FIRST-CLASS (carry this forward to the design phase)
Dami: "invest a lot in the design. we need the best UI we've ever done." When the design phase arrives (after build ships feature-complete, per DP-7): run the full `/design` orchestrator (frontend-design proposals → Dami picks → ui-revamp polish → QA) then `/design-forge`. Apply Dami's baked UI principles: instant-legibility (a judge gets it in seconds), progressive disclosure, plain language on the surface + jargon behind `<details>`, warm-editorial-dark palette (offer palette options, let Dami pick). WS-5 dashboard (the `web/` app) is where the WOW/usability score is won: the A/B split-screen revoke (resolver record ↔ live 402 flipping pass→fail) must be legible.

## 10. SEAM WARNINGS (known risks, carry into forge's Risk Register + build)
- **G1 [HIGH] ENSv2 alpha provisioning** is the likeliest day-eater: tested provision script FIRST, load addresses at RUNTIME from `contracts-v2/deployments/sepolia/*.json`, pin the 2026-06-29 set. Build order puts ENS (WS-1) first for this reason.
- **Deployer ETH funding = a human step (surface to Dami):** LEASH generates a Sepolia deployer key at WS-0; Dami must fund it with test ETH (Alchemy/Google faucet) once printed. Forge should record this as a CP3-style credential/human input in the manifest.
- **Privy thesis nuance to reconcile in the docs:** the WINNER-BRIEF thesis says Privy is a "PASSIVE policy mirror"; the master doc has Privy actively gating treasury→agent FUNDING (EVM calldata policy). These are consistent (Privy is not a per-tx co-signer on the payment path), but forge must phrase it precisely so it does not read as drift into the forbidden co-signer shape. Flag at §4 Axis-1.
- **Honest framing is an INVARIANT:** never "trustless"/"chain enforces the cap"; always "the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second rail on funding." A trustless claim is a Q&A kill.

## 10b. PRE-FORGE REVIEW FINDINGS (3 independent reviewers, 2026-09-12: resolve each under the §4 gate)
A line-by-line review of the master doc + all inputs ran before this handoff. The docs are consistent on name, identifiers, prizes, deadline, thesis, and honest framing (all clean). The following substantive items were NOT auto-fixed because they are design decisions or need Dami; forge MUST address each as it writes the relevant doc, and record the resolution:

- **[BLOCKER] Treasury funding-policy DENY cap is unspecified.** The 2:40 SECOND-RAIL demo beat (Privy leaked-key over-fund DENY) has no pinned threshold. Forge must pin a `fundingCap` (raw 6-dec units) in ARCHITECTURE §Privy + PLAN WS-4, distinct from the per-call `maxPerCall`, and the demo beat must reference it. (master doc §4.3 / §7 2:40 / WS-4.)
- **[BLOCKER→build] Raw-unit comparison must be explicit.** Both `amount` (decoded tx) and `maxPerCall` (ENS record) are raw smallest-unit integers (3 USDC = 3000000); the facilitator compares as BigInt. Forge must state this as an INVARIANT (a human-vs-raw mismatch silently breaks the cap check). (master doc §3.5 step 4d, §4.1.)
- **[HIGH] Truncated MockUSDC/MockDAI addresses** (master doc §4.1 line 131: `0xd3322b...` / `0xe33a...`) defeat self-containment. Resolve by loading from the ENSv2 deployment JSON at runtime (see next item) or Dami provides the full addresses. Surface to Dami if not runtime-resolvable.
- **[HIGH] `contracts-v2/` is not present.** master doc §4.1 line 119 + this handoff say "load ENSv2 Sepolia addresses at RUNTIME from `contracts-v2/deployments/sepolia/*.json`". That repo is not cloned. AUTHORITATIVE FALLBACK: the pinned 2026-06-29 address set is already fully listed in master doc §4.1 lines 120-129: use it directly. Clone `contracts-v2/` in WS-1 only if runtime-loading is preferred. Do not block on the clone.
- **[WARNING] Endpoint price vs demo amounts.** Resource server price is `$0.10` (master §4.2) but the demo narrates 3/5/50 USDC spends. Forge/demo must reconcile (set the demo endpoint price to the narrated amounts, or narrate cap headroom, not a literal 3-USDC charge on a $0.10 call).
- **[WARNING] Privy noun alignment.** WINNER-BRIEF says "passive policy mirror"; master doc says "policy engine on funding." Same meaning (Privy gates the FUNDING rail, never co-signs a PAYMENT-path tx), but forge must standardize the phrase in INVARIANTS so no reader hears "engine" as an active per-tx approver (the forbidden co-signer shape).
- **[WARNING→build] Verify assumptions at build:** ENS commit-reveal min-commit-age (assumed 60s), and Privy `caip2:'eip155:296'` acceptance (G11: WS-0 smoke test FIRST, fallback `secp256k1Sign` + self-broadcast to Hashio).
- **[WARNING] Feasibility buffer.** WS hour-sum is ~12-14.5h with near-zero buffer on a hard deadline; G1 (ENSv2 alpha provisioning) is the day-eater. Keep the minimum-eligible fallback (ENS+Hedera two-prize, Privy cut-first) as a LIVE tripwire with an explicit hour cutoff, not a last-resort afterthought.

## 11. EXIT CRITERIA FOR THIS CHAT
Forge complete when: PRD.md + ARCHITECTURE.md + PLAN.md + INVARIANTS.md + FEATURE-OBSERVABLES.md exist and are canonical; THESIS-1..5 pass; the `## Skill-Ownership Map` routes every owned deliverable; each doc passed the §4 adversarial gate with zero open BLOCKER; PULSE updated; then `/handoff` to critique. If a BLOCKER cannot be resolved autonomously, STOP and surface to Dami.
