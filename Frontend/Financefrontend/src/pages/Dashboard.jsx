import { useEffect, useState } from "react";
import { getPortfolios, createPortfolio } from "../services/portfolioService";
import PortfolioCard from "./PortfolioCard";

function Dashboard() {
  const [portfolios, setPortfolios] = useState([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      const res = await getPortfolios();
      setPortfolios(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    if (!name || !sector) return;

    try {
      const res = await createPortfolio({ name, sector });
      setPortfolios([...portfolios, res.data]);
      setName("");
      setSector("");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="container">
      <h2 className="section-title">Available Portfolios</h2>

      <form onSubmit={handleCreatePortfolio} className="portfolio-form">
        <input
          type="text"
          placeholder="Portfolio Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Sector"
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          required
        />
        <button type="submit">Add Portfolio</button>
      </form>

      <div className="portfolio-grid">
        {portfolios.length > 0 ? (
          portfolios.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} />
          ))
        ) : (
          <p className="empty-text">
            No portfolios yet. Create your first one 🚀
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;