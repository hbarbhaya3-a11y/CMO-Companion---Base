from fastapi import APIRouter
import logging
import time
import requests
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/market", tags=["market"])

EST = timezone(timedelta(hours=-5))
def _est_now():
    return datetime.now(EST)

_cache = {"data": None, "ts": 0}
CACHE_TTL = 300  # 5 minutes

STATIC_FALLBACK = {
    "symbol": "UPS",
    "exchange": "NYSE",
    "price": 98.52,
    "change_pct": -1.23,
    "prev_close": 99.74,
    "trade_date": _est_now().strftime("%d %b, 4:00 PM EST").lstrip("0"),
}


def _fetch_yahoo_v8():
    url = "https://query1.finance.yahoo.com/v8/finance/chart/UPS"
    params = {"range": "1d", "interval": "1d", "includePrePost": "false"}
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    data = r.json()
    meta = data["chart"]["result"][0]["meta"]
    price = round(meta["regularMarketPrice"], 2)
    prev_close = round(meta["chartPreviousClose"], 2)
    change_pct = round(((price - prev_close) / prev_close) * 100, 2)
    trade_ts = meta.get("regularMarketTime", 0)
    if trade_ts:
        dt = datetime.fromtimestamp(trade_ts, tz=EST)
        trade_date = dt.strftime("%d %b, %#I:%M %p EST").lstrip("0")
    else:
        trade_date = _est_now().strftime("%d %b, %#I:%M %p EST").lstrip("0")
    return {
        "symbol": "UPS",
        "exchange": "NYSE",
        "price": price,
        "change_pct": change_pct,
        "prev_close": prev_close,
        "trade_date": trade_date,
    }


def _fetch_google_finance():
    url = "https://www.google.com/finance/quote/UPS:NYSE"
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers, timeout=10)
    r.raise_for_status()
    import re
    match = re.search(r'data-last-price="([\d.]+)"', r.text)
    prev_match = re.search(r'data-previous-close="([\d.]+)"', r.text)
    if match:
        price = round(float(match.group(1)), 2)
        prev_close = round(float(prev_match.group(1)), 2) if prev_match else price
        change_pct = round(((price - prev_close) / prev_close) * 100, 2) if prev_close else 0
        return {
            "symbol": "UPS",
            "exchange": "NYSE",
            "price": price,
            "change_pct": change_pct,
            "prev_close": prev_close,
            "trade_date": _est_now().strftime("%d %b, 4:00 PM EST").lstrip("0"),
        }
    raise ValueError("Could not parse Google Finance page")


@router.get("/ticker")
def get_ups_ticker():
    now = time.time()

    if _cache["data"] and (now - _cache["ts"]) < CACHE_TTL:
        return _cache["data"]

    for fetcher, name in [(_fetch_yahoo_v8, "Yahoo v8"), (_fetch_google_finance, "Google Finance")]:
        try:
            result = fetcher()
            _cache["data"] = result
            _cache["ts"] = now
            logger.info(f"Ticker fetched via {name}: ${result['price']}")
            return result
        except Exception as e:
            logger.warning(f"{name} failed: {e}")

    logger.error("All ticker sources failed, using static fallback")
    return STATIC_FALLBACK
