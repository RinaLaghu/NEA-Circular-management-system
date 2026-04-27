import { authFetch } from '@/utils/api';
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

        <div style={{ marginTop: "20px" }}>
          {isPDF && (
            <iframe src={fileUrl} width="100%" height="500px" />
          )}

          {isImage && (
            <img src={fileUrl} alt="preview" style={{ maxWidth: "100%" }} />
          )}

          {!isPDF && !isImage && (
            <p>No preview available</p>
          )}
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
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
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    department: ""
  });
  const [selectedCircular, setSelectedCircular] = useState(null);

  // ✅ FETCH DATA SAFELY
  useEffect(() => {
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => {
        console.log("INBOX:", data);
        setCirculars(data || []);
      })
      .catch(() => setCirculars([]));

    authFetch("http://127.0.0.1:8000/circular/stats")
      .then((res) => res.json())
      .then((data) => {
        console.log("STATS:", data);
        setStats(data || { total: 0, unread: 0, archived: 0 });
      })
      .catch(() =>
        setStats({ total: 0, unread: 0, archived: 0 })
      );
  }, []);

  // ✅ ARCHIVE
  const handleArchive = async (id) => {
    await authFetch(
      `http://127.0.0.1:8000/circular/archive/${encodeURIComponent(id)}`,
      { method: "PUT" }
    );

    setCirculars((prev) => prev.filter((c) => c.id !== id));
    setStats((prev) => ({
      ...prev,
      archived: prev.archived + 1
    }));

    setSelectedCircular(null);
  };

  // ✅ VIEW (mark read)
  const handleView = async (circular) => {
    setSelectedCircular(circular);

    if (circular.status === "unread") {
      await authFetch(
        `http://127.0.0.1:8000/circular/read/${encodeURIComponent(circular.id)}`,
        { method: "PUT" }
      );

      setCirculars((prev) =>
        prev.map((c) =>
          c.id === circular.id ? { ...c, status: "read" } : c
        )
      );

      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    }
  };

  // ✅ FILTER (SAFE)
  const filtered = (circulars || []).filter((c) => {
    const matchPriority = filters.priority
      ? c.priority?.toLowerCase() === filters.priority.toLowerCase()
      : true;

    const matchStatus = filters.status
      ? c.status?.toLowerCase() === filters.status.toLowerCase()
      : true;

    const matchDepartment = filters.department
      ? c.department?.toLowerCase().includes(filters.department.toLowerCase())
      : true;

    return matchPriority && matchStatus && matchDepartment;
  });

  // ✅ EXPORT
  const handleExport = () => {
    const headers = [
      "Circular ID",
      "Subject",
      "Priority",
      "Department",
      "Date",
      "Status"
    ];

    const rows = filtered.map((c) => [
      c.id,
      c.subject,
      c.priority,
      c.department,
      c.date,
      c.status
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
          <div className="page-header">
            <h1>Inbox</h1>

            <div>
              <button onClick={() => setShowFilter(!showFilter)}>
                Filter
              </button>

              <button onClick={handleExport}>
                Export
              </button>
            </div>
          </div>

          {/* FILTER */}
          {showFilter && (
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
                  setFilters({
                    priority: "",
                    status: "",
                    department: ""
                  })
                }
              >
                Clear
              </button>
            </div>
          )}

          {/* STATS */}
          <div className="stats-grid">
            <StatCard title="Total" value={stats.total} />
            <StatCard title="Unread" value={stats.unread} />
            <StatCard title="Archived" value={stats.archived} />
          </div>

          {/* TABLE */}
          <CircularTable
            circulars={filtered}
            onArchive={handleArchive}
            onView={handleView}
          />

          {/* VIEWER */}
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
  );
}

export default CircularDashboard;