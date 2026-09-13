// File: web/app/app/_components/console-nav.tsx
// The Privy-AWARE console top nav (wordmark + signed-in email + Sign out). Lives ONLY inside the /app tree, so it
// MAY import Privy, unlike the public SiteNav, which must not. When Privy is not configured it renders a plain
// wordmark with no session controls (never a fake signed-in state).
'use client';

import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

export default function ConsoleNav({ configured }: { configured: boolean }) {
  return (
    <nav className="nav" aria-label="Console">
      <Link href="/app" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.3rem 0.4rem' }} aria-label="LEASH console home">
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(180deg,var(--color-accent-hi),var(--color-accent))', boxShadow: 'var(--shadow-accent)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>LEASH</span>
        <span className="eyebrow" style={{ marginLeft: '0.1rem' }}>console</span>
      </Link>
      <div style={{ flex: 1 }} />
      {configured ? <SessionControls /> : <span className="pill pill-idle">sign-in pending</span>}
    </nav>
  );
}

function SessionControls() {
  const { ready, authenticated, user, logout } = usePrivy();
  if (!ready || !authenticated) return null;
  const email = user?.email?.address ?? user?.google?.email ?? user?.id ?? null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      {email && (
        <span className="badge" title="Signed in" style={{ maxWidth: '46vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span aria-hidden className="dot-live" style={{ background: 'var(--color-accent)', boxShadow: '0 0 0 3px rgba(198,242,77,0.18)' }} />
          {email}
        </span>
      )}
      <button className="btn btn-sm btn-ghost" onClick={() => void logout()}>Sign out</button>
    </div>
  );
}
