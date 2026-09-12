# SCOPING — Leash (ETHOnline 2026 V2 winner) — pre-forge verified plan

> SUPERSEDED by `docs/LEASH-MASTER-BUILD-DOC.md` (the authoritative build doc). Retained for provenance. Name reconciled Namescope -> Leash; identifiers updated to the master doc: text key `leash.policy`, header `X-Leash-Agent`. On any conflict, the master doc wins.

One-line: an org's ENSv2 name hierarchy is its live, revocable spend-permission graph for a fleet of agents; an x402 facilitator reads each agent's ENS policy before settling a gas-free Hedera payment; Privy holds the org treasury and policy-gates how agents get funded. Editing/revoking the ENS record or role kills an agent's spend in one on-chain write.

Prizes: ENS ENSv2 $4.5K + Hedera x402 $6K + Privy B2B $2.5K = $13K. Track: Building from Scratch.

## Verified stack (real, as of scoping)
- **ENS (Sepolia, ENSv2 — v1 does NOT qualify):** `viem ^2.56` directly (NOT ensjs — v2 support is alpha). Load ENSv2 Sepolia addresses at RUNTIME from contracts-v2 deployments (two live deployments exist; pin the 2026-06-29 set; never hard-code). Core: ETHRegistry, ETHRegistrar, PublicResolverV2, PermissionedResolverImpl, UserRegistryImpl, VerifiableFactory, reverse adapter. Depth features to demo: hierarchical subregistries, Enhanced Access Control roles (grant/revoke = kill switch), permissioned resolver, reverse resolution.
- **x402 + Hedera:** NO FORK. `@x402/core ~2.25` `x402Facilitator` exposes `onBeforeVerify()`/`onBeforeSettle()` hooks returning `{abort,reason}` — the ENS gate is a ~40-line middleware. `@x402/hedera 2.25` (native exact scheme, gas-free via facilitator feePayer). `@hiero-ledger/sdk 2.85.0` + `@hiero-ledger/proto 2.31.0` (lockstep; NOT @hashgraph/sdk; import via @x402/hedera re-exports). `@x402/express` for the resource server. Run OWN facilitator (not hosted Blocky402).
- **Privy:** `@privy-io/server-auth ^1.32` org/server wallets + policy engine (cap + allowlist) + updatePolicy (revoke sync) + leaked-key DENY.

## Reconciled payment path (the critical resolution)
Native Hedera x402 scheme is REQUIRED for the $6K + gas-free (agent signs a partially-signed TransferTransaction whose transactionId.accountId = facilitator feePayer, so the facilitator pays all fees). Privy's policy engine gates EVM `eth_sendTransaction` calldata; it CANNOT gate a native-Hedera raw-hash signature. Therefore Privy does NOT gate the per-payment signature. Honest two-layer enforcement of ONE ENS-declared policy:
- **Capital OUT (agent -> service):** the x402 facilitator `onBeforeVerify` reads the ENS policy and enforces cap+allowlist at settlement. PRIMARY, load-bearing, the star interlock (ENS + Hedera).
- **Capital IN (treasury -> agent):** Privy org wallet + policy gates how much USDC the treasury releases to each agent and to which agent accounts. Genuine second layer, not redundant.
Enforcement is FACILITATOR-TRUSTED, not chain-trustless (every x402 facilitator is operator-run) — pitch honestly, never claim "the chain enforces it." ENS = org-controlled source-of-truth config the facilitator reads (ENS-endorsed framing; org governs its own fleet, not the open ecosystem).

## End-to-end data flow
SETUP (org, once): register acme.eth 2LD (ENSv2, mock-token priced) -> deploy org UserRegistry via VerifiableFactory + setSubregistry + grant ROLE_REGISTRAR -> org treasury = Privy server wallet -> per agent: Privy ECDSA wallet (agent identity, same address owns ENS name + is Hedera ECDSA account) + mint `data.acme.eth` subname with text record `leash.policy`={maxPerCall,allowedPayees,hederaAccount} + reverse record -> Privy-policy-gated funding of the agent's Hedera account -> associate USDC (test HTS token) on agent + receiver.
PAYMENT (per call): agent hits x402-gated API -> 402 PaymentRequirements (price,payTo,hedera:testnet,feePayer) -> agent builds partially-signed native TransferTransaction (USDC out, feePayer=facilitator) + `X-Leash-Agent: data.acme.eth` header -> facilitator /verify onBeforeVerify: read header name, getEnsText(name,'leash.policy') from Sepolia, verify binding (record.hederaAccount == tx payer, anti-spoof), enforce amount<=cap & payTo in allowlist else abort, log to HCS -> facilitator adds feePayer sig + submits -> USDC settles, agent paid no gas -> resource returns data.
REVOKE: org clears text record OR revokeRoles(tokenId, agentAddr) = one Sepolia tx -> facilitator next read (30s cache TTL) sees empty -> aborts all payments -> optional watcher freezes Privy funding.

