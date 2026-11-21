/* Phạm Thùy Linh — portfolio v3 · BA / PO cards in real 3D.
   Each card gets a small Three.js scene in place of its flat drawing (the drawing stays as the fallback:
   no WebGL, reduced motion, or a script error). Soft clay-and-pearl materials in the page's colours, a contact
   shadow under each object, a slow idle motion, and a lean towards the pointer. A scene only renders while its card is on screen. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const qs = new URLSearchParams(location.search);
const RECORD = qs.has('record'), AUTO = RECORD || qs.has('autoplay');
const reduced = !AUTO && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = (!AUTO && matchMedia('(hover: hover) and (pointer: fine)').matches) || (RECORD && innerWidth > 900);

const C = { pearl: 0xFBF6EC, sage: 0xC9D9BC, sageDeep: 0x7E9A6B, champ: 0xF1DFB2, gold: 0xC9A14A, silver: 0xDCE1E9, blush: 0xF2CFC8, rose: 0xC9786E, brown: 0x5B3E26, ink: 0x3A2A1E };
const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.35, ...o });
const glossy = (color, o = {}) => mat(color, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, ...o });
const goldM = () => new THREE.MeshPhysicalMaterial({ color: C.gold, metalness: 0.85, roughness: 0.28, clearcoat: 0.5 });
const rbox = (w, h, d, r = 0.12, seg = 5) => new RoundedBoxGeometry(w, h, d, seg, r);

function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(70,48,28,.42)'); gr.addColorStop(0.55, 'rgba(70,48,28,.14)'); gr.addColorStop(1, 'rgba(70,48,28,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SHADOW = shadowTex();
const contact = (w, d, y = -0.9, op = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: SHADOW, transparent: true, depthWrite: false, opacity: op })); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; };

/* ---------- 1 · Metaverse: a VR headset; coins arc into a floating gem, and it is paid for ---------- */
function vr(root) {
  const head = new THREE.Group(); root.add(head);
  const body = new THREE.Mesh(rbox(2.1, 1.05, 0.95, 0.34), mat(C.pearl)); head.add(body);
  const visor = new THREE.Mesh(rbox(1.86, 0.82, 0.12, 0.05), glossy(C.ink, { roughness: 0.08 })); visor.position.z = 0.48; head.add(visor);
  const lensM = glossy(C.brown, { roughness: 0.05, clearcoat: 1 });
  [-0.45, 0.45].forEach((x) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), lensM); l.rotation.x = Math.PI / 2; l.scale.set(1.15, 1, 0.35); l.position.set(x, 0.02, 0.55); head.add(l); });
  const pad = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.11, 16, 48, Math.PI), mat(C.champ)); pad.rotation.set(Math.PI / 2, 0, Math.PI); pad.position.set(0, 0, -0.38); pad.scale.set(1.45, 1, 1); head.add(pad);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 12, 60, Math.PI * 1.05), mat(C.champ)); strap.rotation.x = Math.PI / 2; strap.rotation.z = Math.PI * 0.98; strap.position.z = -0.25; strap.scale.set(1, 0.9, 1); head.add(strap);
  head.position.set(-0.7, 0.05, 0); head.rotation.set(0.1, 0.3, 0); head.scale.setScalar(1.12);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshPhysicalMaterial({ color: 0xE39C90, roughness: 0.12, transmission: 0.18, thickness: 0.6, ior: 1.5, clearcoat: 1, flatShading: true, sheen: 0.4 }));
  gem.scale.set(1, 1.35, 1); gem.position.set(1.65, 0.55, 0.2); root.add(gem);
  const coins = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32), goldM()); m.rotation.x = Math.PI / 2; root.add(m); return m; });
  const ok = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), glossy(C.sageDeep)); ok.position.set(1.95, -0.05, 0.4); root.add(ok);
  root.add(contact(4.2, 2.2, -0.95), contact(1.2, 0.8, -0.95, 0.6));
  return (t) => {
    head.position.y = 0.05 + Math.sin(t * 1.1) * 0.06; head.rotation.z = Math.sin(t * 0.8) * 0.04;
    gem.rotation.y = t * 0.9; gem.position.y = 0.55 + Math.sin(t * 1.4 + 1) * 0.1;
    coins.forEach((c, i) => { const k = ((t * 0.45 + i / 3) % 1); const from = new THREE.Vector3(-0.2, 0.2, 0.6), to = gem.position;
      c.position.lerpVectors(from, to, k); c.position.y += Math.sin(k * Math.PI) * 0.65; c.rotation.z = t * 4 + i; c.scale.setScalar(k > 0.9 ? (1 - k) * 10 : Math.min(1, k * 8)); });
    const pulse = 0.5 + 0.5 * Math.sin(t * 3); ok.scale.setScalar(0.85 + pulse * 0.25);
  };
}

