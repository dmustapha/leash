// File: facilitator/cosign.ts
// REFRAME [SKILL] S2 support — the co-sign selection primitives, kept PURE where possible so the
// branch logic is unit-testable with zero credentials (a mirror key SHAPE in, a boolean out).
//
// This module owns THREE things, none of which read `leash.policy` (INVARIANT #13 stays intact — this is
// account-shape detection + the co-sign authority key, NOT policy enforcement):
//   1. assertCosignerDistinct() — the process-start REF-3 assertion (LEASH_COSIGNER_KEY !== HEDERA_OPERATOR_KEY).
//   2. isKeyListShape(mirrorKey) — PURE: given the `.key` object a mirror-node account read returns, decide
//      whether the account is a threshold (KeyList, threshold>=2) account (the co-sign path) vs a single
//      ECDSA/ED25519 key (the /demo single-key path).
//   3. isKeyListAccount(payerId, network) — the I/O wrapper that fetches `.key` from the mirror node and
//      applies isKeyListShape. Fails CLOSED to `false` ONLY for the SINGLE-KEY default is never chosen on a
//      network error — see below: a fetch failure THROWS so the caller fails closed (never silently routes a
//      co-signed account down the single-key path).
import { PrivateKey } from '@hiero-ledger/sdk';

// Mirror node account endpoint (testnet). Same base the frozen provision-canonical.ts reads.
const MIRROR_BASE: Record<string, string> = {
  'hedera:testnet': 'https://testnet.mirrornode.hedera.com/api/v1',
  testnet: 'https://testnet.mirrornode.hedera.com/api/v1',
};

// The shape the Hedera mirror node returns under account `.key`. A single key is
// `{ _type: 'ECDSA_SECP256K1' | 'ED25519', key: '<hex>' }`. A threshold account is
// `{ _type: 'ProtobufEncoded', key: '<hex>' }` OR a structured `{ _type:'ThresholdKey', ... }` depending on
// mirror version. We treat ANYTHING that is not a bare single ECDSA/ED25519 key as a KeyList/threshold shape
// (co-sign path) — the network still enforces the real threshold at submit; this only SELECTS the signer.
export interface MirrorKeyShape {
  _type?: string;
  key?: string;
  keys?: unknown[];
  threshold?: number;
}

const SINGLE_KEY_TYPES = new Set(['ECDSA_SECP256K1', 'ED25519']);

// PURE: is this account a co-sign (KeyList / threshold) account? A bare single ECDSA/ED25519 key is the
// /demo single-key floor -> false. Everything else (ProtobufEncoded, ThresholdKey, KeyList, an explicit
// threshold, or a nested keys[]) is the co-sign path -> true.
export function isKeyListShape(mirrorKey: MirrorKeyShape | null | undefined): boolean {
  if (!mirrorKey) return false;
  const t = mirrorKey._type ?? '';
  if (SINGLE_KEY_TYPES.has(t)) return false;
  // ProtobufEncoded / ThresholdKey / KeyList / anything with a threshold or nested keys -> co-sign.
  return true;
}

// I/O: fetch the payer account's on-chain key from the mirror node and classify it. THROWS on a fetch/parse
// failure so the caller fails CLOSED (the scheme maps a throw to RPC_ERROR / aborts) rather than defaulting a
// co-signed account onto the single-key path (which would submit a 1-of-2 the network rejects, but worse,
// could mis-route the /demo floor). The single-key path is chosen ONLY on a positive single-key classification.
export async function isKeyListAccount(payerId: string, network: string): Promise<boolean> {
  const base = MIRROR_BASE[network] ?? MIRROR_BASE.testnet;
  const r = await fetch(`${base}/accounts/${payerId}`);
  if (!r.ok) throw new Error(`mirror account read failed for ${payerId}: ${r.status}`);
  const body = (await r.json()) as { key?: MirrorKeyShape | null };
  return isKeyListShape(body.key);
}

// REF-3 startup assertion: LEASH's co-sign authority key MUST differ from its gas fee-payer key, so
// "LEASH's authority key != its gas key" is literally true within the process. Normalizes both to a raw
// ECDSA public-key hex before comparing (so a DER vs raw-hex encoding of the SAME key still trips the guard).
// Throws if equal (or if LEASH_COSIGNER_KEY is absent — the co-sign path cannot run without it).
export function assertCosignerDistinct(env: NodeJS.ProcessEnv = process.env): void {
  const cosignerRaw = env.LEASH_COSIGNER_KEY?.trim();
  const operatorRaw = env.HEDERA_OPERATOR_KEY?.trim();
  if (!cosignerRaw) {
    throw new Error('LEASH_COSIGNER_KEY is required for the co-sign spending path (run provision-spending-account.ts)');
  }
  if (!operatorRaw) return; // operator asserted elsewhere; nothing to compare against yet.
  const cosignerPub = PrivateKey.fromStringECDSA(cosignerRaw).publicKey.toStringRaw();
  const operatorPub = PrivateKey.fromStringECDSA(operatorRaw).publicKey.toStringRaw();
  if (cosignerPub === operatorPub) {
    throw new Error(
      'REF-3 violation: LEASH_COSIGNER_KEY must NOT equal HEDERA_OPERATOR_KEY (the co-sign authority key must differ from the gas fee-payer key)',
    );
  }
}
