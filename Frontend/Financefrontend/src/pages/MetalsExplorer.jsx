import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getMetalsHistory } from "../services/metalsService";

const RANGE_OPTIONS = [
  { label: "1 Week", value: "1w", days: 7 },
  { label: "1 Month", value: "1m", days: 30 },
  { label: "6 Months", value: "6m", days: 182 },
  { label: "1 Year", value: "1y", days: 365 },
  { label: "3 Years", value: "3y", days: 1095 },
];

function toPercent(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function calcPercentChange(start, end) {
  if (!start) return 0;
  return ((end - start) / start) * 100;
}

function buildRelativeInsightSeries(data) {
  if (!data.length) return [];

  const goldBase = data[0].gold;
  const silverBase = data[0].silver;

  return data.map((item) => {
    const goldReturn = calcPercentChange(goldBase, item.gold);
    const silverReturn = calcPercentChange(silverBase, item.silver);
    return {
      label: item.label,
      isoDate: item.isoDate,
      goldReturn: Number(goldReturn.toFixed(2)),
      silverReturn: Number(silverReturn.toFixed(2)),
      returnGap: Number((silverReturn - goldReturn).toFixed(2)),
    };
  });
}

function calculatePearsonCorrelation(series) {
  const n = series.length;
  if (!n) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i += 1) {
    const x = series[i].gold;
    const y = series[i].silver;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

function getCorrelationMeta(rValue) {
  if (rValue >= 0.9) return { label: "Highly Correlated (Very Strong +)", tone: "corr-very-high" };
  if (rValue >= 0.7) return { label: "Highly Correlated (Strong +)", tone: "corr-high" };
  if (rValue >= 0.4) return { label: "Moderately Correlated (+)", tone: "corr-medium" };
  if (rValue >= 0.2) return { label: "Weak Correlation (+)", tone: "corr-low" };
  if (rValue > -0.2) return { label: "No Clear Correlation", tone: "corr-neutral" };
  if (rValue > -0.4) return { label: "Weak Correlation (-)", tone: "corr-low-neg" };
  if (rValue > -0.7) return { label: "Moderately Correlated (-)", tone: "corr-medium-neg" };
  return { label: "Highly Correlated (Strong -)", tone: "corr-high-neg" };
}

function buildGoldSilverRegression(series) {
  if (!series.length) return { points: [], line: [] };

  const n = series.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let minGold = Number.POSITIVE_INFINITY;
  let maxGold = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < n; i += 1) {
    const x = series[i].gold;
    const y = series[i].silver;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    minGold = Math.min(minGold, x);
    maxGold = Math.max(maxGold, x);
  }

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const points = series.map((row) => ({
    gold: Number(row.gold.toFixed(2)),
    silver: Number(row.silver.toFixed(2)),
  }));

  const line = [
    {
      gold: Number(minGold.toFixed(2)),
      silverFit: Number((slope * minGold + intercept).toFixed(2)),
    },
    {
      gold: Number(maxGold.toFixed(2)),
      silverFit: Number((slope * maxGold + intercept).toFixed(2)),
    },
  ];

  return { points, line };
}

function MetalsExplorer() {
  const [range, setRange] = useState("6m");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getMetalsHistory();
        const rows = (response.data?.history || []).map((row) => ({
          ...row,
          isoDate: row.date,
          label: new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }));
        if (active) setHistory(rows);
      } catch (err) {
        if (active) setError(err.response?.data?.error || "Failed to load metals data");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const selectedRangeConfig = RANGE_OPTIONS.find((item) => item.value === range) || RANGE_OPTIONS[2];

  const selectedSeries = useMemo(
    () => history.slice(-selectedRangeConfig.days),
    [history, selectedRangeConfig.days]
  );

  const relativeInsightSeries = useMemo(
    () => buildRelativeInsightSeries(selectedSeries),
    [selectedSeries]
  );

  const evolution3M = useMemo(() => {
    const slice = history.slice(-90);
    if (!slice.length) {
      return { goldChange: 0, silverChange: 0, spread: 0 };
    }
    const first = slice[0];
    const last = slice[slice.length - 1];
    const goldChange = calcPercentChange(first?.gold, last?.gold);
    const silverChange = calcPercentChange(first?.silver, last?.silver);
    const spread = silverChange - goldChange;

    return {
      goldChange,
      silverChange,
      spread,
    };
  }, [history]);

  const selectedWindowChange = useMemo(() => {
    if (!selectedSeries.length) {
      return {
        gold: 0,
        silver: 0,
        goldNow: 0,
        silverNow: 0,
      };
    }
    const first = selectedSeries[0];
    const last = selectedSeries[selectedSeries.length - 1];
    return {
      gold: calcPercentChange(first?.gold, last?.gold),
      silver: calcPercentChange(first?.silver, last?.silver),
      goldNow: last?.gold ?? 0,
      silverNow: last?.silver ?? 0,
    };
  }, [selectedSeries]);

  const goldSilverRegression = useMemo(
    () => buildGoldSilverRegression(selectedSeries),
    [selectedSeries]
  );
  const goldSilverCorrelation = useMemo(
    () => calculatePearsonCorrelation(selectedSeries),
    [selectedSeries]
  );
  const correlationMeta = useMemo(
    () => getCorrelationMeta(goldSilverCorrelation),
    [goldSilverCorrelation]
  );

  return (
    <main className="metals-page">
      <section className="metals-shell">
        <div className="metals-header">
          <div>
            <p className="metals-chip">Commodities Desk</p>
            <h1>Explore Metals</h1>
            <p>
              Track precious metal prices across multiple time horizons and monitor
              relative metal performance with insight-first visuals.
            </p>
          </div>

          <div className="range-switcher">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={range === option.value ? "range-btn active" : "range-btn"}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <section className="metals-chart-card">
            <p>Loading latest 3-year gold and silver history...</p>
          </section>
        )}

        {error && (
          <section className="metals-chart-card">
            <p className="negative">{error}</p>
          </section>
        )}

        {!loading && !error && (
          <>
            <div className="metals-metrics">
          <article className="metals-metric-card">
            <p>Gold Price (USD/oz)</p>
            <h3>{selectedWindowChange.goldNow.toFixed(2)}</h3>
            <span className={selectedWindowChange.gold >= 0 ? "positive" : "negative"}>
              {toPercent(selectedWindowChange.gold)} in {selectedRangeConfig.label}
            </span>
          </article>
          <article className="metals-metric-card">
            <p>Silver Price (USD/oz)</p>
            <h3>{selectedWindowChange.silverNow.toFixed(2)}</h3>
            <span className={selectedWindowChange.silver >= 0 ? "positive" : "negative"}>
              {toPercent(selectedWindowChange.silver)} in {selectedRangeConfig.label}
            </span>
          </article>
          <article className="metals-metric-card">
            <p>Gold/Silver Ratio</p>
            <h3>{(selectedWindowChange.goldNow / selectedWindowChange.silverNow).toFixed(2)}</h3>
            <span>Current relative valuation ratio</span>
          </article>
        </div>

        <section className="metals-chart-card">
          <div className="metals-card-header">
            <h2>Price Trend Comparison</h2>
            <p>Gold and Silver prices for {selectedRangeConfig.label}</p>
          </div>
          <div className="metals-chart-wrap">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={selectedSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e7df" />
                <XAxis dataKey="label" minTickGap={26} stroke="#527263" />
                <YAxis yAxisId="left" stroke="#b4860b" domain={["auto", "auto"]} />
                <YAxis yAxisId="right" orientation="right" stroke="#6378c8" domain={["auto", "auto"]} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="gold"
                  name="Gold (USD/oz)"
                  stroke="#c09010"
                  strokeWidth={2.8}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="silver"
                  name="Silver (USD/oz)"
                  stroke="#586fbf"
                  strokeWidth={2.6}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="metals-grid">
          <article className="metals-chart-card">
            <div className="metals-card-header">
              <h2>Relative Strength Insight</h2>
              <p>Return gap (Silver minus Gold) derived from the selected time window</p>
            </div>
            <div className="metals-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={relativeInsightSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d9e7df" />
                  <XAxis dataKey="label" minTickGap={24} stroke="#527263" />
                  <YAxis stroke="#3a5561" domain={["auto", "auto"]} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="returnGap"
                    stroke="#1b7f61"
                    fill="#67c3a5"
                    fillOpacity={0.35}
                    strokeWidth={2.2}
                    name="Silver - Gold Gap %"
                  />
                  <Line
                    type="monotone"
                    dataKey="goldReturn"
                    stroke="#c09010"
                    strokeWidth={2}
                    dot={false}
                    name="Gold Return %"
                  />
                  <Line
                    type="monotone"
                    dataKey="silverReturn"
                    stroke="#586fbf"
                    strokeWidth={2}
                    dot={false}
                    name="Silver Return %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="metals-chart-card insights-card">
            <div className="metals-card-header">
              <h2>3-Month Evolution Insights</h2>
              <p>Performance analysis over the last 90 days</p>
            </div>
            <div className="insights-list">
              <div className="insight-row">
                <span>Gold 3M Change</span>
                <strong className={evolution3M.goldChange >= 0 ? "positive" : "negative"}>
                  {toPercent(evolution3M.goldChange)}
                </strong>
              </div>
              <div className="insight-row">
                <span>Silver 3M Change</span>
                <strong className={evolution3M.silverChange >= 0 ? "positive" : "negative"}>
                  {toPercent(evolution3M.silverChange)}
                </strong>
              </div>
              <div className="insight-row">
                <span>Silver vs Gold Edge</span>
                <strong className={evolution3M.spread >= 0 ? "positive" : "negative"}>
                  {toPercent(evolution3M.spread)}
                </strong>
              </div>
            </div>
            <p className="insight-note">
              Insight: {evolution3M.spread >= 0 ? "Silver outperformed" : "Gold outperformed"} in the
              last 3 months by {Math.abs(evolution3M.spread).toFixed(2)}%.
            </p>
          </article>
        </section>

        <section className="metals-chart-card">
          <div className="metals-card-header">
            <h2>Gold vs Silver Correlation & Best-Fit</h2>
            <p>X-axis: Gold price, Y-axis: Silver price for {selectedRangeConfig.label}</p>
            <div className={`correlation-badge ${correlationMeta.tone}`}>
              <strong>Pearson r: {goldSilverCorrelation.toFixed(3)}</strong>
              <span>{correlationMeta.label}</span>
            </div>
          </div>
          <div className="metals-chart-wrap">
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e7df" />
                <XAxis
                  type="number"
                  dataKey="gold"
                  name="Gold Price"
                  domain={["auto", "auto"]}
                  stroke="#527263"
                />
                <YAxis
                  type="number"
                  dataKey="silver"
                  name="Silver Price"
                  domain={["auto", "auto"]}
                  stroke="#3a5561"
                />
                <Tooltip
                  formatter={(value) => Number(value).toFixed(2)}
                  labelFormatter={() => ""}
                />
                <Legend />
                <Scatter
                  data={goldSilverRegression.points}
                  dataKey="silver"
                  name="Observed Points"
                  fill="#4f73c7"
                />
                <Line
                  data={goldSilverRegression.line}
                  type="linear"
                  dataKey="silverFit"
                  name="Best-Fit Line"
                  stroke="#b97700"
                  strokeWidth={2.8}
                  dot={false}
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

export default MetalsExplorer;
