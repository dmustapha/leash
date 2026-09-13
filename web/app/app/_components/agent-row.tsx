// File: web/app/app/_components/agent-row.tsx
// The compact FLEET CARD for the dashboard grid: name, status, a plain-language limits summary, a funding meter,
// a quick Revoke, and a link to the full agent detail page (/app/agent/[slug]). The full editing controls live
// on the detail page (agent-controls.tsx). Reuses the same action shape as the detail page.
//
// Plain language: "Up to $5 per payment", "Up to $50 a day", "Can pay: 0.0.x only", "Active 09:00 to 17:00 UTC".
// Technical detail (account id, tx) sits behind a Details fold. The Revoke action flips the card to Revoked
// (.flip-in) and raises a "Revoked · cut off everywhere" toast via setNotice.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicAgent } from '../../../lib/console';
import type { Notice, AuthedFetch } from '../app-console';
import { agentSlug, usdDollars, windowLabel, type LivePolicy } from './agent-shared';

type Props = { agent: PublicAgent; onChanged: () => void; setNotice: (n: Notice) => void; authedFetch: AuthedFetch };

export default function FleetCard({ agent, onChanged, setNotice, authedFetch }: Props) {
  const [busy, setBusy] = useState(false);
  const [justRevoked, setJustRevoked] = useState(false);
  const [livePolicy, setLivePolicy] = useState<LivePolicy | undefined>(undefined); // undefined = loading
  const revoked = agent.status === 'revoked' || justRevoked;
  const cosigned = agent.accountType === 'cosigned';
  const hasIdentity = !!(agent.erc8004Id || agent.externalIdentity);
  const slug = agentSlug(agent.ensName);

  const loadPolicy = useCallback(async () => {
    try {
      const r = await authedFetch(`/api/policy/${encodeURIComponent(agent.ensName)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setLivePolicy((j.policy ?? null) as LivePolicy);
    } catch {
      setLivePolicy(null);
    }
  }, [authedFetch, agent.ensName]);

  useEffect(() => { void loadPolicy(); }, [loadPolicy, agent.policyTx, agent.status]);

  async function revoke() {
    setBusy(true);
    setNotice(null);
    try {
      const r = await authedFetch('/api/revoke', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setJustRevoked(true);
      setNotice({ kind: 'err', text: `${slug} · Revoked · cut off everywhere` });
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  const dailyLabel = livePolicy === undefined ? null : livePolicy?.dailyCap ? `Up to ${usdDollars(livePolicy.dailyCap)} a day` : null;
  const weeklyLabel = livePolicy === undefined ? null : livePolicy?.weeklyCap ? `Up to ${usdDollars(livePolicy.weeklyCap)} a week` : null;
  const win = livePolicy === undefined ? null : windowLabel(livePolicy?.allowedWindows);
  const payees = agent.allowedPayees.length ? `Can pay: ${agent.allowedPayees.join(', ')}` : 'Can pay: org receiver';

  return (
    <article
      className={`card card-hover ${revoked ? 'flip-in' : ''}`}
      style={{ padding: '1.1rem', display: 'grid', gap: '0.85rem', height: '100%', alignContent: 'start', opacity: revoked ? 0.92 : 1 }}
      aria-label={`Agent ${agent.ensName}`}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ minWidth: 0 }}>
          <Link href={`/app/agent/${encodeURIComponent(slug)}`} style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.01em', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {slug}
          </Link>
          <span className="code" style={{ color: 'var(--color-ink-faint)', fontSize: '0.76rem' }}>{agent.ensName}</span>
        </div>
        <span className={`pill ${revoked ? 'pill-deny' : 'pill-allow'}`} aria-label={revoked ? 'Status: revoked' : 'Status: active'}>
          {revoked ? 'Revoked' : 'Active'}
        </span>
      </header>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {cosigned && <span className="pill pill-accent" title="The agent and LEASH must both approve. Neither can spend alone.">Co-owned</span>}
        {hasIdentity && <span className="pill pill-idle">on-chain-resolved</span>}
      </div>

      {/* Plain-language limits summary. */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem', fontSize: '0.88rem', color: 'var(--color-ink-dim)' }}>
        <li><strong style={{ color: 'var(--color-ink)' }}>Up to {usdDollars(agent.maxPerCall)} per payment</strong></li>
        {dailyLabel && <li>{dailyLabel}</li>}
        {weeklyLabel && <li>{weeklyLabel}</li>}
        {win && win.open !== null && (
          <li style={{ color: win.open === false ? 'var(--color-deny)' : 'var(--color-ink-dim)' }}>{win.text}</li>
        )}
        <li style={{ color: 'var(--color-ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{payees}</li>
      </ul>

      {revoked ? (
        <p style={{ color: 'var(--color-deny)', fontSize: '0.85rem', margin: 0 }}>Cut off everywhere. The next payment fails.</p>
      ) : (
        <div className="meter" aria-hidden><div className="meter-fill" style={{ width: '0%' }} /></div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
        <Link href={`/app/agent/${encodeURIComponent(slug)}`} className="btn btn-sm btn-ghost" style={{ flex: 1 }}>
          Open controls
        </Link>
        {!revoked && (
          <button className="btn btn-sm btn-danger" onClick={() => void revoke()} disabled={busy} aria-busy={busy}>
            {busy ? 'Revoking…' : 'Revoke'}
          </button>
        )}
      </div>

      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.82rem' }}>Details</summary>
        <p className="code" style={{ marginTop: '0.5rem' }}>account {agent.hederaAccount}</p>
      </details>
    </article>
  );
}
