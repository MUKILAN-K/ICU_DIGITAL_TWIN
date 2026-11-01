import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Wind,
  Thermometer,
  Droplets,
  Activity,
  LineChart,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scan,
  Maximize2,
  Lock,
  Compass,
} from 'lucide-react';

const STATUS_COLORS = {
  safe:    { base: 0x10b981, dim: 0x064e3b },
  warning: { base: 0xf59e0b, dim: 0x78350f },
  alert:   { base: 0xef4444, dim: 0x7f1d1d },
  unknown: { base: 0x0284c7, dim: 0x0f172a },
};

// ── Bounded Interior Presets (100% Inside the Room Envelope) ─────────
const ZOOM_PRESETS = {
  full_room: {
    id: 'full_room',
    label: 'Room Overview',
    badge: 'Interior Bounded',
    description: 'Panoramic clinical vantage from inside the doorway showing entire room, bed, and consoles',
    camPos: new THREE.Vector3(0, 2.7, 4.6),
    target: new THREE.Vector3(0, 1.8, -0.4),
    fov: 74,
    multiplier: 1.0,
  },
  bedside: {
    id: 'bedside',
    label: 'Bedside View',
    badge: 'Clinical Care',
    description: 'Bedside patient care perspective for close observation',
    camPos: new THREE.Vector3(1.3, 1.9, 1.9),
    target: new THREE.Vector3(0, 1.6, -0.2),
    fov: 58,
    multiplier: 1.35,
  },
  telemetry: {
    id: 'telemetry',
    label: 'Monitors & Vitals',
    badge: 'Diagnostic',
    description: 'Focused inspection of vital signs telemetry, anesthesia console, and ventilator',
    camPos: new THREE.Vector3(-1.3, 2.0, 1.7),
    target: new THREE.Vector3(-0.5, 1.8, -0.6),
    fov: 52,
    multiplier: 1.6,
  },
  elevated: {
    id: 'elevated',
    label: 'Elevated Clinic',
    badge: 'Upper Angle',
    description: 'Elevated clinical angle looking across the ICU suite beneath ceiling plane',
    camPos: new THREE.Vector3(0.1, 4.0, 3.8),
    target: new THREE.Vector3(0, 1.6, -0.4),
    fov: 68,
    multiplier: 1.1,
  },
};

