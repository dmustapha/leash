# DOMAIN-GUIDE.md

Domain knowledge for LEASH: an agent spend-control system where an organization declares an
agent's spending policy as an ENS text record (`leash.policy`), and a facilitator reads that
record live on every payment and refuses to settle anything the policy does not authorize.

Generated from ARCHITECTURE.md "N+1. Domain Knowledge File" and INVARIANTS.md. The ten
NON-NEGOTIABLES below are transcribed verbatim and are non-negotiable law: violating any one
fails the hackathon gate.

---

## 1. Key concepts

- **ENSv2 hierarchical registry.** ENSv2 names are organized as a tree of registries. The root
  `.eth` names live in the canonical ETHRegistry; a name can point at its own child registry
  (a "subregistry") so it can mint names one level deeper. LEASH builds a three-level tree:
  `leash.eth` (root) -> `acme.leash.eth` (org) -> `data.acme.leash.eth` / `payments.acme.leash.eth`
  (the two per-agent leaves, each with a distinct cap).

- **EAC role bitmap (Enhanced Access Control).** Authority over a name is a bitmap of roles
  (REGISTRAR, SET_SUBREGISTRY, SET_RESOLVER, ...), each with a paired admin variant shifted by 128.
  Holding `SET_RESOLVER` on a name is what lets its owner write `leash.policy`. Revoking that role
  is the structural kill switch (NON-NEGOTIABLE #8).

- **UserRegistry / VerifiableFactory / subregistry.** A UserRegistry is a UUPS proxy deployed by
  the VerifiableFactory (`deployProxy(impl, salt, initData)` returns the proxy address) and
  initialized with `initialize(rootAccount, roleBitmap)`. Wiring it under a parent name via
  `setSubregistry(tokenId, registry)` lets the parent mint children into it.

- **Permissioned Resolver.** The resolver that actually stores `leash.policy`. It is a separately
  deployed PermissionedResolver proxy whose write authority is its OWN EAC roles
  (`ROLE_SET_TEXT`), NOT the shared PublicResolverV2. PublicResolverV2's write check
  (`canModifyName` -> `NAME_WRAPPER.names(node)`) reverts for a name that lives in a self-deployed
  UserRegistry because the wrapper does not know that node (confirmed on-chain 2026-09-12, DEV-008).
  The name's resolver-of-record is pointed at the PermissionedResolver via `setResolver`, then
  `setText(namehash(name), "leash.policy", json)` is written and `text(...)` reads it back.

- **text record (`leash.policy`).** The org's declared policy, stored as a JSON string in the
  `leash.policy` text key of the agent's leaf name. This record IS the settlement policy: the
  facilitator reads it live on every payment. Shape (`AgentPolicy`): `maxPerCall` (raw
  smallest-unit cap string), `allowedPayees` (Hedera account ids), `hederaAccount` (the agent's
  binding anchor), `token` (HTS token id).

- **namehash.** The deterministic hash of a dotted ENS name (`namehash("data.acme.leash.eth")`)
  used as the `node` key for resolver reads/writes. Identical primitive on the write path
  (`policy.ts`) and the enforcement read path (`facilitator/ens-read.ts`).

- **x402 exact scheme.** The HTTP 402 payment protocol: a resource server answers a protected
  request with a 402 challenge, the client attaches a signed `X-PAYMENT` payload, and a
  facilitator verifies + settles it. "exact" means the payment amount is fixed by the challenge.

- **facilitator `/verify` + `/settle` hooks (`onBeforeVerify` / `onBeforeSettle`).** The two
  interception points. `onBeforeVerify` is an ADVISORY pre-screen (may use a <=30s cache).
  `onBeforeSettle` is the AUTHORITATIVE read performed immediately before adding the fee-payer
  signature, with NO cache (NON-NEGOTIABLE #2).

- **fee-payer (gas-free) mechanism.** On Hedera the facilitator's operator account can be the
  fee-payer on the agent's transfer, so the agent pays no gas. The fee-payer signature is added
  only after the settle-time policy read authorizes the payment.

- **HTS token + association.** LEASH mints its own 6-decimal HTS "USDC" (D-5). An account must be
  associated with a token before it can hold it. The token has two identifiers: the native HTS id
  (`0.0.x`) used by the facilitator transfer, and the HIP-719 deterministic EVM-facade address
  (`0x...`) used by Privy's ERC-20 `transfer` calldata policy.

- **HCS topic audit.** A Hedera Consensus Service topic is an append-only log; every gate decision
  (ALLOW/DENY) is written there as the tamper-evident audit trail, indexed into the DB for the UI.

- **native TransferTransaction.** The Hedera SDK transfer that actually moves HTS USDC on the
  payment rail, signed by the agent's custody key and fee-paid by the operator.

- **Privy P-256 owner + authorization-signature.** The org treasury wallet is created with a P-256
  owner and driven via `@privy-io/server-auth`, which computes the `privy-authorization-signature`.
  This is the only wallet model that enforces the funding policy; an owner-less/raw call fails OPEN
  and is forbidden (NON-NEGOTIABLE #5).

- **policy engine (funding rail).** Privy evaluates a static allow/deny policy on the
  treasury -> agent USDC FUNDING transaction (decodable ERC-20 `transfer` calldata). It is the
  independent second rail: capital-in control, distinct from the facilitator's capital-out control.

- **custody `secp256k1Sign`.** Privy holds the agent's key and signs the native x402 transfer via
  `secp256k1Sign` (a raw-hash custody signature). This custody path is NOT policy-inspected; it is
  permitted ONLY on the agent PAYMENT rail, never on the treasury FUNDING rail (NON-NEGOTIABLE #5/#6).

- **raw smallest-unit BigInt.** All amounts are raw integers in the token's smallest unit
  (3 USDC = `3000000` at 6 decimals), compared as `BigInt`. No floats, no human units, no
  hex-vs-decimal mismatch (NON-NEGOTIABLE #7).

- **binding (hederaAccount === payer).** The facilitator asserts the decoded tx payer equals the
  record's `hederaAccount` AND verifies the payer's signature. The `X-Leash-Agent` header only
  NAMES which record to read; it is untrusted (NON-NEGOTIABLE #8).

- **revocation (clear record / revokeRoles).** Two kill modes. Mode A: clear the `leash.policy`
  text record -> the facilitator's live read returns empty -> `REVOKED`. Mode B (structural):
  revoke the `SET_RESOLVER` (+ `SET_SUBREGISTRY`) EAC role -> removes write authority over the
  record and the resolver (`revoke.ts`).

- **dual-rail enforcement.** Two independent controls: the operator-run facilitator enforcing the
  org's ENS-declared policy on capital-out (payments), and Privy enforcing the funding policy on
  capital-in (treasury -> agent). Neither is "trustless" or "chain-enforced" (NON-NEGOTIABLE #4).

---

## 2. Glossary (domain -> code)

| Domain term | Code location |
|---|---|
| cap | `AgentPolicy.maxPerCall` |
| allowlist | `AgentPolicy.allowedPayees` |
| kill switch | `revoke.ts` `clearPolicy` / `revokeAgent` |
| the gate | `authorize.ts` |
| second rail | `treasury/privy.ts` |
| policy read (enforcement) | `policy.ts` `readPolicy` == `facilitator/ens-read.ts` (identical primitive) |
| policy write | `policy.ts` `setPolicy` (PermissionedResolver `setText`) |
| policy resolver | `POLICY_RESOLVER` in `.env` (deployed PermissionedResolver proxy) |

---

## 3. Source mapping (concept -> spec)

- ENSv2 registry / EAC roles / Permissioned Resolver / subregistry / namehash: master sec 4 and
  ARCHITECTURE.md sec 5 "ENS Provisioning", `scripts/ens/*`.
- x402 scheme / facilitator hooks / fee-payer / HTS / HCS / native transfer: master sec 3 and
  ARCHITECTURE.md sec 4 (facilitator) and sec 6 (Hedera scripts).
- Privy P-256 owner / funding policy / custody sign: master sec 4, ARCHITECTURE.md `treasury/privy.ts`.
- Binding / raw-unit BigInt / revocation / dual-rail: INVARIANTS.md NON-NEGOTIABLES #4-#9.

---

## 4. NON-NEGOTIABLES (verbatim from INVARIANTS.md)

> The build agent reads this as non-negotiable law. Violating any NON-NEGOTIABLE fails the
> hackathon gate.

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
