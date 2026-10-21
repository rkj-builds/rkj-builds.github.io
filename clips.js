// Clips: each figure.clip shows a still frame; the recording plays when it scrolls into view, or on Play.
// With "reduce motion" set, nothing plays until the person presses Play. Pause always returns to the still.
(function () {
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var figs = document.querySelectorAll("figure.clip");
  Array.prototype.forEach.call(figs, function (f) {
    var imgs = f.querySelectorAll("img[data-clip]"), btn = f.querySelector(".clipbtn"), playing = false;
    function set(p) {
      playing = p;
      Array.prototype.forEach.call(imgs, function (i) {
        if (!i.dataset.still) i.dataset.still = i.getAttribute("src");
        i.src = p ? i.dataset.clip : i.dataset.still;
      });
      if (btn) { btn.textContent = p ? "Pause" : "Play"; btn.setAttribute("aria-pressed", p ? "true" : "false"); }
    }
    if (btn) btn.addEventListener("click", function () { f.dataset.user = playing ? "paused" : "played"; set(!playing); });
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (f.dataset.user === "paused") return;
          if (e.isIntersecting && !playing) set(true);
          else if (!e.isIntersecting && playing && f.dataset.user !== "played") set(false);
        });
      }, { threshold: 0.35 }).observe(f);
    }
  });
})();
