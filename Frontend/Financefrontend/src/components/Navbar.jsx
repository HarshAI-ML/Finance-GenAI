import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/authService";
import { isAuthenticated } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();
  const niftySignals = [
    { symbol: "NIFTY 50", price: "22,480.75", change: 0.62 },
    { symbol: "RELIANCE", price: "2,945.20", change: 1.18 },
    { symbol: "TCS", price: "4,063.10", change: -0.42 },
    { symbol: "INFY", price: "1,566.35", change: 0.31 },
    { symbol: "HDFCBANK", price: "1,493.60", change: -0.85 },
    { symbol: "ICICIBANK", price: "1,084.25", change: 0.77 },
    { symbol: "SBIN", price: "782.40", change: 1.04 },
    { symbol: "ITC", price: "414.90", change: -0.22 },
    { symbol: "LT", price: "3,425.30", change: 0.58 },
    { symbol: "BHARTIARTL", price: "1,192.45", change: 0.14 },
    { symbol: "AXISBANK", price: "1,108.65", change: -0.36 },
    { symbol: "MARUTI", price: "12,894.70", change: 0.92 },
    { symbol: "SUNPHARMA", price: "1,328.10", change: -0.19 },
    { symbol: "HINDUNILVR", price: "2,372.55", change: 0.25 },
    { symbol: "KOTAKBANK", price: "1,744.30", change: -0.48 },
    { symbol: "BAJFINANCE", price: "6,392.10", change: 1.33 }
  ];

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
              <Link className="navbar-link" to="/features">Other Features</Link>
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

      <div className="navbar-ticker" aria-label="Nifty 50 signals">
        <div className="navbar-ticker-inner">
          <span className="ticker-label">NIFTY 50 SIGNALS</span>
          <div className="navbar-ticker-track">
            <div className="navbar-ticker-row">
              {niftySignals.map((item) => {
                const trend = item.change > 0 ? "up" : item.change < 0 ? "down" : "flat";
                const arrow = item.change > 0 ? "^" : item.change < 0 ? "v" : "-";
                const sign = item.change > 0 ? "+" : "";
                return (
                  <div key={item.symbol} className={`ticker-item ${trend}`}>
                    <span className="ticker-name">{item.symbol}</span>
                    <span className="ticker-price">INR {item.price}</span>
                    <span className={`ticker-change ${trend}`}>
                      {arrow} {sign}{Math.abs(item.change).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="navbar-ticker-row" aria-hidden="true">
              {niftySignals.map((item) => {
                const trend = item.change > 0 ? "up" : item.change < 0 ? "down" : "flat";
                const arrow = item.change > 0 ? "^" : item.change < 0 ? "v" : "-";
                const sign = item.change > 0 ? "+" : "";
                return (
                  <div key={`${item.symbol}-dup`} className={`ticker-item ${trend}`}>
                    <span className="ticker-name">{item.symbol}</span>
                    <span className="ticker-price">INR {item.price}</span>
                    <span className={`ticker-change ${trend}`}>
                      {arrow} {sign}{Math.abs(item.change).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
