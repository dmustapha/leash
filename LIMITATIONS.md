# Limitations — LEASH

Honest scope boundary: what is built vs what is deliberately gated. Every gated item names its reason.

## In scope (built + demonstrable for this submission)
- ENSv2 Sepolia 3-level hierarchy (root → org → agent) with EAC role grant/revoke and Permissioned-Resolver `leash.policy` text records read as live settlement policy.
- Self-hosted Hedera x402 facilitator: reads ENS pre-settlement, enforces cap + allowlist + binding (BigInt raw units), settles native gas-free (fee-payer), logs ALLOW/DENY to HCS. Fail-closed on RPC/malformed/revoked/replay.
- Real paid request end-to-end on Hedera testnet with own HTS USDC; HashScan-verifiable.
- Privy P-256-owner treasury wallet + funding policy (cap + allowlist) + live leaked-key over-fund DENY.
- **Funding-allowlist reconcile (WS7 A3, was the DEV-030 caveat, now IN SCOPE):** on agent register the new agent's EVM-facade address is added to the Privy funding-policy allowlist, so a newly-registered console agent can be funded in-cap (real transfer) while an over-fund still DENIES `FUNDING_DENIED`. The register-time allowlist gap is closed; funding is no longer limited to pre-seeded agents. (F-018)
- **Co-hold identity model (WS7 C1):** in `/app`, the signed-in user co-holds the kill-switch EAC role for their own agents; the relayer is a delegated operator (gasless ops), not the sole custodian. The user has real on-chain revoke authority (INVARIANT #12, F-023). This is the `/app` identity model, distinct from the `/demo` sandbox (server-orchestrated, no login).
- **Console controls (WS7 B1/B2):** allowlist edit (rewrites `leash.policy` on-chain) and un-revoke / re-activate (setPolicy rebind + DB status) in `/app`, both authz-guarded. (F-020, F-021)
- **Live spend feed (WS7 B3):** `/app` per-agent + org-level feed indexed from HCS (name/decision/amount/reason/ts). Index layer, off enforcement. (F-022)
- **ENS agent-identity records (WS7 D1):** advisory agent-identity text records + reverse name per agent child, surfaced in UI/`/proof`; never an enforcement input (INVARIANT #13). (F-024)
- **Console authz (WS7 A1) + rate limiting (WS7 A4) + durable replay store (WS7 A5):** every `/app` route verifies the Privy auth token (INVARIANT #11); demo + mutation routes are rate-limited (`429`); the replay `seen` set is Neon-backed so `REPLAY` survives a facilitator restart (INVARIANT #14).
- Judge sandbox (`/demo`, zero-setup, server-orchestrated) driving the full hero flow: grant → spend → refuse → revoke (fail-closed) → Privy DENY.
- Revocation as one on-chain write (clear record OR revoke EAC role) with the next payment failing closed.

## Feature-gated (stretch, not built this scope)
- **Trustless on-chain enforcement of the cap** (Hedera contract wallet + on-chain cap mirror). Reason: multi-day build; out of the window. Roadmap. (D-1)
- **D2 - Hedera extras** (HCS-14 agent identity, x402 metering / aggregate billing, Scheduled Transactions). Reason: prize-deepener beyond the WS-7 ambition tier (Correctness + controls + D1); held as stretch. The x402 leg already qualifies via the live paid request + HCS audit (F-001/F-014); D2 adds no new prize gate.
- **D3 - Privy 2nd control** (a co-signer/approver control beyond the funding policy). Reason: INVARIANT-protective to omit - an active approver re-opens the thesis drift E-2 was dropped for (INVARIANT #6 / concern #4 [C]). The Privy prize qualifies on ONE control; held as stretch, not needed.
- **Instant revocation on the advisory pre-screen** — the `/app` (non-demo) pre-screen may be ≤30s stale. Reason: latency; the authoritative settle-time read is always immediate and no-cache. (INVARIANT #3, disclosed)
- **Public agent-name marketplace / discovery.** Reason: out of thesis scope (explicit warroom out-of-scope).
- **Mainnet deployment / real funds.** Reason: ENS prize requires Sepolia; Hedera uses testnet; no real value at risk by design.
- **Ledger / other-sponsor integrations.** Reason: max 3 prize selections (ENS + Hedera + Privy); breadth beyond 3 adds zero prize EV.
- **Aggregate/velocity spend limits beyond `fundingCap`.** Reason: per-call cap is `maxPerCall`; the aggregate bound is `fundingCap` on the funding rail. No per-second rate limit on in-cap payments (honest scope, INVARIANT #9).

## Known honest caveats (repeat at demo-rehearsal)
- Enforcement is facilitator-trusted, not chain-trustless. An agent with funds could pay via a different facilitator or a direct transfer; LEASH governs the org's own facilitator (capital-out) + the Privy funding rail (capital-in). The org-wide kill is funding-rail control + record/role revocation.
- ENSv2 Sepolia is alpha; the 3-level `getEnsText` read path is the least-tested surface (WS-1 read-back proves it).
