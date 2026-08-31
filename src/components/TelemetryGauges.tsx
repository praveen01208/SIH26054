import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import {
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  Zap,
  Activity,
  Fuel,
} from 'lucide-react';

interface GaugeProps {
  label: string;
  value: number;
  unit: string;
  nominal: number;
  min: number;
  max: number;
  format?: (v: number) => string;
  icon: React.ReactNode;
  warningThresholdHigh?: number;
  criticalThresholdHigh?: number;
  warningThresholdLow?: number;
  criticalThresholdLow?: number;
}

export const SingleGauge: React.FC<GaugeProps> = ({
  label,
  value,
  unit,
  min,
  max,
  format = (v) => v.toFixed(0),
  icon,
  warningThresholdHigh,
  criticalThresholdHigh,
  warningThresholdLow,
  criticalThresholdLow,
}) => {
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

  if (criticalThresholdHigh !== undefined && value >= criticalThresholdHigh) {
    status = 'CRITICAL';
  } else if (warningThresholdHigh !== undefined && value >= warningThresholdHigh) {
    status = 'WARNING';
  } else if (criticalThresholdLow !== undefined && value <= criticalThresholdLow) {
    status = 'CRITICAL';
  } else if (warningThresholdLow !== undefined && value <= warningThresholdLow) {
    status = 'WARNING';
  }

  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL':
        return 'text-rose-400 border-rose-500/80 bg-rose-950/40 glow-rose';
      case 'WARNING':
        return 'text-amber-400 border-amber-500/80 bg-amber-950/40 glow-amber';
      case 'NORMAL':
        return 'text-cyan-400 border-slate-800 bg-aerospace-900/80 hover:border-slate-700';
    }
  };

  const getBarColor = () => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-rose-500';
      case 'WARNING':
        return 'bg-amber-400';
      case 'NORMAL':
        return 'bg-cyan-400';
    }
  };

  return (
    <div
      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-400 truncate">
          {label}
        </span>
        <div className="shrink-0">{icon}</div>
      </div>

      <div className="my-1">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-base sm:text-xl font-bold tracking-tight text-white">
            {format(value)}
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-slate-400">{unit}</span>
        </div>
      </div>

      <div>
        <div className="w-full h-1.5 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800/80 mb-1">
          <div
            className={`h-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-slate-500">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

export const TelemetryGauges: React.FC = () => {
  const { currentTelemetry } = useTwinStore();
  const t = currentTelemetry;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
      <SingleGauge
        label="Engine RPM"
        value={t.rpm}
        unit="RPM"
        nominal={5500}
        min={0}
        max={6500}
        format={(v) => v.toFixed(0)}
        icon={<Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />}
        warningThresholdHigh={5700}
        criticalThresholdHigh={6100}
        warningThresholdLow={4000}
      />

      <SingleGauge
        label="Cylinder CHT"
        value={t.cht}
        unit="°C"
        nominal={98}
        min={40}
        max={160}
        format={(v) => v.toFixed(1)}
        icon={<Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />}
        warningThresholdHigh={115}
        criticalThresholdHigh={135}
      />

      <SingleGauge
        label="Exhaust EGT"
        value={t.egt}
        unit="°C"
        nominal={780}
        min={500}
        max={950}
        format={(v) => v.toFixed(0)}
        icon={<Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />}
        warningThresholdHigh={840}
        criticalThresholdHigh={880}
      />

      <SingleGauge
        label="Oil Pressure"
        value={t.oilPressure}
        unit="bar"
        nominal={3.8}
        min={0}
        max={6.0}
        format={(v) => v.toFixed(2)}
        icon={<Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />}
        warningThresholdLow={2.4}
        criticalThresholdLow={1.6}
        warningThresholdHigh={5.2}
      />

      <SingleGauge
        label="Oil Temp"
        value={t.oilTemp}
        unit="°C"
        nominal={88}
        min={40}
        max={140}
        format={(v) => v.toFixed(1)}
        icon={<Thermometer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
        warningThresholdHigh={108}
        criticalThresholdHigh={125}
      />

      <SingleGauge
        label="Fuel Flow"
        value={t.fuelFlow}
        unit="L/h"
        nominal={24.2}
        min={0}
        max={45}
        format={(v) => v.toFixed(1)}
        icon={<Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
        warningThresholdHigh={34}
        criticalThresholdHigh={40}
      />

      <SingleGauge
        label="Vibration RMS"
        value={t.vibrationRms}
        unit="mm/s"
        nominal={1.8}
        min={0}
        max={10.0}
        format={(v) => v.toFixed(2)}
        icon={<Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />}
        warningThresholdHigh={4.5}
        criticalThresholdHigh={6.8}
      />

      <SingleGauge
        label="28V Bus"
        value={t.batteryVoltage}
        unit="V"
        nominal={28.2}
        min={18}
        max={34}
        format={(v) => v.toFixed(1)}
        icon={<Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />}
        warningThresholdLow={24.5}
        criticalThresholdLow={22.0}
        warningThresholdHigh={31.0}
      />
    </div>
  );
};
