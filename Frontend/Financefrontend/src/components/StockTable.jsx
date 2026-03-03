import { useNavigate } from "react-router-dom";

function StockTable({ stocks = [], onRemove }) {
  const navigate = useNavigate();

  if (!stocks.length) {
    return <p style={{ marginTop: "20px" }}>No stocks added yet.</p>;
  }

  const getScoreColor = (score) => {
    if (score >= 8) return "#16a34a";
    if (score >= 5) return "#f59e0b";
    return "#dc2626";
  };

  const formatPrice = (value) => {
    if (value === null || value === undefined || value === "") return "--";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "--";
    return numericValue.toFixed(2);
  };

  return (
    <div className="table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ticker</th>
            <th>Price</th>
            <th>Min Price</th>
            <th>Max Price</th>
            <th>PE</th>
            <th>EPS</th>
            <th>Market Cap</th>
            <th>Intrinsic</th>
            <th>Discount %</th>
            <th>Opportunity</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {stocks.map((stock) => {
            const score = Number(stock.opportunity_score) || 0;
            const percentage = (score / 10) * 100;

            return (
              <tr
                key={stock.id}
                onClick={() => navigate(`/stock/${stock.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{stock.name}</td>
                <td>{stock.ticker}</td>
                <td>Rs. {formatPrice(stock.current_price)}</td>
                <td>Rs. {formatPrice(stock.min_price)}</td>
                <td>Rs. {formatPrice(stock.max_price)}</td>
                <td>{stock.pe_ratio}</td>
                <td>{stock.eps}</td>
                <td>{stock.market_cap}</td>
                <td>Rs. {formatPrice(stock.intrinsic_value)}</td>

                <td
                  className={
                    Number(stock.discount_level) > 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {stock.discount_level}%
                </td>

                <td>
                  <div className="score-bar-container">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getScoreColor(score),
                      }}
                    />
                    <span className="score-label">{score}/10</span>
                  </div>
                </td>

                <td>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(stock.id);
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StockTable;
