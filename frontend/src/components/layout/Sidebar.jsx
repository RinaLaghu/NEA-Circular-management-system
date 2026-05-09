import { Send, Inbox, DraftingCompass, Archive, LayoutList } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "@/assets/logo1.png";

function Sidebar() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");
  let isAdministration = false;
  if (isLoggedIn) {
    try {
      const deptData = JSON.parse(localStorage.getItem("department"));
      isAdministration = deptData?.is_administration === true;
    } catch (e) {}
  }

  const canSendCircular = isLoggedIn && isAdministration;

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

          {!isLoggedIn ? (
            <div className="guest-nav">
    {navItem("/inbox", <Inbox size={18} />, "Inbox")}
    {navItem("/all-circulars", <LayoutList size={18} />, "All Circulars")}
  </div>
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

     
    </aside>
  );
}

export default Sidebar;