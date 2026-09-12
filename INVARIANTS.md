# INVARIANTS — Build-Agent Law (LEASH)
> The build agent reads this as non-negotiable law. Violating any NON-NEGOTIABLE fails the hackathon gate. Derived from WINNER-BRIEF `## Thesis` fields 5 (INVARIANTS) + 6 (DRIFT TRIPWIRES), the PRD Risk Register, and the [C] concerns; hardened by the forge §4 adversarial security review (2026-09-12). Every entry is falsifiable (SOURCE-LOCK version pins are falsifiable at build install). Rejection codes are `CODE`-cased and surfaced verbatim in the README Core-Invariants section by deploy.

> **Tag key:** `[SEC]` = spend-authorization / security invariant (the ESCALATE rule NEVER cuts these). `[SCOPE]` = scope/quality invariant.

## NON-NEGOTIABLES

1. **[SEC] Fail-closed enforcement (HEADLINE — structural).** The facilitator NEVER settles a payment it did not affirmatively authorize. The gate decision is a CLOSED discriminated union with no proceed default:
   ```ts
   type GateReason = 'OVER_CAP' | 'OFF_ALLOWLIST' | 'REVOKED' | 'BINDING_MISMATCH' | 'MALFORMED_POLICY' | 'REPLAY' | 'RPC_ERROR';
   type GateDecision = { settle: true; auth: SettleAuth } | { abort: true; reason: GateReason };
   ```
   The pure `authorize(ctx): GateDecision` function has NO `void`/`undefined` inhabitant — "proceed" cannot be produced without an affirmative `{settle:true, auth}` object. The `@x402/core` hook adapter (whose SDK contract is `void | {abort}`) emits SDK-proceed ONLY inside an explicit `if (d.settle === true)` guard; every other branch, and the outer `catch`, returns `{abort:true, reason}`. The settle caller `switch`es exhaustively over `GateDecision` with a compile-time `never` check, so a future un-handled path fails the BUILD, not the demo.
   - **Test:** (a) type-level — removing a branch from the settle `switch` fails `tsc` (`never` assertion). (b) unit — each of `OVER_CAP`/`OFF_ALLOWLIST`/`REVOKED`/`BINDING_MISMATCH`/`MALFORMED_POLICY`/`REPLAY`/`RPC_ERROR` returns `{abort}`. (c) grep — the hook adapter has exactly one `settle`-emitting site, guarded by `d.settle === true`; no settle inside a `catch`, and no settle after an unchecked ENS read.
   - **Judge-attack:** kill the Sepolia RPC mid-demo and retry a previously-working in-cap payment, expecting a fallback settle. → **Defense:** the ENS read throws, the outer catch returns `{abort:true, reason:'RPC_ERROR'}`, the payment fails closed. Structural: `authorize()` has no proceed inhabitant; the adapter cannot emit proceed without an affirmative `{settle:true}`.

