// Route 66 yol kenarı yapıları: krom diner, benzin istasyonu, motel. Tabelalar uydurma, logo yok.
import { Structure, facadeBox, box } from '../core/Structure.js';

export class Diner extends Structure {
  constructor(o){ super(o); this.T = o.THREE; this.kind = o.kind || 'diner'; this.neon = o.neon; this.palette = o.palette; }
  build(B){
    const THREE = this.T, s = this.style, {w, d} = this.fp, r = this.rng, tint = this.palette(r), seed = this.seed % 97;
    if (this.kind === 'diner'){
      // vagon biçimli krom gövde, kırmızı bant, yuvarlak uçlar, cam bant
      const L = w - 2, R = Math.min(2.4, d * 0.35);
      const body = new THREE.CylinderGeometry(R, R, L, 18, 1, false); body.rotateZ(Math.PI / 2); body.scale(1, 0.75, 1);
      this.part(B, 'mass', 'chrome', body, 0, R * 0.75 + 0.6, 0);
      [-1, 1].forEach(sd => { const cap = new THREE.SphereGeometry(R, 14, 10, 0, Math.PI); cap.rotateY(sd * Math.PI / 2); cap.scale(1, 0.75, 1); this.part(B, 'mass', 'chrome', cap, sd * L / 2, R * 0.75 + 0.6, 0); });
      this.part(B, 'detail', 'orange', box(L + 0.1, 0.35, R * 2 + 0.06), 0, R * 0.75 + 0.2, 0);
      this.part(B, 'detail', 'glassLobby', box(L - 1, 0.9, R * 2 + 0.04), 0, R * 0.75 + 1.0, 0);
      this.part(B, 'mass', 'sidewalk', box(w, 0.6, d), 0, 0.3, 0);
      if (this.neon) this.neon.board(this, 0, R * 1.5 + 2.4, 0, 'DINER', s.neon[0], 4.4, 1.3, 0);
      this.topY = this.y + R * 1.5 + 3;
    } else if (this.kind === 'gas'){
      // benzinlik: kanopi, iki pompa adası, küçük ofis
      this.part(B, 'mass', 'white', box(w * 0.8, 0.5, d * 0.6), 0, 4.6, d * 0.1);
      this.part(B, 'detail', 'orange', box(w * 0.8 + 0.05, 0.25, d * 0.6 + 0.05), 0, 4.3, d * 0.1);
      [-1, 1].forEach(sd => { this.part(B, 'mass', 'white', new THREE.CylinderGeometry(0.2, 0.2, 4.4, 8), sd * w * 0.3, 2.2, d * 0.1); this.part(B, 'detail', 'orange', box(0.5, 1.4, 0.4), sd * w * 0.15, 0.7, d * 0.1); this.part(B, 'detail', 'chrome', box(0.4, 0.2, 0.3), sd * w * 0.15, 1.5, d * 0.1); });
      this.part(B, 'mass', 'facade', facadeBox(w * 0.45, 3.4, d * 0.3, {cell:s.cell, bay:s.bay, floor:3.4, tint, seed}), 0, 1.7, -d * 0.32);
      if (this.neon) this.neon.board(this, 0, 6.2, d * 0.1, 'GAS · OIL', s.neon[2], 4, 1.1, 0);
      this.topY = this.y + 6.8;
    } else {
      // motel: uzun tek katlı oda dizisi, önünde saçak, yol kenarında yüksek direkli neon tabela
      this.part(B, 'mass', 'facade', facadeBox(w, 3.4, d * 0.6, {cell:s.cell, bay:3.4, floor:3.4, tint, seed}), 0, 1.7, -d * 0.2);
      this.part(B, 'detail', 'white', box(w + 0.4, 0.2, 2.2), 0, 3.2, d * 0.1 + 0.6);
      for (let i = 0; i <= Math.round(w / 4); i++) this.part(B, 'detail', 'white', box(0.15, 3.1, 0.15), -w / 2 + i * w / Math.round(w / 4), 1.55, d * 0.1 + 1.6);
      this.part(B, 'mass', 'rail', new THREE.CylinderGeometry(0.18, 0.22, 8, 8), w / 2 - 1, 4, d / 2 - 1);
      if (this.neon) this.neon.board(this, w / 2 - 1, 8.6, d / 2 - 1, 'MOTEL', s.neon[0], 4.6, 1.6, 0);
      this.topY = this.y + 9.5;
    }
    this.impostor(B, 3.4, s.cell);
  }
}
