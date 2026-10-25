// Geometri toplayıcı: (katman, malzeme anahtarı) başına parçaları toplar, bölge başına tek merge yapar.
// Katmanlar LOD içindir: 'mass' yakın ve orta mesafede, 'detail' yalnız yakında, 'far' yalnız uzakta, 'always' her zaman.
// Cephe malzemesi ek köşe verisi taşır (cell, tint, seed); diğer malzemelerde yalnız position/normal/uv kalır.
// Tekrar eden küçük öğeler (lamba, palmiye, taksi) InstancedMesh olarak ayrıca toplanır.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const LAYERS = ['mass', 'detail', 'far', 'always'];

export class Batcher {
  constructor(THREE, M){
    this.THREE = THREE; this.M = M;
    this.buckets = new Map();        // 'layer|key' -> {layer, mat, geos[]}
    this.inst = new Map();           // key -> {layer, geo, mat, mats[], cols[], cast}
    this.mats = new Map();           // key -> malzeme
    this.tri = 0;
  }
  material(key){ if (!this.mats.has(key)) this.mats.set(key, this.M[key] || key); return this.mats.get(key); }
  /** geo yerinde dönüştürülür; matrix verilirse uygulanır. extra: {cell:[u,v], tint:Color, seed} cephe için. */
  add(layer, key, geo, matrix, extra){
    const THREE = this.THREE, mat = typeof key === 'string' ? this.material(key) : key, mk = typeof key === 'string' ? key : key.uuid;
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (matrix) g.applyMatrix4(matrix);
    const facade = mat === this.M.facade, n = g.attributes.position.count, own = facade ? ['cell', 'tint', 'seed'] : (mat.userData && mat.userData.attrs) || [];
    Object.keys(g.attributes).forEach(a => { if (!['position', 'normal', 'uv', ...own].includes(a)) g.deleteAttribute(a); });
    if (!facade) own.forEach(a => { if (!g.attributes[a]) g.setAttribute(a, new THREE.BufferAttribute(new Float32Array(n), 1)); });
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    if (facade){
      if (!g.attributes.cell){ const c = extra && extra.cell || [0.75, 0], a = new Float32Array(n * 2); for (let i = 0; i < n; i++){ a[i * 2] = c[0]; a[i * 2 + 1] = c[1]; } g.setAttribute('cell', new THREE.BufferAttribute(a, 2)); }
      if (!g.attributes.tint){ const c = extra && extra.tint || {r:1, g:1, b:1}, a = new Float32Array(n * 3); for (let i = 0; i < n; i++){ a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('tint', new THREE.BufferAttribute(a, 3)); }
      if (!g.attributes.seed){ const v = extra && extra.seed || 0; g.setAttribute('seed', new THREE.BufferAttribute(new Float32Array(n).fill(v), 1)); }
    }
    const k = layer + '|' + mk;
    let b = this.buckets.get(k); if (!b){ b = {layer, mat, geos:[]}; this.buckets.set(k, b); }
    b.geos.push(g); this.tri += n / 3;
    return g;
  }
  /** Tekrarlayan öğe: key aynı olanlar tek InstancedMesh olur. */
  instance(layer, key, geo, mat, matrix, color, cast = true){
    let b = this.inst.get(key); if (!b){ b = {layer, geo, mat, mats:[], cols:[], cast}; this.inst.set(key, b); }
    b.mats.push(matrix.clone()); b.cols.push(color || null);
  }
  /** Grupları kur: {mass, detail, far, always} → her biri bir THREE.Group */
  flush(parent, name = 'Bolge'){
    const THREE = this.THREE, groups = {};
    LAYERS.forEach(l => { const g = new THREE.Group(); g.name = name + ':' + l; parent.add(g); groups[l] = g; });
    this.buckets.forEach(b => {
      // tek merge çok büyük olmasın (Uint32 indeks gerekmez, ama 1M köşeyi aşarsa parçala)
      const chunks = []; let cur = [], cnt = 0;
      b.geos.forEach(g => { const n = g.attributes.position.count; if (cnt + n > 900000 && cur.length){ chunks.push(cur); cur = []; cnt = 0; } cur.push(g); cnt += n; });
      if (cur.length) chunks.push(cur);
      chunks.forEach(list => {
        const m = new THREE.Mesh(mergeBufferGeometries(list), b.mat);
        m.castShadow = b.layer !== 'far'; m.receiveShadow = true; groups[b.layer].add(m);
      });
    });
    this.inst.forEach(b => {
      const im = new THREE.InstancedMesh(b.geo, b.mat, b.mats.length);
      b.mats.forEach((m, i) => { im.setMatrixAt(i, m); if (b.cols[i]) im.setColorAt(i, b.cols[i]); });
      im.castShadow = b.cast; im.receiveShadow = true; groups[b.layer].add(im);
    });
    this.buckets.clear(); this.inst.clear();
    return groups;
  }
}
