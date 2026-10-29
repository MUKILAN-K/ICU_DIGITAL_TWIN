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
  Maximize2,
  RotateCcw,
  Scan,
  Sliders,
  Expand,
  Eye,
  Layers,
} from 'lucide-react';

const STATUS_COLORS = {
  safe:    { base: 0x10b981, dim: 0x064e3b },
  warning: { base: 0xf59e0b, dim: 0x78350f },
  alert:   { base: 0xef4444, dim: 0x7f1d1d },
  unknown: { base: 0x0284c7, dim: 0x0f172a },
};

const ZOOM_PRESETS = {
  extra_zoom: {
    id: 'extra_zoom',
    label: '0.5x Full Room',
    badge: 'Extra Zoom',
    description: 'Ultra-wide panoramic coverage of the entire ICU room',
    camPos: new THREE.Vector3(0, 6.2, 11.5),
    target: new THREE.Vector3(0, 2.8, -0.5),
    fov: 96,
    multiplier: 0.5,
  },
  wide: {
    id: 'wide',
    label: '0.75x Wide',
    badge: 'Wide-Angle',
    description: 'Expanded interior view of room & equipment',
    camPos: new THREE.Vector3(0, 4.8, 8.5),
    target: new THREE.Vector3(0, 3.0, 0),
    fov: 82,
    multiplier: 0.75,
  },
  normal: {
    id: 'normal',
    label: '1.0x Normal',
    badge: 'Standard',
    description: 'Natural clinician eye-level walk-in view',
    camPos: new THREE.Vector3(0, 3.8, 6.0),
    target: new THREE.Vector3(0, 3.0, 0),
    fov: 70,
    multiplier: 1.0,
  },
  focus: {
    id: 'focus',
    label: '1.6x Focus',
    badge: 'Telemetry Unit',
    description: 'Close inspection of patient monitors & consoles',
    camPos: new THREE.Vector3(0.1, 2.8, 3.2),
    target: new THREE.Vector3(0, 2.5, 0),
    fov: 52,
    multiplier: 1.6,
  },
  bird_eye: {
    id: 'bird_eye',
    label: 'Bird’s Eye',
    badge: 'Top-Down',
    description: 'High overhead architectural ceiling view of room layout',
    camPos: new THREE.Vector3(0, 14.5, 0.05),
    target: new THREE.Vector3(0, 1.0, 0),
    fov: 80,
    multiplier: 0.6,
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
  const [isExtraZoom, setIsExtraZoom] = useState(false);
  const [activePreset, setActivePreset] = useState('normal');

  useEffect(() => { roomRef.current = room; }, [room]);

  // ── Set target animation smoothly ───────────────────────
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
    setIsExtraZoom(presetId === 'extra_zoom');

    flyTo(preset.camPos, preset.target, preset.fov);
  }, [flyTo]);

  // ── Toggle Extra Zoom (Wide Room Cover) ─────────────────
  const handleToggleExtraZoom = useCallback(() => {
    if (isExtraZoom) {
      handleSelectPreset('normal');
    } else {
      handleSelectPreset('extra_zoom');
    }
  }, [isExtraZoom, handleSelectPreset]);

  // ── Handle Slider Change (Continuous Zoom) ──────────────
  const handleSliderChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setZoomMultiplier(val);
    setActivePreset('custom');
    setIsExtraZoom(val <= 0.6);

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Calculate distance and FOV mapped from multiplier
    // At 0.4x: dist ~10.5, fov ~98
    // At 1.0x: dist ~4.5, fov ~68
    // At 2.2x: dist ~1.9, fov ~45
    const baseDist = 6.0;
    const targetDist = Math.max(1.5, Math.min(24.0, baseDist / val));

    // Dynamic FOV mapping: wider FOV when zoomed out to cover entire room
    let targetFov = 68;
    if (val < 1.0) {
      // Zooming out: widen FOV from 68 to 102
      targetFov = 68 + (1.0 - val) * 55;
    } else {
      // Zooming in: narrow FOV from 68 to 44
      targetFov = Math.max(44, 68 - (val - 1.0) * 20);
    }

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    if (dir.lengthSq() < 0.001) {
      dir.set(0, 0.45, 0.89);
    }
    dir.normalize();

    const newPos = new THREE.Vector3().addVectors(controls.target, dir.multiplyScalar(targetDist));
    // Keep above floor
    newPos.y = Math.max(0.4, newPos.y);

    flyTo(newPos, controls.target, targetFov);
  }, [flyTo]);

  // ── Step Zoom (+ / -) ──────────────────────────────────
  const handleStepZoom = useCallback((direction) => {
    const step = direction === 'in' ? 0.2 : -0.2;
    const nextVal = Math.max(0.4, Math.min(2.4, +(zoomMultiplier + step).toFixed(2)));
    handleSliderChange({ target: { value: nextVal } });
  }, [zoomMultiplier, handleSliderChange]);

  // ── Reset to Standard View ──────────────────────────────
  const handleReset = useCallback(() => {
    handleSelectPreset('normal');
  }, [handleSelectPreset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene Setup ───────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    // ── 2. Camera Setup ───────────────────────────────────
    const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 3.8, 6.0);
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

    // ── 4. OrbitControls with Expanded Zoom Range ────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 3.0, 0);

    // UNLOCKED ZOOM LIMITS: Allow complete room zoom out up to 32.0 units!
    controls.minDistance = 0.15;
    controls.maxDistance = 32.0;
    controls.maxPolarAngle = Math.PI / 1.88; // Don't clip under the floor
    controls.minPolarAngle = 0.05;          // Allow overhead bird's eye view
    controls.enablePan = true;              // Allow right-click / 2-finger panning across room
    controls.panSpeed = 0.8;
    controls.rotateSpeed = 0.7;
    controlsRef.current = controls;

    // ── 5. Bright Clinical Lighting ───────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));

    const ceilingSun = new THREE.DirectionalLight(0xfffbeb, 1.6);
    ceilingSun.position.set(0, 10, 0);
    scene.add(ceilingSun);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    fillLight.position.set(5, 6, 8);
    scene.add(fillLight);

    const statusLight = new THREE.PointLight(0x10b981, 2.5, 35);
    statusLight.position.set(0, 4.0, 0);
    scene.add(statusLight);
    statusLightRef.current = statusLight;

    // ── 6. Load 3D ICU Room GLTF Model ───────────────────
    const loader = new GLTFLoader();
    loader.load(
      '/models/icu_room.glb',
      (gltf) => {
        const model = gltf.scene;

        // Scale model first so bounding box accurately reflects world units
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

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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

    // ── 7. Dynamic Mouse Wheel Zoom Extension ────────────
    // When scrolling out past distance 5.0, dynamically widen FOV
    // so user gets limitless panoramic room coverage with the scroll wheel!
    let updateScheduled = false;
    const handleControlsChange = () => {
      if (animTargetRef.current) return; // Ignore during programmatic transitions

      const dist = camera.position.distanceTo(controls.target);

      // If scrolling far out, dynamically expand FOV up to 98°
      if (dist > 6.5) {
        const extraRatio = Math.min(1.0, (dist - 6.5) / 10.0);
        const dynamicFov = 70 + extraRatio * 28; // 70° -> 98°
        if (Math.abs(camera.fov - dynamicFov) > 0.5) {
          camera.fov = dynamicFov;
          camera.updateProjectionMatrix();
        }
      } else if (camera.fov > 70 && dist <= 6.5) {
        const restoreRatio = Math.max(0, dist / 6.5);
        camera.fov = 70 + (camera.fov - 70) * restoreRatio;
        camera.updateProjectionMatrix();
      }

      // Sync UI slider state (throttled)
      if (!updateScheduled) {
        updateScheduled = true;
        requestAnimationFrame(() => {
          const effectiveMul = +(Math.max(0.4, Math.min(2.4, 6.0 / Math.max(1.0, dist)))).toFixed(2);
          setZoomMultiplier(effectiveMul);
          setIsExtraZoom(dist > 7.5 || camera.fov >= 85);
          updateScheduled = false;
        });
      }
    };

    controls.addEventListener('change', handleControlsChange);

    // ── 8. Animation Loop ────────────────────────────────
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

      // Update room status ambient light glow inside room
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
        statusLightRef.current.intensity = 1.5 + pulse * 1.0;
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
    room_id: 'ICU-101',
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
      {/* Level Label */}
      <div className="scene-3d-label daytime-label">
        <span className="scene-3d-label-icon">🛏️</span>
        LEVEL 4 — {r.room_id} 3D OPERATING / ICU ROOM INTERIOR
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
        <Scan size={13} color="#38bdf8" />
        <span>
          <strong>Scroll or Extra Zoom</strong> to cover entire room • <strong>Right-Click Drag</strong> to pan • <strong>Left-Click Drag</strong> to rotate
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          EXTRA ZOOM & CAMERA NAVIGATION CONTROL BAR (Bottom Center)
      ══════════════════════════════════════════════════════════════ */}
      <div className="icu-zoom-control-bar" role="toolbar" aria-label="ICU Room Zoom Controls">
        {/* Primary Glowing 'Extra Zoom' Toggle Button */}
        <button
          className={`icu-extra-zoom-toggle-btn ${isExtraZoom ? 'active' : ''}`}
          onClick={handleToggleExtraZoom}
          title="Toggle Extra Zoom Mode: Expands camera to an ultra-wide panoramic angle that covers the entire ICU room"
          id="btn-extra-zoom-toggle"
        >
          <Expand size={15} />
          <span>EXTRA ZOOM</span>
          <span className="icu-extra-zoom-badge">
            {isExtraZoom ? 'FULL ROOM ON' : 'WIDE COVER'}
          </span>
        </button>

        <div className="icu-zoom-divider" />

        {/* Quick Zoom Presets */}
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

        {/* Continuous Zoom Slider & Step Buttons */}
        <div className="icu-slider-container">
          <button
            className="icu-step-btn"
            onClick={() => handleStepZoom('out')}
            title="Zoom Out (Expand Room View)"
            id="btn-zoom-out"
          >
            <ZoomOut size={14} />
          </button>

          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={zoomMultiplier}
            onChange={handleSliderChange}
            className="icu-zoom-slider-range"
            title={`Zoom Level: ${zoomMultiplier.toFixed(1)}x`}
            id="slider-room-zoom"
          />

          <button
            className="icu-step-btn"
            onClick={() => handleStepZoom('in')}
            title="Zoom In (Inspect Equipment)"
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
            title="Reset Camera to Standard View"
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
            title="Open 60-Minute Detailed Chart Analytics"
          >
            <LineChart size={13} />
            <span>60-Min Analytics</span>
          </button>
        </div>

        <h4 className="hud-room-name">
          {r.room_id === 'ICU-101' && 'Isolation Unit 1 (Negative Pressure)'}
          {r.room_id === 'ICU-102' && 'General ICU Room A'}
          {r.room_id === 'ICU-103' && 'General ICU Room B'}
          {r.room_id === 'ICU-104' && 'High Occupancy Suite'}
          {r.room_id === 'ICU-105' && 'Post-Op Recovery Room'}
          {!['ICU-101', 'ICU-102', 'ICU-103', 'ICU-104', 'ICU-105'].includes(r.room_id) && 'ICU Operating Suite'}
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
