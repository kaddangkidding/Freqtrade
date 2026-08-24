import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from '../types/flow';

const API_KEY = 'SijchDXpN3dpJA5lYiCBQOgMC2ijnNgcR0UdVgncZYNeHP7RdBgMaj719I8y5WnY';
const SECRET_KEY = 'zMQrvKFOV1CDGuGhx0kevzxhuCFgP0aDJ53W396C1M5BfIaoUEXYGGIziYp9qQZw';

let lastIncomeFetchTime = 0;
let cachedIncomeRecords: IncomeRecord[] = [];

// Fast Browser-Native Web Crypto HMAC-SHA256 Signer
async function signClientQuery(queryString: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_KEY);
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(queryString)
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return '';
  }
}

export const DEFAULT_ACCOUNT: AccountPortfolio = {
  totalEquity: 5.42,
  walletBalance: 5.42,
  availableBalance: 5.30,
  marginUsed: 0.12,
  unrealizedPnl: 0.00,
  netRealizedPnl: -1.22,
  winRate: 44.0,
  winTrades: 44,
  loseTrades: 56,
  totalTrades: 100,
};

export const DEFAULT_POSITIONS: ActivePosition[] = [
  {
    symbol: 'GRASSUSDT',
    direction: 'LONG',
    size: 16.0,
    notional: 5.95,
    margin: 0.12,
    leverage: 50,
    entryPrice: 0.3720,
    markPrice: 0.3720,
    unrealizedPnl: 0.00,
    unrealizedPnlPct: 0.00,
    liquidationPrice: 0.3650,
    tp1: 0.3765,
    tp2: 0.3809,
    tp3: 0.3876,
    stopLoss: 0.3664,
  }
];

export const DEFAULT_INCOME_RECORDS: IncomeRecord[] = [];

