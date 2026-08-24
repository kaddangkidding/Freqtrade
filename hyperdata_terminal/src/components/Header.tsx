import React from 'react';
import { Bot, RefreshCw, Zap } from 'lucide-react';

interface Props {
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
  ticksPerSec?: number;
}

export const Header: React.FC<Props> = ({
  lastUpdated,
  onRefresh,
  isLoading,
  ticksPerSec = 24,
}) => {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-cyan-500/20">
          ⚡
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white">HyperData Terminal</h1>
            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 rounded-md">
              Freqtrade Flow Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400">Institutional Order Flow, CVD Delta & 10-Point Scoring Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200">Freqtrade:</span>
          <span className="text-emerald-400 font-extrabold">24/7 ACTIVE</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            {ticksPerSec} Ticks/sec
          </span>
        </div>

        <button onClick={onRefresh} className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-all" title="Refresh Flow Data">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
