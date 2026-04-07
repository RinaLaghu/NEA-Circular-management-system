import PageLayout from "../components/PageLayout";
import CircularListCard from "../components/CircularListCard";
import { useNavigate } from "react-router-dom";

function DraftsPage() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <div className="simple-page-header">
        <div>
          <h1>Drafts</h1>
          <p className="simple-subtitle">2 saved drafts</p>
        </div>

        <button className="primary-page-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>

      <div className="cards-stack">
        <CircularListCard
          icon="📝"
          title="Untitled Circular — Apr 06"
          subtitle="Last saved: 11:24 AM today"
          tag="Urgent"
          tagType="urgent"
          actionLabel="Edit"
        />

        <CircularListCard
          icon="📝"
          title="Transmission Grid Maintenance Notice"
          subtitle="Last saved: Yesterday, 3:10 PM"
          tag="Routine"
          tagType="routine"
          actionLabel="Edit"
        />
      </div>

      <div className="bottom-status-bar">
        <span className="status-dot"></span>
        <span>Viewing: Drafts</span>
        <button className="primary-page-btn bottom-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>
    </PageLayout>
  );
}

export default DraftsPage;