// Theme: dark by default, light by system setting, either by choice. Saved per browser.
(function () {
  var root = document.documentElement, key = "theme";
  function saved() { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function apply(v) { if (v === "light" || v === "dark") root.setAttribute("data-theme", v); else root.removeAttribute("data-theme"); }
  apply(saved());
  function label(v) { return v === "light" ? "Light" : v === "dark" ? "Dark" : "Theme: system"; }
  // A button's trailing arrow gets its own span, so it can nudge the way the link goes (style.css, .cta .ar).
  function arrows() {
    var ctas = document.querySelectorAll(".cta");
    for (var i = 0; i < ctas.length; i++) {
      var last = ctas[i].lastChild;
      if (!last || last.nodeType !== 3) continue;
      var m = /\s*([→↗])\s*$/.exec(last.nodeValue);
      if (!m) continue;
      last.nodeValue = last.nodeValue.slice(0, m.index);
      var span = document.createElement("span");
      span.className = m[1] === "↗" ? "ar out" : "ar";
      span.setAttribute("aria-hidden", "true");
      span.textContent = m[1];
      ctas[i].appendChild(document.createTextNode(" "));
      ctas[i].appendChild(span);
    }
  }
  document.addEventListener("DOMContentLoaded", function () {
    arrows();
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.textContent = label(saved());
    btn.addEventListener("click", function () {
      var cur = saved(), next = cur === "dark" ? "light" : cur === "light" ? null : "dark";
      try { next ? localStorage.setItem(key, next) : localStorage.removeItem(key); } catch (e) {}
      // A short cross-fade so the switch reads as one change, not a flash (style.css, html.theming).
      if (!window.matchMedia || !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.classList.add("theming");
        setTimeout(function () { root.classList.remove("theming"); }, 250);
      }
      apply(next); btn.textContent = label(next);
    });
  });
})();
