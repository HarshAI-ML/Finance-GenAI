import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const RANGE_OPTIONS = [
  { label: "1 Week", value: "1w", days: 7 },
  { label: "1 Month", value: "1m", days: 30 },
  { label: "6 Months", value: "6m", days: 182 },
  { label: "1 Year", value: "1y", days: 365 },
  { label: "3 Years", value: "3y", days: 1095 },
];

function seededNoise(index) {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function toPercent(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function calcPercentChange(start, end) {
  if (!start) return 0;
  return ((end - start) / start) * 100;
}

function generateMetalsSeries(totalDays = 1095) {
  const rows = [];
  let gold = 1820;
  let silver = 22.4;
  let lastGoldChange = 0.0008;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const trend = 0.00012;
    const cyclical = Math.sin(i / 38) * 0.0019;
    const volatility = (seededNoise(i) - 0.5) * 0.009;

    const goldChange = trend + cyclical + volatility * 0.55;
    const silverChange = trend * 1.1 + cyclical * 1.35 + volatility * 0.95 + lastGoldChange * 0.28;

    gold *= 1 + goldChange;
    silver *= 1 + silverChange;

    gold = Math.max(1450, gold);
    silver = Math.max(16, silver);
    lastGoldChange = goldChange;

    rows.push({
      isoDate: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      gold: Number(gold.toFixed(2)),
      silver: Number(silver.toFixed(2)),
    });
  }

  return rows;
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

function MetalsExplorer() {
  const [range, setRange] = useState("6m");

  const fullSeries = useMemo(() => generateMetalsSeries(1095), []);
  const selectedRangeConfig = RANGE_OPTIONS.find((item) => item.value === range) || RANGE_OPTIONS[2];

  const selectedSeries = useMemo(
    () => fullSeries.slice(-selectedRangeConfig.days),
    [fullSeries, selectedRangeConfig.days]
  );

  const relativeInsightSeries = useMemo(
    () => buildRelativeInsightSeries(selectedSeries),
    [selectedSeries]
  );

  const evolution3M = useMemo(() => {
    const slice = fullSeries.slice(-90);
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
  }, [fullSeries]);

  const selectedWindowChange = useMemo(() => {
    const first = selectedSeries[0];
    const last = selectedSeries[selectedSeries.length - 1];
    return {
      gold: calcPercentChange(first?.gold, last?.gold),
      silver: calcPercentChange(first?.silver, last?.silver),
      goldNow: last?.gold ?? 0,
      silverNow: last?.silver ?? 0,
    };
  }, [selectedSeries]);

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
      </section>
    </main>
  );
}

export default MetalsExplorer;
