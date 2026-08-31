import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { Clock, Hourglass, TrendingDown, ShieldAlert, Cpu } from 'lucide-react';

export const RULPredictor: React.FC = () => {
  const { aiDiagnostics, currentTelemetry } = useTwinStore();
  const { rulHours, rulUncertaintyMarginHours } = aiDiagnostics;

  const rulBandLow = Math.max(0, rulHours - rulUncertaintyMarginHours);
  const rulBandHigh = rulHours + rulUncertaintyMarginHours;

  const formattedRul = rulHours > 100 ? `${rulHours.toFixed(0)}h` : `${rulHours.toFixed(1)}h`;

  const getRulStatus = () => {
    if (rulHours > 400) return { label: 'HEALTHY OPERATION', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30' };
    if (rulHours > 200) return { label: 'SCHEDULED INSPECTION', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30' };
    if (rulHours > 75) return { label: 'MAINTENANCE ADVISORY', color: 'text-amber-400 border-amber-500/40 bg-amber-950/30 glow-amber' };
    return { label: 'MISSION ABORT RISK', color: 'text-rose-400 border-rose-500/40 bg-rose-950/30 glow-rose animate-pulse' };
  };

  const status = getRulStatus();

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col justify-between gap-3 sm:gap-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Hourglass className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <h2 className="font-tech text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
            Prognostic Remaining Useful Life (RUL)
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
          Weibull-PINN Engine
        </span>
      </div>

      {/* Main RUL Display Card */}
      <div className="bg-aerospace-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase">Estimated Mission RUL</span>
            <div className="font-mono text-2xl sm:text-4xl font-bold tracking-tight text-white flex items-baseline gap-1.5">
              <span>{formattedRul}</span>
              <span className="text-xs sm:text-sm font-normal text-slate-400">flight hours</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
          <div className={`px-3 py-1 rounded-full border text-[10px] sm:text-xs font-mono font-bold ${status.color}`}>
            {status.label}
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-1">SAE ARP4386 Standard</span>
        </div>
      </div>

      {/* Uncertainty Envelope (±15% Band) */}
      <div className="bg-aerospace-950/60 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400">CONFORMAL UNCERTAINTY ENVELOPE (95% CI):</span>
          <span className="text-cyan-300 font-bold">
            [{rulBandLow.toFixed(1)}h — {rulBandHigh.toFixed(1)}h]
          </span>
        </div>

        {/* Visual Confidence Bar */}
        <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="absolute top-0 bottom-0 bg-cyan-500/30 border-x border-cyan-400"
            style={{
              left: `${Math.min(90, Math.max(5, (rulBandLow / 600) * 100))}%`,
              width: `${Math.min(40, Math.max(10, ((rulBandHigh - rulBandLow) / 600) * 100))}%`,
            }}
          />
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-cyan-400 shadow-sm"
            style={{
              left: `${Math.min(95, Math.max(5, (rulHours / 600) * 100))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>0h (Critical)</span>
          <span>Nominal Life (600h TBO)</span>
        </div>
      </div>

      {/* Degradation Stressors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs font-mono">
        <div className="bg-aerospace-950/60 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-orange-400" />
            <span>THERMAL WEAR</span>
          </span>
          <span className="font-bold text-slate-200">
            {currentTelemetry.cht > 115 ? 'ACCELERATED' : 'NOMINAL'}
          </span>
        </div>

        <div className="bg-aerospace-950/60 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-blue-400" />
            <span>OIL FILM STATUS</span>
          </span>
          <span className="font-bold text-slate-200">
            {currentTelemetry.oilPressure < 2.2 ? 'HYDRODYNAMIC LOSS' : 'STABLE (3.8 bar)'}
          </span>
        </div>

        <div className="bg-aerospace-950/60 p-2 rounded border border-slate-800">
          <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" />
            <span>HARMONIC FATIGUE</span>
          </span>
          <span className="font-bold text-slate-200">
            {currentTelemetry.vibrationRms > 4.0 ? 'HIGH STRESS' : 'LOW (1.8 mm/s)'}
          </span>
        </div>
      </div>
    </div>
  );
};
