# Phase 5 — Backend / Facilitator Critique (REFRAME build-delta)

Scope: the 2-of-2 co-signed Hedera spend-control plane. Frozen floor (/demo, /api/demo,
provision-canonical.ts, VM-1/VM-2) NOT reviewed. 5-pass senior review + honesty-lock verification.

## Verdict: APPROVE (no MUST-FIX)

Result counts:
- MUST-FIX: 0
- SHOULD-FIX: 3
- NOTE: 5

No logic error, fail-open path, missing await, or honesty-lock violation was found. The reframe
delta is unusually disciplined — every external read fails CLOSED and the honesty locks are
respected in code, not just comments.

---

## Honesty-lock verification (all PASS)

- **SR-1 (agentPriv never read by facilitator/db/web runtime): PASS.**
  `grep` of `COSIGN_AGENT_KEY`/`agentPriv` across `facilitator/` and `db/` = CLEAN. The only source
  readers are `agent/vm3.live.ts` (external agent stand-in) and `scripts/hedera/*` (provisioning
  stand-in) — both explicitly permitted by SR-1. `web/lib/config.ts` reads ONLY `LEASH_COSIGNER_KEY`
  (line 20); its one `COSIGN_AGENT_KEY` mention (line 18) is a comment. `web/lib/console.ts`
  `provisionSpendingAccount` takes only `agentPub` and never generates a private half. F-031 stands.
- **Trustless=FALSE: PASS.** Every "trustless"/"chain enforces" hit is a disclaimer
  (spend-rollup.ts:16 `MUST-NOT-CLAIM`, authorize.ts:70 `NOT trustless/exact`). The scheme's
  "network enforces the real threshold at submit" is honest — that is the KeyList threshold, NOT the
  cap; the cap is never claimed to be chain-enforced.
- **Rolling caps = SOFT, fail-CLOSED: PASS.** spend-rollup.ts never catches its own fetch/HTTP error
  to a default; `fetchPage`/`rollingTotals`/`mirrorConsensusNow` all THROW on transport failure and
  server.ts maps the throw to RPC_ERROR deny (server.ts:184-187, :98-102). No default-0 un-cap path.
- **ERC-8004 = "on-chain-resolved" not "verified": PASS.** erc8004.ts labels everything
  "on-chain-resolved / not proof-of-control"; route.ts returns `label: 'on-chain-resolved'` (:337).
- **INVARIANT #8 (payer==policy.hederaAccount; single post-gate emit): PASS.** authorize.ts:37 binds
  payer to `policy.hederaAccount`; co-sign is emitted only inside `cosignSignAndSubmit` which the SDK
  reaches only after onBeforeSettle returns proceed. `cosignCallCount` makes the single emit observable.
- **INVARIANT #13 (enforcement reads only leash.policy): PASS.** authorize.ts imports only types;
  the settle path in server.ts reads `readPolicyNoCache` (ENS policy) only — never agent.* identity.

---

## SHOULD-FIX

**[SHOULD-FIX] facilitator/server.ts:88,98 — `mirrorConsensusNow` called twice per settle**

When a policy declares BOTH an `allowedWindows` AND a rolling cap, `enrichForDynamicLimits` calls
`mirrorConsensusNow(topicId)` twice (line 88 for the window, line 98 for the rolling epoch) — two
mirror round-trips returning identical data, adding latency to the capped-settle demo path.

Fix: call `mirrorConsensusNow` once, destructure `{ minuteUtc, dayUtc, epochSeconds }`, and reuse
for both the window ctx and the rolling `epochSeconds` bound.

**[SHOULD-FIX] web/lib/console.ts:132-137 — cosigned funding transfer has no zero/negative guard**

