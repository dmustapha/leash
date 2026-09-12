// File: web/app/demo/page.tsx
// Judge sandbox (F-015). Server component: resolves the canonical sandbox identity + explorer links from
// config/env, then hands them to the client hero flow. NO import edge to /app (INVARIANT #10) - it imports
// only web/lib (server-safe config) and web/components. The console tree is never imported here.
import { DATA_AGENT, PAYMENTS_AGENT, ORG, HCS_TOPIC_ID, hashscanTopicUrl } from '../../lib/demo';
import DemoClient from './demo-client';

export const dynamic = 'force-dynamic';

export default function DemoPage() {
  return (
    <DemoClient
      org={ORG}
      dataAgent={DATA_AGENT}
      paymentsAgent={PAYMENTS_AGENT}
      hcsTopicId={HCS_TOPIC_ID}
      hcsTopicUrl={HCS_TOPIC_ID ? hashscanTopicUrl(HCS_TOPIC_ID) : null}
    />
  );
}
