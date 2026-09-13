// File: web/app/app/app-console.tsx
// The LEASH owner console: keep your AI agents on a leash. Wired end to end against the
// console API routes: sign in (Privy) -> provision org (gas-sponsored) -> bind an agent -> set limits -> fund ->
// revoke. Every action is a real tx / real DB write.
//
// Plain-language surface: outcomes read "Paid", "Blocked, over daily limit", "Revoked, cut off everywhere";
// limits read "Up to $5 per payment". Technical detail (tx hashes, registry ids, policy internals) lives behind
// "Details" folds, never as the visual centerpiece. Honest framing (INVARIANT #4): copy says the facilitator
// LEASH runs enforces the limits you set. No fabricated tx hashes or sessions.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { PublicAgent } from '../../lib/console';
import FleetCard from './_components/agent-row';
import RegisterAgentForm from './_components/register-agent-form';
import SpendFeed from './_components/spend-feed';

type Org = { id: string; ensName: string; registryAddress: string };
type Notice = { kind: 'ok' | 'err'; text: string } | null;

// A fetch that attaches the caller's Privy access token as `Authorization: Bearer`. Every console call goes
// through this so the server re-derives the caller identity from the token and enforces ownership.
export type AuthedFetch = (url: string, init?: RequestInit) => Promise<Response>;

export default function AppConsole({ configured }: { configured: boolean }) {
  if (!configured) return <ConsoleFrame><PrivyPending /></ConsoleFrame>;
  return <ConsoleFrame><Authed /></ConsoleFrame>;
}

// The page container (below the shared ConsoleNav in layout.tsx).
function ConsoleFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="wrap" style={{ paddingBlock: 'clamp(1.75rem, 4vw, 3rem) 4rem' }}>
      {children}
    </main>
  );
}

// Deploy-time pending state: the Privy app id is not configured, so sign-in cannot run. Never a fake session.
function PrivyPending() {
  return (
    <section className="card fade-in" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.9rem', maxWidth: 640 }}>
      <span className="pill pill-idle" style={{ justifySelf: 'start' }}>sign-in pending configuration</span>
      <h1 style={{ fontSize: 'var(--text-h2)' }}>The console isn&rsquo;t connected yet</h1>
      <p style={{ color: 'var(--color-ink-dim)', maxWidth: '56ch' }}>
        Sign-in hasn&rsquo;t been switched on in this environment. Once it&rsquo;s configured, you can open your
        console and put every agent on a leash. Set a limit, fund it, and cut it off in one click.
      </p>
      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Details</summary>
        <p className="code" style={{ marginTop: '0.6rem' }}>
          NEXT_PUBLIC_PRIVY_APP_ID is unset. Enable Email/Google login + allowed origins in the Privy dashboard and
          set that variable. The console never fakes a session; once set, the full flow runs against real rails.
        </p>
      </details>
    </section>
  );
}

// Signed-in gate. Renders the designed connect screen when unauthenticated.
function Authed() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  // Never hang on Privy init: if the SDK is not ready shortly (e.g. this origin is not yet allowlisted
  // in the Privy dashboard), fall through to the connect screen instead of spinning forever.
  const [initTimedOut, setInitTimedOut] = useState(false);
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setInitTimedOut(true), 3500);
    return () => clearTimeout(t);
  }, [ready]);

  if (!ready && !initTimedOut) {
    return (
      <div className="panel fade-in" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--color-ink-dim)' }}>
        <span className="spin" aria-hidden style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--color-line)', borderTopColor: 'var(--color-accent)' }} />
        Opening your console…
      </div>
    );
  }

  if (!authenticated) return <ConnectScreen onLogin={() => void login()} />;

  const email = user?.email?.address ?? user?.google?.email ?? null;
  const userAddress = user?.wallet?.address ?? null;
  return <OrgConsole privyUserId={user!.id} email={email} userAddress={userAddress} onLogout={() => void logout()} getAccessToken={getAccessToken} />;
}

