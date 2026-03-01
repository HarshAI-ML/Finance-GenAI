import { useNavigate } from "react-router-dom";

function PortfolioCard({ portfolio }) {
  const navigate = useNavigate();

  return (
    <div
      className="portfolio-card"
      onClick={() => navigate(`/portfolio/${portfolio.id}`)}
    >
      <h3>{portfolio.name}</h3>
      <p>Sector: {portfolio.sector}</p>
      <span>Click to explore stocks →</span>
    </div>
  );
}

export default PortfolioCard;