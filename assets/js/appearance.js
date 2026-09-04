'use strict';
/* qsDEM -- the Appearance panel: text size and light/dark, shared by every page that has the
   .columns shell. Load it from <head> WITHOUT defer:

     <script src="assets/js/appearance.js"></script>

   The top half has to run before the body paints, or a reader who chose dark last visit sees a
   white flash first. The panel itself is injected rather than written into each page's markup,
   because it is a preference control that does nothing without JavaScript: if the script fails
   there should be no panel offering choices it cannot honour. */

(function () {
  var root = document.documentElement;
  var SIZE = {small: '13.5px', standard: '15px', large: '17px'};

  // Storage throws outright in some contexts, not just return null: a private window, a browser
  // set to block site data, a file:// page in Safari. Every access has to be guarded.
  function read(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  var theme = read('qsdem-theme', 'light') === 'dark' ? 'dark' : 'light';
  var text = SIZE[read('qsdem-text', 'standard')] ? read('qsdem-text', 'standard') : 'standard';

  function apply() {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    root.style.setProperty('--fs', SIZE[text]);
  }

  apply();                       // before first paint, so the stored choice is what gets painted

  function build() {
    var host = document.querySelector('.columns');
    if (!host || host.querySelector('.appearance')) return;

    var aside = document.createElement('aside');
    aside.className = 'appearance';
    aside.innerHTML =
      '<h2>Appearance</h2>' +
      '<div class="grp"><span>Text</span>' +
        '<label class="t1"><input type="radio" name="ap-text" value="small">Small</label>' +
        '<label class="t2"><input type="radio" name="ap-text" value="standard">Standard</label>' +
        '<label class="t3"><input type="radio" name="ap-text" value="large">Large</label>' +
      '</div>' +
      '<div class="grp"><span>Color</span>' +
        '<label><input type="radio" name="ap-color" value="light">Light</label>' +
        '<label><input type="radio" name="ap-color" value="dark">Dark</label>' +
      '</div>';
    host.appendChild(aside);

    bind('ap-text', text, function (v) { text = v; write('qsdem-text', v); });
    bind('ap-color', theme, function (v) { theme = v; write('qsdem-theme', v); });
  }

  function bind(name, current, onPick) {
    var els = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        el.checked = (el.value === current);
        el.addEventListener('change', function () {
          if (el.checked) { onPick(el.value); apply(); }
        });
      })(els[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
