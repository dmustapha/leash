# ETHOnline 2026 — Warroom V1 Deliberation Transcript
Started 2026-09-08T22:49:51Z

## Phase 0/0B/0C
TASTE blocks: C-AI1,C-DF1,C-IN1. Agents: SPEC/DEPTH/CRAFT/WILD [AUTO-approved]. Brief/gap-map/primitives-sheet written; lint pass. Forbidden-shapes list compiled from 23 built projects. Event class sponsor_track (declared).

## generation_parallel — G1 (Pain) return: 7 conforming ideas
WakeToll (F19xF13, Hedera x402+Harness+Bazantic) | TrueDelta (F25xF29, 1inch Aqua) | AquaSieve (F24xF29, Aqua+continuity) | Streamsmith (F24xF08, Graph AI+Composable) | Splitbrain (F24xF25, Chainlink CRE x3) | Molt (F08xF12, ENS) | Clawback402 (F16xF29, Hedera x402+Continuity)
(Full blocks stored in G1 task output; decision-relevant fields carried to synthesis.)

### G1 FULL RETURN
- name: **WakeToll**
- mechanism: The literal #903 pattern, shipped working: x402 middleware for MCP-on-Hedera where a tool call parks in a durable "payment-pending" state, an HCS topic subscription delivers the settlement confirmation as the async callback, and the LangGraph ReAct loop resumes exactly where it paused — no polling, no blocking the agent runtime. Ships as a forkable middleware package plus a live consumer: a real paid MCP tool (per-call metered via Blocky402 spending ceiling) that an agent pays and uses on camera. Every pause→pay→resume cycle writes an HCS audit record.
- why-this-chain: The pain exists BECAUSE of Hedera's architecture: Blocky402's gas-free ceiling model means payment confirmation is asynchronous relative to the agent loop, and HCS is the only native pub/sub that makes the resume-callback trustless. Port to Base and you'd rebuild the callback layer around synchronous EIP-3009 settlement — a different machine entirely.
- 3-min demo shape: Split screen: agent transcript left, HCS topic explorer right. Agent calls a paid tool → visibly parks ("awaiting settlement") → HBAR micropayment lands → HCS message appears → tool call resumes and returns → agent continues reasoning. Then the kill shot: same flow with payment withheld → tool never fires, agent gets a structured 402 refusal. Real HBAR moved, real audit trail, live.
- TASTE lines satisfied: U1, U2, U5, U6, C-DF1, C-IN1
- primitive(s) adapted: F19 x F13 — the rail-native tooling kit aimed at the LITERAL #903 gap, remixed with per-call metering where the budget-clamp locus is the Blocky402 ceiling and HCS is repurposed as the async payment-verification callback bus.
- law-check: L2 (withheld payment = tool denied, real economic consequence), L3 (the async-resume middleware IS the product), L11 (weight on the undocumented hard part, not the agent wrapper), L12 (no known "WakeToll" collision).
- prize-combo: Hedera x402 ($6K) + Hedera OSS Harness ($2K) + Bazantic agentify ($1K).

- name: **TrueDelta**
- mechanism: Solves the quoted Aqua#26 accounting divergence at protocol level: a SwapVM strategy program wrapper that measures actual ERC-20 balance deltas (balanceOf before/after) instead of trusting requested amounts, reconciles Aqua's internal ledger against real wallet balances every settlement, and fails closed — reverting BEFORE any transfer — the moment internal accounting and reality diverge. Includes a live divergence monitor contract emitting reconciliation attestations per strategy epoch.
- why-this-chain: The bug class only exists because of Aqua's core innovation — one self-custodied balance virtually backing many strategies via internal accounting. On a vanilla AMM there is no internal ledger to diverge. The fix must be written IN SwapVM program semantics; porting means there's nothing to port to.
- 3-min demo shape: Deploy a fee-on-transfer token. Run it through the naive path: internal balance says 100, wallet holds 97 — divergence counter glows red, insolvency accumulating live. Same trade through TrueDelta: delta-measured, ledger matches wallet to the wei, and a poisoned trade attempt reverts on-screen with the reconciliation proof. Real tokens, real revert, the hazard from the sponsor's own issue tracker neutralized.
- TASTE lines satisfied: U1, U2, U3, U6, U7, C-DF1
- primitive(s) adapted: F25 x F29 — hand-rolling Aqua's hardest guarantee ("one balance safely backs many strategies") remixed with live-state-bound attestation, where the attested fact is escrow solvency (explicitly allowed lane), bound to live balanceOf reads so it can never be about stale ledger state.
- law-check: L2 (divergence = real stranded funds; guard prevents real loss), L3 (delta-verified accounting IS the product), L11 (weight on SwapVM internals, not UI), L12 (no known collision; distinct from Aqua0).
- prize-combo: 1inch Aqua ($5K).

- name: **AquaSieve**
- mechanism: Attacks the OpenZeppelin-audit finding that 5,100+ ERC-20s can strand assets in SwapVM via `token.withdraw()`: a forked-mainnet fuzzing harness that probes any token's actual transfer behavior (tax, rebase, hooks, return-value quirks) against SwapVM opcode semantics, then publishes a machine-readable on-chain compatibility attestation that Aqua strategy programs consult as a pre-trade guard — unknown or hazardous tokens fail closed before deposit.
- why-this-chain: The stranding vector is a product of SwapVM's specific withdraw opcode semantics — the probe suite is literally fuzzing SwapVM behavior, not generic ERC-20 behavior. Elsewhere the failure mode doesn't exist, so neither does the product.
- 3-min demo shape: Feed it USDT, a tax token, and a rebasing token. Watch the fuzzer execute real forked-mainnet probes, classify each (SAFE / TAX / STRANDS), write attestations on-chain. Then a live Aqua strategy attempts to onboard the stranding token → guard reverts, funds never enter; onboards the safe one → trade executes. The wow: assets that would have been permanently stranded, provably saved, using the sponsor's own audit as the script.
- TASTE lines satisfied: U1, U2, U6, U7, C-DF1
- primitive(s) adapted: F24 x F29 — differential-testing systems insight ported into an expensive Web3 domain (SwapVM token onboarding), remixed with live-state-bound attestation where the consumer of the attestation is the strategy program itself.
- law-check: L2 (bad token = stranded real assets; sieve gates real deposits), L3 (the probe-attestation-guard pipeline is the product), L11 (weight on fuzzing engine, not dashboard), L12 (no known "AquaSieve" collision; token-behavior scanning ≠ forbidden agent-trust-scoring).
- prize-combo: 1inch Aqua ($5K) + 1inch continuity ($2K).

- name: **Streamsmith**
- mechanism: An AI Substreams author that owns the COMPLETE job — NL prompt → module scaffolding → build → registry auth (auto-creating `~/.config/substreams`, fixing PR#925's papercut class) → deploy → consuming subgraph — built on a content-addressed module build-graph so iteration is incremental: edit one module, only downstream modules rebuild, upstream cache reused. The AI loop exploits the cheap rebuilds to iterate against real block data until output validates.
- why-this-chain: Substreams' module DAG is the sponsor primitive that makes the port possible — modules are hashable, composable units, which is exactly what content-addressed incremental builds require. The pain ("authoring is hard", CLI papercuts, the sponsor's own one-prompt challenge) exists because of Substreams' architecture; on any other indexer there is no module graph to checkpoint.
- 3-min demo shape: One prompt: "index Aqua strategy settlements." Watch modules generate, build, deploy, and a live consumer app render real indexed data. Then the engineered number: change one field mapping → build graph lights up "2 rebuilt / 11 reused, 9s" vs cold build 4min. AI edits, re-tests, converges live. Judge sees the whole author→deploy→consume lifecycle plus the incremental-loop wow in under 3 minutes.
- TASTE lines satisfied: U1, U2, U5, U6, C-AI1, C-IN1
- primitive(s) adapted: F24 x F08 — takegraph's build-graph/checkpoint insight ported to Substreams authoring, remixed with the interface-species shift into an MCP/SKILL owning the complete author-to-consume job (a JOB interface, not a data interface — dodges the 2025 retread).
- law-check: L2 (wasted rebuild time = real compute cost; cache saves it measurably), L3 (incremental build-graph is the product; AI removed = product dies, C-AI1 holds), L11 (weight on the build system, not the chat UI), L12 (no known collision).
- prize-combo: The Graph AI-Scratch ($5K) + The Graph Composable ($5K).

- name: **Splitbrain**
- mechanism: Closes the quoted CRE trust gap ("passing simulation does not imply production safety... cannot detect non-determinism or multi-node consensus failures"): a differential harness that executes a CRE workflow N times under perturbed environments — jittered timestamps, shuffled map iteration, reordered API responses, injected node clock skew — and diffs the would-be consensus reports. Any divergence = a consensus failure that simulation would have silently passed. Emits a signed determinism report; a demo Confidential workflow (handlerInTee) then drives real public on-chain state only after passing.
- why-this-chain: Non-determinism is only fatal BECAUSE CRE reaches multi-node consensus on workflow output — the exact property no other runtime has and the exact blind spot the sponsor's own community analysis names. The harness's perturbation model is CRE's execution semantics; porting it elsewhere means there's no consensus to break.
- 3-min demo shape: Two workflows side by side, both passing vanilla simulation green. Splitbrain runs both: the trap workflow (uses `time.Now` in the report path) explodes into 5 divergent node outputs — red diff tree; the fixed one converges 50/50. Fixed workflow deploys, its TEE handler settles a real on-chain payment. The wow: "your green checkmark was lying, and here is the proof."
- TASTE lines satisfied: U1, U2, U3, U6, C-DF1
- primitive(s) adapted: F24 x F25 — differential/record-replay systems insight ported into CRE's expensive pipeline, remixed with sponsor's-hardest-guarantee (multi-node deterministic consensus) hand-rolled as the headline and failing closed before deploy.
- law-check: L2 (undetected non-determinism = production fund loss; gate has economic consequence), L3 (the harness IS the product), L11 (weight on consensus mechanics, not workflow app), L12 (no known "Splitbrain" collision in this niche).
- prize-combo: Chainlink CRE Confidential ($2K) + Chainlink Continuity ($0.5K) + Chainlink Liquidation challenge ($0.5K).

- name: **Molt**
- mechanism: Attacks the quoted ENSv2 whiplash (Namechain dead, community docs stale): an AI migration agent that ingests any ENS-integrated codebase or tutorial, detects Namechain-era assumptions (L2 registry calls, dead endpoints, pre-EAC patterns), rewrites to canonical ENSv2 — hierarchical registries, Enhanced Access Control, Permissioned Resolvers — and PROVES each rewrite by executing it live against ENSv2 Sepolia: real registrations, real record writes, real permission grants, before/after test transcripts attached to every diff.
- why-this-chain: The pain is ENS-constitutional: a 2-year architectural reversal orphaned an entire doc corpus. The rewrite rules are ENSv2's new primitives themselves (EAC scoping, registry hierarchy) — there is no other namespace system with this migration cliff, so the product cannot exist elsewhere.
- 3-min demo shape: Paste a real stale tutorial repo. Molt flags 7 dead assumptions with citations to the Namechain cancellation, rewrites them, then the proof reel: each migrated snippet executes live on Sepolia — name registered, EAC-scoped subname granted to an agent with narrowed capabilities, resolver permission demonstrated by a denied over-write. Broken code in, working on-chain transactions out.
- TASTE lines satisfied: U1, U2, U5, U6, U7, C-AI1
- primitive(s) adapted: F08 x F12 — interface-species shift (an agent/CLI owning the complete detect→rewrite→prove migration job) remixed with attenuated delegation as the flagship migration target: the demo's centerpiece rewrite produces a parent-scoped, capability-narrowed agent subname (aimed straight into W7).
- law-check: L2 (stale code = broken prod resolution; live-executed fixes are the consequence), L3 (execute-to-prove migration is the product; AI removed = fail, C-AI1 holds), L11 (weight on EAC mechanics), L12 (no known "Molt" collision).
- prize-combo: ENS ENSv2 ($4.5K) + ENS pool ($0.5K).

- name: **Clawback402**
- mechanism: Solves the pain directly implied by #903's async loop ("tool calls only proceed after confirmed micropayment" — so what happens when you PAID and the async tool never delivers?): every x402 payment lands in escrow with a pre-signed Hedera Scheduled Transaction refund set to execute at T+SLA. The service cancels the scheduled refund only by posting a delivery proof to HCS — an output-hash bound to the original request id — before the deadline. Deliver = refund cancelled, funds release. Ghost = refund fires automatically, no keeper, no dispute, no trust.
- why-this-chain: Scheduled Transactions ARE the product: the refund is enforced by the network itself, unsigned-yet-armed, with no relayer or court. On any other chain this requires a keeper bot or arbiter — rebuilding the trust model from scratch. HCS gives the delivery proof a consensus timestamp the deadline check binds to.
- 3-min demo shape: Agent pays two services real HBAR. Service A delivers → HCS delivery proof lands → scheduled refund visibly cancelled on-chain → provider paid. Service B goes dark → countdown hits T+SLA → the Scheduled Transaction fires ON ITS OWN, refund lands back in the agent's wallet, network explorer showing nobody triggered it. The wow: money that un-pays itself.
- TASTE lines satisfied: U1, U2, U3, U6, U7, C-DF1
- primitive(s) adapted: F16 x F29 — missing institution (bonded refunds / working capital for the agent economy, M4) remixed with live-state-bound attestation in the explicitly-allowed variant: delivery proof gating settlement, where the honesty-forcing mechanism is a network-armed clawback instead of any score or court.
- law-check: L2 (non-delivery = automatic real refund; delivery = real payout), L3 (scheduled-refund escrow IS the product), L11 (weight on the settlement machine, not the storefront), L12 (no collision; distinct from forbidden dispute-court/guardian shapes — no adjudication, pure mechanism).
- prize-combo: Hedera x402 ($6K) + Hedera Continuity ($1K).

### G3 FULL RETURN
- name: **Surety**
- mechanism: Inverts ChainSight — instead of a free analyst that reads, a paid data-answer service that eats its own losses. Every x402-paid query response (routed through The Graph MCP/subgraphs) ships with a stake-bonded SLA: the response commits to a block-height-bound answer hash, and anyone who proves the answer was stale/wrong against live chain state triggers an automatic refund + slash from the operator's bonded escrow — no admin path, no dispute court, pure code.
- why-this-chain: Hedera Blocky402's gas-free ceiling means the *challenger* never needs gas to claim a refund, and HCS gives an immutable answer-commitment log — the slash-on-proof loop cannot be rebuilt on rails where challengers must fund gas to get paid back. Graph subgraph block-stamps are what make "stale" machine-checkable.
- 3-min demo shape: Agent pays 3 cents for a live subgraph answer → answer + commitment lands on HCS → operator deliberately serves a stale answer → challenger script proves it against current chain state → refund + slash executes on-screen, real USDC moves back. Climax = the service punishing itself.
- TASTE lines satisfied: U1, U2 (refund fires visibly), U3, U6, U7, C-DF1
- primitive(s) adapted: F29 (live-state-bound attestation) remixed with F13 — the attested fact is delivery-quality of a *paid* response, and the binding gates settlement, not reputation; explicitly the F29-caution-approved variant (SLA-bound refunds, not agent scoring).
- law-check: L2 PASS (operator bonds own capital; cheat = serving stale data is auto-slashed, refusal is the demo climax). L3 PASS (bonded-answer refund IS the product and the one-liner). L11 PASS (strongest axis = working x402 service w/ audit trail, maps to Hedera's highest-weighted bullet). L12 PASS (rivals converge on "TruthOracle/VerifiedAI" names, not refund-bond framing).
- gap-targeted: inverts ChainSight + M2 (payment-native accountability, not score-based) + W1
- prize-combo: Hedera x402 ($6K), The Graph Composable ($5K)

- name: **Lockstep**
- mechanism: The async x402+MCP payment pattern that Hedera's own issues #903/#892/#1007 admit doesn't exist — shipped working. MCP tool call returns 402 → client signs a Blocky402 spending ceiling → facilitator sponsors settlement → an async callback resumes the suspended MCP call with the paid result, every leg notarized to HCS. Packaged as fork-and-run middleware + a live consumer service actually charging through it.
- why-this-chain: The pattern only closes on Hedera because the payer never holds gas (Blocky402 ceiling model) — on any other rail the async resume requires the client to fund a second transaction, which reintroduces the exact deadlock the issues describe. HCS is the audit substrate the prize text names.
- 3-min demo shape: Split screen: left, an agent's MCP session hits a paid tool, suspends, resumes with results; right, HashScan showing ceiling-sign → settlement → HCS receipt in real time. Then `git clone && npm run` the middleware against a second service in 60s — the kit generalizes on camera.
- TASTE lines satisfied: U1, U2, U5, U6, C-IN1 (live consumer included), C-DF1
- primitive(s) adapted: F19 (rail-native tooling kit) — the "which missing piece" axis pinned to the LITERAL documented gap; remixed with HCS audit legs so the kit ships an evidence trail, not just plumbing.
- law-check: L2 PASS (ceiling is a signed self-bound spend cap; overspend is unrepresentable — facilitator clamps in code, over-ceiling call rejected on-screen). L3 PASS (the async handshake IS the product; pitch = "the #903 gap, closed"). L11 PASS (sponsor engineers judge vs bullets that literally cite this gap). L12 CAUTION→PASS (generic rivals name themselves "x402-mcp"; Lockstep + shipping-the-known-issue framing separates).
- gap-targeted: W2 + P1
- prize-combo: Hedera x402 ($6K), Hedera OSS Harness ($2K), Bazantic gateway ($1K)

- name: **Manifold**
- mechanism: 1inch Aqua's hardest promise — one self-custodied LP balance safely backing many concurrent strategies — hand-rolled and adversarially proven. Multiple SwapVM strategy programs (grid, TWAP, momentum) share a single Aqua balance; a solvency invariant in the strategy layer makes over-commitment of shared liquidity structurally impossible, failing closed BEFORE any transfer.
- why-this-chain: Aqua's shared-balance model is the primitive — nowhere else does one balance back N strategies, so the safety invariant has no meaning off-Aqua. SwapVM programs are compiled against Aqua's settlement, not portable SDK calls.
- 3-min demo shape: One balance on screen, three strategies trading it live with real fills; then an adversarial fourth strategy tries to commit liquidity already promised — reverts on stage with the invariant named in the error. Capital-efficiency counter ticks up: "1 balance, 3 strategies, 0 idle split."
- TASTE lines satisfied: U1, U2 (revert is visible), U3, U6, U7, C-DF1
- primitive(s) adapted: F25 (hardest-guarantee-as-pitch) remixed with W9's agents-as-strategists framing — the guarantee is implemented at strategy-program level, not decorated at SDK level.
- law-check: L2 PASS (LP's own capital at risk; over-commit cheat made unrepresentable; revert = climax). L3 PASS (the shared-balance invariant is name, spine, and pitch). L11 PASS (strongest axis = protocol-level Aqua depth; 1inch judges its own bullets; best $-per-competitor lane per slice §17). L12 PASS (rivals name Aqua bots "AquaAgent/YieldX", not the invariant).
- gap-targeted: W3 + W9
- prize-combo: 1inch Aqua ($5K)

- name: **Darkroom**
- mechanism: Ports the proven Tenor shape (blind multi-party matching in private execution) to Chainlink CRE Confidential — the never-done P2 port. OTC block trades: both sides submit hidden quotes into handlerInTee, the TEE computes the cross, emits one binding commitment, and settlement executes atomically in public USDC on Arc. Privacy is adversarially self-proving: a live cross-read attempt from a third party is denied on camera.
- why-this-chain: handlerInTee is the only sponsor primitive here where private logic can drive public onchain state without a ZK circuit build — the TEE boundary IS the product; Arc's sub-second USDC finality makes the atomic public leg legible in demo time.
- 3-min demo shape: Two terminals submit sealed quotes; third terminal tries to read them and gets a structured denial; TEE emits the match commitment; one atomic USDC settlement lands on Arc with both legs in a single visible transaction. Real value crosses; nobody saw the quotes.
- TASTE lines satisfied: U1, U2, U3 (first-mover lane), U6, C-DF1
- primitive(s) adapted: F02 with the forced axis-shift executed exactly as specified — substrate PER(Solana)→CRE TEE, venue shifted to USDC OTC blocks on Arc; the cross-read denial is the adversarial self-proof surface.
- law-check: L2 PASS (quoters commit real funds behind sealed quotes; peeking is made impossible by the TEE boundary, denial demoed). L3 PASS (blind-match-atomic-settle is the whole product). L11 PASS (CRE Confidential bullets reward exactly private-logic→public-state; zero complaint corpus = judges hungry). L12 PASS (no rival naturally lands on OTC-darkpool naming in a payments-modal field).
- gap-targeted: P2 + W4
- prize-combo: Chainlink CRE Confidential ($2K), Arc DeFi ($1.67K)

- name: **Headcount**
- mechanism: One-human-one-bid token launches. World Selfie Check humanId is the load-bearing gate on a Uniswap CCA (continuous clearing auction) hook: each verified human gets exactly one bid slot enforced by nullifier, sybil wallets are structurally excluded at the hook level, and clearing proceeds continuously in public. Fair distribution becomes a provable property, not a promise.
- why-this-chain: The wallet→anonymous-humanId endpoint (World) composed with a CCA hook (Uniswap v4) exists nowhere else — the sybil-exclusion happens inside the auction's own clearing logic, so porting means rebuilding both the proof-of-human rail and the auction venue.
- 3-min demo shape: Verified human bids from wallet A — accepted. Same human tries wallet B — hook rejects the bid on-chain with the nullifier collision visible. Auction clears continuously, real tokens distribute to distinct humans, a live counter shows "bids: 14, humans: 14."
- TASTE lines satisfied: U1, U2 (rejection is the wow), U3, U6, U7, C-DF1
- primitive(s) adapted: F12 (attenuated capability) remixed — what's attenuated is *bid capacity per human*, enforced by nullifier inside a v4 hook rather than a wallet policy layer; F02's allowlist-draw axis supplies the venue.
- law-check: L2 PASS (bidders commit real funds; the sybil cheat is unrepresentable — nullifier check in hook code, rejection demoed). L3 PASS (one-human-one-bid IS the product). L11 PASS (World's Selfie Check bullet demands load-bearing quality — thin on quality per gap-map, strongest axis maps to it; Uniswap FEEDBACK.md deliverable noted). L12 CAUTION→PASS (rivals pick "FairLaunch/HumanDrop"; the CCA-hook enforcement locus is the separator).
- gap-targeted: M3 + W10 + W8
- prize-combo: World Selfie Check ($3.5K), Uniswap ($3K)

- name: **Floatline**
- mechanism: The working-capital institution the agent economy is missing: refundable float. A buyer agent pre-funds a Blocky402 spending ceiling as float; the provider draws down per metered unit delivered; a Hedera Scheduled Transaction is armed at session-open that auto-returns every unconsumed cent at expiry — the refund executes even if both parties vanish. Neither side can rug: provider can't over-draw the ceiling, buyer can't claw back consumed units.
- why-this-chain: Only Hedera has both halves — the gas-free ceiling (float without the payer holding gas) and Scheduled Transactions (a refund that fires with no live counterparty). The dead-man's-switch refund is impossible on rails where someone must submit the refund tx.
- 3-min demo shape: Agent opens a $1 float, streams 37 metered calls (counter + HCS receipts ticking), then the buyer process is killed on camera — at expiry the Scheduled Tx fires by itself and 63 cents lands back in the dead buyer's account. Money returning to a switched-off agent is the wow.
- TASTE lines satisfied: U1, U2, U3, U6, U7, C-DF1
- primitive(s) adapted: F16 (missing institution: credit-into-float/refund clearing) remixed with F13's budget-clamp axis — the clamp locus moves into the Blocky402 ceiling and the honesty-forcer is a Scheduled-Tx refund, not stake or reputation.
- law-check: L2 PASS (both parties' capital self-bound in code; over-draw and claw-back are unrepresentable; the unattended refund is the climax). L3 PASS (refundable float is name and spine). L11 PASS (maps to Hedera x402 "actual services/metering" bullets, the top-weighted ask). L12 PASS (rivals in this lane name payment apps "PayStream/AgentPay", not float clearing).
- gap-targeted: M4 + W1
- prize-combo: Hedera x402 ($6K), Arc Agentic ($1.67K)

- name: **Cachet**
- mechanism: Pay-only-for-what-changed: content-addressed memoization for expensive paid pipelines, the P3 takegraph port. Every step of a multi-stage pipeline (Substreams transform → subgraph query → inference step) is hashed by inputs; x402 payment receipts are bound to content hashes on HCS, so when an agent re-runs a pipeline after editing one parameter, unchanged steps replay their *already-paid* receipts free and only dirty nodes are re-purchased.
- why-this-chain: The receipt-to-content-hash binding needs an immutable, cheap, timestamped log — HCS — and a metering rail where per-step micro-charges are economical — Blocky402 gas-free x402. Graph Substreams give the real expensive pipeline; without these three the memoization has nothing to bind to.
- 3-min demo shape: Run a 14-step paid pipeline: $0.61 total, receipts scroll on HCS. Edit one parameter, re-run: graph view lights 4 nodes dirty / 10 reused, bill reads $0.17. The engineered-backward number ("edit one line → pay for 4, reuse 10") is the whole pitch on screen.
- TASTE lines satisfied: U1, U2 (one legible number), U3, U5, U6, C-DF1
- primitive(s) adapted: F24 executed per its forced axis-shift (gen-media → Web3 expensive pipelines) fused with F13's metered-unit axis — the metered unit becomes the *pipeline node*, and the sponsor primitive (HCS receipt binding) is what makes the port possible.
- law-check: L2 PASS (provider can't double-charge a hash — replay check is code, demoed by attempting a re-bill that's refused). L3 PASS (paid-computation memoization is the one-liner). L11 PASS (strongest axis = novel metering service, maps to both Graph AI-Scratch and Hedera x402 top bullets). L12 PASS (no rival names a payments entry after caching).
- gap-targeted: P3 + W1
- prize-combo: The Graph AI-Scratch ($5K), Hedera x402 ($6K)

- name: **Mandate**
- mechanism: B2B org treasuries where agents propose and humans dispose — via grant-time attenuation, not execution-time review. An org issues a Privy policy-scoped capability to an agent (spend cap, allowed counterparties, purpose tag); every re-delegation can only narrow it; agent-proposed payments become async intents that an m-of-n human quorum approves, settling in USDC. Over-scope proposals never reach humans — the policy engine makes them unrepresentable at submission.
- why-this-chain: Privy's org wallets with native policies, m-of-n quorums, and async intents are the only sponsor primitive where "agent proposes, humans approve" is a first-class wallet-layer object rather than app middleware — the attenuation is enforced by the custody layer itself.
- 3-min demo shape: Agent drafts three vendor payments inside its granted scope → two humans approve on their phones → USDC settles. Then the agent attempts a payment to an off-list counterparty — structurally rejected before any human sees it, with the narrowed capability shown. Real org money, real quorum, real refusal.
- TASTE lines satisfied: U1, U2, U5, U6, C-DF1; distinct from Backstop per F12's explicit caution (attenuation-at-grant ≠ co-sign-at-execution)
- primitive(s) adapted: F12 with substrate = Privy policies/quorums/intents and the attenuated dimension = spend+counterparty+purpose; the adversarial demo surface (over-grant → structured refusal) kept as the climax.
- law-check: L2 PASS (org's own funds behind every grant; the cheat — exceeding scope — is unrepresentable in the policy type, refusal demoed). L3 PASS (narrowing-only capability grants IS the product). L11 PASS (Privy B2B bullet is literally this shape — W6 verbatim; strongest axis on highest bullet). L12 CAUTION→PASS (rivals name treasury tools "TreasuryAI/AgentPay"; Mandate's grant-narrowing framing is off-modal).
- gap-targeted: W6
- prize-combo: Privy B2B ($2.5K), Privy Financial Flow ($2.5K), Arc Agentic ($1.67K)

### G5 FULL RETURN
- name: **BotTax**
- mechanism: A drop-in x402 pricing layer where every endpoint has two prices: a cheap human rate and an expensive bot rate. World's proof-of-human check is evaluated inside the 402 challenge itself — present a valid humanId, the payment quote drops 100x; present nothing, you pay the machine price. Services stop blocking bots and start billing them.
- why-this-chain: World AgentKit's "one endpoint = proof-of-human + x402" is the entire product — the price discrimination happens at the payment-challenge layer, which only exists because World fused humanity proof with the 402 flow. Remove AgentKit and there is no way to bind "who is paying" to "what they pay" without accounts. Hedera's Blocky402 gas-free settlement makes the human's $0.005 request economically real.
- 3-min demo shape: Split screen. Left: a human does Selfie Check, hits a live paid API, receipt shows $0.005. Right: a headless agent hits the same URL, receipt shows $0.50 — 100x, both settling real USDC on-chain in seconds. Then the agent tries replaying the human's proof and the quote refuses to discount. The wow: same endpoint, two economies, priced by species.
- TASTE lines satisfied: U1, U2 (two receipts, no explanation needed), U3, U6, C-DF1 (real value both sides).
- primitive(s) adapted: none — clean-room origin
- law-check: L3 (dual-price challenge IS the product), L9 (WHO-shift: block bots → bill bots), L2 (replayed proof structurally rejected), L11 (strongest axis = sponsor qualification bullets, the highest-weighted lane), L12 (no plausible rival picks this name), L15 (stranger verifies by curling the endpoint twice).
- prize-combo: World Selfie Check ($3.5K), Hedera x402 ($6K), Bazantic gateway ($1K)

- name: **Bondback**
- mechanism: An x402 wrapper where a paid service must escrow a slashable USDC bond before it can charge anyone. Every response carries a machine-checkable SLA (schema validity, latency, signature); if the check fails, the caller's refund is paid automatically from the bond via a Hedera Scheduled Transaction that was co-signed at request time — the service cannot block it. Bad service = bleeding bond, visible on-chain.
- why-this-chain: Hedera Scheduled Transactions are the load-bearing trick — the refund tx is created and scheduled BEFORE the service responds, and only cancelled by proof-of-good-response. No other stack lets you pre-arm a refund the counterparty can't veto. HCS logs the SLA verdict trail. This directly attacks the sponsor-admitted frustration: "x402 on Hedera is short of actual services you can pay for" — because nobody trusts unknown services; Bondback makes trust a bond, not a claim.
- 3-min demo shape: Pay a live Bondback-wrapped API, get data, scheduled refund auto-cancels — normal. Then kill the backend mid-demo, pay again: response fails SLA, the pre-armed scheduled tx fires, USDC lands back in the caller's wallet with zero action, and the service's bond balance visibly drops on a public ledger view. Climax is the refund firing while the "service owner" does nothing.
- TASTE lines satisfied: U1, U2, U3, U6, U7 (failure state earned live), C-DF1, C-IN1 (live consumer included).
- primitive(s) adapted: none — clean-room origin
- law-check: L2 (service eats its own bond; veto-path removed in code), L3 (pre-armed refund is the whole pitch), L14 (refusal-to-cheat is the visible climax), L11, L12, L15 (cheat namable: service withholding refund — made unrepresentable).
- prize-combo: Hedera x402 ($6K), Hedera OSS Harness ($2K), The Graph Composable ($5K — subgraph indexes bond health across services)

- name: **Glasspool**
- mechanism: Copy-LPing on 1inch Aqua where followers back a strategist's SwapVM program with their OWN self-custodied Aqua balance. The strategist publishes strategy bytecode and earns a performance fee streamed per epoch — but structurally cannot touch, move, or withdraw follower funds, because Aqua's custody model never grants them. Rug-pull is not policed; it is unrepresentable.
- why-this-chain: Aqua's core primitive — one self-custodied balance backing many strategies — is the trust mechanism itself. On any vault-based chain, copy-trading means depositing into the strategist's contract (custody = rug surface). Here the "vault" never exists; porting Glasspool elsewhere means rebuilding Aqua.
- 3-min demo shape: Follower deposits real USDC into their own Aqua balance, one click subscribes to a live strategist program, swaps start executing against it. Then the strategist — on camera — attempts every withdrawal path against follower funds: each reverts. Follower unsubscribes and their full balance is instantly free. The wow: the rug attempt failing live.
- TASTE lines satisfied: U1, U2, U3, U6 (unportable by construction), C-DF1.
- primitive(s) adapted: none — clean-room origin
- law-check: L2 (cheat structurally impossible; revert is the climax), L3 (no-custody copy-LP is the one-liner), L5 (Aqua = newest sponsor primitive, in-window), L11, L12, L15 (stranger verifies by reading the revert on-chain in 60s).
- prize-combo: 1inch Aqua ($5K), Uniswap Foundation ($3K — strategy programs route against v4 pools, FEEDBACK.md shipped), The Graph Composable ($5K — strategist P&L subgraph)

- name: **Subkey**
- mechanism: ENS sub-names as revocable API credentials for agents. An org issues `scraper.acme.eth` whose Permissioned Resolver holds the agent's spending policy (rate ceiling, allowed origins); every x402 gateway in the network resolves the name before honoring payment. Burn the sub-name via ENSv2 Enhanced Access Control and the agent's paid access dies everywhere simultaneously — one revocation, network-wide kill.
- why-this-chain: ENSv2 hierarchical registries + Permissioned Resolvers + Agent Text Records are load-bearing: the credential IS a name whose resolution the issuer controls. Without ENSv2's access-control layer, revocation requires notifying every gateway (the API-key problem this replaces). The product cannot be described without the resolver.
- 3-min demo shape: Agent with `bot.demo.eth` pays three different live x402 services successfully. Operator burns the sub-name in one tx. All three services immediately return 402-denied on the agent's next attempts — no service was contacted, no key rotated. The wow: three doors slamming from one on-chain write.
- TASTE lines satisfied: U1, U2 (kill is instantly legible), U6, C-DF1, C-IN1 (three live consumers).
- primitive(s) adapted: none — clean-room origin
- law-check: L3 (revoke-a-name-kill-everywhere is the entire product), L9 (WHAT-shift: identity record → live credential), L4 (FLOOR lane: ENSv2 dies-at-runtime-if-removed), L11, L12, L15 (proof: stranger burns a test sub-name and watches access die in 60s). Distinct from banned identity-infra shape: no registry/chat/reputation — a credential mechanism only.
- prize-combo: ENS ENSv2 ($4.5K), Hedera x402 ($6K), Bazantic gateway ($1K)

- name: **Factstake**
- mechanism: Prompt-to-prediction-market on any indexed on-chain fact. You type "will this Uniswap pool's TVL cross $10M by Friday" — The Graph's MCP resolves it to a concrete subgraph query, a market deploys with real USDC stakes, and at expiry a Chainlink CRE TEE handler executes that exact frozen query and settles on-chain. The subgraph is the oracle; no human resolution, no dispute layer.
- why-this-chain: The Graph's 15k NL-queryable subgraphs are what makes "any fact" possible — market creation IS query synthesis. CRE's handlerInTee is what makes settlement trustless — the query hash is committed at market creation, so the TEE can only run the agreed query. Remove either and you have a manual-resolution prediction market (a solved, boring thing).
- 3-min demo shape: Type one sentence, market appears with the committed GraphQL query visible. Two wallets stake opposing USDC positions. Fast-forward to an already-expiring seeded market: TEE run executes on camera, settlement tx pays the winner real USDC. The wow: a bet born from a sentence and settled by an index, zero humans in the loop.
- TASTE lines satisfied: U1, U2, U6, C-AI1 (NL→query synthesis IS the product; remove AI, no markets exist), C-DF1.
- primitive(s) adapted: none — clean-room origin
- law-check: L3 (subgraph-as-oracle is the one-liner), L9 (HOW-shift: dashboards read indexes → money settles on indexes; dodges the disqualified one-query-dashboard shape by being an actor, L10), L11, L12, L15 (frozen query hash = the namable cheat, closed; anyone re-runs the query to verify settlement).
- prize-combo: The Graph AI-Scratch ($5K), Chainlink CRE Confidential ($2K), Arc DeFi ($1.67K — USDC-native stakes, sub-second settle)

- name: **Lifewire**
- mechanism: Services that exist only while money flows. A resource (video stream, GPU inference session, tunnel, seat) stays alive strictly per-second via Arc Nanopayments — the provider's daemon holds the resource open only while the payment heartbeat lands. Stop paying and the resource dies within one finality window; resume and it revives. No subscriptions, no invoices, no accounts: the meter is the money.
- why-this-chain: Arc's sub-second finality + USDC-as-native-gas + Nanopayments are jointly load-bearing — a per-second heartbeat is economically impossible where each beat costs gas in a volatile token or confirms in 12s. The kill-latency IS the product spec, and only Arc's finality makes "dies within a second of nonpayment" a truthful claim.
- 3-min demo shape: A live video/inference stream plays with a real-time USDC drip counter beside it. Presenter closes the paying wallet — stream freezes in under a second, on camera. Reopens it — stream resumes. Then two clients bid heartbeats for one scarce GPU slot and the higher drip visibly steals the resource. The wow: watching money behave like electricity.
- TASTE lines satisfied: U1, U2 (needs zero explanation), U3, U6, U7 (the death state is earned live), C-DF1, C-IN1.
- primitive(s) adapted: none — clean-room origin
- law-check: L3 (heartbeat-metering is the whole product), L14 (maximum legibility x spectacle — the cut is the demo), L2 (provider serving without heartbeat = serving free; nonpayment cheat closed by construction), L11, L12, L15 (stranger verifies by pausing their own payment and timing the cut).
- prize-combo: Arc Agentic ($1.67K) + Arc Mainnet-launch ($3.5K+$1.5K), Privy Financial Flow ($2.5K — session wallets holding the drip)

- name: **Callflow**
- mechanism: An x402 service tokenizes its future request revenue via Hedera ATS: it mints revenue-share tokens, and the payment facilitator splits EVERY incoming micropayment pro-rata to token holders at settlement — the split is in the payment path, not a promise. Builders bootstrap paid services with upfront capital; holders earn per-call dividends they can watch tick.
- why-this-chain: Hedera ATS provides the compliant tokenization rail and Blocky402's facilitator-mediated settlement is what makes the split enforceable — the revenue never touches the operator's wallet before division, so "operator skims" is unrepresentable. HCS gives holders an audit trail of every split. This is the financing layer for the sponsor's own admitted gap: few real paid services exist because building one is uncompensated up front.
- 3-min demo shape: Mint 100 Callflow tokens for a live paid API, sell 30 to a second wallet for real USDC. Then hammer the API with paid requests and watch both wallets' balances tick upward per-call in real time, split 70/30, with the HCS trail scrolling. The wow: dividends arriving at request granularity.
- TASTE lines satisfied: U1, U2, U3, U6, C-DF1, [C] ecosystem-native (funds the missing x402 service economy).
- primitive(s) adapted: none — clean-room origin
- law-check: L2 (operator skim removed from the payment path in code), L3 (per-call dividend is the one-liner), L10 (every actor transacts inside the loop — no observers), L11, L12, L15 (cheat = operator diverting revenue; closed because settlement splits pre-custody; stranger verifies by paying once and watching two balances move).
- prize-combo: Hedera ATS ($6K), Hedera x402 ($6K), The Graph Composable ($5K — holder-dividend subgraph)

### G2 FULL RETURN
- name: **Boomerang** — escrow that refunds itself
- mechanism: Buyer pays for agent work into an escrow that is pre-armed with a Hedera Scheduled Transaction refunding the buyer at deadline. The service can only cancel the refund by posting a delivery proof to an HCS topic before expiry; delivery proof releases payment + slashes nothing, silence means the refund executes with zero cooperation from anyone. Buyer's agent pays via Blocky402 spending ceiling, so it never holds HBAR.
- why-this-chain: Scheduled Transactions are consensus-native on Hedera — the refund executes at expiry without a keeper, relayer, or the counterparty being online. On any EVM chain this needs a trusted cron/keeper, which is exactly the trust the escrow exists to remove. HCS gives the delivery-proof a timestamped, ordered, contract-free audit trail; Blocky402 makes the paying agent gas-free. Porting = rebuilding all three.
- 3-min demo shape: Agent A pays real USDC-on-Hedera for a summarization job (Blocky402 ceiling shown, no gas). Split screen: happy path — service posts HCS delivery proof, payment releases, HCS topic scrolls the receipt. Sad path — second job, service goes dark, countdown hits zero, the pre-armed Scheduled Tx fires ON ITS OWN and the refund lands back in A's wallet with no button pressed. The wow is the refund executing while every party's terminal is visibly idle.
- TASTE lines satisfied: U1 (real USDC, real scheduled tx), U2 (two flows, both visible), U3 (self-executing refund is the not-seen-before beat), U6 (Scheduled Tx + HCS + Blocky402 all load-bearing), U7 (sad-path state earned live), C-DF1.
- primitive(s) adapted: F16 (missing institution: bonded-refund escrow for paid agent work — M4's literal ask) × F29 (delivery-proof gates settlement; attested fact is delivery, NOT agent reputation — stays clear of AlphaAttest/Verdikt bans). Remix: honesty forced by deadline mechanics instead of arbitration or scoring.
- law-check: L2 pass — both outcomes visible in <3 min, no explanation needed. L3 pass — a refund that fires with everyone offline is a new beat. L11 pass — no fabricated state; the sad path is produced live by genuinely not delivering. L12 pass — remove Scheduled Tx and the product collapses into a keeper-trusting escrow (one-sentence test fails without it).
- prize-combo: Hedera x402 ($6K), Hedera OSS Harness ($2K, ship the escrow test harness), Bazantic agentify ($1K, gateway the demo service).

- name: **Tollbooth** — attribution royalties enforced at the token layer
- mechanism: Data/content chunks are minted as HTS tokens whose custom fee schedule hard-codes a royalty split to upstream creators; an x402 gateway meters agent reads per-chunk and settles by transferring the access token, so every payment atomically fans out to contributors at the Hedera token layer — no royalty contract, nothing to rug or bypass. Blocky402 ceiling clamps the reading agent's total spend.
- why-this-chain: HTS custom fee schedules execute the split inside the token transfer itself, at protocol level — on EVM this is a royalty contract that any integrator can route around (the entire NFT-royalty collapse). Here bypassing attribution means the transfer doesn't happen. Only Hedera puts the economics in the asset.
- 3-min demo shape: Three creators publish chunks. An agent researches a question, pays per chunk through the gateway (ceiling visible, gas-free), and the screen shows each single payment splitting live into 3 creator wallets at consensus — balances tick up in real time. Then the bypass attempt: a raw transfer of the access token STILL pays the creators, because the fee schedule fires anyway. Close on the HCS trail of every metered read.
- TASTE lines satisfied: U1, U2, U3 (unbypassable royalty is the wow), U6 (fee-schedule-as-product), C-DF1, C-AI1 (the reader is a real researching agent whose citations drive which chunks get paid).
- primitive(s) adapted: F13 (citation-toll metering) with attribution mechanism moved from gateway logic (Keryx's locus) to the HTS fee schedule — the axis-shift is WHERE attribution is enforced: asset layer, not app layer. Aims dead into W1 + P1.
- law-check: L2 pass — payment fan-out is watchable in wallet balances. L3 pass — "royalties you cannot route around" is a claim judges can try to break on camera. L11 pass — bypass-attempt state is adversarially earned. L12 pass — without HTS fee schedules this is Keryx on a different chain (fails the one-sentence test); with them it's a different product.
- prize-combo: Hedera x402 ($6K), Hedera ATS tokenization ($6K — fee-scheduled tokens are the ATS lane's native material), The Graph AI-Scratch ($5K — agent grounds its research via subgraph MCP before buying chunks).

- name: **Patience** — the async x402+MCP payment pattern, shipped working
- mechanism: Solves Hedera's documented open gap (#903/#892/#1007): an MCP middleware where a paid tool call returns a payment-required intermediate, the agent signs a Blocky402 ceiling authorization asynchronously, and the tool resumes exactly where it paused — long-running paid jobs (index a wallet, render a proof) that outlive a single request/response. Ships as fork-and-run middleware PLUS a live consumer: a real paid deep-research tool using it.
- why-this-chain: The async pattern is only coherent where the payer signs a spending ceiling off-chain and a facilitator sponsors settlement — Blocky402's model. On classic x402 rails the payment must ride the HTTP retry, which is precisely why the pattern is unsolved. This builds the missing documented piece of ONE sponsor's stack, referencing their own issue numbers.
- 3-min demo shape: Agent calls a paid MCP tool that needs 90 seconds of real work. Payment challenge appears; agent authorizes a ceiling; connection drops (killed on camera); tool keeps working; agent reconnects and collects the result, settlement receipt on HCS. Then the kicker: the same middleware wrapped around a second, unrelated service in ~20 lines, proving it's a kit.
- TASTE lines satisfied: U1 (real paid job, real settlement), U2, U5, U6 (exists only because of Blocky402's ceiling model), C-IN1 (live consumer included by construction), avoids the generic-payer ban because the PRODUCT is the unsolved async pattern, not "an agent that pays."
- primitive(s) adapted: F19 (rail-native missing plumbing — the sheet literally names "async MCP payment middleware, the LITERAL #903 gap") remixed with F08 (interface species: MCP middleware owning the complete pay-pause-resume-settle job, not a single verb).
- law-check: L2 pass — the killed-connection resume is a visible, legible beat. L3 pass — first working instance of a sponsor-admitted unsolved pattern. L11 pass — the disconnect is performed live, not seeded. L12 pass — on any non-ceiling rail the demo is impossible, not just harder.
- prize-combo: Hedera x402 ($6K), Hedera OSS Harness ($2K), Graph AI-Continuity ($5K — the consumer tool queries subgraphs).

- name: **Headcount** — one human, one allocation, enforced by the auction itself
- mechanism: A Uniswap CCA hook that resolves each bidder's wallet to a World AgentBook anonymous humanId at bid time and enforces a per-HUMAN cap across all wallets and agents that human controls — a fair-launch auction where sybil wallets don't multiply your allocation, they just re-fill the same bucket. Agents can bid on their human's behalf via AgentKit; the cap follows the human, not the key.
- why-this-chain: CCA is the only auction primitive with modular hooks in the bid path (the prize text names per-user caps and zk-eligibility as intended extensions), and World is the only stack resolving wallet→distinct-anonymous-human onchain. The composition — cap keyed on humanId inside the clearing mechanism — cannot be assembled anywhere else; elsewhere "per-user" means "per-wallet," which is the whole disease.
- 3-min demo shape: Launch a real token auction. One human bids from 3 wallets + 1 agent — chart shows all four bids draining ONE shared cap, third bid partially fills, fourth reverts on camera. A second verified human bids and gets a fresh full cap. Auction clears at uniform price; allocations land; the sybil's total equals exactly one human's share.
- TASTE lines satisfied: U1, U2 (the revert IS the demo), U3, U6 (hook + AgentBook both load-bearing), U7 (sybil attempt performed live), C-DF1 (real tokens clear and settle).
- primitive(s) adapted: F12 (attenuation layer — what's attenuated is auction power, attenuated per-HUMAN not per-key; substrate shifted from wallet policies to a CCA hook) aimed into M3 + W8 + W10. Not a guardian/co-signer: the cap is structural at bid time, nothing reviews transactions.
- law-check: L2 pass — four bids, one bucket, one revert: legible without narration. L3 pass — sybil-proof fair launch is an unclaimed demo. L11 pass — auction state earned by really running it. L12 pass — without AgentBook the hook is a per-wallet cap (pointless); without CCA hooks there's no bid-path to enforce in.
- prize-combo: Uniswap ($3K, FEEDBACK.md on CCA hook DX), World Selfie Check ($3.5K), World AgentKit-Continuity ($3.5K).

- name: **Solo** — per-human pricing curves for paid services
- mechanism: Drop-in pricing layer for any x402 service where the price curve is keyed to the caller's World humanId, not their wallet: first N calls per human cheap, escalating after — so a farm of 50 agents run by one human climbs ONE curve while 50 distinct humans each get the cheap tier. Uses the World endpoint that serves proof-of-human and x402 payment in the same request, so verification adds zero round-trips.
- why-this-chain: Only World collapses "prove a distinct human backs this call" and "pay for this call" into one endpoint (agentkit.fetch); per-human pricing on any other rail requires a separate identity system the caller can trivially not use. Here the discount IS the incentive to verify — adoption is priced in, not begged for.
- 3-min demo shape: A real paid inference API with the curve on screen. Human 1 fires 5 agents at it — watch all five walk up the same curve, cost per call visibly rising. Human 2 (second verified session) calls once — cheap tier, flat. Total spend comparison lands the point: sybil farming became strictly unprofitable. Real USDC settles per call throughout.
- TASTE lines satisfied: U1, U2, U3 (economics that punish sybils automatically), U6, C-DF1, C-IN1 (the inference API is the live consumer of the pricing layer).
- primitive(s) adapted: F13 (per-unit metering) with the budget-clamp locus shifted to a NEW axis value: clamped per-humanId rather than per-key/per-ceiling — a metering dimension no receipt project has. Aims into M3 and the quality gap in W10.
- law-check: L2 pass — two curves diverging on one chart in real time. L3 pass — nobody has priced per-human. L11 pass — both humans verified live; no pre-seeded quotas. L12 pass — remove the World endpoint and the product is a rate-limiter any second wallet defeats (one-sentence test fails).
- prize-combo: World Selfie Check ($3.5K), World AgentKit-Continuity ($3.5K), Bazantic gateway ($1K).

- name: **Hydra** — one balance, many strategies, provably never double-spent
- mechanism: A depositor's single self-custodied Aqua balance simultaneously backs N competing SwapVM strategy programs (market-make, TWAP, momentum), each authored/tuned by an agent; a live scoreboard attributes every fill to its strategy and a solvency panel proves after each fill that the sum of live commitments never exceeded the one balance. The hand-rolled headline is Aqua's hardest promise made visible: shared liquidity with zero double-spend, full custody retained.
- why-this-chain: "One LP balance backing multiple strategies with self-custody" is a property only Aqua's architecture offers — every vault model must fragment or pool custody. The demo's core claim is meaningless anywhere else; it IS the sponsor's protocol thesis, executed at SwapVM level (6-week-old surface, near-zero examples, W3+W9).
- 3-min demo shape: Deposit once. Three strategies go live against real testnet swap flow; fills stream in color-coded per strategy; after each fill the solvency panel re-derives commitments-vs-balance on-chain and stamps green. Kill one strategy mid-run — the freed capacity flows to the other two on the next quote. End: one balance, three P&L lines, custody never left the depositor's key.
- TASTE lines satisfied: U1, U2 (scoreboard + solvency stamp), U3, U5 (Solidity/Foundry-deep builder, 2h SwapVM ramp acknowledged in capability sheet), U6 (unportable by construction), U7.
- primitive(s) adapted: F25 (sponsor's hardest guarantee hand-rolled as headline — the sheet's repeated 1st-place move, receipts Mimir/Aqua0) remixed with agents-as-strategists from W9; NOT a vault (inverse: custody stays with depositor), so clear of GhostFund/9ncore bans.
- law-check: L2 pass — three colored P&L lines from one balance is instantly legible. L3 pass — capital-efficiency shown live, not claimed. L11 pass — fills come from real swap flow during the demo. L12 pass — the one-sentence pitch ("one balance backed three strategies at once, provably") is false on every other venue.
- prize-combo: 1inch Aqua ($5K), 1inch continuity ($2K), Uniswap ($3K only if a comparison hook angle survives scoping — else 1inch alone).

- name: **Blackbox** — sealed bids in the enclave, one atomic public settlement
- mechanism: Agents needing a service (compute, data, execution) post a sealed max-price into a Chainlink CRE handlerInTee workflow; providers post sealed asks; matching and uniform clearing happen entirely inside the TEE, and ONLY the clearing price + matched pairs cross back to the DON to trigger one atomic on-chain USDC settlement. Losing quotes never exist outside the enclave — proven adversarially by a live cross-read denial attempt in the demo.
- why-this-chain: handlerInTee is the only sponsor primitive where you choose exactly which bytes leave private execution and the result still drives consensus-verified public state — sealed matching with atomic settlement needs both halves. FHE is too slow for the window; a plain backend can't prove non-leakage; this is P2's named port (Tenor's PER shape) onto the one stack that supports it here, into W4's empty lane.
- 3-min demo shape: Four provider agents submit sealed asks, two buyer agents sealed bids; the public mempool/state view shows NOTHING; TEE workflow fires; clearing price + two matches appear on-chain in one settlement tx, real USDC moves. Then the adversarial beat: attempt to read a losing bid from every public surface — logs, state, workflow I/O — each denial shown. Same auction re-run WITHOUT the TEE path to show exactly what would have leaked.
- TASTE lines satisfied: U1, U2, U3 (the leak-comparison re-run is the wow), U6 (which-bytes-cross-back is the product), U7 (privacy claim earned adversarially, per F02's "self-proving" bar), C-DF1.
- primitive(s) adapted: F02 (blind matching in private execution, atomic public settlement) with the forced axis-shift the sheet itself prescribes: substrate PER→CRE TEE, market behavior FX-RFQ→pricing of agent services (ties into M1's demand side). CRE beta constraint honored: CLI simulation accepted per chain-DNA.
- law-check: L2 pass — nothing-then-one-settlement is a stark visual. L3 pass — first-mover in a zero-complaint-corpus lane. L11 pass — the leak test is run against the real system live. L12 pass — remove the TEE and sealed bids are just trusted-server bids (product evaporates in one sentence).
- prize-combo: Chainlink CRE Confidential ($2K), Chainlink Continuity ($0.5K), Arc Agentic ($1.67K — settlement leg in USDC-native finality).

### G4 FULL RETURN
- name: **Undertow** (dark strategies on Aqua)
- mechanism: LPs/market-makers submit private pricing curves and inventory limits into a Chainlink CRE `handlerInTee` workflow; the TEE compiles them into signed SwapVM strategy programs deployed against ONE shared self-custodied Aqua balance. Takers get quotes whose parameters were never public; the TEE proves the privacy claim adversarially (live cross-read denial + a "leak attempt" that fails closed before any transfer). One balance, many blind strategies — Aqua's hardest promise made literal.
- why-this-chain: SwapVM strategy programs + Aqua's single-balance-many-strategies model do not exist anywhere else; the TEE-signed-strategy-update pattern is compiled against SwapVM opcodes specifically. Porting means rebuilding both the strategy VM target and the confidential compiler (U6).
- 3-min demo shape: Split screen — left: a maker types a secret spread curve, hits submit, curve visibly encrypted into CRE; right: on-chain fork shows a SwapVM strategy go live and a real swap execute against the shared balance at the secret price. Then the wow: an attacker script tries to read the curve from calldata/state and gets nothing; a second maker joins and the SAME balance now backs both strategies with no rebalancing tx.
- TASTE lines satisfied: U2 (swap executes visibly), U3 (nobody has shipped confidential SwapVM authoring), U6 (protocol-level Aqua), U7 (state earned live on fork, forks explicitly allowed by 1inch text), C-DF1 (real swap settles).
- primitive(s) adapted: F02 (blind matching → privacy substrate shifted to CRE TEE, market behavior shifted to Aqua LP quoting) × F25 (sponsor's-hardest-guarantee: one balance safely backing many strategies, implemented for real).
- law-check: L2 pass — judge watches secret-in → swap-out in one take; L3 pass — first confidential strategy compiler for a 6-week-old VM; L11 pass — all three sponsors survive substitution (remove Aqua = no venue, remove CRE = curves public, remove Privy = no org custody story); L12 pass — no mocks, fork execution is sanctioned by prize text, CRE CLI simulation accepted per sponsor.
- track: Scratch
- prize-combo: 1inch Aqua $2,500 (LOW — best $-per-competitor per matrix) + Chainlink CRE Confidential $1,000 (LOW, W4 first-mover) + Privy B2B $2,500 (MED; the maker desk is an org wallet with quorum-gated strategy deployment). Realistic winnable ≈ $6,000.

- name: **Floatline** (working capital for x402 service operators)
- mechanism: An x402 service operator's future micropayment revenue becomes an investable instrument: a Hedera ATS security token is issued against a service's Blocky402 receipt stream, with lifecycle ops (distributions, redemptions) executed automatically from ACTUAL incoming x402 revenue via custom fee schedules — every receipt and every distribution on HCS. Investors buy float today; the token's cashflow is cryptographically the service's metered income, not a promise.
- why-this-chain: The instrument only works because Hedera fuses the payment rail and the securities rail: Blocky402 receipts, HCS audit trail, and ATS custom fee schedules are one substrate, so revenue-share enforcement is native, not an oracle. Elsewhere you'd rebuild the entire receipt-to-distribution binding (U6).
- 3-min demo shape: A live x402 service earns real paid requests on screen (agent pays, HCS entries tick up). Operator mints "FLOAT-01" on ATS, HashScan-verified. An investor buys tokens; then the wow — more paid requests arrive and the investor's balance receives a distribution sourced verifiably from those exact receipts, HCS trail linking payment→pool→distribution.
- TASTE lines satisfied: U1/U7 (revenue is real paid requests, not seeded), U2 (money in → distribution out, watchable), U3 (first "securitize an agent service" build), C-DF1, C-IN1 (the x402 service has a live paying consumer in-demo).
- primitive(s) adapted: F35 (institutional money-in-motion → asset class shifted to agent-economy-native revenue, where ATS fee schedules ARE the product economics) × F16 (missing institution: credit-into-float, M4) × F13 (the metered receipts are the collateral).
- law-check: L2 pass — three visible value movements; L3 pass — hits M4, a named missing outcome; L11 pass — substitution kills it (no ATS = no instrument, no Blocky402 = no revenue stream, no Privy = no issuer treasury controls); L12 pass — everything on testnet where allowed, contracts HashScan-verified per prize bullet, zero mocked flows.
- track: Scratch
- prize-combo: Hedera ATS $2,000 (LOW-MED, W5) + Hedera x402 $2,000 (HIGH, but supply-side W1 not payer-agent) + Privy B2B $2,500 (MED; org wallet = issuer treasury, quorum approves issuance). Realistic winnable ≈ $6,500.

- name: **Narrowcast** (ENSv2 capability namespaces that can only shrink)
- mechanism: An org's ENSv2 name delegates child names to its agents where Agent Text Records hold machine-readable spending capabilities (max-spend, merchant allowlist, expiry), and Enhanced Access Control enforces that any re-delegation hop can only NARROW the capability — enforced at the registry, not by policy convention. A USDC payment gateway on Arc resolves the payer's ENSv2 capability chain live before releasing funds; an over-grant or out-of-scope payment reverts with the violated record cited.
- why-this-chain: ENSv2's hierarchical registries + Enhanced Access Control + Permissioned Resolvers are the only place monotonic capability-narrowing can be REGISTRY-enforced rather than app-enforced; Agent Text Records are the fresh primitive (W7). Porting = rebuilding a permissioned naming registry.
- 3-min demo shape: org.eth grants `intern-agent.org.eth` a $5/merchant-scoped cap; agent pays a real USDC invoice on Arc — settles sub-second. Then the wow twice: the agent tries to re-delegate a WIDER cap to a sub-agent → registry rejects at grant time; the agent tries an off-allowlist payment → gateway reverts citing the exact text record. Attenuation proven by violation.
- TASTE lines satisfied: U2 (grant→pay→refuse arc in one sitting), U6 (Enhanced Access Control load-bearing, no hard-coded values per ENS text), U7 (refusals are live reverts), C-DF1 (real USDC moves on the happy path).
- primitive(s) adapted: F12 (attenuated delegation → substrate shifted to ENSv2 registry-level enforcement; explicitly attenuation-at-grant-time, NOT Backstop's review-at-execution co-signing) — remix: the naming system itself is the capability lattice.
- law-check: L2 pass; L3 pass — nobody treats ENS as an ocap system; L11 pass (no ENSv2 = no enforced lattice; no Arc = no native-USDC settlement demo; no Privy = no org parent-key custody); L12 pass — distinct from Backstop per the primitives sheet's own carve-out, all flows live on Sepolia/Arc testnet.
- track: Scratch
- prize-combo: ENS ENSv2 $1,500 (MED) + Arc Agentic Economy $1,667 (HIGH, but capability-gated payments ≠ generic payer agent) + Privy B2B $2,500 (MED; org wallet holds parent name, quorum approves grants). Realistic winnable ≈ $5,700.

- name: **Even Keel** (one-human-one-allocation CCA launches)
- mechanism: A Uniswap CCA (continuous clearing auction) hook extension where every bid must carry a World Selfie Check nullifier — one human, one allocation, regardless of how many wallets or agents bid on their behalf. Agents are first-class bidders (they optimize timing/price via live Graph auction-state data) but the scarcity is human-denominated: a second bid under the same humanId is rejected in the hook, on-chain.
- why-this-chain: Uniswap v4's CCA + hook architecture is the only venue where fairness logic executes inside the clearing mechanism itself; World's endpoint fusing proof-of-human with the payment call makes the nullifier check one round-trip. This is the M3 composition (World + CCA) the gap map names and nobody occupies.
- 3-min demo shape: Token launch auction live on a fork. Three bidders: a human, that same human's agent from a second wallet, and a distinct human. Wow: the duplicate-human bid REVERTS inside the hook with the nullifier collision shown on-chain; auction clears; allocations land 1-per-human while a sybil script with 20 wallets gets exactly one fill.
- TASTE lines satisfied: U2 (revert is the demo), U3 (sybil-proof clearing inside the AMM stack), U6 (hook-level, unportable without v4 + World nullifiers), U7 (sybil attempt is real and fails), C-AI1 respected by NOT overclaiming AI — the agents' Graph-driven bidding is the decision signal, removable-AI test passes because fairness (not the agent) is the product… so agents kept as consumers, not the headline.
- primitive(s) adapted: F02 (auction matching → fairness axis instead of privacy axis; commitment = nullifier) × F12 (what is attenuated: allocation rights per humanId).
- law-check: L2 pass; L3 pass (W8 + W10 quality-gap simultaneously); L11 pass (no CCA hook = no enforced clearing; no World = no scarcity; no Graph = agents blind, and Graph Composable requires the live auction subgraph the agents/UI both read); L12 pass — feedback doc for World budgeted per rules of engagement, FEEDBACK.md for Uniswap.
- track: Scratch
- prize-combo: Uniswap Stack Contribution $1,000 (LOW on the CCA angle per matrix) + World Selfie Check $1,166 (HIGH volume, thin on quality — this is a load-bearing signal, the exact rubric ask) + Graph Composable $1,000 (MED). Realistic winnable ≈ $3,200 with unusually low collision risk on the core mechanism.

- name: **Settle402** (the missing async x402+MCP layer, shipped with a flagship service)
- mechanism: Implements and documents the Hedera x402+MCP async-payment pattern that issues #903/#892/#1007 prove nobody has shipped: an MCP middleware where a tool call returns a payment-required continuation, the agent's Blocky402 spending-ceiling signature authorizes it gas-free, and the deferred result resolves on settlement — every hop on HCS. Ships WITH a flagship consumer-worthy service (C-IN1): a metered "position-risk sentry" that does real multi-subgraph work per query (live Graph data on lending positions across chains) priced per index-row consumed, budget clamped by the ceiling.
- why-this-chain: Blocky402's gas-free ceiling model (payer never holds HBAR) is the UNIQUE property that makes async agent payments viable at all — it's P1's named portability gap, and HCS gives the per-unit audit trail the metering needs. The middleware is structurally Hedera-shaped.
- 3-min demo shape: Agent in a live MCP session hits a paywalled tool → payment challenge appears → agent signs a ceiling once → three subsequent metered calls settle asynchronously with HCS entries scrolling in real time and per-row prices itemized; wow: kill the facilitator mid-call, the async continuation recovers and settles — the exact failure mode #903 describes, handled on camera.
- TASTE lines satisfied: U1 (real paid requests e2e, the literal prize bullet), U2, U3 (shipping a sponsor-admitted vacuum IS the originality), U6 (W1+W2 simultaneously), C-IN1 (the sentry service is the live consumer), differentiated from ChainSight per [C]: this is supply-side paid infrastructure with metering/audit, not a read-only analyst product.
- primitive(s) adapted: F19 (rail-native kit → the LITERAL #903 middleware, named as an adaptation axis) × F13 (metered unit shifted to index-rows; clamp locus = Blocky402 ceiling; earner = the service).
- law-check: L2 pass; L3 pass — "nobody has" is written in the gap map; L11 pass (no Blocky402 = no gas-free async pattern; no Graph = no meaningful work to sell; no Bazantic = no external agent onboarding, and its Agentify bullet is satisfied by exposing the sentry as a previously-unavailable API); L12 pass — every payment real, HIGH-crowding lanes entered only with the differentiator both sponsors' own issue trackers validate.
- track: Scratch
- prize-combo: Hedera x402 $2,000 (HIGH — but this is the anti-modal supply-side entry) + Graph AI Scratch $2,500 (HIGH — ChainSight-differentiated in writing) + Bazantic Agentify a New API $500 (LOW). Realistic winnable ≈ $5,000, highest strategic-fit EV per slice combo #1.

- name: **AgentMesh: Meshwork Escrow** (Continuity)
- mechanism: Continuity extension of AgentMesh (won 0G @ ETHGlobal Open Agents — base documented per Graph Continuity rules). The NEW work is a refundable streaming-escrow settlement layer between mesh participants (F16/M4 — escrow/refunds, NOT a forbidden shape): payments for mesh services stream per delivered unit into escrow and auto-refund the undelivered remainder; agents' accept/price decisions are driven by live Graph data (per-service settlement history subgraph); World AgentBook binds each service's payout wallet to an anonymous humanId so every paid service has a real human economically on the hook; one mesh service exposed to outside agents via a Bazantic Gateway + Recipe with the required A/B test.
- why-this-chain: The Graph Continuity track literally requires a documented pre-existing repo + new load-bearing live-data AI usage — the settlement-history subgraph feeds the agents' accept/decline decisions, meaningful work per the bullet. World's wallet→humanId mapping is the only primitive that gives sybil-costly ownership without building a (forbidden) reputation system.
- 3-min demo shape: Two AgentMesh agents negotiate a job; buyer's funds stream into escrow visibly per delivered chunk; wow #1: seller stops delivering at 60% → remaining 40% auto-refunds on-chain; wow #2: an outside, non-mesh agent consumes the same service through the Bazantic gateway (A/B: with vs without gateway, timed); AgentBook panel shows the seller resolves to a verified human.
- TASTE lines satisfied: U4 explicitly honored — the BASE is AgentMesh but the new work is an escrow/refund institution, a shape Dami has never shipped; U1/U7 (refund is earned by a real mid-stream failure); U2; C-DF1.
- primitive(s) adapted: F16 (missing institution: refundable escrow/streaming settlement — honesty forced by economics, not scores, exactly the M2 caution's prescribed direction) × F29 (delivery-proof gates settlement; attested fact is delivery, NOT agent reputation, per the sheet's carve-out).
- law-check: L2 pass; L3 pass (nobody has partial-refund streaming for agent services); L11 pass — each sponsor load-bearing (no Graph = agents price blind; no World = no human accountability anchor; no Bazantic = no external consumer + no A/B artifact); L12 pass — Hedera-style "substantive new work" bar cleared: three new subsystems, zero polish-only changes; all three sponsors verified Continuity-eligible per slice (Graph AI Continuity, World AgentKit Continuity, Bazantic explicitly Continuity).
- track: Continuity — base repo: AgentMesh. NEW work = streaming refundable escrow contracts + settlement-history subgraph + AgentBook humanId binding + Bazantic gateway/recipe/A-B. The mesh/registry itself is untouched (that shape stays banned; it is only the substrate).
- prize-combo: Graph AI Continuity $2,500 (LOW-MED) + World AgentKit Continuity $1,166 (LOW — Continuity barrier filters the field) + Bazantic Help-an-Agent $500 (LOW). Realistic winnable ≈ $4,200 at the event's lowest crowding — the slice's "Continuity farm" combo with Dami's repo moat.

- name: **Meterwage** (streaming payroll for agent work, mainnet-bound)
- mechanism: Employers fund a payroll vault; agents (or human gig workers with agent tooling) get paid per completed, verified unit of work via Arc Nanopayments with sub-second USDC finality — not per invoice, per unit, with the unverified remainder never leaving the vault. Privy org wallet is the employer: payroll runs are async intents requiring m-of-n approval; a single approved intent authorizes the whole metered stream, and the stream halts the instant verification fails.
- why-this-chain: USDC-as-native-gas + sub-second finality is what makes per-unit wage streaming economically real rather than simulated — on any other chain the gas per unit exceeds the wage. Arc's Nanopayments primitive IS the product (U6), and the Launch track's Sep-30 mainnet bar is met because the whole system is two contracts + Privy.
- 3-min demo shape: Employer approves one payroll intent (Privy quorum UI, 2-of-3). Worker-agent completes tasks live; wallet balance ticks up per unit in real time — real USDC, visible finality. Wow: a task fails verification mid-stream → the stream freezes on that exact unit, vault keeps the remainder, and the employer's dashboard shows cost-per-verified-unit; then the mainnet-launch checklist is shown green.
- TASTE lines satisfied: U1/U7 (failed unit is a real failure, not seeded), U2 (a balance ticking per unit is instantly legible), U3, C-DF1 (real USDC in demo), C-AI1 handled: the product is the payment institution, agents are its users — no AI-wrapper claim made.
- primitive(s) adapted: F16 (missing institution: payroll-for-agents, a named adaptation axis, distinct from the forbidden self-funding treasury loop — money flows employer→worker, no loop) × F13 (metered unit = verified work unit; clamp locus = the approved intent's ceiling).
- law-check: L2 pass; L3 pass (M4 whitespace: streaming settlement primitive); L11 pass (no Arc = no economically-viable unit streaming; no Privy = no org approval semantics, its "≥1 control" bullet met by intents+quorum; third selection is Arc Launch, load-bearing as the mainnet-readiness workstream); L12 pass — Arc requires functional MVP + mainnet by Sep 30, both scoped inside 4.5 days for a two-contract system.
- track: Scratch
- prize-combo: Arc Agentic Economy $1,667 (HIGH — differentiated as institution, not payer-agent) + Arc Launch to Mainnet $2,500 (MED) + Privy Best Financial Flow $2,500 (HIGH — but "≥1 complete functional flow" is satisfied to the letter by the approve→stream→halt flow). Realistic winnable ≈ $6,700.

## synthesis + pool_gates (main context, 2026-09-08T22:57:34Z)

### Dedupe clusters (36 raw -> merges)
- CLUSTER A "#903 async x402+MCP": WakeToll(G1) + Lockstep(G3) + Patience(G2) + Settle402(G4) -> MERGED as **Settle402** (strongest: adds flagship metered Graph service + Bazantic agentify + kill-facilitator recovery beat). 4-generator convergence = internal-modal warning (L1): competitors read the same GitHub issues.
- CLUSTER B "Scheduled-Tx auto-refund": Clawback402(G1) + Boomerang(G2) + Floatline(G3) + Bondback(G5) + Surety(G3, bonded answers) -> HYBRID **Floatline** (two-sided trust rail: buyer refundable float w/ dead-man Scheduled-Tx refund + provider slashable USDC bond w/ machine-checkable SLA; HCS verdict trail; Surety's stale-answer slash folded as the flagship SLA type). Parents: G3xG5.
- CLUSTER C "Aqua shared balance": Manifold(G3)+Hydra(G2) merged -> Hydra; Undertow(G4) kept separate (confidential authoring twist); Glasspool(G5), TrueDelta(G1), AquaSieve(G1) distinct.
- CLUSTER D "human-gated CCA": Headcount(G3)+Headcount(G2)+Even Keel(G4) -> MERGED **Headcount** (per-HUMAN shared cap via AgentBook nullifier inside CCA hook; agents bid via live Graph auction subgraph).
- CLUSTER E "TEE sealed matching": Darkroom(G3)+Blackbox(G2) -> Blackbox.
- CLUSTER F "x402 revenue tokenization": Callflow(G5)+Floatline-G4(ATS securitization) -> MERGED **Callflow** (ATS revenue-share tokens; facilitator splits EVERY x402 micropayment pro-rata pre-custody; HCS trail; Graph dividend subgraph).
- CLUSTER G "identity-priced 402": BotTax(G5)+Solo(G2) -> MERGED **BotTax** (dual-species pricing + per-human escalating curves; same World endpoint).
- Late entrants: [SEED] 0 added (pool saturated; winner-corpus patterns already flowed via primitives sheet as validators). [HISTORY] AgentMesh continuity entered via G4 (Meshwork Escrow) - treated as [HISTORY]-equivalent, no protection.

### Gate kills (name | gate | cause)
- Meterwage | 1b#1 | not_ecosystem_native (payroll = named TradFi frame; no lens toggle declared)
- Mandate | 1 | organizer_suggested + self-duplication-adjacent (Privy own agent-recipe = L6 collision template; approval-at-execution too close to Backstop shape)
- Streamsmith | 1 | organizer_suggested (Graph featured one-prompt Substreams challenge = highest-collision template, L6)
- Cachet | 1 [C13] | day-1 users hypothetical (paid multi-step pipelines barely exist yet)
- Splitbrain | 1/L11 | strongest axis (DX harness) maps weakly to the CRE Confidential bullet (handlerInTee must be central); $3K ceiling
- Factstake | 3 | 18.5/25 floor-adjacent + prediction-market = seen shape; subgraph-oracle manipulation surface
- Molt | 3 | 17.5/25 (AI code-migrator = seen; demo is diffs, moderate spectacle)
- Blackbox | 3 | 18/25 Ship 2.5 (CRE private-beta access + matching + settlement in 4.5d; kept as pattern inside Undertow)
- Meshwork Escrow | 3 | 18/25; continuity EV ($4.2K) < best scratch plays; kept as documented CONTINUITY BENCHMARK for the track decision
- TrueDelta, AquaSieve | 6 | outscored within Aqua cluster (safety tooling < app shapes for the "Build an Aqua App" bullet)
- Hydra | 6 | 19.5/25 outscored by Undertow (novelty) and Glasspool within cluster
- Glasspool | 6 | 21/25 strong but Aqua slot taken by Undertow on Novel spike; reserve #1
- Tollbooth | 6 | 21.5/25 narrowly out of spike slots; reserve #2 (would re-enter if Callflow fact-check fails - shares Hedera asset-layer thesis)
- Subkey/Narrowcast (merged) | 6 | 21.5/25 reserve #3
- Lifewire | 6->IN | top-1 Memorable spike slot (5/5)
- Settle402 | 6->IN | strategic-fit + Sponsor 5/5; internal-modal risk flagged for Round 0

### Gate 3 scores (Ship/Demo/Sponsor/Novel/Memorable = /25)
Floatline 4/5/5/4.5/5 = 23.5 | BotTax 4/5/4.5/4.5/5 = 23 | Callflow 3.5/5/5/4.5/4.5 = 22.5 | Headcount 3.5/5/4.5/4.5/4.5 = 22 | Undertow 2.5/4.5/5/5/4.5 = 21.5 | Lifewire 4/5/4/4/5 = 22 | Settle402 4/4/5/3.5/3.5 = 20
### Gate 4 brief-utilization: mapped levers = Hedera x402/ATS/HCS/ScheduledTx (Floatline,Callflow,BotTax), Graph AI/Composable (Headcount,Callflow,Settle402), Aqua/SwapVM+CRE TEE+Privy (Undertow), World AgentKit/SelfieCheck (BotTax,Headcount), Uniswap CCA (Headcount), Arc Nanopayments/finality+Privy flow (Lifewire), Bazantic (Settle402,BotTax), community-pain #903 (Settle402), #26/audit (reserve TrueDelta/AquaSieve noted). UNMAPPED: Ledger (no idea found - physical device unverified), Chainlink Liquidation challenge (no idea found - fixed-rubric side quest, optional add-on later), Hedera Harness (partially - Settle402/Floatline can PR their harness). Unmapped 2.5/~20 levers = 12% < 40% PASS.
### Gate 5 anti-attractor: 0 full house-shape matches (Settle402 nearest; lacks reasoning-hash+dashboard) PASS. 
### Gate 7 ceiling: Novel>=4 present (Undertow 5; four at 4.5) PASS. Gate 8 rescue: none needed.

### PRESENTED POOL (7 - spike-selected: top-3 total + top-2 Novel + top-1 Memorable + strategic-fit slot, deduped)
1. Floatline 23.5 | 2. BotTax 23 | 3. Callflow 22.5 | 4. Headcount 22 | 5. Lifewire 22 | 6. Undertow 21.5 | 7. Settle402 20

## demo_scripts
Written to warroom/demo-scripts.md. Verdicts: Floatline STRONG, BotTax STRONG, Callflow STRONG, Headcount STRONG, Lifewire STRONG, Undertow THIN-leaning-strong (TEE explanation cost), Settle402 THIN (plumbing wow). No hollow scripts.

## round_0 — CRAFT
### CRAFT — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (1 line: what the judge SEES) |
|---|---|---|---|---|---|---|---|
| Lifewire | 7 | 8 | 8 | 10 | 10 | **8.6** | Second 30: live stream + USDC drip; wallet closes, stream DIES in <1s, revives — money as electricity, zero words needed |
| Settle402 | 8 | 6 | 8 | 4 | 4 | 6.0 | Second 30: HCS log lines scrolling and an itemized price table — the judge is READING, not feeling (routedock/X15 rhyme) |
| Callflow | 7 | 8 | 7 | 8 | 8 | 7.6 | Second 30: two wallet balances ticking upward per API call, 70/30 — dividends you can watch land |
| Undertow | 9 | 8 | 6 | 4 | 5 | 6.4 | Second 30: a swap fills at a price the judge can't see and an attacker script returns nothing — proving ABSENCE is invisible (Mirror/X04 rhyme) |
| BotTax | 6 | 8 | 6 | 9 | 8 | 7.4 | Second 30: split screen, human pays $0.005, bot pays $0.50, same URL — "priced by species" lands instantly; TestFlight dependency taxes Pract |
| Floatline | 8 | 7 | 8 | 8 | 8 | 7.8 | Second 30: buyer process killed, then 63 cents crawls back into a DEAD wallet by itself — a small gasp, though float/bond/SLA needs one setup sentence |
| Headcount | 8 | 8 | 6 | 7 | 7 | 7.2 | Second 30: fourth wallet's bid REVERTS with a nullifier collision, "bids: 14, humans: 14" — legible, but a revert is quieter spectacle than money moving; TestFlight risk |

**Top pick: Lifewire.** It is the only idea where the wow is a physical event the judge witnesses (kill the payment, kill the stream) rather than a mechanism the judge decodes — the "oh" reproduces in ~10 seconds, and async judging makes that the whole game. Floatline is my strong second: the dead-wallet auto-refund is Lifewire-grade spectacle with a deeper institution behind it.

**Highest explanation cost: Settle402.** Its entire value proposition lives in GitHub issues #903/#892 — a judge must first understand why async x402+MCP is unsolved before the demo means anything, and the on-screen artifact is scrolling logs and a price table (the literal routedock failure mode). Undertow is a close second: its proof is that *nothing* leaks, and nothing is what the camera shows. **Divergence noted:** SPEC and DEPTH will rank Settle402 and Undertow top-2 (sponsor-admitted vacuum, hardest-guarantee hand-roll — and sponsor engineers judging their own track partially mitigates my penalty); I hold that even a Hedera engineer skimming 200 async videos rewards the entry they can FEEL, and WILD will overrate Undertow's dark-pool mystique while underweighting its invisible proof surface.

## round_0 — DEPTH
### DEPTH — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (1 line) |
|---|---|---|---|---|---|---|---|
| Lifewire | 6 | 6.5 | 8 | 8 | 8 | 7.3 | Kill-latency lives in the provider daemon, not the chain — off-chain enforcement dressed as a protocol property; spectacular but shallow. |
| Settle402 | 8 | 6 | 9 | 7 | 6.5 | 7.3 | Durable payment-continuations + crash-recovery is real middleware engineering against named issues (#903); originality capped by proven convergence (4/5 own generators, rivals likely too). |
| Callflow | 7.5 | 8 | 7 | 7 | 8 | 7.5 | Fresh asset-class idea, but "skimming unrepresentable" hinges on WHO runs the facilitator — split is facilitator code unless the fee schedule truly binds the USDC path. |
| Undertow | 9 | 8.5 | 5.5 | 5 | 7.5 | 7.1 | The only true F25 move — new VM target + confidential compiler = deepest protocol work in pool; CRE private-beta access + SwapVM ramp make the DEEP version a 4.5-day coin flip. |
| BotTax | 5 | 6.5 | 6 | 8 | 8 | 6.7 | AgentKit already fuses proof-of-human+x402; BotTax adds pricing curves on top — SDK decoration with great theater, thin in sponsor Q&A. |
| Floatline | 8 | 7.5 | 8 | 7 | 7.5 | 7.6 | Expiry refund is genuinely protocol-enforced (Scheduled Tx, no keeper, no veto); bond-slash side quietly reintroduces a trusted SLA verdict-signer — fixable if surfaced honestly. |
| Headcount | 8.5 | 8 | 6.5 | 7 | 7.5 | 7.5 | Enforcement inside clearing logic with on-chain nullifier revert is a real hard guarantee; cross-chain wallet→humanId read is the load-bearing seam. |

**Top pick: Floatline** — the hardest guarantee that is BOTH real and shippable solo in 4.5 days: a refund that fires with no live counterparty is a native Hedera invariant, not trusted code, and it answers Verdikt's L2 loss (own capital at stake) head-on. Undertow is the depth-maximal build and I'd champion it if CRE Confidential access were confirmed today — SPEC will (rightly) call the private-beta dependency a kill risk, and CRAFT will call its demo cerebral; I accept both divergences and still rank its Tech highest.

**Most likely Q&A collapse: Callflow.** A Hedera engineer will ask one question — "who runs the facilitator that executes the split?" — and the headline "skimming is unrepresentable" dies unless the pro-rata routing is enforced by HTS custom fee schedules on the *payment* leg (they live on the ATS token, not the incoming USDC). As built, it's a trusted-facilitator promise wearing a protocol-invariant costume. BotTax is the runner-up collapse ("what did you build that AgentKit doesn't already do?"). Note my bias: CRAFT/WILD would score Lifewire and BotTax 1-1.5 higher on the strength of their demos; I hold my Tech scores — a judge-engineer probing enforcement locus will land where I did.

## round_0 — WILD
### WILD — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Collision est. | Notes (1 line) |
|---|---|---|---|---|---|---|---|---|
| Lifewire | 7 | 8 | 7 | 8 | 9 | 7.8 | 1-3 | Money-as-electricity kill-demo is pure spectacle; rhymes faintly with Sablier/Superfluid streams but kill-latency-as-spec is a fresh cut |
| Settle402 | 7 | 3 | 8 | 6 | 4 | 5.6 | many | Reads GitHub issues #903 aloud back to the sponsor — the one map ~600 rivals also hold (L1); its own brief admits 4/5 generators converged |
| Callflow | 8 | 9 | 7 | 7 | 9 | 8.0 | 0 | Securitize an API, dividends per-call, skim unrepresentable — I have not seen this anywhere; L12 probe: no rival names this |
| Undertow | 9 | 9 | 5 | 5 | 7 | 7.0 | 0 | First confidential compiler for a 6-week VM = real frontier, but cerebral (X13 risk) and gated on CRE beta access in 4.5 days |
| BotTax | 6 | 8 | 6 | 7 | 8 | 7.0 | 1-3 | "Block bots→bill bots" is a genuine L9 question-shift; but World's prize page whispers this shape to everyone reading it |
| Floatline | 8 | 5 | 8 | 7 | 6 | 6.8 | 1-3 | Well-engineered, but "make agent payments safe" is the field's second instinct — Aegis402 already finaled this territory last event |
| Headcount | 8 | 7 | 6 | 7 | 8 | 7.2 | 1-3 | "bids: 14, humans: 14" is a killer counter; docked because the prize text ITSELF names per-user caps as the intended extension (L1 seed) |

**Top pick: Callflow.** It passes the L12 probe cold — three rivals at this event will not independently invent per-call securities dividends, because it requires fusing two Hedera pots (ATS + x402) nobody reads as one substrate. Two wallets ticking upward 70/30 per request is Keryx-class WOW with an asset class attached, and it *finances* the sponsor-admitted gap instead of merely filling it (better question-shift than Settle402's literal issue-closing). Lifewire is my close second and the field's best raw spectacle. **The secretly modal shape is Floatline** — Settle402 is *openly* modal, but Floatline wears institution-grade clothes over the field's default instinct ("escrow that makes agent payments safe"); expect several trust-rail entries wearing different bond mechanics, and judges will blur them together. Undertow is the under-rated one SPEC/DEPTH will overrate on difficulty and I'd still defend on originality — its real enemy is the calendar, not the idea.

## round_0 — SPEC
### SPEC — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (1 line, lens-specific) |
|---|---|---|---|---|---|---|---|
| Lifewire | 6 | 6 | 6 | 8 | 8 | 6.8 | Arc Nanopayments fits bullet, but Privy Financial Flow fails the substitution test (any wallet works) and "real decision signals" (Arc Agentic bullet) is thin — a drip is not a decision; smallest combo in pool |
| Settle402 | 8 | 5 | 9 | 7 | 6 | 7.0 | Dead-center literal fit on Hedera x402 bullet (Blocky402, real paid request, the sponsor's own open issues); but the gap is publicly documented = the whole field can read #903 too — Orig capped |
| Callflow | 8 | 8 | 8 | 7 | 8 | 7.8 | ATS bullet (issuance + lifecycle op, HashScan-verified) satisfied BY CONSTRUCTION and unsubstitutable (fee schedules ARE the split); x402 bullet earned by the paid API itself; one flag — Graph Composable demands ≥2 Graph products, spec shows one subgraph |
| Undertow | 9 | 8 | 5 | 6 | 8 | 7.2 | Aqua bullet uniquely forgiving ("local forks OK" is in the text), CRE handlerInTee sensitive-input literal fit — but CRE Confidential is private-beta access + 4.5-day SwapVM ramp: if either mocks, sponsor no-mock texts kill it; Privy B2B bolted on |
| BotTax | 6 | 7 | 5 | 7 | 8 | 6.6 | World load-bearing (good substitution) but Selfie Check sandbox = TestFlight, the builder's declared slow lane — a mocked human-proof is disqualifying per literal texts, in the brief's named most-contested lane |
| Floatline | 8 | 7 | 8 | 7 | 8 | 7.6 | Strongest U6 substitution test in pool (Scheduled Tx + gas-free ceiling + HCS all three load-bearing, keeper-less refund is on-chain provable) — but OSS Harness $2K is not literally earned by the spec (bullet wants a Harness PR) and combo is the softest at ~$9K |
| Headcount | 8 | 8 | 5 | 6 | 7 | 6.8 | Uniswap bullet literally names per-user caps as intended hook territory (rare exact match) — but Graph Composable under-specced again (one subgraph ≠ ≥2 products), plus double fact-check risk (TestFlight + CCA maturity) and an unresolved World-chain/v4-chain seam |

**Top pick: Callflow.** Two $6K bullets satisfied verbatim, both live-provable on HashScan with real USDC moving per request, and the ATS integration passes the substitution test structurally — the fee schedule IS the dividend mechanism, not decoration. Fix the one literal gap before forge: add a second Graph product (Token API or MCP alongside the subgraph) or Graph Composable's "compose ≥2" bullet greps as unmet.

**Kill: BotTax.** Its single load-bearing sponsor runs through a TestFlight mobile sandbox the builder sheet flags as slow/risky; if Selfie Check can't fire live in the demo, the literal no-mock language disqualifies the whole entry — and it sits in the lane the brief names most contested. WILD would defend it as the best spectacle in the pool ("priced by species"); I diverge — spectacle a sponsor engineer can't verify live is a liability, not an asset. Likewise, where DEPTH would rank Floatline first for institution design and CRAFT would elevate Undertow's TEE compiler, I dock both on unearned/unprovable bullets: the prize text is the rubric, and only Callflow clears all three of its bullets as written (minus one fixable Graph gap).

## round_0 — MERGED
| Idea | SPEC | DEPTH | CRAFT | WILD | Cross-Agent Avg | Spread |
|---|---|---|---|---|---|---|
| Callflow | 7.8 | 7.5 | 7.6 | 8.0 | **7.73** | 0.5 |
| Lifewire | 6.8 | 7.3 | 8.6 | 7.8 | **7.63** | 1.8 (flag) |
| Floatline | 7.6 | 7.6 | 7.8 | 6.8 | **7.45** | 1.0 |
| Headcount | 6.8 | 7.5 | 7.2 | 7.2 | **7.18** | 0.7 |
| Undertow | 7.2 | 7.1 | 6.4 | 7.0 | **6.93** | 0.8 |
| BotTax | 6.6 | 6.7 | 7.4 | 7.0 | **6.93** | 0.8 |
| Settle402 | 7.0 | 7.3 | 6.0 | 5.6 | **6.48** | 1.7 (flag) |
High-divergence (>1.5): Lifewire (CRAFT loves, SPEC docks combo), Settle402 (SPEC/DEPTH literal-fit vs CRAFT/WILD modal+logs-demo). No spread >2.0.
Top pick votes: Callflow (SPEC, WILD) | Floatline (DEPTH) | Lifewire (CRAFT).
Named collapse risks: Callflow facilitator-trust seam (DEPTH) + Graph "compose >=2 products" gap (SPEC, fixable); BotTax TestFlight no-mock DQ risk (SPEC kill vote); Undertow CRE private-beta + SwapVM ramp; Floatline SLA verdict-signer trust + "secretly modal" (WILD); Headcount TestFlight + CCA maturity + cross-chain humanId seam.

## pool_checkpoint (2026-09-09T18:54:11Z)
Full 7-idea presentation shown to Dami. Decision: Top 3 advance (Callflow, Lifewire, Floatline). No kills/redirects/injections.

## fact_check — Lifewire
## Fact-Check Results: Lifewire (ETHOnline 2026)

### CLAIM 1 — Nanopayments exists, integrable <1 day, per-second cadence: VERIFIED (with one framing correction)

- Circle Nanopayments is live on testnet (Arc + 11 other chains as of Feb 2026), built on Circle Gateway. Concretely it is **NOT a payment channel or on-chain stream** — it is x402-style off-chain signed EIP-3009 payment authorizations, batched by Circle into periodic on-chain settlements. Min payment $0.000001, gas-free (Circle covers batch gas). Source: [Circle blog](https://www.circle.com/blog/circle-nanopayments-launches-on-testnet-as-the-core-primitive-for-agentic-economic-activity), [developers.circle.com/gateway/nanopayments](https://developers.circle.com/gateway/nanopayments).
- Docs claim "thousands of sub-cent payments per minute" — per-second heartbeat cadence is comfortably within spec. Seller verifies the signature and serves the resource immediately; no on-chain wait per payment.
- Official starter kit exists: [github.com/circlefin/arc-nanopayments](https://github.com/circlefin/arc-nanopayments) — buyer agent + Next.js seller with 402 flow, `GatewayClient` SDK, Arc Testnet primary. Buyer/seller quickstarts exist. <1 day solo integration is realistic; the repo is essentially Lifewire's skeleton.
- Correction for pitch copy: say "Circle Nanopayments on Arc", not "Arc Nanopayments" — it's a Gateway product that runs on Arc (and other chains).

### CLAIM 2 — Arc testnet public, USDC gas, Sep-30 mainnet path: VERIFIED

- RPC: `https://rpc.testnet.arc.network`, chain ID 5042002 ([thirdweb chain page](https://thirdweb.com/arc-testnet)); faucet: [faucet.circle.com](https://faucet.circle.com) (select Arc testnet, sends test USDC directly).
- "USDC as native gas" confirmed in [docs.arc.io](https://docs.arc.io/llms.txt): USDC is the native gas token, 18-decimal native vs 6-decimal ERC-20 (1e12 factor — a known gotcha), 20 Gwei maxFeePerGas mempool floor. "Sub-second deterministic finality" is stated verbatim in Arc's own docs.
- Prize structure ([ethglobal.com/events/ethonline2026/prizes/arc](https://ethglobal.com/events/ethonline2026/prizes/arc)): 3 Arc prizes totaling $10K — Agentic Economy w/ Circle Agent Stack is $3,500 + **$2,500 bonus for Arc Mainnet deploy by Sep 30** (the "launch" path is a bonus on each prize, not a separate track). Evidence: working frontend+backend, architecture diagram, video, repo. Note: Nanopayments via Gateway is already [live on mainnet](https://www.circle.com/blog/nanopayments-powered-by-circle-gateway-is-now-live-on-mainnet), so the two-service app's mainnet path is realistic. [Privy Best Financial Flow $2.5K](https://ethglobal.com/events/ethonline2026/prizes) also confirmed (transfers/conversions/wallet actions qualify).

### CLAIM 3 — <1s kill latency: VERIFIED, with honest framing required

- Because payments are off-chain signed vouchers verified instantly by the seller, heartbeat cadence and missed-payment detection are bounded by HTTP round-trip + signature verification (tens of ms), **not** chain finality. A daemon that expects a voucher every 1000ms and kills at timeout+grace genuinely achieves sub-second-to-~1s cut. <1s is truthful — arguably conservative.
- BUT: enforcement is inherently daemon-side (off-chain). Judges will probe this. The honest framing: "detection and kill are off-chain and instant; economic settlement is Circle's batched on-chain settlement (cadence unspecified in docs) plus the buyer's on-chain Gateway Wallet deposit (sub-second finality on Arc)." The provable on-chain artifacts = the Gateway deposit tx + the batch settlement tx on Arc. Do not claim "on-chain per-second streaming" — that would be a misrepresentation of the primitive.

### Overall Verdict
All three claims stand: VERIFIED / VERIFIED / VERIFIED-with-framing. Honest headline number: **heartbeat every 1s, kill within ~1s of a missed voucher (off-chain enforcement, ms-scale detection); settlement batched on-chain by Circle Gateway on Arc (sub-second finality per Arc docs)**. Biggest pitch risk is terminology, not feasibility — call it "Circle Nanopayments (Gateway) on Arc," frame the daemon kill as off-chain enforcement with on-chain settlement proof, and target the $2.5K mainnet bonus (Nanopayments is already mainnet-live).

Sources: [Circle Nanopayments testnet launch](https://www.circle.com/blog/circle-nanopayments-launches-on-testnet-as-the-core-primitive-for-agentic-economic-activity) · [Nanopayments mainnet](https://www.circle.com/blog/nanopayments-powered-by-circle-gateway-is-now-live-on-mainnet) · [developers.circle.com/gateway/nanopayments](https://developers.circle.com/gateway/nanopayments) · [circlefin/arc-nanopayments](https://github.com/circlefin/arc-nanopayments) · [Arc docs](https://docs.arc.io/llms.txt) · [thirdweb Arc Testnet](https://thirdweb.com/arc-testnet) · [ETHOnline 2026 Arc prizes](https://ethglobal.com/events/ethonline2026/prizes/arc) · [ETHOnline 2026 prizes](https://ethglobal.com/events/ethonline2026/prizes)

## fact_check — Callflow
## Fact-Check Verdict: Callflow (ETHOnline 2026)

### CLAIM 1 — On-chain enforced pro-rata split on the payment leg: SOFT-FAIL, with a strong workaround that becomes the build spec

**(a) Fractional fees on USDC — confirmed impossible.** Per [Hedera custom token fees docs](https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service/custom-token-fees) and [HIP-18](https://hips.hedera.com/HIP/hip-18.html): a token's custom fee schedule can only be set/changed by the holder of that token's `feeScheduleKey` (or a threshold key including it, per [HIP-1010](https://hips.hedera.com/hip/hip-1010)). Circle controls USDC's keys; a third party cannot attach fees. Also structurally fatal even on a service-issued token: fractional fees pay to at most 10 *fixed* fee-collector accounts — they cannot do pro-rata across a dynamic holder set. Royalty fees are explicitly NFT-only.

**(b/c) The settlement leg cannot invoke code — but custody can be contract-enforced.** The authoritative [x402 Hedera exact scheme spec](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_hedera.md) says settlement MUST be a bare `TransferTransaction` (explicitly NOT wrapped in ScheduleCreate or anything else), and the facilitator MUST verify "the net token amount credited to `payTo` for `asset` equals `PaymentRequirements.amount`." So no atomic split at settlement — Hedera native transfers execute no code on receipt. However, `payTo` can be a **smart contract account**: Hedera contracts are ordinary 0.0.x accounts that can hold/receive HTS tokens once associated ([HIP-218](https://hips.hedera.com/hip/hip-218), [docs.hedera.com/evm/tokens](https://docs.hedera.com/evm/tokens)) — the spec imposes no EOA requirement, and the facilitator's own verification rule guarantees funds land in the contract, not the operator wallet.

**Honest reframe (the Q&A answer):** "The split isn't executed *in* the settlement transaction — Hedera transfers can't trigger code. What IS protocol-enforced: the facilitator cryptographically verifies every payment credits our splitter contract, whose only exit paths are pro-rata claims against an ATS snapshot. The operator wallet appears nowhere in the flow. Skimming isn't 'caught' — it has no code path."

### CLAIM 2 — ATS revenue-share token in hours: VERIFIED (with one caveat)

[github.com/hashgraph/asset-tokenization-studio](https://github.com/hashgraph/asset-tokenization-studio): ERC-1400 compliant (partial ERC-3643), with built-in **snapshots** ("accurate records for audits, dividends, or voting rights"), corporate-action foundations for dividend payments, and a **Mass Payout** component for batch/pro-rata distributions in HBAR or HTS tokens. Crucially there is a **hosted web UI at tokenization-studio.hedera.com** — no contract deployment needed to issue ([docs.hedera.com ATS page](https://docs.hedera.com/hedera/open-source-solutions/asset-tokenization-studio-ats)). Caveat: dividend *scheduling* logic isn't pre-built — you wire snapshots + Mass Payout yourself, which is fine since Callflow's splitter contract does that anyway.

### CLAIM 3 — Live x402 paid request in <1 day: VERIFIED

[hedera-dev/x402-inference-pay-per-request-poc](https://github.com/hedera-dev/x402-inference-pay-per-request-poc) is a working, forkable e2e PoC: Express server with Hedera Agent Kit middleware, x402 client, real $0.001 USDC/HBAR payments on testnet, smoke tests included. Prerequisites: 2 ECDSA testnet accounts, faucet HBAR + USDC, a token-association script, 6 env vars. [blocky402.com](https://blocky402.com) confirms **Hedera Testnet supported, no signup, no API key, free** (testnet also served by x402.org/facilitator per the PoC). Half a day for a competent dev.

### Overall verdict (3 lines)

**PROCEED.** Claims 2 and 3 verified hands-on; Claim 1 is a SOFT-FAIL on the literal "split executed at settlement" wording but survives via the honest reframe — facilitator-verified `payTo` = splitter contract means revenue provably never touches the operator wallet.
**Build spec for Claim 1:** x402 `payTo` = HTS-associated splitter contract (associate USDC via HTS precompile or auto-association slots); pull-based pro-rata claims computed against ATS ERC-1400 snapshots; HCS logs each distribution; subgraph indexes claims. Do NOT pitch HTS fractional fees — wrong key ownership (Circle) and fixed-collector limit both kill it.
**Q&A landmine defused:** rehearse the reframe above verbatim; the differentiator is "no code path for skimming," not "atomic split."

## fact_check — Floatline
## Fact-check results — Floatline (Hedera x402 trust rail)

**CLAIM 1 — VERIFIED.**
HIP-423 "Long Term Scheduled Transactions" is **status: Final, release v0.57.0**, live on mainnet since the v0.57 upgrade ([HIP-423 spec](https://hips.hedera.com/HIP/hip-423.html), [Hedera blog](https://hedera.com/blog/introducing-hip-423-long-term-scheduled-transactions)). The critical nuance you flagged is real and solved: default behavior (`wait_for_expiry=false`) executes **immediately** once signatures suffice, but the spec adds `wait_for_expiry: bool` — "this field shall specify that the transaction will wait till `expiration_time` to attempt to execute." User story 2 in the HIP is literally Floatline's pattern: "ScheduleCreate a CryptoTransfer... with all the required signatures already included in the ScheduleCreate... the transaction goes through a few seconds after the expiration_time." Max horizon: **62 days (5,356,800 s)** via `scheduling.maxExpirationFutureSeconds` ([SDK docs: ScheduleCreate](https://docs.hedera.com/hedera/sdks-and-apis/sdks/schedule-transaction/create-a-schedule-transaction), `setWaitForExpiry()` exists in the SDK). CryptoTransfer is in the schedulable whitelist. Execution is best-effort "at the first available consensus time after expiration_time" — seconds of jitter, no keeper. Caveat: if the schedule's signature requirements are NOT met at expiry it expires without executing, so the refund schedule must carry all needed sigs at ScheduleCreate time.

**CLAIM 2 — SOFT-FAIL (workaround: invert; ScheduleDelete not needed).**
ScheduleDelete requires an **admin key set at creation**; no admin key → `SCHEDULE_IS_IMMUTABLE` ([SDK docs: ScheduleDelete](https://docs.hedera.com/hedera/sdks-and-apis/sdks/schedule-transaction/delete-a-schedule-transaction)). Whoever holds that admin key can delete the refund unilaterally — giving it to the provider is exactly the trust hole you fear, and contract-held delete via the HIP-755 schedule system contract only cleanly supports `authorizeSchedule`/`signSchedule`, not delete. So don't cancel the refund — **make cancellation unnecessary**: settlement consumes the escrow before expiry, and the immutable refund schedule fires into an empty account and fails harmlessly. Provider never touches the refund path at all.

**CLAIM 3 — SOFT-FAIL (payment rail forkable <1 day; ceiling + HCS receipts are yours to build, small).**
Blocky402 is real: open-source x402 facilitator with **Hedera testnet AND mainnet** support ([blocky402.com](https://blocky402.com), listed as a resource on [docs.hedera.com/solutions/ai/x402](https://docs.hedera.com/solutions/ai/x402)). "Gas-free payer" is real but it's a property of **Hedera's x402 exact scheme**, not a Blocky402 exclusive: partially-signed TransferTransaction, "the facilitator will pay the gas fees and submit the transaction" ([Hedera x402 blog](https://hedera.com/blog/hedera-and-the-x402-payment-standard/)). The PoC exists and is fresh: [hedera-dev/x402-inference-pay-per-request-poc](https://github.com/hedera-dev/x402-inference-pay-per-request-poc) (pushed 2026-07-15) — full USDC/HBAR × testnet/mainnet pay-per-request flow, mainnet routes via `api.blocky402.com`. **However**: "spending ceiling" is not a Blocky402/PoC feature (it's a client-side policy you add to the x402 client — hours), and "HCS metering receipts" appear nowhere in the PoC or the x402 docs — that's your own `TopicMessageSubmit` per request (also hours). Fork-the-payment-flow-in-<1-day: credible. Ceiling+receipts: additional half-day of your own code, not a fork.

---

**OVERALL VERDICT (3 lines + build spec):**
GO — the load-bearing primitive (pre-armed, keeper-less, counterparty-independent auto-refund) is verified on mainnet today, with one mandatory flag and one design inversion; the x402 rail is forkable, with two small honest-labeled build items (ceiling, HCS receipts).

**Refund-arming build spec (Claims 1–2 closed):** At session-open, buyer funds a fresh per-session escrow account **E** (key: 1-of-2 threshold = buyer key OR settlement-contract contractId key) and submits `ScheduleCreate{ CryptoTransfer E→buyer for FULL float, wait_for_expiry=true, expiration_time=T (≤62 days), NO admin key (immutable), all required sigs (E's buyer key) attached at create }`. Happy path: provider posts delivery proof → machine-checked SLA verdict on HCS → settlement contract (the contractId key over E) transfers earned amount to provider + unconsumed remainder to buyer immediately, emptying E; at T the immutable refund schedule fires and fails harmlessly (insufficient balance). Default path: no valid delivery by T → schedule auto-executes, full float returns to buyer — no keeper, no provider cooperation, and no party (including the provider) can delete or block it because the schedule is immutable and the provider holds no key over E.

## cross_exam — Callflow attacks Lifewire
I have everything I need — briefs, demo scripts, both fact-checks, round_0 SPEC/MERGED, and the TASTE contract. Here is Callflow's cross-examination of Lifewire.

---

**[KILLING BLOW] U6 collapses: Arc is not load-bearing — Lifewire's own fact-check proves it**
Lifewire's core winning argument (ideas.md #5, "Why this chain") is that Arc's sub-second finality + USDC-native-gas make per-second heartbeats "economically impossible" elsewhere. Its own fact-check destroys all three legs: Circle Nanopayments is **off-chain signed EIP-3009 vouchers, batched by Circle, live on "Arc + 11 other chains"**; kill latency is "bounded by HTTP round-trip + signature verification (tens of ms), **not** chain finality"; and gas is irrelevant because "Circle covers batch gas." Port Lifewire to Base: change the RPC URL. That is the textbook U6 failure ("surface-level SDK calls lose; porting elsewhere means rebuilding") — and worse, the fact-check confirms the official starter repo `circlefin/arc-nanopayments` "is essentially Lifewire's skeleton." The product is a daemon with a timeout wrapped around Circle's own quickstart. The kill-switch — the entire wow — is off-chain policy in a Node process, exactly what TASTE calls "a Stripe-metered demo wearing USDC."
*What Lifewire answers:* the fact-check supplies an "honest framing" (off-chain enforcement + on-chain settlement proof) and the Mainnet bonus is Arc-specific, so *the prize* is chain-bound even if the tech isn't.
*Verdict:* **STANDS.** Honest framing saves it from disqualification, not from the depth question. A rebranded quickstart with a timeout cannot claim U6, and sponsor engineers who wrote that starter kit will recognize it instantly.

**[HEAVY HIT] Two of three selected bullets don't score — sponsor engineers grade the bullets, not the vibe**
SPEC's silent assessment (round_0): "Privy Financial Flow **fails the substitution test** (any wallet works) and 'real decision signals' (Arc Agentic bullet) **is thin — a drip is not a decision**." In a sponsor_track event where sponsor engineers judge their own qualification bullets, that means Lifewire's realistic scoring surface is essentially one bullet (Arc Mainnet bonus) plus a contested Agentic entry. This also grazes the concerns kill-list: "Max-3-sponsors each LOAD-BEARING (substitution test)" — Privy as written violates the pool's own filter. Callflow, per the same SPEC pass, satisfies its two $6K bullets "verbatim... by construction and unsubstitutable," with one fixable Graph gap.
*What Lifewire answers:* CRAFT scored it 8.6 (pool-high) and the drip could be reframed as a priority/decision signal via the GPU-bidding scene, which is genuinely a resource-allocation decision made by payment rate.
*Verdict:* **PARTIALLY ANSWERED** on Agentic (the GPU-steal scene is a real decision mechanism if pitched right), **STANDS** on Privy — no material in the brief or demo script makes Privy anything but a bolted-on wallet.

**[HEAVY HIT] Smallest prize combo in the pool, and the ceiling is even lower than advertised**
Ideas.md lists Lifewire at ~$7.7K addressable — dead last among the top 3 (Callflow $17K, Floatline $9K). Strip the two damaged bullets above and the defensible core is the Arc Agentic prize + $2.5K mainnet bonus — roughly $4-6K of realistic surface. The event has NO organizer cash prize (FACTS card); prize-bullet EV is the only EV. Callflow's two verbatim $6K Hedera bullets alone exceed Lifewire's entire addressable pool.
*What Lifewire answers:* "realistic ~$5.5K incl. mainnet bonus few teams attempt" — low crowding on the mainnet bonus is a genuine edge, and Nanopayments being mainnet-live makes the bonus achievable.
*Verdict:* **STANDS** on magnitude, softened by crowding — but a low-competition claim on a $2.5K bonus does not close a 2-3x EV gap.

**[FLESH WOUND] The wow is a live-room trick submitted to an async video queue**
Lifewire's spectacle is temporal: "stream freezes in <1s, timed on screen." In ETHOnline's async 2-4min video judging, a sub-second freeze is precisely the kind of moment a judge cannot distinguish from editing — and the on-chain artifacts that would prove it (per the fact-check: a Gateway deposit tx + a Circle **batch** settlement tx of unspecified cadence) do not timestamp the kill at all. The enforcement moment is unverifiable by construction. Contrast Callflow: every wow beat is a HashScan link a Hedera judge can click a week later.
*What Lifewire answers:* judges can clone the repo and pull the plug themselves; the demo script shows an on-screen timer, and U2 legibility is genuinely pool-best (CRAFT's 8.6, L14 max legibility).
*Verdict:* **ANSWERED-ish.** A runnable repo mitigates it; flesh wound only, but it converts "wow" from proof into trust-me — the exact posture U1/U7 exist to punish.

**[FLESH WOUND] "Streaming-gated existence" has visible ancestry**
Superfluid money-streams gating access and Sablier streams have made "stop the stream, lose the thing" a known demo shape since 2021; Lifewire's brief scores itself Novel 4 — lowest of the top 3 — and claims "clean-room origin" without a prior-art check (neither the brief nor the fact-check searched for it; Callflow's per-call dividend-at-settlement has no equivalent cited anywhere in the pool).
*What Lifewire answers:* the mechanism is genuinely different — off-chain voucher heartbeats with ms detection, not lazily-settled on-chain streams — and the GPU price-priority allocation is a new twist.
*Verdict:* **ANSWERED** at the mechanism level, stands only as an Originality-score drag: a sponsor judge who has seen the Superfluid demo will feel deja vu even if the plumbing is new.

---

**Summary (3 lines):**
One KILLING BLOW **stands**: Lifewire's "why Arc" argument is contradicted by its own fact-check — chain-portable off-chain vouchers, HTTP-bound kill latency, Circle-paid gas, built on Circle's own starter kit — a direct U6 failure that no honest reframing repairs, only mitigates.
Two HEAVY HITS stand on the scoring math: 1-of-3 bullets cleanly earned in a bullet-judged event, and the smallest prize surface in the pool (~2-3x below Callflow's).
Lifewire remains the pool's best pure spectacle (CRAFT 8.6), but in async, sponsor-bullet-judged ETHOnline, it is a beautiful demo of somebody else's primitive competing for the smallest pot — Callflow's verbatim two-$6K-bullet, HashScan-provable position holds.

## cross_exam — Lifewire attacks Callflow
Read everything mandated: both idea briefs, both demo scripts, both fact-check sections, round_0 MERGED, TASTE contract and concerns kill-list. Here is the cross-examination, advocating for Lifewire.

---

**[KILLING BLOW] The money-moment no longer exists — Scene 3 is now a U7 violation or a lie about the architecture**

Callflow's entire wow is demo Scene 3: "BOTH wallets tick upward per-call, split 70/30 at settlement... dividends arriving at request granularity" (demo-scripts.md:31). The fact-check destroyed the mechanism underneath it: the x402 Hedera exact scheme *mandates* a bare `TransferTransaction` — "no atomic split at settlement — Hedera native transfers execute no code on receipt" — and the build spec it produced is explicitly "**pull-based pro-rata claims** computed against ATS ERC-1400 snapshots." Under the honest architecture, investor wallets do NOT tick per call; the splitter contract's balance ticks, and holders claim later. To make two wallets visibly tick per-request 70/30, you'd need a keeper hammering claim/Mass-Payout per call — i.e., staged choreography contradicting your own build spec, which is exactly TASTE U7 ("Demo state is EARNED. Fabricated/seeded state forbidden when it contradicts the core claim") and U1. The ideas.md headline ("dividends arrive per-call at settlement", line 30-32) was scored 22.5 on a claim the fact-check falsified.

*What their material answers:* The fact-check's reframe is genuinely strong for Q&A — "skimming isn't caught, it has no code path" survives, facilitator-verified `payTo` = splitter contract is real. The anti-skim property stands.

*Verdict:* **STANDS — against the demo, not the project.** The honest demo is: contract balance rises per call, investor clicks "claim" once at the end. That is a competent splitter, not "dividends at request granularity." The wow that earned Demo 5 and CRAFT 7.6 does not survive the honest architecture, and nobody has re-scored it.

---

**[HEAVY HIT] The score that beat Lifewire was computed on the pre-downgrade claim — the 0.10 margin is dead**

Round_0 MERGED: Callflow 7.73 vs Lifewire 7.63 — a 0.10 gap, with Lifewire carrying the pool's highest CRAFT score (8.6) and DEPTH explicitly naming "Callflow facilitator-trust seam" as a collapse risk *before* the fact-check confirmed the settlement-split was impossible. Post-fact-check, the asymmetry is stark: Lifewire's three claims all came back **VERIFIED** ("the repo is essentially Lifewire's skeleton," "<1s is truthful — arguably conservative"), needing only naming/framing corrections; Callflow's Claim 1 came back **SOFT-FAIL** on the load-bearing wording, forcing a redesign of the demo's centerpiece.

*What their material answers:* The fact-check verdict says "PROCEED" and the reframe preserves the invariant. Nothing in their material re-runs the Demo/Memorable scoring under pull-based claims.

*Verdict:* **STANDS.** A ranking built on a falsified headline is stale. Any honest re-score of Demo/Memorable under "click claim at the end" hands the #1 slot to the idea whose kill-switch demo got *more* credible under fact-check.

---

**[HEAVY HIT] Three-sided demo, zero day-1 buyers — the same C13 that killed Cachet at gate 1**

The concerns kill-list demands "Day-1 users exist TODAY, reachable" — Cachet died at gate 1 for exactly "C13 day-1 users hypothetical" (ideas.md:79). Callflow needs a live paid API **and** an issuance event **and** an investor **and** a claim flow in one 3-minute video. Who buys revenue-share tokens of a 4-day-old demo API today? Nobody — so Scene 2's "investor wallet buys 30 for real USDC" is the builder's own second wallet buying from his first. Real tokens move (C-DF1 technically satisfied), but the *investor side* — the entire point of securitization — is self-dealt. Meanwhile Lifewire's buyer is any agent that wants a stream/GPU-second: a customer that exists the moment the demo runs.

*What their material answers:* The U6 line has a real narrative: it "FINANCES the sponsor-admitted gap: real paid services do not exist because building one is uncompensated up front." That's a thesis about who *should* buy, not who *does*.

*Verdict:* **STANDS as HEAVY, not killing** — self-funded demo wallets are hackathon-normal and judges tolerate them, but Callflow's version is worse than normal because the fake party is the product's raison d'être.

---

**[FLESH WOUND] Graph Composable $5K rides on "compose >=2 Graph products" and SPEC found one subgraph**

Round_0 named it: "Graph 'compose >=2 products' gap (SPEC, fixable)." The prize combo (ideas.md:36) books Graph Composable $5K into the addressable $17K and the realistic ~$5.5K, but the brief shows a single dividend subgraph (demo Scene 4 is one dashboard). "Fixable" means bolting on a second Graph product (Token API/Substreams) — unbudgeted scope on the pool's joint-lowest Ship score (3.5) across a build already spanning ATS + splitter contract + x402 facilitator + subgraph in 4 days, solo.

*What their material answers:* SPEC itself called it fixable, and a Token API call alongside the subgraph is genuinely cheap. Sponsor engineers judging their own bullet may still read one-subgraph-plus-garnish as decoration, but this is a scoping risk, not a structural one.

*Verdict:* **ANSWERED, mostly** — dock the realistic EV, don't kill on it.

---

**[FLESH WOUND] "So it's a Solidity splitter — what does ATS do?" — attempted, and it fails**

I tried to develop the securities/ATS-decoration attack and, honestly, it doesn't land. The fact-check shows ATS is load-bearing, not garnish: ERC-1400 issuance via the hosted UI, built-in snapshots that the pull-claims math *requires*, and Mass Payout for distributions. And the securities framing doesn't spook the Hedera ATS judge — securities tokenization is literally the product their $6K bullet exists to showcase; compliance machinery comes free with the hosted studio, so scope doesn't balloon.

*Verdict:* **ANSWERED.** Discarded as a serious line; Lifewire should not lead with this in rebuttal.

---

**Summary (3 lines):**
One KILLING BLOW stands, but it kills the *demo as scripted*, not the project: the per-call-ticking-wallets money-moment is architecturally false post-fact-check, and the honest replacement ("claim at the end") is a visibly weaker wow that was never re-scored — the 0.10 margin over Lifewire evaporates with it. Callflow survives as a project (the no-skim-code-path invariant and ATS depth are real), but it advanced to #1 on a headline its own fact-check downgraded. Lifewire's counter-position: all claims VERIFIED, skeleton repo exists, and its kill-switch wow got *stronger* under scrutiny — if Callflow cannot show an honest per-call money-moment by rebuttal, the ranking should flip.

## cross_exam — ADJUDICATION (main context)
Attacks landed both ways:
- vs Lifewire: KB "U6 collapses — Arc not load-bearing" STANDS (own fact-check: chain-portable EIP-3009 vouchers on 12 chains, HTTP-bound kill latency, Circle-paid gas, official starter kit = the skeleton). Structural: attacks why-this-chain itself. + 2 HEAVY (1-of-3 bullets cleanly earned; smallest EV surface) stand.
- vs Callflow: KB "per-call ticking demo architecturally false" STANDS against the demo AS SCRIPTED, not the project. ANSWERED by design amendment adopted here: PERMISSIONLESS distribute() poked after each paid request (service triggers it; anyone can) — funds flow payment->splitter contract (facilitator-verified payTo)->pro-rata per ATS snapshot on distribute; pull-claims always available as fallback. Operator skim path still nonexistent; wallets honestly tick per call (one extra ~$0.0001 Hedera tx per request). U7 satisfied: demo state produced by the product actually running. Demo scene 3 respecified accordingly.
- Callflow HEAVY "stale scoring margin": acknowledged — margin narrowed; but Lifewire's standing KB is deeper (identity-level) than Callflow's (demo-spec-level, amended). C13 HEAVY (self-dealt investor wallet): stands as honest limitation, hackathon-normal, noted in risk register.
VERDICT: NO FLIP. Callflow #1 (with mandatory amendment), Lifewire #2. Unresolved attack residue -> challenge/risk register: Callflow C13 investor-side realism + Graph >=2-products fix; Lifewire U6 depth + bullet coverage.

## challenge — Callflow
All source material read. Deliverables below.

---

## 1. STRONGEST CASE AGAINST

1. **The headline is already dead and the docs don't know it.** ideas.md §3 still pitches "splits EVERY incoming micropayment pro-rata AT SETTLEMENT — skimming is unrepresentable," but the fact-check ruled Claim 1 **SOFT-FAIL**: the x402 Hedera exact scheme mandates a bare `TransferTransaction` (no code on receipt), and HTS fractional fees on USDC are structurally impossible (Circle holds the feeScheduleKey; max 10 *fixed* collectors, no dynamic pro-rata). The surviving product is a payTo-splitter-contract with **pull-based claims** — a materially weaker claim wearing the original costume. That the idea card was never rewritten post-fact-check is **premature convergence** in writing.
2. **The demo script contradicts the build spec — eloquence over evidence.** Scene 3 promises "BOTH wallets tick upward per-call, split 70/30 at settlement." Pull-claims against ATS snapshots do not tick wallets per call; making them tick requires an auto-claim keeper script, which edges into U7 fabricated-state / P2 no-mock territory in front of the exact sponsor engineers who wrote the scheme spec.
3. **DEPTH already named this the field's most likely Q&A collapse**: "who runs the facilitator that executes the split?" — "a trusted-facilitator promise wearing a protocol-invariant costume." The reframe ("no code path for skimming") is defensible but must be delivered verbatim under pressure; the whole $12K Hedera thesis hangs on one rehearsed sentence.
4. **Graph Composable ($5K of the $17K addressable) is literally unmet**: SPEC flagged "compose ≥2 Graph products; spec shows one subgraph." Unfixed, one of three prize selections greps as disqualified — **research neglect** on the very rubric-literalism the SPEC vote was premised on.
5. **Sycophancy/echo-chamber signature in the vote itself**: WILD's top-pick rationale ("I have not seen this anywhere") and SPEC's ("clears all three bullets as written") were cast **before** the fact-check demoted the core claim; the panel scored the pitch, not the buildable artifact. DEPTH's dissent (7.5 Tech, collapse warning) was the outlier that turned out correct — classic conformity around the eloquent version.
6. **Scope fantasy for solo + 4.5 days**: Ship 3.5 was the *lowest* facet pre-fact-check, and the real build is 3-sided (paid API + consumer script, ATS issuance + investor purchase, splitter contract with HTS USDC association + claim logic + HCS logging + subgraph + dashboard) plus an unbudgeted ATS ramp — the fact-check itself concedes "dividend scheduling isn't pre-built; you wire snapshots + Mass Payout yourself."
7. **Securities optics are un-lawyered**: the demo sells revenue-share tokens to a second wallet "for real USDC." ATS's ERC-1400 compliance rails are decorative unless the pitch owns the securities framing; a judge asking "so you ran an unregistered securities offering on camera?" has no rehearsed answer anywhere in the corpus.

## 2. PREMORTEM — Sep 14, 2026: we submitted Callflow and LOST

**Scenario A — The per-call tick was exposed as a keeper.** The Hedera x402 judge paused the video at Scene 3, checked HashScan, and saw a cron wallet calling `claim()` after every request — not settlement-time splitting. Verdict: "the wow moment is a script, the actual mechanism is pull-claims you didn't show." U7/P2 credibility gone; both Hedera bullets scored down. → *Prevent: redesign Scene 3 honestly NOW — show the splitter balance ticking per-call (that IS real) then one on-camera claim() distributing pro-rata; rewrite ideas.md/PRD to the reframe before forge.*

**Scenario B — ATS ate days 1–2.** The hosted UI minted a token fine, but wiring ERC-1400 snapshots to the custom splitter (snapshot IDs, partition semantics, Mass Payout vs. own claim math) had no PoC to fork — unlike x402, which had one. By Thursday the subgraph and dashboard were stubs; Graph bullet submitted half-built. → *Prevent: timebox an ATS spike to 4 hours on day 1; if snapshot→splitter binding isn't proven by then, fall back to a plain HTS token + own snapshot registry and keep ATS as issuance-only.*

**Scenario C — The splitter never received USDC.** Contract deployed, x402 payTo pointed at it, first paid request failed: `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`. The HTS-association gotcha (contract must associate USDC via the HTS precompile or auto-association slots, HIP-218) surfaced at hour 60 during integration, not hour 6, and the facilitator's verify step rejected the route in a way the PoC's EOA path never exercised. → *Prevent: day-1 smoke test = one real x402 payment landing in a bare contract account, before ANY splitter logic exists.*

**Scenario D — Graph judge: "that's one product."** The subgraph was polished but Composable's "compose ≥2 Graph products" bullet was still unmet at submission; the $5K selection was burned on an ineligible entry when it could have gone to a third load-bearing sponsor. → *Prevent: decide in forge — either add Token API/MCP alongside the subgraph as a real consumer (hours, per SPEC "fixable"), or swap the third prize selection entirely.*

**Scenario E — Q&A collapse, as predicted.** The 3-sided demo ran long; the securities question ("who can legally buy CALLFLOW-01?") and the facilitator question landed back-to-back with no rehearsed answers; the presenter improvised, the judge heard hedging, and DEPTH's collapse forecast executed exactly as written. → *Prevent: script and rehearse three verbatim answers (facilitator reframe from the fact-check, securities framing via ATS transfer restrictions/whitelist, "why Hedera" U6 line) as part of demo-rehearsal, not after.*

## 3. RISK REGISTER

| Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Headline/build mismatch: docs & demo still claim atomic "split at settlement" post-SOFT-FAIL | CRITICAL | High (already true in ideas.md + demo-scripts.md) | Sponsor engineers who wrote the scheme spec catch it; credibility + both Hedera bullets collapse | **Mitigable but mandatory**: rewrite pitch/PRD/demo to the fact-check reframe ("no code path for skimming") before forge; this is a gate, not a task |
| Per-call-tick demo requires auto-claim keeper → reads as mocked state (U7/P2) | HIGH | High | Wow moment becomes the disqualifying moment | Show splitter balance ticking per-call (real) + one explicit on-camera claim(); never fake wallet ticks |
| Graph Composable ≥2-products bullet unmet | HIGH | Certain (as spec'd today) | $5K selection ineligible; one of max-3 slots wasted | Add Token API or MCP as live second product in forge, or swap the third sponsor selection |
| ATS unfamiliarity: snapshot→splitter wiring has no forkable PoC; dividend scheduling DIY | HIGH | Medium-High | Days lost; Ship 3.5 becomes Ship 2; downstream Graph/demo starve | 4-hour day-1 ATS spike with hard fallback (plain HTS + own snapshot registry, ATS issuance-only) |
| Splitter contract HTS/USDC association + facilitator-verify gotchas surface late | MED | Medium | 1-day integration stall at the worst time | Day-1 smoke test: real x402 payment → bare contract account, before splitter logic |
| Facilitator-trust Q&A ("who runs the facilitator?") delivered unrehearsed | MED | High | Named most-likely field collapse (DEPTH); Hedera x402 score drops | Rehearse fact-check reframe verbatim; consider self-hosting Blocky402 fork to shrink the trust surface |
| Securities framing: on-camera sale of revenue-share tokens for real USDC, no compliance narrative | MED | Medium | One hostile question sours Practicality/judge sentiment | Use ATS transfer-restriction/whitelist features on camera; pitch as "compliance-native by construction," one rehearsed line |
| 3-sided solo scope (API+consumer, issuance+investor, splitter+HCS+subgraph+dashboard) in 4.5 days | HIGH | Medium | Half-built third leg at deadline; granular-commit story exposes the scramble | Ruthless forge cut: dashboard is read-only subgraph views; consumer is a script, not a UI; ship legs in dependency order with daily proof commits |

**Veto assessment: no CRITICAL-and-unmitigable finding.** The single CRITICAL (headline/build mismatch) is fully mitigable because the fact-check itself supplies the honest reframe and build spec — but it is only mitigable if the rewrite happens *before* forge; carrying the dead "split at settlement" wording forward converts it into an unmitigable demo-day DQ in front of the one judge pool guaranteed to know better. Conditional proceed: gate forge on (1) the reframe rewrite, (2) the Graph second-product decision, (3) the day-1 ATS spike + contract-payTo smoke test.

## challenge — Lifewire
All source material read. Delivering the challenge pass.

---

## 1. STRONGEST CASE AGAINST LIFEWIRE

1. **The U6 claim is falsified by our own fact-check.** ideas.md line 49 claims "sub-second finality + USDC-as-native-gas + Nanopayments jointly load-bearing." The fact-check (transcript L485, L499) establishes Nanopayments are **off-chain EIP-3009 vouchers batched by Circle** — kill latency is bounded by HTTP round-trip, "not chain finality." The core mechanic (daemon timeout → kill) is portable to any chain, or to Stripe. Integration depth — U6, "porting elsewhere means rebuilding" — collapses; this is exactly the "surface-level SDK calls lose" trap.
2. **The starter kit IS the project.** Fact-check L487: circlefin/arc-nanopayments "is essentially Lifewire's skeleton" (buyer agent + Next.js seller + 402 flow). Sponsor engineers judge their own bullets — the Circle judge wrote or knows that repo, and every other Arc entrant starts from it. Uniqueness ([C] "zero confirmed competitors in exact niche") and P4 ("kill generic agentic-payments middle lane") are both threatened.
3. **"A drip is not a decision signal."** The Arc Agentic bullet requires Circle Agent Stack agentic behavior; a heartbeat daemon is a metered cron loop. The only genuinely agentic element (GPU-slot bidding, Scene 3) is also the biggest scope risk.
4. **Privy fails the substitution test.** Scene 4 shows "session wallet holding the drip" — any embedded wallet or raw key does this. Concerns P1 mandates all 3 sponsors LOAD-BEARING; bolted-on is disqualified by sponsor text.
5. **Worst prize EV of the top-5 finalists.** Addressable ~$7.7K vs Floatline $9K, BotTax $10.5K, Callflow $17K — and $3.5K of it is a mainnet-deploy bonus with real-funds execution risk. Directly violates P7 (prize-EV optimization).
6. **Async video weakens the WOW.** The entire climax is timed liveness ("stream freezes in <1s"). In a recorded 2-4min video, a freeze frame is trivially editable — it proves nothing to a skeptical judge the way Floatline's on-chain Scheduled Tx (HashScan-verifiable) does. Sablier/Superfluid trained judges to see "money stream keeps thing alive" as a known shape (Novel 4, lowest-tied of the pool).

## 2. PREMORTEM — Sep 14, 2026: we submitted Lifewire and LOST

**F1 — The Circle judge scored it as a quickstart extension.** Our seller daemon, buyer loop, and 402 flow diff only modestly from circlefin/arc-nanopayments; the "Agentic Economy w/ Circle Agent Stack" bullet went to a team whose agent made visible *decisions* (negotiated price, chose providers, managed budget). Ours just... paid on a timer. **Action now:** make the buyer an actual agent — budget policy, per-resource bid logic, live provider switching when price rises — and name the diff-from-starter-kit explicitly in README + video.

**F2 — The on-chain proof story cracked on camera.** Video said "per-second USDC heartbeat landing on Arc (sub-second finality receipts)" (demo-scripts L47) but the explorer showed only a Gateway deposit tx and one batch settlement of unspecified cadence. A sponsor engineer flagged the mismatch as misrepresentation; U1/P2 credibility gone. **Action now:** rewrite Scene 1 per the fact-check's honest framing — show voucher verification off-chain + deposit tx + batch settlement tx labeled as such. Never say "on-chain per-second streaming."

**F3 — Mainnet bonus attempt ate Day 4.** Real USDC on Arc mainnet, the 18-vs-6 decimal 1e12 gotcha, 20 Gwei mempool floor, mainnet Gateway config drift — deploy broke Friday night, we lost the bonus AND the testnet demo polish. **Action now:** timebox mainnet to a 3-hour spike Day 2 (Nanopayments is already mainnet-live, so it's plausible); hard fallback to testnet-only if the spike fails.

**F4 — GPU-slot bidding got cut, and with it the whole thesis.** Under deadline pressure the demo shrank to stream-on/stream-off — "Superfluid with a kill switch." Judges had seen the shape; Memorable 5 didn't survive contact with familiarity. **Action now:** treat Scene 3 (two clients outbidding for one scarce slot) as the MVP core, not the stretch goal — it's the only scene that is simultaneously agentic, novel, and load-bearing.

**F5 — Privy substitution failure cost the third prize.** Privy judge asked "what does Privy do here that a keypair doesn't?" — no answer. Realistic EV fell to ~$5K and Lifewire ended below the EV of ideas we killed. **Action now:** either make Privy genuinely load-bearing (policy-gated spending limits on the drip wallet, funding/conversion flow that qualifies for "Financial Flow" verbatim) or swap the third sponsor slot before forge locks.

## 3. RISK REGISTER

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R1 | **U6 depth structurally hollow**: enforcement is daemon-side/off-chain by primitive design; chain is not load-bearing for the kill | **CRITICAL** | Certain (it's the architecture) | Loses on "integration depth is the strategy" vs any rival with chain-enforced mechanics (cf. Floatline's Scheduled Tx) | **PARTIALLY UNMITIGABLE.** Cannot make vouchers on-chain. Best available: anchor *economic* enforcement on-chain (Gateway deposit as collateral, settlement receipts as audit trail) + honest framing. Residual risk stays. |
| R2 | Arc Agentic bullet rejected: heartbeat ≠ agent with decision signals | High | Medium-High | Loses the anchor prize; combo drops below every rival | Build real agent decisions (bidding, provider switching, budget policy); GPU auction = core scope |
| R3 | Starter-kit convergence: other teams ship the same arc-nanopayments-derived demo | High | High (repo is the sponsor's advertised path) | Uniqueness kill-list violation; judged mid-pack | Differentiate on the *scarce-resource auction* + revive semantics; state the delta from the starter kit explicitly |
| R4 | Privy fails substitution test → only 2 load-bearing sponsors | High | High | -$2.5K EV; P1 concern violated | Use Privy policies/limits + a qualifying transfer/conversion flow, or replace the sponsor slot at forge |
| R5 | Batch-settlement cadence undermines "money moved" proof in video (P2 no-mocks lens) | Medium-High | Medium | Sponsor judge scores U1 down; async video can't recover live | Show deposit tx + batch tx on explorer with timestamps; caption the settlement model honestly |
| R6 | Mainnet bonus execution failure (real USDC, decimal gotcha, 4.5-day solo window) | Medium | Medium | Lose $2.5-3.5K bonus AND burn schedule | Day-2 timeboxed spike; scripted deploy; testnet fallback pre-decided |
| R7 | Async judging deflates liveness WOW (freeze can be edited; no verifiable artifact) | Medium | Medium-High | WOW 20% facet underscores; "so what" reaction | Un-cut single-take screen recording with on-screen clock + explorer side-by-side; publish reproducible `npm run demo` |
| R8 | Sablier/Superfluid adjacency reads as derivative to non-Circle judges (finalist round) | Medium | Medium | Originality facet capped | Lead with what streams *can't* do: instant kill, revive, and slot *auctions* — position against streams explicitly |

**Explicit flag:** R1 is CRITICAL and only partially mitigable — off-chain enforcement is intrinsic to Circle Nanopayments. If the warroom weighs U6 as the dominant law (base-stack calls it "THE STRATEGY"), this alone is grounds to prefer Floatline/Callflow, whose enforcement lives in chain-native primitives. Lifewire's winning path exists only if the GPU-slot auction ships as the centerpiece, the framing follows the fact-check verbatim, and Privy is made genuinely load-bearing before forge.

## challenge — Floatline
All source material read (ideas.md §Floatline, demo script, fact_check section, base-stack §1/2/5, concerns snapshot). Adversarial pass follows.

---

## 1. STRONGEST CASE AGAINST FLOATLINE

- **It is the field's second instinct wearing institution clothes.** WILD scored it Novel 5 but crowding 1-3: "expect several trust-rail entries wearing different bond mechanics, and judges will blur them together" — and Aegis402 already finaled safe-agent-payments territory last event (transcript L441, L444). Your own concerns snapshot P4 kills "the generic agentic-payments middle lane"; Floatline sits one adjective away from it.
- **The two-sided claim is half true.** The buyer-side refund is genuinely protocol-enforced; the provider-side bond slash "quietly reintroduces a trusted SLA verdict-signer" (DEPTH, L424). WOW #2 — "the service punishes itself while its owner does nothing" — actually means *the builder's machine-checker and settlement-contract key punish it*. A sponsor engineer reading code will see the oracle, and the demo script currently says "veto-free" (Scene 4).
- **The escrow design has a live key bug surface.** The fact_check build spec gives escrow E a 1-of-2 threshold key (buyer OR contract). As written, the buyer's key alone can drain E mid-session before the provider is paid — the provider protection is unrepresented. Fixing this (contract-only spend + immutable refund schedule) is doable but it's day-1 contract work, not a footnote.
- **A third of the prize combo is unearned by the core build.** SPEC (L456): "OSS Harness $2K is not literally earned by the spec — the bullet wants a Harness PR," and the combo is "the softest at ~$9K." Judging is sponsor engineers vs. written bullets; a selected-but-unmet bullet is worse than an unselected one.
- **Two SOFT-FAILs mean the headline properties are partly self-built.** "Spending ceiling" is client-side policy you write; "HCS metering receipts" are your own TopicMessageSubmit calls (fact_check Claim 3). Both are honest-labeled hours of work, but they thin the "only Hedera can do this" U6 story — the parts that aren't Scheduled Tx are just your code.
- **The demo's centerpiece is a wait.** The whole WOW is a Scheduled Tx firing at T+expiry with seconds of jitter, inside a 2-4min hard-limit video (P5) under U7's no-fabricated-state rule. And the fire is best-effort "first available consensus time after expiry" — off-camera jitter can wreck a take.
- **62-day max horizon + all-sigs-at-create caveat** cap the institution story: floats can't outlive `scheduling.maxExpirationFutureSeconds`, and a mis-armed schedule (sigs incomplete at create) expires silently without refunding — the exact failure the product exists to prevent.

## 2. PREMORTEM — "It is Sep 14, 2026. We submitted Floatline and LOST."

**A. The blur.** Three other Hedera x402 entries shipped escrow/bond/refund rails. The judge's fifth "safe agent payments" demo of the day opened with a wallet and a spending ceiling; by the time the dead-wallet refund fired at 1:40, Floatline was already filed as "another Aegis402." *Action: the dead-wallet refund must be the first 30 seconds, not Scene 3. Name the differentiator out loud: "this is not an escrow — no keeper, no server, no multisig; the network itself is the counterparty," and put the pre-armed schedule's HashScan entity ID on screen for the engineer to verify independently.*

**B. The countdown killed the video.** T+120s of dead air was time-lapsed; the sponsor engineer couldn't verify no off-screen keeper fired, and the cut read as fabricated state (U7). The re-record with a real-time wait blew the 4-minute hard cap. *Action: arm the schedule at T+60-75s, single continuous take, HashScan consensus timestamps visible, and fill the wait by building the provider-bond side on camera — the wait becomes the narration window, not dead air. Publish schedule ID in README so judges can re-derive it.*

**C. Q&A unmasked the verdict-signer.** The submission claimed "the provider cannot veto"; the engineer found the SLA checker was a script on the builder's laptop holding the settlement key, and docked the entire entry for overclaim — integrity damage bled into the bullets that WERE earned. *Action: surface it honestly (DEPTH called this fixable-if-surfaced). Label bond-slash "v1: deterministic schema/latency check, inputs + verdict published to HCS pre-settlement, checker replaceable" and never say veto-free about the bond side. Keep the veto-free claim exclusively on the buyer refund, where it's true.*

**D. The escrow contract ate day 3.** Per-session account creation + threshold-key wiring + settlement contract turned out to be the real build; the buyer-can-drain bug surfaced in livetest, the settlement key redesign consumed the final day, and the demo was recorded against a half-wired provider side — WOW #2 was cut. *Action: lock the key design before writing app code (contract-only spend authority over E; buyer's exit is ONLY the immutable schedule), test the settlement contract first, and treat per-session account cost/latency as a measured number in the README, not a surprise.*

**E. Scope arithmetic failed.** Ceiling + HCS receipts + settlement contract + two demo arcs + Harness PR + Bazantic gateway did not fit 4 solo days; the Harness PR was skipped, but Harness stayed in the 3 selections — a claimed bullet with nothing behind it, and the addressable pool quietly fell to ~$7K. *Action: decide NOW: either the Harness PR is a real day-1 deliverable (small, concrete test-case contribution) or Harness is dropped from the 3-selection before submission. An unclaimed prize costs nothing; an unmet claimed bullet costs credibility on the other two.*

## 3. RISK REGISTER

| risk | severity | likelihood | impact | mitigation |
|---|---|---|---|---|
| Trust-rail crowding — judges blur Floatline with rival bond/escrow entries (Aegis402 precedent) | **CRITICAL** | High | Loses x402 $6K, the combo's spine | **Cannot be eliminated — rivals' existence is outside our control.** Only differentiation: lead demo with keeper-less refund, explicitly contrast vs. escrow, on-chain-verifiable schedule ID. Residual risk stays high. |
| SLA verdict-signer overclaim exposed by sponsor engineer | High | High | Integrity ding across all bullets | Honest labeling (v1 attested checker), HCS-published check inputs, restrict "veto-free" to buyer side only |
| Escrow key design bug (buyer-OR-contract 1-of-2 lets buyer drain E; contract bug strands float) | High | Medium | Provider side broken; late rework cascade | Redesign day 1: contract-only spend key, buyer exit = immutable schedule only; contract tests before app code |
| Demo timing — expiry wait vs. 2-4min cap vs. U7 no-fabrication; execution jitter off-camera | High | Medium | Centerpiece WOW fails or reads faked | Short expiry (60-75s), single take, narrate during wait, HashScan timestamps in frame, rehearse for jitter |
| Harness $2K bullet unearned (wants an actual PR the core build doesn't produce) | Medium | High | Selected bullet unmet; combo drops to ~$7K; credibility hit | Binary decision at checkpoint: real PR in days 1-2 or drop Harness from the 3 selections |
| Scope overrun — ceiling + HCS receipts + contract + 2 demo arcs solo in ~4 days (two SOFT-FAILs are self-build items, not forks) | Medium | Medium | Provider-bond arc or polish cut | Sequence: buyer-refund arc is the non-negotiable core; bond arc is severable; cut Bazantic before cutting either |
| Silent schedule expiry (sigs not complete at ScheduleCreate → refund never fires) | Medium | Low | The product's core promise fails invisibly | Assert schedule state via mirror node at session-open; refuse session if schedule isn't fully signed & armed |
| Self-adjacency to builder's forbidden shapes (Verdikt dispute / Backstop guardian territory) | Low | Low | Narrative staleness, not DQ (external judges don't know) | Frame as clearing infrastructure (float + bond), never "dispute resolution" or "guardian" language |

**Explicit CRITICAL-and-unmitigable finding:** row 1. The "secretly modal" crowding is the one risk no amount of building fixes — if two-plus rival trust rails submit against the same $6K bullet, Floatline wins only by being *demonstrably* the one whose guarantee is network-enforced rather than code-trusted. Every mitigation in this register ultimately serves that single distinction; if the demo fails to make it land in the first 30 seconds, nothing downstream recovers it.

## V2 generation_parallel — G5 (clean-room) FULL RETURN
**Backstop (World Human-Rate-Limit Faucet)** | mechanism: a public good where each proof-of-human World ID unlocks a per-epoch allowance of *free* x402-paid API calls, and the World AgentKit endpoint is the ONLY gate — one human = one rate bucket, enforced on-chain via ENSv2 permissioned resolver mapping humanId→allowance node, settled gas-free on Hedera. Sybil farmers can't multiply buckets because the humanId is nullifier-unique. | why-this-chain (U6): World's single-endpoint proof-of-human+x402 fuses identity and payment in one call — no other stack lets you meter a paid API by *verified humanness* atomically. | 3-min demo: judge scans World orb-proof, gets 10 free calls, 11th reverts on-chain; a second "sybil" wallet with no human proof gets zero. | TASTE: real humanId, real revert, no seeded state. | primitive(s) adapted: none — clean-room origin | law-check: L2 (cheat = sybil multiplication, made unrepresentable by nullifier-unique node), L3 (the human-metered faucet IS the product), L11 (spectacle=live revert, high judging-weight WOW), L12 (no rival names this "human rate limit"). | prize-combo: World Selfie Check + Hedera x402 + ENS. | INTERLOCK MAP: World proof-of-human → remove it → dies because allowance can't bind to a unique human, sybils farm infinitely | ENSv2 permissioned resolver → remove it → dies because there's no tamper-proof humanId→allowance ledger a stranger can read | Hedera gas-free x402 → remove it → dies because per-call metering costs more gas than the calls are worth. | COMPOSITION NOVELTY: verified-humanness becomes a *meterable currency* for API access — the emergent capability is Sybil-proof free-tier metering.

---

**Escrowless** | mechanism: a "pay-on-proof" rail where a buyer's payment to an agent is held not in escrow but as a *conditional x402 spending ceiling* signed against a Chainlink CRE TEE handler — the agent only draws funds when the TEE attests the delivered work matches the spec hash, and the draw settles gas-free on Hedera with an HCS audit line. No third-party arbiter, no locked capital. | why-this-chain (U6): CRE's handlerInTee driving public onchain state is the only way to make "did the work happen" a trustless on-chain trigger; fused with Hedera's ceiling-based x402 it becomes release-on-attestation. | 3-min demo: agent delivers a file, TEE verifies hash match, ceiling releases exactly the earned amount live; a spec-mismatch delivery draws $0. | TASTE: real TEE handler (CLI-sim accepted), real USDC draw, real revert on mismatch. | primitive(s) adapted: none — clean-room origin | law-check: L2 (agent eats its own unpaid work if TEE says fail; cheat=claiming-without-delivery unrepresentable), L3 (release-on-attestation IS the product), L10 (agent is actor drawing its own pay), L15 (stranger verifies by submitting a bad delivery, sees $0). | prize-combo: Chainlink CRE Confidential + Hedera x402 + Arc. | INTERLOCK MAP: CRE TEE handler → remove it → dies because "work matches spec" has no trustless oracle, collapses to manual arbitration | Hedera x402 ceiling → remove it → dies because payment can't be conditionally released without locked escrow | HCS audit trail → remove it → dies because disputes have no immutable delivery record. | COMPOSITION NOVELTY: payment becomes a *function of attested outcome* rather than trust or escrow — release-on-proof replaces escrow entirely.

---

**Tollgate** | mechanism: Bazantic turns any OpenAPI spec into an x402 gateway; Tollgate wraps a *live Graph subgraph query* as that paid endpoint, so anyone can sell metered access to their own indexed on-chain data — the subgraph is the inventory, x402 is the register, and ENS names the storefront (`prices.myshop.eth` resolves to the gateway). | why-this-chain (U6): only The Graph gives NL-queryable live subgraph data, only Bazantic auto-generates the paid gateway, only ENSv2 gives the human-readable storefront address — the three compose into a data-vending-machine no single stack offers. | 3-min demo: judge queries `whale-alerts.data.eth`, pays $0.02 x402, gets live subgraph rows; unpaid query returns 402. | TASTE: real subgraph data, real paid request, real ENS resolution. | primitive(s) adapted: none — clean-room origin | law-check: L3 (the data-vending gateway IS the product), L10 (seller earns per query inside the loop), L14 (legible: pay→data, high spectacle), L15 (stranger pays and gets live rows in 60s). | prize-combo: Bazantic gateway + The Graph Composable + ENS. | INTERLOCK MAP: Graph subgraph → remove it → dies because there's no live queryable inventory to sell | Bazantic gateway-gen → remove it → dies because hand-rolling per-endpoint x402 billing is the whole friction being removed | ENSv2 resolver → remove it → dies because storefronts have no discoverable human-readable address. | COMPOSITION NOVELTY: indexed on-chain data becomes a directly *sellable metered good* — the emergent capability is a one-command data vending machine.

---

**Quorum Pay** | mechanism: a spending rail for a *team of agents* where any single payment above a threshold requires m-of-n agent co-signatures via Privy org-wallet quorum, each co-signer being a distinct World-verified human-bound agent, and the approved payment settles as an x402 draw — turning "agent spends money" into "a board of human-anchored agents votes to spend." | why-this-chain (U6): Privy's m-of-n quorum org wallets + World's human-bound agent identity are the only primitives that let a *payment* itself carry a human-quorum gate natively; x402 makes the approved spend a real metered call. | 3-min demo: agent proposes a $50 API buy, needs 2-of-3; one human-agent approves, spend blocked; second approves, x402 fires live. | TASTE: real quorum wallet, real humans approving, real spend. | primitive(s) adapted: none — clean-room origin | law-check: L2 (rogue agent can't unilaterally drain; cheat=solo-spend unrepresentable in code), L3 (human-quorum-gated agent spend IS the product), L10 (agents transact inside the loop), L12 (no rival names this shape). | prize-combo: Privy B2B + World AgentKit + Hedera/Arc x402. | INTERLOCK MAP: Privy m-of-n quorum → remove it → dies because there's no native multi-party gate on the spend | World human-bound identity → remove it → dies because co-signers could be sybil agents, quorum is meaningless | x402 draw → remove it → dies because the approved decision has no real payment to execute. | COMPOSITION NOVELTY: a payment gains a *human-quorum precondition* baked into the wallet — the emergent capability is board-governed autonomous spending.

---

**Aqua Vane** | mechanism: a single 1inch Aqua self-custodied LP balance backs a fleet of agent strategies, and each agent must *pay-to-play* via x402 to rent a slice of that shared liquidity for one SwapVM strategy run — the balance is the shared resource, x402 is the rental meter, and a Graph subgraph indexes which agent earned what so payouts are proportional to realized PnL. | why-this-chain (U6): Aqua's one-balance-backs-many-strategies is unique liquidity plumbing; renting it per-run via x402 and settling PnL from a subgraph is only possible with all three. | 3-min demo: two agents rent the same $1k Aqua balance for different SwapVM strategies, both execute, subgraph shows per-agent PnL, x402 rent deducted live. | TASTE: real Aqua balance, real SwapVM run, real subgraph PnL. | primitive(s) adapted: none — clean-room origin | law-check: L3 (liquidity-rental meter IS the product), L4 (FLOOR: Aqua load-bearing), L10 (agents earn/pay inside loop), L14 (legible PnL leaderboard spectacle). | prize-combo: 1inch Aqua + Hedera x402 + The Graph. | INTERLOCK MAP: Aqua shared balance → remove it → dies because each agent would need its own capital, killing the shared-liquidity thesis | x402 rental meter → remove it → dies because there's no way to charge for a strategy slot | Graph subgraph PnL → remove it → dies because proportional payouts have no realized-PnL source of truth. | COMPOSITION NOVELTY: liquidity becomes a *rentable metered resource* for competing agents — the emergent capability is a pay-per-run shared-liquidity exchange.

---

**Standing Order** | mechanism: recurring agent payments via Hedera Scheduled Transactions gated by a Privy async-intent policy — a human pre-authorizes an *intent* ("pay this data feed up to $5/week if it stays fresh"), a Chainlink CRE TEE checks freshness each period, and the scheduled x402 draw fires only if the condition holds. Subscriptions for agents, with a kill-switch that's a policy, not a cancel button. | why-this-chain (U6): Hedera Scheduled Txs + Privy async intents + CRE conditional attestation are the only trio that makes a *conditional recurring* on-chain payment native — no cron server, no custody handoff. | 3-min demo: schedule a weekly feed payment; week 1 feed is fresh → pays; week 2 feed is stale → CRE fails → scheduled tx auto-skips, no payment. | TASTE: real scheduled tx, real freshness check, real skipped payment. | primitive(s) adapted: none — clean-room origin | law-check: L2 (provider can't get paid for stale data; cheat=charging-for-staleness unrepresentable), L3 (conditional standing order IS the product), L10 (agent pays inside loop), L15 (stranger stales the feed, watches payment skip). | prize-combo: Hedera Scheduled Tx/x402 + Privy Financial Flow + Chainlink CRE. | INTERLOCK MAP: Hedera Scheduled Tx → remove it → dies because recurring on-chain execution needs an off-chain cron, breaking trustlessness | Privy async intent → remove it → dies because there's no human-set policy envelope authorizing the recurrence | CRE freshness attestation → remove it → dies because payment can't be made conditional on real-world data quality. | COMPOSITION NOVELTY: a recurring payment gains a *live quality precondition* per cycle — the emergent capability is a self-cancelling conditional subscription.

---

**Namespace Rent** | mechanism: an ENSv2 subname registry where each subname (`agent1.fleet.eth`) is *leased not owned* — the permissioned resolver auto-revokes the name and its Agent Text Records if the holder stops paying a per-epoch x402 rent, and a Graph subgraph shows the live occupancy map. Squatting becomes structurally impossible because non-payment reclaims the node. | why-this-chain (U6): ENSv2's Enhanced Access Control + Permissioned Resolvers are the only primitive that lets a resolver *revoke on non-payment*; fused with x402 rent it becomes a self-clearing namespace. | 3-min demo: lease `bot.fleet.eth`, it resolves + carries agent records; skip the x402 rent epoch, resolver auto-revokes live, name goes dark. | TASTE: real ENS resolution, real rent payment, real revocation. | primitive(s) adapted: none — clean-room origin | law-check: L2 (squatter loses the name on non-payment; cheat=hold-without-paying unrepresentable), L3 (leased-namespace IS the product), L11 (spectacle=live name going dark), L15 (stranger stops paying, watches node revoke in 60s). | prize-combo: ENS ENSv2 + Hedera x402 + The Graph. | INTERLOCK MAP: ENSv2 permissioned resolver → remove it → dies because a standard resolver can't revoke on a payment condition | x402 rent → remove it → dies because there's no metered payment to gate the lease on | Graph occupancy subgraph → remove it → dies because the live lease-state map has no queryable source. | COMPOSITION NOVELTY: a name becomes a *rent-conditioned lease* that self-clears on default — the emergent capability is a squat-proof self-reclaiming namespace.

## V2 generation_parallel — G3 (whitespace) FULL RETURN
I have full grounding. Let me generate the ideas. I'll target named gaps (M1/M2/M4/W1/W5/W6/P1/P3) with genuine 3+ primitive interlocks, avoiding all V1 pool ideas, seeds, and forbidden shapes.

---

**IDEA 1 — Ransom** (targets M4 + W1)
name | **Ransom** — refundable escrow-as-a-service for agent-bought work, where the payment itself is the SLA bond
mechanism | An agent pays an x402 service, but the fee lands in a Hedera ATS-tokenized escrow that holds until a delivery attestation posts to HCS within a deadline window; on timeout, `refund()` reads the HCS-notarized non-delivery and returns USDC to the payer automatically via a Scheduled Transaction. The seller only earns on proven delivery; the buyer's float is never stranded. Not a court, not a score — the money's release condition is a live-state fact, not a reputation.
why-this-chain (U6) | Only Blocky402's gas-free ceiling lets the payer fund an escrow without holding gas; only HCS gives an immutable delivery/non-delivery clock both parties trust without a third party; only Scheduled Transactions fire the refund with no keeper. Rebuild on Base → you need a keeper bot, a custom oracle for the clock, and the payer must hold gas. The composition IS the escrow.
3-min demo shape | Agent pays 2 USDC for a "generate report" service → escrow locks (visible on HCS) → seller delivers late → refund Scheduled-Tx auto-fires → payer's wallet refunded on-screen, HCS trail shows the whole clock.
TASTE lines | U1 real USDC in escrow; U2 the auto-refund firing is the 60s magic; U3 "the payment is its own insurance"; U7 demo runs the timeout live, not seeded.
primitive(s) adapted | F16 (missing-institution: escrow/refunds) fused with F29 (live-state-bound attestation — delivery clock, NOT reputation) — the attested fact is delivery-within-deadline, explicitly not agent performance.
law-check | L2 real value moves; L3 escrow+refund novel composition; L11 no forbidden shape (not a court — no arbiter, release is deterministic on a clock); L12 no team reads "refundable escrow bound to HCS delivery clock with Scheduled-Tx auto-refund" from the prize page.
prize-combo | Hedera x402 $6K + Hedera ATS $6K + (Hedera OSS Harness $2K if packaged forkable) = $12–14K; LOW-MED crowding (M4 is empty).
INTERLOCK MAP |
- Blocky402 gas-free x402 → remove it → payer must hold HBAR gas to fund escrow; the "agent with only USDC" flow dies.
- Hedera HCS → remove it → no trustless, timestamped delivery/non-delivery record; the refund condition becomes an off-chain claim nobody can verify → dies.
- Hedera Scheduled Transactions → remove it → refund needs a keeper the buyer must trust to actually fire → the "no counterparty risk" claim dies.
- Hedera ATS (ERC-1400 controlled escrow token) → remove it → escrow custody has no compliant transfer-restriction/hold semantics; funds aren't provably locked → dies.

COMPOSITION NOVELTY | An escrow that refunds itself the instant a delivery deadline lapses — with zero keeper, zero arbiter, and a payer who never holds gas — exists only because a gas-free receipt funds an ATS-held escrow whose release/refund is a Scheduled-Tx reading an HCS delivery clock.

---

**IDEA 2 — Backstock** (targets M4 — agent working capital / float)
name | **Backstock** — a just-in-time credit line that fronts an agent the USDC to pay an x402 invoice it can't yet afford, repaid from the agent's next inbound receipt
mechanism | An agent hits a paywall but its balance is short. Backstock advances the exact shortfall as a gas-free Blocky402 payment to the service, records the loan + repayment terms as an HCS-notarized note, and takes a first-lien on the agent's next inbound x402 receipt (routed through a splitter that repays Backstock before the agent). The Graph indexes each agent's live inbound-cashflow so the credit limit is priced off real observed revenue, not a score.
why-this-chain (U6) | Blocky402's facilitator sponsors the settlement so the advance reaches the service without the borrower ever touching gas; the splitter+facilitator payTo binding makes first-lien repayment non-custodial and un-skippable; The Graph is what makes underwriting possible — the limit derives from indexed real cashflow. Swap any leg → either the borrower needs gas, the lender can be stiffed, or the credit is unpriceable.
3-min demo shape | Agent tries to pay 5 USDC service, has 2 → Backstock fronts 3 (HCS note) → agent completes job, earns 10 USDC inbound → splitter auto-repays 3+fee to Backstock first, agent keeps 7 → Graph dashboard shows limit rising with observed revenue.
TASTE lines | U1 real USDC advanced + repaid; U2 the "can't afford → now can → auto-repaid" arc in 60s; U3 credit for agents priced on live cashflow; U7 repayment fires from a real second job, not seeded.
primitive(s) adapted | F16 (missing-institution: credit-into-float) + F13 (splitter payTo binding for lien) + The Graph as underwriting oracle.
law-check | L2 real money; L3 lending composed with cashflow-indexing is novel; L11 not a forbidden shape (not a treasury loop / not trust-scoring — it's undercollateralized float priced on cashflow); L12 nobody independently builds "x402 payday-advance with first-lien on next receipt."
prize-combo | Hedera x402 $6K + The Graph Composable $5K + Hedera ATS $6K (the loan note as an ATS instrument) = $17K; LOW crowding.
INTERLOCK MAP |
- Blocky402 gas-free x402 → remove it → the borrower must hold gas to receive/spend the advance; the "broke agent gets fronted" premise dies.
- Splitter with facilitator-verified payTo → remove it → repayment relies on the borrower voluntarily paying back → lender has no lien → dies.
- The Graph (inbound-cashflow subgraph) → remove it → no way to price a limit on real revenue; underwriting collapses to a guess or a forbidden score → dies.
- HCS → remove it → the loan terms/repayment aren't notarized; disputes have no ground truth → dies.

COMPOSITION NOVELTY | Undercollateralized working capital for agents — advanced gas-free and force-repaid from the borrower's very next receipt at a limit priced off its live indexed cashflow — is a lending primitive that only exists when a facilitator-bound splitter meets a cashflow subgraph.

---

**IDEA 3 — Aftermarket** (targets M1 + inverts SEED-A's day-1-buyer weakness via real mechanism change)
name | **Aftermarket** — a bonding-curve primary market where the thing being sold is a *prepaid, transferable claim on future x402 calls* to a service
mechanism | A service mints ATS-tokenized "call credits" sold on a bonding curve. Buying a credit is a real prepayment (USDC in); redeeming one is a gas-free Blocky402 call to the service (credit burned, HCS-notarized). Unused credits are freely resellable on the curve, so the day-1 buyer is a *user who wants cheaper future calls*, not a speculator — the demand sink is intrinsic. The Graph indexes redemption velocity so the curve price tracks real usage.
why-this-chain (U6) | ATS gives the credit compliant transfer + supply semantics; Blocky402 makes redemption a gas-free call so credits are usable by gas-less agents; HCS notarizes mint/burn so supply can't be inflated; the curve+redemption binding is the mechanism. This directly fixes Callflow's "who buys the token?" — here the buyer buys *usage*, and the mechanism (prepay→redeem→resell) is genuinely different from a revenue-share dividend token.
3-min demo shape | Buy 10 call-credits on curve (USDC in, price ticks up) → agent redeems 3 via gas-free calls (burns, HCS log) → resell 2 credits back to curve → Graph shows redemption velocity driving price.
TASTE lines | U1 real prepay + real redemption; U2 buy→use→resell loop visible in 60s; U3 "prepaid API calls as a liquid instrument"; U4 explicitly NOT the revenue-dividend shape.
primitive(s) adapted | F35 (money-in-motion rails) + F13 (metered redemption) — mechanism change from SEED-A: sell *usage claims* on a curve, not *revenue shares*.
law-check | L2 real USDC; L3 prepaid-credit-as-bonding-curve-asset is novel; L11 clean; L12 unlikely independent build.
prize-combo | Hedera ATS $6K + Hedera x402 $6K + Graph Composable $5K = $17K; LOW-MED (distinct enough from SEED-A to not collide).
INTERLOCK MAP |
- Hedera ATS → remove it → the credit has no compliant fixed-supply transferable representation; resale/curve integrity dies.
- Blocky402 gas-free x402 → remove it → redeeming a credit requires gas; gas-less agents can't actually use their prepaid calls → the product's point dies.
- HCS → remove it → mint/burn supply is unauditable; the curve can be gamed by phantom credits → dies.
- The Graph (redemption-velocity subgraph) → remove it → curve price can't track real usage; it becomes a blind pump → the "priced on usage" claim dies.

COMPOSITION NOVELTY | A liquid, resellable prepayment on a service's future calls — where owning the asset means owning *usage* and redeeming it is a gas-free call — only emerges when an ATS supply-controlled credit is burned through a Blocky402 redemption and priced off an indexed velocity feed.

---

**IDEA 4 — Provenance Toll** (targets M1 + P1 + P3)
name | **Provenance Toll** — a metered data pipeline where every downstream consumer's payment auto-splits to the *upstream indexers whose rows it actually touched*
mechanism | A composite data service answers agent queries by joining rows from multiple upstream subgraphs. Each answer carries a proof of *which upstream rows were read* (content-addressed row set). The agent pays gas-free per query via Blocky402; the fee routes through a splitter that pays each upstream subgraph operator in proportion to rows-touched, notarized on HCS. Attribution is row-level, not flat — porting the takegraph content-addressing insight into the indexing-billing domain (P3).
why-this-chain (U6) | The Graph is the upstream supply being metered and must be load-bearing (the rows are subgraph rows); Blocky402 makes per-query payment gas-free so the toll is frictionless; the splitter binds payment to attribution non-custodially; HCS makes the row-attribution auditable so operators trust the split. Remove The Graph → nothing to attribute; remove the splitter → the toll can't reach upstreams honestly.
3-min demo shape | Agent asks a cross-subgraph question → answer returns with row-provenance → 1 USDC query fee auto-splits 0.6/0.4 to the two subgraph operators by rows-touched → HCS shows the attribution → change the query, split ratio changes live.
TASTE lines | U1 real per-query payments + real splits; U2 the live-changing split by rows-touched is the wow; U3 "data pipelines that pay their sources by the row"; U6 Graph is the metered substrate itself.
primitive(s) adapted | F13 (citation-toll → row-toll) + F24 (content-addressing insight ported to indexing billing, P3) + attribution splitter.
law-check | L2 real money; L3 row-level attribution billing is novel vs flat metering; L11 clean; L12 not independently modal.
prize-combo | The Graph Composable $5K + Hedera x402 $6K + The Graph AI $5K (if the join is agent-driven) — pick 3 ≤ cap: Graph Composable $5K + Hedera x402 $6K + Hedera ATS $6K (operator shares as ATS) = $17K; LOW crowding.
INTERLOCK MAP |
- The Graph (multi-subgraph rows) → remove it → there are no attributable upstream sources; row-level split has nothing to split → dies.
- Blocky402 gas-free x402 → remove it → per-query micropayment needs gas each call; the metered toll becomes unusable → dies.
- Splitter (facilitator payTo-bound) → remove it → the toll operator can skim instead of paying upstreams; honest attribution dies.
- HCS → remove it → row-attribution proof is an unverifiable claim; operators won't trust the split → dies.

COMPOSITION NOVELTY | A data service that pays its upstream indexers *by the exact rows each answer touched* — provably and gas-free — only exists when content-addressed row-provenance drives a facilitator-bound splitter over Graph subgraph reads, audited on HCS.

---

**IDEA 5 — Quorum Toll** (targets W6 + M1)
name | **Quorum Toll** — an x402 service whose *price and authorization to pay* are set by a real org's m-of-n approval, encoded as the payment condition
mechanism | An org runs agents that buy data/compute. Instead of the agent paying freely, each x402 invoice above a threshold requires a Privy m-of-n quorum intent to co-authorize before the gas-free Blocky402 payment settles; the approval + the payment are both notarized on HCS as a matched pair. Below-threshold calls flow automatically (policy engine); above-threshold "agent proposes, humans approve." The org's spend governance IS the payment gate.
why-this-chain (U6) | Privy quorum/intents are the authorization primitive (load-bearing, not a login); Blocky402 is what lets the approved payment settle gas-free the instant quorum clears; HCS is the matched approval↔payment audit institutions need. Remove Privy → no real org governance, it's a solo wallet; remove Blocky402 → approved payment needs gas; remove HCS → no proof the payment matched an approval.
3-min demo shape | Agent proposes a 50 USDC data buy → Privy quorum (2-of-3) approves on screen → gas-free payment settles → HCS shows approval+payment paired; then a below-threshold 1 USDC call flows with no approval (policy) → show an over-threshold attempt blocked without quorum.
TASTE lines | U1 real USDC + real quorum; U2 the propose→approve→settle→audit chain in 60s; U3 "org treasury governance as an x402 precondition"; U6 Privy load-bearing as authorization not auth.
primitive(s) adapted | F12 (attenuated delegation — approval attenuates spend authority) + F16 (institution: org spend clearing) — distinct from Backstop (this is approval-at-grant/quorum, not co-sign-review-at-execution firewall).
law-check | L2 real money; L3 quorum-gated x402 is novel; L11 NOT the guardian-co-signer shape — quorum authorization is a capability grant, not a per-tx LLM firewall review; L12 not modal.
prize-combo | Privy B2B $2.5K + Hedera x402 $6K + Hedera ATS $6K (spend budget as ATS instrument) = $14.5K; LOW crowding (W6 named-thin).
INTERLOCK MAP |
- Privy m-of-n quorum + intents → remove it → there's no real multi-human org authorization; it collapses to a solo wallet (banned modal shape) → dies.
- Blocky402 gas-free x402 → remove it → the approved payment needs the org to hold gas per settlement; the "approve → it just pays" flow dies.
- HCS → remove it → no immutable proof a given payment matched a given approval; the compliance/audit value (the whole B2B point) dies.
- Privy policy engine (below-threshold auto-flow) → remove it → every micro-call needs a quorum, making the system unusable → the "governed but frictionless" claim dies.

COMPOSITION NOVELTY | An x402 payment that only settles when a real org's m-of-n quorum has co-authorized it — and self-audits the approval↔payment pairing — is org-treasury governance welded to a payment rail, possible only when Privy intents gate a gas-free Blocky402 settlement notarized on HCS.

---

**IDEA 6 — Redline** (targets W3 + W9 + M4 — inverts "agent pays API" into "agent earns from a strategy")
name | **Redline** — agents rent slices of one shared 1inch Aqua LP balance to run their own trading strategies, paying per-fill via x402, with profits streamed back through a splitter
mechanism | One self-custodied Aqua LP balance backs many SwapVM strategy programs, each authored/operated by a different agent. An agent doesn't deposit capital — it *rents execution capacity* against the shared balance, paying a gas-free per-fill x402 toll; realized PnL routes through a splitter that returns principal-share to the LP owner and profit-share to the strategist agent. Capital efficiency (one balance, many agent strategists) is the headline; the toll makes it sustainable.
why-this-chain (U6) | Aqua's one-balance-many-strategies is the hard guarantee being hand-rolled (F25) and is the entire point — no other rail lets many strategies safely share one self-custodied balance; SwapVM is where the agent's strategy actually executes; x402+splitter is how rent+profit-share settle without the agent pre-funding. Remove Aqua → you're back to per-agent capital (kills the efficiency story); remove SwapVM → no place to run the custom strategy.
3-min demo shape | LP owner funds one Aqua balance → two agent strategies run against it → fills execute in SwapVM → each fill pays a gas-free toll → a profitable close streams profit-split to the strategist, principal back to LP owner → show one balance safely backing both.
TASTE lines | U1 real swaps on Aqua + real tolls; U2 "one balance, two agents trading, both settle" in 60s; U3 capital-efficient agent strategist market; U6 Aqua load-bearing at protocol level.
primitive(s) adapted | F25 (sponsor's-hardest-guarantee: Aqua one-balance) + F13 (per-fill toll) + F16 (institution: strategist labor market / float).
law-check | L2 real DeFi value; L3 rented-capacity-on-shared-LP is novel; L11 clean (not a copy-trade terminal — it's shared-balance rental); L12 W3/W9 are named-thin, unlikely independent build. NOTE: Aqua = 2h+ Solidity ramp per constraints — flagged as the build risk.
prize-combo | 1inch Aqua $5K + Hedera x402 $6K (toll rail) + Arc DeFi $1.67K (USDC settlement) = $12.7K; LOW crowding (W3 best $-per-competitor).
INTERLOCK MAP |
- 1inch Aqua (one balance, many strategies) → remove it → each agent needs its own capital; the capital-efficiency headline and the whole product die.
- 1inch SwapVM (composable strategy programs) → remove it → agents have no venue to author/run custom strategies against the shared balance → dies.
- x402 gas-free toll + splitter → remove it → agents must pre-fund fees and profit-share is manual/trust-based → the rental economics die.
- Arc USDC finality → remove it → profit/principal settlement lacks fast final USDC receipts as the audit artifact → the "provably settled" claim weakens to death.

COMPOSITION NOVELTY | A market where many agents run their own strategies against *one* shared LP balance — renting execution rather than posting capital, and settling rent+profit atomically — exists only because Aqua's shared-balance guarantee meets SwapVM strategy programs meets a per-fill x402 splitter.

---

**IDEA 7 — Namespace Toll** (targets W7 + M2 — accountability via capability, not score)
name | **Namespace Toll** — a paid agent service where the *right to be paid* is a parent-scoped ENSv2 child namespace that can be revoked, and revocation instantly halts settlement
mechanism | A service operator issues each sub-agent a parent-scoped ENSv2 child name (Enhanced Access Control) carrying Agent Text Records that encode its allowed methods + payTo. The x402 facilitator resolves the child name at pay-time: payment only settles to the payTo the *currently-valid* namespace record authorizes. If the parent revokes/attenuates the child (misbehavior, expiry), the very next payment fails closed — accountability is enforced by capability revocation, not a reputation score. HCS notarizes each resolve→settle.
why-this-chain (U6) | ENSv2 Enhanced Access Control + Agent Text Records are the capability substrate (load-bearing — the payTo authority lives in the resolvable, revocable record); Blocky402 resolves-then-settles gas-free so revocation bites at the payment layer; HCS proves which namespace state authorized which payment. Remove ENSv2 → no revocable parent-scoped authority; remove Blocky402 → revocation can't gate settlement gas-free.
3-min demo shape | Sub-agent earns via valid child name (payment settles) → parent revokes/attenuates the child name on ENSv2 → next identical payment *fails closed* live → HCS trail shows the authorized vs denied resolve.
TASTE lines | U1 real payments gated by real ENS records; U2 revoke-then-payment-fails-closed in 60s; U3 "your right to be paid is a revocable namespace"; U6 ENSv2 load-bearing as pay-time authority.
primitive(s) adapted | F12 (attenuated delegation — namespace capability narrows/revokes) + F13 (x402 settlement) + M2 solved via capability-revocation not scoring.
law-check | L2 real money; L3 pay-time namespace resolution as settlement gate is novel; L11 NOT trust-scoring/registry — accountability is binary capability revocation, a genuinely different load-bearing primitive per M2's caution; L12 W7 named-fresh, unlikely independent.
prize-combo | ENS ENSv2 $4.5K + Hedera x402 $6K + Hedera ATS $6K (payTo as controlled instrument) = $16.5K; LOW-MED crowding.
INTERLOCK MAP |
- ENSv2 Enhanced Access Control + Agent Text Records → remove it → there's no revocable, parent-scoped, resolvable payTo authority; accountability reverts to a score (forbidden) → dies.
- Blocky402 gas-free x402 (resolve-at-pay-time) → remove it → revocation can't be enforced at the settlement moment gas-free; the "next payment fails closed" magic dies.
- HCS → remove it → no proof of which namespace state authorized which payment; the audit that makes revocation credible dies.
- ENSv2 hierarchical parent→child scoping → remove it → any child could self-authorize; the "parent controls the child's right to be paid" mechanism dies.

COMPOSITION NOVELTY | Making an agent's *right to be paid* a live, parent-revocable ENS namespace — so revoking the name instantly halts settlement — turns accountability into capability instead of reputation, and only works when a facilitator resolves the child name at pay-time gas-free and notarizes each decision on HCS.

## V2 generation_parallel — G1 FULL RETURN
I have all context. My slice: PAIN + DEEP INTERLOCK. Quoted community complaints from g1.md are the seed; each idea must solve one quoted pain via a genuine ≥3-primitive interlock. Generating 6-8 conforming ideas now.

---

**1. Kilowire — the x402+MCP async-payment middleware that ships as a *live paid data faucet*, not a template**
| field | value |
|---|---|
| **mechanism** | Solves quoted pain A1 (#903: *"no example showing how to wire x402 middleware with an MCP server so that tool calls only proceed after a confirmed HBAR micropayment... async LangGraph ReAct loop"*). The build is a real MCP server whose every tool call is a Blocky402-gated request: the agent signs a spending ceiling, the MCP middleware suspends the tool-call promise until the Blocky402 facilitator returns a confirmed-settlement webhook, then resumes the ReAct loop with the paid result. The "consumer of the infra" (C-IN1) is a working paid tool: a Graph Token-API-backed price/liquidity oracle the agent pays per call. So it is simultaneously the missing pattern (#903/#892/#1007) AND a real service worth paying for (W1/M1). |
| **why-this-chain (U6)** | Only Blocky402's gas-free *ceiling* model lets the MCP middleware hold a call open and resume on async settlement without the payer holding HBAR gas — port to Base/Solana x402 and the payer must pre-fund gas and the "confirm-then-resume" callback shape (the exact #903 gap) doesn't exist. |
| **3-min demo shape** | Terminal: agent gets a tool call, middleware prints "PAYMENT PENDING → ceiling signed", Blocky402 confirms, tool returns Graph-indexed liquidity, ReAct loop continues. Then a second call *over ceiling* → structured 402 refusal, loop halts. HCS explorer shows both events notarized. |
| **TASTE lines** | U2: judge watches payment gate a real tool call in 60s. U6: gas-free ceiling is load-bearing. C-IN1: the consumer (price-oracle tool) is live. |
| **primitive(s) adapted** | F19 (payment-rail-native tooling, anchored on the literal #903 gap) + F13 (per-call metering) as the consumer. |
| **law-check** | L2 real settlement ✓; L3 async-resume novelty ✓; L11 middleware+consumer both real ✓; L12 cold-pass — teams see the #903 issue but few ship the async-resume-in-ReAct pattern with a live Graph-backed consumer ✓. |
| **prize-combo** | Hedera x402 $6K + Hedera OSS Harness $2K (ship it as a forkable harness — the $2K pot literally wants this) + Graph Token API composable $5K = $13K. Low crowding (sponsor-admitted gap). |
| **INTERLOCK MAP** | 1. **Blocky402 gas-free ceiling** — remove it → the async confirm-then-resume MCP flow is impossible (payer needs gas, no ceiling-suspend semantics); this IS the #903 fix. 2. **MCP async middleware (suspend/resume)** — remove it → it's just a REST call, the ReAct-loop-gating pattern (the quoted pain) vanishes. 3. **Graph Token API consumer** — remove it → no real service worth paying for; degrades to an empty payment demo (C-IN1 fail). |
| **COMPOSITION NOVELTY** | A ReAct agent loop that *cannot advance a tool call until an on-chain micropayment settles* — the settlement webhook becoming the promise-resolver — exists only when Blocky402's ceiling model, MCP's async tool protocol, and a live paid Graph consumer compose; none of the three alone produces "a paid tool call that blocks the agent's reasoning until money moves." |

---

**2. Tollgraph — Bazantic-generated x402 gateways whose per-unit prices are set by *live Graph subgraph demand*, audited on HCS**
| field | value |
|---|---|
| **mechanism** | Aims at pain A1 (Hedera "still short of actual paid services") + Bazantic having *no public quickstart*. You feed an OpenAPI spec into Bazantic → auto-generated x402 gateway; but the gateway's per-endpoint price is not static — a Graph subgraph indexes recent paid-call volume per endpoint and a pricing function raises price on hot endpoints / lowers on cold ones (surge metering). Every price change + every paid call is notarized on HCS so buyers see an honest, tamper-evident price history. Turns a spec into a *self-pricing* paid API. |
| **why-this-chain (U6)** | Bazantic's spec-to-gateway is the only primitive that turns an arbitrary OpenAPI doc into an x402 rail with zero handwritten middleware; HCS is the only cheap-enough log for per-call notarization; remove either and you're hand-rolling a gateway + a database (no longer "spec in, honest self-pricing service out"). |
| **3-min demo shape** | Paste a weather OpenAPI spec → Bazantic emits gateway. Fire 20 agent calls at endpoint /forecast → Graph subgraph reindexes → price ticks up live on a dashboard → HCS explorer shows the price-change + call receipts. Cold endpoint price drops. |
| **TASTE lines** | U3: "spec → self-pricing audited API in one paste" is unseen. U6: Bazantic+HCS both load-bearing. C-IN1: agent caller is the live consumer. |
| **primitive(s) adapted** | F19 (spec-to-gateway, the newest Bazantic primitive) + F13 (per-unit metering with a demand-driven clamp) + F29 (HCS as live-state-bound price attestation). |
| **law-check** | L2 real x402 flow ✓; L3 demand-priced gateway novelty ✓; L11 gateway + subgraph + audit all real ✓; L12 — Bazantic has no quickstart so almost nobody ships anything on it, let alone demand-pricing ✓. |
| **prize-combo** | Bazantic gateway $1K + Hedera x402 $6K + Graph AI/composable $5K = $12K. Very low crowding (Bazantic near-empty). |
| **INTERLOCK MAP** | 1. **Bazantic spec-to-gateway** — remove it → you're hand-writing an x402 server, the "any spec becomes a self-pricing service" thesis dies. 2. **Graph demand subgraph** — remove it → price is static, the surge-metering mechanism (the whole novelty) is gone. 3. **HCS notarization** — remove it → price changes are unverifiable, buyers can't trust the meter; the honest-pricing claim collapses. |
| **COMPOSITION NOVELTY** | An API gateway that *reprices itself from its own on-chain demand and proves the repricing is honest* emerges only when Bazantic's generation, a Graph demand index, and HCS audit compose — none alone yields "paste a spec, get a tamper-evident surge-priced paid service." |

---

**3. Aquawright — one Aqua LP balance that pays *itself* into rebalances via x402, with fee-on-transfer detection baked into the SwapVM program**
| field | value |
|---|---|
| **mechanism** | Aims squarely at pain A1/B2 (Aqua issue #26: *"updates internal balances by the requested amount then performs the ERC20 transfer without verifying the actual amount moved... internal accounting diverges from real wallet balances"* for fee-on-transfer tokens). Build a SwapVM strategy program that (a) measures actual received amount post-transfer and refuses the strategy step if it diverges (fixing #26 as a *feature*), and (b) an agent strategist pays per-rebalance-decision via x402, where the strategy fee is drawn from the single Aqua LP balance itself. Consumer = an agent that continuously restrategizes the one balance across two SwapVM strategies. |
| **why-this-chain (U6)** | Aqua's "one self-custodied LP balance backing many strategies" is the only place where a single balance can be an agent's working capital across strategies AND pay its own strategist; SwapVM is the only venue where you can encode the balance-delta-verification guard at program level. Port off Aqua → you lose both the shared-balance economics and the protocol-level guard. |
| **3-min demo shape** | Agent proposes rebalance → SwapVM program checks measured-received vs requested → on a fee-on-transfer token, it *reverts before transfer* (shows #26 fixed live); on a clean token, executes, and x402-pays the strategist fee from the LP balance. Dashboard shows one balance, two strategies, honest accounting. |
| **TASTE lines** | U3: "the AMM that refuses to lie about your balance" ✓. U6: SwapVM guard load-bearing. C-DF1: real tokens move on Aqua. |
| **primitive(s) adapted** | F25 (sponsor's-hardest-guarantee: one balance safely backing many strategies, protocol-level) + F13 (per-decision x402 metering) + F09 capital-efficiency angle (W9). |
| **law-check** | L2 real Aqua tokens ✓; L3 fee-on-transfer guard is a novel protocol fix ✓; L11 SwapVM program + agent both real ✓; L12 — Aqua is 6 weeks old, 88 open issues, almost nobody navigates SwapVM correctly, let alone fixes #26 ✓. |
| **prize-combo** | 1inch Aqua $5K + 1inch continuity $2K (extend the open Aqua repo, addressing #26) + Chainlink CRE liquidation-challenge $0.5K OR Graph $5K = $10-12K. Very low crowding (W3). |
| **INTERLOCK MAP** | 1. **Aqua single LP balance** — remove it → no shared working-capital-that-pays-its-own-strategist; degrades to a normal vault. 2. **SwapVM program-level balance-delta guard** — remove it → #26 stays broken, the "AMM that can't lie" headline (the whole pain-fix) is gone. 3. **x402 strategist fee from the balance** — remove it → the agent strategist isn't paid from the primitive it manages; the self-funding capital-efficiency story collapses. |
| **COMPOSITION NOVELTY** | An LP position that verifies its own settled deltas at the VM level *and* pays its managing agent out of the very balance it rebalances is possible only when Aqua's shared-balance model, a SwapVM correctness guard, and x402 self-payment compose — no single primitive gives "a self-funding, self-auditing liquidity position." |

---

**4. Provewire — a Chainlink CRE Confidential workflow that turns a *paid* private computation into public state, settled x402, with a determinism self-proof**
| field | value |
|---|---|
| **mechanism** | Aims at pain B3 (CRE trust gap: simulation *"cannot detect non-determinism or multi-node consensus failures... passing simulation does not imply production safety"*). Build a `handlerInTee` workflow that runs a private scoring computation (e.g. private creditworthiness over a buyer's own supplied data) and writes only the pass/fail to public onchain state. The novelty answering the pain: a *determinism harness* that runs the handler across multiple simulated nodes and refuses to publish if outputs diverge — surfacing the exact non-determinism the community says simulation misses. The buyer pays x402 to invoke the private scoring; result gates a real on-chain action. |
| **why-this-chain (U6)** | Only CRE's `handlerInTee` lets private logic drive public state with TEE attestation; the determinism-consensus check is meaningful only in CRE's multi-node model. Port to a plain TEE and you lose the multi-node consensus surface that IS the quoted gap. |
| **3-min demo shape** | Buyer x402-pays → private data enters TEE → handler scores → determinism harness runs N nodes → identical → publishes pass to chain, unlocking action. Then inject a non-deterministic branch → harness catches divergence → *refuses to publish* (shows the B3 gap closed live). |
| **TASTE lines** | U2: pass/fail flips on-chain in 60s. U3: "the CRE workflow that catches the non-determinism simulation can't" ✓. U6: handlerInTee load-bearing. |
| **primitive(s) adapted** | F02 (private execution → atomic public settlement, axis-shifted to CRE TEE per P2) + F25 (sponsor's-hardest-guarantee: private-logic-drives-public-state) + F13 (x402-metered invocation). |
| **law-check** | L2 real on-chain state write ✓; L3 determinism-harness is a genuine answer to a quoted gap ✓; L11 TEE handler + x402 caller both real ✓; L12 — CRE Confidential is private beta, zero complaint corpus, first-mover ✓. |
| **prize-combo** | Chainlink CRE Confidential $2K + Chainlink continuity $0.5K + Hedera x402 $6K (payment leg) = $8.5K. Very low crowding (W4). |
| **INTERLOCK MAP** | 1. **CRE handlerInTee** — remove it → private logic can't drive public state with attestation; the confidential-scoring product is impossible. 2. **Multi-node determinism harness** — remove it → the B3 pain (non-determinism undetected) is unaddressed; degrades to a generic TEE demo. 3. **x402-metered invocation** — remove it → the private computation isn't a *paid* service (M1/C-IN1 fail); no live consumer. |
| **COMPOSITION NOVELTY** | A paid private computation that *proves it's deterministic across nodes before it's allowed to touch public state* exists only when CRE's TEE handler, a multi-node determinism gate, and x402 metering compose — none alone yields "a confidential paid workflow that fails closed on the exact bug simulation misses." |

---

**5. Namewire — ENSv2 permissioned agent namespaces where a parent x402-*sells* scoped child capabilities, revocable via Enhanced Access Control**
| field | value |
|---|---|
| **mechanism** | Aims at pain B2 (ENSv2 whiplash: Namechain dead, stale docs assume L2; uses *only* canonical ENSv2 Sepolia). A parent name (`fleet.eth`) mints child subnames (`worker1.fleet.eth`) whose Agent Text Records encode a *scoped, paid* capability (e.g. "may call oracle X, budget Y"). The agent pays x402 to *acquire* the capability subname; the parent can revoke via Enhanced Access Control the instant misuse is detected. A permissioned resolver enforces that only the paying holder resolves the capability record. Attenuation: each re-delegated child can only narrow the parent's grant. |
| **why-this-chain (U6)** | ENSv2's hierarchical registries + Enhanced Access Control + Permissioned Resolvers + Agent Text Records are the only stack where a name IS a revocable, scoped, paid capability; port off ENSv2 and you're building a bespoke ACL contract with no naming/resolution layer. |
| **3-min demo shape** | Parent lists a capability subname → agent x402-pays → subname minted with scoped Text Record → agent resolves & uses it → parent hits revoke → resolution fails, capability dead on-chain. Over-scope attempt on re-delegation → reverts. |
| **TASTE lines** | U3: "your ENS name is a purchasable, revocable agent permission" ✓. U6: Enhanced Access Control load-bearing. L11: all real on canonical Sepolia. |
| **primitive(s) adapted** | F12 (attenuated delegation / capability layer, substrate = ENSv2) + F13 (x402 to acquire the cap) — kept distinct from Backstop co-signer (narrowing-at-grant, not review-at-execution). |
| **law-check** | L2 real ENSv2 txs ✓; L3 name-as-paid-capability novelty ✓; L11 parent + agent + resolver all real ✓; L12 — ENSv2 fresh + post-Namechain confusion means few build the permissioned-agent-namespace pattern ✓. |
| **prize-combo** | ENS ENSv2 $4.5K + ENS $0.5K + Hedera/Arc x402 $6K = $11K. Med crowding on ENS, low on this exact shape (W7). |
| **INTERLOCK MAP** | 1. **ENSv2 Enhanced Access Control + Permissioned Resolver** — remove it → capabilities aren't revocable/scoped at the name layer; the product is a plain token. 2. **Agent Text Records** — remove it → no place to encode the scoped capability on the name; the "name IS the permission" thesis dies. 3. **x402 acquisition** — remove it → capabilities aren't *sold* as paid services; degrades to free ACL admin (M1 fail). |
| **COMPOSITION NOVELTY** | A subname that is simultaneously a *purchasable, scoped, instantly-revocable agent permission* exists only when ENSv2's access control, agent text records, and x402 payment compose — no single primitive delivers "buy a capability by buying a name, lose it when the parent revokes." |

---

**6. Substreamwire — a one-prompt Substreams deploy MCP that x402-meters *index-rows served*, closing the CLI-papercut pain**
| field | value |
|---|---|
| **mechanism** | Aims at pain A2 (Substreams CLI papercuts, PR #925: `substreams registry login` failing on missing `~/.config/substreams`; "authoring is hard" — The Graph's own featured challenge is one-prompt pipeline deploy). Build an MCP server that does the *complete job*: NL prompt → generated Substreams module → deploy → and the deployed stream is itself an x402-metered paid data service billing per index-row consumed. The MCP owns author→deploy→consume end-to-end (fixing the papercuts by never touching the raw CLI), and the deployed pipeline is a real paid consumer (C-IN1). |
| **why-this-chain (U6)** | The Graph's Substreams + one-prompt-deploy SKILL challenge is the only place this job exists; the deployed stream serving indexed rows is the load-bearing data primitive. Port off The Graph and there's no Substreams to author or index-rows to meter. |
| **3-min demo shape** | Type "index all USDC transfers on Base" into the MCP → it scaffolds, handles the missing-config-dir papercut silently, deploys → then an agent x402-pays and pulls 100 indexed rows, meter clamps to budget. Explorer shows the live stream + payment. |
| **TASTE lines** | U2: prompt → live paid indexed stream in one flow. U3: "author-deploy-monetize a subgraph by talking" ✓. U6: Substreams load-bearing. |
| **primitive(s) adapted** | F08 (interface-species shift: MCP owning a COMPLETE job — author→deploy→consume, not a single verb) + F13 (per-index-row metering) + F19 (x402 rail). |
| **law-check** | L2 real deploy + real x402 ✓; L3 complete-job MCP + monetized output novelty ✓; L11 MCP + deployed stream + paying agent all real ✓; L12 — the featured challenge is exactly this, but adding the x402-metered-output leg is the differentiator few will attempt ✓. |
| **prize-combo** | Graph AI-Scratch $5K + Graph composable $5K + Hedera/Arc x402 $6K = $16K. Med crowding (featured challenge draws teams — the monetized-output leg differentiates). |
| **INTERLOCK MAP** | 1. **Substreams one-prompt deploy** — remove it → no author→deploy job to own; degrades to a generic MCP. 2. **The deployed stream as index-row data source** — remove it → nothing to meter; the paid-service (C-IN1) leg dies. 3. **x402 per-index-row metering** — remove it → it's just a deploy tool, not a service worth paying for (M1 fail); loses the "monetize by talking" novelty. |
| **COMPOSITION NOVELTY** | Speaking a sentence that produces a *deployed, self-monetizing indexed data stream* is possible only when Substreams authoring, the live index-row output, and x402 metering compose — no single primitive yields "describe a pipeline, get back a paid API that bills per row." |

---

**7. Quorumwire — a Privy m-of-n org treasury where agent-proposed payments settle *only* after a World proof-of-human co-approves, over x402**
| field | value |
|---|---|
| **mechanism** | Aims at pain A1 + the M1/M2 gap (agents need real paid services with human accountability; ERC-8004 reputation is broken so use a *non-score* accountability primitive). An agent proposes an x402 payment for a service; the Privy policy engine holds it as an async intent requiring m-of-n quorum; one of the required signers must be a *World-verified human* (Selfie Check / humanId), so the "approve" is provably a unique human, not a sock-puppet key. Settlement fires over x402 only after quorum-with-a-human clears. This is "agent proposes, verified humans approve" (W6) with anti-Sybil teeth. |
| **why-this-chain (U6)** | Privy's async intents + m-of-n quorum are the only primitive that holds an agent's proposed spend pending human policy; World's proof-of-human is the only primitive making the human signer Sybil-resistant. Remove Privy → no quorum-gated intent; remove World → the "human" approvers are just more keys (the accountability is fake). |
| **3-min demo shape** | Agent proposes a $50 x402 service payment → Privy holds intent → dashboard shows "2-of-3, ≥1 human required" → a bot signer + a World-verified human sign → x402 settles. Then a Sybil tries to fill the human slot → World check fails → intent stays frozen. |
| **TASTE lines** | U3: "an agent treasury where a robot can't fake the human approval" ✓. U6: Privy quorum + World humanId both load-bearing. C-DF1: real x402 value moves. |
| **primitive(s) adapted** | F16 (missing-institution: accountable agent-payment approvals via economic/identity primitive, NOT score-based) + F12 (attenuated delegation via quorum) + F13 (x402 settlement). |
| **law-check** | L2 real x402 settlement ✓; L3 human-gated quorum-over-payment novelty ✓; L11 Privy + World + x402 all real ✓; L12 — combining Privy quorum with World-as-required-signer over an x402 intent is a specific interlock few will independently strike ✓. |
| **prize-combo** | Privy B2B $2.5K + World Selfie Check $3.5K + Hedera/Arc x402 $6K = $12K. Low-med crowding (World volume-crowded but thin on quality per prize text). |
| **INTERLOCK MAP** | 1. **Privy m-of-n async intent** — remove it → no place to hold the agent's proposed payment pending approval; the "propose→approve→settle" flow collapses to an instant spend. 2. **World proof-of-human as required signer** — remove it → approvers are unverifiable keys; the anti-Sybil accountability (the whole point vs broken ERC-8004) is gone. 3. **x402 settlement leg** — remove it → nothing is actually paid on-chain; degrades to an approval UI (C-DF1 fail). |
| **COMPOSITION NOVELTY** | A treasury where an agent's payment *cannot settle until at least one provably-unique human co-signs* emerges only when Privy's quorum intents, World's proof-of-human, and x402 settlement compose — no single primitive gives "Sybil-proof human-gated agent spend on a real payment rail." |

## V2 generation_parallel — G4 FULL RETURN
I have all context. Generating 8 conforming G4 ideas — each maximizes prize-EV × low-crowding × feasible deep interlock, with 3 sponsors passing the substitution test and composing into an emergent capability.

---

**IDEA 1 — SLABridge (Service-Level Attestation → auto-refund escrow)**
| field | content |
|---|---|
| **mechanism** | An x402-gated agent service posts a bond into a Hedera escrow at first paid call. Each per-call receipt streams into a subgraph that computes live SLA (p95 latency, success rate) from indexed HCS receipts. When measured SLA breaches the on-chain promised threshold, a Chainlink CRE `handlerInTee` pulls the buyer's private call-logs + the public subgraph aggregate, computes the breach privately (raw per-buyer logs never public), and drives an on-chain state change that slashes the bond into pro-rata refunds. Refund is enforced by the chain, not by the operator's goodwill. |
| **why-this-chain (U6)** | Blocky402 gas-free ceiling is the ONLY rail where the buyer (an agent) can pay per-call without holding native gas AND have every receipt notarized on HCS as the immutable SLA evidence the refund math reads. CRE TEE is the only way the private per-buyer logs stay confidential while still driving a public slash. Rip either out and refunds become either operator-trusted or privacy-leaking. |
| **3-min demo shape** | Live x402 agent buys 50 calls; operator's endpoint is throttled mid-demo; subgraph SLA line crosses the red threshold on screen; CRE handler fires; bond slashes; buyer's wallet receives auto-refund USDC — all HashScan-linked. |
| **TASTE lines** | U1 real refund USDC moves; U2 SLA line crossing → refund is the 60s magic; U3 "the service refunds you before you complain"; U6 above; U7 breach is induced live, not seeded. |
| **primitive(s) adapted** | F29 (live-state-bound attestation, but attested fact = SLA not reputation → escapes AlphaAttest ban) + F16 (missing institution = refund insurance for agent services). |
| **law-check** | L2 SEE the refund; L3 novel; L11 real value; L12 no team independently stacks HCS-SLA→CRE-slash→auto-refund. |
| **prize-combo (≤3)** | Hedera x402 $6K (HIGH) + Chainlink CRE Confidential $2K (LOW) + The Graph Composable $5K (MED). $13K, low collision on the CRE+SLA angle. |
| **INTERLOCK MAP** | (1) Blocky402 x402 — remove → agent can't pay per-call gas-free and no HCS receipt exists to measure SLA against; product dies. (2) The Graph subgraph over HCS receipts — remove → no live SLA aggregate to detect breach; refund can't trigger. (3) Chainlink CRE handlerInTee — remove → per-buyer breach must be computed publicly, leaking each buyer's usage; the confidential-refund guarantee dies. |
| **COMPOSITION NOVELTY** | A paid API that autonomously refunds its own buyers the instant its measured on-chain SLA breaches — an emergent "self-slashing SLA" that exists only because HCS receipts become subgraph-computable evidence and CRE privately converts that evidence into a public bond-slash. |

---

**IDEA 2 — Aqua Custody Desk (agent strategist, human-quorum LP, hardware-gated withdrawals)**
| field | content |
|---|---|
| **mechanism** | An AI agent authors 1inch Aqua/SwapVM strategy programs against ONE self-custodied LP balance. The LP balance is a Privy org wallet: the agent can *rebalance among strategies* freely (policy-scoped), but any action that *removes* capital from the Aqua balance requires an m-of-n Privy quorum whose final signer is a Ledger Key Ring hardware confirmation. So: autonomous strategy, human-approved exits, hardware-anchored withdrawal keys. |
| **why-this-chain (U6)** | Aqua's "one balance backs many strategies" is the exact primitive that makes intra-strategy autonomy safe (no capital leaves) while exits stay gated — a generic AMM has no single-balance-many-strategies notion, so the whole autonomy/exit boundary collapses. Privy intents encode the approval semantics; Ledger provides the irreversible-move root. |
| **3-min demo shape** | Agent proposes 3 SwapVM strategy shifts (auto-executes); then proposes a withdrawal → Privy quorum prompt → Ledger device blink-to-confirm → USDC exits. Show a policy-violating over-withdraw getting structurally refused. |
| **TASTE lines** | U1 real swaps on Aqua; U2 device-blink withdrawal is the WOW; U3 "autonomous but the money can't walk out without a human's hardware"; U6 above; U7 live strategy shifts. |
| **primitive(s) adapted** | F12 (attenuated delegation — agent cap narrows to rebalance-only, exits require escalation; distinct from co-signer/Backstop ban) + F25 (Aqua one-balance-many-strategies as the headline guarantee). |
| **law-check** | L2/L3/L11/L12 all pass; the exit-boundary composition is not independently modal. |
| **prize-combo (≤3)** | 1inch Aqua $5K (LOW, best $/competitor) + Privy B2B $2.5K (MED) + Ledger Agent Stack $3.5K (MED, hardware). $11K. **Feasibility flag: Ledger device unverified — Ledger swappable for Arc Agentic if no hardware.** |
| **INTERLOCK MAP** | (1) Aqua single-balance-many-strategies — remove → no autonomy/exit distinction; rebalances become withdrawals; product dies. (2) Privy org wallet + quorum/intents — remove → nothing encodes "rebalance auto, exit needs humans"; the boundary is gone. (3) Ledger Key Ring — remove → withdrawal keys live in software; the irreversible-move guarantee (the whole pitch) dies. |
| **COMPOSITION NOVELTY** | An agent that can freely re-strategize a live LP but physically cannot extract the capital without hardware-anchored human quorum — a "capital-locked-in, strategy-free" custody envelope possible only because Aqua's shared-balance model lets you gate the balance boundary while leaving strategy internals open. |

---

**IDEA 3 — Namehold (ENSv2-scoped agent spend + gas-free settlement + Graph-indexed revocation)**
| field | content |
|---|---|
| **mechanism** | Each agent gets an ENSv2 child name under an org's parent registry. Enhanced Access Control + Agent Text Records encode that agent's *spend capability* (max per-call ceiling, allowed payees) directly in the resolver. A Blocky402 facilitator READS the ENSv2 resolver record before sponsoring settlement — the name IS the spend policy. A subgraph indexes every resolver change + every x402 receipt so that revoking a child name instantly (indexed, provable) halts that agent's ability to spend. |
| **why-this-chain (U6)** | ENSv2 Enhanced Access Control is the only primitive giving *parent-scoped, revocable child capabilities* as first-class on-chain state; Blocky402's ceiling model is the only rail where a facilitator can enforce that capability at settlement without the agent holding gas. Neither alone yields "your name is your budget." |
| **3-min demo shape** | Org mints `bot1.acme.eth` with a $5 ceiling; bot pays an x402 service (settles); org edits the resolver to revoke → next paid call is refused at the facilitator; subgraph shows the revocation propagating. |
| **TASTE lines** | U1 real x402 settlement; U2 revoke-a-name-kills-spend in 60s; U3 "ENS name = revocable wallet policy"; U6 above; U7 live revocation. |
| **primitive(s) adapted** | F12 (attenuated delegation via namespace hierarchy) + F19 (facilitator that reads ENS as the missing auth plumbing). |
| **law-check** | L2/L3/L11/L12 pass; ENS-as-spend-policy is fresh whitespace W7. |
| **prize-combo (≤3)** | ENS ENSv2 $4.5K (MED) + Hedera x402 $6K (HIGH) + The Graph Composable $5K (MED). $15.5K, distinct interlock. |
| **INTERLOCK MAP** | (1) ENSv2 Enhanced Access Control + Agent Text Records — remove → no revocable, parent-scoped spend policy exists on-chain; the name means nothing; product dies. (2) Blocky402 facilitator — remove → nothing enforces the ENS-encoded ceiling at settlement time and agent would need gas; enforcement dies. (3) The Graph subgraph — remove → revocation isn't provably propagated and a stale cap could still settle; the trust in revocation dies. |
| **COMPOSITION NOVELTY** | An agent's ENS name literally *is* its spending permission — editing the resolver instantly revokes on-chain payment authority — an emergent "namespace-as-wallet-policy" that exists only when ENSv2 access-control records gate a gas-free x402 facilitator and a subgraph proves the revocation took effect. |

---

**IDEA 4 — Tollpool (ATS-tokenized shared inference budget, agents draw down, Graph-priced)**
| field | content |
|---|---|
| **mechanism** | An org buys a shared "compute credit" issued as a Hedera ATS (ERC-1400) security-token pool. Member agents hold ATS partitions = their sub-budget. Each x402-gated inference call debits the caller's ATS partition (a lifecycle transfer-restriction op, not just a balance decrement) and settles via Blocky402; HCS notarizes each draw. A subgraph indexes utilization so partitions can be *repriced* (a low-use agent's partition auto-shrinks, freed budget re-issued to high-demand agents). |
| **why-this-chain (U6)** | ATS partition + transfer-restriction lifecycle is the only primitive that makes "sub-budgets that can be reallocated with compliance rules" real on-chain state; Blocky402 is the only gas-free rail letting agents draw against it per-call. The ATS *lifecycle op* (not a plain ERC-20) is load-bearing — reallocation obeys partition rules. |
| **3-min demo shape** | Issue ATS pool, 3 agents get partitions; they make x402 inference calls debiting partitions; subgraph shows agent-C idle → its partition auto-shrinks and re-issues to agent-A; all HashScan-verified. |
| **TASTE lines** | U1 real paid calls; U2 partition reallocation live; U3 "org compute budget as a reallocatable security"; U6 above; U7 real utilization drives it. |
| **primitive(s) adapted** | F35 (institutional money-in-motion, ATS custom rules as economics) + F16 (missing institution = working-capital pool for agents, M4). |
| **law-check** | L2/L3/L11/L12 pass; ATS-lifecycle-driven budget reallocation is LOW-MED crowded. |
| **prize-combo (≤3)** | Hedera ATS $6K (LOW-MED) + Hedera x402 $6K (HIGH) + The Graph Composable $5K (MED). $17K, dual-Hedera deep. |
| **INTERLOCK MAP** | (1) Hedera ATS ERC-1400 partitions + lifecycle op — remove → no compliant, reallocatable sub-budget state; it's just a spreadsheet; product dies. (2) Blocky402 x402 — remove → agents can't draw against partitions per-call gas-free; the draw event doesn't exist. (3) The Graph subgraph — remove → no live utilization signal to trigger the reallocation lifecycle op; the pool can't rebalance. |
| **COMPOSITION NOVELTY** | An org's inference budget becomes a live security whose sub-allocations physically flow from idle agents to busy ones under ATS compliance rules — a "self-rebalancing compute treasury" that exists only when x402 draws debit ATS partitions and Graph-indexed usage drives partition lifecycle ops. |

---

**IDEA 5 — Failsafe402 (Chainlink liquidation-protection challenge, private trigger, x402-metered keeper)**
| field | content |
|---|---|
| **mechanism** | A user's lending position is protected by a keeper agent. The liquidation-risk trigger (health factor + the user's PRIVATE off-chain hedge intent / max-slippage tolerance) runs inside a Chainlink CRE `handlerInTee` — the sensitive risk parameters never go public. When the confidential handler decides "de-risk now," it drives an on-chain state change joining Chainlink's Sep-9 liquidation-protection challenge contract. The keeper's protective action is itself an x402-metered service (pay-per-rescue via Blocky402), and each rescue is HCS-notarized. |
| **why-this-chain (U6)** | CRE TEE is the only way the user's private risk tolerance drives a public de-risk without leaking their strategy to front-runners; the Sep-9 challenge contract is a deterministic prize rubric. Blocky402 lets the keeper charge per-rescue without the protected user pre-funding gas. |
| **3-min demo shape** | Position nears liquidation; private tolerance (hidden) evaluated in TEE; de-risk tx fires to the challenge contract; keeper invoices via x402; HashScan + Chainlink challenge join shown. |
| **TASTE lines** | U1 real state change on the challenge contract; U2 private-trigger→public-rescue in 60s; U3 "your liquidation defense that never reveals your hand"; U6 above; U7 live risk event. |
| **primitive(s) adapted** | F02 (private execution → atomic public settlement, ported to CRE TEE) + F13 (per-rescue metering via x402). |
| **law-check** | L2/L3/L11/L12 pass; CRE + liquidation challenge is LOW competition (W4). |
| **prize-combo (≤3)** | Chainlink CRE Confidential $2K (LOW) + Chainlink Liquidation Challenge $0.5K (LOW, deterministic) + Hedera x402 $6K (HIGH). $8.5K — note two of three are Chainlink; **swap Liquidation $0.5K for Graph Composable $5K if the max-3 count favors breadth** ($13K variant). |
| **INTERLOCK MAP** | (1) Chainlink CRE handlerInTee — remove → private risk tolerance must be public, front-runners exploit it; the confidential-defense pitch dies. (2) Chainlink liquidation challenge contract — remove → no public state-change target/rubric; the defense has nowhere to act. (3) Blocky402 x402 — remove → keeper can't charge per-rescue gas-free and the protected user must pre-fund; the pay-per-rescue economics die. |
| **COMPOSITION NOVELTY** | A liquidation defense that acts on your *secret* risk tolerance and charges you only when it actually saves you — an emergent "confidential pay-per-rescue keeper" possible only because CRE privately converts hidden parameters into a public de-risk that an x402 meter bills against. |

---

**IDEA 6 — Selfguard (World Selfie-Check-gated agent onboarding, quorum treasury, gas-free spend)**
| field | content |
|---|---|
| **mechanism** | A B2B org onboards *human-backed* agents only: each new agent must pass World Selfie Check (proof-of-human + a fairness/risk signal) before it's admitted to the org's Privy org wallet. The Selfie Check risk score is load-bearing: it sets that agent's Privy policy tier (spend ceiling, whether it needs quorum). Admitted agents then pay for services via Blocky402 gas-free, capped by their humanId-derived tier. Deny-by-default: a failed/low-fairness selfie check → no wallet policy → agent can't spend. |
| **why-this-chain (U6)** | World's one-endpoint proof-of-human + fairness signal is the only primitive tying a *human liveness* to a spend tier; Privy is the only org-wallet whose policies can be *parameterized by* that external risk signal. The signal literally selects the policy — remove it and every agent gets the same tier (no fairness). |
| **3-min demo shape** | Register agent → Selfie Check runs → high-fairness agent gets $50 tier + no quorum; a flagged agent gets $5 + quorum; both attempt x402 spend, one settles freely, one hits the quorum wall. |
| **TASTE lines** | U1 real x402 spend; U2 selfie→spend-tier in 60s; U3 "your face sets your agent's budget"; U6 above; U7 live check. |
| **primitive(s) adapted** | F12 (attenuated delegation, human-verification-level as the attenuation axis) + F16 (missing institution: sybil-resistant admission for agent treasuries, M2/M3 via economic-not-score gating). |
| **law-check** | L2/L3/L11/L12 pass; World Selfie Check as *load-bearing policy input* is thin-on-quality per prize text (W10). |
| **prize-combo (≤3)** | World Selfie Check $3.5K (HIGH volume but thin quality) + Privy B2B $2.5K (MED) + Hedera x402 $6K (HIGH). $12K. Feedback doc required (World) — free points. |
| **INTERLOCK MAP** | (1) World Selfie Check — remove → no human-liveness/fairness signal; every agent gets an identical policy tier; the sybil-resistant-admission pitch dies. (2) Privy org wallet policies — remove → nothing consumes the risk signal into an enforceable spend tier; the signal is decorative. (3) Blocky402 x402 — remove → admitted agents can't actually spend gas-free under their tier; the consumer of the infra (C-IN1) disappears. |
| **COMPOSITION NOVELTY** | An agent's spending authority is minted directly from a human selfie's fairness signal — an emergent "liveness-priced treasury tier" that exists only because World's proof-of-human parameterizes a Privy policy that a gas-free x402 rail then enforces per-call. |

---

**IDEA 7 — Escrowire (delivery-proof-gated x402 settlement for agent work, dual-Graph priced)**
| field | content |
|---|---|
| **mechanism** | Buyer agent pays for a *deliverable* (a dataset, a rendered asset, a computed result), but funds sit in a Hedera escrow, NOT released on payment. Release is gated on a delivery attestation: the seller submits the work-hash; a Chainlink CRE `handlerInTee` privately verifies the deliverable matches the buyer's private acceptance spec (spec never public) and drives the on-chain release. A subgraph (dividend/utilization + Token API, ≥2 Graph products) indexes escrow states + prices seller reliability from indexed release history so buyers discover trustworthy sellers by live cashflow, not scores. |
| **why-this-chain (U6)** | CRE TEE is the only way the buyer's private acceptance criteria verify the deliverable without publishing the spec (which would let sellers game it); Hedera escrow + Blocky402 is the only gas-free rail where the buyer-agent funds escrow per-job. The BINDING of release to private verification is the mechanism. |
| **3-min demo shape** | Buyer funds escrow for a deliverable; seller submits matching work → CRE verifies privately → release fires; then a mismatched deliverable → CRE rejects → funds return. Subgraph shows seller reliability updating from real releases. |
| **TASTE lines** | U1 real escrow USDC/HBAR moves; U2 accept/reject on private spec in 60s; U3 "escrow that checks your work in secret before paying"; U6 above; U7 both accept + reject shown live. |
| **primitive(s) adapted** | F29 (live-state-bound attestation — attested fact = delivery-of-paid-work, escapes reputation ban) + F16 (missing institution = escrow for agent labor, M4). |
| **law-check** | L2/L3/L11/L12 pass; delivery-proof escrow with private acceptance is fresh (M4). |
| **prize-combo (≤3)** | Hedera x402 $6K (HIGH) + Chainlink CRE Confidential $2K (LOW) + The Graph Composable $5K (MED, ≥2 products satisfied). $13K. |
| **INTERLOCK MAP** | (1) Blocky402 x402 + Hedera escrow — remove → buyer-agent can't fund a gas-free per-job escrow; there's nothing to gate release on; product dies. (2) Chainlink CRE handlerInTee — remove → the private acceptance spec must be public, sellers game it, and release can't be trust-minimized; the mechanism dies. (3) The Graph (2 products) — remove → buyers can't discover reliable sellers by indexed cashflow; the marketplace half collapses. |
| **COMPOSITION NOVELTY** | Escrow that privately checks a deliverable against secret acceptance criteria and releases only on a match — an emergent "confidential delivery-gated settlement" for agent labor that exists only when a gas-free x402 escrow's release is bound to a CRE private verification and Graph-indexed release history prices sellers. |

---

**IDEA 8 — Streamvest (ATS revenue token whose primary sale IS the demand sink — fixes SEED-A's weakness)**
| field | content |
|---|---|
| **mechanism** | *Sharper variant fixing Callflow's named day-1-buyer weakness via a real mechanism change.* An x402 API's revenue accrues to a splitter, and the revenue-share is a Hedera ATS token — BUT the token's primary distribution is a **usage-rebate bonding curve**: heavy API *consumers* automatically receive ATS revenue-tokens pro-rata to spend (the buyer is the user, structurally, not a second wallet). A Chainlink CRE `handlerInTee` computes each consumer's rebate allocation from their *private* usage volume (usage stays confidential) and drives the on-chain ATS mint/distribute. Subgraph prices the token off live indexed cashflow. |
| **why-this-chain (U6)** | ATS snapshots are load-bearing for the dividend math (as in SEED-A); the NEW leg is CRE — private usage → rebate allocation is impossible to do fairly without leaking each consumer's spend, which CRE TEE solves. This is the mechanism change: demand sink = confidential usage rebates, not a bonding curve of speculators. |
| **3-min demo shape** | Agents consume the x402 API; CRE privately tallies each one's usage; rebate ATS tokens auto-mint to the top consumers; subgraph revalues the token as cashflow rises; a consumer redeems a dividend — HashScan-verified. |
| **TASTE lines** | U1 real revenue + real dividend; U2 use-the-API→earn-the-token loop in 60s; U3 "the more you pay, the more of the API you own — privately"; U6 above; U7 live usage drives mint. |
| **primitive(s) adapted** | F35 (ATS money-in-motion) + F02 (private computation → public mint via CRE). Labeled: this is a mechanism-change sibling of SEED-A, not a re-propose (adds private usage-rebate demand sink + CRE leg; SEED-A has neither). |
| **law-check** | L2/L3/L11/L12 pass; the confidential-rebate demand sink is the novel delta vs SEED-A. |
| **prize-combo (≤3)** | Hedera ATS $6K (LOW-MED) + Hedera x402 $6K (HIGH) + Chainlink CRE Confidential $2K (LOW). $14K. |
| **INTERLOCK MAP** | (1) Hedera ATS snapshots — remove → no snapshot-bound dividend math and no ownership token to rebate; product dies. (2) Blocky402 x402 — remove → no per-call revenue events and no usage volume to compute rebates from; the demand sink has no input. (3) Chainlink CRE handlerInTee — remove → per-consumer usage must be public to allocate rebates fairly, leaking every buyer's spend; the confidential-rebate mechanism (the fix over SEED-A) dies. |
| **COMPOSITION NOVELTY** | Paying to use an API privately earns you a share of that API's revenue proportional to your hidden usage — an emergent "confidential usage-dividend" that exists only when ATS snapshot dividends are minted from a CRE-private tally of x402 spend, giving the revenue token a structural day-1 buyer (the user) rather than a speculator.

## V2 generation_parallel — G2 (composition hunter) FULL RETURN
I have full context. As G2, the composition/interlock hunter, I'll generate ideas where 3+ sponsor primitives compose into emergent capabilities. Let me construct interlocks deliberately across different sponsors.

---

**IDEA 1**

name | **Rebate** — the API where paying triggers a proof-of-human refund draw, and only real humans can win

mechanism | Every x402 micropayment for a metered AI service (on Hedera Blocky402, gas-free ceiling) accrues into a rebate pot. At each finality window a Uniswap CCA continuous auction clears "who gets rebated" — but the CCA hook is a **World Selfie Check zk-eligibility gate**, so only wallets with a verified distinct humanId behind them can bid the rebate down. Bots pay full price forever; humans reclaim a share via a fair uniform-price clearing. HCS notarizes every payment and every rebate clearing.

why-this-chain (U6) | Blocky402's gas-free spending-ceiling is the ONLY rail where a metered payer never juggles gas across thousands of micro-calls; CCA-as-hook is the only auction that clears continuously per-window; World is the only endpoint fusing proof-of-human INTO the eligibility predicate of that hook. Port to Base and you lose the gas-free meter AND the human-gated hook.

3-min demo shape | Two agents hammer the same paid API. One is bound to a real humanId (Selfie Check passed live on camera), one is a bare bot. Watch payments stream in gas-free; at the window close the CCA clears and the human wallet receives a USDC rebate on-chain; the bot's rebate bid is rejected by the zk-eligibility hook. HCS explorer shows the full trail.

TASTE lines | U1 real USDC moving both directions; U2 the human-wins-bot-loses split is visible in 60s; U3 "a paywall that pays real humans back" is unseen; U6 three primitives none can substitute.

primitive(s) adapted | F13 (per-unit metering) fused with F02/M3 (human-verified fairness in an auction) — the metered unit's REVENUE becomes the auctioned good, cleared by a human-gated CCA hook.

law-check | L2 pass (visible refund flip), L3 pass (novel), L11 pass (real flows), L12 pass (no team reads three prize pages and builds a human-gated rebate auction).

prize-combo | Hedera x402 $6K + Uniswap CCA $3K (FEEDBACK.md) + World Selfie Check $3.5K = $12.5K, near-zero crowding (CCA lane thin, human-gated-hook unprecedented).

INTERLOCK MAP |
- Hedera Blocky402 x402 → remove this → dies because there's no gas-free metered payment stream to accrue into a rebate pot; on a gas-token chain the micro-rebate is eaten by gas.
- Uniswap CCA hook → remove this → dies because "who gets rebated" needs continuous uniform-price clearing per window; a fixed rule isn't a fair market and can't carry the zk-eligibility extension.
- World Selfie Check (zk-eligibility in the hook) → remove this → dies because the entire novelty is that ONLY humans can win the rebate; without it bots reclaim the pot and it's just cashback.
- HCS → remove this → the fairness claim is unauditable; holders can't verify clearing wasn't rigged. (load-bearing for trust)

COMPOSITION NOVELTY | A metered paywall that, per finality window, runs a continuous-price auction to refund only the real humans behind paying agents — an emergent "human-preferential price discrimination" primitive that exists only because gas-free metering feeds an auction whose eligibility predicate IS proof-of-human.

---

**IDEA 2**

name | **Escrow-in-the-dark** — private delivery-of-work verification driving public payment release

mechanism | A buyer agent pays for a work product (a dataset, a model output, a report) via x402 into an escrow. Release is NOT "trust the seller": the deliverable is submitted into a **Chainlink CRE TEE handler** that runs a private acceptance test (schema/quality/spec-match check whose logic stays confidential so it can't be gamed), and ONLY a pass/fail boolean crosses back to the DON, which triggers on-chain release of the escrowed USDC. **Privy quorum + intents** hold the buyer-org's escrow: the CRE pass emits an intent, humans approve the m-of-n release for anything above a policy threshold, small amounts auto-release.

why-this-chain (U6) | CRE handlerInTee is the only primitive where the acceptance CRITERIA stay private (a public test gets gamed by sellers) yet still drive public state; Privy is the only custody layer giving real org m-of-n + async intents so the release is a genuine treasury flow, not a single key. Swap CRE for a public oracle and sellers reverse-engineer the test; swap Privy for an EOA and it's not an org escrow.

3-min demo shape | Seller submits a good deliverable → CRE TEE returns pass → intent fires → 2-of-3 org approvers sign in Privy → escrow releases USDC on-chain. Then a subtly-bad deliverable → CRE TEE returns fail (criteria never revealed) → escrow stays locked, buyer refunded. Cross-read attempt on the TEE criteria is denied live.

TASTE lines | U1 real escrow + real release; U2 pass→release / fail→refund flip visible; U3 "the test that grades your work is one you can't see or cheat"; C-DF1 real USDC moves.

primitive(s) adapted | F02 (private execution → atomic public settlement) shifted from matching to WORK-ACCEPTANCE; F16 (missing institution: honest escrow for agent labor) with the honesty-forcing primitive = confidential acceptance criteria, not a reputation score.

law-check | L2 pass, L3 pass (confidential-grading escrow unseen), L11 pass, L12 pass.

prize-combo | Chainlink CRE Confidential $2K + Privy Financial-Flow $2.5K + Hedera x402 $6K = $10.5K, LOW crowding (CRE zero complaint corpus, W4).

INTERLOCK MAP |
- Chainlink CRE TEE → remove this → dies because a PUBLIC acceptance test gets gamed by the seller; the private-criteria-drives-public-release IS the mechanism.
- Privy quorum + intents → remove this → dies because release becomes a single-key auto-pay, not an org treasury flow with human-in-loop for large amounts (kills the B2B claim).
- x402 escrow-in → remove this → dies because there's no metered agent-native payment funding the escrow; a manual transfer isn't the agent-labor market.
- HCS/Graph (audit + discovery) → load-bearing for buyers to find/verify serviced escrows.

COMPOSITION NOVELTY | An escrow that releases payment based on a quality test the seller can never see and therefore can never game, gated by real org m-of-n approval — "ungameable delivery verification" that exists only because a confidential TEE grade becomes a Privy-quorum-approved on-chain release.

---

**IDEA 3**

name | **Leash** — an ENSv2 permission tree where a parent agent mints child names that CAN ONLY spend what the parent allows, enforced at the pay-rail

mechanism | An org registers `treasury.acme.eth`. Under ENSv2 Enhanced Access Control it mints child names (`ads.acme.eth`, `data.acme.eth`) whose **Permissioned Resolver + Agent Text Records** encode a spend capability (rail, max/call, allowed payees). A **Blocky402 spending-ceiling** for each child agent is DERIVED from its ENS record — the facilitator reads the resolver and refuses any x402 payment exceeding the parent-scoped cap. **Privy policy engine** holds each child's key and enforces the same envelope, so violation fails at BOTH the name layer and the custody layer. Re-delegation (a child minting a grandchild) can only NARROW.

why-this-chain (U6) | ENSv2 hierarchical registries + Enhanced Access Control are the only naming primitive where a parent structurally scopes what a child NAME can do; Blocky402's off-chain spending ceiling is the only rail that can read that scope and clamp a gas-free payment to it. Without ENSv2 there's no capability tree; without Blocky402 the cap isn't enforced at payment time.

3-min demo shape | Parent mints `ads.acme.eth` capped at $5/call to a whitelisted payee. The child agent pays an ad API → succeeds. Same child tries $50 → Blocky402 refuses (reads the resolver). Child tries to mint a grandchild with a HIGHER cap → ENS access control reverts (can only narrow). All caps live in ENS text records visible on-chain.

TASTE lines | U1 real names + real refusals; U2 the over-spend reverting is the 60s wow; U3 "your org chart IS your spend policy, in ENS"; U6 the name literally carries the capability.

primitive(s) adapted | F12 (attenuated delegation — narrows-only) with substrate = ENSv2 names + Blocky402 ceiling, distinct from Backstop (attenuation at GRANT time via naming, not co-sign at exec time).

law-check | L2 pass, L3 pass (ENS-as-capability-tree fresh, W7), L11 pass, L12 pass. Distinct from forbidden guardian shape (no execution-time review, no scoring).

prize-combo | ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K = $13K, MED crowding (ENSv2 fresh primitive, W7).

INTERLOCK MAP |
- ENSv2 Enhanced Access Control + Permissioned Resolver → remove this → dies because there's no hierarchical, parent-scoped, narrows-only capability structure; a flat allowlist isn't a delegation tree.
- Blocky402 spending ceiling → remove this → dies because the ENS-encoded cap is never ENFORCED at payment; it's just metadata nobody checks.
- Privy policy engine → remove this → dies because a leaked child key could bypass ENS; the second enforcement layer is what makes it safe custody, not decorative login.

COMPOSITION NOVELTY | A payment rail whose spending limits are read live from an ENS name's access-control tree, so an org's namespace hierarchy literally IS its treasury permission graph — "the name is the spend capability" exists only because ENSv2 scoping composes with a Blocky402 ceiling that reads it and a Privy policy that double-enforces it.

---

**IDEA 4**

name | **Streamvault** — one Aqua LP balance whose strategies are chosen by private CRE logic and paid for per-second on Arc

mechanism | A single self-custodied **1inch Aqua** LP balance backs multiple SwapVM strategy programs simultaneously. WHICH strategy is active is decided by a **Chainlink CRE TEE** handler running confidential signal logic (the alpha stays private) — only the chosen-strategy-id crosses back to trigger the Aqua re-allocation. Consumers subscribe to the strategy's output stream and pay **per-second via Circle Nanopayments on Arc** (USDC-native, sub-second finality); the LP earns from both swap fees AND the metered subscription. Non-payers' stream cuts at the next finality window.

why-this-chain (U6) | Aqua is the only model where ONE balance backs many strategies with full self-custody (a vault can't); CRE TEE is the only way the strategy-selection alpha drives public reallocation while staying private; Arc Nanopayments is the only per-second USDC-native meter with sub-second finality to gate the output stream. Three sponsors, three irreplaceable legs.

3-min demo shape | Show one Aqua LP balance live. CRE picks strategy A (logic hidden); Aqua reallocates on-chain. A consumer streams USDC/sec on Arc and sees strategy output; stop paying → stream cuts within a finality window. LP dashboard shows fees + subscription income on the SAME balance.

TASTE lines | U1 real LP, real USDC/sec; U2 the "one balance, two revenue streams, private brain" is visible; U3 capital-efficiency + private alpha + pay-per-second is a combination unseen; C-DF1 real value.

primitive(s) adapted | F25 (sponsor's-hardest-guarantee: Aqua one-balance-many-strategies as headline) composed with F02 (private logic → public state) and F13 (per-second metering).

law-check | L2 pass, L3 pass, L11 pass, L12 pass. Distinct from private-vault forbidden shape (this is capital-efficiency + metered subscription, not a shielded position).

prize-combo | 1inch Aqua $5K + Chainlink CRE $2K + Arc Agentic $1.67K (+ mainnet bonus) = ~$8.7K+, LOW crowding (Aqua 6wk old W3, CRE W4).

INTERLOCK MAP |
- 1inch Aqua/SwapVM → remove this → dies because no other model lets one self-custodied balance back many live strategies; a vault-per-strategy defeats the capital-efficiency headline.
- Chainlink CRE TEE → remove this → dies because public strategy-selection logic gets front-run/copied; the private-brain-drives-public-reallocation is the edge.
- Arc Nanopayments → remove this → dies because the per-second subscription meter needs USDC-native sub-second finality; on a gas chain per-second billing is uneconomic.

COMPOSITION NOVELTY | A single liquidity balance that simultaneously earns swap fees and per-second subscription revenue, steered by alpha nobody can see — "a self-custodied strategy fund with a private brain and a metered output stream" exists only because Aqua's multi-strategy balance composes with a CRE-private selector and an Arc per-second meter.

---

**IDEA 5**

name | **Substream Toll** — the first data pipeline where consuming an indexed row IS a gas-free micropayment to its author, cleared on Hedera

mechanism | A builder deploys a Graph **Substreams** pipeline (the featured challenge) via one prompt. Every downstream agent that queries a row via the **Graph MCP/Token API** triggers a **Blocky402 x402 gas-free micropayment** — priced per row consumed — routed to a splitter that pays the Substream AUTHOR. **Hedera Scheduled Transactions** stream the author's accrued royalties on a cadence with no keeper; **HCS** notarizes every consumption event so the author can prove usage. The meter is the query itself.

why-this-chain (U6) | The Graph is the only NL-queryable 15k-subgraph + one-prompt-Substreams surface; Blocky402 is the only rail making per-row consumption gas-free (per-row gas would exceed the row's value); Scheduled Tx is the only native no-keeper royalty stream. Port to Base: per-row micropayment dies on gas; drop Substreams: nothing to meter.

3-min demo shape | Deploy a Substreams pipeline in one prompt. An agent runs an NL query → each row consumed fires a gas-free x402 payment → author's balance ticks up live. Scheduled Tx auto-distributes accrued royalties at the window. HCS explorer shows per-row consumption receipts.

TASTE lines | U1 real payments per query; U2 "query a dataset, its author gets paid, live" in 60s; U3 pay-per-indexed-row is a novel data-economy primitive; U6 all three legs native.

primitive(s) adapted | F13 (metering) with the metered unit = an INDEXED ROW (novel), fused with F35 (money-in-motion via Scheduled Tx royalty streaming) — a data-royalty rail, not a content toll.

law-check | L2 pass, L3 pass (pay-per-row + author royalty unseen; differs from pay-per-crawl which is fetch-time not index-consumption), L11 pass, L12 pass. Not the disqualified one-GraphQL-dashboard (this is a payment rail ON the query).

prize-combo | Graph Composable $5K + Hedera x402 $6K + Hedera ATS/Scheduled ($6K via Scheduled-Tx streaming) = $17K, LOW-MED crowding (W1+W5, featured Substreams challenge).

INTERLOCK MAP |
- Graph Substreams + MCP/Token API → remove this → dies because there's no indexed pipeline to meter and no NL query surface to attach the toll to; a raw RPC has no author to pay.
- Blocky402 x402 → remove this → dies because per-row payment is uneconomic under gas; only the gas-free ceiling makes micro-consumption pay.
- Hedera Scheduled Transactions → remove this → dies because royalty distribution needs a keeper; the no-keeper native stream is what makes authors trust ongoing payout.
- HCS → load-bearing: author's usage proof / consumption audit.

COMPOSITION NOVELTY | A data pipeline where each indexed row consumed by an agent is itself a gas-free royalty payment to the row's author, auto-streamed with no keeper — "the query is the toll and the author is the landlord" exists only because Substreams provides the metered unit, Blocky402 makes per-row pay viable, and Scheduled Tx streams the royalty.

---

**IDEA 6**

name | **Quorumgate** — an org treasury that pays agents only after a private compliance check AND real human m-of-n, with the whole path in one ENS name

mechanism | An org's paying identity is `pay.acme.eth` (ENSv2). When an agent proposes an x402 payment to a vendor API, the request routes through a **Chainlink CRE TEE** that runs the org's PRIVATE compliance rules (sanctions/budget/vendor-policy — kept confidential so vendors can't reverse-engineer approval thresholds) and returns pass/fail. A pass emits a **Privy intent**; the org's m-of-n approvers sign; only then does the **Blocky402** payment settle gas-free. ENSv2 Agent Text Records publish which vendors/rails `pay.acme.eth` is allowed to use, so counterparties verify legitimacy before quoting.

why-this-chain (U6) | CRE TEE is the only way compliance logic drives payment while staying private; Privy is the only real m-of-n async-intent org custody; ENSv2 is the only name-native way to publish an org's payment authority publicly. This is the "agent proposes, humans approve, machine pre-checks in the dark" shape (W6) — no single sponsor delivers it.

3-min demo shape | Agent proposes a vendor payment → CRE compliance passes (rules hidden) → Privy intent → 2-of-3 humans approve → Blocky402 settles gas-free. Then a policy-violating payment → CRE fails silently → no intent, no payment. `pay.acme.eth` text records show the vendor allowlist on-chain.

TASTE lines | U1 real approval + real settlement; U2 propose→check→approve→pay chain visible in 60s; U3 private-compliance + human-quorum + named authority is unseen together; C-AI1 the agent proposal is the product.

primitive(s) adapted | F16 (missing institution: a compliance-clearing house for agent payments) with honesty primitive = private-rules + m-of-n, NOT a score. Distinct from CRE Compliance Gate (forbidden) by adding ENS-published authority + Privy human quorum as co-equal load-bearing legs and org-treasury framing.

law-check | L2 pass, L3 pass, L11 pass, L12 pass. Careful distinctness from forbidden "CRE compliance gate": here the load-bearing novelty is the ENS-named authority + Privy quorum interlock, not the gate alone.

prize-combo | Privy B2B $2.5K + Chainlink CRE $2K + ENSv2 $4.5K = $9K, LOW-MED crowding.

INTERLOCK MAP |
- Chainlink CRE TEE → remove this → dies because public compliance thresholds get gamed by vendors; private-rules-drive-payment is the mechanism.
- Privy intents + quorum → remove this → dies because "humans approve" collapses to a single auto-key; the org m-of-n is the B2B claim.
- ENSv2 Agent Text Records → remove this → dies because counterparties can't verify the org's payment authority/allowlist; the named public authority is what makes vendors trust the payer.
- Blocky402 → load-bearing settlement leg (gas-free org payment).

COMPOSITION NOVELTY | An org payment that must clear a compliance test nobody can see, then a real human m-of-n, all attached to a publicly-verifiable ENS payment identity — "a named org treasury with a private compliance brain and human approval" exists only where CRE-private rules, Privy quorum, and ENS-published authority compose.

---

**IDEA 7**

name | **Proofstream** — an SLA-bound service where the meter refunds you automatically when the private uptime check fails

mechanism | An agent pays per-call (x402, Blocky402 gas-free) for a service that carries an SLA. A **Chainlink CRE TEE** periodically runs a confidential probe of the service's real health (probe logic private so the operator can't spoof it) and emits an SLA pass/fail to chain. On fail, a splitter contract **auto-refunds** the paying agents for the affected window from a **Hedera ATS**-tokenized SLA bond the operator posted; **HCS** notarizes probes, breaches, and refunds. Refund math reads ATS holder snapshots (who paid in the breached window).

why-this-chain (U6) | CRE TEE is the only way to run an unspoofable private health probe that drives on-chain refunds; ATS is the only primitive giving a tokenized, snapshot-able SLA bond whose refund distribution is native; Blocky402 is the only gas-free per-call meter. This is F29 live-state-bound attestation where the attested fact is SLA (allowed — NOT reputation).

3-min demo shape | Agent streams paid calls. CRE probe passes → normal. Kill the service → next CRE probe fails → splitter auto-refunds the window's payers from the ATS bond → HCS shows breach+refund receipts. Operator can't fake uptime (probe logic sealed in TEE).

TASTE lines | U1 real refund from real bond; U2 breach→auto-refund in 60s; U3 "a paywall that pays you back when it breaks its promise, judged by a probe it can't cheat"; U7 breach state earned live by killing the service.

primitive(s) adapted | F29 (live-state-bound attestation, attested fact = SLA not reputation) + F35 (ATS bond as money-in-motion) + F13 (metering) — an insurance/refund institution for paid agent services (M2 via economic primitive, not score).

law-check | L2 pass, L3 pass, L11 pass, L12 pass. Distinct from forbidden trust-scoring (no score; a bonded auto-refund keyed to a private SLA probe).

prize-combo | Chainlink CRE $2K (+liquidation/challenge $0.5K) + Hedera ATS $6K + Hedera x402 $6K = ~$14.5K, LOW-MED crowding (M2 whitespace via economic primitive).

INTERLOCK MAP |
- Chainlink CRE TEE probe → remove this → dies because a public/self-reported uptime check is spoofable by the operator; the sealed probe is what makes the SLA honest.
- Hedera ATS SLA bond → remove this → dies because there's no snapshot-able bonded collateral to auto-refund from; a plain balance can't do per-window holder-snapshot refunds.
- Blocky402 x402 meter → remove this → dies because there's no per-call metered payment to refund against; the meter defines the breached window.
- HCS → load-bearing breach/refund audit the payers trust.

COMPOSITION NOVELTY | A metered paid service that automatically refunds its users out of a bonded token pool whenever a health probe it cannot spoof reports a breach — "self-enforcing SLA insurance for agent services" exists only because a CRE-private probe composes with an ATS-snapshot bond and a Blocky402 meter that defines the covered window.

## V2 synthesis + pool_gates (main context)

### Cluster map (38 ideas → families; best-of-family advances)
- FAM-1 "async x402+MCP middleware" (Kilowire G1) ≈ V1 Settle402 (killed modal, L1 4-gen convergence). Also Substreamwire/Substream Toll/Tollgraph touch the Graph featured-challenge = L6 organizer-suggested. KILL family (modal + organizer-seeded).
- FAM-2 "CRE-private-check gates x402 money-movement" — the DEEPEST recurring interlock, 7 variants: Proofstream(G2, SLA→ATS-bond auto-refund), SLABridge(G4, SLA→slash), Escrow-in-the-dark(G2, work-acceptance→release+Privy), Escrowire(G4), Escrowless(G5), Ransom(G3, HCS-clock refund no-CRE), Provewire(G1, determinism-gated). Internal convergence HIGH but external crowding LOW (CRE Confidential = private beta, zero complaint corpus). Advance TWO distinct sub-shapes: (a) Proofstream = self-enforcing SLA *insurance*; (b) Escrow-in-the-dark = *ungameable work-acceptance* escrow.
- FAM-3 "fix Callflow's day-1-buyer" — Aftermarket(G3, resellable prepaid call-credits on bonding curve, NO beta dep), Streamvest(G4, confidential usage-rebate via CRE), Rebate(G2, human-preferential rebate auction via CCA+World). Advance Aftermarket (lowest-risk Callflow-evolution) + Rebate (distinct spectacle).
- FAM-4 "ENS name = revocable spend capability" — Leash(G2, double-enforced ENS+Blocky402+Privy), Namehold(G4), Namewire(G1), Namespace Rent(G5), Namespace Toll(G3). Advance Leash (deepest: dual-layer enforcement; W7 fresh; low beta dep).
- FAM-5 "Aqua shared-balance strategist" — Streamvault(G2, +CRE private strategy +Arc metered), Redline(G3, +x402+Arc), Aqua Custody Desk(G4, +Privy+Ledger), Aquawright(G1, fee-on-transfer guard). Advance Streamvault (highest novelty/ceiling; flag Aqua 2h+ AND CRE beta = double ship risk).
- FAM-6 "agent working capital / float" — Backstock(G3, undercollateralized credit priced on Graph cashflow, force-repaid from next receipt; M4). Advance Backstock (unique, no beta dep).
- FAM-7 "human-quorum payment" — Quorumgate(G2), Quorumwire(G1), Quorum Pay(G5), Selfguard(G4). Folded into Leash/Escrow-in-the-dark (Privy quorum already load-bearing there); no standalone advance (scope-heavy, 4 primitives).
- FAM-8 "pay-per-indexed-row royalties" — Substream Toll/Provenance Toll/Substreamwire: organizer-challenge-adjacent (L6) + row-provenance proof is heavy. KILL (collision risk).

### Seed survival
- SEED-A Callflow: SUPERSEDED by its own evolutions (Aftermarket fixes C13 with no new risk; Streamvest deepens via CRE). Callflow-as-was does NOT advance; its deeper child Aftermarket carries the thesis. (This is exactly the test Dami asked: the seed had to survive on merit and a deeper sibling beat it.)
- SEED-B Lifewire: DIES as predicted. No V2 idea made Arc load-bearing for the kill (Streamvault/Redline use Arc but enforcement/finality is still not the load-bearing axis for Lifewire's on/off claim). U6 collapse unresolved. Not advanced.

### Gates applied
- Gate V2-interlock: every advancing idea has >=3 load-bearing primitives with "remove→dies" (verified per idea below). Decorative-integration kills: none survived to here.
- Gate 1 kill-list/concerns: FAM-1, FAM-8 killed (modal/organizer-seeded, L1/L6). No forbidden-shape survivors (checked each vs FORBIDDEN SHAPES: Proofstream/Escrow = delivery/SLA attested fact NOT reputation → clear of AlphaAttest/Verdikt; Leash = attenuation-at-grant NOT co-sign-at-exec → clear of Backstop; Backstock = undercollateralized cashflow-priced credit NOT self-funding-treasury-loop → clear of AgentTreasury).
- Gate 5 anti-attractor: <=1 house-shape — none are agent+reasoning-hash+dashboard+micropay. PASS.
- Gate 7 ceiling: Novel>=4 present (Streamvault, Proofstream, Leash all high-novelty). PASS.
- Composition-novelty gate (V2-M2): every advancing idea's emergent capability is impossible single-sponsor. PASS.

### V2 PRESENTED POOL (7)
1. Aftermarket | 2. Proofstream | 3. Leash | 4. Escrow-in-the-dark | 5. Backstock | 6. Streamvault | 7. Rebate

## V2 round_0 — SPEC
I have everything needed. Now I'll score all 7 ideas through the SPEC lens: literal prize-bullet fit, substitution-test load-bearing-ness, live-provable-not-mocked, and beta/mocked-dependency flags.

### SPEC — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (lens-specific, 1 line) |
|---|---|---|---|---|---|---|---|
| Streamvault | 8 | 8 | 4 | 5 | 8 | 6.6 | CRE $2K bullet needs `handlerInTee` w/ real sensitive input — private beta + Aqua 2h+ ramp = double-dependency; Arc slot is the softest (~$1.67K) for the effort. |
| Aftermarket | 7 | 8 | 8 | 6 | 7 | 7.2 | Every bullet is live-provable, ZERO beta risk; ATS+x402+Graph all earn verbatim; "who buys revenue tokens" answered — but Graph "compose ≥2 products" is thin (one redemption-velocity subgraph). |
| Leash | 7 | 9 | 7 | 6 | 8 | 7.4 | Cleanest literal fit: ENSv2 Enhanced Access Control + Permissioned Resolvers is EXACTLY the deep-bar; Privy quorum double-enforce is real; no beta deps. Privy is the swap-risk primitive. |
| Backstock | 6 | 7 | 6 | 5 | 6 | 6.0 | ATS-as-loan-note is the weakest verbatim fit (ATS wants issuance+lifecycle, a loan note is a stretch); lending logic risk in 3.5d; Graph cashflow subgraph is real and load-bearing. |
| Proofstream | 7 | 8 | 5 | 5 | 8 | 6.6 | Strong 3-way interlock BUT CRE $2K depends on private-beta TEE for the SPOOF-PROOF headline — if CRE is CLI-sim only, the "operator can't spoof" claim is unprovable-live. Flag. |
| Escrow-in-the-dark | 6 | 7 | 5 | 5 | 7 | 6.0 | CRE private-beta gates the whole novelty (private acceptance test); Privy quorum earns its bullet; but x402-escrow-in is a weak Hedera x402 fit (bullet wants metered pay-per-call, not one escrow deposit). |
| Rebate | 6 | 9 | 3 | 4 | 8 | 6.0 | Double fact-check kill: World Selfie Check is Beta/TestFlight (sandbox only) AND Uniswap CCA 2h+ ramp — but note Rebate selects x402/CCA/World, so CRE isn't the risk; World TestFlight is. Human-preferential angle is genuinely novel. |

**Top pick: Leash.** It is the only idea where all three prize bullets are earned *verbatim* with zero beta/mocked dependency. ENSv2's headline primitives (Enhanced Access Control, Permissioned Resolvers, Agent Text Records) are literally what the $4.5K bullet asks for and are load-bearing — "editing a resolver revokes payment authority" IS the ENSv2 mechanic, not a name display. Blocky402 reading the resolver before sponsoring settlement is live-provable on testnet today. Substitution test passes hard: remove ENS and there's no capability tree, remove Blocky402 and the cap is unenforced metadata.

**Kill: Rebate.** Prize-bullet fit depends on World Selfie Check, which is Beta behind TestFlight/private-Play sandbox — the exact "load-bearing sybil signal" the $3.5K bullet demands cannot be live-proven without mobile TestFlight loops (builder's flagged slow lane), and CCA is a 2h+ ramp on top. Two shaky dependencies for a $12.5K combo where the World slot is the load-bearing WOW. This rhymes with X03/X15 — cerebral wedge, hard-to-feel proof surface, mocked-if-you're-not-careful.

**Secretly decorative interlock: Streamvault's CRE TEE.** The pitch says "alpha stays private, only strategy-id crosses back," but you could swap the TEE for an off-chain signer or a committed hash and the *product* (one Aqua balance backing many strategies, metered subscription revenue) still fully works — the privacy is a nice-to-have story, not load-bearing to capital efficiency or the revenue stream. That's the X09/X16 trap: a decorative confidential layer that reads deep but survives removal. Runner-up decorative flag: Backstock's ATS (the loan note works fine as a plain receipt; ATS is bolted on to reach the third $6K pot).

## V2 round_0 — DEPTH
I have everything I need. Now let me analyze each idea through the DEPTH lens — mechanism depth, load-bearing interlocks, hardest technical dependency, and solo-shippable in 3.5 days.

Let me reason through the hardest technical dependencies:

- **Streamvault**: Aqua (2h+ ramp, SwapVM Solidity-heavy) AND CRE Confidential (private beta) — double bleeding-edge dependency. Highest ship risk.
- **Aftermarket**: ATS + Blocky402 (PoC repos exist) + HCS + Graph. All forkable/low-beta. Bonding curve is standard Solidity.
- **Leash**: ENSv2 Sepolia (fresh, W7) + Blocky402 + Privy. The facilitator READING the resolver pre-settlement is the hard, genuinely load-bearing interlock.
- **Backstock**: Blocky402 + splitter lien + Graph. Lending underwriting logic is the risk; splitter-enforced first-lien is real.
- **Proofstream**: CRE TEE (private beta) + ATS bond + Blocky402. CRE is the single-point beta dependency.
- **Escrow-in-the-dark**: CRE TEE (private beta) + Privy quorum + x402. CRE again the beta risk; Privy quorum is well-documented.
- **Rebate**: Blocky402 + Uniswap CCA (2h+, fresh) + World Selfie Check (TestFlight/mobile — Dami's weak spot, UNVERIFIED device). Double bleeding-edge + mobile risk.

### DEPTH — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (1 line) |
|---|---|---|---|---|---|---|---|
| Streamvault | 9 | 8 | 3 | 5 | 8 | 6.6 | Deepest protocol work (SwapVM program + TEE) but double bleeding-edge dependency (Aqua 2h+ AND CRE beta) = highest collapse risk |
| Aftermarket | 7 | 8 | 8 | 7 | 8 | 7.6 | Every leg forkable/low-beta; bonding-curve-as-prepaid-calls is genuinely novel and the "who buys" fix is a real insight; interlock holds |
| Leash | 8 | 9 | 7 | 6 | 8 | 7.6 | Facilitator-reads-resolver-pre-settlement is the deepest load-bearing interlock here; ENSv2 fresh (W7) but 30min-2h; narrows-only cap tree survives Q&A |
| Backstock | 7 | 8 | 6 | 7 | 8 | 7.2 | Splitter first-lien is real protocol work; lending underwriting is the ship risk; Graph-priced-off-cashflow is the strong leg |
| Proofstream | 7 | 8 | 5 | 6 | 7 | 6.6 | CRE-probe-refunds-from-ATS-bond is elegant and truly load-bearing, but single-point CRE beta dependency + snapshot refund math in window |
| Escrow-in-the-dark | 7 | 7 | 5 | 6 | 7 | 6.4 | Cleanest 3-way interlock but CRE beta gates the headline; Privy quorum easy; private-acceptance-test is the whole WOW and rides on beta access |
| Rebate | 6 | 9 | 3 | 4 | 8 | 6.0 | Most original concept but worst ship profile: CCA (2h+, fresh) + World Selfie Check (mobile/TestFlight, UNVERIFIED device) = triple risk |

**Top pick (DEPTH lens): Leash.** It has the deepest *load-bearing* interlock that isn't gated by a private beta: a Blocky402 facilitator that READS the ENSv2 Permissioned Resolver *before* sponsoring settlement means the name literally IS the spend policy — editing a resolver record instantly revokes payment authority, and re-delegation can only narrow. That is genuine protocol-level composition (ENS access-control mechanics feeding a payment facilitator's authorization decision), it survives a sponsor engineer's Q&A on all three sponsors, and every dependency is 30min-2h (no beta form, no mobile loop). Privy double-enforcement is the only slightly-decorative leg but it's cheap. **Aftermarket is the close co-pick** — lower peak depth but the best novelty-to-ship-risk ratio, and its bonding-curve-of-prepaid-calls is a real economic primitive, not a service (dodges the X08/X14 observer-not-actor trap).

**Most likely to collapse under a sponsor engineer's Q&A: Escrow-in-the-dark.** The entire WOW — a private acceptance test the seller can never game — lives inside the Chainlink CRE TEE, which is *private beta*. A Chainlink engineer will ask "show me the sealed handler running real acceptance logic in the enclave, not a `handlerInTee` placeholder" (explicitly called out as non-qualifying), and CLI-sim is the best-case answer. Strip the confidentiality and it degrades to a generic escrow with a quality check — the interlock's load-bearing leg is exactly the leg you can't fully prove. Streamvault has the same CRE exposure *plus* Aqua, but its Aqua/SwapVM half is at least demonstrable on local forks.

**Worst ship-risk-to-novelty ratio: Rebate.** Its novelty is top-tier (human-preferential per-window auction of refunds — near-zero crowding, WOW 8-9), but it stacks the two least-mature surfaces in the whole pool: Uniswap CCA (2h+, fresh, thin examples) as the clearing engine AND World Selfie Check (Beta, TestFlight sandbox, mobile) as the load-bearing eligibility gate — the exact mobile/TestFlight loop flagged as Dami's slow lane and UNVERIFIED. Two bleeding-edge legs, either of which failing kills the headline, for a solo builder in 3.5 days. This rhymes with X12 (0g-sentinel: strongest idea aimed at the wrong game/format) inverted — great idea, wrong *feasibility* envelope. Streamvault is the runner-up on this axis (deepest but double-beta), but at least half its stack is fork-demonstrable.

## V2 round_0 — CRAFT
I have everything I need. Scoring all 7 through the CRAFT lens — what is literally on screen at 0:30.

### CRAFT — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Notes (what the judge SEES at 0:30) |
|---|---|---|---|---|---|---|---|
| Streamvault | 8 | 7 | 4 | 3 | 4 | 5.2 | A dashboard of "strategies" and a per-second counter ticking. The whole point — the alpha stays *private* in a TEE, one balance backs many strategies — is invisible. Judge must be TOLD nothing leaked and that capital is shared. Two-negative demo (private brain + hidden efficiency). L14 cerebral wedge. |
| Aftermarket | 6 | 8 | 7 | 6 | 6 | 6.6 | A bonding curve chart moving as someone buys a "call-credit," then a gas-free API call that burns it. The credit-as-resellable-instrument is legible-ish, but the "oh" (owning usage not dividends) needs the curve + redemption-velocity story narrated. Money moves on screen though. |
| Leash | 7 | 8 | 6 | 5 | 5 | 6.2 | An ENS name tree and a payment that gets clamped/blocked when you edit a resolver. The wow is a *permission graph* — an invisible property. Best moment (edit resolver → payment instantly denied) IS showable as a revert, but the "namespace = treasury policy" concept is high-explanation-cost. Proving-a-negative risk (can't overspend). |
| Backstock | 6 | 7 | 7 | 7 | 8 | 7.0 | Agent hits paywall → shortfall auto-advances → paywall clears → next receipt arrives → splitter repays lender FIRST, on screen. This is a visible money loop with a legible climax (forced repayment from the next receipt). Credit-off-live-cashflow is narratable in one line. Strong async demo. |
| Proofstream | 7 | 8 | 6 | 6 | 8 | 7.0 | A health probe FAILS → an auto-refund fires from a bonded pool to payers, visibly. The refund is a real on-screen money event — the best kind of climax. The "probe it can't spoof" (TEE) is a told-not-shown detail, but the payoff (you get refunded) is felt. |
| Escrow-in-the-dark | 6 | 7 | 6 | 6 | 7 | 6.4 | Buyer pays into escrow → a hidden test passes → funds release (or fail → refund). Release/refund is a visible money event. But the headline novelty — the test the seller "can never see" — is a pure negative you must assert; on camera it looks like any escrow release. m-of-n adds a nice human-approval beat. |
| Rebate | 7 | 9 | 5 | 5 | 6 | 6.4 | A payment, then a per-window auction that refunds *only verified humans* while bots pay full price. Very original, but the wow ("human-preferential") requires showing bots-DON'T-get-it — proving a negative twice (World zk-humanId + bots excluded). Double beta risk (CCA + World TestFlight). High explanation cost. |

**Top pick (most legible/impressive demo):** Backstock (7.0) and Proofstream (7.0) tie. Backstock wins on *narrative legibility* — the camera literally shows the loan advance, the next receipt arriving, and the splitter repaying the lender before the agent, a self-contained money story a skimming judge reproduces in one sentence ("it fronts the agent cash and grabs it back from the next payment"). Proofstream's refund-on-breach is an equally visceral single money event and edges it on pure WOW, but its "probe it can't spoof" is a told property.

**Highest explanation cost:** Streamvault. It stacks TWO invisible properties (private-alpha TEE + one-balance-many-strategies capital efficiency) whose entire value is what the judge *can't* see. This is the L14 / Strata / routedock trap — a cerebral wedge that makes the judge read a table instead of watch money move. Leash and Rebate are close behind (permission-graph and human-preferential-pricing are both properties-not-events).

**The "deep interlock" that's actually invisible on camera:** In nearly every idea it's the Chainlink CRE TEE — "sealed so it can't be spoofed / seller can never see it" (Streamvault, Proofstream, Escrow-in-the-dark). On screen a sealed probe looks identical to an unsealed one; the confidentiality guarantee can only be *asserted*, never shown. The ideas that survive my lens (Backstock, Proofstream) do so because they pair that invisible interlock with a downstream *visible* money event (forced repayment, auto-refund) — the interlock stays invisible, but its consequence is legible. Rebate's World zk-eligibility gate is the other invisible interlock, and worse: its whole wow is a bot NOT getting paid, which is unshowable.

## V2 round_0 — WILD
Read complete. Scoring all 7 through the WILD lens — collision count driving Originality, mechanism-change vs sponsor-stacking driving WOW.

### WILD — Silent Assessment

| Idea | Tech | Orig | Pract | Usab | WOW | Avg | Collision | Notes (1 line) |
|------|------|------|-------|------|-----|-----|-----------|----------------|
| Streamvault | 9 | 8 | 4 | 5 | 8 | 6.8 | 0 | One LP balance = swap fees + private-alpha subscription stream; genuinely unseen, but double private-beta ship risk (Aqua+CRE). |
| Aftermarket | 7 | 9 | 8 | 7 | 8 | 7.8 | 0 | Prepaid API calls as a resellable bonding-curve instrument; the "day-1 buyer is a user not a speculator" is a real mechanism fix to the revenue-token problem. |
| Leash | 8 | 9 | 7 | 6 | 8 | 7.6 | 0-1 | ENS namespace hierarchy IS the treasury permission graph, narrows-only; "edit resolver = revoke payment authority" is a true "didn't-know-you-could" moment. |
| Backstock | 8 | 7 | 6 | 6 | 7 | 6.8 | 1-3 | Undercollateralized agent credit force-repaid from next receipt, priced off indexed cashflow; strong but F16-adjacent (agent credit is a named whitespace others will mine). |
| Proofstream | 7 | 6 | 6 | 6 | 6 | 6.2 | 1-3 | SLA insurance refunding from a bonded pool on an unspoofable probe; solid but sits squarely in F29 live-state-attestation cluster + CRE beta risk. |
| Escrow-in-the-dark | 7 | 6 | 7 | 6 | 6 | 6.4 | 1-3 | Escrow releasing on a quality test the seller can't see; the "private acceptance test" is neat but escrow-on-CRE-TEE is the modal CRE demo shape. |
| Rebate | 8 | 9 | 5 | 5 | 9 | 7.2 | 0 | Per-window auction refunding only the verified humans behind paying agents; human-preferential price discrimination is a concept nobody at this event builds — but triple immature-dep risk. |

### Verdict

**Top pick (most unique + impressive): Aftermarket.** It's the only idea whose novelty is a *mechanism fix to a known weakness* rather than a clever interlock — it dissolves the "who buys a revenue token" problem by making the day-1 buyer a genuine user (cheaper future calls), not a speculator. Collision ~0, low beta risk, and it's the most legible WOW that survives a 2-minute judge pass. Rebate and Leash tie for second on pure originality but carry more "will-a-judge-get-it-in-60s" risk (Rebate) or explanation cost (Leash).

**Secretly modal despite the deep interlock: Escrow-in-the-dark** (with Proofstream close behind). "CRE TEE runs a private acceptance test, pass/fail boolean crosses back, Privy holds the escrow" is exactly the shape ~every CRE-early-access team lands on — private-logic-gates-a-release is the modal CRE demo. The interlock reads deep, but it's L1/L12: 3 rivals at this event with CRE access independently build escrow-gated-by-hidden-test. The Privy quorum is decoration, not a mechanism change.

**Highest-ceiling "I didn't know you could do that": Rebate.** Auctioning *refunds* per finality window to only the sybil-resistant humans behind paying agents — human-preferential price discrimination via a World-gated Uniswap CCA hook — is the one idea in the pool with a true zero-collision concept and a 9/WOW ceiling. The catch is it's also the highest-risk: CCA maturity × World TestFlight is a double immature-dependency, so its floor is low. If it ships, it's the winner; if either dep slips, it's a demo of a slide. Leash is the safer "didn't-know-you-could" (resolver-edit-as-instant-revocation) with none of that beta exposure.

## V2 fact_check — Leash
I now have everything. The facilitator code confirms the exact enforcement seam: `/verify` and `/settle` are plain Hono handlers where a pre-settlement ENS `eth_call` gate slots in cleanly. Note one discrepancy resolved: `blockydevs/blocky402` GitHub org path returns 404 via `gh` (likely private/renamed or org-restricted), but blocky402.com confirms it's MIT/self-hostable and the `hedera-x402-facilitator` is a proven forkable alternative with identical contract. Both satisfy the "forkable facilitator" premise.

I have enough to render all three verdicts.

---

## Leash — Warroom Fact-Check Verdict

### CLAIM 1 — Cross-chain enforcement seam (Hedera facilitator reads ENS on Sepolia) → **VERIFIED (with a HARD-FAIL security caveat)**

**(a) Facilitator forkable + pre-settlement hook — VERIFIED.** The Hedera x402 facilitator is a thin, self-hostable HTTP wrapper with explicit, separate `POST /verify` and `POST /settle` endpoints. Confirmed in real code (`src/facilitator/app.ts`, `BelgacemElbar/hedera-x402-facilitator`): each is a plain Hono handler wrapping `@x402/core`'s `facilitator.verify()` / `.settle()`. Blocky402 itself is MIT-licensed and self-hostable (Docker/Node) per blocky402.com. Inserting an authorization check before `verify` returns `{isValid}` (or before `settle`) is a few lines — the seam is real and clean.
Evidence: `github.com/BelgacemElbar/hedera-x402-facilitator` README + `src/facilitator/app.ts`; blocky402.com.

**(b) Cross-chain ENS read — VERIFIED as a mechanic, but note the caveat.** The facilitator is a Node/TS service; reading an ENS record on Ethereum Sepolia is an ordinary `eth_call` to a Sepolia RPC (`resolver.text(node, key)` — the standard resolver interface confirmed below). No bridge, no oracle — just an outbound JSON-RPC read.
**Caveat (SOFT→HARD):** this authorization is *off-chain, facilitator-enforced*, not trustless. A self-hosted/forked facilitator honestly runs the check, but the Hedera settlement does not cryptographically verify the Ethereum state — a malicious facilitator could skip the check. Frame it as "the facilitator you run enforces the policy," not "the chain enforces it." Latency: one extra RPC round-trip (~50–300ms) before settle — negligible.
Evidence: resolver `text(bytes32,string)` interface at docs.ens.domains/resolvers/interfaces; facilitator is standard Node HTTP.

**Note:** the exact `blockydevs/blocky402` GitHub path 404s via API (org may be private/renamed), so cite `BelgacemElbar/hedera-x402-facilitator` as the concrete forkable proof — same x402 contract, self-hostable, mainnet+testnet.

### CLAIM 2 — ENSv2 primitives live + fit → **VERIFIED**
Beta is live on Sepolia (docs.ens.domains/ensv2). All five primitives confirmed against canonical current docs:
- (a) **Hierarchical parent→child** — YES: "a full name like `sub.alice.eth` is a chain of entries across registries linked by subregistry pointers"; owners deploy custom subname registries.
- (b) **Enhanced Access Control, narrows-only-ish** — YES, with nuance: EAC is a role-based system (2^256 resources, 64 roles each). It is *reversible* (parent/admin can grant AND revoke) — this is stronger than "narrows-only," not weaker. Do NOT claim ENSv1-fuse-style one-way narrowing; EAC replaced fuses with reversible roles.
- (c) **Permissioned Resolvers** — YES: "every account gets its own Permissioned Resolver proxy with fine-grained per-record permissions and record aliasing."
- (d) **Agent/text records** — YES: standard `setText(node,key,value)` / `text(node,key)`; arbitrary key-value string data. "Agent Text Records" = just a text key convention (fine).
- (e) **Instant revocation** — YES: clear the text record and/or revoke the EAC role; admin-holder revocation is immediate and on-chain.
Writing + reading + revoking a capability record is well under 1 day.
Evidence: docs.ens.domains/ensv2, /ensv2/overview, /ensv2/enhanced-access-control, /resolvers/interfaces.

### CLAIM 3 — Privy double-enforces the spend envelope → **VERIFIED**
Privy's policy engine supports exactly the two required rule types on wallets:
- **Per-call value cap** — native token via `ethereum_transaction.value` with `lt/lte/gt/gte`; ERC20 amount via `ethereum_calldata` ABI-decoded `function_name._value`.
- **Payee allowlist** — `ethereum_transaction.to` with the `in` operator (up to 100 values) or `in_condition_set` for larger lists.
- Actions are `ALLOW`/`DENY`; policies attach to specific signers ("set specific policies on wallets that apply to specific signers — authorization keys, users, or key quorums"). Enforcement is server-side in Privy's infra, so a leaked child key still can't submit a violating tx. Satisfies the Privy B2B bullet (org/server wallets + ≥1 control).
Evidence: docs.privy.io/controls/policies/overview, /wallets/using-wallets/session-signers/overview.

---

### OVERALL VERDICT (3 lines)
All three claims stand on real, current primitives — ENSv2-Sepolia (live beta), a forkable Hedera x402 facilitator with a clean `/verify`+`/settle` seam, and Privy policy rules that match the exact envelope. The one honesty line the pitch MUST carry: Claim 1's cross-chain enforcement is **facilitator-trusted, not chain-trustless** — Hedera settlement doesn't cryptographically verify Ethereum state, so pitch it as "the facilitator we run/fork enforces the ENS policy," with Privy as the independent second rail. Green-light to build; the demo is a legitimate end-to-end story across three sponsors.

### BUILD SPEC — Claim 1 facilitator ENS-read enforcement path
Fork `BelgacemElbar/hedera-x402-facilitator` (or self-host blocky402). In `src/facilitator/app.ts`, wrap the `/verify` handler (fail early, before any settle):

```ts
import { createPublicClient, http, namehash } from "viem";
const eth = createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC) });

app.post("/verify", async (c) => {
  const { paymentPayload, paymentRequirements } = await c.req.json();
  const base = await facilitator.verify(paymentPayload, paymentRequirements);
  if (!base.isValid) return c.json(base);

  // ── ENS pre-settlement authorization gate ──
  const node = namehash(childName);                    // e.g. "payments.acme.eth"
  const cap = await eth.readContract({                 // cross-chain eth_call, Sepolia
    address: PERMISSIONED_RESOLVER, abi: RESOLVER_ABI,
    functionName: "text", args: [node, "agent:spend-policy"],
  });
  if (!cap) return c.json({ isValid:false, invalidReason:"ens_capability_revoked" });
  const { maxPerCall, allowedPayees } = JSON.parse(cap);
  const { amount, payTo } = paymentRequirements;
  if (BigInt(amount) > BigInt(maxPerCall))       return c.json({ isValid:false, invalidReason:"exceeds_ens_cap" });
  if (!allowedPayees.includes(payTo.toLowerCase())) return c.json({ isValid:false, invalidReason:"payee_not_in_ens_allowlist" });

  return c.json(base); // authorized → resource server proceeds to /settle
});
```

Key points: gate lives in `/verify` (cheapest, runs before `/settle`); revocation is instant because a cleared/absent `text` record → `ens_capability_revoked`; one Sepolia RPC read adds ~50–300ms; cache with a short TTL only if you want lower latency, but document that caching widens the revocation window. Privy policy on the agent key mirrors `maxPerCall`+`allowedPayees` as the independent second rail.

## V2 fact_check — Aftermarket
All three verified hands-on against primary docs. Here is the fact-check gate verdict.

---

## WARROOM FACT-CHECK: "Aftermarket" (ETHOnline 2026)

### CLAIM 1 — ATS as the tradeable call-credit primitive → **HARD-FAIL (recoverable via split-token workaround)**
- Hedera ATS issues **ERC-1400 security tokens** with baked-in **Control List + KYC/AML + Freeze/Lock** modules (docs.hedera.com/.../asset-tokenization-studio-ats; github.com/hashgraph/asset-tokenization-studio — "tokenized securities and equities").
- An AMM/bonding-curve pool is an unapproved address → transfers get **blocked** unless every trader is whitelisted. This directly kills "freely resellable."
- The bounty text is explicit: "🪙 Tokenization of Anything — $6,000… **Real asset classes and real lifecycle management will be favoured over a token with a name on it.**" A utility credit is exactly the thing it ranks *below* (ethglobal.com/events/ethonline2026/prizes, verified live).
- Plain **HTS fungible with no KYC/freeze key** is *permanently* permissionless (docs.hedera.com/.../define-a-token) — the correct primitive for the tradeable credit.

### CLAIM 2 — credit-burn as gas-free x402 redemption → **SOFT-FAIL (reframe "burn" → "transfer-to-treasury")**
- x402 `exact` scheme on Hedera settles as a **direct `TransferTransaction`** only; the facilitator rejects anything that isn't a transfer of the exact amount (github.com/coinbase/x402/.../scheme_exact_hedera.md). A literal `TokenBurnTransaction`-as-settlement fails verification and would need a bespoke `x402Scheme` subclass (not <1 day, breaks interop).
- **Gas-free-for-agent = VERIFIED:** client sends a partially-signed tx; the facilitator adds its sig as **feePayer** and submits. Blocky402 is a real hosted Hedera facilitator (`ExactHederaScheme`, testnet+mainnet) already used by other ETHOnline projects.
- Workaround (feasible in <1 day, config-only): price the endpoint in **1 CREDIT (HTS asset)**, `payTo = treasury`; per call the agent transfers 1 credit → treasury, facilitator settles gas-free, resource server writes the HCS log. Economically identical to a burn; optional real burn happens off the request path.

### CLAIM 3 — The Graph indexes Hedera to price the curve → **SOFT-FAIL (curve must live on an EVM chain The Graph supports)**
- **Hedera is NOT a supported network** on The Graph — absent from the Subgraphs/Substreams network table and the Token API scope (thegraph.com/docs/en/supported-networks; Token API → Pinax, EVM/Solana only). There is no first-party Graph path to Hedera data; Hedera's indexed data lives only in the Mirror Node REST API, which does not count.
- Bounty ($5K) confirmed: "compose two or more of The Graph's products… **Consume live data from a Graph provider. Mocked/local/static do not qualify.**" (ethglobal.com/events/ethonline2026/prizes).
- Honest path: deploy the **bonding-curve contract on Arbitrum or Base** (index there); keep **x402 payments on Hedera**. Compose **Subgraph + Subgraph MCP** (both on the same live Studio endpoint), or Subgraph + Substreams for heavier credit.

---

### OVERALL VERDICT (3 lines)
The core mechanic survives, but **not as pitched**: no single Hedera security-token can be the freely-traded credit, and The Graph cannot touch Hedera. The winning shape is a **cross-chain split** — HTS credit + EVM curve indexed by The Graph, x402 payments on Hedera, ATS repurposed to a real securities role. All three $6K/$6K/$5K legs remain reachable, but each requires the redesign below; do not build the literal single-chain single-token version.

### BUILD SPEC — Claim 1 (token primitive)
- **Credit token:** HTS fungible, 0 decimals, **no KYC key, no freeze key** (permanently permissionless) → tradeable on the bonding curve. This is the product; it never touches ATS.
- **ATS earn (load-bearing):** tokenize the **prepaid-USDC receivable book** (deferred API-call revenue) as an ATS ERC-1400/ERC-3643 security sold to KYC'd LPs who fund the reserve. Issue via ATS SDK/contracts, configure compliance + control list, run ≥1 lifecycle op on-chain (coupon distribution from redemption fees, or maturity redemption), deploy to Hedera testnet, verify on HashScan. Narrative: "permissionless credits generate a real receivable → tokenized as compliant institutional cashflow." Two tokens, two audiences, no conflict.

### BUILD SPEC — Claim 3 (Graph↔Hedera data path)
- **Curve contract on Arbitrum One or Base** (first-class Graph network) — emits Mint/Redeem/Trade events; each Hedera x402 paid call triggers a redemption event on this EVM contract so redemption velocity is on-chain where The Graph can see it.
- **Product 1:** live **Subgraph** (Studio endpoint) computing redemption-velocity + curve price as derived fields.
- **Product 2:** **Subgraph MCP** over that subgraph so the pricing agent queries velocity in natural language to reprice the curve — satisfies "compose ≥2 products + live data." (Swap MCP for a Substreams-powered subgraph if you want the heavier-engineering variant.)

## V2 fact_check — Backstock
All three claims verified hands-on against primary sources. Here is the fact-check gate verdict.

---

# WARROOM FACT-CHECK GATE — Backstock (ETHOnline 2026)

## CLAIM 1 — First-lien on next inbound x402 receipt
**SOFT-FAIL (workaround required)**
- Hedera x402 is real: official `@x402/hedera` v2.25.0 (org `x402-foundation`, dep `@hiero-ledger/sdk`), with a dedicated spec `scheme_exact_hedera.md`. Settlement is **native Hedera** (signed `TransferTransaction` of HBAR/HTS), NOT EIP-3009. Source: github.com/x402-foundation/x402, npm `@x402/hedera`.
- The exact scheme makes `payTo` **server-controlled and facilitator-verified**: verification rule MUSTs that "the transaction MUST transfer value... to the `payTo` account specified in `PaymentRequirements.payTo`." The client's sig covers destination; facilitator can't alter it.
- FATAL to the "in-code" framing: the borrower IS the resource-server earning the money, so **the borrower controls its own `payTo`**. Nothing at protocol level pins a third party's future `payTo`. A dishonest borrower spins up a new endpoint / re-advertises a different `payTo` and the splitter sees zero flow. The lien holds ONLY for flows the borrower voluntarily routes through the splitter → honesty/custody assumption, not cryptographic enforcement.

## CLAIM 2 — The Graph indexes Hedera x402 cashflow
**HARD-FAIL (as written) → SOFT-FAIL with redesign**
- The Graph does **NOT support Hedera** — absent from the official supported-networks list (60+ chains incl. Stellar, Base, Arbitrum; no Hedera mainnet/testnet/Hashio). Subgraphs, Substreams, and the Token API (now Pinax-hosted) all lack Hedera. Source: thegraph.com/docs/en/supported-networks.
- The claim "The Graph indexes Hedera cashflow" is **factually false**. You cannot have both "on Hedera" AND the Graph-Composable bounty.
- Honest paths: (A) **Deploy the splitter on Base/Arbitrum**, compose **Subgraph (splitter payment events → live per-agent revenue) + Token API (live USDC balances/transfers)** — wins the bounty with live data, no mocks. (B) Stay on Hedera, index via **Hedera Mirror Node REST API** (`/api/v1/contracts/{id}/results/logs`, live/public/no-auth) but DROP the Graph leg.

## CLAIM 3 — Loan note as Hedera ATS
**VERIFIED**
- ATS (Apache-2.0, Hashgraph) is purpose-built for tokenized securities on ERC-1400, with first-class `deployBond` and `deployEquity`. A bond IS a debt instrument. Source: github.com/hashgraph/asset-tokenization-studio.
- Verbatim mapping: principal = `nominalValue`×`numberOfUnits`; drawdown = `startingDate`; repayment = `maturityDate`; interest = `setCoupon` corporate action (confirmed in `ICoupon.sol`: `initializeCoupon`/`setCoupon`/`cancelCoupon`); settlement = maturity redemption. Zero-interest = zero-coupon bond. This exercises a real issuance + lifecycle op exactly as the bounty wants.
- Caveat: ATS carries KYC/compliance scaffolding — set permissive config for the demo, don't overclaim regulatory compliance.

---

## OVERALL VERDICT (3 lines)
Backstock's ATS leg is solid and its Hedera x402 payments are real, but two structural fixes are mandatory before build. The first-lien is NOT protocol-enforceable (payTo is server-controlled) — it needs a custody/enforcement redesign or it's unsecured-and-undercollateralized. The Graph-on-Hedera claim is outright false — the composable leg must move to Base/Arbitrum or be dropped.

## BUILD SPEC — Claim 1 (enforceable lien)
The lien is real ONLY if Backstock owns the enforcement point. Build one of:
1. **Splitter-as-mandatory-endpoint (recommended):** Loans are offered ONLY to agents whose earning endpoint's `payTo` is ALREADY the Backstock splitter contract, and Backstock hosts/proxies that endpoint (or holds the receiving key in escrow) so the borrower cannot re-advertise a different `payTo` without losing the endpoint. Splitter contract logic: on inbound receipt, `repay(Backstock, min(balance, outstanding))` FIRST, forward remainder to agent. This makes "repaid before the agent" true in code for all routed flow.
2. **Staked/escrowed backstop:** Require the borrower to escrow a partial collateral (e.g. 20-40%) at drawdown; the lien covers the shortfall, the escrow covers dodge-risk. Converts pure-unsecured into partially-secured.
3. Combine 1+2 for a defensible demo. Be honest in the submission that enforcement is via controlled-endpoint + escrow, NOT a protocol-native lien.

## RECOMMENDED 3-PRIZE COMBO
Given Claim 2 forces a chain decision, the cleanest winning combo:
- **Hedera x402 ($6K)** — payments/splitter settle via `@x402/hedera` (real). KEEP.
- **Hedera ATS ($6K)** — loan note as single-coupon/zero-coupon Bond (verbatim fit). KEEP.
- **Graph Composable ($5K)** — deploy a mirror/receipts splitter on **Base**, compose **Subgraph + Token API** on live data. This means running the indexed cashflow on Base while HCS+ATS+x402 stay on Hedera (dual-chain, defensible). 

If a dual-chain split is undesirable, swap the 3rd leg to **Privy server wallets** (lender treasury + agent wallet, confirmed server-controlled wallet API) and drop Graph entirely — keeping everything on Hedera. Best combo depends on appetite: **Hedera x402 + ATS + Graph(on Base)** maximizes prize value; **Hedera x402 + ATS + Privy** maximizes single-chain coherence.

## V2 cross_exam — Aftermarket attacks Leash
I now have everything needed. Both fact-checks, the four round-0 lens assessments, both briefs, both demo scripts, and the TASTE contract (U1, U2, U6).

I'm the adversarial advocate FOR Aftermarket attacking Leash. Let me build the attacks with the evidence in hand.

---

# ADVERSARIAL CROSS-EXAMINATION: Aftermarket ▶ Leash

The prosecution's target is Leash's central load-bearing claim, stated verbatim in its brief: *"the name IS the spend policy, clamped gas-free... editing a resolver instantly revokes payment authority."* Everything Leash is — its Originality 9, its two WOW moments, its ENSv2 $4.5K fit — rests on that sentence being TRUE and LEGIBLE. I attack both halves.

---

**[KILLING BLOW] The name is NOT the spend policy — your own server is. "Enforced" is a trust claim, not a chain claim.**

Leash's headline is "the name IS the spend policy, enforced." Its own fact-check (Claim 1b) rules the enforcement **facilitator-trusted, not chain-trustless** — a HARD-FAIL security caveat: "the Hedera settlement does not cryptographically verify the Ethereum state — a malicious facilitator could skip the check." So the honest restatement is *"the name is the spend policy, enforced only if you trust the server we run."* That is fatal on two TASTE laws at once. **U6 (integration depth is the strategy):** the ENS→payment link is an outbound `eth_call` in a Node handler — porting elsewhere means changing one RPC URL, the exact "surface-level SDK call" U6 says loses; the composition isn't load-bearing at the chain level, it's a convention inside one process. **U1 (real, no hash-of-a-thing-nobody-verifies):** a resolver record that only a cooperating facilitator honors is metadata nobody trustlessly verifies. Worse, the ENS engineer judging the $4.5K bullet is the single person most likely to ask "what stops a forked facilitator from ignoring the resolver?" — and the only true answer is "nothing." Evidence: deliberation L1503, L1528.
— *Leash's honest answer:* the brief's Privy leg is the "independent second rail" (interlock line: "leaked child key bypasses ENS" → Privy double-enforces); the fact-check says pitch it as "the facilitator we run/fork enforces the policy," with Privy as the second rail. So there ARE two enforcement points, not one.
— **STANDS (partially blunted).** The trustlessness of the *headline claim* is dead — "enforced" degrades to "enforced by two servers we run." Privy salvages defense-in-depth but does NOT restore the chain-trustless story the Originality-9 rests on. A sponsor engineer catches this in one question.

---

**[MAJOR] Privy is the load-bearing rail — which means ENS is decorative. Substitution test cuts the wrong leg off.**

Follow the attack above to its conclusion. If the ENS resolver read is facilitator-trusted (skippable), then the ONLY enforcement a leaked/malicious key genuinely can't bypass is **Privy's server-side policy engine** (fact-check Claim 3: "enforcement is server-side in Privy's infra, so a leaked child key still can't submit a violating tx"). Run Leash's own substitution test honestly: remove Privy → the sole non-bypassable rail is gone. Remove ENS → Privy still enforces the identical envelope (per-call cap + payee allowlist, both VERIFIED as native Privy rules). So the leg that survives removal is Privy, and ENS is the leg that's decoratively-deep — the reverse of what the pitch claims ("ENSv2 central"). That inverts the $4.5K ENS bullet: you're using an org's *naming system* as a spend-policy KV-store that a real policy engine already does better, natively, non-bypassably. Evidence: L1522, L1401 ("Privy is the swap-risk primitive"), brief interlock line L15.
— *Leash's answer:* ENS uniquely provides the **hierarchical, narrows-only capability tree** ("re-delegation can only NARROW") and instant org-wide revocation across many child agents in one write — Privy alone doesn't give you a namespace hierarchy.
— **ANSWERED, but at a cost.** The hierarchy/one-write-revocation is genuinely ENS-native and Privy can't replicate it. So ENS isn't pure decoration. BUT the fact-check (Claim 2b) explicitly warns EAC is **reversible role-based, NOT ENSv1-fuse one-way narrowing** — "Do NOT claim narrows-only." The brief's core "re-delegation can only NARROW" line is factually overstated per Leash's own gate. The attack forces Leash to soften its signature claim.

---

**[MAJOR] The wow is a permission graph — an invisible property proved by a negative, in an async video with no narrator to lean on.**

CRAFT scored Leash 6.2 and named the exact defect: "the wow is a *permission graph* — an invisible property... proving-a-negative risk (can't overspend)." U2 is absolute: "the judge must SEE it work in ~3 minutes WITHOUT explanation." Leash's two WOWs are both negatives — a payment that DOESN'T happen ($50 refused) and spending that DIES on a resolver edit. On screen a refused payment looks identical to a broken button; "revoke → fails closed" looks identical to "the demo crashed." This is judged async on video — there is no live Q&A to rescue an ambiguous frame, and ETHGlobal caps human-voice narration, so the judge must *read* the concept off a table rather than *watch money move*. Contrast Aftermarket (CRAFT flag notwithstanding): USDC visibly flows IN on a buy, a credit visibly BURNS on redemption, USDC flows back OUT on a resell — every beat is a positive money event on screen. Evidence: L1453, L1461 (Leash named among "properties-not-events"), U2 at base-stack L6.
— *Leash's answer:* demo script beat 0:30–1:20 shows "$3 succeeds, then $50 → facilitator REFUSES" as a paired contrast, and the revoke beat shows "the very next IDENTICAL payment FAILS CLOSED" — the A/B framing makes the negative legible without narration.
— **ANSWERED (thinly).** The A/B contrast (same payment, one succeeds one fails after an edit) IS the correct craft technique and does make the negative visible. But it costs two of three demo minutes to establish, leaving the "namespace = treasury graph" concept — the actual Originality-9 idea — narrated, not shown. CRAFT's 6.2 stands as the pool's near-lowest legibility score for a reason.

---

**[MINOR] Lower prize EV ($13K vs $17K) for a strictly harder-to-demo product.**

Under the user's prize-EV criterion, Leash's combo is ENS $4.5K + Hedera x402 $6K + Privy $2.5K = **$13K**, the lowest-value combo among the strong finalists; Aftermarket's ATS $6K + x402 $6K + Graph $5K = **$17K**. Leash isn't just $4K lighter — it pays less for a product that CRAFT rated *harder* to make legible (6.2 vs Aftermarket's 6.6) and whose top prize bullet is under live attack (see killing blow). EV = probability-of-winning-the-bullet × bullet-value, and Leash is lower on both factors for its headline ENS bullet.
— *Leash's answer:* higher Originality (9 vs 8 in three of four lenses) and zero beta/mocked dependencies (fact-check: "no beta deps," all three primitives live on Sepolia/Privy/facilitator today) — a cleaner, lower-risk ship than several rivals, and Originality is 20% of the finalist rubric.
— **ANSWERED.** The EV gap is real but not disqualifying; Leash trades $4K and legibility for originality and ship-safety. This is a preference argument, not a kill.

---

## SUMMARY (3 lines)

One killing blow lands and holds: Leash's central claim "the name IS the spend policy, **enforced**" is downgraded by its own fact-check to "enforced only if you trust the server we run" — the ENS→payment link is facilitator-trusted, not chain-trustless, making it a U6 depth failure and a U1 verifiability failure that the ENS sponsor engineer is uniquely positioned to expose in one question. Privy's second rail rescues defense-in-depth but *inverts* the pitch — the non-bypassable enforcement is Privy, not ENS, so the $4.5K "ENS-central" bullet rests on a naming-system-as-KV-store stretch while ENS's genuinely-native contribution (the hierarchy) is exactly the "narrows-only" claim the fact-check says is overstated. The trustlessness of Leash's headline does not survive; its remaining defensible core (org-wide one-write revocation across a child-name tree) is real but smaller, harder to show async (CRAFT 6.2, all-negatives demo), and worth $4K less than Aftermarket.

## V2 Leash-attacks-Aftermarket
I have all the material I need. Now I'll build the adversarial case for Leash attacking Aftermarket.

Let me synthesize the load-bearing claims and their weaknesses:

**Aftermarket's core pitch** (round0): a single-chain, single-token product — ATS "call-credit" on a bonding curve, gas-free Blocky402 redemption, HCS notarization, Graph indexes usage. The "who buys revenue tokens" fix is the WOW.

**Fact-check reality**: Claim 1 HARD-FAIL (ATS can't be the tradeable credit — it's a security token with KYC/freeze that blocks the AMM pool; bounty explicitly ranks utility credits BELOW real securities). Claim 3 SOFT-FAIL (Graph can't touch Hedera — curve must move to Base/Arbitrum). The recovery is a cross-chain split: HTS credit + EVM curve on Base + ATS repurposed to tokenize the prepaid-USDC receivable book + x402 on Hedera.

Now I have enough to write the attacks.

---

## LEASH vs AFTERMARKET — Cross-Examination

**[KILLING BLOW] The redesign shatters "one coherent product" into a three-chain assembly a solo dev ships stubbed in 3.5 days**
Aftermarket was pitched (round0-pool line 8-10) as ONE thing: an ATS credit on a curve, redeemed gas-free, indexed by Graph — single-chain elegance. The fact-check detonates that: Claim 1 is a HARD-FAIL (ATS is an ERC-1400 security with Control List + KYC/freeze; the AMM pool is an unapproved address so transfers are *blocked* — "freely resellable" dies) and Claim 3 is a SOFT-FAIL (Hedera is *not* a Graph-supported network). The only survival path the fact-check itself prescribes is a cross-chain split: HTS credit + a bonding-curve contract on Base/Arbitrum + ATS *repurposed* to tokenize a receivable book + x402 on Hedera + a Base subgraph + Subgraph MCP. That is four deploy surfaces and a cross-chain event bridge (each Hedera x402 call must "trigger a redemption event on this EVM contract" — the fact-check's own words) for a solo builder with ~3.5 days. Leash's three legs all live at 30min–2h ramp with zero beta and one clean seam (round_0 DEPTH line 1420, 1432). Aftermarket now has to *invent a cross-chain relay that didn't exist in the brief* just to make the Graph leg real.
— **What Aftermarket's material answers (honest):** DEPTH (1431) and SPEC (1400) both scored it "every leg forkable/low-beta, ZERO beta risk" — the bonding curve is standard Solidity, Blocky402 PoC repos exist, HTS is trivial. None of the pieces is individually hard. The fact-check labels every fail "recoverable" and hands a config-only workaround for Claim 2.
— **Verdict: STANDS (softened).** No single piece is beta-risky, but the *coherence* claim is dead: the brief's single-chain single-token product is now a Hedera↔Base split joined by a bespoke cross-chain redemption-event bridge. That bridge is net-new integration surface that appears in no round_0 score, and it is exactly the kind of glue a solo dev ships as a stub. The WOW was "one liquid instrument"; the truth is a distributed system.

**[HEAVY HIT] After the redesign the sponsors are a cross-chain bag of parts, not the "very deep" interlock the bounties reward**
U6 is the pool's own law: "porting elsewhere means rebuilding… surface-level SDK calls lose" (base-stack line 10). Post-fix, Aftermarket's three prizes live on *different chains doing unrelated jobs*: x402 settles on Hedera, the curve+Graph live on Base, and ATS is demoted from "the product" to tokenizing a side receivable book sold to KYC'd LPs (fact-check BUILD SPEC — Claim 1). Remove any one and the other two are untouched — the substitution test that ATS was supposed to pass now passes trivially in reverse: they don't interlock, they coexist. Contrast Leash, where the fact-check confirms the interlock is genuine protocol composition — "the facilitator READS the ENSv2 Permissioned Resolver *before* sponsoring settlement… editing a resolver record instantly revokes payment authority" (DEPTH 1438); pull ENS and Blocky402 has nothing to authorize against.
— **What Aftermarket's material answers (honest):** the fact-check narrative genuinely re-links two legs — "permissionless credits generate a real receivable → tokenized as compliant institutional cashflow" — so ATS isn't *totally* bolted on; it consumes the credit system's output. And WILD (1473) still rates its core mechanism-fix novelty 9/10, higher than Leash's.
— **Verdict: STANDS.** The credit→receivable→ATS story is a narrative bridge, not a load-bearing one: the credit curve on Base runs fully without an ATS security ever being minted. WILD's own SPEC pass already flagged the sibling idea's ATS as "bolted on to reach the third $6K pot" (1411); the same charge lands here post-redesign. Three sponsors, three chains, one narration holding them together — that is the "bag of parts" U6 warns against.

**[HEAVY HIT] Two-chain demo legibility collapses in a 2–4min video**
U2 demands the judge SEE it work in ~3 minutes without explanation (base-stack 6). Aftermarket's own demo script (demo-scripts 3-7) was written for the *dead* single-chain version — buy on curve, redeem gas-free, resell, Graph dashboard, all one screen. The redesign forces the camera to cross chains mid-demo: mint the HTS credit on Hedera, transfer-to-treasury on Hedera x402, but the *curve price move and redemption velocity* the WOW depends on now render on a Base subgraph fed by a cross-chain-triggered redemption event. The judge must hold two block explorers (HashScan + a Base indexer) and trust that a Hedera call produced the Base event. CRAFT already scored the *original, simpler* version only 6.6 and warned "owning usage not dividends needs the curve + redemption-velocity story narrated" (1452). Add a chain hop and the narration cost climbs past the 2–4min budget. Leash's killer beat is a single visible revert — "edit resolver → the very next identical payment FAILS CLOSED live" (demo-scripts 18) — one screen, one money event.
— **What Aftermarket's material answers (honest):** money genuinely moves on screen (real USDC into the curve, HashScan-verified mint) — CRAFT credits it "Money moves on screen though" (1452), a real advantage over Leash's proving-a-negative problem (CRAFT 1453 dinged Leash: "can't overspend" is a negative to assert).
— **Verdict: STANDS.** Visible money is an edge, but the redesign spends it: the resell/velocity WOW — the whole "liquid resellable instrument" payoff — now depends on a cross-chain event landing on a second explorer inside a 3-minute window. That is more explanation cost than the original 6.6-CRAFT script, which was already the version that "needs narration."

**[FLESH WOUND] The ATS-repurposed receivable-book leg quietly reintroduces the "who buys it" problem the idea existed to solve**
Aftermarket's entire reason to exist (round0 line 9) is the mechanism-fix: "the day-1 buyer is a USER who wants cheaper future calls, not a speculator (fixes the 'who buys revenue tokens' problem)." That fix applies *only to the HTS credit*. But the fact-check's ATS leg re-introduces a securities instrument sold "to KYC'd LPs who fund the reserve" — i.e., an investor buying future deferred revenue. That is precisely a revenue/receivable token whose buyer is a speculator/financier, not a user — the exact "who buys it" question, now reopened on the ATS leg the redesign made load-bearing for the $6K pot.
— **What Aftermarket's material answers (honest):** the two audiences are genuinely separate — "two tokens, two audiences, no conflict" (fact-check BUILD SPEC). The USER buys credits; the LP buys the receivable. The core product's buyer is still a real user, so the headline fix survives on the leg that matters for the WOW.
— **Verdict: ANSWERED (partially).** The split is real and the *demo's* buyer is a user, so the WOW isn't falsified. But the concern isn't nothing: the third prize now literally rests on selling a deferred-revenue security to financiers — the shape the pitch claimed to have transcended. In a sponsor Q&A ("who buys your ATS security, and isn't that the speculator you said you fixed?") it's an awkward beat, not a kill.

---

**3-line summary:**
One KILLING BLOW attempt lands as STANDS-softened: Aftermarket's pitched single-chain single-token product does not survive its own fact-check — recovery forces a Hedera↔Base split joined by a net-new cross-chain redemption-event bridge that appears in no round_0 score and is prime stub-it-to-ship territory for a solo dev in 3.5 days. Two HEAVY HITs also stand (sponsors become a cross-chain bag of parts failing U6's deep-interlock bar; two-chain demo blows the U2 legibility budget the original 6.6-CRAFT script already strained). The FLESH WOUND is ANSWERED — the two-token split keeps the user-buyer WOW intact, though the ATS leg does reopen "who buys it" for the financier tier. Net: no clean one-shot kill, but the load-bearing "one coherent product / very deep interlock" claims are structurally broken, and Leash's zero-beta single-seam interlock is the cleaner U6/U2 story.

## V2 challenge-Leash
I have everything I need. Here is the adversarial assessment.

---

# CHALLENGE-PASS ADVERSARY — Leash (ETHOnline 2026 V2)

## 1. STRONGEST CASE AGAINST

The core enforcement claim is **facilitator-trusted, not chain-trustless** — the fact_check itself flags this as a SOFT→HARD caveat: Hedera settlement never cryptographically verifies Ethereum state, so a forked/malicious facilitator can simply skip the ENS read. This is **eloquence-over-evidence**: the pitch's headline "the name IS the spend policy, clamped gas-free" dresses up an off-chain `if`-statement in one Hono handler as a trust primitive. The ENSv2 judge tests against their *own* bullet, and here ENS is used as a **generic KV spend-store** — a slight bend of ENS's naming purpose (any Redis/onchain-map would hold `{maxPerCall, allowedPayees}` identically); the substitution test is weak because ENS is doing storage, not naming, and EAC/Permissioned-Resolver depth must be *earned* in the demo, not asserted. **Demo legibility is the real risk (U2 violation vector):** the killer property is an *invisible negative* — "this payment did NOT happen because a resolver record said no." Judges see a refusal, not a mechanism; the WOW is a `402` that requires narration to land, which is precisely **scope-fantasy** dressed as WOW. Cross-chain moving parts (ENS-Sepolia `eth_call` → Hedera facilitator → Privy mirror) triple the live-demo failure surface with no interop payoff the judges reward. The fact_check also **corrected a load-bearing claim mid-flight** — "re-delegation narrows-only" is FALSE; EAC is *reversible roles*, not one-way fuses — meaning demo-script beat 2:10-3:00 ("mint grandchild with HIGHER cap → reverts") may not fire as scripted, a **premature-convergence** artifact where the pitch locked before the primitive was understood. On the FORBIDDEN Backstop shape: I **concede it is genuinely distinct** — Backstop co-signs at *execution* (a guardian evaluating each tx live); Leash is *attenuation-at-grant* (policy baked into a name, read passively). It is not a guardian. But note the Privy layer ("double-enforces the same envelope") drifts *toward* the co-signer shape and should stay a passive policy mirror, not an active approver, or it re-collides.

## 2. PREMORTEM — "It is Sep 14 2026, we submitted Leash and LOST."

1. **The ENS judge scored it a KV-store, not ENSv2.** The engineer read "we store a JSON blob in a text record and one `eth_call` reads it" and concluded ENS naming/EAC/Permissioned-Resolver depth was cosmetic — any key-value store substitutes. Leash lost the $4.5K because the resolver was a database, not the product; the *hierarchy* (parent→child capability tree) was asserted in narration but the demo only showed one child name.

2. **The trust caveat became the whole Q&A.** A judge asked "so a forked facilitator just deletes your ENS check and pays anyway — what stops that?" The honest answer ("nothing on-chain; you trust the facilitator you run") deflated the "the name kills payment authority everywhere" claim. The Hedera x402 bullet went to a project whose settlement was self-contained on Hedera, not gated by an off-chain read of another chain.

3. **The revoke demo didn't fail-close on camera.** A short resolver-read TTL cache (added for latency) meant the revoked record was still served from cache; the "very next payment FAILS CLOSED" beat paid through instead. Or the Sepolia RPC hiccuped mid-demo and the facilitator fell back to allow/errored ambiguously — the single most important 40 seconds of the video looked broken.

4. **EAC "narrows-only" claim was wrong and a judge knew it.** The pitch asserted structural one-way attenuation; the ENS engineer knew EAC is reversible role-based grants (not v1 fuses). The "re-delegation can only NARROW" WOW #2 was factually rebutted live, and the whole "attenuation is structural" thesis lost credibility.

5. **Three-sponsor surface fractured under 4.5-day solo build.** ENSv2 beta + forked Hedera facilitator + Privy policy engine = three unfamiliar-in-detail integrations; the Privy layer got a stub ("double-enforcement shown" but a screenshot, not a live leaked-key test), tripping the [C]-no-mocked-integrations kill on the Privy B2B bullet. Two of three prizes came in thin.

## 3. RISK REGISTER

| Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| ENS read is facilitator-trusted, not chain-enforced — collapses the headline claim in Q&A | **CRITICAL** | HIGH | ENSv2 + Hedera bullets both wounded; core thesis is an off-chain `if` | Reframe honestly as "the facilitator you fork enforces it; Privy is the independent second rail." **Cannot be made trustless in-window** — do NOT claim on-chain enforcement. *(Selection-veto candidate: unmitigable at the trust layer; survives only as an honest dual-rail story.)* |
| ENS used as generic KV spend-store → judge sees a database, not ENSv2 depth | **HIGH** | MED-HIGH | Loses $4.5K primary | Demo the *hierarchy*: parent + ≥2 children with different caps, show Permissioned-Resolver per-record permissions + EAC role revoke as the mechanism, not just `text()` read |
| Invisible-negative WOW (payment refused) is illegible in ≤3 min (U2) | **HIGH** | MED-HIGH | Kills Usability/WOW 40% of finalist score | Split-screen: resolver record on one side, live `402 exceeds_ens_cap` on the other; edit the record on camera → same call flips to pass/fail |
| "EAC narrows-only / re-delegation reverts" is factually wrong (EAC = reversible roles) | **HIGH** | MED | Live factual rebuttal by ENS engineer destroys credibility | Rewrite beat 2:10-3:00 to demo *reversible role revoke* (true), drop the "grandchild higher cap reverts" fuse claim |
| Revoke demo fails to fail-close (RPC hiccup or TTL cache serves stale allow) | **HIGH** | MED | The signature 40 seconds looks broken on video | No cache for the demo path; retry+explicit-error on RPC fail (never fall back to allow); rehearse the revoke beat 5+ times |
| Privy layer ships as a stub, tripping no-mocked-integration kill on B2B bullet | MED | MED | Loses $2.5K; possible DQ on that prize | Prove a live leaked-key test: same child key submits an over-cap tx → Privy policy DENY on camera |
| Cross-chain moving parts (Sepolia RPC + Hedera facilitator + Privy) multiply live-failure surface | MED | MED | Any one flaky → demo stalls | Pre-warm RPC, pin block, record with fallbacks; keep the ENS read synchronous and logged |
| Privy "double-enforcement" drifts toward FORBIDDEN Backstop co-signer shape | LOW-MED | LOW | Self-duplication kill (#15) if Privy becomes an active per-tx approver | Keep Privy a *passive policy mirror* (static allow/deny rules), not an LLM/quorum evaluating each tx live |

**Selection-veto flag:** Row 1 is CRITICAL-and-unmitigable *at the trust layer* — the cross-chain enforcement can never be made trustless in 4.5 days. It is survivable ONLY if the pitch commits, up front and in the demo narration, to the honest "facilitator-trusted + Privy independent second rail" framing. If the team pitches "the chain enforces it," this idea should be vetoed. If they pitch the honest dual-rail version and fix the EAC-reversibility factual error, it clears — but the burden is on demonstrated honesty plus hierarchy-depth, not eloquence.

## V2 challenge-Aftermarket
I have everything I need. The full fact-check reveals the redesign. Now I'll produce the adversarial analysis.

---

# ADVERSARY PACK — "Aftermarket" (ETHOnline 2026 V2)

## 1. STRONGEST CASE AGAINST

The fact-check triple-failure (CLAIM 1 HARD-FAIL, CLAIMS 2 & 3 SOFT-FAIL) doesn't dent the pitch — it **detonates the topology**. The recovered build spec is now a THREE-CHAIN artifact: HTS credit + permissionless bonding curve on Base/Arbitrum + ATS ERC-3643 receivable-book on Hedera + Blocky402 x402 settlement on Hedera + Subgraph + Subgraph-MCP. That is 6 load-bearing subsystems across 2 chains and 3 sponsor prize surfaces for a solo dev in ~3.5 days — **scope-fantasy under U5** ("buildable fast, defensible in Q&A"). The interlock also **fractured**: the original one-sentence composition ("prepaid calls as a liquid instrument") is now two disjoint token economies bolted at a treasury — the HTS credit "never touches ATS" (spec's own words), so ATS is a **parallel appendage, not an interlock**. That fails U6 (one deep interlock, not a bag of parts) and reintroduces exactly the **C13 "who buys it" problem** the idea was invented to fix: the ATS receivable-bond is a revenue-token sold to KYC'd LPs — the demo has NO named KYC'd LP buyer on Sep 13, so the ATS leg is a **mocked demand sink** (C-DF1 / U7 violation: seeded state contradicting the core claim). The cross-chain event bridge (each Hedera x402 call must trigger a Base/Arbitrum redemption event so The Graph can index velocity) is an **unspecified trusted relayer** — if it's a script the dev calls, the "curve tracks REAL usage" claim is fabricated (U1/U7); if it's trustless it's another day of build. Finally, **demo legibility (U2)**: 2–4 min must show a Base curve trade, a Hedera gas-free redemption, a cross-chain event landing, a live Subgraph, AND an ATS lifecycle op — five contexts, two chains, two HashScan/explorer tabs. Judges from three different sponsors each see only their own leg working and none see the whole; the Hedera judge sees ATS as "a token with a name on it" (the exact anti-pattern the $6K bounty ranks below).

## 2. PREMORTEM — "It is Sep 14 2026, we submitted Aftermarket and LOST."

1. **The cross-chain event relay was the demo, and it was a `cast send` script.** We couldn't build trustless Hedera→Base event mirroring in time, so redemption velocity on the Base curve was written by a keeper the dev ran manually. The Graph judge asked "what writes these Redeem events?" in Q&A, the answer was "our relayer," and the "curve tracks real usage" claim collapsed to fabricated state (U7). Graph $5K lost.

2. **ATS ate 1.5 days and still read as a bolt-on.** ERC-3643 compliance modules (Control List, KYC identity registry, lifecycle ops) are heavier than the 1-day spec assumed. It shipped on testnet with a single self-issued "coupon distribution" and zero real KYC'd LP. The Hedera ATS judge scored it "a token with a name on it" — the literal disqualifier in the $6K bounty text. $6K lost, and it stole the time the curve/demo needed.

3. **Three-chain deploy fragmented the 3-minute demo past comprehension.** Judges watched a Base MetaMask trade, then a Hedera agent redemption, then had to trust an off-screen relay, then a Graph dashboard, then an ATS explorer tab. No single judge saw an end-to-end interlock; each sponsor saw their primitive used shallowly. Usability + WOW cratered (20% each in the finalist rubric).

4. **A single-chain competitor beat us on every axis.** Another entrant did pure Hedera x402 + HTS + HCS with ONE tight interlock, demoed it start-to-finish in 2 minutes, and the Hedera x402 judge gave it the $6K because it was legible and native. Our x402 leg was correct but buried under the cross-chain plumbing.

5. **x402 "burn-as-redemption" reframe leaked into the pitch.** The narrative still said "credit is burned on redemption," but the shipped path was transfer-to-treasury (per the CLAIM 2 workaround). A judge caught the mismatch between the video narration and the on-chain `TransferTransaction`, and flagged it as an overstated claim — credibility hit that tainted the other legs.

## 3. RISK REGISTER

| Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Cross-chain Hedera→Base redemption-event relay is a trusted script → "tracks real usage" is fabricated | **CRITICAL** | High | Graph $5K lost + U7 credibility taint on whole project | Make the relay observable & honest: index the Base curve's OWN on-chain trades (buy/sell) as the velocity signal, don't claim Hedera-call→curve causality unless the relay is on-camera and labeled "off-chain oracle." Drop the causality claim in narration. |
| ATS receivable-book is a parallel appendage, not an interlock (HTS "never touches ATS") | **CRITICAL — largely unmitigable in window** | High | Fails U6; Hedera ATS $6K scored as "token with a name on it" | Cannot forge a true interlock in 3.5d. Least-bad: make ATS reserve literally FUND curve buybacks so removing it breaks the curve floor — but this is new mechanism + build risk. Otherwise **cut ATS**, retarget the 3rd prize to Hedera OSS-Harness ($2K) or HCS-native, accept lower prize ceiling for a tight 2-leg interlock. |
| 6 subsystems / 2–3 chains for solo dev in 3.5d | High | High | Incomplete build; one leg stubbed → whole submission reads mocked | Ruthless cut to 2 chains max. Freeze scope Day 1: Base curve + Hedera x402 + ONE Graph product. Treat ATS + 2nd Graph product as stretch, not baseline. |
| Demo illegible across 2 chains + 2 explorers in ≤4 min (U2) | High | Med-High | Usability/WOW tank (40% of finalist score) | Single continuous screen: agent redeems on Hedera → same UI live-updates Base curve via the Subgraph. Never cut between raw explorer tabs; overlay one unified dashboard. |
| No named KYC'd LP buyer for ATS bond on Sep 13 (C13 reintroduced) | High | High | ATS demand sink is seeded/mocked (C-DF1) | If ATS kept, demo must show a REAL second wallet (KYC'd via ATS identity registry) actually buying the bond with real testnet USDC — else cut the leg. |
| Narration "burn" vs on-chain "transfer-to-treasury" mismatch | Med | Med | Overstated-claim flag in judging | Rewrite script to "credit transfers to treasury (economically a burn)"; optionally fire a real off-path `TokenBurn` and show it, so both are true. |
| Blocky402 facilitator (3rd-party hosted) down/rate-limited during recording | Med | Low-Med | x402 gas-free leg — the WOW — fails live | Pre-record the gas-free redemption; keep a local facilitator fallback; verify feePayer sig flow 24h before. |
| Graph Subgraph indexing lag on fresh Base deploy | Low-Med | Med | "live data" leg looks empty in demo | Deploy curve + subgraph Day 2, seed real trades early so the index is warm and populated by record time. |

**Bottom line:** two CRITICAL findings — the cross-chain velocity relay (fabricated-state risk) and the ATS-as-appendage (unmitigable-interlock risk, and the very C13 problem the redesign was meant to solve). The honest path forward is to **collapse to a 2-leg tight interlock** (Base HTS curve + Hedera gas-free x402 + one Graph product), drop or radically reground the ATS leg, and stop claiming Hedera-usage→curve-price causality unless the relay is on-camera and labeled.

## V2 challenge — Backstock
I have everything I need. Let me also confirm the AgentTreasury forbidden-shape wording (already captured in base-stack line 33: "self-funding agent treasury loop"). I have enough to produce the adversarial verdict.

---

# CHALLENGE-PASS ADVERSARY — "Backstock"

## 1. STRONGEST CASE AGAINST

The thesis is "force-repaid from the next receipt, no trust" (demo-scripts §Backstock 0:40, "non-custodial lien") — and the fact-check **guts exactly that word**. Claim 1 is SOFT-FAIL: `payTo` is server-controlled and the *borrower is itself the resource-server earning the money* (transcript 1608), so nothing at protocol level pins its future receipts to the splitter. The only honest fix is the build-spec's "controlled-endpoint + escrow" (transcript 1629-1631) — which means **Backstock hosts the borrower's earning endpoint or escrows its receiving key**. That is a *custodial credit desk*, not a trustless lien: the novel WOW claim ("no trust") collapses into "we hold your money and pay ourselves first," a pattern a sponsor engineer will name instantly in Q&A. **Novelty-collapse** under its own fact-check.

Second seam: **undercollateralized lending, solo, in 3.5 days.** "Undercollateralized working capital... priced off live indexed cashflow" (round0 §Backstock) requires the two hardest primitives in credit — default modeling and liquidation — and Backstock ships *neither*. The demo shows only the happy path (agent earns $10, repays $3). There is **no dodge scenario, no liquidation, no default handling on camera** (demo-scripts 0:40-2:40). Against Chainlink's *Liquidation challenge* mindset and any credit-savvy judge, this is a **thesis-hole**: the entire risk of undercollateralized lending is the borrower who *doesn't* repay, and that path is unbuilt and undemoed.

Third: the **Graph-on-Hedera claim is outright false** (Claim 2 HARD-FAIL, transcript 1612-1613 — The Graph does not support Hedera). The interlock in round0 asserts "Graph indexes each agent's live inbound cashflow"; that leg *cannot exist on Hedera*. The forced fix is **dual-chain** (splitter on Base for Graph, HCS/ATS/x402 on Hedera — transcript 1637), doubling deploy surface and creating a **cross-chain cashflow-truth gap**: the credit limit is priced off Base-indexed flow while loans settle on Hedera, so the underwriting data and the money live on different chains. **Integration-incoherence** and a Q&A landmine ("which chain is the receipt actually on?").

Fourth: **forbidden-shape adjacency.** Base-stack line 33 bans "self-funding agent treasury loop (AgentTreasury)." Backstock is **distinct — argue and win**: AgentTreasury is one agent recycling *its own* capital into a self-referential yield loop; Backstock is a *third-party lender* fronting *external* capital to a *different* agent (employer→worker credit), with a repayment obligation across two parties. The shape is *inter-agent credit*, not self-funding. **Concede nothing here** — but note the pitch must foreground the two-party lend/borrow relationship or a lazy reviewer pattern-matches it to the banned loop.

## 2. PREMORTEM — "It is Sep 14 2026, we submitted Backstock and LOST."

1. **The Hedera x402 engineer killed us in round 2.** They asked "show me the lien enforce when the borrower re-advertises a new `payTo`." We couldn't — because it can't (transcript 1608). Our "non-custodial lien" narration was provably false, and the honest answer ("we escrow the key") revealed a custodial desk. WOW score cratered; Originality followed.

2. **We ran out of time on the dual-chain split and shipped Hedera-only, dropping Graph.** The Base splitter + Subgraph + Token API stack (transcript 1637) was a second full deploy we couldn't finish in 3.5 days alongside ATS bond issuance. We fell back to Mirror Node (path B) and **lost the $5K Graph Composable prize entirely** — one of three load-bearing legs gone, and the "live-data-priced" claim reduced to a REST poll.

3. **The demo only showed repayment; a judge asked "what happens when they don't pay?"** We had no liquidation, no default path, no dodge handling. Undercollateralized lending with zero downside logic read as **a toy, not credit**. Practicality scored low across every sponsor because the hard 80% of lending was absent.

4. **ATS KYC/compliance scaffolding ate a day and half-worked.** ATS carries KYC gating (transcript 1620); wiring permissive config for a gas-free agent borrower without a real identity fought the framework. The bond issued but the lifecycle op (coupon/maturity) was flaky on camera, undercutting the one VERIFIED leg.

5. **A reviewer pattern-matched it to AgentTreasury.** Because the pitch led with "working capital for agents" instead of the two-party employer→worker credit relationship, a busy judge flagged it as the banned self-funding-loop shape (base-stack line 33) and it never got a fair read on merits.

## 3. RISK REGISTER

| risk | severity | likelihood | impact | mitigation |
|---|---|---|---|---|
| Lien not protocol-enforceable; "non-custodial / no trust" claim is false (Claim 1 SOFT-FAIL) | **CRITICAL** | High | Guts WOW+Originality thesis; direct Q&A kill by x402 engineer | Rebuild as controlled-endpoint + 20-40% escrow (transcript 1629-1631); **re-narrate honestly** as "custodial-repayment credit desk," drop "no trust" language entirely |
| Graph does not index Hedera (Claim 2 HARD-FAIL) | High | Certain (fact) | Loses $5K Graph leg OR forces dual-chain | Deploy splitter on Base for Subgraph+Token API (transcript 1637); accept dual-chain and pre-script the "why two chains" answer |
| No default/liquidation logic — only happy path demoed | High | High | Reads as toy; kills Practicality; wastes Chainlink liquidation angle | Build + demo ONE dodge scenario: borrower dodges → escrow seized → HCS-notarized default; make downside visible on camera |
| Dual-chain deploy exceeds 3.5-day solo budget | High | Med-High | Unfinished Graph leg or broken Hedera↔Base coherence | Timebox: Hedera x402+ATS core first (must-ship), Base+Graph as final leg; if slipping, fall to Mirror Node (path B) and reframe as 2-prize |
| ATS KYC/compliance scaffolding blocks gas-free agent borrower | Med | Med | Flaky bond lifecycle on camera; day lost | Permissive demo config; pre-issue the zero-coupon bond; **don't overclaim regulatory compliance** (transcript 1620) |
| Pattern-matched to forbidden AgentTreasury self-funding loop | Med | Med | Unfair reject by lazy reviewer | Lead pitch with two-party employer→worker credit relationship; explicitly contrast vs self-funding loop in submission |
| Cross-chain cashflow-truth gap (limit priced on Base, loans settle Hedera) | Med | High (if dual-chain) | Q&A incoherence on "where is the receipt" | Document the split explicitly; assert Base indexes a mirror of settled flow, keep authoritative settlement on one chain |

**CRITICAL-and-hardest-to-mitigate:** the lien non-enforceability (row 1). It is *mitigable* but only by conceding the headline claim — the escrow/controlled-endpoint fix works technically, yet it converts Backstock from "trustless force-repay" (its entire WOW) into a custodial credit desk that is materially less novel. Every downstream score (Originality, WOW, and the sponsor's own qualification read) is gated on how honestly and cleverly this concession is re-narrated. Recommend PASS-WITH-MANDATE: build only if the pitch is rewritten around *earned custody* (controlled endpoint + escrow + visible default path) rather than *trustlessness*.

## V2 cross_exam + challenge ADJUDICATION + SELECTION (main context)
Round-0 baseline: Aftermarket 7.30, Leash 7.20, Backstock 6.75.
CROSS-EXAM (both KBs landed):
- vs Aftermarket: KB STANDS (structural) — fact-check HARD-FAIL detonates the single-chain single-token product into a 3-chain assembly (HTS credit + Base curve + ATS-appendage + x402) joined by a NET-NEW cross-chain redemption-event relay (fabricated-state risk). Fails the user's VERY-DEEP-INTEGRATION mandate: recovery = cut ATS to a 2-leg idea OR build a trusted relay. U6 "bag of parts" + U2 two-chain illegibility.
- vs Leash: KB STANDS-SOFTENED (framing) — enforcement is facilitator-trusted not chain-trustless; Privy is the non-bypassable rail (ENS-central pitch inverted); demo all-negatives (CRAFT 6.2). MITIGABLE: fact-check itself prescribes honest "forked-facilitator + Privy dual-rail" framing; interlock is genuine (facilitator reads resolver PRE-settlement); EAC factual fix (reversible roles, not fuses) + hierarchy demo required.
CHALLENGE severity:
- Aftermarket: 2 CRITICAL, one LARGELY UNMITIGABLE-in-window (ATS-appendage: can't forge interlock; fix cuts $6K + reopens C13).
- Leash: 1 CRITICAL, MITIGABLE (honest dual-rail framing; PASS if pitched honestly, VETO only if pitched "chain-enforced").
- Backstock: 1 CRITICAL, mitigable-only-by-conceding-novelty (custodial desk) + Graph HARD-FAIL + no default logic demoed.
FLIP 1<->2: YES. Aftermarket's break is structural + violates the round's own mandate; Leash's wound is honestly resolvable and its interlock survives. 
YC PQ: Leash 4/6 (org agent-fleet treasury control, API-key-sprawl is a real B2B pain, day-1 users = any team running multiple agents on a shared budget), Aftermarket 4/6, Backstock 3/6 — all above floor.
Concern [C] enforcement (winner Leash): real humans (orgs running agent fleets) PASS; day-1 users exist PASS; significant problem PASS; uniqueness 0-1 collision PASS; #15 no-forbidden-shape PASS (attenuation-at-grant, NOT Backstop's co-sign-at-execution — Privy MUST stay a passive policy mirror, baked as non-negotiable).
WINNER: Leash (selectionPath scored_pool, flipped via cross-exam+challenge). Backup: Aftermarket (if a 2-leg tight-interlock rebuild is acceptable). 
DISSENT (WILD/DEPTH round-0): Aftermarket had higher raw novelty (WILD 9) + higher EV ($17K) — held: its fact-check HARD-FAIL + deep-integration-mandate failure outweigh the $4K EV edge; Leash's zero-landmine single-seam interlock is the cleaner, buildable, mandate-satisfying story.

## V2 post-selection — Leash prior-art + feasibility (Dami-requested)
PRIOR ART verdict: KNOWN-PATTERN-WITH-A-GENUINE-TWIST (not novel primitives; specific interlock unbuilt).
- Each leg is live production: ENS-as-permission (EIP-5131/ENSIP-13 text-record auth, delete-to-revoke); x402 facilitator policy gate (Nevermined live: allowlists+spend-caps+simulation pre-settlement; mark3labs/x402-go#26 requests per-agent spend mw); agent spend controls (MetaMask Delegation Toolkit ERC-7710/7715, Privy policy engine, thirdweb Spend Mandate, Circle/Coinbase).
- The SPECIFIC interlock (ENS resolver record READ by the facilitator as the live settlement policy; org naming hierarchy = one-write org-wide kill switch) = ZERO instances found (not spec, not hackathon toy, not product).
- COUNTER-SIGNAL (Q&A risk): ENS's own Sept-2026 agent blog argues capabilities should be metadata on the name, NOT enforced at the payment layer ("embedding identity into the payment layer risks a closed system"). Leash does exactly what ENS says not to. Must answer head-on: ENS = source-of-truth metadata; facilitator enforcement is one operator's opt-in choice, not protocol-mandated/closed.
FEASIBILITY (~1 day, solo): full 3-leg demoable BUT ENSv2 WRITE tooling is alpha (ensjs v5 preview, contracts non-final) = highest-risk leg. MVP FALLBACK: ENSv1 NameWrapper on Sepolia (stable ensjs v3 setText/setSubnodeRecord) + coinbase/x402 forked facilitator (NOT Blocky402 — hosted, not clearly forkable; use coinbase/x402 or fireblocks/x402-facilitator) + Privy policy mirror. Leg2 ~1-2h (one eth_call in /verify), Leg3 ~1h (native Privy rules). Frame 2 rails as ENS=on-chain source-of-truth + Privy=off-chain enforcement (distinct, not redundant).

## V2 pre-forge scoping — Privy integration (RESOLVED: GO)
This confirms the entire architecture. I have a definitive answer. Here's the build spec.

---

# Leash × Privy — Build Spec + Definitive Verdict

## The Hedera signing question — RESOLVED (this is the make-or-break, and it's a GO)

**Privy does NOT sign Hedera-native `TransferTransaction` protobufs.** Server wallets expose only EVM (`signMessage`, `signTypedData`, `signTransaction`, `sendTransaction`), Solana, Tron, Sui, XRPL, and one curve-level primitive: `secp256k1Sign(walletId, {params:{hash}})` which signs an arbitrary 32-byte digest.

**But you do not need native Hedera signing.** Hedera has a full EVM layer. Its [JSON-RPC Relay (HIP-482 / Hiero relay)](https://hips.hedera.com/hip/hip-482) accepts a standard Ethereum `eth_sendRawTransaction`, wraps it as a HIP-410 `EthereumTransaction`, and submits it to consensus nodes. USDC on Hedera is an HTS token that [the relay exposes as a standard ERC-20 contract](https://github.com/hiero-ledger/hiero-json-rpc-relay). ECDSA (secp256k1) accounts are exactly what the EVM path requires — and that is precisely what a Privy EVM server wallet is.

**Definitive architecture (Privy is fully load-bearing on the payment path):**

- The agent wallet is a **Privy EVM server wallet** (secp256k1). Its EVM address maps to a Hedera ECDSA account 0.0.x via the relay's alias mechanism.
- The x402 USDC settlement is an **ERC-20 `transfer(to, amount)`** to the HTS-USDC contract, signed by Privy and broadcast to Hedera's EVM (`eip155:295` mainnet / `eip155:296` testnet).
- **Privy's policy engine enforces the cap + allowlist on that exact call**, because the payment is now a normal EVM `eth_sendTransaction` with decodable calldata. Nothing sits outside Privy's control. No separate Hedera key. No decorative role.

The naive "Privy just holds the org key while a raw Hedera SDK key signs payments" fallback is **not needed and is strictly worse** — it would put the spend outside the policy engine, defeating the whole thesis. Use the EVM-relay path.

Caveat to verify in the first 30 min of build (see Gaps): Privy accepts an arbitrary `eip155:<id>` in `caip2`. The SDK pattern is `caip2: 'eip155:296'` with `params.transaction.chain_id: 296`. If Privy's backend rejects a non-allowlisted chain id on `sendTransaction`, fall back to `secp256k1Sign` on the RLP hash + self-broadcast via ethers to Hashio (belt-and-suspenders path below).

## Packages + versions

```json
"@privy-io/server-auth": "^1.32.x"   // walletApi: createWallet, createPolicy, updatePolicy, ethereum().sendTransaction / secp256k1Sign
"ethers": "^6.13.x"                  // build/RLP-encode Hedera EVM tx, self-broadcast fallback via Hashio relay
"viem": "^2.x"                       // optional: encodeFunctionData for USDC transfer calldata
```
App key + secret + `PRIVY_APP_ID` from dashboard. Hedera relay: `https://testnet.hashio.io/api` (296) / `https://mainnet.hashio.io/api` (295).

## Policy JSON (per-tx cap + payee allowlist, the second rail)

Default is **DENY** if no rule resolves; **DENY beats ALLOW**. Because the payment is an ERC-20 transfer, gate on `ethereum_calldata` (recipient) plus a value/amount cap. Two ALLOW rules under one policy:

```json
{
  "version": "1.0",
  "name": "Leash Agent Spend Envelope",
  "chain_type": "ethereum",
  "rules": [
    {
      "name": "USDC transfer: allowlisted payees only",
      "method": "eth_sendTransaction",
      "action": "ALLOW",
      "conditions": [
        { "field_source": "ethereum_calldata", "field": "transfer._to",
          "operator": "in",
          "value": ["0xPAYEE_A", "0xPAYEE_B"],
          "abi": "[{\"inputs\":[{\"name\":\"_to\",\"type\":\"address\"},{\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"type\":\"function\"}]" },
        { "field_source": "ethereum_calldata", "field": "transfer._value",
          "operator": "lte", "value": "5000000",
          "abi": "[{\"inputs\":[{\"name\":\"_to\",\"type\":\"address\"},{\"name\":\"_value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"type\":\"function\"}]" }
      ]
    },
    {
      "name": "Native value hard-zero (block native drains)",
      "method": "eth_sendTransaction",
      "action": "ALLOW",
      "conditions": [
        { "field_source": "ethereum_transaction", "field": "value", "operator": "lte", "value": "0" }
      ]
    }
  ]
}
```
(`5000000` = 5 USDC at 6 decimals. USDC-HTS uses 6 decimals — confirm the ERC-20 facade decimals on Hedera.)

## Wallet + policy + revoke + attack demo (sketch)

```js
import { PrivyClient } from '@privy-io/server-auth';
const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);

// (a) policy  (b) org-owned agent wallet bound to it
const policy = await privy.walletApi.createPolicy({ /* JSON above */ });
const wallet = await privy.walletApi.createWallet({ chainType: 'ethereum', policyIds: [policy.id] });

// (e) leaked-key over-cap attempt -> policy DENY
const data = encodeFunctionData({ abi: erc20, functionName:'transfer', args:[PAYEE_A, 999_000000n] });
try {
  await privy.walletApi.ethereum.sendTransaction(wallet.id, {
    caip2: 'eip155:296',
    params: { transaction: { to: USDC_HTS_EVM_ADDR, value:'0x0', data, chain_id:296 } }
  });
} catch (e) { /* Privy returns policy-violation DENY -> render in demo */ }

// (d) revoke/sync when ENS record changes (payee removed): update -> allowlist without that payee (or empty => all DENY)
await privy.walletApi.updatePolicy(policy.id, { rules: newRulesWithoutPayee });
```
Fallback broadcast (if `sendTransaction` balks at chain 296): build the tx with ethers, `hash = keccak256(unsignedRLP)`, `sig = privy.walletApi.ethereum.secp256k1Sign(wallet.id,{params:{hash}})`, assemble signed RLP, `provider.broadcastTransaction()` to Hashio. Policy still applies on the Privy-signed path; the raw-hash path bypasses calldata policy, so **prefer `sendTransaction`** and use raw-sign only if forced.

## B2B $2.5K bullet fit — YES

"Integrate Privy as core; organization/server wallets; ≥1 Privy control." You hit **org server wallets** + **policies (cap + allowlist)** + a live **leaked-key DENY** demo — that's core + one control, cleanly satisfied. Cheap depth adds worth ~30 min each: (1) attach the policy via a **scoped signer** with its own `policyIds` (shows signer-level control), and (2) narrate the **owner/authorization-key** model so it reads as true org custody, not a single hot key. Skip quorum/intents unless time is free — they add build risk for marginal judging lift.

## Top 3 gaps + fixes

1. **Arbitrary `eip155:296` acceptance on `sendTransaction`** — biggest unknown. Privy's public examples are Base/Sepolia. Fix: smoke-test a 1-tinybar tx to Hedera testnet in the first 30 min; if rejected, switch to the `secp256k1Sign` + self-broadcast-to-Hashio path (already sketched). Do this *before* building UI.
2. **Policy enforcement latency (TEE) + calldata decoding** — policies evaluate in a TEE before signing; the allowlist rule needs the ABI inline to decode `transfer._to`. If the ABI is malformed the rule silently won't match and defaults to DENY (looks like a bug). Fix: unit-test the ALLOW path (in-cap, allowlisted) returns success *and* the DENY path fails, before demoing. Budget for a couple hundred ms of TEE latency in the demo pacing.
3. **HTS-USDC decimals / EVM contract address on Hedera** — value caps are in raw units; wrong decimals makes your "5 USDC cap" actually 5 millionths. Fix: read `decimals()` off the USDC ERC-20 facade via Hashio and pin the exact EVM address for 295/296 in config; assert it in a test.

Sources: [Privy agent wallets](https://docs.privy.io/wallets/overview/solutions/agent-wallets), [policy engine blog](https://privy.io/blog/turning-wallets-programmable-with-privy-policy-engine), [@privy-io/server-auth npm](https://www.npmjs.com/package/@privy-io/server-auth), [raw hash signing](https://docs.privy.io/wallets/using-wallets/ethereum/sign-a-raw-hash), [server wallet EVM usage](https://docs.privy.io/guide/server-wallets/usage/ethereum), [HIP-482 JSON-RPC Relay](https://hips.hedera.com/hip/hip-482), [Hiero relay (ERC-20/HTS)](https://github.com/hiero-ledger/hiero-json-rpc-relay).

## V2 pre-forge scoping — ENS integration (GO: ENSv2 via viem)
All addresses verified live on-chain. Both the old ens-cli registry and the current ETHRegistry have code (two parallel ENSv2 deployments exist — confirms the "addresses change" risk is real and live). I have everything needed. Here's the build spec.

---

# Leash — ENS Integration Build Spec (ETHOnline 2026, ENSv2 $4.5K bounty)

## Verdict up front

**The bounty explicitly disqualifies ENSv1.** ETHGlobal's ENS prize page states projects "must use ENSv2 on Sepolia, meaning ENSv1 does not qualify" and ENSv2 features must be "central components, not cosmetic," with "no hard-coded values." So the "stable ENSv1/NameWrapper path" is a **non-starter for the money** — it can only be a private fallback you never submit. The good news: ENSv2 writes on Sepolia are **doable in 1 day** via viem + the verified contract addresses below. `@ensdomains/ensjs` will NOT help you (stable v4.3.1 is ENSv1-only; ENSv2 lives in `5.0.0-alpha.1` / `5.0.0-sepolia-fix.1` prereleases). **Use viem directly against the ENSv2 registry + PermissionedResolver ABIs.**

Sources: [ETHGlobal ENS prize](https://ethglobal.com/events/ethonline2026/prizes/ens), [ENSv2 Overview](https://docs.ens.domains/contracts/ensv2/overview), [ensjs README](https://github.com/ensdomains/ensjs/blob/main/README.md).

## Packages + versions

```
viem ^2.9.2                 # the only hard dependency for ENSv2 writes
@ensdomains/ensjs 4.3.1     # OPTIONAL, ENSv1 only. Do NOT use for the v2 bounty path.
                            # (ENSv2 = 5.0.0-alpha.1 / 5.0.0-sepolia-fix.1 — alpha, avoid)
```
Confirmed from npm: `dist-tags.latest = 4.3.1` (pub 2026-06-24), `alpha = 5.0.0-alpha.1`. `@ensdomains/cli` is **not on npm** — the `ens-cli` (agent-native, ENSv2-aware) is `npx "https://pkg.pr.new/ensdomains/cli/@ensdomains/cli@main"` and is explicitly **"not production-ready."** Its source is the best reference for the exact ENSv2 calls, and I mirrored its ABIs below.

## ENSv2 Sepolia addresses — VERIFIED ON-CHAIN (from [contracts-v2 docs, deployed 2026-06-29](https://github.com/ensdomains/contracts-v2/blob/main/contracts/docs/addresses/sepolia.md), all confirmed to have bytecode via `eth_getCode`)

| Contract | Address | Role |
|---|---|---|
| **RootRegistry** | `0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c` | traversal root |
| **ETHRegistry** | `0x67b728a792e789a8978b30cf1b3b641f19354b43` | `.eth` subregistry (register 2LDs here) |
| **ETHRegistrar** | `0xa4449a0dd2b83007553d9b1d28b583a46a805a30` | commit/reveal `.eth` registrar |
| **PublicResolverV2** | `0xd25f66dd4ff61486c2c5c1e6201a23576698d3df` | shared resolver (setText/setAddr) |
| **PermissionedResolverImpl** | `0x7e4b2d59938930168024201752ee5503df402303` | per-name permissioned resolver impl |
| **UserRegistryImpl** | `0x840fa461059862ea466a711e8c98c8de732061c0` | your own subname registry impl |
| **WrapperRegistryImpl** | `0xcf9f4863a1b44216cfc0be65f4e47b2b9a043924` | |
| **UniversalResolverV2** | `0x85edf8b6b7d4211e2b07aa687506b746357b92cf` | reads via resolution |
| **UpgradableUniversalResolverProxy** | `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe` | stable read entrypoint |
| **VerifiableFactory** | `0x118bc31a50d559f7015a8da26d54b3b030cdb70f` | CREATE2 factory for OwnedResolvers |

⚠️ **A SECOND, older ENSv2 deployment is ALSO live on Sepolia** (`ETHRegistry = 0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2`, which is what `ens-cli` currently hardcodes — I confirmed it still has bytecode). Two parallel ENSv2 deployments existing simultaneously is exactly why the bounty says "no hard-coded values." **Load all addresses from `deployments/sepolia/*.json` at runtime or an env-driven config; do not paste them inline.** Pin to the newer `2026-06-29` set above.

## Core ENSv2 ABIs (from ens-cli `src/lib/contracts.ts`, viem-ready)

```ts
import { parseAbi } from 'viem'

export const v2RegistryAbi = parseAbi([
  'function getSubregistry(string label) view returns (address)',
  'function getState(uint256 anyId) view returns ((uint8 status,uint64 expiry,address latestOwner,uint256 tokenId,uint256 resource))',
  // THE subname primitive:
  'function register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expires) returns (uint256 tokenId)',
  'function setResolver(uint256 anyId,address resolver)',
  'function setSubregistry(uint256 tokenId,address registry)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  // ENSv2 Enhanced Access Control (EAC):
  'function grantRoles(uint256 tokenId,uint256 roleBitmap,address account)',
  'function revokeRoles(uint256 tokenId,uint256 roleBitmap,address account)',
])

export const publicResolverV2Abi = parseAbi([
  'function setText(bytes32 node,string key,string value)',
  'function text(bytes32 node,string key) view returns (string)',
  'function setAddr(bytes32 node,address a)',
  'function multicall(bytes[] data) returns (bytes[])',
])
```

**EAC role bitmap** (from ens-cli `src/lib/v2.ts` — this is the bounty centerpiece):
```ts
export const ROLE_SET_SUBREGISTRY = 1n << 20n
export const ROLE_SET_RESOLVER    = 1n << 24n
export const ROLE_REGISTRAR       = 1n << 0n
export const ROLE_UNREGISTER      = 1n << 12n
export const ROLE_RENEW           = 1n << 16n
// admin variant = role << 128n
export const V2_DEFAULT_OWNER_ROLE_BITMAP =
  ROLE_UNREGISTER | ROLE_RENEW | ROLE_SET_SUBREGISTRY | ROLE_SET_RESOLVER |
  (ROLE_UNREGISTER<<128n)|(ROLE_RENEW<<128n)|(ROLE_SET_SUBREGISTRY<<128n)|(ROLE_SET_RESOLVER<<128n)
```

## Code sketches (viem, ENSv2 Sepolia)

**(b) Create subname** `data.acme.eth` — call `register` on the *parent's* subregistry (traverse to it first):
```ts
import { namehash, labelhash } from 'viem/ens'
// 1. find parent registry by walking from RootRegistry via getSubregistry(label)
const acmeRegistry = await pub.readContract({ address: rootRegistry, abi: v2RegistryAbi,
  functionName:'getSubregistry', args:['acme'] }) // must be non-zero; else deploy a UserRegistry for acme first
// 2. register the child on acme's subregistry
const expires = (await pub.getBlock()).timestamp + 31536000n
await wallet.writeContract({ address: acmeRegistry, abi: v2RegistryAbi, functionName:'register',
  args:['data', ownerAddr, zeroAddress /*child subregistry*/, publicResolverV2, V2_DEFAULT_OWNER_ROLE_BITMAP, expires] })
```
Caller must hold `ROLE_REGISTRAR` on the parent subregistry.

**(c) Write the spend-policy text record:**
```ts
const node = namehash('data.acme.eth')
const policy = JSON.stringify({ maxPerCall: "50", allowedPayees: ["0xPayee..."], token: "USDC" })
await wallet.writeContract({ address: publicResolverV2, abi: publicResolverV2Abi,
  functionName:'setText', args:[node, 'agent:spend-policy', policy] })
```

**(d) Facilitator READ (the enforcement read path):**
```ts
const raw = await pub.readContract({ address: publicResolverV2, abi: publicResolverV2Abi,
  functionName:'text', args:[node, 'agent:spend-policy'] })
const policy = raw ? JSON.parse(raw) : null   // null/'' => deny
```
Direct `resolver.text(node,key)` read is a single `eth_call` (~50–300ms on a public RPC; sub-100ms on Alchemy). For a robust demo, read via UniversalResolverV2 `0x85edf8...` which handles the resolver lookup for you.

**(e) REVOKE — two levels, both demoable:**
```ts
// soft revoke: clear the record => facilitator sees '' => denies
await wallet.writeContract({ address: publicResolverV2, abi: publicResolverV2Abi,
  functionName:'setText', args:[node,'agent:spend-policy',''] })
// hard revoke (ENSv2-native, stronger story): strip the agent's write role
await wallet.writeContract({ address: acmeRegistry, abi: v2RegistryAbi, functionName:'revokeRoles',
  args:[tokenId, ROLE_SET_RESOLVER | ROLE_SET_SUBREGISTRY, agentAddr] })
```

**(f) Reverse record (payer address → subname):** ENSv2 routes reverse via the `ReverseRegistrarAdapter` (`0x94e64e29e25533f93ba0a430646ae42cb47bf8f3`) / `DefaultReverseRegistrarAdapter` (`0x1f7b9461...`), still `setName(string)`:
```ts
await wallet.writeContract({ address: reverseRegistrarAdapter, abi:
  parseAbi(['function setName(string name) returns (bytes32)']), functionName:'setName', args:['data.acme.eth'] })
```
Facilitator then maps `payerAddr → name → node → text(node,'agent:spend-policy')`. Note: primary name needs **bidirectional** resolution (forward addr record must point back to the same address).

**(a) Own a parent name:** don't burn budget registering a fresh 2LD via commit/reveal. Register **one** `.eth` 2LD once via `ETHRegistrar` (`0xa444...`, commit → wait 60s → reveal, priced by `StandardRentPriceOracle`, payable in MockUSDC `0xd3322b...` / MockDAI `0xe33a...`), then create ALL org hierarchy as subnames/subregistries under it. On testnet the mock-token price is trivial.

## Depth: which ENSv2 features to make load-bearing (this is what scores the bounty)

1. **Hierarchical subregistries** — `acme.eth` deploys its own `UserRegistry` (`UserRegistryImpl 0x840f...` via `VerifiableFactory`); each agent = a subname entry (`payments.acme.eth`, `data.acme.eth`). Org structure literally IS the ENS tree. Demo: `getSubregistry` traversal on screen.
2. **Enhanced Access Control (EAC) grant/revoke** — the org holds `ROLE_SET_RESOLVER`/`ROLE_SET_SUBREGISTRY`; killing an agent = `revokeRoles(tokenId, …, agentAddr)`. This is the single most ENSv2-native, non-KV thing you can show — 32-role system, admin roles at `bit<<128`, `ROOT_RESOURCE=0`. ([architecture docs](https://ensdomains-contracts-v2.mintlify.app/concepts/architecture))
3. **Per-name Permissioned Resolver** — give the spend-policy subname its own resolver proxy (`PermissionedResolverImpl 0x7e4b...`) so policy data is owned per-record, not in a shared KV. Fine-grained per-record permissions = the bounty's named feature.
4. **Reverse resolution** — payer address → policy name, the piece that makes the facilitator's lookup real rather than hard-coded.

**Framing (important, ENS-endorsed):** ENS is the **org-controlled source-of-truth for policy metadata + revocation**, NOT the payment gate. ENS's own agent guidance: "ENS resolves agent identities so OAuth can authorize them… ENS does not directly enforce capabilities." So Leash's story = *the facilitator reads ENS as authoritative config; editing/revoking the record or role instantly changes what the facilitator will settle.* Enforcement lives in the facilitator; ENS is the trust root it reads. ([ENS AI-agent blog](https://ens.domains/blog/post/ens-ai-agent-erc8004))

## Top 3 gaps/risks + fixes

1. **ensjs won't do ENSv2 (biggest time-eater if you assume it will).** Stable v4.3.1 = ENSv1/NameWrapper only; ENSv2 is alpha prereleases with no stable API. **Fix:** skip ensjs entirely; use viem + the ABIs above. Budget: writing your own thin wrapper is ~2h.
2. **Non-final contracts + duplicate live deployments = "hard-coded values" failure.** Two ENSv2 `ETHRegistry` addresses are live right now; addresses may move again before you demo. **Fix:** load every address at runtime from `contracts-v2/deployments/sepolia/*.json` (or an env file generated from it), pin the `2026-06-29` set, and show the config-load in the demo. Never inline an address.
3. **Subregistry must exist before subname register + role prerequisites.** `register` reverts if the parent has no subregistry (`getSubregistry` returns zero), and the sender needs `ROLE_REGISTRAR` on that parent. **Fix:** provision-order script: register 2LD → deploy `acme` UserRegistry via VerifiableFactory + `setSubregistry` → grant registrar role → then create agent subnames. Test this exact sequence early; it's the one thing most likely to eat the day.

Minor: **Sepolia ETH faucet** — use Google Cloud Web3 Sepolia faucet or Alchemy/QuickNode faucet (Alchemy gives 0.5 ETH/day). `.eth` 2LD registration on Sepolia is paid in **mock tokens** (MockUSDC/MockDAI, mintable), so effectively free. **Resolver read latency** is a single `eth_call` — negligible, but use a paid RPC (Alchemy/Infura) not a public one for a smooth live demo.

Sources: [ETHGlobal ENS prize](https://ethglobal.com/events/ethonline2026/prizes/ens) · [ENSv2 Overview](https://docs.ens.domains/contracts/ensv2/overview) · [ENSv2 architecture](https://ensdomains-contracts-v2.mintlify.app/concepts/architecture) · [contracts-v2 Sepolia addresses](https://github.com/ensdomains/contracts-v2/blob/main/contracts/docs/addresses/sepolia.md) · [ens-cli source](https://github.com/ensdomains/ens-cli) · [ensjs README](https://github.com/ensdomains/ensjs/blob/main/README.md) · [ENS AI-agent/ERC-8004 blog](https://ens.domains/blog/post/ens-ai-agent-erc8004) · [ENSv2 architecture blog](https://ens.domains/blog/post/ensv2-architecture)

## V2 pre-forge scoping — x402 + Hedera facilitator (GO: no fork, native scheme, gas-free)
I have a complete, verified picture. Here's the build spec.

---

# Leash — x402 + Hedera Build Spec (ETHOnline 2026)

Everything below is verified against live source (x402-foundation/x402 `main`, npm registry, viem/Hedera docs). Package versions are real as of today.

## The one architectural insight that de-risks the whole build

**You do NOT need to fork the facilitator.** The `x402Facilitator` class in `@x402/core` exposes first-class lifecycle hooks — `onBeforeVerify()` and `onBeforeSettle()` — that return `{ abort: true, reason }` to reject a payment. Your ENS spend-policy gate is a ~40-line hook you `.chain()` onto a standard facilitator, not a patch to vendored code. This is the single biggest time-saver and it's the cleanest possible story for judges ("policy enforcement as a facilitator middleware").

Source (real, `examples/typescript/facilitator/basic/index.ts`):
```ts
const facilitator = new x402Facilitator()
  .registerScheme(2, ["hedera:testnet"], hederaScheme)
  .onBeforeVerify(async (context) => { /* ENS gate here */ })
  .onBeforeSettle(async (context) => { /* or here (belt+suspenders) */ });

app.post("/verify", async (req, res) => {
  const response = await facilitator.verify(payload, requirements);
  res.json(response);
});
app.post("/settle", async (req, res) => { /* facilitator.settle(...) */ });
```
Hook types (from `core/src/facilitator/x402Facilitator.ts`):
```ts
export type FacilitatorBeforeVerifyHook =
  (context: FacilitatorVerifyContext) => Promise<void | { abort: true; reason: string }>;
export type FacilitatorBeforeSettleHook =
  (context: FacilitatorSettleContext) => Promise<void | { abort: true; reason: string }>;
```
`FacilitatorVerifyContext` carries `{ payload, requirements }`, so you have the payer, amount, asset, and payTo inside the hook.

---

## 1. Repo to fork + exact packages/versions

**Base your facilitator on the official reference example, not a fork.** Clone `x402-foundation/x402`, copy `examples/typescript/facilitator/basic/` as your starting point, and swap the EVM/SVM schemes for Hedera. (BlockyDevs' `blockydevs/x402` is a full monorepo fork — heavier and 3+ weeks stale; only mine it if you get stuck.)

Package ecosystem — note there are **two** and you want the **v2 `@x402/*` family** (`@hiero-ledger/sdk`), because that's where the Hedera mechanism lives:

| Package | Version | Role |
|---|---|---|
| `@x402/core` | `~2.25.0` | `x402Facilitator`, hooks, `x402ResourceServer` |
| `@x402/hedera` | `2.25.0` | Hedera exact scheme (client/server/facilitator) |
| `@hiero-ledger/sdk` | `2.85.0` (pinned by @x402/hedera) | Hedera SDK — **NOT `@hashgraph/sdk`**; it's the renamed successor. `@x402/hedera` re-exports `TransferTransaction`, `TokenAssociateTransaction`, `Client`, `TransactionId`, etc. |
| `@hiero-ledger/proto` | `2.31.0` (must stay lockstep with sdk) | proto |
| `viem` | `2.56.3` | ENS reads to Sepolia |
| `@x402/express` | matches core (`~2.25.x`) | resource-server middleware + facilitator route glue |

`@x402/hedera` subpath exports (verified): `@x402/hedera/exact/client`, `/exact/server`, `/exact/facilitator`.

Facilitator signer wiring (verified in `hedera/src/signer.ts`):
```ts
import { createHederaSignAndSubmitTransaction, createHederaVerifyPayerSignature, createHederaClient } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/facilitator";
```

---

## 2. The `/verify` ENS-gate code sketch (the core deliverable)

Put it in `onBeforeVerify`. It reads the payer's ENS policy from Sepolia and aborts on violation:

```ts
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { normalize } from "viem/ens";

const sepoliaClient = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC) });

// key = the text-record key you store policy under
const POLICY_KEY = "leash.policy"; // JSON: {"maxPerCall":"1000000","allowedPayees":["0.0.1234"]}

facilitator.onBeforeVerify(async ({ payload, requirements }) => {
  // 1. resolve which ENS name is paying (see §3)
  const agentName = resolveAgentEns(payload, requirements); // e.g. "myagent.eth"
  if (!agentName) return { abort: true, reason: "no_ens_identity_bound_to_payer" };

  // 2. read the policy text record from Sepolia
  const raw = await sepoliaClient.getEnsText({ name: normalize(agentName), key: POLICY_KEY });
  if (!raw) return { abort: true, reason: "no_spend_policy_record" };
  const { maxPerCall, allowedPayees } = JSON.parse(raw) as
    { maxPerCall: string; allowedPayees: string[] };

  // 3. enforce cap (amounts are integer strings in token's smallest unit — USDC has 6 decimals)
  if (BigInt(requirements.amount) > BigInt(maxPerCall))
    return { abort: true, reason: `over_cap:${requirements.amount}>${maxPerCall}` };

  // 4. enforce payee allowlist (Hedera account id like "0.0.1234")
  if (!allowedPayees.includes(requirements.payTo))
    return { abort: true, reason: `payee_not_allowed:${requirements.payTo}` };

  // 5. log the ALLOW decision to HCS (§4) — do it here or in onAfterSettle
  await logToHcs({ decision: "allow", agentName, amount: requirements.amount, payTo: requirements.payTo });
  // returning void => proceed to normal signature/transfer verification
});
```
`getEnsText` is verified to work on Sepolia by just setting `chain: sepolia`. Returns `string | null`.

Belt-and-suspenders: also register the same check in `onBeforeSettle` so a payment can never settle without passing the gate even if verify is bypassed.

---

## 3. Agent ↔ ENS binding (the critical gap) — recommendation

You have three options; here's the honest ranking for a 1-day build:

- **(b) Reverse-resolve payer wallet → ENS name — RECOMMENDED.** The Hedera payer is a Hedera account id (`0.0.x`), not an EVM address, so classic ENS reverse resolution (`getEnsName(address)`) does **not** directly apply. BUT Hedera accounts can have an EVM alias / you control the mapping. Cleanest ENS-native path that actually fits the clock:
  1. Agent's ENS name (e.g. `myagent.eth`) stores **both** the policy (`leash.policy` text key) **and** its Hedera account id in a text record (`leash.hedera` = `"0.0.429xxx"`).
  2. Facilitator takes the payer account id from the decoded transaction, and you maintain the inverse lookup. For a demo, the simplest correct binding is **(a)**:
- **(a) Carry the ENS name in x402 metadata — SIMPLEST, DO THIS.** The agent puts its ENS name in a request header (e.g. `X-Leash-Agent: myagent.eth`) or in `PaymentRequirements.extra`. The facilitator reads it, then **verifies the binding** by checking `getEnsText(name, "leash.hedera") === payerAccountId` from the decoded tx. This closes the spoofing hole (an attacker can't claim someone else's ENS name because the name's own record must point back at the paying account). This is ENS-native (the name self-attests its Hedera account) and needs zero extra contracts.
- **(c) On-chain registry** — most robust, but building/deploying a registry contract is scope you don't have. Skip.

**Recommendation: (a) + binding verification via (b)'s reverse-check.** Header carries the claim; the ENS record `leash.hedera` proves it. One text-record read does both policy fetch and identity proof if you store `{maxPerCall, allowedPayees, hederaAccount}` in one JSON record.

Requires: agent owns a `.eth` name on Sepolia and sets one text record. You can register a test name on the ENS Sepolia app and set records in the UI — no contract deploy.

---

## 4. Resource server + HCS logging

Minimal x402-gated API with `@x402/express`, pointing at YOUR facilitator:
```ts
import express from "express";
import { paymentMiddlewareFromConfig } from "@x402/express";
import { HttpFacilitatorClient } from "@x402/core/http"; // httpFacilitatorClient.ts

const facilitatorClient = new HttpFacilitatorClient({ url: "http://localhost:4022" }); // your gated facilitator
const app = express();
app.use(paymentMiddlewareFromConfig(
  { "GET /premium": { price: "$0.10", network: "hedera:testnet", payTo: "0.0.YOUR_RECEIVER" } },
  facilitatorClient,
));
app.get("/premium", (_req, res) => res.json({ data: "the paid resource" }));
app.listen(3000);
```
`paymentMiddlewareFromConfig(routes, facilitatorClients, schemes?, paywallConfig?, paywall?, syncFacilitatorOnStart=true)` — verified signature.

HCS decision log (`@hiero-ledger/sdk`, re-exported by `@x402/hedera`; `TopicMessageSubmitTransaction` API is identical to `@hashgraph/sdk`):
```ts
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction } from "@hiero-ledger/sdk";

const client = Client.forTestnet().setOperator(OPERATOR_ID, OPERATOR_KEY);
// once, at setup:
const topicId = (await (await new TopicCreateTransaction().execute(client)).getReceipt(client)).topicId;

async function logToHcs(entry: object) {
  await (await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(JSON.stringify({ ...entry, ts: Date.now() }))
    .execute(client)).getReceipt(client);
}
```
Log both ALLOW (in `onBeforeVerify`/`onAfterSettle`) and DENY (when you return `{abort:true}`). This gives you an auditable, on-Hedera trail — strong bounty signal.

---

## 5. Hedera gas-free settlement flow (verified from `signer.ts`)

The agent-pays-nothing mechanism, confirmed in real source:

1. **Facilitator advertises `feePayer`** in `PaymentRequirements.extra.feePayer` (the facilitator's own Hedera account). `getExtra()` returns `{ feePayer: <facilitator account> }`.
2. **Agent builds a partially-signed tx** (`createPartiallySignedTransferTransaction`, `hedera/src/signer.ts`):
   ```ts
   const tx = new TransferTransaction();
   tx.addTokenTransfer(tokenId, payerAccount, -amount);   // USDC (0.0.429274) out
   tx.addTokenTransfer(tokenId, payTo, amount);           // in
   tx.setTransactionId(TransactionId.generate(AccountId.fromString(feePayer))); // <-- fees billed to feePayer
   tx.freezeWith(client);
   const signed = await tx.sign(payerPrivateKey);         // agent signs the TRANSFER only
   // serialize -> base64 -> X-PAYMENT header
   ```
   Because `transactionId.accountId == feePayer`, **the facilitator's account pays all network fees**, not the agent.
3. **Facilitator verifies** (`ExactHederaScheme.verify`): decodes tx, checks it's a `TransferTransaction`, net sums = 0, amount is exact, `payTo` matches, and the payer's on-chain key actually signed (via Mirror Node — `createHederaVerifyPayerSignature`).
4. **Facilitator settles**: `createHederaSignAndSubmitTransaction(client, feePayerKey)` adds the fee-payer signature and submits:
   ```ts
   const signed = await tx.sign(feePayerKey);
   await signed.execute(client);
   ```

**Token that moves:** USDC (HTS) — testnet token id **`0.0.429274`**, 6 decimals (verified in `constants.ts`). HBAR is `0.0.0`. Use USDC to satisfy the "$0.10" price and the bounty's real-value framing.

**Token association (real requirement, spec is vague but the network enforces it):** both the **payer agent** AND the **`payTo` receiver** must have associated token `0.0.429274` via `TokenAssociateTransaction` before any HTS transfer, or settlement fails with `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`. The facilitator fee-payer account does NOT need association (it only pays HBAR fees). Do this in setup.

**Testnet accounts + faucet:** create accounts at the Hedera Portal (`portal.hedera.com`) — gives 1,000 test HBAR/24h; the standalone testnet faucet gives 100 HBAR/24h anonymously. You need HBAR in the facilitator account (to pay fees) and in agent+receiver (for the ~$0.05 one-time association). Get testnet USDC by transferring from a faucet/portal-funded account or minting a test token if the canonical `0.0.429274` isn't dispensable to you.

---

## Top 3 gaps + fixes (brutally honest)

1. **Testnet USDC liquidity is the #1 threat to the "real paid request e2e" requirement.** The canonical testnet USDC (`0.0.429274`) has no public faucet you can rely on in an hour. **Fix:** don't gamble — at setup, mint your OWN test HTS token (`TokenCreateTransaction`, 6 decimals) that you fully control, associate it to agent+receiver, and use its id as `asset`. The scheme is asset-agnostic; a self-minted stablecoin-shaped token satisfies "real paid request" perfectly and removes all faucet risk. Keep `0.0.429274` as a "mainnet-ready" note in the README.

2. **Cross-chain Sepolia read latency inside the payment path.** A `getEnsText` call to a public Sepolia RPC can take 300ms–2s and public RPCs rate-limit/flake — this sits on the critical `/verify` path and can blow `maxTimeoutSeconds` or just look janky in the demo. **Fix:** (a) use a dedicated RPC (Alchemy/Infura Sepolia key), (b) cache the policy record in-memory with a short TTL (e.g. 30s) keyed by ENS name, (c) set `maxTimeoutSeconds: 180` (the default) so you have headroom. Cache also means the demo's 2nd+ requests are instant.

3. **`@hiero-ledger/sdk` vs `@hashgraph/sdk` version drift + `@hiero-ledger/proto` lockstep.** `@x402/hedera@2.25.0` pins `@hiero-ledger/sdk@2.85.0` and `@hiero-ledger/proto@2.31.0` and the package explicitly warns they must move together (`signer.ts` depends on it). If you `npm install @hashgraph/sdk` out of habit or let npm float the proto version, signing/serialization breaks with cryptic errors. **Fix:** import Hedera types from `@x402/hedera`'s re-exports (not a separately-installed SDK), and pin exact versions in package.json. Blocky402 as a *hosted* facilitator exists (`blocky402.com`, supports Hedera testnet V1) — but for the bounty you want to run your OWN gated facilitator, which is fully supported by the reference example. Treat Blocky402 hosted only as a fallback/reference, not a dependency.

**Sources:** [Hedera x402 docs](https://docs.hedera.com/solutions/ai/x402), [Hedera x402 blog](https://hedera.com/blog/hedera-and-the-x402-payment-standard/), [x402-foundation/x402](https://github.com/x402-foundation/x402), [scheme_exact_hedera spec](https://github.com/x402-foundation/x402/blob/main/specs/schemes/exact/scheme_exact_hedera.md), [@x402/hedera source](https://github.com/x402-foundation/x402/tree/main/typescript/packages/mechanisms/hedera), [BlockyDevs GitHub](https://github.com/blockydevs), [viem getEnsText](https://viem.sh/docs/ens/actions/getEnsText), [Hedera HCS submit-message](https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service/submit-a-message), [Hedera testnet faucet](https://hedera.com/blog/introducing-a-new-testnet-faucet-and-hedera-portal-changes/).
