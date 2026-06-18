/* global window */
(function (GH) {
  'use strict';

  var P = GH.PALETTE;
  var U = GH.Utils;
  var Assets = GH.Assets;

  /**
   * Player: the Germ Hunter. Movement, aiming, shooting, health, sprite anim.
   * Single responsibility: own player state + rendering of the hero.
   */
  function Player(cfg) {
    this.cfg = cfg;
    this.reset();
  }

  Player.prototype.reset = function () {
    var C = this.cfg;
    this.x = C.W / 2;
    this.y = C.H * 0.62;
    this.vx = 0; this.vy = 0;
    this.size = C.PLAYER.size;
    this.speed = C.PLAYER.speed;
    this.health = C.PLAYER.maxHealth;
    this.maxHealth = C.PLAYER.maxHealth;
    this.invuln = 0;
    this.fireTimer = 0;
    this.aim = 0;
    this.facingLeft = false;
    this.frame = 0;
    this.animTime = 0;
    this.moving = false;
    this.muzzle = 0;
  };

  Player.prototype.update = function (dt, input, bullets, audio) {
    var C = this.cfg;
    var move = input.movement();
    this.vx = move.x * this.speed;
    this.vy = move.y * this.speed;
    this.x = U.clamp(this.x + this.vx * dt, this.size * 0.5, C.W - this.size * 0.5);
    this.y = U.clamp(this.y + this.vy * dt, this.size * 0.5, C.H - this.size * 0.5);
    this.moving = (move.x !== 0 || move.y !== 0);

    // aim toward mouse
    this.aim = U.angle(this.x, this.y, input.mouse.x, input.mouse.y);
    this.facingLeft = input.mouse.x < this.x;

    // walk animation
    if (this.moving) {
      this.animTime += dt;
      if (this.animTime > 0.14) { this.frame = this.frame ? 0 : 1; this.animTime = 0; }
    } else {
      this.frame = 0; this.animTime = 0;
    }

    // shooting
    this.fireTimer -= dt;
    var wantFire = input.isShootHeld() || input.consumeFire();
    if (wantFire && this.fireTimer <= 0) {
      this._fire(bullets, audio);
      this.fireTimer = C.PLAYER.fireRate;
    }
    if (this.muzzle > 0) this.muzzle -= dt;

    if (this.invuln > 0) this.invuln -= dt;
  };

  Player.prototype._fire = function (bullets, audio) {
    var C = this.cfg;
    var muzzleDist = this.size * 0.55;
    var bx = this.x + Math.cos(this.aim) * muzzleDist;
    var by = this.y + Math.sin(this.aim) * muzzleDist;
    bullets.push({
      x: bx, y: by,
      vx: Math.cos(this.aim) * C.PLAYER.bulletSpeed,
      vy: Math.sin(this.aim) * C.PLAYER.bulletSpeed,
      size: C.BULLET.size, life: C.BULLET.life
    });
    this.muzzle = 0.07;
    audio.shoot();
  };

  Player.prototype.takeHit = function (audio) {
    if (this.invuln > 0) return false;
    this.health--;
    this.invuln = this.cfg.PLAYER.invulnTime;
    audio.hit();
    return true;
  };

  Player.prototype.draw = function (ctx) {
    // aim line + muzzle
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = P.cyan;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + Math.cos(this.aim) * 60, this.y + Math.sin(this.aim) * 60);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // character sprite (blink when invulnerable)
    var blink = this.invuln > 0 && Math.floor(U.now() * 12) % 2 === 0;
    if (!blink) {
      Assets.drawFrame(ctx, this.frame, this.x, this.y, this.size * 1.15, this.facingLeft);
    }

    // muzzle flash
    if (this.muzzle > 0) {
      var mx = this.x + Math.cos(this.aim) * this.size * 0.6;
      var my = this.y + Math.sin(this.aim) * this.size * 0.6;
      ctx.save();
      ctx.globalAlpha = this.muzzle / 0.07;
      ctx.fillStyle = P.cyan;
      ctx.shadowColor = P.cyan; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  };

  GH.Player = Player;
})(window.GH = window.GH || {});
