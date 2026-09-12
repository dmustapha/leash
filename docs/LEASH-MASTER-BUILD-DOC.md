# LEASH: Master Build Doc (ETHOnline 2026)

> Single source of truth for the full-scope build. Self-contained: an executor (the special-caveat pipeline base+overlay, subagents, or a fresh session) can build LEASH end to end from this doc without re-deriving anything. Everything here is verified against live source during pre-forge scoping. No em-dashes by house rule (colons/parentheses instead).

**Status:** winner locked (warroom V2), pre-forge scoping complete, full scope committed (no MVP-cutting; minimum-eligible fallback is a last-resort only).
**Deadline:** Sunday 2026-09-13, 12:00 PM EDT (16:00 UTC). No late submissions.
**Track:** Building from Scratch (Classic).
**Prizes targeted (max 3 selections):** ENS ENSv2 $4,500 + Hedera x402 $6,000 + Privy B2B $2,500 = $13,000 addressable.
**Builder:** solo (Dami) + Claude Code, M5 Pro Mac.

---

## 0. What LEASH is (one paragraph)
An organization runs a fleet of AI agents that spend money per call over x402. Today the only spend controls are raw keys: no scoping, no hierarchy, no org-wide off-switch. LEASH makes an org's ENSv2 name hierarchy its live, revocable spend-permission graph: each agent is a child name (`data.acme.eth`) whose resolver record encodes its spend capability (per-call cap, allowed payees, its Hedera account). A self-hosted x402 facilitator reads that record before settling each gas-free Hedera payment and refuses anything over-cap or off-allowlist. Privy holds the org treasury and policy-gates how agents get funded. Revoking the ENS record or role kills an agent's spend everywhere in one on-chain write. The name is the leash: cut it, the spending dies.

## 0.1 Thesis (identity lock, do not drift)
- WINNING ARGUMENT: LEASH turns an org's ENS name hierarchy into a live, revocable spend-permission graph for agent fleets, enforced at the payment rail, so cutting an agent off everywhere is one on-chain write.
- DEMO OBLIGATION (what a judge must witness): an agent paying within its ENS-encoded cap gas-free, the same agent's over-cap payment refused, and the org revoking the resolver record on camera so the very next payment fails closed, across a parent + 2 children.
- HERO FLOW: org mints child names with scoped caps -> agent pays a whitelisted API within cap (facilitator reads ENS, settles gas-free) -> org revokes the record -> agent's next payment fails closed everywhere.
- INVARIANTS (never violate):
  1. Enforcement is pitched as forked-facilitator + Privy, NEVER "the chain enforces it" / "trustless".
  2. ENS is load-bearing via the HIERARCHY + one-write revocation, not as a KV store.
  3. Every demo state change is a real on-chain tx (no cache on the demo path; on RPC failure the facilitator errors, never falls back to allow).
  4. Privy stays a policy engine on the treasury/funding layer, never an active per-transaction co-signer (that would collide with a forbidden prior-project shape).
- DRIFT TRIPWIRES: if "an agent that pays for things" becomes the headline instead of "revocable name-scoped spend authority", that is drift; if the pitch claims trustless/chain enforcement, that is drift and a Q&A kill.

---

## 1. Problem, users, why now
- **Problem:** teams now deploy fleets of paying agents, but spend control is a raw key per agent: no per-agent cap, no payee scoping, no hierarchy, and revocation means rotating keys across every service by hand. A leaked or rogue agent has no single, instant, org-wide off-switch.
- **Shocking number:** cutting off a leaked agent today means touching every downstream service one by one; LEASH cuts it everywhere in ONE transaction.
- **Users (real, today):** any org running more than one paying agent (AI startups, agent platforms, trading-agent operators). Decision-maker: the org treasury / platform operator who will not give autonomous agents an unbounded key.
- **Why now:** x402 agent payments are the ETHOnline thesis; ENSv2 just shipped agent-oriented primitives; Privy ships agent-wallet policies. The three compose into a control plane nobody has assembled.

## 2. Prior art + positioning (be honest in the pitch)
- Each leg exists in production: ENS-as-permission (EIP-5131/ENSIP-13 text-record auth, delete-to-revoke); facilitator policy gates (Nevermined x402 facilitator: allowlists+caps pre-settlement); agent spend controls (Privy, MetaMask Delegation Toolkit ERC-7710/7715, thirdweb Spend Mandate, Circle/Coinbase).
- The SPECIFIC interlock (ENS resolver record read by the facilitator as the live settlement policy, org naming hierarchy = one-write org-wide kill switch) = zero instances found. This is the novelty. Pitch the interlock, never "nobody has done ENS permissions / facilitator policies" (both false, a judge will catch it).
- ENS Q&A objection (their Sept-2026 agent blog): capabilities should be metadata on the name, NOT enforced at the payment layer (risks a closed system). ANSWER: LEASH does not close the ecosystem. The ENS record is public; any facilitator may honor or ignore it. The org publishes ITS OWN agents' policies as ENS metadata (ENS-endorsed) and runs ITS OWN facilitator to enforce ITS OWN treasury rules on ITS OWN fleet. That is internal treasury governance (like employee card limits), not a protocol-level gate on open commerce. Lead with this framing in README + demo.

