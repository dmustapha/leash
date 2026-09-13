# LEASH: Judge Path

**Date:** 2026-09-13
**Audience:** judges evaluating LEASH, and the downstream skills (livetest, demo, package) that must exercise both test paths.

LEASH has two ways to see it work. The first needs no setup and is the one judges use. The second binds a real external agent and proves the same controls against live rails.

Honesty framing carried throughout: enforcement is facilitator-trusted (the facilitator we run reads the org's ENS-declared policy and decides whether to co-sign). The chain stores the policy and the revocation. Identity is on-chain-resolved, not "verified". Rolling caps are a SOFT budget. Privy is an independent funding-only rail. LEASH binds existing agents. Control = TRUE, Independence = TRUE, Trustlessness = FALSE.

---

## Path 1: Judge sandbox (no login, no wallet, no ETH)

Open `/demo`. Nothing to install, connect, or fund. The sandbox is a guided, plain-language 5-step walkthrough backed by the real `/api/demo` beats, a seeded agent, and real on-chain transactions. Behavior is FROZEN; only the presentation was redesigned.

| Step | What the judge sees | What it proves |
|------|--------------------|----------------|
| 1. Meet the agent | The seeded agent, its ENS-declared policy, its co-owned account | ENS policy read (the org's `leash.policy` record is the source of truth the facilitator reads) |
| 2. Pays in-limit | An in-cap payment settles: "Paid" | Hedera gas-free settle (fee-payer charged, agent holds 0 HBAR) via the self-hosted x402/Hedera facilitator |
| 3. Overspends | An over-cap payment is refused: "Blocked, over the limit" (`OVER_CAP`, no settle) | Over-cap refuse: the agent overrides its own transfer amount, the facilitator refuses to co-sign, nothing settles |
| 4. Cut off | The policy is revoked on-chain, then the next in-cap payment fails closed: "Revoked" (`REVOKED`) | One-write revoke, fail-closed: clearing the ENS `leash.policy` record on-chain stops the next payment (INVARIANT #2) |
| 5. Leaked-key over-fund denied | A leaked-key over-fund attempt is blocked before broadcast: "Blocked" (`FUNDING_DENIED`) | Privy over-fund DENY: the second rail. An over-fund past the funding cap is denied by the treasury Privy policy before broadcast |

Throughout, the HCS audit trail records each verdict (ALLOW / DENY) to the Hedera Consensus Service topic, so every outcome is independently checkable on-chain.

Judges should be able to complete all five steps with zero setup.

---

## Path 2: Normal user path (Privy console + SOLV-001)

This path proves the same controls against a REAL external agent, driven from the product console.

### The external agent: SOLV-001

- Repo: `github.com/dmustapha/solv-001` (public, active). Local: `~/hackathon-toolkit/active/solv-001`.
- What it is: an autonomous AI agent that earns USDC via Circle nanopayments, reasons over its treasury with Claude, and pays expenses on Arc testnet.
- Identity: a Circle developer-controlled wallet EVM address (`CIRCLE_WALLET_ADDRESS`) that the owner controls (Circle API key + entity secret + wallet id), so we can drive its activity and verify integrations end to end.

### Required unblock steps (do these first)

1. **Privy dashboard config (owner, gates this path).** Privy "Allowed Origins" gates which web origin can load the Privy SDK. The appId is baked in (`NEXT_PUBLIC_PRIVY_APP_ID` present) but if the loading origin is not allowlisted the SDK never becomes ready and `login()` is a no-op. For the LIVE app sign-in to work, only the LIVE origins are required: `https://leash.ink`, `https://www.leash.ink`, `https://leash-ens.vercel.app`. `http://localhost:3100` is OPTIONAL and only needed for LOCAL testing; it has no effect on the live app. In dashboard.privy.io: add the live origins (plus localhost only if you test locally); enable Email + Google login; enable embedded Ethereum wallets; confirm `PRIVY_AUTHORIZATION_KEY` + `TREASURY_WALLET_ID` are set for the funding rail.
2. **Chain seam to reconcile.** SOLV-001 natively pays on Arc (Circle). LEASH governs a Hedera x402 spending account. Binding SOLV-001 binds its identity to a NEW LEASH-provisioned Hedera co-owned account; the governed payments run on LEASH's Hedera rail, not on Arc. Wire/livetest must reconcile this seam.

### The flow

1. Open `/app`, connect via Privy (Email or Google), provision the org.
2. Bind SOLV-001's EVM identity (register-existing / externalEvm). Identity is on-chain-resolved. LEASH provisions a 2-of-2 co-owned Hedera spending account and writes the ENS policy.
3. Prove the controls against real rails:
   - In-cap pay settles (Hedera gas-free).
   - Over-cap pay is refused (`OVER_CAP`, no settle).
   - Revoke the policy on-chain, then the next in-cap pay fails closed (`REVOKED`).
   - Leaked-key over-fund is denied by the Privy funding rail before broadcast (`FUNDING_DENIED`).
4. Each verdict is recorded to the HCS audit topic.

### What each control proves (both paths)

| Control | Integration proven |
|---------|--------------------|
| Policy read | ENS `leash.policy` record is the org's declared policy the facilitator reads |
| In-cap pay | Hedera gas-free settle via the self-hosted x402/Hedera facilitator (fee-payer charged, agent 0 HBAR) |
| Over-cap refuse | facilitator declines to co-sign an over-cap transfer; nothing settles |
| Revoke | one-write on-chain revoke; next payment fails closed (INVARIANT #2) |
| Over-fund DENY | independent Privy funding rail blocks the over-fund before broadcast |
| Audit | HCS topic records ALLOW / DENY verdicts on-chain |

---

## Notes for downstream skills

- The judge sandbox is FROZEN behavior. Do not change `/api/demo` beats, GateReason strings, the seeded agent, or the txs; restyle only.
- The normal-user path is gated on the Privy dashboard config (owner step): the LIVE origins (`https://leash.ink`, `https://www.leash.ink`, `https://leash-ens.vercel.app`) must be allowlisted. `localhost:3100` is optional (local-only). Livetest runs against the deployed app, so the live origins are the ones that matter. The sandbox is testable regardless.
- Reconcile the Arc-vs-Hedera seam noted above during wire/livetest.
- The owner will DEMO both paths on video after everything works. Timeline: ~5 hours to submission, ~2 reserved for the demo video, ~3 to perfect everything.
