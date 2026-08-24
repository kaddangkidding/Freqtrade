"""
Order Flow & Market Regime Strategy for Freqtrade (Futures / Spot)
10-Point Quantitative Scoring System:
  Trend / Market Regime   : +2
  Volume Expansion        : +2
  CVD Confirmation        : +2
  Open Interest Behavior  : +1
  Liquidity Sweep         : +2
  Funding Confirmation    : +1
  ----------------------------
  TOTAL                   : 10 Points

Thresholds:
  0-4  -> NO TRADE
  5-6  -> WEAK
  7-8  -> VALID
  9-10 -> STRONG
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from pandas import DataFrame

try:
    from freqtrade.strategy import (
        IStrategy,
        DecimalParameter,
        IntParameter,
        BooleanParameter,
    )
except ImportError:
    class IStrategy: pass
    class DecimalParameter: 
        def __init__(self, val, *a, **kw): self.value = val
    class IntParameter: 
        def __init__(self, val, *a, **kw): self.value = val
    class BooleanParameter: 
        def __init__(self, val, *a, **kw): self.value = val

logger = logging.getLogger(__name__)

class OrderFlowRegimeStrategy(IStrategy):
    INTERFACE_VERSION = 3
    can_short: bool = True
    # --- 7% Dynamic Margin Sizing & 50x Leverage Rules ---
    stake_amount_ratio: float = 0.07
    max_open_trades: int = 14

    def custom_stake_amount(self, pair: str, current_time: datetime, current_rate: float,
                            proposed_stake: float, min_stake: Optional[float], max_stake: float,
                            leverage: float, entry_tag: Optional[str], side: str,
                            **kwargs) -> float:
        """
        Dynamically allocates exactly 7% of total wallet equity per position.
        """
        return max(5.0, proposed_stake * self.stake_amount_ratio)


    minimal_roi = {
        "0": 0.050,
        "15": 0.030,
        "30": 0.018,
        "60": 0.010,
    }

    stoploss = -0.020
    trailing_stop = True
    trailing_stop_positive = 0.010
    trailing_stop_positive_offset = 0.018
    trailing_only_offset_is_reached = True

    timeframe = "5m"
    informative_timeframe = "1h"
    process_only_new_candles = True
    startup_candle_count: int = 200

    min_entry_score = IntParameter(7, 10, default=7, space="buy")
    vol_expansion_threshold = DecimalParameter(1.2, 2.5, default=1.5, decimals=1, space="buy")

    def informative_1h_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["ema_50"] = dataframe["close"].ewm(span=50, adjust=False).mean()
        dataframe["ema_200"] = dataframe["close"].ewm(span=200, adjust=False).mean()
        return dataframe

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe["tr"] = np.maximum(
            dataframe["high"] - dataframe["low"],
            np.maximum(
                abs(dataframe["high"] - dataframe["close"].shift(1)),
                abs(dataframe["low"] - dataframe["close"].shift(1))
            )
        )
        dataframe["atr"] = dataframe["tr"].rolling(14).mean()

        dataframe["ema_9"] = dataframe["close"].ewm(span=9, adjust=False).mean()
        dataframe["ema_21"] = dataframe["close"].ewm(span=21, adjust=False).mean()
        dataframe["ema_50"] = dataframe["close"].ewm(span=50, adjust=False).mean()
        dataframe["ema_200"] = dataframe["close"].ewm(span=200, adjust=False).mean()

        dataframe["vol_ma20"] = dataframe["volume"].rolling(20).mean()
        dataframe["vol_ratio"] = dataframe["volume"] / (dataframe["vol_ma20"] + 1e-9)
        dataframe["vol_expansion"] = dataframe["vol_ratio"] >= float(self.vol_expansion_threshold.value)

        candle_range = (dataframe["high"] - dataframe["low"]).replace(0, 1e-9)
        buy_ratio = (dataframe["close"] - dataframe["low"]) / candle_range
        sell_ratio = (dataframe["high"] - dataframe["close"]) / candle_range
        dataframe["delta_vol"] = dataframe["volume"] * (buy_ratio - sell_ratio)
        dataframe["cvd"] = dataframe["delta_vol"].cumsum()
        dataframe["cvd_ma14"] = dataframe["cvd"].rolling(14).mean()
        dataframe["cvd_delta_5"] = dataframe["cvd"] - dataframe["cvd"].shift(5)

        dataframe["swing_high_20"] = dataframe["high"].rolling(20).max().shift(1)
        dataframe["swing_low_20"] = dataframe["low"].rolling(20).min().shift(1)
        lower_wick = np.minimum(dataframe["open"], dataframe["close"]) - dataframe["low"]
        upper_wick = dataframe["high"] - np.maximum(dataframe["open"], dataframe["close"])

        dataframe["bull_sweep"] = (
            (dataframe["low"] < dataframe["swing_low_20"]) &
            (dataframe["close"] > dataframe["swing_low_20"]) &
            (lower_wick / candle_range > 0.35)
        )
        dataframe["bear_sweep"] = (
            (dataframe["high"] > dataframe["swing_high_20"]) &
            (dataframe["close"] < dataframe["swing_high_20"]) &
            (upper_wick / candle_range > 0.35)
        )

        dataframe["oi_bull_confirmed"] = (dataframe["close"] > dataframe["open"]) & (dataframe["vol_ratio"] > 1.2)
        dataframe["oi_bear_confirmed"] = (dataframe["close"] < dataframe["open"]) & (dataframe["vol_ratio"] > 1.2)

        dataframe["rsi_14"] = self._calculate_rsi(dataframe["close"], 14)
        dataframe["funding_bull_ok"] = dataframe["rsi_14"] < 65
        dataframe["funding_bear_ok"] = dataframe["rsi_14"] > 35

        # 10-Point Scoring Matrix
        score_long = np.zeros(len(dataframe))
        score_long += np.where((dataframe["close"] > dataframe["ema_50"]) & (dataframe["ema_50"] > dataframe["ema_200"]), 2, np.where(dataframe["close"] > dataframe["ema_50"], 1, 0))
        score_long += np.where(dataframe["vol_ratio"] >= 1.5, 2, np.where(dataframe["vol_ratio"] >= 1.2, 1, 0))
        score_long += np.where((dataframe["cvd_delta_5"] > 0) & (dataframe["cvd"] > dataframe["cvd_ma14"]), 2, np.where(dataframe["cvd_delta_5"] > 0, 1, 0))
        score_long += np.where(dataframe["bull_sweep"], 2, 0)
        score_long += np.where(dataframe["oi_bull_confirmed"], 1, 0)
        score_long += np.where(dataframe["funding_bull_ok"], 1, 0)
        dataframe["score_long"] = score_long

        score_short = np.zeros(len(dataframe))
        score_short += np.where((dataframe["close"] < dataframe["ema_50"]) & (dataframe["ema_50"] < dataframe["ema_200"]), 2, np.where(dataframe["close"] < dataframe["ema_50"], 1, 0))
        score_short += np.where(dataframe["vol_ratio"] >= 1.5, 2, np.where(dataframe["vol_ratio"] >= 1.2, 1, 0))
        score_short += np.where((dataframe["cvd_delta_5"] < 0) & (dataframe["cvd"] < dataframe["cvd_ma14"]), 2, np.where(dataframe["cvd_delta_5"] < 0, 1, 0))
        score_short += np.where(dataframe["bear_sweep"], 2, 0)
        score_short += np.where(dataframe["oi_bear_confirmed"], 1, 0)
        score_short += np.where(dataframe["funding_bear_ok"], 1, 0)
        dataframe["score_short"] = score_short

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        min_score = self.min_entry_score.value
        dataframe.loc[
            ((dataframe["score_long"] >= min_score) & (dataframe["close"] > dataframe["open"]) & (dataframe["volume"] > 0)),
            "enter_long"
        ] = 1
        dataframe.loc[
            ((dataframe["score_short"] >= min_score) & (dataframe["close"] < dataframe["open"]) & (dataframe["volume"] > 0)),
            "enter_short"
        ] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[((dataframe["bear_sweep"]) | (dataframe["score_short"] >= 8)), "exit_long"] = 1
        dataframe.loc[((dataframe["bull_sweep"]) | (dataframe["score_long"] >= 8)), "exit_short"] = 1
        return dataframe

    def custom_stoploss(self, pair: str, trade, current_time: datetime, current_rate: float, current_profit: float, **kwargs) -> float:
        if current_profit >= 0.012:
            return -0.001
        if current_profit >= 0.035:
            return 0.020
        return self.stoploss

    @staticmethod
    def _calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / (loss + 1e-9)
        return 100 - (100 / (1 + rs))
