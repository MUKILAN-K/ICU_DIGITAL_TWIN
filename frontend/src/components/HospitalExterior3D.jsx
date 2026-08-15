import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ══════════════════════════════════════════════════════════════════════
//  PROCEDURAL TEXTURE GENERATORS
// ══════════════════════════════════════════════════════════════════════

/** Sky gradient sphere texture */
function createSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0,    '#0e2954');
  g.addColorStop(0.35, '#1a5fb4');
  g.addColorStop(0.65, '#4facde');
  g.addColorStop(0.85, '#7ecce8');
  g.addColorStop(1,    '#b8dff0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/** Procedural glass curtain-wall facade */
function createGlassFacadeTexture(seed = 0) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#152d4a';
  ctx.fillRect(0, 0, 1024, 1024);
  const cols = 10, rows = 14;
  const cw = 1024 / cols, ch = 1024 / rows, pad = 8;
  let rng = seed * 9301 + 49297;
  const rand = () => { rng = (rng * 9301 + 49297) % 233280; return rng / 233280; };
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw + pad, y = r * ch + pad;
      const bw = cw - pad * 2, bh = ch - pad * 2;
      const roll = rand();
      let g;
      if (roll < 0.48) {
        g = ctx.createLinearGradient(x, y, x + bw, y + bh);
        g.addColorStop(0, '#93c5fd'); g.addColorStop(0.5, '#3b82f6'); g.addColorStop(1, '#1e40af');
      } else if (roll < 0.70) {
        g = ctx.createLinearGradient(x, y, x + bw, y + bh);
        g.addColorStop(0, '#fef9c3'); g.addColorStop(1, '#b45309');
      } else {
        g = ctx.createLinearGradient(x, y, x + bw, y + bh);
        g.addColorStop(0, '#0c1a2e'); g.addColorStop(1, '#060d1a');
      }
      ctx.fillStyle = g; ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = pad * 0.75;
      ctx.strokeRect(x, y, bw, bh);
      ctx.beginPath(); ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + bw * 0.38, y + 3); ctx.lineTo(x + 3, y + bh * 0.38);
      ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2);
  return tex;
}

/** Concrete/white panel wall cladding */
function createWallCladdingTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#f0f4f8'); bg.addColorStop(1, '#d8e2ec');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512);
  // Panel joints horizontal
  ctx.strokeStyle = '#b0bccc'; ctx.lineWidth = 2.5;
  for (let y = 0; y <= 512; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  // Panel joints vertical (offset per row for realistic brick-bond pattern)
  ctx.lineWidth = 1.5; ctx.strokeStyle = '#c8d4e0';
  for (let row = 0; row * 48 <= 512; row++) {
    const offset = (row % 2) * 64;
    for (let x = offset; x <= 512; x += 128) {
      const y = row * 48;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 48); ctx.stroke();
    }
  }
  // Subtle noise/roughness dots
  for (let i = 0; i < 600; i++) {
    const nx = Math.random() * 512, ny = Math.random() * 512;
    ctx.beginPath(); ctx.arc(nx, ny, Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`; ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 4);
  return tex;
}

/** Concrete spandrel band — dark separator between floors */
function createSpandrelTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, '#9cb3c9'); g.addColorStop(0.5, '#7e96ae'); g.addColorStop(1, '#9cb3c9');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#5d7a93'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(256, 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(256, 60); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 1);
  return tex;
}

/** Asphalt road surface with noise */
function createAsphaltTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a2433'; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 12000; i++) {
    const v = 70 + Math.random() * 60;
    ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${v},${v},${v},0.18)`; ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

/** Concrete plaza / pavement */
function createConcreteTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8d5e0'; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#a8b8c8'; ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  for (let i = 0; i < 1500; i++) {
    const v = 190 + Math.random() * 40;
    ctx.beginPath(); ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${v},${v},${v},0.15)`; ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/** Helipad */
function createHelipadTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f1923'; ctx.fillRect(0, 0, 1024, 1024);
  // Outer ring
  ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 30;
  ctx.beginPath(); ctx.arc(512, 512, 440, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 20;
  ctx.beginPath(); ctx.arc(512, 512, 400, 0, Math.PI * 2); ctx.stroke();
  // H
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 430px "Arial Black", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('H', 512, 540);
  // Edge lights
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(512 + Math.cos(a) * 475, 512 + Math.sin(a) * 475, 14, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#dc2626'; ctx.fill();
  }
  return new THREE.CanvasTexture(c);
}

/** Grass texture */
function createGrassTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#2d7a3a'); g.addColorStop(1, '#1f5c2b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    const gv = 35 + Math.random() * 45;
    ctx.fillStyle = `rgba(${gv},${gv + 30 + Math.random() * 30},${gv},0.22)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 2 + Math.random() * 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}

/** Cloud sprite texture */
function createCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 128);
  const drawPuff = (cx, cy, r) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(240,248,255,0.6)');
    g.addColorStop(1, 'rgba(220,240,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  };
  drawPuff(80, 75, 62); drawPuff(128, 58, 58); drawPuff(176, 72, 52);
  drawPuff(48, 82, 42); drawPuff(210, 82, 40);
  return new THREE.CanvasTexture(c);
}

