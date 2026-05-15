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

        <div className="viewer-actions" style={{ marginTop: "20px" }}>
          {circular.file_url && (
            <a href={`http://127.0.0.1:8000/circular/download/${circular.id}`} download className="action-btn">Download</a>
          )}
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
                date={circular.date || ""}
                time={circular.time || ""}
              />
            </div>
          ))
        )}
      </div>

      {selectedCircular && (
        <SentCircularViewer circular={selectedCircular} onClose={() => setSelectedCircular(null)} />
      )}

      {/* bottom-status-bar removed per request */}
    </PageLayout>
  );
}

export default SentPage;