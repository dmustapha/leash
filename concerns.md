# concerns.md — LEASH (ETHOnline 2026)

Project-specific concerns derived from warroom/WINNER-BRIEF.md (Top Risks + Non-Negotiables), master doc §6 gap register, and the pre-forge review (FORGE-KICKOFF-HANDOFF §10b). Severity: [C] Critical, [I] Important, [A] Advisory.

## Critical [C]
[C] Honest framing: enforcement is pitched as forked-facilitator + Privy dual-rail, NEVER "trustless" / "the chain enforces the cap". A trustless claim is a Q&A kill and a thesis DRIFT TRIPWIRE.
[C] Real on-chain txs on the demo path: every demo state change (resolver edit, settlement, refusal, revoke) is a real Sepolia/Hedera tx. No cache on the demo revoke path; on RPC failure the facilitator errors, never falls back to allow.
[C] ENS is load-bearing via HIERARCHY + one-write revocation, not a KV store: demo parent + >=2 children with distinct caps + Permissioned-Resolver per-record permissions + EAC role revoke.
[C] Privy stays a passive policy engine on the FUNDING rail only, never an active per-tx co-signer on the payment path (collides with the forbidden Backstop co-signer shape, concern #15).
[C] Judge sandbox must be flawless: the pre-seeded acme.leash.eth hero flow (grant→spend→refuse→revoke→fail-closed→Privy DENY) is the SCORED, minimum-eligible bar. The real multi-tenant path must NEVER endanger it (master §13.6).
[C] Privy policy enforcement requires the owner + authorization-signature flow via @privy-io/server-auth (raw API calls fail-OPEN). The treasury wallet MUST be created with a P-256 owner and driven via the SDK, or the leaked-key DENY demo silently fails.
[C] Raw-unit BigInt comparison: amount (decoded tx) and maxPerCall (ENS record) are raw smallest-unit integers (3 USDC = 3000000), compared as BigInt. A human-vs-raw or hex-vs-decimal mismatch silently breaks the cap check.

## Important [I]
[I] ENSv2 alpha provisioning (G1) is the likeliest day-eater: test the provision script FIRST (WS-1 before all else), load addresses at runtime or use the pinned 2026-06-29 set. commit-reveal 2LD registration must be a local script (exceeds serverless timeouts).
[I] Treasury fundingCap must be pinned (raw 6-dec units) distinct from per-call maxPerCall, so the 2:40 leaked-key over-fund DENY beat has a concrete threshold.
[I] Agent↔ENS binding anti-spoof: facilitator asserts policy.hederaAccount === decoded tx payer (X-Leash-Agent header names the ENS record; the record self-attests the payer account).
[I] Endpoint price ($0.10) vs narrated demo amounts (3/5/50 USDC): reconcile so the demo does not narrate a literal 3-USDC charge on a $0.10 call (set demo endpoint price to narrated amounts, or narrate cap headroom).
[I] Scope/feasibility on a hard deadline: keep the minimum-eligible fallback (ENS + Hedera two-prize; Privy cut-first) as a LIVE tripwire with an explicit hour cutoff, not a last-resort afterthought.
[I] Granular commit history from hour 1 (ETHGlobal DQs single-commit-day entries); document AI usage (AI-ATTRIBUTION.md + spec files).

## Advisory [A]
[A] Negative-WOW legibility: the A/B split-screen revoke (resolver record ↔ live 402 flipping pass→fail) must read in <3min video; this is the #1 build risk per warroom CRAFT dissent.
[A] Best-UI-ever design pass (Dami): instant-legibility, progressive disclosure, warm-editorial-dark; deferred to the design phase after build ships feature-complete.
[A] Hedera SDK drift: pin @hiero-ledger/sdk 2.85.0 + @hiero-ledger/proto 2.31.0 lockstep; import via @x402/hedera; never @hashgraph/sdk.
