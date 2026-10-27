// The waveform at the playground's end (canvas row K, K2): the page's real sound, drawn as one cream hairline.
// The room and the bowls each hand it their output with window.rkjScope(context, node); it never makes a context
// of its own, so nothing here sounds or loads before a visitor presses something. Flat when it is quiet.
(() => {
  const cv = document.querySelector(".scope");
  if (!cv) return;
  const ctx = cv.getContext("2d"), taps = [];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let seen = false, running = false;
  const size = () => { cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr); };
  const draw = (buf) => {
    const w = cv.width, h = cv.height, mid = h / 2;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2 * dpr) {
      // Taper to flat at both ends, like the footer's edge on the other pages.
      const env = Math.pow(Math.sin(Math.PI * x / w), 0.6);
      const v = buf ? buf[Math.floor((x / w) * (buf.length - 1))] : 0;
      const y = mid + Math.max(-1, Math.min(1, v * 4)) * env * h * 0.45;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = "rgba(243, 234, 216, 0.85)"; ctx.lineWidth = 1.2 * dpr; ctx.stroke();
  };
  // The loudest live source wins the line; a closed context drops out.
  const frame = () => {
    for (let i = taps.length - 1; i >= 0; i--) if (taps[i].ac.state === "closed") taps.splice(i, 1);
    let best = null, peak = 0.0004;
    for (const t of taps) {
      if (t.ac.state !== "running") continue;
      t.an.getFloatTimeDomainData(t.buf);
      let s = 0; for (let i = 0; i < t.buf.length; i += 8) s += t.buf[i] * t.buf[i];
      const rms = Math.sqrt(s / (t.buf.length / 8));
      if (rms > peak) { peak = rms; best = t.buf; }
    }
    draw(best);
    if (seen && taps.length && !document.hidden) requestAnimationFrame(frame); else running = false;
  };
  const go = () => { if (!running && seen && taps.length) { running = true; requestAnimationFrame(frame); } };
  window.rkjScope = (ac, node) => {
    const an = ac.createAnalyser(); an.fftSize = 2048;
    node.connect(an);
    taps.push({ ac, an, buf: new Float32Array(an.fftSize) });
    go();
  };
  size(); draw(null);
  addEventListener("resize", () => { size(); draw(null); go(); });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; go(); }).observe(cv);
  document.addEventListener("visibilitychange", go);
})();
