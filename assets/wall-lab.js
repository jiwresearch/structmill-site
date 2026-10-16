/* Wall Lab: frame one wall, see the cut list and a single-job cutting plan.
   Demo packer (first-fit decreasing per stock length), not the production optimizer. */
(function () {
  var root = document.getElementById('wall-lab-app');
  if (!root) return;
  var s = { len: 18, height: 8, sp: 16, win: 1 };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var STUD = { 8: 92.625, 9: 104.625, 10: 116.625 };
  var RW = 36, RH = 48, HEAD = 82.5, roB = HEAD - RH, HDR = 7.25;
  var F = ['', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8'];
  var fmt = function (v) {
    var e = Math.round(v * 8) / 8;
    var fr = Math.round((e - Math.floor(e)) * 8);
    if (e >= 120) {
      var ft = Math.floor(e / 12), inch = Math.floor(e - ft * 12);
      return ft + "' " + inch + (fr ? '-' + F[fr] : '') + '"';
    }
    return Math.floor(e) + (fr ? '-' + F[fr] : '') + '"';
  };
  var COLOR = { 'Bottom plate': '#D4B57E', 'Top plate': '#D4B57E', 'Stud': '#E3C998', 'King': '#E3C998', 'Jack': '#DCC08C', 'Header': '#C9A86A', 'Sill': '#D4B57E', 'Cripple': '#EBD6AE' };
  var SHORT = { 'Bottom plate': 'PL', 'Top plate': 'TP', 'Stud': 'ST', 'King': 'KG', 'Jack': 'JK', 'Header': 'HD', 'Sill': 'SL', 'Cripple': 'CR' };
  var ORDER = ['Bottom plate', 'Top plate', 'Stud', 'King', 'Jack', 'Header', 'Sill', 'Cripple'];
  var STOCK = [96, 120, 144, 168, 192], KERF = 0.125;
  var pct = function (v, t) { return (v / t * 100).toFixed(3) + '%'; };

  function compute() {
    var L = s.len * 12, stud = STUD[s.height], studTop = 1.5 + stud, wallH = studTop + 3;
    var n = s.win;
    while (n > 0 && n * (RW + 6) + (n + 1) * 14 > L) n--;
    var wins = [], i;
    for (i = 0; i < n; i++) { var cx = L * (i + 1) / (n + 1); wins.push({ l: cx - RW / 2, r: cx + RW / 2 }); }
    var P = [];
    var add = function (role, dim, len, x, y, w, h, draw) { P.push({ role: role, dim: dim, len: len, x: x, y: y, w: w, h: h, draw: draw !== false }); };
    var k = Math.ceil(L / 192), seg = L / k;
    for (var j = 0; j < k; j++) {
      add('Bottom plate', '2x4', seg, j * seg, 0, seg, 1.5);
      add('Top plate', '2x4', seg, j * seg, studTop, seg, 1.5);
      add('Top plate', '2x4', seg, j * seg, studTop + 1.5, seg, 1.5);
    }
    var pos = [0];
    for (var x = s.sp - 0.75; x < L - 3; x += s.sp) pos.push(x);
    pos.push(L - 1.5);
    var cripAbove = studTop - (HEAD + HDR);
    pos.forEach(function (x) {
      var zone = false, inRO = false;
      wins.forEach(function (w) {
        if (x + 1.5 > w.l - 3 && x < w.r + 3) zone = true;
        if (x >= w.l && x + 1.5 <= w.r) inRO = true;
      });
      if (!zone) add('Stud', '2x4', stud, x, 1.5, 1.5, stud);
      else if (inRO) {
        add('Cripple', '2x4', roB - 3, x, 1.5, 1.5, roB - 3);
        if (cripAbove > 0.5) add('Cripple', '2x4', cripAbove, x, HEAD + HDR, 1.5, cripAbove);
      }
    });
    wins.forEach(function (w) {
      add('King', '2x4', stud, w.l - 3, 1.5, 1.5, stud);
      add('King', '2x4', stud, w.r + 1.5, 1.5, 1.5, stud);
      add('Jack', '2x4', HEAD - 1.5, w.l - 1.5, 1.5, 1.5, HEAD - 1.5);
      add('Jack', '2x4', HEAD - 1.5, w.r, 1.5, 1.5, HEAD - 1.5);
      add('Header', '2x8', RW + 3, w.l - 1.5, HEAD, RW + 3, HDR);
      add('Header', '2x8', RW + 3, w.l - 1.5, HEAD, RW + 3, HDR, false);
      add('Sill', '2x4', RW, w.l, roB - 1.5, RW, 1.5);
    });

    var g = {};
    P.forEach(function (p) {
      var key = p.dim + '|' + p.role + '|' + p.len.toFixed(3);
      if (!g[key]) g[key] = { dim: p.dim, role: p.role, len: p.len, qty: 0 };
      g[key].qty++;
    });
    var rows = Object.keys(g).map(function (key) { return g[key]; }).sort(function (a, b) { return (ORDER.indexOf(a.role) - ORDER.indexOf(b.role)) || (b.len - a.len); });

    var pack = function (items, stock) {
      var bins = [];
      items.slice().sort(function (a, b) { return b.len - a.len; }).forEach(function (p) {
        var b = bins.find(function (bb) { return bb.used + p.len + (bb.items.length ? KERF : 0) <= stock; });
        if (!b) { b = { stock: stock, used: 0, items: [] }; bins.push(b); }
        b.used += (b.items.length ? KERF : 0) + p.len;
        b.items.push(p);
      });
      return bins;
    };
    var optBins = [], baseTotal = 0, used = 0;
    ['2x4', '2x8'].forEach(function (dim) {
      var items = P.filter(function (p) { return p.dim === dim; });
      if (!items.length) return;
      var maxLen = Math.max.apply(null, items.map(function (p) { return p.len; }));
      var best = null;
      STOCK.filter(function (st) { return st >= maxLen; }).forEach(function (st) {
        var bins = pack(items, st), total = bins.length * st;
        if (!best || total < best.total || (total === best.total && bins.length < best.bins.length)) best = { bins: bins, total: total };
      });
      best.bins.forEach(function (b) { b.dim = dim; });
      optBins = optBins.concat(best.bins);
      items.forEach(function (p) { used += p.len; baseTotal += STOCK.find(function (st) { return st >= p.len; }); });
    });
    var optTotal = optBins.reduce(function (a, b) { return a + b.stock; }, 0);
    return { L: L, wallH: wallH, n: n, wins: wins, P: P, rows: rows, optBins: optBins, optTotal: optTotal, baseTotal: baseTotal, used: used };
  }

  var segStyle = function (on) { return 'min-height:44px;flex:1;padding:0 10px;border-radius:6px;border:1.5px solid #1C3A19;background:' + (on ? '#1C3A19' : '#FFFFFF') + ';color:' + (on ? '#FFFFFF' : '#1C3A19') + ';font:600 15px Archivo,system-ui,sans-serif;cursor:pointer'; };

  function render() {
    var r = compute(), L = r.L, wallH = r.wallH, n = r.n;
    $('wl-len-label').textContent = s.len + "'";
    $('wl-len').value = s.len;
    $('wl-win').textContent = n;
    var note = $('wl-note');
    if (n < s.win) { note.hidden = false; note.textContent = 'Only ' + n + ' window' + (n === 1 ? '' : 's') + ' fit this wall.'; } else note.hidden = true;
    Array.prototype.forEach.call(root.querySelectorAll('[data-h]'), function (b) { var on = +b.getAttribute('data-h') === s.height; b.setAttribute('aria-pressed', on); b.style.cssText = segStyle(on); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-sp]'), function (b) { var on = +b.getAttribute('data-sp') === s.sp; b.setAttribute('aria-pressed', on); b.style.cssText = segStyle(on); });

    var ratio = L / wallH;
    var elev = $('wl-elev');
    elev.style.maxWidth = Math.round(300 * ratio) + 'px';
    elev.style.aspectRatio = ratio.toFixed(4);
    elev.setAttribute('aria-label', 'Framing elevation of a ' + s.len + ' foot wall with ' + n + ' window' + (n === 1 ? '' : 's'));
    var h = '';
    r.wins.forEach(function (w) { h += '<div style="position:absolute;left:' + pct(w.l, L) + ';bottom:' + pct(roB, wallH) + ';width:' + pct(RW, L) + ';height:' + pct(RH, wallH) + ';background:#DDE7EA"></div>'; });
    r.P.filter(function (p) { return p.draw; }).forEach(function (p) {
      h += '<div style="position:absolute;left:' + pct(p.x, L) + ';bottom:' + pct(p.y, wallH) + ';width:' + pct(p.w, L) + ';height:' + pct(p.h, wallH) + ';min-width:2px;background:' + COLOR[p.role] + ';box-shadow:inset 0 0 0 1px #A88E5E"></div>';
    });
    elev.innerHTML = h;
    $('wl-caption').textContent = 'Elevation · ' + s.len + "' × " + s.height + "' · " + r.P.length + ' pieces';

    $('wl-opt-ft').textContent = Math.round(r.optTotal / 12) + ' ft';
    $('wl-base-ft').textContent = 'vs ' + Math.round(r.baseTotal / 12) + ' ft, one board per piece';
    $('wl-opt-waste').textContent = Math.round((1 - r.used / r.optTotal) * 100) + '%';
    $('wl-base-waste').textContent = 'vs ' + Math.round((1 - r.used / r.baseTotal) * 100) + '%';
    $('wl-boards').textContent = r.optBins.length;
    var counts = {};
    r.optBins.forEach(function (b) { var key = b.dim + ' × ' + (b.stock / 12) + "'"; counts[key] = (counts[key] || 0) + 1; });
    $('wl-mix').textContent = Object.keys(counts).map(function (key) { return counts[key] + ' of ' + key; }).join(', ');

    var shown = r.optBins.slice().sort(function (a, b) { return b.stock - a.stock; }).slice(0, 8);
    var ph = '';
    shown.forEach(function (b) {
      ph += '<div class="wl-plan-row" style="display:grid;grid-template-columns:56px minmax(0,1fr);gap:10px;align-items:center"><span style="font-size:13px;font-weight:600;color:#4F5A50">' + b.dim + ' ' + (b.stock / 12) + "'</span>" +
        '<div style="display:flex;height:30px;border-radius:3px;overflow:hidden;background:#B9AE97;width:' + pct(b.stock, 192) + '">';
      b.items.forEach(function (p) {
        ph += '<div title="' + esc(p.role + ' ' + fmt(p.len)) + '" style="flex:0 0 ' + pct(p.len, b.stock) + ';background:' + COLOR[p.role] + ';border-right:2px dashed #1C3A19;font-size:11px;font-weight:700;color:#1C3A19;display:flex;align-items:center;padding-left:6px;overflow:hidden">' + ((p.len / b.stock > 0.09) ? SHORT[p.role] : '') + '</div>';
      });
      ph += '<div style="flex:1;background:#B9AE97"></div></div></div>';
    });
    $('wl-plan').innerHTML = ph;
    var more = $('wl-more');
    if (r.optBins.length > 8) { more.hidden = false; more.textContent = '+ ' + (r.optBins.length - 8) + ' more boards'; } else more.hidden = true;

    $('wl-rows').innerHTML = r.rows.map(function (row) {
      return '<tr style="border-top:1px solid #E6E7E1"><td style="padding:8px 6px;font-weight:600">' + row.role + '</td><td style="padding:8px 6px">' + row.dim + '</td><td style="padding:8px 6px">' + fmt(row.len) + '</td><td style="padding:8px 6px;text-align:right">' + row.qty + '</td></tr>';
    }).join('');

    var body = 'Hi Joseph,\n\nI tried Wall Lab (' + s.len + "' wall, " + s.height + "' tall, " + s.sp + '" on center, ' + n + ' window' + (n === 1 ? '' : 's') + ').\n\nMy cut list is attached. I buy lumber from: \n\n';
    $('wl-send').href = 'mailto:joseph@structmill.com?subject=' + encodeURIComponent('My cut list') + '&body=' + encodeURIComponent(body);
  }

  $('wl-len').addEventListener('input', function (e) { s.len = Number(e.target.value); render(); });
  Array.prototype.forEach.call(root.querySelectorAll('[data-h]'), function (b) { b.addEventListener('click', function () { s.height = +b.getAttribute('data-h'); render(); }); });
  Array.prototype.forEach.call(root.querySelectorAll('[data-sp]'), function (b) { b.addEventListener('click', function () { s.sp = +b.getAttribute('data-sp'); render(); }); });
  $('wl-down').addEventListener('click', function () { var n = compute().n; s.win = Math.max(0, Math.min(s.win, n) - 1); render(); });
  $('wl-up').addEventListener('click', function () { s.win = Math.min(4, s.win + 1); render(); });
  render();
})();
