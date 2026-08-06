import { Application, Container, Graphics } from 'pixi.js';
import { CFG, P } from './config';
import { U } from './utils';
import { audio } from './audio';
import { InputManager } from './input';
import { ParticleSystem } from './particles';
import { drawBackground } from './background';
import { Player } from './entities/player';
import { Bullet } from './entities/bullet';
import { Germ } from './entities/germ';
import { PowerUp } from './entities/powerup';
import { HUD, type GameStats } from './hud';
import { ScreenManager } from './screens';

export type GameState = 'menu' | 'story' | 'phase' | 'playing' | 'gameover' | 'ending';

/** Orquestrador: dono do loop, estado do mundo, spawn e colisões. */
export class Game {
  app: Application;
  input: InputManager;
  screens = new ScreenManager();
  particles = new ParticleSystem();
  player: Player;
  hud: HUD;

  private bg = new Graphics();
  private germLayer = new Container();
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
  private germs: Germ[] = [];
  private powerups: PowerUp[] = [];
  private bullets: Bullet[] = [];
  private spawnTimer = 0;
  private gelTimer = 0;
  private vaccineTimer = 0;
  private phaseChanged = false;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.canvas, { w: CFG.W, h: CFG.H });
    this.player = new Player(CFG, this.playerLayer, this.bulletLayer);
    this.hud = new HUD(CFG.W, CFG.H);

    app.stage.addChild(
      this.bg,
      this.powerupLayer,
      this.germLayer,
      this.bulletLayer,
      this.playerLayer,
      this.particles.container,
      this.hud.container
    );
  }

  init(): void {
    this.bindGlobalKeys();
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
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.state === 'menu') this.startGame();
        else if (this.state === 'story') this.startMission();
        else if (this.state === 'gameover' || this.state === 'ending') this.startGame();
      }
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

  startGame(): void {
    audio.init();
    audio.click();
    this.reset();
    this.showStory();
  }

  startMission(): void {
    audio.init();
    audio.click();
    this.showPhaseTransition(1);
  }

  startPlaying(): void {
    audio.init();
    audio.startMusic(this.phase);
    this.screens.hideAll();
    this.state = 'playing';
    this.running = true;
  }

  showPhaseTransition(phase: number): void {
    audio.stopMusic();
    audio.phaseUp();
    this.state = 'phase';
    this.screens.showPhase(phase);
  }

  reset(): void {
    audio.stopMusic();
    this.score = 0;
    this.contamination = 0;
    this.elapsedTime = 0;
    this.phase = 1;
    this.germsEliminated = 0;
    this.clearEntities();
    this.particles.clear();
    this.spawnTimer = 0;
    this.gelTimer = CFG.POWERUP.gelInterval;
    this.vaccineTimer = CFG.POWERUP.vaccineInterval;
    this.phaseChanged = false;
    this.player.reset();
  }

  private clearEntities(): void {
    for (const g of this.germs) g.destroy();
    for (const b of this.bullets) b.destroy();
    for (const p of this.powerups) p.destroy();
    this.germs.length = 0;
    this.bullets.length = 0;
    this.powerups.length = 0;
  }

  private gameOver(): void {
    audio.stopMusic();
    audio.gameOver();
    this.running = false;
    this.state = 'gameover';
    this.screens.showGameOver(this.stats());
  }

  private victory(): void {
    audio.stopMusic();
    audio.victory();
    this.running = false;
    this.state = 'ending';
    this.screens.showEnding(this.stats());
  }

  private stats(): GameStats {
    return {
      score: this.score,
      germsEliminated: this.germsEliminated,
      phase: this.phase,
      elapsedTime: this.elapsedTime,
      contamination: this.contamination,
      health: this.player.health,
      maxHealth: this.player.maxHealth
    };
  }

  // ---- spawn ----
  private spawnGerm(): void {
    if (this.germs.length >= CFG.GERM.maxGerms[this.phase - 1]) return;
    const type = Math.random() < CFG.GERM.bacteriaChance[this.phase - 1] ? 'bacteria' : 'virus';
    this.germs.push(new Germ(type, this.phase, CFG, this.germLayer));
  }

  private spawnPowerUp(type: 'gel' | 'vaccine'): void {
    if (this.powerups.length >= CFG.POWERUP.maxOnScreen) return;
    this.powerups.push(new PowerUp(type, CFG, this.powerupLayer));
  }

  // ---- progressão de fase ----
  private checkPhaseProgression(): boolean {
    if (this.phase === 1 && this.score >= CFG.PHASE_1_SCORE) {
      this.phase = 2;
      this.phaseChanged = true;
      this.gelTimer = -3;
      this.showPhaseTransition(2);
      return true;
    }
    if (this.phase === 2 && this.score >= CFG.PHASE_2_SCORE) {
      this.phase = 3;
      this.phaseChanged = true;
      this.gelTimer = -3;
      this.showPhaseTransition(3);
      return true;
    }
    return false;
  }

  // ---- colisões ----
  private handleCollisions(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (let j = this.germs.length - 1; j >= 0; j--) {
        const g = this.germs[j];
        if (U.dist(b.x, b.y, g.x, g.y) < g.radius + b.size) {
          const pts = g.type === 'virus' ? CFG.GERM.virusPoints : CFG.GERM.bacteriaPoints;
          this.score += pts;
          this.germsEliminated++;
          if (g.type === 'virus') audio.virus();
          else audio.bacteria();
          this.particles.spawnBurst(g.x, g.y, g.type === 'virus' ? P.red : P.greenMid, 9);
          this.particles.spawnPopup(g.x, g.y - 8, '+' + pts, P.cyan);
          b.destroy();
          g.destroy();
          this.bullets.splice(i, 1);
          this.germs.splice(j, 1);
          break;
        }
      }
    }

    for (let k = this.germs.length - 1; k >= 0; k--) {
      const gg = this.germs[k];
      if (U.dist(this.player.x, this.player.y, gg.x, gg.y) < gg.radius + this.player.size * 0.4) {
        if (this.player.takeHit(audio)) {
          this.contamination = U.clamp(this.contamination + CFG.GERM.contactContam, 0, CFG.MAX_CONTAM);
          this.particles.spawnBurst(this.player.x, this.player.y, P.red, 10);
          this.particles.spawnPopup(this.player.x, this.player.y - 14, '-' + CFG.GERM.contactContam + '%', P.red);
        }
        gg.destroy();
        this.germs.splice(k, 1);
      }
    }

    for (let m = this.powerups.length - 1; m >= 0; m--) {
      const pu = this.powerups[m];
      if (U.dist(this.player.x, this.player.y, pu.x, pu.y) < pu.size * 0.7 + this.player.size * 0.4) {
        this.applyPowerUp(pu);
        pu.destroy();
        this.powerups.splice(m, 1);
      }
    }
  }

  private applyPowerUp(pu: PowerUp): void {
    if (pu.type === 'gel') {
      this.score += CFG.POWERUP.gelPoints;
      audio.gel();
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.gelPoints + ' GEL!', P.cyanMid);
      for (const g of this.germs) {
        this.particles.spawnBurst(g.x, g.y, P.red, 5);
        g.destroy();
      }
      this.germs.length = 0;
      this.particles.spawnBurst(pu.x, pu.y, P.cyanMid, 14);
    } else if (pu.type === 'vaccine') {
      this.score += CFG.POWERUP.vaccinePoints;
      audio.vaccine();
      this.contamination = Math.max(0, this.contamination - CFG.POWERUP.vaccineReduce);
      this.particles.spawnPopup(pu.x, pu.y - 8, '+' + CFG.POWERUP.vaccinePoints + ' VACINA!', P.yellow);
      this.particles.spawnBurst(pu.x, pu.y, P.yellow, 14);
    }
  }

  // ---- update / render ----
  private update(dt: number): void {
    if (this.state !== 'playing' || !this.running) return;
    if (this.phaseChanged) {
      this.phaseChanged = false;
      return;
    }

    this.elapsedTime += dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnGerm();
      this.spawnTimer = CFG.GERM.spawnRate[this.phase - 1];
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
          this.contamination = U.clamp(this.contamination + CFG.GERM.escapeContam, 0, CFG.MAX_CONTAM);
          audio.escape();
          this.particles.spawnBurst(U.clamp(g.x, 0, CFG.W), U.clamp(g.y, 0, CFG.H), P.red, 6);
        }
        g.destroy();
        this.germs.splice(j, 1);
      }
    }

    for (const pu of this.powerups) pu.update(dt);

    this.handleCollisions();
    this.particles.update(dt);
    audio.update(dt);

    if (this.contamination >= CFG.MAX_CONTAM || this.player.health <= 0) {
      this.contamination = CFG.MAX_CONTAM;
      this.gameOver();
      return;
    }
    if (this.phase === 3 && this.score >= CFG.PHASE_3_SCORE) {
      this.victory();
      return;
    }
    this.checkPhaseProgression();
  }

  private render(): void {
    drawBackground(this.bg, CFG.W, CFG.H, this.contamination, U.now());

    for (const pu of this.powerups) pu.draw();
    for (const g of this.germs) g.draw();
    for (const b of this.bullets) b.draw();

    if (this.state === 'playing' || this.state === 'phase') this.player.draw();

    this.particles.render();

    if (this.state === 'playing') this.hud.draw(this.stats());
  }
}
