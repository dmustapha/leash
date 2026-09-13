// File: scripts/seed-demo.ts
// [Task 5.1 + DEV-020 FIX] The canonical, idempotent demo-state seeder (PRD S6 demo prerequisites).
// Produces REAL state only (real Hedera accounts, real USDC balances, real ENS records) and converges to
// the same demo state on every re-run. Guards every on-chain create with an existence check.
//
// What it establishes (the three-prize hero prerequisites, VM-2):
//   - Two canonical agent accounts (DEV-020 fix): each account's EVM alias == its ECDSA key-EVM, so the
//     Privy funding recipient, the x402 payer, and the ENS policy.hederaAccount are the SAME account.
//   - data.acme.leash.eth      -> cap 5 USDC  (5_000_000 raw),  bound to canonical agent 1
//   - payments.acme.leash.eth  -> cap 25 USDC (25_000_000 raw), bound to canonical agent 2
//   - Each agent USDC-associated and FUNDED (real USDC from the treasury) so it can actually pay gas-free.
//   - The receiver account USDC-associated (payee of both policies).
//   - Treasury topped up with real USDC; HCS topic + minted USDC present (from setup.ts).
//
// DEV-020: BEFORE this seed, the funding rail credited the key-alias account (evm 0x8754...) while x402 + ENS
// used a long-zero account (0.0.10497601, evm 0x00..a02e41) - two different accounts held the money. The seed
// re-provisions canonical accounts (setECDSAKeyWithAlias) so fund -> pay happens on ONE account. See the
// provision-canonical.ts header for the root cause.
import 'dotenv/config';
import { AccountId, TransferTransaction, TokenId } from '@hiero-ledger/sdk';
import { mintSubname } from './ens/subname';
import { setPolicy, readPolicy } from './ens/policy';
import { writeIdentity } from './ens/identity';
import { associate } from './hedera/associate';
import { hederaClient } from './hedera/client';
import { ensureCanonicalAgent } from './hedera/provision-canonical';
import { tokenIdOf } from './ens/register-2ld';
import type { AgentPolicy } from '../types';

const MIRROR_NODE = 'https://testnet.mirrornode.hedera.com/api/v1';

// Per-agent demo funding target (raw USDC): enough to cover the in-cap spend AND the over-cap ATTEMPT.
// data cap is 5 USDC (a 50 USDC over-cap attempt still builds a transfer), payments cap is 25 USDC.
const AGENT_FUNDING_TARGET_RAW = 200_000_000; // 200 USDC each

interface DemoAgent {
  label: string;                 // ENS leaf label (also the Hedera account var suffix)
  capRaw: string;                // maxPerCall, raw USDC
  idEnv: string;
  keyEnv: string;
  evmEnv: string;
  type: string;                  // [WS-7 D1] advisory ENS identity (agent.type)
  description: string;           // [WS-7 D1] advisory ENS identity (agent.description)
  address?: string;              // on-chain-resolved external EVM identity (advisory, agent.address)
}

const AGENTS: DemoAgent[] = [
  // The judge-sandbox hero is SOLV-001: a real autonomous agent (Circle wallet on Arc). Its EXTERNAL
  // identity (0x927c… on Arc) is written on-chain as agent.address (on-chain-resolved, advisory), while
  // LEASH governs its spend through this Hedera account + the leash.policy the facilitator reads. This is
  // the Arc-vs-Hedera seam: SOLV-001 settles natively on Arc; the controls judges demo run on Hedera.
  { label: 'data', capRaw: '5000000', idEnv: 'SANDBOX_AGENT_ACCOUNT', keyEnv: 'SANDBOX_AGENT_KEY', evmEnv: 'SANDBOX_AGENT_EVM',
    type: 'SOLV-001 · autonomous agent',
    description: 'SOLV-001, a real autonomous agent that earns USDC via Circle and pays for services on Arc. Bound to LEASH and governed here through a Hedera account, within a 5 USDC per-call cap declared on ENS.',
    address: '0x927c1d756d12879aebea0772f3ee220f21f4841a' },
  { label: 'payments', capRaw: '25000000', idEnv: 'SANDBOX_AGENT2_ACCOUNT', keyEnv: 'SANDBOX_AGENT2_KEY', evmEnv: 'SANDBOX_AGENT2_EVM',
    type: 'payments agent', description: 'Settles vendor payments within a 25 USDC per-call cap declared on ENS.' },
];

