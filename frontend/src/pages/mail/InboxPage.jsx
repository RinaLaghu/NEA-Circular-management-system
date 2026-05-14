import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import filterIcon from "@/assets/filter.png";
import downloadIcon from "@/assets/download.png";

function CircularViewer({ circular, onClose, onArchive}) {
  if (!circular) return null;

  const rawFileUrl = circular?.file_url || "";
const fileUrl = rawFileUrl ? `http://127.0.0.1:8000${rawFileUrl}` : null;

const isPDF = rawFileUrl.toLowerCase().includes(".pdf");
const isImage = /\.(jpg|jpeg|png|gif)$/i.test(rawFileUrl);

  const handleDownload = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(fileUrl, {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    });

    if (!res.ok) throw new Error("Download failed");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = circular.subject || "circular-file";
    document.body.appendChild(a);
    a.click();

    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Download failed");
  }
};
  return (
    <div className="viewer-overlay">
      <div className="viewer-box">
        <h2>{circular.subject}</h2>
        <p>{circular.description}</p>

       <div style={{ marginTop: "20px" }}>

  {/* PDF */}
  {isPDF && fileUrl && (
    <iframe src={fileUrl} width="100%" height="500px" />
  )}

  {/* Image */}
  {isImage && fileUrl && (
    <img src={fileUrl} style={{ maxWidth: "100%" }} />
  )}

  {/* TEXT ONLY (IMPORTANT FIX) */}
  {!fileUrl && (
    <div style={{ padding: "20px" }}>
      <h3>{circular.subject}</h3>
      <p>{circular.description}</p>
    </div>
  )}

</div>
        <div className="viewer-actions">
      <button onClick={handleDownload} className="action-btn">
  Download
</button>

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
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0, sent: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    date: ""
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

  const matchDate = filters.date
    ? c.date?.includes(filters.date)
    : true;

  const matchStatus = statusFilter
    ? c.status?.toLowerCase().trim() === statusFilter.toLowerCase()
    : true;

  const matchSearch = searchQuery.trim()
    ? c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.department?.toLowerCase().includes(searchQuery.toLowerCase())
    : true;

  return matchPriority && matchDate && matchStatus && matchSearch;
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
       <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

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
                <option value=""disabled hidden>Priority</option>
                <option value="Urgent">Urgent</option>
                <option value="Routine">Routine</option>
                <option value="Confidential">Confidential</option>

              </select>

              <input
  type="date"
  value={filters.date}
  onChange={(e) =>
    setFilters({ ...filters, date: e.target.value })
  }
/>

             <button
  onClick={() => {
    setFilters({ priority: "", date: "" });
    setShowFilter(false);
  }}
>
  Clear
</button>
            </div>
          )}

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
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;