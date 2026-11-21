// 3D layer: a wild rose with a pearl centre, a pearl strand and orbiting pearls.
// Everything is procedural (no model files). Driven by main.js through setState / setEnergy.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Petal: a dense grid bent into a cupped, notched wild-rose petal. Grows along +Y from the origin.
function petalGeometry(len, wid, cup = 0.2, curl = 0.12) {
  const g = new THREE.PlaneGeometry(1, 1, 24, 28);
  const p = g.attributes.position, colors = [];
  const cBase = new THREE.Color('#FFF1E4'), cMid = new THREE.Color('#F2B9C6'), cTip = new THREE.Color('#E28FA6');
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2;            // -1..1 across
    const v = p.getY(i) + 0.5;          // 0..1 along
    const w = wid * Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.pow(v, 1.9) * 0.82))));
    let y = len * v - len * 0.13 * u * u * smooth(0.78, 1, v) - len * 0.07 * (1 - smooth(0, 0.28, Math.abs(u))) * smooth(0.9, 1, v);
    const x = u * w;
    const z = cup * u * u * (w / wid) - curl * v * v + 0.03 * Math.sin(u * 6 + v * 4) * v;
    p.setXYZ(i, x, y, z);
    const c = v < 0.5 ? cBase.clone().lerp(cMid, v / 0.5) : cMid.clone().lerp(cTip, (v - 0.5) / 0.5 * (0.4 + 0.6 * Math.abs(u)));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

function leafGeometry(len, wid) {
  const g = new THREE.PlaneGeometry(1, 1, 12, 20);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2, v = p.getY(i) + 0.5;
    const w = wid * Math.pow(Math.sin(Math.PI * v), 0.85);
    p.setXYZ(i, u * w, len * v, 0.12 * u * u * (w / wid) - 0.08 * v * v);
  }
  g.computeVertexNormals();
  return g;
}

