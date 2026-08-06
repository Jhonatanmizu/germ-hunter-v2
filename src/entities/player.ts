import { Container, Graphics, Sprite } from 'pixi.js';
import type { InputManager } from '../input';
import type { AudioSystem } from '../audio';
import { Bullet } from './bullet';
import { getCharacterTexture } from '../assets';
import { P } from '../config';
import { U } from '../utils';
import type { CFG } from '../config';

type CfgType = typeof CFG;

const SPRITE_W = 129;
const SPRITE_H = 80;
const BODY_ANCHOR_X = 49 / SPRITE_W;

/** O herói: Doutor Juryscleitin. Movimento, mira, disparo e vida. */
export class Player {
  readonly view = new Container();
  private sprite: Sprite;
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

  constructor(cfg: CfgType, layer: Container, private bulletLayer: Container) {
    this.cfg = cfg;
    this.sprite = new Sprite(getCharacterTexture());
    this.sprite.anchor.set(BODY_ANCHOR_X, 0.5);
    this.view.addChild(this.aimLine, this.sprite, this.muzzle);
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
  }

  update(dt: number, input: InputManager, bullets: Bullet[], audio: AudioSystem): void {
    const C = this.cfg;
    const move = input.movement();
    this.vx = move.x * this.speed;
    this.vy = move.y * this.speed;
    this.x = U.clamp(this.x + this.vx * dt, this.size * 0.5, C.W - this.size * 0.5);
    this.y = U.clamp(this.y + this.vy * dt, this.size * 0.5, C.H - this.size * 0.5);
    this.moving = move.x !== 0 || move.y !== 0;

    this.aim = U.angle(this.x, this.y, input.mouse.x, input.mouse.y);
    this.facingLeft = input.mouse.x < this.x;

    if (this.moving) {
      this.animTime += dt;
      this.bob = Math.sin(this.animTime * 14) * 1.5;
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
  }

  private fire(bullets: Bullet[], audio: AudioSystem): void {
    const C = this.cfg;
    const muzzleDist = this.size * 0.55;
    const bx = this.x + Math.cos(this.aim) * muzzleDist;
    const by = this.y + Math.sin(this.aim) * muzzleDist;
    bullets.push(new Bullet(bx, by, this.aim, C.PLAYER.bulletSpeed, C.BULLET.size, C.BULLET.life, this.bulletLayer));
    this.muzzleFlash = 0.07;
    audio.shoot();
  }

  takeHit(audio: AudioSystem): boolean {
    if (this.invuln > 0) return false;
    this.health--;
    this.invuln = this.cfg.PLAYER.invulnTime;
    audio.hit();
    return true;
  }

  draw(): void {
    const scale = (this.size * 1.15) / SPRITE_H;
    this.sprite.scale.set(this.facingLeft ? -scale : scale, scale);
    this.sprite.position.set(this.x, this.y + this.bob);

    const blink = this.invuln > 0 && Math.floor(U.now() * 12) % 2 === 0;
    this.sprite.visible = !blink;

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
