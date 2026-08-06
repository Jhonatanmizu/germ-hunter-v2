import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import { P } from './config';
import { U } from './utils';

export interface GameStats {
  score: number;
  germsEliminated: number;
  phase: number;
  elapsedTime: number;
  contamination: number;
  health: number;
  maxHealth: number;
}

const FONT = '"Press Start 2P", monospace';
const PHASE_COLORS = [P.cyan, P.green, P.yellow];

/** HUD: fase, pontuação, tempo, barra de contaminação e corações de vida. */
export class HUD {
  readonly container = new Container();
  private bg = new Graphics();
  private bar = new Graphics();
  private hearts = new Graphics();
  private phaseText: Text;
  private scoreText: Text;
  private timeText: Text;
  private pctText: Text;
  private barGradient: FillGradient;

  constructor(private w: number, private h: number) {
    this.phaseText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 8, fill: P.cyan }
    });
    this.scoreText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 8, fill: P.text }
    });
    this.timeText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 8, fill: P.textDim }
    });
    this.pctText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 6, fill: P.text }
    });

    this.phaseText.anchor.set(0, 0.5);
    this.scoreText.anchor.set(0, 0.5);
    this.timeText.anchor.set(1, 0.5);
    this.pctText.anchor.set(0.5, 0.5);

    this.barGradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      colorStops: [
        { offset: 0, color: P.yellow },
        { offset: 0.5, color: 0xff8a00 },
        { offset: 1, color: P.red }
      ]
    });

    this.container.addChild(this.bg, this.bar, this.hearts, this.phaseText, this.scoreText, this.timeText, this.pctText);
  }

  draw(stats: GameStats): void {
    const w = this.w;
    const h = this.h;

    this.bg.clear();
    this.bg.rect(0, 0, w, 30).fill({ color: P.bgDeep, alpha: 0.78 });
    this.bg.rect(0, 30, w, 1).fill({ color: P.cyan, alpha: 0.5 });

    this.phaseText.text = 'F' + stats.phase;
    this.phaseText.style.fill = PHASE_COLORS[stats.phase - 1] ?? P.cyan;
    this.phaseText.position.set(8, 15);

    this.scoreText.text = 'PTS:' + stats.score;
    this.scoreText.position.set(40, 15);

    this.timeText.text = U.formatTime(stats.elapsedTime);
    this.timeText.position.set(w - 8, 15);

    const barX = w * 0.4;
    const barW = w * 0.34;
    const barY = 9;
    const barH = 13;

    this.bar.clear();
    this.bar.rect(barX, barY, barW, barH).fill(P.bgDeep);
    this.bar.rect(barX, barY, barW, barH).stroke({ width: 1, color: P.teal });

    const fillW = (stats.contamination / 100) * (barW - 2);
    if (fillW > 0) {
      this.bar.rect(barX + 1, barY + 1, fillW, barH - 2).fill(this.barGradient);
      if (stats.contamination > 60) {
        const pulse = Math.sin(U.now() * 5) * 0.3 + 0.7;
        this.bar.rect(barX + 1, barY + 1, fillW, barH - 2).fill({ color: P.red, alpha: pulse * 0.5 });
      }
    }

    this.pctText.text = Math.floor(stats.contamination) + '%';
    this.pctText.position.set(barX + barW / 2, barY + barH / 2);

    this.hearts.clear();
    const hx = 8;
    const hy = h - 12;
    for (let i = 0; i < stats.maxHealth; i++) {
      const full = i < stats.health;
      this.heart(hx + i * 12, hy, 4, full ? P.red : { color: P.textDark, alpha: 0.6 });
    }
  }

  private heart(x: number, y: number, r: number, fill: number | { color: number; alpha: number }): void {
    const g = this.hearts;
    g.moveTo(x, y + r * 0.5);
    g.arc(x - r * 0.5, y, r * 0.5, Math.PI, 0);
    g.arc(x + r * 0.5, y, r * 0.5, Math.PI, 0);
    g.closePath();
    g.fill(fill);
  }
}
