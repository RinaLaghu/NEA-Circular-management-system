function StatCard({ title, value, footer, accent = "blue" }) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <p className="stat-title">{title}</p>
      <h2 className="stat-value">{value}</h2>
      <p className="stat-footer">{footer}</p>
    </div>
  );
}

export default StatCard;