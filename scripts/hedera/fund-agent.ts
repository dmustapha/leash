// File: scripts/hedera/fund-agent.ts
// Operator -> new agent HBAR transfer to give a fresh agent account gas presence.
import { TransferTransaction, AccountId, Hbar } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function fundHbar(agentAccountId: string, hbar = 5): Promise<void> {
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, new Hbar(-hbar))
    .addHbarTransfer(AccountId.fromString(agentAccountId), new Hbar(hbar))
    .execute(client);
  await tx.getReceipt(client);
}
