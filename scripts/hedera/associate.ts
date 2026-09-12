// File: scripts/hedera/associate.ts
// Associates a token with an account (else the transfer fails TOKEN_NOT_ASSOCIATED_TO_ACCOUNT).
import { TokenAssociateTransaction, AccountId, PrivateKey } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function associate(accountId: string, accountKey: string, tokenId: string): Promise<void> {
  const client = hederaClient();
  const tx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(accountKey));
  const resp = await tx.execute(client);
  await resp.getReceipt(client);
}
