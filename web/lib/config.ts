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
};
