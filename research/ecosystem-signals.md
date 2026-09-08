# ETHOnline 2026 — Ecosystem Signals & Event Intel
Researched 2026-09-08 (event is LIVE — day 5 of hacking). Admiralty tags: source reliability A–F / info credibility 1–6.

---

## 1. WORKSHOPS / AGENDA — NOT PUBLICLY ACCESSIBLE [A2 for the negative finding]

BLUF: The agenda is not retrievable without a logged-in hacker account. Direct fetches of
`ethglobal.com/events/ethonline2026/agenda` and `/schedule` return **hard 404s** (confirmed twice via
WebFetch and raw curl with browser UA — the HTML is ETHGlobal's real 404 page, not a JS-render
failure). The main event page `/events/ethonline2026` returns HTTP 500. `/info/` loads but is just a
hub linking to "Get started", "Rules/submission/judging", "Tools & resources" — no session list.
Web searches for "ETHOnline 2026 workshops agenda livestream" surface nothing indexed.

Implication: workshop-as-organizer-signal must be inferred from the prize pages instead (which ARE
public and fully scraped — see §3). If Dami has a logged-in ETHGlobal dashboard, the agenda will be
under the event dashboard; ETHGlobal online-event workshops are typically sponsor-run and streamed
to the ETHGlobal YouTube channel during week 1 — worth a manual check of
youtube.com/@ETHGlobal live tab for "ETHOnline 2026" streams.

## 2. EVENT META [B2, cross-confirmed by 3 sources]

- **Dates:** Sep 4–16, 2026. **Submission deadline: Sunday Sep 13, 2026 @ 12:00 pm EDT** (Sep 14–16 = judging window). Sources: Tierones ETHGlobal tracker, coinpedia/search snippets, ETHGlobal X announcement (x.com/ETHGlobal/status/2086863835991028111). **~5 days of build time remain as of today (Sep 8).**
- **Format:** Fully async/online. Two build pools appear across multiple sponsor prizes: **"Start Fresh" (net-new)** vs **"Continuity Track" (extend an existing open-source project)** — a NEW ETHGlobal structure this event; several prizes are Continuity-only.
- **Prize pool:** "$100k+" per announcements; the public prizes page enumerates **11 sponsors, $80,000 itemized**: The Graph $15k, Hedera $15k, Arc $10k, World $7k, 1inch $7k, ENS $5k, Uniswap Foundation $5k, Ledger $5k, Privy $5k, Chainlink $3k, Bazantic $3k. [A1 — scraped directly from ethglobal.com/events/ethonline2026/prizes, saved at /tmp/prizes.txt]
- **Judges:** No named judges published anywhere public. ETHGlobal's standard model applies: sponsor engineers/devrel judge their own partner prizes asynchronously (criteria per prize page: qualification requirements + demo video 2–4 min + public repo); ETHGlobal staff pick finalists. [B3]
- Submission requirements repeated across nearly every prize: **public repository + 2–4 minute demo video + live (non-mocked) integration**. "Mocked, local-only, or static datasets do not qualify" appears verbatim in The Graph's tracks; Arc wants "ready to ship to mainnet".

## 3. NARRATIVE CONTEXT — SEPTEMBER 2026 [mixed B2–B3]

BLUF: **Agentic payments (x402) + agent identity is THE dominant narrative of this event — it is not one theme among several, it is the organizing thesis.** Keyword scan of the full prizes page: "x402" ×20, "agent/Agent" ×107, "MCP" ×14, "A2A" ×3, ERC-8004 ×2 — across at least **7 of 11 sponsors**.

