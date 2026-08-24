export interface FlowMarketData {
  symbol: string;
  current_price: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  total_score: number;
  rating: 'STRONG' | 'VALID' | 'WEAK' | 'NO_TRADE';
  score_long: number;
  score_short: number;
  vol_ratio: number;
  cvd_trend: 'BULLISH' | 'BEARISH';
  cvd_delta_5m: number;
  open_interest: number;
  funding_rate: number;
  bull_sweep: boolean;
  bear_sweep: boolean;
  stop_loss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  cvd_series: number[];
  timestamp: string;
}
