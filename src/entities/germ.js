/* global window */
(function (GH) {
  'use strict';

  var U = GH.Utils;
  var S = GH.Sprites;

  /**
   * Germ: a virus or bacteria entity that drifts and slowly homes the player.
   * Single responsibility: germ state + rendering.
   */
  function Germ(type, phase, cfg) {
    var C = cfg;
    this.type = type;
    this.size = type === 'bacteria' ? C.GERM.sprite * 0.9 : C.GERM.sprite;
    this.radius = this.size * 0.5;

    // spawn just outside a random edge
    var edge = U.randInt(0, 3);
    if (edge === 0) { this.x = U.rand(0, C.W); this.y = -this.size; }
    else if (edge === 1) { this.x = C.W + this.size; this.y = U.rand(0, C.H); }
    else if (edge === 2) { this.x = U.rand(0, C.W); this.y = C.H + this.size; }
    else { this.x = -this.size; this.y = U.rand(0, C.H); }

    var speed = type === 'bacteria'
      ? C.GERM.bacteriaSpeed[phase - 1]
      : C.GERM.virusSpeed[phase - 1];
    var a = U.angle(this.x, this.y, C.W / 2, C.H / 2) + U.rand(-0.6, 0.6);
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;
    this.phase = phase;
    this.dead = false;
  }

  Germ.prototype.update = function (dt, player, cfg) {
    // mild homing toward the player
    var dx = player.x - this.x, dy = player.y - this.y;
    var d = Math.hypot(dx, dy) || 1;
    var homing = 18;
    this.vx = U.lerp(this.vx, (dx / d) * homing * 2, 0.02);
    this.vy = U.lerp(this.vy, (dy / d) * homing * 2, 0.02);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // wrap softly: escaped if fully off-screen on the far side
    if (this.x < -this.size * 1.5 || this.x > cfg.W + this.size * 1.5 ||
        this.y < -this.size * 1.5 || this.y > cfg.H + this.size * 1.5) {
      this.dead = true;
      this.escaped = true;
    }
  };

  Germ.prototype.draw = function (ctx) {
    if (this.type === 'virus') S.virus(ctx, this.x, this.y, this.size);
    else S.bacteria(ctx, this.x, this.y, this.size);
  };

  GH.Germ = Germ;
})(window.GH = window.GH || {});
