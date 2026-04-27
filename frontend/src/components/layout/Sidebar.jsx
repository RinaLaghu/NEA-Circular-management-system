import {
  Send,
  Inbox,
  DraftingCompass,
  Archive,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo1.png";

function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
  localStorage.removeItem("department"); // remove auth data
  navigate("/login");
};

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
            <img src={logo} alt="NEA Logo" className="logo-img" />
          <div>
            <h2>NEA</h2>
            <p>Circular Ledger</p>
          </div>
        </div>

        <button
          className="send-btn"
          onClick={() => navigate("/new-circular")}
        >
          <span className="plus">+</span> Send New Circular
        </button>

        <nav className="sidebar-nav">
          <NavLink
            to="/inbox"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Inbox size={18} />
            <span>Inbox</span>
            <span className="badge">12</span>
          </NavLink>

          <NavLink
            to="/sent"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Send size={18} />
            <span>Sent</span>
          </NavLink>

          <NavLink
            to="/drafts"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <DraftingCompass size={18} />
            <span>Drafts</span>
          </NavLink>

          <NavLink
            to="/archive"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Archive size={18} />
            <span>Archive</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer">
  <div className="nav-item">
    <Settings size={18} />
    <span>Settings</span>
  </div>

  <div className="nav-item" onClick={handleLogout} style={{ cursor: "pointer" }}>
  <LogOut size={18} />
  <span>Logout</span>
</div>
</div>
    </aside>
  );
}

export default Sidebar;