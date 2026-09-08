# ETHOnline 2026: Research Brief (hackathon-intel v3.1)

Synthesized 2026-09-08 (event LIVE, day 5 of hacking, ~5 build days remain). Sources: config.json (confirmed facts), research/sponsors-deep.md, research/past-winners.md, research/ecosystem-signals.md, research/roster-audit/. Admiralty tags: source reliability A (official) to F, info credibility 1 (confirmed) to 6.

---

## 1. Overview & Submission Requirements

| Field | Detail |
|---|---|
| Name | ETHOnline 2026 |
| Organizer | ETHGlobal |
| URL | https://ethglobal.com/events/ethonline2026 |
| Format | Fully async/online, 2-round judging |
| Dates | Sep 4-16, 2026 (Sep 14-16 = judging window) |
| Submission deadline | **Sunday Sep 13, 2026, 12:00 PM EDT (16:00 UTC)**. Late submissions NOT accepted [A1] |
| Prize pool | $80,000 itemized across 11 sponsors ("$100k+" per announcements) [A1] |
| Team size | Max 5 (solo allowed); each member accepted + ETH stake |
| Build tracks | Building from Scratch (Classic), Continuity: Extend Open Source, Continuity: Ship a Feature [A1] |
| Chain | Multi-chain: per-sponsor networks (see §10) |
| Builder | Dami, solo. Past ETHGlobal winner (AgentMesh won 0G @ Open Agents; GhostFund won Chainlink Convergence) |

**Submission requirements [A1]:**
- Project title + description + repo link via Hacker Dashboard
- Demo video 2-4 min MANDATORY (auto-rejected outside range)
- Up to 3 partner prize selections
- Public GitHub repo
- Version control history throughout the event (large single commits risk DQ)
- AI usage documented, including spec files and prompts
- Repeated across nearly every prize page: public repo + 2-4 min demo + live (non-mocked) integration. "Mocked, local-only, or static datasets do not qualify" appears verbatim in The Graph's tracks [A1]

## 2. Demo Video Requirements [A1]

- Duration: **2-4 minutes HARD** (min 120s / max 240s): outside range = auto-rejected
- Resolution: 720p minimum (upload fails below)
- Platform: YouTube/Loom
- **NO AI voiceover/TTS** (human voice mandatory), NO phone recordings, NO speed-ups, NO music+text instead of narration
- Intro under 20 seconds; max 4 bullets per slide
- Sponsor-specific: Hedera demos ≤5 min on their own page but the ETHGlobal 2-4 min platform limit governs the upload

## 3. Submission Form Fields

No additional custom form fields discovered beyond the Hacker Dashboard standard set (title, description, repo, video, up to 3 partner prize selections, track selection Scratch vs Continuity) [A1 config]. Sponsor-side artifacts that function like form fields: FEEDBACK.md + Uniswap Developer Feedback Form (Uniswap), feedback documents (World, both tracks), DX feedback (Ledger, all submissions), Bazantic username (all Bazantic tracks).

## 4. Disqualifiers [A1]

1. Demo video outside 2-4 min = auto-reject
2. Pre-existing code on Scratch track (public libs OK)
3. Missing version history / large single commits (1inch prize text explicitly: "no single-commit entries on the final day")
4. AI voiceover in demo video
5. Entirely-AI submissions may lose partner prize/finalist eligibility
6. Late submission
7. Wrong track selection (prizes locked to selected track)

## 5. Prizes: Full $80K Table [A1]

