import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPortfolioById } from "../services/portfolioService";
import { createStock } from "../services/stockService";
import StockTable from "../components/StockTable";
import { deleteStock } from "../services/stockService";
import PortfolioTopDiscountChart from "../components/PortfolioTopDiscountChart";
import ProfileSummaryCards from "../components/ProfileSummaryCards";

function PortfolioDetail() {
  const { id } = useParams();

  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ticker: ""
  });

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      const res = await getPortfolioById(id);
      setPortfolio(res.data);
      setStocks(res.data.stocks || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveStock = async (stockId) => {
  try {
    await deleteStock(stockId); // API call
    setStocks((prev) => prev.filter((s) => s.id !== stockId));
  } catch (error) {
    console.error(error);
  }
};

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.ticker) return;

    try {
      setLoading(true);

      const res = await createStock({
        portfolio: id,
        name: formData.name,
        ticker: formData.ticker
      });

      setStocks([...stocks, res.data]);

      setFormData({
        name: "",
        ticker: ""
      });

    } catch (error) {
      alert(error.response?.data?.error || "Error adding stock");
    } finally {
      setLoading(false);
    }
  };

  if (!portfolio) {
    return <div className="container"><h3>Loading...</h3></div>;
  }

  return (
    <div className="container">
      <h2>{portfolio.name}</h2>
      <p><strong>Sector:</strong> {portfolio.sector}</p>

      <h3 style={{ marginTop: "30px" }}>Add Stock</h3>

      <form onSubmit={handleAddStock} className="portfolio-form">

        <input
          type="text"
          placeholder="Stock Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
        />

        <input
          type="text"
          placeholder="Ticker (e.g. TATAMOTORS.NS)"
          value={formData.ticker}
          onChange={(e) =>
            setFormData({ ...formData, ticker: e.target.value })
          }
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Fetching..." : "Fetch & Add"}
        </button>

      </form>

      <ProfileSummaryCards portfolioName={portfolio.name} stocks={stocks} />

      <h3 style={{ marginTop: "40px" }}>Stocks</h3>
      {/* <StockTable stocks={stocks} /> */}
      <StockTable stocks={stocks} onRemove={handleRemoveStock} />
      <PortfolioTopDiscountChart portfolioId={id} />
    </div>
  );
}

export default PortfolioDetail;
