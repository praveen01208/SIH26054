import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { NOMINAL_BASELINE } from '../simulation/defaultState';
import { X, GitCompare, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export const BaselineComparisonModal: React.FC = () => {
  const { showBaselineModal, setShowBaselineModal, currentTelemetry } = useTwinStore();
  const t = currentTelemetry;
  const b = NOMINAL_BASELINE;

  if (!showBaselineModal) return null;

  const comparisonRows = [
    { label: 'Engine Speed', unit: 'RPM', live: t.rpm, base: b.rpm, delta: t.rpm - b.rpm, tol: 150 },
    { label: 'Cylinder Head Temp (CHT)', unit: '°C', live: t.cht, base: b.cht, delta: t.cht - b.cht, tol: 8 },
    { label: 'Exhaust Gas Temp (EGT)', unit: '°C', live: t.egt, base: b.egt, delta: t.egt - b.egt, tol: 35 },
    { label: 'Oil Pressure', unit: 'bar', live: t.oilPressure, base: b.oilPressure, delta: t.oilPressure - b.oilPressure, tol: 0.4 },
    { label: 'Oil Temperature', unit: '°C', live: t.oilTemp, base: b.oilTemp, delta: t.oilTemp - b.oilTemp, tol: 6 },
    { label: 'Fuel Flow Rate', unit: 'L/h', live: t.fuelFlow, base: b.fuelFlow, delta: t.fuelFlow - b.fuelFlow, tol: 2.5 },
    { label: 'Vibration RMS', unit: 'mm/s', live: t.vibrationRms, base: b.vibrationRms, delta: t.vibrationRms - b.vibrationRms, tol: 1.0 },
    { label: '28V Bus Voltage', unit: 'V', live: t.batteryVoltage, base: b.batteryVoltage, delta: t.batteryVoltage - b.batteryVoltage, tol: 1.2 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-aerospace-950 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-aerospace-900/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <GitCompare className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-tech text-sm sm:text-base font-bold uppercase tracking-wider text-slate-100">
                Baseline Deviation Analysis (ISO 13374)
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                Certified Factory Baseline vs Live Flight Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowBaselineModal(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body with Horizontal Scroll for Mobile */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex flex-col gap-3 sm:gap-4">
          <div className="bg-aerospace-900/60 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Values within green tolerance bounds meet certified airworthiness standards. Deviations exceeding tolerance trigger physics residual flags.
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left font-mono text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-aerospace-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5 sm:p-3">Sensor Parameter</th>
                  <th className="p-2.5 sm:p-3">Live Telemetry</th>
                  <th className="p-2.5 sm:p-3">Nominal Baseline</th>
                  <th className="p-2.5 sm:p-3">Delta (Live - Base)</th>
                  <th className="p-2.5 sm:p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {comparisonRows.map((row, idx) => {
                  const isExceeded = Math.abs(row.delta) > row.tol;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5 sm:p-3 text-slate-200 font-semibold">{row.label}</td>
                      <td className="p-2.5 sm:p-3 text-white font-bold">
                        {row.live.toFixed(1)} {row.unit}
                      </td>
                      <td className="p-2.5 sm:p-3 text-slate-400">
                        {row.base.toFixed(1)} {row.unit}
                      </td>
                      <td className={`p-2.5 sm:p-3 font-bold ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {row.delta > 0 ? `+${row.delta.toFixed(1)}` : row.delta.toFixed(1)} {row.unit}
                      </td>
                      <td className="p-2.5 sm:p-3 text-center">
                        {isExceeded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>DEVIANT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>NOMINAL</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-aerospace-900/40 flex justify-end">
          <button
            onClick={() => setShowBaselineModal(false)}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs transition-colors"
          >
            Close Baseline Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
