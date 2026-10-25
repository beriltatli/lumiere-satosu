// Özgürlük Heykeli (stilize, 46 m): on bir köşeli yıldız tabya, granit kaide, bakır patinalı figür,
// yedi ışınlı taç, yukarı kaldırılmış meşale (yanan alev) ve tablet. Yüzü feribotun geldiği rotaya döner.
import { Structure, box } from '../core/Structure.js';

export class StatueOfLiberty extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:30, d:30, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  build(B){
    const THREE = this.T;
    // yıldız tabya
    const star = new THREE.Shape(); for (let i = 0; i < 22; i++){ const a = i / 22 * Math.PI * 2, r = i % 2 ? 10 : 14; const x = Math.sin(a) * r, z = Math.cos(a) * r; i ? star.lineTo(x, z) : star.moveTo(x, z); } star.closePath();
    const sg = new THREE.ExtrudeGeometry(star, {depth:3.6, bevelEnabled:false}); sg.rotateX(Math.PI / 2); sg.translate(0, 3.6, 0);
    const uv = sg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 6, uv.getY(i) / 6);
    this.part(B, 'always', 'graniteSmooth', sg);
    // kaide: kesik piramit gövde, korniş ve gözetleme balkonu
    const ped = new THREE.CylinderGeometry(4.3, 5.6, 13, 4, 1); ped.rotateY(Math.PI / 4);
    this.part(B, 'always', 'graniteSmooth', ped, 0, 3.6 + 6.5, 0);
    this.part(B, 'detail', 'graniteSmooth', box(7.4, 1.1, 7.4), 0, 16.8, 0);
    this.part(B, 'detail', 'graniteSmooth', box(6.6, 1.4, 6.6), 0, 6.4, 0);
    const top = 17.4;
    // figür: kıvrımlı kumaş profili (lathe), patina
    const robe = new THREE.LatheGeometry([[0, 0], [3.2, 0], [3.0, 2], [2.6, 6], [2.2, 9], [2.3, 12], [2.5, 14], [2.0, 15.6], [0.8, 16.2], [0, 16.4]].map(([r, y]) => new THREE.Vector2(r, y)), 20);
    this.part(B, 'always', 'patina', robe, 0, top, 0);
    for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2, fold = new THREE.CylinderGeometry(0.22, 0.35, 12, 5); this.part(B, 'detail', 'patina', fold, Math.sin(a) * 2.55, top + 6.5, Math.cos(a) * 2.55); }
    // baş, taç, yüz yönü yerel +z
    this.part(B, 'always', 'patina', new THREE.SphereGeometry(1.2, 14, 12), 0, top + 17.4, 0.1);
    this.part(B, 'detail', 'patina', new THREE.TorusGeometry(1.2, 0.18, 6, 18).rotateX(Math.PI / 2), 0, top + 18.0, 0.1);
    for (let i = 0; i < 7; i++){ const a = (i - 3) * 0.32, ray = new THREE.ConeGeometry(0.18, 2.2, 5); ray.translate(0, 1.1, 0); ray.rotateX(0.55); ray.rotateY(a); this.part(B, 'always', 'patina', ray, Math.sin(a) * 1.1, top + 18.3, Math.cos(a) * 1.1); }
    // yukarı kalkan sağ kol ve meşale
    const arm = new THREE.CylinderGeometry(0.42, 0.6, 9.5, 8); arm.translate(0, 4.75, 0); arm.rotateZ(-0.16);
    this.part(B, 'always', 'patina', arm, 1.7, top + 14.6, 0);
    const tx = 1.7 + Math.sin(0.16) * 9.5, ty = top + 14.6 + Math.cos(0.16) * 9.5;
    this.part(B, 'always', 'patina', new THREE.CylinderGeometry(0.75, 0.35, 1.2, 10), tx, ty + 0.4, 0);
    this.part(B, 'always', 'gilt', new THREE.ConeGeometry(0.55, 1.8, 10), tx, ty + 1.8, 0);
    this.flame = {x:tx, y:ty + 2.0};
    this.part(B, 'always', 'flame', new THREE.ConeGeometry(0.4, 1.3, 8), tx, ty + 2.2, 0);
    // sol kol tablet tutar
    const tab = box(1.6, 2.4, 0.4, 1); tab.rotateZ(0.25); tab.rotateX(-0.15);
    this.part(B, 'always', 'patina', tab, -2.2, top + 10.2, 0.8);
    this.topY = this.y + ty + 3;
    this.inscription = {lx:0, lz:15.5, label:'Kaidedeki yazıtı oku', text:'Kaide yazıtı: "Denizi aşıp gelen her yolcuya ışık." Heykel bir kıtadan ötekine dostluk armağanı olarak gelmiş; bakır kaplaması zamanla yeşile dönmüş.'};
  }
  colliders(C){ C.circle(this.fp.x, this.fp.z, 12.5); }
  get landmarkWeight(){ return this.focal.height; }
}
