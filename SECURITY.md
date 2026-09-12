# SECURITY

LEASH is a dual-rail spend-control system for AI agents. Enforcement is **facilitator-trusted** (operator-run software reading org-controlled ENS config); Privy is the **independent second rail** on the funding flow. It is NOT "trustless" and the chain does NOT enforce the spend cap. The chain stores the policy and the revocation; the facilitator enforces the org's ENS-declared policy.

Every rejection code below is a closed-union `GateReason` (INVARIANT #1): the gate has no proceed default. A payment settles only on an affirmative `{ settle: true, auth }` object.

## Threat matrix

| Threat | Enforcement | File |
|---|---|---|
| Over-cap spend | BigInt cap compare -> `OVER_CAP` | `facilitator/authorize.ts` |
| Off-allowlist payee | allowlist check -> `OFF_ALLOWLIST` | `facilitator/authorize.ts` |
| Spend after revoke | settle-time no-cache read -> `REVOKED` | `facilitator/ens-read.ts` + `server.ts` |
| In-flight revoke (TOCTOU) | authoritative onBeforeSettle read | `facilitator/server.ts` |
| Payer spoof | `hederaAccount===payer` + sig -> `BINDING_MISMATCH` | `facilitator/authorize.ts` |
| RPC outage fail-open | outer catch -> `RPC_ERROR` | `facilitator/server.ts` |
| Replay | paymentId `seen` + Hedera dup-tx -> `REPLAY` | `facilitator/authorize.ts` + `server.ts` |
| Over-fund treasury | P-256-owner Privy policy -> `FUNDING_DENIED` | `treasury/privy.ts` |
| Malformed policy | parse guard -> `MALFORMED_POLICY` | `facilitator/authorize.ts` |

## Not defended against (honest scope)

- An agent paying via a DIFFERENT facilitator or a direct native transfer. Enforcement covers the org's own facilitator (capital-out) and the Privy funding rail (capital-in); the org-wide kill is funding-rail control + record/role revocation, not interception of every conceivable transfer.
- 30s staleness on the advisory pre-screen. This is disclosed; the settle-time read is immediate and un-cached.
- The process-memory replay set is not durable across facilitator restarts. Demo scope; production would use DB/Redis.
- Deployer key compromise. A single relayer key, scoped and testnet-only.

## Funding-rail invariant (INVARIANT #5)

The treasury wallet is created with a mandatory P-256 owner and driven via `@privy-io/server-auth` (which computes the `privy-authorization-signature`). An owner-less/raw funding call fails OPEN (proven live 2026-09-12) and is FORBIDDEN. The funding transaction is never self-broadcast: `secp256k1Sign` + self-broadcast is permitted ONLY on the agent payment/custody rail, never on the treasury funding rail, because self-broadcast bypasses policy evaluation.

WS-0 smoke #1 (`treasury/privy.live.ts`) proves an over-`fundingCap` transfer from the owner-driven treasury returns `FUNDING_DENIED` before broadcast.
