// File: facilitator/ens-read.ts
// [DEV-008 APPLIED] Mirrors the PROVEN read primitive in scripts/ens/policy.ts readPolicy EXACTLY:
// text(namehash(name), 'leash.policy') on the deployed POLICY_RESOLVER (a PermissionedResolver proxy),
// via a plain viem eth_call. NOT UniversalResolverV2 / PublicResolverV2 (the ARCHITECTURE snapshot was
// pre-R-2; PublicResolverV2 reverts on self-deployed-registry names - see scripts/ens/policy.ts header).
//
// INVARIANT #2: the AUTHORITATIVE read (readPolicyNoCache) has NO cache and is re-fetched live in
// onBeforeSettle immediately before the fee-payer signature is added, closing the TOCTOU window.
// INVARIANT #3: a >=30s TTL cache is permitted ONLY on the advisory onBeforeVerify pre-screen
// (readPolicyCached); it is NEVER on the settle path.
import { createPublicClient, http, namehash, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import type { AgentPolicy } from '../types';

const POLICY_KEY = 'leash.policy';

// Same resolver read ABI + address source as scripts/ens/policy.ts (POLICY_RESOLVER).
const resolverAbi = parseAbi(['function text(bytes32 node,string key) view returns (string)']);

const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL!) });

function policyResolver(): `0x${string}` {
  const addr = process.env.POLICY_RESOLVER;
  if (!addr || !addr.startsWith('0x') || addr.length !== 42) {
    throw new Error('POLICY_RESOLVER not set - run npm run setup first');
  }
  return addr as `0x${string}`;
}

// Low-level: read the raw leash.policy text value. Byte-identical to policy.ts readPolicy's readContract.
// Throws on transport/RPC failure (caller maps to RPC_ERROR - INVARIANT #1 fail-closed).
async function readText(name: string): Promise<string> {
  const raw = await client.readContract({
    address: policyResolver(),
    abi: resolverAbi,
    functionName: 'text',
    args: [namehash(name), POLICY_KEY],
  });
  return raw as string;
}

// Parse the text value into AgentPolicy, or null if empty/revoked (mirrors policy.ts readPolicy).
function parsePolicy(raw: string): AgentPolicy | null {
  if (!raw || raw.trim() === '') return null;
  return JSON.parse(raw) as AgentPolicy;
}

// AUTHORITATIVE settle-time read - NO cache (INVARIANT #2). Empty -> null (REVOKED);
// malformed JSON -> 'MALFORMED' sentinel (caller maps to MALFORMED_POLICY).
export async function readPolicyNoCache(name: string): Promise<AgentPolicy | null | 'MALFORMED'> {
  const raw = await readText(name); // throws -> RPC_ERROR upstream
  try {
    return parsePolicy(raw);
  } catch {
    return 'MALFORMED';
  }
}

// Advisory pre-screen read - 30s TTL cache permitted (INVARIANT #3). ALLOW here is NOT authoritative.
const cache = new Map<string, { value: AgentPolicy | null | 'MALFORMED'; exp: number }>();
const TTL_MS = 30_000;

export async function readPolicyCached(name: string): Promise<AgentPolicy | null | 'MALFORMED'> {
  const now = Date.now();
  const hit = cache.get(name);
  if (hit && hit.exp > now) return hit.value;
  const raw = await readText(name);
  let value: AgentPolicy | null | 'MALFORMED';
  try {
    value = parsePolicy(raw);
  } catch {
    value = 'MALFORMED';
  }
  cache.set(name, { value, exp: now + TTL_MS });
  return value;
}

// Test-only: clear the advisory cache so the TOCTOU test can force a fresh advisory read if needed.
// The settle path (readPolicyNoCache) is already uncached, so this does NOT affect INVARIANT #2.
export function _clearAdvisoryCache(): void {
  cache.clear();
}
