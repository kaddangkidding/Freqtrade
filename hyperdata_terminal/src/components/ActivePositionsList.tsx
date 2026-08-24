import React from 'react';
import type { ActivePosition } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Shield, Target } from 'lucide-react';

interface Props {
  positions: ActivePosition[];
}

export const ActivePositionsList: React.FC<Props> = ({ positions }) => {
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Active Live Positions</h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">0 OPEN</span>
        </div>
        <div className="py-8 text-center text-slate-500 text-xs space-y-1">
          <p className="font-bold text-slate-400">No active positions open right now.</p>
          <p className="text-slate-600">The 10-Point Flow Matrix is actively screening 300+ Binance Futures markets for Grade A setups.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <h3 className="text-base font-bold text-white tracking-tight">Active Live Positions ({positions.length})</h3>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">
          LIVE EXECUTION
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {positions.map((pos) => {
          const isLong = pos.direction === 'LONG';
          const isProfit = pos.unrealizedPnl >= 0;

          return (
            <div
              key={pos.symbol}
              className={`rounded-2xl border p-4 transition-all ${
                isProfit
                  ? 'bg-slate-950/90 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-xs font-black flex items-center gap-1 ${
                      isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {pos.direction}
                  </span>
                  <span className="text-base font-black text-white">{pos.symbol}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300">
                    {pos.leverage}x
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-lg font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Prices Bar */}
              <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-xl bg-slate-900 text-xs font-mono">
                <div>Entry: <strong className="text-white">${pos.entryPrice.toLocaleString()}</strong></div>
                <div className="text-right">Mark: <strong className={isProfit ? 'text-emerald-400' : 'text-amber-400'}>${pos.markPrice.toLocaleString()}</strong></div>
              </div>

              {/* Target Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
                <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-2">
                  <div className="text-[9px] font-bold text-emerald-400">TP1 (BE)</div>
                  <div className="text-xs font-black text-white mt-0.5">${pos.tp1.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-2">
                  <div className="text-[9px] font-bold text-cyan-400">TP2 (60%)</div>
                  <div className="text-xs font-black text-white mt-0.5">${pos.tp2.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-2">
                  <div className="text-[9px] font-bold text-purple-400">TP3 (Runner)</div>
                  <div className="text-xs font-black text-white mt-0.5">${pos.tp3.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-2">
                  <div className="text-[9px] font-bold text-rose-400">Stop Loss</div>
                  <div className="text-xs font-black text-rose-300 mt-0.5">${pos.stopLoss.toLocaleString()}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
