import { Graphics } from 'pixi.js';
import { P } from './config';

/**
 * Rotinas de desenho dos inimigos e coletáveis.
 * Desenham ao redor da origem (0,0); a posição é definida pelo Graphics.
 */
export function drawVirus(g: Graphics, s: number, t: number): void {
  const r = s * 0.45;

  g.circle(0, 0, r * 1.35).fill({ color: P.red, alpha: 0.16 });

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t;
    const sx = Math.cos(a) * r * 1.3;
    const sy = Math.sin(a) * r * 1.3;
    g.circle(sx, sy, r * 0.3).fill(i % 2 === 0 ? P.redDark : P.red);
  }

  g.circle(0, 0, r).fill(P.red);
  g.circle(0, 0, r * 0.65).fill(P.redDark);

  g.circle(-r * 0.3, -r * 0.15, r * 0.28).fill(0xffffff);
  g.circle(r * 0.3, -r * 0.15, r * 0.28).fill(0xffffff);
  g.circle(-r * 0.3, -r * 0.15, r * 0.14).fill(0x1a0a0a);
  g.circle(r * 0.3, -r * 0.15, r * 0.14).fill(0x1a0a0a);
  g.arc(0, r * 0.2, r * 0.2, 0.1, Math.PI - 0.1).stroke({ width: 1.5, color: 0x1a0a0a });
}

export function drawBacteria(g: Graphics, s: number, t: number): void {
  const rx = s * 0.4;
  const ry = s * 0.32;

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + t;
    const px = Math.cos(a) * rx * 1.2;
    const py = Math.sin(a) * ry * 1.2;
    g.moveTo(px * 0.7, py * 0.7);
    g.lineTo(px + Math.cos(a + t * 0.5) * 5, py + Math.sin(a + t * 0.5) * 5);
  }
  g.stroke({ width: 2, color: P.greenDark });

  g.ellipse(0, 0, rx * 1.25, ry * 1.25).fill({ color: P.greenMid, alpha: 0.16 });
  g.ellipse(0, 0, rx, ry).fill(P.greenMid);
  g.ellipse(0, 0, rx * 0.6, ry * 0.6).fill(P.greenDark);

  g.circle(-rx * 0.3, -ry * 0.2, rx * 0.28).fill(0xffffff);
  g.circle(rx * 0.3, -ry * 0.2, rx * 0.28).fill(0xffffff);
  g.circle(-rx * 0.3, -ry * 0.2, rx * 0.14).fill(0x0a1a0a);
  g.circle(rx * 0.3, -ry * 0.2, rx * 0.14).fill(0x0a1a0a);
  g.arc(0, ry * 0.15, rx * 0.15, 0.05, Math.PI - 0.05).stroke({ width: 1.2, color: 0x0a1a0a });
}

export function drawGel(g: Graphics, s: number): void {
  const w = s * 0.55;
  const h = s * 0.7;

  g.roundRect(-w / 2, -h / 2, w, h, 2).fill({ color: P.cyanMid, alpha: 0.25 });
  g.roundRect(-w / 2, -h / 2, w, h, 2).fill(P.cyanMid);
  g.roundRect(-w / 2, -h / 2, w, h * 0.25, 2).fill(P.teal);
  g.rect(-w / 3, -h / 2 + 2, w * 0.2, h * 0.18).fill(P.cyan);
  g.rect(-w * 0.2, -h * 0.1, w * 0.4, h * 0.15).fill(0xffffff);
  g.rect(-w * 0.15, h * 0.05, w * 0.3, h * 0.1).fill(0xffffff);
  g.rect(-w * 0.3, -h * 0.4, w * 0.6, h * 0.15).fill(P.cyanSoft);
  g.rect(-w * 0.12, -h * 0.55, w * 0.24, h * 0.18).fill(P.tealDark);
}

/**
 * O Esporo-Mestre: vírus gigante que pulsa e encara o jogador.
 * lx/ly indicam a direção do olhar (entre -1 e 1) para as pupilas.
 */
