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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const timestamp = Date.now();
    
    // 1. Fetch Account Info (Equity, Margin, Balances)
    const accQuery = `timestamp=${timestamp}`;
    const accSig = sign(accQuery);
    const accRes = await fetch(`https://fapi.binance.com/fapi/v2/account?${accQuery}&signature=${accSig}`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    const accData = await accRes.json();

    // 2. Fetch Position Risk (Active live positions)
    const posQuery = `timestamp=${timestamp}`;
    const posSig = sign(posQuery);
    const posRes = await fetch(`https://fapi.binance.com/fapi/v2/positionRisk?${posQuery}&signature=${posSig}`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    const posData = await posRes.json();

    // 3. Fetch Realized PnL Income records
    const incQuery = `incomeType=REALIZED_PNL&limit=50&timestamp=${timestamp}`;
    const incSig = sign(incQuery);
    const incRes = await fetch(`https://fapi.binance.com/fapi/v1/income?${incQuery}&signature=${incSig}`, {
      headers: { 'X-MBX-APIKEY': API_KEY }
    });
    const incData = await incRes.json();

    // Parse values
    const walletBalance = parseFloat(accData.totalWalletBalance || '0');
    const unrealizedPnl = parseFloat(accData.totalUnrealizedProfit || '0');
    const totalEquity = walletBalance + unrealizedPnl;
    const availableBalance = parseFloat(accData.availableBalance || '0');
    const marginUsed = walletBalance - availableBalance;

    // Filter active positions
    const activePositions = Array.isArray(posData) 
      ? posData.filter(p => parseFloat(p.positionAmt) !== 0).map(p => {
          const amt = parseFloat(p.positionAmt);
          const isLong = amt > 0;
          const entry = parseFloat(p.entryPrice);
          const mark = parseFloat(p.markPrice);
          const pnl = parseFloat(p.unRealizedProfit);
          const lev = parseInt(p.leverage || '20');
          const margin = Math.abs(amt * entry) / (lev || 20);
          const pnlPct = margin > 0 ? (pnl / margin) * 100 : 0;

          return {
            symbol: p.symbol,
            direction: isLong ? 'LONG' : 'SHORT',
            size: Math.abs(amt),
            notional: Math.abs(amt * mark),
            margin: margin,
            leverage: lev,
            entryPrice: entry,
            markPrice: mark,
            unrealizedPnl: pnl,
            unrealizedPnlPct: pnlPct,
            liquidationPrice: parseFloat(p.liquidationPrice || '0'),
            tp1: isLong ? entry * 1.012 : entry * 0.988,
            tp2: isLong ? entry * 1.024 : entry * 0.976,
            tp3: isLong ? entry * 1.042 : entry * 0.958,
            stopLoss: isLong ? entry * 0.985 : entry * 1.015,
          };
        })
      : [];

    // Calculate income metrics
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
      incomeRecords: incomeRecords.slice(0, 15).map(i => ({
        symbol: i.symbol,
        income: parseFloat(i.income),
        asset: i.asset,
        time: new Date(i.time).toLocaleTimeString(),
        tradeId: i.tradeId
      }))
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
