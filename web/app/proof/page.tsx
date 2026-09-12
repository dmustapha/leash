// File: web/app/proof/page.tsx
// Judge proof surface (#22). Server component. Renders the committed machine ledger
// (docs/pipeline/claims.json) so this page and submission/proof.md never drift: the deployed
// contracts, the resolvable tx/topic pointers, and the three prize legs (ENS revoke / Hedera
// gas-free / Privy DENY), each linked to Etherscan / HashScan / Mirror Node.
//
// Isolation (INVARIANT #10): imports ONLY the static JSON ledger + globals.css tokens (via layout).
// No /app import edge, no Privy, no client state. Honest framing (INVARIANT #4): enforcement is the
// facilitator we run reading the org's ENS-declared policy; the chain stores the policy and the
// revocation, it does not itself stop a payment. The rendered copy makes no over-claim.
import Link from 'next/link';
import ledger from '../../../docs/pipeline/claims.json';

export const metadata = {
  title: 'LEASH — On-Chain Proof',
  description: 'Every headline LEASH claim, each with a resolvable on-chain pointer.',
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
      {links.map((l) => (
        <ExtLink key={l.label + l.href} href={l.href}>
          {l.label} ↗
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
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(2rem, 5vw, 4rem) 1.25rem' }}>
      <p className="eyebrow">Judge proof · Sepolia + Hedera testnet</p>
      <h1 style={{ fontSize: 'var(--text-display)', lineHeight: 1.05, marginTop: '0.5rem' }}>
        Every claim resolves on-chain.
      </h1>
      <p style={{ maxWidth: '58ch', color: 'var(--color-ink-dim)', marginTop: '1rem' }}>
        The facilitator we run reads the org&rsquo;s ENS-declared policy before it settles a payment, and
        Privy is the independent second rail on funding. The chain stores the policy and the revocation;
        it does not itself stop a payment. Recompute with <code className="code">npm run verify:claims</code>.
      </p>

      <section aria-labelledby="contracts" style={{ marginTop: '2.5rem' }}>
        <h2 id="contracts" style={{ fontSize: 'var(--text-h2)' }}>
          Deployed contracts
        </h2>
        <div className="panel" style={{ padding: '1rem 1.1rem', marginTop: '0.9rem' }}>
          {Object.entries(contracts).map(([name, addr]) => (
            <div
              key={name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                padding: '0.35rem 0',
              }}
            >
              <span style={{ color: 'var(--color-ink-dim)', fontSize: '0.85rem' }}>{name}</span>
              <ExtLink href={`${ETHERSCAN}/address/${addr}`}>{addr}</ExtLink>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="legs" style={{ marginTop: '2.5rem' }}>
        <h2 id="legs" style={{ fontSize: 'var(--text-h2)' }}>
          Three-prize integration proof
        </h2>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '0.9rem' }}>
          {claims.map((c) => (
            <article key={c.id} className="card" style={{ padding: '1.1rem 1.2rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="pill pill-amber">{legLabel[c.leg] ?? c.leg}</span>
                <span className="eyebrow">{c.id}</span>
              </div>
              <p style={{ marginTop: '0.7rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>{c.claim}</p>
              <PointerLinks pointer={c.pointer} />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="identity" style={{ marginTop: '2.5rem' }}>
        <h2 id="identity" style={{ fontSize: 'var(--text-h2)' }}>
          ENS agent identity (advisory)
        </h2>
        <p style={{ maxWidth: '58ch', color: 'var(--color-ink-dim)', marginTop: '0.9rem' }}>
          Each agent child carries advisory ENS text records alongside its enforcement record{' '}
          <code className="code">leash.policy</code>:{' '}
          <code className="code">agent.type</code>, <code className="code">agent.description</code>,{' '}
          <code className="code">avatar</code>, and an optional <code className="code">erc8004</code> pointer.
          These are for humans and directories only — the facilitator&rsquo;s enforcement path imports no identity
          reader (INVARIANT #13, asserted by an import-graph test), so identity can never change a spend decision.
          Live on each card in <Link className="link-tx" href="/demo">/demo</Link> and{' '}
          <Link className="link-tx" href="/app">/app</Link>.
        </p>
      </section>

      <section aria-labelledby="reframe" style={{ marginTop: '2.5rem' }}>
        <h2 id="reframe" style={{ fontSize: 'var(--text-h2)' }}>
          Govern existing agents (reframe)
        </h2>
        <p style={{ maxWidth: '58ch', color: 'var(--color-ink-dim)', marginTop: '0.9rem' }}>
          LEASH doesn&rsquo;t mint agents — it binds ones that already exist and puts a spend-control plane around them.
          Each property below is honest about its boundary: LEASH co-controls spend, but the cap is enforced by
          LEASH&rsquo;s decision to co-sign, <strong>not</strong> by the chain (a facilitator-trusted boundary — never trustless).
        </p>
        <ul style={{ marginTop: '0.9rem', display: 'grid', gap: '0.6rem', listStyle: 'none', padding: 0 }}>
          <li className="card" style={{ padding: '0.9rem 1.1rem' }}>
            <strong>2-of-2 co-signed spending account.</strong>{' '}
            <span style={{ color: 'var(--color-ink-dim)' }}>
              The agent holds one Hedera key, LEASH the other. The agent alone can&rsquo;t spend
              (<code className="code">MISSING_COSIGN</code>); LEASH alone can&rsquo;t move the agent&rsquo;s funds (it never holds the
              agent&rsquo;s private key). Facilitator-trusted co-sign, not chain-enforced.
            </span>
          </li>
          <li className="card" style={{ padding: '0.9rem 1.1rem' }}>
            <strong>On-chain-resolved external identity.</strong>{' '}
            <span style={{ color: 'var(--color-ink-dim)' }}>
              Register resolves an ERC-8004 <code className="code">agentId</code> / EVM address against the Identity Registry
              (<code className="code">0x8004A818…</code>) and writes advisory ENS records. Labeled
              &ldquo;on-chain-resolved&rdquo;, not &ldquo;verified&rdquo; — <code className="code">ownerOf</code> is not proof-of-control.
            </span>
          </li>
          <li className="card" style={{ padding: '0.9rem 1.1rem' }}>
            <strong>Rolling &amp; window limits.</strong>{' '}
            <span style={{ color: 'var(--color-ink-dim)' }}>
              Rolling daily / weekly caps (<code className="code">OVER_DAILY_CAP</code> / <code className="code">OVER_WEEKLY_CAP</code>) and a
              stateless UTC time-window (<code className="code">OUTSIDE_WINDOW</code>). The rolling caps are SOFT budgets over the
              lagging HCS mirror index; the per-call cap stays the hard bound.
            </span>
          </li>
        </ul>
      </section>

      <p style={{ marginTop: '2.5rem', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
        Full write-up: <code className="code">submission/proof.md</code>. Machine ledger:{' '}
        <code className="code">docs/pipeline/claims.json</code>.
      </p>
      <p style={{ marginTop: '1.25rem' }}>
        <Link className="btn" href="/">
          ← Back
        </Link>
      </p>
    </main>
  );
}
