import { CONTENT, STORY } from './content';
import { U } from './utils';
import { audio } from './audio';
import { save, persist } from './save';
import { ACHIEVEMENTS } from './achievements';
import type { GameStats } from './hud';

/** Gerenciador de telas DOM (menu, história, cutscene, instruções, fase, pausa, ajustes, recordes, conquistas, game over, final, créditos). */
export class ScreenManager {
  current = 'menu';
  private settingsReturnTo: 'menu' | 'pause' = 'menu';

  get returnToPause(): boolean {
    return this.settingsReturnTo === 'pause';
  }

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
    document.body.dataset.screen = this.current;
  }

  showMenu(): void {
    this.clearTyper();
    const best = Math.max(save().bestScore, save().endlessBest);
    const label = document.getElementById('best-label');
    if (label) label.textContent = best > 0 ? 'MELHOR: ' + best.toLocaleString('pt-BR') : 'SEM RECORDES AINDA';
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

  clearTyper(): void {
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
    if (this.cutsceneTyping || !this.cutsceneReady) {
      hint.textContent = 'PRESSIONE ENTER ▸';
    } else if (this.cutscenePageIdx >= STORY.cutscene.length - 1) {
      hint.textContent = 'PRESSIONE ENTER PARA COMEÇAR ▶';
    } else {
      hint.textContent = 'PRESSIONE ENTER ▸';
    }
  }

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

  showEndlessIntro(): void {
    this.clearTyper();
    const msg = document.getElementById('endless-intro');
    if (msg) msg.textContent = STORY.endless.intro;
    this.set('endless-screen');
  }

  showPause(): void {
    this.clearTyper();
    this.set('pause-screen');
  }

  showSettings(returnTo: 'menu' | 'pause'): void {
    this.clearTyper();
    this.settingsReturnTo = returnTo;
    const s = save().settings;
    const sfx = document.getElementById('set-sfx') as HTMLInputElement | null;
    const music = document.getElementById('set-music') as HTMLInputElement | null;
    const mute = document.getElementById('set-mute') as HTMLInputElement | null;
    const diff = document.getElementById('set-difficulty') as HTMLSelectElement | null;
    if (sfx) sfx.value = String(Math.round(s.sfxVol * 100));
    if (music) music.value = String(Math.round(s.musicVol * 100));
    if (mute) mute.checked = s.muted;
    if (diff) diff.value = s.difficulty;
    const back = document.getElementById('settings-back');
    if (back) back.textContent = returnTo === 'pause' ? '← VOLTAR AO JOGO' : '← VOLTAR';
    this.set('settings-screen');
  }

  applySettings(): void {
    const s = save().settings;
    audio.setVolumes(s.sfxVol, s.musicVol, s.muted);
    persist();
  }

  showRecords(): void {
    this.clearTyper();
    const list = document.getElementById('records-list');
    if (list) {
      list.innerHTML = '';
      const scores = save().highScores;
      if (!scores.length) {
        const p = document.createElement('div');
        p.className = 'credits-block';
        p.textContent = 'Nenhum recorde ainda. Jogue para fazer história!';
        list.appendChild(p);
      } else {
        scores.forEach((s, i) => {
          const row = document.createElement('div');
          row.className = 'record-row';
          const tag = s.mode === 'endless' ? '∞ ONDA ' + s.wave : 'F' + s.wave;
          row.innerHTML =
            '<span class="record-pos">' +
            (i + 1) +
            'º</span><span class="record-score">' +
            s.score.toLocaleString('pt-BR') +
            '</span><span class="record-meta">' +
            tag +
            ' • ' +
            U.formatTimeShort(s.date) +
            '</span>';
          list.appendChild(row);
        });
      }
    }
    this.set('records-screen');
  }

  showAchievements(): void {
    this.clearTyper();
    const list = document.getElementById('achievements-list');
    if (list) {
      list.innerHTML = '';
      for (const a of ACHIEVEMENTS) {
        const locked = !(a.id in save().achievements);
        const row = document.createElement('div');
        row.className = 'achievement-row' + (locked ? ' locked' : '');
        row.innerHTML =
          '<span class="achievement-icon">' +
          (locked ? '🔒' : a.icon) +
          '</span><span class="achievement-text"><b>' +
          a.name +
          '</b><br><small>' +
          a.desc +
          '</small></span><span class="achievement-state">' +
          (locked ? '—' : '✔') +
          '</span>';
        list.appendChild(row);
      }
    }
    this.set('achievements-screen');
  }

  /** Toast de conquista. */
  showToast(title: string): void {
    const box = document.getElementById('toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = '🏆 ' + title;
    box.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 500);
    }, 3200);
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
    if (btn) btn.textContent = phase === 1 ? '▶ COMEÇAR' : phase === 3 ? '⚔ ENFRENTAR' : '▶ CONTINUAR';
    this.set('phase-screen');
  }

  showGameOver(stats: GameStats, isNewRecord: boolean): void {
    const line = document.getElementById('gameover-line');
    if (line) line.textContent = STORY.gameOverLine;
    const rec = document.getElementById('gameover-record');
    if (rec) {
      rec.textContent = isNewRecord ? '★ NOVO RECORDE! ★' : 'MELHOR: ' + Math.max(save().bestScore, save().endlessBest).toLocaleString('pt-BR');
      rec.style.color = isNewRecord ? 'var(--yellow)' : 'var(--text-dim)';
    }
    const waveRow = document.getElementById('final-wave-row');
    const waveVal = document.getElementById('final-wave');
    if (waveRow) waveRow.style.display = stats.mode === 'endless' ? '' : 'none';
    if (waveVal) waveVal.textContent = String(stats.wave);
    this.fillStats('final-', stats);
    this.set('gameover-screen');
  }

  showEnding(stats: GameStats, isNewRecord: boolean): void {
    const msg = document.getElementById('ending-message');
    if (msg) msg.textContent = STORY.ending.message;
    const rec = document.getElementById('ending-record');
    if (rec) {
      rec.textContent = isNewRecord ? '★ NOVO RECORDE! ★' : 'MELHOR: ' + save().bestScore.toLocaleString('pt-BR');
      rec.style.color = isNewRecord ? 'var(--yellow)' : 'var(--text-dim)';
    }
    this.fillStats('ending-', stats);
    this.set('ending-screen');
  }

  private fillStats(prefix: string, stats: GameStats): void {
    const set = (id: string, val: string) => {
      const el = document.getElementById(prefix + id);
      if (el) el.textContent = val;
    };
    set('score', stats.score.toLocaleString('pt-BR'));
    set('germs', String(stats.germsEliminated));
    set('phase', stats.mode === 'endless' ? '∞' : String(stats.phase));
    set('time', U.formatTime(stats.elapsedTime));
    set('contam', Math.floor(stats.contamination) + '%');
  }

  hideAll(): void {
    this.clearTyper();
    for (const el of document.querySelectorAll('.screen')) {
      el.classList.remove('active');
    }
    this.current = 'playing';
    document.body.dataset.screen = 'playing';
  }
}
