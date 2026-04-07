import { useState } from "react";
import "./App.css";
import NotificationIcon from './assets/container.png';

import SearchIcon from './assets/a.png';
import HelpIcon from './assets/b.png';
import inboxIcon from './assets/d.png';
import draftsIcon from './assets/f.png';
import sentIcon from './assets/e.png';
import archiveIcon from './assets/icon.png';
import settingsIcon from './assets/icon2.png'; 
import logoutIcon from './assets/icon3.png';
import logo from "./assets/logo.png";

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

const INBOX_ITEMS = [
  { id: 1, from: "Finance Directorate", subject: "Q3 Budget Approval Circular", date: "Apr 05", tag: "urgent", unread: true },
  { id: 2, from: "HR Department", subject: "Leave Policy Amendment 2025", date: "Apr 04", tag: "routine", unread: true },
  { id: 3, from: "Legal Affairs", subject: "Compliance Deadline Reminder", date: "Apr 03", tag: "confidential", unread: false },
  { id: 4, from: "Project Management", subject: "Infrastructure Expansion Notice", date: "Apr 01", tag: "routine", unread: false },
];

const SENT_ITEMS = [
  { id: 1, to: "Finance Directorate", subject: "Policy_Framework_2024 Distribution", date: "Apr 04", tag: "routine" },
  { id: 2, to: "HR Department", subject: "Recruitment Drive Announcement", date: "Mar 30", tag: "urgent" },
  { id: 3, to: "All Departments", subject: "Annual Audit Circular", date: "Mar 28", tag: "confidential" },
];

const DRAFT_ITEMS = [
  { id: 1, subject: "Untitled Circular — Apr 06", lastSaved: "11:24 AM today", tag: "urgent" },
  { id: 2, subject: "Transmission Grid Maintenance Notice", lastSaved: "Yesterday, 3:10 PM", tag: "routine" },
];

const ARCHIVE_ITEMS = [
  { id: 1, subject: "New Year Operational Circular 2025", date: "Jan 01", from: "Admin Office", tag: "routine" },
  { id: 2, subject: "Emergency Power Shutdown Protocol", date: "Dec 14", from: "Operations", tag: "urgent" },
  { id: 3, subject: "Board Meeting Minutes Distribution", date: "Nov 22", from: "Secretariat", tag: "confidential" },
  { id: 4, subject: "Revised Leave Encashment Policy", date: "Nov 10", from: "HR Department", tag: "routine" },
  { id: 5, subject: "FY2024 Final Accounts Circular", date: "Oct 31", from: "Finance", tag: "confidential" },
];

const TAG_STYLES = {
  urgent: { background: "#fdecea", color: "#c0392b", border: "1px solid #f5c6c2" },
  routine: { background: "#e8edf5", color: "#1a3060", border: "1px solid #c8d4e8" },
  confidential: { background: "#f3f0ff", color: "#7c3aed", border: "1px solid #d8d0f8" },
};

function TagBadge({ tag }) {
  return (
    <span style={{
      ...TAG_STYLES[tag],
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px",
      textTransform: "uppercase", padding: "3px 8px", borderRadius: "20px",
      fontFamily: "var(--mono)", whiteSpace: "nowrap",
    }}>
      {tag}
    </span>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h1 className="page-heading">{title}</h1>
      {subtitle && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{subtitle}</p>}
    </div>
  );
}

function InboxPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <PageHeader title="Inbox" subtitle={`${INBOX_ITEMS.filter(i => i.unread).length} unread circulars`} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {INBOX_ITEMS.map((item) => (
          <div
            key={item.id}
            className="card"
            onClick={() => setSelected(selected === item.id ? null : item.id)}
            style={{
              cursor: "pointer", padding: "16px 20px",
              borderLeft: item.unread ? "3px solid var(--accent-blue)" : "3px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--navy), var(--accent-blue))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: "13px",
                }}>
                  {item.from[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: item.unread ? 700 : 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.subject}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>From: {item.from}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <TagBadge tag={item.tag} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{item.date}</span>
                {item.unread && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--accent-blue)", display: "inline-block" }} />}
              </div>
            </div>
            {selected === item.id && (
              <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--border)", fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                This circular was issued regarding <strong>{item.subject}</strong>. Please review the attached documents and respond within the stipulated timeframe as per NEA administrative protocol.
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button className="btn-primary" style={{ padding: "7px 16px", fontSize: "12px" }}>Reply</button>
                  <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: "12px" }}>Forward</button>
                  <button className="btn-secondary" style={{ padding: "7px 16px", fontSize: "12px" }}>Archive</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SentPage() {
  return (
    <div>
      <PageHeader title="Sent" subtitle={`${SENT_ITEMS.length} circulars sent`} />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {SENT_ITEMS.map((item) => (
          <div key={item.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <span style={{ fontSize: "20px" }}>📤</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.subject}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>To: {item.to}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <TagBadge tag={item.tag} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DraftsPage({ onCompose }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className="page-heading">Drafts</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>{DRAFT_ITEMS.length} saved drafts</p>
        </div>
        <button className="btn-primary" onClick={onCompose}>+ New Circular</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {DRAFT_ITEMS.map((item) => (
          <div key={item.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", cursor: "pointer" }}
            onClick={onCompose}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <span style={{ fontSize: "20px" }}>📝</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{item.subject}</div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>Last saved: {item.lastSaved}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <TagBadge tag={item.tag} />
              <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px" }} onClick={(e) => { e.stopPropagation(); onCompose(); }}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchivePage() {
  const [search, setSearch] = useState("");
  const filtered = ARCHIVE_ITEMS.filter(i =>
    i.subject.toLowerCase().includes(search.toLowerCase()) ||
    i.from.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <PageHeader title="Archive" subtitle="All past circulars" />
      <input
        className="text-input"
        placeholder="Search archived circulars..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "20px" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No circulars match your search.</div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="card" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <span style={{ fontSize: "20px" }}>🗂️</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.subject}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>From: {item.from}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <TagBadge tag={item.tag} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComposePage() {
  const [circularTitle, setCircularTitle] = useState("");
  const [category, setCategory] = useState("Administrative Policy");
  const [priority, setPriority] = useState("urgent");
  const [selectedInternal, setSelectedInternal] = useState("hr");
  const [selectedExternal, setSelectedExternal] = useState(["fin"]);
  const [bodyText, setBodyText] = useState("");
  const [files, setFiles] = useState([]);

  const toggleExternal = (id) =>
    setSelectedExternal((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const wordCount = bodyText.trim() ? bodyText.trim().split(/\s+/).length : 0;

  const handleFiles = (fileList) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];

  const newFiles = Array.from(fileList).map((file) => ({
    id: Date.now() + Math.random(),
    name: file.name,
    size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    status: allowed.includes(file.type) ? "ok" : "error",
    error: allowed.includes(file.type)
      ? ""
      : "Only PDF, JPG, PNG allowed",
  }));

  setFiles((prev) => [...prev, ...newFiles]);
};
const removeFile = (id) => {
  setFiles((prev) => prev.filter((f) => f.id !== id));
};

  return (
    <div className="page-body">
      <div className="compose-panel">
        <div>
          <div className="official-badge">Official Communication</div>
          <h1 className="page-heading">Compose Circular</h1>
        </div>

        {/* Title + Meta */}
        <div className="card">
          <div className="field-label">Circular Title / Subject</div>
          <input className="text-input" placeholder="Enter a concise subject line..." value={circularTitle} onChange={(e) => setCircularTitle(e.target.value)} />
          <div className="fields-row">
            <div className="field-group">
              <div className="field-label">Category</div>
              <select className="select-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option>Administrative Policy</option>
                <option>Technical Directive</option>
                <option>Financial Notice</option>
                <option>HR Circular</option>
              </select>
            </div>
            <div className="field-group">
              <div className="field-label">Priority Level</div>
              <div className="priority-group">
                {["routine", "urgent", "confidential"].map((p) => (
                  <button key={p} className={`priority-btn ${p}${priority === p ? " active" : ""}`} onClick={() => setPriority(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="card recipient-card">
          <div className="recipient-header">
            <div>
              <div className="recipient-title">Recipient Selection</div>
              <div className="recipient-sub">Define the internal and external distribution list.</div>
            </div>
            <span className="protocol-badge">Through Administration Protocol Active</span>
          </div>
          <div className="recipients-grid">
            <div>
              <div className="dept-column-title internal">Internal Departments</div>
              {INTERNAL_DEPTS.map((dept) => (
                <div key={dept.id} className={`dept-item${selectedInternal === dept.id ? " selected" : ""}`} onClick={() => setSelectedInternal(dept.id)}>
                  <div className="dept-radio" />
                  <div>
                    <div className="dept-name">{dept.name}</div>
                    {dept.desc && <div className="dept-desc">{dept.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="dept-column-title external">External Directorates</div>
              {EXTERNAL_DEPTS.map((dept) => {
                const isSelected = selectedExternal.includes(dept.id);
                return (
                  <div key={dept.id} className={`dept-item${isSelected ? " selected external" : ""}`} onClick={() => toggleExternal(dept.id)}>
                    <div className="dept-checkbox">{isSelected ? "✓" : ""}</div>
                    <div className="dept-name">{dept.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="card editor-card">
          <div className="editor-toolbar">
            <div className="toolbar-tools">
              <button className="tool-btn"><b>B</b></button>
              <button className="tool-btn"><i>I</i></button>
              <button className="tool-btn">☰</button>
              <div className="tool-divider" />
              <button className="tool-btn">🔗</button>
            </div>
            <span className="word-count">WORD COUNT: {wordCount}</span>
          </div>
          <textarea
            className="editor-textarea"
            placeholder="Commence drafting the official circular text here. Use precise, authoritative language..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={10}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="card attach-card">
          <div className="attach-title">ATTACHMENTS</div>
          <div className="attach-sub">Official scans and supporting documents.</div>
          <div
  className="drop-zone"
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

  <div className="drop-icon">📄</div>
  <div className="drop-text">Drop files here</div>
  <div className="drop-sub">or click to browse local storage</div>
</div>
          {files.map((file) =>
            file.status === "ok" ? (
              <div key={file.id} className="file-item">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">{file.size} · Ready to transmit</div>
                </div>
                <button className="file-remove" onClick={() => removeFile(file.id)}>
  ✕
</button>
              </div>
            ) : (
              <div key={file.id} className="file-item error">
                <span className="file-icon">⚠️</span>
                <div className="file-info">
                  <div className="file-name error">{file.name}</div>
                  <div className="file-meta error">Validation Error: {file.error}</div>
                </div>
                <button className="file-remove" onClick={() => removeFile(file.id)}>
  🗑️
</button>
              </div>
            )
          )}
        </div>
        <div className="info-banner">
          <span className="info-banner-icon">ℹ️</span>
          Circulars sent before 14:00 will be reviewed by the Directorate on the same business day.
        </div>
      </div>
    </div>
  );
}

const PAGE_TITLES = {
  inbox: "Inbox",
  drafts: "Drafts",
  compose: "Compose Circular",
  sent: "Sent",
  archive: "Archive",
};

export default function NEACircularManagement() {
  const [activeNav, setActiveNav] = useState("drafts");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const navigate = (page) => {
    setActiveNav(page);
    closeSidebar();
  };

  const renderPage = () => {
    switch (activeNav) {
      case "inbox":   return <InboxPage />;
      case "sent":    return <SentPage />;
      case "archive": return <ArchivePage />;
      case "compose": return <ComposePage />;
      case "drafts":
      default:        return <DraftsPage onCompose={() => navigate("compose")} />;
    }
  };

  const isCompose = activeNav === "compose";

  return (
    <div className="nea-app">
      <div className={`sidebar-overlay${sidebarOpen ? " active" : ""}`} onClick={closeSidebar} />

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
       <div className="sidebar-logo">
  <img src={logo} alt="NEA Logo" className="logo-icon" />

  <div className="logo-text">
    <div className="name">NEA</div>
    <div className="sub">Circular Ledger</div>
  </div>
</div>

        <button className="send-btn" onClick={() => navigate("compose")}>
          <span>+</span> Send New Circular
        </button>
<nav className="nav-section">
  {[
    { id: "inbox", icon: inboxIcon, label: "Inbox" },
    { id: "drafts", icon: draftsIcon, label: "Drafts" },
    { id: "sent", icon: sentIcon, label: "Sent" },
    { id: "archive", icon: archiveIcon, label: "Archive" },
  ].map((item) => (
    <button
      key={item.id}
      className={`nav-item${activeNav === item.id ? " active" : ""}`}
      onClick={() => setActiveNav(item.id)}
    >
      <img src={item.icon} alt={item.label} className="nav-icon" />
      {item.label}
    </button>
  ))}
</nav>

       <div className="sidebar-footer">
  {[
    { id: "settings", icon: settingsIcon, label: "Settings" },
    { id: "logout", icon: logoutIcon, label: "Logout" },
  ].map((item) => (
    <button
      key={item.id}
      className="nav-item"
      onClick={() => {
  if (!["settings", "logout"].includes(item.id)) {
    setActiveNav(item.id);
  }
}}
    >
      <img src={item.icon} alt={item.label} className="nav-icon" />
      {item.label}
    </button>
  ))}
</div>
      </aside>

      {/* MAIN */}
      <div className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="topbar-title">NEA Circular Management</span>
          </div>
          <div className="topbar-right">
            <div className="search-bar">
  <img src={SearchIcon} alt="search" className="icon-img" />

  <input
    type="text"
    placeholder="Search archives..."
    className="search-input"
  />
</div>
            
            <button className="icon-btn">
              <img src={NotificationIcon} alt="notification" className="icon-img" />
            </button>
            
            <button className="icon-btn">
              <img src={HelpIcon} alt="help" className="icon-img" />
            </button>
            <div className="avatar">U</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className={isCompose ? "" : "page-body"} style={isCompose ? {} : { display: "block" }}>
          {!isCompose && (
            <div style={{ width: "100%" }}>
              {renderPage()}
            </div>
          )}
          {isCompose && renderPage()}
        </div>

        {/* FOOTER */}
        <footer className="compose-footer">
          <div className="autosave">
            <span className="autosave-dot" />
            {isCompose ? "Draft auto-saved at 11:24 AM" : `Viewing: ${PAGE_TITLES[activeNav]}`}
          </div>
          <div className="footer-actions">
            {isCompose ? (
              <>
                <button className="btn-secondary">Save as Draft</button>
                <button className="btn-secondary">👁 Preview</button>
                <button className="btn-primary">➤ Send Circular</button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => navigate("compose")}>+ New Circular</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
