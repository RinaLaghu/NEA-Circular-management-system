import {
  Building2,
  Send,
  Inbox,
  FileText,
  DraftingCompass,
  Archive,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <div className="logo-box">
            <Building2 size={20} />
          </div>
          <div>
            <h2>NEA</h2>
            <p>Circular Ledger</p>
          </div>
        </div>

        <button className="send-btn">
          <span className="plus">+</span> Send New Circular
        </button>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <Inbox size={18} />
            <span>Inbox</span>
            <span className="badge">12</span>
          </a>

          <a href="#" className="nav-item">
            <Send size={18} />
            <span>Sent</span>
          </a>

          <a href="#" className="nav-item">
            <DraftingCompass size={18} />
            <span>Drafts</span>
          </a>

          <a href="#" className="nav-item">
            <Archive size={18} />
            <span>Archive</span>
          </a>
        </nav>
      </div>

      <div className="sidebar-footer">
        <a href="#" className="nav-item">
          <Settings size={18} />
          <span>Settings</span>
        </a>

        <a href="#" className="nav-item">
          <LogOut size={18} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}

export default Sidebar;