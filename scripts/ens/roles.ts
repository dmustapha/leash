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
]);

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
