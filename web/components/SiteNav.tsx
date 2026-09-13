// File: web/components/SiteNav.tsx
// Shared PUBLIC top navigation for /, /demo, /proof. Privy-FREE by design so these trees keep
// zero import edge to /app (INVARIANT #10 / F-015). The /app console has its own Privy-aware nav.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: { href: string; label: string }[] = [
  { href: '/demo', label: 'Live demo' },
  { href: '/proof', label: 'Proof' },
];

export function Wordmark({ height = 26 }: { height?: number }) {
  return (
    <Link href="/" aria-label="LEASH home" style={{ display: 'inline-flex', alignItems: 'center' }}>
      {/* Main logo: the full LEASH wordmark with the leash line (mirrors public/logo.svg). The compact
          clasp mark lives on as the favicon only. Themed with design-system vars. */}
      <svg height={height} viewBox="0 0 300 80" role="img" aria-label="LEASH" style={{ display: 'block', width: 'auto' }}>
        <g fill="var(--color-ink, #f4f4ef)" fontFamily="var(--font-display), 'Clash Display', sans-serif" fontWeight={700}>
          <text x="44" y="52" fontSize="46" letterSpacing="1">LEASH</text>
        </g>
        <g fill="none" stroke="var(--color-accent, #c6f24d)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="60" r="9" />
          <path d="M27 55 l6 -4" stroke="#d6ff6a" />
          <path d="M29 60 C 60 66, 120 66, 210 62 C 240 60, 250 58, 258 56" />
          <path d="M258 56 c 8 -2 12 4 8 10 c -3 4 -9 3 -10 -2" />
        </g>
      </svg>
    </Link>
  );
}

export default function SiteNav() {
  const path = usePathname();
  return (
    <header className="nav">
      <Wordmark />
      <span style={{ flex: 1 }} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }} aria-label="Primary">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="nav-link" aria-current={path === l.href ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
        <Link href="/app" className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem' }}>
          Open your console
        </Link>
      </nav>
    </header>
  );
}
