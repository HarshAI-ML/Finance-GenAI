# from __future__ import annotations

# from datetime import timedelta

# import numpy as np
# import pandas as pd
# import yfinance as yf


# SUPPORTED_MODELS = {"linear", "arima", "rnn"}
# DEFAULT_FORECAST_DAYS = 30
# MIN_FORECAST_DAYS = 7
# MAX_FORECAST_DAYS = 120


# def _sanitize_forecast_days(value) -> int:
#     try:
#         parsed = int(value)
#     except (TypeError, ValueError):
#         parsed = DEFAULT_FORECAST_DAYS
#     return max(MIN_FORECAST_DAYS, min(MAX_FORECAST_DAYS, parsed))


# def _load_btc_close_3y() -> pd.Series:
#     df = yf.Ticker("BTC-USD").history(period="3y", interval="1d")
#     if df.empty or "Close" not in df.columns:
#         raise Exception("Unable to fetch BTC-USD history from yfinance")

#     close = df["Close"].dropna().astype(float)
#     if close.empty:
#         raise Exception("BTC close price history is empty")

#     close.index = pd.to_datetime(close.index).tz_localize(None)
#     return close


# def _forecast_linear(series: pd.Series, steps: int) -> np.ndarray:
#     # Use a recent window and log-space trend to avoid extreme linear spikes.
#     window_days = 365
#     if len(series) > window_days:
#         series = series.tail(window_days)

#     y = np.log(series.to_numpy(dtype=float))
#     x = np.arange(len(y), dtype=float)
#     slope, intercept = np.polyfit(x, y, deg=1)
#     future_x = np.arange(len(y), len(y) + steps, dtype=float)
#     return np.exp(slope * future_x + intercept)


# def _forecast_rnn(series: pd.Series, steps: int) -> np.ndarray:
#     # Simple recurrent forecaster (NumPy-only) to avoid external ML dependencies.
#     values = series.to_numpy(dtype=float)
#     if len(values) < 20:
#         return _forecast_linear(series, steps)

#     mean = float(np.mean(values))
#     std = float(np.std(values) or 1.0)
#     normalized = (values - mean) / std

#     rng = np.random.default_rng(42)
#     wx = float(rng.normal(0.1, 0.05))
#     wh = float(rng.normal(0.1, 0.05))
#     wy = float(rng.normal(0.1, 0.05))
#     bh = 0.0
#     by = 0.0

#     lr = 0.01
#     epochs = 220
#     n = len(normalized) - 1

#     for _ in range(epochs):
#         h_prev = 0.0
#         d_wx = d_wh = d_wy = d_bh = d_by = 0.0

#         for idx in range(n):
#             x_t = float(normalized[idx])
#             target = float(normalized[idx + 1])

#             z = wx * x_t + wh * h_prev + bh
#             h_t = np.tanh(z)
#             y_t = wy * h_t + by

#             err = y_t - target
#             d_y = 2.0 * err
#             d_wy += d_y * h_t
#             d_by += d_y

#             d_h = d_y * wy
#             d_z = d_h * (1.0 - h_t * h_t)
#             d_wx += d_z * x_t
#             d_wh += d_z * h_prev
#             d_bh += d_z

#             h_prev = h_t

#         clip = 1.0
#         d_wx = float(np.clip(d_wx / n, -clip, clip))
#         d_wh = float(np.clip(d_wh / n, -clip, clip))
#         d_wy = float(np.clip(d_wy / n, -clip, clip))
#         d_bh = float(np.clip(d_bh / n, -clip, clip))
#         d_by = float(np.clip(d_by / n, -clip, clip))

#         wx -= lr * d_wx
#         wh -= lr * d_wh
#         wy -= lr * d_wy
#         bh -= lr * d_bh
#         by -= lr * d_by

#     h_state = 0.0
#     for x_t in normalized:
#         h_state = np.tanh(wx * float(x_t) + wh * h_state + bh)

#     prev_x = float(normalized[-1])
#     preds_norm = []
#     for _ in range(steps):
#         h_state = np.tanh(wx * prev_x + wh * h_state + bh)
#         next_x = wy * h_state + by
#         preds_norm.append(next_x)
#         prev_x = float(next_x)

#     return np.array(preds_norm) * std + mean


# def _forecast_arima(series: pd.Series, steps: int) -> np.ndarray:
#     from statsmodels.tsa.arima.model import ARIMA

#     model = ARIMA(series, order=(5, 1, 0))
#     fitted = model.fit()
#     return np.asarray(fitted.forecast(steps=steps), dtype=float)


# def _forecast_with_model(series: pd.Series, model_name: str, steps: int) -> np.ndarray:
#     model_name = (model_name or "").lower()
#     if model_name not in SUPPORTED_MODELS:
#         model_name = "linear"

