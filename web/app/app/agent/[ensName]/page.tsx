// File: web/app/app/agent/[ensName]/page.tsx
// The AGENT DETAIL page (adjoining route to the fleet). Client component using Privy via the shared PrivyProvider
// mounted in ../../layout.tsx, so navigating here from a fleet card keeps the session. It loads the org
// (/api/org), finds the agent whose label (before the first dot of its ENS name) matches the [ensName] slug,
// then renders the full AgentControls. Never fakes a session or data; shows real loading / error / not-found.
'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import type { PublicAgent } from '../../../../lib/console';
import AgentControls from '../../_components/agent-controls';
import type { Notice, AuthedFetch } from '../../app-console';
import { agentSlug } from '../../_components/agent-shared';

const CONFIGURED = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function AgentDetailPage({ params }: { params: Promise<{ ensName: string }> }) {
  const { ensName } = use(params);
  const slug = decodeURIComponent(ensName);

  if (!CONFIGURED) {
    return (
      <Frame>
        <div className="card fade-in" style={{ padding: '1.5rem', display: 'grid', gap: '0.6rem' }}>
          <span className="pill pill-idle" style={{ justifySelf: 'start' }}>sign-in pending configuration</span>
          <p style={{ color: 'var(--color-ink-dim)' }}>Sign-in isn&rsquo;t switched on in this environment yet.</p>
        </div>
      </Frame>
    );
  }
  return <Frame><Detail slug={slug} /></Frame>;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="wrap" style={{ paddingBlock: 'clamp(1.5rem, 4vw, 2.5rem) 4rem', maxWidth: 760 }}>
      <Link href="/app" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
        <span aria-hidden>←</span> Back to your fleet
      </Link>
      {children}
    </main>
  );
}

function Detail({ slug }: { slug: string }) {
  const { ready, authenticated, login, getAccessToken } = usePrivy();

  const authedFetch = useCallback<AuthedFetch>(async (url, init = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  }, [getAccessToken]);

  const [agent, setAgent] = useState<PublicAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await authedFetch('/api/org', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      const agents: PublicAgent[] = j.agents ?? [];
      const found = agents.find((a) => agentSlug(a.ensName) === slug) ?? null;
      if (!found) { setNotFound(true); setAgent(null); }
      else { setNotFound(false); setAgent(found); }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [authedFetch, slug]);

  useEffect(() => { if (ready && authenticated) void refresh(); }, [ready, authenticated, refresh]);

  if (!ready) {
    return (
      <div className="panel fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-ink-dim)' }}>
        <span className="spin" aria-hidden style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-line)', borderTopColor: 'var(--color-accent)' }} />
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <section className="card fade-in" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.9rem' }}>
        <h1 style={{ fontSize: 'var(--text-h2)' }}>Sign in to manage this agent</h1>
        <p style={{ color: 'var(--color-ink-dim)' }}>You need to be signed in to view an agent&rsquo;s controls.</p>
        <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => void login()}>Sign in with email or Google</button>
      </section>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {notice && (
        <div className={`toast fade-in ${notice.kind === 'ok' ? 'toast-ok' : 'toast-err'}`} role="status" aria-live="polite">
          <span aria-hidden style={{ color: notice.kind === 'ok' ? 'var(--color-allow)' : 'var(--color-deny)', fontWeight: 700 }}>{notice.kind === 'ok' ? '✓' : '!'}</span>
          <span style={{ flex: 1 }}>{notice.text}</span>
          <button className="btn btn-sm btn-ghost" style={{ minHeight: 28, padding: '0.15rem 0.5rem' }} onClick={() => setNotice(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '1.5rem', display: 'grid', gap: '0.8rem', opacity: 0.7 }} aria-busy>
          <div style={{ height: 22, width: '50%', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ height: 14, width: '70%', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ height: 80, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }} />
        </div>
      ) : error ? (
        <section className="card toast-err" style={{ padding: '1.5rem', display: 'grid', gap: '0.7rem' }} role="alert">
          <h1 style={{ fontSize: 'var(--text-h2)', color: 'var(--color-deny)' }}>Couldn&rsquo;t load this agent</h1>
          <p className="code">{error}</p>
          <button className="btn" style={{ justifySelf: 'start' }} onClick={() => void refresh()}>Try again</button>
        </section>
      ) : notFound || !agent ? (
        <section className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.7rem' }}>
          <h1 style={{ fontSize: 'var(--text-h2)' }}>Agent not found</h1>
          <p style={{ color: 'var(--color-ink-dim)' }}>No agent named <strong style={{ color: 'var(--color-ink)' }}>{slug}</strong> in your fleet.</p>
          <Link href="/app" className="btn btn-primary" style={{ justifySelf: 'start' }}>Back to your fleet</Link>
        </section>
      ) : (
        <>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <span className="eyebrow">agent controls</span>
            <h1 style={{ fontSize: 'var(--text-h1)' }}>{agentSlug(agent.ensName)}</h1>
          </header>
          <AgentControls agent={agent} onChanged={refresh} setNotice={setNotice} authedFetch={authedFetch} />
        </>
      )}
    </div>
  );
}
