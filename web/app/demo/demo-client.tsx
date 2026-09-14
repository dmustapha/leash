// File: web/app/demo/demo-client.tsx
// The judge sandbox, redesigned as a GUIDED WALKTHROUGH (presentation only; every fetch, payload, response
// field, beat id + order, running/disabled logic, and the LiveResult/AgentPolicy types are UNCHANGED).
// A judge watches SOLV-001 (a real autonomous agent) get governed, one step at a time:
//   ① Meet the agent   -> orientation only (its limit + allowlist as a plain sentence)
//   ② It pays in cap   -> beat 'spend'   "Paid $3, gas-free"
//   ③ It tries to overspend -> beat 'refuse' "Blocked, over the cap"
//   ④ Cut it off       -> beat 'revoke'  "Revoked, cut off everywhere"
//   ⑤ Leaked key can't over-fund -> beat 'deny' "Blocked by the funding rail"
//
// Honest framing (INVARIANT #4): the facilitator LEASH runs enforces the limits the org set. No
// "trustless" / "chain enforces" / "verified identity" / "mint an agent" language. The judge sandbox
// governs SOLV-001 (a real autonomous agent, Circle wallet on Arc, identity on-chain-resolved). LEASH
// governs its spend through this Hedera account (the Arc-vs-Hedera seam); the /app console is where a new
// user binds their own agent the same way.
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import SplitScreen, { type LiveResult } from '../../components/SplitScreen';
import AgentCard from '../../components/AgentCard';
import SiteNav from '../../components/SiteNav';
import type { AgentPolicy } from '../../../types';

type Beat = 'spend' | 'refuse' | 'revoke' | 'deny' | 'reactivate';

type AgentIdentity = { description?: string; type?: string; avatar?: string; erc8004?: string; address?: string };
type PolicyState = { policy: AgentPolicy | null; identity: AgentIdentity | null; revoked: boolean; loading: boolean };
type AuditRow = { id: string; agentName: string; decision: string; amount: string; payTo: string; reason: string | null; ts: string };

function usdcAmount(raw: string): string {
  return (Number(raw) / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 });
}

// The guided flow. Step 0 is orientation (no beat); steps 1..4 each map to exactly ONE existing beat call,
// in the frozen order spend -> refuse -> revoke -> deny.
type Step = {
  n: number;
  beat: Beat | null;
  title: string;
  lead: string;         // what this step proves, in plain language
  cta: string;          // button label
  proves: string;       // one-line "what this proves" orientation
};

const STEPS: Step[] = [
  {
    n: 1,
    beat: null,
    title: 'Meet SOLV-001',
    lead: 'SOLV-001 is a real autonomous agent (a Circle wallet on Arc), bound to LEASH with a spending limit set by its org. Read what it may spend, then walk it through what happens when it stays in bounds, tries to overspend, and gets cut off.',
    cta: 'Start the walkthrough',
    proves: 'Who the agent is (on-chain-resolved identity) and the limits it runs under.',
  },
  {
    n: 2,
    beat: 'spend',
    title: 'It pays within its limit',
    lead: 'The agent pays a whitelisted API for $3, under its $5 cap. The facilitator LEASH runs enforces the limits you set, so the payment goes through, gas-free.',
    cta: 'Let it pay $3',
    proves: 'A real payment inside the cap is allowed and settles gas-free.',
  },
  {
    n: 3,
    beat: 'refuse',
    title: 'It tries to overspend',
    lead: 'Same agent, same account, but now it asks for $50, well over its $5 cap. Watch it get blocked at the rail before any money moves.',
    cta: 'Let it try $50',
    proves: 'A payment over the cap is blocked, not merely warned.',
  },
  {
    n: 4,
    beat: 'revoke',
    title: 'Cut it off',
    lead: 'The org clears the agent’s limits on-chain. The record goes empty and the very next payment fails, everywhere. This is the kill switch.',
    cta: 'Cut it off',
    proves: 'Revoking the limits cuts the agent off, and the next payment fails closed.',
  },
  {
    n: 5,
    beat: 'deny',
    title: 'Even a leaked key can’t over-fund it',
    lead: 'Suppose the agent’s key leaks and an attacker tries to over-fund it. The funding rail denies the top-up, so the blast radius stays capped.',
    cta: 'Try to over-fund it',
    proves: 'An over-fund is denied by the funding rail, capping the damage.',
  },
  {
    n: 6,
    beat: 'reactivate',
    title: 'Clip the leash back on',
    lead: 'Cutting an agent off is not permanent. The org restores SOLV-001’s limit on-chain, the record is populated again, and it can pay within its cap. Revoke and re-enable are a round trip, and the sandbox is left live for the next run.',
    cta: 'Re-enable it',
    proves: 'Re-binding the limit brings the agent back online: the kill switch is reversible.',
  },
];

