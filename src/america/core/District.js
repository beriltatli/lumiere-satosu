// Bölge: parselleme (ızgara ya da organik), yoğunluk ve yükseklik fonksiyonu, stil karışımı, LOD grupları.
//  ızgara:  Manhattan 70×20 m blok, 12 m cadde (avenue), 8 m sokak; Chicago 60×60 m blok + 6 m ara sokak (alley).
//  organik: ızgara köşeleri gürültüyle bükülür (Boston, New Orleans); sokaklar bükülmüş kenarlar, parseller kenar boyunca.
//  yükseklik: h = hMin + (hMax − hMin) · exp(−d² / 2σ²) · (0.75 + 0.5 · gürültü) · kenar (tampon şeridinde smoothstep).
import { Rng, noise2, smooth } from './Rng.js';
import { Batcher } from './Batcher.js';
import { Skyscraper } from '../typologies/Skyscraper.js';
import { Rowhouse } from '../typologies/Rowhouse.js';
import { Courtyard } from '../typologies/Courtyard.js';
import { Villa } from '../typologies/Villa.js';
import { Diner } from '../typologies/Diner.js';

const TYPO = {skyscraper:Skyscraper, rowhouse:Rowhouse, courtyard:Courtyard, villa:Villa, diner:Diner};
const NAMES = ['STARLIGHT', 'NEPTUNE', 'COLONY', 'SANDS', 'FLAMINGO', 'BREAKERS', 'TIDES', 'PALMS', 'CORAL', 'SEAGULL', 'ORCHID', 'MARLIN'];

export class District {
  constructor(spec, X){
    Object.assign(this, spec); this.X = X;
    this.rng = new Rng(spec.seed || 1);
    this.lots = []; this.parks = spec.parks || []; this.structures = [];
    this.centerW = {x:X.AX + spec.center.x, z:X.AZ + spec.center.z};
  }
  /** Yükseklik: merkezden azalan Gauss, gürültü, tampon şeridinde yumuşak düşüş (yerel koordinat) */
  heightAt(lx, lz){
    const H = this.height, dx = lx - (H.cx ?? this.center.x), dz = lz - (H.cz ?? this.center.z), d2 = dx * dx + dz * dz;
    const r = this.rect, edgeD = Math.min(lx - r.x0, r.x1 - lx, lz - r.z0, r.z1 - lz);
    const edge = smooth(0, this.buffer || 18, edgeD);
    const n = noise2(lx / 23, lz / 23, this.seed || 1);
    return H.min + (H.max - H.min) * Math.exp(-d2 / (2 * H.sigma * H.sigma)) * (0.75 + 0.5 * n) * (0.35 + 0.65 * edge);
  }
  /** Bu yüksekliğe uyan stillerden karışım oranıyla seç */
  pickStyle(h, r){
    const S = this.X.styles, mix = {};
    for (const k in this.mix){ const st = S[k]; if (st && h >= st.heights[0] * 0.8 && h <= st.heights[1] * 1.15) mix[k] = this.mix[k]; }
    let id = Object.keys(mix).length ? r.weighted(mix) : null;
    if (!id){ let best = 1e9; for (const k in this.mix){ const st = S[k], dd = h < st.heights[0] ? st.heights[0] - h : h - st.heights[1]; if (dd < best){ best = dd; id = k; } } }
    return S[id];
  }
  inPark(x0, z0, x1, z1){ return this.parks.some(p => x0 < p.x1 && x1 > p.x0 && z0 < p.z1 && z1 > p.z0); }
  lot(lx, lz, w, d, rot, extra = {}){
    const r = this.rng, h0 = this.heightAt(lx, lz), st = extra.style || this.pickStyle(h0, r);
    const h = Math.max(st.heights[0], Math.min(st.heights[1], h0));
    const L = Object.assign({cx:this.X.AX + lx, cz:this.X.AZ + lz, lx, lz, w, d, rot, h, hMinAbs:st.heights[0], style:st, district:this.id, seed:r.int(1, 1e6)}, extra);
    this.lots.push(L); return L;
  }

