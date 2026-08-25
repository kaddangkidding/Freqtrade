export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://fapi.binance.com/fapi/v1/ticker/24hr', {
      headers: { 'User-Agent': 'HyperData-Terminal/2.0' },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Binance ticker error: ${response.status}`);
    }

    const tickers: any = await response.json();
    const excluded = new Set(['BTCUSDT', 'ETHUSDT']);
    
    const valid = tickers
      .filter((t: any) => t.symbol.endsWith('USDT') && !excluded.has(t.symbol) && parseFloat(t.quoteVolume) >= 10000000)
      .sort((a: any, b: any) => Math.abs(parseFloat(b.priceChangePercent)) * Math.sqrt(parseFloat(b.quoteVolume)) - Math.abs(parseFloat(a.priceChangePercent)) * Math.sqrt(parseFloat(a.quoteVolume)))
      .slice(0, 25);

    const matrix = valid.map((t: any) => {
      const p = parseFloat(t.lastPrice);
      const pct = parseFloat(t.priceChangePercent);
      const direction = pct >= 0 ? 'LONG' : 'SHORT';
      const score = Math.min(10, 5 + Math.floor(Math.abs(pct) / 2));
      const cvdDelta = Number((pct * 15 + (direction === 'LONG' ? 25 : -25)).toFixed(1));

      return {
        symbol: t.symbol,
        current_price: p,
        price_change_24h: pct,
        direction,
        total_score: score,
        rating: score >= 9 ? 'STRONG' : 'VALID',
        setup_name: direction === 'LONG' ? 'High-Velocity Bullish Breakout' : 'High-Velocity Bearish Breakdown',
        is_big_cap: true,
        score_long: direction === 'LONG' ? score : 0,
        score_short: direction === 'SHORT' ? score : 0,
        vol_ratio: 1.5,
        volume_24h_usd: parseFloat(t.quoteVolume),
        cvd_trend: direction === 'LONG' ? 'BULLISH' : 'BEARISH',
        cvd_delta_5m: cvdDelta,
        open_interest: Math.floor(p * 10000),
        funding_rate: 0.0085,
        bull_sweep: direction === 'LONG',
        bear_sweep: direction === 'SHORT',
        stop_loss: Number((direction === 'LONG' ? p * 0.993 : p * 1.007).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
        tp1: Number((direction === 'LONG' ? p * 1.012 : p * 0.988).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
        tp2: Number((direction === 'LONG' ? p * 1.025 : p * 0.975).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
        tp3: Number((direction === 'LONG' ? p * 1.040 : p * 0.960).toFixed(p < 0.1 ? 5 : p < 10 ? 4 : 2)),
        cvd_series: direction === 'LONG' ? [10, 35, 65, 110, 150, cvdDelta] : [10, -35, -65, -110, -150, cvdDelta],
        timestamp: new Date().toLocaleTimeString()
      };
    });

    return res.status(200).json(matrix);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
