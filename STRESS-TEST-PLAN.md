# Stress Test Plan — LEASH
> hackathon-stress | 2026-09-12 | project_type: full-stack (no LLM-in-loop agent)

## Debug/Reframe Handoff Coverage (no-drop check — Owner: stress_test)
| # | Handoff risk | Mapped test | Disposition |
|---|--------------|-------------|-------------|
| DH-3 (P1) | durable replay must FAIL-CLOSED on Neon outage + replay rejected across restart | `db/replay.integration.ts` (live Neon) + A5 structural (`db/replay.ts`, pure gate DB-free) | PASS |
| DH-4 (P2) | rate-limit 429 a burst before draining fee-payer/agent balance | `web/lib/ratelimit.test.ts` + LIVE burst on `POST /api/agents` | PASS |
| DH-5 (P2) | 2nd new-agent register keeps 1st fundable (union); over-fund DENY | A3 union (build/debug) + 2 live funded registers this session (RF-1, DH-6) + `C-PRIVY-DENY` (verify:claims) | PASS (covered) |
| DH-7 (P2) | authed-as-A editing/reactivating B's agent → 403; OFF_ALLOWLIST after edit | LIVE cross-tenant allowlist PUT + reactivate POST → 403 | PASS |
| RF-4 (P2) | env-configurable mirror base for a live BEAT-7 kill beat | NOT implemented — touches frozen settle path (spend-rollup/cosign); rolling-WIDTH already consensus-anchored (debug cleared) | DEFERRED (integration-tier proof stands) |
| RF-5 (P2) | /demo settle denies on mirror outage; settles identically when up | `vm3` BEAT-7 mirror-down → RPC_ERROR (integration tier) + `C-MIRROR-DOWN-DENY` (verify:claims) | PASS at integration tier (live-injection deferred with RF-4) |

## Coverage Tiers
- **P0 (exhaustive):** enforcement gate (authorize.ts) — 43 authorize unit cases (caps/window/allowlist/revoke boundaries) + vm2 6/6 + vm3 7-live/1-integ (all DENY reason codes) + IDOR/authz.
- **P1 (sampled ≥3):** console mutations (register/bind/allowlist/reactivate/revoke) — auth-gate, cross-tenant 403, malformed input, rate-limit.
- **P2 (smoke):** read surfaces (/proof, /api/feed, landing) — happy path + build. Skipped classes: viewport-matrix visual diffing (covered by design/design_forge a11y audit + build), network-throttle UI (no long async UI beyond settle).

## Test Parameters applied
Missing/empty/malformed body (400), missing/garbage auth (401), cross-tenant target (403), burst concurrency (429), boundary numbers (raw smallest-unit integer regex on caps), reason-code assertions on every DENY.
