// File: scripts/ens/cohold.ts
// [WS-7 C1 / INVARIANT #8+#12] The additive co-hold kill switch. The REAL revoke on this deployment is
// clearPolicy = setText(namehash(name), 'leash.policy', '') on the PermissionedResolver (R-2 / DEV-008). So the
// role that gates the kill switch is ROLE_SET_TEXT on that resolver, SCOPED to the agent name's leash.policy
// part-resource: resource(namehash(name), keccak256('leash.policy')).
//
// The deployer/relayer is the resolver ROOT admin (ensurePolicyResolver initialized it with all roles on
// ROOT_RESOURCE), so it holds ROLE_SET_TEXT_ADMIN on ROOT and can GRANT ROLE_SET_TEXT on any specific
// part-resource - gaslessly (the relayer signs). Granting it to the user's embedded-wallet address gives the
// user genuine on-chain authority to clear their agent's policy (a real kill switch), CONFINED to that agent's
// leash.policy key (never the parent/org registry, never another tenant - B-03). It is ADDITIVE: the relayer
// keeps the role via ROOT, so BOTH hold it after (F-023 asserts both on the same part-resource).
import { parseAbi, namehash, keccak256, toBytes, encodeAbiParameters, toHex } from 'viem';
import { publicClient, walletClient } from './client';

// PermissionedResolverLib: ROLE_SET_TEXT = 1 << 4. The kill-switch role on the resolver.
export const ROLE_SET_TEXT = 1n << 4n;
const POLICY_KEY = 'leash.policy';

// PermissionedResolver grants must go through the scoped `authorize*Roles` API - it OVERRIDES the raw EAC
// grantRoles/revokeRoles to always revert (forcing name/part-scoped grants). `hasRoles` (view) is inherited.
const resolverAbi = parseAbi([
  'function authorizeTextRoles(bytes toName,string key,address account,bool grant) returns (bool)',
  'function hasRoles(uint256 resource,uint256 roleBitmap,address account) view returns (bool)',
]);

function policyResolver(): `0x${string}` {
  const r = process.env.POLICY_RESOLVER as `0x${string}` | undefined;
  if (!r || !r.startsWith('0x') || r.length !== 42) throw new Error('POLICY_RESOLVER not set (run scripts/setup.ts)');
  return r;
}

// DNS wire encoding (NameCoder format): each label prefixed by its byte length, terminated by a 0 byte.
function dnsEncode(name: string): `0x${string}` {
  const out: number[] = [];
  for (const label of name.split('.')) {
    const b = toBytes(label);
    if (b.length > 255) throw new Error(`label too long: ${label}`);
    out.push(b.length, ...b);
  }
  out.push(0);
  return toHex(Uint8Array.from(out));
}

// resource(node, part) = uint256(keccak256(abi.encode(node, part))) - the leash.policy part-resource for `name`.
export function policyPartResource(name: string): bigint {
  const node = namehash(name);
  const part = keccak256(toBytes(POLICY_KEY)); // PermissionedResolverLib.partHash('leash.policy')
  const packed = encodeAbiParameters([{ type: 'bytes32' }, { type: 'bytes32' }], [node, part]);
  return BigInt(keccak256(packed));
}

// Grant the co-hold kill switch for `name`'s leash.policy to `account` (relayer-sponsored, additive). Uses the
// resolver's scoped authorizeTextRoles: grants ROLE_SET_TEXT on resource(namehash(name), partHash('leash.policy')).
export async function grantPolicyCohold(name: string, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({
    address: policyResolver(), abi: resolverAbi, functionName: 'authorizeTextRoles',
    args: [dnsEncode(name), POLICY_KEY, account, true],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Revoke a co-hold (used by the live test cleanup so the demo state is restored).
export async function revokePolicyCohold(name: string, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({
    address: policyResolver(), abi: resolverAbi, functionName: 'authorizeTextRoles',
    args: [dnsEncode(name), POLICY_KEY, account, false],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Does `account` hold the kill-switch role for `name`'s leash.policy? (hasRoles includes the ROOT_RESOURCE
// fallback, so the relayer/deployer reads true here too - which is exactly the additive co-hold assertion.)
export async function hasPolicyCohold(name: string, account: `0x${string}`): Promise<boolean> {
  return (await publicClient.readContract({
    address: policyResolver(), abi: resolverAbi, functionName: 'hasRoles',
    args: [policyPartResource(name), ROLE_SET_TEXT, account],
  })) as boolean;
}
