/* global window */
(function (GH) {
  'use strict';

  /**
   * Entry point. Single responsibility: boot the Game on load and expose it on
   * window so the HTML buttons (onclick) can call game.showMenu(), etc.
   */
  function boot() {
    var game = new GH.Game();
    game.init();
    window.game = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.GH = window.GH || {});
