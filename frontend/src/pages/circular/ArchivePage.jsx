import PageLayout from "@/components/layout/PageLayout";
import CircularTable from "@/components/circular/CircularTable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ArchivePage() {
  const [circulars, setCirculars] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/circular/archive");

        console.log("Archive response status:", res.status);

        const data = await res.json();

        console.log("Archive data:", data);

        if (Array.isArray(data)) {
          setCirculars(data);
        } else {
          setCirculars([]);
        }
      } catch (error) {
        console.error("Failed to load archive:", error);
        setCirculars([]);
      }
    };

    fetchArchive();
  }, []);

  const filtered = circulars.filter((c) =>
    (c.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleUnarchive = async (id) => {
    const res = await fetch(`http://127.0.0.1:8000/circular/unarchive/${id}`, {
      method: "PUT",
    });

    if (!res.ok) {
      alert("Failed to unarchive circular");
      return;
    }

    setCirculars((prev) => prev.filter((item) => item.id !== id));
    setActiveId(null);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this archived circular?"
    );

    if (!confirmDelete) return;

    const res = await fetch(`http://127.0.0.1:8000/circular/delete/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errorMessage =
        errorData?.detail || errorData?.message || res.statusText || "Failed to delete circular";
      alert(`Failed to delete circular: ${errorMessage}`);
      return;
    }

    setCirculars((prev) => prev.filter((item) => item.id !== id));
    setActiveId(null);
  };

  return (
    <PageLayout>
      <div className="simple-page-header archive-centered-header">
        <div>
          <h1>Archive</h1>
          <p className="simple-subtitle">{filtered.length} archived circulars</p>
        </div>
      </div>

      <div className="archive-search-wrap">
        <input
          type="text"
          className="archive-search-input"
          placeholder="Search archived circulars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="simple-subtitle">No archived circulars found.</p>
      ) : (
        <CircularTable
          circulars={filtered}
          mode="archive"
          activeId={activeId}
          setActiveId={setActiveId}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      )}
    </PageLayout>
  );
}

export default ArchivePage;