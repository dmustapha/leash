// File: scripts/hedera/provision-spending-account.ts
// REFRAME [SKILL] S1 (per REFRAME-SCOPE §4-S1 + REF-2). Provisions the /app 2-of-2 co-signed Hedera
// SPENDING account: a NET-NEW `KeyList[agentPub, leashCoSignerPub]` threshold-2 account. This is a DISTINCT
// provisioning path — it does NOT reuse `ensureCanonicalAgent` and does NOT touch `provision-canonical.ts`
// (the frozen /demo single-key floor stays untouched, INVARIANT #10).
//
// ============================ SR-1 KEY-OWNERSHIP BOUNDARY (the linchpin) ============================
// The AGENT owns its Hedera keypair; LEASH must NEVER hold `agentPriv`. This script MAY generate a keypair
// FOR THE DEMO/TEST AGENT (an external process stand-in), but it persists that agent PRIVATE key ONLY to the
// clearly-external, agent-scoped env var `COSIGN_AGENT_KEY` — NEVER into `web/lib/config.ts` and NEVER into
// any var read by a `facilitator/` file. LEASH's runtime (facilitator + config) reads ONLY `LEASH_COSIGNER_KEY`
// (its own co-sign authority key) + the agent's PUBLIC key (`COSIGN_AGENT_PUB`). If LEASH ever read
// `COSIGN_AGENT_KEY`, the 2-of-2 would be theater and F-031 ("operator/LEASH-alone can't move funds") false.
// In production the agent supplies ONLY `agentPub` at register; the local generation here exists solely to
// drive the S-GATE / VM-3 live agent from one repo.
// ====================================================================================================
import {
  AccountCreateTransaction,
  TransferTransaction,
  TokenAssociateTransaction,
  KeyList,
  PrivateKey,
  PublicKey,
  AccountId,
  Hbar,
} from '@hiero-ledger/sdk';
import { hederaClient } from './client';
import { upsertEnv } from '../env';
import { assertCosignerDistinct } from '../../facilitator/cosign';

const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

export interface SpendingAccount {
  accountId: string;      // "0.0.N" — the KeyList threshold-2 spending account
  evmAddress: string;     // long-zero EVM facade 0x000...{N} (Privy funding target + ENS agentEvm)
  agentPublicKey: string; // agentPub (raw hex) — the ONLY agent key LEASH holds
  cosignerPublicKey: string;
}

// The long-zero EVM address of a Hedera entity `0.0.N` is 0x + N encoded as a 40-hex-char (20-byte) value
// (shard/realm 0). A KeyList account has NO key-derived alias (REF-2), so this deterministic facade IS its
// EVM address — the Privy funding target and the ENS `agentEvm` record.
export function longZeroEvm(accountId: string): string {
  const num = BigInt(accountId.split('.')[2]);
  return '0x' + num.toString(16).padStart(40, '0');
}

// Ensure LEASH's co-sign authority key exists (generate + persist a REAL ECDSA key if absent) and is DISTINCT
// from the operator/gas key (REF-3, asserted here AND at facilitator startup). Returns the cosigner PrivateKey.
export function ensureCosignerKey(): PrivateKey {
  let cosignerRaw = process.env.LEASH_COSIGNER_KEY?.trim();
  if (!cosignerRaw) {
    const generated = PrivateKey.generateECDSA();
    cosignerRaw = generated.toStringRaw();
    upsertEnv({ LEASH_COSIGNER_KEY: cosignerRaw });
    process.env.LEASH_COSIGNER_KEY = cosignerRaw;
    console.log('  generated a new LEASH_COSIGNER_KEY (co-sign authority key)');
  }
  // REF-3: co-sign authority key MUST differ from the gas fee-payer key (throws if equal).
  assertCosignerDistinct();
  return PrivateKey.fromStringECDSA(cosignerRaw);
}

// Resolve (or, for the DEMO/test agent only, generate) the agent keypair. SR-1: the private half is persisted
// ONLY to the external agent-scoped var COSIGN_AGENT_KEY; LEASH holds agentPub (COSIGN_AGENT_PUB) only.
function ensureAgentKeypair(): { agentPub: PublicKey; agentPrivRaw: string; agentPubRaw: string } {
  const existingPub = process.env.COSIGN_AGENT_PUB?.trim();
  const existingPriv = process.env.COSIGN_AGENT_KEY?.trim();
  if (existingPub) {
    return {
      agentPub: PublicKey.fromString(existingPub),
      agentPrivRaw: existingPriv ?? '',
      agentPubRaw: existingPub,
    };
  }
  // No pubkey on file — generate the demo/test agent keypair (external-agent stand-in, SR-1 boundary applies).
  const agentPriv = PrivateKey.generateECDSA();
  const agentPubRaw = agentPriv.publicKey.toStringRaw();
  const agentPrivRaw = agentPriv.toStringRaw();
  upsertEnv({ COSIGN_AGENT_PUB: agentPubRaw, COSIGN_AGENT_KEY: agentPrivRaw });
  process.env.COSIGN_AGENT_PUB = agentPubRaw;
  process.env.COSIGN_AGENT_KEY = agentPrivRaw;
  console.log('  generated the DEMO/test agent keypair (agentPriv -> COSIGN_AGENT_KEY, external-scoped; SR-1)');
  return { agentPub: agentPriv.publicKey, agentPrivRaw, agentPubRaw };
}

