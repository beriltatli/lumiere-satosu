// Golden Gate (stilize): körfez ağzını dik kesen asma köprü. International Orange; Art Deco kademeli iki kule;
// ana kablo y = a·cosh(x / a) zinciri (a, kule aralığı ve sarkmadan çözülür); dikey askılar. Altındaki sis şeridi index.js'te.
// Güverte yürünür; iki uçta karaya inen rampalar.
import { Structure, box } from '../core/Structure.js';
import { solveCatenary } from './GatewayArch.js';

export class GoldenGate extends Structure {
  /** o.span: kuleler arası (m), o.len: toplam güverte boyu; yerel z köprü ekseni */
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:8, d:o.len, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; this.span = o.span; this.len = o.len; this.deckY = o.deckY; this.ramp = o.ramp; }
  build(B){
    const THREE = this.T, sp = this.span, L = this.len, dy = this.deckY, towerH = 44, w = 6.4, sag = 20;
    // güverte ve kafes kiriş
    this.part(B, 'always', 'orange', box(w, 0.8, L), 0, dy, 0);
    this.part(B, 'detail', 'orange', box(w - 0.6, 1.6, L), 0, dy - 1.2, 0);
    this.part(B, 'detail', 'asphalt', box(w - 2, 0.05, L), 0, dy + 0.43, 0);
    [-1, 1].forEach(sd => this.part(B, 'detail', 'orange', box(0.12, 1.1, L), sd * (w / 2 - 0.1), dy + 0.95, 0));
    // kuleler: iki bacak, üç kademe, portal kirişleri
    const towers = [-sp / 2, sp / 2];
    towers.forEach(tz => {
      [-1, 1].forEach(sd => {
        let y = -2, bw = 2.4;
        for (let k = 0; k < 3; k++){ const hh = [(towerH + 2) * 0.45, (towerH + 2) * 0.32, (towerH + 2) * 0.23][k]; this.part(B, 'always', 'orange', box(bw, hh, bw * 1.3), sd * (w / 2 + 0.6), y + hh / 2, tz); y += hh; bw *= 0.82; }
      });
      [dy + 4, dy + 15, dy + 26, towerH - 1].forEach(y => this.part(B, 'always', 'orange', box(w + 2.4, 1.6, 1.8), 0, y, tz));
    });
    // ana kablolar: orta açıklık katener, yan açıklıklar karaya doğru düz iner
    const a = solveCatenary(sp / 2, sag), cy = towerH - sag;           // en alçak nokta kule ortasında
    const cable = u => cy + a * (Math.cosh(u / a) - 1);
    [-1, 1].forEach(sd => {
      const pts = [];
      pts.push(new THREE.Vector3(sd * (w / 2), dy + 1, -L / 2));
      for (let i = 0; i <= 40; i++){ const u = -sp / 2 + sp * i / 40; pts.push(new THREE.Vector3(sd * (w / 2), cable(u), u)); }
      pts.push(new THREE.Vector3(sd * (w / 2), dy + 1, L / 2));
      this.part(B, 'always', 'orange', new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.0), 80, 0.28, 6));
      // dikey askılar
      for (let u = -sp / 2 + 2.5; u < sp / 2 - 1; u += 2.5){ const h = cable(u) - dy; this.part(B, 'detail', 'orange', new THREE.CylinderGeometry(0.05, 0.05, h, 4), sd * (w / 2), dy + h / 2, u); }
    });
    this.cable = {a, cy, sag};
    this.inscription = {lx:5, lz:L / 2 - 2, label:'Köprü levhasını oku', text:'Levha: "Turuncu, sisin içinde görünsün diye seçildi." Kablolar kendi ağırlığıyla zincir eğrisi (cosh) çizer.'};
  }
  colliders(C){
    const {x, z, rot} = this.fp, c = Math.cos(rot), s = Math.sin(rot), L = this.len, dy = this.y + this.deckY, R = this.ramp;
    C.heightFns.push((px, pz) => {
      const dx = px - x, dz = pz - z, lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) > 2.6) return null;
      if (Math.abs(lz) <= L / 2) return dy + 0.45;
      const over = Math.abs(lz) - L / 2; if (over < R.len) return dy + 0.45 - (dy + 0.45 - R.ground) * over / R.len;
      return null;
    });
    // korkuluklar (yükseklik aralıklı) ve kule bacakları
    [-1, 1].forEach(sd => { const o = C.box(x + sd * 3.1 * c, z - sd * 3.1 * s, 0.15, L / 2 + R.len, rot); o.y0 = dy - 0.5; o.y1 = dy + 3; o.low = true; });
  }
  get landmarkWeight(){ return this.focal.height; }
}
