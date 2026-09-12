# PRIZE-COMPLIANCE - LEASH (ETHOnline 2026)
> Verified 2026-09-12 against the LIVE prize page (ethglobal.com/events/ethonline2026/prizes) + sponsor docs. Every literal qualification bullet mapped to a LEASH artifact / observable / plan task.
> Track: **Building from Scratch** | Prizes selected (max 3): **ENS $4,500 + Hedera x402 $6,000 + Privy B2B $2,500 = $13,000**
> Status legend: ✅ covered · ⚠ covered-with-flag (owned downstream, not a blocker) · ❌ gap

---

## 1. ENS - Best Use of ENSv2 ($4,500 · 4 winners: 1.5k/1.5k/1k/0.5k)

| # | Literal requirement (verbatim) | LEASH coverage | Evidence | Status |
|---|---|---|---|---|
| 1 | "Build on ENSv2 (Sepolia testnet)" | ENSv2 Sepolia hierarchy, pinned 2026-06-29 canonical addrs | ARCHITECTURE §5; PRD §9 addresses; `scripts/ens/*` | ✅ |
| 2 | "ENSv2 features should be central to the product, not a cosmetic add-on" | Resolver text record IS the live settlement policy; 3-level hierarchy + EAC roles + Permissioned Resolver + one-write revoke | F-011, F-013; INVARIANT #3; ADR-002 | ✅ (strongest possible "central" claim) |
| 3 | "Your demo must be functional and not just include hard-coded values" | Policy read LIVE from ENS via eth_call at settlement (facilitator imports no DB); revoke changes the on-chain record and flips the next call | F-003, F-011; PLAN Task 1.3, 2.2 | ⚠ **F1** |
| 4 | "Submit video recording or live demo link (both preferred)" | 2-4min video + live `/demo` URL | PRD §6, §7.5 | ✅ |
| 5 | "Code must be open source on GitHub" | Public repo | package/deploy phase | ✅ |
| - | Focus areas (hierarchical registry, EAC, Permissioned Resolvers, AI agent identity) | Uses hierarchy + EAC + Permissioned Resolver + agent-name identity | ARCHITECTURE §5; F-013 | ✅ deep |

**⚠ F1:** "not just hard-coded values" is satisfied structurally (values are read live), but the DEMO must *visibly* show a value being read from ENS (e.g. the resolver record panel in the A/B split-screen, or an on-screen eth_call), not appear to come from a config file. Owned by demo/design. Already the design intent (A/B split-screen resolver↔402); just make the live-read legible on camera.

---

## 2. Hedera - AI & Agentic Payments (x402) ($6,000 · up to 3 × $2,000)

| # | Literal requirement (verbatim) | LEASH coverage | Evidence | Status |
|---|---|---|---|---|
| 1 | "Host a live x402-gated service on Hedera testnet or mainnet" | Self-hosted facilitator (Blocky402 fork) + resource server `GET /premium` network `hedera:testnet` | F-001; ARCHITECTURE §4; PLAN Task 2.2/3.1 | ✅ |
| 2 | "Build a platform or agent that consumes that service and completes at least one real paid request end to end" | Agent client pays within cap → real settle tx on HashScan, gas-free | F-001; PLAN Task 3.1 (DP-3); wire proves live | ✅ |
| 3 | "Public GitHub repo with README covering setup, architecture, payment flow" | README + PRD §6 sequence diagram + proof surface | PRD §7.6; PLAN Task 6.2/6.3 | ⚠ **F2** |
| 4 | "Demo video (≤5 min) showing paid request executing" | 3:00 video, Scene 3 shows the paid request (ETHGlobal 2-4min limit governs) | PRD §6 Scene 3 | ✅ |

