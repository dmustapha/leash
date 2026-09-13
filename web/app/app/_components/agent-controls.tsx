// File: web/app/app/_components/agent-controls.tsx
// The FULL agent controls, shown on the detail page (/app/agent/[ensName]). Carries every original action:
// set per-payment limit, edit daily/weekly budgets + active window, edit allowlist, fund / over-fund (expect
// DENY), pay in-cap / over-cap (expect refuse), revoke / reactivate, plus the identity block, co-owned state,
// live policy read, per-agent activity feed, and the animated revoke moment.
//
// Contract preserved exactly: PUT for set-limit / allowlist / limits; POST for fund / pay / revoke / reactivate.
// LOAD-BEARING magic values kept: fund 10000000, over-fund 10000001, over-cap pay 50000000. Every error path
// reads j.message || j.error. Plain language on the surface; tx hashes / policy internals behind Details folds.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicAgent } from '../../../lib/console';
import type { Notice, AuthedFetch } from '../app-console';
import { toRaw, toMinute, usdDollars, windowLabel, humanReason, type LivePolicy, type SpendRow } from './agent-shared';

type Props = { agent: PublicAgent; onChanged: () => void; setNotice: (n: Notice) => void; authedFetch: AuthedFetch };

export default function AgentControls({ agent, onChanged, setNotice, authedFetch }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [newCap, setNewCap] = useState('');
  const [newPayees, setNewPayees] = useState('');
  const [activity, setActivity] = useState<SpendRow[] | null>(null);
  const [livePolicy, setLivePolicy] = useState<LivePolicy | undefined>(undefined);
  const [newDaily, setNewDaily] = useState('');
  const [newWeekly, setNewWeekly] = useState('');
  const [newWinStart, setNewWinStart] = useState('');
  const [newWinEnd, setNewWinEnd] = useState('');
  const [flipKill, setFlipKill] = useState(0); // bump to replay the .flip-in kill moment
  const revoked = agent.status === 'revoked';
  const cosigned = agent.accountType === 'cosigned';
  const hasIdentity = !!(agent.erc8004Id || agent.externalIdentity);

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

  useEffect(() => { void loadPolicy(); }, [loadPolicy, agent.policyTx]);

  async function call(op: string, url: string, body: object, ok: (j: Record<string, unknown>) => string) {
    setBusy(op);
    setNotice(null);
    try {
      const method = op === 'setcap' || op === 'allowlist' || op === 'limits' ? 'PUT' : 'POST';
      const r = await authedFetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setNotice({ kind: 'ok', text: ok(j) });
      if (op === 'revoke') setFlipKill((n) => n + 1);
      onChanged();
      void loadPolicy();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  async function loadActivity() {
    setBusy('activity');
    try {
      const r = await authedFetch(`/api/feed?agent=${encodeURIComponent(agent.ensName)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setActivity(Array.isArray(j.events) ? j.events : []);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  const win = livePolicy === undefined ? null : windowLabel(livePolicy?.allowedWindows);

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {/* Identity + status */}
      <section className={`card ${revoked ? 'flip-in' : 'fade-in'}`} key={`status-${flipKill}`} style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.9rem' }} aria-label="Agent status">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <span className="eyebrow">this agent</span>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>{agent.ensName}</h2>
          </div>
          <span className={`pill ${revoked ? 'pill-deny' : 'pill-allow'}`}>{revoked ? 'Revoked' : 'Active'}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {cosigned && <span className="pill pill-accent" title="The agent and LEASH must both approve. Neither can spend alone.">Co-owned account</span>}
          {hasIdentity && <span className="pill pill-idle">on-chain-resolved</span>}
        </div>

        {(agent.agentType || agent.description) && (
          <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem' }}>
            {agent.agentType && <strong style={{ color: 'var(--color-ink)' }}>{agent.agentType}. </strong>}
            {agent.description}
          </p>
        )}

        {hasIdentity && (
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>Identity details</summary>
            <div className="code" style={{ marginTop: '0.5rem', display: 'grid', gap: '0.3rem' }}>
              {agent.erc8004Id && <span>ERC-8004 #{agent.erc8004Id}</span>}
              {agent.externalIdentity && <span>resolved on-chain → {agent.externalIdentity}</span>}
              <span>account {agent.hederaAccount}</span>
              <span style={{ color: 'var(--color-ink-faint)' }}>on-chain-resolved (advisory), not proof-of-control</span>
            </div>
          </details>
        )}

        {revoked && (
          <div className="toast toast-err" style={{ background: 'var(--color-deny-soft)' }}>
            <span style={{ color: 'var(--color-deny)' }}>Cut off everywhere. The next payment fails until you reactivate.</span>
          </div>
        )}
      </section>

      {/* Current limits, plain language */}
      <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.9rem' }} aria-label="Current limits">
        <span className="eyebrow">the limits you set</span>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.5rem' }}>
          <LimitRow label="Per payment" value={`Up to ${usdDollars(agent.maxPerCall)} per payment`} strong />
          <LimitRow label="Daily budget" value={liveText(livePolicy, (p) => p?.dailyCap ? `Up to ${usdDollars(p.dailyCap)} a day (soft budget)` : 'No daily budget')} />
          <LimitRow label="Weekly budget" value={liveText(livePolicy, (p) => p?.weeklyCap ? `Up to ${usdDollars(p.weeklyCap)} a week (soft budget)` : 'No weekly budget')} />
          <LimitRow label="Active hours" value={win ? win.text : 'loading…'} tone={win?.open === false ? 'deny' : undefined} />
          <LimitRow label="Can pay" value={agent.allowedPayees.length ? agent.allowedPayees.join(', ') + ' only' : 'the org receiver'} />
        </ul>
      </section>

      {!revoked && (
        <>
          {/* Set per-payment limit */}
          <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.8rem' }} aria-label="Set per-payment limit">
            <span className="eyebrow">change the per-payment limit</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <input className="field" placeholder="new amount (USD)" value={newCap} onChange={(e) => setNewCap(e.target.value)} style={{ maxWidth: 170 }} inputMode="decimal" aria-label="New per-payment limit" />
              <button className="btn" disabled={busy !== null} aria-busy={busy === 'setcap'} onClick={() => {
                const raw = toRaw(newCap);
                if (!raw) return setNotice({ kind: 'err', text: 'Enter a dollar amount (up to 6 decimals).' });
                void call('setcap', '/api/agents', { agentId: agent.id, maxPerCall: raw }, () => `Per-payment limit set to ${usdDollars(raw)}`);
                setNewCap('');
              }}>{busy === 'setcap' ? 'Saving…' : 'Save limit'}</button>
            </div>
          </section>

          {/* Allowlist */}
          <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.8rem' }} aria-label="Set who this agent can pay">
            <span className="eyebrow">who this agent can pay</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <input className="field" placeholder={`accounts (e.g. ${agent.allowedPayees[0] ?? '0.0.123'})`} value={newPayees} onChange={(e) => setNewPayees(e.target.value)} style={{ minWidth: 220, flex: 1 }} aria-label="New allowlist (comma-separated Hedera account ids)" />
              <button className="btn" disabled={busy !== null} aria-busy={busy === 'allowlist'} onClick={() => {
                const payees = newPayees.split(',').map((s) => s.trim()).filter(Boolean);
                if (payees.length === 0) return setNotice({ kind: 'err', text: 'Enter at least one account (0.0.x).' });
                void call('allowlist', '/api/agents/allowlist', { agentId: agent.id, allowedPayees: payees }, () => 'Allowlist updated');
                setNewPayees('');
              }}>{busy === 'allowlist' ? 'Saving…' : 'Save allowlist'}</button>
            </div>
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>Comma-separated Hedera account ids. This replaces the current allowlist.</span>
          </section>

          {/* Budgets + active window */}
          <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.8rem' }} aria-label="Set budgets and active hours">
            <span className="eyebrow">daily / weekly budgets · active hours</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <input className="field" placeholder={`daily (USD)${livePolicy?.dailyCap ? ` · now ${usdDollars(livePolicy.dailyCap)}` : ''}`} value={newDaily} onChange={(e) => setNewDaily(e.target.value)} style={{ maxWidth: 190 }} inputMode="decimal" aria-label="New daily budget" />
              <input className="field" placeholder={`weekly (USD)${livePolicy?.weeklyCap ? ` · now ${usdDollars(livePolicy.weeklyCap)}` : ''}`} value={newWeekly} onChange={(e) => setNewWeekly(e.target.value)} style={{ maxWidth: 200 }} inputMode="decimal" aria-label="New weekly budget" />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
              <input className="field" placeholder="from HH:MM UTC" value={newWinStart} onChange={(e) => setNewWinStart(e.target.value)} style={{ maxWidth: 170 }} aria-label="Active window start (HH:MM UTC)" />
              <input className="field" placeholder="to HH:MM UTC" value={newWinEnd} onChange={(e) => setNewWinEnd(e.target.value)} style={{ maxWidth: 170 }} aria-label="Active window end (HH:MM UTC)" />
              <button className="btn" disabled={busy !== null} aria-busy={busy === 'limits'} onClick={() => {
                const body: Record<string, unknown> = { agentId: agent.id, maxPerCall: agent.maxPerCall };
                if (newDaily.trim()) { const r = toRaw(newDaily); if (!r) return setNotice({ kind: 'err', text: 'Daily budget must be a dollar amount.' }); body.dailyCap = r; } else { body.dailyCap = ''; }
                if (newWeekly.trim()) { const r = toRaw(newWeekly); if (!r) return setNotice({ kind: 'err', text: 'Weekly budget must be a dollar amount.' }); body.weeklyCap = r; } else { body.weeklyCap = ''; }
                if (newWinStart.trim() || newWinEnd.trim()) {
                  const s = toMinute(newWinStart), en = toMinute(newWinEnd);
                  if (s === null || en === null) return setNotice({ kind: 'err', text: 'Active hours need a start and end as HH:MM (UTC).' });
                  if (s >= en) return setNotice({ kind: 'err', text: 'The start time must be before the end time.' });
                  body.allowedWindows = [{ startMinuteUtc: s, endMinuteUtc: en }];
                } else { body.allowedWindows = []; }
                void call('limits', '/api/agents', body, () => 'Budgets and active hours updated');
                setNewDaily(''); setNewWeekly(''); setNewWinStart(''); setNewWinEnd('');
              }}>{busy === 'limits' ? 'Saving…' : 'Save budgets'}</button>
            </div>
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>
              Leave a field empty to remove that budget. Daily and weekly are soft budgets; the per-payment limit is the hard one.
            </span>
          </section>

          {/* Funding */}
          <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.7rem' }} aria-label="Funding">
            <span className="eyebrow">funding</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button className="btn" disabled={busy !== null} aria-busy={busy === 'fund'} onClick={() =>
                void call('fund', '/api/fund', { agentId: agent.id, amountRaw: '10000000' }, (j) =>
                  j.denied ? `Funding blocked · ${humanReason(String(j.reason))}` : `Funded $10`)
              }>{busy === 'fund' ? 'Funding…' : 'Fund $10'}</button>
              <button className="btn btn-ghost" disabled={busy !== null} aria-busy={busy === 'fundover'} onClick={() =>
                void call('fundover', '/api/fund', { agentId: agent.id, amountRaw: '10000001' }, (j) =>
                  j.denied ? `Blocked. The independent funding rail (Privy) stopped it before it went out` : `Funded (unexpected)`)
              }>{busy === 'fundover' ? 'Trying…' : 'Try an over-fund (expect blocked)'}</button>
            </div>
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>Privy is the independent funding rail that gates top-ups.</span>
          </section>

          {/* Test a payment */}
          <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.7rem' }} aria-label="Test a payment">
            <span className="eyebrow">test a payment</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button className="btn btn-primary" disabled={busy !== null} aria-busy={busy === 'pay'} onClick={() =>
                void call('pay', '/api/pay', { agentId: agent.id }, (j) =>
                  j.settled ? `Paid · within the limit` : `Blocked · ${humanReason(String(j.reason))}`)
              }>{busy === 'pay' ? 'Paying…' : 'Make an in-limit payment'}</button>
              <button className="btn btn-ghost" disabled={busy !== null} aria-busy={busy === 'payover'} onClick={() =>
                void call('payover', '/api/pay', { agentId: agent.id, amountRawOverride: '50000000' }, (j) =>
                  j.settled ? `Paid (unexpected)` : `Blocked · over the per-payment limit`)
              }>{busy === 'payover' ? 'Trying…' : 'Try an over-limit payment (expect blocked)'}</button>
            </div>
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>The facilitator LEASH runs enforces the limits you set on every payment.</span>
          </section>

          {/* Revoke */}
          <section className="card" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.7rem', borderColor: 'rgba(255,93,108,0.25)' }} aria-label="Revoke">
            <span className="eyebrow" style={{ color: 'var(--color-deny)' }}>danger zone</span>
            <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem' }}>Cut this agent off everywhere. The next payment fails until you reactivate it.</p>
            <button className="btn btn-danger" style={{ justifySelf: 'start' }} disabled={busy !== null} aria-busy={busy === 'revoke'} onClick={() =>
              void call('revoke', '/api/revoke', { agentId: agent.id }, () => `Revoked · cut off everywhere`)
            }>{busy === 'revoke' ? 'Revoking…' : 'Revoke · cut off everywhere'}</button>
          </section>
        </>
      )}

      {revoked && (
        <section className="card" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.7rem' }} aria-label="Reactivate">
          <span className="eyebrow" style={{ color: 'var(--color-allow)' }}>bring it back</span>
          <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem' }}>Reactivate to let in-limit payments settle again under the same limits.</p>
          <button className="btn" style={{ justifySelf: 'start', color: 'var(--color-allow)', borderColor: 'rgba(79,208,138,0.35)' }}
            disabled={busy !== null} aria-busy={busy === 'reactivate'} onClick={() =>
              void call('reactivate', '/api/agents/reactivate', { agentId: agent.id }, () => `Reactivated · in-limit payments settle again`)
          }>{busy === 'reactivate' ? 'Reactivating…' : 'Reactivate this agent'}</button>
        </section>
      )}

      {/* Per-agent activity */}
      <section className="panel" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: '0.7rem' }} aria-label="Recent activity">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="eyebrow">recent activity</span>
          <button className="btn btn-sm btn-ghost" onClick={() => void loadActivity()} disabled={busy === 'activity'} aria-busy={busy === 'activity'}>
            {busy === 'activity' ? 'Loading…' : activity === null ? 'Load' : 'Refresh'}
          </button>
        </div>
        {activity === null ? (
          <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>Load to see recent paid and blocked attempts.</p>
        ) : activity.length === 0 ? (
          <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>Nothing yet. Make a payment, then refresh.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.4rem' }}>
            {activity.map((ev) => (
              <li key={ev.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                <span className={`pill ${ev.decision === 'ALLOW' ? 'pill-allow' : 'pill-deny'}`} style={{ minWidth: 70, justifyContent: 'center' }}>
                  {ev.decision === 'ALLOW' ? 'Paid' : 'Blocked'}
                </span>
                <span>{usdDollars(ev.amount)} → {ev.payTo}</span>
                {ev.reason && ev.decision !== 'ALLOW' && <span style={{ color: 'var(--color-deny)' }}>({humanReason(ev.reason)})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LimitRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'deny' }) {
  return (
    <li style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 120px) 1fr', gap: '0.75rem', alignItems: 'baseline' }}>
      <span className="label">{label}</span>
      <span style={{ color: tone === 'deny' ? 'var(--color-deny)' : strong ? 'var(--color-ink)' : 'var(--color-ink-dim)', fontWeight: strong ? 600 : 400 }}>{value}</span>
    </li>
  );
}

function liveText(policy: LivePolicy | undefined, fn: (p: LivePolicy) => string): string {
  if (policy === undefined) return 'loading…';
  return fn(policy);
}
