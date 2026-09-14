// File: web/components/SplitScreen.tsx
// R-10 legibility device (WINNER-BRIEF risk #4), redesigned judge-first (presentation only; the fetch,
// the LiveResult type, and the { agentName, result } prop contract are UNCHANGED):
//   LEFT  - the agent's spend policy as a PLAIN human sentence ("Up to $5 per payment, can pay
//           api.acme.dev, active"), read LIVE via /api/policy/[name] (an eth_call, NOT hard-coded - F1).
//           The raw on-chain ENS record is DEMOTED behind a "view the on-chain record" <details> fold.
//   RIGHT - the latest live rail result as a BIG human verdict ("Paid $3 to api.acme.dev, gas-free" /
//           "Blocked, over the cap"), with the real on-chain tx shown as a small "view on-chain" link.
// When the org REVOKES on camera, the LEFT sentence flips to "cut off everywhere" AND the very next
// payment on the RIGHT flips to fail-closed - the negative-WOW, visible simultaneously.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgentPolicy } from '../../types';

export type LiveResult = {
  beat: 'spend' | 'refuse' | 'revoke' | 'deny' | 'reactivate';
  verdict?: string;
  reason?: string;
  txId?: string | null;
  revokeTx?: string;
  fundTx?: string | null;
  policyTx?: string; // reactivate: the Sepolia setPolicy re-bind tx
  gasFree?: boolean;
  note?: string;
  error?: string;
  message?: string;
} | null;

type PolicyRead = { policy: AgentPolicy | null; revoked: boolean; source?: string; readAt?: string } | null;