**Note on "Blocky402":** the LIVE prize page bullet is "host a live x402-gated service on Hedera" - it does NOT literally require Blocky402. Any self-hosted x402 service on Hedera qualifies. Forking Blocky402 (open-source MIT, self-hostable, same @x402/hedera stack) is a spec-literalism bonus that a Hedera judge recognizes, not a gate. Extra-points items (HCS audit ✅ present F-014; ERC-8004/HCS-14 identity, Scheduled Txs, metering = not built, E-5 deferred).
**HashScan contract verification is NOT required for x402** (that's the separate Hedera ATS/Tokenization prize, which LEASH does not target). x402 needs tx evidence only. ✅

**⚠ F2:** README must contain an explicit "Payment Flow" section (the PRD §6 sequence diagram is the source). Owned by deploy/package.

---

## 3. Privy - Best B2B Financial Product ($2,500 · 1 winner)

| # | Literal requirement (verbatim) | LEASH coverage | Evidence | Status |
|---|---|---|---|---|
| 1 | "Integrate Privy as a core part of the product" | Org treasury = Privy P-256-owner server wallet; the funding rail | ARCHITECTURE §Treasury; INVARIANT #5/#6 | ✅ |
| 2 | "Create or use at least one Privy wallet" | Org server wallet via `createWallet` | F-009; PLAN Task 0.2/4.1 | ✅ |
| 3 | "Demonstrate a business or organization use case" | Org funds + governs a fleet of paying agents (B2B treasury) | PRD §1, §3 Flow 2 | ✅ |
| 4 | "Implement at least one functional B2B workflow (payment, approval, treasury operation, wallet administration)" | Treasury→agent funding (treasury operation) + revoke→status sync | F-009; PLAN Task 4.1/4.2 | ✅ |
| 5 | "Use at least one Privy control (policies, signers, key quorums, intents)" | Funding policy: ERC-20 transfer cap + allowlist, default DENY | F-009, F-010; ADR-003 | ✅ (1 control = meets "at least one") |
| 6 | "Provide working demo and source code access" | Live `/demo` + `/app` login + public repo | PRD §7.5 | ✅ |
| 7 | "Clearly explain how Privy enables the product" | README + demo Scene 6 (two-rail control plane) | PRD §6 Scene 6 | ✅ |
| - | DISQUALIFIER: "Mocked experiences without live integration do not satisfy" | Live leaked-key over-fund DENY on camera (real policy eval, P-256-owner enforced; proven live 2026-09-12) | F-009; VF-F1; ADR-003 | ✅ |

**Note:** LEASH ships ONE Privy control (policy). The bullet requires "at least one" - so it QUALIFIES. E-2 (a 2nd control via intents) was correctly DROPPED because intents = active approver, which trips INVARIANT #6 / concern #4 [C] / the thesis drift-tripwire. No additional control is needed for the prize; deepening here would cost the thesis. Also: LEASH targets **B2B**, not Privy "Best Financial Flow" (which requires Cards mocked + another live flow) - that track is not selected, so its Cards rule does not apply.

---

## 4. Cross-cutting ETHGlobal gates (apply to ALL prizes - a miss here DQs everything)

| # | Requirement | LEASH coverage | Evidence | Status |
|---|---|---|---|---|
| A | Demo video 2-4 min HARD, 720p+, **human voice (no AI TTS)**, intro <20s | 3:00 human-voice video, no TTS | PRD §6; DS-1 | ⚠ **F4** (Dami records; hard auto-reject if violated) |
| B | Granular commit history from hour 1 (no single-commit-day) | Every PLAN task ends in a commit | R-15; DS-2; PLAN all phases | ✅ (build discipline) |
| C | AI usage documented (spec files + prompts in repo) | AI-ATTRIBUTION.md + spec docs in repo | DS-3; R-15; PLAN Task 6.3/package | ⚠ **F3** |
| D | Public GitHub repo | yes | package | ✅ |
| E | ≤3 partner prize selections | exactly 3 (ENS+Hedera+Privy) | DS-3 | ✅ |
| F | Track selection = Scratch, all work net-new (pre-existing code = DQ) | LEASH is net-new for this event | WINNER-BRIEF; Scratch | ✅ |
| G | No mocked/static data on the judged path | Every demo beat is a real tx; seed = real pre-produced state | INVARIANTS #1-#3; PRD §6 | ✅ |

---

## 5. Verdict

**All 3 selected tracks are FULLY COVERED against their live qualification bullets. No ❌ gaps.**

Four ⚠ flags, all owned downstream (demo/deploy/package), none a build blocker:
- **F1** (ENS): make the live ENS read visible on camera (don't let it look hard-coded). → demo/design
- **F2** (Hedera): README needs an explicit "Payment Flow" section. → deploy/package
- **F3** (all): AI-ATTRIBUTION.md + spec files must actually be in the repo at submission. → package (verify at preflight)
- **F4** (all): demo video must be human-voice + 2-4 min, or it is auto-rejected. → demo (Dami records)

Depth ranking of the 3 legs: **ENS deep > Hedera deep > Privy moderate (one control, sufficient).** The only place LEASH is at the *minimum* bar (not beyond it) is Privy's single control - which is a deliberate, invariant-protecting choice, not an oversight.
