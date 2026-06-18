/* global window */
(function (GH) {
  'use strict';

  /**
   * AudioSystem: synthesized SFX + looping music via WebAudio.
   * Single responsibility: sound generation only.
   */
  function AudioSystem() {
    this.ctx = null;
    this.pattern = null;
    this.musicIdx = 0;
    this.musicTimer = 0;
    this.muted = false;
  }

  AudioSystem.prototype.init = function () {
    if (!this.ctx) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  AudioSystem.prototype._tone = function (freq, dur, type, gain, delay) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime + (delay || 0);
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  };

  AudioSystem.prototype._sweep = function (f1, f2, dur, type, gain) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f1, t);
    o.frequency.linearRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(gain || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur);
  };

  AudioSystem.prototype.shoot    = function () { this._tone(720, 0.05, 'square', 0.05); };
  AudioSystem.prototype.virus    = function () { this._tone(880, 0.06, 'square', 0.08); };
  AudioSystem.prototype.bacteria = function () { this._tone(440, 0.08, 'square', 0.08); };
  AudioSystem.prototype.gel      = function () { this._sweep(300, 1000, 0.2, 'square', 0.1); };
  AudioSystem.prototype.vaccine  = function () {
    this._tone(523, 0.08, 'triangle', 0.1, 0);
    this._tone(659, 0.08, 'triangle', 0.1, 0.06);
    this._tone(784, 0.12, 'triangle', 0.1, 0.12);
  };
  AudioSystem.prototype.hit      = function () { this._sweep(420, 160, 0.18, 'sawtooth', 0.07); };
  AudioSystem.prototype.escape   = function () { this._sweep(500, 120, 0.25, 'sawtooth', 0.06); };
  AudioSystem.prototype.gameOver = function () { this._sweep(400, 50, 0.8, 'sawtooth', 0.08); };
  AudioSystem.prototype.phaseUp  = function () {
    this._tone(523, 0.1, 'triangle', 0.1, 0);
    this._tone(659, 0.1, 'triangle', 0.1, 0.1);
    this._tone(784, 0.1, 'triangle', 0.1, 0.2);
    this._tone(1047, 0.2, 'triangle', 0.12, 0.3);
  };
  AudioSystem.prototype.click    = function () { this._tone(600, 0.03, 'square', 0.04); };

  var MUSIC_PATTERNS = {
    1: { notes: [262, 294, 330, 349, 330, 294, 262, 247], tempo: 0.28 },
    2: { notes: [262, 330, 392, 523, 392, 330, 262, 294], tempo: 0.22 },
    3: { notes: [262, 330, 392, 523, 659, 523, 392, 523], tempo: 0.16 }
  };

  AudioSystem.prototype.startMusic = function (phase) {
    this.pattern = MUSIC_PATTERNS[phase] || MUSIC_PATTERNS[1];
    this.musicIdx = 0;
    this.musicTimer = 0;
  };

  AudioSystem.prototype.stopMusic = function () {
    this.pattern = null;
    this.musicIdx = 0;
    this.musicTimer = 0;
  };

  AudioSystem.prototype.update = function (dt) {
    if (!this.pattern || !this.ctx) return;
    this.musicTimer += dt;
    while (this.musicTimer >= this.pattern.tempo) {
      this.musicTimer -= this.pattern.tempo;
      var f = this.pattern.notes[this.musicIdx % this.pattern.notes.length];
      this.musicIdx++;
      this._tone(f, this.pattern.tempo * 0.7, 'square', 0.025);
      if (this.musicIdx % 3 === 0) this._tone(f * 1.5, this.pattern.tempo * 0.4, 'triangle', 0.015);
    }
  };

  GH.Audio = new AudioSystem();
})(window.GH = window.GH || {});
