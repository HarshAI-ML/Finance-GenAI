import { useNavigate } from "react-router-dom";

function PortfolioList({ portfolios }) {
  const navigate = useNavigate();

  return (
    <div className="portfolio-grid">
      {portfolios.map((p) => (
        <div
          key={p.id}
          className="portfolio-card"
          onClick={() => navigate(`/portfolio/${p.id}`)}
        >
          <h3>{p.name}</h3>
          <p>Click to view stocks</p>
        </div>
      ))}
    </div>
  );
}

export default PortfolioList;