export default function ICURoomInterior3D({ room, onOpenAnalytics }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const roomRef = useRef(room);
  const statusLightRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animTargetRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [zoomMultiplier, setZoomMultiplier] = useState(1.0);
  const [activePreset, setActivePreset] = useState('full_room');

  useEffect(() => { roomRef.current = room; }, [room]);

  // ── Smooth Animation to New Camera Target ─────────────────
  const flyTo = useCallback((camPos, target, fov) => {
    animTargetRef.current = {
      camPos: camPos ? camPos.clone() : null,
      target: target ? target.clone() : null,
      fov: fov !== undefined ? fov : null,
    };
  }, []);

  // ── Handle Preset Selection ─────────────────────────────
  const handleSelectPreset = useCallback((presetId) => {
    const preset = ZOOM_PRESETS[presetId];
    if (!preset) return;

    setActivePreset(presetId);
    setZoomMultiplier(preset.multiplier);
    flyTo(preset.camPos, preset.target, preset.fov);
  }, [flyTo]);

  // ── Continuous Zoom Slider (Strictly bounded inside room) ─
  const handleSliderChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setZoomMultiplier(val);
    setActivePreset('custom');

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Base target distance inside room: from 2.4 (zoomed in) to 5.4 (zoomed out)
    const baseDist = 4.8;
    const targetDist = Math.max(2.2, Math.min(5.6, baseDist / val));

    // Smooth bounded FOV adjustment: 50° to 76° (never wide enough to distort outside walls)
    const targetFov = THREE.MathUtils.clamp(74 - (val - 1.0) * 22, 50, 76);

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 0.001) {
      dir.set(0, 0.45, 0.89);
    }
    dir.normalize();

    const newPos = new THREE.Vector3().addVectors(controls.target, dir.multiplyScalar(targetDist));
    // Hard clamp to keep camera safely inside the room boundaries
    newPos.x = THREE.MathUtils.clamp(newPos.x, -3.8, 3.8);
    newPos.y = THREE.MathUtils.clamp(newPos.y, 0.8, 4.6);
    newPos.z = THREE.MathUtils.clamp(newPos.z, -3.6, 4.8);

    flyTo(newPos, controls.target, targetFov);
  }, [flyTo]);

  // ── Step Zoom (+ / -) ──────────────────────────────────
  const handleStepZoom = useCallback((direction) => {
    const step = direction === 'in' ? 0.15 : -0.15;
    const nextVal = Math.max(0.8, Math.min(2.0, +(zoomMultiplier + step).toFixed(2)));
    handleSliderChange({ target: { value: nextVal } });
  }, [zoomMultiplier, handleSliderChange]);

  // ── Reset to Standard Full Room Overview ────────────────
  const handleReset = useCallback(() => {
    handleSelectPreset('full_room');
  }, [handleSelectPreset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene Setup ───────────────────────────────────
    const scene = new THREE.Scene();
    // Warm clinical slate backdrop that seamlessly matches the hospital suite
    scene.background = new THREE.Color(0x0f172a);

    // ── 2. Camera Setup (Bounded Inside Room) ─────────────
    const camera = new THREE.PerspectiveCamera(74, container.clientWidth / container.clientHeight, 0.1, 80);
    camera.position.set(0, 2.7, 4.6);
    cameraRef.current = camera;

    // ── 3. Renderer ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ── 4. OrbitControls with STRICT Room Boundaries ─────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.target.set(0, 1.8, -0.4);

    // STRICT INTERIOR LIMITS: Camera cannot back through the rear wall!
    controls.minDistance = 1.4;
    controls.maxDistance = 5.6; // Strictly stops before penetrating back wall
    controls.maxPolarAngle = Math.PI / 2.05; // Never clips beneath floor
    controls.minPolarAngle = 0.25;          // Never clips through ceiling
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controls.rotateSpeed = 0.6;
    controlsRef.current = controls;

    // ── 5. Bright Clinical Lighting ───────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));

    const ceilingSun = new THREE.DirectionalLight(0xfffbeb, 1.8);
    ceilingSun.position.set(0, 8, 0);
    scene.add(ceilingSun);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.85);
    fillLight.position.set(4, 5, 5);
    scene.add(fillLight);

    const statusLight = new THREE.PointLight(0x10b981, 2.0, 25);
    statusLight.position.set(0, 3.5, 0);
    scene.add(statusLight);
    statusLightRef.current = statusLight;

    // ── 6. Load 3D ICU Room GLTF Model ───────────────────
    const loader = new GLTFLoader();
    loader.load(
      '/models/icu_room.glb',
      (gltf) => {
        const model = gltf.scene;

        // Scale model accurately so room dimensions fit clinical world units
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scaleFactor = 22 / maxDim;
          model.scale.setScalar(scaleFactor);
        }

        // Align model center to (0, 0) and floor exactly to Y = 0
        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        model.position.x = -scaledCenter.x;
        model.position.y = -scaledBox.min.y;
        model.position.z = -scaledCenter.z;

        // DoubleSide rendering ensures no wall or fixture becomes invisible void
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });

        scene.add(model);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Error loading 3D ICU room model:', err);
        setLoading(false);
      }
    );

    // ── 7. Orbit Controls Change Listener ────────────────
    let updateScheduled = false;
    const handleControlsChange = () => {
      if (animTargetRef.current) return;

      const dist = camera.position.distanceTo(controls.target);

      // Throttled UI sync
      if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
          const effectiveMul = +(Math.max(0.8, Math.min(2.0, 4.8 / Math.max(1.0, dist)))).toFixed(2);
          setZoomMultiplier(effectiveMul);
          updateScheduled = false;
        });
      }
    };

    controls.addEventListener('change', handleControlsChange);

    // ── 8. Animation Loop with Hard Camera Enclosure Clamping ─
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Smooth camera transition if target is set
      if (animTargetRef.current) {
        const { camPos, target, fov } = animTargetRef.current;
        let done = true;

        if (camPos) {
          camera.position.lerp(camPos, 0.08);
          if (camera.position.distanceTo(camPos) > 0.02) done = false;
        }
        if (target) {
          controls.target.lerp(target, 0.08);
          if (controls.target.distanceTo(target) > 0.02) done = false;
        }
        if (fov !== null && fov !== undefined) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, fov, 0.08);
          camera.updateProjectionMatrix();
          if (Math.abs(camera.fov - fov) > 0.2) done = false;
        }

        if (done) {
          animTargetRef.current = null;
        }
      }

      // Hard Boundary Safety Clamping: Ensure camera never leaves room enclosure
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -3.9, 3.9);
      camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.7, 4.6);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -3.8, 4.8);

      // Keep OrbitControls target centered in patient care zone
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -1.8, 1.8);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.8, 2.8);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -2.5, 1.5);

      // Pulse room status ambient light
      if (statusLightRef.current) {
        const currRoom = roomRef.current;
        const status = currRoom ? currRoom.status : 'safe';
        const palette = STATUS_COLORS[status] || STATUS_COLORS.unknown;
        const targetColor = new THREE.Color(palette.base);

        let speed = 1.5;
        if (status === 'alert') speed = 4.0;
        else if (status === 'warning') speed = 2.2;

        const pulse = Math.sin(elapsed * speed) * 0.3 + 0.7;
        statusLightRef.current.color.lerp(targetColor, delta * 4);
        statusLightRef.current.intensity = 1.6 + pulse * 0.8;
      }

      controls.update();
      renderer.render(scene, camera);
    }

    animate();

    // ── 9. Resize Handler ────────────────────────────────
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ── 10. Cleanup ──────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', handleControlsChange);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const r = room || {
    room_id: 'ICU-03',
    status: 'safe',
    latest_reading: {
      pm25: 12.4,
      pm10: 18.2,
      co2: 520,
      temperature: 21.5,
      humidity: 45.0,
      timestamp: new Date().toISOString()
    }
  };

  const reading = r.latest_reading || {};

  return (
    <div className="scene-3d-container daytime-exterior-container" style={{ width: '100%', height: '100%', borderRadius: 0, border: 'none' }}>
      {/* Top Banner Tag */}
      <div className="scene-3d-label daytime-label">
        <span className="scene-3d-label-icon">🛏️</span>
        LEVEL 4 — {r.room_id} 3D CLINICAL SUITE • INTERIOR PERSPECTIVE
      </div>

      {loading && (
        <div className="loading-3d-overlay">
          <div className="loading-spinner"></div>
          <span>ENTERING 3D ICU ROOM INTERIOR...</span>
        </div>
      )}

      {/* 3D Canvas Host Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Navigation Tip Toast */}
      <div className="icu-nav-hint-toast">
        <Lock size={12} color="#10b981" />
        <span>
          <strong>Interior Bounded View</strong> • Left-Click Drag to rotate inside room • Right-Click to pan • Scroll to zoom (strictly enclosed)
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CLINICAL INTERIOR CAMERA TOOLBAR (Bottom Center)
      ══════════════════════════════════════════════════════════════ */}
      <div className="icu-zoom-control-bar" role="toolbar" aria-label="ICU Room Zoom Controls">
        {/* Status Badge: Interior Enclosed */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#10b981',
          }}
          title="Camera is locked strictly within the room walls to prevent going out of bounds"
        >
          <Lock size={13} />
          <span>ROOM BOUNDS LOCKED</span>
        </div>

        <div className="icu-zoom-divider" />

        {/* Quick Clinical Camera Presets */}
        <div className="icu-zoom-presets-group">
          {Object.values(ZOOM_PRESETS).map((p) => (
            <button
              key={p.id}
              className={`icu-preset-btn ${activePreset === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPreset(p.id)}
              title={p.description}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="icu-zoom-divider" />

        {/* Bounded Zoom Slider & Step Controls */}
        <div className="icu-slider-container">
          <button
            className="icu-step-btn"
            onClick={() => handleStepZoom('out')}
            title="Zoom Out (Bounded inside room)"
            id="btn-zoom-out"
          >
            <ZoomOut size={14} />
          </button>

          <input
            type="range"
            min="0.8"
            max="2.0"
            step="0.05"
            value={zoomMultiplier}
            onChange={handleSliderChange}
            className="icu-zoom-slider-range"
            title={`Zoom Level: ${zoomMultiplier.toFixed(2)}x`}
            id="slider-room-zoom"
          />

          <button
            className="icu-step-btn"
            onClick={() => handleStepZoom('in')}
            title="Zoom In (Inspect Bed & Monitor)"
            id="btn-zoom-in"
          >
            <ZoomIn size={14} />
          </button>

          <div className="icu-zoom-readout">
            {zoomMultiplier.toFixed(1)}x
          </div>

          <button
            className="icu-reset-btn"
            onClick={handleReset}
            title="Reset to Full Room Overview"
            id="btn-zoom-reset"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          FLOATING HUD TELEMETRY CARD (Top Right)
      ══════════════════════════════════════════════════════════════ */}
      <div className="room-interior-hud-card">
        <div className="hud-card-header">
          <div className="hud-room-badge">{r.room_id}</div>
          <div className={`hud-status-tag status-${r.status}`}>
            {r.status === 'safe' && <ShieldCheck size={14} />}
            {r.status === 'warning' && <AlertTriangle size={14} />}
            {r.status === 'alert' && <AlertCircle size={14} />}
            <span>{(r.status || 'safe').toUpperCase()}</span>
          </div>

          <button
            className="hud-analytics-btn"
            onClick={onOpenAnalytics}
            title="Open Detailed Analytics"
          >
            <LineChart size={13} />
            <span>Analytics</span>
          </button>
        </div>

        <h4 className="hud-room-name">
          {r.room_id === 'ICU-01' && 'Isolation Unit 1 (Negative Pressure)'}
          {r.room_id === 'ICU-02' && 'Cardiothoracic Intensive Suite'}
          {r.room_id === 'ICU-03' && 'Operating & Trauma Recovery Suite'}
          {r.room_id === 'ICU-04' && 'High-Dependency Respiratory Unit'}
          {r.room_id === 'ICU-05' && 'Post-Surgical Critical Care'}
          {!['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05'].includes(r.room_id) && 'ICU Operating Suite'}
        </h4>

        <div className="hud-metrics-grid">
          <div className="hud-metric-box">
            <div className="metric-label"><Wind size={12} /> PM2.5</div>
            <div className="metric-val">
              {reading.pm25 !== undefined ? reading.pm25.toFixed(2) : '--'}{' '}
              <span className="unit">µg/m³</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Wind size={12} /> PM10</div>
            <div className="metric-val">
              {reading.pm10 !== undefined ? reading.pm10.toFixed(2) : '--'}{' '}
              <span className="unit">µg/m³</span>
            </div>
          </div>

          <div className="hud-metric-box full-width">
            <div className="metric-label"><Activity size={12} /> CO2 Level</div>
            <div className="metric-val">
              {reading.co2 !== undefined ? reading.co2.toFixed(1) : '--'}{' '}
              <span className="unit">ppm</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Thermometer size={12} /> Temp</div>
            <div className="metric-val">
              {reading.temperature !== undefined ? reading.temperature.toFixed(2) : '--'}{' '}
              <span className="unit">°C</span>
            </div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Droplets size={12} /> Humidity</div>
            <div className="metric-val">
              {reading.humidity !== undefined ? reading.humidity.toFixed(2) : '--'}{' '}
              <span className="unit">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
