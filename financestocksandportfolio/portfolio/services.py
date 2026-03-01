import yfinance as yf


def fetch_stock_data(ticker):

    # ---- Try original ticker first ----
    ticker_data = yf.Ticker(ticker)
    info = ticker_data.info
    current_price = info.get("currentPrice")

    # ---- If price not found, try Indian NSE (.NS) ----
    if current_price is None:
        ticker = ticker + ".NS"
        ticker_data = yf.Ticker(ticker)
        info = ticker_data.info
        current_price = info.get("currentPrice")

        # If still not found → invalid ticker
        if current_price is None:
            raise Exception("Invalid ticker or data not available")

    # ---- Your original logic below (UNCHANGED) ----
    pe_ratio = info.get("trailingPE", 0)
    eps = info.get("trailingEps", 0)
    market_cap = info.get("marketCap", 0)

    # Basic intrinsic value formula
    intrinsic_value = eps * 20 if eps else 0

    discount_level = (
        ((intrinsic_value - current_price) / intrinsic_value) * 100
        if intrinsic_value
        else 0
    )

    # Simple opportunity scoring logic (0–10)
    opportunity_score = 0
    if discount_level > 20:
        opportunity_score += 4
    if pe_ratio and pe_ratio < 25:
        opportunity_score += 3
    if eps and eps > 0:
        opportunity_score += 3

    return {
        "current_price": current_price,
        "pe_ratio": pe_ratio,
        "eps": eps,
        "market_cap": market_cap,
        "intrinsic_value": intrinsic_value,
        "discount_level": round(discount_level, 2),
        "opportunity_score": round(opportunity_score, 1),
    }