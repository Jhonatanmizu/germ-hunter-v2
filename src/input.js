/* global window */
(function (GH) {
  'use strict';

  /**
   * InputManager: keyboard + mouse + touch.
   * Single responsibility: capture raw input and expose a clean per-frame state.
   * Coordinates are returned in the game's internal resolution space (CFG.W/H).
   */
  function InputManager(canvas, scaleTo) {
    this.canvas = canvas;
    this.scaleTo = scaleTo; // {w,h} internal resolution
    this.keys = {};
    this.mouse = { x: scaleTo.w / 2, y: scaleTo.h / 2, down: false };
    this.firePressed = false; // edge-triggered shoot request this frame
    this._bind();
  }

  InputManager.prototype._toGame = function (clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (this.scaleTo.w / rect.width);
    var y = (clientY - rect.top) * (this.scaleTo.h / rect.height);
    return { x: x, y: y };
  };

  InputManager.prototype._bind = function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      self.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        self.firePressed = true;
        if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) !== -1) {
          e.preventDefault();
        }
      }
    });
    window.addEventListener('keyup', function (e) {
      self.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', function (e) {
      var p = self._toGame(e.clientX, e.clientY);
      self.mouse.x = p.x; self.mouse.y = p.y;
    });
    this.canvas.addEventListener('mousedown', function () {
      self.mouse.down = true; self.firePressed = true;
    });
    this.canvas.addEventListener('mouseup', function () { self.mouse.down = false; });
    this.canvas.addEventListener('mouseleave', function () { self.mouse.down = false; });

    this.canvas.addEventListener('touchstart', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = self._toGame(t.clientX, t.clientY);
      self.mouse.x = p.x; self.mouse.y = p.y;
      self.mouse.down = true; self.firePressed = true;
    }, { passive: false });
    this.canvas.addEventListener('touchmove', function (e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = self._toGame(t.clientX, t.clientY);
      self.mouse.x = p.x; self.mouse.y = p.y;
    }, { passive: false });
    this.canvas.addEventListener('touchend', function (e) {
      e.preventDefault();
      self.mouse.down = false;
    }, { passive: false });
  };

  /** Movement vector (normalized), WASD or arrows. */
  InputManager.prototype.movement = function () {
    var k = this.keys;
    var dx = 0, dy = 0;
    if (k['a'] || k['arrowleft']) dx -= 1;
    if (k['d'] || k['arrowright']) dx += 1;
    if (k['w'] || k['arrowup']) dy -= 1;
    if (k['s'] || k['arrowdown']) dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
    return { x: dx, y: dy };
  };

  InputManager.prototype.consumeFire = function () {
    var p = this.firePressed || this.mouse.down;
    this.firePressed = false;
    return p;
  };

  InputManager.prototype.isShootHeld = function () {
    return this.mouse.down || !!this.keys[' '];
  };

  GH.Input = InputManager;
})(window.GH = window.GH || {});
