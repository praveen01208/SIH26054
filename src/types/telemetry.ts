export type EnvironmentalMode = 
  | 'NORMAL'
  | 'HIGH_ALTITUDE'
  | 'HOT_WEATHER'
  | 'ENDURANCE'
  | 'RAPID_THROTTLE';

export type FaultId = 
  | 'MISFIRE'
  | 'INJECTOR_ABNORMALITY'
  | 'COOLING_DEGRADATION'
  | 'LUBRICATION_LOSS'
  | 'COMBUSTION_INSTABILITY'
  | 'OVERHEATING_TREND'
  | 'ABNORMAL_VIBRATION'
  | 'SENSOR_DRIFT';

export interface FaultConfig {
  id: FaultId;
  name: string;
  category: 'Combustion' | 'Thermal/Lube' | 'Mechanical' | 'Sensory';
  enabled: boolean;
  severity: number; // 0.0 to 1.0 (defaults to 0.8)
  description: string;
  expectedSignature: string;
}

export type ConnectionStatus = 'CONNECTED' | 'STALE' | 'DISCONNECTED';

export interface CylinderTelemetry {
  id: number;
  cht: number; // °C (Cylinder Head Temp)
  egt: number; // °C (Exhaust Gas Temp)
  pressurePeak: number; // bar
  combustionEff: number; // 0..1
}

export interface PhysicsResiduals {
  residualCht: number; // °C delta vs physics nominal
  residualEgt: number; // °C delta vs physics nominal
  residualOilPressure: number; // bar delta vs physics nominal
  residualOilTemp: number; // °C delta vs physics nominal
  residualVibration: number; // mm/s delta vs physics nominal
  residualRpm: number; // RPM delta vs physics nominal
  residualFuelFlow: number; // L/h delta
  totalNorm: number; // Euclidean norm of residuals
}

export interface TelemetrySample {
  timestamp: number; // epoch ms
  simTimeSeconds: number; // elapsed simulation seconds
  
  // Primary State Variables
  rpm: number; // Engine RPM (nominal ~4800-5400)
  manifoldPressure: number; // bar (nominal 0.95-1.2 bar)
  cht: number; // Avg CHT °C (nominal 85-115°C, max 135°C)
  egt: number; // Avg EGT °C (nominal 720-820°C, max 880°C)
  oilPressure: number; // bar (nominal 2.5 - 5.0 bar, min 1.8)
  oilTemp: number; // °C (nominal 80-105°C, max 125°C)
  fuelFlow: number; // L/h (nominal 18-28 L/h)
  vibrationRms: number; // mm/s (nominal 1.5-3.2 mm/s, alert > 6.0)
  vibrationCrestFactor: number; // ratio (nominal 2.0-3.5)
  batteryVoltage: number; // V (nominal 27.5-28.5V)
  
  // Per-cylinder breakdowns
  cylinders: CylinderTelemetry[];
  
  // Physics Intermediate variables & Slide 11 Residuals (r = measured - physics-predicted)
  residuals: PhysicsResiduals;
  throttlePosition: number; // 0 - 100%
  torqueNm: number; // Nm output
  powerKw: number; // kW
  lambdaAfr: number; // AFR equivalence ratio (nominal 0.95 - 1.05)
  ambientTemp: number; // °C
  ambientPressure: number; // mbar
  densityAltitudeFt: number; // ft
  frictionTorque: number; // Nm
}

export type SensorImportance = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SensorContribution {
  sensorKey: string;
  sensorName: string;
  importance: SensorImportance;
  deviationPct: number; // deviation % from baseline
  impactSummary: string;
  shapScore: number; // SHAP attribution value
}

export interface AIDiagnostics {
  healthIndex: number; // 0 to 100 (100 = perfect health)
  healthStatus: 'OPTIMAL' | 'NOMINAL' | 'DEGRADED' | 'WARNING' | 'CRITICAL';
  anomalyScore: number; // 0.00 to 1.00 (smooth continuous metric)
  isAnomalyDetected: boolean;
  
  primaryDiagnosis: string;
  confidencePct: number; // 0 to 100%
  secondaryDiagnosis?: string;
  secondaryConfidencePct?: number;
  
  rulHours: number; // Remaining Useful Life in flight hours
  rulUncertaintyMarginHours: number; // ± error margin (e.g. ±15%)
  rulDegradationRate: number; // health points lost per hour
  
  explainability: string; // e.g. "Lubrication degradation likely — driven primarily by falling oil pressure and rising oil temperature."
  sensorContributions: SensorContribution[];
  kalmanResidualNorm: number; // Kalman filter innovation residual
}

export interface AlertEvent {
  id: string;
  timestamp: string; // HH:MM:SS
  simTime: number;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  sensor: string;
  value: string;
  envMode: EnvironmentalMode;
  acknowledged?: boolean;
}

export interface BaselineProfile {
  rpm: number;
  cht: number;
  egt: number;
  oilPressure: number;
  oilTemp: number;
  fuelFlow: number;
  vibrationRms: number;
  batteryVoltage: number;
}
