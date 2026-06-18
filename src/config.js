/* global window */
(function (GH) {
  'use strict';

  /**
   * Central configuration: palette, canvas resolution, gameplay balance.
   * Single responsibility: hold tunable constants only.
   */
  var PALETTE = {
    bgDeep:    '#020d2a',
    bgDark:    '#0a0f2b',
    bgMid:     '#0e132a',
    bgPanel:   '#0c1128',
    grid:      '#0a1530',

    cyan:      '#07f5f5',
    cyanMid:   '#38cce9',
    cyanSoft:  '#2ed7e4',
    teal:      '#1c9ba6',
    tealDark:  '#235364',

    red:       '#d1201f',
    redDark:   '#9a2328',
    redDeep:   '#660f11',

    green:     '#aae36e',
    greenMid:  '#3c9e4f',
    greenDark: '#225b38',

    yellow:    '#f2d52c',
    text:      '#e5e7ea',
    textDim:   '#9a9ca6',
    textDark:  '#565a6b',

    charBlue:      '#3070c0',
    charBlueLight: '#4080d0',
    charBlueDark:  '#103060'
  };

  var CFG = {
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
    MAX_CONTAM: 100,

    PALETTE: PALETTE
  };

  GH.Config = CFG;
  GH.PALETTE = PALETTE;
})(window.GH = window.GH || {});
