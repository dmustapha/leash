# ROUND-0 POOL V2 — ETHOnline 2026 (randomized order; scores/origins stripped). Score each 1-10 on Technicality/Originality/Practicality/Usability/WOW.

## Streamvault
Mechanism: ONE self-custodied 1inch Aqua LP balance backs multiple SwapVM strategies; a Chainlink CRE TEE handler runs confidential signal logic and only the chosen-strategy-id crosses back to trigger the Aqua reallocation (the alpha stays private); consumers subscribe to strategy output and pay per-second via Circle Nanopayments on Arc. The one balance earns swap fees AND metered subscription revenue.
Interlock: Aqua one-balance-many-strategies (remove→no capital-efficiency, vault-per-strategy) + CRE TEE (remove→strategy alpha public, front-run) + Arc Nanopayments (remove→per-second billing uneconomic). Composition: a self-custodied strategy fund with a private brain and a metered output stream.
Prize-combo: 1inch Aqua $5K + Chainlink CRE $2K + Arc Agentic+mainnet ~$1.67K+. LOW crowding. RISK: Aqua 2h+ ramp AND CRE private-beta = double ship dependency.

## Aftermarket
Mechanism: an x402 API mints Hedera ATS "call-credit" tokens sold on a bonding curve; buying a credit is a real prepayment, redeeming one is a gas-free Blocky402 call (credit burned, HCS-notarized), unused credits are freely resellable on the curve. The day-1 buyer is a USER who wants cheaper future calls, not a speculator (fixes the "who buys revenue tokens" problem). A Graph subgraph indexes redemption velocity so curve price tracks real usage.
Interlock: ATS (remove→no compliant transferable fixed-supply credit) + Blocky402 gas-free x402 (remove→gas-less agents can't redeem) + HCS (remove→supply unauditable, curve gameable) + Graph (remove→price can't track usage). Composition: prepaid API calls as a liquid, resellable instrument owning usage not dividends.
Prize-combo: Hedera ATS $6K + Hedera x402 $6K + Graph Composable $5K = $17K. LOW-MED. LOW beta risk.

## Leash
Mechanism: an org registers a parent ENSv2 name and mints child names whose Permissioned Resolver + Agent Text Records encode a spend capability (rail, max/call, allowed payees). A Blocky402 facilitator READS the ENSv2 resolver before sponsoring each x402 settlement — the name IS the spend policy, clamped gas-free. Privy policy engine holds each child key and double-enforces the same envelope. Re-delegation can only NARROW.
Interlock: ENSv2 Enhanced Access Control (remove→no hierarchical narrows-only capability tree) + Blocky402 facilitator (remove→ENS cap is unenforced metadata) + Privy policy (remove→leaked child key bypasses ENS). Composition: an org's namespace hierarchy literally IS its treasury permission graph; editing a resolver instantly revokes payment authority.
Prize-combo: ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K = $13K. MED (W7 fresh). LOW beta risk.

## Backstock
Mechanism: an agent hits a paywall it can't afford; Backstock advances the exact shortfall as a gas-free Blocky402 payment to the service, records the loan on HCS, and takes a first-lien on the agent's next inbound x402 receipt (routed through a splitter that repays Backstock before the agent). The Graph indexes each agent's live inbound cashflow so the credit limit is priced off real observed revenue, not a score.
Interlock: Blocky402 gas-free x402 (remove→broke agent needs gas, premise dies) + splitter with facilitator-verified payTo (remove→no lien, lender stiffed) + Graph cashflow subgraph (remove→can't underwrite, collapses to a score). Composition: undercollateralized working capital for agents, force-repaid from the next receipt, priced off live indexed cashflow.
Prize-combo: Hedera x402 $6K + Graph Composable $5K + Hedera ATS $6K (loan note as ATS) = $17K. LOW crowding. MED risk (lending logic).

## Proofstream
Mechanism: an agent pays per-call (x402, gas-free) for an SLA-bound service; a Chainlink CRE TEE periodically runs a CONFIDENTIAL health probe (probe logic sealed so the operator can't spoof it) and emits pass/fail on-chain; on fail a splitter auto-refunds the affected window's payers from a Hedera ATS-tokenized SLA bond the operator posted; HCS notarizes probes, breaches, refunds; refund math reads ATS holder snapshots.
Interlock: CRE TEE probe (remove→self-reported uptime is spoofable) + ATS SLA bond (remove→no snapshot-able collateral to refund from) + Blocky402 meter (remove→no per-call window to refund). Composition: self-enforcing SLA insurance — a paywall that refunds you out of a bonded pool when a probe it cannot spoof reports a breach.
Prize-combo: Chainlink CRE $2K + Hedera ATS $6K + Hedera x402 $6K = $14K. LOW-MED (M2 whitespace). RISK: CRE private-beta.

## Escrow-in-the-dark
Mechanism: a buyer agent pays for a work product via x402 into escrow; release is gated by a Chainlink CRE TEE handler that runs a PRIVATE acceptance test (schema/quality/spec-match logic stays confidential so sellers can't game it) and only a pass/fail boolean crosses back to trigger release; Privy quorum + intents hold the buyer-org's escrow so large releases need m-of-n human approval, small ones auto-release.
Interlock: CRE TEE (remove→public acceptance test gets gamed) + Privy quorum/intents (remove→release is a single-key auto-pay, not org treasury) + x402 escrow-in (remove→no agent-native metered funding). Composition: an escrow that releases on a quality test the seller can never see and therefore never game, gated by real org m-of-n.
Prize-combo: Chainlink CRE $2K + Privy Financial-Flow $2.5K + Hedera x402 $6K = $10.5K. LOW. RISK: CRE private-beta.

## Rebate
Mechanism: every x402 micropayment for a metered service accrues into a rebate pot; at each finality window a Uniswap CCA continuous auction clears "who gets rebated" — but the CCA hook is a World Selfie Check zk-eligibility gate, so only wallets with a verified distinct humanId can bid the rebate down. Bots pay full price forever; humans reclaim a share via fair uniform-price clearing; HCS notarizes every payment and clearing.
Interlock: Blocky402 gas-free x402 (remove→micro-rebate eaten by gas) + Uniswap CCA hook (remove→no continuous fair clearing to carry the eligibility extension) + World Selfie Check (remove→bots reclaim the pot, it's just cashback). Composition: human-preferential price discrimination — a paywall that per-window auctions refunds to only the real humans behind paying agents.
Prize-combo: Hedera x402 $6K + Uniswap CCA $3K + World Selfie Check $3.5K = $12.5K. Near-zero crowding. RISK: CCA maturity + World TestFlight = double fact-check.
