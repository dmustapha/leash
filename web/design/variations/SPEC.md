# LEASH — Redesign Mockup SPEC (shared content for all 5 directions)

You are building ONE self-contained HTML review mockup for a full redesign of **LEASH**. All 5 directions share this EXACT content, structure, and page set. Only the AESTHETIC differs (color world + type + signature — given separately per direction). Static, no build step, opens by double-clicking (file://). Real data below — invent nothing. Aim ~900–1300 lines. Ship a complete, polished, memorable set of surfaces — not a skeleton.

---

## What LEASH is (say it in 5 seconds)
**LEASH is the control layer for your AI agent fleet — mission control for the agents that spend your money.** A company runs autonomous agents that pay for things. LEASH binds each agent it already runs to: an on-chain identity, a co-owned spending account, the spending limits you set, funding, and a one-click kill-switch. Change or cut off any agent everywhere with ONE on-chain write. Hero capability: revoke an agent → its very next payment is blocked everywhere, instantly.

Built on three integrations: **ENS** (the agent's spend policy lives in its ENS record), **Hedera x402** (gas-free payments from a co-owned account, every decision logged), **Privy** (login + an independent funding rail).

## Honesty locks (LEGAL-GRADE — obey verbatim)
NEVER write: "trustless", "chain enforces"/"chain-enforced", "verified" (for identity), "mint an agent", or that rolling caps are exact/trustless, or that Privy co-signs payments.
USE: "the facilitator LEASH runs enforces the limits you set", "the chain stores the policy and the revocation", "Privy is the independent funding rail", "on-chain-resolved" (identity), "soft budget" (rolling daily/weekly), "co-owned account — the agent and LEASH must both approve". Control = TRUE, Independence = TRUE, Trustlessness = FALSE. The agent holds its OWN key (SR-1); LEASH holds only its co-signer key + the agent's public key — neither can spend alone.
USER-ORIENTED PLAIN LANGUAGE on every surface. NO code/JSON/`settle()`/`clearRecord` as a visual centerpiece — technical detail (tx hashes, ENS record, account ids, policy JSON) goes ONLY behind a "View on-chain"/"Details" fold. Plain outcomes: "Paid", "Blocked — over daily limit", "Revoked — cut off everywhere".

## The six control levers (all load-bearing — show all six)
1. **Identity** — bind the agent's external on-chain-resolved ERC-8004 / EVM identity (badge "on-chain-resolved", NEVER "verified").
2. **Co-owned account** — a 2-of-2 Hedera account: the agent and LEASH must both approve; neither spends alone.
3. **Limits** — a hard per-payment cap + optional rolling daily/weekly soft budgets + active-hours time-window.
4. **Funding** — Privy is the independent funding rail; an over-fund is denied before it goes out.
5. **Kill-switch** — one on-chain write revokes the agent everywhere; the next payment fails closed. Reversible (reactivate).
6. **Audit** — every ALLOW/DENY decision is logged (Hedera Consensus Service); the console shows a live spend feed.

## Real demo data (use exactly)
- Org: **acme.leash.eth**. Fleet of 3 agents:
  - **data.acme.leash.eth** — Active · on-chain-resolved · co-owned · Up to **$5** per payment · Up to **$50/day** (soft) · Can pay: **api.acme.dev** only · Funded **$40 of $100**.
  - **payments.acme.leash.eth** — Active · co-owned · Up to **$25** per payment · Up to **$200/week** (soft) · Can pay: **billing.acme.dev, stripe.com**.
  - **research.acme.leash.eth** — **Revoked** (cut off everywhere) → Reactivate.
- Glanceable fleet stats: **3 agents · 2 active · 1 revoked · $46 spent today**.
- The one-write-kill: ACTIVE → "✓ Paid $3 to api.acme.dev" (green); after REVOKE (one on-chain write) → record gone → "✕ Blocked — revoked" (deny color).
- Live activity rows (plain): "data agent paid $3 to api.acme.dev · 2m ago" (allow) · "payments agent blocked — over daily limit · 5m ago" (deny) · "research agent revoked — cut off everywhere · just now" (deny).
- The real external agent being governed (optional talking point): an ERC-8004 agent the owner controls — "on-chain-resolved → 0x42D7…8919".

## On-chain proof (real — for the Proof surface)
- ENS ETHRegistry (Sepolia): `0x67b728a792e789a8978b30cf1b3b641f19354b43`
- ERC-8004 Identity Registry (Sepolia): `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- User co-holds kill-switch role — grant tx `0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101`
- Co-signed in-cap payment SETTLES on the KeyList account `0.0.10508343` (Hedera testnet)
- On-chain-resolved ERC-8004 binding: agentId 7395 → owner `0x92AAe0857979a139344f5b6F008e71F27A507522`
Frame all as verifiable on Etherscan (Sepolia) / HashScan / Hedera Mirror. "on-chain-resolved, not verified."

---

## PAGES (all four in ONE html file, switchable via a sticky top tab-nav: Landing · Console · Sandbox · Proof. Default = Landing.)

### `/` LANDING — a proper, dedicated, cinematic single-scroll marketing page (this is what must IMPRESS). Section order:
1. **Hero** — eyebrow "ENS · Hedera x402 · Privy"; the big confident headline "Mission control for the agents that spend your money." (accent on a key clause); a strong 2–3 sentence subhead (bind an external agent to an on-chain identity + a co-owned account + the limits you set; change or cut off any agent everywhere in one on-chain write); primary CTA "Open your console →"; a clearly-smaller secondary "For judges — try the live demo (no login) →"; a real STATS ROW (e.g. "1 write · cut off everywhere" · "2-of-2 · co-owned account" · "gas-free · agent pays $0"). Generous whitespace, big type — match the rederive-hero bar.
2. **The problem** — companies run fleets of paying agents; a raw key has no cap and no off-switch; cutting a leaked agent today means touching every service by hand.
3. **How it works** — 4 plain beats: Bind → Declare → Enforce → Revoke.
4. **The one-write kill (money-shot)** — the signature moment in PLAIN language (no code): one payment shown Active ("Paid") vs after one on-chain write ("Blocked — revoked"). The visual centerpiece.
5. **What you control** — the six levers above (vary the layout; NOT six identical icon-boxes; make Kill-switch the emphasis).
6. **The honest model** — progressive-disclosure fold: corporate-card model not trustless; the chain stores the policy + records the revocation, the facilitator LEASH runs enforces; identity on-chain-resolved not verified; rolling caps are a soft budget; Privy denies over-funding on an independent rail; LEASH binds agents, it doesn't mint them.
7. **On-chain proof** — a compact strip of the real contracts/tx (verifiable), "every claim resolves on-chain".
8. **CTA / footer** — "Open your console" + the judges side-door; minimal footer (NOT 4 equal columns).

### `Console` — the OWNER product (show it FULLY; this is a control layer, not a toy). Represent these states/sections statically:
- **Connect (login)** — a designed Privy sign-in step: "Sign in with email or Google", note that it provisions an embedded wallet, gas is sponsored; never a fake session.
- **Provision org** — pick an org name → mint `<org>.leash.eth` (gas-sponsored).
- **Fleet overview** — org header (acme.leash.eth), glanceable stats (3 agents · 2 active · 1 revoked · $46 today), the agent cards/list (the 3 agents above), a "Bind an agent" affordance, and a live org spend feed (the activity rows above).
- **Register an agent (bind existing)** — a real form with ALL fields: the agent's Hedera public key (required), an ERC-8004 agentId and/or external EVM address (on-chain-resolved), a label, a per-payment cap; an "Advanced" area: allowlist (who it can pay), agent type + description (advisory identity), and dynamic limits (rolling daily cap, rolling weekly cap, active-hours window from/to UTC).
- **Agent detail** — the FULL controls for one agent: identity block (on-chain-resolved badge, ERC-8004 #, co-owned account), current limits (per-payment / daily / weekly / active hours / can-pay), edit per-payment limit, edit allowlist, edit daily+weekly budgets + active window, funding (Fund $10 + "Try an over-fund → blocked" showing the Privy DENY), test a payment (in-limit "Paid" + over-limit "Blocked"), the Revoke danger-zone (the animated kill → "Revoked — cut off everywhere") + Reactivate, and the per-agent activity feed.
Show a status bar and make the console feel like a real product an operator uses daily.

### `Sandbox` — the judge demo (zero login/wallet/ETH). The 4 beats as controls — **Spend $3 (in cap, gas-free)** · **Try $50 (over cap → refused)** · **Revoke on-chain** · **Leaked-key over-fund (→ Privy blocks it)** — beside the signature A/B split-screen: the agent's ENS spend-policy record (left) and the live payment result (right) move together; on Revoke the record empties and the next identical payment flips to "Blocked — revoked". Plus a live audit scroll (ALLOW/DENY from the Hedera audit log).

### `Proof` — deployed contracts + the three-prize proof (ENS / Hedera x402 / Privy), each with the real pointers above, verifiable, honest ("on-chain-resolved, not verified").

---

## Wordmark
**LEASH** wordmark with a small SVG clasp/leash-ring mark you draw inline (the accent color). Do not fake a photographic logo.

## Output contract (STRICT)
- Write exactly ONE file to the path in your direction brief. Self-contained: inline `<style>` + inline `<script>`. Fonts via `<link>` to Google Fonts / Fontshare CDN. No external images except tiny inline SVG marks you draw.
- Opens by double-clicking (file://). All FOUR pages reachable via the sticky tab-nav; default = Landing. Include the money-shots (the one-write-kill A/B, the full console with all controls, the sandbox beats, the proof pointers) — do not omit any.
- Real content only (numbers, agent names, tx hashes, limits above). No lorem ipsum. Obey every honesty lock.
- Production-grade craft for the given aesthetic: tokenized radii, ≥2 elevation levels (never a bare 1px box), a declared shadow philosophy, hover = transform/shadow (not color-only) inside @media(hover:hover), visible :focus-visible ring, fluid clamp() display type, color never carries meaning alone (status color + text). Tasteful motion (load-in stagger, one hero motion, the revoke flip). min-height:100dvh. Respect prefers-reduced-motion.
- Accessibility: one h1 per page, semantic headings, readable contrast, focus states.