Ecosystem-wide narratives right now:
1. **x402/agentic payments — peak momentum, adoption gap acknowledged.** Linux Foundation's x402 Foundation operational since July 2026 with 40+ members (Visa, Mastercard, Amex, Stripe, Google, AWS, Circle, Shopify, Solana Fdn). 100M+ x402 txs on Base through Q1 2026 (Chainalysis), ~165M txs / ~69k active agents / ~$50M volume by April. Honest caveat repeated across sources: **"the narrative around agentic commerce is running ahead of actual adoption"** — much late-2025 volume was memecoins, not agents buying services. Hedera's own prize copy admits it: *"x402 on Hedera is still short of one thing: actual services you can pay for."* → Real, working paid services win. [B2]
2. **ERC-8004 agent identity — live but young.** Mainnet since Jan 29 2026; ENS, EigenLayer, The Graph, Taiko, EF dAI team committed to integrations. A June 2026 arXiv empirical study (2606.26028) found the Reputation Registry "cannot function as a trust signal as currently deployed" due to Sybil reviewers — an open problem a hack could attack. The Graph explicitly links **Agent0/ERC-8004 Subgraphs** as a prize resource. [B2]
3. **Privacy/confidential compute — rising.** Chainlink's entire $3k is CRE **Confidential Workflows (TEE)** — brand-new product (GitHub issue #21635 recent). Ecosystem: Payy privacy L2, "2026 best year for Ethereum privacy" coverage. [B3]
4. **RWA/tokenization — institutional-dominant macro narrative.** $31–60B tokenized, Ethereum ~48–65% share, BUIDL $2.8B+. Maps to Hedera's $6k **tokenized-collateral/repo** track (*"Institutional adoption is the dominant narrative in the market right now"* — Hedera's own prize text) and Privy's B2B treasury track. [B2]
5. **L1-first / L2 consolidation.** ENS **scrapped Namechain L2 (Feb 2026)**, moving ENSv2 fully to mainnet, citing Fusaka-era gas-limit doubling and 99% registration-cost reduction. Vitalik's L2 warnings + L1 scaling shifted gravity back to mainnet. [B2]
6. **Restaking — background, not foregrounded here.** No sponsor at this event maps to restaking; narrative energy has rotated to agents + RWA. [B3]

**Sponsor → narrative map (from scraped prize text, A1):**
| Sponsor | $ | Narrative | Agentic? |
|---|---|---|---|
| The Graph | 15k | AI tooling/MCP/Substreams + x402 pay-per-query, ERC-8004 subgraphs | YES (heavy) |
| Hedera | 15k | x402 services track ($6k), Hedera Harness contribution ($2k), tokenized collateral/RWA ($6k) | YES |
| Arc (Circle) | 10k | Stablecoin DeFi + "autonomous agents that transact on Arc" + mainnet-ready integrations | YES |
| World | 7k | AgentKit (human-backed agent auth, Continuity-only $3.5k) + Selfie Check ($3.5k) | YES |
| 1inch | 7k | Aqua custom apps / SwapVM opcodes ($5k+) — pure DeFi, SwapVM scored higher | no |
| ENS | 5k | ENSv2 (mainnet-first post-Namechain) | partial |
| Uniswap Fdn | 5k | Uniswap v4/hooks ecosystem | no |
| Ledger | 5k | **Ledger Agent Stack / Key Ring CLI**: agents with unleakable secrets, x402-style paid APIs, human-in-the-loop device approval | YES (entirely) |
| Privy | 5k | B2B financial product ($2.5k) + best financial flow ($2.5k): policies, quorums, intents, automated txs | agent-adjacent |
| Chainlink | 3k | CRE Confidential Workflows (TEE): secure LLM/agent workflows, private strategies | privacy+agents |
| Bazantic | 3k | Entirely x402/MPP gateways + MCP servers + "Recipes" (agent usage docs); one prize literally = "Help an Agent Use Your Hackathon Project" | YES (entirely) |

**Assessment: agentic-payments dominance ~7/11 sponsors, ~$58k of $80k itemized prize money touches agents/x402/MCP.** A single well-built agent project with real x402 payment flows can plausibly stack The Graph AI track + Hedera x402 + Arc agents + Ledger + Bazantic + World AgentKit. The counter-programming niches (less crowded): 1inch SwapVM, Chainlink TEE workflows, Hedera tokenized collateral, Privy B2B.