---

## 3. Architecture (the reconciled, verified design)

### 3.1 One identity, two chains
The agent's ECDSA (secp256k1) keypair is one identity used on both chains:
- On **Ethereum Sepolia** it owns the agent's ENS child name (`data.acme.eth`).
- On **Hedera** the same key is the agent's ECDSA account (native + EVM alias), the payer.
This is what lets the facilitator bind a Hedera payer to a Sepolia ENS policy.

### 3.2 Two-layer enforcement of ONE ENS-declared policy
The ENS record is the org's single declared policy per agent. It is enforced at two independent layers:
- **Capital OUT (agent -> service):** the x402 facilitator reads the ENS policy at settlement and enforces cap + allowlist. PRIMARY, load-bearing. This is the star interlock (ENS + Hedera x402). Uses the NATIVE Hedera x402 exact scheme (gas-free: facilitator is fee-payer).
- **Capital IN (treasury -> agent):** the org treasury is a Privy server wallet on Hedera's EVM (Hashio); it funds each agent via ERC-20 USDC transfers that Privy's policy engine gates (per-agent cap + allowlisted agent addresses). Genuine second layer.

Why two layers and not one: the native Hedera payment is signed as a raw hash, which Privy's policy engine cannot inspect (it gates decodable EVM `eth_sendTransaction` calldata). So Privy cannot gate the per-payment signature; it gates the funding flow instead. Same USDC (an HTS token) is funded via the EVM facade (Privy-gated) and spent via native transfer (facilitator-gated). This is honest defense-in-depth, not redundancy.

### 3.3 Enforcement trust model (say this plainly)
Enforcement is FACILITATOR-TRUSTED, not chain-trustless: the facilitator is operator-run software (true of every x402 facilitator by design). ENS is the org-controlled source-of-truth config the facilitator reads. Never claim the chain enforces the cap.

### 3.4 Component diagram
```
                    Ethereum Sepolia (ENSv2)                         Hedera
  +-----------------------------------------+        +--------------------------------------+
  |  acme.eth (org root)                     |        |  Facilitator (self-hosted, @x402/core)|
  |   |__ UserRegistry (org subregistry)     |        |   onBeforeVerify hook:               |
  |        |__ data.acme.eth  (agent child)  |<--read--|     getEnsText(name,'leash.policy')  |
  |        |    resolver.text 'leash.policy' |  (viem  |     verify binding + cap + allowlist |
  |        |    = {maxPerCall,allowedPayees, |  eth_call)     -> abort{reason} or proceed    |
  |        |       hederaAccount, token}     |        |   settle: add feePayer sig + submit  |
  |        |__ payments.acme.eth (agent 2)   |        |   log ALLOW/DENY -> HCS topic        |
  |   EAC roles: org holds SET_RESOLVER/     |        +---------------+----------------------+
  |   SET_SUBREGISTRY; revokeRoles = kill    |                        |
  +-----------------------------------------+                        | native TransferTransaction
                                                                     | (USDC HTS, feePayer=facilitator, gas-free)
   Privy (org treasury + policy engine)                              v
  +-----------------------------------------+        +--------------------------------------+
  | Org server wallet (Hedera EVM/Hashio)   |--fund->|  Agent Hedera account (ECDSA)        |
  | policy: ERC-20 transfer cap+allowlist   | (Privy |  holds USDC (HTS); pays x402         |
  | leaked-key over-fund -> DENY            | gated) |  same ECDSA key owns the ENS name    |
  +-----------------------------------------+        +--------------------------------------+
                                                                     |
                                                      +--------------v-----------------------+
                                                      | x402-gated Resource Server (@x402/express)
                                                      |  GET /premium price $0.10 hedera:testnet |
                                                      +--------------------------------------+
```

