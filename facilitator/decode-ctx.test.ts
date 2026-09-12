// File: facilitator/decode-ctx.test.ts
// Offline unit tests for the content-derived paymentId (DP-2 / INVARIANT #9). The transfer-decode path
// (toCtx) is exercised in the integration tier against a real frozen Hedera transaction; here we prove the
// pure content-derivation is deterministic + content-keyed so the facilitator and agent key replay identically.
import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import { derivePaymentId } from './decode-ctx';

describe('derivePaymentId() - content-derived replay key (INVARIANT #9)', () => {
  it('is deterministic: identical tx bytes -> identical paymentId', () => {
    const tx = 'CjUKFg... (base64 tx bytes)';
    expect(derivePaymentId(tx)).toBe(derivePaymentId(tx));
  });

  it('is content-keyed: different tx bytes -> different paymentId', () => {
    expect(derivePaymentId('AAAA')).not.toBe(derivePaymentId('BBBB'));
  });

  it('matches a sha256 of the base64 transaction bytes (agent-side parity)', () => {
    const tx = 'some-base64-transaction';
    const expected = createHash('sha256').update(tx).digest('hex');
    expect(derivePaymentId(tx)).toBe(expected);
  });

  it('produces a 64-hex-char digest', () => {
    expect(derivePaymentId('x')).toMatch(/^[0-9a-f]{64}$/);
  });
});
