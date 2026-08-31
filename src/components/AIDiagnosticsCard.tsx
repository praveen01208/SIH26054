import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { Cpu, AlertTriangle, ShieldCheck, Binary, Sparkles } from 'lucide-react';

export const AIDiagnosticsCard: React.FC = () => {
  const { aiDiagnostics, currentTelemetry } = useTwinStore();
  const d = aiDiagnostics;
  const res = currentTelemetry.residuals;

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 65) return 'text-cyan-400 stroke-cyan-400';
    if (score >= 45) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (d.healthIndex / 100) * circumference;

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            5. Hybrid PINN + Kalman PHM Layer (Explainable AI)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 flex items-center gap-1">
            <Binary className="w-3 h-3 text-cyan-400" />
            <span>Shared Multi-Task LSTM Core</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Circular Health Gauge & Anomaly Bar (4 cols) */}
        <div className="md:col-span-4 bg-aerospace-950/80 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center relative">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`transition-all duration-500 ${getHealthColor(d.healthIndex)}`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-2xl font-tech font-bold ${getHealthColor(d.healthIndex)}`}>
                {d.healthIndex}
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                HEALTH
              </span>
            </div>
          </div>

          {/* Anomaly Score Bar & Residual Norm */}
          <div className="w-full mt-2 space-y-1.5">
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-slate-400">Ensemble Anomaly Index:</span>
                <span className={`font-bold ${d.anomalyScore > 0.4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {(d.anomalyScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    d.anomalyScore > 0.5 ? 'bg-rose-500' : d.anomalyScore > 0.25 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, d.anomalyScore * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-slate-800/80 text-slate-400">
              <span>Physics Residual Norm (r):</span>
              <span className="text-cyan-300 font-bold">{res ? res.totalNorm.toFixed(2) : '0.00'}σ</span>
            </div>
          </div>
        </div>

        {/* Diagnosis & Rationale Output (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-2.5">
          {/* Primary Diagnosis Box */}
          <div className={`p-3 rounded-lg border flex flex-col gap-1 transition-all ${
            d.healthIndex < 65
              ? 'bg-rose-950/30 border-rose-500/60 glow-rose'
              : 'bg-aerospace-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {d.healthIndex < 65 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  CLASSIFICATION:
                </span>
                <span className={`text-xs font-mono font-bold ${d.healthIndex < 65 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {d.primaryDiagnosis}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700 font-bold">
                CONFIDENCE: {d.confidencePct}%
              </span>
            </div>

            <p className="text-xs font-mono text-slate-200 mt-1 leading-relaxed bg-aerospace-900/90 p-2 rounded border border-slate-800/80">
              &ldquo;{d.explainability}&rdquo;
            </p>
          </div>

          {/* SHAP Feature Attribution Breakdown */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>SHAP EXPLAINABILITY ATTRIBUTION (FEATURE CONTRIBUTIONS):</span>
              </span>
              <span className="text-slate-500">CUSUM RESIDUALS</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {d.sensorContributions.map((sensor) => (
                <div
                  key={sensor.sensorKey}
                  className={`px-2 py-1 rounded border text-[10px] font-mono flex items-center gap-1.5 ${getImportanceBadge(
                    sensor.importance
                  )}`}
                >
                  <span className="font-semibold">{sensor.sensorName}:</span>
                  <span className="text-slate-300">{sensor.deviationPct > 0 ? `+${sensor.deviationPct}%` : `${sensor.deviationPct}%`}</span>
                  <span className="text-cyan-300 text-[9px] font-mono">[{sensor.shapScore > 0 ? `ϕ=${sensor.shapScore}` : ''}]</span>
                  <span className="px-1 rounded bg-slate-950/80 text-[8px] uppercase tracking-tighter">
                    {sensor.importance}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