## 4. COMMUNITY PAIN — VERBATIM QUOTES [A1–B2, primary sources]

BLUF: Public verbatim complaints are moderately scarce for these young products (Aqua, CRE Confidential, ENSv2, Bazantic are weeks-to-months old); GitHub is the richest vein. Four solid verbatim captures, plus audit-sourced friction:

1. **Hedera x402 docs gap** — hashgraph/hedera-agent-kit-js#903 (user Utkal059, bounty builder): *"the documentation for setting up x402 middleware with HCS was sparse. It wasn't clear how to handle payment verification callbacks in an async LangGraph ReAct loop... There was no example showing how to wire x402 middleware with an MCP server so that tool calls only proceed after a confirmed HBAR micropayment. I had to piece it together from the x402 spec and the Agent Kit source code manually, which took significant time."* Sister issue #892 ("x402 + MCP payment-triggered agent template") and #1007 ("Hedera Agent Kit + x402 payments example") confirm the same gap. → **A working, documented x402+MCP-on-Hedera pattern is itself prize-worthy.** [A1]
2. **1inch Aqua accounting hazard** — 1inch/aqua#26: *"Aqua updates internal balances by the requested amount and then performs the ERC20 transfer without verifying the actual amount moved. For fee-on-transfer (taxed) or rebasing tokens, the internal Aqua accounting diverges from real wal[let balances]"* — plus OpenZeppelin's MVP v1.0 audit: 5,100+ ERC-20s where `token.withdraw()` can strand assets in SwapVM, and the AquaAMM builder *"imports ProgramBuilder from test/ using relative paths, which bypass remappings and can make compilation and deployment packaging brittle."* Repo has 88 open issues. → Aqua is early and rough; judges will reward teams that navigate SwapVM correctly. [A1/B2]
3. **Substreams CLI papercuts** — streamingfast/substreams PR #925: *"`substreams registry login` failed with a 'no such file or directory' error when `~/.config/substreams` didn't exist yet."* Broader sentiment (Rust learning curve for Substreams modules) is why The Graph's featured challenge is literally "one prompt → deployed Substreams pipeline" via SKILLs — they know authoring is hard. [A2]
4. **Chainlink CRE trust gap** — community analysis (Eman Herawy, "From Building Workflows to Breaking Them", Medium — paywalled/403 on fetch, quoted via search index): simulation *"validates SDK integration but cannot detect non-determinism or multi-node consensus failures, and passing simulation does not imply production safety... the gaps between 'it compiles' and 'it's secure.'"* Confidential Workflows shipped so recently (issue #21635) there is essentially no public complaint corpus yet — first-mover surface. [B3]
5. **ENSv2 whiplash** — not a dev complaint but a positioning fact: ENS Labs killed Namechain in Feb 2026 after 2 years (*"We've invested significantly in Namechain... Many people think of ENSv2 and Namechain as synonymous"* — ENS Labs leadership via Cointelegraph/The Block). Community docs and old tutorials still assume the L2; teams building on mainnet-ENSv2 primitives avoid stale-doc traps. [B2]

Honest note: no verbatim X/Reddit rants found for "1inch Aqua", "ENSv2", "Bazantic", or "Ledger Agent Stack" via search — these products are too new/niche for organic complaint volume; GitHub issues above are the authentic pain signal.

## 5. JUDGE READING [B3]

No named judges published. Operating model (standard ETHGlobal async): each sponsor's devrel/engineering judges its own prize against the written qualification requirements (which are unusually explicit this event — treat them as literal checklists); ETHGlobal staff select event finalists on creativity/functionality/technical difficulty/impact. Practical read: **the prize-page qualification bullets ARE the judge rubric** — e.g. The Graph disqualifies mocked data outright; World requires a written DX-feedback document as a qualification item (they're buying feedback); Bazantic requires an A/B test with and without your Recipe; Ledger requires builds on Key Ring CLI (`wallet-cli ring`) specifically.

---
Raw scraped prize text preserved at /tmp/prizes.txt (1,123 lines, full 11-sponsor detail).
