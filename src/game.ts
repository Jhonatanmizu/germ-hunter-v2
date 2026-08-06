import { Application, Container, Graphics } from 'pixi.js';
import { CFG, P } from './config';
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
import { BossProjectile } from './entities/bossProjectile';
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

  private world = new Container();
  private bg = new Graphics();
  private germLayer = new Container();
  private bossLayer = new Container();
  private bossProjectileLayer = new Container();
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
  private bossProjectiles: BossProjectile[] = [];
  private boss: Boss | null = null;
  private bossDeathTimer = 0;
  private spawnTimer = 0;
  private gelTimer = 0;
  private vaccineTimer = 0;
  private phaseChanged = false;
  private dialogueCooldown = 0;
  private shakeT = 0;
  private shakeDur = 1;
  private shakeMag = 0;

  constructor(app: Application) {
    this.app = app;
    this.input = new InputManager(app.canvas, { w: CFG.W, h: CFG.H });
    this.player = new Player(CFG, this.playerLayer, this.bulletLayer);
    this.hud = new HUD(CFG.W, CFG.H);

    this.world.addChild(
      this.bg,
      this.powerupLayer,
      this.germLayer,
      this.bossLayer,
      this.bossProjectileLayer,
      this.bulletLayer,
      this.playerLayer,
      this.particles.container
    );
    app.stage.addChild(this.world, this.hud.container);
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
        else if (this.state === 'story') this.advanceCutscene();
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
    this.dialogueCooldown = 0;
    this.spawnTimer = CFG.GERM.spawnRate[this.phase - 1];
    if (this.phase === 3) {
      if (!this.boss) this.spawnBoss();
      this.say('bossSpawn');
    } else {
      this.say('phaseStart');
    }
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
    this.clearCombat();
    this.particles.clear();
    this.spawnTimer = 0;
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
    for (const bp of this.bossProjectiles) bp.destroy();
    this.bossProjectiles.length = 0;
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
    this.bossDeathTimer = 0;
  }

  private spawnBoss(): void {
    this.boss = new Boss(CFG, this.bossLayer);
    audio.bossRoar();
    this.shake(0.35, 3);
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
    this.hud.clearSubtitle();
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
      maxHealth: this.player.maxHealth,
      boss: this.boss && !this.boss.dead ? { hp: this.boss.hp, maxHp: this.boss.maxHp } : null
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
      this.clearEntities();
      this.clearCombat();
      this.showPhaseTransition(2);
      return true;
    }
    if (this.phase === 2 && this.score >= CFG.PHASE_2_SCORE) {
      this.phase = 3;
      this.phaseChanged = true;
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
          this.particles.spawnPopup(b.x, b.y - 8, '-1', P.red);
          b.destroy();
          this.bullets.splice(i, 1);
          this.shake(0.12, 1);
        }
      }
    }

    // balas do jogador vs germes
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

    // balas do jogador vs projéteis do chefe (destrutíveis)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (let j = this.bossProjectiles.length - 1; j >= 0; j--) {
        const bp = this.bossProjectiles[j];
        if (U.dist(b.x, b.y, bp.x, bp.y) < bp.radius + b.size) {
          this.particles.spawnBurst(bp.x, bp.y, bp.type === 'virus' ? P.red : P.greenMid, 6);
          audio.destroy();
          bp.destroy();
          b.destroy();
          this.bullets.splice(i, 1);
          this.bossProjectiles.splice(j, 1);
          break;
        }
      }
    }

    // projéteis do chefe vs jogador
    for (let k = this.bossProjectiles.length - 1; k >= 0; k--) {
      const bp = this.bossProjectiles[k];
      if (U.dist(this.player.x, this.player.y, bp.x, bp.y) < bp.radius + this.player.size * 0.4) {
        if (this.player.takeHit(audio)) {
          this.contamination = U.clamp(this.contamination + CFG.GERM.contactContam, 0, CFG.MAX_CONTAM);
          this.particles.spawnBurst(this.player.x, this.player.y, P.red, 10);
          this.particles.spawnPopup(this.player.x, this.player.y - 14, '-' + CFG.GERM.contactContam + '%', P.red);
          this.shake(0.22, 1.5);
        }
        bp.destroy();
        this.bossProjectiles.splice(k, 1);
      }
    }

    // germes vs jogador
    for (let k = this.germs.length - 1; k >= 0; k--) {
      const gg = this.germs[k];
      if (U.dist(this.player.x, this.player.y, gg.x, gg.y) < gg.radius + this.player.size * 0.4) {
        if (this.player.takeHit(audio)) {
          this.contamination = U.clamp(this.contamination + CFG.GERM.contactContam, 0, CFG.MAX_CONTAM);
          this.particles.spawnBurst(this.player.x, this.player.y, P.red, 10);
          this.particles.spawnPopup(this.player.x, this.player.y - 14, '-' + CFG.GERM.contactContam + '%', P.red);
          this.shake(0.22, 1.5);
        }
        gg.destroy();
        this.germs.splice(k, 1);
      }
    }

    // contato com o chefe
    if (this.boss && !this.boss.dead) {
      const boss = this.boss;
      if (U.dist(this.player.x, this.player.y, boss.x, boss.y) < boss.radius + this.player.size * 0.4) {
        if (this.player.takeHit(audio)) {
          this.contamination = U.clamp(this.contamination + CFG.BOSS.contactContam, 0, CFG.MAX_CONTAM);
          this.particles.spawnBurst(this.player.x, this.player.y, P.red, 12);
          this.particles.spawnPopup(this.player.x, this.player.y - 14, '-' + CFG.BOSS.contactContam + '%', P.red);
          this.shake(0.3, 2);
        }
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

  private applyPowerUp(pu: PowerUp): void {
    if (pu.type === 'gel') {
      this.score += CFG.POWERUP.gelPoints;
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
    if (this.phaseChanged) {
      this.phaseChanged = false;
      return;
    }

    this.elapsedTime += dt;
    this.dialogueCooldown -= dt;
    this.hud.tick(dt);
    if (this.shakeT > 0) this.shakeT -= dt;

    if (this.phase < 3) {
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

    if (this.boss) {
      const b = this.boss;
      b.update(dt, this.player, CFG);
      for (const p of b.pendingProjectiles) {
        const size = p.type === 'virus' ? 12 : 11;
        this.bossProjectiles.push(
          new BossProjectile(p.type, p.x, p.y, p.angle, p.speed, size, 7, this.bossProjectileLayer)
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

    for (let k = this.bossProjectiles.length - 1; k >= 0; k--) {
      const bp = this.bossProjectiles[k];
      if (bp.update(dt, CFG.W, CFG.H)) {
        bp.destroy();
        this.bossProjectiles.splice(k, 1);
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
    this.checkPhaseProgression();
  }

  private render(): void {
    drawBackground(this.bg, CFG.W, CFG.H, this.contamination, U.now());

    for (const pu of this.powerups) pu.draw();
    for (const g of this.germs) g.draw();
    if (this.boss) this.boss.draw();
    for (const bp of this.bossProjectiles) bp.draw();
    for (const b of this.bullets) b.draw();

    if (this.state === 'playing' || this.state === 'phase') this.player.draw();

    this.particles.render();

    if (this.state === 'playing') this.hud.draw(this.stats());

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