// "5000000" -> "5" for a human sentence.
function toDollars(raw: string): string {
  const n = Number(raw) / 1_000_000;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// A plain-English rendering of the policy, e.g. "Up to $5 per payment, can pay api.acme.dev, active".
function policySentence(policy: AgentPolicy, payeeLabel: string): string {
  const cap = `Up to $${toDollars(policy.maxPerCall)} per payment`;
  const payee = policy.allowedPayees.length ? `, can pay ${payeeLabel}` : '';
  return `${cap}${payee}, active`;
}

export default function SplitScreen({ agentName, result }: { agentName: string; result: LiveResult }) {
  const [read, setRead] = useState<PolicyRead>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setReadError(null);
    try {
      const r = await fetch(`/api/policy/${encodeURIComponent(agentName)}`, { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || j.error || `HTTP ${r.status}`);
      setRead(j);
    } catch (e) {
      setReadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [agentName]);

  useEffect(() => { void refresh(); }, [refresh]);
  // Re-read the on-chain record after every beat so the LEFT panel tracks reality (esp. after revoke).
  useEffect(() => { if (result) void refresh(); }, [result, refresh]);

  const revoked = read?.revoked ?? false;
  const policy = read?.policy ?? null;
  // A friendly payee label so the sentence reads like a product, not a 0.0.x account id.
  const payeeLabel = 'api.acme.dev';

  return (
    <section aria-label="The agent's limits and what the rail just did">
      <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {/* LEFT - the agent's limits, in plain language */}
        <div className="card" style={{ padding: '1.15rem 1.2rem', display: 'grid', gap: '0.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gap: '0.15rem' }}>
              <span className="eyebrow">the limits you set</span>
              <h3 style={{ fontSize: '1rem' }}>What this agent may spend</h3>
            </div>
            {loading ? (
              <span className="pill pill-idle">reading…</span>
            ) : revoked ? (
              <span className="pill pill-deny">cut off</span>
            ) : (
              <span className="pill pill-allow"><span className="dot-live" aria-hidden />active</span>
            )}
          </div>

          <div
            className="raised"
            style={{ minHeight: '5.5rem', display: 'grid', alignContent: 'center', padding: '0.9rem 1rem' }}
            aria-live="polite"
          >
            {readError ? (
              <p style={{ margin: 0, color: 'var(--color-deny)', fontSize: '0.9rem' }}>Could not read the limits: {readError}</p>
            ) : loading ? (
              <p style={{ margin: 0, color: 'var(--color-ink-faint)', fontSize: '0.95rem' }}>Reading the limits from the chain…</p>
            ) : revoked || !policy ? (
              <p style={{ margin: 0, color: 'var(--color-deny)', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                No limits on record. Cut off everywhere, nothing to enforce.
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--color-ink)', fontSize: '1.05rem', fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                {policySentence(policy, payeeLabel)}
              </p>
            )}
          </div>

          {/* The raw ENS record, demoted from the hero into a fold (still a LIVE on-chain read). */}
          <details style={{ marginTop: '0.1rem' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-dim)', fontSize: '0.85rem' }}>
              view the on-chain record
            </summary>
            <p className="eyebrow" style={{ letterSpacing: '0.06em', margin: '0.6rem 0 0.4rem' }}>
              on-chain read · eth_call → resolver.text(name, &quot;leash.policy&quot;)
            </p>
            <pre className="code raised" style={{ minHeight: '5rem', margin: 0, padding: '0.8rem 0.9rem' }} aria-live="polite">
              {readError
                ? `read failed: ${readError}`
                : loading
                ? 'querying ENS…'
                : revoked || !policy
                ? '// record cleared on-chain, nothing to enforce\n{ }'
                : JSON.stringify(policy, null, 2)}
            </pre>
            <button className="btn btn-ghost btn-sm" style={{ justifySelf: 'start', marginTop: '0.6rem' }} onClick={() => void refresh()}>
              re-read from chain
            </button>
          </details>
        </div>

        {/* RIGHT - the latest rail result, as a big human verdict */}
        <div className="card" style={{ padding: '1.15rem 1.2rem', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'grid', gap: '0.15rem' }}>
              <span className="eyebrow">what just happened</span>
              <h3 style={{ fontSize: '1rem' }}>The outcome</h3>
            </div>
            <Verdict result={result} revoked={revoked} />
          </div>
          <div
            className="raised"
            style={{ minHeight: '5.5rem', display: 'grid', alignContent: 'center', gap: '0.6rem', padding: '0.9rem 1rem' }}
            aria-live="polite"
          >
            {!result ? (
              <p style={{ color: 'var(--color-ink-faint)', margin: 0, fontSize: '0.92rem' }}>
                Start the walkthrough. Each step shows a plain-English outcome here, next to the limits it was checked against.
              </p>
            ) : result.error ? (
              <p style={{ color: 'var(--color-deny)', margin: 0, fontSize: '0.95rem' }}>Something went wrong: {result.message || result.error}</p>
            ) : (
              <ResultDetail result={result} />
            )}
          </div>
        </div>
      </div>

      <style>{`@media (min-width: 820px){ .split-grid{ grid-template-columns:1fr 1fr; } }`}</style>
    </section>
  );
}

function Verdict({ result, revoked }: { result: LiveResult; revoked: boolean }) {
  if (!result) return <span className="pill pill-idle">waiting</span>;
  const v = (result.verdict || '').toUpperCase();
  const key = `${result.beat}-${v}-${result.error ?? ''}`;
  if (result.error) return <span key={key} className="pill pill-deny flip-in">error</span>;
  if (v === 'ALLOW') return <span key={key} className="pill pill-allow flip-in">paid</span>;
  if (v === 'REACTIVATED') return <span key={key} className="pill pill-allow flip-in">re-enabled</span>;
  if (v === 'REVOKED') return <span key={key} className="pill pill-deny flip-in">cut off</span>;
  if (v === 'DENY') return <span key={key} className="pill pill-deny flip-in">blocked</span>;
  return <span key={key} className={`flip-in ${revoked ? 'pill pill-deny' : 'pill pill-idle'}`}>{v || 'done'}</span>;
}

// A big, human headline for each outcome + the real tx as a small "view on-chain" link.
function ResultDetail({ result }: { result: NonNullable<LiveResult> }) {
  const v = (result.verdict || '').toUpperCase();
  let headline = result.note || 'Done.';
  let tone: 'good' | 'bad' = 'good';
  if (v === 'ALLOW') {
    headline = result.gasFree ? 'Paid $3 to api.acme.dev, gas-free.' : 'Paid $3 to api.acme.dev.';
    tone = 'good';
  } else if (v === 'REACTIVATED') {
    headline = 'Re-enabled. Its $5 limit is back on-chain and it can pay again.';
    tone = 'good';
  } else if (v === 'REVOKED') {
    headline = 'Revoked, cut off everywhere. The next payment fails.';
    tone = 'bad';
  } else if (v === 'DENY') {
    headline = result.beat === 'deny' ? 'Blocked by the funding rail.' : 'Blocked, over the $5 cap.';
    tone = 'bad';
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gap: '0.55rem' }}>
      <p
        className="flip-in"
        key={`${result.beat}-${v}`}
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '1.15rem',
          lineHeight: 1.25,
          color: tone === 'good' ? 'var(--color-allow)' : 'var(--color-deny)',
        }}
      >
        {headline}
      </p>

      {result.gasFree && <div><span className="pill pill-accent">gas-free · the agent paid 0</span></div>}

      {result.reason && (
        <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.85rem' }}>
          Why: <span style={{ color: 'var(--color-deny)' }}>{result.reason}</span>
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginTop: '0.1rem' }}>
        {result.txId && (
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://hashscan.io/testnet/transaction/${encodeURIComponent(result.txId)}`}>view on-chain ↗</a>
        )}
        {result.revokeTx && (
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://sepolia.etherscan.io/tx/${result.revokeTx}`}>view revoke on-chain ↗</a>
        )}
        {result.policyTx && (
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://sepolia.etherscan.io/tx/${result.policyTx}`}>view re-enable on-chain ↗</a>
        )}
        {result.fundTx && (
          <a className="link-tx" target="_blank" rel="noreferrer"
             href={`https://hashscan.io/testnet/transaction/${encodeURIComponent(result.fundTx)}`}>view funding on-chain ↗</a>
        )}
      </div>
    </div>
  );
}
