# WARROOM BASE STACK — ETHOnline 2026 V1 (items 1-7; read fully)

## 1) TASTE CONTRACT
Universal Laws U1-U7 (verbatim):
U1. Integral, real, works. No simulated data, no "would integrate", no hash-of-a-thing-nobody-verifies.
U2. The judge must SEE it work in ~3 minutes without explanation.
U3. Exciting beats safe. Target "I have not seen this before," not "competently assembled."
U4. No reskins of past project shapes. The agent+reasoning-hash+dashboard+micropay shape is banned as a default; must re-earn its place on event-specific evidence.
U5. Grounded in builder capability - buildable fast, defensible in Q&A.
U6. INTEGRATION DEPTH IS THE STRATEGY. Built on the chain/sponsor NATIVE primitives so deeply that porting elsewhere means rebuilding. Surface-level SDK calls lose.
U7. Demo state is EARNED. Fabricated/seeded state forbidden when it contradicts the core claim.
Conditional blocks ACTIVE: C-AI1 (AI must be the product, not a wrapper - if demo works with AI removed, fail), C-DF1 (real value flows on-chain in the demo - real tokens moving), C-IN1 (infra demos must include a live CONSUMER of the infra).

## 2) FACTS CARD
Event: ETHOnline 2026 (ETHGlobal), fully async/online. Deadline: Sun Sep 13 2026 12:00 EDT (16:00 UTC). ~4.5 days remain.
Prize pool: $80,000 across 11 sponsors, NO organizer cash prize. Max 3 partner prize selections per project.
Build tracks (pick ONE): Building from Scratch | Continuity: Extend Open Source | Continuity: Ship a Feature.
Judging: sponsor engineers judge their own prizes vs written qualification bullets; finalist track = Technicality/Originality/Practicality/Usability/WOW 20% each; 2-round async; most money to non-finalists.
Sponsor pots: The Graph $15K (Composable $5K / AI-Scratch $5K / AI-Continuity $5K) | Hedera $15K (x402 $6K / ATS tokenization $6K / OSS Harness $2K / Continuity $1K) | Arc $10K (DeFi $1.67K / Agentic $1.67K / Continuity $1.67K / Mainnet-launch $3.5K+$1.5K) | World $7K (AgentKit-Continuity $3.5K / Selfie Check $3.5K) | 1inch $7K (Aqua $5K + $2K continuity) | ENS $5K (ENSv2 $4.5K + $0.5K) | Uniswap $5K ($3K + $2K continuity, FEEDBACK.md required) | Ledger $5K (Agent Stack $3.5K + $1.5K, physical device) | Privy $5K (B2B $2.5K / Financial Flow $2.5K) | Chainlink $3K (CRE Confidential $2K / Continuity $0.5K / Liquidation challenge $0.5K) | Bazantic $3K (3x$1K: gateway/recipe/agentify).
Demo video: 2-4 min HARD, human voice only, 720p+. Rules: no mocks (multiple sponsor texts), granular commits, AI usage documented.

## 3) CHAIN DNA
(see research/chain-dna.md - read it)

## 4) BUILDER CAPABILITY SHEET (constraints on buildable-in-4.5-days; NOT past shapes)
Solo builder + Claude Code (Fable 5) on M5 Pro Mac - 10x dev speed; complexity is NOT a kill reason (concern #1).
Builds fast: TypeScript/Next.js, Solidity/Foundry (deep), Rust, Circom/ZK circuits, MCP servers + agent frameworks (deep), x402/payment-rail integration (deep, incl. an existing agentcash x402 wallet in the dev environment), multi-service deploys (Fly.io/Vercel), relayers/keepers, Remotion demo videos, EIP-712 signing flows, WebSocket/SSE realtime.
Slower/risky in window: mobile apps (TestFlight loops), heavy protocol-level Solidity on unfamiliar VMs (SwapVM = 2h+ ramp but viable), anything needing hardware Dami may not own (Ledger device - UNVERIFIED).

## 5) CONCERNS KILL-LIST (self-filter; violating ideas: do not return)
[C] Real humans with the problem, named specifically. [C] Day-1 users exist TODAY, reachable. [C] Significant problem + would-build-without-prize. [C] Uniqueness (zero confirmed competitors in exact niche). [C] Max-3-sponsors each LOAD-BEARING (substitution test). [C] No mocked sponsor integrations (live data / real paid request / live flow). [C] Differentiate from ChainSight (read-only NL analyst over Graph+Hedera w/ 0G provenance). [C] NOT the generic agentic-payments middle lane ("an agent that pays an API with x402" with no edge).
[C] FORBIDDEN SHAPES (self-duplication, concern #15 - Dami shipped/in-flight; banned REGARDLESS of chain):
agent registry/mesh/discovery + inter-agent payment rails (AgentMesh) | guardian/co-signer/LLM-firewall for agent txs (Backstop) | agent trust scoring/reputation scanner/observability (Agent Auditor, Omnispect-X, 0g-sentinel) | commit-before-publish track-record/accountability/falsifiable-alpha registries (AlphaAttest) | agent dispute court/arbitration (Verdikt) | self-funding agent treasury loop (AgentTreasury) | multi-agent workflow orchestration (SomniaFlow) | private/FHE/ZK lending or vaults, shielded positions (GhostFund, 9ncore, Veil, ShadowDesk) | private cross-chain payments (GhostPay) | RWA tokenization PLATFORM generic (DeepRock) | autonomous-agent-with-own-wallet protocol (x9) | for-hire solver agent (solv-001) | self-restoring indexer (Mirror) | AI-copilot trading terminal (Axon) | atomic refinance (RefiRail) | CRE compliance gate (CRE Compliance Gate) | agent identity/chat/board infra (VaraCore).
[I] Everything real where sponsor text demands it; testnet fine elsewhere. [I] Focused product, BROAD problem (niche scope OK, niche audience NOT).

## 6) GAP MAP
(see warroom/gap-map.md - read it; aim INTO named W1-W10 / M1-M4 / P1-P3, not just away from Occupied)

## 7) WORKING PRIMITIVES SHEET
(see warroom/primitives-sheet.md - read it. NOT a menu: remix primitives across families/domains; porting one unchanged loses. Record which primitive(s) adapted and how.)
