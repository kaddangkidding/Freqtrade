import React, { useEffect, useState } from 'react';
import type { ActivePosition } from '../types/flow';
import { ArrowUpRight, ArrowDownRight, Bell, CheckCircle, Crosshair, DollarSign, ShieldAlert, Sparkles, Target, X, Zap } from 'lucide-react';

interface Props {
  alertPosition: ActivePosition | null;
  onClose: () => void;
}

export const PositionAlertModal: React.FC<Props> = ({ alertPosition, onClose }) => {
  const [progress, setProgress] = useState(100);

  // Play crisp dual-tone audio chime on pop-up
  useEffect(() => {
    if (!alertPosition) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        
        // Tone 1 (High bell)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.35);

        // Tone 2 (Harmonic confirmation chime)
        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318.51, ctx.currentTime); // E6
            gain2.gain.setValueAtTime(0.12, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.4);
          } catch (e) {}
        }, 120);
      }
    } catch (e) {}

    // Auto-dismiss countdown timer (8 seconds)
    setProgress(100);
    const duration = 8000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [alertPosition, onClose]);

  if (!alertPosition) return null;

  const isLong = alertPosition.direction === 'LONG';
  const formatPrice = (val: number) => {
    if (val < 0.1) return val.toFixed(5);
    if (val < 10) return val.toFixed(4);
    return val.toFixed(2);
  };

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/60 bg-slate-950/95 backdrop-blur-xl p-5 shadow-2xl shadow-cyan-950/80 ring-2 ring-cyan-500/30">
        {/* Glow ambient */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Zap className="w-4 h-4 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  New OrderFlow Position Executed
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">10-Point Score Matrix Triggered &bull; 24/7 Autopilot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Position Badge & Main Stats */}
        <div className="flex items-center justify-between my-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white">{alertPosition.symbol}</span>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-black flex items-center gap-1 ${
                isLong
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {alertPosition.direction}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {alertPosition.leverage}x
            </span>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs text-slate-400 uppercase">Entry Price</div>
            <div className="text-base font-black text-cyan-300">${formatPrice(alertPosition.entryPrice)}</div>
          </div>
        </div>

        {/* Target Cards TP1, TP2, TP3, SL */}
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-1.5">
            <span className="text-[9px] font-black text-emerald-400 block uppercase">TP1 (Lock)</span>
            <span className="font-black text-white text-[11px]">${formatPrice(alertPosition.tp1)}</span>
            <span className="text-[8px] text-emerald-300 block">+1.2%</span>
          </div>
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-1.5 bg-emerald-950/20">
            <span className="text-[9px] font-black text-emerald-400 block uppercase">TP2 (Scalp)</span>
            <span className="font-black text-emerald-300 text-[11px]">${formatPrice(alertPosition.tp2)}</span>
            <span className="text-[8px] text-emerald-300 block">+2.4%</span>
          </div>
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-1.5">
            <span className="text-[9px] font-black text-emerald-400 block uppercase">TP3 (Trail)</span>
            <span className="font-black text-white text-[11px]">${formatPrice(alertPosition.tp3)}</span>
            <span className="text-[8px] text-emerald-300 block">+4.2%</span>
          </div>
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-1.5 bg-rose-950/20">
            <span className="text-[9px] font-black text-rose-400 block uppercase">Stop Loss</span>
            <span className="font-black text-rose-400 text-[11px]">${formatPrice(alertPosition.stopLoss)}</span>
            <span className="text-[8px] text-rose-300 block">1.5x ATR</span>
          </div>
        </div>

        {/* Footer Details */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-900">
          <div>
            Size: <span className="text-white font-bold">{alertPosition.size} {alertPosition.symbol.replace('USDT', '')}</span>
          </div>
          <div>
            Margin: <span className="text-amber-400 font-bold">${alertPosition.margin.toFixed(2)}</span>
          </div>
          <div>
            Notional: <span className="text-cyan-400 font-bold">${alertPosition.notional.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
