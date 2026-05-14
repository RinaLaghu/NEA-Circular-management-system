import { authFetch } from '@/utils/api';
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Topbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const isLoggedIn = !!localStorage.getItem("token");
  const searchRef = useRef(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    localStorage.removeItem("department");
    navigate("/inbox");
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
            {/* SEARCH */}
            <div className="search-box" style={{ position: "relative" }} ref={searchRef}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search circulars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {/* SEARCH RESULTS DROPDOWN */}
              {searchResults.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  overflow: "hidden"
                }}>
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        navigate("/inbox");
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                    >
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "#111" }}>
                        {c.subject}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                        {c.department} • {c.date}
                      </div>
                    </div>
                  ))}
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