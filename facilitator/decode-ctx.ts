// File: facilitator/decode-ctx.ts
// [DP-2 RESOLVED] Builds the PaymentContext the pure gate consumes from the REAL x402 hook context.
// Verified hook shape (@x402/core 2.25): the hook receives ONLY { paymentPayload, requirements } - there
// is NO `headers` field and NO top-level payload.payer / payload.amount / payload.paymentId. The exact
// Hedera payload is { transaction: base64 } (ExactHederaPayloadV2); payer / amount / payTo / asset are
// DECODED from the frozen transfer via @x402/hedera's inspection helpers, and paymentId is CONTENT-DERIVED
// from the transaction bytes (sha256) so the replay guard (INVARIANT #9) keys on content, matching the
// agent side. agentName (the ENS record selector) travels on the X-Leash-Agent HTTP header, threaded from
// the express /verify + /settle routes via requestAgentName() (server.ts owns the AsyncLocalStorage).
import { createHash } from 'crypto';
import {
  extractTransactionFromPayload,
  inspectHederaTransaction,
  getNetForAccount,
  getPositiveReceivers,
  type ExactHederaPayloadV2,
} from '@x402/hedera';
import type { PaymentContext } from '../types';

// Minimal shape of the x402 hook context we consume (paymentPayload + requirements).
export interface HederaHookContext {
  paymentPayload: { payload: Record<string, unknown> };
  requirements: { payTo: string; asset: string };
}

// Content-derived paymentId: sha256 of the base64 transaction bytes. Same content-derivation the agent
// uses so both sides key the replay guard identically (INVARIANT #9).
export function derivePaymentId(transactionBase64: string): string {
  return createHash('sha256').update(transactionBase64).digest('hex');
}

// Decode the frozen transfer into a PaymentContext. `agentName` is supplied by the caller (from the header).
// Throws only on a structurally undecodable payload (caller maps to a fail-closed abort / RPC_ERROR).
export function toCtx(hookCtx: HederaHookContext, agentName: string): PaymentContext {
  const tx = extractTransactionFromPayload(hookCtx.paymentPayload.payload as ExactHederaPayloadV2);
  const inspected = inspectHederaTransaction(tx);

  const asset = hookCtx.requirements.asset;
  const payTo = hookCtx.requirements.payTo;

  // Transfers for the requested asset ("0.0.0" HBAR -> hbarTransfers, else the HTS token bucket).
  const transfers = asset === '0.0.0' ? inspected.hbarTransfers : inspected.tokenTransfers[asset] ?? [];

  // Payer = the account with a NEGATIVE net (the sender). Amount = what payTo RECEIVES (positive net).
  const receivers = getPositiveReceivers(transfers);
  const payer = transfers.find((t) => BigInt(t.amount) < 0n)?.accountId
    ?? transfers.find((t) => getNetForAccount(transfers, t.accountId) < 0n)?.accountId
    ?? '';
  const amount = getNetForAccount(transfers, payTo);

  return {
    agentName,
    payer,
    // amount is the positive receipt to payTo; guard against a mis-decoded sign.
    amount: amount < 0n ? -amount : amount,
    payTo: receivers.includes(payTo) ? payTo : payTo,
    asset,
    paymentId: derivePaymentId(tx),
  };
}
