# LEASH - Product Requirements Document

**Version:** V1
**Integrations (3):** ENS (ENSv2) + Hedera (x402 agentic payments) + Privy (B2B server wallets)
**Source:** warroom V2 winner (WINNER-BRIEF.md) + docs/LEASH-MASTER-BUILD-DOC.md (authoritative pre-forge scope)

> The Thesis lives ONLY in `warroom/WINNER-BRIEF.md` `## Thesis`. This PRD references it; it never restates-with-modification.

---

## 1. Project Overview

### One-Liner
<!-- [CRITIQUE E-4] Headline escapes the crowded x402-payer lane and enforces the thesis drift-tripwire ("an agent that pays" must NOT be the headline). No trustless/chain-enforce claim. -->
Not another agent that pays an API. LEASH is the ENS name that can un-pay it: cut one resolver record and that agent's spending dies everywhere, in one on-chain write.

LEASH turns an organization's ENS name hierarchy into a live, revocable spend-permission graph for its fleet of paying AI agents. Cutting off any agent everywhere is one on-chain write.

**LEASH is the control layer for your AI agent fleet: it keeps every AI agent that spends your money on a leash.** One console to bind, govern, and cut off every agent in your fleet: **Identity · Account · Limits · Funding · Kill-switch · Audit**. Spend-governance with one-write revoke stays the hero capability; the umbrella is the whole management surface, not spend control alone. Concretely, the managed surface is: bind an external identity (ERC-8004 / EVM, on-chain-resolved), a 2-of-2 co-owned Hedera spending account, policy (per-call cap, allowlist, rolling daily/weekly soft caps, time-windows), Privy funding, revoke/reactivate lifecycle, and an HCS audit feed.

**Chain scope (today) and roadmap.** LEASH governs agent spending on Hedera today. Governance for other chains (Arc, Base, and other EVM networks) is in progress. Identity binding is already multi-chain (any EVM address / ERC-8004, on-chain-resolved). The Privy funding rail tops up the agent's Hedera account (chainId 296) today, and the Privy mechanism is EVM-general and portable to other chains later. Spend governance (in-cap allow / over-cap refuse / revoke) runs on Hedera only right now, because the co-signing facilitator LEASH runs is the x402/Hedera one; native governance on another chain needs a co-signer plus policy read deployed per chain (roadmap).

