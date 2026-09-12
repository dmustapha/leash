// File: scripts/hedera/hcs.ts
// Creates the HCS audit topic (append-only decision log used by the facilitator + index layer).
import { TopicCreateTransaction } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function createTopic(): Promise<string> {
  const client = hederaClient();
  const resp = await new TopicCreateTransaction().setTopicMemo('leash-audit').execute(client);
  const receipt = await resp.getReceipt(client);
  return receipt.topicId!.toString();
}
