/* global window */
(function (GH) {
  'use strict';

  /** Math / helper utilities. Single responsibility: pure functions. */
  var Utils = {
    rand: function (min, max) { return Math.random() * (max - min) + min; },
    randInt: function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    clamp: function (v, min, max) { return Math.max(min, Math.min(max, v)); },
    dist: function (x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    angle: function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
    detSeed: function (v) { return Math.abs(Math.sin(v * 127.1 + 311.7)) % 1; },
    now: function () { return performance.now() / 1000; },

    formatTime: function (seconds) {
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },

    hexToRgba: function (hex, a) {
      var n = parseInt(hex.slice(1), 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
  };

  GH.Utils = Utils;
})(window.GH = window.GH || {});
