// File: web/app/layout.tsx
// Root layout. Imports the design system (globals.css). Fonts (Clash Display / Manrope / JetBrains Mono)
// load via @import inside globals.css. No /app or Privy imports here so the /demo, /, /proof trees stay
// free of any import edge to /app (INVARIANT #10). Copy rule: no em dashes.
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://leash.ink'),
  title: 'LEASH · keep your agents on a leash',
  description:
    'LEASH is the control layer for your AI agent fleet. Bind each agent to an on-chain identity, a co-owned spending account, and the limits you set, then change or cut off any agent everywhere with one on-chain write. ENS, Hedera x402, Privy.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo-256.png',
  },
  openGraph: {
    title: 'LEASH · keep your agents on a leash',
    description: 'The control layer for your AI agent fleet: identity, co-owned account, limits, funding, kill-switch, audit. ENS, Hedera x402, Privy.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'LEASH', description: 'Keep your agents on a leash.', images: ['/og-image.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
