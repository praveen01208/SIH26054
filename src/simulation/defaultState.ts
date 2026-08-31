import { EnvironmentalMode, FaultConfig, TelemetrySample, BaselineProfile } from '../types/telemetry';

export const INITIAL_FAULTS: FaultConfig[] = [
  {
    id: 'MISFIRE',
    name: 'Cylinder Misfire',
    category: 'Combustion',
    enabled: false,
    severity: 0.85,
    description: 'Combustion quench / spark breakdown in Cyl #3, dropping cylinder torque output and inducing cyclic jitter.',
    expectedSignature: 'RPM dip & oscillation (±75 RPM), Vibration RMS 3.2x spike, Cyl 3 EGT collapse.',
  },
  {
    id: 'INJECTOR_ABNORMALITY',
    name: 'Injector Abnormality',
    category: 'Combustion',
    enabled: false,
    severity: 0.75,
    description: 'Fuel injector partially clogged or sticking, delivering asymmetric air-fuel ratio (lean shift).',
    expectedSignature: 'Fuel flow deviation, sharp EGT rise on affected bank, slight torque loss.',
  },
  {
    id: 'COOLING_DEGRADATION',
    name: 'Cooling Degradation',
    category: 'Thermal/Lube',
    enabled: false,
    severity: 0.8,
    description: 'Cooling duct occlusion / heat exchanger fouling reducing air convective heat transfer coefficient.',
    expectedSignature: 'Monotonic slow CHT climb (+30°C), Oil Temp rising with thermal inertia lag, slight oil pressure soften.',
  },
  {
    id: 'LUBRICATION_LOSS',
    name: 'Lubrication Loss',
    category: 'Thermal/Lube',
    enabled: false,
    severity: 0.9,
    description: 'Oil pump pressure relief valve seal compromise or line leakage causing hydrodynamic film collapse.',
    expectedSignature: 'Oil Pressure plummets (<2.0 bar), hydrodynamic friction rises, Oil Temp climbs rapidly, Vibration RMS rises.',
  },
  {
    id: 'COMBUSTION_INSTABILITY',
    name: 'Combustion Instability',
    category: 'Combustion',
    enabled: false,
    severity: 0.7,
    description: 'Cycle-to-cycle turbulence variance, flame kernel instability, and irregular manifold pressure pulses.',
    expectedSignature: 'High frequency EGT jitter (±25°C), RPM oscillation, elevated vibration crest factor (>4.2).',
  },
  {
    id: 'OVERHEATING_TREND',
    name: 'Overheating Trend',
    category: 'Thermal/Lube',
    enabled: false,
    severity: 0.85,
    description: 'Sustained thermal runaway where internal heat generation exceeds maximum convective dissipation capacity.',
    expectedSignature: 'CHT + EGT + Oil Temp steadily climbing in unison into redline danger thresholds.',
  },
  {
    id: 'ABNORMAL_VIBRATION',
    name: 'Abnormal Vibration',
    category: 'Mechanical',
    enabled: false,
    severity: 0.8,
    description: 'Connecting rod journal bearing wear / propeller track imbalance generating high harmonic energy.',
    expectedSignature: 'Vibration RMS surges (>7.5 mm/s) & high crest factor with normal engine thermal and fuel metrics.',
  },
  {
    id: 'SENSOR_DRIFT',
    name: 'Sensor Drift / Failure',
    category: 'Sensory',
    enabled: false,
    severity: 0.75,
    description: 'Thermocouple ADC conditioning circuit drift (+42°C false bias on CHT) while real engine operates normally.',
    expectedSignature: 'Single CHT sensor diverges to critical alarm while correlated Oil Temp, EGT, and power output stay nominal.',
  },
];

export const NOMINAL_BASELINE: BaselineProfile = {
  rpm: 5200,
  cht: 98.5,
  egt: 765.0,
  oilPressure: 3.85,
  oilTemp: 88.0,
  fuelFlow: 22.4,
  vibrationRms: 2.15,
  batteryVoltage: 28.2,
};

export const INITIAL_TELEMETRY: TelemetrySample = {
  timestamp: Date.now(),
  simTimeSeconds: 0,
  rpm: 5200,
  manifoldPressure: 1.05,
  cht: 98.5,
  egt: 765.0,
  oilPressure: 3.85,
  oilTemp: 88.0,
  fuelFlow: 22.4,
  vibrationRms: 2.15,
  vibrationCrestFactor: 2.45,
  batteryVoltage: 28.2,
  cylinders: [
    { id: 1, cht: 97.8, egt: 762.0, pressurePeak: 68.2, combustionEff: 0.98 },
    { id: 2, cht: 99.1, egt: 768.4, pressurePeak: 69.1, combustionEff: 0.99 },
    { id: 3, cht: 98.2, egt: 763.5, pressurePeak: 68.5, combustionEff: 0.98 },
    { id: 4, cht: 98.9, egt: 766.1, pressurePeak: 68.8, combustionEff: 0.98 },
  ],
  residuals: {
    residualCht: 0.0,
    residualEgt: 0.0,
    residualOilPressure: 0.0,
    residualOilTemp: 0.0,
    residualVibration: 0.0,
    residualRpm: 0.0,
    residualFuelFlow: 0.0,
    totalNorm: 0.02,
  },
  throttlePosition: 75,
  torqueNm: 145.0,
  powerKw: 79.0,
  lambdaAfr: 1.01,
  ambientTemp: 20.0,
  ambientPressure: 1013.25,
  densityAltitudeFt: 1500,
  frictionTorque: 12.0,
};

export const ENV_MODE_PRESETS: Record<EnvironmentalMode, {
  name: string;
  description: string;
  ambientTemp: number; // °C
  ambientPressure: number; // mbar
  densityAltitudeFt: number; // ft
  throttleDefault: number;
}> = {
  NORMAL: {
    name: 'Normal Cruise',
    description: 'Standard atmospheric conditions at 3,000 ft MSL, balanced cooling and nominal fuel-air mix.',
    ambientTemp: 18.0,
    ambientPressure: 900.0,
    densityAltitudeFt: 3200,
    throttleDefault: 75,
  },
  HIGH_ALTITUDE: {
    name: 'High Altitude (18,000 ft)',
    description: 'Thin air density reduces turbo efficiency and manifold pressure; CHT & EGT trend upwards due to reduced mass cooling.',
    ambientTemp: -20.0,
    ambientPressure: 505.0,
    densityAltitudeFt: 18500,
    throttleDefault: 88,
  },
  HOT_WEATHER: {
    name: 'Hot Weather / Desert (45°C)',
    description: 'Extreme ambient heat. Radiator heat dissipation delta is minimal — CHT and Oil Temp climb rapidly toward safety limits.',
    ambientTemp: 45.0,
    ambientPressure: 1005.0,
    densityAltitudeFt: 6200,
    throttleDefault: 72,
  },
  ENDURANCE: {
    name: 'Endurance Loiter',
    description: 'Extended low-power station keeping (60% throttle). Slow continuous thermal soak reaching equilibrium over extended operation.',
    ambientTemp: 15.0,
    ambientPressure: 850.0,
    densityAltitudeFt: 4500,
    throttleDefault: 58,
  },
  RAPID_THROTTLE: {
    name: 'Rapid Throttle Transients',
    description: 'Dynamic power modulation testing turbo spool-up lag and thermal inertia responsiveness.',
    ambientTemp: 22.0,
    ambientPressure: 980.0,
    densityAltitudeFt: 2500,
    throttleDefault: 80,
  },
};
