import { Container, Graphics } from 'pixi.js';
import type { InputManager } from '../input';
import type { AudioSystem } from '../audio';
import { Bullet } from './bullet';
import { HeroGraphics } from './heroGraphics';
import { P } from '../config';
import { U } from '../utils';
import type { CFG } from '../config';

type CfgType = typeof CFG;

const HERO_H = 48;

/**
 * O herói: Doutor Juryscleitin.
 * Desenhado proceduralmente em PixiJS — homem negro com cabelo black power (afro),
 * jaleco de cientista e pistola de soro.
 * Animações: piscar, bounce do afro, recuo do braço, inclinação da cabeça,
 * pernas ao correr, gota de suor com HP baixo e squint ao tomar dano.
 */
export class Player {
  readonly view = new Container();
  private hero: HeroGraphics;
  private shadow = new Graphics();
  private glow = new Graphics();
  private dashFx = new Graphics();
  private aimLine = new Graphics();
  private muzzle = new Graphics();
  private cfg: CfgType;

  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  size = 0;
  speed = 0;
  health = 0;
  maxHealth = 0;
  invuln = 0;
  fireTimer = 0;
  aim = 0;
  facingLeft = false;
  animTime = 0;
  bob = 0;
  moving = false;
  muzzleFlash = 0;
  recoil = 0;
  hitFlash = 0;
  dashT = 0;
  dashCd = 0;
  dashStarted = false;
  private dashDirX = 1;
  private dashDirY = 0;

  constructor(cfg: CfgType, layer: Container, private bulletLayer: Container) {
    this.cfg = cfg;
    this.hero = new HeroGraphics();
    this.view.addChild(this.shadow, this.glow, this.dashFx, this.aimLine, this.hero, this.muzzle);
    layer.addChild(this.view);
    this.reset();
  }

  reset(): void {
    const C = this.cfg;
    this.x = C.W / 2;
    this.y = C.H * 0.62;
    this.vx = 0;
    this.vy = 0;
    this.size = C.PLAYER.size;
    this.speed = C.PLAYER.speed;
    this.health = C.PLAYER.maxHealth;
    this.maxHealth = C.PLAYER.maxHealth;
    this.invuln = 0;
    this.fireTimer = 0;
    this.aim = 0;
    this.facingLeft = false;
    this.animTime = 0;
    this.bob = 0;
    this.moving = false;
    this.muzzleFlash = 0;
    this.recoil = 0;
    this.hitFlash = 0;
    this.dashT = 0;
    this.dashCd = 0;
    this.dashStarted = false;
  }

  /** 0 = pronta, 1 = carregando. */
  dashRatio(): number {
    return U.clamp(this.dashCd / this.cfg.PLAYER.dashCooldown, 0, 1);
  }

