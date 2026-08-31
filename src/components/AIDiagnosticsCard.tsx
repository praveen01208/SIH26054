import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import {
  BrainCircuit,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

export const AIDiagnosticsCard: React.FC = () => {
  const { aiDiagnostics } = useTwinStore();
  const d = aiDiagnostics;

  const getStatusBadge = () => {
    switch (d.healthStatus) {
      case 'OPTIMAL':
        return { bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 glow-emerald', icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> };
      case 'NOMINAL':
        return { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50', icon: <ShieldCheck className="w-4 h-4 text-cyan-400" /> };
      case 'DEGRADED':
        return { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/50 glow-amber', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> };
      case 'WARNING':
        return { bg: 'bg-orange-500/20 text-orange-300 border-orange-500/50 animate-pulse', icon: <AlertTriangle className="w-4 h-4 text-orange-400" /> };
      case 'CRITICAL':
        return { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/50 glow-rose animate-pulse', icon: <TrendingDown className="w-4 h-4 text-rose-400" /> };
    }
  };

  const statusInfo = getStatusBadge();

  // Circle gauge math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (d.healthIndex / 100) * circumference;

  const getGaugeColor = () => {
    if (d.healthIndex >= 85) return '#10b981';
    if (d.healthIndex >= 70) return '#00f0ff';
    if (d.healthIndex >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 shadow-xl">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <h2 className="font-tech text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
            Simulated AI Diagnostic & Health Model (ISO 13374)
          </h2>
        </div>
        <div className={`px-2.5 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 ${statusInfo.bg}`}>
          {statusInfo.icon}
          <span>{d.healthStatus}</span>
        </div>
      </div>

      {/* Top Diagnostics Row: Health Index Gauge + Anomaly Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-aerospace-950/70 p-3 rounded-xl border border-slate-800/80">
        {/* Circular Health Index */}
        <div className="sm:col-span-4 flex items-center justify-center gap-3">
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={getGaugeColor()}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-lg sm:text-2xl font-bold tracking-tight text-white">
                {d.healthIndex}
              </span>
              <span className="font-mono text-[9px] text-slate-400 uppercase -mt-1">
                Health
              </span>
            </div>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-mono text-slate-400">STATE INDEX</span>
            <span className="font-tech text-xs sm:text-sm font-bold text-slate-200">
              {d.healthIndex >= 85 ? 'Normal Baseline' : d.healthIndex >= 65 ? 'Minor Wear' : 'Critical Fault'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400">PINN Hybrid Model</span>
          </div>
        </div>

        {/* Anomaly Score & Residual Metric */}
        <div className="sm:col-span-8 flex flex-col gap-2.5">
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-1">
              <span className="text-slate-400">CONTINUOUS ANOMALY SCORE</span>
              <span className={`font-bold ${d.anomalyScore > 0.4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {d.anomalyScore.toFixed(3)} / 1.000
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  d.anomalyScore > 0.6
                    ? 'bg-rose-500 glow-rose'
                    : d.anomalyScore > 0.3
                    ? 'bg-amber-400 glow-amber'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, d.anomalyScore * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs font-mono">
            <div className="bg-aerospace-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">RESIDUAL NORM (σ)</span>
              <span className={`text-xs sm:text-sm font-bold ${d.kalmanResidualNorm > 1.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {d.kalmanResidualNorm.toFixed(2)} σ
              </span>
            </div>
            <div className="bg-aerospace-900 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block">AI CONFIDENCE</span>
              <span className="text-xs sm:text-sm font-bold text-cyan-300">
                {d.isAnomalyDetected ? `${d.confidencePct}%` : '98.5% Nominal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Fault Signature */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
            <span>CLASSIFIED FAULT SIGNATURE:</span>
          </span>
        </div>
        <div className="bg-aerospace-950 p-2.5 sm:p-3 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <span className="font-tech text-xs sm:text-sm font-bold text-slate-100">
            {d.primaryDiagnosis || 'NOMINAL RUN — NO DETECTABLE SUBSYSTEM ANOMALY'}
          </span>
          {d.isAnomalyDetected && (
            <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {d.confidencePct}% Match Confidence
            </span>
          )}
        </div>
      </div>

      {/* Explainable AI Rationale & SHAP Feature Attribution */}
      <div className="flex flex-col gap-2 bg-aerospace-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold">XAI DIAGNOSTIC RATIONALE & SENSOR ATTRIBUTION (SHAP)</span>
        </div>
        <p className="text-[11px] sm:text-xs font-mono text-slate-300 leading-relaxed">
          {d.explainability}
        </p>

        {/* SHAP Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {d.sensorContributions.map((c, i) => (
            <div
              key={i}
              className={`px-2 py-1 rounded text-[10px] sm:text-[11px] font-mono border flex items-center gap-1.5 ${
                c.importance === 'HIGH'
                  ? 'bg-rose-950/60 text-rose-200 border-rose-500/60'
                  : c.importance === 'MEDIUM'
                  ? 'bg-amber-950/60 text-amber-200 border-amber-500/60'
                  : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
            >
              <span className="font-bold">{c.sensorName}:</span>
              <span>{c.shapScore > 0 ? `+${c.shapScore.toFixed(2)}` : c.shapScore.toFixed(2)}</span>
              <span className="text-[8px] opacity-75 uppercase">({c.importance})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
