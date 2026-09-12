// File: treasury/privy.ts
// The treasury wallet MUST have a P-256 owner and be driven via @privy-io/server-auth (INVARIANT #5).
// An owner-less/raw call fails OPEN (proven live 2026-09-12). No self-broadcast on this funding rail (D-10).
import { PrivyClient } from '@privy-io/server-auth';
import type { FundingRequest, FundingResult } from '../types';

// The authorizationPrivateKey drives owned wallets (INVARIANT #5): without it, wallet RPC on an owned
// wallet fails. DP-0 confirmed this is required for the P-256-owner treasury against @privy-io/server-auth ^1.32.
const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!, {
  walletApi: { authorizationPrivateKey: process.env.PRIVY_AUTHORIZATION_KEY },
});

// Create the funding policy: ALLOW ERC-20 transfer where _to in [agents] AND _value <= fundingCap; default DENY.
export async function createFundingPolicy(agentEvmAddrs: string[], fundingCapRaw: string, usdcEvmAddress: string): Promise<string> {
  // DP-0 VERIFIED against ^1.32: createPolicy uses camelCase `chainType` + condition `fieldSource`; there is NO
  // top-level `default_action` (the ARCHITECTURE snake_case + default_action shape is pre-^1.32). Privy evaluates
  // rules as default-DENY: the single ALLOW rule below only fires when _to is in-allowlist AND _value <= cap AND
  // the tx targets the USDC contract; anything else (over-cap / off-allowlist) falls through to the implicit DENY.
  const policy = await privy.walletApi.createPolicy({
    version: '1.0',
    name: 'leash-treasury-funding',
    chainType: 'ethereum',
    rules: [
      {
        name: 'allow-capped-agent-funding',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          { fieldSource: 'ethereum_calldata', field: 'transfer._to', abi: ERC20_TRANSFER_ABI, operator: 'in', value: agentEvmAddrs },
          { fieldSource: 'ethereum_calldata', field: 'transfer._value', abi: ERC20_TRANSFER_ABI, operator: 'lte', value: fundingCapRaw },
          { fieldSource: 'ethereum_transaction', field: 'to', operator: 'eq', value: usdcEvmAddress },
        ],
      },
    ],
  });
  return policy.id;
}

// Create the P-256-owner treasury wallet bound to the policy (INVARIANT #5: owner is mandatory).
// The owner REQUIREMENT is [VERIFIED] (owner-less fails open, proven live 2026-09-12). The exact createWallet
// owner ARGUMENT SHAPE below is [ASSUMED] - master §4.3 pins createWallet WITHOUT an owner field (its verified
// line predates the fail-open finding). WS-0 smoke #1 (DP-0) MUST confirm the real owner-binding arg name +
// casing against installed @privy-io/server-auth ^1.32 and prove an over-cap tx returns DENY BEFORE broadcast
// with an OWNED wallet - do NOT ship an owner-less wallet (that is the exact fail-open catastrophe).
export async function createTreasury(policyId: string, ownerPublicKey: string): Promise<string> {
  // DP-0 VERIFIED against @privy-io/server-auth ^1.32: createWallet accepts { chainType, owner: { publicKey }, policyIds }.
  const wallet = await privy.walletApi.createWallet({
    chainType: 'ethereum',
    owner: { publicKey: ownerPublicKey }, // presence of an owner is MANDATORY (INVARIANT #5)
    policyIds: [policyId],
  });
  return wallet.id;
}

// Fund an agent (policy-gated). Returns FUNDING_DENIED when the policy denies (leaked-key over-fund beat).
export async function fundAgent(treasuryWalletId: string, req: FundingRequest, usdcEvmAddress: string): Promise<FundingResult> {
  const data = encodeErc20Transfer(req.agentAddress, req.amountRaw) as `0x${string}`;
  try {
    // DP-0 VERIFIED shape (^1.32): ethereum.sendTransaction({ walletId, caip2, transaction: { to, value, data, chainId } }).
    const res = await privy.walletApi.ethereum.sendTransaction({
      walletId: treasuryWalletId,
      caip2: 'eip155:296',
      transaction: { to: usdcEvmAddress as `0x${string}`, value: '0x0', data, chainId: 296 },
    });
    return { funded: true, txHash: res.hash };
  } catch (e: any) {
    // Privy returns a policy-denial error before broadcast for an over-cap/off-allowlist transfer.
    if (isPolicyDenial(e)) return { denied: true, reason: 'FUNDING_DENIED' };
    throw e;
  }
}

// ---- helpers ----
// DP-0 VERIFIED (^1.32): the policy condition `abi` must be a full ABI ARRAY, not a single function object.
const ERC20_TRANSFER_ABI = [{ type: 'function', name: 'transfer', inputs: [{ name: '_to', type: 'address' }, { name: '_value', type: 'uint256' }] }];

export function encodeErc20Transfer(to: string, valueRaw: string): string {
  // transfer(address,uint256) selector 0xa9059cbb + 32-byte to + 32-byte value
  const selector = 'a9059cbb';
  const addr = to.replace(/^0x/, '').toLowerCase().padStart(64, '0');
  const val = BigInt(valueRaw).toString(16).padStart(64, '0');
  return '0x' + selector + addr + val;
}

// DP-0 RESOLVE: prefer Privy's typed error/status code for a policy denial; the string match is a FALLBACK.
// If ^1.32 exposes a structured denial (e.g. e.code / e.type / HTTP 403 with a policy reason), match THAT first
// so an over-fund never slips through as an unrecognized re-thrown 500 on the on-camera DENY beat.
export function isPolicyDenial(e: any): boolean {
  // DP-0 VERIFIED (^1.32): a policy denial surfaces as `e.type === 'policy_violation'` with HTTP 400 and the
  // message "RPC request denied due to policy violation". Match the typed field FIRST so an over-fund never
  // slips through as an unrecognized re-thrown error on the on-camera DENY beat.
  const type = (e?.type ?? e?.code ?? '').toString().toLowerCase();
  if (type === 'policy_violation' || type.includes('policy') || type.includes('denied') || e?.status === 403) return true;
  const msg = (e?.message ?? '').toLowerCase();
  return msg.includes('policy') && (msg.includes('violation') || msg.includes('deny') || msg.includes('denied') || msg.includes('not allowed'));
}
