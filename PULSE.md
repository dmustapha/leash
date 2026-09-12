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
