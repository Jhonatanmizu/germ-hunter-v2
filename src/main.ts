import { Application } from 'pixi.js';
import { CFG, P } from './config';
import { loadAssets } from './assets';
import { Game } from './game';

declare global {
  interface Window {
    game?: Game;
  }
}

async function boot(): Promise<void> {
  await loadAssets();
  try {
    await document.fonts.load('10px "Press Start 2P"');
  } catch {
    // a fonte é opcional; o jogo segue com fallback
  }

  const app = new Application();
  await app.init({
    width: CFG.W,
    height: CFG.H,
    background: P.bgDeep,
    antialias: false,
    resolution: 1
  });

  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';

  const host = document.getElementById('game-host');
  if (host) host.appendChild(app.canvas);

  const game = new Game(app);
  game.init();
  window.game = game;
}

void boot();
