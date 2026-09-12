// File: facilitator/hcs-log.ts
// Append-only HCS audit log of every gate decision (ALLOW / DENY). [VERIFIED] against @hiero-ledger/sdk
// 2.85: TopicMessageSubmitTransaction.execute() -> getReceipt() exposes topicSequenceNumber.
// Returns the consensus sequence number so the index layer + proof capture can anchor each decision.
import { TopicMessageSubmitTransaction } from '@hiero-ledger/sdk';
import type { LogEntry } from '../types';
import { hederaClient } from '../scripts/hedera/client';

export async function logDecision(entry: LogEntry): Promise<number> {
  const client = hederaClient();
  const resp = await new TopicMessageSubmitTransaction()
    .setTopicId(process.env.HCS_TOPIC_ID!)
    .setMessage(JSON.stringify(entry))
    .execute(client);
  const receipt = await resp.getReceipt(client);
  // topicSequenceNumber is a Long; Number() is safe for demo-scale sequence values.
  return receipt.topicSequenceNumber ? Number(receipt.topicSequenceNumber) : -1;
}