/** Text sprite */
function createTextSprite(text, color = '#0ea5e9', fontSize = 44, cW = 640, cH = 96) {
  const c = document.createElement('canvas');
  c.width = cW; c.height = cH;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, cW, cH);
  ctx.font = `bold ${fontSize}px "Rajdhani","Segoe UI",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 11;
  ctx.strokeText(text, cW / 2, cH / 2);
  ctx.fillStyle = color; ctx.fillText(text, cW / 2, cH / 2);
  const tex = new THREE.CanvasTexture(c); tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const s = new THREE.Sprite(mat);
  s.scale.set((cW / cH) * 2.8, 2.8, 1);
  return s;
}

// ══════════════════════════════════════════════════════════════════════
//  BUILDING SYSTEM — all 4 faces with architectural depth
// ══════════════════════════════════════════════════════════════════════

/**
 * Builds a hospital block with window reveals on all 4 sides,
 * corner pilasters, spandrel bands, cornice, and a parapet.
 */
function addBuilding(parent, cx, cy, cz, bw, bh, bd, {
  wallMat, spandrelMat, glassTex = null, floors = 4, floorH = 4,
  addCornerPilasters = true, cornerColor = 0xe0e8f0
}) {
  // ── Main box ──────────────────────────────────────────────
  const box = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), wallMat.clone());
  box.position.set(cx, cy, cz);
  box.castShadow = box.receiveShadow = true;
  parent.add(box);

  const baseY = cy - bh / 2;

  // ── Spandrel (dark separator) at each floor boundary ──────
  for (let f = 1; f < floors; f++) {
    const sy = baseY + f * floorH;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.3, 0.45, bd + 0.3), spandrelMat.clone());
    sp.position.set(cx, sy, cz);
    parent.add(sp);
  }

  // ── Cornice / roof overhang ───────────────────────────────
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.9, 0.4, bd + 0.9), wallMat.clone());
  cornice.position.set(cx, cy + bh / 2 + 0.2, cz);
  cornice.castShadow = true; parent.add(cornice);

  // ── Parapet ───────────────────────────────────────────────
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, 0.85, bd + 0.5),
    new THREE.MeshStandardMaterial({ color: 0xe8eff6, roughness: 0.35 }));
  parapet.position.set(cx, cy + bh / 2 + 0.62, cz);
  parent.add(parapet);

  // ── Corner pilasters (vertical depth strips) ──────────────
  if (addCornerPilasters) {
    const pilMat = new THREE.MeshStandardMaterial({ color: cornerColor, roughness: 0.28 });
    const pilW = 1.2, pilD = 0.55;
    [
      [cx - bw / 2 - pilW / 2 + 0.3, cz - bd / 2 - pilD / 2 + 0.2],
      [cx + bw / 2 + pilW / 2 - 0.3, cz - bd / 2 - pilD / 2 + 0.2],
      [cx - bw / 2 - pilW / 2 + 0.3, cz + bd / 2 + pilD / 2 - 0.2],
      [cx + bw / 2 + pilW / 2 - 0.3, cz + bd / 2 + pilD / 2 - 0.2],
    ].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(pilW, bh + 0.8, pilD), pilMat.clone());
      pil.position.set(px, cy, pz);
      pil.castShadow = true; parent.add(pil);
    });
  }

  // ── Window geometry on all 4 faces ───────────────────────
  const winW = 1.85, winH = floorH * 0.5, winReveal = 0.14;
  const wGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1a6ea8, emissive: 0x0a2f55, emissiveIntensity: 0.45,
    transparent: true, opacity: 0.88, roughness: 0.03, metalness: 0.95
  });
  const wFrameMat = new THREE.MeshStandardMaterial({ color: 0x3a5268, metalness: 0.85, roughness: 0.2 });
  const wSillMat = new THREE.MeshStandardMaterial({ color: 0xd8e4f0, roughness: 0.4 });

  const addWinFace = (faceW, faceH, faceNormal, faceCenter) => {
    if (glassTex) {
      // Full curtain-wall on this face
      const cwMat = new THREE.MeshStandardMaterial({
        color: 0x1e6fa8, map: glassTex,
        emissive: 0x0a2b55, emissiveIntensity: 0.28,
        transparent: true, opacity: 0.93, roughness: 0.03, metalness: 0.92
      });
      const cw = new THREE.Mesh(new THREE.BoxGeometry(faceW - 1.8, faceH - 1.2, 0.38), cwMat);
      cw.position.copy(faceCenter); parent.add(cw);
      // Mullion columns
      const mMat = new THREE.MeshStandardMaterial({ color: 0x2d4a65, metalness: 0.9 });
      const colCnt = Math.max(2, Math.floor((faceW - 1.8) / 3.2));
      for (let i = 0; i <= colCnt; i++) {
        const mx = (faceW - 1.8) * (i / colCnt) - (faceW - 1.8) / 2;
        const mv = new THREE.Mesh(new THREE.BoxGeometry(0.12, faceH - 1.1, 0.45), mMat);
        mv.position.set(faceCenter.x + mx * faceNormal.z, faceCenter.y, faceCenter.z + mx * faceNormal.x);
        parent.add(mv);
      }
      // Mullion rows
      for (let f = 0; f < floors; f++) {
        const my = baseY + f * floorH + floorH / 2;
        const mh = new THREE.Mesh(new THREE.BoxGeometry(faceW - 1.7, 0.1, 0.45), mMat);
        mh.position.set(faceCenter.x, my, faceCenter.z); parent.add(mh);
      }
      glassTex = null; // only first face gets curtain wall
      return;
    }
    const colCnt = Math.max(1, Math.floor((faceW - 2.5) / 3.2));
    for (let f = 0; f < floors; f++) {
      const wy = baseY + f * floorH + floorH * 0.52;
      for (let ci = 0; ci < colCnt; ci++) {
        const t = colCnt > 1 ? ci / (colCnt - 1) : 0.5;
        const wx = (faceW - 3.0) * (t - 0.5);
        // Frame (recessed into wall)
        const frame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.22, winH + 0.22, 0.08), wFrameMat.clone());
        frame.position.set(
          faceCenter.x + wx * faceNormal.z,
          wy,
          faceCenter.z + wx * faceNormal.x
        );
        parent.add(frame);
        // Glass pane (slightly recessed)
        const glass = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, winReveal), wGlassMat.clone());
        glass.position.set(
          faceCenter.x + wx * faceNormal.z + faceNormal.x * 0.06,
          wy,
          faceCenter.z + wx * faceNormal.x + faceNormal.z * 0.06
        );
        parent.add(glass);
        // Window sill (protrudes slightly)
        const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.4, 0.1, 0.28), wSillMat.clone());
        sill.position.set(
          faceCenter.x + wx * faceNormal.z + faceNormal.x * 0.1,
          wy - winH / 2 - 0.08,
          faceCenter.z + wx * faceNormal.x + faceNormal.z * 0.1
        );
        parent.add(sill);
      }
    }
  };

  const d2 = 0.22;
  // Front face (Z+)
  addWinFace(bw, bh, { x: 0, z: 1 }, new THREE.Vector3(cx, cy, cz + bd / 2 + d2));
  // Back face (Z-)
  addWinFace(bw, bh, { x: 0, z: -1 }, new THREE.Vector3(cx, cy, cz - bd / 2 - d2));
  // Left face (X-)
  addWinFace(bd, bh, { x: -1, z: 0 }, new THREE.Vector3(cx - bw / 2 - d2, cy, cz));
  // Right face (X+)
  addWinFace(bd, bh, { x: 1, z: 0 }, new THREE.Vector3(cx + bw / 2 + d2, cy, cz));

  return box;
}

// ══════════════════════════════════════════════════════════════════════
//  ENVIRONMENT OBJECTS
// ══════════════════════════════════════════════════════════════════════

/** Realistic multi-foliage tree */
function createTree(x, z, scale = 1.0) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3318, roughness: 0.98 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.26 * scale, 2.8 * scale, 12), trunkMat);
  trunk.position.y = 1.4 * scale; trunk.castShadow = true; g.add(trunk);
  // Root flare
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.35 * scale, 0.4 * scale, 10), trunkMat);
  flare.position.y = 0.2 * scale; g.add(flare);
  const colours = [0x1a6b35, 0x1c7a3c, 0x22a050, 0x28c25e, 0x34d468];
  [[0, 3.0, 0, 1.6], [0.25, 3.75, 0.1, 1.22], [-0.18, 4.45, -0.08, 0.95], [0.1, 5.05, 0.06, 0.72], [0, 5.5, 0, 0.5]].forEach(([ox, oy, oz, r], i) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 10, 8), new THREE.MeshStandardMaterial({ color: colours[i], roughness: 0.78 }));
    leaf.position.set(ox * scale, oy * scale, oz * scale); leaf.castShadow = true; g.add(leaf);
  });
  return g;
}

/** Topiary / formal shaped shrub */
function createShrub(x, z, type = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x0f4d24, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x1a6b35, roughness: 0.75 }),
  ];
  if (type === 0) {
    // Sphere topiary
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), mats[0]);
    b.scale.y = 0.82; b.position.y = 0.5; b.castShadow = true; g.add(b);
  } else {
    // Box topiary
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), mats[1]);
    b.position.y = 0.4; b.castShadow = true; g.add(b);
  }
  return g;
}

/** Street lamp with glow cone */
function createStreetLamp(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x546880, metalness: 0.88, roughness: 0.18 });
  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 7.5, 10), poleMat);
  pole.position.y = 3.75; pole.castShadow = true; g.add(pole);
  // Arm
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), poleMat);
  arm.rotation.z = Math.PI / 2; arm.position.set(0.8, 7.35, 0); g.add(arm);
  // Head housing
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.44), new THREE.MeshStandardMaterial({ color: 0x2a3c50, metalness: 0.9 }));
  head.position.set(1.6, 7.32, 0); g.add(head);
  // Lens (emissive)
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.18), new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef3c7, emissiveIntensity: 2.0 }));
  lens.rotation.x = Math.PI / 2; lens.position.set(1.6, 7.2, 0); g.add(lens);
  // Light
  const glow = new THREE.PointLight(0xfef3c7, 1.8, 18);
  glow.position.set(1.6, 7.0, 0); g.add(glow);
  return g;
}

/** Flagpole with waving flag */
function createFlagpole(x, z, flagColor = 0xdc2626) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, metalness: 0.97, roughness: 0.04 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 12, 12), poleMat);
  pole.position.y = 6; g.add(pole);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.97 }));
  ball.position.y = 12.1; g.add(ball);
  const flagGeo = new THREE.PlaneGeometry(2.5, 1.35, 20, 12);
  const flagMat = new THREE.MeshStandardMaterial({ color: flagColor, side: THREE.DoubleSide, roughness: 0.72 });
  const flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(1.25, 11.2, 0); g.add(flag);
  const cMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.85), cMat);
  cv.position.set(1.25, 11.2, 0.03); g.add(cv);
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.2), cMat);
  ch.position.set(1.25, 11.2, 0.03); g.add(ch);
  return { group: g, flag };
}

/** Realistic detailed car */
function createCar(x, z, rotY, color) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
  const bodyMat = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0d1829, transparent: true, opacity: 0.78, metalness: 0.6, roughness: 0.04 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f1520, roughness: 0.9 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xbccdd8, metalness: 0.98, roughness: 0.06 });

  const lBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.54, 4.5), bodyMat);
  lBody.position.y = 0.48; lBody.castShadow = true; g.add(lBody);
  const uBody = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.6, 2.52), bodyMat);
  uBody.position.set(0, 1.2, -0.1); uBody.castShadow = true; g.add(uBody);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.07, 2.28), bodyMat);
  roof.position.set(0, 1.53, -0.1); g.add(roof);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.1, 1.0), bodyMat);
  hood.rotation.x = 0.17; hood.position.set(0, 0.8, 1.58); g.add(hood);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.09, 0.65), bodyMat);
  trunk.rotation.x = -0.14; trunk.position.set(0, 0.8, -1.82); g.add(trunk);

  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.3, 0.17), darkMat);
  bumperF.position.set(0, 0.34, 2.34); g.add(bumperF);
  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.3, 0.17), darkMat);
  bumperR.position.set(0, 0.34, -2.34); g.add(bumperR);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.09, 0.06), chromeMat);
  grille.position.set(0, 0.36, 2.43); g.add(grille);

  const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef9c3, emissiveIntensity: 0.5 });
  [[-0.7, 0.61, 2.27], [0.7, 0.61, 2.27]].forEach(([hx, hy, hz]) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.06), hlMat);
    hl.position.set(hx, hy, hz); g.add(hl);
  });
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, emissive: 0xb91c1c, emissiveIntensity: 0.4 });
  [[-0.7, 0.61, -2.27], [0.7, 0.61, -2.27]].forEach(([tx, ty, tz]) => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.06), tlMat);
    tl.position.set(tx, ty, tz); g.add(tl);
  });
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.52), glassMat);
  ws.rotation.x = -0.32; ws.position.set(0, 1.28, 1.18); g.add(ws);
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.48), glassMat);
  rw.rotation.x = 0.28; rw.position.set(0, 1.26, -1.36); g.add(rw);
  [[-0.93, 1.28, -0.1], [0.93, 1.28, -0.1]].forEach(([swx, swy, swz]) => {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.48), glassMat);
    sw.rotation.y = Math.PI / 2; sw.position.set(swx, swy, swz); g.add(sw);
  });

  const wGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.21, 18);
  const rGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.22, 10);
  [[-1.1, 0.33, 1.35], [1.1, 0.33, 1.35], [-1.1, 0.33, -1.35], [1.1, 0.33, -1.35]].forEach(([wx, wy, wz]) => {
    const wh = new THREE.Mesh(wGeo, darkMat.clone()); wh.rotation.z = Math.PI / 2; wh.position.set(wx, wy, wz); wh.castShadow = true; g.add(wh);
    const rim = new THREE.Mesh(rGeo, chromeMat.clone()); rim.rotation.z = Math.PI / 2; rim.position.set(wx + (wx < 0 ? -0.01 : 0.01), wy, wz); g.add(rim);
  });
  [[-1.1, 1.03, 0.82], [1.1, 1.03, 0.82]].forEach(([mx, my, mz]) => {
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.2), new THREE.MeshStandardMaterial({ color: 0x2a3c4e, metalness: 0.7 }));
    mir.position.set(mx, my, mz); g.add(mir);
  });
  return g;
}

/** Realistic ambulance */
function createAmbulance() {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf7fafc, roughness: 0.12, metalness: 0.06 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc81c1c });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0c1520, metalness: 0.72, roughness: 0.1 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xc0d0dc, metalness: 0.97, roughness: 0.07 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.95, 5.5), whiteMat);
  body.position.y = 1.3; body.castShadow = true; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.32, 1.4, 1.68), whiteMat);
  cab.position.set(0, 1.55, 2.9); cab.castShadow = true; g.add(cab);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.88, 0.88), darkMat.clone());
  ws.rotation.x = 0.21; ws.position.set(0, 1.96, 3.82); g.add(ws);
  const wsFrame = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.0, 0.06), chromeMat);
  wsFrame.rotation.x = 0.21; wsFrame.position.set(0, 1.96, 3.8); g.add(wsFrame);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.5, 5.5), redMat);
  stripe.position.set(0, 0.88, 0); g.add(stripe);
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.26, 0.2), chromeMat);
  bumperF.position.set(0, 0.38, 3.88); g.add(bumperF);
  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.26, 0.2), chromeMat);
  bumperR.position.set(0, 0.38, -3.88); g.add(bumperR);
  const hlMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, emissive: 0xfef9c3, emissiveIntensity: 0.7 });
  [[-0.76, 1.16, 3.82], [0.76, 1.16, 3.82]].forEach(([hx, hy, hz]) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.23, 0.06), hlMat);
    hl.position.set(hx, hy, hz); g.add(hl);
  });
  // Cross
  const cMat = new THREE.MeshStandardMaterial({ color: 0xc81c1c });
  const cv = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.72), cMat); cv.rotation.y = Math.PI / 2; cv.position.set(-1.17, 1.6, 0); g.add(cv);
  const ch = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.2), cMat); ch.rotation.y = Math.PI / 2; ch.position.set(-1.17, 1.6, 0); g.add(ch);
  // Siren bar
  const sirenBarMat = new THREE.MeshStandardMaterial({ color: 0x0d1520, metalness: 0.92 });
  const sirenBar = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.19, 0.54), sirenBarMat);
  sirenBar.position.set(0, 2.3, 2.9); g.add(sirenBar);
  [[-0.7, 0.9], [-0.24, 0.24], [0.24, 0.9], [0.7, 0.24]].forEach(([lx], i) => {
    const lMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xef4444 : 0x3b82f6, emissive: i % 2 === 0 ? 0xef4444 : 0x3b82f6, emissiveIntensity: 0.5 });
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.5), lMat);
    l.position.set(lx, 2.41, 2.9); g.add(l);
  });
  // Wheels
  const wGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.23, 18);
  const rGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.24, 10);
  [[-1.2, 0.39, 1.78], [1.2, 0.39, 1.78], [-1.2, 0.39, -1.78], [1.2, 0.39, -1.78]].forEach(([wx, wy, wz]) => {
    const wh = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92 }));
    wh.rotation.z = Math.PI / 2; wh.position.set(wx, wy, wz); wh.castShadow = true; g.add(wh);
    const rim = new THREE.Mesh(rGeo, chromeMat.clone()); rim.rotation.z = Math.PI / 2; rim.position.set(wx + (wx < 0 ? -0.01 : 0.01), wy, wz); g.add(rim);
  });
  const redLight = new THREE.PointLight(0xff2222, 0, 20); redLight.position.set(-0.7, 2.7, 2.9); g.add(redLight);
  const blueLight = new THREE.PointLight(0x4488ff, 0, 20); blueLight.position.set(0.7, 2.7, 2.9); g.add(blueLight);
  return { group: g, redLight, blueLight };
}

/** Medical helicopter */
function createHelicopter() {
  const g = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.82, roughness: 0.12 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x0c1520, roughness: 0.04 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xaabbc8, metalness: 0.98, roughness: 0.05 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.44, 20, 14), yellowMat);
  body.scale.set(1.1, 0.87, 1.88); body.position.y = 1.42; body.castShadow = true; g.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.16, 18, 12), darkMat);
  cockpit.scale.set(1.0, 0.76, 0.84); cockpit.position.set(0, 1.35, 1.12); g.add(cockpit);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.19, 0.18), redMat);
  stripe.position.set(0, 1.18, 0); g.add(stripe);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.37, 3.9, 10), yellowMat);
  tail.rotation.x = Math.PI / 2; tail.position.set(0, 1.62, -2.88); tail.castShadow = true; g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.88), yellowMat);
  fin.position.set(0, 2.32, -4.58); g.add(fin);
  // Landing skids
  [[-0.9, 1], [0.9, -1]].forEach(([sx, dir]) => {
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 7), chromeMat);
    s1.rotation.z = 0.35 * dir; s1.position.set(sx, 0.6, 1.0); g.add(s1);
    const s2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.05, 7), chromeMat);
    s2.rotation.z = 0.35 * dir; s2.position.set(sx, 0.6, -0.85); g.add(s2);
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.9, 7), chromeMat);
    sk.rotation.z = Math.PI / 2; sk.position.set(sx * (dir > 0 ? 1.05 : -1.05), 0.1, 0.1); g.add(sk);
  });
  const rotorGroup = new THREE.Group(); rotorGroup.position.set(0, 2.72, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.88 });
  rotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.04, 7.2), bladeMat));
  rotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.04, 0.19), bladeMat));
  g.add(rotorGroup);
  const tailRotorGroup = new THREE.Group(); tailRotorGroup.position.set(0.3, 1.9, -4.58);
  tailRotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 1.22), bladeMat));
  tailRotorGroup.add(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.03, 0.1), bladeMat));
  g.add(tailRotorGroup);
  return { group: g, rotorGroup, tailRotorGroup };
}

/** Column */
function createColumn(x, z, h = 5.5) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const mat = new THREE.MeshStandardMaterial({ color: 0xecf2f8, roughness: 0.28 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, h, 16), mat);
  col.position.y = h / 2; col.castShadow = true; g.add(col);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.78), mat); cap.position.y = h + 0.14; g.add(cap);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.78), mat); base.position.y = 0.1; g.add(base);
  return g;
}

/** Bench */
function createBench(x, z, rotY = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
  const wMat = new THREE.MeshStandardMaterial({ color: 0x8b5e3c, roughness: 0.85 });
  const mMat = new THREE.MeshStandardMaterial({ color: 0x546880, metalness: 0.82 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.1, 0.48), wMat); seat.position.y = 0.5; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.52, 0.07), wMat); back.position.set(0, 0.83, -0.21); g.add(back);
  [[-0.72, 0], [0.72, 0]].forEach(([lx]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 7), mMat); l.position.set(lx, 0.25, 0); g.add(l); });
  return g;
}

/** Planter box */
function createPlanter(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const cMat = new THREE.MeshStandardMaterial({ color: 0x7a94a8, roughness: 0.85 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.6, 1.12), cMat); box.position.y = 0.3; box.castShadow = true; g.add(box);
  const soil = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.92), new THREE.MeshStandardMaterial({ color: 0x4a2c12, roughness: 1.0 })); soil.position.y = 0.6; g.add(soil);
  const plant = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1a7c38, roughness: 0.75 })); plant.scale.y = 1.22; plant.position.y = 1.1; g.add(plant);
  return g;
}

/** Curb strip */
function createCurb(parent, x, z, len, rot, mat) {
  const c = new THREE.Mesh(new THREE.BoxGeometry(len, 0.14, 0.28), mat);
  c.position.set(x, 0.07, z); c.rotation.y = rot;
  parent.add(c);
}

/** Pedestrian silhouette */
function createPedestrian(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const m = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.88, 8), m); body.position.y = 1.08; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 9, 7), m); head.position.y = 1.68; g.add(head);
  return g;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function HospitalExterior3D({ rooms, onEnterFloor }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const onEnterFloorRef = useRef(onEnterFloor);
  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);

  useEffect(() => { onEnterFloorRef.current = onEnterFloor; }, [onEnterFloor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ──────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xb8d8e8, 0.0038);

    // ── Sky Dome ───────────────────────────────────────────────────
    const skyTex = createSkyTexture();
    const skyGeo = new THREE.SphereGeometry(350, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide });
    skyMat.map.wrapS = THREE.RepeatWrapping;
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Procedural clouds
    const cloudTex = createCloudTexture();
    const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.88, depthWrite: false });
    [
      [80, 90, -120, 28, 12], [-100, 85, -80, 22, 9], [30, 105, 160, 32, 13],
      [-60, 88, 140, 24, 10], [140, 92, 20, 26, 11], [-140, 82, -10, 20, 8]
    ].forEach(([cx, cy, cz, sw, sh]) => {
      const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.82, depthWrite: false }));
      cl.position.set(cx, cy, cz); cl.scale.set(sw, sh, 1);
      scene.add(cl);
    });

    // ── Camera ─────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(46, container.clientWidth / container.clientHeight, 0.1, 600);
    const defaultCamPos = new THREE.Vector3(40, 26, 55);
    const defaultTarget = new THREE.Vector3(0, 9, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // ── Renderer ───────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    container.appendChild(renderer.domElement);

    // ── Controls ───────────────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.minDistance = 18; controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2.35;
    controls.minPolarAngle = 0.12;
    controls.target.copy(defaultTarget);
    controls.autoRotate = true; controls.autoRotateSpeed = 0.22;

    // ── Lighting ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xd0e8f8, 0.72));

    const sun = new THREE.DirectionalLight(0xfff5e0, 2.4);
    sun.position.set(70, 100, 55);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096; sun.shadow.mapSize.height = 4096;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 300;
    sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
    sun.shadow.bias = -0.00015;
    scene.add(sun);

    // Fill — opposite side, cooler blue
    const fill = new THREE.DirectionalLight(0x9ec8e8, 0.52);
    fill.position.set(-55, 28, -45); scene.add(fill);

    // Sky hemisphere
    scene.add(new THREE.HemisphereLight(0x88c4e0, 0x2a6e35, 0.48));

    // ── Textures ───────────────────────────────────────────────────
    const wallTex    = createWallCladdingTexture();
    const spandrelTx = createSpandrelTexture();
    const glassTex   = createGlassFacadeTexture(42);
    const asphaltTx  = createAsphaltTexture();
    const concreteTx = createConcreteTexture();
    const grassTx    = createGrassTexture();

    const wallMat     = new THREE.MeshStandardMaterial({ color: 0xf2f6fa, map: wallTex, roughness: 0.26, metalness: 0.04 });
    const spandrelMat = new THREE.MeshStandardMaterial({ color: 0x8ca0b8, map: spandrelTx, roughness: 0.6, metalness: 0.18 });
    const asphaltMat  = new THREE.MeshStandardMaterial({ color: 0x1e2d3e, map: asphaltTx, roughness: 0.94 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xc8d5e0, map: concreteTx, roughness: 0.7 });
    const grassMat    = new THREE.MeshStandardMaterial({ color: 0x2e7a38, map: grassTx, roughness: 0.92 });
    const curbMat     = new THREE.MeshStandardMaterial({ color: 0xc0cdd8, roughness: 0.75 });

    // ══════════════════════════════════════════════════════
    //  ENVIRONMENT — Ground, Roads, Parking, Trees
    // ══════════════════════════════════════════════════════
    const envGroup = new THREE.Group(); scene.add(envGroup);

    // Grass base
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), grassMat);
    lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; envGroup.add(lawn);

    // Entrance plaza (concrete)
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(42, 24), concreteMat);
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, 0.02, 4); plaza.receiveShadow = true; envGroup.add(plaza);

    // Plaza curbs
    [[0, -7.98, 42, 0], [0, 15.98, 42, 0], [-20.98, 4, 24, Math.PI / 2], [20.98, 4, 24, Math.PI / 2]].forEach(([cx, cz, l, r]) => createCurb(envGroup, cx, cz, l, r, curbMat));

    // Main entrance driveway (Z-aligned, straight)
    const driveway = new THREE.Mesh(new THREE.PlaneGeometry(14, 50), asphaltMat);
    driveway.rotation.x = -Math.PI / 2; driveway.position.set(3, 0.03, 20); driveway.receiveShadow = true; envGroup.add(driveway);

    // Driveway curbs
    [[-3.98, 20, 50, Math.PI / 2], [9.98, 20, 50, Math.PI / 2]].forEach(([cx, cz, l, r]) => createCurb(envGroup, cx, cz, l, r, curbMat));

    // Driveway centre line
    const cLine = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 49), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
    cLine.rotation.x = -Math.PI / 2; cLine.position.set(3, 0.05, 20); envGroup.add(cLine);

    // Zebra crossing
    const zebraMat = new THREE.MeshBasicMaterial({ color: 0xf0f4f8 });
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 5.5), zebraMat);
      s.rotation.x = -Math.PI / 2; s.position.set(-7 + i * 1.85, 0.05, 12); envGroup.add(s);
    }

    // Roundabout
    const roundRing = new THREE.Mesh(new THREE.RingGeometry(7.2, 11, 52), asphaltMat);
    roundRing.rotation.x = -Math.PI / 2; roundRing.position.set(3, 0.03, 38); envGroup.add(roundRing);
    const island = new THREE.Mesh(new THREE.CircleGeometry(7.1, 52), grassMat);
    island.rotation.x = -Math.PI / 2; island.position.set(3, 0.04, 38); envGroup.add(island);
    // Roundabout curb
    const rcurbGeo = new THREE.TorusGeometry(7.15, 0.14, 8, 52);
    const rcurb = new THREE.Mesh(rcurbGeo, curbMat); rcurb.rotation.x = -Math.PI / 2; rcurb.position.set(3, 0.14, 38); envGroup.add(rcurb);

    // Fountain
    const fountMat = new THREE.MeshStandardMaterial({ color: 0xe0eaf2, roughness: 0.44 });
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.85, 0.42, 22), fountMat); fBase.position.set(3, 0.21, 38); envGroup.add(fBase);
    const fCol = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.85, 14), fountMat); fCol.position.set(3, 1.63, 38); envGroup.add(fCol);
    const fTop = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 12), fountMat); fTop.position.set(3, 3.2, 38); envGroup.add(fTop);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, roughness: 0.06, metalness: 0.1 });
    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), waterMat); waterDisc.rotation.x = -Math.PI / 2; waterDisc.position.set(3, 0.46, 38); envGroup.add(waterDisc);
    // Fountain glow
    const fountainLight = new THREE.PointLight(0x38bdf8, 1.2, 10); fountainLight.position.set(3, 1.0, 38); envGroup.add(fountainLight);

    // Left parking lot
    const parkL = new THREE.Mesh(new THREE.PlaneGeometry(30, 24), asphaltMat);
    parkL.rotation.x = -Math.PI / 2; parkL.position.set(-28, 0.02, 25); parkL.receiveShadow = true; envGroup.add(parkL);
    [[-42, 14, 30, Math.PI / 2], [-14, 14, 30, Math.PI / 2], [-28, 3, 30, 0], [-28, 25, 30, 0]].forEach(([cx, cz, l, r]) => createCurb(envGroup, cx, cz, l, r, curbMat));

    // Right parking lot
    const parkR = new THREE.Mesh(new THREE.PlaneGeometry(22, 24), asphaltMat);
    parkR.rotation.x = -Math.PI / 2; parkR.position.set(29, 0.02, 25); parkR.receiveShadow = true; envGroup.add(parkR);
    [[18, 25, 24, Math.PI / 2], [40, 25, 24, Math.PI / 2], [29, 14, 22, 0], [29, 36, 22, 0]].forEach(([cx, cz, l, r]) => createCurb(envGroup, cx, cz, l, r, curbMat));

    // Parking stall lines
    const slMat = new THREE.MeshBasicMaterial({ color: 0xd8e4ef });
    const addStallLines = (xArr, zArr) => {
      xArr.forEach(xi => zArr.forEach(zi => {
        const l = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 5.4), slMat);
        l.rotation.x = -Math.PI / 2; l.position.set(xi, 0.04, zi); envGroup.add(l);
      }));
    };
    addStallLines([-42, -36, -30, -24, -18], [13, 29]);
    addStallLines([18, 24, 30, 36], [13, 29]);

    // Disabled parking bays (blue)
    const disMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const disBox = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 5.4), disMat);
    disBox.rotation.x = -Math.PI / 2; disBox.position.set(-14.5, 0.04, 13); envGroup.add(disBox);

    // Emergency bay asphalt
    const bayAsph = new THREE.Mesh(new THREE.PlaneGeometry(12, 30), asphaltMat);
    bayAsph.rotation.x = -Math.PI / 2; bayAsph.position.set(-20, 0.02, 12); bayAsph.receiveShadow = true; envGroup.add(bayAsph);
    const bayRedMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });
    const bayLine = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.3), bayRedMat);
    bayLine.rotation.x = -Math.PI / 2; bayLine.position.set(-20, 0.05, 5); envGroup.add(bayLine);
    const bayLine2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.3), bayRedMat);
    bayLine2.rotation.x = -Math.PI / 2; bayLine2.position.set(-20, 0.05, 22); envGroup.add(bayLine2);

    // Perimeter fence & gate posts
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x7a95ab, metalness: 0.72 });
    for (let xi = -70; xi <= 70; xi += 8) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.17, 2.0, 0.17), fenceMat);
      p.position.set(xi, 1.0, -52); envGroup.add(p);
    }
    ['a','b'].forEach((_, r) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(144, 0.09, 0.09), fenceMat);
      rail.position.set(0, r === 0 ? 1.55 : 0.8, -52); envGroup.add(rail);
    });

    // Gate posts (grand entrance)
    [[-10, -52], [10, -52]].forEach(([gpx, gpz]) => {
      const gpost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), new THREE.MeshStandardMaterial({ color: 0xe0eaf2, roughness: 0.35 }));
      gpost.position.set(gpx, 1.6, gpz); envGroup.add(gpost);
      const gball = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 }));
      gball.position.set(gpx, 3.35, gpz); envGroup.add(gball);
    });

    // Trees — varied sizes and positions
    [
      [-48, 14, 1.2], [-42, 38, 1.05], [-34, 46, 1.3], [-24, 50, 0.9],
      [26, 48, 1.1], [36, 42, 1.22], [46, 18, 1.05],
      [-42, -18, 1.0], [42, -18, 0.95], [-34, 0, 0.88], [34, 0, 0.92],
      [-56, 28, 1.12], [55, 28, 1.18], [-52, 6, 0.9], [52, 6, 1.02],
      [-12, 48, 0.95], [12, 46, 0.98], [0, 50, 1.08],
      [-60, -30, 1.0], [60, -30, 1.05], [0, -45, 0.95],
    ].forEach(([tx, tz, sc]) => envGroup.add(createTree(tx, tz, sc)));

    // Shrubs alternating along plaza
    for (let xi = -16; xi <= 16; xi += 3.2) envGroup.add(createShrub(xi, -7.2, xi % 6 === 0 ? 1 : 0));

    // Shrubs along right side of driveway
    for (let zi = 8; zi <= 30; zi += 4) envGroup.add(createShrub(10.5, zi, 0));

    // Benches
    [[-9, 5, 0], [9, 5, Math.PI], [-15, 3, Math.PI / 2], [15, 3, -Math.PI / 2]].forEach(([bx, bz, ry]) => envGroup.add(createBench(bx, bz, ry)));

    // Planters near entrance
    [[-12, 0], [12, 0], [-8, -7.8], [8, -7.8], [-4, -7.8], [4, -7.8]].forEach(([px, pz]) => envGroup.add(createPlanter(px, pz)));

    // Street lamps
    [[-17, 9], [-17, 22], [23, 9], [23, 22], [-36, 16], [36, 16], [-4, 38], [10, 38]].forEach(([lx, lz]) => envGroup.add(createStreetLamp(lx, lz)));

    // Flagpoles
    const flagMeshes = [];
    [{ x: -9, z: -8.5, color: 0xdc2626 }, { x: 0, z: -8.5, color: 0x1d4ed8 }, { x: 9, z: -8.5, color: 0xf8fafc }].forEach(({ x, z, color }) => {
      const fp = createFlagpole(x, z, color);
      envGroup.add(fp.group); flagMeshes.push(fp.flag);
    });

    // Parked cars (left lot)
    [
      [-40, 12, 0, 0x0ea5e9], [-34, 12, 0, 0x334155], [-28, 12, 0, 0xdc2626], [-22, 12, 0, 0x1d4ed8],
      [-40, 28, Math.PI, 0x15803d], [-34, 28, Math.PI, 0xf5f5f5], [-28, 28, Math.PI, 0x7c3aed]
    ].forEach(([cx, cz, ry, col]) => envGroup.add(createCar(cx, cz, ry, col)));
    // Right lot
    [[20, 12, 0, 0x0f766e], [26, 12, 0, 0xb45309], [32, 12, 0, 0x1e293b], [20, 28, Math.PI, 0xef4444], [26, 28, Math.PI, 0x0ea5e9]].forEach(([cx, cz, ry, col]) => envGroup.add(createCar(cx, cz, ry, col)));

    // Pedestrians
    const peds = [createPedestrian(-3, 8), createPedestrian(2, 11), createPedestrian(-8, 7), createPedestrian(9, 6), createPedestrian(-5, 13)];
    peds.forEach(p => envGroup.add(p));
    const pedBase = peds.map(p => ({ x: p.position.x, z: p.position.z }));

    // Static ambulance in emergency bay
    const ambObj = createAmbulance();
    ambObj.group.position.set(-20, 0, 12);
    ambObj.group.rotation.y = 0;
    envGroup.add(ambObj.group);

    // ══════════════════════════════════════════════════════
    //  HOSPITAL BUILDINGS
    // ══════════════════════════════════════════════════════
    const hospitalGroup = new THREE.Group(); scene.add(hospitalGroup);
    const ROOF_Y = 32; // rear tower rooftop = center(16) + height/2(16)

    // ── 1. MAIN REAR TOWER — 8 floors, 32 m ──────────────
    addBuilding(hospitalGroup, 0, 16, -11, 32, 32, 20, {
      wallMat, spandrelMat, glassTex, floors: 8, floorH: 4
    });

    // Rooftop mechanical penthouse
    const penthMat = new THREE.MeshStandardMaterial({ color: 0xd4dde8, roughness: 0.55 });
    const penth = new THREE.Mesh(new THREE.BoxGeometry(14, 3.5, 8), penthMat);
    penth.position.set(4, ROOF_Y + 2.6, -12); penth.castShadow = true; hospitalGroup.add(penth);
    // Penthouse windows
    [[4, ROOF_Y + 2.6, -7.85, 12, 2.8], [4, ROOF_Y + 2.6, -16.15, 12, 2.8]].forEach(([px, py, pz, w, h]) => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.2), new THREE.MeshStandardMaterial({ color: 0x1e6fa8, transparent: true, opacity: 0.82 }));
      g.position.set(px, py, pz); hospitalGroup.add(g);
    });

    // Rooftop HVAC
    [[6, -9], [-7, -14], [0, -5]].forEach(([hx, hz]) => {
      const hvac = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.85, 2.6), new THREE.MeshStandardMaterial({ color: 0x60758a, metalness: 0.72 }));
      hvac.position.set(hx, ROOF_Y + 1.2, hz); hospitalGroup.add(hvac);
      // Duct connector
      const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x485e72 }));
      duct.position.set(hx, ROOF_Y + 2.4, hz); hospitalGroup.add(duct);
    });

    // Water tower
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x8facc0, metalness: 0.65 });
    const tankLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 7), tankMat);
    tankLeg.position.set(-12, ROOF_Y + 1.6, -15); hospitalGroup.add(tankLeg);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.2, 16), tankMat);
    tank.position.set(-12, ROOF_Y + 4.3, -15); hospitalGroup.add(tank);

    // Antenna + red blinker light
    const antMat = new THREE.MeshStandardMaterial({ color: 0x2a3c50, metalness: 0.92 });
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 5.5, 7), antMat);
    ant.position.set(11, ROOF_Y + 2.75, -9); hospitalGroup.add(ant);
    const antLight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 2.0 }));
    antLight.position.set(11, ROOF_Y + 5.5, -9); hospitalGroup.add(antLight);

    // Helipad on rooftop
    const helipadTex = createHelipadTexture();
    const helipad = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), new THREE.MeshStandardMaterial({ map: helipadTex, roughness: 0.5 }));
    helipad.rotation.x = -Math.PI / 2; helipad.position.set(-5, ROOF_Y + 0.88, -15); hospitalGroup.add(helipad);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const el = new THREE.PointLight(i % 2 === 0 ? 0xfbbf24 : 0xff4444, 0.85, 3.5);
      el.position.set(-5 + Math.cos(a) * 8.8, ROOF_Y + 1.0, -15 + Math.sin(a) * 8.8);
      hospitalGroup.add(el);
    }
    const heliObj = createHelicopter();
    heliObj.group.position.set(-5, ROOF_Y + 0.75, -15);
    hospitalGroup.add(heliObj.group);

    // ── 2. MAIN FRONT WING — 5 floors ────────────────────
    addBuilding(hospitalGroup, -1, 10, 3, 40, 20, 16, {
      wallMat: wallMat.clone(), spandrelMat: spandrelMat.clone(),
      glassTex: createGlassFacadeTexture(7), floors: 5, floorH: 4
    });

    // ── 3. EAST WING ANNEX — 3 floors ────────────────────
    addBuilding(hospitalGroup, -21, 6, -2, 14, 12, 20, {
      wallMat: wallMat.clone(), spandrelMat: spandrelMat.clone(),
      floors: 3, floorH: 4, cornerColor: 0xd8e6f0
    });

    // ── 4. EMERGENCY WING — 2 floors ─────────────────────
    addBuilding(hospitalGroup, 20, 4.5, -1, 15, 9, 18, {
      wallMat: wallMat.clone(), spandrelMat: spandrelMat.clone(),
      floors: 2, floorH: 4.5
    });
    // ER red accent facade
    const erGlassMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.28, transparent: true, opacity: 0.82, roughness: 0.04, metalness: 0.78 });
    const erAccent = new THREE.Mesh(new THREE.BoxGeometry(11, 7.8, 0.45), erGlassMat);
    erAccent.position.set(20, 4.5, 8.24); hospitalGroup.add(erAccent);
    const mullMat = new THREE.MeshStandardMaterial({ color: 0x3d5470, metalness: 0.85 });
    for (let mx = 15; mx <= 25; mx += 2.5) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 7.9, 0.5), mullMat); m.position.set(mx, 4.5, 8.26); hospitalGroup.add(m);
    }
    const erSign = createTextSprite('EMERGENCY', '#ef4444', 52, 480, 80);
    erSign.position.set(20, 8.6, 8.5); hospitalGroup.add(erSign);
    // ER canopy
    const erCanopy = new THREE.Mesh(new THREE.BoxGeometry(13, 0.4, 4.5), wallMat.clone());
    erCanopy.position.set(20, 5.6, 11.2); erCanopy.castShadow = true; hospitalGroup.add(erCanopy);
    [16, 20, 24].forEach(ex => {
      const ecol = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 5.5, 10), wallMat.clone());
      ecol.position.set(ex, 2.75, 13.4); ecol.castShadow = true; hospitalGroup.add(ecol);
    });

    // ── 5. GLASS ATRIUM BRIDGE ────────────────────────────
    const atriumMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.48, roughness: 0.03, metalness: 0.92 });
    const atrium = new THREE.Mesh(new THREE.BoxGeometry(9, 4.2, 8), atriumMat);
    atrium.position.set(0, 14.5, -3); hospitalGroup.add(atrium);
    const aFMat = new THREE.MeshStandardMaterial({ color: 0x3d5470, metalness: 0.92 });
    [-4,-2,0,2,4].forEach(ax => {
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 0.1), aFMat); v.position.set(ax, 14.5, -3); hospitalGroup.add(v);
    });
    [12.4, 16.6].forEach(ay => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 0.1), aFMat); h.position.set(0, ay, -3); hospitalGroup.add(h);
    });

    // ── 6. MAIN ENTRANCE PAVILION & COLONNADE ─────────────
    const entranceMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0ea5e9, emissiveIntensity: 0.18, transparent: true, opacity: 0.88, roughness: 0.03, metalness: 0.9 });
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(22, 7.5, 10), entranceMat);
    entrance.position.set(5, 3.75, 13.5); entrance.castShadow = true; hospitalGroup.add(entrance);

    // Horizontal canopy slab
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 7.5), wallMat.clone());
    canopy.position.set(5, 5.62, 16.8); canopy.castShadow = true; hospitalGroup.add(canopy);
    // Canopy edge fascia
    [
      [5, 5.28, 20.6, 24, 0.75, 0.22],
      [-7, 5.28, 16.8, 0.22, 0.75, 7.5],
      [17, 5.28, 16.8, 0.22, 0.75, 7.5]
    ].forEach(([x, y, z, w, h, d]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat.clone()); f.position.set(x, y, z); hospitalGroup.add(f);
    });
    // Canopy warm underlight
    const canopyLight = new THREE.PointLight(0xfef3c7, 3.0, 24);
    canopyLight.position.set(5, 4.75, 16.8); hospitalGroup.add(canopyLight);
    const canopyUnder = new THREE.Mesh(new THREE.PlaneGeometry(23, 7),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfef3c7, emissiveIntensity: 0.06 }));
    canopyUnder.rotation.x = Math.PI / 2; canopyUnder.position.set(5, 5.35, 16.8); hospitalGroup.add(canopyUnder);

    // Colonnade columns + connecting beam
    const colPositions = [[-5, 13], [1, 13], [7, 13], [13, 13], [-5, 20.5], [1, 20.5], [7, 20.5], [13, 20.5]];
    colPositions.forEach(([cx, cz]) => hospitalGroup.add(createColumn(cx, cz, 5.55)));
    // Colonnade cross-beam
    const cBeam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.38, 0.32), wallMat.clone());
    cBeam.position.set(4, 5.55, 13); hospitalGroup.add(cBeam);
    const cBeam2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.38, 0.32), wallMat.clone());
    cBeam2.position.set(4, 5.55, 20.5); hospitalGroup.add(cBeam2);

    // Sliding glass door
    const dFMat = new THREE.MeshStandardMaterial({ color: 0x2d4a68, metalness: 0.92 });
    const dGMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5, metalness: 0.6 });
    const dFrm = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.5, 0.18), dFMat); dFrm.position.set(5, 2.25, 18.52); hospitalGroup.add(dFrm);
    const dP1 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.0, 0.08), dGMat); dP1.position.set(3.2, 2.2, 18.62); hospitalGroup.add(dP1);
    const dP2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.0, 0.08), dGMat); dP2.position.set(7.0, 2.2, 18.62); hospitalGroup.add(dP2);
    // Automatic door sensor bar
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.12, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a3a5c, metalness: 0.9 }));
    sensor.position.set(5, 4.7, 18.55); hospitalGroup.add(sensor);

    // ── 7. HOSPITAL SIGNAGE ───────────────────────────────
    const hospSign = createTextSprite('METROPOLITAN GENERAL HOSPITAL', '#0ea5e9', 50, 700, 100);
    hospSign.position.set(2, 17.0, 11.15); hospitalGroup.add(hospSign);

    // Illuminated cross sign
    const crossGroup = new THREE.Group(); crossGroup.position.set(-15.5, 17.0, 11.18);
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.1 });
    crossGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.3, 0.22), crossMat));
    crossGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.5, 0.22), crossMat));
    const crossGlow = new THREE.PointLight(0xff2222, 1.0, 5.5); crossGroup.add(crossGlow);
    hospitalGroup.add(crossGroup);

    // Click-to-enter prompt
    const entrancePrompt = createTextSprite('CLICK ANYWHERE TO ENTER →', '#00f0ff', 38, 560, 72);
    entrancePrompt.position.set(5, 0.9, 21); hospitalGroup.add(entrancePrompt);

    // ── 8. ICU WING HIGHLIGHT ─────────────────────────────
    const icuGroup = new THREE.Group(); icuGroup.position.set(8, 10.5, 3);
    const icuMesh = new THREE.Mesh(new THREE.BoxGeometry(13, 3.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x00f0ff, emissiveIntensity: 0.65, transparent: true, opacity: 0.68, roughness: 0.12, metalness: 0.55, side: THREE.DoubleSide }));
    icuMesh.castShadow = true; icuGroup.add(icuMesh);
    const icuWire = new THREE.Mesh(new THREE.BoxGeometry(13.12, 3.32, 16.12),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.88 }));
    icuGroup.add(icuWire);
    const icuLabel = createTextSprite('ICU — CRITICAL CARE WING (FLOOR 3)', '#00f0ff', 40, 580, 72);
    icuLabel.position.set(0, 2.6, 8.2); icuGroup.add(icuLabel);
    const icuGlow = new THREE.PointLight(0x00f0ff, 1.8, 14); icuGroup.add(icuGlow);
    hospitalGroup.add(icuGroup);

    // Interior window warm glow lights (distributed across tower floors)
    [
      [6, 4, -10], [-5, 8, -10], [8, 12, -10], [-2, 16, -10], [3, 20, -10], [-6, 24, -10],
      [6, 4, -2],  [-5, 8, -2],  [8, 12, -2],  [-2, 16, -2],  [3, 20, -2],
    ].forEach(([x, y, z]) => {
      const wl = new THREE.PointLight(0xfef3c7, 0.8, 7);
      wl.position.set(x, y, z); hospitalGroup.add(wl);
    });

    // ── Mouse / Click ─────────────────────────────────────
    let mouseDownPos = { x: 0, y: 0 }, isDragging = false;
    function onMouseDown(e) { mouseDownPos = { x: e.clientX, y: e.clientY }; isDragging = false; }
    function onMouseUp(e) { if (Math.abs(e.clientX - mouseDownPos.x) > 4 || Math.abs(e.clientY - mouseDownPos.y) > 4) isDragging = true; }
    function onMouseMove(e) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects([...hospitalGroup.children, ...icuGroup.children], true);
      container.style.cursor = (hits.length > 0 && !isTransitioningRef.current) ? 'pointer' : 'default';
      icuMesh.scale.setScalar(hits.length > 0 ? 1.022 : 1.0);
    }
    function onClick(e) {
      if (isDragging || isTransitioningRef.current) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects([...hospitalGroup.children, ...icuGroup.children], true);
      if (hits.length > 0) { isTransitioningRef.current = true; transitionProgressRef.current = 0; controls.autoRotate = false; }
    }
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // ── Animation Loop ────────────────────────────────────
    const clock = new THREE.Clock();
    let antBlinkTimer = 0;

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Helicopter rotors
      heliObj.rotorGroup.rotation.y += delta * 20;
      heliObj.tailRotorGroup.rotation.x += delta * 26;

      // Ambulance siren lights (static vehicle)
      ambObj.redLight.intensity  = Math.sin(elapsed * 13) > 0 ? 3.2 : 0.1;
      ambObj.blueLight.intensity = Math.cos(elapsed * 13) > 0 ? 3.2 : 0.1;

      // Antenna red blinker
      antBlinkTimer += delta;
      antLight.material.emissiveIntensity = antBlinkTimer > 0.8 ? (antBlinkTimer > 0.9 ? (antBlinkTimer = 0, 0.2) : 2.0) : 0.2;

      // Fountain shimmer
      fountainLight.intensity = 1.0 + Math.sin(elapsed * 3.5) * 0.4;

      // Flag wave
      flagMeshes.forEach(flag => {
        const pos = flag.geometry.attributes.position;
        if (!flag.geometry.userData.origPos) flag.geometry.userData.origPos = new Float32Array(pos.array);
        const orig = flag.geometry.userData.origPos;
        for (let i = 0; i < pos.count; i++) {
          const ox = orig[i * 3], oy = orig[i * 3 + 1];
          const t = Math.max(0, (ox + 1.25) / 2.5);
          pos.setY(i, oy + Math.sin(elapsed * 3.4 + t * 5.2) * 0.13 * t);
        }
        pos.needsUpdate = true;
      });

      // Pedestrians gentle wander
      peds.forEach((p, i) => {
        p.position.x = pedBase[i].x + Math.sin(elapsed * 0.38 + i * 1.4) * 1.4;
        p.position.z = pedBase[i].z + Math.cos(elapsed * 0.33 + i * 1.0) * 1.2;
      });

      // ICU air quality glow
      const hasAlert = rooms.some(r => r.status === 'alert');
      const hasWarn  = rooms.some(r => r.status === 'warning');
      let hexCol = 0x00f0ff, spd = 1.4, amp = 0.28;
      if (hasAlert) { hexCol = 0xff0055; spd = 4.5; amp = 0.55; }
      else if (hasWarn) { hexCol = 0xffb800; spd = 2.4; amp = 0.38; }
      const tc = new THREE.Color(hexCol);
      const pulse = Math.sin(elapsed * spd) * amp + 0.55;
      icuMesh.material.emissive.lerp(tc, delta * 5);
      icuMesh.material.emissiveIntensity = 0.4 + pulse * 0.55;
      icuWire.material.color.lerp(tc, delta * 5);
      icuWire.material.opacity = 0.35 + pulse * 0.55;
      icuGlow.color.lerp(tc, delta * 5);
      icuGlow.intensity = 1.2 + pulse * 1.2;

      // Canopy warm pulse
      canopyLight.intensity = 2.6 + Math.sin(elapsed * 0.85) * 0.5;
      // Entrance prompt pulse
      entrancePrompt.material.opacity = 0.58 + Math.sin(elapsed * 2.1) * 0.4;

      // Camera fly-in
      if (isTransitioningRef.current) {
        transitionProgressRef.current += delta * 1.0;
        const t = Math.min(1.0, transitionProgressRef.current);
        const ease = t * t * (3 - 2 * t);
        camera.position.lerpVectors(defaultCamPos, new THREE.Vector3(5, 5.5, 21), ease);
        controls.target.lerpVectors(defaultTarget, new THREE.Vector3(5, 4.0, 8), ease);
        controls.update();
        if (t >= 1.0) { isTransitioningRef.current = false; if (onEnterFloorRef.current) onEnterFloorRef.current(); }
      } else { controls.update(); }

      renderer.render(scene, camera);
    }
    animate();

    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="scene-3d-container daytime-exterior-container" style={{ position: 'relative' }}>
      <div className="scene-3d-label daytime-label">
        <span className="scene-3d-label-icon">🏥</span>
        METROPOLITAN GENERAL HOSPITAL — MAIN FACILITY
      </div>

      <div style={{
        position: 'absolute', bottom: '18px', left: '18px', zIndex: 10,
        background: 'rgba(8,18,36,0.82)', border: '1px solid rgba(0,240,255,0.35)',
        borderRadius: '10px', padding: '12px 18px', backdropFilter: 'blur(10px)',
        color: '#f8fafc', fontFamily: '"Rajdhani","Segoe UI",sans-serif', fontSize: '13px',
        lineHeight: 1.75, pointerEvents: 'none'
      }}>
        <div style={{ color: '#00f0ff', fontWeight: 700, fontSize: '15px', marginBottom: 4 }}>🏥 Metropolitan General</div>
        <div>Floors: <strong>8</strong> &nbsp;|&nbsp; Wings: <strong>4</strong></div>
        <div>ICU Rooms: <strong>{rooms.length || '—'}</strong></div>
        <div style={{ marginTop: 6, color: '#fbbf24', fontSize: '12px' }}>🖱 Click building to enter</div>
      </div>

      <div style={{
        position: 'absolute', top: '14px', right: '14px', zIndex: 10,
        background: 'rgba(8,18,36,0.75)', border: '1px solid rgba(148,163,184,0.28)',
        borderRadius: '8px', padding: '8px 14px', backdropFilter: 'blur(8px)',
        color: '#f8fafc', fontFamily: '"Rajdhani","Segoe UI",sans-serif', fontSize: '12px',
        lineHeight: 2, pointerEvents: 'none'
      }}>
        <div><span style={{ color: '#4ade80' }}>●</span> ICU Nominal</div>
        <div><span style={{ color: '#facc15' }}>●</span> ICU Warning</div>
        <div><span style={{ color: '#ef4444' }}>●</span> ICU Alert</div>
      </div>

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
