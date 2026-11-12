/* ============================================================
   SWITCH — 素材の差し替え表
   ここに書いたファイルが、ゲーム内の仮素材のかわりに使われます。
   プログラムを直す必要はありません。ファイル名を書くだけです。
   ============================================================ */
window.SW = window.SW || {};

/* 背景画像（1920x1080・横長）。写真に差し替えるときはファイル名を変える。 */
SW.IMAGES = {
  ch01_room: 'assets/bg/ch01_room.svg',      // 第1章：蓮の部屋　例: 'assets/bg/ch01_room.jpg'
  ch02_hall: 'assets/bg/ch02_hall.svg',      // 第2章：4階エレベーターホール
  ch02_room404: 'assets/bg/ch02_room404.svg',// 第2章：404号室（空室）
  ch03_gate: 'assets/bg/ch03_gate.svg',      // 第3章：灯ヶ丘駅・改札前
  ch03_office: 'assets/bg/ch03_office.svg',  // 第3章：灯ヶ丘駅・駅務室
  ch04_station: 'assets/bg/ch04_station.svg',// 第4章：病院・ナースステーション
  ch04_icu: 'assets/bg/ch04_icu.svg',        // 第4章：病院・ICU 3番
  ch05_dock: 'assets/bg/ch05_dock.svg',      // 第5章：実証プラント・搬入口
  ch05_control: 'assets/bg/ch05_control.svg',// 第5章：実証プラント・制御室
  ch06_cross: 'assets/bg/ch06_cross.svg',    // 第6章：駅前の交差点
  ch06_memorial: 'assets/bg/ch06_memorial.svg' // 第6章：公園の慰霊碑
};

/* 音声ファイル。何も書かなければ、ゲームが自動で作る音（合成音）が鳴る。
   例:  switch_on: 'assets/audio/switch_on.mp3'
   使える名前:
     効果音 … switch_on, switch_off, light_tink, tv_on, tv_off, chime, cut,
               door, tick, boom, beep, voice, ding, elev_door, lock, creak,
               pa_chime, ring_tone, clunk, train, nursecall, pulse, printer, alarm, powerdown, pipo
     ループ … roomtone, hum, static, drone, night, elev, tv_muffled, station, pa_voice, flatline, genhum, fan                               */
SW.AUDIO_FILES = {
};
