# WINNER-BRIEF — ETHOnline 2026 (Warroom V2)
**Idea:** Leash (name finalized 2026-09-12; was Namescope during warroom) | **Track:** Building from Scratch | **Warroom Version:** V2 | **Date:** 2026-09-10

---

## Chosen Idea
Leash makes an organization's ENSv2 name hierarchy its live treasury permission graph for a fleet of agents. Each agent gets a child name (e.g. `data.acme.eth`) whose resolver record encodes a spend capability (per-call cap, allowed payees). A self-hosted (forked) Hedera x402 facilitator reads that record before sponsoring each gas-free settlement, and Privy's server-side policy engine independently enforces the same envelope as a second rail. The org revokes any agent's spending across every service in ONE on-chain write by editing/clearing its resolver record.

## Problem Statement
Teams now deploy fleets of paying agents, but the only tools to bound what each agent can spend are raw private keys and API keys: no scoping, no hierarchy, and revocation means rotating keys across every service by hand. When an agent misbehaves or a key leaks, there is no single, instant, org-wide kill. The shocking number: a leaked agent key today requires touching every downstream service to cut it off, while a resolver edit cuts it everywhere in ONE transaction.

## Why It Won
| Criterion | Weight | Round-0 | Rationale |
|---|:---:|:---:|---|
| Technicality | 20% | 8 | Facilitator-reads-resolver-pre-settlement is genuine protocol composition; ENSv2 EAC + Permissioned Resolvers are real primitives |
| Originality | 20% | 8-9 | "Your ENS name IS your revocable spend policy" is a true didn't-know-you-could; 0-1 estimated rival collision |
| Practicality | 20% | 7 | Every primitive live TODAY (ENSv2 Sepolia beta, forkable Hedera facilitator, Privy policies); no beta, no Graph landmine |
| Usability | 20% | 6-7 | Revoke → payment fails-closed is a single visible event once shown A/B; the round's main work item |
| WOW | 20% | 8 | One on-chain write kills an agent's spending everywhere |
Round-0 criteria-weighted: **7.20** (pool #2). Won on cross-exam FLIP + challenge severity: Aftermarket (7.30) took a structural fact-check HARD-FAIL that breaks the round's very-deep-integration mandate; Leash's only CRITICAL is honestly mitigable.

## Key Deliberation Arguments (Why This Won)
1. Fact-check CLEAN across all three claims (ENSv2 Sepolia primitives live, forkable facilitator `/verify` hook — enforcement code already written, Privy policy caps+allowlist native), while both rivals hit HARD-FAILs.
2. It sidesteps the two cross-cutting V2 landmines: The Graph does NOT index Hedera (sank Aftermarket + Backstock + would have sunk V1's Callflow), and it needs no private-beta dependency (sank the CRE ideas).
3. Deepest genuine interlock that survived: remove ENS and the facilitator has nothing to authorize against; remove the facilitator and the cap is unenforced; remove Privy and a leaked key bypasses everything.

## Whitespace Occupied
W7 (ENSv2 permissioned agent namespaces) + W6 (org "agent proposes / humans control" treasury) — the unoccupied position where an agent's *right to spend* is a revocable name, not a key. NOT the crowded x402-payer middle lane.
**Event Class:** sponsor_track (declared) | **Selection Path:** scored_pool (flipped via cross-exam + challenge)

## Thesis
WINNING ARGUMENT: Leash turns an org's ENS name hierarchy into a live, revocable spend-permission graph for agent fleets, enforced at the payment rail, so cutting an agent off everywhere is one on-chain write.
EVIDENCE:
1. Fact-check-clean on all 3 sponsors with zero beta / zero Graph-on-Hedera exposure (the two landmines that broke the rivals). | 2. Genuine protocol interlock: a forked Hedera x402 facilitator reads the ENSv2 Permissioned Resolver PRE-settlement; Privy is the independent non-bypassable second rail. | 3. The demo is a single visible money event: edit/revoke a resolver record on camera and the very next identical payment flips to fail-closed.
DEMO OBLIGATION: The judge must WITNESS: a child agent paying within its ENS-encoded cap (gas-free), the same agent's over-cap payment refused, and an org editing/revoking the resolver record on camera so the very next payment fails closed — across a parent + 2-child hierarchy.
HERO FLOW: Org mints child names with scoped caps → agent pays a whitelisted API within cap (facilitator reads resolver, settles gas-free; Privy mirrors) → org revokes the record → agent's next payment fails closed everywhere.
INVARIANTS:
- Enforcement is pitched as forked-facilitator + Privy dual-rail, NEVER as "the chain enforces it" / "trustless" (the fact-check's HARD caveat).
- Privy stays a PASSIVE policy mirror (static allow/deny), never an active per-tx approver (else it collides with the forbidden Backstop co-signer shape, concern #15).
- Every demo state change is a real on-chain tx (resolver edit, settlement, refusal) — no cache on the demo path; on RPC failure the facilitator errors, never falls back to allow.
- ENS is load-bearing via the HIERARCHY + one-write revocation, not as a KV store; demo parent + >=2 children + Permissioned-Resolver per-record permissions.
DRIFT TRIPWIRES:
- if "an agent that pays for things" becomes the headline instead of "revocable name-scoped spend authority", that is drift
- if the pitch claims on-chain/trustless enforcement instead of the honest dual-rail, that is drift (and a Q&A kill)
- if Privy becomes an active co-signer/approver instead of a passive policy mirror, that is drift into a forbidden shape

AMEND-1 | 2026-09-12 | user | name (all fields) | Namescope -> Leash | project name finalized post-scoping; thesis identity unchanged, only the label

## Top Risks + Mitigations
| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | Enforcement facilitator-trusted, not chain-trustless | CRITICAL (mitigable) | Pitch honest dual-rail (forked facilitator + Privy) up front + in narration; NEVER claim chain-enforced. On-chain cap-mirror on a Hedera smart-contract wallet = roadmap/stretch |
| 2 | ENSv2 EAC is reversible roles, NOT one-way fuses | HIGH | Demo reversible role revoke (true); DROP the "grandchild higher cap reverts" fuse claim; fix all docs |
| 3 | ENS read as generic KV store → judge sees a database | HIGH | Demo the hierarchy (parent + >=2 children, different caps) + Permissioned-Resolver per-record permissions as the mechanism |
| 4 | Invisible-negative WOW illegible in <3 min video | HIGH | Split-screen resolver record <-> live 402; edit on camera -> same call flips pass/fail |
| 5 | Privy ships as a stub -> no-mock kill on B2B bullet | MED | Live leaked-key test on camera: child key submits over-cap tx -> Privy policy DENY |

## Non-Negotiables (Must Be In Build)
- Honest dual-rail framing everywhere (docs, README, video): forked facilitator + Privy, not "trustless."
- Parent + >=2 child names with distinct caps; revocation demoed as one on-chain write.
- Real on-chain txs for every demo beat; no demo-path cache; RPC-fail = explicit error, never allow.
- Privy = passive policy mirror only.
- Granular commits from hour 1 (DS-2); AI-usage spec files (DS-3); demo video 2-4 min human-voice (DS-1).

## Explicit Out-of-Scope
- Trustless on-chain enforcement of the ENS cap on Hedera (roadmap only; dual-rail is the hackathon scope).
- A public marketplace / discovery of agent names. — Mainnet. — KYC/identity beyond the demo.

## Minority Dissent (Unresolved Concerns)
- WILD + DEPTH round-0 favored Aftermarket (novelty 9, EV $17K): held — its fact-check HARD-FAIL forces a 3-chain rebuild that fails this round's deep-integration mandate; the $4K EV edge does not outweigh a broken interlock + fabricated-state relay risk.
- CRAFT's legibility concern (6.2) is real and is the winner's #1 build risk — mitigated by the A/B split-screen revoke demo, but it must be nailed in demo-rehearsal.
