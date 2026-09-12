// File: web/lib/config.ts
// Typed env access shared by routes and scripts.
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
