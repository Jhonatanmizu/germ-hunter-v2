import { Graphics, FillGradient } from 'pixi.js';
import { P } from './config';
import { U } from './utils';

const bldgColors = [0x1e1e3a, 0x252545, 0x1a1a35, 0x2a2a4a, 0x202038];
const bldgWidths = [22, 16, 28, 18, 14, 24, 20, 26, 15, 30];

function rgbInt(r: number, g: number, b: number): number {
  return ((r | 0) << 16) | ((g | 0) << 8) | (b | 0);
}

let skyTopKey = -1;
let skyBottomKey = -1;
let cachedSky: FillGradient | null = null;

function skyGradient(top: number, bottom: number): FillGradient {
  if (!cachedSky || top !== skyTopKey || bottom !== skyBottomKey) {
    skyTopKey = top;
    skyBottomKey = bottom;
    cachedSky = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: top },
        { offset: 1, color: bottom }
      ]
    });
  }
  return cachedSky;
}

/** Paisagem urbana neon que reage ao nível de contaminação. */
export function drawBackground(g: Graphics, w: number, h: number, contam: number, time: number): void {
  g.clear();

  const c = U.clamp(contam, 0, 100);
  const top = rgbInt(6 + c * 0.18, 12 + c * 0.04, Math.max(0, 32 - c * 0.18));
  const bottom = rgbInt((6 + c * 0.18) * 0.4, (12 + c * 0.04) * 0.3, Math.max(0, (32 - c * 0.18) * 0.4));
  g.rect(0, 0, w, h).fill(skyGradient(top, bottom));

  // piso com grade neon
  const groundY = h * 0.78;
  for (let gx = 0; gx <= w; gx += 24) {
    g.moveTo(gx, groundY);
    g.lineTo(gx, h);
  }
  g.stroke({ width: 1, color: P.cyan, alpha: 0.12 });
  for (let gy = groundY; gy <= h; gy += 8) {
    g.moveTo(0, gy);
    g.lineTo(w, gy);
  }
  g.stroke({ width: 1, color: P.cyan, alpha: 0.12 });

  g.rect(0, groundY, w, h - groundY).fill(P.bgDeep);
  g.rect(0, groundY, w, 1).fill({ color: P.cyan, alpha: 0.5 });

  // prédios
  let bx = 0;
  let i = 0;
  while (bx < w + 20) {
    const bw = bldgWidths[i % bldgWidths.length] + Math.floor(U.detSeed(i * 1.7 + 13) * 7) - 3;
    const bh = Math.floor(U.detSeed(i * 3.1 + 7) * 40) + 22;
    g.rect(bx, groundY - bh, bw, bh).fill(bldgColors[i % bldgColors.length]);
    for (let wy = 0; wy < bh - 6; wy += 7) {
      for (let wx = 2; wx < bw - 3; wx += 7) {
        if (U.detSeed(i * 5 + wx * 0.7 + wy * 1.3) > 0.5) {
          const win = c > 60 ? 0x4a3020 : U.detSeed(i + wx) > 0.5 ? P.cyanMid : 0x3a5080;
          g.rect(bx + wx, groundY - bh + 4 + wy, 4, 4).fill(win);
        }
      }
    }
    bx += bw + Math.floor(U.detSeed(i * 2.3 + 19) * 4) + 1;
    i++;
  }

  // névoa vermelha do Manto Vermelho
  if (c > 30) {
    const pulse = Math.sin(time * 2) * 0.2 + 0.3;
    g.rect(0, 0, w, h).fill({ color: P.red, alpha: (c / 100) * 0.15 * (1 + pulse * 0.5) });
  }

  // vinheta (bordas escurecidas)
  const bands: Array<[number, number]> = [
    [2, 0.3],
    [8, 0.16],
    [16, 0.08]
  ];
  for (const [depth, alpha] of bands) {
    g.rect(0, 0, w, depth).fill({ color: 0x000000, alpha });
    g.rect(0, h - depth, w, depth).fill({ color: 0x000000, alpha });
    g.rect(0, depth, depth, h - depth * 2).fill({ color: 0x000000, alpha });
    g.rect(w - depth, depth, depth, h - depth * 2).fill({ color: 0x000000, alpha });
  }
}
