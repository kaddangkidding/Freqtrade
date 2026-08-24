"""
HyperData Flow Engine Server & REST API.
Direct Binance Futures live order flow aggregator: CVD, Open Interest, Funding Rate, Liquidations.
"""
import asyncio
import json
import logging
import os
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("flow_engine")

class FlowDataAggregator:
    def __init__(self):
        self.lock = threading.Lock()
        self.symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "DOGEUSDT", "XRPUSDT", "SUIUSDT", "AVAXUSDT"]
        self.market_data: Dict[str, Dict] = {}
        self.last_update = 0

    def fetch_klines(self, symbol: str, interval: str = "5m", limit: int = 50) -> List[Dict]:
        try:
            url = f"https://fapi.binance.com/fapi/v1/klines?symbol={symbol}&interval={interval}&limit={limit}"
            req = urllib.request.Request(url, headers={"User-Agent": "HyperData-Terminal/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                raw = json.loads(resp.read().decode())
                return [{"time": int(k[0]), "open": float(k[1]), "high": float(k[2]), "low": float(k[3]), "close": float(k[4]), "volume": float(k[5])} for k in raw]
        except Exception as e:
            return []

    def fetch_open_interest(self, symbol: str) -> float:
        try:
            url = f"https://fapi.binance.com/fapi/v1/openInterest?symbol={symbol}"
            req = urllib.request.Request(url, headers={"User-Agent": "HyperData-Terminal/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                return float(data.get("openInterest", 0))
        except Exception:
            return 0.0

    def fetch_funding_rate(self, symbol: str) -> float:
        try:
            url = f"https://fapi.binance.com/fapi/v1/premiumIndex?symbol={symbol}"
            req = urllib.request.Request(url, headers={"User-Agent": "HyperData-Terminal/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                return float(data.get("lastFundingRate", 0.0001))
        except Exception:
            return 0.0001

    def compute_metrics(self, symbol: str) -> Optional[Dict]:
        klines = self.fetch_klines(symbol, "5m", 50)
        if len(klines) < 25: return None

        closes = [k["close"] for k in klines]
        volumes = [k["volume"] for k in klines]
        p_now = closes[-1]

        # EMAs
        ema9 = self._calc_ema(closes, 9)
        ema21 = self._calc_ema(closes, 21)
        ema50 = self._calc_ema(closes, 50)
        ema200 = self._calc_ema(closes, 200) if len(closes) >= 200 else ema50

        # Volume Expansion
        vol_avg = sum(volumes[-20:]) / 20.0
        vol_ratio = volumes[-1] / (vol_avg + 1e-9)

        # CVD Calculation
        cvd_series = []
        running_cvd = 0.0
        for k in klines:
            rng = max(1e-9, k["high"] - k["low"])
            buy_v = k["volume"] * ((k["close"] - k["low"]) / rng)
            sell_v = k["volume"] * ((k["high"] - k["close"]) / rng)
            running_cvd += (buy_v - sell_v)
            cvd_series.append(round(running_cvd, 2))

        cvd_delta_5 = cvd_series[-1] - cvd_series[-6] if len(cvd_series) >= 6 else 0

        # Liquidity Sweep
        sw_h = max([k["high"] for k in klines[-21:-1]])
        sw_l = min([k["low"] for k in klines[-21:-1]])
        last_c = klines[-1]
        c_rng = max(1e-9, last_c["high"] - last_c["low"])
        low_wick = min(last_c["open"], last_c["close"]) - last_c["low"]
        up_wick = last_c["high"] - max(last_c["open"], last_c["close"])
        bull_sw = (last_c["low"] < sw_l) and (last_c["close"] > sw_l) and (low_wick / c_rng > 0.30)
        bear_sw = (last_c["high"] > sw_h) and (last_c["close"] < sw_h) and (up_wick / c_rng > 0.30)

        # OI and Funding
        oi = self.fetch_open_interest(symbol)
        funding = self.fetch_funding_rate(symbol)

        # 10-Point Scoring Matrix
        score_long = 0
        if p_now > ema50: score_long += 1
        if ema50 > ema200: score_long += 1
        if vol_ratio >= 1.5: score_long += 2
        elif vol_ratio >= 1.2: score_long += 1
        if cvd_delta_5 > 0: score_long += 1
        if cvd_series[-1] > (sum(cvd_series[-14:]) / 14.0): score_long += 1
        if bull_sw: score_long += 2
        if last_c["close"] > last_c["open"] and vol_ratio > 1.1: score_long += 1
        if funding < 0.0003: score_long += 1

        score_short = 0
        if p_now < ema50: score_short += 1
        if ema50 < ema200: score_short += 1
        if vol_ratio >= 1.5: score_short += 2
        elif vol_ratio >= 1.2: score_short += 1
        if cvd_delta_5 < 0: score_short += 1
        if cvd_series[-1] < (sum(cvd_series[-14:]) / 14.0): score_short += 1
        if bear_sw: score_short += 2
        if last_c["close"] < last_c["open"] and vol_ratio > 1.1: score_short += 1
        if funding > -0.0003: score_short += 1

        if score_long >= 7 and score_long > score_short:
            direction = "LONG"
            score = score_long
        elif score_short >= 7 and score_short > score_long:
            direction = "SHORT"
            score = score_short
        else:
            direction = "NEUTRAL"
            score = max(score_long, score_short)

        rating = "STRONG" if score >= 9 else ("VALID" if score >= 7 else ("WEAK" if score >= 5 else "NO_TRADE"))

        # ATR SL/TP
        atr = sum([max(k["high"] - k["low"], abs(k["high"] - k["close"])) for k in klines[-14:]]) / 14.0
        sl = round(p_now - (atr * 1.5) if direction == "LONG" else p_now + (atr * 1.5), 4)
        tp1 = round(p_now + (atr * 1.0) if direction == "LONG" else p_now - (atr * 1.0), 4)
        tp2 = round(p_now + (atr * 2.0) if direction == "LONG" else p_now - (atr * 2.0), 4)
        tp3 = round(p_now + (atr * 3.5) if direction == "LONG" else p_now - (atr * 3.5), 4)

        return {
            "symbol": symbol,
            "current_price": p_now,
            "direction": direction,
            "total_score": score,
            "rating": rating,
            "score_long": score_long,
            "score_short": score_short,
            "vol_ratio": round(vol_ratio, 2),
            "cvd_trend": "BULLISH" if cvd_delta_5 > 0 else "BEARISH",
            "cvd_delta_5m": round(cvd_delta_5, 2),
            "open_interest": oi,
            "funding_rate": round(funding * 100, 4),
            "bull_sweep": bull_sw,
            "bear_sweep": bear_sw,
            "stop_loss": sl,
            "tp1": tp1,
            "tp2": tp2,
            "tp3": tp3,
            "klines": klines[-20:],
            "cvd_series": cvd_series[-20:],
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    def update_all(self):
        for s in self.symbols:
            m = self.compute_metrics(s)
            if m:
                with self.lock:
                    self.market_data[s] = m
        self.last_update = time.time()

    @staticmethod
    def _calc_ema(data: List[float], span: int) -> float:
        if not data: return 0.0
        k = 2.0 / (span + 1.0)
        ema = data[0]
        for v in data[1:]:
            ema = (v * k) + (ema * (1.0 - k))
        return ema

aggregator = FlowDataAggregator()

def background_loop():
    while True:
        try:
            aggregator.update_all()
        except Exception as e:
            logger.error(f"Scan loop error: {e}")
        time.sleep(6)

class FlowHandler(BaseHTTPRequestHandler):
    def _headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(200)
        self._headers()
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/api/flow/matrix", "/api/flow/overview"):
            with aggregator.lock:
                items = list(aggregator.market_data.values())
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._headers()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "success", "count": len(items), "data": items}).encode())
        elif path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._headers()
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "HyperData-Flow"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

def main(port: int = 8080):
    t = threading.Thread(target=background_loop, daemon=True)
    t.start()
    srv = HTTPServer(("0.0.0.0", port), FlowHandler)
    logger.info(f"HyperData Flow Server listening on port {port}")
    srv.serve_forever()

if __name__ == "__main__":
    main(8080)
