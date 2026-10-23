// Case pages: the parts that move. Every part reads fine with this script off.
//   .chapters      marks the chapter you are reading (aria-current)
//   [data-readas]  two readings of one chapter, as tabs
//   [data-steps]   a flow, one step at a time
//   [data-extra]   the overtime rule from lib/extraTime.mjs in the 831 repo, as a slider
(function () {
  function ready(fn) { document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn(); }

  function chapters() {
    var nav = document.querySelector(".chapters");
    if (!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var current = -1, queued = false;
    var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function mark(i) {
      if (i === current) return;
      current = i;
      links.forEach(function (a, j) { j === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
      var a = links[i];
      if (a) nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: still ? "auto" : "smooth" });
    }
    // The chapter whose heading has passed the top third of the screen. Before the first one, none.
    function pick() {
      queued = false;
      var cur = -1, line = window.innerHeight * 0.33;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top <= line) cur = i; });
      if (cur === -1) { links.forEach(function (a) { a.removeAttribute("aria-current"); }); current = -1; nav.scrollLeft = 0; return; }
      mark(cur);
    }
    window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(pick); } }, { passive: true });
    window.addEventListener("resize", pick);
    pick();
  }

  function readas(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    function show(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          show((i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length, true);
        }
      });
    });
    root.hidden = false;
    show(0);
  }

  function steps(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-step]"));
    var bars = root.querySelector(".steps"), k = root.querySelector(".k");
    var back = root.querySelector("[data-back]"), next = root.querySelector("[data-next]");
    var i = 0;
    bars.innerHTML = items.map(function () { return "<span></span>"; }).join("");
    function show() {
      items.forEach(function (el, j) { el.hidden = j !== i; });
      Array.prototype.forEach.call(bars.children, function (b, j) { b.className = j <= i ? "on" : ""; });
      k.textContent = "Step " + (i + 1) + " of " + items.length;
      back.disabled = i === 0;
      next.disabled = i === items.length - 1;
    }
    back.addEventListener("click", function () { if (i > 0) { i--; show(); } });
    next.addEventListener("click", function () { if (i < items.length - 1) { i++; show(); } });
    root.querySelector(".row").hidden = false;
    show();
  }

  function extra(root) {
    var step = +root.dataset.step, free = +root.dataset.free, perHour = +root.dataset.perHour;
    var input = root.querySelector("input"), over = root.querySelector("[data-over]");
    var charged = root.querySelector("[data-charged]"), money = root.querySelector("[data-money]");
    // One step at the booking's hourly rate; a step that isn't whole rupees rounds up to the next ₹10.
    var exact = perHour * step / 60, perStep = exact % 1 === 0 ? exact : Math.ceil(exact / 10) * 10;
    function fmt(m) { return m === 0 ? "None" : m >= 60 ? Math.floor(m / 60) + " hour" + (m >= 120 ? "s" : "") + (m % 60 ? " " + (m % 60) + " minutes" : "") : m + " minutes"; }
    function show() {
      var o = +input.value, n = o > free ? Math.ceil((o - free) / step) : 0;
      over.textContent = o + (o === 1 ? " minute" : " minutes");
      charged.textContent = fmt(n * step);
      money.textContent = "₹" + (n * perStep).toLocaleString("en-IN");
    }
    input.addEventListener("input", show);
    show();
  }

  ready(function () {
    chapters();
    Array.prototype.forEach.call(document.querySelectorAll("[data-readas]"), readas);
    Array.prototype.forEach.call(document.querySelectorAll("[data-steps]"), steps);
    Array.prototype.forEach.call(document.querySelectorAll("[data-extra]"), extra);
  });
})();
