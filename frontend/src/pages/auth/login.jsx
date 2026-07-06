import React, { useEffect, useRef, useState } from "react";
import "@/styles/login.css";
import { useNavigate } from "react-router-dom";
import lockIcon from "../../assets/lock.png";
import { API_BASE_URL } from "@/utils/config";
//import logo from "../../assets/logo.png";

function Login() {
  const navigate = useNavigate();

  const departmentData = {
    MD: ["Managing Director"],
    A: ["Corporate Planning and Monitoring", "Power System Management", "Information Technology","Administration Section"],
    B: ["Energy Efficiency and Loss Reduction", "Power Trade", "Company Management","Business Promotion","Administration Section"],
    C: ["Human Resources", "General Services", "Legal","Recruitment Department","Administration Section"],
    D: ["Corporation Finance", "Accounts", "Regulatory Compliance","Retirement Fund Management Division","Administration Section"],
    E: ["Large Generation Operation and Maintenance", "Medium Generation Operation and Maintenance","Generation Development and Support","Administration Division","Finance Division"],
    F: ["High Voltage Grid Development","Medium Voltage Grid Development","Power System Operation","Grid Operation","Civil Division","Transmission Line and Substation Design Division","Administration Division","Finance Division"],
    G: ["Planning and Technical Service","Smart Metering and Automation","Community and Rural Electrification","Administration Section", "Koshi Province", "Madhesh Province", "Bagmati Province", "Gandaki Province", "Lumbini Province", "Karnali Province", "Sudurpaschim Province"],
    H: ["Project Development","Environment and Social Studies","Geological Investigation","Administration Section"],
    I: ["Transmission Line and Substation","Distribution Line and Substation","Social Safeguard and Environment Management","Administration Section"]
  };

  const [directorate, setDirectorate] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFooterSection, setActiveFooterSection] = useState("");
  const footerDetailsRef = useRef(null);
  const footerLinksRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!footerDetailsRef.current || !footerLinksRef.current) return;
      if (
        footerDetailsRef.current.contains(event.target) ||
        footerLinksRef.current.contains(event.target)
      ) {
        return;
      }
      setActiveFooterSection("");
    };

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

 const footerDetails = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "Ensure confidentiality of login details, circulars, and workflow processes.",
    points: [
      {
        label: "Data Collected",
        text: "Department login details, session activity, circular records, attachments, and workflow actions are collected."
      },
      {
        label: "Purpose",
        text: "Information is used for authentication, circular routing, approval tracking, and audit records."
      },
      {
        label: "Secure Storage",
        text: "System data is stored securely in the database with controlled access permissions."
      },
      {
        label: "Access Control",
        text: "Only authorized departments, administration users, and permitted roles can access relevant records."
      },
      {
        label: "Confidentiality",
        text: "Official circulars and attachments must not be shared outside authorized NEA channels."
      },
      {
        label: "Activity Logs",
        text: "Login activity, draft updates, approvals, archiving, and deletion actions may be logged for security."
      },
      {
        label: "Protection",
        text: "Password hashing, session tokens, and role-based permissions are used to protect system data."
      }
    ]
  },

  support: {
    title: "Technical Support",
    subtitle: "Help for login, access, circular, upload, and system issues.",
    points: [
      {
        label: "Report Issues",
        text: "Contact the system administrator or internal IT support team for technical assistance."
      },
      {
        label: "Common Problems",
        text: "Support covers login errors, session token issues, upload failures, missing circulars, and access restrictions."
      },
      {
        label: "Support Hours",
        text: "Assistance is available during official NEA working hours, Monday to Friday."
      },
      {
        label: "Response Time",
        text: "Most standard issues are reviewed and resolved within 24 to 48 business hours."
      },
      {
        label: "Before Reporting",
        text: "Refresh the page, check your internet connection, confirm the correct department login, and retry the action."
      },
      {
        label: "Urgent Issues",
        text: "Workflow failures, permission errors, or missing circulars should be reported immediately."
      }
    ]
  },

  terms: {
    title: "Terms & Conditions",
    subtitle: "Rules for authorized and responsible use of the NEA circular system.",
    points: [
      {
        label: "System Purpose",
        text: "This platform is used to create, route, approve, send, archive, and manage official NEA circulars."
      },
      {
        label: "Authorized Access",
        text: "Only approved NEA departments and authorized personnel may access the system."
      },
      {
        label: "Account Responsibility",
        text: "Users must keep login credentials and session tokens confidential and must not share access."
      },
      {
        label: "Proper Use",
        text: "Circular data must not be misused, shared externally, edited without permission, or deleted improperly."
      },
      {
        label: "Permissions",
        text: "Access is controlled based on department, directorate, and administration-level roles."
      },
      {
        label: "Ownership",
        text: "All circulars, attachments, and workflow records remain official property of NEA."
      },
      {
        label: "Monitoring",
        text: "System activity may be reviewed to maintain accountability, security, and proper usage."
      },
      {
        label: "Access Restriction",
        text: "Access may be restricted or revoked if misuse, policy violation, or security risk is detected."
      }
    ]
  }
};

  const handleFooterClick = (section) => {
    setActiveFooterSection((current) => (current === section ? "" : section));
  };

  const handleDirectorateChange = (e) => {
    const value = e.target.value;
    setDirectorate(value);
    setDepartments(departmentData[value] || []);
    setSelectedDepartment("");
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    setSelectedDepartment(value);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/department/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          directorate,
          name: selectedDepartment,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("department", JSON.stringify(data));
      localStorage.setItem("token", data.access_token);
      navigate("/inbox");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      <div className="container">
        <div className="logo">
          <img src="/logo.png" alt="NEA Logo" className="logo-img" />
        </div>

        <h1>NEA Circular Management</h1>
        <p className="subtitle">AUTHORIZED PERSONNEL ACCESS ONLY</p>

        <div className="card">
          <label>DIRECTORATE</label>
          <select value={directorate} onChange={handleDirectorateChange}>
            <option value="" hidden>Select Directorate</option>
            <option value="MD">Managing Director</option>
            <option value="A">Planning, Monitoring and IT</option>
            <option value="B">Business Development</option>
            <option value="C">Administration</option>
            <option value="D">Finance</option>
            <option value="E">Generation</option>
            <option value="F">Transmission</option>
            <option value="G">Distribution & Consumer Services</option>
            <option value="H">Engineering Service</option>
            <option value="I">Project Management</option>
          </select>

          <label>DEPARTMENT</label>
          <select
            value={selectedDepartment}
            onChange={handleDepartmentChange}
          >
            <option value="" hidden>Select Department</option>
            {departments.map((dep, index) => (
              <option key={index} value={dep}>{dep}</option>
            ))}
          </select>

          <div className="password-label">
            <label>ACCESS TOKEN / PASSWORD</label>
            <span className="forgot">FORGOT?</span>
          </div>

          <div className="password-box">
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
          )}
