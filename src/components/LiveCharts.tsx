import React, { useState } from 'react';
import { useTwinStore } from '../store/useTwinStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Activity, Flame, ShieldAlert } from 'lucide-react';

type ChartTab = 'THERMAL_OIL' | 'RPM_VIB' | 'CYLINDERS' | 'RESIDUALS';

export const LiveCharts: React.FC = () => {
  const { telemetryHistory } = useTwinStore();
  const [activeTab, setActiveTab] = useState<ChartTab>('THERMAL_OIL');

  const chartData = telemetryHistory.map((sample) => {
    return {
      time: Math.round(sample.timestamp / 1000) % 1000,
      rpm: Math.round(sample.rpm),
      cht: Number(sample.cht.toFixed(1)),
      egt: Math.round(sample.egt),
      oilPressure: Number(sample.oilPressure.toFixed(2)),
      oilTemp: Number(sample.oilTemp.toFixed(1)),
      fuelFlow: Number(sample.fuelFlow.toFixed(1)),
      vibrationRms: Number(sample.vibrationRms.toFixed(2)),
      cyl1_cht: Number(sample.cylinders[0]?.cht.toFixed(1) || 0),
      cyl2_cht: Number(sample.cylinders[1]?.cht.toFixed(1) || 0),
      cyl3_cht: Number(sample.cylinders[2]?.cht.toFixed(1) || 0),
      cyl4_cht: Number(sample.cylinders[3]?.cht.toFixed(1) || 0),
      cyl1_egt: Math.round(sample.cylinders[0]?.egt || 0),
      cyl2_egt: Math.round(sample.cylinders[1]?.egt || 0),
      cyl3_egt: Math.round(sample.cylinders[2]?.egt || 0),
      cyl4_egt: Math.round(sample.cylinders[3]?.egt || 0),
      res_cht: Number(sample.residuals.residualCht.toFixed(1)),
      res_oilP: Number(sample.residuals.residualOilPressure.toFixed(2)),
      res_vib: Number(sample.residuals.residualVibration.toFixed(2)),
      res_norm: Number(sample.residuals.totalNorm.toFixed(2)),
    };
  });

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          <h2 className="font-tech text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
            Real-Time Telemetry Stream (60s Buffer)
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-aerospace-950 p-1 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-mono overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('THERMAL_OIL')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'THERMAL_OIL'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Thermal & Oil</span>
          </button>
          <button
            onClick={() => setActiveTab('RPM_VIB')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'RPM_VIB'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3 text-purple-400" />
            <span>RPM & Vibration</span>
          </button>
          <button
            onClick={() => setActiveTab('CYLINDERS')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'CYLINDERS'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>4-Cyl EGT</span>
          </button>
          <button
            onClick={() => setActiveTab('RESIDUALS')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'RESIDUALS'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Residuals (r)</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 lg:h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'THERMAL_OIL' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="temp" stroke="#f97316" orientation="left" tick={{ fontSize: 10 }} domain={[40, 160]} />
              <YAxis yAxisId="press" stroke="#38bdf8" orientation="right" tick={{ fontSize: 10 }} domain={[0, 6]} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line yAxisId="temp" type="monotone" dataKey="cht" stroke="#f97316" name="CHT (°C)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="temp" type="monotone" dataKey="oilTemp" stroke="#f59e0b" name="Oil Temp (°C)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="press" type="monotone" dataKey="oilPressure" stroke="#38bdf8" name="Oil Press (bar)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : activeTab === 'RPM_VIB' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="rpm" stroke="#00f0ff" orientation="left" tick={{ fontSize: 10 }} domain={[3000, 6500]} />
              <YAxis yAxisId="vib" stroke="#a855f7" orientation="right" tick={{ fontSize: 10 }} domain={[0, 10]} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#00f0ff" name="RPM" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="vib" type="monotone" dataKey="vibrationRms" stroke="#a855f7" name="Vib RMS (mm/s)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : activeTab === 'CYLINDERS' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#f43f5e" tick={{ fontSize: 10 }} domain={[400, 950]} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="cyl1_egt" stroke="#38bdf8" name="Cyl 1 EGT" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl2_egt" stroke="#34d399" name="Cyl 2 EGT" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl3_egt" stroke="#f43f5e" name="Cyl 3 EGT (Misfire)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="cyl4_egt" stroke="#fbbf24" name="Cyl 4 EGT" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#f43f5e" tick={{ fontSize: 10 }} domain={[-3, 6]} />
              <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }} />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="res_cht" stroke="#f97316" name="r_CHT (°C)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="res_oilP" stroke="#38bdf8" name="r_OilPress (bar)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="res_vib" stroke="#a855f7" name="r_Vib (mm/s)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="res_norm" stroke="#f43f5e" name="Residual Norm (σ)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
