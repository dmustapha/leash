# ETHOnline 2026 — Sponsor Deep Intel

Researched 2026-09-08. Event window per Ledger's page: Sept 4–16, submissions ~Sept 13. Total pool $80,000 across 11 sponsors. ETHGlobal allows **max 3 partner prize selections per submission**. Two eligibility pools recur across sponsors: **Scratch** (net-new, begun during the hackathon) and **Continuity** (extends an existing open-source repo / shipped product; pre-existing work must be documented, only event work judged).

Admiralty tags: [A1] official ETHGlobal prize page / official docs, [A2] official GitHub, [B2] sponsor blog/press release, [C3] third-party press/aggregator.

---

## The Graph — $15,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best Use of Composable or Standardized Graph Products | $5,000 (2.5k/1.5k/1k) | Both (not pool-restricted) | "Either compose two or more of The Graph's products, or build meaningfully on a standardized schema." "Consume live data from a Graph provider" (Subgraph Studio or The Graph Market). "Simply querying one Subgraph with no composition or standardization does not qualify." Must show how standards simplify dev across multiple protocols/chains. Public repo + 2–4 min demo video. |
| Best AI Tooling or AI Use Case (From Scratch) | $5,000 (2.5k/1.5k/1k) | **Scratch only** — "Net-new (Start Fresh): projects begun and built during the hackathon" | "Use The Graph as a load-bearing part of the project." "Consume live data from a Graph provider." "Do meaningful work with the data: reasoning, decisions, automation, or a natural-language interface." "Open-source the code with a clear README or SKILL.md." Featured challenge: deploy Substreams pipelines via Substreams SKILLs from a single natural-language prompt. Public repo + 2–4 min video. |
| Best AI Tooling or AI Use Case (Continuity) | $5,000 (2.5k/1.5k/1k) | **Continuity only** | Same as above + "Document the pre-existing work; only work done during the event is judged." |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| The Graph AI overview | https://thegraph.com/docs/en/ai-overview/ |
| MCP + Skills blog (how it works) | https://thegraph.com/blog/querying-blockchain-data-natural-language-mcp-skills/ |
| Hackathon resources | https://thegraph.com/blog/hackathon-resources/ |
| Subgraph SKILLs | github.com/graphprotocol/subgraphs-skills |
| Substreams SKILLs | github.com/streamingfast/substreams-skills |
| Standardized Substreams modules | github.com/streamingfast/substreams-chain-modules |
| Messari Standardized Subgraphs, Agent0/ERC-8004 Subgraphs, Pinax EVM Primitives | linked from prize page |

- **Time to hello world: <30min** for Subgraph MCP + Gateway API key (agent can search 15k+ subgraphs, read schemas, run GraphQL via natural language). Substreams SKILLs pipeline deployment: 30min–2h (Rust toolchain + sink setup).
- **Vintage:** HOT. Subgraph MCP "live Subgraph queries" milestone dated **Aug 16, 2026** [C3 TradingView/coinmarketcal]; MCP servers + AI agent Skills for Subgraphs AND Substreams all shipped recently; "Onchain Agent Infrastructure Stack" blog positions ERC-8004 subgraphs for agent discovery. This is exactly the featured challenge — very fresh surface.
- **Integration depth bar:** Deep = agent that composes ≥2 Graph products (e.g. Subgraph MCP + Standardized Substreams) and makes decisions/automation from live data; bolted-on = one GraphQL query displayed in a UI (explicitly disqualified).

---

