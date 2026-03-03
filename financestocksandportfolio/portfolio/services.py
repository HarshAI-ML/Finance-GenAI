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
    min_price = (
        info.get("dayLow")
        or info.get("regularMarketDayLow")
        or info.get("fiftyTwoWeekLow")
    )
    max_price = (
        info.get("dayHigh")
        or info.get("regularMarketDayHigh")
        or info.get("fiftyTwoWeekHigh")
    )
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
            "min_price": min_price,
            "max_price": max_price,
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
            "min_price": min_price,
            "max_price": max_price,
            "pe_ratio": pe_ratio,
            "eps": eps,
            "market_cap": market_cap,
            "intrinsic_value": intrinsic_value,
            "discount_level": round(discount_level, 2),
            "opportunity_score": round(opportunity_score, 1),
        },
        "history": history
    }


def search_stocks(query, max_results=8):
    cleaned_query = (query or "").strip()
    if not cleaned_query:
        return []

    try:
        search = yf.Search(query=cleaned_query, max_results=max_results)
        quotes = search.quotes or []
    except Exception:
        return []

    suggestions = []
    seen_symbols = set()

    for quote in quotes:
        symbol = quote.get("symbol")
        if not symbol or symbol in seen_symbols:
            continue

        quote_type = quote.get("quoteType")
        if quote_type and quote_type != "EQUITY":
            continue

        name = (
            quote.get("shortname")
            or quote.get("longname")
            or quote.get("displayName")
            or symbol
        )
        exchange = quote.get("exchDisp") or quote.get("exchangeDisp") or ""

        suggestions.append({
            "name": name,
            "ticker": symbol,
            "exchange": exchange,
        })
        seen_symbols.add(symbol)

    return suggestions


def refresh_stock_snapshot(stock):
    stock_data = fetch_stock_data(stock.ticker)
    stock.current_price = stock_data.get("current_price")
    stock.min_price = stock_data.get("min_price")
    stock.max_price = stock_data.get("max_price")
    stock.pe_ratio = stock_data.get("pe_ratio")
    stock.eps = stock_data.get("eps")
    stock.market_cap = stock_data.get("market_cap")
    stock.intrinsic_value = stock_data.get("intrinsic_value")
    stock.discount_level = stock_data.get("discount_level")
    stock.opportunity_score = stock_data.get("opportunity_score")
    stock.save(
        update_fields=[
            "current_price",
            "min_price",
            "max_price",
            "pe_ratio",
            "eps",
            "market_cap",
            "intrinsic_value",
            "discount_level",
            "opportunity_score",
            "last_updated",
        ]
    )
    return stock


def refresh_portfolio_stocks(portfolio):
    for stock in portfolio.stocks.all():
        try:
            refresh_stock_snapshot(stock)
        except Exception:
            continue


def fetch_metals_history_3y():
    gold_df = yf.Ticker("GC=F").history(period="3y", interval="1d")
    silver_df = yf.Ticker("SI=F").history(period="3y", interval="1d")

    if gold_df.empty or silver_df.empty:
        raise Exception("Unable to fetch metals history from yfinance")

    gold_prices = {
        idx.strftime("%Y-%m-%d"): round(float(row["Close"]), 2)
        for idx, row in gold_df.iterrows()
        if row.get("Close") is not None
    }
    silver_prices = {
        idx.strftime("%Y-%m-%d"): round(float(row["Close"]), 2)
        for idx, row in silver_df.iterrows()
        if row.get("Close") is not None
    }

    common_dates = sorted(set(gold_prices.keys()) & set(silver_prices.keys()))
    if not common_dates:
        raise Exception("No overlapping history found for gold and silver")

    return [
        {
            "date": date,
            "gold": gold_prices[date],
            "silver": silver_prices[date],
        }
        for date in common_dates
    ]
