// Gökdelen: zemin katta dükkân bandı, gövde (kademeli ya da düz), tepe tacı.
// Tepe türleri: 'deco' (kademeli taç, paslanmaz çelik ışınlar, iğne), 'cornice' (Chicago kornişi),
// 'glass' (teknik kat ve anten), 'pediment' (neoklasik alınlık ve sütunlar).
import { Structure, facadeBox, box } from '../core/Structure.js';

export class Skyscraper extends Structure {
  constructor(o){ super(o); this.h = o.h; this.tint = o.tint; this.T = o.THREE; }
  build(B){
    const THREE = this.T, s = this.style, {w, d} = this.fp, H = this.h, fl = s.floor, seed = this.seed % 97, tint = this.tint;
    const podium = Math.min(H * 0.3, fl * 1.25);
    this.part(B, 'mass', 'facade', facadeBox(w, podium, d, {cell:s.baseCell, bay:s.bay, floor:podium, tint, seed}), 0, podium / 2, 0);
    let y = podium, cw = w, cd = d;
    if (s.setback){
      const every = s.setback.every * fl, minW = w * s.setback.minFrac, minD = d * s.setback.minFrac;
      while (y < H - 0.5){
        const top = Math.min(H, y + every), hh = top - y;
        this.part(B, 'mass', 'facade', facadeBox(cw, hh, cd, {cell:s.cell, bay:s.bay, floor:fl, tint, seed}), 0, y + hh / 2, 0);
        // kademe saçağı: her geri çekilmede ince taş bant
        this.part(B, 'detail', 'limestone', box(cw + 0.3, 0.35, cd + 0.3), 0, top, 0);
        y = top; cw = Math.max(minW, cw * (1 - s.setback.inset)); cd = Math.max(minD, cd * (1 - s.setback.inset));
      }
    } else {
      this.part(B, 'mass', 'facade', facadeBox(w, H - y, d, {cell:s.cell, bay:s.bay, floor:fl, tint, seed}), 0, (y + H) / 2, 0);
      y = H;
    }
    let crownH = 0;
    if (s.crown === 'deco'){
      // iki kademe daha, sonra paslanmaz çelik "güneş ışınları" ve iğne
      for (let k = 0; k < 2; k++){
        const hh = fl * 2; cw *= 0.78; cd *= 0.78;
        this.part(B, 'mass', 'facade', facadeBox(cw, hh, cd, {cell:s.topCell, bay:s.bay, floor:fl, tint, seed}), 0, y + hh / 2, 0);
        y += hh; crownH += hh;
      }
      const r = Math.min(cw, cd) * 0.5;
      for (let i = 0; i < 12; i++){
        const a = i / 12 * Math.PI * 2, fin = new THREE.ConeGeometry(0.5, r * 2.2, 3); fin.scale(1, 1, 0.2);
        this.part(B, 'detail', 'stainless', fin, Math.sin(a) * r * 0.55, y + r * 1.1, Math.cos(a) * r * 0.55, a);
      }
      this.part(B, 'mass', 'stainless', new THREE.ConeGeometry(r * 0.8, r * 3.2, 8), 0, y + r * 1.6, 0);
      if (s.antenna) this.part(B, 'mass', 'stainless', new THREE.CylinderGeometry(0.12, 0.3, H * 0.12, 6), 0, y + r * 3.2 + H * 0.06, 0);
      crownH += r * 3.2 + H * 0.12;
    } else if (s.crown === 'cornice'){
      this.part(B, 'detail', 'limestone', box(w + 1.4, 1.1, d + 1.4), 0, H + 0.55, 0);
      this.part(B, 'detail', 'limestone', box(w + 0.6, 0.5, d + 0.6), 0, H - fl * 0.5, 0);
      this.part(B, 'mass', 'facade', facadeBox(w * 0.3, fl, d * 0.3, {cell:12, tint, seed}), w * 0.2, H + 1.1 + fl / 2, 0);
      crownH = 1.1;
    } else if (s.crown === 'glass'){
      this.part(B, 'mass', 'steel', box(cw * 0.6, fl * 1.4, cd * 0.6), 0, y + fl * 0.7, 0);
      if (s.antenna) this.part(B, 'mass', 'steel', new THREE.CylinderGeometry(0.15, 0.35, H * 0.14, 6), cw * 0.15, y + fl * 1.4 + H * 0.07, 0);
      crownH = fl * 1.4 + (s.antenna ? H * 0.14 : 0);
    } else if (s.crown === 'pediment'){
      // neoklasik: ön cephede sütun dizisi ve üçgen alınlık
      const n = Math.max(4, Math.round(w / 3.4));
      for (let i = 0; i < n; i++) this.part(B, 'detail', 'yule', new THREE.CylinderGeometry(0.45, 0.5, H - 1.2, 12), -w / 2 + 1.2 + i * (w - 2.4) / (n - 1), (H - 1.2) / 2 + 0.6, d / 2 + 1.6);
      this.part(B, 'detail', 'yule', box(w + 1, 0.9, 3.8), 0, H, d / 2 + 1.3);
      const tri = new THREE.Shape(); tri.moveTo(-w / 2 - 0.4, 0); tri.lineTo(w / 2 + 0.4, 0); tri.lineTo(0, w * 0.16); tri.closePath();
      const tg = new THREE.ExtrudeGeometry(tri, {depth:1.4, bevelEnabled:false}); tg.translate(0, 0, -0.7);
      this.part(B, 'detail', 'yule', tg, 0, H + 0.45, d / 2 + 2.5);
      this.part(B, 'detail', 'yule', box(w + 1.4, 0.6, d + 1.4), 0, 0.3, 0.6);
      crownH = w * 0.16;
    }
    this.topY = this.y + H + crownH;
    this.impostor(B, H, s.cell === 1 ? 1 : 8);
  }
}
