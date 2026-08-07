import { Application, Container, Graphics } from 'pixi.js';
import { CFG, DIFFICULTY, P, type GameMode, type GermKind } from './config';
import { U } from './utils';
import { audio } from './audio';
import { STORY, type DialogueKey } from './content';
import { InputManager } from './input';
import { ParticleSystem } from './particles';
import { drawBackground } from './background';
import { Player } from './entities/player';
import { Bullet } from './entities/bullet';
import { Germ } from './entities/germ';
import { PowerUp } from './entities/powerup';
import { Boss } from './entities/boss';
import { EnemyShot } from './entities/enemyShot';
import { HUD, type GameStats } from './hud';
import { ScreenManager } from './screens';
import { save, persist, recordBest, addHighScore, resetSave } from './save';
import { checkAchievements, achievementById, type AchievementContext } from './achievements';

export type GameState = 'menu' | 'story' | 'phase' | 'playing' | 'gameover' | 'ending' | 'paused';

/** Orquestrador: dono do loop, estado do mundo, spawn, colisões, combo e conquistas. */
export class Game {
  app: Application;
  input: InputManager;
  screens = new ScreenManager();
  particles = new ParticleSystem();
  player: Player;
  hud: HUD;

  private world = new Container();
  private bg = new Graphics();
  private joyG = new Graphics();
  private germLayer = new Container();
  private bossLayer = new Container();
  private enemyShotLayer = new Container();
  private bulletLayer = new Container();
  private powerupLayer = new Container();
  private playerLayer = new Container();

  state: GameState = 'menu';
  running = false;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  score = 0;
  contamination = 0;
  elapsedTime = 0;
  phase = 1;
  germsEliminated = 0;
  mode: GameMode = 'story';
  wave = 1;

  private germs: Germ[] = [];
  private powerups: PowerUp[] = [];
  private bullets: Bullet[] = [];
  private enemyShots: EnemyShot[] = [];
  private boss: Boss | null = null;
  private bossDeathTimer = 0;
  private spawnTimer = 0;
  private gelTimer = 0;
  private vaccineTimer = 0;
  private waveTimer = 0;
  private phaseChanged = false;
  private dialogueCooldown = 0;
  private shakeT = 0;
  private shakeDur = 1;
  private shakeMag = 0;

  // combo / hitstop
  private comboMult = 1;
  private comboTimer = 0;
  private hitstopT = 0;
  private bestComboRun = 0;

  // acompanhamento da partida (conquistas/estatísticas)
  private germsKilledRun = 0;
  private gelCount = 0;
  private vaccineCount = 0;
  private dashCount = 0;
  private noHitThisPhase = true;
  private anyPhaseNoHit = false;

