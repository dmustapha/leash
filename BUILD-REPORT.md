# Build Report — LEASH (ETHOnline 2026)
Generated: 2026-09-12
Builder: hackathon-build skill (orchestrator + per-phase implementation subagents)

## Honesty Ledger (franchise skeleton, Task 0.1)
Every headline number, address, ENS name, tx hash, HCS sequence, and topic id in README/demo/submission must be RECOMPUTABLE from a committed source (INVARIANTS VERIFY-BEFORE-CLAIMING). `submission/proof.md` holds the resolvable pointer for each claim; `scripts/verify-claims.ts` re-derives headline numbers into `evidence/`. Escalate-don't-fabricate: a blocked real path is recorded BLOCKED / logged UNTESTED here, never replaced by a fabricated passing artifact.

## Summary
| Phase | Steps | Status | Notes |
|-------|-------|--------|-------|
| 0 | 0.1-0.3 | complete | Env + franchise skeleton + WS-0 smokes (DP-0, INVARIANT #5 proven) |
| 1 | 1.1-1.4 | complete | ENS provisioning: 3-level hierarchy live on Sepolia, enforcement read round-trip + revoke proven (R-2/DP-1/DP-1b resolved), DOMAIN-GUIDE |
| 2 | 2.1-2.5 | complete | Facilitator enforcement core: pure fail-closed gate (INVARIANT #1 structural), ENS read adapter (byte-identical to proven read), TOCTOU/binding/payer-sig proven (INVARIANT #2/#8), HCS ALLOW/DENY live, [SEC] greps pass. E-1 = self-hosted @x402/hedera (Blocky402-equivalent; fork source not public) |
| 3 | 3.1-3.3 | complete | Resource server + agent client; FIRST real gas-free paid request (F-001 orchestrator-verified: agent 0 HBAR gas, feePayer paid); over-cap OVER_CAP + replay REPLAY; VM-1 ENS+Hedera hero PASS (grant->spend->refuse->revoke->REVOKED, all real txs) |
| 4 | 4.1-4.2 | complete | Privy treasury second rail: REAL USDC funding (in-cap ALLOW moves real token 0.0.10496489, over-cap FUNDING_DENIED on real token, orchestrator-verified via mirror node) after fixing a phantom-token shortcut (DEV-018->019); DB index layer reaches Neon (select 1={ok:1}); [SEC] greps pass (INVARIANT #3/#5/#6). NOTE: funding recipient account != x402 payer account -> seed-demo must unify (KZ risk below) |
| 5 (5.1) | 5.1 | complete | seed-demo.ts idempotent; canonical key-alias agents (data 0.0.10499595 / payments 0.0.10499598) fix DEV-020 (one account per agent across funding+payment+ENS); orchestrator-verified (idempotent re-run, on-chain evm_address==key-EVM MATCH both, distinct 5/25 caps) |
| 5 (5.2) | 5.2 | complete | WS-5a judge sandbox /demo: 4 real beats + A/B SplitScreen (live ENS read F1); orchestrator-verified: next build PASSES (after web/tsconfig strict+ES2020 fix), INVARIANT #10 isolation 0 edges, honest-framing 0 hits, SPEND beat drove a REAL gas-free settle on canonical account |
| 5 (5.3) | 5.3 | complete | VM-2 THREE-PRIZE hero PASS (orchestrator re-ran agent/vm2.live.ts 6/6): grant->spend gas-free (0.0.10487802@1789214406, agent 0 HBAR)->refuse OVER_CAP->Privy over-fund FUNDING_DENIED (real token)->revoke (Sepolia 0x12945fe4)->REVOKED, all on canonical 0.0.10499595. WINNER-READINESS ~80 (>=70); Kill Zone 1 clear; 0 blocked |
| 5 (5.4b) | 5.4b | complete | WS-5b real console /app: Privy login surface (real SDK) + relayer-sponsored org/agent provisioning + set-cap + fund + revoke + agent-list, all real txs driven locally (org consoleco.leash.eth, agent 0.0.10500715, pay gas-free 0.0.10487802@1789215507, revoke 0x20639020). next build PASSES; isolation 0 edges; custody key stripped from responses (publicAgent). Login UNTESTED (5.4a human Privy toggle); DEV-030 new-agent funding off-allowlist (honest DENY). Task 5.4a = deploy-time human step |
| 6 (6.2) | 6.2 | complete | Build-owned proof: submission/proof.md (all 3 prize legs, resolvable pointers) + /proof judge route (next build PASSES, prerendered) + verify-claims recompute (6 claims, 0 mismatches, orchestrator re-run) + docs/pipeline/claims.json populated + honest-framing grep 0 hits on owned source. DEV-032: recompute gate caught a wrong asserted cap (2 vs on-chain 25 USDC), fixed to on-chain truth. Tasks 6.1 (deploy) + 6.3 (README/demo/video) owned by deploy/demo/package. |

## Known Risks (for debug)
- POLICY_RESOLVER (PermissionedResolver, DEV-008) is the enforcement read target: facilitator/ens-read.ts (Phase 2) MUST use the identical `text(namehash,'leash.policy')` primitive on POLICY_RESOLVER, or the enforcement path diverges from the proven round-trip.
- The Task 1.3 round-trip left the `data` child cleared (revoke proof); `payments` remains live (25 USDC). Phase 3/5 must (re)seed an active policy on the child the hero-path spend targets. seed-demo.ts (Task 5.1) owns this; Phase 3 VM-1 can target `payments` (live) or re-set `data`.
- DEV-009: any future direct `ownerOf(uint256)` call must version-canonicalize the id via getResource(labelhash); tokenIdOf returns the plain v0 labelhash.
- DEV-014 (E-1, NARRATION-CRITICAL for demo/deploy): the facilitator is a self-hosted @x402/core+@x402/hedera service (Blocky402-EQUIVALENT), NOT a literal Blocky402 fork (its app source is not public). Prize STILL QUALIFIES (live bullet = "host a live x402-gated service on Hedera"). demo (Task 6.3) + README (F2) MUST say "self-hosted @x402/hedera facilitator, Blocky402-equivalent" and NEVER "Blocky402 fork". Surfaced to Dami.
- DP-2: the real @x402 hook context is `{ paymentPayload, requirements }` (no headers, no top-level payer/amount/paymentId). payer/amount/payTo/asset are decoded from the base64 transfer; paymentId is content-derived (sha256 of tx bytes) so the INVARIANT #9 replay guard keys on content; X-Leash-Agent is threaded via AsyncLocalStorage from the express routes. wire/agent phase must send X-Leash-Agent + the transfer in this shape.
- Phase 2 tests proved the pre-submit DECISION path live; no ALLOW settle was broadcast yet (needs the Phase 3 agent + an associated payer account). Phase 3 Task 3.1 is the first real gas-free settle.
- KILL-ZONE RISK (DEV-020, HIGH, Phase 5 must-fix): the Privy funding rail credits 0.0.10499287 while the x402 payer + ENS hederaAccount is 0.0.10497601 - two different agent accounts. VM-2 (the full three-prize hero: fund -> pay -> refuse -> revoke -> DENY) requires ONE canonical agent account across the Privy funding rail, the x402 payment rail, and the ENS policy record. seed-demo.ts (Task 5.1) must establish that single account (recommend: use the key-derived ECDSA alias account as the agent identity for both rails, and set ENS hederaAccount + allowedPayees + Privy allowlist to it), then VM-2 proves fund-and-pay on the same account. Do NOT ship the demo with divergent funded/paying accounts.
- Phase 4 funding-rail real proof: in-cap real USDC transfer tx 0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749 (mirror consensus 1789211151.840320105; -5 USDC treasury 0.0.10495945 / +5 USDC recipient 0.0.10499287; token 0.0.10496489); over-cap FUNDING_DENIED (policy_violation on real token, no broadcast).

### Phase 5 on-chain proof (for submission/proof.md)
- Canonical agents (DEV-020 fixed): data 0.0.10499595 (evm 0x580d525376ea22b598c0f049086af8da3af2c31b), payments 0.0.10499598 (evm 0x078770c63c8e5e1b37e032cd1409865aca927b6c); on-chain evm_address==key-EVM (MATCH)
- WS-5a sandbox SPEND beat real settle: 0.0.10487802@1789213788.996767358 (agent 0.0.10499595 0 HBAR gas; 3 USDC -> 0.0.10497604)
- VM-2 three-prize hero (orchestrator re-ran 6/6): spend 0.0.10487802@1789214406.117245682 (gas-free); revoke Sepolia 0x12945fe4c843cf7f8f82ea1123b03a9b8739a31d2609758a51a4266ed5ffe18e; Privy over-fund FUNDING_DENIED on real token 0x...a029e9
- HUMAN STEP PENDING (Task 5.4a, deploy-time): PRIVY_DASHBOARD_LOGIN_TOGGLE - Dami must enable Email/Google login + add the deployed origin to Privy allowed origins, and set NEXT_PUBLIC_PRIVY_APP_ID, before WS-5b /app live login testing. Does NOT block the scored sandbox.
- KNOWN RISK (DEV-030, real-console only): funding a BRAND-NEW /app console agent returns FUNDING_DENIED because the Privy funding policy allowlist covers only the seeded sandbox agents (default-DENY on an off-allowlist address = correct INVARIANT #5 behavior, surfaced honestly). To ALLOW in-cap funding of a new console agent, re-provision the Privy funding policy allowlist to include the console agent address (a policy op, not a code change). The DEMO uses the sandbox (/demo, VM-2) where in-cap funding ALLOWs on the seeded agent, so this does not affect the scored path.
- WS-5b console agents hold a custody DER key in the DB index column (DEV-028, testnet) so the pay route can sign the x402 transfer; publicAgent strips it from every API response (verified: no agentKey/keyDer in any route response). Production would wrap it behind Privy custody (privyWalletId retained).

## Deviations from Architecture
Each deviation is a DEV-NNN record. Debug/wire grep `DEV-` to find all deviations.

| ID | Component | ARCHITECTURE Said | ACTUAL | Reason | Class | Downstream Impact |
|----|-----------|-------------------|--------|--------|-------|-------------------|
| DEV-001 | treasury/privy.ts createWallet | `createWallet({...} as any)` with [ASSUMED] owner shape | Removed `as any`; typed `{ chainType, owner: { publicKey }, policyIds }` compiles against installed ^1.32 | DP-0 verified the shape; strict typing enforces owner-presence at compile time | COSMETIC | none (stronger type guard) |
| DEV-002 | treasury/privy.ts createPolicy/sendTransaction/isPolicyDenial | snake_case `chain_type`/`field_source`/`default_action`, single-object `abi`, nested `sendTransaction(id,{params:{transaction}})`, string-match denial | camelCase `chainType`/`fieldSource`, no `default_action` (implicit deny), `abi` as array, flat `sendTransaction({walletId,caip2,transaction})`, `type==='policy_violation'` match | ARCHITECTURE §9 shapes are pre-^1.32; installed SDK rejects them (validation errors reproduced live) | DEGRADED | Phase-5 seed-demo funding beat inherits corrected ^1.32 shapes |
| DEV-003 | treasury/privy.live.ts (WS-0 smoke) | `npm run test -- privy`, over-cap → FUNDING_DENIED | Test named `*.live.ts`, run via `test:live` tier; funds treasury EVM account before the send (Privy simulates before policy-eval) | Without an on-chain sender account, over-cap fails simulation (`Sender account not found`), not policy; rule 24 requires live test out of default gate | DEGRADED | later Privy funding smokes must ensure treasury EVM account exists before a policy-gated send |
| DEV-004 | treasury/privy.live.ts funding amount | (n/a) | Treasury EVM funded 5 HBAR (was 1) so reused wallet retains gas across repeated in-cap broadcasts | Each in-cap control run spends gas; operator has ~991 HBAR headroom | COSMETIC | none |
| DEV-005 | treasury/privy.live.ts assertions | Prior test asserted only the over-cap DENY | Added in-cap SUCCESS control (case a) + require typed `policy_violation` for the DENY (case b) | Prior test could pass off a broken-account failure as a deny; control proves the DENY is the policy | DEGRADED | none (strengthens INVARIANT #5 proof) |
| DEV-006 | package.json setup script | `tsx scripts/setup.ts` | `tsx --env-file=.env scripts/setup.ts` (Node 24 native dotenv) | No dotenv import anywhere; every process.env.* was undefined so setup aborted immediately | COSMETIC | all tsx script runs need --env-file (or shell-sourced env) |
| DEV-007 | scripts/ens/subregistry.ts resume-check | `getSubregistry(label) != ZERO` means already-deployed | treat `existing == parentRegistry` as unset | Canonical ETHRegistry returns the registry ITSELF for a name with no custom subregistry; the guess would mint acme into the wrong registry | DEGRADED (fixed) | none |
| DEV-008 (R-2) | scripts/ens/policy.ts + revoke.ts read/write target | write leash.policy to shared PublicResolverV2 | deploy a PermissionedResolver proxy (deployer holds ROOT roles), setResolver each child to it, then setText/text there | PublicResolverV2 canModifyName -> NAME_WRAPPER.names(node) empty for self-deployed UserRegistry -> setText reverts (reproduced live); per ensdomains testNames/resolver.ts. 3-level resolved fully, NO 2-level fallback needed | DEGRADED (fixed) | facilitator/ens-read.ts MUST use identical `text(namehash,'leash.policy')` on POLICY_RESOLVER |
| DEV-009 | scripts/ens/register-2ld.ts tokenIdOf | (n/a) | tokenIdOf returns plain v0 labelhash; findOwner works, but ownerOf(uint256) needs version-canonical id (getResource(labelhash)) | ENSv2 versioning; no current code calls ownerOf | UNTESTED (no consumer) | any future direct ownerOf use must version-canonicalize the id |
| DEV-010 | facilitator/server.ts GateDecision narrowing | ARCHITECTURE §4 uses `if (d.settle === true)` | `if ('settle' in d)` discriminant | abort variant has no `settle` key -> `d.settle===true` is TS2339 under strict; `'settle' in d` narrows correctly, same INVARIANT #1 intent | COSMETIC (fixed) | none |
| DEV-011 | facilitator/hedera-scheme.ts @x402/hedera imports | `@x402/hedera/exact/facilitator` helpers + wrong ExactHederaScheme ctor | corrected to pinned real @x402/hedera API (package-root factories + `new ExactHederaScheme(signer)`) | ARCHITECTURE imported nonexistent subpath helpers | DEGRADED (fixed) | none |
| DEV-012 | vitest.config.ts | (n/a) | exclude vendored contracts-v2/** from the TS unit gate | its hardhat suite polluted the unit tier | COSMETIC | none |
| DEV-013 | integration/live tests env load | (n/a) | tests use `import 'dotenv/config'` not --env-file | vitest rejects --env-file (project convention from privy.live.ts) | COSMETIC | none |
| DEV-014 (E-1) | facilitator lineage | critique E-1: FORK Blocky402, insert ENS gate via onBeforeSettle | self-hosted @x402/core+@x402/hedera facilitator (Blocky402-equivalent) with the official onBeforeVerify/onBeforeSettle hooks; ENS gate in onBeforeSettle pre-settlement | Blocky402 app source (blockydevs/blocky402) is not public/forkable; x402-foundation/x402 is the SDK+reference facilitator, not the app. Live prize bullet = "host a live x402-gated service on Hedera" so self-hosted x402 QUALIFIES; fork was a legibility bonus not a gate | DEGRADED | demo/README (F2, Task 6.3) must say "self-hosted @x402/hedera facilitator, Blocky402-equivalent" NOT "Blocky402 fork" |
| DEV-015 | facilitator/hedera-scheme.ts client | createHederaClient given HEDERA_EVM_RPC as consensus-node arg | use default testnet consensus network (drop the EVM RPC url) | EVM JSON-RPC url is not a consensus node; caused `failed to parse address` on settle submit | UNTESTED (fixed, real settle now works) | none |
| DEV-016 | resource-server + agent x402 API/header shapes | ARCHITECTURE pre-install snapshot: X-PAYMENT header, sha384 signable-hash, lowercase httpFacilitatorClient, $-string price, client forwards arbitrary headers | PAYMENT-SIGNATURE header (v2); @x402/hedera createClientHederaSigner builds the signable hash; HTTPFacilitatorClient (from @x402/core/server); raw-unit AssetAmount price; X-Leash-Agent threaded resource->facilitator via createAuthHeaders+AsyncLocalStorage (client does not forward arbitrary headers); client setSpendControls(false) (LEASH enforcement is the facilitator ENS gate) | DP-3 resolution: real @x402/hedera API vs the assumed shapes | DEGRADED (fixed) | wire/agent must use PAYMENT-SIGNATURE header + X-Leash-Agent via auth headers; payload is {transaction: base64} ExactHederaPayloadV2 |
| DEV-017 | Phase 3 account provisioning | seed placed policy.hederaAccount/allowedPayees/feePayer all on the operator | provisioned distinct agent 0.0.10497601 + receiver 0.0.10497604 (ECDSA, USDC-associated, agent funded); rebound hero policy on data child; feePayer stays operator | gas-free (F-001) is unprovable when agent==feePayer | DEGRADED | seed-demo.ts (Task 5.1) must (re)create these distinct accounts + bind the hero policy to them |
| DEV-018 | treasury funding rail token (SUPERSEDED by DEV-019) | (n/a) | funding rail temporarily pointed at phantom token 0.0.999999 to sidestep an INVALID_ALIAS_KEY precheck-revert | Privy simulates before policy-eval; real-token transfer precheck-reverted without HTS association | DEGRADED (superseded) | removed in DEV-019 |
| DEV-019 (supersedes DEV-018) | treasury/privy funding rail | phantom 0.0.999999 facade | funding rail operates on REAL USDC 0.0.10496489 (0x...a029e9); treasury Privy wallet 0.0.10495945 auto-associates (max_automatic_token_associations=-1), so operator->treasury transfer funded it; Privy value policy then honestly decides ALLOW (real transfer) vs DENY (real token calldata) | phantom made both ALLOW and DENY hollow; real fix moves real USDC | DEGRADED (resolved) | none for Privy prize; see funding/payer account coherence (DEV-020) |
| DEV-020 | funding recipient vs x402 payer account | (n/a) | funding rail credited 0.0.10499287 (key-derived EVM alias of SANDBOX_AGENT_EVM 0x875426a5...), NOT the x402 payer / ENS-bound account 0.0.10497601 (EVM 0x00...a02e41) | Phase 3 stored the key-derived EVM as SANDBOX_AGENT_EVM but created the account via AccountCreate (canonical 0x000...num EVM), so a transfer to the key-EVM auto-created a new alias account | DEGRADED | seed-demo.ts (Task 5.1) MUST use ONE canonical agent account for BOTH rails + the ENS hederaAccount so VM-2's three-prize hero funds-and-pays the same account |

## Failed Attempts & Resolutions
| Step | Error | Attempts | Resolution |
|------|-------|----------|------------|
| 0.2 (DP-0) | Orchestrator re-run of `npm run test:live` FAILED: `Sender account not found` during Privy pre-broadcast simulation (a `transaction_broadcast_failure`, NOT a policy `FUNDING_DENIED`). Subagent's "fund 1 HBAR first" mitigation is non-deterministic: Privy simulates before policy-eval, and Hedera account auto-creation is async and races the over-cap send. INVARIANT #5 was therefore NOT truly proven (a sim failure was mistaken for fail-closed). | 1 (initial subagent) | Re-dispatch Task 0.2 with a deterministic account-setup fix: persistent treasury wallet + poll-until-account-exists + prove BOTH in-cap SUCCESS and over-cap DENY. |
| 4.1 (DEV-018) | Orchestrator inspection: the funding rail was pointed at facade token 0.0.999999 (0x...0f423f), a PHANTOM token. In-cap "ALLOW" tx 0x3af85ec4 went to 0.0.999999 (SUCCESS but moved no real USDC); over-cap DENY was evaluated against the phantom, not the real USDC 0.0.10496489. Root cause: Privy simulates before policy-eval; a transfer of the REAL token precheck-reverts INVALID_ALIAS_KEY because treasury/agent are not HTS-associated with 0.0.10496489, so the phantom was used to sidestep association. Not acceptable: Privy B2B needs a functional treasury operation on the real asset; hollow demo state forbidden. | 1 (Phase 4 subagent) | Re-dispatch: HTS-associate treasury + agent with real 0.0.10496489, fund treasury with real USDC, gate real transfers via Privy policy (in-cap ALLOW moves real USDC, over-cap DENY on the real token). Honest fallback if alias/HTS-via-Privy intractable: DENY on the real-token calldata + documented limitation, never the phantom. |

## Verification Results
| Phase | Command | Expected | Actual | Pass? |
|-------|---------|----------|--------|-------|
| 0 | `npm run typecheck` (orchestrator re-run) | tsc exits 0 | EXIT=0, tsc --noEmit clean | YES |
| 0 | SOURCE LOCK `npm ls` (all pins) | exact pins | @x402/core 2.25.0, @x402/hedera 2.25.0, @x402/express 2.25.0, @hiero-ledger/sdk 2.85.0, @hiero-ledger/proto 2.31.0, @privy-io/server-auth 1.32.5, viem 2.56.0 | YES |
| 0 (DP-0) | `npm run test:live` (orchestrator re-run x2, deterministic) | in-cap SUCCESS + over-cap FUNDING_DENIED | 2/2 pass: (a) in-cap ALLOW txHash 0x93e068bc..., (b) over-cap FUNDING_DENIED via typed policy_violation (HTTP 400), no broadcast; wallet 0.0.10495945 reused across runs | YES |
| 0 | Hedera 1-tinybar self-transfer (orchestrator re-run) | SUCCESS | HEDERA_STATUS=SUCCESS | YES |
| 0 | `cast code 0x67b7..4b43` Sepolia (orchestrator re-run) | non-empty bytecode | 0x608060405234801561000f575f80fd5b506004... | YES |
| 0 | `npm run check` (default gate) | offline+integration only, live excluded | EXIT=0; unit+integration "No test files found"; live tier NOT run | YES |
| 0 (compliance) | grep INVARIANT #5/#6 on funding rail | 0 secp256k1Sign; createPolicy present; owner mandatory; DENY only from caught policy_violation | 0 secp256k1Sign hits; createPolicy+policyIds present; owner:{publicKey} mandatory; FUNDING_DENIED only via isPolicyDenial catch | YES |
| 1 (DP-1/DP-1b) | `cast interface` on ETHRegistrar + UserRegistry (real alpha ABIs) | real makeCommitment/register + setSubregistry/grantRoles/register sigs | introspected from cloned contracts-v2; scripts carry real sigs (register-2ld.ts:29-30, subregistry.ts:27-28, subname.ts:15) | YES |
| 1 | `npm run setup` (real on-chain provisioning) | setup complete with ids | root leash.eth, org acme.leash.eth, SANDBOX_REGISTRY 0xB45830...A679, USDC 0.0.10496489, HCS 0.0.10496492; ids appended to .env | YES |
| 1 (Task 1.3, orchestrator re-run) | readPolicy(payments) + readPolicy(data after revoke) | payments live JSON; data null | payments={"maxPerCall":"25000000",...}; data=null | YES |
| 1 (F-013) | parent + >=2 children distinct caps | acme + data(5 USDC) + payments(25 USDC) | confirmed on-chain; distinct maxPerCall 5000000 vs 25000000 | YES |
| 1 | 3 spot-check Sepolia receipts (register root/acme, setText data) | status=1 | all status=1 (success) | YES |
| 1 (Task 1.4) | DOMAIN-GUIDE.md non-empty + leash.policy>=1 | non-empty, >=1 | 18842 bytes, leash.policy x10 | YES |
| 2.1 (orchestrator re-run) | `npm run test -- authorize` + typecheck + structural fail-closed | 22 pass; tsc EXIT 0; never-check fires on missing branch | 22/22; EXIT 0; removing a GateReason case -> TS2345 not assignable to never (restored) | YES |
| 2.2-2.5 (orchestrator re-run) | [SEC] greps #3/#4/#6a/#6b | 0/0/0/>=1 | facilitator DB 0; trustless 0; secp256k1Sign 0; treasury createPolicy/policyIds 4 | YES |
| 2 (orchestrator re-run) | `npm run test:integration -- toctou` (INVARIANT #2/#8) | BINDING_MISMATCH + bad-sig gate + TOCTOU REVOKED no-submit | 3/3 pass; mid-flight clearPolicy then no-cache read REVOKED, submitCalled=false | YES |
| 2 (orchestrator re-run) | mirror-node HCS topic 0.0.10496492 | ALLOW + DENY entries | seq1 ALLOW 3 USDC; seq2 DENY OVER_CAP 50 USDC; seq5 DENY OFF_ALLOWLIST (decoded live) | YES |
| 2 | ens-read byte-identical to scripts/ens/policy.ts | identical read primitive | subagent-verified BYTE-IDENTICAL true (payments live, data null) via both readPolicyNoCache + readPolicy | YES |
| 3 (F-001, orchestrator re-run) | mirror-node fee breakdown of settle tx 0.0.10487802-1789205977-654877070 | agent 0 HBAR gas; feePayer pays | result SUCCESS; charged_tx_fee 1475816 paid by 0.0.10487802; agent 0.0.10497601 ZERO HBAR debit, only -3 USDC; receiver +3 USDC | YES |
| 3 (VM-1 revoke, orchestrator re-run) | Sepolia clearPolicy tx 0xfba1b729... status | status=1 | status=1 (success); revoke->REVOKED mechanism also proven in Phase 1 (null round-trip) + Phase 2 (TOCTOU) | YES |
| 3 (orchestrator re-run) | offline gate typecheck+unit | tsc 0; 26/26 | typecheck EXIT=0; 26/26 unit | YES |
| 3 (subagent, in-flight) | over-cap + replay | OVER_CAP no settle; REPLAY no 2nd settle | verify invalidReason OVER_CAP (402, no tx); replay errorReason REPLAY (402, no 2nd settle) | YES |

## UI Coverage Checklists
(one table per frontend phase; union check at build completion)

## Known Risks (for debug)

## Contract Addresses
| Contract | Network | Address | Tx Hash |
|----------|---------|---------|---------|
| org-parent registry (UserRegistry proxy) | Sepolia | 0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409 | 0x58781dea4d3b20593115a76f8e613a1064ccd5a8a06ffab2875f3e63ac5f8d60 |
| SANDBOX_REGISTRY (acme child registry) | Sepolia | 0xB45830aeaf0A00367A450635a110cffA6878A679 | 0x3d9340a3119c76f6b386bfd31f635688fde9a9f46801cf488c5985d40a46114f |
| POLICY_RESOLVER (PermissionedResolver, R-2 fix) | Sepolia | 0xdC460cd7151D679CF5D1e34595e1ac890A5E4978 | 0x0e095feb1a51b7122aa1d559a6a7d1c9414c4a4cba337ad31a143c4e586a544a |
| USDC (own 6-dec HTS) | Hedera testnet | 0.0.10496489 (EVM 0x00...a029e9) | mint id 0.0.10496489 |
| HCS audit topic | Hedera testnet | 0.0.10496492 | topic-create 0.0.10496492 |

### Phase 1 on-chain proof (for submission/proof.md at Task 6.2) — all Sepolia status=1
- register(root leash): commit 0xf90767de..., register 0x32d3d92e8ef4f2cedcee87350fcbe48821ff8f4546cee7a6cf589cf1f539ac97
- setSubregistry(leash->org-parent): 0x735efca36285573a227a755cb44c1e155db2f72c4b928db638a7991609c2bc6d
- register(acme): 0x81a9f22d0892cce21871e2531a12d093ec4f4f257107e120d4ca992f885fa293
- setSubregistry(acme->sandbox): 0x7b57f60bdcb9b9c9b3bd5b73b6208f93153e535e9f56821cc1c82e0840ad7def
- register(data): 0x28113edcc070c9ce58aeaa7f6c44b7e1089f7b1890aab3a71fed384bac133126; register(payments): 0xc9a05c18e50e08ea5c7756d07b3fefc22ace59ad7b7f4b8ee3b9bee3ce3654c8
- setText(data, leash.policy): 0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa; setText(payments): 0x56acc82516b36bff5b26630fdd4425a3e3d75644a11abbd60afd7ee20d3398f0
- clearPolicy/revoke(data): 0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293

### Phase 2 on-chain proof (for submission/proof.md at Task 6.2)
- HCS topic 0.0.10496492: ALLOW seq #1 (consensus 1789203671.484621104), DENY/OVER_CAP seq #2 (consensus 1789203673.299244979)
- TOCTOU mid-flight clearPolicy (Sepolia POLICY_RESOLVER 0xdC460cd7...): 0xbfb1be7b1827d3502628e65a2e9f01643af97c86eea3829022b9931a6bdcea10
- (no ALLOW settle tx yet: pre-submit decision path proven; first real gas-free settle is Phase 3 Task 3.1)

### Phase 3 on-chain proof (for submission/proof.md at Task 6.2)
- Distinct accounts (gas-free provable): agent 0.0.10497601 (payer, EVM 0x875426a5...), receiver 0.0.10497604 (payTo, EVM 0x654e89f7...), feePayer 0.0.10487802 (operator)
- In-cap gas-free settle: Hedera tx 0.0.10487802@1789205977.654877070 -> https://hashscan.io/testnet/transaction/0.0.10487802-1789205977-654877070 (mirror: charged_tx_fee 1475816 paid by feePayer, agent 0 HBAR, 3 USDC agent->receiver)
- VM-1 spend settle: 0.0.10487802@1789206294.372982756
- Hero policy rebind (Sepolia data child): 0x950ecd1ec279f8b38748281c7db5a96c5dd42b1a224e7159a0efa1c42e615ba7
- VM-1 revoke (Sepolia clearPolicy): 0xfba1b729cc807ed17f584f4dbb93c7286867698285a754a10c5ffaf43c11e635 -> post-revoke settle reason REVOKED

## Environment Variables Added
| Key | Source Step | Value/Description |
|-----|-----------|-------------------|
| TREASURY_OWNER_PUBKEY | 0.2 | P-256 SPKI-DER base64 public key (Privy wallet owner) |
| PRIVY_AUTHORIZATION_KEY | 0.2 | `wallet-auth:` + PKCS8-DER base64 P-256 private key (drives owned wallet) |
| TREASURY_WALLET_ID | 0.2 (fix) | Persistent Privy treasury walletId (create-or-reuse; removes DENY-test race) |
| TREASURY_EVM_ADDRESS | 0.2 (fix) | Treasury wallet EVM address (0.0.10495945 on chain-296) |
| ENS_ROOT_NAME / SANDBOX_ORG_NAME | 1.2 | leash.eth / acme.leash.eth |
| SANDBOX_ORG_PARENT_REGISTRY / SANDBOX_REGISTRY | 1.2 | 0xb36e0ede... / 0xB45830ae... |
| POLICY_RESOLVER | 1.3 | 0xdC460cd7... PermissionedResolver (R-2 fix; enforcement read target) |
| USDC_TOKEN_ID / USDC_EVM_ADDRESS | 1.2 | 0.0.10496489 / 0x00...a029e9 (own 6-dec HTS) |
| HCS_TOPIC_ID | 1.2 | 0.0.10496492 (audit topic) |
| SANDBOX_AGENT_ACCOUNT / SANDBOX_AGENT_EVM / SANDBOX_AGENT_KEY | 3.1 | 0.0.10497601 / 0x875426a5... / ECDSA key (secret) |
| RECEIVER_ACCOUNT_ID / RECEIVER_EVM / RECEIVER_KEY | 3.1 | 0.0.10497604 / 0x654e89f7... / key (secret) |
| FACILITATOR_URL / RESOURCE_PORT | 3.1 | http://localhost:8401 / 8402 |
