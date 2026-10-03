/* Accent preview: ?accent=ochre|copper|corten turns on the warm highlight colour site-wide and keeps it while browsing. */
(function () {
  var d = document, html = d.documentElement, OPTS = ['none', 'ochre', 'copper', 'corten'];
  var q = (location.search.match(/[?&]accent=([a-z]+)/) || [])[1];
  if (!q || OPTS.indexOf(q) < 0) return;
  if (q !== 'none') html.setAttribute('data-accent', q);
  function keep(a) {
    var u; try { u = new URL(a.href, location.href); } catch (e) { return; }
    if (u.origin !== location.origin || /\.(pdf|png|jpe?g|webp|mp4)$/i.test(u.pathname)) return;
    u.searchParams.set('accent', q); a.href = u.toString();
  }
  function boot() {
    [].forEach.call(d.querySelectorAll('a[href]'), keep);
    var bar = d.createElement('div'); bar.className = 'acc-bar';
    bar.innerHTML = '<span>Accent preview</span>' + OPTS.map(function (o) {
      return '<a href="?accent=' + o + '"' + (o === q ? ' class="on"' : '') + '><i class="sw sw-' + o + '"></i>' + (o === 'none' ? 'Petrol only' : o.charAt(0).toUpperCase() + o.slice(1)) + '</a>';
    }).join('');
    d.body.appendChild(bar);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
