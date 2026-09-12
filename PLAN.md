# LEASH — Implementation Plan

**Project:** LEASH
**Hackathon:** ETHOnline 2026 — Building from Scratch
**Deadline:** 2026-09-13 16:00 UTC (HARD, no late submissions)
**Stack:** TypeScript · Next.js · @x402 · @hiero-ledger/sdk · @privy-io/server-auth · viem · Postgres
**Architecture Doc:** `ARCHITECTURE.md` (THE source of truth for all code — copy exactly)
**Law:** `INVARIANTS.md` (non-negotiable; the build agent reads it as law)

---

## How to Use This Plan
1. Read in order. Do not skip phases or reorder tasks. Wall-clock tripwires (PRD §8) govern cuts, not feature-dropping.
2. Every phase has a GATE checklist — verify every item before proceeding.
3. At 🔀 decision points, run the command, then follow the branch that matches the output.
4. Copy code from ARCHITECTURE.md — do not improvise. Where a block is `[ASSUMED]`/`[UNVERIFIED]`, resolve its Build-Resolve Seam (DP-0..DP-4) BEFORE it becomes load-bearing.
5. Commit after every task with the specified message (granular history from hour 1 — ETHGlobal DQs single-commit days, R-15).
6. Save deployed addresses/ids to `.env` immediately (setup.ts appends them).
7. If something fails and no decision tree covers it: STOP, record BLOCKED in BUILD-REPORT.md, escalate per INVARIANTS ESCALATE law. Never fabricate/mock a P0 or a [SEC] invariant.
8. VERIFY-MILESTONE tasks are mandatory and cannot be skipped.
9. `scripts/seed-demo.ts` must be implemented before any demo phase; run it before every E2E take.
10. No `forge snapshot` task — there is no custom Solidity (ADR-008).

---

## Mandatory Tasks (injected by forge)

### Franchise skeleton at C0 (Phase 0, Task 0.1)
Create at the very first build phase: `CLAIMS.md` (headline-claims ledger), `scripts/verify-claims.ts` (recompute verifier — already specified in ARCHITECTURE §13), `SECURITY.md` (from ARCHITECTURE "Security spec" section), and an honesty ledger stub in `BUILD-REPORT.md`.

### seed-demo.ts (Phase 5, Task 5.1)
Implement `scripts/seed-demo.ts` from PRD §6 Demo Prerequisites + ARCHITECTURE §13. Idempotent; run before every E2E test and demo take.

### verify-milestone checkpoints
- **VM-1** at end of Phase 3 (~50%): the three-prize hero path works e2e (grant→spend→refuse→revoke) in the sandbox.
- **VM-2** at end of Phase 5a (pre-real-console): WINNER-READINESS ≥ 70; Kill Zone 1 (demo flow) clear; ≤1 blocked integration.

---

## Phase Overview
| Phase | Purpose | Est. | Depends on |
|:--:|---|---|---|
| 0 | Env + creds + franchise skeleton + WS-0 smokes (DP-0) | 1.0h | — |
| 1 | ENS provisioning (WS-1, day-eater; DP-1) + DOMAIN-GUIDE | 3.0h | 0 |
| 2 | Facilitator + ENS gate + HCS (WS-2; DP-2, DP-4) | 2.5h | 1 |
| 3 | Resource server + agent client, real paid request (WS-3; DP-3) + VM-1 | 1.5h | 2 |
| 4 | Privy treasury + leaked-key DENY (WS-4) | 1.5h | 0,2 |
| 5 | WS-5a judge sandbox (scored, first) + seed + VM-2, then WS-5b real console | 4.0h | 1-4 |
| 6 | Deploy + proof + demo + submission (WS-6) | 1.5h | 5 |

**Honest critical path (solo builder — "parallel group A" is NOT real for one person):** the path is strictly serial 0→1→2→3, so the P1 hero (VM-1) is not provable before ~8h wall-clock (0:1h + 1:3h + 2:2.5h + 3:1.5h), and Phase 1 (ENSv2 alpha, the day-eater, R-2) is the dominant variance — its 3h is optimistic if DP-1/DP-1b ABIs are wrong. Sum ≈ 15.0h focused vs ≈ 30h wall-clock, but the buffer is only real if ENS does not slip. **Clock-based Phase-1 tripwire (deterministic, not phase-completion):** compute `deadline - 16h` at build start; if ENS is not round-tripping (Task 1.3) by that absolute UTC time, invoke the Task 1.3 ⛔ 2-level fallback immediately, and if not by `deadline - 13h`, cut to the ENS+Hedera two-prize path. This ties Phase-1 slip to the overall clock so a solo builder cannot silently burn 6h "still in Phase 1." Metric 7: 15h ≤ 30h, but planned against the serial floor, not comfortable slack.

---

## Phase 0: Environment, Credentials, Franchise Skeleton, Smokes
**Purpose:** prove every credential live, scaffold the honesty machine, and de-risk the Privy fail-open invariant FIRST. **Est. 1.0h.**

