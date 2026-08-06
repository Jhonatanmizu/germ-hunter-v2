import { CONTENT, STORY } from './content';
import { U } from './utils';
import type { GameStats } from './hud';

/** Gerenciador de telas DOM (menu, história, cutscene, instruções, fase, game over, final, créditos). */
export class ScreenManager {
  current = 'menu';

  // ---- cutscene (máquina de escrever) ----
  private cutscenePageIdx = 0;
  private cutsceneLineIdx = 0;
  private cutsceneTyping = false;
  private cutsceneReady = false;
  private typer: number | null = null;
  private cutsceneLineEls: HTMLParagraphElement[] = [];

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
    this.clearTyper();
    this.set('menu-screen');
  }

  showStory(): void {
    this.clearTyper();
    this.buildStory();
    this.set('story-screen');
  }

  // ---- cutscene ----
  showCutscene(): void {
    this.clearTyper();
    this.cutscenePageIdx = 0;
    this.startCutscenePage();
    this.set('cutscene-screen');
  }

  private clearTyper(): void {
    if (this.typer !== null) {
      clearInterval(this.typer);
      this.typer = null;
    }
    this.cutsceneTyping = false;
  }

  private startCutscenePage(): void {
    const page = STORY.cutscene[this.cutscenePageIdx];
    if (!page) return;
    const chapter = document.getElementById('cutscene-chapter');
    if (chapter) chapter.textContent = page.chapter;
    const box = document.getElementById('cutscene-lines');
    const heroBox = document.getElementById('cutscene-hero');
    if (box) box.innerHTML = '';
    if (heroBox) heroBox.textContent = '';
    if (heroBox) heroBox.classList.remove('visible');
    this.cutsceneLineEls = [];
    if (box) {
      for (let i = 0; i < page.lines.length; i++) {
        const p = document.createElement('p');
        p.className = 'cutscene-line';
        box.appendChild(p);
        this.cutsceneLineEls.push(p);
      }
    }
    this.cutsceneLineIdx = 0;
    this.cutsceneReady = false;
    this.typeNextLine();
    this.updateCutsceneHint();
  }

  private typeNextLine(): void {
    const page = STORY.cutscene[this.cutscenePageIdx];
    if (!page) return;
    if (this.cutsceneLineIdx >= page.lines.length) {
      this.showCutsceneDoutor();
      return;
    }
    const p = this.cutsceneLineEls[this.cutsceneLineIdx];
    const text = page.lines[this.cutsceneLineIdx];
    if (!p) return;
    p.textContent = '';
    let i = 0;
    this.cutsceneTyping = true;
    this.typer = window.setInterval(() => {
      i++;
      p.textContent = text.slice(0, i);
      if (i >= text.length) {
        this.clearTyper();
        this.updateCutsceneHint();
      }
    }, 16);
  }

  private finishCutsceneLine(): void {
    this.clearTyper();
    const page = STORY.cutscene[this.cutscenePageIdx];
    const p = this.cutsceneLineEls[this.cutsceneLineIdx];
    if (page && p) p.textContent = page.lines[this.cutsceneLineIdx];
    this.updateCutsceneHint();
  }

  private showCutsceneDoutor(): void {
    const page = STORY.cutscene[this.cutscenePageIdx];
    const heroBox = document.getElementById('cutscene-hero');
    if (heroBox && page) {
      heroBox.textContent = STORY.hero + ': "' + page.doutor + '"';
      heroBox.classList.add('visible');
    }
    this.cutsceneReady = true;
    this.updateCutsceneHint();
  }

  private updateCutsceneHint(): void {
    const hint = document.getElementById('cutscene-hint');
    if (!hint) return;
    if (this.cutsceneTyping) {
      hint.textContent = 'PRESSIONE ENTER ▸';
    } else if (!this.cutsceneReady) {
      hint.textContent = 'PRESSIONE ENTER ▸';
    } else if (this.cutscenePageIdx >= STORY.cutscene.length - 1) {
      hint.textContent = 'PRESSIONE ENTER PARA COMEÇAR ▶';
    } else {
      hint.textContent = 'PRESSIONE ENTER ▸';
    }
  }

  /**
   * Avança a cutscene. Retorna:
   * 'typing' — a linha atual foi completada;
   * 'page' — avançou para a próxima linha/página;
   * 'done' — cutscene terminou.
   */
  cutsceneAdvance(): 'typing' | 'page' | 'done' {
    if (this.cutsceneTyping) {
      this.finishCutsceneLine();
      return 'typing';
    }
    if (!this.cutsceneReady) {
      this.cutsceneLineIdx++;
      this.typeNextLine();
      return 'page';
    }
    this.cutscenePageIdx++;
    if (this.cutscenePageIdx >= STORY.cutscene.length) {
      this.clearTyper();
      return 'done';
    }
    this.startCutscenePage();
    return 'page';
  }

  showInstructions(): void {
    this.clearTyper();
    this.buildInstructions();
    this.set('instructions-screen');
  }

  showCredits(): void {
    this.clearTyper();
    this.buildCredits();
    this.set('credits-screen');
  }

  showPhase(phase: number): void {
    this.clearTyper();
    const n = document.getElementById('phase-number');
    if (n) n.textContent = String(phase);
    const ch = document.getElementById('phase-chapter');
    if (ch) ch.textContent = STORY.phases[phase - 1].chapter;
    const t = document.getElementById('phase-title');
    if (t) t.textContent = STORY.phases[phase - 1].title;
    const m = document.getElementById('phase-message');
    if (m) m.textContent = STORY.phases[phase - 1].message;
    const d = document.getElementById('phase-doutor');
    if (d) d.textContent = STORY.hero + ': "' + STORY.phases[phase - 1].doutor + '"';
    const c = document.getElementById('phase-curiosity');
    if (c) {
      c.textContent =
        phase === 3
          ? STORY.boss.name + ' — ' + STORY.boss.subtitle + '. ' + STORY.boss.intro
          : CONTENT.curiosities[(phase - 1) % CONTENT.curiosities.length];
      c.classList.toggle('boss-curiosity', phase === 3);
    }
    const btn = document.getElementById('phase-btn');
    if (btn) {
      btn.textContent = phase === 1 ? '▶ COMEÇAR' : '▶ CONTINUAR';
      btn.textContent = phase === 3 ? '⚔ ENFRENTAR' : btn.textContent;
    }
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
    this.clearTyper();
    for (const el of document.querySelectorAll('.screen')) {
      el.classList.remove('active');
    }
    this.current = 'playing';
  }
}
