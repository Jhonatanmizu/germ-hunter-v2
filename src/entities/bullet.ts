import { Container, Graphics } from 'pixi.js';
import { P } from '../config';

/** Projétil disparado pelo Doutor Juryscleitin. */
export class Bullet {
  readonly g = new Graphics();
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly size: number;
  life: number;
  private layer: Container;

  constructor(
    x: number,
    y: number,
    angle: number,
    speed: number,
    size: number,
    life: number,
    layer: Container
  ) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = size;
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
    g.circle(0, 0, this.size * 2).fill({ color: P.cyan, alpha: 0.2 });
    g.circle(0, 0, this.size).fill(P.cyan);
    g.circle(0, 0, this.size * 0.45).fill(0xffffff);
  }

  destroy(): void {
    this.layer.removeChild(this.g);
    this.g.destroy();
  }
}
