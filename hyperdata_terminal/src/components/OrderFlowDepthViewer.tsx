import React from 'react';
import type { FlowMarketData } from '../types/flow';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart2, Shield, Target, Waves, Zap } from 'lucide-react';

interface Props {
  selectedItem: FlowMarketData | null;
}

export const OrderFlowDepthViewer: React.FC<Props> = ({ selectedItem }) => {
  if (!selectedItem) return null;

  const isLong = selectedItem.direction === 'LONG';
  const cvdSeries = selectedItem.cvd_series || [];

  return (
    <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shadow-lg shadow-cyan-950/40">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {selectedItem.symbol} Institutional Order Flow &amp; CVD
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {selectedItem.direction} &bull; Score {selectedItem.total_score}/10
              </span>
            </div>
            <p className="text-xs text-slate-400">Dynamic 5m Cumulative Volume Delta (CVD) &amp; Liquidity Sweeps</p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase">Mark Price</span>
            <span className="text-lg font-black text-white">${selectedItem.current_price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CVD Delta Visualizer Waves */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            CVD Delta Wave Expansion
          </span>
          <span className="font-mono text-cyan-400 font-bold">
            5m Net Delta: {selectedItem.cvd_delta_5m > 0 ? '+' : ''}{selectedItem.cvd_delta_5m}
          </span>
        </div>

        {/* CVD Wave Bars */}
        <div className="h-28 flex items-end gap-1.5 pt-4 pb-2 px-2 bg-slate-900/40 rounded-lg border border-slate-800/60 overflow-x-auto">
          {cvdSeries.map((val, idx) => {
            const isPos = val >= 0;
            const maxVal = Math.max(...cvdSeries.map(Math.abs), 50);
            const heightPct = Math.min(100, Math.max(15, (Math.abs(val) / maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[14px]">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    isPos ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : 'bg-gradient-to-t from-rose-600 to-pink-400'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>T-25 Candles</span>
          <span className={isLong ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            ● {selectedItem.cvd_trend} CVD Flow Confirmed
          </span>
          <span>Latest Live</span>
        </div>
      </div>
    </div>
  );
};