### 3.5 End-to-end data flow (with substeps)
SETUP (org, once):
1. Register `acme.eth` 2LD on ENSv2 Sepolia (commit -> wait 60s -> reveal via ETHRegistrar; priced in MockUSDC/MockDAI, mintable, effectively free on testnet).
2. Deploy the org's own UserRegistry via VerifiableFactory; `setSubregistry` so `acme.eth` can mint children; grant self `ROLE_REGISTRAR`.
3. Create the org treasury as a Privy server wallet (owner/authorization-key model); mint the test USDC (HTS, 6 decimals) and fund treasury.
4. Per agent: Privy creates an ECDSA server wallet (the agent identity/address); org mints `data.acme.eth` (owner = agent address); `setText('leash.policy', {maxPerCall, allowedPayees, hederaAccount, token})`; set reverse record; associate the USDC token on the agent + receiver; Privy-policy-gated funding of the agent from treasury.

PAYMENT (per call):
1. Agent calls the x402-gated API (`GET /premium`).
2. Resource server returns 402 with PaymentRequirements (price, payTo, network `hedera:testnet`, `extra.feePayer` = facilitator account).
3. Agent builds a partially-signed native TransferTransaction (USDC out, `transactionId.accountId = feePayer`), signs the transfer via its ECDSA key (Privy `secp256k1Sign` on the tx hash), and retries with the `X-PAYMENT` payload + header `X-Leash-Agent: data.acme.eth`.
4. Facilitator `/verify` -> `onBeforeVerify` hook:
   a. read `X-Leash-Agent` name;
   b. `getEnsText(name, 'leash.policy')` from Sepolia (viem);
   c. verify binding: `policy.hederaAccount === decoded tx payer` (anti-spoof);
   d. enforce `amount <= maxPerCall` and `payTo in allowedPayees`, else `{abort:true, reason}`;
   e. log the decision (ALLOW/DENY) to the HCS topic.
5. On pass: facilitator verifies the payer signature (Mirror Node) + adds its feePayer signature + submits. USDC settles, agent pays no gas.
6. Resource server returns the paid data.

REVOCATION:
1. Org clears the text record (`setText('leash.policy','')`) OR `revokeRoles(tokenId, SET_RESOLVER|SET_SUBREGISTRY, agentAddr)` = one Sepolia tx.
2. Facilitator's next read (cache TTL <= 30s) sees empty policy -> aborts all that agent's payments.
3. Optional watcher syncs Privy to freeze treasury -> agent funding.

---

## 4. Verified tech stack (exact, pinned)

### 4.1 ENS (Ethereum Sepolia, ENSv2 only; v1 does NOT qualify)
- **Library:** `viem ^2.56` directly. Do NOT use `@ensdomains/ensjs` (stable 4.3.1 is v1-only; v2 is alpha `5.0.0-*`). Write a thin viem wrapper (~2h).
- **Addresses:** load at RUNTIME from `contracts-v2/deployments/sepolia/*.json`; never hard-code (two ENSv2 deployments are live simultaneously). Pin the 2026-06-29 set:
  - RootRegistry `0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c`
  - ETHRegistry `0x67b728a792e789a8978b30cf1b3b641f19354b43`
  - ETHRegistrar `0xa4449a0dd2b83007553d9b1d28b583a46a805a30`
  - PublicResolverV2 `0xd25f66dd4ff61486c2c5c1e6201a23576698d3df`
  - PermissionedResolverImpl `0x7e4b2d59938930168024201752ee5503df402303`
  - UserRegistryImpl `0x840fa461059862ea466a711e8c98c8de732061c0`
  - VerifiableFactory `0x118bc31a50d559f7015a8da26d54b3b030cdb70f`
  - UniversalResolverV2 `0x85edf8b6b7d4211e2b07aa687506b746357b92cf`
  - UpgradableUniversalResolverProxy `0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe`
  - ReverseRegistrarAdapter `0x94e64e29e25533f93ba0a430646ae42cb47bf8f3`
  - (AVOID older ETHRegistry `0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2` used by ens-cli defaults)
- **Registration payment token:** MockUSDC `0xd3322b...` / MockDAI `0xe33a...` (mintable on testnet, free).
- **ABIs (viem parseAbi):**
  - Registry: `getSubregistry(string) view returns (address)`, `register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expires) returns (uint256)`, `setResolver(uint256,address)`, `setSubregistry(uint256,address)`, `ownerOf(uint256) view returns(address)`, `grantRoles(uint256,uint256,address)`, `revokeRoles(uint256,uint256,address)`.
  - Resolver: `setText(bytes32 node,string key,string value)`, `text(bytes32 node,string key) view returns(string)`, `setAddr(bytes32,address)`, `multicall(bytes[])`.
  - Reverse adapter: `setName(string) returns(bytes32)`.
