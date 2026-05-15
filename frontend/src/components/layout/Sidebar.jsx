import { Send, Inbox, DraftingCompass, Archive, LayoutList, LogOut } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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

  const canSendCircular = isLoggedIn;
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const navItem = (to, icon, label, badge) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "nav-item active" : "nav-item"
      }
    >
      {icon}
      <span>{label}</span>
      {badge != null && <span className="badge">{badge}</span>}
    </NavLink>
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      setPendingCount(0);
      return;
    }

    const fetchStats = async () => {
      try {
        // ✅ FIX: use token directly from localStorage
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const res = await fetch("http://127.0.0.1:8000/circular/stats", { headers });
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.unread || 0);
        setPendingCount(data.pending || 0);
      } catch (err) {
        console.error("Failed to load sidebar stats:", err);
      }
    };

    fetchStats();
  }, [isLoggedIn, location.pathname]);

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
              {navItem("/all-circulars", <LayoutList size={18} />, "All Circulars")}
            </div>
          ) : (
            <>
              {navItem("/inbox", <Inbox size={18} />, "Inbox", unreadCount > 0 ? unreadCount : null)}
              {isAdministration && navItem("/admin-review", <LayoutList size={18} />, "Admin Review", pendingCount > 0 ? pendingCount : null)}
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
