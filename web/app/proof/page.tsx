// File: web/app/proof/page.tsx
// Verification surface. Server component in the "Signal Grid" system.
// Renders the committed machine ledger (docs/pipeline/claims.json) so this page and
// submission/proof.md never drift: the deployed contracts, the resolvable tx/topic pointers, and
// each integration (ENS policy + revoke / Hedera x402 gas-free settle + HCS audit / Privy funding
// rail), linked to Etherscan / HashScan / Mirror Node.
//
// Isolation (INVARIANT #10): imports ONLY the static JSON ledger + globals.css tokens (via layout)
// + the Privy-free SiteNav / Reveal islands. No /app import edge, no Privy, no client state. Honest
// framing (INVARIANT #4): the facilitator LEASH runs enforces the org's ENS-declared policy; the
// chain stores the policy and the revocation, it does not itself stop a payment. Identity is
// on-chain-resolved, not verified.
import Link from 'next/link';
import ledger from '../../../docs/pipeline/claims.json';
import SiteNav from '../../components/SiteNav';
import Reveal from '../../components/Reveal';

export const metadata = {
  title: 'LEASH · How verification works',
  description: 'What each LEASH integration does, and the on-chain evidence behind it.',
};

type Pointer = Record<string, unknown>;
interface Claim {
  id: string;
  leg: string;
  claim: string;
  asserted: Record<string, unknown>;
  pointer: Pointer;
}

const ETHERSCAN = 'https://sepolia.etherscan.io';
const legLabel: Record<string, string> = { ens: 'ENS', hedera: 'Hedera x402', privy: 'Privy' };
// One line per integration: what it does, so the evidence below reads as product behavior.
const legBlurb: Record<string, string> = {
  ens: 'ENS holds the org policy on-chain. The facilitator reads it before it settles a payment, and one on-chain write clears it to cut an agent off.',
  hedera: 'Hedera x402 settles the payment gas-free for the agent and writes every ALLOW or DENY decision to an immutable HCS audit topic.',
  privy: 'Privy is the independent funding rail. It funds the account and fails an over-fund closed before it goes out.',
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className="link-tx" href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

// Render every resolvable pointer on a claim as a labeled external link.
function PointerLinks({ pointer }: { pointer: Pointer }) {
  const links: Array<{ label: string; href: string }> = [];
  const kind = pointer.kind as string | undefined;

  for (const key of ['registerTx', 'setTextTx', 'txHash', 'inCapTxHash'] as const) {
    const v = pointer[key];
    if (typeof v === 'string' && kind !== 'hedera_tx') {
      links.push({ label: key, href: `${ETHERSCAN}/tx/${v}` });
    }
  }
  if (typeof pointer.resolver === 'string') {
    links.push({ label: 'resolver', href: `${ETHERSCAN}/address/${pointer.resolver}` });
  }
  if (typeof pointer.explorer === 'string') links.push({ label: 'explorer', href: pointer.explorer });
  if (typeof pointer.mirror === 'string') links.push({ label: 'mirror node', href: pointer.mirror });
  if (kind === 'hedera_tx' && typeof pointer.inCapTxHash === 'string') {
    links.push({
      label: 'in-cap transfer',
      href: `https://testnet.mirrornode.hedera.com/api/v1/contracts/results/${pointer.inCapTxHash}`,
    });
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginTop: '0.85rem', alignItems: 'center' }}>
      {links.map((l) => (
        <ExtLink key={l.label + l.href} href={l.href}>
          {l.label} &#8599;
        </ExtLink>
      ))}
      {typeof pointer.note === 'string' && (
        <span style={{ color: 'var(--color-ink-faint)', fontSize: '0.8rem' }}>{pointer.note}</span>
      )}
    </div>
  );
}

