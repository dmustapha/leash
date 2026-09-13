// File: scripts/ens/identity.ts
// [WS-7 D1] ENS agent-identity text records. Alongside the enforcement record `leash.policy`, each agent child
// carries ADVISORY identity keys on the SAME PermissionedResolver: agent.description, agent.type, avatar, and an
// optional ERC-8004 pointer (erc8004). These are for humans + directories - they are NEVER read on any
// enforcement path (INVARIANT #13). The facilitator import graph imports no identity reader (asserted by
// facilitator/identity-isolation.integration.ts). This module is used ONLY by the console register route + the
// /proof + demo surfaces, never by facilitator/*.
import { parseAbi, namehash } from 'viem';
import { publicClient, walletClient } from './client';
import { ensurePolicyResolver } from './policy';

// The advisory identity keys. `leash.policy` is deliberately NOT here - identity and enforcement are separate.
export const IDENTITY_KEYS = {
  description: 'agent.description',
  type: 'agent.type',
  avatar: 'avatar',
  erc8004: 'erc8004',
  // [REFRAME R2] the on-chain-RESOLVED external EVM owner/wallet (advisory, INVARIANT #13). "on-chain-resolved",
  // NOT "verified" — ownerOf does not prove control. Written on the register-EXISTING (bind) path only.
  address: 'agent.address',
} as const;

export interface AgentIdentity {
  description?: string;
  type?: string;
  avatar?: string;
  erc8004?: string; // optional ERC-8004 identity-registry pointer (CAIP; advisory)
  address?: string; // optional on-chain-resolved external EVM address (advisory)
}

const resolverAbi = parseAbi([
  'function setText(bytes32 node,string key,string value)',
  'function text(bytes32 node,string key) view returns (string)',
]);

// Write the advisory identity text records for `name` (relayer-sponsored). The name's resolver of record is
// already the policy resolver (set when the policy was written at register). Only non-empty fields are written.
// Returns the tx hash per key written.
export async function writeIdentity(name: string, identity: AgentIdentity): Promise<{ key: string; tx: string }[]> {
  const resolver = await ensurePolicyResolver();
  const wallet = walletClient();
  const node = namehash(name);
  const out: { key: string; tx: string }[] = [];
  for (const [field, key] of Object.entries(IDENTITY_KEYS)) {
    const value = identity[field as keyof AgentIdentity];
    if (!value) continue;
    const hash = await wallet.writeContract({
      address: resolver, abi: resolverAbi, functionName: 'setText', args: [node, key, value],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    out.push({ key, tx: hash });
  }
  return out;
}

// Read the advisory identity text records for `name` (used by /app, /proof, demo). Empty strings map to undefined.
export async function readIdentity(name: string): Promise<AgentIdentity> {
  const resolver = await ensurePolicyResolver();
  const node = namehash(name);
  const read = async (key: string) =>
    (await publicClient.readContract({ address: resolver, abi: resolverAbi, functionName: 'text', args: [node, key] })) as string;
  const [description, type, avatar, erc8004, address] = await Promise.all([
    read(IDENTITY_KEYS.description), read(IDENTITY_KEYS.type), read(IDENTITY_KEYS.avatar), read(IDENTITY_KEYS.erc8004), read(IDENTITY_KEYS.address),
  ]);
  return {
    description: description || undefined,
    type: type || undefined,
    avatar: avatar || undefined,
    erc8004: erc8004 || undefined,
    address: address || undefined,
  };
}