  update(dt: number, input: InputManager, bullets: Bullet[], audio: AudioSystem): void {
    const C = this.cfg;
    this.dashStarted = false;

    if (this.dashT > 0) {
      this.dashT -= dt;
      this.x = U.clamp(this.x + this.dashDirX * C.PLAYER.dashSpeed * dt, this.size * 0.5, C.W - this.size * 0.5);
      this.y = U.clamp(this.y + this.dashDirY * C.PLAYER.dashSpeed * dt, this.size * 0.5, C.H - this.size * 0.5);
      this.invuln = Math.max(this.invuln, 0.02);
      this.vx = this.dashDirX * C.PLAYER.dashSpeed;
      this.vy = this.dashDirY * C.PLAYER.dashSpeed;
    } else {
      const move = input.movement();
      this.vx = move.x * this.speed;
      this.vy = move.y * this.speed;
      this.x = U.clamp(this.x + this.vx * dt, this.size * 0.5, C.W - this.size * 0.5);
      this.y = U.clamp(this.y + this.vy * dt, this.size * 0.5, C.H - this.size * 0.5);

      if (this.dashCd <= 0 && input.consumeDash()) {
        this.dashT = C.PLAYER.dashTime;
        this.dashCd = C.PLAYER.dashCooldown;
        this.dashStarted = true;
        const move2 = input.movement();
        if (move2.x !== 0 || move2.y !== 0) {
          const d = Math.hypot(move2.x, move2.y) || 1;
          this.dashDirX = move2.x / d;
          this.dashDirY = move2.y / d;
        } else {
          this.dashDirX = Math.cos(this.aim);
          this.dashDirY = Math.sin(this.aim);
        }
        this.invuln = Math.max(this.invuln, C.PLAYER.dashTime + 0.05);
        audio.dash();
      }
    }
    this.dashCd = Math.max(0, this.dashCd - dt);

    this.moving = this.dashT > 0 || this.vx !== 0 || this.vy !== 0;
    this.aim = U.angle(this.x, this.y, input.mouse.x, input.mouse.y);
    this.facingLeft = input.mouse.x < this.x;

    if (this.moving && this.dashT <= 0) {
      this.animTime += dt;
      this.bob = Math.sin(this.animTime * 13) * 2.2;
    } else if (this.dashT > 0) {
      this.animTime += dt;
      this.bob = 0;
    } else {
      this.animTime = 0;
      this.bob = 0;
    }

    this.fireTimer -= dt;
    const wantFire = input.isShootHeld() || input.consumeFire();
    if (wantFire && this.fireTimer <= 0) {
      this.fire(bullets, audio);
      this.fireTimer = C.PLAYER.fireRate;
    }
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (this.invuln > 0) this.invuln -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 6);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
  }

  private fire(bullets: Bullet[], audio: AudioSystem): void {
    const C = this.cfg;
    const muzzleDist = this.size * 0.55;
    const bx = this.x + Math.cos(this.aim) * muzzleDist;
    const by = this.y + Math.sin(this.aim) * muzzleDist;
    bullets.push(new Bullet(bx, by, this.aim, C.PLAYER.bulletSpeed, C.BULLET.size, C.BULLET.life, this.bulletLayer));
    this.muzzleFlash = 0.07;
    this.recoil = 1;
    audio.shoot();
  }

  takeHit(audio: AudioSystem): boolean {
    if (this.invuln > 0) return false;
    this.health--;
    this.invuln = this.cfg.PLAYER.invulnTime;
    this.hitFlash = 0.25;
    audio.hit();
    return true;
  }

  draw(): void {
    const now = U.now();
    const scale = (this.size * 1.15) / HERO_H;
    const bobPhase = this.animTime * 13;
    const dashing = this.dashT > 0;

    // sombra no chão (encolhe quando o herói sobe no pulo da corrida)
    this.shadow.clear();
    const rise = Math.max(0, Math.sin(bobPhase));
    const shScale = this.moving && !dashing ? 1 - rise * 0.16 : 1;
    this.shadow.position.set(this.x, this.y + this.size * 0.62);
    this.shadow.ellipse(0, 0, this.size * 0.34 * shScale, this.size * 0.11 * shScale).fill({
      color: 0x000000,
      alpha: 0.35
    });

    // aura de energia
    this.glow.clear();
    const lowHp = this.health <= 1;
    const invulnPulse = this.invuln > 0 ? Math.sin(now * 18) * 0.5 + 0.5 : 0;
    const auraBase = lowHp ? 0.1 : 0.05;
    const auraR = this.size * (0.78 + Math.sin(now * 3) * 0.06 + invulnPulse * 0.12);
    this.glow.position.set(this.x, this.y);
    this.glow.circle(0, 0, auraR).fill({ color: lowHp ? P.red : P.cyan, alpha: auraBase + invulnPulse * 0.14 });

    // rastro do dash
    this.dashFx.clear();
    if (dashing) {
      const t = 1 - this.dashT / this.cfg.PLAYER.dashTime;
      const tail = this.size * (0.6 + t * 1.2);
      this.dashFx.position.set(this.x, this.y);
      this.dashFx.moveTo(0, 0);
      this.dashFx.lineTo(-this.dashDirX * tail, -this.dashDirY * tail);
      this.dashFx.stroke({ width: 6, color: P.cyan, alpha: 0.7 * (1 - t * 0.5) });
    }

    // squash & stretch
    let sx = scale;
    let sy = scale;
    if (dashing) {
      sx *= 1.12;
      sy *= 0.9;
    } else if (this.moving) {
      const impact = Math.max(0, -Math.sin(bobPhase));
      const stretch = Math.max(0, Math.sin(bobPhase));
      sx *= 1 + impact * 0.09 - stretch * 0.05;
      sy *= 1 - impact * 0.1 + stretch * 0.07;
    } else {
      const br = Math.sin(now * 3);
      sx *= 1 + br * 0.015;
      sy *= 1 - br * 0.015;
    }

    const rx = -Math.cos(this.aim) * this.recoil * 5;
    const ry = -Math.sin(this.aim) * this.recoil * 5;

    const blink = this.invuln > 0 && !dashing && Math.floor(now * 12) % 2 === 0;
    this.hero.visible = !blink;

    this.hero.update({
      time: this.animTime,
      now,
      bob: this.bob,
      moving: this.moving,
      dashing,
      facingLeft: this.facingLeft,
      recoil: this.recoil,
      aim: this.aim,
      hitFlash: this.hitFlash,
      invuln: this.invuln,
      lowHp,
      vx: this.vx,
      vy: this.vy,
      scaleX: sx,
      scaleY: sy,
      baseX: this.x + rx,
      baseY: this.y + ry
    });

    const len = 60;
    this.aimLine.clear();
    this.aimLine.position.set(this.x, this.y);
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * len;
      const b = a + (len / steps) * 0.6;
      this.aimLine.moveTo(Math.cos(this.aim) * a, Math.sin(this.aim) * a);
      this.aimLine.lineTo(Math.cos(this.aim) * b, Math.sin(this.aim) * b);
    }
    this.aimLine.stroke({ width: 1, color: P.cyan, alpha: 0.25 });

    this.muzzle.clear();
    if (this.muzzleFlash > 0) {
      const alpha = this.muzzleFlash / 0.07;
      const mx = this.x + Math.cos(this.aim) * this.size * 0.6;
      const my = this.y + Math.sin(this.aim) * this.size * 0.6;
      this.muzzle.position.set(mx, my);
      this.muzzle.circle(0, 0, 7).fill({ color: P.cyan, alpha: alpha * 0.35 });
      this.muzzle.circle(0, 0, 4).fill({ color: P.cyan, alpha });
    }
  }
}
