import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../services/authService";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signup(formData);
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-header">
          <h2>Create your account</h2>
          <p className="auth-subtitle">
            Start building sector-based portfolios and track your stock picks with live insights.
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
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="auth-copy">
          We will keep your portfolios private and load your latest stock metrics each time you sign in.
        </p>

        <div className="auth-divider" />

        <p className="auth-alt-text">Already have an account?</p>
        <Link to="/login" className="auth-btn auth-btn-secondary">
          Go to Login
        </Link>
      </form>
    </div>
  );
}

export default Signup;
