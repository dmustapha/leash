// File: web/app/api/agents/route.ts
// [Task 5.4b] Real console agent lifecycle (ARCHITECTURE §12): register (mint + policy), set cap (re-policy),
// and list. Every ENS write is RELAYER-SPONSORED (relayer/relay) so the user pays no gas; every agent gets a
// CANONICAL Hedera account (web/lib/console) so fund -> pay -> ENS all target the SAME account (DEV-020 model).
//
// INVARIANT #3: the DB rows written here are index-only. The facilitator reads the live ENS record to gate a
// payment; a row can never authorize a spend. INVARIANT #6: the agent's custody key is created server-side and
// used ONLY by the pay rail; it is stripped from every response (publicAgent).
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '../../../../db/client';
import { agents } from '../../../../db/schema';
import { relay } from '../../../../relayer/relay';
import { provisionAgentAccount, provisionSpendingAccount, publicAgent } from '../../../lib/console';
import { reconcileFundingAllowlist } from '../../../../treasury/privy';
import { hasPolicyCohold } from '../../../../scripts/ens/cohold';
import { writeIdentity } from '../../../../scripts/ens/identity';
import { resolveExternalIdentity } from '../../../../scripts/ens/erc8004';
import { config } from '../../../lib/config';
import { requireOwner, authErrorResponse } from '../../../lib/auth';
import { enforceRateLimit } from '../../../lib/ratelimit';
import type { AgentPolicy } from '../../../../types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // registration provisions an account, mints a subname, and writes a policy

function toLabel(raw: string): string {
  const label = raw.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (!label) throw new Error('agent name must contain at least one letter or digit');
  return label;
}

