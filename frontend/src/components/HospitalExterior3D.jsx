import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ══════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURE GENERATORS FOR HOSPITAL EXTERIOR
// ══════════════════════════════════════════════════════════════════════

/** Sky Dome Texture */
function createSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#0a2342');
  g.addColorStop(0.3, '#1d5a8a');
  g.addColorStop(0.65, '#4fa8d8');
  g.addColorStop(0.85, '#93d2ed');
  g.addColorStop(1, '#cde9f6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Architectural Glass Curtain-Wall Facade Texture */
function createCurtainWallTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0f2438';
  ctx.fillRect(0, 0, 1024, 1024);

  const cols = 8;
  const rows = 12;
  const cw = 1024 / cols;
  const ch = 1024 / rows;
  const pad = 6;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw + pad;
      const y = r * ch + pad;
      const bw = cw - pad * 2;
      const bh = ch - pad * 2;

      // Realistic architectural glass reflection gradient
      const g = ctx.createLinearGradient(x, y, x + bw, y + bh);
      const rand = Math.sin(col * 31 + r * 17);
      if (rand > 0.3) {
        // Daytime sky reflection
        g.addColorStop(0, '#60a5fa');
        g.addColorStop(0.45, '#2563eb');
        g.addColorStop(1, '#1e3a8a');
      } else if (rand > -0.2) {
        // Deep blue tint
        g.addColorStop(0, '#38bdf8');
        g.addColorStop(0.5, '#0284c7');
        g.addColorStop(1, '#0c4a6e');
      } else {
        // Warm office interior glow visible through glass
        g.addColorStop(0, '#fef08a');
        g.addColorStop(0.7, '#d97706');
        g.addColorStop(1, '#451a03');
      }

      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);

      // Dark aluminum frame mullion
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = pad;
      ctx.strokeRect(x, y, bw, bh);

      // Diagonal sun specular glint
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + bw * 0.45, y + 2);
      ctx.lineTo(x + 2, y + bh * 0.45);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** White Architectural Rainscreen Panels */
function createWallPanelTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 512);

  // Panel seams
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  for (let row = 0; row * 64 <= 512; row++) {
    const offset = (row % 2) * 64;
    for (let x = offset; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, row * 64); ctx.lineTo(x, (row + 1) * 64); ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

/** Realistic Asphalt Roadway with Painted Markings */
function createAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  // Dark charcoal asphalt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 1024, 1024);

  // Fine aggregate noise
  for (let i = 0; i < 15000; i++) {
    const val = 20 + Math.random() * 25;
    ctx.fillStyle = `rgba(${val}, ${val + 5}, ${val + 10}, 0.15)`;
    ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
  }

  // Painted parking stall lines (white)
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;

  // Yellow center double divider line
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(508, 0); ctx.lineTo(508, 1024); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(524, 0); ctx.lineTo(524, 1024); ctx.stroke();

  // White zebra pedestrian crossing in front of entrance
  ctx.fillStyle = '#ffffff';
  for (let y = 440; y < 580; y += 24) {
    ctx.fillRect(200, y, 624, 14);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

/** Grass Landscaping Texture */
function createGrassTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#15803d');
  g.addColorStop(1, '#166534');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);

  // Micro blade noise
  for (let i = 0; i < 8000; i++) {
    const gv = 50 + Math.random() * 60;
    ctx.fillStyle = `rgba(${gv * 0.4}, ${gv}, ${gv * 0.3}, 0.25)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 4);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

/** Rooftop Helipad Texture */
function createHelipadTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Outer safety circle
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(256, 256, 210, 0, Math.PI * 2);
  ctx.stroke();

  // White 'H'
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 220px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 256, 266);

  // Red perimeter warning lights
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI * 2) / 12;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(256 + Math.cos(angle) * 230, 256 + Math.sin(angle) * 230, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(c);
}

/** Flush Architectural Signboard Plaque (No billboarding clipping) */
function createFacadePlaque(title, subtitle, w, h, bgHex = '#091528', textHex = '#38bdf8') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.beginPath();
  ctx.roundRect(8, 8, 1008, 240, 16);
  ctx.fill();

  ctx.strokeStyle = textHex;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.textAlign = 'center';
  const maxLen = 940;
  let fontSize = 52;
  ctx.font = `bold ${fontSize}px "Segoe UI", "Rajdhani", sans-serif`;
  while (ctx.measureText(title).width > maxLen && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px "Segoe UI", "Rajdhani", sans-serif`;
  }
  ctx.fillStyle = textHex;
  ctx.fillText(title, 512, 108);

  if (subtitle) {
    let subFontSize = 28;
    ctx.font = `600 ${subFontSize}px "Segoe UI", sans-serif`;
    while (ctx.measureText(subtitle).width > maxLen && subFontSize > 16) {
      subFontSize -= 2;
      ctx.font = `600 ${subFontSize}px "Segoe UI", sans-serif`;
    }
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtitle, 512, 185);
  }

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return mesh;
}

