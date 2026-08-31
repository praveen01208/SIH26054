import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTwinStore } from '../store/useTwinStore';
import {
  Rotate3d,
  Flame,
  Droplets,
  Eye,
  Maximize,
  Camera,
  Play,
  Pause,
  Zap,
  Activity,
  Wind,
  Thermometer,
  Info,
} from 'lucide-react';

// --- PROCEDURAL TEXTURE GENERATORS FOR ULTRA-REALISM ---
function createBrushedMetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-scratches & directional grain
  for (let i = 0; i < 4000; i++) {
    const y = Math.random() * 512;
    const len = 30 + Math.random() * 80;
    const x = Math.random() * 512;
    const alpha = 0.04 + Math.random() * 0.08;
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 128, 128);

  const size = 16;
  for (let y = 0; y < 128; y += size) {
    for (let x = 0; x < 128; x += size) {
      const isEven = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isEven ? '#1e293b' : '#090d16';
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = isEven ? '#334155' : '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x + size, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

function createExhaustHeatTintTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#38bdf8');
  gradient.addColorStop(0.2, '#818cf8');
  gradient.addColorStop(0.4, '#f59e0b');
  gradient.addColorStop(0.7, '#475569');
  gradient.addColorStop(1.0, '#334155');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export const Engine3DVisualizer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTelemetry, faults, throttle } = useTwinStore();

  const [viewMode, setViewMode] = useState<'THERMAL' | 'REALISTIC' | 'XRAY_EXPLODED' | 'AERO_FLOW'>('REALISTIC');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showCombustion, setShowCombustion] = useState<boolean>(true);
  const [showOilFlow, setShowOilFlow] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'ISO' | 'CYLINDERS' | 'TURBO' | 'TOP'>('ISO');
  const [inspectedPart, setInspectedPart] = useState<string | null>('Rotax 914 Turbocharged Aero-Engine Core');

  // Animation & Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Interactive Mesh References
  const engineGroupRef = useRef<THREE.Group | null>(null);
  const pistonsRef = useRef<THREE.Mesh[]>([]);
  const conRodsRef = useRef<THREE.Mesh[]>([]);
  const cylinderHeadsRef = useRef<THREE.Mesh[]>([]);
  const cylinderSleevesRef = useRef<THREE.Mesh[]>([]);
  const exhaustRunnersRef = useRef<THREE.Mesh[]>([]);
  const intakeRunnersRef = useRef<THREE.Mesh[]>([]);
  const sparkPlugsRef = useRef<THREE.Mesh[]>([]);
  const combustionFlashesRef = useRef<THREE.PointLight[]>([]);
  const throttleValveRef = useRef<THREE.Mesh | null>(null);
  const propAssemblyRef = useRef<THREE.Group | null>(null);
  const turboRotorRef = useRef<THREE.Mesh | null>(null);
  const turboHousingRef = useRef<THREE.Mesh | null>(null);
  const heatShimmerParticlesRef = useRef<THREE.Points | null>(null);
  const oilStreamRef = useRef<THREE.Points | null>(null);
  const airIntakeParticlesRef = useRef<THREE.Points | null>(null);
  const engineMountGroupRef = useRef<THREE.Group | null>(null);

  // References for live telemetry
  const telemetryRef = useRef(currentTelemetry);
  const faultsRef = useRef(faults);
  const throttleRef = useRef(throttle);
  const viewModeRef = useRef(viewMode);
  const autoRotateRef = useRef(autoRotate);
  const showCombustionRef = useRef(showCombustion);
  const showOilFlowRef = useRef(showOilFlow);

  useEffect(() => {
    telemetryRef.current = currentTelemetry;
    faultsRef.current = faults;
    throttleRef.current = throttle;
    viewModeRef.current = viewMode;
    autoRotateRef.current = autoRotate;
    showCombustionRef.current = showCombustion;
    showOilFlowRef.current = showOilFlow;
  }, [currentTelemetry, faults, throttle, viewMode, autoRotate, showCombustion, showOilFlow]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;

    // --- 1. SCENE & ENVIRONMENT ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.025);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(6.8, 4.8, 7.8);
    camera.lookAt(0, 0.2, 0);
    cameraRef.current = camera;

    // --- 2. AAA RENDERER SETUP ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Procedural PBR Textures
    const brushedMetalTex = createBrushedMetalTexture();
    const carbonFiberTex = createCarbonFiberTexture();
    const exhaustHeatTintTex = createExhaustHeatTintTexture();

    // --- 3. AEROSPACE HANGAR LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    keyLight.position.set(8, 14, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf97316, 2.4);
    rimLight.position.set(-10, 4, -8);
    scene.add(rimLight);

    const groundLight = new THREE.DirectionalLight(0x0284c7, 1.2);
    groundLight.position.set(0, -8, 0);
    scene.add(groundLight);

    const engineGroup = new THREE.Group();
    engineGroupRef.current = engineGroup;
    scene.add(engineGroup);

    const gridHelper = new THREE.GridHelper(18, 36, 0x00f0ff, 0x0f172a);
    gridHelper.position.y = -2.1;
    scene.add(gridHelper);

    // --- 4. ENGINE MOUNT TUBULAR SPACEFRAME TRUSS ---
    const mountGroup = new THREE.Group();
    engineMountGroupRef.current = mountGroup;
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.25,
      map: brushedMetalTex,
    });

    const trussPoints = [
      [-1.3, 0.6, -1.8], [1.3, 0.6, -1.8],
      [-1.3, -0.8, -1.8], [1.3, -0.8, -1.8],
    ];

    trussPoints.forEach((pt) => {
      const armCurve = new THREE.LineCurve3(
        new THREE.Vector3(pt[0], pt[1], pt[2]),
        new THREE.Vector3(pt[0] * 1.5, pt[1] * 1.4, -3.2)
      );
      const armGeo = new THREE.TubeGeometry(armCurve, 8, 0.08, 12, false);
      const arm = new THREE.Mesh(armGeo, trussMat);
      mountGroup.add(arm);

      const isolatorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16);
      const isolatorMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 });
      const isolator = new THREE.Mesh(isolatorGeo, isolatorMat);
      isolator.position.set(pt[0] * 1.5, pt[1] * 1.4, -3.2);
      isolator.rotation.x = Math.PI / 2;
      mountGroup.add(isolator);
    });
    engineGroup.add(mountGroup);

    // --- 5. DETAILED DUAL-HALF SPLIT CRANKCASE ---
    const crankcaseLeftGeo = new THREE.BoxGeometry(1.15, 1.6, 3.8);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.88,
      roughness: 0.28,
      map: brushedMetalTex,
    });
    const caseLeft = new THREE.Mesh(crankcaseLeftGeo, caseMat);
    caseLeft.position.x = -0.58;
    caseLeft.castShadow = true;
    caseLeft.receiveShadow = true;
    engineGroup.add(caseLeft);

    const crankcaseRightGeo = new THREE.BoxGeometry(1.15, 1.6, 3.8);
    const caseRight = new THREE.Mesh(crankcaseRightGeo, caseMat);
    caseRight.position.x = 0.58;
    caseRight.castShadow = true;
    caseRight.receiveShadow = true;
    engineGroup.add(caseRight);

    const splitFlangeGeo = new THREE.BoxGeometry(0.1, 1.7, 3.9);
    const splitFlangeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.15 });
    const splitFlange = new THREE.Mesh(splitFlangeGeo, splitFlangeMat);
    engineGroup.add(splitFlange);

    for (let z = -1.8; z <= 1.8; z += 0.45) {
      for (const y of [-0.75, 0.75]) {
        const boltGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 6);
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.98, roughness: 0.1 });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(0, y, z);
        bolt.rotation.x = Math.PI / 2;
        engineGroup.add(bolt);
      }
    }

    const sumpGeo = new THREE.BoxGeometry(1.9, 0.75, 3.2);
    const sumpMat = new THREE.MeshStandardMaterial({
      color: 0x0b1320,
      metalness: 0.92,
      roughness: 0.22,
    });
    const sump = new THREE.Mesh(sumpGeo, sumpMat);
    sump.position.y = -1.15;
    engineGroup.add(sump);

    for (let f = -1.4; f <= 1.4; f += 0.28) {
      const finGeo = new THREE.BoxGeometry(1.85, 0.15, 0.04);
      const finMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(0, -1.55, f);
      engineGroup.add(fin);
    }

    const filterGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.85, 24);
    const filterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.2,
      map: brushedMetalTex,
    });
    const filter = new THREE.Mesh(filterGeo, filterMat);
    filter.position.set(1.35, -0.65, 1.25);
    filter.rotation.z = Math.PI / 3.5;
    engineGroup.add(filter);

    // --- 6. FOUR BOXER CYLINDERS ---
    const cylinderHeads: THREE.Mesh[] = [];
    const cylinderSleeves: THREE.Mesh[] = [];
    const pistons: THREE.Mesh[] = [];
    const conRods: THREE.Mesh[] = [];
    const exhaustRunners: THREE.Mesh[] = [];
    const intakeRunners: THREE.Mesh[] = [];
    const sparkPlugs: THREE.Mesh[] = [];
    const combustionFlashes: THREE.PointLight[] = [];

    const cylPositions = [
      { id: 1, x: -1.65, y: 0.35, z: 0.95, dir: -1 },
      { id: 2, x: 1.65, y: 0.35, z: 0.95, dir: 1 },
      { id: 3, x: -1.65, y: 0.35, z: -0.95, dir: -1 },
      { id: 4, x: 1.65, y: 0.35, z: -0.95, dir: 1 },
    ];

    cylPositions.forEach((cyl) => {
      const cylGroup = new THREE.Group();
      cylGroup.position.set(cyl.x * 0.45, cyl.y, cyl.z);

      const sleeveGeo = new THREE.CylinderGeometry(0.62, 0.62, 1.55, 32);
      const sleeveMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.35,
      });
      const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
      sleeve.rotation.z = Math.PI / 2;
      sleeve.castShadow = true;
      cylGroup.add(sleeve);
      cylinderSleeves.push(sleeve);

      for (let fin = -0.7; fin <= 0.7; fin += 0.12) {
        const finGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.025, 32);
        const finMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.92,
          roughness: 0.18,
          map: brushedMetalTex,
        });
        const finMesh = new THREE.Mesh(finGeo, finMat);
        finMesh.position.y = fin;
        finMesh.rotation.z = Math.PI / 2;
        cylGroup.add(finMesh);
      }

      const headGeo = new THREE.BoxGeometry(1.15, 0.95, 1.15);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x002233,
        emissiveIntensity: 0.4,
        metalness: 0.75,
        roughness: 0.25,
        map: brushedMetalTex,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.x = cyl.dir * 1.05;
      head.castShadow = true;
      cylGroup.add(head);
      cylinderHeads.push(head);

      for (const plugOffset of [-0.25, 0.25]) {
        const plugGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.55, 16);
        const plugMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.5,
          metalness: 0.95,
        });
        const plug = new THREE.Mesh(plugGeo, plugMat);
        plug.position.set(cyl.dir * 1.6, 0.35, plugOffset);
        plug.rotation.z = Math.PI / 2;
        cylGroup.add(plug);
        sparkPlugs.push(plug);

        const wireCurve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(cyl.dir * 1.85, 0.35, plugOffset),
          new THREE.Vector3(cyl.dir * 1.2, 1.1, plugOffset * 1.5),
          new THREE.Vector3(0, 1.2, cyl.z)
        );
        const wireGeo = new THREE.TubeGeometry(wireCurve, 12, 0.04, 8, false);
        const wireMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        engineGroup.add(wire);
      }

      const injectorGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.45, 16);
      const injectorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });
      const injector = new THREE.Mesh(injectorGeo, injectorMat);
      injector.position.set(cyl.dir * 0.75, 0.8, -0.2);
      injector.rotation.x = Math.PI / 4;
      cylGroup.add(injector);

      const flashLight = new THREE.PointLight(0xff6600, 0, 4);
      flashLight.position.set(cyl.dir * 0.9, 0, 0);
      cylGroup.add(flashLight);
      combustionFlashes.push(flashLight);

      const pistonGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.6, 24);
      const pistonMat = new THREE.MeshStandardMaterial({
        color: 0xcfd8dc,
        metalness: 0.98,
        roughness: 0.1,
        map: brushedMetalTex,
      });
      const piston = new THREE.Mesh(pistonGeo, pistonMat);
      piston.rotation.z = Math.PI / 2;
      cylGroup.add(piston);
      pistons.push(piston);

      const rodGeo = new THREE.BoxGeometry(0.14, 0.95, 0.22);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0x78909c, metalness: 0.95, roughness: 0.15 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      rod.position.x = -cyl.dir * 0.45;
      rod.rotation.z = Math.PI / 2;
      cylGroup.add(rod);
      conRods.push(rod);

      const exStart = new THREE.Vector3(cyl.dir * 1.15, -0.25, 0.3);
      const exMid = new THREE.Vector3(cyl.dir * 1.7, -0.85, -0.7);
      const exEnd = new THREE.Vector3(cyl.dir * 0.4, -0.85, -2.25);
      const exCurve = new THREE.CatmullRomCurve3([exStart, exMid, exEnd]);
      const exGeo = new THREE.TubeGeometry(exCurve, 24, 0.15, 16, false);
      const exMat = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0x661100,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.2,
        map: exhaustHeatTintTex,
      });
      const exhaustTube = new THREE.Mesh(exGeo, exMat);
      engineGroup.add(exhaustTube);
      exhaustRunners.push(exhaustTube);

      const inStart = new THREE.Vector3(0, 1.35, -0.1);
      const inMid = new THREE.Vector3(cyl.dir * 0.9, 1.4, -0.15);
      const inEnd = new THREE.Vector3(cyl.dir * 1.15, 0.5, -0.25);
      const inCurve = new THREE.CatmullRomCurve3([inStart, inMid, inEnd]);
      const inGeo = new THREE.TubeGeometry(inCurve, 18, 0.14, 14, false);
      const inMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.8,
        roughness: 0.25,
      });
      const intakeTube = new THREE.Mesh(inGeo, inMat);
      engineGroup.add(intakeTube);
      intakeRunners.push(intakeTube);

      engineGroup.add(cylGroup);
    });

    cylinderHeadsRef.current = cylinderHeads;
    cylinderSleevesRef.current = cylinderSleeves;
    pistonsRef.current = pistons;
    conRodsRef.current = conRods;
    exhaustRunnersRef.current = exhaustRunners;
    intakeRunnersRef.current = intakeRunners;
    sparkPlugsRef.current = sparkPlugs;
    combustionFlashesRef.current = combustionFlashes;

    // --- 7. INTAKE AIR PLENUM & THROTTLE VALVE ---
    const plenumGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.4, 24);
    const plenumMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.18,
      map: brushedMetalTex,
    });
    const plenum = new THREE.Mesh(plenumGeo, plenumMat);
    plenum.position.set(0, 1.38, 0);
    plenum.rotation.x = Math.PI / 2;
    engineGroup.add(plenum);

    const throttleBodyGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.6, 24);
    const throttleBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95 });
    const throttleBody = new THREE.Mesh(throttleBodyGeo, throttleBodyMat);
    throttleBody.position.set(0, 1.38, 1.4);
    throttleBody.rotation.x = Math.PI / 2;
    engineGroup.add(throttleBody);

    const valvePlateGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 20);
    const valvePlateMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.98,
      roughness: 0.1,
    });
    const throttleValve = new THREE.Mesh(valvePlateGeo, valvePlateMat);
    throttleValve.position.set(0, 1.38, 1.4);
    engineGroup.add(throttleValve);
    throttleValveRef.current = throttleValve;

    // --- 8. TURBOCHARGER SYSTEM ---
    const turboGroup = new THREE.Group();
    turboGroup.position.set(0, 0.15, -2.6);

    const turbineScrollGeo = new THREE.TorusGeometry(0.72, 0.28, 20, 36);
    const turbineMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      emissive: 0x880011,
      emissiveIntensity: 0.75,
      metalness: 0.92,
      roughness: 0.3,
    });
    const turbineScroll = new THREE.Mesh(turbineScrollGeo, turbineMat);
    turboGroup.add(turbineScroll);
    turboHousingRef.current = turbineScroll;

    const compScrollGeo = new THREE.TorusGeometry(0.68, 0.25, 20, 36);
    const compMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.15,
      map: brushedMetalTex,
    });
    const compScroll = new THREE.Mesh(compScrollGeo, compMat);
    compScroll.position.x = 0.55;
    turboGroup.add(compScroll);

    const wastegateGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 20);
    const wastegateMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.1 });
    const wastegate = new THREE.Mesh(wastegateGeo, wastegateMat);
    wastegate.position.set(-0.7, 0.7, 0.1);
    wastegate.rotation.z = Math.PI / 4;
    turboGroup.add(wastegate);

    const rodGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.98 });
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.set(-0.4, 0.4, -0.1);
    rodMesh.rotation.z = Math.PI / 4;
    turboGroup.add(rodMesh);

    const rotorGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.45, 18);
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.05,
      wireframe: true,
    });
    const rotor = new THREE.Mesh(rotorGeo, rotorMat);
    rotor.rotation.z = Math.PI / 2;
    turboGroup.add(rotor);
    turboRotorRef.current = rotor;

    engineGroup.add(turboGroup);

    // --- 9. REDUCTION GEARBOX & CARBON FIBER PROPELLER ---
    const propGroup = new THREE.Group();
    propGroup.position.set(0, 0.1, 2.3);

    const gearboxGeo = new THREE.CylinderGeometry(0.65, 0.82, 0.8, 32);
    const gearboxMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.25,
      map: brushedMetalTex,
    });
    const gearbox = new THREE.Mesh(gearboxGeo, gearboxMat);
    gearbox.rotation.x = Math.PI / 2;
    propGroup.add(gearbox);

    const govGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 16);
    const govMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9 });
    const governor = new THREE.Mesh(govGeo, govMat);
    governor.position.set(0, 0.65, 0);
    propGroup.add(governor);

    const spinnerGeo = new THREE.ConeGeometry(0.55, 1.1, 32);
    const spinnerMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x002233,
      emissiveIntensity: 0.35,
    });
    const spinner = new THREE.Mesh(spinnerGeo, spinnerMat);
    spinner.position.z = 0.85;
    spinner.rotation.x = Math.PI / 2;
    propGroup.add(spinner);

    for (let b = 0; b < 3; b++) {
      const bladeAngle = (b * Math.PI * 2) / 3;
      const bladeSubGroup = new THREE.Group();
      bladeSubGroup.position.set(0, 0, 0.6);
      bladeSubGroup.rotation.z = -bladeAngle;

      const bladeGeo = new THREE.BoxGeometry(0.26, 2.5, 0.07);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        metalness: 0.85,
        roughness: 0.2,
        map: carbonFiberTex,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 1.3;
      blade.rotation.y = 0.22;
      bladeSubGroup.add(blade);

      const tipGeo = new THREE.BoxGeometry(0.27, 0.3, 0.08);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.y = 2.4;
      tip.rotation.y = 0.22;
      bladeSubGroup.add(tip);

      propGroup.add(bladeSubGroup);
    }

    engineGroup.add(propGroup);
    propAssemblyRef.current = propGroup;

    // --- 10. PARTICLES ---
    const shimmerCount = 150;
    const shimmerGeo = new THREE.BufferGeometry();
    const shimmerPositions = new Float32Array(shimmerCount * 3);
    for (let i = 0; i < shimmerCount; i++) {
      shimmerPositions[i * 3] = (Math.random() - 0.5) * 1.6;
      shimmerPositions[i * 3 + 1] = Math.random() * 2.2;
      shimmerPositions[i * 3 + 2] = -2.0 - Math.random() * 1.8;
    }
    shimmerGeo.setAttribute('position', new THREE.BufferAttribute(shimmerPositions, 3));
    const shimmerMat = new THREE.PointsMaterial({
      color: 0xff5500,
      size: 0.14,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const heatParticles = new THREE.Points(shimmerGeo, shimmerMat);
    engineGroup.add(heatParticles);
    heatShimmerParticlesRef.current = heatParticles;

    const oilCount = 220;
    const oilGeo = new THREE.BufferGeometry();
    const oilPositions = new Float32Array(oilCount * 3);
    for (let i = 0; i < oilCount; i++) {
      oilPositions[i * 3] = (Math.random() - 0.5) * 1.8;
      oilPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.4 - 0.5;
      oilPositions[i * 3 + 2] = (Math.random() - 0.5) * 3.4;
    }
    oilGeo.setAttribute('position', new THREE.BufferAttribute(oilPositions, 3));
    const oilMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.1,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const oilPoints = new THREE.Points(oilGeo, oilMat);
    engineGroup.add(oilPoints);
    oilStreamRef.current = oilPoints;

    const airCount = 120;
    const airGeo = new THREE.BufferGeometry();
    const airPositions = new Float32Array(airCount * 3);
    for (let i = 0; i < airCount; i++) {
      airPositions[i * 3] = (Math.random() - 0.5) * 0.7;
      airPositions[i * 3 + 1] = 1.38 + (Math.random() - 0.5) * 0.35;
      airPositions[i * 3 + 2] = 1.4 - Math.random() * 2.5;
    }
    airGeo.setAttribute('position', new THREE.BufferAttribute(airPositions, 3));
    const airMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const airPoints = new THREE.Points(airGeo, airMat);
    engineGroup.add(airPoints);
    airIntakeParticlesRef.current = airPoints;

    // --- 11. MOUSE & TOUCH ORBIT CONTROLS ---
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && engineGroupRef.current) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;

        engineGroupRef.current.rotation.y += deltaX * 0.007;
        engineGroupRef.current.rotation.x += deltaY * 0.007;
        prevMousePos = { x: e.clientX, y: e.clientY };
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(engineGroup.children, true);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hit === turboHousingRef.current) {
          setInspectedPart('Garrett TBO-25 Turbocharger Turbine (Hot Scroll)');
        } else if (hit === throttleValveRef.current) {
          setInspectedPart('FADEC Electronic Throttle Body Valve');
        } else if (cylinderHeads.includes(hit as THREE.Mesh)) {
          const idx = cylinderHeads.indexOf(hit as THREE.Mesh);
          setInspectedPart(`Cylinder #${idx + 1} Dual-Plug CNC Head (CHT: ${telemetryRef.current.cylinders[idx]?.cht}°C)`);
        } else if (pistons.includes(hit as THREE.Mesh)) {
          setInspectedPart('Forged Aluminum Piston Crown & Con-Rod Stroke');
        } else if (propAssemblyRef.current?.children.includes(hit as THREE.Mesh)) {
          setInspectedPart('Constant-Speed Carbon Fiber 3-Blade Propeller Hub');
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && engineGroupRef.current && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - prevMousePos.x;
        const deltaY = e.touches[0].clientY - prevMousePos.y;

        engineGroupRef.current.rotation.y += deltaX * 0.01;
        engineGroupRef.current.rotation.x += deltaY * 0.01;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const zoomDelta = e.deltaY * 0.003;
      cameraRef.current.position.z = Math.max(3.5, Math.min(15, cameraRef.current.position.z + zoomDelta));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- 12. 60 FPS ANIMATION LOOP ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const telemetry = telemetryRef.current;
      const faultsState = faultsRef.current;
      const throttleVal = throttleRef.current;
      const mode = viewModeRef.current;
      const shouldRotate = autoRotateRef.current;
      const fireCombustion = showCombustionRef.current;
      const drawOil = showOilFlowRef.current;

      const misfireActive = faultsState.find((f) => f.id === 'MISFIRE' && f.enabled);
      const lubeLossActive = faultsState.find((f) => f.id === 'LUBRICATION_LOSS' && f.enabled);
      const vibFaultActive = faultsState.find((f) => f.id === 'ABNORMAL_VIBRATION' && f.enabled);
      const instabActive = faultsState.find((f) => f.id === 'COMBUSTION_INSTABILITY' && f.enabled);

      if (engineGroupRef.current) {
        if (shouldRotate && !isDragging) {
          engineGroupRef.current.rotation.y += delta * 0.3;
        }

        if (telemetry.vibrationRms > 3.0 || vibFaultActive || misfireActive || instabActive) {
          const vibIntensity = (telemetry.vibrationRms / 8.0) * 0.035;
          engineGroupRef.current.position.x = (Math.random() - 0.5) * vibIntensity;
          engineGroupRef.current.position.y = (Math.random() - 0.5) * vibIntensity;
        } else {
          engineGroupRef.current.position.set(0, 0, 0);
        }

        const targetScale = mode === 'XRAY_EXPLODED' ? 1.32 : 1.0;
        engineGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
      }

      if (throttleValveRef.current) {
        const targetAngle = (1 - throttleVal / 100) * (Math.PI / 2);
        throttleValveRef.current.rotation.x = targetAngle;
      }

      const radPerSec = (telemetry.rpm / 60) * Math.PI * 2;
      if (propAssemblyRef.current) {
        propAssemblyRef.current.rotation.z += radPerSec * delta * 0.16;
      }
      if (turboRotorRef.current) {
        const turboBoostFactor = 1.0 + (throttleVal / 100) * 3.0;
        turboRotorRef.current.rotation.x += radPerSec * delta * 0.7 * turboBoostFactor;
      }

      const strokeFreq = (telemetry.rpm / 60) * Math.PI * 2 * 0.12;
      pistonsRef.current.forEach((piston, idx) => {
        const phase = (idx * Math.PI) / 2;
        const strokeAmp = mode === 'XRAY_EXPLODED' ? 0.48 : 0.32;
        const displacement = Math.sin(elapsed * strokeFreq + phase) * strokeAmp;
        piston.position.y = displacement;

        if (conRodsRef.current[idx]) {
          conRodsRef.current[idx].rotation.z = Math.PI / 2 + Math.cos(elapsed * strokeFreq + phase) * 0.22;
        }

        const flashLight = combustionFlashesRef.current[idx];
        const isCylMisfiring = misfireActive && idx === 2;

        if (flashLight) {
          if (isCylMisfiring || !fireCombustion) {
            flashLight.intensity = 0;
          } else {
            const isTdc = Math.sin(elapsed * strokeFreq + phase) > 0.82;
            flashLight.intensity = isTdc ? 3.2 + (throttleVal / 100) * 4.0 : 0.08;
            flashLight.color.setHex(telemetry.egt > 820 ? 0xff2200 : 0xff8800);
          }
        }
      });

      cylinderHeadsRef.current.forEach((head, idx) => {
        const headMat = head.material as THREE.MeshStandardMaterial;
        const cylTele = telemetry.cylinders[idx];
        const isCylMisfiring = misfireActive && idx === 2;

        if (mode === 'THERMAL' || mode === 'AERO_FLOW') {
          headMat.wireframe = false;
          if (isCylMisfiring) {
            headMat.color.setHex(0x0284c7);
            headMat.emissive.setHex(0x001a33);
            headMat.emissiveIntensity = 0.9;
          } else if (cylTele && cylTele.cht > 125) {
            headMat.color.setHex(0xf43f5e);
            headMat.emissive.setHex(0x990011);
            headMat.emissiveIntensity = 1.1;
          } else if (cylTele && cylTele.cht > 105) {
            headMat.color.setHex(0xf59e0b);
            headMat.emissive.setHex(0x662200);
            headMat.emissiveIntensity = 0.75;
          } else {
            headMat.color.setHex(0x10b981);
            headMat.emissive.setHex(0x003322);
            headMat.emissiveIntensity = 0.4;
          }
        } else if (mode === 'XRAY_EXPLODED') {
          headMat.wireframe = true;
          headMat.color.setHex(isCylMisfiring ? 0x0284c7 : 0x00f0ff);
          headMat.emissive.setHex(isCylMisfiring ? 0x001122 : 0x003344);
          headMat.emissiveIntensity = 0.6;
        } else {
          headMat.wireframe = false;
          headMat.color.setHex(0x475569);
          headMat.emissive.setHex(0x000000);
          headMat.emissiveIntensity = 0;
        }
      });

      exhaustRunnersRef.current.forEach((runner, idx) => {
        const exMat = runner.material as THREE.MeshStandardMaterial;
        const isCylMisfiring = misfireActive && idx === 2;

        if (isCylMisfiring) {
          exMat.emissive.setHex(0x0f172a);
          exMat.emissiveIntensity = 0.1;
        } else if (telemetry.egt > 830) {
          exMat.emissive.setHex(0xff1100);
          exMat.emissiveIntensity = 1.2;
        } else {
          exMat.emissive.setHex(0xd946ef);
          exMat.emissiveIntensity = 0.4 + (throttleVal / 100) * 0.45;
        }
      });

      if (turboHousingRef.current) {
        const turboMat = turboHousingRef.current.material as THREE.MeshStandardMaterial;
        const turboGlow = Math.min(1.3, 0.45 + (throttleVal / 100) * 0.8 + (telemetry.egt > 820 ? 0.35 : 0));
        turboMat.emissiveIntensity = turboGlow;
      }

      if (heatShimmerParticlesRef.current) {
        const posAttr = heatShimmerParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const exhaustSpeed = 0.04 + (throttleVal / 100) * 0.1;

        for (let i = 0; i < shimmerCount; i++) {
          positions[i * 3 + 2] -= exhaustSpeed;
          positions[i * 3 + 1] += 0.012;
          if (positions[i * 3 + 2] < -4.2) {
            positions[i * 3 + 2] = -2.0;
            positions[i * 3 + 1] = Math.random() * 0.9;
          }
        }
        posAttr.needsUpdate = true;
      }

      if (oilStreamRef.current && drawOil) {
        const posAttr = oilStreamRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const flowSpeed = lubeLossActive ? 0.002 : (telemetry.oilPressure / 4.0) * 0.028;

        for (let i = 0; i < oilCount; i++) {
          positions[i * 3 + 2] += flowSpeed;
          if (positions[i * 3 + 2] > 1.8) {
            positions[i * 3 + 2] = -1.8;
          }
        }
        posAttr.needsUpdate = true;

        const oilMat = oilStreamRef.current.material as THREE.PointsMaterial;
        oilMat.color.setHex(lubeLossActive ? 0xf43f5e : 0x00f0ff);
        oilMat.opacity = lubeLossActive ? 0.35 : 0.85;
      }

      if (airIntakeParticlesRef.current) {
        const posAttr = airIntakeParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const airSpeed = 0.03 + (throttleVal / 100) * 0.09;

        for (let i = 0; i < airCount; i++) {
          positions[i * 3 + 2] -= airSpeed;
          if (positions[i * 3 + 2] < -1.4) {
            positions[i * 3 + 2] = 1.4;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [showOilFlow]);

  // Camera Presets
  const setCameraAngle = (preset: 'ISO' | 'CYLINDERS' | 'TURBO' | 'TOP') => {
    setCameraPreset(preset);
    if (!cameraRef.current || !engineGroupRef.current) return;
    engineGroupRef.current.rotation.set(0, 0, 0);

    switch (preset) {
      case 'ISO':
        cameraRef.current.position.set(6.8, 4.8, 7.8);
        cameraRef.current.lookAt(0, 0.2, 0);
        break;
      case 'CYLINDERS':
        cameraRef.current.position.set(5.2, 1.6, 0.8);
        cameraRef.current.lookAt(0, 0.4, 0);
        break;
      case 'TURBO':
        cameraRef.current.position.set(0, 3.2, -6.4);
        cameraRef.current.lookAt(0, 0.4, -2.2);
        break;
      case 'TOP':
        cameraRef.current.position.set(0, 9.2, 0.1);
        cameraRef.current.lookAt(0, 0, 0);
        break;
    }
  };

  const t = currentTelemetry;
  const misfireFault = faults.find((f) => f.id === 'MISFIRE' && f.enabled);
  const lubeFault = faults.find((f) => f.id === 'LUBRICATION_LOSS' && f.enabled);

  return (
    <div className="bg-aerospace-900/90 rounded-xl border border-slate-800 p-2.5 sm:p-4 flex flex-col gap-2.5 sm:gap-3 shadow-xl relative overflow-hidden">
      {/* 3D Viewport Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="p-1 sm:p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 glow-cyan">
            <Rotate3d className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className="font-tech text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">Rotax 914 Turbocharged Twin</span>
              <span className="hidden sm:inline text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 font-normal">
                PBR Shaders
              </span>
            </h2>
          </div>
        </div>

        {/* View Mode Switcher (Scrollable on small mobile screens) */}
        <div className="flex items-center gap-1 bg-aerospace-950 p-1 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-mono overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode('REALISTIC')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              viewMode === 'REALISTIC'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3 text-cyan-300" />
            <span>Alloy</span>
          </button>
          <button
            onClick={() => setViewMode('THERMAL')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              viewMode === 'THERMAL'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-orange-400" />
            <span>Thermal</span>
          </button>
          <button
            onClick={() => setViewMode('XRAY_EXPLODED')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              viewMode === 'XRAY_EXPLODED'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize className="w-3 h-3 text-purple-400" />
            <span>Exploded</span>
          </button>
          <button
            onClick={() => setViewMode('AERO_FLOW')}
            className={`px-2 sm:px-2.5 py-1 rounded transition-all shrink-0 flex items-center gap-1 ${
              viewMode === 'AERO_FLOW'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>Flow</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-72 sm:h-96 lg:h-[440px] rounded-xl bg-[#02050a] border border-slate-800/80 overflow-hidden group">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

        {/* Live Variable Feedback HUD Overlay */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1 sm:gap-1.5 pointer-events-none z-10 max-w-[90%]">
          <div className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-aerospace-950/90 backdrop-blur-md border border-slate-700/60 text-[9px] sm:text-[11px] font-mono text-slate-200 flex flex-wrap items-center gap-1.5 sm:gap-2.5">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>THR: <strong className="text-cyan-300">{throttle}%</strong></span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>RPM: <strong className="text-emerald-300">{t.rpm.toFixed(0)}</strong></span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>CHT: <strong className={t.cht > 125 ? 'text-rose-400' : 'text-amber-300'}>{t.cht.toFixed(0)}°C</strong></span>
            </span>
          </div>

          {inspectedPart && (
            <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-aerospace-900/85 backdrop-blur-md border border-cyan-500/40 text-[8px] sm:text-[10px] font-mono text-cyan-300 flex items-center gap-1 truncate max-w-full">
              <Info className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">INSPECT: <strong>{inspectedPart}</strong></span>
            </div>
          )}

          {misfireFault && (
            <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-rose-950/90 backdrop-blur-md border border-rose-500 text-[9px] sm:text-[11px] font-mono text-rose-200 flex items-center gap-1.5 glow-rose animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0"></span>
              <span className="truncate">⚠️ CYL #3 QUENCHED (EGT {t.cylinders[2]?.egt.toFixed(0)}°C)</span>
            </div>
          )}

          {lubeFault && (
            <div className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg bg-rose-950/90 backdrop-blur-md border border-rose-500 text-[9px] sm:text-[11px] font-mono text-rose-200 flex items-center gap-1.5 glow-rose animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0"></span>
              <span className="truncate">💧 OIL FILM BREAKDOWN ({t.oilPressure.toFixed(2)} bar)</span>
            </div>
          )}
        </div>

        {/* Bottom Floating 3D Controls */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-auto z-10">
          <div className="flex items-center gap-1 bg-aerospace-950/90 backdrop-blur-md p-0.5 sm:p-1 rounded-lg border border-slate-700/60 text-[9px] sm:text-[10px] font-mono">
            <Camera className="w-3 h-3 text-slate-400 ml-0.5" />
            <button
              onClick={() => setCameraAngle('ISO')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${cameraPreset === 'ISO' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400'}`}
            >
              ISO
            </button>
            <button
              onClick={() => setCameraAngle('CYLINDERS')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${cameraPreset === 'CYLINDERS' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400'}`}
            >
              Cyl
            </button>
            <button
              onClick={() => setCameraAngle('TURBO')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${cameraPreset === 'TURBO' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400'}`}
            >
              Turbo
            </button>
            <button
              onClick={() => setCameraAngle('TOP')}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${cameraPreset === 'TOP' ? 'bg-cyan-500/30 text-cyan-200 font-bold' : 'text-slate-400'}`}
            >
              Top
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCombustion(!showCombustion)}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-aerospace-950/90 backdrop-blur-md border text-[9px] sm:text-[10px] font-mono flex items-center gap-1 transition-all ${
                showCombustion ? 'border-orange-500/60 text-orange-300' : 'border-slate-700 text-slate-500'
              }`}
              title="Toggle Combustion Spark Flashes"
            >
              <Flame className="w-3 h-3" />
              <span className="hidden sm:inline">Spark</span>
            </button>

            <button
              onClick={() => setShowOilFlow(!showOilFlow)}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-aerospace-950/90 backdrop-blur-md border text-[9px] sm:text-[10px] font-mono flex items-center gap-1 transition-all ${
                showOilFlow ? 'border-blue-500/60 text-blue-300' : 'border-slate-700 text-slate-500'
              }`}
              title="Toggle Oil Gallery Stream"
            >
              <Droplets className="w-3 h-3" />
              <span className="hidden sm:inline">Oil</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-aerospace-950/90 backdrop-blur-md border text-[9px] sm:text-[10px] font-mono flex items-center gap-1 transition-all ${
                autoRotate ? 'border-cyan-500/60 text-cyan-300 glow-cyan' : 'border-slate-700 text-slate-500'
              }`}
              title="Toggle 360° Auto-Rotation"
            >
              {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{autoRotate ? 'Spin' : 'Static'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