## Hedera — $15,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| AI & Agentic Payments on Hedera | $6,000 (up to 3 × $2,000) | Scratch-leaning (Continuity has own track) | Host a live x402-gated service on Hedera testnet/mainnet **via Blocky402 facilitator**; build a platform/agent consuming it with **≥1 real paid request end-to-end**; public repo with README covering setup/architecture/payment flow; demo video ≤5 min showing paid request execution. Extra points: pay-per-call metering vs flat charges, multi-agent negotiation (A2A/ACP), on-chain agent identity (ERC-8004/HCS-14), service discovery (UCP/directory), HTS tokens or custom fee schedules, verifiable audit trails on HCS, recurring/streamed payments via Scheduled Transactions. |
| Open Source — Improve the Hedera Harness | $2,000 (up to 2 × $1,000) | Either | Meaningful contribution to Hedera Harness (open PR acceptable) OR new harness extending it; public repo/PR + README explaining problem and usage; demo ≤5 min. Extra: expanded service coverage, tests/docs/examples, harness for an uncovered language/framework, before/after DX evidence. |
| Tokenization of Anything | $6,000 (up to 3 × $2,000) | Scratch-leaning | Use Asset Tokenization Studio (SDK, contracts, web app, or combo) to issue/manage a tokenized asset; deploy on Hedera testnet; public repo with **verified contracts on HashScan**; demo ≤5 min showing issuance, configuration, ≥1 lifecycle operation. Extra: secondary market, compliance controls (KYC/freeze/restrict/pause), custom fees/distributions/royalties, oracle pricing, Scheduled Transactions for vesting/settlement, contributions back to ATS. |
| Continuity | $1,000 (single) | **Continuity only** | Project must pre-exist (prior hackathon or already on Hedera); substantive new work during event (new features, new Hedera services, architectural changes); README separating old vs new; demo ≤5 min on new work. Extra: real users/traction/live deployment, newly integrated Hedera services, roadmap. |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| x402 on Hedera docs | https://docs.hedera.com/solutions/ai/x402 |
| Blocky402 facilitator | https://blocky402.com |
| x402 pay-per-request PoC | github.com/hedera-dev/x402-inference-pay-per-request-poc |
| Hedera Agent Kit (JS) | github.com/hashgraph/hedera-agent-kit-js |
| Hedera Harness | github.com/hedera-dev/hedera-harness |
| Hedera Skills (AI coding agent skills) | github.com/hedera-dev/hedera-skills |
| ATS monorepo | github.com/hashgraph/asset-tokenization-studio |
| ATS SDK | npm `@hashgraph/asset-tokenization-sdk` |
| ATS docs | docs.hedera.com/hedera/open-source-solutions/asset-tokenization-studio-ats |
| Getting started | docs.hedera.com/hedera/getting-started-sdk-developers |

- **Time to hello world:** x402 track 30min–2h (PoC repo exists; Blocky402 handles gas — agent signs a spending ceiling off-chain gas-free, pays only metered amount, facilitator sponsors settlement) [A1/B2]. ATS: 2h+ (enterprise-grade monorepo, ERC-1400-style securities lifecycle). Harness: 30min–2h.
- **Vintage:** x402 support announced **Feb 10, 2026** [B2 hedera.com blog]; a prior x402 bounty already ran (winners announced — study those repos for the bar). Harness + Skills are new AI-coding-agent tooling (marketplace plugin, recent). ATS is mature but actively developed. x402+Blocky402 is the freshest, most prize-dense surface.
- **Integration depth bar:** Deep = live x402 service with metering + HCS audit trail + ERC-8004/HCS-14 identity + Scheduled Transactions; bolted-on = single flat-fee 402 endpoint with no Hedera-native service usage.

---

## Arc (Circle) — $10,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best DeFi/Onchain Finance Application | $1,667 | Scratch | "Meaningful use of Arc and USDC"; "advanced programmable money flows such as conditional payments, onchain automation or multi-step settlement"; payment/liquidity/treasury workflows using App Kits. Functional MVP w/ architecture diagram (working FE/BE), video demo + presentation + docs, GitHub/Replit repo. |
| Best Agentic Economy Application with Circle Agent Stack | $1,667 | Scratch | "Agents with clear decision logic tied to real signals"; "autonomous spending, payments or settlement flows using USDC"; Agent Stack for wallet/payment connectivity; Nanopayments, Paymaster, or App Kits for agent-to-agent transactions. Same MVP/video/repo requirements. |
| Best DeFi or Agentic Application (Continuity) | $1,666 | **Continuity only** | Same as above + "Be registered as a Continuity Project, under the Continuity Track." |
| Launch on Arc Testnet & Push to Mainnet | $3,500 (2.5k/1k) | Scratch | Add working Arc integration to an existing product class (commerce, fintech, wallets, DeFi, AI agents); USDC/EURC payment flows, crosschain transfers, agentic payments, or treasury features; **production-ready, deployed or deployment-ready on Arc mainnet by September 30**. |
| Launch on Arc Testnet & Push to Mainnet (Continuity) | $1,500 | **Continuity only** | Same incl. Sept 30 mainnet deadline. |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| Arc docs | https://docs.arc.io/ |
| App Kits (`@circle-fin/app-kit` + `@circle-fin/adapter-viem-v2`) | https://docs.arc.io/app-kit |
| Circle dev docs | https://developers.circle.com/ |
| Agent Stack starter kits | github.com/circlefin/agent-stack-starter-kits |
| Nanopayments launch blog | circle.com/blog/circle-nanopayments-launches-on-testnet... |

