// File: scripts/ens/subregistry.ts
// [DP-1b RESOLVED 2026-09-12] Real VerifiableFactory + UserRegistry (PermissionedRegistry) ABIs
// introspected from the deployed contracts. Corrections vs the ARCHITECTURE placeholder:
//   - VerifiableFactory.deployProxy(address implementation,uint256 salt,bytes data) -> address
//     (NOT deploy(address,bytes)). The proxy address is the RETURN value, not receipt.contractAddress.
//   - UserRegistry is a UUPS proxy: `data` must be the encoded initialize(address rootAccount,uint256 roleBitmap)
//     call. Without it the proxy is uninitialized and every register() reverts.
//   - The parent registry (ETHRegistry for a .eth 2LD; a UserRegistry for deeper levels) wires the child
//     registry under the parent name via setSubregistry(uint256 anyId,address registry). `anyId` accepts
//     the labelhash (version bits zeroed internally), so the labelhash tokenId from tokenIdOf works.
//   - grantRoles(uint256 anyId,uint256 roleBitmap,address account) is on the NEW child registry's ROOT
//     resource; the deployer already receives root roles from initialize, so no extra grant is required
//     for the deployer to mint. We keep an explicit ROLE_REGISTRAR grant for clarity/idempotence.
import { parseAbi, encodeFunctionData } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS, ROLE } from './addresses';

const factoryAbi = parseAbi([
  'function deployProxy(address implementation,uint256 salt,bytes data) returns (address)',
]);

const userRegistryInitAbi = parseAbi([
  'function initialize(address rootAccount,uint256 roleBitmap)',
]);

const parentRegistryAbi = parseAbi([
  'function setSubregistry(uint256 anyId,address registry)',
  'function grantRoles(uint256 anyId,uint256 roleBitmap,address account) returns (bool)',
  'function getSubregistry(string label) view returns (address)',
]);

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

const childRegistryAbi = parseAbi([
  'function grantRootRoles(uint256 roleBitmap,address account) returns (bool)',
]);

// Root role bitmap granted to the deployer on the new UserRegistry so it can mint + wire children.
const ROOT_ROLES =
  ROLE.REGISTRAR | ROLE.UNREGISTER | ROLE.RENEW | ROLE.SET_SUBREGISTRY | ROLE.SET_RESOLVER |
  (ROLE.REGISTRAR << 128n) | (ROLE.UNREGISTER << 128n) | (ROLE.RENEW << 128n) |
  (ROLE.SET_SUBREGISTRY << 128n) | (ROLE.SET_RESOLVER << 128n);

// Deploy an org UserRegistry (UUPS proxy) and wire it under `parentTokenId` in `parentRegistry`
// so the parent name can mint children. Defaults the parent to the canonical ETHRegistry (.eth 2LD case).
export async function deploySubregistry(
  parentTokenId: bigint,
  parentRegistry: `0x${string}` = ENS.ETHRegistry,
  parentLabel?: string,
): Promise<`0x${string}`> {
  const wallet = walletClient();
  const owner = wallet.account.address;

  // Resume-safety: if a subregistry is already wired under this parent name, reuse it (avoid a duplicate
  // deterministic deploy that would revert, and a wasted setSubregistry tx).
  // [DEV-007] getSubregistry returns the PARENT REGISTRY ITSELF (self-reference) for a registered name
  // whose custom subregistry is not yet set (observed on-chain: getSubregistry('leash') on the ETHRegistry
  // returns the ETHRegistry address, not zero). Treat that self-reference as "unset", else setup would
  // return the ETHRegistry as the org-parent and mint children into the wrong registry.
  if (parentLabel) {
    const existing = (await publicClient.readContract({ address: parentRegistry, abi: parentRegistryAbi, functionName: 'getSubregistry', args: [parentLabel] })) as `0x${string}`;
    const isUnset = !existing || existing.toLowerCase() === ZERO_ADDR || existing.toLowerCase() === parentRegistry.toLowerCase();
    if (!isUnset) return existing;
  }

  const initData = encodeFunctionData({ abi: userRegistryInitAbi, functionName: 'initialize', args: [owner, ROOT_ROLES] });
  const salt = BigInt(parentTokenId) & ((1n << 96n) - 1n); // stable per-parent salt

  // deployProxy RETURNS the proxy address. Simulate ONLY to capture the deterministic return value,
  // then issue the write via the local-account walletClient (eth_sendRawTransaction). Reusing the
  // simulate `request` would route through eth_sendTransaction, which the RPC rejects (no unlocked key).
  const { result: registry } = await publicClient.simulateContract({
    address: ENS.VerifiableFactory, abi: factoryAbi, functionName: 'deployProxy',
    args: [ENS.UserRegistryImpl, salt, initData], account: owner,
  });
  const deployHash = await wallet.writeContract({
    address: ENS.VerifiableFactory, abi: factoryAbi, functionName: 'deployProxy',
    args: [ENS.UserRegistryImpl, salt, initData],
  });
  await publicClient.waitForTransactionReceipt({ hash: deployHash });

  // Wire the child registry under the parent name.
  const set = await wallet.writeContract({ address: parentRegistry, abi: parentRegistryAbi, functionName: 'setSubregistry', args: [parentTokenId, registry as `0x${string}`] });
  await publicClient.waitForTransactionReceipt({ hash: set });

  // Idempotent: ensure the deployer holds the registrar role on the child's root resource.
  const grant = await wallet.writeContract({ address: registry as `0x${string}`, abi: childRegistryAbi, functionName: 'grantRootRoles', args: [ROLE.REGISTRAR | (ROLE.REGISTRAR << 128n), owner] });
  await publicClient.waitForTransactionReceipt({ hash: grant });

  return registry as `0x${string}`;
}
