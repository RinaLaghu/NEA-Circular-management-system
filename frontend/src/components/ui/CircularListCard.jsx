function CircularListCard({
  icon = "📄",
  title,
  subtitle,
  tag,
  tagType = "routine",
  date,
  time,
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

        {date && (
          <div className="date-cell" style={{ color: '#374151', fontWeight: '600', whiteSpace: 'nowrap' }}>
            <div>{date}</div>
            {time && <small style={{ display: 'block', color: '#9ca3af', fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>{time}</small>}
          </div>
        )}

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