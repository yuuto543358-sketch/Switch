/* ============================================================
   SWITCH — 素材の差し替え表
   ここに書いたファイルが、ゲーム内の仮素材のかわりに使われます。
   プログラムを直す必要はありません。ファイル名を書くだけです。
   ============================================================ */
window.SW = window.SW || {};

/* 背景画像（1920x1080・横長）。写真に差し替えるときはファイル名を変える。 */
SW.IMAGES = {
  ch01_room: 'assets/bg/ch01_room.svg'      // 例: 'assets/bg/ch01_room.jpg'
};

/* 音声ファイル。何も書かなければ、ゲームが自動で作る音（合成音）が鳴る。
   例:  switch_on: 'assets/audio/switch_on.mp3'
   使える名前:
     効果音 … switch_on, switch_off, light_tink, tv_on, tv_off, chime, cut,
               door, tick, boom, beep, voice
     ループ … roomtone, hum, static, drone                                  */
SW.AUDIO_FILES = {
};
