/* ============================================================
   SWITCH — CHAPTER 06 : THE CITY
   舞台：駅前の交差点 → 駅前公園の慰霊碑
   第5章の直後。街じゅうのスイッチが、でたらめに切り替わっている。
   ここで、蓮と美咲が11年前に亡くなっていたこと、
   この街が記憶から作り直されたものだということが明かされる。

   前の章から受け取る記録
     ch05_recorderOff … 冒頭のひとことが変わる

   次の章へ引き継ぐ記録（SW.game.flags）
     ch06_sawUnknown … 街頭ビジョンの人影（画面の外を見ている）に気づいた
     ch06_accepted   … 慰霊碑の灯りを、消さずにいたか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var PED = 'PED_BUTTON_01', PHONE = 'PHONE_BOOTH_01', LAMP = 'MEMORIAL_LIGHT_01';
  var YEAR = new Date().getFullYear() - 11;

  var v, hooks, snd, raf, dk, timer;
  function q(c) { return S.$(c); }
  function all(c) { return document.querySelectorAll('#scene ' + c); }
  function ren(t) { return { who: '蓮', text: t }; }
  function misaki(t) { return { who: '美咲', text: t, voice: true, slow: true }; }
  var DEFS = '<defs><filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
    '<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>';
  function g(f, inner) { return '<g filter="url(#b' + f + ')" style="mix-blend-mode:lighten">' + inner + '</g>'; }

  /* ================= 交差点 ================= */
  var GRIDS = [[150, 184, 8, 8, 44, 46, 'a'], [650, 410, 14, 3, 45, 50, 'b'], [1410, 224, 9, 7, 46, 50, 'c']];
  function windows() {
    var h = '';
    GRIDS.forEach(function (G) {
      for (var r = 0; r < G[3]; r++) for (var c = 0; c < G[2]; c++)
        h += '<i class="c6-w ' + G[6] + '" style="left:' + (G[0] + c * G[4]) + 'px;top:' + (G[1] + r * G[5]) + 'px"></i>';
    });
    return h;
  }
  function sig(x) { return '<div class="abs c6-sig" style="left:' + x + 'px"><i class="g"></i><i class="y"></i><i class="r"></i></div>'; }
  function ped(x) { return '<div class="abs c6-ped" style="left:' + x + 'px"><i class="r"></i><i class="g"></i></div>'; }
  var HTML_X =
    '<img class="ly" src="' + SW.IMAGES.ch06_cross + '" alt="" draggable="false">' +
    '<canvas class="ly c6-dark" width="640" height="360"></canvas>' +
    windows() + sig(286) + sig(1458) + ped(516) + ped(1296) +
    '<div class="abs c6-sl" style="left:128px"></div><div class="abs c6-sl" style="left:1754px"></div>' +
    '<canvas class="abs c6-vis" width="200" height="114"></canvas>' +
    '<div class="abs c6-wait">おまち\nください</div>' +
    '<div class="abs c6-booth"></div>' +
    '<style>' +
    '.c6-dark{mix-blend-mode:multiply;opacity:0;transition:opacity 1.2s}' +
    '.c6-w{position:absolute;width:26px;height:28px;background:#11151b;pointer-events:none}' +
    '.c6-w.on{background:#ffdf9a;box-shadow:0 0 8px 1px rgba(255,220,150,.45)}.c6-w.on.b{background:#e6f0ff;box-shadow:0 0 8px 1px rgba(210,230,255,.45)}' +
    '.c6-sig{top:226px;width:176px;height:64px}.c6-sig i{position:absolute;top:14px;width:36px;height:36px;border-radius:50%;background:#16181b}' +
    '.c6-sig .g{left:14px}.c6-sig .y{left:70px}.c6-sig .r{left:126px}' +
    '.c6-sig .g.on{background:#3dffb0;box-shadow:0 0 14px 5px rgba(60,255,170,.8),0 0 60px 20px rgba(60,255,170,.3)}' +
    '.c6-sig .y.on{background:#ffd23a;box-shadow:0 0 14px 5px rgba(255,210,60,.8),0 0 60px 20px rgba(255,210,60,.3)}' +
    '.c6-sig .r.on{background:#ff4a3a;box-shadow:0 0 14px 5px rgba(255,70,50,.8),0 0 60px 20px rgba(255,70,50,.3)}' +
    '.c6-ped{top:384px;width:88px;height:150px}.c6-ped i{position:absolute;left:14px;width:60px;height:56px;border-radius:4px;background:#16181b}' +
    '.c6-ped .r{top:12px}.c6-ped .g{top:82px}' +
    '.c6-ped .r.on{background:#ff4a3a;box-shadow:0 0 12px 4px rgba(255,70,50,.75)}.c6-ped .g.on{background:#3dffb0;box-shadow:0 0 12px 4px rgba(60,255,170,.75)}' +
    '.c6-sl{top:140px;width:58px;height:12px;border-radius:6px;background:#3a3d41;transition:opacity .1s}' +
    '.c6-sl.on{background:#fff0d0;box-shadow:0 0 20px 8px rgba(255,236,190,.85),0 60px 200px 90px rgba(255,226,170,.22)}' +
    '.c6-vis{left:760px;top:148px;width:400px;height:228px}' +
    '.c6-wait{left:536px;top:600px;width:48px;height:30px;font:700 9px/14px sans-serif;text-align:center;color:#ff5a48;white-space:pre;text-shadow:0 0 5px rgba(255,70,50,.9);opacity:0}.c6-wait.on{opacity:1}' +
    '.c6-booth{left:1504px;top:424px;width:172px;height:356px;opacity:0;transition:opacity .3s;background:linear-gradient(rgba(240,255,244,.5),rgba(240,255,244,.12) 60%,rgba(240,255,244,.04));box-shadow:0 0 50px 14px rgba(230,255,238,.3)}' +
    '.c6-booth.on{opacity:1}.c6-booth.ring{animation:c6ring 1s steps(1) infinite}@keyframes c6ring{0%{opacity:1}50%{opacity:.45}}' +
    '</style>';
  function darkX(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#04060a"/>' +
      g(60, '<ellipse cx="960" cy="-40" rx="1400" ry="460" fill="#141a28"/>') +
      g(60, '<ellipse cx="960" cy="320" rx="460" ry="300" fill="#1a2620"/>') +
      (on.booth ? g(60, '<ellipse cx="1590" cy="640" rx="260" ry="340" fill="#5a5a48"/>') : '');
  }
  function setSig(col) {   // col: 'g' 'y' 'r' または null（消灯）
    all('.c6-sig i').forEach(function (e) { e.classList.toggle('on', !!col && e.classList.contains(col)); });
    all('.c6-ped i').forEach(function (e) { e.classList.toggle('on', !!col && e.classList.contains(col === 'g' ? 'r' : 'g')); });
  }
  /* でたらめに切り替わる街 */
  function chaos() {
    if (!v || v.scene !== 'cross' || v.dark) return;
    var w = all('.c6-w'), i;
    for (i = 0; i < 5; i++) w[Math.random() * w.length | 0].classList.toggle('on');
    if (!v.hold) {
      if (Math.random() < 0.3) all('.c6-sig').forEach(function (s) {
        var k = 'gyr'[Math.random() * 3 | 0]; s.querySelectorAll('i').forEach(function (e) { e.classList.toggle('on', e.classList.contains(k)); });
      });
      if (Math.random() < 0.3) all('.c6-ped').forEach(function (s) {
        var k = Math.random() < .5 ? 'r' : 'g'; s.querySelectorAll('i').forEach(function (e) { e.classList.toggle('on', e.classList.contains(k)); });
      });
    }
    if (Math.random() < 0.12) all('.c6-sl').forEach(function (e) { e.classList.toggle('on', Math.random() < .7); });
  }

  /* 街頭ビジョン：カメラの前に立って、画面の外を見ている人影 */
  var nz = document.createElement('canvas'); nz.width = 100; nz.height = 57;
  var lastT = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 70 || !v || v.scene !== 'cross' || !q('.c6-vis')) return;
    lastT = now;
    var c = q('.c6-vis').getContext('2d'), x = nz.getContext('2d'), im = x.createImageData(100, 57), d = im.data, k;
    for (var i = 0; i < d.length; i += 4) { var n = Math.random() * 255; d[i] = n * .9; d[i + 1] = n; d[i + 2] = n * 1.02; d[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    c.globalAlpha = 1; c.fillStyle = '#0b100f'; c.fillRect(0, 0, 200, 114);
    k = c.createRadialGradient(100, 40, 4, 100, 50, 110); k.addColorStop(0, 'rgba(150,190,170,.5)'); k.addColorStop(1, 'rgba(60,90,80,0)'); c.fillStyle = k; c.fillRect(0, 0, 200, 114);
    c.fillStyle = 'rgba(4,6,6,.95)'; c.beginPath(); c.ellipse(100, 42, 11, 13, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(70, 114); c.quadraticCurveTo(72, 62, 90, 58); c.lineTo(110, 58); c.quadraticCurveTo(128, 62, 130, 114); c.fill();
    c.globalAlpha = v.dark ? 0.22 : 0.62; c.drawImage(nz, 0, 0, 200, 114); c.globalAlpha = 1;
    if (Math.random() < 0.1) { var y = Math.random() * 100 | 0; c.drawImage(q('.c6-vis'), 0, y, 200, 8, (Math.random() - .5) * 20, y, 200, 8); }
    c.font = '8px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(235,245,238,.85)'; c.fillText('20:17', 166, 106);
    c.fillStyle = 'rgba(0,0,0,.22)'; for (var s = 0; s < 114; s += 2) c.fillRect(0, s, 200, 1);
  }

  function buildX() {
    v = { scene: 'cross', dark: false, hold: false, ops: 0 };
    hooks = {}; snd = {};
    S.mount(HTML_X);
    dk = S.shade(q('.c6-dark'), darkX);
    all('.c6-w').forEach(function (e) { if (Math.random() < .45) e.classList.add('on'); });
    all('.c6-sl').forEach(function (e) { e.classList.add('on'); });
    SWT.define(PED, false); SWT.define(PHONE, false);
    S.hotspot('LOOK_VISION', [748, 138, 424, 250], '街頭ビジョン', function () {
      SW.game.flags.ch06_sawUnknown = true; SWT.event('VISION_01', 'unknown_looking_out');
      U.note('街頭ビジョンに、人影が映っている。カメラの前に立って、こちらを——いや、画面の外を、見ている。');
    });
    S.hotspot('LOOK_SIGNAL', [286, 226, 176, 64], '信号機', function () { if (hooks.signal) hooks.signal(); });
    S.hotspot('LOOK_SIGNAL2', [1296, 226, 340, 310], '信号機', function () { if (hooks.signal) hooks.signal(); });
    S.hotspot(PED, [500, 380, 124, 330], '歩行者用の押しボタン', function () { v.ops++; S.hint(PED, false); if (hooks.ped) return hooks.ped(); });
    S.hotspot(PHONE, [1494, 396, 192, 390], '公衆電話', function () { v.ops++; S.hint(PHONE, false); if (hooks.phone) return hooks.phone(); });
    clearInterval(timer); timer = setInterval(chaos, 170);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    snd.amb = A.loop('night', 0.6, 2.5); snd.hum = A.loop('hum', 0.35, 2);
  }

  /* ============================================================
     場面 1 : 駅前の交差点
     ============================================================ */
  async function beatX() {
    SW.checkpoint('start');
    var f = SW.game.flags;
    await SW.wait(600);
    await U.say([
      f.ch05_recorderOff ? '記録計は、止めてきた。それでも、あの一行が頭から離れない。' : '紙を打ち出しつづける音が、まだ耳に残っている。',
      '「入力元：不明」。',
      '工場を出ると、街の様子が、変わっていた。'
    ]);
    S.focus(960, 480, 1, 0);
    U.fade(0, 2600);
    await SW.wait(1200);
    await U.card('CHAPTER 06', 'THE CITY', 3400);
    await SW.wait(700);
    await U.say([
      '駅前の交差点。',
      '信号が、でたらめに切り替わっている。ビルの窓が、点いては消える。',
      '車は、一台も走っていない。歩いている人も、いない。',
      ren('……部屋でも、駅でも、病院でも、工場でも。'),
      ren('俺は、この街で、まだ誰にも会っていない。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    var pressed = false;
    hooks.signal = function () { U.note('信号は、青と黄と赤を、でたらめに繰り返している。誰も、待っていないのに。'); };
    hooks.phone = function () {
      var on = SWT.toggle(PHONE, 'player'); A.se('tick'); q('.c6-booth').classList.toggle('on', on);
      U.note(on ? '公衆電話の受話器を取った。発信音だけが、聞こえる。' : '受話器を、戻した。');
    };
    hooks.ped = function () { pressed = true; };
    await SW.wait(3000);
    if (!v.ops) S.hint(PED, true);
    if (!(await SW.until(function () { return pressed; }, 24000))) {
      U.note('横断歩道の柱に、歩行者用の押しボタンがある。');
      await SW.until(function () { return pressed; });
    }

    /* 押しボタン → 街じゅうの明かりが、端から消えていく */
    hooks = {}; S.hint(PED, false); U.noteHide(); S.locked = true;
    SWT.set(PED, true, 'player'); SWT.event(PED, 'blackout'); A.se('switch_on'); q('.c6-wait').classList.add('on');
    if (SWT.isOn(PHONE)) { SWT.set(PHONE, false, 'system'); q('.c6-booth').classList.remove('on'); }
    v.hold = true;
    await SW.wait(900);
    setSig('r'); A.se('tick');
    await SW.wait(1700);
    setSig('g'); A.se('pipo');
    await SW.wait(2200);
    A.se('powerdown'); if (snd.hum) { snd.hum.stop(2.5); snd.hum = null; }
    v.dark = true;
    var order = ['a', 'b', 'c'];
    for (var i = 0; i < order.length; i++) {
      all('.c6-w.' + order[i]).forEach(function (e) { e.classList.remove('on'); });
      if (i === 0) q('.c6-sl').classList.remove('on');
      if (i === 2) all('.c6-sl').forEach(function (e) { e.classList.remove('on'); });
      await SW.wait(750);
    }
    setSig(null); q('.c6-wait').classList.remove('on'); SWT.set(PED, false, 'system');
    q('.c6-dark').style.opacity = 1;
    await SW.wait(2600);
    S.locked = false;
    await U.say([
      '押しボタンを押すと、信号がいっせいに青になり——街の明かりが、端から順に消えていった。',
      '停電。',
      'あの夜と、同じだ。——そう、思った。見たはずのない夜なのに。'
    ]);

    /* 暗闇の中で、公衆電話が鳴る */
    var answered = false;
    hooks.signal = function () { U.note('信号は、すべて消えている。'); };
    hooks.ped = function () { A.se('tick'); SWT.set(PED, true, 'player'); SWT.set(PED, false, 'system'); U.note('押しボタンを押しても、もう何も点かない。'); };
    hooks.phone = function () { answered = true; };
    await SW.wait(1500);
    q('.c6-booth').classList.add('on', 'ring'); dk.set('booth', true); A.se('ring_tone');
    S.focus(1500, 520, 1, 2400);
    await SW.wait(1200);
    U.note('暗い交差点で、電話ボックスだけに明かりが点いた。——電話が、鳴っている。'); S.hint(PHONE, true);
    while (!(await SW.until(function () { return answered; }, 6500))) { if (!S.locked) A.se('ring_tone'); }
    hooks = {}; S.hint(PHONE, false); U.noteHide();
    SWT.set(PHONE, true, 'player'); SWT.event(PHONE, 'answered'); A.se('tick'); q('.c6-booth').classList.remove('ring');
    S.focus(1590, 560, 1.25, 2400);
    await SW.wait(1400);
    await U.say([
      '受話器を、取った。',
      misaki('蓮。'),
      misaki('怖がらないで。これは、あの夜の続きなだけ。'),
      misaki('駅前の公園に来て。慰霊碑の前で、待ってる。'),
      ren('慰霊碑……？'),
      misaki('全部、そこに書いてあるから。')
    ]);
    A.se('cut'); SWT.set(PHONE, false, 'system');
    v.scene = 'leaving';
    await SW.wait(700);
    await U.fade(1, 1500);
    A.stopAll(0.8);
  }

  /* ================= 慰霊碑 ================= */
  var NAMES = [['相沢 文子', 74], ['石川 悟', 52], ['佐伯 美咲', 29], ['高瀬 蓮', 31], ['中村 節子', 81], ['藤井 勝', 68], ['森 由香', 40]];
  var HTML_M =
    '<img class="ly" src="' + SW.IMAGES.ch06_memorial + '" alt="" draggable="false">' +
    '<div class="abs c6-plaque"><b>灯ヶ丘大停電　犠牲者慰霊碑</b><i>' + YEAR + '年十一月十七日</i><p>' +
      NAMES.map(function (n) { return '<span' + (n[1] === 29 || n[1] === 31 ? ' class="us"' : '') + '>' + n[0] + '<em>' + n[1] + '歳</em></span>'; }).join('') + '</p></div>' +
    '<canvas class="ly c6-dark" width="640" height="360"></canvas>' +
    '<div class="abs c6-lan" style="left:610px"></div><div class="abs c6-lan" style="left:1250px"></div>' +
    '<div class="abs c6-btn"></div>' +
    '<div class="abs c6-tower"></div>' +
    '<style>' +
    '.c6-dark{mix-blend-mode:multiply;opacity:1;transition:opacity 1.4s}' +
    '.c6-plaque{left:740px;top:340px;width:440px;height:330px;box-sizing:border-box;padding:22px 26px 0;text-align:center;color:#e0cb92;text-shadow:0 1px 0 #1c160a,0 -1px 0 rgba(255,240,200,.25);font-family:"Hiragino Mincho ProN","Yu Mincho","Noto Serif JP",serif}' +
    '.c6-plaque b{display:block;font-size:25px;letter-spacing:3px}.c6-plaque i{display:block;font-style:normal;font-size:15px;letter-spacing:3px;margin:8px 0 14px;opacity:.85}' +
    '.c6-plaque p{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:9px 18px;text-align:left;font-size:18px;letter-spacing:2px}' +
    '.c6-plaque em{font-style:normal;font-size:12px;margin-left:8px;opacity:.8;letter-spacing:0}' +
    '.c6-lan{top:440px;width:60px;height:74px;opacity:0;transition:opacity 1.2s;background:#ffe9b8;box-shadow:0 0 30px 14px rgba(255,226,160,.7),0 0 140px 60px rgba(255,216,150,.28)}.c6-lan.on{opacity:1}' +
    '.c6-btn{left:1446px;top:704px;width:48px;height:48px;border-radius:50%;opacity:0;box-shadow:0 0 0 3px rgba(255,220,150,.95) inset,0 0 14px 5px rgba(255,200,110,.7)}.c6-btn.on{opacity:1}' +
    '.c6-tower{left:1634px;top:262px;width:46px;height:210px;opacity:0;transition:opacity 2.5s;' +
      'background:repeating-linear-gradient(180deg,rgba(255,236,190,.95) 0 6px,transparent 6px 15px);box-shadow:0 0 40px 10px rgba(255,226,170,.25)}.c6-tower.on{opacity:1}' +
    '</style>';
  function darkM(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#05070b"/>' +
      g(60, '<ellipse cx="960" cy="60" rx="1400" ry="520" fill="#161c2a"/>') +
      g(60, '<ellipse cx="960" cy="900" rx="900" ry="260" fill="#12161c"/>') +
      (on.tower ? g(30, '<ellipse cx="1657" cy="370" rx="90" ry="170" fill="#3a3222"/>') : '');
  }
  function setLamp(on) {
    v.lamp = on; q('.c6-dark').style.opacity = on ? 0 : 1; q('.c6-btn').classList.toggle('on', on);
    all('.c6-lan').forEach(function (e) { e.classList.toggle('on', on); });
  }
  function buildM() {
    v = { scene: 'memorial', lamp: false };
    hooks = {}; snd = snd || {};
    clearInterval(timer);
    S.mount(HTML_M);
    dk = S.shade(q('.c6-dark'), darkM);
    SWT.define(LAMP, false);
    S.hotspot('LOOK_CITY', [0, 300, 560, 410], '街', function () { if (hooks.city) hooks.city(); });
    S.hotspot('LOOK_BENCH', [150, 740, 300, 170], 'ベンチ', function () { U.note('公園のベンチ。——あの写真の背景は、この木立だ。'); });
    S.hotspot('LOOK_STONE', [680, 280, 560, 480], '石碑', function () { if (hooks.stone) hooks.stone(); });
    S.hotspot(LAMP, [1400, 600, 140, 310], '献灯のボタン', function () { S.hint(LAMP, false); if (hooks.lamp) return hooks.lamp(); });
    setLamp(false);
    snd.amb = A.loop('night', 0.6, 2.5);
  }

  /* ============================================================
     場面 2 : 慰霊碑
     ============================================================ */
  async function beatM() {
    SW.checkpoint('memorial');
    var f = SW.game.flags;
    snd = {};
    buildM();
    S.focus(1100, 560, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2600);
    await U.say([
      '駅前公園。街の明かりは、消えたままだ。',
      '暗がりの中に、大きな石が立っている。',
      '足元の小さな柱に、「献灯」と書かれたボタンがある。'
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    var busy = false, read = false;
    hooks.city = function () { U.note('街は、真っ暗だ。窓のひとつも、点いていない。'); };
    hooks.stone = function () { U.note(v.lamp ? '石に刻まれた名前。「高瀬 蓮」。「佐伯 美咲」。' : '大きな石碑。何か刻まれているが、暗くて読めない。'); };
    hooks.lamp = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(LAMP, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setLamp(on);
      if (!on || read) { U.note(on ? '献灯を、もう一度点けた。名前が、灯りの中に浮かぶ。' : '献灯を、消した。石は、また闇に沈んだ。'); return; }
      busy = true; read = true; U.noteHide(); SWT.event(LAMP, 'read_names');
      S.focus(960, 500, 1.1, 2400);
      await SW.wait(2200);
      await U.say([
        '献灯のボタンを押した。石の両脇に灯りが点き、刻まれた文字が浮かび上がる。',
        '「灯ヶ丘大停電　犠牲者慰霊碑」',
        YEAR + '年十一月十七日。',
        '名前が、並んでいる。'
      ]);
      S.focus(960, 530, S.isNarrow() ? 1 : 1.7, 3000);   // 縦長の画面では、名前が左右で切れないように寄りすぎない
      await SW.wait(2400);
      await U.say([
        '「佐伯 美咲　二十九歳」',
        '「高瀬 蓮　三十一歳」',
        ren('……そうか。'),
        'テレビの中の彼女を、知らない人だと思った。写真を撮った覚えが、なかった。',
        '十一年前の記録の歳が、今の俺と同じだった。空のベッドのモニターに、俺の脈が流れていた。',
        'どの時計も、二十時十七分から、進まなかった。',
        ren('俺は、あの夜に、死んだのか。')
      ]);
      S.focus(1000, 540, 1.15, 2600);
      await SW.wait(1200);
      await U.say([
        '隣で、声がした。振り向いても、誰もいない。それでも、すぐそばにいると分かった。',
        misaki('うん。'),
        misaki('私も。——あなたの息を、手で送りつづけた。発電機を見に行こうとして、暗い階段で、足を踏み外した。'),
        ren('ここは、どこなんだ。'),
        misaki('あの夜に失われた人たちの記憶を、つなぎ合わせて作った街。'),
        misaki('だから、時計は進まない。だから、あなたも私も、歳を取らない。'),
        misaki('街は覚えていても、人までは、作りきれなかった。だから、誰にも会わなかったの。'),
        ren('誰が、こんなものを。'),
        misaki('それは、黒田さんに聞いて。あの人は十一年間ずっと、謝る言葉を探してる。')
      ]);
      busy = false; v.told = true;
    });
    await SW.wait(3000);
    if (!read) S.hint(LAMP, true);
    if (!(await SW.until(function () { return v.told; }, 30000))) {
      if (!busy) U.note('「献灯」のボタン。——押せば、灯りが点くのだろう。');
      await SW.until(function () { return v.told; });
    }

    /* ---- 選択：慰霊碑の灯りを、消すか ---- */
    hooks = {}; U.noteHide();
    await SW.wait(900);
    await U.say([
      misaki('ねえ、蓮。'),
      misaki('その灯り、消してもいいよ。見たくなければ。'),
      misaki('でも私は——点けておいてほしい。私たちが、ここにいた印だから。')
    ]);
    var off = false;
    hooks.lamp = function () { off = true; };
    hooks.stone = function () { U.note('「高瀬 蓮　三十一歳」。何度読んでも、俺の名前だ。'); };
    hooks.city = function () { U.note('明かりの消えた街。あの夜も、こうだったのだろう。'); };
    S.hint(LAMP, true); S.focus(1200, 560, 1, 2400);
    await SW.until(function () { return off; }, 15000);
    hooks = {}; S.hint(LAMP, false); U.noteHide();
    if (off) {
      f.ch06_accepted = false; SWT.set(LAMP, false, 'player'); SWT.event(LAMP, 'put_out'); A.se('switch_off'); setLamp(false);
      await SW.wait(1800);
      await U.say(['献灯を、消した。名前は、闇の中に戻った。', misaki('……うん。分かった。'), misaki('見えなくなっても、消えたわけじゃないから。')]);
    } else {
      f.ch06_accepted = true; SWT.event(LAMP, 'kept_lit');
      await U.say(['灯りには、触れなかった。ふたつの名前が、並んで照らされている。', misaki('……ありがとう。')]);
    }

    /* 暗い街の向こうに、ひとつだけ明かりの点いた建物 */
    await SW.wait(1200);
    q('.c6-tower').classList.add('on'); dk.set('tower', true); A.se('tick');
    S.focus(1500, 420, 1.1, 3200);
    await SW.wait(3000);
    await U.say([
      '明かりの消えた街の向こうに、ひとつだけ、灯りの点いた建物がある。',
      ren('あれは？'),
      misaki('中央制御施設。SWITCHの、中枢。'),
      misaki('行って、蓮。最後のスイッチが、あなたを待ってる。')
    ]);
    A.stopAll(1.2);
    await U.fade(1, 1500);
    await SW.wait(1000);
  }

  SW.chapters.ch06 = {
    no: 'CHAPTER 06', title: 'THE CITY',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'memorial') return beatM();
      buildX();
      await beatX();
      await beatM();
    },
    stop: function () { cancelAnimationFrame(raf); clearInterval(timer); v = null; }
  };
})(window.SW);
