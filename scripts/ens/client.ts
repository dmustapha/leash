// File: scripts/ens/client.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const rpc = http(process.env.SEPOLIA_RPC_URL!);
export const publicClient = createPublicClient({ chain: sepolia, transport: rpc });

export function walletClient(pk: `0x${string}` = process.env.LEASH_DEPLOYER_KEY as `0x${string}`) {
  return createWalletClient({ account: privateKeyToAccount(pk), chain: sepolia, transport: rpc });
}
