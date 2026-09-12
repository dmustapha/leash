# Limitations — LEASH

Honest scope boundary: what is built vs what is deliberately gated. Every gated item names its reason.

## In scope (built + demonstrable for this submission)
- ENSv2 Sepolia 3-level hierarchy (root → org → agent) with EAC role grant/revoke and Permissioned-Resolver `leash.policy` text records read as live settlement policy.
- Self-hosted Hedera x402 facilitator: reads ENS pre-settlement, enforces cap + allowlist + binding (BigInt raw units), settles native gas-free (fee-payer), logs ALLOW/DENY to HCS. Fail-closed on RPC/malformed/revoked/replay.
- Real paid request end-to-end on Hedera testnet with own HTS USDC; HashScan-verifiable.
- Privy P-256-owner treasury wallet + funding policy (cap + allowlist) + live leaked-key over-fund DENY.
- Judge sandbox (`/demo`, zero-setup, server-orchestrated) driving the full hero flow: grant → spend → refuse → revoke (fail-closed) → Privy DENY.
- Revocation as one on-chain write (clear record OR revoke EAC role) with the next payment failing closed.

## Feature-gated (deliberately not built for this scope)
- **Trustless on-chain enforcement of the cap** (Hedera contract wallet + on-chain cap mirror). Reason: multi-day build; out of the window. Roadmap. (D-1)
- **Full real multi-tenant console** (`/app` beyond a working login + org-subname provision). Reason: time; sandbox-first tripwire ships a working sign-in + cuts the rest if the clock runs out. (D-6)
- **Durable replay store** — the `seen` paymentId set is process-memory. Reason: demo scope; production would back it with the DB/Redis. Restarting the facilitator clears it.
- **Instant revocation on the advisory pre-screen** — the `/app` (non-demo) pre-screen may be ≤30s stale. Reason: latency; the authoritative settle-time read is always immediate and no-cache. (INVARIANT #3, disclosed)
- **Public agent-name marketplace / discovery.** Reason: out of thesis scope (explicit warroom out-of-scope).
- **Mainnet deployment / real funds.** Reason: ENS prize requires Sepolia; Hedera uses testnet; no real value at risk by design.
- **Ledger / other-sponsor integrations.** Reason: max 3 prize selections (ENS + Hedera + Privy); breadth beyond 3 adds zero prize EV.
- **Aggregate/velocity spend limits beyond `fundingCap`.** Reason: per-call cap is `maxPerCall`; the aggregate bound is `fundingCap` on the funding rail. No per-second rate limit on in-cap payments (honest scope, INVARIANT #9).

## Known honest caveats (repeat at demo-rehearsal)
- Enforcement is facilitator-trusted, not chain-trustless. An agent with funds could pay via a different facilitator or a direct transfer; LEASH governs the org's own facilitator (capital-out) + the Privy funding rail (capital-in). The org-wide kill is funding-rail control + record/role revocation.
- ENSv2 Sepolia is alpha; the 3-level `getEnsText` read path is the least-tested surface (WS-1 read-back proves it).