`provisionSpendingAccount(agentPub, fundRaw=20_000_000)` builds a token transfer with `-BigInt(fundRaw)`.
If a caller ever passes `fundRaw=0` a zero-amount HTS transfer is submitted (wasteful / may error),
and there is no upper bound. `route.ts` always passes a constant so it is not currently reachable, but
the exported function is a public API. Add `if (fundRaw <= 0) throw` at the top (parallels the guard
already present in the scripts/ variant's `fundAgentUsdc` shortfall check).

**[SHOULD-FIX] facilitator/hedera-scheme.ts:167 — `cosignVerifyPayerSignature('')` built even with no cosigner key**

When `LEASH_COSIGNER_KEY` is absent, `coVerify` is still constructed with an empty `cosignerPubRaw`.
It is only invoked on the KeyList branch, and that branch throws earlier in signAndSubmit — but the
verify branch (line 188) would call `coVerify` with an empty cosigner filter, treating LEASH's own
(absent) key as "not a member", which is harmless but relies on a subtle invariant. Prefer symmetry:
guard the KeyList verify branch with `if (!cosignerKey) throw` the same way signAndSubmit does
(line 177-179), so a misconfigured process fails loud rather than relying on member-filter accident.

---

## NOTE

- **facilitator/spend-rollup.ts:69 — "now" lags to the latest audit-topic message.** Using the latest
  topic message's consensus timestamp as the window's upper bound means the lookback ends at the last
  logged ALLOW, not true now. This is conservative (drops oldest entries slightly early, keeps all
  recent spend) and is the disclosed SOFT-budget slack — not a fail-open. Documented; no change needed.
- **facilitator/spend-rollup.ts:65 / server.ts — first-ever capped settle on an empty topic throws.**
  If a window/cap policy is exercised before ANY message exists on the HCS topic, `mirrorConsensusNow`
  throws → RPC_ERROR deny. Correct (fail-closed) but a demo footgun: seed the topic with one message
  (or fund a non-capped call first) before demoing a capped agent.
- **facilitator/cosign.ts:64 keyListEcdsaMembers — ECDSA-only member parse.** The regex matches only
  `3a21`-tagged ECDSA members; an ED25519 member (`3a20…`) is silently ignored. Fine given LEASH's rail
  is ECDSA by construction (generateECDSA throughout), and documented at cosign.ts:62-63. Future concern
  only if a mixed-key KeyList is ever bound.
- **facilitator/cosign.ts:40 isKeyListShape — treats any non-single-key shape as co-sign.** A malformed
  or unexpected mirror `_type` classifies as KeyList (co-sign path). This is the safe default (routes to
  the stricter 2-of-2 verify, never mis-routes a threshold account onto the 1-key path) but means a
  genuinely single-key account with an unrecognized `_type` string would be forced onto the co-sign path
  and fail at submit rather than falling back. Acceptable; noted for robustness.
- **web/app/api/agents/route.ts:145,300 — `RECEIVER_ACCOUNT_ID!` non-null assertion as allowlist default.**
  If `allowedPayees` is empty AND `RECEIVER_ACCOUNT_ID` is unset, the policy's allowlist becomes
  `[undefined]`, later JSON-stringified. Env is asserted elsewhere so not reachable in the deployed
  config, but a defensive check would make a misconfig fail loud at register time.

---

## What's good

- The fail-closed discipline is genuinely end-to-end: mirror reads THROW rather than default, and
  server.ts maps every throw to a deny reason. The "never default-0" un-cap trap is explicitly avoided
  and commented at the exact site (spend-rollup.ts:11-14, server.ts:102).
- The DEV-D01 fix (anchoring the rolling-window WIDTH to the consensus epoch instead of the host clock)
  is a real, subtle correctness win — a host clock ahead of consensus would have silently under-counted
  recent spend. Catching that is senior-level.
- The single co-sign emit site is made test-observable via `cosignCallCount`, turning INVARIANT #8 into
  a provable assertion rather than a comment.
- The `_assertNever` exhaustiveness guards in both authorize.ts and server.ts make a future missing
  GateReason a COMPILE error, not a runtime demo failure.
