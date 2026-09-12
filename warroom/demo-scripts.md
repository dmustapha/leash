# DEMO SCRIPTS — ETHOnline 2026 presented pool (3:00 each)

## DEMO SCRIPT — Floatline (3:00) — verdict: STRONG
### Scene 1: [Screen: terminal + wallet balance + HCS explorer 3-pane] — 0:00-0:20
Judge sees: agent opens a $1.00 float; Blocky402 ceiling signature; HashScan shows the pre-armed Scheduled Transaction (refund, T+120s) already on-chain. Proves: refund exists BEFORE any service call.
### Scene 2: [Screen: metered calls streaming] — 0:20-1:00
Judge sees: 37 paid calls tick by; per-call HCS receipts scroll; float drains $0.37. Proves: real metering, real settlement.
### Scene 3: [Screen: buyer process killed] — 1:00-1:40
Judge sees: `kill -9` the buyer; terminals idle; countdown hits T+120s; the Scheduled Tx FIRES BY ITSELF; $0.63 lands in the dead buyer's wallet. **WOW #1: money returns to a switched-off agent.** Proves: no keeper, no counterparty, network-enforced.
### Scene 4: [Screen: provider bond panel] — 1:40-2:30
Judge sees: provider's $50 USDC bond; backend killed mid-response; SLA check fails (schema timeout); pre-armed refund fires FROM THE BOND; bond balance visibly bleeds. **WOW #2: the service punishes itself while its owner does nothing.** Proves: two-sided, veto-free.
### Scene 5: [Screen: HCS verdict trail + fork-and-run] — 2:30-3:00
Judge sees: full audit trail; `git clone && npm run demo` wraps a second service in 60s. Proves: it is a kit, not a one-off.

## DEMO SCRIPT — BotTax (3:00) — verdict: STRONG
### Scene 1: [Screen: split view, one URL] — 0:00-0:30
Judge sees: left, human completes World verification and calls the API: receipt $0.005. Right, headless agent, same URL: receipt $0.50. Both settle real USDC on-chain. **WOW at 0:30: same endpoint, two economies.** Proves: price bound to WHO pays, no accounts.
### Scene 2: [Screen: replay attack] — 0:30-1:10
Judge sees: agent replays the human's proof; quote refuses to discount (nullifier check shown). Proves: the discount is unforgeable.
### Scene 3: [Screen: sybil curve chart] — 1:10-2:10
Judge sees: one human's 5 agents walk up ONE escalating curve (cost/call rising live); a second verified human calls once — flat cheap tier. Total-spend comparison lands: farming is unprofitable by construction. Proves: per-human economics.
### Scene 4: [Screen: gateway wrap] — 2:10-3:00
Judge sees: any OpenAPI spec wrapped with the pricing layer via Bazantic gateway; a third live service goes species-priced in a minute. Proves: drop-in infra with a live consumer.

## DEMO SCRIPT — Callflow (3:00) — verdict: STRONG
### Scene 1: [Screen: live paid API + HashScan] — 0:00-0:30
Judge sees: a real x402 service earning paid requests; HCS receipts tick. Proves: revenue is real, not seeded (U7).
### Scene 2: [Screen: ATS mint] — 0:30-1:10
Judge sees: mint 100 CALLFLOW-01 revenue-share tokens on ATS; HashScan-verified contract; investor wallet buys 30 for real USDC. Proves: compliant issuance rail, real capital in.
### Scene 3: [Screen: two wallets side by side] — 1:10-2:20
Judge sees: script hammers the API with paid requests; BOTH wallets tick upward per-call, split 70/30 at settlement; HCS trail links each payment → split. **WOW: dividends arriving at request granularity.** Proves: revenue never touches the operator first — skim unrepresentable.
### Scene 4: [Screen: Graph dividend subgraph] — 2:20-3:00
Judge sees: live subgraph dashboard of service revenue health + holder yields across services. Proves: composable, indexed, an investable asset class for the agent economy.

