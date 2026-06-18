/* global window */
(function (GH) {
  'use strict';

  var Content = GH.Content;
  var U = GH.Utils;

  /**
   * ScreenManager: shows/hides DOM overlay screens and fills their dynamic text.
   * Single responsibility: DOM navigation between menu/instructions/phase/over/credits.
   */
  function ScreenManager() {
    this.current = 'menu';
  }

  ScreenManager.prototype._set = function (id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
    this.current = id.replace('-screen', '');
  };

  ScreenManager.prototype.buildInstructions = function () {
    var list = document.getElementById('instructions-list');
    if (!list || list.childElementCount) return;
    Content.instructions.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'instruction-item';
      var icon = document.createElement('div');
      icon.className = 'instruction-icon';
      icon.style.background = it.color;
      icon.style.borderColor = it.border;
      var span = document.createElement('span');
      span.innerHTML = it.text;
      row.appendChild(icon); row.appendChild(span);
      list.appendChild(row);
    });
    var foot = document.getElementById('instructions-footer');
    if (foot) foot.innerHTML = Content.instructionFooter;
    var ctrl = document.getElementById('instructions-controls');
    if (ctrl) ctrl.textContent = Content.controls;
  };

  ScreenManager.prototype.buildCredits = function () {
    var box = document.getElementById('credits-text');
    if (!box || box.childElementCount) return;
    Content.credits.forEach(function (para) {
      var p = document.createElement('div');
      p.className = 'credits-block';
      p.innerHTML = para;
      box.appendChild(p);
    });
  };

  ScreenManager.prototype.showMenu = function () { this._set('menu-screen'); };
  ScreenManager.prototype.showInstructions = function () { this.buildInstructions(); this._set('instructions-screen'); };
  ScreenManager.prototype.showCredits = function () { this.buildCredits(); this._set('credits-screen'); };

  ScreenManager.prototype.showPhase = function (phase, btnLabel) {
    document.getElementById('phase-number').textContent = phase;
    document.getElementById('phase-message').textContent = Content.phaseMessages[phase] || '';
    var ci = (phase - 1) % Content.curiosities.length;
    document.getElementById('phase-curiosity').textContent = Content.curiosities[ci];
    document.getElementById('phase-btn').textContent = btnLabel || '▶ COMEÇAR';
    this._set('phase-screen');
  };

  ScreenManager.prototype.showGameOver = function (state) {
    document.getElementById('final-score').textContent = state.score;
    document.getElementById('final-germs').textContent = state.germsEliminated;
    document.getElementById('final-phase').textContent = state.phase;
    document.getElementById('final-time').textContent = U.formatTime(state.elapsedTime);
    this._set('gameover-screen');
  };

  ScreenManager.prototype.hideAll = function () {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    this.current = 'playing';
  };

  GH.Screens = ScreenManager;
})(window.GH = window.GH || {});
