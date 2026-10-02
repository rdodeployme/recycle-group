/* Recycle Group film engine.
   Photoreal clips with precise, tracked annotation.
   <section class="fx fx-scrub" data-fx='{json}'>  scroll-scrubbed, pinned
   <div class="fx fx-loop" data-fx='{json}'>       plays in view, loops
   json: { src, poster, dur, chapters:[{t,n,h,p}], cues:[{t0,t1,k:[[t,x,y],...],side,l,v,c:{to,dec,unit,pre}}], mark }
   x/y are 0..1 of the source frame; the engine maps them through object-fit:cover. */
(function () {
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = matchMedia('(max-width: 760px)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(t, c, p) { var e = d.createElement(t); if (c) e.className = c; if (p) p.appendChild(e); return e; }
  function sv(t, a, p) { var e = d.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function fmt(v, c) { var s = c.dec ? v.toFixed(c.dec) : Math.round(v).toString(); s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (c.pre || '') + s; }
  function tc(t) { var f = Math.floor((t % 1) * 24), s = Math.floor(t); return '00:' + (s < 10 ? '0' : '') + s + ':' + (f < 10 ? '0' : '') + f; }
  function track(k, t) { // piecewise-linear keyframes [[t,x,y],...]
    if (t <= k[0][0]) return [k[0][1], k[0][2]];
    for (var i = 1; i < k.length; i++) if (t <= k[i][0]) { var a = k[i - 1], b = k[i], u = (t - a[0]) / (b[0] - a[0] || 1); u = u * u * (3 - 2 * u); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
    var l = k[k.length - 1]; return [l[1], l[2]];
  }

  function Film(root) {
    var cfg; try { cfg = JSON.parse(root.getAttribute('data-fx')); } catch (e) { return; }
    var scrub = root.classList.contains('fx-scrub') && !reduce;
    var frame = root.querySelector('.fx-frame'), v = frame.querySelector('video');
    var src = cfg.src + (narrow ? '-m' : '') + '.mp4';
    v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = scrub ? 'auto' : 'metadata';
    var svg = sv('svg', { 'class': 'fx-svg', 'aria-hidden': 'true' }, frame);
    var tags = el('div', 'fx-tags', frame);
    var hud = root.querySelector('.fx-hud'), bar = hud && hud.querySelector('.fx-bar i'), clock = hud && hud.querySelector('.fx-tc');
    var chs = [].slice.call(root.querySelectorAll('[data-ch]'));
    var cues = (cfg.cues || []).map(function (c) {
      var g = sv('g', { 'class': 'fx-cue' }, svg);
      var ring = sv('circle', { r: 9, 'class': 'fx-ring' }, g), dot = sv('circle', { r: 3, 'class': 'fx-dot' }, g);
      var line = sv('polyline', { 'class': 'fx-line', fill: 'none' }, g);
      var tag = el('div', 'fx-tag' + (c.side === 'l' ? ' l' : ''), tags);
      tag.innerHTML = '<span>' + c.l + '</span>' + (c.v || c.c ? '<b>' + (c.v || '') + '</b>' : '');
      return { c: c, g: g, ring: ring, dot: dot, line: line, tag: tag, b: tag.querySelector('b'), on: false };
    });
    var W = 0, H = 0, vw = 1920, vh = 1076, sc = 1, ox = 0, oy = 0;
    function layout() {
      var r = frame.getBoundingClientRect(); W = r.width; H = r.height;
      vw = v.videoWidth || vw; vh = v.videoHeight || vh;
      sc = Math.max(W / vw, H / vh); ox = (W - vw * sc) / 2; oy = (H - vh * sc) / 2;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    }
    function map(x, y) { return [ox + x * vw * sc, oy + y * vh * sc]; }
    var dur = cfg.dur || 10, last = -1;
    function render(t) {
      if (Math.abs(t - last) < 1e-3) return; last = t;
      var p = t / dur;
      if (bar) bar.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
      if (clock) clock.textContent = tc(t);
      var cur = -1; chs.forEach(function (c, i) { if (t >= +c.getAttribute('data-ch')) cur = i; });
      chs.forEach(function (c, i) { c.classList.toggle('on', i === cur); c.classList.toggle('done', i < cur); });
      var solo = W < 520 ? cues.reduce(function (m, q) { return t >= q.c.t0 && t <= q.c.t1 && (!m || q.c.t0 > m.c.t0) ? q : m; }, null) : null;
      cues.forEach(function (q) {
        var c = q.c, on = t >= c.t0 && t <= c.t1 && (!solo || q === solo);
        if (on !== q.on) { q.on = on; q.g.classList.toggle('on', on); q.tag.classList.toggle('on', on); }
        if (!on) return;
        var a = track(c.k, t), P = map(a[0], a[1]), dir = c.side === 'l' ? -1 : 1;
        var inside = P[0] > 14 && P[0] < W - 14 && P[1] > 14 && P[1] < H - 14;
        q.g.style.visibility = q.tag.style.visibility = inside ? '' : 'hidden'; if (!inside) return;
        var lx = narrow ? 34 : 64, ly = narrow ? 30 : 48;
        var ex = P[0] + dir * lx, ey = P[1] - ly, tx = ex + dir * (narrow ? 14 : 26);
        // keep the label inside the frame
        var tw = q.tag.offsetWidth || 120;
        if (dir > 0 && tx + tw > W - 12) { dir = -1; ex = P[0] - lx; tx = ex - 26; }
        if (dir < 0 && tx - tw < 12) { dir = 1; ex = P[0] + lx; tx = ex + 26; }
        ey = Math.max(ey, 54);
        q.dot.setAttribute('cx', P[0]); q.dot.setAttribute('cy', P[1]);
        q.ring.setAttribute('cx', P[0]); q.ring.setAttribute('cy', P[1]);
        q.line.setAttribute('points', P[0] + ',' + P[1] + ' ' + ex + ',' + ey + ' ' + tx + ',' + ey);
        q.tag.style.transform = 'translate(' + (dir > 0 ? tx + 6 : tx - 6 - tw) + 'px,' + (ey - 13) + 'px)';
        if (c.c && q.b) { var k = ease((t - c.t0) / Math.min(1.6, (c.t1 - c.t0) * .6)); q.b.textContent = fmt(c.c.to * k, c.c) + (c.c.unit ? ' ' + c.c.unit : ''); }
      });
    }
    function ready() { layout(); last = -1; render(v.currentTime || 0); }
    v.addEventListener('loadedmetadata', function () { dur = v.duration || dur; ready(); });
    addEventListener('resize', ready);
    if ('ResizeObserver' in window) new ResizeObserver(ready).observe(frame);

    if (scrub) {
      // the poster stays as a backdrop; the element itself shows decoded frames as soon as one exists
      frame.style.backgroundImage = 'url(' + v.getAttribute('poster') + ')'; frame.style.backgroundSize = 'cover'; frame.style.backgroundPosition = 'center';
      v.removeAttribute('poster');
      v.src = src; v.load();
      v.addEventListener('loadeddata', function prime() { v.removeEventListener('loadeddata', prime); var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); v.currentTime = cur; }).catch(function () {}); else v.pause(); });
      var target = 0, cur = 0, raf = 0, vis = false;
      function prog() { var r = root.getBoundingClientRect(), span = r.height - innerHeight; return clamp(-r.top / (span || 1), 0, 1); }
      function loop() {
        target = prog() * (dur - 0.05);
        cur += (target - cur) * 0.14; if (Math.abs(target - cur) < 0.002) cur = target;
        if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - cur) > 0.03) { try { v.currentTime = cur; } catch (e) {} }
        render(cur);
        raf = vis ? requestAnimationFrame(loop) : 0;
      }
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '200px 0px' }).observe(root);
      // iOS needs a decoded frame before seeking paints
      d.addEventListener('touchstart', function once() { var pr = v.play(); if (pr && pr.then) pr.then(function () { v.pause(); }).catch(function () {}); d.removeEventListener('touchstart', once); }, { passive: true });
    } else {
      v.loop = true; var started = false;
      function tick() { if (!v.paused) { render(v.currentTime); requestAnimationFrame(tick); } }
      v.addEventListener('play', function () { requestAnimationFrame(tick); });
      if (reduce) { v.src = src; v.addEventListener('loadeddata', function () { v.currentTime = Math.min(dur * .55, 6); ready(); }); }
      else new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { if (!started) { v.src = src; started = true; } var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else v.pause();
      }, { threshold: 0.25 }).observe(root);
    }
    root.classList.add('fx-on');
  }

  // Hero reel: plays the brand film and steps the material list in time with it.
  function Reel(root) {
    var v = root.querySelector('video'); if (!v) return;
    var cfg; try { cfg = JSON.parse(root.getAttribute('data-reel')); } catch (e) { return; }
    var rows = cfg.rows || [], items = [].slice.call(d.querySelectorAll('[data-reel-i]'));
    var cap = d.querySelector('.reel-cap'), num = cap && cap.querySelector('i'), name = cap && cap.querySelector('b'), line = cap && cap.querySelector('.reel-bar i');
    if (reduce) { v.removeAttribute('autoplay'); v.src = cfg.src + (narrow ? '-m' : '') + '.mp4'; v.addEventListener('loadeddata', function () { v.currentTime = 1; }); return; }
    v.src = cfg.src + (narrow ? '-m' : '') + '.mp4'; v.muted = true; v.loop = true; v.playsInline = true;
    var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    var lastI = -1;
    function tick() {
      var t = v.currentTime, i = 0; for (var k = 0; k < rows.length; k++) if (t >= rows[k].t) i = k;
      var a = rows[i].t, b = i + 1 < rows.length ? rows[i + 1].t : (v.duration || cfg.dur);
      if (line) line.style.transform = 'scaleX(' + clamp((t - a) / (b - a), 0, 1) + ')';
      if (i !== lastI) {
        lastI = i;
        if (num) num.textContent = (i + 1 < 10 ? '0' : '') + (i + 1) + ' / ' + (rows.length < 10 ? '0' : '') + rows.length;
        if (name) { name.classList.remove('in'); void name.offsetWidth; name.textContent = rows[i].n; name.classList.add('in'); }
        items.forEach(function (it) { it.classList.toggle('lit', rows[i].m.indexOf(+it.getAttribute('data-reel-i')) > -1); });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    d.addEventListener('visibilitychange', function () { if (d.hidden) v.pause(); else v.play().catch(function () {}); });
  }

  function boot() {
    [].forEach.call(d.querySelectorAll('.fx[data-fx]'), function (r) { try { Film(r); } catch (e) { console.warn('film', e); } });
    [].forEach.call(d.querySelectorAll('[data-reel]'), function (r) { try { Reel(r); } catch (e) { console.warn('reel', e); } });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
