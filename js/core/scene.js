/* SWITCH — 舞台（背景・カメラ・押せる場所）
   舞台は 1920x1080 の座標で作り、画面サイズに合わせて拡大・移動する。
   画面に入りきらないときは、指やマウスでドラッグして見回せる。 */
(function (SW) {
  'use strict';
  var W = 1920, H = 1080, MIN_SCALE = 0.52;
  var stage = document.getElementById('stage'), el = document.getElementById('scene');
  var cam = { x: W / 2, y: H / 2, zoom: 1 }, scale = 1, taps = {}, dragged = false;
  var S = SW.scene = { locked: false };

  function apply(ms, ease) {
    var vw = stage.clientWidth, vh = stage.clientHeight;
    scale = Math.max(vw / W, vh / H, MIN_SCALE) * cam.zoom;
    var tx = Math.min(0, Math.max(vw - W * scale, vw / 2 - cam.x * scale));
    var ty = Math.min(0, Math.max(vh - H * scale, vh / 2 - cam.y * scale));
    el.style.transition = ms ? 'transform ' + ms + 'ms ' + (ease || 'cubic-bezier(.45,.05,.25,1)') : 'none';
    el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(' + scale.toFixed(4) + ')';
    /* 画面端で止まったぶんを、カメラ位置にも反映しておく */
    cam.x = (vw / 2 - tx) / scale; cam.y = (vh / 2 - ty) / scale;
  }
  window.addEventListener('resize', function () { apply(0); });

  /* カメラを動かす。x,y は舞台の座標。zoom は 1 が標準 */
  S.focus = function (x, y, zoom, ms, ease) {
    if (x != null) cam.x = x; if (y != null) cam.y = y; if (zoom != null) cam.zoom = zoom;
    apply(ms == null ? 1400 : ms, ease);
  };
  /* 画面が舞台より狭い（見回しが必要）かどうか */
  S.isNarrow = function () { return stage.clientWidth < W * scale - 4; };

  S.mount = function (html) { el.innerHTML = html; taps = {}; cam = { x: W / 2, y: H / 2, zoom: 1 }; apply(0); };
  S.clear = function () { el.innerHTML = ''; taps = {}; };
  S.$ = function (sel) { return el.querySelector(sel); };

  /* 押せる場所を置く。rect = [x, y, 幅, 高さ] */
  S.hotspot = function (id, rect, label, onTap) {
    var b = document.createElement('button');
    b.className = 'hotspot'; b.dataset.id = id; b.setAttribute('aria-label', label);
    b.style.cssText = 'left:' + rect[0] + 'px;top:' + rect[1] + 'px;width:' + rect[2] + 'px;height:' + rect[3] + 'px';
    el.appendChild(b); taps[id] = onTap;
    return b;
  };
  S.hint = function (id, on) {
    var b = el.querySelector('.hotspot[data-id="' + id + '"]'); if (b) b.classList.toggle('hint', !!on);
  };

  el.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.hotspot');
    if (!b || dragged || S.locked || SW.paused) return;
    var fn = taps[b.dataset.id]; if (fn) SW.guard(fn)();
  });

  /* ドラッグで見回す */
  var down = null;
  stage.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y }; dragged = false; });
  window.addEventListener('pointermove', function (e) {
    if (!down || S.locked) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!dragged && Math.abs(dx) + Math.abs(dy) < 12) return;
    dragged = true;
    cam.x = down.cx - dx / scale; cam.y = down.cy - dy / scale; apply(0);
  });
  function up() { down = null; setTimeout(function () { dragged = false; }, 0); }
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);

  /* フィルムの粒子（画面全体にうっすら重ねる） */
  (function () {
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), im = x.createImageData(256, 256), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    document.getElementById('fx-grain').style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
  })();
})(window.SW);
