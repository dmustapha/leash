# LEASH — Architecture Document

**Version:** V1
**Date:** 2026-09-12
**Stack:** TypeScript · Next.js (App Router) · @x402/core+hedera+express · @hiero-ledger/sdk · @privy-io/server-auth+react-auth · viem · Postgres (Neon)
**THIS IS THE SINGLE SOURCE OF TRUTH.** Copy code from this document exactly. Every code block carries a `// File:` header and a `[VERIFIED]/[UNVERIFIED]/[ASSUMED]` tag.

> Tag semantics: **[VERIFIED]** = pattern transcribed from the master build doc's live-verified scoping (which was checked against live source + live API tests 2026-09-12) or confirmed in-forge. **[UNVERIFIED]** = correct-by-docs but not yet run against the pinned install; carries `// WARNING: UNVERIFIED PATTERN — test immediately`. **[ASSUMED]** = glue code with no external source; carries `// CAUTION: ASSUMED PATTERN — test immediately`.

---

## 1. System Overview

### Purpose
Turn an org's ENS name hierarchy into a live, revocable spend-permission graph for its fleet of paying AI agents: a self-hosted Hedera x402 facilitator reads each agent's ENS resolver policy record before settling a gas-free payment and refuses over-cap/off-allowlist/revoked payments; Privy is the independent second rail on funding.

### System Diagram
```
 Ethereum Sepolia (ENSv2)                                Hedera testnet
 +-------------------------------------+      +------------------------------------------------+
 | <root>.eth (LEASH root, WS-1)       |      | facilitator/ (Node, @x402/core)                |
 |  └─ <org>.<root>.eth (org subname)  |      |   onBeforeVerify: authorize() advisory pre-screen|
 |      ├─ data.<org>.<root>.eth       |<-read-|   onBeforeSettle: authorize() AUTHORITATIVE     |
 |      │   resolver text 'leash.policy'| viem  |     (no-cache read) -> {settle,auth}|{abort}   |
 |      │   {maxPerCall,allowedPayees, | eth_call    binding: policy.hederaAccount===payer      |
 |      │    hederaAccount,token}       |      |     cap: amount<=maxPerCall (BigInt)            |
 |      └─ payments.<org>.<root>.eth   |      |     allowlist: payTo in allowedPayees           |
 |  EAC roles: SET_RESOLVER/SET_SUBREG |      |   settle: add feePayer sig + submit (gas-free) |
 |  revokeRoles / setText('') = kill    |      |   HCS: append ALLOW/DENY                        |
 +-------------------------------------+      +----------------------+-------------------------+
                                                                     | native TransferTransaction
  treasury/ (Privy P-256-owner wallet)                              | (USDC HTS, feePayer=facilitator)
 +-------------------------------------+      +---------------------v--------------------------+
 | funding policy: ERC-20 transfer      |-fund-> agent/ (Privy secp256k1Sign; owns ENS name  |
 |  _to in [agents] & _value<=fundingCap| Privy | on Sepolia = same ECDSA key that pays Hedera)|
 | over-fund -> FUNDING_DENIED          | gated +---------------------+--------------------------+
 +-------------------------------------+                             |
                                              resource-server/ (@x402/express) GET /premium
  web/ (Next.js on Vercel)                    db/ (Neon Postgres: users/orgs/agents/spend_events, index only)
   /demo -> JUDGE SANDBOX (server-side, no login/wallet/ETH)  [SCORED, first]   relayer/ (gas sponsor, scoped)
   /app  -> REAL CONSOLE (Privy login -> org subname -> DB)   [second]
```

### Technology Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | v24.10.0 | runtime |
| TypeScript | ^5.x | all code |
| viem | ^2.56 | ENSv2 reads/writes (thin wrapper; NOT @ensdomains/ensjs — v2 is alpha) |
| @x402/core | ~2.25 | facilitator + hooks |
| @x402/hedera | 2.25 | native Hedera exact scheme, client helpers |
| @x402/express | ~2.25 | resource-server payment middleware |
| @hiero-ledger/sdk | 2.85.0 | Hedera tx (lockstep with proto; NEVER @hashgraph/sdk) |
| @hiero-ledger/proto | 2.31.0 | Hedera proto (lockstep) |
| @privy-io/server-auth | ^1.32 | treasury wallet + policy + custody signer |
| @privy-io/react-auth | latest | real-console email/Google login |
| next | latest | dashboard (App Router) |
| drizzle-orm + pg | latest | Postgres schema + queries |
| tsx | latest | run TS scripts (setup, seed) |

### File Structure
```
leash/  (== repo root /Users/MAC/ethonline-2026)
  package.json
  tsconfig.json
  .env                         (gitignored; present)
  .env.example                 (generated Phase 4)
  types/
    index.ts                   (shared types — written first)
  scripts/
    ens/
      addresses.ts             (pinned ENSv2 set + runtime loader)
      client.ts                (viem public+wallet clients)
      register-2ld.ts          (commit->wait->reveal root/org 2LD; LOCAL only)
      subregistry.ts           (deploy UserRegistry via VerifiableFactory + setSubregistry)
      roles.ts                 (grantRoles / revokeRoles — the kill switch)
      subname.ts               (mint child name; owner=agent address)
      policy.ts                (setPolicy / readPolicy — leash.policy text record)
      reverse.ts               (setName reverse record)
      revoke.ts                (clear policy OR revokeRoles)
    hedera/
      client.ts                (Hedera client from operator env)
      mint-usdc.ts             (own 6-dec HTS token)
      associate.ts             (associate token on payer+receiver)
      hcs.ts                   (create topic + submit message)
      fund-agent.ts            (operator-funded HBAR for agent accounts)
  facilitator/
    authorize.ts               (PURE closed-union gate decision — the enforcement core)
    ens-read.ts                (getLeashPolicy via viem; no-cache + cached variants)
    hedera-scheme.ts           (ExactHederaScheme wiring, feePayer)
    hcs-log.ts                 (ALLOW/DENY -> HCS)
    server.ts                  (x402Facilitator + onBeforeVerify/onBeforeSettle + /verify /settle)
  resource-server/
    server.ts                  (@x402/express GET /premium pointing at our facilitator)
  agent/
    pay.ts                     (build+sign native transfer via Privy, pay with X-Leash-Agent)
  treasury/
    privy.ts                   (P-256-owner wallet + funding policy + policy-gated fund + DENY)
  db/
    schema.ts                  (drizzle: users, orgs, agents, spend_events)
    client.ts                  (Neon pg pool)
    index-hcs.ts               (poll HCS -> spend_events; index layer only)
  relayer/
    relay.ts                   (deployer sponsors a user's ENS op, scoped to their org subname)
  web/
    app/
      layout.tsx
      page.tsx                 (landing: /demo + /app split)
      demo/page.tsx            (JUDGE SANDBOX hero flow — server-orchestrated)
      app/page.tsx             (REAL CONSOLE — Privy login + multi-tenant)
      api/
        demo/route.ts          (sandbox orchestration: grant/spend/refuse/revoke/deny beats)
        agents/route.ts        (real: mint+setPolicy+DB record, relayer-sponsored)
        revoke/route.ts        (real+demo: clear policy / revokeRoles)
        pay/route.ts           (trigger an agent payment)
        fund/route.ts          (Privy policy-gated funding + leaked-key DENY)
        policy/[name]/route.ts (read live leash.policy for the UI)
    lib/
      config.ts               (typed env access, shared)
    components/
      SplitScreen.tsx         (A/B resolver-record | live-402 view)
      AgentCard.tsx           (cap + allowlist + status)
  scripts/
    setup.ts                   (one-time: 2LD register, subregistry, roles, mint USDC, HCS topic)
    seed-demo.ts               (idempotent judge-sandbox seed state — PRD §6 table)
    verify-claims.ts           (recompute headline numbers from committed data)
  docs/
    (LEASH-MASTER-BUILD-DOC.md, FORGE-KICKOFF-HANDOFF.md, AI-ATTRIBUTION.md, spec/)
```

> **Repo-layout discipline (EX-7):** the deterministic enforcement core is `facilitator/authorize.ts` — it performs NO I/O (no network, no DB, no filesystem); its only import beyond `types` is viem's pure synchronous `keccak256`/`toBytes` for the audit policyHash, so it stays unit-testable with zero mocks; I/O adapters (`ens-read.ts`, `hedera-scheme.ts`, `hcs-log.ts`) depend inward on the types + authorize decision, never the reverse. Each external coupling is quarantined to ONE directory: ENS→`scripts/ens/` + `facilitator/ens-read.ts`; Hedera→`scripts/hedera/` + `facilitator/hedera-scheme.ts`; Privy→`treasury/privy.ts` + `agent/pay.ts`. `evidence/` (created by `scripts/verify-claims.ts`) holds recomputed proof output. Sequenced setup steps carry order in the filename.

---

## 2. Component Architecture

### Component Table
| # | Component | Type | File Path | Purpose | Dependencies |
|---|-----------|------|-----------|---------|-------------|
| 1 | Shared types | types | `types/index.ts` | all cross-module types | none |
| 2 | ENS provisioning | scripts | `scripts/ens/*` | provision + control the naming hierarchy + policy records | viem, types |
| 3 | Hedera scripts | scripts | `scripts/hedera/*` | mint USDC, associate, HCS topic, fund | @hiero-ledger/sdk, types |
| 4 | Facilitator (incl. HCS logger) | service | `facilitator/*` | the spend gate: read ENS, enforce, settle gas-free, HCS log | @x402/core, @x402/hedera, viem, types |
| 5 | Resource server | service | `resource-server/server.ts` | live x402-gated API | @x402/express, types |
| 6 | Agent client | module | `agent/pay.ts` | build+sign+pay | @privy-io/server-auth, @x402/hedera, types |
| 7 | Treasury (Privy) | module | `treasury/privy.ts` | org wallet + funding policy + DENY | @privy-io/server-auth, types |
| 8 | Web dashboard | Next.js | `web/*` | /demo sandbox + /app console + API routes | next, viem, @privy-io/react-auth |
| 9 | Database | data | `db/*` | index layer (never enforcement) | drizzle, pg, types |
| 10 | Relayer | module | `relayer/relay.ts` | scoped gas sponsor for user ENS ops | viem, types |

### Data Flow (with types)
`AgentPolicy` (from ENS) + decoded `PaymentContext` (from x402) → `authorize(): GateDecision` → HCS `LogEntry` + Hedera settle. Funding: `FundingRequest` → Privy policy eval → allow/`FUNDING_DENIED`. Index: HCS messages → `SpendEvent` rows (DB, read-only for the UI, never for enforcement).

### Dependency Graph (one-way flow — EX-3)
```
types/index.ts            (no imports)
facilitator/authorize.ts  -> types + viem(keccak256,toBytes pure)  (NO I/O — the deterministic core)
facilitator/ens-read.ts   -> types, viem      (I/O adapter, depends inward)
facilitator/hedera-scheme.ts -> types, @x402/hedera
facilitator/hcs-log.ts    -> types, @hiero-ledger/sdk
facilitator/server.ts     -> authorize, ens-read, hedera-scheme, hcs-log
resource-server/server.ts -> @x402/express (points at facilitator URL; no import edge)
agent/pay.ts              -> types, @privy-io/server-auth, @x402/hedera
treasury/privy.ts         -> types, @privy-io/server-auth
scripts/ens/*             -> types, scripts/ens/client, scripts/ens/addresses
scripts/hedera/*          -> types, scripts/hedera/client
db/*                      -> types, drizzle
relayer/relay.ts          -> types, scripts/ens/client
web/app/api/*             -> scripts/ens/*, agent/pay, treasury/privy, db/*   (never imports facilitator internals)
web/app/demo/page.tsx     -> web/app/api/demo   (NO import edge to web/app/app — INVARIANT #10)
```
The arrow direction is strictly inward toward `types` + `authorize`. `authorize.ts` depends on nothing but `types`, so the enforcement decision is unit-testable with zero I/O and cannot be corrupted by an adapter.

---

## 3. Shared Types

**Written first — imported everywhere. No imports from other project files.**

