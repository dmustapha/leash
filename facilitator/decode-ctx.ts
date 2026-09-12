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

  // Transfers for the requested asset ("0.0.0" HBAR -> hbarTransfers, else the HTS token bucket).
  const transfers = asset === '0.0.0' ? inspected.hbarTransfers : inspected.tokenTransfers[asset] ?? [];

  // SECURITY (allowlist-bypass fix): the gate must enforce against the ACTUAL settled transfer, NOT the
  // requested `requirements.payTo`. A malicious agent could build a transfer paying a non-allowlisted account
  // while the resource server advertised an allowlisted `payTo`; keying the gate off `requirements` would then
  // authorize a payment to an arbitrary recipient. A well-formed x402 payment moves the asset to exactly ONE
  // positive receiver; anything else (zero, multiple, or a swapped/absent asset -> empty bucket) fails CLOSED.
  const receivers = getPositiveReceivers(transfers);
  if (receivers.length !== 1) {
    throw new Error(`expected exactly one receiver in asset ${asset}, decoded ${receivers.length}`);
  }
  const payTo = receivers[0]; // the account that ACTUALLY received the funds (checked against the allowlist)

  // Payer = the account with a NEGATIVE net (the sender). Amount = what payTo actually RECEIVES (positive net).
  const payer = transfers.find((t) => BigInt(t.amount) < 0n)?.accountId
    ?? transfers.find((t) => getNetForAccount(transfers, t.accountId) < 0n)?.accountId
    ?? '';
  const amount = getNetForAccount(transfers, payTo);

  return {
    agentName,
    payer,
    // amount is the positive receipt to the actual payTo; guard against a mis-decoded sign.
    amount: amount < 0n ? -amount : amount,
    payTo,
    asset,
    paymentId: derivePaymentId(tx),
  };
}
