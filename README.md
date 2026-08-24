# ⚡ Freqtrade + HyperData Flow Terminal

An institutional-grade **Order Flow, Cumulative Volume Delta (CVD), and Market Regime** algorithmic trading system based on [Freqtrade](https://github.com/freqtrade/freqtrade) and inspired by [HyperData Terminal](https://github.com/Co-Messi/HyperData-Terminal).

---

## 🏛️ Strategy Architecture: 10-Point Quantitative Scoring System

```
                     ┌───────────────────────────┐
                     │    EXCHANGES (Binance)    │
                     │  REST + WebSockets (Futures)│
                     └─────────────┬─────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                   │
                 ▼                                   ▼
        [ Market Data ]                       [ Flow Data ]
        • OHLCV Klines                        • CVD (Cumulative Volume Delta)
        • ATR Volatility                      • Open Interest (OI)
        • Market Structure                    • Funding Rates
                                              • Liquidation Cascades
                                              • Orderbook Imbalance / Depth
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
                 ┌───────────────────────────────────┐
                 │   QUANT FLOW STRATEGY (10-PT)     │
                 │                                   │
                 │  1. Trend / Regime       (+2)     │
                 │  2. Volume Expansion     (+2)     │
                 │  3. CVD Confirmation     (+2)     │
                 │  4. Liquidity Sweep      (+2)     │
                 │  5. OI Behavior          (+1)     │
                 │  6. Funding Confirmation (+1)     │
                 │  ────────────────────────────     │
                 │  Score: 0-4 NO TRADE | 5-6 WEAK   │
                 │         7-8 VALID    | 9-10 STRONG│
                 └─────────────────┬─────────────────┘
                                   ▼
                 ┌───────────────────────────────────┐
                 │       FREQTRADE ENGINE            │
                 │  • Backtest & Hyperopt            │
                 │  • ATR Dynamic Stop Loss & TP     │
                 │  • Risk Management & Margin Guard │
                 │  • Binance Futures Execution      │
                 └─────────────────┬─────────────────┘
```

---

## 📊 10-Point Scoring Breakdown

| Factor | Points | Condition (LONG) | Condition (SHORT) |
|---|---|---|---|
| **Market Regime / Trend** | `+2` | Price > EMA 50 > EMA 200 | Price < EMA 50 < EMA 200 |
| **Volume Expansion** | `+2` | Volume > 1.5x 20-period MA | Volume > 1.5x 20-period MA |
| **CVD Confirmation** | `+2` | CVD Delta > 0 & Expanding | CVD Delta < 0 & Expanding |
| **Liquidity Sweep** | `+2` | Swing Low Sweep + Long Lower Wick (>35%) | Swing High Sweep + Long Upper Wick (>35%) |
| **Open Interest Behavior** | `+1` | Rising OI on Bullish Breakout | Rising OI on Bearish Breakdown |
| **Funding Confirmation** | `+1` | Neutral / Negative Funding Rate | Neutral / Positive Funding Rate |
| **TOTAL** | **10** | | |

### Decision Rules:
- **Score 0-4**: ❌ `NO TRADE`
- **Score 5-6**: ⚠️ `WEAK` (Filter out / Skip)
- **Score 7-8**: 🚀 `VALID` (Standard Risk / Margin)
- **Score 9-10**: 💎 `STRONG` (High Conviction Model)

---

## 🚀 Quick Start

### 1. Configure Environment
Copy `.env.example` to `.env` and enter your Binance API keys:
```bash
cp .env.example .env
```

### 2. Run Backtest with Freqtrade
```bash
freqtrade backtesting --strategy OrderFlowRegimeStrategy --config user_data/config.example.json --timerange 20240101-
```

### 3. Start Live / Dry-run Bot
```bash
freqtrade trade --strategy OrderFlowRegimeStrategy --config user_data/config.example.json
```

### 4. Run HyperData Flow Terminal (Vercel Ready)
```bash
cd hyperdata_terminal
npm install
npm run dev
```

Deploy frontend to **Vercel** with zero configuration using the included `vercel.json`.

---

## 🔒 Security Note
Your `.env` and live configuration files containing API credentials are strictly excluded in `.gitignore` to prevent any exposure.
