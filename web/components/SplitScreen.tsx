// File: web/components/SplitScreen.tsx
// R-10 legibility device (WINNER-BRIEF risk #4). Two live panels side by side:
//   LEFT  - the ENS resolver record (leash.policy JSON), read LIVE via /api/policy/[name] (an eth_call,
//           NOT hard-coded - F1). Explicitly labelled as an on-chain read so a judge sees the source.
//   RIGHT - the latest live payment/rail result (settle / 402 / REVOKED / FUNDING_DENIED).
// When the org REVOKES on camera, the LEFT panel goes empty (record cleared on-chain) AND the very next
// payment on the RIGHT flips pass -> fail-closed - the negative-WOW, visible simultaneously.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgentPolicy } from '../../types';

export type LiveResult = {
  beat: 'spend' | 'refuse' | 'revoke' | 'deny';
  verdict?: string;
  reason?: string;
  txId?: string | null;
  revokeTx?: string;
  fundTx?: string | null;
  gasFree?: boolean;
  note?: string;
  error?: string;
  message?: string;
} | null;

type PolicyRead = { policy: AgentPolicy | null; revoked: boolean; source?: string; readAt?: string } | null;

export default function SplitScreen({ agentName, result }: { agentName: string; result: LiveResult }) {
  const [read, setRead] = useState<PolicyRead>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setReadError(null);
    try {
      const r = await fetch(`/api/policy/${encodeURIComponent(agentName)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setRead(j);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [agentName]);

  useEffect(() => { void refresh(); }, [refresh]);
  // Re-read the on-chain record after every beat so the LEFT panel tracks reality (esp. after revoke).
  useEffect(() => { if (result) void refresh(); }, [result, refresh]);

  const revoked = read?.revoked ?? false;

  return (
    <section aria-label="Live A/B: ENS record vs payment result">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }} className="split-grid">
        {/* LEFT - live ENS read */}
        <div className="panel" style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem' }}>ENS record · leash.policy</h3>
            {loading ? (
              <span className="pill pill-idle">reading…</span>
            ) : revoked ? (
              <span className="pill pill-deny">empty (revoked)</span>
            ) : (
              <span className="pill pill-allow">live</span>
            )}
          </div>
          <p className="eyebrow" style={{ letterSpacing: '0.06em' }}>
            on-chain read · eth_call → resolver.text(name, &quot;leash.policy&quot;)
          </p>
          <pre className="code" style={{ minHeight: '7.5rem', margin: 0 }} aria-live="polite">
            {readError
              ? `read failed: ${readError}`
              : loading
              ? 'querying ENS…'
              : revoked || !read?.policy
              ? '// record cleared on-chain — nothing to enforce\n{ }'
              : JSON.stringify(read.policy, null, 2)}
          </pre>
          <button className="btn" style={{ justifySelf: 'start', minHeight: 38 }} onClick={() => void refresh()}>
            re-read from chain
          </button>
        </div>

        {/* RIGHT - latest live rail result */}
        <div className="panel" style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Payment result</h3>
            <Verdict result={result} revoked={revoked} />
          </div>
          <p className="eyebrow" style={{ letterSpacing: '0.06em' }}>live rail · facilitator settle / 402 / funding</p>
          <div style={{ minHeight: '7.5rem', display: 'grid', alignContent: 'start', gap: '0.5rem' }} aria-live="polite">
            {!result ? (
              <p style={{ color: 'var(--color-ink-faint)', margin: 0 }}>
                Run a beat below. The result of the latest action shows here, side by side with the record it was checked against.
              </p>
            ) : result.error ? (
              <p className="code" style={{ color: 'var(--color-deny)' }}>error: {result.message || result.error}</p>
            ) : (
              <ResultDetail result={result} />
            )}
          </div>
        </div>
      </div>

      <style>{`@media (min-width: 820px){ .split-grid{ grid-template-columns:1fr 1fr; } }`}</style>
    </section>
  );
}

function Verdict({ result, revoked }: { result: LiveResult; revoked: boolean }) {
  if (!result) return <span className="pill pill-idle">idle</span>;
  const v = (result.verdict || '').toUpperCase();
  if (result.error) return <span className="pill pill-deny">error</span>;
  if (v === 'ALLOW') return <span className="pill pill-allow">settled</span>;
  if (v === 'REVOKED') return <span className="pill pill-deny">fail-closed</span>;
  if (v === 'DENY') return <span className="pill pill-deny">refused</span>;
  return <span className={revoked ? 'pill pill-deny' : 'pill pill-idle'}>{v || 'done'}</span>;
}

function ResultDetail({ result }: { result: NonNullable<LiveResult> }) {
  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      {result.note && <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>{result.note}</p>}
      {result.reason && (
        <div><span className="eyebrow">reason</span> <code className="code" style={{ color: 'var(--color-deny)' }}>{result.reason}</code></div>
      )}
      {result.gasFree && (
        <div><span className="pill pill-amber">gas-free · agent paid 0</span></div>
      )}
      {result.txId && (
        <div>
          <span className="eyebrow">hedera settle</span>{' '}
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://hashscan.io/testnet/transaction/${encodeURIComponent(result.txId)}`}>{result.txId} ↗</a>
        </div>
      )}
      {result.revokeTx && (
        <div>
          <span className="eyebrow">sepolia revoke</span>{' '}
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://sepolia.etherscan.io/tx/${result.revokeTx}`}>{result.revokeTx.slice(0, 18)}… ↗</a>
        </div>
      )}
      {result.fundTx && (
        <div>
          <span className="eyebrow">funding tx</span>{' '}
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://hashscan.io/testnet/transaction/${encodeURIComponent(result.fundTx)}`}>{result.fundTx} ↗</a>
        </div>
      )}
    </div>
  );
}