### Task 0.1: Scaffold repo + franchise skeleton
**Files (from ARCHITECTURE §14 + §13):**
- Create `package.json`, `tsconfig.json` (copy ARCHITECTURE §14).
- Create `CLAIMS.md`, `SECURITY.md` (from ARCHITECTURE "Security spec" threat matrix + "Not defended against"), `BUILD-REPORT.md` (honesty ledger stub).
- Create `scripts/verify-claims.ts` (copy ARCHITECTURE §13).
- Create `types/index.ts` (copy ARCHITECTURE §3).

**Steps:**
1. `npm install`
   Expected: `added N packages` with no peer-dep errors.
2. `npm run typecheck`
   Expected: `tsc` exits 0 (types/index.ts compiles).

**Commit:** `git add -A && git commit -m "chore(scaffold): package, tsconfig, types, franchise skeleton (CLAIMS/SECURITY/verify-claims)"`

### Task 0.2: 🔀 DP-0 — Privy owner-policy DENY smoke (WS-0 smoke #1, R-3, INVARIANT #5)
**Files:** create `treasury/privy.ts` (copy ARCHITECTURE §9); create `treasury/privy.test.ts`.

**Steps:**
1. Generate a P-256 owner keypair (Privy docs `controls/authorization-keys`).
2. `npm run test -- privy`
   Expected: an over-`fundingCap` transfer from the OWNED wallet returns `FUNDING_DENIED` BEFORE broadcast.

#### 🔀 Decision Point DP-0: Privy owner arg shape + policy enforcement
Run: `npm run test -- privy`
Expected: `FUNDING_DENIED` on the over-cap case; funded on the in-cap case.

✅ **If DENY fires before broadcast:** INVARIANT #5 proven. Record the exact `createWallet` owner arg name in ARCHITECTURE §9 + INVARIANTS SOURCE LOCK. Continue.

🔀 **If the over-cap tx reaches broadcast (fails open):**
1. Confirm the wallet was created WITH the owner (not owner-less) — inspect the createWallet response.
2. Check the `createWallet` owner argument name/casing against `@privy-io/server-auth` ^1.32 types (`node_modules/@privy-io/server-auth`); fix `owner: {...}` shape in `treasury/privy.ts`.
3. Ensure requests carry the `privy-authorization-signature` (the SDK computes it when the owner key is provided to the client).
4. Re-run.

