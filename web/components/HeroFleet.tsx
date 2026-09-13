// File: web/components/HeroFleet.tsx
// Kinetic "orbiting fleet" hero graphic for the landing (Direction 4 "Signal Grid").
// acme.leash.eth sits at the center; agent nodes orbit on concentric rings.
// Privy-FREE island so the landing keeps zero import edge to /app (INVARIANT #10).
// All color comes from design tokens (no hardcoded hex). Animation is scoped and
// disabled under prefers-reduced-motion, which leaves a clean static composition.
'use client';

const MARK = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    {/* Concept A tether mark: clasp loop, snap gate, and tether stub, the leash you can cut */}
    <g fill="none" stroke="var(--color-accent)" strokeWidth={3} strokeLinecap="round">
      <circle cx="12" cy="16" r="7" />
      <path d="M17.5 11 l4 -3" />
      <path d="M19 16 h9" />
    </g>
  </svg>
);

// A single orbiting agent node. `state` drives the accent (allow / revoked).
function Node({
  className,
  glyph,
  label,
  state,
}: {
  className: string;
  glyph: string;
  label: string;
  state: 'allow' | 'revoked';
}) {
  return (
    <div className={`hf-node ${className} hf-${state}`}>
      <span className="hf-chip" aria-hidden="true">{glyph}</span>
      <span>{label}</span>
    </div>
  );
}

export default function HeroFleet() {
  return (
    <div className="hf" aria-hidden="true">
      <div className="hf-rings">
        <span className="hf-ring hf-r1" />
        <span className="hf-ring hf-r2" />
        <span className="hf-ring hf-r3" />
      </div>

      <Node className="hf-n1" glyph="◆" label="data" state="allow" />
      <Node className="hf-n2" glyph="◆" label="payments" state="allow" />
      <Node className="hf-n3" glyph="✕" label="research" state="revoked" />

      <div className="hf-core">
        <div className="hf-hub">{MARK(40)}</div>
        <div className="hf-lbl">
          <b>acme.leash.eth</b>
          3 agents, 2 active, 1 revoked
        </div>
      </div>

      <style>{`
        .hf {
          position: relative;
          aspect-ratio: 1 / 0.92;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid var(--color-line);
          border-radius: var(--radius-xl);
          background:
            radial-gradient(circle at 50% 42%, rgba(198,242,77,0.10), transparent 60%),
            var(--color-surface-1);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), var(--shadow-2);
        }
        .hf-rings { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .hf-ring { position: absolute; border-radius: 50%; border: 1px solid rgba(198,242,77,0.18); }
        .hf-r1 { width: 56%; height: 56%; animation: hf-spin 22s linear infinite; }
        .hf-r2 { width: 76%; height: 76%; border-style: dashed; animation: hf-spin 34s linear infinite reverse; }
        .hf-r3 { width: 96%; height: 96%; border-color: rgba(255,255,255,0.05); animation: hf-spin 48s linear infinite; }
        @keyframes hf-spin { to { transform: rotate(360deg); } }

        .hf-core { position: relative; z-index: 2; text-align: center; }
        .hf-hub {
          width: 96px; height: 96px; margin: 0 auto 1rem;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-xl);
          background: var(--color-accent-soft);
          border: 1px solid rgba(198,242,77,0.4);
          box-shadow: var(--shadow-accent);
          animation: hf-pulse 3.4s var(--ease-out) infinite;
        }
        @keyframes hf-pulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(198,242,77,0.4), 0 0 22px rgba(198,242,77,0.18); }
          50%      { box-shadow: 0 0 0 1px var(--color-accent), 0 0 42px rgba(198,242,77,0.42); }
        }
        .hf-lbl { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-ink-dim); letter-spacing: 0.04em; }
        .hf-lbl b { display: block; font-family: var(--font-display); font-weight: 600; font-size: 1rem; color: var(--color-ink); margin-bottom: 0.15rem; }

        .hf-node {
          position: absolute; z-index: 2;
          display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
          font-family: var(--font-mono); font-size: 0.62rem; color: var(--color-ink-dim);
        }
        .hf-chip {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-md);
          background: var(--color-surface-2);
          border: 1px solid var(--color-line);
          font-size: 0.95rem;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-1);
        }
        .hf-allow .hf-chip { border-color: rgba(79,208,138,0.4); color: var(--color-allow); }
        .hf-revoked { opacity: 0.7; }
        .hf-revoked .hf-chip { border-color: rgba(255,93,108,0.4); color: var(--color-deny); }

        .hf-n1 { top: 12%; left: 15%; }
        .hf-n2 { top: 15%; right: 13%; }
        .hf-n3 { bottom: 14%; left: 21%; }

        @media (max-width: 560px) { .hf-node { display: none; } }

        @media (prefers-reduced-motion: reduce) {
          .hf-r1, .hf-r2, .hf-r3, .hf-hub { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
