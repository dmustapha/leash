# Past ETHGlobal / ETHOnline Winners — Intel Brief

Researched 2026-09-08. Admiralty tags: source reliability A (official ETHGlobal) → C (secondary media), info credibility 1 (confirmed) → 3 (possibly true).

---

## BLUF

- **[A1]** ETHOnline 2025: 1,670 hackers, 87 countries, 634 projects, 10 finalists. ETHOnline 2024: 417 projects, 8 finalists. Finalist odds ~1.6-1.9%; sponsor-prize odds far better (dozens of sponsor prizes go to non-finalists).
- **[A1]** Online-event finalists skew hard toward **payments/stablecoin UX** (Sippy, SafeSend, CronPay, Tip Stream), **agentic/AI infra** (OpenPayAI, Common-Lobbyist, Hedron), and **novel security primitives** (EthVaultPQ post-quantum, ChronoVault, Siphon).
- **[A1]** ETHOnline 2026 is the **first online event with Continuity Mode**; 10 of 11 sponsors carved out explicit Continuity prizes, but Continuity pots are consistently **smaller** than Start Fresh pots (e.g. Hedera $1K of $15K; ENS $500 of $5K; Chainlink $500).
- **[B2]** Sponsor prizes reward **deep, load-bearing integration** of that sponsor's newest primitive (Blockscout MCP, Hedera A2A/AgentKit, 1inch Aqua, Pyth feeds) — not cosmetic usage. Repeat pattern across 2024-2025 events.
- **[C3]** Online/async judging amplifies video + README quality; most prize money at online events goes to sponsor-track winners who never make finals.

---

## Winner Registry — ETHOnline 2025 (10 finalists of 634) [A1]

| Project | What it built | Why it stood out |
|---|---|---|
| OpenPayAI | Decentralized pay-per-crawl: websites charge AI crawlers on-chain | Rode the AI-crawler zeitgeist; real-world problem, trustless mechanism |
| Sippy | WhatsApp as a crypto wallet — send/receive PYUSD via text, no app/seed/gas | Consumer UX collapse; PYUSD sponsor alignment |
| Common-Lobbyist | On-chain agents giving DAOs collective memory across governance platforms | Agentic + governance, novel framing |
| SafeSend | PayPal-like consumer protection for stablecoin payments (escrow + fraud oracles) | Real-world payments trust gap |
| Siphon Protocol | (privacy/extraction primitive) | Novel protocol design |
| EthVaultPQ | Post-quantum secure vault | Frontier security narrative |
| ChronoVault | Time-locked vault primitive | Security primitive with clear demo |
| DeFlow | (DeFi automation/flows) | Automation infra |
| WannaBet | Social betting | Consumer social + fun demo |
| CronPay | Universal crypto payment gateway, any token/chain, unified settlement | Merchant payments infra |

Sponsor-prize winners visible in the 2025 showcase (non-finalists) [A1]: **Nexus Explorer** (Avail intent explorer), **Wallet Whisperer** (AI chat over Blockscout MCP, multichain), **brexo** (AI forensic wallet investigator via Blockscout MCP), **Hollow** (parallelized perp protocol on Arcology). Note both Blockscout winners were *AI-agent-over-MCP* builds — the sponsor asked for exactly that.

## Winner Registry — ETHOnline 2024 (8 finalists of 417) [A1]

| Project | Notes |
|---|---|
| Hypertui | Terminal UI tooling — infra/dev-experience |
| OnlyCars | Consumer/transport |
| AuthWallet 2.5 | Wallet auth infra |
| Capture The Prompt | AI security game — AI+crypto crossover |
| Eros | Consumer social |
| Membrane Finance | DeFi |
| SignCast | Signing/attestation UX |
| ViralGames | Gaming |

Sponsor winners 2024 [B2]: Envio prizes → **Grail Market** (cross-chain prediction markets), **Know Your Co-Signers** (multisig signer analytics). Web3Auth had 100+ integrations, 7 winners across DePIN/gaming/prediction/DeFi — confirming sponsor prizes spread wide across non-finalists.

## Pattern Analysis Across Both Editions

- **AI+crypto share rising**: 2024 had 1-2 of 8 finalists AI-adjacent; 2025 had ~4 of 10 (OpenPayAI, Common-Lobbyist + agentic sponsor winners). Expect 2026 to be majority-AI.
- **Payments dominance in online events**: 4 of 10 2025 finalists were payments (PYUSD was a $10K sponsor). Sponsor money shapes the finalist pool.
- **Infra > consumer at finals; consumer wins hearts**: security primitives and infra make finals; pure consumer apps (WannaBet, Eros) get 1-2 slots max.
- **Gaming is a minor lane**: 1 finalist per edition.

