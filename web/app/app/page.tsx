// File: web/app/app/page.tsx
// [Task 5.4b] The real console (/app). Wraps the console in Privy's PrivyProvider so a user can sign in with
// email or Google (real @privy-io/react-auth v3 SDK). The PrivyProvider + the console tree are the ONLY place
// Privy client modules are imported - the /demo tree has NO import edge here (INVARIANT #10).
//
// The appId comes from NEXT_PUBLIC_PRIVY_APP_ID. Wiring the Privy dashboard (enabling Email/Google login
// methods + allowed origins) is the deploy-time human step (Task 5.4a). When the id is absent locally the full
// login surface still renders and explains what is pending - it NEVER fakes a session (INVARIANT: no
// fabricated demo state; honest framing INVARIANT #4).
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import AppConsole from './app-console';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function AppPage() {
  // No app id configured (Task 5.4a not yet done): render the console shell, which shows a clear pending state
  // instead of crashing PrivyProvider on an empty id. No fake session is created.
  if (!PRIVY_APP_ID) {
    return <AppConsole configured={false} />;
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google'],
        appearance: { theme: 'dark', accentColor: '#f2a63b' },
        embeddedWallets: { ethereum: { createOnLogin: 'off' } },
      }}
    >
      <AppConsole configured />
    </PrivyProvider>
  );
}
