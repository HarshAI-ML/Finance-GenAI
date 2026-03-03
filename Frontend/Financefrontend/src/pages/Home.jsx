import { Link } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

function Home() {
  const loggedIn = isAuthenticated();

  return (
    <main className="landing">
      <section className="landing-hero">
        <p className="landing-chip">Disciplined Wealth Building</p>
        <h1>
          Welcome to <span>OnePercent365</span>
        </h1>
        <p className="landing-subtitle">
          Build smarter portfolios, discover top discount opportunities, and
          track your conviction with a clean investing workspace.
        </p>

        <div className="landing-cta">
          {loggedIn ? (
            <Link to="/dashboard" className="landing-btn landing-btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/signup" className="landing-btn landing-btn-primary">
                Start Free
              </Link>
              <Link to="/login" className="landing-btn landing-btn-secondary">
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="landing-stats">
        <article className="landing-stat-card">
          <p>Portfolio Focus</p>
          <h3>Multi-sector</h3>
          <span>Keep all your sectors in one place.</span>
        </article>
        <article className="landing-stat-card">
          <p>Top Discount Radar</p>
          <h3>Live Ranking</h3>
          <span>Spot strongest undervaluation faster.</span>
        </article>
        <article className="landing-stat-card">
          <p>Risk Lens</p>
          <h3>Balanced</h3>
          <span>Track quality with valuation context.</span>
        </article>
      </section>
    </main>
  );
}

export default Home;
