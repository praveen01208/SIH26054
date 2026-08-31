import React from 'react';
import { useTwinStore } from '../store/useTwinStore';
import {
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  Activity,
  Zap,
  Wind,
  Layers,
} from 'lucide-react';

interface GaugeItemProps {
  label: string;
  sublabel: string;
  value: string | number;
  unit: string;
  nominalRange: string;
  min: number;
  max: number;
  currentNum: number;
  status: 'nominal' | 'warning' | 'critical';
  icon: React.ReactNode;
  barColor: string;
}

const GaugeItem: React.FC<GaugeItemProps> = ({
  label,
  sublabel,
  value,
  unit,
  nominalRange,
  min,
  max,
  currentNum,
  status,
  icon,
  barColor,
}) => {
  const percentage = Math.min(100, Math.max(0, ((currentNum - min) / (max - min)) * 100));

  const getBorderAndBg = () => {
    switch (status) {
      case 'nominal':
        return 'bg-aerospace-900/80 border-slate-800 hover:border-slate-700';
      case 'warning':
        return 'bg-amber-950/30 border-amber-500/50 glow-amber';
      case 'critical':
        return 'bg-rose-950/40 border-rose-500/80 glow-rose animate-pulse';
    }
  };

  const getValueColor = () => {
    switch (status) {
      case 'nominal':
        return 'text-slate-100';
      case 'warning':
        return 'text-amber-300';
      case 'critical':
        return 'text-rose-400';
    }
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${getBorderAndBg()}`}>
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            {icon}
            <span className="font-semibold tracking-wider">{label}</span>
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
            {nominalRange}
          </span>
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className={`text-xl lg:text-2xl font-mono font-bold tracking-tight ${getValueColor()}`}>
            {value}
          </span>
          <span className="text-[11px] font-mono text-slate-400">{unit}</span>
        </div>
      </div>

      <div>
        {/* Progress Bar HUD */}
        <div className="w-full bg-slate-950/80 h-2 rounded-full overflow-hidden border border-slate-800 my-1">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
          <span>{min}{unit}</span>
          <span className="text-slate-400 truncate max-w-[90px]">{sublabel}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};

export const TelemetryGauges: React.FC = () => {
  const { currentTelemetry } = useTwinStore();
  const t = currentTelemetry;

  // Determine status thresholds
  const getRpmStatus = () => (t.rpm < 2500 || t.rpm > 5800 ? 'critical' : t.rpm < 4000 || t.rpm > 5500 ? 'warning' : 'nominal');
  const getChtStatus = () => (t.cht > 130 ? 'critical' : t.cht > 115 ? 'warning' : 'nominal');
  const getEgtStatus = () => (t.egt > 870 ? 'critical' : t.egt > 820 ? 'warning' : 'nominal');
  const getOilPStatus = () => (t.oilPressure < 1.8 || t.oilPressure > 6.0 ? 'critical' : t.oilPressure < 2.5 ? 'warning' : 'nominal');
  const getOilTStatus = () => (t.oilTemp > 120 ? 'critical' : t.oilTemp > 105 ? 'warning' : 'nominal');
  const getFuelStatus = () => (t.fuelFlow > 32 || t.fuelFlow < 12 ? 'warning' : 'nominal');
  const getVibStatus = () => (t.vibrationRms > 6.5 ? 'critical' : t.vibrationRms > 4.0 ? 'warning' : 'nominal');
  const getVoltStatus = () => (t.batteryVoltage < 25.0 || t.batteryVoltage > 30.0 ? 'warning' : 'nominal');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-200">
            3. Live Telemetry HUD (8 Core State Variables)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          MAP: <span className="text-cyan-300 font-bold">{t.manifoldPressure.toFixed(2)} bar</span> | Torque: <span className="text-cyan-300 font-bold">{t.torqueNm.toFixed(0)} Nm</span> | Power: <span className="text-cyan-300 font-bold">{t.powerKw.toFixed(1)} kW</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. RPM */}
        <GaugeItem
          label="ENGINE RPM"
          sublabel="Shaft Speed"
          value={t.rpm.toFixed(0)}
          unit="RPM"
          nominalRange="4800-5400"
          min={1000}
          max={6000}
          currentNum={t.rpm}
          status={getRpmStatus()}
          icon={<Gauge className="w-3 h-3 text-cyan-400" />}
          barColor={getRpmStatus() === 'critical' ? 'bg-rose-500' : getRpmStatus() === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}
        />

        {/* 2. CHT */}
        <GaugeItem
          label="CHT (AVG)"
          sublabel="Cyl Head Temp"
          value={t.cht.toFixed(1)}
          unit="°C"
          nominalRange="85-115°C"
          min={50}
          max={160}
          currentNum={t.cht}
          status={getChtStatus()}
          icon={<Thermometer className="w-3 h-3 text-amber-400" />}
          barColor={getChtStatus() === 'critical' ? 'bg-rose-500' : getChtStatus() === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}
        />

        {/* 3. EGT */}
        <GaugeItem
          label="EGT (AVG)"
          sublabel="Exhaust Gas"
          value={t.egt.toFixed(0)}
          unit="°C"
          nominalRange="720-820°C"
          min={300}
          max={950}
          currentNum={t.egt}
          status={getEgtStatus()}
          icon={<Flame className="w-3 h-3 text-orange-400" />}
          barColor={getEgtStatus() === 'critical' ? 'bg-rose-500' : getEgtStatus() === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}
        />

        {/* 4. OIL PRESSURE */}
        <GaugeItem
          label="OIL PRESSURE"
          sublabel="Hydrodynamic"
          value={t.oilPressure.toFixed(2)}
          unit="bar"
          nominalRange="2.5-5.0 bar"
          min={0}
          max={7}
          currentNum={t.oilPressure}
          status={getOilPStatus()}
          icon={<Droplets className="w-3 h-3 text-blue-400" />}
          barColor={getOilPStatus() === 'critical' ? 'bg-rose-500' : getOilPStatus() === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}
        />

        {/* 5. OIL TEMP */}
        <GaugeItem
          label="OIL TEMP"
          sublabel="Crankcase Sump"
          value={t.oilTemp.toFixed(1)}
          unit="°C"
          nominalRange="80-105°C"
          min={40}
          max={140}
          currentNum={t.oilTemp}
          status={getOilTStatus()}
          icon={<Thermometer className="w-3 h-3 text-amber-400" />}
          barColor={getOilTStatus() === 'critical' ? 'bg-rose-500' : getOilTStatus() === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}
        />

        {/* 6. FUEL FLOW */}
        <GaugeItem
          label="FUEL FLOW"
          sublabel="Consumption"
          value={t.fuelFlow.toFixed(1)}
          unit="L/h"
          nominalRange="18-28 L/h"
          min={5}
          max={38}
          currentNum={t.fuelFlow}
          status={getFuelStatus()}
          icon={<Wind className="w-3 h-3 text-purple-400" />}
          barColor={getFuelStatus() === 'warning' ? 'bg-amber-500' : 'bg-purple-500'}
        />

        {/* 7. VIBRATION RMS */}
        <GaugeItem
          label="VIB RMS"
          sublabel={`CF: ${t.vibrationCrestFactor.toFixed(1)}`}
          value={t.vibrationRms.toFixed(2)}
          unit="mm/s"
          nominalRange="1.5-3.2"
          min={0}
          max={12}
          currentNum={t.vibrationRms}
          status={getVibStatus()}
          icon={<Activity className="w-3 h-3 text-rose-400" />}
          barColor={getVibStatus() === 'critical' ? 'bg-rose-500' : getVibStatus() === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}
        />

        {/* 8. BATTERY VOLTAGE */}
        <GaugeItem
          label="BUS VOLTAGE"
          sublabel="Alternator 28V"
          value={t.batteryVoltage.toFixed(1)}
          unit="V"
          nominalRange="27.5-28.5V"
          min={20}
          max={32}
          currentNum={t.batteryVoltage}
          status={getVoltStatus()}
          icon={<Zap className="w-3 h-3 text-yellow-400" />}
          barColor="bg-yellow-500"
        />
      </div>
    </div>
  );
};
