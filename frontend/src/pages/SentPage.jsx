import PageLayout from "../components/PageLayout";
import CircularListCard from "../components/CircularListCard";

function SentPage() {
  return (
    <PageLayout>
      <div className="simple-page-header sent-centered-header">
        <div>
          <h1>Sent</h1>
        </div>
      </div>

      <p className="center-summary-text">3 circulars sent</p>

      <div className="cards-stack">
        <CircularListCard
          icon="📤"
          title="Policy_Framework_2024 Distribution"
          subtitle="To: Finance Directorate"
          tag="Routine"
          tagType="routine"
          date="Apr 04"
        />

        <CircularListCard
          icon="📤"
          title="Recruitment Drive Announcement"
          subtitle="To: HR Department"
          tag="Urgent"
          tagType="urgent"
          date="Mar 30"
        />

        <CircularListCard
          icon="📤"
          title="Annual Audit Circular"
          subtitle="To: All Departments"
          tag="Confidential"
          tagType="confidential"
          date="Mar 28"
        />
      </div>

      <div className="bottom-status-bar">
        <span className="status-dot"></span>
        <span>Viewing: Sent</span>
        <button className="primary-page-btn bottom-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>
    </PageLayout>
  );
}

export default SentPage;