- **EAC role bitmap:** `ROLE_REGISTRAR = 1<<0`, `ROLE_UNREGISTER = 1<<12`, `ROLE_RENEW = 1<<16`, `ROLE_SET_SUBREGISTRY = 1<<20`, `ROLE_SET_RESOLVER = 1<<24`; admin variant = `role << 128`. Owner default bitmap = UNREGISTER|RENEW|SET_SUBREGISTRY|SET_RESOLVER plus their `<<128` admin bits.
- **Text key:** `leash.policy` -> JSON `{ "maxPerCall": "5000000", "allowedPayees": ["0.0.PAYEE"], "hederaAccount": "0.0.AGENT", "token": "0.0.USDC" }` (amounts in smallest unit; USDC 6 decimals).
- **Depth for the bounty (make ENS central, not a KV):** hierarchical subregistries (org = the ENS tree), EAC role grant/revoke (the kill switch), per-name Permissioned Resolver, reverse resolution. Demo the `getSubregistry` traversal + `revokeRoles`.

### 4.2 x402 + Hedera (no fork needed)
- **Base:** clone `x402-foundation/x402`, copy `examples/typescript/facilitator/basic/` as the facilitator starting point.
- **Packages (pin exact):** `@x402/core ~2.25`, `@x402/hedera 2.25`, `@x402/express ~2.25`, `@hiero-ledger/sdk 2.85.0`, `@hiero-ledger/proto 2.31.0` (lockstep). Do NOT install `@hashgraph/sdk`; import Hedera types via `@x402/hedera` re-exports.
- **Facilitator hooks:** `new x402Facilitator().registerScheme(2, ["hedera:testnet"], hederaScheme).onBeforeVerify(hook).onBeforeSettle(hook)`. Hook signature returns `void | {abort:true, reason:string}`; context carries `{payload, requirements}` (payer, amount, asset, payTo). Put the ENS gate in `onBeforeVerify` AND repeat in `onBeforeSettle` (belt and suspenders).
- **Hedera scheme wiring:** `import { ExactHederaScheme } from '@x402/hedera/exact/facilitator'`; `createHederaSignAndSubmitTransaction`, `createHederaVerifyPayerSignature`, `createHederaClient` from `@x402/hedera`.
- **Gas-free mechanism:** advertise `PaymentRequirements.extra.feePayer` = facilitator account. Agent sets `transactionId = TransactionId.generate(feePayer)`, `freezeWith(client)`, `sign(agentKey)` (transfer only). Facilitator `sign(feePayerKey)` + `execute`. Facilitator pays all network fees.
- **Token:** MINT OWN test HTS token (`TokenCreateTransaction`, 6 decimals) to avoid faucet risk; associate on payer + receiver (`TokenAssociateTransaction`) else `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT`. Canonical testnet USDC `0.0.429274` kept only as a mainnet-ready note.
- **HCS:** `TopicCreateTransaction` once; `TopicMessageSubmitTransaction().setTopicId(id).setMessage(JSON.stringify(entry))` per ALLOW and DENY.
- **Resource server:** `@x402/express` `paymentMiddlewareFromConfig({ 'GET /premium': { price:'$0.10', network:'hedera:testnet', payTo:'0.0.RECEIVER' } }, facilitatorClient)` with `HttpFacilitatorClient({url: OUR_FACILITATOR})`.
- **Networks:** testnet accounts from portal.hedera.com (1000 HBAR/24h) or faucet (100 HBAR/24h). Hedera EVM relay (Hashio) testnet: `https://testnet.hashio.io/api` (chain 296).

### 4.3 Privy (org treasury + policy)
- **Package:** `@privy-io/server-auth ^1.32`.
- **API:** `walletApi.createPolicy(...)`, `walletApi.createWallet({chainType:'ethereum', policyIds:[id]})`, `walletApi.updatePolicy(id, {rules})`, `walletApi.ethereum.sendTransaction(walletId,{caip2:'eip155:296', params:{transaction:{to,value,data,chain_id:296}}})`, fallback `walletApi.ethereum.secp256k1Sign(walletId,{params:{hash}})`.
- **Policy JSON (funding gate, cap + allowlist on the USDC ERC-20 transfer calldata):** ALLOW `eth_sendTransaction` where `ethereum_calldata transfer._to in [agentAddrs]` AND `transfer._value lte cap` (with the ERC-20 `transfer` ABI inline); plus ALLOW native `value lte 0`. Default DENY; DENY beats ALLOW.
- **Role on the payment path:** Privy gates treasury->agent FUNDING (EVM). It also holds the agent key and signs the native x402 transfer via `secp256k1Sign` (custody), but that raw-hash path is NOT policy-inspectable, which is fine (facilitator+ENS is the spend gate).
- **B2B bullet:** org server wallet + policy control + a live leaked-key over-fund DENY. Optional cheap depth: scoped signer with its own `policyIds`.
- **Decimals gotcha:** read `decimals()` off the USDC ERC-20 facade and pin the EVM address; caps are raw units (5 USDC = 5000000).

---

