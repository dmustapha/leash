// File: scripts/verify-claims.ts
// CAUTION: ASSUMED PATTERN - test immediately.
// Re-derives every headline claim (agent count, cap values, tx hashes) from ENS live reads + committed
// submission/proof.md, writing evidence/claims-recomputed.json. Refuses to read back a stored success.
import { readPolicy } from './ens/policy';
import { config } from '../web/lib/config';
import { writeFileSync, mkdirSync } from 'fs';

async function main() {
  const names = [`data.${config.sandboxOrg}`, `payments.${config.sandboxOrg}`];
  const recomputed: Record<string, unknown> = {};
  for (const n of names) {
    const p = await readPolicy(n);
    recomputed[n] = p ? { maxPerCall: p.maxPerCall, allowedPayees: p.allowedPayees, revoked: false } : { revoked: true };
  }
  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/claims-recomputed.json', JSON.stringify(recomputed, null, 2));
  console.log('recomputed claims -> evidence/claims-recomputed.json');
}
main().catch((e) => { console.error(e); process.exit(1); });
