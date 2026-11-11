/* ============================================================
   SWITCH — CHAPTER 01 : FIRST SWITCH
   舞台：高瀬蓮の部屋。20時16分。

   次の章へ引き継ぐ記録（SW.game.flags）
     ch01_obeyed      … 「電気を消さないで」を守ったか（true/false）
     ch01_tvOffTries  … テレビを消そうとした回数
     ch01_darkAnswer  … 暗い部屋のままインターホンに出たか
     ch01_remoteDead  … テレビが点く前に、効かないリモコンを押したか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var LIGHT = 'LIGHT_ROOM_01', TV = 'TV_01', ICOM = 'INTERCOM_01', REMOTE = 'REMOTE_TV_01';   // リモコンは TV_01 を切り替える道具

  var v, hooks, snd, raf;   // v = この章の見た目の状態

  var HTML =
    '<img class="ly" src="' + SW.IMAGES.ch01_room + '" alt="" draggable="false">' +
    /* 照明スイッチの操作部（光らない部分） */
    '<div class="abs c1-rocker"></div>' +
    /* 暗さのレイヤー：部屋の写真に「掛け算」で重ねる。白いところほど明るく残る */
    '<svg class="ly c1-dark" viewBox="0 0 1920 1080" preserveAspectRatio="none">' +
      '<defs><filter id="c1b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
      '<filter id="c1b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>' +
      '<filter id="c1b6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
      '<rect width="1920" height="1080" fill="#06080e"/>' +
      '<g filter="url(#c1b60)" style="mix-blend-mode:lighten"><ellipse cx="320" cy="500" rx="430" ry="520" fill="#262f48"/></g>' +
      '<g filter="url(#c1b30)" style="mix-blend-mode:lighten"><path d="M130 800L530 800L1080 1080L250 1080Z" fill="#4e5b82"/></g>' +
      '<g filter="url(#c1b6)" style="mix-blend-mode:lighten"><rect x="100" y="160" width="412" height="634" fill="#9aa6c8"/></g>' +
      '<g class="c1-dk-door" filter="url(#c1b30)" style="mix-blend-mode:lighten"><ellipse cx="1830" cy="790" rx="120" ry="34" fill="#4a4336"/></g>' +
      '<g class="c1-dk-lamp" filter="url(#c1b30)" style="mix-blend-mode:lighten"><ellipse cx="1443" cy="509" rx="34" ry="46" fill="#17361f"/></g>' +
      '<g class="c1-dk-tv" filter="url(#c1b60)" style="mix-blend-mode:lighten;display:none">' +
        '<ellipse class="c1-tvA" cx="960" cy="560" rx="640" ry="400" fill="#3a4662"/><ellipse class="c1-tvB" cx="960" cy="920" rx="560" ry="170" fill="#465273"/></g>' +
      '<g class="c1-dk-icom" filter="url(#c1b30)" style="mix-blend-mode:lighten;display:none"><ellipse cx="1578" cy="500" rx="125" ry="125" fill="#33423a"/></g>' +
    '</svg>' +
    /* 光るもの */
    '<div class="abs c1-tvglow"></div>' +
    '<canvas class="abs c1-tv" width="232" height="130"></canvas>' +
    '<div class="abs c1-tvled"></div>' +
    '<div class="abs c1-clock">20:16</div>' +
    '<div class="abs c1-lamp"></div>' +
    '<canvas class="abs c1-lcd" width="96" height="68"></canvas>' +
    '<div class="abs c1-icomled"></div>' +
    '<div class="abs c1-doorgap"></div>' +
    '<div class="abs c1-remled"></div>' +
    '<style>' +
    '.c1-rocker{left:1429px;top:487px;width:28px;height:44px;border-radius:2px;box-shadow:0 0 0 1px #a39e8f,1px 2px 2px rgba(0,0,0,.25);' +
      'background:linear-gradient(100deg,#e6e3da 0%,#f5f3ec 55%,#d6d2c7 100%)}' +
    '.c1-rocker.on{background:linear-gradient(100deg,#d2cec3 0%,#efede6 45%,#ece9e1 100%)}' +
    '.c1-dark{mix-blend-mode:multiply;opacity:1}' +
    '.c1-tvglow{left:360px;top:120px;width:1200px;height:900px;mix-blend-mode:screen;opacity:0;' +
      'background:radial-gradient(ellipse at 50% 48%,var(--g,rgba(150,175,235,.5)) 0%,rgba(90,110,170,.14) 38%,transparent 68%)}' +
    '.c1-tv{left:728px;top:418px;width:464px;height:261px;opacity:0;transition:opacity .25s}' +
    '.c1-tvled{left:957px;top:681px;width:6px;height:3px;border-radius:2px;background:#ff3b2f;box-shadow:0 0 5px 1px rgba(255,60,40,.8)}' +
    '.c1-tvled.on{background:#5dff8f;box-shadow:0 0 5px 1px rgba(80,255,140,.8)}' +
    '.c1-clock{left:1220px;top:658px;width:92px;height:42px;font:500 25px/42px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;' +
      'letter-spacing:1px;color:#ffb65c;text-shadow:0 0 6px rgba(255,160,60,.9),0 0 18px rgba(255,140,40,.5)}' +
    '.c1-lamp{left:1433px;top:503px;width:3.5px;height:11px;border-radius:1.5px;background:#6dffa6;box-shadow:0 0 4px 1.5px #36ff88,0 0 16px 7px rgba(54,255,136,.5)}' +
    '.c1-lamp.off{background:#39483f;box-shadow:none;mix-blend-mode:multiply;opacity:.6}' +
    '.c1-lcd{left:1547px;top:457px;width:62px;height:44px;opacity:0}' +
    '.c1-icomled{left:1587px;top:513px;width:22px;height:22px;border-radius:50%;opacity:0;' +
      'box-shadow:0 0 0 2px rgba(120,255,160,.9) inset,0 0 9px 2px rgba(80,255,140,.75)}' +
    '.c1-icomled.ring{animation:c1ring .7s steps(2) infinite}' +
    '.c1-icomled.talk{opacity:1;box-shadow:0 0 0 2px rgba(255,190,90,.95) inset,0 0 9px 2px rgba(255,170,60,.7)}' +
    '@keyframes c1ring{0%{opacity:1}100%{opacity:0}}' +
    '.c1-remled{left:846px;top:944px;width:5px;height:5px;border-radius:50%;background:#ff5a48;box-shadow:0 0 6px 2px rgba(255,70,50,.9);opacity:0}' +
    '.c1-remled.on{animation:c1rem .32s ease-out}' +
    '@keyframes c1rem{0%{opacity:1}70%{opacity:1}100%{opacity:0}}' +
    '.c1-doorgap{left:1762px;top:768px;width:132px;height:3px;background:#ffe9c2;border-radius:2px;opacity:.85;' +
      'box-shadow:0 0 8px 2px rgba(255,225,170,.7),0 6px 22px 6px rgba(255,220,160,.28);transition:opacity .12s}' +
    '</style>';

  /* ---------- 見た目の反映 ---------- */
  function q(c) { return S.$(c); }

  function setLight(on, animate) {
    var d = q('.c1-dark'); v.light = on;
    q('.c1-rocker').classList.toggle('on', on);
    q('.c1-lamp').classList.toggle('off', on);
    if (d.getAnimations) d.getAnimations().forEach(function (a) { a.cancel(); });
    d.style.opacity = on ? 0 : 1;
    if (animate && d.animate) {
      if (on) d.animate([{ opacity: 1 }, { opacity: .25, offset: .06 }, { opacity: .95, offset: .16 }, { opacity: .9, offset: .34 },
        { opacity: .12, offset: .42 }, { opacity: .7, offset: .55 }, { opacity: .05, offset: .72 }, { opacity: 0 }], { duration: 760 });
      else d.animate([{ opacity: 0 }, { opacity: .86, offset: .35 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    }
    if (on) { A.se('light_tink'); if (!snd.hum) snd.hum = A.loop('hum', 0.5, 0.8); }
    else if (snd.hum) { snd.hum.stop(0.05); snd.hum = null; }
  }

  /* テレビ。mode: 'off' | 'static' | 'woman' */
  function setTV(mode) {
    v.tv = mode;
    var on = mode !== 'off';
    q('.c1-tv').style.opacity = on ? 1 : 0;
    q('.c1-tvled').classList.toggle('on', on);
    q('.c1-dk-tv').style.display = on ? '' : 'none';
    var woman = mode === 'woman';
    q('.c1-tvA').setAttribute('fill', woman ? '#2c3a36' : '#3a4662');
    q('.c1-tvB').setAttribute('fill', woman ? '#34443f' : '#465273');
    q('.c1-tvglow').style.setProperty('--g', woman ? 'rgba(140,190,165,.42)' : 'rgba(150,175,235,.5)');
    if (!on) q('.c1-tvglow').style.opacity = 0;
    if (on && !snd.static) snd.static = A.loop('static', 0.001, 0.05);
    if (snd.static) snd.static.vol(mode === 'static' ? 0.16 : woman ? 0.035 : 0, 0.25);
  }
  function setClock(t) { q('.c1-clock').textContent = t; }

  /* ---------- テレビの映像 ---------- */
  var low = document.createElement('canvas'); low.width = 116; low.height = 65;
  var nz = document.createElement('canvas'); nz.width = 116; nz.height = 65;

  function drawWoman() {
    var c = low.getContext('2d'), g = v.gaze * 1.6, k;
    c.fillStyle = '#0d1311'; c.fillRect(0, 0, 116, 65);
    // 廊下
    c.fillStyle = '#26322d'; c.beginPath(); c.moveTo(0, 0); c.lineTo(40, 13); c.lineTo(40, 41); c.lineTo(0, 65); c.fill();
    c.fillStyle = '#212c28'; c.beginPath(); c.moveTo(116, 0); c.lineTo(76, 13); c.lineTo(76, 41); c.lineTo(116, 65); c.fill();
    c.fillStyle = '#161d1b'; c.fillRect(40, 13, 36, 28);
    c.fillStyle = '#0b0f0e'; c.fillRect(52, 20, 12, 21);
    c.fillStyle = '#1d2623'; c.beginPath(); c.moveTo(0, 65); c.lineTo(40, 41); c.lineTo(76, 41); c.lineTo(116, 65); c.fill();
    k = c.createLinearGradient(0, 41, 0, 65); k.addColorStop(0, 'rgba(190,230,205,.26)'); k.addColorStop(1, 'rgba(190,230,205,0)');
    c.fillStyle = k; c.beginPath(); c.moveTo(50, 41); c.lineTo(66, 41); c.lineTo(78, 65); c.lineTo(38, 65); c.fill();
    c.fillStyle = '#2f3d37'; c.fillRect(0, 30, 40, 1.2); c.fillRect(76, 30, 40, 1.2);
    // 天井の蛍光灯
    k = c.createRadialGradient(58, 6, 1, 58, 6, 34); k.addColorStop(0, 'rgba(225,255,236,.85)'); k.addColorStop(.25, 'rgba(170,215,190,.3)'); k.addColorStop(1, 'rgba(120,170,145,0)');
    c.fillStyle = k; c.fillRect(0, 0, 116, 48);
    c.fillStyle = '#f2fff6'; c.beginPath(); c.moveTo(49, 2); c.lineTo(67, 2); c.lineTo(63, 9); c.lineTo(53, 9); c.fill();
    // 人物
    c.fillStyle = '#aab6ae'; c.beginPath(); c.moveTo(33, 65); c.quadraticCurveTo(35, 47, 49, 44.5); c.lineTo(67, 44.5); c.quadraticCurveTo(81, 47, 83, 65); c.fill();
    k = c.createLinearGradient(0, 44, 0, 65); k.addColorStop(0, 'rgba(10,16,14,.15)'); k.addColorStop(1, 'rgba(10,16,14,.6)');
    c.fillStyle = k; c.fillRect(30, 44, 56, 21);
    c.fillStyle = '#0f1211'; c.beginPath(); c.ellipse(58, 28, 11.2, 12.5, 0, 0, 7); c.fill();           // 髪
    c.fillRect(46.9, 28, 5, 17); c.fillRect(64.1, 28, 5, 17);
    c.fillStyle = '#8f7c70'; c.fillRect(54.5, 36, 7, 10);                                                // 首
    c.fillStyle = '#b39d8f'; c.beginPath(); c.ellipse(58 + g * .4, 30, 7.6, 9.6, 0, 0, 7); c.fill();     // 顔
    c.fillStyle = '#0f1211'; c.beginPath(); c.ellipse(58, 21.5, 9.6, 5.2, 0, 0, 7); c.fill();           // 前髪
    k = c.createLinearGradient(0, 22, 0, 40); k.addColorStop(0, 'rgba(12,16,15,.15)'); k.addColorStop(1, 'rgba(12,16,15,.62)');
    c.fillStyle = k; c.beginPath(); c.ellipse(58 + g * .4, 30, 7.6, 9.6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(14,12,12,.82)';
    c.beginPath(); c.ellipse(54.6 + g, 29.2, 1.7, 1.0, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(61.4 + g, 29.2, 1.7, 1.0, 0, 0, 7); c.fill();
    var m = v.mouth ? 0.5 + Math.abs(Math.sin(performance.now() / 90)) * 1.3 * (Math.sin(performance.now() / 370) > -0.3 ? 1 : 0.15) : 0.45;
    c.fillStyle = 'rgba(40,20,20,.8)'; c.beginPath(); c.ellipse(58 + g * .8, 35.4, 1.8, m, 0, 0, 7); c.fill();
  }
  function drawNoise() {
    var c = nz.getContext('2d'), im = c.createImageData(116, 65), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var n = Math.random() * 255; d[i] = n * .92; d[i + 1] = n; d[i + 2] = n * 1.05; d[i + 3] = 255; }
    c.putImageData(im, 0, 0);
  }

  var lastT = 0, frame = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 55 || !q('.c1-tv')) return;
    lastT = now; frame++;
    var glow = q('.c1-tvglow');
    if (v.tv !== 'off') {
      var c = q('.c1-tv').getContext('2d'), fl = 0.82 + Math.random() * 0.18;
      drawNoise();
      c.globalAlpha = 1; c.imageSmoothingEnabled = true;
      if (v.tv === 'static') { c.drawImage(nz, 0, 0, 232, 130); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 0, 232, 130); }
      else {
        drawWoman(); c.drawImage(low, 0, 0, 232, 130);
        c.globalAlpha = 1 - v.clarity * 0.86; c.drawImage(nz, 0, 0, 232, 130); c.globalAlpha = 1;
        // 画面の乱れ
        if (Math.random() < 0.10 + (1 - v.clarity) * 0.3) {
          var y = Math.random() * 120 | 0, h = 2 + Math.random() * 9 | 0;
          c.drawImage(q('.c1-tv'), 0, y, 232, h, (Math.random() - .5) * 26, y, 232, h);
        }
        c.fillStyle = 'rgba(210,255,225,.07)'; c.fillRect(0, (now / 14) % 170 - 30, 232, 22);
        // 隅の表示。秒は 59 の次に 00 へ戻り、20:18 にはならない
        c.font = '7px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(235,245,238,.82)';
        var sec = Math.floor(now / 1000) % 60;
        c.fillText('20:17:' + (sec < 10 ? '0' : '') + sec, 190, 124);
        var bl = '▒░▓█', dt = '2';
        for (var i = 0; i < 9; i++) dt += (i === 3 || i === 6) ? '/' : bl[(frame / 3 + i * 7) % 4 | 0];
        c.fillText(dt, 6, 124);
        if (frame % 20 < 12) { c.fillStyle = '#ff4a3d'; c.beginPath(); c.arc(9, 9, 2.4, 0, 7); c.fill(); }
        c.fillStyle = 'rgba(235,245,238,.82)'; c.fillText('REC', 15, 11.5);
      }
      c.fillStyle = 'rgba(0,0,0,.2)'; for (var s = 0; s < 130; s += 2) c.fillRect(0, s, 232, 1);
      glow.style.opacity = ((v.tv === 'static' ? 0.34 : 0.2) * fl * (v.light ? 0.3 : 1)).toFixed(3);
    }
    if (v.lcd !== 'off' && frame % 2 === 0) drawLCD(now);
  }

  /* ---------- インターホンのモニター ---------- */
  function setLCD(mode) {
    v.lcd = mode;
    q('.c1-lcd').style.opacity = mode === 'off' ? 0 : 1;
    q('.c1-dk-icom').style.display = mode === 'view' ? '' : 'none';
  }
  function drawLCD(now) {
    var c = q('.c1-lcd').getContext('2d'), k, i;
    if (v.lcd === 'idle') {
      c.fillStyle = '#1b2a33'; c.fillRect(0, 0, 96, 68);
      c.fillStyle = '#cfe6ee'; c.font = '9px sans-serif'; c.textAlign = 'center';
      c.fillText('録画  0件', 48, 30); c.fillText('20:1' + (v.clock18 ? '8' : v.clock17 ? '7' : '6'), 48, 46); c.textAlign = 'left';
      return;
    }
    // 玄関前の共用廊下（魚眼ぎみ・緑がかった白黒）
    c.fillStyle = '#060908'; c.fillRect(0, 0, 96, 68);
    c.fillStyle = '#56645b'; c.beginPath(); c.moveTo(0, 16); c.quadraticCurveTo(48, 6, 96, 20); c.lineTo(96, 46); c.quadraticCurveTo(48, 36, 0, 50); c.fill();
    c.fillStyle = '#0a0e0d'; c.beginPath(); c.moveTo(34, 12); c.quadraticCurveTo(66, 10, 96, 18); c.lineTo(96, 36); c.quadraticCurveTo(66, 30, 34, 31); c.fill(); // 手すりの向こうの夜
    c.fillStyle = '#c8d8cd'; for (i = 0; i < 6; i++) c.fillRect(40 + i * 9 + (i * i) % 5, 19 + (i * 7) % 9, 1.4, 1.4);
    c.strokeStyle = '#8c9c91'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(34, 31); c.quadraticCurveTo(66, 30, 96, 36); c.stroke();
    c.fillStyle = '#3d4a43'; c.beginPath(); c.moveTo(0, 50); c.quadraticCurveTo(48, 36, 96, 46); c.lineTo(96, 68); c.lineTo(0, 68); c.fill();
    k = c.createRadialGradient(18, 12, 1, 18, 12, 30); k.addColorStop(0, 'rgba(240,255,245,.95)'); k.addColorStop(.3, 'rgba(190,220,200,.4)'); k.addColorStop(1, 'rgba(150,190,165,0)');
    c.fillStyle = k; c.fillRect(0, 0, 60, 46);
    if (v.figure) { // 廊下の奥に、一瞬だけ立つ人影
      c.fillStyle = 'rgba(5,7,6,.92)'; c.beginPath(); c.ellipse(84, 37, 1.9, 2.2, 0, 0, 7); c.fill(); c.fillRect(81.6, 39, 4.8, 13);
    }
    k = c.createRadialGradient(48, 34, 22, 48, 34, 60); k.addColorStop(0, 'rgba(0,0,0,0)'); k.addColorStop(1, 'rgba(0,0,0,.8)');
    c.fillStyle = k; c.fillRect(0, 0, 96, 68);
    c.globalAlpha = 0.2; c.drawImage(nz, 0, 0, 96, 68); c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,.16)'; for (i = 0; i < 68; i += 2) c.fillRect(0, i, 96, 1);
    c.fillStyle = 'rgba(230,245,235,.85)'; c.font = '7px sans-serif'; c.fillText('通話中', 4, 64);
  }

  /* ---------- 台詞の書き方を短くする ---------- */
  function ren(t) { return { who: '蓮', text: t }; }
  function voice(t) { return { who: '？？？', text: t, voice: true, slow: true }; }

  /* ---------- スイッチを押したとき ---------- */
  function tapLight() {
    var on = SWT.toggle(LIGHT, 'player');
    A.se(on ? 'switch_on' : 'switch_off');
    setLight(on, true);
    S.hint(LIGHT, false);
    if (hooks.light) hooks.light(on);
  }
  /* テレビ本体：見るだけ。ON/OFF はリモコンで行う */
  function tapTV() { if (hooks.tv) hooks.tv(); else U.note(v.tv === 'off' ? 'テレビは消えている。' : 'リモコンは、テーブルの上だ。'); }
  function tapRemote() {
    var l = q('.c1-remled'); l.classList.remove('on'); void l.offsetWidth; l.classList.add('on');
    A.se('tick'); S.hint(REMOTE, false);
    if (hooks.remote) hooks.remote();
  }
  function tapIcom() { if (hooks.icom) hooks.icom(); }

  async function lcdPeek() {
    A.se('beep'); setLCD('idle'); drawLCD(0);
    await SW.wait(2600);
    if (v.lcd === 'idle') setLCD('off');
  }

  /* ---------- 準備 ---------- */
  function build() {
    v = { light: false, tv: 'off', clarity: 0, gaze: 0, mouth: false, lcd: 'off', figure: false, clock17: false, clock18: false };
    hooks = {}; snd = {};
    S.mount(HTML);
    S.hotspot(LIGHT, [1383, 440, 120, 140], '照明のスイッチ', tapLight);
    S.hotspot(REMOTE, [826, 896, 268, 92], 'テレビのリモコン', tapRemote);
    S.hotspot(TV, [708, 398, 504, 300], 'テレビ', tapTV);
    S.hotspot(ICOM, [1518, 426, 120, 152], 'インターホン', tapIcom);
    SWT.define(LIGHT, false); SWT.define(TV, false); SWT.define(ICOM, false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    snd.room = A.loop('roomtone', 0.5, 2.5);
  }

  /* ============================================================
     場面 1 : 暗い部屋 → 最初のスイッチ
     ============================================================ */
  async function beatStart() {
    SW.checkpoint('start');
    var again = (SW.profile.clears.ch01 || 0) > 0;
    await SW.wait(700);
    A.se('door');
    await SW.wait(1500);
    await U.say([
      '十一月。残業を終えて、部屋に帰ってきた。',
      again ? '……この暗さを、知っている気がする。' : '部屋は、朝に出たときのまま暗い。'
    ]);
    S.focus(1480, 640, 1, 0);
    await U.fade(0, 2600);

    var lit = false;
    function deadRemote() {
      SW.game.flags.ch01_remoteDead = true; SWT.event(TV, 'remote_no_response');
      U.note('リモコンの電源ボタンを押した。……テレビは、反応しない。');
    }
    hooks.tv = function () { U.note('テレビは消えている。暗くて、画面には何も映っていない。'); };
    hooks.remote = deadRemote;
    hooks.icom = SW.guard(async function () {
      U.note('留守のあいだに、来客はなかったらしい。……いつものことだ。');
      await lcdPeek();
    });
    hooks.light = function (on) { if (on) lit = true; };
    if (v.light) lit = true;   // 画面が明るくなりきる前に、もう押されていた場合

    if (!(await SW.until(function () { return lit; }, 6500))) {
      U.note('壁のスイッチが、小さく緑に光っている。'); S.hint(LIGHT, true);
      await SW.until(function () { return lit; });
    }
    SWT.event(LIGHT, 'first_switch');
    U.noteHide();
    hooks.tv = null; hooks.remote = deadRemote;
    hooks.light = function (on) { U.note(on ? 'もう一度、明かりを点けた。' : '明かりを消した。部屋は、また暗くなった。'); };
    S.focus(1180, 640, 1, 2600);
    await SW.wait(900);
    await U.card('CHAPTER 01', 'FIRST SWITCH', 3400);
    await SW.wait(900);
    await U.say([
      ren('……ただいま。'),
      v.light ? '返事はない。ここで一人で暮らして、もう何年になるだろう。' : '暗い部屋から、返事はない。ここで一人で暮らして、もう何年になるだろう。',
      'すぐには、思い出せなかった。'
    ]);
  }

  /* ============================================================
     場面 2 : 20時17分。テレビがひとりでに点く
     ============================================================ */
  async function beatTV() {
    SW.checkpoint('tv');
    hooks = {};
    hooks.remote = function () {
      SW.game.flags.ch01_remoteDead = true; SWT.event(TV, 'remote_no_response');
      U.note('リモコンの電源ボタンを押した。……テレビは、反応しない。');
    };
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2400);
    await SW.wait(2600);
    U.noteHide();
    v.clock17 = true; setClock('20:17'); A.se('tick');
    await SW.wait(900);
    hooks = {};
    SWT.set(TV, true, 'system'); SWT.event(TV, 'self_on');
    A.se('tv_on'); setTV('static');
    S.focus(960, 660, 1, 1800);
    await SW.wait(1300);
    await U.say([
      ren('……テレビ？'),
      SW.game.flags.ch01_remoteDead ? 'さっきは、リモコンを押しても点かなかったのに。' : 'リモコンは、テーブルの上に置いたままだ。触れていない。'
    ]);
    S.hint(REMOTE, true);

    var moved = false, pending = false, tries = SW.game.flags.ch01_tvOffTries || 0;
    hooks.tv = function () { U.note('ノイズが流れている。……リモコンは、テーブルの上だ。'); };
    hooks.remote = SW.guard(async function () {
      if (pending) return;
      pending = true;
      SWT.set(TV, false, 'player'); A.se('tv_off'); setTV('off');
      tries++; SW.game.flags.ch01_tvOffTries = tries;
      U.note(tries === 1 ? 'リモコンで、電源を切った。' : 'もう一度、切った。');
      await SW.wait(1900);
      SWT.set(TV, true, 'system'); A.se('tv_on'); setTV('static');
      U.note(tries === 1 ? '……また、点いた。' : '何度消しても、ひとりでに点く。');
      await SW.wait(1600);
      pending = false; moved = true;
    });
    hooks.light = function (on) {
      if (v.tv === 'off') U.note(on ? '明かりを点けた。テレビは、消えたままだ。' : '明かりを消した。部屋は、真っ暗になった。');
      else U.note(on ? '明かりを点けても、ノイズは消えない。' : 'テレビの光だけが、部屋を青白く照らしている。');
    };
    hooks.icom = SW.guard(async function () { U.note('モニターには、何も映っていない。'); await lcdPeek(); });

    await SW.until(function () { return moved; }, 9000);
    await SW.until(function () { return !pending; });
    hooks.tv = hooks.remote = null; S.hint(REMOTE, false);

    /* ノイズの奥から、女性の姿 */
    U.noteHide();
    snd.drone = A.loop('drone', 0.5, 6);
    v.clarity = 0; v.gaze = 0; setTV('woman');
    SWT.event(TV, 'woman_appeared');
    S.focus(960, 600, 1.1, 7000, 'ease-in-out');
    for (var i = 1; i <= 30; i++) { v.clarity = i / 30 * 0.8; await SW.wait(110); }
    await U.say([
      v.light ? 'ノイズの奥から、人の輪郭が浮かび上がってくる。' : '暗い部屋の中で、ノイズの奥から、人の輪郭が浮かび上がってくる。',
      '女性だ。どこかの廊下に立って、まっすぐこちらを見ている。',
      ren('……誰だ？'),
      '知らない顔だ。——そのはずなのに、なぜか目を逸らせない。'
    ]);
    v.mouth = true;
    await SW.wait(1200);
    await U.say(['彼女の唇が動く。音は、出ていない。']);
  }

  /* ============================================================
     場面 3 : インターホン → 声 → 最後の選択
     ============================================================ */
  async function beatRing() {
    SW.checkpoint('ring');
    hooks = {};
    await SW.wait(1400);
    /* BGMを断ち切って、チャイム */
    if (snd.drone) { snd.drone.stop(0.04); snd.drone = null; }
    v.mouth = false;
    A.se('chime');
    q('.c1-icomled').classList.add('ring');
    S.focus(1500, 600, 1, 1500);
    await SW.wait(2300);
    await U.say(['インターホン。', 'こんな時間に、誰かが来る予定はない。']);

    var answered = false, tvTaps = 0;
    hooks.icom = function () { answered = true; };
    hooks.tv = function () { v.gaze = 1; U.note('画面の女性が、インターホンのほうへ目を向けた。'); };
    hooks.remote = function () {
      tvTaps++; SWT.set(TV, true, 'player');
      SW.game.flags.ch01_tvOffTries = (SW.game.flags.ch01_tvOffTries || 0) + 1;
      var before = SW.game.flags.ch01_tvOffTries > tvTaps;   // この場面より前に、消せたことがあるか
      U.note(tvTaps > 1 ? '何度押しても、彼女は画面の中にいる。' : before ? 'リモコンを押しても、もう消えない。' : 'リモコンを押しても、消えない。');
    };
    hooks.light = function (on) { U.note(on ? '呼び出しのランプは、まだ点滅している。' : '暗闇の中で、呼び出しのランプだけが点滅している。'); };
    S.hint(ICOM, true);
    var n = 0;
    while (!(await SW.until(function () { return answered; }, 8500))) {
      n++; A.se('chime', { detune: -35 * n, slow: 1 + n * 0.12 });
      if (n === 1) v.gaze = 1;
      if (n === 2) U.note('チャイムは、鳴りやまない。');
    }

    /* 通話 */
    hooks = {}; U.noteHide(); S.hint(ICOM, false);
    SWT.set(ICOM, true, 'player'); SWT.event(ICOM, 'answered');
    A.se('beep');
    q('.c1-icomled').classList.remove('ring'); q('.c1-icomled').classList.add('talk');
    setLCD('view');
    S.focus(1578, 505, 1.3, 2600);
    SW.game.flags.ch01_darkAnswer = !v.light;
    if (!v.light) {
      await SW.wait(1100);
      SWT.set(LIGHT, true, 'system'); SWT.event(LIGHT, 'self_on'); A.se('switch_on'); setLight(true, true);
      await SW.wait(1000);
      await U.say(['消したはずの照明が、ひとりでに点いた。']);
    }
    await SW.wait(700);
    await U.say(['モニターに、玄関前の廊下が映る。', '誰もいない。']);
    if (snd.static) snd.static.vol(0.012, 0.6);
    A.se('crackle');
    await SW.wait(2200);
    v.mouth = true; v.gaze = 0;
    await U.say([voice('蓮……聞こえてる？')]);
    v.mouth = false;
    await U.say([
      ren('……誰だ。どうして、俺の名前を'),
      'スピーカーの声に合わせて、テレビの中の唇が動いている。'
    ]);
    v.mouth = true;
    await U.say([voice('お願い。今度は電気を消さないで。')]);
    v.mouth = false;
    await U.say([ren('……「今度は」？')]);

    /* 通話が切れる直前、廊下の奥に人影 */
    v.figure = true; await SW.wait(420);
    A.se('cut'); v.figure = false; setLCD('off');
    q('.c1-icomled').classList.remove('talk');
    SWT.set(ICOM, false, 'system');
    v.gaze = 2.2;
    S.focus(1380, 620, 1, 2400);
    await SW.wait(1500);

    /* ---- 最後の選択：照明を消すか、消さないか ---- */
    var off = false;
    hooks.light = function (on) { if (!on) off = true; };
    hooks.tv = function () { U.note('画面の女性は、壁のスイッチを見つめている。'); };
    hooks.remote = function () { U.note('リモコンは、もう何の役にも立たない。'); };
    hooks.icom = function () { A.se('beep'); U.note('通話は切れている。履歴には、何も残っていない。'); };
    S.hint(LIGHT, true);
    await SW.until(function () { return off; }, 15000);
    hooks = {}; S.hint(LIGHT, false); U.noteHide();
    S.locked = true;

    if (off) {
      /* 消した */
      SW.game.flags.ch01_obeyed = false; SWT.event(LIGHT, 'disobeyed');
      if (snd.room) snd.room.stop(0.1);
      q('.c1-doorgap').style.opacity = 0; q('.c1-dk-door').style.display = 'none';
      await SW.wait(700);
      v.clarity = 0.25; await SW.wait(500);
      A.se('tv_off'); setTV('off'); SWT.set(TV, false, 'system');
      A.stopAll(0.1);
      await SW.wait(2400);
      await U.say([voice('……また、消すんだね。')]);
      await U.fade(1, 0);
    } else {
      /* 消さなかった */
      SW.game.flags.ch01_obeyed = true; SWT.event(LIGHT, 'obeyed');
      S.focus(1080, 640, 1, 1800);
      await SW.wait(1500);
      v.clock18 = true; setClock('20:18'); A.se('tick');
      await SW.wait(1300);
      A.se('tv_off'); setTV('off'); SWT.set(TV, false, 'system');
      await SW.wait(1600);
      S.locked = false;
      await U.say([
        'テレビは、ひとりでに消えた。',
        '部屋は、何事もなかったように静かだ。',
        '言われたとおり、照明は点けたままにしてある。'
      ]);
      await SW.wait(600);
      A.stopAll(0.05);
      await U.fade(1, 0);
    }
    S.locked = false;
    await SW.wait(1400);
  }

  /* ============================================================
     章の入口。checkpoint から再開できる
     ============================================================ */
  var ORDER = ['start', 'tv', 'ring'];
  SW.chapters.ch01 = {
    no: 'CHAPTER 01', title: 'FIRST SWITCH',
    run: async function (from) {
      var i = Math.max(0, ORDER.indexOf(from));
      await U.fade(1, 0);
      build();
      if (i > 0) {
        /* 途中から：保存されたスイッチの状態を画面に戻す */
        setLight(SWT.isOn(LIGHT), false);
        v.clock17 = i > 1; setClock(i > 1 ? '20:17' : '20:16');
        if (i === 2) { v.clarity = 0.8; setTV('woman'); v.mouth = true; snd.drone = A.loop('drone', 0.5, 3); S.focus(960, 600, 1.1, 0); }
        else S.focus(1180, 640, 1, 0);
        await U.fade(0, 1800);
      }
      var beats = [beatStart, beatTV, beatRing];
      for (; i < beats.length; i++) await beats[i]();
    },
    stop: function () { cancelAnimationFrame(raf); }
  };
})(window.SW);
