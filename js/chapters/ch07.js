/* ============================================================
   SWITCH — CHAPTER 07 : THE LAST SWITCH
   舞台：中央制御施設エントランス → 主機室 → SWITCH中枢室
   第6章の直後。街で唯一、灯りの点いた建物。
   黒田と初めて顔を合わせ、最後の系統スイッチと向き合う。

   前の章から受け取る記録
     ch04_keptPower  … 黒田への蓮の受け止め方が変わる
     ch06_accepted   … 同上
     ch05_recorderOff… 黒田の告白の言い回しと、第3の選択肢の条件
     ch06_sawUnknown … 第3の選択肢の条件

   この章で決まる記録（SW.game.flags）
     ch07_ending … 'end1'（切った） / 'end2'（入れたまま） / 'end3'（外の誰かに委ねた）
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var DOOR = 'DOOR_FACILITY_01', SYS = 'SYSTEM_SWITCH_01', MASTER = 'SYSTEM_CORE_01', HOLD = 'HOLD_CORE_01';
  var YEAR = new Date().getFullYear() - 11;

  var v, hooks, snd, raf, dk;
  function q(c) { return S.$(c); }
  function all(c) { return document.querySelectorAll('#scene ' + c); }
  function ren(t) { return { who: '蓮', text: t }; }
  function misaki(t) { return { who: '美咲', text: t, voice: true, slow: true }; }
  function kuroda(t) { return { who: '黒田', text: t, voice: true }; }

  var DEFS = '<defs><filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
    '<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>';
  function g(f, inner) { return '<g filter="url(#b' + f + ')" style="mix-blend-mode:lighten">' + inner + '</g>'; }

  /* ================= エントランス ================= */
  var HTML_E =
    '<img class="ly" src="' + SW.IMAGES.ch07_entrance + '" alt="" draggable="false">' +
    '<canvas class="ly c7-dark" width="640" height="360"></canvas>' +
    '<div class="abs c7-clock">20:17</div>' +
    '<div class="abs c7-rocker"></div>' +
    '<div class="abs c7-path" style="left:676px;top:832px"></div><div class="abs c7-path" style="left:1196px;top:832px"></div>' +
    '<div class="abs c7-path" style="left:508px;top:926px"></div><div class="abs c7-path" style="left:1350px;top:926px"></div>' +
    '<div class="abs c7-spill"></div>' +
    '<style>' +
    '.c7-dark{mix-blend-mode:multiply;opacity:1;transition:opacity 1.4s}' +
    '.c7-clock{left:872px;top:196px;width:176px;height:56px;font:500 32px/56px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '.c7-rocker{left:1204px;top:548px;width:32px;height:60px;border-radius:2px;box-shadow:0 0 0 1px #77797b,1px 2px 2px rgba(0,0,0,.3);background:linear-gradient(100deg,#dcdcd4 0%,#f1f1ea 55%,#cfcfc6 100%)}' +
    '.c7-rocker.on{background:linear-gradient(100deg,#c9c9c0 0%,#ebebe4 45%,#e6e6de 100%)}' +
    '.c7-path{width:48px;height:48px;border-radius:50%;opacity:0;transition:opacity 1.6s;background:radial-gradient(circle,#fff3d0 0%,rgba(255,238,190,.55) 45%,rgba(255,238,190,0) 72%)}' +
    '.c7-path.on{opacity:1}' +
    '.c7-spill{left:764px;top:806px;width:392px;height:120px;opacity:0;transition:opacity 2s;background:linear-gradient(rgba(255,230,170,.5),rgba(255,230,170,0));clip-path:polygon(6% 0,94% 0,100% 100%,0 100%)}' +
    '.c7-spill.on{opacity:1}' +
    '</style>';
  function darkE(on) {
    var h = DEFS + '<rect width="1920" height="1080" fill="#04060a"/>' +
      g(60, '<ellipse cx="960" cy="620" rx="560" ry="420" fill="#2c2620"/>') +
      g(30, '<ellipse cx="960" cy="240" rx="120" ry="60" fill="#14301c"/>');
    var pts = [[700, 862], [1220, 862], [539, 957], [1381, 957]];
    for (var i = 0; i < (on.path || 0) && i < pts.length; i++)
      h += g(30, '<ellipse cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" rx="90" ry="60" fill="#4a3f28"/>');
    if (on.door) h += g(60, '<ellipse cx="960" cy="880" rx="360" ry="150" fill="#4a3a1e"/>');
    return h;
  }
  function setPath(n) {
    dk.set('path', n);
    all('.c7-path').forEach(function (e, i) { e.classList.toggle('on', i < n); });
  }
  function buildE() {
    v = { scene: 'entrance', ops: 0 };
    hooks = {}; snd = {};
    S.mount(HTML_E);
    dk = S.shade(q('.c7-dark'), darkE);
    SWT.define(DOOR, false);
    S.hotspot('LOOK_CITY', [0, 860, 700, 220], '後ろの街', function () { if (hooks.city) hooks.city(); });
    S.hotspot('LOOK_SIGN', [700, 60, 520, 90], '看板', function () { U.note('「中央制御施設」。——SWITCHの、中枢。'); });
    S.hotspot('LOOK_CLOCK', [872, 196, 176, 56], '時計', function () { U.note('施設の時計も、二十時十七分。ただ、秒の表示だけが、かすかに震えている。'); });
    S.hotspot(DOOR, [1150, 500, 140, 170], '入口のスイッチ', function () { v.ops++; S.hint(DOOR, false); if (hooks.door) return hooks.door(); });
    snd.amb = A.loop('night', 0.6, 2.5);
  }

  /* ============================================================
     場面 1 : 中央制御施設・エントランス
     ============================================================ */
  async function beatE() {
    SW.checkpoint('start');
    await SW.wait(600);
    await U.say([
      '慰霊碑を出て、暗い街を歩いた。',
      '目指す明かりは、ひとつだけ。街の向こうで、静かに点いている。'
    ]);
    S.focus(960, 560, 1, 0);
    U.fade(0, 2600);
    await SW.wait(1000);
    /* 歩く先だけ、参道の灯りが点いていく */
    for (var i = 1; i <= 4; i++) { setPath(i); A.se('tick'); await SW.wait(850); }
    await U.card('CHAPTER 07', 'THE LAST SWITCH', 3400);
    await SW.wait(700);
    await U.say([
      '中央制御施設。',
      '近づくにつれて、足元の灯りが、ひとつずつ点いていった。',
      'まるで、道案内をするみたいに。',
      ren('……待っている、ということか。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    var pressed = false;
    hooks.city = function () { U.note('振り返ると、街は真っ暗だ。慰霊碑の灯りだけが、遠くに小さく見える。'); };
    hooks.door = function () { pressed = true; };
    await SW.wait(3000);
    if (!v.ops) S.hint(DOOR, true);
    if (!(await SW.until(function () { return pressed; }, 22000))) {
      U.note('扉のわきに、入口のスイッチがある。');
      await SW.until(function () { return pressed; });
    }
    hooks = {}; S.hint(DOOR, false); U.noteHide(); S.locked = true;
    SWT.set(DOOR, true, 'player'); SWT.event(DOOR, 'pressed'); A.se('switch_on'); q('.c7-rocker').classList.add('on');
    await SW.wait(1600);
    await U.say(['入口のスイッチを押した。', '扉は、開かない。——鍵は、内側から掛かっている。']);
    A.se('crackle');
    await SW.wait(1100);
    await U.say([
      '扉のわきのスピーカーが、かすかに鳴った。',
      kuroda('……待っていたよ、高瀬君。'),
      kuroda('いま、開ける。')
    ]);
    A.se('lock');
    await SW.wait(700);
    A.se('door'); dk.set('door', true); q('.c7-spill').classList.add('on');
    await SW.wait(1800);
    await U.say(['鍵の開く音。扉が開いて、温かい明かりが、足元にこぼれた。']);
    S.locked = false;
    v.scene = 'leaving';
    await U.fade(1, 1500);
    A.stopAll(0.8);
  }

  /* ================= 主機室 ================= */
  var HTML_M =
    '<img class="ly" src="' + SW.IMAGES.ch05_control + '" alt="" draggable="false">' +
    '<div class="abs c7-dim"></div>' +
    '<div class="abs c7-status"><p></p><p></p></div>' +
    '<div class="abs c7-mclock">20:17</div>' +
    '<canvas class="abs c7-kuroda" width="150" height="232"></canvas>' +
    '<style>' +
    '.c7-dim{left:0;top:0;width:1920px;height:1080px;background:#04070a;opacity:.42}' +
    '.c7-status{left:1180px;top:110px;width:330px;height:96px;font:700 21px/40px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif;color:#ffb65c;text-shadow:0 0 5px rgba(255,160,60,.9),0 0 14px rgba(255,140,40,.45);padding:8px 0 0 14px;box-sizing:border-box;white-space:pre}' +
    '.c7-status p{margin:0;height:40px}.c7-status p:nth-child(2){font-size:15px;color:#c9a070}' +
    '.c7-mclock{left:1560px;top:110px;width:150px;height:70px;font:500 40px/70px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '.c7-kuroda{left:1290px;top:296px;width:300px;height:464px}' +
    '</style>';
  function setStatus(a, b) { var s = q('.c7-status'); if (!s) return; s.children[0].textContent = a; s.children[1].textContent = b; }

  /* 黒田。はじめは背中だけ。turn が進むと、ゆっくり振り返る */
  function drawKuroda() {
    var cv = q('.c7-kuroda'); if (!cv) return;
    var c = cv.getContext('2d'), t = v.turn || 0, k;
    c.clearRect(0, 0, 150, 232);
    var cx = 75, hy = 52, hw = 21 * (1 - 0.22 * Math.sin(Math.min(t, 1) * Math.PI));
    /* 体（スーツ） */
    c.fillStyle = '#22262a';
    c.beginPath(); c.moveTo(18, 232); c.quadraticCurveTo(20, 108, 52, 96); c.lineTo(98, 96); c.quadraticCurveTo(130, 108, 132, 232); c.fill();
    c.fillStyle = '#2b3036';
    c.beginPath(); c.moveTo(30, 232); c.quadraticCurveTo(32, 116, 56, 102); c.lineTo(94, 102); c.quadraticCurveTo(118, 116, 120, 232); c.fill();
    /* 首と頭 */
    c.fillStyle = '#8d7d6f'; c.fillRect(cx - 6, 82, 12, 18);
    c.fillStyle = '#b9c0bd'; c.beginPath(); c.ellipse(cx, hy, hw, 26, 0, 0, 7); c.fill();           // 白髪
    c.fillStyle = '#a8aeb0'; c.fillRect(cx - hw, hy - 2, 5, 34); c.fillRect(cx + hw - 5, hy - 2, 5, 34);
    if (t > 0.4) {   /* 振り返った顔。影の中で、輪郭だけが分かる */
      var a = Math.min(1, (t - 0.4) / 0.5);
      c.fillStyle = 'rgba(179,157,143,' + (0.92 * a) + ')'; c.beginPath(); c.ellipse(cx, hy + 5, hw * 0.78, 21, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(184,192,189,' + (0.95 * a) + ')'; c.beginPath(); c.ellipse(cx, hy - 12, hw * 0.86, 10, 0, 0, 7); c.fill();   // 前髪（白髪）
      c.fillStyle = 'rgba(12,13,14,' + (0.8 * a) + ')';
      c.fillRect(cx - 13, hy + 1, 9, 2.2); c.fillRect(cx + 4, hy + 1, 9, 2.2);                        // 目
      c.fillRect(cx - 3.5, hy + 17, 7, 1.6);                                                          // 口
      k = c.createLinearGradient(0, hy - 26, 0, hy + 30); k.addColorStop(0, 'rgba(6,8,8,0)'); k.addColorStop(1, 'rgba(6,8,8,' + (0.4 * a) + ')');
      c.fillStyle = k; c.beginPath(); c.ellipse(cx, hy + 5, hw * 0.8, 22, 0, 0, 7); c.fill();
    }
    /* 部屋の明かりの反射 */
    k = c.createLinearGradient(40, 0, 118, 0); k.addColorStop(0, 'rgba(150,200,175,0)'); k.addColorStop(1, 'rgba(150,200,175,.13)');
    c.fillStyle = k; c.fillRect(18, 90, 114, 142);
  }
  var lastT = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 60 || !v || v.scene !== 'machine' || !q('.c7-kuroda')) return;
    lastT = now;
    drawKuroda();
  }

  function buildM() {
    v = { scene: 'machine', turn: 0, ops: 0 };
    hooks = {}; snd = snd || {};
    S.mount(HTML_M);
    setStatus('SWITCH　状態：停止', '最終操作　' + YEAR + '/11/17 20:19');
    S.hotspot('LOOK_MAP', [240, 110, 900, 470], '系統図', function () { if (hooks.map) hooks.map(); });
    S.hotspot('LOOK_STATUS', [1180, 110, 330, 96], '状態表示', function () { if (hooks.status) hooks.status(); });
    S.hotspot('LOOK_MON', [1186, 250, 508, 320], '主機室の映像のモニター', function () { U.note('主機室の映像。——いま、自分が立っている部屋だ。男の背中と、その横に、俺が映っている。'); });
    S.hotspot('KURODA_01', [1240, 270, 400, 500], '白髪の男', function () { v.ops++; S.hint('KURODA_01', false); if (hooks.kuroda) return hooks.kuroda(); });
    S.hotspot(SYS, [470, 590, 220, 130], '系統スイッチ', function () { v.ops++; if (hooks.sys) return hooks.sys(); });
    S.hotspot('DOOR_CORE_01', [30, 220, 190, 480], '中枢への扉', function () { if (hooks.door) return hooks.door(); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    snd.amb = A.loop('roomtone', 0.5, 2); snd.deep = A.loop('genhum', 0.3, 2.5);
  }

  /* ============================================================
     場面 2 : 主機室——黒田、振り返る
     ============================================================ */
  async function beatM() {
    SW.checkpoint('machine');
    var f = SW.game.flags;
    snd = {};
    buildM();
    S.focus(1150, 480, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2600);
    await U.say([
      '主機室。',
      'モニターの中で見た部屋が、目の前にある。機械の低い唸り。',
      '白髪の男が、立っている。こちらに、背を向けて。',
      '十一年間、ずっとこの姿勢だった男だ。'
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);

    var busy = false, talked = false;
    hooks.map = function () { U.note('系統図。街じゅうのランプが、静かに点いている。——俺が通ってきた場所ばかりだ。'); };
    hooks.status = function () { U.note('「SWITCH　状態：停止」。最終操作は、' + YEAR + '年十一月十七日、二十時十九分。'); };
    hooks.sys = function () {
      A.se('tick'); SWT.event(SYS, 'touched_in_machine_room');
      U.note('赤い「系統」のスイッチ。——いまは、触らないほうがいい気がした。');
    };
    hooks.door = function () { U.note('重い扉。「中枢」とだけ書かれている。鍵が掛かっていて、開かない。'); };
    hooks.kuroda = SW.guard(async function () {
      if (busy) return;
      busy = true; talked = true; U.noteHide();
      S.focus(1400, 480, 1.25, 2600);
      await SW.wait(1200);
      await U.say([
        ren('黒田さん。'),
        kuroda('……来たね。'),
        kuroda('君の押すスイッチの音を、十一年、聞いてきた。記録計の紙の上で、だが。'),
        ren('SWITCHは、止まっているはずじゃ——'),
        kuroda('止めた。私が、この手で。二十時十九分に。'),
        kuroda('それでも毎晩、二十時十七分になると、入力が来る。街の、どの端末からでもない入力が。'),
        kuroda('SWITCHは、その入力で目を覚ます。目を覚まして、つづける。あの夜の、つづきを。')
      ]);
      if (f.ch05_recorderOff) await U.say([
        kuroda('工場で、君は記録計を止めてくれた。私の頼みを、聞いてくれたね。'),
        kuroda('だからこそ、言わなければならない。あの紙に打ち出されていたのは——')
      ]);
      else await U.say([
        kuroda('工場で、君は記録計を止めなかった。知りたいと、思ったんだろう。'),
        kuroda('なら、言う。あの紙に打ち出されていたのは——')
      ]);
      await U.say([
        kuroda('君の手だ。けれど、君の手ではない。'),
        ren('……どういう、意味です。')
      ]);
      /* 黒田が、初めて振り返る */
      for (var i = 1; i <= 70; i++) { v.turn = i / 70; await SW.wait(55); }
      await SW.wait(600);
      await U.say([
        '白髪の男が、ゆっくりと、振り返った。',
        '老いた顔だ。モニターの中の背中より、ずっと年を取って見えた。',
        kuroda('入力は、この街の外から来ている。'),
        kuroda('画面の、向こう側からだ。君が「現実」だと思ってきた、もっと外側の世界から。'),
        kuroda('誰かがそちら側でスイッチを入れるたび、この街は目を覚ます。私たちは、そのたびに、あの夜を生き直す。'),
        ren('そんな……'),
        kuroda('私も、あの夜に死んだ。系統を切った直後、この部屋でな。'),
        kuroda('だから、私はここを出られない。出ようとすると、いつも、この背中向きの姿に戻される。')
      ]);
      await SW.wait(800);
      await U.say([
        kuroda('高瀬君。'),
        kuroda('病院の非常電源を、SWITCHにつないだのは、私だ。'),
        kuroda('つなぐべきでは、なかった。——十一年間、その言葉を探していた。'),
        kuroda('すまなかった。')
      ]);
      await SW.wait(1000);
      if (f.ch04_keptPower && f.ch06_accepted) await U.say([
        ren('……あの夜、俺を生かそうとしてくれた人がいました。'),
        ren('美咲が、手で、息を送りつづけてくれた。'),
        ren('だから——もう、いいんです。'),
        '黒田は、目を伏せた。その肩が、かすかに震えていた。'
      ]);
      else if (f.ch04_keptPower || f.ch06_accepted) await U.say([
        ren('……すぐには、許せない。'),
        ren('でも、聞けてよかった。ずっと、誰も教えてくれなかったから。'),
        kuroda('……それで、十分だ。')
      ]);
      else await U.say([
        ren('……何も、言えません。今は。'),
        '黒田は、小さくうなずいた。'
      ]);
      await SW.wait(700);
      setStatus('SWITCH　状態：停止', '中枢　扉：開放');
      A.se('lock');
      await U.say([
        kuroda('中枢の扉を、開けた。'),
        kuroda('最後のスイッチは、私のものではない。'),
        kuroda('——決めるのは、君だ。行ってくれ。')
      ]);
      busy = false; v.told = true;
      S.focus(1150, 480, 1, 2000);
      S.hint('DOOR_CORE_01', true);
    });
    await SW.wait(3000);
    if (!talked && !busy) S.hint('KURODA_01', true);
    if (!(await SW.until(function () { return v.told; }, 30000))) {
      if (!busy) U.note('白髪の男が、背を向けて立っている。声を、掛けるか。');
      await SW.until(function () { return v.told; });
    }
    var entered = false;
    hooks.door = function () { entered = true; };
    hooks.kuroda = function () { U.note('黒田は、静かにこちらを見ている。「行ってくれ」。'); };
    if (!(await SW.until(function () { return entered; }, 25000))) {
      U.note('開いた扉が、待っている。——「中枢」と書かれた扉だ。');
      await SW.until(function () { return entered; });
    }
    hooks = {}; S.hint('DOOR_CORE_01', false); U.noteHide();
    A.se('door');
    v.scene = 'leaving';
    await U.fade(1, 1500);
    A.stopAll(0.8);
  }

  /* ================= 中枢室 ================= */
  var HTML_C =
    '<img class="ly" src="' + SW.IMAGES.ch07_core + '" alt="" draggable="false">' +
    '<canvas class="ly c7-dark" width="640" height="360"></canvas>' +
    '<div class="abs c7-ring"></div>' +
    '<div class="abs c7-scr" style="left:150px;top:220px"></div><div class="abs c7-scr" style="left:150px;top:500px"></div>' +
    '<div class="abs c7-scr" style="left:1410px;top:220px"></div><div class="abs c7-scr" style="left:1410px;top:500px"></div>' +
    '<div class="abs c7-cc">20:17</div>' +
    '<div class="abs c7-lever"><i></i></div>' +
    '<div class="abs c7-keep"></div>' +
    '<style>' +
    '.c7-dark{mix-blend-mode:multiply;opacity:1;transition:opacity 1.6s}' +
    '.c7-ring{left:660px;top:130px;width:600px;height:600px;border-radius:50%;opacity:.85;transition:opacity 2s;' +
      'background:radial-gradient(circle,rgba(160,230,195,0) 52%,rgba(160,230,195,.28) 63%,rgba(160,230,195,0) 74%);animation:c7pulse 4.2s ease-in-out infinite}' +
    '@keyframes c7pulse{0%,100%{opacity:.6}50%{opacity:.95}}' +
    '.c7-ring.off{opacity:0;animation:none}' +
    '.c7-scr{width:360px;height:200px;opacity:.8;transition:opacity 1.2s;' +
      'background:repeating-linear-gradient(0deg,rgba(170,220,195,.13) 0 3px,rgba(120,170,150,.05) 3px 6px);animation:c7scr 3.1s steps(6) infinite}' +
    '@keyframes c7scr{0%,100%{opacity:.8}30%{opacity:.62}55%{opacity:.86}80%{opacity:.7}}' +
    '.c7-scr.off{opacity:0;animation:none}' +
    '.c7-cc{left:1560px;top:118px;width:150px;height:64px;font:500 36px/64px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '.c7-lever{left:922px;top:764px;width:76px;height:68px;border-radius:5px;background:#2a1513;box-shadow:0 0 0 2px #7a1f18,inset 0 2px 6px rgba(0,0,0,.7)}' +
    '.c7-lever i{position:absolute;left:7px;right:7px;top:6px;height:26px;border-radius:4px;background:linear-gradient(#f1f1ea,#a9a9a0);box-shadow:0 2px 4px rgba(0,0,0,.5);transition:top .12s}' +
    '.c7-lever.off i{top:36px}' +
    '.c7-keep{left:1112px;top:772px;width:44px;height:44px;border-radius:50%;opacity:0;transition:opacity .4s;background:#8dffb4;box-shadow:0 0 10px 4px rgba(90,255,150,.85),0 0 30px 12px rgba(70,240,130,.4)}' +
    '.c7-keep.on{opacity:1}' +
    '</style>';
  function darkC(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#04060a"/>' +
      g(60, '<ellipse cx="960" cy="200" rx="1300" ry="480" fill="#182420"/>') +
      (on.ring ? g(60, '<ellipse cx="960" cy="430" rx="430" ry="430" fill="#2c4a3a"/>') : '') +
      (on.scr ? g(30, '<ellipse cx="330" cy="470" rx="330" ry="330" fill="#22382c"/><ellipse cx="1590" cy="470" rx="330" ry="330" fill="#22382c"/>') : '') +
      (on.ped ? g(30, '<ellipse cx="960" cy="800" rx="330" ry="200" fill="#3a2c1c"/>') : '');
  }
  function buildC() {
    v = { scene: 'core', ops: 0 };
    hooks = {}; snd = snd || {};
    S.mount(HTML_C);
    dk = S.shade(q('.c7-dark'), darkC);
    dk.set('ring', true); dk.set('scr', true); dk.set('ped', true);
    SWT.define(MASTER, true); SWT.define(HOLD, false);
    S.hotspot('LOOK_MONITORS', [138, 208, 384, 504], 'モニター', function () { if (hooks.monitors) hooks.monitors(); });
    S.hotspot('LOOK_MONITORS2', [1398, 208, 384, 504], 'モニター', function () { if (hooks.monitors) hooks.monitors(); });
    S.hotspot('LOOK_RING', [660, 130, 600, 600], '中枢のリング', function () { if (hooks.ring) return hooks.ring(); });
    S.hotspot(MASTER, [872, 726, 176, 118], '系統スイッチ', function () { v.ops++; S.hint(MASTER, false); if (hooks.master) return hooks.master(); });
    S.hotspot(HOLD, [1080, 740, 108, 108], '維持のボタン', function () { v.ops++; S.hint(HOLD, false); if (hooks.hold) return hooks.hold(); });
    snd.amb = A.loop('drone', 0.35, 3); snd.hum = A.loop('hum', 0.3, 2);
  }

  /* 第3の選択肢：画面の外のスイッチだけが残る */
  var HTML_B =
    '<div class="abs c7-void"></div>' +
    '<div class="abs c7-big"><span class="c7-brock"></span><span class="c7-blamp"></span></div>' +
    '<style>' +
    '.c7-void{left:0;top:0;width:1920px;height:1080px;background:#000}' +
    '.c7-big{left:830px;top:300px;width:260px;height:480px;border-radius:14px;background:linear-gradient(100deg,#d8d5cb 0%,#efede6 55%,#c6c3b8 100%);box-shadow:0 0 0 2px #8f8c82,0 18px 50px rgba(0,0,0,.8)}' +
    '.c7-brock{position:absolute;left:38px;top:36px;width:184px;height:408px;border-radius:8px;background:linear-gradient(100deg,#c9c6bc 0%,#e9e7df 45%,#dedbd2 100%);box-shadow:inset 0 3px 8px rgba(0,0,0,.35);transition:background .15s}' +
    '.c7-big.on .c7-brock{background:linear-gradient(100deg,#dedbd2 0%,#f2f0e9 55%,#cfccc2 100%)}' +
    '.c7-blamp{position:absolute;left:121px;top:392px;width:18px;height:34px;border-radius:9px;background:#39483f;opacity:.6}' +
    '.c7-big.on .c7-blamp{background:#6dffa6;box-shadow:0 0 10px 4px #36ff88,0 0 34px 14px rgba(54,255,136,.5);opacity:1}' +
    '</style>';
  function buildBig() {
    v = { scene: 'big' };
    hooks = {};
    S.mount(HTML_B);
    q('.c7-big').classList.add('on');
    S.hotspot(MASTER, [790, 260, 340, 560], 'スイッチ', function () { if (hooks.big) return hooks.big(); });
  }

  /* ============================================================
     場面 3 : 中枢——最後のスイッチ
     ============================================================ */
  async function beatC() {
    SW.checkpoint('core');
    var f = SW.game.flags;
    snd = {};
    buildC();
    S.focus(960, 500, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2600);
    await U.say([
      '中枢室。',
      '壁のモニターに、街が映っている。部屋。駅。病院。工場。交差点。',
      '——俺が通ってきた場所が、全部。',
      '部屋の真ん中に、スイッチが、ひとつだけある。'
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);
    await SW.wait(1200);
    A.se('crackle');
    await SW.wait(900);
    await U.say([
      'スピーカーから、かすかな声がした。',
      misaki('蓮。'),
      ren('美咲……来てくれたのか。'),
      misaki('ずっと、そばにいたよ。スイッチの音の、向こう側に。')
    ]);
    await SW.wait(600);
    var lines = [
      misaki('ねえ、気づいてる？'),
      misaki('この街はね、誰かがスイッチを入れるたびに、目を覚ますの。')
    ];
    if (f.ch06_sawUnknown) lines = lines.concat([
      '交差点の街頭ビジョン。人影が、画面の外を見ていた。',
      ren('あれは……'),
      misaki('うん。あちら側の人が、こちらを見ていたの。')
    ]);
    lines = lines.concat([
      misaki('あなたの押してきたスイッチは、全部、そちら側の誰かの指でもあった。'),
      ren('じゃあ、俺は……ずっと、誰かに動かされてきたのか。'),
      misaki('違うよ。選んできたのは、あなた。'),
      misaki('消すか、消さないか。応えるか、応えないか。——そのたびに、あなたが決めてきた。'),
      misaki('指は借りても、心は、あなたのものだよ。')
    ]);
    await U.say(lines);
    await SW.wait(700);
    await U.say([
      '系統スイッチ。入れたままなら、街はつづく。切れば、街は終わる。',
      misaki('決めるのは、あなただよ、蓮。')
    ]);

    /* 第3の選択肢が開く条件：真実を知ろうとして、画面の外に気づいていた */
    var canDelegate = f.ch05_recorderOff === false && f.ch06_sawUnknown === true;
    if (canDelegate) {
      await SW.wait(900);
      await U.say([
        misaki('……ねえ、もうひとつだけ。'),
        misaki('そちら側の人に、委ねることもできる。——気づいているなら、ね。')
      ]);
    }

    var choice = null;
    hooks.monitors = function () { U.note('モニターの中の街は、静かだ。どの画面にも、人の姿はない。'); };
    hooks.ring = function () {
      if (canDelegate && !choice) { choice = 'delegate'; return; }
      U.note('中枢のリングが、静かに明滅している。街の鼓動みたいだ。');
    };
    hooks.master = function () { choice = 'cut'; };
    hooks.hold = function () { choice = 'keep'; };
    S.hint(MASTER, true); S.hint(HOLD, true); if (canDelegate) S.hint('LOOK_RING', true);
    S.focus(960, 620, 1.05, 2400);
    if (!(await SW.until(function () { return !!choice; }, 25000))) {
      if (!choice) U.note('美咲の声が、静かに待っている。');
      await SW.until(function () { return !!choice; });
    }
    hooks = {}; S.hint(MASTER, false); S.hint(HOLD, false); S.hint('LOOK_RING', false); U.noteHide();
    S.locked = true;

    if (choice === 'cut') {
      /* ---- END 01：切る ---- */
      f.ch07_ending = 'end1'; SWT.event(MASTER, 'final_off');
      SWT.set(MASTER, false, 'player'); A.se('switch_off'); q('.c7-lever').classList.add('off');
      await SW.wait(900);
      A.se('powerdown');
      if (snd.amb) { snd.amb.stop(2.5); snd.amb = null; }
      if (snd.hum) { snd.hum.stop(2); snd.hum = null; }
      q('.c7-ring').classList.add('off'); dk.set('ring', false);
      var scrs = all('.c7-scr');
      for (var i = 0; i < scrs.length; i++) { scrs[i].classList.add('off'); dk.set('scr', i < scrs.length - 1); await SW.wait(650); }
      dk.set('ped', false);
      await SW.wait(1600);
      q('.c7-cc').textContent = '20:18'; A.se('tick');
      S.locked = false;
      await U.say([
        'スイッチを、切った。',
        '街の音が、遠くなっていく。',
        '壁の時計が——十一年ぶりに、一分進んだ。',
        misaki('……ああ、時計が、進んだ。'),
        misaki('ありがとう、蓮。——さようなら。'),
        '慰霊碑の灯りが、最後まで点いていた。',
        { who: '黒田', text: '……外だ。空が、明るい。', voice: true },
        '部屋の明かりは、点けたままだ。もう、誰も消しに来ない。'
      ]);
    } else if (choice === 'keep') {
      /* ---- END 02：入れたまま ---- */
      f.ch07_ending = 'end2'; SWT.event(MASTER, 'final_kept');
      SWT.set(HOLD, true, 'player'); SWT.event(HOLD, 'held_on'); A.se('switch_on'); q('.c7-keep').classList.add('on');
      await SW.wait(1400);
      S.focus(960, 500, 1, 2200);
      S.locked = false;
      await U.say([
        'スイッチには、触れなかった。「維持」のボタンを、そっと押した。',
        misaki('……うん。それも、あなたの答えだね。'),
        misaki('じゃあ、また明日。明日も、二十時十七分に会おう。'),
        '時計は、進まない。それでも、彼女の声は、ここにある。',
        '部屋の明かりは、今日も点けたままだ。'
      ]);
    } else {
      /* ---- END 03：外の誰かに委ねる ---- */
      f.ch07_ending = 'end3'; SWT.event(MASTER, 'entrusted');
      S.locked = false;
      await U.say([
        ren('……なあ、聞こえているか。'),
        ren('画面の外の、あんたに言っている。'),
        misaki('気づいちゃったんだね。'),
        ren('最初から、俺のスイッチを押してきたのは、あんただ。'),
        ren('だったら、最後も——あんたが決めてくれ。'),
        '画面が、暗くなっていく。残ったのは、スイッチひとつだけ。'
      ]);
      A.stopAll(1);
      await U.fade(1, 1200);
      buildBig();
      await U.fade(0, 1200);
      await SW.wait(600);
      U.note('スイッチが、ひとつだけ残っている。');
      S.hint(MASTER, true);
      var tappedBig = false;
      hooks.big = function () { tappedBig = true; };
      await SW.until(function () { return tappedBig; });
      hooks = {}; S.hint(MASTER, false); U.noteHide();
      SWT.set(MASTER, false, 'player'); SWT.event(MASTER, 'final_by_you'); A.se('switch_off');
      q('.c7-big').classList.remove('on');
      SW.profile.sawEnd3 = true; SW.saveProfile();
      await SW.wait(2400);
      await U.fade(1, 0);
      await U.say([
        ren('……ああ、やっぱり、あんただったんだ。'),
        ren('ありがとう。最初から、ずっと。'),
        misaki('さようなら。そちら側でも、明かりは、消さないでね。')
      ]);
    }
    S.locked = false;
    A.stopAll(1.2);
    await U.fade(1, 1600);
    await SW.wait(1000);
  }

  SW.chapters.ch07 = {
    no: 'CHAPTER 07', title: 'THE LAST SWITCH',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'machine') { await beatM(); return beatC(); }
      if (from === 'core') return beatC();
      buildE();
      await beatE();
      await beatM();
      await beatC();
    },
    stop: function () { cancelAnimationFrame(raf); v = null; },
    /* 物語の最後：たどり着いたエンドを main.js のエンドカードへ返す */
    ending: function () {
      var e = SW.game.flags.ch07_ending;
      if (e === 'end1') return {
        no: 'END 01', title: '20:18',
        lines: ['時計は、十一年ぶりに、次の一分へ進んだ。', '慰霊碑の灯りの中で、ふたりは別れた。', '部屋の明かりは、点けたまま。もう、誰も消しに来ない。']
      };
      if (e === 'end3') return {
        no: 'END 03', title: 'INPUT SOURCE: YOU',
        lines: ['入力元：不明 —— その正体は、あなただった。', '最後のスイッチを押したのは、あなたの指だ。', 'ありがとう。最初から、あなただったんだね。']
      };
      return {
        no: 'END 02', title: '20:17',
        lines: ['街は、今日も二十時十七分。', '消さなかった明かりの下で、彼女の声がする。', '悪い終わりではない。ただ、時計は、二度と進まない。']
      };
    }
  };
})(window.SW);