/* ---------- 2 · Doctors' LMS: three learners race (the lead changes), a medal spins, four countries light up ---------- */
function race(root) {
  const cols = [C.sage, C.champ, C.silver], bars = [], heads = [];
  const base = new THREE.Mesh(rbox(3.0, 0.16, 1.3, 0.07), mat(C.pearl)); base.position.set(-0.45, -0.88, 0); root.add(base);
  cols.forEach((c, i) => {
    const b = new THREE.Mesh(rbox(0.62, 1, 0.62, 0.12), mat(c)); b.position.set(-1.35 + i * 0.9, 0, 0); root.add(b); bars.push(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 20), mat(C.pearl, { clearcoat: 1 })); root.add(h); heads.push(h);
    const cross = new THREE.Group(); [[0.2, 0.06], [0.06, 0.2]].forEach(([w, hh]) => cross.add(new THREE.Mesh(rbox(w, hh, 0.05, 0.02, 2), mat(C.rose)))); cross.position.z = 0.21; h.add(cross);
  });
  const medal = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 48), goldM()); disc.rotation.x = Math.PI / 2; medal.add(disc);
  const star = new THREE.Shape(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.07 : 0.17, a = (k / 10) * Math.PI * 2 - Math.PI / 2; k ? star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const st = new THREE.Mesh(new THREE.ExtrudeGeometry(star, { depth: 0.03, bevelEnabled: false }), mat(C.champ, { metalness: 0.3 })); st.position.z = 0.04; medal.add(st);
  const ribbon = new THREE.Mesh(rbox(0.2, 0.42, 0.03, 0.02, 2), mat(C.rose)); ribbon.position.y = 0.42; medal.add(ribbon);
  root.add(medal);
  const lands = [0, 1, 2, 3].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), mat(C.pearl, { emissive: new THREE.Color(C.gold), emissiveIntensity: 0 })); m.position.set(1.25 + i * 0.36, -0.68, 0.35); root.add(m); return m; });
  root.add(contact(4.4, 2, -0.97));
  const H = [[1.25, 0.85, 0.6], [0.75, 1.35, 0.85], [0.95, 0.7, 1.4]];
  return (t) => {
    const ph = (t / 2.2) % 3, i0 = Math.floor(ph), f = ph - i0, e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2, a = H[i0], b = H[(i0 + 1) % 3];
    let lead = 0, best = -1;
    bars.forEach((bar, i) => { const h = a[i] + (b[i] - a[i]) * e; bar.scale.y = h; bar.position.y = -0.8 + h / 2; heads[i].position.set(bar.position.x, -0.8 + h + 0.24, 0); if (h > best) { best = h; lead = i; } });
    medal.position.lerp(new THREE.Vector3(bars[lead].position.x, -0.8 + best + 0.62, 0.05), 0.08); medal.scale.setScalar(0.82); medal.rotation.y = Math.sin(t * 2) * 0.6;
    lands.forEach((l, i) => { const on = ((t * 0.5 - i * 0.22) % 2 + 2) % 2 < 1.2; l.material.emissiveIntensity += ((on ? 0.65 : 0) - l.material.emissiveIntensity) * 0.08; l.position.y = -0.68 + (on ? 0.05 : 0); });
  };
}

