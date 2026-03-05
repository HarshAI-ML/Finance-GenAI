import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deletePortfolio, getPortfolioById } from "../services/portfolioService";
import { createStock, deleteStock, searchStocks } from "../services/stockService";
import StockTable from "../components/StockTable";
import PortfolioTopDiscountChart from "../components/PortfolioTopDiscountChart";
import StockRiskClusterPanel from "../components/StockRiskClusterPanel";
import ProfileSummaryCards from "../components/ProfileSummaryCards";

function PortfolioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ticker: ""
  });
  const chartRefreshToken = stocks.map((stock) => stock.id).join(",");

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  useEffect(() => {
    const query = formData.name.trim();

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchStocks(query);
        setSuggestions(res.data?.results || []);
      } catch (error) {
        console.error(error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.name]);

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
      await deleteStock(stockId);
      setStocks((prev) => prev.filter((s) => s.id !== stockId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePortfolio = async () => {
    const confirmed = window.confirm(
      `Delete portfolio "${portfolio?.name}"? This will remove all stocks in it.`
    );
    if (!confirmed) return;

    try {
      await deletePortfolio(id);
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.error || "Failed to delete portfolio");
      console.error(error);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.ticker) {
      alert("Please select a stock from the suggestions.");
      return;
    }

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
      setSuggestions([]);

    } catch (error) {
      alert(error.response?.data?.error || "Error adding stock");
    } finally {
      setLoading(false);
    }
  };

  const handleStockInputChange = (value) => {
    setFormData({
      name: value,
      ticker: ""
    });
  };

  const handleSuggestionSelect = (suggestion) => {
    setFormData({
      name: suggestion.name,
      ticker: suggestion.ticker
    });
    setSuggestions([]);
    setIsInputFocused(false);
  };

  if (!portfolio) {
    return <div className="container"><h3>Loading...</h3></div>;
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
        <h2>{portfolio.name}</h2>
        <button
          type="button"
          className="remove-btn"
          onClick={handleDeletePortfolio}
        >
          Delete Portfolio
        </button>
      </div>
      <p><strong>Sector:</strong> {portfolio.sector}</p>

      <h3 style={{ marginTop: "30px" }}>Add Stock</h3>

      <form onSubmit={handleAddStock} className="portfolio-form">

        <div className="stock-search-wrapper">
          <input
            type="text"
            placeholder="Search Stock Name (e.g. Tata Motors)"
            value={formData.name}
            onChange={(e) => handleStockInputChange(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            autoComplete="off"
            required
          />

          {isSearching && (
            <p className="stock-search-meta">Searching...</p>
          )}

          {isInputFocused && suggestions.length > 0 && (
            <ul className="stock-suggestions">
              {suggestions.map((item) => (
                <li
                  key={item.ticker}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionSelect(item)}
                >
                  <span>{item.name}</span>
                  <span>{item.ticker}</span>
                </li>
              ))}
            </ul>
          )}

          {formData.ticker && (
            <p className="stock-selected-hint">
              Selected ticker: <strong>{formData.ticker}</strong>
            </p>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Fetching..." : "Fetch & Add"}
        </button>

      </form>

      <ProfileSummaryCards portfolioName={portfolio.name} stocks={stocks} />

      <h3 style={{ marginTop: "40px" }}>Stocks</h3>
      {/* <StockTable stocks={stocks} /> */}
      <StockTable stocks={stocks} onRemove={handleRemoveStock} />
      <PortfolioTopDiscountChart portfolioId={id} refreshToken={chartRefreshToken} />
      <StockRiskClusterPanel portfolioId={id} refreshToken={chartRefreshToken} />
    </div>
  );
}

export default PortfolioDetail;
