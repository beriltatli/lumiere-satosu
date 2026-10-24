// Ada zemini: stilize ABD ana hattı (Fourier serisine çevrilip makeCoast'a verilir, böylece okyanus
// gölgelendiricisi ve kıyı sınırı Lumière/Yùlóng ile aynı mekanizmayı kullanır), yükseklik haritası,
// Michigan Gölü, Mississippi Nehri ve bölge düzlemeleri.
import { makeCoast } from '../../coast.js';
import { fbm, smooth } from './Rng.js';

export const AMERICA = {x:-600, z:1020};

// Yerel ana hat (x doğu, z güney). Golden Gate için batı kıyısında bir körfez ağzı, güneydoğuda Florida.
const OUTLINE = [
  [-338, -236], [-300, -242], [-150, -238], [0, -242], [90, -234], [150, -208], [230, -216], [270, -234], [318, -228], [352, -198],
  [342, -160], [334, -150], [340, -128], [320, -108], [344, -90], [328, -70], [324, -32], [302, 8], [298, 60], [284, 104], [270, 132],
  [258, 165], [276, 205], [286, 244], [264, 276], [232, 258], [214, 216], [196, 186], [170, 176], [140, 186], [110, 177], [60, 183],
  [26, 212], [10, 254], [-20, 212], [-70, 172], [-150, 166], [-215, 160], [-262, 150], [-300, 112], [-322, 62], [-334, -5],
  [-318, -12], [-292, -22], [-282, -32], [-292, -44], [-318, -50], [-336, -56], [-340, -82], [-346, -160],
];

/** Ana hattı merkezden yarıçap fonksiyonuna, sonra Lanczos yumuşatmalı Fourier serisine çevirir. */
function fourier(K = 56, N = 1440){
  const r = new Float64Array(N);
  for (let i = 0; i < N; i++){
    const a = i / N * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    let best = 0;
    for (let k = 0; k < OUTLINE.length; k++){
      const [x1, z1] = OUTLINE[k], [x2, z2] = OUTLINE[(k + 1) % OUTLINE.length];
      const ex = x2 - x1, ez = z2 - z1, den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
      const t = (x1 * ez - z1 * ex) / den, u = (x1 * dz - z1 * dx) / den;
      if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
    }
    r[i] = best;
  }
  let a0 = 0; for (let i = 0; i < N; i++) a0 += r[i]; a0 /= N;
  const waves = [];
  for (let n = 1; n <= K; n++){
    let a = 0, b = 0; for (let i = 0; i < N; i++){ const ang = i / N * Math.PI * 2; a += r[i] * Math.cos(n * ang); b += r[i] * Math.sin(n * ang); }
    const x = n / (K + 1), sig = Math.sin(Math.PI * x) / (Math.PI * x);
    a *= 2 / N * sig; b *= 2 / N * sig;
    const A = Math.hypot(a, b); if (A > 0.05) waves.push([n, A, Math.atan2(a, b)]);
  }
  return {radius:a0, waves};
}
const F = fourier();
export const AMERICA_COAST = makeCoast({cx:AMERICA.x, cz:AMERICA.z, radius:F.radius, waves:F.waves, ripple:[[71, 1.1, 0.3], [97, 0.6, 1.7]], fn:'coastUS'});

// Mississippi (yerel): kuzeyden Meksika Körfezi'ne
export const RIVER = [[18, -246], [34, -170], [30, -90], [32, -12], [46, 58], [80, 118], [114, 158], [134, 198]];
export const LAKE = {x:206, z:-170, rx:21, rz:46};

function segDist(px, pz, pts){
  let best = 1e9, along = 0, acc = 0, bestAlong = 0;
  for (let i = 0; i + 1 < pts.length; i++){
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, l = Math.sqrt(l2);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)), d = Math.hypot(px - ax - dx * t, pz - az - dz * t);
    if (d < best){ best = d; bestAlong = acc + t * l; }
    acc += l;
  }
  along = bestAlong;
  return {d:best, along};
}