| # | Sponsor | Track | Amount | Pool | Notes |
|---|---|---|---|---|---|
| 1 | The Graph | Composable/Standardized Graph Products | $5,000 | Either | 2.5k/1.5k/1k; compose ≥2 Graph products or standardized schema; live data mandatory |
| 2 | The Graph | AI Tooling/Use Case (Scratch) | $5,000 | Scratch | Load-bearing Graph usage, live data, meaningful work with data |
| 3 | The Graph | AI Tooling/Use Case (Continuity) | $5,000 | Continuity | Same + document pre-existing work |
| 4 | Hedera | AI & Agentic Payments (x402) | $6,000 | Scratch-leaning | 3x$2,000; live x402-gated service via Blocky402, ≥1 real paid request e2e |
| 5 | Hedera | Open Source Harness | $2,000 | Either | 2x$1,000; PR to Hedera Harness acceptable |
| 6 | Hedera | Tokenization of Anything (ATS) | $6,000 | Scratch-leaning | 3x$2,000; ATS issuance + lifecycle op, verified contracts on HashScan |
| 7 | Hedera | Continuity | $1,000 | Continuity | Substantive new work only; polish/bugfixes disqualify |
| 8 | Arc | Best DeFi/Onchain Finance | $1,667 | Scratch | Arc + USDC, programmable money flows, functional MVP |
| 9 | Arc | Best Agentic Economy App | $1,667 | Scratch | Agents w/ real decision signals; Agent Stack/Nanopayments/Paymaster |
| 10 | Arc | DeFi/Agentic (Continuity) | $1,666 | Continuity | Registered as Continuity project |
| 11 | Arc | Launch on Testnet then Mainnet | $3,500 | Scratch | 2.5k/1k; mainnet-ready by Sep 30 |
| 12 | Arc | Launch (Continuity) | $1,500 | Continuity | Same incl. Sep 30 deadline |
| 13 | World | AgentKit Continuity | $3,500 | Continuity | 3x$1,166; AgentBook, Sandbox App, FEEDBACK DOC REQUIRED |
| 14 | World | Selfie Check | $3,500 | Scratch | 3x$1,166; risk/eligibility/fairness signal; feedback doc required |
| 15 | 1inch | Build an Aqua App | $5,000 | Scratch | 2.5k/1.5k/1k; official Aqua/SwapVM contracts required; local forks OK |
| 16 | 1inch | Aqua App (Continuity) | $2,000 | Continuity | 1.5k/0.5k; identical requirements |
| 17 | ENS | Best Use of ENSv2 | $4,500 | Scratch | 1.5k/1.5k/1k/0.5k; ENSv2 Sepolia central, no hard-coded values |
| 18 | ENS | Continuity Integration | $500 | Continuity | ENSv2 Sepolia into existing project's testnet |
| 19 | Uniswap | Stack Contribution | $3,000 | Scratch | 3x$1,000; OSS + FEEDBACK.md + feedback form |
| 20 | Uniswap | Stack Contribution (Continuity) | $2,000 | Continuity | 2x$1,000; identical |
| 21 | Ledger | AI Agents x Ledger | $3,500 | Scratch | 2k/1k/0.5k; Ledger Agent Stack, Key Ring CLI; DX feedback required |
| 22 | Ledger | Continuity | $1,500 | Continuity | 1k/0.5k; Ledger signers into shipped apps |
| 23 | Privy | Best B2B Financial Product | $2,500 | Either | Org wallets core; ≥1 Privy control (policies/signers/quorums/intents) |
| 24 | Privy | Best Financial Flow | $2,500 | Either | ≥1 complete functional flow; Cards must be mocked + another live flow |
| 25 | Chainlink | Confidential Workflow (CRE) | $2,000 | Scratch | 2x$1,000; handlerInTee with ≥1 sensitive input |
| 26 | Chainlink | Continuity Upgrade | $500 | Continuity | ≥1 Chainlink service contributing to onchain state change |
| 27 | Chainlink | Liquidation Protection Challenge | $500 | Scratch | Join via Sepolia contract, opens Sep 9 |
| 28 | Bazantic | Help an Agent Use Your Project | $1,000 | Continuity | 2x$500; x402 Gateway + Recipe + A/B test |
| 29 | Bazantic | Best Recipe Using Sponsor APIs | $1,000 | Either | 0.5k/0.3k/0.2k; multi-service workflow |
| 30 | Bazantic | Agentify a New API | $1,000 | Either | 0.5k/0.3k/0.2k; previously unavailable API |

Sponsor totals: The Graph $15K, Hedera $15K, Arc $10K, World $7K, 1inch $7K, ENS $5K, Uniswap $5K, Ledger $5K, Privy $5K, Chainlink $3K, Bazantic $3K.

## 6. Judging Criteria [A1]

Five equal criteria at 20% each (finalist track): Technicality (problem complexity + solution sophistication), Originality (novelty or creative problem-solving), Practicality (functionality + real-world usability), Usability (UI/UX/DX intuitiveness), WOW Factor (unique or impressive elements). Finalist format: 7 min (4 demo + 3 Q&A).

## 7. Event Class & Judge Reading

**BOTTOM LINE:** event_class = **sponsor_track**. All $80K itemized is sponsor money; no organizer cash prize found. Sponsor engineers/devrel judge their OWN prizes asynchronously against the written qualification bullets. Two-round async judging; ~20% advance to live finals; most prizes go to NON-finalists.

**EVIDENCE:**
- [A1] Prize pages carry unusually explicit qualification checklists (The Graph disqualifies mocked data outright; World requires a written DX feedback doc; Bazantic requires an A/B test; Ledger requires `wallet-cli ring` specifically).
- [B3] No named judges published anywhere public; standard ETHGlobal model applies.
- [A1] ETHOnline 2025: 634 projects, 10 finalists (~1.6% finalist odds); dozens of sponsor prizes went to non-finalists.

**CONFIDENCE:** High on event class and mechanism; medium on judge identities (none published).

**SO WHAT:** The prize-page qualification bullets ARE the rubric. Treat them as literal checklists. EV-maximizing play is deep sponsor-track integration, not finalist-chasing. Judges at sponsors grep for their SDK in your repo; bolted-on usage is explicitly disqualified in multiple prize texts.

## 8. Workshop Signals

**The agenda is login-gated and not publicly retrievable** [A2 for the negative finding]. `/agenda` and `/schedule` return hard 404s (confirmed twice via WebFetch + raw curl); main event page returns HTTP 500; `/info/` is a hub with no session list; no search-indexed workshop content. Organizer signal must be inferred from the prize pages instead (fully scraped, public). Manual check worth doing: logged-in Hacker Dashboard + youtube.com/@ETHGlobal live tab for "ETHOnline 2026" streams (online-event workshops are typically sponsor-run and streamed during week 1).

