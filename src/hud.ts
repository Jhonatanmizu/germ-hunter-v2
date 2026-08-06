import { Container, Graphics, Text, FillGradient } from 'pixi.js';
import { P } from './config';
import { STORY } from './content';
import { U } from './utils';

export interface GameStats {
  score: number;
  germsEliminated: number;
  phase: number;
  elapsedTime: number;
  contamination: number;
  health: number;
  maxHealth: number;
  boss?: { hp: number; maxHp: number } | null;
}

const FONT = '"Press Start 2P", monospace';
const PHASE_COLORS = [P.cyan, P.green, P.yellow];

/** HUD: fase, pontuação, tempo, contaminação, corações, objetivo, barra do chefe e legendas. */
export class HUD {
  readonly container = new Container();
  private bg = new Graphics();
  private bar = new Graphics();
  private hearts = new Graphics();
  private bossBar = new Graphics();
  private phaseText: Text;
  private scoreText: Text;
  private timeText: Text;
  private pctText: Text;
  private objectiveText: Text;
  private bossLabel: Text;
  private subtitle: Text;
  private subtitleTimer = 0;
  private subtitleDur = 1;
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
    this.objectiveText = new Text({
      text: '',
      style: { fontFamily: FONT, fontSize: 7, fill: P.cyanMid }
    });
    this.bossLabel = new Text({
      text: 'CHEFE',
      style: { fontFamily: FONT, fontSize: 7, fill: P.red }
    });
    this.subtitle = new Text({
      text: '',
      style: {
        fontFamily: FONT,
        fontSize: 8,
        fill: P.yellow,
        stroke: { color: 0x000000, width: 3 },
        align: 'center'
      }
    });

    this.phaseText.anchor.set(0, 0.5);
    this.scoreText.anchor.set(0, 0.5);
    this.timeText.anchor.set(1, 0.5);
    this.pctText.anchor.set(0.5, 0.5);
    this.objectiveText.anchor.set(0, 0.5);
    this.bossLabel.anchor.set(0.5, 0.5);
    this.subtitle.anchor.set(0.5, 0.5);

    this.subtitle.position.set(w / 2, h - 22);
    this.subtitle.visible = false;

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

    this.container.addChild(
      this.bg,
      this.bar,
      this.hearts,
      this.bossBar,
      this.phaseText,
      this.scoreText,
      this.timeText,
      this.pctText,
      this.objectiveText,
      this.bossLabel,
      this.subtitle
    );
  }

  showSubtitle(text: string, dur: number): void {
    this.subtitle.text = text;
    this.subtitleTimer = dur;
    this.subtitleDur = dur;
  }

  clearSubtitle(): void {
    this.subtitleTimer = 0;
    this.subtitle.visible = false;
  }

  tick(dt: number): void {
    if (this.subtitleTimer > 0) this.subtitleTimer -= dt;
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

    this.objectiveText.text = STORY.phases[stats.phase - 1]?.objective ?? '';
    this.objectiveText.position.set(8, 36);

    // barra do chefe (Fase 3)
    this.bossBar.clear();
    this.bossLabel.visible = false;
    if (stats.boss && stats.boss.maxHp > 0 && stats.phase === 3) {
      const bw = 190;
      const bh = 9;
      const bx = (w - bw) / 2;
      const by = 42;
      this.bossLabel.visible = true;
      this.bossLabel.position.set(bx - 8, by + bh / 2);
      this.bossBar.rect(bx, by, bw, bh).fill(P.bgDeep);
      this.bossBar.rect(bx, by, bw, bh).stroke({ width: 1, color: P.red });
      const fw = Math.max(0, stats.boss.hp / stats.boss.maxHp) * (bw - 2);
      if (fw > 0) {
        this.bossBar.rect(bx + 1, by + 1, fw, bh - 2).fill({ color: P.red, alpha: 0.9 });
        if (stats.boss.hp / stats.boss.maxHp < 0.34) {
          const pulse = Math.sin(U.now() * 6) * 0.3 + 0.7;
          this.bossBar.rect(bx + 1, by + 1, fw, bh - 2).fill({ color: 0xff4444, alpha: pulse * 0.6 });
        }
      }
    }

    // legenda do herói
    if (this.subtitleTimer > 0) {
      const total = this.subtitleDur;
      const t = this.subtitleTimer;
      const fadeIn = U.clamp((total - t) / 0.25, 0, 1);
      const fadeOut = U.clamp(t / 0.4, 0, 1);
      this.subtitle.alpha = Math.min(fadeIn, fadeOut);
      this.subtitle.visible = true;
    } else {
      this.subtitle.visible = false;
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