---

## Per-Sponsor Winning Patterns (ETHOnline 2026 sponsor list)

- **The Graph** ($15K, 3 tracks) [A1 prize page; C3 pattern]: 2026 tracks are Composable/Standardized Products + AI Tooling (both modes). Historic Graph winners use subgraphs as the *data spine* of an AI/analytics product, not a bolt-on query.
- **Hedera** ($15K) [A1]: 2025 online winners were literally what Hedera's prize text asked for — **A2A agent-to-agent systems (Hedron)** and **MCP servers exposing Hedera DeFi (Aetheros, 36 tools)**. Pattern: implement their agent standard verbatim, then add one novel layer. 2026 asks: AI & agentic payments, tokenization, harness improvements.
- **Arc/Circle** ($10K) [A1/B2]: NYC 2025 Circle winners built **multichain USDC payment systems** (a team took $4K across Circle+Chainlink tracks). 2026 wants deploys on Arc testnet→mainnet — an actual mainnet push is a differentiator few teams do.
- **World** ($7K) [C3]: 2026 tracks are AgentKit (Continuity) + Selfie Check. Historic World winners are mini-apps where proof-of-humanity is load-bearing (sybil-resistance mechanics), not a login gimmick.
- **1inch** ($7K) [B2]: Buenos Aires 2025 top-10 included **Aqua0** — built directly on 1inch's brand-new Aqua shared-liquidity layer + LayerZero. Pattern: build on their *newest* primitive (Aqua again in 2026), first-mover on new SDK wins.
- **ENS** ($5K) [A1]: 2026 requires **ENSv2 on Sepolia, central to the product** ("not cosmetic" is in the prize text). Past ENS winners make names the identity/routing layer (e.g. whisper — anonymous messages to any ENS name, ETHOnline 2025 showcase).
- **Uniswap Foundation** ($5K) [C3]: "Uniswap Stack Contribution" — v4 hooks and tooling contributions win, not swap frontends.
- **Ledger** ($5K) [A1/B2]: NYC 2025 finalist **Hardhat3-Ledger** was literally dev tooling wiring Ledger into Hardhat 3 — tooling contributions to Ledger's stack make finals. 2026 track: AI Agents x Ledger (agent + hardware signing = clear demo).
- **Privy** ($5K) [B2]: Buenos Aires winner goddid.money used Privy for embedded-wallet onboarding in a credit-scoring product. Privy wins are B2B/consumer fintech flows where wallet UX disappears. 2026: B2B financial product / financial flow.
- **Chainlink** ($3K) [B2]: Deep native integration is the documented repeat pattern (also Dami's own Chainlink Convergence win). 2026: Confidential Workflow + automated liquidation protection — small pot, specific asks.
- **Bazantic** ($3K) [C3]: New sponsor, agent-recipe/API-agentification asks; low competition likely, spec-following wins.

---

## What Wins ETHGlobal Online Events (Synthesis)

1. **Sponsor spec-literalism + one novel twist.** Winning projects implement exactly what the prize text asks (A2A standard, MCP, Aqua, ENSv2-central) and add one memorable layer on top. Judges at sponsors grep for their SDK in your repo.
2. **Async judging = artifact quality is the product.** 2-round judging, most judges never talk to you: the 3-min video, README architecture diagram, and a working live link do the persuading. Video quality matters far more than in-person events.
3. **Most money goes to non-finalists.** With 600+ projects and ~10 finalist slots, EV-maximizing play is stacking 2-4 deep sponsor integrations, not chasing the finale.
4. **Payments + agents is the current center of gravity** for online editions (2025 finalists prove it; 2026 sponsor tracks — agentic payments everywhere — reinforce it).
5. **Real deployments beat mocks.** Mainnet pushes (Arc), live testnet contracts, and on-chain proof links recur in winner writeups.
6. **Continuity Mode 2026 (first online edition with it):** every major sponsor has a Continuity prize but pots are small and rules strict (substantive new features only; polish/bugfixes disqualify — Hedera's text says so explicitly). See roster-audit/strategy-density.md for the competition-density judgment.

Sources: ethglobal.com prize/showcase pages (ethonline2025, ethonline2026, newyork2025, buenosaires), ETHGlobal X posts (finalist announcements), ethdaily.io Continuity Track article, Envio/Web3Auth winner blogs, Bitget/CoinRank recaps.
