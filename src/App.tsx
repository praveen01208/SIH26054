import React, { useEffect, useState } from 'react';
import { useTwinStore } from './store/useTwinStore';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryGauges } from './components/TelemetryGauges';
import { Engine3DVisualizer } from './components/Engine3DVisualizer';
import { EngineVisualizer } from './components/EngineVisualizer';
import { LiveCharts } from './components/LiveCharts';
import { AIDiagnosticsCard } from './components/AIDiagnosticsCard';
import { RULPredictor } from './components/RULPredictor';
import { AlertTimeline } from './components/AlertTimeline';
import { BaselineComparisonModal } from './components/BaselineComparisonModal';
import { Box, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const { isSimRunning, tickRateMs, stepSimulationTick } = useTwinStore();
  const [twinView, setTwinView] = useState<'3D' | '2D_SCHEMATIC'>('3D');

  // Continuous Physics & Telemetry Tick Loop (500ms client-side ticker)
  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      stepSimulationTick();
    }, tickRateMs);

    return () => clearInterval(interval);
  }, [isSimRunning, tickRateMs, stepSimulationTick]);

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans hud-grid selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Header */}
      <Header />

      {/* Main Mission Control Grid */}
      <main className="flex-1 p-2 sm:p-3 lg:p-4 max-w-[1920px] mx-auto w-full flex flex-col gap-3 sm:gap-4">
        {/* Section 1: Atmospheric Mode & Fault Injector Matrix */}
        <ControlPanel />

        {/* Section 2: Core 8 Telemetry Gauges */}
        <TelemetryGauges />

        {/* Section 3: AI Diagnostics & Prognostics (Two-Column Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-7">
            <AIDiagnosticsCard />
          </div>
          <div className="lg:col-span-5">
            <RULPredictor />
          </div>
        </div>

        {/* Section 4: 3D Engine Digital Twin & Real-Time Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-6 flex flex-col gap-2.5 sm:gap-3">
            {/* View Switcher Bar */}
            <div className="flex items-center justify-between bg-aerospace-900/80 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Box className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                <span className="font-tech text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
                  Engine Twin View
                </span>
              </div>
              <div className="flex items-center gap-1 bg-aerospace-950 p-0.5 rounded border border-slate-800 text-[10px] sm:text-xs font-mono">
                <button
                  onClick={() => setTwinView('3D')}
                  className={`px-2.5 sm:px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    twinView === '3D'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>3D CAD Twin</span>
                </button>
                <button
                  onClick={() => setTwinView('2D_SCHEMATIC')}
                  className={`px-2.5 sm:px-3 py-1 rounded transition-all flex items-center gap-1.5 ${
                    twinView === '2D_SCHEMATIC'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>2D Bank</span>
                </button>
              </div>
            </div>

            {twinView === '3D' ? <Engine3DVisualizer /> : <EngineVisualizer />}
          </div>

          <div className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
            <LiveCharts />
            <AlertTimeline />
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="bg-aerospace-950 border-t border-slate-900 py-2 sm:py-2.5 px-3 sm:px-4 text-center text-[10px] sm:text-xs font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2">
        <span>AEROTWIN-X • SIH 26054 • TEAM SYNUS</span>
        <span className="hidden md:inline">EDGE-DRIVEN PHYSICS-INFORMED DIGITAL TWIN FOR MALE UAV AERO-PISTON ENGINES</span>
        <span>ISO 13374 / SAE ARP4386 • JETSON ORIN + GCS</span>
      </footer>

      {/* Baseline Overlay Modal */}
      <BaselineComparisonModal />
    </div>
  );
};

export default App;
