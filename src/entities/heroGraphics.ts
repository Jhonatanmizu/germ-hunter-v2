import { Container, Graphics } from 'pixi.js';
import { U } from '../utils';

const SKIN = 0x5c3a21;
const SKIN_SHADOW = 0x3d2616;
const AFRO_BASE = 0x151515;
const AFRO_HIGH = 0x252525;
const COAT = 0xe8e8e8;
const COAT_SHADOW = 0xc0c0c0;
const SHIRT = 0x07f5f5;
const WEAPON_BODY = 0x444444;
const WEAPON_BARREL = 0x222222;

export interface HeroAnimState {
  time: number;
  now: number;
  bob: number;
  moving: boolean;
  dashing: boolean;
  facingLeft: boolean;
  recoil: number;
  aim: number;
  hitFlash: number;
  invuln: number;
  lowHp: boolean;
  vx: number;
  vy: number;
  scaleX: number;
  scaleY: number;
  baseX: number;
  baseY: number;
}

/**
 * Herói desenhado proceduralmente em PixiJS:
 *  - Homem negro com cabelo black power (afro)
 *  - Jaleco branco de cientista
 *  - Pistola de soro futurista
 *
 * Animações incluídas:
 *  1. Respiração / bobbing idle
 *  2. Piscar de olhos (intervalos aleatórios)
 *  3. Bounce secundário do afro ao correr
 *  4. Squash & stretch do afro durante dash
 *  5. Inclinação da cabeça conforme velocidade
 *  6. Braço oscila ao correr e recua ao atirar
 *  7. Arma acompanha a mira (subtil)
 *  8. Pernas animam ao correr
 *  9. Gota de suor quando HP baixo
 * 10. Olhos fecham brevemente ao tomar dano
 */
export class HeroGraphics extends Container {
  private afro = new Graphics();
  private headGroup = new Container();
  private headBase = new Graphics();
  private eye = new Graphics();
  private torso = new Graphics();
  private armGroup = new Container();
  private arm = new Graphics();
  private weapon = new Graphics();
  private legs = new Graphics();
  private sweat = new Graphics();

  private blinkState = 0;
  private nextBlinkAt = 0;
  private blinkDur = 0.12;

  constructor() {
    super();
    this.headGroup.addChild(this.headBase, this.eye);
    this.armGroup.addChild(this.arm, this.weapon);
    // afro goes BEHIND head so face stays fully visible
    this.addChild(this.legs, this.torso, this.armGroup, this.afro, this.headGroup, this.sweat);
    this.drawBase();
  }

