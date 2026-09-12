// File: web/next.config.ts
// Next project root is web/ (npm run dev == `next dev web`). The server route handlers import the proven
// rails from the repo root (agent/, scripts/ens/, treasury/), which live OUTSIDE web/, so the file tracer
// root is pinned to the repo root and those server-only packages are kept external (not bundled for RSC).
import path from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  serverExternalPackages: ['@hiero-ledger/sdk', '@privy-io/server-auth', 'viem'],
  // Do not auto-generate web/AGENTS.md + web/CLAUDE.md into the tree (Next 16 dev writes them otherwise).
  agentRules: false,
};

export default config;
