// File: scripts/hedera/provision-canonical.ts
// [DEV-020 FIX] Provisions a CANONICAL Hedera agent account whose EVM alias == its ECDSA key-derived
// address. This is the one-account-per-agent model the three-prize hero requires: the SAME account is used
// by (1) the Privy funding rail (ERC-20 transfer to the key-EVM credits THIS account), (2) the x402 payment
// rail (custody secp256k1 sign from THIS account id), and (3) the ENS leash.policy.hederaAccount binding.
//
// ROOT CAUSE this fixes: provision-accounts.ts created accounts with setKeyWithoutAlias(), which yields a
// Hedera-native long-zero EVM (0x00...num). The .env then stored the KEY's toEvmAddress() as SANDBOX_AGENT_EVM.
// Those two addresses point at DIFFERENT accounts: Privy funding sent USDC to the key-EVM (auto-creating a
// SEPARATE key-alias account), while x402 + ENS used the long-zero account. Funds and payer diverged.
//
// THE FIX: setECDSAKeyWithAlias(key) sets the account's admin key AND derives its EVM alias from the same
// ECDSA key, so the on-chain account's evm_address == key.toEvmAddress(). Now the Privy transfer target and
// the x402 payer are the identical Hedera account. Idempotent per (idEnv, keyEnv, evmEnv) presence in .env.
import {
  AccountCreateTransaction,
  PrivateKey,
  Hbar,
} from '@hiero-ledger/sdk';
import { hederaClient } from './client';
import { associate } from './associate';
import { upsertEnv } from '../env';

const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

export interface CanonicalAccount {
  accountId: string; // "0.0.x"
  keyDer: string;    // ECDSA private key, DER hex (fromStringECDSA-compatible)
  evmAddress: string; // key-derived EVM alias (0x...) == the account's real evm_address
}

// Create a canonical ECDSA account whose EVM alias is derived from its own signing key.
async function createCanonicalAccount(initialHbar: number): Promise<CanonicalAccount> {
  const client = hederaClient();
  const key = PrivateKey.generateECDSA();
  const tx = await new AccountCreateTransaction()
    .setECDSAKeyWithAlias(key) // key + alias derived from the SAME ECDSA key (DEV-020 fix)
    .setInitialBalance(new Hbar(initialHbar))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const accountId = receipt.accountId!.toString();
  client.close();
  return {
    accountId,
    keyDer: key.toStringDer(),
    evmAddress: '0x' + key.publicKey.toEvmAddress(),
  };
}

// Assert that an already-provisioned account is truly canonical: its on-chain evm_address must equal the
// key-derived EVM alias. A non-canonical account (long-zero evm from setKeyWithoutAlias) is the DEV-020 bug
// and MUST be re-provisioned, else the funding rail and payment rail keep diverging.
async function isCanonical(accountId: string, keyDer: string, storedEvm: string): Promise<boolean> {
  const derivedEvm = ('0x' + PrivateKey.fromStringECDSA(keyDer).publicKey.toEvmAddress()).toLowerCase();
  if (storedEvm.toLowerCase() !== derivedEvm) return false;
  const r = await fetch(`${MIRROR_NODE}/accounts/${accountId}`);
  if (!r.ok) return false;
  const body = (await r.json()) as { evm_address?: string };
  return (body.evm_address ?? '').toLowerCase() === derivedEvm;
}

// Reuse-or-create a canonical agent account, persist its ids to .env under the given var names, associate USDC.
// Idempotent: reuses the .env account only when it is verifiably canonical; otherwise re-provisions (DEV-020).
export async function ensureCanonicalAgent(
  idEnv: string,
  keyEnv: string,
  evmEnv: string,
  tokenId: string,
  initialHbar = 5,
): Promise<CanonicalAccount> {
  const existingId = process.env[idEnv]?.trim();
  const existingKey = process.env[keyEnv]?.trim();
  const existingEvm = process.env[evmEnv]?.trim();
  if (existingId && existingKey && existingEvm) {
    if (await isCanonical(existingId, existingKey, existingEvm)) {
      return { accountId: existingId, keyDer: existingKey, evmAddress: existingEvm };
    }
    console.log(`  ${idEnv}=${existingId} is NOT canonical (evm alias != key-EVM) - re-provisioning (DEV-020)`);
  }

  const account = await createCanonicalAccount(initialHbar);
  await associate(account.accountId, account.keyDer, tokenId);
  upsertEnv({
    [idEnv]: account.accountId,
    [keyEnv]: account.keyDer,
    [evmEnv]: account.evmAddress,
  });
  process.env[idEnv] = account.accountId;
  process.env[keyEnv] = account.keyDer;
  process.env[evmEnv] = account.evmAddress;
  return account;
}
