// File: web/app/app/_components/register-agent-form.tsx
// [Task 5.4b] Register a new agent under the org. On submit it POSTs /api/agents which provisions a canonical
// Hedera account, relayer-mints the child ENS name, and writes its leash.policy - all real. Progressive
// disclosure: the allowlist override is behind a details toggle (defaults to the org receiver).
'use client';

import { useState } from 'react';
import type { Notice, AuthedFetch } from '../app-console';

type Props = { orgId: string; userAddress: string | null; onRegistered: () => void; setNotice: (n: Notice) => void; authedFetch: AuthedFetch };

// USDC (6 decimals) display string -> raw smallest-unit string. "5" -> "5000000". Returns null if invalid.
function toRaw(usdc: string): string | null {
  if (!/^\d+(\.\d{1,6})?$/.test(usdc.trim())) return null;
  const [whole, frac = ''] = usdc.trim().split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(frac.padEnd(6, '0'))).toString();
}

export default function RegisterAgentForm({ orgId, userAddress, onRegistered, setNotice, authedFetch }: Props) {
  const [label, setLabel] = useState('');
  const [cap, setCap] = useState('5');
  const [payees, setPayees] = useState('');
  const [agentType, setAgentType] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const maxPerCall = toRaw(cap);
    if (!label.trim()) return setNotice({ kind: 'err', text: 'Enter an agent name.' });
    if (!maxPerCall) return setNotice({ kind: 'err', text: 'Cap must be a USDC amount (max 6 decimals).' });
    setBusy(true);
    setNotice(null);
    try {
      const allowedPayees = payees.split(',').map((s) => s.trim()).filter(Boolean);
      const r = await authedFetch('/api/agents', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orgId, label, maxPerCall, allowedPayees: allowedPayees.length ? allowedPayees : undefined, userAddress: userAddress ?? undefined, agentType: agentType.trim() || undefined, description: description.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      const cohold = j.coholdVerified ? ' · you co-hold the kill switch' : '';
      setNotice({ kind: 'ok', text: `Registered ${j.agent.ensName} (mint ${j.mintTx.slice(0, 12)}…, policy ${j.policyTx.slice(0, 12)}…)${cohold}` });
      setLabel('');
      onRegistered();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.9rem' }}>
      <span className="eyebrow">register an agent</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', alignItems: 'end' }}>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span className="eyebrow">name (label)</span>
          <input className="field" placeholder="data" value={label} onChange={(e) => setLabel(e.target.value)} disabled={busy} />
        </label>
        <label style={{ display: 'grid', gap: '0.3rem' }}>
          <span className="eyebrow">cap / call (USDC)</span>
          <input className="field" placeholder="5" value={cap} onChange={(e) => setCap(e.target.value)} disabled={busy} inputMode="decimal" />
        </label>
      </div>
      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Advanced · allowlist + ENS identity</summary>
        <div style={{ display: 'grid', gap: '0.6rem', marginTop: '0.5rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span className="eyebrow">allowed payees · comma separated · defaults to the org receiver</span>
            <input className="field" placeholder="0.0.123, 0.0.456" value={payees} onChange={(e) => setPayees(e.target.value)} disabled={busy} />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span className="eyebrow">agent type · advisory ENS identity (agent.type)</span>
            <input className="field" placeholder="data buyer" value={agentType} onChange={(e) => setAgentType(e.target.value)} disabled={busy} />
          </label>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span className="eyebrow">description · advisory ENS identity (agent.description)</span>
            <input className="field" placeholder="Buys premium API data within a 5 USDC cap" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
          </label>
        </div>
      </details>
      <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => void submit()} disabled={busy} aria-busy={busy}>
        {busy ? 'Registering (provisioning account + ENS)…' : 'Register agent'}
      </button>
    </section>
  );
}
