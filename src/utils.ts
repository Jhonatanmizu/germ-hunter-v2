/** Funções utilitárias puras. */
export const U = {
  rand(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  },

  dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.hypot(x2 - x1, y2 - y1);
  },

  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  angle(x1: number, y1: number, x2: number, y2: number): number {
    return Math.atan2(y2 - y1, x2 - x1);
  },

  detSeed(v: number): number {
    return Math.abs(Math.sin(v * 127.1 + 311.7)) % 1;
  },

  now(): number {
    return performance.now() / 1000;
  },

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  },

  formatTimeShort(ts: number): string {
    const d = new Date(ts);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  }
};
