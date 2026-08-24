import React, { useState } from 'react';
import type { FlowMarketData } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Filter, Flame, Layers, Search, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  data: FlowMarketData[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const FlowMatrixRadar: React.FC<Props> = ({ data, selectedSymbol, onSelectSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'HIGH_SCORE' | 'ALL' | 'GAINERS' | 'LOSERS'>('HIGH_SCORE');

  // Filter & search logic
  const filteredData = data.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (activeFilter === 'HIGH_SCORE') return item.total_score >= 7;
    if (activeFilter === 'GAINERS') return item.price_change_24h > 0;
    if (activeFilter === 'LOSERS') return item.price_change_24h < 0;
    return true; // ALL
  });

  // Sort based on filter
  const sortedData = [...filteredData].sort((a, b) => {
    if (activeFilter === 'GAINERS') return b.price_change_24h - a.price_change_24h;
    if (activeFilter === 'LOSERS') return a.price_change_24h - b.price_change_24h;
    return b.total_score - a.total_score || b.volume_24h_usd - a.volume_24h_usd;
  });

  return (
    <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Full-Market Flow Matrix Scanner</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {data.length} Markets
              </span>
            </div>
            <p className="text-xs text-slate-400">Real-time 10-Point Score for all Binance Perpetual Futures pairs</p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coin (e.g. BTC, DOGE)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-44 transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveFilter('HIGH_SCORE')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'HIGH_SCORE'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Score &ge; 7</span>
            </button>

            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({data.length})
            </button>

            <button
              onClick={() => setActiveFilter('GAINERS')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'GAINERS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Gainers</span>
            </button>

            <button
              onClick={() => setActiveFilter('LOSERS')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'LOSERS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Losers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Coins */}
      {sortedData.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          No matching coins found for &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[560px] overflow-y-auto pr-1">
          {sortedData.map((item) => {
            const isSelected = item.symbol === selectedSymbol;
            const isLong = item.direction === 'LONG';
            const isShort = item.direction === 'SHORT';
            const isStrong = item.rating === 'STRONG';
            const isValid = item.rating === 'VALID';
            const volM = (item.volume_24h_usd / 1000000).toFixed(1);

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                {/* Symbol Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white">{item.symbol.replace('USDT', '')}</span>
                    <span className="text-[10px] text-slate-500 font-mono">USDT</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                        isLong
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isLong ? 'LONG' : 'SHORT'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black border ${
                      isStrong
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : isValid
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.total_score}/10 {item.rating}
                  </span>
                </div>

                {/* Price & 24h Pct */}
                <div className="flex items-center justify-between text-xs font-mono py-1 px-2 bg-slate-900 rounded-lg border border-slate-800/80 mb-2.5">
                  <span className="text-white font-bold">${item.current_price.toLocaleString()}</span>
                  <span
                    className={`font-black flex items-center ${
                      item.price_change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.price_change_24h >= 0 ? '+' : ''}{item.price_change_24h.toFixed(2)}%
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStrong
                          ? 'bg-emerald-400'
                          : isValid
                          ? 'bg-cyan-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${(item.total_score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 mt-2 border-t border-slate-800/60">
                  <span>Vol: <strong className="text-slate-200">${volM}M</strong></span>
                  <span className={item.cvd_trend === 'BULLISH' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    CVD {item.cvd_trend === 'BULLISH' ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
