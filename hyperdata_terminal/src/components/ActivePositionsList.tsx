import React, { useState } from 'react';
import type { ActivePosition } from '../types/flow';
import { Activity, ArrowDownRight, ArrowUpRight, CheckCircle2, DollarSign, Layers, Radio, Shield, Sparkles, Target, Zap } from 'lucide-react';

interface Props {
  positions: ActivePosition[];
}

export const ActivePositionsList: React.FC<Props> = ({ positions }) => {
  // Demo simulation mode toggle when positions is 0 so user can see live active metrics anytime
  const [showDemo, setShowDemo] = useState<boolean>(false);

  const demoPositions: ActivePosition[] = [
    {
      symbol: 'BTCUSDT',
      direction: 'LONG',
      size: 0.05,
      notional: 4572.5,
      margin: 228.6,
      leverage: 20,
      entryPrice: 91450.0,
      markPrice: 91820.0,
      unrealizedPnl: 18.50,
      unrealizedPnlPct: 8.09,
      liquidationPrice: 87120.0,
      tp1: 92540.0,
      tp2: 93640.0,
      tp3: 95200.0,
      stopLoss: 90100.0,
    },
    {
      symbol: 'SOLUSDT',
      direction: 'LONG',
      size: 15.0,
      notional: 2826.0,
      margin: 141.3,
      leverage: 20,
      entryPrice: 188.4,
      markPrice: 190.8,
      unrealizedPnl: 36.00,
      unrealizedPnlPct: 25.47,
      liquidationPrice: 179.5,
      tp1: 191.5,
      tp2: 194.8,
      tp3: 199.5,
      stopLoss: 184.2,
    }
  ];

  const displayPositions = positions.length > 0 ? positions : showDemo ? demoPositions : [];
  const totalUnrealized = displayPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

  return (
    <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-slate-800/90 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-lg shadow-amber-950/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">Real-Time Open Positions Monitor</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  displayPositions.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {displayPositions.length} ACTIVE CONTRACTS
              </span>
            </div>
            <p className="text-xs text-slate-400">Live Binance Futures mark price, TP1/TP2/TP3 targets &amp; ROE %</p>
          </div>
        </div>

        {/* Right Status Actions */}
        <div className="flex items-center gap-2">
          {positions.length === 0 && (
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-xs px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-bold transition-all"
            >
              {showDemo ? 'Hide Preview' : '👁️ View Live Tracker Preview'}
            </button>
          )}

          {displayPositions.length > 0 && (
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold font-mono">
              Floating PnL:{' '}
              <span className={`text-sm font-black ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Positions Display */}
      {displayPositions.length === 0 ? (
        <div className="py-10 text-center bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Radio className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-300">0 Active Open Positions on Binance Futures</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The 10-Point Quantitative Flow Bot is actively scanning 300+ markets. When a Grade A setup (Score &ge; 7) triggers, it will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPositions.map((pos) => {
            const isLong = pos.direction === 'LONG';
            const isProfit = pos.unrealizedPnl >= 0;

            return (
              <div
                key={pos.symbol}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  isProfit
                    ? 'bg-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/20 ring-1 ring-emerald-500/20'
                    : 'bg-slate-950 border-rose-500/40 shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/20'
                }`}
              >
                {/* Header: Pair, Direction, ROE % */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{pos.symbol}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-black flex items-center gap-0.5 ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {pos.direction}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {pos.leverage}x
                    </span>
                  </div>

                  <div className="text-right font-mono">
                    <div className={`text-xl font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${isProfit ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isProfit ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}% ROE
                    </div>
                  </div>
                </div>

                {/* Entry vs Mark Price vs Liquidation */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Entry Price</span>
                    <span className="text-white font-bold">${pos.entryPrice.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Mark Price</span>
                    <span className={`font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${pos.markPrice.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block uppercase">Liq Price</span>
                    <span className="text-rose-400 font-bold">${pos.liquidationPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Target Cards TP1, TP2, TP3, SL */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-emerald-400 uppercase">TP1 (BE Lock)</div>
                    <div className="text-xs font-black text-white mt-0.5">${pos.tp1.toLocaleString()}</div>
                    <div className="text-[8px] text-emerald-300 mt-0.5">+1.2% Breakeven</div>
                  </div>

                  <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-cyan-400 uppercase">TP2 (60% Close)</div>
                    <div className="text-xs font-black text-white mt-0.5">${pos.tp2.toLocaleString()}</div>
                    <div className="text-[8px] text-cyan-300 mt-0.5">+2.4% Scalp Target</div>
                  </div>

                  <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-purple-400 uppercase">TP3 (Runner)</div>
                    <div className="text-xs font-black text-white mt-0.5">${pos.tp3.toLocaleString()}</div>
                    <div className="text-[8px] text-purple-300 mt-0.5">+4.2% Swing Target</div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-rose-400 uppercase">Stop Loss</div>
                    <div className="text-xs font-black text-rose-300 mt-0.5">${pos.stopLoss.toLocaleString()}</div>
                    <div className="text-[8px] text-rose-400 mt-0.5">1.5x Dynamic ATR</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
