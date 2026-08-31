import {
  EnvironmentalMode,
  FaultConfig,
  TelemetrySample,
  CylinderTelemetry,
  PhysicsResiduals,
} from '../types/telemetry';
import { ENV_MODE_PRESETS, NOMINAL_BASELINE } from './defaultState';

export interface InternalPhysicsState {
  simTimeSeconds: number;
  throttleTarget: number;
  throttleActual: number;
  manifoldPressure: number; // bar
  engineSpeedRpm: number; // RPM
  targetRpm: number;
  chtReal: number; // Actual internal cylinder head temp °C
  chtSensorDriftBias: number; // Drift offset in °C
  egtReal: number; // Actual exhaust gas temp °C
  oilTempReal: number; // °C
  oilPressureReal: number; // bar
  fuelFlowReal: number; // L/h
  vibrationRmsReal: number; // mm/s
  vibrationCrestFactor: number;
  batteryVoltageReal: number; // V
  cylinders: CylinderTelemetry[];
  heatStoredJoules: number;
  rapidThrottlePhase: number;
}

export function createInitialPhysicsState(): InternalPhysicsState {
  return {
    simTimeSeconds: 0,
    throttleTarget: 75,
    throttleActual: 75,
    manifoldPressure: 1.05,
    engineSpeedRpm: 5200,
    targetRpm: 5200,
    chtReal: 98.5,
    chtSensorDriftBias: 0,
    egtReal: 765.0,
    oilTempReal: 88.0,
    oilPressureReal: 3.85,
    fuelFlowReal: 22.4,
    vibrationRmsReal: 2.15,
    vibrationCrestFactor: 2.45,
    batteryVoltageReal: 28.2,
    cylinders: [
      { id: 1, cht: 97.8, egt: 762.0, pressurePeak: 68.2, combustionEff: 0.98 },
      { id: 2, cht: 99.1, egt: 768.4, pressurePeak: 69.1, combustionEff: 0.99 },
      { id: 3, cht: 98.2, egt: 763.5, pressurePeak: 68.5, combustionEff: 0.98 },
      { id: 4, cht: 98.9, egt: 766.1, pressurePeak: 68.8, combustionEff: 0.98 },
    ],
    heatStoredJoules: 150000,
    rapidThrottlePhase: 0,
  };
}

/**
 * Step the causal physics chain forward by dt seconds (typically 0.5s)
 * Atmosphere → Airflow → Fuel + Combustion → Torque + RPM → Thermal + Oil → Vibration
 */
