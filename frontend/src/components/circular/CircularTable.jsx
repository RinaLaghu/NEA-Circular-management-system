import { authFetch } from '@/utils/api';
import React from "react";

function CircularTable({
  circulars,
  onView,
  onCompose,
  isAdministration,
  activeId,
  setActiveId,
  onArchive,
  onUnarchive,
  onDelete,
  mode = "inbox",
}) {
  const DIRECTORATE_NAMES = {
    A: "Planning, Monitoring and IT",
    B: "Business Development",
    C: "Administration",
    D: "Finance",
    E: "Generation",
    F: "Transmission",
    G: "Distribution & Consumer Services",
    H: "Engineering Service",
    I: "Project Management",
    X: "BOARD OF DIRECTORS",
  };

  const formatDepartmentLabel = (department) => {
    if (!department) return department;

    const parts = department.split(" - ");
    const code = parts[0]?.trim();
    const suffix = parts.slice(1).join(" - ");
    const directorateName = DIRECTORATE_NAMES[code];

    return directorateName
      ? `${directorateName}${suffix ? ` - ${suffix}` : ""}`
      : department;
  };

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
                className={item.status?.toLowerCase() === "unread" ? "row-unread" : "row-read"}
                style={{ cursor: "pointer", backgroundColor: item.status?.toLowerCase() === "unread" ? "#fdfdfd" : "inherit" }}
              >
                <td className="circular-id">{item.reference_no || item.id}</td>

                <td>
                  <div className="subject-cell">
                    <div className="subject-title" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: item.status?.toLowerCase() === "unread" ? 800 : 500, color: item.status?.toLowerCase() === "unread" ? "#000" : "#4b5563" }}>
                      {item.subject}
                      {item.status?.toLowerCase() === "unread" && (
                        <span style={{
                          backgroundColor: "#e74c3c",
                          color: "white",
                          fontSize: "10px",
                          fontWeight: "bold",
                          padding: "2px 6px",
                          borderRadius: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          boxShadow: "0 0 8px rgba(231, 76, 60, 0.4)",
                          animation: "pulse 2s infinite"
                        }}>New</span>
                      )}
                    </div>
                    <div className="subject-desc" style={{ color: item.status?.toLowerCase() === "unread" ? "#374151" : "#6b7280" }}>
                      {item.description}
                    </div>
                  </div>
                </td>

                <td>
                  <span
                    className={`priority-badge ${(item.priority || "").toLowerCase() === "urgent"
                        ? "priority-urgent"
                        : "priority-routine"
                      }`}
                  >
                    {item.priority}
                  </span>
                </td>

                <td>
                  <span className="department-pill">
                    {formatDepartmentLabel(item.department)}
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

                                  await authFetch(
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

                                  await authFetch(
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

                                  await authFetch(
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

                          {mode === "admin-review" && item.status === "pending_approval" && (
                            <>
                              {/* EDIT & FORWARD */}
                              <button
                                className="action-btn primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCompose?.(item.id);
                                }}
                              >
                                ✏️ Edit & Forward
                              </button>

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

                                  await authFetch(
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