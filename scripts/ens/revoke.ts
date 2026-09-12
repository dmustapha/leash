// File: scripts/ens/revoke.ts
// [DP-1b CONFIRMED 2026-09-12 / R-2 RESOLVED] The two revocation modes, each one Sepolia tx.
//   Mode A (fast kill): clear the leash.policy text record -> facilitator's live read returns empty -> REVOKED.
//   Mode B (structural kill): revoke the SET_RESOLVER (+ SET_SUBREGISTRY) EAC role -> removes write authority
//   over the record AND the resolver on the name (INVARIANT #8). Uses the real revokeRoles ABI via roles.ts.
// Mode A writes the empty record on the SAME deployed PermissionedResolver used by policy.ts (POLICY_RESOLVER),
// not PublicResolverV2 - see policy.ts for why the shared resolver reverts on self-deployed-registry names.
import { parseAbi, namehash } from 'viem';
import { publicClient, walletClient } from './client';
import { ROLE } from './addresses';
import { revokeRoles } from './roles';
import { ensurePolicyResolver } from './policy';

const resolverAbi = parseAbi(['function setText(bytes32 node,string key,string value)']);

// Mode A: clear the policy text record (fastest kill; facilitator reads empty -> REVOKED).
export async function clearPolicy(name: string): Promise<`0x${string}`> {
  const resolver = await ensurePolicyResolver();
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: resolver, abi: resolverAbi, functionName: 'setText', args: [namehash(name), 'leash.policy', ''] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Mode B: revoke the SET_RESOLVER (+ SET_SUBREGISTRY) role (structural kill of write authority + spend).
export async function revokeAgent(registry: `0x${string}`, tokenId: bigint, agentAddress: `0x${string}`): Promise<`0x${string}`> {
  return revokeRoles(registry, tokenId, ROLE.SET_RESOLVER | ROLE.SET_SUBREGISTRY, agentAddress);
}