// POST: register a new agent under the org. Body: { orgId, label, maxPerCall, allowedPayees?, fundRaw? }.
// Flow: provision canonical account -> relayer mints <label>.<org> to its EVM alias -> relayer writes policy ->
// index the agent row. Returns the public agent (no custody key) + the mint/policy tx hashes.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'agents');
  if (limited) return limited;

  let body: {
    orgId?: string; label?: string; maxPerCall?: string; allowedPayees?: string[]; fundRaw?: number;
    userAddress?: string; description?: string; agentType?: string; avatar?: string; erc8004?: string;
    // [REFRAME R2] register-EXISTING (bind) inputs: bind an external identity to a 2-of-2 co-signed account.
    bindExisting?: boolean; externalEvm?: string; erc8004Id?: string; agentPub?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.orgId || !body.label || !body.maxPerCall) {
    return NextResponse.json({ error: 'orgId, label and maxPerCall are required' }, { status: 400 });
  }
  if (!/^\d+$/.test(body.maxPerCall)) {
    return NextResponse.json({ error: 'maxPerCall must be a raw smallest-unit integer string' }, { status: 400 });
  }

  // A1: assert the caller owns the target org BEFORE any provisioning (else an attacker registers agents,
  // and via A3 allowlists their own address, under someone else's treasury).
  let org;
  try {
    ({ org } = await requireOwner(req, { orgId: body.orgId }));
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }

  // [REFRAME R2] BIND branch: register-EXISTING binds an external identity (EVM and/or ERC-8004 agentId) to a
  // 2-of-2 co-signed spending account. Triggered when the body carries any external-identity signal. Runs AFTER
  // requireOwner (A1). Falls through to the UNCHANGED mint path otherwise.
  const bindTriggered =
    body.bindExisting === true ||
    !!body.externalEvm?.trim() ||
    !!body.erc8004Id?.trim() ||
    !!body.agentPub?.trim();
  if (bindTriggered) {
    return bindExistingAgent(body, org);
  }

  try {
    const label = toLabel(body.label);
    const name = `${label}.${org.ensName}`;
    const registry = org.registryAddress as `0x${string}`;

    // Reject a duplicate leaf (idempotence guard: one agent per ENS name).
    const dup = await db.select().from(agents).where(eq(agents.ensName, name)).limit(1);
    if (dup[0]) return NextResponse.json({ error: `agent ${name} already exists` }, { status: 409 });

    // 1) Canonical Hedera account (funded with real USDC so it can actually pay gas-free).
    const account = await provisionAgentAccount(body.fundRaw ?? 50_000_000);

    // 2) Relayer-sponsored ENS mint (child owned by the agent's EVM alias) + policy write.
    const expires = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);
    const mintTx = await relay(org.ensName, {
      kind: 'mint', registry, label, agentAddress: account.evmAddress as `0x${string}`, expires,
    });
    const allowedPayees = body.allowedPayees?.length ? body.allowedPayees : [process.env.RECEIVER_ACCOUNT_ID!];
    const policy: AgentPolicy = {
      maxPerCall: body.maxPerCall,
      allowedPayees,
      hederaAccount: account.accountId,
      token: config.usdcTokenId,
    };
    const policyTx = await relay(org.ensName, { kind: 'setPolicy', registry, label, name, policy });

    // 2b) [WS-7 D1] Write ADVISORY ENS identity records alongside leash.policy (agent.type/description/avatar/
    // optional erc8004). NEVER an enforcement input (INVARIANT #13). Non-fatal: identity is a nicety, the agent
    // works without it. Defaults give every agent a sensible type/description for the directory + demo.
    const agentType = (body.agentType || 'x402 payment agent').slice(0, 60);
    const description = (body.description || `Autonomous agent under ${org.ensName} with an ENS-declared spend policy.`).slice(0, 200);
    const avatar = (body.avatar || '').slice(0, 400);
    let identityTxs: { key: string; tx: string }[] = [];
    let identityWarning: string | null = null;
    try {
      identityTxs = await writeIdentity(name, { type: agentType, description, avatar: avatar || undefined, erc8004: body.erc8004 || undefined });
    } catch (e) {
      identityWarning = e instanceof Error ? e.message : String(e);
    }

    // 3) Index the agent (custody key held index-side per DEV-028; stripped from the response). Identity mirror
    // (agentType/description/avatar) is index-only + advisory (INVARIANT #3/#13).
    const inserted = await db.insert(agents).values({
      orgId: org.id, ensName: name, maxPerCall: policy.maxPerCall,
      allowedPayees: JSON.stringify(allowedPayees), hederaAccount: account.accountId,
      agentEvm: account.evmAddress, agentKey: account.keyDer, mintTx, policyTx,
      agentType, description, avatar,
    }).returning();

    // 4) [WS-7 A3] Reconcile the treasury funding policy so this new agent's EVM alias is in-cap fundable
    // (UNION into the allowlist; removes the DEV-030 default-DENY caveat). Behind requireOwner (above), so an
    // attacker cannot allowlist their own address. Non-fatal: the agent exists on-chain regardless; a reconcile
    // failure surfaces as a warning so registration is not silently wedged, but funding stays default-DENY.
    let fundingAllowlisted = false;
    let fundingWarning: string | null = null;
    try {
      const r = await reconcileFundingAllowlist(config.treasuryWalletId, account.evmAddress);
      fundingAllowlisted = r.added || r.allowlist.some((a) => a.toLowerCase() === account.evmAddress.toLowerCase());
    } catch (e) {
      fundingWarning = e instanceof Error ? e.message : String(e);
    }

    // 5) [WS-7 C1 / F-023] Co-hold the kill switch: grant the signed-in user's embedded-wallet address the
    // SET_RESOLVER role on THIS agent's tokenId, ALONGSIDE the relayer/agent (additive). The grant is
    // relayer-sponsored + scope-guarded (relay 'grant' op only acts under the caller's org subname), and
    // confined to the agent's own tokenId (never the parent/org registry - B-03). Verify BOTH the user and the
    // agent hold the role after (F-023 asserts both). Non-fatal: the agent exists regardless.
    let coholdTx: string | null = null;
    let coholdVerified = false;
    let coholdWarning: string | null = null;
    const userAddress = body.userAddress;
    if (userAddress && /^0x[0-9a-fA-F]{40}$/.test(userAddress)) {
      try {
        coholdTx = await relay(org.ensName, { kind: 'grant', registry, name, account: userAddress as `0x${string}` });
        const deployer = process.env.LEASH_DEPLOYER_ADDRESS as `0x${string}`;
        const [userHolds, relayerHolds] = await Promise.all([
          hasPolicyCohold(name, userAddress as `0x${string}`),
          hasPolicyCohold(name, deployer),
        ]);
        coholdVerified = userHolds && relayerHolds; // additive: BOTH the user AND the relayer hold the kill switch
      } catch (e) {
        coholdWarning = e instanceof Error ? e.message : String(e);
      }
    } else if (userAddress) {
      coholdWarning = 'userAddress is not a valid 0x EVM address; co-hold grant skipped';
    }

    return NextResponse.json({
      agent: publicAgent(inserted[0]), mintTx, policyTx, fundingAllowlisted, fundingWarning,
      coholdTx, coholdVerified, coholdWarning,
      identityTxs, identityWarning,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'agent registration failed', message }, { status: 500 });
  }
}