// ══════════════════════════════════════════════════════════════════════
//  DETAILED PROCEDURAL VEHICLES & PROPS
// ══════════════════════════════════════════════════════════════════════

/** Realistic Modern Ambulance */
function createAmbulance(x, z, rotationY) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotationY;

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 });

  // Main chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 5.2), whiteMat);
  body.position.y = 1.3;
  body.castShadow = true;
  g.add(body);

  // Cab hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.0, 1.4), whiteMat);
  hood.position.set(0, 0.9, 2.7);
  hood.castShadow = true;
  g.add(hood);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.1), glassMat);
  windshield.position.set(0, 1.6, 2.0);
  windshield.rotation.x = -0.3;
  g.add(windshield);

  // Red emergency stripes
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.35, 5.2), redMat);
  stripe.position.y = 1.25;
  g.add(stripe);

  // 4 Wheels
  [[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    wheel.castShadow = true;
    g.add(wheel);
  });

  // Flashing Rooftop Lightbar
  const barMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
  const lightBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.4), barMat);
  lightBar.position.set(0, 2.3, 1.8);
  g.add(lightBar);

  const redBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.35), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  redBeacon.position.set(-0.5, 2.45, 1.8);
  g.add(redBeacon);

  const blueBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.35), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  blueBeacon.position.set(0.5, 2.45, 1.8);
  g.add(blueBeacon);

  const sirenLightRed = new THREE.PointLight(0xef4444, 2.0, 10);
  sirenLightRed.position.set(-0.5, 2.8, 1.8);
  g.add(sirenLightRed);

  const sirenLightBlue = new THREE.PointLight(0x3b82f6, 2.0, 10);
  sirenLightBlue.position.set(0.5, 2.8, 1.8);
  g.add(sirenLightBlue);

  g.userData = { sirenLightRed, sirenLightBlue };
  return g;
}

/** Modern Car / SUV */
function createCar(x, z, rotationY, colorHex = 0x0284c7) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotationY;

  const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.95 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.8 });

  // Lower chassis
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 4.4), paintMat);
  body.position.y = 0.65;
  body.castShadow = true;
  g.add(body);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 2.4), paintMat);
  cabin.position.set(0, 1.25, -0.2);
  cabin.castShadow = true;
  g.add(cabin);

  // Windows
  const frontWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.08), glassMat);
  frontWin.position.set(0, 1.25, 0.95);
  frontWin.rotation.x = -0.35;
  g.add(frontWin);

  const backWin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.08), glassMat);
  backWin.position.set(0, 1.25, -1.35);
  backWin.rotation.x = 0.35;
  g.add(backWin);

  // Wheels
  [[-1.05, 1.3], [1.05, 1.3], [-1.05, -1.3], [1.05, -1.3]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16), tireMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.35, wz);
    w.castShadow = true;
    g.add(w);
  });

  return g;
}

