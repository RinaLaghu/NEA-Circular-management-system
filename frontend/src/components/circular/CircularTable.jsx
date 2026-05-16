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
                  onView?.(item);
                }}
                className={item.status?.toLowerCase() === "unread" ? "row-unread" : "row-read"}
                style={{ cursor: "pointer", backgroundColor: item.status?.toLowerCase() === "unread" ? "#fdfdfd" : "inherit" }}
              >
                <td className="circular-id">{item.reference_no || item.id}</td>

                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: item.status?.toLowerCase() === "unread" ? 800 : 500, color: item.status?.toLowerCase() === "unread" ? "#000" : "#4b5563" }}>
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

            </React.Fragment>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default CircularTable;