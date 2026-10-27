// Singing bowls (canvas row I, frame I-bowls). Tap strikes; hold past 380 ms rubs the rim until release.
// Every sound is synthesised here; nothing loads or plays before the first strike.
(() => {
  const bowls = [...document.querySelectorAll(".bowl")];
  if (!bowls.length) return;
  let ac, master;
  const audio = () => {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.55;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp); comp.connect(ac.destination);
      if (window.rkjScope) window.rkjScope(ac, master);
    }
    if (ac.state === "suspended") ac.resume();
    return ac;
  };
  // A bowl's partials are inharmonic; each pair is detuned a little so it beats like metal.
  const strike = (f) => {
    const t = audio().currentTime;
    [[1, 1, 7], [2.71, 0.42, 4], [5.15, 0.18, 2.2], [8.3, 0.07, 1.1]].forEach(([r, a, d]) => {
      [-0.6, 0.6].forEach((det) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f * r + det * r;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(a * 0.22, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
      });
    });
  };
  const rubStart = (f) => {
    const t = audio().currentTime;
    const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), g2 = ac.createGain();
    const lfo = ac.createOscillator(), lg = ac.createGain();
    o.frequency.value = f; o2.frequency.value = f * 2.71; g2.gain.value = 0.22;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 1.6);
    lfo.frequency.value = 0.9; lg.gain.value = 0.04;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(master);
    o.start(t); o2.start(t); lfo.start(t);
    return { o, o2, lfo, lg, g };
  };
  const rubStop = (r) => {
    const t = ac.currentTime;
    r.lg.disconnect();
    r.g.gain.cancelScheduledValues(t); r.g.gain.setValueAtTime(Math.max(r.g.gain.value, 0.001), t);
    r.g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
    [r.o, r.o2, r.lfo].forEach((n) => n.stop(t + 5.1));
  };

  bowls.forEach((el) => {
    const f = Number(el.dataset.f);
    let pressed = false, hold, off, rub;
    const ring = (cls) => { el.classList.remove("on", "rub"); if (cls) el.classList.add(cls); };
    const fade = (ms) => { clearTimeout(off); off = setTimeout(() => ring(""), ms); };
    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      pressed = true; clearTimeout(off);
      strike(f); ring("on");
      hold = setTimeout(() => { rub = rubStart(f); ring("rub"); }, 380);
    });
    const release = () => {
      if (!pressed) return;
      pressed = false; clearTimeout(hold);
      if (rub) { rubStop(rub); rub = null; ring("on"); fade(5000); } else fade(4500);
    };
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => el.addEventListener(t, release));
    // Keyboard presses arrive as a click with detail 0; pointer presses were handled on down.
    el.addEventListener("click", (e) => { if (e.detail !== 0) return; strike(f); ring("on"); fade(4500); });
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  addEventListener("pagehide", () => { if (ac) ac.close(); });
})();
