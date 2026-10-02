/* Recycle Group home hero: mixed material sorts itself into twelve bales.
   Hovering a row in "What we recycle" lifts that material's bale. */
(function () {
  var host = document.querySelector('.hero.home');
  if (!host || !window.THREE) return;
  var T = window.THREE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'h3d';
  canvas.setAttribute('aria-hidden', 'true');
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  var shade = host.querySelector('.shade');
  host.insertBefore(canvas, shade || host.firstChild);
  host.classList.add('has3d');
  var vid = host.querySelector('.hvid'); if (vid) { try { vid.pause(); } catch (e) {} vid.removeAttribute('autoplay'); }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  var BG = 0x0E1114;
  var scene = new T.Scene();
  scene.background = new T.Color(BG);
  scene.fog = new T.Fog(BG, 13, 32);
  var cam = new T.PerspectiveCamera(36, 1, 0.1, 100);

  scene.add(new T.HemisphereLight(0xdfe8ea, 0x0b0d10, 0.85));
  var key = new T.DirectionalLight(0xffffff, 1.25); key.position.set(6, 11, 7); scene.add(key);
  var rim = new T.DirectionalLight(0x3B8493, 1.1); rim.position.set(-7, 5, -9); scene.add(rim);
  var fill = new T.PointLight(0x3B8493, 0.6, 18); fill.position.set(3, 2.5, 4); scene.add(fill);

  var mobile = function () { return host.clientWidth < 900; };
  var N = mobile() ? 48 : 96;

  // twelve streams, in the same order as the "What we recycle" panel
  var TYPES = [
    { g: new T.CylinderGeometry(0.05, 0.05, 0.26, 10), c: 0x8f989e, m: 0.65, r: 0.35, lie: 1 },   // metal
    { g: new T.CylinderGeometry(0.035, 0.035, 0.22, 10), c: 0xa8704a, m: 0.75, r: 0.3, lie: 1 },  // coloured metals
    { g: new T.BoxGeometry(0.25, 0.06, 0.2), c: 0x9b7b55, m: 0, r: 0.95 },                      // cardboard
    { g: new T.OctahedronGeometry(0.12), c: 0x6f9aa3, m: 0.1, r: 0.45 },                         // plastics
    { g: new T.BoxGeometry(0.23, 0.15, 0.18), c: 0xecebe6, m: 0, r: 1 },                         // polystyrene
    { g: new T.BoxGeometry(0.27, 0.045, 0.085), c: 0x8a6a44, m: 0, r: 0.85 },                    // timber
    { g: new T.IcosahedronGeometry(0.1, 0), c: 0x5d6a43, m: 0, r: 0.9 },                         // organics
    { g: new T.TetrahedronGeometry(0.13), c: 0x7f8a92, m: 0.2, r: 0.6 },                         // commingled
    { g: new T.BoxGeometry(0.27, 0.075, 0.19), c: 0xd6d0c4, m: 0, r: 0.9 },                      // mattresses
    { g: new T.DodecahedronGeometry(0.11), c: 0x4b3c2d, m: 0, r: 1 },                            // clean fill & soil
    { g: new T.BoxGeometry(0.18, 0.1, 0.14), c: 0x2d3439, m: 0.45, r: 0.4, e: 0x3B8493 },        // e-waste
    { g: new T.TorusGeometry(0.085, 0.036, 8, 18), c: 0x1d2125, m: 0.1, r: 0.75 }                // tyres
  ];

  var tmp = new T.Object3D(), qa = new T.Quaternion(), qb = new T.Quaternion(), ea = new T.Euler();
  var meshes = [], data = [];
  var hi = new Array(12).fill(0), hiT = new Array(12).fill(0), hover = -1;

  TYPES.forEach(function (ty, k) {
    var mat = new T.MeshStandardMaterial({ color: ty.c, metalness: ty.m, roughness: ty.r,
      emissive: ty.e || 0x3B8493, emissiveIntensity: ty.e ? 0.12 : 0 });
    var mesh = new T.InstancedMesh(ty.g, mat, N);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    scene.add(mesh); meshes.push(mesh);
    var arr = [];
    for (var i = 0; i < N; i++) {
      var a = Math.random() * Math.PI * 2, rad = 0.5 + Math.pow(Math.random(), 0.7) * 4.6;
      arr.push({
        a: a, rad: rad, y: 0.2 + Math.random() * 1.5, sp: 0.12 + Math.random() * 0.22,
        rx: Math.random() * 6.28, ry: Math.random() * 6.28, rz: Math.random() * 6.28,
        tx: (Math.random() - 0.5) * 1.6, ty: (Math.random() - 0.5) * 1.6,
        d: Math.random() * 0.38, yaw: (Math.random() - 0.5) * 0.25,
        cell: i
      });
    }
    data.push(arr);
  });

  // floor: faint grid and twelve bale pads
  var grid = new T.GridHelper(40, 40, 0x3B8493, 0x1a2126);
  grid.material.transparent = true; grid.material.opacity = 0.32; grid.position.y = -0.001; scene.add(grid);
  var padMat = new T.MeshBasicMaterial({ color: 0x3B8493, transparent: true, opacity: 0.0 });
  var pads = [];
  for (var p = 0; p < 12; p++) {
    var pad = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), padMat.clone());
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.002; scene.add(pad); pads.push(pad);
  }

  var layout = {};
  function doLayout() {
    var w = canvas.clientWidth || host.clientWidth, h = canvas.clientHeight || host.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    var m = mobile(), C = window.H3D || {};
    layout.cols = m ? 4 : (C.cols || 6);
    layout.gap = m ? 1.6 : (C.gap || 1.9);
    layout.cx = m ? 0 : (C.cx != null ? C.cx : 4);
    layout.cz = m ? -1.6 : (C.cz != null ? C.cz : -4);
    layout.cloud = m ? new T.Vector3(0, 0, -1.6) : new T.Vector3(C.clx != null ? C.clx : 4, 0, C.clz != null ? C.clz : -4);
    layout.camPos = m ? new T.Vector3(0, 4.6, 9) : new T.Vector3(-0.6, C.cy != null ? C.cy : 6.2, 14.5);
    layout.look = m ? new T.Vector3(0, 0.3, -1.8) : new T.Vector3(1.9, C.ly != null ? C.ly : -2, 0);
    cam.fov = m ? 40 : 36;
    cam.updateProjectionMatrix();
    var rows = Math.ceil(12 / layout.cols);
    for (var k = 0; k < 12; k++) {
      var col = k % layout.cols, row = Math.floor(k / layout.cols);
      var x = layout.cx + (col - (layout.cols - 1) / 2) * layout.gap;
      var z = layout.cz + (row - (rows - 1) / 2) * layout.gap;
      pads[k].position.x = x; pads[k].position.z = z;
      pads[k].userData = { x: x, z: z };
    }
  }

  function baleSpot(k, i, out) {
    var c = pads[k].userData, per = 5, s = 0.27;
    var lx = i % per, lz = Math.floor(i / per) % per, ly = Math.floor(i / (per * per));
    out.set(c.x + (lx - 2) * s, 0.09 + ly * (s * 0.62), c.z + (lz - 2) * s);
    return out;
  }

  // timeline: chaos → sort → hold → release, looping
  var start = performance.now();
  // one smooth sort after load, then the bales hold; no repeating burst
  function phase(t) {
    if (reduce) return 1;
    if (t < 1.4) return 0;
    return Math.min(1, (t - 1.4) / 5.5);
  }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width - 0.5); mouse.y = ((e.clientY - r.top) / r.height - 0.5);
  }, { passive: true });

  host.querySelectorAll('.mp-i').forEach(function (el, k) {
    el.addEventListener('mouseenter', function () { hover = k; });
    el.addEventListener('focus', function () { hover = k; });
    el.addEventListener('mouseleave', function () { hover = -1; });
    el.addEventListener('blur', function () { hover = -1; });
  });

  var P = 0, vPos = new T.Vector3(), vT = new T.Vector3(), vC = new T.Vector3();
  function frame(now) {
    var t = (now - start) / 1000;
    var target = phase(t);
    if (hover >= 0) target = 1;
    P += (target - P) * (hover >= 0 ? 0.06 : 0.035);
    for (var k = 0; k < 12; k++) { hiT[k] = hover === k ? 1 : 0; hi[k] += (hiT[k] - hi[k]) * 0.12; }
    var anyHi = hover >= 0 ? 1 : 0;

    for (k = 0; k < 12; k++) {
      var mesh = meshes[k], arr = data[k], lift = hi[k] * 0.55;
      for (var i = 0; i < arr.length; i++) {
        var d = arr[i];
        var e = ease((P - d.d) / 0.62); e = e * e * (3 - 2 * e);
        var ang = d.a + t * d.sp;
        vC.set(layout.cloud.x + Math.cos(ang) * d.rad, d.y + Math.sin(t * 0.35 + d.a) * 0.18, layout.cloud.z + Math.sin(ang) * d.rad * 0.45);
        baleSpot(k, d.cell, vT); vT.y += lift;
        vPos.copy(vC).lerp(vT, e);
        vPos.y += Math.sin(e * Math.PI) * 0.6;
        tmp.position.copy(vPos);
        ea.set(d.rx + t * d.tx * 0.45, d.ry + t * d.ty * 0.45, d.rz); qa.setFromEuler(ea);
        ea.set(TYPES[k].lie ? Math.PI / 2 : 0, d.yaw, TYPES[k].lie ? Math.PI / 2 : 0); qb.setFromEuler(ea);
        tmp.quaternion.copy(qa).slerp(qb, e);
        var sc = 1 + hi[k] * 0.06; tmp.scale.set(sc, sc, sc);
        tmp.updateMatrix(); mesh.setMatrixAt(i, tmp.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      var dim = anyHi ? (1 - 0.55 * (1 - hi[k])) : 1;
      mesh.material.color.setHex(TYPES[k].c).multiplyScalar(dim);
      mesh.material.emissiveIntensity = (TYPES[k].e ? 0.12 : 0) + hi[k] * 0.35;
      pads[k].material.opacity = 0.05 * P + hi[k] * 0.22;
    }

    mouse.sx += (mouse.x - mouse.sx) * 0.025; mouse.sy += (mouse.y - mouse.sy) * 0.025;
    cam.position.set(layout.camPos.x + mouse.sx * 0.8 + Math.sin(t * 0.06) * 0.35, layout.camPos.y - mouse.sy * 0.4, layout.camPos.z);
    cam.lookAt(layout.look);
    renderer.render(scene, cam);
  }

  var running = false, raf = 0, visible = true;
  function loop(now) { frame(now); if (running) raf = requestAnimationFrame(loop); }
  function play() { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  doLayout();
  if (window.ResizeObserver) new ResizeObserver(function () { doLayout(); if (!running) frame(performance.now()); }).observe(host);
  else window.addEventListener('resize', doLayout);

  if (reduce) { P = 1; frame(performance.now()); host.querySelectorAll('.mp-i').forEach(function (el) { el.addEventListener('mouseenter', function () { requestAnimationFrame(function () { for (var j = 0; j < 20; j++) frame(performance.now()); }); }); }); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.isIntersecting; if (visible && !document.hidden) play(); else stop(); }); }).observe(host);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) play(); });
  play();
})();