- **Time to hello world: <30min** for App Kits (`npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem`; Bridge/Swap/Send/Unified Balance quickstarts). Agent Stack (Circle CLI, Agent Wallets, Agent Marketplace, Nanopayments via Gateway): 30min–2h using starter kits.
- **Network:** Arc L1, **USDC is native gas**, sub-second deterministic finality, public testnet since Oct 2025 (166M+ txs by Feb 2026). Mainnet scheduled Summer 2026 — the "push to mainnet by Sept 30" prize implies mainnet is opening around/just after the event [B2/C3].
- **Vintage:** HOT. Nanopayments launched on testnet as "core primitive for agentic economic activity" [B2 Circle blog, recent]; Agent Stack (CLI + Agent Wallets + Marketplace + Nanopayments) is 2026-new; $222M Arc token presale May 2026. Mainnet-launch-window prizes = sponsor desperate for launch apps.
- **Integration depth bar:** Deep = agent with real decision signals doing nanopayment-metered USDC flows + multi-step settlement on Arc, mainnet-ready; bolted-on = a USDC transfer demo on testnet with no programmable-money logic.

---

## World — $7,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| AgentKit Continuity | $3,500 (up to 3 × $1,166) | **Continuity only** | "Uses AgentKit in a meaningful way"; "shows a working app"; "registers or resolves agents through AgentBook where relevant"; "uses the World ID Sandbox App to test the project remotely"; **required feedback document** covering AgentKit docs/integration, Developer Portal navigation, Sandbox App states/flows, obstacles. |
| Selfie Check | $3,500 (up to 3 × $1,166) | Scratch (not pool-restricted on page) | "Uses Selfie Check or a Selfie Check-compatible World ID credential flow in a meaningful way"; "treats Selfie Check as a risk, eligibility, fairness, continuity, or abuse-prevention signal"; "shows a working app"; feedback document required (docs/integration, Dev Portal usability, Sandbox testing, pain points). |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| AgentKit integrate | https://docs.world.org/agents/agent-kit/integrate |
| AgentKit repo | github.com/worldcoin/agentkit |
| Selfie Check credential docs | https://docs.world.org/world-id/credentials/11 |
| Sandbox Selfie Check testing | https://docs.world.org/world-id/sandbox/testing-selfie-check |
| llms.txt index | https://docs.world.org/llms.txt |

- **Time to hello world:** AgentKit 30min–2h — middleware for Hono/Express/Next.js (`createAgentkitHooks`, `agentkitResourceServerExtension`); client side `agentkit.fetch` from `createAgentkitClient` supports proof-of-human + x402 on the same endpoint; AgentBook registry contract on World Chain (eip155:480) resolves wallet → anonymous humanId [A1/A2]. Selfie Check: 30min–2h and **Beta, feature-flag gated** — sandbox World ID app distributed via TestFlight / private Play links; full relying-party journey via IDKit covering Hot/Cold/Semi-cold user states, same-device and cross-device QR flows [A1].
- **Vintage:** HOT. AgentKit launched **Mar 17, 2026** [C3 TechCrunch, B2 world.org blog]; Coinbase partnership for verified agent shopping. Selfie Check is Beta right now — sandbox testing guide is brand new. Both prizes are essentially paid product feedback on <6-month-old products.
- **Integration depth bar:** Deep = Selfie Check as the load-bearing sybil/fairness signal in the core loop, or an agent whose AgentBook-verified humanId gates real actions; bolted-on = a login button. Note: feedback doc is a hard requirement — cheap points, don't skip it.

