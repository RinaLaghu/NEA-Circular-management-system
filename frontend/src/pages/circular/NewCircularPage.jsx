import { useState, useEffect  ,useMemo } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CircularPreviewPage from "@/pages/circular/CircularPreviewPage";
import { authFetch } from "@/utils/api";
import { useNavigate, useSearchParams } from "react-router-dom";


function NewCircularPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draftId");
  const [departments, setDepartments] = useState([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);
  const [circularTitle, setCircularTitle] = useState("");
  const [category, setCategory] = useState("Administrative Policy");
  const [priority, setPriority] = useState("urgent");
  const [selectedInternal, setSelectedInternal] = useState("hr");
  const [selectedExternal, setSelectedExternal] = useState(["gen"]);
  const [bodyText, setBodyText] = useState("");
  const [files, setFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedDirectorates, setExpandedDirectorates] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/department/all")
    .then(res => res.json())
    .then(data => setDepartments(data))
    .catch(err => console.error("Failed to load departments:", err));
}, []);

const toggleDept = (id) => {
  setSelectedDeptIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
};
const toggleExpandDirectorate = (dirId) => {
  setExpandedDirectorates(prev =>
    prev.includes(dirId) ? prev.filter(id => id !== dirId) : [...prev, dirId]
  );
};

const toggleExternalDirectorate = (key) => {
  setSelectedExternal(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
  );
};

