// File: scripts/ens/erc8004.ts
// REFRAME [SKILL] R1 (per REFRAME-SCOPE §4-R1 + REF-5). On-chain-RESOLVED external identity via the canonical
// ERC-8004 Identity Registry on Ethereum Sepolia (`config.erc8004Registry` = 0x8004A818…). This is an ADVISORY
// resolve, NEVER an enforcement input — the facilitator authorize path reads ONLY `leash.policy` (INVARIANT #13).
//
// ============================ HONESTY (REF-5 — "on-chain-resolved", NOT "verified") ============================
// `ownerOf(agentId)` returns the ERC-721 owner of the AgentIdentity token. This RESOLVES the on-chain owner; it
// does NOT prove the registrant controls that address (no signature challenge). So everything here is labeled
// "on-chain-resolved" and stays advisory. Proof-of-control = roadmap (see LIMITATIONS).
// ================================================================================================================
//
// LIVE ABI FINDING (verified against the real contract at build, 2026-09-12): the registry at 0x8004A818… is an
// ERC-721 `AgentIdentity` (symbol `AGENT`). The scope named `ownerOf` / `getAgentWallet`; both exist on the live
// contract. The resolution function is `ownerOf(uint256)` (reverts for a nonexistent agentId — the clean
// "unknown" path). `getAgentWallet(uint256)` returns the agent's DECLARED wallet (0x0 when unset), advisory only.
// `getAgent(...)` / `agentWallet(...)` / `resolveByAgentId(...)` from earlier drafts do NOT exist — DEV-R1-ABI.
import { createPublicClient, http, parseAbi, isAddress, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { config } from '../../web/lib/config';

// Ethereum Sepolia chain id (CAIP-2 namespace for the erc8004 pointer we write as an ENS text record).
const SEPOLIA_CHAIN_ID = 11155111;
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// The REAL, live-verified interface (a strict subset of what the deployed contract exposes).
const registryAbi = parseAbi([
  'function ownerOf(uint256 agentId) view returns (address)',
  'function getAgentWallet(uint256 agentId) view returns (address)',
]);

function registryClient() {
  const rpc = process.env.SEPOLIA_RPC_URL;
  if (!rpc) throw new Error('SEPOLIA_RPC_URL is required to resolve the ERC-8004 registry');
  return createPublicClient({ chain: sepolia, transport: http(rpc) });
}

export interface ResolvedIdentity {
  resolvedOwner: `0x${string}`;      // ownerOf(agentId), on-chain-resolved (NOT proof-of-control)
  declaredWallet: `0x${string}` | null; // getAgentWallet(agentId) if set (advisory), else null
  agentId: string | null;            // the resolved ERC-8004 agentId as a decimal string (null for evm-only)
  caip: string | null;               // CAIP-10-ish pointer eip155:11155111:<owner> for the ENS erc8004 record
  source: 'erc8004' | 'evm';         // whether resolution was rooted in an on-chain agentId or a supplied EVM
}

// CAIP form written into the ENS `erc8004` text record: eip155:<chainId>/erc721:<registry>/<agentId> when an
// agentId is known; falls back to a plain eip155 account pointer for evm-only binds.
export function toCaip(registry: `0x${string}`, agentId: string | null, owner: `0x${string}`): string {
  if (agentId !== null) return `eip155:${SEPOLIA_CHAIN_ID}/erc721:${getAddress(registry)}/${agentId}`;
  return `eip155:${SEPOLIA_CHAIN_ID}:${getAddress(owner)}`;
}

// Resolve the on-chain owner/wallet for an ERC-8004 agentId and/or validate a supplied EVM address.
//   - agentId given: `ownerOf(agentId)` resolves the owner (unknown/nonexistent agentId ⇒ clear error).
//   - evmAddress ALSO given: it MUST equal the on-chain-resolved owner OR the declared wallet, else a clear
//     owner-mismatch error (REF-5, the required mismatch path) — NO binding proceeds on a mismatch.
//   - evmAddress only (no agentId): a plain on-chain-unrooted bind (source:'evm'); the address is checksum-
//     validated and returned as the resolvedOwner. Honest: NOT registry-resolved, still advisory.
export async function resolveExternalIdentity(input: {
  agentId?: string | number | bigint;
  evmAddress?: string;
}): Promise<ResolvedIdentity> {
  const registry = config.erc8004Registry;
  const suppliedEvm = input.evmAddress?.trim();
  if (suppliedEvm && !isAddress(suppliedEvm)) {
    throw new Error(`erc8004: supplied evmAddress "${suppliedEvm}" is not a valid EVM address`);
  }
  const suppliedOwner = suppliedEvm ? getAddress(suppliedEvm) : null;

  const hasAgentId =
    input.agentId !== undefined && input.agentId !== null && String(input.agentId).trim() !== '';

  // EVM-only bind (no agentId): no registry read, advisory checksum-validated address.
  if (!hasAgentId) {
    if (!suppliedOwner) {
      throw new Error('erc8004: resolveExternalIdentity requires an agentId and/or an evmAddress');
    }
    return {
      resolvedOwner: suppliedOwner,
      declaredWallet: null,
      agentId: null,
      caip: toCaip(registry, null, suppliedOwner),
      source: 'evm',
    };
  }

  // agentId path: parse to a non-negative integer, then resolve on-chain.
  let id: bigint;
  try {
    id = BigInt(String(input.agentId).trim());
    if (id < 0n) throw new Error('negative');
  } catch {
    throw new Error(`erc8004: agentId "${String(input.agentId)}" is not a valid non-negative integer`);
  }

  const client = registryClient();
  let resolvedOwner: `0x${string}`;
  try {
    resolvedOwner = getAddress(
      (await client.readContract({
        address: registry, abi: registryAbi, functionName: 'ownerOf', args: [id],
      })) as `0x${string}`,
    );
  } catch {
    // ERC-721 ownerOf reverts for a nonexistent token ⇒ the agentId is unknown on this registry.
    throw new Error(`erc8004: agentId ${id.toString()} is not registered on ${registry} (unknown/nonexistent)`);
  }

  // Advisory declared-wallet read (0x0 when unset).
  let declaredWallet: `0x${string}` | null = null;
  try {
    const w = getAddress(
      (await client.readContract({
        address: registry, abi: registryAbi, functionName: 'getAgentWallet', args: [id],
      })) as `0x${string}`,
    );
    declaredWallet = w.toLowerCase() === ZERO_ADDR ? null : w;
  } catch {
    declaredWallet = null; // advisory; a revert here does not fail the resolve
  }

  // Owner-mismatch path (REF-5, REQUIRED): if the caller supplied an owner/EVM, it must match either the
  // on-chain-resolved owner or the declared wallet, else a clear error — NO binding proceeds.
  if (suppliedOwner) {
    const matchesOwner = suppliedOwner.toLowerCase() === resolvedOwner.toLowerCase();
    const matchesWallet = declaredWallet !== null && suppliedOwner.toLowerCase() === declaredWallet.toLowerCase();
    if (!matchesOwner && !matchesWallet) {
      throw new Error(
        `erc8004: owner mismatch for agentId ${id.toString()} — supplied ${suppliedOwner} is neither the ` +
          `on-chain-resolved owner ${resolvedOwner}` +
          (declaredWallet ? ` nor the declared wallet ${declaredWallet}` : '') +
          ' (on-chain-resolved, not proof-of-control)',
      );
    }
  }

  return {
    resolvedOwner,
    declaredWallet,
    agentId: id.toString(),
    caip: toCaip(registry, id.toString(), resolvedOwner),
    source: 'erc8004',
  };
}
