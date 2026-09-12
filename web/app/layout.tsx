// File: web/app/layout.tsx
// Root layout. Imports the design floor (globals.css). No /app or Privy imports here so the /demo tree
// stays free of any import edge to /app (INVARIANT #10).
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://leash.ink'),
  title: 'LEASH — the ENS name that can un-pay it',
  description:
    'LEASH binds external agents to a 2-of-2 co-signed account and an ENS-declared spend policy. The facilitator we run enforces the org’s ENS cap and allowlist on every payment — revoke one resolver record and that agent’s spending dies everywhere.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo-256.png',
  },
  openGraph: {
    title: 'LEASH — the ENS name that can un-pay it',
    description: 'Spend control for external agents: 2-of-2 co-signed accounts + an ENS-declared, revocable spend policy. ENS · Hedera x402 · Privy.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'LEASH', description: 'The ENS name that can un-pay it.', images: ['/og-image.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
