// File: scripts/hedera/client.ts
import { Client, PrivateKey, AccountId } from '@hiero-ledger/sdk';

export function hederaClient(): Client {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!),
  );
  return client;
}
