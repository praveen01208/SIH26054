import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { Clock, TrendingDown, Wrench } from 'lucide-react';

export const RULPredictor: React.FC = () => {
  const { aiDiagnostics } = useTwinStore();
  const d = aiDiagnostics;

  const minBound = Math.max(0, d.rulHours - d.rulUncertaintyMarginHours).toFixed(1);
  const maxBound = (d.rulHours + d.rulUncertaintyMarginHours).toFixed(1);

  const getRulStatus = () => {
    if (d.rulHours > 200) return { label: 'MISSION NOMINAL', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/30' };
    if (d.rulHours > 50) return { label: 'SCHEDULED INSPECTION', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/30' };
    return { label: 'EXPEDITE ABORT / LANDING', color: 'text-rose-400', border: 'border-rose-500/80', bg: 'bg-rose-950/40' };
  };

  const status = getRulStatus();

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            6. Prognostic Remaining Useful Life (RUL)
          </h2>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${status.bg} ${status.color} ${status.border}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Main Countdown (6 cols) */}
        <div className="sm:col-span-6 bg-aerospace-950/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400">ESTIMATED TIME BEFORE OVERHAUL (TBO):</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-tech font-bold ${status.color}`}>
              {d.rulHours}
            </span>
            <span className="text-sm font-mono text-slate-400">FLIGHT HRS</span>
          </div>

          {/* Uncertainty Band */}
          <div className="flex items-center justify-between text-[11px] font-mono bg-aerospace-900 px-2 py-1 rounded border border-slate-800 text-slate-300 mt-1">
            <span className="text-slate-400">Uncertainty Envelope (±15%):</span>
            <span className="text-cyan-300 font-bold">[{minBound}h — {maxBound}h]</span>
          </div>
        </div>

        {/* Degradation Metrics & Action (6 cols) */}
        <div className="sm:col-span-6 flex flex-col gap-2">
          <div className="bg-aerospace-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span className="text-slate-400">Wear Acceleration:</span>
            </div>
            <span className={`font-bold ${d.rulDegradationRate > 2 ? 'text-rose-400' : 'text-slate-200'}`}>
              {d.rulDegradationRate}x Std Rate
            </span>
          </div>

          <div className="bg-aerospace-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Action:</span>
            </div>
            <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[150px]">
              {d.healthIndex < 40 ? 'Immediate RTB / Engine Teardown' : d.healthIndex < 70 ? 'Inspect Post-Sortie' : 'Continue Flight Profile'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
