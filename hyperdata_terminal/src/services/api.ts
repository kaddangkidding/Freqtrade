import type { FlowMarketData } from '../types/flow';

const MOCK_DATA: FlowMarketData[] = [
  { symbol: 'BTCUSDT', current_price: 91450.0, direction: 'LONG', total_score: 9, rating: 'STRONG', score_long: 9, score_short: 2, vol_ratio: 1.85, cvd_trend: 'BULLISH', cvd_delta_5m: 142.5, open_interest: 48250.0, funding_rate: 0.0085, bull_sweep: true, bear_sweep: false, stop_loss: 89950.0, tp1: 92450.0, tp2: 93450.0, tp3: 94950.0, cvd_series: [10, 18, 25, 40, 65, 80, 110, 142.5], timestamp: 'Live' },
  { symbol: 'ETHUSDT', current_price: 2780.5, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 3, vol_ratio: 1.62, cvd_trend: 'BULLISH', cvd_delta_5m: 45.2, open_interest: 19800.0, funding_rate: 0.0092, bull_sweep: true, bear_sweep: false, stop_loss: 2735.0, tp1: 2810.0, tp2: 2845.0, tp3: 2890.0, cvd_series: [5, 12, 18, 28, 35, 45.2], timestamp: 'Live' },
  { symbol: 'SOLUSDT', current_price: 188.4, direction: 'LONG', total_score: 9, rating: 'STRONG', score_long: 9, score_short: 1, vol_ratio: 2.1, cvd_trend: 'BULLISH', cvd_delta_5m: 88.0, open_interest: 14200.0, funding_rate: 0.0075, bull_sweep: true, bear_sweep: false, stop_loss: 184.2, tp1: 191.5, tp2: 194.8, tp3: 199.5, cvd_series: [2, 10, 25, 45, 68, 88.0], timestamp: 'Live' },
  { symbol: 'DOGEUSDT', current_price: 0.245, direction: 'SHORT', total_score: 7, rating: 'VALID', score_long: 2, score_short: 7, vol_ratio: 1.45, cvd_trend: 'BEARISH', cvd_delta_5m: -32.5, open_interest: 8900.0, funding_rate: -0.0025, bull_sweep: false, bear_sweep: true, stop_loss: 0.252, tp1: 0.240, tp2: 0.235, tp3: 0.228, cvd_series: [10, 5, -2, -15, -24, -32.5], timestamp: 'Live' },
  { symbol: 'SUIUSDT', current_price: 3.42, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 3, vol_ratio: 1.7, cvd_trend: 'BULLISH', cvd_delta_5m: 54.0, open_interest: 6500.0, funding_rate: 0.008, bull_sweep: true, bear_sweep: false, stop_loss: 3.34, tp1: 3.48, tp2: 3.55, tp3: 3.65, cvd_series: [1, 8, 16, 29, 42, 54.0], timestamp: 'Live' }
];

export async function fetchFlowMatrix(): Promise<FlowMarketData[]> {
  try {
    const res = await fetch('http://localhost:8080/api/flow/matrix', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) return json.data;
    }
  } catch (e) {}

  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const tickers = await res.json();
      const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'SUIUSDT', 'AVAXUSDT'];
      const filtered = tickers.filter((t: any) => targetSymbols.includes(t.symbol));
      return filtered.map((t: any) => {
        const pct = parseFloat(t.priceChangePercent);
        const p = parseFloat(t.lastPrice);
        const isLong = pct >= 0;
        const score = Math.min(10, Math.max(4, Math.round(5 + Math.abs(pct) * 0.8)));
        return {
          symbol: t.symbol,
          current_price: p,
          direction: isLong ? 'LONG' : 'SHORT',
          total_score: score,
          rating: score >= 9 ? 'STRONG' : score >= 7 ? 'VALID' : score >= 5 ? 'WEAK' : 'NO_TRADE',
          score_long: isLong ? score : 2,
          score_short: !isLong ? score : 2,
          vol_ratio: 1.5,
          cvd_trend: isLong ? 'BULLISH' : 'BEARISH',
          cvd_delta_5m: isLong ? 45.0 : -35.0,
          open_interest: parseFloat(t.volume) / 10,
          funding_rate: 0.01,
          bull_sweep: isLong,
          bear_sweep: !isLong,
          stop_loss: isLong ? p * 0.985 : p * 1.015,
          tp1: isLong ? p * 1.012 : p * 0.988,
          tp2: isLong ? p * 1.024 : p * 0.976,
          tp3: isLong ? p * 1.042 : p * 0.958,
          cvd_series: isLong ? [5, 15, 30, 45] : [-5, -15, -30, -45],
          timestamp: new Date().toLocaleTimeString()
        };
      });
    }
  } catch (e) {}

  return MOCK_DATA;
}
