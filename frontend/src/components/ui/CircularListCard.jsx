function CircularListCard({
  icon = "📄",
  title,
  subtitle,
  tag,
  tagType = "routine",
  date,
  actionLabel,
  onAction,
  secondActionLabel,
  onSecondAction,
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
        <span className={`priority-badge priority-${tagType}`}>
          {tag}
        </span>

        {date && <span className="list-date">{date}</span>}

        <div className="card-action-row">
          {actionLabel && (
            <button className="mini-action-btn" onClick={onAction}>
              {actionLabel}
            </button>
          )}

          {secondActionLabel && (
            <button className="mini-action-btn" onClick={onSecondAction}>
              {secondActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CircularListCard;