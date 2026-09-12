// File: treasury/privy.live.ts
// WS-0 smoke #1 (DP-0, INVARIANT #5, R-3): proves the Privy funding rail FAILS CLOSED — deterministically.
// LIVE test — hits the real Privy API with real app creds + the WS-0 P-256 authorization key, funds the treasury
// wallet's EVM account with real testnet HBAR, and polls the Hedera mirror node until the account exists before any
// policy-gated send. Runs under `npm run test:live` ONLY; excluded from the default green gate (C0 rule 24).
//
// What it proves (both cases against the SAME funded, existing, P-256-OWNED wallet):
//   (a) IN-CAP transfer (<= fundingCap)  -> SUCCEEDS (returns a real txHash).
//   (b) OVER-CAP transfer (> fundingCap) -> returns { denied: true, reason: 'FUNDING_DENIED' }, NO txHash,
//       via Privy's typed `type: 'policy_violation'` (HTTP 400) BEFORE broadcast.
// Case (a) is the control: if it fails with "Sender account not found", the wallet setup is broken and case (b)'s
// "denial" would be meaningless — so a simulation/broadcast failure is a HARD test failure, never a pass.
//
// DETERMINISM (removes the previous flake): the treasury wallet is PERSISTENT (create-or-reuse via
// TREASURY_WALLET_ID / TREASURY_EVM_ADDRESS in .env — the real one-org-treasury product shape, D-6), and the EVM
// account is funded then CONFIRMED-EXISTS by polling the mirror node with exponential backoff (cap ~60s) before the
// first send. Privy simulates a tx before evaluating policy; a nonexistent sender fails simulation, not policy — so
// we do not send until the mirror node reports the account. No races, no mocks, no fabricated FUNDING_DENIED.
import 'dotenv/config';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';
import { Client, PrivateKey, AccountId, Hbar, TransferTransaction, EvmAddress } from '@hiero-ledger/sdk';
import { createFundingPolicy, createTreasury, fundAgent } from './privy';
import { PrivyClient } from '@privy-io/server-auth';

// HIP-719 deterministic EVM facade for an HTS token id "0.0.x" (no forbidden SDK accessor).
function htsEvmAddress(tokenId: string): string {
  const num = tokenId.split('.').pop()!;
  return '0x' + BigInt(num).toString(16).padStart(40, '0');
}

const REQUIRED = ['PRIVY_APP_ID', 'PRIVY_APP_SECRET', 'PRIVY_AUTHORIZATION_KEY', 'TREASURY_OWNER_PUBKEY', 'HEDERA_OPERATOR_ID', 'HEDERA_OPERATOR_KEY'];
// USDC_TOKEN_ID is minted later (Phase 3). The over-cap DENY is a policy decision, independent of a real token.
const USDC_TOKEN_ID = process.env.USDC_TOKEN_ID?.trim() || '0.0.999999';
const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';
const ENV_PATH = resolve(process.cwd(), '.env');

const FUNDING_CAP = '10000000';        // 10 USDC (6 decimals), raw
const IN_CAP = '10000000';             // exactly the cap (<= cap -> ALLOW)
const OVER_CAP = '10000001';           // one raw unit over the cap (> cap -> DENY)
const AGENT_EVM = '0x000000000000000000000000000000000000a9e7'; // fixed, allowlisted, non-secret

function privyClient(): PrivyClient {
  return new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!, {
    walletApi: { authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_KEY },
  });
}

// Persist the created treasury identifiers so subsequent runs REUSE the same funded, existing wallet (determinism).
function persistTreasury(walletId: string, evmAddress: string): void {
  process.env.TREASURY_WALLET_ID = walletId;
  process.env.TREASURY_EVM_ADDRESS = evmAddress;
  appendFileSync(ENV_PATH, `\nTREASURY_WALLET_ID=${walletId}\nTREASURY_EVM_ADDRESS=${evmAddress}\n`);
}

// Create-or-reuse the P-256-OWNED treasury wallet bound to a fresh funding policy.
async function resolveTreasury(privy: PrivyClient, usdcEvm: string): Promise<{ walletId: string; evmAddress: string }> {
  const existingId = process.env.TREASURY_WALLET_ID?.trim();
  if (existingId) {
    try {
      const wallet = await privy.walletApi.getWallet({ id: existingId });
      return { walletId: wallet.id, evmAddress: wallet.address };
    } catch {
      // fall through to create a fresh persistent wallet
    }
  }
  const policyId = await createFundingPolicy([AGENT_EVM], FUNDING_CAP, usdcEvm);
  // INVARIANT #5: the wallet MUST be created WITH the P-256 owner. An owner-less wallet fails open.
  const walletId = await createTreasury(policyId, process.env.TREASURY_OWNER_PUBKEY!);
  const wallet = await privy.walletApi.getWallet({ id: walletId });
  persistTreasury(walletId, wallet.address);
  return { walletId, evmAddress: wallet.address };
}

