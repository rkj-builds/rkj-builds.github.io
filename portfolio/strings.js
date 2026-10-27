// The footer's strings (canvas row I, frame I-footer). They always shiver under a cursor or finger;
// they only sound after "Sound on", which is remembered on this device. Sound is off by default.
(() => {
  const wrap = document.querySelector(".strings");
  const btn = document.querySelector(".snd");
  if (!wrap || !btn) return;
  const strs = [...wrap.children];
  // A minor pentatonic from A2, four octaves up.
  const steps = [0, 3, 5, 7, 10];
  const notes = strs.map((_, i) => 110 * Math.pow(2, (Math.floor(i / 5) * 12 + steps[i % 5]) / 12));
  let on = false, ac, master;
  try { on = localStorage.getItem("rkj-sound") === "on"; } catch (e) {}

  const audio = () => {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.45;
      const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2800;
      master.connect(lp); lp.connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume();
  };
  const tone = (f) => {
    const t = ac.currentTime;
    [["triangle", 1, 0.14, 1.6], ["sine", 2, 0.045, 0.6]].forEach(([type, r, a, d]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f * r;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    });
  };
  const label = () => {
    btn.textContent = on ? "Sound on" : "Sound off";
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("on", on);
  };
  label();
  btn.addEventListener("click", () => {
    on = !on;
    try { localStorage.setItem("rkj-sound", on ? "on" : "off"); } catch (e) {}
    if (on) audio();
    label();
  });

  // The footer's waveform edge answers the strings: a ripple runs along it and dies away (same curve as wave() in build.py).
  const edge = document.querySelectorAll(".edge path");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hit = -1, rippling = false;
  const curve = (s) => {
    const g = Math.exp(-s * 3), pts = [];
    for (let x = 0; x <= 1440; x += 3) {
      const env = Math.pow(Math.sin(Math.PI * x / 1440), 1.4);
      pts.push(x + " " + (40 + env * 22 * (Math.sin(x * 0.06) * 0.6 + Math.sin(x * 0.021 + 1) * 0.4 + g * 0.7 * Math.sin(x * 0.09 - s * 12))).toFixed(1));
    }
    return "M" + pts.join(" L");
  };
  const ripple = (t) => {
    const s = (t - hit) / 1000, d = curve(Math.min(s, 2));
    edge[0].setAttribute("d", d + " L1440 80 L0 80 Z"); edge[1].setAttribute("d", d);
    if (s < 2) requestAnimationFrame(ripple); else rippling = false;
  };
  const shiver = () => {
    if (still || edge.length < 2) return;
    hit = performance.now();
    if (!rippling) { rippling = true; requestAnimationFrame(ripple); }
  };

  let last = -1;
  const pluck = (i) => {
    if (i === last || i < 0 || i >= strs.length) return;
    last = i;
    const s = strs[i];
    s.classList.remove("v"); void s.offsetWidth; s.classList.add("v");
    shiver();
    if (!on) return;
    // Browsers allow audio only after the visitor has pressed something on this page.
    const active = navigator.userActivation ? navigator.userActivation.hasBeenActive : !!ac;
    if (!active) return;
    audio(); tone(notes[i]);
  };
  const at = (e) => {
    const r = wrap.getBoundingClientRect();
    return Math.floor(((e.clientX - r.left) / r.width) * strs.length);
  };
  wrap.addEventListener("pointermove", (e) => pluck(at(e)));
  wrap.addEventListener("pointerdown", (e) => { last = -1; pluck(at(e)); });
  wrap.addEventListener("pointerleave", () => { last = -1; });
  addEventListener("pagehide", () => { if (ac) ac.close(); });
})();
