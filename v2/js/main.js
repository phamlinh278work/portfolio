import { createScene } from './scene.js?v=5';

const qs = new URLSearchParams(location.search);
const AUTOPLAY = qs.has('autoplay') || qs.has('record');
const RECORD = qs.has('record');
const html = document.documentElement;
const reduced = !AUTOPLAY && matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) html.classList.add('no-motion');
if (AUTOPLAY) html.classList.add('autoplay');
if (RECORD) html.classList.add('rec');
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

/* ---------- language ---------- */
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
html.lang = qs.get('lang') || store.get('lang') || ((navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en');
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => { html.lang = b.dataset.lang; store.set('lang', html.lang); requestAnimationFrame(() => ScrollTrigger.refresh()); }));

/* ---------- screens reel ---------- */
const reel1 = [
  ['lh-term-01.jpg', '01', 'Terms in this segment', 'Thẻ thuật ngữ đang nghe', true],
  ['lh-term-03.jpg', '02', 'Segment with no terms', 'Đoạn không có thuật ngữ', true],
  ['lh-term-06.jpg', '03', 'Accent-free search', 'Tìm không dấu', true],
  ['lh-term-09.jpg', '04', 'Listen to the answer', 'Nghe câu trả lời', true],
  ['lh-term-10.jpg', '05', 'Quota exhausted', 'Hết lượt', true],
  ['lh-term-11.jpg', '06', 'Off-topic question', 'Câu lạc đề', true],
];
const reel2 = [
  ['sali-dang-soan.jpg', '07', 'While AI is writing', 'Lúc AI đang soạn'],
  ['sali-het-luot.jpg', '08', 'Free credits used up', 'Hết lượt miễn phí'],
  ['sali-xoa.jpg', '09', 'Delete is a destructive dialog', 'Xoá là hộp thoại phá huỷ'],
  ['sali-xem-truoc.jpg', '10', 'The preview is a sheet of paper', 'Xem trước là trang giấy'],
  ['translator-reader.jpg', '11', 'Reader: source and translation interleaved', 'Màn đọc: gốc và dịch xen kẽ'],
  ['translator-chapters.jpg', '12', '17 chapters split from one PDF', '17 chương tách từ một file PDF'],
  ['sali-soan-moi.jpg', '13', 'Errors blocked at input', 'Chặn sai từ ô nhập'],
  ['sali-ket-qua.jpg', '14', 'Assigning and results', 'Giao bài và xem kết quả'],
];
const shot = ([f, n, en, vi, phone]) => `<figure class="shot${phone ? ' shot--phone' : ''}" style="margin:0"><img src="assets/img/${f}" alt="${en}" loading="lazy"><figcaption><b>${n}</b><span class="en">${en}</span><span class="vi">${vi}</span></figcaption></figure>`;
const fillReel = (el, items) => { const h = items.map(shot).join(''); el.innerHTML = h + h; };
fillReel(document.getElementById('reel1'), reel1);
fillReel(document.getElementById('reel2'), reel2);

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToEl = (target) => { const el = typeof target === 'string' ? document.querySelector(target) : target; if (!el) return; lenis ? lenis.scrollTo(el, { offset: -20, duration: 1.4 }) : el.scrollIntoView(); };
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1) { e.preventDefault(); scrollToEl(id); } }));

/* ---------- drawer (mobile menu) ---------- */
const drawer = document.getElementById('drawer');
document.getElementById('menuBtn').addEventListener('click', () => { drawer.classList.add('open'); lenis && lenis.stop(); });
drawer.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => { drawer.classList.remove('open'); lenis && lenis.start(); }));

/* ---------- 3D scene ---------- */
const scene = createScene(document.getElementById('scene'), { reduced, record: RECORD, mobile: innerWidth <= 900, anchor: document.getElementById('roseAnchor') });
let introDone = false, activeScene = 'hero';
const goScene = (name) => { activeScene = name; if (introDone) scene.setState(name); };
document.querySelectorAll('[data-scene]').forEach((el) => {
  const name = el.dataset.scene;
  ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 45%', onEnter: () => goScene(name), onEnterBack: () => goScene(name) });
});

/* ---------- reveal ---------- */
if (!reduced) {
  const heroItems = document.querySelectorAll('#top [data-reveal]');
  const rest = [...document.querySelectorAll('[data-reveal]')].filter((el) => !el.closest('#top'));
  ScrollTrigger.batch(rest, { start: 'top 88%', onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true }) });
  window.__revealHero = () => gsap.to(heroItems, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09 });
}

