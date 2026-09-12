// File: web/app/page.tsx
// Landing: the two front doors. The judge sandbox (/demo) is the primary, zero-setup path; the real
// console (/app) is secondary. Server component (static), no /app import edge, no client hooks.
import Link from 'next/link';

export default function Landing() {
  return (
    <main
      style={{
        maxWidth: 940,
        margin: '0 auto',
        padding: 'clamp(2rem, 5vw, 5rem) 1.25rem clamp(3rem, 6vw, 6rem)',
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title">
        <p className="eyebrow">ENS · Hedera x402 · Privy</p>

        <h1
          id="hero-title"
          style={{
            fontSize: 'var(--text-display)',
            maxWidth: '20ch',
            lineHeight: 1.06,
            marginTop: '0.75rem',
          }}
        >
          Not another agent that pays an API.{' '}
          <span style={{ color: 'var(--color-amber)' }}>
            LEASH is the ENS name that can un-pay it.
          </span>
        </h1>

        <p
          style={{
            maxWidth: '52ch',
            color: 'var(--color-ink-dim)',
            fontSize: '1.1rem',
            marginTop: '1.1rem',
          }}
        >
          Bind an external AI agent to a spending policy declared on your ENS name. Cut one resolver
          record and that agent&rsquo;s spending dies everywhere &mdash; in one on-chain write.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '2rem' }}>
          <Link
            className="btn btn-primary"
            href="/demo"
            style={{ minWidth: 230, justifyContent: 'center' }}
          >
            Try the judge sandbox &rarr;
          </Link>
          <Link className="btn" href="/app" style={{ minWidth: 200, justifyContent: 'center' }}>
            Open the real console
          </Link>
        </div>

        <p style={{ marginTop: '0.9rem', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
          No login, no wallet, no ETH for the sandbox. Every step runs a real on-chain transaction.
        </p>
      </section>

      {/* ── THE WOW: the one-write kill ──────────────────────────────────── */}
      <section aria-labelledby="kill-title" style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
        <div
          className="card"
          style={{ padding: 'clamp(1.5rem, 3vw, 2.25rem)', overflow: 'hidden' }}
        >
          <p className="eyebrow" style={{ color: 'var(--color-amber)' }}>
            The one-write kill
          </p>
          <h2 id="kill-title" style={{ fontSize: 'var(--text-h2)', marginTop: '0.6rem' }}>
            Revocation is a single resolver write. The agent&rsquo;s next payment fails closed.
          </h2>
          <p
            style={{
              maxWidth: '58ch',
              color: 'var(--color-ink-dim)',
              marginTop: '0.75rem',
              fontSize: '1rem',
            }}
          >
            The facilitator we run reads the policy from your ENS name before every settlement. Clear
            the record and there is nothing left to read &mdash; no per-service offboarding, no
            key rotation, no scramble.
          </p>

          {/* before → after: policy live vs revoked */}
          <div
            role="group"
            aria-label="Before and after revocation"
            style={{
              display: 'grid',
              gap: '0.75rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              alignItems: 'stretch',
              marginTop: '1.5rem',
            }}
          >
            <div
              className="panel"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}
            >
              <span className="pill pill-allow" style={{ alignSelf: 'flex-start' }}>
                POLICY LIVE
              </span>
              <div className="code" aria-hidden="true">
                {`ens.record("leash.policy")
  → { maxPerCall: 5 USDC,
      allow: ["api.acme.dev"] }
settle() → ALLOW`}
              </div>
              <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem', margin: 0 }}>
                Agent pays, capped per call, on the allowlist.
              </p>
            </div>

            <div
              className="panel"
              style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                borderColor: 'rgba(209,96,96,0.35)',
              }}
            >
              <span className="pill pill-deny" style={{ alignSelf: 'flex-start' }}>
                ONE WRITE &rarr; REVOKED
              </span>
              <div className="code" aria-hidden="true">
                {`clearRecord("leash.policy")
  → tx 0x… (one on-chain write)
ens.record("leash.policy") → ∅
settle() → DENY (fails closed)`}
              </div>
              <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem', margin: 0 }}>
                Nothing to read &rarr; every future payment denied, everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: three plain-language steps ─────────────────────── */}
      <section aria-labelledby="how-title" style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" style={{ fontSize: 'var(--text-h2)', marginTop: '0.6rem' }}>
          A spend-control plane for agents you don&rsquo;t own.
        </h2>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '1.5rem 0 0',
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          }}
        >
          {[
            {
              n: '1',
              t: 'Bind',
              d: 'Attach an existing external agent (its ERC-8004 / EVM identity) to a 2-of-2 co-signed Hedera spending account. Neither the agent nor LEASH can move funds alone.',
            },
            {
              n: '2',
              t: 'Declare',
              d: 'Publish the spend policy on your ENS name: a hard per-call cap, an allowlist, and an optional rolling budget with time-windows.',
            },
            {
              n: '3',
              t: 'Enforce',
              d: 'Our self-hosted x402 facilitator reads that ENS policy before every settlement on Hedera. Gas-free, and it fails closed the moment the record is gone.',
            },
          ].map((s) => (
            <li
              key={s.n}
              className="panel"
              style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <span
                aria-hidden="true"
                className="pill pill-amber"
                style={{ alignSelf: 'flex-start' }}
              >
                {s.n}
              </span>
              <h3 style={{ fontSize: '1.05rem' }}>{s.t}</h3>
              <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem', margin: 0 }}>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── PROGRESSIVE DISCLOSURE: the honest details, behind a fold ────── */}
      <section style={{ marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
        <details className="panel" style={{ padding: '1.15rem 1.35rem' }}>
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              listStyle: 'revert',
            }}
          >
            How enforcement actually works (the honest version)
          </summary>
          <div
            style={{
              marginTop: '1rem',
              display: 'grid',
              gap: '0.9rem',
              color: 'var(--color-ink-dim)',
              fontSize: '0.92rem',
              maxWidth: '64ch',
            }}
          >
            <p style={{ margin: 0 }}>
              This is the <strong style={{ color: 'var(--color-ink)' }}>corporate-card model</strong>,
              not a trustless one. The chain stores the policy and records the revocation &mdash; it
              does not itself stop a payment. The facilitator we run is the party that reads the
              ENS-declared policy and enforces it. Enforcement is facilitator-trusted, by design and
              stated plainly.
            </p>
            <p style={{ margin: 0 }}>
              Agent identity is <strong style={{ color: 'var(--color-ink)' }}>on-chain-resolved</strong>,
              not verified &mdash; <code style={{ fontFamily: 'var(--font-mono)' }}>ownerOf</code> tells
              us who holds the name, not who is in control of the key.
            </p>
            <p style={{ margin: 0 }}>
              The per-call cap (<code style={{ fontFamily: 'var(--font-mono)' }}>maxPerCall</code>, read
              live from ENS) is the hard bound on every settlement. Rolling daily / weekly budgets are
              a <strong style={{ color: 'var(--color-ink)' }}>soft budget</strong>, tracked across
              calls, not a hard on-settle cap.
            </p>
            <p style={{ margin: 0 }}>
              LEASH does not mint agents. It binds agents that already exist. Privy is an independent
              funding rail that denies over-funding, so a bound agent can only ever hold what its
              policy allows.
            </p>
          </div>
        </details>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section
        aria-label="Get started"
        style={{
          marginTop: 'clamp(3rem, 6vw, 5rem)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <Link
          className="btn btn-primary"
          href="/demo"
          style={{ minWidth: 230, justifyContent: 'center' }}
        >
          Try the judge sandbox &rarr;
        </Link>
        <Link className="btn" href="/app" style={{ minWidth: 200, justifyContent: 'center' }}>
          Open the real console
        </Link>
        <p
          style={{
            color: 'var(--color-ink-faint)',
            fontSize: '0.85rem',
            margin: 0,
            flexBasis: '100%',
          }}
        >
          The sandbox runs the full bind &rarr; declare &rarr; enforce &rarr; revoke path against real
          on-chain transactions &mdash; nothing to install.
        </p>
      </section>
    </main>
  );
}
