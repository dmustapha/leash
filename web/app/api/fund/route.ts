// File: web/app/api/fund/route.ts
// Privy policy-gated funding + the leaked-key DENY beat (Task 4.1). Thin wrapper over the proven
// treasury/privy fundAgent (WS-0/DP-0): an in-cap transfer returns { funded, txHash }; an over-cap transfer
// returns { denied: true, reason: 'FUNDING_DENIED' } from Privy's policy BEFORE broadcast. No self-broadcast
// on this rail (INVARIANT #6 / D-10) - the treasury wallet is P-256-owner-driven inside fundAgent.
import { NextRequest, NextResponse } from 'next/server';
import { fundAgent } from '../../../../treasury/privy';
import { config } from '../../../lib/config';

export async function POST(req: NextRequest) {
  const { agentAddress, amountRaw } = (await req.json()) as { agentAddress: string; amountRaw: string };
  const result = await fundAgent(config.treasuryWalletId, { agentAddress, amountRaw }, config.usdcEvmAddress);
  return NextResponse.json({ result });
}
