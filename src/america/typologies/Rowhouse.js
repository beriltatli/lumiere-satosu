// Sıra ev: parsel genişliği birimlere bölünür; her birim kendi rengi ve kat sayısıyla.
// Süsler stilden gelir: stoop merdiveni + ferforje (brownstone), cumba + sivri alınlık (Viktorya), tepe pencereli
// arduvaz çatı (Boston). Yokuşta (stepBase) her birimin tabanı kendi zeminine iner, altı taş kaideyle doldurulur.
import { Structure, facadeBox, box, cellUV } from '../core/Structure.js';

export class Rowhouse extends Structure {
  constructor(o){ super(o); this.T = o.THREE; this.palette = o.palette; this.groundAt = o.groundAt; this.hMax = o.h; }
  build(B){
    const THREE = this.T, s = this.style, {w, d} = this.fp, r = this.rng;
    let x = -w / 2, maxH = 0;
    while (x < w / 2 - 3){
      let uw = Math.min(w / 2 - x, r.range(s.unit[0], s.unit[1])); if (w / 2 - x - uw < 3) uw = w / 2 - x;
      const floors = Math.max(s.floors[0], Math.min(s.floors[1], Math.round(this.hMax / s.floor) + r.int(-1, 0))), h = floors * s.floor;
      const cx = x + uw / 2, tint = this.palette(r), seed = (this.seed + Math.floor(x * 7)) % 97;
      // basamaklı taban: birimin zemini parsel tabanından yüksekse aradaki kaide
      let by = 0;
      if (s.stepBase && this.groundAt){ const [wx, wz] = this.world(cx, 0); by = Math.max(0, this.groundAt(wx, wz) - this.y); if (by > 0.2) this.part(B, 'mass', 'graniteSmooth', box(uw, by + 0.4, d), cx, (by - 0.4) / 2, 0); }
      this.part(B, 'mass', 'facade', facadeBox(uw - 0.04, h, d, {cell:s.cell, bay:s.bay, floor:s.floor, tint, seed}), cx, by + h / 2, 0);
      if (s.cornice) this.part(B, 'detail', s.cornice === 'white' ? 'trim' : 'limestone', box(uw, 0.55, 0.9), cx, by + h - 0.1, d / 2 + 0.3);
      if (s.stoop){
        // stoop: sokaktan ilk kata çıkan taş merdiven, iki yanda ferforje korkuluk
        const sx = cx + uw * 0.25;
        for (let k = 0; k < 6; k++) this.part(B, 'detail', 'brownstone', box(1.6, 0.28 * (k + 1), 0.4), sx, 0.14 * (k + 1), d / 2 + 2.4 - k * 0.4);
        [-0.85, 0.85].forEach(o => { const rail = new THREE.PlaneGeometry(2.6, 0.9); rail.rotateY(Math.PI / 2); rail.rotateX(-0.55); this.part(B, 'detail', 'ironwork', rail, sx + o, 1.4, d / 2 + 1.3); });
        this.part(B, 'detail', 'iron', box(uw * 0.4, 0.9, 0.05), cx - uw * 0.2, 0.45, d / 2 + 1.8);
      }
      if (s.bayWindow){
        // üç yüzlü cumba: ön cephede yarım altıgen çıkıntı, üstünde küçük çatı
        const bw = uw * 0.45, bx = cx - uw * 0.22;
        const g = new THREE.CylinderGeometry(bw / 2, bw / 2, h - 1.2, 6, 1, false, -Math.PI / 2 + Math.PI / 6, Math.PI * 2 / 3 * 1.5);
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * Math.max(1, Math.round((h - 1.2) / s.floor)));
        this.part(B, 'detail', 'facade', g, bx, by + 1.2 + (h - 1.2) / 2, d / 2, 0, {cell:cellUV(s.cell), tint, seed});
        this.part(B, 'detail', 'trim', box(bw + 0.3, 0.3, bw * 0.5 + 0.3), bx, by + h + 0.05, d / 2 + bw * 0.2);
      }
      if (s.roof === 'gable'){
        // sokağa bakan sivri alınlık (Viktorya): beyaz süslü üçgen
        const tri = new THREE.Shape(); tri.moveTo(-uw / 2, 0); tri.lineTo(uw / 2, 0); tri.lineTo(0, uw * 0.45); tri.closePath();
        const tg = new THREE.ExtrudeGeometry(tri, {depth:0.3, bevelEnabled:false});
        this.part(B, 'mass', 'trim', tg, cx, by + h, d / 2 - 0.3);
        const slope = Math.hypot(uw / 2, uw * 0.45), ang = Math.atan2(uw * 0.45, uw / 2);
        [-1, 1].forEach(sd => { const rg = box(slope + 0.3, 0.15, d + 0.4); rg.rotateZ(-sd * ang); this.part(B, 'mass', 'shutter', rg, cx + sd * uw / 4, by + h + uw * 0.225, 0); });
      } else if (s.roof === 'dormer'){
        const rg = box(uw, 0.18, d * 0.6); rg.rotateX(0.5); this.part(B, 'mass', 'rail', rg, cx, by + h + 1.3, d * 0.18);
        this.part(B, 'mass', 'rail', box(uw, 2.6, d * 0.5), cx, by + h + 1.3, -d * 0.2);
        this.part(B, 'detail', 'trim', box(1.4, 1.6, 1.2), cx, by + h + 1.2, d * 0.3);
        this.part(B, 'detail', 'brick', box(0.9, 2.2, 0.9), cx + uw / 2 - 0.6, by + h + 2.4, -d * 0.2);
      }
      maxH = Math.max(maxH, by + h);
      x += uw;
    }
    this.topY = this.y + maxH;
    this.impostor(B, maxH, this.style.cell);
  }
}
