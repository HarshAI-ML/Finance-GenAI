import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/authService";
import { isAuthenticated } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          OnePercent365
        </Link>

        <div className="navbar-actions">
          {loggedIn ? (
            <>
              <Link className="navbar-link" to="/metals">Explore Metals</Link>
              <Link className="navbar-link" to="/dashboard">Dashboard</Link>
              <span className="navbar-user">{user?.username}</span>
              <button className="navbar-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="navbar-link" to="/login">Login</Link>
              <Link className="navbar-link" to="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
