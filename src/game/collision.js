// Çarpışma: daireler ve döndürülmüş kutular (2B, XZ düzlemi) + zemin yüksekliği
const CELL = 8;

export class Collision {
  constructor(){
    this.statics = [];       // {type:'c', x, z, r} | {type:'b', x, z, hw, hd, rot, cos, sin}
    this.dynamics = [];      // dönen fonksiyonlar: () => [{x,z,r}]
    this.grid = new Map();
    this.heightFns = [];     // (x, z) => yükseklik | yükseklik dizisi | null
    this.base = 0;           // hiçbir yüzey yoksa zemin
  }
  /** Engel bu yükseklikteki karakteri etkiliyor mu? (katlı yapılarda y0/y1 aralığı) */
  inRange(o, y){ return o.y0 == null || y == null || (y + 1.7 > o.y0 && y < o.y1); }
  key(ix, iz){ return ix * 73856093 ^ iz * 19349663; }
  insert(o){
    const ext = o.type === 'c' ? o.r : Math.hypot(o.hw, o.hd);
    const x0 = Math.floor((o.x - ext) / CELL), x1 = Math.floor((o.x + ext) / CELL);
    const z0 = Math.floor((o.z - ext) / CELL), z1 = Math.floor((o.z + ext) / CELL);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++){
      const k = this.key(ix, iz); let a = this.grid.get(k); if (!a){ a = []; this.grid.set(k, a); } a.push(o);
    }
    this.statics.push(o); return o;
  }
  circle(x, z, r, tag){ return this.insert({type:'c', x, z, r, tag, on:true}); }
  box(x, z, hw, hd, rot = 0, tag){ return this.insert({type:'b', x, z, hw, hd, rot, cos:Math.cos(rot), sin:Math.sin(rot), tag, on:true}); }
  /** Kutu listesi: eksen hizalı [x0, z0, x1, z1] */
  rect(x0, z0, x1, z1, tag){ return this.box((x0 + x1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0) / 2, Math.abs(z1 - z0) / 2, 0, tag); }
  near(x, z){
    const ix = Math.floor(x / CELL), iz = Math.floor(z / CELL), out = new Set();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++){ const a = this.grid.get(this.key(ix + dx, iz + dz)); if (a) a.forEach(o => out.add(o)); }
    return out;
  }
  /** Daire şeklindeki karakteri engellerden dışarı iter. */
  resolve(p, r, y){
    for (let iter = 0; iter < 3; iter++){
      let moved = false;
      for (const o of this.near(p.x, p.z)){
        if (!o.on || !this.inRange(o, y)) continue;
        if (o.type === 'c'){
          const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), m = o.r + r;
          if (d < m && d > 1e-5){ p.x = o.x + dx / d * m; p.z = o.z + dz / d * m; moved = true; }
        } else {
          // kutunun yerel koordinatlarına dönüştür
          const dx = p.x - o.x, dz = p.z - o.z;
          const lx = dx * o.cos - dz * o.sin, lz = dx * o.sin + dz * o.cos;
          const cx = Math.max(-o.hw, Math.min(o.hw, lx)), cz = Math.max(-o.hd, Math.min(o.hd, lz));
          let ex = lx - cx, ez = lz - cz, d = Math.hypot(ex, ez);
          if (d < r){
            let nx, nz;
            if (d > 1e-5){ nx = ex / d; nz = ez / d; }
            else { // merkez kutunun içinde: en yakın kenara it
              const px = o.hw - Math.abs(lx), pz = o.hd - Math.abs(lz);
              if (px < pz){ nx = Math.sign(lx) || 1; nz = 0; d = -px; } else { nx = 0; nz = Math.sign(lz) || 1; d = -pz; }
            }
            const push = r - d, wx = nx * o.cos + nz * o.sin, wz = -nx * o.sin + nz * o.cos;
            p.x += wx * push; p.z += wz * push; moved = true;
          }
        }
      }
      for (const fn of this.dynamics) for (const o of fn()){
        if (!this.inRange(o, y)) continue;
        const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), m = o.r + r;
        if (d < m && d > 1e-5){ p.x = o.x + dx / d * m; p.z = o.z + dz / d * m; moved = true; }
      }
      if (!moved) break;
    }
  }
  /** Noktadan geçen bir şey var mı? (para yerleşimi için) */
  blocked(x, z, r){
    const p = {x, z}; this.resolve(p, r); return Math.hypot(p.x - x, p.z - z) > 1e-3;
  }
  /** Kamera için: (x0,z0) -> (x1,z1) doğrusunda ilk engelin oranı (0..1). Alçak ve ince engeller yok sayılır. */
  rayClear(x0, z0, x1, z1, y){
    const N = 24;
    for (let i = 1; i <= N; i++){
      const t = i / N, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      for (const o of this.near(x, z)){
        if (!o.on || o.low || !this.inRange(o, y)) continue;
        if (o.type === 'c'){ if (o.r < 0.6) continue; if (Math.hypot(x - o.x, z - o.z) < o.r + 0.15) return Math.max(0, t - 1 / N); }
        else {
          if (Math.min(o.hw, o.hd) < 0.12) continue;
          const dx = x - o.x, dz = z - o.z, lx = dx * o.cos - dz * o.sin, lz = dx * o.sin + dz * o.cos;
          if (Math.abs(lx) < o.hw + 0.15 && Math.abs(lz) < o.hd + 0.15) return Math.max(0, t - 1 / N);
        }
      }
    }
    return 1;
  }
  /** Bulunulan yüksekliğe göre basılabilecek en yüksek yüzey (y verilmezse hepsi). */
  height(x, z, y){
    let h = -Infinity;
    for (const fn of this.heightFns){
      const v = fn(x, z); if (v == null) continue;
      if (Array.isArray(v)){ for (const q of v) if ((y == null || q <= y + 0.6) && q > h) h = q; }
      else if ((y == null || v <= y + 0.6) && v > h) h = v;
    }
    return h === -Infinity ? this.base : Math.max(h, this.base);
  }
  /** Önünde yürüyerek çıkılamayacak bir basamak/çıkıntı var mı? */
  ledge(x, z, y){
    for (const fn of this.heightFns){
      const v = fn(x, z); if (v == null) continue;
      for (const q of (Array.isArray(v) ? v : [v])) if (q > y + 0.6 && q < y + 1.9) return true;
    }
    return false;
  }
}

