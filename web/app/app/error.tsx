// File: web/app/app/error.tsx
// Client error boundary for the console segment (real error state, never a fake success).
'use client';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '4rem 1.25rem' }}>
      <p className="eyebrow">real console</p>
      <h1 style={{ fontSize: 'var(--text-h2)', marginTop: '0.5rem', color: 'var(--color-deny)' }}>The console hit a real error</h1>
      <p style={{ color: 'var(--color-ink-dim)', marginTop: '0.75rem' }}>
        A rail was unreachable or a call failed. This is a real error state — no fabricated success is shown.
      </p>
      <pre className="code panel" style={{ padding: '1rem', marginTop: '1rem' }}>{error.message}</pre>
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => reset()}>Retry</button>
    </main>
  );
}
