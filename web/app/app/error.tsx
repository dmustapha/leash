// File: web/app/app/error.tsx
// Client error boundary for the console segment (a real error state, never a fake success).
'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="wrap-narrow" style={{ paddingBlock: 'clamp(2.5rem, 8vw, 5rem)' }}>
      <section className="card fade-in" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.9rem', maxWidth: 620 }} role="alert">
        <span className="pill pill-deny" style={{ justifySelf: 'start' }}>something went wrong</span>
        <h1 style={{ fontSize: 'var(--text-h2)', color: 'var(--color-deny)' }}>The console hit a real error</h1>
        <p style={{ color: 'var(--color-ink-dim)', maxWidth: '54ch' }}>
          A connection failed or a call didn&rsquo;t go through. This is a real error, nothing is faked. Try again,
          and if it keeps happening, come back in a moment.
        </p>
        <details>
          <summary style={{ cursor: 'pointer', color: 'var(--color-ink-faint)' }}>Details</summary>
          <pre className="code panel" style={{ padding: '1rem', marginTop: '0.6rem' }}>{error.message}</pre>
        </details>
        <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => reset()}>Try again</button>
      </section>
    </main>
  );
}
