# Phase 5 — Frontend Critique (REFRAME build-delta UI)

Scope: reframe UI only (bind existing agent → 2-of-2 co-signed account + dynamic limits).
Frozen floor `/demo` NOT reviewed. Live-demo hackathon lens applied.

Files reviewed (all read fully):
- web/app/app/_components/register-agent-form.tsx (235 lines)
- web/app/app/_components/agent-row.tsx (290 lines)
- web/app/app/app-console.tsx (211 lines)
- web/app/proof/page.tsx (197 lines)

Type contracts verified against db/schema.ts: `erc8004Id`, `externalIdentity`,
`identityType`, `accountType`, `agentType`, `description`, `policyTx` all exist as
columns; `publicAgent()` strips only `agentKey`. References are sound.

---

## Tally
- MUST-FIX: 0
- SHOULD-FIX: 3
- NOTE: 5

**No MUST-FIX found.** No demo-visible crash/hang, and no dishonest label.

---

## Honest-copy audit (load-bearing) — PASS

Grepped all four files for `verified | trustless | mint an agent | create agent |
chain enforces | chain-enforced | proof-of-control`:

- Every occurrence is either an explicit **negation** ("NOT 'verified'", "never
  trustless", "not chain-enforced", "not proof-of-control") or an internal field
  name (`coholdVerified`) that is never rendered as a user label.
- Identity is consistently labeled **"on-chain-resolved"**, never "verified"
  (agent-row.tsx:134, register-agent-form.tsx:168/172/177, proof/page.tsx:172).
- Bind flow says **"Bind an existing agent"** / "govern an existing agent" and the
  secondary path is honestly called **"sandbox agent"** (spin up), never "mint an
  agent" as the primary action (register-agent-form.tsx:130/140/231).
- proof/page.tsx:156 explicitly states the cap is enforced by LEASH's co-sign
  decision "**not by the chain … never trustless**". Correct.
- Rolling caps are labeled **SOFT** everywhere the per-call cap is labeled the hard
  bound (register-agent-form.tsx:222, agent-row.tsx:156/162/221, proof:180).

No dishonest label. This is the project's most important axis and it holds.

---

## Demo-robustness audit — PASS

- Failed bind → caught in try/catch, surfaces `j.message || j.error || HTTP n` as an
  error notice (register-agent-form.tsx:106/121-122). No silent hang, no white screen.
- All optional limit inputs validated client-side before the POST: USDC regex via
  `toRaw`, HH:MM via `toMinute`, and `start < end` guard (lines 57-70, 78-83). A bad
  value shows an inline error and never reaches the API, so no 500 from garbage input.
- `busy` gating disables the submit button and inputs during the request; all row
  buttons gate on `busy !== null` (agent-row.tsx) so no double-submit.
- No-wallet state handled: `userAddress` is `string | null`, sent as
  `userAddress ?? undefined`, and the sandbox path prints "embedded wallet still
  initializing" instead of crashing (register-agent-form.tsx:93, 115).
- Privy-not-configured path renders `PrivyPending` instead of crashing login
  (app-console.tsx:27, 49-61).
- List keys present everywhere: agents (`key={a.id}`), activity (`key={ev.id}`),
  claims (`key={c.id}`), contracts (`key={name}`), pointer links (`key=label+href`).
- `<details onToggle>` activity loader is correctly guarded (`activity === null`) so it
  fetches once and never refetches on re-open (agent-row.tsx:268).
- `useEffect` cleanups: the effects here (`loadPolicy`, `refresh`) only fire fetches and
  set state; no timers/subscriptions to clean up. A late resolve after unmount is a
  benign React warning, not a demo crash (see NOTE-2).

---

## SHOULD-FIX

**[SHOULD-FIX] register-agent-form.tsx:118 — success reset is partial; `cap`/`payees`/
`agentType`/`description` persist after a successful bind.**
On success only `label, agentPub, erc8004Id, externalEvm` and the four dynamic-limit
fields are cleared. `cap` (default '5'), `payees`, `agentType`, `description` stay
populated. On camera, binding a 2nd agent silently inherits the previous agent's
allowlist/type/description — easy to demo the wrong policy by accident.
Fix: also reset `setPayees(''); setAgentType(''); setDescription('');` (and reset
`setCap('5')` if a fresh default is wanted) in the success block.

**[SHOULD-FIX] app-console.tsx:103 — `refresh()` swallows a non-OK `/api/org`
response; a 4xx/5xx renders as an empty console, not an error.**
`refresh` calls `r.json()` and reads `j.org`/`j.agents` without checking `r.ok`. If
`/api/org` returns an error body, `j.org` is undefined → org card shows "provision"
state or agents show empty, with no notice. Every other call in the codebase checks
`r.ok`. On a flaky demo network this looks like "my org disappeared".
Fix: `if (!r.ok) throw new Error(j.message || j.error || 'HTTP '+r.status);` before
reading `j.org`, matching the pattern used in `provisionOrg`.

**[SHOULD-FIX] agent-row.tsx:216 — `limits` success handler assumes `j.policyTx`
exists; if the PUT returns no tx it renders "tx undefined…".**
`` `Limits updated (tx ${String(j.policyTx).slice(0,12)}…)` `` — if the API omits
`policyTx` (e.g. no-op update), this prints `Limits updated (tx undefined…)`. The
`setcap`/`allowlist`/`revoke` handlers have the same shape but this one is the most
likely to be a no-op (clearing already-empty limits). Cosmetic but visible on camera.
Fix: guard — `const tx = j.policyTx ? ` (tx ${String(j.policyTx).slice(0,12)}…)` : '';`

---

## NOTE (future / non-demo)

**[NOTE-1] agent-row.tsx:15-17 — `usdc()` uses `Number(raw)/1_000_000`, losing
precision above ~9,007,199 USDC (2^53 raw).** Fine for demo amounts (5/10/50). For a
production display of large balances, format via BigInt string math like `toRaw` does
in reverse.

**[NOTE-2] Late-resolving fetches after unmount set state on unmounted components.**
`loadPolicy`, `loadActivity`, `refresh`, `submit` can resolve after the component
unmounts (e.g. sign-out mid-request), producing a dev-only React warning. No demo
impact. If desired, add an `AbortController`/`ignore` flag in the effects.

**[NOTE-3] register-agent-form.tsx `cap` default `'5'` is a hardcoded UI seed.** Not
from API/config. Acceptable as a placeholder default, but if the org has a house
per-call cap it should seed from config rather than a literal.

**[NOTE-4] agent-row.tsx:39-51 `windowHint` assumes `endMinuteUtc > startMinuteUtc`.**
The form enforces `s < e`, so overnight windows can't be created via this UI, but a
policy authored elsewhere with a wrapping window would show negative "left". Low risk
given the UI is the only author path today.

**[NOTE-5] Shared `notice` state can be clobbered across concurrent actions.** All
components write the same `setNotice`; a fast second action overwrites the first
action's success/error message. Single-operator demo flow makes this near-impossible
to hit, but a per-row inline status would be more robust for a busy live demo.

---

## What's good
- The honest-copy discipline is genuinely airtight — every risky word is negated in
  place, and the identity badge is labeled "on-chain-resolved → 0x…" exactly as
  required (agent-row.tsx:131-135).
- Client-side validation of every optional limit before the network call is exactly
  the right call for demo robustness — bad input can't 500 the API.
- `livePolicy` uses a clean three-state model (`undefined` = loading, `null` = none,
  value = loaded) with distinct "loading…" / "none" / value rendering (agent-row.tsx:
  58, 155-169). Proper loading/empty states.
