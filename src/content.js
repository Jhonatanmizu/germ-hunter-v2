/* global window */
(function (GH) {
  'use strict';

  /**
   * Static text content (Portuguese) and educational data.
   * Single responsibility: keep all copy/curiosities here so screens can be
   * restyled without hunting for strings in logic.
   */
  var CONTENT = {
    title: 'CAÇADOR DE GERMES',
    subtitle: 'Missão Saúde',

    curiosities: [
      'Lavar as mãos com água e sabão reduz significativamente a transmissão de diversos microrganismos.',
      'As vacinas ajudam o sistema imunológico a reconhecer e combater doenças de forma eficaz.',
      'Cobrir a boca ao tossir ou espirrar ajuda a evitar a disseminação de germes no ambiente.',
      'O álcool em gel 70% é eficaz contra a maioria dos vírus e bactérias quando não há água e sabão disponíveis.',
      'Manter os ambientes ventilados reduz a concentração de microrganismos no ar.',
      'Não compartilhar objetos pessoais como toalhas e copos evita a transmissão de doenças.'
    ],

    phaseMessages: [
      '',
      'Lave as mãos frequentemente para evitar doenças.',
      'A vacinação ajuda a proteger você e a comunidade.',
      'Pequenas ações podem reduzir grandes surtos.'
    ],

    instructions: [
      { color: '#d1201f', border: '#9a2328', text: 'Atire nos <b>VÍRUS</b> vermelhos para eliminá-los (+15 pts)' },
      { color: '#3c9e4f', border: '#225b38', text: 'Atire nas <b>BACTÉRIAS</b> verdes para eliminá-las (+10 pts)' },
      { color: '#38cce9', border: '#1c9ba6', text: 'Pegue o <b>ÁLCOOL EM GEL</b> para eliminar todos os germes (+25 pts)' },
      { color: '#f2d52c', border: '#9e9b2f', text: 'Pegue a <b>VACINA</b> para reduzir a contaminação em 30% (+50 pts)' }
    ],

    instructionFooter:
      'Não deixe os germes te alcançarem!<br>Se a contaminação chegar a <b>100%</b>, a cidade será dominada!',

    credits: [
      '<b>Caçador de Germes: Missão Saúde</b><br><br>Um jogo educativo sobre prevenção de doenças e higiene pessoal.',
      '<b>Desenvolvido por:</b><br>Agentes da Saúde Digital',
      '<b>Arte e Programação:</b><br>Pixel Game Studio',
      '<b>Propósito:</b><br>Ensinar de forma divertida a importância da higiene e vacinação.'
    ],

    controls: 'WASD / Setas: mover &nbsp;•&nbsp; Mouse: mirar &nbsp;•&nbsp; Clique / Espaço: atirar'
  };

  GH.Content = CONTENT;
})(window.GH = window.GH || {});
