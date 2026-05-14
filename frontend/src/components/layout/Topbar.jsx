import { authFetch } from '@/utils/api';
import { Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Topbar({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const isLoggedIn = !!localStorage.getItem("token");
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => setNotifications(data.slice(0, 5)));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("department");
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>NEA CIRCULAR MANAGEMENT</h2>
      </div>

      <div className="topbar-right">
        {!isLoggedIn ? (
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
        ) : (
          <>
            {/* SEARCH — filters the table directly, no dropdown */}
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search circulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* BELL */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }} ref={bellRef}>
              <button className="icon-btn" onClick={() => setShowBell(!showBell)}>
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="bell-badge">{notifications.length}</span>
                )}
              </button>

              {showBell && (
                <div className="bell-dropdown">
                  <p className="bell-title">Recent Circulars</p>
                  {notifications.length === 0 ? (
                    <p className="bell-empty">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="bell-item"
                        onClick={() => setShowBell(false)}
                      >
                        {n.subject}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* LOGOUT */}
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Topbar;