import React, { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { ConnectionBadge } from './ConnectionBadge';
import { Play, Pause, RotateCcw, Activity, GitCompare, ChevronDown, ChevronUp } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isSimRunning,
    simSecondsElapsed,
    toggleSimulation,
    resetSimulation,
    aiDiagnostics,
    setShowBaselineModal,
  } = useTwinStore();

  const [showMobileStats, setShowMobileStats] = useState(false);

  const formatSimTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getHealthBadge = () => {
    switch (aiDiagnostics.healthStatus) {
      case 'OPTIMAL':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald';
      case 'NOMINAL':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'DEGRADED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber';
      case 'WARNING':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40 animate-pulse';
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose animate-pulse';
    }
  };

  return (
    <header className="bg-aerospace-950 border-b border-slate-800/80 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2 select-none sticky top-0 z-30 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Title, Branding & Mobile Badge */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-600/30 to-blue-900/40 border border-cyan-500/40 shadow-inner shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="font-tech text-sm sm:text-base lg:text-lg font-bold tracking-wider text-slate-100 uppercase">
                AeroTwin-X <span className="text-cyan-400 font-normal">| 26054</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
                TEAM SYNUS
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2">
              <span>EDGE: <span className="text-cyan-300 font-semibold">Jetson Orin</span></span>
              <span className="text-slate-600">•</span>
              <span>STD: <span className="text-slate-300">ISO 13374</span></span>
              <span className="text-slate-600">•</span>
              <span>AI: <span className="text-slate-300">PINN PHM</span></span>
            </p>
          </div>
        </div>

        {/* Center Mission Stats (Desktop & Tablet) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4 bg-aerospace-900/80 px-3 lg:px-4 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">CLOCK:</span>
            <span className="text-cyan-300 font-bold tracking-widest">{formatSimTime(simSecondsElapsed)}</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">HEALTH:</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${getHealthBadge()}`}>
              {aiDiagnostics.healthIndex}%
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">RESIDUAL:</span>
            <span className={`font-bold ${aiDiagnostics.kalmanResidualNorm > 1.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {aiDiagnostics.kalmanResidualNorm.toFixed(2)}σ
            </span>
          </div>
        </div>

        {/* Action Controls & Datalink Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ConnectionBadge />

          <button
            onClick={() => setShowBaselineModal(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] sm:text-xs font-mono text-slate-200 transition-colors"
            title="Compare Live Run vs Certified Baseline (ISO 13374)"
          >
            <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Baseline Diff</span>
          </button>

          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[11px] sm:text-xs font-mono font-bold transition-all border ${
              isSimRunning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald'
            }`}
            title={isSimRunning ? 'Pause Physics Clock' : 'Resume Physics Clock'}
          >
            {isSimRunning ? (
              <>
                <Pause className="w-3 h-3 fill-amber-300" />
                <span className="hidden sm:inline">PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-emerald-300" />
                <span className="hidden sm:inline">RUN</span>
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            className="p-1 sm:p-1.5 rounded bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-slate-400 transition-colors"
            title="Reset Simulation to Certified Factory Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Mobile Stats Toggle */}
          <button
            onClick={() => setShowMobileStats(!showMobileStats)}
            className="md:hidden p-1 rounded bg-slate-800 border border-slate-700 text-slate-300"
            title="Toggle Mobile Stats"
          >
            {showMobileStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Mission Stats for Mobile Screens */}
      {showMobileStats && (
        <div className="md:hidden grid grid-cols-3 gap-2 bg-aerospace-900/95 p-2 rounded-lg border border-slate-800 text-[10px] font-mono text-center">
          <div className="flex flex-col">
            <span className="text-slate-400">CLOCK</span>
            <span className="text-cyan-300 font-bold">{formatSimTime(simSecondsElapsed)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400">HEALTH</span>
            <span className={`font-bold ${aiDiagnostics.healthIndex < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {aiDiagnostics.healthIndex}% {aiDiagnostics.healthStatus}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400">RESIDUAL</span>
            <span className={`font-bold ${aiDiagnostics.kalmanResidualNorm > 1.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {aiDiagnostics.kalmanResidualNorm.toFixed(2)}σ
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
