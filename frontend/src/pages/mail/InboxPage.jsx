import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";



function CircularViewer({ circular, onClose, onArchive }) {
  if (!circular) return null;

  const fileUrl = `http://127.0.0.1:8000${circular.file_url}`;

  const isPDF = circular.file_url?.endsWith(".pdf");
  const isImage = circular.file_url?.match(/\.(jpg|jpeg|png)$/i);

  return (
    <div className="viewer-overlay">
      <div className="viewer-box">
        <h2>{circular.subject}</h2>
        <p>{circular.description}</p>

        {/* FILE PREVIEW */}
        <div style={{ marginTop: "20px" }}>
          {isPDF && (
            <iframe
              src={fileUrl}
              width="100%"
              height="500px"
              style={{ border: "1px solid #ccc" }}
            />
          )}

          {isImage && (
            <img
              src={fileUrl}
              alt="preview"
              style={{ maxWidth: "100%" }}
            />
          )}

          {!isPDF && !isImage && (
            <p>No preview available for this file type</p>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <a href={fileUrl} download className="action-btn">
            Download
          </a>

          <button
            onClick={() => onArchive(circular.id)}
            className="action-btn"
          >
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
  const [filters, setFilters] = useState({ priority: "", status: "", department: "" });
  const [selectedCircular, setSelectedCircular] = useState(null);


  useEffect(() => {
    fetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => setCirculars(data));

    fetch("http://127.0.0.1:8000/circular/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

 const handleArchive = async (id) => {
  await fetch(`http://127.0.0.1:8000/circular/archive/${encodeURIComponent(id)}`, {
    method: "PUT",
  });

  // Then update local state
  setCirculars(prev => prev.filter(c => c.id !== id));
  setStats(prev => ({ ...prev, archived: prev.archived + 1 }));
  setSelectedCircular(null);
};

  // FILTER logic
  const filtered = circulars.filter(c => {
    const matchPriority = filters.priority ? c.priority?.toLowerCase() === filters.priority.toLowerCase() : true;
    const matchStatus = filters.status ? c.status?.toLowerCase() === filters.status.toLowerCase() : true;
    const matchDepartment = filters.department ? c.department?.toLowerCase().includes(filters.department.toLowerCase()) : true;
    return matchPriority && matchStatus && matchDepartment;
  });

  // EXPORT logic
  const handleExport = () => {
    const headers = ["Circular ID", "Subject", "Priority", "Department", "Date", "Status"];
    const rows = filtered.map(c => [c.id, c.subject, c.priority, c.department, c.date, c.status]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "circulars.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <p className="portal-path">PORTAL / <span>INBOX</span></p>
              <h1>Administrative Circular</h1>
              <p className="page-subtitle">Priority Ledger</p>
            </div>
            <div className="header-actions">
              <button className="action-btn secondary" onClick={() => setShowFilter(!showFilter)}>
                Filter
              </button>
              <button className="action-btn secondary" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>

          {/* FILTER PANEL */}
          {showFilter && (
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              >
                <option value="">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              <input
                type="text"
                placeholder="Search department..."
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
              />

              <button
                onClick={() => setFilters({ priority: "", status: "", department: "" })}
                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" }}
              >
                Clear
              </button>
            </div>
          )}

          <div className="stats-grid">
            <StatCard title="Total Received" value={stats.total} footer="+12% this month" accent="blue" />
            <StatCard title="Unread Actions" value={stats.unread} footer="2 immediate review req." accent="red" />
            <StatCard title="Archived" value={stats.archived} footer="Last synced 2 minutes ago" accent="gray" />
          </div>

          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>
              <div className="legend">
                <span className="legend-item"><span className="dot unread"></span> Unread</span>
                <span className="legend-item"><span className="dot read"></span> Read</span>
              </div>
            </div>
            <CircularTable circulars={filtered} onArchive={handleArchive} onView={(c) => setSelectedCircular(c)}/>
              {selectedCircular && (
            <CircularViewer
              circular={selectedCircular}
              onClose={() => setSelectedCircular(null)}
              onArchive={handleArchive}
            />
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;