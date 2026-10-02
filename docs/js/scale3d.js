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

  var VT = new T.Vector3();
  function tag(host, text, cls) { var e = document.createElement('span'); e.className = 's3d-tag' + (cls ? ' ' + cls : ''); e.textContent = text; host.appendChild(e); return e; }
  function lin(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function truck(col) {
    var g = new T.Group(), body = new T.Group(); g.add(body);
    var cab = new T.Mesh(new T.BoxGeometry(2.4, 2.6, 2.5), std(col || PET, { roughness: 0.5, metalness: 0.2 })); cab.position.set(3.2, 1.9, 0); body.add(cab);
    var win = new T.Mesh(new T.BoxGeometry(0.05, 0.9, 2.1), std(0x1a2226, { roughness: 0.2, metalness: 0.6 })); win.position.set(4.42, 2.5, 0); body.add(win);
    var ch = new T.Mesh(new T.BoxGeometry(8.2, 0.4, 2.2), std(0x2a3034)); ch.position.set(0, 0.85, 0); body.add(ch);
    var piv = new T.Group(); piv.position.set(-3.9, 1.1, 0); body.add(piv);
    var tray = new T.Mesh(new T.BoxGeometry(5.6, 1.5, 2.5), std(0x7c868d, { roughness: 0.6, metalness: 0.3 })); tray.position.set(2.8, 0.75, 0); piv.add(tray);
    var wm = std(0x15191c, { roughness: 0.9 });
    [[-3.1, 1.15], [-3.1, -1.15], [-1.9, 1.15], [-1.9, -1.15], [3.1, 1.15], [3.1, -1.15]].forEach(function (w) { var m = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.4, 16), wm); m.rotation.x = Math.PI / 2; m.position.set(w[0], 0.55, w[1]); body.add(m); });
    g.userData.tray = piv; return g;
  }

  var BUILD = {
    // Transfer station: a truck weighed in, tipped into a bay, weighed out
    transfer: function (scene, host) {
      ground(scene, 46);
      var conc = std(0xb9b7b0, { roughness: 0.95 }), dark = std(0x3b4246, { roughness: 0.8 });
      var wb = new T.Mesh(new T.BoxGeometry(14, 0.35, 3.8), dark); wb.position.set(-12, 0.17, 8); scene.add(wb);
      [-1, 1].forEach(function (s) { var e = new T.Mesh(new T.BoxGeometry(14, 0.38, 0.18), std(PET, { emissive: PET, emissiveIntensity: 0.4 })); e.position.set(-12, 0.19, 8 + s * 1.9); scene.add(e); });
      var post = new T.Mesh(new T.BoxGeometry(0.3, 2.2, 0.3), dark); post.position.set(-12, 1.1, 11); scene.add(post);
      var scr = new T.Mesh(new T.BoxGeometry(1.4, 0.8, 0.12), std(0x0e1114, { emissive: PET, emissiveIntensity: 0.35 })); scr.position.set(-12, 2.4, 11); scene.add(scr);
      var road = new T.Mesh(new T.PlaneGeometry(80, 7), std(0xcfcdc6, { roughness: 1 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 6.5); scene.add(road);
      // shed frame (open, so the bays read from above)
      var col = std(0x5b6770, { metalness: 0.4, roughness: 0.5 });
      for (var cx = -9; cx <= 25; cx += 8.5) [-13, 3].forEach(function (cz) { var c = new T.Mesh(new T.BoxGeometry(0.45, 9, 0.45), col); c.position.set(cx, 4.5, cz); scene.add(c); });
      for (cx = -9; cx <= 25; cx += 8.5) { var tr = new T.Mesh(new T.BoxGeometry(0.35, 0.5, 16.4), col); tr.position.set(cx, 9.1, -5); scene.add(tr); }
      [-13, 3].forEach(function (cz) { var b = new T.Mesh(new T.BoxGeometry(34.5, 0.4, 0.35), col); b.position.set(8, 9.1, cz); scene.add(b); });
      // six bays with piles
      var bayCols = [0x8f989e, 0x9b7b55, 0x8a6a44, 0xd8d2c5, 0xf0efea, 0x6d7a52], piles = [], bayX = [];
      var back = new T.Mesh(new T.BoxGeometry(33, 3, 0.6), conc); back.position.set(8, 1.5, -12.5); scene.add(back);
      for (var i = 0; i <= 6; i++) { var d = new T.Mesh(new T.BoxGeometry(0.6, 3, 6.5), conc); d.position.set(-8 + i * 5.33, 1.5, -9.4); scene.add(d); }
      for (i = 0; i < 6; i++) {
        var x = -8 + (i + 0.5) * 5.33; bayX.push(x);
        var pile = new T.Mesh(new T.DodecahedronGeometry(2.1, 1), std(bayCols[i], { roughness: 0.95, flatShading: true }));
        pile.scale.set(1, 0.55, 1.15); pile.position.set(x, 0.2, -9.6); scene.add(pile); piles.push(pile);
      }
      var tk = truck(PET); scene.add(tk);
      var chunks = new T.InstancedMesh(new T.DodecahedronGeometry(0.35, 0), std(0x8f989e, { flatShading: true }), 30), o = new T.Object3D(); scene.add(chunks);
      var pIn = tag(host, 'Weighed in'), pBay = tag(host, 'Separated into 90+ streams'), pOut = tag(host, 'Weighed out');
      var CYC = 16, state = { k: -1 };
      function pose(t) {
        var u = t % CYC, k = Math.floor(t / CYC) % 6, bx = bayX[k];
        if (k !== state.k) { state.k = k; chunks.material.color.copy(piles[k].material.color); }
        var x, z, yaw, tilt = 0;
        if (u < 2.6) { var e = ease(u / 2.6); x = lin(-40, -12, e); z = 8; yaw = 0; }
        else if (u < 4) { x = -12; z = 8; yaw = 0; }
        else if (u < 6.2) { e = ease(seg(u, 4, 6.2)); x = lin(-12, bx, e); z = lin(8, 4.5, e); yaw = 0; }
        else if (u < 7) { e = ease(seg(u, 6.2, 7)); x = bx; z = 4.5; yaw = lin(0, -Math.PI / 2, e); }
        else if (u < 8.4) { e = ease(seg(u, 7, 8.4)); x = bx; z = lin(4.5, -1.5, e); yaw = -Math.PI / 2; }
        else if (u < 10.6) { x = bx; z = -1.5; yaw = -Math.PI / 2; tilt = Math.sin(seg(u, 8.4, 10.6) * Math.PI) * 0.75; }
        else if (u < 11.6) { e = ease(seg(u, 10.6, 11.6)); x = bx; z = lin(-1.5, 4.5, e); yaw = lin(-Math.PI / 2, -Math.PI, e); }
        else if (u < 13.6) { e = ease(seg(u, 11.6, 13.6)); x = lin(bx, -12, e); z = lin(4.5, 8, e); yaw = -Math.PI; }
        else if (u < 14.6) { x = -12; z = 8; yaw = -Math.PI; }
        else { e = ease(seg(u, 14.6, 16)); x = lin(-12, -42, e); z = 8; yaw = -Math.PI; }
        tk.position.set(x, 0, z); tk.rotation.y = yaw; tk.userData.tray.rotation.z = tilt;
        var dump = seg(u, 8.9, 10.4);
        for (var j = 0; j < 30; j++) {
          var f = Math.max(0, Math.min(1, dump * 1.6 - j / 30 * 0.6));
          o.position.set(bx + ((j * 37) % 9 - 4) * 0.25, 2.2 - f * 2.0 + Math.sin(f * Math.PI) * 0.5, -1.5 - 3.5 - f * 2.5 + ((j * 13) % 5) * 0.2);
          o.scale.setScalar(dump > 0 && f < 1 ? 1 : 0.001); o.updateMatrix(); chunks.setMatrixAt(j, o.matrix);
        }
        chunks.instanceMatrix.needsUpdate = true;
        piles.forEach(function (p, i2) { var base = 0.55; if (i2 === k) p.scale.y = base + 0.18 * ease(seg(u, 9.4, 10.6)); else if (u < 0.1) p.scale.y = base; });
        return u;
      }
      return { r: 19, el: 0.5, look: new T.Vector3(5, 1.5, -2), ang: 0.5, dur: 16, loop: 16,
        tags: [{ el: pIn, p: new T.Vector3(-12, 3.2, 8), show: function (t) { var u = t % CYC; return u > 2.4 && u < 4.4; } },
               { el: pOut, p: new T.Vector3(-12, 3.2, 8), show: function (t) { var u = t % CYC; return u > 13.4 && u < 14.8; } },
               { el: pBay, p: new T.Vector3(8, 4.2, -12) }],
        update: function (t) { pose(t); } };
    },
    // Solutions: the six steps of a program on one chain of custody
    process: function (scene, host) {
      ground(scene, 60);
      var ST = [[-35, 5], [-21, -3], [-7, 5], [7, -3], [21, 5], [35, -3]];
      var names = ['01 Program design', '02 Collection', '03 Transfer & sorting', '04 Processing', '05 Reuse', '06 Reporting'];
      var dark = std(0x3b4246), conc = std(0xb9b7b0, { roughness: 0.95 }), petM = std(PET, { roughness: 0.5 });
      ST.forEach(function (s) { var pad = new T.Mesh(new T.CylinderGeometry(5.2, 5.2, 0.2, 48), std(0xd9d7d0, { roughness: 1 })); pad.position.set(s[0], 0.1, s[1]); scene.add(pad); });
      // 1 plan table
      var tb = new T.Mesh(new T.BoxGeometry(4.5, 0.2, 3), std(0xf4f3ef)); tb.position.set(ST[0][0], 1.6, ST[0][1]); scene.add(tb);
      [[-2, -1.3], [2, -1.3], [-2, 1.3], [2, 1.3]].forEach(function (l) { var m = new T.Mesh(new T.BoxGeometry(0.15, 1.6, 0.15), dark); m.position.set(ST[0][0] + l[0], 0.8, ST[0][1] + l[1]); scene.add(m); });
      for (var g = 0; g < 4; g++) { var ln = new T.Mesh(new T.BoxGeometry(3.6, 0.02, 0.05), petM); ln.position.set(ST[0][0], 1.72, ST[0][1] - 1 + g * 0.65); scene.add(ln); }
      // 2 truck
      var tk = truck(PET); tk.position.set(ST[1][0] - 1, 0, ST[1][1]); tk.rotation.y = 0.5; tk.scale.setScalar(0.8); scene.add(tk);
      // 3 weighbridge + bays
      var wb = new T.Mesh(new T.BoxGeometry(7, 0.3, 2.6), dark); wb.position.set(ST[2][0], 0.3, ST[2][1] + 2.2); scene.add(wb);
      [0x8f989e, 0x9b7b55, 0xf0efea].forEach(function (c, i) { var w = new T.Mesh(new T.BoxGeometry(0.4, 1.6, 2.6), conc); w.position.set(ST[2][0] - 3 + i * 3, 0.9, ST[2][1] - 1.5); scene.add(w);
        var p = new T.Mesh(new T.DodecahedronGeometry(1.1, 1), std(c, { flatShading: true })); p.scale.set(1, 0.6, 1); p.position.set(ST[2][0] - 1.5 + i * 3 - 1.5 + 1.5, 0.4, ST[2][1] - 1.5); scene.add(p); });
      // 4 shredder + baler + bales
      var hop = new T.Mesh(new T.CylinderGeometry(2, 1.1, 1.6, 4), std(0x5b6770, { metalness: 0.4 })); hop.rotation.y = Math.PI / 4; hop.position.set(ST[3][0] - 1.5, 3.2, ST[3][1]); scene.add(hop);
      var sh = new T.Mesh(new T.BoxGeometry(2.6, 2.4, 2.6), petM); sh.position.set(ST[3][0] - 1.5, 1.2, ST[3][1]); scene.add(sh);
      for (var b = 0; b < 6; b++) { var bl = new T.Mesh(new T.BoxGeometry(1.1, 0.9, 0.9), std([0x9b7b55, 0x8f989e, 0xf0efea][b % 3], { roughness: 0.9 })); bl.position.set(ST[3][0] + 1.6 + (b % 3) * 1.2, 0.45 + Math.floor(b / 3) * 0.92, ST[3][1] + 0.8); scene.add(bl); }
      // 5 reuse racks
      for (var rr = 0; rr < 2; rr++) { var rk = new T.Mesh(new T.BoxGeometry(5, 0.12, 1.4), dark); rk.position.set(ST[4][0], 1.2 + rr * 1.4, ST[4][1]); scene.add(rk);
        for (var it = 0; it < 4; it++) { var fu = new T.Mesh(new T.BoxGeometry(0.9, 0.7, 0.9), std([0x6b5a4a, 0xd8d2c5, 0x8a6a44, 0x7c868d][(it + rr) % 4])); fu.position.set(ST[4][0] - 1.8 + it * 1.2, 1.62 + rr * 1.4, ST[4][1]); scene.add(fu); } }
      [-2.4, 2.4].forEach(function (x) { var p = new T.Mesh(new T.BoxGeometry(0.15, 3.2, 1.4), dark); p.position.set(ST[4][0] + x, 1.6, ST[4][1]); scene.add(p); });
      // 6 report screen with bars
      var scr = new T.Mesh(new T.BoxGeometry(5, 3.4, 0.25), std(0x0e1114, { roughness: 0.3 })); scr.position.set(ST[5][0], 2.6, ST[5][1]); scene.add(scr);
      var leg = new T.Mesh(new T.BoxGeometry(0.3, 1, 0.3), dark); leg.position.set(ST[5][0], 0.5, ST[5][1]); scene.add(leg);
      var bars = [];
      [0.9, 0.7, 0.55, 0.4, 0.25].forEach(function (h, i) { var br = new T.Mesh(new T.BoxGeometry(0.6, 2.4, 0.1), std(PET, { emissive: PET, emissiveIntensity: 0.6 })); br.position.set(ST[5][0] - 1.7 + i * 0.85, 1.4, ST[5][1] + 0.16); br.userData.h = h; scene.add(br); bars.push(br); });
      // the chain: a line through every station with material moving along it
      var pts = ST.map(function (s) { return new T.Vector3(s[0], 0.35, s[1] + 3.6); });
      var curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
      var line = new T.Mesh(new T.TubeGeometry(curve, 200, 0.12, 6, false), std(PET, { emissive: PET, emissiveIntensity: 0.5 })); scene.add(line);
      var N = 70, cubes = new T.InstancedMesh(new T.BoxGeometry(0.55, 0.55, 0.55), new T.MeshStandardMaterial({ roughness: 0.7 }), N), o = new T.Object3D(), col = new T.Color();
      var mats = [0x8f989e, 0x9b7b55, 0xf0efea, 0x8a6a44, 0x6d7a52];
      for (var i = 0; i < N; i++) cubes.setColorAt(i, col.setHex(mats[i % 5]).convertSRGBToLinear());
      scene.add(cubes);
      var tags = ST.map(function (s, i) { return { el: tag(host, names[i]), p: new T.Vector3(s[0], i === 5 ? 5 : 4.3, s[1]) }; });
      return { r: 31, el: 0.48, look: new T.Vector3(0, 1.5, 1), ang: 0.12, dur: 6, loop: 999,
        tags: tags,
        update: function (t) {
          for (var i = 0; i < N; i++) { var u = ((reduce ? 0 : t * 0.035) + i / N) % 1; var p = curve.getPointAt(u);
            o.position.set(p.x, 0.75 + Math.abs(Math.sin(u * 60)) * 0.12, p.z); o.rotation.y = u * 20; o.updateMatrix(); cubes.setMatrixAt(i, o.matrix); }
          cubes.instanceMatrix.needsUpdate = true;
          bars.forEach(function (b, i) { var k = 0.6 + 0.4 * Math.sin(t * 0.8 + i); b.scale.y = Math.max(0.05, b.userData.h * k); b.position.y = 1.2 + 1.2 * b.scale.y; });
        } };
    },
    // Reporting: material from the weighbridge stacks into a report, stream by stream
    report: function (scene, host) {
      ground(scene, 30);
      var S = [['Steel', 0x8f989e, 14], ['Timber', 0x8a6a44, 10], ['Cardboard', 0x9b7b55, 9], ['Organics', 0x6d7a52, 8], ['EPS', 0xf0efea, 4], ['Residual', 0x2d3439, 5]];
      var total = S.reduce(function (a, s) { return a + s[2]; }, 0);
      var plate = new T.Mesh(new T.BoxGeometry(19, 0.3, 4.5), std(0xd9d7d0)); plate.position.set(4.8, 0.15, 0); scene.add(plate);
      var c = document.createElement('canvas'); c.width = 256; c.height = 360; var x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 360); x.fillStyle = '#0E1114'; x.font = 'bold 22px sans-serif'; x.fillText('WEIGHBRIDGE', 20, 40); x.fillText('TICKET', 20, 66);
      x.fillStyle = '#7c868d'; for (var l = 0; l < 9; l++) x.fillRect(20, 100 + l * 26, 140 + (l * 37) % 80, 8);
      x.fillStyle = '#3B8493'; x.fillRect(20, 330, 216, 6);
      var tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
      var ticket = new T.Mesh(new T.BoxGeometry(3.2, 0.06, 4.5), [std(0xffffff), std(0xffffff), new T.MeshStandardMaterial({ map: tex, roughness: 0.8 }), std(0xffffff), std(0xffffff), std(0xffffff)]);
      ticket.position.set(-11, 1.6, 0.6); ticket.rotation.x = 0.95; scene.add(ticket);
      var stand = new T.Mesh(new T.BoxGeometry(0.2, 1.2, 0.2), std(0x3b4246)); stand.position.set(-11, 0.6, 0.4); scene.add(stand);
      var cubes = [], o = new T.Object3D(), N = total, inst = new T.InstancedMesh(new T.BoxGeometry(0.9, 0.42, 0.9), new T.MeshStandardMaterial({ roughness: 0.8 }), N), col = new T.Color(), k = 0, tags = [];
      S.forEach(function (s, si) {
        var bx = -3 + si * 3.1;
        for (var j = 0; j < s[2]; j++) { cubes.push([bx, 0.51 + j * 0.44, 0, k / N]); inst.setColorAt(k, col.setHex(s[1]).convertSRGBToLinear()); k++; }
        var pct = Math.round(s[2] / total * 100);
        tags.push({ el: tag(host, s[0] + ' ' + pct + '%', si === 5 ? 'res' : ''), p: new T.Vector3(bx, 0.6 + s[2] * 0.44 + 0.5, 0), show: function (t) { return t > 1 + (si + 1) * 0.5; } });
      });
      scene.add(inst);
      tags.push({ el: tag(host, 'Weighed in'), p: new T.Vector3(-11, 3.1, 0) });
      return { r: 13.5, el: 0.34, look: new T.Vector3(1.5, 2.6, 0), ang: 0.3, dur: 6,
        tags: tags,
        update: function (t) { cubes.forEach(function (c, i) { var e = ease((t - 0.4 - c[3] * 3.2) / 0.6); o.position.set(lin(-11, c[0], e), c[1] * e + Math.sin(e * Math.PI) * 3 + (1 - e) * 1.4, lin(0, c[2], e)); o.scale.setScalar(Math.max(0.001, e > 0 ? 1 : 0)); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); }); inst.instanceMatrix.needsUpdate = true; } };
    },
    // Sector page: a mixed load sorting into that sector's three main streams
    streams: function (scene, host) {
      ground(scene, 14);
      var keys = (host.getAttribute('data-streams') || 'e3,e2,e5').split(','), names = (host.getAttribute('data-names') || '').split('|');
      var G = { e1: [new T.BoxGeometry(0.62, 0.16, 0.44), 0xd8d2c5], e2: [new T.BoxGeometry(0.5, 0.34, 0.4), 0xf0efea], e3: [new T.BoxGeometry(0.56, 0.12, 0.44), 0x9b7b55],
        e4: [new T.BoxGeometry(0.62, 0.1, 0.18), 0x8a6a44], e5: [new T.CylinderGeometry(0.1, 0.1, 0.6, 10), 0x8f989e], e6: [new T.IcosahedronGeometry(0.22, 0), 0x6d7a52],
        e7: [new T.BoxGeometry(0.6, 0.3, 0.3), 0x6b5a4a], e8: [new T.DodecahedronGeometry(0.24), 0x5a4632] };
      var groups = [], o = new T.Object3D(), tags = [];
      keys.concat(['res']).forEach(function (kk, gi) {
        var spec = G[kk] || [new T.DodecahedronGeometry(0.2), 0x2d3439], n = kk === 'res' ? 10 : 48;
        var m = new T.InstancedMesh(spec[0], std(spec[1], { roughness: 0.85, metalness: kk === 'e5' ? 0.6 : 0 }), n); scene.add(m);
        var bx = kk === 'res' ? 4.6 : -3.2 + gi * 2.8, it = [];
        for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, rr = Math.random() * 2.2;
          it.push([Math.cos(a) * rr, 0.3 + Math.random() * 1.8, Math.sin(a) * rr + 2.2, bx + ((i % 4) - 1.5) * 0.66, 0.2 + Math.floor(i / 16) * (kk === 'e4' ? 0.14 : 0.4), -1.6 + (Math.floor(i / 4) % 4 - 1.5) * 0.5, Math.random(), Math.random() * 6]); }
        groups.push([m, it, kk]);
        var label = kk === 'res' ? 'Residual, reported in full' : (names[gi] || kk);
        tags.push({ el: tag(host, label, kk === 'res' ? 'res' : ''), p: new T.Vector3(bx, kk === 'res' ? 1.4 : 2.8, -1.6), show: function (t) { return t > 3.4; } });
      });
      return { r: 4.4, el: 0.4, look: new T.Vector3(0.7, 0.7, -0.9), ang: 0.3, dur: 5,
        tags: tags,
        update: function (t) { groups.forEach(function (g) { g[1].forEach(function (p, i) { var e = ease((t - 0.8 - p[6] * 1.6) / 1.1);
          o.position.set(lin(p[0], p[3], e), lin(p[1] + Math.sin(t * 0.6 + p[7]) * 0.1, p[4], e) + Math.sin(e * Math.PI) * 0.8, lin(p[2], p[5], e));
          o.rotation.set(p[7] * (1 - e), p[7] * 0.7 * (1 - e), 0); o.scale.setScalar(1); o.updateMatrix(); g[0].setMatrixAt(i, o.matrix); }); g[0].instanceMatrix.needsUpdate = true; }); } };
    },
    // N2O: six cylinders loaded, pierced, emptied and sent for metal recycling
    n2o: function (scene, host) {
      ground(scene, 9);
      var frameM = std(DEEP, { roughness: 0.5, metalness: 0.3 }), postM = std(PET, { roughness: 0.5, metalness: 0.3 }), steel = std(0x9aa3a8, { metalness: 0.8, roughness: 0.35 }), dark = std(0x2a3034);
      var table = new T.Mesh(new T.BoxGeometry(5.2, 0.12, 1.5), frameM); table.position.set(0, 1.0, 0); scene.add(table);
      [[-2.5, -0.65], [2.5, -0.65], [-2.5, 0.65], [2.5, 0.65]].forEach(function (l) { var m = new T.Mesh(new T.BoxGeometry(0.14, 1.0, 0.14), frameM); m.position.set(l[0], 0.5, l[1]); scene.add(m); });
      var X = [-1.9, -1.15, -0.4, 0.35, 1.1, 1.85];
      X.forEach(function (x) { var c = new T.Mesh(new T.BoxGeometry(0.5, 0.16, 0.9), std(0x5b6770)); c.position.set(x, 1.12, 0); scene.add(c); });
      // guard: posts, top frame and mesh panels
      [[-2.7, -0.85], [2.7, -0.85], [-2.7, 0.85], [2.7, 0.85]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(0.12, 2.6, 0.12), postM); m.position.set(p[0], 2.3, p[1]); scene.add(m); });
      var topF = new T.Mesh(new T.BoxGeometry(5.5, 0.14, 1.8), postM); topF.position.set(0, 3.55, 0); scene.add(topF);
      var mesh = new T.LineBasicMaterial({ color: PET, transparent: true, opacity: 0.35 });
      [[0, 0.88, 5.3, 0], [0, -0.88, 5.3, 0]].forEach(function (pn) { var g = new T.PlaneGeometry(5.3, 2.4, 22, 10); var w = new T.LineSegments(new T.WireframeGeometry(g), mesh); w.position.set(pn[0], 2.3, pn[1]); scene.add(w); });
      // ram with six piercing pins
      var ram = new T.Group(); scene.add(ram);
      var beam = new T.Mesh(new T.BoxGeometry(4.6, 0.28, 0.5), std(0x7c868d, { metalness: 0.5, roughness: 0.4 })); ram.add(beam);
      X.forEach(function (x) { var rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.5, 10), steel); rod.position.set(x, -0.38, 0); ram.add(rod);
        var tip = new T.Mesh(new T.ConeGeometry(0.06, 0.18, 10), steel); tip.rotation.x = Math.PI; tip.position.set(x, -0.72, 0); ram.add(tip); });
      [-2.3, 2.3].forEach(function (x) { var cyl = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.9, 12), steel); cyl.position.set(x, 3.1, 0); scene.add(cyl); });
      // extraction hood and duct
      var hood = new T.Mesh(new T.CylinderGeometry(0.5, 2.0, 0.7, 4, 1, true), std(0xb9bec2, { metalness: 0.6, roughness: 0.35, side: T.DoubleSide })); hood.rotation.y = Math.PI / 4; hood.scale.set(1.3, 1, 0.55); hood.position.set(0, 3.98, 0); scene.add(hood);
      var duct = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 1.8, 20), std(0xb9bec2, { metalness: 0.7, roughness: 0.3 })); duct.position.set(0, 5.2, 0); scene.add(duct);
      // control cabinet, e-stop, power pack
      var cab = new T.Mesh(new T.BoxGeometry(0.9, 1.7, 0.5), std(0xd9dcdf)); cab.position.set(3.35, 1.85, -0.5); scene.add(cab);
      var es = new T.Mesh(new T.SphereGeometry(0.08, 12, 10), std(0xb3261e, { emissive: 0x5a0f0b, emissiveIntensity: 0.6 })); es.position.set(3.35, 1.7, -0.23); scene.add(es);
      var pp = new T.Mesh(new T.BoxGeometry(1.1, 0.8, 0.9), std(DEEP)); pp.position.set(3.4, 0.4, 0.5); scene.add(pp);
      // loading table and discharge cage
      var lt = new T.Mesh(new T.BoxGeometry(1.6, 0.08, 1.0), frameM); lt.position.set(-3.7, 0.9, 0.2); scene.add(lt);
      var cage = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.5, 0.9, 1.1)), new T.LineBasicMaterial({ color: 0x3b4246 })); cage.position.set(3.0, 0.45, 1.75); scene.add(cage);
      var cageW = new T.LineSegments(new T.WireframeGeometry(new T.BoxGeometry(1.5, 0.9, 1.1, 8, 5, 6)), new T.LineBasicMaterial({ color: 0x7c868d, transparent: true, opacity: 0.4 })); cageW.position.copy(cage.position); scene.add(cageW);
      // six cylinders
      var cylG = new T.CylinderGeometry(0.15, 0.15, 0.62, 18); var nos = new T.CylinderGeometry(0.05, 0.08, 0.16, 12);
      var cyls = X.map(function (x, i) { var g = new T.Group(); var b = new T.Mesh(cylG, std(0xc9ced2, { metalness: 0.75, roughness: 0.3 })); b.rotation.x = Math.PI / 2; g.add(b);
        [-1, 1].forEach(function (s) { var cap = new T.Mesh(new T.SphereGeometry(0.15, 16, 10, 0, 6.3, 0, Math.PI / 2), b.material); cap.rotation.x = s * Math.PI / 2; cap.position.z = s * 0.31; g.add(cap); });
        var n = new T.Mesh(nos, steel); n.rotation.x = Math.PI / 2; n.position.z = 0.5; g.add(n); scene.add(g); return g; });
      // gas being drawn off
      var GN = 90, gas = new T.InstancedMesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0x5fd0e0, transparent: true, opacity: 0.55, depthWrite: false }), GN), go = new T.Object3D(), gs = [];
      for (var gi = 0; gi < GN; gi++) gs.push([X[gi % 6], Math.random(), (Math.random() - 0.5) * 0.3]); scene.add(gas);
      var man = person(); man.position.set(-3.2, 0, 1.6); scene.add(man);
      var L = 12;
      function step(t) { var u = t % L; return u < 2.2 ? 1 : u < 3.6 ? 2 : u < 6.2 ? 3 : 4; }
      return { r: 4.4, el: 0.32, look: new T.Vector3(0.1, 2.1, 0), ang: 0.55, dur: 12, loop: L, step: step,
        update: function (t) {
          var u = t % L;
          cyls.forEach(function (c, i) {
            var ld = ease(seg(u, 0.2 + i * 0.25, 1.4 + i * 0.25)), out = ease(seg(u, 7 + i * 0.25, 8.4 + i * 0.25)), back = seg(u, 11.2, 12);
            var x = lin(-3.7, X[i], ld), y = lin(1.15, 1.35, ld), z = lin(0.2, 0, ld);
            if (out > 0) { x = lin(X[i], 2.6 + (i % 3) * 0.4, out); y = lin(1.35, 0.25 + Math.floor(i / 3) * 0.3, out) + Math.sin(out * Math.PI) * 0.9; z = lin(0, 1.6 + (i % 2) * 0.3, out); }
            c.position.set(x, y, z); c.rotation.y = out * 0.8; c.visible = back < 0.05; c.children[0].material.opacity = 1;
          });
          var down = ease(seg(u, 2.2, 3.2)) * (1 - ease(seg(u, 6.2, 7)));
          ram.position.set(0, lin(2.9, 2.22, down), 0);
          var g = seg(u, 3.4, 6.2);
          for (var j = 0; j < GN; j++) { var s = gs[j], ph = (g * 2.4 + s[1]) % 1, on = g > 0 && g < 1;
            go.position.set(lin(s[0], 0, ph), lin(1.5, 5.6, ph), s[2] * (1 - ph)); go.scale.setScalar(on ? (1 - ph * 0.5) : 0.001); go.updateMatrix(); gas.setMatrixAt(j, go.matrix); }
          gas.instanceMatrix.needsUpdate = true;
        } };
    },
    // Sectors overview: a ring of every sector, drag to spin, click to open
    ring: function (scene, host) {
      var data = []; try { data = JSON.parse(host.getAttribute('data-ring') || '[]'); } catch (e) {}
      var n = data.length, R = 13, panels = [], grp = new T.Group(); scene.add(grp);
      
      data.forEach(function (d, i) {
        var c = document.createElement('canvas'); c.width = 512; c.height = 340; var x = c.getContext('2d'); x.fillStyle = '#1b2226'; x.fillRect(0, 0, 512, 340);
        var tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
        var img = new Image(); img.onload = function () { var s = Math.max(512 / img.width, 340 / img.height), w = img.width * s, h = img.height * s; x.drawImage(img, (512 - w) / 2, (340 - h) / 2, w, h);
          var gr = x.createLinearGradient(0, 180, 0, 340); gr.addColorStop(0, 'rgba(14,17,20,0)'); gr.addColorStop(1, 'rgba(14,17,20,.92)'); x.fillStyle = gr; x.fillRect(0, 180, 512, 160);
          x.fillStyle = '#fff'; x.font = '700 30px Archivo, Arial, sans-serif'; var words = d.n.toUpperCase().split(' '), line = '', y = 300, lines = [];
          words.forEach(function (wd) { if (x.measureText(line + wd).width > 460) { lines.push(line); line = ''; } line += wd + ' '; }); lines.push(line);
          lines.slice(-2).forEach(function (ln, li, arr) { x.fillText(ln.trim(), 24, 316 - (arr.length - 1 - li) * 34); });
          tex.needsUpdate = true; };
        img.src = d.img;
        var m = new T.Mesh(new T.PlaneGeometry(6, 4), new T.MeshBasicMaterial({ map: tex }));
        var a = i / n * Math.PI * 2; m.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); m.rotation.y = a; m.userData = d; grp.add(m); panels.push(m);
      });
      var rot = 0, vel = 0.0025, drag = null, moved = 0, ray = new T.Raycaster(), mv = new T.Vector2(), camRef = null;
      host.style.cursor = 'grab';
      host.addEventListener('pointerdown', function (e) { drag = e.clientX; moved = 0; host.style.cursor = 'grabbing'; });
      window.addEventListener('pointerup', function (e) {
        if (drag !== null && moved < 6 && camRef) { var r = host.getBoundingClientRect(); mv.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mv, camRef); var hit = ray.intersectObjects(panels)[0]; if (hit) location.href = hit.object.userData.href; }
        drag = null; host.style.cursor = 'grab'; });
      window.addEventListener('pointermove', function (e) { if (drag === null) return; var dx = e.clientX - drag; drag = e.clientX; moved += Math.abs(dx); vel = dx * 0.0009; rot += dx * 0.004; });
      return { r: 7.2, el: 0.1, look: new T.Vector3(0, 0, 5), ang: 0, dur: 1, loop: 1e9,
        update: function (t, cam) { camRef = cam; if (drag === null) { vel += (0.0022 - vel) * 0.02; rot += reduce ? 0 : vel; } grp.rotation.y = rot; } };
    },
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
    var cfg = BUILD[kind](scene, host);
    var cam = new T.PerspectiveCamera(32, 1, 0.1, 2000);
    var t0 = null, running = false, done = false;
    function size() { var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = reduce ? 30 : Math.max(0, (now - t0) / 1000);
      cfg.update(cfg.loop ? t : Math.min(t, cfg.dur + 1), cam);
      var a = cfg.ang + (reduce ? 0 : Math.sin(t * 0.18) * 0.22);
      var vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
      var d = cfg.r / Math.sin(Math.min(vf, hf) / 2) * 0.92;
      cam.position.set(cfg.look.x + Math.sin(a) * Math.cos(cfg.el) * d, cfg.look.y + Math.sin(cfg.el) * d, cfg.look.z + Math.cos(a) * Math.cos(cfg.el) * d);
      cam.near = d / 50; cam.far = d * 6; cam.updateProjectionMatrix();
      if (!scene.fog) scene.fog = new T.Fog(0xe7e6e0, d * 1.7, d * 3.6);
      cam.lookAt(cfg.look);
      r.render(scene, cam);
      if (cfg.tags) {
        var W = host.clientWidth, H = host.clientHeight;
        cfg.tags.forEach(function (tg) {
          VT.copy(typeof tg.p === 'function' ? tg.p(t) : tg.p).project(cam);
          tg.el.style.transform = 'translate(' + ((VT.x + 1) / 2 * W) + 'px,' + ((1 - VT.y) / 2 * H) + 'px) translate(-50%,-100%)';
          tg.el.style.opacity = !tg.show || tg.show(t) ? 1 : 0;
          if (tg.on) tg.el.classList.toggle('on', !!tg.on(t));
          if (tg.text) { var tx = tg.text(t); if (tg.el.textContent !== tx) tg.el.textContent = tx; }
        });
      }
      if (cfg.step) { var st = cfg.step(cfg.loop ? t : Math.min(t, cfg.dur + 1)); host.querySelectorAll('[data-step]').forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-step') === st); }); }
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
      if (en.isIntersecting) { if (inst === undefined) { inst = init(h); made.set(h, inst); if (!inst) { var sec = h.closest('.s3d-sec'); if (sec) sec.style.display = 'none'; } } if (inst) inst.play(); }
      else if (inst) inst.stop();
    });
  }, { rootMargin: '120px 0px', threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });
})();
