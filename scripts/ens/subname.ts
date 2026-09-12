// File: scripts/ens/subname.ts
// [DP-1b RESOLVED 2026-09-12] Real PermissionedRegistry.register introspected from the deployed
// UserRegistry/ETHRegistry. Signature:
//   register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expiry) -> uint256
// (the placeholder's 6-arg shape was structurally correct but UNVERIFIED; confirmed here).
// tokenId (DP-1 item 3) = labelhash uint256(keccak256(label)) via tokenIdOf, NOT a positional-log guess.
// The roleBitmap is granted to the child `owner` on the child name's resource. Per INVARIANT #8 the
// child owner must hold SET_RESOLVER so it can write leash.policy; revoking SET_RESOLVER is the kill switch.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS, ROLE } from './addresses';
import { tokenIdOf } from './register-2ld';

const registryAbi = parseAbi([
  'function register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expiry) returns (uint256)',
]);

// Mint a child name owned by the agent's address in `registry`.
// parentName = the parent's full name (e.g. "acme.leash.eth") so the full child name + its tokenId are known.
export async function mintSubname(
  registry: `0x${string}`,
  label: string,
  parentName: string,
  agentAddress: `0x${string}`,
  expires: bigint,
): Promise<bigint> {
  const wallet = walletClient();
  // Child-owner bitmap: full control of the leaf name incl. SET_RESOLVER (write leash.policy) + admin variants.
  const ownerBitmap =
    ROLE.UNREGISTER | ROLE.RENEW | ROLE.SET_SUBREGISTRY | ROLE.SET_RESOLVER |
    (ROLE.UNREGISTER << 128n) | (ROLE.RENEW << 128n) | (ROLE.SET_SUBREGISTRY << 128n) | (ROLE.SET_RESOLVER << 128n);

  const hash = await wallet.writeContract({
    address: registry, abi: registryAbi, functionName: 'register',
    args: [label, agentAddress, registry, ENS.PublicResolverV2, ownerBitmap, expires],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success') throw new Error(`mintSubname(${label}.${parentName}) reverted`);

  // tokenId via the confirmed labelhash scheme (tokenIdOf), NOT a positional-log guess.
  return tokenIdOf(`${label}.${parentName}`);
}
