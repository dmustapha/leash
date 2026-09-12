LEASH — ETHOnline 2026 — FORGE PHASE KICKOFF

You are running ONE phase: forge. Intel + warroom are done. Read the full brief on disk FIRST, then forge, then /handoff. Do not build code. Do not run any other phase.

═══ STEP 0: READ THESE, IN THIS ORDER, BEFORE ANYTHING ═══
1. /Users/MAC/ethonline-2026/docs/FORGE-KICKOFF-HANDOFF.md   ← your complete brief, self-contained, READ FULLY
2. /Users/MAC/ethonline-2026/docs/LEASH-MASTER-BUILD-DOC.md  ← AUTHORITATIVE scope (pre-written PRD+ARCH+PLAN; incl. §13 two-path app). Transcribe/structure from this, do NOT re-derive.
3. /Users/MAC/ethonline-2026/warroom/WINNER-BRIEF.md  §Thesis ← the identity lock (6 fields + AMEND-1). Never edit the thesis to fit a doc; fix the doc.
4. ~/.claude/skills/hackathon-briefs/ethglobal-openagents.md ← the ETHOnline brief (tracks/judging/submission). House rule: read before producing output.
5. Supporting (not authoritative): research/research-brief.md (intel), warroom/SCOPING-LEASH.md (superseded scoping). PULSE.md: read on entry, append on exit.

═══ WHAT LEASH IS (identity, do not drift) ═══
An org's ENSv2 name hierarchy becomes a live, revocable spend-permission graph for a fleet of paying AI agents. Each agent is a child ENS name whose resolver record encodes its cap + allowed payees. A self-hosted (forked) Hedera x402 facilitator reads that record before settling each gas-free payment and refuses over-cap/off-allowlist. Privy gates treasury->agent funding as an independent second rail. Revoke the resolver record = one on-chain write kills the agent's spend everywhere. The name is the leash.
Deadline: Sun 2026-09-13 16:00 UTC (hard). Track: Building from Scratch. Prizes (3): ENS ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K. Solo (Dami) + Claude, Dami at the keyboard.

═══ ALREADY DONE (do not redo) ═══
- Name = LEASH (was "Namescope" in warroom; reconciled everywhere; only rename-provenance notes remain).
- Pipeline upgraded + merged to live: peer-pipeline-batch1 @ ab41412 (WS-5 binding + WS-3A routing + WS-EX submission-quality; warn-first except WS-5 loud-stop). You run on this.
- Creds SET+VERIFIED in .env (chmod 600, gitignored): Privy app; Hedera operator (1000 HBAR); Hedera EVM RPC (Hashio 296); Alchemy Sepolia RPC; LEASH_DEPLOYER_ADDRESS 0x72A90a712b7a668bD215B3b70B3fEaBFA40dd5C5 FUNDED 0.05 Sepolia ETH (key=LEASH_DEPLOYER_KEY); DATABASE_URL Neon Postgres 16 live-tested OK; Privy Hedera chain-296 support verified.
- Tooling authed: gh (dmustapha), vercel, render CLI. Node v24.
- Legacy pre-merge conductor state archived to _prepipeline-archive/ — do NOT resume it. Start forge fresh.

═══ THE PRODUCT SHAPE (master doc §13, DECIDED) ═══
Two-path app: (a) REAL multi-tenant product — Privy email/Google login → per-user org namespace under leash.eth → own Postgres DB of agents → gas-sponsored relayer → register/control; (b) zero-setup JUDGE SANDBOX — pre-seeded acme.leash.eth, server-side, no login/wallet/ETH, drives the full hero flow.
HARD SEQUENCING (§13.6): core backend + JUDGE SANDBOX FIRST (the scored, must-be-flawless, minimum-eligible bar) → real multi-tenant path SECOND → best-UI polish in the design phase. Never let the real path endanger the sandbox. Plan WS-5 as WS-5a (sandbox) + WS-5b (real console); add db/ + relayer/.

