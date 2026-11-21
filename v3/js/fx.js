/* Phạm Thùy Linh — portfolio v3 · motion layer.
   Loaded before main.js. Every effect is separate and optional: if one throws, the others still run.
   Soft by rule: words rise out of a blur (no hard-edged masks), nothing is cut off, and reduced-motion gets the plain page.
   Ideas come from a motion-design portfolio reel (glowing orbit rings, a giant ghost title behind glass, an orbit menu,
   a typing chat, scrambled labels, a tilted wall that flattens); colours and tone stay the pearl & champagne of this site. */
const gsap = window.gsap, ST = window.ScrollTrigger;
if (!gsap || !ST) throw new Error('animation library did not load');
gsap.registerPlugin(ST);

const qs = new URLSearchParams(location.search);
const AUTO = qs.has('autoplay') || qs.has('record');
const html = document.documentElement;
const reduced = !AUTO && matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = !reduced && ((!AUTO && matchMedia('(hover: hover) and (pointer: fine)').matches) || (qs.has('record') && innerWidth > 900));   // the recorder drives a real mouse
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const safe = (name, fn) => { try { fn(); } catch (e) { console.warn('[fx] ' + name, e); } };
const lang = () => (html.lang === 'vi' ? 'vi' : 'en');
const PRI = { refreshPriority: -1 };      // measure after main.js has pinned the project wall, so everything below it is positioned right
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const pair = (o) => { const f = document.createDocumentFragment(); f.append(el('span', 'en', o.en), el('span', 'vi', o.vi)); return f; };   // both languages; the stylesheet shows one
const onIntro = (fn) => { let done = false; const run = () => { if (done) return; done = true; fn(); }; document.addEventListener('intro:done', run, { once: true }); setTimeout(run, 9000); };   // 9 s: the film never ended (script trouble)

/* scroll speed, smoothed: the marquee and the orbit speed up with it */
let lastY = scrollY, vel = 0;
gsap.ticker.add(() => { const y = scrollY, d = y - lastY; lastY = y; vel += (d - vel) * 0.12; });

/* ---------- headings: words rise out of a soft blur ---------- */
function splitWords(root) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        let first = true;
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.append(document.createTextNode(' ')); first = false; return; }
          // a full stop right after an emphasised phrase joins the last word of that phrase (one unbreakable box), so it can never wrap onto a line of its own
          const prev = n.previousSibling, lastWord = first && prev && prev.nodeType === 1 ? [...prev.querySelectorAll('.w')].pop() : null;
          first = false;
          if (lastWord && /^[.,;:!?…"')\]]+$/.test(p)) { lastWord.append(el('span', 'pn', p)); return; }
          const w = el('span', 'w', p);
          frag.append(w); words.push(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) { const tag = n.tagName.toLowerCase(); if (tag !== 'br' && tag !== 'svg') walk(n); }
    });
  };
  walk(root);
  return words;
}
const wordGroups = (h) => { const L = $$(':scope > .en, :scope > .vi', h); return (L.length ? L : [h]).map(splitWords).filter((g) => g.length); };
// The words start hidden by CSS (.hs). GSAP must only ever touch words that are on screen: for an element that is display:none
// (the other language) it takes the element out of the page and puts it back before the next ELEMENT, which drops every space
// text node in between and glues words together. So the visible language animates; the other one is simply shown by CSS (.hs-in).
const onScreen = (node) => node.getClientRects().length > 0;
function revealWords(h, groups, delay = 0) {
  h.classList.add('hs-in');
  groups.filter((g) => onScreen(g[0])).forEach((g) => gsap.fromTo(g, { opacity: 0, y: 28, filter: 'blur(12px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', stagger: 0.055, delay, clearProps: 'opacity,transform,filter' }));
}

safe('headings', () => {
  if (reduced) return;
  $$('.h-title, .toolkit__title, .contact h2').forEach((h) => {
    h.removeAttribute('data-reveal');                        // main.js has not run yet, so it will not fade this one too
    const groups = wordGroups(h); if (!groups.length) return;
    h.classList.add('hs');
    ST.create({ trigger: h, start: 'top 88%', once: true, ...PRI, onEnter: () => revealWords(h, groups) });
  });
  const h1 = $('.hero h1');
  if (h1) { h1.removeAttribute('data-reveal'); const groups = wordGroups(h1); if (groups.length) { h1.classList.add('hs'); onIntro(() => revealWords(h1, groups, 0.1)); } }
});

/* ---------- small labels decode: the letters settle into place ---------- */
safe('decode', () => {
  if (reduced) return;
  $$('.eyebrow .en, .eyebrow .vi').forEach((node) => {
    const final = node.textContent; if (!final.trim()) return;
    const letters = [...new Set(final.toLowerCase().replace(/[^\p{L}]/gu, '').split(''))];
    if (letters.length < 2) return;
    const o = { p: 0 }; let last = 0;
    const run = () => gsap.to(o, { p: 1, duration: clamp(final.length * 0.03, 0.7, 1.4), ease: 'power1.inOut',
      onUpdate: () => {
        const now = performance.now(); if (now - last < 45 && o.p < 1) return; last = now;
        const n = Math.floor(o.p * final.length); let s = '';
        for (let i = 0; i < final.length; i++) { const c = final[i]; s += i < n || !/\p{L}/u.test(c) ? c : letters[(Math.random() * letters.length) | 0]; }
        node.textContent = s;
      },
      onComplete: () => { node.textContent = final; } });
    ST.create({ trigger: node.parentElement, start: 'top 86%', once: true, ...PRI, onEnter: run });
  });
});

/* ---------- hero: a hand-drawn line under the italic phrase ---------- */
safe('scribble', () => {
  const svgs = $$('.scribble'); if (!svgs.length) return;
  let drawn = reduced;
  const build = (svg) => {
    const w = Math.round(svg.getBoundingClientRect().width); if (w < 20) return;         // the other language is hidden: nothing to measure
    const f = (v) => v.toFixed(1);
    svg.setAttribute('viewBox', `0 0 ${w} 24`);
    const [a, b] = svg.querySelectorAll('path');
    a.setAttribute('d', `M3 13 C ${f(w * 0.14)} 4, ${f(w * 0.3)} 21, ${f(w * 0.5)} 12 S ${f(w * 0.82)} 4, ${w - 3} 10`);
    b.setAttribute('d', `M${f(w * 0.1)} 21 C ${f(w * 0.35)} 16, ${f(w * 0.7)} 22, ${f(w * 0.93)} 17`);
    [a, b].forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; if (!drawn) p.style.strokeDashoffset = len; });
  };
  svgs.forEach((svg) => new ResizeObserver(() => build(svg)).observe(svg));
  const draw = () => { if (drawn) return; drawn = true; svgs.forEach((svg) => [...svg.querySelectorAll('path')].forEach((p, i) => gsap.to(p, { strokeDashoffset: 0, duration: i ? 0.9 : 1.3, ease: 'power2.inOut', delay: 0.6 + i * 0.35 }))); };
  onIntro(draw);
});

