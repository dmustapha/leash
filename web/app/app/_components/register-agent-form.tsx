// File: web/app/app/_components/register-agent-form.tsx
// Bind an agent to the leash. Bind-an-existing-agent is PRIMARY: bind an agent you already run (its own Hedera
// public key + an on-chain identity) to a co-owned spending account and a policy. LEASH never mints the agent's
// identity and never sees its private key. The sandbox path stays available but secondary.
//
// Plain language on the surface; technical inputs (Hedera key, ERC-8004 id, EVM address, budgets, active hours)
// live behind clear labels. All original validation + payloads + LOAD-BEARING defaults are preserved exactly.
'use client';

import { useState } from 'react';
import type { Notice, AuthedFetch } from '../app-console';

type Props = { orgId: string; userAddress: string | null; onRegistered: () => void; setNotice: (n: Notice) => void; authedFetch: AuthedFetch };

// USDC (6 decimals) display string -> raw smallest-unit string. "5" -> "5000000". null if invalid.
function toRaw(usdc: string): string | null {
  if (!/^\d+(\.\d{1,6})?$/.test(usdc.trim())) return null;
  const [whole, frac = ''] = usdc.trim().split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(frac.padEnd(6, '0'))).toString();
}

// "HH:MM" (UTC) -> minute-of-day 0..1439, or null.
function toMinute(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export default function RegisterAgentForm({ orgId, userAddress, onRegistered, setNotice, authedFetch }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'bind' | 'mint'>('bind');
  const [label, setLabel] = useState('');
  const [cap, setCap] = useState('5');
  const [payees, setPayees] = useState('');
  const [agentType, setAgentType] = useState('');
  const [description, setDescription] = useState('');
  const [agentPub, setAgentPub] = useState('');
  const [erc8004Id, setErc8004Id] = useState('');
  const [externalEvm, setExternalEvm] = useState('');
  const [dailyCap, setDailyCap] = useState('');
  const [weeklyCap, setWeeklyCap] = useState('');
  const [winStart, setWinStart] = useState('');
  const [winEnd, setWinEnd] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const maxPerCall = toRaw(cap);
    if (!label.trim()) return setNotice({ kind: 'err', text: 'Enter a name for the agent.' });
    if (!maxPerCall) return setNotice({ kind: 'err', text: 'The per-payment limit must be a dollar amount (up to 6 decimals).' });

    let dailyRaw: string | undefined;
    let weeklyRaw: string | undefined;
    let allowedWindows: { startMinuteUtc: number; endMinuteUtc: number }[] | undefined;
    if (dailyCap.trim()) {
      dailyRaw = toRaw(dailyCap) ?? undefined;
      if (!dailyRaw) return setNotice({ kind: 'err', text: 'The daily budget must be a dollar amount (up to 6 decimals).' });
    }
    if (weeklyCap.trim()) {
      weeklyRaw = toRaw(weeklyCap) ?? undefined;
      if (!weeklyRaw) return setNotice({ kind: 'err', text: 'The weekly budget must be a dollar amount (up to 6 decimals).' });
    }
    if (winStart.trim() || winEnd.trim()) {
      const s = toMinute(winStart), e = toMinute(winEnd);
      if (s === null || e === null) return setNotice({ kind: 'err', text: 'Active hours need a start and end as HH:MM (UTC).' });
      if (s >= e) return setNotice({ kind: 'err', text: 'The start time must be before the end time.' });
      allowedWindows = [{ startMinuteUtc: s, endMinuteUtc: e }];
    }

    if (mode === 'bind') {
      // agentPub is OPTIONAL. Blank = LEASH generates the agent's Hedera keypair and shows the private key once.
      if (!erc8004Id.trim() && !externalEvm.trim()) {
        return setNotice({ kind: 'err', text: 'Provide an ERC-8004 agent id and/or an external EVM address for the identity.' });
      }
      if (externalEvm.trim() && !/^0x[0-9a-fA-F]{40}$/.test(externalEvm.trim())) {
        return setNotice({ kind: 'err', text: 'The external EVM address must be a 0x… 40-hex address.' });
      }
      if (erc8004Id.trim() && !/^\d+$/.test(erc8004Id.trim())) {
        return setNotice({ kind: 'err', text: 'The ERC-8004 agent id must be a whole number.' });
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
        ? { bindExisting: true, agentPub: agentPub.trim() || undefined, erc8004Id: erc8004Id.trim() || undefined, externalEvm: externalEvm.trim() || undefined }
        : {};
      const r = await authedFetch('/api/agents', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...common, ...bindPayload }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      const ens = j.agent?.ensName ?? label;
      if (mode === 'bind') {
        if (j.agentKeyOnce) {
          setNotice({ kind: 'ok', text: `${label} is on the leash, bound to a co-owned account under ${ens}. SAVE YOUR AGENT'S HEDERA KEY NOW (shown once, LEASH does not keep it): ${j.agentKeyOnce} — give it to your agent so it can co-sign its own payments.` });
        } else {
          setNotice({ kind: 'ok', text: `${label} is on the leash, bound to a co-owned account under ${ens}.` });
        }
      } else {
        const cohold = j.coholdVerified
          ? ' · you co-own the kill switch'
          : (!userAddress ? ' · your embedded wallet is still initializing, co-ownership adds on next bind' : '');
        setNotice({ kind: 'ok', text: `Sandbox agent ${label} is ready${cohold}.` });
      }
      setLabel(''); setAgentPub(''); setErc8004Id(''); setExternalEvm('');
      setDailyCap(''); setWeeklyCap(''); setWinStart(''); setWinEnd('');
      setCap('5'); setPayees(''); setAgentType(''); setDescription('');
      setOpen(false);
      onRegistered();
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card" style={{ padding: 'clamp(1.1rem, 3vw, 1.5rem)', display: 'grid', gap: open ? '1rem' : '0.75rem' }} aria-label="Bind an agent">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <h2 style={{ fontSize: 'var(--text-h2)' }}>Bind an agent</h2>
          <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.9rem', maxWidth: '54ch' }}>
            Put an agent you already run on the leash, with its own limit, allowlist, and budgets.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="bind-agent-form">
          {open ? 'Close' : 'Bind an agent'}
        </button>
      </div>

      {open && (
        <div id="bind-agent-form" className="fade-in" style={{ display: 'grid', gap: '1rem', borderTop: '1px solid var(--color-line)', paddingTop: '1rem' }}>
          <div role="tablist" aria-label="How to add the agent" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className={`pill ${mode === 'bind' ? 'pill-accent' : 'pill-idle'}`} role="tab" aria-selected={mode === 'bind'}
              style={{ cursor: 'pointer' }} onClick={() => setMode('bind')} disabled={busy}>Bind an agent I run</button>
            <button className={`pill ${mode === 'mint' ? 'pill-accent' : 'pill-idle'}`} role="tab" aria-selected={mode === 'mint'}
              style={{ cursor: 'pointer' }} onClick={() => setMode('mint')} disabled={busy}>or spin up a sandbox agent</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
            <Field label="Name">
              <input className="field" placeholder="data-buyer" value={label} onChange={(e) => setLabel(e.target.value)} disabled={busy} aria-label="Agent name" />
            </Field>
            <Field label="Up to … per payment (USD)">
              <input className="field" placeholder="5" value={cap} onChange={(e) => setCap(e.target.value)} disabled={busy} inputMode="decimal" aria-label="Per-payment limit in USD" />
            </Field>
          </div>

          {mode === 'bind' && (
            <div style={{ display: 'grid', gap: '0.75rem', borderTop: '1px solid var(--color-line)', paddingTop: '0.9rem' }}>
              <Field label="Agent’s Hedera public key · optional" hint="Leave blank and LEASH generates the key for you (shown once, never kept). Advanced: paste your agent’s own Hedera public key to keep the private half entirely yours.">
                <input className="field" placeholder="Leave blank — LEASH generates it for you" value={agentPub} onChange={(e) => setAgentPub(e.target.value)} disabled={busy} aria-label="Agent Hedera public key (optional)" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <Field label="ERC-8004 agent id" hint="resolved on-chain">
                  <input className="field" placeholder="7395" value={erc8004Id} onChange={(e) => setErc8004Id(e.target.value)} disabled={busy} inputMode="numeric" aria-label="ERC-8004 agent id" />
                </Field>
                <Field label="External EVM address" hint="resolved on-chain">
                  <input className="field" placeholder="0x…" value={externalEvm} onChange={(e) => setExternalEvm(e.target.value)} disabled={busy} aria-label="External EVM address" />
                </Field>
              </div>
              <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>
                LEASH resolves the owner on-chain (advisory, on-chain-resolved, not proof-of-control). Provide at least one.
              </p>
            </div>
          )}

          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.88rem' }}>More options · allowlist, description, budgets, active hours</summary>
            <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
              <Field label="Who it can pay" hint="Comma-separated accounts. Defaults to the org receiver.">
                <input className="field" placeholder="0.0.123, 0.0.456" value={payees} onChange={(e) => setPayees(e.target.value)} disabled={busy} aria-label="Allowed payees" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <Field label="What it is" hint="advisory label">
                  <input className="field" placeholder="data buyer" value={agentType} onChange={(e) => setAgentType(e.target.value)} disabled={busy} aria-label="Agent type" />
                </Field>
                <Field label="Description" hint="advisory">
                  <input className="field" placeholder="Buys premium API data within a $5 limit" value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} aria-label="Agent description" />
                </Field>
              </div>
              <div style={{ borderTop: '1px solid var(--color-line)', paddingTop: '0.9rem', display: 'grid', gap: '0.75rem' }}>
                <span className="eyebrow">budgets &amp; active hours (optional)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                  <Field label="Up to … a day (USD)">
                    <input className="field" placeholder="50" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} disabled={busy} inputMode="decimal" aria-label="Daily budget in USD" />
                  </Field>
                  <Field label="Up to … a week (USD)">
                    <input className="field" placeholder="200" value={weeklyCap} onChange={(e) => setWeeklyCap(e.target.value)} disabled={busy} inputMode="decimal" aria-label="Weekly budget in USD" />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <Field label="Active from (HH:MM UTC)">
                    <input className="field" placeholder="09:00" value={winStart} onChange={(e) => setWinStart(e.target.value)} disabled={busy} aria-label="Active window start" />
                  </Field>
                  <Field label="Active to (HH:MM UTC)">
                    <input className="field" placeholder="17:00" value={winEnd} onChange={(e) => setWinEnd(e.target.value)} disabled={busy} aria-label="Active window end" />
                  </Field>
                </div>
                <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>
                  Daily and weekly are soft budgets; the per-payment limit is the hard one. Active hours are a UTC gate.
                </p>
              </div>
            </div>
          </details>

          <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => void submit()} disabled={busy} aria-busy={busy}>
            {busy
              ? (mode === 'bind' ? 'Binding…' : 'Setting up sandbox agent…')
              : (mode === 'bind' ? 'Bind this agent' : 'Spin up sandbox agent')}
          </button>
        </div>
      )}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span className="label">{label}</span>
      {children}
      {hint && <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.76rem' }}>{hint}</span>}
    </label>
  );
}
