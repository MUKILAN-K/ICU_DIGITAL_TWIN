import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── Status Configuration ──────────────────────────────────────────
const STATUS_CONFIG = {
  safe: {
    base: 0x10b981,
    glow: 'rgba(16, 185, 129, 0.4)',
    hex: '#10b981',
    label: 'Normal',
  },
  warning: {
    base: 0xf59e0b,
    glow: 'rgba(245, 158, 11, 0.4)',
    hex: '#f59e0b',
    label: 'Warning',
  },
  alert: {
    base: 0xef4444,
    glow: 'rgba(239, 68, 68, 0.55)',
    hex: '#ef4444',
    label: 'Critical',
  },
  unknown: {
    base: 0x0284c7,
    glow: 'rgba(2, 132, 199, 0.35)',
    hex: '#0284c7',
    label: 'Monitoring',
  },
};

// 5-Room Layout matching Image 1
// 3 rooms along the top/back, 2 rooms along the bottom/front
const ROOM_LAYOUT = [
  { id: 'ICU-101', name: 'Bed 1 — Isolation Unit (Negative Pressure)', x: -8.8, z: -5.4, w: 7.4, d: 5.8, bedNum: 'Bed 1' },
  { id: 'ICU-102', name: 'Bed 2 — General ICU Suite A',               x: 0.0,  z: -5.4, w: 7.4, d: 5.8, bedNum: 'Bed 2' },
  { id: 'ICU-103', name: 'Bed 3 — General ICU Suite B',               x: 8.8,  z: -5.4, w: 7.4, d: 5.8, bedNum: 'Bed 3' },
  { id: 'ICU-104', name: 'Bed 4 — High Occupancy Suite',              x: -4.4, z: 5.4,  w: 7.4, d: 5.8, bedNum: 'Bed 4' },
  { id: 'ICU-105', name: 'Bed 5 — Post-Op Recovery Suite',            x: 4.4,  z: 5.4,  w: 7.4, d: 5.8, bedNum: 'Bed 5' },
];

// ══════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURES FOR THE ICU FLOOR
// ══════════════════════════════════════════════════════════════════════

/** Central Hallway Blue Runner Texture with Painted White Navigation Chevrons */
function createCorridorRunnerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Vibrant medical blue runner background
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 1024, 256);

  // Darker edge border lines
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(0, 0, 1024, 12);
  ctx.fillRect(0, 244, 1024, 12);

  // White navigation chevrons along the corridor centerline
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  for (let x = 80; x < 1024; x += 160) {
    // Chevron arrow pointing right (along X corridor)
    ctx.beginPath();
    ctx.moveTo(x - 18, 105);
    ctx.lineTo(x + 18, 128);
    ctx.lineTo(x - 18, 151);
    ctx.stroke();

    // Small floor crossing dot
    ctx.beginPath();
    ctx.arc(x + 55, 128, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Realistic ICU Hospital Bed with Mattress, Blue Blanket, and Pillows */
function createHospitalBed(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  // Materials
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.15 });
  const mattressMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, // Vibrant clinical blue hospital blanket
    roughness: 0.75,
    metalness: 0.05,
  });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // 1. Lower chassis frame & caster wheels
  const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 4.2), metalMat);
  baseFrame.position.y = 0.35;
  baseFrame.castShadow = true;
  group.add(baseFrame);

  [[-1.0, 1.8], [1.0, 1.8], [-1.0, -1.8], [1.0, -1.8]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.15, wz);
    group.add(wheel);
  });

  // 2. White Hospital Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 4.1), mattressMat);
  mattress.position.y = 0.62;
  mattress.castShadow = true;
  group.add(mattress);

  // 3. Clinical Blue Bed Blanket (covering lower 70% of bed)
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.38, 2.8), blanketMat);
  blanket.position.set(0, 0.63, 0.65);
  blanket.castShadow = true;
  group.add(blanket);

  // Folded top sheet hem (white strip)
  const sheetFold = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.04, 0.35), mattressMat);
  sheetFold.position.set(0, 0.83, -0.72);
  group.add(sheetFold);

  // 4. Pillow
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.85), pillowMat);
  pillow.position.set(0, 0.88, -1.45);
  pillow.rotation.x = 0.12;
  pillow.castShadow = true;
  group.add(pillow);

  // 5. Headboard & Footboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.95, 0.12), metalMat);
  headboard.position.set(0, 0.9, -2.1);
  headboard.castShadow = true;
  group.add(headboard);

  const footboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 0.12), metalMat);
  footboard.position.set(0, 0.8, 2.1);
  footboard.castShadow = true;
  group.add(footboard);

  // 6. Safety Side Rails
  [-1.15, 1.15].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 2.2), railMat);
    rail.position.set(rx, 0.95, -0.2);
    group.add(rail);
  });

  return group;
}

