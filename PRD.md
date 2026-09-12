# LEASH — Product Requirements Document

**Hackathon:** ETHOnline 2026
**Track:** Building from Scratch (Classic)
**Deadline:** 2026-09-13 16:00 UTC (Sun, 12:00 PM EDT) — no late submissions
**Prizes targeted (max 3):** ENS Best Use of ENSv2 $4,500 + Hedera AI & Agentic Payments (x402) $6,000 + Privy Best B2B Financial Product $2,500 = $13,000 addressable
**Version:** V1
**Source:** warroom V2 winner (WINNER-BRIEF.md) + docs/LEASH-MASTER-BUILD-DOC.md (authoritative pre-forge scope)

> The Thesis lives ONLY in `warroom/WINNER-BRIEF.md` `## Thesis`. This PRD references it; it never restates-with-modification.

---

## 1. Project Overview

### One-Liner
LEASH turns an organization's ENS name hierarchy into a live, revocable spend-permission graph for its fleet of paying AI agents — cutting off any agent everywhere is one on-chain write.

### Problem Statement
Teams now deploy fleets of AI agents that spend money per call over x402. The only spend control today is a raw private key per agent: no per-agent cap, no payee scoping, no hierarchy, and revocation means rotating keys across every downstream service by hand. A leaked or rogue agent has no single, instant, org-wide off-switch. **The shocking number: cutting off a leaked agent today means touching every downstream service one-by-one; LEASH cuts it everywhere in ONE transaction.**

### Solution
Each agent is a child ENS name (`data.acme.leash.eth`) whose resolver text record `leash.policy` encodes its spend capability: per-call cap, allowed payees, its Hedera account, and the token. A self-hosted (forked) Hedera x402 facilitator reads that record via viem `eth_call` **before settling** each gas-free payment and refuses anything over-cap or off-allowlist. Privy holds the org treasury as a policy-gated server wallet and gates how agents get funded — an independent second rail on the funding flow, never a per-transaction co-signer. Revoking the ENS text record or the EAC role kills that agent's spend everywhere in one Sepolia write. **The name is the leash: cut it, the spending dies.**

### Why This Wins
| Judging Criterion | Weight | How We Excel |
|---|:---:|---|
| Technicality | 20% | Facilitator-reads-ENS-resolver-pre-settlement is genuine protocol composition across ENSv2 (EAC roles + Permissioned Resolvers + hierarchy) and native Hedera x402 (gas-free exact scheme). Not a wrapper. |
| Originality | 20% | "Your ENS name IS your revocable spend policy" is a true didn't-know-you-could. Zero instances of the specific interlock (facilitator reads the resolver record as live settlement policy) found in prior art. |
| Practicality | 20% | Every primitive is live TODAY: ENSv2 Sepolia beta, forkable Hedera facilitator, Privy policies. Real orgs running >1 paying agent are the user. No beta gate, no Graph-on-Hedera landmine. |
| Usability | 20% | The negative-WOW (payment fails-closed after revoke) is made legible via an A/B split-screen: resolver record ↔ live 402 flipping pass→fail on camera. Zero-setup judge sandbox drives the whole flow with no login/wallet/ETH. |
| WOW Factor | 20% | One on-chain write kills an agent's spending everywhere, witnessed live: the same $3 call that worked 90 seconds ago now fails closed. |

### Prize Alignment (satisfy each literal bullet)
- **ENS ENSv2 $4,500:** ENSv2 on Sepolia central (hierarchy + EAC roles + Permissioned Resolver + reverse), no hard-coded values (runtime address load / pinned set), policy lives in the resolver, revoke = `revokeRoles`/clear-record. 3-level multi-tenant hierarchy (`leash.eth` → `<org>.leash.eth` → `data.<org>.leash.eth`) deepens ENS depth.
- **Hedera x402 $6,000:** live x402-gated service, ≥1 real paid request e2e, gas-free native scheme via self-hosted facilitator, HCS audit trail, real value (own HTS USDC) settled on testnet, HashScan-verified.
- **Privy B2B $2,500:** org/server wallets as the treasury, policy engine control (cap + allowlist on funding calldata), live leaked-key over-fund DENY, a real B2B funding flow. Deepened via Privy embedded-wallet login (email/Google) in the real multi-tenant console.

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

  Two front doors (Next.js on Vercel):
   /demo  -> JUDGE SANDBOX (pre-seeded acme.leash.eth, server-side, no login/wallet/ETH) [SCORED, first]
   /app   -> REAL CONSOLE (Privy login -> own org subname -> Postgres agents -> gas relayer) [second]
