export default function StatGrid({ stats }) {
  return (
    <div className="grid-stats">
      {stats.map(s => (
        <div className="stat" key={s.label}>
          <div className="num">{s.value}</div>
          <div className="label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
