// File: facilitator/spend-rollup.integration.ts
// REFRAME [SKILL] Group V / BEAT-7 provenance — the fail-closed mirror-DOWN contract at the integration tier.
//
// The VM-3 live hero (agent/vm3.live.ts) CANNOT honestly inject a live mirror outage: spend-rollup's mirror
// base is a hardcoded const with NO env override, so faking a "mirror-down pass" in the live rail would be a
// fabrication. Instead the mirror-down => RPC_ERROR beat is proven HERE (and in spend-rollup.test.ts):
//   - spend-rollup.test.ts (unit): a non-ok mirror RESPONSE (HTTP 503/500) makes rollingTotals /
//     mirrorConsensusNow THROW — never a default-0 / host-clock un-cap.
//   - THIS integration test: a TRANSPORT-REFUSED fetch (the connection itself fails — the true outage shape,
//     not a well-formed error body) ALSO throws and PROPAGATES out of rollingTotals / mirrorConsensusNow. It
//     is never caught to a default. This is the exact throw that server.ts::enrichForDynamicLimits catches and
//     maps to { abort:true, reason:'RPC_ERROR' } (fail-closed) — see facilitator/server.ts (the try/catch
//     around enrichForDynamicLimits returns RPC_ERROR on any spend-rollup throw).
//
// Offline-safe: `fetch` is stubbed to a rejected promise; no real network call is made. Runs under
// `npm run test:integration` (TEST_TIER=integration).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { rollingTotals, mirrorConsensusNow } from './spend-rollup';

afterEach(() => vi.unstubAllGlobals());

describe('BEAT-7 mirror-DOWN => RPC_ERROR (transport-refused fetch throws + propagates; never un-caps)', () => {
  it('rollingTotals propagates a transport-refused fetch error (fail-closed, no default-0)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED: mirror node unreachable');
      }),
    );
    await expect(
      rollingTotals('vm3cosign.acme.leash.eth', '0.0.10496492', {
        dailyFromSeconds: 0,
        weeklyFromSeconds: 0,
      }),
    ).rejects.toThrow(/ECONNREFUSED/);
  });

  it('mirrorConsensusNow propagates a transport-refused fetch error (never falls back to the host clock)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED: mirror node unreachable');
      }),
    );
    await expect(mirrorConsensusNow('0.0.10496492')).rejects.toThrow(/ECONNREFUSED/);
  });
});
