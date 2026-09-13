// File: web/app/demo/error.tsx
// Client error boundary for the sandbox segment (real error state, never a fake success).
'use client';

export default function DemoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
      <main className="wrap-narrow fade-in" style={{ maxWidth: 640, padding: '3rem 0' }}>
        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '0.9rem' }}>
          <span className="pill pill-deny" style={{ justifySelf: 'start' }}>judge sandbox · error</span>
          <h1 style={{ fontSize: 'var(--text-h2)', color: 'var(--color-deny)' }}>The sandbox hit a real error</h1>
          <p style={{ color: 'var(--color-ink-dim)' }}>
            A rail was unreachable or a call failed. This is a real error state, no fabricated success is shown.
          </p>
          <pre className="code raised" style={{ padding: '0.9rem 1rem', margin: 0 }}>{error.message}</pre>
          <button className="btn btn-primary" style={{ justifySelf: 'start' }} onClick={() => reset()}>Retry</button>
        </div>
      </main>
    </div>
  );
}