## 9. Tech Deep Dive (per sponsor)

**BOTTOM LINE:** 7 of 11 sponsors are pushing sub-6-month-old agent-facing primitives. The freshest, most prize-dense surfaces: Hedera x402 via Blocky402 (announced Feb 10 2026), The Graph MCP + SKILLs (Subgraph MCP live-query milestone Aug 16 2026), 1inch Aqua (opened to devs July 27 2026), Ledger Key Ring CLI (wallet-cli 2.0.0), Circle Nanopayments + Agent Stack, World AgentKit (Mar 17 2026) + Selfie Check (Beta), ENSv2 agent primitives, Chainlink CRE Confidential Workflows (2026 early access).

| Sponsor | Core primitive | Hello-world time | Vintage | Deep vs bolted-on bar |
|---|---|---|---|---|
| The Graph | Subgraph MCP + Substreams SKILLs + standardized subgraphs (Agent0/ERC-8004) | <30min (MCP + Gateway key) | HOT (Aug 2026 MCP milestone) | Deep = compose ≥2 products, decisions from live data. One GraphQL query in a UI explicitly disqualified |
| Hedera | x402 via Blocky402 facilitator (gas-free spending ceiling, metered settlement), Agent Kit, ATS, Harness | 30min-2h (PoC repo exists) | HOT (x402 Feb 2026; prior bounty ran) | Deep = metering + HCS audit trail + ERC-8004/HCS-14 identity + Scheduled Txs. Flat-fee 402 endpoint = bolted-on |
| Arc (Circle) | Arc L1 (USDC native gas, sub-second finality), App Kits, Agent Stack, Nanopayments | <30min (App Kits npm) | HOT (Nanopayments new; mainnet window ~Sep 30) | Deep = decision-signal agent + nanopayment-metered flows, mainnet-ready. Testnet USDC transfer = bolted-on |
| World | AgentKit (proof-of-human + x402 on same endpoint; AgentBook on World Chain eip155:480), Selfie Check (Beta, TestFlight sandbox) | 30min-2h | HOT (AgentKit Mar 2026, Selfie Check Beta now) | Deep = Selfie Check as load-bearing sybil/fairness signal. Login button = bolted-on. Feedback doc is a hard requirement |
| 1inch | Aqua shared liquidity (LPs self-custody, one balance backs many strategies) + SwapVM instruction-set VM | 2h+ (Solidity-heavy, sparse examples) | HOT (opened Jul 27 2026; 8 audits, 13 EVM chains) | Deep = custom SwapVM program, onchain execution shown (local forks OK). 1inch swap API does not qualify at all |
| ENS | ENSv2 on Sepolia: hierarchical registry, wildcard resolution, Enhanced Access Control, Permissioned Resolvers, Agent Text Records + agent-native CLI | 30min-2h | HOT + pivoting (Namechain L2 cancelled Feb 2026, L1-only) | Deep = permissioned registry mechanics or agent identity via Agent Text Records as core. Name display = cosmetic, disqualified |
| Uniswap | v4 hooks (mature), CCA continuous clearing auctions (new, modular via hooks, zk-eligibility) | Hooks 30min-2h; CCA 2h+ | CCA fresh; "Uniswap AI" repo listed as resource | Deep = novel hook or CCA extension with verifiable contract lines. API swap routing = bolted-on. FEEDBACK.md + form mandatory |
| Ledger | Agent Stack: Wallet CLI + DMK Skills + Key Ring CLI (`wallet-cli ring`, secrets under seed-derived keys, headless for CI/agents) | <30min WITH device | HOT (ring merged in wallet-cli 2.0.0) | Deep = agent secrets in Key Ring + device confirmation for irreversible actions. GOTCHA: physical Ledger hardware needed for the real flow |
| Privy | Org wallets, policy engine, key quorums, intents (async approval, 72h expiry) | <30min basic; controls 30min-2h | Controls surface fresh (docs thru Aug 2026) | Deep = m-of-n quorum + policies + intents encoding real org approval. Login modal = bolted-on |
| Chainlink | CRE Confidential Workflows (TEE): `handlerInTee`, secrets fetched inside enclave | 30min-2h via templates; CLI simulation accepted | HOT (CRE Nov 2025; Confidential Compute 2026 early access, private beta) | Deep = TEE protects genuinely sensitive logic driving onchain state. Placeholder handlerInTee explicitly non-qualifying. Functions/Automation deprecated: use CRE |
| Bazantic | x402/MPP Gateways from OpenAPI specs, hosted MCP, Recipes | <30min claimed; no public quickstart (expect rough edges) | Brand new (hackathon page IS the launch surface) | Deep = Recipe with controlled A/B showing measurable agent improvement. Gateway without comparative evidence = bolted-on |

## 10. Network / Chain Infrastructure

**Multi-chain event: no single event chain. Each sponsor prescribes its own network** [A1]:

