// Gateway Arch (60 m, 192 m'lik yapıdan ölçekli): ters çevrilmiş katener, eşkenar üçgen kesit, paslanmaz çelik.
//   y(u) = H − a·(cosh(u / a) − 1),  y(±S) = 0  →  a, a·(cosh(S / a) − 1) = H denkleminden çözülür (ikiye bölme).
// Kesit kenarı tabanda 5.2 m'den tepede 1.6 m'ye iner. Kemerin düzlemi kuzey-güney; doğudan (nehirden) bakılır.
import { Structure } from '../core/Structure.js';

export function solveCatenary(S, H){
  let lo = 1, hi = 1000;
  for (let i = 0; i < 80; i++){ const a = (lo + hi) / 2, f = a * (Math.cosh(S / a) - 1) - H; if (f > 0) lo = a; else hi = a; }
  return (lo + hi) / 2;
}

export class GatewayArch extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:8, d:62, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  build(B){
    const THREE = this.T, H = 60, S = 30, a = solveCatenary(S, H);
    this.a = a;
    const N = 72, pos = [], C = u => H - a * (Math.cosh(u / a) - 1);
    const ring = [];
    for (let i = 0; i <= N; i++){
      const u = -S + 2 * S * i / N, y = C(u), dy = -Math.sinh(u / a), tl = Math.hypot(1, dy);
      const tu = 1 / tl, ty = dy / tl;                       // teğet (u, y)
      const nu = -ty, ny = tu;                               // düzlem içi normal (dışarı)
      const side = 5.2 + (1.6 - 5.2) * (y / H), R = side / Math.sqrt(3);
      // üçgen köşeleri: biri dışa (n), ikisi düzleme dik (x ekseni) yönünde ±120°
      const pts = [0, 1, 2].map(k => { const ang = k * Math.PI * 2 / 3, cn = Math.cos(ang), cx = Math.sin(ang); return [cx * R, y + ny * cn * R, u + nu * cn * R]; });
      ring.push(pts);
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < 3; k++){
      const A = ring[i][k], Bp = ring[i][(k + 1) % 3], C2 = ring[i + 1][k], D = ring[i + 1][(k + 1) % 3];
      pos.push(...A, ...C2, ...Bp, ...Bp, ...C2, ...D);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    this.part(B, 'always', 'stainless', g);
    // ayakların temelleri
    [-S, S].forEach(u => this.part(B, 'detail', 'graniteSmooth', new THREE.CylinderGeometry(4.2, 4.6, 0.6, 3), 0, 0.3, u));
    this.legs = [-S, S];
    this.inscription = {lx:6, lz:-S + 4, label:'Ayaktaki levhayı oku', text:'Levha: "Batıya açılan kapı." Kemerin eğrisi ters çevrilmiş bir zincirdir: kendi ağırlığını yalnız basınçla taşır.'};
  }
  colliders(C){ this.legs.forEach(u => { const [x, z] = this.world(0, u); C.circle(x, z, 3.2); }); }
  get landmarkWeight(){ return this.focal.height; }
}