/** Articulating Overhead Medical Monitor Arm */
function createOverheadMonitor(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
  const casingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });

  // Articulating arm pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), chromeMat);
  pole.position.set(0, 2.1, 0);
  group.add(pole);

  const horizontalArm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.06), chromeMat);
  horizontalArm.position.set(0.35, 2.9, 0);
  group.add(horizontalArm);

  // Monitor casing
  const screenCase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.48, 0.08), casingMat);
  screenCase.position.set(0.75, 2.75, 0);
  screenCase.rotation.y = -0.3;
  group.add(screenCase);

  // Glowing vital screen face
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), screenMat);
  screenFace.position.set(0.75, 2.75, 0.05);
  screenFace.rotation.y = -0.3;
  group.add(screenFace);

  return group;
}

/** Dual IV Infusion Pump Stand with Saline Bags */
function createIVStand(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });
  const bagMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
  });

  // Wheeled 5-star base
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 12), chromeMat);
  pole.position.y = 1.4;
  group.add(pole);

  // Cross hooks at top
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.03), chromeMat);
  hook.position.y = 2.75;
  group.add(hook);

  // 2 Saline IV Bags
  [-0.22, 0.22].forEach((bx) => {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.35, 0.06), bagMat);
    bag.position.set(bx, 2.5, 0);
    group.add(bag);
  });

  return group;
}

/** Bedside Medical Crash Cart / Telemetry Station */
function createMedicalCart(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
  const blueDrawerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

  // Main cabinet
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.8), whiteMat);
  cabinet.position.y = 0.65;
  cabinet.castShadow = true;
  group.add(cabinet);

  // Colored drawer faces
  [-0.15, 0.15, 0.45].forEach((dy) => {
    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.22, 0.04), blueDrawerMat);
    drawer.position.set(0, dy + 0.35, 0.41);
    group.add(drawer);
  });

  // 4 Small Wheels
  [[-0.35, 0.3], [0.35, 0.3], [-0.35, -0.3], [0.35, -0.3]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.08, wz);
    group.add(w);
  });

  return group;
}

/** Potted Corridor Plant */
function createCorridorPlant(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.9, 16), potMat);
  pot.position.y = 0.45;
  pot.castShadow = true;
  group.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  [[0, 1.2, 0, 0.55], [0.15, 1.5, 0.1, 0.45], [-0.15, 1.4, -0.1, 0.48], [0, 1.8, 0, 0.35]].forEach(([lx, ly, lz, r]) => {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    leaf.position.set(lx, ly, lz);
    leaf.castShadow = true;
    group.add(leaf);
  });

  return group;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: HOSPITAL FLOOR 3D (LEVEL 3)
// ══════════════════════════════════════════════════════════════════════

