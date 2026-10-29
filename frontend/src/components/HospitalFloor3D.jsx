import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Play,
  Pause,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';

// ─── Status Palette Configuration (Clinical Grade) ──────────────────
const STATUS_CONFIG = {
  safe: {
    color: 0x10b981,
    hex: '#10b981',
    label: 'Normal',
    floorOpacity: 0.08,
    borderOpacity: 0.5,
  },
  warning: {
    color: 0xf59e0b,
    hex: '#f59e0b',
    label: 'Warning',
    floorOpacity: 0.15,
    borderOpacity: 0.7,
  },
  alert: {
    color: 0xf43f5e,
    hex: '#f43f5e',
    label: 'Critical',
    floorOpacity: 0.22,
    borderOpacity: 0.9,
  },
  stale: {
    color: 0x64748b,
    hex: '#64748b',
    label: 'Stale',
    floorOpacity: 0.05,
    borderOpacity: 0.3,
  },
};

// 5-Room Clinical Floor Layout
const ROOM_LAYOUT = [
  { id: 'ICU-101', bedNum: 'Bed 1', name: 'Bed 1 — Negative Pressure Isolation', x: -8.8, z: -5.4, w: 7.4, d: 5.8 },
  { id: 'ICU-102', bedNum: 'Bed 2', name: 'Bed 2 — General ICU Suite A',               x: 0.0,  z: -5.4, w: 7.4, d: 5.8 },
  { id: 'ICU-103', bedNum: 'Bed 3', name: 'Bed 3 — General ICU Suite B',               x: 8.8,  z: -5.4, w: 7.4, d: 5.8 },
  { id: 'ICU-104', bedNum: 'Bed 4', name: 'Bed 4 — Neuro-Trauma Suite',                x: -4.4, z: 5.4,  w: 7.4, d: 5.8 },
  { id: 'ICU-105', bedNum: 'Bed 5', name: 'Bed 5 — Post-Op Surgical Recovery',         x: 4.4,  z: 5.4,  w: 7.4, d: 5.8 },
];

/** Procedural Hallway Runner Texture with Directional Wayfinding Guides */
function createCorridorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep clinical navy runner
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle boundary accent lines
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 1024, 4);
  ctx.fillRect(0, 252, 1024, 4);

  // Thin guidance dashes along centerline
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 24]);
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(1024, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Lightweight Clinical Hospital Bed */
function createHospitalBed(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.2 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.65 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.16, 4.2), metalMat);
  chassis.position.y = 0.35;
  chassis.castShadow = true;
  group.add(chassis);

  // Caster wheels
  [[-1.0, 1.8], [1.0, 1.8], [-1.0, -1.8], [1.0, -1.8]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.14, wz);
    group.add(wheel);
  });

  // Mattress
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.32, 4.1), sheetMat);
  mattress.position.y = 0.6;
  mattress.castShadow = true;
  group.add(mattress);

  // Bed blanket
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.34, 2.7), blanketMat);
  blanket.position.set(0, 0.61, 0.65);
  blanket.castShadow = true;
  group.add(blanket);

  // Pillow
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.8), pillowMat);
  pillow.position.set(0, 0.85, -1.45);
  pillow.rotation.x = 0.1;
  pillow.castShadow = true;
  group.add(pillow);

  // Headboard & footboard
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 0.1), metalMat);
  headboard.position.set(0, 0.85, -2.1);
  group.add(headboard);

  const footboard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.1), metalMat);
  footboard.position.set(0, 0.75, 2.1);
  group.add(footboard);

  // Side safety rails
  [-1.15, 1.15].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 2.2), railMat);
    rail.position.set(rx, 0.9, -0.2);
    group.add(rail);
  });

  return group;
}

/** Bedside Medical Monitor and Console */
function createBedsideConsole(x, z, rotationY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
  const casingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

  // Articulating arm
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.7, 8), chromeMat);
  pole.position.set(0, 2.1, 0);
  group.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), chromeMat);
  arm.position.set(0.35, 2.85, 0);
  group.add(arm);

  // Screen housing
  const screenBox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.46, 0.07), casingMat);
  screenBox.position.set(0.72, 2.7, 0);
  screenBox.rotation.y = -0.3;
  group.add(screenBox);

  // Screen display
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.38), screenMat);
  screen.position.set(0.72, 2.7, 0.045);
  screen.rotation.y = -0.3;
  group.add(screen);

  return group;
}

/** Dual IV Infusion Stand */
function createIVStand(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.1 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.6 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.7, 8), chromeMat);
  pole.position.y = 1.35;
  group.add(pole);

  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.025, 0.025), chromeMat);
  hook.position.y = 2.68;
  group.add(hook);

  [-0.2, 0.2].forEach((bx) => {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.05), bagMat);
    bag.position.set(bx, 2.45, 0);
    group.add(bag);
  });

  return group;
}