export class Terrain {
  /** flats: [{x0, z0, x1, z1, y, feather}] bölge düzlemeleri; hills: [[x, z, yükseklik, σ]] */
  constructor({flats = [], hills = [], ridges = [], desert = null} = {}){
    this.flats = flats; this.hills = hills; this.ridges = ridges; this.desert = desert;
    this.x0 = -362; this.z0 = -252; this.cell = 2; this.nx = 368; this.nz = 268;
    this.h = new Float32Array(this.nx * this.nz);
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++) this.h[j * this.nx + i] = this.raw(this.x0 + i * this.cell, this.z0 + j * this.cell);
  }
  coastDist(lx, lz){ return AMERICA_COAST.dist(AMERICA.x + lx, AMERICA.z + lz); }
  river(lx, lz){ return segDist(lx, lz, RIVER); }
  inLake(lx, lz, m = 0){ return ((lx - LAKE.x) / (LAKE.rx + m)) ** 2 + ((lz - LAKE.z) / (LAKE.rz + m)) ** 2 < 1; }
  /** Analitik yükseklik (yerel); ızgara bundan bir kez örneklenir. */
  raw(x, z){
    let h = (fbm(x / 70, z / 70, 3, 11) - 0.5) * 3.2;
    for (const [hx, hz, H, s] of this.hills) h += H * Math.exp(-((x - hx) ** 2 + (z - hz) ** 2) / (2 * s * s)) * (0.8 + 0.4 * fbm(x / 25, z / 25, 2, 5));
    for (const r of this.ridges){ const {d} = segDist(x, z, r.pts); h += r.h * Math.exp(-(d * d) / (2 * r.w * r.w)) * (0.6 + 0.8 * fbm(x / 30, z / 30, 3, 7)); }
    // bölge düzlemeleri (kenarda yumuşak geçiş)
    for (const f of this.flats){
      const dx = Math.max(f.x0 - x, 0, x - f.x1), dz = Math.max(f.z0 - z, 0, z - f.z1), d = Math.hypot(dx, dz);
      const m = 1 - smooth(0, f.feather || 18, d); if (m > 0) h = h + (f.y - h) * m;
    }
    // göl ve nehir yatağı
    const lk = ((x - LAKE.x) / LAKE.rx) ** 2 + ((z - LAKE.z) / LAKE.rz) ** 2;
    if (lk < 1.6) h = Math.min(h, -3 + smooth(0.75, 1.5, lk) * (h + 3));
    const {d} = segDist(x, z, RIVER); if (d < 14) h = Math.min(h, -2.4 + smooth(5, 12, d) * (h + 2.4));
    // kıyıda sıfıra in (kumsal halkası y = 0)
    const cd = -this.coastDist(x, z);
    return h * smooth(10, 42, cd);
  }
  /** Izgaradan çift doğrusal örnek (yerel). */
  at(lx, lz){
    const fx = (lx - this.x0) / this.cell, fz = (lz - this.z0) / this.cell, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= this.nx - 1 || j >= this.nz - 1) return 0;
    const u = fx - i, v = fz - j, k = j * this.nx + i, H = this.h;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + this.nx] * (1 - u) + H[k + this.nx + 1] * u) * v;
  }
  /** Ayak izinin en alçak noktası (bina tabanı buraya oturur, eğimde basamaklanır). */
  minUnder(lx, lz, w, d, rot = 0){
    const c = Math.cos(rot), s = Math.sin(rot); let m = Infinity;
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 0]]){ const x = a * w / 2, z = b * d / 2; m = Math.min(m, this.at(lx + x * c + z * s, lz - x * s + z * c)); }
    return m;
  }
  isDesert(lx, lz){ const D = this.desert; return D ? Math.hypot((lx - D.x) / D.rx, (lz - D.z) / D.rz) : 9; }

  /** Zemin ağı: 4 m örnekleme, kıyının 12 m gerisinde kesilir; bölgeye göre köşe renkleri. */
  mesh(THREE, groundMap, colorAt){
    const step = 2, sx = Math.ceil((this.nx - 1) / step), sz = Math.ceil((this.nz - 1) / step);
    const pos = [], uv = [], col = [], idx = [], keep = [];
    for (let j = 0; j <= sz; j++) for (let i = 0; i <= sx; i++){
      // kıyıya yakın zemin kum halkasının (y = 0.035) biraz altında kalır: aynı düzlemde titreşme olmasın
      const lx = this.x0 + Math.min(i * step, this.nx - 1) * this.cell, lz = this.z0 + Math.min(j * step, this.nz - 1) * this.cell, cdv = -this.coastDist(lx, lz), y = this.at(lx, lz) - 0.08 * (1 - smooth(18, 34, cdv));
      const wx = AMERICA.x + lx, wz = AMERICA.z + lz;
      pos.push(wx, y, wz); uv.push((wx + 1200) / 2400, (1200 - wz) / 2400);
      const c = colorAt(lx, lz, y); col.push(c.r, c.g, c.b);
      keep.push(cdv > 12);
    }
    const row = sx + 1;
    for (let j = 0; j < sz; j++) for (let i = 0; i < sx; i++){
      const a = j * row + i, b = a + row;
      if (keep[a] && keep[a + 1] && keep[b] && keep[b + 1]) idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({map:groundMap, vertexColors:true, roughness:1}));
    m.receiveShadow = true; m.name = 'AmerikaZemin';
    return m;
  }
}