#### File: `types/index.ts`
[VERIFIED] — shapes transcribed from master §4.1 (leash.policy JSON), §4.2 (hook context), §4.3 (Privy policy)
```typescript
// File: types/index.ts
// All shared types. Order: enums -> data structures -> gate decision -> API shapes.

// ---- Rejection codes (surfaced verbatim in README Core-Invariants by deploy) ----
export type GateReason =
  | 'OVER_CAP'
  | 'OFF_ALLOWLIST'
  | 'REVOKED'
  | 'BINDING_MISMATCH'
  | 'MALFORMED_POLICY'
  | 'REPLAY'
  | 'RPC_ERROR';

export type FundingReason = 'FUNDING_DENIED';

// ---- The org's declared policy, stored as the ENS text record `leash.policy` ----
// All amounts are raw smallest-unit decimal strings (USDC 6 decimals: 5 USDC = "5000000").
export interface AgentPolicy {
  maxPerCall: string;        // raw smallest-unit integer as string
  allowedPayees: string[];   // Hedera account ids "0.0.x"
  hederaAccount: string;     // the agent's Hedera account "0.0.x" (binding anchor)
  token: string;             // the HTS token id "0.0.x"
}

// ---- Decoded payment context handed to the gate ----
export interface PaymentContext {
  agentName: string;   // from X-Leash-Agent header (UNTRUSTED — only names the record)
  payer: string;       // decoded tx payer Hedera account (from the signed payload)
  amount: bigint;      // raw smallest-unit amount decoded from the transfer
  payTo: string;       // recipient Hedera account
  asset: string;       // token id
  paymentId: string;   // unique id of this X-PAYMENT payload (replay key)
}

// ---- Affirmative authorization payload (only produced on settle) ----
export interface SettleAuth {
  agentName: string;
  amount: bigint;
  payTo: string;
  policyHash: string;  // keccak of the policy read at settle time (audit anchor)
}

// ---- The closed gate decision. NO third inhabitant, NO void proceed (INVARIANT #1). ----
export type GateDecision =
  | { settle: true; auth: SettleAuth }
  | { abort: true; reason: GateReason };

// ---- HCS audit entry ----
export interface LogEntry {
  name: string;
  decision: 'ALLOW' | 'DENY';
  amount: string;
  payTo: string;
  reason?: GateReason;
  ts: string;          // ISO
}

// ---- Funding (Privy rail) ----
export interface FundingRequest {
  agentAddress: string;  // EVM-facade address of the agent (transfer._to)
  amountRaw: string;     // raw smallest-unit
}
export type FundingResult =
  | { funded: true; txHash: string }
  | { denied: true; reason: FundingReason };

// ---- DB row shapes (index layer only) ----
export interface SpendEvent {
  id: string;
  agentName: string;
  decision: 'ALLOW' | 'DENY';
  amount: string;
  payTo: string;
  reason: string | null;
  hcsSequence: number;
  ts: string;
}
```

