// File: facilitator/cosign.test.ts
// REFRAME [SKILL] S2 unit tests — the co-sign SELECTION primitives, offline/deterministic/zero-credential.
// Covers: isKeyListShape branch logic (given a mirror key shape), and the REF-3 startup assertion
// (LEASH_COSIGNER_KEY !== HEDERA_OPERATOR_KEY).
import { describe, it, expect } from 'vitest';
import { PrivateKey } from '@hiero-ledger/sdk';
import { isKeyListShape, assertCosignerDistinct, keyListEcdsaMembers } from './cosign';

describe('keyListEcdsaMembers() — extract per-account KeyList member pubkeys (payer binding, adversarial-review fix)', () => {
  // Real mirror ProtobufEncoded KeyList hex for the co-signed account 0.0.10508343 (threshold-2):
  // member A = agent pub 02d80d..be797, member B = cosigner pub 033ba0..458e0e.
  const PROTOBUF = '2a4e0802124a0a233a2102d80d72763b97605aa25be788955759c72143873fc77b3e5e3a0360bf8a4be7970a233a21033ba0010360e416ec423bfbd0358c0edf3419708ebc540ff1173a9555c3458e0e';
  it('extracts BOTH ECDSA member pubkeys from the real protobuf', () => {
    expect(keyListEcdsaMembers(PROTOBUF)).toEqual([
      '02d80d72763b97605aa25be788955759c72143873fc77b3e5e3a0360bf8a4be797',
      '033ba0010360e416ec423bfbd0358c0edf3419708ebc540ff1173a9555c3458e0e',
    ]);
  });
  it('returns [] for empty/undefined input (fail-safe)', () => {
    expect(keyListEcdsaMembers(undefined)).toEqual([]);
    expect(keyListEcdsaMembers('')).toEqual([]);
    expect(keyListEcdsaMembers('deadbeef')).toEqual([]);
  });
});

describe('isKeyListShape() — single-key floor vs co-sign path selection', () => {
  it('bare ECDSA single key -> single-key path (false)', () => {
    expect(isKeyListShape({ _type: 'ECDSA_SECP256K1', key: 'abcd' })).toBe(false);
  });

  it('bare ED25519 single key -> single-key path (false)', () => {
    expect(isKeyListShape({ _type: 'ED25519', key: 'abcd' })).toBe(false);
  });

  it('ProtobufEncoded threshold key -> co-sign path (true)', () => {
    expect(isKeyListShape({ _type: 'ProtobufEncoded', key: 'deadbeef' })).toBe(true);
  });

  it('explicit ThresholdKey shape -> co-sign path (true)', () => {
    expect(isKeyListShape({ _type: 'ThresholdKey', threshold: 2, keys: [{}, {}] })).toBe(true);
  });

  it('null / undefined key -> false (no account key on file)', () => {
    expect(isKeyListShape(null)).toBe(false);
    expect(isKeyListShape(undefined)).toBe(false);
  });
});

describe('assertCosignerDistinct() — REF-3 process-start assertion', () => {
  it('throws when LEASH_COSIGNER_KEY is absent (co-sign path cannot run without it)', () => {
    expect(() => assertCosignerDistinct({} as unknown as NodeJS.ProcessEnv)).toThrow(/LEASH_COSIGNER_KEY is required/);
  });

  it('throws when cosigner key EQUALS the operator key (must differ)', () => {
    const k = PrivateKey.generateECDSA().toStringRaw();
    expect(() =>
      assertCosignerDistinct({ LEASH_COSIGNER_KEY: k, HEDERA_OPERATOR_KEY: k } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/REF-3 violation/);
  });

  it('throws when the SAME key is given in different encodings (der vs raw)', () => {
    const priv = PrivateKey.generateECDSA();
    expect(() =>
      assertCosignerDistinct({
        LEASH_COSIGNER_KEY: priv.toStringRaw(),
        HEDERA_OPERATOR_KEY: priv.toStringDer(),
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/REF-3 violation/);
  });

  it('passes when cosigner and operator are distinct keys', () => {
    const a = PrivateKey.generateECDSA().toStringRaw();
    const b = PrivateKey.generateECDSA().toStringRaw();
    expect(() =>
      assertCosignerDistinct({ LEASH_COSIGNER_KEY: a, HEDERA_OPERATOR_KEY: b } as unknown as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('passes (no-op) when operator key absent — nothing to compare yet', () => {
    const a = PrivateKey.generateECDSA().toStringRaw();
    expect(() => assertCosignerDistinct({ LEASH_COSIGNER_KEY: a } as unknown as NodeJS.ProcessEnv)).not.toThrow();
  });
});