type Props = {
  org: string;
  dataAgent: string;
  paymentsAgent: string;
  hcsTopicId: string;
  hcsTopicUrl: string | null;
};

export default function DemoClient({ org, dataAgent, paymentsAgent, hcsTopicId, hcsTopicUrl }: Props) {
  const [result, setResult] = useState<LiveResult>(null);
  const [running, setRunning] = useState<Beat | null>(null);
  const [log, setLog] = useState<NonNullable<LiveResult>[]>([]);
  const [step, setStep] = useState(0); // 0-based index into STEPS; where the judge is in the walkthrough
  const [done, setDone] = useState<Record<number, boolean>>({}); // which steps have been run
  const [cards, setCards] = useState<Record<string, PolicyState>>({
    [dataAgent]: { policy: null, identity: null, revoked: false, loading: true },
    [paymentsAgent]: { policy: null, identity: null, revoked: false, loading: true },
  });
  const [audit, setAudit] = useState<AuditRow[]>([]);

  // [WS-7 B3] Live audit scroll: the actual ALLOW/DENY decisions the facilitator logged to the HCS topic,
  // indexed and read back through the spend feed. Public ledger data (no auth), refreshed after each beat.
  const loadAudit = useCallback(async () => {
    try {
      const r = await fetch('/api/feed?limit=8', { cache: 'no-store' });
      const j = await r.json();
      setAudit(Array.isArray(j.events) ? j.events : []);
    } catch { /* a mirror/index hiccup must not break the demo */ }
  }, []);

  const loadCard = useCallback(async (name: string) => {
    try {
      const r = await fetch(`/api/policy/${encodeURIComponent(name)}`, { cache: 'no-store' });
      const j = await r.json();
      setCards((c) => ({ ...c, [name]: { policy: j.policy ?? null, identity: j.identity ?? null, revoked: !!j.revoked, loading: false } }));
    } catch {
      setCards((c) => ({ ...c, [name]: { ...c[name], loading: false } }));
    }
  }, []);

  // Load both cards + the audit scroll on mount. SELF-HEAL: a previous visitor may have left SOLV-001 revoked
  // (the walkthrough's step 4 clears its policy on-chain). If so, re-enable it BEFORE rendering the cards so
  // every fresh judge starts on a working sandbox. The reactivate beat is idempotent (it only writes to Sepolia
  // when the record is actually empty), so this is a cheap ENS read on the healthy path.
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch(`/api/policy/${encodeURIComponent(dataAgent)}`, { cache: 'no-store' });
        const j = await r.json();
        if (j.revoked) {
          await fetch('/api/demo', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ beat: 'reactivate' }) });
        }
      } catch { /* self-heal is best-effort; never block the sandbox from rendering */ }
      void loadCard(dataAgent); void loadCard(paymentsAgent); void loadAudit();
    })();
  }, [loadCard, dataAgent, paymentsAgent, loadAudit]);

  const runBeat = useCallback(
    async (beat: Beat) => {
      setRunning(beat);
      try {
        const r = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ beat }),
        });
        const j = (await r.json()) as NonNullable<LiveResult>;
        setResult(j);
        setLog((l) => [j, ...l].slice(0, 8));
        // The data agent's on-chain record changed on revoke/reactivate; refresh its card.
        if (beat === 'revoke' || beat === 'reactivate') await loadCard(dataAgent);
        // A new ALLOW/DENY was logged to HCS; pull it into the audit scroll.
        void loadAudit();
      } catch (e) {
        const err = { beat, error: 'request failed', message: e instanceof Error ? e.message : String(e) } as NonNullable<LiveResult>;
        setResult(err);
        setLog((l) => [err, ...l].slice(0, 8));
      } finally {
        setRunning(null);
      }
    },
    [loadCard, dataAgent, loadAudit],
  );

  // Advance the walkthrough. Step 0 (Meet the agent) just moves forward; the rest run their one beat first.
  const advance = useCallback(
    async (idx: number) => {
      const s = STEPS[idx];
      if (s.beat) await runBeat(s.beat);
      setDone((d) => ({ ...d, [idx]: true }));
      setStep((cur) => Math.min(cur + 1, STEPS.length - 1));
    },
    [runBeat],
  );

  const active = STEPS[step];
  const complete = useMemo(() => STEPS.slice(1).every((_, i) => done[i + 1]), [done]);
  const progressPct = useMemo(() => (Object.keys(done).length / STEPS.length) * 100, [done]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <SiteNav />

      <main className="wrap-narrow" style={{ padding: 'clamp(1.75rem, 4vw, 3rem) 0 4.5rem', flex: 1 }}>
        {/* Orientation header */}
        <header className="fade-in" style={{ marginBottom: '1.5rem' }}>
          <span className="pill pill-accent" style={{ marginBottom: '0.9rem' }}>
            judge sandbox · no login · no wallet · no ETH
          </span>
          <h1 style={{ fontSize: 'var(--text-h1)', marginTop: '0.4rem' }}>
            Watch SOLV-001 get governed
          </h1>
          <p style={{ maxWidth: '64ch', color: 'var(--color-ink-dim)', marginTop: '0.75rem', fontSize: '1rem' }}>
            Follow five steps. SOLV-001 has a spending limit, and you watch it pay inside that limit, get
            blocked when it tries to overspend, get cut off, and see that even a leaked key can&apos;t over-fund it.
            Every step runs a <strong style={{ color: 'var(--color-ink)' }}>real</strong> on-chain action.
          </p>

          {/* Honest SOLV-001 framing: real agent, Arc identity, Hedera-governed (the Arc-vs-Hedera seam). */}
          <p className="raised" style={{ maxWidth: '64ch', marginTop: '1rem', padding: '0.7rem 0.9rem', color: 'var(--color-ink-dim)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            <a className="link-tx" href="https://github.com/dmustapha/solv-001" target="_blank" rel="noreferrer">SOLV-001</a>{' '}
            is a real autonomous agent (a Circle wallet on Arc) that earns and pays for services. Its identity is
            on-chain-resolved, and LEASH governs its spend through a Hedera account under{' '}
            <code className="code" style={{ display: 'inline', color: 'var(--color-accent)' }}>{org}</code>. SOLV-001
            settles natively on Arc; the controls below run on its LEASH Hedera account. In{' '}
            <a className="link-tx" href="/app">the console</a> a new user binds their own agent the same way.
          </p>
        </header>

        {/* Stepper rail: orientation + progress */}
        <nav aria-label="Walkthrough progress" style={{ marginBottom: '1.5rem' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {STEPS.map((s, i) => {
              const state = done[i] ? 'done' : i === step ? 'current' : 'todo';
              return (
                <li key={s.n} style={{ flex: '1 1 150px', minWidth: 140 }}>
                  <div
                    className={i === step ? 'raised' : 'panel'}
                    aria-current={i === step ? 'step' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.55rem',
                      padding: '0.55rem 0.7rem', height: '100%',
                      borderColor: state === 'current' ? 'var(--color-accent)' : undefined,
                      opacity: state === 'todo' ? 0.62 : 1,
                    }}
                  >
                    <span
                      aria-hidden
                      className="pill"
                      style={{
                        minWidth: 26, height: 26, justifyContent: 'center', padding: 0,
                        background: state === 'done' ? 'var(--color-allow-soft)' : state === 'current' ? 'var(--color-accent-soft)' : 'var(--color-surface-2)',
                        color: state === 'done' ? 'var(--color-allow)' : state === 'current' ? 'var(--color-accent)' : 'var(--color-ink-faint)',
                        borderColor: state === 'done' ? 'rgba(79,208,138,0.35)' : state === 'current' ? 'rgba(198,242,77,0.35)' : 'var(--color-line)',
                      }}
                    >
                      {done[i] ? '✓' : s.n}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: i === step ? 600 : 500, color: i === step ? 'var(--color-ink)' : 'var(--color-ink-dim)', lineHeight: 1.25 }}>
                      {s.title}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="meter" style={{ marginTop: '0.7rem' }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)} aria-label="Walkthrough completion">
            <div className="meter-fill" style={{ width: `${progressPct}%`, transition: 'width 300ms var(--ease-out)' }} />
          </div>
        </nav>

        {/* The live A/B centerpiece: limits (left) vs outcome (right) */}
        <SplitScreen agentName={dataAgent} result={result} />

        {/* Active-step driver: what you're on, what it proves, one action */}
        <section aria-label="Current step" style={{ marginTop: '1.5rem' }}>
          <div className="card card-hover fade-in" key={step} style={{ padding: 'clamp(1.1rem, 3vw, 1.6rem)', display: 'grid', gap: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.7rem', flexWrap: 'wrap' }}>
              <span className="eyebrow">step {active.n} of {STEPS.length}</span>
              <h2 style={{ fontSize: 'var(--text-h2)' }}>{active.title}</h2>
            </div>
            <p style={{ color: 'var(--color-ink-dim)', maxWidth: '62ch', margin: 0 }}>{active.lead}</p>
            <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.85rem', margin: 0 }}>
              <span className="eyebrow" style={{ marginRight: '0.4rem' }}>proves</span>{active.proves}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
              {!complete ? (
                <button
                  className="btn btn-primary card-hover"
                  onClick={() => void advance(step)}
                  disabled={running !== null}
                  aria-busy={active.beat ? running === active.beat : undefined}
                >
                  {active.cta}
                  {active.beat && running === active.beat && (
                    <span className="spin" aria-hidden style={{ width: 15, height: 15, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  )}
                </button>
              ) : (
                <span className="pill pill-allow">walkthrough complete ✓</span>
              )}

              {step > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={running !== null}>
                  Back a step
                </button>
              )}
              {complete && (
                <a className="btn btn-sm" href="/app">Govern your own agent →</a>
              )}
            </div>
          </div>
        </section>

        {/* The hierarchy under the org (two children, distinct caps) */}
        <section aria-label="Agent hierarchy" style={{ marginTop: '2.25rem' }}>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-dim)', marginBottom: '1rem', fontSize: '0.92rem' }}>
              The hierarchy under <code className="code" style={{ display: 'inline', color: 'var(--color-accent)' }}>{org}</code>: two agents, different limits
            </summary>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
              <AgentCard name={dataAgent} label="SOLV-001 · this agent" policy={cards[dataAgent]?.policy ?? null} identity={cards[dataAgent]?.identity ?? null} revoked={cards[dataAgent]?.revoked ?? false} loading={cards[dataAgent]?.loading} hero />
              <AgentCard name={paymentsAgent} label="payments" policy={cards[paymentsAgent]?.policy ?? null} identity={cards[paymentsAgent]?.identity ?? null} revoked={cards[paymentsAgent]?.revoked ?? false} loading={cards[paymentsAgent]?.loading} />
            </div>
          </details>
        </section>

        {/* Live audit trail, in plain language */}
        {hcsTopicUrl && (
          <section aria-label="Audit trail" style={{ marginTop: '2rem' }}>
            <div className="panel card-hover" style={{ padding: '1rem 1.15rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gap: '0.25rem' }}>
                <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="dot-live" aria-hidden />live audit trail
                </span>
                <div style={{ color: 'var(--color-ink-dim)', fontSize: '0.88rem' }}>
                  Every allow or block the facilitator makes is written to a public log you can check.
                </div>
              </div>
              <a className="btn btn-sm" href={hcsTopicUrl} target="_blank" rel="noreferrer">View audit log ↗</a>
            </div>

            {/* [WS-7 B3] Plain-language rows: the real ALLOW/DENY decisions indexed from the HCS topic. */}
            {audit.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0.8rem 0 0', padding: 0, display: 'grid', gap: '0.4rem' }}>
                {audit.map((ev) => {
                  const allowed = ev.decision === 'ALLOW';
                  const agent = ev.agentName.split('.')[0];
                  return (
                    <li key={ev.id} className="raised fade-in" style={{ padding: '0.6rem 0.9rem', display: 'flex', gap: '0.7rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                      <span className={`pill ${allowed ? 'pill-allow' : 'pill-deny'}`} style={{ minWidth: 64, justifyContent: 'center' }}>{allowed ? 'paid' : 'blocked'}</span>
                      <span style={{ color: 'var(--color-ink)' }}>
                        <strong style={{ fontWeight: 600 }}>{agent} agent</strong>{' '}
                        {allowed
                          ? <>paid ${usdcAmount(ev.amount)} to {ev.payTo}</>
                          : <>blocked{ev.reason ? <>, {ev.reason.replace(/_/g, ' ').toLowerCase()}</> : <>, over cap</>}</>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <span className="eyebrow" style={{ letterSpacing: '0.08em' }}>logged to topic {hcsTopicId}</span>
            </div>
          </section>
        )}

        {/* Developer detail, buried behind a subtle fold */}
        {log.length > 0 && (
          <section aria-label="Developer detail" style={{ marginTop: '1.75rem' }}>
            <details>
              <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)', fontSize: '0.82rem' }}>Developer detail · raw responses ({log.length})</summary>
              <pre className="code raised" style={{ padding: '1rem', marginTop: '0.7rem', maxHeight: 320, overflow: 'auto' }}>
                {JSON.stringify(log, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}
