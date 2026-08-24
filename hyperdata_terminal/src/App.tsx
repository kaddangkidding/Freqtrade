import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { FlowMatrixRadar } from './components/FlowMatrixRadar';
import { CvdChart } from './components/CvdChart';
import { FreqtradePanel } from './components/FreqtradePanel';
import { fetchFlowMatrix } from './services/api';
import type { FlowMarketData } from './types/flow';

export function App() {
  const [data, setData] = useState<FlowMarketData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await fetchFlowMatrix();
      setData(items);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedItem = data.find((d) => d.symbol === selectedSymbol) || data[0] || null;

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
