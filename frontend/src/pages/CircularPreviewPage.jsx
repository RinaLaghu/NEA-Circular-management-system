import PageLayout from "../components/PageLayout";

function CircularPreviewPage({ data, onBack, onSend }) {
  const {
    circularTitle,
    category,
    priority,
    selectedInternal,
    selectedExternal,
    bodyText,
    files,
  } = data;

  const INTERNAL_DEPTS = [
    { id: "hr", name: "Human Resource" },
    { id: "legal", name: "Legal Affairs" },
    { id: "recruit", name: "Recruitment Dept." },
  ];

  const EXTERNAL_DEPTS = [
    { id: "gen", name: "Generation Directorate" },
    { id: "trans", name: "Transmission Directorate" },
    { id: "fin", name: "Finance Directorate" },
    { id: "pm", name: "Project Management Dir." },
  ];

  const internalName =
    INTERNAL_DEPTS.find((d) => d.id === selectedInternal)?.name || "—";

  const externalNames =
    selectedExternal
      .map((id) => EXTERNAL_DEPTS.find((d) => d.id === id)?.name)
      .filter(Boolean)
      .join(", ") || "—";

  const priorityStyles = {
    routine: { background: "#E6F1FB", color: "#185FA5" },
    urgent: { background: "#FCEBEB", color: "#A32D2D" },
    confidential: { background: "#EEEDFE", color: "#534AB7" },
  };

  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const circularNo = `NEA/ADMIN/${new Date().getFullYear()}`;

  return (
    <PageLayout>
        <div className="nc-header">
        
        <h1 style={{ fontSize: "1.8rem" }}>Circular Preview</h1>
        </div>
      <div style={{ background: "var(--color-background-secondary)", minHeight: "100vh", padding: "2rem 1rem" }}>

        {/* Notice document */}
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "var(--color-background-primary)",
          border: "1.5px solid #1e3a5f",
          borderRadius: 8,
          fontFamily: "var(--font-sans)",
          overflow: "hidden",
        }}>

    

          {/* Blue header band */}
          <div style={{ background: "#1e3a5f", padding: "1.5rem 2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 500, letterSpacing: 3, color: "#90aecb", textTransform: "uppercase", marginBottom: 4 }}>
              Nepal Electricity Authority
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "#ffffff" }}>
              Official Circular
            </div>
          </div>

          {/* Blue bottom accent line */}
          <div style={{ height: 4, background: "#e53e3e" }} />

          <div style={{ padding: "2rem 2.5rem" }}>

            {/* Meta table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.25rem", fontSize: 14 }}>
              <tbody>
                <tr>
                  <td style={tdLabel}>Circular No.</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>{circularNo}</td>
                </tr>
                <tr>
                  <td style={tdLabel}>Date</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>{today}</td>
                </tr>
                <tr>
                  <td style={tdLabel}>Category</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>{category}</td>
                </tr>
                <tr>
                  <td style={tdLabel}>Priority</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      letterSpacing: 1,
                      padding: "2px 10px",
                      borderRadius: 3,
                      textTransform: "uppercase",
                      ...priorityStyles[priority],
                    }}>
                      {priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={tdLabel}>From</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>Administration Office, NEA</td>
                </tr>
                <tr>
                  <td style={tdLabel}>To</td>
                  <td style={tdColon}>:</td>
                  <td style={tdValue}>
                    {internalName}
                    {externalNames !== "—" && `, ${externalNames}`}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Divider */}
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.25rem" }} />

            {/* Subject */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.75rem", fontSize: 14 }}>
              <tbody>
                <tr>
                  <td style={tdLabel}>Subject</td>
                  <td style={tdColon}>:</td>
                  <td style={{ ...tdValue, fontWeight: 500, fontSize: 15, color: "#1e3a5f" }}>
                    {circularTitle || "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Divider before body */}
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.5rem" }} />

            {/* Body */}
            <div style={{ fontSize: 14, lineHeight: 2, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", marginBottom: "2rem" , textAlign: "justify"  }}>
              {bodyText || (
                <span style={{ color: "var(--color-text-tertiary)" }}>No body text entered.</span>
              )}
            </div>

            {/* Attachments */}
            {files.filter((f) => f.status === "ok").length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: 12, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase", color: "#e53e3e", marginBottom: 10 }}>
                  Attachments
                </div>
                {files
                  .filter((f) => f.status === "ok")
                  .map((file) => (
                    <div key={file.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      color: "var(--color-text-primary)",
                      marginBottom: 6,
                      padding: "6px 10px",
                      background: "#fff5f5",
                      borderRadius: 4,
                      border: "0.5px solid #feb2b2",
                    }}>
                      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                        <rect x="0.5" y="0.5" width="13" height="15" rx="2" stroke="#e53e3e" />
                        <line x1="3" y1="5" x2="11" y2="5" stroke="#e53e3e" />
                        <line x1="3" y1="8" x2="11" y2="8" stroke="#e53e3e" />
                        <line x1="3" y1="11" x2="8" y2="11" stroke="#e53e3e" />
                      </svg>
                      {file.name}
                      <span style={{ marginLeft: "auto", fontSize: 12, color: "#e53e3e" }}>{file.size}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Divider above signature */}
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", margin: "2rem 0 1.5rem" }} />

            {/* Signature */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 160, borderTop: "1px solid #1e3a5f", paddingTop: 6, fontSize: 12, color: "#1e3a5f", fontWeight: 500 }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div style={{ marginTop: "1.5rem", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>
              Issued via NEA Circular Management System
            </div>

          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: "1rem" }}>
          <button type="button" className="nc-secondary-btn" onClick={onBack}>
            ← Back to Edit
          </button>
          <button type="button" className="nc-secondary-btn" onClick={() => window.print()}>
            🖨 Print
          </button>
          <button type="button" className="nc-primary-btn" onClick={onSend}>
            ➤ Confirm & Send
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

const tdLabel = {
  color: "var(--color-text-secondary)",
  padding: "4px 0",
  width: 120,
  verticalAlign: "top",
};

const tdColon = {
  padding: "4px 10px",
  color: "var(--color-text-secondary)",
  verticalAlign: "top",
};

const tdValue = {
  color: "var(--color-text-primary)",
  padding: "4px 0",
  verticalAlign: "top",
};

export default CircularPreviewPage;