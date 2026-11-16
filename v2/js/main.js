import { createScene } from './scene.js?v=6';

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

/* ---------- screens: a still grid; every screen opens large ---------- */
const SHOTS_PHONE = [
  ['lh-term-01.jpg', '01', 'Terms in the segment being played', 'Thuật ngữ của đoạn đang nghe'],
  ['lh-term-03.jpg', '02', 'A segment with no terms', 'Đoạn không có thuật ngữ'],
  ['lh-term-06.jpg', '03', 'Search that ignores accents', 'Tìm không dấu'],
  ['lh-term-09.jpg', '04', 'Listen to the answer', 'Nghe câu trả lời'],
  ['lh-term-10.jpg', '05', 'Out of credits', 'Hết lượt'],
  ['lh-term-11.jpg', '06', 'An off-topic question', 'Câu lạc đề'],
];
const SHOTS_WEB = [
  ['translator-reader.jpg', '07', 'LinHiêu · Reader: source and translation interleaved', 'LinHiêu · Màn đọc: gốc và dịch xen kẽ'],
  ['translator-chapters.jpg', '08', 'LinHiêu · 17 chapters split from one PDF', 'LinHiêu · 17 chương tách từ một file PDF'],
  ['sali-dang-soan.jpg', '09', 'Sali · While the AI is writing', 'Sali · Lúc AI đang soạn'],
  ['sali-xem-truoc.jpg', '10', 'Sali · The preview is a sheet of paper', 'Sali · Xem trước là trang giấy'],
];
const shot = ([f, n, en, vi]) => `<figure class="shot" data-reveal><button type="button" aria-label="${en}"><img data-zoom src="assets/img/${f}" alt="${en}" loading="lazy"></button><figcaption><b>${n}</b><span class="en">${en}</span><span class="vi">${vi}</span></figcaption></figure>`;
document.getElementById('shotsPhone').innerHTML = SHOTS_PHONE.map(shot).join('');
document.getElementById('shotsWeb').innerHTML = SHOTS_WEB.map(shot).join('');

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
const ring = document.getElementById('ring'), cases = [...ring.children], dots = [...document.querySelectorAll('#wallDots button')];
const STEP = 24, R = 1500, PIN = 520;
let wallST = null;
const wallEl = document.getElementById('wall'), workEl = document.getElementById('work');
const isWall = () => innerWidth > 900 && !workEl.classList.contains('is-grid');
function layoutWall() {
  const desktop = isWall();
  wallEl.style.removeProperty('--cover-h'); wallEl.style.height = '';
  if (!desktop) { ring.style.transform = ''; cases.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; c.style.display = ''; }); return; }
  cases.forEach((c, i) => { c.style.display = ''; c.style.transform = `rotateY(${-i * STEP}deg) translateZ(${-R}px)`; });
  // the section is pinned, so a card taller than the window could never be scrolled into view:
  // shrink the cover image until the tallest card, its text included, fits under the heading
  const hintShown = getComputedStyle(document.querySelector('.wall__hint')).display !== 'none';
  const COVER = 360, TAIL = hintShown ? 76 : 48;      // TAIL = dots (+ hint) + breathing room under the cards
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
  if (isWall()) {
    turnWall(0);
    wallST = ScrollTrigger.create({ trigger: '#work', pin: true, start: 'top top', end: '+=' + PIN * (cases.length - 1), scrub: reduced ? false : 0.6, onUpdate: (s) => turnWall(s.progress) });
  }
}
// when the scrolling stops between two cards, glide to the nearer one so a whole card always faces the viewer
let snapT;
function snapWall() {
  if (!wallST || AUTOPLAY || tour || !wallST.isActive) return;
  const n = cases.length - 1, pos = wallST.progress * n, k = Math.round(pos);
  if (Math.abs(pos - k) < 0.02) return;
  const y = Math.round(wallST.start + (wallST.end - wallST.start) * k / n);
  if (lenis) lenis.scrollTo(y, { duration: 0.7, easing: (t) => 1 - Math.pow(1 - t, 3) }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
}
addEventListener('scroll', () => { clearTimeout(snapT); snapT = setTimeout(snapWall, 170); }, { passive: true });
const scrollToY = (y, d = 0.9) => (lenis ? lenis.scrollTo(y, { duration: d, easing: (t) => 1 - Math.pow(1 - t, 3) }) : window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }));
const wallIndex = () => (wallST ? Math.round(wallST.progress * (cases.length - 1)) : 0);
const turnTo = (k) => { if (wallST) scrollToY(Math.round(wallST.start + (wallST.end - wallST.start) * k / (cases.length - 1))); };
dots.forEach((d, k) => d.addEventListener('click', () => turnTo(k)));
// a card that is off to the side comes to the centre first; the centred card opens the section that shows its work
cases.forEach((c, k) => {
  const open = () => { if (wallST && k !== wallIndex()) turnTo(k); else if (c.dataset.href) location.href = c.dataset.href; else scrollToEl(c.dataset.to); };
  c.addEventListener('click', open);
  c.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
});
document.getElementById('wallToggle').addEventListener('click', () => {
  const y = wallST ? wallST.start : workEl.getBoundingClientRect().top + scrollY;       // the section's own top, pinned or not
  workEl.classList.toggle('is-grid'); setupWall(); ScrollTrigger.refresh();
  lenis ? lenis.scrollTo(Math.max(0, y), { immediate: true, force: true }) : window.scrollTo(0, Math.max(0, y));
});
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

