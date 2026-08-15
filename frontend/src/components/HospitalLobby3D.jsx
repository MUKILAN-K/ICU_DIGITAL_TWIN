import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Text Sprite Generator
function createTextSprite(text, color = '#0284c7', fontSize = 42, canvasW = 512, canvasH = 96) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.font = `bold ${fontSize}px "Rajdhani", "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeText(text, canvasW / 2, canvasH / 2);

  ctx.fillStyle = color;
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(6.0, 1.1, 1);
  return sprite;
}

// ─── Procedural Lobby Furniture Constructors ─────────────────────────

// Potted Indoor Plant
function createPottedPlant(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Ceramic Pot
  const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.5, 1.2, 16), potMat);
  pot.position.y = 0.6;
  pot.castShadow = true;
  group.add(pot);

  // Ficus Leaves
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
  [
    [0, 1.8, 0, 0.9], [0.3, 2.3, 0.2, 0.7], [-0.3, 2.1, -0.2, 0.75],
    [0.1, 2.7, -0.1, 0.55]
  ].forEach(([lx, ly, lz, r]) => {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    leaf.position.set(lx, ly, lz);
    leaf.castShadow = true;
    group.add(leaf);
  });

  return group;
}

// Lounge Sofa Bench
function createSofaBench(x, z, rotationY) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const seatMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });

  // Cushion Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.45, 1.6), seatMat);
  seat.position.y = 0.6;
  seat.castShadow = true;
  group.add(seat);

  // Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.35), seatMat);
  back.position.set(0, 1.2, -0.65);
  back.castShadow = true;
  group.add(back);

  // Chrome Legs
  [[-1.9, 0.3, 0.6], [1.9, 0.3, 0.6], [-1.9, 0.3, -0.6], [1.9, 0.3, -0.6]].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), chromeMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  return group;
}

// Reception Information Counter Desk
function createReceptionDesk(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const deskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });

  // Curving Counter Top
  const counter = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.15, 2.2), deskMat);
  counter.position.y = 0.58;
  counter.castShadow = true;
  group.add(counter);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.15, 2.3), woodMat);
  trim.position.y = 1.15;
  group.add(trim);

  // Desktop Computer Monitor
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.08), screenMat);
  screen.position.set(-1.5, 1.6, 0.2);
  group.add(screen);

  const sign = createTextSprite('RECEPTION & ADMISSIONS', '#0284c7', 36, 450, 64);
  sign.position.set(0, 1.9, 1.15);
  sign.scale.set(4.5, 0.85, 1);
  group.add(sign);

  return group;
}

// Walking Visitor Silhouette Mesh
function createWalkingPerson(x, z, rotationY, colorHex) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 1.4, 8), mat);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mat);
  head.position.y = 2.0;
  head.castShadow = true;
  group.add(head);

  return group;
}

// ─── Main Hospital Lobby Component ───────────────────────────────────

export default function HospitalLobby3D({ rooms, onEnterICUFloor }) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const onEnterICUFloorRef = useRef(onEnterICUFloor);

  const isTransitioningRef = useRef(false);
  const transitionProgressRef = useRef(0);

  useEffect(() => { onEnterICUFloorRef.current = onEnterICUFloor; }, [onEnterICUFloor]);

  const icuDoorRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene Setup (Spacious Bright White Lobby) ─────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Bright clean sky white
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.007);

    // ── Camera ────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 120);
    const defaultCamPos = new THREE.Vector3(0, 4.2, 14.5);
    const defaultTarget = new THREE.Vector3(0, 2.5, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ── OrbitControls ─────────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minPolarAngle = 0.15;
    controls.target.copy(defaultTarget);

    // ── Lighting (Bright Ambient & Soft Spotlights) ───────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));

    const mainSun = new THREE.DirectionalLight(0xfffbeb, 1.4);
    mainSun.position.set(5, 18, 12);
    mainSun.castShadow = true;
    scene.add(mainSun);

    const ceilingLight1 = new THREE.PointLight(0x38bdf8, 1.5, 24);
    ceilingLight1.position.set(-6, 7, 2);
    scene.add(ceilingLight1);

    const ceilingLight2 = new THREE.PointLight(0x0284c7, 1.5, 24);
    ceilingLight2.position.set(6, 7, 2);
    scene.add(ceilingLight2);

    // ── Large Spacious Lobby Geometry ─────────────────────────
    const lobbyGroup = new THREE.Group();
    scene.add(lobbyGroup);

    // Polished White Marble Floor (32m x 24m)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.08 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 24), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    lobbyGroup.add(floor);

    // Back Architectural Wall (Pristine White with Blue Trim)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(32, 12), wallMat);
    backWall.position.set(0, 6, -10);
    lobbyGroup.add(backWall);

    // Side Glass Window Walls
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.35, roughness: 0.1 });
    const sideWallL = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), windowMat);
    sideWallL.rotation.y = Math.PI / 2;
    sideWallL.position.set(-16, 6, 2);
    lobbyGroup.add(sideWallL);

    const sideWallR = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), windowMat);
    sideWallR.rotation.y = -Math.PI / 2;
    sideWallR.position.set(16, 6, 2);
    lobbyGroup.add(sideWallR);

    // Reception Desk
    lobbyGroup.add(createReceptionDesk(-7.5, -2));

    // Waiting Lounges
    lobbyGroup.add(createSofaBench(7.5, 3, Math.PI / 2));
    lobbyGroup.add(createSofaBench(7.5, -3, Math.PI / 2));

    // Indoor Potted Plants
    lobbyGroup.add(createPottedPlant(-14, -8));
    lobbyGroup.add(createPottedPlant(14, -8));
    lobbyGroup.add(createPottedPlant(-14, 8));
    lobbyGroup.add(createPottedPlant(14, 8));

    // Walking Visitors / Staff
    const person1 = createWalkingPerson(-3.5, 4, 0.4, 0x1e293b);
    const person2 = createWalkingPerson(3.5, 2, -0.6, 0x0284c7);
    lobbyGroup.add(person1);
    lobbyGroup.add(person2);

    // Facility Directory Board
    const dirBoardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const dirBoard = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 0.25), dirBoardMat);
    dirBoard.position.set(-9.5, 4.5, -9.8);
    lobbyGroup.add(dirBoard);

    const dirText = createTextSprite('FACILITY DIRECTORY\nFLOOR 3: CRITICAL CARE ICU WING', '#00f0ff', 36, 480, 80);
    dirText.position.set(-9.5, 4.5, -9.6);
    dirText.scale.set(4.8, 1.0, 1);
    lobbyGroup.add(dirText);

    // ── HOTSPOT: ICU MONITORING WING DOUBLE DOORWAY PORTAL ─────
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 3.2, -9.8);

    // Portal Frame
    const frameGeo = new THREE.BoxGeometry(7.5, 6.2, 0.5);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
    const portalFrame = new THREE.Mesh(frameGeo, frameMat);
    doorGroup.add(portalFrame);

    // Glowing Door Aperture
    const doorGeo = new THREE.PlaneGeometry(6.6, 5.5);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.z = 0.28;
    doorGroup.add(doorMesh);

    // Glowing Wireframe Border
    const doorWireMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.9 });
    const doorWire = new THREE.Mesh(new THREE.BoxGeometry(6.8, 5.7, 0.6), doorWireMat);
    doorGroup.add(doorWire);

    // Labels
    const doorTitleSprite = createTextSprite('CRITICAL CARE ICU MONITORING WING', '#00f0ff', 42, 512, 64);
    doorTitleSprite.position.set(0, 4.0, 0.35);
    doorTitleSprite.scale.set(5.5, 0.9, 1);
    doorGroup.add(doorTitleSprite);

    const doorHintSprite = createTextSprite('CLICK DOOR TO ENTER ICU FLOOR ➔', '#ffffff', 34, 512, 48);
    doorHintSprite.position.set(0, -3.6, 0.35);
    doorHintSprite.scale.set(5.8, 0.75, 1);
    doorGroup.add(doorHintSprite);

    const doorLight = new THREE.PointLight(0x00f0ff, 2.2, 16);
    doorLight.position.set(0, 0, 2);
    doorGroup.add(doorLight);

    lobbyGroup.add(doorGroup);

    icuDoorRef.current = {
      group: doorGroup,
      mesh: doorMesh,
      wire: doorWire,
      light: doorLight,
      title: doorTitleSprite,
    };

    // ── Mouse & Raycaster Handlers ───────────────────────────
    let mouseDownPos = { x: 0, y: 0 };
    let isDragging = false;

    function onMouseDown(e) {
      mouseDownPos = { x: e.clientX, y: e.clientY };
      isDragging = false;
    }

    function onMouseUp(e) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx > 4 || dy > 4) isDragging = true;
    }

    function onMouseMove(e) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(lobbyGroup.children, true);

      if (hits.length > 0 && !isTransitioningRef.current) {
        container.style.cursor = 'pointer';
        doorMesh.scale.set(1.03, 1.03, 1);
      } else {
        container.style.cursor = 'default';
        doorMesh.scale.set(1.0, 1.0, 1);
      }
    }

    function onClick(e) {
      if (isDragging || isTransitioningRef.current) return;

      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(lobbyGroup.children, true);

      if (hits.length > 0) {
        // Camera fly-in transition into ICU doorway
        isTransitioningRef.current = true;
        transitionProgressRef.current = 0;
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

      // Person subtle walking animation
      person1.position.z = 4 + Math.sin(elapsed * 0.8) * 1.5;
      person2.position.x = 3.5 + Math.cos(elapsed * 0.7) * 1.8;

      // ICU Doorway status pulse
      if (icuDoorRef.current) {
        const door = icuDoorRef.current;
        const hasAlert = rooms.some(r => r.status === 'alert');
        const hasWarning = rooms.some(r => r.status === 'warning');

        let hexColor = 0x00f0ff;
        let speed = 1.5;

        if (hasAlert) { hexColor = 0xff0055; speed = 4.0; }
        else if (hasWarning) { hexColor = 0xffb800; speed = 2.2; }

        const targetColor = new THREE.Color(hexColor);
        const pulse = Math.sin(elapsed * speed) * 0.35 + 0.65;

        door.mesh.material.emissive.lerp(targetColor, delta * 4);
        door.mesh.material.emissiveIntensity = 0.5 + pulse * 0.5;
        door.wire.material.color.lerp(targetColor, delta * 4);
        door.light.color.lerp(targetColor, delta * 4);
      }

      // Fly-in Camera Transition
      if (isTransitioningRef.current) {
        transitionProgressRef.current += delta * 1.3;
        const t = Math.min(1.0, transitionProgressRef.current);
        const easeT = t * t * (3 - 2 * t);

        const targetCamPos = new THREE.Vector3(0, 3.2, -8.0);
        const targetLook = new THREE.Vector3(0, 3.2, -12.0);

        camera.position.lerpVectors(defaultCamPos, targetCamPos, easeT);
        controls.target.lerpVectors(defaultTarget, targetLook, easeT);
        controls.update();

        if (t >= 1.0) {
          isTransitioningRef.current = false;
          if (onEnterICUFloorRef.current) {
            onEnterICUFloorRef.current();
          }
        }
      } else {
        controls.update();
      }

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
        LEVEL 2 — HOSPITAL MAIN LOBBY & INTERIOR HUB
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