/* ---------- counters ---------- */
document.querySelectorAll('[data-count]').forEach((el) => {
  const n = +el.dataset.count;
  if (reduced) return;
  el.textContent = '0';
  ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => { const o = { v: 0 }; gsap.to(o, { v: n, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }); } });
});

/* ---------- curved 3D wall of case studies ---------- */
const ring = document.getElementById('ring'), cases = [...ring.children], dots = [...document.querySelectorAll('#wallDots i')];
const STEP = 24, R = 1500, PIN = 520;
let wallST = null;
const wallEl = document.getElementById('wall');
function layoutWall() {
  const desktop = innerWidth > 900;
  wallEl.style.removeProperty('--cover-h'); wallEl.style.height = '';
  if (!desktop) { ring.style.transform = ''; cases.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.display = ''; }); return; }
  cases.forEach((c, i) => { c.style.display = ''; c.style.transform = `rotateY(${-i * STEP}deg) translateZ(${-R}px)`; });
  // the section is pinned, so a card taller than the window could never be scrolled into view:
  // shrink the cover image until the tallest card, its text included, fits under the heading
  const COVER = 360, TAIL = 76;                      // TAIL = dots + hint + breathing room under the cards
  const tallest = Math.max(...cases.map((c) => c.offsetHeight));
  const room = innerHeight - wallEl.offsetTop - TAIL;
  const cover = Math.round(Math.max(170, Math.min(COVER, COVER - (tallest - room))));
  wallEl.style.setProperty('--cover-h', cover + 'px');
  wallEl.style.height = tallest - (COVER - cover) + 16 + 'px';
}
function turnWall(p) {
  const rot = p * (cases.length - 1) * STEP;
  ring.style.transform = `translateZ(${R}px) rotateY(${rot}deg)`;
  const active = Math.round(p * (cases.length - 1));
  dots.forEach((d, i) => d.classList.toggle('on', i === active));
  // a card more than two places away has swung round towards the viewer: perspective would draw it many times its size,
  // off screen, and stretch the page by hundreds of thousands of pixels, so it is taken out (hiding it is not enough: a hidden box still stretches the page)
  cases.forEach((c, i) => { const off = Math.abs(-i * STEP + rot); c.style.opacity = String(Math.max(0.22, 1 - off / 48)); c.style.display = off > STEP * 2.2 ? 'none' : ''; });
}
function setupWall() {
  layoutWall();
  if (wallST) { wallST.kill(); wallST = null; }
  if (innerWidth > 900) {
    turnWall(0);
    wallST = ScrollTrigger.create({ trigger: '#work', pin: true, start: 'top top', end: '+=' + PIN * (cases.length - 1), scrub: reduced ? false : 0.6, onUpdate: (s) => turnWall(s.progress) });
  }
}
// when the scrolling stops between two cards, glide to the nearer one so a whole card always faces the viewer
let snapT;
function snapWall() {
  if (!wallST || AUTOPLAY || !wallST.isActive) return;
  const n = cases.length - 1, pos = wallST.progress * n, k = Math.round(pos);
  if (Math.abs(pos - k) < 0.02) return;
  const y = Math.round(wallST.start + (wallST.end - wallST.start) * k / n);
  if (lenis) lenis.scrollTo(y, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3) }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}
addEventListener('scroll', () => { clearTimeout(snapT); snapT = setTimeout(snapWall, 170); }, { passive: true });
setupWall();
let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => { setupWall(); ScrollTrigger.refresh(); }, 200); });

/* ---------- flow reveals top to bottom, the way the flow runs ---------- */
// The diagram comes in through a soft fade that stays at the bottom edge of the window, so whatever is on screen is
// always drawn in full; a hard cut across the middle of the window looked like something was covering the diagram.
if (!reduced) {
  const flowCard = document.querySelector('.flow-card'), FEATHER = 180, rv = { p: 0 };
  const setRv = () => flowCard.style.setProperty('--rv', (rv.p * (flowCard.offsetHeight + FEATHER)).toFixed(1) + 'px');
  flowCard.classList.add('is-drawing'); setRv();
  gsap.to(rv, { p: 1, ease: 'none', onUpdate: setRv, scrollTrigger: { trigger: flowCard, start: 'top 96%', end: 'bottom 100%', scrub: 0.3 } });
}
// pictures that load late can move everything below them: measure the scroll positions again when that happens
let docH = document.documentElement.scrollHeight, rh;
document.querySelectorAll('img').forEach((im) => im.addEventListener('load', () => { clearTimeout(rh); rh = setTimeout(() => {
  const h = document.documentElement.scrollHeight; if (Math.abs(h - docH) > 4) { docH = h; ScrollTrigger.refresh(); } }, 250); }));