/** Dünya düzenine göre sabit engelleri ve zemin yüksekliğini kurar. */
export function buildWorldCollision(world){
  const C = new Collision(), { colliders, TEMPLE, CZ } = world;
  colliders.boxes.forEach(b => { C.box(b.x, b.z, b.hw, b.hd, b.rot).low = true; });
  colliders.circles.forEach(c => { C.circle(c.x, c.z, c.r).low = true; });
  // şato gövdesi
  C.rect(-7, CZ - 9, 7, CZ + 9.6);
  [-1, 1].forEach(sx => {
    C.rect(sx * 7, CZ - 7, sx * 21, CZ + 7);
    C.rect(sx * 21, CZ - 9, sx * 31, CZ + 9);
    C.circle(sx * 31.6, CZ - 9.2, 3.5); C.circle(sx * 31.6, CZ + 9.2, 3.5);
    // teras korkuluğu (merdiven boşluğu hariç)
    C.rect(sx * 6.2, -24.45, sx * 34.6, -24.05);
  });
  // ahır ve çit (güneyde kapı boşluğu)
  C.rect(-71, -13, -61, 21);
  const fx0 = -58, fx1 = -44, fz0 = -12, fz1 = 22;
  C.rect(fx0, fz0 - 0.1, fx1, fz0 + 0.1);
  C.rect(fx0, fz1 - 0.1, -53, fz1 + 0.1); C.rect(-49, fz1 - 0.1, fx1, fz1 + 0.1);
  C.rect(fx0 - 0.1, fz0, fx0 + 0.1, fz1); C.rect(fx1 - 0.1, fz0, fx1 + 0.1, fz1);
  // fıskiye
  C.circle(0, 10, 4.8, 'fiskiye');
  // tapınak sütunları ve kaide
  for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 + Math.PI / 10; C.circle(TEMPLE.x + Math.cos(a) * 5.3, TEMPLE.z + Math.sin(a) * 5.3, 0.48); }
  C.circle(TEMPLE.x, TEMPLE.z, 1.4, 'kaide');
  // dünya sınırı (görünmez duvar)
  C.dynamics.push(() => []);

  // zemin: teras + merdiven, tapınak basamakları
  C.heightFns.push((x, z) => {
    if (x > -35 && x < 35 && z > -31.5 && z < -24) return 1.0;
    if (Math.abs(x) < 6 && z >= -24 && z < -22) return Math.min(1, Math.ceil((-22 - z) / 0.5) * 0.25);
    return null;
  });
  C.heightFns.push((x, z) => {
    const r = Math.hypot(x - TEMPLE.x, z - TEMPLE.z);
    if (r < 6.8) return 1.2; if (r < 7.6) return 0.8; if (r < 8.4) return 0.4; return null;
  });
  return C;
}
