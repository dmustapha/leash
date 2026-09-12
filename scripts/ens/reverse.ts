// File: scripts/ens/reverse.ts
// [DP-1 RESOLVED 2026-09-12] The pinned ReverseRegistrarAdapter (0x94e6...) exposes only claim(); it
// has NO setName. The real forward-of-reverse write on this deployment is DefaultReverseRegistrarAdapter
// setName(address account,string name) (0x1f7b9461d17d5cf43553253c6b78d252d9575954). Reverse naming is
// NOT on the Phase 1 gate (register + record + revoke); it is a best-effort ENS-depth nicety.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';

// Real reverse adapter with a setName(address,string) entrypoint on the Sepolia ENSv2 deployment.
export const DEFAULT_REVERSE_ADAPTER = '0x1f7b9461d17d5cf43553253c6b78d252d9575954' as const;

const reverseAbi = parseAbi(['function setName(address account,string name)']);

export async function setReverse(name: string, pk?: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient(pk);
  const hash = await wallet.writeContract({
    address: DEFAULT_REVERSE_ADAPTER, abi: reverseAbi, functionName: 'setName', args: [wallet.account.address, name],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