#     try:
#         if model_name == "linear":
#             forecast_values = _forecast_linear(series, steps)
#         elif model_name == "arima":
#             forecast_values = _forecast_arima(series, steps)
#         else:
#             forecast_values = _forecast_rnn(series, steps)
#     except Exception:
#         # Fallback to linear trend to keep API resilient.
#         forecast_values = _forecast_linear(series, steps)
#         model_name = f"{model_name}-fallback-linear"

#     return np.maximum(forecast_values, 0), model_name


# def get_btc_forecast_payload(model_name: str, forecast_days) -> dict:
#     model_requested = (model_name or "linear").lower()
#     days = _sanitize_forecast_days(forecast_days)
#     close_series = _load_btc_close_3y()
#     forecast_values, model_used = _forecast_with_model(close_series, model_requested, days)

#     historical = [
#         {
#             "date": dt.strftime("%Y-%m-%d"),
#             "price": round(float(value), 2),
#             "segment": "historical",
#         }
#         for dt, value in close_series.items()
#     ]

#     last_date = close_series.index[-1]
#     forecast = []
#     for idx, predicted in enumerate(forecast_values, start=1):
#         forecast.append(
#             {
#                 "date": (last_date + timedelta(days=idx)).strftime("%Y-%m-%d"),
#                 "price": round(float(predicted), 2),
#                 "segment": "forecast",
#             }
#         )

#     return {
#         "symbol": "BTC-USD",
#         "source": "yfinance",
#         "history_period": "3y",
#         "model_requested": model_requested,
#         "model_used": model_used,
#         "forecast_days": days,
#         "historical_points": len(historical),
#         "forecast_points": len(forecast),
#         "historical": historical,
#         "forecast": forecast,
#     }



from __future__ import annotations

from datetime import timedelta

import numpy as np
import pandas as pd
import yfinance as yf


SUPPORTED_MODELS = {"linear", "arima", "rnn"}
DEFAULT_FORECAST_DAYS = 30
MIN_FORECAST_DAYS = 7
MAX_FORECAST_DAYS = 120

# How aggressively forecasts revert toward recent mean (0=none, 1=full snap)
MEAN_REVERSION_STRENGTH = 0.15
# Max allowed daily % change in forecast (caps explosive moves)
MAX_DAILY_CHANGE_PCT = 0.03   # 3% per day


def _sanitize_forecast_days(value) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = DEFAULT_FORECAST_DAYS
    return max(MIN_FORECAST_DAYS, min(MAX_FORECAST_DAYS, parsed))


def _load_btc_close_3y() -> pd.Series:
    df = yf.Ticker("BTC-USD").history(period="3y", interval="1d")
    if df.empty or "Close" not in df.columns:
        raise Exception("Unable to fetch BTC-USD history from yfinance")
    close = df["Close"].dropna().astype(float)
    if close.empty:
        raise Exception("BTC close price history is empty")
    close.index = pd.to_datetime(close.index).tz_localize(None)
    return close


def _apply_guardrails(forecast: np.ndarray, last_price: float) -> np.ndarray:
    """
    Two-stage guardrail:
    1. Cap each step's daily change at MAX_DAILY_CHANGE_PCT.
    2. Apply gentle mean reversion toward the recent anchor price.
    This keeps all models from producing explosive or unrealistic curves.
    """
    result = np.empty_like(forecast)
    prev = last_price
    anchor = last_price  # mean-reversion target = current price

    for i, raw in enumerate(forecast):
        # --- cap daily move ---
        max_move = prev * MAX_DAILY_CHANGE_PCT
        clamped = float(np.clip(raw, prev - max_move, prev + max_move))

        # --- blend toward anchor (mean reversion decays over horizon) ---
        # reversion weight grows slightly over time so long forecasts don't drift wildly
        rev_weight = MEAN_REVERSION_STRENGTH * (1 + i / len(forecast))
        blended = clamped * (1 - rev_weight) + anchor * rev_weight

        result[i] = max(blended, 0.0)
        prev = blended

    return result


def _forecast_linear(series: pd.Series, steps: int) -> np.ndarray:
    """
    Log-linear trend on a SHORT recent window (90d) so the slope reflects
    current momentum, not the entire 3-year bull cycle.
    """
    window_days = 90  # was 365 — that captured the bull-market slope
    if len(series) > window_days:
        series = series.tail(window_days)

    y = np.log(series.to_numpy(dtype=float))
    x = np.arange(len(y), dtype=float)
    slope, intercept = np.polyfit(x, y, deg=1)

    # Dampen slope: prevent trend from compounding too aggressively
    # Cap slope at ±0.5% per day in log-space (~0.005)
    slope = float(np.clip(slope, -0.005, 0.005))

    future_x = np.arange(len(y), len(y) + steps, dtype=float)
    return np.exp(slope * future_x + intercept)


