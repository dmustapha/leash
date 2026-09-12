// File: treasury/privy.live.ts
// WS-0 smoke #1 (DP-0, INVARIANT #5, R-3): proves the Privy funding rail moves REAL USDC in-cap and FAILS
// CLOSED over-cap - deterministically, on the REAL HTS USDC token (DEV-019, supersedes DEV-018).
// LIVE test - hits the real Privy API with real app creds + the WS-0 P-256 authorization key, ensures the
// treasury Privy wallet is HTS-associated with the real USDC token and holds real USDC (top-up from the
// operator who is the token's Hedera treasury), then exercises the policy-gated funding rail.
// Runs under `npm run test:live` ONLY; excluded from the default green gate (C0 rule 24).
//
// What it proves (both cases against the SAME P-256-OWNED wallet, bound to the REAL USDC token facade):
//   (a) IN-CAP transfer (<= fundingCap)  -> policy ALLOWs -> a REAL ERC-20 transfer of the real HTS token
//       0.0.10496489 from the treasury to the agent EVM address; the recipient's real USDC balance rises and
//       the treasury's falls by exactly the amount, VERIFIED on the Hedera mirror node.
//   (b) OVER-CAP transfer (> fundingCap) -> returns { denied: true, reason: 'FUNDING_DENIED' }, NO txHash,
//       via Privy's typed `type: 'policy_violation'` (HTTP 400) BEFORE broadcast, on the REAL token calldata.
// Case (a) is the control: it must NOT be denied by policy - the leaked-key DENY only bites over-cap.
//
// PRIVY-HEDERA BOUNDARY (DEV-019, supersedes DEV-018): Privy simulates the eth_sendTransaction against the
// target Hedera token facade BEFORE evaluating the value policy. The prior phantom-facade workaround (token
// 0.0.999999) was removed - it made both the ALLOW and DENY hollow. The real fix: the treasury Privy wallet
// (Hedera 0.0.10495945) has unlimited automatic token associations (max_automatic_token_associations = -1),
// so an operator -> treasury transfer of the real token auto-associates it, and the treasury holds real USDC.
// With a real, associated, funded sender the Hedera EVM precheck no longer reverts, so the ERC-20 transfer
// simulation passes and Privy's VALUE POLICY is what decides ALLOW (real move) / DENY (over-cap) - honestly.
//
// DETERMINISM: the treasury wallet is PERSISTENT (create-or-reuse via TREASURY_WALLET_ID). Before the sends we
// top the treasury up with real USDC from the operator so the in-cap ALLOW always has balance to move; the
// top-up is CONFIRMED on the mirror node before any policy-gated send. No mocks, no phantom token, no fabricated
// FUNDING_DENIED, no hollow txHash.
import 'dotenv/config';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { Client, PrivateKey, AccountId, TransferTransaction, TokenId } from '@hiero-ledger/sdk';
import { createFundingPolicy, createTreasury, fundAgent } from './privy';
import { PrivyClient } from '@privy-io/server-auth';

const REQUIRED = [
  'PRIVY_APP_ID', 'PRIVY_APP_SECRET', 'PRIVY_AUTHORIZATION_KEY', 'TREASURY_OWNER_PUBKEY',
  'HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY', 'USDC_TOKEN_ID', 'USDC_EVM_ADDRESS', 'SANDBOX_AGENT_EVM',
];
const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

const FUNDING_CAP = '10000000';        // 10 USDC (6 decimals), raw
const IN_CAP = '5000000';              // 5 USDC (<= cap -> ALLOW, real move)
const OVER_CAP = '10000001';           // one raw unit over the cap (> cap -> DENY)
// The real USDC HTS token and its EVM facade (the same token the x402 rail moves for real).
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID!;                 // 0.0.10496489
const REAL_USDC_EVM = process.env.USDC_EVM_ADDRESS!;             // 0x...a029e9
const AGENT_EVM = process.env.SANDBOX_AGENT_EVM!;               // recipient of the ERC-20 transfer calldata
const TREASURY_HEDERA_ID = '0.0.10495945';                     // the Privy P-256-owned treasury's Hedera account
const TOPUP_RAW = 20_000_000;                                 // 20 USDC top-up so in-cap always has balance

// Full ERC-20 transfer ABI (Privy policy condition requires the ABI array, per privy.ts).
const TRANSFER_ABI = [{ type: 'function', name: 'transfer', inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }] }];

function privyClient(): PrivyClient {
  return new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!, {
    walletApi: { authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_KEY },
  });
}

