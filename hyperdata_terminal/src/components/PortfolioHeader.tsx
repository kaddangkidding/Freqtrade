import React from 'react';
import type { AccountPortfolio } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Bot, DollarSign, PieChart, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';

interface Props {
  account: AccountPortfolio;
  activeCount: number;
}

export const PortfolioHeader: React.FC<Props> = ({ account, activeCount }) => {
  const isRealizedPositive = account.netRealizedPnl >= 0;
  const isUnrealizedPositive = account.unrealizedPnl >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Today Realized PnL (Big Hero Metric) */}
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
          <span className="text-xs font-bold uppercase tracking-wider">Today Realized PnL</span>
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
          {account.winTrades} Wins / {account.loseTrades} Losses &bull; Closed Trades
        </div>
      </div>

      {/* 2. Floating Unrealized PnL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider">Unrealized PnL</span>
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-3xl sm:text-4xl font-black tracking-tight ${
            isUnrealizedPositive ? 'text-amber-400' : 'text-rose-400'
          }`}
        >
          {isUnrealizedPositive ? '+' : ''}${account.unrealizedPnl.toFixed(2)}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1">
          {activeCount} Active Open Position{activeCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* 3. Total Equity & Wallet Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-bold uppercase tracking-wider">Futures Equity</span>
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          ${account.totalEquity.toFixed(2)}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1">
          Free: <span className="text-emerald-400">${account.availableBalance.toFixed(2)}</span> &bull; Used: <span className="text-amber-400">${account.marginUsed.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. Win Rate & Bot Status */}
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
          <span className="text-emerald-400 font-extrabold">Freqtrade 24/7 Autopilot</span>
        </div>
      </div>
    </div>
  );
};