def _forecast_rnn(series: pd.Series, steps: int) -> np.ndarray:
    """
    Simple RNN (NumPy-only). Key fix: normalise on the RECENT window only
    so the hidden state doesn't encode the full bull-run scale.
    """
    window = 180
    values = series.tail(window).to_numpy(dtype=float) if len(series) > window else series.to_numpy(dtype=float)

    if len(values) < 20:
        return _forecast_linear(series, steps)

    mean = float(np.mean(values))
    std = float(np.std(values) or 1.0)
    normalized = (values - mean) / std

    rng = np.random.default_rng(42)
    wx = float(rng.normal(0.1, 0.05))
    wh = float(rng.normal(0.1, 0.05))
    wy = float(rng.normal(0.1, 0.05))
    bh = 0.0
    by = 0.0

    lr = 0.005   # reduced from 0.01 — prevents overshooting
    epochs = 150  # fewer epochs → less overfit to trend
    n = len(normalized) - 1

    for _ in range(epochs):
        h_prev = 0.0
        d_wx = d_wh = d_wy = d_bh = d_by = 0.0
        for idx in range(n):
            x_t = float(normalized[idx])
            target = float(normalized[idx + 1])
            z = wx * x_t + wh * h_prev + bh
            h_t = float(np.tanh(z))
            y_t = wy * h_t + by
            err = y_t - target
            d_y = 2.0 * err
            d_wy += d_y * h_t
            d_by += d_y
            d_h = d_y * wy
            d_z = d_h * (1.0 - h_t * h_t)
            d_wx += d_z * x_t
            d_wh += d_z * h_prev
            d_bh += d_z
            h_prev = h_t

        clip = 0.5  # tighter gradient clip
        wx -= lr * float(np.clip(d_wx / n, -clip, clip))
        wh -= lr * float(np.clip(d_wh / n, -clip, clip))
        wy -= lr * float(np.clip(d_wy / n, -clip, clip))
        bh -= lr * float(np.clip(d_bh / n, -clip, clip))
        by -= lr * float(np.clip(d_by / n, -clip, clip))

    # Run forward pass to set hidden state
    h_state = 0.0
    for x_t in normalized:
        h_state = float(np.tanh(wx * float(x_t) + wh * h_state + bh))

    prev_x = float(normalized[-1])
    preds_norm = []
    for _ in range(steps):
        h_state = float(np.tanh(wx * prev_x + wh * h_state + bh))
        next_x = wy * h_state + by
        preds_norm.append(float(next_x))
        prev_x = next_x

    return np.array(preds_norm) * std + mean


def _forecast_arima(series: pd.Series, steps: int) -> np.ndarray:
    """
    ARIMA on log-prices with a conservative order.
    Using log-prices makes the series more stationary and prevents
    explosive level forecasts.
    """
    from statsmodels.tsa.arima.model import ARIMA

    log_series = np.log(series)
    # (2,1,2) is more stable than (5,1,0) for financial series
    model = ARIMA(log_series, order=(2, 1, 2))
    fitted = model.fit()
    log_forecast = np.asarray(fitted.forecast(steps=steps), dtype=float)
    return np.exp(log_forecast)


def _forecast_with_model(series: pd.Series, model_name: str, steps: int):
    model_name = (model_name or "").lower()
    if model_name not in SUPPORTED_MODELS:
        model_name = "linear"

    last_price = float(series.iloc[-1])

    try:
        if model_name == "linear":
            raw = _forecast_linear(series, steps)
        elif model_name == "arima":
            raw = _forecast_arima(series, steps)
        else:
            raw = _forecast_rnn(series, steps)
    except Exception:
        raw = _forecast_linear(series, steps)
        model_name = f"{model_name}-fallback-linear"

    # Apply guardrails AFTER every model — this is the key normalisation step
    forecast_values = _apply_guardrails(raw, last_price)
    return forecast_values, model_name


def get_btc_forecast_payload(model_name: str, forecast_days) -> dict:
    model_requested = (model_name or "linear").lower()
    days = _sanitize_forecast_days(forecast_days)
    close_series = _load_btc_close_3y()
    forecast_values, model_used = _forecast_with_model(close_series, model_requested, days)

    historical = [
        {
            "date": dt.strftime("%Y-%m-%d"),
            "price": round(float(value), 2),
            "segment": "historical",
        }
        for dt, value in close_series.items()
    ]

    last_date = close_series.index[-1]
    forecast = [
        {
            "date": (last_date + timedelta(days=idx)).strftime("%Y-%m-%d"),
            "price": round(float(predicted), 2),
            "segment": "forecast",
        }
        for idx, predicted in enumerate(forecast_values, start=1)
    ]

    return {
        "symbol": "BTC-USD",
        "source": "yfinance",
        "history_period": "3y",
        "model_requested": model_requested,
        "model_used": model_used,
        "forecast_days": days,
        "historical_points": len(historical),
        "forecast_points": len(forecast),
        "historical": historical,
        "forecast": forecast,
    }