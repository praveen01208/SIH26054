# AeroTwin-X — SIH 26054 (Team Synus)
### AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines in MALE UAVs

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Problem Statement ID](https://img.shields.io/badge/Problem%20Statement-26054-orange.svg)](https://sih.gov.in)
[![Theme](https://img.shields.io/badge/Theme-Robotics%20%26%20Drones-emerald.svg)](https://sih.gov.in)
[![Standard](https://img.shields.io/badge/Standard-ISO%2013374%20%2F%20SAE%20ARP4386-purple.svg)](https://iso.org)
[![Stack](https://img.shields.io/badge/Tech%20Stack-React%2018%20%2B%20TypeScript%20%2B%20Three.js%20%2B%20Zustand%20%2B%20Tailwind-cyan.svg)](https://vitejs.dev)

---

## 📌 Executive Summary

**AeroTwin-X** is an Edge-Driven, Physics-Informed Digital Twin (PINN) prototype engineered for Medium-Altitude Long-Endurance (MALE) UAV turbocharged aero-piston engines (Rotax 914 / 915 iS class).

Built for **Smart India Hackathon 2026 (Problem Statement ID: 26054)** by **Team Synus**, AeroTwin-X transitions UAV propulsion maintenance from reactive thresholding to proactive **Condition-Based Maintenance (CBM)** by combining:
1. A **client-side continuous causal physics simulation** ($500\text{ms}$ tick loop) modeling thermodynamics, airflow, combustion, shaft dynamics, and lubrication.
2. A **procedural 3D WebGL / Three.js Engine CAD Twin** featuring PBR metallic textures, live RPM-synced reciprocating pistons and propeller, real-time throttle butterfly valve actuation, dynamic thermal gradient shaders, and combustion ignition point-light flashes.
3. A **deterministic simulated AI/PHM diagnostic layer** delivering dynamic Health Scoring (0–100), continuous Anomaly Scoring, Fault Classification with Confidence %, Prognostic Remaining Useful Life (RUL) with $\pm 15\%$ conformal uncertainty envelopes, and per-sensor **SHAP Feature Attribution**.
4. **8 Physics-Based Multi-Sensor Fault Injections** and **5 Atmospheric / Flight Context Regimes**.

---

## 🏛️ System Architecture

```
                        ┌──────────────────────────────────────────────┐
                        │   Environmental Mode & Fault Injection       │
                        │   (Normal, Alt, Hot, Endurance, Throttle)    │
                        │   (8 Physics Faults: Misfire, Lube, etc.)    │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │          Causal Physics Engine (TS)          │
                        │  Atmosphere → Airflow → Fuel/Combustion →    │
                        │    Torque/RPM → Thermal/Oil → Vibration      │
                        │   (500ms continuous client-side tick loop)   │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │        Simulated AI & Diagnostics Layer      │
                        │  - Health Index (0-100)                      │
                        │  - Anomaly Score (smooth continuous curve)   │
                        │  - Dynamic Fault Classification + Conf %     │
                        │  - RUL Countdown with ±15% uncertainty band  │
                        │  - Explainability & SHAP Contribution Tags   │
                        │  - Physics Residuals (r = meas - pred)       │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             Zustand State Store              │
                        │   (Telemetry history, alerts, config, sim)   │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                           Mission Control Dashboard UI (Tailwind)                      │
  │ ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────────────────┐ │
  │ │ Connection & Header  │  │ Live Telemetry HUD   │  │ Simulated AI Diagnostics       │ │
  │ │ (AeroTwin-X Synus)   │  │ (Gauges + Fast Rechart)│ │ (Health, RUL, Explainability)  │ │
  │ ├──────────────────────┤  ├──────────────────────┤  ├────────────────────────────────┤ │
  │ │ Environment & Faults │  │ 3D WebGL Engine Twin │  │ Baseline vs Live Comparison    │ │
  │ │ (8 Real Physics Togg)│  │ (PBR CAD + Thermals) │  │ (Overlay & Deviation Radar)    │ │
  │ └──────────────────────┘  └──────────────────────┘  └────────────────────────────────┘ │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Features & Capabilities

### 1. 3D WebGL / Three.js Aero-Piston Engine CAD Twin
- **Procedural Aerospace CAD Geometry**: Dual-half split magnesium/aluminum crankcase with perimeter stud bolts, 4 horizontally-opposed boxer cylinders with 12 CNC cooling fins per cylinder, dual-plug cylinder heads, and steel spaceframe engine mount truss with rubber vibration isolator pucks.
- **Direct Live Variable Feedback**:
  - **Throttle Lever (0–100%)**: Internal gold butterfly valve plate physically rotates inside the intake plenum from $90^\circ$ (closed) to $0^\circ$ (wide open); cyan intake air mass flow particles accelerate; turbo compressor spool accelerates.
  - **Engine RPM & Ignition**: Reciprocating pistons and H-beam connecting rods stroke in real time; spark ignition point lights flash at Top Dead Center (TDC) inside each cylinder; 3-blade carbon fiber propeller spins with realistic motion blur.
  - **Per-Cylinder CHT Gradient**: Cylinder heads dynamically shift between **Cool Emerald** ($<100^\circ\text{C}$), **Amber** ($105\text{--}120^\circ\text{C}$), and **Red-Hot** ($>125^\circ\text{C}$).
  - **EGT & Heat Shimmer**: Exhaust headers glow cherry-red to white-hot ($>830^\circ\text{C}$) with volumetric heat haze particles rising from the turbine exhaust.
  - **Mechanical Vibration Shudder**: Entire engine block physically vibrates and shudders on its mounts when vibration RMS surges ($>4.5\text{ mm/s}$).
- **4 Interactive View Modes**:
  - `Aircraft Metallic`: High-contrast PBR brushed aluminum and titanium textures with studio specular reflections.
  - `Thermal IR Gradient`: Thermal heatmap shader showing individual cylinder temperatures and exhaust incandescence.
  - `Exploded Cutaway`: Expands components outward to reveal reciprocating pistons and crankshaft.
  - `Air/Exhaust Stream`: Visualizes intake air velocity and exhaust plume dynamics.

### 2. 8 Physics-Based Multi-Sensor Fault Injections
Injected by changing underlying physical parameters (not overriding display values):
1. **Cylinder Misfire**: Cylinder #3 combustion torque drops by 85%; spark flashes halt; Cylinder #3 head turns dark cold blue; vibration RMS spikes 3.5x.
2. **Injector Abnormality**: Lean fuel delivery shift causes exhaust gas temp (EGT) surge and torque loss.
3. **Cooling Degradation**: Reduced convective heat transfer coefficient $h_{cool}$ triggers slow, monotonic CHT & oil temp buildup.
4. **Lubrication Loss**: Oil pressure collapses ($<1.8\text{ bar}$); friction torque surges; oil particles slow to a crawl and turn red.
5. **Combustion Instability**: Cycle-to-cycle flame variance induces rapid EGT jitter and high vibration crest factors ($>4.2$).
6. **Overheating Trend**: Thermal generation outpaces dissipation, causing synchronized CHT, EGT, and oil temp runaway.
7. **Abnormal Vibration**: Mechanical bearing race fatigue surges vibration RMS ($>7.5\text{ mm/s}$) while thermal metrics remain nominal.
8. **Sensor Drift / Failure**: Single thermocouple channel displays false bias while correlated thermodynamic channels confirm normal engine operation.

### 3. 5 Atmospheric & Flight Regimes
- **Normal Cruise** (3,000 ft MSL / 18°C)
- **High Altitude** (18,500 ft / -20°C, reduced manifold pressure & air cooling density)
- **Hot Weather Desert** (45°C extreme ambient thermal soak)
- **Endurance Loiter** (60% low-power station keeping)
- **Rapid Throttle Transients** (Dynamic sinusoidal power modulation)

### 4. Deterministic Simulated AI & Prognostics (PHM)
- **Health Score (0–100%)** with circular animated HUD gauge.
- **Anomaly Score (0.00–1.00)** continuous non-linear strain metric.
- **Prognostic RUL Countdown** with dynamic $\pm 15\%$ conformal uncertainty band `[min — max]`.
- **Explainability (XAI)** with per-sensor **SHAP Feature Attribution** badges (`HIGH`, `MEDIUM`, `LOW`).
- **Physics Residual Stream ($r = \text{measured} - \text{predicted}$)** as the bridge to AI diagnostics.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Run
```bash
# 1. Clone the repository
git clone https://github.com/praveen01208/SIH26054.git
cd SIH26054

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:5173/
```

### Production Build
```bash
npm run build
npm run preview
```

### Run Automated Physics & Diagnostics Tests
```bash
npx tsx test_simulation.mjs
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Framework** | React 18, TypeScript, Vite |
| **3D CAD & Visualization** | Three.js (WebGL 60FPS), Procedural PBR Shaders |
| **State Management** | Zustand |
| **Time-Series Charting** | Recharts (Synchronized 60s Sliding Buffer) |
| **Styling & HUD Design** | Tailwind CSS, Lucide React Icons |
| **Standards Compliance** | ISO 13374 Condition Monitoring, SAE ARP4386 UAV Propulsion Monitoring |

---

## 👥 Team Synus — SIH 2026
- **Problem Statement ID**: 26054
- **Project**: AeroTwin-X Digital Twin
- **License**: MIT
