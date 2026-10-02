/* Case-study scale scenes: each headline number rebuilt at real size in 3D.
   <div data-s3d="port|council|developer|tunnel|steel"> gets a canvas. */
(function () {
  if (!window.THREE) return;
  var T = window.THREE;
  var els = document.querySelectorAll('[data-s3d]');
  if (!els.length) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PET = 0x3B8493, DEEP = 0x1F5561, STEEL = 0x8f989e, INK = 0x0E1114;

  function ease(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function outBack(x) { x = Math.max(0, Math.min(1, x)); var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function std(c, o) { o = o || {}; o.color = new T.Color(c).convertSRGBToLinear(); if (o.roughness == null) o.roughness = 0.75; return new T.MeshStandardMaterial(o); }
  function ribTex(base, line) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 64; var x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 256, 64);
    for (var i = 0; i < 256; i += 8) { x.fillStyle = line; x.fillRect(i, 0, 3, 64); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; return t;
  }
  function person() {
    var g = new T.Group(), m = std(INK);
    var body = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.45, 12), m); body.position.y = 0.73; g.add(body);
    var head = new T.Mesh(new T.SphereGeometry(0.14, 16, 12), m); head.position.y = 1.62; g.add(head);
    return g;
  }
  function ground(scene, r) {
    var g = new T.Mesh(new T.CircleGeometry(r * 5, 64), new T.MeshBasicMaterial({ color: 0xe4e3dd }));
    g.rotation.x = -Math.PI / 2; scene.add(g);
    var grid = new T.GridHelper(r * 2, Math.round(r * 2 / Math.max(1, Math.round(r / 12))), 0xcfcdc5, 0xd9d8d2);
    grid.position.y = 0.01; scene.add(grid);
  }

  var BUILD = {
    // 250,000 mattresses laid flat across the MCG playing surface
    mcg: function (scene) {
      ground(scene, 150);
      var A = 86, B = 74;
      function ell(a, b) { var sh = new T.Shape(); sh.absellipse(0, 0, a, b, 0, Math.PI * 2, false, 0); return sh; }
      var field = new T.Mesh(new T.ShapeGeometry(ell(A, B), 64), std(0x5f7a4a, { roughness: 1 })); field.rotation.x = -Math.PI / 2; field.position.y = 0.05; scene.add(field);
      [[4, 16, 7], [18, 32, 15], [32, 46, 24]].forEach(function (tr, i) {
        var sh = ell(A + tr[1], B + tr[1]); sh.holes.push(ell(A + tr[0], B + tr[0]));
        var g = new T.ExtrudeGeometry(sh, { depth: tr[2], bevelEnabled: false, curveSegments: 72 });
        var m = new T.Mesh(g, [std(i === 2 ? 0x9a9ea3 : 0x8a8f95, { roughness: 0.9 }), std(0x6d7278, { roughness: 0.9 })]); m.rotation.x = -Math.PI / 2; scene.add(m);
      });
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + 0.5, pole = new T.Mesh(new T.CylinderGeometry(0.8, 1.2, 70, 8), std(0x7c868d)); pole.position.set(Math.cos(a) * (A + 52), 35, Math.sin(a) * (B + 52)); scene.add(pole);
        var hd = new T.Mesh(new T.BoxGeometry(9, 5, 2), std(0x5b6770)); hd.position.set(pole.position.x, 71, pole.position.z); hd.lookAt(0, 71, 0); scene.add(hd); }
      var c = document.createElement('canvas'); c.width = 64; c.height = 256; var x = c.getContext('2d');
      for (var k = 0; k < 256; k += 8) { x.fillStyle = (k / 8) % 2 ? '#efe9dc' : '#b3a994'; x.fillRect(0, k, 64, 8); }
      var tex = new T.CanvasTexture(c); tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(0.02, 40 / 32); tex.encoding = T.sRGBEncoding;
      var mass = new T.Mesh(new T.ExtrudeGeometry(ell(A - 1.5, B - 1.5), { depth: 1, bevelEnabled: false, curveSegments: 72 }),
        [std(0xe3d9c6, { roughness: 0.95 }), new T.MeshStandardMaterial({ map: tex, roughness: 0.95 })]);
      mass.rotation.x = -Math.PI / 2; mass.position.y = 0.06; mass.scale.z = 0.001; scene.add(mass);
      return { r: 115, el: 0.62, look: new T.Vector3(0, 6, 0), ang: 0.6, dur: 5,
        update: function (t) { var k = ease((t - 0.5) / 3.6); mass.scale.z = Math.max(0.001, k * 9.9); } };
    },
    // 41,580 m³ of loose polystyrene = 17 Olympic pools
    pools: function (scene) {
      ground(scene, 190);
      var rim = std(0x7c8187, { roughness: 0.9 }), foamM = std(0xf1f0ea, { roughness: 1 }), fills = [], fe = new T.LineBasicMaterial({ color: 0x3B8493 });
      for (var i = 0; i < 17; i++) {
        var gx = i % 6, gz = Math.floor(i / 6), x = -165 + gx * 66, z = -32 + gz * 32;
        [[0, 13.1, 52, 0.6], [0, -13.1, 52, 0.6], [25.7, 0, 0.6, 26.8], [-25.7, 0, 0.6, 26.8]].forEach(function (r) { var b = new T.Mesh(new T.BoxGeometry(r[2], 2.2, r[3]), rim); b.position.set(x + r[0], 1.1, z + r[1]); scene.add(b); });
        var water = new T.Mesh(new T.BoxGeometry(50, 0.1, 25), std(0x3B8493, { roughness: 0.3 })); water.position.set(x, 0.05, z); scene.add(water);
        var f = new T.Mesh(new T.BoxGeometry(50, 2, 25), foamM); f.position.set(x, 0, z); f.scale.y = 0.001; f.add(new T.LineSegments(new T.EdgesGeometry(f.geometry), fe)); scene.add(f); fills.push(f);
      }
      return { r: 125, el: 0.62, look: new T.Vector3(0, 0, 0), ang: 0.4, dur: 5,
        update: function (t) { fills.forEach(function (f, i) { var k = ease((t - 0.3 - i * 0.18) / 0.7); f.scale.y = Math.max(0.001, k); f.position.y = k; }); } };
    },
    // 126 t = four 40-ft containers at max gross weight (30.48 t each)
    port: function (scene) {
      ground(scene, 26);
      var L = 12.19, H = 2.59, W = 2.44, boxes = [];
      var cols = [['#3B8493', '#2f6f7c'], ['#1F5561', '#18464f'], ['#7c868d', '#68727a'], ['#3B8493', '#2f6f7c']];
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (p, i) {
        var tex = ribTex(cols[i][0], cols[i][1]); tex.repeat.set(6, 1);
        var side = std(0xffffff, { map: tex, roughness: 0.6, metalness: 0.2 });
        var end = std(new T.Color(cols[i][1]).getHex(), { roughness: 0.6 });
        var m = new T.Mesh(new T.BoxGeometry(L, H, W), [end, end, std(new T.Color(cols[i][0]).getHex()), end, side, side]);
        m.userData.y = H / 2 + p[1] * H; m.userData.z = (p[0] - 0.5) * (W + 0.15); m.position.set(0, 40, m.userData.z);
        scene.add(m); boxes.push(m);
      });
      var man = person(); man.position.set(L / 2 + 2.2, 0, 2.2); scene.add(man);
      return { r: 8.5, el: 0.42, look: new T.Vector3(0.6, 2.2, 0), ang: 0.9, dur: 4,
        update: function (t) { boxes.forEach(function (m, i) { var k = outBack((t - 0.3 - i * 0.55) / 0.9); m.position.y = m.userData.y + (1 - k) * 22; m.visible = t > 0.3 + i * 0.55; }); } };
    },
    // 2,744 mattresses + 1,650 couches, stacked
    council: function (scene) {
      ground(scene, 46);
      var mg = new T.BoxGeometry(1.53, 0.26, 2.03), cg = new T.BoxGeometry(2.0, 0.85, 0.9);
      var mm = new T.InstancedMesh(mg, std(0xd8d2c5, { roughness: 0.95 }), 2744);
      var cm = new T.InstancedMesh(cg, std(0x6b5a4a, { roughness: 0.9 }), 1650);
      var o = new T.Object3D(), mats = [], cous = [];
      for (var i = 0; i < 2744; i++) { var s = Math.floor(i / 14), lvl = i % 14, gx = s % 14, gz = Math.floor(s / 14); mats.push([-24 + gx * 1.75, 0.13 + lvl * 0.26, -12 + gz * 2.25, lvl]); }
      for (i = 0; i < 1650; i++) { s = Math.floor(i / 6); lvl = i % 6; gx = s % 15; gz = Math.floor(s / 15); cous.push([3 + gx * 2.15, 0.425 + lvl * 0.85, -12 + gz * 1.25, lvl]); }
      scene.add(mm); scene.add(cm);
      var man = person(); man.position.set(-26.5, 0, 14); scene.add(man);
      function place(mesh, arr, t, lv) { arr.forEach(function (a, j) { var k = ease((t - 0.2 - a[3] / lv * 1.8) / 0.6); o.position.set(a[0], a[1] * k, a[2]); o.scale.set(1, Math.max(0.001, k), 1); o.updateMatrix(); mesh.setMatrixAt(j, o.matrix); }); mesh.instanceMatrix.needsUpdate = true; }
      return { r: 30, el: 0.62, look: new T.Vector3(4, 1, 3), ang: 0.65, dur: 3.2,
        update: function (t) { place(mm, mats, t, 14); place(cm, cous, t, 6); } };
    },
    // 60,000 m³ = 24 Olympic pools; 8 returned as landscaping
    developer: function (scene) {
      ground(scene, 240);
      var rim = std(0xbdbbb4, { roughness: 0.9 }), soilM = std(0x5a4632, { roughness: 1 }), greenM = std(0x6d7a52, { roughness: 1 });
      var soils = [];
      for (var i = 0; i < 24; i++) {
        var gx = i % 4, gz = Math.floor(i / 4), x = -99 + gx * 66, z = -80 + gz * 32;
        var frame = new T.Group();
        [[0, 13.1, 52, 0.6], [0, -13.1, 52, 0.6], [25.7, 0, 0.6, 26.8], [-25.7, 0, 0.6, 26.8]].forEach(function (r) { var b = new T.Mesh(new T.BoxGeometry(r[2], 2.2, r[3]), rim); b.position.set(r[0], 1.1, r[1]); frame.add(b); });
        frame.position.set(x, 0, z); scene.add(frame);
        var soil = new T.Mesh(new T.BoxGeometry(50, 2, 25), i < 8 ? soilM.clone() : soilM); soil.position.set(x, 0, z); soil.scale.y = 0.001; scene.add(soil);
        soils.push(soil);
      }
      return { r: 150, el: 0.82, look: new T.Vector3(0, 0, 0), ang: 0.35, dur: 5,
        update: function (t) { soils.forEach(function (s, i) { var k = ease((t - 0.2 - i * 0.12) / 0.7); s.scale.y = Math.max(0.001, k); s.position.y = k; if (i < 8) { var g = ease((t - 4.2 - i * 0.08) / 0.6); s.material.color.copy(soilM.color).lerp(greenM.color, g); } }); } };
    },
    // three 40-ft containers of loose EPS densified into one block
    tunnel: function (scene) {
      ground(scene, 24);
      var L = 12.19, H = 2.59, W = 2.44, N = 900, geo = new T.BoxGeometry(0.55, 0.38, 0.45);
      var foam = new T.InstancedMesh(geo, std(0xf2f1ec, { roughness: 1 }), N), o = new T.Object3D(), pts = [];
      var glass = new T.MeshStandardMaterial({ color: 0x9fb8bd, transparent: true, opacity: 0.12, roughness: 0.2, depthWrite: false });
      var edge = new T.LineBasicMaterial({ color: DEEP });
      [-1, 0, 1].forEach(function (k) {
        var b = new T.Mesh(new T.BoxGeometry(L, H, W), glass); b.position.set(-3, H / 2, k * 3.1); scene.add(b);
        var e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(L, H, W)), edge); e.position.copy(b.position); scene.add(e);
      });
      for (var i = 0; i < N; i++) { var c = i % 3; pts.push([-3 + (Math.random() - 0.5) * (L - 0.6), 0.25 + Math.random() * (H - 0.5), (c - 1) * 3.1 + (Math.random() - 0.5) * (W - 0.5), Math.random() * 6, Math.random() * 6, Math.random()]); }
      scene.add(foam);
      var block = new T.Mesh(new T.BoxGeometry(0.7, 0.85, 0.7), std(0xdedcd3, { roughness: 0.55 })); block.position.set(8.2, 0.425, 0); scene.add(block);
      var man = person(); man.position.set(9.4, 0, 0.9); scene.add(man);
      var target = new T.Vector3(8.2, 0.45, 0);
      return { r: 10.5, el: 0.5, look: new T.Vector3(0.2, 1.2, 0), ang: 0.75, dur: 8, loop: 9,
        update: function (t) {
          var u = t % 9;
          pts.forEach(function (p, j) { var k = ease((u - 2.2 - p[5] * 1.6) / 1.4);
            o.position.set(p[0] + (target.x - p[0]) * k, p[1] + (target.y - p[1]) * k + Math.sin(k * Math.PI) * 3, p[2] + (target.z - p[2]) * k);
            o.rotation.set(p[3] * (1 - k), p[4] * (1 - k), 0); var s = 1 - k * 0.97; o.scale.set(s, s, s); o.updateMatrix(); foam.setMatrixAt(j, o.matrix); });
          foam.instanceMatrix.needsUpdate = true;
          var b = ease((u - 2.6) / 2.6) * (1 - ease((u - 8.3) / 0.5)); block.scale.setScalar(Math.max(0.001, b)); block.position.y = 0.425 * b;
        } };
    },
    // 250 t of steel as one solid block (7.85 t/m³ → 3.17 m a side)
    steel: function (scene) {
      ground(scene, 12);
      var side = Math.cbrt(250 / 7.85), n = 6, s = side / n, N = n * n * n;
      var inst = new T.InstancedMesh(new T.BoxGeometry(s * 0.97, s * 0.97, s * 0.97), std(0x9aa3a8, { metalness: 0.85, roughness: 0.35 }), N), o = new T.Object3D(), cells = [];
      for (var i = 0; i < N; i++) { var x = i % n, z = Math.floor(i / n) % n, y = Math.floor(i / (n * n)); cells.push([-side / 2 + (x + 0.5) * s, (y + 0.5) * s, -side / 2 + (z + 0.5) * s, y, Math.random()]); }
      scene.add(inst);
      var man = person(); man.position.set(side / 2 + 1.1, 0, side / 2 - 0.4); scene.add(man);
      return { r: 3.4, el: 0.32, look: new T.Vector3(0.4, 1.5, 0), ang: 0.7, dur: 4,
        update: function (t) { cells.forEach(function (c, j) { var k = ease((t - 0.2 - c[3] * 0.45 - c[4] * 0.35) / 0.55); o.position.set(c[0], c[1] + (1 - k) * 9, c[2]); o.scale.setScalar(Math.max(0.001, k)); o.updateMatrix(); inst.setMatrixAt(j, o.matrix); }); inst.instanceMatrix.needsUpdate = true; } };
    }
  };

  function init(host) {
    var kind = host.getAttribute('data-s3d'); if (!BUILD[kind]) return null;
    var canvas = document.createElement('canvas'); canvas.className = 's3d-c'; canvas.setAttribute('aria-hidden', 'true');
    var r; try { r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return null; }
    if (!r.getContext()) return null;
    host.appendChild(canvas); host.classList.add('has3d');
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping;
    var scene = new T.Scene();
    scene.add(new T.HemisphereLight(0xffffff, 0x9d9b93, 0.45));
    var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(30, 60, 40); scene.add(key);
    var rim = new T.DirectionalLight(PET, 0.45); rim.position.set(-40, 20, -30); scene.add(rim);
    var cfg = BUILD[kind](scene);
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 2000);
    var t0 = null, running = false, done = false;
    function size() { var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = reduce ? 30 : (now - t0) / 1000;
      cfg.update(cfg.loop ? t : Math.min(t, cfg.dur + 1));
      var a = cfg.ang + (reduce ? 0 : Math.sin(t * 0.18) * 0.22);
      var vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
      var d = cfg.r / Math.sin(Math.min(vf, hf) / 2) * 0.92;
      cam.position.set(cfg.look.x + Math.sin(a) * Math.cos(cfg.el) * d, cfg.look.y + Math.sin(cfg.el) * d, cfg.look.z + Math.cos(a) * Math.cos(cfg.el) * d);
      cam.near = d / 50; cam.far = d * 6; cam.updateProjectionMatrix();
      if (!scene.fog) scene.fog = new T.Fog(0xe7e6e0, d * 1.7, d * 3.6);
      cam.lookAt(cfg.look);
      r.render(scene, cam);
      if (running) requestAnimationFrame(frame);
    }
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(host);
    return {
      play: function () { if (running) return; t0 = null; running = !reduce; if (reduce) { frame(performance.now()); return; } requestAnimationFrame(frame); },
      stop: function () { running = false; }
    };
  }

  var made = new Map();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      var h = en.target, inst = made.get(h);
      if (en.isIntersecting) { if (inst === undefined) { inst = init(h); made.set(h, inst); } if (inst) inst.play(); }
      else if (inst) inst.stop();
    });
  }, { rootMargin: '120px 0px', threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
})();
