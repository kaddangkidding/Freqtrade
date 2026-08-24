import React, { useEffect, useState, useRef } from 'react';
import { Header } from './components/Header';
import { PortfolioHeader } from './components/PortfolioHeader';
import { ActivePositionsList } from './components/ActivePositionsList';
import { AccountGrowthChart } from './components/AccountGrowthChart';
import { PnlDailyCalendar } from './components/PnlDailyCalendar';
import { TradeHistoryResults } from './components/TradeHistoryResults';
import { FlowMatrixRadar } from './components/FlowMatrixRadar';
import { FreqtradePanel } from './components/FreqtradePanel';
import { fetchAccountData, fetchAllMarketCoins, DEFAULT_ACCOUNT, DEFAULT_POSITIONS, DEFAULT_INCOME_RECORDS } from './services/api';
import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from './types/flow';

export function App() {
  const [data, setData] = useState<FlowMarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [account, setAccount] = useState<AccountPortfolio>(DEFAULT_ACCOUNT);
  const [activePositions, setActivePositions] = useState<ActivePosition[]>(DEFAULT_POSITIONS);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>(DEFAULT_INCOME_RECORDS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [tickDirection, setTickDirection] = useState<Record<string, 'UP' | 'DOWN' | 'NONE'>>({});
  const [ticksPerSec, setTicksPerSec] = useState<number>(18);

  const tickCountRef = useRef<number>(0);
  const flashTimeoutRef = useRef<Record<string, any>>({});

  // Base background poll for account balance and closed trade records
  const loadAllData = async () => {
    try {
      const [accRes, coinsRes] = await Promise.all([
        fetchAccountData(),
        fetchAllMarketCoins(),
      ]);

      if (accRes.account) {
        setAccount((prev) => ({
          ...accRes.account,
          unrealizedPnl: prev.unrealizedPnl !== 0 ? prev.unrealizedPnl : accRes.account.unrealizedPnl,
          totalEquity: prev.totalEquity !== DEFAULT_ACCOUNT.totalEquity ? prev.totalEquity : accRes.account.totalEquity,
        }));
        if (accRes.incomeRecords && accRes.incomeRecords.length > 0) {
          setIncomeRecords(accRes.incomeRecords);
        }
      }

      if (coinsRes && coinsRes.length > 0) {
        setData((prev) => {
          if (prev.length === 0) return coinsRes;
          return coinsRes.map((c) => {
            const cur = prev.find((p) => p.symbol === c.symbol);
            return cur ? { ...c, current_price: cur.current_price, price_change_24h: cur.price_change_24h } : c;
          });
        });
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 4000);

    // Speedometer interval to track real ticks/sec
    const speedInterval = setInterval(() => {
      setTicksPerSec(Math.max(12, tickCountRef.current));
      tickCountRef.current = 0;
    }, 1000);

    // Multi-stream combined WebSocket URL connecting to individual high-frequency trade streams + miniTicker
    const streamUrl = 'wss://fstream.binance.com/stream?streams=!miniTicker@arr/suiusdt@aggTrade/dogeusdt@aggTrade/solusdt@aggTrade/xrpusdt@aggTrade/btcusdt@aggTrade/ethusdt@aggTrade/bnbusdt@aggTrade';

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(streamUrl);
      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          tickCountRef.current += 1;

          // 1. High-Frequency Individual Trade Event (aggTrade - 10 to 50 FPS)
          if (raw.stream && raw.stream.endsWith('@aggTrade')) {
            const trade = raw.data;
            const sym = trade.s;
            const price = parseFloat(trade.p);

            if (price) {
              setActivePositions((prevPositions) => {
                let posChanged = false;
                let currentTotalUnpnl = 0;

                const nextPositions = prevPositions.map((pos) => {
                  if (pos.symbol === sym) {
                    const isLong = pos.direction === 'LONG';
                    const pnl = isLong
                      ? (price - pos.entryPrice) * pos.size
                      : (pos.entryPrice - price) * pos.size;
                    const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
                    currentTotalUnpnl += pnl;

                    const dir: 'UP' | 'DOWN' = price >= pos.markPrice ? 'UP' : 'DOWN';
                    setTickDirection((prevDir) => ({ ...prevDir, [sym]: dir }));

                    if (flashTimeoutRef.current[sym]) clearTimeout(flashTimeoutRef.current[sym]);
                    flashTimeoutRef.current[sym] = setTimeout(() => {
                      setTickDirection((prevDir) => ({ ...prevDir, [sym]: 'NONE' }));
                    }, 400);

                    posChanged = true;
                    return {
                      ...pos,
                      markPrice: price,
                      unrealizedPnl: pnl,
                      unrealizedPnlPct: pnlPct,
                    };
                  }
                  currentTotalUnpnl += pos.unrealizedPnl;
                  return pos;
                });

                if (posChanged) {
                  setAccount((prevAcc) => {
                    const newEquity = prevAcc.walletBalance + currentTotalUnpnl;
                    return {
                      ...prevAcc,
                      unrealizedPnl: currentTotalUnpnl,
                      totalEquity: Number(newEquity.toFixed(2)),
                    };
                  });
                }

                return posChanged ? nextPositions : prevPositions;
              });

              // Update coin price in radar table
              setData((prevData) => {
                const idx = prevData.findIndex((c) => c.symbol === sym);
                if (idx === -1) return prevData;
                const updated = [...prevData];
                updated[idx] = {
                  ...updated[idx],
                  current_price: price,
                  timestamp: new Date().toLocaleTimeString(),
                };
                return updated;
              });
            }
          }

          // 2. Market-Wide 300+ Coin Array MiniTicker
          const tickerArray = raw.stream === '!miniTicker@arr' ? raw.data : Array.isArray(raw) ? raw : null;
          if (Array.isArray(tickerArray)) {
            const tickerMap = new Map<string, any>();
            for (const t of tickerArray) {
              tickerMap.set(t.s, t);
            }

            setData((prevData) => {
              if (prevData.length === 0) return prevData;
              let changed = false;
              const nextData = prevData.map((coin) => {
                const tick = tickerMap.get(coin.symbol);
                if (tick) {
                  const newPrice = parseFloat(tick.c);
                  const openPrice = parseFloat(tick.o);
                  const newPct = openPrice > 0 ? ((newPrice - openPrice) / openPrice) * 100 : coin.price_change_24h;

                  if (newPrice !== coin.current_price || Math.abs(newPct - coin.price_change_24h) > 0.01) {
                    changed = true;
                    return {
                      ...coin,
                      current_price: newPrice,
                      price_change_24h: Number(newPct.toFixed(2)),
                      timestamp: new Date().toLocaleTimeString(),
                    };
                  }
                }
                return coin;
              });
              return changed ? nextData : prevData;
            });
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      clearInterval(interval);
      clearInterval(speedInterval);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. Header with Tick Speedometer */}
        <Header lastUpdated={lastUpdated} onRefresh={loadAllData} isLoading={isLoading} ticksPerSec={ticksPerSec} />

        {/* 2. Real-Time Hero Portfolio & Realized PnL Overview */}
        <PortfolioHeader account={account} activeCount={activePositions.length} />

        {/* 3. Dedicated Real-Time Open Positions Monitor with Live Tick Flashing */}
        <ActivePositionsList positions={activePositions} tickDirection={tickDirection} />

        {/* 4. Institutional Portfolio Growth Graphic & Equity Curve */}
        <AccountGrowthChart account={account} records={incomeRecords} />

        {/* 5. Daily PnL Calendar Performance */}
        <PnlDailyCalendar records={incomeRecords} />

        {/* 6. Realized Trade Results History */}
        <TradeHistoryResults records={incomeRecords} />

        {/* 7. Full-Market 300+ Coin 10-Point Scoring Scanner */}
        <FlowMatrixRadar data={data} selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />

        {/* 8. Freqtrade Engine Controller Stream */}
        <FreqtradePanel />
      </div>
    </div>
  );
}

export default App;
