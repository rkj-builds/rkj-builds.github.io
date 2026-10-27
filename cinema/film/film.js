// The film opening. Scroll picks the scene (one screen of scroll per cut); the timecode ruler is the
// progress bar. Sound is off until the visitor claps the slate or turns it on: nothing is played or
// fetched before that. Voice-over files go in VO when Rahul records them (one per scene, sc1-sc5).
(() => {
  const RUNTIME = 45; // seconds the ruler spans, 00:00:00:00 to 00:00:45:00
  const VO = {}; // e.g. { 1: "vo/sc1.mp3" }; empty until the recordings exist
  const scenes = [...document.querySelectorAll(".scene")];
  const tc = document.querySelector(".tc");
  const fill = document.querySelector(".fill");
  const snd = document.querySelector(".snd");
  const clapBtn = document.querySelector(".clap");
  const flash = document.querySelector(".flash");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = 0;
  let soundOn = false;
  let ctx = null;
  let voice = null;

  const pad = (n) => String(n).padStart(2, "0");
  function timecode(t) {
    const s = Math.floor(t), f = Math.floor((t - s) * 24);
    return `00:00:${pad(s)}:${pad(f)}`;
  }

  function setScene(n) {
    if (n === current) return;
    scenes[current].classList.remove("on");
    scenes[current].inert = true;
    scenes[n].classList.add("on");
    scenes[n].inert = false;
    current = n;
    playVoice(n);
  }

  function onScroll() {
    const h = innerHeight;
    const max = document.documentElement.scrollHeight - h;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    fill.style.transform = `scaleX(${p})`;
    tc.textContent = timecode(p * RUNTIME);
    setScene(Math.min(scenes.length - 1, Math.round(scrollY / h)));
  }
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  }, { passive: true });
  addEventListener("resize", onScroll);

  // Sound. A clap made in the browser stands in until a real slate recording replaces it.
  function audio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function clapSound() {
    const a = audio(), rate = a.sampleRate, len = Math.floor(rate * 0.3);
    const buf = a.createBuffer(1, len, rate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * 0.012));
    const src = a.createBufferSource(); src.buffer = buf;
    const crack = a.createBiquadFilter(); crack.type = "bandpass"; crack.frequency.value = 2200; crack.Q.value = 0.7;
    const body = a.createBiquadFilter(); body.type = "lowpass"; body.frequency.value = 380;
    const g1 = a.createGain(); g1.gain.value = 0.8;
    const g2 = a.createGain(); g2.gain.value = 1.4;
    src.connect(crack).connect(g1).connect(a.destination);
    src.connect(body).connect(g2).connect(a.destination);
    src.start();
  }
  function playVoice(n) {
    if (voice) { voice.pause(); voice = null; }
    if (!soundOn || !VO[n]) return;
    voice = new Audio(VO[n]);
    voice.play().catch(() => {});
  }
  function setSound(on) {
    soundOn = on;
    snd.setAttribute("aria-pressed", String(on));
    snd.textContent = on ? "Sound on" : "Sound off";
    if (on) audio(); else if (voice) { voice.pause(); voice = null; }
  }
  snd.addEventListener("click", () => setSound(!soundOn));

  function toScene(n) {
    scrollTo({ top: n * innerHeight, behavior: reduce ? "auto" : "smooth" });
  }

  // The slate: press lifts, release claps. Keyboard: Enter or Space does both.
  const down = () => clapBtn.classList.add("down");
  function release() {
    if (!clapBtn.classList.contains("down")) return;
    clapBtn.classList.remove("down");
    setSound(true);
    clapSound();
    if (!reduce) { flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go"); }
    setTimeout(() => toScene(1), reduce ? 0 : 420);
  }
  clapBtn.addEventListener("pointerdown", down);
  clapBtn.addEventListener("pointerup", release);
  clapBtn.addEventListener("pointerleave", () => clapBtn.classList.remove("down"));
  clapBtn.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); down(); } });
  clapBtn.addEventListener("keyup", (e) => { if (e.key === "Enter" || e.key === " ") release(); });

  document.querySelector(".silent").addEventListener("click", () => { setSound(false); toScene(1); });

  scenes.forEach((s, i) => { s.inert = i !== current; });
  onScroll();
})();
