// File: web/app/demo/loading.tsx
// Skeleton for the sandbox route while the server component resolves (never a blank screen).
export default function DemoLoading() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      <p className="eyebrow">judge sandbox · loading…</p>
      <div style={{ height: 40, width: '60%', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="split-grid">
        <div className="panel" style={{ height: 220 }} />
        <div className="panel" style={{ height: 220 }} />
      </div>
    </main>
  );
}