2. **[SEC] Settle-time authoritative read (TOCTOU-closed).** The AUTHORITATIVE policy read is the one performed in `onBeforeSettle`, immediately before adding the fee-payer signature, with NO cache on any path that will settle. `onBeforeVerify` may pre-screen (and may use the ≤30s cache, see #3), but its ALLOW is advisory — a settle NEVER proceeds on `onBeforeVerify`'s cached decision. If a revoke lands between verify and settle, the settle-time read returns `REVOKED` and the payment does not submit.
   - **Test:** integration — stub `onBeforeVerify` → ALLOW, then revoke the record on-chain before settle; the `onBeforeSettle` read re-fetches live, returns `REVOKED`, and no Hedera submit occurs.
   - **Judge-attack:** revoke while a payment is in the pipeline ("in-flight bypass"). → **Defense:** the settle path re-reads ENS with no cache and is guarded by that read; the in-flight payment aborts `REVOKED`.

3. **[SEC] ENS is the live settlement policy; DB is never read for enforcement.** The facilitator reads `leash.policy` from ENS Sepolia via viem `eth_call`. On the demo revoke path AND on any settle-time read (#2) there is NO cache. A 30s in-memory TTL is permitted ONLY on the advisory `onBeforeVerify` pre-screen. The DB is NEVER read on any enforcement path. The ≤30s pre-screen staleness is a DISCLOSED bound (README states "revoke propagation ≤30s on the advisory pre-screen; settle-time enforcement is immediate").
   - **Test:** grep proves the settlement path imports no DB client; revoke → next settle returns `REVOKED` with no cache-warming delay.
   - **Judge-attack:** claim "revoke" only updated a DB row. → **Defense:** revoke is a real Sepolia tx (Etherscan hash); the facilitator's settle-time read is a live `eth_call` returning empty policy → `REVOKED`.

4. **[SEC] Honest dual-rail framing — never "trustless" / "chain-enforced".** Enforcement is facilitator-trusted (operator-run software) reading org-controlled ENS config. Privy is the independent second rail on the FUNDING flow only.
   - **Test:** repo-wide grep for `trustless`, `chain enforces`, `chain-enforced`, `on-chain enforcement of the cap` in README/demo/UI copy returns zero hits on the payment-enforcement claim.
   - **Judge-attack:** "So the blockchain stops the over-cap payment?" → **Defense:** "No. The facilitator we run enforces the org's ENS-declared policy; the chain stores the policy and the revocation. Privy is the independent second rail on funding." (master §11.)

5. **[SEC] Privy funding policy MUST be enforced via a P-256-owner wallet + authorization-signature (no fail-open path).** The treasury wallet is created with a P-256 owner and driven via `@privy-io/server-auth` (which computes the `privy-authorization-signature`). An owner-less/raw funding call fails OPEN (proven live 2026-09-12) and is FORBIDDEN. The funding tx is NEVER self-broadcast: `secp256k1Sign`+self-broadcast to Hashio is permitted ONLY on the agent PAYMENT/custody rail, never on the treasury FUNDING rail (self-broadcast bypasses policy evaluation).
   - **Test:** WS-0 smoke #1 — an over-`fundingCap` transfer from the owner-driven treasury returns a policy DENY BEFORE broadcast; a grep proves no `secp256k1Sign`+self-broadcast path exists on the funding rail.
   - **Judge-attack:** create/point at an owner-less wallet and over-fund an agent. → **Defense:** the treasury requires a P-256 owner by construction (wallet-creation invariant); the policy evaluates and returns `FUNDING_DENIED` before broadcast.

6. **[SEC] Privy is a passive policy engine on the funding rail, never a per-tx co-signer on the payment path.** Privy gates treasury→agent USDC funding (decodable EVM `transfer` calldata). It holds the agent key and signs the native x402 transfer via `secp256k1Sign` (custody), but that raw-hash path is NOT policy-inspected and Privy never approves/co-signs per payment.
   - **Test:** the funding policy targets ERC-20 `transfer` calldata only; the payment path calls `secp256k1Sign` (custody signature); no Privy policy-approval call sits on the x402 settle path (grep proves BOTH the absence on payment path AND the presence of #5's enforced policy on the funding path).
   - **Judge-attack:** "Isn't Privy just a co-signer, the forbidden multisig-approver shape?" → **Defense:** Privy evaluates a static allow/deny policy on the FUNDING transaction only; it never sees or approves the individual x402 payment. Two independent rails.

7. **[SEC] Raw smallest-unit BigInt comparison; malformed policy fails closed.** `amount` (decoded tx) and `maxPerCall`/`fundingCap` (ENS record / Privy policy) are raw smallest-unit integers (3 USDC = `3000000`, 6 decimals), compared as BigInt. No float, no human-unit, no hex-vs-decimal mismatch. A missing/non-numeric/negative `maxPerCall` (`"abc"`, `"-1"`, empty, absent field) returns `MALFORMED_POLICY`, never proceed.
   - **Test:** boundary units — `amount == maxPerCall` → settle; `amount == maxPerCall + 1n` → `OVER_CAP`; a decimal-string `maxPerCall` vs hex-decoded `amount` compare correctly; `BigInt("abc")`/negative/missing → `MALFORMED_POLICY` (caught, aborts).
   - **Judge-attack:** send one unit over the cap, or a garbage/negative cap record. → **Defense:** operands normalized to `BigInt` raw units before compare; off-by-one → `OVER_CAP`; unparseable → `MALFORMED_POLICY`.

8. **[SEC] Agent↔ENS binding is rooted in the EAC role, not record self-attestation alone.** The facilitator asserts `policy.hederaAccount === decoded tx payer` AND verifies the payer's signature (Mirror Node). The record's `hederaAccount` is only trustworthy because writing `leash.policy` requires the `SET_RESOLVER` EAC role on that name — the same role whose revocation is the kill switch. Binding integrity = write-access control of the resolver (the EAC trust boundary), stated honestly, not "the record self-attests so it's safe".
   - **Test:** (a) a payment whose payer ≠ the named record's `hederaAccount` returns `BINDING_MISMATCH`. (b) a record whose `hederaAccount` was set to an account the writer does not control still cannot spend (signature check fails). (c) writing `leash.policy` requires `SET_RESOLVER`; revoking it removes both spend authority and record-write authority.
   - **Judge-attack:** set `X-Leash-Agent` (attacker-controlled header) to a high-cap agent's name while paying from a different account. → **Defense:** the header only NAMES the record to read; the facilitator asserts `hederaAccount===payer` + valid payer signature → `BINDING_MISMATCH`. The header is untrusted; the binding assertion is the control.

9. **[SEC] Each settled payment is single-use (replay-closed); per-call cap is NOT an aggregate bound.** The facilitator rejects a re-presented `X-PAYMENT` payload and relies on Hedera duplicate-transaction-id rejection; a replayed/duplicate settle returns `REPLAY`. `maxPerCall` bounds ONE call; the aggregate capital-in bound is `fundingCap` on the Privy funding rail (D-9). The law makes no per-call-only aggregate claim.
   - **Test:** submit an identical settled `X-PAYMENT` payload twice → second returns `REPLAY` (or Hedera `DUPLICATE_TRANSACTION`); a leaked in-cap key cannot exceed `fundingCap` total because funding is policy-capped.
   - **Judge-attack:** replay a valid in-cap payment, or spam in-cap payments to drain past the intended budget. → **Defense:** replays rejected `REPLAY`; total draw is bounded by `fundingCap` on the funding rail, not by `maxPerCall` alone.

10. **[SCOPE] Judge sandbox is inviolable.** The `/demo` sandbox (pre-seeded `acme.<root>.eth`, server-side, no login/wallet/ETH) never imports or depends on the real multi-tenant `/app` path. Every sandbox demo beat is a real on-chain tx.
    - **Test:** the `/demo` route + API handlers have no import edge to `/app`'s Privy-login/multi-tenant modules; the sandbox runs with the real-path DB/login disabled.
    - **Judge-attack:** exercise the sandbox while the real console is broken/half-built. → **Defense:** hard module boundary; sandbox is self-contained and server-orchestrated (`keysOffHostDemoPath` = `/demo`).

### MUST NOT CLAIM
- MUST NOT claim the chain / smart contract / ENS enforces the spend cap (it stores the policy; the facilitator enforces it).
- MUST NOT claim "trustless" enforcement anywhere.
- MUST NOT claim ENSv2 fuses / one-way narrowing (EAC roles are reversible; demo reversible revoke).
- MUST NOT claim Privy co-signs or approves individual agent payments.
- MUST NOT present any demo state that was fabricated rather than produced by a real tx.
- MUST NOT claim LEASH prevents an agent that holds funds from paying via a DIFFERENT facilitator or a direct native transfer. Enforcement covers the org's OWN facilitator (capital-out) and the Privy funding rail (capital-in). The genuine org-wide kill is funding-rail control + record/role revocation, not interception of every conceivable transfer. (master §2 objection answer.)
- MUST NOT claim per-call `maxPerCall` bounds aggregate spend; the aggregate bound is `fundingCap` on the funding rail.

## VERIFY-BEFORE-CLAIMING
Every headline number, address, ENS name, tx hash, HCS sequence number, and topic id in README/demo/submission must be RECOMPUTABLE from a committed source (a script re-derives it, a tx is resolvable on Etherscan/HashScan, an env-pinned address). No unbacked figure ships. `submission/proof.md` holds the resolvable pointer for every claim.

## RESOLVED DECISIONS
| # | Question | Options considered | Chosen | Why not the others | Status |
|---|---|---|---|---|---|
| D-1 | Enforcement layer for the spend cap | on-chain contract (trustless) / facilitator-trusted read of ENS / Privy per-tx co-sign | facilitator reads ENS pre-settlement | on-chain cap-mirror is a multi-day trustless build (roadmap); per-tx co-sign is the forbidden Backstop shape | RESOLVED |
| D-2 | ENS naming shape | flat 2LD per agent / 3-level org hierarchy | 3-level (`<root>.eth`→`<org>.<root>.eth`→`data.<org>.<root>.eth`); root resolved free at WS-1 (`leash.eth` or fallback e.g. `leashorg.eth`) | flat is a KV-store smell; hierarchy is the load-bearing ENS depth + one-write org kill | RESOLVED (root string = build-discovered FACT, resolved WS-1) |
| D-3 | Hedera payment gas model | agent pays gas / facilitator fee-payer (gas-free) | facilitator fee-payer native exact scheme | agent-pays is not the Hedera x402 headline; gas-free is the prize bullet | RESOLVED |
| D-4 | Privy wallet model | owner-less wallet + policy_ids / P-256-owner wallet via server-auth | P-256-owner via `@privy-io/server-auth` | owner-less fails OPEN (proven live 2026-09-12); only owner+auth-sig enforces (see NON-NEGOTIABLE #5) | RESOLVED |
| D-5 | USDC source | canonical testnet USDC `0.0.429274` / mint own HTS token | mint own 6-dec HTS token (both HTS id AND EVM-facade address recorded) | faucet unreliable; own token guarantees demo value + association control | RESOLVED |
| D-6 | Product shape | single dashboard / two-path (sandbox + real console) | two-path, sandbox-first | single dashboard weaker on Privy+ENS depth; sandbox-first protects the scored floor | RESOLVED |
| D-7 | ENS address source | hard-code / runtime load / pinned 2026-06-29 set | pinned set (runtime load optional) | hard-code fails ENS "no hard-coded values" in spirit; pinned set is self-contained + `contracts-v2/` not cloned | RESOLVED |
| D-8 | Cap comparison units | human units / raw smallest-unit BigInt | raw BigInt | human-unit mismatch silently breaks the cap (R-4) | RESOLVED |
| D-9 | fundingCap vs maxPerCall | reuse one value / two distinct thresholds | distinct `fundingCap` (treasury aggregate, capital-in) + `maxPerCall` (per-call) | the leaked-key DENY beat needs a funding threshold separate from the per-call cap; fundingCap is also the aggregate bound (#9) | RESOLVED |
| D-10 | Funding-tx signer path | Privy owner-driven sendTransaction / secp256k1Sign self-broadcast fallback (G11) | Privy owner-driven ONLY on the funding rail; self-broadcast FORBIDDEN there | self-broadcast bypasses Privy policy = fail-open on funding (see #5); chain-296 support confirmed so no fallback needed | RESOLVED |

## SOURCE LOCK
| External identifier | Version / pin | Verify command | Expected output | Status |
|---|---|---|---|---|
| @x402/core | ~2.25 | `npm ls @x402/core` | 2.25.x | [UNVERIFIED-build-gate] |
| @x402/hedera | 2.25 | `npm ls @x402/hedera` | 2.25.x | [UNVERIFIED-build-gate] |
| @x402/express | ~2.25 | `npm ls @x402/express` | 2.25.x | [UNVERIFIED-build-gate] |
| @hiero-ledger/sdk | 2.85.0 | `npm ls @hiero-ledger/sdk` | 2.85.0 (never @hashgraph/sdk) | [UNVERIFIED-build-gate] |
| @hiero-ledger/proto | 2.31.0 | `npm ls @hiero-ledger/proto` | 2.31.0 (lockstep) | [UNVERIFIED-build-gate] |
| @privy-io/server-auth | ^1.32 | `npm ls @privy-io/server-auth` | 1.32.x; WS-0 must RE-PROVE owner-policy DENY against the installed version, not the forge-time test | [UNVERIFIED-build-gate] |
| viem | ^2.56 | `npm ls viem` | 2.56.x | [UNVERIFIED-build-gate] |
| ENSv2 ETHRegistry (Sepolia) | `0x67b728a792e789a8978b30cf1b3b641f19354b43` | `cast code 0x67b7…4b43 --rpc-url $SEPOLIA_RPC_URL` | non-empty bytecode (~29424 chars, confirmed 2026-09-12) | [VERIFIED-in-forge] |
| Hedera EVM chain | 296 (Hashio `https://testnet.hashio.io/api`) | `cast chain-id --rpc-url $HEDERA_EVM_RPC` | 296 | [VERIFIED-in-forge] |
| Privy chain-296 support | eip155:296 accepted | live API test (recorded in .forge-state platformProbe) | accepted + simulated | [VERIFIED-in-forge] |
| Deployer funding | 0.05 Sepolia ETH | `cast balance 0x72A9…d5C5 --rpc-url $SEPOLIA_RPC_URL` | ≥ 0.04 ETH (top-up if lower) | [VERIFIED-in-forge] |

## ESCALATE, DON'T FABRICATE
On any gate/task failure: stop, record BLOCKED with the failing gate name, and NEVER substitute a mock, cached result, stored-success response, or fabricated count/hash. Triage when over budget: cut stretch (real-console polish), then P1; NEVER a P0 (the judge-sandbox hero flow, the three prize bullets) or a `[SEC]` invariant. The minimum-eligible tripwire is the ONLY sanctioned cut path: ENS+Hedera two-prize, Privy cut-first, sandbox always shipped. Escalate after 2 failures on the same gate. External human review, if any, is `[HUMAN_REVIEW_REQUIRED]` documentation, never a blocking build gate.
