/**
 * InputManager: teclado + mouse + toque.
 * Converte as coordenadas para a resolução interna do jogo (CFG.W/CFG.H).
 */
export class InputManager {
  private keys: Record<string, boolean> = {};
  mouse = { x: 0, y: 0, down: false };
  private firePressed = false;

  constructor(private canvas: HTMLCanvasElement, private scaleTo: { w: number; h: number }) {
    this.mouse.x = scaleTo.w / 2;
    this.mouse.y = scaleTo.h / 2;
    this.bind();
  }

  private toGame(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (this.scaleTo.w / rect.width);
    const y = (clientY - rect.top) * (this.scaleTo.h / rect.height);
    return { x, y };
  }

  private bind(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key === 'Enter') {
        this.firePressed = true;
      }
      if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const p = this.toGame(e.clientX, e.clientY);
      this.mouse.x = p.x;
      this.mouse.y = p.y;
    });
    this.canvas.addEventListener('mousedown', () => {
      this.mouse.down = true;
      this.firePressed = true;
    });
    this.canvas.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.down = false;
    });

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const p = this.toGame(t.clientX, t.clientY);
        this.mouse.x = p.x;
        this.mouse.y = p.y;
        this.mouse.down = true;
        this.firePressed = true;
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const p = this.toGame(t.clientX, t.clientY);
        this.mouse.x = p.x;
        this.mouse.y = p.y;
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        this.mouse.down = false;
      },
      { passive: false }
    );
  }

  /** Vetor de movimento normalizado (WASD ou setas). */
  movement(): { x: number; y: number } {
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k['a'] || k['arrowleft']) dx -= 1;
    if (k['d'] || k['arrowright']) dx += 1;
    if (k['w'] || k['arrowup']) dy -= 1;
    if (k['s'] || k['arrowdown']) dy += 1;
    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }
    return { x: dx, y: dy };
  }

  consumeFire(): boolean {
    const p = this.firePressed || this.mouse.down;
    this.firePressed = false;
    return p;
  }

  isShootHeld(): boolean {
    return this.mouse.down || !!this.keys[' '];
  }
}