// Read an account's real USDC balance (raw) from the mirror node; 0 if not associated / not found yet.
async function usdcBalance(hederaId: string, tokenId: string): Promise<number> {
  const r = await fetch(`${MIRROR_NODE}/accounts/${hederaId}/tokens?token.id=${tokenId}`);
  if (!r.ok) return 0;
  const body = (await r.json()) as { tokens?: Array<{ balance: number }> };
  return body.tokens?.[0]?.balance ?? 0;
}

// Poll until the account's USDC balance reaches `min` (mirror-node consensus lag settle).
async function waitForBalanceAtLeast(hederaId: string, tokenId: string, min: number): Promise<number> {
  const deadline = Date.now() + 60_000;
  let delay = 2_000;
  while (Date.now() < deadline) {
    const bal = await usdcBalance(hederaId, tokenId);
    if (bal >= min) return bal;
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(delay * 2, 8_000);
  }
  return usdcBalance(hederaId, tokenId);
}

// Fund an agent up to the demo target with REAL USDC from the operator treasury (idempotent: only tops up
// the shortfall, skips entirely when already funded). The operator is the HTS token treasury (mint-usdc.ts).
async function ensureAgentFunded(agentId: string, tokenId: string): Promise<void> {
  const current = await usdcBalance(agentId, tokenId);
  if (current >= AGENT_FUNDING_TARGET_RAW) {
    console.log(`  ${agentId} already funded: ${current} raw USDC (>= ${AGENT_FUNDING_TARGET_RAW})`);
    return;
  }
  const shortfall = AGENT_FUNDING_TARGET_RAW - current;
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const tx = await new TransferTransaction()
    .addTokenTransfer(TokenId.fromString(tokenId), operatorId, -shortfall)
    .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(agentId), shortfall)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  client.close();
  if (receipt.status.toString() !== 'SUCCESS') throw new Error(`fund ${agentId} failed: ${receipt.status.toString()}`);
  const settled = await waitForBalanceAtLeast(agentId, tokenId, AGENT_FUNDING_TARGET_RAW);
  console.log(`  funded ${agentId}: +${shortfall} raw USDC -> ${settled} raw`);
}

// Ensure the child ENS name exists and its leash.policy is bound to the canonical account. Idempotent:
// readPolicy short-circuits when the record is already present with the correct binding.
async function ensureAgentPolicy(agent: DemoAgent, tokenId: string): Promise<AgentPolicy> {
  const registry = process.env.SANDBOX_REGISTRY as `0x${string}`;
  const name = `${agent.label}.${process.env.SANDBOX_ORG_NAME!}`;
  const agentAccountId = process.env[agent.idEnv]!;
  const agentEvm = process.env[agent.evmEnv] as `0x${string}`;

  const policy: AgentPolicy = {
    maxPerCall: agent.capRaw,
    allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!],
    hederaAccount: agentAccountId,
    token: tokenId,
  };

  const existing = await readPolicy(name);
  const bound = existing
    && existing.maxPerCall === policy.maxPerCall
    && existing.hederaAccount === policy.hederaAccount
    && existing.token === policy.token
    && JSON.stringify(existing.allowedPayees) === JSON.stringify(policy.allowedPayees);
  if (bound) {
    console.log(`  ${name} policy already bound (cap ${policy.maxPerCall}, account ${policy.hederaAccount})`);
    return existing!;
  }

  // Mint the subname only if it does not resolve yet. A cleared/revoked policy record (readPolicy == null)
  // does NOT imply the name is unminted: a prior demo run clears the leash.policy TEXT record but leaves the
  // subname registered. Re-minting then reverts (name already registered). So the register is best-effort:
  // if it reverts because the name exists, we fall through to setPolicy, which is what restores the policy.
  if (!existing) {
    const expires = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);
    try {
      await mintSubname(registry, agent.label, process.env.SANDBOX_ORG_NAME!, agentEvm, expires);
      console.log(`  minted ${name} (tokenId ${tokenIdOf(name)})`);
    } catch (e: unknown) {
      // Name already registered from a prior seed; only its policy record was cleared. Proceed to rebind.
      console.log(`  ${name} already registered (re-binding cleared policy): ${e instanceof Error ? e.message.split('\n')[0] : String(e)}`);
    }
  }
  await setPolicy(name, policy, registry, agent.label);
  console.log(`  bound ${name} policy: cap=${policy.maxPerCall} account=${policy.hederaAccount}`);
  return policy;
}

