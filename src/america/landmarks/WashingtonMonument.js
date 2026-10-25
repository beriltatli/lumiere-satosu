// Washington Anıtı (stilize, 56 m): mermer dikilitaş. Alt 2/3 ile üst 1/3 hafif farklı tonda
// (gerçek yapıda inşaata ara verilip başka ocaktan taş getirilmesine gönderme), ucunda piramidion.
import { Structure, box } from '../core/Structure.js';

export class WashingtonMonument extends Structure {
  constructor(o){ super(Object.assign({footprint:{x:o.focal.pos.x, z:o.focal.pos.z, w:6, d:6, rot:o.focal.facing}}, o)); this.T = o.THREE; this.focal = o.focal; }
  build(B){
    const THREE = this.T, H = 52, w0 = 5.6, w1 = 3.8, cut = H * 2 / 3, wc = w0 + (w1 - w0) * (cut / H);
    const shaft = (y0, y1, a, b, key) => { const g = new THREE.CylinderGeometry(b / Math.SQRT2, a / Math.SQRT2, y1 - y0, 4, 1); g.rotateY(Math.PI / 4); this.part(B, 'always', key, g, 0, (y0 + y1) / 2, 0); };
    shaft(0, cut, w0, wc, 'obeliskLow'); shaft(cut, H, wc, w1, 'obeliskHigh');
    const py = new THREE.ConeGeometry(w1 / Math.SQRT2, 4, 4); py.rotateY(Math.PI / 4);
    this.part(B, 'always', 'obeliskHigh', py, 0, H + 2, 0);
    this.part(B, 'detail', 'yule', box(14, 0.6, 14), 0, 0.3, 0);
    // çevresinde dairesel meydan ve bayrak direkleri (bayraklar düz renkli bez)
    for (let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; this.part(B, 'detail', 'white', new THREE.CylinderGeometry(0.06, 0.08, 9, 5), Math.sin(a) * 15, 4.5, Math.cos(a) * 15); this.part(B, 'detail', i % 2 ? 'orange' : 'white', box(1.6, 1.0, 0.04), Math.sin(a) * 15 + 0.8, 8.3, Math.cos(a) * 15, 0); }
    this.inscription = {lx:0, lz:4.2, label:'Kaidedeki taşı oku', text:'Taş: "Yükseldikçe rengi değişen bu dikilitaş, yarım kalıp sonra yeniden başlanan bir işin hatırasıdır." Üçte ikisinde taşın tonu değişir.'};
  }
  colliders(C){ C.box(this.fp.x, this.fp.z, 3, 3, 0); }
  get landmarkWeight(){ return this.focal.height; }
}