/* ---------- orbit rings (hero, contact) and the giant ghost word ---------- */
safe('rings', () => {
  $$('.rings__svg').forEach((svg) => {
    const host = svg.closest('.hero, .contact');
    if (!reduced && host) gsap.fromTo(svg, { yPercent: -4 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: 0.6, ...PRI } });
  });
  const hero = $('.hero'), hs = $('.hero .rings__svg');
  if (finePointer && hero && hs) {
    const qx = gsap.quickTo(hs, 'x', { duration: 1.3, ease: 'power3' }), qy = gsap.quickTo(hs, 'y', { duration: 1.3, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(); qx(((e.clientX - r.left) / r.width - 0.5) * -40); qy(((e.clientY - r.top) / r.height - 0.5) * -28); });
  }
  const ghost = $('.ghost');
  if (ghost && !reduced) gsap.fromTo(ghost, { y: 70 }, { y: -130, ease: 'none', scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 0.6, ...PRI } });
});

/* ---------- toolkit: tools orbit a pearl; hover, focus or tap names what each is for ---------- */
safe('orbit', () => {
  const box = $('#orbit'), desc = $('#tkDesc'); if (!box || !desc) return;
  const nodes = $$('.orbit__node', box);
  const spec = nodes.map((n) => ({ el: n, r: +n.dataset.r, p: +n.dataset.p, d: +n.dataset.d, s: +n.dataset.s }));
  let W = box.clientWidth, t = 0, rate = 1, hold = false, active = null, touched = false, visible = false, tapTimer = null;
  const place = () => spec.forEach((n) => {
    const a = n.p + n.d * n.s * t * 0.35;
    n.el.style.transform = `translate(-50%, -50%) translate(${(Math.cos(a) * n.r * W).toFixed(1)}px, ${(Math.sin(a) * n.r * W).toFixed(1)}px)`;
  });
  new ResizeObserver(() => { W = box.clientWidth; place(); }).observe(box);
  place();
  ST.create({ trigger: box, start: 'top bottom', end: 'bottom top', ...PRI, onToggle: (s) => { visible = s.isActive; } });
  if (!reduced) gsap.ticker.add((time, dt) => {
    if (!visible) return;
    rate += ((hold ? 0 : 1 + clamp(Math.abs(vel) * 0.06, 0, 3.5)) - rate) * 0.08;        // scrolling spins it faster, a hover stops it
    t += (dt / 1000) * rate; place();
  });
  const setActive = (n) => {
    if (active === n) return; active = n;
    nodes.forEach((x) => x.classList.toggle('is-on', x === n));
    desc.replaceChildren(el('span', 'en', n.dataset.en), el('span', 'vi', n.dataset.vi));
    if (!reduced) gsap.fromTo(desc, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
  };
  nodes.forEach((n) => {
    n.addEventListener('pointerenter', () => { touched = true; hold = true; setActive(n); });
    n.addEventListener('pointerleave', () => { hold = false; });
    n.addEventListener('focus', () => { touched = true; hold = true; setActive(n); });
    n.addEventListener('blur', () => { hold = false; });
    n.addEventListener('click', () => { touched = true; setActive(n); hold = true; clearTimeout(tapTimer); tapTimer = setTimeout(() => { hold = false; }, 4000); });   // a tap has no hover: keep it still for a moment
  });
  let i = -1;
  const cycle = () => { if (touched || reduced) return; if (visible) { i = (i + 1) % nodes.length; setActive(nodes[i]); } gsap.delayedCall(3.4, cycle); };   // until someone interacts, it names the tools by itself
  ST.create({ trigger: box, start: 'top 80%', once: true, ...PRI, onEnter: () => gsap.delayedCall(0.6, cycle) });
});

/* ---------- ask: a short chat. The questions are canned and every answer is a line already on this page ---------- */
safe('chat', () => {
  const log = $('#chatLog'), chips = $('#chatChips'), live = $('#chatLive'), box = $('#chat'); if (!log || !chips || !box) return;
  const MAIL = 'mailto:phamlinh278.work@gmail.com';
  const QA = [
    { id: 'first', q: { en: 'Which project should I look at first?', vi: 'Nên xem dự án nào trước?' },
      a: { en: 'The LinHiêu terminology assistant: a term card that follows the audio being played. The host app is mine and in daily use.', vi: 'Trợ lý thuật ngữ LinHiêu: thẻ thuật ngữ đổi theo đoạn audio đang phát. App gốc do tôi tự dựng, đang dùng hằng ngày.' },
      act: { href: 'linhieu.html#assistant', en: 'Read the case study', vi: 'Đọc case study' } },
    { id: 'what', q: { en: 'What do you design best?', vi: 'Bạn thiết kế mạnh nhất ở điểm nào?' },
      a: { en: 'Flows and states. I map the happy path first, then every place a person can get stuck, and each state gets a screen of its own. After that come Figma and a working HTML prototype anyone can tap through.', vi: 'Luồng và trạng thái. Tôi vẽ luồng chính trước, rồi mọi chỗ người dùng có thể bị kẹt, mỗi trạng thái một màn riêng. Sau đó mới đến Figma và một bản chạy thử HTML để ai cũng tự bấm được.' } },
    { id: 'ai', q: { en: 'How do you use AI?', vi: 'Bạn dùng AI như thế nào?' },
      a: { en: 'AI drafts the first wireframe from the requirements and helps me get from rules to a working prototype fast. The flow, the states and the hierarchy are my calls.', vi: 'AI dựng bản nháp wireframe từ tài liệu yêu cầu và giúp tôi đi nhanh từ quy tắc đến bản chạy thử. Luồng, trạng thái và thứ bậc thông tin do tôi quyết.' } },
    { id: 'ba', q: { en: 'Why design, coming from BA / PO?', vi: 'Vì sao từ BA / PO sang thiết kế?' },
      a: { en: 'Three and a half years as a BA and PO taught me to start from rules, flows and edge states. That is why every detail on my screens traces back to a rule.', vi: 'Ba năm rưỡi làm BA và PO dạy tôi bắt đầu từ quy tắc, luồng và trạng thái biên. Vì vậy mỗi chi tiết trên màn hình của tôi đều truy được về một quy tắc.' } },
    { id: 'hire', q: { en: 'What are you looking for?', vi: 'Bạn đang tìm gì?' },
      a: { en: 'A product designer role in Hà Nội. If you would like a closer look at any project, write to me and I will reply the same day.', vi: 'Một vị trí product designer ở Hà Nội. Bạn muốn xem kỹ dự án nào thì cứ nhắn tôi, tôi trả lời trong ngày.' },
      act: { href: MAIL, en: 'Email me', vi: 'Gửi email cho tôi' } },
  ];
  const asked = new Set();
  let busy = false, started = false;
  const toBottom = () => { log.scrollTop = log.scrollHeight; };

  function addMsg(kind) {
    const m = el('div', 'msg msg--' + kind), who = el('div', 'msg__who'), b = el('div', 'bubble');
    who.append(pair(kind === 'me' ? { en: 'You', vi: 'Bạn' } : { en: 'Linh', vi: 'Linh' }));
    const sp = { en: el('span', 'en'), vi: el('span', 'vi') };
    b.append(sp.en, sp.vi); m.append(who, b); log.append(m); toBottom();
    return { m, b, sp };
  }
  const fill = (msg, text) => { msg.sp.en.textContent = text.en; msg.sp.vi.textContent = text.vi; };
  function typeInto(msg, text, cps) {                         // the language on screen types out; the other one is filled in at once
    const L = lang(), O = L === 'en' ? 'vi' : 'en', full = text[L].normalize('NFC'), o = { n: 0 };
    msg.sp[O].textContent = text[O]; msg.b.classList.add('is-typing');
    return gsap.to(o, { n: full.length, duration: Math.max(0.35, full.length / cps), ease: 'none',
      onUpdate: () => { msg.sp[L].textContent = full.slice(0, Math.round(o.n)); toBottom(); },
      onComplete: () => { msg.sp[L].textContent = full; msg.b.classList.remove('is-typing'); } });
  }
  function addTyping() { const d = el('div', 'msg msg--you'); const dots = el('div', 'dots'); dots.append(el('i'), el('i'), el('i')); d.append(dots); log.append(d); toBottom(); return d; }
  function addAction(msg, act) {
    const a = el('a', 'act'); a.href = act.href; a.append(pair(act));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-arrow'); svg.append(use); a.append(svg); msg.b.append(a); toBottom();
  }
  function renderChips() {
    chips.replaceChildren();
    const left = QA.filter((q) => !asked.has(q.id));
    left.forEach((q) => { const b = el('button', 'qchip'); b.type = 'button'; b.append(pair(q.q)); b.disabled = busy; b.addEventListener('click', () => { if (busy) return; started = true; play(q, { fast: true }); }); chips.append(b); });
    if (!left.length) { const b = el('button', 'qchip qchip--quiet'); b.type = 'button'; b.append(pair({ en: 'Start over', vi: 'Hỏi lại từ đầu' })); b.addEventListener('click', () => { if (busy) return; asked.clear(); log.replaceChildren(); renderChips(); }); chips.append(b); }
    if (!reduced && chips.children.length) gsap.from(chips.children, { opacity: 0, y: 8, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'opacity,transform' });
  }
  function play(qa, { fast = false } = {}) {
    busy = true; $$('.qchip', chips).forEach((b) => { b.disabled = true; });
    const finish = () => { busy = false; asked.add(qa.id); live.textContent = qa.a[lang()]; renderChips(); };
    if (reduced) {                                              // no typing, no waiting
      const me = addMsg('me'); fill(me, qa.q); const you = addMsg('you'); fill(you, qa.a); qa.act && addAction(you, qa.act); finish(); return;
    }
    const SP = window.__chatSpeed || 1;                        // a faster recording types faster too
    const L = lang(), dQ = fast ? 0.1 : Math.max(0.5, qa.q[L].length / (30 * SP)), dA = Math.max(0.6, qa.a[L].length / (58 * SP));
    let me, dots, you;
    const tl = gsap.timeline({ onComplete: finish });
    tl.call(() => { me = addMsg('me'); fast ? fill(me, qa.q) : typeInto(me, qa.q, 30 * SP); })
      .to({}, { duration: dQ + 0.35 })
      .call(() => { dots = addTyping(); })
      .to({}, { duration: (fast ? 0.7 : 1.0) / SP })
      .call(() => { dots.remove(); you = addMsg('you'); typeInto(you, qa.a, 58 * SP); })
      .to({}, { duration: dA })
      .call(() => { qa.act && addAction(you, qa.act); toBottom(); })
      .to({}, { duration: 0.3 });
  }
  renderChips();
  if (reduced) { started = true; play(QA[0]); }
  else ST.create({ trigger: box, start: 'top 72%', once: true, ...PRI, onEnter: () => { if (!started) { started = true; play(QA[0]); } } });   // the first question plays by itself
});

/* ---------- screens: on wide screens every screen floats up onto a curved 3D wall, and the wall glides past as you scroll ----------
   Like screens projected round you in a gallery: the one in front is sharp and lifted, the ones to the side turn towards
   you and go soft (depth of field). On phones the two grids stay, and lay themselves flat as you arrive. */
safe('screens', () => {
  const sec = $('#screens'); if (!sec) return;
  const narrow = () => $$('#screens .shots').map((g) => gsap.fromTo(g, { rotationX: 16, y: 40, scale: 0.94, transformOrigin: '50% 0%', transformPerspective: 1400 },
    { rotationX: 0, y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: g, start: 'top 98%', end: 'top 42%', scrub: 0.5, ...PRI } }));
  const start = () => {
    if (reduced) return;
    gsap.matchMedia().add({ wide: '(min-width: 901px)', small: '(max-width: 900px)' }, (ctx) => {
      if (ctx.conditions.small) { narrow(); return; }
      return theatre(sec);
    });
  };
  document.addEventListener('shots:ready', start, { once: true });          // main.js fills the two grids, then says so
});

