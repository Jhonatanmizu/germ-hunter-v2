/**
 * InputManager: teclado + mouse + toque (joystick virtual + botões).
 * Converte as coordenadas para a resolução interna do jogo (CFG.W/CFG.H).
 *
 * O disparo (mouse ou toque) é tratado via eventos pointerdown/up, porque
 * cancelar o pointerdown impede os eventos de compatibilidade (mousedown).
 */
export class InputManager {
  private keys: Record<string, boolean> = {};
  mouse = { x: 0, y: 0, down: false };
  private firePressed = false;
  private dashPressed = false;
  touchMode = false;

  // toque
  private joyId: number | null = null;
  private firePointerId: number | null = null;
  private joyOrigin = { x: 0, y: 0 };
  private joyVec = { x: 0, y: 0 };
  private touchFire = false;

  constructor(private canvas: HTMLCanvasElement, private scaleTo: { w: number; h: number }) {
    this.mouse.x = scaleTo.w / 2;
    this.mouse.y = scaleTo.h / 2;
    this.touchMode = this.detectTouch();
    this.bind();
  }

  private detectTouch(): boolean {
    return typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);
  }

  private toGame(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (this.scaleTo.w / rect.width);
    const y = (clientY - rect.top) * (this.scaleTo.h / rect.height);
    return { x, y };
  }

  private bind(): void {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (k === 'shift' || k === 'e') this.dashPressed = true;
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

    this.canvas.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault();
        const p = this.toGame(e.clientX, e.clientY);
        this.mouse.x = p.x;
        this.mouse.y = p.y;

        // metade esquerda no toque = joystick virtual
        if (e.pointerType === 'touch' && p.x < this.scaleTo.w * 0.62 && this.joyId === null) {
          this.joyId = e.pointerId;
          this.joyOrigin.x = p.x;
          this.joyOrigin.y = p.y;
          this.joyVec.x = 0;
          this.joyVec.y = 0;
          return;
        }

        // qualquer outro toque ou clique do mouse = atirar
        if (this.firePointerId === null) {
          this.firePointerId = e.pointerId;
          this.firePressed = true;
          this.mouse.down = true;
          if (e.pointerType === 'touch') this.touchFire = true;
        }
      },
      { passive: false }
    );

    this.canvas.addEventListener(
      'pointermove',
      (e) => {
        const p = this.toGame(e.clientX, e.clientY);
        if (this.joyId !== null && e.pointerId === this.joyId) {
          const dx = p.x - this.joyOrigin.x;
          const dy = p.y - this.joyOrigin.y;
          const maxR = 42;
          const d = Math.hypot(dx, dy) || 1;
          const cl = Math.min(d, maxR);
          this.joyVec.x = (dx / d) * (cl / maxR);
          this.joyVec.y = (dy / d) * (cl / maxR);
        } else {
          this.mouse.x = p.x;
          this.mouse.y = p.y;
        }
      },
      { passive: false }
    );

    const endPointer = (e: PointerEvent) => {
      if (e.pointerId === this.joyId) {
        this.joyId = null;
        this.joyVec.x = 0;
        this.joyVec.y = 0;
      }
      if (e.pointerId === this.firePointerId) {
        this.firePointerId = null;
        this.mouse.down = false;
        this.touchFire = false;
      }
    };
    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Posição atual do joystick virtual (para desenhar a UI). */
  joystick(): { origin: { x: number; y: number }; vec: { x: number; y: number } } | null {
    if (this.joyId === null) return null;
    return { origin: { ...this.joyOrigin }, vec: { ...this.joyVec } };
  }

  /** Mira automática (modo toque): define o alvo sem usar o mouse. */
  setAim(x: number, y: number): void {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  /** Botão externo (DOM) de atirar. */
  setExternalFire(on: boolean): void {
    this.touchFire = on;
    if (on) this.firePressed = true;
    else this.mouse.down = false;
  }

  /** Botão externo (DOM) de dash. */
  pressDash(): void {
    this.dashPressed = true;
  }

  /** Vetor de movimento normalizado (WASD/setas ou joystick). */
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
    if (dx === 0 && dy === 0 && (this.joyVec.x !== 0 || this.joyVec.y !== 0)) {
      return { x: this.joyVec.x, y: this.joyVec.y };
    }
    return { x: dx, y: dy };
  }

  consumeDash(): boolean {
    const d = this.dashPressed;
    this.dashPressed = false;
    return d;
  }

  consumeFire(): boolean {
    const p = this.firePressed || this.mouse.down;
    this.firePressed = false;
    return p;
  }

  isShootHeld(): boolean {
    return this.mouse.down || this.touchFire || !!this.keys[' '];
  }
}
