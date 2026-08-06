/**
 * Sistema de áudio: efeitos sonoros sintetizados + música via WebAudio.
 * Independente do PixiJS.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private pattern: { notes: number[]; tempo: number } | null = null;
  private musicIdx = 0;
  private musicTimer = 0;
  muted = false;

  init(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  private sweep(f1: number, f2: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.linearRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur);
  }

  shoot(): void {
    this.tone(720, 0.05, 'square', 0.05);
  }

  virus(): void {
    this.tone(880, 0.06, 'square', 0.08);
  }

  bacteria(): void {
    this.tone(440, 0.08, 'square', 0.08);
  }

  gel(): void {
    this.sweep(300, 1000, 0.2, 'square', 0.1);
  }

  vaccine(): void {
    this.tone(523, 0.08, 'triangle', 0.1, 0);
    this.tone(659, 0.08, 'triangle', 0.1, 0.06);
    this.tone(784, 0.12, 'triangle', 0.1, 0.12);
  }

  hit(): void {
    this.sweep(420, 160, 0.18, 'sawtooth', 0.07);
  }

  escape(): void {
    this.sweep(500, 120, 0.25, 'sawtooth', 0.06);
  }

  gameOver(): void {
    this.sweep(400, 50, 0.8, 'sawtooth', 0.08);
  }

  victory(): void {
    this.tone(523, 0.12, 'triangle', 0.1, 0);
    this.tone(659, 0.12, 'triangle', 0.1, 0.12);
    this.tone(784, 0.12, 'triangle', 0.1, 0.24);
    this.tone(1047, 0.25, 'triangle', 0.12, 0.36);
    this.tone(1319, 0.4, 'triangle', 0.12, 0.5);
  }

  phaseUp(): void {
    this.tone(523, 0.1, 'triangle', 0.1, 0);
    this.tone(659, 0.1, 'triangle', 0.1, 0.1);
    this.tone(784, 0.1, 'triangle', 0.1, 0.2);
    this.tone(1047, 0.2, 'triangle', 0.12, 0.3);
  }

  click(): void {
    this.tone(600, 0.03, 'square', 0.04);
  }

  private static MUSIC_PATTERNS: Record<number, { notes: number[]; tempo: number }> = {
    1: { notes: [262, 294, 330, 349, 330, 294, 262, 247], tempo: 0.28 },
    2: { notes: [262, 330, 392, 523, 392, 330, 262, 294], tempo: 0.22 },
    3: { notes: [262, 330, 392, 523, 659, 523, 392, 523], tempo: 0.16 }
  };

  startMusic(phase: number): void {
    this.pattern = AudioSystem.MUSIC_PATTERNS[phase] || AudioSystem.MUSIC_PATTERNS[1];
    this.musicIdx = 0;
    this.musicTimer = 0;
  }

  stopMusic(): void {
    this.pattern = null;
    this.musicIdx = 0;
    this.musicTimer = 0;
  }

  update(dt: number): void {
    if (!this.pattern || !this.ctx) return;
    this.musicTimer += dt;
    while (this.musicTimer >= this.pattern.tempo) {
      this.musicTimer -= this.pattern.tempo;
      const f = this.pattern.notes[this.musicIdx % this.pattern.notes.length];
      this.musicIdx++;
      this.tone(f, this.pattern.tempo * 0.7, 'square', 0.025);
      if (this.musicIdx % 3 === 0) this.tone(f * 1.5, this.pattern.tempo * 0.4, 'triangle', 0.015);
    }
  }
}

export const audio = new AudioSystem();
