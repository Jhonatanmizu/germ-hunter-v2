/* global window, document, performance */
(function (GH) {
  'use strict';

  var CFG = GH.Config;
  var P = GH.PALETTE;
  var U = GH.Utils;
  var Audio = GH.Audio;
  var Background = GH.Background;
  var Bullets = GH.Bullets;
  var HUD = GH.HUD;
  var Germ = GH.Germ;
  var PowerUp = GH.PowerUp;
  var Player = GH.Player;
  var ParticleSystem = GH.Particles;
  var ScreenManager = GH.Screens;
  var InputManager = GH.Input;
  var Assets = GH.Assets;

  /**
   * Game: top-level orchestrator. Owns the loop, world state, spawning and
   * collisions. Delegates rendering/audio/input to dedicated modules.
   * Single responsibility: coordinate frame updates and game-state transitions.
   */
  function Game() {
    this.canvas = null;
    this.ctx = null;
    this.input = null;
    this.particles = new ParticleSystem();
    this.screens = new ScreenManager();
    this.player = new Player(CFG);

    this.state = 'menu'; // menu | phase | playing | gameover
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDt = 1 / 60;

    this.score = 0;
    this.contamination = 0;
    this.elapsedTime = 0;
    this.phase = 1;
    this.germsEliminated = 0;
    this.germs = [];
    this.powerups = [];
    this.bullets = [];
    this.spawnTimer = 0;
    this.gelTimer = 0;
    this.vaccineTimer = 0;
    this.phaseChanged = false;
  }

  Game.prototype.init = function () {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputManager(this.canvas, { w: CFG.W, h: CFG.H });
    this._bindGlobalKeys();
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    this._boundLoop = this.loop.bind(this);
    var self = this;
    Assets.load(function () { self.lastTime = performance.now(); self.loop(); });
  };

  Game.prototype._bindGlobalKeys = function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        if (self.state === 'menu') self.startGame();
        else if (self.state === 'gameover') self.startGame();
      }
    });
  };

  Game.prototype.resize = function () {
    var wrapper = document.getElementById('game-wrapper');
    var rect = wrapper.getBoundingClientRect();
    this.canvas.width = CFG.W;
    this.canvas.height = CFG.H;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
  };

  // ---- public transitions (called from HTML buttons) ----
  Game.prototype.showMenu = function () { Audio.stopMusic(); this.reset(); this.screens.showMenu(); this.state = 'menu'; };
  Game.prototype.showInstructions = function () { Audio.click(); this.screens.showInstructions(); };
  Game.prototype.showCredits = function () { Audio.click(); this.screens.showCredits(); };

  Game.prototype.startGame = function () {
    Audio.init(); Audio.click();
    this.reset();
    this.showPhaseTransition(1);
  };

  Game.prototype.startPlaying = function () {
    Audio.init();
    Audio.startMusic(this.phase);
    this.screens.hideAll();
    this.state = 'playing';
    this.running = true;
  };

  Game.prototype.showPhaseTransition = function (phase) {
    Audio.stopMusic();
    Audio.phaseUp();
    this.state = 'phase';
    this.screens.showPhase(phase, phase === 1 ? '▶ COMEÇAR' : '▶ CONTINUAR');
  };

  Game.prototype.reset = function () {
    Audio.stopMusic();
    this.score = 0;
    this.contamination = 0;
    this.elapsedTime = 0;
    this.phase = 1;
    this.germsEliminated = 0;
    this.germs = [];
    this.powerups = [];
    this.bullets = [];
    this.particles.clear();
    this.spawnTimer = 0;
    this.gelTimer = CFG.POWERUP.gelInterval;
    this.vaccineTimer = CFG.POWERUP.vaccineInterval;
    this.phaseChanged = false;
    this.player.reset();
  };

  Game.prototype.gameOver = function () {
    Audio.stopMusic();
    Audio.gameOver();
    this.running = false;
    this.state = 'gameover';
    this.screens.showGameOver(this._stats());
  };

  Game.prototype._stats = function () {
    return {
      score: this.score,
      germsEliminated: this.germsEliminated,
      phase: this.phase,
      elapsedTime: this.elapsedTime,
      contamination: this.contamination,
      health: this.player.health,
      maxHealth: this.player.maxHealth
    };
  };

  // ---- spawning ----
  Game.prototype._spawnGerm = function () {
    if (this.germs.length >= CFG.GERM.maxGerms[this.phase - 1]) return;
    var type = Math.random() < CFG.GERM.bacteriaChance[this.phase - 1] ? 'bacteria' : 'virus';
    this.germs.push(new Germ(type, this.phase, CFG));
  };

  Game.prototype._spawnPowerUp = function (type) {
    if (this.powerups.length >= CFG.POWERUP.maxOnScreen) return;
    this.powerups.push(new PowerUp(type, CFG));
  };

  // ---- phase progression ----
  Game.prototype._checkPhaseProgression = function () {
    if (this.phase === 1 && this.score >= CFG.PHASE_1_SCORE) {
      this.phase = 2; this.phaseChanged = true; this.gelTimer = -3;
      this.showPhaseTransition(2); return true;
    }
    if (this.phase === 2 && this.score >= CFG.PHASE_2_SCORE) {
      this.phase = 3; this.phaseChanged = true; this.gelTimer = -3;
      this.showPhaseTransition(3); return true;
    }
    return false;
  };

  // ---- collisions ----
  Game.prototype._handleCollisions = function () {
    // bullets vs germs
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      var b = this.bullets[i];
      for (var j = this.germs.length - 1; j >= 0; j--) {
        var g = this.germs[j];
        if (U.dist(b.x, b.y, g.x, g.y) < g.radius + b.size) {
          this.bullets.splice(i, 1);
          this.germs.splice(j, 1);
          var pts = g.type === 'virus' ? CFG.GERM.virusPoints : CFG.GERM.bacteriaPoints;
          this.score += pts;
          this.germsEliminated++;
          if (g.type === 'virus') Audio.virus(); else Audio.bacteria();
          this.particles.spawnBurst(g.x, g.y, g.type === 'virus' ? P.red : P.greenMid, 9);
          this.particles.spawnPopup(g.x, g.y - 8, '+' + pts, P.cyan);
          break;
        }
      }
    }

    // player vs germs
    for (var k = this.germs.length - 1; k >= 0; k--) {
      var gg = this.germs[k];
      if (U.dist(this.player.x, this.player.y, gg.x, gg.y) < gg.radius + this.player.size * 0.4) {
        if (this.player.takeHit(Audio)) {
          this.contamination = U.clamp(this.contamination + CFG.GERM.contactContam, 0, CFG.MAX_CONTAM);
          this.particles.spawnBurst(this.player.x, this.player.y, P.red, 10);
          this.particles.spawnPopup(this.player.x, this.player.y - 14, '-' + CFG.GERM.contactContam + '%', P.red);
        }
        this.germs.splice(k, 1);
      }
    }

    // player vs powerups
    for (var m = this.powerups.length - 1; m >= 0; m--) {
      var pu = this.powerups[m];
      if (U.dist(this.player.x, this.player.y, pu.x, pu.y) < pu.size * 0.7 + this.player.size * 0.4) {
        this._applyPowerUp(pu);
        this.powerups.splice(m, 1);
      }
    }
  };

  Game.prototype._applyPowerUp = function (pu) {
    if (pu.type === 'gel') {
      this.score += CFG.POWERUP.gelPoints;
      Audio.gel();
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.gelPoints + ' GEL!', P.cyanMid);
      for (var i = 0; i < this.germs.length; i++) {
        this.particles.spawnBurst(this.germs[i].x, this.germs[i].y, P.red, 5);
      }
      this.particles.spawnBurst(pu.x, pu.y, P.cyanMid, 14);
      this.germs.length = 0;
    } else if (pu.type === 'vaccine') {
      this.score += CFG.POWERUP.vaccinePoints;
      Audio.vaccine();
      this.contamination = Math.max(0, this.contamination - CFG.POWERUP.vaccineReduce);
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.vaccinePoints + ' VACINA!', P.yellow);
      this.particles.spawnBurst(pu.x, pu.y, P.yellow, 14);
    }
  };

  // ---- update / render ----
  Game.prototype.update = function (dt) {
    if (this.state !== 'playing' || !this.running) return;
    if (this.phaseChanged) { this.phaseChanged = false; return; }

    this.elapsedTime += dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this._spawnGerm();
      this.spawnTimer = CFG.GERM.spawnRate[this.phase - 1];
    }
    this.gelTimer -= dt;
    if (this.gelTimer <= 0) { this._spawnPowerUp('gel'); this.gelTimer = CFG.POWERUP.gelInterval + U.rand(-3, 3); }
    this.vaccineTimer -= dt;
    if (this.vaccineTimer <= 0) { this._spawnPowerUp('vaccine'); this.vaccineTimer = CFG.POWERUP.vaccineInterval + U.rand(-5, 5); }

    this.player.update(dt, this.input, this.bullets, Audio);
    Bullets.update(this.bullets, dt, CFG.W, CFG.H);

    for (var i = this.germs.length - 1; i >= 0; i--) {
      var g = this.germs[i];
      g.update(dt, this.player, CFG);
      if (g.dead) {
        if (g.escaped) {
          this.contamination = U.clamp(this.contamination + CFG.GERM.escapeContam, 0, CFG.MAX_CONTAM);
          Audio.escape();
          this.particles.spawnBurst(
            U.clamp(g.x, 0, CFG.W), U.clamp(g.y, 0, CFG.H), P.red, 6);
        }
        this.germs.splice(i, 1);
      }
    }

    for (var p = 0; p < this.powerups.length; p++) this.powerups[p].update(dt);

    this._handleCollisions();
    this.particles.update(dt);
    Audio.update(dt);

    if (this.contamination >= CFG.MAX_CONTAM || this.player.health <= 0) {
      this.contamination = CFG.MAX_CONTAM;
      this.gameOver();
      return;
    }
    this._checkPhaseProgression();
  };

  Game.prototype.render = function () {
    var ctx = this.ctx, w = CFG.W, h = CFG.H;
    Background.draw(ctx, w, h, this.phase, this.contamination);

    for (var i = 0; i < this.powerups.length; i++) this.powerups[i].draw(ctx);
    for (var j = 0; j < this.germs.length; j++) this.germs[j].draw(ctx);
    Bullets.draw(ctx, this.bullets);

    if (this.state === 'playing' || this.state === 'phase') this.player.draw(ctx);

    this.particles.draw(ctx);

    if (this.state === 'playing') HUD.draw(ctx, w, h, this._stats());
  };

  Game.prototype.loop = function () {
    var now = performance.now();
    var dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.accumulator += dt;
    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
    }
    this.render();
    requestAnimationFrame(this._boundLoop);
  };

  GH.Game = Game;
})(window.GH = window.GH || {});
