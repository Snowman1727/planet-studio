import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { BRUSHES, ENVIRONMENTS } from './catalog.js';
import { createAssets } from './assets.js';

const RADIUS = 2.08;
const UP = new THREE.Vector3(0, 1, 0);
const TAU = Math.PI * 2;

export function createScene(canvas, initial, { onError = () => {} } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
  camera.position.set(0, 0, 10);
  const noise = new ImprovedNoise();
  let doc = initial;
  let terrainSeed = doc.seed;
  let environment = doc.settings.environment || 'snow';
  let theme = ENVIRONMENTS[environment];
  let disposed = false;
  let visible = true;
  let presenting = false;
  let paused = false;
  let dirty = true;
  let time = 0;
  let previous = performance.now();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const target = { ...doc.view };
  world.rotation.set(target.x, target.y, -0.04);

  const ambient = new THREE.HemisphereLight(0xd6fff2, 0x223342, 2.5);
  const light = new THREE.DirectionalLight(0xf3f8ff, 3.5);
  light.position.set(-3, 6, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = light.shadow.camera.bottom = -4;
  light.shadow.camera.right = light.shadow.camera.top = 4;
  light.shadow.normalBias = 0.035;
  const rim = new THREE.DirectionalLight(0x93efd6, 2.1);
  rim.position.set(4, 1, -3);
  scene.add(ambient, light, rim);

  function height(direction) {
    const offset = (terrainSeed % 997) / 37;
    const broad = noise.noise(direction.x * 2.4 + offset, direction.y * 2.4, direction.z * 2.4);
    const hill = Math.max(0, noise.noise(direction.x * 4 + 4, direction.y * 4 + offset, direction.z * 4));
    return RADIUS + broad * 0.065 + hill * hill * 0.12;
  }
  const surface = new THREE.IcosahedronGeometry(1, 20);
  const land = new THREE.Mesh(surface, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.88,
  }));
  land.receiveShadow = true;
  world.add(land);
  const normal = new THREE.Vector3();
  function buildTerrain() {
    const raw = new THREE.IcosahedronGeometry(1, 20);
    const positions = raw.getAttribute('position');
    const colors = new Float32Array(positions.count * 3);
    const base = new THREE.Color(theme.land);
    const shade = new THREE.Color(theme.shade);
    const tint = new THREE.Color();
    for (let i = 0; i < positions.count; i += 3) {
      normal.fromBufferAttribute(positions, i).normalize();
      const n = noise.noise(normal.x * 18 + terrainSeed % 100, normal.y * 18, normal.z * 18);
      tint.copy(shade).lerp(base, 0.65 + n * 0.18);
      for (let j = 0; j < 3; j++) {
        normal.fromBufferAttribute(positions, i + j).normalize();
        normal.multiplyScalar(height(normal));
        positions.setXYZ(i + j, normal.x, normal.y, normal.z);
        tint.toArray(colors, (i + j) * 3);
      }
    }
    raw.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    raw.computeVertexNormals();
    land.geometry.dispose();
    land.geometry = raw;
  }
  buildTerrain();

  const { parts, materials } = createAssets();
  function applyEnvironment() {
    theme = ENVIRONMENTS[environment];
    ambient.color.setHex(theme.ambient);
    ambient.groundColor.setHex(theme.groundLight);
    light.color.setHex(theme.sunlight);
    rim.color.setHex(theme.rim);
    for (const name of ['pine', 'tip', 'leaf', 'leafTip', 'rock', 'petals', 'petalsAlt', 'mushroom']) {
      materials[name].color.setHex(theme[name]);
    }
  }
  applyEnvironment();
  let capacity = 0;
  const objectTransform = new THREE.Object3D();
  const placed = new THREE.Matrix4();
  const matrix = new THREE.Matrix4();
  function syncObjects() {
    if (doc.objects.length > capacity) {
      capacity = Math.min(2000, Math.max(64, 2 ** Math.ceil(Math.log2(doc.objects.length || 1))));
      for (const p of parts) {
        if (p.mesh) { world.remove(p.mesh); p.mesh.dispose(); }
        p.mesh = new THREE.InstancedMesh(p.geometry, p.mat, capacity);
        p.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        p.mesh.castShadow = p.mesh.receiveShadow = true;
        world.add(p.mesh);
      }
    }
    const counts = Object.fromEntries(Object.keys(BRUSHES).map((type) => [type, 0]));
    for (const object of doc.objects) {
      normal.fromArray(object.direction).normalize();
      objectTransform.position.copy(normal).multiplyScalar(height(normal) - 0.012);
      objectTransform.quaternion.setFromUnitVectors(UP, normal);
      objectTransform.rotateY(object.heading);
      objectTransform.scale.setScalar(object.scale);
      objectTransform.updateMatrix();
      placed.copy(objectTransform.matrix);
      const n = counts[object.type]++;
      for (const p of parts) {
        if (p.type === object.type) p.mesh.setMatrixAt(n, matrix.multiplyMatrices(placed, p.local));
      }
    }
    for (const p of parts) {
      if (!p.mesh) continue;
      p.mesh.count = counts[p.type];
      p.mesh.visible = !p.snow || environment === 'snow';
      p.mesh.instanceMatrix.needsUpdate = true;
      p.mesh.computeBoundingSphere();
    }
    dirty = true;
  }
  syncObjects();

  const starPositions = new Float32Array(540 * 3);
  for (let i = 0; i < 540; i++) {
    starPositions[i * 3] = Math.sin(i * 79.17) * 18;
    starPositions[i * 3 + 1] = Math.cos(i * 91.13) * 13;
    starPositions[i * 3 + 2] = -8 - (i % 13);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xabcbbf, size: 0.022, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(stars);
  const snowPositions = new Float32Array(120 * 3);
  for (let i = 0; i < 120; i++) {
    snowPositions[i * 3] = Math.sin(i * 13.31) * 3.5;
    snowPositions[i * 3 + 1] = Math.cos(i * 27.51) * 3.2;
    snowPositions[i * 3 + 2] = Math.sin(i * 19.71) * 3.5;
  }
  const snowGeometry = new THREE.BufferGeometry();
  snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snow = new THREE.Points(snowGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(snow);

  const ringGeometry = new THREE.BufferGeometry();
  const ringPoints = new Float32Array(97 * 3);
  ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPoints, 3));
  const ring = new THREE.Line(ringGeometry, new THREE.LineBasicMaterial({ color: 0xa3f3d6, depthTest: true, transparent: true, opacity: 0.95 }));
  ring.visible = false;
  world.add(ring);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const ringNormal = new THREE.Vector3();
  const point = new THREE.Vector3();

  function brush(direction, radius = 0.28, type = 'tree') {
    ring.visible = Boolean(direction) && !presenting;
    if (direction) {
      ringNormal.fromArray(direction).normalize();
      tangent.crossVectors(Math.abs(ringNormal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : UP, ringNormal).normalize();
      bitangent.crossVectors(ringNormal, tangent).normalize();
      for (let i = 0; i <= 96; i++) {
        const phi = i / 96 * TAU;
        point.copy(ringNormal).multiplyScalar(Math.cos(radius))
          .addScaledVector(tangent, Math.sin(radius) * Math.cos(phi))
          .addScaledVector(bitangent, Math.sin(radius) * Math.sin(phi)).normalize();
        point.multiplyScalar(height(point) + 0.014);
        point.toArray(ringPoints, i * 3);
      }
      ring.geometry.attributes.position.needsUpdate = true;
      ring.geometry.computeBoundingSphere();
      ring.material.color.setHex(type === 'erase' ? 0xf19590 : type === 'house' ? 0xffd995 : 0xa3f3d6);
    }
    dirty = true;
  }
  function resize() {
    if (disposed) return;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.aspect = width / height;
    camera.position.z = Math.max(9.7, 9.2 / camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; });
  visibility.observe(canvas);
  const contextLost = (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    onError(new Error('三维画面已中断。请先保存 JSON，再刷新页面。'));
  };
  const motionChange = () => { dirty = true; };
  canvas.addEventListener('webglcontextlost', contextLost);
  motion.addEventListener('change', motionChange);
  resize();
  renderer.setAnimationLoop((now) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (disposed || !visible || document.hidden) return;
    const active = presenting && !paused && !motion.matches;
    if (active) {
      time += delta;
      if (doc.settings.autoRotate) target.y += delta * 0.06;
      if (doc.settings.snow) {
        for (let i = 0; i < 120; i++) {
          snowPositions[i * 3 + 1] -= delta * (0.12 + i % 5 * 0.018);
          if (snowPositions[i * 3 + 1] < -3.2) snowPositions[i * 3 + 1] = 3.2;
        }
        snow.geometry.attributes.position.needsUpdate = true;
      }
    }
    const moving = Math.abs(world.rotation.x - target.x) + Math.abs(world.rotation.y - target.y) > 0.0001;
    if (!dirty && !moving && !active) return;
    const easing = motion.matches ? 1 : 1 - Math.exp(-delta * 16);
    world.rotation.x += (target.x - world.rotation.x) * easing;
    world.rotation.y += (target.y - world.rotation.y) * easing;
    snow.visible = environment === 'snow' && doc.settings.snow && presenting && !motion.matches;
    stars.visible = presenting;
    renderer.render(scene, camera);
    dirty = false;
  });
  return {
    sync(project) {
      const changedSeed = project.seed !== terrainSeed;
      const changedEnvironment = project.settings.environment !== environment;
      doc = project;
      terrainSeed = project.seed;
      environment = project.settings.environment || 'snow';
      if (changedEnvironment) applyEnvironment();
      if (changedSeed || changedEnvironment) buildTerrain();
      syncObjects();
    },
    setView(view) {
      target.x = view.x;
      target.y = view.y;
      world.rotation.x = target.x;
      world.rotation.y = target.y;
      dirty = true;
    },
    pick(clientX, clientY) {
      const box = canvas.getBoundingClientRect();
      pointer.set((clientX - box.left) / box.width * 2 - 1, -(clientY - box.top) / box.height * 2 + 1);
      scene.updateMatrixWorld(true);
      camera.updateMatrixWorld(true);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(land, false)[0];
      return hit ? world.worldToLocal(hit.point).normalize().toArray() : null;
    },
    brush,
    freeze() {
      target.x = world.rotation.x;
      target.y = world.rotation.y;
    },
    rotate(dx, dy) {
      target.y += dx;
      target.x = THREE.MathUtils.clamp(target.x + dy, -1.5, 1.5);
      dirty = true;
    },
    view() { return { x: target.x, y: target.y }; },
    preview(value) { presenting = value; ring.visible = false; dirty = true; },
    pause(value) { paused = value; dirty = true; },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      visibility.disconnect();
      motion.removeEventListener('change', motionChange);
      canvas.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set();
      const materials = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) materials.add(object.material);
      });
      parts.forEach((p) => { geometries.add(p.geometry); materials.add(p.mat); p.mesh?.dispose(); });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
