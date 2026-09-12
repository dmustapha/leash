// File: scripts/ens/roles.ts
// [DP-1b CONFIRMED 2026-09-12] Real PermissionedRegistry role ABI introspected from the deployed
// registries. grantRoles/revokeRoles(uint256 anyId,uint256 roleBitmap,address account) return bool.
// `anyId` accepts the labelhash (version bits zeroed internally), matching tokenIdOf.
// Revoking SET_RESOLVER is the structural kill switch (INVARIANT #8): it removes both the ability to
// write leash.policy and the resolver-set authority on the name.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';

const registryAbi = parseAbi([
  'function grantRoles(uint256 anyId,uint256 roleBitmap,address account) returns (bool)',
  'function revokeRoles(uint256 anyId,uint256 roleBitmap,address account) returns (bool)',
  'function hasRoles(uint256 anyId,uint256 roleBitmap,address account) view returns (bool)',
]);

// Read whether `account` holds ALL roles in `bitmap` on the name `tokenId` in `registry`. Used by the WS-7 C1
// co-hold verification (F-023): assert BOTH the user's embedded wallet AND the relayer/agent hold the role.
export async function hasRoles(registry: `0x${string}`, tokenId: bigint, bitmap: bigint, account: `0x${string}`): Promise<boolean> {
  return (await publicClient.readContract({
    address: registry, abi: registryAbi, functionName: 'hasRoles', args: [tokenId, bitmap, account],
  })) as boolean;
}

export async function grantRoles(registry: `0x${string}`, tokenId: bigint, bitmap: bigint, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: registry, abi: registryAbi, functionName: 'grantRoles', args: [tokenId, bitmap, account] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function revokeRoles(registry: `0x${string}`, tokenId: bigint, bitmap: bigint, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: registry, abi: registryAbi, functionName: 'revokeRoles', args: [tokenId, bitmap, account] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
