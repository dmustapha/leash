// File: scripts/ens/policy.ts
// [R-2 RESOLVED 2026-09-12] leash.policy is written to / read from a deployed PermissionedResolver
// proxy, NOT the shared PublicResolverV2.
//
// Why not PublicResolverV2 (0xd25f...): its write auth is canModifyName(node,caller) ->
// NAME_WRAPPER.names(node) -> LibRegistry.findOwner(ROOT_REGISTRY,...). For a name that lives in a
// SELF-DEPLOYED UserRegistry the NameWrapper does not know the node, so names(node).length == 0 and
// every setText reverts (confirmed on-chain: setText on 0xd25f... reverted for data.acme.leash.eth).
//
// The working path (mirrors ensdomains/namechain contracts/script/testNames/resolver.ts): deploy a
// PermissionedResolver proxy via the VerifiableFactory, initialized with the deployer holding ROOT
// roles, then setResolver(childTokenId, thatResolver) on the child's registry and setText/text on it.
// setText passes onlyPartRoles because the deployer holds ROLE_SET_TEXT(_ADMIN) on ROOT_RESOURCE.
//
// facilitator/ens-read.ts MUST read via the SAME primitive (this resolver's text()) so the enforcement
// read path is byte-identical to what is proven here. The resolver address is persisted as
// POLICY_RESOLVER in .env by ensurePolicyResolver().
import { parseAbi, namehash, encodeFunctionData } from 'viem';
import { appendFileSync, readFileSync, existsSync } from 'fs';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';
import { tokenIdOf } from './register-2ld';
import type { AgentPolicy } from '../../types';

const POLICY_KEY = 'leash.policy';

// PermissionedResolver EAC role bitmap granting the admin every role (nibble pattern), matching
// namechain deploy-constants ROLES.ALL. The deployer becomes the resolver's root authority.
const RESOLVER_ROLES_ALL = 0x1111111111111111111111111111111111111111111111111111111111111111n;

const resolverAbi = parseAbi([
  'function setText(bytes32 node,string key,string value)',
  'function text(bytes32 node,string key) view returns (string)',
]);
const resolverInitAbi = parseAbi(['function initialize(address admin,uint256 roleBitmap,bytes[] setters)']);
const factoryAbi = parseAbi(['function deployProxy(address implementation,uint256 salt,bytes data) returns (address)']);
const registrySetResolverAbi = parseAbi([
  'function setResolver(uint256 anyId,address resolver)',
  'function getResolver(string label) view returns (address)',
]);

// Deploy (once) and persist the policy PermissionedResolver proxy. Idempotent: reuses POLICY_RESOLVER.
export async function ensurePolicyResolver(): Promise<`0x${string}`> {
  const existing = process.env.POLICY_RESOLVER as `0x${string}` | undefined;
  if (existing && existing.startsWith('0x') && existing.length === 42) return existing;

  const wallet = walletClient();
  const owner = wallet.account.address;
  const initData = encodeFunctionData({ abi: resolverInitAbi, functionName: 'initialize', args: [owner, RESOLVER_ROLES_ALL, []] });
  const salt = BigInt(namehash('leash.policy.resolver')) & ((1n << 96n) - 1n);

  const { result: resolver } = await publicClient.simulateContract({
    address: ENS.VerifiableFactory, abi: factoryAbi, functionName: 'deployProxy',
    args: [ENS.PermissionedResolverImpl, salt, initData], account: owner,
  });
  const hash = await wallet.writeContract({
    address: ENS.VerifiableFactory, abi: factoryAbi, functionName: 'deployProxy',
    args: [ENS.PermissionedResolverImpl, salt, initData],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const addr = resolver as `0x${string}`;
  const envText = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
  if (!new RegExp(`^POLICY_RESOLVER=.+$`, 'm').test(envText)) {
    appendFileSync('.env', `\nPOLICY_RESOLVER=${addr}\n`);
  }
  process.env.POLICY_RESOLVER = addr;
  return addr;
}

// Point the child name at the policy resolver in its registry, if not already set. `registry` is the
// UserRegistry the child was minted in (SANDBOX_REGISTRY for data|payments); `label` the leaf label.
async function ensureNameResolver(registry: `0x${string}`, label: string, resolver: `0x${string}`): Promise<void> {
  const cur = (await publicClient.readContract({ address: registry, abi: registrySetResolverAbi, functionName: 'getResolver', args: [label] })) as `0x${string}`;
  if (cur && cur.toLowerCase() === resolver.toLowerCase()) return;
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: registry, abi: registrySetResolverAbi, functionName: 'setResolver', args: [tokenIdOf(label), resolver] });
  await publicClient.waitForTransactionReceipt({ hash });
}

// Write the leash.policy text record for `name`. `registry`/`label` locate the name so its resolver of
// record can be pointed at the policy resolver (required for the resolver to accept the write + read).
export async function setPolicy(name: string, policy: AgentPolicy, registry: `0x${string}`, label: string): Promise<`0x${string}`> {
  const resolver = await ensurePolicyResolver();
  await ensureNameResolver(registry, label, resolver);
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: resolver, abi: resolverAbi, functionName: 'setText', args: [namehash(name), POLICY_KEY, JSON.stringify(policy)] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Read-back check (PRD-W5): the SAME primitive facilitator/ens-read.ts uses - text() on the policy
// resolver keyed by namehash(name) + 'leash.policy'. Returns null on an empty/cleared record.
export async function readPolicy(name: string): Promise<AgentPolicy | null> {
  const resolver = await ensurePolicyResolver();
  const raw = await publicClient.readContract({ address: resolver, abi: resolverAbi, functionName: 'text', args: [namehash(name), POLICY_KEY] });
  const s = raw as string;
  return s && s.trim() !== '' ? (JSON.parse(s) as AgentPolicy) : null;
}
