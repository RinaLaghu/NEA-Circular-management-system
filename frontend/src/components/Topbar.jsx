import { Search, Bell, CircleHelp, UserCircle2 } from "lucide-react";

function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>NEA CIRCULAR MANAGEMENT</h2>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Search size={16} />
          <input type="text" placeholder="Search archives..." />
        </div>

        <button className="icon-btn">
          <CircleHelp size={18} />
        </button>

        <button className="icon-btn">
          <Bell size={18} />
        </button>

        <button className="profile-btn">
          <UserCircle2 size={24} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;