import React from "react";

function CircularTable({
  circulars,
  onView,
  activeId,
  setActiveId,
  onArchive,
  onUnarchive,
  onDelete,
  mode = "inbox",
}) {
    return (
    <div className="table-wrapper">
      <table className="circular-table">

        {/* HEADER */}
        <thead>
          <tr>
            <th>Circular ID</th>
            <th>Subject</th>
            <th>Priority</th>
            <th>Directorate / Department</th>
            <th>Date Received</th>
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {circulars.map((item) => (
            <React.Fragment key={item.id}>

              {/* MAIN ROW */}
              <tr
                onClick={() => {
  onView?.(item);  // ✅ safe — won't crash if not passed
  setActiveId?.(activeId === item.id ? null : item.id);
}}
                style={{ cursor: "pointer" }}
              >
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
                      (item.priority || "").toLowerCase() === "urgent"
                        ? "priority-urgent"
                        : "priority-routine"
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td>
                  <span className="department-pill">
                    {item.department}
                  </span>
                </td>

                <td>
                  <div className="date-cell">
                    <div>{item.date}</div>
                    <small>{item.time}</small>
                  </div>
                </td>
              </tr>

              {/* EXPANDED ROW */}
              {activeId === item.id && (
                <tr>
                  <td colSpan="5">
                    <div className="expand-wrapper">
                      <div className="expand-content">

                        <div style={{ marginBottom: "10px" }}>
                          <strong>Description:</strong>{" "}
                          {item.description}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>

                          {mode === "inbox" && (
                            <>
                              {/* DOWNLOAD */}
                              <button
                                className="action-btn secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `http://127.0.0.1:8000/circular/download/${encodeURIComponent(item.id)}`
                                  );
                                }}
                              >
                                ⬇ Download
                              </button>

                              {/* ARCHIVE */}
                              <button
                                className="action-btn secondary"
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  await fetch(
                                    `http://127.0.0.1:8000/circular/archive/${encodeURIComponent(item.id)}`,
                                    { method: "PUT" }
                                  );

                                  onArchive(item.id);
                                }}
                              >
                                🗂 Archive
                              </button>
                            </>
                          )}

                          {mode === "archive" && (
                            <>
                              {/* UNARCHIVE */}
                              <button
                                className="action-btn secondary"
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  await fetch(
                                    `http://127.0.0.1:8000/circular/unarchive/${encodeURIComponent(item.id)}`,
                                    { method: "PUT" }
                                  );

                                  onUnarchive(item.id);
                                }}
                              >
                                📥 Unarchive
                              </button>

                              {/* DELETE */}
                              <button
                                className="action-btn secondary"
                                onClick={async (e) => {
                                  e.stopPropagation();

                                  await fetch(
                                    `http://127.0.0.1:8000/circular/delete/${encodeURIComponent(item.id)}`,
                                    { method: "DELETE" }
                                  );

                                  onDelete(item.id);
                                }}
                              >
                                🗑 Delete
                              </button>
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

            </React.Fragment>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default CircularTable;