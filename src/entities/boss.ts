import { Container, Graphics } from 'pixi.js';
import type { Player } from './player';
import type { BossProjectileType } from './bossProjectile';
import { U } from '../utils';
import { P } from '../config';
import { drawMegaVirus } from '../sprites';
import type { CFG } from '../config';

type CfgType = typeof CFG;

interface PendingShot {
  type: BossProjectileType;
  x: number;
  y: number;
  angle: number;
  speed: number;
}

/** O Esporo-Mestre: chefe da Fase 3. */
export class Boss {
  readonly g = new Graphics();
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  radius: number;
  stage = 1;
  dead = false;
  stageChanged = false;
  readonly pendingProjectiles: PendingShot[] = [];
  pendingMinions = 0;
  lookX = 0;
  lookY = 0;

  private layer: Container;
  private cfg: CfgType;
  private baseY: number;
  private enterT = 0;
  private readonly enterDur = 1.3;
  private moveT = 0;
  private phaseT = 0;
  private attackTimer = 1.6;
  private hitFlash = 0;
  private deathT = 0;
  private charging = false;
  private chargeDir = 1;
  private chargeSpeed = 0;

  constructor(cfg: CfgType, layer: Container) {
    this.cfg = cfg;
    this.layer = layer;
    this.maxHp = cfg.BOSS.maxHp;
    this.hp = cfg.BOSS.maxHp;
    this.radius = cfg.BOSS.size * 0.42;
    this.x = cfg.W / 2;
    this.y = -cfg.BOSS.size * 0.6;
    this.baseY = cfg.BOSS.y;
    layer.addChild(this.g);
  }

  update(dt: number, player: Player, cfg: CfgType): void {
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.phaseT += dt;
    this.enterT += dt;

    const k = U.clamp(this.enterT / this.enterDur, 0, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    this.y = U.lerp(-cfg.BOSS.size * 0.6, this.baseY, ease);

    if (this.dead) {
      this.deathT += dt;
      return;
    }
    if (k < 1) return;

    this.moveT += dt;
    const sweep = Math.sin(this.moveT * (0.7 + this.stage * 0.25)) * (cfg.W * 0.3 + this.stage * 24);

    if (this.charging) {
      this.x += this.chargeDir * this.chargeSpeed * dt;
      if (this.x < 24 || this.x > cfg.W - 24) this.charging = false;
    } else {
      this.x = U.clamp(cfg.W / 2 + sweep, 24, cfg.W - 24);
      this.y = this.baseY + Math.sin(this.moveT * 1.3) * 8;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.lookX = U.clamp(dx / d, -1, 1);
    this.lookY = U.clamp(dy / d, -1, 1);

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attack(cfg, player);
      this.attackTimer = cfg.BOSS.attackInterval[this.stage - 1] * U.rand(0.8, 1.2);
    }
  }

  private attack(cfg: CfgType, player: Player): void {
    const stage = this.stage;
    const roll = Math.random();
    if (roll < 0.45) this.spreadAttack(cfg, player);
    else if (roll < 0.75) this.ringAttack(cfg);
    else if (roll < 0.85) this.minionAttack(cfg);
    else if (stage >= 2) this.chargeAttack(cfg, player);
    else this.spreadAttack(cfg, player);
  }

  private spreadAttack(cfg: CfgType, player: Player): void {
    const n = cfg.BOSS.spreadCount[this.stage - 1];
    const base = U.angle(this.x, this.y, player.x, player.y);
    const spread = 0.5;
    for (let i = 0; i < n; i++) {
      const a = base + (i / (n - 1) - 0.5) * spread;
      this.pendingProjectiles.push({
        type: 'bacteria',
        x: this.x,
        y: this.y,
        angle: a,
        speed: cfg.BOSS.projectileSpeed[this.stage - 1] * U.rand(0.9, 1.1)
      });
    }
  }

  private ringAttack(cfg: CfgType): void {
    const n = cfg.BOSS.ringCount[this.stage - 1];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.moveT * 0.5;
      this.pendingProjectiles.push({
        type: 'virus',
        x: this.x,
        y: this.y,
        angle: a,
        speed: cfg.BOSS.projectileSpeed[this.stage - 1]
      });
    }
  }

  private minionAttack(cfg: CfgType): void {
    this.pendingMinions = cfg.BOSS.minionCount[this.stage - 1];
  }

  private chargeAttack(cfg: CfgType, player: Player): void {
    this.charging = true;
    this.chargeDir = player.x < this.x ? -1 : 1;
    this.chargeSpeed = cfg.BOSS.chargeSpeed;
  }

  /** Aplica dano. Retorna true se foi um acerto válido. */
  takeHit(damage: number): boolean {
    if (this.dead) return false;
    this.hp -= damage;
    this.hitFlash = 0.08;
    const prev = this.stage;
    if (this.hp <= this.maxHp * (2 / 3)) this.stage = Math.max(this.stage, 2);
    if (this.hp <= this.maxHp * (1 / 3)) this.stage = 3;
    this.stageChanged = this.stage !== prev;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return true;
  }

  draw(): void {
    const g = this.g;
    g.clear();
    if (this.dead) {
      const a = U.clamp(1 - this.deathT * 1.6, 0, 1);
      if (a <= 0) {
        g.alpha = 0;
        return;
      }
      g.alpha = a;
    } else {
      g.alpha = 1;
    }
    g.position.set(this.x, this.y);
    drawMegaVirus(g, this.cfg.BOSS.size, this.phaseT, this.lookX, this.lookY);
    if (this.hitFlash > 0) {
      const alpha = (this.hitFlash / 0.08) * 0.45;
      g.circle(0, 0, this.radius).fill({ color: P.red, alpha });
    }
  }

  destroy(): void {
    this.layer.removeChild(this.g);
    this.g.destroy();
  }
}
