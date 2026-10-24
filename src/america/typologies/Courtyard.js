// Avlulu New Orleans evi: sokak cephesinde tam genişlik bina, iki yan kanat ve arka bina bir avluyu çevreler.
// Üst katlarda dökme demir direkli, ferforje korkuluklu galeriler (korkuluk tek alpha-test doku; çubuklar modellenmez).
import { Structure, facadeBox, box } from '../core/Structure.js';

export class Courtyard extends Structure {
  constructor(o){ super(o); this.T = o.THREE; this.palette = o.palette; this.hMax = o.h; this.flora = o.flora; }
  build(B){
    const THREE = this.T, s = this.style, {w, d} = this.fp, r = this.rng;
    const floors = Math.max(s.floors[0], Math.min(s.floors[1], Math.round(this.hMax / s.floor))), h = floors * s.floor;
    const tint = this.palette(r), seed = this.seed % 97, fd = Math.min(7, d * 0.45), wing = Math.min(4.5, w * 0.22);
    const fb = (bw, bd, x, z) => this.part(B, 'mass', 'facade', facadeBox(bw, h, bd, {cell:s.cell, bay:s.bay, floor:s.floor, tint, seed}), x, h / 2, z);
    fb(w, fd, 0, d / 2 - fd / 2);                                    // sokak cephesi
    if (d > fd + 4){
      fb(wing, d - fd, -w / 2 + wing / 2, -fd / 2); fb(wing, d - fd, w / 2 - wing / 2, -fd / 2);   // yan kanatlar
      fb(w - wing * 2, 4, 0, -d / 2 + 2);                                                         // arka bina
      if (this.flora) this.flora.push([...this.world(0, (4 - fd) / 2), 'muz', this.y]);       // avlunun ortasında muz ağacı
    }
    // galeriler: her üst katın döşemesi sokağa 2 m taşar
    if (s.gallery){
      for (let f = 1; f < floors; f++){
        const y = f * s.floor;
        this.part(B, 'detail', 'wood', box(w, 0.2, 2.1), 0, y, d / 2 + 1.05);
        const rail = new THREE.PlaneGeometry(w, 1.0); const uv = rail.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.round(w / 2), uv.getY(i));
        this.part(B, 'detail', 'ironwork', rail, 0, y + 0.6, d / 2 + 2.05);
      }
      this.part(B, 'detail', 'rail', box(w + 0.2, 0.15, 2.3), 0, h, d / 2 + 1.05);
      const n = Math.max(2, Math.round(w / 3));
      for (let i = 0; i <= n; i++) this.part(B, 'detail', 'iron', new THREE.CylinderGeometry(0.07, 0.09, h, 6), -w / 2 + 0.2 + i * (w - 0.4) / n, h / 2, d / 2 + 2.0);
    }
    this.part(B, 'mass', 'rail', box(w + 0.4, 0.4, fd + 0.4), 0, h + 0.2, d / 2 - fd / 2);
    this.topY = this.y + h;
    this.impostor(B, h, s.cell);
  }
  colliders(C){
    // galeri direkleri arası yürünür kaldırım: bina gövdesi + sokağa taşan galeri ayrı değil, tek kutu
    return C.box(this.fp.x, this.fp.z, this.fp.w / 2 + 0.1, this.fp.d / 2 + 0.1, this.fp.rot || 0);
  }
}
