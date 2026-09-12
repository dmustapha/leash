// File: facilitator/server.ts
// [E-1 RESULT: self-hosted @x402/core + @x402/hedera facilitator - the Blocky402-EQUIVALENT path.]
// Blocky402 is a hosted product built on this exact package stack (@x402/core + @x402/hedera) exposing the
// official onBeforeVerify/onBeforeSettle hooks. Its source was not publicly forkable within the E-1 time box
// (github.com/x402-foundation/x402 carries the SDK + the canonical reference facilitator, not the Blocky402
// app; blockydevs/blocky402 is not a public repo). Per the E-1 fallback: we self-host a @x402/core +
// @x402/hedera facilitator using the SAME official hooks - protocol-identical to Blocky402, and the ENS gate
// still runs in onBeforeSettle PRE-settlement. Wiring mirrors x402-foundation/x402
// e2e/facilitators/typescript/index.ts (register + verify/settle express routes). No second non-ENS path.
//
// This file is the I/O adapter around the PURE gate (facilitator/authorize.ts). It owns the single guarded
// SDK-proceed emit and every external read/write, encoding:
//   INVARIANT #1 fail-closed  - proceed is emitted ONLY inside `if ('settle' in d)` (DEV-010 narrowing).
//   INVARIANT #2 TOCTOU-closed - onBeforeSettle re-reads the policy live (readPolicyNoCache), no cache.
//   INVARIANT #3 no-DB path    - the enforcement path imports NO database layer; the advisory cache is
//                                process-memory only, and the settle read is a live on-chain call.
import express, { type Request, type Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { x402Facilitator } from '@x402/core/facilitator';
import type { PaymentPayload, PaymentRequirements } from '@x402/core/types';
import { authorize } from './authorize';
import { readPolicyCached, readPolicyNoCache } from './ens-read';
import { hederaScheme, HEDERA_NETWORK } from './hedera-scheme';
import { logDecision } from './hcs-log';
import { toCtx, type HederaHookContext } from './decode-ctx';
import { isSeen, markSeen } from '../db/replay';
import { rollingTotals, mirrorConsensusNow } from './spend-rollup';
import type { PaymentContext, GateDecision, AgentPolicy } from '../types';

// Rolling windows: a day = 86400s, a week = 604800s (REFRAME [SKILL] D3). Rolling = "lagging N seconds",
// bounded by the mirror consensus clock, not a calendar boundary.
const DAY_SECONDS = 86_400;
const WEEK_SECONDS = 604_800;

// Replay guard for settled paymentIds. In-memory Set = fast path within a process; db/replay = DURABLE backing
// so a replay is rejected across a facilitator restart (INVARIANT #9, WS-7 A5). NOTE: this is the ONLY DB the
// enforcement adapter touches, and ONLY for dedup - the AUTHORIZATION decision still reads ENS live via the
// pure gate authorize.ts, which imports no DB (INVARIANT #3). A store error fails CLOSED (deny), never proceed.
const seen = new Set<string>();

// ---- agentName threading (DP-2) ----
// The x402 hook context carries NO headers. The X-Leash-Agent header (the ENS record selector) is captured
// per-request in the express route and read inside the hook via this AsyncLocalStorage.
const agentNameStore = new AsyncLocalStorage<string>();
function currentAgentName(): string {
  return agentNameStore.getStore() ?? '';
}

// Resolve policy for a read variant, mapping an RPC throw -> RPC_ERROR (INVARIANT #1 fail-closed) and a
// malformed record -> MALFORMED_POLICY; otherwise hand the policy to the pure gate.
// Exported so the TOCTOU / binding integration tests can drive the EXACT settle-gate decision path with a
// real decoded ctx + the real no-cache ENS read (INVARIANT #2), asserting the pre-submit decision.
export async function decide(
  ctx: PaymentContext,
  read: (n: string) => Promise<AgentPolicy | null | 'MALFORMED'>,
): Promise<GateDecision> {
  let policy: AgentPolicy | null | 'MALFORMED';
  try {
    policy = await read(ctx.agentName);
  } catch {
    return { abort: true, reason: 'RPC_ERROR' }; // read failure fails closed
  }
  if (policy === 'MALFORMED') return { abort: true, reason: 'MALFORMED_POLICY' };
  return authorize(policy, ctx, seen);
}

// REFRAME [SKILL] D3 — does a policy declare any dynamic limit (window and/or rolling cap)?
function declaresDynamicLimits(policy: AgentPolicy): boolean {
  return (
    policy.dailyCap !== undefined ||
    policy.weeklyCap !== undefined ||
    (policy.allowedWindows !== undefined && policy.allowedWindows.length > 0)
  );
}

// REFRAME [SKILL] D3 — enrich the settle ctx with the dynamic-limit inputs the pure gate needs, derived
// from the mirror CONSENSUS clock + the HCS topic (never the host clock, never the Neon index). Called ONLY
// when the policy declares a window and/or a rolling cap. Any mirror fetch/parse THROW propagates to the
// caller (fail-closed -> RPC_ERROR): a mirror-down settle must DENY, never silently un-cap (REF-4). The
// per-call maxPerCall check in authorize.ts stays the HARD bound regardless.
async function enrichForDynamicLimits(ctx: PaymentContext, policy: AgentPolicy): Promise<PaymentContext> {
  const topicId = process.env.HCS_TOPIC_ID;
  if (!topicId) throw new Error('HCS_TOPIC_ID not set: cannot evaluate dynamic limits'); // fail closed
  let next = ctx;

  // Read the mirror CONSENSUS clock ONCE and reuse it for BOTH the window check and the rolling-cap lookback
  // width (a single mirror round-trip per capped/windowed settle instead of two; the consensus instant is the
  // same for both). THROWS -> RPC_ERROR upstream. The window uses minuteUtc/dayUtc; the rolling width anchors to
  // epochSeconds — the mirror CONSENSUS instant, NOT the host clock. (DEV-D01 fix / adversarial-review MAJOR:
  // a host clock AHEAD of consensus would make Date.now()-86400 a LATER instant than true consensus_now-86400,
  // narrowing the lookback and UNDER-counting recent spend — a silent un-cap. Anchoring both to the one consensus
  // epoch removes that skew.)
  const consensus = await mirrorConsensusNow(topicId); // THROWS -> RPC_ERROR upstream

  // Window: settle-time minute-of-day + day-of-week from the consensus clock.
  if (policy.allowedWindows && policy.allowedWindows.length > 0) {
    next = { ...next, nowMinuteUtc: consensus.minuteUtc, nowDayUtc: consensus.dayUtc };
  }

  // Rolling caps: sum ALLOW amounts for this agent over the rolling day/week (SOFT budget, lagging index).
  if (policy.dailyCap !== undefined || policy.weeklyCap !== undefined) {
    const { dailyRaw, weeklyRaw } = await rollingTotals(ctx.agentName, topicId, {
      dailyFromSeconds: consensus.epochSeconds - DAY_SECONDS,
      weeklyFromSeconds: consensus.epochSeconds - WEEK_SECONDS,
    }); // THROWS -> RPC_ERROR upstream (NEVER defaulted to 0 — that would un-cap)
    next = { ...next, rollingDailyRaw: dailyRaw, rollingWeeklyRaw: weeklyRaw };
  }
  return next;
}

// Translate a GateDecision to the SDK hook contract (void proceed | {abort, reason}).
// [DEV-010] Narrow with `'settle' in d` (the abort variant has no `settle` key -> `d.settle === true`
// does not compile under strict against the GateDecision union). SDK-proceed (return undefined) is emitted
// ONLY inside this affirmative guard (INVARIANT #1).
function toHook(d: GateDecision): void | { abort: true; reason: string } {
  if ('settle' in d) return; // proceed - the ONLY affirmative path
  return { abort: true, reason: d.reason };
}

// Build the PaymentContext, failing closed to RPC_ERROR if the payload is structurally undecodable.
function safeCtx(hookCtx: HederaHookContext): PaymentContext | null {
  try {
    return toCtx(hookCtx, currentAgentName());
  } catch {
    return null;
  }
}

export const facilitator = new x402Facilitator()
  .register(HEDERA_NETWORK, hederaScheme())
  // Advisory pre-screen (30s cache OK). ALLOW here is NOT authoritative (INVARIANT #3).
  .onBeforeVerify(async (hookCtx) => {
    const ctx = safeCtx(hookCtx as unknown as HederaHookContext);
    if (!ctx) return { abort: true, reason: 'RPC_ERROR' };
    const d = await decide(ctx, readPolicyCached);
    if (!('settle' in d)) {
      await logDecision({
        name: ctx.agentName, decision: 'DENY', amount: ctx.amount.toString(),
        payTo: ctx.payTo, reason: d.reason, ts: new Date().toISOString(),
      });
    }
    return toHook(d);
  })
  // AUTHORITATIVE decision - NO cache. This gates settle and closes TOCTOU (INVARIANT #2).
  .onBeforeSettle(async (hookCtx) => {
    const ctx = safeCtx(hookCtx as unknown as HederaHookContext);
    if (!ctx) return { abort: true, reason: 'RPC_ERROR' };

    // [WS-7 A5] Durable replay PRE-check. A store error fails CLOSED (deny) - a DB outage must NEVER be read as
    // "not seen, proceed". Seed the in-memory set so the pure gate returns REPLAY for a durably-seen id.
    try {
      if (await isSeen(ctx.paymentId)) seen.add(ctx.paymentId);
    } catch {
      await logDecision({
        name: ctx.agentName, decision: 'DENY', amount: ctx.amount.toString(),
        payTo: ctx.payTo, reason: 'REPLAY', ts: new Date().toISOString(),
      });
      return { abort: true, reason: 'REPLAY' }; // fail closed on replay-store error
    }

    // AUTHORITATIVE policy read (NO cache, INVARIANT #2). Read ONCE here so the settle site can enrich ctx
    // with dynamic-limit inputs (REFRAME D3) and know whether a cap is declared (blocking-audit decision).
    let policy: AgentPolicy | null | 'MALFORMED';
    try {
      policy = await readPolicyNoCache(ctx.agentName);
    } catch {
      return { abort: true, reason: 'RPC_ERROR' }; // ENS read failure fails closed
    }

    // REFRAME [SKILL] D3 — a declared cap makes the ALLOW audit BLOCKING (fail-closed) below, so a dropped
    // ALLOW log can never silently un-cap the next settle (the rolling total reads the topic).
    const capDeclared =
      policy !== null && policy !== 'MALFORMED' &&
      (policy.dailyCap !== undefined || policy.weeklyCap !== undefined);

    let d: GateDecision;
    if (policy === 'MALFORMED') {
      d = { abort: true, reason: 'MALFORMED_POLICY' };
    } else if (policy === null) {
      d = authorize(null, ctx, seen); // REVOKED
    } else {
      // Enrich ctx from the mirror consensus clock + spend-rollup ONLY when the policy declares a dynamic
      // limit. A mirror fetch/parse THROW here fails CLOSED as RPC_ERROR (REF-4: mirror-down must DENY).
      let settleCtx = ctx;
      if (declaresDynamicLimits(policy)) {
        try {
          settleCtx = await enrichForDynamicLimits(ctx, policy);
        } catch {
          return { abort: true, reason: 'RPC_ERROR' }; // spend-rollup / consensus-now throw -> deny
        }
      }
      d = authorize(policy, settleCtx, seen);
    }
    const allow = 'settle' in d;

    // [WS-7 A5] On an authorized settle, persist the paymentId DURABLY BEFORE proceeding (before the Hedera
    // submit is treated as consumed). A persist error fails CLOSED (do not proceed); Hedera DUPLICATE_TRANSACTION
    // is the on-chain backstop.
    if (allow) {
      let claimed: boolean;
      try {
        claimed = await markSeen(ctx.paymentId); // atomic claim: true = we won, false = already settled (race/replay)
      } catch {
        await logDecision({
          name: ctx.agentName, decision: 'DENY', amount: ctx.amount.toString(),
          payTo: ctx.payTo, reason: 'REPLAY', ts: new Date().toISOString(),
        });
        return { abort: true, reason: 'REPLAY' }; // fail closed on store error
      }
      if (!claimed) {
        await logDecision({
          name: ctx.agentName, decision: 'DENY', amount: ctx.amount.toString(),
          payTo: ctx.payTo, reason: 'REPLAY', ts: new Date().toISOString(),
        });
        return { abort: true, reason: 'REPLAY' }; // lost the concurrent race -> do not double-settle
      }
      seen.add(ctx.paymentId);
    }

    const reason = allow ? undefined : (d as Extract<GateDecision, { abort: true }>).reason;
    const auditEntry = {
      name: ctx.agentName, decision: (allow ? 'ALLOW' : 'DENY') as 'ALLOW' | 'DENY',
      amount: ctx.amount.toString(), payTo: ctx.payTo, ts: new Date().toISOString(),
    };

    // REFRAME [SKILL] D3 — when a rolling cap is declared, the ALLOW audit write becomes BLOCKING/fail-closed:
    // the rolling total is read back FROM this topic, so a dropped ALLOW log would silently un-cap the NEXT
    // settle. We await the log and DENY (RPC_ERROR) if it fails, so the cap can never be under-counted by a
    // lost write. When NO cap is declared, keep the existing fire-and-forget audit (don't regress /demo latency).
    if (allow && capDeclared) {
      try {
        await logDecision({ ...auditEntry, reason });
      } catch (e) {
        console.error('[hcs-log] blocking capped-ALLOW audit failed -> deny (fail-closed):', e);
        return { abort: true, reason: 'RPC_ERROR' }; // a lost capped-ALLOW log must not un-cap the next settle
      }
      return toHook(d);
    }

    // Audit log is fire-and-forget: an HCS latency spike / transient error must NEVER fail the settle it audits.
    void logDecision({ ...auditEntry, reason })
      .catch((e) => console.error('[hcs-log] settle-path audit log failed (non-fatal):', e));
    return toHook(d);
  });

// Exhaustiveness guard (INVARIANT #1): a future GateReason with no branch is a COMPILE ERROR here, not a
// runtime demo failure. `'settle' in d` narrows to the abort variant in the switch (DEV-010).
function _assertNever(x: never): never { throw new Error('unhandled GateReason: ' + String(x)); }
export function _exhaustive(d: GateDecision): void {
  if ('settle' in d) return;
  switch (d.reason) {
    case 'OVER_CAP':
    case 'OFF_ALLOWLIST':
    case 'REVOKED':
    case 'BINDING_MISMATCH':
    case 'MALFORMED_POLICY':
    case 'REPLAY':
    case 'RPC_ERROR':
    // REFRAME [SKILL] D1 — dynamic-limit reasons (a missing case is a COMPILE error, INVARIANT #1).
    case 'OVER_DAILY_CAP':
    case 'OVER_WEEKLY_CAP':
    case 'OUTSIDE_WINDOW':
      return;
    default:
      return _assertNever(d.reason);
  }
}

// ---- self-hosted facilitator HTTP surface (the endpoints HttpFacilitatorClient calls) ----
// Each route captures X-Leash-Agent into the AsyncLocalStorage for the duration of verify/settle so the
// hooks can read the ENS record selector (DP-2).
const app = express();
app.use(express.json({ limit: '1mb' }));

function agentHeader(req: Request): string {
  const h = req.headers['x-leash-agent'];
  return (Array.isArray(h) ? h[0] : h) ?? '';
}

app.post('/verify', async (req: Request, res: Response) => {
  const { paymentPayload, paymentRequirements } = req.body as {
    paymentPayload: PaymentPayload; paymentRequirements: PaymentRequirements;
  };
  if (!paymentPayload || !paymentRequirements) {
    return res.status(400).json({ error: 'Missing paymentPayload or paymentRequirements' });
  }
  try {
    const result = await agentNameStore.run(agentHeader(req), () =>
      facilitator.verify(paymentPayload, paymentRequirements),
    );
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/settle', async (req: Request, res: Response) => {
  const { paymentPayload, paymentRequirements } = req.body as {
    paymentPayload: PaymentPayload; paymentRequirements: PaymentRequirements;
  };
  if (!paymentPayload || !paymentRequirements) {
    return res.status(400).json({ error: 'Missing paymentPayload or paymentRequirements' });
  }
  try {
    const result = await agentNameStore.run(agentHeader(req), () =>
      facilitator.settle(paymentPayload, paymentRequirements),
    );
    return res.json(result);
  } catch (error) {
    // A hook abort surfaces as a thrown "Settlement aborted: <reason>"; return it as a SettleResponse.
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('aborted')) {
      return res.json({ success: false, errorReason: msg.replace(/^.*aborted:\s*/i, ''), network: HEDERA_NETWORK });
    }
    return res.status(500).json({ error: msg });
  }
});

app.get('/supported', (_req: Request, res: Response) => res.json(facilitator.getSupported()));
app.get('/healthz', (_req: Request, res: Response) => res.json({ ok: true }));

// Start only when run directly (not when imported by a test). DP-2: the first request logs the REAL hook
// context so the decoded field shape is observable.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.FACILITATOR_PORT ?? 8401);
  app.listen(port, () => {
    console.log(`[leash-facilitator] self-hosted @x402/core+@x402/hedera (Blocky402-equivalent) on :${port}`);
    console.log(`[leash-facilitator] scheme registered: exact @ ${HEDERA_NETWORK}`);
    console.log(`[leash-facilitator] getSupported() = ${JSON.stringify(facilitator.getSupported())}`);
  });
}

export { app };
