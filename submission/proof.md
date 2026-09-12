# LEASH — On-Chain Proof

Every headline claim below resolves on-chain today. Enforcement is **facilitator-trusted**: the facilitator we run reads the org's ENS-declared policy before it settles a payment, and Privy is the independent second rail on the funding flow. The chain stores the policy and the revocation; it does not itself stop a payment. (Honest dual-rail framing, INVARIANTS.md #4.)

Machine ledger: [`docs/pipeline/claims.json`](../docs/pipeline/claims.json) · Human ledger: [`CLAIMS.md`](../CLAIMS.md) · Recompute: `npm run verify:claims` → [`evidence/claims-recomputed.json`](../evidence/claims-recomputed.json)

Networks: EVM = **Sepolia**, Hedera = **testnet**.

---

## Deployed contracts (Sepolia)

| Contract | Address | Explorer |
|---|---|---|
| Sandbox registry | `0xB45830aeaf0A00367A450635a110cffA6878A679` | https://sepolia.etherscan.io/address/0xB45830aeaf0A00367A450635a110cffA6878A679 |
| Policy resolver (PermissionedResolver, enforcement read target) | `0xdC460cd7151D679CF5D1e34595e1ac890A5E4978` | https://sepolia.etherscan.io/address/0xdC460cd7151D679CF5D1e34595e1ac890A5E4978 |
| Org-parent registry | `0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409` | https://sepolia.etherscan.io/address/0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409 |

---

## Prize leg 1 — ENS: the name IS the revocable spend policy

The org's ENS name hierarchy carries a live `leash.policy` text record. The facilitator reads that record via the PermissionedResolver's `text(namehash, "leash.policy")` before settling. Registering, setting the cap, and revoking are each real Sepolia transactions.

| Action | Name | Sepolia tx | Explorer |
|---|---|---|---|
| register (root) | `leash` | `0x32d3d92e8ef4f2cedcee87350fcbe48821ff8f4546cee7a6cf589cf1f539ac97` | https://sepolia.etherscan.io/tx/0x32d3d92e8ef4f2cedcee87350fcbe48821ff8f4546cee7a6cf589cf1f539ac97 |
| register (org) | `acme` | `0x81a9f22d0892cce21871e2531a12d093ec4f4f257107e120d4ca992f885fa293` | https://sepolia.etherscan.io/tx/0x81a9f22d0892cce21871e2531a12d093ec4f4f257107e120d4ca992f885fa293 |
| register (agent) | `data.acme.leash.eth` | `0x28113edcc070c9ce58aeaa7f6c44b7e1089f7b1890aab3a71fed384bac133126` | https://sepolia.etherscan.io/tx/0x28113edcc070c9ce58aeaa7f6c44b7e1089f7b1890aab3a71fed384bac133126 |
| register (agent) | `payments.acme.leash.eth` | `0xc9a05c18e50e08ea5c7756d07b3fefc22ace59ad7b7f4b8ee3b9bee3ce3654c8` | https://sepolia.etherscan.io/tx/0xc9a05c18e50e08ea5c7756d07b3fefc22ace59ad7b7f4b8ee3b9bee3ce3654c8 |
| setText (`leash.policy`) | `data.acme.leash.eth` | `0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa` | https://sepolia.etherscan.io/tx/0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa |
| **revoke** (`clearPolicy`, the kill switch) | `data.acme.leash.eth` | `0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293` | https://sepolia.etherscan.io/tx/0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293 |
| revoke (three-prize hero, VM-2) | `data.acme.leash.eth` | `0x12945fe4c843cf7f8f82ea1123b03a9b8739a31d2609758a51a4266ed5ffe18e` | https://sepolia.etherscan.io/tx/0x12945fe4c843cf7f8f82ea1123b03a9b8739a31d2609758a51a4266ed5ffe18e |

**`leash.policy` record contents (raw smallest-unit, USDC 6 decimals):**
- `data.acme.leash.eth` → `maxPerCall = 5000000` = **5 USDC**
- `payments.acme.leash.eth` → `maxPerCall = 25000000` = **25 USDC**

After the `clearPolicy` revoke, the facilitator's next settle-time read returns an empty record → the gate returns `REVOKED` and never settles. There is no cache on the enforcement read path.

---

## Prize leg 2 — Hedera x402: gas-free settlement + immutable HCS audit trail

**Gas-free paid request (native x402 fee-payer scheme).** The agent pays **0 HBAR** for gas; the facilitator fee-payer covers the transaction fee. The agent is only debited the USDC it is spending.

- Settle tx: `0.0.10487802@1789205977.654877070`
  - HashScan: https://hashscan.io/testnet/transaction/0.0.10487802-1789205977-654877070
  - Mirror: https://testnet.mirrornode.hedera.com/api/v1/transactions/0.0.10487802-1789205977-654877070
  - Mirror confirms: `result: SUCCESS`, `charged_tx_fee: 1475816` debited from the fee-payer `0.0.10487802`; the agent `0.0.10497601` has a **zero HBAR** transfer entry (only −3 USDC), receiver `0.0.10497604` +3 USDC.
- Three-prize hero (VM-2) gas-free spend: `0.0.10487802@1789214406.117245682` — SUCCESS on mirror.
- Own test HTS USDC (6-dec): `0.0.10496489` (EVM facade `0x…a029e9`).

**Immutable HCS audit trail.** Every gate decision is written to an HCS topic.

- Topic: `0.0.10496492`
  - Mirror: https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10496492/messages
  - `seq #1` → `{"decision":"ALLOW","amount":"3000000",...}`
  - `seq #2` → `{"decision":"DENY","reason":"OVER_CAP","amount":"50000000",...}`

Canonical sandbox agents: `data 0.0.10499595`, `payments 0.0.10499598`; receiver `0.0.10497604`.

---

## Prize leg 3 — Privy: the funding rail fails closed

The treasury is a **P-256-owner** Privy wallet driven via `@privy-io/server-auth` (the funding call carries a `privy-authorization-signature`; an owner-less/raw call would fail open and is forbidden). The funding policy enforces a per-transfer cap on the real USDC `transfer` calldata.

- **In-cap → ALLOW (real on-chain USDC transfer):** `0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749`
  - Mirror: https://testnet.mirrornode.hedera.com/api/v1/contracts/results/0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749 → `result: SUCCESS`, `status: 0x1`.
- **Over-cap → `FUNDING_DENIED` (Privy `policy_violation`):** returns no `txHash` — the transfer never broadcasts. Fails closed **before** broadcast, by design, so there is no on-chain artifact for the denial (its absence is the proof).

---

## Recompute (VERIFY-BEFORE-CLAIMING)

`npm run verify:claims` re-derives each headline number from a committed source (USDC = raw / 1e6) and, when a Sepolia RPC is configured, live-reads the `leash.policy` caps via the PermissionedResolver. It writes the result to `evidence/claims-recomputed.json` and diffs it against the asserted values in `docs/pipeline/claims.json`. It refuses to read back a stored success. A non-zero exit means an asserted number did not recompute.

Judge proof surface (rendered live): **`/proof`** on the deployed app.
