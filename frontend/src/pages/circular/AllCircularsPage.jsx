import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

function AllCircularsPage() {
  const [circulars, setCirculars] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/circular/inbox")
      .then(res => res.json())
      .then(data => setCirculars(data));
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <p className="portal-path">PORTAL / <span>ALL CIRCULARS</span></p>
              <h1>All Circulars</h1>
            </div>
          </div>

          <div className="table-section">
            {circulars.map(c => (
              <div key={c.id} style={{ padding: "16px", border: "1px solid #ccc", borderRadius: "8px", marginBottom: "12px" }}>
                <h3>{c.subject}</h3>
                <p>{c.description}</p>
                <small>{c.date} — {c.department}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AllCircularsPage;