### Key Decisions
- `GateDecision` is a closed union with no `void` — "proceed" is impossible to express without an affirmative `{settle:true, auth}` (INVARIANT #1, structural).
- `amount` is `bigint`; `AgentPolicy.maxPerCall` is a decimal string parsed to `bigint` before compare (INVARIANT #7). No floats anywhere.

---

## 4. Facilitator + ENS Gate (component 4 — the enforcement core)

### Purpose
Read the ENS policy, decide `GateDecision`, settle native Hedera gas-free on `{settle:true}`, log to HCS. `authorize.ts` is pure (no I/O) so the decision is structurally isolated.

### Dependencies
`types/index.ts`; viem (ens-read); @x402/hedera (scheme); @hiero-ledger/sdk (hcs-log); @x402/core (server).

### Code

#### File: `facilitator/authorize.ts`
[VERIFIED] — enforces INVARIANTS #1/#6/#7/#8/#9 exactly; pure function, no I/O
```typescript
// File: facilitator/authorize.ts
// PURE gate decision. Imports ONLY types. No I/O — unit-testable with zero mocks.
// INVARIANT #1: returns a closed GateDecision; "proceed" cannot be produced without {settle:true}.
import { keccak256, toBytes } from 'viem';
import type { AgentPolicy, PaymentContext, GateDecision } from '../types';

// Parse a raw smallest-unit decimal string to bigint; throws on malformed (caught by caller -> MALFORMED_POLICY).
function parseRaw(s: string): bigint {
  if (!/^\d+$/.test(s)) throw new Error('malformed');
  return BigInt(s);
}

// seen: replay guard (paymentId set). Injected so the caller owns lifetime/persistence.
export function authorize(
  policy: AgentPolicy | null,
  ctx: PaymentContext,
  seen: Set<string>,
): GateDecision {
  // Revoked / empty policy -> fail closed.
  if (policy === null) return { abort: true, reason: 'REVOKED' };

  // Replay: a paymentId we already settled cannot settle again.
  if (seen.has(ctx.paymentId)) return { abort: true, reason: 'REPLAY' };

  // Binding anti-spoof (INVARIANT #8): the record's hederaAccount MUST equal the actual payer.
  // The X-Leash-Agent header only NAMED which record to read; it is untrusted.
  if (policy.hederaAccount !== ctx.payer) return { abort: true, reason: 'BINDING_MISMATCH' };

  // Cap: raw-unit BigInt compare (INVARIANT #7). Malformed cap -> MALFORMED_POLICY.
  let maxPerCall: bigint;
  try {
    maxPerCall = parseRaw(policy.maxPerCall);
  } catch {
    return { abort: true, reason: 'MALFORMED_POLICY' };
  }
  if (ctx.amount > maxPerCall) return { abort: true, reason: 'OVER_CAP' };

  // Allowlist.
  if (!policy.allowedPayees.includes(ctx.payTo)) return { abort: true, reason: 'OFF_ALLOWLIST' };

  // Token must match the policy's declared token.
  if (policy.token !== ctx.asset) return { abort: true, reason: 'OFF_ALLOWLIST' };

  const policyHash = keccak256(toBytes(JSON.stringify(policy)));
  return {
    settle: true,
    auth: { agentName: ctx.agentName, amount: ctx.amount, payTo: ctx.payTo, policyHash },
  };
}
```

#### File: `facilitator/ens-read.ts`
[UNVERIFIED] — viem text-read on a 3-level name via UniversalResolverV2 is the ENSv2-alpha path (PRD-W5); WS-1 read-back must exercise THIS exact function
```typescript
// File: facilitator/ens-read.ts
// WARNING: UNVERIFIED PATTERN — test immediately (3-level getEnsText on ENSv2 alpha).
// Reads leash.policy. Two variants: no-cache (settle path) and 30s-cached (advisory pre-screen).
import { createPublicClient, http, namehash } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';
import type { AgentPolicy } from '../types';
import { ENS } from '../scripts/ens/addresses';

const client = createPublicClient({ chain: sepolia, transport: http(process.env.SEPOLIA_RPC_URL!) });

const resolverAbi = parseAbi(['function text(bytes32 node, string key) view returns (string)']);

// Low-level: read the raw text value via the UniversalResolver-backed resolver.
async function readText(name: string): Promise<string> {
  const node = namehash(name);
  const value = await client.readContract({
    address: ENS.PublicResolverV2,
    abi: resolverAbi,
    functionName: 'text',
    args: [node, 'leash.policy'],
  });
  return value as string;
}

// Parse the text value into AgentPolicy, or null if empty/revoked.
// Throws only on transport/RPC failure (caller maps to RPC_ERROR — INVARIANT #1 fail-closed).
function parsePolicy(raw: string): AgentPolicy | null {
  if (!raw || raw.trim() === '') return null;
  const p = JSON.parse(raw) as AgentPolicy;
  return p;
}

// AUTHORITATIVE settle-time read — NO cache (INVARIANT #2). Malformed JSON returns a sentinel
// the caller treats as MALFORMED_POLICY; empty returns null (REVOKED).
export async function readPolicyNoCache(name: string): Promise<AgentPolicy | null | 'MALFORMED'> {
  const raw = await readText(name); // throws -> RPC_ERROR upstream
  try {
    return parsePolicy(raw);
  } catch {
    return 'MALFORMED';
  }
}

// Advisory pre-screen read — 30s TTL cache permitted (INVARIANT #3).
const cache = new Map<string, { value: AgentPolicy | null | 'MALFORMED'; exp: number }>();
export async function readPolicyCached(name: string): Promise<AgentPolicy | null | 'MALFORMED'> {
  const hit = cache.get(name);
  const now = Date.now();
  if (hit && hit.exp > now) return hit.value;
  const raw = await readText(name);
  let value: AgentPolicy | null | 'MALFORMED';
  try {
    value = parsePolicy(raw);
  } catch {
    value = 'MALFORMED';
  }
  cache.set(name, { value, exp: now + 30_000 });
  return value;
}
```

#### File: `facilitator/hcs-log.ts`
[VERIFIED] — master §4.2 HCS (TopicMessageSubmitTransaction)
```typescript
// File: facilitator/hcs-log.ts
import { TopicMessageSubmitTransaction } from '@hiero-ledger/sdk';
import type { LogEntry } from '../types';
import { hederaClient } from '../scripts/hedera/client';

export async function logDecision(entry: LogEntry): Promise<void> {
  const client = hederaClient();
  await new TopicMessageSubmitTransaction()
    .setTopicId(process.env.HCS_TOPIC_ID!)
    .setMessage(JSON.stringify(entry))
    .execute(client);
}
```

#### File: `facilitator/hedera-scheme.ts`
[UNVERIFIED] — master §4.2 scheme wiring; WARNING: pin-verify @x402/hedera exports at WS-2
```typescript
// File: facilitator/hedera-scheme.ts
// WARNING: UNVERIFIED PATTERN — test immediately (confirm @x402/hedera 2.25 export names at install).
import {
  ExactHederaScheme,
  createHederaSignAndSubmitTransaction,
  createHederaVerifyPayerSignature,
  createHederaClient,
} from '@x402/hedera/exact/facilitator';

export function hederaScheme() {
  const client = createHederaClient({
    network: 'testnet',
    operatorId: process.env.HEDERA_OPERATOR_ID!,
    operatorKey: process.env.HEDERA_OPERATOR_KEY!,
  });
  return new ExactHederaScheme({
    client,
    signAndSubmit: createHederaSignAndSubmitTransaction(client), // adds feePayer sig + submits
    verifyPayerSignature: createHederaVerifyPayerSignature(client), // Mirror Node payer-sig check
  });
}
```

#### File: `facilitator/server.ts`
[UNVERIFIED] — master §4.2 hook registration; encodes INVARIANTS #1/#2/#3 (verify advisory, settle authoritative no-cache)
```typescript
// File: facilitator/server.ts
// WARNING: UNVERIFIED PATTERN — test immediately (confirm @x402/core hook signatures at install).
import { x402Facilitator } from '@x402/core';
import { authorize } from './authorize';
import { readPolicyCached, readPolicyNoCache } from './ens-read';
import { hederaScheme } from './hedera-scheme';
import { logDecision } from './hcs-log';
import type { PaymentContext, GateDecision, AgentPolicy } from '../types';

const seen = new Set<string>(); // replay guard for settled paymentIds

// Extract PaymentContext from the x402 hook context + X-Leash-Agent header.
function toCtx(hookCtx: any): PaymentContext {
  return {
    agentName: hookCtx.headers['x-leash-agent'],
    payer: hookCtx.payload.payer,
    amount: BigInt(hookCtx.payload.amount),
    payTo: hookCtx.requirements.payTo,
    asset: hookCtx.requirements.asset,
    paymentId: hookCtx.payload.paymentId,
  };
}

// Resolve policy for a read variant, mapping RPC throw -> null-with-error sentinel handled by caller.
async function decide(ctx: PaymentContext, read: (n: string) => Promise<AgentPolicy | null | 'MALFORMED'>): Promise<GateDecision> {
  let policy: AgentPolicy | null | 'MALFORMED';
  try {
    policy = await read(ctx.agentName);
  } catch {
    return { abort: true, reason: 'RPC_ERROR' }; // INVARIANT #1: fail closed on read failure
  }
  if (policy === 'MALFORMED') return { abort: true, reason: 'MALFORMED_POLICY' };
  return authorize(policy, ctx, seen);
}

// Translate a GateDecision to the SDK hook contract (void | {abort,reason}).
// INVARIANT #1: SDK-proceed (return undefined) is emitted ONLY under d.settle === true.
function toHook(d: GateDecision): void | { abort: true; reason: string } {
  if (d.settle === true) return; // proceed
  return { abort: true, reason: d.reason };
}

export const facilitator = new x402Facilitator()
  .registerScheme(2, ['hedera:testnet'], hederaScheme())
  // Advisory pre-screen (30s cache OK). ALLOW here is NOT authoritative.
  .onBeforeVerify(async (hookCtx: any) => {
    const ctx = toCtx(hookCtx);
    const d = await decide(ctx, readPolicyCached);
    if (d.settle !== true) {
      await logDecision({ name: ctx.agentName, decision: 'DENY', amount: hookCtx.payload.amount, payTo: ctx.payTo, reason: d.reason, ts: new Date().toISOString() });
    }
    return toHook(d);
  })
  // AUTHORITATIVE decision (no cache). This gates the settle (INVARIANT #2, closes TOCTOU).
  .onBeforeSettle(async (hookCtx: any) => {
    const ctx = toCtx(hookCtx);
    const d = await decide(ctx, readPolicyNoCache);
    const decision = d.settle === true ? 'ALLOW' : 'DENY';
    await logDecision({ name: ctx.agentName, decision, amount: hookCtx.payload.amount, payTo: ctx.payTo, reason: d.settle === true ? undefined : d.reason, ts: new Date().toISOString() });
    if (d.settle === true) seen.add(ctx.paymentId); // consume paymentId only on authorized settle
    return toHook(d);
  });

// Exhaustiveness guard (INVARIANT #1): a future GateReason with no branch fails tsc here.
function _assertNever(x: never): never { throw new Error('unhandled: ' + x); }
export function _exhaustive(d: GateDecision) {
  if (d.settle === true) return;
  switch (d.reason) {
    case 'OVER_CAP': case 'OFF_ALLOWLIST': case 'REVOKED': case 'BINDING_MISMATCH':
    case 'MALFORMED_POLICY': case 'REPLAY': case 'RPC_ERROR': return;
    default: return _assertNever(d.reason);
  }
}
```

### Key Decisions
- `authorize()` is pure and takes the policy as an argument, so all enforcement branches are tested without RPC/Hedera. The adapter (`server.ts`) owns the I/O and the single guarded proceed emit.
- The replay `seen` set is process-memory (sufficient for the demo; a production build would back it with the DB/Redis — noted in LIMITATIONS).

### Verified / Unverified Status
`authorize.ts` [VERIFIED] logic. `ens-read.ts`/`hedera-scheme.ts`/`server.ts` [UNVERIFIED] against pinned installs — WS-2 clears them.

---

## 5. ENS Provisioning (component 2 — the RISKIEST, WS-1 first)

### Purpose
Provision the naming hierarchy and per-agent policy records; the kill switch is here (`revoke`).

### Dependencies
`types/index.ts`, viem ^2.56, Sepolia RPC, pinned ENSv2 addresses.

### Code

#### File: `scripts/ens/addresses.ts`
[VERIFIED] — master §4.1 pinned 2026-06-29 set; ETHRegistry bytecode reachability confirmed in-forge
```typescript
// File: scripts/ens/addresses.ts
// Pinned ENSv2 Sepolia set (2026-06-29). Prefer runtime load from contracts-v2/deployments/sepolia/*.json
// if that repo is cloned; otherwise this pinned set is authoritative (master §4.1).
import type { Address } from 'viem';
import { existsSync, readFileSync } from 'fs';

const PINNED = {
  RootRegistry: '0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c',
  ETHRegistry: '0x67b728a792e789a8978b30cf1b3b641f19354b43',
  ETHRegistrar: '0xa4449a0dd2b83007553d9b1d28b583a46a805a30',
  PublicResolverV2: '0xd25f66dd4ff61486c2c5c1e6201a23576698d3df',
  PermissionedResolverImpl: '0x7e4b2d59938930168024201752ee5503df402303',
  UserRegistryImpl: '0x840fa461059862ea466a711e8c98c8de732061c0',
  VerifiableFactory: '0x118bc31a50d559f7015a8da26d54b3b030cdb70f',
  UniversalResolverV2: '0x85edf8b6b7d4211e2b07aa687506b746357b92cf',
  UpgradableUniversalResolverProxy: '0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe',
  ReverseRegistrarAdapter: '0x94e64e29e25533f93ba0a430646ae42cb47bf8f3',
} as const;

// Optional runtime override from a cloned contracts-v2 deployment (master §4.1).
function loadOverride(): Partial<typeof PINNED> {
  const path = 'contracts-v2/deployments/sepolia/deployment.json';
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

export const ENS = { ...PINNED, ...loadOverride() } as Record<keyof typeof PINNED, Address>;

// EAC role bitmap (master §4.1).
export const ROLE = {
  REGISTRAR: 1n << 0n,
  UNREGISTER: 1n << 12n,
  RENEW: 1n << 16n,
  SET_SUBREGISTRY: 1n << 20n,
  SET_RESOLVER: 1n << 24n,
} as const;
export const ADMIN_SHIFT = 128n; // admin variant = role << 128
```

#### File: `scripts/ens/client.ts`
[VERIFIED] — standard viem client construction
```typescript
// File: scripts/ens/client.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const rpc = http(process.env.SEPOLIA_RPC_URL!);
export const publicClient = createPublicClient({ chain: sepolia, transport: rpc });

export function walletClient(pk: `0x${string}` = process.env.LEASH_DEPLOYER_KEY as `0x${string}`) {
  return createWalletClient({ account: privateKeyToAccount(pk), chain: sepolia, transport: rpc });
}
```

#### File: `scripts/ens/register-2ld.ts`
[ASSUMED] — the ENSv2-alpha ETHRegistrar commit-reveal ABI is NOT given by the master doc; this signature is a placeholder. WS-1 MUST confirm the real ABI (clone `contracts-v2` or read the deployed contract) BEFORE build copies this. Returns the real tokenId (read via `tokenIdOf`), not a positional-log guess.
```typescript
// File: scripts/ens/register-2ld.ts
// CAUTION: ASSUMED PATTERN — the registrar ABI + commit-reveal args are a PLACEHOLDER guess.
// WS-1 RESOLVE (decision tree DP-1 in PLAN): confirm the deployed ETHRegistrar's real makeCommitment/register
// signature (historically makeCommitment(name,owner,duration,secret,resolver,data,reverseRecord,fuses)) and the
// exact tokenId scheme. Do NOT trust this signature; do NOT copy to build before DP-1 resolves it.
// Run LOCALLY (60s commit wait). Persists the salt so a crash between commit and reveal does not burn the commit.
import { parseAbi, namehash } from 'viem';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';

// PLACEHOLDER ABI — replace with the confirmed registrar ABI at WS-1/DP-1.
const registrarAbi = parseAbi([
  'function available(string label) view returns (bool)',
  'function commit(bytes32 commitment)',
  'function makeCommitment(string label,address owner,uint256 salt) view returns (bytes32)',
  'function register(string label,address owner,uint256 salt,uint64 duration) returns (uint256)',
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// tokenId candidate: ENSv2 nodes are namehashes; registries key by node. WS-1/DP-1 confirms whether the
// registry keys by uint256(namehash(fullName)) or uint256(labelhash). Threaded through so callers never guess.
export function tokenIdOf(fullName: string): bigint {
  return BigInt(namehash(fullName)); // [ASSUMED candidate — confirm at DP-1]
}

// Returns { label, fullName, tokenId } for the registered name (preferred or a free fallback).
export async function register2LD(preferred: string, fallbacks: string[], parentName = 'eth', durationSecs = 31536000n): Promise<{ label: string; fullName: string; tokenId: bigint }> {
  const wallet = walletClient();
  const owner = wallet.account.address;
  const candidates = [preferred, ...fallbacks];
  let label = '';
  for (const c of candidates) {
    const free = await publicClient.readContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'available', args: [c] });
    if (free) { label = c; break; }
  }
  if (!label) throw new Error('no free label among candidates: ' + candidates.join(','));

  // Persist a stable salt so a crash between commit and reveal can resume (does not burn the commit).
  const saltFile = `.salt-${label}`;
  const salt = existsSync(saltFile) ? BigInt(readFileSync(saltFile, 'utf8')) : ((): bigint => { const s = BigInt('0x' + namehash(`${label}.${parentName}`).slice(2, 18)); writeFileSync(saltFile, s.toString()); return s; })();

  const commitment = await publicClient.readContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'makeCommitment', args: [label, owner, salt] });
  const commitHash = await wallet.writeContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'commit', args: [commitment] });
  await publicClient.waitForTransactionReceipt({ hash: commitHash });
  await sleep(60_000);
  const regHash = await wallet.writeContract({ address: ENS.ETHRegistrar, abi: registrarAbi, functionName: 'register', args: [label, owner, salt, durationSecs] });
  await publicClient.waitForTransactionReceipt({ hash: regHash });
  const fullName = `${label}.${parentName}`;
  return { label, fullName, tokenId: tokenIdOf(fullName) };
}
```

#### File: `scripts/ens/subregistry.ts`
[UNVERIFIED] — master §3.5 step 2 (VerifiableFactory + setSubregistry)
```typescript
// File: scripts/ens/subregistry.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS, ROLE } from './addresses';

const factoryAbi = parseAbi(['function deploy(address implementation,bytes initData) returns (address)']);
const registryAbi = parseAbi([
  'function setSubregistry(uint256 tokenId,address registry)',
  'function grantRoles(uint256 tokenId,uint256 roleBitmap,address account)',
]);

// Deploy an org UserRegistry and wire it under a parent tokenId so the parent can mint children.
export async function deploySubregistry(parentTokenId: bigint): Promise<`0x${string}`> {
  const wallet = walletClient();
  const deployHash = await wallet.writeContract({ address: ENS.VerifiableFactory, abi: factoryAbi, functionName: 'deploy', args: [ENS.UserRegistryImpl, '0x'] });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
  const registry = receipt.contractAddress!;
  const set = await wallet.writeContract({ address: ENS.ETHRegistry, abi: registryAbi, functionName: 'setSubregistry', args: [parentTokenId, registry] });
  await publicClient.waitForTransactionReceipt({ hash: set });
  const grant = await wallet.writeContract({ address: registry, abi: registryAbi, functionName: 'grantRoles', args: [parentTokenId, ROLE.REGISTRAR, wallet.account.address] });
  await publicClient.waitForTransactionReceipt({ hash: grant });
  return registry;
}
```

#### File: `scripts/ens/subname.ts`
[UNVERIFIED] — master §4.1 register ABI; tokenId via confirmed scheme (tokenIdOf), not positional log
```typescript
// File: scripts/ens/subname.ts
// WARNING: UNVERIFIED PATTERN — test immediately. tokenId derivation confirmed at WS-1/DP-1.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS, ROLE, ADMIN_SHIFT } from './addresses';
import { tokenIdOf } from './register-2ld';

const registryAbi = parseAbi([
  'function register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expires) returns (uint256)',
]);

// Mint a child name owned by the agent's address. Default owner bitmap per master §4.1.
// parentName = the org subname (e.g. "acme.leash.eth") so the full child name (and its tokenId) is known.
export async function mintSubname(registry: `0x${string}`, label: string, parentName: string, agentAddress: `0x${string}`, expires: bigint): Promise<bigint> {
  const wallet = walletClient();
  const ownerBitmap =
    ROLE.UNREGISTER | ROLE.RENEW | ROLE.SET_SUBREGISTRY | ROLE.SET_RESOLVER |
    (ROLE.UNREGISTER << ADMIN_SHIFT) | (ROLE.RENEW << ADMIN_SHIFT) | (ROLE.SET_SUBREGISTRY << ADMIN_SHIFT) | (ROLE.SET_RESOLVER << ADMIN_SHIFT);
  const hash = await wallet.writeContract({
    address: registry, abi: registryAbi, functionName: 'register',
    args: [label, agentAddress, registry, ENS.PublicResolverV2, ownerBitmap, expires],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  // tokenId via the confirmed scheme (tokenIdOf), NOT a positional-log guess. DP-1 confirms the scheme at WS-1.
  return tokenIdOf(`${label}.${parentName}`);
}
```

#### File: `scripts/ens/policy.ts`
[UNVERIFIED] — master §4.1 setText/text; the write side of the enforcement policy
```typescript
// File: scripts/ens/policy.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { parseAbi, namehash } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';
import type { AgentPolicy } from '../../types';

const resolverAbi = parseAbi([
  'function setText(bytes32 node,string key,string value)',
  'function text(bytes32 node,string key) view returns (string)',
]);

export async function setPolicy(name: string, policy: AgentPolicy): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: ENS.PublicResolverV2, abi: resolverAbi, functionName: 'setText', args: [namehash(name), 'leash.policy', JSON.stringify(policy)] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Read-back check (PRD-W5): uses namehash + PublicResolverV2, the same primitives as facilitator/ens-read.ts.
export async function readPolicy(name: string): Promise<AgentPolicy | null> {
  const raw = await publicClient.readContract({ address: ENS.PublicResolverV2, abi: resolverAbi, functionName: 'text', args: [namehash(name), 'leash.policy'] });
  const s = raw as string;
  return s && s.trim() !== '' ? (JSON.parse(s) as AgentPolicy) : null;
}
```

#### File: `scripts/ens/reverse.ts`
[UNVERIFIED] — master §4.1 reverse adapter setName
```typescript
// File: scripts/ens/reverse.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS } from './addresses';

const reverseAbi = parseAbi(['function setName(string name) returns (bytes32)']);

export async function setReverse(name: string, pk?: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient(pk);
  const hash = await wallet.writeContract({ address: ENS.ReverseRegistrarAdapter, abi: reverseAbi, functionName: 'setName', args: [name] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
```

#### File: `scripts/ens/roles.ts`
[UNVERIFIED] — master §4.1 grantRoles/revokeRoles — the kill switch
```typescript
// File: scripts/ens/roles.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { parseAbi } from 'viem';
import { publicClient, walletClient } from './client';

const registryAbi = parseAbi([
  'function grantRoles(uint256 tokenId,uint256 roleBitmap,address account)',
  'function revokeRoles(uint256 tokenId,uint256 roleBitmap,address account)',
]);

export async function grantRoles(registry: `0x${string}`, tokenId: bigint, bitmap: bigint, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: registry, abi: registryAbi, functionName: 'grantRoles', args: [tokenId, bitmap, account] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function revokeRoles(registry: `0x${string}`, tokenId: bigint, bitmap: bigint, account: `0x${string}`): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: registry, abi: registryAbi, functionName: 'revokeRoles', args: [tokenId, bitmap, account] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
```

#### File: `scripts/ens/revoke.ts`
[UNVERIFIED] — the two revocation modes (clear record OR revoke role). Both are one Sepolia tx.
```typescript
// File: scripts/ens/revoke.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { parseAbi, namehash } from 'viem';
import { publicClient, walletClient } from './client';
import { ENS, ROLE } from './addresses';
import { revokeRoles } from './roles';

const resolverAbi = parseAbi(['function setText(bytes32 node,string key,string value)']);

// Mode A: clear the policy text record (fastest kill; facilitator reads empty -> REVOKED).
export async function clearPolicy(name: string): Promise<`0x${string}`> {
  const wallet = walletClient();
  const hash = await wallet.writeContract({ address: ENS.PublicResolverV2, abi: resolverAbi, functionName: 'setText', args: [namehash(name), 'leash.policy', ''] });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// Mode B: revoke the SET_RESOLVER role (structural kill of write authority + spend).
export async function revokeAgent(registry: `0x${string}`, tokenId: bigint, agentAddress: `0x${string}`): Promise<`0x${string}`> {
  return revokeRoles(registry, tokenId, ROLE.SET_RESOLVER | ROLE.SET_SUBREGISTRY, agentAddress);
}
```

### Key Decisions
- `readPolicy` in `policy.ts` uses the SAME `namehash` + `PublicResolverV2.text` primitives as the facilitator's `ens-read.ts`, so the WS-1 read-back test exercises the real enforcement read path (PRD-W5).
- Two revocation modes: clearing the record is the fast demo kill; role revoke is the structural kill demoed for ENS depth.

---

## 6. Hedera Scripts (component 3)

### Purpose
Mint the own HTS USDC, associate it, create the HCS topic, fund agent accounts.

### Dependencies
`@hiero-ledger/sdk` 2.85.0 (NEVER @hashgraph/sdk), operator env.

### Code

#### File: `scripts/hedera/client.ts`
[VERIFIED] — master §4.2/§8 operator creds (live-verified)
```typescript
// File: scripts/hedera/client.ts
import { Client, PrivateKey, AccountId } from '@hiero-ledger/sdk';

export function hederaClient(): Client {
  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(process.env.HEDERA_OPERATOR_ID!),
    PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!),
  );
  return client;
}
```

#### File: `scripts/hedera/mint-usdc.ts`
[UNVERIFIED] — master §4.2 TokenCreateTransaction 6-dec; EVM facade via deterministic HIP-719 (no forbidden SDK method) (PRD-W3)
```typescript
// File: scripts/hedera/mint-usdc.ts
// WARNING: UNVERIFIED PATTERN — test immediately (confirm TokenCreateTransaction shape on @hiero-ledger/sdk 2.85.0).
// Mints own 6-decimal HTS USDC. The token has TWO identifiers: the HTS id (0.0.x, used natively by the
// facilitator transfer) AND an EVM-facade address (0x..., used by Privy's ERC-20 transfer calldata policy).
import { TokenCreateTransaction, TokenType, AccountId, PrivateKey } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

// HIP-719 deterministic EVM facade for an HTS token: 0x + the entity num as a 40-hex big-endian address.
// Derived WITHOUT any SDK accessor (avoids the forbidden @hashgraph toSolidityAddress()).
export function htsEvmAddress(tokenId: string): string {
  const num = tokenId.split('.').pop()!; // "0.0.1234" -> "1234"
  return '0x' + BigInt(num).toString(16).padStart(40, '0');
}

export async function mintUsdc(): Promise<{ tokenId: string; evmAddress: string }> {
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
  const tx = await new TokenCreateTransaction()
    .setTokenName('Leash Test USDC')
    .setTokenSymbol('USDC')
    .setDecimals(6)
    .setInitialSupply(1_000_000_000_000) // 1,000,000 USDC raw
    .setTreasuryAccountId(operatorId)
    .setTokenType(TokenType.FungibleCommon)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();
  const evmAddress = htsEvmAddress(tokenId); // deterministic HIP-719, no SDK accessor
  return { tokenId, evmAddress };
}
```

#### File: `scripts/hedera/associate.ts`
[UNVERIFIED] — master §4.2 TokenAssociateTransaction (else TOKEN_NOT_ASSOCIATED)
```typescript
// File: scripts/hedera/associate.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { TokenAssociateTransaction, AccountId, PrivateKey } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function associate(accountId: string, accountKey: string, tokenId: string): Promise<void> {
  const client = hederaClient();
  const tx = await new TokenAssociateTransaction()
    .setAccountId(AccountId.fromString(accountId))
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(accountKey));
  const resp = await tx.execute(client);
  await resp.getReceipt(client);
}
```

#### File: `scripts/hedera/hcs.ts`
[UNVERIFIED] — master §4.2 TopicCreateTransaction
```typescript
// File: scripts/hedera/hcs.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { TopicCreateTransaction } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function createTopic(): Promise<string> {
  const client = hederaClient();
  const resp = await new TopicCreateTransaction().setTopicMemo('leash-audit').execute(client);
  const receipt = await resp.getReceipt(client);
  return receipt.topicId!.toString();
}
```

#### File: `scripts/hedera/fund-agent.ts`
[UNVERIFIED] — operator HBAR transfer to give a new agent account gas presence
```typescript
// File: scripts/hedera/fund-agent.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
import { TransferTransaction, AccountId, Hbar } from '@hiero-ledger/sdk';
import { hederaClient } from './client';

export async function fundHbar(agentAccountId: string, hbar = 5): Promise<void> {
  const client = hederaClient();
  const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
  const tx = await new TransferTransaction()
    .addHbarTransfer(operatorId, new Hbar(-hbar))
    .addHbarTransfer(AccountId.fromString(agentAccountId), new Hbar(hbar))
    .execute(client);
  await tx.getReceipt(client);
}
```

### Key Decisions
- `mint-usdc.ts` returns BOTH the HTS id and the EVM-facade address (PRD-W3): the facilitator settles the native HTS transfer; Privy's funding policy gates the EVM-facade ERC-20 `transfer`.

---

## 7. Resource Server (component 5)

### Purpose
The live x402-gated service Hedera requires; points at OUR facilitator.

### Code

#### File: `resource-server/server.ts`
[UNVERIFIED] — master §4.2 paymentMiddlewareFromConfig + HttpFacilitatorClient
```typescript
// File: resource-server/server.ts
// WARNING: UNVERIFIED PATTERN — test immediately (confirm @x402/express 2.25 API at install).
import express from 'express';
import { paymentMiddlewareFromConfig, HttpFacilitatorClient } from '@x402/express';

const app = express();
const facilitatorClient = new HttpFacilitatorClient({ url: process.env.FACILITATOR_URL! });

// Demo endpoint price reconciled with narrated amounts (R-11): priced so a 3-USDC in-cap spend is a
// literal charge against a 5-USDC cap. DP-3 RESOLVE: confirm @x402/express price FORMAT against the pinned
// install — master §4.2 uses the dollar-string form '$0.10'; here we express the raw-unit charge. Use whichever
// the installed middleware parses (env PREMIUM_PRICE lets us switch without a code edit). The over-cap demo
// (50 USDC) is driven by the AGENT overriding its transfer amount, not by a second endpoint price.
const PREMIUM_PRICE = process.env.PREMIUM_PRICE ?? '$3.00';
app.use(
  paymentMiddlewareFromConfig(
    { 'GET /premium': { price: PREMIUM_PRICE, network: 'hedera:testnet', payTo: process.env.RECEIVER_ACCOUNT_ID! } },
    facilitatorClient,
  ),
);

app.get('/premium', (_req, res) => {
  res.json({ data: 'premium payload', ts: new Date().toISOString() });
});

const port = Number(process.env.RESOURCE_PORT ?? 8402);
app.listen(port, () => console.log(`resource-server on :${port}`));
```

### Key Decisions
- Price is expressed so narrated demo amounts are literal cap charges (R-11); the over-cap demo call requests 50 USDC against the same endpoint by overriding the payment amount in the agent client.

---

## 8. Agent Client (component 6)

### Purpose
Build + sign the native transfer via Privy custody, retry with the `X-PAYMENT` payload + `X-Leash-Agent` header.

### Code

#### File: `agent/pay.ts`
[UNVERIFIED] — master §3.5 step 3 / §4.2 gas-free mechanism (feePayer); Privy secp256k1Sign custody. WS-3/DP-3 confirms the exact signable-hash construction from @x402/hedera.
```typescript
// File: agent/pay.ts
// WARNING: UNVERIFIED PATTERN — test immediately.
// Builds a partially-signed native TransferTransaction (transactionId.accountId = feePayer, gas-free),
// signs the transfer HASH (not the raw body) via Privy secp256k1Sign (custody), and pays the x402 endpoint.
// WS-3/DP-3 RESOLVE: confirm the exact signable-hash the Hedera ECDSA scheme expects (from @x402/hedera's
// sign helper); the sha384 below is the placeholder preimage — do not assume it is final.
import { TransferTransaction, TransactionId, AccountId } from '@hiero-ledger/sdk';
import { createHederaClient } from '@x402/hedera';
import { PrivyClient } from '@privy-io/server-auth';
import { createHash } from 'crypto';

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

export interface PayArgs {
  endpoint: string;         // resource server /premium URL
  agentName: string;        // X-Leash-Agent (ENS name)
  agentWalletId: string;    // Privy wallet id (custody signer)
  agentAccountId: string;   // agent Hedera account
  feePayerAccountId: string;// facilitator account (from 402 extra.feePayer)
  receiverAccountId: string;// payTo
  tokenId: string;
  amountRaw: number;        // smallest unit (e.g. 3_000_000 in-cap; 50_000_000 over-cap demo)
}

export async function pay(args: PayArgs): Promise<Response> {
  const client = createHederaClient({ network: 'testnet' });
  const tx = new TransferTransaction()
    .setTransactionId(TransactionId.generate(AccountId.fromString(args.feePayerAccountId)))
    .addTokenTransfer(args.tokenId, AccountId.fromString(args.agentAccountId), -args.amountRaw)
    .addTokenTransfer(args.tokenId, AccountId.fromString(args.receiverAccountId), args.amountRaw)
    .freezeWith(client);

  const bodyBytes = tx.toBytes();
  // Sign the HASH of the body, not the body itself (secp256k1Sign expects a 32-byte digest). Placeholder
  // preimage = sha384(bodyBytes) truncated to 32 bytes; WS-3/DP-3 confirms the exact scheme preimage.
  const txHash = '0x' + createHash('sha384').update(bodyBytes).digest('hex').slice(0, 64);
  const { signature } = await privy.walletApi.ethereum.secp256k1Sign(args.agentWalletId, {
    params: { hash: txHash },
  });

  const paymentPayload = {
    payer: args.agentAccountId,
    amount: String(args.amountRaw),
    asset: args.tokenId,
    txBytes: Buffer.from(bodyBytes).toString('base64'),
    signature,
    // REPLAY key MUST be content-derived (INVARIANT #9): a replay has identical txBytes, so hash them.
    // A timestamp here would make every attempt unique and defeat the replay guard.
    paymentId: '0x' + createHash('sha256').update(bodyBytes).digest('hex'),
  };

  return fetch(args.endpoint, {
    headers: {
      'X-PAYMENT': Buffer.from(JSON.stringify(paymentPayload)).toString('base64'),
      'X-Leash-Agent': args.agentName,
    },
  });
}
```

### Key Decisions
- The agent signs ONLY the transfer via custody `secp256k1Sign`; the facilitator adds the feePayer signature (gas-free). Privy never policy-approves this payment (INVARIANT #6).

---

## 9. Treasury / Privy Layer (component 7)

### Purpose
Org treasury as a P-256-owner server wallet; funding policy (cap + allowlist); policy-gated funding; the leaked-key over-fund DENY.

### Code

#### File: `treasury/privy.ts`
[UNVERIFIED] — owner+auth-sig REQUIREMENT is [VERIFIED] live (§8/§10b, platformProbe, INVARIANT #5); the exact createWallet/createPolicy SDK argument SHAPES are [UNVERIFIED] against pinned ^1.32 — WS-0 smoke #1 (DP-0) confirms them
```typescript
// File: treasury/privy.ts
// The treasury wallet MUST have a P-256 owner and be driven via @privy-io/server-auth (INVARIANT #5).
// An owner-less/raw call fails OPEN (proven live 2026-09-12). No self-broadcast on this funding rail (D-10).
import { PrivyClient } from '@privy-io/server-auth';
import type { FundingRequest, FundingResult } from '../types';

const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

// Create the funding policy: ALLOW ERC-20 transfer where _to in [agents] AND _value <= fundingCap; default DENY.
export async function createFundingPolicy(agentEvmAddrs: string[], fundingCapRaw: string, usdcEvmAddress: string): Promise<string> {
  const policy = await privy.walletApi.createPolicy({
    version: '1.0',
    name: 'leash-treasury-funding',
    chain_type: 'ethereum',
    rules: [
      {
        name: 'allow-capped-agent-funding',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          { field_source: 'ethereum_calldata', field: 'transfer._to', abi: ERC20_TRANSFER_ABI, operator: 'in', value: agentEvmAddrs },
          { field_source: 'ethereum_calldata', field: 'transfer._value', abi: ERC20_TRANSFER_ABI, operator: 'lte', value: fundingCapRaw },
          { field_source: 'ethereum_transaction', field: 'to', operator: 'eq', value: usdcEvmAddress },
        ],
      },
    ],
    default_action: 'DENY', // DENY beats ALLOW; over-cap/off-allowlist funding is denied
  });
  return policy.id;
}

// Create the P-256-owner treasury wallet bound to the policy (INVARIANT #5: owner is mandatory).
// The owner REQUIREMENT is [VERIFIED] (owner-less fails open, proven live 2026-09-12). The exact createWallet
// owner ARGUMENT SHAPE below is [ASSUMED] — master §4.3 pins createWallet WITHOUT an owner field (its verified
// line predates the fail-open finding). WS-0 smoke #1 (DP-0) MUST confirm the real owner-binding arg name +
// casing against installed @privy-io/server-auth ^1.32 and prove an over-cap tx returns DENY BEFORE broadcast
// with an OWNED wallet — do NOT ship an owner-less wallet (that is the exact fail-open catastrophe).
export async function createTreasury(policyId: string, ownerPublicKey: string): Promise<string> {
  const wallet = await privy.walletApi.createWallet({
    chainType: 'ethereum',
    owner: { publicKey: ownerPublicKey }, // [ASSUMED shape — confirm at DP-0]; presence of an owner is MANDATORY
    policyIds: [policyId],
  });
  return wallet.id;
}

// Fund an agent (policy-gated). Returns FUNDING_DENIED when the policy denies (leaked-key over-fund beat).
export async function fundAgent(treasuryWalletId: string, req: FundingRequest, usdcEvmAddress: string): Promise<FundingResult> {
  const data = encodeErc20Transfer(req.agentAddress, req.amountRaw);
  try {
    const res = await privy.walletApi.ethereum.sendTransaction(treasuryWalletId, {
      caip2: 'eip155:296',
      params: { transaction: { to: usdcEvmAddress, value: '0x0', data, chain_id: 296 } },
    });
    return { funded: true, txHash: res.hash };
  } catch (e: any) {
    // Privy returns a policy-denial error before broadcast for an over-cap/off-allowlist transfer.
    if (isPolicyDenial(e)) return { denied: true, reason: 'FUNDING_DENIED' };
    throw e;
  }
}

// ---- helpers ----
const ERC20_TRANSFER_ABI = { type: 'function', name: 'transfer', inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }] };

function encodeErc20Transfer(to: string, valueRaw: string): string {
  // transfer(address,uint256) selector 0xa9059cbb + 32-byte to + 32-byte value
  const selector = 'a9059cbb';
  const addr = to.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  const val = BigInt(valueRaw).toString(16).padStart(64, '0');
  return '0x' + selector + addr + val;
}

// DP-0 RESOLVE: prefer Privy's typed error/status code for a policy denial; the string match is a FALLBACK.
// If ^1.32 exposes a structured denial (e.g. e.code / e.type / HTTP 403 with a policy reason), match THAT first
// so an over-fund never slips through as an unrecognized re-thrown 500 on the on-camera DENY beat.
function isPolicyDenial(e: any): boolean {
  const code = (e?.code ?? e?.type ?? '').toString().toLowerCase();
  if (code.includes('policy') || code.includes('denied') || e?.status === 403) return true;
  const msg = (e?.message ?? '').toLowerCase();
  return msg.includes('policy') && (msg.includes('deny') || msg.includes('denied') || msg.includes('not allowed'));
}
```

### Key Decisions
- `createTreasury` requires `owner.publicKey` — a wallet without it fails open (proven live). This is the structural lever for INVARIANT #5.
- No `secp256k1Sign` self-broadcast on this file — funding always goes through the owner-driven policy-gated `sendTransaction` (D-10).

### Verified / Unverified Status
Owner+auth-sig requirement [VERIFIED] live 2026-09-12; exact `createPolicy` rule schema [UNVERIFIED] against the pinned @privy-io/server-auth ^1.32 — WS-0 smoke #1 must re-prove DENY against the installed version.

---

## 10. Database (component 9 — index layer ONLY)

### Purpose
Per-user views, activity feed, metadata not on-chain. INVARIANT #3: the DB is NEVER read on any enforcement path.

### Code

#### File: `db/schema.ts`
[ASSUMED] — drizzle schema for the app/index layer
```typescript
// File: db/schema.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  privyUserId: text('privy_user_id').unique().notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orgs = pgTable('orgs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  ensName: text('ens_name').unique().notNull(), // <org>.<root>.eth
  registryAddress: text('registry_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => orgs.id).notNull(),
  ensName: text('ens_name').unique().notNull(), // data.<org>.<root>.eth
  maxPerCall: text('max_per_call').notNull(),    // raw smallest-unit
  allowedPayees: text('allowed_payees').notNull(), // JSON array string
  hederaAccount: text('hedera_account').notNull(),
  privyWalletId: text('privy_wallet_id').notNull(),
  status: text('status').notNull().default('active'), // active | revoked
  mintTx: text('mint_tx'),
  policyTx: text('policy_tx'),
});

export const spendEvents = pgTable('spend_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentName: text('agent_name').notNull(),
  decision: text('decision').notNull(), // ALLOW | DENY
  amount: text('amount').notNull(),
  payTo: text('pay_to').notNull(),
  reason: text('reason'),
  hcsSequence: integer('hcs_sequence').notNull(),
  ts: timestamp('ts').defaultNow().notNull(),
});
```

#### File: `db/client.ts`
[ASSUMED] — Neon pooled connection (DATABASE_URL live-verified)
```typescript
// File: db/client.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
export const db = drizzle(pool);
```

#### File: `db/index-hcs.ts`
[ASSUMED] — poll HCS via Mirror Node -> spend_events (index only, off the enforcement path)
```typescript
// File: db/index-hcs.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { db } from './client';
import { spendEvents } from './schema';
import type { LogEntry } from '../types';

const MIRROR = 'https://testnet.mirrornode.hedera.com';

// Poll the HCS topic messages and upsert into spend_events. Index layer ONLY — never gates a payment.
export async function indexTopic(topicId: string, sinceSeq = 0): Promise<number> {
  const res = await fetch(`${MIRROR}/api/v1/topics/${topicId}/messages?sequencenumber=gt:${sinceSeq}&limit=100`);
  const json = (await res.json()) as { messages: { sequence_number: number; message: string }[] };
  let last = sinceSeq;
  for (const m of json.messages) {
    const entry = JSON.parse(Buffer.from(m.message, 'base64').toString()) as LogEntry;
    await db.insert(spendEvents).values({
      agentName: entry.name, decision: entry.decision, amount: entry.amount,
      payTo: entry.payTo, reason: entry.reason ?? null, hcsSequence: m.sequence_number,
    });
    last = Math.max(last, m.sequence_number);
  }
  return last;
}
```

### Key Decisions
- The DB mirrors HCS for fast UI reads only. Enforcement always reads ENS live (INVARIANT #3).

---

## 11. Relayer (component 10)

### Purpose
Gas sponsor: the deployer key pays Sepolia gas for a connected user's ENS op, SCOPED to that user's own org subname (not an open relay).

### Code

#### File: `relayer/relay.ts`
[ASSUMED] — scoped relayer; only mints/sets/revokes under the caller's own verified org subname
```typescript
// File: relayer/relay.ts
// CAUTION: ASSUMED PATTERN — test immediately.
// Scoped gas sponsor: the op MUST target a name under the authenticated user's org subname.
import { mintSubname } from '../scripts/ens/subname';
import { setPolicy } from '../scripts/ens/policy';
import { clearPolicy } from '../scripts/ens/revoke';
import type { AgentPolicy } from '../types';

export type RelayOp =
  | { kind: 'mint'; registry: `0x${string}`; label: string; agentAddress: `0x${string}`; expires: bigint }
  | { kind: 'setPolicy'; name: string; policy: AgentPolicy }
  | { kind: 'revoke'; name: string };

// orgSubname = the authenticated user's org, e.g. "acme.<root>.eth". Every op's target name must end with it.
export async function relay(orgSubname: string, op: RelayOp): Promise<string> {
  const target = op.kind === 'mint' ? `${op.label}.${orgSubname}` : op.name;
  if (!target.endsWith(orgSubname)) throw new Error('scope violation: op outside caller org subname');
  switch (op.kind) {
    case 'mint': return (await mintSubname(op.registry, op.label, orgSubname, op.agentAddress, op.expires)).toString();
    case 'setPolicy': return await setPolicy(op.name, op.policy);
    case 'revoke': return await clearPolicy(op.name);
  }
}
```

### Key Decisions
- Scope check (`target.endsWith(orgSubname)`) prevents the deployer key from being an open relay (R-13 boundary).

---

## 12. Web Dashboard (component 8)

### Purpose
Two front doors: `/demo` (judge sandbox, server-orchestrated, scored, first) and `/app` (real console, Privy login, multi-tenant). Presentational polish is owned by the design phase (Skill-Ownership Map); these files are the functional spine.

### Dependencies
next, viem, @privy-io/react-auth; server routes import `scripts/ens/*`, `agent/pay`, `treasury/privy`, `db/*`.

### Code

#### File: `web/lib/config.ts`
[ASSUMED] — typed env access shared by routes
```typescript
// File: web/lib/config.ts
// CAUTION: ASSUMED PATTERN — test immediately.
export const config = {
  root: process.env.ENS_PARENT_NAME!,            // e.g. leash.eth (resolved WS-1)
  sandboxOrg: process.env.SANDBOX_ORG_NAME!,     // e.g. acme.leash.eth
  facilitatorUrl: process.env.FACILITATOR_URL!,
  resourceUrl: process.env.RESOURCE_URL!,
  usdcTokenId: process.env.USDC_TOKEN_ID!,
  usdcEvmAddress: process.env.USDC_EVM_ADDRESS!,
  treasuryWalletId: process.env.TREASURY_WALLET_ID!,
  sandboxRegistry: process.env.SANDBOX_REGISTRY as `0x${string}`,
};
```

#### File: `web/app/layout.tsx`
[ASSUMED] — root layout
```tsx
// File: web/app/layout.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
export const metadata = { title: 'LEASH', description: 'Your ENS name is your revocable spend policy' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### File: `web/app/page.tsx`
[ASSUMED] — landing: /demo + /app split
```tsx
// File: web/app/page.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
import Link from 'next/link';

export default function Landing() {
  return (
    <main>
      <h1>LEASH</h1>
      <p>Your ENS name is your revocable spend policy for a fleet of paying agents.</p>
      <nav>
        <Link href="/demo">Try the judge sandbox (no setup)</Link>
        <Link href="/app">Open the real console (sign in)</Link>
      </nav>
    </main>
  );
}
```

#### File: `web/app/api/demo/route.ts`
[ASSUMED] — sandbox orchestration: drives grant/spend/refuse/revoke/deny beats server-side (keys-off-host)
```typescript
// File: web/app/api/demo/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
// Judge-sandbox orchestration. Server-side pre-seeded keys (INVARIANT #10, keysOffHostDemoPath = /demo).
// Each beat is a REAL on-chain tx (INVARIANT: no fabricated state).
import { NextRequest, NextResponse } from 'next/server';
import { config } from '../../../lib/config';
import { pay } from '../../../../agent/pay';
import { clearPolicy } from '../../../../scripts/ens/revoke';
import { fundAgent } from '../../../../treasury/privy';

const AGENT = () => `data.${config.sandboxOrg}`; // data.acme.leash.eth

export async function POST(req: NextRequest) {
  const { beat } = (await req.json()) as { beat: 'spend' | 'refuse' | 'revoke' | 'deny' };
  switch (beat) {
    case 'spend': {
      const r = await pay({ endpoint: `${config.resourceUrl}/premium`, agentName: AGENT(), agentWalletId: process.env.SANDBOX_AGENT_WALLET_ID!, agentAccountId: process.env.SANDBOX_AGENT_ACCOUNT!, feePayerAccountId: process.env.HEDERA_OPERATOR_ID!, receiverAccountId: process.env.RECEIVER_ACCOUNT_ID!, tokenId: config.usdcTokenId, amountRaw: 3_000_000 });
      return NextResponse.json({ beat, ok: r.ok, status: r.status });
    }
    case 'refuse': {
      const r = await pay({ endpoint: `${config.resourceUrl}/premium`, agentName: AGENT(), agentWalletId: process.env.SANDBOX_AGENT_WALLET_ID!, agentAccountId: process.env.SANDBOX_AGENT_ACCOUNT!, feePayerAccountId: process.env.HEDERA_OPERATOR_ID!, receiverAccountId: process.env.RECEIVER_ACCOUNT_ID!, tokenId: config.usdcTokenId, amountRaw: 50_000_000 });
      return NextResponse.json({ beat, refused: !r.ok, status: r.status });
    }
    case 'revoke': {
      const tx = await clearPolicy(AGENT());
      return NextResponse.json({ beat, revokeTx: tx });
    }
    case 'deny': {
      const res = await fundAgent(config.treasuryWalletId, { agentAddress: process.env.SANDBOX_AGENT_EVM!, amountRaw: '999000000' }, config.usdcEvmAddress);
      return NextResponse.json({ beat, result: res });
    }
    default:
      return NextResponse.json({ error: 'unknown beat' }, { status: 400 });
  }
}
```

#### File: `web/app/api/agents/route.ts`
[ASSUMED] — real console: mint + setPolicy + DB record, relayer-sponsored
```typescript
// File: web/app/api/agents/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { NextRequest, NextResponse } from 'next/server';
import { relay } from '../../../../relayer/relay';
import { db } from '../../../../db/client';
import { agents } from '../../../../db/schema';
import type { AgentPolicy } from '../../../../types';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { orgId: string; orgSubname: string; registry: `0x${string}`; label: string; agentAddress: `0x${string}`; policy: AgentPolicy; privyWalletId: string };
  const expires = BigInt(Math.floor(Date.now() / 1000) + 31536000);
  const mintTx = await relay(body.orgSubname, { kind: 'mint', registry: body.registry, label: body.label, agentAddress: body.agentAddress, expires });
  const name = `data.${body.orgSubname}`;
  const policyTx = await relay(body.orgSubname, { kind: 'setPolicy', name, policy: body.policy });
  await db.insert(agents).values({
    orgId: body.orgId, ensName: name, maxPerCall: body.policy.maxPerCall,
    allowedPayees: JSON.stringify(body.policy.allowedPayees), hederaAccount: body.policy.hederaAccount,
    privyWalletId: body.privyWalletId, mintTx, policyTx,
  });
  return NextResponse.json({ name, mintTx, policyTx });
}
```

#### File: `web/app/api/revoke/route.ts`
[ASSUMED] — real+demo revoke (clear policy), scoped through the relayer
```typescript
// File: web/app/api/revoke/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { NextRequest, NextResponse } from 'next/server';
import { relay } from '../../../../relayer/relay';
import { db } from '../../../../db/client';
import { agents } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { orgSubname, name } = (await req.json()) as { orgSubname: string; name: string };
  const tx = await relay(orgSubname, { kind: 'revoke', name });
  await db.update(agents).set({ status: 'revoked' }).where(eq(agents.ensName, name));
  return NextResponse.json({ tx });
}
```

#### File: `web/app/api/pay/route.ts`
[ASSUMED] — trigger an agent payment (real console)
```typescript
// File: web/app/api/pay/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { NextRequest, NextResponse } from 'next/server';
import { pay } from '../../../../agent/pay';
import { config } from '../../../lib/config';

export async function POST(req: NextRequest) {
  const b = (await req.json()) as { agentName: string; agentWalletId: string; agentAccountId: string; agentEvm?: string; amountRaw: number; receiverAccountId: string };
  const r = await pay({ endpoint: `${config.resourceUrl}/premium`, agentName: b.agentName, agentWalletId: b.agentWalletId, agentAccountId: b.agentAccountId, feePayerAccountId: process.env.HEDERA_OPERATOR_ID!, receiverAccountId: b.receiverAccountId, tokenId: config.usdcTokenId, amountRaw: b.amountRaw });
  return NextResponse.json({ ok: r.ok, status: r.status });
}
```

#### File: `web/app/api/fund/route.ts`
[ASSUMED] — Privy policy-gated funding + leaked-key DENY surfacing
```typescript
// File: web/app/api/fund/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { NextRequest, NextResponse } from 'next/server';
import { fundAgent } from '../../../../treasury/privy';
import { config } from '../../../lib/config';

export async function POST(req: NextRequest) {
  const { agentAddress, amountRaw } = (await req.json()) as { agentAddress: string; amountRaw: string };
  const result = await fundAgent(config.treasuryWalletId, { agentAddress, amountRaw }, config.usdcEvmAddress);
  return NextResponse.json({ result });
}
```

#### File: `web/app/api/policy/[name]/route.ts`
[ASSUMED] — read live leash.policy for the UI (from ENS, not DB — matches enforcement source)
```typescript
// File: web/app/api/policy/[name]/route.ts
// CAUTION: ASSUMED PATTERN — test immediately.
import { NextRequest, NextResponse } from 'next/server';
import { readPolicy } from '../../../../../scripts/ens/policy';

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const policy = await readPolicy(decodeURIComponent(params.name));
  return NextResponse.json({ name: params.name, policy, revoked: policy === null });
}
```

#### File: `web/app/demo/page.tsx`
[ASSUMED] — judge sandbox hero flow UI (no import edge to /app — INVARIANT #10)
```tsx
// File: web/app/demo/page.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
'use client';
import { useState } from 'react';
import SplitScreen from '../../components/SplitScreen';

type BeatResult = Record<string, unknown> | null;

export default function DemoPage() {
  const [log, setLog] = useState<BeatResult[]>([]);
  async function beat(name: 'spend' | 'refuse' | 'revoke' | 'deny') {
    const r = await fetch('/api/demo', { method: 'POST', body: JSON.stringify({ beat: name }) });
    setLog((l) => [...l, await r.json()]);
  }
  return (
    <main>
      <h1>Judge sandbox — acme.leash.eth</h1>
      <SplitScreen />
      <div>
        <button onClick={() => beat('spend')}>1. Spend 3 USDC (in cap)</button>
        <button onClick={() => beat('refuse')}>2. Try 50 USDC (over cap)</button>
        <button onClick={() => beat('revoke')}>3. Revoke on-chain</button>
        <button onClick={() => beat('deny')}>4. Leaked-key over-fund (Privy DENY)</button>
      </div>
      <pre>{JSON.stringify(log, null, 2)}</pre>
    </main>
  );
}
```

#### File: `web/app/app/page.tsx`
[ASSUMED] — real console (Privy login + multi-tenant); depends on Privy dashboard toggle
```tsx
// File: web/app/app/page.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
'use client';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

function Console() {
  const { ready, authenticated, login, user } = usePrivy();
  if (!ready) return <p>Loading…</p>;
  if (!authenticated) return <button onClick={login}>Sign in with email or Google</button>;
  return (
    <div>
      <p>Signed in as {user?.email?.address ?? user?.id}</p>
      <p>Your org namespace is being provisioned under leash.eth (gas sponsored).</p>
    </div>
  );
}

export default function AppConsole() {
  return (
    <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!} config={{ loginMethods: ['email', 'google'] }}>
      <main>
        <h1>LEASH console</h1>
        <Console />
      </main>
    </PrivyProvider>
  );
}
```

#### File: `web/components/SplitScreen.tsx`
[ASSUMED] — A/B resolver-record | live-402 view (the negative-WOW legibility device, R-10)
```tsx
// File: web/components/SplitScreen.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
'use client';
import { useEffect, useState } from 'react';
import type { AgentPolicy } from '../../types';

export default function SplitScreen() {
  const [policy, setPolicy] = useState<AgentPolicy | null>(null);
  const [revoked, setRevoked] = useState(false);
  async function refresh() {
    const r = await fetch(`/api/policy/${encodeURIComponent(`data.${process.env.NEXT_PUBLIC_SANDBOX_ORG}`)}`);
    const j = await r.json();
    setPolicy(j.policy);
    setRevoked(j.revoked);
  }
  useEffect(() => { void refresh(); }, []);
  return (
    <section style={{ display: 'flex', gap: 16 }}>
      <div>
        <h3>ENS resolver record (leash.policy)</h3>
        <pre>{revoked ? 'REVOKED (empty)' : JSON.stringify(policy, null, 2)}</pre>
      </div>
      <div>
        <h3>Live 402 result</h3>
        <p>{revoked ? 'Next payment: FAILS CLOSED' : 'Next payment: settles if in-cap'}</p>
      </div>
      <button onClick={refresh}>refresh</button>
    </section>
  );
}
```

#### File: `web/components/AgentCard.tsx`
[ASSUMED] — per-agent cap + allowlist + status card
```tsx
// File: web/components/AgentCard.tsx
// CAUTION: ASSUMED PATTERN — test immediately.
import type { AgentPolicy } from '../../types';

export default function AgentCard({ name, policy, status }: { name: string; policy: AgentPolicy | null; status: string }) {
  return (
    <article>
      <h4>{name}</h4>
      {policy ? (
        <ul>
          <li>Cap: {policy.maxPerCall} (raw)</li>
          <li>Allowlist: {policy.allowedPayees.join(', ')}</li>
          <li>Hedera: {policy.hederaAccount}</li>
        </ul>
      ) : (
        <p>revoked</p>
      )}
      <span>status: {status}</span>
    </article>
  );
}
```

### Key Decisions
- `/demo` imports only `web/app/api/demo` + `SplitScreen` — NO import edge to `/app`'s Privy modules (INVARIANT #10 structural boundary).
- The policy read route (`api/policy/[name]`) reads ENS live, matching the enforcement source, so the UI can never show a stale/DB-derived policy on the demo path.

---

## 13. Orchestration Scripts

#### File: `scripts/setup.ts`
[UNVERIFIED] — one-time provisioning (2LD register, subregistry, roles, mint USDC, HCS topic); writes ids to .env
```typescript
// File: scripts/setup.ts
// WARNING: UNVERIFIED PATTERN — test immediately. Run LOCALLY (commit-reveal 60s wait).
import { register2LD } from './ens/register-2ld';
import { deploySubregistry } from './ens/subregistry';
import { mintUsdc } from './hedera/mint-usdc';
import { createTopic } from './hedera/hcs';
import { appendFileSync } from 'fs';

// NOTE: run this SERIALLY before seed-demo.ts. Both share the single deployer key/nonce + append to .env;
// never run them concurrently (Metric 9 parallel-safety: these two are step 9, strictly serial).
async function main() {
  const root = await register2LD('leash', ['leashorg', 'leashctl', 'leashfleet'], 'eth'); // free root under .eth
  const org = await register2LD('acme', ['acmeorg', 'acmefleet'], root.fullName);        // org under the root
  const registry = await deploySubregistry(org.tokenId); // real tokenId threaded from register2LD (BLOCKER-2 fix)
  const { tokenId, evmAddress } = await mintUsdc();
  const topic = await createTopic();
  appendFileSync('.env', `\nENS_PARENT_NAME=${root.fullName}\nSANDBOX_ORG_NAME=${org.fullName}\nSANDBOX_REGISTRY=${registry}\nUSDC_TOKEN_ID=${tokenId}\nUSDC_EVM_ADDRESS=${evmAddress}\nHCS_TOPIC_ID=${topic}\n`);
  console.log('setup complete:', { root: root.fullName, org: org.fullName, registry, tokenId, evmAddress, topic });
}
main().catch((e) => { console.error(e); process.exit(1); });
```

#### File: `scripts/seed-demo.ts`
[UNVERIFIED] — idempotent judge-sandbox seed (PRD §6 table); REAL state, not fabricated
```typescript
// File: scripts/seed-demo.ts
// WARNING: UNVERIFIED PATTERN — test immediately. Idempotent: safe to re-run.
import { mintSubname } from './ens/subname';
import { setPolicy, readPolicy } from './ens/policy';
import { associate } from './hedera/associate';
import { createFundingPolicy, createTreasury } from '../treasury/privy';
import { config } from '../web/lib/config';
import type { AgentPolicy } from '../types';

async function ensureAgent(label: string, agentAddress: `0x${string}`, policy: AgentPolicy) {
  const name = `${label}.${config.sandboxOrg}`;
  const existing = await readPolicy(name);
  if (existing) return name; // idempotent
  const expires = BigInt(Math.floor(Date.now() / 1000) + 31536000);
  await mintSubname(config.sandboxRegistry, label, config.sandboxOrg, agentAddress, expires);
  await setPolicy(name, policy);
  return name;
}

async function main() {
  const usdc = config.usdcTokenId;
  const agent1: AgentPolicy = { maxPerCall: '5000000', allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!], hederaAccount: process.env.SANDBOX_AGENT_ACCOUNT!, token: usdc };
  const agent2: AgentPolicy = { maxPerCall: '2000000', allowedPayees: [process.env.RECEIVER_ACCOUNT_ID!], hederaAccount: process.env.SANDBOX_AGENT2_ACCOUNT!, token: usdc };
  await ensureAgent('data', process.env.SANDBOX_AGENT_EVM as `0x${string}`, agent1);
  await ensureAgent('payments', process.env.SANDBOX_AGENT2_EVM as `0x${string}`, agent2);
  await associate(process.env.SANDBOX_AGENT_ACCOUNT!, process.env.SANDBOX_AGENT_KEY!, usdc);
  await associate(process.env.RECEIVER_ACCOUNT_ID!, process.env.RECEIVER_KEY!, usdc);
  const policyId = await createFundingPolicy([process.env.SANDBOX_AGENT_EVM!], '10000000', config.usdcEvmAddress);
  await createTreasury(policyId, process.env.TREASURY_OWNER_PUBKEY!);
  console.log('seed complete');
}
main().catch((e) => { console.error(e); process.exit(1); });
```

#### File: `scripts/verify-claims.ts`
[ASSUMED] — recompute headline numbers from committed data into evidence/ (VERIFY-BEFORE-CLAIMING)
```typescript
// File: scripts/verify-claims.ts
// CAUTION: ASSUMED PATTERN — test immediately.
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
```

---

## 14. Project Config Files

#### File: `package.json`
[ASSUMED] — pinned deps (SOURCE LOCK); scripts
```json
{
  "name": "leash",
  "private": true,
  "type": "module",
  "scripts": {
    "setup": "tsx scripts/setup.ts",
    "seed": "tsx scripts/seed-demo.ts",
    "verify:claims": "tsx scripts/verify-claims.ts",
    "facilitator": "tsx facilitator/server.ts",
    "resource": "tsx resource-server/server.ts",
    "dev": "next dev web",
    "build": "next build web",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@x402/core": "~2.25",
    "@x402/hedera": "2.25",
    "@x402/express": "~2.25",
    "@hiero-ledger/sdk": "2.85.0",
    "@hiero-ledger/proto": "2.31.0",
    "@privy-io/server-auth": "^1.32",
    "@privy-io/react-auth": "latest",
    "viem": "^2.56",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "express": "^4",
    "drizzle-orm": "latest",
    "pg": "^8"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "latest",
    "vitest": "latest",
    "@types/node": "latest",
    "@types/pg": "latest"
  }
}
```

#### File: `tsconfig.json`
[ASSUMED] — strict TS (INVARIANT #1 exhaustiveness relies on strict)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "jsx": "preserve",
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["types", "scripts", "facilitator", "resource-server", "agent", "treasury", "db", "relayer", "web"]
}
```