// Send HBAR to the treasury EVM address (auto-creates the Hedera account on first funding).
async function fundEvmAccount(evmAddress: string): Promise<void> {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!),
  );
  const evm = EvmAddress.fromString(evmAddress);
  const receipt = await (
    await new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(process.env.HEDERA_OPERATOR_ID!), new Hbar(-5))
      .addHbarTransfer(AccountId.fromEvmAddress(0, 0, evm), new Hbar(5))
      .execute(client)
  ).getReceipt(client);
  if (receipt.status.toString() !== 'SUCCESS') throw new Error(`HBAR fund/auto-create failed: ${receipt.status.toString()}`);
  client.close();
}

// Poll the mirror node until the EVM account resolves (exponential backoff, cap ~60s). Removes the async race.
async function waitForAccount(evmAddress: string): Promise<string> {
  const deadline = Date.now() + 60_000;
  let delay = 1_000;
  let lastErr = '';
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${MIRROR_NODE}/accounts/${evmAddress}`);
      if (r.ok) {
        const body = (await r.json()) as { account?: string };
        if (body.account) return body.account; // e.g. "0.0.x" — account exists on chain-296
      } else {
        lastErr = `mirror ${r.status}`;
      }
    } catch (e: any) {
      lastErr = e?.message ?? String(e);
    }
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  throw new Error(`treasury EVM account ${evmAddress} did not resolve on mirror node within 60s (${lastErr})`);
}

describe('WS-0 smoke #1 — Privy funding rail fails closed (INVARIANT #5)', () => {
  let treasuryWalletId: string;
  let treasuryEvm: string;
  let usdcEvm: string;
  let hederaAccountId: string;

  beforeAll(async () => {
    const missing = REQUIRED.filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`missing env for live Privy smoke: ${missing.join(', ')}`);
    usdcEvm = htsEvmAddress(USDC_TOKEN_ID);
    const privy = privyClient();
    const t = await resolveTreasury(privy, usdcEvm);
    treasuryWalletId = t.walletId;
    treasuryEvm = t.evmAddress;
    expect(treasuryWalletId).toBeTruthy();

    // Deterministically ensure the treasury EVM account EXISTS on chain-296 before any policy-gated send.
    await fundEvmAccount(treasuryEvm);
    hederaAccountId = await waitForAccount(treasuryEvm);
    expect(hederaAccountId).toMatch(/^0\.0\.\d+$/);
    // eslint-disable-next-line no-console
    console.log(`[determinism] treasury EVM ${treasuryEvm} confirmed as Hedera account ${hederaAccountId} (mirror node)`);
  }, 180_000);

  it('(a) ALLOWS an in-fundingCap transfer -> broadcast, returns a txHash', async () => {
    const res = await fundAgent(treasuryWalletId, { agentAddress: AGENT_EVM, amountRaw: IN_CAP }, usdcEvm);
    // Control case: if this failed with "Sender account not found", setup is broken and (b) is meaningless.
    expect(res).toMatchObject({ funded: true });
    expect((res as { txHash?: string }).txHash).toMatch(/^0x[0-9a-fA-F]+$/);
    // eslint-disable-next-line no-console
    console.log(`[case a] in-cap ALLOW txHash=${(res as { txHash?: string }).txHash}`);
  }, 90_000);

  it('(b) DENIES an over-fundingCap transfer BEFORE broadcast -> FUNDING_DENIED', async () => {
    const res = await fundAgent(treasuryWalletId, { agentAddress: AGENT_EVM, amountRaw: OVER_CAP }, usdcEvm);
    // The load-bearing assertion: policy denial, and NO txHash was produced (nothing broadcast).
    expect(res).toEqual({ denied: true, reason: 'FUNDING_DENIED' });
    expect((res as { funded?: true }).funded).toBeUndefined();
    expect((res as { txHash?: string }).txHash).toBeUndefined();
    // eslint-disable-next-line no-console
    console.log('[case b] over-cap DENY -> FUNDING_DENIED (policy_violation, no broadcast)');
  }, 90_000);
});
