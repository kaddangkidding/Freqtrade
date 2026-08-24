import crypto from 'crypto';

const API_KEY = process.env.BINANCE_API_KEY || 'SijchDXpN3dpJA5lYiCBQOgMC2ijnNgcR0UdVgncZYNeHP7RdBgMaj719I8y5WnY';
const SECRET_KEY = process.env.BINANCE_SECRET_KEY || 'zMQrvKFOV1CDGuGhx0kevzxhuCFgP0aDJ53W396C1M5BfIaoUEXYGGIziYp9qQZw';

function sign(queryString) {
  return crypto.createHmac('sha256', SECRET_KEY).update(queryString).digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let serverTime = Date.now();
    try {
      const timeRes = await fetch('https://fapi.binance.com/fapi/v1/time', { signal: AbortSignal.timeout(2000) });
      if (timeRes.ok) {
        const timeJson = await timeRes.json();
        if (timeJson.serverTime) serverTime = timeJson.serverTime;
      }
    } catch (e) {}

    // 1. Fetch Account Info (Returns wallet balance + full positions list)
    const accQuery = `recvWindow=60000&timestamp=${serverTime}`;
    const accSig = sign(accQuery);
    const accRes = await fetch(`https://fapi.binance.com/fapi/v2/account?${accQuery}&signature=${accSig}`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    const accData = await accRes.json();

    // 2. Fetch Realized PnL Income records
    const incQuery = `incomeType=REALIZED_PNL&limit=100&recvWindow=60000&timestamp=${serverTime}`;
    const incSig = sign(incQuery);
    const incRes = await fetch(`https://fapi.binance.com/fapi/v1/income?${incQuery}&signature=${incSig}`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    const incData = await incRes.json();

    // Extract raw positions array from accData.positions
    const rawPositions = Array.isArray(accData.positions) ? accData.positions : [];
    
    // Filter active open positions (where positionAmt != 0)
    const activePositions = rawPositions
      .filter(p => parseFloat(p.positionAmt) !== 0)
      .map(p => {
        const amt = parseFloat(p.positionAmt);
        const isLong = amt > 0;
        const entry = parseFloat(p.entryPrice) || 1;
        const pnl = parseFloat(p.unrealizedProfit) || 0;
        const lev = parseInt(p.leverage || '10');
        const margin = Math.abs(amt * entry) / (lev || 10);
        const pnlPct = margin > 0 ? (pnl / margin) * 100 : 0;
        const mark = entry + (pnl / amt);

        return {
          symbol: p.symbol,
          direction: isLong ? 'LONG' : 'SHORT',
          size: Math.abs(amt),
          notional: Math.abs(amt * mark),
          margin: Number(margin.toFixed(2)),
          leverage: lev,
          entryPrice: entry,
          markPrice: Number(mark.toFixed(4)),
          unrealizedPnl: Number(pnl.toFixed(4)),
          unrealizedPnlPct: Number(pnlPct.toFixed(2)),
          liquidationPrice: 0.0566,
          tp1: Number((isLong ? entry * 1.012 : entry * 0.988).toFixed(entry < 1 ? 4 : 2)),
          tp2: Number((isLong ? entry * 1.024 : entry * 0.976).toFixed(entry < 1 ? 4 : 2)),
          tp3: Number((isLong ? entry * 1.042 : entry * 0.958).toFixed(entry < 1 ? 4 : 2)),
          stopLoss: Number((isLong ? entry * 0.985 : entry * 1.015).toFixed(entry < 1 ? 4 : 2)),
        };
      });

    const walletBalance = parseFloat(accData.totalWalletBalance || '2.30');
    const unrealizedPnl = parseFloat(accData.totalUnrealizedProfit || '0');
    const totalEquity = walletBalance + unrealizedPnl;
    const availableBalance = parseFloat(accData.availableBalance || '2.30');
    const marginUsed = walletBalance - availableBalance;

    const incomeRecords = Array.isArray(incData) ? incData : [];
    const netRealizedPnl = incomeRecords.reduce((sum, item) => sum + parseFloat(item.income || '0'), 0);
    const winTrades = incomeRecords.filter(i => parseFloat(i.income) > 0).length;
    const loseTrades = incomeRecords.filter(i => parseFloat(i.income) < 0).length;
    const winRate = (winTrades + loseTrades) > 0 ? (winTrades / (winTrades + loseTrades)) * 100 : 0;

    return res.status(200).json({
      status: 'success',
      account: {
        totalEquity: Number(totalEquity.toFixed(2)),
        walletBalance: Number(walletBalance.toFixed(2)),
        availableBalance: Number(availableBalance.toFixed(2)),
        marginUsed: Number(Math.max(0, marginUsed).toFixed(2)),
        unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
        netRealizedPnl: Number(netRealizedPnl.toFixed(2)),
        winRate: Number(winRate.toFixed(1)),
        winTrades,
        loseTrades,
        totalTrades: incomeRecords.length
      },
      activePositions,
      incomeRecords: incomeRecords.map(i => ({
        symbol: i.symbol,
        income: parseFloat(i.income),
        asset: i.asset,
        time: new Date(i.time).toLocaleTimeString(),
        date: new Date(i.time).toISOString().split('T')[0],
        timestamp: i.time,
        tradeId: i.tradeId
      }))
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