export function drawMegaVirus(g: Graphics, s: number, t: number, lx = 0, ly = 0): void {
  const r = s * 0.42;
  const pulse = Math.sin(t * 4) * 0.04 + 1;

  g.circle(0, 0, r * 2).fill({ color: P.red, alpha: 0.07 + Math.sin(t * 5) * 0.025 });

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.3;
    const len = r * (1.35 + Math.sin(t * 3 + i) * 0.25);
    const sx = Math.cos(a) * len;
    const sy = Math.sin(a) * len;
    g.circle(sx, sy, r * (i % 2 === 0 ? 0.34 : 0.26) * pulse).fill(i % 2 === 0 ? P.redDark : P.red);
  }

  g.circle(0, 0, r).fill(P.red);
  g.circle(0, 0, r).stroke({ width: 3, color: P.redDark });

  g.circle(0, 0, r * 0.62).fill(P.redDark);
  g.circle(0, 0, r * 0.34).fill(P.redDeep);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.8;
    g.circle(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.1).fill({ color: 0x7f1d1d, alpha: 0.8 });
  }

  const eyeOff = r * 0.28;
  const eyeY = -r * 0.22;
  const pup = r * 0.16;
  const lookX = Uclamp(lx, -1, 1) * r * 0.1;
  const lookY = Uclamp(ly, -1, 1) * r * 0.1;

  g.circle(-eyeOff, eyeY, r * 0.28).fill(0xffffff);
  g.circle(eyeOff, eyeY, r * 0.28).fill(0xffffff);
  g.circle(-eyeOff + lookX, eyeY + lookY, pup).fill(0x3d0303);
  g.circle(eyeOff + lookX, eyeY + lookY, pup).fill(0x3d0303);
  g.circle(-eyeOff + lookX - pup * 0.3, eyeY + lookY - pup * 0.3, pup * 0.35).fill(0xffffff);
  g.circle(eyeOff + lookX - pup * 0.3, eyeY + lookY - pup * 0.3, pup * 0.35).fill(0xffffff);

  const mouthY = r * 0.35;
  const mouthW = r * 0.42;
  g.arc(0, mouthY, mouthW, 0.15, Math.PI - 0.15).stroke({ width: 2.5, color: 0x3d0303 });
  const teeth = 4;
  for (let i = 0; i < teeth; i++) {
    const tx = -mouthW + ((i + 0.5) * mouthW * 2) / teeth;
    const ty = mouthY + Math.sqrt(Math.max(0, mouthW * mouthW - tx * tx)) * 0.45;
    g.poly([tx - 3, ty, tx + 3, ty, tx, ty + 6]).fill(0xffffff);
  }

  g.circle(0, -r * 0.75, r * 0.16).fill({ color: P.red, alpha: 0.5 });
  g.circle(0, r * 0.95, r * 0.12).fill({ color: P.red, alpha: 0.45 });
}

function Uclamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function drawVaccine(g: Graphics, s: number): void {
  const w = s * 0.5;
  const h = s * 0.6;

  g.roundRect(-w / 2, -h / 2, w, h, 2).fill({ color: P.yellow, alpha: 0.25 });
  g.roundRect(-w / 2, -h / 2, w, h, 2).fill(0xe0f7fa);
  g.roundRect(-w / 2, -h / 2, w, h * 0.2, 2).fill(0xb2ebf2);
  g.rect(-w * 0.15, -h * 0.15, w * 0.3, h * 0.4).fill(P.cyanSoft);
  g.rect(-w * 0.1, -h * 0.55, w * 0.2, h * 0.12).fill(0xbdbdbd);
  g.rect(-w * 0.15, -h * 0.65, w * 0.3, h * 0.12).fill(0x78909c);

  const capW = w * 0.22;
  g.rect(-capW / 2, -h / 2 - 4, capW, 4).fill(P.yellow);
  g.rect(-capW / 2, -h / 2 - 6, capW * 0.6, 4).fill(P.yellow);
}