| Sponsor | Network | Notes |
|---|---|---|
| Hedera | Hedera testnet or mainnet | x402 service live via Blocky402; ATS on testnet, verified contracts on HashScan |
| Arc | Arc testnet (public since Oct 2025); mainnet window | USDC is native gas; mainnet-ready by Sep 30 for launch prize |
| ENS | Ethereum Sepolia (ENSv2 deployments) | ENS App + Explorer in public Beta on Sepolia; NOT Namechain (cancelled) |
| 1inch | Any of 13 EVM chains; **local forks explicitly OK for the demo** | Redeployed modified SwapVM allowed |
| Chainlink | CRE CLI simulation accepted OR live deployment; Liquidation Challenge joins via **Ethereum Sepolia contract (opens Sep 9)** | Confidential Compute access via deploy access form |
| World | World Chain (eip155:480) for AgentBook; Sandbox App for remote testing | Selfie Check sandbox via TestFlight/private Play |
| The Graph | Any chain with a Graph provider; must consume LIVE data (Subgraph Studio or The Graph Market) | Mocked/static datasets disqualify |
| Uniswap | Any chain with v4/CCA deployments | Point README to exact contracts + lines |
| Privy / Ledger / Bazantic | Chain-agnostic infra | Privy: ≥1 live flow; Ledger: device-backed; Bazantic: hosted gateways |

## 11. Ecosystem Products

Key product inventory (see sponsors-deep.md for full doc links): The Graph (Subgraph MCP, Substreams SKILLs, standardized subgraphs, Agent0/ERC-8004 subgraphs, Pinax EVM primitives), Hedera (Blocky402, Agent Kit JS, Harness, Hedera Skills, ATS SDK), Circle (App Kits, Agent Stack starter kits, Nanopayments, Paymaster, Gateway), World (AgentKit, AgentBook, Selfie Check, IDKit, llms.txt), 1inch (Aqua contracts, SwapVM, Aqua SDK + whitepaper), ENS (ENSv2 contracts on Sepolia, agent-native CLI, Agent Text Records specs), Uniswap (v4 hooks, CCA, Uniswap API, Uniswap AI repo), Ledger (Wallet CLI, DMK Skills, Key Ring), Privy (embedded/org wallets, policies, quorums, intents, agentic wallets recipe), Chainlink (CRE, Confidential Workflows templates: AI Smart Contract Audit Firewall, Automated Liquidation Protection), Bazantic (Baz AI gateway generator, CLI, hosted MCP). Note: this environment already has an agentcash MCP wallet with x402/MPP support, directly reusable for testing Bazantic/Hedera x402 flows.

## 12. Capability Sheet (what is uniquely possible per sponsor)

- **Hedera:** gas-free agent micropayments (Blocky402 sponsors settlement; agent signs a spending ceiling off-chain), HCS verifiable audit trails, Scheduled Transactions for recurring/streamed payments, HTS custom fee schedules, HCS-14 agent identity. Uniquely possible: metered pay-per-call AI services where the payer never touches gas.
- **The Graph:** natural-language querying of 15k+ subgraphs via MCP; one-prompt Substreams pipeline deployment (the featured challenge); ERC-8004 agent discovery via Agent0 subgraphs. Uniquely possible: an agent whose decisions are grounded in live, indexed onchain data across protocols/chains through one standardized interface.
- **Arc:** USDC as native gas + sub-second deterministic finality + Nanopayments. Uniquely possible: agent-to-agent nanopayment streams with no gas-token juggling.
- **World:** the same endpoint serving both proof-of-human AND x402 payment (agentkit.fetch); AgentBook resolving wallet to anonymous humanId onchain. Uniquely possible: actions gated on "a real distinct human stands behind this agent."
- **1inch Aqua:** one LP balance backing multiple strategies simultaneously with full self-custody; SwapVM composable strategy programs. Uniquely possible: capital-efficient multi-strategy liquidity that no vault model can replicate.
- **ENSv2:** hierarchical registries with Enhanced Access Control and Permissioned Resolvers; Agent Text Records. Uniquely possible: permission-scoped agent namespaces (parent controls what child names can do).
- **Ledger:** secrets encrypted under seed-derived keys, decryptable on any machine from the seed, headless for agents in CI. Uniquely possible: agents that hold secrets they cannot leak, with hardware human-in-the-loop for irreversible actions.
- **Privy:** intents (async approval resource) + nested key quorums + policy engine. Uniquely possible: agent-proposes / humans-approve org treasury flows with real m-of-n structure.
- **Chainlink CRE:** TEE handlers inside consensus workflows; you choose what crosses back to the DON. Uniquely possible: private strategy logic driving public onchain state changes.
- **Uniswap CCA:** continuous-time uniform-price auctions modular via hooks (per-user caps, allowlists, zk-eligibility). Uniquely possible: novel fair-launch mechanics as hook extensions.
- **Bazantic:** spec-to-gateway generation (no protocol work). Uniquely possible: cheapest path to making any API agent-payable.

## 13. Competitor Landscape

**BOTTOM LINE:** Official roster hidden until after the Sep 16 deadline (showcase returns "No projects found"). Exactly ONE publicly evidenced 2026 entrant found: **ChainSight**.

