function StockTable({ stocks = [], onRemove }) {

  if (!stocks.length) {
    return <p style={{ marginTop: "20px" }}>No stocks added yet.</p>;
  }

  const getScoreColor = (score) => {
    if (score >= 8) return "#16a34a";
    if (score >= 5) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <div className="table-wrapper">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Ticker</th>
            <th>Price</th>
            <th>PE</th>
            <th>EPS</th>
            <th>Market Cap</th>
            <th>Intrinsic</th>
            <th>Discount %</th>
            <th>Opportunity</th>
            <th>Action</th> {/* 🔥 NEW COLUMN */}
          </tr>
        </thead>

        <tbody>
          {stocks.map((stock) => {
            const score = Number(stock.opportunity_score) || 0;
            const percentage = (score / 10) * 100;

            return (
              <tr key={stock.id}>
                <td>{stock.name}</td>
                <td>{stock.ticker}</td>
                <td>₹{stock.current_price}</td>
                <td>{stock.pe_ratio}</td>
                <td>{stock.eps}</td>
                <td>{stock.market_cap}</td>
                <td>₹{stock.intrinsic_value}</td>

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
                        backgroundColor: getScoreColor(score)
                      }}
                    />
                    <span className="score-label">{score}/10</span>
                  </div>
                </td>

                {/* 🔥 REMOVE BUTTON */}
                <td>
                  <button
                    className="remove-btn"
                    onClick={() => onRemove(stock.id)}
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