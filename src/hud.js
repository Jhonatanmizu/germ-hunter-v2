/* global window */
(function (GH) {
  'use strict';

  var P = GH.PALETTE;
  var U = GH.Utils;

  /**
   * HUD: heads-up display (phase, score, time, contamination bar, health).
   * Single responsibility: draw the in-game UI overlay only.
   */
  var phaseColors = [P.cyan, P.green, P.yellow];

  var HUD = {
    draw: function (ctx, w, h, state) {
      ctx.save();
      ctx.fillStyle = 'rgba(2,13,42,0.78)';
      ctx.fillRect(0, 0, w, 30);
      ctx.fillStyle = U.hexToRgba(P.cyan, 0.5);
      ctx.fillRect(0, 30, w, 1);

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textBaseline = 'middle';

      // phase
      ctx.fillStyle = phaseColors[state.phase - 1] || P.cyan;
      ctx.textAlign = 'left';
      ctx.fillText('F' + state.phase, 8, 15);

      // score
      ctx.fillStyle = P.text;
      ctx.fillText('PTS:' + state.score, 40, 15);

      // time
      ctx.fillStyle = P.textDim;
      ctx.textAlign = 'right';
      ctx.fillText(U.formatTime(state.elapsedTime), w - 8, 15);

      // contamination bar
      var barX = w * 0.40, barW = w * 0.34, barY = 9, barH = 13;
      ctx.fillStyle = P.bgDeep;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = P.teal; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);

      var fillW = (state.contamination / 100) * (barW - 2);
      if (fillW > 0) {
        var grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, P.yellow);
        grad.addColorStop(0.5, '#ff8a00');
        grad.addColorStop(1, P.red);
        ctx.fillStyle = grad;
        ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);
        if (state.contamination > 60) {
          var pulse = Math.sin(U.now() * 5) * 0.3 + 0.7;
          ctx.globalAlpha = pulse * 0.5;
          ctx.fillStyle = P.red;
          ctx.fillRect(barX + 1, barY + 1, fillW, barH - 2);
          ctx.globalAlpha = 1;
        }
      }
      ctx.fillStyle = P.text;
      ctx.textAlign = 'left';
      ctx.font = '6px "Press Start 2P", monospace';
      var pct = Math.floor(state.contamination) + '%';
      ctx.fillText(pct, barX + (barW - ctx.measureText(pct).width) / 2, barY + barH / 2);

      // health hearts (bottom-left)
      var hx = 8, hy = h - 12;
      for (var i = 0; i < state.maxHealth; i++) {
        ctx.fillStyle = i < state.health ? P.red : U.hexToRgba(P.textDark, 0.6);
        this._heart(ctx, hx + i * 12, hy, 4);
      }

      ctx.restore();
    },

    _heart: function (ctx, x, y, r) {
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.5);
      ctx.arc(x - r * 0.5, y, r * 0.5, Math.PI, 0);
      ctx.arc(x + r * 0.5, y, r * 0.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    }
  };

  GH.HUD = HUD;
})(window.GH = window.GH || {});