  private diff: (typeof DIFFICULTY)['normal'] = DIFFICULTY.normal;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.canvas, { w: CFG.W, h: CFG.H });
    this.player = new Player(CFG, this.playerLayer, this.bulletLayer);
    this.hud = new HUD(CFG.W, CFG.H);
    this.diff = DIFFICULTY[save().settings.difficulty];

    this.world.addChild(
      this.bg,
      this.powerupLayer,
      this.germLayer,
      this.bossLayer,
      this.enemyShotLayer,
      this.bulletLayer,
      this.playerLayer,
      this.particles.container
    );
    app.stage.addChild(this.world, this.hud.container, this.joyG);
  }

  init(): void {
    this.bindGlobalKeys();
    this.bindVisibility();
    this.app.ticker.add(() => {
      const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.05);
      this.accumulator += dt;
      while (this.accumulator >= this.fixedDt) {
        this.update(this.fixedDt);
        this.accumulator -= this.fixedDt;
      }
      this.render();
    });
  }

  private bindGlobalKeys(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (this.state === 'menu') this.startGame();
        else if (this.state === 'story') this.advanceCutscene();
        else if (this.state === 'phase') {
          if (this.screens.current === 'endless') this.startEndlessPlay();
          else this.startPlaying();
        } else if (this.state === 'gameover' || this.state === 'ending') this.startGame();
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }
    });
  }

  private bindVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.pauseGame();
    });
  }

  // ---- transições públicas (chamadas pelos botões do HTML) ----
  showMenu(): void {
    audio.stopMusic();
    this.reset();
    this.screens.showMenu();
    this.state = 'menu';
  }

  showStory(): void {
    audio.click();
    this.screens.showStory();
    this.state = 'story';
  }

  showInstructions(): void {
    audio.click();
    this.screens.showInstructions();
  }

  showCredits(): void {
    audio.click();
    this.screens.showCredits();
  }

  showRecords(): void {
    audio.click();
    this.screens.showRecords();
  }

  showAchievements(): void {
    audio.click();
    this.screens.showAchievements();
  }

  showSettings(returnTo: 'menu' | 'pause'): void {
    audio.click();
    this.screens.showSettings(returnTo);
  }

  backFromSettings(): void {
    audio.click();
    this.screens.applySettings();
    if (this.screens.returnToPause) {
      this.state = 'paused';
      this.screens.showPause();
    } else {
      this.state = 'menu';
      this.screens.showMenu();
    }
  }

  pauseGame(): void {
    if (this.state !== 'playing') return;
    audio.stopMusic();
    this.state = 'paused';
    this.screens.showPause();
  }

  resumeGame(): void {
    if (this.state !== 'paused') return;
    audio.init();
    audio.startMusic(this.mode === 'endless' ? 1 : this.phase);
    this.screens.hideAll();
    this.state = 'playing';
  }

  restartGame(): void {
    this.startGame();
  }

  resetProgress(): void {
    if (confirm('Zerar todo o progresso, recordes e conquistas?')) {
      resetSave();
      this.screens.applySettings();
      this.showMenu();
    }
  }

  // ---- modo história ----
  startGame(): void {
    audio.init();
    audio.click();
    this.reset();
    this.showCutscene();
  }

  showCutscene(): void {
    audio.stopMusic();
    this.screens.showCutscene();
    this.state = 'story';
  }

  /** Avança a cutscene com Enter/Espaço ou o botão; ao final, inicia a missão. */
  advanceCutscene(): void {
    if (this.state !== 'story') return;
    audio.click();
    if (this.screens.current === 'cutscene') {
      if (this.screens.cutsceneAdvance() === 'done') this.startMission();
    } else {
      this.startMission();
    }
  }

  /** Pula a cutscene e vai direto para a missão. */
  skipCutscene(): void {
    if (this.state !== 'story') return;
    audio.click();
    this.screens.clearTyper();
    this.startMission();
  }

  startMission(): void {
    audio.init();
    audio.click();
    this.mode = 'story';
    this.showPhaseTransition(1);
  }

  startPlaying(): void {
    audio.init();
    audio.click();
    this.beginPlay('story');
  }

  // ---- modo sobrevivência ----
  showEndlessIntro(): void {
    audio.click();
    this.reset();
    this.mode = 'endless';
    this.wave = 1;
    this.state = 'phase';
    this.screens.showEndlessIntro();
  }

  startEndlessPlay(): void {
    audio.init();
    audio.click();
    this.wave = 1;
    this.waveTimer = CFG.ENDLESS.waveDuration;
    this.beginPlay('endless');
  }

  showPhaseTransition(phase: number): void {
    audio.stopMusic();
    audio.phaseUp();
    this.state = 'phase';
    this.screens.showPhase(phase);
  }

  private beginPlay(mode: GameMode): void {
    this.mode = mode;
    this.diff = DIFFICULTY[save().settings.difficulty];
    this.running = true;
    this.state = 'playing';
    audio.init();
    audio.startMusic(mode === 'endless' ? 1 : this.phase);
    this.screens.hideAll();
    this.dialogueCooldown = 0;
    this.comboMult = 1;
    this.comboTimer = 0;
    this.hitstopT = 0;
    this.noHitThisPhase = true;
    this.spawnTimer = mode === 'endless' ? this.currentSpawnRate() : CFG.GERM.spawnRate[this.phase - 1];
    if (mode === 'story') {
      if (this.phase === 3) {
        if (!this.boss) this.spawnBoss();
        this.say('bossSpawn');
      } else {
        this.say('phaseStart');
      }
    }
  }

  reset(): void {
    audio.stopMusic();
    this.mode = 'story';
    this.score = 0;
    this.contamination = 0;
    this.elapsedTime = 0;
    this.phase = 1;
    this.germsEliminated = 0;
    this.wave = 1;
    this.germsKilledRun = 0;
    this.gelCount = 0;
    this.vaccineCount = 0;
    this.dashCount = 0;
    this.bestComboRun = 0;
    this.comboMult = 1;
    this.comboTimer = 0;
    this.hitstopT = 0;
    this.noHitThisPhase = true;
    this.anyPhaseNoHit = false;
    this.clearEntities();
    this.clearCombat();
    this.particles.clear();
    this.spawnTimer = 0;
    this.waveTimer = 0;
    this.gelTimer = CFG.POWERUP.gelInterval;
    this.vaccineTimer = CFG.POWERUP.vaccineInterval;
    this.phaseChanged = false;
    this.dialogueCooldown = 0;
    this.shakeT = 0;
    this.bossDeathTimer = 0;
    this.player.reset();
    this.hud.clearSubtitle();
  }

  private clearEntities(): void {
    for (const g of this.germs) g.destroy();
    for (const b of this.bullets) b.destroy();
    for (const p of this.powerups) p.destroy();
    this.germs.length = 0;
    this.bullets.length = 0;
    this.powerups.length = 0;
  }

  private clearCombat(): void {
    for (const es of this.enemyShots) es.destroy();
    this.enemyShots.length = 0;
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    this.bossDeathTimer = 0;
  }

  private spawnBoss(): void {
    this.boss = new Boss(CFG, this.bossLayer, this.diff.bossHpMul);
    audio.bossRoar();
    this.shake(0.35, 3);
  }

  // ---- fim de partida ----
  private gameOver(): void {
    audio.stopMusic();
    audio.gameOver();
    this.running = false;
    this.state = 'gameover';
    this.endRun(false);
  }

  private victory(): void {
    audio.stopMusic();
    audio.victory();
    this.running = false;
    this.state = 'ending';
    this.hud.clearSubtitle();
    if (this.noHitThisPhase) this.anyPhaseNoHit = true;
    this.endRun(true);
  }

  private endRun(victory: boolean): void {
    const isEndless = this.mode === 'endless';
    const ctx: AchievementContext = {
      germsKilled: this.germsKilledRun,
      gel: this.gelCount,
      vaccine: this.vaccineCount,
      dashes: this.dashCount,
      bestCombo: this.bestComboRun,
      victory: victory && !isEndless,
      phaseNoHit: this.anyPhaseNoHit,
      score: this.score,
      maxWave: isEndless ? this.wave : this.phase
    };
    const newUnlocks = checkAchievements(ctx);

    const s = save();
    s.stats.runs++;
    if (ctx.victory) s.stats.victories++;
    s.stats.totalGerms += ctx.germsKilled;
    s.stats.totalGel += ctx.gel;
    s.stats.totalVaccine += ctx.vaccine;
    s.stats.totalDashes += ctx.dashes;
    s.stats.totalScore += this.score;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, ctx.bestCombo);
    s.stats.maxWave = Math.max(s.stats.maxWave, ctx.maxWave);
    persist();

    const isRecord = recordBest(this.score, isEndless);
    if (this.score > 0) {
      addHighScore({
        score: this.score,
        wave: isEndless ? this.wave : this.phase,
        mode: isEndless ? 'endless' : 'story',
        date: Date.now()
      });
    }

    for (const id of newUnlocks) {
      const a = achievementById(id);
      if (a) {
        audio.achievement();
        this.screens.showToast(a.name);
      }
    }

    if (victory) this.screens.showEnding(this.stats(), isRecord);
    else this.screens.showGameOver(this.stats(), isRecord);
  }

  private stats(): GameStats {
    return {
      score: this.score,
      germsEliminated: this.germsEliminated,
      phase: this.phase,
      elapsedTime: this.elapsedTime,
      contamination: this.contamination,
      health: this.player.health,
      maxHealth: this.player.maxHealth,
      boss: this.boss && !this.boss.dead ? { hp: this.boss.hp, maxHp: this.boss.maxHp } : null,
      comboMult: this.comboMult,
      dashReady: this.player.dashRatio(),
      wave: this.wave,
      mode: this.mode
    };
  }

  /** Fala do herói como legenda na HUD, com intervalo mínimo entre falas. */
  private say(key: DialogueKey): void {
    if (this.dialogueCooldown > 0) return;
    const list = STORY.dialogues[key];
    if (!list || !list.length) return;
    const line = list[U.randInt(0, list.length - 1)];
    this.hud.showSubtitle(line, 3.2);
    this.dialogueCooldown = 3.4;
  }

  private shake(mag: number, dur: number): void {
    this.shakeMag = mag;
    this.shakeDur = dur;
    this.shakeT = dur;
  }

  // ---- spawn ----
  private kindPhase(): number {
    return this.mode === 'endless' ? Math.min(this.wave, 3) : this.phase;
  }

  private currentMaxGerms(): number {
    if (this.mode !== 'endless') return CFG.GERM.maxGerms[this.phase - 1];
    return Math.min(CFG.ENDLESS.maxGermsBase + (this.wave - 1) * CFG.ENDLESS.maxGermsStep, 40);
  }

  private currentSpawnRate(): number {
    if (this.mode !== 'endless') return CFG.GERM.spawnRate[this.phase - 1];
    return Math.max(
      CFG.ENDLESS.spawnRateStart - (this.wave - 1) * CFG.ENDLESS.spawnRateDrop,
      CFG.ENDLESS.spawnRateMin
    );
  }

  private pickKind(): GermKind {
    if (this.mode === 'endless') {
      const w = this.wave;
      const r = Math.random();
      if (w >= 8 && r < 0.08) return 'elite';
      if (w >= 5 && r < 0.3) return 'spitter';
      if (w >= 3 && r < 0.48) return 'charger';
      return r < 0.5 ? 'virus' : 'bacteria';
    }
    const p = this.phase;
    const r = Math.random();
    if (p >= 3) {
      if (r < 0.35) return 'virus';
      if (r < 0.65) return 'bacteria';
      if (r < 0.85) return 'charger';
      return 'spitter';
    }
    if (p >= 2) {
      if (r < 0.35) return 'virus';
      if (r < 0.7) return 'bacteria';
      if (r < 0.85) return 'charger';
      return 'spitter';
    }
    return r < 0.45 ? 'virus' : 'bacteria';
  }

  private spawnGerm(): void {
    if (this.germs.length >= this.currentMaxGerms()) return;
    this.germs.push(new Germ(this.pickKind(), this.kindPhase(), CFG, this.germLayer, this.enemyShotLayer, this.diff.speedMul));
  }

  private spawnElite(): void {
    if (this.germs.length >= this.currentMaxGerms()) return;
    this.germs.push(new Germ('elite', this.kindPhase(), CFG, this.germLayer, this.enemyShotLayer, this.diff.speedMul));
  }

  private spawnPowerUp(type: 'gel' | 'vaccine'): void {
    if (this.powerups.length >= CFG.POWERUP.maxOnScreen) return;
    this.powerups.push(new PowerUp(type, CFG, this.powerupLayer));
  }

  // ---- progressão de fase ----
  private checkPhaseProgression(): boolean {
    if (this.phase === 1 && this.score >= CFG.PHASE_1_SCORE) {
      if (this.noHitThisPhase) this.anyPhaseNoHit = true;
      this.phase = 2;
      this.phaseChanged = true;
      this.noHitThisPhase = true;
      this.gelTimer = -3;
      this.clearEntities();
      this.clearCombat();
      this.showPhaseTransition(2);
      return true;
    }
    if (this.phase === 2 && this.score >= CFG.PHASE_2_SCORE) {
      if (this.noHitThisPhase) this.anyPhaseNoHit = true;
      this.phase = 3;
      this.phaseChanged = true;
      this.noHitThisPhase = true;
      this.gelTimer = -3;
      this.clearEntities();
      this.clearCombat();
      this.showPhaseTransition(3);
      return true;
    }
    return false;
  }

  // ---- colisões ----
  private handleCollisions(): void {
    // balas do jogador vs chefe
    if (this.boss && !this.boss.dead) {
      const boss = this.boss;
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        if (U.dist(b.x, b.y, boss.x, boss.y) < boss.radius + b.size) {
          boss.takeHit(CFG.BULLET.damage);
          audio.bossHit();
          this.particles.spawnBurst(b.x, b.y, P.red, 5);
          this.particles.spawnPopup(b.x, b.y - 8, '-' + CFG.BULLET.damage, P.red);
          b.destroy();
          this.bullets.splice(i, 1);
          this.shake(0.12, 1);
          this.hitstopT = Math.max(this.hitstopT, CFG.HITSTOP.bossHit);
        }
      }
    }

    // balas do jogador vs germes
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (let j = this.germs.length - 1; j >= 0; j--) {
        const g = this.germs[j];
        if (U.dist(b.x, b.y, g.x, g.y) < g.radius + b.size) {
          if (g.hit(CFG.BULLET.damage)) {
            this.killGerm(g);
            this.germs.splice(j, 1);
          }
          b.destroy();
          this.bullets.splice(i, 1);
          break;
        }
      }
    }

    // balas do jogador vs projéteis inimigos (destrutíveis)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (let j = this.enemyShots.length - 1; j >= 0; j--) {
        const es = this.enemyShots[j];
        if (U.dist(b.x, b.y, es.x, es.y) < es.radius + b.size) {
          this.particles.spawnBurst(es.x, es.y, es.type === 'virus' ? P.red : P.greenMid, 6);
          audio.destroy();
          es.destroy();
          b.destroy();
          this.bullets.splice(i, 1);
          this.enemyShots.splice(j, 1);
          break;
        }
      }
    }

    // projéteis inimigos vs jogador
    for (let k = this.enemyShots.length - 1; k >= 0; k--) {
      const es = this.enemyShots[k];
      if (U.dist(this.player.x, this.player.y, es.x, es.y) < es.radius + this.player.size * 0.4) {
        if (this.hitPlayer(CFG.GERM.contactContam)) {
          this.particles.spawnBurst(es.x, es.y, P.red, 6);
        }
        es.destroy();
        this.enemyShots.splice(k, 1);
      }
    }

    // germes vs jogador
    for (let k = this.germs.length - 1; k >= 0; k--) {
      const g = this.germs[k];
      if (U.dist(this.player.x, this.player.y, g.x, g.y) < g.radius + this.player.size * 0.4) {
        this.hitPlayer(CFG.GERM.contactContam);
        this.particles.spawnBurst(g.x, g.y, P.red, 8);
        this.killGerm(g, true);
        this.germs.splice(k, 1);
      }
    }

    // contato com o chefe
    if (this.boss && !this.boss.dead) {
      const boss = this.boss;
      if (U.dist(this.player.x, this.player.y, boss.x, boss.y) < boss.radius + this.player.size * 0.4) {
        this.hitPlayer(CFG.BOSS.contactContam);
        this.shake(0.3, 2);
      }
    }

    // coletáveis vs jogador
    for (let m = this.powerups.length - 1; m >= 0; m--) {
      const pu = this.powerups[m];
      if (U.dist(this.player.x, this.player.y, pu.x, pu.y) < pu.size * 0.7 + this.player.size * 0.4) {
        this.applyPowerUp(pu);
        pu.destroy();
        this.powerups.splice(m, 1);
      }
    }
  }

  /** Registra dano ao jogador. Retorna true se o dano foi aplicado. */
  private hitPlayer(contam: number): boolean {
    const took = this.player.takeHit(audio);
    if (took) {
      this.noHitThisPhase = false;
      this.contamination = U.clamp(this.contamination + contam * this.diff.contamMul, 0, CFG.MAX_CONTAM);
      this.particles.spawnBurst(this.player.x, this.player.y, P.red, 10);
      this.particles.spawnPopup(
        this.player.x,
        this.player.y - 14,
        '-' + Math.floor(contam * this.diff.contamMul) + '%',
        P.red
      );
      this.shake(0.22, 1.5);
      this.hitstopT = Math.max(this.hitstopT, CFG.HITSTOP.playerHit);
    }
    return took;
  }

  /** Abate um germe: pontuação (com combo), partículas, som e hitstop. */
  private killGerm(g: Germ, contact = false): void {
    const pts = g.points * this.comboMult;
    this.score += pts;
    this.germsEliminated++;
    this.germsKilledRun++;

    if (this.comboMult < CFG.COMBO.maxMult) {
      this.comboMult++;
      this.bestComboRun = Math.max(this.bestComboRun, this.comboMult);
      this.comboTimer = CFG.COMBO.window;
      if (this.comboMult >= 2) audio.combo(this.comboMult);
    } else {
      this.comboTimer = CFG.COMBO.window;
    }

    if (g.kind === 'bacteria' || g.kind === 'spitter') audio.bacteria();
    else audio.virus();
    const color = g.kind === 'bacteria' || g.kind === 'spitter' ? P.greenMid : P.red;
    this.particles.spawnBurst(g.x, g.y, color, 9);
    this.particles.spawnPopup(g.x, g.y - 8, '+' + pts, P.cyan);
    if (!contact) this.hitstopT = Math.max(this.hitstopT, CFG.HITSTOP.kill);
    g.destroy();
  }

  private applyPowerUp(pu: PowerUp): void {
    if (pu.type === 'gel') {
      this.score += CFG.POWERUP.gelPoints;
      this.gelCount++;
      audio.gel();
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.gelPoints + ' GEL!', P.cyanMid);
      this.say('gel');
      for (const g of this.germs) {
        this.particles.spawnBurst(g.x, g.y, P.red, 5);
        g.destroy();
      }
      this.germs.length = 0;
      this.particles.spawnBurst(pu.x, pu.y, P.cyanMid, 14);
    } else if (pu.type === 'vaccine') {
      this.score += CFG.POWERUP.vaccinePoints;
      this.vaccineCount++;
      audio.vaccine();
      this.contamination = Math.max(0, this.contamination - CFG.POWERUP.vaccineReduce);
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.vaccinePoints + ' VACINA!', P.yellow);
      this.say('vaccine');
      this.particles.spawnBurst(pu.x, pu.y, P.yellow, 14);
    }
  }

  // ---- update / render ----
  private update(dt: number): void {
    if (this.state !== 'playing' || !this.running) return;
    if (this.hitstopT > 0) {
      this.hitstopT -= dt;
      this.hud.tick(dt);
      audio.update(dt);
      return;
    }
    if (this.phaseChanged) {
      this.phaseChanged = false;
      return;
    }

    this.elapsedTime += dt;
    this.dialogueCooldown -= dt;
    this.hud.tick(dt);
    if (this.shakeT > 0) this.shakeT -= dt;

    // combo decai com o tempo
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboMult = 1;
    }

    // spawn
    if (this.mode === 'endless') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) {
        this.wave++;
        this.waveTimer = CFG.ENDLESS.waveDuration;
        audio.waveUp();
        this.spawnTimer = 0.5;
        if (this.wave % CFG.ENDLESS.eliteEvery === 0) this.spawnElite();
      }
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnGerm();
        this.spawnTimer = this.currentSpawnRate();
      }
    } else if (this.phase < 3) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnGerm();
        this.spawnTimer = CFG.GERM.spawnRate[this.phase - 1];
      }
    }

    this.gelTimer -= dt;
    if (this.gelTimer <= 0) {
      this.spawnPowerUp('gel');
      this.gelTimer = CFG.POWERUP.gelInterval + U.rand(-3, 3);
    }
    this.vaccineTimer -= dt;
    if (this.vaccineTimer <= 0) {
      this.spawnPowerUp('vaccine');
      this.vaccineTimer = CFG.POWERUP.vaccineInterval + U.rand(-5, 5);
    }

    this.player.update(dt, this.input, this.bullets, audio);
    if (this.player.dashStarted) this.dashCount++;

    // mira automática no germe mais próximo (toque)
    if (this.input.touchMode && this.germs.length) {
      let best = this.germs[0];
      let bd = Infinity;
      for (const g of this.germs) {
        const d = U.dist(g.x, g.y, this.player.x, this.player.y);
        if (d < bd) {
          bd = d;
          best = g;
        }
      }
      this.input.setAim(best.x, best.y);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.update(dt, CFG.W, CFG.H)) {
        b.destroy();
        this.bullets.splice(i, 1);
      }
    }

    for (let j = this.germs.length - 1; j >= 0; j--) {
      const g = this.germs[j];
      g.update(dt, this.player, CFG);
      if (g.dead) {
        if (g.escaped) {
          this.contamination = U.clamp(
            this.contamination + CFG.GERM.escapeContam * this.diff.contamMul,
            0,
            CFG.MAX_CONTAM
          );
          audio.escape();
          this.particles.spawnBurst(U.clamp(g.x, 0, CFG.W), U.clamp(g.y, 0, CFG.H), P.red, 6);
        }
        g.destroy();
        this.germs.splice(j, 1);
      }
    }

    if (this.boss) {
      const b = this.boss;
      b.update(dt, this.player, CFG);
      for (const p of b.pendingProjectiles) {
        this.enemyShots.push(
          new EnemyShot(p.type, p.x, p.y, p.angle, p.speed, p.type === 'virus' ? 12 : 11, 7, this.enemyShotLayer)
        );
      }
      b.pendingProjectiles.length = 0;
      for (let m = 0; m < b.pendingMinions; m++) this.spawnGerm();
      b.pendingMinions = 0;

      if (b.stageChanged) {
        b.stageChanged = false;
        audio.bossStageUp();
        this.shake(0.3, 2);
        this.say(('bossStage' + b.stage) as DialogueKey);
      }
      if (b.dead && this.bossDeathTimer <= 0) {
        this.bossDeathTimer = 1.4;
        audio.bossRoar();
        this.shake(0.55, 4);
        this.hitstopT = Math.max(this.hitstopT, CFG.HITSTOP.bossDeath);
        this.particles.spawnBurst(b.x, b.y, P.red, 40);
        this.particles.spawnBurst(b.x, b.y, P.yellow, 24);
        this.say('bossDefeated');
      }
    }
    if (this.bossDeathTimer > 0) {
      this.bossDeathTimer -= dt;
      if (this.bossDeathTimer <= 0) {
        this.victory();
        return;
      }
    }

    for (let k = this.enemyShots.length - 1; k >= 0; k--) {
      const es = this.enemyShots[k];
      if (es.update(dt, CFG.W, CFG.H)) {
        es.destroy();
        this.enemyShots.splice(k, 1);
      }
    }

    for (const pu of this.powerups) pu.update(dt);

    this.handleCollisions();
    this.particles.update(dt);
    audio.update(dt);

    if (this.dialogueCooldown <= 0) {
      if (this.player.health <= 1 && this.player.health > 0) this.say('lowHealth');
      else if (this.contamination >= 70) this.say('highContamination');
    }

    if (this.contamination >= CFG.MAX_CONTAM || this.player.health <= 0) {
      this.contamination = CFG.MAX_CONTAM;
      this.gameOver();
      return;
    }
    if (this.mode === 'story') this.checkPhaseProgression();
  }

  private render(): void {
    drawBackground(this.bg, CFG.W, CFG.H, this.contamination, U.now());

    for (const pu of this.powerups) pu.draw();
    for (const g of this.germs) g.draw();
    if (this.boss) this.boss.draw();
    for (const es of this.enemyShots) es.draw();
    for (const b of this.bullets) b.draw();

    if (this.state === 'playing' || this.state === 'phase') this.player.draw();

    this.particles.render();

    if (this.state === 'playing') this.hud.draw(this.stats());

    // joystick virtual (toque)
    this.joyG.clear();
    if (this.input.touchMode && this.state === 'playing') {
      const j = this.input.joystick();
      if (j) {
        this.joyG.circle(j.origin.x, j.origin.y, 30).stroke({ width: 2, color: P.cyan, alpha: 0.45 });
        this.joyG.circle(j.origin.x + j.vec.x * 30, j.origin.y + j.vec.y * 30, 12).fill({
          color: P.cyan,
          alpha: 0.5
        });
      }
    }

    if (this.shakeT > 0) {
      const k = this.shakeT / this.shakeDur;
      this.world.position.set(
        (Math.random() * 2 - 1) * this.shakeMag * k,
        (Math.random() * 2 - 1) * this.shakeMag * k
      );
    } else {
      this.world.position.set(0, 0);
    }
  }
}
