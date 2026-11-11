/* ============================================================
   SWITCH — CHAPTER 04 : THE HOSPITAL
   舞台：灯ヶ丘総合病院　東病棟3階ナースステーション → ICU 3番
   第3章の直後。時計は、どこも20時17分のまま。

   前の章から受け取る記録
     ch03_answered … ナースコールでの美咲の第一声が変わる

   次の章へ引き継ぐ記録（SW.game.flags）
     ch04_sawRecord … ナースステーションの端末で、受付記録を見た
     ch04_selfCall  … ICUのベッドのナースコールを、自分で押した
     ch04_keptPower … 「切らないで」と言われた非常電源を、切らなかったか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var LW = 'LIGHT_WARD_01', EMG = 'EMERGENCY_LIGHT_02', NC = 'NURSECALL_01', PC = 'TERMINAL_01',
      LI = 'LIGHT_ICU_03', PW = 'EMERGENCY_POWER_01', MON = 'MONITOR_BED_01', HS = 'NURSECALL_BED_03';
  var YEAR = new Date().getFullYear() - 11;

  var v, hooks, snd, raf, dk;
  function q(c) { return S.$(c); }
  function ren(t) { return { who: '蓮', text: t }; }
  function misaki(t) { return { who: '美咲', text: t, voice: true, slow: true }; }

  var DEFS = '<defs><filter id="b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
    '<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>' +
    '<filter id="b6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>';
  function g(f, inner) { return '<g filter="url(#b' + f + ')" style="mix-blend-mode:lighten">' + inner + '</g>'; }
  function flick(d, on) {
    if (d.getAnimations) d.getAnimations().forEach(function (a) { a.cancel(); });
    d.style.opacity = on ? 0 : 1;
    if (!d.animate) return;
    if (on) d.animate([{ opacity: 1 }, { opacity: .3, offset: .06 }, { opacity: .95, offset: .16 }, { opacity: .9, offset: .34 },
      { opacity: .15, offset: .42 }, { opacity: .7, offset: .55 }, { opacity: .05, offset: .72 }, { opacity: 0 }], { duration: 820 });
    else d.animate([{ opacity: 0 }, { opacity: .86, offset: .35 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
  }
  /* 電気が来ていない蛍光灯：一瞬だけ瞬いて、すぐ消える */
  function deadLight(id) {
    var d = q('.c4-dark');
    SWT.set(id, true, 'player'); A.se('switch_on'); A.se('light_tink');
    q('.c4-rocker').classList.add('on'); document.querySelectorAll('#scene .c4-tube').forEach(function (e) { e.classList.add('on'); });
    if (d.animate) d.animate([{ opacity: 1 }, { opacity: .35, offset: .08 }, { opacity: .95, offset: .2 }, { opacity: .3, offset: .34 }, { opacity: .9, offset: .5 }, { opacity: .55, offset: .6 }, { opacity: 1 }], { duration: 1100 });
    setTimeout(function () {
      if (!q('.c4-rocker')) return;
      document.querySelectorAll('#scene .c4-tube').forEach(function (e) { e.classList.remove('on'); });
      q('.c4-rocker').classList.remove('on'); A.se('switch_off');
    }, 1000);
    SWT.set(id, false, 'system'); SWT.event(id, 'no_power');
  }

  var CSS_COMMON =
    '.c4-rocker{border-radius:3px;box-shadow:0 0 0 1px #77797b,1px 2px 3px rgba(0,0,0,.3);background:linear-gradient(100deg,#dcdcd4 0%,#f1f1ea 55%,#cfcfc6 100%)}' +
    '.c4-rocker.on{background:linear-gradient(100deg,#c9c9c0 0%,#ebebe4 45%,#e6e6de 100%)}' +
    '.c4-dark{mix-blend-mode:multiply;opacity:1}' +
    '.c4-tube{top:26px;width:232px;height:11px;border-radius:5px;background:#55584f}' +
    '.c4-tube.on{background:#f6fff6;box-shadow:0 0 12px 4px rgba(235,255,238,.9),0 0 60px 20px rgba(220,255,228,.4)}' +
    '.c4-clock{left:1226px;top:150px;width:150px;height:70px;font:500 40px/70px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;color:#7dff8a;text-shadow:0 0 6px rgba(90,255,120,.9),0 0 16px rgba(70,240,110,.5)}';

  /* ================= ナースステーション ================= */
  var HTML_NS =
    '<img class="ly" src="' + SW.IMAGES.ch04_station + '" alt="" draggable="false">' +
    '<div class="abs c4-rocker" style="left:458px;top:452px;width:40px;height:62px"></div>' +
    '<canvas class="ly c4-dark" width="640" height="360"></canvas>' +
    '<div class="abs c4-tube" style="left:444px"></div><div class="abs c4-tube" style="left:1184px"></div>' +
    '<div class="abs c4-emg on"></div>' +
    '<div class="abs c4-nclamp"></div><div class="abs c4-ncbtn"></div>' +
    '<div class="abs c4-clock">20:17</div>' +
    '<div class="abs c4-pc"></div><div class="abs c4-pcled"></div>' +
    '<div class="abs c4-exit"><b></b>非常口</div>' +
    '<style>' + CSS_COMMON +
    '.c4-emg{left:181px;top:208px;width:50px;height:50px;border-radius:50%;opacity:0;background:radial-gradient(circle,#fffdf0 0%,#fff3c8 40%,rgba(255,240,190,0) 72%);box-shadow:0 0 30px 14px rgba(255,244,205,.75),0 0 120px 50px rgba(255,238,190,.3)}' +
    '.c4-emg.on{opacity:1}' +
    '.c4-nclamp{left:844px;top:351px;width:18px;height:18px;border-radius:50%;background:#ff5a48;box-shadow:0 0 8px 3px rgba(255,70,50,.9);opacity:0}' +
    '.c4-nclamp.ring{animation:c4ring .9s steps(1) infinite}.c4-nclamp.on{opacity:1}' +
    '@keyframes c4ring{0%{opacity:1}50%{opacity:0}}' +
    '.c4-ncbtn{left:1084px;top:318px;width:48px;height:48px;border-radius:50%;opacity:0}' +
    '.c4-ncbtn.on{opacity:1;background:#ffd08a;box-shadow:0 0 0 2px #c98a2e inset,0 0 12px 4px rgba(255,180,80,.7)}' +
    '.c4-pc{left:1256px;top:486px;width:288px;height:164px;opacity:0;background:#0b2a4a;color:#dbe9f6;font:11px/15.5px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif;padding:7px 9px;box-sizing:border-box;white-space:pre;overflow:hidden;box-shadow:0 0 30px 6px rgba(90,150,220,.25)}' +
    '.c4-pc.on{opacity:1}.c4-pc b{display:block;background:#dbe9f6;color:#0b2a4a;margin:-7px -9px 5px;padding:3px 9px;font-weight:700}.c4-pc u{text-decoration:none;background:#f6d98a;color:#1a1a1a}' +
    '.c4-pcled{left:1536px;top:658px;width:6px;height:4px;border-radius:2px;background:#ffb65c;box-shadow:0 0 5px 1px rgba(255,170,70,.8)}.c4-pcled.on{background:#5dff8f;box-shadow:0 0 5px 1px rgba(80,255,140,.8)}' +
    '.c4-exit{left:1694px;top:154px;width:122px;height:46px;background:#f4fff6;color:#0d8a45;font:700 20px/46px sans-serif;text-align:right;padding-right:9px;box-sizing:border-box;box-shadow:0 0 14px 4px rgba(120,255,170,.55),0 0 60px 18px rgba(80,230,140,.25)}' +
    '.c4-exit b{position:absolute;left:0;top:0;width:42px;height:46px;background:#12a152}.c4-exit b::after{content:"";position:absolute;left:14px;top:9px;width:14px;height:28px;background:#f4fff6}' +
    '</style>';
  function darkNS(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#05070a"/>' +
      g(30, '<ellipse cx="1755" cy="230" rx="190" ry="160" fill="#1c3a26"/>') +
      g(30, '<ellipse cx="1300" cy="185" rx="110" ry="66" fill="#14301c"/>') +
      (on.call ? g(30, '<ellipse cx="853" cy="360" rx="70" ry="56" fill="#3a1512"/>') : '') +
      (on.emg !== false ? g(60, '<ellipse cx="300" cy="640" rx="760" ry="540" fill="#6a6656"/><ellipse cx="206" cy="340" rx="250" ry="230" fill="#b0aa94"/>') : '') +
      (on.pc ? g(60, '<ellipse cx="1400" cy="590" rx="340" ry="270" fill="#2a3a50"/>') : '');
  }
  var PC_TEXT = '<b>救急外来　受付記録　' + YEAR + '/11/17</b>' +
    '19:31  救急搬入  ▒▒ ▒▒   74歳 女\n' +
    '<u>19:52  救急搬入  高瀬 蓮   31歳 男</u>\n' +
    '         意識レベル低下  → ICU-3\n' +
    '20:05  時間外受付 ▒▒ ▒▒▒   8歳 男\n' +
    '20:17  ——— 記録中断 ———\n\n' +
    '担当看護師：佐伯';

  function buildNS() {
    v = { scene: 'ns', pc: false, ops: 0 };
    hooks = {}; snd = {};
    S.mount(HTML_NS);
    dk = S.shade(q('.c4-dark'), darkNS);
    q('.c4-pc').innerHTML = PC_TEXT;
    SWT.define(LW, false); SWT.define(EMG, true); SWT.define(NC, false); SWT.define(PC, false);
    S.hotspot('LOOK_HALL', [1640, 120, 280, 700], '廊下', function () { U.note('廊下の奥は暗くて、何も見えない。非常口の緑だけが、浮かんでいる。'); });
    S.hotspot('LOOK_CLOCK', [1226, 150, 150, 70], '時計', function () { U.note('時計は、二十時十七分。駅を出てから、どの時計も動いていない。'); });
    S.hotspot(LW, [414, 394, 128, 162], '病棟照明のスイッチ', function () {
      v.ops++; deadLight(LW);
      U.note('照明のスイッチを入れた。蛍光灯は一瞬だけ瞬いて、すぐに消えた。電気が、来ていない。');
    });
    S.hotspot(EMG, [146, 176, 148, 114], '非常灯のスイッチ', function () {
      v.ops++;
      var on = SWT.toggle(EMG, 'player'); A.se(on ? 'switch_on' : 'switch_off'); q('.c4-emg').classList.toggle('on', on); dk.set('emg', on);
      U.note(on ? '非常灯を点けた。' : v.pc ? '非常灯を消した。端末の画面だけが、青白く光っている。' : v.ringing ? '非常灯を消した。ナースコールのランプだけが、暗闇で点滅している。' : '非常灯を消した。');
    });
    S.hotspot(NC, [700, 226, 470, 210], 'ナースコールの応答ボタン', function () { v.ops++; S.hint(NC, false); if (hooks.call) hooks.call(); });
    S.hotspot(PC, [1236, 470, 328, 252], '端末の電源', function () { v.ops++; S.hint(PC, false); if (hooks.pc) return hooks.pc(); });
    snd.amb = A.loop('roomtone', 0.6, 2.5);
  }

  /* ============================================================
     場面 1 : ナースステーション
     ============================================================ */
  async function beatNS() {
    SW.checkpoint('start');
    var f = SW.game.flags;
    await SW.wait(600);
    await U.say([
      '電車には、俺のほかに、誰も乗っていなかった。',
      '降りた先は、病院の前だった。夜間入口の自動ドアは、開いたままになっている。',
      f.ch03_answered ? '「病院に来て」。——あの声に、応えてしまった。' : '「病院で、待ってる」。——あの声が、耳から離れない。'
    ]);
    S.focus(900, 470, 1, 0);
    U.fade(0, 2600);
    await SW.wait(1200);
    await U.card('CHAPTER 04', 'THE HOSPITAL', 3400);
    await SW.wait(700);
    await U.say([
      '灯ヶ丘総合病院。東病棟、三階。',
      '明かりは非常灯だけで、廊下の奥は見えない。',
      'ナースステーションに、人の姿はない。——駅と、同じだ。'
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    var busy = false, answered = false;
    hooks.call = function () { U.note('ナースコールの親機。どのランプも、消えている。'); };
    hooks.pc = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(PC, 'player'); A.se('beep'); v.pc = on;
      q('.c4-pc').classList.toggle('on', on); q('.c4-pcled').classList.toggle('on', on); dk.set('pc', on);
      if (on && !f.ch04_sawRecord) {
        busy = true; f.ch04_sawRecord = true; SWT.event(PC, 'saw_record'); U.noteHide();
        S.focus(1400, 560, 1.35, 2400);
        await SW.wait(1400);
        await U.say([
          '端末の電源を入れた。画面には、救急外来の受付記録が開いたままになっている。',
          YEAR + '年十一月十七日。——また、この日付だ。',
          '「十九時五十二分　救急搬入　高瀬 蓮　三十一歳　男」',
          ren('……俺の、名前だ。'),
          '三十一歳。今の俺と、同じ歳だ。十一年前の記録なのに。',
          '記録は、二十時十七分で途切れている。'
        ]);
        S.focus(1100, 470, 1, 2000);
        busy = false;
      } else U.note(on ? '同じ記録が映る。何度見ても、俺の名前だ。' : '端末を消した。');
    });
    await SW.wait(2500);
    if (!v.ops) S.hint(PC, true);
    await SW.until(function () { return v.ops >= 2; }, 16000);
    await SW.until(function () { return !busy; });
    await SW.wait(1800);
    await SW.until(function () { return !busy; });

    /* ナースコールが鳴る */
    v.ringing = true; SWT.event(NC, 'ringing');
    q('.c4-nclamp').classList.add('ring'); dk.set('call', true);
    A.se('nursecall');
    hooks.call = function () { answered = true; };
    S.hint(PC, false);
    await SW.wait(1600);
    if (!busy && !S.locked) { U.note('ナースコールが鳴っている。ランプが、ひとつだけ点滅している。'); S.hint(NC, true); S.focus(900, 420, 1, 1800); }
    var n = 0;
    while (!(await SW.until(function () { return answered; }, 7000))) {
      if (!S.locked) A.se('nursecall');
      if (++n === 2 && !busy && !S.locked) U.note('呼び出し音は、鳴りやまない。');
    }
    await SW.until(function () { return !busy; });
    hooks = {}; S.hint(NC, false); U.noteHide();
    SWT.set(NC, true, 'player'); SWT.event(NC, 'answered'); A.se('beep');
    q('.c4-nclamp').classList.remove('ring'); q('.c4-nclamp').classList.add('on'); q('.c4-ncbtn').classList.add('on');
    S.focus(940, 340, 1.3, 2400);
    await SW.wait(1500);
    await U.say([
      '応答のボタンを押すと、呼び出し音が止んだ。',
      '点いているランプの下には、「ICU-3」とある。',
      f.ch04_sawRecord ? '記録にあった、俺が運ばれた部屋だ。' : '「ICU」。——重い患者が入る部屋だ。'
    ]);
    A.se('crackle');
    await SW.wait(1400);
    await U.say([
      misaki(f.ch03_answered ? '……来てくれたんだね。' : '……やっぱり、来てくれた。'),
      misaki('三番の部屋にいる。——あなたの部屋だよ。'),
      ren('俺の……？')
    ]);
    A.se('cut'); q('.c4-nclamp').classList.remove('on'); q('.c4-ncbtn').classList.remove('on'); dk.set('call', false);
    SWT.set(NC, false, 'system');
    v.scene = 'leaving';
    await SW.wait(900);
    await U.fade(1, 1500);
  }

  /* ================= ICU 3番 ================= */
  var HTML_ICU =
    '<img class="ly" src="' + SW.IMAGES.ch04_icu + '" alt="" draggable="false">' +
    '<div class="abs c4-card"><b>高瀬 蓮　様</b><i>ICU-3　　入室 ' + YEAR + '/11/17</i></div>' +
    '<div class="abs c4-rocker" style="left:153px;top:487px;width:28px;height:44px"></div>' +
    '<div class="abs c4-pw"><i></i></div>' +
    '<canvas class="ly c4-dark" width="640" height="360"></canvas>' +
    '<div class="abs c4-tube" style="left:704px"></div>' +
    '<canvas class="abs c4-mon" width="208" height="136"></canvas>' +
    '<div class="abs c4-pwled"></div><div class="abs c4-hsled"></div>' +
    '<style>' + CSS_COMMON +
    '.c4-card{left:724px;top:336px;width:252px;height:66px;text-align:center;color:#1f2a26;font-family:"Hiragino Mincho ProN","Yu Mincho",serif}' +
    '.c4-card b{display:block;font-size:27px;line-height:40px;letter-spacing:4px}.c4-card i{display:block;font:normal 12px/16px sans-serif;color:#55584f}' +
    '.c4-pw{left:1312px;top:434px;width:54px;height:80px;border-radius:4px;background:#2a1513;box-shadow:0 0 0 2px #7a1f18,inset 0 2px 5px rgba(0,0,0,.6)}' +
    '.c4-pw i{position:absolute;left:5px;right:5px;top:40px;height:35px;border-radius:3px;background:linear-gradient(#f1f1ea,#b9b9b0);transition:top .08s}' +
    '.c4-pw.on i{top:5px}' +
    '.c4-mon{left:1332px;top:564px;width:208px;height:136px;opacity:0;transition:opacity .25s}' +
    '.c4-pwled{left:1376px;top:438px;width:8px;height:8px;border-radius:50%;background:#3a1512}.c4-pwled.on{background:#6dffa6;box-shadow:0 0 6px 2px #36ff88,0 0 18px 6px rgba(54,255,136,.5)}' +
    '.c4-hsled{left:604px;top:726px;width:9px;height:9px;border-radius:50%;background:#ff5a48;box-shadow:0 0 8px 3px rgba(255,70,50,.9);opacity:0}.c4-hsled.on{animation:c4ring .9s steps(1) 4}' +
    '</style>';
  function darkICU(on) {
    return DEFS + '<rect width="1920" height="1080" fill="#05070a"/>' +
      g(60, '<ellipse cx="1690" cy="520" rx="400" ry="440" fill="#262f48"/>') +
      g(6, '<rect x="1532" y="182" width="316" height="486" fill="#9aa6c8"/>') +
      g(60, '<ellipse cx="40" cy="560" rx="260" ry="400" fill="#4a4638"/>') +
      (on.pw ? g(30, '<ellipse cx="1339" cy="450" rx="110" ry="100" fill="#14301c"/>') : '') +
      (on.mon ? g(60, '<ellipse cx="1436" cy="640" rx="380" ry="320" fill="' + (on.mon === 2 ? '#3a1a16' : '#1f3a2c') + '"/><ellipse cx="1000" cy="800" rx="420" ry="200" fill="' + (on.mon === 2 ? '#2a1512' : '#1a2e24') + '"/>') : '');
  }

  function setICULight(on, animate) {
    v.light = on; q('.c4-rocker').classList.toggle('on', on); q('.c4-tube').classList.toggle('on', on);
    if (animate) flick(q('.c4-dark'), on); else q('.c4-dark').style.opacity = on ? 0 : 1;
    if (on && animate) A.se('light_tink');
  }
  function setPower(on) {
    v.power = on; q('.c4-pw').classList.toggle('on', on); q('.c4-pwled').classList.toggle('on', on); dk.set('pw', on);
    if (on && !snd.gen) snd.gen = A.loop('genhum', 0.4, 1.2);
    if (!on && snd.gen) { snd.gen.stop(0.5); snd.gen = null; }
  }
  function setMon(on) { v.mon = on; q('.c4-mon').style.opacity = on ? 1 : 0; dk.set('mon', !on ? 0 : v.flat ? 2 : 1); }
  function setFlat(on) {
    v.flat = on; if (v.mon) dk.set('mon', on ? 2 : 1);
    if (on && !snd.flat) snd.flat = A.loop('flatline', 0.8, 0.05, 'se');
    if (!on && snd.flat) { snd.flat.stop(0.05); snd.flat = null; }
  }

  /* ---------- 心電図 ---------- */
  var wave = [], lastT = 0, phase = 0;
  function ecg(p) {   // p = 1拍の中の位置（0〜1）
    if (p < 0.10) return Math.sin(p / 0.10 * Math.PI) * 0.12;
    if (p < 0.16) return 0;
    if (p < 0.18) return -(p - 0.16) / 0.02 * 0.15;
    if (p < 0.21) return -0.15 + (p - 0.18) / 0.03 * 1.15;
    if (p < 0.24) return 1 - (p - 0.21) / 0.03 * 1.3;
    if (p < 0.27) return -0.3 + (p - 0.24) / 0.03 * 0.3;
    if (p < 0.40) return 0;
    if (p < 0.58) return Math.sin((p - 0.40) / 0.18 * Math.PI) * 0.22;
    return 0;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!v || v.scene !== 'icu' || !v.mon || !q('.c4-mon') || now - lastT < 40) return;
    var dt = Math.min(now - lastT, 120) / 1000; lastT = now;
    var c = q('.c4-mon').getContext('2d'), n = Math.max(1, Math.round(dt * 70)), i;
    for (i = 0; i < n; i++) {
      var before = phase; phase = (phase + 1 / 70 / 0.83) % 1;
      if (!v.flat && before < 0.19 && phase >= 0.19 && !SW.paused) A.se('pulse');
      wave.push(v.flat ? (Math.random() - .5) * 0.02 : ecg(phase) + (Math.random() - .5) * 0.02);
    }
    while (wave.length > 150) wave.shift();
    c.fillStyle = '#04090a'; c.fillRect(0, 0, 208, 136);
    c.strokeStyle = 'rgba(60,110,90,.25)'; c.lineWidth = 0.5; c.beginPath();
    for (i = 0; i < 208; i += 16) { c.moveTo(i, 0); c.lineTo(i, 136); } for (i = 0; i < 136; i += 16) { c.moveTo(0, i); c.lineTo(208, i); } c.stroke();
    c.strokeStyle = v.flat ? '#ff6a58' : '#6dffa6'; c.lineWidth = 1.6; c.shadowColor = c.strokeStyle; c.shadowBlur = 4; c.beginPath();
    for (i = 0; i < wave.length; i++) { var x = 4 + i, y = 62 - wave[i] * 38; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.stroke(); c.shadowBlur = 0;
    c.fillStyle = v.flat ? '#ff6a58' : '#6dffa6'; c.font = 'bold 26px ui-monospace,Menlo,Consolas,monospace'; c.textAlign = 'right';
    c.fillText(v.flat ? '---' : '' + (72 + Math.round(Math.sin(now / 2300) * 1.4)), 202, 34); c.textAlign = 'left';
    c.font = '8px sans-serif'; c.fillText('HR', 160, 12);
    c.fillStyle = 'rgba(200,230,215,.8)'; c.font = '8px sans-serif'; c.fillText('ICU-3  タカセ レン', 6, 12);
    if (v.sys) {
      c.fillStyle = 'rgba(4,9,10,.85)'; c.fillRect(0, 96, 208, 40);
      c.fillStyle = '#ffd08a'; c.font = '9px ui-monospace,Menlo,Consolas,monospace';
      c.fillText('電源：非常系', 6, 109); c.fillText('制御：SWITCH', 6, 120); c.fillText('送電元：灯ヶ丘実証プラント', 6, 131);
    }
  }

  function buildICU() {
    v = { scene: 'icu', light: false, power: false, mon: false, flat: false, sys: false };
    hooks = {}; snd = snd || {}; wave = [];
    S.mount(HTML_ICU);
    dk = S.shade(q('.c4-dark'), darkICU);
    SWT.define(LI, false); SWT.define(PW, false); SWT.define(MON, false); SWT.define(HS, false);
    S.hotspot('LOOK_BED', [520, 600, 620, 280], 'ベッド', function () { U.note('ベッドは、空だ。シーツに、誰かが寝ていた形だけが残っている。'); });
    S.hotspot('LOOK_CARD', [724, 316, 252, 86], '名札', function () { U.note('「高瀬 蓮　様」。入室の日付は、' + YEAR + '年十一月十七日。'); });
    S.hotspot(LI, [107, 440, 120, 140], '照明のスイッチ', function () { if (hooks.light) hooks.light(); });
    S.hotspot(PW, [1272, 376, 134, 164], '非常電源のスイッチ', function () { S.hint(PW, false); if (hooks.power) return hooks.power(); });
    S.hotspot(MON, [1318, 550, 236, 184], 'モニターの電源', function () { if (hooks.mon) hooks.mon(); });
    S.hotspot('CHART_03', [744, 900, 172, 130], '看護記録', function () { S.hint('CHART_03', false); if (hooks.chart) return hooks.chart(); });
    S.hotspot(HS, [566, 690, 100, 120], 'ナースコール', function () { if (hooks.handset) hooks.handset(); });
    setICULight(false, false);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    if (!snd.amb) snd.amb = A.loop('roomtone', 0.6, 2);
  }

  /* ============================================================
     場面 2 : ICU 3番
     ============================================================ */
  async function beatICU() {
    SW.checkpoint('icu');
    var f = SW.game.flags;
    snd = snd || {};
    buildICU();
    S.focus(850, 620, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2600);
    await U.say([
      '集中治療室の、三番。ベッドは、空だ。',
      'シーツには、誰かが寝ていた形だけが残っている。',
      'ベッドの上に、名札が掛かっている。',
      '「高瀬 蓮　様」',
      f.ch04_sawRecord ? ren('……記録の、とおりだ。') : ren('……俺の、名前だ。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);

    var busy = false, read = false, beat = false;
    hooks.light = function () {
      if (v.power) { var on = SWT.toggle(LI, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setICULight(on, true); U.note(on ? '明かりが、点いた。非常電源が、生きている。' : '明かりを消した。'); }
      else { deadLight(LI); U.note('照明のスイッチを入れた。一瞬だけ瞬いて、すぐに消えた。ここにも、電気が来ていない。'); }
    };
    hooks.mon = function () {
      if (!v.power) { A.se('tick'); SWT.event(MON, 'no_power'); U.note('ベッドサイドのモニター。電源ボタンを押しても、何も映らない。'); return; }
      if (busy) return;
      var on = SWT.toggle(MON, 'player'); A.se('beep'); setMon(on);
      U.note(on ? 'モニターを点けた。波形が、また流れはじめる。' : 'モニターを消した。拍動の音が、止んだ。');
    };
    hooks.handset = function () {
      SWT.set(HS, true, 'player'); A.se('beep'); f.ch04_selfCall = true; SWT.event(HS, 'self_call');
      var l = q('.c4-hsled'); l.classList.remove('on'); void l.offsetWidth; l.classList.add('on');
      setTimeout(function () { if (v && v.scene === 'icu') A.se('nursecall'); }, 700);
      SWT.set(HS, false, 'system');
      U.note('ベッドのナースコールを押した。廊下の向こうで、呼び出し音が鳴る。——さっき聞いたのと、同じ音だ。');
    };
    hooks.chart = SW.guard(async function () {
      if (busy) return;
      if (read) { U.note('看護記録。二十時十七分より先は、黒く塗りつぶされている。'); return; }
      busy = true; read = true; U.noteHide(); SWT.event('CHART_03', 'read');
      S.focus(830, 900, 1.3, 2200);
      await SW.wait(1300);
      await U.say([
        'ベッドの足元に、看護記録が挟まれている。' + (v.light ? '' : '窓の明かりで、かろうじて読める。'),
        '「二十時十七分　停電。非常用電源、起動せず」',
        '「人工呼吸器、モニター、停止」',
        '「二十時十九分　佐伯看護師、手で換気を続ける」',
        '「二十時▒▒分　佐伯 美咲　二十九歳　当院看護師　——患者として収容」',
        ren('……美咲。'),
        'その先は、黒く塗りつぶされている。',
        '美咲は、ここの看護師だった。そして同じ夜、患者になった。'
      ]);
      S.focus(1000, 620, 1, 2000);
      busy = false;
      if (!beat) S.hint(PW, true);
    });
    hooks.power = SW.guard(async function () {
      if (busy) return;
      var on = SWT.toggle(PW, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setPower(on);
      if (!on) {
        if (v.mon) { SWT.set(MON, false, 'system'); setMon(false); }
        if (v.light) { SWT.set(LI, false, 'system'); setICULight(false, true); }
        U.note('非常電源を切った。機械の明かりが、いっせいに消える。'); return;
      }
      if (beat) { U.note('非常電源を入れた。低い唸りとともに、機械に明かりが戻る。'); return; }
      /* はじめて電源が入る：モニターがひとりでに立ち上がる */
      busy = true; beat = true; U.noteHide(); SWT.event(PW, 'first_on');
      await SW.wait(1500);
      SWT.set(MON, true, 'system'); A.se('beep'); setMon(true);
      S.focus(1380, 620, 1.3, 2600);
      await SW.wait(2600);
      await U.say([
        '壁の非常電源を入れた。低い唸りとともに、機械に明かりが戻る。',
        'ベッドサイドのモニターが、ひとりでに立ち上がった。',
        '誰も寝ていないベッドのモニターに、心拍の波形が流れている。',
        '手首に、指を当てる。',
        '——同じだ。画面の波と、俺の脈が、ぴたりと重なっている。',
        ren('……俺は、ここに立っている。'),
        ren('じゃあ、あのベッドに寝ていたのは、誰なんだ。')
      ]);
      S.focus(1000, 620, 1, 2000);
      busy = false;
      if (!read) S.hint('CHART_03', true);
    });

    await SW.wait(3000);
    if (!read && !beat) S.hint(PW, true);
    if (!(await SW.until(function () { return read && beat && !busy; }, 40000))) {
      if (!busy) U.note(!beat ? '壁に、赤い「非常電源」のスイッチがある。' : !read ? 'ベッドの足元に、何か挟まれている。' : '');
      await SW.until(function () { return read && beat && !busy; });
    }
    /* 電源とモニターを、入った状態にそろえる */
    hooks = {}; U.noteHide();
    await SW.wait(1200);
    if (!v.power) { SWT.set(PW, true, 'system'); A.se('switch_on'); setPower(true); await SW.wait(900); await U.say(['切ったはずの非常電源が、ひとりでに入った。']); }
    if (!v.mon) { SWT.set(MON, true, 'system'); A.se('beep'); setMon(true); await SW.wait(700); }
    var l = q('.c4-hsled'); l.classList.remove('on'); void l.offsetWidth; l.classList.add('on');
    A.se('crackle');
    await SW.wait(1500);
    await U.say([
      'ベッドの上のナースコールから、声がした。',
      misaki('そのスイッチ、切らないでね。'),
      misaki('あの夜は、それが、入らなかったの。')
    ]);

    /* ---- 選択：非常電源を切るか、切らないか ---- */
    var cut = false;
    hooks.power = function () { cut = true; };
    hooks.mon = function () { U.note('波形から、目を離せない。'); };
    hooks.light = function () { var on = SWT.toggle(LI, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setICULight(on, true); U.note(on ? '明かりを点けた。' : '明かりを消した。モニターの緑だけが、部屋に残る。'); };
    hooks.chart = function () { U.note('「非常用電源、起動せず」。——十一年前、このスイッチは入らなかった。'); };
    hooks.handset = function () { U.note('ナースコールの向こうで、誰かが、息をひそめている。'); };
    S.hint(PW, true); S.focus(1340, 560, 1.15, 2400);
    await SW.until(function () { return cut; }, 15000);
    hooks = {}; S.hint(PW, false); U.noteHide();

    if (cut) {
      f.ch04_keptPower = false; SWT.event(PW, 'cut_by_player');
      SWT.set(PW, false, 'player'); A.se('switch_off');
      q('.c4-pw').classList.remove('on'); q('.c4-pwled').classList.remove('on');
      if (snd.gen) { snd.gen.stop(0.3); snd.gen = null; }
      if (v.light) { SWT.set(LI, false, 'system'); setICULight(false, true); }
      setFlat(true);
      await SW.wait(1800);
      await U.say(['非常電源を、切った。波形が、一本の線になる。', '——息が、できない。']);
      await U.say([misaki('だめ……！')]);
      SWT.set(PW, true, 'system'); A.se('switch_on'); setPower(true); setFlat(false);
      await SW.wait(1800);
      await U.say(['スイッチが、ひとりでに戻った。波形が、また動き出す。', '胸の奥に、空気が戻ってくる。']);
    } else {
      f.ch04_keptPower = true; SWT.event(PW, 'kept_on');
      await U.say(['スイッチには、触れなかった。波形は、同じ速さで流れつづけている。']);
      await U.say([misaki('……ありがとう。今度は、ちゃんと入った。')]);
    }

    /* モニターの隅に、「SWITCH」の文字 */
    await SW.wait(900);
    v.sys = true; A.se('tick');
    S.focus(1400, 640, 1.4, 2600);
    await SW.wait(1800);
    await U.say([
      'モニターの隅に、小さな文字が出ている。',
      '「電源：非常系　制御：SWITCH　送電元：灯ヶ丘実証プラント」',
      ren('……SWITCH？'),
      misaki('工場に行って。'),
      misaki('黒田さんが、まだ、そこにいるから。'),
      '声は、そこで途切れた。'
    ]);
    A.stopAll(1.2);
    await U.fade(1, 1500);
    await SW.wait(1000);
  }

  SW.chapters.ch04 = {
    no: 'CHAPTER 04', title: 'THE HOSPITAL',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'icu') return beatICU();
      buildNS();
      await beatNS();
      await beatICU();
    },
    stop: function () { cancelAnimationFrame(raf); v = null; }
  };
})(window.SW);