/* ---------- 3 · LumiAI: a glossy core sends work out to six workflows; pulses travel the links ---------- */
function agent(root) {
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 32), glossy(C.brown, { emissive: new THREE.Color(0x3a2410), emissiveIntensity: 0.3 })); root.add(core);
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.025, 12, 80), goldM()); halo.rotation.x = Math.PI / 2.4; root.add(halo);
  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), glossy(C.champ, { emissive: new THREE.Color(C.gold), emissiveIntensity: 0.5 })); spark.scale.set(0.6, 1.1, 0.6); spark.position.z = 0.52; root.add(spark);
  const cols = [C.sage, C.champ, C.silver, C.sage, C.champ, C.silver], nodes = [], links = [], pulses = [];
  cols.forEach((c, i) => {
    const n = new THREE.Mesh(rbox(0.56, 0.34, 0.3, 0.1), mat(c)); root.add(n); nodes.push(n);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 8), mat(0xD9CDB5, { clearcoat: 0 })); root.add(l); links.push(l);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshBasicMaterial({ color: C.gold })); root.add(p); pulses.push(p);
  });
  root.add(contact(3.8, 2.4, -1.15, 0.8));
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  return (t) => {
    core.rotation.y = t * 0.4; halo.rotation.z = t * 0.5; spark.rotation.y = t * 1.6;
    nodes.forEach((n, i) => {
      const a = (i / 6) * Math.PI * 2 + t * 0.22, rx = 1.75, ry = 0.78;
      n.position.set(Math.cos(a) * rx, Math.sin(a) * ry + Math.sin(t * 1.3 + i) * 0.05, Math.sin(a) * 0.5 - 0.2);
      n.rotation.set(Math.sin(t + i) * 0.15, -Math.cos(a) * 0.3, 0);
      const l = links[i]; dir.copy(n.position); const len = dir.length(); l.position.copy(dir).multiplyScalar(0.5); l.scale.y = len; l.quaternion.setFromUnitVectors(up, dir.normalize());
      const k = ((t * 0.55 + i / 6) % 1); pulses[i].position.copy(n.position).multiplyScalar(k); pulses[i].scale.setScalar(Math.sin(k * Math.PI) * 1.2 + 0.2);
      const hit = k > 0.9 ? 1 : 0; n.scale.setScalar(1 + hit * 0.08);
    });
  };
}

const SCENES = [[vr, 1.08], [race, 1.05], [agent, 1.22]];      // [scene, how big it sits in its card]

function mount(card, [build, S]) {
  const svg = card.querySelector('.mini__art'); if (!svg) return;
  const box = document.createElement('div'); box.className = 'mini__3d'; box.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); box.append(canvas);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, RECORD ? 2.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const key = new THREE.DirectionalLight(0xFFF1DC, 1.4); key.position.set(2.5, 4, 3); scene.add(key, new THREE.AmbientLight(0xFFF6EA, 0.35));
  const cam = new THREE.PerspectiveCamera(30, 200 / 110, 0.1, 50); cam.position.set(0, 0.5, 7.0); cam.lookAt(0, 0.02, 0);
  const root = new THREE.Group(); scene.add(root);
  const tick = build(root);
  svg.after(box); card.classList.add('has-3d');
  const size = () => { const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  size(); new ResizeObserver(size).observe(box);
  let tx = 0, ty = 0, rx = 0, ry = 0, on = false, raf = 0, born = null, intro = 0;
  if (fine) {
    card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 0.7; ty = ((e.clientY - r.top) / r.height - 0.5) * 0.35; });
    card.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  }
  const loop = (now) => {
    raf = on ? requestAnimationFrame(loop) : 0;
    if (born == null) born = now;
    const t = (now - born) / 1000;
    intro += (1 - intro) * 0.06;                                        // the object rises into place the first time
    rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06;
    root.rotation.set(ry + 0.06, rx + Math.sin(t * 0.35) * 0.12, 0);
    root.position.y = (1 - intro) * -0.8; root.scale.setScalar((0.85 + intro * 0.15) * S);
    tick(t); renderer.render(scene, cam);
  };
  new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '120px' }).observe(box);
  renderer.render(scene, cam);
}

if (!reduced) {
  document.querySelectorAll('.bapo .mini').forEach((card, i) => { try { SCENES[i] && mount(card, SCENES[i]); } catch (e) { console.warn('[3d] bapo', e); } });
}
