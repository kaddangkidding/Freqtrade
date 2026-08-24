import React from 'react';
import type { FlowMarketData } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Layers } from 'lucide-react';

interface Props {
  data: FlowMarketData[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const FlowMatrixRadar: React.FC<Props> = ({ data, selectedSymbol, onSelectSymbol }) => {
  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">10-Point Flow Matrix Radar</h2>
            <p className="text-xs text-slate-400">Regime (+2) &bull; Volume (+2) &bull; CVD (+2) &bull; Sweep (+2) &bull; OI (+1) &bull; Funding (+1)</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono">Min Threshold: 7/10 VALID</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {data.map((item) => {
          const isSelected = item.symbol === selectedSymbol;
          const isLong = item.direction === 'LONG';
          const isShort = item.direction === 'SHORT';
          const isStrong = item.rating === 'STRONG';
          const isValid = item.rating === 'VALID';

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">{item.symbol}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-0.5 ${isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : isShort ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-400'}`}>
                    {isLong ? <ArrowUpRight className="w-3 h-3" /> : isShort ? <ArrowDownRight className="w-3 h-3" /> : null}
                    {item.direction}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${isStrong ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : isValid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {item.total_score}/10 {item.rating}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono py-1.5 px-2 bg-slate-900/90 rounded-lg border border-slate-800 mb-3">
                <span className="text-slate-300 font-bold">${item.current_price.toLocaleString()}</span>
                <span className={`font-bold ${item.cvd_trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  CVD {item.cvd_trend === 'BULLISH' ? '▲' : '▼'} {item.cvd_delta_5m > 0 ? '+' : ''}{item.cvd_delta_5m}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Score Weight</span>
                  <span>{item.total_score >= 7 ? '🚀 Trade Signal Active' : 'Filter Pending'}</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full rounded-full transition-all duration-500 ${isStrong ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : isValid ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-700'}`} style={{ width: `${(item.total_score / 10) * 100}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2.5 mt-2.5 border-t border-slate-800/80 text-[10px] font-mono text-center">
                <div className="bg-slate-900/60 p-1 rounded">
                  <div className="text-slate-500">Vol</div>
                  <div className="text-cyan-300 font-bold">{item.vol_ratio}x</div>
                </div>
                <div className="bg-slate-900/60 p-1 rounded">
                  <div className="text-slate-500">Sweep</div>
                  <div className={`font-bold ${item.bull_sweep || item.bear_sweep ? 'text-emerald-400' : 'text-slate-500'}`}>{item.bull_sweep ? 'BULL' : item.bear_sweep ? 'BEAR' : 'NO'}</div>
                </div>
                <div className="bg-slate-900/60 p-1 rounded">
                  <div className="text-slate-500">Fund</div>
                  <div className="text-slate-300 font-bold">{item.funding_rate}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
