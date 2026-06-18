/* global window */
(function (GH) {
  'use strict';

  var P = GH.PALETTE;
  var U = GH.Utils;

  /**
   * Sprites: pure draw routines for enemies and pickups (no state).
   * Single responsibility: render a germ/pickup centered at (x,y) with size s.
   */
  var Sprites = {
    virus: function (ctx, x, y, s) {
      var r = s * 0.45;
      ctx.save();
      ctx.translate(x, y);
      var t = U.now() * 5;
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2 + t;
        var sx = Math.cos(a) * r * 1.3;
        var sy = Math.sin(a) * r * 1.3;
        ctx.fillStyle = i % 2 === 0 ? P.redDark : P.red;
        ctx.beginPath(); ctx.arc(sx, sy, r * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowColor = P.red; ctx.shadowBlur = 8;
      ctx.fillStyle = P.red;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = P.redDark;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.28, 0, Math.PI * 2);
      ctx.arc(r * 0.3, -r * 0.15, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.arc(r * 0.3, -r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1a0a0a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.2, 0.1, Math.PI - 0.1); ctx.stroke();
      ctx.restore();
    },

    bacteria: function (ctx, x, y, s) {
      var rx = s * 0.4, ry = s * 0.32;
      ctx.save();
      ctx.translate(x, y);
      var t = U.now() * 3.3;
      for (var i = 0; i < 10; i++) {
        var a = (i / 10) * Math.PI * 2 + t;
        var px = Math.cos(a) * rx * 1.2;
        var py = Math.sin(a) * ry * 1.2;
        ctx.strokeStyle = P.greenDark; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px * 0.7, py * 0.7);
        ctx.lineTo(px + Math.cos(a + t * 0.5) * 5, py + Math.sin(a + t * 0.5) * 5);
        ctx.stroke();
      }
      ctx.shadowColor = P.greenMid; ctx.shadowBlur = 8;
      ctx.fillStyle = P.greenMid;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = P.greenDark;
      ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-rx * 0.3, -ry * 0.2, rx * 0.28, 0, Math.PI * 2);
      ctx.arc(rx * 0.3, -ry * 0.2, rx * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a1a0a';
      ctx.beginPath();
      ctx.arc(-rx * 0.3, -ry * 0.2, rx * 0.14, 0, Math.PI * 2);
      ctx.arc(rx * 0.3, -ry * 0.2, rx * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a1a0a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, ry * 0.15, rx * 0.15, 0.05, Math.PI - 0.05); ctx.stroke();
      ctx.restore();
    },

    alcoholGel: function (ctx, x, y, s) {
      var w = s * 0.55, h = s * 0.7;
      ctx.save(); ctx.translate(x, y);
      ctx.shadowColor = P.cyanMid; ctx.shadowBlur = 10;
      ctx.fillStyle = P.cyanMid;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = P.teal;
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.25);
      ctx.fillStyle = P.cyan;
      ctx.fillRect(-w / 3, -h / 2 + 2, w * 0.2, h * 0.18);
      ctx.fillStyle = '#fff';
      ctx.fillRect(-w * 0.2, -h * 0.1, w * 0.4, h * 0.15);
      ctx.fillRect(-w * 0.15, h * 0.05, w * 0.3, h * 0.1);
      ctx.fillStyle = P.cyanSoft;
      ctx.fillRect(-w * 0.3, -h * 0.4, w * 0.6, h * 0.15);
      ctx.fillStyle = P.tealDark;
      ctx.fillRect(-w * 0.12, -h * 0.55, w * 0.24, h * 0.18);
      ctx.restore();
    },

    vaccine: function (ctx, x, y, s) {
      ctx.save(); ctx.translate(x, y);
      var w = s * 0.5, h = s * 0.6;
      ctx.shadowColor = P.yellow; ctx.shadowBlur = 10;
      ctx.fillStyle = '#e0f7fa';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#b2ebf2';
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.2);
      ctx.fillStyle = P.cyanSoft;
      ctx.fillRect(-w * 0.15, -h * 0.15, w * 0.3, h * 0.4);
      ctx.fillStyle = '#bdbdbd';
      ctx.fillRect(-w * 0.1, -h * 0.55, w * 0.2, h * 0.12);
      ctx.fillStyle = '#78909c';
      ctx.fillRect(-w * 0.15, -h * 0.65, w * 0.3, h * 0.12);
      ctx.fillStyle = P.yellow;
      var capW = w * 0.22;
      ctx.fillRect(-capW / 2, -h / 2 - 4, capW, 4);
      ctx.fillRect(-capW / 2, -h / 2 - 6, capW * 0.6, 4);
      ctx.restore();
    }
  };

  GH.Sprites = Sprites;
})(window.GH = window.GH || {});
