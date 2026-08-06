import { CONTENT, STORY } from './content';
import { U } from './utils';
import type { GameStats } from './hud';

/** Gerenciador de telas DOM (menu, história, instruções, fase, game over, final, créditos). */
export class ScreenManager {
  current = 'menu';

  private buildInstructions(): void {
    const list = document.getElementById('instructions-list');
    if (!list || list.childElementCount) return;
    for (const it of CONTENT.instructions) {
      const row = document.createElement('div');
      row.className = 'instruction-item';
      const icon = document.createElement('div');
      icon.className = 'instruction-icon';
      icon.style.background = it.color;
      icon.style.borderColor = it.border;
      const span = document.createElement('span');
      span.innerHTML = it.text;
      row.appendChild(icon);
      row.appendChild(span);
      list.appendChild(row);
    }
    const foot = document.getElementById('instructions-footer');
    if (foot) foot.innerHTML = CONTENT.instructionFooter;
    const ctrl = document.getElementById('instructions-controls');
    if (ctrl) ctrl.textContent = CONTENT.controls;
  }

  private buildCredits(): void {
    const box = document.getElementById('credits-text');
    if (!box || box.childElementCount) return;
    for (const para of CONTENT.credits) {
      const p = document.createElement('div');
      p.className = 'credits-block';
      p.innerHTML = para;
      box.appendChild(p);
    }
  }

  private buildStory(): void {
    const box = document.getElementById('story-paragraphs');
    if (!box || box.childElementCount) return;
    for (const para of STORY.prologue) {
      const p = document.createElement('p');
      p.className = 'story-paragraph';
      p.textContent = para;
      box.appendChild(p);
    }
    const hero = document.getElementById('story-hero');
    if (hero) {
      hero.innerHTML =
        '<b>' + STORY.hero + '</b> — ' + STORY.heroRole + '<br>' + STORY.heroIntro;
    }
  }

  private set(id: string): void {
    for (const el of document.querySelectorAll('.screen')) {
      el.classList.remove('active');
    }
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    this.current = id.replace('-screen', '');
  }

  showMenu(): void {
    this.set('menu-screen');
  }

  showStory(): void {
    this.buildStory();
    this.set('story-screen');
  }

  showInstructions(): void {
    this.buildInstructions();
    this.set('instructions-screen');
  }

  showCredits(): void {
    this.buildCredits();
    this.set('credits-screen');
  }

  showPhase(phase: number): void {
    const n = document.getElementById('phase-number');
    if (n) n.textContent = String(phase);
    const t = document.getElementById('phase-title');
    if (t) t.textContent = STORY.phases[phase - 1].title;
    const m = document.getElementById('phase-message');
    if (m) m.textContent = STORY.phases[phase - 1].message;
    const c = document.getElementById('phase-curiosity');
    if (c) c.textContent = CONTENT.curiosities[(phase - 1) % CONTENT.curiosities.length];
    const btn = document.getElementById('phase-btn');
    if (btn) btn.textContent = phase === 1 ? '▶ COMEÇAR' : '▶ CONTINUAR';
    this.set('phase-screen');
  }

  showGameOver(stats: GameStats): void {
    const line = document.getElementById('gameover-line');
    if (line) line.textContent = STORY.gameOverLine;
    this.fillStats('final-', stats);
    this.set('gameover-screen');
  }

  showEnding(stats: GameStats): void {
    const msg = document.getElementById('ending-message');
    if (msg) msg.textContent = STORY.ending.message;
    this.fillStats('ending-', stats);
    this.set('ending-screen');
  }

  private fillStats(prefix: string, stats: GameStats): void {
    const set = (id: string, val: string) => {
      const el = document.getElementById(prefix + id);
      if (el) el.textContent = val;
    };
    set('score', String(stats.score));
    set('germs', String(stats.germsEliminated));
    set('phase', String(stats.phase));
    set('time', U.formatTime(stats.elapsedTime));
    set('contam', Math.floor(stats.contamination) + '%');
  }

  hideAll(): void {
    for (const el of document.querySelectorAll('.screen')) {
      el.classList.remove('active');
    }
    this.current = 'playing';
  }
}