// Bind the wallet's funding policy to the REAL USDC token + the real agent EVM allowlist. Idempotent.
async function bindRealTokenPolicy(privy: PrivyClient, policyId: string): Promise<void> {
  await privy.walletApi.updatePolicy({
    id: policyId,
    rules: [
      {
        name: 'allow-capped-agent-funding',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          { fieldSource: 'ethereum_calldata', field: 'transfer._to', abi: TRANSFER_ABI, operator: 'in', value: [AGENT_EVM] },
          { fieldSource: 'ethereum_calldata', field: 'transfer._value', abi: TRANSFER_ABI, operator: 'lte', value: FUNDING_CAP },
          { fieldSource: 'ethereum_transaction', field: 'to', operator: 'eq', value: REAL_USDC_EVM },
        ],
      },
    ],
  });
}

// Create-or-reuse the P-256-OWNED treasury wallet bound to the real-token funding policy.
async function resolveTreasury(privy: PrivyClient): Promise<{ walletId: string; evmAddress: string }> {
  const existingId = process.env.TREASURY_WALLET_ID?.trim();
  if (existingId) {
    try {
      const wallet = await privy.walletApi.getWallet({ id: existingId });
      for (const pid of wallet.policyIds ?? []) await bindRealTokenPolicy(privy, pid);
      return { walletId: wallet.id, evmAddress: wallet.address };
    } catch {
      // fall through to create a fresh persistent wallet
    }
  }
  const policyId = await createFundingPolicy([AGENT_EVM], FUNDING_CAP, REAL_USDC_EVM);
  // INVARIANT #5: the wallet MUST be created WITH the P-256 owner. An owner-less wallet fails open.
  const walletId = await createTreasury(policyId, process.env.TREASURY_OWNER_PUBKEY!);
  const wallet = await privy.walletApi.getWallet({ id: walletId });
  return { walletId, evmAddress: wallet.address };
}

// Top the treasury up with real USDC from the operator (token's Hedera treasury). The treasury has unlimited
// automatic token associations, so this transfer auto-associates the real token if needed.
async function topUpTreasuryUsdc(): Promise<void> {
  const client = Client.forTestnet();
  const opId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  client.setOperator(opId, PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!));
  const receipt = await (
    await new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(USDC_TOKEN_ID), opId, -TOPUP_RAW)
      .addTokenTransfer(TokenId.fromString(USDC_TOKEN_ID), AccountId.fromString(TREASURY_HEDERA_ID), TOPUP_RAW)
      .execute(client)
  ).getReceipt(client);
  if (receipt.status.toString() !== 'SUCCESS') throw new Error(`USDC top-up failed: ${receipt.status.toString()}`);
  client.close();
}

// Read an account's real USDC balance (raw) from the mirror node; 0 if not associated yet.
// NOTE: the aggregate /tokens balance snapshot lags consensus by many seconds; use confirmRealTransfer
// (the transaction ledger) to PROVE a specific move, and use this only for a coarse balance check.
async function usdcBalance(hederaId: string): Promise<number> {
  const r = await fetch(`${MIRROR_NODE}/accounts/${hederaId}/tokens?token.id=${USDC_TOKEN_ID}`);
  if (!r.ok) return 0;
  const body = (await r.json()) as { tokens?: Array<{ balance: number }> };
  return body.tokens?.[0]?.balance ?? 0;
}

// Poll the treasury's CRYPTOTRANSFER ledger until a SUCCESS tx is found that debits the treasury by exactly
// `amountRaw` of real USDC and credits the agent EVM address by the same, at or after `sinceNanos`. This is the
// deterministic, lag-immune proof that the real asset moved (the aggregate balance snapshot lags too much).
async function confirmRealTransfer(amountRaw: number, agentHederaId: string, sinceNanos: number): Promise<string> {
  const deadline = Date.now() + 90_000;
  let delay = 2_000;
  while (Date.now() < deadline) {
    const r = await fetch(`${MIRROR_NODE}/accounts/${TREASURY_HEDERA_ID}?limit=10&order=desc&transactiontype=CRYPTOTRANSFER`);
    if (r.ok) {
      const body = (await r.json()) as { transactions?: Array<{ consensus_timestamp: string; result: string; token_transfers?: Array<{ token_id: string; account: string; amount: number }> }> };
      for (const t of body.transactions ?? []) {
        if (t.result !== 'SUCCESS') continue;
        if (Number(t.consensus_timestamp.replace('.', '')) < sinceNanos) continue;
        const usdc = (t.token_transfers ?? []).filter((x) => x.token_id === USDC_TOKEN_ID);
        const debit = usdc.find((x) => x.account === TREASURY_HEDERA_ID && x.amount === -amountRaw);
        const credit = usdc.find((x) => x.account === agentHederaId && x.amount === amountRaw);
        if (debit && credit) return t.consensus_timestamp;
      }
    }
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  throw new Error(`no SUCCESS real-USDC transfer of ${amountRaw} from ${TREASURY_HEDERA_ID} to ${agentHederaId} appeared on the mirror ledger within 90s`);
}

// Resolve the Hedera account id for an EVM address (the ERC-20 transfer recipient).
async function hederaIdForEvm(evmAddress: string): Promise<string> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const r = await fetch(`${MIRROR_NODE}/accounts/${evmAddress}`);
    if (r.ok) {
      const body = (await r.json()) as { account?: string };
      if (body.account) return body.account;
    }
    await new Promise((res) => setTimeout(res, 2_000));
  }
  throw new Error(`EVM address ${evmAddress} did not resolve to a Hedera account id within 30s`);
}

