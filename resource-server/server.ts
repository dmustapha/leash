// File: resource-server/server.ts
// [DP-3 RESOLVED] The live x402-gated service (the endpoint Hedera x402 requires) pointing at OUR
// facilitator. It registers the Hedera EXACT SERVER scheme so paymentMiddleware can build proper
// PaymentRequirements, and an HTTPFacilitatorClient so the 402 challenge carries the facilitator's
// extra.feePayer (the gas-free mechanism: the agent partially-signs; the facilitator fee-payer pays gas).
//
// API-shape corrections vs the pre-install ARCHITECTURE snapshot (verified against @x402/express 2.25):
//   - the class is HTTPFacilitatorClient (capital HTTP), constructed with { url }.
//   - paymentMiddlewareFromConfig(routes, facilitatorClients, schemes) - the SERVER scheme is passed in
//     the `schemes` arg as { network, server }, NOT auto-discovered.
//   - a RouteConfig uses `accepts: PaymentOption[]` ({ scheme, payTo, price, network }), NOT a flat
//     { price, network, payTo }. feePayer is NOT set here - it is injected from the facilitator's
//     getSupported().extra at 402-build time (enhancePaymentRequirements).
//
// Price format (DP-3): expressed as an AssetAmount ({ asset, amount }) in RAW smallest units so a narrated
// 3 USDC in-cap spend is a literal 3_000_000-unit charge against the 5 USDC ENS cap (R-11), with NO
// dollar-string -> decimals ambiguity. PREMIUM_PRICE env can override to a dollar-string if needed.
import express from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { paymentMiddleware } from '@x402/express';
import type { RoutesConfig } from '@x402/core/server';
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactHederaScheme as ExactHederaServerScheme } from '@x402/hedera/exact/server';
import { HEDERA_TESTNET_CAIP2 } from '@x402/hedera';

const HEDERA_NETWORK = HEDERA_TESTNET_CAIP2; // 'hedera:testnet'

// [DP-2 HTTP-path fix] The x402 HTTPFacilitatorClient does NOT forward arbitrary per-request headers to
// the facilitator - it only supports a createAuthHeaders() hook, invoked once per verify/settle call. The
// X-Leash-Agent header (the ENS record selector) therefore does not survive the resource-server ->
// facilitator hop on its own. We capture it per request in AsyncLocalStorage (set by an upstream
// middleware) and feed it back through createAuthHeaders so every verify/settle carries X-Leash-Agent to
// the facilitator's AsyncLocalStorage-backed hooks. The header stays UNTRUSTED (INVARIANT #8: it only
// names the record; binding is enforced by hederaAccount === payer inside the gate).
const agentNameStore = new AsyncLocalStorage<string>();

// Price: raw-unit AssetAmount by default (3 USDC = "3000000" of the HTS token). Env override allowed.
function premiumPrice(): { asset: string; amount: string } | string {
  const override = process.env.PREMIUM_PRICE;
  if (override) return override; // e.g. '$3.00' - falls to the money parser
  return { asset: process.env.USDC_TOKEN_ID!, amount: '3000000' };
}

const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL ?? 'http://localhost:8401',
  // Per-call header injection: reads the current request's X-Leash-Agent from AsyncLocalStorage so the
  // facilitator hooks can select the ENS record. Applied to verify + settle (supported has no agent).
  createAuthHeaders: async () => {
    const name = agentNameStore.getStore() ?? '';
    const headers = { 'X-Leash-Agent': name };
    return { verify: headers, settle: headers };
  },
});

// The resource server needs the Hedera exact SERVER scheme so it can parse the price + enhance
// requirements with the facilitator's feePayer extra.
const server = new x402ResourceServer(facilitatorClient).register(HEDERA_NETWORK, new ExactHederaServerScheme());

const routes: RoutesConfig = {
  'GET /premium': {
    accepts: [
      {
        scheme: 'exact',
        network: HEDERA_NETWORK,
        payTo: process.env.RECEIVER_ACCOUNT_ID!,
        price: premiumPrice(),
      },
    ],
    description: 'Leash premium data endpoint (x402-gated, gas-free via facilitator fee-payer)',
  },
};

const app = express();
// Capture X-Leash-Agent per request FIRST, so the payment middleware's facilitator verify/settle calls
// (and their createAuthHeaders) run inside this request's AsyncLocalStorage context.
app.use((req, _res, next) => {
  const h = req.headers['x-leash-agent'];
  const name = (Array.isArray(h) ? h[0] : h) ?? '';
  agentNameStore.run(name, () => next());
});
// syncFacilitatorOnStart = true so the middleware fetches getSupported() (feePayer extra) before serving.
app.use(paymentMiddleware(routes, server, undefined, undefined, true));

app.get('/premium', (_req, res) => {
  res.json({ data: 'premium payload', ts: new Date().toISOString() });
});

const port = Number(process.env.RESOURCE_PORT ?? process.env.PORT ?? 8402);
app.listen(port, () => {
  console.log(`[leash-resource] x402-gated /premium on :${port}`);
  console.log(`[leash-resource] facilitator: ${process.env.FACILITATOR_URL ?? 'http://localhost:8401'}`);
  console.log(`[leash-resource] payTo=${process.env.RECEIVER_ACCOUNT_ID} price=${JSON.stringify(premiumPrice())}`);
});
