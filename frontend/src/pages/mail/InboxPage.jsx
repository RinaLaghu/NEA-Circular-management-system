import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import filterIcon from "@/assets/filter.png";
import downloadIcon from "@/assets/download.png";

function CircularViewer({ circular, onClose, onArchive, onCompose, isLoggedIn, isAdministration }) {
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
            <button
              onClick={() => {
                window.open(`http://127.0.0.1:8000${circular.file_url}`, "_blank");
              }}
              className="action-btn"
            >
              View Attachment
            </button>
          )}


          {isLoggedIn && (
            <>
              <button onClick={() => onArchive(circular.id)} className="action-btn">
                Archive
              </button>

              {isAdministration && (
                <ForwardButton circularId={circular.id} onClose={onClose} />
              )}
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

function ForwardButton({ circularId, onClose }) {
  const [showModal, setShowModal] = React.useState(false);
  const [internalDepts, setInternalDepts] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const open = async () => {
    setShowModal(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("http://127.0.0.1:8000/circular/recipients", { headers });
      if (!res.ok) throw new Error("Failed to load recipients");
      const data = await res.json();
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentDirectorateId = payload.directorate_id;
      const filtered = (data.internal || []).filter(d => d.directorate_id === currentDirectorateId);
      setInternalDepts(filtered);
      setSelected([]);
    } catch (e) {
      console.error(e);
      alert("Failed to load recipient departments");
      setShowModal(false);
    }
  };

  const sendForward = async () => {
    if (selected.length === 0) {
      alert("Please select at least one internal department to forward to.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
      const res = await fetch(`http://127.0.0.1:8000/circular/${encodeURIComponent(circularId)}/forward`, {
        method: "POST",
        headers,
        body: JSON.stringify({ internal_dept_ids: selected })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to forward circular");
        return;
      }

      alert("Circular forwarded successfully");
      setShowModal(false);
      onClose();
      // Optionally navigate to sent; leave to user to view sent list
    } catch (e) {
      console.error(e);
      alert("Failed to forward circular");
    }
  };

  return (
    <>
      <button onClick={open} className="action-btn">
        Forward
      </button>

      {showModal && (
        <div className="viewer-overlay" onClick={() => setShowModal(false)}>
          <div className="viewer-box" style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
            <h3>Forward Internally</h3>
            <p style={{ color: "#666" }}>Select internal departments in your directorate to forward this circular to.</p>

            <div style={{ maxHeight: 360, overflow: "auto", marginTop: 12 }}>
              {internalDepts.length === 0 && <p style={{ color: "#999" }}>No internal departments available.</p>}

              <div className="nc-recipient-grid">
                {internalDepts.map((d) => {
                  const isSel = selected.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`nc-dept-card ${isSel ? "selected internal" : ""}`}
                      onClick={() => toggle(d.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span className="nc-check-box">{isSel ? "✓" : ""}</span>
                      <div className="nc-dept-text">
                        <div className="nc-dept-name">{d.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="action-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="action-btn" onClick={sendForward}>Send</button>
            </div>
          </div>
        </div>
      )}
    </>
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
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState(""); // ✅ READ/UNREAD TOGGLE
  const [selectedCircular, setSelectedCircular] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");
  const deptData = (() => {
    try {
      return JSON.parse(localStorage.getItem("department"));
    } catch (e) {
      return null;
    }
  })();
  const isAdministration = deptData?.is_administration === true;

  const handleCompose = (id) => {
    navigate(`/new-circular?draftId=${id}`);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/all-circulars");
      return;
    }
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

    const matchSearch = search
      ? (c.subject || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())
      : true;

    return matchPriority && matchDepartment && matchStatus && matchSearch;
  });

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

  const handleExport = () => {
    const headers = ["Reference", "Subject", "Priority", "Department", "Date", "Status"];
    const rows = filtered.map((c) => [
      c.reference_no || c.id,
      c.subject,
      c.priority,
      formatDepartmentLabel(c.department),
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
              <p className="portal-path">PORTAL / <span>{isLoggedIn ? "INBOX" : "CIRCULARS"}</span></p>
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

          <div className="archive-search-wrap" style={{ marginTop: 18 }}>
            <input
              type="text"
              className="archive-search-input"
              placeholder="Search inbox circulars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* TABLE SECTION (FIXED LEGEND ONLY) */}
          <div className="table-section">
            <div className="table-header">
              <h3>{isLoggedIn ? "Inbox / Latest Circulars" : "Latest Circulars"}</h3>

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
              onCompose={handleCompose}
              isAdministration={isAdministration}
            />
          </div>

          {/* VIEWER */}
          {selectedCircular && (
            <CircularViewer
              circular={selectedCircular}
              onClose={() => setSelectedCircular(null)}
              onArchive={handleArchive}
              onCompose={handleCompose}
              isLoggedIn={isLoggedIn}
              isAdministration={isAdministration}
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;