/* ---------- Mood Mix energy demo ---------- */
const energy = document.getElementById('energy');
function setEnergy(level) {
  energy.dataset.level = level;
  energy.querySelectorAll('[data-energy]').forEach((b) => b.classList.toggle('on', b.dataset.energy === level));
  scene.setEnergy(level);
}
energy.querySelectorAll('[data-energy]').forEach((b) => b.addEventListener('click', () => setEnergy(b.dataset.energy)));
ScrollTrigger.create({ trigger: '#playground', start: 'top 60%', end: 'bottom 40%', onLeave: () => setEnergy('mid'), onLeaveBack: () => setEnergy('mid') });

/* ---------- Phú Thọ video: plays only while visible ---------- */
const video = document.getElementById('phuthoVideo');
// when recording, the headless browser leaves the clip black, so the recording shows its cover image instead
if (!reduced && !RECORD) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())), { threshold: 0.3 }).observe(video);

/* ---------- bloom footage: real peonies, graded to the palette ---------- */
const KIND = innerWidth <= 900 ? 'mob' : 'desk';
const BLOOM = 'assets/bloom/';
const setSources = (v, name) => { v.poster = `${BLOOM}${name}.jpg`; v.innerHTML = `<source src="${BLOOM}${name}.webm" type="video/webm"><source src="${BLOOM}${name}.mp4" type="video/mp4">`; };
// looping blooms behind the hero portrait and the closing block; they only play while on screen
document.querySelectorAll('.bloom-loop').forEach((v) => {
  if (RECORD || reduced) {           // a still with a slow drift: the recorder's virtual clock cannot drive <video>
    const im = new Image(); im.src = `${BLOOM}loop-${KIND}.jpg`; im.className = 'bloom-still'; im.alt = ''; v.replaceWith(im); return;
  }
  setSources(v, `loop-${KIND}`);
  new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause())), { threshold: 0.05 }).observe(v);
});

