// File: facilitator/hedera-scheme.ts
// [DEV-011 APPLIED] The ARCHITECTURE snapshot imported createHederaSignAndSubmitTransaction /
// createHederaVerifyPayerSignature / createHederaClient from '@x402/hedera/exact/facilitator' and passed
// them to `new ExactHederaScheme({ client, signAndSubmit, verifyPayerSignature })`. Verified against the
// pinned install (@x402/hedera 2.25): the helper factories are exported from the PACKAGE ROOT '@x402/hedera',
// and ExactHederaScheme's real constructor is `new ExactHederaScheme(signer: FacilitatorHederaSigner)`.
// The signer is assembled via toFacilitatorHederaSigner({...}) - the exact canonical pattern in the
// x402-foundation reference facilitator (e2e/facilitators/typescript/index.ts). Same package stack Blocky402
// wraps; this is the Blocky402-equivalent self-hosted facilitator (see server.ts E-1 note).
//
// verifyPayerSignature is called UNCONDITIONALLY by ExactHederaScheme.verify() (it cannot be silently
// skipped - see FacilitatorHederaSigner docs). This is what enforces INVARIANT #8's payer-signature binding
// at verify-time, BEFORE any settle. DP-4: the payer-sig gate ships out-of-the-box via the scheme.
import {
  AccountId,
  Client,
  PrivateKey,
  createHederaClient,
  createHederaSignAndSubmitTransaction,
  createHederaVerifyPayerSignature,
  createHederaPreflightTransfer,
  toFacilitatorHederaSigner,
} from '@x402/hedera';
import { ExactHederaScheme } from '@x402/hedera/exact/facilitator';

// The CAIP-2 network this facilitator settles on.
export const HEDERA_NETWORK = 'hedera:testnet';

// Build a fee-payer-configured SDK client for a given CAIP-2 network. The facilitator operator is the
// fee payer (gas-free for the agent: the agent only partially signs the transfer).
function buildClient(operatorId: string, operatorKey: PrivateKey): (network: string) => Client {
  return (network: string): Client => {
    const client = createHederaClient(network, process.env.HEDERA_EVM_RPC);
    client.setOperator(AccountId.fromString(operatorId), operatorKey);
    return client;
  };
}

// The single Hedera scheme wired into the x402Facilitator. Operator credentials come from .env.
export function hederaScheme(): ExactHederaScheme {
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_OPERATOR_KEY!);
  const build = buildClient(operatorId, operatorKey);

  const signer = toFacilitatorHederaSigner({
    getAddresses: () => [operatorId],
    // Adds the fee-payer signature and submits, waiting for a SUCCESS receipt (throws otherwise).
    signAndSubmitTransaction: createHederaSignAndSubmitTransaction(build, operatorKey),
    // Mirror-Node payer-signature check - called unconditionally by verify() (INVARIANT #8 binding).
    verifyPayerSignature: createHederaVerifyPayerSignature(),
    // Pre-settlement balance / association check - called unconditionally by verify().
    preflightTransfer: createHederaPreflightTransfer(),
  });

  return new ExactHederaScheme(signer);
}
