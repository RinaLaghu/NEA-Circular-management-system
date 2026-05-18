import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import CircularTable from "@/components/circular/CircularTable";

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
    X: "Managing Director",
  };

const formatDirectorateOnly = (department) => {
  if (!department) return department;
  const code = department.split(" - ")[0]?.trim(); // take the first part (the alphabet code)
  return DIRECTORATE_NAMES[code] || department;   // map to full directorate name
};

const getDepartmentName = (department) => {
  if (!department) return "Not specified";
  const parts = department.split(" - ");
  return parts.length > 1 ? parts[1].trim() : department;
};

function CircularViewer({ circular, onClose }) {
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

        <div style={{ display: "grid", gap: "8px", marginBottom: "20px", color: "#555", fontSize: "14px" }}>
          <div><strong>Reference:</strong> {circular.reference_no || circular.id}</div>
          <div><strong>Directorate:</strong> {formatDirectorateOnly(circular.department)|| "Unknown Directorate"}</div>
          <div><strong>Department:</strong> {getDepartmentName(circular.department)}</div>
          <div><strong>Priority:</strong> {circular.priority}</div>
          <div><strong>Date:</strong> {circular.date}{circular.time ? ` • ${circular.time}` : ""}</div>
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
            <a href={`http://127.0.0.1:8000/circular/download/${circular.id}`} download className="action-btn">
              Download
            </a>
          )}

          <button onClick={onClose} className="action-btn secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AllCircularsPage() {
  const [circulars, setCirculars] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [selectedCircular, setSelectedCircular] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/circular/")
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setCirculars(sorted);
      })
      .catch((error) => {
        console.error("Unable to load circulars:", error);
      });
  }, []);

  const filteredCirculars = circulars.filter((c) => {
    const matchesSearch =
      c.subject?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());

    return (
      matchesSearch &&
      (departmentFilter === "" || c.department === departmentFilter)
    );
  });

  const uniqueDepartments = [...new Set(circulars.map((c) => c.department).filter(Boolean))];

  const handleView = (circular) => {
    setSelectedCircular(circular);
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
              <p className="portal-path">
                PORTAL / <span>ALL CIRCULARS</span>
              </p>
              <h1>All Circulars</h1>
            </div>
          </div>

          <div className="table-header" style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Search circulars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "10px 12px", minWidth: "240px", flex: "1 1 240px" }}
            />

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ padding: "10px 12px", minWidth: "220px", flex: "0 0 220px" }}
            >
                <option value="">All Directorates</option>
                {uniqueDepartments.map((dep) => {
                  const code = dep.split(" - ")[0]?.trim();       // extract alphabet
                  const directorateName = DIRECTORATE_NAMES[code]; // map to full name
                  return (
                    <option key={dep} value={dep}>
                      {directorateName || dep}   {/* ✅ label only directorate name */}
                    </option>
                  );
                })}
              </select>
          </div>

          <div className="table-section">
            <CircularTable
              circulars={filteredCirculars}
              onView={handleView}
              mode="all"
            />
          </div>

          {selectedCircular && (
            <CircularViewer
              circular={selectedCircular}
              onClose={() => setSelectedCircular(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AllCircularsPage;