**EVIDENCE:**
- [B2] ChainSight (github.com/topics/ethonline): self-described "natural-language on-chain analyst with verifiable AI; routes across The Graph, Hedera, and Blockscout; provenance notarized to 0G Storage; submitted for ETHOnline 2026." Start Fresh; stacks The Graph AI tooling + Hedera. Threat: MEDIUM-HIGH (targets the two biggest pots, $15K + $15K, with the exact "AI tooling" ask).
- [A2] Roster NOT discoverable: showcase URL explicitly empty; searches surfaced only stale pre-2026 repos. Full negative finding at research/roster-audit/NOT-DISCOVERABLE.md.
- [C3] Density inference from 2025 base rates (634 submissions): crowded lanes = agentic payments (Hedera/Arc/Ledger pull the same build), AI-analyst-over-The-Graph, USDC/Arc payment apps. Thin lanes = Uniswap stack contributions, Chainlink Confidential Workflows, Bazantic, ENSv2 Sepolia, World Selfie Check (thin on entrants but see Kill List: contested on quality).

**CONFIDENCE:** High on the negative finding; low-medium on density predictions (inference only).

**SO WHAT:** Differentiate from ChainSight's read-analyst shape (it analyzes; it does not transact or get paid). Re-check the showcase after Sep 16 plus github.com/topics/ethonline sorted by recently-updated.

## 14. Community Pain (verbatim, primary sources)

**BOTTOM LINE:** GitHub is the richest vein; four solid verbatim captures. Each is a build opportunity or a hazard map.

1. **Hedera x402 docs gap** [A1]: hashgraph/hedera-agent-kit-js#903 (Utkal059, bounty builder): *"the documentation for setting up x402 middleware with HCS was sparse. It wasn't clear how to handle payment verification callbacks in an async LangGraph ReAct loop... There was no example showing how to wire x402 middleware with an MCP server so that tool calls only proceed after a confirmed HBAR micropayment. I had to piece it together from the x402 spec and the Agent Kit source code manually, which took significant time."* Sister issues #892 ("x402 + MCP payment-triggered agent template") and #1007 ("Hedera Agent Kit + x402 payments example") confirm the same gap. SO WHAT: a working, documented x402+MCP-on-Hedera pattern is itself prize-worthy.
2. **1inch Aqua accounting hazard** [A1/B2]: 1inch/aqua#26: *"Aqua updates internal balances by the requested amount and then performs the ERC20 transfer without verifying the actual amount moved. For fee-on-transfer (taxed) or rebasing tokens, the internal Aqua accounting diverges from real wal[let balances]"*. Plus OpenZeppelin's MVP v1.0 audit: 5,100+ ERC-20s where `token.withdraw()` can strand assets in SwapVM; the AquaAMM builder *"imports ProgramBuilder from test/ using relative paths, which bypass remappings and can make compilation and deployment packaging brittle."* Repo has 88 open issues. SO WHAT: Aqua is early and rough; judges reward teams that navigate SwapVM correctly; avoid fee-on-transfer/rebasing tokens in demos.
3. **Substreams CLI papercuts** [A2]: streamingfast/substreams PR #925: *"`substreams registry login` failed with a 'no such file or directory' error when `~/.config/substreams` didn't exist yet."* The Graph knows Substreams authoring is hard: their featured challenge is literally one-prompt pipeline deployment via SKILLs.
4. **Chainlink CRE trust gap** [B3]: community analysis (Eman Herawy, "From Building Workflows to Breaking Them"): simulation *"validates SDK integration but cannot detect non-determinism or multi-node consensus failures, and passing simulation does not imply production safety... the gaps between 'it compiles' and 'it's secure.'"* Confidential Workflows shipped so recently there is essentially no public complaint corpus: first-mover surface.
5. **ENSv2 whiplash** [B2]: ENS Labs killed Namechain in Feb 2026 after 2 years (*"We've invested significantly in Namechain... Many people think of ENSv2 and Namechain as synonymous"*). Community docs and old tutorials still assume the L2. SO WHAT: use only canonical ENSv2 Sepolia docs; stale-doc trap is real.

Honest note: no verbatim X/Reddit rants exist for Aqua, ENSv2, Bazantic, or Ledger Agent Stack (products too new/niche); GitHub issues above are the authentic signal.

## 15. Past Editions Analysis

**BOTTOM LINE:** Online ETHGlobal editions reward payments/stablecoin UX, agentic/AI infra, and novel security primitives; sponsor spec-literalism + one novel twist is the repeat winning formula; most money goes to non-finalists.

**EVIDENCE [A1 unless noted]:**
- ETHOnline 2025: 1,670 hackers, 634 projects, 10 finalists (OpenPayAI pay-per-crawl, Sippy WhatsApp wallet, Common-Lobbyist DAO memory agents, SafeSend escrow, EthVaultPQ, ChronoVault, CronPay, etc.). 4 of 10 payments; ~4 of 10 AI/agentic.
- ETHOnline 2024: 417 projects, 8 finalists. AI share rising year over year: expect 2026 majority-AI.
- Sponsor-prize winners were non-finalists building exactly what the sponsor asked (both Blockscout winners were AI-agent-over-MCP; Hedera 2025 winners were literally A2A systems and MCP servers per the prize text; 1inch Buenos Aires top-10 included Aqua0 on brand-new Aqua) [A1/B2].
- [C3] Async judging amplifies video + README quality; artifact quality IS the product.

**CONFIDENCE:** High.

**SO WHAT:** Implement the prize text verbatim, add one memorable layer, prove it on-chain, and make the 2-4 min video + README carry the judging. Real deployments beat mocks (Arc mainnet push is a differentiator few teams do).

## 16. Broader Market Context

**BOTTOM LINE:** Agentic payments (x402) + agent identity is THE organizing thesis of this event, not one theme among several. Keyword scan of the full prizes page: "x402" x20, "agent" x107, "MCP" x14 across ≥7 of 11 sponsors; ~$58K of $80K touches agents/x402/MCP [A1 scrape].

**EVIDENCE [B2 unless noted]:**
- x402 Foundation (Linux Foundation) operational since July 2026, 40+ members (Visa, Mastercard, Stripe, Google, AWS, Circle, Shopify). ~165M txs / ~69k active agents / ~$50M volume by April 2026. Honest caveat repeated across sources: "the narrative around agentic commerce is running ahead of actual adoption." Hedera's own prize copy admits it: *"x402 on Hedera is still short of one thing: actual services you can pay for."*
- ERC-8004 live on mainnet since Jan 29 2026; a June 2026 arXiv study (2606.26028) found the Reputation Registry "cannot function as a trust signal as currently deployed" (Sybil reviewers): an open problem a hack could attack.
- RWA/tokenization: $31-60B tokenized, institutional-dominant narrative (maps to Hedera ATS + Privy B2B).
- L1-first shift: ENS scrapped Namechain, Fusaka-era gas doubling, 99% registration cost reduction.
- Privacy/confidential compute rising (Chainlink CRE TEE is the whole $3K).

**CONFIDENCE:** High on narrative mapping; medium on adoption figures.

**SO WHAT:** Real, working paid services win (the sponsors are explicitly buying proof their payment rails have actual services). The counter-programming niches with less crowding: 1inch SwapVM, Chainlink TEE, Hedera ATS, Privy B2B.

## 17. Category Saturation

- **Grid analysis: not applicable** (Grid is a Solana-ecosystem tool; this is an Ethereum-ecosystem event).
- **Copilot roster scan: skipped** (no GitHub PAT available this run).
- Saturation judgment therefore rests on the roster audit (§13) + 2025 base rates: agentic-payments middle lane predicted MOST crowded (three sponsors pull the identical build); The Graph AI tracks and World Selfie Check predicted most contested per entrant volume; 1inch Aqua predicted best $-per-competitor.

## 18. Key Links & Resources

- Event: https://ethglobal.com/events/ethonline2026 (+ /prizes, /info)
- Raw scraped prize text: /tmp/prizes.txt (1,123 lines, full 11-sponsor detail)
- Showcase (re-check after Sep 16): https://ethglobal.com/showcase?events=ethonline2026
- Competitor topic feed: github.com/topics/ethonline (sort recently-updated)
- Ledger hackathon hub: https://developers.ledger.com/ethonline
- ETHGlobal X: x.com/ETHGlobal (deadline announcement: status/2086863835991028111)
- Full per-sponsor doc tables: research/sponsors-deep.md

## 19. Track Coverage Matrix

Est. competition: LOW / MED / HIGH (inference, [C3] except where noted).

