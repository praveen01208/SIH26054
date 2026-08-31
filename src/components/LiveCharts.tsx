import React, { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LineChart as LineChartIcon, Activity, Thermometer, Wind, GitBranch } from 'lucide-react';

export const LiveCharts: React.FC = () => {
  const { telemetryHistory } = useTwinStore();
  const [activeTab, setActiveTab] = useState<'thermal' | 'mechanical' | 'combustion' | 'residuals'>('thermal');

  // Format data for Recharts
  const chartData = telemetryHistory.map((item) => ({
    time: `+${item.simTimeSeconds.toFixed(0)}s`,
    simSecs: item.simTimeSeconds,
    rpm: item.rpm,
    cht: item.cht,
    egt: item.egt,
    oilPressure: item.oilPressure,
    oilTemp: item.oilTemp,
    fuelFlow: item.fuelFlow,
    vibrationRms: item.vibrationRms,
    map: item.manifoldPressure,
    cyl1Egt: item.cylinders[0]?.egt || item.egt,
    cyl2Egt: item.cylinders[1]?.egt || item.egt,
    cyl3Egt: item.cylinders[2]?.egt || item.egt,
    cyl4Egt: item.cylinders[3]?.egt || item.egt,
    // Physics Residuals (Slide 11)
    resCht: item.residuals?.residualCht || 0,
    resOilP: item.residuals?.residualOilPressure || 0,
    resVib: item.residuals?.residualVibration || 0,
    resNorm: item.residuals?.totalNorm || 0,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-aerospace-950/95 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs font-mono">
          <p className="text-slate-400 font-bold mb-1">Time: {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 my-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LineChartIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            4. Real-Time Telemetry & Physics Residual Stream (60s Buffer)
          </h2>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-1 bg-aerospace-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('thermal')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'thermal'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Thermal & Oil</span>
          </button>
          <button
            onClick={() => setActiveTab('mechanical')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'mechanical'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>RPM & Vib</span>
          </button>
          <button
            onClick={() => setActiveTab('combustion')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'combustion'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Cylinder EGT</span>
          </button>
          <button
            onClick={() => setActiveTab('residuals')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'residuals'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Physics Residuals (r)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full bg-aerospace-950/60 rounded-lg p-2 border border-slate-800/60">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'thermal' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis yAxisId="temp" domain={[40, 160]} stroke="#f59e0b" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="°C" />
              <YAxis yAxisId="press" orientation="right" domain={[0, 6]} stroke="#38bdf8" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="b" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />
              
              <ReferenceLine yAxisId="temp" y={130} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'CHT Redline 130°C', fill: '#f43f5e', fontSize: 9, position: 'insideTopLeft' }} />
              <ReferenceLine yAxisId="press" y={1.8} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Oil Press Min 1.8b', fill: '#f43f5e', fontSize: 9, position: 'insideBottomRight' }} />

              <Line yAxisId="temp" type="monotone" dataKey="cht" name="CHT (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="temp" type="monotone" dataKey="oilTemp" name="Oil Temp (°C)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="press" type="monotone" dataKey="oilPressure" name="Oil Press (bar)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : activeTab === 'mechanical' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis yAxisId="rpm" domain={[2000, 6200]} stroke="#00f0ff" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="rpm" />
              <YAxis yAxisId="vib" orientation="right" domain={[0, 12]} stroke="#f43f5e" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="mm/s" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />

              <ReferenceLine yAxisId="vib" y={6.5} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Vib Alarm 6.5 mm/s', fill: '#f43f5e', fontSize: 9, position: 'insideTopRight' }} />

              <Line yAxisId="rpm" type="monotone" dataKey="rpm" name="Engine RPM" stroke="#00f0ff" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="vib" type="monotone" dataKey="vibrationRms" name="Vibration RMS (mm/s)" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : activeTab === 'combustion' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis domain={[200, 950]} stroke="#fb923c" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="°C" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />

              <Line type="monotone" dataKey="cyl1Egt" name="Cyl 1 EGT" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl2Egt" name="Cyl 2 EGT" stroke="#4ade80" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl3Egt" name="Cyl 3 EGT" stroke="#f43f5e" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl4Egt" name="Cyl 4 EGT" stroke="#c084fc" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis domain={[-20, 50]} stroke="#00f0ff" tick={{ fontSize: 10, fontFamily: 'monospace' }} unit="Δ" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }} />

              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
              <Line type="monotone" dataKey="resCht" name="Δ CHT (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="resOilP" name="Δ Oil Press (bar)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="resVib" name="Δ Vibration (mm/s)" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="resNorm" name="Residual Norm (r)" stroke="#c084fc" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
