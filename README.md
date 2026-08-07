# Caçador de Germes: Crônicas de Áureo Sol

Um arcade shooter educativo sobre prevenção de doenças e higiene pessoal. Controle o **Doutor Juryscleitin**, o último agente do Laboratório de Saneamento, e destrua o **Esporo-Mestre** antes que o Manto Vermelho engula a cidade.

Construído com **PixiJS + TypeScript + Vite**.

![Caçador de Germes](./Design_Canvas__Caçador_de_Germes.png)

---

## 📖 A História

A cidade de Áureo Sol já foi famosa por suas praças floridas e hospitais brilhantes. Mas numa noite sem lua, o esgoto transbordou: vírus e bactérias mutantes invadiram as ruas. Em 72 horas, a cidade entrou em quarentena.

Uma névoa avermelhada — o **Manto Vermelho** — começou a engolir a cidade, bairro por bairro. Cada germe que escapa espalha a contaminação. Nos esgotos, algo maior desperta: o **Esporo-Mestre**, a fonte de toda a infecção.

## 🎮 Modos de Jogo

| Modo | Descrição |
| --- | --- |
| **História** | 3 capítulos — *Noite do Transbordo*, *O Manto Vermelho* e *O Esporo-Mestre*. Elimine germes, sobreviva ao surto e derrote o chefão final para salvar a cidade. |
| **Sobrevivência** (∞) | Ondas infinitas no Manto Vermelho. A cada onda, os germes ficam mais fortes e numerosos. Quantas ondas você consegue conter? |

## 🕹️ Controles

| Ação | Teclado | Toque |
| --- | --- | --- |
| Mover | `WASD` / `Setas` | Arrastar |
| Mirar | Mouse | — |
| Atirar | `Clique` / `Espaço` | Botão 💉 (segurar) |
| Dash | `Shift` / `E` | Botão ⚡ |

## 🦠 Mecânicas

- **Contaminação** — se chegar a **100%**, o Manto Vermelho domina a cidade (fim de jogo).
- **Combo** — elimine germes em sequência para multiplicar a pontuação (até **x5**).
- **Power-ups**:
  - 🧴 **Álcool em gel** — elimina todos os germes da tela (+25 pts).
  - 💉 **Vacina** — reduz a contaminação em 30% (+50 pts).
- **Inimigos**:
  - 🦠 **Vírus** (vermelhos, +15 pts)
  - 🧫 **Bactérias** (verdes, +10 pts)
  - **Investidores**, **Cuspidores** e **Elites** aparecem conforme o jogo avança.
- **Boss**: o **Esporo-Mestre** atira projéteis vivos que podem ser destruídos com o soro.
- **Dificuldade** — Fácil, Normal ou Difícil (ajustável no menu).
- **Recordes** — top 10 de pontuações salvas no navegador.
- **13 conquistas** — como *Herói de Áureo Sol* (derrote o Esporo-Mestre) ou *Muralha Sanitária* (chegue à onda 20).

O progresso, recordes, conquistas e ajustes ficam salvos no `localStorage`.

## 🚀 Como executar

```bash
# instalar dependências
npm install

# ambiente de desenvolvimento (abre o navegador)
npm run dev

# build de produção (gera a pasta dist/)
npm run build

# pré-visualizar o build
npm run preview

# checagem de tipos
npm run typecheck
```

## 🛠️ Stack

- [PixiJS 8](https://pixijs.com/) — renderização 2D
- [TypeScript](https://www.typescriptlang.org/) — tipagem estática
- [Vite](https://vitejs.dev/) — bundler e dev server

## 📁 Estrutura do Projeto

```
src/
├── main.ts            # bootstrap: aplicação PixiJS, ajustes e layout
├── game.ts            # máquina de estados e lógica central do jogo
├── config.ts          # constantes de balanceamento e paleta de cores
├── content.ts         # narrativa, diálogos e textos (pt-BR)
├── achievements.ts    # definição e verificação de conquistas
├── save.ts            # persistência em localStorage
├── audio.ts           # efeitos sonoros e música (procedural)
├── input.ts           # teclado, mouse e toque
├── hud.ts             # HUD (vida, contaminação, pontuação, combo)
├── screens.ts         # telas de menu, pausa, game over, etc.
├── particles.ts       # sistema de partículas
├── background.ts      # cenário e efeitos de fundo
├── sprites.ts         # sprites procedurais
├── assets.ts          # carregamento de assets
├── utils.ts           # funções utilitárias
└── entities/
    ├── player.ts      # Doutor Juryscleitin
    ├── germ.ts        # vírus, bactérias e elites
    ├── boss.ts        # Esporo-Mestre
    ├── bullet.ts      # tiros do jogador
    ├── enemyShot.ts   # projéteis inimigos
    └── powerup.ts     # álcool em gel e vacinas
```

## 🎨 Assets

- `main_character.png` — sprite do personagem
- `src/assets/character.png` — sprite interno
- `Design_Canvas__Caçador_de_Germes.png` — arte conceitual
- `Germ_Hunter_Health_Arcade.pdf` — design do jogo

## 💡 Propósito

Ensinar de forma divertida a importância da **higiene** e da **vacinação** — lavar as mãos, cobrir a boca ao tossir, ventilar ambientes e manter uma boa imunidade são lições embutidas na jogabilidade e nas curiosidades do jogo.

## 👤 Créditos

**Desenvolvido por:** Jhonatanmizu
**Arte e Programação:** Jhonatanmizu
