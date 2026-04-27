import { authFetch } from '@/utils/api';
import { Search, Bell, CircleHelp, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Topbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const bellRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recent circulars as notifications
  useEffect(() => {
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => setNotifications(data.slice(0, 5))); // latest 5
  }, []);

  // Global search
  useEffect(() => {
    if (!searchQuery.trim()) return setSearchResults([]);
    authFetch("http://127.0.0.1:8000/circular/inbox")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((c) =>
          c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 5));
      });
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem("department");
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>NEA CIRCULAR MANAGEMENT</h2>
      </div>

      <div className="topbar-right">

        {/* SEARCH */}
        <div className="search-box" style={{ position: "relative" }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((c) => (
                <div
                  key={c.id}
                  className="search-result-item"
                  onClick={() => {
                    navigate("/inbox");
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <strong>{c.subject}</strong>
                  <small>{c.description}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HELP */}
        <button className="icon-btn" onClick={() => window.open("mailto:support@nea.gov.np")}>
          <CircleHelp size={18} />
        </button>

        {/* BELL */}
        <div style={{ position: "relative" }} ref={bellRef}>
          <button className="icon-btn" onClick={() => setShowBell(!showBell)}>
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="notif-dot">{notifications.length}</span>
            )}
          </button>
          {showBell && (
            <div className="dropdown-box">
              <p className="dropdown-title">Recent Activity</p>
              {notifications.length === 0 ? (
                <p className="dropdown-empty">No recent activity</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="dropdown-item">
                    <strong>{n.subject}</strong>
                    <small>{n.date}</small>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <UserCircle2 size={24} />
          </button>
          {showProfile && (
            <div className="dropdown-box">
              <div className="dropdown-item" onClick={() => navigate("/profile")}>
                👤 Profile
              </div>
              <div className="dropdown-item" onClick={() => navigate("/settings")}>
                ⚙️ Settings
              </div>
              <div className="dropdown-item danger" onClick={handleLogout}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}

export default Topbar;