## Agent<->ENS binding (anti-spoof)
Header `X-Leash-Agent` carries the claimed ENS name; the ENS record self-attests `hederaAccount`; facilitator checks record.hederaAccount == decoded tx payer. One text-record read = policy fetch + identity proof. No registry contract needed.

## GAP REGISTER (fix each)
- G1 [HIGH] ENSv2 provisioning order on alpha/non-final contracts (register 2LD -> deploy subregistry -> grant role -> mint subname). FIX: tested provision script FIRST; load all addresses at runtime; pin 2026-06-29 set. Most likely to eat the day.
- G2 [resolved-by-design] Privy can't gate native-Hedera raw-hash signing. FIX: two-layer design (Privy gates treasury->agent funding; facilitator+ENS gate agent->service spend). No overclaim.
- G3 [resolved] Testnet USDC faucet unreliable (0.0.429274 no public faucet). FIX: mint own 6-decimal test HTS stablecoin, associate to agent+receiver; keep 0.0.429274 as mainnet-ready note.
- G4 [low] Sepolia read latency on payment path. FIX: dedicated Alchemy RPC + 30s in-memory policy cache + maxTimeoutSeconds 180.
- G5 [low] SDK drift. FIX: @hiero-ledger/sdk 2.85.0 + proto 2.31.0 lockstep, import via @x402/hedera; never @hashgraph/sdk.
- G6 [resolved] binding/anti-spoof (see above).
- G7 [resolved-by-framing] ENS "don't enforce at payment layer" objection. FIX: ENS = source-of-truth config; org governs own fleet; facilitator (not ENS/chain) enforces; anyone can ignore the record.
- G8 [demo-craft] negative-WOW legibility. FIX: A/B split-screen (same $3 payment succeeds, then fails-closed after revoke); resolver record shown beside the live 402.
- G9 [low] token association (else TOKEN_NOT_ASSOCIATED). FIX: associate payer+receiver in setup.
- G10 [scope] ~1 day solo. FIX: build order below + minimum-eligible fallback (ENS+Hedera two-prize; Privy is cut-first).

## Build order (~12-14h, Claude Code)
0. (30m) Hedera testnet accounts + mint test USDC + associate; Privy signing smoke test.
1. (2-3h) ENSv2 provision script via viem (2LD+subregistry+role+subname+text+reverse) — riskiest, FIRST.
2. (2h) Facilitator from x402 reference example + onBeforeVerify ENS-gate + HCS logging + native Hedera scheme.
3. (1h) x402-gated resource server + agent client (build/sign/pay, header).
4. (1h) Privy org treasury + policy-gated agent funding + leaked-key DENY.
5. (3-4h) Next.js dashboard (mint names/set caps/live spend/revoke; agent activity; 402/settle) — production-grade UI.
6. (2h) seed data, rehearse A/B revoke, record 2-4min human-voice demo.

## Minimum eligible (if time slips)
ENS policy + facilitator gate + native Hedera gas-free payment + demo of grant->pay->over-cap-refuse->revoke->fail-closed = $6K+$4.5K coherent two-prize. Privy (treasury layer) is cut-first.

## Demo (3:00) with substeps
- 0:00-0:20 world+dashboard: acme.eth + 2 child agents with caps/allowlists (live ENS Sepolia).
- 0:20-1:00 GRANT: org mints data.acme.eth cap $5 + allowlist; show text record + EAC role on-chain (substeps: form -> viem setText/register tx -> Sepolia explorer).
- 1:00-1:40 SPEND: agent pays whitelisted API $3 gas-free (substeps: call -> 402 -> sign -> facilitator reads ENS + binding-check -> settle -> HashScan + HCS log).
- 1:40-2:10 REFUSE: same agent tries $50 -> facilitator aborts over_cap (A/B beside the $3 that worked).
- 2:10-2:40 KILL: org revokeRoles/clears record (one Sepolia tx) -> agent's next $3 fails_closed live (split-screen resolver <-> 402).
- 2:40-3:00 SECOND RAIL: leaked key tries to over-fund from treasury -> Privy policy DENY; HCS audit trail scrolls.
