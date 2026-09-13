// File: web/app/demo/loading.tsx
// Skeleton for the sandbox route while the server component resolves (never a blank screen).
// Mirrors the real layout: header, split A/B instrument, beat grid.
export default function DemoLoading() {
  return (
    <div style={{ minHeight: '100dvh' }}>
      <main className="wrap-narrow" style={{ padding: 'clamp(1.75rem, 4vw, 3rem) 0 4rem' }}>
        <span className="pill pill-idle">judge sandbox · loading…</span>
        <div className="fade-in" style={{ height: 44, width: '62%', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', margin: '1.1rem 0 0.7rem' }} />
        <div style={{ height: 18, width: '86%', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-sm)', marginBottom: '1.75rem' }} />
        <div className="split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ height: 260 }} />
          <div className="card" style={{ height: 260 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem', marginTop: '2rem' }}>
          <div className="panel" style={{ height: 88 }} />
          <div className="panel" style={{ height: 88 }} />
          <div className="panel" style={{ height: 88 }} />
          <div className="panel" style={{ height: 88 }} />
        </div>
      </main>
      <style>{`@media (max-width:819px){ .split-grid{ grid-template-columns:1fr; } }`}</style>
    </div>
  );
}