| Track | Prize | Judging focus | Overlap potential | Est. competition |
|---|---|---|---|---|
| Graph: Composable/Standardized | $5,000 | ≥2 products composed or standardized schema, live data | Pairs with any AI/agent build | MED |
| Graph: AI (Scratch) | $5,000 | Load-bearing live Graph data, meaningful reasoning/automation | Core of agent combo | HIGH (ChainSight confirmed here) |
| Graph: AI (Continuity) | $5,000 | Same + documented pre-existing repo | Continuity farm anchor | LOW-MED |
| Hedera: x402 Agentic Payments | $6,000 | Live Blocky402 service + ≥1 real paid request e2e | Anchors agent combo; Bazantic/Graph stack | HIGH (biggest agent pot) |
| Hedera: OSS Harness | $2,000 | Meaningful PR/harness extension, before/after DX | Standalone side quest | LOW |
| Hedera: Tokenization (ATS) | $6,000 | ATS issuance + lifecycle, HashScan-verified | RWA/Privy-B2B pairing | LOW-MED |
| Hedera: Continuity | $1,000 | Substantive new Hedera work on pre-existing project | Continuity farm | LOW |
| Arc: DeFi/Onchain Finance | $1,667 | Programmable USDC money flows, working MVP | Custody combo | MED |
| Arc: Agentic Economy | $1,667 | Real decision signals + Agent Stack/Nanopayments | Agent or custody combo | HIGH |
| Arc: Continuity | $1,666 | Same, registered Continuity | Continuity farm | LOW |
| Arc: Launch to Mainnet | $3,500 | Production-ready, mainnet by Sep 30 | Bonus atop any Arc build | MED |
| Arc: Launch (Continuity) | $1,500 | Same | Continuity farm | LOW |
| World: AgentKit Continuity | $3,500 | Meaningful AgentKit + AgentBook + Sandbox + feedback doc | Continuity farm anchor | LOW (Continuity barrier) |
| World: Selfie Check | $3,500 | Load-bearing risk/fairness signal + feedback doc | Identity combo | HIGH (low-friction, attracts volume) |
| 1inch: Aqua App | $5,000 | Sophisticated SwapVM position, onchain execution (fork OK) | Chainlink-TEE pairing | LOW (best $-per-competitor) |
| 1inch: Aqua (Continuity) | $2,000 | Identical | Continuity | LOW |
| ENS: Best Use of ENSv2 | $4,500 | ENSv2 Sepolia central, functional, no hard-coding | Identity combo | MED |
| ENS: Continuity | $500 | ENSv2 into existing testnet deployment | Continuity farm | LOW |
| Uniswap: Stack Contribution | $3,000 | v4 hooks/CCA/tooling + FEEDBACK.md + form | CCA angle thin | MED (hooks) / LOW (CCA) |
| Uniswap: Continuity | $2,000 | Identical | Continuity | LOW |
| Ledger: AI Agents | $3,500 | Key Ring CLI central, autonomy boundaries, DX feedback | Custody combo anchor | MED (hardware requirement filters) |
| Ledger: Continuity | $1,500 | Ledger signers into shipped apps | Continuity farm | LOW |
| Privy: B2B Financial Product | $2,500 | Org wallets + ≥1 control + B2B workflow | Custody combo | MED |
| Privy: Best Financial Flow | $2,500 | ≥1 complete live flow | Broad overlap | HIGH (low-friction) |
| Chainlink: Confidential Workflow | $2,000 | handlerInTee with real sensitive input, core not placeholder | 1inch/DeFi pairing | LOW |
| Chainlink: Continuity | $500 | Chainlink service driving state change | Continuity farm | LOW |
| Chainlink: Liquidation Challenge | $500 | Fixed rubric, join via Sepolia contract Sep 9 | Deterministic side quest | LOW |
| Bazantic: Agent Use Your Project | $1,000 | Gateway + Recipe + A/B video | Continuity farm; agent combo | LOW |
| Bazantic: Recipe w/ Sponsor APIs | $1,000 | Multi-service repeatable workflow | Agent combo third slot | LOW |
| Bazantic: Agentify a New API | $1,000 | New API gateway + combined recipe | Agent combo alternative | LOW |

## 20. Domain Knowledge Sources

| Sponsor | Essential docs | Flag |
|---|---|---|
| The Graph | thegraph.com/docs/en/ai-overview/ ; github.com/graphprotocol/subgraphs-skills ; github.com/streamingfast/substreams-skills | ESSENTIAL |
| Hedera | docs.hedera.com/solutions/ai/x402 ; blocky402.com ; github.com/hedera-dev/x402-inference-pay-per-request-poc ; github.com/hashgraph/hedera-agent-kit-js | ESSENTIAL |
| Arc | docs.arc.io/ (+/app-kit) ; developers.circle.com ; github.com/circlefin/agent-stack-starter-kits | ESSENTIAL |
| World | docs.world.org/agents/agent-kit/integrate ; docs.world.org/world-id/sandbox/testing-selfie-check ; docs.world.org/llms.txt | ESSENTIAL if selected |
| 1inch | github.com/1inch/aqua ; 1inch.com/assets/1inch-aqua-white-paper.pdf | ESSENTIAL if selected (whitepaper-level, budget ramp time) |
| ENS | docs.ens.domains/ensv2/overview/ + Sepolia Deployments section | ESSENTIAL if selected (ONLY ENSv2 docs; pre-Feb-2026 tutorials assume dead Namechain) |
| Uniswap | developers.uniswap.org ; github.com/Uniswap/continuous-clearing-auction | If selected |
| Ledger | developers.ledger.com/ethonline ; developers.ledger.com/docs/ai-tools/ledger-cli | ESSENTIAL if selected (hardware gotcha) |
| Privy | docs.privy.io (org wallets, policy-and-controls, intents, agentic-wallets recipe) | If selected |
| Chainlink | docs.chain.link/cre/concepts/confidential-workflows + starter templates | If selected |
| Bazantic | bazantic.com (no public quickstart; ask in event channel) | If selected |

## 21. Prize Stacking Strategy

**BOTTOM LINE:** Max 3 partner prize selections per submission (verified [A1]: "Up to 3 partner prize selections"). One build track only: the Scratch vs Continuity choice LOCKS prize eligibility ("Wrong track selection: prizes locked to selected track" is a listed disqualifier, and for Continuity "eligibility for partner prizes may vary by event and partner"). Pick the 3 sponsors first, then design one architecture that satisfies all three requirement lists verbatim.

**Candidate 3-prize combos:**

