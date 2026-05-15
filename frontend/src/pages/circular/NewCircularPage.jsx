import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CircularPreviewPage from "@/pages/circular/CircularPreviewPage";
import { authFetch } from "@/utils/api";
import { useNavigate, useSearchParams } from "react-router-dom";

function NewCircularPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");

  const [circularTitle, setCircularTitle] = useState("");
  const [category, setCategory] = useState("Administrative Policy");
  const [priority, setPriority] = useState("urgent");
  
  const [internalDepts, setInternalDepts] = useState([]);
  const [externalDepts, setExternalDepts] = useState([]);
  
  const [selectedInternal, setSelectedInternal] = useState([]);
  const [selectedExternal, setSelectedExternal] = useState([]);
  const [bodyText, setBodyText] = useState("");
  const [files, setFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Fetch draft data if editing
    if (draftId) {
      authFetch(`http://127.0.0.1:8000/circular/${draftId}`)
        .then((res) => res.json())
        .then((data) => {
          setCircularTitle(data.subject || "");
          setBodyText(data.description || "");
          setCategory(data.category || "Administrative Policy");
          setPriority(data.priority || "routine");
          setSelectedInternal(data.selected_internal_dept_ids || []);
          setSelectedExternal(data.selected_external_directorate_ids || []);
        })
        .catch((err) => console.error("Failed to load draft:", err));
    }

    // Fetch recipients
    authFetch("http://127.0.0.1:8000/circular/recipients")
      .then((res) => res.json())
      .then((data) => {
        setInternalDepts(data.internal || []);
        setExternalDepts(data.external || []);
      })
      .catch((err) => console.error("Failed to load recipients:", err));
  }, [draftId]);

  const toggleInternal = (id) => {
    setSelectedInternal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

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

  const isLoggedIn = !!localStorage.getItem("token");
  const deptData = (() => {
    try {
      return JSON.parse(localStorage.getItem("department"));
    } catch (e) {
      return null;
    }
  })();
  const isAdministration = deptData?.is_administration === true;

  const saveDraft = async () => {
    if (!circularTitle.trim()) {
      alert("Please enter circular title");
      return;
    }

    if (!bodyText.trim()) {
      alert("Please enter circular description/body");
      return;
    }

    const formData = new FormData();

    formData.append("subject", circularTitle);
    formData.append("description", bodyText);
    formData.append("category", category);
    formData.append("priority", priority);

    let senderId = 1;
    try {
      const deptData = JSON.parse(localStorage.getItem("department"));
      if (deptData?.department_id) senderId = deptData.department_id;
    } catch (e) {}

    formData.append("sender_department_id", senderId);
    formData.append("selected_internal_dept_ids", JSON.stringify(selectedInternal));
    formData.append("selected_external_directorate_ids", JSON.stringify(selectedExternal));

    const validFile = files.find((f) => f.status === "ok");

    if (validFile) {
      formData.append("file", validFile.file);
    }

    const apiUrl = draftId
      ? `http://127.0.0.1:8000/circular/${draftId}`
      : "http://127.0.0.1:8000/circular/draft";

    const method = draftId ? "PUT" : "POST";

    try {
      const res = await authFetch(apiUrl, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Failed to save draft");
        return;
      }

      alert(draftId ? "Draft updated successfully" : "Circular saved as draft");
      navigate("/drafts");
    } catch (err) {
      console.error("Save draft error:", err);
      alert("Backend connection failed");
    }
  };

  const sendCircular = async () => {
    if (!circularTitle.trim()) {
      alert("Please enter circular title");
      return;
    }

    if (!bodyText.trim()) {
      alert("Please enter circular description/body");
      return;
    }

    if (selectedInternal.length === 0 && selectedExternal.length === 0) {
      alert("Please select at least one recipient before sending.");
      return;
    }

    const validFile = files.find((f) => f.status === "ok");
    const formData = new FormData();

    formData.append("subject", circularTitle);
    formData.append("description", bodyText);
    formData.append("category", category);
    formData.append("priority", priority);

    let senderId = 1;
    try {
      const storedDept = JSON.parse(localStorage.getItem("department"));
      if (storedDept?.department_id) senderId = storedDept.department_id;
    } catch (e) {}

    formData.append("sender_department_id", senderId);
    formData.append("selected_internal_dept_ids", JSON.stringify(selectedInternal));
    formData.append("selected_external_directorate_ids", JSON.stringify(selectedExternal));

    if (validFile) {
      formData.append("file", validFile.file);
    }

    if (draftId) {
      try {
        const updateRes = await authFetch(`http://127.0.0.1:8000/circular/${draftId}`, {
          method: "PUT",
          body: formData,
        });

        if (!updateRes.ok) {
          const error = await updateRes.json();
          alert(error.detail || "Failed to update draft before sending");
          return;
        }
      } catch (err) {
        console.error("Draft update error before sending:", err);
        alert("Backend connection failed");
        return;
      }

      try {
        const sendRes = await authFetch(`http://127.0.0.1:8000/circular/${draftId}/send`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            internal_dept_ids: selectedInternal,
            external_directorate_ids: selectedExternal,
          }),
        });

        if (!sendRes.ok) {
          const error = await sendRes.json();
          alert(error.detail || "Failed to send circular");
          return;
        }

        alert("Circular sent successfully");
        navigate("/sent");
      } catch (err) {
        console.error("Send circular error:", err);
        alert("Backend connection failed");
      }

      return;
    }

    try {
      const res = await authFetch("http://127.0.0.1:8000/circular/send", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || "Failed to send circular");
        return;
      }

      alert("Circular sent successfully");
      navigate("/sent");
    } catch (err) {
      console.error("Send circular error:", err);
      alert("Backend connection failed");
    }
  };

  if (showPreview) {
    return (
      <CircularPreviewPage
        data={{
          circularTitle,
          category,
          priority,
          selectedInternal,
          selectedExternal,
          internalDepts,
          externalDepts,
          bodyText,
          files,
          fromDepartment: deptData?.department || "Administration Office",
          fromDirectorate: deptData?.directorate || "Administration",
        }}
        onBack={() => setShowPreview(false)}
        onSend={sendCircular}
        isAdministration={isAdministration}
      />
    );
  }

  const DIRECTORATE_NAMES = {
    "A": "Planning, Monitoring and IT",
    "B": "Business Development",
    "C": "Administration",
    "D": "Finance",
    "E": "Generation",
    "F": "Transmission",
    "G": "Distribution & Consumer Services",
    "H": "Engineering Service",
    "I": "Project Management",
    "X": "BOARD OF DIRECTORS"
  };

  return (
    <PageLayout>
      <div className="nc-header">
        <p className="nc-label">OFFICIAL COMMUNICATION</p>
        <h1>{draftId ? "Edit Draft Circular" : "Compose Circular"}</h1>
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
                      priority === "confidential"
                        ? "is-active confidential"
                        : ""
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
                {internalDepts.length === 0 && (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>No internal departments available.</p>
                )}
                {internalDepts.map((dept) => {
                  const isSelected = selectedInternal.includes(dept.id);
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`nc-dept-card ${
                        isSelected ? "selected internal" : ""
                      }`}
                      onClick={() => toggleInternal(dept.id)}
                    >
                      <span className="nc-check-box">
                        {isSelected ? "✓" : ""}
                      </span>
                      <div className="nc-dept-text">
                        <span className="nc-dept-name">{dept.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="nc-section-mini-title">EXTERNAL DIRECTORATES</div>
                {externalDepts.length === 0 && (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}>No external directorates available.</p>
                )}

                {externalDepts.map((dept) => {
                  const isSelected = selectedExternal.includes(dept.id);
                  const displayName = DIRECTORATE_NAMES[dept.name] ? `${dept.name} - ${DIRECTORATE_NAMES[dept.name]}` : dept.name;

                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`nc-dept-card ${
                        isSelected ? "selected external" : ""
                      }`}
                      onClick={() => toggleExternal(dept.id)}
                    >
                      <span className="nc-check-box">
                        {isSelected ? "✓" : ""}
                      </span>
                      <div className="nc-dept-text">
                        <span className="nc-dept-name">{displayName}</span>
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
                <button type="button" className="nc-tool-btn">
                  <b>B</b>
                </button>
                <button type="button" className="nc-tool-btn">
                  <i>I</i>
                </button>
                <button type="button" className="nc-tool-btn">
                  ☰
                </button>
                <div className="nc-tool-divider" />
                <button type="button" className="nc-tool-btn">
                  🔗
                </button>
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
            <div className="nc-attach-sub">
              Official scans and supporting documents.
            </div>

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
                className={`nc-file-item ${
                  file.status === "error" ? "error" : ""
                }`}
              >
                <div className="nc-file-left">
                  <span className="nc-file-icon">
                    {file.status === "ok" ? "📄" : "⚠️"}
                  </span>
                  <div className="nc-file-info">
                    <div
                      className={`nc-file-name ${
                        file.status === "error" ? "error" : ""
                      }`}
                    >
                      {file.name}
                    </div>
                    <div
                      className={`nc-file-meta ${
                        file.status === "error" ? "error" : ""
                      }`}
                    >
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
          {draftId ? "Editing existing draft" : "Draft auto-saved at 11:24 AM"}
        </div>

        <div className="nc-footer-actions">
          <button type="button" className="nc-secondary-btn" onClick={saveDraft}>
            {draftId ? "Update Draft" : "Save as Draft"}
          </button>

          <button
            type="button"
            className="nc-secondary-btn"
            onClick={() => setShowPreview(true)}
          >
            👁 Preview
          </button>

          {/* All departments (including non-admins) can send circulars now, 
              but the backend validates target routing rules. */}
          <button type="button" className="nc-primary-btn" onClick={sendCircular}>
            ➤ Send Now
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

export default NewCircularPage;