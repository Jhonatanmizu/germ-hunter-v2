import { Container, Graphics } from 'pixi.js';
import type { Player } from './player';
import { U } from '../utils';
import { drawVirus, drawBacteria } from '../sprites';
import type { CFG } from '../config';

type CfgType = typeof CFG;

export type GermType = 'virus' | 'bacteria';

/** Germe que surge nas bordas e ruma em direção ao jogador. */
export class Germ {
  readonly g = new Graphics();
  type: GermType;
  size: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dead = false;
  escaped = false;
  private layer: Container;

  constructor(type: GermType, phase: number, cfg: CfgType, layer: Container) {
    this.type = type;
    this.size = type === 'bacteria' ? cfg.GERM.sprite * 0.9 : cfg.GERM.sprite;
    this.radius = this.size * 0.5;

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

    const speed = type === 'bacteria' ? cfg.GERM.bacteriaSpeed[phase - 1] : cfg.GERM.virusSpeed[phase - 1];
    const a = U.angle(this.x, this.y, cfg.W / 2, cfg.H / 2) + U.rand(-0.6, 0.6);
    this.vx = Math.cos(a) * speed;
    this.vy = Math.sin(a) * speed;

    this.layer = layer;
    layer.addChild(this.g);
  }

  update(dt: number, player: Player, cfg: CfgType): void {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const homing = 18;
    this.vx = U.lerp(this.vx, (dx / d) * homing * 2, 0.02);
    this.vy = U.lerp(this.vy, (dy / d) * homing * 2, 0.02);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

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

  draw(): void {
    const g = this.g;
    g.clear();
    g.position.set(this.x, this.y);
    if (this.type === 'virus') drawVirus(g, this.size, U.now());
    else drawBacteria(g, this.size, U.now());
  }

  destroy(): void {
    this.layer.removeChild(this.g);
    this.g.destroy();
  }
}