<button onClick={handleLogin} disabled={loading}>
  {loading ? "Validating..." : (
    <>
      Validate and Enter <img src={lockIcon} className="lock-icon" />
    </>
  )}
</button>
        </div>

        <div className="warning">
          <p>
            By accessing this system, you agree to comply with the National IT Security Policy.
            All sessions are logged and monitored by the NEA Digital Governance Cell.
          </p>
        </div>
      </div>

      <footer>
        <div className="left" style={{ fontSize: "13px", fontWeight: "bold" }}>
          <a href="https://www.nea.org.np" target="_blank" rel="noopener noreferrer">
            Website: www.nea.org.np
          </a>
        </div>

        <div className="center" ref={footerLinksRef}>
          <a href="#footer-details" className="footer-link" onClick={(e) => { e.preventDefault(); handleFooterClick("privacy"); }}>
            PRIVACY POLICY
          </a>
          <a href="#footer-details" className="footer-link" onClick={(e) => { e.preventDefault(); handleFooterClick("support"); }}>
            TECHNICAL SUPPORT
          </a>
          <a href="#footer-details" className="footer-link" onClick={(e) => { e.preventDefault(); handleFooterClick("terms"); }}>
            TERMS OF SERVICE
          </a>
        </div>

        <div className="right">
          © 2026 NEA Circular Ledger v1.0
        </div>
      </footer>

      {activeFooterSection && (
        <div id="footer-details" className="footer-details" ref={footerDetailsRef}>
          <div className="footer-details-header">
            <div>
              <p className="footer-details-kicker">NEA Circular Ledger</p>
              <h3>{footerDetails[activeFooterSection].title}</h3>
              <span>{footerDetails[activeFooterSection].subtitle}</span>
            </div>

            <button
              type="button"
              className="footer-details-close"
              onClick={() => setActiveFooterSection("")}
            >
              ×
            </button>
          </div>

          <div className="footer-details-grid">
            {footerDetails[activeFooterSection].points.map((point, idx) => (
              <div className="footer-detail-item" key={idx}>
                <div className="footer-detail-dot">{idx + 1}</div>
                <div>
                  <strong>{point.label}</strong>
                  <p>{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;