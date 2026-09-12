// File: web/app/app/app-console.tsx
// [Task 5.4b] The real multi-tenant console client. Wired end to end against the console API routes:
//   sign in (Privy) -> provision org (relayer-sponsored) -> register agent (canonical account + ENS) ->
//   set cap -> fund (Privy policy-gated) -> revoke -> list. Every action is a real tx / real DB write.
//
// Honest framing (INVARIANT #4): copy says the facilitator we run enforces the org's ENS-declared policy.
// It avoids over-claiming the guarantee (see INVARIANT #4 for the exact wording rule). No fabricated tx
// hashes or sessions (INVARIANT: real only).
'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import type { PublicAgent } from '../../lib/console';
import AgentRow from './_components/agent-row';
import RegisterAgentForm from './_components/register-agent-form';
import SpendFeed from './_components/spend-feed';

type Org = { id: string; ensName: string; registryAddress: string };
type Notice = { kind: 'ok' | 'err'; text: string } | null;

// A fetch that attaches the caller's Privy access token as `Authorization: Bearer` (WS-7 A1). Every console
// call goes through this so the server can re-derive the caller identity from the token and enforce ownership.
export type AuthedFetch = (url: string, init?: RequestInit) => Promise<Response>;
function makeAuthedFetch(getAccessToken: () => Promise<string | null>): AuthedFetch {
  return async (url, init = {}) => {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };
}

// The console body once Privy state is known. Split from the provider so the hook is inside PrivyProvider.
export default function AppConsole({ configured }: { configured: boolean }) {
  if (!configured) return <ConsoleShell><PrivyPending /></ConsoleShell>;
  return <ConsoleShell><Authed /></ConsoleShell>;
}

function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem 4rem' }}>
      <header style={{ marginBottom: '1.75rem' }}>
        <p className="eyebrow">real console · sign in · multi-tenant · relayer-sponsored</p>
        <h1 style={{ fontSize: 'var(--text-h2)', marginTop: '0.4rem' }}>LEASH console</h1>
        <p style={{ maxWidth: '62ch', color: 'var(--color-ink-dim)', marginTop: '0.6rem' }}>
          Sign in, provision your org namespace under <code className="code" style={{ display: 'inline' }}>leash.eth</code>,
          then register agents with a cap and allowlist declared on ENS. The facilitator we run enforces that
          ENS-declared policy on every payment — and you pay no gas (provisioning is relayer-sponsored).
        </p>
      </header>
      {children}
    </main>
  );
}

// Deploy-time (Task 5.4a) pending state: the Privy app id is not configured, so login cannot run locally.
function PrivyPending() {
  return (
    <section className="panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.6rem' }}>
      <span className="pill pill-idle">sign-in pending configuration</span>
      <p style={{ color: 'var(--color-ink-dim)', margin: 0 }}>
        The Privy app id is not set in this environment. Enabling Email/Google login and allowed origins in the
        Privy dashboard, then setting <code className="code" style={{ display: 'inline' }}>NEXT_PUBLIC_PRIVY_APP_ID</code>,
        is the deploy-time step. The console does not fake a session — once configured, the full flow (org →
        agent → cap → fund → revoke) runs against real rails.
      </p>
    </section>
  );
}

// Signed-in console. Drives Privy login/logout + the org/agent lifecycle.
function Authed() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  if (!ready) return <div className="panel" style={{ padding: '1.25rem', color: 'var(--color-ink-dim)' }}>Loading sign-in…</div>;
  if (!authenticated) {
    return (
      <section className="panel" style={{ padding: '1.5rem', display: 'grid', gap: '0.9rem', justifyItems: 'start' }}>
        <span className="eyebrow">step 1 · sign in</span>
        <p style={{ color: 'var(--color-ink-dim)', margin: 0, maxWidth: '52ch' }}>
          Sign in with email or Google. Privy provisions an embedded identity — no wallet or seed phrase to manage.
        </p>
        <button className="btn btn-primary" onClick={() => void login()}>Sign in with email or Google</button>
      </section>
    );
  }
  const email = user?.email?.address ?? user?.google?.email ?? null;
  const userAddress = user?.wallet?.address ?? null;
  return <OrgConsole privyUserId={user!.id} email={email} userAddress={userAddress} onLogout={() => void logout()} getAccessToken={getAccessToken} />;
}

