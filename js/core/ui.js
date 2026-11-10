/* SWITCH — 文字・暗転・章タイトル・メニュー */
(function (SW) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var dlg = $('dialogue'), dName = dlg.querySelector('.d-name'), dText = dlg.querySelector('.d-text');
  var catchEl = $('tapcatch'), noteEl = $('note'), cardEl = $('card'), fadeEl = $('fade');
  var U = SW.ui = {};
  var tapped = false, noteTimer = 0;

  function onTap(e) { if (e) e.preventDefault(); if (!SW.paused) tapped = true; }
  catchEl.addEventListener('pointerdown', onTap);
  window.addEventListener('keydown', function (e) {
    if ((e.key === ' ' || e.key === 'Enter') && catchEl.classList.contains('on') && !e.repeat) onTap(e);
  });

  /* 会話・地の文を順に表示する。タップで次へ。
     line = 文字列（地の文） または { who:'名前', text:'…', voice:true } */
  U.say = async function (lines) {
    U.noteHide();
    SW.scene.locked = true; catchEl.classList.add('on'); dlg.classList.add('on');
    try {
      for (var i = 0; i < lines.length; i++) {
        var ln = typeof lines[i] === 'string' ? { text: lines[i] } : lines[i];
        dName.textContent = ln.who || '';
        dText.classList.toggle('voice', !!ln.voice);
        dText.textContent = ''; dlg.classList.remove('wait'); tapped = false;
        var txt = ln.text, cps = 26 * SW.profile.settings.textSpeed * (ln.slow ? 0.5 : 1);
        for (var n = 1; n <= txt.length; n++) {
          if (tapped) { n = txt.length; }
          dText.textContent = txt.slice(0, n);
          if (n === txt.length) break;
          var ch = txt[n - 1];
          if (ln.voice && n % 2 === 1 && !/[…。、？！\s]/.test(ch)) SW.audio.se('voice');
          await SW.wait(/[。？！]/.test(ch) ? 9000 / cps : /[、…—]/.test(ch) ? 4200 / cps : 1000 / cps);
        }
        tapped = false; dlg.classList.add('wait');
        await SW.wait(180); tapped = false;
        await SW.until(function () { return tapped; });
      }
    } finally {
      dlg.classList.remove('on', 'wait'); catchEl.classList.remove('on'); SW.scene.locked = false; tapped = false;
    }
    await SW.wait(260);
  };

  /* 操作を止めない、短いひとこと（数秒で消える） */
  U.note = function (text, ms) {
    clearTimeout(noteTimer);
    noteEl.textContent = text; noteEl.classList.add('on');
    noteTimer = setTimeout(U.noteHide, ms || Math.max(2600, text.length * 190));
  };
  U.noteHide = function () { clearTimeout(noteTimer); noteEl.classList.remove('on'); };

  /* 暗転。to: 1=真っ暗 0=明るい */
  U.fade = async function (to, ms) {
    fadeEl.style.transition = ms ? 'opacity ' + ms + 'ms ease' : 'none';
    void fadeEl.offsetWidth; fadeEl.style.opacity = to;
    if (ms) await SW.wait(ms);
  };

  /* 章タイトル */
  U.card = async function (small, big, ms) {
    cardEl.innerHTML = '<p class="c-small"></p><p class="c-big"></p><div class="c-line"></div>';
    cardEl.children[0].textContent = small; cardEl.children[1].textContent = big;
    cardEl.classList.add('on');
    await SW.wait(ms || 3400);
    cardEl.classList.remove('on');
  };

  U.reset = function () {
    U.noteHide(); cardEl.classList.remove('on'); dlg.classList.remove('on', 'wait'); catchEl.classList.remove('on');
    SW.scene.locked = false;
  };
})(window.SW);
