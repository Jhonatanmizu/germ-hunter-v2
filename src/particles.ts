import { Container, Graphics, Text } from 'pixi.js';
import { U } from './utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  text?: string;
  node?: Text;
}

/** Sistema de partículas: faíscas + popups de pontuação flutuantes. */
export class ParticleSystem {
  readonly container = new Container();
  private burst = new Graphics();
  private list: Particle[] = [];

  constructor() {
    this.container.addChild(this.burst);
  }

  spawnBurst(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = U.rand(0, Math.PI * 2);
      const sp = U.rand(10, 45);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: U.rand(0.3, 0.8),
        maxLife: 0.8,
        size: U.rand(2, 5),
        color
      });
    }
  }

  spawnPopup(x: number, y: number, text: string, color: number): void {
    const label = new Text({
      text,
      style: {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 7,
        fill: color
      }
    });
    label.anchor.set(0.5, 0.5);
    label.position.set(x, y);
    this.container.addChild(label);
    this.list.push({
      x,
      y,
      vx: 0,
      vy: -20,
      life: 1.0,
      maxLife: 1.0,
      size: 0,
      color,
      text,
      node: label
    });
  }

  update(dt: number): void {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.node) {
        p.vy *= 0.97;
        p.node.alpha = U.clamp(p.life / p.maxLife, 0, 1);
        p.node.position.set(p.x, p.y);
      } else {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
      if (p.life <= 0) {
        if (p.node) {
          this.container.removeChild(p.node);
          p.node.destroy();
        }
        this.list.splice(i, 1);
      }
    }
  }

  render(): void {
    this.burst.clear();
    for (const p of this.list) {
      if (p.node) continue;
      const alpha = U.clamp(p.life / p.maxLife, 0, 1);
      const sz = p.size * (0.5 + alpha * 0.5);
      this.burst.rect(p.x - sz / 2, p.y - sz / 2, sz, sz).fill({ color: p.color, alpha });
    }
  }

  clear(): void {
    for (const p of this.list) {
      if (p.node) {
        this.container.removeChild(p.node);
        p.node.destroy();
      }
    }
    this.list.length = 0;
    this.burst.clear();
  }
}
