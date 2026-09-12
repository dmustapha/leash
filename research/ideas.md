# ETHOnline 2026 — Ideas
## Selected: [AWAITING WARROOM DELIBERATION]

## Pool Stats
- Raw generated: 36 (G1:7 G2:7 G3:8 G4:7 G5:7)
- Hybrids: 4 (Floatline G3xG5, Settle402 4-way, Headcount 3-way, Callflow G5xG4, BotTax G5xG2) | Late entrants: [SEED] 0, [HISTORY] 1 (Meshwork Escrow via G4)
- Killed — kill list/concerns: 5 | demo test: 0 | score floor: 4 | spike/cluster: 8 | anti-attractor: 0
- Brief levers: ~17.5/20 mapped (88%) | Regeneration rounds: 0 | Rescued: 0
- Presented: 7
- injection: lint pass, quota 2/2/2/10

## Presented Pool

### #1: Floatline — the trust rail that makes unknown x402 services safely payable (two-sided: refundable float + slashable service bond)
**Score:** 23.5/25 — Ship 4 | Demo 5 | Sponsor 5 | Novel 4.5 | Memorable 5
**Mechanism:** Buyer agent pre-funds a Blocky402 spending ceiling as float; a Hedera Scheduled Transaction armed at session-open auto-refunds every unconsumed cent at expiry — fires even if both parties vanish. Provider escrows a slashable USDC bond; every response carries a machine-checkable SLA (schema/latency/block-height-staleness); failed SLA = refund paid from bond via pre-armed Scheduled Tx the provider cannot veto. All verdicts on HCS.
**Why this chain (U6):** Only Hedera has all three halves: gas-free ceiling (float without payer holding gas), Scheduled Transactions (refunds that fire with no live counterparty, no keeper), HCS (consensus-timestamped verdict trail). On EVM this is a keeper-trusting escrow — the trust it exists to remove.
**3-min demo shape:** Agent streams metered calls off a $1 float; buyer process killed on camera; at expiry the Scheduled Tx fires BY ITSELF, 63 cents lands back in the dead buyer's wallet. Then the provider side: backend killed mid-response, SLA fails, pre-armed refund fires from the provider bond while the "owner" does nothing; bond balance visibly bleeds.
**TASTE:** U1,U2,U3,U6,U7,C-DF1 | **Primitives:** F16xF13xF29 (institution: float+bond clearing; clamp locus=ceiling; delivery-proof gates settlement — NOT reputation) | **Law-check:** L2 (both sides' own capital; cheats unrepresentable; refusal=climax), L3, L11, L12
**Origin:** hybrid(G3xG5) | **Prize-combo:** Hedera x402 $6K + Hedera OSS Harness $2K + Bazantic $1K (addressable ~$9K; sponsor pools $18K)

### #2: BotTax — same endpoint, two economies: humans pay 100x less
**Score:** 23/25 — Ship 4 | Demo 5 | Sponsor 4.5 | Novel 4.5 | Memorable 5
**Mechanism:** x402 pricing layer where the 402 challenge itself evaluates World proof-of-human: valid humanId = cheap tier, headless agent = 100x machine rate; per-human escalating curves make sybil farms climb ONE curve (50 agents, one human, one curve). Services stop blocking bots and start billing them.
**Why this chain (U6):** World AgentKit is the only primitive fusing proof-of-human + x402 payment in one endpoint — binding WHO pays to WHAT they pay without accounts. Blocky402 makes the $0.005 human request economically real.
**3-min demo shape:** Split screen: human does Selfie Check, pays $0.005; headless agent hits same URL, pays $0.50 — both settle real USDC in seconds. Agent replays the human's proof → quote refuses to discount. Sybil farm chart: 5 agents walk up one curve; second human stays cheap. "Priced by species."
**TASTE:** U1,U2,U3,U6,C-DF1 | **Primitives:** F13 remix (clamp locus shifted to per-humanId — a metering dimension no receipt project has) | **Law-check:** L2 (replay structurally rejected), L3, L9 (block bots→bill bots), L12, L15 (stranger curls twice)
**Origin:** hybrid(G5xG2) | **Prize-combo:** World Selfie Check $3.5K + Hedera x402 $6K + Bazantic $1K (addressable ~$10.5K pools; realistic ~$4.7K) | RISK: Selfie Check sandbox = TestFlight (mobile dependency — fact-check)

### #3: Callflow — securitize an API: revenue-share tokens whose dividends arrive per-call
**Score:** 22.5/25 — Ship 3.5 | Demo 5 | Sponsor 5 | Novel 4.5 | Memorable 4.5
**Mechanism:** An x402 service mints Hedera ATS revenue-share tokens; the payment facilitator splits EVERY incoming micropayment pro-rata to token holders AT SETTLEMENT — revenue never touches the operator wallet first, so skimming is unrepresentable. HCS logs every split; a Graph subgraph indexes holder dividends and service revenue health.
**Why this chain (U6):** Hedera uniquely fuses the payment rail and the securities rail: Blocky402 receipts + ATS lifecycle + HTS custom fee schedules are one substrate; the receipt-to-distribution binding is native, not an oracle. This FINANCES the sponsor-admitted gap: real paid services do not exist because building one is uncompensated up front.
**3-min demo shape:** Mint 100 CALLFLOW-01 tokens for a live paid API (HashScan-verified), sell 30 to a second wallet for real USDC; hammer the API with paid requests; both wallets tick upward per-call, 70/30, HCS trail scrolling. Dividends at request granularity.
**TASTE:** U1,U2,U3,U6,C-DF1 | **Primitives:** F35xF16xF13 (asset class = agent-economy-native revenue; ATS fee schedules ARE the economics) | **Law-check:** L2 (skim removed from payment path), L3, L10 (every actor inside the loop), L12, L15
**Origin:** hybrid(G5xG4) | **Prize-combo:** Hedera ATS $6K + Hedera x402 $6K + Graph Composable $5K (addressable $17K pools; realistic ~$5.5K)

### #4: Headcount — one human, one allocation: sybil-proof token launches inside the auction itself
**Score:** 22/25 — Ship 3.5 | Demo 5 | Sponsor 4.5 | Novel 4.5 | Memorable 4.5
**Mechanism:** A Uniswap CCA (continuous clearing auction) v4 hook resolves each bidder's wallet to a World AgentBook anonymous humanId at bid time and enforces ONE shared cap per HUMAN across all their wallets and agents — sybil wallets refill the same bucket. Agents are first-class bidders optimizing via a live Graph auction-state subgraph.
**Why this chain (U6):** CCA is the only auction primitive with modular hooks in the bid path (prize text names per-user caps as intended extensions); World is the only stack resolving wallet→distinct-anonymous-human onchain. Elsewhere "per-user" means "per-wallet" — the whole disease.
**3-min demo shape:** Live token auction: one human bids from 3 wallets + 1 agent — all four drain ONE cap, fourth bid REVERTS with the nullifier collision on-chain; a 20-wallet sybil script nets exactly one human's share; auction clears uniform-price. Counter: "bids: 14, humans: 14."
**TASTE:** U1,U2,U3,U6,U7,C-DF1 | **Primitives:** F12xF02 (attenuated dimension = auction power per-human; enforcement inside clearing logic) | **Law-check:** L2 (sybil cheat unrepresentable in hook code), L3, L11, L12
**Origin:** hybrid(G3xG2xG4) | **Prize-combo:** World Selfie Check $3.5K + Uniswap Stack $3K + Graph Composable $5K (addressable $11.5K pools; realistic ~$3.7K) | RISK: World sandbox TestFlight + CCA repo maturity (fact-check)

### #5: Lifewire — services that exist only while money flows
**Score:** 22/25 — Ship 4 | Demo 5 | Sponsor 4 | Novel 4 | Memorable 5
**Mechanism:** A resource (video stream, GPU inference session, tunnel) stays alive strictly per-second via Arc Nanopayments — provider daemon holds it open only while the USDC heartbeat lands; stop paying and it dies within one finality window; resume and it revives. No subscriptions, no accounts: the meter IS the money.
**Why this chain (U6):** Arc's sub-second finality + USDC-as-native-gas + Nanopayments jointly load-bearing — per-second heartbeats are economically impossible where beats cost volatile gas or confirm in 12s. The kill-latency is the product spec.
**3-min demo shape:** Live stream plays beside a real-time USDC drip counter; presenter closes the paying wallet — stream freezes in under a second; reopens — revives. Two clients bid heartbeats for one scarce GPU slot; the higher drip visibly steals it. Money behaving like electricity.
**TASTE:** U1,U2,U3,U6,U7,C-DF1,C-IN1 | **Primitives:** clean-room origin | **Law-check:** L3 (heartbeat metering IS the product), L14 (max legibility x spectacle), L2, L12, L15 (pause your own payment, time the cut)
**Origin:** G5 | **Prize-combo:** Arc Agentic $1.67K + Arc Mainnet Launch $3.5K + Privy Financial Flow $2.5K (addressable ~$7.7K; realistic ~$5.5K incl. mainnet bonus few teams attempt)

### #6: Undertow — dark strategies on Aqua: secret pricing curves, real public fills
**Score:** 21.5/25 — Ship 2.5 | Demo 4.5 | Sponsor 5 | Novel 5 | Memorable 4.5
**Mechanism:** Market-makers submit private pricing curves into a Chainlink CRE handlerInTee workflow; the TEE compiles them into signed SwapVM strategy programs deployed against ONE shared self-custodied Aqua balance. Takers get quotes whose parameters were never public; cross-read attempts fail on camera; a second maker joins the SAME balance with zero rebalancing.
**Why this chain (U6):** SwapVM strategy programs + Aqua single-balance-many-strategies exist nowhere else; the TEE-signed-strategy pattern is compiled against SwapVM opcodes. Porting = rebuilding the VM target AND the confidential compiler.
**3-min demo shape:** Maker types a secret spread curve → encrypted into CRE → SwapVM strategy goes live on fork → real swap executes at the secret price. Attacker script reads calldata/state → nothing. Second maker joins the same balance live.
**TASTE:** U2,U3,U6,U7,C-DF1 | **Primitives:** F02xF25 (substrate shift PER→CRE TEE; hardest-guarantee: one balance, many blind strategies) | **Law-check:** L2, L3 (first confidential strategy compiler for a 6-week-old VM), L11, L12
**Origin:** G4 | **Prize-combo:** 1inch Aqua $5K + Chainlink CRE Confidential $2K + Privy B2B $2.5K (addressable $9.5K; realistic ~$6K — both lanes LOW crowding) | RISK: CRE Confidential private-beta access + SwapVM 2h+ ramp in 4.5 days (Ship 2.5)

### #7: Settle402 — the sponsor-admitted missing piece: async x402+MCP, shipped and documented
**Score:** 20/25 — Ship 4 | Demo 4 | Sponsor 5 | Novel 3.5 | Memorable 3.5
**Mechanism:** The pattern Hedera issues #903/#892/#1007 prove nobody has shipped: MCP middleware where a paid tool call parks as a payment-required continuation, the agent signs a Blocky402 ceiling gas-free, and the deferred result resolves on settlement — every hop on HCS. Ships WITH a flagship metered service (multi-subgraph position-risk sentry priced per index-row) and a Bazantic gateway.
**Why this chain (U6):** Blocky402's gas-free ceiling (payer never holds HBAR) is the unique property making async agent payments coherent at all; on classic rails payment must ride the HTTP retry — exactly why the pattern is unsolved.
**3-min demo shape:** Agent hits paywalled MCP tool → challenge → signs ceiling once → three metered calls settle async, HCS scrolling, per-row prices itemized; facilitator killed mid-call → continuation recovers and settles (the literal #903 failure mode, handled).
**TASTE:** U1,U2,U5,U6,C-IN1 | **Primitives:** F19xF13xF08 (the LITERAL #903 kit + metered rows + complete-job MCP) | **Law-check:** L2, L3 (sponsor-admitted vacuum), L11, L12
**Origin:** hybrid(4-way G1/G2/G3/G4) | **Prize-combo:** Hedera x402 $6K + Graph AI Scratch $5K + Bazantic Agentify $1K (addressable $12K; realistic ~$5K) | RISK: 4 of our own 5 generators converged here — rivals reading the same issues likely converge too (internal-modal, L1)

## Brief-Utilization Map
(see transcript synthesis section — 88% mapped; unmapped: Ledger [hardware unverified], Chainlink Liquidation challenge [side quest])

## Killed Ideas
| Idea | Origin | Gate | Cause |
|---|---|---|---|
| Meterwage | G4 | 1b | not_ecosystem_native (payroll TradFi frame) |
| Mandate | G3 | 1 | organizer_suggested + Backstop-adjacent |
| Streamsmith | G1 | 1 | organizer_suggested (Graph featured challenge, L6) |
| Cachet | G3 | 1 | C13 day-1 users hypothetical |
| Splitbrain | G1 | 1/L11 | harness maps weakly to handlerInTee-central bullet |
| Factstake | G5 | 3 | 18.5 floor-adjacent; seen shape; oracle-manipulation surface |
| Molt | G1 | 3 | 17.5 |
| Blackbox/Darkroom | G2/G3 | 3 | Ship 2.5 CRE-beta risk (pattern lives on in Undertow) |
| Meshwork Escrow | G4 [HISTORY] | 3 | 18; continuity EV $4.2K < scratch plays (kept as continuity benchmark) |
| TrueDelta / AquaSieve | G1 | 6 | outscored in Aqua cluster |
| Hydra (Manifold) | G2/G3 | 6 | 19.5 outscored by Undertow/Glasspool |
| Glasspool | G5 | 6 | 21 reserve #1 |
| Tollbooth | G2 | 6 | 21.5 reserve #2 |
| Subkey/Narrowcast | G5/G4 | 6 | 21.5 reserve #3 |
| WakeToll/Lockstep/Patience | G1/G3/G2 | synthesis | merged into Settle402 |
| Clawback402/Boomerang/Bondback/Surety | G1/G2/G5/G3 | synthesis | merged into Floatline |
| Solo | G2 | synthesis | merged into BotTax |
| Even Keel + Headcount(G2) | G4/G2 | synthesis | merged into Headcount |
| Callflow twin (Floatline-G4) | G4 | synthesis | merged into Callflow |
