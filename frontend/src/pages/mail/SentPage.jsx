import { useEffect, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CircularListCard from "@/components/ui/CircularListCard";
import { useNavigate } from "react-router-dom";

function SentCircularViewer({ circular, onClose }) {
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
          {isPDF && <iframe src={fileUrl} width="100%" height="500px" />}
          {isImage && <img src={fileUrl} alt="preview" style={{ maxWidth: "100%" }} />}
          {!isPDF && !isImage && <p>No preview available for this file type</p>}
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <a href={fileUrl} download className="action-btn">Download</a>
          <button onClick={onClose} className="action-btn secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

function SentPage() {
  const navigate = useNavigate();
  const [sentCirculars, setSentCirculars] = useState([]);
  const [selectedCircular, setSelectedCircular] = useState(null);

  useEffect(() => {
    const fetchSent = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://127.0.0.1:8000/circular/sent", { headers });
        const data = await res.json();
        setSentCirculars(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load sent circulars:", error);
      }
    };
    fetchSent();
  }, []);

  return (
    <PageLayout>
      <div className="simple-page-header sent-centered-header">
        <div>
          <h1>Sent</h1>
        </div>
      </div>

      <p className="center-summary-text">{sentCirculars.length} circulars sent</p>

      <div className="cards-stack">
        {sentCirculars.length === 0 ? (
          <p className="simple-subtitle">No sent circulars found.</p>
        ) : (
          sentCirculars.map((circular) => (
            <div key={circular.id} onClick={() => setSelectedCircular(circular)} style={{ cursor: "pointer" }}>
              <CircularListCard
                icon="📤"
                title={circular.subject || "Untitled Circular"}
                subtitle={`Ref: ${circular.reference_no || "-"} • ${circular.description || ""}`}
                tag={(circular.priority || "routine").toUpperCase()}
                tagType={circular.priority || "routine"}
                date={new Date(circular.created_at).toLocaleDateString()}
              />
            </div>
          ))
        )}
      </div>

      {selectedCircular && (
        <SentCircularViewer circular={selectedCircular} onClose={() => setSelectedCircular(null)} />
      )}

      <div className="bottom-status-bar">
        <span className="status-dot"></span>
        <span>Viewing: Sent</span>
        <button className="primary-page-btn bottom-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>
    </PageLayout>
  );
}

export default SentPage;