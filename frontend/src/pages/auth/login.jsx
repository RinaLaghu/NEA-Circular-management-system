import React, { useState } from "react";
import "@/styles/login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const departmentData = {
    X: ["NONE"],
    A: ["Corporate Planning and Monitoring", "Power System Management", "Information Technology","Administration Section"],
    B: ["Energy Efficiency and Loss Reduction", "Power Trade", "Company Management","Business Promotion","Administration Section"],
    C: ["Human Resources", "General Services", "Legal","Recruitment Department"],
    D: ["Corporation Finance", "Accounts", "Regulatory Compliance","Retirement Fund Management Division"],
    E: ["Large Generation Operation and Maintenance", "Medium Generation Operation and Maintenance","Generation Development and Support","Administration Division","Finance Division"],
    F: ["High Voltage Grid Development","Medium Voltage Grid Development","Power System Operation","Grid Operation","Civil Division","Transmission Line and Substation Design Division","Administration Division","Finance Division"],
    G: ["Planning and Technical Service","Smart Metering and Automation","Community and Rural Electrification"],
    H: ["Project Development","Environment and Social Studies","Geoeological Investigation"],
    I: ["Transmission Line and Substation","Distribution Line and Substation","Social Safeguard and Environment Management"]
  };

  const [directorate, setDirectorate] = useState("");
  const [departments, setDepartments] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDirectorateChange = (e) => {
    const value = e.target.value;
    setDirectorate(value);
    setDepartments(departmentData[value] || []);
    setSelectedDepartment(""); // reset department when directorate changes
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/department/login", {
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

      // store session
      localStorage.setItem("department", JSON.stringify(data));

      // redirect
      navigate("/inbox");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo">
        <img src="/logo.png" alt="NEA Logo" className="logo-img" />
      </div>

      <h1>NEA Circular Management</h1>
      <p className="subtitle">AUTHORIZED PERSONNEL ACCESS ONLY</p>

      <div className="card">
        <label>DIRECTORATE</label>
        <select value={directorate} onChange={handleDirectorateChange}>
          <option value="" disabled>Select Directorate</option>
          <option value="X">BOARD OF DIRECTORS</option>
          <option value="A">Planning, Monitoring and IT</option>
          <option value="B">Business Development</option>
          <option value="C">Administration</option>
          <option value="D">Finance</option>
          <option value="E">Generation</option>
          <option value="F">Transmission</option>
          <option value="G">Distribution & consumer services</option>
          <option value="H">Engineering Service</option>
          <option value="I">Project management</option>
        </select>

        <label>DEPARTMENT</label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dep, index) => (
            <option key={index} value={dep}>
              {dep}
            </option>
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
          <span className="eye">👁</span>
        </div>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Validating..." : "Validate and Enter 🔒"}
        </button>
      </div>

      <div className="warning">
        <p>
          By accessing this system, you agree to comply with the National IT Security Policy.
          All sessions are logged and monitored by the NEA Digital Governance Cell.
        </p>
      </div>

      <footer>
        <div className="left">
          <strong>Government of Nepal</strong><br/>
          Ministry of Energy, Water Resources and Irrigation
        </div>

        <div className="center">
          <a href="#" className="footer-link">PRIVACY POLICY</a>
          <a href="#" className="footer-link">TECHNICAL SUPPORT</a>
          <a href="#" className="footer-link">TERMS OF SERVICE</a>
        </div>

        <div className="right">
          © 2024 NEA Circular Ledger v1.0
        </div>
      </footer>
    </div>
  );
}

export default Login;