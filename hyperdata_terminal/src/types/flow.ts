export interface FlowMarketData {
  symbol: string;
  current_price: number;
  price_change_24h: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  total_score: number;
  rating: 'STRONG' | 'VALID' | 'WEAK' | 'NO_TRADE';
  score_long: number;
  score_short: number;
  vol_ratio: number;
  volume_24h_usd: number;
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

export interface AccountPortfolio {
  totalEquity: number;
  walletBalance: number;
  availableBalance: number;
  marginUsed: number;
  unrealizedPnl: number;
  netRealizedPnl: number;
  winRate: number;
  winTrades: number;
  loseTrades: number;
  totalTrades: number;
}

export interface ActivePosition {
  symbol: string;
  direction: 'LONG' | 'SHORT';
  size: number;
  notional: number;
  margin: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  liquidationPrice: number;
  tp1: number;
  tp2: number;
  tp3: number;
  stopLoss: number;
}

export interface IncomeRecord {
  symbol: string;
  income: number;
  asset: string;
  time: string;
  date: string;
  timestamp: number;
  tradeId: string;
}
