import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import { X, GitCompare, RefreshCw } from 'lucide-react';

export const BaselineComparisonModal: React.FC = () => {
  const {
    showBaselineModal,
    setShowBaselineModal,
    currentTelemetry,
    baselineProfile,
    captureCurrentAsBaseline,
  } = useTwinStore();

  if (!showBaselineModal) return null;

  const t = currentTelemetry;
  const b = baselineProfile;

  const comparisonRows = [
    {
      name: 'Engine RPM',
      unit: 'RPM',
      baseline: b.rpm.toFixed(0),
      current: t.rpm.toFixed(0),
      diff: ((t.rpm - b.rpm) / b.rpm) * 100,
    },
    {
      name: 'Cylinder Head Temp (CHT)',
      unit: '°C',
      baseline: b.cht.toFixed(1),
      current: t.cht.toFixed(1),
      diff: ((t.cht - b.cht) / b.cht) * 100,
    },
    {
      name: 'Exhaust Gas Temp (EGT)',
      unit: '°C',
      baseline: b.egt.toFixed(0),
      current: t.egt.toFixed(0),
      diff: ((t.egt - b.egt) / b.egt) * 100,
    },
    {
      name: 'Oil Pressure',
      unit: 'bar',
      baseline: b.oilPressure.toFixed(2),
      current: t.oilPressure.toFixed(2),
      diff: ((t.oilPressure - b.oilPressure) / b.oilPressure) * 100,
    },
    {
      name: 'Oil Temperature',
      unit: '°C',
      baseline: b.oilTemp.toFixed(1),
      current: t.oilTemp.toFixed(1),
      diff: ((t.oilTemp - b.oilTemp) / b.oilTemp) * 100,
    },
    {
      name: 'Fuel Flow Rate',
      unit: 'L/h',
      baseline: b.fuelFlow.toFixed(1),
      current: t.fuelFlow.toFixed(1),
      diff: ((t.fuelFlow - b.fuelFlow) / b.fuelFlow) * 100,
    },
    {
      name: 'Vibration RMS',
      unit: 'mm/s',
      baseline: b.vibrationRms.toFixed(2),
      current: t.vibrationRms.toFixed(2),
      diff: ((t.vibrationRms - b.vibrationRms) / b.vibrationRms) * 100,
    },
    {
      name: 'Bus Voltage',
      unit: 'V',
      baseline: b.batteryVoltage.toFixed(1),
      current: t.batteryVoltage.toFixed(1),
      diff: ((t.batteryVoltage - b.batteryVoltage) / b.batteryVoltage) * 100,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-aerospace-900 border border-cyan-500/50 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl glow-cyan">
        {/* Modal Header */}
        <div className="bg-aerospace-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <h2 className="font-tech text-base font-bold uppercase tracking-wider text-slate-100">
              Live Session vs Certified Baseline Comparison
            </h2>
          </div>
          <button
            onClick={() => setShowBaselineModal(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-xs font-mono text-slate-300">
            Real-time digital twin state deviation matrix compared against the calibrated nominal aero-piston baseline profile.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-aerospace-950/60">
                  <th className="py-2.5 px-3">State Channel</th>
                  <th className="py-2.5 px-3">Baseline Profile</th>
                  <th className="py-2.5 px-3">Live Telemetry</th>
                  <th className="py-2.5 px-3">Deviation (Δ%)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparisonRows.map((row) => {
                  const absDiff = Math.abs(row.diff);
                  const isSevere = absDiff > 25;
                  const isModerate = absDiff > 12;

                  return (
                    <tr key={row.name} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{row.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {row.baseline} {row.unit}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-100">
                        {row.current} {row.unit}
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {row.diff > 0 ? `+${row.diff.toFixed(1)}%` : `${row.diff.toFixed(1)}%`}
                      </td>
                      <td className="py-2.5 px-3">
                        {isSevere ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            ANOMALOUS
                          </span>
                        ) : isModerate ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                            MARGINAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                            NOMINAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={captureCurrentAsBaseline}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Capture Current State as New Baseline</span>
            </button>

            <button
              onClick={() => setShowBaselineModal(false)}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs shadow-lg glow-cyan"
            >
              Close Overlay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
