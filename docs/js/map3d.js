/* Infrastructure page: the sites map rebuilt as a tilted 3D Australia with lit pins. */
(function () {
  var wrap = document.querySelector('.sm-map'), svg = document.getElementById('smSvg');
  if (!wrap || !svg || !window.THREE) return;
  var T = window.THREE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.createElement('canvas'); canvas.className = 'm3d-c';
  var r; try { r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
  if (!r.getContext()) return;
  wrap.insertBefore(canvas, wrap.firstChild); wrap.classList.add('has3d');
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(34, 1, 1, 6000);
  scene.add(new T.HemisphereLight(0xdfe8ea, 0x0b0d10, 0.75));
  var key = new T.DirectionalLight(0xffffff, 1.1); key.position.set(-300, 900, 500); scene.add(key);
  var rim = new T.DirectionalLight(0x3B8493, 0.9); rim.position.set(600, 300, -700); scene.add(rim);

  var CX = 449, CZ = 414, land = new T.Group(); scene.add(land);
  var HOT = { VI: 1, QL: 1 };
  svg.querySelectorAll('path.sm-st').forEach(function (p) {
    var d = p.getAttribute('d') || ''; if (!d) return;
    var name = (p.querySelector('title') || {}).textContent || '';
    var hot = /Victoria|Queensland/.test(name);
    var subs = d.match(/M[^M]+/g) || [];
    subs.forEach(function (sub) {
      var pts = (sub.match(/-?[\d.]+,-?[\d.]+/g) || []).map(function (s) { var a = s.split(','); return new T.Vector2(+a[0] - CX, -(+a[1] - CZ)); });
      if (pts.length < 3) return;
      var shape = new T.Shape(pts);
      var h = hot ? 16 : 9;
      var geo = new T.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
      var mat = [new T.MeshStandardMaterial({ color: new T.Color(hot ? 0x2c6e7a : 0x27313a).convertSRGBToLinear(), roughness: 0.75, metalness: 0.05 }),
                 new T.MeshStandardMaterial({ color: new T.Color(hot ? 0x1F5561 : 0x161c20).convertSRGBToLinear(), roughness: 0.8 })];
      var m = new T.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; land.add(m);
      var edges = new T.LineSegments(new T.EdgesGeometry(geo, 30), new T.LineBasicMaterial({ color: hot ? 0x6fb3c0 : 0x3a4a52, transparent: true, opacity: hot ? 0.9 : 0.6 }));
      edges.rotation.x = -Math.PI / 2; land.add(edges);
    });
  });
  var grid = new T.GridHelper(2400, 60, 0x1f3a40, 0x161d22); grid.position.y = -0.5; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);

  // pins from the SVG
  var pins = [], tags = [];
  svg.querySelectorAll('.sm-pin').forEach(function (g) {
    var m = /translate\(([-\d.]+),([-\d.]+)\)/.exec(g.getAttribute('transform')); if (!m) return;
    var x = +m[1] - CX, z = +m[2] - CZ, idx = g.getAttribute('data-p');
    var lab = svg.querySelector('.sm-lab[data-p="' + idx + '"]');
    var beam = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 70, 16, 1, true), new T.MeshBasicMaterial({ color: 0x5fd0e0, transparent: true, opacity: 0.55, depthWrite: false }));
    beam.position.set(x, 16 + 35, z); scene.add(beam);
    var head = new T.Mesh(new T.SphereGeometry(4.2, 20, 16), new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x3B8493, emissiveIntensity: 1.2 }));
    head.position.set(x, 16 + 70, z); scene.add(head);
    var ring = new T.Mesh(new T.RingGeometry(5, 7, 40), new T.MeshBasicMaterial({ color: 0x5fd0e0, transparent: true, opacity: 0.8, side: T.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 16.6, z); scene.add(ring);
    var tag = document.createElement('button'); tag.type = 'button'; tag.className = 'm3d-tag'; tag.textContent = lab ? lab.textContent : '';
    tag.dataset.side = lab && lab.getAttribute('text-anchor') === 'end' ? 'l' : 'r'; tag.dataset.dy = lab ? (lab.getAttribute('data-dy') || 0) : 0;
    tag.setAttribute('data-p', idx); wrap.appendChild(tag); tags.push(tag);
    tag.addEventListener('click', function () { var b = document.querySelector('.sm-item[data-p="' + idx + '"]'); if (b) b.click(); });
    pins.push({ p: idx, pos: new T.Vector3(x, 16, z), head: head, ring: ring, beam: beam, tag: tag });
  });

  // camera: whole continent, then fly to a pin when a site is chosen
  var home = { t: new T.Vector3(40, 0, 40), d: 1050, el: 0.95, az: 0.12 };
  var view = { t: home.t.clone(), d: home.d, el: home.el, az: home.az }, goal = { t: home.t.clone(), d: home.d, el: home.el, az: home.az };
  var active = null;
  function fly(p) { var pin = pins.filter(function (x) { return x.p === p; })[0]; if (!pin) return; active = p; goal.t.copy(pin.pos); goal.d = 260; goal.el = 0.78; goal.az = 0.35; }
  document.querySelectorAll('.sm-item').forEach(function (b) { b.addEventListener('click', function () { if (!b.disabled) fly(b.getAttribute('data-p')); }); });
  var reset = document.getElementById('smReset'); if (reset) reset.addEventListener('click', function () { active = null; goal.t.copy(home.t); goal.d = home.d; goal.el = home.el; goal.az = home.az; });

  function size() { var w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  var v = new T.Vector3(), t0 = performance.now(), running = false;
  function frame(now) {
    var t = (now - t0) / 1000, k = reduce ? 1 : 0.06;
    view.t.lerp(goal.t, k); view.d += (goal.d - view.d) * k; view.el += (goal.el - view.el) * k; view.az += (goal.az - view.az) * k;
    var az = view.az + (reduce || active ? 0 : Math.sin(t * 0.12) * 0.18);
    var narrow = wrap.clientWidth / Math.max(1, wrap.clientHeight) < 1 ? 1.35 : 1;
    cam.position.set(view.t.x + Math.sin(az) * Math.cos(view.el) * view.d * narrow, view.t.y + Math.sin(view.el) * view.d * narrow, view.t.z + Math.cos(az) * Math.cos(view.el) * view.d * narrow);
    cam.lookAt(view.t);
    var rr = wrap.getBoundingClientRect();
    pins.forEach(function (pn, i) {
      var on = active === pn.p, s = 1 + (reduce ? 0 : ((t * 0.8 + i * 0.3) % 1) * 2.2);
      pn.ring.scale.set(s, s, s); pn.ring.material.opacity = reduce ? 0.6 : 0.85 * (1 - ((t * 0.8 + i * 0.3) % 1));
      pn.head.material.emissiveIntensity = on ? 2.2 : 1.1;
      v.copy(pn.head.position); v.y += 8; v.project(cam);
      var tw = pn.tag.offsetWidth, th = pn.tag.offsetHeight, px = (v.x + 1) / 2 * rr.width, py = (1 - v.y) / 2 * rr.height;
      px = pn.tag.dataset.side === 'l' ? px - tw - 10 : px + 10; py = py - th / 2 + (+pn.tag.dataset.dy) * 1.6;
      px = Math.max(6, Math.min(rr.width - tw - 6, px)); py = Math.max(6, Math.min(rr.height - th - 6, py));
      pn.tag.style.transform = 'translate(' + px + 'px,' + py + 'px)';
      pn.tag.classList.toggle('on', on);
    });
    r.render(scene, cam);
    if (running) requestAnimationFrame(frame);
  }
  size();
  if (window.ResizeObserver) new ResizeObserver(function () { size(); if (!running) frame(performance.now()); }).observe(wrap);
  if (reduce) { frame(performance.now()); document.querySelectorAll('.sm-item,#smReset,.m3d-tag').forEach(function (b) { b.addEventListener('click', function () { setTimeout(function () { frame(performance.now()); }, 0); }); }); return; }
  new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { if (!running) { running = true; requestAnimationFrame(frame); } } else running = false; }); }).observe(wrap);
})();
