// File: scripts/ens/rebind-hero.ts
// [Phase 3 prerequisite] Re-binds the hero child ENS policy (data.acme.leash.eth) to the freshly
// provisioned DISTINCT accounts so the settle-time facilitator read authorizes the real gas-free payment:
//   maxPerCall    = 5 USDC (5_000_000 raw)  -> a 3 USDC call is in-cap, a 50 USDC call is OVER_CAP
//   allowedPayees = [RECEIVER_ACCOUNT_ID]   -> the distinct receiver
//   hederaAccount = SANDBOX_AGENT_ACCOUNT   -> the distinct agent (payer binding, INVARIANT #8)
//   token         = USDC_TOKEN_ID
// This is the authoritative record the facilitator reads in onBeforeSettle. One real Sepolia setText tx.
import 'dotenv/config';
import { setPolicy, readPolicy } from './policy';
import type { AgentPolicy } from '../../types';

const HERO_NAME = 'data.acme.leash.eth';
const HERO_LABEL = 'data';

async function main(): Promise<void> {
  const registry = process.env.SANDBOX_REGISTRY as `0x${string}`;
  const policy: AgentPolicy = {
    maxPerCall: '5000000',
    allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!],
    hederaAccount: process.env.SANDBOX_AGENT_ACCOUNT!,
    token: process.env.USDC_TOKEN_ID!,
  };
  console.log('rebinding hero policy on', HERO_NAME, policy);
  const tx = await setPolicy(HERO_NAME, policy, registry, HERO_LABEL);
  console.log('setText tx (Sepolia):', tx);
  const readBack = await readPolicy(HERO_NAME);
  console.log('read-back:', readBack);
  if (!readBack || readBack.hederaAccount !== policy.hederaAccount) {
    throw new Error('rebind read-back mismatch');
  }
  console.log('hero rebind OK');
}

main().catch((e) => {
  console.error('rebind error:', e);
  process.exit(1);
});
