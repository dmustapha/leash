// File: web/lib/console.ts
// [Task 5.4b] Server-only helpers for the real console (/app). Lives in web/lib (NOT /app) but is imported
// ONLY by the console API routes - the /demo tree and /api/demo never import it (INVARIANT #10 isolation).
//
// It composes the PROVEN rails (scripts/ens/*, scripts/hedera/*, relayer/relay, db/*) - it reimplements no
// rail. Two heavy server-side flows the console needs:
//   1. provisionOrg      - mint the user's org subname under the root + deploy its UserRegistry (relayer gas).
//   2. provisionAgentAccount - create a CANONICAL Hedera account (setECDSAKeyWithAlias) + associate + fund,
//      matching the DEV-020 one-account model so fund -> pay -> ENS all target the SAME account.
//
// INVARIANT #3: nothing here is read on an enforcement path. The facilitator always reads the live ENS
// record. The DB writes are index-only bookkeeping for the console's multi-tenant list.
//
// This module is server-only by construction: it is imported ONLY by the console route handlers (which never
// run on the client) and it pulls in the Hedera SDK + viem wallet client. It is never imported by any 'use
// client' component, so no 'server-only' guard package is required.
import { AccountId, TransferTransaction, TokenId } from '@hiero-ledger/sdk';
import type { agents as agentsTable } from '../../db/schema';
import { deploySubregistry } from '../../scripts/ens/subregistry';
import { mintSubname } from '../../scripts/ens/subname';
import { tokenIdOf } from '../../scripts/ens/register-2ld';
import { ensureCanonicalAgent } from '../../scripts/hedera/provision-canonical';
import { hederaClient } from '../../scripts/hedera/client';
import { publicClient } from '../../scripts/ens/client';
import { parseAbi } from 'viem';
import { config } from './config';

const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';
const ownerReadAbi = parseAbi(['function findOwner(string label) view returns (address)']);
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

export interface ProvisionedOrg {
  ensName: string;         // <org>.<root>.eth
  registry: `0x${string}`; // the org's own UserRegistry (where its agents are minted)
  mintTx: string;          // subname mint (0 if already minted)
}

// Provision the user's org: mint <org> under the root (leash.eth) in the ROOT's UserRegistry, then deploy the
// org's own UserRegistry so agents can be minted beneath it. The subname is minted to the DEPLOYER address so
// the sponsor key retains the SET_SUBREGISTRY authority needed to wire the child registry (relayer scope: the
// name is always under the root the deployer controls). Idempotent: reuses an already-minted org + registry.
export async function provisionOrg(orgLabel: string): Promise<ProvisionedOrg> {
  const root = config.root; // leash.eth
  const rootParentRegistry = process.env.SANDBOX_ORG_PARENT_REGISTRY as `0x${string}`;
  const deployer = process.env.LEASH_DEPLOYER_ADDRESS as `0x${string}`;
  if (!rootParentRegistry) throw new Error('SANDBOX_ORG_PARENT_REGISTRY not provisioned (run scripts/setup.ts)');

  const orgFullName = `${orgLabel}.${root}`;
  const oneYear = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);

  // Mint the org subname only if not already owned in the root registry (resume-safe, no double-mint).
  const cur = (await publicClient.readContract({
    address: rootParentRegistry, abi: ownerReadAbi, functionName: 'findOwner', args: [orgLabel],
  })) as `0x${string}`;
  let mintTx = '0';
  if (!cur || cur.toLowerCase() === ZERO_ADDR) {
    mintTx = (await mintSubname(rootParentRegistry, orgLabel, root, deployer, oneYear)).toString();
  }

  // Deploy (or reuse) the org's own UserRegistry under the org name.
  const orgTokenId = tokenIdOf(orgFullName);
  const registry = await deploySubregistry(orgTokenId, rootParentRegistry, orgLabel);
  return { ensName: orgFullName, registry, mintTx };
}

export interface ProvisionedAgent {
  accountId: string;   // canonical Hedera account "0.0.x" (payer + policy binding)
  keyDer: string;      // agent ECDSA DER key (custody signer for the x402 pay rail)
  evmAddress: string;  // key-derived EVM alias == funding target == payer account
}

// Create a canonical Hedera account for a new console agent and fund it with real USDC so it can actually pay
// gas-free (mirrors seed-demo's canonical + funding model, DEV-020). Uses UNIQUE env var names per agent so
// ensureCanonicalAgent always creates a fresh account (the console mints many; the seed reused two fixed ones).
export async function provisionAgentAccount(fundRaw = 50_000_000): Promise<ProvisionedAgent> {
  const tokenId = config.usdcTokenId;
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const account = await ensureCanonicalAgent(
    `CONSOLE_AGENT_ID_${suffix}`, `CONSOLE_AGENT_KEY_${suffix}`, `CONSOLE_AGENT_EVM_${suffix}`, tokenId,
  );
  await fundAgentUsdc(account.accountId, tokenId, fundRaw);
  return { accountId: account.accountId, keyDer: account.keyDer, evmAddress: account.evmAddress };
}

// Read an account's raw USDC balance from the mirror node (0 if not associated / not indexed yet).
async function usdcBalance(hederaId: string, tokenId: string): Promise<number> {
  const r = await fetch(`${MIRROR_NODE}/accounts/${hederaId}/tokens?token.id=${tokenId}`);
  if (!r.ok) return 0;
  const body = (await r.json()) as { tokens?: Array<{ balance: number }> };
  return body.tokens?.[0]?.balance ?? 0;
}

// Fund a new agent up to `targetRaw` with REAL USDC from the operator treasury (only tops up the shortfall).
async function fundAgentUsdc(agentId: string, tokenId: string, targetRaw: number): Promise<void> {
  const current = await usdcBalance(agentId, tokenId);
  if (current >= targetRaw) return;
  const shortfall = targetRaw - current;
  const client = hederaClient();
  try {
    const tx = await new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(process.env.HEDERA_OPERATOR_ID!), -shortfall)
      .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(agentId), shortfall)
      .execute(client);
    const receipt = await tx.getReceipt(client);
    if (receipt.status.toString() !== 'SUCCESS') throw new Error(`fund ${agentId}: ${receipt.status.toString()}`);
  } finally {
    client.close();
  }
}

// Strip the custody key from an agent row before it leaves the server (never send agentKey to the client) and
// parse the allowlist JSON into an array for the UI.
export function publicAgent(a: typeof agentsTable.$inferSelect) {
  const { agentKey, ...safe } = a;
  void agentKey;
  return { ...safe, allowedPayees: JSON.parse(safe.allowedPayees) as string[] };
}

export type PublicAgent = ReturnType<typeof publicAgent>;
