import React from 'react';
import type { FlowMarketData } from '../types/flow';
import { Activity, BarChart2, Shield, Target } from 'lucide-react';

interface Props {
  selectedItem: FlowMarketData | null;
}

export const CvdChart: React.FC<Props> = ({ selectedItem }) => {
  if (!selectedItem) return null;
  const cvdSeries = selectedItem.cvd_series || [];

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{selectedItem.symbol} Order Flow &amp; CVD Delta Analysis</h3>
            <p className="text-xs text-slate-400">Cumulative Volume Delta (CVD) divergence vs Market Structure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Mark Price:</span>
          <span className="text-base font-black text-white font-mono">${selectedItem.current_price.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-400 uppercase"><Target className="w-3 h-3" /><span>TP1 (Breakeven)</span></div>
          <div className="text-sm font-black text-white font-mono mt-1">${selectedItem.tp1.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-300 mt-0.5">SL moves to entry</div>
        </div>
        <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-cyan-400 uppercase"><Target className="w-3 h-3" /><span>TP2 (Main Target)</span></div>
          <div className="text-sm font-black text-white font-mono mt-1">${selectedItem.tp2.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-300 mt-0.5">Close 60% position</div>
        </div>
        <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-purple-400 uppercase"><Target className="w-3 h-3" /><span>TP3 (Swing Runner)</span></div>
          <div className="text-sm font-black text-white font-mono mt-1">${selectedItem.tp3.toLocaleString()}</div>
          <div className="text-[10px] text-purple-300 mt-0.5">Close remaining 40%</div>
        </div>
        <div className="bg-slate-950 border border-rose-500/30 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-400 uppercase"><Shield className="w-3 h-3" /><span>Stop Loss</span></div>
          <div className="text-sm font-black text-rose-300 font-mono mt-1">${selectedItem.stop_loss.toLocaleString()}</div>
          <div className="text-[10px] text-rose-400 mt-0.5">ATR 1.5x Dynamic SL</div>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300 flex items-center gap-1.5"><BarChart2 className="w-3.5 h-3.5 text-cyan-400" />Real-time Cumulative Volume Delta (CVD)</span>
          <span className="font-mono text-cyan-400">5m Delta: {selectedItem.cvd_delta_5m > 0 ? '+' : ''}{selectedItem.cvd_delta_5m}</span>
        </div>
        <div className="h-28 flex items-end gap-1.5 pt-4 pb-2 px-2 bg-slate-900/50 rounded-lg border border-slate-800/50 overflow-x-auto">
          {cvdSeries.map((val, idx) => {
            const isPos = val >= 0;
            const maxVal = Math.max(...cvdSeries.map(Math.abs), 50);
            const heightPct = Math.min(100, Math.max(15, (Math.abs(val) / maxVal) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-[12px]">
                <div className={`w-full rounded-t-sm transition-all duration-300 ${isPos ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : 'bg-gradient-to-t from-rose-600 to-pink-400'}`} style={{ height: `${heightPct}%` }} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>T-25 Candles</span>
          <span className="text-emerald-400 font-bold">&bull; CVD Delta Expansion Confirmed</span>
          <span>Latest (Live)</span>
        </div>
      </div>
    </div>
  );
};
