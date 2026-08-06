import { Container, Graphics } from 'pixi.js';
import type { Player } from './player';
import type { GermKind } from '../config';
import { U } from '../utils';
import { P } from '../config';
import { drawVirus, drawBacteria, drawMegaVirus } from '../sprites';
import type { CFG } from '../config';
import { EnemyShot, type ShotType } from './enemyShot';

type CfgType = typeof CFG;

/** Germe que surge nas bordas e ruma em direção ao jogador. Vários arquétipos. */
export class Germ {
  readonly g = new Graphics();
  kind: GermKind;
  size: number;
  radius: number;
  hp: number;
  points: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dead = false;
  escaped = false;
  flash = 0;
  private fireTimer = 0;
  private layer: Container;
  private shotLayer: Container;
  private speedMul: number;

  constructor(kind: GermKind, phase: number, cfg: CfgType, layer: Container, shotLayer: Container, speedMul = 1) {
    this.kind = kind;
    this.speedMul = speedMul;
    this.layer = layer;
    this.shotLayer = shotLayer;

    const base = kind === 'virus' || kind === 'bacteria' ? cfg.GERM.sprite : cfg.ENEMY[kind].size;
    this.size = kind === 'bacteria' ? base * 0.9 : base;
    this.radius = this.size * 0.5;

    if (kind === 'virus') this.points = cfg.GERM.virusPoints;
    else if (kind === 'bacteria') this.points = cfg.GERM.bacteriaPoints;
    else this.points = cfg.ENEMY[kind].points;
    this.hp = kind === 'virus' || kind === 'bacteria' ? 1 : cfg.ENEMY[kind].hp;

    const edge = U.randInt(0, 3);
    if (edge === 0) {
      this.x = U.rand(0, cfg.W);
      this.y = -this.size;
    } else if (edge === 1) {
      this.x = cfg.W + this.size;
      this.y = U.rand(0, cfg.H);
    } else if (edge === 2) {
      this.x = U.rand(0, cfg.W);
      this.y = cfg.H + this.size;
    } else {
      this.x = -this.size;
      this.y = U.rand(0, cfg.H);
    }

    const pi = Math.min(phase - 1, 2);
    const aim = U.angle(this.x, this.y, cfg.W / 2, cfg.H / 2);
    if (kind === 'charger') {
      const sp = cfg.ENEMY.charger.speed * speedMul * U.rand(0.9, 1.1);
      this.vx = Math.cos(aim) * sp;
      this.vy = Math.sin(aim) * sp;
    } else if (kind === 'virus') {
      const sp = cfg.GERM.virusSpeed[pi] * speedMul;
      const a = aim + U.rand(-0.6, 0.6);
      this.vx = Math.cos(a) * sp;
      this.vy = Math.sin(a) * sp;
    } else if (kind === 'spitter') {
      const sp = cfg.ENEMY.spitter.speed * speedMul;
      this.vx = Math.cos(aim) * sp;
      this.vy = Math.sin(aim) * sp;
    } else {
      const sp =
        (kind === 'bacteria' ? cfg.GERM.bacteriaSpeed[pi] : cfg.ENEMY.elite.speed * speedMul) * U.rand(0.9, 1.1);
      const a = aim + U.rand(-0.4, 0.4);
      this.vx = Math.cos(a) * sp;
      this.vy = Math.sin(a) * sp;
    }

    layer.addChild(this.g);
  }

  private fire(angle: number, type: ShotType, speed: number, size: number): void {
    new EnemyShot(type, this.x, this.y, angle, speed, size, 6, this.shotLayer);
  }

  update(dt: number, player: Player, cfg: CfgType): void {
    this.flash = Math.max(0, this.flash - dt);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d;
    const ny = dy / d;

    if (this.kind === 'charger') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else if (this.kind === 'spitter') {
      const keep = 120;
      const want = d > keep ? 1 : -0.7;
      const sp = cfg.ENEMY.spitter.speed * this.speedMul;
      this.vx = nx * sp * want;
      this.vy = ny * sp * want;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fire(U.angle(this.x, this.y, player.x, player.y), 'bacteria', cfg.ENEMY.spitter.fireSpeed, 9);
        this.fireTimer = cfg.ENEMY.spitter.fireRate * U.rand(0.8, 1.2);
      }
    } else if (this.kind === 'elite') {
      const sp = cfg.ENEMY.elite.speed * this.speedMul;
      this.vx = nx * sp;
      this.vy = ny * sp;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        const n = cfg.ENEMY.elite.ringCount;
        for (let i = 0; i < n; i++) {
          this.fire((i / n) * Math.PI * 2, 'virus', 85, 10);
        }
        this.fireTimer = cfg.ENEMY.elite.fireRate;
      }
    } else {
      const homing = 18;
      this.vx = U.lerp(this.vx, nx * homing * 2, 0.02);
      this.vy = U.lerp(this.vy, ny * homing * 2, 0.02);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (
      this.x < -this.size * 1.5 ||
      this.x > cfg.W + this.size * 1.5 ||
      this.y < -this.size * 1.5 ||
      this.y > cfg.H + this.size * 1.5
    ) {
      this.dead = true;
      this.escaped = true;
    }
  }

  /** Aplica dano. Retorna true se morreu. */
  hit(damage: number): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    this.flash = 0.1;
    return false;
  }

  draw(): void {
    const g = this.g;
    const now = U.now();
    g.clear();
    g.position.set(this.x, this.y);
    if (this.kind === 'virus') {
      drawVirus(g, this.size, now);
    } else if (this.kind === 'bacteria') {
      drawBacteria(g, this.size, now);
    } else if (this.kind === 'charger') {
      const d = Math.hypot(this.vx, this.vy) || 1;
      const nvx = this.vx / d;
      const nvy = this.vy / d;
      g.moveTo(0, 0);
      g.lineTo(-nvx * this.size * 1.3, -nvy * this.size * 1.3);
      g.stroke({ width: 5, color: P.red, alpha: 0.55 });
      g.moveTo(0, 0);
      g.lineTo(-nvx * this.size * 2.1, -nvy * this.size * 2.1);
      g.stroke({ width: 3, color: P.red, alpha: 0.3 });
      drawVirus(g, this.size, now);
    } else if (this.kind === 'spitter') {
      const pulse = Math.sin(now * 5) * 0.12 + 1;
      g.circle(0, 0, this.size * 0.75 * pulse).fill({ color: P.greenMid, alpha: 0.15 });
      drawBacteria(g, this.size, now);
    } else {
      drawMegaVirus(g, this.size, now, 0, 0);
    }

    if (this.flash > 0) {
      const alpha = (this.flash / 0.1) * 0.6;
      g.circle(0, 0, this.size * 0.55).fill({ color: 0xffffff, alpha });
    }
  }

  destroy(): void {
    this.layer.removeChild(this.g);
    this.g.destroy();
  }
}
