import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import filterIcon from "@/assets/filter.png";
import downloadIcon from "@/assets/download.png";

function CircularViewer({ circular, onClose, onArchive, onAcknowledge, isLoggedIn }) {
  if (!circular) return null;

  const fileUrl = `http://127.0.0.1:8000${circular.file_url}`;
  const isPDF = circular.file_url?.endsWith(".pdf");
  const isImage = circular.file_url?.match(/\.(jpg|jpeg|png)$/i);

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-box" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>{circular.subject}</h2>

        <div style={{ margin: "20px 0", fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#333" }}>
          {circular.description}
        </div>

        {circular.file_url && (isPDF || isImage) && (
          <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <h4 style={{ marginBottom: "15px", color: "#666" }}>Attachment:</h4>
            {isPDF && <iframe src={fileUrl} width="100%" height="500px" style={{ border: "1px solid #ccc", borderRadius: "4px" }} />}
            {isImage && <img src={fileUrl} alt="attachment preview" style={{ maxWidth: "100%", borderRadius: "4px", border: "1px solid #ccc" }} />}
          </div>
        )}

        <div className="viewer-actions">
          {circular.file_url && (
            <a href={`http://127.0.0.1:8000/circular/download/${circular.id}`} download className="action-btn">Download</a>
          )}

          {isLoggedIn && (
            <>
              {circular.status !== "acknowledged" && (
                <button onClick={() => onAcknowledge(circular.id)} className="action-btn" style={{ backgroundColor: "#28a745" }}>
                  Acknowledge
                </button>
              )}

              <button onClick={() => onArchive(circular.id)} className="action-btn">
                Archive
              </button>
            </>
          )}

          <button onClick={onClose} className="action-btn secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CircularDashboard() {
  const [circulars, setCirculars] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0, sent: 0 });

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

    if (c.status?.toLowerCase() === "unread") {
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
          </div>


          {/* STATS */}
          {isLoggedIn && (
            <div className="stats-grid">
              <StatCard title="Total" value={stats.total} />
              <StatCard title="Unread" value={stats.unread} accent="red" />
              <StatCard title="Archived" value={stats.archived} accent="gray" />
            </div>
          )}

          {/* TABLE SECTION (FIXED LEGEND ONLY) */}
          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>

              {/* ✅ LEGEND FIXED */}
              {isLoggedIn && (
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
              )}
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
              isLoggedIn={isLoggedIn}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;