import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// ============================================
// Config
// ============================================
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const CONFIG = {
  // Particle network
  particleCount: isMobile ? 80 : 200,
  connectionDistance: isMobile ? 2.0 : 2.8,
  particleDrift: 0.0003,
  bounds: 14,

  // Mouse interaction
  mouseRadius: 4,
  mouseForce: 0.04,
  mouseGlowSize: 0.3,

  // Noise terrain
  terrainWidth: isMobile ? 60 : 100,
  terrainDepth: isMobile ? 30 : 50,
  terrainSegW: isMobile ? 40 : 80,
  terrainSegD: isMobile ? 20 : 40,
  waveSpeed: 0.4,
  waveAmplitude: 1.5,
  waveFrequency: 0.15,

  // Camera
  cameraZ: 18,
  cameraTilt: 0.03,
  scrollParallax: 0.003,

  // Colors
  accent: new THREE.Color(0x6366f1),
  accentBright: new THREE.Color(0x818cf8),
  terrainColor: new THREE.Color(0x6366f1),
  bgColor: new THREE.Color(0x0a0a0e),
};

// ============================================
// State
// ============================================
let scene, camera, renderer, canvas, clock, composer;
let groupParticles, groupTerrain;
let pointsMesh, linesMesh, terrainMesh, mouseGlowMesh;
let positions, velocities;
let linePositions, lineColors;
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let mouseWorld = new THREE.Vector3();
let scrollProgress = 0;
let terrainPositions;

// ============================================
// Simple 3D noise (simplex-like)
// ============================================
function noise3D(x, y, z) {
  const p = x * 12.9898 + y * 78.233 + z * 37.719;
  const s1 = Math.sin(p) * 43758.5453;
  const s2 = Math.sin(p * 1.13) * 28471.213;
  return ((s1 - Math.floor(s1)) + (s2 - Math.floor(s2))) * 0.5 - 0.5;
}

function fbm(x, y, z) {
  let val = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    val += amp * Math.sin(x * freq + z * 0.5) * Math.cos(y * freq * 0.7 + z * 0.3);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

// ============================================
// Init
// ============================================
export function initParticles(canvasEl) {
  canvas = canvasEl;
  clock = new THREE.Clock();

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.set(0, 6, CONFIG.cameraZ);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(CONFIG.bgColor, 1);

  // Post-processing: bloom
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.8,   // strength — subtle cinematic glow
    0.4,   // radius — how far bloom spreads
    0.85   // threshold — only bright areas bloom
  );
  composer.addPass(bloomPass);

  // Groups
  groupParticles = new THREE.Group();
  groupTerrain = new THREE.Group();
  scene.add(groupTerrain);
  scene.add(groupParticles);

  // Build scene
  createTerrain();
  createParticles();
  createLines();
  createMouseGlow();

  // Events
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (!isMobile) {
    window.addEventListener("mousemove", onMouseMove);
  }

  animate();

  // Signal that Three.js is ready
  window.dispatchEvent(new Event("three-ready"));
}

// ============================================
// Terrain (animated wireframe landscape)
// ============================================
function createTerrain() {
  const geometry = new THREE.PlaneGeometry(
    CONFIG.terrainWidth,
    CONFIG.terrainDepth,
    CONFIG.terrainSegW,
    CONFIG.terrainSegD
  );
  geometry.rotateX(-Math.PI * 0.5);

  terrainPositions = geometry.attributes.position.array;

  const material = new THREE.MeshBasicMaterial({
    color: CONFIG.terrainColor,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });

  terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.position.y = -6;
  groupTerrain.add(terrainMesh);
}

function updateTerrain(time) {
  const posArray = terrainMesh.geometry.attributes.position.array;
  const segW = CONFIG.terrainSegW + 1;
  const segD = CONFIG.terrainSegD + 1;

  for (let i = 0; i < segD; i++) {
    for (let j = 0; j < segW; j++) {
      const idx = (i * segW + j) * 3;
      const x = posArray[idx];
      const z = posArray[idx + 2];

      // Multi-layered waves
      const wave1 = Math.sin(x * CONFIG.waveFrequency + time * CONFIG.waveSpeed) * CONFIG.waveAmplitude;
      const wave2 = Math.sin(z * CONFIG.waveFrequency * 1.3 + time * CONFIG.waveSpeed * 0.7) * CONFIG.waveAmplitude * 0.5;
      const wave3 = Math.cos((x + z) * CONFIG.waveFrequency * 0.5 + time * CONFIG.waveSpeed * 1.2) * CONFIG.waveAmplitude * 0.3;
      const detail = fbm(x * 0.05, z * 0.05, time * 0.2) * 0.5;

      posArray[idx + 1] = wave1 + wave2 + wave3 + detail;

      // Mouse proximity — push terrain up near cursor
      if (!isMobile) {
        const dx = x - mouseWorld.x;
        const dz = z - (mouseWorld.y * 2);
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 8) {
          const influence = (1 - dist / 8) * 2.5;
          posArray[idx + 1] += influence;
        }
      }
    }
  }

  terrainMesh.geometry.attributes.position.needsUpdate = true;
}