/* ---------- intro: a macro shot of the blooms, the title over it, then the petals come apart ---------- */
const intro = document.getElementById('intro');
const introVideo = document.getElementById('introVideo'), introCanvas = document.getElementById('introCanvas');
const INTRO_FRAMES = KIND === 'desk' ? 113 : 100;      // tools/intro-frames (12.5 fps), used only while recording
let introFrames = null;
if (!reduced) {
  if (RECORD) {
    introVideo.hidden = true; introCanvas.hidden = false;
    introFrames = Array.from({ length: INTRO_FRAMES }, (_, k) => { const im = new Image(); im.src = `tools/intro-frames/${KIND}/f${String(k + 1).padStart(3, '0')}.jpg`; return im; });
  } else setSources(introVideo, `intro-${KIND}`);
}
function drawIntroFrame(k) {
  const im = introFrames[Math.max(0, Math.min(INTRO_FRAMES - 1, k))]; if (!im || !im.naturalWidth) return;
  const c = introCanvas, w = (c.width = c.clientWidth * 2), h = (c.height = c.clientHeight * 2);
  const sc = Math.max(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
  c.getContext('2d').drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
function runIntro() {
  return new Promise((done) => {
    if (reduced) { intro.remove(); introDone = true; scene.setState(activeScene); done(); return; }
    const D = 4.4, media = RECORD ? introCanvas : introVideo;
    if (RECORD) drawIntroFrame(0); else { introVideo.playbackRate = 1.2; introVideo.play().catch(() => {}); }
    const tl = gsap.timeline({ onComplete: () => { intro.remove(); done(); } });
    if (RECORD) { const o = { f: 0 }; tl.to(o, { f: (D + 1.2) * 1.2 * 12.5, duration: D + 1.2, ease: 'none', onUpdate: () => drawIntroFrame(Math.floor(o.f)) }, 0); }
    tl.fromTo(media, { scale: 1.16 }, { scale: 1.05, duration: D, ease: 'power1.out' }, 0)                 // slow push back, like a lens settling
      .to('.intro__text > *', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.16 }, 0.5)
      .call(() => scene.burstAt(0, 0, 1), null, D - 0.9)                                                  // the petals come apart…
      .to('.intro__text', { opacity: 0, y: -14, duration: 0.6, ease: 'power2.in' }, D - 0.7)
      .to(media, { scale: 1.42, duration: 1.3, ease: 'power2.in' }, D - 0.5)                               // …and we fly through them
      .to(intro, { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, D - 0.2)
      .call(() => { introDone = true; scene.setState(activeScene, 1.6); window.__revealHero && window.__revealHero(); }, null, D + 0.05);
  });
}

/* ---------- autoplay: the page plays itself (for interviews and for recording) ---------- */
function buildAutoplay() {
  const top = (sel, dy = 0) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return Math.max(0, el.getBoundingClientRect().top + scrollY + dy); };
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const proxy = { y: scrollY };
  const tl = gsap.timeline({ paused: true });
  const go = (y, d, ease = 'power2.inOut') => tl.to(proxy, { y: Math.min(y, maxY()), duration: d, ease, onUpdate: () => (lenis ? lenis.scrollTo(proxy.y, { immediate: true, force: true }) : window.scrollTo(0, proxy.y)) });
  const hold = (d) => tl.to({}, { duration: d });
  const call = (fn) => tl.call(fn);
  const desktop = innerWidth > 900;
  hold(2.0);
  // work: the wall turns (desktop) or the case list rolls by (mobile)
  const workTop = top('#work');
  go(workTop, 1.6); hold(0.8);
  if (desktop) go(workTop + PIN * (cases.length - 1), 7.5, 'none');
  else go(top('#flow', -innerHeight * 0.4), 9, 'sine.inOut');
  hold(0.6);
  // flow: scroll through so it draws itself
  const flowCard = document.querySelector('.flow-card');
  go(top('#flow', -60), 1.6); hold(1.2);
  go(top('.flow-card', -innerHeight * 0.1) + flowCard.offsetHeight * 0.55, 4.5, 'sine.inOut'); hold(1);
  // screens, process
  go(top('#screens', -40), 1.6); hold(2.4);
  go(top('#process', -40), 1.5); hold(2.2);
  // playground: energy demo
  go(top('#energy', -innerHeight * 0.18), 1.6); hold(0.6);
  call(() => setEnergy('low')); hold(1.6);
  call(() => setEnergy('mid')); hold(1.6);
  call(() => setEnergy('high')); hold(2.2);
  call(() => setEnergy('mid')); hold(0.4);
  go(top('.phutho', -innerHeight * 0.2), 1.6); hold(2.6);
  // about + numbers (on phones the stats sit below the bio, so aim at them)
  go(desktop ? top('#about', -60) : top('.stats', -innerHeight * 0.25), 1.8); hold(2.8);
  // contact: the flower closes into a pearl above the last line
  go(Math.min(maxY(), top('#contact', desktop ? -40 : -70)), 2.4); hold(3.8);
  call(() => { window.__autoplayDone = true; });
  return tl;
}

/* ---------- boot ---------- */
async function boot() {
  try { await document.fonts.ready; } catch (e) {}
  await Promise.race([
    Promise.all([...document.querySelectorAll('#top img')].map((i) => (i.complete ? 0 : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))),
    new Promise((r) => setTimeout(r, 8000)),
  ]);
  await scene.ready;
  if (introFrames) await Promise.race([Promise.all(introFrames.map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })))), new Promise((r) => setTimeout(r, 20000))]);
  else if (!reduced) await Promise.race([new Promise((r) => { if (introVideo.readyState >= 3) r(); else introVideo.addEventListener('canplay', r, { once: true }); }), new Promise((r) => setTimeout(r, 4000))]);
  ScrollTrigger.refresh();
  if (AUTOPLAY) { window.scrollTo(0, 0); lenis && lenis.scrollTo(0, { immediate: true }); }
  window.__ready = true;
  if (RECORD) await new Promise((r) => { window.__go = r; });   // the recorder starts the clock
  await runIntro();
  if (AUTOPLAY) { ScrollTrigger.refresh(); const tl = buildAutoplay(); window.__autoplayDuration = tl.duration(); tl.play(); }
}
boot();

// While recording, the Phú Thọ clip simply plays in real time (seeking it frame by frame left it black);
// because capture runs slower than real time, it shows as a gentle slow-motion fly-over in the video.
