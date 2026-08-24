import React, { useState } from 'react';
import type { ActivePosition } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, DollarSign, Lock, Radio, Shield, Target, TrendingUp, Zap } from 'lucide-react';

interface Props {
  positions: ActivePosition[];
  tickDirection?: Record<string, 'UP' | 'DOWN' | 'NONE'>;
}

export const ActivePositionsList: React.FC<Props> = ({ positions, tickDirection = {} }) => {
  const displayPositions = positions;

  const totalUnrealized = displayPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalMarginUsed = displayPositions.reduce((sum, p) => sum + p.margin, 0);

  const formatPnl = (val: number) => {
    const isPos = val >= 0;
    const sign = isPos ? '+' : '';
    const formatted = Math.abs(val) < 1 ? val.toFixed(4) : val.toFixed(2);
    return `${sign}$${formatted}`;
  };

  const formatPrice = (val: number) => {
    if (val < 0.1) return val.toFixed(5);
    if (val < 10) return val.toFixed(4);
    return val.toFixed(2);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background Neon Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">Real-Time Open Positions Monitor</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {displayPositions.length} LIVE CONTRACT{displayPositions.length !== 1 ? 'S' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Ultra-high frequency trade stream &bull; 10-50 ticks/sec &bull; Dynamic ATR trailing
            </p>
          </div>
        </div>

        {/* Floating Quick Summary */}
        <div className="flex items-center gap-2">
          {displayPositions.length > 0 && (
            <div className="bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-bold font-mono flex items-center gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Margin</span>
                <span className="text-amber-400 font-extrabold">${totalMarginUsed.toFixed(2)}</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Floating Live PnL</span>
                <span className={`text-sm font-black transition-colors duration-200 ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPnl(totalUnrealized)}
                </span>
              </div>
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
            The 10-Point Quantitative Flow Bot is actively scanning 300+ markets. When a Grade A setup triggers, it will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayPositions.map((pos) => {
            const isLong = pos.direction === 'LONG';
            const isProfit = pos.unrealizedPnl >= 0;
            const tickDir = tickDirection[pos.symbol] || 'NONE';

            return (
              <div
                key={pos.symbol}
                className={`rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${
                  tickDir === 'UP'
                    ? 'bg-emerald-950/30 border-emerald-400 shadow-xl shadow-emerald-950/40 ring-2 ring-emerald-500/30'
                    : tickDir === 'DOWN'
                    ? 'bg-rose-950/30 border-rose-400 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/30'
                    : isProfit
                    ? 'bg-slate-950 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-slate-950 border-rose-500/40 shadow-lg shadow-rose-950/20'
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
                    {tickDir === 'UP' && (
                      <span className="text-[10px] font-black text-emerald-400 animate-bounce">▲</span>
                    )}
                    {tickDir === 'DOWN' && (
                      <span className="text-[10px] font-black text-rose-400 animate-bounce">▼</span>
                    )}
                  </div>

                  <div className="text-right font-mono">
                    <div
                      className={`text-xl font-black transition-colors duration-150 ${
                        tickDir === 'UP'
                          ? 'text-emerald-300'
                          : tickDir === 'DOWN'
                          ? 'text-rose-300'
                          : isProfit
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatPnl(pos.unrealizedPnl)}
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
                    <span className="text-white font-bold">${formatPrice(pos.entryPrice)}</span>
                  </div>
                  <div
                    className={`rounded-lg p-1 transition-colors duration-150 ${
                      tickDir === 'UP'
                        ? 'bg-emerald-500/20'
                        : tickDir === 'DOWN'
                        ? 'bg-rose-500/20'
                        : 'bg-transparent'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 block uppercase flex items-center justify-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${tickDir === 'UP' ? 'bg-emerald-400' : tickDir === 'DOWN' ? 'bg-rose-400' : 'bg-cyan-400'} animate-pulse`} />
                      Mark Price
                    </span>
                    <span className={`font-black ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${formatPrice(pos.markPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400 block uppercase">Liq Price</span>
                    <span className="text-rose-400 font-bold">${formatPrice(pos.liquidationPrice)}</span>
                  </div>
                </div>

                {/* Target Cards TP1, TP2, TP3, SL */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-emerald-400 uppercase">TP1 (BE Lock)</div>
                    <div className="text-xs font-black text-white mt-0.5">${formatPrice(pos.tp1)}</div>
                    <div className="text-[8px] text-emerald-300 mt-0.5">+1.2% Breakeven</div>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-2 bg-emerald-950/20">
                    <div className="text-[9px] font-black text-emerald-400 uppercase">TP2 (Scalp)</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">${formatPrice(pos.tp2)}</div>
                    <div className="text-[8px] text-emerald-300 mt-0.5">+2.4% 60% Close</div>
                  </div>

                  <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-2">
                    <div className="text-[9px] font-black text-emerald-400 uppercase">TP3 (Runner)</div>
                    <div className="text-xs font-black text-white mt-0.5">${formatPrice(pos.tp3)}</div>
                    <div className="text-[8px] text-emerald-300 mt-0.5">+4.2% Trail 40%</div>
                  </div>

                  <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-2 bg-rose-950/20">
                    <div className="text-[9px] font-black text-rose-400 uppercase">ATR Stop Loss</div>
                    <div className="text-xs font-black text-rose-400 mt-0.5">${formatPrice(pos.stopLoss)}</div>
                    <div className="text-[8px] text-rose-300 mt-0.5">Dynamic 1.5x ATR</div>
                  </div>
                </div>

                {/* Footer Details: Size, Margin, Notional */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-900">
                  <div>
                    Size: <span className="text-slate-200 font-bold">{pos.size} {pos.symbol.replace('USDT', '')}</span>
                  </div>
                  <div>
                    Margin: <span className="text-amber-400 font-bold">${pos.margin.toFixed(2)}</span>
                  </div>
                  <div>
                    Notional: <span className="text-cyan-400 font-bold">${pos.notional.toFixed(2)}</span>
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
