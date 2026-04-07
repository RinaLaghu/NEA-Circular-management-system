import { useState } from "react";
import PageLayout from "../components/PageLayout";

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

  return (
    <PageLayout>
      <div className="nc-header">
        <p className="nc-label">OFFICIAL COMMUNICATION</p>
        <h1>Compose Circular</h1>
      </div>

      <div className="nc-layout">
        <div className="nc-main">
          <div className="nc-card">
            <div className="nc-field-label">CIRCULAR TITLE / SUBJECT</div>
            <input
              className="nc-input"
              placeholder="Enter a concise subject line..."
              value={circularTitle}
              onChange={(e) => setCircularTitle(e.target.value)}
            />

            <div className="nc-row">
              <div className="nc-col">
                <div className="nc-field-label">CATEGORY</div>
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
                <div className="nc-field-label">PRIORITY LEVEL</div>
                <div className="nc-priority-group">
                  {["routine", "urgent", "confidential"].map((p) => (
                    <button
                      type="button"
                      key={p}
                      className={`nc-priority-btn ${p} ${
                        priority === p ? "active" : ""
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="nc-card">
            <div className="nc-recipient-header">
              <div>
                <div className="nc-recipient-title">Recipient Selection</div>
                <div className="nc-recipient-sub">
                  Define the internal and external distribution list.
                </div>
              </div>
              <span className="nc-protocol-badge">
                ✓ Through Administration Protocol Active
              </span>
            </div>

            <div className="nc-recipient-grid">
              <div>
                <div className="nc-section-mini-title">INTERNAL DEPARTMENTS</div>
                {INTERNAL_DEPTS.map((dept) => (
                  <div
                    key={dept.id}
                    className={`nc-dept-item ${
                      selectedInternal === dept.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedInternal(dept.id)}
                  >
                    <div className="nc-dept-radio" />
                    <div>
                      <div className="nc-dept-name">{dept.name}</div>
                      <div className="nc-dept-desc">{dept.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <div className="nc-section-mini-title">EXTERNAL DIRECTORATES</div>
                {EXTERNAL_DEPTS.map((dept) => {
                  const isSelected = selectedExternal.includes(dept.id);
                  return (
                    <div
                      key={dept.id}
                      className={`nc-dept-item ${isSelected ? "selected external" : ""}`}
                      onClick={() => toggleExternal(dept.id)}
                    >
                      <div className="nc-dept-checkbox">
                        {isSelected ? "✓" : ""}
                      </div>
                      <div className="nc-dept-name">{dept.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="nc-card">
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
              placeholder="Commence drafting the official circular text here..."
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={10}
            />
          </div>
        </div>

        <div className="nc-side">
          <div className="nc-card">
            <div className="nc-attach-title">ATTACHMENTS</div>
            <div className="nc-attach-sub">
              Official scans and supporting documents.
            </div>

            <div
              className="nc-drop-zone"
              onClick={() => document.getElementById("fileInput").click()}
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
            <span>ℹ️</span>
            Circulars sent before 14:00 will be reviewed by the Directorate on
            the same business day.
          </div>
        </div>
      </div>

      <div className="nc-footer">
        <div className="nc-autosave">
          <span className="nc-autosave-dot" />
          Draft auto-saved at 11:24 AM
        </div>

        <div className="nc-footer-actions">
          <button className="secondary-btn">Save as Draft</button>
          <button className="secondary-btn">Preview</button>
          <button className="primary-btn">Send Circular</button>
        </div>
      </div>
    </PageLayout>
  );
}

export default NewCircularPage;