## 5. Workstream decomposition (for the special-caveat pipeline: BASE automated + OVERLAY supervised)
Each WS has: deliverable, key files, acceptance test, overlay note (human-check where automation is not safe).

- **WS-0 Environment & credentials (30-45m).** Deliverable: `.env` populated, Hedera accounts live, test USDC minted + associated, Privy app, Alchemy RPC, deployer funded. Acceptance: a 1-tinybar Hedera tx + a Sepolia read + a Privy wallet create all succeed. Overlay: human provides Privy/Alchemy/Hedera creds (Section 8); human runs faucet funding.
- **WS-1 ENS provisioning (2-3h, RISKIEST, do FIRST).** Deliverable: `scripts/ens/*` viem scripts (register 2LD, deploy UserRegistry, grant role, mint subname, setText policy, setName reverse, read, revoke) + a runtime address loader. Acceptance: mint `data.acme.eth`, set + read back `leash.policy`, reverse-resolve address->name, revoke -> read returns ''. Overlay: human eyeballs the first subname on a Sepolia explorer.
- **WS-2 Facilitator + ENS gate (2h).** Deliverable: `facilitator/` from x402 reference + `onBeforeVerify`/`onBeforeSettle` ENS-gate + binding check + HCS logging + native Hedera scheme + feePayer. Acceptance: unit tests for ALLOW (in-cap, allowlisted) and DENY (over-cap, off-allowlist, revoked, spoofed-binding); HCS topic shows entries.
- **WS-3 Resource server + agent client (1-1.5h).** Deliverable: `resource-server/` (x402-gated `GET /premium`) + `agent/` client (build/sign via Privy secp256k1Sign/pay with header). Acceptance: a real paid request settles e2e gas-free; over-cap request refused with reason.
- **WS-4 Privy treasury layer (1-1.5h).** Deliverable: `treasury/` org wallet + funding policy + policy-gated agent funding + leaked-key DENY demo + revoke sync. Acceptance: policy-allowed funding succeeds; over-cap/off-allowlist funding returns DENY.
- **WS-5 Dashboard (3-4h, production-grade UI).** Deliverable: `web/` Next.js app: org view (mint names, set caps/allowlists, live per-agent spend, one-click revoke), agent activity feed, live 402/settle/HCS viewer, ENS record + Sepolia links. Acceptance: full hero flow drivable from the UI; revoke reflects live. Overlay: human design pass for polish (this is where UX/WOW score comes from).
- **WS-6 Demo + submission (2h).** Deliverable: seeded demo state, rehearsed A/B revoke, 2-4min human-voice video (720p+, no AI voiceover), README (lead with honest framing + ENS objection answer), AI-ATTRIBUTION.md + spec files, granular commit history from hour 1, deployed live URL, 3 prize selections. Acceptance: submission checklist (Section 9) all green. Overlay: human records voice + final submit-button verify.

Build order: WS-0 -> WS-1 (parallelizable with WS-2 scaffolding) -> WS-2 -> WS-3 -> WS-4 -> WS-5 -> WS-6. Total ~12-14h focused.

---

## 6. Gap register (each with a fix; carried into build)
- **G1 [HIGH] ENSv2 provisioning order on alpha contracts.** Fix: tested provision script FIRST; load addresses at runtime; pin 2026-06-29 set. Most likely to eat the day.
- **G2 [resolved-by-design] Privy cannot gate native-Hedera raw-hash signing.** Fix: two-layer design (Privy gates treasury->agent funding EVM; facilitator+ENS gate agent->service spend native). No overclaim.
- **G3 [resolved] Testnet USDC faucet unreliable.** Fix: mint own 6-decimal test HTS token, associate payer+receiver.
- **G4 [low] Sepolia read latency on payment path.** Fix: dedicated Alchemy Sepolia RPC + 30s in-memory policy cache + `maxTimeoutSeconds: 180`. No cache on the demo revoke path (correctness > latency there).
- **G5 [low] SDK drift.** Fix: `@hiero-ledger/sdk 2.85.0` + `@hiero-ledger/proto 2.31.0` lockstep; import via `@x402/hedera`; never `@hashgraph/sdk`.
- **G6 [resolved] agent<->ENS binding / spoofing.** Fix: `X-Leash-Agent` header + ENS record self-attests `hederaAccount`; facilitator asserts `hederaAccount === payer`.
- **G7 [resolved-by-framing] ENS "don't enforce at payment layer" objection.** Fix: org-internal governance framing (Section 2).
- **G8 [demo-craft] negative-WOW legibility.** Fix: A/B split-screen (same $3 succeeds, then fails-closed after revoke); resolver record shown beside the live 402.
- **G9 [low] token association.** Fix: associate payer + receiver in setup.
- **G10 [scope] ~1 day solo.** Fix: build order above + minimum-eligible fallback (ENS + Hedera two-prize; Privy cut-first) as last resort ONLY (not the plan).
- **G11 [verify early] Privy `eip155:296` acceptance on sendTransaction.** Fix: smoke-test in WS-0 first 30 min; fallback = `secp256k1Sign` + self-broadcast to Hashio.

