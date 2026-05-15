import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import filterIcon from "@/assets/filter.png";
import downloadIcon from "@/assets/download.png";

function CircularViewer({ circular, onClose, onArchive, onCompose, isLoggedIn }) {
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
          {circular.status === "pending_approval" && (
            <button onClick={() => onCompose?.(circular.id)} className="action-btn">
              Edit & Send
            </button>
          )}


          <button onClick={onClose} className="action-btn secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminReviewPage() {
  const [circulars, setCirculars] = useState([]);

  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    department: ""
  });

  const [statusFilter, setStatusFilter] = useState("");
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
    if (!isAdministration) {
      navigate("/inbox");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};

    // Fetch pending approvals from same directorate
    fetch("http://127.0.0.1:8000/circular/admin-review", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setCirculars(data || []))
      .catch(e => console.error(e));
  }, [isAdministration]);

  const handleView = async (c) => {
    setSelectedCircular(c);
  };

  const handleArchive = async (id) => {
    const token = localStorage.getItem("token");
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    await fetch(
      `http://127.0.0.1:8000/circular/archive/${encodeURIComponent(id)}`,
      { method: "PUT", headers }
    );

    setCirculars((prev) => prev.filter((c) => c.id !== id));
    setSelectedCircular(null);
  };

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
          <div className="page-header">
            <div>
              <p className="portal-path">PORTAL / ADMIN REVIEW</p>
              <h1>Admin Review</h1>
            </div>
          </div>

          <div className="table-section">
            <div className="table-header">
              <h3>Pending Circulars from Internal Departments</h3>
            </div>

            <CircularTable
              circulars={filtered}
              onView={handleView}
              onCompose={handleCompose}
              mode="admin-review"
            />
          </div>

          {selectedCircular && (
            <CircularViewer
              circular={selectedCircular}
              onClose={() => setSelectedCircular(null)}
              onCompose={handleCompose}
              isLoggedIn={isLoggedIn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReviewPage;