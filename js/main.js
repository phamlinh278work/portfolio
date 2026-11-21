
const qs = new URLSearchParams(location.search);
const AUTOPLAY = qs.has('autoplay') || qs.has('record');
const RECORD = qs.has('record');
const html = document.documentElement;
html.classList.add('js');            // from here on the script lays the page out; without it the stylesheet shows a plain version
const reduced = !AUTOPLAY && matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) html.classList.add('no-motion');
if (AUTOPLAY) html.classList.add('autoplay');
if (RECORD) html.classList.add('rec');
const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
if (!gsap || !ScrollTrigger) { html.classList.remove('js'); window.__plain && window.__plain(); throw new Error('animation library did not load'); }
gsap.registerPlugin(ScrollTrigger);

/* ---------- language ---------- */
const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const okLang = (v) => { v = (v || '').toLowerCase(); return v === 'en' || v === 'vi' ? v : ''; };
const qLang = okLang(qs.get('lang'));
html.lang = qLang || okLang(store.get('lang')) || ((navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en');
if (qLang) store.set('lang', qLang);            // a link shared with ?lang=vi stays Vietnamese on the case study too
const setLangButtons = () => document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === html.lang)));
setLangButtons();
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
  html.lang = b.dataset.lang; store.set('lang', html.lang); setLangButtons();
  if (qs.has('lang')) { qs.delete('lang'); const q = qs.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); }   // or a reload would undo the choice
  requestAnimationFrame(() => ScrollTrigger.refresh());
}));

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
];
const SHOTS_SALI = [
  ['sali-dang-soan.jpg', '09', 'Sali · While the AI is writing', 'Sali · Lúc AI đang soạn'],
  ['sali-xem-truoc.jpg', '10', 'Sali · The preview is a sheet of paper', 'Sali · Xem trước là trang giấy'],
];
const shot = ([f, n, en, vi]) => `<figure class="shot" data-reveal><button type="button" aria-label="${en}"><img data-zoom src="assets/img/${f}" alt="${en}" loading="lazy"></button><figcaption><b>${n}</b><span class="en">${en}</span><span class="vi">${vi}</span></figcaption></figure>`;
document.getElementById('shotsPhone').innerHTML = SHOTS_PHONE.map(shot).join('');
document.getElementById('shotsWeb').innerHTML = SHOTS_WEB.map(shot).join('');
document.getElementById('shotsSali').innerHTML = SHOTS_SALI.map(shot).join('');
document.dispatchEvent(new Event('shots:ready'));          // fx.js turns them into a floating 3D wall on wide screens

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  window.__lenis = lenis;                                   // fx.js glides to a screen with it
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToEl = (target) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target; if (!el) return;
  if (el.id === 'work' && wallST) { scrollToY(wallST.start, 1.4); return; }      // while pinned the section's own position is wherever the wall happens to be
  lenis ? lenis.scrollTo(el, { offset: -20, duration: 1.4 }) : el.scrollIntoView();
};
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => { const id = a.getAttribute('href'); if (id.length > 1) { e.preventDefault(); closeDrawer(false); scrollToEl(id); } }));

/* ---------- drawer (mobile menu) ---------- */
const drawer = document.getElementById('drawer'), menuBtn = document.getElementById('menuBtn');
function openDrawer() { drawer.classList.add('open'); menuBtn.setAttribute('aria-expanded', 'true'); lenis && lenis.stop(); drawer.querySelector('button[data-close]').focus(); }
// the smooth scroller ignores scroll requests while it is stopped, so it has to be running again before a menu link scrolls
function closeDrawer(refocus = true) { if (!drawer.classList.contains('open')) return; drawer.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); if (refocus) menuBtn.focus({ preventScroll: true }); }
menuBtn.addEventListener('click', openDrawer);
drawer.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', () => closeDrawer(!el.matches('a'))));
// keeps Tab inside an open layer (menu, picture viewer)
const trapTab = (e, box) => { const f = [...box.querySelectorAll('a[href], button')].filter((el) => !el.hidden && el.offsetParent !== null); if (!f.length) return; const a = f[0], z = f[f.length - 1];
  if (!box.contains(document.activeElement)) { e.preventDefault(); a.focus(); } else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } };
addEventListener('keydown', (e) => { if (!drawer.classList.contains('open')) return; if (e.key === 'Escape') closeDrawer(); else if (e.key === 'Tab') trapTab(e, drawer); });

/* ---------- 3D scene ---------- */
// the petals are decoration: without WebGL, or if the 3D library does not arrive in time, the page carries on without them
const scene = { setState() {}, setEnergy() {}, sweep() {}, burstAt() {}, ready: null };      // does nothing until the real one has loaded
scene.ready = Promise.race([import('./scene.js?v=9'), new Promise((_, no) => setTimeout(() => no(new Error('3D library timed out')), RECORD ? 30000 : 5000))])
  .then((mod) => { const real = mod.createScene(document.getElementById('scene'), { reduced, record: RECORD, mobile: innerWidth <= 900, anchor: document.getElementById('roseAnchor') }); const { ready, ...api } = real; Object.assign(scene, api); return ready; })
  .catch(() => { document.getElementById('scene').style.display = 'none'; });
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

/* ---------- v3: the curved wall of case studies is gone — each project now heads its own screens in the floating wall (fx.js).
   These stand-ins keep the scroll helpers and the tour working. ---------- */
const wallST = null, cases = [], PIN = 0, isWall = () => false, tour0 = null;
const scrollToY = (y, d = 0.9) => (lenis ? lenis.scrollTo(y, { duration: d, easing: (t) => 1 - Math.pow(1 - t, 3) }) : window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }));
let rw; addEventListener('resize', () => { clearTimeout(rw); rw = setTimeout(() => ScrollTrigger.refresh(), 200); });

/* ---------- flow: fx.js draws the diagram line by line when it comes into view ---------- */
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
  // a diagram is useless shrunk to fit the window (its labels drop to a few pixels), so it opens at a readable size straight away
  lb.classList.toggle('is-1x', big);
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
addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') lbClose(); else if (e.key === 'ArrowLeft') lbShow(lbAt - 1); else if (e.key === 'ArrowRight') lbShow(lbAt + 1);
  else if (e.key === 'Tab') trapTab(e, lb);
  else if (['PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.preventDefault();      // or the page behind the viewer scrolls away
});
// a picture that is not wrapped in a button still has to open from the keyboard
document.querySelectorAll('img[data-zoom]').forEach((im) => { if (im.closest('button')) return; im.tabIndex = 0; im.setAttribute('role', 'button'); im.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbOpen(im); } }); });

/* ---------- Phú Thọ video: plays only while visible ---------- */
const video = document.getElementById('phuthoVideo');
// when recording, the headless browser leaves the clip black, so the recording shows its cover image instead
if (!reduced && !RECORD) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? video.play().catch(() => {}) : video.pause())), { threshold: 0.3 }).observe(video);
if (reduced) video.controls = true;
// …so the recording plays the clip's opening as stills (tools/phutho-frames, 15 fps) on a canvas in the phone, on the recorder's clock
const PH_FRAMES = 210;
let phFrames = null;
if (RECORD && !reduced) {
  phFrames = Array.from({ length: PH_FRAMES }, (_, k) => { const im = new Image(); im.src = `tools/phutho-frames/f${String(k + 1).padStart(3, '0')}.jpg`; return im; });
  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 640;
  cv.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:9/16;border-radius:31px;background:#1b1814';
  video.hidden = true; video.style.display = 'none'; video.after(cv);       // the stylesheet's display:block would beat [hidden]
  let t0 = null, shown = -1;
  const draw = (k) => { if (k === shown || !phFrames[k].naturalWidth) return; cv.getContext('2d').drawImage(phFrames[k], 0, 0, 360, 640); shown = k; };
  window.__recVideo = (t) => {
    const r = cv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { t0 = null; draw(0); return; }      // off screen: rewind, so it starts from the top when it arrives
    if (t0 === null) t0 = t;
    draw(Math.floor((t - t0) * 15) % PH_FRAMES);
  };
}