export default function HospitalFloor3D({
  beds = [],
  selectedRoomId = 'ICU-101',
  onSelectBed,
}) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const handleSelectRef = useRef(onSelectBed);
  const selectedRoomIdRef = useRef(selectedRoomId);
  const bedsRef = useRef(beds);

  const roomMeshesRef = useRef({});
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const [autoRotate, setAutoRotate] = useState(false);
  const [badgePositions, setBadgePositions] = useState({});

  useEffect(() => {
    handleSelectRef.current = onSelectBed;
  }, [onSelectBed]);

  useEffect(() => {
    bedsRef.current = beds;
  }, [beds]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;

    // Update 3D selection highlight
    Object.entries(roomMeshesRef.current).forEach(([id, obj]) => {
      const isSelected = id === selectedRoomId;
      if (obj.selectionRing) {
        obj.selectionRing.visible = isSelected;
      }
      if (obj.floorFill && obj.floorFill.material) {
        const status = obj.currentStatus || 'safe';
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.safe;
        obj.floorFill.material.opacity = isSelected ? cfg.floorOpacity * 2.2 : cfg.floorOpacity;
      }
    });
  }, [selectedRoomId]);

  // Dynamic status update without rebuilding the scene
  useEffect(() => {
    beds.forEach((bed) => {
      const obj = roomMeshesRef.current[bed.roomId];
      if (!obj) return;

      const status = bed.status || 'safe';
      obj.currentStatus = status;
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.safe;
      const targetColor = new THREE.Color(cfg.color);

      if (obj.borderMat) {
        obj.borderMat.color.copy(targetColor);
        obj.borderMat.opacity = bed.roomId === selectedRoomIdRef.current ? cfg.borderOpacity * 1.3 : cfg.borderOpacity;
      }
      if (obj.floorFill && obj.floorFill.material) {
        obj.floorFill.material.color.copy(targetColor);
        obj.floorFill.material.opacity =
          bed.roomId === selectedRoomIdRef.current ? cfg.floorOpacity * 2.2 : cfg.floorOpacity;
      }
      if (obj.roomLight) {
        obj.roomLight.color.copy(targetColor);
      }
    });
  }, [beds]);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080e1a); // Clinical deep navy
    scene.fog = new THREE.FogExp2(0x080e1a, 0.007);

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, 0.1, 150);
    const defaultCamPos = new THREE.Vector3(22, 26, 24);
    const defaultTarget = new THREE.Vector3(0, 0.5, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);
    cameraRef.current = camera;

    // 3. Renderer with soft shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 12;
    controls.maxDistance = 55;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = 0.2;
    controls.target.copy(defaultTarget);
    controlsRef.current = controls;

    // 5. Architectural Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const sun = new THREE.DirectionalLight(0xf8fafc, 1.5);
    sun.position.set(20, 32, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fill.position.set(-18, 18, -14);
    scene.add(fill);

    const floorGroup = new THREE.Group();
    scene.add(floorGroup);

    // 6. Floor Geometry
    const totalW = 28;
    const totalD = 20;

    // Satin light grey epoxy main floor
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111c30, roughness: 0.35, metalness: 0.1 });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(totalW, totalD), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorGroup.add(floorMesh);

    // Central corridor runner
    const runnerTex = createCorridorTexture();
    const runnerMat = new THREE.MeshStandardMaterial({ map: runnerTex, roughness: 0.3 });
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(totalW - 1, 4.0), runnerMat);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.015, 0);
    runner.receiveShadow = true;
    floorGroup.add(runner);

    // Outer perimeter walls
    const wallH = 3.4;
    const wallThickness = 0.45;
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });

    // North wall
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(totalW, wallH, wallThickness), wallMat);
    northWall.position.set(0, wallH / 2, -totalD / 2);
    northWall.castShadow = northWall.receiveShadow = true;
    floorGroup.add(northWall);

    // East wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, totalD), wallMat);
    eastWall.position.set(totalW / 2, wallH / 2, 0);
    eastWall.castShadow = eastWall.receiveShadow = true;
    floorGroup.add(eastWall);

    // West wall (with corridor opening)
    const westWallTop = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, (totalD - 4.5) / 2), wallMat);
    westWallTop.position.set(-totalW / 2, wallH / 2, -totalD / 4 - 1.1);
    floorGroup.add(westWallTop);

    const westWallBot = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, (totalD - 4.5) / 2), wallMat);
    westWallBot.position.set(-totalW / 2, wallH / 2, totalD / 4 + 1.1);
    floorGroup.add(westWallBot);

    // South wall
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(totalW, wallH, wallThickness), wallMat);
    southWall.position.set(0, wallH / 2, totalD / 2);
    southWall.castShadow = southWall.receiveShadow = true;
    floorGroup.add(southWall);

    // Glass Partition Material
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
      metalness: 0.5,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });

    // 7. Construct 5 ICU Rooms
    ROOM_LAYOUT.forEach((layout) => {
      const roomGroup = new THREE.Group();
      roomGroup.position.set(layout.x, 0, layout.z);

      const matchingBed = bedsRef.current.find((b) => b.roomId === layout.id);
      const initialStatus = matchingBed ? matchingBed.status : 'safe';
      const cfg = STATUS_CONFIG[initialStatus] || STATUS_CONFIG.safe;
      const initialColor = new THREE.Color(cfg.color);

      // A. Floor Fill
      const floorFillMat = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: layout.id === selectedRoomIdRef.current ? cfg.floorOpacity * 2.2 : cfg.floorOpacity,
        side: THREE.DoubleSide,
      });
      const floorFill = new THREE.Mesh(new THREE.PlaneGeometry(layout.w - 0.2, layout.d - 0.2), floorFillMat);
      floorFill.rotation.x = -Math.PI / 2;
      floorFill.position.y = 0.025;
      roomGroup.add(floorFill);

      // B. Architectural Status Border
      const borderMat = new THREE.MeshBasicMaterial({
        color: initialColor,
        transparent: true,
        opacity: layout.id === selectedRoomIdRef.current ? cfg.borderOpacity * 1.3 : cfg.borderOpacity,
      });

      const hw = (layout.w - 0.2) / 2;
      const hd = (layout.d - 0.2) / 2;
      const borderSegs = [
        { w: layout.w - 0.2, d: 0.08, x: 0, z: -hd },
        { w: layout.w - 0.2, d: 0.08, x: 0, z: hd },
        { w: 0.08, d: layout.d - 0.2, x: -hw, z: 0 },
        { w: 0.08, d: layout.d - 0.2, x: hw, z: 0 },
      ];

      const borderGroup = new THREE.Group();
      borderSegs.forEach((seg) => {
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(seg.w, 0.04, seg.d), borderMat);
        ribbon.position.set(seg.x, 0.04, seg.z);
        borderGroup.add(ribbon);
      });
      roomGroup.add(borderGroup);

      // C. Glass partitions & entrance
      const isTopRow = layout.z < 0;
      const glassZ = isTopRow ? hd : -hd;

      const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(layout.w * 0.5, 3.0, 0.06), glassMat);
      glassPanel.position.set(-layout.w * 0.22, 1.5, glassZ);
      roomGroup.add(glassPanel);

      const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(layout.w, 0.25, 0.1), frameMat);
      doorHeader.position.set(0, 2.9, glassZ);
      roomGroup.add(doorHeader);

      // D. Room Divider Wall
      const dividerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
      const divider = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.0, layout.d), dividerMat);
      divider.position.set(hw, 1.5, 0);
      divider.castShadow = true;
      roomGroup.add(divider);

      // E. Clinical Bed
      const bedRotation = isTopRow ? 0 : Math.PI;
      const bed = createHospitalBed(0, isTopRow ? -0.4 : 0.4, bedRotation);
      roomGroup.add(bed);

      // F. Bedside Monitor
      const mon = createBedsideConsole(-1.3, isTopRow ? -0.9 : 0.9, isTopRow ? 0.3 : -2.8);
      roomGroup.add(mon);

      // G. IV Infusion Stand
      const iv = createIVStand(1.4, isTopRow ? -0.8 : 0.8);
      roomGroup.add(iv);

      // H. Selection Focus Ring (Cyan illuminated bracket)
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, wireframe: true });
      const selectionRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.75, 24), ringMat);
      selectionRing.rotation.x = -Math.PI / 2;
      selectionRing.position.set(0, 0.05, isTopRow ? -0.4 : 0.4);
      selectionRing.visible = layout.id === selectedRoomIdRef.current;
      roomGroup.add(selectionRing);

      // I. Status Ambient Point Light
      const roomLight = new THREE.PointLight(cfg.color, 0.8, 8);
      roomLight.position.set(0, 2.2, 0);
      roomGroup.add(roomLight);

      // J. Invisible Raycast Hitbox
      const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0 });
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(layout.w, 4.0, layout.d), hitBoxMat);
      hitBox.position.y = 2.0;
      hitBox.userData = { roomId: layout.id };
      roomGroup.add(hitBox);

      floorGroup.add(roomGroup);

      roomMeshesRef.current[layout.id] = {
        group: roomGroup,
        hitBox,
        borderMat,
        floorFill,
        roomLight,
        selectionRing,
        worldPos: new THREE.Vector3(layout.x, 3.6, layout.z),
        currentStatus: initialStatus,
      };
    });

    // 8. Mouse Raycasting and Click Handling
    let isMouseDown = false;
    let clickStartPos = { x: 0, y: 0 };

    function onMouseDown(e) {
      isMouseDown = true;
      clickStartPos = { x: e.clientX, y: e.clientY };
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

    function onMouseUp(e) {
      if (!isMouseDown) return;
      isMouseDown = false;

      // Detect clean click vs orbit drag
      const delta = Math.hypot(e.clientX - clickStartPos.x, e.clientY - clickStartPos.y);
      if (delta > 6) return;

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
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);

    // 9. Animation & 2D Projection Loop
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      // Project 3D labels to 2D screen positions
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
        });

        setBadgePositions(newPositions);
      }

      renderer.render(scene, camera);
    }

    animate();

    // 10. Resize
    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);

      controls.dispose();
      renderer.dispose();
      runnerTex.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Camera toolbar helpers
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(22, 26, 24);
    controlsRef.current.target.set(0, 0.5, 0);
    controlsRef.current.update();
  }, []);

  const setTopDownView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 36, 0.01);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  const zoomIn = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3().subVectors(controlsRef.current.target, cameraRef.current.position).normalize();
    cameraRef.current.position.addScaledVector(dir, 4);
    controlsRef.current.update();
  }, []);

  const zoomOut = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const dir = new THREE.Vector3().subVectors(controlsRef.current.target, cameraRef.current.position).normalize();
    cameraRef.current.position.addScaledVector(dir, -4);
    controlsRef.current.update();
  }, []);

  const toggleAutoRotate = useCallback(() => {
    if (!controlsRef.current) return;
    const nextState = !autoRotate;
    controlsRef.current.autoRotate = nextState;
    controlsRef.current.autoRotateSpeed = 0.8;
    setAutoRotate(nextState);
  }, [autoRotate]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D Canvas Host */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating 2D Status Badges (Crisp, Non-Cluttered) */}
      {ROOM_LAYOUT.map((layout) => {
        const pos = badgePositions[layout.id];
        if (!pos || !pos.visible) return null;

        const bed = beds.find((b) => b.roomId === layout.id);
        const status = bed ? bed.status : 'safe';
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
              background: isSelected ? 'rgba(15, 23, 42, 0.95)' : 'rgba(11, 19, 35, 0.85)',
              border: isSelected ? '1px solid #38bdf8' : '1px solid #1e293b',
              borderRadius: '6px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: isSelected
                ? '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(56, 189, 248, 0.25)'
                : '0 2px 8px rgba(0, 0, 0, 0.4)',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
              zIndex: 10,
              userSelect: 'none',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: cfg.hex,
                boxShadow: `0 0 6px ${cfg.hex}`,
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.02em' }}>
              {layout.bedNum}
            </span>
            <span style={{ fontSize: '10px', color: cfg.hex, fontWeight: 600 }}>{cfg.label}</span>
          </div>
        );
      })}

      {/* Camera Controls Toolbar (Top Left) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(11, 19, 35, 0.85)',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '4px',
          backdropFilter: 'blur(10px)',
          zIndex: 15,
        }}
      >
        <CameraBtn icon={RotateCcw} title="Reset Isometric Camera" onClick={resetCamera} />
        <CameraBtn icon={Compass} title="Top-Down Plan View" onClick={setTopDownView} />
        <CameraBtn icon={ZoomIn} title="Zoom In" onClick={zoomIn} />
        <CameraBtn icon={ZoomOut} title="Zoom Out" onClick={zoomOut} />
        <CameraBtn
          icon={autoRotate ? Pause : Play}
          title={autoRotate ? 'Pause Orbit' : 'Auto Orbit Showcase'}
          isActive={autoRotate}
          onClick={toggleAutoRotate}
        />
      </div>

      {/* Navigation Helper Tag (Bottom Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          background: 'rgba(11, 19, 35, 0.8)',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          padding: '5px 10px',
          color: '#64748b',
          fontSize: '11px',
          pointerEvents: 'none',
        }}
      >
        Left Click: Orbit • Scroll: Zoom • Right Click: Pan • Click bed to inspect
      </div>
    </div>
  );
}

function CameraBtn({ icon: Icon, title, onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '5px',
        border: 'none',
        background: isActive ? 'rgba(2, 132, 199, 0.3)' : 'transparent',
        color: isActive ? '#38bdf8' : '#94a3b8',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = '#94a3b8';
      }}
    >
      <Icon size={15} />
    </button>
  );
}
