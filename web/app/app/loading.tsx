// File: web/app/app/loading.tsx
// Skeleton for the console route while it resolves (never a blank screen).
export default function AppLoading() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(1.5rem, 4vw, 3rem) 1.25rem' }}>
      <p className="eyebrow">real console · loading…</p>
      <div style={{ height: 40, width: '50%', background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', margin: '1rem 0' }} />
      <div className="panel" style={{ height: 160 }} />
    </main>
  );
}
