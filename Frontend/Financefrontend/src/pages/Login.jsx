import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(formData);
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">
            Log in to continue tracking your portfolios and stock opportunities.
          </p>
        </div>

        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        <button className="auth-btn auth-btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="auth-copy">
          Your portfolios are private to your account and sync with latest market data on sign in.
        </p>

        <div className="auth-divider" />

        <p className="auth-alt-text">New here?</p>
        <Link to="/signup" className="auth-btn auth-btn-secondary">
          Create account (Sign up)
        </Link>
      </form>
    </div>
  );
}

export default Login;
