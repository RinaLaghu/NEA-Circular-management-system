import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import filterIcon from "@/assets/filter.png";
import downloadIcon from "@/assets/download.png";

function CircularViewer({ circular, onClose, onArchive, onAcknowledge }) {
  if (!circular) return null;

  const fileUrl = `http://127.0.0.1:8000${circular.file_url}`;
  const isPDF = circular.file_url?.endsWith(".pdf");
  const isImage = circular.file_url?.match(/\.(jpg|jpeg|png)$/i);

  return (
    <div className="viewer-overlay">
      <div className="viewer-box">
        <h2>{circular.subject}</h2>
        <p>{circular.description}</p>

        <div style={{ marginTop: "20px" }}>
          {isPDF && <iframe src={fileUrl} width="100%" height="500px" />}
          {isImage && <img src={fileUrl} alt="preview" style={{ maxWidth: "100%" }} />}
          {!isPDF && !isImage && <p>No preview available for this file type</p>}
        </div>

        <div className="viewer-actions">
          <a href={fileUrl} download className="action-btn">Download</a>

          {circular.status !== "acknowledged" && (
            <button onClick={() => onAcknowledge(circular.id)} className="action-btn" style={{ backgroundColor: "#28a745" }}>
              Acknowledge
            </button>
          )}

          <button onClick={() => onArchive(circular.id)} className="action-btn">
            Archive
          </button>

          <button onClick={onClose} className="action-btn secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CircularDashboard() {
  const [circulars, setCirculars] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0 });

  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    department: ""
  });

  const [statusFilter, setStatusFilter] = useState(""); // ✅ READ/UNREAD TOGGLE
  const [selectedCircular, setSelectedCircular] = useState(null);

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    fetch("http://127.0.0.1:8000/circular/inbox", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setCirculars(data || []))
      .catch(e => console.error(e));

    fetch("http://127.0.0.1:8000/circular/stats", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setStats(data || {}))
      .catch(e => console.error(e));
  }, []);

  // ✅ MARK AS READ WHEN OPENED
  const handleView = async (c) => {
    setSelectedCircular(c);

    if (c.status === "unread") {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      await fetch(
        `http://127.0.0.1:8000/circular/read/${encodeURIComponent(c.id)}`,
        { method: "PUT", headers }
      );

      setCirculars((prev) =>
        prev.map((item) =>
          item.id === c.id ? { ...item, status: "read" } : item
        )
      );

      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    }
  };

  const handleAcknowledge = async (id) => {
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    await fetch(
      `http://127.0.0.1:8000/circular/acknowledge/${encodeURIComponent(id)}`,
      { method: "PUT", headers }
    );

    setCirculars((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "acknowledged" } : item
      )
    );
    setSelectedCircular((prev) => prev && prev.id === id ? { ...prev, status: "acknowledged" } : prev);
  };

  const handleArchive = async (id) => {
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    await fetch(
      `http://127.0.0.1:8000/circular/archive/${encodeURIComponent(id)}`,
      { method: "PUT", headers }
    );

    setCirculars((prev) => prev.filter((c) => c.id !== id));
    setStats((prev) => ({ ...prev, archived: prev.archived + 1 }));
    setSelectedCircular(null);
  };

  // ✅ FILTER (UNCHANGED LOGIC, FIXED READ/UNREAD)
  const filtered = circulars.filter((c) => {
    const matchPriority = filters.priority
      ? c.priority?.toLowerCase() === filters.priority.toLowerCase()
      : true;

    const matchDepartment = filters.department
      ? c.department?.toLowerCase().includes(filters.department.toLowerCase())
      : true;

    const matchStatus = statusFilter
      ? c.status?.toLowerCase() === statusFilter
      : true;

    return matchPriority && matchDepartment && matchStatus;
  });

  const handleExport = () => {
    const headers = ["ID", "Subject", "Priority", "Department", "Date", "Status"];
    const rows = filtered.map((c) => [
      c.id,
      c.subject,
      c.priority,
      c.department,
      c.date,
      c.status,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "circulars.csv";
    a.click();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="dashboard-content">

          {/* HEADER */}
          <div className="page-header">
            <div>
              <p className="portal-path">PORTAL / <span>INBOX</span></p>
              <h1>Administrative Circular</h1>
            </div>

            {isLoggedIn && (
              <div className="header-actions">
  <button
    className="action-btn secondary icon-btn"
    onClick={() => setShowFilter(!showFilter)}
  >
    <img src={filterIcon} alt="filter" className="btn-icon" />
    Filter
  </button>

  <button className="action-btn secondary icon-btn" onClick={handleExport}>
    <img src={downloadIcon} alt="download" className="btn-icon" />
    Export
  </button>
</div>
            )}
          </div>

          {/* FILTER */}
          {isLoggedIn && showFilter && (
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters({ ...filters, priority: e.target.value })
                }
              >
                <option value="">Priority</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
              </select>

              <input
                placeholder="Department"
                value={filters.department}
                onChange={(e) =>
                  setFilters({ ...filters, department: e.target.value })
                }
              />

              <button
                onClick={() =>
                  setFilters({ priority: "", department: "" })
                }
              >
                Clear
              </button>
            </div>
          )}

          {/* STATS (UNCHANGED LOGIC) */}
          {isLoggedIn && (
            <div className="stats-grid">
              <StatCard title="Total" value={stats.total} />
              <StatCard title="Unread" value={stats.unread} />
              <StatCard title="Archived" value={stats.archived} />
            </div>
          )}

          {/* TABLE SECTION (FIXED LEGEND ONLY) */}
          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>

              {/* ✅ LEGEND FIXED */}
              <div className="legend">
                <span
                  className={`legend-item ${statusFilter === "unread" ? "active" : ""}`}
                  onClick={() =>
                    setStatusFilter(statusFilter === "unread" ? "" : "unread")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <span className="dot unread"></span> Unread
                </span>

                <span
                  className={`legend-item ${statusFilter === "read" ? "active" : ""}`}
                  onClick={() =>
                    setStatusFilter(statusFilter === "read" ? "" : "read")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <span className="dot read"></span> Read
                </span>
              </div>
            </div>

            {/* TABLE */}
            <CircularTable
              circulars={filtered}
              onArchive={handleArchive}
              onView={handleView}
            />
          </div>

          {/* VIEWER */}
          {selectedCircular && (
            <CircularViewer
              circular={selectedCircular}
              onClose={() => setSelectedCircular(null)}
              onArchive={handleArchive}
              onAcknowledge={handleAcknowledge}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;