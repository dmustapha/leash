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

## Known Risks (for debug)
- POLICY_RESOLVER (PermissionedResolver, DEV-008) is the enforcement read target: facilitator/ens-read.ts (Phase 2) MUST use the identical `text(namehash,'leash.policy')` primitive on POLICY_RESOLVER, or the enforcement path diverges from the proven round-trip.
- The Task 1.3 round-trip left the `data` child cleared (revoke proof); `payments` remains live (25 USDC). Phase 3/5 must (re)seed an active policy on the child the hero-path spend targets. seed-demo.ts (Task 5.1) owns this; Phase 3 VM-1 can target `payments` (live) or re-set `data`.
- DEV-009: any future direct `ownerOf(uint256)` call must version-canonicalize the id via getResource(labelhash); tokenIdOf returns the plain v0 labelhash.

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

## Failed Attempts & Resolutions
| Step | Error | Attempts | Resolution |
|------|-------|----------|------------|
| 0.2 (DP-0) | Orchestrator re-run of `npm run test:live` FAILED: `Sender account not found` during Privy pre-broadcast simulation (a `transaction_broadcast_failure`, NOT a policy `FUNDING_DENIED`). Subagent's "fund 1 HBAR first" mitigation is non-deterministic: Privy simulates before policy-eval, and Hedera account auto-creation is async and races the over-cap send. INVARIANT #5 was therefore NOT truly proven (a sim failure was mistaken for fail-closed). | 1 (initial subagent) | Re-dispatch Task 0.2 with a deterministic account-setup fix: persistent treasury wallet + poll-until-account-exists + prove BOTH in-cap SUCCESS and over-cap DENY. |

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
