/* SWITCH — 音（効果音・環境音・BGM）
   音声ファイルがなくても鳴るように、すべてその場で合成している。
   js/assets.js の SW.AUDIO_FILES にファイルを書けば、そちらが優先される。 */
(function (SW) {
  'use strict';
  var A = SW.audio = {};
  var ctx = null, master, bgmBus, seBus, white, brown, crackle;
  var files = {}, loops = [];

  function mkNoise(sec, kind) {
    var n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0, amp = 1;
    for (var i = 0; i < n; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (kind === 'crackle') {
        if (i % 600 === 0) amp = 0.45 + Math.random() * 0.55 * (Math.random() < 0.12 ? 2.2 : 1);
        d[i] = w * amp * 0.6;
      } else d[i] = w;
    }
    return b;
  }

  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    ctx = new C();
    master = ctx.createGain();
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    bgmBus = ctx.createGain(); seBus = ctx.createGain();
    bgmBus.connect(master); seBus.connect(master);
    white = mkNoise(2, 'white'); brown = mkNoise(4, 'brown'); crackle = mkNoise(3, 'crackle');
    A.applyVolumes();
    for (var k in SW.AUDIO_FILES) loadFile(k);
  };
  A.applyVolumes = function () {
    if (!ctx) return;
    var s = SW.profile.settings, t = ctx.currentTime;
    master.gain.setTargetAtTime(s.master, t, 0.03);
    bgmBus.gain.setTargetAtTime(s.bgm, t, 0.03);
    seBus.gain.setTargetAtTime(s.se, t, 0.03);
  };
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  function loadFile(name) {
    fetch(SW.AUDIO_FILES[name]).then(function (r) { return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (ok, ng) { ctx.decodeAudioData(ab, ok, ng); }); })
      .then(function (buf) { files[name] = buf; }).catch(function () {});
  }

  /* ---- 部品 ---- */
  function gain(v, to) { var g = ctx.createGain(); g.gain.value = v; g.connect(to); return g; }
  function filt(type, f, q, to) { var n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q; n.connect(to); return n; }
  function osc(type, f, to, t0, t1) { var o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(to); o.start(t0); if (t1) o.stop(t1); return o; }
  function src(buf, to, t0, dur, loop) {
    var s = ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; s.connect(to);
    s.start(t0, Math.random() * (buf.duration - (dur || 0) - 0.01)); if (dur) s.stop(t0 + dur); return s;
  }
  function hit(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  function clickAt(t, out, pitch, vol) {
    var g = gain(0, out); hit(g, t, vol, 0.001, 0.018);
    src(white, filt('highpass', 1800 * pitch, 0.7, g), t, 0.03);
    var g2 = gain(0, out); hit(g2, t, vol * 0.9, 0.002, 0.05);
    var o = osc('sine', 190 * pitch, g2, t, t + 0.08); o.frequency.exponentialRampToValueAtTime(80 * pitch, t + 0.06);
  }
  function bell(t, out, f, vol, decay) {
    var g = gain(0, out); hit(g, t, vol, 0.004, decay);
    osc('sine', f, g, t, t + decay + 0.1);
    var g2 = gain(0, out); hit(g2, t, vol * 0.28, 0.004, decay * 0.5);
    osc('sine', f * 2.01, g2, t, t + decay + 0.1);
    var g3 = gain(0, out); hit(g3, t, vol * 0.12, 0.002, decay * 0.25);
    osc('sine', f * 3.02, g3, t, t + decay + 0.1);
  }

  /* ---- 効果音 ---- */
  var SE = {
    switch_on: function (t, out) { clickAt(t, out, 1.1, 0.5); clickAt(t + 0.028, out, 1.5, 0.16); },
    switch_off: function (t, out) { clickAt(t, out, 0.85, 0.42); clickAt(t + 0.03, out, 1.2, 0.12); },
    light_tink: function (t, out) {
      [0, 0.09, 0.2].forEach(function (d, i) {
        var g = gain(0, out); hit(g, t + d, 0.05, 0.001, 0.05);
        osc('sine', 3400 + i * 700, g, t + d, t + d + 0.08);
      });
    },
    tv_on: function (t, out) {
      clickAt(t, out, 0.7, 0.3);
      var g = gain(0, out); hit(g, t + 0.05, 0.12, 0.25, 0.5);
      src(white, filt('bandpass', 5200, 1.2, g), t + 0.05, 0.9);
    },
    tv_off: function (t, out) {
      clickAt(t, out, 0.6, 0.25);
      var g = gain(0, out); hit(g, t, 0.06, 0.005, 0.25);
      var o = osc('sine', 900, g, t, t + 0.3); o.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    },
    chime: function (t, out, o) {
      var k = (o && o.detune) ? Math.pow(2, o.detune / 1200) : 1, slow = (o && o.slow) || 1;
      var sp = (o && o.muffle) ? filt('lowpass', 420, 0.7, gain(1.6, out)) : filt('bandpass', 1400, 0.35, out);
      bell(t, sp, 659.25 * k, 0.5, 0.9 * slow);
      bell(t + 0.62 * slow, sp, 523.25 * k, 0.5, 1.7 * slow);
    },
    beep: function (t, out) { var g = gain(0, out); hit(g, t, 0.14, 0.004, 0.09); osc('square', 1760, filt('lowpass', 3000, 0.5, g), t, t + 0.12); },
    cut: function (t, out) {
      clickAt(t, out, 2.2, 0.35);
      var g = gain(0, out); hit(g, t, 0.2, 0.002, 0.12);
      src(crackle, filt('bandpass', 2200, 0.8, g), t, 0.15);
    },
    crackle: function (t, out) {
      var g = gain(0, out); hit(g, t, 0.07, 0.3, 1.4);
      src(crackle, filt('bandpass', 1900, 0.9, g), t, 1.8);
    },
    door: function (t, out) {
      var g = gain(0, out); hit(g, t, 0.9, 0.004, 0.32);
      var o = osc('sine', 82, g, t, t + 0.4); o.frequency.exponentialRampToValueAtTime(38, t + 0.3);
      var g2 = gain(0, out); hit(g2, t, 0.3, 0.003, 0.16);
      src(brown, filt('lowpass', 500, 0.5, g2), t, 0.25);
      clickAt(t + 0.42, out, 1.3, 0.2); clickAt(t + 0.5, out, 0.9, 0.3);
    },
    /* エレベーターの到着音。far:true で遠くから聞こえる */
    ding: function (t, out, o) {
      var far = o && o.far, sp = far ? filt('lowpass', 900, 0.5, gain(0.45, out)) : out;
      bell(t, sp, 987.8, 0.4, 2.2); bell(t + 0.5, sp, 784, 0.36, 2.6);
    },
    elev_door: function (t, out) {
      var g = gain(0, out); hit(g, t, 0.16, 0.25, 0.95);
      var f = filt('bandpass', 500, 1.2, g); f.frequency.linearRampToValueAtTime(900, t + 1.1);
      src(brown, f, t, 1.3);
      clickAt(t + 1.15, out, 0.6, 0.22);
    },
    lock: function (t, out) { clickAt(t, out, 0.75, 0.5); clickAt(t + 0.11, out, 0.5, 0.6); },
    creak: function (t, out) {
      var g = gain(0, out); hit(g, t, 0.07, 0.5, 1.5);
      var f = filt('bandpass', 1150, 14, g);
      var o = osc('sawtooth', 96, f, t, t + 2.1); o.frequency.linearRampToValueAtTime(128, t + 0.9); o.frequency.linearRampToValueAtTime(84, t + 2);
      f.frequency.linearRampToValueAtTime(1500, t + 1); f.frequency.linearRampToValueAtTime(980, t + 2);
    },
    tick: function (t, out) { clickAt(t, out, 2.6, 0.1); },
    boom: function (t, out) {
      var g = gain(0, out); hit(g, t, 0.9, 0.01, 2.6);
      var o = osc('sine', 58, g, t, t + 2.8); o.frequency.exponentialRampToValueAtTime(27, t + 2.2);
      var g2 = gain(0, out); hit(g2, t, 0.35, 0.01, 1.4);
      src(brown, filt('lowpass', 160, 0.5, g2), t, 1.6);
    },
    /* インターホン越しの声。文字に合わせて鳴る、息のような短い音 */
    voice: function (t, out) {
      var sp = filt('bandpass', 1500, 0.9, out);
      var g = gain(0, sp); hit(g, t, 0.13, 0.012, 0.07);
      src(white, filt('bandpass', 900 + Math.random() * 900, 2.5, g), t, 0.1);
      var g2 = gain(0, sp); hit(g2, t, 0.05, 0.012, 0.08);
      osc('triangle', 215 + Math.random() * 45, g2, t, t + 0.12);
    }
  };

  A.se = function (name, opts) {
    if (!ctx) return;
    var t = ctx.currentTime + 0.01;
    if (files[name]) { var s = ctx.createBufferSource(); s.buffer = files[name]; s.connect(seBus); s.start(t); return; }
    if (SE[name]) SE[name](t, seBus, opts);
  };

  /* ---- ループ音（環境音・BGM） ---- */
  var LOOPS = {
    roomtone: function (out, t) {
      var n = [src(brown, filt('lowpass', 320, 0.3, gain(0.5, out)), t, 0, true)];
      n.push(osc('sine', 50, gain(0.035, out), t)); n.push(osc('sine', 100, gain(0.012, out), t));
      return n;
    },
    hum: function (out, t) {
      var f = filt('lowpass', 420, 0.5, gain(0.05, out));
      return [osc('sawtooth', 100, f, t), osc('sine', 200, gain(0.006, out), t)];
    },
    static: function (out, t) {
      return [src(crackle, filt('bandpass', 3200, 0.45, gain(0.5, out)), t, 0, true),
              src(white, filt('highpass', 6000, 0.5, gain(0.12, out)), t, 0, true)];
    },
    /* 夜の外気：遠い車の音と風 */
    night: function (out, t) {
      var w = gain(0.25, out), l = osc('sine', 0.09, gain(0.12, w.gain), t);
      return [src(brown, filt('lowpass', 240, 0.3, gain(0.6, out)), t, 0, true),
              src(white, filt('bandpass', 900, 0.4, gain(0.05, w)), t, 0, true), l];
    },
    /* エレベーターの巻上機 */
    elev: function (out, t) {
      var lp = filt('lowpass', 260, 2, gain(0.5, out));
      return [osc('sawtooth', 48, lp, t), osc('sawtooth', 96.6, gain(0.3, lp), t),
              src(brown, filt('bandpass', 380, 1.5, gain(0.25, out)), t, 0, true)];
    },
    /* 壁ごしに聞こえるテレビ：こもった人の声のようなもの */
    tv_muffled: function (out, t) {
      var lp = filt('lowpass', 520, 0.8, gain(1, out));
      var v = gain(0.25, lp), f1 = filt('bandpass', 430, 4, v);
      var a = osc('sawtooth', 118, f1, t), b = osc('sawtooth', 171, gain(0.6, f1), t);
      var m1 = osc('sine', 3.7, gain(0.22, v.gain), t), m2 = osc('sine', 0.61, gain(0.14, v.gain), t);
      var p = osc('sine', 0.23, gain(22, a.frequency), t), p2 = osc('sine', 0.31, gain(30, b.frequency), t), fm = osc('sine', 0.9, gain(160, f1.frequency), t);
      return [a, b, m1, m2, p, p2, fm, src(crackle, filt('bandpass', 700, 0.6, gain(0.1, lp)), t, 0, true)];
    },
    drone: function (out, t) {
      var lp = filt('lowpass', 170, 1.2, gain(0.55, out));
      var lfo = osc('sine', 0.07, gain(70, lp.frequency), t);
      var trem = gain(0.6, out), lfo2 = osc('sine', 0.11, gain(0.35, trem.gain), t);
      return [osc('sawtooth', 55, lp, t), osc('sawtooth', 55.35, lp, t), osc('sine', 41.2, gain(0.4, out), t),
              osc('sine', 164.8, gain(0.05, trem), t), osc('sine', 247.3, gain(0.022, trem), t), lfo, lfo2,
              src(brown, filt('bandpass', 700, 2, gain(0.06, trem)), t, 0, true)];
    }
  };

  /* A.loop(name, 音量, フェードイン秒, 'bgm'|'se') → { stop(フェード秒), vol(音量, 秒) } */
  A.loop = function (name, vol, fadeIn, bus) {
    var dead = { stop: function () {}, vol: function () {} };
    if (!ctx) return dead;
    var t = ctx.currentTime + 0.02, g = gain(0, bus === 'se' ? seBus : bgmBus), nodes;
    if (files[name]) { var s = ctx.createBufferSource(); s.buffer = files[name]; s.loop = true; s.connect(g); s.start(t); nodes = [s]; }
    else if (LOOPS[name]) nodes = LOOPS[name](g, t);
    else return dead;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + (fadeIn || 0.05));
    var h = {
      stop: function (fade) {
        if (h.dead) return; h.dead = true;
        var n = ctx.currentTime, f = fade == null ? 0.4 : fade;
        g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0, n + f);
        nodes.forEach(function (x) { try { x.stop(n + f + 0.05); } catch (e) {} });
        setTimeout(function () { try { g.disconnect(); } catch (e) {} }, (f + 0.2) * 1000);
        loops.splice(loops.indexOf(h), 1);
      },
      vol: function (v, sec) {
        if (h.dead) return;
        var n = ctx.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(v, n + (sec || 0.1));
      }
    };
    loops.push(h); return h;
  };
  A.stopAll = function (fade) { loops.slice().forEach(function (h) { h.stop(fade == null ? 0.3 : fade); }); };
})(window.SW);