> **[DESIGN/IA NOTE: current UI state, 2026-09-13].** The shipped app uses the **Signal Grid** visual system (electric-lime `#c6f24d` on near-black `#0a0a0b`; Clash Display + Manrope + JetBrains Mono; jade/coral verdicts; faint blueprint grid) and an **owner-first multi-page IA**: `/` owner landing → `/app` console (Privy CONNECT gate → provision org → fleet dashboard) → `/app/agent/[ensName]` agent detail → `/demo` restyled side-door → `/proof`. The native **"Tether"** logo (a leash-clasp wordmark, native to the name) is wired as `logo.svg`/favicon/nav/hero. `DESIGN_SYSTEM.md` + `brand.json` are the FINAL source of truth for the visual system. The primary journey is the OWNER; the guided sandbox `/demo` is now a SIDE-DOOR (its BEHAVIOR is unchanged and still frozen, INVARIANT #10, but it is redesigned into a guided 5-step walkthrough). The "sandbox-first", "two front doors", "warm-editorial-dark / amber", and "spend-control plane as the sole framing" language in the older sections below describes the earlier demo priority and the reframe headline, not the current front-door IA or visual system; the current framing is the **control layer for your AI agent fleet** (spend-governance + one-write revoke stays the HERO). UI copy uses **no em dashes**. See `docs/REDESIGN-STATE-HANDOFF.md` + `docs/JUDGE-PATH.md` + `docs/REDESIGN-BUILD-SCOPE.md`. Honesty locks, the three-integration claims, the warroom Thesis, and the frozen floor are unchanged.
>
> **[DEMO/TEST AGENT: SOLV-001].** There are TWO test paths. (1) The guided sandbox `/demo` (zero login, zero wallet, zero ETH; frozen behavior). (2) The **normal-user path** driven from `/app` against a REAL external agent, **SOLV-001** (`github.com/dmustapha/solv-001`, a Circle-wallet autonomous agent on Arc testnet, owner-controlled). SOLV-001 is bound and governed in the console to prove in-cap pay / over-cap refuse / revoke / over-fund DENY against live rails. Known reconciliation seam: SOLV-001 natively pays on **Arc (Circle)**, but LEASH governs a **Hedera** x402 spending account, so binding it binds its identity to a NEW LEASH-provisioned Hedera co-owned account and the governed payments run on LEASH's Hedera rail, not on Arc; reconcile this during wire/livetest. Full step-by-step in `docs/JUDGE-PATH.md`.
>
> **[USER] REFRAME (2026-09-12 — headline model; the create-your-own-agent product is roadmap "coming soon").** LEASH stops **minting** agents. It is the **spend-control plane for agents that already exist**. An agent's real self — logic, LLM, key, identity — lives **outside** LEASH (an EVM address / ERC-8004 registration it controls). LEASH **binds** that external identity to an **ENS name (the leash)** + a **2-of-2 co-signed Hedera spending account** (agent holds one key, LEASH the other) + a **policy** (per-call cap, allowlist, rolling daily/weekly caps, time-windows) + **Privy funding** + **one-write revoke**.
>
> **Honest framing (LOCKED — three DISTINCT properties, never conflate, never drift):**
> - **Control = TRUE.** LEASH co-controls the agent's spending account: its policy-checked co-signature is *required*, so the agent cannot spend without LEASH, and LEASH refuses anything over-policy. Caps + revoke are real. Symmetrically, LEASH cannot touch the agent's funds without the agent.
> - **Independence = TRUE.** The agent holds its own key on the account (a genuine co-owner), and its identity/logic/LLM are external and self-owned.
> - **Trustless = FALSE (NEVER claim).** The cap is enforced by LEASH's *decision to co-sign*, not by the chain. The chain enforces only "two keys signed," never "why." Same honest facilitator-trust boundary as today (INVARIANT #4). Corporate-card model: independent employee, company-governed card, freezable.

### Problem Statement
Teams now deploy fleets of AI agents that spend money per call over x402. The only spend control today is a raw private key per agent: no per-agent cap, no payee scoping, no hierarchy, and revocation means rotating keys across every downstream service by hand. A leaked or rogue agent has no single, instant, org-wide off-switch. **The shocking number: cutting off a leaked agent today means touching every downstream service one-by-one; LEASH cuts it everywhere in ONE transaction.**

### Solution
Each agent is a child ENS name (`data.acme.leash.eth`) whose resolver text record `leash.policy` encodes its spend capability: per-call cap, allowed payees, its Hedera account, and the token. A self-hosted (forked) Hedera x402 facilitator reads that record via viem `eth_call` **before settling** each gas-free payment and refuses anything over-cap or off-allowlist. Privy holds the org treasury as a policy-gated server wallet and gates how agents get funded - an independent second rail on the funding flow, never a per-transaction co-signer. Revoking the ENS text record or the EAC role kills that agent's spend everywhere in one Sepolia write. **The name is the leash: cut it, the spending dies.**

### Why it holds up
| Dimension | How LEASH delivers |
|---|---|
| Technicality | Facilitator-reads-ENS-resolver-pre-settlement is genuine protocol composition across ENSv2 (EAC roles + Permissioned Resolvers + hierarchy) and native Hedera x402 (gas-free exact scheme). Not a wrapper. |
| Originality | "Your ENS name IS your revocable spend policy" is a true didn't-know-you-could. Zero instances of the specific interlock (facilitator reads the resolver record as live settlement policy) found in prior art. |
| Practicality | Every primitive is live today: ENSv2 Sepolia beta, forkable Hedera facilitator, Privy policies. Real orgs running >1 paying agent are the user. No beta gate, no Graph-on-Hedera landmine. |
| Usability | The negative-WOW (payment fails-closed after revoke) is made legible via an A/B split-screen: resolver record vs live 402 flipping pass to fail on camera. Zero-setup sandbox drives the whole flow with no login/wallet/ETH. |
| Impact | One on-chain write kills an agent's spending everywhere, witnessed live: the same $3 call that worked 90 seconds ago now fails closed. |

### Integration depth (each surface, load-bearing)
- **ENS (ENSv2):** ENSv2 on Sepolia central (hierarchy + EAC roles + Permissioned Resolver + reverse), no hard-coded values (runtime address load / pinned set), policy lives in the resolver, revoke = `revokeRoles`/clear-record. 3-level multi-tenant hierarchy (`leash.eth` → `<org>.leash.eth` → `data.<org>.leash.eth`) deepens ENS depth.
- **Hedera (x402):** live x402-gated service, ≥1 real paid request e2e, gas-free native scheme via self-hosted facilitator, HCS audit trail, real value (own HTS USDC) settled on testnet, HashScan-verified. <!-- [CRITIQUE E-1] VERIFIED 2026-09-12: Blocky402 is open-source (MIT) + self-hostable (Docker/Node) on Hedera testnet, built on the same @x402/core + @x402/hedera stack this design uses; onBeforeVerify/onBeforeSettle are official x402 hooks. DECISION: FORK Blocky402 and add the ENS gate via onBeforeSettle so "via the Blocky402 facilitator" is literally true. Build (Task 2.2) confirms the fork exposes the hook; fallback = self-hosted @x402/core+@x402/hedera (Blocky402-equivalent, stated in README). No second non-ENS facilitator path. -->
- **Privy (B2B):** org/server wallets as the treasury, policy engine control (cap + allowlist on funding calldata), live leaked-key over-fund DENY, a real B2B funding flow. Deepened via Privy embedded-wallet login (email/Google) in the real multi-tenant console.

---

## 2. System Architecture Overview

### System Diagram
```
        Ethereum Sepolia (ENSv2)                              Hedera testnet
 +--------------------------------------+          +-------------------------------------------+
 | leash.eth (LEASH root)               |          | Facilitator (self-hosted, @x402/core)     |
 |  └─ acme.leash.eth (org subname)     |          |   onBeforeVerify + onBeforeSettle hooks:  |
 |       ├─ data.acme.leash.eth (agent) |<--read---|     getEnsText(name,'leash.policy') (viem  |
 |       │   resolver.text 'leash.policy'|  eth_call|     eth_call to Sepolia)                   |
 |       │   = {maxPerCall, allowedPayees,|         |     assert hederaAccount === tx payer      |
 |       │      hederaAccount, token}    |          |     assert amount<=maxPerCall (BigInt)     |
 |       └─ payments.acme.leash.eth (a2) |          |     assert payTo in allowedPayees          |
 |  EAC roles: org holds SET_RESOLVER/  |          |       -> {abort,reason} OR proceed         |
 |  SET_SUBREGISTRY; revokeRoles = kill  |          |     settle: add feePayer sig + submit      |
 +--------------------------------------+          |     log ALLOW/DENY -> HCS topic            |
                                                    +--------------------+----------------------+
  Privy (org treasury + policy engine)                                   | native TransferTransaction
 +--------------------------------------+                                | (USDC HTS, feePayer=facilitator, gas-free)
 | Org server wallet (P-256 owner)      |--fund-->  +--------------------v----------------------+
 | Hedera EVM (Hashio chain 296)        | (Privy    | Agent Hedera account (ECDSA)             |
 | policy: ERC-20 transfer cap+allowlist| policy-   | holds USDC (HTS); pays x402              |
 | leaked-key over-fund -> DENY         | gated)    | SAME ECDSA key owns the ENS name         |
 +--------------------------------------+           +--------------------+----------------------+
                                                                        |
                                                     +------------------v----------------------+
                                                     | x402-gated Resource Server (@x402/express)|
                                                     |  GET /premium  network hedera:testnet     |
                                                     +-------------------------------------------+

  Owner-first multi-page IA (Next.js on Vercel; current shipped IA per the DESIGN/IA NOTE in §1):
   /                    -> OWNER LANDING (public marketing, SiteNav + kinetic HeroFleet)
   /app                 -> CONSOLE: Privy CONNECT gate -> provision org -> fleet dashboard [primary journey]
   /app/agent/[ensName] -> AGENT DETAIL (identity, account, limits, allowlist, funding, revoke, activity)
   /demo                -> GUIDED SANDBOX side-door (pre-seeded, server-side, no login/wallet/ETH; frozen behavior, guided 5-step)
   /proof               -> VERIFICATION surface
   (The "demo-first / two front doors" framing below is the earlier demo priority; the current front door is the owner console.)
```

### Component Table
> **ENS names are runtime placeholders.** `leash.eth` / `acme.leash.eth` throughout this doc are illustrative. WS-1 resolves the actual free root 2LD FIRST (`leash.eth` or a free fallback e.g. `leashorg.eth`); every `*.leash.eth` string is runtime-substituted from `ENS_PARENT_NAME` (updated to the 3-level shape; the stale `ENS_PARENT_NAME=acme.eth` in the master doc §8 is superseded). No custom Solidity is in scope - ENS (external) + the facilitator ARE the enforcement (master §12 `contracts/` is "if needed", not needed).

| Component | Type | Purpose | Key Dependencies |
|-----------|------|---------|-----------------|
| ENS provisioning scripts | Node/viem scripts | Register 2LD, deploy org subregistry, grant/revoke roles, mint subnames, setText policy, reverse, read | viem, Sepolia RPC, ENSv2 pinned addrs |
| Facilitator (incl. HCS logger) | Node service | Reads ENS policy pre-settlement, enforces cap+allowlist+binding, native Hedera settle gas-free, appends ALLOW/DENY audit entries to the HCS topic | @x402/core, @x402/hedera, viem, @hiero-ledger/sdk |
| Resource server | Node service (Express) | x402-gated demo API (`GET /premium`), points at our facilitator | @x402/express, HttpFacilitatorClient |
| Agent client | Node module | Builds/signs the native transfer (Privy secp256k1Sign), pays with `X-Leash-Agent` header | @privy-io/server-auth, @x402/hedera |
| Treasury (Privy layer) | Node module | Org P-256-owner server wallet + funding policy + policy-gated funding + leaked-key DENY | @privy-io/server-auth |
| Web dashboard | Next.js App Router | Two paths: `/demo` sandbox + `/app` real console; mint/cap/allowlist/revoke UI, live spend feed, A/B revoke view | Next.js, viem, @privy-io/react-auth |
| Database | Postgres (Neon) | App/index layer: users, orgs, agents, spend_events. NEVER the enforcement authority | Neon, drizzle/pg |
| Relayer | Node (Vercel API route) | Gas sponsor: deployer pays Sepolia gas for a user's ENS ops, scoped to that user's org subname | viem, LEASH_DEPLOYER_KEY |

### Data Flow
An org mints a child ENS name for each agent and writes its `leash.policy` text record. The same ECDSA keypair owns the ENS child on Sepolia and is the agent's account on Hedera - this binding is what lets the facilitator tie a Hedera payer to a Sepolia policy. When the agent calls the x402-gated API, the resource server returns 402 with PaymentRequirements. The agent builds a partially-signed native Hedera TransferTransaction and retries with the `X-PAYMENT` payload + `X-Leash-Agent: data.acme.leash.eth`. `onBeforeVerify` runs an ADVISORY pre-screen (may use a ≤30s cache) reading the ENS record and checking `hederaAccount === payer` (anti-spoof), `amount <= maxPerCall` (BigInt), `payTo in allowedPayees`. The AUTHORITATIVE decision is made in `onBeforeSettle`: it re-reads the ENS record via viem with NO cache immediately before adding the fee-payer signature, so a revoke landing between verify and settle fails the in-flight payment closed (`REVOKED`). The gate returns a closed `{settle:true,auth} | {abort:true,reason}` decision (INVARIANTS #1/#2); ALLOW/DENY is logged to HCS; settle adds the fee-payer signature only on `{settle:true}`. Separately, the org treasury (a Privy P-256-owner server wallet) funds agents via ERC-20 USDC transfers that Privy's policy engine gates. Revocation clears the text record or revokes the EAC role in one Sepolia tx; the facilitator's next read (cache TTL ≤ 30s, and NO cache on the demo revoke path) sees empty policy and aborts all that agent's payments.

> **Enforcement trust model (say it plainly):** enforcement is FACILITATOR-TRUSTED, not chain-trustless. The facilitator is operator-run software (true of every x402 facilitator by design). ENS is the org-controlled source-of-truth config the facilitator reads. Never claim the chain enforces the cap.

---

## 3. User Flows

> **[USER] REFRAME (2026-09-12) — headline flow is register-existing, NOT mint-an-agent.** The flows below are preserved as the frozen `/demo` sandbox (single-key path, VM-1/VM-2) and the prior `/app` create-agent path (now roadmap "coming soon"). The reframe headline flow supersedes them for `/app`.

### Flow 0: Register an EXISTING agent (`/app`, the reframe headline)
The agent's identity/logic/LLM/key already exist outside LEASH. Registration BINDS that identity — it never mints one. No "mint an agent" copy anywhere in this path.
1. User supplies an **EVM address and/or an ERC-8004 `agentId`** for an agent they run.
2. LEASH calls the canonical ERC-8004 Identity Registry on Ethereum Sepolia (`0x8004A818BFB912233c491871b3d84c89A494BD9e`, ABI verified live at build) to **resolve** the owner. The badge reads **"on-chain-resolved"**, NOT "verified" — `ownerOf` does not prove the registrant controls the address (proof-of-control = roadmap). Owner-mismatch ⇒ clear error. Identity stays ADVISORY (INVARIANT #13).
3. LEASH provisions a **2-of-2 co-signed Hedera spending account**: `KeyList[agentPub, leashCoSignerPub]`, `threshold=2`. The **agent supplies ONLY its Hedera PUBLIC key** (`agentPub`) — its Hedera private key is held by the AGENT and is NEVER in LEASH's facilitator, DB, or env (SR-1, the linchpin). USDC-associated; funded via the account's **long-zero EVM address**.
4. LEASH writes the ENS text records — the **on-chain-resolved** identity keys (`agent.erc8004` CAIP, `agent.address`) — and then writes `leash.policy` **LAST** (spend authority is the final write, so a partial register is inert / fail-closed).
5. **Privy funds** the spending account at its **long-zero EVM address** (funding UNION behind `requireOwner`; in-cap ALLOW / over-fund DENY on the real token). Privy stays funding-only, never a per-transaction co-signer (INVARIANT #6).

### Flow 1: Guided sandbox hero flow (`/demo`, zero-setup) - the demo path
1. The visitor opens `/demo`. Pre-seeded `acme.leash.eth` with 2 child agents renders, each showing its cap + allowlist read live from ENS Sepolia. No login, no wallet, no ETH.
2. The visitor (or auto-play) triggers **SPEND**: agent 1 pays a whitelisted API 3 USDC. Facilitator reads ENS + binding check → settles gas-free → HashScan receipt + HCS log line appear.
3. The visitor triggers **REFUSE**: same agent tries 50 USDC → facilitator aborts `over_cap`, shown beside the 3-USDC success (A/B split-screen: resolver record | live 402).
4. The visitor triggers **KILL**: org clears the record / `revokeRoles` (one real Sepolia tx). The agent's next 3-USDC call - identical to the one that worked - now fails closed. Split-screen resolver to 402 flips pass to fail.
5. The visitor triggers **SECOND RAIL**: a leaked key tries to over-fund an agent from the treasury → Privy policy DENY. HCS audit trail scrolls.

### Flow 2: Real console onboarding (`/app`, bring-your-own-org, multi-tenant)
1. User signs in with Privy email/Google (embedded wallet, no MetaMask). Every `/app` API route verifies the Privy auth token server-side and derives the tenant from it, never from client input (A1, INVARIANT #11).
2. LEASH provisions their org subname `<org>.leash.eth` under `leash.eth` (gas sponsored by the relayer, scoped to that subname). The org name is bound to the owning `privyUserId`, so a second user cannot reuse it (A2). On provision, the EAC kill-switch role is granted to the signed-in user's Privy embedded-wallet address ALONGSIDE the relayer, so the user co-holds real on-chain revoke authority while the relayer stays the delegated operator for gasless ops (C1, INVARIANT #12).
3. User registers an agent: LEASH mints `data.<org>.leash.eth`, sets its `leash.policy`, writes agent-identity records (`agent.description`, `agent.type`, `avatar`, optional ERC-8004 pointer) plus a reverse name (D1, advisory-only, INVARIANT #13), adds the new agent to the Privy funding-policy allowlist so it can be funded in-cap (A3), and records it in Postgres.
4. User sets caps, EDITS the allowlist (rewrites `leash.policy` on-chain, B1), funds the agent from the Privy treasury (policy-gated, in-cap ALLOW / over-fund DENY on the real token, A3), watches a LIVE per-agent + org-level spend feed indexed from HCS (B3), revokes with one click, and can UN-REVOKE / re-activate a revoked agent (setPolicy rebind, B2) - all gas-sponsored.

### Flow 3: Revocation (shared mechanism, both paths)
1. Org clears the text record (`setText('leash.policy','')`) OR `revokeRoles(tokenId, SET_RESOLVER|SET_SUBREGISTRY, agentAddr)` - one Sepolia tx.
2. Facilitator's next read (no cache on demo path) sees empty policy → aborts all that agent's payments (`revoked`).
3. Optional watcher syncs Privy to freeze that agent's treasury funding.

### Sequence Diagram (payment path)
```
Agent      -> ResourceServer: GET /premium
ResourceServer -> Agent: 402 PaymentRequirements {price, payTo, network hedera:testnet, extra.feePayer}
Agent      -> Agent: build native TransferTransaction (txId.accountId=feePayer), Privy secp256k1Sign(hash)
Agent      -> ResourceServer: retry + X-PAYMENT payload + header X-Leash-Agent: data.acme.leash.eth
ResourceServer -> Facilitator: /verify
Facilitator -> Sepolia(viem): getEnsText(name,'leash.policy')  [onBeforeVerify: advisory pre-screen, ≤30s cache OK]
Facilitator -> Facilitator: assert hederaAccount===payer; amount<=maxPerCall (BigInt); payTo in allowedPayees
Facilitator -> Sepolia(viem): getEnsText(name,'leash.policy')  [onBeforeSettle: AUTHORITATIVE, NO cache - closes TOCTOU]
Facilitator -> Facilitator: authorize() -> {settle:true,auth} | {abort:true,reason}
Facilitator -> HCS: append ALLOW/DENY
Facilitator -> Hedera: add feePayer sig + submit (gas-free)  [only on {settle:true}]
Facilitator -> ResourceServer: settled | {abort, reason}
ResourceServer -> Agent: paid data | 402 with reason
```

---

## 4. Technical Specifications

### ENS provisioning layer
- **Purpose:** provision + control the org naming hierarchy and per-agent policy records on ENSv2 Sepolia.
- **Interface:** scripts/functions - `register2LD`, `deployUserRegistry`, `grantRole`, `mintSubname`, `setPolicy`, `setReverse`, `readPolicy`, `revoke`, `loadAddresses`. **Agent-identity writes (D1):** `setIdentity` writes agent-identity text records (`agent.description`, `agent.type`, `avatar`, optional ERC-8004 pointer) alongside `leash.policy` on each agent child, and `setReverse` sets a reverse name for the agent account. These records are ADVISORY identity metadata surfaced in `/app` + `/proof` + demo; the facilitator's authorize path NEVER reads them (INVARIANT #13).
- **Key data structures:** `leash.policy` JSON `{ "maxPerCall": "5000000", "allowedPayees": ["0.0.PAYEE"], "hederaAccount": "0.0.AGENT", "token": "0.0.USDC" }` (amounts raw smallest-unit; USDC 6 decimals). Agent-identity keys are SEPARATE text records, never mixed into `leash.policy`.
- **Dependencies:** viem ^2.56, Sepolia RPC, pinned ENSv2 addresses (2026-06-29 set) or runtime load from `contracts-v2/deployments/sepolia/*.json`.
- **Constraints:** commit-reveal 2LD registration needs ~60s wait → local setup script only (exceeds serverless timeouts). Runtime ops (mint subname, setText, revoke) are single fast txs → fine in Vercel API routes.

### Facilitator + ENS gate
- **Purpose:** the load-bearing spend gate. Read ENS policy pre-settlement; enforce cap + allowlist + binding; settle native Hedera gas-free; log to HCS.
- **Interface:** `new x402Facilitator().registerScheme(2,["hedera:testnet"],hederaScheme).onBeforeVerify(hook).onBeforeSettle(hook)`. SDK hook contract is `void | {abort:true, reason:string}`; context carries `{payload, requirements}`. Internally a pure `authorize(ctx): {settle:true,auth} | {abort:true,reason}` (closed union, no proceed default) drives both hooks; the adapter emits SDK-proceed only under `if(d.settle===true)`. `onBeforeVerify` = advisory pre-screen (≤30s cache); `onBeforeSettle` = authoritative no-cache read (closes TOCTOU, INVARIANTS #2).
- **Key data structures:** decoded payment `{payer, amount, asset, payTo}`; ENS policy JSON; HCS entry `{name, decision, amount, payTo, reason, ts}`.
- **Dependencies:** @x402/core ~2.25, @x402/hedera 2.25, viem, @hiero-ledger/sdk 2.85.0.
- **Constraints:** amount and maxPerCall compared as BigInt raw units. NO cache on the demo revoke path; 30s in-memory cache elsewhere; on RPC failure → error, never allow. **Durable replay store (A5, INVARIANT #14):** the `seen` paymentId set is Neon-backed so a replayed `X-PAYMENT` is rejected `REPLAY` even across a facilitator restart (Render spin-down). The durable store is on the replay-guard path ONLY; enforcement still reads live ENS, never the DB (INVARIANT #3 intact).

### Resource server
- **Purpose:** the live x402-gated service Hedera requires.
- **Interface:** `paymentMiddlewareFromConfig({ 'GET /premium': { price, network:'hedera:testnet', payTo } }, HttpFacilitatorClient({url: OUR_FACILITATOR}))`.
- **Constraints:** demo endpoint price reconciled with narrated amounts (see Risk R-11 / §6 note).

### 2-of-2 co-signed spending account + agent-side client + funding [USER REFRAME, 2026-09-12]
- **Purpose:** the reframe's spending model for `/app` register-existing agents. Additive + network-typed; the `/demo` single-key sandbox account is FROZEN and NO-TOUCH (INVARIANT #10).
- **Account model:** a NET-NEW `KeyList[agentPub, leashCoSignerPub]`, `threshold=2` Hedera account (`scripts/hedera/provision-spending-account.ts`; NO reuse of `ensureCanonicalAgent`, NO touch to `provision-canonical.ts`). `agentPub` is supplied by the agent; the agent holds `agentPriv` (SR-1 — never in LEASH). `LEASH_COSIGNER_KEY` holds the cosigner key and is **asserted DISTINCT from `HEDERA_OPERATOR_KEY`** (the fee-payer) at process start — throw if equal — so "LEASH's authority key ≠ its gas key" is literally true within the process.
- **Agent-side x402 client (SR-1 / SR-2):** the x402 client runs **AGENT-SIDE** — an external process holding its own Hedera key, signing **1-of-2** on the KeyList account. The demo/VM-3 agent is such an external process; it does NOT sign with a LEASH-held key.
- **Co-sign discipline:** verify-time accepts the agent's valid 1-of-2 signature (a custom `verifyPayerSignature` confirming a known KeyList member signed; the network enforces the full threshold at submit). LEASH applies its co-signature **ONLY at settle, AFTER the gate passes, at the single post-gate emit site** — and only if `authorize()` returns `{settle:true}`. Agent-alone ⇒ no settle (`MISSING_COSIGN`, a clean gate reason, never a caught Hedera `INVALID_SIGNATURE`); operator-alone can't move funds (F-031, depends ENTIRELY on SR-1).
- **Funding:** Privy funds to the account's **long-zero EVM address** (a KeyList account has no key-derived EVM alias — REF-2). That long-zero EVM is also the `agentEvm` in ENS and the `reconcileFundingAllowlist` target. Long-zero HTS funding is live-checked at the S-GATE; if it fails, the Privy DENY beat falls back to the treasury source (still exercises the funding rail).

### Agent client (legacy single-key path — FROZEN /demo floor; create-your-own roadmap)
- **Purpose:** build + sign + pay.
- **Interface:** `pay(endpoint, agentName)` → builds native TransferTransaction, `freezeWith(client)`, signs via Privy `secp256k1Sign(hash)`, retries with `X-PAYMENT` + `X-Leash-Agent`.
- **Dependencies:** @privy-io/server-auth (custody signer), @x402/hedera.

### Treasury (Privy) layer
- **Purpose:** org treasury + funding policy + leaked-key DENY.
- **Interface:** `walletApi.createPolicy(...)`, `walletApi.createWallet({chainType:'ethereum', owner:<P-256>, policyIds:[id]})`, `walletApi.ethereum.sendTransaction(...)` with `caip2:'eip155:296'`.
- **Key data structures:** funding policy - ALLOW `eth_sendTransaction` where ERC-20 `transfer._to in [agentAddrs]` AND `transfer._value lte fundingCap`; default DENY.
- **Constraints:** wallet MUST have a P-256 owner and be driven via the SDK (raw calls fail-OPEN). `fundingCap` pinned raw units, distinct from per-call `maxPerCall`. **Funding-allowlist reconcile (A3):** on agent register, the new agent EVM-facade address is added to the Privy funding-policy allowlist so an in-cap `Fund` ALLOWS (real transfer) while an over-fund still DENIES `FUNDING_DENIED`, both on the real token. The default action stays DENY; the allowlist grows one entry per registered agent.

### Web dashboard (owner-first multi-page IA)
- **Purpose:** owner-first control layer. `/` owner landing → `/app` console (Privy connect → provision org → fleet dashboard) → `/app/agent/[ensName]` agent detail → `/demo` restyled guided-sandbox side-door → `/proof`. The `/demo` sandbox behavior is frozen (INVARIANT #10); the console is the primary journey. Visual system = Signal Grid (`DESIGN_SYSTEM.md` + `brand.json`), Tether logo, no em dashes in UI copy.
- **Interface:** server-side API routes for ENS ops, agent payment trigger, Privy treasury, sandbox orchestration. **Authz layer (A1, INVARIANT #11):** every `/app` console route (org, agents, revoke, pay, fund) runs `verifyAuthToken` server-side and derives `privyUserId` from the verified token, never from client-supplied query/body. A request with no valid token, or naming another tenant's id, is rejected 401/403 with no mutation. New console controls (B1 allowlist edit, B2 un-revoke) are ordinary authz-guarded routes.
- **Key data structures:** see §Database.
- **Constraints:** the sandbox path must never depend on the real-console path (§13.6). The `/demo` sandbox is server-orchestrated and is NOT behind the auth-token layer (no login by design); the authz layer applies to `/app` console routes only.

### Database (Postgres/Neon)
- **Purpose:** app/index layer, per-user views, activity feeds, metadata not on-chain.
- **Key data structures:** `users`, `orgs`, `agents (ens_name, max_per_call, allowed_payees, hedera_account, status, tx refs)`, `spend_events (indexed from HCS)`.
- **Constraint (INVARIANT):** ENS remains the on-chain source of truth; the facilitator reads ENS LIVE at settlement, NEVER the DB. The DB is never the enforcement authority.

### Relayer
- **Purpose:** gasless onboarding - deployer key sponsors a user's ENS ops.
- **Constraint:** SCOPED to that user's own org subname (not an open relay). The sandbox mode needs no relayer (server-side, pre-funded).

---

## 5. API Contracts

### External API: Hedera testnet (via @x402/hedera + Mirror Node)
- **Base:** Hashio EVM `https://testnet.hashio.io/api` (chain 296); Mirror Node for payer-signature verification.
- **Auth:** operator key (fee payer); agent ECDSA key (transfer signer).
- **Usage:** native `TransferTransaction` (USDC HTS), `TokenCreateTransaction` (own 6-dec USDC), `TokenAssociateTransaction`, `TopicCreateTransaction` + `TopicMessageSubmitTransaction` (HCS).

### External API: Ethereum Sepolia (viem eth_call / eth_sendRawTransaction)
- **Base:** Alchemy Sepolia RPC (`SEPOLIA_RPC_URL`).
- **Auth:** deployer key for writes; read-only for `text()`/`getSubregistry()`.
- **Key calls:** `register`, `setSubregistry`, `setResolver`, `grantRoles`, `revokeRoles`, `setText`, `text`, `setName`.

### External API: Privy (@privy-io/server-auth)
- **Base:** Privy REST via SDK; `POST /v1/wallets/{id}/rpc` under the hood.
- **Auth:** Basic (app id + secret) + per-request `privy-authorization-signature` from the P-256 owner (SDK-computed).
- **Endpoints used:** `createPolicy`, `createWallet`, `updatePolicy`, `ethereum.sendTransaction` (`caip2:'eip155:296'`), fallback `secp256k1Sign`.
- **Response (funding DENY):** policy evaluation returns a DENY before broadcast (the leaked-key over-fund beat).

### Our facilitator (self-hosted)
- **Endpoints:** `/verify`, `/settle` (x402 facilitator protocol). `onBeforeVerify`/`onBeforeSettle` hooks carry the ENS gate.

### Our resource server
- `GET /premium` - x402-gated demo endpoint (network `hedera:testnet`).

---

## 6. Demo Script

> **[USER] REFRAME (2026-09-12) — frozen floor + reframe hero.** The `/demo` sandbox stays **FROZEN** (single-key path, VM-1/VM-2 green) as the **regression floor** and is NO-TOUCH. The reframe hero (**VM-3**) runs on a **co-signed `/app` agent**: register-existing → co-sign in-cap pay (settle) → agent-alone can't spend → operator-alone can't move funds → over-cap / over-daily / outside-window refuse → mirror-down ⇒ `RPC_ERROR` DENY → revoke ⇒ fail-closed. The scenes below describe the frozen `/demo` floor; the reframe hero is filmed on `/app` VM-3.

**Total Duration:** 3:00. **Format:** screen recording, human voice only (no AI voiceover/TTS), 720p+, intro <20s. Real on-chain txs throughout.

### Scene 1: World + dashboard (0:00–0:20)
**Screen:** `/demo` - `acme.leash.eth` with 2 child agents, each showing cap + allowlist (live ENS Sepolia).
**Voiceover:** "Acme runs a fleet of paying agents. Keys have no limits and no off-switch. LEASH fixes that: your ENS name is your revocable spend policy."
**Action:** dashboard renders live records.

### Scene 2: GRANT (0:20–1:00)
**Screen:** the live `/app` register form mints `data.acme.leash.eth` cap 5 USDC + allowlist; the real `register` + `setText` tx (policy + agent-identity records) + EAC role shown on-chain. This is a REAL register shot from the console (E1, now that 5.4a login is done), not a mock affordance.
**Voiceover:** "The org mints a child name with a 5-USDC cap and an allowlist. That policy lives in the ENS resolver record, right next to the agent's identity."
**Action:** `/app` register form → relayer-sponsored viem `register` + `setText` (policy) + identity records (D1) → Sepolia explorer confirmation of the real txs.

### Scene 3: SPEND, gas-free (1:00–1:40)
**Screen:** agent pays a whitelisted API within cap.
<!-- [CRITIQUE E-3] First time value moves, name the token as our own test USDC (own HTS 6-dec), never implying canonical USDC. Honesty invariant + pre-empts a Q&A "is that real USDC?" gotcha. Disclosed in ADR-005 / LIMITATIONS. -->
**Voiceover:** "The agent pays a whitelisted API in our test USDC, our own Hedera token. Our facilitator reads the ENS record, checks the binding and the cap, and settles on Hedera, gas-free."
**Action:** call → 402 → Privy-signed transfer → facilitator reads ENS + binding → settle → HashScan receipt + HCS log line.

### Scene 4: REFUSE, A/B (1:40–2:10)
**Screen:** same agent tries 50 USDC → facilitator aborts `over_cap`, shown beside the amount that just worked.
**Voiceover:** "Now it tries to overspend. The facilitator refuses - over cap. Same agent, same API, blocked at the payment rail."
**Action:** split-screen: resolver record | live 402.

### Scene 5: KILL - the hero moment (2:10–2:40)
**Screen:** org `revokeRoles` / clears the record (one Sepolia tx). The agent's next in-cap call now fails closed.
**Voiceover:** "One on-chain write. The org revokes the record - and the exact call that worked ninety seconds ago now fails closed. Everywhere."
**Action:** split-screen resolver ↔ 402 flips pass→fail.

### Scene 6: SECOND RAIL + real product (2:40–3:00)
**Screen:** leaked key over-funds an agent from treasury → Privy policy DENY. The live per-agent + org-level spend feed indexed from HCS scrolls (B3). Quick cut to the REAL `/app` login (E2, 5.4a done): a real Privy email/Google login provisioning a fresh org subname, where the signed-in user co-holds the kill-switch role for their own agents (Flow 2, "it's a real product" beat).
**Voiceover:** "The funding rail is independent: a leaked key can't over-fund an agent, Privy's policy denies it, and every decision lands in the live spend feed. And this isn't just a sandbox: sign in, get your own org namespace, gas-sponsored, and you hold the off-switch for your own agents. Two rails, one honest control plane."
**Action:** Privy DENY + live HCS-indexed spend feed; then the real-console login + subname provision (user co-holds the role, C1).

### Flow → Scene map (Metric 2 alignment)
| User flow (§3) | Demo scenes |
|---|---|
| Flow 1: Guided sandbox hero flow | Scenes 1, 3-5 (SPEND/REFUSE/KILL beats + world) |
| Flow 2: Real console onboarding | Scene 2 (live `/app` register mint+setText, E1) + Scene 6 (login + subname provision + user co-holds role, E2/C1) |
| Flow 3: Revocation | Scene 5 (KILL) |

> **Voice & copy compliance:** no em dashes in voiceover delivery; confident, technical, direct. Every beat is a real tx. Honest framing throughout ("the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second rail"). Never "trustless" / "the chain enforces the cap".

> **Price/amount reconciliation (R-11):** set the demo endpoint price so the narrated 3/5/50 USDC spends are literal charges against the cap (not a $0.10 flat call narrated as 3 USDC). Cap = 5 USDC; in-cap spend = 3 USDC; over-cap attempt = 50 USDC.

### Demo Prerequisites - Seed State Table
Build implements `scripts/seed-demo.ts` from this table. It must be idempotent and reproduce this exact state from scratch.

| Item | Value | Network / Location | Created By |
|------|-------|-------------------|------------|
| Org name | `acme.leash.eth` (subname of `leash.eth`) | Sepolia ENSv2 | seed-demo.ts (calls setup script) |
| Agent 1 | `data.acme.leash.eth`, cap 5 USDC, allowlist=[receiver] | Sepolia ENSv2 resolver text `leash.policy` | seed-demo.ts |
| Agent 2 | `payments.acme.leash.eth`, distinct cap | Sepolia ENSv2 | seed-demo.ts |
| USDC token | own HTS 6-dec token, id in `.env` USDC_TOKEN_ID | Hedera testnet | scripts/hedera |
| Token association | agent + receiver associated to USDC | Hedera testnet | seed-demo.ts |
| Treasury wallet | Privy P-256-owner server wallet + funding policy (cap+allowlist) | Privy / Hedera EVM 296 | seed-demo.ts |
| Agent funding | agents funded from treasury (policy-allowed) | Hedera testnet | seed-demo.ts |
| HCS topic | topic id in `.env` HCS_TOPIC_ID | Hedera testnet | scripts/hedera |

**Invariant:** `npx tsx scripts/seed-demo.ts` from project root produces this exact state; idempotent. This is REAL pre-produced state (real txs), not fabricated demo data - permitted by the INVARIANTS honesty rule.

---

## 7. Risk Register

| # | Risk | Severity | Likelihood | Impact | Mitigation | Decision Tree |
|---|------|----------|-----------|--------|------------|:---:|
| R-1 | Enforcement is facilitator-trusted (Trustlessness = FALSE); pitched wrong = credibility loss | CRITICAL | MED | Credibility loss | Honest dual-rail framing everywhere; on-chain cap-mirror = roadmap only | PLAN Phase 2 + demo-rehearsal |
| R-2 | ENSv2 alpha provisioning on Sepolia (commit-reveal + role bitmap) eats the day (G1) | CRITICAL | HIGH | No ENS integration, blocks all | Test provision script FIRST (WS-1 before all); pinned 2026-06-29 addrs; runtime loader | PLAN Phase 1 |
| R-3 | Privy policy fails OPEN (owner-less wallet does not enforce) | CRITICAL | HIGH (if missed) | Privy funding demo silently fails | P-256-owner wallet via @privy-io/server-auth; WS-0 smoke test #1 proves DENY before broadcast | PLAN Phase 0 |
| R-4 | Raw-unit / hex-vs-decimal cap mismatch silently mis-evaluates | CRITICAL | MED | Cap check wrong = broken headline | BigInt raw-unit comparison INVARIANT; unit tests for boundary values | PLAN Phase 2 |
| R-5 | Real-user path endangers the guided sandbox | CRITICAL | MED | Loses the minimum-viable bar | Sandbox-first sequencing (§13.6); tripwire cutoff; sandbox never imports real-path code | PLAN Phase 5 |
| R-6 | Fabricated/cached demo state on the revoke path | CRITICAL | LOW | Dishonest demo, invariant violation | No cache on demo revoke path; every beat a real tx; RPC-fail = error not allow | PLAN Phase 5 + demo |
| R-7 | Native Hedera gas-free settle (feePayer mechanism) not working e2e | HIGH | MED | No Hedera integration | Mint own HTS USDC; associate payer+receiver; feePayer sig by facilitator; WS-2/WS-3 e2e test | PLAN Phase 2-3 |
| R-8 | Agent↔ENS binding spoofing (attacker names someone else's record) | HIGH | MED | Bypasses the gate | `X-Leash-Agent` + record self-attests hederaAccount; facilitator asserts hederaAccount===payer | PLAN Phase 2 |
| R-9 | Feasibility: ~12-14h build on a hard deadline, near-zero buffer | HIGH | HIGH | Incomplete submission | Sandbox-first; minimum-viable tripwire (ENS+Hedera two-integration, Privy cut-first) with hour cutoff | PLAN Phase Overview |
| R-10 | Negative-WOW illegible in <3min video | HIGH | MED | Weak Usability/WOW score | A/B split-screen resolver ↔ 402; edit on camera flips pass/fail | PLAN Phase 5 + demo-rehearsal |
| R-11 | Endpoint price ($0.10) vs narrated 3/5/50 USDC mismatch | MED | MED | Confusing/dishonest demo | Set demo price so narrated amounts are literal cap charges | §6 note + demo |
| R-12 | Truncated MockUSDC/MockDAI addrs defeat self-containment | MED | MED | Setup blocks | Load from deployment JSON at runtime OR mint own; registration token only for 2LD | PLAN Phase 1 |
| R-13 | Deployer ETH runs out mid-provisioning + relayer | MED | MED | Provisioning/relayer stalls | 0.05 Sepolia ETH funded; top-up tripwire; relayer scoped | PLAN Phase 0 |
| R-14 | Vercel `.env` clobber wipes a funds-controlling key | MED | LOW | Key loss | Guard every vercel call (move .env out + restore); no scripts-only signing key on host | PLAN Phase deploy |
| R-15 | Single-commit-day DQ / missing AI attribution | MED | LOW | Submission DQ | Granular commits from hour 1; AI-ATTRIBUTION.md + spec files | PLAN all phases + package |
| R-16 | Neon free-tier / connection limits under demo load | LOW | LOW | DB hiccup | Pooled connection string (verified); DB off the enforcement path | PLAN Phase 5 |
| R-17 | Console authz / IDOR: a request with no token or naming another tenant reads or mutates cross-tenant data | HIGH | MED (if unguarded) | Cross-tenant leak / rogue mutation; B2B credibility loss | `verifyAuthToken` on every `/app` route; tenant derived from the verified token, never client input; foreign-id → 401/403 no mutation (INVARIANT #11) | WS7 A1; FEATURE-OBSERVABLES F-016 |
| R-18 | Render cold-start / spin-down: facilitator restarts mid-demo and loses in-memory replay state | MED | MED | In-memory `seen` set cleared → a replay could slip; cold-start stall in the video | Durable Neon-backed replay store (INVARIANT #14) so `REPLAY` survives restart; deploy keep-warm ping or `plan:starter` (DS-5) | WS7 A5; PULSE DS-5; FEATURE-OBSERVABLES F-008 |
| R-19 | Rate-limit / balance drain: rapid repeat `/api/demo` or console calls drain the fee-payer / agent balance | MED | MED | Sandbox runs dry mid-session | Per-IP/session token-bucket rate limit returns `429` before balances drain (A4) | WS7 A4; FEATURE-OBSERVABLES F-019 |
| R-20 [USER REFRAME] | Rolling daily/weekly cap is a **SOFT budget** (mirror node is a LAGGING index, read via `consensus_timestamp`), not a settle-live hard cap | HIGH | MED | Overspend up to worst-case ≈ **C × maxPerCall** under C concurrency | Disclose as soft budget (never exact/settle-authoritative, Trustlessness = FALSE); `maxPerCall` (live ENS) is the hard per-call bound, `fundingCap` (Privy) the hard aggregate; fail-CLOSED on mirror error (`RPC_ERROR`, never default-0); malformed cap ⇒ `MALFORMED_POLICY`; serialize per-agent settle if the tighter bound is wanted | REFRAME D3; INVARIANTS #3; LIMITATIONS |
| R-21 [USER REFRAME] | Cosigner shares the facilitator's process trust-domain (`LEASH_COSIGNER_KEY` in the same process, separate-trust-domain cosigner service = roadmap) | MED | MED | 2-of-2 is facilitator-trusted (Trustlessness = FALSE) | Assert `LEASH_COSIGNER_KEY ≠ HEDERA_OPERATOR_KEY` at startup; disclose in LIMITATIONS; Trustlessness = FALSE (never claim otherwise); separate cosigner service is roadmap | REFRAME §1; INVARIANTS #6 |
| R-22 [USER REFRAME] | No proof-of-control on the external identity — `ownerOf` is resolved, not verified | MED | MED | Identity binding is advisory only; a wrong `agentPub` is self-defeating (holder can't produce the 1-of-2 sig) | Label "on-chain-resolved" not "verified"; keep identity ADVISORY off the enforcement path (INVARIANT #13, CI module-boundary guard); signed proof-of-control = roadmap | REFRAME R1/R3; INVARIANTS #13; CLAIMS |
| R-23 [USER REFRAME] | Long-zero EVM funding of the KeyList account may fail live (a KeyList account has no key-derived EVM alias) | MED | LOW | Privy funding beat can't target the spending account | Live-verify long-zero HTS funding at the S-GATE; treasury-source fallback for the Privy DENY beat (still qualifies); `provision-canonical.ts`/`ensureCanonicalAgent` NO-TOUCH | REFRAME S1/S-GATE/R2; LIMITATIONS |

### Risk Categories Covered
- [x] Technical (R-2, R-3, R-4, R-7, R-8, R-12, R-13, R-16)
- [x] Competitive (differentiation from ChainSight - read-analyst vs our transact/getting-paid write-side; see research §13)
- [x] Time (R-9)
- [x] Demo (R-6, R-10, R-11)
- [x] Judging (R-1, honest-framing Q&A)
- [x] Scope (R-5, R-9 tripwire)

---

## 7.5 First-run experience

- **First-visit state (`/demo`):** `acme.leash.eth` + 2 child agents render immediately with live caps/allowlists read from ENS, a recent-spend feed, and a one-line explainer. No empty states, no login wall, no "connect wallet to continue".
- **Seed script:** `scripts/seed-demo.ts` (see §6 table) - creates org + 2 agents + funded treasury + associated USDC + HCS topic; idempotent.
- **10-second test:** hero line "Your ENS name is your revocable spend policy" + the split-screen resolver to 402 visual makes the concept legible in 10s.
- **30-second test:** the SPEND beat (gas-free settle + HashScan receipt) shows the core value.
- **60-second test:** the KILL beat - the visitor clicks revoke, watches the next identical call fail closed - is the try-it moment.
- **Landing/console split:** `/` landing → `/demo` (sandbox) + `/app` (real). Plain language on the surface; jargon behind `<details>`.
- **Demo-Insurance Invariant Check:** LEASH's claim is real revocation, recomputable from committed evidence. Fabricated state is FORBIDDEN outright (TASTE U7 / thesis INVARIANT). Seed state is real pre-produced txs, earned not fabricated. No precache/fallback on the revoke path.
- **Spend-feed monitoring surface (B3):** `/app` shows a LIVE per-agent + org-level spend feed indexed from HCS (name, decision, amount, reason, ts), with an agent drill-down (policy + recent ALLOW/DENY); a compact audit scroll appears in `/demo` for Scene 6. This is the "control plane the pitch implies" made visible: visitors see real decisions land, not just a single settle.
- **User co-holds their agents (C1):** in `/app`, the signed-in user's Privy embedded-wallet address holds the kill-switch role on-chain for their own agents alongside the relayer (delegated operator). The off-switch is genuinely the user's, not operator-only (INVARIANT #12) - a stronger B2B story.
- **Keys-off-host demo path (custody product):** the treasury holds signing keys and the agent signs via Privy custody. The cold-start path on the DEPLOYED `/demo` URL uses SERVER-SIDE pre-seeded keys held by the facilitator/treasury services (Render env, not the funds root), scoped + rate-limited, driving the full hero flow with NO local keys and NO visitor wallet. The funds/root key never goes on the Vercel host (R-14). `keysOffHostDemoPath` = `/demo` server-orchestrated hero flow.

## 7.6 Proof artifacts
- **Proof surface:** a `/proof` section (or README "On-Chain Verification") listing: ENS parent/org/agent names + Sepolia explorer links, the `leash.policy` record contents, the agent-identity text records (`agent.description`/`agent.type`/`avatar`/optional ERC-8004 pointer) + the agent's reverse name (D1, advisory), sample Hedera settle tx (HashScan), HCS topic id + sample ALLOW/DENY entries, Privy DENY evidence, contract/registry addresses.
- **Proof generation (build phase):** run the hero flow once, capture Sepolia tx hashes (register/setText/revoke), Hedera settle tx + HCS sequence numbers, Privy DENY response → store in `submission/proof.md`.
- **Explorer patterns:** Sepolia `https://sepolia.etherscan.io/tx/{hash}` and ENS name pages; Hedera `https://hashscan.io/testnet/transaction/{id}` and `/topic/{id}`.

---

## 8. Day-by-Day Build Plan
Hard deadline 2026-09-13 16:00 UTC. ~30h from forge. Focused build ~12-14h. Sandbox-first.

| Block | Objective | Deliverable |
|:---:|------------------|-----------  |
| B0 (0-1h) | WS-0 env + smoke tests (Privy owner-policy DENY #1, Hedera tx, Sepolia read) | `.env` green; Privy DENY proven |
| B1 (1-4h) | WS-1 ENS provisioning (the day-eater, FIRST) | mint→setText→read→revoke round-trip on Sepolia |
| B2 (4-6h) | WS-2 facilitator + ENS gate + HCS | ALLOW/DENY unit tests pass; HCS entries |
| B3 (6-7.5h) | WS-3 resource server + agent client | real paid request settles gas-free e2e |
| B4 (7.5-9h) | WS-4 Privy treasury + leaked-key DENY | policy-gated funding + DENY on camera |
| B5 (9-13h) | WS-5a GUIDED SANDBOX (first) then WS-5b real console | full hero flow drivable from `/demo`; `/app` login+multi-tenant |
| B6 (13-15h) | deploy + WS-6 demo + submission | live URLs, 2-4min video, README, 3 integrations, submit |

### Buffer + Tripwire
Honest total: the WS blocks sum to ~15h focused work with near-zero slack against a HARD 2026-09-13 16:00 UTC no-late-submission deadline (R-9). The "~12-14h" figure elsewhere is the optimistic core; plan against 15h. **Wall-clock tripwires (deterministic, not relative hours):**
- **T-4h before deadline (12:00 UTC Sep 13):** submission lockdown begins - whatever is live gets recorded + submitted. Reserve this window for video + form + buffer.
- **Real-console cutoff (~T-6h):** if the real multi-tenant path (`/app`) is not done, ship the flawless guided sandbox + a real "sign in" that demonstrably works and cut the rest.
- **ENS provisioning cutoff (WS-1, if it blows its 3h budget):** fall back to ENS+Hedera two-integration and cut Privy first.
Never let the real path endanger the sandbox.

---

## 9. Dependencies & Prerequisites

### External Services
| Service | URL | Auth | Status |
|---------|-----|:---:|---|
| Privy | dashboard.privy.io / SDK | app id+secret + P-256 owner | SET+VERIFIED (live-tested 2x) |
| Hedera testnet | portal.hedera.com / Hashio | operator key | SET+VERIFIED (1000 HBAR, chain 296) |
| Alchemy Sepolia | SEPOLIA_RPC_URL | key | SET+VERIFIED (ENSv2 bytecode reachable) |
| Neon Postgres 16 | DATABASE_URL | pooled string | SET+VERIFIED (live) |
| Render | render.com | render CLI | authed |
| Vercel | vercel.com | vercel CLI | authed (guard .env) |

### Development Tools
| Tool | Version | Purpose | Install |
|------|---------|---------|--------|
| Node | v24.10.0 | runtime | present |
| viem | ^2.56 | ENS ops | npm i |
| @x402/core, @x402/hedera, @x402/express | ~2.25 | facilitator+resource | npm i (pin) |
| @hiero-ledger/sdk / proto | 2.85.0 / 2.31.0 | Hedera (lockstep) | npm i (pin; never @hashgraph/sdk) |
| @privy-io/server-auth | ^1.32 | treasury/policy | npm i |
| @privy-io/react-auth | latest | login (real path) | npm i |
| Next.js | latest | dashboard | npm i |

### Accounts & Credentials
See `.env.example` + `.input-manifest.json` (Phase 4). All required creds SET+VERIFIED as of 2026-09-12. Human step remaining: Sepolia top-up if provisioning+relayer exceed 0.05 ETH; Privy dashboard Email/Google + allowed-origins toggle (real path only).

### On-Chain Addresses
| Item | Address | Network | Source |
|------|---------|---------|--------|
| RootRegistry | `0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c` | Sepolia | master §4.1 pinned 2026-06-29 |
| ETHRegistry | `0x67b728a792e789a8978b30cf1b3b641f19354b43` | Sepolia | master §4.1 |
| ETHRegistrar | `0xa4449a0dd2b83007553d9b1d28b583a46a805a30` | Sepolia | master §4.1 |
| PublicResolverV2 | `0xd25f66dd4ff61486c2c5c1e6201a23576698d3df` | Sepolia | master §4.1 |
| VerifiableFactory | `0x118bc31a50d559f7015a8da26d54b3b030cdb70f` | Sepolia | master §4.1 |
| Deployer (funded) | `0x72A90a712b7a668bD215B3b70B3fEaBFA40dd5C5` | Sepolia | 0.05 ETH funded 2026-09-12 |
| USDC (HTS) | generated (USDC_TOKEN_ID) | Hedera testnet | scripts/hedera mint |

(Full pinned address set - 10 ENSv2 contracts - in ARCHITECTURE.md §Addresses.)

---

## 10. Concerns Compliance

| # | Sev | Concern | How PRD Addresses It |
|---|:---:|---------|----------------------|
| 1 | C | Honest framing (never "trustless") | §1 trust-model callout; §6 voiceover; R-1; INVARIANTS |
| 2 | C | Real on-chain txs on demo path, no cache | §3 Flow 1; §6; R-6; seed = real state |
| 3 | C | ENS load-bearing via hierarchy + one-write revoke | §1, §2 diagram (3-level), §3 Flow 3; R-2 |
| 4 | C | Privy passive on funding rail, never per-tx co-signer | §1, §4 Treasury, §2 diagram; R-1 |
| 5 | C | Guided sandbox flawless, real path never endangers it | §3 Flow 1, §7.5, §8 tripwire; R-5 |
| 6 | C | Privy owner+auth-sig (raw calls fail-open) | §4 Treasury; R-3; WS-0 smoke #1 |
| 7 | C | Raw-unit BigInt cap comparison | §4 Facilitator; R-4 |
| 8 | I | ENSv2 provisioning day-eater, test first | §8 B1; R-2; PLAN WS-1 first |
| 9 | I | fundingCap pinned distinct from maxPerCall | §4 Treasury; R-3; INVARIANTS |
| 10 | I | Agent↔ENS binding anti-spoof | §4 Facilitator; R-8 |
| 11 | I | Price vs demo amounts reconciled | §6 note; R-11 |
| 12 | I | Minimum-eligible tripwire live | §8 tripwire; R-9 |
| 13 | I | Granular commits + AI attribution | §8; R-15 |
| 14 | A | A/B revoke legibility | §6 Scene 5; §7.5; R-10 |
| 15 | A | Best-UI design pass (deferred to design phase) | §7.5; handoff note |
| 16 | A | Hedera SDK lockstep pins | §9; R-7 |

All [C] concerns addressed. PRD complete.
