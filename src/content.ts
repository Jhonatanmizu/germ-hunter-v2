/**
 * Textos estáticos (português) e a narrativa do jogo.
 * Conta a história de Áureo Sol e do Doutor Juryscleitin.
 */
export const STORY = {
  city: 'Áureo Sol',
  hero: 'Doutor Juryscleitin',
  heroRole: 'O último agente do Laboratório de Saneamento',
  title: 'A Queda de Áureo Sol',

  prologue: [
    'A cidade de Áureo Sol já foi famosa por suas praças floridas, seus hospitais brilhantes e o sorriso de seu povo.',
    'Mas numa noite sem lua, o esgoto transbordou. Vírus e bactérias mutantes invadiram as ruas. Os hospitais lotaram, os laboratórios fecharam. Em 72 horas, Áureo Sol entrou em quarentena.',
    'Uma névoa avermelhada — o Manto Vermelho — começou a engolir a cidade. Cada germe que escapa espalha a contaminação.'
  ],

  heroIntro:
    'O Doutor Juryscleitin construiu a pistola de soro que vaporiza germes. Sua missão: eliminar os germes, aplicar as vacinas e descontaminar Áureo Sol antes que o Manto Vermelho cubra tudo.',

  phases: [
    {
      title: 'Bairro dos Postos',
      message:
        'Os postos de saúde foram os primeiros a cair. Lave as mãos e elimine os germes antes que infectem os pacientes.'
    },
    {
      title: 'Centro Hospitalar',
      message:
        'O centro da cidade está em pleno surto. As vacinas são a única defesa contra o avanço do Manto Vermelho.'
    },
    {
      title: 'O Esgoto-Mestre',
      message:
        'Você chegou à fonte de tudo! Destrua os germes na origem antes que o Manto Vermelho engula Áureo Sol para sempre.'
    }
  ],

  ending: {
    title: 'CIDADE SALVA!',
    message:
      'O Manto Vermelho recuou! As luzes de Áureo Sol voltaram a acender e as ruas estão seguras. Graças ao Doutor Juryscleitin, a cidade renasceu!'
  },

  gameOverLine: 'O Manto Vermelho cobriu Áureo Sol... A cidade foi contaminada!'
};

export const CONTENT = {
  title: 'CAÇADOR DE GERMES',
  subtitle: 'Crônicas de Áureo Sol',

  curiosities: [
    'Lavar as mãos com água e sabão reduz significativamente a transmissão de diversos microrganismos.',
    'As vacinas ajudam o sistema imunológico a reconhecer e combater doenças de forma eficaz.',
    'Cobrir a boca ao tossir ou espirrar ajuda a evitar a disseminação de germes no ambiente.',
    'O álcool em gel 70% é eficaz contra a maioria dos vírus e bactérias quando não há água e sabão disponíveis.',
    'Manter os ambientes ventilados reduz a concentração de microrganismos no ar.',
    'Não compartilhar objetos pessoais como toalhas e copos evita a transmissão de doenças.'
  ],

  instructions: [
    { color: '#d1201f', border: '#9a2328', text: 'Atire nos <b>VÍRUS</b> vermelhos para eliminá-los (+15 pts)' },
    { color: '#3c9e4f', border: '#225b38', text: 'Atire nas <b>BACTÉRIAS</b> verdes para eliminá-las (+10 pts)' },
    { color: '#38cce9', border: '#1c9ba6', text: 'Pegue o <b>ÁLCOOL EM GEL</b> para eliminar todos os germes (+25 pts)' },
    { color: '#f2d52c', border: '#9e9b2f', text: 'Pegue a <b>VACINA</b> para reduzir a contaminação em 30% (+50 pts)' }
  ],

  instructionFooter:
    'Não deixe os germes te alcançarem!<br>Se a contaminação chegar a <b>100%</b>, o Manto Vermelho dominará a cidade!',

  credits: [
    '<b>Caçador de Germes: Crônicas de Áureo Sol</b><br><br>Um jogo educativo sobre prevenção de doenças e higiene pessoal.',
    '<b>A História:</b><br>Áureo Sol foi contaminada por germes mutantes. O <b>Doutor Juryscleitin</b>, último agente do Laboratório de Saneamento, parte em uma missão para salvar a cidade.',
    '<b>Desenvolvido por:</b><br>Agentes da Saúde Digital',
    '<b>Arte e Programação:</b><br>Pixel Game Studio',
    '<b>Propósito:</b><br>Ensinar de forma divertida a importância da higiene e vacinação.'
  ],

  controls: 'WASD / Setas: mover &nbsp;•&nbsp; Mouse: mirar &nbsp;•&nbsp; Clique / Espaço: atirar'
};

export type PhaseNarrative = {
  title: string;
  message: string;
};
