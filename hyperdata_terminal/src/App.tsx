import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { PortfolioHeader } from './components/PortfolioHeader';
import { ActivePositionsList } from './components/ActivePositionsList';
import { AccountGrowthChart } from './components/AccountGrowthChart';
import { PnlDailyCalendar } from './components/PnlDailyCalendar';
import { TradeHistoryResults } from './components/TradeHistoryResults';
import { FlowMatrixRadar } from './components/FlowMatrixRadar';
import { CvdChart } from './components/CvdChart';
import { FreqtradePanel } from './components/FreqtradePanel';
import { fetchAccountData, fetchAllMarketCoins, DEFAULT_ACCOUNT } from './services/api';
import type { FlowMarketData, AccountPortfolio, ActivePosition, IncomeRecord } from './types/flow';

export function App() {
  const [data, setData] = useState<FlowMarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [account, setAccount] = useState<AccountPortfolio>(DEFAULT_ACCOUNT);
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const loadAllData = async () => {
    try {
      const [accRes, coinsRes] = await Promise.all([
        fetchAccountData(),
        fetchAllMarketCoins(),
      ]);

      if (accRes.account) {
        setAccount(accRes.account);
        setActivePositions(accRes.activePositions);
        setIncomeRecords(accRes.incomeRecords);
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
    const interval = setInterval(loadAllData, 4000);

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('wss://fstream.binance.com/ws/!miniTicker@arr');
      ws.onmessage = (event) => {
        try {
          const rawTickers = JSON.parse(event.data);
          if (Array.isArray(rawTickers)) {
            setData((prevData) => {
              if (prevData.length === 0) return prevData;
              const updated = [...prevData];
              let changed = false;

              for (const tick of rawTickers) {
                const idx = updated.findIndex((d) => d.symbol === tick.s);
                if (idx !== -1) {
                  const newPrice = parseFloat(tick.c);
                  if (newPrice && newPrice !== updated[idx].current_price) {
                    updated[idx] = {
                      ...updated[idx],
                      current_price: newPrice,
                      timestamp: new Date().toLocaleTimeString(),
                    };
                    changed = true;
                  }
                }
              }
              return changed ? updated : prevData;
            });
          }
        } catch (err) {}
      };
    } catch (err) {}

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const selectedItem = data.find((d) => d.symbol === selectedSymbol) || data[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* 1. Header */}
        <Header lastUpdated={lastUpdated} onRefresh={loadAllData} isLoading={isLoading} />

        {/* 2. Hero Portfolio & Realized PnL Overview */}
        <PortfolioHeader account={account} activeCount={activePositions.length} />

        {/* 3. Active Live Positions */}
        {activePositions.length > 0 && <ActivePositionsList positions={activePositions} />}

        {/* 4. Graphic Portfolio Growth & Equity Curve */}
        <AccountGrowthChart account={account} records={incomeRecords} />

        {/* 5. Daily PnL Calendar Performance */}
        <PnlDailyCalendar records={incomeRecords} />

        {/* 6. Realized Trade Results History */}
        <TradeHistoryResults records={incomeRecords} />

        {/* 7. Full-Market 300+ Coin 10-Point Scoring Scanner */}
        <FlowMatrixRadar data={data} selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />

        {/* 8. Interactive CVD Chart & Freqtrade Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <CvdChart selectedItem={selectedItem} />
          </div>
          <div className="xl:col-span-1">
            <FreqtradePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
