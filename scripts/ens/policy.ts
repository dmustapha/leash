// File: scripts/ens/policy.ts
// WARNING: UNVERIFIED PATTERN - test immediately.
import { parseAbi, namehash } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';
import type { AgentPolicy } from '../../types';

const resolverAbi = parseAbi([
  'function setText(bytes32 node,string key,string value)',
  'function text(bytes32 node,string key) view returns (string)',
]);

export async function setPolicy(name: string, policy: AgentPolicy): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: ENS.PublicResolverV2, abi: resolverAbi, functionName: 'setText', args: [namehash(name), 'leash.policy', JSON.stringify(policy)] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Read-back check (PRD-W5): uses namehash + PublicResolverV2, the same primitives as facilitator/ens-read.ts.
export async function readPolicy(name: string): Promise<AgentPolicy | null> {
  const raw = await publicClient.readContract({ address: ENS.PublicResolverV2, abi: resolverAbi, functionName: 'text', args: [namehash(name), 'leash.policy'] });
  const s = raw as string;
  return s && s.trim() !== '' ? (JSON.parse(s) as AgentPolicy) : null;
}