function theatre(sec) {
  const grids = $$('.shots', sec), labels = $$('.shots__label', sec);
  const figs = grids.flatMap((g) => $$('.shot', g));
  if (figs.length < 2) return;
  const group = figs.map((f) => grids.indexOf(f.parentElement));
  const phone = figs.map((f) => f.parentElement.classList.contains('shots--phone'));
  const N = figs.length;

  // ---- build: header (which product · 03 / 10), the stage, a caption for the screen in front, a progress line
  const th = el('div', 'theatre'), head = el('div', 'theatre__head'), count = el('div', 'theatre__count');
  const stage = el('div', 'theatre__stage'), world = el('div', 'theatre__world'), glow = el('i', 'theatre__glow');
  const cap = el('div', 'theatre__cap'), bar = el('div', 'theatre__bar'), fill = el('b');
  cap.setAttribute('aria-live', 'polite'); bar.append(fill);
  labels.forEach((l) => head.append(l)); head.append(count);
  figs.forEach((f, i) => { f.removeAttribute('data-reveal'); f.classList.add(phone[i] ? 'shot--phone' : 'shot--web'); world.append(f); });
  stage.append(glow, world); th.append(head, stage, cap, bar);
  grids[0].before(th); sec.classList.add('has-theatre');

  // ---- layout: card sizes and their places along the wall (arc length, in px)
  let xs = [], R = 1000;
  const layout = () => {
    const tall = innerHeight > innerWidth;                     // a tall window (a vertical video) has room for bigger screens
    const H = Math.min(innerHeight * (tall ? 0.42 : 0.52), tall ? 760 : 560);
    const pw = H * 425 / 900, ww = Math.min(innerWidth * (tall ? 0.66 : 0.44), H * 1.2), wh = ww / 1.6;
    let x = 0;
    xs = figs.map((f, i) => {
      const w = phone[i] ? pw : ww, h = phone[i] ? H : wh;
      if (i) { const wPrev = phone[i - 1] ? pw : ww; x += wPrev / 2 + (group[i] !== group[i - 1] ? 150 : phone[i] ? 44 : 70) + w / 2; }
      Object.assign(f.style, { width: w + 'px', height: h + 'px', marginLeft: -w / 2 + 'px', marginTop: -h / 2 + 'px' });
      return x;
    });
    R = innerWidth * 0.95;
  };
  layout();

  // ---- scroll: the wall is pinned while the camera travels from the first screen to the last
  let target = 0, cur = 0, active = -1, eager = false;
  const st = ST.create({ trigger: th, start: 'top top', end: () => '+=' + Math.round((N - 1) * innerHeight * 0.42), pin: true, anticipatePin: 1, ...PRI,
    onRefresh: layout, onUpdate: (s) => { target = s.progress * (N - 1); } });
  window.__theatre = st;
  const yOf = (i) => st.start + (st.end - st.start) * (i / (N - 1));
  const glide = (i, d = 0.9) => { const y = Math.round(yOf(clamp(i, 0, N - 1))), L = window.__lenis; if (L) L.scrollTo(y, { duration: d, easing: (t) => 1 - Math.pow(1 - t, 3) }); else scrollTo({ top: y, behavior: 'smooth' }); };

  // a screen off to the side comes to the front first; the one in front opens large (main.js's viewer)
  const onClick = (e) => { const f = e.target.closest('.shot'); if (!f) return; const i = figs.indexOf(f); if (i !== active) { e.preventDefault(); e.stopPropagation(); glide(i); } };
  const onFocus = (e) => { const f = e.target.closest('.shot'); if (f && figs.indexOf(f) !== active && st.isActive) glide(figs.indexOf(f), 0.6); };
  stage.addEventListener('click', onClick); stage.addEventListener('focusin', onFocus);

  // stop between two screens and the wall settles on the nearer one
  let snapT;
  const touring = () => AUTO || ($('#tourBtn') && $('#tourBtn').classList.contains('is-on'));
  const onScroll = () => { clearTimeout(snapT); snapT = setTimeout(() => {
    if (!st.isActive || touring()) return;
    const k = Math.round(target); if (Math.abs(target - k) > 0.02) glide(k, 0.6);
  }, 180); };
  addEventListener('scroll', onScroll, { passive: true });

  // the pointer sways the whole wall a little (a camera that breathes)
  let sx = 0, sy = 0, px = 0, py = 0;
  const onMove = (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; };
  if (finePointer) addEventListener('pointermove', onMove, { passive: true });

  const blurNow = figs.map(() => -1);
  const render = (time) => {
    const r = th.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight * 1.3) return;           // far away: nothing to draw
    const E = clamp(1 - r.top / (innerHeight * 0.8), 0, 1);              // 0 → 1 while the stage rises into place
    if (E > 0 && !eager) { eager = true; figs.forEach((f) => { $('img', f).loading = 'eager'; }); }
    cur += (target - cur) * 0.14; if (Math.abs(target - cur) < 0.0005) cur = target;
    sx += (px - sx) * 0.05; sy += (py - sy) * 0.05;
    world.style.transform = `rotateY(${(sx * 5).toFixed(2)}deg) rotateX(${(-sy * 3).toFixed(2)}deg)`;
    const i0 = Math.min(N - 2, Math.floor(cur)), fr = cur - i0, cam = xs[i0] + (xs[i0 + 1] - xs[i0]) * fr;
    const now = Math.round(cur);
    figs.forEach((f, i) => {
      const a = (xs[i] - cam) / R, k = Math.abs(a), A = clamp(a, -1.25, 1.25);
      const e0 = clamp((E - Math.min(k, 1) * 0.3) / 0.7, 0, 1), e = 1 - Math.pow(1 - e0, 3);       // the one in front rises first, then the sides
      const near = 1 - Math.min(1, Math.abs(cur - i) * 2);
      const X = R * Math.sin(A), Z = R * (1 - Math.cos(A)) * 0.5 + 40 * near;
      const Y = (1 - e) * innerHeight * 0.6 + Math.sin(time * 1.1 + i * 0.9) * 6 * e - 8 * near;
      const rY = -A * 52, rX = (1 - e) * 42;
      f.style.transform = `translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, ${Z.toFixed(1)}px) rotateY(${rY.toFixed(2)}deg) rotateX(${rX.toFixed(2)}deg)`;
      f.style.opacity = (e * clamp(1.75 - k * 1.25, 0, 1)).toFixed(3);
      const b = Math.round((clamp((k - 0.12) * 9, 0, 7) + (1 - e) * 6) * 4) / 4;
      if (b !== blurNow[i]) { blurNow[i] = b; f.style.filter = b ? `blur(${b}px)` : ''; }
    });
    if (now !== active) {
      active = now;
      figs.forEach((f, i) => { f.classList.toggle('is-on', i === active); $('button', f).tabIndex = Math.abs(i - active) <= 2 ? 0 : -1; });
      labels.forEach((l, g) => l.classList.toggle('is-on', g === group[active]));
      const fc = $('figcaption', figs[active]);
      cap.innerHTML = fc ? fc.innerHTML : '';
      gsap.fromTo(cap, { opacity: 0, y: 8, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', overwrite: true });
      count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    }
    fill.style.transform = `scaleX(${(cur / (N - 1)).toFixed(4)})`;
  };
  gsap.ticker.add(render);

  return () => {            // the window went narrow: put everything back as it was
    gsap.ticker.remove(render); removeEventListener('scroll', onScroll); removeEventListener('pointermove', onMove);
    stage.removeEventListener('click', onClick); stage.removeEventListener('focusin', onFocus);
    figs.forEach((f, i) => { f.style.cssText = ''; f.classList.remove('is-on', 'shot--phone', 'shot--web'); $('button', f).tabIndex = 0; grids[group[i]].append(f); });
    labels.forEach((l, g) => { l.classList.remove('is-on'); grids[g].before(l); });
    th.replaceWith(); sec.classList.remove('has-theatre'); window.__theatre = null;
  };
}

/* ---------- flow: the diagram fits one window and draws itself — each line runs from box to box, a spark at its tip,
   and every box blooms when its line arrives. Afterwards small lights keep travelling the main path. A lens reads it up close. ---------- */
safe('flow', () => {
  if (reduced) return;
  const card = $('.flow-card'), figs = $$('.flow-fig'); if (!card || !figs.length) return;
  const NS = 'http://www.w3.org/2000/svg', LINE = ['#2E2823', '#A07A2C', '#B4574F', '#A79F93'], DASH = '#A79F93', GOLD = '#C9A14A';
  const SPEED = 560, POP = 0.32;                        // line speed in diagram units per second; pause at a box before its lines leave
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const visible = () => figs.find((f) => f.offsetParent !== null);
  window.__flowFront = () => { const f = visible(); return f && f._front && f._tl && f._tl.isActive() ? f._front() : null; };   // null once the drawing is finished
  const replay = $('.flow-replay');

  // the diagram's lines are filled outlines (exported from Figma), so they are read back into centre lines here
  const subpaths = (d) => {
    const out = []; let pts = null, x = 0, y = 0, cmd = '';
    const tok = d.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [];
    for (let i = 0; i < tok.length;) {
      const t = tok[i];
      if (/[A-Z]/i.test(t)) { cmd = t.toUpperCase(); i++; if (cmd === 'Z') { pts && out.push(pts); pts = null; } continue; }
      if (cmd === 'M') { x = +tok[i]; y = +tok[i + 1]; i += 2; pts = [[x, y]]; cmd = 'L'; }
      else if (cmd === 'C') { x = +tok[i + 4]; y = +tok[i + 5]; i += 6; pts.push([x, y]); pts.curved = true; }
      else if (cmd === 'L') { x = +tok[i]; y = +tok[i + 1]; i += 2; pts.push([x, y]); }
      else if (cmd === 'H') { x = +tok[i]; i++; pts.push([x, y]); }
      else if (cmd === 'V') { y = +tok[i]; i++; pts.push([x, y]); }
      else i++;
    }
    pts && out.push(pts);
    return out;
  };
  const bbox = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const centreLine = (d) => {
    // thin pieces are the line (dashes included), the one fat piece is the arrowhead; rounded corners are skipped (the reveal is wide enough to cover them)
    const segs = [], tris = [];
    subpaths(d).filter((p) => !p.curved).forEach((p) => { const b = bbox(p);
      if (Math.min(b.w, b.h) > 2.6) tris.push(p);
      else segs.push(b.w < b.h ? [[b.x + b.w / 2, b.y], [b.x + b.w / 2, b.y + b.h]] : [[b.x, b.y + b.h / 2], [b.x + b.w, b.y + b.h / 2]]); });
    const out = [];
    segs.forEach((s, j) => {
      let [a, b] = s; const prev = out[out.length - 1], nx = segs[j + 1];
      if (prev) { if (dist(prev, b) < dist(prev, a)) [a, b] = [b, a]; }
      else if (nx && Math.min(dist(a, nx[0]), dist(a, nx[1])) < Math.min(dist(b, nx[0]), dist(b, nx[1]))) [a, b] = [b, a];
      out.push(a, b);
    });
    if (out.length && tris.length) {          // the line runs towards its arrow (some are written starting from the arrow end), and ends at the arrow's tip
      const t = tris[0], c = [t.reduce((s, p) => s + p[0], 0) / t.length, t.reduce((s, p) => s + p[1], 0) / t.length];
      if (dist(c, out[0]) < dist(c, out[out.length - 1])) out.reverse();
      const last = out[out.length - 1]; out.push(t.reduce((m, p) => (dist(p, last) > dist(m, last) ? p : m)));
    }
    return out;
  };
  const lengths = (pts) => { const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + dist(pts[i - 1], pts[i])); return acc; };
  const pointAt = (pts, acc, s) => { let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const t = clamp((s - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1), 0, 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]; };
  const nearestOn = (pts, acc, p) => { let best = { d: Infinity, s: 0 };
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
      const t = clamp(((p[0] - ax) * dx + (p[1] - ay) * dy) / L2, 0, 1), q = [ax + dx * t, ay + dy * t], d = dist(p, q);
      if (d < best.d) best = { d, s: acc[i - 1] + t * Math.sqrt(L2) }; }
    return best; };
  const inside = (b, p, m = 9) => p[0] >= b.x - m && p[0] <= b.x + b.w + m && p[1] >= b.y - m && p[1] <= b.y + b.h + m;

  // ---- load: the SVG file comes in as live elements on top of the picture (the picture stays for the viewer and for no-script)
  const load = (fig) => fig._p || (fig._p = (async () => {
    const img = $('img', fig), code = fig.classList.contains('vi') ? 'vi' : 'en', pre = 'fl' + code + '-';
    const txt = await (await fetch(img.getAttribute('src'))).text();
    const doc = new DOMParser().parseFromString(txt.replace(/id="/g, `id="${pre}`).replace(/url\(#/g, `url(#${pre}`), 'image/svg+xml');
    const svg = document.importNode(doc.documentElement, true);
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('class', 'flow-svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    const vb = svg.viewBox.baseVal, root = svgEl('g', { id: pre + 'root', fill: svg.getAttribute('fill') || 'none' }), defs = svgEl('defs', {});   // the file's fill="none" moves onto the group, so the lens copy keeps it
    root.append(...svg.childNodes); svg.append(defs, root);
    const kids = [...root.children], nodes = [], pills = [], lines = [], heads = [];
    let boxes = false;                     // Figma writes the title, then every connector, then the boxes
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i], tag = k.tagName, fillC = (k.getAttribute('fill') || '').toUpperCase(), d = k.getAttribute('d') || '';
      if (i < 2 && tag === 'rect') continue;                                          // the paper the diagram sits on
      const wrap = (els, cls) => { const g = svgEl('g', { class: cls }); k.before(g); g.append(...els.filter(Boolean)); g.style.opacity = '0'; return g; };
      if (tag === 'rect' && fillC) {                                                  // a box or a label pill: fill, outline, words
        boxes = true;
        const b = { x: +k.getAttribute('x'), y: +k.getAttribute('y'), w: +k.getAttribute('width'), h: +k.getAttribute('height') };
        const g = wrap([k, kids[i + 1], kids[i + 2]], fillC === 'WHITE' ? 'fl-pill' : 'fl-node'); i += 2;
        (fillC === 'WHITE' ? pills : nodes).push({ g, b, shape: k });
      } else if (tag === 'path' && fillC === '#E6E9EF') {                             // a decision: fill, mask, outline, words
        const b = bbox(subpaths(d)[0]); const g = wrap([k, kids[i + 1], kids[i + 2], kids[i + 3]], 'fl-node'); i += 3;
        nodes.push({ g, b, shape: k, diamond: true });
      } else if (tag === 'path' && !boxes && heads.length >= 2 && LINE.includes(fillC)) {    // a connector
        const pts = centreLine(d); if (pts.length < 2) continue;
        const acc = lengths(pts), len = acc[acc.length - 1], id = pre + 'mk' + lines.length;
        const mp = svgEl('path', { d: 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L'), fill: 'none', stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': len + 1, 'stroke-dashoffset': len + 1 });
        const m = svgEl('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: vb.width, height: vb.height }); m.append(mp); defs.append(m);
        k.setAttribute('mask', `url(#${id})`);
        lines.push({ el: k, pts, acc, len, mp, dashed: fillC === DASH, colour: fillC });
      } else if (tag === 'path') heads.push(k);                                        // the title and the line under it
    }
    const fx = svgEl('g', { class: 'fl-fx' }); root.append(fx);
    fig.append(svg); fig.classList.add('is-live');
    Object.assign(fig, { _svg: svg, _root: root, _pre: pre, _vb: vb, _parts: { nodes, pills, lines, heads, fx } });
  })().catch((e) => { console.warn('[fx] flow', e); fig._p = null; }));

  // ---- timing: start at the top box; a line leaves a box once it has bloomed, a box blooms when its first line arrives
  const plan = (fig) => {
    const { nodes, pills, lines, fx } = fig._parts;
    lines.forEach((l) => { l.from = nodes.find((n) => inside(n.b, l.pts[0])); l.to = nodes.find((n) => inside(n.b, l.pts[l.pts.length - 1])); l.dur = l.len / (SPEED * (l.dashed ? 1.5 : 1)); });
    const top = nodes.reduce((m, n) => (n.b.y < m.b.y ? n : m)); nodes.forEach((n) => { n.t = null; }); top.t = 0.35;
    for (let changed = true, guard = 0; changed && guard < 60; guard++) { changed = false;
      lines.forEach((l) => { if (!l.from || l.from.t == null || !l.to) return; const t = l.from.t + POP + l.dur; if (l.to.t == null || t < l.to.t - 1e-6) { l.to.t = t; changed = true; } }); }
    const known = nodes.filter((n) => n.t != null), y0 = top.b.y, y1 = Math.max(...nodes.map((n) => n.b.y)), tMax = Math.max(...known.map((n) => n.t), 4);
    const byY = (y) => 0.35 + ((y - y0) / ((y1 - y0) || 1)) * tMax;
    nodes.forEach((n) => { if (n.t == null) n.t = byY(n.b.y); });
    lines.forEach((l) => { l.t0 = l.from ? l.from.t + POP : byY(l.pts[0][1]); });
    pills.forEach((p) => { const c = [p.b.x + p.b.w / 2, p.b.y + p.b.h / 2]; let best = null;
      lines.forEach((l) => { const q = nearestOn(l.pts, l.acc, c); if (!best || q.d < best.d) best = { d: q.d, t: l.t0 + q.s / l.len * l.dur }; });
      p.t = best && best.d < 40 ? best.t : byY(p.b.y); });

    const tl = gsap.timeline({ paused: true, onComplete: () => { fig.classList.add('is-done'); ambient(fig, true); } });
    tl.fromTo(fig._parts.heads, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
    const seen = {};
    nodes.forEach((n) => {
      const kind = n.diamond ? 'decision' : ({ '#E3ECDD': 'happy', '#F6E0DD': 'error', '#F7ECD0': 'edge' })[(n.shape.getAttribute('fill') || '').toUpperCase()] || 'happy';
      const k = (seen[kind] = (seen[kind] || 0) + 1) - 1;
      tl.call(() => document.dispatchEvent(new CustomEvent('flow:node', { detail: { kind, k } })), null, n.t);   // the legend and the two rules beside the diagram listen
      tl.fromTo(n.g, { opacity: 0, scale: 0.86, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, n.t);
      const ring = n.shape.cloneNode(); ring.removeAttribute('mask'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', GOLD); ring.setAttribute('stroke-width', '2.5'); ring.style.opacity = '0'; fx.append(ring);
      tl.fromTo(ring, { opacity: 0.9, scale: 1, transformOrigin: '50% 50%' }, { opacity: 0, scale: 1.16, duration: 1.1, ease: 'power2.out', immediateRender: false }, n.t + 0.08);   // a soft ring as the box arrives
    });
    pills.forEach((p) => tl.fromTo(p.g, { opacity: 0, scale: 0.7, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2)' }, p.t));
    // where the drawing is happening now (the newest line still growing), in window pixels — the recorder's lens follows it
    const live = new Set(); let last = null;
    fig._front = () => { let b = null; live.forEach((l) => { if (!b || l.t0 > b.t0) b = l; }); if (b) last = b.cur; if (!last) return null;
      const m = fx.getScreenCTM(); return m ? [m.a * last[0] + m.c * last[1] + m.e, m.b * last[0] + m.d * last[1] + m.f] : null; };
    lines.forEach((l) => {
      const spark = svgEl('g', { class: 'fl-spark' }); spark.append(svgEl('circle', { r: 11, fill: GOLD, opacity: 0.22 }), svgEl('circle', { r: 4.2, fill: '#FFF6DF', stroke: GOLD, 'stroke-width': 1.6 }));
      spark.style.opacity = '0'; fx.append(spark);
      const o = { s: 0 };
      tl.fromTo(o, { s: 0 }, { s: l.len, duration: l.dur, ease: 'none', immediateRender: false,
        onUpdate: () => { l.mp.setAttribute('stroke-dashoffset', (l.len + 1 - o.s).toFixed(1)); const [x, y] = pointAt(l.pts, l.acc, o.s); spark.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); const on = o.s > 0 && o.s < l.len; spark.style.opacity = on ? '1' : '0'; if (on) { l.cur = [x, y]; live.add(l); } else live.delete(l); } }, l.t0);
    });
    return tl;
  };

  // ---- after the drawing: small lights keep travelling the solid lines, one now and then (only while it is on screen)
  const ambient = (fig, on) => {
    if (!fig._amb && on) {
      fig._amb = fig._parts.lines.filter((l) => !l.dashed).map((l, j) => {
        const dot = svgEl('g', { class: 'fl-dot' }); dot.append(svgEl('circle', { r: 7, fill: GOLD, opacity: 0.2 }), svgEl('circle', { r: 2.6, fill: GOLD }));
        dot.style.opacity = '0'; fig._parts.fx.append(dot);
        const o = { s: 0 };
        return gsap.fromTo(o, { s: 0 }, { s: l.len, duration: Math.max(1.2, l.len / 160), ease: 'none', repeat: -1, repeatDelay: 2.5 + (j % 5) * 0.9, delay: (j % 7) * 0.6,
          onUpdate: () => { const [x, y] = pointAt(l.pts, l.acc, o.s); dot.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`); dot.style.opacity = String(clamp(Math.min(o.s, l.len - o.s) / 30, 0, 0.95).toFixed(2)); } });
      });
    }
    (fig._amb || []).forEach((t) => (on ? t.resume() : t.pause()));
  };
  const stopAmbient = (fig) => { (fig._amb || []).forEach((t) => t.kill()); fig._amb = null; $$('.fl-dot', fig._svg || fig).forEach((d) => d.replaceWith()); };

  // ---- play the diagram that is showing (the other language plays when you switch to it)
  let reached = false, onScreen = false;
  const play = async (again = false) => {
    const fig = visible(); if (!fig) return;
    await load(fig); if (!fig._svg || visible() !== fig) return;
    if (fig._tl && !again) return;
    if (!fig._tl) fig._tl = plan(fig);
    stopAmbient(fig); fig.classList.remove('is-done');
    document.dispatchEvent(new Event('flow:reset'));
    fig._tl.timeScale(window.__flowSpeed || 1).progress(0).play();
    if (window.__flowStart) { fig._tl.seek(window.__flowStart); window.__flowStart = 0; }     // the TikTok reel draws it a little faster
    if (replay) replay.hidden = false;
  };
  ST.create({ trigger: card, start: 'top 300%', once: true, ...PRI, onEnter: () => { const v = visible(); v && load(v).then(() => figs.forEach(load)); } });
  ST.create({ trigger: card, start: 'top 72%', end: 'bottom top', ...PRI, onEnter: () => { reached = true; play(); },
    onToggle: (s) => { onScreen = s.isActive; figs.forEach((f) => f.classList.contains('is-done') && ambient(f, onScreen)); } });
  new MutationObserver(() => { if (reached) play(); }).observe(html, { attributes: true, attributeFilter: ['lang'] });
  replay && replay.addEventListener('click', () => play(true));

  // ---- a lens that follows the pointer and shows the diagram large enough to read (the whole thing stays in one window)
  if (!finePointer) return;
  const ZOOM = 2.5, SIZE = 240;
  const lens = el('div', 'flow-lens'), ls = svgEl('svg', { width: SIZE, height: SIZE }), use = svgEl('use', {});
  ls.append(use); lens.append(ls); lens.setAttribute('aria-hidden', 'true'); card.append(lens);
  card.classList.add('has-lens');
  card.addEventListener('pointermove', (e) => {
    const fig = visible(); if (!fig || !fig._svg) return;
    const r = fig._svg.getBoundingClientRect(), cr = card.getBoundingClientRect();
    const inR = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    lens.classList.toggle('is-on', inR); if (!inR) return;
    const sc = r.width / fig._vb.width, ux = (e.clientX - r.left) / sc, uy = (e.clientY - r.top) / sc, vw = SIZE / (sc * ZOOM);
    ls.setAttribute('viewBox', `${(ux - vw / 2).toFixed(1)} ${(uy - vw / 2).toFixed(1)} ${vw.toFixed(1)} ${vw.toFixed(1)}`);
    if (use.getAttribute('href') !== '#' + fig._pre + 'root') use.setAttribute('href', '#' + fig._pre + 'root');
    lens.style.transform = `translate(${(e.clientX - cr.left - SIZE / 2).toFixed(1)}px, ${(e.clientY - cr.top - SIZE / 2).toFixed(1)}px)`;
  }, { passive: true });
  card.addEventListener('pointerleave', () => lens.classList.remove('is-on'));
});

/* ---------- marquee: follows how fast you scroll, and turns round when you scroll back up ---------- */
safe('marquee', () => {
  const track = $('.marquee__track'); if (!track || reduced) return;
  track.style.animation = 'none';
  let x = 0;
  gsap.ticker.add((time, dt) => {
    const half = track.scrollWidth / 2; if (!half) return;
    x -= (half / (38 * 60) + vel * 0.22) * (dt / 16.667);
    if (x > 0) x -= half; else if (x <= -half) x += half;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${clamp(-vel * 0.1, -5, 5).toFixed(2)}deg)`;
  });
});

/* ---------- side rail: where you are on the page ---------- */
safe('rail', () => {
  const rail = $('#rail'); if (!rail) return;
  $$('a[data-rail]', rail).forEach((a) => {
    const sec = document.getElementById(a.dataset.rail); if (!sec) return;
    ST.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', ...PRI, onToggle: (s) => a.classList.toggle('is-on', s.isActive) });
  });
  ST.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', onUpdate: (s) => rail.style.setProperty('--p', s.progress.toFixed(3)) });
  onIntro(() => rail.classList.add('is-ready'));
});

/* ---------- fine pointers only: tilt with a soft glare, magnetic buttons, a follower ring ---------- */
safe('tilt', () => {
  if (!finePointer) return;
  $$('.mini, .step, .small, .portrait').forEach((card) => {
    card.setAttribute('data-tilt', '');
    const MAX = card.matches('.portrait') ? 9 : 6;
    let qx = null, qy = null;
    card.addEventListener('pointerenter', () => {          // made here, not up front: a reveal that finishes later would otherwise cancel them
      gsap.set(card, { transformPerspective: 900 });
      qx = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' }); qy = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      card.classList.add('is-hot');
    });
    card.addEventListener('pointermove', (e) => {
      if (!qx) return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      qx(px * MAX * 2); qy(-py * MAX * 2);
      card.style.setProperty('--mx', ((px + 0.5) * 100).toFixed(1) + '%'); card.style.setProperty('--my', ((py + 0.5) * 100).toFixed(1) + '%');
    });
    card.addEventListener('pointerleave', () => { qx && qx(0); qy && qy(0); card.classList.remove('is-hot'); });
  });
});
safe('magnetic', () => {
  if (!finePointer) return;
  $$('.hero__actions .btn, .contact__actions .btn, .nav .btn, .wall__toggle').forEach((b) => {
    b.classList.add('is-mag');
    const qx = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), qy = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * 0.28); qy((e.clientY - (r.top + r.height / 2)) * 0.35); });
    b.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
});
safe('cursor', () => {
  if (!finePointer) return;
  const cur = $('#cursor'); if (!cur) return;
  const ring = $('.cursor__ring', cur), dot = $('.cursor__dot', cur), label = $('.cursor__label', cur);
  html.classList.add('has-cursor');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'none' }), dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'none' });
  addEventListener('pointermove', (e) => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    cur.classList.add('is-on');
    const t = e.target.closest ? e.target : document.body;
    cur.classList.toggle('is-off', !!t.closest('.lb'));          // the picture viewer is dark: the ordinary pointer is clearer there
    const zoom = t.closest('[data-zoom], .shot') && !t.closest('.flow-card.has-lens'), open = t.closest('.case');   // over the flow the lens does the talking
    const text = zoom ? (lang() === 'vi' ? 'Xem' : 'View') : open ? (lang() === 'vi' ? 'Mở' : 'Open') : '';
    if (label.textContent !== text) label.textContent = text;
    cur.classList.toggle('has-label', !!text);
    cur.classList.toggle('is-link', !text && !!t.closest('a, button, [role="link"], summary'));
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
});

/* ---------- paragraphs light up word by word as you read down the page ---------- */
safe('lit', () => {
  if (reduced) return;
  onIntro(() => {                                             // after main.js has chosen the language: only the words on screen are ever tweened
    $$('.lead, .about__main > p').forEach((p) => {
      wordGroups(p).filter((g) => onScreen(g[0])).forEach((g) => gsap.fromTo(g, { opacity: 0.2 }, { opacity: 1, duration: 0.3, stagger: 0.06, ease: 'none',
        scrollTrigger: { trigger: p, start: 'top 84%', end: 'bottom 54%', scrub: true, ...PRI } }));
    });
    ST.refresh();
  });
});

/* ---------- process: a line draws through the five steps and lights each number as it arrives ---------- */
safe('process', () => {
  const steps = $('#process .steps'); if (!steps) return;
  const items = $$('.step', steps), wide = () => innerWidth > 1100;
  const line = el('i', 'steps__line'), fill = el('b'); line.append(fill); steps.prepend(line);
  let at = items.map(() => 0);
  const layout = () => {
    if (!wide()) { line.style.display = 'none'; return; }
    line.style.display = '';
    const r = steps.getBoundingClientRect(), pts = items.map((s) => { const n = $('.step__n', s).getBoundingClientRect(); return { x: n.left + n.width / 2 - r.left, y: n.top + n.height / 2 - r.top }; });
    const x0 = pts[0].x, span = pts[pts.length - 1].x - x0 || 1;
    line.style.left = x0 + 'px'; line.style.width = span + 'px'; line.style.top = pts[0].y - 1 + 'px';
    at = pts.map((p) => (p.x - x0) / span);
  };
  if (reduced) { items.forEach((s) => s.classList.add('is-lit')); fill.style.transform = 'scaleX(1)'; layout(); return; }
  if (wide()) ST.create({ trigger: steps, start: 'top 78%', end: 'bottom 88%', ...PRI, onRefresh: layout,
    onUpdate: (s) => { fill.style.transform = `scaleX(${s.progress.toFixed(3)})`; items.forEach((it, i) => it.classList.toggle('is-lit', s.progress > 0.004 && s.progress >= at[i] - 0.002)); } });
  else items.forEach((it) => ST.create({ trigger: it, start: 'top 78%', once: true, ...PRI, onEnter: () => it.classList.add('is-lit') }));
  layout();
});

/* ---------- pictures drift inside their frames as you scroll past ---------- */
safe('parallax', () => {
  if (reduced) return;
  $$('.tile__img img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.closest('.tile'), start: 'top bottom', end: 'bottom top', scrub: true, ...PRI } });
  });
});

/* ---------- the page's light changes with the section: three soft blobs move through the palette ---------- */
safe('aurora', () => {
  if (reduced) return;
  const blobs = $$('.aurora i'); if (blobs.length < 3) return;
  const P = { // champagne #F6E9C8 · silver #DFE4EC · sand #F3E4D3 · mist #E2EAEE · sage #DEE7DA · blush #F4E1DC (pale, not pink)
    top: ['#F6E9C8', '#DFE4EC', '#F3E4D3'], work: ['#F6E9C8', '#E2EAEE', '#F3E4D3'], flow: ['#DEE7DA', '#DFE4EC', '#F6E9C8'],
    screens: ['#F3E4D3', '#E2EAEE', '#DEE7DA'], sites: ['#F4E1DC', '#F6E9C8', '#E2EAEE'], process: ['#F6E9C8', '#DEE7DA', '#F3E4D3'], playground: ['#DEE7DA', '#E2EAEE', '#F6E9C8'],
    bapo: ['#DFE4EC', '#F6E9C8', '#F3E4D3'], about: ['#F6E9C8', '#F3E4D3', '#DFE4EC'], ask: ['#F4E1DC', '#F6E9C8', '#DFE4EC'], contact: ['#F6E9C8', '#F4E1DC', '#DFE4EC'],
  };
  const to = (k) => blobs.forEach((b, i) => gsap.to(b, { backgroundColor: P[k][i], duration: 1.8, ease: 'power2.inOut', overwrite: 'auto' }));
  Object.keys(P).forEach((k) => {
    const sec = document.getElementById(k); if (!sec) return;
    ST.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%', ...PRI, onEnter: () => to(k), onEnterBack: () => to(k) });
  });
});

/* ---------- hero: the blooms, the rings and the tag drift a little against each other when the pointer moves (depth) ---------- */
safe('depth', () => {
  if (!finePointer) return;
  const hero = $('.hero'), bloom = $('.hero__bloom'), tag = $('.chip--a'); if (!hero) return;
  const mk = (t, amt) => t && { x: gsap.quickTo(t, 'x', { duration: 1.4, ease: 'power3' }), y: gsap.quickTo(t, 'y', { duration: 1.4, ease: 'power3' }), amt };
  const layers = [mk(bloom, 22), mk(tag, -14)].filter(Boolean);
  hero.addEventListener('pointermove', (e) => { const r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; layers.forEach((l) => { l.x(px * l.amt); l.y(py * l.amt * 0.7); }); });
});

/* ---------- soft light on card edges that follows the pointer (the border glows where the cursor is) ---------- */
safe('spot', () => {
  if (!finePointer) return;
  $$('.about__main, .stats, .toolkit, .chat, .flow-card, .mini, .step, .small, .portrait').forEach((c) => {
    c.setAttribute('data-spot', '');
    c.addEventListener('pointerenter', () => c.classList.add('is-hot'));
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%'); c.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%'); }, { passive: true });
    c.addEventListener('pointerleave', () => c.classList.remove('is-hot'));
  });
});

/* ---------- flow, beside the diagram: a legend chip lights up each time a box of its kind appears;
   the two rules switch on when the diagram reaches the box that keeps them (3rd error box: "never costs a credit";
   3rd edge box: "asks before you leave") ---------- */
safe('flowLegend', () => {
  const chips = {}; $$('.legend [data-kind]').forEach((c) => { chips[c.dataset.kind] = c; });
  const rule = (n) => $(`.rule[data-rule="${n}"]`);
  const timers = new Map();
  document.addEventListener('flow:node', (e) => {
    const { kind, k } = e.detail, c = chips[kind];
    if (c) { c.classList.toggle('is-ping', false); void c.offsetWidth; c.classList.add('is-ping'); clearTimeout(timers.get(c)); timers.set(c, setTimeout(() => c.classList.toggle('is-ping', false), 900)); }
    if (kind === 'error' && k === 2) rule('credit')?.classList.add('is-on');
    if (kind === 'edge' && k === 2) rule('leave')?.classList.add('is-on');
  });
  document.addEventListener('flow:reset', () => $$('.rule').forEach((r) => r.classList.toggle('is-on', false)));
  if (reduced) $$('.rule').forEach((r) => r.classList.add('is-on'));
});

/* ---------- BA / PO: the pictures start moving and the numbers count up when a card comes into view ---------- */
safe('bapo', () => {
  $$('.bapo .mini').forEach((card) => {
    const b = $('.metric b', card), to = b ? +b.dataset.to : 0, suf = (b && b.dataset.suffix) || '';
    const go = () => {
      card.classList.add('is-in');
      if (!b || reduced) return;
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: to > 50 ? 1.8 : 1.1, ease: 'power3.out', onUpdate: () => { b.textContent = Math.round(o.v) + suf; } });
    };
    if (reduced) { card.classList.add('is-in'); return; }
    if (b) b.textContent = '0' + suf;
    ST.create({ trigger: card, start: 'top 82%', once: true, ...PRI, onEnter: go });
  });
});

