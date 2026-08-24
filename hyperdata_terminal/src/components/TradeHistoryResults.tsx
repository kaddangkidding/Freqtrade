import React, { useState } from 'react';
import type { IncomeRecord } from '../types/flow';
import { ArrowDownUp, History } from 'lucide-react';

interface Props {
  records: IncomeRecord[];
}

export const TradeHistoryResults: React.FC<Props> = ({ records }) => {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const safeRecords = Array.isArray(records) ? records : [];
  const sortedRecords = [...safeRecords].sort((a, b) => {
    return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  const totalTrades = safeRecords.length;
  const netPnl = safeRecords.reduce((sum, r) => sum + r.income, 0);
  const wins = safeRecords.filter((r) => r.income > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Realized Trade Results History</h3>
            <p className="text-xs text-slate-400">Completed closed executions &amp; net profit per trade</p>
          </div>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            onClick={() => setSortOrder((p) => (p === 'newest' ? 'oldest' : 'newest'))}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-slate-300 transition-all"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-bold">
            Trades: <span className="text-white">{totalTrades}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-bold">
            Net PnL: <span className={netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{netPnl >= 0 ? '+' : ''}${netPnl.toFixed(2)}</span>
          </div>

          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-bold">
            Win Rate: <span className="text-cyan-400">{winRate.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Trade Rows */}
      {sortedRecords.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No closed trade records found yet.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2">
                <th className="pb-2.5 font-semibold">Time</th>
                <th className="pb-2.5 font-semibold">Contract</th>
                <th className="pb-2.5 font-semibold">Result</th>
                <th className="pb-2.5 font-semibold text-right">Realized Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedRecords.map((r, idx) => {
                const isProfit = r.income > 0;
                const isLoss = r.income < 0;

                return (
                  <tr key={r.tradeId || idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-slate-400">{r.time}</td>
                    <td className="py-2.5 font-bold text-white">
                      <span>{r.symbol}</span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                          isProfit
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : isLoss
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isProfit ? 'WIN' : isLoss ? 'LOSS' : 'FLAT'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-sm">
                      <span className={isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}>
                        {r.income >= 0 ? '+' : ''}${r.income.toFixed(2)} {r.asset}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
