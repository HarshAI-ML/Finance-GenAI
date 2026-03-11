import { Link } from "react-router-dom";

function OtherFeatures() {
  return (
    <main className="features-page">
      <section className="features-shell">
        <div className="features-header">
          <p className="features-chip">Other Features</p>
          <h1>Tools You Can Explore</h1>
          <p>Use additional analysis modules built into your workspace.</p>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <h2>BTC Analyser</h2>
            <p>Analyze Bitcoin candles across multiple timeframes and monitor trend shifts.</p>
            <Link className="feature-card-link" to="/crypto">
              Open BTC Analyser
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}

export default OtherFeatures;
