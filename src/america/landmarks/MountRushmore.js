// Rushmore Dağı (stilize, portre değil): granit kütle, kayaya oyulmuş dört soyut baş kabartması.
// Kabartma bir canvas yükseklik haritasından (radyal gradyanlarla baş, kaş, burun, çene) köşe yer değiştirmesiyle
// yapılır, sonra flatShading. Yüz normali öğle güneşine bakacak yöne döner (noktasal çarpım > 0.6). Altında moloz eteği.
import { Structure } from '../core/Structure.js';

export class MountRushmore extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:80, d:40, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  heightmap(){
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 128);
    const blob = (x, y, rx, ry, v) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(255,255,255,${v})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(x, y); g.scale(rx, ry); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore(); };
    const hole = (x, y, rx, ry, v) => { g.save(); g.globalCompositeOperation = 'destination-out'; blob(x, y, rx, ry, v); g.restore(); };
    [[46, 60, 1.0], [104, 52, 1.08], [160, 58, 0.95], [212, 66, 0.9]].forEach(([x, y, k], i) => {
      blob(x, y, 30 * k, 44 * k, 0.95);                    // baş kütlesi
      blob(x, y - 16 * k, 22 * k, 10 * k, 0.35);           // alın
      blob(x, y + 6 * k, 5 * k, 14 * k, 0.6);              // burun
      blob(x, y + 26 * k, 14 * k, 9 * k, 0.4);             // çene
      hole(x - 9 * k, y - 4 * k, 6 * k, 4 * k, 0.6); hole(x + 9 * k, y - 4 * k, 6 * k, 4 * k, 0.6);   // göz çukurları
      hole(x, y + 17 * k, 9 * k, 2.5 * k, 0.5);            // ağız çizgisi
      if (i === 3) blob(x - 18, y + 8, 10, 26, 0.3);
    });
    return g.getImageData(0, 0, 256, 128).data;
  }
  build(B){
    const THREE = this.T, r = this.rng;
    // dağ kütlesi: gürültülü yarım elipsoit
    const mt = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), p = mt.attributes.position;
    for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.12 * Math.sin(x * 9 + z * 5) + 0.08 * Math.sin(z * 13 - y * 7); p.setXYZ(i, x * 48 * n, y * 40 * n, z * 30 * n); }
    mt.computeVertexNormals();
    this.part(B, 'always', 'granite', mt, 0, 0, -30);
    // kaya yüzü: geniş, kenarlara doğru geriye kıvrılan, kırık dokulu bir uçurum; başlar ortadaki bölgede oyulu
    const W = 96, H = 50, HW = 64, HH = 30, face = new THREE.PlaneGeometry(W, H, 160, 84), fp = face.attributes.position, hm = this.heightmap();
    for (let i = 0; i < fp.count; i++){
      const x = fp.getX(i), y = fp.getY(i) + H / 2, u = x / HW + 0.5, v = 1 - (y - 12) / HH;
      let h = 0;
      if (u > 0 && u < 1 && v > 0 && v < 1){
        // çift doğrusal örnek: kabartma piksel piksel basamaklanmasın
        const fx = u * 255, fy = v * 127, ix = Math.min(254, Math.floor(fx)), iy = Math.min(126, Math.floor(fy)), ax = fx - ix, ay = fy - iy, at = (a, b) => hm[(b * 256 + a) * 4] / 255;
        const hv = (at(ix, iy) * (1 - ax) + at(ix + 1, iy) * ax) * (1 - ay) + (at(ix, iy + 1) * (1 - ax) + at(ix + 1, iy + 1) * ax) * ay;
        h = hv * 8 * Math.min(1, Math.min(u, 1 - u, v, 1 - v) * 8);
      }
      const curl = -Math.pow(Math.abs(x) / (W / 2), 2.2) * 16 - Math.pow(Math.max(0, y - 40) / 10, 2) * 8;
      const rock = Math.sin(x * 0.7 + y * 0.3) * 0.6 + Math.sin(y * 1.3 - x * 0.2) * 0.4 + (r.next() - 0.5) * 0.5;
      fp.setY(i, y); fp.setZ(i, h + curl + rock * (1 - Math.min(1, h / 3)));
    }
    face.computeVertexNormals();
    this.part(B, 'always', 'granite', face, 0, 0, 12);
    // kaya yüzünün arkasını kapatan kütle
    const back = new THREE.BoxGeometry(W - 20, H - 4, 18); this.part(B, 'always', 'granite', back, 0, (H - 4) / 2, 2);
    // moloz eteği: kabartmanın altında dökülmüş kaya parçaları
    const rock = new THREE.IcosahedronGeometry(1, 0);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), v3 = new THREE.Vector3();
    for (let i = 0; i < 90; i++){
      const lx = (r.next() - 0.5) * W * 1.1, lz = 12 + r.next() * 14, k = 0.6 + r.next() * 2.4, ly = Math.max(0, 9 - (lz - 12) * 0.6) * r.next();
      m4.compose(v3.set(lx, ly, lz), q.setFromEuler(e.set(r.next() * 3, r.next() * 3, 0)), s.set(k, k * 0.7, k)).premultiply(this.base);
      B.instance('mass', 'rushmore:moloz', rock, B.material('granite'), m4);
    }
    this.inscription = {lx:0, lz:34, label:'Seyir terasındaki levhayı oku', text:'Levha: "Dört yüz, kayadan çekiçle ve dinamitle çıkarıldı; her biri bir binanın altı katı kadar." Buradaki yüzler kimseyi canlandırmaz, kayanın kendi hikâyesidir.'};
  }
  colliders(C){
    const [x, z] = this.world(0, -8); C.circle(x, z, 34);
    const [fx, fz] = this.world(0, 12); C.box(fx, fz, 34, 8, this.fp.rot);
  }
  get landmarkWeight(){ return this.focal.height; }
}
