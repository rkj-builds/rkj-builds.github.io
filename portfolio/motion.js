// Entrances and count-ups (canvas row I, frame I-motion). Each runs once, only for what starts below the fold,
// so nothing already on screen blinks. Reduced motion, or no IntersectionObserver: the page stays as written.
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const fold = innerHeight * 0.92;
  const below = (el) => el.getBoundingClientRect().top > fold;

  const rise = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    rise.unobserve(el);
    el.classList.add("in");
    // Hand the element back to its own transitions (card hover) once it has arrived.
    const done = (ev) => {
      if (ev.target !== el) return;
      el.removeEventListener("transitionend", done);
      el.classList.remove("pre", "in"); el.style.transitionDelay = "";
    };
    el.addEventListener("transitionend", done);
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".show, .feat > a, .rows li, .stage").forEach((el) => {
    if (!below(el)) return;
    const i = [...el.parentNode.children].indexOf(el);
    if (el.matches(".feat > a, .rows li")) el.style.transitionDelay = (i % 4) * 70 + "ms";
    el.classList.add("pre");
    rise.observe(el);
  });

  // Numbers count up from zero, keeping their prefix, suffix and decimals: 74%, ₹5.6L, 290.
  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const count = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    count.unobserve(e.target);
    const el = e.target, [, pre, num, post] = el.dataset.n.match(/^([^\d<]*)(\d+(?:\.\d+)?)(.*)$/);
    const end = Number(num), dp = (num.split(".")[1] || "").length, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 900);
      el.textContent = pre + (end * ease(p)).toFixed(dp) + post;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  document.querySelectorAll(".nums b, .feat .n b").forEach((el) => {
    const m = el.textContent.match(/^([^\d<]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!m || Number(m[2]) === 0 || !below(el)) return;
    el.dataset.n = el.textContent;
    el.textContent = m[1] + (0).toFixed((m[2].split(".")[1] || "").length) + m[3];
    count.observe(el);
  });
})();
