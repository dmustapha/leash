// File: web/app/app/layout.tsx
// The console shell for the entire /app tree (fleet dashboard AND /app/agent/[ensName] detail). The PrivyProvider
// is mounted HERE (moved out of page.tsx) so both routes share one auth session; a link from the fleet to an
// agent keeps the signed-in identity and its embedded wallet without re-authenticating.
//
// Honest framing (INVARIANT #4): when NEXT_PUBLIC_PRIVY_APP_ID is unset we do NOT mount PrivyProvider; the tree
// renders inside a plain shell and the console shows a real "pending configuration" panel. A session is never
// faked. The top nav here is Privy-AWARE (it shows the signed-in email + Sign out) and lives only inside /app;
// it is NOT the public SiteNav.
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import ConsoleNav from './_components/console-nav';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // No Privy app id in this environment: render children in a plain shell. The console surfaces the pending
  // state itself; PrivyProvider is never mounted on an empty id (it would throw), and no session is fabricated.
  if (!PRIVY_APP_ID) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <ConsoleNav configured={false} />
        {children}
      </div>
    );
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        // Match the mission-control accent so the Privy modal reads as one product surface.
        appearance: { theme: 'dark', accentColor: '#c6f24d' },
        // Provision an embedded wallet on login so the user HAS an EVM address to co-hold the kill-switch role.
        embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } },
      }}
    >
      <div style={{ minHeight: '100dvh' }}>
        <ConsoleNav configured />
        {children}
      </div>
    </PrivyProvider>
  );
}
