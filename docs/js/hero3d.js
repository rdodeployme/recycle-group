/* Recycle Group home hero: a slow cinematic fly-over of a working recovery site at dusk.
   Trucks circulate over the weighbridge, a sort line runs, bales and containers fill the yard. */
(function () {
  var host = document.querySelector('.hero.home');
  if (!host || !window.THREE) return;
  var T = window.THREE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'h3d'; canvas.setAttribute('aria-hidden', 'true');
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  var shade = host.querySelector('.shade');
  host.insertBefore(canvas, shade || host.firstChild);
  host.classList.add('has3d');
  var vid = host.querySelector('.hvid'); if (vid) { try { vid.pause(); } catch (e) {} vid.removeAttribute('autoplay'); }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  var BG = 0x0E1114, PET = 0x3B8493, DEEP = 0x1F5561;
  var scene = new T.Scene(); scene.background = new T.Color(BG); scene.fog = new T.Fog(BG, 110, 340);
  var cam = new T.PerspectiveCamera(38, 1, 0.5, 600);
  function C(h) { return new T.Color(h).convertSRGBToLinear(); }
  function std(h, o) { o = o || {}; o.color = C(h); if (o.roughness == null) o.roughness = 0.8; return new T.MeshStandardMaterial(o); }

  scene.add(new T.HemisphereLight(0xb7cdd2, 0x0b0e11, 0.85));
  var key = new T.DirectionalLight(0xfff3e6, 1.25); key.position.set(-80, 120, 60); scene.add(key);
  var rim = new T.DirectionalLight(PET, 0.9); rim.position.set(90, 40, -120); scene.add(rim);
  [[-20, 10, 4], [10, 10, 4], [40, 10, 4]].forEach(function (p) { var l = new T.PointLight(0x9fdce6, 1.1, 60, 2); l.position.set(p[0], p[1], p[2]); scene.add(l); });

  function rib(base, line, rx) {
    var c = document.createElement('canvas'); c.width = 128; c.height = 32; var x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 128, 32); for (var i = 0; i < 128; i += 8) { x.fillStyle = line; x.fillRect(i, 0, 3, 32); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 4, 1); t.encoding = T.sRGBEncoding; return t;
  }

  // ground and roads
  var ground = new T.Mesh(new T.PlaneGeometry(700, 700), std(0x14191d, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  var grid = new T.GridHelper(400, 80, 0x1d3338, 0x172025); grid.position.y = 0.02; grid.material.transparent = true; grid.material.opacity = 0.5; scene.add(grid);
  var roadPts = [[-70, 30], [-20, 34], [40, 32], [78, 22], [86, -6], [70, -40], [20, -46], [-40, -44], [-82, -30], [-88, 4]].map(function (p) { return new T.Vector3(p[0], 0.1, p[1]); });
  var road = new T.CatmullRomCurve3(roadPts, true, 'catmullrom', 0.5);
  var roadMesh = new T.Mesh(new T.TubeGeometry(road, 300, 3.4, 8, true), std(0x252c31, { roughness: 1 })); roadMesh.scale.y = 0.03; scene.add(roadMesh);
  var lane = new T.Mesh(new T.TubeGeometry(road, 300, 0.12, 4, true), new T.MeshBasicMaterial({ color: 0x3a6e78 })); lane.position.y = 0.12; lane.scale.y = 0.5; scene.add(lane);

  // weighbridge where the road enters
  var wbP = road.getPointAt(0.06), wbT = road.getTangentAt(0.06);
  var wb = new T.Mesh(new T.BoxGeometry(16, 0.4, 4.6), std(0x3b4246)); wb.position.set(wbP.x, 0.25, wbP.z); wb.rotation.y = Math.atan2(-wbT.z, wbT.x); scene.add(wb);
  var wbGlow = new T.Mesh(new T.BoxGeometry(16.4, 0.12, 5), new T.MeshBasicMaterial({ color: PET })); wbGlow.position.copy(wb.position); wbGlow.position.y = 0.06; wbGlow.rotation.copy(wb.rotation); scene.add(wbGlow);

  // the main shed: columns, back wall, roof with glowing skylights
  var shed = new T.Group(); scene.add(shed);
  var colM = std(0x46525a, { metalness: 0.4, roughness: 0.5 });
  var cols = new T.InstancedMesh(new T.BoxGeometry(0.8, 13, 0.8), colM, 40), o = new T.Object3D(), k = 0;
  for (var x = -32; x <= 32; x += 8) [-14, 14].forEach(function (z) { o.position.set(x, 6.5, z); o.updateMatrix(); cols.setMatrixAt(k++, o.matrix); });
  cols.count = k; shed.add(cols);
  var wall = new T.Mesh(new T.BoxGeometry(65, 13, 0.6), std(0xffffff, { map: rib('#2b3439', '#20282c', 24), roughness: 0.7 })); wall.position.set(0, 6.5, -14.3); shed.add(wall);
  var roofM = std(0xffffff, { map: rib('#323c42', '#272f34', 30), roughness: 0.6, metalness: 0.3 });
  for (var r = 0; r < 4; r++) { var rf = new T.Mesh(new T.BoxGeometry(66, 0.5, 6.4), roofM); rf.position.set(0, 13.3 + (r % 2) * 0.6, -11 + r * 7.3); shed.add(rf);
    var sky = new T.Mesh(new T.BoxGeometry(64, 0.1, 0.8), new T.MeshBasicMaterial({ color: 0x6fc6d3 })); sky.position.set(0, 13.6 + (r % 2) * 0.6, -7.6 + r * 7.3); shed.add(sky); }
  // bays with material piles
  var bayCols = [0x8f989e, 0x9b7b55, 0x8a6a44, 0xd8d2c5, 0xf0efea, 0x6d7a52, 0xa8704a, 0x2d3439, 0x7f8a92, 0x5a4632];
  var conc = std(0x9a9890, { roughness: 0.95 });
  for (var b = 0; b <= 10; b++) { var dv = new T.Mesh(new T.BoxGeometry(0.6, 3.4, 8), conc); dv.position.set(-30 + b * 6, 1.7, -9.8); shed.add(dv); }
  bayCols.forEach(function (c, i) { var p = new T.Mesh(new T.DodecahedronGeometry(2.4, 1), std(c, { flatShading: true, roughness: 0.95 })); p.scale.set(1.05, 0.62, 1.4); p.position.set(-27 + i * 6, 0.3, -10.5); shed.add(p); });
  // sort line with material on it
  var belt = new T.Mesh(new T.BoxGeometry(44, 0.5, 2.2), std(0x1e2529)); belt.position.set(0, 2.6, 2); shed.add(belt);
  var beltEdge = new T.Mesh(new T.BoxGeometry(44, 0.15, 2.4), new T.MeshBasicMaterial({ color: PET })); beltEdge.position.set(0, 2.9, 2); shed.add(beltEdge);
  for (var lg = -20; lg <= 20; lg += 5) { var l2 = new T.Mesh(new T.BoxGeometry(0.3, 2.4, 2), colM); l2.position.set(lg, 1.2, 2); shed.add(l2); }
  var NB = 46, items = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.5, 0.8), new T.MeshStandardMaterial({ roughness: 0.8 }), NB), cl = new T.Color();
  for (var i = 0; i < NB; i++) items.setColorAt(i, cl.copy(C(bayCols[i % bayCols.length])));
  shed.add(items);

  // yard: bale stacks and containers
  var baleCols = [0x9b7b55, 0x8f989e, 0xf0efea, 0x8a6a44];
  var bales = new T.InstancedMesh(new T.BoxGeometry(1.6, 1.2, 1.2), new T.MeshStandardMaterial({ roughness: 0.9 }), 160); k = 0;
  for (var s = 0; s < 8; s++) for (var j = 0; j < 20; j++) { var bx = 38 + (s % 4) * 6 + (j % 3) * 1.7, bz = -22 + Math.floor(s / 4) * 9 + Math.floor(j / 9) * 1.3, by = 0.6 + (Math.floor(j / 3) % 3) * 1.22;
    o.position.set(bx, by, bz); o.rotation.set(0, 0, 0); o.updateMatrix(); bales.setMatrixAt(k, o.matrix); bales.setColorAt(k, cl.copy(C(baleCols[s % 4]))); k++; }
  bales.count = k; scene.add(bales);
  var cTex = rib('#ffffff', '#c9d1d4', 6);
  var conts = new T.InstancedMesh(new T.BoxGeometry(12.2, 2.6, 2.45), new T.MeshStandardMaterial({ map: cTex, roughness: 0.6, metalness: 0.2 }), 24); k = 0;
  var cc = [PET, DEEP, 0x6d777e, PET, 0x4f5a61, DEEP];
  for (var row = 0; row < 4; row++) for (var col = 0; col < 3; col++) for (var lv = 0; lv < 2; lv++) {
    if (k >= 24) break; o.position.set(-52 + col * 13, 1.3 + lv * 2.62, -30 + row * 3.2); o.updateMatrix(); conts.setMatrixAt(k, o.matrix); conts.setColorAt(k, cl.copy(C(cc[(row + col + lv) % 6]))); k++; }
  conts.count = k; scene.add(conts);

  // light towers
  var GLOW = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'); var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  [[-40, -24], [32, 22], [70, -30], [-70, 18]].forEach(function (p) {
    var pole = new T.Mesh(new T.CylinderGeometry(0.25, 0.35, 22, 8), colM); pole.position.set(p[0], 11, p[1]); scene.add(pole);
    var head = new T.Mesh(new T.BoxGeometry(2.4, 0.8, 0.6), new T.MeshBasicMaterial({ color: 0xe8f6f8 })); head.position.set(p[0], 22.2, p[1]); scene.add(head);
    var glow = new T.Sprite(new T.SpriteMaterial({ map: GLOW, color: 0x9fdce6, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(9, 9, 1); glow.position.copy(head.position); scene.add(glow);
  });

  // trucks on the loop road
  function truck(colr) {
    var g = new T.Group();
    var cab = new T.Mesh(new T.BoxGeometry(2.4, 2.6, 2.5), std(colr, { roughness: 0.45, metalness: 0.25 })); cab.position.set(3.2, 1.9, 0); g.add(cab);
    var ch = new T.Mesh(new T.BoxGeometry(8.2, 0.4, 2.2), std(0x1a1f22)); ch.position.set(0, 0.85, 0); g.add(ch);
    var tray = new T.Mesh(new T.BoxGeometry(5.6, 1.5, 2.5), std(0x7c868d, { metalness: 0.3, roughness: 0.6 })); tray.position.set(-1.1, 1.8, 0); g.add(tray);
    var hl = new T.Mesh(new T.BoxGeometry(0.1, 0.25, 1.9), new T.MeshBasicMaterial({ color: 0xfff6e0 })); hl.position.set(4.45, 1.0, 0); g.add(hl);
    scene.add(g); return g;
  }
  var trucks = [truck(PET), truck(0xe8e8e2), truck(DEEP)];

  // camera path: a slow orbit that dips toward the weighbridge and rises over the shed
  var camPath = new T.CatmullRomCurve3([[-95, 38, 80], [-20, 30, 95], [60, 34, 82], [110, 40, 20], [90, 46, -70], [10, 52, -95], [-80, 42, -70], [-120, 36, 10]].map(function (p) { return new T.Vector3(p[0] * 1.4, p[1] * 1.35 + 6, p[2] * 1.4); }), true, 'catmullrom', 0.5);
  var lookPath = new T.CatmullRomCurve3([[-10, 2, 10], [5, 4, 0], [20, 3, -5], [10, 2, -8], [-10, 3, -6], [-20, 2, 4]].map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }), true, 'catmullrom', 0.5);

  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', function (e) { var rr = host.getBoundingClientRect(); mouse.x = (e.clientX - rr.left) / rr.width - 0.5; mouse.y = (e.clientY - rr.top) / rr.height - 0.5; }, { passive: true });

  function size() { var w = canvas.clientWidth || host.clientWidth, h = canvas.clientHeight || host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  var LOOP = 90, start = performance.now(), cp = new T.Vector3(), lp = new T.Vector3(), tp = new T.Vector3(), tt = new T.Vector3();
  function frame(now) {
    var t = reduce ? 8 : Math.max(0, (now - start) / 1000), u = (t / LOOP) % 1;
    for (var i = 0; i < NB; i++) { var f = ((reduce ? 0 : t * 0.05) + i / NB) % 1; o.position.set(-21 + f * 42, 3.1, 2 + Math.sin(i * 1.7) * 0.5); o.rotation.set(0, i, 0); o.updateMatrix(); items.setMatrixAt(i, o.matrix); }
    items.instanceMatrix.needsUpdate = true;
    trucks.forEach(function (tr, i) { var q = ((reduce ? 0 : t * 0.012) + i / 3) % 1; road.getPointAt(q, tp); road.getTangentAt(q, tt); tr.position.set(tp.x, 0.1, tp.z); tr.rotation.y = Math.atan2(-tt.z, tt.x); });
    camPath.getPointAt(u, cp); lookPath.getPointAt(u, lp);
    mouse.sx += (mouse.x - mouse.sx) * 0.03; mouse.sy += (mouse.y - mouse.sy) * 0.03;
    var narrow = host.clientWidth < 900;
    cam.position.set(cp.x * (narrow ? 1.1 : 1) + mouse.sx * 6, cp.y - mouse.sy * 4, cp.z * (narrow ? 1.1 : 1));
    cam.lookAt(lp.x + (narrow ? 0 : -22), lp.y - (narrow ? 4 : 26), lp.z);
    renderer.render(scene, cam);
  }
  var running = false, raf = 0, visible = true;
  function loop(now) { frame(now); if (running) raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  size();
  if (window.ResizeObserver) new ResizeObserver(function () { size(); if (!running) frame(performance.now()); }).observe(host);
  else window.addEventListener('resize', size);
  if (reduce) { frame(performance.now()); return; }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.isIntersecting; if (visible && !document.hidden) play(); else stop(); }); }).observe(host);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) play(); });
  play();
})();
