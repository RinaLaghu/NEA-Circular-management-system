import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CircularListCard from "@/components/ui/CircularListCard";
import { useNavigate } from "react-router-dom";
import { authFetch } from "@/utils/api";
import { API_BASE_URL } from "@/utils/config";

function DraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [search, setSearch] = useState("");

  // FETCH DRAFTS
  useEffect(() => {
  const fetchDrafts = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/circular/drafts`);
      const data = await res.json();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load drafts:", error);
    }
  };

  fetchDrafts();
}, []);

  const filteredDrafts = drafts.filter((draft) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (draft.subject || "").toLowerCase().includes(query) ||
      (draft.description || "").toLowerCase().includes(query) ||
      (draft.reference_no || "").toLowerCase().includes(query)
    );
  });

  // DELETE DRAFT
  const deleteDraft = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this draft?");
    if (!confirmDelete) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/circular/delete/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Failed to delete draft");
        return;
      }

      setDrafts((prev) => prev.filter((draft) => draft.id !== id));
      alert("Draft deleted successfully");
    } catch (error) {
      console.error("Failed to delete draft:", error);
      alert("Backend connection failed");
    }
  };

  return (
    <PageLayout>
      <div className="simple-page-header">
        <div>
          <h1>Drafts</h1>
          <p className="simple-subtitle">{filteredDrafts.length} saved drafts</p>
        </div>
      </div>

      <div className="archive-search-wrap" style={{ marginTop: 18, marginBottom: 12 }}>
        <input
          type="text"
          className="archive-search-input"
          placeholder="Search drafts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cards-stack">
        {drafts.length === 0 ? (
          <p className="simple-subtitle">No drafts found.</p>
        ) : (
          filteredDrafts.map((draft) => (
            <CircularListCard
              key={draft.id}
              icon="📝"
              title={draft.subject || "Untitled Circular"}   // 🔥 fix
              subtitle={`Ref: ${draft.reference_no || "-"}`}
              tag={(draft.priority || "routine").toUpperCase()} // 🔥 fix
              tagType={draft.priority || "routine"}
              actionLabel="Edit"
              onAction={() => navigate(`/new-circular?draftId=${draft.id}`)}
              secondActionLabel="Delete"
              onSecondAction={() => deleteDraft(draft.id)}
            />
          ))
        )}
      </div>

      {/* bottom-status-bar removed per request */}
    </PageLayout>
  );
}

export default DraftsPage;