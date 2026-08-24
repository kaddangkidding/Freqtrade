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

  // Load base account data & market catalog
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
          // Keep existing real-time prices
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

    // Direct Binance High-Frequency WebSocket Stream
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

            // 1. REAL-TIME: Update active positions mark price, floating PnL, and ROE %
            setActivePositions((prevPositions) => {
              if (prevPositions.length === 0) return prevPositions;
              let totalUnpnl = 0;
              let posChanged = false;

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
                    totalUnpnl += pnl;

                    if (newMark !== pos.markPrice || Math.abs(pnl - pos.unrealizedPnl) > 0.0001) {
                      posChanged = true;
                      return {
                        ...pos,
                        markPrice: newMark,
                        unrealizedPnl: pnl,
                        unrealizedPnlPct: pnlPct,
                      };
                    }
                  }
                }
                totalUnpnl += pos.unrealizedPnl;
                return pos;
              });

              // 2. REAL-TIME: Recompute total live floating unrealized PnL & total equity
              if (posChanged) {
                setAccount((prevAcc) => {
                  const newEquity = prevAcc.walletBalance + totalUnpnl;
                  return {
                    ...prevAcc,
                    unrealizedPnl: totalUnpnl,
                    totalEquity: Number(newEquity.toFixed(2)),
                  };
                });
              }

              return posChanged ? nextPositions : prevPositions;
            });

            // 3. REAL-TIME: Update 300+ coin grid prices and 24h % change
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
        <PortfolioHeader account={account} activeCount={activePositions.length} />

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
