import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";
import API from "../services/api";

function PortfolioTopDiscountChart({ portfolioId, refreshToken }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    API.get(`portfolios/${portfolioId}/top-discount/`)
      .then((res) => setData(res.data || []))
      .catch(() => setData([]));
  }, [portfolioId, refreshToken]);

  if (!data.length) return null;

  const chartData = [...data]
    .map((item) => ({
      ...item,
      discount_level: Number(item.discount_level) || 0
    }))
    .sort((a, b) => b.discount_level - a.discount_level)
    .slice(0, 5);

  const avgDiscount =
    chartData.reduce((sum, stock) => sum + stock.discount_level, 0) /
      chartData.length || 0;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const stock = payload[0].payload;

    return (
      <div className="discount-tooltip">
        <p className="discount-tooltip-ticker">{stock.ticker}</p>
        <p className="discount-tooltip-value">
          Discount: <strong>{stock.discount_level.toFixed(2)}%</strong>
        </p>
      </div>
    );
  };

  return (
    <div className="discount-chart-container">
      <div className="discount-chart-header">
        <div>
          <h3 className="chart-title">Top Discount Opportunities</h3>
          <p className="discount-chart-subtitle">
            Highest undervaluation across your current stocks
          </p>
        </div>
        <div className="discount-chart-badge">
          Avg: {avgDiscount.toFixed(2)}%
        </div>
      </div>

      <div className="discount-chart-area">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} barCategoryGap="28%">
            <defs>
              <linearGradient id="discountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="ticker"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              domain={[0, "auto"]}
              width={44}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
            <Bar dataKey="discount_level" barSize={28} radius={[8, 8, 0, 0]}>
              {chartData.map((item) => (
                <Cell
                  key={item.ticker}
                  fill={item.discount_level > avgDiscount ? "url(#discountGradient)" : "#86efac"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PortfolioTopDiscountChart;
