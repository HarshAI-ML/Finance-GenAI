import base64
from io import BytesIO
from math import sqrt

import numpy as np
import pandas as pd
import yfinance as yf


RISK_FREE_RATE = 0.06
TRADING_DAYS = 252
CLUSTER_NAMES = ["Low Risk", "Medium Risk", "High Risk"]
CLUSTER_COLORS = {
    "Low Risk": "#22c55e",
    "Medium Risk": "#f59e0b",
    "High Risk": "#ef4444",
}


def _history_for_ticker(ticker: str, period: str = "3y") -> pd.DataFrame:
    symbols = [ticker]
    if "." not in ticker and "=" not in ticker:
        symbols.append(f"{ticker}.NS")

    for symbol in symbols:
        history = yf.Ticker(symbol).history(period=period, interval="1d")
        if not history.empty and "Close" in history.columns:
            return history

    return pd.DataFrame()


def _stock_metrics_from_history(history: pd.DataFrame) -> dict | None:
    close = history["Close"].dropna()
    if len(close) < 30:
        return None

    returns = close.pct_change().dropna()
    if returns.empty:
        return None

    volatility = float(returns.std() * sqrt(TRADING_DAYS))
    annual_return = float(returns.mean() * TRADING_DAYS)
    sharpe = (annual_return - RISK_FREE_RATE) / volatility if volatility > 0 else 0.0

    cumulative = (1 + returns).cumprod()
    running_max = cumulative.cummax()
    drawdown = cumulative / running_max - 1
    max_drawdown = float(drawdown.min())

    start_price = float(close.iloc[0])
    end_price = float(close.iloc[-1])
    total_days = max((close.index[-1] - close.index[0]).days, 1)
    years = total_days / 365.25
    cagr = (end_price / start_price) ** (1 / years) - 1 if start_price > 0 else 0.0

    return {
        "volatility": volatility,
        "sharpe_ratio": float(sharpe),
        "max_drawdown": max_drawdown,
        "cagr": float(cagr),
    }


def _cluster_labels(frame: pd.DataFrame) -> dict:
    cluster_stats = (
        frame.groupby("cluster")[["volatility", "sharpe_ratio"]]
        .mean()
        .reset_index()
        .sort_values(by=["volatility", "sharpe_ratio"], ascending=[True, False])
    )
    ordered_clusters = cluster_stats["cluster"].tolist()
    return {cluster_id: CLUSTER_NAMES[i] for i, cluster_id in enumerate(ordered_clusters)}


def _build_cluster_plot(frame: pd.DataFrame, plt) -> str:
    fig, ax = plt.subplots(figsize=(10, 6))

    for risk_name in CLUSTER_NAMES:
        subset = frame[frame["risk_category"] == risk_name]
        if subset.empty:
            continue
        ax.scatter(
            subset["pca_1"],
            subset["pca_2"],
            label=risk_name,
            s=80,
            alpha=0.85,
            color=CLUSTER_COLORS[risk_name],
            edgecolors="white",
            linewidths=0.8,
        )
        for _, row in subset.iterrows():
            ax.annotate(
                row["ticker"],
                (row["pca_1"], row["pca_2"]),
                textcoords="offset points",
                xytext=(5, 5),
                fontsize=8,
            )

    ax.set_title("Stock Risk Clusters (PCA Projection)")
    ax.set_xlabel("PCA Component 1")
    ax.set_ylabel("PCA Component 2")
    ax.grid(True, alpha=0.2)
    ax.legend(title="Risk Category")
    fig.tight_layout()

    image_buffer = BytesIO()
    fig.savefig(image_buffer, format="png", dpi=120)
    plt.close(fig)
    image_buffer.seek(0)
    encoded = base64.b64encode(image_buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def _standardize_features(features: pd.DataFrame) -> np.ndarray:
    values = features.to_numpy(dtype=float)
    means = values.mean(axis=0)
    stds = values.std(axis=0)
    stds[stds == 0] = 1.0
    return (values - means) / stds


def _kmeans_fit_predict(
    values: np.ndarray,
    n_clusters: int = 3,
    random_state: int = 42,
    max_iter: int = 100,
) -> np.ndarray:
    rng = np.random.default_rng(random_state)
    initial_idx = rng.choice(values.shape[0], size=n_clusters, replace=False)
    centroids = values[initial_idx]
    labels = np.zeros(values.shape[0], dtype=int)

    for _ in range(max_iter):
        distances = np.linalg.norm(values[:, None, :] - centroids[None, :, :], axis=2)
        new_labels = distances.argmin(axis=1)
        if np.array_equal(labels, new_labels):
            break
        labels = new_labels

        new_centroids = centroids.copy()
        for idx in range(n_clusters):
            cluster_points = values[labels == idx]
            if len(cluster_points) > 0:
                new_centroids[idx] = cluster_points.mean(axis=0)
        centroids = new_centroids

    return labels


def _pca_2d(values: np.ndarray) -> np.ndarray:
    centered = values - values.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    components = centered @ vt[:2].T

    if components.shape[1] == 1:
        components = np.hstack([components, np.zeros((components.shape[0], 1))])

    return components


def compute_stock_risk_clusters(stocks) -> dict:
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception:
        return {
            "plot_image": None,
            "stocks": [],
            "skipped_tickers": [],
            "error": "Missing dependency: matplotlib. Install matplotlib to render cluster plot.",
        }

    records = []
    skipped = []

    for stock in stocks:
        history = _history_for_ticker(stock.ticker)
        if history.empty:
            skipped.append(stock.ticker)
            continue

        metrics = _stock_metrics_from_history(history)
        if not metrics:
            skipped.append(stock.ticker)
            continue

        records.append(
            {
                "stock_id": stock.id,
                "name": stock.name,
                "ticker": stock.ticker,
                **metrics,
            }
        )

    if len(records) < 3:
        return {
            "plot_image": None,
            "stocks": [],
            "skipped_tickers": skipped,
            "error": "At least 3 stocks with valid 3-year history are required.",
        }

    frame = pd.DataFrame(records)
    features = frame[["volatility", "sharpe_ratio", "max_drawdown", "cagr"]].copy()

    scaled = _standardize_features(features)
    frame["cluster"] = _kmeans_fit_predict(scaled, n_clusters=3, random_state=42)

    label_map = _cluster_labels(frame)
    frame["risk_category"] = frame["cluster"].map(label_map)

    components = _pca_2d(scaled)
    frame["pca_1"] = components[:, 0]
    frame["pca_2"] = components[:, 1]

    plot_image = _build_cluster_plot(frame, plt)

    stocks_result = []
    for _, row in frame.iterrows():
        stocks_result.append(
            {
                "stock_id": int(row["stock_id"]),
                "name": row["name"],
                "ticker": row["ticker"],
                "volatility": round(float(row["volatility"]), 6),
                "sharpe_ratio": round(float(row["sharpe_ratio"]), 6),
                "max_drawdown": round(float(row["max_drawdown"]), 6),
                "cagr": round(float(row["cagr"]), 6),
                "risk_category": row["risk_category"],
            }
        )

    return {
        "plot_image": plot_image,
        "stocks": stocks_result,
        "skipped_tickers": skipped,
        "error": None,
    }