// The org + agents surface for a signed-in user.
function OrgConsole({ privyUserId, email, userAddress, onLogout, getAccessToken }: { privyUserId: string; email: string | null; userAddress: string | null; onLogout: () => void; getAccessToken: () => Promise<string | null> }) {
  const authedFetch = useCallback(makeAuthedFetch(getAccessToken), [getAccessToken]);
  const [org, setOrg] = useState<Org | null>(null);
  const [agents, setAgents] = useState<PublicAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [orgName, setOrgName] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await authedFetch('/api/org', { cache: 'no-store' });
      const j = await r.json();
      setOrg(j.org ?? null);
      setAgents(j.agents ?? []);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => { void refresh(); }, [refresh]);

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
      setNotice({ kind: 'ok', text: j.provisioned ? `Provisioned ${j.org.ensName}${j.mintTx && j.mintTx !== '0' ? ` (tx ${short(j.mintTx)})` : ''}` : `Reusing ${j.org.ensName}` });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }, [orgName, email, authedFetch]);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div className="panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className="eyebrow">signed in</span>
          <div className="code" style={{ color: 'var(--color-ink-dim)' }}>{email ?? privyUserId}</div>
        </div>
        <button className="btn" style={{ minHeight: 38 }} onClick={onLogout}>Sign out</button>
      </div>

      {notice && (
        <div className="panel" style={{ padding: '0.75rem 1rem', color: notice.kind === 'ok' ? 'var(--color-allow)' : 'var(--color-deny)' }} aria-live="polite">
          {notice.text}
        </div>
      )}

      {!org ? (
        <ProvisionOrgCard orgName={orgName} setOrgName={setOrgName} onProvision={provisionOrg} busy={busy === 'org'} />
      ) : (
        <>
          <section className="panel" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.35rem' }}>
            <span className="eyebrow">your org namespace</span>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', margin: 0 }}>{org.ensName}</h2>
            <div className="code" style={{ color: 'var(--color-ink-faint)' }}>registry {short(org.registryAddress)}</div>
          </section>

          <RegisterAgentForm orgId={org.id} userAddress={userAddress} onRegistered={refresh} setNotice={setNotice} authedFetch={authedFetch} />

          <section aria-label="Agents" style={{ display: 'grid', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="eyebrow">agents ({agents.length})</h2>
              <button className="btn" style={{ minHeight: 34 }} onClick={() => void refresh()} disabled={loading}>refresh</button>
            </div>
            {loading ? (
              <div className="panel" style={{ padding: '1.25rem', color: 'var(--color-ink-dim)' }}>Loading agents…</div>
            ) : agents.length === 0 ? (
              <div className="panel" style={{ padding: '1.25rem', color: 'var(--color-ink-dim)' }}>
                No agents yet. Register one above — it mints a child ENS name with its own cap and allowlist.
              </div>
            ) : (
              agents.map((a) => <AgentRow key={a.id} agent={a} onChanged={refresh} setNotice={setNotice} authedFetch={authedFetch} />)
            )}
          </section>

          <SpendFeed orgId={org.id} authedFetch={authedFetch} setNotice={setNotice} />
        </>
      )}
    </div>
  );
}

function ProvisionOrgCard({ orgName, setOrgName, onProvision, busy }: { orgName: string; setOrgName: (v: string) => void; onProvision: () => void; busy: boolean }) {
  return (
    <section className="panel" style={{ padding: '1.5rem', display: 'grid', gap: '0.9rem', justifyItems: 'start' }}>
      <span className="eyebrow">step 2 · provision your org (gas sponsored)</span>
      <p style={{ color: 'var(--color-ink-dim)', margin: 0, maxWidth: '52ch' }}>
        Pick an org name. We mint <code className="code" style={{ display: 'inline' }}>&lt;org&gt;.leash.eth</code> and
        deploy its registry — the relayer pays the Sepolia gas, so you need no ETH.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <input
          className="field" placeholder="acme" value={orgName} onChange={(e) => setOrgName(e.target.value)}
          style={{ minWidth: 200 }} aria-label="Org name" disabled={busy}
        />
        <button className="btn btn-primary" onClick={onProvision} disabled={busy} aria-busy={busy}>
          {busy ? 'Provisioning…' : 'Provision org'}
        </button>
      </div>
    </section>
  );
}

function short(v: string): string {
  return v.length > 18 ? `${v.slice(0, 10)}…${v.slice(-6)}` : v;
}

export type { Notice };
