# AI Attribution

Per ETHGlobal's AI disclosure requirement, this documents how AI was used to build LEASH.

## Division of work

- **The human (Damilola Mustapha)** authored the specification, product direction, and every design decision: the thesis (an ENS name as a live, revocable spend-permission graph enforced at the payment rail), the REFRAME to a 2-of-2 co-signed spend-control plane for *external* agents, the honesty boundaries (facilitator-trusted, never "trustless"; "on-chain-resolved", never "verified"; rolling caps are a soft budget), the sponsor-integration strategy (ENS + Hedera x402 + Privy), and the UI taste (warm-editorial-dark). All source specs live in [`docs/spec/`](docs/spec/) and the canonical docs (`PRD.md`, `ARCHITECTURE.md`, `INVARIANTS.md`, `DECISIONS.md`).
- **AI (Claude, via Claude Code)** wrote the implementation from those specs: the Next.js console, the self-hosted `@x402/core`+`@x402/hedera` facilitator, the ENS provisioning/policy/resolver code, the 2-of-2 co-sign path, the Privy funding rail, the tests, and the docs. It also ran the test/verify gates and the on-chain proofs.

## How it was used

- Spec-first: each feature amended the canonical docs (`PRD`/`ARCHITECTURE`/`INVARIANTS`/`FEATURE-OBSERVABLES`) before code, so the implementation traces to a written requirement.
- Every headline claim is backed by a real, resolvable on-chain artifact (see `submission/proof.md` and `docs/pipeline/claims.json`), recomputed by `npm run verify:claims`.
- The human reviewed, corrected, and directed throughout (e.g. the mid-build REFRAME from "mint agents" to "bind external agents", and the honesty locks that forbid any trustless claim).

## Models

- Claude (Anthropic), used through Claude Code, for code generation, testing, and documentation.

Commit history retains `Co-Authored-By` trailers by design, so AI contribution is disclosed, not hidden.
