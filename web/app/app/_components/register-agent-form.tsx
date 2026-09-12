// File: web/app/app/_components/register-agent-form.tsx
// [REFRAME R3/D4] Register-EXISTING is the PRIMARY flow: bind an agent the operator ALREADY controls (its own
// Hedera public key + an on-chain ERC-8004 identity / external EVM address) to a 2-of-2 co-signed spending
// account + an ENS-declared policy. LEASH never mints the agent's identity and never sees the agent's private
// key. The legacy sandbox-mint path (LEASH provisions a throwaway account) stays available but clearly secondary.
// Dynamic limits (rolling daily/weekly SOFT caps + a stateless UTC time-window) live behind the Advanced toggle.
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

// "HH:MM" (UTC) -> minute-of-day 0..1439, or null if malformed / out of range.
function toMinute(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export default function RegisterAgentForm({ orgId, userAddress, onRegistered, setNotice, authedFetch }: Props) {
  const [mode, setMode] = useState<'bind' | 'mint'>('bind');
  const [label, setLabel] = useState('');
  const [cap, setCap] = useState('5');
  const [payees, setPayees] = useState('');
  const [agentType, setAgentType] = useState('');
  const [description, setDescription] = useState('');
  // Bind-existing identity inputs.
  const [agentPub, setAgentPub] = useState('');
  const [erc8004Id, setErc8004Id] = useState('');
  const [externalEvm, setExternalEvm] = useState('');
  // Dynamic limits.
  const [dailyCap, setDailyCap] = useState('');
  const [weeklyCap, setWeeklyCap] = useState('');
  const [winStart, setWinStart] = useState('');
  const [winEnd, setWinEnd] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const maxPerCall = toRaw(cap);
    if (!label.trim()) return setNotice({ kind: 'err', text: 'Enter an agent name.' });
    if (!maxPerCall) return setNotice({ kind: 'err', text: 'Cap must be a USDC amount (max 6 decimals).' });

    // Dynamic-limit conversions (all optional; convert only if provided).
    let dailyRaw: string | undefined;
    let weeklyRaw: string | undefined;
    let allowedWindows: { startMinuteUtc: number; endMinuteUtc: number }[] | undefined;
    if (dailyCap.trim()) {
      dailyRaw = toRaw(dailyCap) ?? undefined;
      if (!dailyRaw) return setNotice({ kind: 'err', text: 'Daily cap must be a USDC amount (max 6 decimals).' });
    }
    if (weeklyCap.trim()) {
      weeklyRaw = toRaw(weeklyCap) ?? undefined;
      if (!weeklyRaw) return setNotice({ kind: 'err', text: 'Weekly cap must be a USDC amount (max 6 decimals).' });
    }
    if (winStart.trim() || winEnd.trim()) {
      const s = toMinute(winStart), e = toMinute(winEnd);
      if (s === null || e === null) return setNotice({ kind: 'err', text: 'Window needs a start and end as HH:MM (UTC).' });
      if (s >= e) return setNotice({ kind: 'err', text: 'Window start (UTC) must be before its end.' });
      allowedWindows = [{ startMinuteUtc: s, endMinuteUtc: e }];
    }

    // Bind-mode identity validation: the agent MUST supply its own Hedera public key + at least one identity.
    if (mode === 'bind') {
      if (!agentPub.trim()) return setNotice({ kind: 'err', text: 'Paste the agent’s Hedera public key (agentPub) to bind.' });
      if (!erc8004Id.trim() && !externalEvm.trim()) {
        return setNotice({ kind: 'err', text: 'Provide an ERC-8004 agentId and/or an external EVM address to bind an identity.' });
      }
      if (externalEvm.trim() && !/^0x[0-9a-fA-F]{40}$/.test(externalEvm.trim())) {
        return setNotice({ kind: 'err', text: 'External EVM address must be a 0x… 40-hex address.' });
      }
      if (erc8004Id.trim() && !/^\d+$/.test(erc8004Id.trim())) {
        return setNotice({ kind: 'err', text: 'ERC-8004 agentId must be a whole number.' });
      }
    }

    setBusy(true);
    setNotice(null);
    try {
      const allowedPayees = payees.split(',').map((s) => s.trim()).filter(Boolean);
      const common = {
        orgId, label, maxPerCall,
        allowedPayees: allowedPayees.length ? allowedPayees : undefined,
        userAddress: userAddress ?? undefined,
        agentType: agentType.trim() || undefined,
        description: description.trim() || undefined,
        dailyCap: dailyRaw, weeklyCap: weeklyRaw, allowedWindows,
      };
      const bindPayload = mode === 'bind'
        ? { bindExisting: true, agentPub: agentPub.trim(), erc8004Id: erc8004Id.trim() || undefined, externalEvm: externalEvm.trim() || undefined }
        : {};
      const r = await authedFetch('/api/agents', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...common, ...bindPayload }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      const ens = j.agent?.ensName ?? label;
      if (mode === 'bind') {
        const owner = j.identity?.resolvedOwner ? ` → ${String(j.identity.resolvedOwner).slice(0, 10)}…` : '';
        setNotice({ kind: 'ok', text: `Bound ${ens} to your on-chain-resolved identity${owner} on a 2-of-2 co-signed account.` });
      } else {
        const mint = j.mintTx ? ` (mint ${String(j.mintTx).slice(0, 12)}…)` : '';
        const cohold = j.coholdVerified
          ? ' · you co-hold the kill switch'
          : (!userAddress ? ' · embedded wallet still initializing — co-hold adds on next register' : '');
        setNotice({ kind: 'ok', text: `Spun up sandbox agent ${ens}${mint}${cohold}` });
      }
      setLabel(''); setAgentPub(''); setErc8004Id(''); setExternalEvm('');
      setDailyCap(''); setWeeklyCap(''); setWinStart(''); setWinEnd('');
      // Also reset the shared fields so a second register never silently inherits the previous agent's
      // allowlist / cap / type / description.
      setCap('5'); setPayees(''); setAgentType(''); setDescription('');
      onRegistered();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.9rem' }}>
      <span className="eyebrow">govern an existing agent</span>
      <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.9rem', maxWidth: '60ch' }}>
        Bind an agent you already run — its own Hedera key + on-chain identity — to a 2-of-2 co-signed spending
        account and an ENS-declared policy. LEASH co-controls spend and can revoke, but never holds the agent’s
        key or mints its identity.
      </p>

      {/* Mode toggle: bind (primary) vs sandbox mint (secondary). */}
      <div role="tablist" aria-label="Register mode" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className={`pill ${mode === 'bind' ? 'pill-allow' : 'pill-idle'}`} role="tab" aria-selected={mode === 'bind'}
          style={{ cursor: 'pointer' }} onClick={() => setMode('bind')} disabled={busy}>Bind an existing agent</button>
        <button className={`pill ${mode === 'mint' ? 'pill-allow' : 'pill-idle'}`} role="tab" aria-selected={mode === 'mint'}
          style={{ cursor: 'pointer' }} onClick={() => setMode('mint')} disabled={busy}>or spin up a sandbox agent</button>
      </div>

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

      {/* Bind-mode identity inputs (only in bind mode). */}
      {mode === 'bind' && (
        <div style={{ display: 'grid', gap: '0.6rem', borderTop: '1px solid var(--color-line, rgba(255,255,255,0.08))', paddingTop: '0.8rem' }}>
          <label style={{ display: 'grid', gap: '0.3rem' }}>
            <span className="eyebrow">agent’s Hedera public key (agentPub) · required</span>
            <input className="field" placeholder="302a300506032b6570032100…" value={agentPub} onChange={(e) => setAgentPub(e.target.value)} disabled={busy} />
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.78rem' }}>
              Your agent generated this; LEASH never sees the private half.
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span className="eyebrow">ERC-8004 agentId · resolved on-chain</span>
              <input className="field" placeholder="7395" value={erc8004Id} onChange={(e) => setErc8004Id(e.target.value)} disabled={busy} inputMode="numeric" />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              <span className="eyebrow">external EVM address · resolved on-chain</span>
              <input className="field" placeholder="0x…" value={externalEvm} onChange={(e) => setExternalEvm(e.target.value)} disabled={busy} />
            </label>
          </div>
          <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.78rem' }}>
            LEASH calls the ERC-8004 Identity Registry to resolve the owner on-chain (advisory, on-chain-resolved — not proof-of-control). Supply at least one.
          </span>
        </div>
      )}

      <details>
        <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Advanced · allowlist, identity, dynamic limits</summary>
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

          {/* [REFRAME D4] Rolling SOFT caps + stateless UTC time-window. */}
          <div style={{ borderTop: '1px solid var(--color-line, rgba(255,255,255,0.08))', paddingTop: '0.7rem', display: 'grid', gap: '0.6rem' }}>
            <span className="eyebrow">dynamic limits (optional)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                <span className="eyebrow">rolling daily cap (USDC)</span>
                <input className="field" placeholder="50" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} disabled={busy} inputMode="decimal" />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                <span className="eyebrow">rolling weekly cap (USDC)</span>
                <input className="field" placeholder="200" value={weeklyCap} onChange={(e) => setWeeklyCap(e.target.value)} disabled={busy} inputMode="decimal" />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                <span className="eyebrow">window start · HH:MM UTC</span>
                <input className="field" placeholder="09:00" value={winStart} onChange={(e) => setWinStart(e.target.value)} disabled={busy} />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                <span className="eyebrow">window end · HH:MM UTC</span>
                <input className="field" placeholder="17:00" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} disabled={busy} />
              </label>
            </div>
            <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.78rem' }}>
              Rolling caps are SOFT budgets over the lagging HCS mirror index — the per-call cap stays the hard bound. The window is a stateless UTC gate.
            </span>
          </div>
        </div>
      </details>

      <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => void submit()} disabled={busy} aria-busy={busy}>
        {busy
          ? (mode === 'bind' ? 'Binding (resolve identity + co-signed account + policy)…' : 'Provisioning sandbox account + ENS…')
          : (mode === 'bind' ? 'Bind agent' : 'Spin up sandbox agent')}
      </button>
    </section>
  );
}
