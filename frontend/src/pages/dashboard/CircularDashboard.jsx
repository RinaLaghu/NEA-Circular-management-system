import { authFetch } from '@/utils/api';
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";
import React, { useState, useEffect } from "react";

function CircularDashboard() {
  const [circulars, setCirculars] = useState([]);

  useEffect(() => {
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => setCirculars(data));
  }, []);

  const handleArchive = (id) => {
    setCirculars(prev => prev.filter(c => c.id !== id));
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
            <StatCard title="Total Received" value="1,284" footer="+12% this month" accent="blue" />
            <StatCard title="Unread Actions" value="12" footer="2 immediate review req." accent="red" />
            <StatCard title="Pending Sync" value="08" footer="Last synced 2 minutes ago" accent="gray" />
          </div>
          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>
              <div className="legend">
                <span className="legend-item"><span className="dot unread"></span> Unread</span>
                <span className="legend-item"><span className="dot read"></span> Read</span>
              </div>
            </div>
            <CircularTable circulars={circulars} onArchive={handleArchive}  />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;