// Read the on-chain evm_address for the freshly created account (confirms the long-zero facade). Advisory.
async function readEvmAddress(accountId: string): Promise<string | null> {
  const r = await fetch(`${MIRROR_NODE}/accounts/${accountId}`);
  if (!r.ok) return null;
  const body = (await r.json()) as { evm_address?: string };
  return body.evm_address ?? null;
}

// Provision the KeyList threshold-2 spending account, associate USDC (signed by BOTH keys = threshold-2),
// and fund it. Idempotent by COSIGN_SPENDING_ACCOUNT presence in env.
export async function provisionSpendingAccount(opts: {
  tokenId?: string;
  initialHbar?: number;
  fundRawAmount?: string; // raw smallest-unit USDC to seed the account with (from the operator/treasury)
} = {}): Promise<SpendingAccount> {
  const tokenId = opts.tokenId ?? process.env.USDC_TOKEN_ID!;
  const initialHbar = opts.initialHbar ?? 5;
  const cosigner = ensureCosignerKey();
  const { agentPub, agentPrivRaw, agentPubRaw } = ensureAgentKeypair();
  const cosignerPubRaw = cosigner.publicKey.toStringRaw();

  // Idempotent: reuse an already-provisioned spending account.
  const existingId = process.env.COSIGN_SPENDING_ACCOUNT?.trim();
  const existingEvm = process.env.COSIGN_SPENDING_EVM?.trim();
  if (existingId && existingEvm) {
    console.log(`  reusing COSIGN_SPENDING_ACCOUNT=${existingId}`);
    return {
      accountId: existingId,
      evmAddress: existingEvm,
      agentPublicKey: agentPubRaw,
      cosignerPublicKey: cosignerPubRaw,
    };
  }

  const client = hederaClient();
  const agentPriv = agentPrivRaw ? PrivateKey.fromStringECDSA(agentPrivRaw) : null;

  // KeyList[agentPub, leashCoSignerPub], threshold = 2 (2-of-2). Order is stable (agent first).
  const keyList = new KeyList([agentPub, cosigner.publicKey], 2);

  // 1) Create the account. setKeyWithoutAlias -> no key-derived EVM alias (REF-2, long-zero facade).
  const createResp = await new AccountCreateTransaction()
    .setKeyWithoutAlias(keyList)
    .setInitialBalance(new Hbar(initialHbar))
    .execute(client);
  const accountId = (await createResp.getReceipt(client)).accountId!.toString();
  const evmAddress = longZeroEvm(accountId);
  console.log(`  created KeyList threshold-2 spending account ${accountId} (long-zero EVM ${evmAddress})`);

  // 2) Associate USDC. Association mutates the account, so it needs threshold-2: sign with BOTH keys.
  if (!agentPriv) {
    throw new Error(
      'COSIGN_AGENT_KEY is required to sign the threshold-2 association for the DEMO agent; in production the agent associates its own account.',
    );
  }
  const assocFrozen = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([tokenId])
    .freezeWith(client);
  const assocSigned = await (await assocFrozen.sign(agentPriv)).sign(cosigner);
  await (await assocSigned.execute(client)).getReceipt(client);
  console.log(`  associated USDC ${tokenId} (signed 2-of-2)`);

  // 3) Fund the account from the operator (treasury) so it can pay. Transfer to the account id directly.
  const fundRaw = opts.fundRawAmount ?? '20000000'; // default 20 USDC (6 decimals)
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const fundResp = await new TransferTransaction()
    .addTokenTransfer(tokenId, AccountId.fromString(operatorId), -BigInt(fundRaw))
    .addTokenTransfer(tokenId, AccountId.fromString(accountId), BigInt(fundRaw))
    .execute(client); // signed by the operator (the client's operator) — the sender.
  await fundResp.getReceipt(client);
  console.log(`  funded ${accountId} with ${fundRaw} raw USDC`);

  client.close();

  // Persist (SR-1: agentPriv stays in COSIGN_AGENT_KEY only, already written by ensureAgentKeypair).
  upsertEnv({
    COSIGN_SPENDING_ACCOUNT: accountId,
    COSIGN_SPENDING_EVM: evmAddress,
    COSIGN_AGENT_PUB: agentPubRaw,
  });
  process.env.COSIGN_SPENDING_ACCOUNT = accountId;
  process.env.COSIGN_SPENDING_EVM = evmAddress;

  const onChainEvm = await readEvmAddress(accountId);
  if (onChainEvm && onChainEvm.toLowerCase() !== evmAddress.toLowerCase()) {
    console.log(`  NOTE: mirror evm_address ${onChainEvm} != computed long-zero ${evmAddress} (using mirror)`);
  }

  return {
    accountId,
    evmAddress: (onChainEvm ?? evmAddress),
    agentPublicKey: agentPubRaw,
    cosignerPublicKey: cosignerPubRaw,
  };
}

// Direct-drive entry for the S-GATE / live provisioning.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  provisionSpendingAccount()
    .then((a) => {
      console.log('\nSPENDING ACCOUNT PROVISIONED:');
      console.log(JSON.stringify(a, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error('provision-spending-account FAILED:', e);
      process.exit(1);
    });
}