---

## 1inch — $7,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Build an Aqua App | $5,000 (2.5k/1.5k/1k) | Scratch | "Create a custom Aqua app that implements a sophisticated DeFi position." SwapVM integration scores higher. "Final positions must be demonstrated through tests scripts or a UI." "Official Aqua/SwapVM contracts must be used (redeployments of a modified SwapVM contract is allowed)." "Onchain execution of token transfers should be presented during the final demo (local forks are ok)." "Proper Git commit history (no single-commit entries on the final day)." |
| Build an Aqua App — Continuity | $2,000 (1.5k/0.5k) | **Continuity only** | Identical requirements. |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| Aqua contracts | github.com/1inch/aqua |
| SwapVM contracts + whitepaper, Aqua SDK, Aqua whitepaper | linked from prize page; whitepaper at 1inch.com/assets/1inch-aqua-white-paper.pdf |
| Aqua product page | https://1inch.com/aqua |

- **What it is:** Aqua = shared liquidity layer — LPs keep assets in their own wallets; one balance backs multiple strategies simultaneously, full self-custody. SwapVM = instruction-set VM to assemble strategies from a library of instructions (Bukov/Kunz design). 8 independent audits; live across 13 EVM chains as of late July 2026 [B2/C3 CoinDesk, The Block].
- **Time to hello world: 2h+** — Solidity-heavy, novel VM paradigm, sparse examples; local-fork demos explicitly allowed, which lowers the bar to "sophisticated position on a fork."
- **Vintage:** HOT — Aqua opened to all developers **July 27, 2026** (~6 weeks ago) with a $1.37M incentive program. Almost nobody has built Aqua apps yet; judges will grade on understanding of the shared-liquidity model.
- **Integration depth bar:** Deep = custom SwapVM program implementing a real strategy (e.g. delta-hedged LP, conditional liquidity) with onchain execution shown; bolted-on = using 1inch swap API (does not qualify at all — Aqua/SwapVM contracts mandatory).

---

## ENS — $5,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best Use of ENSv2 | $4,500 (1.5k/1.5k/1k/0.5k) | Scratch | "Project must be built on ENSv2 (Sepolia)." "ENSv2 features should be central to the product, not a cosmetic add-on." "Your demo must be functional and not just include hard-coded values." Showcase must have video or live demo (ideally both); open-source code on GitHub or similar. Focus areas: hierarchical registry, wildcard resolution, Enhanced Access Control, Permissioned Resolvers, record/namespace aliasing, **AI agent integration opportunities**. |
| Best Integration of ENSv2 into an Existing Project | $500 | **Continuity only** | "Integration must use ENSv2 on Sepolia and target an existing project's testnet deployment." "Clear how ENSv2 improves the project, not just a cosmetic add-on." Functional demo, no hard-coded values; video/live demo + open source. |

### Docs [A1]
| Resource | URL |
|---|---|
| ENSv2 overview | https://docs.ens.domains/ensv2/overview/ |
| Permissioned Registry / Permissioned Resolver / Enhanced Access Control / Contract Dev guide / App Dev guide | linked from prize page (docs.ens.domains ENSv2 section) |
| Building with AI, Agent-native CLI, AI Agent Registry ENS Name Verification, Agent Text Records specs | linked from prize page — ENS is explicitly courting agent projects |
| Sepolia deployments | canonical Deployments section of ENS docs |

- **Time to hello world: 30min–2h** — ENSv2 contracts live on Sepolia; ENS App + Explorer in public **Beta** on Sepolia (registry + upgrade flow testable); contract addresses published [A1/B2].
- **Vintage:** HOT and pivoting — **Namechain L2 cancelled Feb 2026**, ENSv2 now Ethereum-L1-only [C3 The Block]; alpha testing opened May 2026, Beta recently. Agent-native CLI + Agent Text Records + AI Agent Registry name verification are new agent-focused primitives — nearly zero prior hackathon coverage.
- **Integration depth bar:** Deep = hierarchical/permissioned registry mechanics or agent identity via Agent Text Records as the core primitive; bolted-on = resolving a name for display (cosmetic, explicitly disqualified).