// ============================================
// Particles
// ============================================
function createParticles() {
  const count = CONFIG.particleCount;
  const geometry = new THREE.BufferGeometry();
  positions = new Float32Array(count * 3);
  velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * CONFIG.bounds * 2;
    positions[i3 + 1] = (Math.random() - 0.5) * CONFIG.bounds;
    positions[i3 + 2] = (Math.random() - 0.5) * 8;

    velocities[i3] = (Math.random() - 0.5) * CONFIG.particleDrift * 2;
    velocities[i3 + 1] = (Math.random() - 0.5) * CONFIG.particleDrift * 2;
    velocities[i3 + 2] = (Math.random() - 0.5) * CONFIG.particleDrift;

    sizes[i] = Math.random() * 0.04 + 0.02;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

  // Custom shader for glowing particles
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: CONFIG.accent },
      uBrightColor: { value: CONFIG.accentBright },
      uMouseWorld: { value: new THREE.Vector3() },
      uMouseRadius: { value: CONFIG.mouseRadius },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      attribute float size;
      uniform float uMouseRadius;
      uniform vec3 uMouseWorld;
      uniform float uPixelRatio;
      varying float vDistToMouse;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float dist = distance(position.xy, uMouseWorld.xy);
        vDistToMouse = clamp(1.0 - dist / uMouseRadius, 0.0, 1.0);
        float dynamicSize = size + vDistToMouse * 0.08;
        gl_PointSize = dynamicSize * uPixelRatio * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uBrightColor;
      varying float vDistToMouse;

      void main() {
        float distToCenter = length(gl_PointCoord - vec2(0.5));
        if (distToCenter > 0.5) discard;

        float glow = smoothstep(0.5, 0.0, distToCenter);
        vec3 color = mix(uColor, uBrightColor, vDistToMouse * 0.8);
        float alpha = glow * (0.6 + vDistToMouse * 0.4);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  pointsMesh = new THREE.Points(geometry, material);
  groupParticles.add(pointsMesh);
}

function updateParticles(time) {
  const count = CONFIG.particleCount;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // Drift
    positions[i3] += velocities[i3];
    positions[i3 + 1] += velocities[i3 + 1];
    positions[i3 + 2] += velocities[i3 + 2];

    // Gentle sine wave
    positions[i3 + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.0003;

    // Wrap bounds
    const b = CONFIG.bounds;
    if (positions[i3] > b) positions[i3] = -b;
    if (positions[i3] < -b) positions[i3] = b;
    if (positions[i3 + 1] > b * 0.5) positions[i3 + 1] = -b * 0.5;
    if (positions[i3 + 1] < -b * 0.5) positions[i3 + 1] = b * 0.5;
    if (positions[i3 + 2] > 4) positions[i3 + 2] = -4;
    if (positions[i3 + 2] < -4) positions[i3 + 2] = 4;

    // Mouse attract (not repel — draws particles toward cursor)
    if (!isMobile) {
      const dx = mouseWorld.x - positions[i3];
      const dy = mouseWorld.y - positions[i3 + 1];
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.mouseRadius && dist > 0.5) {
        const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * CONFIG.mouseForce;
        positions[i3] += (dx / dist) * force * 0.3;
        positions[i3 + 1] += (dy / dist) * force * 0.3;
      }
    }
  }

  pointsMesh.geometry.attributes.position.needsUpdate = true;
  pointsMesh.material.uniforms.uMouseWorld.value.copy(mouseWorld);
}

// ============================================
// Connection lines
// ============================================
function createLines() {
  const maxLines = CONFIG.particleCount * 12;
  const geometry = new THREE.BufferGeometry();

  linePositions = new Float32Array(maxLines * 6);
  lineColors = new Float32Array(maxLines * 6);

  geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
  });

  linesMesh = new THREE.LineSegments(geometry, material);
  groupParticles.add(linesMesh);
}

