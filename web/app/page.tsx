// File: web/app/page.tsx
// Owner-picked landing (Direction 4 "Signal Grid"), ported faithfully into the production app.
// SERVER component (static) rendering <SiteNav/>. The only client code is the <HeroFleet/> island
// (Privy-free), so this tree keeps zero import edge to /app (INVARIANT #10). No hardcoded hex:
// color comes from design tokens / globals classes. Honesty locks are load-bearing:
//   - the facilitator LEASH runs enforces the limits you set
//   - the chain stores the policy and records the revocation
//   - Privy is the independent funding rail
//   - identity is on-chain-resolved (never "verified")
//   - LEASH binds agents, it does not mint them
// COPY RULE: no em dashes anywhere.
import Link from 'next/link';
import SiteNav from '../components/SiteNav';
import Reveal from '../components/Reveal';
import HeroFleet from '../components/HeroFleet';

// Bind, Declare, Enforce, Revoke.
const BEATS = [
  {
    num: '01 / BIND',
    t: 'Bind',
    d: 'Connect an agent you already run to an on-chain-resolved identity and a co-owned account.',
  },
  {
    num: '02 / DECLARE',
    t: 'Declare',
    d: 'Set a hard per-payment cap, a soft daily or weekly budget, an allowlist, and active hours.',
  },
  {
    num: '03 / ENFORCE',
    t: 'Enforce',
    d: 'The facilitator LEASH runs enforces the limits you set. Gas-free. Every decision logged.',
  },
  {
    num: '04 / REVOKE',
    t: 'Revoke',
    d: 'One on-chain write cuts an agent off everywhere. Its next payment fails closed.',
  },
];

// The problem: a raw key has no cap and no off-switch.
const PROBLEMS = [
  {
    t: 'No cap',
    d: 'A raw agent key can drain an account. There is no per-payment ceiling, no daily budget, no off-hours guard.',
  },
  {
    t: 'No off-switch',
    d: 'Cutting a leaked agent today means touching every service it can reach, by hand, one at a time.',
  },
  {
    t: 'No proof',
    d: 'When an agent pays, there is no shared record of what was allowed and what was blocked.',
  },
];

// On-chain proof strip (values only, no dashes).
const PROOF = [
  { k: 'ENS ETHRegistry, Sepolia', v: '0x67b728a792e789a8978b30cf1b3b641f19354b43' },
  { k: 'ERC-8004 Identity Registry, Sepolia', v: '0x8004A818BFB912233c491871b3d84c89A494BD9e' },
  { k: 'Kill-switch grant tx', v: '0x31559a9b7300bb5e4eeb8759d7e1285f14b423050ae451eb16f187eab49e0101' },
  { k: 'Co-signed payment settles, Hedera testnet', v: 'KeyList account 0.0.10508343' },
];

