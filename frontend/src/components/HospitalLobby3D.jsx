import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ══════════════════════════════════════════════════════════════════════
//  HIGH-FIDELITY PROCEDURAL TEXTURE GENERATORS FOR LOBBY
// ══════════════════════════════════════════════════════════════════════

/** Polished Italian Carrara Marble Tiles with subtle veining and grout lines */
function createMarbleFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Base warm marble tone
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 1024, 1024);

  // Large tile grid (4x4 tiles of 256x256)
  const tileSize = 256;
  const groutSize = 4;

  for (let ty = 0; ty < 1024; ty += tileSize) {
    for (let tx = 0; tx < 1024; tx += tileSize) {
      // Subtle tile shade variation
      const tint = Math.sin(tx * 13 + ty * 37) * 4;
      ctx.fillStyle = `rgb(${248 + tint}, ${250 + tint}, ${252 + tint})`;
      ctx.fillRect(tx + groutSize, ty + groutSize, tileSize - groutSize * 2, tileSize - groutSize * 2);

      // Procedural marble veins
      ctx.save();
      ctx.beginPath();
      ctx.rect(tx + groutSize, ty + groutSize, tileSize - groutSize * 2, tileSize - groutSize * 2);
      ctx.clip();

      ctx.lineWidth = 1.2;
      for (let v = 0; v < 3; v++) {
        const startX = tx + ((tx * 7 + ty * 11 + v * 80) % tileSize);
        const startY = ty;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        let curX = startX;
        for (let y = 0; y < tileSize; y += 20) {
          curX += (Math.sin((y + ty) * 0.05) * 8) + (Math.cos((y + tx) * 0.08) * 4);
          ctx.lineTo(curX, ty + y);
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.stroke();
      }

      // Very soft secondary clouds
      const radGrad = ctx.createRadialGradient(
        tx + tileSize * 0.5, ty + tileSize * 0.5, 10,
        tx + tileSize * 0.5, ty + tileSize * 0.5, tileSize * 0.7
      );
      radGrad.addColorStop(0, 'rgba(226, 232, 240, 0.18)');
      radGrad.addColorStop(1, 'rgba(248, 250, 252, 0)');
      ctx.fillStyle = radGrad;
      ctx.fillRect(tx, ty, tileSize, tileSize);

      ctx.restore();

      // Grout lines
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = groutSize;
      ctx.strokeRect(tx + groutSize * 0.5, ty + groutSize * 0.5, tileSize - groutSize, tileSize - groutSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  return texture;
}

/** Scandinavian Vertical Acoustic Wood Slats Texture */
function createWoodSlatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark acoustic felt backing
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical wood ribs
  const slatWidth = 18;
  const gap = 8;
  const pitch = slatWidth + gap;

  for (let x = 0; x < 512; x += pitch) {
    const woodGrad = ctx.createLinearGradient(x, 0, x + slatWidth, 0);
    woodGrad.addColorStop(0, '#c29b74');
    woodGrad.addColorStop(0.2, '#dfc2a2');
    woodGrad.addColorStop(0.8, '#b88f66');
    woodGrad.addColorStop(1, '#9e754e');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(x, 0, slatWidth, 512);

    // Subtle grain lines
    ctx.strokeStyle = 'rgba(90, 60, 30, 0.15)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) {
      const gx = x + 3 + g * 4;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (Math.sin(g * 10) * 2), 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

/** Modular Acoustic Ceiling Tiles with Recessed Lights */
function createCeilingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 512, 512);

  // 4x4 Grid
  const size = 128;
  for (let y = 0; y < 512; y += size) {
    for (let x = 0; x < 512; x += size) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);

      // Fine perforation dots
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      for (let px = x + 16; px < x + size - 16; px += 16) {
        for (let py = y + 16; py < y + size - 16; py += 16) {
          ctx.beginPath();
          ctx.arc(px, py, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  return texture;
}

/** High-Tech Live Digital Hospital Directory Totem Screen */
function createDirectoryScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Deep dark UI background with gradient
  const bg = ctx.createLinearGradient(0, 0, 0, 1024);
  bg.addColorStop(0, '#040d1a');
  bg.addColorStop(0.5, '#08172c');
  bg.addColorStop(1, '#020710');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 1024);

  // Header banner
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(20, 24, 472, 70);

  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('METROPOLITAN HOSPITAL', 40, 68);

  ctx.font = '600 16px "Segoe UI", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('FACILITY DIRECTORY & LIVE STATUS', 40, 126);

  // Floor Listings
  const floors = [
    { num: '05', title: 'Cardiothoracic Surgery & Research', status: 'RESTRICTED', color: '#94a3b8' },
    { num: '04', title: 'Surgical Theatres & Cleanrooms', status: 'ACTIVE', color: '#10b981' },
    { num: '03', title: 'ICU — Critical Care Wing', status: 'MONITORED (LIVE)', color: '#00f0ff', active: true },
    { num: '02', title: 'Step-Down & Post-Op Recovery', status: 'ACTIVE', color: '#10b981' },
    { num: '01', title: 'Main Atrium & Admissions', status: 'CURRENT FLOOR', color: '#38bdf8' },
    { num: 'LG', title: 'Emergency / Trauma / Ambulance', status: '24/7 OPEN', color: '#ef4444' },
  ];

  let curY = 160;
  floors.forEach((f) => {
    ctx.fillStyle = f.active ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = f.active ? '#00f0ff' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = f.active ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(24, curY, 464, 84, 8);
    ctx.fill();
    ctx.stroke();

    // Floor Badge
    ctx.fillStyle = f.active ? '#00f0ff' : '#64748b';
    ctx.beginPath();
    ctx.roundRect(36, curY + 16, 52, 52, 6);
    ctx.fill();

    ctx.fillStyle = '#040d1a';
    ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.num, 62, curY + 52);

    // Title & Status
    ctx.textAlign = 'left';
    ctx.fillStyle = f.active ? '#ffffff' : '#cbd5e1';
    ctx.font = f.active ? 'bold 20px "Segoe UI", sans-serif' : '500 18px "Segoe UI", sans-serif';
    ctx.fillText(f.title, 102, curY + 40);

    ctx.fillStyle = f.color;
    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.fillText(`• ${f.status}`, 102, curY + 64);

    curY += 98;
  });

  // Footer ICU Environmental Telemetry Widget
  ctx.fillStyle = 'rgba(0, 240, 255, 0.06)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(24, 760, 464, 220, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px "Segoe UI", sans-serif';
  ctx.fillText('ICU AIR QUALITY TWIN HUD: ACTIVE', 40, 796);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('WHO Safety Guidelines: Strict Enforced', 40, 824);
  ctx.fillText('Continuous Multi-Parameter Sensor Array', 40, 848);
  ctx.fillText('PM2.5  |  PM10  |  CO2  |  Temp  |  Humidity', 40, 872);

  // Glowing status pulse indicator
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(440, 792, 8, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Medical Telemetry Curved Monitor Texture for Reception Desk */
function createMonitorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#060d19';
  ctx.fillRect(0, 0, 512, 256);

  // Top header
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(10, 10, 492, 32);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.fillText('PATIENT ADMISSIONS & CENTRAL MONITORING', 24, 32);

  // Waveform graph grid
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 20; x < 490; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, 55); ctx.lineTo(x, 190); ctx.stroke();
  }
  for (let y = 55; y <= 190; y += 25) {
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(490, y); ctx.stroke();
  }

  // ECG green waveform line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(20, 120);
  for (let x = 20; x < 490; x += 6) {
    const cycle = (x % 90);
    let y = 120;
    if (cycle > 35 && cycle < 42) y -= 10;
    else if (cycle >= 42 && cycle < 48) y += 35;
    else if (cycle >= 48 && cycle < 54) y -= 55;
    else if (cycle >= 54 && cycle < 62) y += 20;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Bottom vitals
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('HR: 74 bpm', 30, 225);
  ctx.fillStyle = '#10b981';
  ctx.fillText('SpO2: 99%', 180, 225);
  ctx.fillStyle = '#eab308';
  ctx.fillText('NIBP: 120/80', 320, 225);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/** Clean Signboard Texture (Sharp, flush, non-billboard) */
function createWallSignTexture(title, subtitle, bgColor = '#0f172a', textColor = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(8, 8, 1008, 240, 16);
  ctx.fill();

  // Brushed steel border
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  const maxLen = 940;
  let fontSize = 56;
  ctx.font = `bold ${fontSize}px "Segoe UI", "Rajdhani", sans-serif`;
  while (ctx.measureText(title).width > maxLen && fontSize > 24) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px "Segoe UI", "Rajdhani", sans-serif`;
  }
  ctx.fillStyle = textColor;
  ctx.fillText(title, 512, 110);

  // Subtitle
  if (subtitle) {
    let subFontSize = 30;
    ctx.font = `600 ${subFontSize}px "Segoe UI", sans-serif`;
    while (ctx.measureText(subtitle).width > maxLen && subFontSize > 16) {
      subFontSize -= 2;
      ctx.font = `600 ${subFontSize}px "Segoe UI", sans-serif`;
    }
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subtitle, 512, 185);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ══════════════════════════════════════════════════════════════════════
//  DETAILED PROCEDURAL 3D ARCHITECTURAL PROPS
// ══════════════════════════════════════════════════════════════════════

/** Modern Designer Executive Lounge Sofa */
function createModernSofa(x, z, rotationY) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  // Materials
  const upholsteryMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Slate charcoal fabric
    roughness: 0.85,
    metalness: 0.1,
  });
  const cushionAccentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Hospital medical blue accent
    roughness: 0.8,
    metalness: 0.1,
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Base platform
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 1.8), darkSteelMat);
  base.position.y = 0.35;
  base.castShadow = true;
  group.add(base);

  // 4 Sleek modern angled metal legs
  [[-2.0, 0.9], [2.0, 0.9], [-2.0, -0.9], [2.0, -0.9]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.45, 12), darkSteelMat);
    leg.position.set(lx, 0.2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  // Seat cushions (split into 2 comfortable thick cushions)
  [-1.05, 1.05].forEach((cx) => {
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.48, 1.7), upholsteryMat);
    cushion.position.set(cx, 0.65, 0);
    cushion.castShadow = true;
    group.add(cushion);
  });

  // Backrest (low-profile contemporary European style)
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.85, 0.42), upholsteryMat);
  back.position.set(0, 1.15, -0.68);
  back.castShadow = true;
  group.add(back);

  // Side armrests
  [-2.1, 2.1].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.72, 1.76), upholsteryMat);
    arm.position.set(ax, 0.85, 0);
    arm.castShadow = true;
    group.add(arm);
  });

  // Accent throw pillows
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.22), cushionAccentMat);
  pillow1.position.set(-1.6, 0.98, -0.4);
  pillow1.rotation.y = 0.25;
  group.add(pillow1);

  const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.22), cushionAccentMat);
  pillow2.position.set(1.6, 0.98, -0.4);
  pillow2.rotation.y = -0.25;
  group.add(pillow2);

  return group;
}

/** Sleek Smoked Glass Coffee Table */
function createCoffeeTable(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    metalness: 0.9,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Table top
  const top = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.08, 32), glassMat);
  top.position.y = 0.55;
  top.castShadow = true;
  group.add(top);

  // Tripod chrome legs
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const lx = Math.cos(angle) * 0.9;
    const lz = Math.sin(angle) * 0.9;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12), chromeMat);
    leg.position.set(lx, 0.28, lz);
    leg.rotation.z = Math.sin(angle) * 0.12;
    leg.rotation.x = -Math.cos(angle) * 0.12;
    leg.castShadow = true;
    group.add(leg);
  }

  // Tablet / magazine brochure prop
  const magMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.45), magMat);
  mag.position.set(0.15, 0.61, 0.1);
  mag.rotation.y = 0.35;
  group.add(mag);

  return group;
}

/** Biophilic Potted Indoor Plant (Fiddle-Leaf Fig / Broadleaf) */
function createDetailedPlant(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Minimalist Fluted Ceramic Planter
  const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.65, 1.5, 24), potMat);
  pot.position.y = 0.75;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // Dark Soil
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.9 });
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.1, 24), soilMat);
  soil.position.y = 1.45;
  group.add(soil);

  // Stems & Leaves
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d3023, roughness: 0.7 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x166534, // Lush deep emerald green
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Multiple organic stems radiating upward
  const leafConfigs = [
    { height: 2.2, angle: 0, spread: 0.7, leafScale: 1.1 },
    { height: 2.7, angle: 1.2, spread: 0.8, leafScale: 1.2 },
    { height: 3.2, angle: 2.4, spread: 0.85, leafScale: 1.3 },
    { height: 3.6, angle: 3.6, spread: 0.7, leafScale: 1.4 },
    { height: 2.9, angle: 4.8, spread: 0.9, leafScale: 1.25 },
    { height: 4.1, angle: 0.8, spread: 0.5, leafScale: 1.3 },
  ];

  leafConfigs.forEach((cfg) => {
    // Stem curve
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, cfg.height - 1.4, 8), stemMat);
    const sx = Math.cos(cfg.angle) * cfg.spread * 0.4;
    const sz = Math.sin(cfg.angle) * cfg.spread * 0.4;
    stem.position.set(sx, 1.4 + (cfg.height - 1.4) * 0.5, sz);
    stem.rotation.z = Math.sin(cfg.angle) * 0.15;
    stem.rotation.x = Math.cos(cfg.angle) * 0.15;
    group.add(stem);

    // Realistic broad leaf mesh (organic curved oval)
    const leafGeo = new THREE.SphereGeometry(0.55 * cfg.leafScale, 12, 10);
    leafGeo.scale(1.0, 0.12, 1.8);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(Math.cos(cfg.angle) * cfg.spread, cfg.height, Math.sin(cfg.angle) * cfg.spread);
    leaf.rotation.y = cfg.angle;
    leaf.rotation.x = 0.35;
    leaf.castShadow = true;
    group.add(leaf);
  });

  return group;
}

/** High-Tech Stylized Digital-Twin Avatar (Replaces crude bowling pins) */
function createDigitalTwinAvatar(x, z, rotationY, role = 'staff') {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const isStaff = role === 'staff';

  // Digital twin medical aesthetic: Semi-translucent cyber-hologram materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isStaff ? 0x0284c7 : 0x475569,
    emissive: isStaff ? 0x0284c7 : 0x334155,
    emissiveIntensity: 0.25,
    roughness: 0.35,
    metalness: 0.2,
  });

  const coatMat = new THREE.MeshStandardMaterial({
    color: isStaff ? 0xf8fafc : 0x64748b, // Medical lab coat white or visitor casual
    roughness: 0.4,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  // Ground holographic tracking ring
  const ringGeo = new THREE.RingGeometry(0.45, 0.55, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isStaff ? 0x00f0ff : 0x94a3b8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  // Legs / Slacks
  [-0.15, 0.15].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.95, 12), bodyMat);
    leg.position.set(lx, 0.48, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // Torso & Lab Coat
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.85, 14), coatMat);
  torso.position.set(0, 1.35, 0);
  torso.castShadow = true;
  group.add(torso);

  // Arms
  [-0.35, 0.35].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.75, 10), coatMat);
    arm.position.set(ax, 1.3, 0);
    arm.rotation.z = ax > 0 ? -0.15 : 0.15;
    arm.castShadow = true;
    group.add(arm);
  });

  // ID Badge Lanyard (Staff)
  if (isStaff) {
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.02), badgeMat);
    badge.position.set(0.08, 1.3, 0.24);
    group.add(badge);
  }

  // Head with Visor
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), bodyMat);
  head.position.set(0, 1.95, 0);
  head.castShadow = true;
  group.add(head);

  // Cybernetic AR medical visor / specs
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.18), visorMat);
  visor.position.set(0, 1.98, 0.12);
  group.add(visor);

  return group;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: HOSPITAL LOBBY 3D (LEVEL 2)
// ══════════════════════════════════════════════════════════════════════

export default function HospitalLobby3D({ rooms, onEnterICUFloor }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const onEnterICUFloorRef = useRef(onEnterICUFloor);
  const isTransitioningRef = useRef(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Dynamic status light refs
  const portalGlowLightRef = useRef(null);
  const portalChevronRef = useRef(null);

  useEffect(() => {
    onEnterICUFloorRef.current = onEnterICUFloor;
  }, [onEnterICUFloor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene & Environment Setup ─────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1120); // Modern deep architectural slate backdrop
    scene.fog = new THREE.FogExp2(0x0a1120, 0.012);

    // ── 2. Cinematic Eye-Level Camera ────────────────────────────
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 150);
    const defaultCamPos = new THREE.Vector3(0, 3.8, 14.0);
    const defaultTarget = new THREE.Vector3(0, 2.6, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // ── 3. Ultra-Crisp Antialiased WebGL Renderer ─────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // ── 4. Smooth Constrained OrbitControls ───────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI / 2.05; // Never clip under floor
    controls.minPolarAngle = 0.2;
    controls.target.copy(defaultTarget);

    // ── 5. Balanced Architectural Lighting ────────────────────────
    scene.add(new THREE.AmbientLight(0xf1f5f9, 0.85));

    // Warm Sun streaming through atrium glass
    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    sunLight.position.set(12, 18, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Overhead linear architectural lights (Cyan / Ice White)
    const downLightL = new THREE.PointLight(0x38bdf8, 1.6, 20);
    downLightL.position.set(-6, 7.5, 0);
    scene.add(downLightL);

    const downLightR = new THREE.PointLight(0x0284c7, 1.6, 20);
    downLightR.position.set(6, 7.5, 0);
    scene.add(downLightR);

    // Warm cove wash
    const coveLight = new THREE.PointLight(0xffedd5, 1.1, 16);
    coveLight.position.set(0, 8.5, -6);
    scene.add(coveLight);

    const lobbyGroup = new THREE.Group();
    scene.add(lobbyGroup);

    // ── 6. ARCHITECTURAL ATRIUM SHELL ─────────────────────────────

    // Polished Carrara Marble Floor (34m x 26m)
    const marbleTex = createMarbleFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.15,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 26), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    lobbyGroup.add(floor);

    // High Suspended Acoustic Ceiling with Grid
    const ceilingTex = createCeilingTexture();
    const ceilingMat = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.6,
      metalness: 0.1,
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(34, 26), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9.0;
    lobbyGroup.add(ceiling);

    // Recessed Linear LED Light Fixtures in Ceiling
    [-8, 0, 8].forEach((lx) => {
      [-4, 4].forEach((lz) => {
        const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.4), fixtureMat);
        fixture.position.set(lx, 8.95, lz);
        lobbyGroup.add(fixture);
      });
    });

    // Back Architectural Wall (Satin Clean White + Stainless Reveal Trim)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(34, 9.0, 0.4), wallMat);
    backWall.position.set(0, 4.5, -11);
    backWall.receiveShadow = true;
    lobbyGroup.add(backWall);

    // Architectural Baseboard / Shadowline along back wall
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(34, 0.25, 0.45), baseboardMat);
    baseboard.position.set(0, 0.12, -10.98);
    lobbyGroup.add(baseboard);

    // Scandinavian Fluted Wood Accent Slat Panels flanking the door
    const woodTex = createWoodSlatTexture();
    const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.5 });

    // Left Wood Accent Wall
    const woodWallL = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.0, 0.2), woodMat);
    woodWallL.position.set(-11.5, 4.2, -10.7);
    woodWallL.receiveShadow = true;
    lobbyGroup.add(woodWallL);

    // Right Wood Accent Wall
    const woodWallR = new THREE.Mesh(new THREE.BoxGeometry(9.0, 8.0, 0.2), woodMat);
    woodWallR.position.set(11.5, 4.2, -10.7);
    woodWallR.receiveShadow = true;
    lobbyGroup.add(woodWallR);

    // Side Curtain Wall Floor-to-Ceiling Windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.9,
    });
    const mullionMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });

    [-17, 17].forEach((sideX) => {
      const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(26, 9.0), glassMat);
      sideGlass.rotation.y = sideX > 0 ? -Math.PI / 2 : Math.PI / 2;
      sideGlass.position.set(sideX, 4.5, 2);
      lobbyGroup.add(sideGlass);

      // Vertical mullions
      for (let z = -11; z <= 15; z += 4.5) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.15, 9.0, 0.25), mullionMat);
        mullion.position.set(sideX, 4.5, z);
        lobbyGroup.add(mullion);
      }
    });

    // ── 7. LUXURY RECEPTION & ADMISSIONS DESK ──────────────────────
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-7.5, 0, -2.5);

    // Illuminated Translucent Onyx / Corian Front Panel
    const deskFrontMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
    });
    const deskBase = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.15, 32, 1, false, 0, Math.PI * 0.95), deskFrontMat);
    deskBase.position.set(0, 0.58, 0);
    deskBase.rotation.y = -Math.PI * 0.48;
    deskBase.castShadow = true;
    deskGroup.add(deskBase);

    // Warm Solid Oak Countertop
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.4 });
    const counter = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.12, 32, 1, false, 0, Math.PI * 0.95), counterMat);
    counter.position.set(0, 1.18, 0);
    counter.rotation.y = -Math.PI * 0.48;
    counter.castShadow = true;
    deskGroup.add(counter);

    // Front Metal Lettering Sign on Desk
    const deskSignTex = createWallSignTexture('RECEPTION & ADMISSIONS', 'CENTRAL TRIAGE & MONITORING', '#0b192c', '#00f0ff');
    const deskSignMat = new THREE.MeshBasicMaterial({ map: deskSignTex, transparent: true });
    const deskSign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), deskSignMat);
    deskSign.position.set(0, 0.6, 2.3);
    deskGroup.add(deskSign);

    // Dual Ultra-Wide Curved Medical Monitors
    const monTex = createMonitorTexture();
    const monMat = new THREE.MeshBasicMaterial({ map: monTex });
    const monBezelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2, metalness: 0.9 });

    [-1.2, 1.2].forEach((mx) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.35, 12), monBezelMat);
      stand.position.set(mx, 1.35, 0.4);
      deskGroup.add(stand);

      const mon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.06), monMat);
      mon.position.set(mx, 1.7, 0.4);
      mon.rotation.y = mx > 0 ? -0.2 : 0.2;
      deskGroup.add(mon);
    });

    // Receptionist Digital-Twin Avatar behind desk
    const receptionist = createDigitalTwinAvatar(0, -0.6, 0, 'staff');
    deskGroup.add(receptionist);

    lobbyGroup.add(deskGroup);

    // ── 8. DIGITAL DIRECTORY TOTEM KIOSK ──────────────────────────
    const totemGroup = new THREE.Group();
    totemGroup.position.set(-11.5, 0, -4.5);
    totemGroup.rotation.y = 0.35;

    // Dark glass and stainless totem stand
    const totemStandMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.15 });
    const totemStand = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.4, 0.35), totemStandMat);
    totemStand.position.y = 2.2;
    totemStand.castShadow = true;
    totemGroup.add(totemStand);

    // Interactive Screen Face
    const screenTex = createDirectoryScreenTexture();
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const totemScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.0), screenMat);
    totemScreen.position.set(0, 2.2, 0.18);
    totemGroup.add(totemScreen);

    // Soft cyan pool of light under totem
    const totemLight = new THREE.PointLight(0x00f0ff, 1.2, 5.0);
    totemLight.position.set(0, 2.0, 0.6);
    totemGroup.add(totemLight);

    lobbyGroup.add(totemGroup);

    // ── 9. EXECUTIVE WAITING LOUNGE ───────────────────────────────
    const loungeGroup = new THREE.Group();
    loungeGroup.position.set(8.5, 0, 0);

    // Two facing designer sofas
    loungeGroup.add(createModernSofa(0, -3.2, 0));
    loungeGroup.add(createModernSofa(0, 3.2, Math.PI));

    // Central Smoked Glass Coffee Table
    loungeGroup.add(createCoffeeTable(0, 0));

    // Waiting Visitor Digital-Twin Avatar
    const visitorAvatar = createDigitalTwinAvatar(-0.8, -2.5, 0.4, 'visitor');
    loungeGroup.add(visitorAvatar);

    lobbyGroup.add(loungeGroup);

    // ── 10. BIOPHILIC INDOOR PLANTS & PLANTERS ────────────────────
    lobbyGroup.add(createDetailedPlant(-15.0, -9.0));
    lobbyGroup.add(createDetailedPlant(15.0, -9.0));
    lobbyGroup.add(createDetailedPlant(-15.0, 8.0));
    lobbyGroup.add(createDetailedPlant(15.0, 8.0));
    lobbyGroup.add(createDetailedPlant(3.8, -9.0));
    lobbyGroup.add(createDetailedPlant(-3.8, -9.0));

    // Walking Staff Member traversing the lobby
    const walkingStaff = createDigitalTwinAvatar(2.5, 4.2, -0.6, 'staff');
    lobbyGroup.add(walkingStaff);

    // ── 11. HOTSPOT: AUTOMATED SLIDING ICU ENTRANCE PORTAL ────────
    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -10.8);

    // Brushed Aluminum Door Surround Portal Frame
    const portalFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const portalTop = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 0.6), portalFrameMat);
    portalTop.position.set(0, 5.4, 0);
    portalGroup.add(portalTop);

    const portalPostL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.4, 0.6), portalFrameMat);
    portalPostL.position.set(-3.4, 2.7, 0);
    portalGroup.add(portalPostL);

    const portalPostR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5.4, 0.6), portalFrameMat);
    portalPostR.position.set(3.4, 2.7, 0);
    portalGroup.add(portalPostR);

    // Frosted Glass Double Sliding Doors
    const doorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(3.1, 5.0, 0.08), doorGlassMat);
    doorL.position.set(-1.6, 2.6, 0);
    portalGroup.add(doorL);

    const doorR = new THREE.Mesh(new THREE.BoxGeometry(3.1, 5.0, 0.08), doorGlassMat);
    doorR.position.set(1.6, 2.6, 0);
    portalGroup.add(doorR);

    // Medical Cross Insignia on Glass Doors
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
    [-1.6, 1.6].forEach((dx) => {
      const vCross = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.1), crossMat);
      vCross.position.set(dx, 2.6, 0.05);
      portalGroup.add(vCross);
      const hCross = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.1), crossMat);
      hCross.position.set(dx, 2.6, 0.05);
      portalGroup.add(hCross);
    });

    // Wall-Mounted Architectural ICU Signboard (Crisp, flush, non-clipping)
    const signTex = createWallSignTexture(
      'ICU — CRITICAL CARE WING',
      'AIR QUALITY MONITORED • AUTHORIZED ACCESS ONLY',
      '#061122',
      '#00f0ff'
    );
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.7), signMat);
    signMesh.position.set(0, 6.6, 0.32);
    portalGroup.add(signMesh);

    // Biometric RFID / Keycard Scanner on wall
    const scannerMat = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.2 });
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.65, 0.12), scannerMat);
    scanner.position.set(3.9, 2.6, 0.2);
    portalGroup.add(scanner);

    const scannerLED = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.08, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x10b981 }) // Secure green LED
    );
    scannerLED.position.set(3.9, 2.8, 0.28);
    portalGroup.add(scannerLED);

    // Holographic Entry Ground Chevron Indicator
    const chevronGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    const chevronMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const chevron = new THREE.Mesh(chevronGeo, chevronMat);
    chevron.rotation.x = -Math.PI / 2;
    chevron.position.set(0, 0.04, 2.0);
    portalGroup.add(chevron);
    portalChevronRef.current = chevron;

    // Glowing Point Light inside the portal corridor
    const portalGlow = new THREE.PointLight(0x00f0ff, 2.4, 12);
    portalGlow.position.set(0, 3.0, -1.0);
    portalGroup.add(portalGlow);
    portalGlowLightRef.current = portalGlow;

    lobbyGroup.add(portalGroup);

    // ── 12. Interactive Raycasting & Click Navigation ─────────────
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
      const hits = raycasterRef.current.intersectObjects(portalGroup.children, true);

      if (hits.length > 0 && !isTransitioningRef.current) {
        container.style.cursor = 'pointer';
        portalGlow.intensity = 3.8;
      } else {
        container.style.cursor = 'default';
        portalGlow.intensity = 2.4;
      }
    }

    function onClick(e) {
      if (isDragging || isTransitioningRef.current) return;
      triggerICUTransition();
    }

    function triggerICUTransition() {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      // Cinematic smooth dolly camera zoom directly into the ICU corridor
      const startCam = camera.position.clone();
      const endCam = new THREE.Vector3(0, 2.4, -9.5);
      const startTgt = controls.target.clone();
      const endTgt = new THREE.Vector3(0, 2.4, -18.0);

      const startTime = performance.now();
      const duration = 1200; // 1.2s smooth cinematic glide

      function animateDolly(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        // Ease-in-out cubic
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startCam, endCam, ease);
        controls.target.lerpVectors(startTgt, endTgt, ease);
        controls.update();

        // Slide the doors open during zoom!
        doorL.position.x = -1.6 - (ease * 1.5);
        doorR.position.x = 1.6 + (ease * 1.5);

        if (progress < 1.0) {
          requestAnimationFrame(animateDolly);
        } else {
          if (onEnterICUFloorRef.current) {
            onEnterICUFloorRef.current();
          }
        }
      }

      requestAnimationFrame(animateDolly);
    }

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // ── 13. Render Loop ───────────────────────────────────────────
    let clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      controls.update();

      // Gentle pulsing animation for the holographic entry ring
      if (portalChevronRef.current) {
        const s = 1.0 + Math.sin(time * 3.0) * 0.08;
        portalChevronRef.current.scale.set(s, s, s);
      }

      // Gentle glow oscillation for portal light
      if (portalGlowLightRef.current && !isTransitioningRef.current) {
        portalGlowLightRef.current.intensity = 2.2 + Math.sin(time * 2.5) * 0.4;
      }

      renderer.render(scene, camera);
    }

    animate();

    // ── 14. Responsive Resize ─────────────────────────────────────
    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // ── 15. Cleanup ───────────────────────────────────────────────
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
          <span style={{ fontSize: '18px' }}>🏥</span>
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em', color: '#38bdf8' }}>
            LEVEL 2 — HOSPITAL MAIN ATRIUM & RECEPTION
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
          Interactive Architectural BIM Digital Twin • Real-Time Environmental Telemetry
        </div>
      </div>

      {/* Interactive Click-to-Enter Call-To-Action Floating Badge (Bottom Center) */}
      <div
        onClick={() => {
          if (onEnterICUFloorRef.current) onEnterICUFloorRef.current();
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
        <span>CLICK DOORWAY TO ENTER ICU FLOOR 3 →</span>
      </div>

      {/* Navigation & Controls Helper Tip (Bottom Right) */}
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
        Left Click + Drag: Orbit • Scroll: Zoom • Right Click: Pan
      </div>
    </div>
  );
}