/* ---------- lightbox: any picture marked data-zoom opens large; a second click shows it at full size to pan ---------- */
const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbStage = document.getElementById('lbStage');
let lbList = [], lbAt = 0, lbFrom = null;
const zoomables = () => [...document.querySelectorAll('img[data-zoom]')].filter((im) => im.offsetParent !== null);   // skips the hidden language
function lbShow(k) {
  lbAt = (k + lbList.length) % lbList.length;
  const im = lbList[lbAt], fig = im.closest('figure'), cap = fig && fig.querySelector('figcaption');
  lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
  lbCap.innerHTML = cap ? cap.innerHTML : im.alt;
  const big = im.dataset.zoom === 'big';
  // a diagram is useless shrunk to a phone's width, so there it opens at a readable size straight away
  lb.classList.toggle('is-1x', big && innerWidth <= 900);
  lb.style.setProperty('--lb-w', big ? Math.max(innerWidth * 0.94, Math.min(1300, im.naturalWidth || 1300)) + 'px' : 'auto');
  lbStage.scrollTo(0, 0);
  document.getElementById('lbPrev').hidden = document.getElementById('lbNext').hidden = lbList.length < 2;
}
function lbOpen(im) { lbList = zoomables(); lbFrom = document.activeElement; lb.hidden = false; lenis && lenis.stop(); lbShow(Math.max(0, lbList.indexOf(im))); document.getElementById('lbClose').focus(); }
function lbClose() { lb.hidden = true; lb.classList.remove('is-1x'); lbImg.removeAttribute('src'); lenis && lenis.start(); lbFrom && lbFrom.focus && lbFrom.focus({ preventScroll: true }); }
document.addEventListener('click', (e) => {
  const im = e.target.closest('img[data-zoom]') || (e.target.closest('.shot button') || { querySelector: () => null }).querySelector('img[data-zoom]');
  if (im && !lb.contains(im)) { e.preventDefault(); lbOpen(im); }
});
lbImg.addEventListener('click', (e) => { e.stopPropagation(); lb.classList.toggle('is-1x'); lbStage.scrollTo(0, 0); });
lbStage.addEventListener('click', lbClose);
document.getElementById('lbClose').addEventListener('click', lbClose);
document.getElementById('lbPrev').addEventListener('click', () => lbShow(lbAt - 1));
document.getElementById('lbNext').addEventListener('click', () => lbShow(lbAt + 1));
addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbShow(lbAt - 1); else if (e.key === 'ArrowRight') lbShow(lbAt + 1); });

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
const seen = { get() { try { return sessionStorage.getItem('intro') === '1'; } catch (e) { return false; } }, set() { try { sessionStorage.setItem('intro', '1'); } catch (e) {} } };
function runIntro() {
  return new Promise((done) => {
    const land = () => { introDone = true; scene.setState(activeScene, 1.6); window.__revealHero && window.__revealHero(); };
    // reduced motion, or already watched in this visit: straight to the page
    if (reduced || (!AUTOPLAY && seen.get())) { intro.remove(); land(); done(); return; }
    seen.set();
    const D = AUTOPLAY ? 4.4 : 2.5, media = RECORD ? introCanvas : introVideo;      // a visitor waits 2.5 s; the self-playing film takes its time
    if (RECORD) drawIntroFrame(0); else { introVideo.playbackRate = AUTOPLAY ? 1.2 : 1.5; introVideo.play().catch(() => {}); }
    const SKIP = ['pointerdown', 'wheel', 'touchstart', 'keydown'];
    const skip = () => { if (tl.time() < D - 0.9) tl.seek(D - 0.9, false); };         // any input cuts to the petals parting
    const tl = gsap.timeline({ onComplete: () => { SKIP.forEach((t) => removeEventListener(t, skip)); intro.remove(); done(); } });
    if (!AUTOPLAY) SKIP.forEach((t) => addEventListener(t, skip, { passive: true }));
    if (RECORD) { const o = { f: 0 }; tl.to(o, { f: (D + 1.2) * 1.2 * 12.5, duration: D + 1.2, ease: 'none', onUpdate: () => drawIntroFrame(Math.floor(o.f)) }, 0); }
    tl.fromTo(media, { scale: 1.16 }, { scale: 1.05, duration: D, ease: 'power1.out' }, 0)                 // slow push back, like a lens settling
      .to('.intro__text > *', { opacity: 1, y: 0, duration: AUTOPLAY ? 1.1 : 0.8, ease: 'power3.out', stagger: AUTOPLAY ? 0.16 : 0.1 }, AUTOPLAY ? 0.5 : 0.15)
      .call(() => scene.burstAt(0, 0, 1), null, D - 0.9)                                                  // the petals come apart…
      .to('.intro__text', { opacity: 0, y: -14, duration: 0.6, ease: 'power2.in' }, D - 0.7)
      .to(media, { scale: 1.42, duration: 1.3, ease: 'power2.in' }, D - 0.5)                               // …and we fly through them
      .to(intro, { opacity: 0, duration: 1.0, ease: 'power2.inOut' }, D - 0.2)
      .call(land, null, D + 0.05);
  });
}

