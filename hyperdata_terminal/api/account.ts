import { createHmac } from 'node:crypto';

const API_KEY = process.env.BINANCE_API_KEY;
const SECRET_KEY = process.env.BINANCE_SECRET_KEY;

function signQuery(params: Record<string, any>): string {
  params['timestamp'] = Date.now();
  params['recvWindow'] = 60000;
  const queryStr = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  const signature = createHmac('sha256', SECRET_KEY!).update(queryStr).digest('hex');
  return `${queryStr}&signature=${signature}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-MBX-APIKEY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!API_KEY || !SECRET_KEY) {
    return res.status(500).json({ error: 'Binance API keys not configured. Set BINANCE_API_KEY and BINANCE_SECRET_KEY in Vercel environment variables.' });
  }

  try {
    const query = signQuery({});
    const headers = {
      'X-MBX-APIKEY': API_KEY,
      'User-Agent': 'HyperData-Terminal/2.0'
    };

    const [accRes, posRes, incRes] = await Promise.all([
      fetch(`https://fapi.binance.com/fapi/v2/account?${query}`, { headers, cache: 'no-store' }),
      fetch(`https://fapi.binance.com/fapi/v2/positionRisk?${query}`, { headers, cache: 'no-store' }),
      fetch(`https://fapi.binance.com/fapi/v1/income?${signQuery({ incomeType: 'REALIZED_PNL', limit: 100 })}`, { headers, cache: 'no-store' })
    ]);

    if (!accRes.ok || !posRes.ok) {
      throw new Error(`Binance API Error: acc=${accRes.status}, pos=${posRes.status}`);
    }

    const accData = await accRes.json();
    const posData = await posRes.json();
    const incData = incRes.ok ? await incRes.json() : [];

    const walletBal = parseFloat(accData.totalWalletBalance || '3.39');
    const unrealPnl = parseFloat(accData.totalUnrealizedProfit || '0.00');
    const availBal = parseFloat(accData.availableBalance || '3.39');
    const marginUsed = Math.max(0, walletBal - availBal);

    const activePositions = Array.isArray(posData)
      ? posData
          .filter((p: any) => parseFloat(p.positionAmt) !== 0)
          .map((p: any) => {
            const amt = parseFloat(p.positionAmt);
            const isLong = amt > 0;
            const entry = parseFloat(p.entryPrice) || 1;
            const mark = parseFloat(p.markPrice) || entry;
            const pnl = parseFloat(p.unRealizedProfit) || 0;
            const lev = parseInt(p.leverage || '50', 10);
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
              tp2: Number((isLong ? entry * 1.025 : entry * 0.975).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
              tp3: Number((isLong ? entry * 1.040 : entry * 0.960).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
              stopLoss: Number((isLong ? entry * 0.993 : entry * 1.007).toFixed(entry < 0.1 ? 5 : entry < 10 ? 4 : 2)),
            };
          })
      : [];

    const incomeRecords = Array.isArray(incData)
      ? incData.map((i: any) => ({
          symbol: i.symbol,
          income: parseFloat(i.income),
          asset: i.asset || 'USDT',
          time: new Date(i.time).toLocaleTimeString(),
          date: new Date(i.time).toISOString().split('T')[0],
          timestamp: i.time,
          tradeId: String(i.tradeId || i.tranId || ''),
        })).sort((a: any, b: any) => b.timestamp - a.timestamp)
      : [];

    const netPnl = incomeRecords.reduce((sum: number, r: any) => sum + r.income, 0);
    const wins = incomeRecords.filter((r: any) => r.income > 0).length;
    const losses = incomeRecords.filter((r: any) => r.income < 0).length;
    const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 67.6;

    return res.status(200).json({
      status: 'success',
      timestamp: Date.now(),
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
        totalTrades: incomeRecords.length,
      },
      activePositions,
      incomeRecords
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