/* ---------- about: a spark runs the road tester → BA → PO → product designer, lighting each stop; tags float; stats draw their dots ---------- */
safe('journey', () => {
  const j = $('.journey'); if (!j) return;
  const stops = $$('.journey__stop', j), n = stops.length;
  const set = (p) => { j.style.setProperty('--jx', p.toFixed(4)); stops.forEach((s, i) => { if (p >= i / (n - 1) - 0.001) s.classList.add('is-on'); }); };
  if (reduced) { stops.forEach((s) => s.classList.add('is-on')); j.style.setProperty('--jp', 1); return; }
  ST.create({ trigger: j, start: 'top 85%', once: true, ...PRI, onEnter: () => {
    j.classList.add('is-run');
    const o = { p: 0 }, loop = { p: 0 };
    gsap.timeline()
      .to(o, { p: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: () => { set(o.p); j.style.setProperty('--jp', o.p.toFixed(4)); } })
      .add(gsap.timeline({ repeat: -1, repeatDelay: 2.2 }).fromTo(loop, { p: 0 }, { p: 1, duration: 2.8, ease: 'sine.inOut', onUpdate: () => j.style.setProperty('--jx', loop.p.toFixed(4)) }), '+=1.4');
  } });
});
safe('tagsFloat', () => {
  const t = $('.about .tags'); if (!t || reduced) return;
  ST.create({ trigger: t, start: 'top 90%', once: true, ...PRI, onEnter: () => t.classList.add('is-in') });
});
safe('pips', () => {
  $$('.pips').forEach((p) => {
    const n = +p.dataset.n || 0, split = +p.dataset.split || n;
    for (let i = 0; i < n; i++) { const d = el('i', i >= split ? 'b' : ''); d.style.setProperty('--k', i); p.append(d); }
    if (reduced) { p.classList.add('is-in'); return; }
    ST.create({ trigger: p, start: 'top 90%', once: true, ...PRI, onEnter: () => p.classList.add('is-in') });
  });
});

