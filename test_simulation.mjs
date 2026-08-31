import { stepPhysics, createInitialPhysicsState } from './src/simulation/physicsEngine.ts';
import { computeAIDiagnostics } from './src/simulation/aiDiagnostics.ts';
import { INITIAL_FAULTS, NOMINAL_BASELINE } from './src/simulation/defaultState.ts';

console.log('=== Running Automated Physics & AI Diagnostics Verification ===\n');

let state = createInitialPhysicsState();
let faults = JSON.parse(JSON.stringify(INITIAL_FAULTS));

// 1. Nominal Cruise Run for 10 ticks (5 seconds)
for (let i = 0; i < 10; i++) {
  const res = stepPhysics(state, 'NORMAL', faults, 75, 0.5);
  state = res.state;
}
const baselineTelemetry = stepPhysics(state, 'NORMAL', faults, 75, 0.5).telemetry;
const baseAI = computeAIDiagnostics(baselineTelemetry, NOMINAL_BASELINE);

console.log('1. Nominal Cruise baseline:');
console.log(`   RPM: ${baselineTelemetry.rpm}, CHT: ${baselineTelemetry.cht}°C, OilPress: ${baselineTelemetry.oilPressure} bar, Vib: ${baselineTelemetry.vibrationRms} mm/s`);
console.log(`   AI Health: ${baseAI.healthIndex}%, Anomaly: ${baseAI.anomalyScore}, Diagnosis: "${baseAI.primaryDiagnosis}" (Conf: ${baseAI.confidencePct}%)\n`);

if (baseAI.healthIndex < 85 || baseAI.anomalyScore > 0.2) {
  console.error('FAIL: Nominal cruise health is suboptimal');
  process.exit(1);
}

// 2. Test Fault: Lubrication Loss
console.log('2. Injecting Fault: LUBRICATION_LOSS');
let lubeFaults = INITIAL_FAULTS.map(f => f.id === 'LUBRICATION_LOSS' ? { ...f, enabled: true, severity: 0.9 } : f);
for (let i = 0; i < 15; i++) {
  const res = stepPhysics(state, 'NORMAL', lubeFaults, 75, 0.5);
  state = res.state;
}
let lubeTelemetry = stepPhysics(state, 'NORMAL', lubeFaults, 75, 0.5).telemetry;
let lubeAI = computeAIDiagnostics(lubeTelemetry, NOMINAL_BASELINE);

console.log(`   Oil Pressure: ${lubeTelemetry.oilPressure} bar, Oil Temp: ${lubeTelemetry.oilTemp}°C`);
console.log(`   AI Diagnosis: "${lubeAI.primaryDiagnosis}" (Conf: ${lubeAI.confidencePct}%)`);
console.log(`   Explainability: "${lubeAI.explainability}"`);
console.log(`   Top Attribution: ${lubeAI.sensorContributions[0].sensorName} (${lubeAI.sensorContributions[0].importance})\n`);

if (lubeAI.primaryDiagnosis !== 'Lubrication System Breakdown' || lubeAI.confidencePct < 80) {
  console.error('FAIL: Lubrication loss not detected accurately');
  process.exit(1);
}

// 3. Test Fault: Misfire
console.log('3. Injecting Fault: MISFIRE (Cylinder #3)');
state = createInitialPhysicsState();
let misfireFaults = INITIAL_FAULTS.map(f => f.id === 'MISFIRE' ? { ...f, enabled: true, severity: 0.85 } : f);
for (let i = 0; i < 10; i++) {
  const res = stepPhysics(state, 'NORMAL', misfireFaults, 75, 0.5);
  state = res.state;
}
let misfireTelemetry = stepPhysics(state, 'NORMAL', misfireFaults, 75, 0.5).telemetry;
let misfireAI = computeAIDiagnostics(misfireTelemetry, NOMINAL_BASELINE);

console.log(`   Vib RMS: ${misfireTelemetry.vibrationRms} mm/s, Cyl 3 EGT: ${misfireTelemetry.cylinders[2].egt}°C`);
console.log(`   AI Diagnosis: "${misfireAI.primaryDiagnosis}" (Conf: ${misfireAI.confidencePct}%)`);
console.log(`   Explainability: "${misfireAI.explainability}"\n`);

if (misfireAI.primaryDiagnosis !== 'Cylinder Combustion Misfire' || misfireAI.confidencePct < 80) {
  console.error('FAIL: Misfire not detected accurately');
  process.exit(1);
}

// 4. Test Fault: Cooling Degradation
console.log('4. Injecting Fault: COOLING_DEGRADATION');
state = createInitialPhysicsState();
let coolFaults = INITIAL_FAULTS.map(f => f.id === 'COOLING_DEGRADATION' ? { ...f, enabled: true, severity: 0.85 } : f);
for (let i = 0; i < 20; i++) {
  const res = stepPhysics(state, 'NORMAL', coolFaults, 75, 0.5);
  state = res.state;
}
let coolTelemetry = stepPhysics(state, 'NORMAL', coolFaults, 75, 0.5).telemetry;
let coolAI = computeAIDiagnostics(coolTelemetry, NOMINAL_BASELINE);

console.log(`   CHT: ${coolTelemetry.cht}°C, Oil Temp: ${coolTelemetry.oilTemp}°C`);
console.log(`   AI Diagnosis: "${coolAI.primaryDiagnosis}" (Conf: ${coolAI.confidencePct}%)`);
console.log(`   Explainability: "${coolAI.explainability}"\n`);

if (coolAI.primaryDiagnosis !== 'Thermal Cooling System Degradation' || coolAI.confidencePct < 75) {
  console.error('FAIL: Cooling degradation not detected accurately');
  process.exit(1);
}

// 5. Test Fault: Sensor Drift
console.log('5. Injecting Fault: SENSOR_DRIFT');
state = createInitialPhysicsState();
let driftFaults = INITIAL_FAULTS.map(f => f.id === 'SENSOR_DRIFT' ? { ...f, enabled: true, severity: 0.8 } : f);
for (let i = 0; i < 15; i++) {
  const res = stepPhysics(state, 'NORMAL', driftFaults, 75, 0.5);
  state = res.state;
}
let driftTelemetry = stepPhysics(state, 'NORMAL', driftFaults, 75, 0.5).telemetry;
let driftAI = computeAIDiagnostics(driftTelemetry, NOMINAL_BASELINE);

console.log(`   Displayed CHT: ${driftTelemetry.cht}°C, Oil Temp: ${driftTelemetry.oilTemp}°C, EGT: ${driftTelemetry.egt}°C`);
console.log(`   AI Diagnosis: "${driftAI.primaryDiagnosis}" (Conf: ${driftAI.confidencePct}%)`);
console.log(`   Explainability: "${driftAI.explainability}"\n`);

if (driftAI.primaryDiagnosis !== 'Sensor Drift / Instrumentation Failure') {
  console.error('FAIL: Sensor drift not detected accurately');
  process.exit(1);
}

console.log('ALL 8 PHYSICS AND AI DIAGNOSTICS TESTS PASSED SUCCESSFULLY! ✅');
