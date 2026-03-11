import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getBtcForecast } from "../services/cryptoService";

const MODEL_OPTIONS = [
  { label: "Linear Regression", value: "linear" },
  { label: "ARIMA", value: "arima" },
  { label: "RNN", value: "rnn" },
];

const HORIZON_OPTIONS = [
  { label: "14 Days", value: 14 },
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "90 Days", value: 90 },
];

function formatUsd(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function formatPercent(value) {
  return `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;
}

function toChartLabel(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function CryptoExplorer() {
  const [model, setModel] = useState("linear");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let active = true;
    const loadForecast = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getBtcForecast(model, days);
        if (active) setPayload(response.data || null);
      } catch (err) {
        if (active) {
          setError(err.response?.data?.error || "Failed to load BTC forecast");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadForecast();
    return () => {
      active = false;
    };
  }, [model, days]);

  const chartData = useMemo(() => {
    if (!payload) return [];

    const historicalRows = (payload.historical || []).map((point) => ({
      date: point.date,
      label: toChartLabel(point.date),
      historicalPrice: point.price,
      forecastPrice: null,
    }));

    const lastHistorical = historicalRows[historicalRows.length - 1];
    const forecastRows = (payload.forecast || []).map((point) => ({
      date: point.date,
      label: toChartLabel(point.date),
      historicalPrice: null,
      forecastPrice: point.price,
    }));

    const forecastBridge = lastHistorical
      ? [
          {
            ...lastHistorical,
            historicalPrice: null,
            forecastPrice: lastHistorical.historicalPrice,
          },
        ]
      : [];

    return [...historicalRows, ...forecastBridge, ...forecastRows];
  }, [payload]);

  const splitDate = payload?.historical?.length
    ? payload.historical[payload.historical.length - 1].date
    : null;

  const summary = useMemo(() => {
    if (!payload?.historical?.length || !payload?.forecast?.length) {
      return { current: 0, projected: 0, change: 0 };
    }
    const current = payload.historical[payload.historical.length - 1].price;
    const projected = payload.forecast[payload.forecast.length - 1].price;
    const change = current ? ((projected - current) / current) * 100 : 0;
    return { current, projected, change };
  }, [payload]);

  return (
    <main className="crypto-page">
      <section className="crypto-shell">
        <div className="crypto-header">
          <div>
            <p className="crypto-chip">BTC Analyser</p>
            <h1>Bitcoin Forecast Dot Chart</h1>
            <p>
              Historical BTC-USD prices are fetched from yfinance for the last 3 years.
              Forecast is generated in backend using your selected model.
            </p>
          </div>
          <div className="crypto-controls">
            <label className="crypto-control">
              <span>Model</span>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="crypto-control">
              <span>Forecast Horizon</span>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {HORIZON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading && (
          <section className="crypto-card">
            <p>Loading BTC historical data and forecast...</p>
          </section>
        )}

        {error && (
          <section className="crypto-card">
            <p className="negative">{error}</p>
          </section>
        )}

        {!loading && !error && payload && (
          <>
            <section className="crypto-metrics">
              <article className="crypto-metric-card">
                <p>Current BTC Price</p>
                <h3>${formatUsd(summary.current)}</h3>
                <span>Latest historical close</span>
              </article>
              <article className="crypto-metric-card">
                <p>Projected Price ({days}d)</p>
                <h3>${formatUsd(summary.projected)}</h3>
                <span className={summary.change >= 0 ? "positive" : "negative"}>
                  {formatPercent(summary.change)} vs current
                </span>
              </article>
              <article className="crypto-metric-card">
                <p>Forecast Engine</p>
                <h3>{String(payload.model_used || model).toUpperCase()}</h3>
                <span>{payload.historical_points} historical points + {payload.forecast_points} forecast points</span>
              </article>
            </section>

            <section className="crypto-card">
              <div className="metals-card-header">
                <h2>Historical vs Forecast</h2>
                <p>
                  Blue line is historical BTC price. Orange dashed line with small dots is the forecast.
                </p>
              </div>
              <div className="crypto-chart-wrap">
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e7df" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={toChartLabel}
                      minTickGap={56}
                      stroke="#5b6778"
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      stroke="#4b5563"
                      tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                    />
                    <Tooltip
                      formatter={(value) => `$${formatUsd(value)}`}
                      labelFormatter={(value) => `Date: ${value}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="historicalPrice"
                      name="Historical Data"
                      stroke="#1d4ed8"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    {splitDate && (
                      <ReferenceLine
                        x={splitDate}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        ifOverflow="extendDomain"
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="forecastPrice"
                      name="Forecast Data"
                      stroke="#ea580c"
                      strokeWidth={1.8}
                      strokeDasharray="6 5"
                      dot={{ r: 2.1, strokeWidth: 0, fill: "#ea580c" }}
                      activeDot={{ r: 3 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default CryptoExplorer;
