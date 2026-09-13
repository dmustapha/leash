# LEASH demo video walkthrough

Target: 2 to 4 minutes, human voice, screen recording of the live app at https://leash.ink.
Honest framing throughout: enforcement is facilitator-trusted; spend governance is Hedera today (other chains in progress); identity is on-chain-resolved (never "verified"); Privy is funding-only; the token is our own test USDC (6-decimal HTS). Control = TRUE, Independence = TRUE, Trustlessness = FALSE.

## Pre-flight (do this right before recording)
1. Warm both Render services (or confirm they are on starter): open `https://leash-facilitator.onrender.com/healthz` (expect `{"ok":true}`) and drive one `/demo` spend so the resource server is hot.
2. Re-seed the demo to the start state: `npm run seed` (restores SOLV-001's policy after any prior revoke beat). Confirm `/demo` shows "Meet SOLV-001".
3. Have two tabs ready: `leash.ink` (landing) and `leash.ink/demo` (judge sandbox). A third tab on `leash.ink/app` for the new-user path.

## Scene 1 — the hook (15s), on `/`
- Line: "Teams are handing AI agents a raw key and hoping they behave. LEASH keeps your agents on a leash: it is the ENS name that can un-pay them."
- Show the hero, the one-write-revoke idea in plain terms.

## Scene 2 — the judge sandbox, SOLV-001 (90s), on `/demo`
Narrate that this is a REAL external agent you own: SOLV-001, a Circle wallet on Arc, identity on-chain-resolved, governed here through a LEASH Hedera account.
1. **Meet SOLV-001** — show its on-chain-resolved identity `0x927c...` and its ENS-declared 5 USDC cap.
2. **Pays in-limit** — click "Let it pay $3". Show it settle gas-free (real Hedera txId, agent holds 0 HBAR). Line: "In-policy, so the facilitator we run co-signs. Gas-free."
3. **Overspends** — click "Let it try $50". Show it blocked. Line: "Over its cap, so the facilitator refuses to co-sign. Nothing moves."
4. **Cut it off** — click "Cut it off". Line: "One on-chain write clears the ENS policy record. The next payment fails closed, everywhere."
5. **Leaked-key over-fund** — click the last step. Line: "Even if the agent's key leaks, the independent Privy funding rail refuses to over-fund it. The blast radius stays capped."
- Point at the HCS audit feed: every ALLOW and DENY is recorded on-chain.

## Scene 3 — how a new user integrates their own agent (45s), on `/app`
- Line: "You bring your own agent. Sign in, then bind it."
- Show the connect gate (email / Google), then the bind form.
- Narrate the model without over-claiming: "You paste your agent's Hedera public key plus its EVM or ERC-8004 identity. LEASH never sees the private key. It provisions a 2-of-2 co-owned account and writes the spend policy to an ENS name."
- Show setting a cap + the agent appearing in the fleet console. (If a live bind is risky on camera, show a pre-bound agent's detail page: identity, co-owned account, limits, revoke.)

## Scene 4 — the honest close (20s), on `/proof`
- Line: "Enforcement is facilitator-trusted, not trustless: the chain stores the policy and the revocation, and the facilitator we run reads it and decides whether to co-sign. That is the corporate-card model for agents."
- Line: "Spend governance runs on Hedera today. Governance for other chains is in progress."
- End on `/proof`: real contracts, real transactions, on-chain-verifiable.

## Do-not-say list (honesty locks)
- Never: "trustless", "the chain enforces the cap", "verified identity", "mint an agent", "Privy co-signs the payment", "the cap bounds total spend".
- Say instead: "on-chain-resolved", "the facilitator co-signs only in-policy payments", "one-write revoke", "soft budget" for rolling caps, "funding-only rail" for Privy.
