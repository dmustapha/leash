// File: web/app/app/_components/spend-feed.tsx
// [WS-7 B3 / F-022] The org-level spend feed: every ALLOW/DENY across the org's agents, indexed from the public
// HCS audit topic (INVARIANT #3: index-only, never gates a payment). Owner-scoped via the Bearer token.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthedFetch, Notice } from '../app-console';

type SpendRow = { id: string; agentName: string; decision: string; amount: string; payTo: string; reason: string | null; ts: string };
type Props = { orgId: string; authedFetch: AuthedFetch; setNotice: (n: Notice) => void };

function usdc(raw: string): string {
  return (Number(raw) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function shortName(ens: string): string {
  return ens.split('.')[0];
}

export default function SpendFeed({ orgId, authedFetch, setNotice }: Props) {
  const [events, setEvents] = useState<SpendRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authedFetch(`/api/feed?orgId=${encodeURIComponent(orgId)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setEvents(Array.isArray(j.events) ? j.events : []);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }, [orgId, authedFetch, setNotice]);

  useEffect(() => { void load(); }, [load]);

  return (
    <section className="panel" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.7rem' }} aria-label="Org spend feed">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">spend feed · live from the HCS audit topic</span>
        <button className="btn" style={{ minHeight: 34 }} onClick={() => void load()} disabled={loading}>{loading ? 'Loading…' : 'refresh'}</button>
      </div>
      {events === null ? (
        <span className="code" style={{ color: 'var(--color-ink-dim)' }}>Loading recent decisions…</span>
      ) : events.length === 0 ? (
        <span className="code" style={{ color: 'var(--color-ink-dim)' }}>No decisions indexed yet. Run a payment on an agent above, then refresh.</span>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
          {events.map((ev) => (
            <li key={ev.id} className="code" style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span className={`pill ${ev.decision === 'ALLOW' ? 'pill-allow' : 'pill-deny'}`} style={{ minWidth: 54, textAlign: 'center' }}>{ev.decision}</span>
              <strong>{shortName(ev.agentName)}</strong>
              <span>{usdc(ev.amount)} USDC → {ev.payTo}</span>
              {ev.reason && <span style={{ color: 'var(--color-deny)' }}>({ev.reason})</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
