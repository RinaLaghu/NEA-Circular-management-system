import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

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