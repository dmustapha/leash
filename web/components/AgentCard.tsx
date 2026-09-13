// File: web/components/AgentCard.tsx
// F-013 hierarchy: one card per agent under the org, showing its DISTINCT cap + allowlist + binding.
// Purely presentational (props down); the parent owns the live policy fetch. Mission-control card
// (elevation + hover, never a flat box); the "hero" flag accents the card that the four beats drive.
import type { AgentPolicy } from '../../types';
import { usdc } from '../lib/demo';

type AgentIdentity = { description?: string; type?: string; avatar?: string; erc8004?: string; address?: string };
type Props = {
  name: string;
  label: string;
  policy: AgentPolicy | null;
  revoked: boolean;
  loading?: boolean;
  hero?: boolean;
  identity?: AgentIdentity | null;
};

export default function AgentCard({ name, label, policy, revoked, loading, hero, identity }: Props) {
  return (
    <article
      className="card card-hover rise"
      style={{
        padding: '1.15rem 1.2rem',
        display: 'grid',
        gap: '0.85rem',
        ...(hero ? { boxShadow: 'var(--shadow-accent)', borderColor: 'transparent' } : {}),
      }}
      aria-label={`Agent ${name}`}
    >
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div className="eyebrow">{label}</div>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--color-ink)' }}>{name}</h4>
        </div>
        {loading ? (
          <span className="pill pill-idle" aria-live="polite">reading…</span>
        ) : revoked ? (
          <span className="pill pill-deny">revoked</span>
        ) : (
          <span className="pill pill-allow">active</span>
        )}
      </header>

      {/* [WS-7 D1] Advisory ENS identity (agent.type / agent.description), display only, never enforcement. */}
      {!loading && identity && (identity.type || identity.description) && (
        <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.82rem', lineHeight: 1.5 }}>
          {identity.type && <span className="pill pill-idle" style={{ marginRight: '0.5rem' }}>{identity.type}</span>}
          {identity.description}
        </p>
      )}

      {/* On-chain-resolved external identity (agent.address, read from the ENS record). "on-chain-resolved", never "verified". */}
      {!loading && identity?.address && (
        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--color-ink-faint)' }}>
          on-chain-resolved identity{' '}
          <span className="code" style={{ color: 'var(--color-accent)' }}>
            {identity.address.slice(0, 6)}…{identity.address.slice(-4)}
          </span>{' '}
          <span style={{ color: 'var(--color-ink-faint)' }}>(Circle wallet on Arc)</span>
        </p>
      )}

      <hr className="divider" />

      {loading ? (
        <div className="code" style={{ color: 'var(--color-ink-faint)' }}>reading the limits from ENS…</div>
      ) : policy ? (
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          {/* Plain-language summary first, so a judge reads the limit as a sentence, not a table. */}
          <p style={{ margin: 0, color: 'var(--color-ink)', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
            Up to {usdc(policy.maxPerCall)} USDC per payment, can pay api.acme.dev.
          </p>
          <details>
            <summary style={{ cursor: 'pointer', color: 'var(--color-ink-dim)', fontSize: '0.82rem' }}>view the on-chain record</summary>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', margin: '0.6rem 0 0' }}>
              <dt className="eyebrow" style={{ alignSelf: 'center' }}>cap / call</dt>
              <dd style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {usdc(policy.maxPerCall)} <span style={{ color: 'var(--color-ink-dim)', fontWeight: 400, fontFamily: 'var(--font-sans)' }}>USDC</span>
              </dd>
              <dt className="eyebrow" style={{ alignSelf: 'center' }}>payee</dt>
              <dd className="code" style={{ margin: 0 }}>{policy.allowedPayees.join(', ')}</dd>
              <dt className="eyebrow" style={{ alignSelf: 'center' }}>account</dt>
              <dd className="code" style={{ margin: 0 }}>{policy.hederaAccount}</dd>
            </dl>
          </details>
        </div>
      ) : (
        <div className="toast toast-err" style={{ alignItems: 'center' }}>
          <span className="pill pill-deny">fail-closed</span>
          <span className="code" style={{ color: 'var(--color-deny)', flex: 1 }}>
            No limits on record, so this agent cannot spend.
          </span>
        </div>
      )}
    </article>
  );
}