  /* ================= parselleme ================= */
  plan(){
    if (this.kind === 'grid') this.planGrid();
    else if (this.kind === 'organic') this.planOrganic();
    else if (this.kind === 'strip') this.planStrip();
    return this.lots;
  }
  planGrid(){
    const {rect:R, block, avenue, street, alley = 0} = this, r = this.rng;
    this.cols = []; this.rows = [];
    for (let x = R.x0; x + block.w <= R.x1 + 0.1; x += block.w + avenue) this.cols.push([x, x + block.w]);
    for (let z = R.z0; z + block.d <= R.z1 + 0.1; z += block.d + street) this.rows.push([z, z + block.d]);
    this.blocks = [];
    for (const [bx0, bx1] of this.cols) for (const [bz0, bz1] of this.rows){
      const B = {x0:bx0, x1:bx1, z0:bz0, z1:bz1}; this.blocks.push(B);
      if (this.inPark(bx0, bz0, bx1, bz1) || this.skip && this.skip(B)){ B.park = true; continue; }
      const hc = this.heightAt((bx0 + bx1) / 2, (bz0 + bz1) / 2);
      if (alley){
        // Chicago: blok ortasından kuzey-güney ara sokak; iki yarı doğu ve batı caddelerine bakar
        const half = (block.w - alley) / 2;
        [[bx0, bx0 + half, -Math.PI / 2], [bx1 - half, bx1, Math.PI / 2]].forEach(([a, b, rot]) => {
          for (let z = bz0; z < bz1 - 8;){ const w = Math.min(bz1 - z, r.range(18, 30)); this.lot((a + b) / 2, z + w / 2, w - 0.6, half - 0.6, rot); z += w; }
        });
      } else if (hc >= 30 && block.d >= 18){
        // kule parselleri: blok derinliği boyunca, en yakın sokağa bakar
        for (let x = bx0; x < bx1 - 10;){ let w = Math.min(bx1 - x, r.range(20, 32)); if (bx1 - x - w < 12) w = bx1 - x; this.lot(x + w / 2, (bz0 + bz1) / 2, w - 0.8, block.d - 0.8, r.chance(0.5) ? 0 : Math.PI); x += w; }
      } else {
        // sıra evler: blok iki sıraya bölünür, sırtları birbirine dönük
        const hd = block.d / 2;
        [[bz0, bz0 + hd, Math.PI], [bz1 - hd, bz1, 0]].forEach(([a, b, rot]) => {
          for (let x = bx0; x < bx1 - 6;){ let w = Math.min(bx1 - x, r.range(14, 24)); if (bx1 - x - w < 8) w = bx1 - x; this.lot(x + w / 2, (a + b) / 2, w - 0.3, hd - 0.4, rot); x += w; }
        });
      }
    }
  }
  /** Organik: bükülmüş ızgara. Köşe (i, j) gürültüyle kaydırılır; parseller her hücrenin kenarları boyunca. */
  planOrganic(){
    const {rect:R, cellSize:cs, warp, streetW = 7} = this, r = this.rng, nx = Math.floor((R.x1 - R.x0) / cs), nz = Math.floor((R.z1 - R.z0) / cs);
    const P = [];
    for (let j = 0; j <= nz; j++){ P[j] = []; for (let i = 0; i <= nx; i++){ const x = R.x0 + i * cs, z = R.z0 + j * cs, edge = i && j && i < nx && j < nz ? 1 : 0.3; P[j][i] = [x + (noise2(i * 0.9, j * 0.9, this.seed) - 0.5) * warp * edge, z + (noise2(i * 0.9 + 7, j * 0.9 + 3, this.seed) - 0.5) * warp * edge]; } }
    this.warped = P; this.cells = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      const c = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]], cx = c.reduce((s, p) => s + p[0], 0) / 4, cz = c.reduce((s, p) => s + p[1], 0) / 4;
      const cell = {c, cx, cz}; this.cells.push(cell);
      if (this.inPark(cx - 2, cz - 2, cx + 2, cz + 2)){ cell.park = true; continue; }
      const depth = Math.min(cs / 2 - streetW / 2 - 1, this.lotDepth || 14);
      for (let e = 0; e < 4; e++){
        const a = c[e], b = c[(e + 1) % 4], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
        let nxv = -uz, nzv = ux; if ((cx - a[0]) * nxv + (cz - a[1]) * nzv < 0){ nxv = -nxv; nzv = -nzv; }         // içe dönük normal
        const rot = Math.atan2(-nxv, -nzv);                                                                        // ön cephe sokağa (dışa) bakar
        // köşelerde komşu kenarın parselleriyle çakışmasın diye her uçta derinliğin bir kısmı kadar boşluk
        const s0 = streetW / 2 + depth * 0.6, s1 = L - streetW / 2 - depth * 0.6;
        for (let s = s0; s < s1 - 5;){
          let w = Math.min(s1 - s, r.range(this.lotW?.[0] || 10, this.lotW?.[1] || 18)); if (s1 - s - w < 6) w = s1 - s;
          const mx = a[0] + ux * (s + w / 2) + nxv * (streetW / 2 + depth / 2), mz = a[1] + uz * (s + w / 2) + nzv * (streetW / 2 + depth / 2);
          this.lot(mx, mz, w - 0.3, depth - 0.3, rot); s += w;
        }
      }
    }
  }
  /** Şerit: tek sıra parsel, bir kıyı yolu boyunca (Miami Ocean Drive) */
  planStrip(){
    const {line, depth, side} = this, r = this.rng, [[ax, az], [bx, bz]] = line, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const nxv = -uz * side, nzv = ux * side, rot = Math.atan2(-nxv, -nzv);
    for (let s = 2; s < L - 10;){ const w = r.range(this.lotW[0], this.lotW[1]); this.lot(ax + ux * (s + w / 2) + nxv * (depth / 2 + 6), az + uz * (s + w / 2) + nzv * (depth / 2 + 6), w - 1.2, depth, rot); s += w; }
  }

  /* ================= kurulum ================= */
  build(parent, C){
    const X = this.X, THREE = X.THREE, M = X.M, B = new Batcher(THREE, M), r = this.rng;
    this.B = B; X.neon.bind(B);
    const lin = M.lin, groundAt = (x, z) => X.T.at(x - X.AX, z - X.AZ), y0 = this.base ?? X.T.at(this.center.x, this.center.z);
    // sokaklar
    if (this.kind === 'grid' && !this.followTerrain){
      const R = this.rect;
      X.street.flat(B, 'mass', 'asphalt', X.AX + (R.x0 + R.x1) / 2, y0 + 0.03, X.AZ + (R.z0 + R.z1) / 2, R.x1 - R.x0 + this.avenue * 2, R.z1 - R.z0 + this.street * 2);
      this.blocks.forEach(b => X.street.flat(B, 'mass', b.park ? 'park' : 'sidewalk', X.AX + (b.x0 + b.x1) / 2, y0 + 0.08, X.AZ + (b.z0 + b.z1) / 2, b.x1 - b.x0 + (b.park ? 0 : 2.4), b.z1 - b.z0 + (b.park ? 0 : 2.4)));
      for (const [x0, x1] of this.cols) for (let z = R.z0; z < R.z1; z += 28) [x0 - 1.4, x1 + 1.4].forEach((x, i) => X.street.lamp(B, X.AX + x, y0 + 0.08, X.AZ + z, i ? 0 : Math.PI));
    } else if (this.kind === 'grid'){
      // yokuş ızgarası: her cadde ve sokak araziye oturan şerit
      const R = this.rect, ga = (x, z) => groundAt(x, z);
      for (const [x0, x1] of this.cols) [x0 - this.avenue / 2, x1 + this.avenue / 2].forEach(x => X.street.ribbon(B, 'mass', 'asphalt', [[X.AX + x, X.AZ + R.z0 - 6], [X.AX + x, X.AZ + R.z1 + 6]], this.avenue, ga, 0.05, 3));
      for (const [z0, z1] of this.rows) [z0 - this.street / 2, z1 + this.street / 2].forEach(z => X.street.ribbon(B, 'mass', 'asphalt', [[X.AX + R.x0 - 6, X.AZ + z], [X.AX + R.x1 + 6, X.AZ + z]], this.street, ga, 0.06, 3));
    } else if (this.kind === 'organic'){
      const P = this.warped, ga = (x, z) => groundAt(x, z), W = this.streetW || 7;
      for (let j = 0; j < P.length; j++) X.street.ribbon(B, 'mass', 'asphalt', P[j].map(([x, z]) => [X.AX + x, X.AZ + z]), W, ga, 0.05, 3);
      for (let i = 0; i < P[0].length; i++) X.street.ribbon(B, 'mass', 'asphalt', P.map(row => [X.AX + row[i][0], X.AZ + row[i][1]]), W, ga, 0.05, 3);
      this.cells.forEach(c => { if (c.park) for (let k = 0; k < 6; k++) X.trees.push([X.AX + c.cx + (r.next() - 0.5) * 20, X.AZ + c.cz + (r.next() - 0.5) * 20, this.parkTree || 'park']); });
    }
    // parseller → yapılar
    const palette = st => rr => lin(st.palette.wall[Math.floor(rr.next() * st.palette.wall.length)]);
    for (const L of this.lots){
      const st = L.style, T = TYPO[st.typology], fp = {x:L.cx, z:L.cz, w:L.w, d:L.d, rot:L.rot};
      const y = this.followTerrain ? X.T.minUnder(L.lx, L.lz, L.w, L.d, L.rot) : y0 + 0.08;
      const s = new T({THREE, id:this.id + ':' + this.structures.length, style:st, footprint:fp, seed:L.seed, y, h:L.h, tint:lin(st.palette.wall[L.seed % st.palette.wall.length]),
        palette:palette(st), groundAt, flora:X.trees, neon:X.neon, name:NAMES[L.seed % NAMES.length], kind:L.kind});
      s.build(B); s.colliders(C); this.structures.push(s);
    }
    if (this.extra) this.extra(B, y0);
    this.groups = B.flush(parent, this.id);
    this.lod = null; this.setLOD('far');
    return this;
  }
  setLOD(level){
    if (this.lod === level) return; this.lod = level;
    const G = this.groups; G.always.visible = true;
    G.mass.visible = level !== 'far'; G.detail.visible = level === 'near'; G.far.visible = level === 'far';
  }
}