/* ---------- autoplay: the page plays itself (for interviews and for recording) ---------- */
// The tour as a list of stops: scroll to y over d seconds, then hold. Built fresh each time, because positions change with the window.
function tourStops() {
  const top = (sel, dy = 0) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return Math.max(0, el.getBoundingClientRect().top + scrollY + dy); };
  const maxY = document.documentElement.scrollHeight - innerHeight;
  const stops = [], go = (y, d, hold = 0, ease = 'power2.inOut') => stops.push({ y: Math.min(y, maxY), d, hold, ease });
  const desktop = innerWidth > 900, wall = isWall() && wallST;
  // work: the wall turns (desktop) or the case list rolls by
  const workTop = wall ? wallST.start : top('#work');          // while pinned the section sits at the top of the window, so ask the pin for its real start
  go(workTop, 1.6, 0.8);
  if (wall) go(workTop + PIN * (cases.length - 1), 6.2, 0.6, 'none'); else go(top('#flow', -innerHeight * 0.4), 9, 0.6, 'sine.inOut');
  // flow: scroll through so it draws itself
  const flowCard = document.querySelector('.flow-card');
  go(top('#flow', -60), 1.6, 1.2);
  go(top(flowCard, -innerHeight * 0.1) + flowCard.offsetHeight * 0.55, 4.5, 1, 'sine.inOut');
  // screens: the phone states, then the web screens
  go(top('#screens', -40), 1.6, 1.2);
  go(top('#shots-web', -innerHeight * 0.3), 2.6, 1.8, 'sine.inOut');
  go(top('#process', -40), 1.5, 2.2);
  // the 3D places
  const ph = document.querySelector('.phutho');
  if (desktop) go(top('#playground', -40), 1.6, 3.4);
  else { go(top(ph, -innerHeight * 0.14), 1.6, 1.8); go(top(ph) + ph.offsetHeight - innerHeight * 0.86, 3.2, 1.2, 'sine.inOut'); }
  // about + numbers (on phones the stats sit below the bio, so aim at them)
  go(desktop ? top('#about', -60) : top('.stats', -innerHeight * 0.25), 1.8, 2.8);
  go(top('#contact', desktop ? -40 : -70), 2.4, 3.8);
  return stops;
}
// fromHere: start at the first stop below the current position (the "Auto-play" button); otherwise play from the top (?autoplay)
function buildAutoplay(fromHere = false, onEnd = null) {
  const stops = tourStops(), proxy = { y: scrollY };
  const tl = gsap.timeline({ paused: true });
  const move = () => (lenis ? lenis.scrollTo(proxy.y, { immediate: true, force: true }) : window.scrollTo(0, proxy.y));
  let first = 0;
  if (fromHere) {
    first = stops.findIndex((s) => s.y > scrollY + 8);
    if (first < 0) { first = 0; tl.to(proxy, { y: 0, duration: 1.4, ease: 'power2.inOut', onUpdate: move }); tl.to({}, { duration: 0.8 }); }   // already at the end: back to the top first
  } else tl.to({}, { duration: 2.0 });
  stops.slice(first).forEach((s, k) => {
    let d = s.d;
    if (fromHere && k === 0 && first > 0) d *= Math.max(0.3, Math.min(1, (s.y - scrollY) / Math.max(1, s.y - stops[first - 1].y)));   // part of a leg takes part of its time
    tl.to(proxy, { y: s.y, duration: d, ease: s.ease, onUpdate: move });
    if (s.hold) tl.to({}, { duration: s.hold });
  });
  tl.call(() => { window.__autoplayDone = true; onEnd && onEnd(); });
  return tl;
}

