/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
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
import { getPortfolioTopGrowth } from "../services/portfolioService";

const RANGE_OPTIONS = [
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "3 Months", value: "3M" },
  { label: "6 Months", value: "6M" },
  { label: "1 Year", value: "1Y" },
  { label: "3 Years", value: "3Y" },
];

function PortfolioTopGrowthChart({ portfolioId, refreshToken }) {
  const [range, setRange] = useState("1M");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getPortfolioTopGrowth(portfolioId, range);
        if (!active) return;
        setData(res.data?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.error || "Unable to load growth chart");
        setData([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [portfolioId, range, refreshToken]);

  const chartData = useMemo(() => {
    return [...data]
      .map((row) => ({
        ...row,
        growth_percent: Number(row.growth_percent) || 0,
      }))
      .sort((a, b) => b.growth_percent - a.growth_percent)
      .slice(0, 8);
  }, [data]);

  const avgGrowth = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((sum, row) => sum + row.growth_percent, 0) / chartData.length;
  }, [chartData]);

  const chartMin = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.min(0, ...chartData.map((row) => row.growth_percent));
  }, [chartData]);

  const chartMax = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.max(0, ...chartData.map((row) => row.growth_percent));
  }, [chartData]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const stock = payload[0].payload;

    return (
      <div className="discount-tooltip">
        <p className="discount-tooltip-ticker">{stock.ticker}</p>
        <p className="discount-tooltip-value">
          Growth: <strong>{stock.growth_percent.toFixed(2)}%</strong>
        </p>
        <p className="discount-tooltip-value">
          {stock.start_price.toFixed(2)} → {stock.end_price.toFixed(2)}
        </p>
      </div>
    );
  };

  return (
    <div className="discount-chart-container">
      <div className="discount-chart-header">
        <div>
          <h3 className="chart-title">Top Price Growth Stocks</h3>
          <p className="discount-chart-subtitle">
            Highest growth in your portfolio for the selected period
          </p>
        </div>
        <div className="discount-chart-badge">
          Avg: {avgGrowth.toFixed(2)}%
        </div>
      </div>

      <div className="growth-range-switcher">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={range === option.value ? "growth-range-btn active" : "growth-range-btn"}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <p className="growth-chart-meta">Loading growth data...</p>}
      {error && <p className="cluster-error">{error}</p>}
      {!loading && !error && !chartData.length && (
        <p className="growth-chart-meta">Not enough stock history to calculate growth.</p>
      )}

      {!loading && !error && chartData.length > 0 && (
        <div className="discount-chart-area">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barCategoryGap="22%">
              <defs>
                <linearGradient id="growthPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="growthNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
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
                domain={[chartMin, chartMax]}
                width={48}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
              <Bar dataKey="growth_percent" barSize={28} radius={[8, 8, 0, 0]}>
                {chartData.map((item) => (
                  <Cell
                    key={item.ticker}
                    fill={item.growth_percent >= 0 ? "url(#growthPositiveGradient)" : "url(#growthNegativeGradient)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default PortfolioTopGrowthChart;
