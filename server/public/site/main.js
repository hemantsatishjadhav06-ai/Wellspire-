// Shared behaviour: theme toggle + mobile drawer + scroll reveal.
(function () {
  var root = document.documentElement;
  function cur() { var t = root.getAttribute('data-theme'); return t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  var moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  var sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var btn = document.getElementById('themeBtn');
  var ic = document.getElementById('themeIcon');
  function paint() { if (ic) ic.innerHTML = cur() === 'dark' ? sun : moon; }
  if (btn) btn.addEventListener('click', function () { root.setAttribute('data-theme', cur() === 'dark' ? 'light' : 'dark'); paint(); });
  paint();

  var menu = document.getElementById('menuBtn');
  var drawer = document.getElementById('drawer');
  if (menu && drawer) menu.addEventListener('click', function () { drawer.classList.toggle('open'); });

  // reveal on scroll
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = document.querySelectorAll('.reveal');
    els.forEach(function (el) { el.style.animationPlayState = 'paused'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.style.animationPlayState = 'running'; io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  // enquiry form (demo)
  var f = document.getElementById('enquiry');
  if (f) f.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = document.getElementById('formNote');
    if (n) { n.innerHTML = '✓ Thank you! Your enquiry has been noted. Our admissions team will reach out — or call <b>+91 99883 34844</b>.'; n.style.color = 'var(--green)'; }
    f.reset();
  });
})();
