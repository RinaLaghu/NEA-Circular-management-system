import React, { useState } from "react";
import "@/styles/login.css";
//import logo from "../logo.png";



function Login() {
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

  const handleDirectorateChange = (e) => {
    const value = e.target.value;
    setDirectorate(value);
    setDepartments(departmentData[value] || []);
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
        </select>

        <label>DEPARTMENT</label>
        <select>
          <option>Select Department</option>
          {departments.map((dep, index) => (
            <option key={index}>{dep}</option>
          ))}
        </select>

        <div className="password-label">
          <label>ACCESS TOKEN / PASSWORD</label>
          <span className="forgot">FORGOT?</span>
        </div>

        <div className="password-box">
          <input type="password" placeholder="Enter password" />
          <span className="eye">👁</span>
        </div>

        <button>Validate and Enter 🔒</button>
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