import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Building2, Compass, Layers, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURE GENERATORS MATCHING ARCHITECTURAL REFERENCE
// ══════════════════════════════════════════════════════════════════════

/** Sky Dome Texture */
function createSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#1e3a8a');
  g.addColorStop(0.25, '#3b82f6');
  g.addColorStop(0.6, '#93c5fd');
  g.addColorStop(0.85, '#bfdbfe');
  g.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Procedural Chevron Accordion / Zig-Zag Facade Texture
 * Exactly reproduces the distinctive faceted white/grey pleats & vertical windows
 * visible in the reference architectural photo.
 */
function createChevronFacadeTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Base off-white background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 1024, 1024);

  const numBays = 16;
  const bayW = 1024 / numBays;
  const numFloors = 4;
  const floorH = 1024 / numFloors;

  // Draw 4 floors with horizontal reveal seams
  for (let fl = 0; fl < numFloors; fl++) {
    const yTop = fl * floorH;

    for (let b = 0; b < numBays; b++) {
      const xLeft = b * bayW;
      const xMid = xLeft + bayW * 0.5;
      const xRight = xLeft + bayW;

      // Facet A (Sunlit Left Side of the Chevron / Accordion fold)
      const gradA = ctx.createLinearGradient(xLeft, yTop, xMid, yTop);
      gradA.addColorStop(0, '#ffffff');
      gradA.addColorStop(0.5, '#f8fafc');
      gradA.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.moveTo(xLeft, yTop);
      ctx.lineTo(xMid, yTop + floorH * 0.5);
      ctx.lineTo(xLeft, yTop + floorH);
      ctx.closePath();
      ctx.fill();

      // Facet B (Shadowed Right Side of the Chevron / Accordion fold)
      const gradB = ctx.createLinearGradient(xMid, yTop, xRight, yTop);
      gradB.addColorStop(0, '#94a3b8');
      gradB.addColorStop(0.5, '#cbd5e1');
      gradB.addColorStop(1, '#64748b');
      ctx.fillStyle = gradB;
      ctx.beginPath();
      ctx.moveTo(xMid, yTop + floorH * 0.5);
      ctx.lineTo(xRight, yTop);
      ctx.lineTo(xRight, yTop + floorH);
      ctx.closePath();
      ctx.fill();

      // Vertical Window Strips embedded in the faceted bay
      const winW = bayW * 0.22;
      const winH = floorH * 0.72;
      const winX = xLeft + (bayW - winW) * 0.5;
      const winY = yTop + (floorH - winH) * 0.5;

      // Window Glass Reflection Gradient
      const winGrad = ctx.createLinearGradient(winX, winY, winX + winW, winY + winH);
      winGrad.addColorStop(0, '#1e293b');
      winGrad.addColorStop(0.35, '#0284c7');
      winGrad.addColorStop(0.7, '#0369a1');
      winGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = winGrad;
      ctx.fillRect(winX, winY, winW, winH);

      // Window Mullions (Dark Bronze/Charcoal frame)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(winX, winY, winW, winH);

      // Glass specular reflection highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.moveTo(winX, winY);
      ctx.lineTo(winX + winW * 0.6, winY);
      ctx.lineTo(winX, winY + winH * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // Floor-to-floor horizontal spandrel reveal line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, yTop);
    ctx.lineTo(1024, yTop);
    ctx.stroke();
  }

  // Top parapet shadow line
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, 1024, 1024);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

/**
 * Vertical Red/Crimson Curtain Wall Texture
 * For the central corner tower & left edge vertical window bay
 */
function createRedCurtainWallTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Dark crimson/wine structural background
  ctx.fillStyle = '#450a0a';
  ctx.fillRect(0, 0, 512, 1024);

  const cols = 4;
  const rows = 12;
  const cw = 512 / cols;
  const ch = 1024 / rows;
  const pad = 6;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw + pad;
      const y = r * ch + pad;
      const bw = cw - pad * 2;
      const bh = ch - pad * 2;

      // Reflective blue/teal glass
      const g = ctx.createLinearGradient(x, y, x + bw, y + bh);
      g.addColorStop(0, '#38bdf8');
      g.addColorStop(0.4, '#0284c7');
      g.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);

      // Vibrant Red/Crimson Mullion Frames matching Image 2
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = pad;
      ctx.strokeRect(x, y, bw, bh);

      // Glass glint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + bw * 0.5, y);
      ctx.lineTo(x, y + bh * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

/** Lush Lawn Grass Texture */
function createLawnTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#4ade80');
  g.addColorStop(0.5, '#22c55e');
  g.addColorStop(1, '#15803d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Micro-texture blade flecks
  for (let i = 0; i < 12000; i++) {
    const val = 140 + Math.random() * 80;
    ctx.fillStyle = `rgba(${val * 0.3}, ${val}, ${val * 0.25}, 0.2)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 4);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  return tex;
}

/** Paved Stone Pathway Texture */
function createStonePathTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  // Paver stones pattern
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    for (let x = 0; x < 512; x += 48) {
      const off = (Math.floor(y / 32) % 2) * 24;
      ctx.beginPath(); ctx.moveTo(x + off, y); ctx.lineTo(x + off, y + 32); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/** Water Texture for Circular Pond */
function createWaterTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  g.addColorStop(0, '#2dd4bf');
  g.addColorStop(0.5, '#0d9488');
  g.addColorStop(1, '#115e59');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric ripple rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  for (let r = 30; r < 240; r += 28) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  return tex;
}

// ══════════════════════════════════════════════════════════════════════
//  DETAILED 3D PROPS MATCHING IMAGE: AMBULANCE, TREES, FLOWER HEDGES
// ══════════════════════════════════════════════════════════════════════

/**
 * Modern Emergency Ambulance matching reference vehicles
 */
function createAmbulance(x, z, rotY) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  // Main Patient Compartment Box
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.8, 4.6), whiteMat);
  body.position.y = 1.3;
  body.castShadow = true;
  g.add(body);

  // Red Side Stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.35, 4.5), redMat);
  stripe.position.set(0, 1.3, 0);
  g.add(stripe);

  // Red Cross Decals on both sides
  [-1.18, 1.18].forEach((xSide) => {
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.2), redMat);
    crossV.position.set(xSide, 1.35, 0);
    g.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.6), redMat);
    crossH.position.set(xSide, 1.35, 0);
    g.add(crossH);
  });

  // Front Driver Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 1.6), whiteMat);
  cab.position.set(0, 1.05, 2.7);
  cab.castShadow = true;
  g.add(cab);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 0.1), darkGlassMat);
  windshield.position.set(0, 1.45, 3.48);
  windshield.rotation.x = -0.25;
  g.add(windshield);

  // Cab Side Windows
  const cabWinL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.8), darkGlassMat);
  cabWinL.position.set(-1.08, 1.3, 2.7);
  g.add(cabWinL);

  const cabWinR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.8), darkGlassMat);
  cabWinR.position.set(1.08, 1.3, 2.7);
  g.add(cabWinR);

  // Roof Emergency Light Bar (Red & Blue)
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.35), redMat);
  lightBar.position.set(0, 2.3, 1.8);
  g.add(lightBar);

  const blueLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.2, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x0284c7, emissiveIntensity: 0.6 })
  );
  blueLight.position.set(0.5, 2.3, 1.8);
  g.add(blueLight);

  // 4 Wheels
  const wheelGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
  wheelGeom.rotateZ(Math.PI / 2);

  [[-1.1, 0.42, 1.5], [1.1, 0.42, 1.5], [-1.1, 0.42, -1.5], [1.1, 0.42, -1.5]].forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    g.add(wheel);
  });

  return g;
}

/**
 * Organic Deciduous Canopy Tree matching reference image
 */
function createHospitalTree(x, z, scale = 1.0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * scale, 0.45 * scale, 3.2 * scale, 8), trunkMat);
  trunk.position.y = 1.6 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  // Leaf Clusters
  const leafMatA = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
  const leafMatB = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
  const leafMatC = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });

  const clusters = [
    [0, 3.4 * scale, 0, 1.8 * scale, leafMatA],
    [0.7 * scale, 4.0 * scale, 0.4 * scale, 1.4 * scale, leafMatB],
    [-0.6 * scale, 4.2 * scale, -0.3 * scale, 1.3 * scale, leafMatC],
    [0.2 * scale, 5.0 * scale, -0.2 * scale, 1.1 * scale, leafMatA],
    [-0.3 * scale, 3.6 * scale, 0.6 * scale, 1.2 * scale, leafMatB],
  ];

  clusters.forEach(([cx, cy, cz, cr, mat]) => {
    const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(cr, 1), mat);
    cluster.position.set(cx, cy, cz);
    cluster.castShadow = true;
    g.add(cluster);
  });

  return g;
}

/**
 * Vibrant Flowering Purple/Magenta Bush matching the hedges in Image 2
 */
function createFloweringBush(x, z, radius = 0.9) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  // Mixture of purple/magenta bougainvillea blooms and green leaves
  const bloomMat = new THREE.MeshStandardMaterial({
    color: Math.random() > 0.4 ? 0xa21caf : 0xc026d3,
    roughness: 0.65,
  });

  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.75,
  });

  const base = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 6), greenMat);
  base.position.y = radius * 0.75;
  base.scale.set(1.1, 0.8, 1.1);
  base.castShadow = true;
  g.add(base);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.random() * 0.4;
    const r = radius * 0.55;
    const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), bloomMat);
    bloom.position.set(Math.cos(angle) * radius * 0.6, radius * 0.9 + Math.random() * 0.2, Math.sin(angle) * radius * 0.6);
    bloom.castShadow = true;
    g.add(bloom);
  }

  return g;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: HOSPITAL EXTERIOR 3D (MATCHING REFERENCE IMAGE)
// ══════════════════════════════════════════════════════════════════════

export default function HospitalExterior3D({ rooms, onEnterFloor }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const onEnterFloorRef = useRef(onEnterFloor);
  const isTransitioningRef = useRef(false);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  useEffect(() => {
    onEnterFloorRef.current = onEnterFloor;
  }, [onEnterFloor]);

  // Click handler to enter reception
  const handleEnterHospital = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // Smooth camera swoop into entrance lobby
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const targetPos = new THREE.Vector3(-1.0, 3.2, 9.0);
      const targetLook = new THREE.Vector3(-1.0, 3.2, 0);

      const startTime = performance.now();
      const startPos = camera.position.clone();
      const startLook = controls.target.clone();

      const swoop = (now) => {
        const progress = Math.min(1.0, (now - startTime) / 1100);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.lerpVectors(startLook, targetLook, ease);
        controls.update();

        if (progress < 1.0) {
          requestAnimationFrame(swoop);
        } else {
          if (onEnterFloorRef.current) onEnterFloorRef.current();
        }
      };
      requestAnimationFrame(swoop);
    } else {
      if (onEnterFloorRef.current) onEnterFloorRef.current();
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene Setup ──────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.0032);

    // Sky Dome
    const skyTex = createSkyTexture();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(380, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(sky);

    // ── 2. Camera Setup (Elevated 3/4 Perspective Matching Image 2)
    const camera = new THREE.PerspectiveCamera(44, container.clientWidth / container.clientHeight, 0.2, 600);
    // Exact viewpoint from Image 2: high angle, capturing the L-shaped bend, canopy, and pond lawn
    const defaultCamPos = new THREE.Vector3(26, 40, 64);
    const defaultTarget = new THREE.Vector3(8, 6, 2);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);
    cameraRef.current = camera;

    // ── 3. WebGL Renderer ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ── 4. OrbitControls ────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 14;
    controls.maxDistance = 110;
    controls.maxPolarAngle = Math.PI / 2.25;
    controls.minPolarAngle = 0.15;
    controls.target.copy(defaultTarget);
    controlsRef.current = controls;

    // ── 5. Daylight & Architectural Lighting Matching Reference ──
    scene.add(new THREE.AmbientLight(0xdbeafe, 0.9));

    // Sun positioned to cast realistic shadows toward the lower right
    const sun = new THREE.DirectionalLight(0xfffaed, 2.5);
    sun.position.set(55, 85, 42);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 280;
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    sun.shadow.bias = -0.0003;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.7);
    fillLight.position.set(-60, 40, -40);
    scene.add(fillLight);

    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // ══════════════════════════════════════════════════════════════
    //  6. GROUNDS, LAWN, ROADS, CIRCULAR POND & PATHWAYS
    // ══════════════════════════════════════════════════════════════

    // Expansive Green Lawn
    const lawnTex = createLawnTexture();
    const lawnMat = new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 0.85 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), lawnMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    campusGroup.add(ground);

    // Dark Asphalt Drop-off Roadway
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });

    // Main curved driveway loop in front of canopy
    const roadLoop = new THREE.Mesh(new THREE.PlaneGeometry(100, 36), roadMat);
    roadLoop.rotation.x = -Math.PI / 2;
    roadLoop.position.set(10, 0.03, 14);
    roadLoop.receiveShadow = true;
    campusGroup.add(roadLoop);

    // Right curved driveway loop sweeping to the foreground
    const roadRight = new THREE.Mesh(new THREE.PlaneGeometry(28, 55), roadMat);
    roadRight.rotation.x = -Math.PI / 2;
    roadRight.rotation.z = -0.42;
    roadRight.position.set(38, 0.035, 30);
    roadRight.receiveShadow = true;
    campusGroup.add(roadRight);

    // Left access driveway sweeping out
    const roadLeft = new THREE.Mesh(new THREE.PlaneGeometry(20, 60), roadMat);
    roadLeft.rotation.x = -Math.PI / 2;
    roadLeft.rotation.z = 0.55;
    roadLeft.position.set(-36, 0.035, 12);
    roadLeft.receiveShadow = true;
    campusGroup.add(roadLeft);

    // Concrete curbs framing the driveway
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
    const curbBack = new THREE.Mesh(new THREE.BoxGeometry(98, 0.25, 0.6), curbMat);
    curbBack.position.set(10, 0.12, -3.8);
    campusGroup.add(curbBack);

    // Circular Pond / Water Feature on Front-Left Lawn (Exact match to Image 2!)
    const pondCenter = new THREE.Vector3(-14, 0.06, 38);
    const pondRadius = 8.5;

    // Teal water disc
    const waterTex = createWaterTexture();
    const waterMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      roughness: 0.1,
      metalness: 0.35,
      color: 0x0d9488,
    });
    const pondWater = new THREE.Mesh(new THREE.CircleGeometry(pondRadius, 36), waterMat);
    pondWater.rotation.x = -Math.PI / 2;
    pondWater.position.copy(pondCenter);
    campusGroup.add(pondWater);

    // Stone Coping Ring surrounding the pond
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const ringGeom = new THREE.RingGeometry(pondRadius - 0.2, pondRadius + 1.2, 36);
    const pondRing = new THREE.Mesh(ringGeom, ringMat);
    pondRing.rotation.x = -Math.PI / 2;
    pondRing.position.set(pondCenter.x, 0.07, pondCenter.z);
    campusGroup.add(pondRing);

    // Curving Pedestrian Stone Pathways around pond and linking to driveway
    const pathTex = createStonePathTexture();
    const pathMat = new THREE.MeshStandardMaterial({ map: pathTex, roughness: 0.6 });

    const path1 = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 36), pathMat);
    path1.rotation.x = -Math.PI / 2;
    path1.rotation.z = 0.35;
    path1.position.set(-8, 0.05, 24);
    campusGroup.add(path1);

    const path2 = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 28), pathMat);
    path2.rotation.x = -Math.PI / 2;
    path2.rotation.z = -0.55;
    path2.position.set(-22, 0.05, 34);
    campusGroup.add(path2);

    // ══════════════════════════════════════════════════════════════
    //  7. HOSPITAL BUILDING ARCHITECTURE MATCHING IMAGE 2
    // ══════════════════════════════════════════════════════════════
    // The building is an angled chevron / obtuse-angled structure (~130°)
    // with 4 distinct floors, vertical faceted chevron pleat panels,
    // and vertical crimson/red curtain-wall feature bays.

    const chevronTex = createChevronFacadeTexture();
    const chevronMat = new THREE.MeshStandardMaterial({
      map: chevronTex,
      roughness: 0.45,
      metalness: 0.15,
    });

    const roofMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const redCWTex = createRedCurtainWallTexture();
    const redCWMat = new THREE.MeshStandardMaterial({
      map: redCWTex,
      roughness: 0.1,
      metalness: 0.6,
    });

    const buildingH = 18.0; // 4 Floors height (~4.5 units per floor)
    const buildingY = buildingH * 0.5;

    // ── LEFT WING (Angled forward-left ~26°) ────────────────────
    const leftWingGroup = new THREE.Group();
    // Central junction vertex at (0, 0, 0)
    leftWingGroup.position.set(0, 0, 0);
    leftWingGroup.rotation.y = 0.45; // ~26 degrees outward

    const leftWingLen = 38.0;
    const leftWingDepth = 14.0;

    const leftWingMesh = new THREE.Mesh(new THREE.BoxGeometry(leftWingLen, buildingH, leftWingDepth), chevronMat);
    leftWingMesh.position.set(-leftWingLen * 0.5, buildingY, -leftWingDepth * 0.5);
    leftWingMesh.castShadow = true;
    leftWingMesh.receiveShadow = true;
    leftWingGroup.add(leftWingMesh);

    // Left Wing Parapet Top
    const leftParapet = new THREE.Mesh(new THREE.BoxGeometry(leftWingLen + 0.4, 0.8, leftWingDepth + 0.4), roofMat);
    leftParapet.position.set(-leftWingLen * 0.5, buildingH + 0.4, -leftWingDepth * 0.5);
    leftWingGroup.add(leftParapet);

    // Prominent Vertical Red Curtain Wall on Left End Bay (Image 2!)
    const leftRedBay = new THREE.Mesh(new THREE.PlaneGeometry(5.2, buildingH - 0.4), redCWMat);
    leftRedBay.position.set(-leftWingLen + 3.2, buildingY, 0.05);
    leftWingGroup.add(leftRedBay);

    campusGroup.add(leftWingGroup);

    // ── RIGHT WING (Longer wing extending along +X, angled ~8°) ─
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(0, 0, 0);
    rightWingGroup.rotation.y = -0.14; // ~8 degrees

    const rightWingLen = 60.0; // Longer wing as shown in Image 2
    const rightWingDepth = 14.0;

    const rightWingMesh = new THREE.Mesh(new THREE.BoxGeometry(rightWingLen, buildingH, rightWingDepth), chevronMat);
    rightWingMesh.position.set(rightWingLen * 0.5, buildingY, -rightWingDepth * 0.5);
    rightWingMesh.castShadow = true;
    rightWingMesh.receiveShadow = true;
    rightWingGroup.add(rightWingMesh);

    // Right Wing Parapet Top
    const rightParapet = new THREE.Mesh(new THREE.BoxGeometry(rightWingLen + 0.4, 0.8, rightWingDepth + 0.4), roofMat);
    rightParapet.position.set(rightWingLen * 0.5, buildingH + 0.4, -rightWingDepth * 0.5);
    rightWingGroup.add(rightParapet);

    campusGroup.add(rightWingGroup);

    // ── CENTRAL JUNCTION VERTICAL RED CURTAIN WALL (Image 2!) ──
    // Multi-story vertical dark-red glass curtain wall directly above canopy junction
    const centerRedBay = new THREE.Mesh(new THREE.PlaneGeometry(6.4, buildingH - 0.2), redCWMat);
    centerRedBay.position.set(0.2, buildingY, 0.1);
    centerRedBay.rotation.y = 0.15;
    campusGroup.add(centerRedBay);

    // Rooftop Mechanical Penthouse (Set back at rear junction)
    const mechPent = new THREE.Mesh(
      new THREE.BoxGeometry(16, 4.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 })
    );
    mechPent.position.set(-2, buildingH + 2.1, -12);
    mechPent.castShadow = true;
    campusGroup.add(mechPent);

    // ══════════════════════════════════════════════════════════════
    //  8. GRAND ENTRANCE PORTE-COCHÈRE CANOPY (Image 2!)
    // ══════════════════════════════════════════════════════════════
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 0, 0);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
    const canopyH = 4.4;

    // Angled cantilever slab covering entrance drop-off
    const canopySlab = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 16), canopyMat);
    canopySlab.position.set(2.0, canopyH, 5.0);
    canopySlab.rotation.y = 0.12;
    canopySlab.castShadow = true;
    canopyGroup.add(canopySlab);

    // Under-canopy fascia trim
    const canopyTrim = new THREE.Mesh(
      new THREE.BoxGeometry(26.2, 0.25, 16.2),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4 })
    );
    canopyTrim.position.set(2.0, canopyH - 0.2, 5.0);
    canopyTrim.rotation.y = 0.12;
    canopyGroup.add(canopyTrim);

    // Cylindrical Support Pillars (Image 2!)
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
    const pillarGeom = new THREE.CylinderGeometry(0.22, 0.22, canopyH, 16);

    const pillarPositions = [
      [-7.5, 12.0],
      [-1.5, 12.5],
      [5.5, 12.5],
      [12.5, 11.5],
      [-7.5, 0.5],
      [12.5, 0.5],
    ];

    pillarPositions.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(px, canopyH * 0.5, pz);
      pillar.castShadow = true;
      canopyGroup.add(pillar);
    });

    // Raised Entrance Podium & Steps under canopy
    const stepsMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const steps = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 6), stepsMat);
    steps.position.set(1.0, 0.25, 1.5);
    steps.receiveShadow = true;
    canopyGroup.add(steps);

    // Warmly Illuminated Glass Entrance Lobby Doors
    const glassEntrance = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3.8),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0xfffbeb,
        emissiveIntensity: 0.35,
        roughness: 0.1,
      })
    );
    glassEntrance.position.set(1.0, 2.0, 0.15);
    canopyGroup.add(glassEntrance);

    // Under-canopy warm ambient illumination
    const canopyLight = new THREE.PointLight(0xfffbeb, 2.2, 22);
    canopyLight.position.set(2.0, 3.8, 6.0);
    canopyGroup.add(canopyLight);

    // Hospital Entrance Frieze Signboard
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 160;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#0b1322';
    sCtx.fillRect(0, 0, 1024, 160);
    sCtx.strokeStyle = '#0284c7';
    sCtx.lineWidth = 4;
    sCtx.strokeRect(4, 4, 1016, 152);
    sCtx.textAlign = 'center';
    sCtx.font = 'bold 50px "Inter", "Segoe UI", sans-serif';
    sCtx.fillStyle = '#ffffff';
    sCtx.fillText('METROPOLITAN GENERAL HOSPITAL', 512, 68);
    sCtx.font = '600 30px "Inter", sans-serif';
    sCtx.fillStyle = '#38bdf8';
    sCtx.fillText('MAIN ENTRANCE • EMERGENCY & CRITICAL CARE', 512, 120);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 2.2),
      new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    signMesh.position.set(2.0, canopyH + 1.4, 5.0);
    signMesh.rotation.y = 0.12;
    canopyGroup.add(signMesh);

    campusGroup.add(canopyGroup);

    // ══════════════════════════════════════════════════════════════
    //  9. THREE EMERGENCY AMBULANCES (MATCHING IMAGE 2 EXACTLY!)
    // ══════════════════════════════════════════════════════════════

    // Ambulance 1: Parked under left canopy wing
    const amb1 = createAmbulance(-7.2, 7.8, 0.35);
    campusGroup.add(amb1);

    // Ambulance 2: On the curved right driveway loop (heading forward)
    const amb2 = createAmbulance(36.0, 24.0, 2.3);
    campusGroup.add(amb2);

    // Ambulance 3: On the left access driveway
    const amb3 = createAmbulance(-38.0, 9.0, 0.95);
    campusGroup.add(amb3);

    // ══════════════════════════════════════════════════════════════
    //  10. DENSE FLOWERING BUSHES & CANOPY TREES (IMAGE 2!)
    // ══════════════════════════════════════════════════════════════

    // Purple / Magenta Flowering Hedges lining the driveway & pond curves
    const bushPositions = [
      [-10, 16], [-13, 17], [-16, 19], [-19, 22], [-22, 26],
      [-5, 20], [-2, 23], [2, 25], [6, 26], [10, 26],
      [15, 25], [20, 24], [25, 23], [29, 21], [33, 18],
      [22, 29], [26, 32], [30, 35], [34, 38], [38, 42],
      [-6, 32], [-8, 36], [-11, 44], [-17, 47], [-22, 43],
      [-26, 38], [-28, 32], [-25, 26],
      [12, -2.5], [16, -2.5], [20, -2.5], [24, -2.5], [28, -2.5],
      [-18, -2.5], [-22, -2.5], [-26, -2.5], [-30, -2.5],
    ];

    bushPositions.forEach(([bx, bz]) => {
      campusGroup.add(createFloweringBush(bx, bz, 0.75 + Math.random() * 0.35));
    });

    // Organic Leafy Trees positioned exactly as in Image 2:
    // Surrounding the curved loop, framing the pond, and around hospital wings
    const treePositions = [
      // Curved road border trees (foreground & midground)
      [-6, 18, 1.1], [-12, 20, 1.2], [-18, 24, 1.0],
      [18, 22, 1.2], [24, 21, 1.15], [30, 19, 1.3],
      [24, 31, 1.25], [29, 36, 1.1], [35, 42, 1.2], [42, 48, 1.3],
      [48, 36, 1.15], [52, 25, 1.2], [54, 14, 1.25],
      // Pond boundary trees
      [-4, 30, 1.15], [-7, 39, 1.3], [-14, 49, 1.2], [-24, 47, 1.1],
      // Left driveway trees
      [-28, 14, 1.2], [-34, 18, 1.25], [-42, 12, 1.3], [-46, 5, 1.1],
      // Rear building flanking trees
      [-36, -10, 1.3], [-42, -6, 1.2],
      [58, -4, 1.3], [64, 4, 1.2],
    ];

    treePositions.forEach(([tx, tz, ts]) => {
      campusGroup.add(createHospitalTree(tx, tz, ts));
    });

    // ══════════════════════════════════════════════════════════════
    //  11. CLICKABLE INTERACTIVE ENTRANCE BEACON / HOTSPOT
    // ══════════════════════════════════════════════════════════════
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(1.0, 0.4, 7.5);

    const ringMatBeacon = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const beaconRing = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.0, 32), ringMatBeacon);
    beaconRing.rotation.x = -Math.PI / 2;
    beaconGroup.add(beaconRing);

    const beaconCenter = new THREE.Mesh(
      new THREE.CircleGeometry(1.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    beaconCenter.rotation.x = -Math.PI / 2;
    beaconGroup.add(beaconCenter);

    campusGroup.add(beaconGroup);

    // ── Raycaster for clicking entrance ─────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([canopySlab, glassEntrance, beaconRing, beaconCenter, steps], true);

      if (intersects.length > 0) {
        handleEnterHospital();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // ── 12. Animation Loop ──────────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Pulsing beacon ring
      const pulse = Math.sin(elapsed * 3.0) * 0.2 + 0.8;
      beaconRing.scale.set(pulse, pulse, 1);
      ringMatBeacon.opacity = 0.5 + pulse * 0.4;

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // ── 13. Resize Handler ──────────────────────────────────────
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ── 14. Cleanup ────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="scene-3d-container daytime-exterior-container" style={{ width: '100%', height: '100%', borderRadius: 0, border: 'none' }}>
      {/* Top Banner Tag */}
      <div className="scene-3d-label daytime-label">
        <span className="scene-3d-label-icon">🏥</span>
        LEVEL 1 — METROPOLITAN HOSPITAL CAMPUS • 3D ARCHITECTURAL TWIN
      </div>

      {/* 3D Canvas Host Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Primary Floating Action Overlay: Enter Hospital Reception */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 18px',
          background: 'rgba(11, 19, 35, 0.92)',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(12px)',
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
              MAIN HOSPITAL CAMPUS
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              Click Entrance Canopy or button to enter Reception (Level 2)
            </span>
          </div>
        </div>

        <button
          onClick={handleEnterHospital}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.4)';
          }}
        >
          <Building2 size={15} />
          <span>ENTER RECEPTION LOBBY</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Left Feature Card: Campus Overview & 5 Monitored ICU Suites */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          left: '18px',
          background: 'rgba(11, 19, 35, 0.88)',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '12px 16px',
          width: '260px',
          backdropFilter: 'blur(10px)',
          zIndex: 20,
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.04em', marginBottom: '4px' }}>
          HOSPITAL DIGITAL TWIN
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4, marginBottom: '8px' }}>
          Modern 4-story clinical facility with acute care pavilion, emergency porte-cochère, and Level 3 Bio-HVAC surveillance.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Monitored ICU Suites:</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>5 Units Active</span>
        </div>
      </div>
    </div>
  );
}
