// File: web/lib/config.ts
// Typed env access shared by routes and scripts.
export const config = {
  root: process.env.ENS_PARENT_NAME!,            // e.g. leash.eth (resolved WS-1)
  sandboxOrg: process.env.SANDBOX_ORG_NAME!,     // e.g. acme.leash.eth
  facilitatorUrl: process.env.FACILITATOR_URL!,
  resourceUrl: process.env.RESOURCE_URL!,
  usdcTokenId: process.env.USDC_TOKEN_ID!,
  // Funding-rail target for the Privy policy (DEV-019, supersedes DEV-018): the REAL USDC HTS EVM facade
  // (USDC_EVM_ADDRESS). The treasury Privy wallet is HTS-associated with the real token and holds real USDC,
  // so Privy's pre-broadcast simulation of the ERC-20 transfer no longer precheck-reverts: in-cap ALLOWs a
  // REAL on-chain USDC transfer, over-cap returns a REAL policy_violation on the real asset. No phantom facade.
  usdcEvmAddress: process.env.USDC_EVM_ADDRESS!,
  treasuryWalletId: process.env.TREASURY_WALLET_ID!,
  sandboxRegistry: process.env.SANDBOX_REGISTRY as `0x${string}`,
  // REFRAME [SKILL] (per REFRAME-SCOPE §4-S1/config) — env-pinned trust boundary additions.
  // SR-1: config reads ONLY LEASH's own co-sign authority key (leashCosignerKey) — NEVER the agent's private
  // key (COSIGN_AGENT_KEY). erc8004Registry is used only by scripts/ens/erc8004.ts for the ADVISORY on-chain
  // resolve; the facilitator enforcement path never reads agent.* (INVARIANT #13).
  leashCosignerKey: process.env.LEASH_COSIGNER_KEY!, // raw Hedera ECDSA authority key; asserted !== HEDERA_OPERATOR_KEY at process start
  erc8004Registry: (process.env.ERC8004_REGISTRY_ADDRESS ?? '0x8004A818BFB912233c491871b3d84c89A494BD9e') as `0x${string}`,
};
