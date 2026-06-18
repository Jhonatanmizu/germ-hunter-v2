/* global window */
(function (GH) {
  'use strict';

  var U = GH.Utils;
  var S = GH.Sprites;

  /**
   * PowerUp: alcohol gel or vaccine pickup that floats in place.
   * Single responsibility: pickup state + rendering.
   */
  function PowerUp(type, cfg) {
    var margin = 30;
    this.type = type;
    this.size = cfg.GERM.sprite * 0.85;
    this.x = U.rand(margin, cfg.W - margin);
    this.y = U.rand(margin, cfg.H - margin);
    this.bob = U.rand(0, Math.PI * 2);
    this.dead = false;
  }

  PowerUp.prototype.update = function (dt) {
    this.bob += dt * 3;
  };

  PowerUp.prototype.draw = function (ctx) {
    var glow = Math.sin(U.now() * 3) * 0.15 + 0.85;
    ctx.save();
    ctx.globalAlpha = glow;
    if (this.type === 'gel') S.alcoholGel(ctx, this.x, this.y, this.size);
    else S.vaccine(ctx, this.x, this.y, this.size);
    ctx.restore();
  };

  GH.PowerUp = PowerUp;
})(window.GH = window.GH || {});
