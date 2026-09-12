# LEASH

**The ENS name that can un-pay it.** LEASH is a spend-control plane for external AI agents: bind an agent to a 2-of-2 co-signed Hedera account and an ENS-declared spend policy, and revoke it everywhere with one on-chain write.

![ENS](https://img.shields.io/badge/ENS-Sepolia-5298FF) ![Hedera](https://img.shields.io/badge/Hedera_x402-testnet-000) ![Privy](https://img.shields.io/badge/Privy-B2B-f2a63b) ![tests](https://img.shields.io/badge/tests-102%20unit%20%2B%208%20integration%20%2B%20live-4fae7a) ![license](https://img.shields.io/badge/license-MIT-blue)

> LEASH is the ENS name that can un-pay it.

## What is LEASH?

An organization runs a fleet of paying agents. API keys have no cap and no off-switch. LEASH fixes that without touching the agent's keys:

1. **Bind** an existing external agent (its ERC-8004 / EVM identity) to a brand new **2-of-2 co-signed Hedera spending account** (`KeyList[agentPub, leashCoSignerPub]`, threshold 2). The agent holds its own key; LEASH holds only its co-signer key and the agent's public key.
2. **Declare** a spend policy on an ENS name: per-call cap, payee allowlist, and optional rolling daily/weekly budget plus time-windows. The policy lives in the ENS resolver record.
3. **Enforce** at the payment rail: a self-hosted x402 facilitator reads the live ENS policy before every settlement and co-signs only if the payment is in-policy. Cut one resolver record and the agent's next payment fails closed, everywhere.

**Honest by construction.** Enforcement is **facilitator-trusted** (the facilitator we run reads the org's ENS-declared policy and decides whether to co-sign). The chain stores the policy and the revocation; it does not itself stop a payment. This is the corporate-card model, not a trustless one. We never claim "the chain enforces the cap."

## How it works

```
agent  --x402 pay-->  self-hosted facilitator
                          | 1. read live ENS leash.policy (PermissionedResolver.text)
                          | 2. check cap / allowlist / rolling budget / window
                          | 3. co-sign 1-of-2  (agent already signed the other half)
                          v
                       Hedera settle (gas-free for the agent) --> HCS audit log
   org revokes: clearPolicy on the ENS record --> next settle-time read is empty --> REVOKED, no settle
```

Two independent rails: the ENS-declared **spend** policy (facilitator) and the Privy-guarded **funding** policy (a leaked key cannot over-fund an agent). Neither the agent alone nor LEASH alone can move the agent's funds; it takes both signatures.

## Deep integrations (the 3 sponsors)

### ENS: the name *is* the revocable spend policy
The org's ENS hierarchy (`leash` > `acme` > `data.acme.leash.eth`) carries a live `leash.policy` text record. The facilitator reads it via a `PermissionedResolver.text(namehash, "leash.policy")` call before settling. No hard-coded values: caps, allowlist, and revocation are all real Sepolia transactions.

### Hedera x402: gas-free settlement + immutable audit
A self-hosted `@x402/core` + `@x402/hedera` facilitator (Blocky402-equivalent) settles the paid request with a native fee-payer scheme, so the agent pays **0 HBAR** for gas. Every gate decision (ALLOW/DENY + reason) is written to an HCS topic.

### Privy: the funding rail fails closed
Agent funding runs through a Privy P-256-owner treasury policy. An over-cap transfer is denied by Privy before it reaches the chain. Signed-in users co-hold the on-chain kill-switch role for their own agents (additive with the relayer).

## Live on-chain proof (Sepolia + Hedera testnet)

| What | Reference | Explorer |
|---|---|---|
| Policy resolver (enforcement read target) | `0xdC460cd7151D679CF5D1e34595e1ac890A5E4978` | [Etherscan](https://sepolia.etherscan.io/address/0xdC460cd7151D679CF5D1e34595e1ac890A5E4978) |
| Sandbox registry | `0xB45830aeaf0A00367A450635a110cffA6878A679` | [Etherscan](https://sepolia.etherscan.io/address/0xB45830aeaf0A00367A450635a110cffA6878A679) |
| ERC-8004 Identity Registry (resolve source) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | [Etherscan](https://sepolia.etherscan.io/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |
| ENS revoke (`clearPolicy`, the kill switch) | `0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293` | [Etherscan](https://sepolia.etherscan.io/tx/0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293) |
| Hedera gas-free settle (agent pays 0 HBAR) | `0.0.10487802@1789205977.654877070` | [HashScan](https://hashscan.io/testnet/transaction/0.0.10487802-1789205977-654877070) |
| HCS audit topic (ALLOW seq#1, DENY OVER_CAP seq#2) | `0.0.10496492` | [Mirror](https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10496492/messages) |
| 2-of-2 co-signed spending account | `0.0.10508343` (KeyList threshold-2) | [HashScan](https://hashscan.io/testnet/account/0.0.10508343) |

Full ledger with every transaction: [`submission/proof.md`](submission/proof.md).

## Security architecture

| Layer | Mechanism | Enforcement point |
|---|---|---|
| Spend authority | facilitator reads live ENS policy, co-signs only if in-policy | `facilitator/authorize.ts` (pure gate, DB-free) + `facilitator/hedera-scheme.ts` |
| 2-of-2 custody | `KeyList[agentPub, leashCoSignerPub]` threshold 2; agent holds its own key (SR-1) | `scripts/hedera/provision-spending-account.ts` |
| Console authorization | `requireOwner()` (Bearer-only, app-id audience, ownership JOIN) as line 1 of every mutating route | `web/lib/auth.ts` |
| Funding rail | Privy P-256-owner policy denies over-funding, fails closed | `treasury/privy.ts` |
| Durable replay | settled paymentId persisted; store error fails closed (deny) | `db/replay.ts` |

## Honesty ledger

Each row is recomputed by `npm run verify:claims` against the committed evidence.

| Claim | Status | Evidence |
|---|---|---|
| ENS cap = 5 / 25 USDC (live `leash.policy`) | VERIFIED | `setText` tx `0x924525…`, resolver read |
| Revocation is one Sepolia write | VERIFIED | `clearPolicy` tx `0xf03e14…` |
| Hedera settle is gas-free for the agent | VERIFIED | settle `0.0.10487802@1789205977…`, mirror shows agent 0 HBAR |
| Every decision logged to HCS | VERIFIED | topic `0.0.10496492` seq#1 ALLOW, seq#2 DENY |
| Privy funding fails closed | VERIFIED | P-256-owner over-cap DENY |
| Co-signed in-cap pay settles | VERIFIED | `0.0.10487802@1789241326…` |
| Agent-alone / LEASH-alone cannot move funds | VERIFIED | both REJECTED `INVALID_SIGNATURE` / `MISSING_COSIGN` |
| External identity is **on-chain-resolved**, not verified | VERIFIED (labeled honestly) | `ownerOf(7395)` = `0x92AAe0…` |
| Rolling caps are a **soft budget**, not a hard on-settle cap | DISCLOSED | `OVER_DAILY_CAP` / `OVER_WEEKLY_CAP` DENY; worst case C×maxPerCall |
| Enforcement is facilitator-trusted, **not trustless** | DISCLOSED | see LIMITATIONS.md |

## Running locally

```bash
git clone https://github.com/dmustapha/leash.git
cd leash
npm install
cp .env.example .env        # fill in Hedera + Sepolia + Privy + Neon credentials
npm run build               # Next.js build
npm run check               # typecheck + unit (102) + integration (8)
```

Run the rails and the three-prize hero (needs a funded `.env`):

```bash
npm run facilitator         # self-hosted x402 facilitator on :8401
npm run resource            # x402-gated resource server on :8402
npm run dev                 # console at http://localhost:3000  (/demo, /app, /proof)
npm run test:live -- vm2    # frozen /demo three-prize hero (ENS + Hedera + Privy)
npm run test:live -- vm3    # reframe hero: co-signed settle + every DENY beat
npm run verify:claims       # recompute the honesty ledger (0 mismatches)
```

## Tests

- **Unit (`npm test`)**: 102 tests, including the pure enforcement gate (`authorize` 43 cases: caps, windows, allowlist, revoke boundaries), the co-sign primitives, and the authorization / IDOR guard. Offline, no network.
- **Integration (`npm run test:integration`)**: 8 tests, including durable replay against live Neon and module-boundary isolation guards.
- **Live (`npm run test:live`)**: real on-chain heroes (vm1 ENS+Hedera, vm2 three-prize, vm3 reframe co-signed) and the ERC-8004 resolve. Quarantined out of the default gate.

## Documentation

[`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DECISIONS.md`](DECISIONS.md) · [`SECURITY.md`](SECURITY.md) · [`LIMITATIONS.md`](LIMITATIONS.md) · [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) · [`CLAIMS.md`](CLAIMS.md) · [`submission/proof.md`](submission/proof.md) · [`AI-ATTRIBUTION.md`](AI-ATTRIBUTION.md)

## License

MIT, see [LICENSE](LICENSE).
