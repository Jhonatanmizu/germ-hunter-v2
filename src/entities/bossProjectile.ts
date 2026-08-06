import { Container, Graphics } from 'pixi.js';
import { U } from '../utils';
import { drawVirus, drawBacteria } from '../sprites';

export type BossProjectileType = 'virus' | 'bacteria';

/** Projétil disparado pelo Esporo-Mestre. Pode ser destruído pelo soro do jogador. */
export class BossProjectile {
  readonly g = new Graphics();
  type: BossProjectileType;
  size: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  private layer: Container;

  constructor(
    type: BossProjectileType,
    x: number,
    y: number,
    angle: number,
    speed: number,
    size: number,
    life: number,
    layer: Container
  ) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = size;
    this.radius = size * 0.5;
    this.life = life;
    this.layer = layer;
    layer.addChild(this.g);
  }

  /** Retorna true quando o projétil deve ser removido. */
  update(dt: number, w: number, h: number): boolean {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life <= 0 || this.x < -10 || this.x > w + 10 || this.y < -10 || this.y > h + 10;
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