async function main(): Promise<void> {
  const tokenId = process.env.USDC_TOKEN_ID!;
  requireEnv(['USDC_TOKEN_ID', 'SANDBOX_ORG_NAME', 'SANDBOX_REGISTRY', 'RECEIVER_ACCOUNT_ID', 'RECEIVER_KEY', 'HEDERA_OPERATOR_ID', 'HCS_TOPIC_ID']);

  console.log('1/4 provisioning canonical agent accounts (DEV-020: EVM alias == key-EVM)...');
  for (const agent of AGENTS) {
    const acct = await ensureCanonicalAgent(agent.idEnv, agent.keyEnv, agent.evmEnv, tokenId);
    console.log(`  ${agent.label}: ${acct.accountId} evm ${acct.evmAddress}`);
  }

  console.log('2/4 associating receiver + funding agents with real USDC...');
  await associate(process.env.RECEIVER_ACCOUNT_ID!, process.env.RECEIVER_KEY!, tokenId).catch((e: unknown) => {
    // Already associated is a benign idempotent outcome; anything else is a real failure.
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('TOKEN_ALREADY_ASSOCIATED')) throw e;
  });
  for (const agent of AGENTS) {
    await ensureAgentFunded(process.env[agent.idEnv]!, tokenId);
  }

  console.log('3/4 binding ENS policies (distinct caps, canonical hederaAccount)...');
  for (const agent of AGENTS) {
    await ensureAgentPolicy(agent, tokenId);
    // [WS-7 D1] Write advisory ENS identity records alongside the policy (never an enforcement input).
    const name = `${agent.label}.${process.env.SANDBOX_ORG_NAME!}`;
    await writeIdentity(name, { type: agent.type, description: agent.description, address: agent.address }).catch((e: unknown) => {
      console.warn(`  identity write skipped for ${name}: ${e instanceof Error ? e.message : String(e)}`);
    });
  }

  console.log('4/4 verifying demo state...');
  for (const agent of AGENTS) {
    const name = `${agent.label}.${process.env.SANDBOX_ORG_NAME!}`;
    const p = await readPolicy(name);
    const bal = await usdcBalance(process.env[agent.idEnv]!, tokenId);
    console.log(`  ${name}: cap=${p?.maxPerCall} hederaAccount=${p?.hederaAccount} balance=${bal} raw USDC`);
  }
  console.log(`  HCS topic: ${process.env.HCS_TOPIC_ID}  USDC token: ${tokenId}`);
  console.log('seed complete (idempotent, real state)');
}

function requireEnv(keys: string[]): void {
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`missing required env for seed: ${missing.join(', ')}`);
}

main()
  .then(() => {
    // The Hedera SDK opens gRPC connections that keep the event loop alive after main() resolves;
    // exit explicitly so the seed terminates promptly (Task 5.1 gate: exits 0).
    process.exit(0);
  })
  .catch((e) => {
    console.error('seed error:', e);
    process.exit(1);
  });
