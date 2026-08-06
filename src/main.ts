import { Application } from 'pixi.js';
import { CFG, P, type Difficulty } from './config';
import { loadAssets } from './assets';
import { Game } from './game';
import { save, persist } from './save';
import { audio } from './audio';

declare global {
  interface Window {
    game?: Game;
  }
}

/** Lê os controles de ajustes e aplica em save + áudio. */
function applySettingsFromDom(): void {
  const s = save();
  const sfx = (document.getElementById('set-sfx') as HTMLInputElement | null)?.value;
  const music = (document.getElementById('set-music') as HTMLInputElement | null)?.value;
  const mute = (document.getElementById('set-mute') as HTMLInputElement | null)?.checked;
  const diff = (document.getElementById('set-difficulty') as HTMLSelectElement | null)?.value as Difficulty | undefined;
  if (sfx !== undefined) s.settings.sfxVol = Number(sfx) / 100;
  if (music !== undefined) s.settings.musicVol = Number(music) / 100;
  if (mute !== undefined) s.settings.muted = mute;
  if (diff) s.settings.difficulty = diff;
  audio.setVolumes(s.settings.sfxVol, s.settings.musicVol, s.settings.muted);
  persist();
}

function wireSettings(): void {
  const els = ['set-sfx', 'set-music', 'set-mute', 'set-difficulty'];
  for (const id of els) {
    const el = document.getElementById(id);
    el?.addEventListener('input', applySettingsFromDom);
    el?.addEventListener('change', applySettingsFromDom);
  }
}

/** Ajusta o tamanho do jogo para preencher a janela inteira, preservando 3:2. */
function fitWrapper(): void {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return;
  const margin = 8;
  const maxW = window.innerWidth - margin * 2;
  const maxH = window.innerHeight - margin * 2;
  let w = maxW;
  let h = w * (2 / 3);
  if (h > maxH) {
    h = maxH;
    w = h * (3 / 2);
  }
  wrapper.style.width = Math.floor(w) + 'px';
  wrapper.style.height = Math.floor(h) + 'px';
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
  document.body.dataset.touch = game.input.touchMode ? 'true' : 'false';
  wireSettings();

  fitWrapper();
  window.addEventListener('resize', fitWrapper);
  window.addEventListener('orientationchange', fitWrapper);

  const loading = document.getElementById('loading-screen');
  if (loading) {
    loading.classList.add('done');
    setTimeout(() => loading.remove(), 600);
  }
}

void boot();
