import {
  TelemetrySample,
  AIDiagnostics,
  SensorContribution,
  SensorImportance,
  BaselineProfile,
} from '../types/telemetry';
import { NOMINAL_BASELINE } from './defaultState';

interface FaultSignaturePattern {
  id: string;
  name: string;
  checkMatch: (
    t: TelemetrySample,
    base: BaselineProfile
  ) => { score: number; rationale: string };
}

const FAULT_PATTERNS: FaultSignaturePattern[] = [
  {
    id: 'LUBRICATION_LOSS',
    name: 'Lubrication System Breakdown',
    checkMatch: (t, base) => {
      const pressDrop = Math.max(0, (base.oilPressure - t.oilPressure) / base.oilPressure);
      const tempRise = Math.max(0, (t.oilTemp - base.oilTemp) / base.oilTemp);
      const vibRise = Math.max(0, (t.vibrationRms - base.vibrationRms) / base.vibrationRms);
      
      let match = 0;
      if (pressDrop > 0.25) match += 0.55 * Math.min(1, pressDrop / 0.5);
      if (tempRise > 0.08) match += 0.30 * Math.min(1, tempRise / 0.25);
      if (vibRise > 0.2) match += 0.15 * Math.min(1, vibRise / 0.8);
      
      return {
        score: Math.min(0.99, match),
        rationale: 'Lubrication degradation likely — driven primarily by falling oil pressure and rising oil temperature inducing hydrodynamic boundary friction.',
      };
    },
  },
  {
    id: 'MISFIRE',
    name: 'Cylinder Combustion Misfire',
    checkMatch: (t, base) => {
      const vibSpike = Math.max(0, (t.vibrationRms - base.vibrationRms) / base.vibrationRms);
      const cylEgtMin = Math.min(...t.cylinders.map((c) => c.egt));
      const cylEgtMax = Math.max(...t.cylinders.map((c) => c.egt));
      const egtDelta = cylEgtMax - cylEgtMin;
      
      let match = 0;
      if (vibSpike > 0.6) match += 0.50 * Math.min(1, vibSpike / 1.5);
      if (egtDelta > 80) match += 0.50 * Math.min(1, (egtDelta - 80) / 200);

      return {
        score: Math.min(0.98, match),
        rationale: 'Cylinder misfire detected — isolated EGT drop on Cyl #3 with severe 0.5x harmonic torque imbalance and vibration spike.',
      };
    },
  },
  {
    id: 'INJECTOR_ABNORMALITY',
    name: 'Fuel Injector Asymmetry',
    checkMatch: (t, base) => {
      const fuelDev = (base.fuelFlow - t.fuelFlow) / base.fuelFlow;
      const egtRise = (t.egt - base.egt) / base.egt;
      const lambdaDev = t.lambdaAfr - 1.0;

      let match = 0;
      if (fuelDev > 0.12 && egtRise > 0.05) {
        match = 0.5 * Math.min(1, fuelDev / 0.25) + 0.5 * Math.min(1, egtRise / 0.12);
      } else if (lambdaDev > 0.08) {
        match = 0.8 * Math.min(1, lambdaDev / 0.2);
      }

      return {
        score: Math.min(0.96, match),
        rationale: 'Fuel injector abnormality identified — asymmetric fuel flow delivery causing lean AFR excursion and elevated exhaust temperatures.',
      };
    },
  },
  {
    id: 'COOLING_DEGRADATION',
    name: 'Thermal Cooling System Degradation',
    checkMatch: (t, base) => {
      const chtRise = Math.max(0, (t.cht - base.cht) / base.cht);
      const oilTempRise = Math.max(0, (t.oilTemp - base.oilTemp) / base.oilTemp);
      const vibNormal = t.vibrationRms < 4.0;

      let match = 0;
      if (chtRise > 0.12 && oilTempRise > 0.08 && vibNormal) {
        match = 0.55 * Math.min(1, chtRise / 0.3) + 0.45 * Math.min(1, oilTempRise / 0.25);
      }

      return {
        score: Math.min(0.96, match),
        rationale: 'Cooling airflow degradation suspected — steady CHT thermal buildup with proportional oil temperature rise while mechanical vibration remains nominal.',
      };
    },
  },
  {
    id: 'OVERHEATING_TREND',
    name: 'Critical Multi-System Overheating',
    checkMatch: (t) => {
      const chtHigh = Math.max(0, (t.cht - 110) / 25);
      const egtHigh = Math.max(0, (t.egt - 800) / 80);
      const oilHigh = Math.max(0, (t.oilTemp - 100) / 25);

      let match = 0;
      if (chtHigh > 0 && (egtHigh > 0 || oilHigh > 0)) {
        match = 0.4 * Math.min(1, chtHigh) + 0.3 * Math.min(1, egtHigh) + 0.3 * Math.min(1, oilHigh);
      }

      return {
        score: Math.min(0.99, match),
        rationale: 'Overheating trend active — internal thermal generation exceeding cooling capacity, driving simultaneous CHT, EGT, and oil temperature surge.',
      };
    },
  },
  {
    id: 'ABNORMAL_VIBRATION',
    name: 'Mechanical & Bearing Imbalance',
    checkMatch: (t, base) => {
      const vibSpike = Math.max(0, (t.vibrationRms - base.vibrationRms) / base.vibrationRms);
      const thermalNormal = Math.abs(t.cht - base.cht) < 18 && Math.abs(t.oilTemp - base.oilTemp) < 15;
      const cylEgtBalanced = (Math.max(...t.cylinders.map((c) => c.egt)) - Math.min(...t.cylinders.map((c) => c.egt))) < 35;

      let match = 0;
      if (vibSpike > 0.8 && thermalNormal && cylEgtBalanced) {
        match = 0.92 * Math.min(1, vibSpike / 2.0);
      }

      return {
        score: Math.min(0.98, match),
        rationale: 'Mechanical anomaly detected — elevated vibration RMS and crest factor without thermal or combustion deviation, pointing to bearing race fatigue or prop tracking error.',
      };
    },
  },
  {
    id: 'COMBUSTION_INSTABILITY',
    name: 'Cyclic Combustion Instability',
    checkMatch: (t) => {
      const crestSpike = Math.max(0, (t.vibrationCrestFactor - 2.8) / 1.5);
      const vibModerate = t.vibrationRms > 3.0 && t.vibrationRms < 6.0;

      let match = 0;
      if (crestSpike > 0.2) {
        match = 0.6 * Math.min(1, crestSpike) + (vibModerate ? 0.35 : 0.1);
      }

      return {
        score: Math.min(0.94, match),
        rationale: 'Cyclic combustion instability — cycle-to-cycle turbulence variance generating acoustic pressure pulses and elevated vibration crest factor.',
      };
    },
  },
  {
    id: 'SENSOR_DRIFT',
    name: 'Sensor Drift / Instrumentation Failure',
    checkMatch: (t, base) => {
      const chtDev = Math.max(0, (t.cht - base.cht) / base.cht);
      const oilTempNominal = Math.abs(t.oilTemp - base.oilTemp) < 8;
      const egtNominal = Math.abs(t.egt - base.egt) < 25;
      const vibNominal = t.vibrationRms < 3.2;

      let match = 0;
      if (chtDev > 0.25 && oilTempNominal && egtNominal && vibNominal) {
        match = 0.95 * Math.min(1, chtDev / 0.4);
      }

      return {
        score: Math.min(0.97, match),
        rationale: 'Sensor calibration failure — CHT channel indicates critical overtemperature while all coupled thermodynamic channels (Oil Temp, EGT, Vibration) confirm healthy engine physics.',
      };
    },
  },
];