---

## N+1. Domain Knowledge File (build generates `DOMAIN-GUIDE.md`)

Build (#18) generates `DOMAIN-GUIDE.md` from this spec.
- **Key concepts (10-20):** ENSv2 hierarchical registry; EAC role bitmap; Permissioned Resolver; text record (`leash.policy`); UserRegistry / VerifiableFactory / subregistry; namehash; x402 exact scheme; facilitator `/verify` + `/settle` hooks; fee-payer (gas-free) mechanism; HTS token + association; HCS topic audit; native TransferTransaction; Privy P-256 owner + authorization-signature; policy engine (funding rail); custody `secp256k1Sign`; raw smallest-unit BigInt; binding (hederaAccount===payer); revocation (clear record / revokeRoles); dual-rail enforcement.
- **Rules/invariants:** the 10 NON-NEGOTIABLES in INVARIANTS.md verbatim.
- **Glossary (domain→code):** cap→`AgentPolicy.maxPerCall`; allowlist→`AgentPolicy.allowedPayees`; kill switch→`revoke.ts clearPolicy/revokeAgent`; the gate→`authorize.ts`; second rail→`treasury/privy.ts`.
- **Source mapping:** each concept cites master §3/§4 or this ARCHITECTURE section.

## N+2. Submission Directory Plan (created in package phase, not build)
```
submission/
  screenshots/   landing.png · demo-spend.png · demo-refuse.png · demo-revoke.png · privy-deny.png
  video/links.md (YouTube URL, 2-4min human-voice)
  proof.md       ENS names+Sepolia links · leash.policy contents · Hedera settle tx (HashScan) · HCS topic+seq · Privy DENY evidence · addresses
  links.md       live /demo URL · live /app URL · repo · facilitator URL
  sponsor-tracks.md  ENS/Hedera/Privy -> evidence mapping
```
Generation: `screenshots/` (demo phase), `proof.md` (build post-hero-run via `verify-claims.ts` + captured hashes), `links.md`/`sponsor-tracks.md` (package).

## N+3. Multi-Track Architecture (3 prizes, 3 distinct integration points)
| Track | Architectural component serving it | Integration depth (distinct, not a wrapper) | Judge proof |
|---|---|---|---|
| ENS ENSv2 $4,500 | `scripts/ens/*` + `facilitator/ens-read.ts` | 3-level hierarchy, EAC role grant/revoke, Permissioned Resolver text record READ as live settlement policy, reverse | mint→setText→read→revoke tx hashes; the record IS the policy |
| Hedera x402 $6,000 | `facilitator/*` + `resource-server` + `agent/pay` | native gas-free exact scheme (feePayer), own HTS USDC, HCS audit trail, ≥1 real paid request e2e | HashScan settle tx + HCS topic entries |
| Privy B2B $2,500 | `treasury/privy.ts` + `/app` login | P-256-owner org wallet + funding policy (cap+allowlist) + live leaked-key DENY + embedded-wallet login | `FUNDING_DENIED` on camera; policy id |

Primary depth = ENS (the load-bearing interlock). The three integration points are physically distinct directories (repo-layout discipline).

## N+4. Safety Architecture (tiered defenses)
- **Layer 1 — Input validation:** `authorize.ts` rejects malformed policy (`MALFORMED_POLICY`), binding mismatch, off-token; header is treated as untrusted (only names the record). Prevents spoofed/garbage-policy spend.
- **Layer 2 — Rate/replay limiting:** `seen` paymentId set + Hedera duplicate-tx rejection (`REPLAY`); funding aggregate bounded by `fundingCap`. Prevents replay + budget drain.
- **Layer 3 — Circuit breaker (fail-closed):** any ENS read throw → `RPC_ERROR` abort (no allow-on-error branch, INVARIANT #1). Prevents fail-open on RPC outage.
- **Layer 4 — Graceful degradation:** advisory pre-screen may use a 30s cache; the authoritative settle read never does, so degradation never weakens enforcement (INVARIANT #2/#3). DB outage degrades the UI feed only, never the gate.
Two+ independent layers, each tested in Testing Strategy.

## N+5. Agent Architecture (light — the "agent" is a paying client, not an autonomous LLM loop)
- **Self-correction:** on a 402 refusal the agent client surfaces the `reason` code; there is no blind retry loop (a retry of an over-cap payment is pointless and would be `REPLAY`-guarded). Bounded: one build + one pay attempt per call.
- **Worker isolation:** each `pay()` call is independent (its own paymentId); a failed payment does not affect others. Result validated by HTTP status + the facilitator's decision, not by the agent self-reporting success.

## N+6. Configuration Reference

### Environment Variables
| Variable | Description | Example | Required |
|---|---|---|---|
| PRIVY_APP_ID | Privy app id | cmtx… | yes |
| PRIVY_APP_SECRET | Privy app secret | (secret) | yes |
| NEXT_PUBLIC_PRIVY_APP_ID | Privy app id (client, real console) | cmtx… | real-path |
| HEDERA_OPERATOR_ID | facilitator fee-payer + minter | 0.0.10487802 | yes |
| HEDERA_OPERATOR_KEY | operator ECDSA hex | 0x… | yes |
| HEDERA_EVM_RPC | Hashio chain 296 | https://testnet.hashio.io/api | yes |
| SEPOLIA_RPC_URL | Alchemy Sepolia | https://… | yes |
| LEASH_DEPLOYER_KEY | ENS writes + relayer gas | 0x… | yes |
| LEASH_DEPLOYER_ADDRESS | deployer addr (funded) | 0x72A9…d5C5 | yes |
| DATABASE_URL | Neon Postgres pooled | postgres://… | yes |
| ENS_PARENT_NAME | root (resolved WS-1) | leash.eth | generated |
| SANDBOX_ORG_NAME | sandbox org | acme.leash.eth | generated |
| SANDBOX_REGISTRY | org UserRegistry addr | 0x… | generated |
| USDC_TOKEN_ID | own HTS token | 0.0.x | generated |
| USDC_EVM_ADDRESS | HTS EVM-facade | 0x… | generated |
| HCS_TOPIC_ID | audit topic | 0.0.x | generated |
| TREASURY_WALLET_ID | Privy treasury wallet | … | generated |
| TREASURY_OWNER_PUBKEY | P-256 owner pubkey | … | generated |
| FACILITATOR_URL / RESOURCE_URL | service URLs | https://… | deploy |
| RECEIVER_ACCOUNT_ID / RECEIVER_KEY | payee account | 0.0.x / 0x… | generated |
| SANDBOX_AGENT_ACCOUNT / _KEY / _EVM / _WALLET_ID | sandbox agent 1 | … | generated |
| SANDBOX_AGENT2_ACCOUNT / _EVM | sandbox agent 2 | … | generated |

### Credentials Needed
| Variable | Used By | Where to Obtain | Required Before |
|---|---|---|---|
| PRIVY_APP_ID/SECRET | treasury, agent, login | dashboard.privy.io | build |
| HEDERA_OPERATOR_* | facilitator, scripts | portal.hedera.com | build |
| SEPOLIA_RPC_URL | ENS scripts, facilitator | Alchemy | build |
| LEASH_DEPLOYER_KEY | ENS writes, relayer | generated + funded 0.05 ETH | build |
| DATABASE_URL | db | Neon | build (real path) |
| Privy Email/Google + allowed-origins toggle | /app login | Privy dashboard | deploy (real path only) |
| Sepolia top-up | provisioning+relayer | faucet | build (if 0.05 ETH insufficient) |

## N+7. Testing Strategy

### Test Files
| Test File | Tests | Command |
|---|---|---|
| `facilitator/authorize.test.ts` | all 7 GateReason branches + settle happy path + exhaustiveness | `vitest run authorize` |
| `facilitator/ens-read.test.ts` | 3-level read-back, empty→null, malformed→MALFORMED | `vitest run ens-read` |
| `treasury/privy.test.ts` | owner-policy DENY before broadcast (WS-0 smoke #1) | `vitest run privy` |
| `e2e/hero.test.ts` | grant→spend→refuse→revoke→deny e2e on testnet | `vitest run e2e` |

### Acceptance Criteria
| Feature | Criteria | Judge Priority |
|---|---|---|
| In-cap gas-free spend | agent pays 3 USDC; HashScan shows settle; agent paid no gas | HIGH |
| Over-cap refusal | 50 USDC returns 402 with reason `OVER_CAP` | HIGH |
| Revoke → fail-closed | after revoke tx, next 3-USDC call returns `REVOKED` | HIGH |
| Privy leaked-key DENY | over-`fundingCap` transfer returns `FUNDING_DENIED` before broadcast | HIGH |
| Binding anti-spoof | payer ≠ record.hederaAccount returns `BINDING_MISMATCH` | MED |
| RPC fail-closed | ENS read failure returns `RPC_ERROR`, never settles | MED |
| Sandbox isolation | `/demo` runs with `/app` disabled | MED |

### Test Scenarios (HIGH-priority)
#### In-cap spend
| Scenario | Input | Expected |
|---|---|---|
| Happy | amount 3_000_000, cap 5_000_000, allowlisted | settle; HashScan receipt |
| Boundary | amount == cap (5_000_000) | settle |
| Over | amount 5_000_001 | `OVER_CAP` |
#### Revoke
| Scenario | Input | Expected |
|---|---|---|
| Clear record | clearPolicy then pay in-cap | `REVOKED` |
| In-flight | revoke after verify, before settle | settle-time read → `REVOKED` (TOCTOU) |
#### Privy DENY
| Scenario | Input | Expected |
|---|---|---|
| Over-fund | amount > fundingCap | `FUNDING_DENIED` before broadcast |
| Owner-less (negative) | wallet without P-256 owner | build gate FAILS (forbidden by INVARIANT #5) |

### Security Invariants (debug writes a test for each — from INVARIANTS.md)
- [ ] No settle without an affirmative `{settle:true}` (grep: one guarded emit site)
- [ ] Settle-time read is no-cache (grep + integration TOCTOU test)
- [ ] Enforcement path imports no DB client (grep)
- [ ] Funding rail has no `secp256k1Sign` self-broadcast (grep)
- [ ] No `trustless`/`chain enforces` in README/UI copy (grep)
- [ ] Raw-unit BigInt compare; malformed → `MALFORMED_POLICY`

## N+8. Component Build Order
1. `types/index.ts` (no deps).
2. `facilitator/authorize.ts` + its unit test (pure; risk-first — the enforcement core, testable with zero infra).
3. **Parallel group A:** `scripts/ens/*` (WS-1, the day-eater, START HERE in wall-clock) ∥ `scripts/hedera/*` (WS-0/WS-2 scaffolding).
4. `facilitator/ens-read.ts` → `facilitator/hedera-scheme.ts` → `facilitator/hcs-log.ts` → `facilitator/server.ts` (WS-2).
5. `resource-server/server.ts` + `agent/pay.ts` (WS-3, e2e paid request).
6. `treasury/privy.ts` (WS-4; but WS-0 smoke #1 proves DENY FIRST).
7. **Parallel group B:** `db/*` ∥ `relayer/relay.ts`.
8. `web/*` — WS-5a `/demo` + `api/demo` FIRST (scored), then WS-5b `/app` + real routes.
9. `scripts/setup.ts` + `scripts/seed-demo.ts` + `scripts/verify-claims.ts`.

P1 (the three-prize hero) is deliverable after steps 1-6 + step 8's WS-5a alone — the real console (WS-5b) is P2. This matches PRD priority (sandbox-first).

## N+9. Deployment Sequence
| Step | Action | Command | Verify | depends-on |
|:--:|---|---|---|---|
| 1 | Run local setup (2LD, subregistry, USDC, HCS) | `npm run setup` | ids appended to `.env` | creds |
| 2 | Seed sandbox | `npm run seed` | `readPolicy(data.<org>)` non-null | step 1 |
| 3 | Deploy facilitator+resource → Render | `render deploy` | `curl $FACILITATOR_URL/health` 200 | step 1; env: HEDERA_*, SEPOLIA_RPC_URL, HCS_TOPIC_ID, USDC_*, RECEIVER_* |
| 4 | Deploy dashboard → Vercel (guard .env, R-14) | `vercel deploy --prod` | `/demo` renders live policy | step 3; env: all above + FACILITATOR_URL, RESOURCE_URL, TREASURY_WALLET_ID, SANDBOX_* |
| 5 | Run hero once, capture proof | `npm run verify:claims` | `evidence/claims-recomputed.json` written | step 4 |

Startup cmds: facilitator `tsx facilitator/server.ts` (health `/health`); resource `tsx resource-server/server.ts` (health `GET /premium` → 402); dashboard `next start`.

## N+10. Addresses & External References
### On-Chain Addresses (Sepolia ENSv2, pinned 2026-06-29)
| Item | Address |
|---|---|
| RootRegistry | 0x11b5bfbe9078d826b1edbdd1cfc12f5828d9f50c |
| ETHRegistry | 0x67b728a792e789a8978b30cf1b3b641f19354b43 |
| ETHRegistrar | 0xa4449a0dd2b83007553d9b1d28b583a46a805a30 |
| PublicResolverV2 | 0xd25f66dd4ff61486c2c5c1e6201a23576698d3df |
| PermissionedResolverImpl | 0x7e4b2d59938930168024201752ee5503df402303 |
| UserRegistryImpl | 0x840fa461059862ea466a711e8c98c8de732061c0 |
| VerifiableFactory | 0x118bc31a50d559f7015a8da26d54b3b030cdb70f |
| UniversalResolverV2 | 0x85edf8b6b7d4211e2b07aa687506b746357b92cf |
| UpgradableUniversalResolverProxy | 0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe |
| ReverseRegistrarAdapter | 0x94e64e29e25533f93ba0a430646ae42cb47bf8f3 |
| Deployer (funded 0.05 ETH) | 0x72A90a712b7a668bD215B3b70B3fEaBFA40dd5C5 |
### API Endpoints
| Service | URL | Auth |
|---|---|---|
| Hashio EVM (296) | https://testnet.hashio.io/api | none |
| Hedera Mirror | https://testnet.mirrornode.hedera.com | none |
| Alchemy Sepolia | $SEPOLIA_RPC_URL | key |
| Privy | SDK | app id+secret + P-256 auth-sig |
### Standards
| Standard | Used For |
|---|---|
| ENSv2 EAC + Permissioned Resolver | policy record + kill switch |
| x402 exact scheme (Hedera) | gas-free settlement |
| HTS / HCS | token + audit trail |

## N+11. Integration Map (wire reads this first)
| From | To | Protocol | Credential (env var) | Health Check | Priority |
|---|---|:--:|---|---|:--:|
| facilitator | Sepolia ENS | RPC eth_call | `SEPOLIA_RPC_URL` | `cast call PublicResolverV2 text(...)` | CRITICAL |
| facilitator | Hedera | native SDK | `HEDERA_OPERATOR_KEY` | operator balance via Mirror | CRITICAL |
| facilitator | HCS topic | native SDK | `HCS_TOPIC_ID` | Mirror `/topics/{id}/messages` | CRITICAL |
| resource-server | facilitator | HTTP | `FACILITATOR_URL` | `curl $FACILITATOR_URL/health` | CRITICAL |
| agent | Privy | HTTPS SDK | `PRIVY_APP_ID/SECRET` | `secp256k1Sign` smoke | CRITICAL |
| treasury | Privy (chain 296) | HTTPS SDK | `PRIVY_APP_ID/SECRET` | owner-policy DENY smoke | CRITICAL |
| ENS scripts/relayer | Sepolia | RPC eth_sendRawTx | `LEASH_DEPLOYER_KEY` | `cast balance 0x72A9…` | CRITICAL |
| db/index-hcs | Hedera Mirror | HTTP | none | Mirror reachable | STANDARD |
| web | db | pg | `DATABASE_URL` | `SELECT 1` | STANDARD |

## Security spec (for build's SECURITY.md)
Build fills `SECURITY.md` at C0 to this shape:
### Threat matrix
| Threat | Enforcement | File |
|---|---|---|
| Over-cap spend | BigInt cap compare → `OVER_CAP` | `facilitator/authorize.ts` |
| Off-allowlist payee | allowlist check → `OFF_ALLOWLIST` | `facilitator/authorize.ts` |
| Spend after revoke | settle-time no-cache read → `REVOKED` | `facilitator/ens-read.ts` + `server.ts` |
| In-flight revoke (TOCTOU) | authoritative onBeforeSettle read | `facilitator/server.ts` |
| Payer spoof | `hederaAccount===payer` + sig → `BINDING_MISMATCH` | `facilitator/authorize.ts` |
| RPC outage fail-open | outer catch → `RPC_ERROR` | `facilitator/server.ts` |
| Replay | paymentId `seen` + Hedera dup-tx → `REPLAY` | `facilitator/authorize.ts` + `server.ts` |
| Over-fund treasury | P-256-owner Privy policy → `FUNDING_DENIED` | `treasury/privy.ts` |
| Malformed policy | parse guard → `MALFORMED_POLICY` | `facilitator/authorize.ts` |
### Not defended against (honest scope)
- An agent paying via a DIFFERENT facilitator or a direct native transfer (enforcement covers the org's own facilitator + funding rail; the org-wide kill is funding + revocation, not interception of every transfer).
- 30s staleness on the advisory pre-screen (disclosed; settle-time read is immediate).
- Process-memory replay set is not durable across facilitator restarts (demo scope; production → DB/Redis).
- Deployer key compromise (single relayer key; scoped, testnet-only).

## Performance Budgets
| Component | Metric | Budget | Test |
|---|---|:--:|---|
| `/demo` first paint | FCP | < 2000ms | Lighthouse |
| policy read route | p95 | < 1500ms (Sepolia eth_call) | curl timing |
| facilitator decide | p95 (excl. Hedera submit) | < 1500ms | log timing |
| gas: N/A (no custom Solidity) | — | — | — |

## Build-Resolve Seams (DP-0..DP-4 — PLAN carries each as a decision tree)
These are the on-chain/SDK shapes forge could NOT verify (verification is build work). Each is a copyable placeholder marked in-code; PLAN gives each a decision tree so build resolves it BEFORE it becomes load-bearing. Do not treat any as trusted until resolved.

| Seam | Where | Resolve at | What must be confirmed | Fallback |
|---|---|---|---|---|
| DP-0 | `treasury/privy.ts` createWallet owner arg + createPolicy rule schema | WS-0 smoke #1 | exact owner-binding arg name/casing on @privy-io/server-auth ^1.32; prove over-cap → DENY before broadcast on an OWNED wallet; typed denial error | if owner arg unknown: escalate (INVARIANT #5 cannot ship owner-less) |
| DP-1 | `scripts/ens/register-2ld.ts` registrar ABI + `tokenIdOf` scheme | WS-1 (first) | deployed ETHRegistrar makeCommitment/register real signature; whether registry keys by namehash vs labelhash | clone `contracts-v2` and read the real ABI/deployment JSON |
| DP-2 | `facilitator/server.ts` `toCtx` hook-context fields (`payload.paymentId/payer/amount`, `requirements.payTo/asset`) | WS-2 | real @x402/core hook context shape; that a stable per-payment id exists (else derive from txBytes hash as in agent/pay.ts) | derive paymentId from txBytes hash on the facilitator side too |
| DP-3 | `agent/pay.ts` signable-hash preimage + `resource-server` price format | WS-3 | exact Hedera ECDSA signable hash (from @x402/hedera helper); @x402/express price format ($-string vs raw) | use the @x402/hedera sign helper directly; switch price via env PREMIUM_PRICE |
| DP-4 | payer-signature verification is wired to GATE settle (INVARIANT #8 second half) | WS-2 | `createHederaVerifyPayerSignature` actually runs and blocks settle on a bad payer sig, not just the record check | add an explicit verify call in onBeforeSettle before authorize if the scheme does not gate it |

