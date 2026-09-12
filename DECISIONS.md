# Architecture Decision Records — LEASH

One ADR per load-bearing choice made during PRD + architecture. Each names the rejected alternative and why (mandatory).

## ADR-001: Enforce the spend cap at a self-hosted facilitator, not on-chain
- Context: the headline is "revocable name-scoped spend authority enforced at the payment rail." Where does enforcement live?
- Decision: a self-hosted (forked) Hedera x402 facilitator reads the ENS `leash.policy` record pre-settlement and refuses over-cap/off-allowlist/revoked payments.
- Rejected: (a) on-chain trustless cap enforcement — a multi-day smart-contract build (Hedera contract wallet + cap mirror) that does not fit the window; kept as roadmap. (b) Privy per-tx co-sign — collides with the forbidden Backstop co-signer shape (concern #15).
- Consequence: enforcement is honestly facilitator-trusted (must never be pitched as "trustless"); buys a buildable, demoable interlock in the window.
- Where: `facilitator/authorize.ts` + INVARIANTS #1/#4.

## ADR-002: 3-level ENS hierarchy (root → org → agent), not flat per-agent 2LDs
- Context: ENS must be load-bearing (hierarchy + one-write revoke), not a KV store, to win the ENS prize and avoid the "judge sees a database" risk.
- Decision: `<root>.eth` → `<org>.<root>.eth` → `data.<org>.<root>.eth`, with EAC roles as the kill switch.
- Rejected: flat 2LD per agent — reads as a key-value store, weaker ENS depth, no org-wide multi-tenant story.
- Consequence: deeper ENS integration + real multi-tenant orgs; costs an extra provisioning layer (the day-eater, R-2).
- Where: `scripts/ens/*`, ARCHITECTURE §5.

## ADR-003: Privy P-256-owner wallet driven via server-auth, not owner-less policy_ids
- Context: the Privy leaked-key DENY beat must actually block an over-fund.
- Decision: the treasury wallet is created with a P-256 owner and driven via `@privy-io/server-auth` so the funding policy is enforced.
- Rejected: owner-less wallet + `policy_ids` — proven live 2026-09-12 to FAIL OPEN (both chains reached broadcast). It would make the Privy prize demo silently fake.
- Consequence: the DENY is real and structural (wallet-construction requirement); WS-0 must re-prove against the pinned SDK version.
- Where: `treasury/privy.ts` + INVARIANTS #5 + D-4.

## ADR-004: Settle-time authoritative read (onBeforeSettle), verify advisory
- Context: a revoke landing between verify and settle could let an in-flight payment settle (TOCTOU).
- Decision: the authoritative no-cache policy read is in `onBeforeSettle`, immediately before the fee-payer signature; `onBeforeVerify` is an advisory pre-screen (30s cache allowed).
- Rejected: verify-authoritative with a cache — reintroduces the TOCTOU window; a revoked agent could complete an in-flight payment.
- Consequence: one extra ENS read per settle (latency budget < 1.5s p95); closes the in-flight bypass.
- Where: `facilitator/server.ts` + INVARIANTS #2/#3.

## ADR-005: Mint own 6-decimal HTS USDC, not canonical testnet USDC
- Context: the demo needs real value to move without a flaky faucet.
- Decision: mint an own HTS token (6 decimals) and record both its HTS id and EVM-facade address.
- Rejected: canonical testnet USDC `0.0.429274` — faucet unreliable; no control over association/supply for the demo.
- Consequence: "real value" is our own test token (satisfies "real paid request" without faucet risk); note the EVM-facade duality for the Privy funding policy.
- Where: `scripts/hedera/mint-usdc.ts` + D-5.

## ADR-006: Two-path app (judge sandbox + real console), sandbox-first
- Context: judges need zero-setup; the product needs to be real; the clock is hard.
- Decision: `/demo` (pre-seeded, server-side, scored) built FIRST; `/app` (Privy login, multi-tenant, DB, relayer) second, and never allowed to endanger the sandbox.
- Rejected: single dashboard — weaker Privy+ENS depth and no zero-setup judge path; a login-gated single app risks a dead judge experience.
- Consequence: roughly doubles frontend/infra; the sandbox-first discipline protects the scored floor under the minimum-eligible tripwire.
- Where: `web/*`, ARCHITECTURE §12, INVARIANTS #10, D-6.

## ADR-007: Raw smallest-unit BigInt comparison for all caps
- Context: a human-unit or hex/decimal mismatch silently breaks the cap check (R-4).
- Decision: `amount` and `maxPerCall`/`fundingCap` are raw smallest-unit integers compared as BigInt; malformed → `MALFORMED_POLICY`.
- Rejected: human-unit floats — silent mis-evaluation of the headline invariant.
- Consequence: all policy amounts are decimal strings parsed to bigint; boundary + malformed unit tests required.
- Where: `facilitator/authorize.ts` + INVARIANTS #7 + D-8.

## ADR-008: No custom Solidity; enforcement is ENS (external) + the facilitator
- Context: master §12 lists `contracts/` as "if needed."
- Decision: ship no custom Solidity; the ENSv2 contracts (external) + the TypeScript facilitator ARE the enforcement.
- Rejected: a helper Solidity contract — adds deploy/verify surface with no load-bearing role in the hackathon scope.
- Consequence: smaller attack + build surface; the on-chain cap-mirror (which would need Solidity) is explicitly roadmap.
- Where: ARCHITECTURE §1 file tree (no `contracts/`).

## ADR-009: External-identity model — LEASH binds an existing agent, it does not mint one [USER, 2026-09-12]
- Context: the REFRAME (2026-09-12) pivots LEASH from a create-your-own-agent product to the **spend-control plane for agents that already exist**. Where does the agent's identity/logic/LLM/key live, and what does registration actually assert?
- Decision: the agent's identity, logic, LLM, and keys are **EXTERNAL and self-owned** (an EVM address / ERC-8004 registration the agent controls). Registration **BINDS** that identity to an ENS name + a co-signed spending account + a policy; it never mints an agent. LEASH calls the canonical ERC-8004 Identity Registry on Ethereum Sepolia (`0x8004A818BFB912233c491871b3d84c89A494BD9e`, ABI verified live at build) to **resolve** the owner. The result is labeled **"on-chain-resolved" (ADVISORY)**, never **"verified"** — `ownerOf` does not prove the registrant controls the address. The enforcement path reads EXACTLY `leash.policy` and never any `agent.*` identity record (INVARIANT #13, CI module-boundary guard).
- Rejected: (a) minting agents in LEASH (create-your-own-agent + strategy/LLM) — moved to roadmap "coming soon"; it is not the honest control-plane story and duplicates external identity systems. (b) claiming "verified" identity — `ownerOf` is not proof-of-control; signed proof-of-control is roadmap. (c) reading identity records on the enforcement path — would make advisory metadata load-bearing and re-open the #13 drift.
- Consequence: LEASH is a binding layer over identities it did not create; the create-your-own-agent product parks as roadmap; identity is advisory-only and honestly "resolved," so a wrong `agentPub` is self-defeating (its holder simply can't produce the required 1-of-2 signature) and needs no proof-of-control gate; ENS gains registry-resolution depth.
- Where: PRD §1/§3, `scripts/ens/erc8004.ts` (`0x8004A818…` + real ABI), REFRAME §1 + REF-5/REF-6, INVARIANTS #13.

## ADR-010: 2-of-2 co-signed spending account + honest control/trust boundary [USER, 2026-09-12]
- Context: the reframe needs a spending model where the agent is a genuine co-owner yet LEASH can enforce a cap and revoke — without ever holding the agent's funds alone and without claiming trustlessness.
- Decision: a NET-NEW Hedera `KeyList[agentPub, leashCoSignerPub]`, `threshold=2` account. The **agent holds its own Hedera private key** and supplies ONLY `agentPub` at register (SR-1 — the linchpin; the key is NEVER in LEASH's facilitator, DB, or env). LEASH holds `LEASH_COSIGNER_KEY`, asserted **DISTINCT from `HEDERA_OPERATOR_KEY`** at process start (throw if equal). The agent signs 1-of-2 agent-side; LEASH applies its co-signature ONLY at settle, after the gate passes, at a single emit site, and only when `authorize()` returns `{settle:true}`. **Control = TRUE** (LEASH's co-signature is required — a real veto — and caps + revoke are real). **Trustless = FALSE** (facilitator-trusted: the cap is LEASH's decision to co-sign, not chain-enforced; the chain enforces only "two keys signed"). A **PROTO-GATE (proto-VM3) runs live immediately after Group S**; if the SDK dual-sign or long-zero funding fails, FALL BACK to a **single-key governed-account** spending model (identity binding + dynamic limits still ship, VM-1/VM-2 stay green).
- Rejected: (a) LEASH holding both keys (single-key custodial) for the headline path — makes the 2-of-2 theater and F-031 ("LEASH can't move funds alone") false; kept only as the FROZEN /demo floor and the S-GATE fallback. (b) Privy as the co-signer — collides with INVARIANT #6 (Privy is funding-only) and the forbidden per-tx co-signer shape; the cosigner is a raw Hedera threshold key, not Privy-held. (c) claiming the chain enforces the cap ("trustless") — dishonest; the boundary is facilitator-trusted. (d) a separate-trust-domain cosigner service now — roadmap; the cosigner shares the facilitator process this cycle (disclosed in LIMITATIONS).
- Consequence: the agent is a genuine co-owner (independence = TRUE) and LEASH holds a real spend veto (control = TRUE) while never being able to move funds alone; honesty is preserved (trustless = FALSE, never claimed); an added startup assertion (`LEASH_COSIGNER_KEY ≠ HEDERA_OPERATOR_KEY`) and a single post-gate co-sign emit site; a live PROTO-GATE de-risks the SDK dual-sign / long-zero funding, with a documented governed-account fallback that still ships identity binding + dynamic limits.
- Where: PRD §4 (2-of-2 spending account + agent-side client + funding), `scripts/hedera/provision-spending-account.ts`, `facilitator/hedera-scheme.ts`, REFRAME §1 + REF-1/REF-2/REF-3/REF-9, INVARIANTS #6/#8, LIMITATIONS.
