/* SWITCH — 起動・タイトル・メニュー・章の進行 */
(function (SW) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var A = SW.audio, U = SW.ui;
  var title = $('title'), tsw = $('title-switch'), menuBtn = $('menu-btn'), menu = $('menu'), settings = $('settings'), endcard = $('endcard');
  var current = null;

  /* ---------- タイトル ---------- */
  function showTitle() {
    SW.epoch++; SW.paused = false;
    if (current && current.stop) current.stop(); current = null;
    A.stopAll(0.3); U.reset(); SW.scene.clear();
    menuBtn.classList.remove('on'); menu.classList.remove('on'); settings.classList.remove('on'); $('chapters').classList.remove('on');
    endcard.classList.remove('on', 'show');
    title.classList.remove('lit', 'flick'); tsw.setAttribute('aria-pressed', 'false');
    title.querySelector('[data-act="continue"]').hidden = !SW.hasSave();
    title.querySelector('[data-act="chapters"]').hidden = !SW.profile.clears.ch01;
    title.classList.add('on');
  }
  tsw.addEventListener('click', function () {
    A.init();
    var on = tsw.getAttribute('aria-pressed') !== 'true';
    tsw.setAttribute('aria-pressed', on);
    A.se(on ? 'switch_on' : 'switch_off');
    SW.profile.titleToggles++; SW.saveProfile();
    if (on) {
      A.se('light_tink');
      title.classList.add('lit', 'flick');
      setTimeout(function () { title.classList.remove('flick'); }, 70);
      setTimeout(function () { title.classList.add('flick'); }, 150);
      setTimeout(function () { title.classList.remove('flick'); }, 260);
    } else title.classList.remove('lit', 'flick');
  });
  title.querySelector('.t-menu').addEventListener('click', function (e) {
    var act = e.target.dataset.act; if (!act) return;
    A.init(); A.se('tick');
    if (act === 'settings') return openSettings();
    if (act === 'chapters') return openChapters();
    if (act === 'new') { SW.clearSave(); SW.newGame(); }
    if (act === 'continue' && !SW.loadGame()) SW.newGame();
    startChapter();
  });

  /* ---------- 章を走らせる ---------- */
  function startChapter() {
    var ch = SW.chapters[SW.game.chapter]; current = ch;
    SW.epoch++; var e = SW.epoch;
    U.fade(1, 0);
    title.classList.remove('on'); endcard.classList.remove('on', 'show');
    menuBtn.classList.add('on');
    ch.run(SW.game.checkpoint).then(function () {
      if (e === SW.epoch) finishChapter(ch);
    }).catch(function (err) { if (err !== SW.ABORT) { console.error(err); showTitle(); } });
  }

  /* 章が終わったら、区切りの画面を出さずに、そのまま次の章へつなげる。
     「どのエンドになったか」を出すのは、物語の最後だけ。 */
  function finishChapter(ch) {
    var id = SW.game.chapter;
    var nextId = SW.ORDER[SW.ORDER.indexOf(id) + 1], hasNext = !!SW.chapters[nextId];
    SW.profile.clears[id] = (SW.profile.clears[id] || 0) + 1;
    SW.profile.snap[id] = JSON.parse(JSON.stringify({ flags: SW.game.flags, switches: SW.game.switches }));
    SW.saveProfile();
    if (ch.stop) ch.stop(); SW.scene.clear();
    if (hasNext) {
      SW.game.chapter = nextId; SW.game.checkpoint = SW.game.beat = 'start'; SW.saveGame();
      return startChapter();
    }
    SW.clearSave(); menuBtn.classList.remove('on');
    if (ch.ending) showEnding(ch.ending());      // 最終章：たどり着いたエンドを表示
    else showEnding(null);                       // まだ先の章がない：「つづく」とだけ出す
  }

  /* ending = { no:'END 01', title:'NEW WORLD', lines:['…','…'] }  /  null なら制作中の案内 */
  function showEnding(ending) {
    var total = SW.switches.playerTotal();
    endcard.querySelector('.e-ch').textContent = ending ? ending.no : '';
    endcard.querySelector('.e-title').textContent = ending ? ending.title : 'TO BE CONTINUED';
    endcard.querySelector('.e-end').textContent = ending ? '' : 'この先の物語は、制作中です';
    var log = endcard.querySelector('.e-log'), btns = endcard.querySelector('.e-menu');
    log.textContent = ''; log.hidden = !ending; btns.classList.remove('on');
    endcard.classList.add('on'); void endcard.offsetWidth; endcard.classList.add('show');
    var text = ending ? (ending.lines || []).concat('> ' + total + ' SWITCH OPERATIONS RECORDED.').join('\n') : '';
    (async function () {
      await SW.wait(2600);
      for (var i = 1; i <= text.length; i++) { log.textContent = text.slice(0, i); await SW.wait(34); }
      await SW.wait(900); btns.classList.add('on');
    })().catch(function () {});
  }
  endcard.querySelector('.e-menu').addEventListener('click', function (e) {
    if (!e.target.dataset.act) return;
    A.se('tick'); showTitle();
  });

  /* ---------- チャプター選択 ---------- */
  var chapters = $('chapters');
  function openChapters() {
    var list = chapters.querySelector('.ch-list'); list.innerHTML = '';
    SW.ORDER.forEach(function (id) {
      var ch = SW.chapters[id], b = document.createElement('button'), ok = SW.unlocked(id);
      b.dataset.ch = id; b.disabled = !ok;
      b.textContent = ch.no + '　' + (ok ? ch.title : '— — —');
      list.appendChild(b);
    });
    chapters.classList.add('on');
  }
  chapters.addEventListener('click', function (e) {
    var t = e.target;
    if (t.dataset.act === 'close' || t === chapters) return chapters.classList.remove('on');
    if (t.dataset.ch && !t.disabled) { A.se('tick'); chapters.classList.remove('on'); SW.newGame(t.dataset.ch); startChapter(); }
  });

  /* ---------- メニュー ---------- */
  menuBtn.addEventListener('click', function () { SW.paused = true; menu.classList.add('on'); });
  menu.addEventListener('click', function (e) {
    var act = e.target.dataset.act;
    if (act === 'resume' || e.target === menu) { menu.classList.remove('on'); SW.paused = false; }
    if (act === 'settings') openSettings();
    if (act === 'title') { SW.saveGame(); showTitle(); }
  });

  /* ---------- 設定 ---------- */
  function openSettings() {
    var s = SW.profile.settings;
    settings.querySelectorAll('input[data-set]').forEach(function (i) { i.value = Math.round(s[i.dataset.set] * 100); });
    settings.querySelectorAll('.seg button').forEach(function (b) { b.classList.toggle('sel', +b.dataset.v === s.textSpeed); });
    settings.classList.add('on');
  }
  settings.addEventListener('input', function (e) {
    var k = e.target.dataset.set; if (!k) return;
    SW.profile.settings[k] = e.target.value / 100; SW.saveProfile(); A.applyVolumes();
  });
  settings.addEventListener('change', function (e) { if (e.target.dataset.set === 'se') A.se('switch_on'); });
  settings.addEventListener('click', function (e) {
    var t = e.target, act = t.dataset.act;
    if (t.dataset.v) { SW.profile.settings.textSpeed = +t.dataset.v; SW.saveProfile(); openSettings(); }
    if (act === 'close' || t === settings) settings.classList.remove('on');
    if (act === 'fullscreen') {
      var d = document, el = d.documentElement;
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (el.requestFullscreen || el.webkitRequestFullscreen) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
    if (act === 'erase') {
      if (t.dataset.sure) { SW.eraseAll(); location.reload(); }
      else { t.dataset.sure = '1'; t.textContent = 'もう一度押すと、すべて消えます'; setTimeout(function () { delete t.dataset.sure; t.textContent = 'セーブデータを消す'; }, 4000); }
    }
  });

  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});

  showTitle();
})(window.SW);
