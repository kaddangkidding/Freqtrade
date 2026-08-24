import React from 'react';
import type { IncomeRecord } from '../types/flow';
import { Calendar } from 'lucide-react';

interface Props {
  records: IncomeRecord[];
}

export const PnlDailyCalendar: React.FC<Props> = ({ records }) => {
  const safeRecords = Array.isArray(records) ? records : [];

  const dailyMap: Record<string, { pnl: number; count: number; wins: number }> = {};

  for (const r of safeRecords) {
    const d = r.date || new Date().toISOString().split('T')[0];
    if (!dailyMap[d]) {
      dailyMap[d] = { pnl: 0, count: 0, wins: 0 };
    }
    dailyMap[d].pnl += r.income;
    dailyMap[d].count += 1;
    if (r.income > 0) dailyMap[d].wins += 1;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  const daysArray = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const entry = dailyMap[dateStr] || null;
    return {
      day: dayNum,
      date: dateStr,
      data: entry,
      isToday: dayNum === now.getDate(),
    };
  });

  const monthTotalPnl = Object.values(dailyMap).reduce((sum, d) => sum + d.pnl, 0);
  const monthWinningDays = Object.values(dailyMap).filter((d) => d.pnl > 0).length;
  const monthLosingDays = Object.values(dailyMap).filter((d) => d.pnl < 0).length;

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">PnL Daily Performance Calendar</h3>
            <p className="text-xs text-slate-400">{monthName} {year} &bull; Daily profit &amp; win rate tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-bold">
            Month Net: <span className={monthTotalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{monthTotalPnl >= 0 ? '+' : ''}${monthTotalPnl.toFixed(2)}</span>
          </div>
          <div className="bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 font-bold">
            Green Days: <span className="text-emerald-400">{monthWinningDays}W</span> / <span className="text-rose-400">{monthLosingDays}L</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dw) => (
          <div key={dw} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-1">
            {dw}
          </div>
        ))}

        {daysArray.map((item) => {
          const hasTrade = item.data !== null && item.data.count > 0;
          const isPos = hasTrade && item.data!.pnl >= 0;

          return (
            <div
              key={item.day}
              className={`rounded-xl p-2 min-h-[64px] flex flex-col justify-between border transition-all ${
                item.isToday
                  ? 'ring-1 ring-cyan-400 bg-slate-950 border-cyan-500/50'
                  : hasTrade
                  ? isPos
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950/40'
                    : 'bg-rose-950/30 border-rose-500/40 shadow-sm shadow-rose-950/40'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className={`font-bold ${item.isToday ? 'text-cyan-300' : 'text-slate-400'}`}>{item.day}</span>
                {item.isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </div>

              {hasTrade ? (
                <div className="font-mono mt-1">
                  <div className={`text-xs font-black ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? '+' : ''}${item.data!.pnl.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {item.data!.count} trades
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-600 font-mono">-</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
