// Structure: her yapının soyut tabanı. Veri (stil, ayak izi, tohum) ile biçim üretimi (build) ayrı tutulur.
// Alt sınıflar build(B) içinde parçalarını Batcher'a malzeme anahtarıyla verir; çarpışma kutularını colliders(C) kurar.
import { Rng } from './Rng.js';

let THREE = null;
export const bindThree = T => { THREE = T; };

/** Atlas hücresinin uv kökü (4×4; satır 0 dokunun üstü). */
export const cellUV = k => [(k % 4) * 0.25, 1 - (Math.floor(k / 4) + 1) * 0.25];

/** Cephe kutusu: yanlarda uv = pencere bölmesi sayısı, üst/alt yüzde çatı hücresi. */
export function facadeBox(w, h, d, {cell = 0, roof = 15, bay = 3.2, floor = 3.6, tint, seed = 0} = {}){
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, n = uv.count;
  const cellA = new Float32Array(n * 2), [cu, cv] = cellUV(cell), [ru, rv] = cellUV(roof);
  // yüz sırası: +x, -x, +y, -y, +z, -z (her biri 4 köşe)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){
    const i = f * 4 + k, top = f === 2 || f === 3;
    const nu = top ? Math.max(1, Math.round(dims[f][0] / 6)) : Math.max(1, Math.round(dims[f][0] / bay)), nv = top ? Math.max(1, Math.round(dims[f][1] / 6)) : Math.max(1, Math.round(dims[f][1] / floor));
    uv.setXY(i, uv.getX(i) * nu, uv.getY(i) * nv);
    cellA[i * 2] = top ? ru : cu; cellA[i * 2 + 1] = top ? rv : cv;
  }
  g.setAttribute('cell', new THREE.BufferAttribute(cellA, 2));
  const t = tint || {r:1, g:1, b:1}, ta = new Float32Array(n * 3); for (let i = 0; i < n; i++){ ta[i * 3] = t.r; ta[i * 3 + 1] = t.g; ta[i * 3 + 2] = t.b; }
  g.setAttribute('tint', new THREE.BufferAttribute(ta, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(new Float32Array(n).fill(seed), 1));
  return g;
}
/** Metre ölçekli uv'li kutu (taş, beton, mermer gibi tekrar eden dokular için). */
export function box(w, h, d, s = 2){
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
  return g;
}

export class Structure {
  /** footprint: {x, z, w, d, rot} dünya koordinatında; y: taban yüksekliği */
  constructor({id, style = null, footprint, seed = 1, y = 0, lod = 'mass'}){
    this.id = id; this.style = style; this.fp = footprint; this.seed = seed; this.y = y; this.lod = lod;
    this.rng = new Rng(seed);
    this.focal = null;
    this.base = new THREE.Matrix4().compose(new THREE.Vector3(footprint.x, y, footprint.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), footprint.rot || 0), new THREE.Vector3(1, 1, 1));
  }
  /** Yerel (lx, ly, lz) noktasına ve ry dönüşüne göre dünya matrisi */
  at(lx, ly, lz, ry = 0, sx = 1, sy = 1, sz = 1){
    const m = new THREE.Matrix4().compose(new THREE.Vector3(lx, ly, lz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz));
    return m.premultiply(this.base);
  }
  part(B, layer, key, geo, lx = 0, ly = 0, lz = 0, ry = 0, extra){ return B.add(layer, key, geo, this.at(lx, ly, lz, ry), extra); }
  /** Yerel noktayı dünyaya çevirir */
  world(lx, lz){ const c = Math.cos(this.fp.rot || 0), s = Math.sin(this.fp.rot || 0); return [this.fp.x + lx * c + lz * s, this.fp.z - lx * s + lz * c]; }
  /** Alt sınıf uygular */
  build(B){ throw new Error(this.constructor.name + '.build yazılmalı'); }
  /** Uzak katman: bina başına tek kutu (pencere dokulu; gece yanar) */
  impostor(B, h, cell = 8){ this.part(B, 'far', 'facade', facadeBox(this.fp.w, h, this.fp.d, {cell, bay:4, floor:4, tint:this.tint, seed:this.seed % 97}), 0, h / 2, 0); }
  colliders(C){ const o = C.box(this.fp.x, this.fp.z, this.fp.w / 2 + 0.1, this.fp.d / 2 + 0.1, this.fp.rot || 0); return o; }
  get landmarkWeight(){ return 0; }
  update(){}
}
