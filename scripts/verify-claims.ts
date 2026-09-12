// File: scripts/verify-claims.ts
// VERIFY-BEFORE-CLAIMING (INVARIANTS.md). Re-derives every headline number from a COMMITTED source
// (docs/pipeline/claims.json) rather than reading back a stored success, diffs the recomputed value
// against the asserted value, and (best-effort) live-reads the ENS leash.policy caps as an independent
// cross-check. Writes evidence/claims-recomputed.json and exits non-zero on any mismatch.
//
// Recompute rules:
//  - USDC amount  = maxPerCallRaw / 1e6        (re-derived, never copied from the asserted USDC field)
//  - ENS cross-check: read leash.policy text via the SAME primitive the facilitator enforces on
//    (POLICY_RESOLVER.text(namehash,'leash.policy')). Requires SEPOLIA_RPC_URL + POLICY_RESOLVER;
//    absent env => the row is marked live_skipped (recompute-from-committed still gates the diff).
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

interface CapClaim {
  id: string;
  leg: string;
  claim: string;
  asserted: { name?: string; maxPerCallRaw?: string; maxPerCallUsdc?: string; [k: string]: unknown };
  pointer: Record<string, unknown>;
}
interface Ledger { claims: CapClaim[] }

const USDC_DECIMALS = 6n;

function usdcFromRaw(raw: string): string {
  const whole = BigInt(raw) / 10n ** USDC_DECIMALS;
  const frac = BigInt(raw) % 10n ** USDC_DECIMALS;
  return frac === 0n ? whole.toString() : `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}

// Best-effort live ENS read. Kept dynamic so a missing RPC/env never breaks the committed recompute.
async function liveCap(name: string): Promise<string | null> {
  if (!process.env.SEPOLIA_RPC_URL || !process.env.POLICY_RESOLVER) return null;
  const { publicClient } = await import('./ens/client');
  const { parseAbi, namehash } = await import('viem');
  const abi = parseAbi(['function text(bytes32 node,string key) view returns (string)']);
  const raw = (await publicClient.readContract({
    address: process.env.POLICY_RESOLVER as `0x${string}`,
    abi, functionName: 'text', args: [namehash(name), 'leash.policy'],
  })) as string;
  if (!raw || raw.trim() === '') return null;
  return (JSON.parse(raw) as { maxPerCall: string }).maxPerCall;
}

async function main() {
  const ledger = JSON.parse(readFileSync('docs/pipeline/claims.json', 'utf8')) as Ledger;
  const recomputed: Record<string, unknown> = {};
  const mismatches: string[] = [];

  for (const c of ledger.claims) {
    const raw = c.asserted.maxPerCallRaw;
    if (!raw) {
      // Non-numeric claim (tx/topic pointer). Its resolvability is spot-checked in submission/proof.md;
      // record the pointer so the evidence file is complete.
      recomputed[c.id] = { leg: c.leg, recompute: 'pointer_only', pointer: c.pointer };
      continue;
    }
    const derivedUsdc = usdcFromRaw(raw);
    const assertedUsdc = c.asserted.maxPerCallUsdc;
    const committedOk = derivedUsdc === assertedUsdc;
    if (!committedOk) mismatches.push(`${c.id}: derived ${derivedUsdc} USDC != asserted ${assertedUsdc}`);

    let live: string | null = null;
    let liveOk: boolean | 'skipped' = 'skipped';
    try {
      live = await liveCap(c.asserted.name!);
      if (live !== null) {
        liveOk = live === raw;
        if (!liveOk) mismatches.push(`${c.id}: live cap ${live} != asserted raw ${raw}`);
      }
    } catch (e) {
      liveOk = 'skipped';
      live = `error:${(e as Error).message.slice(0, 80)}`;
    }

    recomputed[c.id] = {
      leg: c.leg, name: c.asserted.name,
      maxPerCallRaw: raw, derivedUsdc, assertedUsdc, committedOk,
      liveMaxPerCallRaw: live, liveOk,
    };
  }

  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/claims-recomputed.json', JSON.stringify(recomputed, null, 2));
  console.log('recomputed claims -> evidence/claims-recomputed.json');

  if (mismatches.length) {
    console.error('CLAIM MISMATCH (VERIFY-BEFORE-CLAIMING failed):');
    for (const m of mismatches) console.error('  -', m);
    process.exit(1);
  }
  console.log(`OK: ${ledger.claims.length} claims, committed recompute matches asserted (0 mismatches).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
