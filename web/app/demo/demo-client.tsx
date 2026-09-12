// File: web/app/demo/demo-client.tsx
// The client hero flow. Four beats (spend/refuse/revoke/deny), each a click that triggers the REAL
// server-orchestrated action (/api/demo) and shows the real result. The SplitScreen (R-10) sits at the
// top so the ENS record and the live payment result are visible SIDE BY SIDE - when revoke fires, the
// record panel goes empty and the next payment flips pass -> fail-closed simultaneously.
//
// Honest framing (INVARIANT #4): the copy says the facilitator we run enforces the org's ENS-declared
// policy. It avoids over-claiming language about the guarantee (see INVARIANT #4).
'use client';

import { useCallback, useEffect, useState } from 'react';
import SplitScreen, { type LiveResult } from '../../components/SplitScreen';
import AgentCard from '../../components/AgentCard';
import type { AgentPolicy } from '../../../types';

type Beat = 'spend' | 'refuse' | 'revoke' | 'deny';

type PolicyState = { policy: AgentPolicy | null; revoked: boolean; loading: boolean };

const BEATS: { id: Beat; n: number; title: string; plain: string; kind: 'primary' | 'default' }[] = [
  { id: 'spend', n: 1, title: 'Spend 3 USDC (in cap)', plain: 'Agent pays a whitelisted API, gas-free.', kind: 'primary' },
  { id: 'refuse', n: 2, title: 'Try 50 USDC (over cap)', plain: 'Same agent, over the cap — refused at the rail.', kind: 'default' },
  { id: 'revoke', n: 3, title: 'Revoke on-chain', plain: 'Clear the ENS policy; the next payment fails closed.', kind: 'default' },
  { id: 'deny', n: 4, title: 'Leaked-key over-fund', plain: 'The funding rail denies an over-fund (Privy policy).', kind: 'default' },
];

type Props = {
  org: string;
  dataAgent: string;
  paymentsAgent: string;
  hcsTopicId: string;
  hcsTopicUrl: string | null;
};

