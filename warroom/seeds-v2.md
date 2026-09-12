# V2 SEEDS (beefed-up incumbents — enter as [SEED], ZERO protection, must survive the gauntlet on merit)

These are the two V1 leaders, deepened per the V2 "very deep integration" mandate. They are the BAR to beat on integration depth + novelty. A new idea that does not out-interlock these should not displace them; these themselves die if they cannot pass the raised gates or a stronger interlock emerges.

## SEED-A: Callflow (beefed) — the self-distributing API security
**Core idea:** an x402-paid API's revenue becomes an investable, self-distributing on-chain security.
**Deep interlock (5 primitives, each load-bearing — remove any one and it breaks):**
1. x402/Blocky402 — every per-call payment enters gas-free; facilitator VERIFIES payTo = splitter contract (operator never in the money path).
2. Splitter contract — custody + permissionless distribute(); no skim code path.
3. Hedera ATS (ERC-1400) — the revenue-share token + ownership SNAPSHOTS that distribute() reads (the dividend math literally requires ATS snapshots).
4. Hedera Scheduled Transactions — optional auto-distribute cadence (streamed dividends fire with no keeper), OR distribute() poked per call.
5. HCS — every payment + every distribution notarized; the audit trail holders trust.
+ The Graph (2 products: dividend subgraph + Token API) — discovery/indexing of revenue health across services; agents value tokens off live indexed cashflow.
**Why the COMPOSITION is the novelty:** no single primitive makes "API revenue = a self-distributing security" — it emerges only when x402 receipts feed a contract whose distribution is bound to ATS snapshots and audited on HCS. That interlock is the mechanism.
**Prize combo:** Hedera x402 $6K + Hedera ATS $6K + Graph Composable $5K ($17K, 0 rival collisions).
**Open weakness to fix in V2 or via a stronger sibling:** day-1 token BUYER realism (C13) — who buys revenue tokens of a fresh API? Beef target: a built-in demand sink (e.g. power-users auto-receive rebate tokens; or a bonding-curve primary sale) so the buyer isn't just a second wallet.

## SEED-B: Lifewire (beefed) — pay-per-second existence, now agent-decisioned
**Core idea:** resources that live only while a USDC heartbeat flows; agents bid heartbeats for scarce capacity.
**Deep interlock attempt (honest — its known weakness is that Nanopayments enforcement is off-chain):**
1. Circle Nanopayments on Arc — per-second metered vouchers (the meter is the money).
2. Privy policy engine + quorum — the drip wallet is a real agent treasury: spend policies, budget caps, m-of-n for scale-ups (makes Privy LOAD-BEARING, not a login).
3. A verifiable decision signal for the GPU/resource AUCTION — the agent bids based on live demand; candidate load-bearing source: The Graph subgraph of resource utilization, or World humanId to weight human-backed bidders. The auction (price-priority allocation per finality window) is the novel core, not the on/off stream.
4. Arc mainnet deploy (+$2.5K bonus) — real USDC settlement receipts on-chain as the audit artifact.
**Why the COMPOSITION could be novel:** an on-chain resource AUCTION cleared continuously by payment-rate, with agent bidders governed by real treasury policy — not just "stream gates access."
**Open weakness (structural, may not survive):** U6 depth — Nanopayments run on 12 chains and enforcement is a daemon; the chain is not load-bearing for the KILL. Beef target: find a genuinely chain-enforced settlement/collateral leg, or accept it competes on spectacle + the auction mechanism. If V2 cannot make Arc load-bearing, Lifewire SHOULD lose to a deeper interlock — that is the test Dami asked for.