---

## Uniswap Foundation — $5,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best Uniswap Stack Contribution | $3,000 (up to 3 × $1,000) | Scratch | Build on/integrate any part of the Uniswap stack: Uniswap API, AMM (v2/v3/v4), **CCA**, v4 hooks, extensions to official repos, or ecosystem tooling. Required: "A public GitHub repository with open-source code, a FEEDBACK.md file, and a completed submission to the Uniswap Developer Feedback Form." "Make sure your README clearly points to the relevant contracts and lines of code so we can verify your integration." |
| Best Uniswap Stack Contribution (Continuity) | $2,000 (2 × $1,000) | **Continuity only** | Identical. |

### Docs [A1/A2]
| Resource | URL |
|---|---|
| Uniswap docs / Developer Platform / Dev Support / Feedback Form / Uniswap AI repo / workshop video | linked from prize page (developers.uniswap.org) |
| CCA concept docs | developers.uniswap.org/docs/liquidity/liquidity-launchpad/concepts/cca |
| CCA contracts | github.com/Uniswap/continuous-clearing-auction |
| CCA blog | blog.uniswap.org/continuous-clearing-auctions |

- **Time to hello world:** v4 hooks 30min–2h (mature templates); **CCA 2h+** (new: continuous-time uniform-price auction for token launches on v4, modular via hooks — per-user caps, allowlists, zk-eligibility; first launch was Aztec with ZK Passport module) [A1/B2].
- **Vintage:** CCA is the fresh primitive (announced/launched recent months, Base integration news in 2026); "Uniswap AI" repo listed as a resource suggests an agent angle they want explored. Otherwise stack is mature.
- **Integration depth bar:** Deep = novel v4 hook or CCA extension with verifiable contract lines; bolted-on = routing a swap through the Uniswap API with no stack contribution. FEEDBACK.md + feedback form are hard requirements.

---

## Ledger — $5,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| AI Agents x Ledger | $3,500 (2k/1k/0.5k) | **Scratch** (new projects during event) | "Build AI agents and AI-powered products that use Ledger as the trust layer" where "device-backed security is central to the product: agents that hold secrets they cannot leak, agents that pay for what they use, systems that ask for a human before anything irreversible, and products that make autonomous behavior safer instead of bypassing user intent." Must build on Ledger Agent Stack, specifically Key Ring CLI (`wallet-cli ring`). Judging: "real user value, not generic chatbot wrappers"; clear boundaries between autonomous and approved actions; concrete Ledger primitive usage; practical demos (cloneable repos or walkthroughs); **DX feedback required from all submissions**. |
| Continuity | $1,500 (1k/0.5k) | **Continuity only** (pre-existing before event) | Examples: adding Ledger signers to shipped apps, integrating wallet-cli ring as key backend, adding device confirmations to existing actions, resolving open Ledger repo issues. |

### Docs [A1]
| Resource | URL |
|---|---|
| Hackathon hub | https://developers.ledger.com/ethonline |
| Wallet CLI (`@ledgerhq/wallet-cli`) | developers.ledger.com/docs/ai-tools/ledger-cli |
| DMK Skills (`npx skills add ledgerhq/agent-skills`) | developers.ledger.com/docs/ai-tools/ledger-dmk-skills |
| Key Ring | developers.ledger.com/docs/ai-tools/ledger-cli#key-ring |
| Hardware security | developers.ledger.com/docs/ai-tools/hardware-security |

