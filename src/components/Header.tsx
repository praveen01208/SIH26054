import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { ConnectionBadge } from './ConnectionBadge';
import { Play, Pause, RotateCcw, Activity, GitCompare } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isSimRunning,
    simSecondsElapsed,
    toggleSimulation,
    resetSimulation,
    aiDiagnostics,
    setShowBaselineModal,
  } = useTwinStore();

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
    <header className="bg-aerospace-950 border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none sticky top-0 z-30 shadow-2xl">
      {/* Title, AeroTwin-X Branding & Standards */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600/30 to-blue-900/40 border border-cyan-500/40 shadow-inner">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-tech text-lg font-bold tracking-wider text-slate-100 uppercase">
              AeroTwin-X <span className="text-cyan-400 font-normal">| SIH 26054</span>
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-semibold">
              TEAM SYNUS
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              MALE UAV T-914 iS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span>EDGE: <span className="text-cyan-300 font-semibold">Jetson Orin (CAN/FADEC)</span></span>
            <span className="text-slate-600">•</span>
            <span>STD: <span className="text-slate-300">ISO 13374 / SAE ARP4386</span></span>
            <span className="text-slate-600">•</span>
            <span>AI: <span className="text-slate-300">PINN + Kalman PHM</span></span>
          </p>
        </div>
      </div>

      {/* Center Mission Stats */}
      <div className="hidden lg:flex items-center gap-4 bg-aerospace-900/80 px-4 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">MISSION CLOCK:</span>
          <span className="text-cyan-300 font-bold tracking-widest">{formatSimTime(simSecondsElapsed)}</span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">HEALTH:</span>
          <span className={`px-2 py-0.5 rounded font-bold border ${getHealthBadge()}`}>
            {aiDiagnostics.healthIndex}% {aiDiagnostics.healthStatus}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700"></div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">RESIDUAL NORM:</span>
          <span className={`font-bold ${aiDiagnostics.kalmanResidualNorm > 1.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {aiDiagnostics.kalmanResidualNorm.toFixed(2)}σ
          </span>
        </div>
      </div>

      {/* Action Controls & Datalink Status */}
      <div className="flex items-center gap-2.5">
        <ConnectionBadge />

        <button
          onClick={() => setShowBaselineModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
          title="Compare Live Run vs Certified Baseline (ISO 13374)"
        >
          <GitCompare className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Baseline Diff</span>
        </button>

        <button
          onClick={toggleSimulation}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all border ${
            isSimRunning
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 glow-emerald'
          }`}
          title={isSimRunning ? 'Pause Physics Clock' : 'Resume Physics Clock'}
        >
          {isSimRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-amber-300" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-emerald-300" />
              <span>RUN</span>
            </>
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-slate-400 transition-colors"
          title="Reset Simulation to Certified Factory Baseline"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