/* ---------- the "Auto-play" button: start the tour from here; any touch, scroll or key hands the page back ---------- */
const tourBtn = document.getElementById('tourBtn');
let tour = null;
const STOPPERS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
function stopTour() {
  if (!tour) return;
  tour.kill(); tour = null;
  STOPPERS.forEach((t) => removeEventListener(t, onStopper, true));
  tourBtn.classList.remove('is-on'); tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.style.setProperty('--tour', 0);
}
function onStopper(e) { const own = tourBtn.contains(e.target) && (e.type === 'pointerdown' || e.type === 'touchstart' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))); if (!own) stopTour(); }   // the button's own click toggles; everything else hands the page back
function startTour() {
  if (!introDone) return;                                    // the opening film is still on screen
  if (!lb.hidden) lbClose();
  drawer.classList.remove('open'); lenis && lenis.start();
  ScrollTrigger.refresh();
  tour = buildAutoplay(true, stopTour);
  tour.eventCallback('onUpdate', () => tourBtn.style.setProperty('--tour', tour ? tour.progress().toFixed(3) : 0));
  tourBtn.classList.add('is-on'); tourBtn.setAttribute('aria-pressed', 'true');
  STOPPERS.forEach((t) => addEventListener(t, onStopper, { capture: true, passive: true }));
  tour.play();
}
tourBtn.addEventListener('click', () => (tour ? stopTour() : startTour()));

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
