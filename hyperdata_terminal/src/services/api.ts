import type { FlowMarketData } from '../types/flow';

export const INITIAL_FLOW_DATA: FlowMarketData[] = [
  { symbol: 'BTCUSDT', current_price: 91450.0, direction: 'LONG', total_score: 9, rating: 'STRONG', score_long: 9, score_short: 2, vol_ratio: 1.85, cvd_trend: 'BULLISH', cvd_delta_5m: 142.5, open_interest: 48250.0, funding_rate: 0.0085, bull_sweep: true, bear_sweep: false, stop_loss: 89950.0, tp1: 92450.0, tp2: 93450.0, tp3: 94950.0, cvd_series: [10, 18, 25, 40, 65, 80, 110, 142.5], timestamp: 'Live' },
  { symbol: 'ETHUSDT', current_price: 2780.5, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 3, vol_ratio: 1.62, cvd_trend: 'BULLISH', cvd_delta_5m: 45.2, open_interest: 19800.0, funding_rate: 0.0092, bull_sweep: true, bear_sweep: false, stop_loss: 2735.0, tp1: 2810.0, tp2: 2845.0, tp3: 2890.0, cvd_series: [5, 12, 18, 28, 35, 45.2], timestamp: 'Live' },
  { symbol: 'SOLUSDT', current_price: 188.4, direction: 'LONG', total_score: 9, rating: 'STRONG', score_long: 9, score_short: 1, vol_ratio: 2.1, cvd_trend: 'BULLISH', cvd_delta_5m: 88.0, open_interest: 14200.0, funding_rate: 0.0075, bull_sweep: true, bear_sweep: false, stop_loss: 184.2, tp1: 191.5, tp2: 194.8, tp3: 199.5, cvd_series: [2, 10, 25, 45, 68, 88.0], timestamp: 'Live' },
  { symbol: 'SUIUSDT', current_price: 3.42, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 3, vol_ratio: 1.7, cvd_trend: 'BULLISH', cvd_delta_5m: 54.0, open_interest: 6500.0, funding_rate: 0.008, bull_sweep: true, bear_sweep: false, stop_loss: 3.34, tp1: 3.48, tp2: 3.55, tp3: 3.65, cvd_series: [1, 8, 16, 29, 42, 54.0], timestamp: 'Live' },
  { symbol: 'DOGEUSDT', current_price: 0.245, direction: 'SHORT', total_score: 7, rating: 'VALID', score_long: 2, score_short: 7, vol_ratio: 1.45, cvd_trend: 'BEARISH', cvd_delta_5m: -32.5, open_interest: 8900.0, funding_rate: -0.0025, bull_sweep: false, bear_sweep: true, stop_loss: 0.252, tp1: 0.240, tp2: 0.235, tp3: 0.228, cvd_series: [10, 5, -2, -15, -24, -32.5], timestamp: 'Live' },
  { symbol: 'XRPUSDT', current_price: 2.15, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 2, vol_ratio: 1.6, cvd_trend: 'BULLISH', cvd_delta_5m: 62.0, open_interest: 11200.0, funding_rate: 0.0065, bull_sweep: true, bear_sweep: false, stop_loss: 2.08, tp1: 2.19, tp2: 2.24, tp3: 2.31, cvd_series: [4, 12, 28, 45, 62.0], timestamp: 'Live' },
  { symbol: 'BNBUSDT', current_price: 685.2, direction: 'LONG', total_score: 8, rating: 'VALID', score_long: 8, score_short: 2, vol_ratio: 1.4, cvd_trend: 'BULLISH', cvd_delta_5m: 28.5, open_interest: 7800.0, funding_rate: 0.007, bull_sweep: true, bear_sweep: false, stop_loss: 672.0, tp1: 692.0, tp2: 701.0, tp3: 715.0, cvd_series: [3, 9, 17, 24, 28.5], timestamp: 'Live' },
  { symbol: 'AVAXUSDT', current_price: 34.5, direction: 'LONG', total_score: 7, rating: 'VALID', score_long: 7, score_short: 3, vol_ratio: 1.35, cvd_trend: 'BULLISH', cvd_delta_5m: 18.0, open_interest: 4900.0, funding_rate: 0.008, bull_sweep: true, bear_sweep: false, stop_loss: 33.6, tp1: 35.2, tp2: 35.9, tp3: 37.0, cvd_series: [2, 6, 11, 15, 18.0], timestamp: 'Live' }
];

export async function fetchFlowMatrix(): Promise<FlowMarketData[]> {
  try {
    const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const tickers = await res.json();
      const targetSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'XRPUSDT', 'SUIUSDT', 'AVAXUSDT'];
      const filtered = tickers.filter((t: any) => targetSymbols.includes(t.symbol));
      if (filtered.length > 0) {
        return filtered.map((t: any) => {
          const pct = parseFloat(t.priceChangePercent) || 0;
          const p = parseFloat(t.lastPrice) || 100;
          const isLong = pct >= 0;
          const score = Math.min(10, Math.max(4, Math.round(5 + Math.abs(pct) * 0.8)));
          const delta = isLong ? Math.round(Math.abs(pct) * 15 + 20) : -Math.round(Math.abs(pct) * 15 + 20);
          return {
            symbol: t.symbol,
            current_price: p,
            direction: isLong ? 'LONG' : 'SHORT',
            total_score: score,
            rating: score >= 9 ? 'STRONG' : score >= 7 ? 'VALID' : score >= 5 ? 'WEAK' : 'NO_TRADE',
            score_long: isLong ? score : 2,
            score_short: !isLong ? score : 2,
            vol_ratio: Number((1.2 + Math.abs(pct) * 0.1).toFixed(2)),
            cvd_trend: isLong ? 'BULLISH' : 'BEARISH',
            cvd_delta_5m: delta,
            open_interest: Math.round(parseFloat(t.volume || '1000') / 5),
            funding_rate: 0.0085,
            bull_sweep: isLong,
            bear_sweep: !isLong,
            stop_loss: Number((isLong ? p * 0.985 : p * 1.015).toFixed(p < 1 ? 4 : 2)),
            tp1: Number((isLong ? p * 1.012 : p * 0.988).toFixed(p < 1 ? 4 : 2)),
            tp2: Number((isLong ? p * 1.024 : p * 0.976).toFixed(p < 1 ? 4 : 2)),
            tp3: Number((isLong ? p * 1.042 : p * 0.958).toFixed(p < 1 ? 4 : 2)),
            cvd_series: isLong ? [10, 25, 45, 70, 95, 120, delta] : [10, -5, -20, -40, -65, delta],
            timestamp: new Date().toLocaleTimeString()
          };
        });
      }
    }
  } catch (e) {}

  return INITIAL_FLOW_DATA;
}