---

## 7. Demo script (3:00, substeps) + legibility technique
- **0:00-0:20 World + dashboard.** `acme.eth` with 2 child agents, each showing cap + allowlist (live ENS Sepolia). Line: "Acme runs a fleet of paying agents. Keys have no limits and no off-switch. LEASH fixes that."
- **0:20-1:00 GRANT.** Org mints `data.acme.eth` cap 5 USDC + allowlist; show the text record + EAC role on-chain. Substeps: dashboard form -> viem `register` + `setText` tx -> Sepolia explorer confirmation.
- **1:00-1:40 SPEND (gas-free).** Agent pays a whitelisted API 3 USDC. Substeps: call -> 402 -> Privy-signed transfer -> facilitator reads ENS + binding check -> settle -> HashScan receipt + HCS log line.
- **1:40-2:10 REFUSE (A/B).** Same agent tries 50 USDC -> facilitator aborts `over_cap`, shown beside the 3 USDC that just worked (split-screen: resolver record | live 402).
- **2:10-2:40 KILL (the hero moment).** Org `revokeRoles` / clears the record (one Sepolia tx). The agent's next 3 USDC (that worked 90s ago) now fails closed. Split-screen resolver <-> 402.
- **2:40-3:00 SECOND RAIL.** Leaked key tries to over-fund an agent from the treasury -> Privy policy DENY. HCS audit trail scrolls.
Rules: 720p+, human voice only (no AI voiceover/TTS), intro < 20s, real on-chain txs throughout.

---

## 8. Credentials / INPUT-MANIFEST
Stored in `/Users/MAC/ethonline-2026/.env` (chmod 600, gitignored, `git check-ignore .env` = confirmed). Toolchain: Node v24.10.0 + npm available.

**Credential status (as of 2026-09-12 verification pass):**
| Credential | Status | Verified how |
|---|---|---|
| `PRIVY_APP_ID` = `cmtxuhni102ab0dl7d9emnbv0` | SET + VERIFIED | GET /v1/wallets HTTP 200; POST /v1/wallets created a real server wallet (address returned) |
| `PRIVY_APP_SECRET` | SET + VERIFIED | authenticated Basic auth above succeeded |
| `HEDERA_OPERATOR_ID` = `0.0.10487802` | SET + VERIFIED | Mirror Node: exists, ECDSA_SECP256K1, 100000000000 tinybar (1000 HBAR), not deleted |
| `HEDERA_OPERATOR_KEY` (hex ECDSA) | SET + VERIFIED | derives EVM `0xB4f6f40d159119cceFB1E2444cb6489e2CE78070` = matches account alias exactly |
| `HEDERA_OPERATOR_EVM_ADDRESS` | SET + VERIFIED | Hashio eth_getBalance = 1000 HBAR; chainId 296 |
| `HEDERA_EVM_RPC` = `https://testnet.hashio.io/api` | SET + VERIFIED | eth_chainId returned 296 |
| `SEPOLIA_RPC_URL` (Alchemy, ghostfund app) | SET + VERIFIED | chainId 11155111, live block, ENSv2 ETHRegistry bytecode reachable (29424 chars). ALL creds now green. |

Note: the operator key was pasted in chat plaintext (testnet-only, low risk). Rotate the Privy app secret after the hackathon since it was shared in plaintext.

LEASH generates (no user action): ENS Sepolia deployer key; agent/receiver Hedera ECDSA keys; test USDC (HTS) token; the `.eth` name; funding transfers from operator.
One remaining user step after WS-0: fund the generated Sepolia deployer address with test ETH (Google/Alchemy faucet) once Leash prints it.
`.env` keys present: `PRIVY_APP_ID, PRIVY_APP_SECRET, HEDERA_OPERATOR_ID, HEDERA_OPERATOR_EVM_ADDRESS, HEDERA_OPERATOR_KEY, HEDERA_OPERATOR_KEY_DER, HEDERA_NETWORK, HEDERA_EVM_RPC, SEPOLIA_RPC_URL, LEASH_DEPLOYER_KEY (generated), USDC_TOKEN_ID (generated), HCS_TOPIC_ID (generated), ENS_PARENT_NAME=acme.eth`. Never commit `.env`.

