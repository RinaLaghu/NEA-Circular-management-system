function CircularListCard({
  icon = "📄",
  title,
  subtitle,
  tag,
  tagType = "routine",
  date,
  actionLabel,
}) {
  return (
    <div className="circular-list-card">
      <div className="circular-list-left">
        <div className="circular-list-icon">{icon}</div>

        <div>
          <h3 className="circular-list-title">{title}</h3>
          <p className="circular-list-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="circular-list-right">
        <span className={`priority-badge priority-${tagType}`}>{tag}</span>

        {date && <span className="list-date">{date}</span>}

        {actionLabel && <button className="mini-action-btn">{actionLabel}</button>}
      </div>
    </div>
  );
}

export default CircularListCard;