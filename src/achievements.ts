import { save, persist, isUnlocked } from './save';

export interface Achievement {
  id: string;
  icon: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primeiro_germe', icon: '🦠', name: 'Primeiro Abate', desc: 'Elimine seu primeiro germe.' },
  { id: 'matador_100', icon: '💥', name: 'Matador de Germes', desc: 'Elimine 100 germes no total.' },
  { id: 'matador_500', icon: '☠️', name: 'Saneador Lendário', desc: 'Elimine 500 germes no total.' },
  { id: 'vacinado', icon: '💉', name: 'Imunizado', desc: 'Pegue sua primeira vacina.' },
  { id: 'primeiro_gel', icon: '🧴', name: 'Gel Milagroso', desc: 'Pegue seu primeiro álcool em gel.' },
  { id: 'mestre_dash', icon: '⚡', name: 'Mestre do Esquive', desc: 'Use o dash 100 vezes no total.' },
  { id: 'combo_5', icon: '🔥', name: 'Fúria Contagiante', desc: 'Atinga o multiplicador máximo de combo (x5).' },
  { id: 'sem_dano_fase', icon: '🛡️', name: 'Intocável', desc: 'Complete uma fase sem levar dano.' },
  { id: 'campeao', icon: '🏆', name: 'Herói de Áureo Sol', desc: 'Derrote o Esporo-Mestre e salve a cidade.' },
  { id: 'sobrevivente_10', icon: '🌊', name: 'Sobrevivente', desc: 'Alcance a onda 10 no Modo Sobrevivência.' },
  { id: 'sobrevivente_20', icon: '🌪️', name: 'Muralha Sanitária', desc: 'Alcance a onda 20 no Modo Sobrevivência.' },
  { id: 'rico_5k', icon: '💰', name: 'Bem Financiado', desc: 'Faça 5000 pontos em uma única partida.' },
  { id: 'maratonista', icon: '⏱️', name: 'Maratonista', desc: 'Jogue 10 partidas.' }
];

export interface AchievementContext {
  germsKilled: number;
  gel: number;
  vaccine: number;
  dashes: number;
  bestCombo: number;
  victory: boolean;
  phaseNoHit: boolean;
  score: number;
  maxWave: number;
}

/** Verifica conquistas e retorna as recém-desbloqueadas. */
export function checkAchievements(ctx: AchievementContext): string[] {
  const s = save();
  const st = s.stats;
  const unlocked: string[] = [];
  const tryUnlock = (id: string, ok: boolean) => {
    if (ok && !isUnlocked(id)) {
      s.achievements[id] = Date.now();
      unlocked.push(id);
    }
  };

  tryUnlock('primeiro_germe', st.totalGerms + ctx.germsKilled >= 1);
  tryUnlock('matador_100', st.totalGerms + ctx.germsKilled >= 100);
  tryUnlock('matador_500', st.totalGerms + ctx.germsKilled >= 500);
  tryUnlock('vacinado', st.totalVaccine + ctx.vaccine >= 1);
  tryUnlock('primeiro_gel', st.totalGel + ctx.gel >= 1);
  tryUnlock('mestre_dash', st.totalDashes + ctx.dashes >= 100);
  tryUnlock('combo_5', Math.max(st.bestCombo, ctx.bestCombo) >= 5);
  tryUnlock('sem_dano_fase', ctx.phaseNoHit);
  tryUnlock('campeao', ctx.victory);
  tryUnlock('sobrevivente_10', Math.max(st.maxWave, ctx.maxWave) >= 10);
  tryUnlock('sobrevivente_20', Math.max(st.maxWave, ctx.maxWave) >= 20);
  tryUnlock('rico_5k', ctx.score >= 5000);
  tryUnlock('maratonista', st.runs + 1 >= 10);

  if (unlocked.length) persist();
  return unlocked;
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
