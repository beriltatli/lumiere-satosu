// Lincoln Anıtı (stilize): Dor tapınağı, 36 sütunlu peristil, attik frizi, içeride oturan anıtsal figür.
// Doğuya, yansıma havuzuna ve Washington Anıtı'na bakar. Basamaklı teras yürünür.
import { Structure, box } from '../core/Structure.js';

export class LincolnMemorial extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:34, d:22, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  build(B){
    const THREE = this.T, W = 30, D = 19, base = 2.4, H = 9.5;
    // basamaklı kaide: önde (yerel +z) geniş merdiven
    this.part(B, 'always', 'yule', box(W + 6, base, D + 6), 0, base / 2, 0);
    for (let k = 0; k < 6; k++) this.part(B, 'detail', 'yule', box(14, base * (k + 1) / 6, 0.6), 0, base * (k + 1) / 12, D / 2 + 3 + 3.6 - k * 0.6);
    // sütunlar: uzun yanlarda 12, kısa yanlarda 8 (köşeler ortak) → 36
    const col = new THREE.CylinderGeometry(0.62, 0.72, H, 12), cols = [];
    for (let i = 0; i < 12; i++) [-1, 1].forEach(sd => cols.push([-W / 2 + 1 + i * (W - 2) / 11, sd * (D / 2 - 1)]));
    for (let j = 1; j < 7; j++) [-1, 1].forEach(sd => cols.push([sd * (W / 2 - 1), -D / 2 + 1 + j * (D - 2) / 7]));
    cols.forEach(([x, z]) => this.part(B, 'always', 'yule', col, x, base + H / 2, z));
    // iç oda (cella), attik, çatı
    this.part(B, 'always', 'yule', box(W - 7, H, D - 7), 0, base + H / 2, -1);
    this.part(B, 'always', 'yule', box(W + 0.6, 1.2, D + 0.6), 0, base + H + 0.6, 0);
    this.part(B, 'always', 'yule', box(W - 1.6, 3.0, D - 1.6), 0, base + H + 2.7, 0);
    for (let i = 0; i < 24; i++) this.part(B, 'detail', 'yule', box(0.7, 0.9, 0.3), -W / 2 + 1.5 + i * (W - 3) / 23, base + H + 2.7, D / 2 - 0.65);
    // oturan anıtsal figür (stilize, portre değil): koltuk, gövde, baş, dizler
    const z0 = -2.5;
    this.part(B, 'detail', 'yule', box(4.4, 3.2, 3.2), 0, base + 1.6, z0 - 0.6);
    this.part(B, 'detail', 'yule', box(4.6, 1.2, 3.6), 0, base + 3.8, z0 - 0.4);
    this.part(B, 'detail', 'yule', box(2.6, 3.0, 1.6), 0, base + 5.4, z0 - 0.4);
    this.part(B, 'detail', 'yule', box(2.8, 1.0, 2.6), 0, base + 3.4, z0 + 1.2);
    this.part(B, 'detail', 'yule', new THREE.SphereGeometry(0.85, 12, 10), 0, base + 7.6, z0 - 0.3);
    this.platform = {w:W + 6, d:D + 6, h:base};
    this.inscription = {lx:0, lz:D / 2 + 5, label:'Duvardaki yazıtı oku', text:'Yazıt: "Bu tapınakta, bir ülkeyi bir arada tutan kişinin anısı saklanır." Sütunların her biri anıt yapıldığı günkü bir eyaleti temsil eder.'};
  }
  colliders(C, T){
    // teras yürünür: kaide yüksekliği basamaklarla 0.4'er artar
    const {x, z, rot} = this.fp, c = Math.cos(rot), s = Math.sin(rot), W = 30, D = 19, base = 2.4, y0 = this.y;
    C.heightFns.push((px, pz) => {
      const dx = px - x, dz = pz - z, lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < (W + 6) / 2 && Math.abs(lz) < (D + 6) / 2) return y0 + base;
      if (Math.abs(lx) < 7 && lz >= (D + 6) / 2 && lz < (D + 6) / 2 + 3.6) return y0 + base * Math.ceil(((D + 6) / 2 + 3.6 - lz) / 0.6) / 6;
      return null;
    });
    const [cx, cz] = this.world(0, -1), o = C.box(cx, cz, (W - 7) / 2, (D - 7) / 2, rot); o.y0 = y0 + base - 0.5; o.y1 = y0 + 30;
  }
  get landmarkWeight(){ return this.focal.height; }
}
