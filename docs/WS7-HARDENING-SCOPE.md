# WS-7 Hardening + Real-Product Depth (build-delta scope)

> A scoped build-delta after the main build (Phases 0-6) completed GREEN. Mirrors forge in miniature: this doc is the spec, the canonical docs are amended doc-first, each item is built with the SCORED sandbox frozen as the regression gate (re-run VM-1 + VM-2 + `next build` after every group). Nothing here may regress `/demo` or the three proven prize legs (R-5 / INVARIANT #10). Deadline 2026-09-13 16:00 UTC; entered with large buffer (~28h) and a green scored path.

## Decisions (USER, 2026-09-12)
- **Ambition tier:** Correctness + controls + D1. In scope: G1-G4, S1-S3, B1-B3 controls, D1 ENS agent-identity, demo Scene 2/6. STRETCH (hold): D2 Hedera extras (HCS-14/metering/scheduled), D3 Privy 2nd control.
- **Identity model (G1):** user co-holds the EAC roles with the relayer as delegated operator. The signed-in user's Privy embedded-wallet address is granted the kill-switch role alongside the relayer (which keeps sponsoring gas). Not full self-custody (regression risk), not operator-only (weak story).

## Regression gate (runs after EVERY group)
1. `npm run test:live -- vm2` (three-prize hero on canonical account) PASS.
2. `npm run test:live -- vm1` PASS.
3. `npm run build` PASS. `npm run check` (typecheck + unit + integration) PASS.
4. `/demo` beats still real (spot-check one settle on mirror node).
If any fails: the change that caused it is reverted before proceeding.

## Work items

### Group A - Security / correctness
| ID | Item | Acceptance | Risk | Amends |
|----|------|-----------|------|--------|
| A1 (S1) | Privy auth-token verification on ALL `/api` console routes (org, agents, revoke, pay, fund). Derive `privyUserId` from the verified token (`verifyAuthToken`), never from client input. | A request without a valid Privy token, or naming another user's id, is rejected 401/403. Cross-tenant access impossible. | MED (touches every console route) | INVARIANTS (+new), ARCHITECTURE (authz), FEATURE-OBSERVABLES (F-016), PRD §7 risk |
| A2 (G2) | Org-name namespace collision guard: an org name is bound to its owning `privyUserId`; a second user cannot reuse/reach an existing org. Reject taken names with a clear error. | Two users, same requested org label: second gets a distinct name or a taken-error, never the first user's registry. | LOW | ARCHITECTURE, PRD §3 Flow 2, FEATURE-OBSERVABLES (F-017) |
| A3 (G3) | Reconcile funding: on register, add the new agent EVM to the Privy funding policy allowlist so in-cap `Fund` ALLOWS and over-fund still DENIES on the REAL token. | New console agent: Fund 10 USDC -> real transfer; over-fund -> FUNDING_DENIED. Both on token 0.0.10496489. | MED (Privy policy update path) | ARCHITECTURE Treasury, FEATURE-OBSERVABLES (F-018), LIMITATIONS (remove DEV-030 caveat) |
| A4 (S2) | Rate limit on `/api/demo` + console mutation routes (per-IP/session token bucket). | Rapid repeat calls throttle with 429 before draining fee-payer/agent balance. | LOW | ARCHITECTURE, PRD §7.5, FEATURE-OBSERVABLES (F-019) |
| A5 (S3) | Durable replay store (Neon-backed `seen` paymentId set) + Render cold-start note. | Replay rejected across a facilitator restart (persisted). Deploy doc carries keep-warm / starter-plan note. | MED (touches facilitator settle path - guard INVARIANT #9) | ARCHITECTURE Facilitator+DB, INVARIANTS #9 note, PRD §7 risk, LIMITATIONS |

### Group B - Missing controls (the control plane the pitch implies)
| ID | Item | Acceptance | Risk | Amends |
|----|------|-----------|------|--------|
| B1 (P1a) | Allowlist edit in `/app` (AgentRow + route): rewrite `allowedPayees` after registration. | Editing payees rewrites `leash.policy` on-chain; readPolicy reflects it; off-allowlist pay -> OFF_ALLOWLIST. | LOW | ARCHITECTURE web, PRD §3, FEATURE-OBSERVABLES (F-020) |
| B2 (P1b) | Un-revoke / re-activate in `/app` (setPolicy rebind + route + DB status). | A revoked agent can be re-activated; next in-cap pay settles again; status flips revoked->active. | LOW | ARCHITECTURE web, PRD §3, FEATURE-OBSERVABLES (F-021) |
| B3 (P1c/G4) | Spend feed / monitoring: wire `db/index-hcs.ts` to a live per-agent + org-level spend feed in `/app` (and a compact audit scroll in `/demo` for Scene 6). Agent detail drill-down (policy + recent ALLOW/DENY). | `/app` shows real spend_events indexed from HCS (name, decision, amount, reason, ts); non-empty after a real pay; matches the HCS topic. | MED (indexer + UI) | ARCHITECTURE DB+web, PRD §7.5/7.6, FEATURE-OBSERVABLES (F-022) |

### Group C - Identity (G1, co-hold model) - HIGHEST RISK, own gate
| ID | Item | Acceptance | Risk | Amends |
|----|------|-----------|------|--------|
| C1 (G1) | On org provision + agent register, grant the EAC role(s) that gate `setText`/revoke to the signed-in user's Privy embedded-wallet address ALONGSIDE the relayer. User can revoke with real on-chain authority; relayer stays delegated operator for gasless ops. | A signed-in user's address holds the kill-switch role for their agents (verifiable on-chain); relayer-sponsored ops still work; revoke still fails the next payment closed. VM gates still PASS. | HIGH (changes who holds the kill-switch role - INVARIANT #8) | INVARIANTS #8 (+co-hold), PRD §1/§3 identity, ARCHITECTURE ENS+relayer, FEATURE-OBSERVABLES (F-023), CLAIMS |

### Group D - Prize-deepener (accepted)
| ID | Item | Acceptance | Risk | Amends |
|----|------|-----------|------|--------|
| D1 | ENS agent-identity text records: write agent-identity keys (e.g. `agent.description`, `agent.type`, `avatar`, optional ERC-8004 pointer) alongside `leash.policy` on each agent child; reverse resolution (setName) for the agent account; surface in `/app` + `/proof` + demo. Advisory identity, NEVER an enforcement input. | Each agent child has readable identity text records + a reverse name; surfaced in UI/proof; ENS "agent identity" focus area satisfied; identity is NOT read on any enforcement path (grep). | MED (new ENS writes; keep off enforcement) | PRD §1/§4 ENS, ARCHITECTURE ENS, FEATURE-OBSERVABLES (F-024), PRIZE-COMPLIANCE (ENS deepen), INVARIANTS (identity advisory) |

### Group E - Demo choreography (accepted)
| ID | Item | Acceptance | Amends |
|----|------|-----------|--------|
| E1 | Scene 2 GRANT: the live mint+setText on camera is shot from `/app` register (real tx) or a clean sandbox grant affordance; ensure the surface supports a clean take. | A visible, real register->setText tx sequence exists for the GRANT beat. | PRD §6 Scene 2 |
| E2 | Scene 6 real-product login: verify `/app` Privy login works end to end (5.4a done); script the beat. | Real email/Google login provisions an org subname live. | PRD §6 Scene 6 |

### Group F - Doc amendments (DONE FIRST, before each group's code)
PULSE `[USER]` Active Facts + Decisions Log (tier + identity model); PRD (§1/§3/§4/§6/§7/§7.5/§7.6); ARCHITECTURE (files, integration map, file tree); FEATURE-OBSERVABLES (F-016..F-024); INVARIANTS (authz, co-hold role, identity-advisory, durable replay note); PRIZE-COMPLIANCE (ENS agent-identity deepen); CLAIMS + docs/pipeline/claims.json (new headline claims); LIMITATIONS (remove DEV-030, note stretch D2/D3). Every item carries a `[USER]`/`[SKILL]` PULSE tag so the authority chain stays valid ([USER] > canonical docs).

## Sequence
1. **F (docs-first)** for the whole delta + PULSE decisions.
2. **A1 -> A2 -> A3** (authz foundation, then collision, then funding reconcile). Gate.
3. **B1 -> B2 -> B3** (controls + monitoring). Gate.
4. **C1** (identity co-hold) alone, its own gate + VM re-run (riskiest).
5. **D1** (ENS agent identity). Gate.
6. **A4 -> A5** (rate limit + durable replay). Gate (A5 guards INVARIANT #9).
7. **E1/E2** demo verify (needs 5.4a; login now testable).
8. Final: full regression gate + BUILD-REPORT/PULSE update + hand to debug with amended docs.

## Handoff
On completion, BUILD-REPORT gets a WS-7 section (new DEVs, new observables, new risks), PULSE `### build` is amended with the delta, and the pipeline resumes at debug with all canonical docs coherent. debug/wire/verify/design_forge/demo/package read the amended docs and see every new feature.
