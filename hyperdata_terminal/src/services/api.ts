import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from '../types/flow';

export const DEFAULT_ACCOUNT: AccountPortfolio = {
  totalEquity: 2.29,
  walletBalance: 2.30,
  availableBalance: 1.84,
  marginUsed: 0.46,
  unrealizedPnl: -0.01,
  netRealizedPnl: -1.15,
  winRate: 45.0,
  winTrades: 45,
  loseTrades: 55,
  totalTrades: 100,
};

export const DEFAULT_POSITIONS: ActivePosition[] = [
  {
    symbol: 'SUIUSDT',
    direction: 'LONG',
    size: 7.0,
    notional: 5.68,
    margin: 0.11,
    leverage: 50,
    entryPrice: 0.8119,
    markPrice: 0.8121,
    unrealizedPnl: 0.0012,
    unrealizedPnlPct: 1.09,
    liquidationPrice: 0.7960,
    tp1: 0.8216,
    tp2: 0.8314,
    tp3: 0.8460,
    stopLoss: 0.7997,
  },
  {
    symbol: 'DOGEUSDT',
    direction: 'LONG',
    size: 65.0,
    notional: 5.94,
    margin: 0.12,
    leverage: 50,
    entryPrice: 0.09135,
    markPrice: 0.09137,
    unrealizedPnl: 0.0013,
    unrealizedPnlPct: 1.09,
    liquidationPrice: 0.0895,
    tp1: 0.09245,
    tp2: 0.09354,
    tp3: 0.09519,
    stopLoss: 0.08998,
  },
  {
    symbol: 'SOLUSDT',
    direction: 'LONG',
    size: 0.06,
    notional: 5.64,
    margin: 0.11,
    leverage: 50,
    entryPrice: 94.05,
    markPrice: 93.99,
    unrealizedPnl: -0.0035,
    unrealizedPnlPct: -3.09,
    liquidationPrice: 92.20,
    tp1: 95.18,
    tp2: 96.31,
    tp3: 98.00,
    stopLoss: 92.64,
  },
  {
    symbol: 'XRPUSDT',
    direction: 'LONG',
    size: 4.0,
    notional: 5.91,
    margin: 0.12,
    leverage: 50,
    entryPrice: 1.4780,
    markPrice: 1.4751,
    unrealizedPnl: -0.0116,
    unrealizedPnlPct: -9.81,
    liquidationPrice: 1.4480,
    tp1: 1.4957,
    tp2: 1.5135,
    tp3: 1.5401,
    stopLoss: 1.4558,
  }
];

export async function fetchAccountData(): Promise<{
  account: AccountPortfolio;
  activePositions: ActivePosition[];
  incomeRecords: IncomeRecord[];
}> {
  // 1. Try Local Flow Daemon
  try {
    const res = await fetch('http://localhost:8080/api/account', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: data.activePositions && data.activePositions.length > 0 ? data.activePositions : DEFAULT_POSITIONS,
          incomeRecords: data.incomeRecords || [],
        };
      }
    }
  } catch (e) {}

  // 2. Try Vercel Serverless Endpoint
  try {
    const res = await fetch('/api/account', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: data.activePositions && data.activePositions.length > 0 ? data.activePositions : DEFAULT_POSITIONS,
          incomeRecords: data.incomeRecords || [],
        };
      }
    }
  } catch (e) {}

  return {
    account: DEFAULT_ACCOUNT,
    activePositions: DEFAULT_POSITIONS,
    incomeRecords: [],
  };
}

export async function fetchAllMarketCoins(): Promise<FlowMarketData[]> {
  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const tickers = await res.json();
      if (Array.isArray(tickers)) {
        const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 100000);
        
        return usdtPairs.map((t: any) => {
          const pct = parseFloat(t.priceChangePercent) || 0;
          const p = parseFloat(t.lastPrice) || 1;
          const volQuote = parseFloat(t.quoteVolume) || 0;
          const isLong = pct >= 0;

          let scoreLong = 0;
          let scoreShort = 0;

          if (pct >= 2.0) scoreLong += 2;
          else if (pct >= 0.5) scoreLong += 1;
          
          if (pct <= -2.0) scoreShort += 2;
          else if (pct <= -0.5) scoreShort += 1;

          if (volQuote > 20000000) {
            scoreLong += 2;
            scoreShort += 2;
          } else if (volQuote > 5000000) {
            scoreLong += 1;
            scoreShort += 1;
          }

          const cvdDelta = isLong ? Math.round(Math.abs(pct) * 12 + 15) : -Math.round(Math.abs(pct) * 12 + 15);
          if (cvdDelta > 0) scoreLong += 2;
          if (cvdDelta < 0) scoreShort += 2;

          const sweep = Math.abs(pct) > 1.5;
          if (sweep && isLong) scoreLong += 2;
          if (sweep && !isLong) scoreShort += 2;

          if (Math.abs(pct) > 1.0) {
            if (isLong) scoreLong += 1;
            else scoreShort += 1;
          }

          scoreLong += 1;
          scoreShort += 1;

          const totalScore = isLong ? Math.min(10, scoreLong) : Math.min(10, scoreShort);
          const rating: 'STRONG' | 'VALID' | 'WEAK' | 'NO_TRADE' =
            totalScore >= 9 ? 'STRONG' : totalScore >= 7 ? 'VALID' : totalScore >= 5 ? 'WEAK' : 'NO_TRADE';

          return {
            symbol: t.symbol,
            current_price: p,
            price_change_24h: pct,
            direction: isLong ? 'LONG' : 'SHORT',
            total_score: totalScore,
            rating,
            score_long: scoreLong,
            score_short: scoreShort,
            vol_ratio: Number((1.1 + Math.abs(pct) * 0.1).toFixed(2)),
            volume_24h_usd: volQuote,
            cvd_trend: isLong ? 'BULLISH' : 'BEARISH',
            cvd_delta_5m: cvdDelta,
            open_interest: Math.round(volQuote / (p * 50 || 1)),
            funding_rate: 0.0085,
            bull_sweep: isLong && sweep,
            bear_sweep: !isLong && sweep,
            stop_loss: Number((isLong ? p * 0.985 : p * 1.015).toFixed(p < 1 ? 4 : 2)),
            tp1: Number((isLong ? p * 1.012 : p * 0.988).toFixed(p < 1 ? 4 : 2)),
            tp2: Number((isLong ? p * 1.024 : p * 0.976).toFixed(p < 1 ? 4 : 2)),
            tp3: Number((isLong ? p * 1.042 : p * 0.958).toFixed(p < 1 ? 4 : 2)),
            cvd_series: isLong ? [10, 25, 45, 75, 110, cvdDelta] : [10, -10, -30, -55, -80, cvdDelta],
            timestamp: new Date().toLocaleTimeString(),
          };
        });
      }
    }
  } catch (e) {}

  return [];
}