// State (2): a real, designed connect screen. Value recap + a single primary sign-in button that calls Privy.
function ConnectScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="rise" style={{ display: 'grid', gap: '2rem', maxWidth: 720, marginInline: 'auto', paddingTop: 'clamp(0.5rem, 4vw, 2.5rem)' }} aria-label="Sign in">
      <div style={{ display: 'grid', gap: '0.9rem', textAlign: 'center' }}>
        <span className="eyebrow" style={{ justifySelf: 'center' }}>keep your agents on a leash</span>
        <h1 style={{ fontSize: 'var(--text-h1)' }}>Sign in to open your console</h1>
        <p style={{ color: 'var(--color-ink-dim)', maxWidth: '52ch', marginInline: 'auto' }}>
          LEASH is the control layer for the AI agents that spend your money. Set a limit per payment, a daily and
          weekly budget, and who each agent is allowed to pay, then cut any agent off everywhere with one click.
        </p>
      </div>

      <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '1.1rem', justifyItems: 'center' }}>
        <button className="btn btn-primary" style={{ minWidth: 260 }} onClick={onLogin}>
          Sign in with email or Google
        </button>
        <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.85rem', maxWidth: '46ch', textAlign: 'center' }}>
          We provision a secure embedded wallet for you, no seed phrase to manage, and gas is sponsored, so you
          never need to hold ETH.
        </p>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
        {[
          ['Set the limits', 'Up to $5 per payment, $50 a day, $200 a week, and who they can pay.'],
          ['Co-owned accounts', 'The agent and LEASH must both approve. Neither can spend alone.'],
          ['Revoke instantly', 'Cut an agent off everywhere the moment something looks wrong.'],
        ].map(([t, d], i) => (
          <li key={t} className={`panel rise rise-${i + 1}`} style={{ padding: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '0.35rem' }}>{t}</p>
            <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>{d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The org + fleet surface for a signed-in user.
function OrgConsole({ email, userAddress, getAccessToken }: { privyUserId: string; email: string | null; userAddress: string | null; onLogout: () => void; getAccessToken: () => Promise<string | null> }) {
  const authedFetch = useCallback<AuthedFetch>(async (url, init = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  }, [getAccessToken]);

  const [org, setOrg] = useState<Org | null>(null);
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [spentToday, setSpentToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [orgName, setOrgName] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authedFetch('/api/org', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setOrg(j.org ?? null);
      setAgents(j.agents ?? []);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => { void refresh(); }, [refresh]);

  // "Spent today" is derived from the org feed's allowed payments in the last 24h (display-only, index-only).
  const loadSpentToday = useCallback(async (orgId: string) => {
    try {
      const r = await authedFetch(`/api/feed?orgId=${encodeURIComponent(orgId)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) return;
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const events: { decision: string; amount: string; ts: string }[] = Array.isArray(j.events) ? j.events : [];
      const total = events.reduce((sum, ev) => {
        if (ev.decision !== 'ALLOW') return sum;
        const t = new Date(ev.ts).getTime();
        if (!Number.isNaN(t) && t < cutoff) return sum;
        return sum + Number(ev.amount) / 1_000_000;
      }, 0);
      setSpentToday(total);
    } catch { /* display figure only, never blocks the fleet */ }
  }, [authedFetch]);

  useEffect(() => { if (org) void loadSpentToday(org.id); }, [org, agents, loadSpentToday]);

  const provisionOrg = useCallback(async () => {
    if (!orgName.trim()) return setNotice({ kind: 'err', text: 'Enter an org name first.' });
    setBusy('org');
    setNotice(null);
    try {
      const r = await authedFetch('/api/org', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, orgName }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setOrg(j.org);
      setNotice({ kind: 'ok', text: j.provisioned ? `Created ${j.org.ensName}` : `Reusing ${j.org.ensName}` });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }, [orgName, email, authedFetch]);

  const stats = useMemo(() => {
    const active = agents.filter((a) => a.status !== 'revoked').length;
    const revoked = agents.filter((a) => a.status === 'revoked').length;
    return { total: agents.length, active, revoked };
  }, [agents]);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {notice && <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />}

      {!org ? (
        <ProvisionOrgCard orgName={orgName} setOrgName={setOrgName} onProvision={provisionOrg} busy={busy === 'org'} />
      ) : (
        <>
          <FleetHeader org={org} />
          <StatsRow total={stats.total} active={stats.active} revoked={stats.revoked} spentToday={spentToday} loading={loading} />

          <RegisterAgentForm orgId={org.id} userAddress={userAddress} onRegistered={refresh} setNotice={setNotice} authedFetch={authedFetch} />

          <section aria-label="Your fleet" style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--text-h2)' }}>Your fleet</h2>
              <button className="btn btn-sm btn-ghost" onClick={() => void refresh()} disabled={loading} aria-busy={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <FleetSkeleton />
            ) : agents.length === 0 ? (
              <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.5rem', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem' }}>No agents on the leash yet</p>
                <p style={{ color: 'var(--color-ink-dim)', maxWidth: '52ch', marginInline: 'auto' }}>
                  Bind an agent you already run above. It gets a co-owned spending account with its own limit,
                  allowlist, and budgets, and you can cut it off anytime.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {agents.map((a, i) => (
                  <div key={a.id} className={`rise rise-${Math.min(i + 1, 6)}`}>
                    <FleetCard agent={a} onChanged={refresh} setNotice={setNotice} authedFetch={authedFetch} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <SpendFeed orgId={org.id} authedFetch={authedFetch} setNotice={setNotice} />
        </>
      )}
    </div>
  );
}

function NoticeBanner({ notice, onDismiss }: { notice: NonNullable<Notice>; onDismiss: () => void }) {
  return (
    <div className={`toast fade-in ${notice.kind === 'ok' ? 'toast-ok' : 'toast-err'}`} role="status" aria-live="polite">
      <span aria-hidden style={{ color: notice.kind === 'ok' ? 'var(--color-allow)' : 'var(--color-deny)', fontWeight: 700 }}>
        {notice.kind === 'ok' ? '✓' : '!'}
      </span>
      <span style={{ flex: 1, color: 'var(--color-ink)' }}>{notice.text}</span>
      <button className="btn btn-sm btn-ghost" style={{ minHeight: 28, padding: '0.15rem 0.5rem' }} onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}

function FleetHeader({ org }: { org: Org }) {
  return (
    <section className="card fade-in" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'grid', gap: '0.3rem' }}>
        <span className="eyebrow">your organization</span>
        <h1 style={{ fontSize: 'var(--text-h2)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.01em' }}>{org.ensName}</h1>
      </div>
      <details style={{ minWidth: 0 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>Details</summary>
        <p className="code" style={{ marginTop: '0.5rem' }}>on-chain registry {short(org.registryAddress)}</p>
      </details>
    </section>
  );
}

function StatsRow({ total, active, revoked, spentToday, loading }: { total: number; active: number; revoked: number; spentToday: number | null; loading: boolean }) {
  const cells: { label: string; value: string; tone?: 'accent' | 'allow' | 'deny' }[] = [
    { label: 'Agents', value: String(total), tone: 'accent' },
    { label: 'Active', value: String(active), tone: 'allow' },
    { label: 'Revoked', value: String(revoked), tone: 'deny' },
    { label: 'Spent today', value: spentToday === null ? '·' : `$${spentToday.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
  ];
  return (
    <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }} aria-label="Fleet summary">
      {cells.map((c) => (
        <div key={c.label} className="panel" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.35rem' }}>
          <span className="eyebrow">{c.label}</span>
          <span
            className="stat-num"
            style={{ color: loading ? 'var(--color-ink-faint)' : c.tone === 'allow' ? 'var(--color-allow)' : c.tone === 'deny' ? 'var(--color-deny)' : c.tone === 'accent' ? 'var(--color-accent)' : 'var(--color-ink)' }}
          >
            {loading ? '·' : c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function FleetSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }} aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card" style={{ padding: '1.1rem', display: 'grid', gap: '0.8rem', opacity: 0.6 }}>
          <div style={{ height: 18, width: '60%', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ height: 12, width: '40%', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }} />
          <div className="meter"><div className="meter-fill" style={{ width: '35%' }} /></div>
          <div style={{ height: 36, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }} />
        </div>
      ))}
    </div>
  );
}

// State (3): provision an org, gas-sponsored. Plain language, technical detail behind Details.
function ProvisionOrgCard({ orgName, setOrgName, onProvision, busy }: { orgName: string; setOrgName: (v: string) => void; onProvision: () => void; busy: boolean }) {
  return (
    <section className="card rise" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '1.1rem', maxWidth: 620, marginInline: 'auto' }}>
      <span className="eyebrow" style={{ justifySelf: 'start' }}>one-time setup · gas sponsored</span>
      <h1 style={{ fontSize: 'var(--text-h2)' }}>Name your organization</h1>
      <p style={{ color: 'var(--color-ink-dim)', maxWidth: '52ch' }}>
        Pick a short name. We set up <strong style={{ color: 'var(--color-ink)' }}>{orgName.trim() ? `${orgName.trim().toLowerCase()}.leash.eth` : 'your-name.leash.eth'}</strong> for
        your fleet. LEASH covers the network fees, so you don&rsquo;t need any crypto to start.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <input
          className="field" placeholder="acme" value={orgName}
          onChange={(e) => setOrgName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !busy) onProvision(); }}
          style={{ minWidth: 200, flex: 1, fontFamily: 'var(--font-mono)' }} aria-label="Organization name" disabled={busy}
        />
        <button className="btn btn-primary" onClick={onProvision} disabled={busy} aria-busy={busy}>
          {busy ? 'Setting up…' : 'Create my organization'}
        </button>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>Details</summary>
        <p className="code" style={{ marginTop: '0.6rem' }}>
          Provisioning mints &lt;org&gt;.leash.eth and deploys its on-chain registry. The relayer LEASH runs pays
          the Sepolia gas, no ETH required from you. The facilitator LEASH runs then enforces the limits you set
          on every payment.
        </p>
      </details>
    </section>
  );
}

function short(v: string): string {
  return v.length > 18 ? `${v.slice(0, 10)}…${v.slice(-6)}` : v;
}

export type { Notice };
