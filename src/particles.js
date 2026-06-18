/* global window */
(function (GH) {
  'use strict';

  var U = GH.Utils;

  /**
   * ParticleSystem: sparks + floating score popups.
   * Single responsibility: own and render transient visual effects.
   */
  function ParticleSystem() {
    this.list = [];
  }

  ParticleSystem.prototype.spawnBurst = function (x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var a = U.rand(0, Math.PI * 2);
      var sp = U.rand(10, 45);
      this.list.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: U.rand(0.3, 0.8), maxLife: 0.8,
        size: U.rand(2, 5), color: color
      });
    }
  };

  ParticleSystem.prototype.spawnPopup = function (x, y, text, color) {
    this.list.push({
      x: x, y: y, vx: 0, vy: -20,
      text: text, color: color,
      life: 1.0, maxLife: 1.0, isText: true
    });
  };

  ParticleSystem.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.isText) p.vy *= 0.97;
      else { p.vx *= 0.95; p.vy *= 0.95; }
      if (p.life <= 0) this.list.splice(i, 1);
    }
  };

  ParticleSystem.prototype.draw = function (ctx) {
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      var alpha = U.clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      if (p.isText) {
        ctx.fillStyle = p.color;
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        var sz = p.size * (0.5 + alpha * 0.5);
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  };

  ParticleSystem.prototype.clear = function () { this.list.length = 0; };

  GH.Particles = ParticleSystem;
})(window.GH = window.GH || {});
