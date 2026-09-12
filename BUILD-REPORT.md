# Build Report — LEASH (ETHOnline 2026)
Generated: 2026-09-12
Builder: hackathon-build skill (orchestrator + per-phase implementation subagents)

## Honesty Ledger (franchise skeleton, Task 0.1)
Every headline number, address, ENS name, tx hash, HCS sequence, and topic id in README/demo/submission must be RECOMPUTABLE from a committed source (INVARIANTS VERIFY-BEFORE-CLAIMING). `submission/proof.md` holds the resolvable pointer for each claim; `scripts/verify-claims.ts` re-derives headline numbers into `evidence/`. Escalate-don't-fabricate: a blocked real path is recorded BLOCKED / logged UNTESTED here, never replaced by a fabricated passing artifact.

## Summary
| Phase | Steps | Status | Notes |
|-------|-------|--------|-------|
| 0 | 0.1-0.3 | in-progress | Env + franchise skeleton + WS-0 smokes (DP-0) |

## Deviations from Architecture
Each deviation is a DEV-NNN record. Debug/wire grep `DEV-` to find all deviations.

| ID | Component | ARCHITECTURE Said | ACTUAL | Reason | Class | Downstream Impact |
|----|-----------|-------------------|--------|--------|-------|-------------------|
| DEV-001 | treasury/privy.ts createWallet | `createWallet({...} as any)` with [ASSUMED] owner shape | Removed `as any`; typed `{ chainType, owner: { publicKey }, policyIds }` compiles against installed ^1.32 | DP-0 verified the shape; strict typing enforces owner-presence at compile time | COSMETIC | none (stronger type guard) |
| DEV-002 | treasury/privy.ts createPolicy/sendTransaction/isPolicyDenial | snake_case `chain_type`/`field_source`/`default_action`, single-object `abi`, nested `sendTransaction(id,{params:{transaction}})`, string-match denial | camelCase `chainType`/`fieldSource`, no `default_action` (implicit deny), `abi` as array, flat `sendTransaction({walletId,caip2,transaction})`, `type==='policy_violation'` match | ARCHITECTURE §9 shapes are pre-^1.32; installed SDK rejects them (validation errors reproduced live) | DEGRADED | Phase-5 seed-demo funding beat inherits corrected ^1.32 shapes |
| DEV-003 | treasury/privy.live.ts (WS-0 smoke) | `npm run test -- privy`, over-cap → FUNDING_DENIED | Test named `*.live.ts`, run via `test:live` tier; funds treasury EVM account before the send (Privy simulates before policy-eval) | Without an on-chain sender account, over-cap fails simulation (`Sender account not found`), not policy; rule 24 requires live test out of default gate | DEGRADED | later Privy funding smokes must ensure treasury EVM account exists before a policy-gated send |
| DEV-004 | treasury/privy.live.ts funding amount | (n/a) | Treasury EVM funded 5 HBAR (was 1) so reused wallet retains gas across repeated in-cap broadcasts | Each in-cap control run spends gas; operator has ~991 HBAR headroom | COSMETIC | none |
| DEV-005 | treasury/privy.live.ts assertions | Prior test asserted only the over-cap DENY | Added in-cap SUCCESS control (case a) + require typed `policy_violation` for the DENY (case b) | Prior test could pass off a broken-account failure as a deny; control proves the DENY is the policy | DEGRADED | none (strengthens INVARIANT #5 proof) |

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

## UI Coverage Checklists
(one table per frontend phase; union check at build completion)

## Known Risks (for debug)

## Contract Addresses
| Contract | Network | Address | Tx Hash |
|----------|---------|---------|---------|

## Environment Variables Added
| Key | Source Step | Value/Description |
|-----|-----------|-------------------|
| TREASURY_OWNER_PUBKEY | 0.2 | P-256 SPKI-DER base64 public key (Privy wallet owner) |
| PRIVY_AUTHORIZATION_KEY | 0.2 | `wallet-auth:` + PKCS8-DER base64 P-256 private key (drives owned wallet) |
| TREASURY_WALLET_ID | 0.2 (fix) | Persistent Privy treasury walletId (create-or-reuse; removes DENY-test race) |
| TREASURY_EVM_ADDRESS | 0.2 (fix) | Treasury wallet EVM address (0.0.10495945 on chain-296) |