export default function HospitalFloor3D({
  rooms = [],
  selectedRoomId = 'ICU-101',
  onRoomClick,
  onSelectRoom,
}) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const handleSelectRef = useRef(onRoomClick || onSelectRoom);
  const roomsRef = useRef(rooms);
  const selectedRoomIdRef = useRef(selectedRoomId);

  // References to room meshes and reactive neon outlines
  const roomMeshesRef = useRef({});
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // 2D screen positions of floating room badges
  const [badgePositions, setBadgePositions] = useState({});

  useEffect(() => {
    handleSelectRef.current = onRoomClick || onSelectRoom;
  }, [onRoomClick, onSelectRoom]);

  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
    // Update selected visual highlight
    Object.entries(roomMeshesRef.current).forEach(([id, obj]) => {
      const isSelected = id === selectedRoomId;
      if (obj.neonMat) {
        obj.neonMat.opacity = isSelected ? 1.0 : 0.65;
      }
      if (obj.floorFill && obj.floorFill.material) {
        obj.floorFill.material.opacity = isSelected ? 0.35 : 0.15;
      }
    });
  }, [selectedRoomId]);

  // Update room status colors dynamically as WebSocket ticks arrive
  useEffect(() => {
    rooms.forEach((r) => {
      const obj = roomMeshesRef.current[r.room_id];
      if (!obj) return;

      const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.unknown;
      const targetColor = new THREE.Color(cfg.base);

      if (obj.neonMat) {
        obj.neonMat.color.copy(targetColor);
      }
      if (obj.floorFill && obj.floorFill.material) {
        obj.floorFill.material.color.copy(targetColor);
      }
      if (obj.roomLight) {
        obj.roomLight.color.copy(targetColor);
      }
    });
  }, [rooms]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene & Environment Setup ─────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c16); // Deep clinical dark space background
    scene.fog = new THREE.FogExp2(0x060c16, 0.008);

    // ── 2. Isometric Camera ──────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 150);
    // Perfect isometric vantage angle
    const defaultCamPos = new THREE.Vector3(20, 24, 24);
    const defaultTarget = new THREE.Vector3(0, 0.5, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // ── 3. High-Quality WebGL Renderer ───────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ── 4. OrbitControls with Soft Bounds ─────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 14;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.2; // Don't clip below floor
    controls.minPolarAngle = 0.2;
    controls.target.copy(defaultTarget);

    // ── 5. Balanced Lighting ──────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    // Directional Sun Light casting soft shadows
    const sun = new THREE.DirectionalLight(0xfffaed, 1.8);
    sun.position.set(25, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0003;
    scene.add(sun);

    // Soft cool blue fill light
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.5);
    fill.position.set(-20, 20, -15);
    scene.add(fill);

    const floorWingGroup = new THREE.Group();
    scene.add(floorWingGroup);

    // ── 6. ARCHITECTURAL CUTAWAY FLOOR & WALLS ────────────────────
    const totalW = 28;
    const totalD = 20;

    // Outer Clinical White Floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.05 });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(totalW, totalD), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorWingGroup.add(floorMesh);

    // Central Hallway Corridor Runner with Painted Chevrons
    const runnerTex = createCorridorRunnerTexture();
    const runnerMat = new THREE.MeshStandardMaterial({
      map: runnerTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(totalW - 2, 4.0), runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.02, 0);
    runner.receiveShadow = true;
    floorWingGroup.add(runner);

    // Exterior Surrounding Lawn / Ground (Matching Image 1's border)
    const lawnMat = new THREE.MeshStandardMaterial({ color: 0x0f2419, roughness: 0.9 });
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), lawnMat);
    lawn.rotation.x = -Math.PI / 2;
    lawn.position.y = -0.05;
    floorWingGroup.add(lawn);

    // Thick Outer Perimeter Cutaway Walls (Height = 3.6m)
    const wallH = 3.6;
    const wallThickness = 0.5;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const wallCapMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 });

    // Back Wall (North)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(totalW, wallH, wallThickness), wallMat);
    northWall.position.set(0, wallH / 2, -totalD / 2);
    northWall.castShadow = northWall.receiveShadow = true;
    floorWingGroup.add(northWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, totalD), wallMat);
    eastWall.position.set(totalW / 2, wallH / 2, 0);
    eastWall.castShadow = eastWall.receiveShadow = true;
    floorWingGroup.add(eastWall);

    // West Wall (Left, with corridor entry opening)
    const westWallTop = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, (totalD - 4.5) / 2), wallMat);
    westWallTop.position.set(-totalW / 2, wallH / 2, -totalD / 4 - 1.1);
    westWallTop.castShadow = true;
    floorWingGroup.add(westWallTop);

    const westWallBot = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, (totalD - 4.5) / 2), wallMat);
    westWallBot.position.set(-totalW / 2, wallH / 2, totalD / 4 + 1.1);
    westWallBot.castShadow = true;
    floorWingGroup.add(westWallBot);

    // South Wall (Front cutaway)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(totalW, wallH, wallThickness), wallMat);
    southWall.position.set(0, wallH / 2, totalD / 2);
    southWall.castShadow = southWall.receiveShadow = true;
    floorWingGroup.add(southWall);

    // Entrance Facade Archway with 3D illuminated 'ICU WING' signage
    const entranceArchMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const entranceArch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 4.8), entranceArchMat);
    entranceArch.position.set(-totalW / 2 - 0.2, 2.2, 0);
    floorWingGroup.add(entranceArch);

    // ── 7. BUILD THE 5 ICU ROOMS ──────────────────────────────────
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.8,
    });
    const mullionMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    ROOM_LAYOUT.forEach((layout) => {
      const roomGroup = new THREE.Group();
      roomGroup.position.set(layout.x, 0, layout.z);

      // Find status from initial rooms prop
      const roomState = rooms.find((r) => r.room_id === layout.id);
      const initialStatus = roomState ? roomState.status : 'safe';
      const cfg = STATUS_CONFIG[initialStatus] || STATUS_CONFIG.safe;
      const initialColor = new THREE.Color(cfg.base);

      // A. Glowing Status-Colored Floor Fill
      const floorFillMat = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: layout.id === selectedRoomId ? 0.35 : 0.15,
        side: THREE.DoubleSide,
      });
      const floorFill = new THREE.Mesh(new THREE.PlaneGeometry(layout.w - 0.2, layout.d - 0.2), floorFillMat);
      floorFill.rotation.x = -Math.PI / 2;
      floorFill.position.y = 0.03;
      roomGroup.add(floorFill);

      // B. Glowing Neon Perimeter Boundary Tube (Matching Image 1's red/yellow/green boundary!)
      const neonMat = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: layout.id === selectedRoomId ? 1.0 : 0.65,
      });

      // Construct a 4-segment rectangular perimeter ribbon
      const hw = (layout.w - 0.2) / 2;
      const hd = (layout.d - 0.2) / 2;
      const neonGroup = new THREE.Group();

      const borderSegs = [
        { w: layout.w - 0.2, d: 0.12, x: 0, z: -hd },
        { w: layout.w - 0.2, d: 0.12, x: 0, z: hd },
        { w: 0.12, d: layout.d - 0.2, x: -hw, z: 0 },
        { w: 0.12, d: layout.d - 0.2, x: hw, z: 0 },
      ];

      borderSegs.forEach((seg) => {
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(seg.w, 0.06, seg.d), neonMat);
        ribbon.position.set(seg.x, 0.06, seg.z);
        neonGroup.add(ribbon);
      });
      roomGroup.add(neonGroup);

      // C. Glass Partitions facing corridor with open doorway
      const isTopRow = layout.z < 0;
      const glassZ = isTopRow ? hd : -hd;

      // Left glass panel
      const glassL = new THREE.Mesh(new THREE.BoxGeometry(layout.w * 0.42, 3.2, 0.08), glassMat);
      glassL.position.set(-layout.w * 0.25, 1.6, glassZ);
      roomGroup.add(glassL);

      // Right glass panel
      const glassR = new THREE.Mesh(new THREE.BoxGeometry(layout.w * 0.25, 3.2, 0.08), glassMat);
      glassR.position.set(layout.w * 0.32, 1.6, glassZ);
      roomGroup.add(glassR);

      // Top door header beam
      const header = new THREE.Mesh(new THREE.BoxGeometry(layout.w, 0.3, 0.12), mullionMat);
      header.position.set(0, 3.1, glassZ);
      roomGroup.add(header);

      // D. Divider Walls between adjacent rooms
      const dividerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
      const dividerWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.2, layout.d), dividerMat);
      dividerWall.position.set(hw, 1.6, 0);
      dividerWall.castShadow = true;
      roomGroup.add(dividerWall);

      // E. Detailed Motorized Hospital Bed
      // Positioned centered facing the door
      const bedRotation = isTopRow ? 0 : Math.PI;
      const bed = createHospitalBed(0, isTopRow ? -0.4 : 0.4, bedRotation);
      roomGroup.add(bed);

      // F. Articulating Overhead Vital Monitor Arm
      const mon = createOverheadMonitor(-1.4, isTopRow ? -1.0 : 1.0, isTopRow ? 0.3 : -2.8);
      roomGroup.add(mon);

      // G. Dual IV Infusion Stand
      const iv = createIVStand(1.5, isTopRow ? -0.8 : 0.8);
      roomGroup.add(iv);

      // H. Bedside Mobile Medical Cart
      const cart = createMedicalCart(1.6, isTopRow ? 0.6 : -0.6, isTopRow ? -0.2 : 3.0);
      roomGroup.add(cart);

      // I. Warm Wall Sconce Light
      const sconceMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
      const sconce = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.15), sconceMat);
      sconce.position.set(0, 3.0, isTopRow ? -hd + 0.1 : hd - 0.1);
      roomGroup.add(sconce);

      const sconceLight = new THREE.PointLight(0xffedd5, 1.2, 8.0);
      sconceLight.position.set(0, 2.8, isTopRow ? -hd + 0.5 : hd - 0.5);
      roomGroup.add(sconceLight);

      // J. Reactive Status Room Ambient Wash Light
      const roomLight = new THREE.PointLight(cfg.base, 1.4, 10);
      roomLight.position.set(0, 2.5, 0);
      roomGroup.add(roomLight);

      // K. Invisible Raycast Click Hitbox
      const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, side: THREE.DoubleSide });
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(layout.w, 4.0, layout.d), hitBoxMat);
      hitBox.position.y = 2.0;
      hitBox.userData = { roomId: layout.id };
      roomGroup.add(hitBox);

      floorWingGroup.add(roomGroup);

      roomMeshesRef.current[layout.id] = {
        group: roomGroup,
        hitBox,
        neonMat,
        floorFill,
        roomLight,
        worldPos: new THREE.Vector3(layout.x, 3.8, layout.z),
      };
    });

    // ── 8. CORRIDOR BIOPHILIC PLANTS ──────────────────────────────
    floorWingGroup.add(createCorridorPlant(-11.5, -1.8));
    floorWingGroup.add(createCorridorPlant(11.5, -1.8));
    floorWingGroup.add(createCorridorPlant(-11.5, 1.8));
    floorWingGroup.add(createCorridorPlant(11.5, 1.8));
    floorWingGroup.add(createCorridorPlant(0, -1.8));

    // ── 9. MOUSE INTERACTION & RAYCASTING ─────────────────────────
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;

    function onMouseDown(e) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
    }

    function onMouseUp(e) {
      if (Math.abs(e.clientX - mouseDownPos.x) > 6 || Math.abs(e.clientY - mouseDownPos.y) > 6) {
        isDragging = true;
      }
    }

    function onMouseMove(e) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hitBoxes = Object.values(roomMeshesRef.current).map((m) => m.hitBox);
      const hits = raycasterRef.current.intersectObjects(hitBoxes, false);

      container.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    }

    function onClick(e) {
      if (isDragging) return;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hitBoxes = Object.values(roomMeshesRef.current).map((m) => m.hitBox);
      const hits = raycasterRef.current.intersectObjects(hitBoxes, false);

      if (hits.length > 0) {
        const clickedRoomId = hits[0].object.userData.roomId;
        if (clickedRoomId && handleSelectRef.current) {
          handleSelectRef.current(clickedRoomId);
        }
      }
    }

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // ── 10. ANIMATION & SCREEN BADGE PROJECTION LOOP ──────────────
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      controls.update();

      // Project 3D room badge positions to 2D screen coordinates
      if (container) {
        const rect = container.getBoundingClientRect();
        const newPositions = {};

        Object.entries(roomMeshesRef.current).forEach(([id, obj]) => {
          const wp = obj.worldPos.clone();
          wp.project(camera);

          const x = ((wp.x + 1) / 2) * rect.width;
          const y = ((-wp.y + 1) / 2) * rect.height;
          const isVisible = wp.z < 1.0;

          newPositions[id] = { x, y, visible: isVisible };

          // Subtle breathing glow animation for critical/alert rooms
          const roomData = roomsRef.current.find((r) => r.room_id === id);
          if (roomData && roomData.status === 'alert' && obj.neonMat) {
            obj.neonMat.opacity = 0.65 + Math.sin(time * 4) * 0.35;
          }
        });

        setBadgePositions(newPositions);
      }

      renderer.render(scene, camera);
    }

    animate();

    // ── 11. Responsive Resize ─────────────────────────────────────
    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // ── 12. Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D Canvas Host Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating 3D Room Status Pill Badges (Matching Image 1) */}
      {ROOM_LAYOUT.map((layout) => {
        const pos = badgePositions[layout.id];
        if (!pos || !pos.visible) return null;

        const roomState = rooms.find((r) => r.room_id === layout.id);
        const status = roomState ? roomState.status : 'safe';
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.safe;
        const isSelected = layout.id === selectedRoomId;

        return (
          <div
            key={layout.id}
            onClick={() => {
              if (handleSelectRef.current) handleSelectRef.current(layout.id);
            }}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: `translate(-50%, -50%) scale(${isSelected ? 1.05 : 1.0})`,
              background: 'rgba(15, 23, 42, 0.82)',
              backdropFilter: 'blur(12px) saturate(160%)',
              border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '20px',
              padding: '5px 12px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? '0 0 18px rgba(56, 189, 248, 0.45), 0 8px 20px rgba(0, 0, 0, 0.5)'
                : '0 4px 14px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 10,
              userSelect: 'none',
              pointerEvents: 'auto',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) scale(${isSelected ? 1.08 : 1.04}) translateY(-2px)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `translate(-50%, -50%) scale(${isSelected ? 1.05 : 1.0}) translateY(0)`;
            }}
          >
            {/* Glowing Status Dot */}
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: cfg.hex,
                boxShadow: `0 0 8px ${cfg.hex}`,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />

            {/* Room ID */}
            <span style={{ fontWeight: 700, fontSize: '12px', letterSpacing: '-0.01em', color: '#ffffff' }}>
              {layout.id}
            </span>

            {/* Status Label (Normal / Warning / Critical) */}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: cfg.hex,
                opacity: 0.95,
              }}
            >
              {cfg.label}
            </span>
          </div>
        );
      })}

      {/* Navigation Helper Tip */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'rgba(10, 17, 32, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#94a3b8',
          fontSize: '11px',
          pointerEvents: 'none',
        }}
      >
        Left Click + Drag: Orbit • Scroll: Zoom • Click any Room to inspect telemetry
      </div>
    </div>
  );
}
