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
  const [isLiveTicking, setIsLiveTicking] = useState<boolean>(true);

  // Load account & all 300+ markets from REST backend
  const loadAllData = async () => {
    try {
      const [accRes, coinsRes] = await Promise.all([
        fetchAccountData(),
        fetchAllMarketCoins(),
      ]);

      if (accRes.account) {
        setAccount((prev) => ({
          ...accRes.account,
          // Preserve floating live unrealized PnL computed by WebSocket
          unrealizedPnl: prev.unrealizedPnl !== 0 ? prev.unrealizedPnl : accRes.account.unrealizedPnl,
          totalEquity: prev.totalEquity !== DEFAULT_ACCOUNT.totalEquity ? prev.totalEquity : accRes.account.totalEquity,
        }));
        if (accRes.activePositions && accRes.activePositions.length > 0) {
          setActivePositions(accRes.activePositions);
        }
        if (accRes.incomeRecords && accRes.incomeRecords.length > 0) {
          setIncomeRecords(accRes.incomeRecords);
        }
      }

      if (coinsRes && coinsRes.length > 0) {
        setData(coinsRes);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 3000);

    // High-Frequency Real-time Binance WebSocket Stream for sub-second live ticks
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('wss://fstream.binance.com/ws/!miniTicker@arr');
      ws.onmessage = (event) => {
        try {
          const rawTickers = JSON.parse(event.data);
          if (Array.isArray(rawTickers) && rawTickers.length > 0) {
            const tickerMap = new Map<string, any>();
            for (const t of rawTickers) {
              tickerMap.set(t.s, t);
            }

            // 1. REAL-TIME: Update live prices AND 24h percentage change for all 300+ coins
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

            // 2. REAL-TIME: Update active positions mark price, unrealized PnL, and ROE %
            setActivePositions((prevPositions) => {
              if (prevPositions.length === 0) return prevPositions;
              let posChanged = false;
              let currentTotalUnpnl = 0;

              const nextPositions = prevPositions.map((pos) => {
                const tick = tickerMap.get(pos.symbol);
                if (tick) {
                  const newMark = parseFloat(tick.c);
                  if (newMark) {
                    const isLong = pos.direction === 'LONG';
                    const pnl = isLong
                      ? (newMark - pos.entryPrice) * pos.size
                      : (pos.entryPrice - newMark) * pos.size;
                    const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
                    currentTotalUnpnl += pnl;

                    if (newMark !== pos.markPrice) {
                      posChanged = true;
                      return {
                        ...pos,
                        markPrice: newMark,
                        unrealizedPnl: Number(pnl.toFixed(4)),
                        unrealizedPnlPct: Number(pnlPct.toFixed(2)),
                      };
                    }
                  }
                }
                currentTotalUnpnl += pos.unrealizedPnl;
                return pos;
              });

              // 3. REAL-TIME: Recompute total equity & unrealized PnL on every tick
              if (posChanged) {
                setAccount((prevAcc) => {
                  const newEquity = prevAcc.walletBalance + currentTotalUnpnl;
                  return {
                    ...prevAcc,
                    unrealizedPnl: Number(currentTotalUnpnl.toFixed(4)),
                    totalEquity: Number(newEquity.toFixed(2)),
                  };
                });
              }

              return posChanged ? nextPositions : prevPositions;
            });

            setLastUpdated(new Date().toLocaleTimeString());
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. Header */}
        <Header lastUpdated={lastUpdated} onRefresh={loadAllData} isLoading={isLoading} />

        {/* 2. Real-Time Hero Portfolio & Realized PnL Overview */}
        <PortfolioHeader account={account} activeCount={activePositions.length} isLiveTicking={isLiveTicking} />

        {/* 3. Dedicated Real-Time Open Positions Monitor */}
        <ActivePositionsList positions={activePositions} />

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
