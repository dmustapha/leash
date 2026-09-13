# LEASH: ETHOnline 2026 Submission (paste-ready)

Platform: ETHGlobal, ETHOnline 2026. Form: `https://ethglobal.com/events/ethonline2026/project`.
Rules (form sidebar): from scratch, version-controlled with frequent small commits, public repo, demo video <= 4 minutes (no sped-up footage, manually checked).
Copy discipline: no prize/hackathon/win language in prose, no em dashes, honesty locks held (no `trustless`, no `chain enforces`, identity is `on-chain-resolved` not `verified`, no `mint an agent`, rolling caps are a `soft budget`, Privy never co-signs payments). Control = TRUE, Independence = TRUE, Trustlessness = FALSE.

---

## FIELD 1 - Project name
```
Leash
```

## FIELD 2 - Category (single-select)
```
Infrastructure
```
(Alternate if you prefer the theme lens: Artificial Intelligence. Infrastructure is the stronger fit: LEASH is the governance/control layer over agents, not the agent's intelligence.)

## FIELD 3 - Emoji
```
🦮
```
(A guide dog on a leash, native to the name. In the ETHGlobal emoji picker, search `guide dog`. Fallbacks: `link` for 🔗, `dog` for 🐕.)

## FIELD 4 - Short description / tagline (HARD LIMIT ~150 chars, "fits in a tweet")
```
Keep your AI agents on a leash: bind an agent, set on-chain spend limits, cut it off with one write. ENS + Hedera x402 + Privy.
```
(110 characters, under the 150 cap. Note: the Description field has a min of 280 characters and How it's made has a min of 280 characters; both Field 5 and Field 6 below clear that.)

## FIELD 5 - Description

Everyone is racing to build AI agents that can spend money. The part almost nobody has built is the place you sit and actually govern them once they can. That is what LEASH is. It is a control centre for the AI agents that spend your money, where every agent you run is on a leash you can see and pull.

## The problem

Once you hand an agent a wallet so it can pay for things over x402, the only real control you have left is the private key itself. There is no per-call limit, no list of who it is allowed to pay, no hierarchy if you are running a fleet, and no single off switch. The part that actually worries me is revocation, because if a key leaks today, cutting that agent off means going service by service and rotating keys by hand, which is exactly the situation where slow manual work is the last thing you want.

## What LEASH does

LEASH gives an organisation one console to run its whole fleet of paying agents. You bind an agent you already run, give it a spending account that you and LEASH co-own, set its limits, fund it, and if you ever need to, you pull the leash and cut it off everywhere. The thing that makes this work is ENS. Each agent becomes a child name like `data.acme.leash.eth`, and the spend policy for that agent (its per-call cap, the payees it is allowed to hit, its Hedera account, and optionally a rolling daily or weekly budget) lives right there in the name's resolver record. The bit I care about most happens at payment time: a facilitator I run reads that live ENS record before it settles anything, and it only co-signs a payment that is actually within policy. So the moment you clear the record, the very next payment the agent tries just fails. One write on Sepolia and it is done everywhere, with no key rotation and no chasing down services.

## How it works

It is five steps end to end. You bind an existing agent whose identity already lives on another chain, say an Arc or Base wallet or an ERC-8004 registration, and LEASH resolves that identity on-chain and then generates a fresh Hedera spending keypair for the agent. The public half goes into a two-of-two Hedera account that you and LEASH co-own, and the private half is shown to you once, right there at bind, and never stored by LEASH. If you would rather bring your own, pasting your agent's own Hedera public key is still supported as an advanced option. Either way LEASH never holds the agent's private key. Then it writes the policy into the agent's ENS resolver record. From there, every time the agent pays, the facilitator reads that live record, checks the cap and the allowlist and the window, and only adds its co-signature if everything passes, settling gas-free on Hedera so the agent spends zero on gas. Every decision, allow or deny, gets logged to a Hedera Consensus Service topic so it is checkable on-chain. And revoking is the whole point: clearing the record is a single Sepolia transaction, and because the facilitator re-reads with no cache right before it settles, the next payment fails closed rather than slipping through.

## Being honest about the guarantee

I would rather be straight about how strong this is than oversell it. The enforcement is facilitator-trusted, not trustless. The facilitator I run is the thing reading your policy and deciding whether to co-sign, and the chain's job is to hold the policy and the revocation, not to physically block a payment. The model I keep coming back to is a corporate card, where the employee is genuinely independent and holds their own card, but the company sets the limit and can freeze it. So control is real and independence is real, but trustlessness is not, and I say that plainly wherever it comes up. Same spirit on the rolling daily and weekly caps, which are a soft budget rather than an exact one, and on identity, which is on-chain-resolved rather than a proof that the person binding actually controls the address.

## Two ways to see it work

The fastest is the sandbox at `/demo`, which needs no login, no wallet and no ETH. It governs a real agent of mine called SOLV-001, an autonomous agent running on a Circle wallet on Arc (its on-chain-resolved identity is `0x927c1d756d12879aebea0772f3ee220f21f4841a`), and it walks you through five moments: meet the agent, watch it pay three dollars inside its cap and settle gas-free, watch it try fifty and get refused, revoke it and watch the same payment fail closed, then watch a leaked key try to over-fund it and get denied by the funding rail. The second way is the real product at `/app`, where you log in with Privy, spin up your org, and bind an agent you already run by giving it its cross-chain identity. LEASH generates the agent's Hedera spending key for you and shows you the private half once, and it never keeps it (bringing your own key is still there if you want it). You get the same controls on your own agent, and LEASH still never holds its private key.

## What is live right now

Everything below is on live rails, not a mock. If you only click a few things, click these.

- The app: https://leash.ink (sandbox at /demo, proof page at /proof)
- The code, MIT and public: https://github.com/dmustapha/leash
- Revoking an agent in one write, on Sepolia: `0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293`
- A gas-free settle where the agent pays zero HBAR, on Hedera: `0.0.10487802@1789205977.654877070`
- The audit topic, with an ALLOW at seq 1 and an over-cap DENY at seq 2: `0.0.10496492`

Every headline number here recomputes from committed evidence with `npm run verify:claims`, and the full ledger is in `submission/proof.md`. There are 102 unit tests and 8 integration tests behind it, plus the live on-chain runs.

## Where it goes next

Right now the actual spend governance runs on Hedera, because the co-signing facilitator I run is the x402 Hedera one, even though binding identity already works across chains and the funding rail is general enough to move. The near-term work is standing that co-signer and policy read up on Arc and Base too. Further out I want to move enforcement from something I am trusted to do toward something the chain checks itself, most likely a contract wallet that mirrors the cap on-chain.

## FIELD 6 - How it's made

The frontend is a Next.js app on Vercel, and the two rails behind it, the x402 Hedera facilitator and a small x402-gated resource server, run on Render. There is a Neon Postgres in the stack too, but I want to be clear that it is only an index for the UI and never the thing that decides whether a payment is allowed. It is all TypeScript, with 102 unit tests and 8 integration tests, plus a set of live runs that actually hit Sepolia and Hedera instead of mocking them.

The ENS side is where the idea really lives, and I used ENSv2 on Sepolia with a three-level hierarchy: a root, an org under it, and each agent as a child name beneath the org. The spend policy sits in the agent name's resolver record under the key `leash.policy`, and the facilitator reads it with a single `PermissionedResolver.text` call right before it settles. Nothing is hard-coded, the caps and the allowlist and the revocation are all real Sepolia transactions, and revoking is just `clearPolicy`, which is one write. The reason ENS was the right primitive rather than a database is that the record is already a public source of truth anyone can read, so revocation is not a flag I flip in my own system, it is an on-chain fact.

For Hedera I self-hosted an `@x402/core` plus `@x402/hedera` facilitator, the same shape as Blocky402, and it settles with the native fee-payer scheme, which is the partner feature that actually matters here: the agent pays zero HBAR and is only debited the USDC it is spending, using its own six-decimal HTS test token. The gate itself is a pure `authorize` function with no database in it. There are two reads of the ENS record, an advisory one before verify that is allowed a short cache, and the authoritative one right before settle that never caches. That second read is the part I sweated over, because it is what closes the window where a revoke lands in between verify and settle. Without it you could revoke and still have an in-flight payment go through, which would quietly turn the whole promise into a lie. Every decision, with its reason, is written to a Hedera Consensus Service topic, all the amounts are compared as BigInt on raw units so nothing rounds, and if the RPC or the mirror is unreachable the gate fails closed rather than defaulting to zero.

The two-of-two account is how I keep the agent genuinely independent while still being able to govern it. When you bind an agent, LEASH generates a fresh Hedera spending keypair for it, puts the public half into a KeyList account alongside LEASH's own co-signer key with a threshold of two, and hands the private half back to the user once, at bind. LEASH never stores that key, so it is not in the facilitator, the database or the env anywhere. If someone would rather supply their own agent public key instead of having one generated, that path is still there as an advanced option, and the invariant holds either way: LEASH never retains the agent's private key. LEASH only adds its signature at settle, after the gate passes, at a single spot in the code. I checked both failure directions on-chain: the agent signing alone gets a clean `MISSING_COSIGN` and nothing settles, and LEASH together with its own operator key still cannot move the agent's funds. I also assert at startup that the co-signer key is not the same as the gas fee-payer key, so the line about the authority key not being the gas key is literally true in the running process and not just a claim in a README.

Privy is the second, independent rail, and it only ever touches funding. The treasury is a P-256-owner Privy wallet driven through `@privy-io/server-auth`, and its policy caps and allowlists the actual USDC transfer calldata, so an over-cap top-up comes back as `FUNDING_DENIED` before it ever broadcasts. There is deliberately no on-chain artifact for that denial, the absence is the proof. The hacky detail I did not expect is that a KeyList account has no key-derived EVM alias, so funding has to target its long-zero EVM address, and that took me a while to work out. I kept Privy strictly funding-only on purpose, because the moment it co-signs a payment the honest story falls apart.

Identity uses ERC-8004. On register, LEASH resolves the owner live against the canonical Sepolia registry and writes the `agent.erc8004` and `agent.address` records, and a mismatch just errors instead of registering. I label this on-chain-resolved rather than verified, and that wording is deliberate, because `ownerOf` tells you who the registry says owns the agent but it does not prove the person binding actually controls that address. A proper signed proof-of-control handshake is something I want, it just is not in yet.

The last thing I would rather disclose than bury is that the rolling daily and weekly caps are a soft budget. They are summed from the HCS topic through the mirror node, which lags, so under enough concurrency you could overshoot by roughly the number of in-flight payments times the per-call cap. The hard bounds are the per-call cap on live ENS and the funding cap on Privy. On top of that the console runs `requireOwner` on every mutating route, the mutation routes are rate limited, and the replay set is stored in Neon so a replayed payment is still rejected even if the facilitator restarts.

If you want to check the addresses yourself, the policy resolver the facilitator reads is `0xdC460cd7151D679CF5D1e34595e1ac890A5E4978` on Sepolia, the sandbox registry is `0xB45830aeaf0A00367A450635a110cffA6878A679`, the org-parent registry is `0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409`, the canonical ERC-8004 registry I resolve against is `0x8004A818BFB912233c491871b3d84c89A494BD9e`, and on Hedera the 2-of-2 spending account is `0.0.10508343` and the audit topic is `0.0.10496492`.

## FIELD 7 - GitHub Repositories (SELECTOR, not a URL paste)
This field is "Select GitHub Account -> Select Repositories" and the repos MUST be public.
- Connect the `dmustapha` GitHub account, then select the `leash` repository (`https://github.com/dmustapha/leash`). Confirm it is public.
- Optional second repo (the demo agent LEASH governs): `solv-001` (`https://github.com/dmustapha/solv-001`), also public. Add it only if you want judges to see SOLV-001's source; the primary repo is `leash`.

## FIELD 7b - Tech stack (its own section; tag / technology picker)
Enter or select these tags:
```
Next.js, TypeScript, ENS (ENSv2), Hedera, x402, HCS (Hedera Consensus Service), Privy, ERC-8004, viem, Postgres (Neon), Vercel, Render, Solidity
```

## FIELD 7c - Future (the "What's next for Leash" section)
```
The most obvious next step is governing spend on more than Hedera. Binding an agent's identity already works across chains and the Privy funding rail is general enough to move, so what is actually missing is a co-signer and a policy read deployed per chain. Arc and Base are the two I would do first, mostly because that is where the agents I care about already are.

Further out, I want to move the enforcement from something I am trusted to do toward something the chain checks itself. Today the facilitator I run is what decides whether to co-sign against the ENS policy, and a Hedera contract wallet that mirrors the cap on-chain would let the chain refuse an over-cap payment instead of trusting me. That is genuinely multi-day work, which is why it is a roadmap item and not a weekend one.

There are two hardening jobs I already know are coming. The spend co-signer currently lives in the same process as the operator, and it really should sit in its own trust domain, a separate host or an HSM. And the identity binding should graduate from on-chain-resolved to a real signed proof-of-control, so whoever binds an agent has to prove they hold the address rather than just point at a registry entry.

I would also like to turn the rolling caps into a hard bound rather than a soft budget. The honest way to do that is to serialise settlement per agent so the rolling total is never read stale. I have a rough plan for it but have not built it, and I would rather ship it correct than fake the guarantee now.
```

## FIELD 8 - Live demo URL
```
https://leash.ink
```
(Also live: https://www.leash.ink and https://leash-ens.vercel.app. Judge sandbox: https://leash.ink/demo . Proof surface: https://leash.ink/proof)

## FIELD 9 - Demo video (<= 4 min)
```
[[ PASTE VIDEO URL HERE - coming from the build chat; hard limit 4:00, no sped-up footage ]]
```

## FIELD 10 - Sponsor prize tracks (check these)
- [x] ENS
- [x] Hedera
- [x] Privy

## FIELD 11 - Team
- Dami (solo builder). GitHub: dmustapha. X: @capitanoo23. Built with Claude Code. AI attribution: `AI-ATTRIBUTION.md`.

## FIELD 12 - Cover image / logo
- Use the Tether leash-clasp wordmark: `web/public/logo.svg` (and PNG set in `web/public/`).

---

# PROOF PACK (for the "How it's made" links, the /proof page, and any track write-ups)

Networks: EVM = Sepolia, Hedera = testnet.

## Deployed contracts (Sepolia)
| What | Address |
|---|---|
| Policy resolver (PermissionedResolver, the enforcement read target) | `0xdC460cd7151D679CF5D1e34595e1ac890A5E4978` |
| Sandbox registry | `0xB45830aeaf0A00367A450635a110cffA6878A679` |
| Org-parent registry | `0xb36e0ede0Ed38653c5aB8222B409a6b2Ba78b409` |
| ERC-8004 Identity Registry (resolve source, canonical) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |

## ENS names + policy
- Root: `leash` , Org: `acme.leash.eth`
- Agent (SOLV-001): `data.acme.leash.eth` , cap `maxPerCall = 5000000` = 5 USDC
- Agent: `payments.acme.leash.eth` , cap `maxPerCall = 25000000` = 25 USDC

## Sepolia transactions
| Action | Tx |
|---|---|
| register root `leash` | `0x32d3d92e8ef4f2cedcee87350fcbe48821ff8f4546cee7a6cf589cf1f539ac97` |
| register org `acme` | `0x81a9f22d0892cce21871e2531a12d093ec4f4f257107e120d4ca992f885fa293` |
| register agent `data.acme.leash.eth` | `0x28113edcc070c9ce58aeaa7f6c44b7e1089f7b1890aab3a71fed384bac133126` |
| register agent `payments.acme.leash.eth` | `0xc9a05c18e50e08ea5c7756d07b3fefc22ace59ad7b7f4b8ee3b9bee3ce3654c8` |
| setText `leash.policy` (data) | `0x9245255cff979d9bccc501d574f1991cffd00d1bdaeb724e9276b071b8d7fdfa` |
| revoke `clearPolicy` (the kill switch) | `0xf03e14d1c0ed8528d90f9d0e5aa4bc55cb2fe29baedea97596d902c427702293` |
| co-hold role grant (user co-holds the kill switch) | `0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101` |

## Hedera testnet
| What | Id |
|---|---|
| Gas-free settle (agent 0.0.10497601 pays 0 HBAR, receiver 0.0.10497604 +3 USDC) | `0.0.10487802@1789205977.654877070` |
| Co-signed 2-of-2 in-cap settle | `0.0.10487802@1789241326.656309368` |
| 2-of-2 co-signed KeyList account (threshold 2, long-zero EVM `0x0000000000000000000000000000000000a05837`) | `0.0.10508343` |
| Authed bind e2e KeyList account | `0.0.10511140` (policyTx `0x4c254de90536bd5349a6171a2efb8113e74e7771667f5f41eba4170e18727969`) |
| Own HTS test USDC (6-dec) | `0.0.10496489` |
| HCS audit topic (seq#1 ALLOW, seq#2 DENY OVER_CAP) | `0.0.10496492` |

## Privy funding rail
- In-cap ALLOW (real USDC transfer): `0xb4ec565c2a86f806b69e918632eed796d731d096891e56bbb82db52901053749`
- Over-cap FUNDING_DENIED: no txHash by design (fails closed before broadcast)

## Identity
- SOLV-001 external identity (Arc / Circle EVM, written on-chain as `agent.address`, on-chain-resolved advisory): `0x927c1d756d12879aebea0772f3ee220f21f4841a` . Repo: `https://github.com/dmustapha/solv-001`
- ERC-8004 resolve (console bind path, distinct from the above): `ownerOf(7395)` on `0x8004A818BFB912233c491871b3d84c89A494BD9e` -> `0x92AAe0857979a139344f5b6F008e71F27A507522`

---

# FORM CHECKLIST (in the real ETHOnline editor order)

Create Project step:
- [ ] Project name: Leash
- [ ] Category: Infrastructure
- [ ] Emoji: 🦮 (search `guide dog`)

Project details:
- [ ] Live/demo URL (top field): https://leash.ink
- [ ] Short description (<= 150 chars, Field 4)
- [ ] Description (min 280 chars, Field 5 blueprint body)
- [ ] How it's made (min 280 chars, Field 6)
- [ ] GitHub Repositories: connect `dmustapha`, select PUBLIC `leash` repo (optional: `solv-001`)

Left-nav sections:
- [ ] Images: cover/hero + logo (`web/public/logo.svg`)
- [ ] Tech stack: tags (Field 7b)
- [ ] Select prizes: ENS + Hedera + Privy (answer any per-prize sub-questions)
- [ ] Video: demo URL (<= 4:00, no sped-up footage) - PENDING from build chat
- [ ] Future: what's next (Field 7c)
- [ ] Final: review + submit

Cross-cutting (build chat owns):
- [ ] Repo public + open source, granular commit history
- [ ] Team + AI attribution (`AI-ATTRIBUTION.md`)
