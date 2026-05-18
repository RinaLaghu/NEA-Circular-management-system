import PageLayout from "@/components/layout/PageLayout";
import CircularTable from "@/components/circular/CircularTable";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ArchivePage() {
  const [circulars, setCirculars] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCircular, setSelectedCircular] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchArchive = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/circular/archive", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load archive");
        }

        const data = await res.json();

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
  }, [navigate]);

  const filtered = circulars.filter((c) =>
    (c.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (circular) => {
    setSelectedCircular(circular);
  };

  const handleUnarchive = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const res = await fetch(`http://127.0.0.1:8000/circular/unarchive/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      alert("Failed to unarchive circular");
      return;
    }

    setCirculars((prev) => prev.filter((item) => item.id !== id));
    setActiveId(null);
    setSelectedCircular(null);
    navigate("/inbox");
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this archived circular?"
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const res = await fetch(`http://127.0.0.1:8000/circular/delete/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
          onView={handleView}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
        />
      )}

      {selectedCircular && (
        <div className="viewer-overlay" onClick={() => setSelectedCircular(null)}>
          <div className="viewer-box" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>{selectedCircular.subject}</h2>

            <div style={{ margin: "20px 0", fontSize: "15px", lineHeight: "1.6", whiteSpace: "pre-wrap", color: "#333" }}>
              {selectedCircular.description}
            </div>

            {selectedCircular.file_url && ((selectedCircular.file_url.endsWith(".pdf")) || selectedCircular.file_url.match(/\.(jpg|jpeg|png)$/i)) && (
              <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
                <h4 style={{ marginBottom: "15px", color: "#666" }}>Attachment:</h4>
                {selectedCircular.file_url.endsWith(".pdf") && (
                  <iframe src={`http://127.0.0.1:8000${selectedCircular.file_url}`} width="100%" height="500px" style={{ border: "1px solid #ccc", borderRadius: "4px" }} />
                )}
                {selectedCircular.file_url.match(/\.(jpg|jpeg|png)$/i) && (
                  <img src={`http://127.0.0.1:8000${selectedCircular.file_url}`} alt="attachment preview" style={{ maxWidth: "100%", borderRadius: "4px", border: "1px solid #ccc" }} />
                )}
              </div>
            )}

            <div className="viewer-actions">
              {selectedCircular.file_url && (
                <button
                  onClick={() => {
                    window.open(`http://127.0.0.1:8000${selectedCircular.file_url}`, "_blank");
                  }}
                  className="action-btn"
                >
                  View Attachment
                </button>
              )}

              <button
                onClick={() => handleUnarchive(selectedCircular.id)}
                className="action-btn"
              >
                Unarchive
              </button>

              <button onClick={() => setSelectedCircular(null)} className="action-btn secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default ArchivePage;