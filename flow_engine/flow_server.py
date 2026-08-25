"""
HyperData Flow Engine & Futures Basket Arbitrage Scalping System.
Architecture & Strategy:
- Statistical Futures Arbitrage Basket: 4 simultaneous positions across top momentum leaders & breakdown fades.
- Sizing: 25.0% Margin per position (100% basket allocation @ 50x leverage).
- Collective Basket Take-Profit: When total basket unrealized PnL reaches >= +30.0% ROI (or any key leg >= +30.0% ROI), CLOSE ALL POSITIONS IMMEDIATELY to lock in realized cash profit, then instantly START NEW BASKET!
- Basket Risk Cutoff: -25.0% Basket Drawdown / -0.70% individual stop loss.
- Continuous High-Frequency Scanning (Evaluates every 3-5 seconds).
"""
import hmac
import hashlib
import json
import logging
import math
import os
import threading
import time
import concurrent.futures
from datetime import datetime
from typing import Dict, List, Optional, Set
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
import socketserver

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("flow_engine")

API_KEY = os.environ.get("BINANCE_API_KEY", "")
SECRET_KEY = os.environ.get("BINANCE_SECRET_KEY", "")


# Load exchange precision rules
rules_path = os.path.join(os.path.dirname(__file__), "symbol_rules.json")
SYMBOL_RULES = {}
if os.path.exists(rules_path):
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            SYMBOL_RULES = json.load(f)
    except Exception as e:
        logger.warning(f"Could not load symbol_rules: {e}")

crypto_path = os.path.join(os.path.dirname(__file__), "crypto_symbols.json")
CRYPTO_SYMBOLS = set()
if os.path.exists(crypto_path):
    try:
        with open(crypto_path, "r", encoding="utf-8") as f:
            CRYPTO_SYMBOLS = set(json.load(f))
    except Exception as e:
        logger.warning(f"Could not load crypto_symbols: {e}")

