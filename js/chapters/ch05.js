/* ============================================================
   SWITCH — CHAPTER 05 : THE FACTORY
   舞台：灯ヶ丘実証プラントの搬入口 → 制御室
   第4章の直後。11年前に実験が行われた、閉鎖された工場。
   黒田修一（元研究者）と、通話機ごしに話す。

   次の章へ引き継ぐ記録（SW.game.flags）
     ch05_leverTries  … 「系統」スイッチを動かした回数
     ch05_recorderOff … 黒田に頼まれて、入力記録計を止めたか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var LT = 'LIGHT_FACTORY_01', FAN = 'FAN_01', SH = 'SHUTTER_01', BEACON = 'BEACON_01', IC = 'INTERCOM_FACTORY_01',
      SYS = 'SYSTEM_SWITCH_01', REC = 'RECORDER_01', TALK = 'INTERCOM_CONTROL_01';
  var YEAR = new Date().getFullYear() - 11;

  var v, hooks, snd, raf, dk;
  function q(c) { return S.$(c); }
  function ren(t) { return { who: '蓮', text: t }; }
  function kuroda(t) { return { who: '黒田', text: t, voice: true }; }

  var DEFS = '<defs><filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
    '<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>';
  function g(f, inner) { return '<g filter="url(#b' + f + ')" style="mix-blend-mode:lighten">' + inner + '</g>'; }

  /* ================= 搬入口 ================= */
  var HTML_DOCK =
    '<img class="ly" src="' + SW.IMAGES.ch05_dock + '" alt="" draggable="false">' +
    '<div class="abs c5-shut"><i></i></div>' +
    '<div class="abs c5-fan"></div>' +
    '<div class="abs c5-rocker a"></div><div class="abs c5-rocker b"></div>' +
    '<canvas class="ly c5-dark" width="640" height="360"></canvas>' +
    '<div class="abs c5-hb" style="left:440px"></div><div class="abs c5-hb" style="left:1360px"></div>' +
    '<div class="abs c5-beacon"></div>' +
    '<div class="abs c5-icled"></div><div class="abs c5-shled"></div>' +
    '<style>' +
    '.c5-shut{left:640px;top:230px;width:640px;height:590px;overflow:hidden}' +
    '.c5-shut i{position:absolute;inset:0;transition:transform 5.2s linear;box-shadow:inset 0 -30px 40px rgba(0,0,0,.35);' +
      'background:repeating-linear-gradient(180deg,#a4acb0 0,#b4bcc0 14px,#8a9296 22px,#6a7276 24px)}' +
    '.c5-shut.open i{transform:translateY(-562px)}' +
    '.c5-fan{left:162px;top:172px;width:224px;height:224px;border-radius:50%;' +
      'background:radial-gradient(circle,#3a3d41 0 13%,transparent 14%),conic-gradient(#555a5e 0 12%,#0e1013 12% 25%,#555a5e 25% 37%,#0e1013 37% 50%,#555a5e 50% 62%,#0e1013 62% 75%,#555a5e 75% 87%,#0e1013 87% 100%)}' +
    '.c5-fan.on{animation:c5spin .7s linear infinite}@keyframes c5spin{to{transform:rotate(360deg)}}' +
    '.c5-rocker{top:452px;width:40px;height:62px;border-radius:3px;box-shadow:0 0 0 1px #77797b,1px 2px 3px rgba(0,0,0,.3);background:linear-gradient(100deg,#dcdcd4 0%,#f1f1ea 55%,#cfcfc6 100%)}' +
    '.c5-rocker.a{left:1418px}.c5-rocker.b{left:1558px}.c5-rocker.on{background:linear-gradient(100deg,#c9c9c0 0%,#ebebe4 45%,#e6e6de 100%)}' +
    '.c5-dark{mix-blend-mode:multiply;opacity:1;transition:opacity 5s ease-in}' +
    '.c5-hb{top:100px;width:120px;height:20px;border-radius:50%;opacity:0;transition:opacity 5s ease-in;background:#fff3d0;box-shadow:0 0 26px 12px rgba(255,238,190,.85),0 30px 140px 60px rgba(255,228,170,.3)}' +
    '.c5-hb.on{opacity:1}' +
    '.c5-beacon{left:940px;top:120px;width:40px;height:32px;border-radius:14px 14px 3px 3px;background:#5a4410;opacity:.9}' +
    '.c5-beacon.on{background:#ffc02e;animation:c5beacon .9s linear infinite}' +
    '@keyframes c5beacon{0%{box-shadow:-40px 0 50px 14px rgba(255,180,40,.7)}50%{box-shadow:40px 0 50px 14px rgba(255,180,40,.7)}100%{box-shadow:-40px 0 50px 14px rgba(255,180,40,.7)}}' +
    '.c5-icled{left:1731px;top:317px;width:38px;height:38px;border-radius:50%;opacity:0;box-shadow:0 0 0 3px rgba(120,255,160,.9) inset,0 0 12px 3px rgba(80,255,140,.75)}.c5-icled.on{opacity:1}' +
    '.c5-shled{left:1727px;top:463px;width:46px;height:46px;border-radius:50%;opacity:0;box-shadow:0 0 0 3px rgba(150,255,190,.95) inset,0 0 14px 5px rgba(80,255,140,.8)}.c5-shled.on{opacity:1}' +
    '</style>';
  function darkDock(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#05070a"/>' +
      g(30, '<ellipse cx="274" cy="284" rx="170" ry="170" fill="#1c2434"/>') +
      g(60, '<ellipse cx="1560" cy="470" rx="480" ry="360" fill="#20262c"/>') +   /* 開いた門からの、外の薄明かり */
      (on.beacon ? g(60, '<ellipse cx="960" cy="330" rx="620" ry="420" fill="#4a3a14"/>') : '') +
      (on.open ? g(60, '<ellipse cx="960" cy="560" rx="300" ry="330" fill="#2c3a36"/>') : '');
  }
  function setLight(on) {
    v.light = on; q('.c5-rocker.a').classList.toggle('on', on);
    q('.c5-dark').style.transitionDuration = on ? '5s' : '.4s'; q('.c5-dark').style.opacity = on ? 0 : 1;
    document.querySelectorAll('#scene .c5-hb').forEach(function (e) { e.style.transitionDuration = on ? '5s' : '.4s'; e.classList.toggle('on', on); });
    if (on && !snd.hum) snd.hum = A.loop('hum', 0.6, 4);
    if (!on && snd.hum) { snd.hum.stop(0.1); snd.hum = null; }
  }
  function setFan(on) {
    q('.c5-rocker.b').classList.toggle('on', on); q('.c5-fan').classList.toggle('on', on);
    if (on && !snd.fan) snd.fan = A.loop('fan', 0.5, 2.5, 'se');
    if (!on && snd.fan) { snd.fan.stop(2.5); snd.fan = null; }
  }

  function buildDock() {
    v = { scene: 'dock', light: false, ops: 0 };
    hooks = {}; snd = {};
    S.mount(HTML_DOCK);
    dk = S.shade(q('.c5-dark'), darkDock);
    SWT.define(LT, false); SWT.define(FAN, false); SWT.define(SH, false); SWT.define(BEACON, false); SWT.define(IC, false);
    S.hotspot('LOOK_SHUT', [640, 230, 640, 590], 'シャッター', function () { U.note('大きなシャッター。下りたまま、錆が浮いている。'); });
    S.hotspot('LOOK_SIGN', [1380, 210, 256, 120], '看板', function () { U.note('「灯ヶ丘実証プラント　統合制御システム SWITCH」。——病院のモニターに出ていた名前だ。'); });
    S.hotspot(LT, [1374, 394, 128, 162], '照明のスイッチ', function () {
      v.ops++; var on = SWT.toggle(LT, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setLight(on);
      U.note(on ? '照明のスイッチを入れた。水銀灯が、ゆっくりと明るくなっていく。——ここには、電気が来ている。' : '照明を切った。');
    });
    S.hotspot(FAN, [1514, 394, 128, 162], '換気扇のスイッチ', function () {
      v.ops++; var on = SWT.toggle(FAN, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setFan(on);
      U.note(on ? '換気扇が、回りはじめた。積もっていた埃が、舞い上がる。' : '換気扇を止めた。羽根の音が、ゆっくりと遠ざかる。');
    });
    S.hotspot(IC, [1690, 240, 120, 150], '制御室への呼び出しボタン', function () { v.ops++; S.hint(IC, false); if (hooks.icom) return hooks.icom(); });
    S.hotspot(SH, [1690, 412, 120, 166], 'シャッターのスイッチ', function () { v.ops++; S.hint(SH, false); if (hooks.shutter) return hooks.shutter(); });
    setLight(false);
    snd.amb = A.loop('roomtone', 0.5, 2.5); snd.deep = A.loop('genhum', 0.16, 4);
  }

  /* ============================================================
     場面 1 : 搬入口
     ============================================================ */
  async function beatDock() {
    SW.checkpoint('start');
    await SW.wait(600);
    await U.say([
      '病院を出ると、街は静まり返っていた。',
      '「工場に行って」。「黒田さんが、まだ、そこにいる」。',
      '灯ヶ丘実証プラント。工業団地のはずれにある、閉鎖された工場だ。',
      '錆びた門は、開いていた。'
    ]);
    S.focus(1200, 500, 1, 0);
    U.fade(0, 2600);
    await SW.wait(1200);
    await U.card('CHAPTER 05', 'THE FACTORY', 3400);
    await SW.wait(700);
    await U.say([
      '搬入口。機械油と、埃のにおいがする。',
      '閉鎖されたはずの建物の奥で、低い唸りが続いている。',
      ren('……何かが、動いている。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    var busy = false, allowed = false, opened = false;
    hooks.shutter = function () {
      A.se('tick'); SWT.set(SH, true, 'player'); SWT.set(SH, false, 'system'); SWT.event(SH, 'locked_out');
      U.note('シャッターの「開」を押した。……動かない。どこかで、止められている。');
    };
    hooks.icom = SW.guard(async function () {
      if (busy) return;
      busy = true; U.noteHide();
      SWT.set(IC, true, 'player'); SWT.event(IC, 'called_kuroda'); A.se('beep'); q('.c5-icled').classList.add('on');
      S.focus(1620, 400, 1.2, 2400);
      await SW.wait(1200); A.se('ring_tone');
      await SW.wait(2800);
      await U.say(['制御室への、呼び出しボタンを押した。', '長い沈黙のあと、スピーカーが鳴った。']);
      A.se('crackle');
      await U.say([
        { who: '？？？', text: '……誰だ。', voice: true },
        ren('高瀬といいます。黒田さんを、探しています。'),
        kuroda('高瀬——。'),
        kuroda('……そうか。君は、ここまで来たのか。'),
        kuroda('シャッターを開けなさい。いま、動くようにした。')
      ]);
      A.se('cut'); q('.c5-icled').classList.remove('on'); SWT.set(IC, false, 'system');
      allowed = true; busy = false;
      hooks.icom = function () { A.se('beep'); U.note('呼び出しボタンを押した。……もう、応答はない。'); };
      hooks.shutter = function () { opened = true; };
      S.hint(SH, true);
    });
    await SW.wait(3000);
    if (!allowed && !busy) S.hint(IC, true);
    if (!(await SW.until(function () { return allowed; }, 26000))) {
      if (!busy) U.note('壁に、「制御室」と書かれた呼び出しボタンがある。');
      await SW.until(function () { return allowed; });
    }
    if (!(await SW.until(function () { return opened; }, 20000))) {
      U.note('黄色い箱の「開」のボタン。——黒田は、動くようにしたと言った。');
      await SW.until(function () { return opened; });
    }
    /* シャッターが上がる */
    hooks = {}; S.hint(SH, false); U.noteHide(); S.locked = true;
    SWT.set(SH, true, 'player'); SWT.event(SH, 'opened'); A.se('switch_on'); q('.c5-shled').classList.add('on');
    await SW.wait(500);
    SWT.set(BEACON, true, 'system'); q('.c5-beacon').classList.add('on'); dk.set('beacon', true);
    snd.motor = A.loop('elev', 0.45, 0.6, 'se');
    q('.c5-shut').classList.add('open'); dk.set('open', true);
    S.focus(960, 520, 1.08, 5000, 'ease-in-out');
    await SW.wait(5300);
    snd.motor.stop(0.5); A.se('lock');
    q('.c5-beacon').classList.remove('on'); dk.set('beacon', false); SWT.set(BEACON, false, 'system'); q('.c5-shled').classList.remove('on');
    await SW.wait(900);
    S.locked = false;
    await U.say([
      '回転灯が回り、シャッターが、ゆっくりと上がっていった。',
      '通路の奥に、明かりの漏れるドアがある。「制御室」。',
      '唸りは、あの向こうから聞こえてくる。'
    ]);
    v.scene = 'leaving';
    await U.fade(1, 1500);
    A.stopAll(0.8);
  }

  /* ================= 制御室 ================= */
  var PLACES = [['house', 380, 250], ['station', 600, 330], ['hospital', 820, 240], ['shop', 470, 430], ['factory', 760, 440], ['under', 980, 380]];
  var HTML_CTRL =
    '<img class="ly" src="' + SW.IMAGES.ch05_control + '" alt="" draggable="false">' +
    '<div class="abs c5-dim"></div>' +
    PLACES.map(function (p) { return '<div class="abs c5-lamp ' + p[0] + '" style="left:' + (p[1] - 16) + 'px;top:' + (p[2] - 16) + 'px"></div>'; }).join('') +
    '<div class="abs c5-status"><p></p><p></p></div>' +
    '<div class="abs c5-clock">20:17</div>' +
    '<div class="abs c5-glow"></div>' +
    '<canvas class="abs c5-tv" width="230" height="130"></canvas>' +
    '<div class="abs c5-lever"><i></i></div>' +
    '<div class="abs c5-paper"><pre></pre></div><div class="abs c5-recled"></div>' +
    '<div class="abs c5-talkled"></div>' +
    '<style>' +
    '.c5-dim{left:0;top:0;width:1920px;height:1080px;background:#04070a;opacity:.5}' +
    '.c5-lamp{width:32px;height:32px;border-radius:50%;background:#1c2420}' +
    '.c5-lamp.on{background:#8dffb4;box-shadow:0 0 10px 4px rgba(90,255,150,.85),0 0 34px 12px rgba(70,240,130,.4)}' +
    '.c5-lamp.blink{animation:c5blink 1.3s steps(1) infinite}@keyframes c5blink{0%{opacity:1}55%{opacity:.25}}' +
    '.c5-lamp.alert{background:#ff6a58;box-shadow:0 0 10px 4px rgba(255,80,60,.9),0 0 34px 12px rgba(255,60,40,.45);animation:c5blink .45s steps(1) infinite}' +
    '.c5-status{left:1180px;top:110px;width:330px;height:96px;font:700 21px/40px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif;color:#ffb65c;text-shadow:0 0 5px rgba(255,160,60,.9),0 0 14px rgba(255,140,40,.45);padding:8px 0 0 14px;box-sizing:border-box;white-space:pre}' +
    '.c5-status p{margin:0;height:40px}.c5-status p:nth-child(2){font-size:15px;color:#c9a070}.c5-status.alert{color:#ff4a3a;text-shadow:0 0 5px rgba(255,70,50,.9)}' +
    '.c5-clock{left:1560px;top:110px;width:150px;height:70px;font:500 40px/70px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}' +
    '.c5-glow{left:960px;top:70px;width:960px;height:700px;mix-blend-mode:screen;opacity:.2;background:radial-gradient(ellipse at 50% 46%,rgba(150,200,175,.4) 0%,rgba(90,130,110,.12) 40%,transparent 68%)}' +
    '.c5-tv{left:1210px;top:266px;width:460px;height:259px}' +
    '.c5-lever{left:540px;top:634px;width:80px;height:76px;border-radius:5px;background:#2a1513;box-shadow:0 0 0 2px #7a1f18,inset 0 2px 6px rgba(0,0,0,.7)}' +
    '.c5-lever i{position:absolute;left:8px;right:8px;top:40px;height:30px;border-radius:4px;background:linear-gradient(#f1f1ea,#a9a9a0);box-shadow:0 2px 4px rgba(0,0,0,.5);transition:top .1s}' +
    '.c5-lever.on i{top:6px}' +
    '.c5-paper{left:900px;top:606px;width:220px;height:0;overflow:hidden;background:#f4f2e6;box-shadow:0 0 14px rgba(0,0,0,.5);transition:height 1.6s linear,top 1.6s linear}' +
    '.c5-paper.out{height:150px;top:456px}' +
    '.c5-paper pre{margin:0;padding:8px 9px;font:9.5px/17px ui-monospace,Menlo,Consolas,monospace;color:#2a2c28;white-space:pre}' +
    '.c5-recled{left:1128px;top:578px;width:9px;height:9px;border-radius:50%;background:#3a1512}.c5-recled.on{background:#ff5a48;box-shadow:0 0 8px 3px rgba(255,70,50,.9)}' +
    '.c5-talkled{left:1446px;top:636px;width:9px;height:9px;border-radius:50%;background:#14301c}.c5-talkled.on{background:#6dffa6;box-shadow:0 0 8px 3px rgba(54,255,136,.8)}' +
    '</style>';

  function lamp(name, cls) { var e = q('.c5-lamp.' + name); e.className = 'abs c5-lamp ' + name + (cls ? ' ' + cls : ''); }
  function setStatus(a, b, alert) { var s = q('.c5-status'); s.children[0].textContent = a; s.children[1].textContent = b; s.classList.toggle('alert', !!alert); }

  /* これまでにプレイヤーが押したスイッチを、記録計に打ち出す */
  function inputLog() {
    var ids = ['LIGHT_ROOM_01', 'INTERCOM_01'], sw = SW.game.switches, k;
    for (k in sw) if (sw[k].count > 0 && ids.indexOf(k) < 0 && k !== REC && k !== SYS) ids.push(k);
    ids = ids.slice(0, 2).concat(ids.slice(2).slice(-4));
    return ids.map(function (id) { return '20:17 ' + (id + '                    ').slice(0, 20) + ' 入'; }).join('\n') + '\n入力元：不明';
  }

  /* ---------- 主機室の映像：背を向けて座る男 ---------- */
  var low = document.createElement('canvas'); low.width = 115; low.height = 65;
  var nz = document.createElement('canvas'); nz.width = 115; nz.height = 65;
  function drawFeed(now) {
    var c = low.getContext('2d'), k, i, j;
    c.fillStyle = '#070b0b'; c.fillRect(0, 0, 115, 65);
    c.fillStyle = '#141c1b'; c.beginPath(); c.moveTo(0, 0); c.lineTo(36, 10); c.lineTo(36, 50); c.lineTo(0, 65); c.fill();
    c.beginPath(); c.moveTo(115, 0); c.lineTo(79, 10); c.lineTo(79, 50); c.lineTo(115, 65); c.fill();
    c.fillStyle = '#0c1110'; c.fillRect(36, 10, 43, 40);
    c.fillStyle = '#1a2221'; c.beginPath(); c.moveTo(0, 65); c.lineTo(36, 50); c.lineTo(79, 50); c.lineTo(115, 65); c.fill();
    for (i = 0; i < 9; i++) for (j = 0; j < 7; j++) {   // 機械のランプ
      var t = Math.sin(now / 300 + i * 7.3 + j * 3.1);
      c.fillStyle = t > 0.2 ? (i + j) % 5 ? 'rgba(110,255,160,.9)' : 'rgba(255,190,90,.9)' : 'rgba(40,70,55,.6)';
      c.fillRect(3 + j * 4.2 * (1 - i * 0.02), 8 + i * 5.6 + j * 0.9, 1.2, 1.2); c.fillRect(110 - j * 4.2 * (1 - i * 0.02), 8 + i * 5.6 + j * 0.9, 1.2, 1.2);
    }
    k = c.createRadialGradient(57, 34, 1, 57, 34, 26); k.addColorStop(0, 'rgba(170,220,200,.5)'); k.addColorStop(1, 'rgba(120,180,160,0)');
    c.fillStyle = k; c.fillRect(20, 6, 75, 56);
    c.fillStyle = '#9fd0c0'; c.fillRect(46, 22, 22, 3);                                    // 端末の画面（頭の向こうに、上の縁だけ見える）
    c.fillStyle = '#0a0c0c'; c.fillRect(44, 44, 26, 21);                                    // 椅子の背
    c.beginPath(); c.moveTo(41, 65); c.quadraticCurveTo(42, 43, 51, 41); c.lineTo(63, 41); c.quadraticCurveTo(72, 43, 73, 65); c.fill();
    c.fillStyle = '#3a4444'; c.beginPath(); c.moveTo(43, 65); c.quadraticCurveTo(44, 45, 52, 43); c.lineTo(62, 43); c.quadraticCurveTo(70, 45, 71, 65); c.fill();
    c.fillStyle = '#6f7a78'; c.fillRect(54.5, 37, 5, 6);
    c.fillStyle = '#b9c0bd'; c.beginPath(); c.ellipse(57, 33 + (v.nod ? Math.sin(now / 400) * 0.4 : 0), 5.4, 6.2, 0, 0, 7); c.fill();   // 白髪の頭
    c.fillStyle = 'rgba(20,26,25,.35)'; c.beginPath(); c.ellipse(57, 36, 5.4, 3.4, 0, 0, 7); c.fill();
  }
  var lastT = 0, frame = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 60 || !v || v.scene !== 'ctrl' || !q('.c5-tv')) return;
    lastT = now; frame++;
    var c = q('.c5-tv').getContext('2d'), x = nz.getContext('2d'), im = x.createImageData(115, 65), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var n = Math.random() * 255; d[i] = n * .9; d[i + 1] = n; d[i + 2] = n * .95; d[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    drawFeed(now); c.globalAlpha = 1; c.drawImage(low, 0, 0, 230, 130);
    c.globalAlpha = 0.16 + v.noise; c.drawImage(nz, 0, 0, 230, 130); c.globalAlpha = 1;
    if (Math.random() < 0.06 + v.noise) { var y = Math.random() * 120 | 0, h = 2 + Math.random() * 8 | 0; c.drawImage(q('.c5-tv'), 0, y, 230, h, (Math.random() - .5) * 22, y, 230, h); }
    c.font = '7px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(235,245,238,.88)';
    var sec = Math.floor(now / 1000) % 60;
    c.fillText('20:17:' + (sec < 10 ? '0' : '') + sec, 190, 124); c.fillText('CAM 主機室', 6, 11);
    c.fillStyle = 'rgba(0,0,0,.2)'; for (var s = 0; s < 130; s += 2) c.fillRect(0, s, 230, 1);
  }

  function setRec(on, quiet) {
    v.rec = on; q('.c5-recled').classList.toggle('on', on); q('.c5-paper').classList.toggle('out', on);
    if (on && !quiet) A.se('printer');
  }
  function buildCtrl() {
    v = { scene: 'ctrl', noise: 0, nod: false, rec: false };
    hooks = {}; snd = snd || {};
    S.mount(HTML_CTRL);
    SWT.define(SYS, false); SWT.define(REC, false); SWT.define(TALK, false);
    q('.c5-paper pre').textContent = inputLog();
    lamp('house', 'on'); lamp('station', 'on'); lamp('hospital', 'on'); lamp('factory', 'on blink');
    setStatus('SWITCH　状態：停止', '最終操作　' + YEAR + '/11/17 20:19');
    S.hotspot('LOOK_MAP', [270, 180, 840, 380], '系統図', function () { if (hooks.map) hooks.map(); });
    S.hotspot('LOOK_STATUS', [1180, 110, 330, 96], '状態表示', function () { if (hooks.status) hooks.status(); });
    S.hotspot('LOOK_MON', [1210, 266, 460, 259], '主機室の映像', function () { if (hooks.monitor) hooks.monitor(); });
    S.hotspot(SYS, [470, 590, 220, 130], '系統スイッチ', function () { S.hint(SYS, false); if (hooks.sys) return hooks.sys(); });
    S.hotspot(REC, [860, 470, 300, 250], '入力記録計のスイッチ', function () { S.hint(REC, false); if (hooks.rec) return hooks.rec(); });
    S.hotspot(TALK, [1300, 620, 170, 100], '主機室との通話ボタン', function () { S.hint(TALK, false); if (hooks.talk) return hooks.talk(); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    snd.amb = A.loop('roomtone', 0.5, 2); snd.deep = A.loop('genhum', 0.3, 2.5);
  }

  /* ============================================================
     場面 2 : 制御室
     ============================================================ */
  async function beatCtrl() {
    SW.checkpoint('control');
    var f = SW.game.flags;
    snd = {};
    buildCtrl();
    S.focus(900, 420, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2400);
    await U.say([
      '制御室。壁の一面が、この街の系統図になっている。',
      '住宅街、駅、病院——ランプが点いているのは、俺が通ってきた場所ばかりだ。',
      '隣のモニターに、白髪の男の背中が映っている。'
    ]);
    q('.c5-talkled').classList.add('on'); A.se('crackle');
    await U.say([
      kuroda('私は、主機室から動けない。話は、その通話機でしよう。'),
      kuroda('見たいものを、見るといい。聞きたいことは、聞きなさい。')
    ]);
    q('.c5-talkled').classList.remove('on');
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);

    var busy = false, stage = 0, lever = false, logged = false;
    hooks.map = function () { U.note('点いているランプは、住宅街、駅、病院。——俺が通ってきた順だ。工場のランプは、点滅している。'); };
    hooks.status = function () { U.note('「SWITCH　状態：停止」。最終操作は、' + YEAR + '年十一月十七日、二十時十九分。'); };
    hooks.monitor = function () { U.note('主機室の映像。白髪の男が、こちらに背を向けて座っている。一度も、振り返らない。'); };
    hooks.talk = SW.guard(async function () {
      if (busy) return;
      busy = true; U.noteHide();
      SWT.set(TALK, true, 'player'); A.se('beep'); q('.c5-talkled').classList.add('on'); v.nod = true;
      await SW.wait(700);
      if (stage === 0) await U.say([
        ren('SWITCHというのは、何なんですか。'),
        kuroda('この街の、電気と、通信と、設備。そのすべてをひとつにつないで、管理する仕組みだ。'),
        kuroda('信号も、駅も、病院も、家の明かりも。街じゅうのスイッチを、一か所から、いちばん無駄のないように動かす。'),
        kuroda('そのための実験を、ここでしていた。私は、それを作ったひとりだ。')
      ]);
      else if (stage === 1) await U.say([
        ren('十一年前に、何があったんですか。'),
        kuroda(YEAR + '年、十一月十七日。二十時十七分。'),
        kuroda('系統を切り替える試験の最中に、制御が、こちらの手を離れた。街じゅうの電気が、一斉に落ちた。'),
        kuroda('病院の非常電源まで、SWITCHにつないであった。……つなぐべきでは、なかった。'),
        ren('その夜、病院で——'),
        kuroda('知っている。……知っているとも。')
      ]);
      else if (stage === 2) await U.say([
        ren('SWITCHは、そのあと、どうなったんですか。'),
        kuroda('止めた。事故の二分後に、私がこの手で、系統スイッチを切った。'),
        kuroda('そこの表示を見なさい。「状態：停止」。——十一年間、そのままだ。'),
        lever ? kuroda('それなのに、動いている。——君がさっき、その手で確かめたとおりだ。')
              : kuroda('それなのに、系統図のランプは点いている。……おかしいとは、思わないかね。')
      ]);
      else await U.say([kuroda('話せることは、もう話した。あとは、君がその目で確かめなさい。')]);
      if (stage < 3) stage++;
      SWT.event(TALK, 'talk_' + stage);
      q('.c5-talkled').classList.remove('on'); v.nod = false; SWT.set(TALK, false, 'system');
      busy = false;
      if (stage < 3) S.hint(TALK, true); else if (!lever) S.hint(SYS, true); else if (!logged) S.hint(REC, true);
    });
    hooks.sys = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(SYS, 'player'); A.se(on ? 'switch_on' : 'switch_off'); q('.c5-lever').classList.toggle('on', on);
      f.ch05_leverTries = (f.ch05_leverTries || 0) + 1;
      if (!lever) {
        busy = true; lever = true; U.noteHide(); SWT.event(SYS, 'useless');
        await SW.wait(1600);
        await U.say([
          '系統スイッチを、「入」にした。',
          '何も、変わらない。表示は「停止」のまま。ランプは、点いたまま。'
        ]);
        q('.c5-talkled').classList.add('on'); v.nod = true;
        await U.say([
          kuroda('無駄だよ。それは十一年前に、私が切った。入れても切っても、もう何にもつながっていない。'),
          kuroda('切れているのに、動いている。——SWITCHは、ひとりでに、再起動したんだ。')
        ]);
        q('.c5-talkled').classList.remove('on'); v.nod = false;
        busy = false;
        if (!logged) S.hint(REC, true);
      } else U.note(on ? '系統スイッチを「入」にした。……やはり、何も変わらない。' : '「切」に戻した。系統図のランプは、消えない。');
    });
    hooks.rec = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(REC, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setRec(on);
      if (on && !logged) {
        busy = true; logged = true; U.noteHide(); SWT.event(REC, 'log_printed');
        S.focus(1010, 560, 1.3, 2400);
        await SW.wait(2200);
        await U.say([
          '入力記録計のスイッチを入れた。紙が、打ち出されてくる。',
          '「二十時十七分　LIGHT_ROOM_01　入」',
          '「二十時十七分　INTERCOM_01　入」',
          ren('……部屋の明かり。インターホン。'),
          ren('全部、俺が押したスイッチだ。')
        ]);
        q('.c5-talkled').classList.add('on'); v.nod = true;
        await U.say([
          kuroda('君が押した。——本当に、そうかね。'),
          kuroda('いちばん下の行を、見なさい。'),
          '「入力元：不明」',
          kuroda('この街の、どの端末からの入力でもない。どこから来ているのか、私にも分からない。'),
          kuroda('毎晩、二十時十七分になると、誰かがスイッチを入れる。SWITCHは、それで目を覚ます。')
        ]);
        q('.c5-talkled').classList.remove('on'); v.nod = false;
        S.focus(900, 420, 1, 2000);
        busy = false;
        if (stage < 3) S.hint(TALK, true); else if (!lever) S.hint(SYS, true);
      } else U.note(on ? '記録計を、また動かした。同じ記録が、打ち出されてくる。' : '記録計を止めた。紙が、機械の中へ戻っていく。');
    });
    await SW.wait(3000);
    if (!stage && !busy) S.hint(TALK, true);
    function ready() { return stage >= 3 && lever && logged && !busy; }
    while (!(await SW.until(ready, 30000))) {
      if (!busy && !S.locked) U.note(stage < 3 ? '通話機で、黒田に聞けることが、まだある。' : !lever ? '机の上に、赤い「系統」のスイッチがある。' : '机の上に、「入力記録計」がある。');
    }

    /* ---- 黒田の頼み：記録計を止めるか ---- */
    hooks = {}; U.noteHide();
    await SW.wait(1500);
    if (!v.rec) {
      SWT.set(REC, true, 'system'); SWT.event(REC, 'self_on'); setRec(true);
      await SW.wait(2000);
      await U.say(['止めたはずの記録計が、ひとりでに、また紙を吐き出しはじめた。']);
    }
    q('.c5-talkled').classList.add('on'); v.nod = true;
    await U.say([
      ren('美咲は——佐伯美咲は、どこにいるんですか。'),
      kuroda('……それは、私の口からは言えない。'),
      kuroda('ひとつだけ、頼みがある。その記録計を、止めてくれないか。'),
      kuroda('誰がスイッチを押しているのか。——知らないままのほうが、君は楽でいられる。')
    ]);
    v.nod = false;
    var stopped = false;
    hooks.rec = function () { stopped = true; };
    hooks.sys = function () { var on = SWT.toggle(SYS, 'player'); A.se(on ? 'switch_on' : 'switch_off'); q('.c5-lever').classList.toggle('on', on); U.note('系統スイッチを動かしても、何も変わらない。'); };
    hooks.talk = function () { A.se('beep'); U.note('通話機の向こうで、黒田は、黙って待っている。'); };
    hooks.map = function () { U.note('系統図のランプは、静かに点いている。'); };
    hooks.status = function () { U.note('「SWITCH　状態：停止」。'); };
    hooks.monitor = function () { U.note('画面の中の男は、振り返らない。'); };
    S.hint(REC, true); S.focus(1010, 520, 1.1, 2400);
    await SW.until(function () { return stopped; }, 15000);
    hooks = {}; S.hint(REC, false); U.noteHide();
    if (stopped) {
      f.ch05_recorderOff = true; SWT.set(REC, false, 'player'); SWT.event(REC, 'stopped_for_kuroda'); A.se('switch_off'); setRec(false);
      await SW.wait(1500);
      v.nod = true;
      await U.say(['記録計を、止めた。紙が、機械の中へ戻っていく。', kuroda('……ありがとう。'), kuroda('いずれ、分かることではあるがね。')]);
    } else {
      f.ch05_recorderOff = false; SWT.event(REC, 'kept_running');
      v.nod = true;
      await U.say(['記録計には、触れなかった。紙は、静かに打ち出されつづけている。', kuroda('……そうか。君は、知りたいんだな。')]);
    }
    v.nod = false; q('.c5-talkled').classList.remove('on');

    /* 街じゅうのスイッチが、切り替わりはじめる */
    await SW.wait(1200);
    A.se('alarm');
    PLACES.forEach(function (p) { lamp(p[0], 'alert'); });
    setStatus('SWITCH　状態：▒▒▒▒', '全系統　切替中', true);
    S.focus(760, 380, 1.08, 2600);
    await SW.wait(2600);
    q('.c5-talkled').classList.add('on');
    await U.say([
      '壁の系統図で、街じゅうのランプが、いっせいに赤く瞬きはじめた。',
      kuroda('——始まった。'),
      kuroda('街を、見てきなさい。自分の目で。'),
      kuroda('そのあとで、中央制御施設へ行きなさい。SWITCHの中枢は、あそこにある。')
    ]);
    A.se('cut'); v.noise = 0.7;
    await SW.wait(900);
    A.stopAll(1.2);
    await U.fade(1, 1500);
    await SW.wait(1000);
  }

  SW.chapters.ch05 = {
    no: 'CHAPTER 05', title: 'THE FACTORY',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'control') return beatCtrl();
      buildDock();
      await beatDock();
      await beatCtrl();
    },
    stop: function () { cancelAnimationFrame(raf); v = null; }
  };
})(window.SW);
