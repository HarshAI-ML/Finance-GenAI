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
          Stock Portfolio
        </Link>

        <div className="navbar-actions">
          {loggedIn ? (
            <>
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
