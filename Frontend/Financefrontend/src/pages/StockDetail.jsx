import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PriceChart from "../components/PriceChart";
import API from "../services/api";

function StockDetail() {
  const { id } = useParams();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [range, setRange] = useState("1M");

  useEffect(() => {
    fetchStockDetails();
  }, [range, id]);

  const fetchStockDetails = async () => {
    try {
      const res = await API.get(`stocks/${id}/`, {
        params: { range }
      });
      const data = res.data;
      setStock(data.stock);
      setHistory(data.history || []);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stock) return <p>Loading...</p>;

  return (
    <div className="container">
      <h2>{stock.name} </h2>

      {/* RANGE DROPDOWN */}
      <select
        value={range}
        onChange={(e) => setRange(e.target.value)}
      >
        <option value="1D">1 Day</option>
        <option value="7D">7 Days</option>
        <option value="1M">1 Month</option>
        <option value="3M">3 Months</option>
        <option value="6M">6 Months</option>
        <option value="1Y">1 Year</option>
        <option value="3Y">3 Years</option>
      </select>

      {/* PRICE CHART */}
      <PriceChart data={history} />

      {/* FUNDAMENTAL CARDS */}
      <div className="detail-cards">
        <div className="detail-card">
          <h4>PE Ratio</h4>
          <p>{stock.pe_ratio}</p>
        </div>

        <div className="detail-card">
          <h4>EPS</h4>
          <p>{stock.eps}</p>
        </div>

        <div className="detail-card">
          <h4>Market Cap</h4>
          <p>{stock.market_cap}</p>
        </div>

        <div className="detail-card">
          <h4>Intrinsic Value</h4>
          <p>₹{stock.intrinsic_value}</p>
        </div>
      </div>
    </div>
  );
}

export default StockDetail;
