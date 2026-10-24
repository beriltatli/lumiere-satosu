// Tek yapı: Miami Beach Art Deco oteli. Pastel gövde, yuvarlatılmış köşe, her katta kaş saçak (eyebrow),
// ortada kademeli kule ve dikey neon tabela.
import { Structure, facadeBox, box, cellUV } from '../core/Structure.js';

export class Villa extends Structure {
  constructor(o){ super(o); this.T = o.THREE; this.palette = o.palette; this.hMax = o.h; this.neon = o.neon; this.name = o.name; }
  build(B){
    const THREE = this.T, s = this.style, {w, d} = this.fp, r = this.rng;
    const floors = Math.max(s.floors[0], Math.min(s.floors[1], Math.round(this.hMax / s.floor))), h = floors * s.floor;
    const tint = this.palette(r), seed = this.seed % 97, rc = Math.min(4, w * 0.18);
    this.part(B, 'mass', 'facade', facadeBox(w - rc, h, d, {cell:s.cell, bay:s.bay, floor:s.floor, tint, seed}), rc / 2, h / 2, 0);
    // yuvarlak köşe: sol ön köşede çeyrek silindir
    const cyl = new THREE.CylinderGeometry(rc, rc, h, 14, 1, false, -Math.PI / 2, Math.PI);
    const uv = cyl.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * floors);
    this.part(B, 'mass', 'facade', cyl, -w / 2 + rc, h / 2, d / 2 - rc, 0, {cell:cellUV(s.cell), tint, seed});
    this.part(B, 'mass', 'facade', facadeBox(rc, h, d - rc, {cell:s.cell, bay:s.bay, floor:s.floor, tint, seed}), -w / 2 + rc / 2, h / 2, -rc / 2);
    // kaş saçaklar
    for (let f = 1; f <= floors; f++) this.part(B, 'detail', 'white', box(w + 0.4, 0.14, 0.9), 0, f * s.floor - 0.2, d / 2 + 0.45);
    // kule ve dikey neon
    const tw = Math.min(5, w * 0.25), th = s.floor * 2;
    this.part(B, 'mass', 'facade', facadeBox(tw, th, tw, {cell:12, tint, seed}), w * 0.1, h + th / 2, d * 0.2);
    for (let k = 0; k < 3; k++) this.part(B, 'detail', 'white', box(tw + 0.6 - k * 0.5, 0.3, tw + 0.6 - k * 0.5), w * 0.1, h + th + 0.15 + k * 0.5, d * 0.2);
    this.part(B, 'detail', 'white', box(0.3, h * 0.7, 1.6), w * 0.1, h * 0.55, d / 2 + 0.8);
    if (this.neon) this.neon.vertical(this, w * 0.1, h * 0.55, d / 2 + 1.65, this.name, s.neon[this.seed % s.neon.length], h * 0.6);
    this.topY = this.y + h + th;
    this.impostor(B, h, s.cell);
  }
}
