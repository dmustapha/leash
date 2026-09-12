---
event_class: sponsor_track
event_class_source: declared
pack_version: 1
pack_date: 2026-09-08
gap_map: present
sponsor_vintage: present
---

# Working Primitives Sheet — ETHOnline 2026 V1 (sponsor_track lens: 2 whitespace + 2 sponsor-newest + 2 cross-pollination + 4 core)

### F13 — Per-unit metering / citation-toll nanopayments [lane: whitespace]
**Mechanism:** Make the smallest unit of consumption the payment event: an agent pays per citation/word/chunk/call over a payment rail, gateway clamping every unit to remaining budget, settlement routed to upstream creators via attribution.
**Aimed at:** W1 (real x402 services w/ metering + HCS audit on Hedera — sponsor-admitted vacuum) + W2 (undocumented x402+MCP async pattern, issues #903/#892/#1007) + P1 (Keryx-style tolls never ported to Blocky402 gas-free ceiling model).
**Receipts:** Keryx (Lepton 1st $10K, citation-as-payment-event, two-toll x402 + attribution + non-custodial cap) + Rubicon (Lepton 2nd, metered-by-the-word reading sessions).
**Adaptation axes:** metered unit (citation, word, API call, GPU-second, proof, index-row); attribution mechanism; budget-clamp locus (gateway vs contract vs Blocky402 ceiling); who earns.
**Saturation:** warm, trending clone — justified: aimed at a NAMED sponsor-admitted vacuum (W1) on a rail where the shape has never shipped (P1); must add hard mechanism (HCS audit trail, Scheduled-Tx streaming, or stake-backed quality) beyond bare metering.
**Loss-twin:** SOLV-001 (Agora, no award) — for-hire treasury agent adjacent to payments theme but off-cluster.

### F16 — Missing-institution-of-the-agent-economy [lane: whitespace]
**Mechanism:** Treat the agent economy ITSELF as the ecosystem and build a missing institution (insurance, escrow, labor market, credit-into-float, clearinghouse, journalism) with the incentive mechanism that makes the agent version honest.
**Aimed at:** M2 (quality/accountability for paid agent services — ERC-8004 reputation broken per arXiv 2606.26028; must use economic/payment-native primitive, NOT score-based - Dami's trust-scoring/registry/court shapes are FORBIDDEN) + M4 (working capital/liquidity primitives for agents: float, streaming settlement, refundable escrow).
**Receipts:** ALL 7 ETHGlobal-OA finalists were missing institutions (Slopstock exchange, Mnemosyne knowledge, DAIO peer review, Common OS runtime, Aegis402 payment guard); zero were "agent does X".
**Adaptation axes:** which institution (insurance, escrow, refunds, market-maker, clearing, payroll-for-agents); honesty-forcing incentive (stake/slash/commit-reveal/bonded refunds); which sponsor primitive custodies it (Blocky402 settlement, Privy quorums, Arc USDC finality).
**Saturation:** fresh at institution level, clone-tier at multi-agent-app level — as of 2026-09.
**Loss-twin:** the ~12-entry LLM-committee cluster at ETHGlobal-OA, 0 finalists.

### F19 — Payment-rail-native tooling & auth kits [lane: sponsor-newest]
**Anchored on:** Hedera Blocky402 facilitator (x402 solution shipped Feb 10 2026, hackathon-featured now [A1 prize page]) + Bazantic spec-to-gateway (launched AT this event [A1]).
**Mechanism:** Ship the reusable plumbing the payment/agent rail is missing — forkable facilitator/verifier, reference client, auth SDK — packaged fork-and-run with a ~90s demo.
**Receipts:** Stoa Insight Bot (Agora 3rd — forkable x402 facilitator verifier) ; Keeper-Gate (ETHGlobal-OA KeeperHub 2nd — reusable agent auth SDK).
**Adaptation axes:** which rail (Blocky402, Bazantic MPP, Circle Nanopayments); which missing piece (async MCP payment middleware — the LITERAL #903 gap; test harness — the $2K Hedera Harness pot; verifier); kit ergonomics.
**Saturation:** warm — each rail's gap list shrinks as kits ship; Hedera's list is provably unshrunk (open issues).
**Loss-twin:** none recorded.

### F25 — Sponsor's-hardest-guarantee hand-rolled as the headline [lane: sponsor-newest]
**Anchored on:** 1inch Aqua/SwapVM (dev access Jul 27 2026, ~6 weeks old [B2]) + Chainlink CRE Confidential handlerInTee (2026 early access [A2]) + ENSv2 Enhanced Access Control on Sepolia (Beta, post-Namechain-cancellation [B2]).
**Mechanism:** Identify the sponsor's HARDEST promise (one LP balance safely backing many strategies; private logic driving public state; parent-scoped namespace capabilities), implement it for real at protocol level, make the provable property the one-sentence pitch, failing closed BEFORE any transfer.
**Receipts:** Mimir (Agora 1st — hand-rolled Circle keyless signing as the pitch); Wraith (Stellar ZK 1st — from-scratch native verifier on hero path); Aqua0 (1inch Buenos Aires top-10 on brand-new Aqua).
**Adaptation axes:** which guarantee is hardest per sponsor; protocol-vs-SDK level; per-transaction provability; the one-line pitch.
**Saturation:** warm — repeated 1st-place move; decisive because fields settle for SDK decoration.
**Loss-twin:** argus (Lepton, unplaced) — "5/5 primitives" with 2 decorative stubs; decoration inverts into liability.

### F02 — Blind multi-party matching in private execution, atomic public settlement [lane: cross-pollination]
**Forced axis-shift:** privacy substrate PER(Solana) → Chainlink CRE TEE (handlerInTee) on Ethereum; market behavior shifted off FX-RFQ to an ecosystem-native venue (P2).
**Mechanism:** Counterparties submit hidden quotes/bids into private execution; binding commitment freezes the match; one atomic public settlement; privacy claim adversarially self-proving (live cross-read-denial, latency percentiles). Wins attached to a REAL recurring market behavior whose economics privacy improves.
**Receipts:** Tenor (Solana Blitz v7 2nd — blind multi-dealer RFQ in PER); Wraith (Stellar ZK 1st, shielded order book).
**Adaptation axes:** market behavior (auctions, OTC blocks, dark crossing, MEV-sensitive intents, allowlist draws); privacy substrate (TEE, FHE, ZK); public settlement artifact; adversarial self-proof surface.
**Saturation:** fresh — Tenor podiumed from a near-empty lane; note this family was previously killed by Dami's TradFi filter (L14 warning: do not over-kill).
**Loss-twin:** Lacuna (Stellar ZK, unplaced) — settlement args never bound to proof public signals; TradeTable (Blitz) — low spectacle + synthetic scenario.

### F24 — Systems-insight port into an expensive new domain [lane: cross-pollination]
**Forced axis-shift:** domain shifted from gen-media (takegraph/Backblaze) to Web3-native expensive pipelines (ZK proving, subgraph indexing, agent inference billing, Substreams authoring); the sponsor primitive must be the thing that MAKES the port possible (P3).
**Mechanism:** Port a proven systems-engineering insight (build graphs/incremental compilation, content-addressing, checkpointing, CRDTs) into a domain with expensive multi-step pipelines that lacks it. Demo number engineered backward from the claim (edit one line → 4 rebuild / 14 reuse).
**Receipts:** takegraph (Backblaze Genblaze 3rd of 1,314 — dependency-graph build system for generative media).
**Adaptation axes:** which insight; which pipeline domain; which sponsor primitive enables; the one legible demo number.
**Saturation:** fresh — single receipt, huge unexplored matrix.
**Loss-twin:** none recorded.

### F12 — Attenuated delegation / session-auth capability layer [lane: core]
**Mechanism:** Object-capability session layer between agents and wallets: scoped, revocable, cryptographically-enforced authority where every re-delegation hop can only NARROW the cap - enforced on-chain or by policy engine - proven by demoing the violation (over-grant → structured refusal / reverted tx).
**Receipts:** Consilium (MetaMask Cook-Off 1st — 3-level attenuated ERC-7710 redelegation, real reverted tx); Clasp (Fiber — "strongest submission overall" per judges).
**Adaptation axes:** substrate (Privy policies/quorums/intents, World AgentKit humanId gating, Blocky402 spending ceilings, ERC-7710); what is attenuated (spend, method, time, purpose, human-verification level); who delegates; adversarial demo surface.
**Saturation:** fresh — known in theory, almost nobody ships the enforcement. CAUTION: keep distinct from Dami's Backstop guardian-co-signer shape — attenuation-at-grant-time (capability narrowing) is a different load-bearing primitive than review-at-execution-time (co-signing), and the latter is FORBIDDEN.
**Loss-twin:** the ~30-entry generic guardian/firewall cluster at ETHGlobal-OA → 1 finalist.

### F08 — Interface-species shift: DSL/CLI/MCP owning a complete job [lane: core]
**Mechanism:** Keep the venue, change the interface species: YAML/DSL, CLI, or MCP server giving agents native tools — scoped to a COMPLETE job a human does end-to-end, never a single verb.
**Receipts:** Pacifica CLI (Track 4 winner — YAML DSL over MCP); Oobe Protocol (Blitz 3rd); YieldAgent (OKX Best MCP — entire LP lifecycle).
**Adaptation axes:** interface species; which end-to-end job (Substreams authoring→deploy→consume; Aqua strategy lifecycle; ATS issue→manage→report); agent runtime; track placement.
**Saturation:** warm — "an MCP for X" minted rapidly; complete-job scoping differentiates. CAUTION vs Kill List: "MCP-server-for-chain-data" is a 2025-winner retread — must be a JOB interface, not a data interface.
**Loss-twin:** single-verb skills losing to lifecycle-complete YieldAgent (OKX).

### F35 — Institutional money-in-motion rails [lane: core]
**Mechanism:** Settlement/collateral rails for institutional money that moves TODAY, with regulatory texture. STRICT Gate-1b framing required: the chain primitive must BE the product economics (Hedera ATS custom fee schedules + HCS; Arc USDC-native finality), not TradFi-with-crypto-bolted-on.
**Receipts:** Liquida (Arbitrum London $60K — gilt collateral rails); Meridian (Avalanche 1st $100K); escrowed high-value sales winners across micro-events.
**Adaptation axes:** asset class; which settlement friction removed; compliance wedge; buyer institution.
**Saturation:** fresh at institution-polar events; off-thesis at consumer-polar. This event's ATS/Privy-B2B lanes are institution-friendly ($6K + $2.5K, LOW-MED competition).
**Loss-twin:** GhostPay (Initia) — streaming rail one abstraction above money that moves today.

### F29 — Live-state-bound attestation [lane: core]
**Mechanism:** Prove a fact ABOUT the chain bound to LIVE on-chain state (require_auth-style binding) so the proof cannot be about stale/borrowed funds; adversarial tests reject the dishonest case. The BINDING is the mechanism.
**Receipts:** zkProofofReserve (Stellar ZK 4th — judges cited adversarial insolvency-rejection); Tukar (5th — pool derives verifier inputs from typed on-chain signals).
**Adaptation axes:** attested fact (reserves, service uptime/SLA, delivery-of-paid-work, collateral); live-binding primitive; consumer of the attestation.
**Saturation:** warm — live-binding variant is the surviving edge. HARD CAUTION: Dami's AlphaAttest (commit-before-publish track records) and trust-scoring shapes are FORBIDDEN — only use where the attested fact is NOT agent performance/reputation (e.g. SLA-bound refunds, solvency of an escrow, delivery proof gating settlement).
**Loss-twin:** Lacuna — the canonical unbound-proof failure.
