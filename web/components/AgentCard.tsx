// File: web/components/AgentCard.tsx
// F-013 hierarchy: one card per agent under the org, showing its DISTINCT cap + allowlist + binding.
// Purely presentational (props down) - the parent owns the live policy fetch. Craft-floor .card
// (elevation, not a flat box); the "hero" flag ambers the card that the four beats drive.
import type { AgentPolicy } from '../../types';
import { usdc } from '../lib/demo';

type AgentIdentity = { description?: string; type?: string; avatar?: string; erc8004?: string };
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
      className="card fade-in"
      style={{
        padding: '1rem 1.1rem',
        display: 'grid',
        gap: '0.7rem',
        ...(hero ? { boxShadow: 'var(--shadow-amber)', borderColor: 'transparent' } : {}),
      }}
      aria-label={`Agent ${name}`}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <div className="eyebrow">{label}</div>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{name}</h4>
        </div>
        {loading ? (
          <span className="pill pill-idle" aria-live="polite">reading…</span>
        ) : revoked ? (
          <span className="pill pill-deny">revoked</span>
        ) : (
          <span className="pill pill-allow">active</span>
        )}
      </header>

      {/* [WS-7 D1] Advisory ENS identity (agent.type / agent.description) - display only, never enforcement. */}
      {!loading && identity && (identity.type || identity.description) && (
        <p style={{ margin: 0, color: 'var(--color-ink-dim)', fontSize: '0.82rem' }}>
          {identity.type && <span className="pill pill-idle" style={{ marginRight: '0.5rem' }}>{identity.type}</span>}
          {identity.description}
        </p>
      )}

      {loading ? (
        <div className="code" style={{ color: 'var(--color-ink-faint)' }}>reading policy from ENS…</div>
      ) : policy ? (
        <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.9rem', margin: 0 }}>
          <dt className="eyebrow" style={{ alignSelf: 'center' }}>cap / call</dt>
          <dd style={{ margin: 0, fontWeight: 600 }}>
            {usdc(policy.maxPerCall)} <span style={{ color: 'var(--color-ink-dim)', fontWeight: 400 }}>USDC</span>
          </dd>
          <dt className="eyebrow" style={{ alignSelf: 'center' }}>payee</dt>
          <dd className="code" style={{ margin: 0 }}>{policy.allowedPayees.join(', ')}</dd>
          <dt className="eyebrow" style={{ alignSelf: 'center' }}>account</dt>
          <dd className="code" style={{ margin: 0 }}>{policy.hederaAccount}</dd>
        </dl>
      ) : (
        <div className="code" style={{ color: 'var(--color-deny)' }}>
          leash.policy record is empty on ENS — this agent cannot spend (fail-closed).
        </div>
      )}
    </article>
  );
}
