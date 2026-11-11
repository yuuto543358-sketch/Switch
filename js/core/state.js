/* SWITCH — 状態管理（セーブ・スイッチ・進行） */
(function (SW) {
  'use strict';
  var SAVE_KEY = 'switch.save.v1', PROFILE_KEY = 'switch.profile.v1';

  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

  /* ---- プロフィール：周回をまたいで残るもの（設定・クリア記録・「記憶」） ---- */
  var p = read(PROFILE_KEY) || {};
  SW.profile = {
    settings: Object.assign({ master: 0.8, bgm: 0.7, se: 0.9, textSpeed: 1 }, p.settings),
    clears: p.clears || {},          // 章ごとのクリア回数
    totalInputs: p.totalInputs || 0, // これまでに押したスイッチの総数
    titleToggles: p.titleToggles || 0,
    snap: p.snap || {}               // 章をクリアした時点の記録（次の章の出発点になる）
  };
  SW.saveProfile = function () { write(PROFILE_KEY, SW.profile); };

  /* ---- ゲーム1回分のデータ ---- */
  SW.game = null;
  var entry = null;   // 最後に通った「場面の入口」の記録
  SW.ORDER = ['ch01', 'ch02', 'ch03', 'ch04'];     // 章の順番
  /* 指定した章の最初から始める。前の章をクリアした時の記録を引き継ぐ */
  SW.newGame = function (chapter) {
    chapter = chapter || SW.ORDER[0];
    var prev = SW.profile.snap[SW.ORDER[SW.ORDER.indexOf(chapter) - 1]];
    prev = prev ? JSON.parse(JSON.stringify(prev)) : { flags: {}, switches: {} };
    SW.game = { chapter: chapter, checkpoint: 'start', switches: prev.switches, flags: prev.flags, beat: 'start' };
    entry = null;
    return SW.game;
  };
  SW.unlocked = function (chapter) {
    var i = SW.ORDER.indexOf(chapter);
    return i === 0 || !!SW.profile.clears[SW.ORDER[i - 1]];
  };
  /* セーブされるのは、最後に通った「場面の入口」の時点の記録。
     場面の途中でやめても、再開したときにスイッチや記録が食い違わない。 */
  SW.saveGame = function () { if (entry) write(SAVE_KEY, entry); };
  SW.loadGame = function () {
    var g = read(SAVE_KEY);
    if (g && g.chapter && SW.chapters[g.chapter]) { SW.game = g; entry = JSON.parse(JSON.stringify(g)); return g; }
    return null;
  };
  SW.hasSave = function () { var g = read(SAVE_KEY); return !!(g && g.chapter && SW.chapters[g.chapter]); };
  SW.clearSave = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} };
  SW.eraseAll = function () {
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PROFILE_KEY); } catch (e) {}
  };
  SW.checkpoint = function (name) {
    SW.game.checkpoint = name; SW.game.beat = name;
    entry = JSON.parse(JSON.stringify(SW.game)); SW.saveGame();
  };

  SW.chapters = {};

  /* ---- スイッチ管理 ----
     すべてのスイッチは固有ID（LIGHT_ROOM_01 など）で管理し、
     ON/OFF・操作回数・操作履歴・起きたイベントを記録する。 */
  SW.switches = {
    rec: function (id) {
      var s = SW.game.switches;
      if (!s[id]) s[id] = { on: false, count: 0, history: [], events: [] };
      return s[id];
    },
    define: function (id, on) { var r = this.rec(id); if (!r.history.length && !r.count) r.on = !!on; return r; },
    isOn: function (id) { return this.rec(id).on; },
    count: function (id) { return this.rec(id).count; },
    /* by: 'player'（プレイヤーが押した） / 'system'（ひとりでに切り替わった） */
    set: function (id, on, by) {
      var r = this.rec(id);
      r.on = !!on;
      if (by === 'player') { r.count++; SW.profile.totalInputs++; SW.saveProfile(); }
      r.history.push({ on: r.on, by: by || 'system', beat: SW.game.beat });
      if (r.history.length > 60) r.history.shift();
      return r.on;
    },
    toggle: function (id, by) { return this.set(id, !this.rec(id).on, by); },
    event: function (id, name) { var r = this.rec(id); if (r.events.indexOf(name) < 0) r.events.push(name); },
    playerTotal: function () {
      var n = 0, s = SW.game.switches; for (var k in s) n += s[k].count; return n;
    }
  };

  /* ---- 時間：メニュー中・画面を閉じている間は止まる。タイトルへ戻ると中断される ---- */
  SW.epoch = 0;
  SW.paused = false;
  SW.ABORT = { abort: true };
  SW.wait = function (ms) {
    var e = SW.epoch, left = ms, last = performance.now();
    return new Promise(function (res, rej) {
      (function tick() {
        if (e !== SW.epoch) return rej(SW.ABORT);
        var now = performance.now();
        if (!SW.paused && !document.hidden) left -= Math.min(now - last, 250);
        last = now;
        if (left <= 0) return res();
        setTimeout(tick, Math.min(Math.max(left, 16), 60));
      })();
    });
  };
  /* 条件が満たされるまで待つ。timeout を過ぎたら false を返す */
  SW.until = function (cond, timeout) {
    var t = 0;
    return (async function () {
      while (!cond()) {
        if (timeout != null && t >= timeout) return false;
        await SW.wait(80); t += 80;
      }
      return true;
    })();
  };
  /* 途中でタイトルへ戻ったときの中断を、エラーにしないための包み */
  SW.guard = function (fn) {
    return function () {
      var r;
      try { r = fn.apply(this, arguments); } catch (e) { if (e !== SW.ABORT) throw e; return; }
      if (r && r.catch) r.catch(function (e) { if (e !== SW.ABORT) console.error(e); });
    };
  };
})(window.SW = window.SW || {});