const toggleExternalDept = (key) => {
  setSelectedExternal(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
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
  let isAdministration = false;
  if (isLoggedIn) {
    try {
      const deptData = JSON.parse(localStorage.getItem("department"));
      isAdministration = deptData?.is_administration === true;
    } catch (e) {}
  }
// Add this
const currentUser = JSON.parse(localStorage.getItem("department"));
const DIRECTORATE_NAMES = {
  1: "Planning, Monitoring and IT",
  2: "Business Development",
  3: "Administration",
  4: "Finance",
  5: "Generation",
  6: "Transmission",
  7: "Distribution & Consumer Services",
  8: "Engineering Service",
  9: "Project Management",
};
const directorates = useMemo(() => {
  const map = {};
  departments.forEach(d => {
    if (d.directorate_id && !map[d.directorate_id]) {
      map[d.directorate_id] = { id: d.directorate_id, name: d.directorate_name };
    }
  });
  return Object.values(map);
}, [departments]);

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
formData.append("receiver_department_id", selectedDeptIds[0] || "");

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

  const saveAndSend = async () => {
  if (!circularTitle.trim()) {
    alert("Please enter circular title");
    return;
  }
  if (!bodyText.trim()) {
    alert("Please enter circular body");
    return;
  }

  // Build receiver ids
  const externalDeptIds = selectedExternal
    .filter(key => key.startsWith("dept_"))
    .map(key => parseInt(key.replace("dept_", "")));

  const externalDirIds = selectedExternal
    .filter(key => key.startsWith("dir_"))
    .map(key => parseInt(key.replace("dir_", "")));

  const dirDeptIds = departments
    .filter(d => externalDirIds.includes(d.directorate_id))
    .map(d => d.id);

  const allReceiverIds = [
    ...new Set([...selectedDeptIds, ...externalDeptIds, ...dirDeptIds])
  ];

  if (allReceiverIds.length === 0) {
    alert("Please select at least one recipient department.");
    return;
  }

  // Step 1: Save or update draft first to get draftId
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
  formData.append("receiver_department_id", allReceiverIds[0]);

  const validFile = files.find(f => f.status === "ok");
  if (validFile) formData.append("file", validFile.file);

  const apiUrl = draftId
    ? `http://127.0.0.1:8000/circular/${draftId}`
    : "http://127.0.0.1:8000/circular/draft";

  const method = draftId ? "PUT" : "POST";

  try {
    const draftRes = await authFetch(apiUrl, { method, body: formData });

    if (!draftRes.ok) {
      const error = await draftRes.json();
      alert(error.detail || "Failed to save draft");
      return;
    }

    const draftData = await draftRes.json();
    const resolvedDraftId = draftId || draftData.id;

    // Step 2: Send
    const sendRes = await authFetch(`http://127.0.0.1:8000/circular/${resolvedDraftId}/send`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allReceiverIds),
    });

    if (!sendRes.ok) {
      const error = await sendRes.json();
      alert(error.detail || "Failed to send circular");
      return;
    }

    alert("Circular sent successfully!");
    navigate("/sent");
  } catch (err) {
    console.error("Send error:", err);
    alert("Backend connection failed");
  }
};
const sendCircular = async () => {
  if (!draftId) {
    alert("Please save as draft first.");
    return;
  }

console.log("selectedDeptIds:", selectedDeptIds);
console.log("selectedExternal:", selectedExternal);

  const externalDeptIds = selectedExternal
    .filter(key => key.startsWith("dept_"))
    .map(key => parseInt(key.replace("dept_", "")));

  const externalDirIds = selectedExternal
    .filter(key => key.startsWith("dir_"))
    .map(key => parseInt(key.replace("dir_", "")));

  const dirDeptIds = departments
    .filter(d => externalDirIds.includes(d.directorate_id))
    .map(d => d.id);

  const allReceiverIds = [
    ...new Set([...selectedDeptIds, ...externalDeptIds, ...dirDeptIds])
  ];

  if (allReceiverIds.length === 0) {
    alert("Please select at least one recipient department.");
    return;
  }

  try {
    const res = await authFetch(`http://127.0.0.1:8000/circular/${draftId}/send`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(allReceiverIds),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.detail || "Failed to send circular");
      return;
    }

    alert("Circular sent successfully!");
    navigate("/sent");
  } catch (err) {
    console.error("Send circular error:", err);
    alert("Backend connection failed");
  }
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
  {/* INTERNAL: Only departments in the same directorate as logged-in user */}
  <div>
    <div className="nc-section-mini-title">INTERNAL DEPARTMENTS</div>
    {departments
      .filter(dept => dept.directorate_id === currentUser?.directorate_id)
      .map(dept => (
        <button
          key={dept.id}
          type="button"
          className={`nc-dept-card ${selectedDeptIds.includes(dept.id) ? "selected" : ""}`}
          onClick={() => toggleDept(dept.id)}
        >
          <span className="nc-check-box">
            {selectedDeptIds.includes(dept.id) ? "✓" : ""}
          </span>
          <div className="nc-dept-text">
            <span className="nc-dept-name">{dept.name}</span>
          </div>
        </button>
      ))}
  </div>

  {/* EXTERNAL: Other directorates, expandable */}
  <div>
    <div className="nc-section-mini-title">EXTERNAL DIRECTORATES</div>
    {directorates
      .filter(dir => dir.id !== currentUser?.directorate_id)
      .map(dir => {
        const isWholeSelected = selectedExternal.includes(`dir_${dir.id}`);
        const isExpanded = expandedDirectorates.includes(dir.id);
        const depsUnderDir = departments.filter(d => d.directorate_id === dir.id);

        return (
          <div key={dir.id}>
            {/* Directorate row */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className={`nc-dept-card ${isWholeSelected ? "selected external" : ""}`}
                onClick={() => toggleExternalDirectorate(`dir_${dir.id}`)}
                style={{ flex: 1 }}
              >
                <span className="nc-check-box">{isWholeSelected ? "✓" : ""}</span>
                <div className="nc-dept-text">
                  <span className="nc-dept-name">{dir.name}</span>
                </div>
              </button>

              {/* Expand/collapse */}
              <button
                type="button"
                className="nc-tool-btn"
                onClick={() => toggleExpandDirectorate(dir.id)}
              >
                {isExpanded ? "▲" : "▼"}
              </button>
            </div>

            {/* Expanded departments */}
            {isExpanded && depsUnderDir.map(dept => {
              const isDeptSelected = selectedExternal.includes(`dept_${dept.id}`);
              return (
                <button
                  key={dept.id}
                  type="button"
                  className={`nc-dept-card ${isDeptSelected ? "selected external" : ""}`}
                  onClick={() => toggleExternalDept(`dept_${dept.id}`)}
                  style={{ marginLeft: "20px", marginTop: "4px" }}
                >
                  <span className="nc-check-box">{isDeptSelected ? "✓" : ""}</span>
                  <div className="nc-dept-text">
                    <span className="nc-dept-name">{dept.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
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

  {isAdministration && (
    <button type="button" className="nc-primary-btn" onClick={saveAndSend}>
      ➤ Send Circular
    </button>
  )}
</div>
    </PageLayout>
  );
}

export default NewCircularPage;