/** Realistic Layered Tree */
function createTree(x, z, scale = 1.0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x452a16, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.35 * scale, 3.2 * scale, 12), trunkMat);
  trunk.position.y = 1.6 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  const leafMatDark = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });

  [[0, 3.2, 0, 1.8], [0.3, 4.2, 0.2, 1.5], [-0.2, 5.0, -0.1, 1.2], [0.1, 5.7, 0.1, 0.8]].forEach(([ox, oy, oz, r], i) => {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r * scale, 1), i % 2 === 0 ? leafMat : leafMatDark);
    leaf.position.set(ox * scale, oy * scale, oz * scale);
    leaf.castShadow = true;
    g.add(leaf);
  });

  return g;
}

/** Modern Architectural Streetlight */
function createStreetlight(x, z, rotationY) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotationY;

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.5, 12), poleMat);
  pole.position.y = 3.25;
  pole.castShadow = true;
  g.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), poleMat);
  arm.position.set(0, 6.45, 0.6);
  g.add(arm);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.6), poleMat);
  head.position.set(0, 6.45, 1.2);
  g.add(head);

  const light = new THREE.PointLight(0xfffbeb, 1.8, 18);
  light.position.set(0, 6.1, 1.2);
  g.add(light);

  return g;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: HOSPITAL EXTERIOR 3D (LEVEL 1)
// ══════════════════════════════════════════════════════════════════════

