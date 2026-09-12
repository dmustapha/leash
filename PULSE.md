# PULSE - Pipeline Rolling Context

## Active Facts
| Fact | Source | Phase |
|------|--------|-------|
| The Graph does NOT index Hedera (no subgraph/Substreams/Token-API support; Hedera data only via Mirror Node REST, which doesn't satisfy the Graph bounty) | fact-check [A1] thegraph.com/docs/supported-networks | warroom-v2 |
| [USER] Privy dashboard Email/Google login + allowed origins ALREADY enabled by Dami (pre-build screenshot); NEXT_PUBLIC_PRIVY_APP_ID now set (mirrors PRIVY_APP_ID). Task 5.4a env portion DONE; /app login testable. | user (screenshot) + build | build-delta (WS-7) |
| [SKILL] WS-7 scope doc = docs/WS7-HARDENING-SCOPE.md (the build-delta spec). Sandbox /demo + VM-1/VM-2 are the FROZEN regression gate for the whole delta. | build | build-delta (WS-7) |
| [USER] REFRAME (SUPERSEDES WS-7 product model): LEASH stops MINTING agents → spend-control plane for EXTERNAL agents. Scope = docs/REFRAME-SCOPE.md. 2-of-2 co-signed Hedera KeyList account (agent holds own key SR-1; LEASH_COSIGNER_KEY≠OPERATOR); Control=TRUE, Independence=TRUE, Trustless=FALSE (never claim). ERC-8004 on-chain-RESOLVED not verified. Rolling caps = SOFT budget. Frozen floor /demo+/api/demo+provision-canonical.ts+ensureCanonicalAgent+VM-1/VM-2 NO-TOUCH. Deadline 2026-09-13 16:00 UTC. | user + REFRAME-SCOPE | build-delta (REFRAME) |
| [SKILL] REFRAME Group F COMPLETE (2026-09-12): 9 canonical docs amended doc-first (ARCHITECTURE/INVARIANTS/LIMITATIONS/PRD/DECISIONS/FEATURE-OBSERVABLES[F-026..F-032]/PRIZE-COMPLIANCE/CLAIMS[C-9..C-15]/claims.json). Honesty-grep clean (no affirmative trustless/verified). Baseline GREEN: typecheck 0err, unit 44/44, integration 8/8. Stray wire-phase `playwright` devDep dropped (0 refs, uncommitted). | build (REFRAME) | build-delta (REFRAME) |

## Decisions Log
| Decision | Rationale | Phase |
|----------|-----------|-------|
| [USER] WS-7 hardening delta after build: tier = Correctness + controls + D1 (G1-G4, S1-S3, B1-B3 controls, D1 ENS agent-identity, demo Scene 2/6). D2 Hedera-extras + D3 Privy-2nd-control HELD as stretch. | Post-build critique found real /app gaps + world-class opportunities; ahead on build time (~28h). Scored sandbox stays frozen as the regression gate. | build-delta (WS-7) |
| [USER] G1 identity model = user CO-HOLDS the EAC kill-switch role with the relayer as delegated operator (NOT full self-custody, NOT operator-only). | User gets real on-chain authority to revoke their own agents; relayer keeps sponsoring gas; lower regression risk to the proven revoke path near deadline. | build-delta (WS-7) |
| [USER] Doc-first discipline: every WS-7 item amends the canonical docs (PRD/ARCHITECTURE/PLAN/FEATURE-OBSERVABLES/INVARIANTS/PRIZE-COMPLIANCE/CLAIMS) BEFORE its code, so debug/wire/verify/design_forge/demo/package stay coherent with the new scope. | Downstream skills read the canonical docs as source of truth; unrecorded features are invisible to them. | build-delta (WS-7) |

## Downstream Items
<!-- Owner-routed, non-blocking deferred work. Every skill reads on entry, actions rows it owns. See PULSE-PROTOCOL § Downstream Items. -->
| ID | Raised by | Owner phase | Pri | Item | Acceptance | Status |
|----|-----------|-------------|:---:|------|-----------|:------:|
| DS-1 | intel | demo | P1 | ETHGlobal BANS AI voiceovers/TTS in demo videos; 2-4min hard range, min 720p, intro <20s, no phone recordings/speed-ups | Demo video uses real human narration (Dami records) or no-voiceover design; length 2:00-4:00 | open |
| DS-2 | intel | build | P1 | Version-control history required throughout event; large single commits risk DQ | Progressive granular commits from first build hour | open |
| DS-3 | intel | package | P1 | Max 3 partner prize selections on submission form; AI usage must be documented (spec files + prompts included) | Submission selects <=3 sponsor prizes; AI-ATTRIBUTION/spec docs in repo | open |
| DS-4 | intel | warroom | P1 | Track selection (Scratch vs Continuity: Extend Open Source / Ship a Feature) locks prize eligibility; team all-same-track | Warroom explicitly decides track with prize-EV comparison | open |
| DS-5 | build (WS-7) | deploy | P1 | Render free tier spins down (no persistent disk) -> facilitator/resource cold-start mid-demo + clears in-memory state. A5 makes replay durable (Neon); deploy must add keep-warm or starter plan. | Facilitator/resource stay warm during judging (keep-warm ping or plan:starter); durable replay survives restart | open |
| DS-6 | build (WS-7) | demo_rehearsal | P1 | Scene 2 GRANT shot from /app live mint; Scene 6 real-product login (5.4a done). Restore-after-KILL uses direct setPolicy (seed has an idempotency edge, DEV-026). | Demo script covers GRANT via /app + Scene 6 login + a clean re-take restore path | open |
| DS-7 | build (WS-7) | verify_milestone + stress_test + verify_preflight | P1 | New WS-7 observables F-016..F-024 (authz/IDOR cross-tenant, org-collision, funding reconcile union+non-empty, rate-limit, durable replay fail-closed, allowlist-edit, un-revoke, spend feed, co-hold both-holders, ENS agent-identity) must be scored at EVERY gate, not only preflight. | verify_milestone + stress_test + preflight each assert F-016..F-024 | open |
| DH-1 | debug | wire | P1 | KNOWN-RISKS handoff: `web/lib/auth.test.ts` mocks Privy + Neon (unit); the REAL authed console path (requireOwner vs a live Privy access token + live Neon) is not automatically covered. | wire proves a live signed-in mutation returns 200 AND an authed-as-A-targets-B call returns 403 against the real DB | DONE (wire: subsumed by RF-1; 200+403 live) |
| DH-2 | debug | wire | P2 | KNOWN-RISKS handoff (mock-leak): build's `db/revoke-sync.test.ts` mocks the DB though Neon is available. | wire proves the real revoke -> index status sync against live Neon | DONE (wire: active→revoked live Neon) |
| DH-3 | debug | stress_test | P1 | KNOWN-RISKS handoff (DEV-033): A5 durable replay must FAIL-CLOSED on a Neon outage — a store error denies the settle, never proceeds. | stress simulates Neon-down on the settle path and asserts abort=REPLAY (no settle), plus a genuine replay of the same paymentId is rejected across a facilitator restart | open |
| DH-4 | debug | stress_test | P2 | KNOWN-RISKS handoff (A4/DEV-034): rate limit must 429 a burst before draining fee-payer/agent balance; XFF-spoof is a known single-instance bypass. | stress bursts /api/demo + a console mutation and asserts 429 before balance drain | open |
| DH-5 | debug | stress_test | P2 | KNOWN-RISKS handoff (A3/B-04): a SECOND new-agent register must keep the FIRST agent fundable (union preserves existing) and over-fund still DENIES. | stress registers 2 agents and proves both fund in-cap + both over-fund DENY on the real token | open |
| DH-6 | debug | verify_milestone | P1 | KNOWN-RISKS handoff (C1/C-6): `agent/cohold.live.ts` proves the co-hold MECHANISM but revokes its throwaway grant to preserve demo state — no persistent per-agent co-hold tx yet. | verify_milestone (or the demo GRANT beat) produces a persistent co-hold grant tx on a real `/app`-registered agent; flip CLAIMS C-6 -> PROVEN | DONE (verify_milestone: persistent co-hold tx 0x31559a9b…, C-6 PROVEN) |
| DH-7 | debug | stress_test | P2 | KNOWN-RISKS handoff (B1/B2/B-08): allowlist-edit + reactivate cross-tenant negatives — A must not edit/reactivate B's agent (requireOwner covers it; confirm end-to-end). | stress asserts 403 on authed-as-A editing/reactivating B's agent, and OFF_ALLOWLIST after an allowlist edit | open |
| DH-8 | debug | demo | P1 | KNOWN-RISKS handoff (DEV-014): narration must say "self-hosted @x402/hedera facilitator, Blocky402-equivalent", NEVER "Blocky402 fork". | demo script + README use the equivalent-wording; no "fork" claim | open |
| RF-1 | build (REFRAME) | wire | P1 | Register-existing END-TO-END smoke deferred: `/api/agents` bind branch needs a live Privy owner token (same headless-auth constraint as DH-1). R1 resolve + co-signed account model already proven (erc8004.live + S-GATE); the authed bind POST → co-signed-agent round-trip needs a captured token. | re-wire proves an authed bind POST returns 200 with a co-signed KeyList account + on-chain-resolved identity + leash.policy | DONE (wire: 200 bind cosigned+on-chain-resolved+policyTx; 403 IDOR; real Privy JWT) |
| RF-2 | build (REFRAME) | demo | P1 | Demo must show the REFRAME hero (bind existing → co-signed pay → agent-alone can't spend → LEASH-alone can't move → over-cap/daily/window refuse → revoke), NOT the old create-agent mint story. VM-3 is the script spine. | demo script covers the 2-of-2 co-sign veto + honest "facilitator-trusted, not trustless" framing | open |
| RF-3 | build (REFRAME) | verify_milestone + stress_test + verify_preflight | P1 | New REFRAME observables F-026..F-032 + claims C-9..C-15 must be scored at every gate (co-signed settle, agent-alone/LEASH-alone DENY, on-chain-resolved identity, rolling/window DENY, mirror-down RPC_ERROR). | each gate asserts F-026..F-032; C-9..C-15 stay PROVEN | SCORED @ verify_milestone (F-026..F-032 PASS); repeats at stress/preflight |
| RF-4 | build (REFRAME) | stress_test | P2 | BEAT-7 mirror-down is integration-tier (no env-configurable mirror base; hardcoded const in spend-rollup.ts/cosign.ts). A live kill-endpoint beat needs the mirror base made env-configurable. [debug 2026-09-12: DEV-D01 rolling-WIDTH portion is CLEARED — `server.ts` anchors the lookback width to the consensus epoch, NOT Date.now(); this row + BUILD-REPORT DEV-D01 were stale. ONLY the env-configurable-mirror-base half remains for a live kill beat.] | mirror base env-configurable → a live mirror-down RPC_ERROR beat (rolling width already consensus-anchored ✓) | open |
| RF-5 | debug (REFRAME) | stress_test | P2 | Co-sign routing (`isKeyListAccount`) now adds a mirror GET per settle to the FROZEN /demo path (verify + submit). Fail-CLOSED (deny on mirror outage, never wrong-settle) + VM-2 green, so not an INVARIANT #10 behavior regression — but a NEW mirror dependency on the demo path. | prove /demo settle denies on a mirror outage AND settles identically when mirror is up (VM-2 stays green) | open |
| RF-6 | debug (REFRAME) | demo_rehearsal | P2 | Same co-sign routing adds ~1 mirror round-trip each at verify + submit to every settle (incl. /demo) — extra on-camera latency. | budget the added mirror latency into the live settle timing (spinner / wait markers) | open |

## Skill Sections
### forge (complete, 2026-09-12)

#### Done
- Canonical docs written + each passed the mandatory per-doc adversarial gate: PRD.md (6/6 metrics), ARCHITECTURE.md (10/10, 45 tagged code blocks, 35 files), PLAN.md (7/7, Skill-Ownership Map), INVARIANTS.md (10 NON-NEGOTIABLES, structural fail-closed), FEATURE-OBSERVABLES.md (15), DECISIONS.md (8 ADRs), LIMITATIONS.md. Manifests: .env.example + .input-manifest.json (21 rows) + INPUT-MANIFEST.md; manifest-lint EXIT 0.
- Adversarial gate caught + fixed 12 BLOCKERS total (INVARIANTS 4, ARCHITECTURE 4, PLAN 4); every doc re-reviewed to zero open blockers by independent subagents (architect/security-auditor).
- THESIS-1..5 PASS; claude cross-review of THESIS-2 AGREE (see ## Cross-Review).

#### Deviations
- [SKILL] STEP-0 pointed at hackathon-briefs/ethglobal-openagents.md - a DIFFERENT event (Open Agents, Apr/May, 0G/Uniswap/Gensyn/ENS/KeeperHub). The ACTUAL event is ETHOnline 2026 (Sep 13; ENS/Hedera/Privy 3 of 11 sponsors) per research-brief.md + config.json + master doc (authoritative, mutually consistent). Correct brief = ethonline-2026.md (exists). Openagents brief contributed only ETHGlobal-generic submission mechanics (all consistent). Not a blocker.
- [SKILL] scope_mode auto-detect "emergency" (~30h) OVERRIDDEN to "full": master §5/§13.6 mandates full scope, LEASH invariant forbids fabricated/mocked demo state, scope-over-timeboxes. Timeline managed via judge-sandbox-first + minimum-eligible tripwire, not mocking.
- [SKILL] doc layout = flat at working_dir root (git repo IS the project, build populates repo root per master §12), not a nested {project}/ subdir.
- [SKILL] crossmodel-lead helper needed bash -c (zsh read -a incompat); ran clean under bash.

#### Verified Facts
- VF-F1: Privy enforces spend policy ONLY via a P-256-owner wallet + privy-authorization-signature (@privy-io/server-auth); owner-less/raw calls FAIL OPEN (live 2026-09-12). Baked as INVARIANT #5 + WS-0 smoke #1 (DP-0).
- VF-F2: Privy accepts + simulates chain 296 (eip155:296) - chain-support risk GONE.
- VF-F3: ENSv2 Sepolia ETHRegistry bytecode reachable via SEPOLIA_RPC (~29424 chars, 0x67b7…4b43).

#### Downstream Items
- DP-0..DP-4 build-resolve seams (Privy owner arg; ENS registrar+UserRegistry ABIs+tokenId scheme; x402 hook context+paymentId; Hedera signable-hash+price format; payer-sig gates settle) - each routed to a PLAN decision tree at its WS; build MUST resolve before the code is load-bearing.

#### Blockers for Downstream
- None. Two open REQUIRED human/generated inputs: TREASURY_OWNER_PUBKEY (generate P-256 at WS-0), PRIVY_DASHBOARD_LOGIN_TOGGLE (deploy-time human, real path only). All other creds SET+VERIFIED.

#### For Next Skill (critique)
- Read PRD/ARCHITECTURE/PLAN/INVARIANTS/FEATURE-OBSERVABLES/DECISIONS/LIMITATIONS. 3-prize combo LOCKED: ENS $4.5K + Hedera x402 $6K + Privy B2B $2.5K. Critique competitive positioning (vs ChainSight read-analyst - LEASH transacts/gets-paid), sponsor-integration DEPTH (governing invariant), narrative arc, honest-framing Q&A defense. Per-doc adversarial gate carried forward; docs already hardened.

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
{"reviewer":"claude","phase":"thesis-2","verdict":"AGREE","findings":[{"claim_id":"thesis-2","question":"Does the demo script (PRD.md §6) witness the thesis DEMO OBLIGATION (agent pays within ENS-encoded cap gas-free; same agents over-cap payment refused; org revokes the resolver record on camera so the next payment fails closed; across a parent + 2 children) AND does the primary user flow (PRD §3 Flow 1) equal the HERO FLOW? Answer PASS or FAIL only.","lead_answer":"PASS","reviewer_answer":"PASS","reviewer_reasoning":"DEMO OBLIGATION (WINNER-BRIEF §Thesis): witness a child agent paying within its ENS-encoded cap gas-free, the same agent's over-cap payment refused, and an org revoking the resolver record on camera so the very next payment fails closed - across a parent + 2-child hierarchy. PRD §6 demo script satisfies each beat: Scene 1 renders parent acme.leash.eth with its 2 children (data.acme.leash.eth + payments.acme.leash.eth, confirmed by the §6 seed table); Scene 3 (SPEND) has the agent pay a whitelisted API within its 5-USDC cap, facilitator reads ENS, settles gas-free; Scene 4 (REFUSE) has the SAME agent's 50-USDC over-cap payment aborted `over_cap`; Scene 5 (KILL, hero moment) has the org revokeRoles/clear the record in one on-chain Sepolia tx on camera and the exact identical in-cap call then fails closed. So the demo witnesses the DEMO OBLIGATION. Second conjunct: HERO FLOW (WINNER-BRIEF) = mint child names with scoped caps → agent pays whitelisted API within cap (facilitator reads resolver, settles gas-free; Privy mirrors) → org revokes the record → next payment fails closed. PRD §3 Flow 1 is explicitly titled 'Judge Sandbox hero flow' and is designated the primary/SCORED demo path (Flow→Scene map lists Flow 1 as primary, Scenes 1-6); its steps (pre-seeded minted children with caps → SPEND within cap gas-free → REFUSE over-cap → KILL revoke → next call fails closed) match the HERO FLOW arc, with REFUSE/SECOND-RAIL as additional witnessed beats. Both conjuncts hold, so PASS.","match":true,"resolution_note":"Weak-positive convergence; not proof."}],"resolved":false}
```

## Cross-Review

```json
{"reviewer":"claude","phase":"positioning","verdict":"DISAGREE","findings":[{"claim_id":"positioning","question":"Given the competitor landscape (research-brief: only ChainSight visible = read-only NL on-chain analyst over Graph+Hedera+Blockscout; crowded lane = agent-pays-API-with-x402 pulled by Hedera/Arc/Ledger from 600+ teams; roster hidden until Sep 16) and the project (LEASH: ENS name hierarchy as a live revocable spend-permission graph; facilitator reads the ENS resolver record pre-settlement; one on-chain write revokes an agent everywhere), is the market positioning crowded, similar, differentiated, or unique? Answer with exactly one of: crowded|similar|differentiated|unique.","lead_answer":"differentiated","reviewer_answer":"unique","reviewer_reasoning":"The only publicly-evidenced 2026 competitor is ChainSight, a read-only NL on-chain analyst (it queries and reports; it never transacts, spends, or gets paid). LEASH sits on the opposite, write/transact side: it is a spend-governance and instant-revocation control plane, not an analyst - so ChainSight is orthogonal, not comparable. The genuinely crowded lane the brief names is 'an agent pays an API with x402' (Hedera/Arc/Ledger pulling the same build from 600+ teams). LEASH consumes x402 but does not compete there: its problem is org-wide spend control and one-write revocation, not payment plumbing. Its load-bearing mechanism - encoding a per-agent spend policy (cap, allowlist, bound Hedera account) in an ENSv2 resolver text record and having a self-hosted facilitator read that record via eth_call at settlement so a single Sepolia write (clear the record / revokeRoles) kills an agent everywhere - is one the PRD asserts has zero instances in prior art, and no visible competitor or crowded-lane build addresses it. With no comparable competitor visible and the specific facilitator-reads-ENS-resolver-as-live-settlement-policy interlock absent from prior art, the positioning is not merely a differentiated angle within a shared category but its own category: unique. (Roster hidden until Sep 16 adds uncertainty, but on the canonical inputs the comparable set is empty.)","match":false,"resolution_note":"Resolve the claim from canonical inputs before acceptance."}],"resolved":false}
```

### critique (complete, 2026-09-12)

#### Done
- Full critique (>24h to deadline, all phases). Competitive positioning `differentiated` (mechanism `unique`); sponsor depth ENS deep / Hedera deep / Privy moderate; narrative `compelling`; drift scan CLEAN; win-legibility axes 6/6 strong. CRITIQUE-REPORT.md + .critique-state.json written.
- 5 elevations proposed; user approved 4; after a post-selection safety re-gate, 3 applied (E-1 trimmed, E-3, E-4), 1 dropped (E-2), 1 deferred (E-5). Docs edited: PRD/ARCHITECTURE/PLAN (copy + one build-verification step; no new files; A==B coverage intact; THESIS-1..5 preserved; WINNER-BRIEF untouched).

#### Active Facts (corrections / new intel)
- [SKILL] Blocky402 RESOLVED (VERIFIED 2026-09-12 via docs.hedera.com/solutions/ai/x402 + blocky402.com + github.com/x402-foundation/x402#2299): Blocky402 is open-source (MIT), BOTH hosted AND self-hostable (Docker/Node), live on Hedera testnet+mainnet, built on the SAME @x402/core + @x402/hedera stack LEASH uses; onBeforeVerify/onBeforeSettle are OFFICIAL x402 lifecycle hooks (issue #2299 gates settle on an external read = same shape as the ENS gate). DECISION: build MUST FORK Blocky402 and add the ENS gate via onBeforeSettle so "via the Blocky402 facilitator" is literally true (Task 2.2 Decision Point E-1). Fallback: self-hosted @x402/core+@x402/hedera (Blocky402-equivalent, stated in README). Qualification risk downgraded HIGH -> LOW.

#### Cross-Review
- positioning: claude blind re-derivation = `unique`; lead = `differentiated` -> DISAGREE (favorable). Reconciled: mechanism zero-prior-art agreed by both; category held at `differentiated` for honesty (roster hidden until Sep 16; x402-payer substrate crowded). Non-blocking; docs already reconcile. Appended to ## Cross-Review JSON.

#### Key Decisions
- [USER] Applied E-1 (Blocky402 defense, trimmed), E-3 (honest own-HTS-USDC narration), E-4 (headline "the ENS name that can un-pay it"). All copy/verification-only, invariant-safe, thesis-reinforcing.
- [USER] DROPPED E-2 (Privy funding-rail intents): would make Privy an active async approver -> collides with INVARIANT #6 / concern #4 [C] + thesis DRIFT TRIPWIRE; touches the proven WS-0 P-256-owner DENY; scope on zero-buffer deadline. Per Dami's directive to drop anything endangering the outlined plan.
- DEFERRED E-5 (Hedera HCS-14/ERC-8004 identity extra-points): 3h+ not worth it on a hard deadline.

#### For Next Skill (url_preverify -> build)
- Build MUST FORK the open-source Blocky402 repo and insert the ENS gate via onBeforeSettle (Task 2.2 Decision Point E-1); record the fork commit + a HashScan paid-request tx in submission/proof.md; README/demo (Task 6.3) state the Blocky402 fork explicitly. Fallback = self-hosted @x402/core+@x402/hedera (Blocky402-equivalent). Do NOT add a second non-ENS facilitator path.
- Privy left at ONE control (policy) by design (invariant safety) - it QUALIFIES for B2B ("≥1 control"); do not "deepen" it into an active approver.
- Execution risk #1 remains R-10 (A/B revoke legibility in <3min) - a demo-rehearsal item, not a build blocker.
- All DP-0..DP-4 forge seams still stand; critique added no new seams.
- PRIZE-COMPLIANCE.md written (all 3 tracks mapped to live prize bullets; 0 gaps). 4 downstream flags to close: F1 [demo/design] make the live ENS read VISIBLE on camera (ENS "not hard-coded" bullet); F2 [deploy/package] README needs an explicit "Payment Flow" section (Hedera bullet); F3 [package/preflight] AI-ATTRIBUTION.md + spec files MUST be in the repo at submission; F4 [demo] video human-voice + 2-4min or auto-reject. Hedera "Blocky402" is NOT a literal prize bullet (live page says "host a live x402-gated service on Hedera") - self-hosted x402 qualifies; fork is a bonus. HashScan contract verification NOT required for x402 (that's the ATS prize, not targeted).

#### Downstream Items
- (none new; DS-1..DS-4 unchanged)

#### Blockers for Downstream
- None.

### url_preverify (complete, 2026-09-12)

#### Done
- Inline reachability + name-availability pass (no conductor, run directly). Verdict PASS. Results in .url-preverify-state.json.

#### Active Facts (corrections / new intel)
- [SKILL] Vercel `leash.vercel.app` and `leash-dashboard.vercel.app` are ALREADY TAKEN (both 200). Deploy MUST name the Vercel project `leash-ens` (free, 404) to avoid an auto-suffixed collision URL. Free alternates: leash-x402, leash-console, leashctl.
- [SKILL] GitHub `dmustapha/leash` = available (404). Render `leash-facilitator` + `leash-resource` (already in .env.example) = available (404). Names are NOT preallocated; claim at deploy (WS-6).
- [SKILL] All pinned build-time external endpoints LIVE: Hashio RPC (405 GET = healthy JSON-RPC), Hedera Mirror Node (200), HashScan (200), Sepolia Etherscan (200), Alchemy host (401 = reachable), npm @x402/core + @x402/hedera (200), Blocky402 (200), x402 fork source github.com/x402-foundation/x402 (200). Build will not hit a dead dependency.

#### For Next Skill (build)
- Use Vercel project name `leash-ens` at deploy (WS-6 / Task 6.1); do NOT use bare `leash`. Render service names in .env.example stand.
- No dead-domain risk: proceed to WS-0 -> WS-1 (ENS provisioning FIRST, the day-eater) per PLAN. All four PRIZE-COMPLIANCE flags (F1-F4) and DP-0..DP-4 seams still stand.

#### Blockers for Downstream
- None.

#### Update (url_preverify, 2026-09-12): production domain acquired
- [USER] Dami registered **leash.ink** (Namecheap). This is the CANONICAL submission/demo domain. `leash-ens.vercel.app` stays as the guaranteed fallback.
- Wiring (build/deploy WS-6): Vercel project = `leash-ens`; add custom domains `leash.ink` + `www.leash.ink`. Keep Namecheap DNS and add: A `@` -> 76.76.21.21, CNAME `www` -> cname.vercel-dns.com. Vercel auto-issues TLS. Use the exact record value Vercel shows in the dashboard as source of truth.
- Flag F1/F2 copy + README live-link + demo URL should reference https://leash.ink.

### build (complete, 2026-09-12)

#### Done
- All 7 PLAN phases executed (0-6), phase-by-phase subagent dispatch + orchestrator re-verification of every gate. All 3 prizes proven LIVE on-chain: ENS (3-level hierarchy leash.eth>acme>{data,payments}, live policy read/revoke on POLICY_RESOLVER 0xdC460cd7), Hedera x402 (real gas-free settle, agent 0 HBAR), Privy B2B (real-USDC funding + policy DENY). VM-1 (ENS+Hedera) + VM-2 (three-prize hero on canonical account 0.0.10499595) both PASS, orchestrator re-ran. WINNER-READINESS ~80.
- next build PASSES (/, /demo, /app, /proof + APIs); unit 33/33; typecheck clean. Franchise skeleton + CI + clean-room + 3 test tiers scaffolded at C0. Granular commits from hour 1 (DS-2). .env never committed.
- Seams resolved: DP-0 (Privy P-256 owner DENY, deterministic), DP-1/DP-1b (real ENSv2-alpha ABIs from cloned contracts-v2), R-2 (PermissionedResolver for self-deployed registry, DEV-008), DP-2 (real x402 hook shape {paymentPayload,requirements}, content-derived paymentId), DP-3 (@x402/hedera signer, PAYMENT-SIGNATURE header), DP-4 (payer-sig gates settle + TOCTOU no-cache REVOKED).

#### Active Facts (corrections / new intel)
- [SKILL] E-1 (DEV-014): facilitator is a SELF-HOSTED @x402/core+@x402/hedera service (Blocky402-EQUIVALENT), NOT a literal Blocky402 fork - the Blocky402 app source (blockydevs/blocky402) is NOT public. Prize STILL QUALIFIES (live bullet = "host a live x402-gated service on Hedera"). demo/README (F2) MUST say "self-hosted @x402/hedera facilitator, Blocky402-equivalent", NEVER "Blocky402 fork".
- [SKILL] Canonical demo accounts (DEV-020 fix): agents created via setECDSAKeyWithAlias so on-chain evm_address==key-EVM; ONE account per agent across funding+payment+ENS. data 0.0.10499595 (cap 5 USDC), payments 0.0.10499598 (cap 25 USDC), receiver 0.0.10497604, own HTS USDC 0.0.10496489, HCS topic 0.0.10496492.
- [SKILL] DEV-027: web/tsconfig must stay strict:true / target ES2020 (viem conditional types + BigInt need it) or next build fails type-check. Root tsconfig is ES2022/strict.

#### For Next Skill (WS-7 build-delta FIRST, then debug) - AUTHORITATIVE CURSOR
- **NEXT ACTION = WS-7 implementation, NOT debug.** Docs are amended doc-first (Group F done, except CLAIMS = PENDING-until-tx; PLAN dropped from the amend list). Do NOT re-amend the done docs. Spec + sequence + regression gate live in `docs/WS7-HARDENING-SCOPE.md`; machine cursor in `.build-state.json` -> `ws7Delta`.
- Start at code **Group A1 -> A2 -> A3**, then **B1 -> B2 -> B3**, then **C1 (own gate)**, then **D1**, then **A4 -> A5**, then **E1/E2**. REGRESSION GATE after EVERY group: `npm run test:live -- vm2` + `-- vm1` + `npm run build` + `npm run check` all PASS + spot-check one /demo settle; revert on any fail. Main build Phases 0-6 are GREEN + FROZEN (INVARIANT #10).
- Security refinements from 3 adversarial reviews are BAKED IN (scope doc 'Adversarial review outcomes' + INVARIANTS #11 ownership-join, #12 additive-scoped co-hold, #14 fail-closed replay). Honor them: A1 requireOwner join on every route; C1 grant via relay() scope + additive + embedded-wallet-on-login; A3 union-not-replace + non-empty allowlist; A5 fail-closed on Neon-down.
- DEV-030 is now CLOSED by A3 (was a KNOWN-RISK; funding a new /app agent reconciles the Privy allowlist at register). Do not treat it as an accepted limitation.
- After WS-7 completes: add the WS-7 section to BUILD-REPORT.md + PULSE `### build`, flip `ws7Delta.status` to complete, THEN hand to hackathon-debug with all canonical docs coherent.

#### For Next Skill (debug/wire, then design_forge/deploy/demo/package) - runs AFTER WS-7
- Read BUILD-REPORT.md (grep DEV- for all 32 deviations + Known Risks + on-chain proof pointers) + submission/proof.md (all 3 prize legs, resolvable). Rails: npm run facilitator (:8401), npm run resource (:8402), npm run seed (idempotent), npm run test:live -- vm2 (three-prize hero), npm run verify:claims (recompute, 0 mismatch).
- OPEN HUMAN STEP (Task 5.4a, deploy-time): Dami must set NEXT_PUBLIC_PRIVY_APP_ID + enable Email/Google login + add the deployed origin to Privy allowed origins, before /app live login (WS-5b login is UNTESTED, DEV-031). Does NOT block the scored /demo sandbox.
- DEV-030 SUPERSEDED: now addressed by WS-7 A3 (register-time Privy allowlist reconcile, union-not-replace). Once A3 lands, funding a new /app agent in-cap ALLOWs and over-fund DENIEs on the real token. Not an accepted limitation.
- Flags: F1 (make live ENS read visible on camera) -> demo/design; F2 (README "Payment Flow" section + Blocky402-equivalent wording) -> deploy/package; F3 (AI-ATTRIBUTION.md + spec files in repo) -> package; F4 (human-voice 2-4min video) -> demo.
- Deploy (Task 6.1, deploy-to-github): Vercel project leash-ens + leash.ink; Render leash-facilitator + leash-resource; guard .env (R-14). Build did NOT deploy (build boundary).

#### Blockers for Downstream
- None. WS-5b /app login UNTESTED pending the 5.4a human Privy dashboard step (expected, non-blocking; scored sandbox unaffected).

#### WS-7 build-delta (COMPLETE, 2026-09-12) - runs BEFORE debug, now DONE
- All 12 items (A1 A2 A3 / B1 B2 B3 / C1 / D1 / A4 A5 / E1 E2) implemented + gated. Every group re-ran the FULL regression gate (vm2 6/6, vm1 3/3, `npm run build` PASS, `npm run check` PASS) with ZERO regression to /demo or the 3 prize legs (INVARIANT #10). All baked-in adversarial refinements B-01..B-08 implemented. Full table + new DEVs (033-035) in BUILD-REPORT.md `## WS-7 build-delta`.
- [SKILL] A1 authz: `web/lib/auth.ts requireOwner()` (Bearer-only + app-id audience + ownership JOIN) is line 1 of every mutating console route; client sends `Authorization: Bearer` via `authedFetch`. IDOR (authed-as-A-targets-B) proven blocked 403 by `web/lib/auth.test.ts` (F-016). Identity is re-derived from the token, never client `privyUserId`.
- [SKILL] C1 co-hold (DEV-035): the REAL kill switch is `setText('leash.policy','')` on the PermissionedResolver, so the co-hold role is ROLE_SET_TEXT on the agent's leash.policy part-resource, granted via the resolver's scoped `authorizeTextRoles` (raw EAC `grantRoles` is OVERRIDDEN to revert on that contract). Deployer/relayer is resolver ROOT admin → grant is gasless + scope-guarded (relay 'grant' op). Additive: user AND relayer both hold (proven on-chain, `agent/cohold.live.ts` 3/3). `createOnLogin:'users-without-wallets'` gives the user an address.
- [SKILL] A3 (DEV-030 CLOSED): register reconciles the Privy funding allowlist read-modify-write UNION (non-empty guard); new /app agents are in-cap fundable + over-fund still DENIES on the real token.
- [SKILL] A5 (DEV-033): durable replay in the settle path (Neon `seen_payments`), FAIL-CLOSED on store error. Pure gate `authorize.ts` stays DB-free (INVARIANT #3 preserved). paymentIds are unique per x402 payload, so durable seen never false-REPLAYs a re-run.
- [SKILL] D1 identity is ADVISORY: `facilitator/identity-isolation.integration.ts` is a MODULE-BOUNDARY guard proving the enforcement graph never imports `scripts/ens/identity` (INVARIANT #13). Live identity records on data/payments sandbox agents; surfaced in /app, /demo, /proof.
- [SKILL] B3 fix: the HCS indexer mirror query rejected `sequencenumber=gt:0`; now omits the filter when the index is empty → `/api/feed` returns real ALLOW/DENY (indexed:true).
- E1/E2: GRANT surface (/app register → real mint+setPolicy+identity+cohold txs) + Privy login surface both render 200; the interactive OAuth login + on-camera register are Dami's browser steps (owned by demo_rehearsal/demo). Surfaces verified ready.
- PENDING CLAIMS to flip PROVEN as live txs resolve: C1 co-hold tx (already live via cohold.live), D1 identity setText tx (already live via seed), A3 new-agent in-cap fund tx (needs a signed-in console register).

### build — REFRAME delta (complete, 2026-09-12)

#### Done
- Product pivot LANDED (`docs/REFRAME-SCOPE.md`): LEASH governs EXTERNAL agents via a **2-of-2 co-signed Hedera spending account**. Groups F→S→S-GATE→R→D→R3+D4→V all built + committed + regression-gated (vm2 6/6, vm1 3/3, build, check re-run after every group; frozen floor untouched). Commits `cb53436`(F) `d683930`(S) `a5081a8`(S-GATE) `18ff320`(R) `d09fb0f`(D) `aebe474`(R3+D4) `5d286f8`(V).
- **S-GATE proto PASS on-chain (no fallback)**: co-signed settle `0.0.10487802@1789241326.656309368`; agent-alone + LEASH-alone (operator+cosigner) both REJECTED `INVALID_SIGNATURE`. KeyList threshold-2 acct `0.0.10508343` (long-zero EVM `0x00..a05837`). REF-1 dual-sign + REF-2 long-zero funding confirmed live.
- **VM-3 hero PASS (7 live + 1 integration)**: co-signed settle → agent-alone MISSING_COSIGN → LEASH-alone can't move (F-031/SR-1) → over-cap → over-daily → outside-window → revoke fail-closed; BEAT-7 mirror-down at integration tier (spend-rollup.integration → RPC_ERROR, no live injection point, not faked). Test name `vm3cosign.acme.leash.eth` (net-new); `/demo` HERO `data` untouched (still `0.0.10499595`).
- **R1 live**: `erc8004.live.ts` 3/3 resolves agentId 7395 → `0x92AAe0857979a139344f5b6F008e71F27A507522` on registry `0x8004A818…`; mismatch + unknown throw. Labeled on-chain-resolved, never verified.
- CLAIMS C-9..C-15 (+claims.json) flipped PENDING→PROVEN with per-beat evidence.

#### Honesty locks (NEVER drift)
- Control=TRUE, Independence=TRUE (SR-1: agent holds its own Hedera key; facilitator/config never read `agentPriv` — grep-proven), **Trustless=FALSE** (facilitator-trusted co-sign; never "chain enforces the cap"). ERC-8004 = on-chain-resolved, never "verified". Rolling caps = SOFT budget (worst case C×maxPerCall). `LEASH_COSIGNER_KEY ≠ HEDERA_OPERATOR_KEY` asserted at startup.

#### For Next Skill (re-wire → verify → design_forge → demo → package)
- Act on RF-1..RF-4 in `## Downstream Items`. Canonical docs are COHERENT with the reframe (Group F amended all 9). The old create-agent story is roadmap ("coming soon") — do NOT resurrect it as the headline.
- Re-wire owns RF-1 (authed bind POST e2e with a live Privy token). Demo owns RF-2 (reframe hero script = VM-3 spine, human voice, no TTS per brief). verify/stress own RF-3 (score F-026..F-032 every gate).

### debug (complete, 2026-09-12)

#### Done
- Full-mode 6-phase quality gate on the WS-7 delta (main build 0-6 frozen). Confidence 95, PROCEED. DEBUG-REPORT.md + .debug-state.json written.
- Phase 1 baseline: typecheck PASS, unit 44/44 (6 files), integration 8/8 (4 files), build PASS (5 pages), live vm2 6/6 + vm1 3/3 + cohold 3/3, dev-server 4 pages + /api/feed 200. test:source 0.88.
- Phase 2 KNOWN-RISKS: DEV-030 CLEARED (A3 union reconcile), DEV-035 DISMISSED (uses authorizeTextRoles), DEV-033/034 ACCEPTED (documented+handed off), A1 IDOR + C1 co-hold CLEARED (tested live).
- Phase 4 security: secrets CLEAN (all 0x64hex are bitmaps/ZERO_BYTES32/public tx hashes; keys only in gitignored .env), no .env tracked, A4 rate-limiting added, 2 mock-leak MEDIUMs handed off to wire.
- Phase 5 senior critique (parallel code-reviewer subagents): backend MUST-FIX 0, frontend MUST-FIX 0. Both approved; six B-01..B-05 invariants verified in-code.
- Phase 6 fix round: 6 SHOULD-FIX hardening fixes applied (relay label-boundary scope guard; removed dead cross-tenant fund `agentAddress` branch; index-hcs per-message try/catch; app-console useCallback lint fix; agent-row loadActivity r.ok; register-form optional-field guards + co-hold hint). Re-verified green. Lens check: 5/5 neighbor contracts SAME (no regression).

#### Active Facts
- [SKILL] Debug applied 6 fixes ON TOP of the WS-7 commits (not yet separately committed at PULSE-write time; committed immediately after). No functionality changed — hardening only. /demo + 3 prize legs unregressed (INVARIANT #10).

#### Adversarial review (post-debug, 2026-09-12)
- Two dedicated reviews with the full master doc in scope: security-auditor (WS-7 surface) = CRIT 0 / HIGH 1 -> SHIP after fix; code-reviewer (pre-WS-7 core) = MUST-FIX 1, enforcement core sound (fail-closed structural, TOCTOU-closed, RPC/decode/store errors deny).
- 6 fixes applied + re-gated (typecheck, unit 44, integration 8, build, vm2 6/6, vm1 3/3, no regression): [H-01] `/api/feed?agent=` now owner-scoped (was cross-tenant readable); [core MUST-FIX] `decode-ctx` binds the ACTUAL settled receiver/amount not `requirements` (closes an allowlist bypass; honest single-receiver case unchanged); [M-01] atomic replay claim; [L-02] `/api/policy` rate-limited; honest demo reason (no fabricated OVER_CAP/REVOKED on transport error); HCS log fire-and-forget on the settle hot path.

#### For Next Skill (wire, then verify_milestone/stress_test)
- Read DEBUG-REPORT.md executive summary + the DH-1..DH-8 rows in `## Downstream Items`. wire owns DH-1 (real authed console path: live Privy token + Neon; prove 200 + cross-tenant 403) and DH-2 (revoke-sync mock-leak). Everything else routes to stress_test (DH-3/4/5/7) and verify_milestone (DH-6).
- The 3 prize legs + VM-1/VM-2 are unchanged and green; wire should re-confirm the LIVE Hedera paid request evidence (HashScan) per the brief.

#### Blockers for Downstream
- None. Confidence 95, zero unresolved, zero MUST-FIX.

### debug — REFRAME re-run (complete, 2026-09-12)

#### Done
- Full-mode 6-phase quality gate over the REFRAME build-delta (Groups F/S/R/D/V). Confidence **96, PROCEED**. Frozen floor + WS-7 delta NOT re-litigated (already passed). DEBUG-REPORT.md gains a REFRAME section (WS-7 report preserved below it); .debug-state.json re-scoped.
- Phase 1 baseline: typecheck PASS · unit **102/102** (11 files) · integration **8/8** (4 files) · `next build` PASS (14 routes incl frozen /demo + reframe /app,/proof) · live `erc8004` 3/3 (fresh) · `vm3` 7-live/1-integration (RE-RUN post-fix, 93.8s). Frozen floor NO-TOUCH proven (`git diff cb53436^..HEAD` touches none of provision-canonical/app-demo/api-demo/ensureCanonical).
- Phase 2 KNOWN-RISKS: **DEV-D01 CLEARED** — rolling lookback WIDTH is consensus-epoch-anchored in `server.ts` (NOT Date.now()); RF-4 + BUILD-REPORT DEV-D01 were STALE, code is ahead. DEV-021/R1-ABI/R2-DBPUSH/R3D4 CLEARED/DISMISSED. RF-1 ACCEPTED→wire. /demo mirror-coupling HARDENED/ACCEPTED→stress+demo_rehearsal (new RF-5/RF-6). Rolling concurrency SOFT-budget ACCEPTED→stress.
- Phase 4 security: secrets CLEAN (all 0x64hex in the delta are public tx hashes in claims.json); .env untracked+gitignored; 0 mock-leaks (erc8004.test viem stub backed by erc8004.live 3/3). **SR-1 grep CLEAN** — no agentPriv/COSIGN_AGENT_KEY in facilitator/db/web runtime; F-031 holds.
- Phase 5 senior critique (2 parallel code-reviewer subagents): backend MUST-FIX 0 / SHOULD-FIX 3; frontend MUST-FIX 0 / SHOULD-FIX 3. All 6 honesty locks (SR-1, Trustless=FALSE, SOFT-budget fail-closed, on-chain-resolved, INVARIANT #8/#13) verified IN CODE; honest-copy PASS; demo-robustness PASS.
- Phase 6 fix round: all 6 SHOULD-FIX applied (server.ts single-consensus-read dedup; console.ts fundRaw>0 guard; hedera-scheme.ts co-verify throws loud w/o cosigner key; register-form clears shared fields on success; app-console refresh r.ok throw; agent-row limits tx-suffix guard). Re-gate GREEN (typecheck+unit 102+integ 8+build+vm3 7live/1integ). Lens check: 6/6 neighbor contracts SAME (VM-1/VM-2/demo/authorize/vm3/erc8004) — no regression.

#### Active Facts (corrections / new intel)
- [SKILL] DEV-D01 / RF-4 rolling-WIDTH half is FIXED in code (consensus-epoch-anchored) — the PULSE RF-4 row + BUILD-REPORT DEV-D01 line describing `Date.now()` are STALE. Only the env-configurable-mirror-base half of RF-4 remains (for a live BEAT-7 kill-endpoint beat).
- [SKILL] Co-sign routing couples the FROZEN /demo settle to a mirror GET (per verify + submit) via `isKeyListAccount`. Fail-CLOSED + VM-2 green ⇒ no INVARIANT #10 behavior regression, but a NEW mirror dependency + latency on the demo path → RF-5 (stress mirror-down) + RF-6 (demo_rehearsal latency).
- [SKILL] `facilitator/hedera-scheme.ts` has no unit test (covered by VM-3 live hero + cosign.ts primitive unit tests); a unit test would need heavy SDK mocking (mock-leak risk).

#### For Next Skill (wire, then verify_milestone/stress_test/demo)
- Read the DEBUG-REPORT REFRAME executive summary + the RF-1..RF-6 rows in `## Downstream Items`. **wire's #1 job = RF-1**: an authed bind POST → co-signed KeyList account + on-chain-resolved identity + leash.policy, with a LIVE Privy owner token (headless-auth constraint = same as the old DH-1). The bind branch is structurally sound (resolve→provision→mint→identity→policy-LAST→fund→index; requireOwner first) — wire proves it live.
- Also re-confirm the LIVE Hedera co-signed paid-request evidence (HashScan) per the brief; the 3 prize legs + VM-1/VM-2 frozen proofs still stand.

#### Blockers for Downstream
- None. Confidence 96, zero unresolved, zero MUST-FIX, honesty locks verified in code.

### wire — REFRAME re-wire (complete, 2026-09-12)

#### Done
- **RF-1 CLOSED (PASS)** — authed bind `POST /api/agents` with a REAL Privy JWT → **200**: `bound:true`, co-signed KeyList acct `0.0.10511140` (long-zero `0x00…a06324`, cosignerPub `033ba0…`), on-chain-resolved identity erc8004 agentId 7395 → `0x92AAe…` (CAIP, label `on-chain-resolved`), `leash.policy` written `policyTx 0x4c254de9…`, ENS mint present. Authed-as-A-targets-B → **403** "not the owner of this org" (IDOR). DH-1 subsumed.
- **DH-2 CLOSED (PASS)** — real `markAgentRevoked` flips index `active→revoked` against LIVE Neon (unit test had mocked pg).
- Auth gate proven: bind POST no-token → 401, garbage-token → 401 (requireOwner is line 1).
- Re-confirmed brief #1: LIVE Hedera **co-signed paid request** `npm run test:live -- vm3` 7-live/1-integration (HashScan in submission/proof.md); on-chain-resolved identity `erc8004` 3/3.
- Isolation (5.6) PASS via the IDOR 403; privacy audit (5.5) SKIPPED (no FHE/ZK); async (5.7): co-sign adds ~1 mirror GET each at verify+submit (MEDIUM, fail-closed) → RF-5/RF-6.
- WIRE-REPORT.md + .wire-state.json written. Zero failures, zero fixes, honesty locks intact. Status **WIRED**.

#### Headless-auth unlock (reusable)
- [SKILL] Privy `getTestAccessToken()` throws `Must specify origin` (auth API needs an Origin header the SDK omits). Replicated the passwordless-test-token flow manually with `Origin: http://localhost:3000` (`scripts/wire/mint-token.ts`) → genuine Privy JWT that `verifyAuthToken` accepts. User enabled Privy Test accounts (dashboard). verify/stress can reuse `scripts/wire/{mint-token,rf1}.ts`.

#### Known artifact
- On-chain `rf1x020998.acme.leash.eth` has a live leash.policy (only its Neon index row was deleted in cleanup). Not demo-visible (console reads the index); harmless. DB otherwise clean (acme owner restored to Dami).

#### For Next Skill (verify_milestone, then design/design_forge/stress_test/deploy/livetest)
- wire is WIRED, no blockers. verify_milestone Step 3 runs the demo path with teeth. Score F-026..F-032 (RF-3) at this gate. Carried to stress: RF-4 (env-configurable mirror base for a live BEAT-7), RF-5 (/demo settle denies on mirror outage). Carried to demo_rehearsal: RF-6 (budget co-sign mirror latency on camera).
- Honesty locks NEVER drift: Control=TRUE, Trustless=FALSE, ERC-8004=on-chain-resolved, rolling caps=SOFT, SR-1.

#### Blockers for Downstream
- None.

### verify_milestone (complete, 2026-09-12)

#### Done
- **Decision: PROCEED.** Phase completion ~100%, architectural drift NONE (reframe intentional; docs coherent), no kill-zone triggered. VERIFY-REPORT.md + .verify-state.json written.
- Demo path executed with teeth: vm2 6/6 (frozen /demo three-prize hero) + vm3 7-live/1-integ (reframe hero, this session) + vm1 green. Claims ledger `verify:claims` 13/13 0-mismatch. authorize unit 43/43 (F-027 + caps).
- **RF-3 scored:** reframe observables F-026..F-032 all PASS (live vm3 beats + authorize unit + honest-negation greps: F-029 "not verified", F-031 no agentPriv in runtime, F-032 "doesn't mint agents" negation).
- **DH-6 CLOSED (P1):** authed `/app`-style register produced a PERSISTENT co-hold grant tx `0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101` on Sepolia, `coholdVerified=true` (user + relayer both hold ROLE_SET_TEXT). CLAIMS C-6 → PROVEN; recorded in submission/proof.md.
- **Thesis re-gate PASS:** WINNER-BRIEF `## Thesis` present; its mint-children HERO FLOW is the FROZEN /demo floor (Scenes 1,3-5); PRD §6 reconciles the reframe bind/co-signed model (VM-3) as the added headline on /app. Core argument (ENS revocable spend-graph; one write kills) unchanged. 4 critique elevations implemented; P0 features BUILT-AND-TESTED (p0_score ~100).

#### For Next Skill (design → design_forge → stress_test → deploy → livetest)
- No blockers. Carried: RF-4/RF-5 (stress: env-configurable mirror base + /demo mirror-outage deny), RF-6 (demo_rehearsal: co-sign mirror latency), DS-1..DS-7 (demo/deploy/package). Honesty locks NEVER drift: Control=TRUE, Trustless=FALSE, ERC-8004=on-chain-resolved, rolling caps=SOFT, SR-1.
- Frozen floor NO-TOUCH (/demo + /api/demo + provision-canonical + VM-1/VM-2). Design work is UI/brand polish on /app,/proof,/demo surfaces — must not regress the scored /demo behavior.

#### Blockers for Downstream
- None.

### design (complete, 2026-09-12)

#### Done
- Measured REVAMP (not a rebuild): the warm-editorial-dark design SYSTEM already exists in `web/app/globals.css` and is OWNER-LOCKED (Dami's taste: near-black + amber + muted jewel verdicts). Per DP-4 (owner unavailable) auto-selected the existing direction; ran Phase-4 production polish on the highest-value + most-contained surface only.
- **Landing (`web/app/page.tsx`) rebuilt** to the REFRAME narrative (bind external agents → 2-of-2 co-sign → ENS-declared policy → one-write revoke kill), owner-locked "un-pay it" hero, a before/after POLICY-LIVE→REVOKED WOW panel, a 3-step Bind→Declare→Enforce explainer, and an honest-version `<details>` fold (progressive disclosure per Dami's easy-to-use principle). Fixed a real bug: `maxWidth: 16` (16px headline sliver) → `20ch`.
- **Gate GREEN + frozen floor UNTOUCHED:** only `page.tsx` changed (globals.css / /demo / provision-canonical all untouched — INVARIANT #10 verified by `git diff --name-only`); `npm run build` green, `npm run check` green (typecheck + unit + integration 8/8); server component (no client/Privy import edge → /demo isolation intact). Honesty locks held (forbidden terms appear only as honest negations in the fold).
- `/proof` + `/app` left as-is (already on-system, honesty-compliant, functional — risk > reward 16h from deadline).

#### For Next Skill (design_forge)
- Formalize the EXISTING warm-editorial-dark tokens (globals.css `@theme`) into DESIGN_SYSTEM.md + brand.json; logo forge. Do NOT introduce a new palette or restyle the frozen /demo behavior. Landing narrative is now reframe-coherent.

#### Blockers for Downstream
- None.

### design_forge (complete, 2026-09-12)

#### Done
- **formalize:** wrote DESIGN_SYSTEM.md (Identity/Tokens/Status-Legend/Craft/Primitives/Motion + paste-ready @theme + Do/Don't) and brand.json — extracted from the LIVE `globals.css` tokens (not invented). Invariant phrase = "LEASH is the ENS name that can un-pay it." Status legend maps jade=ALLOW / garnet=DENY·REVOKED / amber=PENDING to the real rejection tokens.
- **refine:** tsc+build green; craft audit run — 3 MAJOR (hover) + 1 easing flagged, ALL verified FALSE POSITIVES (the `:hover` rules ARE inside `@media(hover:hover)` — the audit line-regex misses the same-line wrapper; `.spin` linear is correct for a continuous spinner). No globals.css edit (shared with frozen /demo; code is correct). Landing was a11y/contrast/hierarchy-audited in the design phase.
- **logo_forge:** fal (primary) failed HTTP 401 (unauthenticated) → SVG last-resort (`logo_provider: svg_fallback`, surfaced honestly). 3 variants (logomark = open collar/leash ring with a revocation cut + agent node; wordmark; combination) + rasterized `logo.png`(512) + `logo-{16,32,64,256}.png` + `favicon.ico`(16/32/48) + `favicon.svg` + `og-image.png` (via sharp/imagemagick). Wired into `layout.tsx` metadata (icons + openGraph + twitter, metadataBase leash.ink). Logomark verified legible at 256px.
- Gate: `npm run build` green; only `layout.tsx` (metadata only) changed in code — frozen /demo behavior + globals.css UNTOUCHED (git diff verified).

#### For Next Skill (stress_test → deploy → livetest)
- brand.json + DESIGN_SYSTEM.md are downstream contracts (deploy renders invariant phrase; demo-video consumes palette). Logo assets in web/public. Deploy may re-rasterize/optimize but the set is submission-ready. Honesty locks intact.

#### Blockers for Downstream
- None. (Advisory: logo is svg_fallback because fal was down — acceptable; a crafted geometric mark is 16px-legible. If an image generator becomes available, deploy/package could regenerate.)