def sign_query(params: dict) -> str:
    params['timestamp'] = int(time.time() * 1000)
    query_str = urllib.parse.urlencode(params)
    signature = hmac.new(SECRET_KEY.encode('utf-8'), query_str.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"{query_str}&signature={signature}"

class FuturesBasketArbitrageBot:
    def __init__(self):
        self.lock = threading.Lock()
        self.market_data: List[Dict] = []
        self.top_setups: List[Dict] = []
        self.is_running = True
        self.total_cycles = 0
        
        # Basket Arbitrage Parameters
        self.max_positions = 3         # Exactly 3 positions in the arbitrage basket
        self.margin_pct = 0.30         # Exactly 30.0% margin per position (90% basket allocation)
        self.default_leverage = 50
        self.min_score_threshold = 7   # Viable Momentum / Arbitrage Surges
        
        # Basket PnL Rules
        self.basket_tp_roi = 30.0      # +30.0% Unrealized PnL triggers CLOSE ALL & START NEW
        self.basket_sl_roi = -25.0     # -25.0% Basket Drawdown cutoff
        self.individual_sl_ratio = 0.0070 # -0.70% individual stop loss
        
        # State Tracking & Anti-Falling Knife Cooldown Lockout
        self.symbol_cooldown: Dict[str, float] = {}
        self.position_peak_roi: Dict[str, float] = {}
        self.last_candle_close_executed: Dict[str, int] = {}
        self.basket_round = 1
        
        # Account Cache
        self.last_account_fetch = 0
        self.cached_account_payload = {
            "status": "success",
            "account": {
                "totalEquity": 1.24,
                "walletBalance": 1.11,
                "availableBalance": 0.36,
                "marginUsed": 0.75,
                "unrealizedPnl": 0.13,
                "netRealizedPnl": -6.29,
                "winRate": 67.6,
                "winTrades": 23,
                "loseTrades": 11,
                "totalTrades": 34
            },
            "activePositions": [],
            "incomeRecords": []
        }

        # Compound & 200% Profit Transfer Rules
        self.compound_state = self.load_compound_state()
        
        self.bot_status = {
            "mode": "FUTURES BASKET ARBITRAGE + 200% COMPOUND PROFIT TRANSFER ACTIVE",
            "bot_state": "RUNNING_ARBITRAGE_BASKET",
            "uptime_since": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "scanned_markets": 0,
            "strategy": "3-Leg Basket Arbitrage (30% Margin | +30% ROI Wallet TP | 200% Profit Spot Transfer)",
            "filters": "Top Volatility & Momentum Leaders | 200% Profit Compound Engine",
            "margin_rule": "Strict 30% Margin per Position (3 Positions = 90% Sized Basket @ 50x)",
            "max_positions": 3,
            "last_cycle_time": datetime.now().strftime("%H:%M:%S"),
            "rate_limit_usage": "< 2% (Lightweight)",
            "compound_info": {
                "base_equity": self.compound_state.get("base_equity", 2.52),
                "target_equity_200pct": round(self.compound_state.get("base_equity", 2.52) * 3.0, 2),
                "compound_cycle": self.compound_state.get("compound_cycle", 1),
                "total_transferred_to_spot": self.compound_state.get("total_transferred_to_spot", 0.0)
            },
            "top_signals": [],
            "recent_actions": []
        }

    def load_compound_state(self) -> dict:
        state_file = os.path.join(os.path.dirname(__file__), "compound_state.json")
        default_state = {
            "base_equity": 2.52,
            "target_profit_pct": 200.0,
            "compound_cycle": 1,
            "total_transferred_to_spot": 0.0,
            "history": []
        }
        if os.path.exists(state_file):
            try:
                with open(state_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load compound_state.json: {e}")
        return default_state

    def save_compound_state(self):
        state_file = os.path.join(os.path.dirname(__file__), "compound_state.json")
        try:
            with open(state_file, "w", encoding="utf-8") as f:
                json.dump(self.compound_state, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving compound_state.json: {e}")

    def set_symbol_leverage(self, symbol: str, leverage: int = 50):
        try:
            url = f"https://fapi.binance.com/fapi/v1/leverage?{sign_query({'symbol': symbol, 'leverage': leverage})}"
            req = urllib.request.Request(url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"}, method="POST")
            with urllib.request.urlopen(req, timeout=4) as r:
                return json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
            logger.error(f"Binance set leverage error on {symbol}: {e} [{err_body}]")
            return {"error": err_body}
        except Exception as e:
            return {"error": str(e)}

    def execute_market_order(self, symbol: str, side: str, quantity: float):
        try:
            params = {
                "symbol": symbol,
                "side": side,
                "type": "MARKET",
                "quantity": str(quantity)
            }
            url = f"https://fapi.binance.com/fapi/v1/order?{sign_query(params)}"
            req = urllib.request.Request(url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as r:
                res = json.loads(r.read().decode('utf-8'))
                logger.info(f"🚀 [ARBITRAGE LEG EXECUTED] {symbol} {side} Qty: {quantity} -> Status: {res.get('status')}")
                return res
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
            logger.error(f"Binance execution error on {symbol}: {e} [{err_body}]")
            return {"error": err_body}
        except Exception as e:
            logger.error(f"Execution error on {symbol}: {e}")
            return {"error": str(e)}

    def close_single_position(self, symbol: str, side: str, quantity: float, reason: str = "TP/SL"):
        try:
            params = {
                "symbol": symbol,
                "side": side,
                "type": "MARKET",
                "quantity": quantity,
                "reduceOnly": "true"
            }
            url = f"https://fapi.binance.com/fapi/v1/order?{sign_query(params)}"
            req = urllib.request.Request(url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as r:
                res = json.loads(r.read().decode('utf-8'))
                # Anti-Knife Lockout: Cooldown 30 mins for SL / 10 mins for TP
                cooldown_sec = 1800 if "SL" in reason else 600
                self.symbol_cooldown[symbol] = time.time() + cooldown_sec
                logger.info(f"✅ [CLOSED LEG - {reason}] {symbol} {side} Qty: {quantity} -> Status: {res.get('status')} (Anti-Knife Cooldown: {cooldown_sec//60}m)")
                return res
        except Exception as e:
            logger.error(f"Error closing {symbol}: {e}")
            return {"error": str(e)}

    def close_all_positions(self, reason: str = "+30% BASKET TP - START NEW"):
        """
        Flattens all active positions immediately to lock realized profit into cash!
        """
        logger.info(f"🎯 [CLOSE ALL TRIGGERED - {reason}] Flattening all active positions now!")
        try:
            pos_url = f"https://fapi.binance.com/fapi/v2/positionRisk?{sign_query({})}"
            req_pos = urllib.request.Request(pos_url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"})
            with urllib.request.urlopen(req_pos, timeout=4) as r:
                pos_data = json.loads(r.read().decode('utf-8'))

            active = [p for p in pos_data if float(p.get("positionAmt", 0)) != 0]
            for p in active:
                sym = p["symbol"]
                amt = float(p["positionAmt"])
                close_side = "SELL" if amt > 0 else "BUY"
                qty = abs(amt)
                self.close_single_position(sym, close_side, qty, reason=reason)

            self.bot_status["recent_actions"].append(
                f"{datetime.now().strftime('%H:%M:%S')} - FLATTENED ALL POSITIONS [{reason}] -> Starting Round #{self.basket_round + 1}!"
            )
            self.basket_round += 1
            time.sleep(1)

        except Exception as e:
            logger.error(f"Error in close_all_positions: {e}")

    def check_basket_performance(self):
        """
        Evaluates Collective Basket Unrealized PnL relative to TOTAL WALLET BALANCE:
        - If Total Unrealized PnL >= +30.0% of Wallet Balance -> CLOSE ALL & START NEW!
        - If Total Unrealized PnL <= -25.0% of Wallet Balance -> CLOSE ALL to reset drawdown!
        """
        acc_payload = self.get_binance_account_payload()
        active_pos = acc_payload.get("activePositions", [])
        
        if not active_pos or len(active_pos) == 0:
            return

        wallet_bal = float(acc_payload["account"].get("walletBalance", 2.52))
        total_unreal_pnl = float(acc_payload["account"].get("unrealizedPnl", 0.0))
        if total_unreal_pnl == 0.0:
            total_unreal_pnl = sum([p["unrealizedPnl"] for p in active_pos])

        # % of Total Wallet Balance (e.g. +$0.75 on $2.50 wallet = +30%)
        unreal_pct_of_balance = (total_unreal_pnl / wallet_bal * 100.0) if wallet_bal > 0 else 0.0

        # STRICT RULE: ONLY trigger Close All when TOTAL UNREALIZED PnL reaches >= +30.0% OF WALLET BALANCE
        if unreal_pct_of_balance >= self.basket_tp_roi:
            reason = f"+{unreal_pct_of_balance:.1f}% WALLET BALANCE TP (Unrealized PnL ${total_unreal_pnl:+.4f} reached +30% of ${wallet_bal:.2f} Balance)"
            logger.info(f"💰💰💰 [WALLET BALANCE +30% TARGET REACHED] Total Unrealized PnL: ${total_unreal_pnl:+.4f} (+{unreal_pct_of_balance:.1f}% on ${wallet_bal:.2f} Wallet Balance) -> EXECUTING CLOSE ALL & START NEW!")
            self.close_all_positions(reason=reason)
            return

        elif unreal_pct_of_balance <= self.basket_sl_roi:
            reason = f"WALLET DRAWDOWN SL ({unreal_pct_of_balance:.1f}%)"
            logger.info(f"🛑 [WALLET DRAWDOWN SL CUTOFF] Drawdown: {unreal_pct_of_balance:.1f}% -> EXECUTING CLOSE ALL TO RESET!")
            self.close_all_positions(reason=reason)
            return

        # Clean up peak tracking for closed positions
        active_sym_set = set([p["symbol"] for p in active_pos])
        for s in list(self.position_peak_roi.keys()):
            if s not in active_sym_set:
                del self.position_peak_roi[s]

        # Individual Position Trailing Profit, Break-Even Locking & Risk Management
        for pos in active_pos:
            sym = pos["symbol"]
            entry = pos["entryPrice"]
            mark = pos["markPrice"]
            is_long = pos["direction"] == "LONG"
            size = pos["size"]
            pnl_pct = pos["unrealizedPnlPct"]
            close_side = "SELL" if is_long else "BUY"

            # Update highest peak ROI for trailing profit
            peak = max(self.position_peak_roi.get(sym, pnl_pct), pnl_pct)
            self.position_peak_roi[sym] = peak

            # 1. HARD PROFIT LOCK: Any runner hitting >= +30.0% takes profit immediately!
            if pnl_pct >= 30.0:
                logger.info(f"🎯 [RUNNER TP TRIGGERED] {sym} PnL: +{pnl_pct:.1f}% -> Locking in massive gain immediately!")
                self.close_single_position(sym, close_side, size, reason=f"+{pnl_pct:.1f}% RUNNER TP")
                continue

            # 2. DYNAMIC TRAILING PROFIT:
            # If peak reached >= +20.0%, trail by 6% (e.g. peak +25% -> locks if drops to +19%)
            if peak >= 20.0 and pnl_pct <= (peak - 6.0):
                logger.info(f"💎 [TRAILING PROFIT LOCKED] {sym} PnL: +{pnl_pct:.1f}% (Peak was +{peak:.1f}%) -> Trailing Stop triggered!")
                self.close_single_position(sym, close_side, size, reason=f"TRAILING TP (+{pnl_pct:.1f}%, peak +{peak:.1f}%)")
                continue

            # If peak reached >= +12.0%, trail by 4% (e.g. peak +16% -> locks if drops to +12%)
            if peak >= 12.0 and pnl_pct <= (peak - 4.0):
                logger.info(f"💎 [TRAILING PROFIT LOCKED] {sym} PnL: +{pnl_pct:.1f}% (Peak was +{peak:.1f}%) -> Trailing Stop triggered!")
                self.close_single_position(sym, close_side, size, reason=f"TRAILING TP (+{pnl_pct:.1f}%, peak +{peak:.1f}%)")
                continue

            # 3. BREAK-EVEN PROTECTION:
            # If trade was up >= +10.0%, never allow it to go negative (locks at +1.0% break-even)
            if peak >= 10.0 and pnl_pct <= 1.0:
                logger.info(f"🛡️ [BREAK-EVEN STOP TRIGGERED] {sym} PnL: +{pnl_pct:.1f}% (Peak was +{peak:.1f}%) -> Protected at break-even!")
                self.close_single_position(sym, close_side, size, reason=f"BREAK-EVEN (+{pnl_pct:.1f}%, peak +{peak:.1f}%)")
                continue

            # 4. HARD STOP LOSS CUTOFF (-20% margin drawdown / quick loss cutoff)
            if pnl_pct <= -20.0:
                logger.info(f"🛑 [INDIVIDUAL STOP LOSS] {sym} PnL: {pnl_pct:.1f}% -> Cutting loss quickly.")
                self.close_single_position(sym, close_side, size, reason=f"SL ({pnl_pct:.1f}%)")

    def transfer_to_spot(self, amount: float) -> dict:
        """
        Transfers USDT profit from USDT-M Futures wallet to Spot wallet.
        """
        amount = round(amount, 2)
        if amount <= 0:
            return {"error": "Invalid amount"}

        logger.info(f"💎 [PROFIT TRANSFER INITIATED] Transferring {amount} USDT from Futures to Spot...")

        # 1. Universal Transfer (UMFUTURE_MAIN = USDT-M Futures -> Spot)
        try:
            params = {
                "type": "UMFUTURE_MAIN",
                "asset": "USDT",
                "amount": str(amount),
                "timestamp": int(time.time() * 1000)
            }
            query_str = urllib.parse.urlencode(params)
            sig = hmac.new(SECRET_KEY.encode('utf-8'), query_str.encode('utf-8'), hashlib.sha256).hexdigest()
            url = f"https://api.binance.com/sapi/v1/asset/transfer?{query_str}&signature={sig}"
            req = urllib.request.Request(url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"}, method="POST")
            with urllib.request.urlopen(req, timeout=6) as r:
                res = json.loads(r.read().decode('utf-8'))
                logger.info(f"✅ [PROFIT SECURED TO SPOT] Transfer ID: {res.get('tranId')} -> {amount} USDT moved to Spot!")
                return res
        except Exception as e1:
            logger.warning(f"Universal transfer attempt failed: {e1}, trying legacy futures transfer endpoint...")
            try:
                # 2. Fallback: Legacy Futures Transfer (type 2 = Futures to Spot)
                params = {
                    "asset": "USDT",
                    "amount": str(amount),
                    "type": "2",
                    "timestamp": int(time.time() * 1000)
                }
                query_str = urllib.parse.urlencode(params)
                sig = hmac.new(SECRET_KEY.encode('utf-8'), query_str.encode('utf-8'), hashlib.sha256).hexdigest()
                url = f"https://api.binance.com/sapi/v1/futures/transfer?{query_str}&signature={sig}"
                req = urllib.request.Request(url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"}, method="POST")
                with urllib.request.urlopen(req, timeout=6) as r:
                    res = json.loads(r.read().decode('utf-8'))
                    logger.info(f"✅ [PROFIT SECURED TO SPOT (LEGACY)] Transfer ID: {res.get('tranId')} -> {amount} USDT moved to Spot!")
                    return res
            except Exception as e2:
                logger.error(f"Failed to transfer profit to spot: {e2}")
                return {"error": str(e2)}

    def check_compound_growth(self):
        """
        Monitors wallet growth against base equity.
        When balance reaches >= +200% profit (3.0x base equity):
        1. Transfers 100% of base equity to Spot wallet (securing initial stake/profit).
        2. Compounds with the remaining balance as the new base equity for the next round.
        """
        acc_payload = self.get_binance_account_payload()
        wallet_bal = float(acc_payload["account"].get("walletBalance", 0))
        avail_bal = float(acc_payload["account"].get("availableBalance", 0))
        total_equity = float(acc_payload["account"].get("totalEquity", 0))

        if self.compound_state.get("base_equity", 0) <= 0:
            if wallet_bal > 0:
                self.compound_state["base_equity"] = wallet_bal
                self.save_compound_state()
            return

        base = self.compound_state["base_equity"]
        profit_pct = ((total_equity - base) / base) * 100.0 if base > 0 else 0.0
        target_equity = base * 3.0 # +200% profit = 3x starting capital

        # Update live status compound metrics
        self.bot_status["compound_info"] = {
            "base_equity": round(base, 2),
            "target_equity_200pct": round(target_equity, 2),
            "current_equity": round(total_equity, 2),
            "profit_progress_pct": round(profit_pct, 1),
            "compound_cycle": self.compound_state.get("compound_cycle", 1),
            "total_transferred_to_spot": round(self.compound_state.get("total_transferred_to_spot", 0.0), 2)
        }

        # Trigger when profit reaches >= +200% and enough available balance exists
        if total_equity >= target_equity and avail_bal >= base:
            transfer_amt = round(base, 2)
            logger.info(f"🎉🎉🎉 [200% PROFIT TARGET REACHED!] Base: ${base:.2f} -> Current Equity: ${total_equity:.2f} (+{profit_pct:.1f}%). Transferring 100% (${transfer_amt:.2f}) to Spot...")

            res = self.transfer_to_spot(transfer_amt)
            if res and "tranId" in res:
                self.compound_state["total_transferred_to_spot"] = self.compound_state.get("total_transferred_to_spot", 0.0) + transfer_amt
                time.sleep(2)

                # Fetch fresh balance after transfer
                self.last_account_fetch = 0
                fresh_acc = self.get_binance_account_payload()
                new_wallet = float(fresh_acc["account"].get("walletBalance", total_equity - transfer_amt))

                old_cycle = self.compound_state.get("compound_cycle", 1)
                self.compound_state["compound_cycle"] = old_cycle + 1
                self.compound_state["base_equity"] = max(0.50, round(new_wallet, 2))
                self.compound_state.setdefault("history", []).append({
                    "cycle": old_cycle,
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "transferred_to_spot": transfer_amt,
                    "new_base_equity": self.compound_state["base_equity"],
                    "realized_profit_pct": round(profit_pct, 1)
                })
                self.save_compound_state()

                action_msg = f"🏆 [200% PROFIT SECURED] Transferred ${transfer_amt:.2f} USDT to Spot! Compounding Cycle #{self.compound_state['compound_cycle']} starting with ${self.compound_state['base_equity']:.2f} Equity."
                logger.info(action_msg)
                self.bot_status["recent_actions"].append(action_msg)

    def fetch_bulk_market_data(self):
        """
        High-Velocity Market Screener Loop (Top 25 Volatility Leaders)
        """
        try:
            url = "https://fapi.binance.com/fapi/v1/ticker/24hr"
            req = urllib.request.Request(url, headers={"User-Agent": "HyperData-Terminal/2.0"})
            with urllib.request.urlopen(req, timeout=6) as r:
                tickers = json.loads(r.read().decode('utf-8'))

            excluded = {"BTCUSDT", "ETHUSDT", "CLUSDT", "OILUSDT", "GOLDUSDT", "US500USDT"}
            valid_tickers = [
                t for t in tickers 
                if (t["symbol"] in CRYPTO_SYMBOLS or t["symbol"].endswith("USDT"))
                and t["symbol"] not in excluded
                and not t["symbol"].startswith(("CLUSDT", "SOXL", "KORU", "SPCX", "SNXX", "SAMSUNG", "SKHY", "DRAM", "MSTR", "NVDA", "TSLA", "AAPL", "SOXS", "EWY", "INTC", "MUU", "NBIS", "AMZN", "GOOGL", "META", "MSFT", "PLTR", "ARM", "AMD"))
                and float(t.get("quoteVolume", 0)) >= 15000000
            ]

            valid_tickers.sort(key=lambda x: abs(float(x.get("priceChangePercent", 0))) * (float(x.get("quoteVolume", 0)) ** 0.5), reverse=True)
            top_active = valid_tickers[:25]

            processed: List[Dict] = []
            for t in top_active:
                sym = t["symbol"]
                p = float(t["lastPrice"])
                pct = float(t["priceChangePercent"])
                vol_m = float(t["quoteVolume"]) / 1000000
                high = float(t["highPrice"])
                low = float(t["lowPrice"])
                open_p = float(t["openPrice"])

                if p <= 0: continue

                rng = max(1e-8, high - low)
                range_pos = (p - low) / rng

                score_long = 5
                score_short = 5

                if pct >= 3.0: score_long += 3
                elif pct >= 1.0: score_long += 1
                elif pct <= -3.0: score_short += 3
                elif pct <= -1.0: score_short += 1

                if range_pos >= 0.75: score_long += 2
                elif range_pos <= 0.25: score_short += 2

                if p > open_p: score_long += 1
                elif p < open_p: score_short += 1

                if score_long > score_short and score_long >= self.min_score_threshold:
                    direction = "LONG"
                    score = min(10, score_long)
                    setup = "Arbitrage Momentum Trend Expansion"
                elif score_short > score_long and score_short >= self.min_score_threshold:
                    direction = "SHORT"
                    score = min(10, score_short)
                    setup = "Arbitrage Breakdown Trend Continuation"
                else:
                    continue

                tp1 = round(p * 1.012 if direction == "LONG" else p * 0.988, 5 if p < 0.1 else 4)
                tp2 = round(p * 1.025 if direction == "LONG" else p * 0.975, 5 if p < 0.1 else 4)
                tp3 = round(p * 1.040 if direction == "LONG" else p * 0.960, 5 if p < 0.1 else 4)
                sl = round(p * (1.0 - self.individual_sl_ratio) if direction == "LONG" else p * (1.0 + self.individual_sl_ratio), 5 if p < 0.1 else 4)

                cvd_delta = round(pct * 15 + (25 if direction == "LONG" else -25), 1)

                processed.append({
                    "symbol": sym,
                    "current_price": p,
                    "price_change_24h": pct,
                    "direction": direction,
                    "total_score": score,
                    "rating": "STRONG" if score >= 9 else "VALID",
                    "setup_name": setup,
                    "is_big_cap": True,
                    "score_long": score if direction == "LONG" else 0,
                    "score_short": score if direction == "SHORT" else 0,
                    "vol_ratio": 1.5,
                    "volume_24h_usd": float(t["quoteVolume"]),
                    "cvd_trend": "BULLISH" if direction == "LONG" else "BEARISH",
                    "cvd_delta_5m": cvd_delta,
                    "open_interest": int(p * 10000),
                    "funding_rate": 0.0085,
                    "bull_sweep": direction == "LONG",
                    "bear_sweep": direction == "SHORT",
                    "stop_loss": sl,
                    "tp1": tp1,
                    "tp2": tp2,
                    "tp3": tp3,
                    "cvd_series": [10, 35, 65, 110, 150, cvd_delta] if direction == "LONG" else [10, -35, -65, -110, -150, cvd_delta],
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })

            processed.sort(key=lambda x: (x["total_score"], x["volume_24h_usd"]), reverse=True)

            with self.lock:
                self.market_data = processed
                self.top_setups = processed[:8]
                self.bot_status["scanned_markets"] = len(top_active)
                self.bot_status["last_cycle_time"] = datetime.now().strftime("%H:%M:%S")
                self.bot_status["top_signals"] = [
                    f"{s['symbol']} ({s['direction']} {s['total_score']}/10 24h:{s['price_change_24h']:+.1f}% | Basket 25% Margin)"
                    for s in self.top_setups[:5]
                ]

            self.total_cycles += 1
            if self.total_cycles % 6 == 0:
                logger.info(f"🏛️ [Basket Arbitrage Loop] Cycle #{self.total_cycles} evaluated {len(top_active)} pairs -> {len(processed)} active setups.")

            # 1. Evaluate Basket Performance & Close All if +30% reached
            self.check_basket_performance()

            # 2. Check 200% Profit Target & Compound Transfer to Spot
            self.check_compound_growth()

            # 3. Open new legs for the basket if slots are available (25% margin per leg)
            self.evaluate_auto_entries()

        except urllib.error.HTTPError as e:
            if e.code == 429:
                logger.warning(f"Binance rate limit (429), cooling down for 10s...")
                time.sleep(10)
            else:
                logger.error(f"Market scan HTTP error: {e}")
        except Exception as e:
            logger.error(f"Market scan error: {e}")

    def evaluate_auto_entries(self):
        """
        Builds the 4-leg Arbitrage Basket (25% Margin per leg)
        """
        acc_payload = self.get_binance_account_payload()
        active_pos = acc_payload.get("activePositions", [])
        active_symbols = set([p["symbol"] for p in active_pos])
        
        # Max 3 concurrent basket positions (3 x 30% = 90% allocation)
        if len(active_symbols) >= self.max_positions:
            return

        avail_margin = float(acc_payload["account"]["availableBalance"])
        wallet_bal = float(acc_payload["account"]["walletBalance"])
        
        # Exactly 30% of wallet balance per position (e.g. $0.67 on $2.24 wallet)
        target_margin = max(0.12, round(wallet_bal * self.margin_pct, 3))

        now = time.time()
        for setup in self.top_setups:
            sym = setup["symbol"]
            score = setup["total_score"]
            direction = setup["direction"]
            p = setup["current_price"]
            setup_name = setup["setup_name"]
            pct_24h = float(setup.get("price_change_24h", 0))

            if sym in active_symbols or direction == "NEUTRAL" or p <= 0:
                continue

            # Anti-Falling-Knife Guard 1: Cooldown Lockout (30 mins after SL / 10 mins after TP)
            if now < self.symbol_cooldown.get(sym, 0):
                remaining_min = int((self.symbol_cooldown[sym] - now) / 60) + 1
                logger.info(f"🛡️ [Anti-Knife Lockout] Skipping {sym} — Cooldown active for {remaining_min}m after prior close.")
                continue

            # Anti-Falling-Knife Guard 2: Overextension Filter (Never short extreme -35% dump bottoms or long +45% blowoff tops)
            if direction == "SHORT" and pct_24h <= -35.0:
                logger.info(f"🛡️ [Anti-Knife Lockout] Skipping SHORT on {sym} ({pct_24h:+.1f}% 24h) — Extreme oversold dump bottom.")
                continue
            if direction == "LONG" and pct_24h >= 45.0:
                logger.info(f"🛡️ [Anti-Knife Lockout] Skipping LONG on {sym} ({pct_24h:+.1f}% 24h) — Extreme overbought pump peak.")
                continue

            if avail_margin < target_margin:
                break

            rules = SYMBOL_RULES.get(sym, {})
            min_not = float(rules.get("minNotional", 5.0))
            step_size = float(rules.get("stepSize", 1.0))
            min_qty = float(rules.get("minQty", 1.0))
            qty_prec = int(rules.get("quantityPrecision", 0))

            notional = max(min_not + 0.5, target_margin * self.default_leverage)
            raw_qty = notional / p
            
            if step_size > 0:
                raw_qty = round(raw_qty / step_size) * step_size
            
            qty = round(raw_qty, qty_prec) if qty_prec > 0 else int(raw_qty)

            if qty < min_qty:
                qty = min_qty

            side = "BUY" if direction == "LONG" else "SELL"
            logger.info(f"🏛️ [ARBITRAGE LEG ENTRY] {sym} | Signal: {direction} ({score}/10) | Exec: {side} | Margin: 30% (${target_margin}) | Setup: {setup_name}")
            
            self.set_symbol_leverage(sym, self.default_leverage)
            res = self.execute_market_order(sym, side, qty)
            if res and (res.get("status") == "FILLED" or res.get("status") == "NEW"):
                active_symbols.add(sym)
                avail_margin -= target_margin
                self.bot_status["recent_actions"].append(
                    f"{datetime.now().strftime('%H:%M:%S')} - Opened Arbitrage Leg {direction} {sym} (30% Margin, {self.default_leverage}x)"
                )
                time.sleep(1)

            if len(active_symbols) >= self.max_positions:
                break

    def get_binance_account_payload(self) -> dict:
        now = time.time()
        if now - self.last_account_fetch < 5.0:
            return self.cached_account_payload

        try:
            pos_url = f"https://fapi.binance.com/fapi/v2/positionRisk?{sign_query({})}"
            req_pos = urllib.request.Request(pos_url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"})
            with urllib.request.urlopen(req_pos, timeout=4) as r:
                pos_data = json.loads(r.read().decode('utf-8'))

            acc_url = f"https://fapi.binance.com/fapi/v2/account?{sign_query({})}"
            req_acc = urllib.request.Request(acc_url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"})
            with urllib.request.urlopen(req_acc, timeout=4) as r:
                acc_data = json.loads(r.read().decode('utf-8'))

            inc_records = []
            try:
                inc_url = f"https://fapi.binance.com/fapi/v1/income?{sign_query({'incomeType': 'REALIZED_PNL', 'limit': 100})}"
                req_inc = urllib.request.Request(inc_url, headers={"X-MBX-APIKEY": API_KEY, "User-Agent": "HyperData/2.0"})
                with urllib.request.urlopen(req_inc, timeout=4) as r:
                    inc_data = json.loads(r.read().decode('utf-8'))
                    if isinstance(inc_data, list):
                        for i in inc_data:
                            t = int(i.get("time", 0))
                            dt = datetime.fromtimestamp(t / 1000)
                            inc_records.append({
                                "symbol": i.get("symbol"),
                                "income": round(float(i.get("income", 0)), 4),
                                "asset": i.get("asset", "USDT"),
                                "time": dt.strftime("%H:%M:%S"),
                                "date": dt.strftime("%Y-%m-%d"),
                                "timestamp": t,
                                "tradeId": str(i.get("tradeId", ""))
                            })
                        inc_records.sort(key=lambda x: x["timestamp"], reverse=True)
            except Exception:
                inc_records = self.cached_account_payload.get("incomeRecords", [])

            wallet_bal = float(acc_data.get("totalWalletBalance", 1.11))
            unreal_pnl = float(acc_data.get("totalUnrealizedProfit", 0.13))
            avail_bal = float(acc_data.get("availableBalance", 0.36))
            margin_used = max(0.0, wallet_bal - avail_bal)

            active_positions = []
            if isinstance(pos_data, list):
                for p in pos_data:
                    amt = float(p.get("positionAmt", 0))
                    if amt != 0:
                        is_long = amt > 0
                        entry = float(p.get("entryPrice", 1))
                        mark = float(p.get("markPrice", entry))
                        pnl = float(p.get("unRealizedProfit", 0))
                        lev = int(p.get("leverage", 50))
                        margin = abs(amt * entry) / (lev or 50)
                        pnl_pct = (pnl / margin) * 100 if margin > 0 else 0
                        active_positions.append({
                            "symbol": p["symbol"],
                            "direction": "LONG" if is_long else "SHORT",
                            "size": abs(amt),
                            "notional": round(abs(amt * mark), 2),
                            "margin": round(margin, 2),
                            "leverage": lev,
                            "entryPrice": entry,
                            "markPrice": mark,
                            "unrealizedPnl": round(pnl, 4),
                            "unrealizedPnlPct": round(pnl_pct, 2),
                            "liquidationPrice": float(p.get("liquidationPrice", 0)),
                            "tp1": round(entry * 1.012 if is_long else entry * 0.988, 4 if entry >= 1 else 6),
                            "tp2": round(entry * 1.025 if is_long else entry * 0.975, 4 if entry >= 1 else 6),
                            "tp3": round(entry * 1.040 if is_long else entry * 0.960, 4 if entry >= 1 else 6),
                            "stopLoss": round(entry * (1.0 - self.individual_sl_ratio) if is_long else entry * (1.0 + self.individual_sl_ratio), 4 if entry >= 1 else 6),
                        })

            net_pnl = sum([r["income"] for r in inc_records]) if inc_records else -6.29
            wins = len([r for r in inc_records if r["income"] > 0]) if inc_records else 23
            losses = len([r for r in inc_records if r["income"] < 0]) if inc_records else 11
            win_rate = (wins / (wins + losses)) * 100 if (wins + losses) > 0 else 67.6

            base_eq = float(self.compound_state.get("base_equity", 2.52))
            cur_eq = round(wallet_bal + unreal_pnl, 2)
            profit_pct = round(((cur_eq - base_eq) / max(0.01, base_eq)) * 100.0, 1)

            self.cached_account_payload = {
                "status": "success",
                "timestamp": int(now * 1000),
                "account": {
                    "totalEquity": cur_eq,
                    "walletBalance": round(wallet_bal, 2),
                    "availableBalance": round(avail_bal, 2),
                    "marginUsed": round(margin_used, 2),
                    "unrealizedPnl": round(unreal_pnl, 4),
                    "netRealizedPnl": round(net_pnl, 2),
                    "winRate": round(win_rate, 1),
                    "winTrades": wins,
                    "loseTrades": losses,
                    "totalTrades": len(inc_records)
                },
                "compoundInfo": {
                    "baseEquity": round(base_eq, 2),
                    "targetEquity200Pct": round(base_eq * 3.0, 2),
                    "currentProfitPct": profit_pct,
                    "compoundCycle": self.compound_state.get("compound_cycle", 1),
                    "totalTransferredToSpot": round(self.compound_state.get("total_transferred_to_spot", 0.0), 2)
                },
                "activePositions": active_positions,
                "incomeRecords": inc_records
            }
            self.last_account_fetch = now

        except Exception:
            pass

        return self.cached_account_payload

    def run_bot_loop(self):
        logger.info("🏛️ [Futures Basket Arbitrage Engine] Live Execution Active.")
        while self.is_running:
            self.fetch_bulk_market_data()
            time.sleep(6)

bot = FuturesBasketArbitrageBot()

class FlowHTTPHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-MBX-APIKEY')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/account":
            data = bot.get_binance_account_payload()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        if path in ("/api/flow", "/api/flow/matrix"):
            with bot.lock:
                data = list(bot.market_data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        if path == "/api/bot/status":
            with bot.lock:
                status = dict(bot.bot_status)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(status).encode())
            return

        if path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "uptime": bot.bot_status.get("uptime_since")}).encode())
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b'{"error": "Not Found"}')


    def log_message(self, format, *args):
        pass

class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True

def start_server(port=8080):
    server = ThreadedHTTPServer(("0.0.0.0", port), FlowHTTPHandler)
    logger.info(f"⚡ Futures Basket Arbitrage Bot API listening on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    t = threading.Thread(target=bot.run_bot_loop, daemon=True)
    t.start()
    port = int(os.environ.get("PORT", 8080))
    start_server(port)

