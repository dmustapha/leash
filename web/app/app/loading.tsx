// File: web/app/app/loading.tsx
// Skeleton for the console route while it resolves (never a blank screen). Matches the fleet layout: a header,
// a stats row, and a card grid.
export default function AppLoading() {
  return (
    <main className="wrap" style={{ paddingBlock: 'clamp(1.75rem, 4vw, 3rem) 4rem' }} aria-busy>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div className="card" style={{ height: 92, opacity: 0.6 }} />
        <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          {[0, 1, 2, 3].map((i) => <div key={i} className="panel" style={{ height: 96, opacity: 0.6 }} />)}
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {[0, 1, 2].map((i) => <div key={i} className="card" style={{ height: 220, opacity: 0.5 }} />)}
        </div>
      </div>
    </main>
  );
}
