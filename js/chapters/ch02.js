/* ============================================================
   SWITCH — CHAPTER 02 : THE APARTMENT
   舞台：マンション4階のエレベーターホール → 隣の空室（404号室）
   第1章の直後。蓮は、声のした玄関の外へ出る。

   第1章から受け取る記録
     ch01_obeyed … true なら共用灯は点いている／false なら廊下は真っ暗

   次の章へ引き継ぐ記録（SW.game.flags）
     ch02_floor11     … 存在しない「11階」から来たエレベーターを見たか
     ch02_unknownSeen … テレビの映像の中で、入口に立つ人影を見たか
     ch02_knowsName   … 写真の裏で「美咲」の名を知った（必ず true になる）
     ch02_watched     … 画面の中の自分が振り返るのを、最後まで見たか
   ============================================================ */
(function (SW) {
  'use strict';
  var A = SW.audio, U = SW.ui, S = SW.scene, SWT = SW.switches;
  var HALL = 'LIGHT_HALL_4F', ELEV = 'ELEVATOR_01', EMG = 'EMERGENCY_LIGHT_01', BELL = 'INTERCOM_404',
      DOOR = 'DOOR_404', L404 = 'LIGHT_ROOM_404', TV4 = 'TV_404', MON = 'INTERCOM_404_MONITOR',
      SCREEN = 'TV_404_SCREEN', PHOTO = 'PHOTO_404';

  var v, hooks, snd, raf;
  var imgHall = new Image(), imgRoom = new Image();
  imgHall.src = SW.IMAGES.ch02_hall; imgRoom.src = SW.IMAGES.ch02_room404;

  var BLUR = '<defs><filter id="c2b60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>' +
    '<filter id="c2b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>' +
    '<filter id="c2b6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>';
  function grp(cls, f, inner, hidden) {
    return '<g class="' + cls + '" filter="url(#c2b' + f + ')" style="mix-blend-mode:lighten' + (hidden ? ';display:none' : '') + '">' + inner + '</g>';
  }

  /* ================= ホール ================= */
  var HTML_HALL =
    '<img class="ly" src="' + SW.IMAGES.ch02_hall + '" alt="" draggable="false">' +
    '<div class="abs c2-rocker" style="left:1075px;top:509px"></div>' +
    '<div class="abs c2-eldoors"><i class="l"></i><i class="r"></i></div>' +
    '<div class="abs c2-doorshade"></div>' +
    '<div class="abs c2-flick"></div>' +
    '<svg class="ly c2-dark" viewBox="0 0 1920 1080" preserveAspectRatio="none">' + BLUR +
      '<rect width="1920" height="1080" fill="#05070b"/>' +
      grp('', 60, '<ellipse cx="240" cy="700" rx="420" ry="300" fill="#222a40"/>') +
      grp('', 30, '<path d="M0 820L420 820L700 1080L0 1080Z" fill="#3a4566"/>') +
      grp('', 6, '<rect x="0" y="92" width="404" height="470" fill="#9aa6c8"/>') +
      grp('c2-dk-exit', 30, '<ellipse cx="1805" cy="250" rx="230" ry="180" fill="#1c3a26"/>') +
      grp('', 30, '<ellipse cx="760" cy="200" rx="70" ry="44" fill="#3a2a14"/>') +
      grp('c2-dk-emg', 60, '<ellipse cx="1074" cy="640" rx="470" ry="440" fill="#8a8674"/><ellipse cx="1074" cy="420" rx="220" ry="220" fill="#c9c4ae"/>', 1) +
      grp('c2-dk-el', 30, '<ellipse cx="760" cy="540" rx="300" ry="400" fill="#4a4840"/><path d="M600 820L920 820L1120 1080L400 1080Z" fill="#8f8c7c"/>', 1) +
      grp('c2-dk-el', 6, '<rect x="622" y="252" width="276" height="568" fill="#ffffff"/>', 1) +
      grp('c2-dk-gap', 30, '<ellipse cx="1425" cy="842" rx="200" ry="52" fill="#3c4a6e"/>', 1) +
      grp('c2-dk-ajar', 60, '<ellipse cx="1330" cy="620" rx="190" ry="330" fill="#36425f"/>', 1) +
    '</svg>' +
    '<div class="abs c2-tube" style="left:484px"></div><div class="abs c2-tube b" style="left:1284px"></div>' +
    '<div class="abs c2-ind">1</div>' +
    '<div class="abs c2-call"></div>' +
    '<div class="abs c2-emg"></div>' +
    '<div class="abs c2-exit"><b></b>非常口</div>' +
    '<div class="abs c2-gap"></div>' +
    '<div class="abs c2-ajar"></div>' +
    '<style>' +
    '.c2-rocker{width:28px;height:44px;border-radius:2px;box-shadow:0 0 0 1px #77797b,1px 2px 2px rgba(0,0,0,.3);background:linear-gradient(100deg,#dcdcd4 0%,#f1f1ea 55%,#cfcfc6 100%)}' +
    '.c2-rocker.on{background:linear-gradient(100deg,#c9c9c0 0%,#ebebe4 45%,#e6e6de 100%)}' +
    '.c2-eldoors{left:622px;top:252px;width:276px;height:568px;overflow:hidden}' +
    '.c2-eldoors i{position:absolute;top:0;width:138px;height:568px;transition:transform 1.25s cubic-bezier(.4,0,.3,1);' +
      'background:linear-gradient(90deg,#8d9092 0%,#c6c9ca 22%,#a9acae 60%,#84878a 100%);box-shadow:inset 0 0 0 1px #6e7173,inset 0 -40px 60px rgba(0,0,0,.18)}' +
    '.c2-eldoors .l{left:0}.c2-eldoors .r{left:138px}' +
    '.c2-eldoors.open .l{transform:translateX(-130px)}.c2-eldoors.open .r{transform:translateX(130px)}' +
    '.c2-dark{mix-blend-mode:multiply;opacity:1}' +
    '.c2-flick{left:900px;top:0;width:1020px;height:1080px;background:radial-gradient(ellipse at 49% 8%,rgba(8,10,8,.5),rgba(8,10,8,.2) 60%,transparent 80%);opacity:0}' +
    '.c2-flick.on{animation:c2flick 3.7s steps(1) infinite}' +
    '@keyframes c2flick{0%{opacity:0}7%{opacity:.9}9%{opacity:0}31%{opacity:.7}32%{opacity:.1}34%{opacity:.8}37%{opacity:0}68%{opacity:.9}74%{opacity:0}91%{opacity:.5}93%{opacity:0}}' +
    '.c2-tube{top:67px;width:232px;height:11px;border-radius:5px;background:#55584f;transition:background .1s,box-shadow .1s}' +
    '.c2-tube.on{background:#f6fff6;box-shadow:0 0 12px 4px rgba(235,255,238,.9),0 0 60px 20px rgba(220,255,228,.4)}' +
    '.c2-tube.b.on{animation:c2tube 3.7s steps(1) infinite}' +
    '@keyframes c2tube{0%{opacity:1}7%{opacity:.25}9%{opacity:1}31%{opacity:.4}32%{opacity:.9}34%{opacity:.3}37%{opacity:1}68%{opacity:.2}74%{opacity:1}91%{opacity:.5}93%{opacity:1}}' +
    '.c2-ind{left:716px;top:170px;width:88px;height:46px;font:500 30px/46px ui-monospace,"SF Mono",Menlo,Consolas,monospace;text-align:center;' +
      'color:#ffa340;text-shadow:0 0 6px rgba(255,150,50,.9),0 0 18px rgba(255,130,30,.5)}' +
    '.c2-call{left:953px;top:555px;width:22px;height:22px;border-radius:50%;opacity:0;box-shadow:0 0 0 2.5px rgba(255,180,80,.95) inset,0 0 10px 3px rgba(255,160,50,.7)}' +
    '.c2-call.on{opacity:1}' +
    '.c2-emg{left:1050px;top:268px;width:48px;height:48px;border-radius:50%;opacity:0;background:radial-gradient(circle,#fffdf0 0%,#fff3c8 40%,rgba(255,240,190,0) 72%);' +
      'box-shadow:0 0 30px 14px rgba(255,244,205,.75),0 0 120px 50px rgba(255,238,190,.3)}' +
    '.c2-emg.on{opacity:1}' +
    '.c2-exit{left:1734px;top:154px;width:142px;height:54px;background:#f4fff6;color:#0d8a45;font:700 24px/54px sans-serif;text-align:right;padding-right:12px;box-sizing:border-box;' +
      'box-shadow:0 0 14px 4px rgba(120,255,170,.55),0 0 60px 18px rgba(80,230,140,.25);letter-spacing:1px}' +
    '.c2-exit b{position:absolute;left:0;top:0;width:50px;height:54px;background:#12a152}' +
    '.c2-exit b::after{content:"";position:absolute;left:17px;top:11px;width:17px;height:32px;background:#f4fff6}' +
    '.c2-exit.flick{animation:c2exit 1.1s steps(1) infinite}' +
    '@keyframes c2exit{0%{opacity:1}12%{opacity:.2}18%{opacity:1}55%{opacity:.35}60%{opacity:1}}' +
    '.c2-gap{left:1300px;top:815px;width:250px;height:3px;border-radius:2px;background:#c8d8ff;opacity:0;box-shadow:0 0 8px 2px rgba(170,195,255,.8),0 6px 22px 6px rgba(150,180,255,.3)}' +
    '.c2-gap.on{animation:c2gap .9s steps(1) infinite}' +
    '@keyframes c2gap{0%{opacity:.9}18%{opacity:.5}30%{opacity:.85}52%{opacity:.4}61%{opacity:.95}80%{opacity:.6}}' +
    '.c2-ajar{left:1296px;top:256px;width:46px;height:562px;opacity:0;transition:opacity 1.6s;' +
      'background:linear-gradient(90deg,#05070c 0%,#0b1020 55%,rgba(150,180,255,.55) 100%);box-shadow:8px 0 40px 4px rgba(140,170,255,.28)}' +
    '.c2-ajar.on{opacity:1}' +
    '</style>';

  function q(c) { return S.$(c); }
  function flick(d, on) {
    if (d.getAnimations) d.getAnimations().forEach(function (a) { a.cancel(); });
    d.style.opacity = on ? 0 : 1;
    if (!d.animate) return;
    if (on) d.animate([{ opacity: 1 }, { opacity: .3, offset: .06 }, { opacity: .95, offset: .16 }, { opacity: .9, offset: .34 },
      { opacity: .15, offset: .42 }, { opacity: .7, offset: .55 }, { opacity: .05, offset: .72 }, { opacity: 0 }], { duration: 820 });
    else d.animate([{ opacity: 0 }, { opacity: .86, offset: .35 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
  }

  function setHallLight(on, animate) {
    v.light = on;
    q('.c2-rocker').classList.toggle('on', on);
    if (animate) flick(q('.c2-dark'), on); else q('.c2-dark').style.opacity = on ? 0 : 1;
    q('.c2-tube').classList.toggle('on', on); q('.c2-tube.b').classList.toggle('on', on);
    q('.c2-flick').classList.toggle('on', on);
    if (on) { if (animate) A.se('light_tink'); if (!snd.hum) snd.hum = A.loop('hum', 0.7, 0.8); }
    else if (snd.hum) { snd.hum.stop(0.05); snd.hum = null; }
  }
  function setEmg(on) { q('.c2-emg').classList.toggle('on', on); show('.c2-dk-emg', on); }
  function show(sel, on) { document.querySelectorAll('#scene ' + sel).forEach(function (e) { e.style.display = on ? '' : 'none'; }); }
  function setFloor(n) { v.floor = n; q('.c2-ind').textContent = n; }
  function doors(open) { q('.c2-eldoors').classList.toggle('open', open); show('.c2-dk-el', open); A.se('elev_door'); }

  /* エレベーターを呼ぶ。2回目だけ、存在しない階から降りてくる */
  async function callElev() {
    var me = v;
    function gone() { return v !== me || v.scene !== 'hall'; }
    if (v.elBusy) { U.note('エレベーターは、いま動いている。'); return; }
    v.elBusy = true; v.calls++;
    SWT.set(ELEV, true, 'player'); q('.c2-call').classList.add('on'); A.se('beep');
    var path = [], step = 950, i;
    if (v.calls === 2) { path = [11, 10, 9, 8, 7, 6, 5, 4]; step = 520; SW.game.flags.ch02_floor11 = true; SWT.event(ELEV, 'floor_11'); }
    else if (v.floor !== 4) for (i = v.floor + 1; i <= 4; i++) path.push(i);
    if (path.length) {
      var hum = A.loop('elev', 0.4, 0.5, 'se');
      if (v.calls === 2) { setFloor(11); U.note('エレベーターが、上から降りてくる。表示は——「11」。'); await SW.wait(1700); if (gone()) return hum.stop(0.2); path.shift(); }
      for (i = 0; i < path.length; i++) { await SW.wait(step); if (gone()) return hum.stop(0.2); setFloor(path[i]); A.se('tick'); }
      hum.stop(0.7); await SW.wait(600); if (gone()) return;
    }
    A.se('ding'); await SW.wait(800); if (gone()) return;
    doors(true);
    await SW.wait(1500); if (gone()) return;
    U.note(v.calls === 1 ? '扉が開いた。中には、誰も乗っていない。' : v.calls === 2 ? 'このマンションは、七階建てだ。' : 'かごの奥の鏡に、俺だけが映っている。');
    await SW.wait(4300); if (gone()) return;
    doors(false);
    await SW.wait(1600); if (gone()) return;
    q('.c2-call').classList.remove('on'); SWT.set(ELEV, false, 'system');
    if (v.calls === 1) {   // 誰も乗せないまま、ひとりでに昇っていく
      for (i = 5; i <= 7; i++) { await SW.wait(1100); if (gone()) return; setFloor(i); }
    }
    v.elBusy = false;
  }

  function buildHall() {
    v = { scene: 'hall', light: false, floor: 1, calls: 0, elBusy: false, ops: 0 };
    hooks = {}; snd = snd || {};
    S.mount(HTML_HALL);
    S.hotspot(HALL, [1029, 464, 120, 130], '共用灯のスイッチ', function () {
      var on = SWT.toggle(HALL, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setHallLight(on, true); v.ops++;
      S.hint(HALL, false); if (hooks.light) hooks.light(on);
    });
    S.hotspot(EMG, [1024, 244, 128, 96], '非常灯の点検スイッチ', function () {
      var on = SWT.toggle(EMG, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setEmg(on); v.ops++;
      U.note(on ? '非常灯の点検スイッチ。バッテリーは、まだ生きている。' : '非常灯を消した。');
    });
    S.hotspot(ELEV, [918, 500, 92, 120], 'エレベーターの呼びボタン', function () { v.ops++; return callElev(); });
    S.hotspot(BELL, [1578, 462, 96, 112], '404号室の呼び鈴', function () { v.ops++; if (hooks.bell) hooks.bell(); });
    S.hotspot(DOOR, [1300, 262, 250, 540], '404号室のドア', function () { if (hooks.door) hooks.door(); });
    SWT.define(HALL, SW.game.flags.ch01_obeyed !== false); SWT.define(EMG, false); SWT.define(ELEV, false); SWT.define(BELL, false);
    setHallLight(SWT.isOn(HALL), false); setEmg(SWT.isOn(EMG));
    if (!snd.night) snd.night = A.loop('night', 0.55, 2.5);
  }

  function ren(t) { return { who: '蓮', text: t }; }

  /* ============================================================
     場面 1 : エレベーターホール
     ============================================================ */
  async function beatHall() {
    SW.checkpoint('start');
    var obeyed = SW.game.flags.ch01_obeyed !== false;
    await SW.wait(600);
    await U.say([
      obeyed ? '部屋の明かりは、点けたままにしてきた。' : '部屋の明かりは、消えたままだ。',
      'あの声は、たしかに玄関の外から聞こえた。',
      '確かめずには、いられなかった。'
    ]);
    A.se('door');
    S.focus(1010, 520, 1, 0);
    await SW.wait(900);
    U.fade(0, 2600);
    await SW.wait(1200);
    await U.card('CHAPTER 02', 'THE APARTMENT', 3400);
    await SW.wait(700);
    await U.say([
      '四階の、エレベーターホール。',
      v.light ? '誰もいない。蛍光灯が一本、切れかけて瞬いている。' : '明かりが、すべて消えている。エレベーターの表示だけが、暗がりに浮かんでいる。',
      ren('……誰か、いたはずなんだ。')
    ]);
    if (S.isNarrow()) U.note('画面を指でなぞると、あたりを見回せる。', 2600);

    hooks.light = function (on) { U.note(on ? '共用灯が点いた。廊下には、やはり誰もいない。' : '共用灯を消した。手すりの向こうに、街の明かりが滲んでいる。'); };
    hooks.bell = function () {
      SWT.set(BELL, true, 'player'); A.se('chime', { muffle: true }); SWT.set(BELL, false, 'system');
      U.note('隣の、四〇四号室の呼び鈴。……応答はない。空室なのだから、当たり前だ。');
    };
    hooks.door = function () { U.note('四〇四号室。表札は、白紙のままだ。'); };
    await SW.wait(2800);
    if (!v.ops) S.hint(v.light ? ELEV : HALL, true);
    await SW.until(function () { return v.ops >= 2; }, 24000);
    await SW.wait(2600);

    /* 空室から、テレビの音 */
    S.hint(ELEV, false); S.hint(HALL, false); U.noteHide();
    snd.tv = A.loop('tv_muffled', 0.5, 2.5);
    q('.c2-gap').classList.add('on'); show('.c2-dk-gap', true);
    await SW.wait(2200);
    S.focus(1450, 520, 1, 2400);
    await U.say([
      ren('……テレビの音？'),
      '隣の四〇四号室から、聞こえてくる。',
      'あの部屋は、ずっと空室のはずだ。'
    ]);
    SWT.event(BELL, 'tv_sound_heard');

    var rang = false;
    hooks.light = function (on) { U.note(on ? 'テレビの音は、まだ続いている。' : '暗い廊下に、四〇四号室のドアの下から、青白い光が漏れている。'); };
    hooks.door = function () { U.note('ドアの向こうで、誰かが笑ったような気がした。……テレビの音だ。'); };
    hooks.bell = function () { rang = true; };
    S.hint(BELL, true);
    if (!(await SW.until(function () { return rang; }, 20000))) {
      U.note('呼び鈴を、押してみるか。');
      await SW.until(function () { return rang; });
    }
    hooks = {}; S.hint(BELL, false); U.noteHide();
    SWT.set(BELL, true, 'player'); SWT.event(BELL, 'rang');
    A.se('chime', { muffle: true });
    await SW.wait(1300);
    if (snd.tv) { snd.tv.stop(0.03); snd.tv = null; }
    q('.c2-gap').style.animation = 'none'; q('.c2-gap').style.opacity = .8;
    await SW.wait(2000);
    await U.say(['呼び鈴を押した途端、テレビの音が、ぴたりと止んだ。']);
    A.se('lock');
    await SW.wait(1200);
    A.se('creak'); q('.c2-ajar').classList.add('on'); show('.c2-dk-ajar', true);
    S.focus(1400, 540, 1.12, 3200);
    await SW.wait(1800);
    await U.say([
      '鍵の開く音。',
      'ドアが、内側から、ゆっくりと開いた。',
      v.light ? '……誰も、出てこない。' : '暗い廊下に、青白い光が細く伸びる。……誰も、出てこない。',
      ren('……すみません。誰か、いますか。')
    ]);
    snd.tv = A.loop('tv_muffled', 0.3, 1.5);
    q('.c2-exit').classList.add('flick');
    await SW.wait(1600);
    await U.say(['返事のかわりに、テレビの音が、また聞こえはじめた。']);
    v.scene = 'leaving';
    await U.fade(1, 1600);
    if (snd.tv) { snd.tv.stop(0.6); snd.tv = null; }
    if (snd.hum) { snd.hum.stop(0.3); snd.hum = null; }
    if (snd.night) { snd.night.stop(0.8); snd.night = null; }
  }

  /* ================= 404号室 ================= */
  var HTML_ROOM =
    '<img class="ly" src="' + SW.IMAGES.ch02_room404 + '" alt="" draggable="false">' +
    '<div class="abs c2-rocker" style="left:463px;top:487px"></div>' +
    '<svg class="ly c2-dark" viewBox="0 0 1920 1080" preserveAspectRatio="none">' + BLUR +
      '<rect width="1920" height="1080" fill="#06080e"/>' +
      grp('', 60, '<ellipse cx="1600" cy="500" rx="430" ry="520" fill="#262f48"/>') +
      grp('', 30, '<path d="M1790 800L1390 800L840 1080L1670 1080Z" fill="#4e5b82"/>') +
      grp('', 6, '<rect x="1408" y="160" width="412" height="634" fill="#9aa6c8"/>') +
      grp('', 30, '<ellipse cx="477" cy="509" rx="34" ry="46" fill="#17361f"/>') +
      grp('c2-dk-tv', 60, '<ellipse cx="980" cy="640" rx="580" ry="390" fill="#36425c"/><ellipse cx="980" cy="940" rx="520" ry="170" fill="#44506f"/>') +
      grp('c2-dk-mon', 30, '<ellipse cx="342" cy="500" rx="125" ry="125" fill="#33423a"/>', 1) +
    '</svg>' +
    '<div class="abs c2-tvglow"></div>' +
    '<canvas class="abs c2-tv" width="180" height="101"></canvas>' +
    '<div class="abs c2-tvled"></div>' +
    '<div class="abs c2-lamp"></div>' +
    '<canvas class="abs c2-lcd" width="96" height="68"></canvas>' +
    '<style>' +
    '.c2-rocker{width:28px;height:44px;border-radius:2px;box-shadow:0 0 0 1px #a39e8f,1px 2px 2px rgba(0,0,0,.25);background:linear-gradient(100deg,#e6e3da 0%,#f5f3ec 55%,#d6d2c7 100%)}' +
    '.c2-rocker.on{background:linear-gradient(100deg,#d2cec3 0%,#efede6 45%,#ece9e1 100%)}' +
    '.c2-dark{mix-blend-mode:multiply;opacity:1}' +
    '.c2-tvglow{left:380px;top:240px;width:1200px;height:840px;mix-blend-mode:screen;opacity:0;' +
      'background:radial-gradient(ellipse at 50% 55%,rgba(150,175,235,.42) 0%,rgba(90,110,170,.12) 38%,transparent 68%)}' +
    '.c2-tv{left:800px;top:610px;width:360px;height:202px;transition:opacity .2s}' +
    '.c2-tvled{left:1136px;top:819px;width:5px;height:3px;border-radius:2px;background:#5dff8f;box-shadow:0 0 5px 1px rgba(80,255,140,.8)}' +
    '.c2-tvled.off{background:#ff3b2f;box-shadow:0 0 5px 1px rgba(255,60,40,.8)}' +
    '.c2-lamp{left:467px;top:503px;width:3.5px;height:11px;border-radius:1.5px;background:#6dffa6;box-shadow:0 0 4px 1.5px #36ff88,0 0 16px 7px rgba(54,255,136,.5)}' +
    '.c2-lamp.off{background:#39483f;box-shadow:none;mix-blend-mode:multiply;opacity:.6}' +
    '.c2-lcd{left:311px;top:457px;width:62px;height:44px;opacity:0}' +
    '</style>';

  var low = document.createElement('canvas'); low.width = 90; low.height = 50;
  var nz = document.createElement('canvas'); nz.width = 90; nz.height = 50;

  function setRoomLight(on, animate) {
    v.light = on;
    q('.c2-rocker').classList.toggle('on', on); q('.c2-lamp').classList.toggle('off', on);
    if (animate) flick(q('.c2-dark'), on); else q('.c2-dark').style.opacity = on ? 0 : 1;
    if (on) { if (animate) A.se('light_tink'); if (!snd.hum) snd.hum = A.loop('hum', 0.5, 0.8); }
    else if (snd.hum) { snd.hum.stop(0.05); snd.hum = null; }
  }
  function setTV(on) {
    v.tv = on;
    q('.c2-tv').style.opacity = on ? 1 : 0; q('.c2-tvled').classList.toggle('off', !on);
    show('.c2-dk-tv', on); if (!on) q('.c2-tvglow').style.opacity = 0;
    if (on && !snd.static) snd.static = A.loop('static', 0.001, 0.05);
    if (snd.static) snd.static.vol(on ? 0.03 : 0, 0.2);
  }
  function setMon(on) { v.mon = on; q('.c2-lcd').style.opacity = on ? 1 : 0; show('.c2-dk-mon', on); }

  /* テレビの映像：この部屋を、蓮の背後から見たもの。
     ゲーム画面と同じ絵を縮めて使い、そこに蓮の背中を描き足している。 */
  function drawFeed() {
    var c = low.getContext('2d'), k, t = v.turn;
    try { c.drawImage(imgRoom, 0, 0, 90, 50); } catch (e) { c.fillStyle = '#777'; c.fillRect(0, 0, 90, 50); }
    if (!v.light) { c.fillStyle = 'rgba(4,6,13,.88)'; c.fillRect(0, 0, 90, 50); }
    // 映像の中のテレビ（映像の中に、また映像）
    k = c.createRadialGradient(46, 33, 2, 46, 33, 30); k.addColorStop(0, 'rgba(170,195,255,' + (v.light ? .25 : .5) + ')'); k.addColorStop(1, 'rgba(120,150,230,0)');
    c.fillStyle = k; c.fillRect(0, 0, 90, 50);
    c.drawImage(q('.c2-tv'), 37.5, 28.2, 16.9, 9.4);
    // 入口に立つ人影
    if (v.unknown) { c.fillStyle = 'rgba(3,4,6,.93)'; c.beginPath(); c.ellipse(4.6, 21, 1.5, 1.9, 0, 0, 7); c.fill(); c.fillRect(2.6, 22.6, 4, 15); }
    // 蓮の背中
    var hx = 27, w = 5.6 * (1 - 0.25 * Math.sin(Math.min(t, 1) * Math.PI));
    c.fillStyle = '#08090b';
    c.beginPath(); c.moveTo(9, 50); c.quadraticCurveTo(10, 33, 21, 30.5); c.lineTo(33, 30.5); c.quadraticCurveTo(44, 33, 45, 50); c.fill();
    c.fillRect(24.3, 26, 5.4, 6);
    c.beginPath(); c.ellipse(hx, 21.5, w, 7, 0, 0, 7); c.fill();
    k = c.createLinearGradient(30, 0, 46, 0); k.addColorStop(0, 'rgba(150,175,235,0)'); k.addColorStop(1, 'rgba(150,175,235,.28)');
    c.fillStyle = k; c.beginPath(); c.moveTo(30, 50); c.lineTo(33, 30.5); c.quadraticCurveTo(44, 33, 45, 50); c.fill();
    if (t > 0.45) {   // 振り返った顔。ノイズに潰れて見えない
      var a = Math.min(1, (t - 0.45) / 0.4);
      c.fillStyle = 'rgba(150,132,120,' + (0.8 * a) + ')'; c.beginPath(); c.ellipse(hx + (1 - a) * 3, 22.4, 4.2 * a + 0.4, 5.8, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(10,10,12,' + (0.75 * a) + ')';
      for (var i = 0; i < 7; i++) c.fillRect(hx - 4 + Math.random() * 7, 18 + Math.random() * 6, 1 + Math.random() * 2.5, 1);
      var m = v.mouth ? 0.4 + Math.abs(Math.sin(performance.now() / 95)) * 1.1 : 0.35;
      c.beginPath(); c.ellipse(hx, 25.6, 1.5 * a, m, 0, 0, 7); c.fill();
    }
  }
  function drawNoise() {
    var c = nz.getContext('2d'), im = c.createImageData(90, 50), d = im.data;
    for (var i = 0; i < d.length; i += 4) { var n = Math.random() * 255; d[i] = n * .92; d[i + 1] = n; d[i + 2] = n * 1.05; d[i + 3] = 255; }
    c.putImageData(im, 0, 0);
  }
  function drawLCD() {
    var c = q('.c2-lcd').getContext('2d'), k;
    try { c.drawImage(imgHall, 560, 120, 1240, 878, 0, 0, 96, 68); } catch (e) { c.fillStyle = '#566'; c.fillRect(0, 0, 96, 68); }
    c.fillStyle = SWT.isOn(HALL) ? 'rgba(40,70,52,.45)' : 'rgba(3,6,5,.86)'; c.fillRect(0, 0, 96, 68);
    k = c.createRadialGradient(48, 34, 22, 48, 34, 60); k.addColorStop(0, 'rgba(0,0,0,0)'); k.addColorStop(1, 'rgba(0,0,0,.8)');
    c.fillStyle = k; c.fillRect(0, 0, 96, 68);
    c.globalAlpha = .22; c.drawImage(nz, 0, 0, 96, 68); c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,.16)'; for (var i = 0; i < 68; i += 2) c.fillRect(0, i, 96, 1);
    c.fillStyle = 'rgba(230,245,235,.85)'; c.font = '7px sans-serif'; c.fillText('モニター中', 4, 64);
  }

  var lastT = 0, frame = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - lastT < 60 || !v || v.scene !== 'room' || !q('.c2-tv')) return;
    lastT = now; frame++;
    drawNoise();
    if (v.tv) {
      var c = q('.c2-tv').getContext('2d');
      drawFeed(); c.globalAlpha = 1; c.drawImage(low, 0, 0, 180, 101);
      c.globalAlpha = 0.16 + v.noise; c.drawImage(nz, 0, 0, 180, 101); c.globalAlpha = 1;
      if (Math.random() < 0.07 + v.noise) { var y = Math.random() * 95 | 0, h = 2 + Math.random() * 7 | 0; c.drawImage(q('.c2-tv'), 0, y, 180, h, (Math.random() - .5) * 20, y, 180, h); }
      c.fillStyle = 'rgba(220,235,255,.06)'; c.fillRect(0, (now / 16) % 140 - 25, 180, 18);
      c.font = '6px ui-monospace,Menlo,Consolas,monospace'; c.fillStyle = 'rgba(235,240,245,.85)';
      var sec = Math.floor(now / 1000) % 60;
      c.fillText('20:17:' + (sec < 10 ? '0' : '') + sec, 144, 96); c.fillText('CAM 404', 13, 9.5);
      if (frame % 18 < 11) { c.fillStyle = '#ff4a3d'; c.beginPath(); c.arc(7, 7.5, 2, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.2)'; for (var s = 0; s < 101; s += 2) c.fillRect(0, s, 180, 1);
      q('.c2-tvglow').style.opacity = ((0.2 + Math.random() * 0.05) * (v.light ? 0.3 : 1)).toFixed(3);
    }
    if (v.mon && frame % 2 === 0) drawLCD();
  }

  /* 写真（表）。ピントの甘い、古いスナップ */
  function drawPhoto() {
    var s = document.createElement('canvas'); s.width = 80; s.height = 60;
    var c = s.getContext('2d'), k;
    k = c.createLinearGradient(0, 0, 0, 60); k.addColorStop(0, '#a9c6dd'); k.addColorStop(.55, '#dfe9ea'); k.addColorStop(.56, '#7f9a72'); k.addColorStop(1, '#5d7a56');
    c.fillStyle = k; c.fillRect(0, 0, 80, 60);
    c.fillStyle = '#4f6b4c'; c.beginPath(); c.ellipse(12, 30, 16, 12, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(70, 28, 14, 13, 0, 0, 7); c.fill();
    c.fillStyle = '#c9cfd2'; c.fillRect(30, 22, 26, 12);
    // 蓮（若いころ）
    c.fillStyle = '#2b3550'; c.beginPath(); c.moveTo(8, 60); c.quadraticCurveTo(10, 40, 20, 38); c.lineTo(32, 38); c.quadraticCurveTo(41, 40, 42, 60); c.fill();
    c.fillStyle = '#c9a892'; c.fillRect(23.5, 32, 5, 7); c.beginPath(); c.ellipse(26, 26, 6.2, 7.6, 0, 0, 7); c.fill();
    c.fillStyle = '#17181c'; c.beginPath(); c.ellipse(26, 21, 6.8, 4.4, 0, 0, 7); c.fill();
    // 美咲
    c.fillStyle = '#eeece4'; c.beginPath(); c.moveTo(40, 60); c.quadraticCurveTo(41, 43, 49, 41); c.lineTo(60, 41); c.quadraticCurveTo(69, 43, 71, 60); c.fill();
    c.fillStyle = '#16171a'; c.beginPath(); c.ellipse(54.5, 29, 8, 9, 0, 0, 7); c.fill(); c.fillRect(46.6, 29, 3.6, 12); c.fillRect(58.8, 29, 3.6, 12);
    c.fillStyle = '#d3b39e'; c.fillRect(52, 35, 5, 7); c.beginPath(); c.ellipse(54.5, 30, 5.6, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#16171a'; c.beginPath(); c.ellipse(54.5, 24.2, 6.6, 3.6, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(60,35,30,.6)';
    [[23.8, 26], [28.2, 26], [52.4, 30], [56.6, 30]].forEach(function (p) { c.fillRect(p[0] - .7, p[1], 1.4, .8); });
    c.fillRect(24.6, 29.6, 2.8, .7); c.fillRect(53, 33.4, 3, .8);
    var o = document.querySelector('#photo canvas'), x = o.getContext('2d');
    x.imageSmoothingEnabled = true; x.drawImage(s, 0, 0, 160, 120);
    k = x.createLinearGradient(0, 0, 160, 0); k.addColorStop(0, 'rgba(255,150,60,.35)'); k.addColorStop(.25, 'rgba(255,200,120,0)');
    x.fillStyle = k; x.fillRect(0, 0, 160, 120);
    x.font = 'bold 8px ui-monospace,Menlo,Consolas,monospace'; x.fillStyle = '#ff9a3a'; x.fillText("'-- 11 17", 108, 112);
  }

  function buildRoom() {
    v = { scene: 'room', light: false, tv: true, turn: 0, mouth: false, unknown: false, noise: 0, mon: false };
    hooks = {};
    S.mount(HTML_ROOM);
    S.hotspot(L404, [417, 440, 120, 140], '照明のスイッチ', function () {
      var on = SWT.toggle(L404, 'player'); A.se(on ? 'switch_on' : 'switch_off'); setRoomLight(on, true);
      S.hint(L404, false); if (hooks.light) hooks.light(on);
    });
    S.hotspot(MON, [282, 426, 120, 152], 'インターホンのモニター', function () {
      var on = SWT.toggle(MON, 'player'); A.se('beep'); setMon(on);
      U.note(on ? 'モニターに、さっきまで俺が立っていた廊下が映る。誰もいない。' : 'モニターを消した。');
    });
    S.hotspot(SCREEN, [800, 610, 360, 170], 'テレビの画面', function () { if (hooks.screen) hooks.screen(); });
    S.hotspot(TV4, [1052, 782, 132, 76], 'テレビの電源ボタン', function () { S.hint(TV4, false); if (hooks.power) hooks.power(); });
    S.hotspot(PHOTO, [1000, 462, 106, 90], '壁の写真', function () { if (hooks.photo) hooks.photo(); });
    SWT.define(L404, false); SWT.define(TV4, true); SWT.define(MON, false);
    setRoomLight(SWT.isOn(L404), false); setTV(true); drawPhoto();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    if (!snd.room) snd.room = A.loop('roomtone', 0.5, 2);
  }

  /* ============================================================
     場面 2 : 404号室
     ============================================================ */
  async function beatRoom() {
    SW.checkpoint('room');
    snd = snd || {};
    buildRoom();
    S.focus(980, 640, 1, 0);
    await SW.wait(900);
    await U.fade(0, 2600);
    await U.say([
      '部屋に入ると、音は止んだ。',
      '間取りは、俺の部屋と同じだ。左右だけが、鏡に映したように逆になっている。',
      '家具はない。床に、テレビが一台、置かれているだけだ。',
      '画面に映っているのは——この部屋だ。',
      'テレビの前に立つ、男の背中。',
      ren('……俺？')
    ]);

    var litOnce = false, offs = 0, found = false;
    hooks.light = function (on) {
      if (on) {
        if (v.unknown) { v.unknown = false; U.note('画面の中の部屋も、明るくなった。……振り返る。入口には、誰もいない。'); }
        else U.note(litOnce ? '画面の中の部屋も、同時に明るくなる。' : '明かりを点けると、画面の中の部屋も、同時に明るくなった。');
        litOnce = true;
      } else {
        offs++;
        if (offs === 1 && v.tv) { v.unknown = true; SW.game.flags.ch02_unknownSeen = true; SWT.event(TV4, 'unknown_in_doorway'); U.note('画面の中でも、明かりが消えた。……入口に、誰かが立っている。'); }
        else U.note('画面の中でも、明かりが消えた。');
      }
    };
    hooks.power = function () {
      var on = SWT.toggle(TV4, 'player'); A.se(on ? 'tv_on' : 'tv_off'); setTV(on);
      U.note(on ? '電源を入れると、また同じ映像が映った。背中は、こちらを向かない。' : '本体の電源ボタンを押した。画面は、素直に消えた。');
    };
    hooks.screen = function () {
      U.note(v.tv ? '隅に、時刻が出ている。20:17。秒だけが、進んでは戻る。' : '消えた画面に、部屋がぼんやりと映り込んでいる。');
    };
    hooks.photo = function () {
      if (v.light) return;
      U.note('壁に、何か貼られている。暗くて、よく見えない。'); S.hint(L404, true); S.focus(700, 640, 1, 1600);
    };
    if (S.isNarrow()) U.note('画面を指でなぞると、部屋を見回せる。', 2600);
    if (!(await SW.until(function () { return litOnce; }, 16000))) {
      U.note('暗くて、部屋の様子がよく分からない。'); S.hint(L404, true); S.focus(700, 640, 1, 1800);
      await SW.until(function () { return litOnce; });
    }
    await SW.wait(2600);
    if (!v.light) await SW.until(function () { return v.light; });
    await SW.wait(500);

    /* 写真 */
    hooks = {}; U.noteHide();
    var ph = document.getElementById('photo');
    S.focus(1052, 560, 1.25, 2400);
    await U.say(['壁に、写真が一枚、貼られている。']);
    ph.classList.add('on'); void ph.offsetWidth; ph.classList.add('show');
    await SW.wait(1200);
    await U.say([
      '写っているのは、俺だ。今より、ずっと若い。',
      '隣で笑っている女性は——さっき、テレビに映っていた人だ。',
      ren('……こんな写真、撮った覚えがない。'),
      '裏返すと、手書きの文字があった。'
    ]);
    ph.classList.add('flip');
    await SW.wait(1500);
    await U.say([
      '「蓮と。——美咲」',
      '日付は、十一年前の十一月。',
      ren('……美咲。'),
      '知らない名前だ。それなのに、声に出すと、喉の奥が痛んだ。'
    ]);
    SW.game.flags.ch02_knowsName = true; SWT.event(PHOTO, 'found');
    ph.classList.remove('show');
    await SW.wait(1000);
    ph.classList.remove('on', 'flip');

    /* 画面の中の自分が、振り返る */
    if (!v.tv) {
      SWT.set(TV4, true, 'system'); A.se('tv_on'); setTV(true);
      await SW.wait(1200);
      await U.say(['消したはずのテレビが、ひとりでに点いた。']);
    }
    v.unknown = false;
    snd.drone = A.loop('drone', 0.5, 5);
    S.focus(980, 690, 1.3, 6000, 'ease-in-out');
    await SW.wait(1500);
    await U.say(['画面の中の俺が、ゆっくりと、振り返りはじめる。', '俺は、動いていない。']);
    var away = false;
    hooks.power = function () { away = true; };
    hooks.screen = function () { U.note('目を、逸らせない。'); };
    hooks.light = function () { U.note('明かりを変えても、画面の中の俺は、止まらない。'); };
    S.hint(TV4, true);
    for (var i = 1; i <= 80 && !away; i++) { v.turn = i / 80; v.noise = 0.25 * v.turn; await SW.wait(100); }
    hooks = {}; S.hint(TV4, false); U.noteHide();
    if (snd.drone) { snd.drone.stop(0.04); snd.drone = null; }

    if (away) {
      SW.game.flags.ch02_watched = false; SWT.event(TV4, 'looked_away');
      SWT.set(TV4, false, 'player'); A.se('tv_off'); setTV(false);
      await SW.wait(1400);
      await U.say([
        '見てはいけない。そう思ったときには、もう電源を切っていた。',
        '暗い画面に、俺の顔が映り込んでいる。',
        '——たぶん、俺の顔だ。'
      ]);
    } else {
      SW.game.flags.ch02_watched = true; SWT.event(TV4, 'watched');
      await SW.wait(600);
      await U.say(['その顔は、ノイズに潰れていて、見えない。', '口だけが、動いている。']);
      v.mouth = true;
      await U.say([{ who: '画面の中の男', text: '……そこに、いるのは', voice: true, slow: true }]);
      A.se('cut'); SWT.set(TV4, false, 'system'); setTV(false);
      await SW.wait(1500);
      await U.say(['画面は、そこで消えた。', ren('……俺に、言ったのか？'), 'それとも——俺の、後ろに。']);
    }
    /* 明かりが落ち、廊下でエレベーターが鳴る */
    await SW.wait(700);
    if (v.light) { SWT.set(L404, false, 'system'); A.se('switch_off'); setRoomLight(false, true); }
    A.stopAll(0.2);
    await SW.wait(2200);
    A.se('ding', { far: true });
    await SW.wait(2400);
    await U.say(['廊下で、エレベーターの到着を告げる音がした。', '呼んだ覚えは、ない。']);
    await U.fade(1, 0);
    await SW.wait(900);
    A.se('boom');
  }

  SW.chapters.ch02 = {
    no: 'CHAPTER 02', title: 'THE APARTMENT',
    next: 'CHAPTER 03 — THE STATION',
    run: async function (from) {
      await U.fade(1, 0);
      snd = {};
      if (from === 'room') return beatRoom();
      buildHall();
      await beatHall();
      await beatRoom();
    },
    stop: function () { cancelAnimationFrame(raf); v = null; }
  };
})(window.SW);