export default function Landing() {
  return (
    <>
      <SiteNav />
      <main style={{ minHeight: '100dvh', position: 'relative' }}>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="hero-title"
          className="wrap"
          style={{ paddingBlock: 'clamp(3.5rem, 9vw, 7rem) clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          <div className="hero-grid">
            <div>
              <p className="eyebrow rise rise-1" style={{ color: 'var(--color-accent)' }}>
                ENS · Hedera x402 · Privy
              </p>
              <h1
                id="hero-title"
                className="rise rise-2"
                style={{ fontSize: 'var(--text-display)', maxWidth: '15ch', marginTop: '0.9rem', letterSpacing: '-0.02em' }}
              >
                Keep your agents on a{' '}
                <span style={{ color: 'var(--color-accent)' }}>Leash.</span>
              </h1>
              <p
                className="rise rise-3"
                style={{
                  maxWidth: '38ch',
                  color: 'var(--color-ink-dim)',
                  fontSize: 'clamp(1.02rem, 0.9rem + 0.5vw, 1.28rem)',
                  marginTop: '1.25rem',
                  lineHeight: 1.6,
                }}
              >
                LEASH keeps your AI agents on a leash. Bind each one to
                an on-chain identity, a co-owned account, and the limits you set, then cut off any
                agent everywhere with one on-chain write.
              </p>

              <div
                className="rise rise-4"
                style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.9rem', marginTop: '2rem' }}
              >
                <Link className="btn btn-primary" href="/app" style={{ minWidth: '14rem', justifyContent: 'center' }}>
                  Open your console &rarr;
                </Link>
                <Link className="link-tx" href="/demo" style={{ fontSize: '0.8rem', borderBottomStyle: 'dashed' }}>
                  Try the live demo, no login &rarr;
                </Link>
              </div>

              <div className="stats-row rise rise-5">
                <div className="stat">
                  <b>1 write</b>
                  <span>cut off everywhere</span>
                </div>
                <div className="stat">
                  <b>2-of-2</b>
                  <span>co-owned account</span>
                </div>
                <div className="stat">
                  <b>gas-free</b>
                  <span>agent pays $0</span>
                </div>
              </div>
            </div>

            <div className="rise rise-3">
              <HeroFleet />
            </div>
          </div>
        </section>

        {/* ── THE PROBLEM ─────────────────────────────────────────────────── */}
        <section aria-labelledby="prob-title" className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
          <div className="two-col">
            <div>
              <Reveal className="eyebrow" style={{ display: 'block' }}>The problem</Reveal>
              <Reveal as="h2" delay={60} id="prob-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', maxWidth: '18ch', letterSpacing: '-0.02em' }}>
                A raw key has no cap and no off-switch.
              </Reveal>
              <Reveal as="p" delay={100} style={{ color: 'var(--color-ink-dim)', marginTop: '0.9rem', maxWidth: '54ch', fontSize: '1.05rem' }}>
                Companies now run fleets of autonomous agents that pay for things on their own. Every
                one of them is holding a key that can spend without limit, and if one leaks, there is
                no single lever to pull.
              </Reveal>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.9rem' }}>
              {PROBLEMS.map((p, i) => (
                <Reveal
                  as="li"
                  key={p.t}
                  delay={i * 70}
                  className="panel"
                  style={{ padding: '1rem 1.1rem', borderLeft: '3px solid var(--color-deny)' }}
                >
                  <b style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '0.2rem', fontSize: '1.02rem' }}>{p.t}</b>
                  <span style={{ color: 'var(--color-ink-dim)', fontSize: '0.94rem' }}>{p.d}</span>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <section aria-labelledby="how-title" style={{ background: 'var(--color-surface-1)', borderBlock: '1px solid var(--color-line-soft)' }}>
          <div className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
            <Reveal className="eyebrow" style={{ display: 'block' }}>How it works</Reveal>
            <Reveal as="h2" delay={60} id="how-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
              Bind, Declare, Enforce, Revoke.
            </Reveal>
            <div className="beats-grid">
              {BEATS.map((b, i) => (
                <Reveal
                  key={b.num}
                  delay={i * 60}
                  className="panel card-hover"
                  style={{ padding: '1.5rem 1.25rem', position: 'relative', overflow: 'hidden' }}
                >
                  <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, height: '2px', width: '100%', background: 'linear-gradient(90deg, var(--color-accent), transparent)', opacity: 0.5 }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-accent)', letterSpacing: '0.1em', marginBottom: '0.9rem' }}>{b.num}</div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{b.t}</h3>
                  <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem' }}>{b.d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── THE ONE-WRITE KILL, A/B money shot ──────────────────────────── */}
        <section aria-labelledby="kill-title" className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
          <Reveal
            className="card"
            style={{
              padding: 'clamp(1.5rem, 4vw, 3rem)',
              background: 'radial-gradient(circle at 50% 0%, rgba(198,242,77,0.06), transparent 55%), var(--color-surface-1)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), var(--shadow-2)',
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '40rem', margin: '0 auto' }}>
              <span className="eyebrow" style={{ color: 'var(--color-accent)' }}>The one-write kill</span>
              <h2 id="kill-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', letterSpacing: '-0.02em' }}>
                Revoke once. Blocked everywhere. Instantly.
              </h2>
              <p style={{ color: 'var(--color-ink-dim)', margin: '0.85rem auto 0', maxWidth: '52ch', fontSize: '1.02rem' }}>
                The same $3 payment to <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>api.acme.dev</code>, before and after one on-chain write.
              </p>
            </div>

            <div className="kill-ab" role="group" aria-label="A payment before and after revocation">
              {/* ACTIVE */}
              <div className="raised kill-state" style={{ borderColor: 'rgba(79,208,138,0.4)', boxShadow: '0 0 30px rgba(79,208,138,0.1)' }}>
                <div className="k-label">Active</div>
                <div className="k-agent">data.acme.leash.eth pays api.acme.dev</div>
                <div className="k-result" style={{ color: 'var(--color-allow)' }}>✓ Paid $3</div>
              </div>

              {/* ARROW */}
              <div className="kill-arrow" aria-hidden="true">
                <span className="big">&rarr;</span>
                <small>one on-chain write<br />revokes the agent</small>
              </div>

              {/* REVOKED */}
              <div className="raised kill-state" style={{ borderColor: 'rgba(255,93,108,0.4)', boxShadow: '0 0 30px rgba(255,93,108,0.1)' }}>
                <div className="k-label">Revoked, cut off everywhere</div>
                <div className="k-agent">data.acme.leash.eth pays api.acme.dev</div>
                <div className="k-result" style={{ color: 'var(--color-deny)' }}>✕ Blocked, revoked</div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── WHAT YOU CONTROL, six levers ────────────────────────────────── */}
        <section aria-labelledby="control-title" style={{ background: 'var(--color-surface-1)', borderBlock: '1px solid var(--color-line-soft)' }}>
          <div className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
            <Reveal className="eyebrow" style={{ display: 'block' }}>What you control</Reveal>
            <Reveal as="h2" delay={60} id="control-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
              Six levers. One of them cuts the cord.
            </Reveal>

            <div className="levers-grid">
              {/* Kill-switch, emphasized, spans / reads accent */}
              <Reveal
                className="card card-hover lever-kill"
                style={{
                  padding: '1.4rem',
                  background: 'radial-gradient(circle at 30% 0%, rgba(198,242,77,0.1), transparent 60%), var(--color-surface-1)',
                  borderColor: 'rgba(198,242,77,0.4)',
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                <span className="lever-ico" style={{ background: 'var(--color-accent-soft)', borderColor: 'rgba(198,242,77,0.4)', color: 'var(--color-accent)' }} aria-hidden="true">⏻</span>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-accent)', marginTop: '0.75rem' }}>Kill-switch</h3>
                <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
                  One on-chain write revokes the agent everywhere; the next payment fails closed.
                  Reversible: reactivate any time.
                </p>
              </Reveal>

              <Lever glyph="◆" title="Identity" sponsor="ENS · ERC-8004">
                Bind the agent&rsquo;s external on-chain-resolved ERC-8004 / EVM identity.{' '}
                <span className="pill pill-accent" style={{ marginTop: '0.5rem', display: 'inline-flex' }}>on-chain-resolved</span>
              </Lever>
              <Lever glyph="⧉" title="Co-owned account" sponsor="Hedera x402">
                A 2-of-2 Hedera account: the agent and LEASH must both approve. Neither spends alone.
              </Lever>
              <Lever glyph="▤" title="Limits">
                A hard per-payment cap, optional rolling daily or weekly soft budgets, and an
                active-hours window.
              </Lever>
              <Lever glyph="◈" title="Funding" sponsor="Privy">
                Privy is the independent funding rail. An over-fund is denied before it goes out.
              </Lever>
              <Lever glyph="▦" title="Audit">
                Every ALLOW or DENY decision is logged to Hedera Consensus Service. Watch a live spend
                feed.
              </Lever>
            </div>
          </div>
        </section>

        {/* ── THE HONEST MODEL, progressive disclosure ────────────────────── */}
        <section aria-labelledby="honest-title" className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
          <Reveal className="eyebrow" style={{ display: 'block' }}>The honest model</Reveal>
          <Reveal as="h2" delay={60} id="honest-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            What is true, and what is not.
          </Reveal>

          <Reveal delay={100}>
            <details className="card" style={{ overflow: 'hidden' }}>
              <summary className="honest-summary">
                Read the honest model
                <span aria-hidden="true" className="honest-caret">&rarr;</span>
              </summary>
              <div style={{ padding: '0 clamp(1.25rem, 3vw, 1.75rem) clamp(1.25rem, 3vw, 1.75rem)' }}>
                <div className="honest-grid">
                  <HonestItem title="It is a corporate-card model, not trustless.">
                    You keep control and independence, but this is not trust-free. The facilitator
                    LEASH runs enforces the limits you set.
                  </HonestItem>
                  <HonestItem title="The chain stores the policy and records the revocation.">
                    What is on-chain is the spend policy and the kill event, not the payment path
                    enforcement.
                  </HonestItem>
                  <HonestItem title="Identity is on-chain-resolved, not verified.">
                    We resolve the agent&rsquo;s external ERC-8004 / EVM identity on-chain. We do not
                    attest to who is behind it.
                  </HonestItem>
                  <HonestItem title="Rolling caps are a soft budget.">
                    Daily and weekly limits are best-effort rolling budgets, not exact on-chain
                    ceilings.
                  </HonestItem>
                  <HonestItem title="Privy is the independent funding rail.">
                    Privy funds the account and denies an over-fund before it goes out. Privy does not
                    co-sign payments.
                  </HonestItem>
                  <HonestItem title="LEASH binds agents, it does not mint them.">
                    You bring an agent you already run. LEASH binds it to identity, an account, and
                    limits.
                  </HonestItem>
                </div>
                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
                  <span className="pill pill-allow">Control ✓ TRUE</span>
                  <span className="pill pill-allow">Independence ✓ TRUE</span>
                  <span className="pill pill-deny">Trustlessness ✕ FALSE</span>
                </div>
              </div>
            </details>
          </Reveal>
        </section>

        {/* ── ON-CHAIN PROOF STRIP ────────────────────────────────────────── */}
        <section aria-labelledby="proof-title" style={{ background: 'var(--color-surface-1)', borderBlock: '1px solid var(--color-line-soft)' }}>
          <div className="wrap" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
            <Reveal className="eyebrow" style={{ display: 'block', color: 'var(--color-accent)' }}>On-chain proof</Reveal>
            <Reveal as="h2" delay={60} id="proof-title" style={{ fontSize: 'var(--text-h1)', marginTop: '0.7rem', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Every claim resolves on-chain.
            </Reveal>
            <div className="proof-grid">
              {PROOF.map((row, i) => (
                <Reveal key={row.k} delay={i * 55} className="panel" style={{ padding: '1rem 1.1rem' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-ink-dim)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span aria-hidden="true" style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)', flex: 'none' }} />
                    {row.k}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-accent)', wordBreak: 'break-all' }}>{row.v}</div>
                </Reveal>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link className="btn btn-ghost btn-sm" href="/proof">See all proof &rarr;</Link>
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ─────────────────────────────────────────────────── */}
        <section aria-label="Get started" className="wrap" style={{ paddingBlock: 'clamp(3.5rem, 7vw, 6rem)', textAlign: 'center' }}>
          <div style={{ background: 'radial-gradient(circle at 50% 0%, rgba(198,242,77,0.08), transparent 60%)', borderRadius: 'var(--radius-xl)', paddingBlock: '1rem' }}>
            <Reveal as="h2" style={{ fontSize: 'var(--text-display)', letterSpacing: '-0.02em' }}>
              Take the leash.
            </Reveal>
            <Reveal as="p" delay={60} style={{ color: 'var(--color-ink-dim)', margin: '0.9rem auto 0', maxWidth: '48ch' }}>
              Bind your fleet, set your limits, and keep a kill-switch you can pull in one write.
            </Reveal>
            <Reveal delay={100} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem' }}>
              <Link className="btn btn-primary" href="/app" style={{ minWidth: '14rem', justifyContent: 'center' }}>
                Open your console &rarr;
              </Link>
              <Link className="link-tx" href="/demo" style={{ fontSize: '0.8rem', borderBottomStyle: 'dashed' }}>
                Try the live demo, no login &rarr;
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── minimal footer ──────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid var(--color-line-soft)' }}>
          <div
            className="wrap"
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', paddingBlock: '1.75rem', color: 'var(--color-ink-faint)', fontSize: '0.82rem' }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--color-ink-dim)' }}>LEASH</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>The control layer for your AI agent fleet.</span>
            <span style={{ flex: 1 }} />
            <Link className="nav-link" href="/proof">Proof</Link>
            <Link className="nav-link" href="/demo">Live demo</Link>
            <span style={{ fontFamily: 'var(--font-mono)' }}>ENS · Hedera x402 · Privy</span>
          </div>
        </footer>
      </main>

      {/* Layout helpers scoped to the landing. Grids + kinetic-A/B styles that have no globals
          equivalent; all color comes from tokens, so this stays inside the design system. */}
      <style>{`
        .hero-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; }
        @media (min-width: 960px) { .hero-grid { grid-template-columns: 1.05fr 0.95fr; gap: 3.5rem; } }

        .stats-row {
          display: flex; flex-wrap: wrap; margin-top: 2.5rem;
          border: 1px solid var(--color-line); border-radius: var(--radius-md);
          overflow: hidden; background: var(--color-surface-1); box-shadow: var(--shadow-1);
        }
        .stats-row .stat { flex: 1; min-width: 150px; padding: 1.1rem 1.25rem; border-right: 1px solid var(--color-line); }
        .stats-row .stat:last-child { border-right: none; }
        .stats-row .stat b { display: block; font-family: var(--font-display); font-weight: 700; font-size: 1.3rem; color: var(--color-accent); letter-spacing: -0.01em; }
        .stats-row .stat span { font-size: 0.78rem; color: var(--color-ink-dim); }

        .two-col { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 820px) { .two-col { grid-template-columns: 1.1fr 1fr; gap: 2.5rem; align-items: center; } }

        .beats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        @media (min-width: 840px) { .beats-grid { grid-template-columns: repeat(4, 1fr); } }

        .kill-ab { display: grid; grid-template-columns: 1fr; gap: 1.25rem; align-items: stretch; margin-top: 1.75rem; }
        @media (min-width: 760px) { .kill-ab { grid-template-columns: 1fr auto 1fr; gap: 0.9rem; align-items: center; } }
        .kill-state { padding: 1.6rem 1.5rem; text-align: center; }
        .kill-state .k-label { font-family: var(--font-mono); font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-ink-faint); margin-bottom: 0.9rem; }
        .kill-state .k-agent { font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-ink-dim); margin-bottom: 1.1rem; word-break: break-word; }
        .kill-state .k-result { font-family: var(--font-display); font-weight: 600; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
        .kill-arrow { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; color: var(--color-accent); font-family: var(--font-mono); font-size: 0.68rem; text-align: center; }
        .kill-arrow .big { font-size: 1.6rem; line-height: 1; }
        .kill-arrow small { color: var(--color-ink-dim); }
        @media (max-width: 759px) { .kill-arrow { flex-direction: row; gap: 0.6rem; } }

        .levers-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 720px) { .levers-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1000px) { .levers-grid { grid-template-columns: repeat(3, 1fr); grid-auto-flow: dense; } }
        .lever-ico {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; font-size: 1.15rem;
          border-radius: var(--radius-md); background: var(--color-surface-2); border: 1px solid var(--color-line);
        }
        @media (min-width: 1000px) {
          .lever-kill { grid-row: span 2; display: flex; flex-direction: column; justify-content: center; }
        }

        .honest-summary {
          list-style: none; cursor: pointer;
          padding: 1.25rem clamp(1.25rem, 3vw, 1.75rem);
          display: flex; align-items: center; gap: 0.9rem;
          font-family: var(--font-display); font-weight: 600; font-size: 1.15rem;
        }
        .honest-summary::-webkit-details-marker { display: none; }
        .honest-caret { margin-left: auto; color: var(--color-accent); transition: transform 200ms ease; }
        details[open] .honest-caret { transform: rotate(90deg); }
        .honest-grid { display: grid; grid-template-columns: 1fr; gap: 0.8rem; }
        @media (min-width: 720px) { .honest-grid { grid-template-columns: 1fr 1fr; } }

        .proof-grid { display: grid; grid-template-columns: 1fr; gap: 0.8rem; }
        @media (min-width: 720px) { .proof-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </>
  );
}

// One control lever card.
function Lever({ glyph, title, sponsor, children }: { glyph: string; title: string; sponsor?: string; children: React.ReactNode }) {
  return (
    <Reveal className="card card-hover" style={{ padding: '1.4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
        <span className="lever-ico" aria-hidden="true">{glyph}</span>
        {sponsor && <span className="badge" style={{ fontSize: '0.66rem' }}>{sponsor}</span>}
      </div>
      <h3 style={{ fontSize: '1.15rem', marginTop: '0.75rem' }}>{title}</h3>
      <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem', marginTop: '0.35rem' }}>{children}</p>
    </Reveal>
  );
}

// One honest-model item inside the fold.
function HonestItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="raised" style={{ padding: '1rem 1.1rem' }}>
      <b style={{ display: 'block', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '0.25rem' }}>{title}</b>
      <span style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem' }}>{children}</span>
    </div>
  );
}
