// The hero: a generated city that grows and heats up along a timeline, drawn
// the same way the real viewer draws a repository (one instanced mesh).
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';

const SIDE = 30;
const BACKGROUND = 0x0b0e13;
const HEAT = [
  [0, 0x4a5a6c],
  [0.18, 0x66788a],
  [0.42, 0xd8b04a],
  [0.68, 0xec7f31],
  [1, 0xe5383b],
].map(([at, hex]) => [at, new THREE.Color(hex)]);

/** Small deterministic generator so the city is the same on every visit. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Splits the ground into districts, then each district into building lots. */
function generateCity(random) {
  const districts = [];
  const split = (x, z, w, d, depth) => {
    const small = Math.min(w, d) < 7.5;
    if (depth >= 4 || small || (depth > 1 && random() < 0.22)) {
      districts.push({ x, z, w, d });
      return;
    }
    const share = 0.36 + random() * 0.28;
    if (w >= d) {
      split(x, z, w * share, d, depth + 1);
      split(x + w * share, z, w * (1 - share), d, depth + 1);
    } else {
      split(x, z, w, d * share, depth + 1);
      split(x, z + d * share, w, d * (1 - share), depth + 1);
    }
  };
  split(-SIDE / 2, -SIDE / 2, SIDE, SIDE, 0);

  const buildings = [];
  districts.forEach((district, index) => {
    // Each district is founded at some point and has its own temperament.
    district.born = index === 0 ? 0 : random() * 0.62;
    district.busy = random() < 0.3 ? 1 : 0.25;
    const pad = 0.45;
    const cols = Math.max(1, Math.floor((district.w - 2 * pad) / 1.15));
    const rows = Math.max(1, Math.floor((district.d - 2 * pad) / 1.15));
    const stepX = (district.w - 2 * pad) / cols;
    const stepZ = (district.d - 2 * pad) / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (random() < 0.16) continue;
        const giant = random() < 0.045;
        const born = Math.min(0.94, district.born + random() * 0.3);
        const events = [];
        const count = Math.floor(random() * 4 * district.busy + (giant ? 5 : 0));
        for (let e = 0; e < count; e++) events.push(born + random() * (1 - born));
        buildings.push({
          x: district.x + pad + (c + 0.5) * stepX,
          z: district.z + pad + (r + 0.5) * stepZ,
          w: stepX * (0.42 + random() * 0.4),
          d: stepZ * (0.42 + random() * 0.4),
          height: giant ? 5 + random() * 6 : 0.3 + Math.pow(random(), 2.4) * 3.6,
          born,
          grow: 0.05 + random() * 0.22,
          events,
        });
      }
    }
  });
  return { districts, buildings };
}

function heatColor(heat, out) {
  const t = Math.min(1, Math.max(0, heat));
  let i = 1;
  while (i < HEAT.length - 1 && HEAT[i][0] < t) i++;
  const [a, from] = HEAT[i - 1];
  const [b, to] = HEAT[i];
  return out.copy(from).lerp(to, (t - a) / (b - a));
}

const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Mounts the city on a canvas. Returns controls for the timeline:
 * `setTime(0..1)`, `setPlaying(bool)` and an `onTime` callback hook.
 */
export function mountHero(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.Fog(BACKGROUND, 38, 96);
  scene.add(new THREE.HemisphereLight(0xc9d6e8, 0x232a35, 1.5));
  const key = new THREE.DirectionalLight(0xfff1dd, 2.1);
  key.position.set(18, 40, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9db7dd, 0.5);
  fill.position.set(-30, 16, -22);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const { districts, buildings } = generateCity(seeded(20261114));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshBasicMaterial({ color: 0x0d1117 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const slab = new THREE.BoxGeometry(1, 1, 1);
  slab.translate(0, -0.5, 0);
  const platforms = new THREE.InstancedMesh(
    slab,
    new THREE.MeshLambertMaterial(),
    districts.length,
  );
  const matrix = new THREE.Matrix4();
  const color = new THREE.Color();
  districts.forEach((district, i) => {
    matrix.makeScale(district.w - 0.3, 0.08, district.d - 0.3);
    matrix.setPosition(district.x + district.w / 2, 0.08, district.z + district.d / 2);
    platforms.setMatrixAt(i, matrix);
    platforms.setColorAt(i, color.set(i % 2 ? 0x161d27 : 0x1a222d));
  });
  scene.add(platforms);

  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const towers = new THREE.InstancedMesh(box, new THREE.MeshLambertMaterial(), buildings.length);
  towers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  towers.frustumCulled = false;
  scene.add(towers);

  let time = 0;
  let playing = !reducedMotion;
  let angle = 0.6;
  let visible = true;
  let dirty = true;
  const api = { onTime: null };

  function applyTime() {
    buildings.forEach((building, i) => {
      const height = building.height * smooth((time - building.born) / building.grow);
      // Being built is a burst of activity; later commits re-heat the file.
      let heat = time >= building.born ? Math.exp(-(time - building.born) / 0.07) * 0.75 : 0;
      for (const event of building.events) {
        if (event <= time) heat += Math.exp(-(time - event) / 0.06) * 0.6;
      }
      matrix.makeScale(height > 0 ? building.w : 0, height, height > 0 ? building.d : 0);
      matrix.setPosition(building.x, 0.08, building.z);
      towers.setMatrixAt(i, matrix);
      towers.setColorAt(i, heatColor(heat, color));
    });
    towers.instanceMatrix.needsUpdate = true;
    towers.instanceColor.needsUpdate = true;
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // On wide screens the city sits to the right of the headline.
    camera.setViewOffset(
      width,
      height,
      width > 980 ? -width * 0.2 : 0,
      width > 980 ? -height * 0.04 : -height * 0.2,
      width,
      height,
    );
    camera.updateProjectionMatrix();
    dirty = true;
  }

  let previous = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const delta = Math.min(0.1, (now - previous) / 1000);
    previous = now;
    if (!visible) return;

    if (playing) {
      // A full replay takes ~26 s, then holds at HEAD before starting over.
      time += delta / 26;
      if (time > 1.12) time = 0;
      api.onTime?.(Math.min(1, time));
      dirty = true;
    }
    if (!reducedMotion) {
      angle += delta * 0.045;
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;

    applyTime();
    const portrait = camera.aspect < 1;
    const radius = portrait ? 58 : 46;
    camera.position.set(Math.cos(angle) * radius, portrait ? 34 : 27, Math.sin(angle) * radius);
    camera.lookAt(0, 1.5, 0);
    renderer.render(scene, camera);
  }

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);
  resize();
  if (reducedMotion) time = 1;
  requestAnimationFrame(frame);

  api.setTime = (value) => {
    time = Math.min(1, Math.max(0, value));
    dirty = true;
  };
  api.setPlaying = (value) => {
    playing = value;
    if (playing && time >= 1) time = 0;
  };
  api.isPlaying = () => playing;
  return api;
}
