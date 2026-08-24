import React from 'react';
import { Bot, Terminal } from 'lucide-react';

export const FreqtradePanel: React.FC = () => {
  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Freqtrade Engine Controller</h3>
            <p className="text-xs text-slate-400">OrderFlowRegimeStrategy &bull; Binance Futures USDS-M</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-black">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTOPILOT ON</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Strategy Mode</span>
          <span className="text-sm font-black text-cyan-300 mt-0.5 block">10-Pt Flow Matrix</span>
          <span className="text-[10px] text-slate-500">ATR Dynamic TP/SL</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Execution Filter</span>
          <span className="text-sm font-black text-emerald-400 mt-0.5 block">Score &ge; 7 VALID</span>
          <span className="text-[10px] text-slate-500">Max Open: 5 Trades</span>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3.5 font-mono text-[11px] space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-sans">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Freqtrade Execution Stream
          </span>
          <span className="text-[10px] text-slate-500">WebSocket Connected</span>
        </div>
        <div className="space-y-1.5 text-[10px] text-slate-300 max-h-[160px] overflow-y-auto">
          <div className="text-slate-500">[System] OrderFlowRegimeStrategy loaded into Freqtrade kernel.</div>
          <div className="text-cyan-400">[Strategy] Scanning Binance Futures 5m klines + CVD delta...</div>
          <div className="text-emerald-400">[Score 9/10] BTCUSDT STRONG: Trend +2, Vol +2, CVD +2, Sweep +2, OI +1.</div>
          <div className="text-emerald-400">[Score 9/10] SOLUSDT STRONG: Long wick rejection confirmed @ $184.2.</div>
          <div className="text-slate-400">[Filter] DOGEUSDT Score 7/10: Valid short flow confirmed.</div>
        </div>
      </div>
    </div>
  );
};
