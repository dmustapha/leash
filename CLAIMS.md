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

Add a row for every new headline number as it becomes provable. Move `PENDING` -> `PROVEN` only when the recompute path resolves.
