import React, { useState } from 'react';
import type { FlowMarketData } from '../types/flow';
import { ArrowDownRight, ArrowUpRight, Filter, Flame, Layers, Search, Sparkles, TrendingDown, TrendingUp, Zap } from 'lucide-react';

interface Props {
  data: FlowMarketData[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const FlowMatrixRadar: React.FC<Props> = ({ data, selectedSymbol, onSelectSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'HIGH_SCORE' | 'LOW_CAPS' | 'ALL' | 'GAINERS' | 'LOSERS'>('HIGH_SCORE');

  // Filter & search logic
  const filteredData = data.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase().trim());
    if (!matchesSearch) return false;

    if (activeFilter === 'HIGH_SCORE') return item.total_score >= 7;
    if (activeFilter === 'LOW_CAPS') return (item.volume_24h_usd <= 80000000 && Math.abs(item.price_change_24h) >= 5.0) || item.total_score >= 8;
    if (activeFilter === 'GAINERS') return item.price_change_24h > 0;
    if (activeFilter === 'LOSERS') return item.price_change_24h < 0;
    return true; // ALL
  });

  // Sort based on filter
  const sortedData = [...filteredData].sort((a, b) => {
    if (activeFilter === 'LOW_CAPS') return Math.abs(b.price_change_24h) - Math.abs(a.price_change_24h);
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
            <p className="text-xs text-slate-400">Real-time 10-Point Score & low-cap breakout radar across all Binance USDT perpetuals</p>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search coin (e.g. GRASS, PORTAL, RATS)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors w-48 sm:w-64 font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveFilter('HIGH_SCORE')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeFilter === 'HIGH_SCORE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Score &ge; 7
            </button>
            <button
              onClick={() => setActiveFilter('LOW_CAPS')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeFilter === 'LOW_CAPS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              🔥 Low Caps
            </button>
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'ALL'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({data.length})
            </button>
            <button
              onClick={() => setActiveFilter('GAINERS')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'GAINERS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Gainers
            </button>
            <button
              onClick={() => setActiveFilter('LOSERS')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'LOSERS'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              Losers
            </button>
          </div>
        </div>
      </div>

      {/* Markets Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[580px] overflow-y-auto pr-1">
        {sortedData.map((item) => {
          const isSelected = item.symbol === selectedSymbol;
          const isLong = item.direction === 'LONG';
          const isPositive = item.price_change_24h >= 0;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Header: Symbol & 24h Change */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-wide">{item.symbol}</span>
                  {item.vol_ratio >= 1.8 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      VOL ⚡
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isPositive ? '+' : ''}
                  {item.price_change_24h.toFixed(2)}%
                </div>
              </div>

              {/* Price & Score Badge */}
              <div className="flex items-baseline justify-between mt-2 font-mono">
                <span className="text-base font-black text-slate-100">
                  ${item.current_price < 0.1 ? item.current_price.toFixed(5) : item.current_price < 10 ? item.current_price.toFixed(4) : item.current_price.toLocaleString()}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                    item.total_score >= 9
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      : item.total_score >= 7
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : item.total_score >= 5
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.total_score}/10 {item.rating}
                </span>
              </div>

              {/* CVD & Sweeps Details */}
              <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                <div>
                  CVD:{' '}
                  <span className={`font-bold ${item.cvd_trend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.cvd_trend}
                  </span>
                </div>
                <div className="text-right">
                  Vol: <span className="text-slate-200 font-bold">${(item.volume_24h_usd / 1e6).toFixed(1)}M</span>
                </div>
              </div>

              {/* Direction Indicator */}
              <div className="mt-2 text-center">
                <span
                  className={`block py-1 rounded text-[10px] font-black tracking-wider uppercase ${
                    item.direction === 'LONG'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                      : item.direction === 'SHORT'
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {item.direction === 'NEUTRAL' ? 'WAITING GRADE A' : `${item.direction} BIAS (50x)`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
