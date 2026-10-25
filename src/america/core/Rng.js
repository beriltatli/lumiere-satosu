// Tohumlu rastgelelik ve gürültü: aynı tohum her açılışta aynı şehri kurar.

export class Rng {
  constructor(seed = 1){ this.s = (seed >>> 0) || 1; }
  /** mulberry32 */
  next(){ let t = (this.s += 0x6d2b79f5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b){ return a + (b - a) * this.next(); }
  int(a, b){ return Math.floor(this.range(a, b + 1)); }
  pick(arr){ return arr[Math.floor(this.next() * arr.length)]; }
  chance(p){ return this.next() < p; }
  /** Ağırlıklı seçim: {anahtar: ağırlık} */
  weighted(map){ let tot = 0; for (const k in map) tot += map[k]; let r = this.next() * tot; for (const k in map){ r -= map[k]; if (r <= 0) return k; } return Object.keys(map)[0]; }
  fork(n = 1){ return new Rng(Math.floor(this.next() * 4294967295) ^ (n * 2654435761)); }
}

/** Tamsayı ızgara noktası için deterministik [0, 1) değer. */
export function hash2(x, z, s = 0){
  let h = Math.imul((x | 0) ^ 0x27d4eb2d, 0x165667b1) ^ Math.imul((z | 0) + s * 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Yumuşak değer gürültüsü, yaklaşık [0, 1]. */
export function noise2(x, z, s = 0){
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, s), b = hash2(ix + 1, iz, s), c = hash2(ix, iz + 1, s), d = hash2(ix + 1, iz + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, oct = 3, s = 0){ let a = 0, f = 1, w = 0.5, n = 0; for (let i = 0; i < oct; i++){ a += noise2(x * f, z * f, s + i) * w; n += w; f *= 2; w *= 0.5; } return a / n; }
export const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