// [REFRAME R2] Bind an EXISTING external identity to a NEW 2-of-2 co-signed spending account. Write order is
// REF-7-pinned so a partial register is inert/fail-closed: resolve → provision co-signed account → ENS mint →
// on-chain-resolved identity records → **leash.policy LAST** (the spend authority is the final on-chain step) →
// Privy funding UNION (behind the same requireOwner) → index row. Honest: "on-chain-resolved", never "verified".
type OrgRow = { id: string; ensName: string; registryAddress: string };
async function bindExistingAgent(
  body: {
    label?: string; maxPerCall?: string; allowedPayees?: string[]; userAddress?: string; fundRaw?: number;
    description?: string; agentType?: string; avatar?: string;
    externalEvm?: string; erc8004Id?: string; agentPub?: string;
  },
  org: OrgRow,
): Promise<NextResponse> {
  if (!body.label || !body.maxPerCall) {
    return NextResponse.json({ error: 'label and maxPerCall are required' }, { status: 400 });
  }
  if (!/^\d+$/.test(body.maxPerCall)) {
    return NextResponse.json({ error: 'maxPerCall must be a raw smallest-unit integer string' }, { status: 400 });
  }
  const agentPub = body.agentPub?.trim();
  if (!agentPub) {
    // SR-1: the agent MUST supply its own Hedera public key; LEASH never generates one for a co-signed account.
    return NextResponse.json({ error: 'agentPub (the agent-supplied Hedera public key) is required to bind' }, { status: 400 });
  }

  const label = toLabel(body.label);
  const name = `${label}.${org.ensName}`;
  const registry = org.registryAddress as `0x${string}`;

  const dup = await db.select().from(agents).where(eq(agents.ensName, name)).limit(1);
  if (dup[0]) return NextResponse.json({ error: `agent ${name} already exists` }, { status: 409 });

  // 1) Resolve the external identity (R1). Owner-mismatch / unknown agentId ⇒ 4xx, NO provisioning (REF-5/REF-7).
  let resolved;
  try {
    resolved = await resolveExternalIdentity({ agentId: body.erc8004Id?.trim() || undefined, evmAddress: body.externalEvm?.trim() || undefined });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'identity resolution failed', message }, { status: 400 });
  }

  try {
    // 2) Provision the 2-of-2 co-signed spending account (SR-1-pure: LEASH holds only its cosigner key + agentPub).
    const account = await provisionSpendingAccount(agentPub, body.fundRaw ?? 20_000_000);

    // 3) Relayer-sponsored ENS mint: child owned by the account's long-zero EVM facade (the payer == funding == binding address).
    const expires = BigInt(Math.floor(Date.now() / 1000) + 31_536_000);
    const mintTx = await relay(org.ensName, {
      kind: 'mint', registry, label, agentAddress: account.longZeroEvm as `0x${string}`, expires,
    });

    // 4) ADVISORY on-chain-RESOLVED identity records (INVARIANT #13) — agent.address (resolved EVM) + erc8004 (CAIP).
    // Never an enforcement input; labeled "on-chain-resolved", not "verified". Non-fatal (identity is a nicety).
    const agentType = (body.agentType || 'external x402 agent (bound)').slice(0, 60);
    const description = (body.description || `External agent bound under ${org.ensName}; on-chain-resolved identity, ENS-declared spend policy.`).slice(0, 200);
    const avatar = (body.avatar || '').slice(0, 400);
    let identityTxs: { key: string; tx: string }[] = [];
    let identityWarning: string | null = null;
    try {
      identityTxs = await writeIdentity(name, {
        type: agentType,
        description,
        avatar: avatar || undefined,
        address: resolved.resolvedOwner,
        erc8004: resolved.caip || undefined,
      });
    } catch (e) {
      identityWarning = e instanceof Error ? e.message : String(e);
    }

    // 5) leash.policy LAST (REF-7): the spend authority is the FINAL on-chain write, so any earlier partial
    // failure leaves the register inert/fail-closed (no policy ⇒ the facilitator settles nothing).
    const allowedPayees = body.allowedPayees?.length ? body.allowedPayees : [process.env.RECEIVER_ACCOUNT_ID!];
    const policy: AgentPolicy = {
      maxPerCall: body.maxPerCall,
      allowedPayees,
      hederaAccount: account.accountId, // the 2-of-2 spending account (payer == binding, INVARIANT #8)
      token: config.usdcTokenId,
    };
    const policyTx = await relay(org.ensName, { kind: 'setPolicy', registry, label, name, policy });

    // 6) Privy funding UNION (behind the same requireOwner, A1) — target the account's long-zero EVM facade.
    // Non-fatal warning on failure (mirrors the mint path); the agent exists on-chain regardless.
    let fundingAllowlisted = false;
    let fundingWarning: string | null = null;
    try {
      const r = await reconcileFundingAllowlist(config.treasuryWalletId, account.longZeroEvm);
      fundingAllowlisted = r.added || r.allowlist.some((a) => a.toLowerCase() === account.longZeroEvm.toLowerCase());
    } catch (e) {
      fundingWarning = e instanceof Error ? e.message : String(e);
    }

    // 7) Index the agent row (co-signed marker + on-chain-resolved external identity, advisory).
    const inserted = await db.insert(agents).values({
      orgId: org.id, ensName: name, maxPerCall: policy.maxPerCall,
      allowedPayees: JSON.stringify(allowedPayees), hederaAccount: account.accountId,
      agentEvm: account.longZeroEvm, agentKey: '', mintTx, policyTx,
      agentType, description, avatar,
      externalIdentity: resolved.resolvedOwner,
      identityType: resolved.source, // 'erc8004' | 'evm'
      erc8004Id: resolved.agentId ?? '',
      accountType: 'cosigned',
      cosignerPub: account.cosignerPub,
    }).returning();

    return NextResponse.json({
      agent: publicAgent(inserted[0]),
      bound: true,
      identity: { source: resolved.source, resolvedOwner: resolved.resolvedOwner, agentId: resolved.agentId, caip: resolved.caip, label: 'on-chain-resolved' },
      cosigned: { accountId: account.accountId, longZeroEvm: account.longZeroEvm, cosignerPub: account.cosignerPub },
      mintTx, policyTx, fundingAllowlisted, fundingWarning, identityTxs, identityWarning,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'bind-existing registration failed', message }, { status: 500 });
  }
}

