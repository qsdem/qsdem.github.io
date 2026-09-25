'use strict';
/* qsDEM -- a blog post's figures and movies.  Load it at the end of the page. */
(function () {
  // A zoom figure opens its full-resolution file over the page at one image pixel per screen
  // pixel, centered on the point that was clicked.  Scrolling pans it, and a click or Escape
  // closes it.  Without JavaScript the link opens the file itself.
  var box = null, from = null;
  function close() {
    if (!box) return;
    box.remove();
    box = null;
    document.documentElement.style.overflow = '';
    if (from) from.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a.zoom') : null;
    if (!a || box) return;
    e.preventDefault();
    from = a;
    var r = a.getBoundingClientRect();
    var fx = e.clientX ? (e.clientX - r.left) / r.width : 0.5;
    var fy = e.clientY ? (e.clientY - r.top) / r.height : 0.5;
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Figure at full resolution. Click or press Escape to close.');
    box.tabIndex = -1;
    var img = new Image();
    var thumb = a.querySelector('img');
    img.alt = thumb ? thumb.alt : '';
    img.onload = function () {
      img.style.width = img.naturalWidth / (window.devicePixelRatio || 1) + 'px';
      box.scrollLeft = fx * img.offsetWidth - box.clientWidth / 2;
      box.scrollTop = fy * img.offsetHeight - box.clientHeight / 2;
    };
    img.src = a.href;
    box.appendChild(img);
    box.addEventListener('click', close);
    document.body.appendChild(box);
    document.documentElement.style.overflow = 'hidden';
    box.focus();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // A movie loads and plays only while it is on screen, and a click pauses it.  A reader who
  // has asked for less motion gets the controls instead.
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var movies = document.querySelectorAll('.post-body video.movie');
  for (var m = 0; m < movies.length; m++) {
    (function (v) {
      var held = false;
      function play() { v.preload = 'auto'; v.play().catch(function () {}); }
      if (still) { v.setAttribute('controls', ''); return; }
      v.style.cursor = 'pointer';
      v.title = 'Click to pause or play';
      v.addEventListener('click', function () {
        if (v.paused) { held = false; play(); } else { held = true; v.pause(); }
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { if (!held) play(); }
            else if (!v.paused) { v.pause(); }
          });
        }, {threshold: 0.25}).observe(v);
      } else {
        play();
      }
    })(movies[m]);
  }
})();