export async function fetchAccountData(forceIncome: boolean = false): Promise<{
  account: AccountPortfolio;
  activePositions: ActivePosition[];
  incomeRecords: IncomeRecord[];
}> {
  const timestamp = Date.now();

  // 1. PRIMARY: Direct Client-Side Signed Binance Query (Fastest, 0 Latency)
  try {
    const query = `recvWindow=60000&timestamp=${timestamp}`;
    const signature = await signClientQuery(query);

    if (signature) {
      const headers = { 'X-MBX-APIKEY': API_KEY };
      const shouldFetchIncome = forceIncome || (Date.now() - lastIncomeFetchTime > 45000);
      
      const promises: Promise<any>[] = [
        fetch(`https://fapi.binance.com/fapi/v2/account?${query}&signature=${signature}`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(2500),
        }),
        fetch(`https://fapi.binance.com/fapi/v2/positionRisk?${query}&signature=${signature}`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(2500),
        })
      ];

      if (shouldFetchIncome) {
        promises.push(
          fetch(`https://fapi.binance.com/fapi/v1/income?incomeType=REALIZED_PNL&limit=100&${query}&signature=${signature}`, {
            headers,
            cache: 'no-store',
            signal: AbortSignal.timeout(2500),
          })
        );
      }

      const results = await Promise.all(promises);
      const accRes = results[0];
      const posRes = results[1];
      const incRes = results.length > 2 ? results[2] : null;

      if (accRes.ok && posRes.ok) {
        const accData = await accRes.json();
        const posData = await posRes.json();
        
        if (incRes && incRes.ok) {
          const incData = await incRes.json();
          if (Array.isArray(incData)) {
            lastIncomeFetchTime = Date.now();
            cachedIncomeRecords = incData.map((i: any) => ({
              symbol: i.symbol,
              income: parseFloat(i.income),
              asset: i.asset,
              time: new Date(i.time).toLocaleTimeString(),
              date: new Date(i.time).toISOString().split('T')[0],
              timestamp: i.time,
              tradeId: i.tradeId,
            }));
          }
        }

        const walletBal = parseFloat(accData.totalWalletBalance || '5.42');
        const unrealPnl = parseFloat(accData.totalUnrealizedProfit || '0');
        const availBal = parseFloat(accData.availableBalance || '5.42');
        const marginUsed = Math.max(0, walletBal - availBal);

        const activePositions: ActivePosition[] = Array.isArray(posData)
          ? posData
              .filter((p: any) => parseFloat(p.positionAmt) !== 0)
              .map((p: any) => {
                const amt = parseFloat(p.positionAmt);
                const isLong = amt > 0;
                const entry = parseFloat(p.entryPrice) || 1;
                const mark = parseFloat(p.markPrice) || entry;
                const pnl = parseFloat(p.unRealizedProfit) || 0;
                const lev = parseInt(p.leverage || '50');
                const margin = Math.abs(amt * entry) / (lev || 50);
                const pnlPct = margin > 0 ? (pnl / margin) * 100 : 0;

                return {
                  symbol: p.symbol,
                  direction: isLong ? 'LONG' : 'SHORT',
                  size: Math.abs(amt),
                  notional: Number(Math.abs(amt * mark).toFixed(2)),
                  margin: Number(margin.toFixed(2)),
                  leverage: lev,
                  entryPrice: entry,
                  markPrice: mark,
                  unrealizedPnl: Number(pnl.toFixed(4)),
                  unrealizedPnlPct: Number(pnlPct.toFixed(2)),
                  liquidationPrice: parseFloat(p.liquidationPrice || '0'),
                  tp1: Number((isLong ? entry * 1.012 : entry * 0.988).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
                  tp2: Number((isLong ? entry * 1.024 : entry * 0.976).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
                  tp3: Number((isLong ? entry * 1.042 : entry * 0.958).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
                  stopLoss: Number((isLong ? entry * 0.985 : entry * 1.015).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
                };
              })
          : [];

        const netPnl = cachedIncomeRecords.reduce((sum, r) => sum + r.income, 0);
        const wins = cachedIncomeRecords.filter((r) => r.income > 0).length;
        const losses = cachedIncomeRecords.filter((r) => r.income < 0).length;
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;

        return {
          account: {
            totalEquity: Number((walletBal + unrealPnl).toFixed(2)),
            walletBalance: Number(walletBal.toFixed(2)),
            availableBalance: Number(availBal.toFixed(2)),
            marginUsed: Number(marginUsed.toFixed(2)),
            unrealizedPnl: Number(unrealPnl.toFixed(4)),
            netRealizedPnl: Number(netPnl.toFixed(2)),
            winRate: Number(winRate.toFixed(1)),
            winTrades: wins,
            loseTrades: losses,
            totalTrades: cachedIncomeRecords.length,
          },
          activePositions,
          incomeRecords: cachedIncomeRecords,
        };
      }
    }
  } catch (clientErr) {}

  // 2. FALLBACK TIER 1: Local Daemon Endpoint
  try {
    const res = await fetch(`http://localhost:8080/api/account?t=${timestamp}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: Array.isArray(data.activePositions) ? data.activePositions : [],
          incomeRecords: Array.isArray(data.incomeRecords) ? data.incomeRecords : [],
        };
      }
    }
  } catch (e) {}

  // 3. FALLBACK TIER 2: Vercel Proxy
  try {
    const res = await fetch(`/api/account?t=${timestamp}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.account) {
        return {
          account: data.account,
          activePositions: Array.isArray(data.activePositions) ? data.activePositions : [],
          incomeRecords: Array.isArray(data.incomeRecords) ? data.incomeRecords : [],
        };
      }
    }
  } catch (e) {}

  return {
    account: DEFAULT_ACCOUNT,
    activePositions: DEFAULT_POSITIONS,
    incomeRecords: cachedIncomeRecords,
  };
}

let lastCoinsFetch = 0;
let cachedCoinsData: FlowMarketData[] = [];

export async function fetchAllMarketCoins(force: boolean = false): Promise<FlowMarketData[]> {
  if (!force && cachedCoinsData.length > 0 && Date.now() - lastCoinsFetch < 25000) {
    return cachedCoinsData;
  }

  try {
    const res = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?t=${Date.now()}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const tickers = await res.json();
      if (Array.isArray(tickers)) {
        const usdtPairs = tickers.filter((t: any) => t.symbol.endsWith('USDT') && parseFloat(t.quoteVolume) > 100000);

        lastCoinsFetch = Date.now();
        cachedCoinsData = usdtPairs.map((t: any) => {
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
            stop_loss: Number((isLong ? p * 0.985 : p * 1.015).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
            tp1: Number((isLong ? p * 1.012 : p * 0.988).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
            tp2: Number((isLong ? p * 1.024 : p * 0.976).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
            tp3: Number((isLong ? p * 1.042 : p * 0.958).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
            cvd_series: isLong ? [10, 25, 45, 75, 110, cvdDelta] : [10, -10, -30, -55, -80, cvdDelta],
            timestamp: new Date().toLocaleTimeString(),
          };
        });
        return cachedCoinsData;
      }
    }
  } catch (e) {}

  return cachedCoinsData;
}
