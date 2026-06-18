/* global window */
(function (GH) {
  'use strict';

  var P = GH.PALETTE;
  var U = GH.Utils;

  /**
   * Background: neon cityscape that reacts to contamination.
   * Single responsibility: paint the arena backdrop each frame.
   */
  var bldgColors = ['#1e1e3a', '#252545', '#1a1a35', '#2a2a4a', '#202038'];
  var bldgW = [22, 16, 28, 18, 14, 24, 20, 26, 15, 30];

  var Background = {
    draw: function (ctx, w, h, phase, contam) {
      var skyR = 6 + contam * 0.18;
      var skyG = 12 + contam * 0.04;
      var skyB = 32 - contam * 0.18;
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgb(' + (skyR | 0) + ',' + (skyG | 0) + ',' + (Math.max(0, skyB) | 0) + ')');
      grad.addColorStop(1, 'rgb(' + ((skyR * 0.4) | 0) + ',' + ((skyG * 0.3) | 0) + ',' + ((Math.max(0, skyB * 0.4)) | 0) + ')');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // neon grid floor
      var groundY = h * 0.78;
      ctx.strokeStyle = U.hexToRgba(P.cyan, 0.12);
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= w; gx += 24) {
        ctx.beginPath(); ctx.moveTo(gx, groundY); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (var gy = groundY; gy <= h; gy += 8) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      ctx.fillStyle = P.bgDeep;
      ctx.fillRect(0, groundY, w, h - groundY);
      ctx.fillStyle = U.hexToRgba(P.cyan, 0.5);
      ctx.fillRect(0, groundY, w, 1);

      // buildings
      var bx = 0, i = 0;
      while (bx < w + 20) {
        var bw = bldgW[i % bldgW.length] + Math.floor(U.detSeed(i * 1.7 + 13) * 7) - 3;
        var bh = Math.floor(U.detSeed(i * 3.1 + 7) * 40) + 22;
        ctx.fillStyle = bldgColors[i % bldgColors.length];
        ctx.fillRect(bx, groundY - bh, bw, bh);
        for (var wy = 0; wy < bh - 6; wy += 7) {
          for (var wx = 2; wx < bw - 3; wx += 7) {
            if (U.detSeed(i * 5 + wx * 0.7 + wy * 1.3) > 0.5) {
              ctx.fillStyle = contam > 60 ? '#4a3020' : (U.detSeed(i + wx) > 0.5 ? P.cyanMid : '#3a5080');
              ctx.fillRect(bx + wx, groundY - bh + 4 + wy, 4, 4);
            }
          }
        }
        bx += bw + Math.floor(U.detSeed(i * 2.3 + 19) * 4) + 1;
        i++;
      }

      // contamination red haze
      if (contam > 30) {
        var pulse = Math.sin(U.now() * 2) * 0.2 + 0.3;
        ctx.globalAlpha = (contam / 100) * 0.15 * (1 + pulse * 0.5);
        ctx.fillStyle = P.red;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // vignette
      var vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }
  };

  GH.Background = Background;
})(window.GH = window.GH || {});