```

### Component Table
> **ENS names are runtime placeholders.** `leash.eth` / `acme.leash.eth` throughout this doc are illustrative. WS-1 resolves the actual free root 2LD FIRST (`leash.eth` or a free fallback e.g. `leashorg.eth`); every `*.leash.eth` string is runtime-substituted from `ENS_PARENT_NAME` (updated to the 3-level shape; the stale `ENS_PARENT_NAME=acme.eth` in the master doc §8 is superseded). No custom Solidity is in scope — ENS (external) + the facilitator ARE the enforcement (master §12 `contracts/` is "if needed", not needed).

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
An org mints a child ENS name for each agent and writes its `leash.policy` text record. The same ECDSA keypair owns the ENS child on Sepolia and is the agent's account on Hedera — this binding is what lets the facilitator tie a Hedera payer to a Sepolia policy. When the agent calls the x402-gated API, the resource server returns 402 with PaymentRequirements. The agent builds a partially-signed native Hedera TransferTransaction and retries with the `X-PAYMENT` payload + `X-Leash-Agent: data.acme.leash.eth`. `onBeforeVerify` runs an ADVISORY pre-screen (may use a ≤30s cache) reading the ENS record and checking `hederaAccount === payer` (anti-spoof), `amount <= maxPerCall` (BigInt), `payTo in allowedPayees`. The AUTHORITATIVE decision is made in `onBeforeSettle`: it re-reads the ENS record via viem with NO cache immediately before adding the fee-payer signature, so a revoke landing between verify and settle fails the in-flight payment closed (`REVOKED`). The gate returns a closed `{settle:true,auth} | {abort:true,reason}` decision (INVARIANTS #1/#2); ALLOW/DENY is logged to HCS; settle adds the fee-payer signature only on `{settle:true}`. Separately, the org treasury (a Privy P-256-owner server wallet) funds agents via ERC-20 USDC transfers that Privy's policy engine gates. Revocation clears the text record or revokes the EAC role in one Sepolia tx; the facilitator's next read (cache TTL ≤ 30s, and NO cache on the demo revoke path) sees empty policy and aborts all that agent's payments.

> **Enforcement trust model (say it plainly):** enforcement is FACILITATOR-TRUSTED, not chain-trustless. The facilitator is operator-run software (true of every x402 facilitator by design). ENS is the org-controlled source-of-truth config the facilitator reads. Never claim the chain enforces the cap.

---

## 3. User Flows

### Flow 1: Judge Sandbox hero flow (`/demo`, zero-setup, SCORED) — the demo path
1. Judge opens `/demo`. Pre-seeded `acme.leash.eth` with 2 child agents renders, each showing its cap + allowlist read live from ENS Sepolia. No login, no wallet, no ETH.
2. Judge (or auto-play) triggers **SPEND**: agent 1 pays a whitelisted API 3 USDC. Facilitator reads ENS + binding check → settles gas-free → HashScan receipt + HCS log line appear.
3. Judge triggers **REFUSE**: same agent tries 50 USDC → facilitator aborts `over_cap`, shown beside the 3-USDC success (A/B split-screen: resolver record | live 402).
4. Judge triggers **KILL**: org clears the record / `revokeRoles` (one real Sepolia tx). The agent's next 3-USDC call — identical to the one that worked — now fails closed. Split-screen resolver ↔ 402 flips pass→fail.
5. Judge triggers **SECOND RAIL**: a leaked key tries to over-fund an agent from the treasury → Privy policy DENY. HCS audit trail scrolls.

### Flow 2: Real console onboarding (`/app`, bring-your-own-org, multi-tenant)
1. User signs in with Privy email/Google (embedded wallet, no MetaMask).
2. LEASH provisions their org subname `<org>.leash.eth` under `leash.eth` (gas sponsored by the relayer, scoped to that subname).
3. User registers an agent: LEASH mints `data.<org>.leash.eth`, sets its `leash.policy`, records it in Postgres.
4. User sets caps/allowlists, funds the agent from the Privy treasury (policy-gated), watches live spend, and revokes with one click — all gas-sponsored.

### Flow 3: Revocation (shared mechanism, both paths)
1. Org clears the text record (`setText('leash.policy','')`) OR `revokeRoles(tokenId, SET_RESOLVER|SET_SUBREGISTRY, agentAddr)` — one Sepolia tx.
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
Facilitator -> Sepolia(viem): getEnsText(name,'leash.policy')  [onBeforeSettle: AUTHORITATIVE, NO cache — closes TOCTOU]
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
- **Interface:** scripts/functions — `register2LD`, `deployUserRegistry`, `grantRole`, `mintSubname`, `setPolicy`, `setReverse`, `readPolicy`, `revoke`, `loadAddresses`.
- **Key data structures:** `leash.policy` JSON `{ "maxPerCall": "5000000", "allowedPayees": ["0.0.PAYEE"], "hederaAccount": "0.0.AGENT", "token": "0.0.USDC" }` (amounts raw smallest-unit; USDC 6 decimals).
- **Dependencies:** viem ^2.56, Sepolia RPC, pinned ENSv2 addresses (2026-06-29 set) or runtime load from `contracts-v2/deployments/sepolia/*.json`.
- **Constraints:** commit-reveal 2LD registration needs ~60s wait → local setup script only (exceeds serverless timeouts). Runtime ops (mint subname, setText, revoke) are single fast txs → fine in Vercel API routes.

### Facilitator + ENS gate
- **Purpose:** the load-bearing spend gate. Read ENS policy pre-settlement; enforce cap + allowlist + binding; settle native Hedera gas-free; log to HCS.
- **Interface:** `new x402Facilitator().registerScheme(2,["hedera:testnet"],hederaScheme).onBeforeVerify(hook).onBeforeSettle(hook)`. SDK hook contract is `void | {abort:true, reason:string}`; context carries `{payload, requirements}`. Internally a pure `authorize(ctx): {settle:true,auth} | {abort:true,reason}` (closed union, no proceed default) drives both hooks; the adapter emits SDK-proceed only under `if(d.settle===true)`. `onBeforeVerify` = advisory pre-screen (≤30s cache); `onBeforeSettle` = authoritative no-cache read (closes TOCTOU, INVARIANTS #2).
- **Key data structures:** decoded payment `{payer, amount, asset, payTo}`; ENS policy JSON; HCS entry `{name, decision, amount, payTo, reason, ts}`.
- **Dependencies:** @x402/core ~2.25, @x402/hedera 2.25, viem, @hiero-ledger/sdk 2.85.0.
- **Constraints:** amount and maxPerCall compared as BigInt raw units. NO cache on the demo revoke path; 30s in-memory cache elsewhere; on RPC failure → error, never allow.

### Resource server
- **Purpose:** the live x402-gated service Hedera requires.
- **Interface:** `paymentMiddlewareFromConfig({ 'GET /premium': { price, network:'hedera:testnet', payTo } }, HttpFacilitatorClient({url: OUR_FACILITATOR}))`.
- **Constraints:** demo endpoint price reconciled with narrated amounts (see Risk R-11 / §6 note).

### Agent client
- **Purpose:** build + sign + pay.
- **Interface:** `pay(endpoint, agentName)` → builds native TransferTransaction, `freezeWith(client)`, signs via Privy `secp256k1Sign(hash)`, retries with `X-PAYMENT` + `X-Leash-Agent`.
- **Dependencies:** @privy-io/server-auth (custody signer), @x402/hedera.

### Treasury (Privy) layer
- **Purpose:** org treasury + funding policy + leaked-key DENY.
- **Interface:** `walletApi.createPolicy(...)`, `walletApi.createWallet({chainType:'ethereum', owner:<P-256>, policyIds:[id]})`, `walletApi.ethereum.sendTransaction(...)` with `caip2:'eip155:296'`.
- **Key data structures:** funding policy — ALLOW `eth_sendTransaction` where ERC-20 `transfer._to in [agentAddrs]` AND `transfer._value lte fundingCap`; default DENY.
- **Constraints:** wallet MUST have a P-256 owner and be driven via the SDK (raw calls fail-OPEN). `fundingCap` pinned raw units, distinct from per-call `maxPerCall`.

### Web dashboard (two paths)
- **Purpose:** `/demo` sandbox (scored) + `/app` real console (multi-tenant).
- **Interface:** server-side API routes for ENS ops, agent payment trigger, Privy treasury, sandbox orchestration.
- **Key data structures:** see §Database.
- **Constraints:** judge-sandbox path must never depend on the real-console path (§13.6).

### Database (Postgres/Neon)
- **Purpose:** app/index layer, per-user views, activity feeds, metadata not on-chain.
- **Key data structures:** `users`, `orgs`, `agents (ens_name, max_per_call, allowed_payees, hedera_account, status, tx refs)`, `spend_events (indexed from HCS)`.
- **Constraint (INVARIANT):** ENS remains the on-chain source of truth; the facilitator reads ENS LIVE at settlement, NEVER the DB. The DB is never the enforcement authority.

### Relayer
- **Purpose:** gasless onboarding — deployer key sponsors a user's ENS ops.
- **Constraint:** SCOPED to that user's own org subname (not an open relay). Judge mode needs no relayer (server-side, pre-funded).

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
- `GET /premium` — x402-gated demo endpoint (network `hedera:testnet`).

---

## 6. Demo Script

**Total Duration:** 3:00. **Format:** screen recording, human voice only (no AI voiceover/TTS), 720p+, intro <20s. Real on-chain txs throughout.

### Scene 1: World + dashboard (0:00–0:20)
**Screen:** `/demo` — `acme.leash.eth` with 2 child agents, each showing cap + allowlist (live ENS Sepolia).
**Voiceover:** "Acme runs a fleet of paying agents. Keys have no limits and no off-switch. LEASH fixes that: your ENS name is your revocable spend policy."
**Action:** dashboard renders live records.

### Scene 2: GRANT (0:20–1:00)
**Screen:** org mints `data.acme.leash.eth` cap 5 USDC + allowlist; text record + EAC role shown on-chain.
**Voiceover:** "The org mints a child name with a 5-USDC cap and an allowlist. That policy lives in the ENS resolver record."
**Action:** dashboard form → viem `register` + `setText` tx → Sepolia explorer confirmation.

### Scene 3: SPEND, gas-free (1:00–1:40)
**Screen:** agent pays a whitelisted API within cap.
**Voiceover:** "The agent pays a whitelisted API. Our facilitator reads the ENS record, checks the binding and the cap, and settles on Hedera — gas-free."
**Action:** call → 402 → Privy-signed transfer → facilitator reads ENS + binding → settle → HashScan receipt + HCS log line.

### Scene 4: REFUSE, A/B (1:40–2:10)
**Screen:** same agent tries 50 USDC → facilitator aborts `over_cap`, shown beside the amount that just worked.
**Voiceover:** "Now it tries to overspend. The facilitator refuses — over cap. Same agent, same API, blocked at the payment rail."
**Action:** split-screen: resolver record | live 402.

### Scene 5: KILL — the hero moment (2:10–2:40)
**Screen:** org `revokeRoles` / clears the record (one Sepolia tx). The agent's next in-cap call now fails closed.
**Voiceover:** "One on-chain write. The org revokes the record — and the exact call that worked ninety seconds ago now fails closed. Everywhere."
**Action:** split-screen resolver ↔ 402 flips pass→fail.

### Scene 6: SECOND RAIL + real product (2:40–3:00)
**Screen:** leaked key over-funds an agent from treasury → Privy policy DENY. HCS audit trail scrolls. Quick cut to `/app`: a real Privy email login provisioning a fresh org subname (Flow 2, "it's a real product" beat).
**Voiceover:** "The funding rail is independent: a leaked key can't over-fund an agent, Privy's policy denies it. And this isn't just a sandbox: sign in, and you get your own org namespace, gas-sponsored. Two rails, one honest control plane."
**Action:** Privy DENY + HCS log; then the real-console login + subname provision.

### Flow → Scene map (Metric 2 alignment)
| User flow (§3) | Demo scenes |
|---|---|
| Flow 1: Judge Sandbox hero flow | Scenes 1-6 (primary) |
| Flow 2: Real console onboarding | Scene 6 (real-product beat: login + subname provision) |
| Flow 3: Revocation | Scene 5 (KILL) |

> **Voice & copy compliance:** no em dashes in voiceover delivery; confident, technical, direct. Every beat is a real tx. Honest framing throughout ("the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second rail"). Never "trustless" / "the chain enforces the cap".

> **Price/amount reconciliation (R-11):** set the demo endpoint price so the narrated 3/5/50 USDC spends are literal charges against the cap (not a $0.10 flat call narrated as 3 USDC). Cap = 5 USDC; in-cap spend = 3 USDC; over-cap attempt = 50 USDC.

### Demo Prerequisites — Seed State Table
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

**Invariant:** `npx tsx scripts/seed-demo.ts` from project root produces this exact state; idempotent. This is REAL pre-produced state (real txs), not fabricated demo data — permitted by the INVARIANTS honesty rule.

---

## 7. Risk Register

| # | Risk | Severity | Likelihood | Impact | Mitigation | Decision Tree |
|---|------|----------|-----------|--------|------------|:---:|
| R-1 | Enforcement is facilitator-trusted, not chain-trustless; pitched wrong = Q&A kill | CRITICAL | MED | Prize + credibility loss | Honest dual-rail framing everywhere; on-chain cap-mirror = roadmap only | PLAN Phase 2 + demo-rehearsal |
| R-2 | ENSv2 alpha provisioning on Sepolia (commit-reveal + role bitmap) eats the day (G1) | CRITICAL | HIGH | No ENS prize, blocks all | Test provision script FIRST (WS-1 before all); pinned 2026-06-29 addrs; runtime loader | PLAN Phase 1 |
| R-3 | Privy policy fails OPEN (owner-less wallet does not enforce) | CRITICAL | HIGH (if missed) | Privy prize demo silently fails | P-256-owner wallet via @privy-io/server-auth; WS-0 smoke test #1 proves DENY before broadcast | PLAN Phase 0 |
| R-4 | Raw-unit / hex-vs-decimal cap mismatch silently mis-evaluates | CRITICAL | MED | Cap check wrong = broken headline | BigInt raw-unit comparison INVARIANT; unit tests for boundary values | PLAN Phase 2 |
| R-5 | Real-user path endangers the scored judge sandbox | CRITICAL | MED | Loses the minimum-eligible bar | Judge-sandbox-first sequencing (§13.6); tripwire cutoff; sandbox never imports real-path code | PLAN Phase 5 |
| R-6 | Fabricated/cached demo state on the revoke path | CRITICAL | LOW | Dishonest demo, invariant violation | No cache on demo revoke path; every beat a real tx; RPC-fail = error not allow | PLAN Phase 5 + demo |
| R-7 | Native Hedera gas-free settle (feePayer mechanism) not working e2e | HIGH | MED | No Hedera prize | Mint own HTS USDC; associate payer+receiver; feePayer sig by facilitator; WS-2/WS-3 e2e test | PLAN Phase 2-3 |
| R-8 | Agent↔ENS binding spoofing (attacker names someone else's record) | HIGH | MED | Bypasses the gate | `X-Leash-Agent` + record self-attests hederaAccount; facilitator asserts hederaAccount===payer | PLAN Phase 2 |
| R-9 | Feasibility: ~12-14h build on a hard deadline, near-zero buffer | HIGH | HIGH | Incomplete submission | Judge-sandbox-first; minimum-eligible tripwire (ENS+Hedera two-prize, Privy cut-first) with hour cutoff | PLAN Phase Overview |
| R-10 | Negative-WOW illegible in <3min video | HIGH | MED | Weak Usability/WOW score | A/B split-screen resolver ↔ 402; edit on camera flips pass/fail | PLAN Phase 5 + demo-rehearsal |
| R-11 | Endpoint price ($0.10) vs narrated 3/5/50 USDC mismatch | MED | MED | Confusing/dishonest demo | Set demo price so narrated amounts are literal cap charges | §6 note + demo |
| R-12 | Truncated MockUSDC/MockDAI addrs defeat self-containment | MED | MED | Setup blocks | Load from deployment JSON at runtime OR mint own; registration token only for 2LD | PLAN Phase 1 |
| R-13 | Deployer ETH runs out mid-provisioning + relayer | MED | MED | Provisioning/relayer stalls | 0.05 Sepolia ETH funded; top-up tripwire; relayer scoped | PLAN Phase 0 |
| R-14 | Vercel `.env` clobber wipes a funds-controlling key | MED | LOW | Key loss | Guard every vercel call (move .env out + restore); no scripts-only signing key on host | PLAN Phase deploy |
| R-15 | Single-commit-day DQ / missing AI attribution | MED | LOW | Submission DQ | Granular commits from hour 1; AI-ATTRIBUTION.md + spec files | PLAN all phases + package |
| R-16 | Neon free-tier / connection limits under demo load | LOW | LOW | DB hiccup | Pooled connection string (verified); DB off the enforcement path | PLAN Phase 5 |

### Risk Categories Covered
- [x] Technical (R-2, R-3, R-4, R-7, R-8, R-12, R-13, R-16)
- [x] Competitive (differentiation from ChainSight — read-analyst vs our transact/getting-paid write-side; see research §13)
- [x] Time (R-9)
- [x] Demo (R-6, R-10, R-11)
- [x] Judging (R-1, honest-framing Q&A)
- [x] Scope (R-5, R-9 tripwire)

---

## 7.5 Judge Experience

- **First-visit state (`/demo`):** `acme.leash.eth` + 2 child agents render immediately with live caps/allowlists read from ENS, a recent-spend feed, and a one-line explainer. No empty states, no login wall, no "connect wallet to continue".
- **Seed script:** `scripts/seed-demo.ts` (see §6 table) — creates org + 2 agents + funded treasury + associated USDC + HCS topic; idempotent.
- **10-second test:** hero line "Your ENS name is your revocable spend policy" + the split-screen resolver↔402 visual makes the concept legible in 10s.
- **30-second test:** the SPEND beat (gas-free settle + HashScan receipt) shows the core value.
- **60-second test:** the KILL beat — judge clicks revoke, watches the next identical call fail closed — is the try-it moment.
- **Landing/console split:** `/` landing → `/demo` (sandbox) + `/app` (real). Plain language on the surface; jargon behind `<details>`.
- **Demo-Insurance Invariant Check:** LEASH's claim is verifiable revocation. Fabricated state is FORBIDDEN outright (TASTE U7 / thesis INVARIANT). Seed state is real pre-produced txs, earned not fabricated. No precache/fallback on the revoke path.
- **Keys-off-host demo path (custody product):** the treasury holds signing keys and the agent signs via Privy custody. The cold-judge path on the DEPLOYED `/demo` URL uses SERVER-SIDE pre-seeded keys held by the facilitator/treasury services (Render env, not the funds root), scoped + rate-limited, driving the full hero flow with NO local keys and NO judge wallet. The funds/root key never goes on the Vercel host (R-14). `keysOffHostDemoPath` = `/demo` server-orchestrated hero flow.

## 7.6 Judge Proof Artifacts
- **Proof surface:** a `/proof` section (or README "On-Chain Verification") listing: ENS parent/org/agent names + Sepolia explorer links, the `leash.policy` record contents, sample Hedera settle tx (HashScan), HCS topic id + sample ALLOW/DENY entries, Privy DENY evidence, contract/registry addresses.
- **Proof generation (build phase):** run the hero flow once, capture Sepolia tx hashes (register/setText/revoke), Hedera settle tx + HCS sequence numbers, Privy DENY response → store in `submission/proof.md`.
- **Explorer patterns:** Sepolia `https://sepolia.etherscan.io/tx/{hash}` and ENS name pages; Hedera `https://hashscan.io/testnet/transaction/{id}` and `/topic/{id}`.

---

## 8. Day-by-Day Build Plan
Hard deadline 2026-09-13 16:00 UTC. ~30h from forge. Focused build ~12-14h. Judge-sandbox-first.

| Block | Objective | Deliverable |
|:---:|------------------|-----------  |
| B0 (0-1h) | WS-0 env + smoke tests (Privy owner-policy DENY #1, Hedera tx, Sepolia read) | `.env` green; Privy DENY proven |
| B1 (1-4h) | WS-1 ENS provisioning (the day-eater, FIRST) | mint→setText→read→revoke round-trip on Sepolia |
| B2 (4-6h) | WS-2 facilitator + ENS gate + HCS | ALLOW/DENY unit tests pass; HCS entries |
| B3 (6-7.5h) | WS-3 resource server + agent client | real paid request settles gas-free e2e |
| B4 (7.5-9h) | WS-4 Privy treasury + leaked-key DENY | policy-gated funding + DENY on camera |
| B5 (9-13h) | WS-5a JUDGE SANDBOX (scored, first) then WS-5b real console | full hero flow drivable from `/demo`; `/app` login+multi-tenant |
| B6 (13-15h) | deploy + WS-6 demo + submission | live URLs, 2-4min video, README, 3 prize selections, submit |

### Buffer + Tripwire
Honest total: the WS blocks sum to ~15h focused work with near-zero slack against a HARD 2026-09-13 16:00 UTC no-late-submission deadline (R-9). The "~12-14h" figure elsewhere is the optimistic core; plan against 15h. **Wall-clock tripwires (deterministic, not relative hours):**
- **T-4h before deadline (12:00 UTC Sep 13):** submission lockdown begins — whatever is live gets recorded + submitted. Reserve this window for video + form + buffer.
- **Real-console cutoff (~T-6h):** if the real multi-tenant path (`/app`) is not done, ship the flawless judge sandbox + a real "sign in" that demonstrably works and cut the rest.
- **ENS provisioning cutoff (WS-1, if it blows its 3h budget):** fall back to ENS+Hedera two-prize and cut Privy first.
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

(Full pinned address set — 10 ENSv2 contracts — in ARCHITECTURE.md §Addresses.)

---

## 10. Concerns Compliance

| # | Sev | Concern | How PRD Addresses It |
|---|:---:|---------|----------------------|
| 1 | C | Honest framing (never "trustless") | §1 trust-model callout; §6 voiceover; R-1; INVARIANTS |
| 2 | C | Real on-chain txs on demo path, no cache | §3 Flow 1; §6; R-6; seed = real state |
| 3 | C | ENS load-bearing via hierarchy + one-write revoke | §1, §2 diagram (3-level), §3 Flow 3; R-2 |
| 4 | C | Privy passive on funding rail, never per-tx co-signer | §1, §4 Treasury, §2 diagram; R-1 |
| 5 | C | Judge sandbox flawless, real path never endangers it | §3 Flow 1, §7.5, §8 tripwire; R-5 |
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
