// File: web/app/app/_components/spend-feed.tsx
// The org-level activity feed: every paid / blocked attempt across the org's agents, indexed from the public HCS
// audit topic (INVARIANT #3: index-only, never gates a payment). Owner-scoped via the Bearer token.
//
// Plain language: "Paid" / "Blocked, over daily limit". Technical ids stay minimal on the surface.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthedFetch, Notice } from '../app-console';
import { usdDollars, agentSlug, humanReason, type SpendRow } from './agent-shared';

type Props = { orgId: string; authedFetch: AuthedFetch; setNotice: (n: Notice) => void };

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
    <section className="card" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.9rem' }} aria-label="Activity feed">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span className="dot-live" aria-hidden />
          <h2 style={{ fontSize: 'var(--text-h2)' }}>Activity</h2>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={() => void load()} disabled={loading} aria-busy={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {events === null ? (
        <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem' }}>Loading recent payments…</p>
      ) : events.length === 0 ? (
        <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem' }}>
          Nothing yet. Test a payment on an agent, then refresh.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
          {events.map((ev) => {
            const allowed = ev.decision === 'ALLOW';
            return (
              <li key={ev.id} className="raised" style={{ padding: '0.6rem 0.8rem', display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <span className={`pill ${allowed ? 'pill-allow' : 'pill-deny'}`} style={{ minWidth: 72, justifyContent: 'center' }}>
                  {allowed ? 'Paid' : 'Blocked'}
                </span>
                <strong style={{ color: 'var(--color-ink)' }}>{agentSlug(ev.agentName)}</strong>
                <span style={{ color: 'var(--color-ink-dim)' }}>{usdDollars(ev.amount)} → {ev.payTo}</span>
                {ev.reason && !allowed && <span style={{ color: 'var(--color-deny)', marginLeft: 'auto' }}>{humanReason(ev.reason)}</span>}
              </li>
            );
          })}
        </ul>
      )}

      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.82rem' }}>How this works</summary>
        <p className="code" style={{ marginTop: '0.5rem' }}>
          Indexed from the public HCS audit topic. This is a record only; it never gates a payment. The facilitator
          LEASH runs makes each decision live.
        </p>
      </details>
    </section>
  );
}
