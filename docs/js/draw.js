/* Recycle Group measured drawings.
   Every figure drawn at true proportion, in the language of a technical drawing:
   hairlines, dimension lines, a 1.8 m figure for scale, numerals that resolve as you scroll.
   <div class="dw" data-dw="mcg|pools|developer|tunnel|report|streams" ...></div> */
(function () {
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INK = '#0E1114', PET = '#3B8493', DEEP = '#1F5561', MONO = '500 11px "IBM Plex Mono", ui-monospace, Menlo, monospace',
      DISP = '"Archivo", system-ui, sans-serif';
  var MAT = { e1: ['Mattresses', '#CFC8B8'], e2: ['Polystyrene', '#ECEAE3'], e3: ['Cardboard', '#A88A60'], e4: ['Timber', '#8A6A44'],
    e5: ['Metals', '#8F989E'], e6: ['Organics', '#6D7A52'], e7: ['Furniture', '#6B5A4A'], e8: ['Soil', '#5A4632'], res: ['Residual', '#2D3439'] };
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(x) { x = clamp(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function num(v, dec) { var s = dec ? v.toFixed(dec) : Math.round(v).toString(); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function rnd(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---------- primitives ----------
  function P(c) { this.c = c; }
  P.prototype = {
    hair: function (a) { var c = this.c; c.lineWidth = 1; c.strokeStyle = 'rgba(14,17,20,' + (a || .16) + ')'; },
    text: function (s, x, y, o) { var c = this.c; o = o || {}; c.font = o.f || MONO; c.fillStyle = o.col || 'rgba(14,17,20,.62)'; c.textAlign = o.al || 'left'; c.textBaseline = o.bl || 'alphabetic'; c.fillText(s, x, y); },
    big: function (s, x, y, sz, o) { o = o || {}; this.text(s, x, y, { f: '700 ' + sz + 'px ' + DISP, col: o.col || INK, al: o.al }); },
    dimH: function (x1, x2, y, label, a) { // horizontal dimension line with ticks
      var c = this.c; c.save(); c.globalAlpha = a == null ? 1 : a; this.hair(.5);
      c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.moveTo(x1, y - 5); c.lineTo(x1, y + 5); c.moveTo(x2, y - 5); c.lineTo(x2, y + 5);
      c.moveTo(x1 + 4, y - 4); c.lineTo(x1 - 4, y + 4); c.moveTo(x2 + 4, y - 4); c.lineTo(x2 - 4, y + 4); c.stroke();
      if (label) { c.font = MONO; var w = c.measureText(label).width + 10, m = (x1 + x2) / 2; c.fillStyle = this.bg; c.fillRect(m - w / 2, y - 8, w, 16); this.text(label, m, y + 4, { al: 'center', col: INK }); }
      c.restore();
    },
    dimV: function (x, y1, y2, label, a, side) {
      var c = this.c; c.save(); c.globalAlpha = a == null ? 1 : a; this.hair(.5);
      c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.moveTo(x - 5, y1); c.lineTo(x + 5, y1); c.moveTo(x - 5, y2); c.lineTo(x + 5, y2);
      c.moveTo(x - 4, y1 - 4); c.lineTo(x + 4, y1 + 4); c.moveTo(x - 4, y2 - 4); c.lineTo(x + 4, y2 + 4); c.stroke();
      if (label) this.text(label, x + (side === 'l' ? -10 : 10), (y1 + y2) / 2 + 4, { al: side === 'l' ? 'right' : 'left', col: INK });
      c.restore();
    },
    person: function (x, y, h, col) { // 1.8 m figure standing at (x, y=ground), height h px
      var c = this.c, u = h / 8; c.save(); c.fillStyle = col || INK;
      c.beginPath(); c.arc(x, y - h + u * .55, u * .55, 0, 7); c.fill();
      c.beginPath(); c.moveTo(x - u * .75, y - h + u * 1.35); c.lineTo(x + u * .75, y - h + u * 1.35); c.lineTo(x + u * .62, y - u * 3.9); c.lineTo(x + u * .55, y);
      c.lineTo(x + u * .12, y); c.lineTo(x, y - u * 3.4); c.lineTo(x - u * .12, y); c.lineTo(x - u * .55, y); c.lineTo(x - u * .62, y - u * 3.9); c.closePath(); c.fill(); c.restore();
    },
    grid: function (W, H, step) { var c = this.c; this.hair(.05); c.beginPath(); for (var x = step; x < W; x += step) { c.moveTo(x + .5, 0); c.lineTo(x + .5, H); } for (var y = step; y < H; y += step) { c.moveTo(0, y + .5); c.lineTo(W, y + .5); } c.stroke(); }
  };

  // ---------- scenes ----------
  var S = {};

  // A year of mattresses laid flat across the MCG playing surface (≈173 × 146 m oval), plan and section.
  S.mcg = function (g, W, H, p) {
    var c = g.c, narrow = W < 640, pad = narrow ? 18 : 34, head = 52, foot = narrow ? 64 : 58;
    var sweep = ease(seg(p, .05, .5)), lk = ease(seg(p, .45, .9)), layers = Math.max(1, Math.round(40 * lk)), hNow = 10 * lk;
    var planW, planH, ex, ew, gy, topY;
    if (narrow) { planW = W - pad * 2; planH = (H - head - foot) * .52; }
    else { planW = W * .58 - pad; planH = H - head - foot - 34; }
    var rx = Math.min(planW / 2 - (narrow ? 40 : 56), planH / 2 * 173 / 146), ry = rx * 146 / 173;
    var cx = pad + rx + 6, cy = head + 8 + ry;
    // fill
    c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.clip();
    var reach = (cx - rx) + sweep * (rx * 2 + 2);
    c.fillStyle = 'rgba(59,132,147,.16)'; c.fillRect(cx - rx, cy - ry, Math.max(0, reach - (cx - rx)), ry * 2);
    var mw = 2.03 / 173 * rx * 2;
    if (mw >= 2) { g.hair(.12); c.beginPath(); for (var x = cx - rx; x < reach; x += mw) { c.moveTo(x + .5, cy - ry); c.lineTo(x + .5, cy + ry); } c.stroke(); }
    if (lk > 0) { c.fillStyle = 'rgba(31,85,97,' + (.6 * lk) + ')'; c.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); }
    c.restore();
    g.hair(.75); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.stroke();
    g.hair(.4); c.strokeRect(cx - 1.5, cy - 10 / 73 * ry, 3, 20 / 73 * ry);
    c.setLineDash([3, 4]); c.beginPath(); c.ellipse(cx, cy, rx * .3, ry * .3, 0, 0, 7); c.stroke(); c.setLineDash([]);
    if (sweep > 0 && sweep < 1) { c.strokeStyle = PET; c.lineWidth = 1.5; c.beginPath(); c.moveTo(reach, cy - ry - 8); c.lineTo(reach, cy + ry + 8); c.stroke(); }
    g.dimH(cx - rx, cx + rx, cy + ry + 20, '173 m');
    g.dimV(cx + rx + 16, cy - ry, cy + ry, '146 m', 1, 'r');
    g.text('PLAN · MCG PLAYING SURFACE', pad, 30, { col: 'rgba(14,17,20,.5)' });
    // section
    if (narrow) { ex = pad; ew = W - pad * 2; topY = cy + ry + 62; gy = H - foot - 6; }
    else { ex = pad + planW + 30; ew = W - ex - pad; topY = head + 8; gy = cy + ry; }
    g.text('SECTION · STACK HEIGHT', ex, narrow ? topY - 10 : 30, { col: 'rgba(14,17,20,.5)' });
    var mPx = (gy - topY) / 14.6, bw = Math.min(ew * .42, 150), bx = ex + 4;
    g.hair(.5); c.beginPath(); c.moveTo(ex, gy + .5); c.lineTo(ex + ew, gy + .5); c.stroke();
    c.save(); c.beginPath(); c.rect(bx, gy - 14 * mPx, bw, 8 * mPx); c.clip(); c.fillStyle = 'rgba(59,132,147,.08)'; c.fillRect(bx, gy - 14 * mPx, bw, 8 * mPx);
    g.hair(.12); c.beginPath(); for (var k2 = -300; k2 < 400; k2 += 7) { c.moveTo(bx + k2, gy); c.lineTo(bx + k2 + 300, gy - 300); } c.stroke(); c.restore();
    g.text('RANGE 6–14 m', bx + 6, gy - 14 * mPx + 14, { col: 'rgba(31,85,97,.85)' });
    c.fillStyle = DEEP; c.fillRect(bx, gy - hNow * mPx, bw, hNow * mPx);
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1; c.beginPath(); for (var l = 1; l < layers; l++) { var yy = Math.round(gy - l * .25 * mPx) + .5; c.moveTo(bx, yy); c.lineTo(bx + bw, yy); } c.stroke();
    var px = bx + bw + 22; g.person(px, gy, 1.8 * mPx);
    g.dimV(px + 18, gy, gy - 1.8 * mPx, '1.8 m', 1, 'r');
    if (hNow > .4) g.dimV(px + 70, gy, gy - hNow * mPx, '≈ ' + hNow.toFixed(1) + ' m', 1, 'r');
    // readout
    var ry0 = H - 22;
    g.big(num(250000 * ease(seg(p, .05, .9))), pad, ry0 - 16, narrow ? 24 : 30);
    g.text('MATTRESSES · ONE YEAR', pad, ry0);
    g.big(String(layers), W - pad, ry0 - 16, narrow ? 24 : 30, { al: 'right' });
    g.text('LAYERS DEEP', W - pad, ry0, { al: 'right' });
  };

  // Olympic pools (50 × 25 × 2 m = 2,500 m³) filled to a volume, drawn in plan.
  function pools(g, W, H, p, vol, hi, hiLabel, label, sub) {
    var c = g.c, narrow = W < 640, pad = narrow ? 18 : 34, n = vol / 2500, full = Math.ceil(n);
    var cols = narrow ? 4 : (full > 18 ? 8 : 6), rows = Math.ceil(full / cols), gap = narrow ? 8 : 14;
    var areaW = W - pad * 2, pw = (areaW - gap * (cols - 1)) / cols, ph = pw / 2, top = 56;
    var fill = n * ease(seg(p, .08, .78)), hiK = ease(seg(p, .8, .98));
    g.text('PLAN · OLYMPIC POOL 50 × 25 × 2 m = 2,500 m³', pad, 30, { col: 'rgba(14,17,20,.5)' });
    for (var i = 0; i < full; i++) {
      var x = pad + (i % cols) * (pw + gap), y = top + Math.floor(i / cols) * (ph + gap), f = clamp(fill - i, 0, 1);
      c.fillStyle = 'rgba(14,17,20,.03)'; c.fillRect(x, y, pw, ph);
      if (f > 0) { var hl = hi && i < Math.ceil(hi / 2500) && hiK > 0; c.fillStyle = hl ? 'rgba(31,85,97,' + (.55 + .35 * hiK) + ')' : 'rgba(59,132,147,.42)'; c.fillRect(x, y, pw * f, ph); }
      g.hair(.07); c.beginPath(); for (var l = 1; l < 8; l++) { c.moveTo(x + 3, y + l * ph / 8 + .5); c.lineTo(x + pw - 3, y + l * ph / 8 + .5); } c.stroke();
      g.hair(.45); c.strokeRect(x + .5, y + .5, pw - 1, ph - 1);
      if (f > 0 && f < 1) { c.strokeStyle = PET; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + pw * f, y - 3); c.lineTo(x + pw * f, y + ph + 3); c.stroke(); }
      g.text((i + 1 < 10 ? '0' : '') + (i + 1), x + 5, y + 13, { col: 'rgba(14,17,20,.45)', f: '500 9px "IBM Plex Mono", monospace' });
    }
    var by = top + rows * (ph + gap) + 4;
    g.dimH(pad, pad + pw, by + 6, '50 m');
    var person = 1.8 / 50 * pw; g.person(pad + pw + 18, by + 12, Math.max(person, 2.5));
    var ry0 = by + (narrow ? 58 : 64);
    g.big(num(vol * ease(seg(p, .08, .78))) + ' m³', pad, ry0, narrow ? 26 : 32);
    g.text(label, pad, ry0 + 18);
    g.big(n.toFixed(1), W - pad, ry0, narrow ? 26 : 32, { al: 'right' });
    g.text('POOLS', W - pad, ry0 + 18, { al: 'right' });
    if (hi) { c.globalAlpha = hiK; g.text(hiLabel, pad, ry0 + 36, { col: DEEP }); c.globalAlpha = 1; }
    return ry0 + (hi ? 48 : 30);
  }
  S.pools = function (g, W, H, p) { return pools(g, W, H, p, 41580, 0, '', 'LOOSE POLYSTYRENE · TWELVE MONTHS'); };
  S.developer = function (g, W, H, p) { return pools(g, W, H, p, 60000, 20000, '■ 20,000 m³ RETURNED TO THE SITE AS LANDSCAPING', 'TOPSOIL TAKEN ON · ONE DEVELOPER'); };

  // Three 40 ft containers of loose foam densified at ≈102 : 1 (6,930 m³ loose per container of product).
  S.tunnel = function (g, W, H, p, t) {
    var c = g.c, narrow = W < 640, pad = narrow ? 16 : 30, L = 12.19, Hc = 2.59, inner = 67.7, ratio = 6930 / inner;
    var dense = 3 * inner / ratio, side = Math.cbrt(dense);
    var scale = (W - pad * 2) / (L + 6.5), gy = H - (narrow ? 70 : 78), k = ease(seg(p, .25, .8));
    g.text('ELEVATION · 3 × 40 ft CONTAINERS · LOOSE EPS', pad, 26, { col: 'rgba(14,17,20,.5)' });
    var r = rnd(7), cw = L * scale, ch = Hc * scale, bx = pad + cw + 3.2 * scale, bs = side * scale;
    for (var n = 0; n < 3; n++) {
      var y0 = gy - (n + 1) * (ch + 6);
      g.hair(.5); c.strokeRect(pad + .5, y0 + .5, cw, ch);
      g.hair(.08); c.beginPath(); for (var q = 1; q < 24; q++) { c.moveTo(pad + q * cw / 24 + .5, y0 + 2); c.lineTo(pad + q * cw / 24 + .5, y0 + ch - 2); } c.stroke();
      for (var i = 0; i < 70; i++) {
        var sx = pad + 4 + r() * (cw - 14), sy = y0 + 3 + r() * (ch - 10), w = 6 + r() * 7, h = 4 + r() * 4, del = r() * .35;
        var u = ease(clamp((k - del) / .65, 0, 1)), tx = bx + r() * (bs - 4), ty = gy - bs + r() * (bs - 3);
        var x = sx + (tx - sx) * u, y = sy + (ty - sy) * u - Math.sin(u * Math.PI) * 40, s = 1 - u * .9;
        c.fillStyle = 'rgba(236,234,227,' + (1 - u * .6) + ')'; c.strokeStyle = 'rgba(14,17,20,.35)'; c.lineWidth = .6;
        c.fillRect(x, y, w * s, h * s); if (s > .3) c.strokeRect(x + .5, y + .5, w * s, h * s);
      }
    }
    g.hair(.5); c.beginPath(); c.moveTo(pad, gy + .5); c.lineTo(W - pad, gy + .5); c.stroke();
    var bk = ease(seg(p, .55, .9)); c.fillStyle = 'rgba(220,218,210,' + bk + ')'; c.fillRect(bx, gy - bs * bk, bs, bs * bk);
    g.hair(.6 * bk); c.strokeRect(bx + .5, gy - bs + .5, bs, bs);
    g.person(bx + bs + 14, gy, 1.8 * scale);
    g.dimH(pad, pad + cw, gy + 18, '12.19 m');
    g.dimH(bx, bx + bs, gy + 18, side.toFixed(2) + ' m', bk);
    g.text('≈ ' + Math.round(ratio) + ' : 1', bx - 6, gy - bs - 14, { col: DEEP, al: 'left' });
    g.big(num(3 * inner * (1 - k) + dense * k, 0) + ' m³', W - pad, 40, narrow ? 22 : 26, { al: 'right' });
    g.text(k > .98 ? 'DENSIFIED' : 'LOOSE', W - pad, 58, { al: 'right' });
  };

  // Weighbridge ticket → stream split → outcome table (sample layout).
  S.report = function (g, W, H, p, t) {
    var c = g.c, narrow = W < 640, pad = narrow ? 16 : 34;
    var SM = [['Steel', '#8F989E', 28], ['Timber', '#8A6A44', 20], ['Cardboard', '#A88A60', 18], ['Organics', '#6D7A52', 16], ['EPS', '#ECEAE3', 8], ['Residual', '#2D3439', 10]];
    var net = 9.34, tx = pad, ty = narrow ? 18 : 46, tw = narrow ? W - pad * 2 : 170, th = narrow ? 78 : 236;
    var L = [['DOCKET', '004219'], ['IN', '07:42'], ['GROSS', '18.46 t'], ['TARE', '9.12 t'], ['NET', net.toFixed(2) + ' t']], lh = 30;
    var tk = ease(seg(p, 0, .2));
    c.save(); c.globalAlpha = tk; c.fillStyle = '#fff'; c.shadowColor = 'rgba(14,17,20,.12)'; c.shadowBlur = 18; c.shadowOffsetY = 6; c.fillRect(tx, ty, tw, th * tk); c.restore();
    c.save(); c.beginPath(); c.rect(tx, ty, tw, th * tk); c.clip();
    g.text('WEIGHBRIDGE', tx + 12, ty + 22, { col: INK, f: '600 10px ' + DISP });
    if (narrow) {
      var cw = (tw - 24) / 5;
      L.forEach(function (r, i) { var x = tx + 12 + i * cw; g.text(r[0], x, ty + 44, { col: 'rgba(14,17,20,.45)', f: '500 8.5px "IBM Plex Mono", monospace' }); g.text(r[1], x, ty + 60, { col: i === 4 ? DEEP : INK, f: (i === 4 ? '600 ' : '500 ') + '10.5px "IBM Plex Mono", monospace' }); });
    } else {
      L.forEach(function (r, i) { var y = ty + 50 + i * lh; g.text(r[0], tx + 12, y, { col: 'rgba(14,17,20,.45)', f: '500 9px "IBM Plex Mono", monospace' }); g.text(r[1], tx + tw - 12, y, { al: 'right', col: i === 4 ? DEEP : INK, f: (i === 4 ? '600 ' : '500 ') + '11px "IBM Plex Mono", monospace' }); g.hair(.08); c.beginPath(); c.moveTo(tx + 12, y + 8.5); c.lineTo(tx + tw - 12, y + 8.5); c.stroke(); });
    }
    c.fillStyle = PET; c.fillRect(tx + 12, ty + th - (narrow ? 8 : 16), tw - 24, 3); c.restore();
    // bar
    var bx = narrow ? pad : tx + tw + 60, bw = W - bx - pad, by = narrow ? ty + th + 40 : ty + 22, bh = narrow ? 30 : 42, split = ease(seg(p, .22, .6));
    g.text('NET LOAD BY STREAM · % OF ' + net.toFixed(2) + ' t', bx, by - 14, { col: 'rgba(14,17,20,.5)' });
    var acc = 0, r = rnd(3);
    // particles from ticket to bar
    if (split > 0 && split < 1) for (var i = 0; i < 160; i++) {
      var si = 0, rr = r() * 100, a2 = 0; for (var s = 0; s < SM.length; s++) { a2 += SM[s][2]; if (rr < a2) { si = s; break; } }
      var a0 = 0; for (s = 0; s < si; s++) a0 += SM[s][2];
      var u = clamp((split - r() * .5) / .5, 0, 1), x0 = narrow ? tx + tw * .85 : tx + tw, y0 = narrow ? ty + th : ty + th * .75, x1 = bx + (a0 + r() * SM[si][2]) / 100 * bw, y1 = by + r() * bh;
      c.fillStyle = SM[si][1]; c.globalAlpha = u > 0 && u < 1 ? 1 : 0; c.fillRect(x0 + (x1 - x0) * ease(u) - 1.5, y0 + (y1 - y0) * ease(u) - Math.sin(u * 3.14) * 30 - 1.5, 3, 3);
    }
    c.globalAlpha = 1;
    SM.forEach(function (sm, i) {
      var w = sm[2] / 100 * bw, x = bx + acc / 100 * bw, k = ease(seg(split, i * .1, .5 + i * .1));
      c.fillStyle = sm[1]; c.fillRect(x, by, w * k, bh); if (sm[0] === 'EPS') { g.hair(.25); c.strokeRect(x + .5, by + .5, w * k - 1, bh - 1); }
      acc += sm[2];
    });
    g.hair(.4); c.strokeRect(bx + .5, by + .5, bw - 1, bh - 1);
    // ticks + table
    var tb = ease(seg(p, .58, .92)), rowH = narrow ? 20 : 25, ty0 = by + bh + (narrow ? 26 : 34);
    acc = 0; c.globalAlpha = tb;
    SM.forEach(function (sm, i) {
      var x = bx + (acc + sm[2] / 2) / 100 * bw; acc += sm[2];
      g.hair(.35); c.beginPath(); c.moveTo(x + .5, by + bh + 3); c.lineTo(x + .5, by + bh + 10); c.stroke();
      var y = ty0 + i * rowH;
      c.fillStyle = sm[1]; c.fillRect(bx, y - 9, 10, 10); if (sm[0] === 'EPS') { g.hair(.3); c.strokeRect(bx + .5, y - 8.5, 9, 9); }
      g.text(sm[0].toUpperCase(), bx + 18, y, { col: INK });
      g.text(sm[2] + '%', bx + bw * (narrow ? .66 : .55), y, { al: 'right', col: 'rgba(14,17,20,.6)' });
      g.text((net * sm[2] / 100).toFixed(2) + ' t', bx + bw, y, { al: 'right', col: sm[0] === 'Residual' ? INK : DEEP });
      g.hair(.07); c.beginPath(); c.moveTo(bx, y + 7.5); c.lineTo(bx + bw, y + 7.5); c.stroke();
    });
    var ys = ty0 + SM.length * rowH + 6;
    g.text('RECOVERED', bx + 18, ys, { col: INK, f: '600 11px "IBM Plex Mono", monospace' });
    g.text('90%', bx + bw * (narrow ? .66 : .55), ys, { al: 'right', col: DEEP, f: '600 11px "IBM Plex Mono", monospace' });
    g.text((net * .9).toFixed(2) + ' t', bx + bw, ys, { al: 'right', col: DEEP, f: '600 11px "IBM Plex Mono", monospace' });
    c.globalAlpha = 1;
    return Math.max(ty + th + 20, ys + 20);
  };

  // A mixed load resolving into a sector's main streams (ambient, continuous, deterministic).
  S.streams = function (g, W, H, p, t, host) {
    var c = g.c, narrow = W < 640, pad = narrow ? 16 : 34;
    var keys = (host.getAttribute('data-streams') || 'e3,e2,e5').split(',').concat(['res']);
    var names = (host.getAttribute('data-names') || '').split('|');
    var n = keys.length, w = keys.map(function (k) { return k === 'res' ? .1 : .9 / (n - 1); });
    var gx = narrow ? W * .34 : W * .4, binW = narrow ? 64 : 104, bx = W - pad - binW, top = 58, bot = H - 30, lh = (bot - top) / n;
    var midY = (top + bot) / 2, band = 26;
    var lanes = keys.map(function (k, i) { return { k: k, y: top + lh * (i + .5), n: k === 'res' ? 'Residual' : (names[i] || MAT[k][0]), s: k === 'res' ? 'Reported in full' : 'Recovered', col: MAT[k][1] }; });
    g.text('IN · MIXED LOAD', pad, 30, { col: 'rgba(14,17,20,.5)' });
    g.text('SORTED · ' + (n - 1) + ' STREAMS + RESIDUAL', W - pad, 30, { al: 'right', col: 'rgba(14,17,20,.5)' });
    // infeed belt
    g.hair(.22); c.strokeRect(pad + .5, midY - band / 2 - 6.5, gx - pad - 10, band + 12);
    g.hair(.07); c.beginPath(); for (var b = pad + 8; b < gx - 12; b += 12) { var o = (t * 60) % 12; c.moveTo(b + o + .5, midY - band / 2 - 6); c.lineTo(b + o + .5, midY + band / 2 + 6); } c.stroke();
    // gate
    c.fillStyle = INK; c.fillRect(gx - 2, midY - band / 2 - 16, 4, band + 32);
    g.text('SORT', gx, midY - band / 2 - 24, { al: 'center', col: INK, f: '600 9px "IBM Plex Mono", monospace' });
    // lane guides + bins
    lanes.forEach(function (L) {
      g.hair(.12); c.beginPath(); c.moveTo(gx + 6, midY); c.bezierCurveTo(gx + (bx - gx) * .35, midY, gx + (bx - gx) * .35, L.y, gx + (bx - gx) * .62, L.y); c.lineTo(bx - 6, L.y); c.stroke();
    });
    function lane(i) { var h = ((i * 2654435761) >>> 0) % 1000 / 1000, a = 0; for (var q = 0; q < n; q++) { a += w[q]; if (h < a) return q; } return n - 1; }
    t = t + 7; var dt = narrow ? .1 : .07, v1 = (gx - pad) / 3.2, life2 = 3.4, life = 3.2 + life2, imax = Math.floor(t / dt), imin = imax - Math.ceil(life / dt);
    for (var i = Math.max(0, imin); i <= imax; i++) {
      var age = t - i * dt; if (age < 0 || age > life) continue;
      var q = lane(i), L = lanes[q], row = (i % 3) - 1, x, y, sz = narrow ? 4.4 : 5.2;
      if (age < 3.2) { x = pad + 6 + age * v1; y = midY + row * 8; }
      else { var u = (age - 3.2) / life2, e = u, X0 = gx + 6, X3 = bx - 8;
        var cx1 = gx + (bx - gx) * .35, xs = X0 + (X3 - X0) * e;
        var k = clamp((xs - X0) / ((gx + (bx - gx) * .62) - X0), 0, 1), kk = k * k * (3 - 2 * k);
        x = xs; y = (midY + row * 8 * (1 - kk)) + (L.y - midY) * kk; }
      c.globalAlpha = Math.min(1, age * 6, (life - age) * 6);
      c.fillStyle = L.col;
      if (L.k === 'e5') { c.beginPath(); c.arc(x, y, sz / 2, 0, 7); c.fill(); }
      else if (L.k === 'e3' || L.k === 'e4') c.fillRect(x - sz * .7, y - sz * .3, sz * 1.4, sz * .6);
      else c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      if (L.k === 'e2' || L.k === 'e1') { c.strokeStyle = 'rgba(14,17,20,.35)'; c.lineWidth = .6; c.strokeRect(x - sz / 2 + .3, y - sz / 2 + .3, sz - .6, sz - .6); }
    }
    c.globalAlpha = 1;
    lanes.forEach(function (L, qi) {
      var arrivals = Math.max(0, (t - life) / dt) * w[qi], cap = qi === n - 1 ? 6 : 18, f = (arrivals % cap) / cap, bh = narrow ? 18 : 22;
      g.hair(.45); c.strokeRect(bx + .5, L.y - bh / 2 + .5, binW - 1, bh - 1);
      c.fillStyle = L.col; c.fillRect(bx + 2, L.y - bh / 2 + 2, (binW - 4) * f, bh - 4);
      if (L.k === 'e2' || L.k === 'e1') { g.hair(.2); c.strokeRect(bx + 2.5, L.y - bh / 2 + 2.5, (binW - 4) * f - 1, bh - 5); }
      g.text(L.n.toUpperCase(), bx + binW, L.y - bh / 2 - 7, { al: 'right', col: L.k === 'res' ? 'rgba(14,17,20,.62)' : INK, f: (narrow ? '500 8.5px ' : '500 10px ') + '"IBM Plex Mono", monospace' });
      g.text(L.s.toUpperCase(), bx + binW, L.y + bh / 2 + 13, { al: 'right', col: L.k === 'res' ? 'rgba(14,17,20,.45)' : DEEP, f: '500 8.5px "IBM Plex Mono", monospace' });
    });
  };

  // ---------- engine ----------
  function mount(host) {
    var kind = host.getAttribute('data-dw'), fn = S[kind]; if (!fn) return;
    var cv = d.createElement('canvas'); cv.className = 'dw-c'; host.insertBefore(cv, host.firstChild);
    var ctx = cv.getContext('2d'), g = new P(ctx); g.bg = getComputedStyle(host).backgroundColor || '#F1F0EC';
    if (!g.bg || g.bg === 'rgba(0, 0, 0, 0)') g.bg = '#F1F0EC';
    var W = 0, H = 0, dpr = 1, p = reduce ? 1 : 0, sp = p, vis = false, raf = 0, t0 = performance.now(), ambient = kind === 'streams';
    function size() { var r = host.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; draw(); }
    function prog() { var r = host.getBoundingClientRect(), vh = innerHeight; return clamp((vh - r.top) / (vh * .55 + r.height * .55), 0, 1); }
    function draw() {
      if (W < 60 || H < 60) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      g.grid(W, H, 24);
      var need = fn(g, W, H, sp, (performance.now() - t0) / 1000, host);
      if (need && need > H + 2 && !host._grown) { host._grown = 1; host.style.minHeight = Math.ceil(need) + 'px'; requestAnimationFrame(size); }
    }
    function loop() { if (!reduce) p = prog(); sp += (p - sp) * .12; if (Math.abs(p - sp) < .0005) sp = p; draw(); raf = vis && (ambient || Math.abs(p - sp) > .0005 || !reduce) ? requestAnimationFrame(loop) : 0; }
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '100px 0px' }).observe(host);
    addEventListener('resize', function () { host._grown = 0; host.style.minHeight = ''; size(); });
    (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(size);
    size(); host.classList.add('dw-on');
  }
  function boot() { [].forEach.call(d.querySelectorAll('[data-dw]'), function (h) { try { mount(h); } catch (e) { console.warn('draw', e); } }); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