/* ---------- experience: a dated cursor moves along the time axis as you scroll; each bar fills as the cursor passes,
   and its results pop out when the job ends ---------- */
safe('timeline', () => {
  const tl = $('#tl'); if (!tl) return;
  const A = +tl.dataset.from, B = +tl.dataset.to, NOW = +tl.dataset.now;
  const rows = $$('.tl__row', tl).map((r) => ({ r, f: +r.dataset.from, t: +r.dataset.to, bar: $('.tl__bar i', r) }));
  const yr = $('.tl__year', tl), rail = $('.tl__rail', tl);
  rows.forEach(({ r }) => { const l = +r.style.getPropertyValue('--l'), w = +r.style.getPropertyValue('--w');     // a bar in the right half keeps its results under its own end
    if (l > 50) { r.classList.add('is-right'); r.style.setProperty('--r', (100 - l - w).toFixed(2)); } });
  const render = (t) => {
    rail.style.setProperty('--t', (((t - A) / (B - A)) * 100).toFixed(2));
    const m = Math.min(12, Math.floor((t % 1) * 12) + 1);
    yr.textContent = (t >= NOW - 0.005 ? (lang() === 'vi' ? 'nay · ' : 'now · ') : '') + String(m).padStart(2, '0') + '/' + Math.floor(t);
    rows.forEach(({ r, f, t: to, bar }) => {
      const p = clamp((t - f) / Math.max(0.0001, to - f), 0, 1);
      bar.style.setProperty('--f', p.toFixed(3));
      r.classList.toggle('is-on', t >= f - 0.04);
      r.classList.toggle('is-done', p >= 0.999);
    });
  };
  if (reduced) { rows.forEach(({ r, bar }) => { r.classList.add('is-on', 'is-done'); bar.style.setProperty('--f', 1); }); return; }
  render(A);
  ST.create({ trigger: tl, start: 'top 72%', end: 'bottom 62%', scrub: 0.6, ...PRI,
    onToggle: (s) => tl.classList.toggle('is-run', s.isActive || s.progress > 0),
    onUpdate: (s) => render(A + (NOW - A) * s.progress) });
});

window.__fx = true;