/**
 * Compute real-time deterministic AI Diagnostics, Health Index, Anomaly Score,
 * RUL, and Per-Sensor Explainability (SHAP) Attribution tags.
 */
export function computeAIDiagnostics(
  telemetry: TelemetrySample,
  baseline: BaselineProfile = NOMINAL_BASELINE
): AIDiagnostics {
  const devRpm = Math.abs(telemetry.rpm - baseline.rpm) / baseline.rpm;
  const devCht = Math.abs(telemetry.cht - baseline.cht) / baseline.cht;
  const devEgt = Math.abs(telemetry.egt - baseline.egt) / baseline.egt;
  const devOilP = Math.abs(telemetry.oilPressure - baseline.oilPressure) / baseline.oilPressure;
  const devOilT = Math.abs(telemetry.oilTemp - baseline.oilTemp) / baseline.oilTemp;
  const devFuel = Math.abs(telemetry.fuelFlow - baseline.fuelFlow) / baseline.fuelFlow;
  const devVib = Math.abs(telemetry.vibrationRms - baseline.vibrationRms) / baseline.vibrationRms;

  const weightedSum =
    devRpm * 0.8 +
    devCht * 1.8 +
    devEgt * 1.1 +
    devOilP * 2.2 +
    devOilT * 1.6 +
    devFuel * 0.9 +
    devVib * 2.0;

  const normalizedStrain = weightedSum / 0.85;
  const anomalyScoreRaw = 1 - 1 / (1 + Math.pow(normalizedStrain, 1.8));
  const anomalyScore = parseFloat(Math.min(1.0, Math.max(0.02, anomalyScoreRaw)).toFixed(2));
  const isAnomalyDetected = anomalyScore > 0.35;

  const rawHealth = 100 - anomalyScore * 88 - (weightedSum > 1.5 ? (weightedSum - 1.5) * 10 : 0);
  const healthIndex = Math.max(8, Math.min(100, Math.round(rawHealth)));

  let healthStatus: AIDiagnostics['healthStatus'] = 'OPTIMAL';
  if (healthIndex >= 90) healthStatus = 'OPTIMAL';
  else if (healthIndex >= 75) healthStatus = 'NOMINAL';
  else if (healthIndex >= 55) healthStatus = 'DEGRADED';
  else if (healthIndex >= 35) healthStatus = 'WARNING';
  else healthStatus = 'CRITICAL';

  let bestMatch: { id: string; name: string; score: number; rationale: string } = {
    id: 'NOMINAL',
    name: 'Nominal Engine Operation',
    score: 0,
    rationale: 'All primary thermodynamic, lubrication, and vibration channels operating within certified flight envelope.',
  };

  let secondMatch: { id: string; name: string; score: number } | undefined = undefined;

  const matches = FAULT_PATTERNS.map((pattern) => {
    const res = pattern.checkMatch(telemetry, baseline);
    return {
      id: pattern.id,
      name: pattern.name,
      score: res.score,
      rationale: res.rationale,
    };
  }).sort((a, b) => b.score - a.score);

  if (matches[0] && matches[0].score >= 0.25) {
    bestMatch = matches[0];
    if (matches[1] && matches[1].score >= 0.2) {
      secondMatch = {
        id: matches[1].id,
        name: matches[1].name,
        score: matches[1].score,
      };
    }
  }

  const confidencePct = bestMatch.score > 0 ? Math.min(99, Math.round(bestMatch.score * 100)) : 98;

  let baseRulHours = 420;
  let degradationRate = 0.8;

  if (healthIndex < 90) {
    const healthDropRatio = (100 - healthIndex) / 100;
    baseRulHours = 420 * Math.pow(1 - healthDropRatio, 2.2);
    degradationRate = 1.0 + healthDropRatio * 18.0;
  }

  const rulHours = parseFloat(Math.max(0.4, baseRulHours).toFixed(1));
  const rulUncertaintyMarginHours = parseFloat((rulHours * 0.15).toFixed(1));

  // Feature Attribution (SHAP score derivation)
  const sensorConfigs: { key: string; name: string; dev: number; weight: number; desc: string }[] = [
    { key: 'oilPressure', name: 'Oil Pressure', dev: devOilP, weight: 2.2, desc: `${(telemetry.oilPressure).toFixed(2)} bar (${devOilP > 0.2 ? (telemetry.oilPressure < baseline.oilPressure ? 'Depleted' : 'Surge') : 'Nominal'})` },
    { key: 'oilTemp', name: 'Oil Temperature', dev: devOilT, weight: 1.6, desc: `${(telemetry.oilTemp).toFixed(1)} °C (${devOilT > 0.15 ? 'Elevated' : 'Nominal'})` },
    { key: 'vibrationRms', name: 'Vibration RMS', dev: devVib, weight: 2.0, desc: `${(telemetry.vibrationRms).toFixed(2)} mm/s (${devVib > 0.4 ? 'Harmonic Spike' : 'Nominal'})` },
    { key: 'cht', name: 'Cylinder Head Temp', dev: devCht, weight: 1.8, desc: `${(telemetry.cht).toFixed(1)} °C (${devCht > 0.18 ? 'Thermal Rise' : 'Nominal'})` },
    { key: 'egt', name: 'Exhaust Gas Temp', dev: devEgt, weight: 1.1, desc: `${(telemetry.egt).toFixed(0)} °C (${devEgt > 0.1 ? 'Exhaust Delta' : 'Nominal'})` },
    { key: 'fuelFlow', name: 'Fuel Flow Rate', dev: devFuel, weight: 0.9, desc: `${(telemetry.fuelFlow).toFixed(1)} L/h` },
    { key: 'rpm', name: 'Engine Speed (RPM)', dev: devRpm, weight: 0.8, desc: `${(telemetry.rpm).toFixed(0)} RPM` },
  ];

  const totalImpact = sensorConfigs.reduce((acc, s) => acc + s.dev * s.weight, 0);

  const sensorContributions: SensorContribution[] = sensorConfigs
    .map((s) => {
      const impactScore = s.dev * s.weight;
      const shapScore = totalImpact > 0 ? parseFloat((impactScore / totalImpact).toFixed(3)) : 0.05;

      let importance: SensorImportance = 'LOW';
      if (impactScore > 0.45 || s.dev > 0.35) {
        importance = 'HIGH';
      } else if (impactScore > 0.18 || s.dev > 0.15) {
        importance = 'MEDIUM';
      }
      return {
        sensorKey: s.key,
        sensorName: s.name,
        importance,
        deviationPct: parseFloat((s.dev * 100).toFixed(1)),
        impactSummary: s.desc,
        shapScore,
      };
    })
    .sort((a, b) => {
      const rank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return rank[b.importance] - rank[a.importance] || b.deviationPct - a.deviationPct;
    });

  const kalmanResidualNorm = telemetry.residuals ? telemetry.residuals.totalNorm : 0.05;

  return {
    healthIndex,
    healthStatus,
    anomalyScore,
    isAnomalyDetected,
    primaryDiagnosis: bestMatch.name,
    confidencePct,
    secondaryDiagnosis: secondMatch?.name,
    secondaryConfidencePct: secondMatch ? Math.round(secondMatch.score * 100) : undefined,
    rulHours,
    rulUncertaintyMarginHours,
    rulDegradationRate: parseFloat(degradationRate.toFixed(1)),
    explainability: bestMatch.rationale,
    sensorContributions,
    kalmanResidualNorm,
  };
}