## 8.1 Testnet allowance (CONFIRMED against live prize pages 2026-09-12)
- **ENS $4.5K: testnet REQUIRED.** "Project must be built on ENSv2 (Sepolia)... Mainnet deployment does NOT qualify, only Sepolia testnet projects are eligible." [A1]
- **Hedera $6K: testnet OR mainnet.** "Host a live x402-gated service on Hedera testnet or mainnet, settled through Blocky402." [A1] -> use testnet.
- **Privy $2.5K: chain-agnostic, no network restriction.**
Verdict: our Sepolia + Hedera-testnet design is exactly aligned; no mainnet, no real funds. Real value = our own test HTS USDC (satisfies "real paid request" without a faucet dependency).

## 8.2 Run & hosting plan
1. **One-time setup script (LOCAL):** ENS 2LD register (commit -> 60s -> reveal), deploy org subregistry, grant roles, mint test USDC (HTS), create HCS topic. Local because commit-reveal wait exceeds serverless timeouts. Writes generated IDs back to `.env`.
2. **Facilitator + resource-server (ONE Node service -> Render):** x402 facilitator + onBeforeVerify ENS gate + x402-gated demo API + HCS logging, combined. Fee-payer key via env (no disk; Render free tier OK). Public URL = the "live x402 service" Hedera requires.
3. **Dashboard (Next.js -> Vercel):** org control plane (mint names, caps/allowlists, live spend, revoke) + Privy treasury in server-side API routes + agent-payment trigger. Vercel URL = the submission "live demo" link. Guard `.env` around any vercel calls (never clobber local).
4. **Demo recording:** run the facilitator locally in parallel with the deployed one (no cold-starts/rate-limits on camera); deployed URLs satisfy the non-localhost submission requirement. Record against whichever is smoother.
Runtime ENS ops (mint subname, setText, revoke) are single fast txs -> fine in Vercel API routes. Only the commit-reveal 2LD registration must be the local setup script.

## 9. Submission requirements (ETHOnline)
- Demo video 2-4 min HARD (auto-reject outside), 720p+, human voice (no AI voiceover/TTS), intro < 20s.
- Public GitHub repo (make public early), granular commit history from hour 1 (large single commits risk DQ).
- Live demo URL (not localhost) + repo + description via Hacker Dashboard.
- Up to 3 partner prize selections: ENS + Hedera + Privy.
- AI usage documented (AI-ATTRIBUTION.md + spec files + prompts in repo).
- Feedback docs where required: none mandatory for ENS/Hedera/Privy core, but include a short FEEDBACK note per sponsor as free credibility.
- Verify the submit button actually submits (not just draft).

## 10. Prize alignment matrix (satisfy each literal bullet)
- **ENS ENSv2 $4,500:** ENSv2 on Sepolia, features central (hierarchy + EAC roles + permissioned resolver + reverse), no hard-coded values (runtime address load). Load-bearing: policy lives in the resolver; revoke = `revokeRoles`/clear record.
- **Hedera x402 $6,000:** live x402-gated service, >= 1 real paid request e2e, gas-free native scheme via self-hosted facilitator, HCS audit trail. Real value (own HTS USDC) moves on testnet, HashScan-verified.
- **Privy B2B $2,500:** org/server wallets as the treasury, policy engine control (cap + allowlist), live leaked-key DENY, a real B2B funding flow.

## 11. Honest-framing + footguns (repeat at demo-rehearsal)
- Never say "trustless" / "the chain enforces the cap". Say "the facilitator we run enforces the org's ENS-declared policy; Privy is the independent second layer on funding".
- Never claim ENSv2 fuses / one-way narrowing (EAC is reversible roles). Demo reversible role revoke.
- Never fabricate demo state; every beat is a real tx. No cache on the revoke demo path.
- Keep Privy a policy engine on funding, not a per-tx co-signer.
- Answer the ENS objection proactively in the README (Section 2).

## 12. Repo structure (proposed)
```
leash/
  contracts/            (any helper Solidity if needed; ENS is external)
  scripts/ens/          (viem provisioning: register, subregistry, roles, subname, text, reverse, revoke, address-loader)
  scripts/hedera/       (mint USDC, associate, create HCS topic, fund agents)
  facilitator/          (x402 facilitator + onBeforeVerify ENS gate + HCS logging)
  resource-server/      (x402-gated demo API)
  agent/                (agent client: Privy sign + pay)
  treasury/             (Privy org wallet + funding policy)
  web/                  (Next.js dashboard: real console + judge sandbox)
  db/                   (Postgres schema + migrations: users/orgs/agents/spend)
  relayer/              (gas sponsor: deployer pays Sepolia gas for user ENS ops)
  docs/                 (this doc, AI-ATTRIBUTION.md, spec files, README)
  .env                  (gitignored)
```

---

