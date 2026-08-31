import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { EnvironmentalMode } from '../types/telemetry';
import { ENV_MODE_PRESETS } from '../simulation/defaultState';
import {
  Flame,
  CloudRain,
  Mountain,
  Gauge,
  Zap,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const {
    envMode,
    setEnvMode,
    throttle,
    setThrottle,
    faults,
    toggleFault,
    setFaultSeverity,
    clearAllFaults,
  } = useTwinStore();

  const envModes: { id: EnvironmentalMode; label: string; icon: React.ReactNode; badge: string }[] = [
    { id: 'NORMAL', label: 'Normal Cruise', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, badge: '3k ft / 18°C' },
    { id: 'HIGH_ALTITUDE', label: 'High Altitude', icon: <Mountain className="w-4 h-4 text-blue-400" />, badge: '18.5k ft / -20°C' },
    { id: 'HOT_WEATHER', label: 'Hot Desert', icon: <Flame className="w-4 h-4 text-amber-400" />, badge: '45°C Extreme' },
    { id: 'ENDURANCE', label: 'Endurance Loiter', icon: <CloudRain className="w-4 h-4 text-purple-400" />, badge: '60% Soak' },
    { id: 'RAPID_THROTTLE', label: 'Rapid Throttle', icon: <Zap className="w-4 h-4 text-cyan-400" />, badge: 'Dynamic Waves' },
  ];

  const activeFaultCount = faults.filter((f) => f.enabled).length;

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
      {/* 1. Environmental Mode Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-cyan-400" />
            <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
              1. Atmospheric & Flight Regime
            </h2>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {ENV_MODE_PRESETS[envMode].name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {envModes.map((mode) => {
            const isSelected = envMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setEnvMode(mode.id)}
                className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-100 glow-cyan ring-1 ring-cyan-500/50'
                    : 'bg-aerospace-850/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-aerospace-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  {mode.icon}
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                    {mode.badge}
                  </span>
                </div>
                <span className="text-xs font-semibold leading-tight">{mode.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] font-mono text-slate-400 leading-snug">
          {ENV_MODE_PRESETS[envMode].description}
        </p>
      </div>

      <div className="h-px bg-slate-800/80"></div>

      {/* 2. Throttle Command Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
              Engine Throttle Lever (MAP Command)
            </h2>
          </div>
          <span className="font-mono text-sm font-bold text-cyan-300 bg-aerospace-950 px-2.5 py-0.5 rounded border border-cyan-500/40">
            {throttle}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">IDLE (0%)</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={throttle}
            disabled={envMode === 'RAPID_THROTTLE'}
            onChange={(e) => setThrottle(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
          />
          <span className="text-[10px] font-mono text-slate-500">MAX (100%)</span>
        </div>
        {envMode === 'RAPID_THROTTLE' && (
          <span className="text-[10px] font-mono text-cyan-400 mt-1 block">
            * Automatic sinusoidal throttle sweep active in Rapid Throttle mode.
          </span>
        )}
      </div>

      <div className="h-px bg-slate-800/80"></div>

      {/* 3. Fault Injection Matrix */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
              2. Physics-Based Fault Injections (8 Multi-Sensor Modes)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {activeFaultCount > 0 && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                {activeFaultCount} ACTIVE FAULT{activeFaultCount > 1 ? 'S' : ''}
              </span>
            )}
            <button
              onClick={clearAllFaults}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-mono transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {faults.map((fault) => {
            const isEnabled = fault.enabled;
            return (
              <div
                key={fault.id}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                  isEnabled
                    ? 'bg-rose-950/40 border-rose-500/80 text-white shadow-lg glow-rose'
                    : 'bg-aerospace-850/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-aerospace-800/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {fault.category}
                    </span>
                    <button
                      onClick={() => toggleFault(fault.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all border ${
                        isEnabled
                          ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isEnabled ? 'INJECTED' : 'INJECT'}
                    </button>
                  </div>

                  <h3 className={`text-xs font-bold leading-snug mb-1 ${isEnabled ? 'text-rose-200' : 'text-slate-200'}`}>
                    {fault.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 leading-tight mb-2">
                    {fault.description}
                  </p>
                </div>

                {/* Severity Slider when enabled */}
                {isEnabled && (
                  <div className="pt-2 border-t border-rose-500/30">
                    <div className="flex items-center justify-between text-[10px] font-mono text-rose-300 mb-1">
                      <span>Severity Parameter:</span>
                      <span className="font-bold">{Math.round(fault.severity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={fault.severity}
                      onChange={(e) => setFaultSeverity(fault.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-rose-950 rounded-lg appearance-none cursor-pointer accent-rose-400"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