  private drawBase(): void {
    // === AFRO (black power / cloud shape) — sits BEHIND the head ===
    this.afro.clear();
    const ay = -22; // raised higher so it doesn't cover the face
    const puffs = [
      { x: 0, y: ay - 10, r: 10, c: AFRO_BASE },
      { x: -10, y: ay - 6, r: 8, c: AFRO_HIGH },
      { x: 10, y: ay - 6, r: 8, c: AFRO_HIGH },
      { x: -12, y: ay - 2, r: 7, c: AFRO_BASE },
      { x: 12, y: ay - 2, r: 7, c: AFRO_BASE },
      { x: -7, y: ay - 13, r: 8, c: AFRO_BASE },
      { x: 7, y: ay - 13, r: 8, c: AFRO_BASE },
      { x: 0, y: ay + 2, r: 7, c: AFRO_HIGH },
      { x: -9, y: ay, r: 6, c: AFRO_BASE },
      { x: 9, y: ay, r: 6, c: AFRO_BASE },
      { x: -14, y: ay - 7, r: 6, c: AFRO_HIGH },
      { x: 14, y: ay - 7, r: 6, c: AFRO_HIGH },
    ];
    for (const p of puffs) {
      this.afro.circle(p.x, p.y, p.r).fill({ color: p.c });
    }

    // === HEAD (profile facing right) ===
    this.headBase.clear();
    // Skull / back of head (slightly larger)
    this.headBase.circle(-2, -11, 10).fill({ color: SKIN });
    // Face profile via path (enlarged & more defined)
    this.headBase
      .moveTo(2, -18)
      .lineTo(8, -17)
      .lineTo(12, -12) // forehead
      .lineTo(13, -7)  // nose bridge
      .lineTo(14, -3)  // nose tip
      .lineTo(13, 0)   // under nose
      .lineTo(12, 3)   // upper lip
      .lineTo(11, 6)   // chin
      .lineTo(4, 6)    // jaw
      .lineTo(-2, 3)   // back to neck
      .closePath()
      .fill({ color: SKIN });
    // Forehead highlight for depth
    this.headBase
      .moveTo(8, -17)
      .lineTo(12, -12)
      .lineTo(10, -12)
      .lineTo(6, -16)
      .closePath()
      .fill({ color: 0x7a4d2e });
    // Nose shadow
    this.headBase
      .moveTo(13, -7)
      .lineTo(14, -3)
      .lineTo(11, -3)
      .closePath()
      .fill({ color: SKIN_SHADOW });
    // Mouth (determined line)
    this.headBase.moveTo(8, 3).lineTo(11, 3).stroke({ width: 1.2, color: 0x1a0d05 });
    // Ear
    this.headBase.ellipse(-9, -8, 3.5, 4.5).fill({ color: SKIN });
    // Inner ear
    this.headBase.ellipse(-9, -8, 1.5, 2.5).fill({ color: SKIN_SHADOW });
    // Eyebrow (thicker)
    this.headBase.moveTo(3, -15).lineTo(8, -15).stroke({ width: 2, color: 0x0a0a0a });

    this.drawEye(true);

    // === TORSO (lab coat) ===
    this.torso.clear();
    this.torso.rect(-9, -2, 18, 17).fill({ color: COAT });
    this.torso.rect(-10, -1, 5, 15).fill({ color: COAT_SHADOW });
    // Shirt collar
    this.torso.moveTo(-3, -2).lineTo(0, 2).lineTo(3, -2).closePath().fill({ color: SHIRT });
    // Buttons
    this.torso.circle(0, 6, 1).fill({ color: 0x888888 });
    this.torso.circle(0, 10, 1).fill({ color: 0x888888 });

    // === LEGS ===
    this.legs.clear();
    this.legs.rect(-7, 13, 5, 8).fill({ color: COAT_SHADOW });
    this.legs.rect(1, 13, 5, 8).fill({ color: COAT });
    // Shoes
    this.legs.rect(-8, 19, 6, 3).fill({ color: 0x222222 });
    this.legs.rect(0, 19, 6, 3).fill({ color: 0x222222 });

    // === ARM ===
    this.arm.clear();
    // Shoulder / upper arm
    this.arm.rect(-3, 0, 9, 5).fill({ color: SKIN });
    // Forearm
    this.arm.rect(4, -1, 11, 5).fill({ color: SKIN });
    // Hand
    this.arm.circle(16, 1.5, 3.5).fill({ color: SKIN });
    // Thumb
    this.arm.circle(14, 3.5, 1.5).fill({ color: SKIN_SHADOW });

    // === WEAPON ===
    this.weapon.clear();
    this.weapon.position.set(16, 1.5);
    this.weapon.rect(-2, -3, 17, 6).fill({ color: WEAPON_BODY });
    this.weapon.rect(13, -2, 7, 4).fill({ color: WEAPON_BARREL });
    this.weapon.rect(2, -1, 5, 2).fill({ color: SHIRT });
    this.weapon.rect(8, -1, 2, 2).fill({ color: SHIRT });
    this.weapon.circle(6, 0, 2).fill({ color: SHIRT });
  }

