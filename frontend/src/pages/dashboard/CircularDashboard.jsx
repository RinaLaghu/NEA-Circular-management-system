import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCard from "@/components/ui/StatCard";
import CircularTable from "@/components/circular/CircularTable";

const circulars = [
  {
    id: "NEA/ADM/2024/042",
    subject: "Emergency Protocol Update: Coastal Management 2024",
    description: "Reference to Chapter 4, Section B.",
    priority: "Urgent",
    department: "Directorate of Operations",
    date: "Oct 24, 2023",
    time: "09:45 AM",
    status: "unread",
  },
  {
    id: "NEA/FIN/2024/118",
    subject: "Revised Budgetary Allocations for Q4 Fiscal Cycle",
    description: "Immediate attention required for department heads.",
    priority: "Urgent",
    department: "Finance & Procurement",
    date: "Oct 23, 2023",
    time: "14:12 PM",
    status: "unread",
  },
  {
    id: "NEA/SEC/2024/005",
    subject: "Annual Security Clearance Procedures for External Staff",
    description: "Formalizing third-party access control.",
    priority: "Routine",
    department: "Security Authority",
    date: "Oct 21, 2023",
    time: "10:05 AM",
    status: "read",
  },
  {
    id: "NEA/ICT/2023/882",
    subject: "Digital Transformation Initiative: Cloud Implementation Phase II",
    description: "Infrastructure migration schedule.",
    priority: "Routine",
    department: "ICT & Innovation",
    date: "Oct 20, 2023",
    time: "16:30 PM",
    status: "read",
  },
  {
    id: "NEA/LEG/2023/156",
    subject: "Amendments to Circular Drafting Standard ISO-9001",
    description: "Updated templates for official notices.",
    priority: "Routine",
    department: "Legal Affairs",
    date: "Oct 19, 2023",
    time: "09:00 AM",
    status: "read",
  },
];

function CircularDashboard() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />

        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <p className="portal-path">
                PORTAL / <span>INBOX</span>
              </p>
              <h1>Administrative Circular</h1>
              <p className="page-subtitle">Priority Ledger</p>
            </div>

            <div className="header-actions">
              <button className="action-btn secondary">Filter</button>
              <button className="action-btn secondary">Export</button>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              title="Total Received"
              value="1,284"
              footer="+12% this month"
              accent="blue"
            />
            <StatCard
              title="Unread Actions"
              value="12"
              footer="2 immediate review req."
              accent="red"
            />
            <StatCard
              title="Pending Sync"
              value="08"
              footer="Last synced 2 minutes ago"
              accent="gray"
            />
          </div>

          <div className="table-section">
            <div className="table-header">
              <h3>Inbox / Latest Circulars</h3>
              <div className="legend">
                <span className="legend-item">
                  <span className="dot unread"></span> Unread
                </span>
                <span className="legend-item">
                  <span className="dot read"></span> Read
                </span>
              </div>
            </div>

            <CircularTable circulars={circulars} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CircularDashboard;