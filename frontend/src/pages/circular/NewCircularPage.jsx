import { useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CircularPreviewPage from "@/pages/circular/CircularPreviewPage";
import { useNavigate } from "react-router-dom"; 

const INTERNAL_DEPTS = [
  { id: "hr", name: "Human Resource", desc: "Ensures Labor law" },
  { id: "legal", name: "Legal Affairs", desc: "Policy verification unit" },
  { id: "recruit", name: "Recruitment Dept.", desc: "Hiring the right" },
];

const EXTERNAL_DEPTS = [
  { id: "gen", name: "Generation Directorate" },
  { id: "trans", name: "Transmission Directorate" },
  { id: "fin", name: "Finance Directorate" },
  { id: "pm", name: "Project Management dir." },
];

function NewCircularPage() {
  const [circularTitle, setCircularTitle] = useState("");
  const [category, setCategory] = useState("Administrative Policy");
  const [priority, setPriority] = useState("urgent");
  const [selectedInternal, setSelectedInternal] = useState("hr");
  const [selectedExternal, setSelectedExternal] = useState(["gen"]);
  const [bodyText, setBodyText] = useState("");
  const [files, setFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false); // NEW
  const navigate = useNavigate(); // NEW

  const toggleExternal = (id) => {
    setSelectedExternal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;

  const handleFiles = (fileList) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];

  const newFiles = Array.from(fileList).map((file) => ({
    id: Date.now() + Math.random(),
    file,
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    status: allowed.includes(file.type) ? "ok" : "error",
    error: allowed.includes(file.type) ? "" : "Only PDF, JPG, PNG allowed",
  }));

  setFiles((prev) => [...prev, ...newFiles]);
};

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // NEW — swap to preview when Preview button clicked
  if (showPreview) {
    return (
      <CircularPreviewPage
        data={{
          circularTitle,
          category,
          priority,
          selectedInternal,
          selectedExternal,
          bodyText,
          files,
        }}
        onBack={() => setShowPreview(false)}
        onSend={() => {
          alert("Circular sent!"); // replace with your actual send API call
          setShowPreview(false);
        }}
      />
    );
  }
  const saveDraft = async () => {
    const formData = new FormData();

    formData.append("subject", circularTitle);
    formData.append("description", bodyText);
    formData.append("category", category);
    formData.append("priority", priority);

    // temporary hardcoded IDs
    // later replace with logged-in user's department id
    formData.append("sender_department_id", 1);
    formData.append("receiver_department_id", 2);

    const validFile = files.find((f) => f.status === "ok");

    if (validFile) {
      formData.append("file", validFile.file);
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/circular/draft", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Failed to save draft");
        return;
      }

      alert("Circular saved as draft");
      navigate("/drafts");
    } catch (err) {
      alert(err.message || "Backend connection failed");
    }
  };
  return (
    <PageLayout>
      <div className="nc-header">
        <p className="nc-label">OFFICIAL COMMUNICATION</p>
        <h1>Compose Circular</h1>
      </div>

      <div className="nc-layout">
        <div className="nc-main">
          <div className="nc-card">
            <div className="nc-field-block">
              <label className="nc-field-label">CIRCULAR TITLE / SUBJECT</label>
              <input
                className="nc-input"
                placeholder="Enter a concise subject line..."
                value={circularTitle}
                onChange={(e) => setCircularTitle(e.target.value)}
              />
            </div>

            <div className="nc-row">
              <div className="nc-col">
                <label className="nc-field-label">CATEGORY</label>
                <select
                  className="nc-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Administrative Policy</option>
                  <option>Technical Directive</option>
                  <option>Financial Notice</option>
                  <option>HR Circular</option>
                </select>
              </div>

              <div className="nc-col">
                <label className="nc-field-label">PRIORITY LEVEL</label>
                <div className="nc-priority-group">
                  <button
                    type="button"
                    className={`nc-priority-btn ${
                      priority === "routine" ? "is-active routine" : ""
                    }`}
                    onClick={() => setPriority("routine")}
                  >
                    ROUTINE
                  </button>
                  <button
                    type="button"
                    className={`nc-priority-btn ${
                      priority === "urgent" ? "is-active urgent" : ""
                    }`}
                    onClick={() => setPriority("urgent")}
                  >
                    URGENT
                  </button>
                  <button
                    type="button"
                    className={`nc-priority-btn ${
                      priority === "confidential" ? "is-active confidential" : ""
                    }`}
                    onClick={() => setPriority("confidential")}
                  >
                    CONFIDENTIAL
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="nc-card">
            <div className="nc-recipient-header">
              <div>
                <h2 className="nc-section-heading">Recipient Selection</h2>
                <p className="nc-recipient-sub">
                  Define the internal and external distribution list.
                </p>
              </div>
              <span className="nc-protocol-badge">
                ✓ THROUGH ADMINISTRATION PROTOCOL ACTIVE
              </span>
            </div>

            <div className="nc-recipient-grid">
              <div>
                <div className="nc-section-mini-title">INTERNAL DEPARTMENTS</div>
                {INTERNAL_DEPTS.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    className={`nc-dept-card ${
                      selectedInternal === dept.id ? "selected internal" : ""
                    }`}
                    onClick={() => setSelectedInternal(dept.id)}
                  >
                    <span className="nc-check-circle">
                      {selectedInternal === dept.id ? "●" : ""}
                    </span>
                    <div className="nc-dept-text">
                      <span className="nc-dept-name">{dept.name}</span>
                      <span className="nc-dept-desc">{dept.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <div className="nc-section-mini-title">EXTERNAL DIRECTORATES</div>
                {EXTERNAL_DEPTS.map((dept) => {
                  const isSelected = selectedExternal.includes(dept.id);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`nc-dept-card ${
                        isSelected ? "selected external" : ""
                      }`}
                      onClick={() => toggleExternal(dept.id)}
                    >
                      <span className="nc-check-box">{isSelected ? "✓" : ""}</span>
                      <div className="nc-dept-text">
                        <span className="nc-dept-name">{dept.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="nc-card nc-editor-card">
            <div className="nc-editor-toolbar">
              <div className="nc-toolbar-tools">
                <button type="button" className="nc-tool-btn"><b>B</b></button>
                <button type="button" className="nc-tool-btn"><i>I</i></button>
                <button type="button" className="nc-tool-btn">☰</button>
                <div className="nc-tool-divider" />
                <button type="button" className="nc-tool-btn">🔗</button>
              </div>
              <span className="nc-word-count">WORD COUNT: {wordCount}</span>
            </div>
            <textarea
              className="nc-textarea"
              placeholder="Commence drafting the official circular text here. Use precise, authoritative language..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={10}
            />
          </div>
        </div>

        <div className="nc-side">
          <div className="nc-card">
            <div className="nc-attach-title">ATTACHMENTS</div>
            <div className="nc-attach-sub">Official scans and supporting documents.</div>

            <div
              className="nc-drop-zone"
              onClick={() => document.getElementById("fileInput")?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="nc-drop-icon">📄</div>
              <div className="nc-drop-text">Drop files here</div>
              <div className="nc-drop-sub">or click to browse local storage</div>
            </div>

            {files.map((file) => (
              <div
                key={file.id}
                className={`nc-file-item ${file.status === "error" ? "error" : ""}`}
              >
                <div className="nc-file-left">
                  <span className="nc-file-icon">
                    {file.status === "ok" ? "📄" : "⚠️"}
                  </span>
                  <div className="nc-file-info">
                    <div className={`nc-file-name ${file.status === "error" ? "error" : ""}`}>
                      {file.name}
                    </div>
                    <div className={`nc-file-meta ${file.status === "error" ? "error" : ""}`}>
                      {file.status === "ok"
                        ? `${file.size} · Ready to transmit`
                        : `Validation Error: ${file.error}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="nc-file-remove"
                  onClick={() => removeFile(file.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="nc-info-banner">
            <span className="nc-info-icon">ℹ️</span>
            <span>
              Circulars sent before 14:00 will be reviewed by the Directorate on
              the same business day.
            </span>
          </div>
        </div>
      </div>

      <div className="nc-footer">
        <div className="nc-autosave">
          <span className="nc-autosave-dot" />
          Draft auto-saved at 11:24 AM
        </div>
        <div className="nc-footer-actions">
          <button type="button" className="nc-secondary-btn" onClick={() => navigate("/drafts")}>
            Save as Draft
          </button>
          <button
            type="button"
            className="nc-secondary-btn"
            onClick={() => setShowPreview(true)} // NEW
          >
            👁 Preview
          </button>
          <button type="button" className="nc-primary-btn">
            ➤ Send Circular
          </button>
          <button type="button" className="nc-secondary-btn" onClick={saveDraft}>
            Save as Draft
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

export default NewCircularPage;