  private drawEye(open: boolean): void {
    this.eye.clear();
    if (open) {
      // Bigger sclera
      this.eye.ellipse(7, -12, 4, 4).fill({ color: 0xffffff });
      // Bigger pupil
      this.eye.ellipse(8, -12, 2.4, 2.4).fill({ color: 0x0a0a0a });
      // Reflection dot (top-left)
      this.eye.circle(6.5, -13.5, 1.2).fill({ color: 0xffffff });
      // Smaller reflection dot (bottom-right)
      this.eye.circle(8.8, -11, 0.6).fill({ color: 0xffffff });
      // Upper eyelid line for definition
      this.eye.moveTo(3, -13).lineTo(11, -13).stroke({ width: 1, color: 0x1a0d05 });
    } else {
      // Closed eye with curved eyelid
      this.eye.moveTo(3, -12).lineTo(11, -12).stroke({ width: 2, color: 0x1a0d05 });
    }
  }

  update(state: HeroAnimState): void {
    // Position & squash/stretch
    this.position.set(state.baseX, state.baseY + state.bob);
    this.scale.set(state.facingLeft ? -state.scaleX : state.scaleX, state.scaleY);

    // Tint (damage flash)
    this.tint = state.hitFlash > 0 ? 0xff9a9a : 0xffffff;

    // Blinking
    if (state.now >= this.nextBlinkAt) {
      this.blinkState = state.now;
      this.nextBlinkAt = state.now + this.blinkDur + 1.5 + Math.random() * 4;
    }
    const isBlinking = state.now - this.blinkState < this.blinkDur && state.now >= this.blinkState;
    // Eyes squint when hit
    this.drawEye(!isBlinking && !(state.hitFlash > 0.15));

    // Head lean based on horizontal velocity
    const lean = U.clamp(state.vx * 0.0015, -0.1, 0.1) * (state.facingLeft ? -1 : 1);
    this.headGroup.rotation = lean;

    // Afro secondary animation (bounce + squash)
    const afroLag = state.moving && !state.dashing ? Math.sin(state.time * 11 - 0.4) * 1.5 : 0;
    const afroDashSquash = state.dashing ? -2.5 : 0;
    this.afro.position.y = afroLag + afroDashSquash;
    this.afro.scale.y = state.dashing
      ? 0.82
      : 1 + (state.moving && !state.dashing ? Math.sin(state.time * 11) * 0.03 : 0);
    // Slight afro skew on dash
    this.afro.skew.x = state.dashing ? (state.facingLeft ? -0.15 : 0.15) : 0;

    // Arm recoil & running sway
    const recoilX = -state.recoil * 5;
    const armSway = state.moving && !state.dashing ? Math.sin(state.time * 10) * 1.2 : 0;
    this.armGroup.position.set(recoilX, armSway);

    // Weapon aim tilt (subtle up/down)
    let aimTilt = 0;
    if (!state.dashing) {
      aimTilt = Math.sin(state.aim) * 0.12;
    }
    this.armGroup.rotation = aimTilt;

    // Legs walking bob
    if (state.moving && !state.dashing) {
      const legBob = Math.abs(Math.sin(state.time * 12)) * 1.2;
      this.legs.position.y = legBob;
    } else {
      this.legs.position.y = 0;
    }

    // Low HP sweat drop (forehead area)
    this.sweat.clear();
    if (state.lowHp) {
      const sx = 9;
      const sy = -18 + Math.sin(state.now * 3) * 2;
      this.sweat.circle(sx, sy, 1.4).fill({ color: 0x88ccff });
      this.sweat.moveTo(sx, sy - 2).lineTo(sx - 0.5, sy + 2.5).stroke({ width: 0.9, color: 0x88ccff });
    }

    // Dash wind / speed lines on weapon (subtle)
    if (state.dashing) {
      this.weapon.alpha = 0.9 + Math.sin(state.now * 40) * 0.1;
    } else {
      this.weapon.alpha = 1;
    }
  }
}
