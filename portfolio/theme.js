// Light/dark switch. Follows the system until the visitor picks; the pick is remembered on this device only.
(() => {
  const root = document.documentElement;
  const btn = document.querySelector(".theme");
  const sys = () => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const current = () => root.dataset.theme || sys();
  const label = () => { if (btn) { btn.textContent = current() === "dark" ? "Light" : "Dark"; btn.setAttribute("aria-label", "Switch to " + btn.textContent.toLowerCase() + " mode"); } };
  try { const saved = localStorage.getItem("rkj-theme"); if (saved === "light" || saved === "dark") root.dataset.theme = saved; } catch (e) {}
  label();
  if (btn) btn.addEventListener("click", () => {
    const flip = () => {
      root.dataset.theme = current() === "dark" ? "light" : "dark";
      try { localStorage.setItem("rkj-theme", root.dataset.theme); } catch (e) {}
      label();
    };
    // A cross-fade between themes where the browser supports it; an instant switch elsewhere.
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.startViewTransition(flip);
    else flip();
  });
})();
