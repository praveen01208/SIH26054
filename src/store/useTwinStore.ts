import { create } from 'zustand';
import {
  EnvironmentalMode,
  FaultId,
  FaultConfig,
  ConnectionStatus,
  TelemetrySample,
  AIDiagnostics,
  AlertEvent,
  BaselineProfile,
} from '../types/telemetry';
import {
  INITIAL_FAULTS,
  INITIAL_TELEMETRY,
  NOMINAL_BASELINE,
  ENV_MODE_PRESETS,
} from '../simulation/defaultState';
import {
  createInitialPhysicsState,
  stepPhysics,
  InternalPhysicsState,
} from '../simulation/physicsEngine';
import { computeAIDiagnostics } from '../simulation/aiDiagnostics';

const MAX_HISTORY_LENGTH = 60; // 60 samples (30 seconds @ 500ms / tick)

interface TwinStoreState {
  // Connection & Run State
  connectionStatus: ConnectionStatus;
  isSimRunning: boolean;
  tickRateMs: number;
  simSecondsElapsed: number;

  // Environment & Controls
  envMode: EnvironmentalMode;
  throttle: number; // 0..100%
  faults: FaultConfig[];

  // Telemetry & Physics Internal State
  currentTelemetry: TelemetrySample;
  telemetryHistory: TelemetrySample[];
  baselineProfile: BaselineProfile;
  storedBaselineHistory: TelemetrySample[];
  physicsInternalState: InternalPhysicsState;

  // AI & Diagnostics
  aiDiagnostics: AIDiagnostics;
  alertEvents: AlertEvent[];
  unreadAlertCount: number;

  // UI / Modal Controls
  showBaselineModal: boolean;

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setEnvMode: (mode: EnvironmentalMode) => void;
  setThrottle: (throttle: number) => void;
  toggleFault: (faultId: FaultId) => void;
  setFaultSeverity: (faultId: FaultId, severity: number) => void;
  clearAllFaults: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  toggleSimulation: () => void;
  resetSimulation: () => void;
  stepSimulationTick: () => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setShowBaselineModal: (show: boolean) => void;
  captureCurrentAsBaseline: () => void;
}

