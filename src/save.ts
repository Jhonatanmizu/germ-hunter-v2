import type { Difficulty } from './config';

export interface SaveData {
  version: number;
  settings: {
    sfxVol: number;
    musicVol: number;
    muted: boolean;
    difficulty: Difficulty;
  };
  bestScore: number;
  endlessBest: number;
  highScores: { score: number; wave: number; mode: 'story' | 'endless'; date: number }[];
  stats: {
    runs: number;
    victories: number;
    totalGerms: number;
    totalGel: number;
    totalVaccine: number;
    totalDashes: number;
    totalScore: number;
    bestCombo: number;
    maxWave: number;
  };
  achievements: Record<string, number>;
  unlocks: string[];
}

const KEY = 'germ-hunter-v2-save';

const DEFAULTS: SaveData = {
  version: 2,
  settings: { sfxVol: 0.8, musicVol: 0.6, muted: false, difficulty: 'normal' },
  bestScore: 0,
  endlessBest: 0,
  highScores: [],
  stats: {
    runs: 0,
    victories: 0,
    totalGerms: 0,
    totalGel: 0,
    totalVaccine: 0,
    totalDashes: 0,
    totalScore: 0,
    bestCombo: 0,
    maxWave: 0
  },
  achievements: {},
  unlocks: []
};

let cache: SaveData | null = null;

function deepMerge(base: SaveData, patch: Partial<SaveData>): SaveData {
  const out = { ...base };
  out.settings = { ...base.settings, ...(patch.settings ?? {}) };
  out.stats = { ...base.stats, ...(patch.stats ?? {}) };
  out.highScores = patch.highScores ?? base.highScores;
  out.achievements = patch.achievements ?? base.achievements;
  out.unlocks = patch.unlocks ?? base.unlocks;
  out.bestScore = patch.bestScore ?? base.bestScore;
  out.endlessBest = patch.endlessBest ?? base.endlessBest;
  out.version = patch.version ?? base.version;
  return out;
}

export function loadSave(): SaveData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      cache = deepMerge(DEFAULTS, parsed);
      return cache;
    }
  } catch {
    // armazenamento indisponível ou corrompido
  }
  cache = { ...DEFAULTS, settings: { ...DEFAULTS.settings }, stats: { ...DEFAULTS.stats } };
  return cache;
}

export function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // ignora falhas de escrita
  }
}

export function save(): SaveData {
  if (!cache) loadSave();
  return cache as SaveData;
}

export function resetSave(): void {
  cache = { ...DEFAULTS, settings: { ...DEFAULTS.settings }, stats: { ...DEFAULTS.stats } };
  persist();
}

export function addHighScore(entry: SaveData['highScores'][number]): { placed: number } {
  const s = save();
  s.highScores.push(entry);
  s.highScores.sort((a, b) => b.score - a.score);
  s.highScores = s.highScores.slice(0, 10);
  persist();
  return { placed: s.highScores.indexOf(entry) + 1 };
}

export function recordBest(score: number, endless = false): boolean {
  const s = save();
  const prev = endless ? s.endlessBest : s.bestScore;
  if (score > prev && score > 0) {
    if (endless) s.endlessBest = score;
    else s.bestScore = score;
    persist();
    return true;
  }
  return false;
}

export function isUnlocked(id: string): boolean {
  return id in save().achievements;
}
