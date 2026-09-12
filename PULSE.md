# PULSE — Pipeline Rolling Context

## Active Facts
| Fact | Source | Phase |
|------|--------|-------|
| The Graph does NOT index Hedera (no subgraph/Substreams/Token-API support; Hedera data only via Mirror Node REST, which doesn't satisfy the Graph bounty) | fact-check [A1] thegraph.com/docs/supported-networks | warroom-v2 |

## Decisions Log
| Decision | Rationale | Phase |
|----------|-----------|-------|

## Downstream Items
<!-- Owner-routed, non-blocking deferred work. Every skill reads on entry, actions rows it owns. See PULSE-PROTOCOL § Downstream Items. -->
| ID | Raised by | Owner phase | Pri | Item | Acceptance | Status |
|----|-----------|-------------|:---:|------|-----------|:------:|
| DS-1 | intel | demo | P1 | ETHGlobal BANS AI voiceovers/TTS in demo videos; 2-4min hard range, min 720p, intro <20s, no phone recordings/speed-ups | Demo video uses real human narration (Dami records) or no-voiceover design; length 2:00-4:00 | open |
| DS-2 | intel | build | P1 | Version-control history required throughout event; large single commits risk DQ | Progressive granular commits from first build hour | open |
| DS-3 | intel | package | P1 | Max 3 partner prize selections on submission form; AI usage must be documented (spec files + prompts included) | Submission selects <=3 sponsor prizes; AI-ATTRIBUTION/spec docs in repo | open |
| DS-4 | intel | warroom | P1 | Track selection (Scratch vs Continuity: Extend Open Source / Ship a Feature) locks prize eligibility; team all-same-track | Warroom explicitly decides track with prize-EV comparison | open |

## Skill Sections
### forge (complete, 2026-09-12)

#### Done
- Canonical docs written + each passed the mandatory per-doc adversarial gate: PRD.md (6/6 metrics), ARCHITECTURE.md (10/10, 45 tagged code blocks, 35 files), PLAN.md (7/7, Skill-Ownership Map), INVARIANTS.md (10 NON-NEGOTIABLES, structural fail-closed), FEATURE-OBSERVABLES.md (15), DECISIONS.md (8 ADRs), LIMITATIONS.md. Manifests: .env.example + .input-manifest.json (21 rows) + INPUT-MANIFEST.md; manifest-lint EXIT 0.
- Adversarial gate caught + fixed 12 BLOCKERS total (INVARIANTS 4, ARCHITECTURE 4, PLAN 4); every doc re-reviewed to zero open blockers by independent subagents (architect/security-auditor).
- THESIS-1..5 PASS; claude cross-review of THESIS-2 AGREE (see ## Cross-Review).

#### Deviations
- [SKILL] STEP-0 pointed at hackathon-briefs/ethglobal-openagents.md — a DIFFERENT event (Open Agents, Apr/May, 0G/Uniswap/Gensyn/ENS/KeeperHub). The ACTUAL event is ETHOnline 2026 (Sep 13; ENS/Hedera/Privy 3 of 11 sponsors) per research-brief.md + config.json + master doc (authoritative, mutually consistent). Correct brief = ethonline-2026.md (exists). Openagents brief contributed only ETHGlobal-generic submission mechanics (all consistent). Not a blocker.
- [SKILL] scope_mode auto-detect "emergency" (~30h) OVERRIDDEN to "full": master §5/§13.6 mandates full scope, LEASH invariant forbids fabricated/mocked demo state, scope-over-timeboxes. Timeline managed via judge-sandbox-first + minimum-eligible tripwire, not mocking.
- [SKILL] doc layout = flat at working_dir root (git repo IS the project, build populates repo root per master §12), not a nested {project}/ subdir.
- [SKILL] crossmodel-lead helper needed bash -c (zsh read -a incompat); ran clean under bash.

#### Verified Facts
- VF-F1: Privy enforces spend policy ONLY via a P-256-owner wallet + privy-authorization-signature (@privy-io/server-auth); owner-less/raw calls FAIL OPEN (live 2026-09-12). Baked as INVARIANT #5 + WS-0 smoke #1 (DP-0).
- VF-F2: Privy accepts + simulates chain 296 (eip155:296) — chain-support risk GONE.
- VF-F3: ENSv2 Sepolia ETHRegistry bytecode reachable via SEPOLIA_RPC (~29424 chars, 0x67b7…4b43).

#### Downstream Items
- DP-0..DP-4 build-resolve seams (Privy owner arg; ENS registrar+UserRegistry ABIs+tokenId scheme; x402 hook context+paymentId; Hedera signable-hash+price format; payer-sig gates settle) — each routed to a PLAN decision tree at its WS; build MUST resolve before the code is load-bearing.

#### Blockers for Downstream
- None. Two open REQUIRED human/generated inputs: TREASURY_OWNER_PUBKEY (generate P-256 at WS-0), PRIVY_DASHBOARD_LOGIN_TOGGLE (deploy-time human, real path only). All other creds SET+VERIFIED.

#### For Next Skill (critique)
- Read PRD/ARCHITECTURE/PLAN/INVARIANTS/FEATURE-OBSERVABLES/DECISIONS/LIMITATIONS. 3-prize combo LOCKED: ENS $4.5K + Hedera x402 $6K + Privy B2B $2.5K. Critique competitive positioning (vs ChainSight read-analyst — LEASH transacts/gets-paid), sponsor-integration DEPTH (governing invariant), narrative arc, honest-framing Q&A defense. Per-doc adversarial gate carried forward; docs already hardened.

### intel (complete, 2026-09-08)

#### Done
- ID-9 maximal intel on ETHOnline 2026: full $80K/11-sponsor prize map, rules, judging, 3 research subagents (84+ fetches), research-brief.md (327 lines) + hackathon brief file written.

#### Additions
- [NEW] ~/.claude/skills/hackathon-briefs/ethonline-2026.md created (was missing for this event).

#### Deviations
- [AUTO] Wave 3 Copilot skipped (no PAT); Grid saturation N/A for Ethereum (0-row chain filter, labeled honestly).
- [AUTO] Phase 2 social review deferred (autonomous conductor run); gap noted in research-brief Social Intel section.

#### Verified Facts
- Deadline Sun Sep 13 2026 12:00 EDT (16:00Z), no late submissions [A1].
- Max 3 partner prize selections per project [A1, verified twice]. One build track only: Scratch OR Continuity (Extend OSS / Ship a Feature); continuity partner-prize eligibility varies by sponsor.
- Demo video 2-4 min HARD (auto-reject outside), min 720p, NO AI voiceover/TTS, intro <20s.
- Granular commit history required; 1inch explicitly DQs single-commit-day entries.
- Agentic payments = event thesis: ~$58K of $80K touches agents/x402/MCP; sponsor judges score their own prize bullets literally; mocked data loses (Graph explicit).

#### Assumptions
- [ASSUMED] One project per team (multi-submission rule not published).
- [ASSUMED] Roster stays hidden until deadline; ChainSight (Graph+Hedera AI analyst, GitHub topic) is the only visible competitor.

#### Blockers for Downstream
- None.

#### Key Decisions
- [USER] Warroom optimization criteria (Dami): (1) prize-money EV, (2) low track crowding, (3) easy/feasible integration, (4) proper load-bearing product ideas; high-quality build, many sponsors integrated but channeled into the deepest 3-prize combo (cap is 3).

#### For Next Skill
- warroom: read research/research-brief.md (Prize Stacking Strategy, Track Coverage Matrix, Kill List) + research/sponsors-deep.md Cross-Sponsor Synthesis. Decide: Scratch vs Continuity (EV analysis), 3-prize combo, winning idea. Candidate combos: [agent] Hedera x402 $6K + Graph AI $5K + Bazantic; [custody] Privy + Ledger + Arc; [continuity farm] ~$13.5K pocket. Differentiate from ChainSight. Date traps: Chainlink challenge opens Sep 9; Arc mainnet bonus Sep 30; Ledger track needs physical hardware (Dami has no Ledger device? verify at CP3).

## Cross-Review

```json
{"reviewer":"claude","phase":"thesis-2","verdict":"AGREE","findings":[{"claim_id":"thesis-2","question":"Does the demo script (PRD.md §6) witness the thesis DEMO OBLIGATION (agent pays within ENS-encoded cap gas-free; same agents over-cap payment refused; org revokes the resolver record on camera so the next payment fails closed; across a parent + 2 children) AND does the primary user flow (PRD §3 Flow 1) equal the HERO FLOW? Answer PASS or FAIL only.","lead_answer":"PASS","reviewer_answer":"PASS","reviewer_reasoning":"DEMO OBLIGATION (WINNER-BRIEF §Thesis): witness a child agent paying within its ENS-encoded cap gas-free, the same agent's over-cap payment refused, and an org revoking the resolver record on camera so the very next payment fails closed — across a parent + 2-child hierarchy. PRD §6 demo script satisfies each beat: Scene 1 renders parent acme.leash.eth with its 2 children (data.acme.leash.eth + payments.acme.leash.eth, confirmed by the §6 seed table); Scene 3 (SPEND) has the agent pay a whitelisted API within its 5-USDC cap, facilitator reads ENS, settles gas-free; Scene 4 (REFUSE) has the SAME agent's 50-USDC over-cap payment aborted `over_cap`; Scene 5 (KILL, hero moment) has the org revokeRoles/clear the record in one on-chain Sepolia tx on camera and the exact identical in-cap call then fails closed. So the demo witnesses the DEMO OBLIGATION. Second conjunct: HERO FLOW (WINNER-BRIEF) = mint child names with scoped caps → agent pays whitelisted API within cap (facilitator reads resolver, settles gas-free; Privy mirrors) → org revokes the record → next payment fails closed. PRD §3 Flow 1 is explicitly titled 'Judge Sandbox hero flow' and is designated the primary/SCORED demo path (Flow→Scene map lists Flow 1 as primary, Scenes 1-6); its steps (pre-seeded minted children with caps → SPEND within cap gas-free → REFUSE over-cap → KILL revoke → next call fails closed) match the HERO FLOW arc, with REFUSE/SECOND-RAIL as additional witnessed beats. Both conjuncts hold, so PASS.","match":true,"resolution_note":"Weak-positive convergence; not proof."}],"resolved":false}
```
