// Case study pages: language switch, reveal on scroll, and the picture viewer. No smooth scroll, no 3D: a calm reading page.
(() => {
  const html = document.documentElement, qs = new URLSearchParams(location.search);
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const okLang = (v) => { v = (v || '').toLowerCase(); return v === 'en' || v === 'vi' ? v : ''; };
  const qLang = okLang(qs.get('lang'));
  html.lang = qLang || okLang(store.get('lang')) || ((navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en');
  if (qLang) store.set('lang', qLang);
  const setLangButtons = () => document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === html.lang)));
  setLangButtons();
  document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
    html.lang = b.dataset.lang; store.set('lang', html.lang); setLangButtons();
    if (qs.has('lang')) { qs.delete('lang'); const q = qs.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); }
  }));

  // reveal: anything already on screen appears at once, the rest as it scrolls in
  const items = [...document.querySelectorAll('[data-reveal]')];
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) items.forEach((el) => el.classList.add('in'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  }
  const toTop = document.getElementById('toTop');
  if (toTop) toTop.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // picture viewer: any image marked data-zoom opens large; clicking it again shows it at full size to pan
  const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbStage = document.getElementById('lbStage');
  let list = [], at = 0, from = null;
  const zoomables = () => [...document.querySelectorAll('img[data-zoom]')].filter((im) => im.offsetParent !== null && !lb.contains(im));
  function show(k) {
    at = (k + list.length) % list.length;
    const im = list[at], fig = im.closest('figure'), cap = fig && fig.querySelector('figcaption');
    lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbCap.innerHTML = cap ? cap.innerHTML : im.alt;
    lb.classList.remove('is-1x'); lb.style.setProperty('--lb-w', 'auto'); lbStage.scrollTo(0, 0);
    document.getElementById('lbPrev').hidden = document.getElementById('lbNext').hidden = list.length < 2;
  }
  function open(im) { list = zoomables(); from = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; show(Math.max(0, list.indexOf(im))); document.getElementById('lbClose').focus(); }
  function close() { lb.hidden = true; lbImg.removeAttribute('src'); document.body.style.overflow = ''; from && from.focus && from.focus({ preventScroll: true }); }
  document.addEventListener('click', (e) => {
    if (lb.contains(e.target)) return;
    const btn = e.target.closest('.shot button');
    const im = e.target.closest('img[data-zoom]') || (btn && btn.querySelector('img[data-zoom]'));
    if (im) { e.preventDefault(); open(im); }
  });
  lbImg.addEventListener('click', (e) => { e.stopPropagation(); lb.classList.toggle('is-1x'); lbStage.scrollTo(0, 0); });
  lbStage.addEventListener('click', close);
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', () => show(at - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(at + 1));
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(at - 1); else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'Tab') {            // Tab stays inside the viewer
      const f = [...lb.querySelectorAll('button')].filter((el) => !el.hidden), a = f[0], z = f[f.length - 1];
      if (!lb.contains(document.activeElement)) { e.preventDefault(); a.focus(); } else if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  // a picture that is not wrapped in a button still has to open from the keyboard
  document.querySelectorAll('img[data-zoom]').forEach((im) => { if (im.closest('button') || lb.contains(im)) return; im.tabIndex = 0; im.setAttribute('role', 'button'); im.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(im); } }); });

  // "Auto-play": the page reads itself. It moves from one block to the next at a steady pace and rests at each heading;
  // any touch, scroll or key hands the page back, and pressing the button again carries on from where the page is.
  const tourBtn = document.getElementById('tourBtn');
  if (tourBtn) {
    const SPEED = innerWidth > 900 ? 190 : 150;                 // pixels a second while travelling
    const STOPPERS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    let raf = 0, playing = false;
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    const stops = () => {
      const tops = [0, ...[...document.querySelectorAll('.cs-sec, .cs-dec, .cs-shots, .cs-facts')].map((el) => el.getBoundingClientRect().top + scrollY - (el.matches('.cs-sec') ? 84 : innerHeight * 0.16))];
      const ys = [...new Set(tops.map((y) => Math.round(Math.max(0, Math.min(y, maxY())))))].sort((x, y) => x - y);
      if (ys[ys.length - 1] < maxY() - 40) ys.push(maxY());
      return ys;
    };
    const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
    function stop() {
      if (!playing) return;
      playing = false; cancelAnimationFrame(raf);
      STOPPERS.forEach((t) => removeEventListener(t, onStopper, true));
      tourBtn.classList.remove('is-on'); tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.style.setProperty('--tour', 0);
    }
    function onStopper(e) { const own = tourBtn.contains(e.target) && (e.type === 'pointerdown' || e.type === 'touchstart' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '))); if (!own) stop(); }   // the button's own click toggles; everything else hands the page back
    function start() {
      if (!lb.hidden) close();
      let list = stops();
      if (scrollY >= maxY() - 8) { window.scrollTo(0, 0); list = stops(); }      // already at the end: start over
      let k = list.findIndex((y) => y > scrollY + 8), from = scrollY, t0 = performance.now(), rest = 900;
      playing = true; tourBtn.classList.add('is-on'); tourBtn.setAttribute('aria-pressed', 'true');
      STOPPERS.forEach((t) => addEventListener(t, onStopper, { capture: true, passive: true }));
      const tick = (now) => {
        if (!playing) return;
        if (k < 0 || k >= list.length) { stop(); return; }
        const to = list[k], dur = Math.max(900, Math.abs(to - from) / SPEED * 1000), t = (now - t0 - rest) / dur;
        if (t >= 1) { window.scrollTo(0, to); from = to; k += 1; t0 = now; rest = 1500; }           // rest at each stop
        else if (t > 0) window.scrollTo(0, from + (to - from) * ease(t));
        tourBtn.style.setProperty('--tour', (scrollY / Math.max(1, maxY())).toFixed(3));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    tourBtn.addEventListener('click', () => (playing ? stop() : start()));
  }

})();
