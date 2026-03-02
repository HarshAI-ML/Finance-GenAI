import yfinance as yf


def fetch_stock_data(ticker, range_value=None):

    ticker_data = yf.Ticker(ticker)
    info = ticker_data.info
    current_price = info.get("currentPrice")

    # Try NSE if not found
    if current_price is None:
        ticker = ticker + ".NS"
        ticker_data = yf.Ticker(ticker)
        info = ticker_data.info
        current_price = info.get("currentPrice")

        if current_price is None:
            raise Exception("Invalid ticker or data not available")

    pe_ratio = info.get("trailingPE", 0)
    eps = info.get("trailingEps", 0)
    market_cap = info.get("marketCap", 0)
    company_name = info.get("longName") or info.get("shortName") or ticker
    intrinsic_value = eps * 20 if eps else 0

    discount_level = (
        ((intrinsic_value - current_price) / intrinsic_value) * 100
        if intrinsic_value
        else 0
    )

    opportunity_score = 0
    if discount_level > 20:
        opportunity_score += 4
    if pe_ratio and pe_ratio < 25:
        opportunity_score += 3
    if eps and eps > 0:
        opportunity_score += 3

    # 🔥 If no range requested → behave like before (IMPORTANT)
    if not range_value:
        return {
            "current_price": current_price,
            "pe_ratio": pe_ratio,
            "eps": eps,
            "market_cap": market_cap,
            "intrinsic_value": intrinsic_value,
            "discount_level": round(discount_level, 2),
            "opportunity_score": round(opportunity_score, 1),
        }

    # 🔥 If range requested → fetch history
    period_map = {
        "1D": "1d",
        "7D": "7d",
        "1M": "1mo",
        "3M": "3mo",
        "6M": "6mo",
        "1Y": "1y",
        "3Y": "3y",
    }

    history_df = ticker_data.history(period=period_map.get(range_value, "1mo"))

    history = []
    for date, row in history_df.iterrows():
        history.append({
            "date": date.strftime("%Y-%m-%d"),
            "price": round(row["Close"], 2)
        })

    return {
        "stock": {
            "name": company_name,
            "current_price": current_price,
            "pe_ratio": pe_ratio,
            "eps": eps,
            "market_cap": market_cap,
            "intrinsic_value": intrinsic_value,
            "discount_level": round(discount_level, 2),
            "opportunity_score": round(opportunity_score, 1),
        },
        "history": history
    }