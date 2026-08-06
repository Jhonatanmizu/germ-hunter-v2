import { Container, Graphics } from 'pixi.js';
import { U } from '../utils';
import { drawGel, drawVaccine } from '../sprites';
import type { CFG } from '../config';

type CfgType = typeof CFG;

export type PowerUpType = 'gel' | 'vaccine';

/** Coletável: álcool em gel ou vacina, flutuando no lugar. */
export class PowerUp {
  readonly g = new Graphics();
  type: PowerUpType;
  size: number;
  x: number;
  y: number;
  bob: number;
  private layer: Container;

  constructor(type: PowerUpType, cfg: CfgType, layer: Container) {
    const margin = 30;
    this.type = type;
    this.size = cfg.GERM.sprite * 0.85;
    this.x = U.rand(margin, cfg.W - margin);
    this.y = U.rand(margin, cfg.H - margin);
    this.bob = U.rand(0, Math.PI * 2);
    this.layer = layer;
    layer.addChild(this.g);
  }

  update(dt: number): void {
    this.bob += dt * 3;
  }

  draw(): void {
    const g = this.g;
    g.clear();
    const glow = Math.sin(U.now() * 3) * 0.15 + 0.85;
    g.alpha = glow;
    g.position.set(this.x, this.y + Math.sin(this.bob) * 3);
    if (this.type === 'gel') drawGel(g, this.size);
    else drawVaccine(g, this.size);
  }

  destroy(): void {
    this.layer.removeChild(this.g);
    this.g.destroy();
  }
}