export const useTwinStore = create<TwinStoreState>((set, get) => {
  const initialPhysics = createInitialPhysicsState();
  const initialAIDiagnostics = computeAIDiagnostics(INITIAL_TELEMETRY, NOMINAL_BASELINE);

  return {
    connectionStatus: 'CONNECTED',
    isSimRunning: true,
    tickRateMs: 500,
    simSecondsElapsed: 0,

    envMode: 'NORMAL',
    throttle: 75,
    faults: INITIAL_FAULTS,

    currentTelemetry: INITIAL_TELEMETRY,
    telemetryHistory: [INITIAL_TELEMETRY],
    baselineProfile: NOMINAL_BASELINE,
    storedBaselineHistory: [INITIAL_TELEMETRY],
    physicsInternalState: initialPhysics,

    aiDiagnostics: initialAIDiagnostics,
    alertEvents: [
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString(),
        simTime: 0,
        level: 'INFO',
        title: 'Digital Twin Online',
        message: 'Telemetry synchronization established with UAV Engine ECU. Baseline parameters validated.',
        sensor: 'SYSTEM',
        value: 'NOMINAL',
        envMode: 'NORMAL',
        acknowledged: true,
      },
    ],
    unreadAlertCount: 0,
    showBaselineModal: false,

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    setEnvMode: (mode) => {
      const preset = ENV_MODE_PRESETS[mode];
      const { alertEvents, simSecondsElapsed } = get();
      
      const newAlert: AlertEvent = {
        id: `env-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        simTime: simSecondsElapsed,
        level: 'INFO',
        title: `Environment: ${preset.name}`,
        message: preset.description,
        sensor: 'ATMOSPHERE',
        value: `${preset.ambientTemp}°C / ${preset.densityAltitudeFt}ft`,
        envMode: mode,
        acknowledged: false,
      };

      set({
        envMode: mode,
        throttle: preset.throttleDefault,
        alertEvents: [newAlert, ...alertEvents].slice(0, 50),
        unreadAlertCount: get().unreadAlertCount + 1,
      });
    },

    setThrottle: (throttle) => set({ throttle: Math.max(0, Math.min(100, throttle)) }),

    toggleFault: (faultId) => {
      const state = get();
      const newFaults = state.faults.map((f) =>
        f.id === faultId ? { ...f, enabled: !f.enabled } : f
      );
      const targetFault = newFaults.find((f) => f.id === faultId);

      let newAlerts = [...state.alertEvents];
      if (targetFault && targetFault.enabled) {
        newAlerts.unshift({
          id: `fault-inj-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          simTime: state.simSecondsElapsed,
          level: 'WARNING',
          title: `Fault Injected: ${targetFault.name}`,
          message: `${targetFault.description} (Severity: ${Math.round(targetFault.severity * 100)}%)`,
          sensor: targetFault.category.toUpperCase(),
          value: 'INJECTED',
          envMode: state.envMode,
          acknowledged: false,
        });
      }

      set({
        faults: newFaults,
        alertEvents: newAlerts.slice(0, 50),
        unreadAlertCount: targetFault?.enabled ? state.unreadAlertCount + 1 : state.unreadAlertCount,
      });
    },

    setFaultSeverity: (faultId, severity) => {
      const { faults } = get();
      set({
        faults: faults.map((f) =>
          f.id === faultId ? { ...f, severity: Math.max(0.1, Math.min(1.0, severity)) } : f
        ),
      });
    },

    clearAllFaults: () => {
      const { faults, alertEvents, simSecondsElapsed, envMode, unreadAlertCount } = get();
      const hadActiveFaults = faults.some((f) => f.enabled);
      
      const newFaults = faults.map((f) => ({ ...f, enabled: false }));
      let newAlerts = [...alertEvents];

      if (hadActiveFaults) {
        newAlerts.unshift({
          id: `fault-clear-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          simTime: simSecondsElapsed,
          level: 'INFO',
          title: 'All Faults Cleared',
          message: 'Active physics disturbance parameters reset to normal certified baseline.',
          sensor: 'CONTROLLER',
          value: 'RESTORED',
          envMode,
          acknowledged: false,
        });
      }

      set({
        faults: newFaults,
        alertEvents: newAlerts.slice(0, 50),
        unreadAlertCount: hadActiveFaults ? unreadAlertCount + 1 : unreadAlertCount,
      });
    },

    startSimulation: () => set({ isSimRunning: true }),
    pauseSimulation: () => set({ isSimRunning: false }),
    toggleSimulation: () => set((s) => ({ isSimRunning: !s.isSimRunning })),

    resetSimulation: () => {
      const freshPhysics = createInitialPhysicsState();
      const freshTelemetry = { ...INITIAL_TELEMETRY, timestamp: Date.now() };
      const freshAIDiagnostics = computeAIDiagnostics(freshTelemetry, NOMINAL_BASELINE);

      set({
        physicsInternalState: freshPhysics,
        currentTelemetry: freshTelemetry,
        telemetryHistory: [freshTelemetry],
        aiDiagnostics: freshAIDiagnostics,
        simSecondsElapsed: 0,
        faults: INITIAL_FAULTS,
        envMode: 'NORMAL',
        throttle: 75,
        connectionStatus: 'CONNECTED',
        alertEvents: [
          {
            id: `reset-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            simTime: 0,
            level: 'INFO',
            title: 'Simulation Session Reset',
            message: 'Engine state re-initialized to standard factory baseline.',
            sensor: 'SYSTEM',
            value: 'READY',
            envMode: 'NORMAL',
            acknowledged: true,
          },
        ],
        unreadAlertCount: 0,
      });
    },

    stepSimulationTick: () => {
      const state = get();
      if (state.connectionStatus === 'DISCONNECTED') {
        // No telemetry arrives if disconnected
        return;
      }

      const dt = 0.5;
      const { state: nextPhysics, telemetry: nextTelemetry } = stepPhysics(
        state.physicsInternalState,
        state.envMode,
        state.faults,
        state.throttle,
        dt
      );

      // Compute AI diagnostics and explainability
      const nextDiagnostics = computeAIDiagnostics(nextTelemetry, state.baselineProfile);

      // Generate dynamic threshold alerts if safety limits exceeded
      const newAlerts = [...state.alertEvents];
      let newAlertFired = false;

      // Threshold checks
      if (nextTelemetry.oilPressure < 1.8 && !newAlerts.some((a) => a.sensor === 'OIL_PRESS' && !a.acknowledged)) {
        newAlerts.unshift({
          id: `crit-oil-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          simTime: nextTelemetry.simTimeSeconds,
          level: 'CRITICAL',
          title: 'Critical Low Oil Pressure Alarm',
          message: `Oil pressure collapsed to ${nextTelemetry.oilPressure.toFixed(2)} bar (< 1.8 bar safety threshold). Bearing starvation imminent.`,
          sensor: 'OIL_PRESS',
          value: `${nextTelemetry.oilPressure.toFixed(2)} bar`,
          envMode: state.envMode,
          acknowledged: false,
        });
        newAlertFired = true;
      }

      if (nextTelemetry.cht > 130 && !newAlerts.some((a) => a.sensor === 'CHT_HIGH' && !a.acknowledged)) {
        newAlerts.unshift({
          id: `crit-cht-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          simTime: nextTelemetry.simTimeSeconds,
          level: 'CRITICAL',
          title: 'Cylinder Head Overtemperature',
          message: `CHT reached ${nextTelemetry.cht.toFixed(1)}°C exceeding 130°C redline. Thermal expansion risk.`,
          sensor: 'CHT_HIGH',
          value: `${nextTelemetry.cht.toFixed(1)}°C`,
          envMode: state.envMode,
          acknowledged: false,
        });
        newAlertFired = true;
      }

      if (nextTelemetry.vibrationRms > 6.5 && !newAlerts.some((a) => a.sensor === 'VIBRATION' && !a.acknowledged)) {
        newAlerts.unshift({
          id: `crit-vib-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          simTime: nextTelemetry.simTimeSeconds,
          level: 'WARNING',
          title: 'Excessive Vibration Level',
          message: `Vibration RMS surged to ${nextTelemetry.vibrationRms.toFixed(2)} mm/s. Check prop and bearing integrity.`,
          sensor: 'VIBRATION',
          value: `${nextTelemetry.vibrationRms.toFixed(2)} mm/s`,
          envMode: state.envMode,
          acknowledged: false,
        });
        newAlertFired = true;
      }

      // Update history buffer
      const newHistory = [...state.telemetryHistory, nextTelemetry].slice(-MAX_HISTORY_LENGTH);

      set({
        physicsInternalState: nextPhysics,
        currentTelemetry: nextTelemetry,
        telemetryHistory: newHistory,
        aiDiagnostics: nextDiagnostics,
        simSecondsElapsed: nextTelemetry.simTimeSeconds,
        alertEvents: newAlerts.slice(0, 50),
        unreadAlertCount: newAlertFired ? state.unreadAlertCount + 1 : state.unreadAlertCount,
      });
    },

    acknowledgeAlert: (alertId) => {
      const { alertEvents } = get();
      set({
        alertEvents: alertEvents.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
        unreadAlertCount: Math.max(0, get().unreadAlertCount - 1),
      });
    },

    clearAlerts: () => set({ alertEvents: [], unreadAlertCount: 0 }),

    setShowBaselineModal: (show) => set({ showBaselineModal: show }),

    captureCurrentAsBaseline: () => {
      const { currentTelemetry, telemetryHistory } = get();
      set({
        baselineProfile: {
          rpm: currentTelemetry.rpm,
          cht: currentTelemetry.cht,
          egt: currentTelemetry.egt,
          oilPressure: currentTelemetry.oilPressure,
          oilTemp: currentTelemetry.oilTemp,
          fuelFlow: currentTelemetry.fuelFlow,
          vibrationRms: currentTelemetry.vibrationRms,
          batteryVoltage: currentTelemetry.batteryVoltage,
        },
        storedBaselineHistory: [...telemetryHistory],
      });
    },
  };
});