export function createScene(canvas, opts = {}) {
  const { reduced = false, record = false, anchor = null } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: record, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, record ? 2.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const hemi = new THREE.HemisphereLight('#FFF8EE', '#E8DCCB', 0.7); scene.add(hemi);
  const key = new THREE.DirectionalLight('#FFF1DC', 1.5); key.position.set(3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#FFD6DE', 0.9); rim.position.set(-4, 2, -3); scene.add(rim);

  // ---------- materials ----------
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: '#F7F1E8', roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 520], sheen: 0.6, sheenColor: new THREE.Color('#FFE3EA') });
  const petalMat = new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', vertexColors: true, roughness: 0.48, sheen: 0.35, sheenColor: new THREE.Color('#FFE4EA'), sheenRoughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.45 });
  const leafMat = new THREE.MeshPhysicalMaterial({ color: '#A9BFA3', roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color('#E8F2E4'), side: THREE.DoubleSide });
  const stemMat = new THREE.MeshStandardMaterial({ color: '#8EA587', roughness: 0.6 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#C9A15A', roughness: 0.35, metalness: 0.3 });
  const antherMat = new THREE.MeshStandardMaterial({ color: '#B8873E', roughness: 0.45, metalness: 0.2 });

  // ---------- rose ----------
  const root = new THREE.Group(); scene.add(root);
  const rose = new THREE.Group(); root.add(rose);
  const outer = [], inner = [];
  const outerGeo = petalGeometry(1.0, 0.62, 0.22, 0.14);
  const innerGeo = petalGeometry(0.62, 0.44, 0.26, 0.1);
  for (let i = 0; i < 5; i++) {
    const holder = new THREE.Group(); holder.rotation.z = (i * 72 + (i % 2 ? 4 : -3)) * Math.PI / 180;
    const pivot = new THREE.Group(); pivot.add(new THREE.Mesh(outerGeo, petalMat)); holder.add(pivot); rose.add(holder);
    pivot.position.z = -0.02 * i; outer.push(pivot);
    const h2 = new THREE.Group(); h2.rotation.z = (i * 72 + 36) * Math.PI / 180;
    const p2 = new THREE.Group(); p2.add(new THREE.Mesh(innerGeo, petalMat)); h2.add(p2); rose.add(h2);
    p2.position.z = 0.06; inner.push(p2);
  }
  // stamens + anthers
  const stamGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 5); stamGeo.translate(0, 0.5, 0);
  const antherGeo = new THREE.SphereGeometry(0.022, 10, 8);
  const stamens = new THREE.Group(); stamens.position.z = 0.1; rose.add(stamens);
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2, L = 0.2 + (i % 3) * 0.035;
    const s = new THREE.Mesh(stamGeo, goldMat); s.scale.set(1, L, 1); s.rotation.z = a; s.rotation.x = 0.55; stamens.add(s);
    const an = new THREE.Mesh(antherGeo, antherMat); an.position.set(-Math.sin(a) * L * 0.85, Math.cos(a) * L * 0.85, L * 0.5); stamens.add(an);
  }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.13, 48, 32), pearlMat); heart.position.z = 0.16; rose.add(heart);

  // leaves + stem
  const stemCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.05, -0.12), new THREE.Vector3(-0.18, -0.75, -0.15), new THREE.Vector3(-0.5, -1.55, -0.12), new THREE.Vector3(-0.72, -2.1, -0.1)]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 40, 0.026, 8), stemMat));
  const leafGeo = leafGeometry(0.85, 0.3);
  [[-0.32, -0.95, 2.3], [-0.18, -0.62, -0.75], [-0.55, -1.6, 1.9]].forEach(([x, y, r], i) => {
    const l = new THREE.Mesh(leafGeo, leafMat); l.position.set(x, y, -0.14); l.rotation.z = r; l.rotation.x = 0.35; l.scale.setScalar(i === 2 ? 0.75 : 1); root.add(l);
  });
  // pearl strand draped under the flower
  const strand = new THREE.Group(); root.add(strand);
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  const A = new THREE.Vector3(0.72, -0.45, 0.05), B = new THREE.Vector3(-0.32, -1.15, 0.08);
  for (let i = 0; i < 13; i++) {
    const t = 0.04 + i * 0.92 / 12; const p = A.clone().lerp(B, t); p.y -= Math.sin(Math.PI * t) * 0.42; p.z += Math.sin(Math.PI * t) * 0.12;
    const m = new THREE.Mesh(sphere, pearlMat); m.position.copy(p); m.scale.setScalar(0.034 + 0.024 * Math.sin(Math.PI * t)); strand.add(m);
  }

  // ---------- orbiting pearls ----------
  const N = opts.mobile ? 18 : 30;
  const orbit = new THREE.InstancedMesh(sphere, pearlMat, N); scene.add(orbit);
  const seeds = Array.from({ length: N }, (_, i) => ({
    r: 1.3 + (i * 37 % 100) / 100 * 1.6, a: i / N * Math.PI * 2, s: 0.18 + (i * 53 % 100) / 100 * 0.35,
    inc: ((i * 29 % 100) / 100 - 0.5) * 1.1, size: 0.03 + (i * 71 % 100) / 100 * 0.06, ph: i * 1.7,
  }));
  const dummy = new THREE.Object3D();

  // ---------- state ----------
  const S = { x: 0, y: 0, scale: 1, rotY: 0, bloom: 1, orbitR: 1, energy: 1, pulse: 0 };
  const T = { ...S, follow: null };          // targets
  let viewH = 1, viewW = 1, mobile = !!opts.mobile;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    viewH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    viewW = viewH * camera.aspect;
    mobile = w <= 900;
  }
  resize(); window.addEventListener('resize', resize);

  // screen position (-1..1) for each section; scale is relative to the visible height
  // Desktop: the flower rests on the right edge (headings are left-aligned), alternating top / bottom.
  const PRESETS = {
    intro:      { x: 0,     y: 0.36,  scale: 0.36, bloom: 1, orbitR: 0.8, rotY: 0 },
    hero:       { follow: 'roseAnchor', bloom: 1, orbitR: 0.62, rotY: 0 },
    work:       { x: 0.86,  y: 0.7,   scale: 0.15, bloom: 1, orbitR: 1, rotY: -0.5 },
    flow:       { x: 0.87,  y: 0.62,  scale: 0.14, bloom: 1, orbitR: 1, rotY: -0.4 },
    screens:    { x: 0.87,  y: -0.62, scale: 0.13, bloom: 1, orbitR: 1.1, rotY: -0.3 },
    decisions:  { x: 0.87,  y: 0.62,  scale: 0.13, bloom: 1, orbitR: 1, rotY: -0.3 },
    process:    { x: 0.87,  y: -0.6,  scale: 0.13, bloom: 1, orbitR: 1, rotY: -0.4 },
    playground: { x: 0.86,  y: 0.66,  scale: 0.15, bloom: 1, orbitR: 1.15, rotY: -0.5 },
    bapo:       { x: 0.87,  y: 0.62,  scale: 0.13, bloom: 1, orbitR: 1, rotY: -0.3 },
    about:      { x: 0.87,  y: -0.6,  scale: 0.14, bloom: 1, orbitR: 1, rotY: -0.3 },
    contact:    { follow: 'roseAnchorContact', bloom: 0.22, orbitR: 0.45, rotY: 0 },
  };
  // Mobile: keep reading clear — the flower only appears in the intro, the hero and the contact block.
  const HIDE = { scale: 0.0001 };
  const MOBILE = { intro: { y: 0.42, scale: 0.26 }, work: HIDE, flow: HIDE, screens: HIDE, decisions: HIDE, process: HIDE, playground: HIDE, bapo: HIDE, about: HIDE };

  let current = 'intro';
  function setState(name, dur = 1.4) {
    const p = { ...PRESETS[name], ...(mobile ? MOBILE[name] || {} : {}) };
    if (p.scale === HIDE.scale) dur = Math.min(dur, 0.6);   // get out of the way quickly on phones
    current = name;
    T.follow = p.follow ? document.getElementById(p.follow) : null;
    const g = window.gsap;
    const tgt = {};
    for (const k of ['x', 'y', 'scale', 'bloom', 'orbitR', 'rotY']) if (p[k] !== undefined) tgt[k] = p[k];
    if (g && !reduced) g.to(T, { ...tgt, duration: dur, ease: 'power3.inOut', overwrite: true });
    else Object.assign(T, tgt);
  }

  const ENERGY = {
    low:  { key: '#E6EEFF', keyI: 1.2, rim: '#D6E2FF', speed: 0.45, pulse: 0 },
    mid:  { key: '#FFE2AE', keyI: 1.55, rim: '#FFD6DE', speed: 1, pulse: 0 },
    high: { key: '#FF8A3D', keyI: 2.3, rim: '#FF5A1F', speed: 2.6, pulse: 1 },
  };
  function setEnergy(level) {
    const e = ENERGY[level] || ENERGY.mid, g = window.gsap;
    const kc = new THREE.Color(e.key), rc = new THREE.Color(e.rim);
    if (g && !reduced) {
      g.to(key.color, { r: kc.r, g: kc.g, b: kc.b, duration: 0.8 }); g.to(rim.color, { r: rc.r, g: rc.g, b: rc.b, duration: 0.8 });
      g.to(key, { intensity: e.keyI, duration: 0.8 }); g.to(T, { energy: e.speed, pulse: e.pulse, duration: 0.8 });
    } else { key.color.copy(kc); rim.color.copy(rc); key.intensity = e.keyI; T.energy = e.speed; T.pulse = e.pulse; }
  }

  // anchor (hero): put the flower over the portrait card's top-right corner, sized to the anchor box
  function anchorTarget(el) {
    if (!el) return { x: 0.45, y: 0.3, scale: 0.3 };
    const r = el.getBoundingClientRect(), w = window.innerWidth, h = window.innerHeight;
    const bias = +(el.dataset.bias || 0.5), k = +(el.dataset.k || 1.45);
    const cx = (r.left + r.width / 2) / w * 2 - 1, cy = -((r.top + r.height * bias) / h * 2 - 1);
    return { x: cx, y: cy, scale: (r.height / h) * k };
  }

  let pointerX = 0, pointerY = 0;
  if (!record) window.addEventListener('pointermove', (e) => { pointerX = e.clientX / window.innerWidth - 0.5; pointerY = e.clientY / window.innerHeight - 0.5; });

  let last = performance.now(), clock = 0, phase = 0, ready = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduced) clock += dt;
    // follow the DOM anchor while in the hero state
    if (T.follow) { const a = anchorTarget(T.follow); const k = reduced ? 1 : 1 - Math.pow(0.0005, dt); T.x = lerp(T.x, a.x, k); T.y = lerp(T.y, a.y, k); T.scale = lerp(T.scale, a.scale, k); }
    const k = reduced ? 1 : 1 - Math.pow(0.002, dt);
    for (const p of ['x', 'y', 'scale', 'bloom', 'orbitR', 'rotY', 'energy', 'pulse']) S[p] = lerp(S[p], T[p], k);

    // place the root on screen
    root.position.set(S.x * viewW, S.y * viewH, 0);
    const sc = S.scale * viewH * 2 / 2.4;       // the flower + leaves is ~2.4 units tall at scale 1
    const beat = 1 + S.pulse * 0.04 * Math.max(0, Math.sin(clock * 9));
    root.scale.setScalar(sc * beat);
    root.rotation.z = Math.sin(clock * 0.6) * 0.06;
    rose.rotation.y = S.rotY + Math.sin(clock * 0.35) * 0.22 + pointerX * 0.4;
    rose.rotation.x = -0.12 + Math.cos(clock * 0.4) * 0.06 + pointerY * 0.25;

    // bloom: 0 = bud, 1 = open
    const tiltO = lerp(1.32, 0.2, S.bloom), tiltI = lerp(1.45, 0.62, S.bloom);
    outer.forEach((p, i) => { p.rotation.x = tiltO + Math.sin(clock * 0.9 + i) * 0.02; });
    inner.forEach((p, i) => { p.rotation.x = tiltI + Math.sin(clock * 0.8 + i * 2) * 0.02; });
    stamens.scale.setScalar(lerp(0.4, 1, S.bloom));

    // orbiting pearls around the flower
    phase += dt * S.energy;
    for (let i = 0; i < N; i++) {
      const s = seeds[i], a = s.a + phase * s.s;
      const r = s.r * S.orbitR * sc;
      dummy.position.set(root.position.x + Math.cos(a) * r, root.position.y + Math.sin(a) * r * 0.55 + Math.sin(a * 2 + s.ph) * 0.08 * sc,
        Math.sin(a) * r * Math.sin(s.inc) - 0.4);
      dummy.scale.setScalar(s.size * sc * (1 + S.pulse * 0.25 * Math.max(0, Math.sin(clock * 9 + i))));
      dummy.updateMatrix(); orbit.setMatrixAt(i, dummy.matrix);
    }
    orbit.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    if (!ready) { ready = true; window.__sceneReady = true; }
    requestAnimationFrame(frame);
  }
  // start closed for the intro bloom
  const intro0 = { ...PRESETS.intro, ...(mobile ? MOBILE.intro : {}) };
  Object.assign(S, { ...intro0, bloom: 0, scale: intro0.scale * 0.7 }); Object.assign(T, { ...intro0, bloom: 0, scale: intro0.scale * 0.7 });
  if (reduced) { Object.assign(S, intro0); setState('hero'); }
  requestAnimationFrame(frame);

  return { setState, setEnergy, get state() { return current; }, bloom(dur = 2.4) { const g = window.gsap; const s = (mobile ? MOBILE.intro.scale : PRESETS.intro.scale); if (g && !reduced) g.to(T, { bloom: 1, scale: s, duration: dur, ease: 'power2.out' }); else T.bloom = 1; } };
}
