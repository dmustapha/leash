// File: web/app/app/page.tsx
// The console entry (the fleet). PrivyProvider now lives in layout.tsx (shared with /app/agent/[ensName]), so this
// route only renders the console body. The four states, not-configured / not-authenticated / authenticated-no-org
// / authenticated-with-org, are handled inside AppConsole. It NEVER fabricates a session or fake data.
'use client';

import AppConsole from './app-console';

// Whether the deploy-time Privy app id is present. When false, layout.tsx did not mount PrivyProvider, so the
// console renders a real "pending configuration" panel (no usePrivy call is made).
const CONFIGURED = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export default function AppPage() {
  return <AppConsole configured={CONFIGURED} />;
}