// PUT: set an agent's cap. Body: { agentId, maxPerCall }. Rewrites the ENS policy (relayer) + updates the index.
export async function PUT(req: Request) {
  const limited = enforceRateLimit(req, 'agents');
  if (limited) return limited;

  let body: { agentId?: string; maxPerCall?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }
  if (!body.agentId || !body.maxPerCall) {
    return NextResponse.json({ error: 'agentId and maxPerCall are required' }, { status: 400 });
  }
  if (!/^\d+$/.test(body.maxPerCall)) {
    return NextResponse.json({ error: 'maxPerCall must be a raw smallest-unit integer string' }, { status: 400 });
  }

  // A1: caller must own the target agent.
  let ctx;
  try {
    ctx = await requireOwner(req, { agentId: body.agentId });
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }
  const agent = ctx.agent!;
  const org = ctx.org;

  try {
    const label = agent.ensName.split('.')[0];

    const policy: AgentPolicy = {
      maxPerCall: body.maxPerCall,
      allowedPayees: JSON.parse(agent.allowedPayees) as string[],
      hederaAccount: agent.hederaAccount,
      token: config.usdcTokenId,
    };
    const policyTx = await relay(org.ensName, {
      kind: 'setPolicy', registry: org.registryAddress as `0x${string}`, label, name: agent.ensName, policy,
    });
    const updated = await db.update(agents)
      .set({ maxPerCall: body.maxPerCall, policyTx, status: 'active' })
      .where(eq(agents.id, agent.id)).returning();
    return NextResponse.json({ agent: publicAgent(updated[0]), policyTx });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'set cap failed', message }, { status: 500 });
  }
}

// GET ?orgId=... : the org's agents (index read; custody keys stripped). A1: caller must own the org.
export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get('orgId');
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  try {
    await requireOwner(req, { orgId });
  } catch (e) {
    const err = authErrorResponse(e);
    if (err) return NextResponse.json(err.body, { status: err.status });
    throw e;
  }
  try {
    const list = await db.select().from(agents).where(and(eq(agents.orgId, orgId)));
    return NextResponse.json({ agents: list.map(publicAgent) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'agent list failed', message }, { status: 502 });
  }
}
