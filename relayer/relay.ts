// File: relayer/relay.ts
// [Task 5.4b] Scoped gas sponsor for the real console (ARCHITECTURE §11). The deployer key
// (LEASH_DEPLOYER_KEY, wired into scripts/ens/client.ts walletClient()) pays the Sepolia gas for a
// connected user's ENS op, so the end user provisions/registers/revokes WITHOUT holding ETH.
//
// SCOPING (R-13 boundary): every op MUST target a name under the authenticated user's own org subname.
// The `target.endsWith(orgSubname)` guard prevents the deployer key from being an open relay - it can only
// mint/set/clear under the caller's verified namespace, never an arbitrary name.
//
// SIGNATURE NOTE: this uses the REAL, DP-1b-resolved rail signatures (source of truth = scripts/ens/*),
// NOT the stale ARCHITECTURE §11 placeholder. mintSubname/setPolicy need the child's registry + label so
// the PermissionedResolver + PermissionedRegistry writes resolve; clearPolicy needs only the full name.
//
// INVARIANT #6 boundary: this rail signs ENS writes with the deployer/sponsor key ONLY. It NEVER touches the
// Privy funding-policy path (treasury/privy.ts) - funding is a separate P-256-owner-driven rail. The sponsor
// key here cannot move USDC; it can only write ENS records under the caller's org subname.
import { mintSubname } from '../scripts/ens/subname';
import { setPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import type { AgentPolicy } from '../types';

export type RelayOp =
  | { kind: 'mint'; registry: `0x${string}`; label: string; agentAddress: `0x${string}`; expires: bigint }
  | { kind: 'setPolicy'; registry: `0x${string}`; label: string; name: string; policy: AgentPolicy }
  | { kind: 'revoke'; name: string };

// orgSubname = the authenticated user's org, e.g. "acme.leash.eth". Every op's target name must end with it,
// so the sponsor key can only ever act inside the caller's own namespace.
export async function relay(orgSubname: string, op: RelayOp): Promise<string> {
  const target = op.kind === 'mint' ? `${op.label}.${orgSubname}` : op.name;
  if (!target.endsWith(orgSubname)) {
    throw new Error(`scope violation: "${target}" is outside caller org subname "${orgSubname}"`);
  }
  switch (op.kind) {
    case 'mint':
      return (await mintSubname(op.registry, op.label, orgSubname, op.agentAddress, op.expires)).toString();
    case 'setPolicy':
      return setPolicy(op.name, op.policy, op.registry, op.label);
    case 'revoke':
      return clearPolicy(op.name);
  }
}
