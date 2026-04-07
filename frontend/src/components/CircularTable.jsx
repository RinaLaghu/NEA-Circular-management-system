function CircularTable({ circulars }) {
  return (
    <div className="table-wrapper">
      <table className="circular-table">
        <thead>
          <tr>
            <th>Circular ID</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Directorate / Department</th>
            <th>Date Received</th>
          </tr>
        </thead>

        <tbody>
          {circulars.map((item) => (
            <tr key={item.id}>
              <td className="circular-id">{item.id}</td>

              <td>
                <div className="subject-cell">
                  <div className="subject-title">{item.subject}</div>
                  <div className="subject-desc">{item.description}</div>
                </div>
              </td>

              <td>
                <span
                  className={`priority-badge ${
                    item.priority.toLowerCase() === "urgent"
                      ? "priority-urgent"
                      : "priority-routine"
                  }`}
                >
                  {item.priority}
                </span>
              </td>

              <td>
                <span className="department-pill">{item.department}</span>
              </td>

              <td>
                <div className="date-cell">
                  <div>{item.date}</div>
                  <small>{item.time}</small>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CircularTable;