1. **Agent combo (highest EV): Hedera x402 ($6K track) + The Graph AI ($5K track) + Bazantic ($3K across tracks).** Total addressable: $14K-plus of sponsor money ($15K + $15K + $3K sponsor pools; realistic winnable slots ~$8K per sponsors-deep analysis). Composition logic: ONE loop covers all three: Graph MCP supplies live onchain data as the agent's decision signal; the service is x402-gated on Hedera via Blocky402 with ≥1 real paid request; published as a Bazantic Gateway + Recipe with an A/B test. Bonus: directly answers Hedera's own admission ("still short of actual services you can pay for") and closes the #903/#892/#1007 documentation gap.
2. **Custody combo: Privy ($5K) + Ledger ($5K) + Arc ($10K).** Total addressable: $20K of sponsor pools (realistic slots ~$7.7K: Privy $2.5K + Ledger $2K + Arc $1.67K, plus the Arc mainnet launch $2.5K bonus if mainnet-ready by Sep 30). Composition logic: thematically identical stories ("autonomous but controlled money"): agent proposes USDC payments on Arc; Privy org wallet policies + intents encode approval; Ledger Key Ring holds secrets, device confirmation for irreversible moves. Risk: physical Ledger hardware required.
3. **Continuity farm: The Graph AI Continuity ($5K) + World AgentKit Continuity ($3.5K) + Bazantic "Help an Agent Use Your Project" ($1K).** Total addressable: $9.5K in Continuity-only pots with predicted single-digit-% competing fields (first online edition with Continuity; most of 1,600+ hackers lack an eligible repo; Dami's shipped agent-infra portfolio, AgentMesh/Backstop/Verdikt/x9, IS the moat). Caveats: substantive new features only (polish/bugfixes disqualify per Hedera's text), pre-existing work documented, and Continuity partner-prize eligibility varies by partner: verify each of the 3 selected sponsors honors Continuity before locking.

**Rules of engagement:**
- Integrating sponsors beyond your 3 selections adds judging WOW but ZERO prize eligibility. Depth on the selected 3 beats breadth: sponsor judges explicitly penalize bolted-on usage (disqualifying language appears in Graph, ENS, Chainlink, World prize texts).
- Feedback docs are free points and HARD requirements: World (both tracks), Uniswap (FEEDBACK.md + form), Ledger (all submissions). Budget an hour each.
- Date traps: Chainlink challenge contract opens Sep 9; Arc mainnet-readiness Sep 30; submission Sep 13 12:00 EDT.

## 22. Kill List

### Saturated (do not build)
- **Generic agentic-payments middle lane:** "an agent that pays for an API with x402" with no differentiation. Three sponsors (Hedera, Arc, Ledger) pull the identical build from 600+ teams; the crowded middle is the default output of this prize page. Only enter with a specific edge (e.g. the documented x402+MCP pattern gap, HCS audit trails, metering).
- **Organizer-suggested idea shapes implemented literally:** Hedera's extra-points list, Circle's "agents that transact on Arc," Graph's featured Substreams challenge: these are the highest-collision templates because every reader sees them. Use them as requirement checklists, not as the idea.
- **World Selfie Check as primary:** predicted most-contested per entrant volume (low-friction product, $3.5K split 3 ways).
- **AI-analyst-over-The-Graph:** most-contested lane; ChainSight is already publicly building exactly this, plus 2025 precedent (Wallet Whisperer, brexo both won as AI-analyst-over-MCP).

### Broken / risky dependencies
- **ENSv2 stale docs:** all pre-Feb-2026 ENS tutorials assume the cancelled Namechain L2. RISK, not blocker: use only canonical ENSv2 Sepolia docs.
- **Hedera x402 documentation gaps:** #903/#892/#1007 prove async payment-callback + MCP wiring is undocumented. RISK note: budget piecing it together from spec + source (also an opportunity: see Prize Stacking).
- **1inch Aqua sharp edges:** fee-on-transfer/rebasing token accounting divergence (#26), token.withdraw() stranding (OZ audit), brittle test-path imports, 88 open issues. Avoid exotic tokens; 2h+ ramp.
- **Chainlink Confidential Compute:** private beta; access via deploy form; simulation passes do not imply production safety. Use CLI simulation as the accepted evidence path.
- **Ledger hardware requirement:** real flow needs a physical device; confirm judge-accepted alternatives before selecting.
- **Bazantic:** no public quickstart; expect rough edges, ask in the event channel.
- **Privy Cards:** must be mocked; a second LIVE flow is mandatory for eligibility.

### Already built (overlap zone)
- **ChainSight overlap zone:** natural-language onchain analyst routing across The Graph + Hedera with verifiable provenance. Any read-only analyst agent over Graph data collides head-on. Differentiate by transacting/getting paid (write-side), not analyzing (read-side).
- 2025 winners to not re-tread: pay-per-crawl (OpenPayAI), WhatsApp wallet UX (Sippy), MCP-server-for-chain-data (Aetheros pattern).

### Zero alignment (auto-kill)
- Anything not mapped to at least one of the 11 sponsors' written qualification lists: there is NO organizer cash prize pool; a non-sponsor-aligned idea has $0 addressable EV at this event.
- Restaking, pure gaming, pure consumer social: no sponsor maps to them here.
- TradFi-with-agents-bolted-on with no sponsor primitive load-bearing.
