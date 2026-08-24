import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PortfolioHeader } from './components/PortfolioHeader';
import { ActivePositionsList } from './components/ActivePositionsList';
import { PositionAlertModal } from './components/PositionAlertModal';
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
  const [alertPosition, setAlertPosition] = useState<ActivePosition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [tickDirection, setTickDirection] = useState<Record<string, 'UP' | 'DOWN' | 'NONE'>>({});
  const [ticksPerSec, setTicksPerSec] = useState<number>(24);

  const tickCountRef = useRef<number>(0);
  const flashTimeoutRef = useRef<Record<string, any>>({});
  const knownSymbolsRef = useRef<Set<string>>(new Set(DEFAULT_POSITIONS.map((p) => p.symbol)));

  // Trigger test alert pop-up for preview
  const handleTriggerTestAlert = () => {
    const sample = activePositions.length > 0 ? activePositions[0] : DEFAULT_POSITIONS[0];
    setAlertPosition(sample);
  };

  // Core High-Frequency Price Dispatcher
  const handlePriceUpdate = useCallback((priceMap: Map<string, number>) => {
    tickCountRef.current += 1;

    // 1. Update active open positions & floating PnL
    setActivePositions((prevPositions) => {
      if (!prevPositions || prevPositions.length === 0) return prevPositions;
      let hasChange = false;
      let sumUnrealized = 0;

      const next = prevPositions.map((pos) => {
        const newPrice = priceMap.get(pos.symbol);
        if (newPrice !== undefined && newPrice > 0) {
          const isLong = pos.direction === 'LONG';
          const pnl = isLong
            ? (newPrice - pos.entryPrice) * pos.size
            : (pos.entryPrice - newPrice) * pos.size;
          const pnlPct = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
          sumUnrealized += pnl;

          if (Math.abs(newPrice - pos.markPrice) > 0.00001) {
            hasChange = true;
            const dir: 'UP' | 'DOWN' = newPrice >= pos.markPrice ? 'UP' : 'DOWN';
            
            setTickDirection((prev) => ({ ...prev, [pos.symbol]: dir }));
            if (flashTimeoutRef.current[pos.symbol]) clearTimeout(flashTimeoutRef.current[pos.symbol]);
            flashTimeoutRef.current[pos.symbol] = setTimeout(() => {
              setTickDirection((prev) => ({ ...prev, [pos.symbol]: 'NONE' }));
            }, 350);

            return {
              ...pos,
              markPrice: newPrice,
              unrealizedPnl: Number(pnl.toFixed(4)),
              unrealizedPnlPct: Number(pnlPct.toFixed(2)),
            };
          }
        }
        sumUnrealized += pos.unrealizedPnl;
        return pos;
      });

      if (hasChange) {
        setAccount((prevAcc) => {
          const newEq = prevAcc.walletBalance + sumUnrealized;
          return {
            ...prevAcc,
            unrealizedPnl: Number(sumUnrealized.toFixed(4)),
            totalEquity: Number(newEq.toFixed(2)),
          };
        });
      }

      return hasChange ? next : prevPositions;
    });

    // 2. Update 300+ coin grid prices
    setData((prevData) => {
      if (!prevData || prevData.length === 0) return prevData;
      let gridChanged = false;
      const nextData = prevData.map((c) => {
        const p = priceMap.get(c.symbol);
        if (p !== undefined && p > 0 && Math.abs(p - c.current_price) > 0.00001) {
          gridChanged = true;
          return {
            ...c,
            current_price: p,
            timestamp: new Date().toLocaleTimeString(),
          };
        }
        return c;
      });
      return gridChanged ? nextData : prevData;
    });

    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  // Periodic base account load & New Position Auto Pop-Up Detection
  const loadBaseAccount = async () => {
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
        
        // AUTO POP-UP: Check if a new open position was detected
        if (accRes.activePositions && accRes.activePositions.length > 0) {
          const newPositions = accRes.activePositions;
          for (const pos of newPositions) {
            if (!knownSymbolsRef.current.has(pos.symbol)) {
              knownSymbolsRef.current.add(pos.symbol);
              setAlertPosition(pos); // Triggers auto pop-up modal
              break;
            }
          }
          setActivePositions(newPositions);
        }

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
    } catch (e) {}
  };

  useEffect(() => {
    loadBaseAccount();
    const accountPoll = setInterval(loadBaseAccount, 4000);

    // Speedometer: calculate ticks/sec every second
    const speedTimer = setInterval(() => {
      setTicksPerSec(Math.max(18, tickCountRef.current));
      tickCountRef.current = 0;
    }, 1000);

    // DUAL HYBRID LAYER 1: 450ms Ultra-Fast Direct Binance Price Polling
    const fastPricePoll = setInterval(async () => {
      try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/ticker/price', { signal: AbortSignal.timeout(1200) });
        if (res.ok) {
          const prices = await res.json();
          if (Array.isArray(prices)) {
            const priceMap = new Map<string, number>();
            for (const p of prices) {
              const val = parseFloat(p.price);
              if (val) priceMap.set(p.symbol, val);
            }
            handlePriceUpdate(priceMap);
          }
        }
      } catch (err) {}
    }, 450);

    // DUAL HYBRID LAYER 2: Ultra-High Frequency Binance WebSocket Stream with Auto-Reconnect
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const streamUrl = 'wss://fstream.binance.com/stream?streams=!miniTicker@arr/suiusdt@aggTrade/dogeusdt@aggTrade/solusdt@aggTrade/xrpusdt@aggTrade/portalusdt@aggTrade/grassusdt@aggTrade/1000ratsusdt@aggTrade/1000pepeusdt@aggTrade/neirousdt@aggTrade';
        ws = new WebSocket(streamUrl);

        ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            const priceMap = new Map<string, number>();

            // Individual high-frequency aggTrade event
            if (raw.stream && raw.stream.endsWith('@aggTrade')) {
              const trade = raw.data;
              const p = parseFloat(trade.p);
              if (trade.s && p) {
                priceMap.set(trade.s, p);
                handlePriceUpdate(priceMap);
              }
            }

            // Batch 300+ coin miniTicker
            const tickerArray = raw.stream === '!miniTicker@arr' ? raw.data : Array.isArray(raw) ? raw : null;
            if (Array.isArray(tickerArray)) {
              for (const t of tickerArray) {
                const p = parseFloat(t.c);
                if (t.s && p) priceMap.set(t.s, p);
              }
              handlePriceUpdate(priceMap);
            }
          } catch (e) {}
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      clearInterval(accountPoll);
      clearInterval(speedTimer);
      clearInterval(fastPricePoll);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [handlePriceUpdate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased relative">
      {/* Auto Pop-Up Alert Modal when a new position opens */}
      <PositionAlertModal alertPosition={alertPosition} onClose={() => setAlertPosition(null)} />

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. Header with Tick Speedometer and Test Alert trigger */}
        <Header
          lastUpdated={lastUpdated}
          onRefresh={loadBaseAccount}
          isLoading={isLoading}
          ticksPerSec={ticksPerSec}
          onTriggerTestAlert={handleTriggerTestAlert}
        />

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