export default function HospitalExterior3D({ rooms, onEnterFloor }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const onEnterFloorRef = useRef(onEnterFloor);
  const isTransitioningRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Ref for ambulance siren animation
  const ambulanceRef = useRef(null);
  const icuGlowRef = useRef(null);

  useEffect(() => {
    onEnterFloorRef.current = onEnterFloor;
  }, [onEnterFloor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene Setup ────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcde9f6, 0.0035);

    // Sky Dome
    const skyTex = createSkyTexture();
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(350, 32, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(sky);

    // ── 2. Camera Setup ───────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 500);
    const defaultCamPos = new THREE.Vector3(38, 24, 52);
    const defaultTarget = new THREE.Vector3(0, 8, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // ── 3. WebGL Renderer ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── 4. OrbitControls ──────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 16;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI / 2.3;
    controls.minPolarAngle = 0.15;
    controls.target.copy(defaultTarget);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.25;

    // ── 5. Daylight & Architectural Sun Lighting ──────────────────
    scene.add(new THREE.AmbientLight(0xdbeafe, 0.75));

    const sun = new THREE.DirectionalLight(0xfffaed, 2.4);
    sun.position.set(65, 95, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 250;
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.bias = -0.0002;
    scene.add(sun);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-50, 30, -40);
    scene.add(fillLight);

    const campusGroup = new THREE.Group();
    scene.add(campusGroup);

    // ── 6. CAMPUS GROUND & ROADWAY ────────────────────────────────

    // Surrounding Green Grass
    const grassTex = createGrassTexture();
    const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.8 });
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    campusGroup.add(grass);

    // Main Drop-Off Roadway & Parking Courtyard
    const roadTex = createAsphaltTexture();
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.65 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(85, 45), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.03, 26);
    road.receiveShadow = true;
    campusGroup.add(road);

    // Concrete Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(85, 0.25, 0.5), curbMat);
    curbL.position.set(0, 0.12, 3.5);
    campusGroup.add(curbL);

    const curbR = new THREE.Mesh(new THREE.BoxGeometry(85, 0.25, 0.5), curbMat);
    curbR.position.set(0, 0.12, 48.5);
    campusGroup.add(curbR);

    // ── 7. MAIN HOSPITAL BUILDINGS ────────────────────────────────
    const wallTex = createWallPanelTexture();
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.35 });

    const glassTex = createCurtainWallTexture();
    const glassFacadeMat = new THREE.MeshStandardMaterial({
      map: glassTex,
      roughness: 0.05,
      metalness: 0.9,
    });

    const spandrelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });

    // Main Center Tower (8 Floors)
    const towerH = 34;
    const towerW = 34;
    const towerD = 22;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), wallMat);
    tower.position.set(0, towerH / 2, -10);
    tower.castShadow = true;
    tower.receiveShadow = true;
    campusGroup.add(tower);

    // Tower Front Curtain Wall (Floor 1 to 8)
    const towerCW = new THREE.Mesh(new THREE.PlaneGeometry(towerW - 4, towerH - 4), glassFacadeMat);
    towerCW.position.set(0, towerH / 2, 1.05);
    campusGroup.add(towerCW);

    // Rooftop Mechanical Penthouse
    const pent = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 12), spandrelMat);
    pent.position.set(5, towerH + 2.25, -10);
    pent.castShadow = true;
    campusGroup.add(pent);

    // Rooftop Helipad
    const helipadTex = createHelipadTexture();
    const helipadMat = new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.5 });
    const helipad = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), helipadMat);
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.set(-6, towerH + 0.1, -10);
    campusGroup.add(helipad);

    // Rooftop Antenna Tower with red beacon light
    const antennaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 8.0, 8), antennaMat);
    antenna.position.set(10, towerH + 8.5, -6);
    campusGroup.add(antenna);

    const beaconLight = new THREE.PointLight(0xef4444, 2.5, 12);
    beaconLight.position.set(10, towerH + 12.5, -6);
    campusGroup.add(beaconLight);

    // West Wing (4 Floors, Patient Wards)
    const westWing = new THREE.Mesh(new THREE.BoxGeometry(18, 16, 20), wallMat);
    westWing.position.set(-23, 8, -6);
    westWing.castShadow = true;
    westWing.receiveShadow = true;
    campusGroup.add(westWing);

    const westCW = new THREE.Mesh(new THREE.PlaneGeometry(16, 13), glassFacadeMat);
    westCW.position.set(-23, 8, 4.05);
    campusGroup.add(westCW);

    // East Wing (Emergency & Trauma Centre, 3 Floors)
    const erWing = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 18), wallMat);
    erWing.position.set(23, 6, -5);
    erWing.castShadow = true;
    erWing.receiveShadow = true;
    campusGroup.add(erWing);

    // Emergency Flush Facade Plaque & Red Canopy
    const erPlaque = createFacadePlaque('EMERGENCY / TRAUMA', 'AMBULANCE BAY • 24/7 ENTRANCE', 12, 1.8, '#1e0505', '#ef4444');
    erPlaque.position.set(23, 10.5, 4.05);
    campusGroup.add(erPlaque);

    const erCanopy = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 6), spandrelMat);
    erCanopy.position.set(23, 6.2, 7.0);
    erCanopy.castShadow = true;
    campusGroup.add(erCanopy);

    // ── 8. LEVEL 3: ICU AIR QUALITY MONITORING WING HIGHLIGHT ─────
    // Modern Architectural Glowing LED Reveal Ribbon along Floor 3 (Y = 12.5)
    const icuRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    });
    const icuRibbon = new THREE.Mesh(new THREE.BoxGeometry(towerW - 3.8, 0.25, 0.4), icuRibbonMat);
    icuRibbon.position.set(0, 14.5, 1.15);
    campusGroup.add(icuRibbon);

    const icuRibbonBot = new THREE.Mesh(new THREE.BoxGeometry(towerW - 3.8, 0.25, 0.4), icuRibbonMat);
    icuRibbonBot.position.set(0, 10.5, 1.15);
    campusGroup.add(icuRibbonBot);

    // Soft architectural cyan wash light across Floor 3
    const icuWash = new THREE.PointLight(0x00f0ff, 2.2, 16);
    icuWash.position.set(0, 12.5, 3.5);
    campusGroup.add(icuWash);
    icuGlowRef.current = icuWash;

    // Flush Facade Hospital Frieze Signboard (Above entrance canopy)
    const mainSign = createFacadePlaque(
      'METROPOLITAN GENERAL HOSPITAL',
      'ACADEMIC MEDICAL CENTER • CRITICAL CARE FACILITY',
      24,
      3.2,
      '#051124',
      '#00f0ff'
    );
    mainSign.position.set(0, 19.5, 1.2);
    campusGroup.add(mainSign);

    // Floor 3 Digital-Twin Identification Plaque (Mounted flush)
    const icuFloorPlaque = createFacadePlaque(
      'LEVEL 3: ICU AIR QUALITY DIGITAL TWIN',
      'REAL-TIME WHO ENVIRONMENTAL MONITORING ARRAY',
      18,
      1.8,
      '#031726',
      '#38bdf8'
    );
    icuFloorPlaque.position.set(0, 12.5, 1.22);
    campusGroup.add(icuFloorPlaque);

    // Red Cross Emblem
    const crossGroup = new THREE.Group();
    crossGroup.position.set(-13, 26, 1.2);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    crossGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.1), crossMat));
    crossGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.1), crossMat));
    campusGroup.add(crossGroup);

    // ── 9. MODERN ENTRANCE PAVILION & DROP-OFF CANOPY ─────────────
    const entranceGroup = new THREE.Group();
    entranceGroup.position.set(0, 0, 5);

    // Cantilevered Architectural Canopy (Dark Composite Panel)
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(26, 0.6, 10), canopyMat);
    canopy.position.set(0, 5.8, 8);
    canopy.castShadow = true;
    entranceGroup.add(canopy);

    // Warm Under-Canopy Recessed Lighting
    const canopyLight = new THREE.PointLight(0xffedd5, 3.0, 20);
    canopyLight.position.set(0, 4.8, 8);
    entranceGroup.add(canopyLight);

    // 4 Brushed Steel Columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    [[-11, 12], [-4, 12], [4, 12], [11, 12]].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5.8, 16), colMat);
      col.position.set(cx, 2.9, cz);
      col.castShadow = true;
      entranceGroup.add(col);
    });

    // Glass Entrance Vestibule (Clear architectural glass with warm interior glow)
    const entryGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.9,
    });
    const vestibule = new THREE.Mesh(new THREE.BoxGeometry(22, 5.2, 6), entryGlassMat);
    vestibule.position.set(0, 2.6, 1);
    entranceGroup.add(vestibule);

    // Warm Interior Lobby Glow visible through entrance glass
    const lobbyWarmGlow = new THREE.PointLight(0xfffaed, 2.5, 18);
    lobbyWarmGlow.position.set(0, 2.5, -2);
    entranceGroup.add(lobbyWarmGlow);

    campusGroup.add(entranceGroup);

    // ── 10. CAMPUS LANDSCAPING, TREES & VEHICLES ──────────────────
    // Parked Ambulance in Emergency Bay
    const amb = createAmbulance(23, 20, Math.PI * 0.48);
    campusGroup.add(amb);
    ambulanceRef.current = amb;

    // Parked Visitor & Doctor Vehicles
    campusGroup.add(createCar(-25, 20, -Math.PI * 0.5, 0x0284c7)); // Blue Sedan
    campusGroup.add(createCar(-18, 20, -Math.PI * 0.5, 0x475569)); // Slate SUV
    campusGroup.add(createCar(-11, 20, -Math.PI * 0.5, 0x0f172a)); // Black Sedan
    campusGroup.add(createCar(8, 38, Math.PI, 0xdc2626)); // Red Compact

    // Trees along perimeter and courtyard
    [
      [-36, 12, 1.2], [-36, 26, 1.1], [-36, 40, 1.3],
      [36, 12, 1.2], [36, 26, 1.1], [36, 40, 1.3],
      [-20, 48, 1.0], [0, 48, 1.2], [20, 48, 1.0],
      [-30, -10, 1.4], [30, -10, 1.4]
    ].forEach(([tx, tz, ts]) => {
      campusGroup.add(createTree(tx, tz, ts));
    });

    // Streetlights along drop-off lane
    campusGroup.add(createStreetlight(-18, 3.2, 0));
    campusGroup.add(createStreetlight(18, 3.2, 0));
    campusGroup.add(createStreetlight(-28, 48.2, Math.PI));
    campusGroup.add(createStreetlight(28, 48.2, Math.PI));

    // ── 11. Interactive Raycasting & Click Navigation ─────────────
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;

    function onMouseDown(e) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
    }

    function onMouseUp(e) {
      if (Math.abs(e.clientX - mouseDownPos.x) > 5 || Math.abs(e.clientY - mouseDownPos.y) > 5) {
        isDragging = true;
      }
    }

    function onMouseMove(e) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects([entranceGroup, tower], true);

      container.style.cursor = (hits.length > 0 && !isTransitioningRef.current) ? 'pointer' : 'default';
    }

    function onClick(e) {
      if (isDragging || isTransitioningRef.current) return;
      triggerLobbyTransition();
    }

    function triggerLobbyTransition() {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;
      controls.autoRotate = false;

      // Cinematic dolly camera zoom directly into the hospital entrance lobby doors
      const startCam = camera.position.clone();
      const endCam = new THREE.Vector3(0, 3.5, 14);
      const startTgt = controls.target.clone();
      const endTgt = new THREE.Vector3(0, 3.0, 0);

      const startTime = performance.now();
      const duration = 1300;

      function animateDolly(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startCam, endCam, ease);
        controls.target.lerpVectors(startTgt, endTgt, ease);
        controls.update();

        if (progress < 1.0) {
          requestAnimationFrame(animateDolly);
        } else {
          if (onEnterFloorRef.current) {
            onEnterFloorRef.current();
          }
        }
      }

      requestAnimationFrame(animateDolly);
    }

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // ── 12. Animation Loop ────────────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      controls.update();

      // Ambulance siren flash alternation
      if (ambulanceRef.current && ambulanceRef.current.userData) {
        const { sirenLightRed, sirenLightBlue } = ambulanceRef.current.userData;
        const flash = Math.sin(time * 12);
        sirenLightRed.intensity = flash > 0 ? 3.5 : 0.2;
        sirenLightBlue.intensity = flash <= 0 ? 3.5 : 0.2;
      }

      // Gentle breathing pulse for Floor 3 ICU environmental ribbon
      if (icuGlowRef.current) {
        icuGlowRef.current.intensity = 2.0 + Math.sin(time * 2.5) * 0.6;
      }

      renderer.render(scene, camera);
    }

    animate();

    // ── 13. Responsive Resize ─────────────────────────────────────
    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // ── 14. Cleanup ───────────────────────────────────────────────
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

      {/* Modern Glassmorphic HUD Badge (Top-Left) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(10, 17, 32, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '12px',
          padding: '12px 20px',
          color: '#ffffff',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🏢</span>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em', color: '#38bdf8' }}>
            LEVEL 1 — METROPOLITAN GENERAL HOSPITAL CAMPUS
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Level 3: ICU Air Quality Monitoring Wing • Architectural BIM Simulation
        </div>
      </div>

      {/* Interactive Call-To-Action Floating Badge (Bottom Center) */}
      <div
        onClick={() => {
          if (onEnterFloorRef.current) onEnterFloorRef.current();
        }}
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.9), rgba(14, 165, 233, 0.95))',
          backdropFilter: 'blur(10px)',
          border: '1px solid #00f0ff',
          borderRadius: '30px',
          padding: '12px 28px',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.5), 0 4px 15px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.25s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 240, 255, 0.8), 0 6px 20px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(-50%) scale(1.0)';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.5), 0 4px 15px rgba(0,0,0,0.4)';
        }}
      >
        <span style={{ fontSize: '16px' }}>🚪</span>
        <span>CLICK ENTRANCE TO ENTER LOBBY ATRIUM →</span>
      </div>

      {/* Navigation Helper Tip (Bottom Right) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          background: 'rgba(10, 17, 32, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px 14px',
          color: '#94a3b8',
          fontSize: '11px',
          pointerEvents: 'none',
        }}
      >
        Left Click + Drag: Orbit Campus • Scroll: Zoom • Right Click: Pan
      </div>
    </div>
  );
}
