// Theme: dark by default, light by system setting, either by choice. Saved per browser.
(function () {
  var root = document.documentElement, key = "theme";
  function saved() { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function apply(v) { if (v === "light" || v === "dark") root.setAttribute("data-theme", v); else root.removeAttribute("data-theme"); }
  apply(saved());
  function label(v) { return v === "light" ? "Light" : v === "dark" ? "Dark" : "Theme: system"; }
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.textContent = label(saved());
    btn.addEventListener("click", function () {
      var cur = saved(), next = cur === "dark" ? "light" : cur === "light" ? null : "dark";
      try { next ? localStorage.setItem(key, next) : localStorage.removeItem(key); } catch (e) {}
      apply(next); btn.textContent = label(next);
    });
  });
})();
