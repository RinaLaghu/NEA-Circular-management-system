import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

function PageLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Topbar />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}

export default PageLayout;