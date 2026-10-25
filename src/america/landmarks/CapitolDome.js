// Kongre binası ve kubbesi (stilize): orta blok, iki kanat, sütunlu giriş ve alınlık; sütunlu kasnak (drum),
// beyaz kubbe, fener ve tepede soyut bir figür. Batıya, Mall eksenine bakar.
import { Structure, box } from '../core/Structure.js';

export class CapitolDome extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:80, d:26, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  build(B){
    const THREE = this.T;
    // yerel +z ön (Mall'a bakan cephe); uzun eksen x
    this.part(B, 'always', 'yule', box(34, 15, 22), 0, 7.5, 0);
    [-1, 1].forEach(sd => { this.part(B, 'always', 'yule', box(22, 13, 18), sd * 28, 6.5, 0); this.part(B, 'detail', 'yule', box(22.6, 1, 18.6), sd * 28, 13.4, 0); });
    this.part(B, 'detail', 'yule', box(35, 1.2, 22.8), 0, 15.4, 0);
    // giriş portiği: 8 sütun ve alınlık
    for (let i = 0; i < 8; i++) this.part(B, 'detail', 'yule', new THREE.CylinderGeometry(0.55, 0.6, 12, 12), -10.5 + i * 3, 7, 13.6);
    this.part(B, 'detail', 'yule', box(25, 1.4, 4.4), 0, 13.6, 13.4);
    const tri = new THREE.Shape(); tri.moveTo(-12.5, 0); tri.lineTo(12.5, 0); tri.lineTo(0, 4); tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, {depth:4, bevelEnabled:false}); tg.translate(0, 0, -2);
    this.part(B, 'detail', 'yule', tg, 0, 14.3, 13.4);
    for (let k = 0; k < 8; k++) this.part(B, 'detail', 'yule', box(25, 0.4 * (k + 1), 0.6), 0, 0.2 * (k + 1), 15.6 + 3 - k * 0.6);
    // kasnak, sütun halkası, kubbe, fener
    const y0 = 16;
    this.part(B, 'always', 'white', new THREE.CylinderGeometry(9.5, 10, 7, 32), 0, y0 + 3.5, 0);
    for (let i = 0; i < 32; i++){ const a = i / 32 * Math.PI * 2; this.part(B, 'detail', 'white', new THREE.CylinderGeometry(0.28, 0.3, 6.2, 8), Math.sin(a) * 10.6, y0 + 3.4, Math.cos(a) * 10.6); }
    this.part(B, 'detail', 'white', new THREE.TorusGeometry(10.8, 0.4, 6, 40).rotateX(Math.PI / 2), 0, y0 + 6.8, 0);
    this.part(B, 'always', 'white', new THREE.CylinderGeometry(8.4, 9, 3, 32), 0, y0 + 8.5, 0);
    const dome = new THREE.SphereGeometry(8.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2); dome.scale(1, 1.25, 1);
    this.part(B, 'always', 'white', dome, 0, y0 + 10, 0);
    for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, rib = new THREE.TorusGeometry(8.65, 0.12, 4, 24, Math.PI / 2); rib.scale(1, 1.25, 1); rib.rotateY(a); this.part(B, 'detail', 'white', rib, 0, y0 + 10, 0); }
    this.part(B, 'always', 'white', new THREE.CylinderGeometry(1.6, 1.8, 4, 12), 0, y0 + 22.5, 0);
    this.part(B, 'detail', 'white', new THREE.ConeGeometry(1.9, 1.6, 12), 0, y0 + 25.3, 0);
    this.part(B, 'always', 'bronzeDark', new THREE.CylinderGeometry(0.3, 0.45, 2.6, 8), 0, y0 + 27.4, 0);
    this.part(B, 'always', 'bronzeDark', new THREE.SphereGeometry(0.4, 10, 8), 0, y0 + 29, 0);
    this.inscription = {lx:0, lz:19.5, label:'Basamaklardaki levhayı oku', text:'Levha: "Bu kubbenin altında yasalar konuşularak yapılır." Dökme demir kubbe, beyaza boyanınca taş sanılır.'};
  }
  colliders(C){ C.box(this.fp.x, this.fp.z, 39, 11.5, this.fp.rot); }
  get landmarkWeight(){ return this.focal.height; }
}
