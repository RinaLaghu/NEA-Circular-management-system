import { authFetch } from '@/utils/api';
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";

function CircularDashboard() {
  const [circulars, setCirculars] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, archived: 0 });

  const refreshStats = () => {
    authFetch("http://127.0.0.1:8000/circular/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((e) => console.error("Stats refresh failed:", e));
  };

  useEffect(() => {
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => setCirculars(data));

    refreshStats();
  }, []);

  const handleArchive = (id) => {
    setCirculars(prev => prev.filter(c => c.id !== id));
    refreshStats(); // keep stats updated
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <p className="portal-path">PORTAL / <span>INBOX</span></p>
              <h1>Administrative Circular</h1>
              <p className="page-subtitle">Priority Ledger</p>
            </div>
            <div className="header-actions">
              <button className="action-btn secondary">Filter</button>
              <button className="action-btn secondary">Export</button>
            </div>
          </div>
          <div className="stats-grid">
            <StatCard title="Total Received" value={stats.total} accent="blue" />
            <StatCard title="Unread Actions" value={stats.unread} accent="red" />
            <StatCard title="Archived" value={stats.archived} accent="gray" />
          </div>
          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>
              <div className="legend">
                <span className="legend-item"><span className="dot unread"></span> Unread</span>
                <span className="legend-item"><span className="dot read"></span> Read</span>
              </div>
            </div>
            <CircularTable circulars={circulars} onArchive={handleArchive} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;
