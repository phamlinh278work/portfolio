// Brand sites: one browser window plays each site's film; the list beside it picks the site.
// Plays only while the section is on screen, moves on to the next site when a film ends,
// and never autoplays when the visitor asked for reduced motion.
const sec = document.getElementById('sites');
if (sec) {
  const video = document.getElementById('sitesVideo');
  const screen = video.parentElement;
  const url = document.getElementById('sitesUrl'), open = document.getElementById('sitesOpen');
  const playBtn = document.getElementById('sitesPlay'), fullBtn = document.getElementById('sitesFull'), soundBtn = document.getElementById('sitesSound');
  const cards = [...sec.querySelectorAll('.site')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = -1, inView = false, userPaused = reduced, raf = 0;

  const setPaused = (p) => screen.classList.toggle('is-paused', p);
  const tryPlay = () => { if (!inView || userPaused) return setPaused(true); const pr = video.play(); setPaused(false); if (pr && pr.catch) pr.catch(() => setPaused(true)); };

  function show(i, { play = true } = {}) {
    i = (i + cards.length) % cards.length;
    const c = cards[i], same = i === cur;
    cards.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    if (same) return;
    const had = !!video.getAttribute('src');
    cur = i;
    url.textContent = c.dataset.host;
    if (c.dataset.url) { open.hidden = false; open.href = c.dataset.url; } else open.hidden = true;
    screen.classList.add('is-swap');
    setTimeout(() => {
      video.poster = c.dataset.poster;
      video.src = c.dataset.video;
      video.preload = 'auto';
      video.load();
      screen.classList.remove('is-swap');
      if (play) tryPlay(); else setPaused(true);
    }, had ? 300 : 0);
  }

  // progress on the active card
  function tick() {
    const c = cards[cur], b = c && c.querySelector('.site__bar b');
    if (b && video.duration) b.style.transform = `scaleX(${(video.currentTime / video.duration).toFixed(4)})`;
    raf = requestAnimationFrame(tick);
  }
  video.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); setPaused(false); });
  video.addEventListener('pause', () => { cancelAnimationFrame(raf); setPaused(true); });
  video.addEventListener('ended', () => show(cur + 1));

  cards.forEach((c, i) => c.addEventListener('click', () => { userPaused = false; if (i === cur) { video.currentTime = 0; tryPlay(); } else show(i); }));
  sec.querySelector('.sites__list').addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return; e.preventDefault(); userPaused = false; show(cur + d); cards[cur].focus();
  });

  const toggle = () => { if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); } };
  playBtn.addEventListener('click', toggle);
  video.addEventListener('click', toggle);
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (screen.requestFullscreen) screen.requestFullscreen().catch(() => {});
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();     // iPhone
  });

  // music: films start muted (browsers only autoplay silently); one click turns the sound on for every site
  const setSound = (on) => { video.muted = !on; soundBtn.classList.toggle('is-on', on); soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); };
  soundBtn.addEventListener('click', () => { const on = video.muted; setSound(on); if (on && video.paused) { userPaused = false; tryPlay(); } });
  setSound(false);

  // play only while the window is on screen
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (cur < 0 && inView) return show(0);
    if (inView) tryPlay(); else if (!video.paused) video.pause();
  }, { threshold: 0.35 }).observe(screen);

  setPaused(true);
  window.__sites = { show, get index() { return cur; } };      // the auto-play tour flips through the sites
}
