import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { FlowMatrixRadar } from './components/FlowMatrixRadar';
import { CvdChart } from './components/CvdChart';
import { FreqtradePanel } from './components/FreqtradePanel';
import { fetchFlowMatrix, INITIAL_FLOW_DATA } from './services/api';
import type { FlowMarketData } from './types/flow';

export function App() {
  const [data, setData] = useState<FlowMarketData[]>(INITIAL_FLOW_DATA);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const loadData = async () => {
    try {
      const items = await fetchFlowMatrix();
      if (items && items.length > 0) {
        setData(items);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error('Error fetching flow matrix:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket('wss://fstream.binance.com/ws/!miniTicker@arr');
      ws.onmessage = (event) => {
        try {
          const rawTickers = JSON.parse(event.data);
          if (Array.isArray(rawTickers)) {
            setData((prevData) => {
              const updated = [...prevData];
              let hasChanges = false;
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
                    hasChanges = true;
                  }
                }
              }
              return hasChanges ? updated : prevData;
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

  const selectedItem = data.find((d) => d.symbol === selectedSymbol) || data[0] || INITIAL_FLOW_DATA[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto space-y-5">
        <Header lastUpdated={lastUpdated} onRefresh={loadData} isLoading={isLoading} />
        <FlowMatrixRadar data={data} selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
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
