/* Materials page: a mattress pulled apart layer by layer as you scroll. */
(function () {
  var sec = document.querySelector('[data-mx3d]');
  if (!sec || !window.THREE) return;
  var T = window.THREE;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = sec.querySelector('.mx-c'), stage = sec.querySelector('.mx-stage');
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  sec.classList.add('has3d');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;

  var scene = new T.Scene();
  var cam = new T.PerspectiveCamera(32, 1, 0.05, 60);
  // studio environment: a dark room with three soft boxes, prefiltered for image-based lighting
  (function () {
    var env = new T.Scene(), room = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ color: 0x1a1f23, side: T.BackSide })); env.add(room);
    function box(w, h, x, y, z, c, k) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); }
    box(12, 4, 0, 14, 2, 0xffffff, 3.2); box(5, 8, 12, 4, 8, 0xf4f1ea, 2.2); box(6, 6, -12, 3, -9, 0xbb9982, 1.6);
    var pm = new T.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.035).texture; pm.dispose();
  })();
  scene.add(new T.HemisphereLight(0xf2f4f3, 0x1b2024, 0.25));
  var key = new T.DirectionalLight(0xfffaf2, 1.35); key.position.set(3.5, 7, 4.5); scene.add(key);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0006;
  var sc = key.shadow.camera; sc.left = -2.4; sc.right = 2.4; sc.top = 2.4; sc.bottom = -2.4; sc.near = 1; sc.far = 18;
  var rim = new T.DirectionalLight(0x8F603F, 0.9); rim.position.set(-5, 3, -6); scene.add(rim);

  var W = 1.53, L = 2.03;
  function quilt() {
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var x = c.getContext('2d'); x.fillStyle = '#e6e1d6'; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = 'rgba(110,100,85,.38)'; x.lineWidth = 3;
    for (var i = -512; i < 1024; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 512, 512); x.stroke(); x.beginPath(); x.moveTo(i, 512); x.lineTo(i + 512, 0); x.stroke(); }
    x.fillStyle = 'rgba(95,85,70,.5)';
    for (var a = 0; a < 512; a += 64) for (var b = 0; b < 512; b += 64) { x.beginPath(); x.arc(a + 32, b, 3.2, 0, 6.3); x.fill(); }
    for (var n = 0; n < 9000; n++) { x.fillStyle = 'rgba(80,70,60,' + (Math.random() * 0.05) + ')'; x.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 4); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return t;
  }
  function foamTex() {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'); x.fillStyle = '#efe4c6'; x.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 2200; i++) { x.fillStyle = 'rgba(160,140,95,' + (Math.random() * 0.18) + ')'; x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 5); t.encoding = T.sRGBEncoding; return t;
  }
  var QT = quilt(), FT = foamTex();
  function std(o) { return new T.MeshStandardMaterial(o); }
  function box(w, h, d, mat, y) { var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.y = y; return m; }

  var groups = {};
  var root = new T.Group(); scene.add(root);
  function grp(name) { var g = new T.Group(); g.userData = { mats: [] }; root.add(g); groups[name] = g; return g; }
  function reg(g, m) { g.userData.mats.push(m.material); g.add(m); return m; }

  // timber base
  var gT = grp('timber'), wood = std({ color: 0x9c7a4f, roughness: 0.78, envMapIntensity: 0.5 });
  [-1, 1].forEach(function (s) { reg(gT, box(0.07, 0.18, L, wood.clone(), 0.09)).position.x = s * (W / 2 - 0.035); });
  [-1, 1].forEach(function (s) { reg(gT, box(W, 0.18, 0.07, wood.clone(), 0.09)).position.z = s * (L / 2 - 0.035); });
  for (var i = 0; i < 7; i++) reg(gT, box(W - 0.02, 0.025, 0.09, wood.clone(), 0.19)).position.z = -L / 2 + 0.2 + i * (L - 0.4) / 6;

  // fabric: top and bottom ticking + side border
  var gF = grp('fabric');
  var tickMat = std({ color: 0xffffff, map: QT, bumpMap: QT, bumpScale: 0.012, roughness: 0.92, envMapIntensity: 0.6 });
  var topT = reg(gF, box(W, 0.02, L, tickMat.clone(), 0.53));
  var botT = reg(gF, box(W, 0.012, L, std({ color: 0xcfc8ba, roughness: 1 }), 0.206));
  var side = std({ color: 0xd9d3c7, roughness: 1, side: T.DoubleSide });
  var sides = [];
  [[0, L / 2, W, 0], [0, -L / 2, W, 0], [W / 2, 0, L, 1], [-W / 2, 0, L, 1]].forEach(function (s) {
    var m = reg(gF, new T.Mesh(new T.PlaneGeometry(s[2], 0.31), side.clone()));
    m.position.set(s[0], 0.365, s[1]); if (s[3]) m.rotation.y = Math.PI / 2; m.userData.out = new T.Vector3(Math.sign(s[0]), 0, Math.sign(s[1])); sides.push(m);
  });

  // foam and fibre
  var gO = grp('foam');
  var comfort = reg(gO, box(W - 0.02, 0.085, L - 0.02, std({ color: 0xffffff, map: FT, roughness: 1 }), 0.475));
  var fibre = reg(gO, box(W - 0.03, 0.016, L - 0.03, std({ color: 0xb9b2a4, roughness: 1 }), 0.424));
  var botFoam = reg(gO, box(W - 0.02, 0.03, L - 0.02, std({ color: 0xffffff, map: FT, roughness: 1 }), 0.228));

  // spring unit: Bonnell coils + border wire
  var gS = grp('steel');
  class Helix extends T.Curve {
    getPoint(t, o) {
      o = o || new T.Vector3(); var turns = 5, r = 0.056 * (0.62 + 0.38 * Math.abs(2 * t - 1));
      var a = t * turns * Math.PI * 2; return o.set(Math.cos(a) * r, t * 0.16, Math.sin(a) * r);
    }
  }
  var steelMat = std({ color: 0xc3cacd, metalness: 1, roughness: 0.26, envMapIntensity: 1.25, emissive: 0x8F603F, emissiveIntensity: 0 });
  var coilG = new T.TubeGeometry(new Helix(), 120, 0.0036, 6, false);
  var CX = 10, CZ = 13, coils = new T.InstancedMesh(coilG, steelMat, CX * CZ);
  var o3 = new T.Object3D(), k = 0;
  for (var a = 0; a < CX; a++) for (var b = 0; b < CZ; b++) {
    o3.position.set(-W / 2 + (a + 0.5) * W / CX, 0.245, -L / 2 + (b + 0.5) * L / CZ); o3.updateMatrix(); coils.setMatrixAt(k++, o3.matrix);
  }
  gS.add(coils); gS.userData.mats.push(steelMat);
  [0.247, 0.403].forEach(function (y) {
    [[0, L / 2 - 0.02, W - 0.04, 0], [0, -L / 2 + 0.02, W - 0.04, 0], [W / 2 - 0.02, 0, L - 0.04, 1], [-W / 2 + 0.02, 0, L - 0.04, 1]].forEach(function (s) {
      var m = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, s[2], 6), steelMat);
      m.rotation.z = Math.PI / 2; if (s[3]) { m.rotation.z = 0; m.rotation.x = Math.PI / 2; }
      m.position.set(s[0], y, s[1]); gS.add(m);
    });
  });

  root.position.y = -0.2;
  root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256; var x = c.getContext('2d');
    var gr = x.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(238,241,243,.10)'); gr.addColorStop(.55, 'rgba(187,153,130,.04)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    var glow = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = -0.201; scene.add(glow);
    var fl = new T.Mesh(new T.PlaneGeometry(9, 9), new T.ShadowMaterial({ opacity: 0.32 })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.2; fl.receiveShadow = true; scene.add(fl);
  })();

  // labels pinned to parts
  var tags = {};
  sec.querySelectorAll('.mx-tag').forEach(function (el) { tags[el.getAttribute('data-g')] = el; });
  var anchors = { fabric: new T.Vector3(W / 2, 0.55, -L / 2), foam: new T.Vector3(W / 2, 0.48, -L / 2), steel: new T.Vector3(W / 2, 0.36, -L / 2), timber: new T.Vector3(W / 2, 0.1, -L / 2) };

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  var steps = sec.querySelectorAll('.mx-step'), dots = sec.querySelectorAll('.mx-dot'), NS = steps.length;
  var S = reduce ? NS - 1 : 0, Sv = S, cur = -1;

  function size() {
    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  var v = new T.Vector3();
  function render() {
    var s = Sv;
    var e1 = ease(s - 0.35), e2 = ease(s - 1.35), e3 = ease(s - 2.35), e4 = ease(s - 3.35), e5 = ease(s - 4.35);
    // fabric off
    topT.position.y = 0.53 + e1 * 0.95; botT.position.y = 0.206 - e1 * 0.62;
    sides.forEach(function (m) { m.position.x = m.userData.out.x * (W / 2 + e1 * 0.55); m.position.z = m.userData.out.z * (L / 2 + e1 * 0.55); m.position.y = 0.365 + e1 * 0.25; });
    // foam and fibre
    comfort.position.y = 0.475 + e1 * 0.25 + e2 * 0.45; fibre.position.y = 0.424 + e1 * 0.18 + e2 * 0.28; botFoam.position.y = 0.228 - e1 * 0.1 - e2 * 0.3;
    // steel lifts and turns
    gS.position.y = e3 * 0.12; gS.rotation.y = e3 * 0.0;
    // timber drops and spreads
    root.position.y = -0.2 + e4 * 0.55; gT.position.y = -e4 * 0.55; gT.children.forEach(function (m, i) { if (i < 2) m.position.x = (i ? 1 : -1) * (W / 2 - 0.035 + e4 * 0.22); });
    // focus
    var focus = s < 0.6 || s > 4.6 ? null : ['fabric', 'foam', 'steel', 'timber'][Math.max(0, Math.min(3, Math.round(s) - 1))];
    Object.keys(groups).forEach(function (n) {
      var on = !focus || focus === n;
      groups[n].userData.mats.forEach(function (m) {
        if (!m.userData.base) m.userData.base = m.color.clone();
        m.userData.k = m.userData.k == null ? 1 : m.userData.k;
        m.userData.k += ((on ? 1 : 0.28) - m.userData.k) * 0.15;
        m.color.copy(m.userData.base).multiplyScalar(m.userData.k);
        if (m.emissive) { m.emissive.setHex(0x8F603F); m.emissiveIntensity += (((focus === n) ? (n === 'steel' ? 0.35 : 0.1) : 0) - m.emissiveIntensity) * 0.15; }
      });
    });
    sides.forEach(function (m) { m.material.transparent = true; m.material.depthWrite = e1 < 0.3; m.material.opacity = 1 - e1; m.visible = e1 < 0.98; });
    // camera
    var ang = 0.75 + s * 0.22, dist = 4.5 + e1 * 1.0 + e4 * 0.35 + e5 * 0.45 + (stage.clientWidth < 700 ? 1.6 : 0), el = 0.62 - e5 * 0.1;
    cam.position.set(Math.sin(ang) * dist, 0.35 + dist * el * 0.55, Math.cos(ang) * dist);
    cam.lookAt(0, 0.3 + e1 * 0.12 + e4 * 0.25, 0);
    renderer.render(scene, cam);
    // tags
    var r = stage.getBoundingClientRect(), best = null, bx = 9;
    [[-W / 2, L / 2], [W / 2, L / 2], [-W / 2, -L / 2], [W / 2, -L / 2]].forEach(function (c) { v.set(c[0], 0.3, c[1]).project(cam); if (v.x < bx) { bx = v.x; best = c; } });
    Object.keys(tags).forEach(function (n) {
      var g = groups[n], el2 = tags[n]; if (!g) return;
      var y = n === 'fabric' ? topT.position.y + 0.02 : n === 'foam' ? comfort.position.y : n === 'steel' ? 0.33 + gS.position.y : 0.12 + gT.position.y;
      v.set(best[0] * 1.02, y + root.position.y, best[1] * 1.02).project(cam);
      var px = Math.max((v.x + 1) / 2 * r.width, el2.offsetWidth + 6);
      el2.style.transform = 'translate(' + px + 'px,' + ((1 - v.y) / 2 * r.height) + 'px) translateX(-100%)';
      var show = { fabric: e1, foam: e2, steel: e3, timber: e4 }[n];
      el2.style.opacity = show > 0.5 ? 1 : 0; el2.classList.toggle('on', focus === n);
    });
  }

  function progress() {
    var r = sec.getBoundingClientRect(), span = sec.offsetHeight - window.innerHeight;
    return Math.max(0, Math.min(1, -r.top / Math.max(1, span)));
  }
  function setStep(n) {
    if (n === cur) return; cur = n;
    steps.forEach(function (el, i) { el.classList.toggle('on', i === n); });
    dots.forEach(function (el, i) { el.classList.toggle('on', i === n); });
  }
  var running = false, settle = 40;
  function tick() {
    if (!reduce) S = progress() * (NS - 0.001);
    var dS = S - Sv; Sv += dS * 0.12;
    setStep(Math.min(NS - 1, Math.floor(S)));
    if (Math.abs(dS) > 0.0004) settle = 40;
    if (settle > 0) { settle--; render(); }
    if (running) requestAnimationFrame(tick);
  }
  size();
  if (window.ResizeObserver) new ResizeObserver(function () { size(); render(); }).observe(stage);
  if (reduce) { sec.classList.add('still'); Sv = S; setStep(NS - 1); render(); return; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { if (!running) { running = true; requestAnimationFrame(tick); } } else running = false; }); }, { rootMargin: '200px 0px' }).observe(sec);
  } else { running = true; requestAnimationFrame(tick); }
  render();
})();
