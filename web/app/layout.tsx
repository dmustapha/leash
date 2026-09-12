// File: web/app/layout.tsx
// Root layout. Imports the design floor (globals.css). No /app or Privy imports here so the /demo tree
// stays free of any import edge to /app (INVARIANT #10).
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LEASH — your ENS name is your revocable spend policy',
  description:
    'LEASH gives a fleet of paying agents a revocable, ENS-declared spend policy. The facilitator we run enforces the org’s ENS-declared cap and allowlist on every payment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
