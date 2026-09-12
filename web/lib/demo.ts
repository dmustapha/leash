// File: web/lib/demo.ts
// Shared judge-sandbox helpers. Lives in web/lib (NOT /app) so /demo + /api/demo have ZERO import edge to
// /app (INVARIANT #10). Pure config + link builders + canonical sandbox identity; no rail logic here (the
// rails are the proven agent/, scripts/ens/, treasury/ modules the api routes import directly).

import { config } from './config';

// The sandbox org + its two children (F-013 hierarchy). Caps are the canonical seeded values (5 vs 25 USDC).
export const ORG = config.sandboxOrg; // acme.leash.eth
export const DATA_AGENT = `data.${ORG}`;        // cap 5 USDC  (the hero agent all 4 beats drive)
export const PAYMENTS_AGENT = `payments.${ORG}`; // cap 25 USDC

// Resource endpoint. .env sets RESOURCE_PORT but not RESOURCE_URL, so derive the fallback the same way
// the proven live test does (agent/vm1.live.ts) instead of hard-failing on an empty RESOURCE_URL.
export function resourcePremiumUrl(): string {
  const base = process.env.RESOURCE_URL || `http://localhost:${process.env.RESOURCE_PORT || 8402}`;
  return `${base.replace(/\/$/, '')}/premium`;
}

export function facilitatorUrl(): string {
  return (process.env.FACILITATOR_URL || 'http://localhost:8401').replace(/\/$/, '');
}

// Explorer links (real proofs, never fabricated). Hedera settle tx ids look like 0.0.OP@sec.nanos;
// HashScan accepts that form. Sepolia revoke is a 0x hash on Etherscan.
export function hashscanTxUrl(txId: string): string {
  return `https://hashscan.io/testnet/transaction/${encodeURIComponent(txId)}`;
}
export function hashscanTopicUrl(topicId: string): string {
  return `https://hashscan.io/testnet/topic/${topicId}`;
}
export function sepoliaTxUrl(hash: string): string {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export const HCS_TOPIC_ID = process.env.HCS_TOPIC_ID || '';

// Format raw USDC (6 decimals) for display, e.g. "5000000" -> "5".
export function usdc(raw: string | number): string {
  const n = typeof raw === 'string' ? Number(raw) : raw;
  if (!Number.isFinite(n)) return String(raw);
  return (n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
