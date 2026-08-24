import React from 'react';
import type { AccountPortfolio, ActivePosition } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Bot, DollarSign, PieChart, ShieldCheck, TrendingUp, Wallet, Zap } from 'lucide-react';

interface Props {
  account: AccountPortfolio;
  activePositions: ActivePosition[];
}

export const PortfolioHeader: React.FC<Props> = ({ account, activePositions }) => {
  // Always derive live floating PnL directly from active positions array to guarantee 100% exact parity
  const floatingPnl = activePositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const activeCount = activePositions.length;
  const isRealizedPositive = account.netRealizedPnl >= 0;
  const isUnrealizedPositive = floatingPnl >= 0;
  const liveTotalEquity = account.walletBalance + floatingPnl;
  const totalMarginUsed = activePositions.reduce((sum, p) => sum + p.margin, 0);
  const liveAvailableBalance = Math.max(0, account.walletBalance - totalMarginUsed);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Today Realized PnL */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 flex flex-col gap-1 transition-all ${
          isRealizedPositive
            ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
            : 'bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-950/30'
        }`}
      >
        <div
          className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl ${
            isRealizedPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}
        />
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Today Realized PnL
          </span>
          <div
            className={`p-1.5 rounded-lg ${
              isRealizedPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {isRealizedPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
        </div>
        <div
          className={`text-3xl sm:text-4xl font-black tracking-tight ${
            isRealizedPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isRealizedPositive ? '+' : ''}${account.netRealizedPnl.toFixed(2)}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1">
          {account.winTrades} Wins / {account.loseTrades} Losses &bull; {account.totalTrades} Total Closed
        </div>
      </div>

      {/* 2. Floating Live PnL (100% Exactly Matches Positions List) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isUnrealizedPositive ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
            Floating Unrealized PnL
          </span>
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-3xl sm:text-4xl font-black tracking-tight transition-colors duration-200 ${
            floatingPnl > 0 ? 'text-emerald-400' : floatingPnl < 0 ? 'text-rose-400' : 'text-slate-300'
          }`}
        >
          {floatingPnl > 0 ? '+' : ''}${floatingPnl.toFixed(4)}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1">
          <span className="text-amber-400 font-extrabold">{activeCount} Active Contract{activeCount !== 1 ? 's' : ''}</span>
          <span className="text-slate-500">&bull; Live Exact Sum</span>
        </div>
      </div>

      {/* 3. Live Futures Equity */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider">Live Futures Equity</span>
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          ${liveTotalEquity.toFixed(2)}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1">
          Free: <span className="text-emerald-400">${liveAvailableBalance.toFixed(2)}</span> &bull; Margin: <span className="text-amber-400">${totalMarginUsed.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. Bot Win Rate */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider">Bot Win Rate</span>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Bot className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">
          {account.winRate.toFixed(1)}%
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-extrabold">24/7 Autopilot Active</span>
        </div>
      </div>
    </div>
  );
};
