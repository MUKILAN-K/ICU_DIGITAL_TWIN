import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ─── Status → Color mapping ────────────────────────────────────────
const STATUS_COLORS = {
  safe:    { base: 0x10b981, dim: 0x064e3b },
  warning: { base: 0xf59e0b, dim: 0x78350f },
  alert:   { base: 0xef4444, dim: 0x7f1d1d },
  unknown: { base: 0x0284c7, dim: 0x0f172a },
};

// Compact 5-room layout along central corridor
const ROOM_LAYOUT = [
  { id: 'ICU-101', label: 'ICU-101', x: -9.5, z: -5.2, w: 7.5, h: 4.0, d: 6.5 },
  { id: 'ICU-102', label: 'ICU-102', x: 0,    z: -5.2, w: 7.5, h: 4.0, d: 6.5 },
  { id: 'ICU-103', label: 'ICU-103', x: 9.5,  z: -5.2, w: 7.5, h: 4.0, d: 6.5 },
  { id: 'ICU-104', label: 'ICU-104', x: -5.0, z: 5.2,  w: 7.5, h: 4.0, d: 6.5 },
  { id: 'ICU-105', label: 'ICU-105', x: 5.0,  z: 5.2,  w: 7.5, h: 4.0, d: 6.5 },
];

const ROOM_TYPE_INFO = {
  'ICU-101': { type: 'Isolation Unit 1', icon: '☣️' },
  'ICU-102': { type: 'General ICU Room A', icon: '🛏️' },
  'ICU-103': { type: 'General ICU Room B', icon: '🛏️' },
  'ICU-104': { type: 'High Occupancy Suite', icon: '👥' },
  'ICU-105': { type: 'Post-Op Recovery', icon: '❤️' },
};

