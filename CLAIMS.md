# CLAIMS — Headline Claims Ledger

Human-readable render of every headline claim LEASH makes in its README, demo, and submission. Each claim must be **recomputable** from a committed source: a script that re-derives the number, a tx resolvable on Etherscan/HashScan, or an env-pinned address (VERIFY-BEFORE-CLAIMING, INVARIANTS.md). No unbacked figure ships.

The machine mirror of this ledger is `docs/pipeline/claims.json`. The recompute verifier is `scripts/verify-claims.ts` (run `npm run verify:claims`), which re-derives live values into `evidence/claims-recomputed.json` and refuses to read back a stored success.

## Status legend
- `PROVEN` — recomputed live and matches; evidence pointer resolvable.
- `PENDING` — asserted by a later build phase; not yet recomputable.

## Ledger

| # | Claim | Source of truth | Recompute path | Status |
|---|---|---|---|---|
| C-1 | The Privy funding rail fails closed: an over-`fundingCap` transfer from a P-256-owned treasury returns `FUNDING_DENIED` before broadcast (INVARIANT #5). | `treasury/privy.live.ts` (WS-0 smoke #1) against @privy-io/server-auth 1.32.5 | `npm run test:live` — over-cap returns `{ denied: true, reason: 'FUNDING_DENIED' }`, no txHash, Privy `type: 'policy_violation'` | PROVEN (WS-0) |
| C-2 | The ENSv2 Sepolia ETHRegistry is live at `0x67b728a792e789a8978b30cf1b3b641f19354b43`. | pinned SOURCE LOCK (INVARIANTS.md) | `cast code 0x67b7…4b43 --rpc-url $SEPOLIA_RPC_URL` returns non-empty bytecode (`0x60806040…`) | PROVEN (WS-0) |
| C-3 | Hedera testnet payments are gas-free via the facilitator fee-payer native x402 scheme. | `scripts/hedera/client.ts` operator; WS-0 1-tinybar self-transfer | Hedera 1-tinybar self-transfer returns `SUCCESS` | PROVEN (WS-0 partial: operator liveness) |
| C-4 | Each sandbox agent's live `leash.policy` cap matches the seeded value (`data.<org>` = 5 USDC, `payments.<org>` = 2 USDC). | ENS `leash.policy` text record | `npm run verify:claims` reads live ENS and writes `evidence/claims-recomputed.json` | PENDING (seed in Phase 3) |
| C-5 | A revoke is a real Sepolia tx; the facilitator's next settle-time read returns `REVOKED` with no cache. | `facilitator/ens-read.ts` + revoke tx hash | resolvable Etherscan tx hash + live re-read returns empty policy | PENDING (facilitator in later phase) |
| C-6 | A signed-in user co-holds the on-chain kill-switch role for their agent: their Privy embedded-wallet address holds `ROLE_SET_TEXT` on the agent's `leash.policy` part-resource alongside the relayer (additive), scope-guarded to their own org (WS7 C1, INVARIANT #12). | co-hold `grant` tx + live `hasRoles(partResource, ROLE_SET_TEXT, {user,relayer})` | live role read shows BOTH user + relayer; scope-guard rejects an out-of-org grant | MECHANISM PROVEN LIVE (`agent/cohold.live.ts` 3/3: additive both-holders + scope-guard, real Sepolia grant tx). Per-agent PROVEN row lands on an `/app` register; the test revokes its throwaway grant to preserve demo state. |
| C-7 | Each agent child carries advisory ENS agent-identity text records (`agent.type`/`agent.description`/`avatar`/optional `erc8004`), off every enforcement path (WS7 D1, INVARIANT #13). | live `text(node,'agent.*')` reads + facilitator import-graph | live `text(node,'agent.type'\|'agent.description')` non-empty on `data.<org>`+`payments.<org>`; enforcement graph imports no identity module | PROVEN — records persistent + readable live (`/api/policy` returns `identity`); `facilitator/identity-isolation.integration.ts` proves the module boundary. (Reverse `setName` DEFERRED: best-effort nicety needing the agent's own gas; not implemented.) |
| C-8 | A new `/app` console agent funds in-cap on the real token and denies over-cap, without dropping existing agents (union reconcile) (WS7 A3, INVARIANT #5). | new-agent in-cap fund tx on token 0.0.10496489 + Privy policy allowlist | resolvable in-cap transfer tx on the real token; over-fund returns `FUNDING_DENIED` (no broadcast); prior agent still funds | RECONCILE IMPLEMENTED (`reconcileFundingAllowlist` union + non-empty guard, behind `requireOwner`); PROVEN row lands on a signed-in `/app` register (interactive Privy login). |

Add a row for every new headline number as it becomes provable. Move `PENDING` -> `PROVEN` only when the recompute path resolves.
