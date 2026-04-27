import { authFetch } from '@/utils/api';
import { Search, Bell, CircleHelp, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Topbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const [notifications, setNotifications] = useState([]);
const isLoggedIn = !!localStorage.getItem("token");
const [showProfile, setShowProfile] = useState(false);
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
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2>NEA CIRCULAR MANAGEMENT</h2>
      </div>

      <div className="topbar-right">

  {!isLoggedIn ? (
    // 🔴 NOT LOGGED IN
    <button className="login-btn" onClick={() => navigate("/login")}>
      Login
    </button>
  ) : (
    // 🟢 LOGGED IN
    <>
      {/* SEARCH */}
      <div className="search-box" style={{ position: "relative" }}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search circulars..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* BELL */}
      <div style={{ position: "relative" }} ref={bellRef}>
        <button className="icon-btn" onClick={() => setShowBell(!showBell)}>
          <Bell size={18} />
        </button>
      </div>

      {/* LOGOUT */}
      
    </>
  )}

</div>
    </header>
  );
}

export default Topbar;