function createTextSprite(text, color = '#ffffff', fontSize = 42, canvasW = 340, canvasH = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.font = `bold ${fontSize}px "Rajdhani", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 6;
  ctx.strokeText(text, canvasW / 2, canvasH / 2);

  ctx.fillStyle = color;
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.6, 0.7, 1);
  return sprite;
}

export default function HospitalFloor3D({ rooms, onRoomClick, onSelectRoom }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const roomMeshesRef = useRef({});
  const selectedRoomIdRef = useRef(null);

  const handleRoomSelect = onRoomClick || onSelectRoom;
  const onSelectRoomRef = useRef(handleRoomSelect);

  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredRoomIdRef = useRef(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => { onSelectRoomRef.current = handleRoomSelect; }, [handleRoomSelect]);

  // Update status colors dynamically
  useEffect(() => {
    rooms.forEach(r => {
      const m = roomMeshesRef.current[r.room_id];
      if (!m) return;
      const palette = STATUS_COLORS[r.status] || STATUS_COLORS.unknown;
      m._status = r.status;
      m._targetBaseColor = new THREE.Color(palette.base);

      if (m.statusSprite) {
        m.group.remove(m.statusSprite);
        m.statusSprite.material.map.dispose();
        m.statusSprite.material.dispose();
      }
      const statusText = (r.status || 'unknown').toUpperCase();
      const statusColor = '#' + new THREE.Color(palette.base).getHexString();
      const sp = createTextSprite(statusText, statusColor, 34);
      sp.position.set(0, 4.4, 0);
      sp.scale.set(1.7, 0.4, 1);
      m.group.add(sp);
      m.statusSprite = sp;
    });
  }, [rooms]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Enclosed Scene Setup ───────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Bright clean sky white
    scene.fog = new THREE.Fog(0xf8fafc, 28, 65);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 18, 20);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 6;
    controls.maxDistance = 40;
    controls.target.set(0, 1, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));

    const sun = new THREE.DirectionalLight(0xfffbeb, 1.3);
    sun.position.set(12, 22, 16);
    sun.castShadow = true;
    scene.add(sun);

    // ── Enclosed ICU Floor Structure ──────────────────────────
    const floorWingGroup = new THREE.Group();
    scene.add(floorWingGroup);

    // Floor Base (32m wide x 22m deep)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.05 });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 22), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    floorWingGroup.add(floorMesh);

    // Corridor Central Walking Path (Linoleum Slate Blue Strip)
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25 });
    const mainPath = new THREE.Mesh(new THREE.PlaneGeometry(32, 3.5), pathMat);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.set(0, 0.01, 0);
    floorWingGroup.add(mainPath);

    // Cross connecting hallway paths to bottom rooms
    const crossPathL = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7.5), pathMat);
    crossPathL.rotation.x = -Math.PI / 2;
    crossPathL.position.set(-5, 0.01, 1.8);
    floorWingGroup.add(crossPathL);

    const crossPathR = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 7.5), pathMat);
    crossPathR.rotation.x = -Math.PI / 2;
    crossPathR.position.set(5, 0.01, 1.8);
    floorWingGroup.add(crossPathR);

    // ── Four Perimeter Enclosure Walls ─────────────────────────
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const wallBorderMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });

    // North Wall (Back)
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(32, 4.5, 0.4), wallMat);
    northWall.position.set(0, 2.25, -11);
    floorWingGroup.add(northWall);

    const northBorder = new THREE.Mesh(new THREE.BoxGeometry(32, 0.2, 0.45), wallBorderMat);
    northBorder.position.set(0, 4.4, -11);
    floorWingGroup.add(northBorder);

    // South Wall (Front with Corridor Entrance Aperture)
    const southWallL = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 0.4), wallMat);
    southWallL.position.set(-10, 2.25, 11);
    floorWingGroup.add(southWallL);

    const southWallR = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 0.4), wallMat);
    southWallR.position.set(10, 2.25, 11);
    floorWingGroup.add(southWallR);

    // West Wall (Left)
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 22), wallMat);
    westWall.position.set(-16, 2.25, 0);
    floorWingGroup.add(westWall);

    // East Wall (Right)
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.5, 22), wallMat);
    eastWall.position.set(16, 2.25, 0);
    floorWingGroup.add(eastWall);

    // Central Nurse Command Station Desk in Hallway
    const nurseDeskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const nurseDesk = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.1, 1.6), nurseDeskMat);
    nurseDesk.position.set(0, 0.55, 0);
    nurseDesk.castShadow = true;
    floorWingGroup.add(nurseDesk);

    const deskSign = createTextSprite('CENTRAL ICU NURSE STATION', '#0284c7', 32, 420, 50);
    deskSign.position.set(0, 1.4, 0);
    deskSign.scale.set(3.2, 0.6, 1);
    floorWingGroup.add(deskSign);

    // ── Build 5 Compact ICU Rooms ────────────────────────────
    ROOM_LAYOUT.forEach(layout => {
      const initPalette = STATUS_COLORS.unknown;
      const group = new THREE.Group();
      group.position.set(layout.x, 0, layout.z);

      // Transparent Hitbox for exact raycast clicking
      const hitBoxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, side: THREE.DoubleSide });
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(layout.w + 0.4, layout.h + 1.5, layout.d + 0.4), hitBoxMat);
      hitBox.position.y = layout.h / 2;
      hitBox.userData.roomId = layout.id;
      group.add(hitBox);

      // Status Pad Floor Glow
      const glowMat = new THREE.MeshBasicMaterial({
        color: initPalette.base, transparent: true, opacity: 0.35, side: THREE.DoubleSide
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(layout.w + 0.3, layout.d + 0.3), glowMat);
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.02;
      group.add(glow);

      // Room Outline Border Frame
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
      const frameWire = new THREE.Mesh(new THREE.BoxGeometry(layout.w, layout.h, layout.d), new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true, transparent: true, opacity: 0.4 }));
      frameWire.position.y = layout.h / 2;
      group.add(frameWire);

      // Room Title Label
      const labelSprite = createTextSprite(layout.label, '#0284c7', 42);
      labelSprite.position.set(0, 5.0, 0);
      group.add(labelSprite);

      // Room type subtitle
      const typeInfo = ROOM_TYPE_INFO[layout.id] || { type: 'ICU', icon: '🏥' };
      const typeSprite = createTextSprite(`${typeInfo.icon} ${typeInfo.type}`, '#64748b', 26, 300, 48);
      typeSprite.position.set(0, 5.4, 0);
      typeSprite.scale.set(2.2, 0.4, 1);
      group.add(typeSprite);

      // Status text placeholder
      const statusSprite = createTextSprite('SAFE', '#10b981', 34);
      statusSprite.position.set(0, 4.4, 0);
      statusSprite.scale.set(1.7, 0.4, 1);
      group.add(statusSprite);

      scene.add(group);

      roomMeshesRef.current[layout.id] = {
        group, hitBox, glow, statusSprite,
        _layout: layout,
        _status: 'unknown',
        _baseColor: new THREE.Color(initPalette.base),
        _targetBaseColor: new THREE.Color(initPalette.base),
        _pulseOffset: Math.random() * Math.PI * 2,
        _modelScene: null,
      };
    });

    const allHitBoxes = Object.values(roomMeshesRef.current).map(m => m.hitBox);

    // ── Load 3D ICU Room GLTF Models into the 5 Rooms ────────
    const loader = new GLTFLoader();
    loader.load('/models/icu_room.glb', (gltf) => {
      const baseModel = gltf.scene;

      const box = new THREE.Box3().setFromObject(baseModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      baseModel.position.x = -center.x;
      baseModel.position.y = -box.min.y;
      baseModel.position.z = -center.z;

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = maxDim > 0 ? 6.8 / maxDim : 0.06;

      ROOM_LAYOUT.forEach(layout => {
        const m = roomMeshesRef.current[layout.id];
        if (m && m.group) {
          const roomModel = baseModel.clone(true);
          roomModel.scale.setScalar(targetScale);
          roomModel.position.y = 0.03;
          m.group.add(roomModel);
          m._modelScene = roomModel;
        }
      });
      setLoading(false);
    }, undefined, err => {
      console.error('Error loading 3D ICU floor model:', err);
      setLoading(false);
    });

    // ── Mouse & Touch Raycasting Handlers ─────────────────────
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;

    function onMouseDown(e) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
    }

    function onMouseUp(e) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 8 || dy > 8) isDragging = true;
    }

    function onMouseMove(e) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(allHitBoxes, false);

      let foundRoomId = null;
      if (hits.length > 0 && hits[0].object.userData) {
        foundRoomId = hits[0].object.userData.roomId;
      }

      hoveredRoomIdRef.current = foundRoomId;
      container.style.cursor = foundRoomId ? 'pointer' : 'default';
    }

    function onClick(e) {
      if (isDragging) return;

      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(allHitBoxes, false);

      if (hits.length > 0 && hits[0].object.userData && hits[0].object.userData.roomId) {
        const clickedRoomId = hits[0].object.userData.roomId;
        selectedRoomIdRef.current = clickedRoomId;
        if (onSelectRoomRef.current) {
          onSelectRoomRef.current(clickedRoomId);
        }
      }
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);

    // ── Animation Loop ───────────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Per-room hover scale & status glow pulsing
      Object.values(roomMeshesRef.current).forEach(m => {
        const isHovered = (m._layout.id === hoveredRoomIdRef.current);
        const targetScale = isHovered ? 1.04 : 1.0;
        m.group.scale.setScalar(THREE.MathUtils.lerp(m.group.scale.x, targetScale, delta * 8));

        m._baseColor.lerp(m._targetBaseColor, delta * 5);
        m.glow.material.color.copy(m._baseColor);

        let speed = 1.5;
        let amp = 0.25;
        if (m._status === 'alert') { speed = 4.0; amp = 0.45; }
        else if (m._status === 'warning') { speed = 2.2; amp = 0.35; }

        const pulse = Math.sin(elapsed * speed + m._pulseOffset) * amp + 0.5;
        m.glow.material.opacity = 0.25 + pulse * 0.45;
      });

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // ── Resize Handler ───────────────────────────────────────
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup ──────────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="scene-3d-container daytime-exterior-container">
      <div className="scene-3d-label daytime-label">
        <span className="scene-3d-label-icon">🏥</span>
        LEVEL 3 — ENCLOSED ICU FLOOR WING & HALLWAY CORRIDORS
      </div>

      {loading && (
        <div className="loading-3d-overlay">
          <div className="loading-spinner"></div>
          <span>LOADING ENCLOSED ICU FLOOR WING...</span>
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
