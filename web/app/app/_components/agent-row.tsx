// File: web/app/app/_components/agent-row.tsx
// [Task 5.4b] One agent card in the console list with its live operations: set cap, fund, pay (in-cap +
// over-cap), and revoke. Each button drives a real console route (real ENS write / real USDC transfer / real
// x402 settle). Over-cap fund surfaces FUNDING_DENIED; over-cap pay surfaces the facilitator's OVER_CAP.
'use client';

import { useState } from 'react';
import type { PublicAgent } from '../../../lib/console';
import type { Notice } from '../app-console';

type Props = { agent: PublicAgent; onChanged: () => void; setNotice: (n: Notice) => void };

function usdc(raw: string): string {
  return (Number(raw) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function toRaw(v: string): string | null {
  if (!/^\d+(\.\d{1,6})?$/.test(v.trim())) return null;
  const [w, f = ''] = v.trim().split('.');
  return (BigInt(w) * 1_000_000n + BigInt(f.padEnd(6, '0'))).toString();
}

export default function AgentRow({ agent, onChanged, setNotice }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [newCap, setNewCap] = useState('');
  const revoked = agent.status === 'revoked';

  async function call(op: string, url: string, body: object, ok: (j: Record<string, unknown>) => string) {
    setBusy(op);
    setNotice(null);
    try {
      const method = op === 'setcap' ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
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

  return (
    <article className="card fade-in" style={{ padding: '1rem 1.1rem', display: 'grid', gap: '0.8rem' }} aria-label={`Agent ${agent.ensName}`}>
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', margin: 0 }}>{agent.ensName}</h4>
          <div className="code" style={{ color: 'var(--color-ink-faint)' }}>account {agent.hederaAccount}</div>
        </div>
        <span className={`pill ${revoked ? 'pill-deny' : 'pill-allow'}`}>{revoked ? 'revoked' : 'active'}</span>
      </header>

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
        <div className="code" style={{ color: 'var(--color-deny)' }}>
          leash.policy record is empty on ENS — this agent cannot spend (fail-closed).
        </div>
      )}
    </article>
  );
}