/* ---------- bloom footage: real peonies, graded to the palette ---------- */
const KIND = innerWidth <= 900 ? 'mob' : 'desk';
const BLOOM = 'assets/bloom/';
// The webm files are VP9 4:4:4, which Safari may not decode, and on phones the mp4 is the smaller file: both get the mp4 first.
const MP4_FIRST = KIND === 'mob' || /^((?!chrome|chromium|android|edg).)*safari/i.test(navigator.userAgent);
const setSources = (v, name) => {
  const webm = `<source src="${BLOOM}${name}.webm" type="video/webm">`, mp4 = `<source src="${BLOOM}${name}.mp4" type="video/mp4">`;
  v.poster = `${BLOOM}${name}.jpg`; v.innerHTML = MP4_FIRST ? mp4 + webm : webm + mp4;
};
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
// recordings only: a three-second hook card before the film — "Portfolio", then "with Claude Code" typed out, underlined
function runHook() {
  return new Promise((go) => {
    const el = document.createElement('div'); el.className = 'hook'; el.setAttribute('aria-hidden', 'true');
    const typed = 'with Claude Code';
    el.innerHTML = `<div class="hook__glow"></div><p class="hook__title"><span class="hook__w">Portfolio</span>
      <em class="hook__type">${[...typed].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('')}<b class="hook__caret"></b>
      <svg class="hook__line" viewBox="0 0 300 16" preserveAspectRatio="none"><path pathLength="1" d="M4 11 C 70 4, 160 3, 296 8"/></svg></em></p>`;
    document.body.append(el);
    const chars = el.querySelectorAll('.hook__type span'), caret = el.querySelector('.hook__caret');
    gsap.timeline()
      .fromTo('.hook__w', { opacity: 0, y: 26, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 0.15)
      .fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0.6)
      .to(chars, { opacity: 1, duration: 0.01, stagger: 0.055 }, 0.7)                 // typed, one letter at a time…
      .to(caret, { opacity: 0, duration: 0.2, repeat: 3, yoyo: true }, 1.6)
      .fromTo('.hook__line path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 1.65)   // …and underlined
      .call(go, null, 2.75)                                                            // the film starts under the card as it lifts away
      .to(el, { opacity: 0, scale: 1.04, duration: 0.7, ease: 'power2.in' }, 2.75)
      .call(() => el.remove(), null, 3.5);
  });
}
function runIntro() {
  return new Promise((done) => {
    const land = () => { introDone = true; scene.setState(activeScene, 1.6); window.__revealHero && window.__revealHero(); document.dispatchEvent(new Event('intro:done')); };      // fx.js listens: it starts the hero words, the scribble and the side rail
    // reduced motion, or already watched in this visit: straight to the page
    // …or the page was slow to start and has already been shown as it is: a film over content someone is reading would be a step back
    if (reduced || REEL || (!AUTOPLAY && (seen.get() || html.classList.contains('plain')))) { intro.remove(); land(); done(); return; }
    seen.set();
    const D = AUTOPLAY ? (PACE > 1 ? 3.4 : 4.4) : 2.5, media = RECORD ? introCanvas : introVideo;      // a visitor waits 2.5 s; the self-playing film takes its time
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
const PTR = RECORD && innerWidth > 900;
if (PTR) window.__ptr = { x: innerWidth * 0.62, y: innerHeight * 0.55, clicks: 0, keys: 0, key: '' };   // read by tools/record.py every frame
function tourStops() {
  const top = (sel, dy = 0) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return Math.max(0, el.getBoundingClientRect().top + scrollY + dy); };
  const maxY = document.documentElement.scrollHeight - innerHeight;
  const stops = [], go = (y, d, hold = 0, ease = 'power2.inOut', acts = null) => stops.push({ y: Math.min(y, maxY), d, hold, ease, acts: PTR ? acts : null });
  const desktop = innerWidth > 900;
  // While recording on a wide screen, a scripted pointer shows what hovering and clicking do (the recorder moves the real mouse there).
  // at(): a point inside an element, measured when the move starts; vp(): a point in the window.
  const at = (sel, fx = 0.5, fy = 0.5) => () => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; };
  const vp = (fx, fy) => () => [innerWidth * fx, innerHeight * fy];
  const mv = (to, d = 0.8) => ({ to, d }), wait = (d) => ({ wait: d }), click = { click: true }, key = (k) => ({ key: k });
  if (PTR) stops.push({ intro: true, acts: [mv(vp(0.24, 0.34), 0.6), mv(at('.portrait', 0.6, 0.5), 0.75),     // two light beats: one sweep through the petals that brushes the portrait…
    mv(at('.hero__actions .btn', 0.5, 0.5), 0.6), wait(0.3)] });                                                 // …then on to the button
  // projects: the floating wall glides past every screen (desktop), or the project groups roll by (phones)
  const th = window.__theatre;
  if (th && th.end > th.start) {
    go(th.start, 1.8, 0.4, undefined, [mv(vp(0.6, 0.6), 0.5)]);             // no stopping to open one: the wall just runs sideways through every screen
    go(th.end, 12, 1.4, 'sine.inOut');
  }
  else { go(top('#screens', -40), 1.6, 1.2); go(top('#shots-web', -innerHeight * 0.2), 3, 1.2, 'sine.inOut'); go(top('#shots-sali', -innerHeight * 0.2), 2, 1.2, 'sine.inOut'); }
  // brand sites: the browser window plays, then flips to the next two sites
  if (document.getElementById('sites')) {
    const st = document.querySelector('.sites');
    go(top(st, -Math.max(90, (innerHeight - st.offsetHeight) / 2)), 1.8, 7.5, undefined, [wait(2.2), mv(at('.site:nth-child(2)', 0.5, 0.5), 0.8), click, wait(2.2), mv(at('.site:nth-child(3)', 0.5, 0.5), 0.8), click, wait(1.2)]);
  }
  // flow: on wide screens the whole diagram fits the window and draws itself, so stop and watch it
  const flowCard = document.querySelector('.flow-card');
  if (desktop) go(top(flowCard, -Math.max(104, (innerHeight - flowCard.offsetHeight) / 2 + 20)), 1.8, 8.2, undefined,
    [{ follow: 7.6 }, wait(0.5), mv(at('.flow-note', 0.3, 0.5), 0.7)]);                                    // the lens rides the line while it is being drawn, then steps off

  else { go(top('#flow', -60), 1.6, 1.2); go(top(flowCard, -innerHeight * 0.1), 1.6, 6.5); }
  go(top('#process', -40), 1.5, 2.2, undefined, [wait(1.1), mv(at('.steps > div:nth-of-type(2)', 0.3, 0.4), 0.8), mv(at('.steps > div:nth-of-type(2)', 0.75, 0.65), 0.9), mv(at('.steps > div:nth-of-type(4)', 0.5, 0.4), 0.9), wait(0.6)]);
  // the 3D places
  const ph = document.querySelector('.phutho');
  if (desktop) go(top('#playground', -40), 1.6, 3.4, undefined, [mv(at('.phutho .tile', 0.4, 0.4), 1.0), mv(at('.phutho .tile', 0.65, 0.6), 1.0), wait(1.4)]);
  else { go(top(ph, -innerHeight * 0.14), 1.6, 1.8); go(top(ph) + ph.offsetHeight - innerHeight * 0.86, 3.2, 1.2, 'sine.inOut'); }
  // BA / PO: the pictures move and the numbers count up
  go(top('#bapo', desktop ? -40 : -70), 1.8, 3.2, undefined, [wait(1.3), mv(at('.bapo .mini:nth-child(1)', 0.45, 0.4), 0.8), mv(at('.bapo .mini:nth-child(1)', 0.7, 0.3), 1.1), wait(0.7),
    mv(at('.bapo .mini:nth-child(3)', 0.4, 0.4), 1.0), mv(at('.bapo .mini:nth-child(3)', 0.62, 0.28), 1.1), wait(0.8)]);
  // about + numbers (on phones the stats sit below the bio, so aim at them)
  go(desktop ? top('#about', -60) : top('.stats', -innerHeight * 0.25), 1.8, 2.8, undefined, [mv(at('.about__main', 0.45, 0.35), 1.0), mv(at('.about__main', 0.7, 0.6), 0.9), mv(at('.stats', 0.5, 0.5), 0.9), wait(0.6)]);
  go(top('#toolkit', -innerHeight * 0.18), 2.2, 4.4, undefined, [wait(1.8), mv(at('#orbit .orbit__node', 0.5, 0.5), 0.9), wait(1.8), mv(at('.toolkit', 0.25, 0.7), 0.8)]);          // the tools orbit and name themselves; then one is hovered
  // experience: stop where the time axis starts, then scroll it through so the bars fill one after another
  const tlEl = document.getElementById('tl');
  if (tlEl) { const t0 = top(tlEl); go(t0 - innerHeight * 0.72 + 12, 1.8, 0.5); go(t0 + tlEl.offsetHeight - innerHeight * 0.62 + 12, 5.5, 1.6, 'sine.inOut',
    [mv(at('#tl > .tl__row:nth-child(6)', 0.55, 0.4), 0.9), wait(1.4), mv(at('#tl > .tl__row:nth-child(7)', 0.55, 0.4), 0.8), wait(1.2)]); }      // hovering a job shows its projects
  go(top('#ask', -innerHeight * 0.12), 1.8, 7.2, undefined, [mv(at('#chat', 0.5, 0.55), 1.0), wait(5.6), mv(at('#chatChips .qchip', 0.5, 0.5), 0.8), wait(0.3), click, wait(PACE > 1 ? 8.7 : 6.2)]);   // the first answer plays, then another question is picked
  go(top('#contact', desktop ? -40 : -70), 2.4, 3.8, undefined, [mv(at('.contact__actions .btn', 0.5, 0.5), 1.0), wait(1.0), mv(at('.contact__actions .btn:nth-child(3)', 0.5, 0.5), 0.9), wait(1.0)]);
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
  const P = window.__ptr;
  const acts = (list) => list.forEach((a) => {
    if (a.wait) tl.to({}, { duration: a.wait });
    else if (a.click) tl.call(() => { P.clicks++; });
    else if (a.key) tl.call(() => { P.key = a.key; P.keys++; });
    else if (a.follow) tl.to({}, { duration: a.follow, onUpdate: () => {                     // ease towards wherever the flow diagram is drawing now
      const f = window.__flowFront && window.__flowFront(); if (!f) return;
      P.x += (f[0] - P.x) * 0.16; P.y += (f[1] - P.y) * 0.16; } });
    else tl.to(P, { x: () => (a.to() || [P.x, P.y])[0], y: () => (a.to() || [P.x, P.y])[1], duration: a.d, ease: 'power2.inOut' });
  });
  stops.slice(first).forEach((s, k) => {
    if (s.intro) { if (!fromHere) acts(s.acts); return; }
    let d = s.d;
    if (fromHere && k === 0 && first > 0) d *= Math.max(0.3, Math.min(1, (s.y - scrollY) / Math.max(1, s.y - stops[first - 1].y)));   // part of a leg takes part of its time
    tl.to(proxy, { y: s.y, duration: d, ease: s.ease, onUpdate: move });
    if (s.acts) acts(s.acts); else if (s.hold) tl.to({}, { duration: s.hold });     // with a pointer script, the script is the hold
  });
  tl.call(() => { window.__autoplayDone = true; onEnd && onEnd(); });
  return tl;
}

/* ---------- reel (?record&reel=30|50|80): a cut for TikTok (vertical) or for a desktop post (landscape, 80). Scene cuts instead of
   one long scroll, a short caption on each scene; it opens on the flow diagram drawing itself under the lens. Recording only. ---------- */
const REEL = RECORD ? Number(qs.get('reel')) || 0 : 0;
const PACE = RECORD ? Math.max(1, Number(qs.get('pace')) || 1) : 1;      // ?record&pace=1.5: the same long tour, played faster (the page's own animations keep their speed)
const reelTop = (sel, dy = 0) => { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return el ? Math.max(0, el.getBoundingClientRect().top + scrollY + dy) : scrollY; };
const reelJump = (y) => { y = Math.min(y, document.documentElement.scrollHeight - innerHeight); lenis ? lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y); ScrollTrigger.update(); return y; };
const CAP = () => innerHeight * (innerWidth > innerHeight ? 0.15 : 0.2);      // the band at the top that the caption sits in
let reelCap = null;
function reelSay(big, small, now = false) {
  if (!reelCap) { reelCap = document.createElement('div'); reelCap.className = 'reelcap'; reelCap.setAttribute('aria-hidden', 'true'); reelCap.innerHTML = '<b></b><small></small>'; document.body.append(reelCap); }
  const [b, s] = reelCap.children; b.textContent = big; s.textContent = small || '';
  if (now) return gsap.set([b, s], { opacity: 1, y: 0, filter: 'none' });     // the first frame must already carry the hook
  gsap.fromTo([b, s], { opacity: 0, y: 16, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', stagger: 0.09 });
}
const reelFlowY = () => {                                  // the diagram under the caption band; on a wide screen the whole fitted flow section
  const card = document.querySelector('.flow-card');
  return innerWidth > innerHeight ? reelTop(card, -Math.max(CAP() + 8, (innerHeight + CAP() - card.offsetHeight) / 2)) : reelTop(card, -CAP());
};
function reelOpen() {
  window.__flowSpeed = REEL >= 45 ? 1.1 : 1.3; window.__flowStart = 2.0;      // open with the first boxes already on the page
  reelJump(reelFlowY());
}
function buildReel() {
  const tier = REEL >= 70 ? 2 : REEL >= 45 ? 1 : 0, long = tier >= 1, xl = tier === 2, D = (...v) => v[tier];   // D(30 s, 50 s, 80 s)
  const P = window.__ptr, tl = gsap.timeline({ paused: true }), proxy = { y: scrollY };
  const move = () => reelJump(proxy.y);
  const at = (sel, fx = 0.5, fy = 0.5) => () => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; };
  const vp = (fx, fy) => () => [innerWidth * fx, innerHeight * fy];
  const mv = (to, d = 0.8) => { if (P) tl.to(P, { x: () => (to() || [P.x, P.y])[0], y: () => (to() || [P.x, P.y])[1], duration: d, ease: 'power2.inOut' }); else tl.to({}, { duration: d }); };
  const wait = (d) => { if (d > 0) tl.to({}, { duration: d }); };
  // the lens rides the newest line while the diagram draws; once it is finished it strolls from box to box instead of parking
  const ROAM = [[0.5, 0.2], [0.3, 0.38], [0.66, 0.5], [0.42, 0.68], [0.72, 0.8], [0.5, 0.58]];
  const follow = (d) => { let since = null; tl.to({}, { duration: d, onUpdate() {
    if (!P) return; const f = window.__flowFront && window.__flowFront();
    if (f) { since = null; P.x += (f[0] - P.x) * 0.16; P.y += (f[1] - P.y) * 0.16; return; }
    if (since === null) since = this.time();
    const r = document.querySelector('.flow-card').getBoundingClientRect(), [fx, fy] = ROAM[Math.floor((this.time() - since) / 1.2) % ROAM.length];
    P.x += (r.left + r.width * fx - P.x) * 0.06; P.y += (r.top + r.height * fy - P.y) * 0.06; } }); };
  const dip = document.createElement('div'); dip.className = 'reeldip'; document.body.append(dip);
  // a cut: a quick cream blink, jump, new caption
  const cut = (y, big, small) => { tl.to(dip, { opacity: 1, duration: 0.14, ease: 'power1.in' }); tl.call(() => { proxy.y = reelJump(y()); reelSay(big, small); }); tl.to(dip, { opacity: 0, duration: 0.24, ease: 'power1.out' }); };
  const glide = (y, d, ease = 'sine.inOut') => tl.to(proxy, { y, duration: d, ease, onUpdate: move });

  // 1 · flow: the hook. The diagram draws itself and the lens rides the newest line
  reelSay('From business rules to screens', 'Portfolio · built with Claude Code', true);
  if (P) { const r = document.querySelector('.flow-card').getBoundingClientRect(); P.x = r.left + r.width * 0.5; P.y = r.top + r.height * 0.1; }
  follow(D(7.4, 9.6, 11.5)); wait(0.3);
  // 2 · hero, the petals blown across by the pointer
  cut(() => 0, "Hi, I'm Linh", 'Product designer');
  mv(vp(0.25, 0.45), 0.6); mv(at('.portrait', 0.55, 0.5), 0.8); mv(vp(0.8, 0.62), 0.7); if (xl) mv(at('.hero__actions .btn', 0.5, 0.5), 0.8); wait(D(0, 1.2, 1.4));
  // 3 · the screens, gliding sideways on the curved wall (the short cut keeps the LinHiêu phones)
  const th = window.__theatre;
  if (th && th.end > th.start) {
    cut(() => th.start + 2, 'Screens I designed', long ? 'LinHiêu · Sali' : 'LinHiêu · terminology assistant');
    mv(vp(0.6, 0.58), 0.4);
    glide(() => th.start + (th.end - th.start) * (long ? 1 : 0.56), D(5.2, 10.5, 14)); wait(D(0.4, 0.4, 0.8));
  }
  // 4 · how she works
  if (long) { cut(() => reelTop('.steps', -CAP()), 'How I work', 'rules → flows → pixels');
    wait(0.8); mv(at('.steps > div:nth-of-type(2)', 0.5, 0.45), 0.8); if (xl) mv(at('.steps > div:nth-of-type(3)', 0.5, 0.45), 0.8); mv(at('.steps > div:nth-of-type(4)', 0.5, 0.45), 0.9); wait(D(0, 1.1, 1.6)); }
  // 5 · 3D, the Phú Thọ clip playing in the phone
  cut(() => reelTop(xl ? '#playground' : '.phutho', xl ? -CAP() + 30 : -CAP()), 'Places I built in 3D', 'Khám phá Phú Thọ');
  mv(at('.phutho .tile', 0.45, 0.45), 1.0); mv(at('.phutho .tile', 0.65, 0.6), 1.0); if (xl) mv(at('.phutho .tile:nth-of-type(2)', 0.5, 0.5), 1.0); wait(D(1.6, 3.0, 3.2));
  // 6 · BA / PO: 3D pictures, numbers counting up
  cut(() => reelTop('.bapo', -CAP()), 'Shipped as BA / PO', 'before design');
  wait(0.6); mv(at('.bapo .mini:nth-child(1)', 0.55, 0.4), 0.9);
  if (long) { if (xl) { mv(at('.bapo .mini:nth-child(2)', 0.5, 0.4), 1.0); wait(0.6); } mv(at('.bapo .mini:nth-child(3)', 0.5, 0.4), 1.0); wait(D(0, 1.6, 1.8)); } else wait(0.6);
  // 7 · about + numbers, and the toolkit orbit (80 s only)
  if (xl) {
    cut(() => reelTop('#about', -CAP()), 'A product, seen as a system', 'About');
    wait(0.6); mv(at('.about__main', 0.45, 0.4), 1.0); mv(at('.stats', 0.5, 0.5), 1.0); wait(1.8);
    cut(() => reelTop('#toolkit', -CAP()), 'Tools I reach for every day', 'Figma · AI · 3D');
    wait(1.4); mv(at('#orbit .orbit__node', 0.5, 0.5), 0.9); wait(2.0);
  }
  // 8 · the years, bars filling as it scrolls
  const tlEl = document.getElementById('tl');
  if (long && tlEl) { cut(() => reelTop(tlEl, -CAP()), '3½ years as BA / PO', 'Vietnam · Africa');
    glide(() => reelTop(tlEl) + tlEl.offsetHeight - innerHeight * 0.7, D(0, 3.6, 5)); mv(at('#tl > .tl__row:nth-child(7)', 0.55, 0.4), 0.8); wait(D(0, 0.6, 1.2)); }
  // 9 · the chat answers a question by itself (80 s only)
  if (xl) { cut(() => reelTop('#ask', -CAP()), 'Questions, answered', 'right on the page'); mv(at('#chat', 0.5, 0.55), 1.0); wait(6.2); }
  // 10 · end card, the same cream card as the opening hook (the page's own contact block sits too low, under TikTok's buttons)
  const end = document.createElement('div'); end.className = 'hook reelend'; end.setAttribute('aria-hidden', 'true'); end.style.opacity = '0';
  end.innerHTML = '<div class="hook__glow"></div><p class="hook__title"><span class="hook__w">Phạm Thùy Linh</span><em class="hook__type">Product designer</em><small class="reelend__url">phamlinh278work.github.io/portfolio</small></p>';
  document.body.append(end);
  tl.to(dip, { opacity: 1, duration: 0.14, ease: 'power1.in' });
  tl.call(() => { reelCap && (reelCap.style.opacity = '0'); end.style.opacity = '1'; });
  tl.to(dip, { opacity: 0, duration: 0.24, ease: 'power1.out' });
  tl.fromTo(end.querySelectorAll('.hook__w, .hook__type, .reelend__url'), { opacity: 0, y: 22, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out', stagger: 0.18 });
  wait(D(2.2, 3.2, 3.6));
  tl.call(() => { window.__autoplayDone = true; });
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
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) {}      // a slow font must not hold the page back
  await Promise.race([
    Promise.all([...document.querySelectorAll('#top img')].map((i) => (i.complete ? 0 : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))),
    new Promise((r) => setTimeout(r, 8000)),
  ]);
  await scene.ready;
  if (introFrames) await Promise.race([Promise.all([...introFrames, ...(phFrames || [])].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; })))), new Promise((r) => setTimeout(r, 20000))]);
  else if (!reduced) await Promise.race([new Promise((r) => { if (introVideo.readyState >= 3) r(); else introVideo.addEventListener('canplay', r, { once: true }); }), new Promise((r) => setTimeout(r, 4000))]);
  ScrollTrigger.refresh();
  if (AUTOPLAY) { window.scrollTo(0, 0); lenis && lenis.scrollTo(0, { immediate: true }); }
  if (REEL) { html.classList.add('is-reel'); reelOpen(); }      // the reel opens on the flow diagram, already in place when the clock starts
  window.__ready = true;
  if (RECORD) await new Promise((r) => { window.__go = r; });   // the recorder starts the clock
  clearTimeout(window.__plainT); window.__booted = true;
  if (RECORD && !reduced && !REEL) await runHook();
  await runIntro();
  if (REEL) { const tl = buildReel(); window.__autoplayDuration = tl.duration(); tl.play(); }
  else if (AUTOPLAY) { ScrollTrigger.refresh(); window.__flowSpeed = window.__chatSpeed = PACE; const tl = buildAutoplay().timeScale(PACE); window.__autoplayDuration = tl.duration() / PACE; tl.play(); }
}
boot();