export function stepPhysics(
  prevState: InternalPhysicsState,
  envMode: EnvironmentalMode,
  faults: FaultConfig[],
  userThrottle: number,
  dt: number = 0.5
): { state: InternalPhysicsState; telemetry: TelemetrySample } {
  const envConfig = ENV_MODE_PRESETS[envMode];
  const nextSimTime = prevState.simTimeSeconds + dt;

  // Extract active fault configs
  const getFault = (id: string) => faults.find((f) => f.id === id && f.enabled);
  const fMisfire = getFault('MISFIRE');
  const fInjector = getFault('INJECTOR_ABNORMALITY');
  const fCooling = getFault('COOLING_DEGRADATION');
  const fLube = getFault('LUBRICATION_LOSS');
  const fInstability = getFault('COMBUSTION_INSTABILITY');
  const fOverheat = getFault('OVERHEATING_TREND');
  const fAbnormalVib = getFault('ABNORMAL_VIBRATION');
  const fSensorDrift = getFault('SENSOR_DRIFT');

  // --- 1. ATMOSPHERE & INLET DYNAMICS ---
  let targetThrottle = userThrottle;
  let rapidPhase = prevState.rapidThrottlePhase;

  if (envMode === 'RAPID_THROTTLE') {
    rapidPhase += dt * 0.8;
    targetThrottle = 75 + Math.sin(rapidPhase) * 20;
  }

  // Throttle actuator 1st-order lag
  const throttleRate = 1.4;
  const throttleActual =
    prevState.throttleActual + (targetThrottle - prevState.throttleActual) * (1 - Math.exp(-throttleRate * dt));

  // Ambient air density factor based on altitude and temperature
  const tempKelvin = envConfig.ambientTemp + 273.15;
  const airDensityFactor = (envConfig.ambientPressure / 1013.25) * (288.15 / tempKelvin);

  // Manifold Pressure (MAP)
  const baseMap = 0.75 + (throttleActual / 100) * 0.40;
  let turboBoostEfficiency = 1.0;
  if (envMode === 'HIGH_ALTITUDE') {
    turboBoostEfficiency = 0.86;
  }
  const commandedMap = baseMap * (0.4 + 0.6 * turboBoostEfficiency * Math.sqrt(airDensityFactor));
  const manifoldPressure =
    prevState.manifoldPressure + (commandedMap - prevState.manifoldPressure) * (1 - Math.exp(-1.8 * dt));

  // --- 2. FUEL & COMBUSTION ---
  let commandedLambda = 1.0;
  let fuelRailEfficiency = 1.0;

  if (fInjector) {
    fuelRailEfficiency -= 0.28 * fInjector.severity;
  }

  const baseFuelFlow = (10.0 + (throttleActual / 100) * 16.5) * fuelRailEfficiency;
  const fuelNoise = (Math.random() - 0.5) * 0.15;
  const fuelFlowReal = Math.max(6.0, baseFuelFlow + fuelNoise);

  const actualLambda = commandedLambda * (1.0 / Math.max(0.65, fuelRailEfficiency));

  // Combustion Efficiency & Cylinder Variations
  const cylinderCombEffs: number[] = [0.98, 0.99, 0.98, 0.98];
  let misfireCyclicJitter = 0;

  if (fMisfire) {
    const misfireDrop = 0.88 * fMisfire.severity;
    cylinderCombEffs[2] = 0.98 - misfireDrop;
    misfireCyclicJitter = (Math.random() - 0.5) * 80 * fMisfire.severity;
  }

  if (fInstability) {
    for (let i = 0; i < 4; i++) {
      cylinderCombEffs[i] += (Math.random() - 0.5) * 0.18 * fInstability.severity;
    }
  }

  const avgCombEff = cylinderCombEffs.reduce((a, b) => a + b, 0) / 4;

  // --- 3. TORQUE & ENGINE RPM ---
  const nominalTorque = (60 + (throttleActual / 100) * 130) * (avgCombEff / 0.9825);
  
  let frictionTorque = 12.0 + (prevState.engineSpeedRpm / 5200) * 2.0;
  if (fLube) {
    frictionTorque += 32.0 * fLube.severity;
  }

  const netShaftTorque = Math.max(20, nominalTorque - frictionTorque);

  const nominalCruiseRpm = 3000 + (throttleActual / 100) * 2933;
  let targetRpm = nominalCruiseRpm * Math.sqrt(Math.max(0.2, netShaftTorque / 145.0));

  if (envMode === 'HIGH_ALTITUDE') {
    targetRpm *= 0.97;
  }

  let rpmOscillation = 0;
  if (fMisfire) {
    rpmOscillation += misfireCyclicJitter;
  }
  if (fInstability) {
    rpmOscillation += Math.sin(nextSimTime * 12) * 50 * fInstability.severity + (Math.random() - 0.5) * 30;
  }

  const rpmInertiaRate = 2.4;
  const engineSpeedRpm = Math.max(
    1200,
    prevState.engineSpeedRpm + (targetRpm - prevState.engineSpeedRpm) * (1 - Math.exp(-rpmInertiaRate * dt)) + rpmOscillation * 0.25
  );

  const powerKw = (netShaftTorque * ((engineSpeedRpm * 2 * Math.PI) / 60)) / 1000;

  // --- 4. THERMAL & OIL BALANCE ---
  let coolingCoeff = 1.0 * Math.sqrt(Math.max(0.35, airDensityFactor));
  if (fCooling) {
    coolingCoeff *= Math.max(0.2, 1.0 - 0.68 * fCooling.severity);
  }
  if (fOverheat) {
    coolingCoeff *= Math.max(0.18, 1.0 - 0.76 * fOverheat.severity);
  }

  const baseChtDelta = 40 + (throttleActual / 100) * 54;
  let targetCht = envConfig.ambientTemp + (baseChtDelta / coolingCoeff);

  if (fInjector) {
    targetCht += 16 * fInjector.severity;
  }
  if (envMode === 'HOT_WEATHER') {
    targetCht += 24;
  }
  if (envMode === 'HIGH_ALTITUDE') {
    targetCht += 14;
  }

  const chtThermalLag = 0.15;
  const chtReal = prevState.chtReal + (targetCht - prevState.chtReal) * (1 - Math.exp(-chtThermalLag * dt));

  // Exhaust Gas Temperature (EGT)
  let targetEgt = 660 + (throttleActual / 100) * 140;
  if (actualLambda > 1.04) {
    targetEgt += 105 * ((actualLambda - 1.0) / 0.25);
  }
  if (fOverheat) {
    targetEgt += 90 * fOverheat.severity;
  }
  if (envMode === 'HIGH_ALTITUDE') {
    targetEgt += 42;
  }

  const egtThermalLag = 0.7;
  const egtReal = prevState.egtReal + (targetEgt - prevState.egtReal) * (1 - Math.exp(-egtThermalLag * dt));

  // Per-Cylinder Temperatures
  const updatedCylinders: CylinderTelemetry[] = prevState.cylinders.map((cyl, idx) => {
    let cylCht = chtReal + (idx === 1 ? 0.6 : idx === 0 ? -0.7 : 0.2) + (Math.random() - 0.5) * 0.3;
    let cylEgt = egtReal + (idx === 1 ? 3.0 : idx === 2 ? -1.5 : 1.0) + (Math.random() - 0.5) * 1.5;
    
    if (fMisfire && cyl.id === 3) {
      cylEgt = Math.max(220, cylEgt - 400 * fMisfire.severity);
      cylCht -= 18 * fMisfire.severity;
    }
    if (fInjector && (cyl.id === 1 || cyl.id === 2)) {
      cylEgt += 70 * fInjector.severity;
      cylCht += 12 * fInjector.severity;
    }

    return {
      id: cyl.id,
      cht: parseFloat(cylCht.toFixed(1)),
      egt: parseFloat(cylEgt.toFixed(1)),
      pressurePeak: parseFloat((64 + (throttleActual / 100) * 16 * cylinderCombEffs[idx]).toFixed(1)),
      combustionEff: parseFloat(cylinderCombEffs[idx].toFixed(2)),
    };
  });

  // Oil Temperature
  let targetOilTemp = 35 + (chtReal) * 0.54;
  if (fLube) {
    targetOilTemp += 38 * fLube.severity;
  }
  if (envMode === 'HOT_WEATHER') {
    targetOilTemp += 18;
  }

  const oilTempLag = 0.10;
  const oilTempReal = prevState.oilTempReal + (targetOilTemp - prevState.oilTempReal) * (1 - Math.exp(-oilTempLag * dt));

  // Oil Pressure
  let baseOilPressure = 1.8 + (engineSpeedRpm / 5200) * 2.15 - (oilTempReal - 88) * 0.012;
  if (fLube) {
    baseOilPressure = Math.max(0.5, baseOilPressure * (1.0 - 0.82 * fLube.severity));
  }
  if (fCooling && chtReal > 115) {
    baseOilPressure -= 0.35;
  }

  const oilPressLag = 1.8;
  const oilPressureNoise = (Math.random() - 0.5) * 0.04;
  const oilPressureReal = Math.max(
    0.35,
    prevState.oilPressureReal + (baseOilPressure - prevState.oilPressureReal) * (1 - Math.exp(-oilPressLag * dt)) + oilPressureNoise
  );

  // --- 5. VIBRATION DYNAMICS ---
  let baseVibration = 1.65 + (engineSpeedRpm / 5200) * 0.5;
  let crestFactor = 2.45;

  if (fMisfire) {
    baseVibration += 5.2 * fMisfire.severity;
    crestFactor += 1.8 * fMisfire.severity;
  }
  if (fLube && oilPressureReal < 2.2) {
    baseVibration += 3.4 * fLube.severity;
    crestFactor += 1.3;
  }
  if (fInstability) {
    baseVibration += 2.4 * fInstability.severity;
    crestFactor += 1.9 * fInstability.severity;
  }
  if (fAbnormalVib) {
    baseVibration += 6.8 * fAbnormalVib.severity;
    crestFactor += 2.4 * fAbnormalVib.severity;
  }

  const vibNoise = (Math.random() - 0.5) * 0.15;
  const vibrationRmsReal = Math.max(0.8, baseVibration + vibNoise);
  const vibrationCrestFactor = Math.max(1.8, crestFactor + (Math.random() - 0.5) * 0.15);

  // --- 6. ELECTRICAL SYSTEM & SENSOR DRIFT ---
  const batteryVoltageReal = 28.2 + (engineSpeedRpm > 3000 ? 0.1 : -0.8) + (Math.random() - 0.5) * 0.05;

  let sensorDriftTarget = 0;
  if (fSensorDrift) {
    sensorDriftTarget = 44.0 * fSensorDrift.severity;
  }
  const chtSensorDriftBias =
    prevState.chtSensorDriftBias + (sensorDriftTarget - prevState.chtSensorDriftBias) * (1 - Math.exp(-0.45 * dt));

  const displayedCht = chtReal + chtSensorDriftBias;

  // --- 7. PHYSICS RESIDUALS COMPUTATION (Slide 11: r = measured - physics-predicted) ---
  const residualCht = parseFloat((displayedCht - NOMINAL_BASELINE.cht).toFixed(1));
  const residualEgt = parseFloat((egtReal - NOMINAL_BASELINE.egt).toFixed(1));
  const residualOilPressure = parseFloat((oilPressureReal - NOMINAL_BASELINE.oilPressure).toFixed(2));
  const residualOilTemp = parseFloat((oilTempReal - NOMINAL_BASELINE.oilTemp).toFixed(1));
  const residualVibration = parseFloat((vibrationRmsReal - NOMINAL_BASELINE.vibrationRms).toFixed(2));
  const residualRpm = parseFloat((engineSpeedRpm - NOMINAL_BASELINE.rpm).toFixed(0));
  const residualFuelFlow = parseFloat((fuelFlowReal - NOMINAL_BASELINE.fuelFlow).toFixed(1));

  const normSum =
    Math.pow(residualCht / 15, 2) +
    Math.pow(residualEgt / 40, 2) +
    Math.pow(residualOilPressure / 0.8, 2) +
    Math.pow(residualOilTemp / 10, 2) +
    Math.pow(residualVibration / 1.5, 2);
  const totalNorm = parseFloat(Math.sqrt(normSum).toFixed(2));

  const residuals: PhysicsResiduals = {
    residualCht,
    residualEgt,
    residualOilPressure,
    residualOilTemp,
    residualVibration,
    residualRpm,
    residualFuelFlow,
    totalNorm,
  };

  const nextPhysicsState: InternalPhysicsState = {
    simTimeSeconds: nextSimTime,
    throttleTarget: targetThrottle,
    throttleActual: parseFloat(throttleActual.toFixed(1)),
    manifoldPressure: parseFloat(manifoldPressure.toFixed(2)),
    engineSpeedRpm: parseFloat(engineSpeedRpm.toFixed(0)),
    targetRpm: parseFloat(targetRpm.toFixed(0)),
    chtReal: parseFloat(chtReal.toFixed(1)),
    chtSensorDriftBias: parseFloat(chtSensorDriftBias.toFixed(1)),
    egtReal: parseFloat(egtReal.toFixed(1)),
    oilTempReal: parseFloat(oilTempReal.toFixed(1)),
    oilPressureReal: parseFloat(oilPressureReal.toFixed(2)),
    fuelFlowReal: parseFloat(fuelFlowReal.toFixed(1)),
    vibrationRmsReal: parseFloat(vibrationRmsReal.toFixed(2)),
    vibrationCrestFactor: parseFloat(vibrationCrestFactor.toFixed(2)),
    batteryVoltageReal: parseFloat(batteryVoltageReal.toFixed(2)),
    cylinders: updatedCylinders,
    heatStoredJoules: prevState.heatStoredJoules + (powerKw * 1.45 - 50 * coolingCoeff) * 1000 * dt,
    rapidThrottlePhase: rapidPhase,
  };

  const telemetrySample: TelemetrySample = {
    timestamp: Date.now(),
    simTimeSeconds: parseFloat(nextSimTime.toFixed(1)),
    rpm: nextPhysicsState.engineSpeedRpm,
    manifoldPressure: nextPhysicsState.manifoldPressure,
    cht: parseFloat(displayedCht.toFixed(1)),
    egt: nextPhysicsState.egtReal,
    oilPressure: nextPhysicsState.oilPressureReal,
    oilTemp: nextPhysicsState.oilTempReal,
    fuelFlow: nextPhysicsState.fuelFlowReal,
    vibrationRms: nextPhysicsState.vibrationRmsReal,
    vibrationCrestFactor: nextPhysicsState.vibrationCrestFactor,
    batteryVoltage: nextPhysicsState.batteryVoltageReal,
    cylinders: nextPhysicsState.cylinders,
    residuals,
    throttlePosition: nextPhysicsState.throttleActual,
    torqueNm: parseFloat(netShaftTorque.toFixed(1)),
    powerKw: parseFloat(powerKw.toFixed(1)),
    lambdaAfr: parseFloat(actualLambda.toFixed(2)),
    ambientTemp: envConfig.ambientTemp,
    ambientPressure: envConfig.ambientPressure,
    densityAltitudeFt: envConfig.densityAltitudeFt,
    frictionTorque: parseFloat(frictionTorque.toFixed(1)),
  };

  return { state: nextPhysicsState, telemetry: telemetrySample };
}
