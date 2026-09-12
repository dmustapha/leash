// File: scripts/hedera/provision-accounts.ts
// [Phase 3 prerequisite] Establishes DISTINCT agent + receiver Hedera accounts so the gas-free property
// (INVARIANT / F-001) is PROVABLE: the agent (payer) must be a different account from the facilitator
// fee-payer (HEDERA_OPERATOR_ID). Before this, policy.hederaAccount == allowedPayees == feePayer == the
// operator, which makes "agent paid 0 gas" unfalsifiable.
//
// Creates two ECDSA accounts, funds each with a little HBAR (so their own association tx has gas), and
// associates the HTS USDC on both. Then funds the AGENT with USDC (transfer from the operator treasury) so
// it can actually pay the in-cap 3 USDC + the over-cap 50 USDC attempt.
//
// The agent signs the x402 transfer with its OWN key (SANDBOX_AGENT_KEY); the facilitator's Mirror-Node
// payer-signature check (INVARIANT #8) verifies that signature against the agent account's on-chain key.
// This is the raw-ECDSA custody path ARCHITECTURE §8 allows (Privy custody wraps the same secp256k1 key on
// the funding rail; the payment rail signs the transfer directly, INVARIANT #6).
//
// Idempotent: if SANDBOX_AGENT_ACCOUNT + RECEIVER_ACCOUNT_ID are already in .env it does nothing.
import 'dotenv/config';
import {
  AccountCreateTransaction,
  TransferTransaction,
  PrivateKey,
  PublicKey,
  AccountId,
  Hbar,
  TokenId,
} from '@hiero-ledger/sdk';
import { appendFileSync } from 'fs';
import { hederaClient } from './client';
import { associate } from './associate';

interface NewAccount {
  accountId: string;
  keyDer: string; // ECDSA private key, DER hex (fromStringECDSA-compatible)
  evmAddress: string; // EVM alias (0x...) for the Privy funding-rail facade
}

// Create an ECDSA account with `initialHbar` starting balance (operator pays). Returns id + key + evm alias.
async function createEcdsaAccount(initialHbar: number): Promise<NewAccount> {
  const client = hederaClient();
  const key = PrivateKey.generateECDSA();
  const pub: PublicKey = key.publicKey;
  const tx = await new AccountCreateTransaction()
    .setKeyWithoutAlias(pub)
    .setInitialBalance(new Hbar(initialHbar))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const accountId = receipt.accountId!.toString();
  client.close();
  return {
    accountId,
    keyDer: key.toStringDer(),
    evmAddress: '0x' + pub.toEvmAddress(),
  };
}

// Transfer raw-unit USDC from the operator treasury to `to`.
async function fundUsdc(to: string, tokenId: string, amountRaw: number): Promise<void> {
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const tx = await new TransferTransaction()
    .addTokenTransfer(TokenId.fromString(tokenId), operatorId, -amountRaw)
    .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(to), amountRaw)
    .execute(client);
  await tx.getReceipt(client);
  client.close();
}

async function main(): Promise<void> {
  if (process.env.SANDBOX_AGENT_ACCOUNT && process.env.RECEIVER_ACCOUNT_ID) {
    console.log('accounts already provisioned:', {
      agent: process.env.SANDBOX_AGENT_ACCOUNT,
      receiver: process.env.RECEIVER_ACCOUNT_ID,
    });
    return;
  }
  const tokenId = process.env.USDC_TOKEN_ID!;

  console.log('creating AGENT account (ECDSA, distinct from operator fee-payer)...');
  const agent = await createEcdsaAccount(5);
  console.log('  agent:', agent.accountId, 'evm:', agent.evmAddress);

  console.log('creating RECEIVER account (ECDSA)...');
  const receiver = await createEcdsaAccount(2);
  console.log('  receiver:', receiver.accountId, 'evm:', receiver.evmAddress);

  console.log('associating USDC on agent + receiver...');
  await associate(agent.accountId, agent.keyDer, tokenId);
  await associate(receiver.accountId, receiver.keyDer, tokenId);

  // Fund the agent with 200 USDC raw so it can pay in-cap (3) AND the over-cap attempt (50).
  console.log('funding agent with 200 USDC...');
  await fundUsdc(agent.accountId, tokenId, 200_000_000);

  const lines = [
    '',
    '# --- Phase 3 provisioned accounts (distinct from operator fee-payer for gas-free proof) ---',
    `SANDBOX_AGENT_ACCOUNT=${agent.accountId}`,
    `SANDBOX_AGENT_KEY=${agent.keyDer}`,
    `SANDBOX_AGENT_EVM=${agent.evmAddress}`,
    `RECEIVER_ACCOUNT_ID=${receiver.accountId}`,
    `RECEIVER_KEY=${receiver.keyDer}`,
    `RECEIVER_EVM=${receiver.evmAddress}`,
    '',
  ];
  appendFileSync('.env', lines.join('\n'));
  console.log('appended agent + receiver ids to .env');
  console.log('DONE', { agent: agent.accountId, receiver: receiver.accountId });
}

main().catch((e) => {
  console.error('provision error:', e);
  process.exit(1);
});