export default function DemoClient({ org, dataAgent, paymentsAgent, hcsTopicId, hcsTopicUrl }: Props) {
  const [result, setResult] = useState<LiveResult>(null);
  const [running, setRunning] = useState<Beat | null>(null);
  const [log, setLog] = useState<NonNullable<LiveResult>[]>([]);
  const [cards, setCards] = useState<Record<string, PolicyState>>({
    [dataAgent]: { policy: null, revoked: false, loading: true },
    [paymentsAgent]: { policy: null, revoked: false, loading: true },
  });

  const loadCard = useCallback(async (name: string) => {
    try {
      const r = await fetch(`/api/policy/${encodeURIComponent(name)}`, { cache: 'no-store' });
      const j = await r.json();
      setCards((c) => ({ ...c, [name]: { policy: j.policy ?? null, revoked: !!j.revoked, loading: false } }));
    } catch {
      setCards((c) => ({ ...c, [name]: { ...c[name], loading: false } }));
    }
  }, []);

  // Load both cards on mount.
  useEffect(() => { void loadCard(dataAgent); void loadCard(paymentsAgent); }, [loadCard, dataAgent, paymentsAgent]);

  const runBeat = useCallback(
    async (beat: Beat) => {
      setRunning(beat);
      try {
        const r = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ beat }),
        });
        const j = (await r.json()) as NonNullable<LiveResult>;
        setResult(j);
        setLog((l) => [j, ...l].slice(0, 8));
        // The data agent's on-chain record changed on revoke; refresh its card.
        if (beat === 'revoke') await loadCard(dataAgent);
      } catch (e) {
        const err = { beat, error: 'request failed', message: e instanceof Error ? e.message : String(e) } as NonNullable<LiveResult>;
        setResult(err);
        setLog((l) => [err, ...l].slice(0, 8));
      } finally {
        setRunning(null);
      }
    },
    [loadCard, dataAgent],
  );

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem 4rem' }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <p className="eyebrow">judge sandbox · no login · no wallet · no ETH</p>
        <h1 style={{ fontSize: 'var(--text-h2)', marginTop: '0.4rem' }}>
          <span style={{ color: 'var(--color-amber)', fontFamily: 'var(--font-mono)' }}>{org}</span> · live spend policy
        </h1>
        <p style={{ maxWidth: '62ch', color: 'var(--color-ink-dim)', marginTop: '0.6rem' }}>
          The org declares each agent&apos;s cap and allowlist on its ENS name. The facilitator we run reads that
          ENS-declared policy and enforces it on every payment. Every button below runs a <strong>real</strong> on-chain
          action — watch the ENS record (left) and the payment result (right) move together.
        </p>
      </header>

      {/* R-10 side-by-side legibility device */}
      <SplitScreen agentName={dataAgent} result={result} />

      {/* Beat controls */}
      <section aria-label="Demo beats" style={{ marginTop: '1.5rem' }}>
        <h2 className="eyebrow" style={{ marginBottom: '0.75rem' }}>run the flow</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
          {BEATS.map((b) => (
            <button
              key={b.id}
              className={`btn ${b.kind === 'primary' ? 'btn-primary' : ''}`}
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem', height: 'auto', padding: '0.9rem 1rem', textAlign: 'left' }}
              onClick={() => void runBeat(b.id)}
              disabled={running !== null}
              aria-busy={running === b.id}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <span aria-hidden style={{ opacity: 0.7 }}>{b.n}.</span> {b.title}
                {running === b.id && <span className="spin" aria-hidden style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 400, color: b.kind === 'primary' ? '#5a4212' : 'var(--color-ink-dim)' }}>{b.plain}</span>
            </button>
          ))}
        </div>
      </section>

      {/* F-013 hierarchy: parent + two children with distinct caps */}
      <section aria-label="Agent hierarchy" style={{ marginTop: '2rem' }}>
        <details open>
          <summary style={{ cursor: 'pointer', color: 'var(--color-ink-dim)', marginBottom: '0.9rem' }}>
            The hierarchy under <code className="code" style={{ display: 'inline' }}>{org}</code> — two children, distinct caps
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <AgentCard name={dataAgent} label="data · hero agent" policy={cards[dataAgent]?.policy ?? null} revoked={cards[dataAgent]?.revoked ?? false} loading={cards[dataAgent]?.loading} hero />
            <AgentCard name={paymentsAgent} label="payments" policy={cards[paymentsAgent]?.policy ?? null} revoked={cards[paymentsAgent]?.revoked ?? false} loading={cards[paymentsAgent]?.loading} />
          </div>
        </details>
      </section>

      {/* F-014 HCS audit trail (optional-visible) */}
      {hcsTopicUrl && (
        <section aria-label="Audit trail" style={{ marginTop: '1.5rem' }}>
          <div className="panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="eyebrow">audit trail · Hedera Consensus Service</span>
              <div style={{ color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>
                Every ALLOW / DENY the facilitator makes is logged to topic <code className="code" style={{ display: 'inline' }}>{hcsTopicId}</code>.
              </div>
            </div>
            <a className="btn" href={hcsTopicUrl} target="_blank" rel="noreferrer" style={{ minHeight: 38 }}>View audit log ↗</a>
          </div>
        </section>
      )}

      {/* Recent beats log (progressive disclosure) */}
      {log.length > 0 && (
        <section aria-label="Recent actions" style={{ marginTop: '1.5rem' }}>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Raw results ({log.length})</summary>
            <pre className="code panel" style={{ padding: '1rem', marginTop: '0.6rem', maxHeight: 320, overflow: 'auto' }}>
              {JSON.stringify(log, null, 2)}
            </pre>
          </details>
        </section>
      )}
    </main>
  );
}
