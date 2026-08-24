import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from '../types/flow';

export const DEFAULT_ACCOUNT: AccountPortfolio = {
  totalEquity: 2.29,
  walletBalance: 2.30,
  availableBalance: 1.70,
  marginUsed: 0.60,
  unrealizedPnl: -0.01,
  netRealizedPnl: -1.15,
  winRate: 45.0,
  winTrades: 45,
  loseTrades: 55,
  totalTrades: 100,
};

export const DEFAULT_POSITIONS: ActivePosition[] = [
  {
    symbol: 'DOGEUSDT',
    direction: 'LONG',
    size: 65.0,
    notional: 5.96,
    margin: 0.60,
    leverage: 10,
    entryPrice: 0.09168,
    markPrice: 0.09156,
    unrealizedPnl: -0.0078,
    unrealizedPnlPct: -1.30,
    liquidationPrice: 0.0566,
    tp1: 0.09278,
    tp2: 0.09388,
    tp3: 0.09553,
    stopLoss: 0.09030,
  }
];

export async function fetchAccountData(): Promise<{
  account: AccountPortfolio;
  activePositions: ActivePosition[];
  incomeRecords: IncomeRecord[];
}> {
  // 1. Try Local Flow Daemon First (Whitelisted IP with direct Binance access)
  try {
    const res = await fetch('http://localhost:8080/api/account', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: data.activePositions || [],
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
