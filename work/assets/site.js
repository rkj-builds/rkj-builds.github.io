// One job: open a figure full size, and give focus back when it closes.
(function () {
  let dialog = null;
  let opener = null;

  function ensure() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.innerHTML = '<img alt=""><p class="cap"></p>';
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (opener) opener.focus();
      opener = null;
    });
    document.body.appendChild(dialog);
    return dialog;
  }

  for (const button of document.querySelectorAll('.fig button:not(.walk-play)')) {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      const caption = button.closest('figure').querySelector('figcaption');
      const d = ensure();
      const img = d.querySelector('img');
      img.src = source.src;
      img.alt = source.alt;
      d.querySelector('.cap').textContent = caption ? caption.textContent.trim() : '';
      opener = button;
      d.showModal();
    });
  }
})();

// The comment layer on comments.html. One rule: the pin and the panel row can
// never disagree about which thread is open, which is how the real one behaves.
(function () {
  const layer = document.querySelector('.hxc');
  if (!layer) return;

  const spots = [...layer.querySelectorAll('.hxc-spot')];
  const rows = [...layer.querySelectorAll('.hxc-item')];

  function open(id) {
    for (const spot of spots) {
      const on = spot.dataset.id === id;
      spot.toggleAttribute('data-open', on);
      spot.querySelector('.hxc-pin').setAttribute('aria-expanded', String(on));
    }
    for (const row of rows) row.setAttribute('aria-current', String(row.dataset.id === id));
  }

  for (const spot of spots) {
    spot.querySelector('.hxc-pin').addEventListener('click', () => open(spot.dataset.id));
    const close = spot.querySelector('.hxc-close');
    if (close) {
      close.addEventListener('click', () => {
        open('');
        spot.querySelector('.hxc-pin').focus();
      });
    }
  }
  for (const row of rows) row.addEventListener('click', () => open(row.dataset.id));
})();

// Walkthroughs: a still until someone presses play, so nothing moves on its own (WCAG 2.2.2).
(function () {
  for (const button of document.querySelectorAll('.walk-play')) {
    const img = button.querySelector('img');
    const label = button.querySelector('.walk-label');
    const still = img.getAttribute('src');
    const moving = button.dataset.src;
    const idle = label.textContent;
    button.addEventListener('click', () => {
      const play = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(play));
      img.src = play ? moving : still;
      label.textContent = play ? 'Pause' : idle;
    });
  }
})();
