/**
 * Paleta de cores (números para o PixiJS) e constantes de balanceamento.
 */
export const P = {
  bgDeep: 0x020d2a,
  bgDark: 0x0a0f2b,
  bgMid: 0x0e132a,
  bgPanel: 0x0c1128,
  grid: 0x0a1530,

  cyan: 0x07f5f5,
  cyanMid: 0x38cce9,
  cyanSoft: 0x2ed7e4,
  teal: 0x1c9ba6,
  tealDark: 0x235364,

  red: 0xd1201f,
  redDark: 0x9a2328,
  redDeep: 0x660f11,

  green: 0xaae36e,
  greenMid: 0x3c9e4f,
  greenDark: 0x225b38,

  yellow: 0xf2d52c,
  text: 0xe5e7ea,
  textDim: 0x9a9ca6,
  textDark: 0x565a6b,

  charBlue: 0x3070c0,
  charBlueLight: 0x4080d0,
  charBlueDark: 0x103060
} as const;

export const CFG = {
  W: 480,
  H: 320,

  PLAYER: {
    size: 30,
    speed: 110,
    maxHealth: 5,
    invulnTime: 1.0,
    fireRate: 0.28,
    bulletSpeed: 260
  },

  BULLET: {
    size: 5,
    life: 1.4,
    damage: 1
  },

  GERM: {
    sprite: 26,
    bacteriaPoints: 10,
    virusPoints: 15,
    bacteriaSpeed: [34, 48, 62],
    virusSpeed: [54, 72, 96],
    maxGerms: [6, 9, 13],
    spawnRate: [1.15, 0.85, 0.58],
    bacteriaChance: [0.65, 0.55, 0.45],
    contactContam: 8,
    escapeContam: 6
  },

  POWERUP: {
    gelPoints: 25,
    vaccinePoints: 50,
    gelInterval: 12,
    vaccineInterval: 25,
    vaccineReduce: 30,
    maxOnScreen: 3
  },

  PHASE_1_SCORE: 200,
  PHASE_2_SCORE: 500,
  PHASE_3_SCORE: 1000,
  MAX_CONTAM: 100
} as const;

export type Palette = typeof P;