- **What it is:** Agent Stack = Wallet CLI (terminal control of Wallet/Enterprise/Enterprise Multisig apps) + DMK Skills (teach coding agents to integrate Ledger signers) + Key Ring CLI (secrets encrypted under Ledger seed-derived keys; decrypt on any machine from seed; **headless operation for CI/agents without USB port**; OpenPGP + FIDO2 apps).
- **Time to hello world: <30min** with a Ledger device (`npm i -g @ledgerhq/wallet-cli`; `wallet-cli ring`). **GOTCHA: requires physical Ledger hardware** for the real flow — check what judges accept if no device.
- **Vintage:** HOT. `ring` command group merged in wallet-cli 2.0.0 (LedgerHQ/ledger-live PR #17743); 2026 AI Security Roadmap published April 2026; first DMK production deployment March 2026 [A2/B2]. Dedicated Telegram support group.
- **Integration depth bar:** Deep = agent whose secrets live in Key Ring and whose irreversible actions require device confirmation (trust boundary is the product); bolted-on = Ledger as one of several optional signers.

---

## Privy — $5,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best B2B Financial Product | $2,500 | Not pool-restricted on page | "Integrate Privy as a core part of the product"; "create or use at least one Privy wallet"; "demonstrate a business or organization use case"; "implement at least one functional B2B workflow, such as a payment, approval, treasury operation, or wallet administration flow"; "use at least one Privy control, such as policies, signers, key quorums, or intents"; working demo + source access; "clearly explain how Privy enables the product." Focus: treasury platforms, business accounts, payroll, spend management, payment ops, organization wallets. |
| Best Financial Flow | $2,500 | Not pool-restricted on page | Core Privy integration; ≥1 Privy wallet; "complete at least one functional financial flow using a generally available Privy feature" — eligible: "transfers, bridging, stablecoin conversions, swaps, self-service Earn vaults, onramps, or other supported wallet actions." Working demo + source. **Privy Cards require mocking; another live flow mandatory for eligibility.** |

### Docs [A1]
| Resource | URL |
|---|---|
| Docs + quickstart | https://docs.privy.io |
| Organization wallets | docs.privy.io/wallets/overview/solutions/organization-wallets |
| Policies & controls | docs.privy.io/security/wallet-infrastructure/policy-and-controls |
| Intents (create/approve) | docs.privy.io/controls/dashboard/intents |
| Agentic wallets recipe | docs.privy.io/recipes/agent-integrations/agentic-wallets |

- **Time to hello world: <30min** (Privy is famously fast to integrate; embedded wallet in minutes). Org wallets + key quorums + intents: 30min–2h.
- **Vintage:** Controls surface is fresh — intents (async approval resource, 72h expiry), nested key quorums, policy engine for org wallets, human-approval treasury workflows blog; docs updates through Aug 2026 [A1/B2]. The B2B track reads like a launch campaign for org wallets + controls.
- **Integration depth bar:** Deep = m-of-n quorum + policy engine + intents encoding a real org approval structure (e.g. agent proposes, humans approve via intent); bolted-on = Privy as a login modal.

---

## Chainlink — $3,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Best Confidential Workflow | $2,000 (up to 2 × $1,000) | Scratch | "Build a CRE Workflow that uses the Confidential Workflows to execute a meaningful part"; must register and use a confidential TEE handler (`handlerInTee` / `cre.HandlerInTee`); "the confidential portion must process at least one sensitive input, secret"; integration must be core, not placeholder; demonstrate via CRE CLI simulation or live deployment; provide evidence (demo, logs, deployment details). |
| Best Chainlink-Powered Upgrade | $500 | **Continuity only** | Integrate ≥1 Chainlink service (CRE, Price Feeds, Data Streams, PoR, or VRF); "the Chainlink integration must contribute to a state change on a blockchain"; show how the upgrade improves the project. **Functions and Automation are deprecated; use CRE instead.** |
| Automated Liquidation Protection Challenge | $500 | Scratch | Build a Confidential Workflow protecting a virtual ETH-collateral/USDC-debt position; avoid liquidation while preserving loan benefits; use emergency capital efficiently; keep protection rules and credentials private; **join official challenge via smart contract on Ethereum Sepolia (opens Sept 9)**; cannot update after deadline; Chainlink evaluates within 24h. |

### Docs [A1]
| Resource | URL |
|---|---|
| Confidential Workflows concept | https://docs.chain.link/cre/concepts/confidential-workflows |
| Starter templates (AI Smart Contract Audit Firewall, Automated Liquidation Protection), Hello Confidential Workflow, Bootcamp book + Day 1/2 videos, challenge repo + Sepolia contracts + deploy access form | all linked from prize page |

- **Time to hello world: 30min–2h** via templates + CRE CLI simulation (simulation explicitly accepted — no need for live DON access). NOTE: Confidential Compute is **private beta** in production (early-access 2026) [B2]; hackathon presumably provides access via the deploy access form.
- **Vintage:** HOT. CRE went live Nov 2025; Confidential Compute early access is a 2026 launch, TEE-based (secrets fetched inside enclave; you choose what crosses back to the Workflow DON) [A1/B2]. The liquidation challenge is a fixed-scope, judged-by-rubric prize — deterministic effort→reward.
- **Integration depth bar:** Deep = workflow where the TEE handler protects genuinely sensitive logic/credentials driving onchain state changes; bolted-on = handlerInTee wrapping trivial code (explicitly called out as non-qualifying "placeholder").

---

## Bazantic — $3,000

### Prizes [A1]
| Track | Amount | Pool | Requirements (near-verbatim) |
|---|---|---|---|
| Help an Agent Use Your Hackathon Project | $1,000 (up to 2 × $500) | **Continuity only** | Create bazantic.com account; build x402/MPP Gateway for your project; develop a Recipe explaining service usage; run identical tests (same prompt/model/settings/API access) with the Recipe as the ONLY variable; document improvement with inputs/outputs; video walkthrough comparing outcomes; provide Bazantic username. Core: show "meaningful and repeatable improvement" for agents using your project via Bazantic MCP + Recipe vs raw API info. |
| Best Recipe Using EthGlobal Hackathon Sponsor APIs | $1,000 (0.5k/0.3k/0.2k) | Either | Account; x402/MPP Gateway; integrate ≥1 additional Bazantic service or sponsor API; Recipe combining multiple services in a working workflow; "final result must depend meaningfully on both services"; screen recording of complete task execution; username. Core: "a repeatable workflow that moves from one service to the next and completes a task neither could solve alone." |
| Agentify a New API | $1,000 (0.5k/0.3k/0.2k) | Either | Account; x402/MPP Gateway; add a previously unavailable API (not from Bazantic or event sponsors at start); working Gateway for the new service; Recipe combining new + existing service; screen recording; username. |

### Docs [A2/B2]
| Resource | URL |
|---|---|
| Bazantic | https://bazantic.com — "Submit your spec — Baz AI builds your full agent stack. No protocol work on your side." Hosted MCP servers, atomic tool design, x402 + MPP payments, OFAC screening, OpenAPI specs + skills files, Bazantic CLI. |

- **Time to hello world: <30min claimed** — Baz AI generates the gateway from an OpenAPI spec; no protocol work. No public quickstart doc found — expect rough edges, ask in their event channel. (Note: this environment already has an agentcash MCP wallet with x402/MPP support — directly reusable for testing Bazantic gateways.)
- **Vintage:** The whole product is new (hackathon page IS their launch surface). Nothing found >90 days old. Very low entrant competition expected.
- **Integration depth bar:** Deep = a Recipe with a controlled A/B (Recipe vs no-Recipe) showing measurable agent improvement; bolted-on = gateway created but no comparative evidence (the A/B test IS the requirement).

---

## Cross-Sponsor Synthesis

### Natural 3-prize combos (max 3 partner selections per submission)

1. **Agentic payments stack — "agent that discovers, verifies, and pays":**
   **Hedera (x402, $6k track) + Bazantic (Recipe using sponsor APIs) + The Graph (AI scratch track)**. One agent: Graph MCP provides live onchain data as the decision signal, service is x402-gated on Hedera via Blocky402, published as a Bazantic Gateway+Recipe. All three requirements compose in a single service+consumer loop. Highest combined EV (~$8k reachable across three winnable slots).

2. **Trusted-agent treasury:**
   **Privy (B2B, $2.5k) + Ledger (AI Agents, $3.5k) + Arc (Agentic Economy, $1.6k)**. Agent proposes USDC payments on Arc; Privy org wallet with policy engine + intents encodes the approval workflow; Ledger device confirmation is the human-in-the-loop for irreversible moves; Key Ring holds the agent's API secrets. Thematically identical stories ("autonomous but controlled money") — one architecture satisfies all three verbatim requirement lists.

3. **Verified-human agent identity:**
   **World (Selfie Check or AgentKit) + ENS (ENSv2 agent text records) + The Graph (ERC-8004 subgraphs)**. Agent registered in AgentBook with humanId, named/discoverable via ENSv2 agent records on Sepolia, indexed/queried via Graph's Agent0/ERC-8004 subgraphs. ENS explicitly lists "AI agent integration" as a focus and provides Agent Text Records specs — this combo is nearly what ENS's own resources describe.

4. **Confidential agent strategist:** **Chainlink (Confidential Workflow) + 1inch (Aqua) + The Graph**. TEE-protected strategy logic driving an Aqua/SwapVM position sized from Graph data. Higher build risk (two 2h+ ramp products) but almost zero competitor overlap.

### Under-contested prizes (fewest expected entrants)
- **1inch Aqua ($5k)** — 6-week-old protocol, novel VM, whitepaper-level docs; most teams will bounce off SwapVM. Local-fork demos allowed lowers the real bar. Best $-per-competitor at the event.
- **Bazantic (all $3k)** — unknown sponsor, brand-new product, small amounts; near-zero contention; requirements are mechanical (account, gateway, recipe, A/B video).
- **Hedera Harness ($2k)** — "open a good PR" prize; almost nobody does OSS-contribution tracks.
- **Chainlink Liquidation Challenge ($500)** — fixed rubric, joins via Sepolia contract Sept 9; deterministic, low glamour.
- **Uniswap CCA angle** — v4 hooks will be contested, but CCA-specific contributions won't be.
- Contested (avoid as primary): The Graph AI tracks, World Selfie Check, Privy Financial Flow, Arc agentic — low-friction products attract volume.

### Most AI-agent-compatible sponsors (ranked)
1. **Hedera** — x402 track is literally "build an agent that pays" with the biggest agent pool ($6k) and extra-points list mapping to agent primitives (ERC-8004, A2A, HCS audit trails).
2. **The Graph** — MCP + SKILLs are built for Claude/Cursor-type agents; SKILL.md is an accepted deliverable; both scratch AND continuity AI pools ($10k combined).
3. **Ledger** — the entire $3.5k track is agent trust-layer; Key Ring headless mode is designed for hosted agents. Hardware requirement is the only friction.
4. **Arc/Circle** — Agent Stack + Nanopayments purpose-built for pay-per-call agents.
5. **World** — AgentKit = proof-of-human for agents; AgentBook onchain registry.
6. **Bazantic** — agent-consumption of APIs is the whole product.
7. **ENS** — agent-native CLI + Agent Text Records; newer, thinner docs.
8. **Privy** — agentic wallets recipe exists; controls (intents/quorums) fit agent-proposes-human-approves.
9. **Chainlink** — CRE workflows can host agent logic in TEEs but it's workflow-shaped, not agent-shaped.
10. **Uniswap/1inch** — DeFi-mechanism prizes; an agent can drive them but the judging weight is on the mechanism, not the agent.

### Universal submission checklist distilled from requirement texts
- Public repo, open source; README pointing to exact contracts/lines (Uniswap explicitly, others implicitly).
- Demo video: Graph 2–4 min; Hedera ≤5 min; most others unspecified — target 3–4 min.
- Real commit history — 1inch explicitly rejects single-commit dumps (matches the existing AgentMesh-style incremental commit discipline).
- Continuity entries must document pre-existing vs event work everywhere.
- Feedback documents are HARD requirements for World (both tracks), Uniswap (FEEDBACK.md + form), Ledger (DX feedback from all submissions) — free scoring, budget an hour each.
- Date traps: Chainlink challenge contract opens **Sept 9**; Arc mainnet-readiness deadline **Sept 30**; Ledger page says submissions **Sept 13**.
