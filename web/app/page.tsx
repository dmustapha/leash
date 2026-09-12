// File: web/app/page.tsx
// Landing: the two front doors. The judge sandbox (/demo) is the primary, zero-setup path; the real
// console (/app) is secondary. Server component (static), no /app import edge.
import Link from 'next/link';

export default function Landing() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(2rem, 5vw, 5rem) 1.25rem' }}>
      <p className="eyebrow">ENS · Hedera x402 · Privy</p>
      <h1 style={{ fontSize: 'var(--text-display)', maxWidth: 16, lineHeight: 1.05, marginTop: '0.5rem' }}>
        Your ENS name is your revocable spend policy.
      </h1>
      <p style={{ maxWidth: '46ch', color: 'var(--color-ink-dim)', fontSize: '1.05rem', marginTop: '1rem' }}>
        Give a fleet of paying agents a cap and an allowlist declared on your ENS name. The facilitator we
        run enforces that ENS-declared policy on every payment — and you can revoke it on-chain in one write.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
        <Link className="btn btn-primary" href="/demo" style={{ minWidth: 220, justifyContent: 'center' }}>
          Try the judge sandbox →
        </Link>
        <Link className="btn" href="/app" style={{ minWidth: 200, justifyContent: 'center' }}>
          Open the real console
        </Link>
      </div>
      <p style={{ marginTop: '0.9rem', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
        No login, no wallet, no ETH needed for the sandbox. Every step runs a real on-chain transaction.
      </p>
    </main>
  );
}
