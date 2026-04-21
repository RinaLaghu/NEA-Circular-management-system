import PageLayout from "@/components/layout/PageLayout";
import CircularListCard from "@/components/ui/CircularListCard";

function ArchivePage() {
  return (
    <PageLayout>
      <div className="simple-page-header archive-centered-header">
        <div>
          <h1>Archive</h1>
        </div>
      </div>

      <p className="center-summary-text">All past circulars</p>

      <div className="archive-search-wrap">
        <input
          type="text"
          className="archive-search-input"
          placeholder="Search archived circulars..."
        />
      </div>

      <div className="cards-stack">
        <CircularListCard
          icon="🗂"
          title="New Year Operational Circular 2025"
          subtitle="From: Admin Office"
          tag="Routine"
          tagType="routine"
          date="Jan 01"
        />

        <CircularListCard
          icon="🗂"
          title="Emergency Power Shutdown Protocol"
          subtitle="From: Operations"
          tag="Urgent"
          tagType="urgent"
          date="Dec 14"
        />

        <CircularListCard
          icon="🗂"
          title="Board Meeting Minutes Distribution"
          subtitle="From: Secretariat"
          tag="Confidential"
          tagType="confidential"
          date="Nov 22"
        />

        <CircularListCard
          icon="🗂"
          title="Revised Leave Encashment Policy"
          subtitle="From: HR Department"
          tag="Routine"
          tagType="routine"
          date="Nov 10"
        />
      </div>

      <div className="bottom-status-bar">
        <span className="status-dot"></span>
        <span>Viewing: Archive</span>
        <button className="primary-page-btn bottom-btn" onClick={() => navigate("/new-circular")}>
          + New Circular
        </button>
      </div>
    </PageLayout>
  );
}

export default ArchivePage;