⛔ **If no owner shape enforces after 2 attempts:**
1. STOP — do not ship an owner-less wallet (INVARIANT #5, fail-open catastrophe).
2. Record BLOCKED in BUILD-REPORT.md; escalate to Dami inline.
3. Tripwire: if unresolved at the WS-4 cutoff, cut the Privy prize (ENS+Hedera two-prize path), do NOT ship a fake DENY.

**Commit:** `git commit -am "feat(treasury): Privy P-256-owner wallet + funding policy; WS-0 DENY smoke proven (DP-0)"`

### Task 0.3: Hedera + Sepolia smokes
**Files:** create `scripts/hedera/client.ts`, `scripts/ens/client.ts`, `scripts/ens/addresses.ts` (copy ARCHITECTURE §5/§6).

**Steps:**
1. Hedera smoke (actually invoke + await a 1-tinybar self-transfer):
   `npx tsx -e "import('./scripts/hedera/client.ts').then(async m=>{const {TransferTransaction,AccountId,Hbar}=await import('@hiero-ledger/sdk');const c=m.hederaClient();const id=AccountId.fromString(process.env.HEDERA_OPERATOR_ID);const r=await new TransferTransaction().addHbarTransfer(id,new Hbar(-0.00000001)).addHbarTransfer(id,new Hbar(0.00000001)).execute(c);console.log((await r.getReceipt(c)).status.toString())})"`
   Expected: `SUCCESS`.
2. Sepolia read smoke: `cast code 0x67b728a792e789a8978b30cf1b3b641f19354b43 --rpc-url $SEPOLIA_RPC_URL | head -c 20`
   Expected: non-empty bytecode (`0x60806040...`).

**Commit:** `git commit -am "chore(env): Hedera + Sepolia live smokes pass (WS-0)"`

### Phase 0 Gate
- [ ] `npm run typecheck` exits 0
- [ ] DP-0: Privy over-cap → `FUNDING_DENIED` before broadcast (or BLOCKED+escalated)
- [ ] Hedera 1-tinybar tx SUCCESS; Sepolia ETHRegistry bytecode non-empty
- [ ] CLAIMS.md, SECURITY.md, verify-claims.ts, types/index.ts committed
**If any fails: do not proceed.**

---

## Phase 1: ENS Provisioning (WS-1 — the day-eater, START HERE in wall-clock)
**Purpose:** the naming hierarchy + policy records + kill switch. **Est. 3.0h.**

### Task 1.1: 🔀 DP-1 — ENS registrar ABI + tokenId scheme
**Files:** create `scripts/ens/register-2ld.ts`, `subregistry.ts`, `subname.ts`, `policy.ts`, `roles.ts`, `reverse.ts`, `revoke.ts` (copy ARCHITECTURE §5).

#### 🔀 Decision Point DP-1: Confirm the deployed ETHRegistrar ABI + tokenId derivation
Run: `cast interface 0xa4449a0dd2b83007553d9b1d28b583a46a805a30 --rpc-url $SEPOLIA_RPC_URL` (or clone `contracts-v2` and read `deployments/sepolia/*.json`).
Expected: the real `makeCommitment`/`register` signatures + the registry's tokenId keying.

✅ **If the ABI matches ARCHITECTURE's placeholder:** proceed unchanged.

🔀 **If the signatures differ (likely — placeholder is a guess):**
1. `git clone https://github.com/ensdomains/ensv2 contracts-v2` (or the alpha repo); read `deployments/sepolia/*.json` + the registrar ABI.
2. Replace the `registrarAbi` in `register-2ld.ts` with the real ABI; adjust `makeCommitment`/`register` args (historically include `secret,resolver,data,reverseRecord,fuses`).
3. Confirm whether the registry keys tokenId by `uint256(namehash(name))` or `uint256(labelhash)`; fix `tokenIdOf` accordingly.
4. Re-run Task 1.2.

⛔ **If provisioning cannot be made to work after 90 min:**
1. Fall back to the pinned addresses with the simplest working name shape you can register.
2. If still blocked at the 3h WS-1 cutoff: record BLOCKED; the minimum-eligible tripwire keeps ENS if ANY name+record+revoke round-trips, else escalate.

#### 🔀 Decision Point DP-1b: Confirm the UserRegistry ABIs (subregistry + subname) — a SECOND alpha ABI surface
Run: `cast interface $UserRegistryImpl --rpc-url $SEPOLIA_RPC_URL` (0x840fa461…) for the `deploy`/`setSubregistry`/`grantRoles`/`register` signatures used by `subregistry.ts` + `subname.ts`.
Expected: signatures match ARCHITECTURE §5.

✅ **If they match:** proceed to Task 1.2.

🔀 **If the UserRegistry `register(string,address,address,address,uint256,uint64)` / `setSubregistry` / `grantRoles` differ:**
1. From the cloned `contracts-v2` (DP-1), read `UserRegistry`'s real ABI + role-bitmap semantics.
2. Fix the ABIs in `subregistry.ts` + `subname.ts`; confirm the grant target (parent vs child tokenId) for `ROLE_REGISTRAR`.
3. Re-run before Task 1.2 (setup depends on these).

⛔ **If UserRegistry provisioning cannot be made to work:** fall into the Task 1.3 ⛔ 2-level fallback (mint children directly under the org name without a self-deployed subregistry if the registrar allows it).

**Commit:** `git commit -am "feat(ens): provisioning scripts; DP-1 registrar + DP-1b UserRegistry ABIs confirmed"`

### Task 1.2: Register + provision the sandbox hierarchy
**Files:** create `scripts/setup.ts` (copy ARCHITECTURE §13).
**Steps:**
1. `npm run setup`  (LOCAL — 60s commit-reveal wait; appends ids to `.env`)
   Expected: `setup complete: { root, org, registry, tokenId, evmAddress, topic }`.
2. Verify org subname registered: `cast call $SANDBOX_REGISTRY "ownerOf(uint256)" <tokenId> --rpc-url $SEPOLIA_RPC_URL`
   Expected: the deployer address.

**Commit:** `git commit -am "feat(ens): register root+org hierarchy, deploy subregistry, mint USDC, create HCS topic"`

### Task 1.3: 🔀 PRD-W5 — 3-level policy round-trip via the enforcement read path
**Steps:**
1. Mint `data.<org>` + setText, then read back via `scripts/ens/policy.ts readPolicy` (same `namehash`+`text` primitives as `facilitator/ens-read.ts`).
   Command: `npx tsx -e "import('./scripts/ens/policy.ts').then(m=>m.readPolicy(process.env.SANDBOX_ORG_NAME.replace(/^/,'data.')).then(console.log))"`
   Expected: the `leash.policy` JSON.
2. Clear the record (`revoke.ts clearPolicy`); read again.
   Expected: `null`.

#### 🔀 Decision Point: 3-level getEnsText resolves (R-2, PRD-W5)
✅ **If read returns the policy then null after revoke:** the enforcement read path works on a 3-level name. Continue.

🔀 **If read returns empty on a set record (traversal fails on ENSv2 alpha):**
1. Confirm `UniversalResolverV2` vs `PublicResolverV2` is the correct read target for a name in a self-deployed UserRegistry.
2. Try reading directly off the org registry's resolver instead of the universal resolver; update `ens-read.ts` + `policy.ts` to the working path (keep them identical).
3. Re-run.

⛔ **If 3-level resolution cannot be made to work:**
1. Fall back to a 2-level shape (`data.<root>.eth`) that resolves, updating the seed + names (still parent + ≥2 children for ENS depth).
2. Record the deviation in BUILD-REPORT.md + PULSE.

**Commit:** `git commit -am "test(ens): 3-level leash.policy round-trip + revoke verified (PRD-W5)"`

### Task 1.4: Generate DOMAIN-GUIDE.md (forge→build #18)
**Files:** create `DOMAIN-GUIDE.md` from ARCHITECTURE §N+1 spec (concepts, rules=INVARIANTS verbatim, glossary, source mapping).
**Steps:**
1. Write `DOMAIN-GUIDE.md` transcribing the 20 concepts + glossary from ARCHITECTURE §N+1 and the 10 NON-NEGOTIABLES verbatim from INVARIANTS.md.
2. Verify: `test -s DOMAIN-GUIDE.md && grep -c "leash.policy" DOMAIN-GUIDE.md` → non-empty, ≥1.
**Commit:** `git commit -am "docs(domain): DOMAIN-GUIDE.md from ARCHITECTURE N+1"`

### Phase 1 Gate
- [ ] DP-1 resolved: real registrar ABI + tokenId scheme confirmed
- [ ] `npm run setup` completes; ids in `.env`
- [ ] mint→setText→read→revoke→read(null) round-trips on the enforcement read path (Task 1.3)
- [ ] DOMAIN-GUIDE.md committed
**If any fails: do not proceed (ENS is the load-bearing interlock).**

---

## Phase 2: Facilitator + ENS Gate + HCS (WS-2)
**Purpose:** the enforcement core. Pure logic FIRST (risk-first), then I/O adapters. **Est. 2.5h.**

### Task 2.1: authorize.ts + exhaustive tests (pure, zero infra)
**Files:** create `facilitator/authorize.ts` (copy ARCHITECTURE §4); create `facilitator/authorize.test.ts`.
**Steps:**
1. `npm run test -- authorize`
   Expected: all 7 GateReason branches + settle happy path + boundary (`amount==cap` settle, `+1n` OVER_CAP) + malformed → MALFORMED_POLICY pass.
2. `npm run typecheck`
   Expected: exits 0 (the `_assertNever` exhaustiveness holds).

#### 🔀 Decision Point: fail-closed structure (R-6, INVARIANT #1)
Run: remove one `case` from `_exhaustive` switch and `npm run typecheck`.
✅ **If tsc now ERRORS (never-check fires):** structural fail-closed proven. Restore the case.
🔀 **If tsc passes with a missing case:** the union/never wiring is wrong — fix `GateDecision`/`_assertNever` so an unhandled reason is a compile error. Re-run.

**Commit:** `git commit -am "feat(facilitator): pure authorize() gate + exhaustive tests (INVARIANT #1 structural)"`

### Task 2.2: 🔀 DP-2 — ENS read adapter + hook context wiring
**Files:** create `facilitator/ens-read.ts`, `hcs-log.ts`, `hedera-scheme.ts`, `server.ts` (copy ARCHITECTURE §4).
**Steps:**
1. `npm run facilitator` (starts the service).
2. Inspect the real `@x402/core` hook context in a log line on first request.

#### 🔀 Decision Point DP-2: hook context field names + paymentId
✅ **If `payload.paymentId`, `payload.payer`, `payload.amount`, `requirements.payTo/asset` exist:** proceed.
🔀 **If `paymentId` is absent:** derive it facilitator-side from the txBytes hash (same content-derivation as `agent/pay.ts`), so the replay guard (INVARIANT #9) still keys on content. Update `toCtx`.
🔀 **If field names differ:** fix `toCtx` in `server.ts` to the real shape; re-run.

**Commit:** `git commit -am "feat(facilitator): ENS read adapter + hooks (verify advisory, settle authoritative no-cache); DP-2 context confirmed"`

### Task 2.3: 🔀 DP-4 — payer-signature gates settle (R-8, INVARIANT #8) + TOCTOU in-flight (INVARIANT #2)
**Steps:**
1. Send a payment whose payer ≠ record.hederaAccount.
   Expected: `BINDING_MISMATCH`.
2. Send a payment with an invalid payer signature.
   Expected: rejected before settle.
3. TOCTOU in-flight test (INVARIANT #2, R-6): stub `onBeforeVerify` to return ALLOW, then `clearPolicy` the agent on-chain BEFORE the settle step runs; trigger settle.
   Command: `npm run test -- toctou`
   Expected: the `onBeforeSettle` no-cache read re-fetches live and returns `REVOKED`; NO Hedera submit occurs.

#### 🔀 Decision Point DP-4: does the scheme's verifyPayerSignature gate settle?
✅ **If a bad payer-sig is rejected before settle:** binding fully enforced.
🔀 **If a bad payer-sig still settles:** add an explicit `createHederaVerifyPayerSignature` call in `onBeforeSettle` before `authorize`, aborting on failure. Re-run.

**Commit:** `git commit -am "test(facilitator): binding + payer-sig gate settle (DP-4, INVARIANT #8)"`

### Task 2.4: HCS ALLOW/DENY logging
**Steps:** trigger one ALLOW + one DENY; check the topic.
Command: `curl "https://testnet.mirrornode.hedera.com/api/v1/topics/$HCS_TOPIC_ID/messages" | head`
Expected: two entries with `decision` ALLOW and DENY.
**Commit:** `git commit -am "feat(facilitator): HCS audit logging for ALLOW/DENY"`

### Task 2.5: [SEC] structural grep gates (INVARIANT #3 + #6)
**Steps:**
1. INVARIANT #3 (DB never on the enforcement path):
   `grep -rnE "db/|drizzle|DATABASE_URL|pg" facilitator/`
   Expected: 0 hits.
2. INVARIANT #6 (Privy not a payment co-signer; funding-policy present):
   `grep -rn "secp256k1Sign" facilitator/` → 0 hits (payment custody sign lives in `agent/`, not the facilitator gate);
   `grep -rn "createPolicy\|policyIds" treasury/privy.ts` → ≥1 (funding policy present).
**Commit:** `git commit -am "test(sec): grep gates for INVARIANT #3 (no DB on enforcement) + #6 (rail separation)"`

### Phase 2 Gate
- [ ] authorize tests: all 7 reasons + boundary + malformed pass
- [ ] tsc never-check fires on a missing branch (structural fail-closed)
- [ ] DP-2 hook context confirmed; paymentId content-keyed
- [ ] DP-4 binding + payer-sig gate settle; TOCTOU in-flight → REVOKED, no submit (Task 2.3 step 3)
- [ ] INVARIANT #3 grep (facilitator imports no DB): 0 hits; #6 rail-separation greps pass (Task 2.5)
- [ ] HCS shows ALLOW + DENY entries
**If any fails: do not proceed.**

---

## Phase 3: Resource Server + Agent Client — real paid request (WS-3)
**Purpose:** ≥1 real gas-free paid request e2e. **Est. 1.5h.**

### Task 3.1: 🔀 DP-3 — resource server + agent pay (signable hash + price format)
**Files:** create `resource-server/server.ts`, `agent/pay.ts` (copy ARCHITECTURE §7/§8).
**Steps:**
1. `npm run resource` (starts the x402-gated endpoint).
2. Run an in-cap payment via `agent/pay.ts` (amount 3 USDC).

#### 🔀 Decision Point DP-3: signable hash + @x402/express price format
Run: the in-cap `pay()` call.
✅ **If the payment settles gas-free (HashScan receipt; agent paid no gas):** DP-3 resolved.
🔀 **If the payer signature is rejected:** the signable-hash preimage is wrong — use `@x402/hedera`'s sign helper to build the exact hash instead of the sha384 placeholder; re-run.
🔀 **If the endpoint rejects the price/config:** switch `PREMIUM_PRICE` format ($-string vs raw) to what `@x402/express` parses; re-run.

**Commit:** `git commit -am "feat(resource,agent): real gas-free paid request e2e (DP-3)"`

### Task 3.2: Over-cap refusal + replay (#9) + per-component tests
**Steps:**
1. Run an over-cap (50 USDC) payment.
   Expected: 402 with reason `OVER_CAP`; HashScan shows NO settle.
2. INVARIANT #9 replay integration: re-submit the EXACT settled in-cap `X-PAYMENT` payload from Task 3.1.
   Command: replay the captured payload against `/premium`.
   Expected: `REPLAY` (or Hedera `DUPLICATE_TRANSACTION`); HashScan shows no second settle.
**Commit:** `git commit -am "test(agent): over-cap refused (OVER_CAP) + replay rejected (REPLAY, INVARIANT #9)"`

### Task 3.3: VERIFY-MILESTONE VM-1 (mandatory) — ENS+Hedera hero path
**Steps:**
1. Run the ENS+Hedera hero path in the sandbox: grant (Phase 1) → spend (3.1) → refuse (3.2) → revoke (`revoke.ts`) → next in-cap call fails `REVOKED`.
2. Record results in BUILD-REPORT.md.
**Gate (cannot skip):**
- [ ] grant→spend→refuse→revoke→fail-closed all pass with real txs
- [ ] Kill Zone 1 (demo flow) not triggered
**Note:** VM-1 is the TWO-prize (ENS+Hedera) milestone. The third prize (Privy leaked-key DENY) wires in at Phase 4 and is proven in VM-2 (the full three-prize hero). DP-0 already proved the Privy DENY mechanism at WS-0.
**If gate fails:** STOP, log to BUILD-REPORT.md, return BLOCKED.
**Commit:** `git commit -am "test(e2e): VM-1 ENS+Hedera hero path proven end-to-end"`

### Phase 3 Gate
- [ ] In-cap payment settles gas-free (HashScan receipt)
- [ ] Over-cap → OVER_CAP, no settle
- [ ] Replay → REPLAY, no second settle (Task 3.2 step 2)
- [ ] VM-1 hero path green
**If any fails: do not proceed.**

---

## Phase 4: Privy Treasury Layer (WS-4)
**Purpose:** the second rail + the on-camera leaked-key DENY. **Est. 1.5h.** (DP-0 already proved the mechanism at WS-0.)

### Task 4.1: Policy-gated funding + leaked-key DENY beat
**Files:** confirm `treasury/privy.ts` (from Phase 0); wire `web/app/api/fund/route.ts` (copy ARCHITECTURE §12).
**Steps:**
1. Fund an agent within `fundingCap` → success (tx hash).
2. Over-fund (> `fundingCap`) → `FUNDING_DENIED`.
**Commit:** `git commit -am "feat(treasury): policy-gated funding + leaked-key over-fund DENY beat"`

### Task 4.2: DB index layer + revoke→status sync
**Files:** create `db/schema.ts` AND `db/client.ts` (copy ARCHITECTURE §10) — both here so the DB client exists before any route writes to it (dependency order).
**Steps:**
1. `npx tsx -e "import('./db/client.ts').then(async m=>{const r=await m.db.execute('select 1 as ok');console.log(r.rows?.[0]??r)})"`
   Expected: `{ ok: 1 }` (Neon reachable).
2. On revoke, mark the agent `status='revoked'` in `agents` (used by `web/app/api/revoke/route.ts`).
**Commit:** `git commit -am "feat(db): index layer schema + client; revoke syncs agent status (never enforcement)"`

### Phase 4 Gate
- [ ] In-cap funding succeeds; over-cap funding returns FUNDING_DENIED
- [ ] No `secp256k1Sign` self-broadcast on the funding rail (grep: 0 hits) — INVARIANT #5/D-10
**If any fails: do not proceed.**

---

## Phase 5: Judge Sandbox (WS-5a, scored, FIRST) then Real Console (WS-5b)
**Purpose:** the scored zero-setup hero flow, then the real multi-tenant product. **Est. 4.0h.**

### Task 5.1: seed-demo.ts (mandatory injected task)
**Files:** create `scripts/seed-demo.ts` (copy ARCHITECTURE §13).
**Steps:**
1. `npm run seed`
   Expected: sandbox org + 2 agents + funded treasury + associated USDC + HCS topic present.
2. Re-run `npm run seed` — idempotent, no errors.
**Gate:** idempotent, exits 0.
**Commit:** `git commit -am "seed(demo): seed-demo.ts from PRD §6 (idempotent, real state)"`

### Task 5.2: WS-5a — judge sandbox UI + orchestration
**Files:** create `web/app/layout.tsx`, `page.tsx`, `demo/page.tsx`, `web/app/api/demo/route.ts`, `web/app/api/policy/[name]/route.ts`, `web/components/SplitScreen.tsx`, `web/components/AgentCard.tsx`, `web/lib/config.ts` (copy ARCHITECTURE §12).
**Steps:**
1. `npm run dev` → open `/demo`.
2. Drive all four beats (spend/refuse/revoke/deny) from the UI.
Expected: each beat produces a real tx; the SplitScreen flips pass→fail on revoke.

#### 🔀 Decision Point: sandbox isolation (R-5, INVARIANT #10)
Run: `grep -rn "app/app" web/app/demo web/app/api/demo` (should be empty).
✅ **If no import edge to `/app`:** isolation holds.
🔀 **If `/demo` imports `/app` modules:** refactor shared code into `web/lib` or duplicate; the sandbox must run with `/app` disabled.

**Commit:** `git commit -am "feat(web): WS-5a judge sandbox — hero flow drivable from /demo (INVARIANT #10)"`

### Task 5.3: VERIFY-MILESTONE VM-2 (mandatory) — full THREE-prize hero
**Gate (cannot skip):**
- [ ] Full three-prize hero drivable from `/demo`: grant → spend (gas-free) → refuse → revoke (fail-closed) → **Privy leaked-key over-fund DENY** (all four beats, all real txs)
- [ ] WINNER-READINESS ≥ 70 (run hackathon-verify milestone mode)
- [ ] Kill Zone 1 clear; ≤1 blocked integration
- [ ] the A/B SplitScreen revoke is legible (R-10) — resolver record ↔ 402 flip visible
**If gate fails:** STOP, do not start WS-5b, return BLOCKED.
**Commit:** `git commit -am "test: VM-2 full three-prize hero + winner-readiness >= 70"`

### Task 5.4a: HUMAN STEP — Privy dashboard toggle (surface to Dami, not a build commit)
Enable Email/Google login + add the deployed origin to allowed origins in the Privy dashboard. This is a human dashboard action (no code, no commit); build surfaces it to Dami and waits for confirmation before Task 5.4b login testing. Real-path only — does NOT block the scored sandbox.

### Task 5.4b: WS-5b — real console (Privy login + multi-tenant + relayer)
**Files:** create `web/app/app/page.tsx`, `web/app/api/agents/route.ts`, `web/app/api/revoke/route.ts`, `web/app/api/pay/route.ts`, `db/index-hcs.ts`, `relayer/relay.ts` (copy ARCHITECTURE §10/§11/§12). (`db/client.ts` already created in Task 4.2.)
**Steps:**
1. `npm run dev` → `/app` → sign in → provision org subname (relayer-sponsored) → register an agent → set cap → fund → revoke.
   Expected: each step returns a tx hash; the agent appears in the DB and on-chain.
**Tripwire (PRD §8):** if WS-5b is not done by the real-console cutoff (~T-6h), ship the sandbox + a working sign-in and cut the rest. Never endanger WS-5a.
**Commit:** `git commit -am "feat(web): WS-5b real console — Privy login + multi-tenant + gas relayer"`

### Phase 5 Gate
- [ ] `/demo` drives the full hero flow with real txs (WS-5a)
- [ ] VM-2 ≥ 70; A/B revoke legible
- [ ] `/app` sign-in works (WS-5b or the tripwire fallback)
**If WS-5a fails: BLOCKED. WS-5b may be cut per tripwire.**

---

## Phase 6: Deploy + Proof + Demo + Submission (WS-6)
**Purpose:** live URLs, proof artifacts, video, submission. **Est. 1.5h.** *(Owned deliverables route to other skills — see Skill-Ownership Map.)*

### Task 6.1: 🔀 R-14 — deploy (guard .env)
**Steps:**
1. Move `.env` out before any vercel call; deploy facilitator+resource → Render; dashboard → Vercel; restore `.env`.
2. `npm run verify:claims` → `evidence/claims-recomputed.json`.

#### 🔀 Decision Point R-14: Vercel .env clobber
✅ **If `.env` intact after deploy (`git check-ignore .env` + key present):** continue.
🔀 **If `.env` was modified:** restore from backup immediately; verify `LEASH_DEPLOYER_KEY` present; never let a scripts-only key live on the host.

**Commit:** `git commit -am "chore(deploy): facilitator+resource on Render, dashboard on Vercel; claims recomputed"`
**owner:** deploy-to-github @ deploy

### Task 6.2: Proof + submission artifacts + honest-framing grep (INVARIANT #4)
**Files:** create `submission/proof.md`; add `/proof` route to `web/app/`.
**Steps:**
1. Run the hero once; capture Sepolia tx hashes (register/setText/revoke), Hedera settle tx + HCS seq, Privy DENY response; write them into `submission/proof.md`.
2. `npm run verify:claims` → `evidence/claims-recomputed.json`; diff recomputed vs `submission/proof.md` claims.
   Expected: match (VERIFY-BEFORE-CLAIMING).
3. INVARIANT #4 honest-framing grep: `grep -rniE "trustless|chain[ -]enforce" README.md web/ docs/ submission/`
   Expected: 0 hits on the enforcement claim.
**Commit:** `git commit -am "docs(proof): submission/proof.md + /proof route + honest-framing grep (INVARIANT #4)"`
**owner:** hackathon-build @ build (`/proof` route + proof capture + verify-claims). The README on-chain-verification section and the README/narration copy the #4 grep guards are owned by **deploy-to-github @ deploy** (README) and **hackathon-demo @ demo** (voiceover) — build produces the proof data + runs the grep; deploy/demo own the copy that must pass it.

### Task 6.3: Demo video + README + package
Routed — see Skill-Ownership Map. Record human-voice 2-4min (R-1 honest framing rehearsed; R-11 price/amount reconciled).
**owner:** hackathon-demo @ demo / deploy-to-github @ deploy / hackathon-package @ package

### Phase 6 Gate
- [ ] Live `/demo` + `/app` URLs reachable (non-localhost)
- [ ] `submission/proof.md` complete; claims recomputed
- [ ] 3 prize selections (ENS + Hedera + Privy); AI-ATTRIBUTION.md present
- [ ] demo video 2-4min human-voice; no "trustless" claim anywhere
**If any fails: do not submit.**

---

## Decision Tree Coverage (Metric 3)
CRITICAL+HIGH risks = 10 (R-1..R-10). Command-with-branches decision trees + mandatory gates:
| Risk | Where covered | Type |
|---|---|---|
| R-1 honest framing | Task 6.2 step 3 grep (INVARIANT #4) + Phase 6 gate + demo-rehearsal | grep gate |
| R-2 ENSv2 provisioning | DP-1 (Task 1.1) + DP-1b (Task 1.1) + Task 1.3 tree | 3 trees |
| R-3 Privy fail-open | DP-0 (Task 0.2) tree | tree |
| R-4 raw-unit compare | Task 2.1 boundary tree | tree |
| R-5 sandbox endangered | Task 5.2 isolation tree + Phase 5 gate | tree+gate |
| R-6 fail-closed/no-cache | Task 2.1 structural tree + Task 2.3 step 3 TOCTOU + Task 2.5 grep | tree+tests |
| R-7 gas-free settle | DP-3 (Task 3.1) tree | tree |
| R-8 binding spoof | DP-4 (Task 2.3) tree | tree |
| R-9 feasibility | clock-based Phase-1 tripwire + wall-clock T-4h/T-6h (PRD §8) + VM-1/VM-2 + minimum-eligible cut | clock gates |
| R-10 A/B legibility | Task 5.3 VM-2 gate | gate |
Explicit command-branch trees: DP-0, DP-1, DP-1b, DP-2, DP-3, DP-4, Task 1.3, Task 2.1-structural, Task 5.2-isolation, R-14 = **10 trees**, plus [SEC] grep/test gates (#3, #4, #6, #9, TOCTOU) and clock tripwires. B (trees+gates) ≥ A (10). PASS.

---

## Skill-Ownership Map (SO-2 routing)
Every owned deliverable routed to its owning skill+phase. build does build-work only.

| Deliverable | Owner skill | Phase |
|---|---|---|
| all source code (facilitator, ENS/Hedera scripts, treasury, agent, resource, web, db, relayer) | hackathon-build | build |
| DOMAIN-GUIDE.md | hackathon-build | build (Task 1.4) |
| scripts/seed-demo.ts | hackathon-build | build (Task 5.1) |
| per-component test files | hackathon-build | build |
| CLAIMS.md + scripts/verify-claims.ts + SECURITY.md (franchise skeleton) | hackathon-build | build (Task 0.1) |
| /proof route | hackathon-build | build (Task 6.2) |
| submission/proof.md (on-chain proof capture) | hackathon-build | build (Task 6.2) |
| live deploy (Render + Vercel) | deploy-to-github | deploy |
| portfolio README + on-chain-verification section | deploy-to-github | deploy |
| screenshots | deploy-to-github | deploy |
| DESIGN_SYSTEM.md + brand.json | design-forge | design_forge |
| logo set | design-forge | design_forge |
| UI polish / best-UI-ever pass (warm-editorial-dark, progressive disclosure) | ui-revamp | design_forge |
| demo video (2-4min human-voice) | hackathon-demo | demo |
| submission bundle (Hacker Dashboard, 3 prize selections, AI-ATTRIBUTION) | hackathon-package | package |
| FEEDBACK notes per sponsor (free credibility) | hackathon-package | package |

Stubs build may create (tagged `stub_for_build: true`): none required — the design phase owns all presentation; build ships the functional spine only.

---

## Appendix A: File → Creation-Task Coverage (Metric 1 — all 35 files)
| File | Task |
|---|---|
| package.json, tsconfig.json | 0.1 |
| types/index.ts | 0.1 |
| CLAIMS.md, SECURITY.md, scripts/verify-claims.ts | 0.1 |
| treasury/privy.ts | 0.2 |
| scripts/hedera/client.ts, scripts/ens/client.ts, scripts/ens/addresses.ts | 0.3 |
| scripts/ens/register-2ld.ts, subregistry.ts, subname.ts, policy.ts, roles.ts, reverse.ts, revoke.ts | 1.1 |
| scripts/setup.ts | 1.2 |
| scripts/hedera/mint-usdc.ts, associate.ts, hcs.ts, fund-agent.ts | 1.2 (called by setup) |
| DOMAIN-GUIDE.md | 1.4 |
| facilitator/authorize.ts | 2.1 |
| facilitator/ens-read.ts, hcs-log.ts, hedera-scheme.ts, server.ts | 2.2 |
| resource-server/server.ts, agent/pay.ts | 3.1 |
| web/app/api/fund/route.ts | 4.1 |
| db/schema.ts, db/client.ts | 4.2 |
| scripts/seed-demo.ts | 5.1 |
| web/app/layout.tsx, page.tsx, demo/page.tsx, api/demo/route.ts, api/policy/[name]/route.ts, components/SplitScreen.tsx, components/AgentCard.tsx, lib/config.ts | 5.2 |
| web/app/app/page.tsx, api/agents/route.ts, api/revoke/route.ts, api/pay/route.ts, db/index-hcs.ts, relayer/relay.ts | 5.4b |
| .env.example | 6.1 (deploy — generated from ARCHITECTURE §N+6) |
All ARCHITECTURE tree files (incl. .env.example) have a creation task. PASS.

## Appendix B: Troubleshooting
| Error | Likely cause | Fix |
|---|---|---|
| `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT` | payer/receiver not associated | run `scripts/hedera/associate.ts` for both |
| ENS read returns empty on a set record | wrong resolver traversal (alpha) | Task 1.3 tree — read off org registry resolver |
| Privy over-cap tx broadcasts | owner-less wallet | DP-0 tree — fix owner arg shape |
| payer signature rejected | wrong signable hash | DP-3 tree — use @x402/hedera sign helper |
| `INSUFFICIENT_FUNDS` on Sepolia | deployer out of ETH | top up 0x72A9…d5C5 (R-13) |
