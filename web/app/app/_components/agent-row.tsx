// File: web/app/app/_components/agent-row.tsx
// [Task 5.4b] One agent card in the console list with its live operations: set cap, fund, pay (in-cap +
// over-cap), and revoke. Each button drives a real console route (real ENS write / real USDC transfer / real
// x402 settle). Over-cap fund surfaces FUNDING_DENIED; over-cap pay surfaces the facilitator's OVER_CAP.
'use client';

import { useState } from 'react';
import type { PublicAgent } from '../../../lib/console';
import type { Notice, AuthedFetch } from '../app-console';

type Props = { agent: PublicAgent; onChanged: () => void; setNotice: (n: Notice) => void; authedFetch: AuthedFetch };

function usdc(raw: string): string {
  return (Number(raw) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function toRaw(v: string): string | null {
  if (!/^\d+(\.\d{1,6})?$/.test(v.trim())) return null;
  const [w, f = ''] = v.trim().split('.');
  return (BigInt(w) * 1_000_000n + BigInt(f.padEnd(6, '0'))).toString();
}

type SpendRow = { id: string; agentName: string; decision: string; amount: string; payTo: string; reason: string | null; ts: string };

export default function AgentRow({ agent, onChanged, setNotice, authedFetch }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [newCap, setNewCap] = useState('');
  const [newPayees, setNewPayees] = useState('');
  const [activity, setActivity] = useState<SpendRow[] | null>(null);
  const revoked = agent.status === 'revoked';

  async function call(op: string, url: string, body: object, ok: (j: Record<string, unknown>) => string) {
    setBusy(op);
    setNotice(null);
    try {
      const method = op === 'setcap' || op === 'allowlist' ? 'PUT' : 'POST';
      const r = await authedFetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setNotice({ kind: 'ok', text: ok(j) });
      onChanged();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  // [WS-7 B3] Load this agent's recent ALLOW/DENY activity from the spend feed (index of the public HCS topic).
  async function loadActivity() {
    setBusy('activity');
    try {
      const r = await authedFetch(`/api/feed?agent=${encodeURIComponent(agent.ensName)}`, { cache: 'no-store' });
      const j = await r.json();
      setActivity(Array.isArray(j.events) ? j.events : []);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="card fade-in" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.8rem' }} aria-label={`Agent ${agent.ensName}`}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', margin: 0 }}>{agent.ensName}</h4>
          <div className="code" style={{ color: 'var(--color-ink-faint)' }}>account {agent.hederaAccount}</div>
        </div>
        <span className={`pill ${revoked ? 'pill-deny' : 'pill-allow'}`}>{revoked ? 'revoked' : 'active'}</span>
      </header>

      {/* [WS-7 D1] Advisory ENS identity (agent.type / agent.description) - display only, never enforcement. */}
      {(agent.agentType || agent.description) && (
        <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.85rem' }}>
          {agent.agentType && <span className="pill pill-idle" style={{ marginRight: '0.5rem' }}>{agent.agentType}</span>}
          {agent.description}
        </p>
      )}

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.9rem', margin: 0 }}>
        <dt className="eyebrow" style={{ alignSelf: 'center' }}>cap / call</dt>
        <dd style={{ margin: 0, fontWeight: 600 }}>{usdc(agent.maxPerCall)} <span style={{ color: 'var(--color-ink-dim)', fontWeight: 400 }}>USDC</span></dd>
        <dt className="eyebrow" style={{ alignSelf: 'center' }}>payees</dt>
        <dd className="code" style={{ margin: 0 }}>{agent.allowedPayees.join(', ')}</dd>
      </dl>

      {!revoked && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <input className="field" placeholder="new cap (USDC)" value={newCap} onChange={(e) => setNewCap(e.target.value)} style={{ maxWidth: 150 }} inputMode="decimal" aria-label="New cap" />
            <button className="btn" disabled={busy !== null} aria-busy={busy === 'setcap'} onClick={() => {
              const raw = toRaw(newCap);
              if (!raw) return setNotice({ kind: 'err', text: 'Cap must be a USDC amount (max 6 decimals).' });
              void call('setcap', '/api/agents', { agentId: agent.id, maxPerCall: raw }, (j) => `Cap set (tx ${String((j.policyTx as string)).slice(0, 12)}…)`);
              setNewCap('');
            }}>{busy === 'setcap' ? 'Setting…' : 'Set cap'}</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <input className="field" placeholder={`payees (e.g. ${agent.allowedPayees[0] ?? '0.0.123'})`} value={newPayees} onChange={(e) => setNewPayees(e.target.value)} style={{ minWidth: 200, flex: 1 }} aria-label="New allowlist (comma-separated Hedera account ids)" />
            <button className="btn" disabled={busy !== null} aria-busy={busy === 'allowlist'} onClick={() => {
              const payees = newPayees.split(',').map((s) => s.trim()).filter(Boolean);
              if (payees.length === 0) return setNotice({ kind: 'err', text: 'Enter at least one Hedera account id (0.0.x).' });
              void call('allowlist', '/api/agents/allowlist', { agentId: agent.id, allowedPayees: payees }, (j) => `Allowlist updated (tx ${String((j.policyTx as string)).slice(0, 12)}…)`);
              setNewPayees('');
            }}>{busy === 'allowlist' ? 'Saving…' : 'Set allowlist'}</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button className="btn" disabled={busy !== null} aria-busy={busy === 'fund'} onClick={() =>
              void call('fund', '/api/fund', { agentId: agent.id, amountRaw: '10000000' }, (j) =>
                j.denied ? `Funding DENIED (${String(j.reason)})` : `Funded 10 USDC (tx ${String(j.txHash).slice(0, 12)}…)`)
            }>{busy === 'fund' ? 'Funding…' : 'Fund 10 USDC'}</button>

            <button className="btn" disabled={busy !== null} aria-busy={busy === 'fundover'} onClick={() =>
              void call('fundover', '/api/fund', { agentId: agent.id, amountRaw: '10000001' }, (j) =>
                j.denied ? `Over-fund DENIED (${String(j.reason)}) — Privy policy blocked it before broadcast` : `Funded (tx ${String(j.txHash).slice(0, 12)}…)`)
            }>{busy === 'fundover' ? 'Trying…' : 'Try over-fund (expect DENY)'}</button>

            <button className="btn" disabled={busy !== null} aria-busy={busy === 'pay'} onClick={() =>
              void call('pay', '/api/pay', { agentId: agent.id }, (j) =>
                j.settled ? `Paid in-cap — settled ${String(j.txId)}` : `Payment refused (${String(j.reason)})`)
            }>{busy === 'pay' ? 'Paying…' : 'Pay in-cap'}</button>

            <button className="btn" disabled={busy !== null} aria-busy={busy === 'payover'} onClick={() =>
              void call('payover', '/api/pay', { agentId: agent.id, amountRawOverride: '50000000' }, (j) =>
                j.settled ? `Settled (unexpected)` : `Over-cap refused by the facilitator (${String(j.reason)})`)
            }>{busy === 'payover' ? 'Trying…' : 'Try over-cap pay (expect refuse)'}</button>
          </div>

          <button className="btn" style={{ justifySelf: 'start', color: 'var(--color-deny)', borderColor: 'rgba(209,96,96,0.35)' }}
            disabled={busy !== null} aria-busy={busy === 'revoke'} onClick={() =>
              void call('revoke', '/api/revoke', { agentId: agent.id }, (j) => `Revoked on-chain (Sepolia tx ${String(j.tx).slice(0, 12)}…) — next payment fails closed`)
          }>{busy === 'revoke' ? 'Revoking…' : 'Revoke on-chain'}</button>
        </>
      )}

      {revoked && (
        <>
          <div className="code" style={{ color: 'var(--color-deny)' }}>
            leash.policy record is empty on ENS — this agent cannot spend (fail-closed).
          </div>
          <button className="btn" style={{ justifySelf: 'start', color: 'var(--color-allow)', borderColor: 'rgba(96,180,120,0.35)' }}
            disabled={busy !== null} aria-busy={busy === 'reactivate'} onClick={() =>
              void call('reactivate', '/api/agents/reactivate', { agentId: agent.id }, (j) => `Re-activated on-chain (Sepolia tx ${String(j.policyTx).slice(0, 12)}…) — next in-cap payment settles again`)
          }>{busy === 'reactivate' ? 'Re-activating…' : 'Re-activate on-chain'}</button>
        </>
      )}

      {/* [WS-7 B3] Per-agent activity drill-down: recent ALLOW/DENY from the spend feed. */}
      <details onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open && activity === null) void loadActivity(); }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Recent activity</summary>
        <div style={{ marginTop: '0.5rem' }}>
          {activity === null ? (
            <span className="code" style={{ color: 'var(--color-ink-dim)' }}>{busy === 'activity' ? 'Loading…' : 'Open to load recent ALLOW/DENY decisions.'}</span>
          ) : activity.length === 0 ? (
            <span className="code" style={{ color: 'var(--color-ink-dim)' }}>No indexed decisions yet. Run a payment, then refresh.</span>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
              {activity.map((ev) => (
                <li key={ev.id} className="code" style={{ display: 'flex', gap: '0.6rem', alignItems: 'baseline', fontSize: '0.8rem' }}>
                  <span className={`pill ${ev.decision === 'ALLOW' ? 'pill-allow' : 'pill-deny'}`} style={{ minWidth: 54, textAlign: 'center' }}>{ev.decision}</span>
                  <span>{usdc(ev.amount)} USDC → {ev.payTo}</span>
                  {ev.reason && <span style={{ color: 'var(--color-deny)' }}>({ev.reason})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </article>
  );
}
