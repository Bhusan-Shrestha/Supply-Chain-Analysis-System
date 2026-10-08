const STAGES = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

// Renders an order's lifecycle as a cargo-manifest style stamp trail.
export default function ManifestStrip({ status, history = [] }) {
  const isCancelled = status === 'Cancelled';
  const currentIndex = STAGES.indexOf(status);

  const timestampFor = (stage) => {
    const entry = history.find(h => h.status === stage);
    if (!entry) return null;
    return new Date(entry.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isCancelled) {
    return (
      <div className="manifest-strip">
        <div className="manifest-stop done">
          <div className="dot" />
          <div className="stamp">Pending<small>{timestampFor('Pending')}</small></div>
        </div>
        <div className="manifest-stop current" style={{ minWidth: 140 }}>
          <div className="rail" />
          <div className="dot" style={{ background: 'var(--danger)', outlineColor: 'var(--danger)' }} />
          <div className="stamp" style={{ color: 'var(--danger)' }}>Cancelled<small>{timestampFor('Cancelled')}</small></div>
        </div>
      </div>
    );
  }

  return (
    <div className="manifest-strip">
      {STAGES.map((stage, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div key={stage} className={`manifest-stop ${state}`}>
            <div className="rail" />
            <div className="dot" />
            <div className="stamp">
              {stage}
              <small>{timestampFor(stage) || '—'}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