function updateLines() {
  let lineIndex = 0;
  const r = CONFIG.accent.r;
  const g = CONFIG.accent.g;
  const b = CONFIG.accent.b;
  const br = CONFIG.accentBright.r;
  const bg = CONFIG.accentBright.g;
  const bb = CONFIG.accentBright.b;
  const maxLines = linePositions.length / 6;
  const count = CONFIG.particleCount;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    for (let j = i + 1; j < count; j++) {
      const j3 = j * 3;

      const dx = positions[i3] - positions[j3];
      const dy = positions[i3 + 1] - positions[j3 + 1];
      const dz = positions[i3 + 2] - positions[j3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < CONFIG.connectionDistance) {
        const alpha = 1 - dist / CONFIG.connectionDistance;
        const li = lineIndex * 6;

        // Check if near mouse — brighter lines near cursor
        let nearMouse = 0;
        if (!isMobile) {
          const mx = (positions[i3] + positions[j3]) * 0.5;
          const my = (positions[i3 + 1] + positions[j3 + 1]) * 0.5;
          const md = Math.sqrt(
            (mx - mouseWorld.x) ** 2 + (my - mouseWorld.y) ** 2
          );
          nearMouse = Math.max(0, 1 - md / CONFIG.mouseRadius);
        }

        const cr = r + (br - r) * nearMouse;
        const cg = g + (bg - g) * nearMouse;
        const cb = b + (bb - b) * nearMouse;

        linePositions[li] = positions[i3];
        linePositions[li + 1] = positions[i3 + 1];
        linePositions[li + 2] = positions[i3 + 2];
        linePositions[li + 3] = positions[j3];
        linePositions[li + 4] = positions[j3 + 1];
        linePositions[li + 5] = positions[j3 + 2];

        const a = alpha * (0.5 + nearMouse * 0.5);
        lineColors[li] = cr * a;
        lineColors[li + 1] = cg * a;
        lineColors[li + 2] = cb * a;
        lineColors[li + 3] = cr * a;
        lineColors[li + 4] = cg * a;
        lineColors[li + 5] = cb * a;

        lineIndex++;
        if (lineIndex >= maxLines) break;
      }
    }
    if (lineIndex >= maxLines) break;
  }

  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;
  linesMesh.geometry.setDrawRange(0, lineIndex * 2);
}

// ============================================
// Mouse glow (soft light that follows cursor)
// ============================================
function createMouseGlow() {
  if (isMobile) return;

  const geometry = new THREE.PlaneGeometry(12, 12);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: CONFIG.accent },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec2 uMouse;
      varying vec2 vUv;
      void main() {
        float dist = distance(vUv, uMouse);
        float glow = exp(-dist * dist * 8.0) * 0.15;
        gl_FragColor = vec4(uColor, glow);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  mouseGlowMesh = new THREE.Mesh(geometry, material);
  mouseGlowMesh.position.z = -2;
  scene.add(mouseGlowMesh);
}

// ============================================
// Animation loop
// ============================================
function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();

  // Smooth mouse lerp
  mouse.x += (mouse.targetX - mouse.x) * 0.08;
  mouse.y += (mouse.targetY - mouse.y) * 0.08;

  // Update all
  updateTerrain(time);
  updateParticles(time);
  updateLines();

  // Camera parallax on scroll
  const scrollOffset = scrollProgress * CONFIG.scrollParallax;
  camera.position.y = 6 - scrollProgress * 4;
  camera.position.z = CONFIG.cameraZ + scrollProgress * 3;

  // Mouse-driven camera tilt
  if (!isMobile) {
    groupParticles.rotation.y += (mouse.x * CONFIG.cameraTilt - groupParticles.rotation.y) * 0.04;
    groupParticles.rotation.x += (-mouse.y * CONFIG.cameraTilt - groupParticles.rotation.x) * 0.04;

    // Terrain follows camera tilt more subtly
    groupTerrain.rotation.y += (mouse.x * CONFIG.cameraTilt * 0.3 - groupTerrain.rotation.y) * 0.03;

    // Mouse glow follows cursor
    if (mouseGlowMesh) {
      mouseGlowMesh.material.uniforms.uMouse.value.set(
        mouse.x * 0.5 + 0.5,
        mouse.y * 0.5 + 0.5
      );
    }
  }

  // Terrain subtle pulse opacity
  const terrainOpacity = 0.06 + Math.sin(time * 0.3) * 0.02 + scrollProgress * 0.03;
  terrainMesh.material.opacity = terrainOpacity;

  composer.render();
}

// ============================================
// Events
// ============================================
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);
  if (pointsMesh) {
    pointsMesh.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }
}

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function onMouseMove(event) {
  mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Project mouse to world space
  const vector = new THREE.Vector3(mouse.targetX, mouse.targetY, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  mouseWorld = camera.position.clone().add(dir.multiplyScalar(distance));
}
