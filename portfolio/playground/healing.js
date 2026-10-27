// The healing space: a painted room in layers (ChatGPT, from case-studies/cinema/CHATGPT-HEALING-SPACE.md) and a
// two-minute journey in five movements: Arrive, Breathe, Bathe, Return, then the ways on. Nothing loads or sounds
// before Begin. Sound is one switch. Escape leaves. The clock pauses with the tab.
(() => {
  const wrap = document.getElementById("room");
  if (!wrap) return;
  const q = (s) => wrap.querySelector(s);
  const W = 1672, H = 941;                 // the master plate, in pixels: every full-frame layer is this
  const BOWL = { x: 836, y: 738 };         // the floating bowl's centre on the plate
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const VO = {}; // e.g. { arrive: "vo/arrive.mp3" }; empty until the recordings exist
  const WORLDS = {
    forest: { loop: "audio/forest.m4a", lift: "audio/forest-lift.m4a", fx: "motes" },
    rain: { loop: "audio/rain.m4a", lift: "audio/rain-lift.m4a", fx: "drops" },
    sea: { loop: "audio/sea.m4a", lift: "audio/sea-lift.m4a", fx: "spray" },
  };
  const room = q(".room"), fx = q(".fx"), ctx = fx.getContext("2d");
  const L = { world: q(".ly.world"), wdim: q(".dim.w"), rdim: q(".dim.r"), light: q(".ly.light"), bowl: q(".ly.glow"), gong: q(".ly.gong") };
  // Parallax: a few layers, in device-pixel steps, so the painted grain is never resampled between frames.
  const PAR = [[q(".ly.world"), 6], [q(".ly.cl"), -9], [q(".ly.cr"), -9], [q(".ly.pool"), -4], [L.light, 2], [L.bowl, -2], [L.gong, 0]];
  const text = q(".stagetext"), prog = q(".prog"), sndBtn = q(".sw.sound"), hpBtn = q(".sw.phones");
  let world = "rain", phones = false, sound = true, state = "door";
  let t0 = 0, paused = 0, pauseAt = 0, fired = new Set();
  const dpr = Math.min(devicePixelRatio || 1, 1.5);

  // Layout: the plate fills the stage; upright phones get its middle 60%, the band every subject sits in.
  const lay = { s: 1, x: 0, y: 0, w: 0, h: 0, vw: 0, vh: 0 };
  const fit = () => {
    const r = wrap.getBoundingClientRect();
    const portrait = r.width < r.height;
    const s = portrait ? r.width / (W * 0.6) : Math.max(r.width / W, r.height / H);
    Object.assign(lay, { s, w: W * s, h: H * s, vw: r.width, vh: r.height });
    lay.x = (r.width - lay.w) / 2; lay.y = portrait ? (r.height - lay.h) / 2 - r.height * 0.04 : (r.height - lay.h) / 2;
    Object.assign(room.style, { width: lay.w + "px", height: lay.h + "px", left: lay.x + "px", top: lay.y + "px" });
    wrap.classList.toggle("portrait", portrait);
    [["--rl", lay.x], ["--rt", lay.y], ["--rw", lay.w], ["--rh", lay.h]].forEach(([k, v]) => wrap.style.setProperty(k, v + "px"));
    fx.width = Math.round(r.width * dpr); fx.height = Math.round(r.height * dpr);
  };
  fit(); addEventListener("resize", fit);
  // The room appears whole, once every layer has decoded, rather than wall by wall.
  // decode() can wait while the tab is in the background, so the page's load event also reveals it, whichever comes first.
  let shown = false;
  const show = () => {
    if (shown) return; shown = true;
    wrap.classList.add("ready");
    setTimeout(() => room.style.transition = "none", 1500);   // after the fade, the room is a plain box again
  };
  Promise.all([...room.querySelectorAll("img")].map((i) => i.decode().catch(() => {}))).then(show);
  if (document.readyState === "complete") show(); else addEventListener("load", show);

  // The score. Movements by the second: Arrive 0–15, Breathe 15–75 (six breaths, 4 in, 6 out), Bathe 75–105, Return 105–120.
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => 0.5 - Math.cos(Math.PI * p) / 2;
  const breath = (t) => {
    if (t < 15) return 0;
    if (t < 75) { const b = (t - 15) % 10; return b < 4 ? ease(b / 4) : 1 - ease((b - 4) / 6); }
    const b = (t - 75) % 12; return b < 5 ? ease(b / 5) : 1 - ease((b - 5) / 7);
  };
  // Four lights through the journey: the world's night, the room's shade, the shaft, the bowl (and its size).
  const look = (t) => {
    const b = breath(t);
    if (t < 0) return { wd: 0.45, rd: 0.3, li: 0.45, bo: 0.6, sc: 1 };
    if (t < 15) { const p = seg(t, 0, 15); return { wd: lerp(0.45, 0.32, p), rd: lerp(0.3, 0.14, p), li: lerp(0.45, 0.6, p), bo: lerp(0.6, 0.8, p), sc: 1 }; }
    const mid = { wd: lerp(0.32, 0.12, seg(t, 15, 105)), rd: 0.14 - 0.1 * b, li: 0.6 + 0.4 * b, bo: 0.8 + 0.2 * b, sc: 1 + 0.05 * b };
    if (t < 105) return mid;
    const p = seg(t, 105, 120);
    return { wd: lerp(mid.wd, 0, p), rd: lerp(mid.rd, 0, p), li: lerp(mid.li, 0.5 + 0.15 * b, p), bo: lerp(mid.bo, 0.75 + 0.1 * b, p), sc: 1 + lerp(0.05, 0.03, p) * b };
  };

  // Sound: one graph, made at Begin. Every voice has its own gain under one mute, so the switch silences all of it at once.
  let ac, mute, g = {}, nat, lift, bufs, dn = [], bin, gongAt = -1;
  const audio = () => {
    if (ac) return ac;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    mute = ac.createGain(); mute.gain.value = sound ? 1 : 0;
    const comp = ac.createDynamicsCompressor(); mute.connect(comp); comp.connect(ac.destination);
    ["nature", "lift", "drone", "bowl", "gong", "bin"].forEach((k) => { g[k] = ac.createGain(); g[k].gain.value = 0; g[k].connect(mute); });
    g.bowl.gain.value = 0.5; g.gong.gain.value = 0.55;
    if (window.rkjScope) window.rkjScope(ac, mute);   // the waveform at the page's end draws what the switch lets through
    return ac;
  };
  const ramp = (p, v, s) => { const t = ac.currentTime; p.cancelScheduledValues(t); p.setValueAtTime(p.value, t); p.linearRampToValueAtTime(v, t + s); };
  const load = (url) => fetch(url).then((r) => r.arrayBuffer()).then((b) => new Promise((res, rej) => ac.decodeAudioData(b, res, rej)));
  const play = (buf, to, loop) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = loop; s.connect(to); s.start(); return s; };
  const noise = (secs, brown) => {
    const n = ac.sampleRate * secs, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    let v = 0;
    for (let i = 0; i < n; i++) { const r = Math.random() * 2 - 1; if (brown) { v = (v + r * 0.02) * 0.995; d[i] = v * 2; } else d[i] = r; }
    return buf;
  };
  // The earth drone: A1 and its octaves over a brown-noise floor. It swells with the breath (see paint).
  const drone = () => {
    const t = ac.currentTime;
    [[55, 1], [110, 0.45], [165, 0.1]].forEach(([f, a]) => {
      const o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = f; og.gain.value = a;
      o.connect(og); og.connect(g.drone); o.start(t); dn.push(o);
    });
    const n = ac.createBufferSource(); n.buffer = noise(4, true); n.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 140;
    const ng = ac.createGain(); ng.gain.value = 0.5;
    n.connect(lp); lp.connect(ng); ng.connect(g.drone); n.start(t); dn.push(n);
  };
  // A bowl: inharmonic partials, each pair detuned so it beats like metal (the same voice as bowls.js).
  const strike = (f, a = 1) => {
    const t = ac.currentTime;
    [[1, 1, 7], [2.71, 0.42, 4], [5.15, 0.18, 2.2], [8.3, 0.07, 1.1]].forEach(([r, v, d]) => {
      [-0.6, 0.6].forEach((det) => {
        const o = ac.createOscillator(), og = ac.createGain();
        o.frequency.value = f * r + det * r;
        og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(v * 0.22 * a, t + 0.008); og.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(og); og.connect(g.bowl); o.start(t); o.stop(t + d + 0.05);
      });
    });
    ripples.push(ac.currentTime);
  };
  // The gong: a slow bloom of eight inharmonic partials with a twelve-second tail, and a band of noise that swells after.
  const gong = () => {
    const t = ac.currentTime, f = 62;
    [[1, 1, 14], [1.48, 0.7, 12], [2.11, 0.5, 10], [2.74, 0.35, 8], [3.42, 0.25, 7], [4.33, 0.15, 5], [5.6, 0.1, 4], [7.15, 0.06, 3]].forEach(([r, a, d]) => {
      [-0.5, 0.5].forEach((det) => {
        const o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = f * r + det;
        og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(a * 0.16, t + 0.35 + r * 0.05); og.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(og); og.connect(g.gong); o.start(t); o.stop(t + d + 0.1);
      });
    });
    const n = ac.createBufferSource(); n.buffer = noise(3, false);
    const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 1.2;
    const ng = ac.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.05, t + 0.9); ng.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    n.connect(bp); bp.connect(ng); ng.connect(g.gong); n.start(t); n.stop(t + 3.1);
  };
  // Headphones only: 200 Hz in each ear, the right one 10 Hz higher easing to 6, very quiet. An experiment, not a claim.
  const binStart = () => {
    const t = ac.currentTime; bin = [];
    [[200, -1], [210, 1]].forEach(([f, pan]) => {
      const o = ac.createOscillator(), p = ac.createStereoPanner(); o.frequency.value = f; p.pan.value = pan;
      o.connect(p); p.connect(g.bin); o.start(t); bin.push(o);
    });
    bin[1].frequency.linearRampToValueAtTime(206, t + 60);
    ramp(g.bin.gain, 0.03, 8);
  };

  // Words on the stage. Each line has a voice slot (VO) for later.
  let sayT;
  const say = (line, key) => {
    clearTimeout(sayT); text.classList.remove("on");
    sayT = setTimeout(() => { text.textContent = line; text.classList.add("on"); }, line ? 350 : 0);
    if (key && VO[key]) new Audio(VO[key]).play().catch(() => {});
  };
  const NOTES = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63];
  const EV = [
    [0, () => { say("You’re here.", "arrive"); }],
    [7, () => say("Nothing to do for two minutes.", "nothing")],
    [15, () => { say("In through the nose…", "in"); strike(110); if (phones) binStart(); }],
    [19, () => say("…and out, slowly.", "out")],
    ...[25, 35, 45, 55, 65].flatMap((t) => [[t, () => { say("In"); strike(110, 0.8); }], [t + 4, () => say("Out")]]),
    [75, () => { say("Just listen.", "listen"); if (ac) ramp(g.nature.gain, 0.35, 3); }],
    ...[75, 78.5, 82, 86, 89.5, 93, 96.5, 100, 103.5].map((t, i) => [t, () => (i === 4 ? (gong(), gongAt = t) : strike(NOTES[i < 4 ? i : i - 1], 0.7))]),
    [105, () => { say("Take this with you.", "return"); if (!ac) return; ramp(g.nature.gain, 0, 12); ramp(g.drone.gain, 0, 12); if (bin) ramp(g.bin.gain, 0, 6);
      if (bufs) { lift = play(bufs.lift, g.lift, true); ramp(g.lift.gain, 0.45, 6); } }],
    [112, () => strike(110, 0.6)],
    [120, () => { state = "end"; wrap.classList.add("end"); if (ac) ramp(g.lift.gain, 0, 24); }],
    [146, () => { if (lift) { lift.stop(); lift = null; } }],
  ];

  // Particles and ripples on one canvas over the room: motes in the shaft, drops in the arch, foam over the waves.
  const ripples = [], parts = [];
  let sheet, cells;
  const rand = (a, b) => a + Math.random() * (b - a);
  const archTop = (x) => 335 + Math.pow((x - BOWL.x) / 372, 2) * 290;       // the arch's inner edge, plate pixels
  const spawn = () => {
    const kind = WORLDS[world].fx, p = { cell: Math.floor(Math.random() * 6), age: 0 };
    if (kind === "motes") { const y = rand(60, 700), c = 450 + (y / 766) * 330, w = 50 + (y / 766) * 110; Object.assign(p, { x: c + rand(-w, w), y, vx: rand(2, 9), vy: rand(-5, 5), sz: rand(10, 22), life: rand(6, 12), a: 0.7 }); }
    else if (kind === "drops") { const x = rand(500, 1180); Object.assign(p, { x, y: archTop(x) + rand(0, 120), vx: rand(-6, 6), vy: rand(260, 360), sz: rand(26, 40), life: 2, a: 0.55 }); }
    else Object.assign(p, { x: rand(540, 1130), y: rand(560, 612), vx: rand(-12, 12), vy: rand(-40, -16), sz: rand(12, 26), life: rand(1.5, 3), a: 0.6 });
    parts.push(p);
  };
  const draw = (dt, t) => {
    ctx.clearRect(0, 0, fx.width, fx.height);
    if (reduce || !sheet || !sheet.complete) return;
    const sx = (x) => (lay.x + x * lay.s) * dpr, sy = (y) => (lay.y + y * lay.s) * dpr;
    if (state !== "door" && parts.length < 28 && Math.random() < 0.5) spawn();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      const gone = p.age > p.life || (WORLDS[world].fx === "drops" && p.y > 622);
      if (gone) { parts.splice(i, 1); continue; }
      const k = p.age / p.life, fade = WORLDS[world].fx === "drops" ? 1 : Math.sin(Math.PI * k);
      ctx.globalAlpha = p.a * fade; const z = p.sz * lay.s * dpr;
      ctx.drawImage(sheet, p.cell * 256, 0, 256, 256, sx(p.x) - z / 2, sy(p.y) - z / 2, z, z);
    }
    ctx.globalAlpha = 1;
    // Rings spread from the bowl across the still water, flattened by the pool's perspective.
    const now = ac ? ac.currentTime : 0;
    for (let i = ripples.length - 1; i >= 0; i--) {
      const k = (now - ripples[i]) / 3.4;
      if (k > 1) { ripples.splice(i, 1); continue; }
      const rx = (40 + k * 480) * lay.s * dpr;
      ctx.beginPath(); ctx.ellipse(sx(BOWL.x), sy(BOWL.y), rx, rx * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(243, 226, 190, ${(1 - k) * 0.35})`; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
    }
  };

  // The frame: the clock, the lights, the drone's swell, the gong's bloom, the parallax, the canvas.
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine && !reduce) wrap.addEventListener("pointermove", (e) => { par.tx = e.clientX / innerWidth - 0.5; par.ty = e.clientY / innerHeight - 0.5; });
  const clock = () => state === "door" ? -1 : (performance.now() - t0 - paused) / 1000;
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!document.hidden) {
      const t = clock();
      if (state !== "door") for (const [at, fn] of EV) if (t >= at && !fired.has(at)) { fired.add(at); fn(); }
      const k = look(t);
      // Opacities are written only when they change, so a still room is left alone by the compositor.
      [[L.wdim, k.wd], [L.rdim, k.rd], [L.light, k.li], [L.bowl, k.bo], [L.gong, seg(t, 75, 79)]].forEach(([el, v]) => {
        const s = v.toFixed(3); if (el.dataset.op !== s) { el.dataset.op = s; el.style.opacity = s; }
      });
      const gs = gongAt >= 0 && t > gongAt ? 1 + 0.02 * Math.exp(-(t - gongAt) / 4) * Math.sin((t - gongAt) * Math.PI * 1.2) : 1;
      par.x += (par.tx - par.x) * 0.06; par.y += (par.ty - par.y) * 0.06;
      if (Math.abs(par.tx - par.x) < 0.002) par.x = par.tx; if (Math.abs(par.ty - par.y) < 0.002) par.y = par.ty;
      const step = 1 / (devicePixelRatio || 1), snap = (v) => (Math.round(v / step) * step).toFixed(3);
      for (const [el, f] of PAR) {
        const extra = el === L.bowl ? ` scale(${k.sc.toFixed(4)})` : el === L.gong ? ` scale(${gs.toFixed(4)})` : "";
        const tf = `translate(${snap(par.x * f)}px, ${snap(par.y * f * 0.5)}px)${extra}`;
        if (el.dataset.tf !== tf) { el.dataset.tf = tf; el.style.transform = tf; }
      }
      if (ac && state === "run" && t < 105) g.drone.gain.setTargetAtTime(0.1 + 0.1 * breath(t), ac.currentTime, 0.15);
      prog.style.width = (state === "door" ? 0 : clamp(t / 120) * 100) + "%";
      draw(dt, t);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // The door: pick a world (the arch shows it), headphones or not, Begin.
  const setWorld = (w) => {
    world = w;
    wrap.querySelectorAll(".door").forEach((d) => d.classList.toggle("on", d.dataset.w === w));
    if (L.world.getAttribute("src") === `img/w-${w}.webp`) return;
    L.world.classList.add("swap");
    setTimeout(() => { L.world.src = `img/w-${w}.webp`; L.world.onload = () => L.world.classList.remove("swap"); }, 300);
  };
  wrap.querySelectorAll(".door").forEach((d) => d.addEventListener("click", () => setWorld(d.dataset.w)));
  const press = (btn, on) => { btn.setAttribute("aria-pressed", String(on)); btn.querySelector(".lab").textContent = btn.dataset[on ? "on" : "off"]; };
  hpBtn.addEventListener("click", () => { phones = !phones; press(hpBtn, phones); });
  sndBtn.addEventListener("click", () => { sound = !sound; press(sndBtn, sound); if (ac) ramp(mute.gain, sound ? 1 : 0, 0.25); });

  const begin = () => {
    if (!audio()) return;
    if (ac.state === "suspended") ac.resume();
    if (nat) { nat.stop(); nat = null; } if (lift) { lift.stop(); lift = null; } if (bin) { bin.forEach((o) => o.stop()); bin = null; }
    state = "run"; t0 = performance.now(); paused = 0; fired = new Set(); gongAt = -1; ripples.length = 0; parts.length = 0;
    wrap.classList.add("run"); wrap.classList.remove("end");
    const w = WORLDS[world];
    bufs = null;
    Promise.all([load(w.loop), load(w.lift)]).then(([loop, up]) => {
      if (state === "door" || !ac) return;
      bufs = { loop, lift: up };
      if (clock() < 105) { nat = play(loop, g.nature, true); ramp(g.nature.gain, 0.5, 6); }
    }).catch(() => {});
    if (!dn.length) drone();
    sheet = new Image(); sheet.src = `img/${w.fx}.webp`;
  };
  const leave = () => {
    state = "door"; wrap.classList.remove("run", "end"); clearTimeout(sayT); text.textContent = text.dataset.door; text.classList.add("on");
    prog.style.width = "0";
    if (!ac) return;
    const old = ac; ramp(mute.gain, 0, 0.25);
    setTimeout(() => old.close(), 320);
    ac = null; nat = lift = bufs = bin = null; dn = []; g = {}; parts.length = 0; ripples.length = 0; gongAt = -1;
  };
  q(".plaque").addEventListener("click", begin);
  q(".again").addEventListener("click", begin);
  q(".leave").addEventListener("click", leave);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && state !== "door") leave(); });
  document.addEventListener("visibilitychange", () => {
    if (state === "door") return;
    if (document.hidden) { pauseAt = performance.now(); if (ac) ac.suspend(); }
    else { paused += performance.now() - pauseAt; if (ac) ac.resume(); }
  });
  addEventListener("pagehide", () => { if (ac) ac.close(); });
  text.dataset.door = text.textContent; text.classList.add("on");
  setWorld(world);
  // For checks: jump the clock. Events before the new time are skipped, not played.
  window.__room = { seek: (s) => { if (state === "door") return; t0 = performance.now() - s * 1000 - paused; EV.forEach(([at]) => { if (at < s) fired.add(at); }); }, state: () => state, t: clock,
    audio: () => (ac ? { state: ac.state, mute: mute.gain.value, nature: g.nature.gain.value, lift: g.lift.gain.value, drone: g.drone.gain.value } : null), parts: () => parts.length };
})();
