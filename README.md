# LEASH: keep your AI agents on a leash

**Not another agent that pays an API. LEASH is the ENS name that can un-pay it.** The control layer for AI agents that spend money: bind an existing agent to a governed 2-of-2 co-signed account, declare its spend policy on an ENS name, fund it through a fail-closed rail, and cut it off everywhere with one on-chain write. The name is the leash: clear the record, and the agent's next payment fails closed.

> Keep your AI agents on a leash.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![ENS](https://img.shields.io/badge/ENS-Sepolia-5298FF)](https://ens.domains/)
[![Hedera x402](https://img.shields.io/badge/Hedera_x402-testnet-000)](https://hedera.com/)
[![Privy](https://img.shields.io/badge/Privy-funding_rail-c6f24d)](https://privy.io/)
[![Tests](https://img.shields.io/badge/tests-102_unit_%2B_8_integration_%2B_live-4fd08a)](#tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Live:** [leash.ink](https://leash.ink) · **Judge sandbox:** [leash.ink/demo](https://leash.ink/demo) · **On-chain proof:** [leash.ink/proof](https://leash.ink/proof)

---

## What is LEASH?

An organization runs a fleet of AI agents that spend money per call. Today the only spend control is a raw key: no per-call cap, no allowlist, no org-wide off-switch. LEASH is the control layer over that fleet. One console binds each agent's identity, gives it a governed account, sets its limits, funds it, and can cut it off, with a full audit trail. It does all of this without ever touching the agent's private key.

1. **Bind** an existing external agent (its ERC-8004 / EVM identity) to a brand new 2-of-2 co-signed Hedera spending account (`KeyList[agentPub, leashCoSignerPub]`, threshold 2). The agent holds its own private key. LEASH holds only its co-signer key and the agent's public key (SR-1).
2. **Declare** a spend policy on an ENS name: per-call cap, payee allowlist, and optional rolling daily/weekly budget plus time windows. The policy lives in the ENS resolver record.
3. **Enforce** at the payment rail. A self-hosted x402 facilitator reads the live ENS policy before every settlement and co-signs only when the payment is in-policy. Clear one resolver record and the agent's next payment fails closed, everywhere.

The hero move is one-write revoke: bind an agent to a co-signed account and an ENS-declared policy, then revoke it everywhere with a single on-chain write (`clearPolicy`).

**Honest by construction.** Enforcement is facilitator-trusted. The facilitator LEASH runs reads the org's ENS-declared policy and decides whether to co-sign. The chain stores the policy and the revocation; it does not itself stop a payment. This is the corporate-card model. Control = TRUE, Independence = TRUE, Trustlessness = FALSE.

---

## Try the judge sandbox (2 minutes, zero setup)

Open [leash.ink/demo](https://leash.ink/demo). Nothing to install, connect, or fund. The sandbox is a guided five-step walkthrough that governs the owner's own real agent, **SOLV-001**, an autonomous Circle developer-controlled wallet on Arc (identity `0x927c1d756d12879aebea0772f3ee220f21f4841a`, on-chain-resolved via the ENS `agent.address` record on `data.acme.leash.eth`). Behavior is backed by real `/api/demo` beats and real on-chain transactions.

| Step | What you see | What it proves |
|------|--------------|----------------|
| 1. Meet the agent | The agent, its ENS-declared policy, its co-owned account | The facilitator's source of truth is the live `leash.policy` ENS record |
| 2. Pays in-limit | An in-cap payment settles: "Paid" | Hedera gas-free settle; the fee-payer is charged, the agent holds 0 HBAR |
| 3. Overspends | An over-cap payment is refused: "Blocked" (`OVER_CAP`) | The facilitator declines to co-sign; nothing settles |
| 4. Cut off | The policy is revoked on-chain, next payment fails closed: "Revoked" (`REVOKED`) | One-write revoke clears the ENS record; the next settle-time read is empty |
| 5. Over-fund denied | A leaked-key over-fund is blocked before broadcast: "Blocked" (`FUNDING_DENIED`) | The independent Privy funding rail fails closed |

Each verdict is written to the Hedera Consensus Service audit topic, so every outcome is checkable on-chain. A new user binds their own agent in [`/app`](https://leash.ink/app) the same way, with no Hedera setup: give the agent's EVM / ERC-8004 identity (the agent already lives on another chain), and LEASH generates its Hedera spending key for you, shows the private half once for you to save, provisions a 2-of-2 co-owned Hedera account, and writes the ENS policy. Advanced users can paste their agent's own Hedera public key instead. Either way LEASH never retains the private key, so LEASH alone still cannot move the agent's funds.

Full walkthrough for both paths: [`docs/JUDGE-PATH.md`](docs/JUDGE-PATH.md).

---

## How it works

```
agent  --x402 pay-->  self-hosted facilitator (onBeforeSettle)
                          |  1. read live ENS leash.policy  (PermissionedResolver.text, no cache)
                          |  2. check cap / allowlist / rolling budget / window
                          |  3. co-sign the 1-of-2  (agent already signed the other half)
                          v
                       Hedera settle (agent pays 0 HBAR gas)  -->  HCS audit topic (ALLOW / DENY)
   org revokes:  clearPolicy on the ENS record  -->  next settle-time read is empty  -->  REVOKED, no settle
```

Two independent rails cross the boundary. The ENS-declared spend policy is read by the facilitator on the payment path. The Privy-guarded funding policy sits on the funding path, where a leaked key cannot over-fund an agent. Privy is funding-only and never co-signs a payment. Neither the agent alone nor LEASH alone can move the agent's funds; it takes both signatures.

---

## Chain scope today and roadmap

LEASH governs agent spending on Hedera today. Governance for other chains (Arc, Base, and other EVM networks) is in progress. The three capabilities have different reach right now:

- **Identity is already multi-chain.** Bind an existing agent from any chain by its EVM address / ERC-8004 registration. Identity is on-chain-resolved via the canonical Sepolia Identity Registry.
- **Funding is portable.** The Privy funding rail (over-fund DENY) runs on the agent's Hedera account (chainId 296) today. The Privy mechanism is EVM-general and portable to other chains.
- **Spend governance is Hedera today.** In-cap allow, over-cap refuse, and revoke run on Hedera, because the co-signing facilitator LEASH runs is the x402/Hedera one. Native governance on another chain needs a co-signer plus a policy read deployed per chain (roadmap).

---

## Why the ENS record is not a closed system

The design objection: capabilities should be metadata on the name, not enforced at the payment layer, or you risk a closed ecosystem. LEASH does not close anything. The ENS `leash.policy` record is public, and any facilitator may honor it or ignore it. The org publishes its own agents' policies as ENS metadata and runs its own facilitator to enforce its own treasury rules on its own fleet. That is internal treasury governance over an org's own agents, like employee card limits, not a protocol-level gate on open commerce.

---

## Deep integrations

### ENS: the name is the revocable spend policy

The org's ENS hierarchy (`leash` > `acme` > `data.acme.leash.eth`) carries a live `leash.policy` text record. The facilitator reads it via a `PermissionedResolver.text(namehash, "leash.policy")` call inside `onBeforeSettle`, immediately before the fee-payer signature is added, closing the TOCTOU window. There are no hard-coded values. The caps, allowlist, and revocation are all real Sepolia transactions. The data agent's live cap is 5 USDC; the payments agent's is 25 USDC. The kill switch is one `clearPolicy` write; after it, the next settle-time read returns an empty record and the gate returns `REVOKED`.

### Hedera x402: gas-free settlement and an immutable audit trail

A self-hosted `@x402/core` + `@x402/hedera` facilitator settles the paid request with the native x402 fee-payer scheme, so the agent pays 0 HBAR for gas and is only debited the USDC it spends. The facilitator is Blocky402-derived: Blocky402 is a hosted product built on this exact package stack and the official `onBeforeVerify` / `onBeforeSettle` hooks, so LEASH self-hosts the same stack to insert the ENS gate in `onBeforeSettle` pre-settlement (`facilitator/server.ts:2`). Every gate decision (ALLOW / DENY plus reason) is written to an HCS topic. The token is our own test USDC (6-decimal HTS), never canonical USDC.

### Privy: the funding rail fails closed

Agent funding runs through a P-256-owner Privy treasury policy driven via `@privy-io/server-auth`. An over-cap transfer is denied by Privy before it reaches the chain, returning `FUNDING_DENIED` with no tx hash. Signed-in users co-hold the on-chain kill-switch role (`ROLE_SET_TEXT`) for their own agents, additive with the relayer. Privy funds the agent's account and never co-signs a payment.

---

## Core Invariants

Each invariant is enforced law, and the disallowed path surfaces the exact code below. Sourced from [`INVARIANTS.md`](INVARIANTS.md) NON-NEGOTIABLES.

- **Fail-closed enforcement:** the facilitator never settles a payment it did not affirmatively authorize. The gate decision is a closed discriminated union with no proceed default; a disallowed pay returns a `DENY` reason and nothing settles.
- **One-write revoke, fail-closed:** clearing the ENS `leash.policy` record on-chain stops the next payment. The facilitator's next live read is empty, the gate returns `REVOKED`, and there is no cache on the enforcement path.
- **Agent-alone cannot spend:** the agent's valid 1-of-2 payload submitted without LEASH's co-signature yields no settle and a clean `MISSING_COSIGN` gate reason.
- **LEASH-alone cannot move the agent's funds:** LEASH holds only its co-signer key plus the agent's public key (SR-1), so an operator-plus-cosigner-only move does not settle (`INVALID_SIGNATURE`).
- **Rolling caps are a soft budget:** an over-budget pay returns `OVER_DAILY_CAP` / `OVER_WEEKLY_CAP` and does not settle. The rolling total is summed from the HCS topic through a lagging mirror index, so it is a soft budget (worst case approx C x `maxPerCall`), not a hard on-settle cap. `maxPerCall` (live ENS) is the hard per-call bound.
- **Mirror-down fails closed:** when a cap is declared and the mirror node is unreachable, spend-rollup throws rather than defaulting to 0, so the pay aborts with `RPC_ERROR` and never settles. A dropped index cannot silently un-cap.
- **Replay-closed and durable:** a replayed `X-PAYMENT` is rejected `REPLAY` even across a facilitator restart, and a replay-store failure aborts (deny), never "not seen, proceed".

---

## Status Legend

| Color | State token | Meaning |
|-------|-------------|---------|
| Green | `ALLOW` | policy check passed; the co-signed payment settled on Hedera |
| Red | `DENY` / `REVOKED` | blocked at the payment rail (`OVER_CAP`, `OVER_DAILY_CAP`, `OVER_WEEKLY_CAP`, `OUTSIDE_WINDOW`, `OFF_ALLOWLIST`, `MISSING_COSIGN`, `RPC_ERROR`) or the ENS policy record was revoked |
| Lime | `PENDING` / `IDLE` | an action in flight or an awaiting-input state, not a settled verdict |

---

## Security Architecture

| Layer | Mechanism | Enforcement point |
|-------|-----------|-------------------|
| Spend authority | facilitator reads live ENS policy inside `onBeforeSettle`, co-signs only if in-policy | `facilitator/server.ts:145` (hook), `facilitator/authorize.ts` (pure gate, DB-free) |
| Live policy read | `PermissionedResolver.text(namehash, "leash.policy")`, no cache, closes TOCTOU | `facilitator/ens-read.ts:8` |
| 2-of-2 custody | `KeyList[agentPub, leashCoSignerPub]` threshold 2; agent holds its own key (SR-1) | `scripts/hedera/provision-spending-account.ts` |
| Single co-sign site | co-sign is emitted only at the single post-gate settle site | `facilitator/hedera-scheme.ts:98` |
| Console authorization | `requireOwner()` (Bearer-only, app-id audience, ownership JOIN) as line 1 of every mutating route | `web/lib/auth.ts` |
| Funding rail | Privy P-256-owner policy denies over-funding, fails closed | `treasury/privy.ts` |
| Durable replay | settled paymentId persisted to Neon; store error fails closed (deny) | `db/replay.ts` |

Enforcement is facilitator-trusted, not trustless. The chain checks only that two keys signed, not the policy reason behind the co-signature. See [`LIMITATIONS.md`](LIMITATIONS.md).

---

## Deployed contracts and services

| Name | Address / ID | Network |
|------|--------------|---------|
| Policy resolver (PermissionedResolver, enforcement read target) | `0xdC460cd7151D679CF5D1e34595e1ac890A5E4978` | Sepolia |
| Sandbox registry | `0xB45830aeaf0A00367A450635a110cffA6878A679` | Sepolia |
| Org-parent registry | `0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409` | Sepolia |
| ERC-8004 Identity Registry (resolve source) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | Sepolia |
| 2-of-2 co-signed spending account | `0.0.10508343` (KeyList threshold-2) | Hedera testnet, chainId 296 |
| HCS audit topic | `0.0.10496492` | Hedera testnet |
| Own test USDC (6-decimal HTS) | `0.0.10496489` | Hedera testnet |
| Console + facilitator + resource server | [leash.ink](https://leash.ink) | live |

---

## Live transactions

| What | Reference | Explorer |
|------|-----------|----------|
| ENS setText (`leash.policy` = 5 USDC) | `0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa` | [Etherscan](https://sepolia.etherscan.io/tx/0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa) |
| ENS revoke (`clearPolicy`, the kill switch) | `0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293` | [Etherscan](https://sepolia.etherscan.io/tx/0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293) |
| Hedera gas-free settle (agent pays 0 HBAR) | `0.0.10487802@1789205977.654877070` | [HashScan](https://hashscan.io/testnet/transaction/0.0.10487802-1789205977-654877070) |
| Co-signed 2-of-2 in-cap settle | `0.0.10487802@1789241326.656309368` | [HashScan](https://hashscan.io/testnet/transaction/0.0.10487802-1789241326-656309368) |
| Privy in-cap fund (real USDC transfer) | `0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749` | [Mirror](https://testnet.mirrornode.hedera.com/api/v1/contracts/results/0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749) |
| HCS audit topic (ALLOW seq#1, DENY OVER_CAP seq#2) | `0.0.10496492` | [Mirror](https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10496492/messages) |
| Co-hold kill-switch role grant (persistent) | `0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101` | [Etherscan](https://sepolia.etherscan.io/tx/0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101) |
| Privy over-cap over-fund | no tx: `FUNDING_DENIED`, denied before broadcast | its absence is the proof |

These transactions collectively prove the full loop: policy set on ENS, in-cap co-signed settle on Hedera with the agent paying no gas, over-fund denied by Privy pre-broadcast, and revocation as a single on-chain write. Full ledger: [`submission/proof.md`](submission/proof.md).

---

## On-chain verification

`npm run verify:claims` re-derives each headline number from a committed source (USDC = raw / 1e6) and, when a Sepolia RPC is configured, live-reads the `leash.policy` caps via the PermissionedResolver. It writes the result to `evidence/claims-recomputed.json` and diffs it against the asserted values in [`docs/pipeline/claims.json`](docs/pipeline/claims.json). It refuses to read back a stored success; a non-zero exit means an asserted number did not recompute.

```bash
npm run verify:claims   # recomputes the honesty ledger; 0 mismatches
```

The `/proof` route on the deployed app renders the same ledger live.

---

## Honesty ledger

Each row is recomputed by `npm run verify:claims` against the committed evidence in [`docs/pipeline/claims.json`](docs/pipeline/claims.json).

| Claim | Status | Evidence |
|-------|--------|----------|
| ENS cap = 5 USDC (data) / 25 USDC (payments), live `leash.policy` | VERIFIED | `setText` tx `0x924525…`, resolver read |
| Revocation is one Sepolia write | VERIFIED | `clearPolicy` tx `0xf03e14…` |
| Hedera settle is gas-free for the agent | VERIFIED | settle `0.0.10487802@1789205977…`, mirror shows agent 0 HBAR |
| Co-signed in-cap pay settles on the 2-of-2 account | VERIFIED | settle `0.0.10487802@1789241326.656309368` |
| Every gate decision logged to HCS | VERIFIED | topic `0.0.10496492`, seq#1 ALLOW, seq#2 DENY OVER_CAP |
| Privy funding fails closed | VERIFIED | in-cap fund `0xb4ec56…`; over-cap `FUNDING_DENIED`, no tx |
| Agent-alone / LEASH-alone cannot move funds | VERIFIED | `MISSING_COSIGN` / operator-alone `INVALID_SIGNATURE` |
| External identity is on-chain-resolved (not verified) | VERIFIED, labeled honestly | `ownerOf(7395)` = `0x92AAe0857979a139344f5b6F008e71F27A507522` |
| Rolling caps are a soft budget, not a hard on-settle cap | DISCLOSED | `OVER_DAILY_CAP` / `OVER_WEEKLY_CAP` DENY; worst case C x `maxPerCall` |
| Enforcement is facilitator-trusted, not trustless | DISCLOSED | [`LIMITATIONS.md`](LIMITATIONS.md) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Console | Next.js 15 (App Router), React, TypeScript |
| Identity | ENS (Sepolia), ERC-8004 canonical Identity Registry, PermissionedResolver |
| Payment rail | self-hosted `@x402/core` + `@x402/hedera` facilitator (Blocky402-derived) |
| Settlement | Hedera testnet, 2-of-2 KeyList spending account, native fee-payer scheme |
| Audit | Hedera Consensus Service (HCS) topic |
| Funding | Privy P-256-owner treasury (`@privy-io/server-auth`) |
| Auth | Privy JWT, `requireOwner()` Bearer + ownership JOIN |
| Persistence | Neon Postgres (durable replay guard only) |
| Tests | Vitest (102 unit + 8 integration + live tiers) |

---

## Running locally

```bash
git clone https://github.com/dmustapha/leash.git
cd leash
npm install
cp .env.example .env        # fill in Hedera + Sepolia + Privy + Neon credentials
npm run build               # Next.js build
npm run check               # typecheck + unit (102) + integration (8)
```

Run the rails and the integration hero (needs a funded `.env`):

```bash
npm run facilitator         # self-hosted x402 facilitator on :8401
npm run resource            # x402-gated resource server on :8402
npm run dev                 # console at http://localhost:3000  (/demo, /app, /proof)
npm run test:live -- vm2    # /demo integration hero (ENS + Hedera + Privy)
npm run test:live -- vm3    # reframe hero: co-signed settle + every DENY beat
npm run verify:claims       # recompute the honesty ledger (0 mismatches)
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `SEPOLIA_RPC_URL` | Ethereum Sepolia RPC for ENS reads and writes |
| `HEDERA_OPERATOR_ID` / `HEDERA_OPERATOR_KEY` | facilitator fee-payer account and key |
| `LEASH_COSIGNER_KEY` | LEASH's co-signer key (never the agent's private key) |
| `PRIVY_APP_ID` / `PRIVY_APP_SECRET` | Privy app credentials |
| `PRIVY_AUTHORIZATION_KEY` / `TREASURY_WALLET_ID` | P-256-owner funding rail credentials |
| `DATABASE_URL` | Neon Postgres for the durable replay guard |

See [`.env.example`](.env.example) for the full list.

---

## Tests

```bash
npm run check   # 102 unit + 8 integration passing
```

- **Unit (`npm test`):** 102 tests, including the pure enforcement gate (`authorize`, 43 cases covering caps, windows, allowlist, and revoke boundaries), the co-sign primitives, and the authorization / IDOR guard. Offline, no network.
- **Integration (`npm run test:integration`):** 8 tests, including durable replay against live Neon, the `onBeforeSettle` TOCTOU guard, and module-boundary isolation.
- **Live (`npm run test:live`):** real on-chain heroes (`vm1` ENS + Hedera, `vm2` all three integrations, `vm3` co-signed settle plus every DENY beat) and the ERC-8004 resolve. Quarantined out of the default gate.

---

## Network context

LEASH governs spending on Hedera testnet (chainId 296, `https://testnet.mirrornode.hedera.com`, explorer `https://hashscan.io/testnet`). Identity and policy live on Ethereum Sepolia (`https://sepolia.etherscan.io`).

---

## Documentation Suite

- [Architecture](ARCHITECTURE.md): system design and the one-way dependency flow
- [Decisions](DECISIONS.md): ADR log with the alternative rejected per decision
- [Security](SECURITY.md): threat matrix and what is deliberately not defended against
- [Limitations](LIMITATIONS.md): what is built, what is a soft budget, and why enforcement is facilitator-trusted
- [Claims](CLAIMS.md): the human render of the machine claim ledger
- [Judge Path](docs/JUDGE-PATH.md): the zero-login sandbox and the real-agent console path
- [Design System](DESIGN_SYSTEM.md): color tokens, type scale, and the Tether visual system
- [AI Attribution](AI-ATTRIBUTION.md): what the AI wrote and what the author specified

---

## License

MIT, see [LICENSE](LICENSE).