═══ YOUR JOB THIS CHAT ═══
Run the hackathon-forge skill (invoke it DIRECTLY — Dami orchestrates across chats via handoffs, do NOT launch the conductor). Produce canonical PRD.md, ARCHITECTURE.md, PLAN.md, INVARIANTS.md, FEATURE-OBSERVABLES.md + the §Skill-Ownership Map (SO-2 routing). working_dir = /Users/MAC/ethonline-2026.

═══ MANDATORY: PER-DOC ADVERSARIAL REVIEW GATE (Dami's hard rule) ═══
After forge writes EACH doc, BEFORE the next: dispatch an INDEPENDENT subagent (architect for ARCH/PLAN, security-auditor/code-reviewer for INVARIANTS, codebase-researcher+architect for PRD) to red-team it on 3 axes — (1) Fidelity to the locked thesis + master doc (no drift/scope-creep/easier-problem substitution); (2) Pipeline-law compliance: deepest-integration governing invariant (shallow = BLOCKER), N-16 (no wait-loops), convergence-bar realism vs the deadline, honesty/U11 (every claim falsifiable), SO-2 routing, INVARIANTS depth (headline cheat structurally unrepresentable + Test + Judge-attack->Defense per invariant); (3) Internal quality (feasibility, dependency risk, sibling-doc contradictions). Grade BLOCKER/WARNING/NIT. A BLOCKER stops forge → surface to Dami inline with the fix → fix → re-review. Proceed only at zero open BLOCKER.

═══ RESOLVE THESE (from the pre-forge review, handoff §10b) ═══
- Pin a treasury fundingCap (raw 6-dec units) distinct from per-call maxPerCall (the leaked-key DENY beat needs it).
- State as INVARIANT: amount and maxPerCall are raw smallest-unit integers, compared as BigInt.
- Privy policy enforcement REQUIRES the owner + authorization-signature flow via @privy-io/server-auth (raw calls fail-open) — bake into the WS-0 smoke test + INVARIANTS.
- MockUSDC/MockDAI addresses in master §4.1 are truncated — load ENSv2 addrs at runtime OR use the pinned 2026-06-29 set in §4.1 (authoritative); contracts-v2/ is not cloned (pinned set is the fallback, do not block).
- Reconcile "$0.10 endpoint price" vs the 3/5/50 USDC demo amounts.
- Standardize Privy wording: "passive policy mirror on the FUNDING rail, never co-signs a payment-path tx" (avoid the forbidden co-signer shape).

═══ HONEST-FRAMING INVARIANTS (never violate) ═══
Never "trustless" / "the chain enforces the cap" / ENS fuses / one-way narrowing. Always "the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second rail on funding." A trustless claim is a Q&A kill.
Identifier authority (exact strings, canonical in master doc): ENS text key = leash.policy ; agent header = X-Leash-Agent ; parent = leash.eth (sandbox org acme.leash.eth) ; agent child = data.<org>.leash.eth.

═══ SURFACING (Dami at keyboard, inline; not remote-control) ═══
Autonomous by default. STOP-and-ask INLINE only for a genuine blocker: a gate BLOCKER, a credential/human step, a thesis/identity/naming decision, anything hard to reverse. No silent advance, no silent stall.

═══ RUN MODEL + EXIT ═══
One skill per chat. When forge is complete (5 canonical docs + THESIS-1..5 pass + Skill-Ownership Map routes every deliverable + each doc passed the adversarial gate with zero open BLOCKER + PULSE updated): run /handoff producing a comprehensive next-chat handoff (same self-contained bar as FORGE-KICKOFF-HANDOFF.md) for the CRITIQUE phase, then stop. Dami pastes it into a fresh chat.
Commit discipline: the ethonline repo is git-tracked; commit meaningful units as you go (granular commits from hour 1 is an ETHGlobal requirement). Never commit .env or secrets (verify with git diff --cached before commit).

First action: read the 5 files in STEP 0, confirm you understand the two-path scope + judge-sandbox-first sequencing + the adversarial gate, then begin forge.
