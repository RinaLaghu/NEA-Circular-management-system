import PageLayout from "@/components/layout/PageLayout";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ArchivePage() {
  const [circulars, setCirculars] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
const fetchArchive = () => {
  fetch("http://127.0.0.1:8000/circular/archive")
    .then((res) => res.json())
    .then((data) => setCirculars(data));
};

useEffect(() => {
  fetchArchive();
}, []);

  const filtered = circulars.filter(c =>
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleUnarchive = async (id) => {
  await fetch(
    `http://127.0.0.1:8000/circular/unarchive/${encodeURIComponent(id)}`,
    { method: "PUT" }
  );

  fetchArchive(); // 🔥 refresh from DB
};
  const handleDelete = async (id) => {
  await fetch(
    `http://127.0.0.1:8000/circular/delete/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );

  fetchArchive(); // 🔥 refresh
};

  return (
    <PageLayout>
      <div className="simple-page-header archive-centered-header">
        <div>
          <h1>Archive</h1>
        </div>
      </div>

      <p className="center-summary-text">All past circulars</p>

      <div className="archive-search-wrap">
        <input
          type="text"
          className="archive-search-input"
          placeholder="Search archived circulars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <CircularTable
       circulars={filtered}
  mode="archive"
  activeId={activeId}
  setActiveId={setActiveId}
  onUnarchive={handleUnarchive}
  onDelete={handleDelete}
      />

      <div className="bottom-status-bar">
        <span className="status-dot"></span>
        <span>Viewing: Archive</span>
        <button className="primary-page-btn bottom-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>
    </PageLayout>
  );
}

export default ArchivePage;