## DEMO SCRIPT — Headcount (3:00) — verdict: STRONG
### Scene 1: [Screen: auction UI + fork explorer] — 0:00-0:30
Judge sees: live CCA token auction; clearing price curve moving continuously. Proves: real v4 CCA venue.
### Scene 2: [Screen: one human, four identities] — 0:30-1:30
Judge sees: same human bids from 3 wallets + 1 agent; all four drain ONE shared cap; the 4th bid REVERTS on-chain with the nullifier collision in the revert reason. **WOW: the sybil dies inside the auction itself.** Proves: cap follows the human, not the key.
### Scene 3: [Screen: sybil script] — 1:30-2:20
Judge sees: a 20-wallet bot script fires; allocation table shows it nets exactly one human share; counter "bids: 14, humans: 14". Proves: fairness is a provable property.
### Scene 4: [Screen: clearing + Graph subgraph] — 2:20-3:00
Judge sees: auction clears uniform-price; allocations land; the live auction-state subgraph that agent bidders read. Proves: agents are first-class, data is live.

## DEMO SCRIPT — Lifewire (3:00) — verdict: STRONG
### Scene 1: [Screen: video stream + USDC drip counter] — 0:00-0:40
Judge sees: a live stream playing; beside it a per-second USDC heartbeat landing on Arc (sub-second finality receipts). Proves: the meter is the money.
### Scene 2: [Screen: wallet closed] — 0:40-1:20
Judge sees: presenter closes the paying wallet; stream freezes in <1s, timed on screen. Reopens; revives. **WOW: money behaving like electricity.** Proves: existence gated on payment flow, no subscription state.
### Scene 3: [Screen: two clients, one GPU slot] — 1:20-2:20
Judge sees: two agents bid heartbeats for one scarce inference slot; higher drip visibly steals the resource; loser's session dies mid-token. Proves: price-priority allocation per finality window.
### Scene 4: [Screen: Privy flow + mainnet checklist] — 2:20-3:00
Judge sees: session wallet holding the drip via a complete Privy flow; Arc mainnet-launch checklist green. Proves: complete financial flow + mainnet-ready.

## DEMO SCRIPT — Undertow (3:00) — verdict: THIN-leaning-strong (explanation cost of TEE step; flagged)
### Scene 1: [Screen: maker console] — 0:00-0:30
Judge sees: maker types a secret spread curve; submit; payload visibly encrypted into CRE Confidential workflow. Proves: parameters never public.
### Scene 2: [Screen: fork explorer] — 0:30-1:20
Judge sees: a SwapVM strategy program goes live against the shared Aqua balance; a real swap executes at the secret price. Proves: TEE-compiled strategy actually trades.
### Scene 3: [Screen: attacker terminal] — 1:20-2:10
Judge sees: script greps calldata, state, workflow I/O for the curve — nothing. **WOW: the price exists, the curve does not.** Proves: adversarially private.
### Scene 4: [Screen: second maker joins] — 2:10-3:00
Judge sees: second maker's blind strategy joins the SAME balance, no rebalancing tx; solvency panel stays green. Proves: one balance, many blind strategies — Aqua's hardest promise.

## DEMO SCRIPT — Settle402 (3:00) — verdict: THIN (mechanism is plumbing; wow is a recovery, not a money-moment; flagged for checkpoint)
### Scene 1: [Screen: MCP session] — 0:00-0:40
Judge sees: agent calls paid tool; 402 continuation; ceiling signed once, gas-free. Proves: the documented-gap pattern working.
### Scene 2: [Screen: metered calls] — 0:40-1:30
Judge sees: three calls settle async; HCS scrolling; per-index-row prices itemized on a real multi-subgraph risk query. Proves: real metered work.
### Scene 3: [Screen: facilitator killed] — 1:30-2:20
Judge sees: facilitator process killed mid-call; continuation recovers on restart and settles. **WOW: the literal #903 failure mode, survived.** Proves: the async pattern is robust, not happy-path.
### Scene 4: [Screen: 20-line wrap + docs] — 2:20-3:00
Judge sees: second service wrapped in ~20 lines; the documentation page closing issues #903/#892/#1007. Proves: kit + docs = the sponsor's missing piece.