// Poll until the treasury's real USDC balance is at least `min` (mirror-node lag settle).
async function waitForBalanceAtLeast(hederaId: string, min: number): Promise<number> {
  const deadline = Date.now() + 60_000;
  let delay = 1_000;
  while (Date.now() < deadline) {
    const bal = await usdcBalance(hederaId);
    if (bal >= min) return bal;
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  throw new Error(`treasury ${hederaId} real USDC balance did not reach ${min} within 60s`);
}

describe('WS-0 smoke #1 - Privy funding rail moves real USDC in-cap and fails closed over-cap (INVARIANT #5)', () => {
  let treasuryWalletId: string;
  let treasuryBalBefore: number;

  beforeAll(async () => {
    const missing = REQUIRED.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`missing env for live Privy smoke: ${missing.join(', ')}`);
    const privy = privyClient();
    const t = await resolveTreasury(privy);
    treasuryWalletId = t.walletId;
    expect(treasuryWalletId).toBeTruthy();

    // Ensure the treasury holds real USDC before the in-cap ALLOW so the real move always has balance.
    await topUpTreasuryUsdc();
    treasuryBalBefore = await waitForBalanceAtLeast(TREASURY_HEDERA_ID, Number(IN_CAP));
    // eslint-disable-next-line no-console
    console.log(`[real] treasury ${TREASURY_HEDERA_ID} real USDC balance after top-up: ${treasuryBalBefore}`);
  }, 180_000);

  it('(a) ALLOWS an in-fundingCap transfer -> broadcasts a REAL USDC move confirmed on the mirror ledger', async () => {
    // Resolve the recipient Hedera id and mark the ledger cut-off so we only match THIS test's transfer.
    const agentHederaId = await hederaIdForEvm(AGENT_EVM);
    const sinceNanos = Date.now() * 1_000_000; // ns cut-off; only transfers after this count

    const res = await fundAgent(treasuryWalletId, { agentAddress: AGENT_EVM, amountRaw: IN_CAP }, REAL_USDC_EVM);
    expect(res).toMatchObject({ funded: true });
    const txHash = (res as { txHash?: string }).txHash;
    expect(txHash).toMatch(/^0x[0-9a-fA-F]+$/);
    // eslint-disable-next-line no-console
    console.log(`[case a] in-cap ALLOW real-USDC txHash=${txHash}`);

    // Prove the real asset moved: a SUCCESS tx debiting the treasury by IN_CAP and crediting the agent by IN_CAP.
    const consensus = await confirmRealTransfer(Number(IN_CAP), agentHederaId, sinceNanos);
    // eslint-disable-next-line no-console
    console.log(`[case a] REAL USDC moved: -${IN_CAP} from ${TREASURY_HEDERA_ID} -> +${IN_CAP} to ${agentHederaId} (consensus ${consensus})`);
    expect(consensus).toMatch(/^\d+\.\d+$/);
  }, 150_000);

  it('(b) DENIES an over-fundingCap transfer BEFORE broadcast -> FUNDING_DENIED (real token, no move)', async () => {
    const res = await fundAgent(treasuryWalletId, { agentAddress: AGENT_EVM, amountRaw: OVER_CAP }, REAL_USDC_EVM);
    // The load-bearing assertion: policy denial on the REAL token calldata, and NO txHash (nothing broadcast).
    expect(res).toEqual({ denied: true, reason: 'FUNDING_DENIED' });
    expect((res as { funded?: true }).funded).toBeUndefined();
    expect((res as { txHash?: string }).txHash).toBeUndefined();
    // eslint-disable-next-line no-console
    console.log('[case b] over-cap DENY on real USDC -> FUNDING_DENIED (policy_violation, no broadcast)');
  }, 90_000);
});
