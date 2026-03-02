function ProfileSummaryCards({ portfolioName, stocks = [] }) {
  const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const normalized = value.replace(/[^0-9.-]/g, "");
      return Number(normalized) || 0;
    }
    return 0;
  };

  const totalStocks = stocks.length;
  const avgDiscount =
    totalStocks === 0
      ? 0
      : stocks.reduce((sum, stock) => sum + toNumber(stock.discount_level), 0) / totalStocks;
  const avgOpportunity =
    totalStocks === 0
      ? 0
      : stocks.reduce((sum, stock) => sum + toNumber(stock.opportunity_score), 0) / totalStocks;
  const undervaluedCount = stocks.filter((stock) => toNumber(stock.discount_level) > 0).length;

  const topDiscountStock = stocks.reduce(
    (best, stock) => {
      const discount = toNumber(stock.discount_level);
      if (discount > best.discount) {
        return {
          ticker: stock.ticker || "--",
          discount
        };
      }
      return best;
    },
    { ticker: "--", discount: 0 }
  );

  return (
    <section className="profile-summary-cards" aria-label="Portfolio summary cards">
      <article className="profile-summary-card">
        <p className="profile-summary-label">Portfolio</p>
        <h4>{portfolioName || "Untitled"}</h4>
        <p className="profile-summary-meta">{totalStocks} holdings tracked</p>
      </article>

      <article className="profile-summary-card">
        <p className="profile-summary-label">Average Discount</p>
        <h4>{avgDiscount.toFixed(2)}%</h4>
        <p className="profile-summary-meta">Across all listed stocks</p>
      </article>

      <article className="profile-summary-card">
        <p className="profile-summary-label">Undervalued Stocks</p>
        <h4>{undervaluedCount}</h4>
        <p className="profile-summary-meta">Discount greater than 0%</p>
      </article>

      <article className="profile-summary-card">
        <p className="profile-summary-label">Avg Opportunity</p>
        <h4>{avgOpportunity.toFixed(1)}/10</h4>
        <p className="profile-summary-meta">
          Top pick: {topDiscountStock.ticker} ({topDiscountStock.discount.toFixed(2)}%)
        </p>
      </article>
    </section>
  );
}

export default ProfileSummaryCards;
