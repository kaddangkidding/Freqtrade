import React from 'react';
import { Bot, CheckCircle, Flame, Play, Shield, Terminal, Zap } from 'lucide-react';

export const FreqtradePanel: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Freqtrade Flow Matrix Kernel</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                24/7 AUTOPILOT ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Binance Futures Strategy Execution Daemon</p>
          </div>
        </div>

        {/* Dynamic Margin Rule Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Position Sizing: 7.0% Margin / Trade (50x)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Max Capacity: 14 Trades</span>
          </div>
        </div>
      </div>

      {/* Execution Matrix Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block uppercase text-[10px]">Position Margin</span>
          <span className="text-amber-300 font-extrabold text-sm">7.0% of Equity</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block uppercase text-[10px]">Default Leverage</span>
          <span className="text-cyan-400 font-extrabold text-sm">50x Cross</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block uppercase text-[10px]">Entry Trigger</span>
          <span className="text-emerald-400 font-extrabold text-sm">Score &ge; 7 / 10</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
          <span className="text-slate-500 block uppercase text-[10px]">Risk Management</span>
          <span className="text-rose-400 font-extrabold text-sm">1.5x Dynamic ATR</span>
        </div>
      </div>

      {/* Strategy Highlights Log */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-1.5">
        <div className="text-slate-500 font-bold uppercase text-[10px] flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          Live Strategy Execution Rules
        </div>
        <p className="text-slate-300">
          &bull; <strong>7% Dynamic Margin Sizing:</strong> Slices total wallet balance into 7% per trade, allowing up to 14 diversified positions without margin depletion.
        </p>
        <p className="text-slate-400">
          &bull; <strong>10-Point Score:</strong> Volume Expansion (+2), CVD Delta (+2), Liquidity Sweeps (+2), Regime Trend (+2), OI (+1), Funding (+1).
        </p>
        <p className="text-slate-400">
          &bull; <strong>Trailing Targets:</strong> TP1 (1.2% Breakeven Lock) &bull; TP2 (2.4% Scalp 60% Close) &bull; TP3 (4.2% Trailing Runner).
        </p>
      </div>
    </div>
  );
};
