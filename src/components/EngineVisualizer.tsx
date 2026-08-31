import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { Cpu, Flame } from 'lucide-react';

export const EngineVisualizer: React.FC = () => {
  const { currentTelemetry, faults } = useTwinStore();
  const t = currentTelemetry;
  const misfireFault = faults.find((f) => f.id === 'MISFIRE' && f.enabled);

  const getCylinderHeatColor = (cht: number, isMisfiring?: boolean) => {
    if (isMisfiring) return 'border-blue-500/80 bg-blue-950/40 text-blue-300';
    if (cht > 125) return 'border-rose-500/90 bg-rose-950/50 text-rose-300 shadow-lg glow-rose animate-pulse';
    if (cht > 110) return 'border-amber-500/80 bg-amber-950/40 text-amber-300';
    return 'border-emerald-500/60 bg-emerald-950/20 text-emerald-300';
  };

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            Aero-Piston Cylinder Bank & Thermal Schematic
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          AFR (λ): <span className="text-cyan-300 font-bold">{t.lambdaAfr}</span> | Turbo Boost: <span className="text-cyan-300 font-bold">{t.manifoldPressure.toFixed(2)} bar</span>
        </span>
      </div>

      {/* 4 Cylinders Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {t.cylinders.map((cyl) => {
          const isMisfiring = misfireFault && cyl.id === 3;
          return (
            <div
              key={cyl.id}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${getCylinderHeatColor(
                cyl.cht,
                Boolean(isMisfiring)
              )}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold">CYLINDER #{cyl.id}</span>
                </div>
                {isMisfiring ? (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500 text-slate-950 font-bold animate-pulse">
                    MISFIRE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-900/80 text-slate-400">
                    {(cyl.combustionEff * 100).toFixed(0)}% EFF
                  </span>
                )}
              </div>

              <div className="space-y-1 my-1 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Head Temp (CHT):</span>
                  <span className="font-bold">{cyl.cht.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Exhaust (EGT):</span>
                  <span className="font-bold">{cyl.egt.toFixed(0)}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Peak Pressure:</span>
                  <span className="text-slate-300">{cyl.pressurePeak.toFixed(1)} bar</span>
                </div>
              </div>

              {/* Combustion flame / spark visualizer */}
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Combustion:</span>
                <span className="flex items-center gap-1">
                  {isMisfiring ? (
                    <span className="text-rose-400 font-bold">QUENCHED</span>
                  ) : (
                    <>
                      <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
                      <span className="text-emerald-400 font-semibold">FIRING</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
