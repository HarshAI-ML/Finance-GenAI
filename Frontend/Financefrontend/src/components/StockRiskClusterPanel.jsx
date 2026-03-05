import { useEffect, useMemo, useState } from "react";
import { getPortfolioRiskClusters } from "../services/portfolioService";

function formatPercent(value) {
  return `${(Number(value) * 100).toFixed(2)}%`;
}

function StockRiskClusterPanel({ portfolioId, refreshToken }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchClusters = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getPortfolioRiskClusters(portfolioId);
        if (!active) return;
        setResult(res.data);
        setError(res.data?.error || "");
      } catch (err) {
        if (!active) return;
        setResult(null);
        setError(
          err.response?.data?.error || "Unable to generate risk clusters right now."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchClusters();
    return () => {
      active = false;
    };
  }, [portfolioId, refreshToken]);

  const rows = useMemo(() => result?.stocks || [], [result]);

  return (
    <div className="cluster-panel">
      <div className="cluster-panel-header">
        <h3>Stock Risk Clustering</h3>
        <p>
          Features: Volatility, Sharpe Ratio (6% RF), Max Drawdown, and 3Y CAGR.
        </p>
      </div>

      {loading && <p className="cluster-meta">Building clusters...</p>}
      {!loading && error && <p className="cluster-error">{error}</p>}

      {!loading && !error && result?.plot_image && (
        <>
          <div className="cluster-plot-wrap">
            <img src={result.plot_image} alt="Stock risk clustering scatter plot" />
          </div>

          <div className="cluster-table-wrap">
            <table className="cluster-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Volatility</th>
                  <th>Sharpe Ratio</th>
                  <th>Max Drawdown</th>
                  <th>CAGR (3Y)</th>
                  <th>Risk Category</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.stock_id}>
                    <td>{item.ticker}</td>
                    <td>{formatPercent(item.volatility)}</td>
                    <td>{Number(item.sharpe_ratio).toFixed(2)}</td>
                    <td>{formatPercent(item.max_drawdown)}</td>
                    <td>{formatPercent(item.cagr)}</td>
                    <td>
                      <span className={`risk-pill risk-${item.risk_category.replace(" ", "-").toLowerCase()}`}>
                        {item.risk_category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default StockRiskClusterPanel;
