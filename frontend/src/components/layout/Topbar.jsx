import { useNavigate } from "react-router-dom";

function Topbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("token");

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
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default Topbar;