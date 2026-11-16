"""Record the self-playing portfolio (v2/?record) into an MP4, frame by frame on a virtual clock.

Every frame advances the page's time by exactly 1/FPS s (requestAnimationFrame, performance.now,
Date.now, CSS/Web animations and the Phú Thọ video all follow it), then the page is captured and
piped to ffmpeg — so the video is smooth however slow the capture is.

Usage (from the portfolio folder):
  python3 v2/tools/record.py portrait     # 1080×1920 for TikTok / Reels (mobile layout)
  python3 v2/tools/record.py landscape    # 1920×1080 for LinkedIn / YouTube (desktop layout)
  options: --lang vi   --fps 30   --out <file.mp4>   --max 120 (seconds, safety stop)
"""
import argparse, functools, http.server, socketserver, subprocess, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]          # …/portfolio
FF = "/opt/homebrew/bin/ffmpeg"
ARGS = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
FORMATS = {
    "portrait":  {"viewport": (432, 768),  "dpr": 2.5},    # → 1080×1920, mobile layout
    "landscape": {"viewport": (1600, 900), "dpr": 1.2},    # → 1920×1080, desktop layout
}

VT_JS = """(() => {
  if (window.STEP) return;
  let t = 0; const q = []; const d0 = Date.now();
  performance.now = () => t;
  Date.now = () => d0 + t;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  const born = new WeakMap();
  window.STEP = (dt) => {
    t += dt;
    for (const a of document.getAnimations()) {            // CSS animations + transitions follow the virtual clock
      if (!born.has(a)) born.set(a, t - dt);
      try { a.pause(); a.currentTime = t - born.get(a); } catch (e) {}
    }
    const cbs = q.splice(0); for (const cb of cbs) { try { cb(t); } catch (e) { console.error(e); } }
    return t;
  };
})()"""


class Quiet(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True
    def handle_error(self, request, client_address):   # the browser aborts video range requests; not an error
        pass


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve(port):
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    httpd = Quiet(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("format", choices=FORMATS)
    ap.add_argument("--lang", default="en")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--max", type=float, default=120)
    ap.add_argument("--out")
    ap.add_argument("--port", type=int, default=8823)
    a = ap.parse_args()
    f = FORMATS[a.format]
    out = Path(a.out or ROOT / "v2" / "video" / f"portfolio-{a.lang}-{'9x16' if a.format == 'portrait' else '16x9'}.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)
    httpd = serve(a.port)
    W, H = f["viewport"]; dpr = f["dpr"]
    ff = subprocess.Popen([FF, "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(a.fps), "-c:v", "mjpeg", "-i", "-",
                           "-vf", f"scale={round(W*dpr)//2*2}:{round(H*dpr)//2*2}:flags=lanczos", "-c:v", "libx264", "-preset", "slow",
                           "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
    dt = 1000 / a.fps
    with sync_playwright() as p:
        b = p.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=dpr)
        pg.on("pageerror", lambda e: print("PAGEERROR", e))
        pg.add_init_script(VT_JS)
        pg.goto(f"http://127.0.0.1:{a.port}/v2/?record&lang={a.lang}", wait_until="load", timeout=90000)
        # let module scripts, fonts and the first frames settle on the virtual clock
        for _ in range(240):
            if pg.evaluate("window.__ready === true && window.__sceneReady === true"): break
            pg.evaluate(f"window.STEP({dt})"); time.sleep(0.05)
        # recording scrolls past every section, so load lazy images up front (bounded wait)
        pg.evaluate("""() => new Promise(done => {
          const imgs = [...document.images]; imgs.forEach(i => { i.loading = 'eager'; });
          const pend = imgs.filter(i => !i.complete);
          if (!pend.length) return done();
          let left = pend.length; const tick = () => { if (--left <= 0) done(); };
          pend.forEach(i => { i.addEventListener('load', tick, { once: true }); i.addEventListener('error', tick, { once: true }); });
          setTimeout(done, 15000);
        })""")
        for _ in range(6): pg.evaluate(f"window.STEP({dt})")
        pg.evaluate("window.__go && window.__go()")
        n, t0, maxf = 0, time.time(), int(a.max * a.fps)
        done_at = None
        while n < maxf:
            vt = pg.evaluate(f"window.STEP({dt})")
            pg.evaluate(f"window.__recVideo && window.__recVideo({vt/1000})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
            n += 1
            if done_at is None and pg.evaluate("window.__autoplayDone === true"): done_at = n
            if done_at is not None and n - done_at > a.fps * 0.6: break
            if n % (a.fps * 5) == 0: print(f"{n/a.fps:5.1f}s recorded  ({time.time()-t0:5.0f}s wall)", flush=True)
        b.close()
    ff.stdin.close(); ff.wait(); httpd.shutdown()
    print(f"done: {out}  ({n} frames, {n/a.fps:.1f}s)")


if __name__ == "__main__":
    main()
