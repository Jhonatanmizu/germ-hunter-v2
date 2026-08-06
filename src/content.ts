/**
 * Textos estáticos (português) e a narrativa do jogo.
 * Conta a história de Áureo Sol e do Doutor Juryscleitin.
 */

export type CutscenePage = {
  chapter: string;
  lines: string[];
  doutor: string;
};

export type PhaseNarrative = {
  chapter: string;
  title: string;
  objective: string;
  message: string;
  doutor: string;
};

export const STORY = {
  city: 'Áureo Sol',
  hero: 'Doutor Juryscleitin',
  heroRole: 'O último agente do Laboratório de Saneamento',
  title: 'A Queda de Áureo Sol',

  /** Cutscene com efeito de máquina de escrever (typewriter), página por página. */
  cutscene: [
    {
      chapter: 'NOITE DO TRANSBORDO',
      lines: [
        'Numa noite sem lua, o velho esgoto de Áureo Sol transbordou.',
        'Das profundezas vieram criaturas impossíveis: vírus e bactérias que aprenderam a andar e a caçar.',
        'Em 72 horas, os hospitais lotaram e os laboratórios fecharam as portas.'
      ],
      doutor: 'Isso não é um acidente... Algo lá embaixo está criando esses monstros.'
    },
    {
      chapter: 'O MANTO VERMELHO',
      lines: [
        'Uma névoa carmesim — o Manto Vermelho — começou a engolir a cidade, bairro por bairro.',
        'Cada germe que escapa espalha a contaminação. Cada rua coberta é uma rua perdida.',
        'Cem por cento de contaminação significa o fim de Áureo Sol.'
      ],
      doutor: 'Se o Manto cobrir tudo, não sobrará ninguém para salvar.'
    },
    {
      chapter: 'O ÚLTIMO AGENTE',
      lines: [
        'O Doutor Juryscleitin era o agente mais brilhante do Laboratório de Saneamento.',
        'Quando tudo fechou, ele construiu a pistola de soro — capaz de vaporizar germes no impacto.',
        'Agora ele é o último agente de pé na cidade.'
      ],
      doutor: 'Enquanto eu estiver de pé, Áureo Sol não cairá.'
    },
    {
      chapter: 'A MISSÃO',
      lines: [
        'Elimine os germes, aplique as vacinas e impeça o Manto Vermelho de avançar.',
        'E, se os rumores forem verdade, existe um Esporo-Mestre nas profundezas do esgoto — a fonte de tudo.',
        'Enfrente-o. Destrua-o. Salve a cidade.'
      ],
      doutor: 'Hora do trabalho, Doutor.'
    }
  ] as CutscenePage[],

  prologue: [
    'A cidade de Áureo Sol já foi famosa por suas praças floridas, seus hospitais brilhantes e o sorriso de seu povo.',
    'Mas numa noite sem lua, o esgoto transbordou. Vírus e bactérias mutantes invadiram as ruas. Os hospitais lotaram, os laboratórios fecharam. Em 72 horas, Áureo Sol entrou em quarentena.',
    'Uma névoa avermelhada — o Manto Vermelho — começou a engolir a cidade. Cada germe que escapa espalha a contaminação.',
    'Nos esgotos, algo maior desperta: o Esporo-Mestre, fonte de toda a infecção.'
  ],

  heroIntro:
    'O Doutor Juryscleitin construiu a pistola de soro que vaporiza germes. Sua missão: eliminar os germes, aplicar as vacinas e destruir o Esporo-Mestre antes que o Manto Vermelho cubra Áureo Sol para sempre.',

  chapters: ['CAPÍTULO 1', 'CAPÍTULO 2', 'CAPÍTULO 3'],

  phases: [
    {
      chapter: 'CAPÍTULO 1 — NOITE DO TRANSBORDO',
      title: 'Bairro dos Postos',
      objective: 'OBJETIVO: ELIMINE OS GERMES',
      message:
        'Os postos de saúde foram os primeiros a cair. Lave as mãos e elimine os germes antes que infectem os pacientes.',
      doutor: 'Primeiro, vamos limpar o Bairro dos Postos!'
    },
    {
      chapter: 'CAPÍTULO 2 — O MANTO VERMELHO',
      title: 'Centro Hospitalar',
      objective: 'OBJETIVO: SOBREVIVA AO SURTO',
      message:
        'O centro da cidade está em pleno surto. As vacinas são a única defesa contra o avanço do Manto Vermelho.',
      doutor: 'O Centro está em pleno surto. Cuidado com a contaminação!'
    },
    {
      chapter: 'CAPÍTULO 3 — O ESPORO-MESTRE',
      title: 'O Esgoto-Mestre',
      objective: 'OBJETIVO: DESTRUA O ESPORO-MESTRE',
      message:
        'Você chegou à fonte de tudo! O Esporo-Mestre desperta nas profundezas do esgoto. Derrote-o antes que o Manto Vermelho engula Áureo Sol para sempre.',
      doutor: 'É ele... A fonte de tudo. Destrua o Esporo-Mestre!'
    }
  ] as PhaseNarrative[],

  boss: {
    name: 'O ESPORO-MESTRE',
    subtitle: 'Guardião do Manto Vermelho',
    intro:
      'Das profundezas do esgoto, um gigante carmesim desperta. Seus projéteis são germes vivos — e podem ser destruídos com o soro.'
  },

  dialogues: {
    phaseStart: [
      'Fase limpa! Vamos para a próxima!',
      'Sem tempo para descansar, Doutor!'
    ],
    lowHealth: [
      'Isto está ficando perigoso!',
      'Só me restam poucas defesas...',
      'Uma chance, e o Manto me leva!'
    ],
    highContamination: [
      'A contaminação está subindo!',
      'Preciso de uma vacina, rápido!',
      'O Manto está quase sobre mim!'
    ],
    gel: [
      'Que gel milagroso!',
      'Germes, preparem-se!',
      'Água e sabão não, mas álcool 70% resolve!'
    ],
    vaccine: [
      'Vacina aplicada!',
      'Imunidade reforçada!',
      'Assim sim, sistema imune!'
    ],
    bossSpawn: [
      'É O ESPORO-MESTRE!',
      'Ali está a fonte de tudo!'
    ],
    bossStage2: [
      'Ele está enfraquecendo! Continue!',
      'Senti seu fôlego! Não pare!'
    ],
    bossStage3: [
      'Só mais um pouco!',
      'Ele está furioso — e vulnerável!'
    ],
    bossDefeated: [
      'ACABOU! O Manto vai recuar!'
    ]
  },

  ending: {
    title: 'CIDADE SALVA!',
    message:
      'O Esporo-Mestre foi destruído e o Manto Vermelho recuou! As luzes de Áureo Sol voltaram a acender e as ruas estão seguras. Graças ao Doutor Juryscleitin, a cidade renasceu!'
  },

  gameOverLine: 'O Manto Vermelho cobriu Áureo Sol... A cidade foi contaminada!',

  endless: {
    intro:
      'A quarentena não tem fim. Em Áureo Sol, o Manto Vermelho nunca recua — só cresce. Quantas ondas você consegue conter?',
    objective: 'SOBREVIVA ÀS ONDAS DO MANTO'
  }
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
    'Não compartilhar objetos pessoais como toalhas e copos evita a transmissão de doenças.',
    'O sono de qualidade fortalece o sistema imunológico contra infecções.'
  ],

  instructions: [
    { color: '#d1201f', border: '#9a2328', text: 'Atire nos <b>VÍRUS</b> vermelhos para eliminá-los (+15 pts)' },
    { color: '#3c9e4f', border: '#225b38', text: 'Atire nas <b>BACTÉRIAS</b> verdes para eliminá-las (+10 pts)' },
    { color: '#38cce9', border: '#1c9ba6', text: 'Pegue o <b>ÁLCOOL EM GEL</b> para eliminar todos os germes (+25 pts)' },
    { color: '#f2d52c', border: '#9e9b2f', text: 'Pegue a <b>VACINA</b> para reduzir a contaminação em 30% (+50 pts)' },
    { color: '#d1201f', border: '#660f11', text: 'Na <b>FASE 3</b>, destrua o <b>ESPORO-MESTRE</b>! Seus projéteis podem ser destruídos no ar.' }
  ],

  instructionFooter:
    'Não deixe os germes te alcançarem!<br>Se a contaminação chegar a <b>100%</b>, o Manto Vermelho dominará a cidade!',

  credits: [
    '<b>Caçador de Germes: Crônicas de Áureo Sol</b><br><br>Um jogo educativo sobre prevenção de doenças e higiene pessoal.',
    '<b>A História:</b><br>Áureo Sol foi contaminada por germes mutantes. O <b>Doutor Juryscleitin</b>, último agente do Laboratório de Saneamento, parte para destruir o Esporo-Mestre e salvar a cidade.',
    '<b>Desenvolvido por:</b><br>Jhonatanmizu',
    '<b>Arte e Programação:</b><br>Jhonatanmizu',
    '<b>Propósito:</b><br>Ensinar de forma divertida a importância da higiene e vacinação.'
  ],

  controls: 'WASD / Setas: mover &nbsp;•&nbsp; Mouse: mirar &nbsp;•&nbsp; Clique / Espaço: atirar &nbsp;•&nbsp; Shift / E: dash'
};

export type DialogueKey = keyof typeof STORY.dialogues;
