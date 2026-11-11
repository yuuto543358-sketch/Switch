/* ============================================================
   SWITCH — CHAPTER 03 : THE STATION
   舞台：灯ヶ丘駅の改札前 → 駅務室
   第2章の翌日（11月17日）。帰りの駅で、20時17分を迎える。

   前の章から受け取る記録
     ch02_watched … 冒頭のひとことが変わる

   次の章へ引き継ぐ記録（SW.game.flags）
     ch03_freeCan  … 自動販売機から、お金を入れずに缶が出てきた
     ch03_sync     … 構内の明かりと、11年前の映像が連動するのを見た
     ch03_answered … 美咲の「見つけた。」に、マイクで応えたか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var CALL = 'CALL_STATION_01', VEND = 'VENDING_01', L = 'LIGHT_STATION_01', CCTV = 'CCTV_01', SEL = 'CCTV_SELECT_01',
      PA = 'BROADCAST_01', BOARD = 'BOARD_01';
  var YEAR = new Date().getFullYear() - 11;

  var v, hooks, snd, raf, dk;
  var imgGate = new Image(); imgGate.src = SW.IMAGES.ch03_gate;
  var thumbGate = S.thumb(imgGate, 115, 65);

  function q(c) { return S.$(c); }
  function ren(t) { return { who: '蓮', text: t }; }
  function pa(t) { return { who: '構内放送', text: t, voice: true }; }
  function misaki(t) { return { who: '美咲', text: t, voice: true, slow: true }; }
  var LED = 'font-family:"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif;font-weight:700;';

  /* ================= 改札前 ================= */
  var HTML_GATE =
    '<img class="ly" src="' + SW.IMAGES.ch03_gate + '" alt="" draggable="false">' +
    '<div class="abs c3-can"></div>' +
    '<div class="abs c3-dim"></div>' +
    '<div class="abs c3-tube" style="left:314px"></div><div class="abs c3-tube" style="left:844px"></div><div class="abs c3-tube" style="left:1374px"></div>' +
    '<div class="abs c3-board"><p></p><p></p></div>' +
    '<div class="abs c3-clock">20:14</div>' +
    '<div class="abs c3-camled"></div>' +
    '<div class="abs c3-vbtn"></div>' +
    '<div class="abs c3-call"></div>' +
    '<div class="abs c3-ajar"></div>' +
    '<style>' +
    '.c3-can{left:196px;top:754px;width:40px;height:20px;border-radius:5px;background:linear-gradient(#e0483c,#9c261d);box-shadow:inset 0 3px 0 rgba(255,255,255,.35);opacity:0}' +
    '.c3-can.on{opacity:1}' +
    '.c3-dim{left:0;top:0;width:1920px;height:1080px;background:#04060a;opacity:0}' +
    '.c3-tube{top:85px;width:232px;height:11px;border-radius:5px;background:#f6fff6;box-shadow:0 0 12px 4px rgba(235,255,238,.9),0 0 60px 20px rgba(220,255,228,.4)}' +
    '.c3-board{left:726px;top:156px;width:468px;height:76px;overflow:hidden;' + LED + 'font-size:27px;line-height:38px;color:#ff9a2e;text-shadow:0 0 5px rgba(255,140,40,.9),0 0 14px rgba(255,120,20,.45);white-space:pre;padding-left:10px;box-sizing:border-box;letter-spacing:1px}' +
    '.c3-board p{margin:0;height:38px}.c3-board p:nth-child(2){color:#7dff8a;text-shadow:0 0 5px rgba(90,255,120,.8)}' +
    '.c3-board.alert p{color:#ff4a3a;text-shadow:0 0 5px rgba(255,70,50,.9),0 0 14px rgba(255,50,30,.5)}' +
    '.c3-clock{left:1226px;top:162px;width:118px;height:60px;font:500 34px/60px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '.c3-camled{left:697px;top:143px;width:6px;height:6px;border-radius:50%;background:#ff4a3a;box-shadow:0 0 6px 2px rgba(255,60,40,.9);animation:c3blink 2.4s steps(1) infinite}' +
    '@keyframes c3blink{0%{opacity:1}50%{opacity:.25}}' +
    '.c3-vbtn{left:192px;top:406px;width:27px;height:14px;border-radius:3px;opacity:0;background:#9fd0ff;box-shadow:0 0 8px 3px rgba(140,200,255,.9)}' +
    '.c3-vbtn.on{opacity:1}' +
    '.c3-call{left:1731px;top:485px;width:38px;height:38px;border-radius:50%;opacity:0;box-shadow:0 0 0 3px rgba(255,120,100,.95) inset,0 0 14px 5px rgba(255,80,60,.8)}' +
    '.c3-call.on{opacity:1}' +
    '.c3-ajar{left:1810px;top:298px;width:26px;height:500px;opacity:0;transition:opacity 1.4s;background:linear-gradient(90deg,rgba(240,255,244,.95),rgba(240,255,244,.5));box-shadow:0 0 30px 8px rgba(230,255,238,.4)}' +
    '.c3-ajar.on{opacity:1}' +
    '</style>';

  function setBoard(a, b, alert) {
    var p = S.$('.c3-board') || S.$('.c3-rep'); if (!p) return;
    p.children[0].textContent = a; p.children[1].textContent = b; p.classList.toggle('alert', !!alert);
  }
  function setClock(t) { v.clock = t; q('.c3-clock').textContent = t; }
  function dim(to, ms) { var d = q('.c3-dim'); d.style.transition = 'opacity ' + (ms || 0) + 'ms'; d.style.opacity = to; }

  function buildGate() {
    v = { scene: 'gate', clock: '20:14', ops: 0, canOut: false };
    hooks = {}; snd = {};
    S.mount(HTML_GATE);
    setBoard('20:21 普通　　汐見ヶ浜', '20:36 普通　　汐見ヶ浜');
    S.hotspot(CALL, [1696, 420, 108, 156], '係員呼び出しボタン', function () {
      v.ops++; S.hint(CALL, false);
      if (hooks.call) return hooks.call();
    });
    S.hotspot(VEND, [96, 316, 258, 300], '自動販売機のボタン', function () {
      v.ops++;
      var on = SWT.toggle(VEND, 'player'); q('.c3-vbtn').classList.toggle('on', on);
      if (!v.canOut) {
        v.canOut = true; SW.game.flags.ch03_freeCan = true; SWT.event(VEND, 'free_can');
        A.se('clunk'); setTimeout(function () { var c = q('.c3-can'); if (c) c.classList.add('on'); }, 300);
        U.note('自動販売機のボタンを押した。——小銭も入れていないのに、缶が落ちてきた。');
      } else { A.se('tick'); U.note(on ? 'もう一度押した。ランプが点くだけで、今度は何も出てこない。' : 'ボタンのランプが消えた。取り出し口には、さっきの缶が残っている。'); }
    });
    S.hotspot('LOOK_BOARD', [716, 146, 630, 96], '発車標', function () { if (hooks.board) hooks.board(); });
    S.hotspot('LOOK_CAM', [656, 100, 88, 60], '防犯カメラ', function () { if (hooks.cam) hooks.cam(); });
    S.hotspot('LOOK_GATE', [660, 620, 560, 190], '改札機', function () { if (hooks.gate) hooks.gate(); });
    S.hotspot('LOOK_DOOR', [1808, 296, 112, 504], '駅務室のドア', function () { if (hooks.door) hooks.door(); });
    SWT.define(CALL, false); SWT.define(VEND, false);
    snd.amb = A.loop('station', 0.6, 2.5); snd.hum = A.loop('hum', 0.5, 1.5);
  }

  async function ringCall() {
    var me = v;
    if (v.ringing) { U.note('呼び出し音が、まだ鳴っている。'); return; }
    v.ringing = true;
    SWT.set(CALL, true, 'player'); q('.c3-call').classList.add('on'); A.se('ring_tone');
    U.note('係員呼び出しのボタンを押した。呼び出し音が鳴る。');
    await SW.wait(2600); if (v !== me) return;
    q('.c3-call').classList.remove('on'); SWT.set(CALL, false, 'system'); v.ringing = false;
    if (v.scene === 'gate' && !S.locked) U.note('……誰も、出ない。');
  }

  /* ============================================================
     場面 1 : 改札前。20時14分 → 20時17分
     ============================================================ */
  async function beatGate() {
    SW.checkpoint('start');
    var f = SW.game.flags;
    await SW.wait(600);
    await U.say([
      '翌日。十一月十七日。',
      '四〇四号室の写真は、上着の内ポケットに入れてある。',
      f.ch02_watched === false ? 'あの消えた画面に映り込んだ顔を、一日じゅう思い出していた。'
        : f.ch02_watched ? '「そこに、いるのは」——あの言葉の続きを、一日じゅう考えていた。'
        : '裏に書かれた名前を、一日じゅう考えていた。',
      '帰りの電車を降りたのは、俺ひとりだった。'
    ]);
    S.focus(960, 540, 1, 0);
    U.fade(0, 2600);
    await SW.wait(1200);
    await U.card('CHAPTER 03', 'THE STATION', 3400);
    await SW.wait(700);
    await U.say([
      '灯ヶ丘駅。二十時十四分。',
      '改札にも、窓口にも、駅員の姿がない。',
      ren('……こんな時間に、無人になる駅じゃない。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    hooks.call = function () { return ringCall(); };
    hooks.board = function () { U.note('発車標。次の電車は、二十時二十一分。時計は、' + (v.clock === '20:14' ? '二十時十四分' : v.clock === '20:15' ? '二十時十五分' : '二十時十六分') + 'を指している。'); };
    hooks.cam = function () { U.note('天井の防犯カメラ。赤いランプが、ゆっくりと瞬いている。'); };
    hooks.gate = function () { U.note('改札機は、通れる状態のまま。通る人は、誰もいない。'); };
    hooks.door = function () { U.note('駅務室のドア。鍵が掛かっている。'); };
    await SW.wait(2600);
    if (!v.ops) S.hint(CALL, true);
    /* 時計が進む。スイッチを押すと、そのぶん早く進む */
    var t = 0, o = 0;
    while (t < 9000) { await SW.wait(200); t += 200 + (v.ops - o) * 2500; o = v.ops; }
    setClock('20:15'); A.se('tick');
    t = 0; while (t < 9000) { await SW.wait(200); t += 200 + (v.ops - o) * 2500; o = v.ops; }
    setClock('20:16'); A.se('tick');
    t = 0; while (t < 8000) { await SW.wait(200); t += 200 + (v.ops - o) * 2500; o = v.ops; }
    await SW.until(function () { return !v.ringing; });

    /* 20時17分 */
    hooks = {}; S.hint(CALL, false); U.noteHide(); S.locked = true;
    setClock('20:17'); A.se('tick');
    await SW.wait(700);
    dim(.75, 60); await SW.wait(120); dim(.1, 60); await SW.wait(200); dim(.6, 50); await SW.wait(90); dim(0, 400);
    A.se('light_tink');
    S.focus(960, 420, 1.08, 2600);
    setBoard('▒▒:▒▒ ▒▒　　▒▒▒▒▒', '▒▒:▒▒ ▒▒　　▒▒▒▒▒');
    await SW.wait(700);
    setBoard('全線　運転見合わせ', '20:17 現在', true); SWT.event(BOARD, 'changed_at_2017');
    await SW.wait(900);
    A.se('pa_chime');
    await SW.wait(2300);
    S.locked = false;
    await U.say([
      pa('お客様に、お知らせいたします。'),
      pa('二十時十七分ごろ、市内全域で、大規模な停電が発生しました。'),
      pa('ただいま、全線で運転を見合わせております。'),
      pa('灯ヶ丘総合病院方面へお急ぎのお客様は——')
    ]);
    A.se('crackle');
    await SW.wait(900);
    snd.pa = A.loop('pa_voice', 0.2, 1.5);
    await U.say([
      ren('……停電？ 明かりは、点いている。'),
      '放送は、同じ文句を、最初から繰り返しはじめた。',
      '時計は、二十時十七分を指したまま、動かない。'
    ]);
    S.focus(1500, 540, 1, 2400);

    var opened = false;
    hooks.call = function () { opened = true; };
    hooks.board = function () { U.note('発車標は「全線　運転見合わせ」に変わっている。次の電車の表示は、消えた。'); };
    hooks.cam = function () { U.note('防犯カメラのランプが、赤く点いている。レンズは、こちらを向いている。'); };
    hooks.gate = function () { U.note('改札機の向こうは暗い。ホームから、電車の音は聞こえてこない。'); };
    hooks.door = function () { U.note('駅務室のドア。鍵は掛かったままだ。放送は、この中から流れているはずだ。'); };
    await SW.wait(1500);
    S.hint(CALL, true);
    if (!(await SW.until(function () { return opened; }, 18000))) {
      U.note('放送を流している誰かが、駅務室にいるはずだ。呼び出しボタンを——');
      await SW.until(function () { return opened; });
    }
    hooks = {}; S.hint(CALL, false); U.noteHide();
    SWT.set(CALL, true, 'player'); SWT.event(CALL, 'door_unlocked');
    q('.c3-call').classList.add('on'); A.se('beep');
    await SW.wait(900);
    A.se('lock'); q('.c3-call').classList.remove('on'); SWT.set(CALL, false, 'system');
    await SW.wait(900);
    q('.c3-ajar').classList.add('on'); A.se('creak');
    S.focus(1700, 540, 1.1, 2600);
    await SW.wait(1500);
    await U.say([
      '呼び出しボタンを押すと、呼び出し音のかわりに、すぐ横で鍵の開く音がした。',
      '駅務室のドアが、わずかに開いている。',
      ren('……すみません。どなたか、いますか。'),
      '返事はない。放送だけが、中から聞こえてくる。'
    ]);
    v.scene = 'leaving';
    await U.fade(1, 1500);
  }

  /* ================= 駅務室 ================= */
  var HTML_OFFICE =
    '<img class="ly" src="' + SW.IMAGES.ch03_office + '" alt="" draggable="false">' +
    '<div class="abs c3-rocker"></div>' +
    '<div class="abs c3-bsw"><i></i></div>' +
    '<canvas class="ly c3-dark" width="640" height="360"></canvas>' +
    '<div class="abs c3-glow"></div>' +
    '<canvas class="abs c3-tv" width="230" height="130"></canvas>' +
    '<div class="abs c3-tvled"></div>' +
    '<div class="abs c3-sel a">1</div><div class="abs c3-sel b">2</div>' +
    '<div class="abs c3-rep"><p></p><p></p></div>' +
    '<div class="abs c3-air">放送</div>' +
    '<div class="abs c3-clock">20:17</div>' +
    '<style>' +
    '.c3-rocker{left:358px;top:452px;width:40px;height:62px;border-radius:3px;box-shadow:0 0 0 1px #77797b,1px 2px 3px rgba(0,0,0,.3);background:linear-gradient(100deg,#c9c9c0 0%,#ebebe4 45%,#e6e6de 100%)}' +
    '.c3-rocker.off{background:linear-gradient(100deg,#dcdcd4 0%,#f1f1ea 55%,#cfcfc6 100%)}' +
    '.c3-bsw{left:1700px;top:360px;width:74px;height:36px;border-radius:4px;background:#2a2d31;box-shadow:0 0 0 1px #15171a,inset 0 2px 4px rgba(0,0,0,.6)}' +
    '.c3-bsw i{position:absolute;top:4px;left:40px;width:30px;height:28px;border-radius:3px;background:linear-gradient(#f1f1ea,#b9b9b0);transition:left .08s}' +
    '.c3-bsw.off i{left:4px}' +
    '.c3-dark{mix-blend-mode:multiply;opacity:0}' +
    '.c3-glow{left:330px;top:60px;width:1060px;height:760px;mix-blend-mode:screen;opacity:0;background:radial-gradient(ellipse at 50% 46%,rgba(150,200,175,.4) 0%,rgba(90,130,110,.12) 40%,transparent 68%)}' +
    '.c3-tv{left:630px;top:262px;width:460px;height:259px;opacity:0;transition:opacity .2s}' +
    '.c3-tvled{left:1070px;top:540px;width:8px;height:4px;border-radius:2px;background:#ff3b2f;box-shadow:0 0 5px 1px rgba(255,60,40,.8)}' +
    '.c3-tvled.on{background:#5dff8f;box-shadow:0 0 5px 1px rgba(80,255,140,.8)}' +
    '.c3-sel{top:610px;width:54px;height:30px;border-radius:3px;font:700 17px/30px sans-serif;text-align:center;color:#55585c;background:#1a1c1f;box-shadow:0 0 0 1px #000}' +
    '.c3-sel.a{left:796px}.c3-sel.b{left:870px}' +
    '.c3-sel.on{color:#eafff0;background:#1f7a45;box-shadow:0 0 0 1px #000,0 0 10px 3px rgba(80,255,150,.55)}' +
    '.c3-rep{left:1516px;top:266px;width:298px;height:86px;overflow:hidden;' + LED + 'font-size:22px;line-height:40px;color:#ff4a3a;text-shadow:0 0 5px rgba(255,70,50,.9),0 0 14px rgba(255,50,30,.5);white-space:pre;padding:3px 0 0 10px;box-sizing:border-box}' +
    '.c3-rep p{margin:0;height:40px}.c3-rep.off{visibility:hidden}' +
    '.c3-air{left:1236px;top:674px;width:54px;height:34px;border-radius:4px;font:700 14px/34px sans-serif;text-align:center;color:#5a2a26;background:#2a1513;box-shadow:0 0 0 1px #000}' +
    '.c3-air.on{color:#fff0ec;background:#d8392c;box-shadow:0 0 0 1px #000,0 0 12px 4px rgba(255,70,50,.7)}' +
    '.c3-clock{left:1226px;top:150px;width:150px;height:70px;font:500 40px/70px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '</style>';

  function darkOffice(on) {
    function g(f, inner) { return '<g filter="url(#b' + f + ')" style="mix-blend-mode:lighten">' + inner + '</g>'; }
    return '<defs><filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
      '<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>' +
      '<rect width="1920" height="1080" fill="#05070a"/>' +
      g(30, '<ellipse cx="1300" cy="185" rx="110" ry="66" fill="#14301c"/>') +
      (on.tv ? g(60, '<ellipse cx="860" cy="420" rx="540" ry="390" fill="#2c3a36"/><ellipse cx="860" cy="770" rx="500" ry="130" fill="#34443f"/>') : '') +
      (on.rep ? g(30, '<ellipse cx="1665" cy="320" rx="220" ry="130" fill="#3a1a14"/>') : '') +
      (on.air ? g(30, '<ellipse cx="1263" cy="690" rx="120" ry="80" fill="#3a1512"/>') : '');
  }

  function setLight(on, animate) {
    v.light = on; var d = q('.c3-dark');
    q('.c3-rocker').classList.toggle('off', !on);
    if (d.getAnimations) d.getAnimations().forEach(function (a) { a.cancel(); });
    d.style.opacity = on ? 0 : 1;
    if (animate && d.animate) {
      if (on) d.animate([{ opacity: 1 }, { opacity: .3, offset: .06 }, { opacity: .95, offset: .16 }, { opacity: .9, offset: .34 },
        { opacity: .15, offset: .42 }, { opacity: .7, offset: .55 }, { opacity: .05, offset: .72 }, { opacity: 0 }], { duration: 820 });
      else d.animate([{ opacity: 0 }, { opacity: .86, offset: .35 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
    }
    if (on) { if (animate) A.se('light_tink'); if (!snd.hum) snd.hum = A.loop('hum', 0.5, 0.8); }
    else if (snd.hum) { snd.hum.stop(0.05); snd.hum = null; }
  }
  function setTV(on) {
    v.tv = on; q('.c3-tv').style.opacity = on ? 1 : 0; q('.c3-tvled').classList.toggle('on', on);
    dk.set('tv', on); if (!on) q('.c3-glow').style.opacity = 0;
    q('.c3-sel.a').classList.toggle('on', on && v.cam === 1); q('.c3-sel.b').classList.toggle('on', on && v.cam === 2);
    if (on && !snd.static) snd.static = A.loop('static', 0.001, 0.05);
    if (snd.static) snd.static.vol(on ? 0.03 : 0, 0.2);
  }
  function setCam(n) { v.cam = n; setTV(v.tv); }
  function setAir(on) { q('.c3-air').classList.toggle('on', on); dk.set('air', on); }
  function setRep(on) { q('.c3-rep').classList.toggle('off', !on); q('.c3-bsw').classList.toggle('off', !on); dk.set('rep', on); }

  /* ---------- 防犯カメラの映像（11年前の今日） ---------- */
  var low = document.createElement('canvas'); low.width = 115; low.height = 65;
  var nz = document.createElement('canvas'); nz.width = 115; nz.height = 65;
  var crowd = [], far = [];
  (function () {   // 人波の位置（毎回同じになるように、決まった数列で並べる）
    var s = 7; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 46; i++) crowd.push({ x: 4 + r() * 107, y: 45 + r() * 19, p: r() * 6.3, d: 0.06 + r() * 0.1 });
    crowd.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < 26; i++) far.push({ t: 0.12 + r() * 0.7, o: (r() - .5) * 0.8, p: r() * 6.3 });
    far.sort(function (a, b) { return a.t - b.t; });
  })();
  function person(c, x, y, h, col) {
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y - h * 0.86, h * 0.13, h * 0.15, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x - h * 0.24, y); c.quadraticCurveTo(x - h * 0.26, y - h * 0.68, x, y - h * 0.72); c.quadraticCurveTo(x + h * 0.26, y - h * 0.68, x + h * 0.24, y); c.fill();
  }
  function drawCam1(now) {
    var c = low.getContext('2d'), i, p;
    c.drawImage(thumbGate, 0, 0);
    c.fillStyle = v.light ? 'rgba(30,52,40,.42)' : 'rgba(2,5,4,.9)'; c.fillRect(0, 0, 115, 65);
    for (i = 0; i < crowd.length; i++) {
      p = crowd[i];
      person(c, p.x + Math.sin(now / 900 + p.p) * 0.5, p.y + 4, 9 + (p.y - 45) * 0.5, 'rgba(' + (8 + i % 5 * 4) + ',' + (12 + i % 4 * 4) + ',' + (11 + i % 3 * 4) + ',' + (v.light ? .94 : .6) + ')');
    }
  }
  function drawCam2(now) {
    var c = low.getContext('2d'), k, i, p;
    c.fillStyle = '#060a09'; c.fillRect(0, 0, 115, 65);
    // ホームの屋根と蛍光灯
    c.fillStyle = '#1a2420'; c.beginPath(); c.moveTo(0, 0); c.lineTo(115, 0); c.lineTo(115, 12); c.lineTo(64, 20); c.lineTo(0, 9); c.fill();
    // ホームの床と黄色い線
    c.fillStyle = '#3a4640'; c.beginPath(); c.moveTo(22, 65); c.lineTo(60, 24); c.lineTo(72, 24); c.lineTo(115, 52); c.lineTo(115, 65); c.fill();
    c.fillStyle = '#8a7f3a'; c.beginPath(); c.moveTo(30, 65); c.lineTo(61, 25); c.lineTo(62.5, 25); c.lineTo(38, 65); c.fill();
    // 線路
    c.fillStyle = '#0d1211'; c.beginPath(); c.moveTo(0, 65); c.lineTo(22, 65); c.lineTo(60, 24); c.lineTo(52, 24); c.lineTo(0, 46); c.fill();
    c.strokeStyle = '#38423e'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(4, 65); c.lineTo(57, 24.5); c.moveTo(-10, 62); c.lineTo(54, 24.5); c.stroke();
    if (v.light) {
      for (i = 0; i < 5; i++) { var t = i / 5, x = 84 - t * 20, y = 9 + t * 9, r = 9 - t * 6;
        k = c.createRadialGradient(x, y, 0.5, x, y, r); k.addColorStop(0, 'rgba(230,255,240,.9)'); k.addColorStop(1, 'rgba(170,220,190,0)'); c.fillStyle = k; c.fillRect(x - r, y - r, r * 2, r * 2); }
      k = c.createLinearGradient(0, 24, 0, 65); k.addColorStop(0, 'rgba(170,215,190,.05)'); k.addColorStop(1, 'rgba(170,215,190,.2)'); c.fillStyle = k; c.fillRect(22, 24, 93, 41);
    }
    // 奥の人波
    for (i = 0; i < far.length; i++) { p = far[i]; var s = p.t;
      person(c, 66 + s * 34 + p.o * s * 24 + Math.sin(now / 1000 + p.p) * 0.3, 26 + s * 34, 3 + s * 13, 'rgba(9,13,12,' + (v.light ? .95 : .7) + ')'); }
    // ひとりだけ、カメラを見上げている
    var wx = 58, wy = 63;
    c.fillStyle = v.light ? '#aab4ac' : '#3a423e'; c.beginPath(); c.moveTo(wx - 8, wy + 2); c.quadraticCurveTo(wx - 8.5, wy - 15, wx, wy - 16); c.quadraticCurveTo(wx + 8.5, wy - 15, wx + 8, wy + 2); c.fill();
    c.fillStyle = '#0d100f'; c.beginPath(); c.ellipse(wx, wy - 21, 5.4, 5.6, 0, 0, 7); c.fill(); c.fillRect(wx - 5.4, wy - 21, 2.2, 7); c.fillRect(wx + 3.2, wy - 21, 2.2, 7);
    c.fillStyle = v.light ? '#b9a696' : '#5a534c'; c.beginPath(); c.ellipse(wx, wy - 21.6, 3.5, 4.2, 0, 0, 7); c.fill();
    c.fillStyle = '#0d100f'; c.beginPath(); c.ellipse(wx, wy - 25.2, 4.3, 1.9, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(14,12,12,.8)'; c.fillRect(wx - 2.2, wy - 22.6, 1.3, 0.8); c.fillRect(wx + 0.9, wy - 22.6, 1.3, 0.8);
    var m = v.mouth ? 0.3 + Math.abs(Math.sin(now / 95)) * 0.8 : 0.3;
    c.fillStyle = 'rgba(40,20,20,.8)'; c.beginPath(); c.ellipse(wx, wy - 19.3, 1, m, 0, 0, 7); c.fill();
    if (!v.light) { c.fillStyle = 'rgba(2,5,4,.55)'; c.fillRect(0, 0, 115, 65); }
  }
  function drawNoise() {
    var c = nz.getContext('2d'), im = c.createImageData(115, 65), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var n = Math.random() * 255; d[i] = n * .9; d[i + 1] = n; d[i + 2] = n * .95; d[i + 3] = 255; }
    c.putImageData(im, 0, 0);
  }
  var lastT = 0, frame = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 60 || !v || v.scene !== 'office' || !v.tv || !q('.c3-tv')) return;
    lastT = now; frame++;
    var c = q('.c3-tv').getContext('2d');
    drawNoise(); if (v.cam === 1) drawCam1(now); else drawCam2(now);
    c.globalAlpha = 1; c.drawImage(low, 0, 0, 230, 130);
    c.globalAlpha = 0.17 + v.noise; c.drawImage(nz, 0, 0, 230, 130); c.globalAlpha = 1;
    if (Math.random() < 0.07 + v.noise) { var y = Math.random() * 120 | 0, h = 2 + Math.random() * 8 | 0; c.drawImage(q('.c3-tv'), 0, y, 230, h, (Math.random() - .5) * 22, y, 230, h); }
    c.fillStyle = 'rgba(210,255,225,.06)'; c.fillRect(0, (now / 15) % 170 - 30, 230, 20);
    c.font = '7px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(235,245,238,.88)';
    var sec = Math.floor(now / 1000) % 60;
    c.fillText(YEAR + '/11/17 20:17:' + (sec < 10 ? '0' : '') + sec, 138, 124);
    c.fillText(v.cam === 1 ? 'CAM1 改札' : 'CAM2 ホーム', 6, 11);
    c.fillStyle = 'rgba(0,0,0,.2)'; for (var s = 0; s < 130; s += 2) c.fillRect(0, s, 230, 1);
    q('.c3-glow').style.opacity = ((0.2 + Math.random() * 0.05) * (v.light ? 0.25 : 1)).toFixed(3);
  }

  function buildOffice() {
    v = { scene: 'office', light: true, tv: false, cam: 1, noise: 0, mouth: false };
    hooks = {}; snd = snd || {};
    S.mount(HTML_OFFICE);
    dk = S.shade(q('.c3-dark'), darkOffice);
    SWT.define(L, true); SWT.define(CCTV, false); SWT.define(SEL, false); SWT.define(PA, true); SWT.define(BOARD, true);
    S.hotspot(L, [314, 394, 128, 162], '構内照明のスイッチ', function () {
      var on = SWT.toggle(L, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setLight(on, true); S.hint(L, false);
      if (hooks.light) hooks.light(on);
    });
    S.hotspot(CCTV, [900, 522, 200, 48], 'モニターの電源', function () { S.hint(CCTV, false); if (hooks.cctv) return hooks.cctv(); });
    S.hotspot('LOOK_SCREEN', [630, 262, 460, 256], 'モニターの画面', function () { if (hooks.screen) hooks.screen(); });
    S.hotspot(SEL, [770, 594, 180, 86], 'カメラ切替', function () { S.hint(SEL, false); if (hooks.sel) return hooks.sel(); });
    S.hotspot(PA, [1150, 540, 330, 190], '構内放送のスイッチ', function () { S.hint(PA, false); if (hooks.pa) return hooks.pa(); });
    S.hotspot(BOARD, [1500, 250, 330, 190], '案内表示のスイッチ', function () { if (hooks.boardsw) return hooks.boardsw(); });
    S.hotspot('LOOK_CAP', [468, 640, 190, 90], '制帽', function () { U.note('駅員の制帽。まだ、かすかに温かい気がした。'); });
    setLight(true, false); setTV(false); setAir(true); setRep(true);
    setBoard('全線　運転見合わせ', '20:17 現在', true);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    if (!snd.amb) snd.amb = A.loop('station', 0.5, 2);
    if (!snd.pa) snd.pa = A.loop('pa_voice', 0.3, 1.5); else snd.pa.vol(0.3, 1.5);
  }

  /* ============================================================
     場面 2 : 駅務室
     ============================================================ */
  async function beatOffice() {
    SW.checkpoint('office');
    snd = snd || {};
    buildOffice();
    S.focus(900, 470, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2400);
    await U.say([
      '駅務室。机の上に、制帽が置かれたままになっている。',
      '誰もいない。構内放送のスイッチは入ったままで、赤いランプが点いている。',
      ren('……誰が、流しているんだ。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);

    var seen1 = false, seen2 = false, busy = false, sync = false;
    function lightNote(on) {
      if (v.tv) {
        if (!sync) { sync = true; SW.game.flags.ch03_sync = true; SWT.event(L, 'synced_with_past'); }
        U.note(on ? '明かりを戻すと、モニターの中の駅にも、明かりが戻った。' : '構内の明かりを消した。——モニターの中の駅も、同時に暗くなった。');
      } else U.note(on ? '構内の明かりを点けた。' : SWT.isOn(PA) ? '構内の明かりを消した。放送のランプだけが、机の上で赤く光っている。' : '構内の明かりを消した。部屋は、ほとんど真っ暗になった。');
    }
    hooks.light = lightNote;
    hooks.pa = function () {
      var on = SWT.toggle(PA, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setAir(on);
      U.note(on ? 'スイッチを入れた。ランプが赤く点く。放送は、同じ文句を繰り返している。' : '放送のスイッチを切った。ランプは消えた。……それでも、放送は止まらない。');
    };
    hooks.boardsw = function () {
      var on = SWT.toggle(BOARD, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setRep(on);
      U.note(on ? '案内表示を点けた。表示は「全線　運転見合わせ」のままだ。' : '案内表示を消した。改札の発車標も、消えたはずだ。');
    };
    hooks.screen = function () {
      U.note(!v.tv ? 'モニターは消えている。黒い画面に、部屋が映り込んでいる。'
        : v.cam === 1 ? '人であふれた改札。隅の日付は、' + YEAR + '年十一月十七日。' : 'ホームの映像。時刻は、二十時十七分から進まない。');
    };
    hooks.cctv = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(CCTV, 'player'); A.se(on ? 'tv_on' : 'tv_off'); setTV(on);
      if (on && !seen1) {
        busy = true; seen1 = true; U.noteHide(); SWT.event(CCTV, 'saw_past');
        S.focus(860, 420, 1.12, 2600);
        await SW.wait(1500);
        await U.say([
          v.cam === 1 ? 'モニターに、改札が映る。さっきまで、俺が立っていた場所だ。' : 'モニターが点いた。映っているのは、この駅のホームだ。',
          '——人で、あふれている。',
          ren('今、外には誰もいなかった。'),
          '画面の隅に、日付が出ている。',
          YEAR + '年十一月十七日、二十時十七分。十一年前の、今日だ。',
          '写真の裏に書かれていたのと、同じ日付。'
        ]);
        busy = false;
        if (v.cam === 2) return hooks.found(true);
        S.hint(SEL, true);
      } else U.note(on ? '同じ映像が、また映る。時刻は、二十時十七分から進まない。' : 'モニターを消した。');
    });
    hooks.sel = function () {
      if (busy) return;
      var two = SWT.toggle(SEL, 'player'); A.se('tick'); setCam(two ? 2 : 1);
      if (!v.tv) { U.note('カメラを「' + (two ? '2' : '1') + '」に切り替えた。モニターは、消えたままだ。'); return; }
      if (two && !seen2) return hooks.found();
      U.note(two ? 'ホームの映像に切り替えた。' : '改札の映像に戻した。人波は、そのままだ。');
    };
    /* ホームの映像で、美咲を見つける */
    hooks.found = SW.guard(async function (already) {
      busy = true; seen2 = true; U.noteHide();
      S.focus(860, 420, 1.2, 3000);
      await SW.wait(1600);
      await U.say((already ? [] : ['カメラを切り替えた。ホームの映像だ。']).concat([
        '電車を待つ人波の中で、ひとりだけ、カメラを見上げている女性がいる。',
        ren('……美咲。'),
        'あの写真の、あの顔だ。'
      ]));
      v.done = true;
    });
    await SW.wait(3000);
    if (!seen1) S.hint(CCTV, true);
    if (!(await SW.until(function () { return seen1; }, 20000))) {
      U.note('防犯カメラのモニターは、消えている。'); S.focus(860, 470, 1, 1600);
      await SW.until(function () { return seen1; });
    }
    if (!(await SW.until(function () { return v.done; }, 22000))) {
      if (!busy) { U.note(v.tv ? 'モニターの下に、カメラ切替のボタンがある。' : 'モニターを、もう一度点けてみるか。'); S.hint(v.tv ? SEL : CCTV, true); }
      await SW.until(function () { return v.done; });
    }

    /* 「見つけた。」 */
    hooks = {}; U.noteHide();
    await SW.wait(900);
    v.mouth = true;
    if (snd.pa) { snd.pa.stop(0.04); snd.pa = null; }
    var paWasOn = SWT.isOn(PA);
    if (paWasOn) { SWT.set(PA, false, 'system'); setAir(false); }
    await SW.wait(1600);
    await U.say([paWasOn ? '放送が、ふいに途切れた。赤いランプが、ひとりでに消える。' : '止まらなかった放送が、ふいに途切れた。']);
    await U.say([misaki('見つけた。')]);
    v.mouth = false;
    SWT.event(CCTV, 'found_by_misaki');
    await U.say([
      '天井のスピーカーから、あの声がした。',
      '画面の中の彼女の唇が、同じ形に動いていた。',
      ren('……俺が、見えているのか。'),
      '机の上のマイクは、十一年前のホームにつながっている。——なぜか、そう思った。'
    ]);

    /* ---- 選択：マイクのスイッチを入れて、応えるか ---- */
    var spoke = false;
    hooks.pa = function () { spoke = true; };
    hooks.light = lightNote;
    hooks.cctv = function () { U.note('モニターの電源に手を伸ばして、やめた。'); };
    hooks.sel = function () { U.note('カメラを切り替える気には、なれない。彼女が、こちらを見ている。'); };
    hooks.boardsw = function () { var on = SWT.toggle(BOARD, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setRep(on); U.note(on ? '案内表示を点けた。' : '案内表示を消した。'); };
    hooks.screen = function () { U.note('彼女は、まだカメラを見上げている。'); };
    S.hint(PA, true); S.focus(1100, 470, 1, 2400);
    await SW.until(function () { return spoke; }, 15000);
    hooks = {}; S.hint(PA, false); U.noteHide();

    if (spoke) {
      SW.game.flags.ch03_answered = true; SWT.set(PA, true, 'player'); SWT.event(PA, 'answered_misaki');
      A.se('switch_on'); setAir(true);
      await SW.wait(900);
      await U.say(['放送のスイッチを入れた。ランプが、赤く点く。', ren('……美咲、なのか。')]);
      v.mouth = true;
      await U.say([misaki('うん。——やっと、届いた。'), misaki('病院に来て。あの夜の続きが、まだ残ってるから。')]);
      v.mouth = false;
    } else {
      SW.game.flags.ch03_answered = false; SWT.event(PA, 'stayed_silent');
      await U.say(['何も、言えなかった。']);
      v.mouth = true;
      await U.say([misaki('……聞こえてるんでしょう。'), misaki('病院で、待ってる。')]);
      v.mouth = false;
    }

    /* 映像が消え、案内表示が書き換わる */
    await SW.wait(700);
    v.noise = 0.6; await SW.wait(700);
    A.se('cut'); SWT.set(CCTV, false, 'system'); setTV(false);
    if (spoke) { SWT.set(PA, false, 'system'); setAir(false); }
    await SW.wait(1500);
    var boardWasOn = SWT.isOn(BOARD);
    if (!boardWasOn) { SWT.set(BOARD, true, 'system'); SWT.event(BOARD, 'self_on'); setRep(true); A.se('switch_on'); }
    setBoard('20:17 臨時', '灯ヶ丘総合病院', false);
    S.focus(1560, 420, 1.1, 2600);
    await SW.wait(1400);
    await U.say([
      spoke ? 'モニターが消えた。放送のランプも、ひとりでに消えた。' : 'モニターが、消えた。',
      boardWasOn ? '案内表示が、ひとりでに書き換わっている。' : '消したはずの案内表示が、ひとりでに点いた。',
      '「二十時十七分発　臨時　灯ヶ丘総合病院　行」',
      'この路線に、そんな行き先の電車はない。'
    ]);
    A.se('train');
    await SW.wait(4200);
    await U.say(['ホームに、電車の入ってくる音がした。']);
    A.stopAll(1.2);
    await U.fade(1, 1500);
    await SW.wait(1000);
  }

  SW.chapters.ch03 = {
    no: 'CHAPTER 03', title: 'THE STATION',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'office') return beatOffice();
      buildGate();
      await beatGate();
      await beatOffice();
    },
    stop: function () { cancelAnimationFrame(raf); v = null; }
  };
})(window.SW);
