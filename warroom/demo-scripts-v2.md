# V2 DEMO SCRIPTS (3:00 each) — hollow detector + U7 earned-state check

> SUPERSEDED / WARROOM-ERA COMPARISON ARTIFACT (all 8 candidate ideas, retained for provenance). This is NOT the canonical LEASH demo script. The canonical LEASH demo = `docs/LEASH-MASTER-BUILD-DOC.md` §7 (and `warroom/SCOPING-LEASH.md` §Demo). On any conflict, the master doc wins. The Leash beat below at 2:10-3:00 (grandchild "narrows-only" fuse) is a DROPPED claim: ENSv2 EAC is reversible roles, not one-way fuses (WINNER-BRIEF Risk #2). Do NOT lift beats from this file.

## Aftermarket — verdict STRONG
0:00-0:30 [Screen: bonding-curve UI + wallet] buy 10 call-credits (real USDC in, curve price ticks up, HashScan-verified ATS mint). Proves: prepayment is real, credit is a real token.
0:30-1:20 [Screen: MCP/agent terminal] agent redeems 3 credits as gas-free Blocky402 calls to the live API; credits burn; HCS receipts scroll. Proves: the credit IS usage; gas-less agent can spend it.
1:20-2:20 [Screen: curve + second wallet] resell 2 unused credits back to the curve for USDC (price adjusts); a Graph dashboard shows redemption velocity driving the curve. WOW: prepaid API calls behave as a liquid, resellable asset owned by the USER. Proves: intrinsic demand sink (buyer = user, not speculator).
2:20-3:00 [Screen: Graph subgraph] two Graph products (subgraph + Token API) show usage-priced credits across services. Proves: composable, live-data-priced.

## Proofstream — verdict STRONG (invisible-probe caveat)
0:00-0:30 [Screen: service dashboard + ATS bond] operator posts a $50 USDC SLA bond as an ATS token; agent starts paying per-call (x402, HCS receipts). Proves: real bond, real metered calls.
0:30-1:20 [Screen: CRE probe log] the sealed CRE TEE probe runs, emits pass on-chain; service healthy. (Caveat: probe logic is private — narration must make "operator can't spoof it" legible.)
1:20-2:20 [Screen: kill the service] operator's endpoint killed on camera; next CRE probe emits FAIL; splitter AUTO-REFUNDS the window's payers from the ATS bond; bond balance visibly bleeds. WOW: a paywall that refunds you when it breaks its promise, judged by a probe it can't cheat. Proves: self-enforcing SLA insurance.
2:20-3:00 [Screen: HCS trail] probe verdicts + breach + refunds notarized; ATS snapshot shows who got refunded. Proves: auditable, snapshot-correct.

## Leash (was Namescope) — verdict STRONG
0:00-0:30 [Screen: ENS app on Sepolia] org mints child name ads.acme.eth with a $5/call cap + payee allowlist in Agent Text Records. Proves: capability lives in the name, on-chain.
0:30-1:20 [Screen: agent terminal] child agent pays a whitelisted API $3 (Blocky402 facilitator reads the resolver, settles gas-free). Then tries $50 → facilitator REFUSES (reads the cap). WOW #1: the name is the spend limit.
1:20-2:10 [Screen: ENS + revoke] org edits/revokes the resolver record; the very next identical payment FAILS CLOSED live. WOW #2: revoke a name, kill spending everywhere in one write.
2:10-3:00 [Screen: re-delegation attempt] child tries to mint a grandchild with a HIGHER cap → ENS access control reverts (narrows-only); Privy double-enforcement shown. Proves: attenuation is structural, dual-layer.

## Escrow-in-the-dark — verdict STRONG (private-test legibility caveat)
0:00-0:30 [Screen: buyer agent] pays for a deliverable via x402 into escrow (Privy org wallet holds it). Proves: real escrowed funds.
0:30-1:30 [Screen: seller submits good work → CRE] CRE TEE runs the PRIVATE acceptance test, returns pass; Privy 2-of-3 approve; escrow releases USDC. Proves: pass → release.
1:30-2:20 [Screen: seller submits subtly-bad work] CRE returns FAIL (criteria never revealed); escrow stays locked, buyer refunded; a cross-read attempt on the TEE criteria is denied. WOW: a grading test the seller can't see and can't game.
2:20-3:00 [Screen: Privy quorum + HCS] show large release needing m-of-n, small auto-releasing; audit trail. Proves: real org treasury flow.

## Backstock — verdict STRONG
0:00-0:40 [Screen: agent + paywall] agent needs $5, has $2; Backstock fronts $3 gas-free to the service (HCS loan note). Proves: broke agent gets fronted, no gas held.
0:40-1:40 [Screen: agent completes job] agent earns $10 inbound; splitter auto-repays $3+fee to Backstock FIRST (first-lien), agent keeps $7. WOW: force-repaid from the very next receipt, no trust. Proves: non-custodial lien.
1:40-2:40 [Screen: Graph cashflow dashboard] the agent's credit limit rises as its indexed inbound revenue grows. Proves: underwriting priced on live cashflow, not a score.
2:40-3:00 [Screen: ATS loan-note] the loan itself is an ATS instrument. Proves: composable credit.

## Streamvault — verdict THIN-leaning-strong (private-brain invisible; double ship risk)
0:00-0:40 [Screen: one Aqua LP balance] CRE picks strategy A (logic hidden); Aqua reallocates on-chain across SwapVM strategies. Proves: one balance, many strategies.
0:40-1:40 [Screen: consumer streams USDC/sec on Arc] subscribes to strategy output; stop paying → stream cuts at next finality window. Proves: per-second metered output.
1:40-2:40 [Screen: LP dashboard] one balance earning BOTH swap fees AND subscription income; attacker tries to read the strategy alpha → denied. WOW: a self-custodied fund with a private brain and a metered output stream.
2:40-3:00 [Screen: HashScan] real fills + real USDC/sec. Caveat: "private brain" is invisible; needs narration. RISK: Aqua 2h+ ramp AND CRE beta.

## Rebate — verdict STRONG (double fact-check risk)
0:00-0:40 [Screen: two agents hammer one paid API] one bound to a real humanId (Selfie Check passed live), one a bare bot; payments stream gas-free. Proves: real metered payments.
0:40-1:40 [Screen: CCA auction window closes] the human-gated CCA hook clears; the human wallet RECEIVES a USDC rebate on-chain; the bot's rebate bid is rejected by the zk-eligibility hook. WOW: a paywall that pays real humans back and structurally excludes bots.
1:40-2:40 [Screen: sybil attempt] 20 bot wallets try to claim rebates → all rejected (no humanId); HCS shows fair clearing. Proves: human-preferential price discrimination.
2:40-3:00 [Screen: FEEDBACK.md + HCS] Uniswap CCA feedback doc; audit trail. RISK: CCA maturity + World TestFlight.
