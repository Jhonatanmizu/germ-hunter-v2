/* global window */
(function (GH) {
  'use strict';

  var P = GH.PALETTE;

  /**
   * Bullets: lightweight projectile helpers (no class needed).
   * Single responsibility: update + draw a bullet array.
   */
  var Bullets = {
    update: function (list, dt, w, h) {
      for (var i = list.length - 1; i >= 0; i--) {
        var b = list[i];
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (b.life <= 0 || b.x < -10 || b.x > w + 10 || b.y < -10 || b.y > h + 10) {
          list.splice(i, 1);
        }
      }
    },

    draw: function (ctx, list) {
      ctx.save();
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        ctx.shadowColor = P.cyan; ctx.shadowBlur = 8;
        ctx.fillStyle = P.cyan;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 0.45, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  };

  GH.Bullets = Bullets;
})(window.GH = window.GH || {});
