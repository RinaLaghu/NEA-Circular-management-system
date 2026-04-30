import { Send, Inbox, DraftingCompass, Archive, Star, LayoutList, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "@/assets/logo1.png";

function Sidebar() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const canSendCircular = isLoggedIn;

  // ✅ ADD THIS (THIS WAS MISSING)
  const navItem = (to, icon, label, badge) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "nav-item active" : "nav-item"
      }
    >
      {icon}
      <span>{label}</span>
      {badge && <span className="badge">{badge}</span>}
    </NavLink>
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("department");
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

        {isLoggedIn && canSendCircular && (
          <button
            className="send-btn"
            onClick={() => navigate("/new-circular")}
          >
            <span className="plus">+</span> Send New Circular
          </button>
        )}

        <nav className="sidebar-nav">

          {/* NOT LOGGED IN */}
          {!isLoggedIn ? (
            <>
              {navItem("/inbox", <Inbox size={18} />, "Inbox")}
              {navItem("/all-circulars", <LayoutList size={18} />, "All Circulars")}
            </>
          ) : (
            <>
              {navItem("/inbox", <Inbox size={18} />, "Inbox", "12")}
              {navItem("/sent", <Send size={18} />, "Sent")}
              {navItem("/drafts", <DraftingCompass size={18} />, "Drafts")}
              {navItem("/archive", <Archive size={18} />, "Archive")}
            </>
          )}

        </nav>
      </div>

      <div style={{ marginTop: "auto" }}>
        {isLoggedIn ? (
          <button className="nav-item" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        ) : (
          <button className="nav-item" onClick={() => navigate("/login")}>
            <LogOut size={18} />
            <span>Login</span>
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;