// File: scripts/hedera/mint-usdc.ts
// Mints own 6-decimal HTS USDC (D-5). Two identifiers: the HTS id (0.0.x, used natively by the
// facilitator transfer) AND the deterministic EVM-facade address (0x..., used by Privy's ERC-20
// transfer calldata policy). EVM facade derived via HIP-719 WITHOUT any SDK accessor (PRD-W3).
import { TokenCreateTransaction, TokenType, AccountId, PrivateKey } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

// HIP-719 deterministic EVM facade for an HTS token: 0x + the entity num as a 40-hex big-endian address.
export function htsEvmAddress(tokenId: string): string {
  const num = tokenId.split('.').pop()!; // "0.0.1234" -> "1234"
  return '0x' + BigInt(num).toString(16).padStart(40, '0');
}

export async function mintUsdc(): Promise<{ tokenId: string; evmAddress: string }> {
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
  const tx = await new TokenCreateTransaction()
    .setTokenName('Leash Test USDC')
    .setTokenSymbol('USDC')
    .setDecimals(6)
    .setInitialSupply(1_000_000_000_000) // 1,000,000 USDC raw (6 dec)
    .setTreasuryAccountId(operatorId)
    .setTokenType(TokenType.FungibleCommon)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();
  const evmAddress = htsEvmAddress(tokenId);
  return { tokenId, evmAddress };
}
