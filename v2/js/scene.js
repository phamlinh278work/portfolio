// 3D layer, perfume-film style: a REAL rose (photographed time-lapse, cut out frame by frame) that blooms,
// REAL rose petals (cut out of a photograph) tumbling in 3D with shallow depth of field, and pearls.
// Between sections the rose breaks into petals that sweep across the screen and it re-forms at its new place.
// Driven by main.js through setState / setEnergy.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const ROSE_FRAMES = 35, ROSE_ASPECT = 720 / 760;

export function createScene(canvas, opts = {}) {
  const { reduced = false, record = false } = opts;
  let mobile = !!opts.mobile;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: record, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, record ? 2.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  scene.add(new THREE.HemisphereLight('#FFF8EE', '#D9C8B4', 0.4));
  const key = new THREE.DirectionalLight('#FFE2AE', 1.5); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#FFD6DE', 0.9); rim.position.set(-4, 2, -3); scene.add(rim);

  let viewH = 1, viewW = 1;
  const halfH = (z) => viewH * (10 - z) / 10, halfW = (z) => viewW * (10 - z) / 10;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    viewH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; viewW = viewH * camera.aspect;
    mobile = w <= 900;
  }
  resize(); window.addEventListener('resize', resize);

  /* ---------- the rose: one photographed frame per bloom step, colour | matte side by side ---------- */
  const step = mobile ? 2 : 1;
  const frameIds = []; for (let i = 0; i < ROSE_FRAMES; i += step) frameIds.push(i);
  if (frameIds[frameIds.length - 1] !== ROSE_FRAMES - 1) frameIds.push(ROSE_FRAMES - 1);
  const frames = new Array(frameIds.length).fill(null);
  const roseTex = new THREE.Texture();
  roseTex.colorSpace = THREE.SRGBColorSpace; roseTex.minFilter = THREE.LinearFilter; roseTex.magFilter = THREE.LinearFilter; roseTex.generateMipmaps = false;
  const roseMat = new THREE.MeshBasicMaterial({ map: roseTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
  roseMat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 uvc = vec2(clamp(vMapUv.x, 0.004, 0.996) * 0.5, vMapUv.y);
      vec4 roseCol = texture2D(map, uvc);
      float roseA = texture2D(map, uvc + vec2(0.5, 0.0)).g;
      diffuseColor *= vec4(roseCol.rgb, smoothstep(0.03, 0.97, roseA));`);
  };
  const rose = new THREE.Mesh(new THREE.PlaneGeometry(ROSE_ASPECT, 1), roseMat);
  rose.renderOrder = 2; rose.visible = false; scene.add(rose);
  let shownFrame = -1;
  function showFrame(i) {
    // nearest frame that has finished loading
    let j = i; while (j > 0 && !frames[j]) j--; if (!frames[j]) { j = i; while (j < frames.length && !frames[j]) j++; }
    if (j >= frames.length || !frames[j] || j === shownFrame) return;
    shownFrame = j; roseTex.image = frames[j]; roseTex.needsUpdate = true; rose.visible = true;
  }
  const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => (im.decode ? im.decode().then(() => res(im), () => res(im)) : res(im)); im.onerror = () => res(null); im.src = src; });
  const useRose = !!opts.rose;      // the cut-out rose is retired: real footage carries the flower now
  const roseReady = !useRose ? Promise.resolve() : (async () => {
    const order = [0, frameIds.length - 1, ...frameIds.map((_, k) => k).slice(1, -1)];
    await Promise.all(order.map(async (k) => { frames[k] = await loadImg(`assets/rose/r${String(frameIds[k]).padStart(2, '0')}.jpg`); }));
  })();

  /* ---------- petals: real petal photographs on bent planes ---------- */
  const texLoader = new THREE.TextureLoader();
  const petalMap = texLoader.load('assets/petals/petals-color.jpg'); petalMap.colorSpace = THREE.SRGBColorSpace;
  const petalAlpha = texLoader.load('assets/petals/petals-alpha.jpg');
  const petalMat = new THREE.MeshBasicMaterial({ map: petalMap, alphaMap: petalAlpha, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  petalMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', 'attribute vec3 aCell;\nvarying float vFade;\n#include <common>')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n vMapUv = uv * 0.25 + aCell.xy; vAlphaMapUv = vMapUv; vFade = aCell.z;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', 'varying float vFade;\n#include <common>')
      .replace('#include <alphamap_fragment>', '#include <alphamap_fragment>\n diffuseColor.a *= vFade;');
  };
  const N = mobile ? 34 : 64;
  function petalGeo() {
    const g = new THREE.PlaneGeometry(1, 1, 8, 8), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.55 * x * x + 0.35 * y * y - 0.12); }
    g.computeVertexNormals();
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }
  const mkLayer = (order) => { const m = new THREE.InstancedMesh(petalGeo(), petalMat, N); m.renderOrder = order; m.frustumCulled = false; m.count = 0; m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3).fill(1), 3); scene.add(m); return m; };
  const backLayer = mkLayer(1), frontLayer = mkLayer(3);
  let ambientCount = reduced ? 0 : (mobile ? 5 : 11);
  const petals = Array.from({ length: N }, (_, i) => ({
    i, active: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: rnd(6.28), ry: rnd(6.28), rz: rnd(6.28), wx: rnd(-1.2, 1.2), wy: rnd(-1.4, 1.4), wz: rnd(-0.8, 0.8),
    size: 0.3, cell: i % 8, fade: 0, life: 0, seed: rnd(100), fall: rnd(0.2, 0.42),
  }));
  function place(p, layer) {
    // depth layers: far (small, soft), mid (sharp), near (big, out of focus) — the shallow-focus look of a macro lens
    const r = layer === undefined ? Math.random() : layer;
    if (r < 0.3) { p.z = rnd(-5, -1.2); p.size = rnd(0.2, 0.34); }
    else if (r < 0.86) { p.z = rnd(-1, 2.2); p.size = rnd(0.2, 0.4); }
    else { p.z = rnd(4.2, 6.2); p.size = rnd(0.42, 0.7); }
  }
  function spawnTop(p, anywhere) {
    place(p);
    const hw = halfW(p.z), hh = halfH(p.z);
    const edge = !mobile && Math.random() < 0.75;             // keep the reading column mostly clear on desktop
    p.x = edge ? (Math.random() < 0.5 ? -1 : 1) * rnd(0.55, 1.05) * hw : rnd(-1, 1) * hw;
    p.y = anywhere ? rnd(-1, 1) * hh : hh + p.size * 1.6 + rnd(0, hh * 0.5);
    p.vx = 0; p.vy = -p.fall; p.vz = 0; p.active = true; p.life = Infinity; p.fade = anywhere ? 1 : 0;
  }
  petals.forEach((p) => { if (p.i < ambientCount) spawnTop(p, true); });
  const extras = () => petals.filter((p) => p.i >= ambientCount);

  // a gust across the whole screen (dir +1: left to right)
  // quiet: fewer petals and none of the big out-of-focus ones, for sections where the visitor is reading
  function sweep(dir = 1, amount = 1, quiet = false) {
    if (reduced) return;
    extras().slice(0, Math.round((N - ambientCount) * amount)).forEach((p) => {
      place(p, quiet ? rnd(0, 0.85) : undefined);
      const hw = halfW(p.z), hh = halfH(p.z), T = rnd(1.0, 2.1);
      p.x = -dir * (hw + p.size * 2 + rnd(0, hw * 1.1)); p.y = rnd(-0.85, 1) * hh;
      p.vx = dir * (2 * hw + Math.abs(p.x) - hw) / T; p.vy = rnd(-0.5, 0.9); p.vz = rnd(-0.3, 0.3);
      p.active = true; p.fade = 0; p.life = T + rnd(1.0, 1.8);
    });
  }
  // the rose breaks into petals: they leave (x, y) and stream towards (tx, ty)
  function burst(x, y, tx, ty, amount = 1) {
    if (reduced) return;
    const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy) || 1;
    extras().slice(0, Math.round((N - ambientCount) * amount)).forEach((p) => {
      place(p, rnd(0.3, 1));
      const a = rnd(6.283), sp = rnd(1.2, 4.2), toward = rnd(0.5, 1.5) * Math.min(d, 6) / 1.5;
      const k = (10 - p.z) / 10;                                // start where the rose is on screen, at any depth
      p.x = x * k + Math.cos(a) * 0.15; p.y = y * k + Math.sin(a) * 0.15;
      p.vx = Math.cos(a) * sp + dx / d * toward; p.vy = Math.sin(a) * sp + dy / d * toward + 0.6; p.vz = rnd(-0.6, 1.2);
      p.active = true; p.fade = 0; p.life = rnd(2.0, 3.4);
    });
  }

  /* ---------- pearls ---------- */
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: '#EADFCF', roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.85,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520], sheen: 0.6, sheenColor: new THREE.Color('#FFE3EA') });
  const NP = mobile ? 7 : 10;
  const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 32, 24), pearlMat, NP); pearls.frustumCulled = false; scene.add(pearls);
  const pseed = Array.from({ length: NP }, (_, i) => ({ r: 0.62 + (i * 37 % 100) / 100 * 0.5, a: i / NP * 6.283, s: 0.16 + (i * 53 % 100) / 100 * 0.3,
    inc: ((i * 29 % 100) / 100 - 0.5) * 1.6, size: 0.022 + (i * 71 % 100) / 100 * 0.03, ph: i * 1.7 }));
  const dummy = new THREE.Object3D(), q = new THREE.Quaternion(), e = new THREE.Euler(), nrm = new THREE.Vector3(), LIGHT = new THREE.Vector3(0.3, 0.6, 0.74).normalize();

  /* ---------- state ---------- */
  const S = { x: 0, y: 0, scale: 0.4, bloom: 0, alpha: 0, orbitR: 1, energy: 1, pulse: 0 };
  const T = { ...S, follow: null };
  // desktop: the rose rests on the right edge; scale = share of the viewport height
  const PRESETS = {
    intro:      { x: 0,    y: 0.3,   scale: 0.44, orbitR: 1 },
    hero:       { follow: 'roseAnchor', orbitR: 1 },
    work:       { x: 0.86, y: 0.66,  scale: 0.2,  orbitR: 1 },
    flow:       { x: 0.87, y: 0.6,   scale: 0.18, orbitR: 1 },
    screens:    { x: 0.87, y: -0.6,  scale: 0.17, orbitR: 1 },
    decisions:  { x: 0.87, y: 0.62,  scale: 0.17, orbitR: 1 },
    process:    { x: 0.87, y: -0.6,  scale: 0.17, orbitR: 1 },
    playground: { x: 0.86, y: 0.64,  scale: 0.19, orbitR: 1 },
    bapo:       { x: 0.87, y: 0.62,  scale: 0.17, orbitR: 1 },
    about:      { x: 0.87, y: -0.6,  scale: 0.18, orbitR: 1 },
    contact:    { follow: 'roseAnchorContact', orbitR: 1.1, rebloom: true },
  };
  // phones: keep reading clear — the rose shows in the intro, the hero and the contact block; petals still sweep by
  const HIDE = { hide: true };
  const MOBILE = { intro: { y: 0.34, scale: 0.3 }, work: HIDE, flow: HIDE, screens: HIDE, decisions: HIDE, process: HIDE, playground: HIDE, bapo: HIDE, about: HIDE };

  function anchorTarget(el) {
    const r = el.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight;
    const bias = +(el.dataset.bias || 0.5), k = +(el.dataset.k || 1.25);
    return { x: (r.left + r.width / 2) / w * 2 - 1, y: -((r.top + r.height * bias) / h * 2 - 1), scale: (r.height / h) * k };
  }
  const g = () => window.gsap;
  let current = 'intro', token = 0, sweepDir = 1, lastSweep = -1e9;
  const READING = new Set(['flow', 'screens', 'decisions', 'process', 'bapo', 'about']);
  function setState(name, dur = 1.4) {
    const p = { ...PRESETS[name], ...(mobile ? MOBILE[name] || {} : {}) };
    const my = ++token; current = name;
    const el = p.follow ? document.getElementById(p.follow) : null;
    const tgt = p.hide ? null : (el ? anchorTarget(el) : { x: p.x, y: p.y, scale: p.scale });
    const land = () => {
      if (my !== token) return;
      T.follow = el;
      if (tgt) { S.x = T.x = tgt.x; S.y = T.y = tgt.y; S.scale = T.scale = tgt.scale; }
      T.orbitR = p.orbitR ?? 1;
      if (p.rebloom && !reduced) { S.bloom = T.bloom = 0; g().to(T, { bloom: 1, duration: 3, ease: 'power1.inOut' }); }
      else if (g() && !reduced && T.bloom < 1) g().to(T, { bloom: 1, duration: 1.2, ease: 'power1.out' });
    };
    if (reduced || !g()) { land(); T.alpha = S.alpha = (tgt && useRose) ? 1 : 0; T.bloom = S.bloom = 1; return; }
    g().killTweensOf(T);
    const visible = S.alpha > 0.25;
    if (visible) burst(S.x * viewW, S.y * viewH, (tgt ? tgt.x : sweepDir) * viewW, (tgt ? tgt.y : 0) * viewH, 0.85);
    else if (performance.now() - lastSweep > 1500) { const quiet = READING.has(name); sweep(sweepDir, quiet ? 0.22 : 0.6, quiet); lastSweep = performance.now(); }
    sweepDir = -sweepDir;
    if (!useRose) { land(); return; }
    g().to(T, { alpha: 0, duration: visible ? 0.4 : 0.01, ease: 'power2.in', onComplete: () => { land(); if (tgt) g().to(T, { alpha: 1, duration: 0.9, delay: 0.35, ease: 'power2.out' }); } });
  }

  const ENERGY = {
    low:  { key: '#E6EEFF', keyI: 1.2, rim: '#D6E2FF', speed: 0.4, pulse: 0, tint: [0.93, 0.96, 1.0], ambient: 1 },
    mid:  { key: '#FFE2AE', keyI: 1.5, rim: '#FFD6DE', speed: 1, pulse: 0, tint: [1, 1, 1], ambient: 1 },
    high: { key: '#FF8A3D', keyI: 2.2, rim: '#FF5A1F', speed: 2.3, pulse: 1, tint: [1.0, 0.9, 0.84], ambient: 2.6 },
  };
  const tint = { r: 1, g: 1, b: 1 };
  const baseAmbient = ambientCount;
  function setEnergy(level) {
    const en = ENERGY[level] || ENERGY.mid, kc = new THREE.Color(en.key), rc = new THREE.Color(en.rim);
    const newAmbient = Math.min(N - 8, Math.round(baseAmbient * en.ambient));
    if (newAmbient > ambientCount) petals.forEach((p) => { if (p.i >= ambientCount && p.i < newAmbient) spawnTop(p, true), (p.fade = 0); });
    else petals.forEach((p) => { if (p.i >= newAmbient && p.i < ambientCount) p.life = 0.8; });
    ambientCount = newAmbient;
    if (level === 'high') sweep(sweepDir = -sweepDir, 0.8);
    if (g() && !reduced) {
      g().to(key.color, { r: kc.r, g: kc.g, b: kc.b, duration: 0.8 }); g().to(rim.color, { r: rc.r, g: rc.g, b: rc.b, duration: 0.8 });
      g().to(key, { intensity: en.keyI, duration: 0.8 }); g().to(T, { energy: en.speed, pulse: en.pulse, duration: 0.8 });
      g().to(tint, { r: en.tint[0], g: en.tint[1], b: en.tint[2], duration: 0.8 });
    } else { key.color.copy(kc); rim.color.copy(rc); key.intensity = en.keyI; T.energy = en.speed; T.pulse = en.pulse; }
  }

  let pointerX = 0, pointerY = 0;
  if (!record) window.addEventListener('pointermove', (ev) => { pointerX = ev.clientX / window.innerWidth - 0.5; pointerY = ev.clientY / window.innerHeight - 0.5; });

  let last = performance.now(), clock = 0, phase = 0;
  const back = [], front = [];
  function writeLayer(mesh, list) {
    list.sort((a, b) => a.z - b.z);
    const cell = mesh.geometry.attributes.aCell, col = mesh.instanceColor;
    for (let n = 0; n < list.length; n++) {
      const p = list[n];
      e.set(p.rx, p.ry, p.rz); q.setFromEuler(e);
      dummy.position.set(p.x, p.y, p.z); dummy.quaternion.copy(q); dummy.scale.setScalar(p.size); dummy.updateMatrix();
      mesh.setMatrixAt(n, dummy.matrix);
      const blur = p.z > 3.4 || p.z < -3.2;                      // out-of-focus rows of the atlas
      cell.setXYZ(n, (p.cell % 4) * 0.25, 0.75 - (Math.floor(p.cell / 4) + (blur ? 2 : 0)) * 0.25, p.fade * (p.z < -1.2 ? 0.8 : 1));
      nrm.set(0, 0, 1).applyQuaternion(q);
      const b = 0.8 + 0.2 * Math.abs(nrm.dot(LIGHT));
      col.setXYZ(n, b * tint.r, b * tint.g, b * tint.b);
    }
    mesh.count = list.length; mesh.instanceMatrix.needsUpdate = true; cell.needsUpdate = true; col.needsUpdate = true;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced) clock += dt;
    if (T.follow) { const a = anchorTarget(T.follow); T.x = a.x; T.y = a.y; T.scale = a.scale; }
    const k = reduced ? 1 : 1 - Math.pow(0.002, dt);
    for (const f of ['x', 'y', 'scale', 'orbitR', 'energy', 'pulse']) S[f] = lerp(S[f], T[f], k);
    S.alpha = T.alpha; S.bloom = T.bloom;                       // these two are tweened, not chased

    // the rose
    showFrame(Math.round(S.bloom * (frames.length - 1)));
    const rh = S.scale * viewH * 2;
    rose.position.set(S.x * viewW, S.y * viewH, 0);
    rose.scale.setScalar(rh * (1 + S.pulse * 0.03 * Math.max(0, Math.sin(clock * 9))));
    rose.rotation.set(pointerY * 0.16 + Math.cos(clock * 0.5) * 0.03, pointerX * 0.28 + Math.sin(clock * 0.4) * 0.08, Math.sin(clock * 0.6) * 0.035);
    roseMat.opacity = S.alpha; roseMat.color.setRGB(tint.r, tint.g, tint.b);

    // petals
    const ds = dt * S.energy; back.length = 0; front.length = 0;
    for (const p of petals) {
      if (!p.active) continue;
      const amb = p.i < ambientCount && p.life === Infinity;
      const tvx = Math.sin(clock * 0.35 + p.seed) * 0.22, tvy = -p.fall;
      const d = 1 - Math.exp(-(amb ? 1.2 : 0.75) * ds);
      p.vx += (tvx - p.vx) * d; p.vy += (tvy - p.vy) * d; p.vz += (0 - p.vz) * d;
      p.x += p.vx * ds; p.y += p.vy * ds; p.z = Math.min(6.4, p.z + p.vz * ds);
      const sp = 0.55 + Math.min(2.2, Math.hypot(p.vx, p.vy) * 0.3);
      p.rx += p.wx * sp * ds; p.ry += p.wy * sp * ds; p.rz += p.wz * sp * ds;
      p.life -= ds;
      p.fade = p.life < 0.8 ? Math.max(0, p.life / 0.8) * Math.min(1, p.fade + ds * 2.5) : Math.min(1, p.fade + ds * 2.5);
      const hw = halfW(p.z) + p.size * 2, hh = halfH(p.z) + p.size * 2;
      if (p.life <= 0 || p.y < -hh || Math.abs(p.x) > hw * (amb ? 1.05 : 2.4)) {
        if (p.i < ambientCount && !reduced) spawnTop(p); else { p.active = false; continue; }
      }
      (p.z < 0 ? back : front).push(p);
    }
    writeLayer(backLayer, back); writeLayer(frontLayer, front);

    // pearls drift around the rose
    phase += dt * S.energy;
    for (let i = 0; i < NP; i++) {
      const s = pseed[i], a = s.a + phase * s.s, r = s.r * S.orbitR * rh;
      dummy.position.set(rose.position.x + Math.cos(a) * r, rose.position.y + Math.sin(a) * r * 0.7 + Math.sin(a * 2 + s.ph) * 0.05 * rh, Math.sin(a) * r * Math.sin(s.inc) + 0.2);
      dummy.quaternion.identity();
      dummy.scale.setScalar(Math.max(1e-5, s.size * rh * S.alpha * (1 + S.pulse * 0.25 * Math.max(0, Math.sin(clock * 9 + i)))));
      dummy.updateMatrix(); pearls.setMatrixAt(i, dummy.matrix);
    }
    pearls.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  const intro0 = { ...PRESETS.intro, ...(mobile ? MOBILE.intro : {}) };
  Object.assign(S, { x: intro0.x, y: intro0.y, scale: intro0.scale * 0.86 }); Object.assign(T, { x: intro0.x, y: intro0.y, scale: intro0.scale * 0.86 });
  requestAnimationFrame(frame);
  const ready = Promise.race([roseReady, new Promise((r) => setTimeout(r, 6000))]).then(() => { window.__sceneReady = true; });

  return {
    setState, setEnergy, sweep, ready,
    // petals fly out from a point on screen (-1..1), e.g. when the intro footage opens up
    burstAt(nx, ny, amount = 1) {
      if (reduced) return;
      extras().slice(0, Math.round((N - ambientCount) * amount)).forEach((p) => {
        place(p, rnd(0.25, 1));
        const a = rnd(6.283), sp = rnd(2.2, 7.5), k = (10 - p.z) / 10;
        p.x = nx * viewW * k + Math.cos(a) * rnd(0, 0.9); p.y = ny * viewH * k + Math.sin(a) * rnd(0, 0.6);
        p.vx = Math.cos(a) * sp * 1.25; p.vy = Math.sin(a) * sp + 0.4; p.vz = rnd(-0.4, 1.6);
        p.active = true; p.fade = 0; p.life = rnd(2.2, 3.6);
      });
    },
    get state() { return current; },
    // intro: the bud appears and opens
    bloom(dur = 2.6) {
      if (reduced || !g()) { T.alpha = 1; T.bloom = 1; return; }
      g().to(T, { alpha: 1, duration: 0.9, ease: 'power2.out' });
      g().to(T, { bloom: 1, duration: dur, ease: 'power1.inOut' });
      g().to(T, { scale: intro0.scale, duration: dur, ease: 'power2.out' });
    },
  };
}
