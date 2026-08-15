import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ShieldCheck, AlertCircle, AlertTriangle, Wind, Thermometer, Droplets, Activity, LineChart } from 'lucide-react';

const STATUS_COLORS = {
  safe:    { base: 0x10b981, dim: 0x064e3b },
  warning: { base: 0xf59e0b, dim: 0x78350f },
  alert:   { base: 0xef4444, dim: 0x7f1d1d },
  unknown: { base: 0x0284c7, dim: 0x0f172a },
};

export default function ICURoomInterior3D({ room, onOpenAnalytics }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const roomRef = useRef(room);
  const statusLightRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { roomRef.current = room; }, [room]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene Setup (Inside Room Environment) ───────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Clean slate white room background

    // First-person eye-level camera positioned INSIDE the 3D room model
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.7, 1.2);

    // ── Renderer ───────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // ── OrbitControls (Constrained to Interior Navigation) ─────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.4, -0.8);
    controls.minDistance = 0.2;
    controls.maxDistance = 5.0; // Prevent zooming outside the room walls!
    controls.maxPolarAngle = Math.PI / 1.85;
    controls.minPolarAngle = 0.2;

    // ── Bright Interior Lighting ─────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 1.15));

    const ceilingSun = new THREE.DirectionalLight(0xfffbeb, 1.5);
    ceilingSun.position.set(0, 8, 0);
    scene.add(ceilingSun);

    const statusLight = new THREE.PointLight(0x10b981, 2.5, 30);
    statusLight.position.set(0, 3.5, 0);
    scene.add(statusLight);
    statusLightRef.current = statusLight;

    // ── Load 3D ICU Room GLTF Model ─────────────────────
    const loader = new GLTFLoader();
    loader.load(
      '/models/icu_room.glb',
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Align model center to origin and floor to Y=0
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        // Scale model to encompass the camera (~22 units wide)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scaleFactor = 22 / maxDim;
          model.scale.setScalar(scaleFactor);
        }

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

    // ── Animation Loop ───────────────────────────────────
    const clock = new THREE.Clock();

    function animate() {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

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

    // ── Resize Handler ───────────────────────────────────
    function onResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      window.removeEventListener('resize', onResize);
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
    <div className="scene-3d-container daytime-exterior-container">
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

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating HUD telemetry card on right side */}
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
            <LineChart size={14} />
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
            <div className="metric-val">{reading.pm25 !== undefined ? reading.pm25.toFixed(2) : '--'} <span className="unit">µg/m³</span></div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Wind size={12} /> PM10</div>
            <div className="metric-val">{reading.pm10 !== undefined ? reading.pm10.toFixed(2) : '--'} <span className="unit">µg/m³</span></div>
          </div>

          <div className="hud-metric-box full-width">
            <div className="metric-label"><Activity size={12} /> CO2 Level</div>
            <div className="metric-val">{reading.co2 !== undefined ? reading.co2.toFixed(1) : '--'} <span className="unit">ppm</span></div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Thermometer size={12} /> Temp</div>
            <div className="metric-val">{reading.temperature !== undefined ? reading.temperature.toFixed(2) : '--'} <span className="unit">°C</span></div>
          </div>

          <div className="hud-metric-box">
            <div className="metric-label"><Droplets size={12} /> Humidity</div>
            <div className="metric-val">{reading.humidity !== undefined ? reading.humidity.toFixed(2) : '--'} <span className="unit">%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