## 13. PRODUCT ARCHITECTURE: two-path app (real console + judge sandbox). DECISION 2026-09-12 (Dami)
This EXTENDS §5 WS-5 (the single dashboard) into a real multi-tenant product PLUS a zero-setup judge sandbox. The thesis (§0.1) is unchanged; this is scope extension, not identity drift. It strengthens all three prizes (deeper Privy via login, deeper ENS via a 3-level multi-tenant hierarchy) and matches the exemplar landing/console split. **Judge-sandbox-first sequencing is a HARD rule (§13.6).**

### 13.1 The two paths
- **Real mode (bring your own org, multi-tenant):** a user signs in, gets their own org namespace, registers THEIR agents, has THEIR own DB records, and controls them (set caps, revoke, fund). This is the actual product.
- **Judge / demo mode (sandbox):** a pre-seeded org (Acme, parent + 2 children, already funded + wired) that a judge runs with ZERO setup: no login, no wallet, no test ETH. It drives the full hero flow (grant to spend gas-free to over-cap refuse to revoke to fail-closed to Privy leaked-key DENY). This is the SCORED, must-be-flawless path.

### 13.2 Multi-tenant ENS hierarchy (deeper ENS depth)
LEASH owns the parent `leash.eth` on Sepolia. Each org is a subname (`<org>.leash.eth`); each agent is a child (`data.<org>.leash.eth`). That is a real 3-level hierarchy (parent to org to agent), stronger ENS depth than a 2-level demo. The judge sandbox uses a pre-provisioned `acme.leash.eth`. (If `leash.eth` is taken on Sepolia, pick a free 2LD, e.g. `leashorg.eth`, at WS-1.)

### 13.3 Data model + database
Postgres (Neon or Vercel Postgres). Tables: `users`, `orgs`, `agents` (ens_name, max_per_call, allowed_payees, hedera_account, status, tx refs), `spend_events` (indexed from HCS). **ENS remains the on-chain source of truth and the facilitator reads ENS LIVE at settlement, never the DB.** The DB is the queryable app/index layer (per-user views, activity feeds, metadata not on-chain). The DB is NEVER the enforcement authority (that stays ENS + facilitator, per §3.3 and the INVARIANTS).

### 13.4 Auth (real mode) = Privy embedded-wallet login
Real mode uses the Privy React SDK (`@privy-io/react-auth`) email/Google login: low friction, no MetaMask, and it DEEPENS the Privy integration (login + treasury + policy), which strengthens the $2.5K Privy prize. Judge mode bypasses auth entirely via a public `/demo` route on the pre-seeded org. (Dashboard config needed once: enable Email/Google login + add the deployed origin to allowed origins.)

### 13.5 Gas sponsorship (relayer)
Connected users have no Sepolia ETH, so LEASH sponsors their ENS ops: the deployer key acts as a relayer paying gas for a user's mint-subname / setText / revoke, SCOPED to that user's own org subname (not an open relay). This is a genuine gasless-onboarding UX win. Judge mode needs no relayer (server-side, pre-funded).

### 13.6 SEQUENCING (HARD RULE, protects the floor)
1. **Core backend + JUDGE SANDBOX first** (ENS/Hedera/Privy working + the pre-seeded Acme hero flow). This alone wins the three prizes and IS the minimum-eligible bar. It must be flawless before anything else.
2. **Real multi-tenant path second** (Privy login, per-user org namespace, DB, relayer, register/control).
3. **Best-UI polish across both** in the design phase.
Tripwire: if the multi-tenant layer is not done by the reserved cutoff, ship the flawless judge sandbox plus a real "sign in" that demonstrably works, and cut the rest. NEVER let the real-user path endanger the judge sandbox.

### 13.7 Deltas to earlier sections
- **§5 WS-5 splits:** WS-5a Judge Sandbox (pre-seeded, server-side, hero flow) FIRST; WS-5b Real Console (Privy login + multi-tenant + DB + relayer) SECOND.
- **§8 credentials add:** `DATABASE_URL` (Postgres; self-provision via Vercel if possible, else Dami provides a Neon URL in `.env`) + the Privy dashboard toggle in §13.4. Only Sepolia ETH funding is strictly human (see §8).
- **§10 prize alignment:** Privy DEEPENED (login + treasury + policy); ENS DEEPENED (3-level multi-tenant hierarchy + per-user orgs).
- **§12 repo:** adds `db/` and `relayer/` (shown above).
- **§7 demo:** the judge drives the SANDBOX (zero setup); optionally show a real login registering a new org as the "it is a real product" beat.

### 13.8 Honest-scope note
This roughly doubles the frontend + infra vs the single dashboard. Judge-sandbox-first is the discipline that keeps the scored deliverable safe if the clock runs out.