export default function ProofPage() {
  const claims = ledger.claims as Claim[];
  const contracts = ledger.contracts as Record<string, string>;

  return (
    <>
      <SiteNav />
      <main style={{ minHeight: '100dvh' }}>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="wrap-narrow" style={{ paddingBlock: 'clamp(3rem, 7vw, 5.5rem)' }}>
          <p className="eyebrow rise rise-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="dot-live" aria-hidden="true" /> How verification works · Sepolia + Hedera testnet
          </p>
          <h1 className="rise rise-2" style={{ fontSize: 'var(--text-display)', marginTop: '0.9rem', maxWidth: '18ch' }}>
            How LEASH works, and the{' '}
            <span style={{ color: 'var(--color-accent)' }}>evidence.</span>
          </h1>
          <p className="rise rise-3" style={{ maxWidth: '60ch', color: 'var(--color-ink-dim)', marginTop: '1.1rem', fontSize: '1.02rem' }}>
            LEASH puts a spend-control plane around agents you already run. The facilitator LEASH runs
            reads the org&rsquo;s ENS-declared policy before it settles a payment, Hedera x402 settles it
            gas-free, and Privy is the independent rail on funding. The chain stores the policy and the
            revocation; it does not itself stop a payment. Every statement below points to a resolvable
            on-chain record, recomputable with{' '}
            <code className="code" style={{ color: 'var(--color-accent)' }}>npm run verify:claims</code>.
          </p>
        </section>

        {/* ── DEPLOYED CONTRACTS ─────────────────────────────────────────── */}
        <section aria-labelledby="contracts" className="wrap-narrow" style={{ paddingBottom: 'clamp(2rem, 5vw, 3.5rem)' }}>
          <Reveal as="h2" id="contracts" style={{ fontSize: 'var(--text-h2)' }}>
            Deployed contracts
          </Reveal>
          <Reveal delay={60} className="panel" style={{ padding: '0.4rem 1.1rem', marginTop: '1rem' }}>
            {Object.entries(contracts).map(([name, addr], i, arr) => (
              <div
                key={name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '0.7rem 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-line-soft)' : undefined,
                }}
              >
                <span className="label">{name}</span>
                <ExtLink href={`${ETHERSCAN}/address/${addr}`}>{addr}</ExtLink>
              </div>
            ))}
          </Reveal>
        </section>

        {/* ── WHAT EACH INTEGRATION DOES ─────────────────────────────────── */}
        <section aria-labelledby="legs" style={{ background: 'var(--color-surface-1)', borderBlock: '1px solid var(--color-line-soft)' }}>
          <div className="wrap-narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4rem)' }}>
            <Reveal as="h2" id="legs" style={{ fontSize: 'var(--text-h2)' }}>
              What each integration does
            </Reveal>
            <Reveal as="p" delay={60} style={{ color: 'var(--color-ink-dim)', marginTop: '0.6rem', maxWidth: '58ch' }}>
              Three integrations carry the spend-control plane. Each card states what an integration
              does and links to the resolvable on-chain record behind it.
            </Reveal>
            <div style={{ display: 'grid', gap: '1.75rem', marginTop: '1.75rem' }}>
              {Object.keys(legLabel)
                .filter((leg) => claims.some((c) => c.leg === leg))
                .map((leg) => (
                  <div key={leg}>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="pill pill-accent">{legLabel[leg]}</span>
                    </div>
                    {legBlurb[leg] && (
                      <p style={{ color: 'var(--color-ink-dim)', marginTop: '0.55rem', maxWidth: '62ch', fontSize: '0.95rem', lineHeight: 1.55 }}>
                        {legBlurb[leg]}
                      </p>
                    )}
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '0.9rem' }}>
                      {claims
                        .filter((c) => c.leg === leg)
                        .map((c, i) => (
                          <Reveal as="article" key={c.id} delay={i * 45} className="card card-hover" style={{ padding: 'clamp(1.1rem, 2.5vw, 1.4rem)' }}>
                            <span className="eyebrow">{c.id}</span>
                            <p style={{ marginTop: '0.55rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>{c.claim}</p>
                            <PointerLinks pointer={c.pointer} />
                          </Reveal>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* ── ENS AGENT IDENTITY (advisory) ──────────────────────────────── */}
        <section aria-labelledby="identity" className="wrap-narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <Reveal as="h2" id="identity" style={{ fontSize: 'var(--text-h2)' }}>
            ENS agent identity <span style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: '0.7em' }}>(advisory)</span>
          </Reveal>
          <Reveal delay={60} className="panel" style={{ padding: 'clamp(1.15rem, 3vw, 1.5rem)', marginTop: '1rem' }}>
            <p style={{ maxWidth: '62ch', color: 'var(--color-ink-dim)' }}>
              Each agent child carries advisory ENS text records alongside its enforcement record{' '}
              <code className="code">leash.policy</code>: <code className="code">agent.type</code>,{' '}
              <code className="code">agent.description</code>, <code className="code">avatar</code>, and an
              optional <code className="code">erc8004</code> pointer. These are for humans and directories
              only. The facilitator&rsquo;s enforcement path imports no identity reader (INVARIANT #13,
              asserted by an import-graph test), so identity can never change a spend decision. Live on
              each card in <Link className="link-tx" href="/demo">/demo</Link> and{' '}
              <Link className="link-tx" href="/app">/app</Link>.
            </p>
          </Reveal>
        </section>

        {/* ── GOVERN EXISTING AGENTS (reframe) ───────────────────────────── */}
        <section aria-labelledby="reframe" style={{ background: 'var(--color-surface-1)', borderTop: '1px solid var(--color-line-soft)' }}>
          <div className="wrap-narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4rem)' }}>
            <Reveal as="h2" id="reframe" style={{ fontSize: 'var(--text-h2)' }}>
              Govern existing agents
            </Reveal>
            <Reveal as="p" delay={60} style={{ maxWidth: '60ch', color: 'var(--color-ink-dim)', marginTop: '0.6rem' }}>
              LEASH binds agents that already exist and puts a spend-control plane around them. Each
              property below is honest about its boundary: LEASH co-controls spend, but the limit is
              enforced by the facilitator LEASH runs deciding to co-sign. The chain stores the policy,
              it does not itself stop a payment.
            </Reveal>

            <ul style={{ marginTop: '1.5rem', display: 'grid', gap: '0.9rem', listStyle: 'none', padding: 0 }}>
              {[
                {
                  t: '2-of-2 co-signed spending account',
                  b: (
                    <>
                      The agent holds one Hedera key, LEASH the other. The agent alone can&rsquo;t spend
                      (<code className="code">MISSING_COSIGN</code>); LEASH alone can&rsquo;t move the
                      agent&rsquo;s funds. It never holds the agent&rsquo;s private key. Facilitator-trusted
                      co-sign.
                    </>
                  ),
                },
                {
                  t: 'On-chain-resolved external identity',
                  b: (
                    <>
                      Register resolves an ERC-8004 <code className="code">agentId</code> / EVM address
                      against the Identity Registry (<code className="code">0x8004A818…</code>) and writes
                      advisory ENS records. Labeled &ldquo;on-chain-resolved&rdquo;, not
                      &ldquo;verified&rdquo;. <code className="code">ownerOf</code> is not
                      proof-of-control.
                    </>
                  ),
                },
                {
                  t: 'Rolling & window limits',
                  b: (
                    <>
                      Rolling daily / weekly caps (<code className="code">OVER_DAILY_CAP</code> /{' '}
                      <code className="code">OVER_WEEKLY_CAP</code>) and a stateless UTC time-window
                      (<code className="code">OUTSIDE_WINDOW</code>). The rolling caps are soft budgets over
                      the lagging HCS mirror index; the per-call cap stays the hard bound.
                    </>
                  ),
                },
              ].map((item, i) => (
                <Reveal as="li" key={item.t} delay={i * 55} className="card card-hover" style={{ padding: 'clamp(1rem, 2.5vw, 1.3rem)' }}>
                  <h3 style={{ fontSize: '1.02rem', fontFamily: 'var(--font-display)', marginBottom: '0.4rem' }}>{item.t}</h3>
                  <p style={{ color: 'var(--color-ink-dim)', fontSize: '0.92rem' }}>{item.b}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FOOTER / BACK ──────────────────────────────────────────────── */}
        <section className="wrap-narrow" style={{ paddingBlock: 'clamp(2.5rem, 6vw, 4rem)' }}>
          <p style={{ color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
            Full write-up: <code className="code">submission/proof.md</code>. Machine ledger:{' '}
            <code className="code">docs/pipeline/claims.json</code>.
          </p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link className="btn btn-ghost" href="/">
              &larr; Back to home
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
