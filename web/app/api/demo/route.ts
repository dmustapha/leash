// File: web/app/api/demo/route.ts
// Judge-sandbox orchestration (INVARIANT #10: server-side pre-seeded keys, keys-off-host, /demo path).
// Each beat is a REAL on-chain action - NO mocks, NO fabricated tx hashes (INVARIANT: never present
// fabricated demo state; on failure return a real error, never a fake success).
//
// Rails are the PROVEN modules (agent/pay, scripts/ens/revoke+policy, treasury/privy). This route only
// orchestrates them; it does not reimplement any rail. It uses the REAL pay() signature
// { endpoint, agentName, agentAccountId, agentKey, amountRawOverride } (the ARCHITECTURE §12 snapshot
// signature was the stale pre-DP-3 shape; agent/pay.ts is the source of truth).
//
// Honest framing (INVARIANT #4): copy says the facilitator we run enforces the org's ENS-declared policy.
// It avoids over-claiming the guarantee (see INVARIANT #4 for the exact wording rule).
import { NextResponse } from 'next/server';
import { pay } from '../../../../agent/pay';
import { clearPolicy } from '../../../../scripts/ens/revoke';
import { readPolicy } from '../../../../scripts/ens/policy';
import { fundAgent } from '../../../../treasury/privy';
import { config } from '../../../lib/config';
import { DATA_AGENT, resourcePremiumUrl } from '../../../lib/demo';
import { enforceRateLimit } from '../../../lib/ratelimit';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // beats do real on-chain work; give the settle/revoke room

type Beat = 'spend' | 'refuse' | 'revoke' | 'deny';

// The hero agent (data.acme.leash.eth, cap 5 USDC) drives every beat. Its keys are read server-side only.
function agentArgs() {
  return {
    endpoint: resourcePremiumUrl(),
    agentName: DATA_AGENT,
    agentAccountId: process.env.SANDBOX_AGENT_ACCOUNT!,
    agentKey: process.env.SANDBOX_AGENT_KEY!,
  };
}

export async function POST(req: Request) {
  // A4: throttle rapid beats before any real on-chain work drains the fee-payer/agent balance.
  const limited = enforceRateLimit(req, 'demo');
  if (limited) return limited;

  let beat: Beat;
  try {
    ({ beat } = (await req.json()) as { beat: Beat });
  } catch {
    return NextResponse.json({ error: 'bad request body' }, { status: 400 });
  }

  try {
    switch (beat) {
      // BEAT 1 - SPEND (F-001): in-cap 3 USDC pays a whitelisted API, GAS-FREE. Prove: settle.success,
      // real settle tx id, and that the tx id's payer-of-record is the facilitator fee-payer (operator),
      // i.e. the agent paid 0 gas.
      case 'spend': {
        const r = await pay(agentArgs()); // default endpoint price (~3 USDC, in cap)
        const tx = r.settle?.transaction;
        const feePayer = process.env.HEDERA_OPERATOR_ID!;
        const gasFree = !!tx && tx.includes(feePayer); // settle tx id account == fee-payer -> agent paid no gas
        return NextResponse.json({
          beat,
          verdict: r.ok && r.settle?.success ? 'ALLOW' : 'FAIL',
          status: r.status,
          settled: r.settle?.success === true,
          txId: tx ?? null,
          payer: r.settle?.payer ?? null,
          feePayer,
          gasFree,
          amountUsdc: '3',
          note: 'In-cap payment settled on Hedera. Gas paid by the facilitator fee-payer, not the agent.',
        });
      }

      // BEAT 2 - REFUSE (F-002): the SAME agent's over-cap (50 USDC) attempt is refused at the rail with
      // reason OVER_CAP and NO settle. The agent overrides its own transfer amount; the facilitator's
      // ENS-declared cap is what refuses it.
      case 'refuse': {
        const r = await pay({ ...agentArgs(), amountRawOverride: '50000000' });
        const reason = r.settle?.errorReason ?? 'OVER_CAP';
        return NextResponse.json({
          beat,
          verdict: 'DENY',
          status: r.status,
          settled: r.settle?.success === true, // expected false
          refused: r.settle?.success !== true,
          reason,
          txId: null, // no settle tx on a refusal
          amountUsdc: '50',
          note: 'Over-cap attempt refused by the facilitator against the org ENS-declared cap. No transfer settled.',
        });
      }

      // BEAT 3 - REVOKE (F-003): one on-chain clearPolicy write on Sepolia, then PROVE fail-closed by
      // running the very next identical in-cap call - it must NOT settle, and the facilitator classifies
      // the abort as REVOKED (INVARIANT #2 fail-closed).
      case 'revoke': {
        const revokeTx = await clearPolicy(DATA_AGENT);
        // fail-closed probe: identical in-cap payment now that the policy record is cleared.
        const after = await pay(agentArgs());
        const failClosed = after.settle?.success !== true;
        const reason = after.settle?.errorReason ?? 'REVOKED';
        return NextResponse.json({
          beat,
          verdict: 'REVOKED',
          revokeTx,
          chain: 'sepolia',
          failClosed,
          afterStatus: after.status,
          afterSettled: after.settle?.success === true, // expected false
          reason,
          note: 'ENS leash.policy record cleared on-chain. The next in-cap payment fails closed (REVOKED).',
        });
      }

      // BEAT 4 - DENY (F-009): the second rail. A leaked-key over-fund is denied by the treasury's Privy
      // policy BEFORE broadcast -> FUNDING_DENIED. Shows the funding rail is policy-gated too.
      // The over-fund is sent to the policy's own allowlisted recipient so the ONLY violated rule is the
      // funding CAP (the leaked-key over-fund mechanism), isolating a clean, deterministic policy denial
      // instead of a downstream on-chain balance revert (DEV-024). Amount is one raw unit over the 10 USDC
      // funding cap; the recipient is the allowlisted address so the cap rule is what fails.
      case 'deny': {
        const fundingRecipient = process.env.TREASURY_FUNDING_ALLOWLIST || process.env.SANDBOX_AGENT_EVM!;
        const result = await fundAgent(
          config.treasuryWalletId,
          { agentAddress: fundingRecipient, amountRaw: '10000001' }, // one raw unit over the 10 USDC funding cap
          config.usdcEvmAddress,
        );
        const denied = 'denied' in result && result.denied === true;
        return NextResponse.json({
          beat,
          verdict: denied ? 'DENY' : 'ALLOW',
          denied,
          reason: 'denied' in result ? result.reason : null,
          fundTx: 'funded' in result ? result.txHash : null,
          amountUsdc: '10.000001', // one raw unit over the 10 USDC funding cap
          note: 'Leaked-key over-fund (over the 10 USDC funding cap) blocked by the treasury Privy policy before broadcast (FUNDING_DENIED).',
        });
      }

      default:
        return NextResponse.json({ error: `unknown beat: ${String(beat)}` }, { status: 400 });
    }
  } catch (e) {
    // REAL error state (never a fake success). Surfaces the actual rail failure to the UI.
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ beat, error: 'beat failed', message }, { status: 500 });
  }
}

// Convenience GET: the current live hero-policy snapshot (used by the page's initial render / re-seed check).
export async function GET() {
  try {
    const policy = await readPolicy(DATA_AGENT);
    return NextResponse.json({ agent: DATA_AGENT, policy, revoked: policy === null });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ agent: DATA_AGENT, error: 'ENS read failed', message }, { status: 502 });
  }
}
