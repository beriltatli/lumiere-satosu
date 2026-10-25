// İstanbul Boğazı: elle düzenlenmiş, küçültülmüş bir İstanbul. Üç yaka: kuzeyde Beyoğlu (Galata, İstiklal, Taksim, Dolmabahçe),
// güneybatıda Tarihî Yarımada (Sultanahmet, Ayasofya, Topkapı, Kapalıçarşı, Mısır Çarşısı, Süleymaniye, Eminönü), doğuda Asya yakası
// (Üsküdar, Salacak, Kız Kulesi, Çamlıca, Haydarpaşa, Kadıköy). Aralarında Boğaz ve Haliç; Galata ve Boğaziçi köprülerinden yürünür.
// Arazi tepelidir (yükseklik ızgarası, yürünebilir); caddeler ve sokaklar araziye oturur. Simge yapılar landmarks.js'te.
// Ada konumludur (at): Lumière'den Pyra ile uçularak gelinir; Kadıköy'deki iniş alanından Pyra'ya binilir.
import { buildLandmarks } from './landmarks.js';
import { buildPeople } from './people.js';
import { buildTaxis } from './taxis.js';
import { buildGraffiti } from './graffiti.js';
import { buildInteriors } from './interiors.js';
import { buildCats } from './cats.js';
import { buildFerries } from './ferry.js';
import { buildBalik } from './balik.js';
import { buildGuvercin } from './guvercin.js';
import { buildKartpostal } from './kartpostal.js';
import { buildGece } from './gece.js';
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const AT = {x:-980, z:-980};      // dünyadaki yeri: Lumière'in kuzeybatısı (Lumière–Yùlóng ile benzer kıyı arası mesafe)
const R = 470;                    // ada yarıçapı (m)
const RL = R + 1.5;               // kara bu çembere kadar uzanır
const SEA_Y = -0.22;
const HARBOR = 1.0;               // iskele açısı: Kadıköy tarafı, Lumière'e bakar
const WALL = {y0:-5, y1:0.25};    // kıyı duvarı yürüyeni tutar, köprü güvertesindekini tutmaz

/* ================= kara: elle çizilmiş kıyılar + dış çember yayları ================= */
const ang = (p) => Math.atan2(p[0], p[1]);
function arc(a0, a1, dir){
  if (dir < 0) while (a1 > a0) a1 -= Math.PI * 2; else while (a1 < a0) a1 += Math.PI * 2;
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) * RL / 18)), out = [];
  for (let i = 1; i < n; i++){ const a = a0 + (a1 - a0) * i / n; out.push([Math.sin(a) * RL, Math.cos(a) * RL]); }
  return out;
}
/** kıyı noktaları + çemberle kapanış; edge[i]: i -> i+1 kenarı dış çember mi (duvar konmaz) */
function ring(shore, dir){
  const a = arc(ang(shore[shore.length - 1]), ang(shore[0]), dir), pts = shore.concat(a);
  return {pts, edge:pts.map((_, i) => i >= shore.length - 1)};
}
const BEYOGLU = ring([[48, -468], [56, -400], [52, -330], [58, -260], [66, -190], [74, -122], [78, -102], [60, -98], [0, -96], [-60, -100], [-140, -104], [-220, -108], [-300, -104], [-380, -96], [-460, -92]], -1);
const YARIMADA = ring([[-467, -52], [-380, -56], [-300, -52], [-220, -50], [-140, -46], [-60, -42], [10, -38], [50, -25], [72, -5], [80, 20], [76, 70], [66, 130], [48, 190], [15, 240], [-40, 262], [-120, 272], [-200, 276], [-280, 272], [-350, 262], [-400, 246]], -1);
const ASYA = ring([[150, -445], [158, -400], [162, -330], [168, -260], [176, -190], [182, -120], [186, -50], [182, 20], [186, 70], [198, 130], [214, 180], [232, 215], [250, 236], [270, 250], [300, 272], [330, 300], [345, 320]], 1);
const KIZ = {x:128, z:55};
const KIZ_ADA = {pts:Array.from({length:16}, (_, i) => [KIZ.x + Math.sin(i / 16 * Math.PI * 2) * 10, KIZ.z + Math.cos(i / 16 * Math.PI * 2) * 10]), edge:Array(16).fill(false)};
const RINGS = [BEYOGLU, YARIMADA, ASYA, KIZ_ADA];

function pip(x, z, poly){
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const a = poly[i], b = poly[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
const onLand = (x, z) => RINGS.some(r => pip(x, z, r.pts));
const inland = (x, z, pad) => onLand(x, z) && onLand(x + pad, z) && onLand(x - pad, z) && onLand(x, z + pad) && onLand(x, z - pad);
const segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ================= tepeler: yükseklik ızgarası ================= */
// [x, z, yükseklik, yarıçap]: İstanbul'un yedi tepesi ve Asya yakasının sırtları
const HILLS = [[-80, 120, 7, 95], [-245, 115, 8, 80], [-300, 40, 9, 70], [-370, 170, 8, 95], [10, 60, 4, 60],
  [-110, -170, 8, 60], [-150, -320, 12, 120], [-200, -430, 8, 80],
  [410, -250, 26, 115], [300, -120, 10, 100], [360, 100, 7, 90], [390, 290, 5, 80]];
const LM = {
  sultanahmet:[-160, 178, 2.12, 0.32],
  ayasofya:[-68, 118, -1.02, 0.3],
  topkapi:[-8, 70, -0.94, 0.42],
  suleymaniye:[-300, 20, 0, 0.3],
  galata:[-108, -168, 0, 0.42],
  dolmabahce:[38, -300, Math.PI / 2, 0.25],
  kizkulesi:[KIZ.x, KIZ.z, 0, 0.5],
  haydarpasa:[278, 236, -1.28, 0.3],
};
const PAD = {x:Math.sin(HARBOR) * 405, z:Math.cos(HARBOR) * 405};
// düzlükler (yapı ve meydan tabanları): [x, z, yarıçap]
const FLAT = [[-112, 150, 75], [-8, 70, 24], [-300, 20, 36], [-108, -168, 22], [-245, 120, 36], [-150, -405, 36], [410, -250, 20], [PAD.x, PAD.z, 30], [-90, -10, 40], [215, -45, 36], [38, -300, 50], [278, 236, 45], [-106, 23, 30]];
const GS = 2.5, GN = Math.ceil(RL * 2 / GS) + 1;
function hillRaw(x, z){ let h = 0; for (const [hx, hz, a, r] of HILLS){ const d2 = ((x - hx) ** 2 + (z - hz) ** 2) / (r * r); if (d2 < 9) h += a * Math.exp(-d2); } return h; }
const EDGES = []; RINGS.forEach(({pts}) => pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; EDGES.push([p[0], p[1], q[0], q[1]]); }));
function shoreDist(x, z){ let d = 1e9; for (const e of EDGES){ const v = segDist(x, z, e[0], e[1], e[2], e[3]); if (v < d) d = v; } return d; }
const fade = (x, z) => smooth(4, 48, shoreDist(x, z));
let HG = null, LG = null;
function buildGrid(){
  HG = new Float32Array(GN * GN); LG = new Uint8Array(GN * GN);
  const flats = FLAT.map(([x, z, r]) => [x, z, r, hillRaw(x, z) * fade(x, z)]);
  for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++){
    const x = -RL + i * GS, z = -RL + j * GS, k = j * GN + i;
    if (Math.hypot(x, z) > RL + 3 || !onLand(x, z)){ LG[k] = 0; HG[k] = 0; continue; }
    LG[k] = 1;
    let h = hillRaw(x, z); if (h > 0.02) h *= fade(x, z);
    for (const [fx, fz, r, fh] of flats){ const d = Math.hypot(x - fx, z - fz); if (d < r + 22){ const w = smooth(r + 22, r, d); h = h * (1 - w) + fh * w; } }
    HG[k] = h;
  }
}
/** zemin yüksekliği (çift doğrusal) */
function Hs(x, z){
  const fx = (x + RL) / GS, fz = (z + RL) / GS, i = Math.floor(fx), j = Math.floor(fz);
  if (i < 0 || j < 0 || i >= GN - 1 || j >= GN - 1) return 0;
  const u = fx - i, v = fz - j, k = j * GN + i;
  return (HG[k] * (1 - u) + HG[k + 1] * u) * (1 - v) + (HG[k + GN] * (1 - u) + HG[k + GN + 1] * u) * v;
}
const landG = (x, z) => { const i = Math.round((x + RL) / GS), j = Math.round((z + RL) / GS); return i >= 0 && j >= 0 && i < GN && j < GN && LG[j * GN + i] === 1; };

/* ================= yol ağı ================= */
// caddeler (asfalt + kaldırım): [genişlik, noktalar]
const AVENUES = [
  // Tarihî Yarımada: Haliç sahili, Sarayburnu–Kennedy, Divanyolu, Topkapı yolu, Süleymaniye, Fatih bağlantıları
  [7, [[-450, -40], [-380, -44], [-300, -40], [-220, -38], [-160, -34], [-122, -30]]],
  [7, [[-18, -28], [30, -20], [56, -2], [64, 22], [62, 70], [54, 128], [38, 182], [8, 226], [-40, 248], [-120, 258], [-200, 262], [-280, 258], [-350, 248], [-392, 230]]],
  [7, [[-70, 4], [-80, 40], [-92, 75], [-104, 98], [-150, 98], [-215, 99], [-280, 100], [-345, 104], [-430, 110]]],
  [6, [[-104, 98], [-70, 88], [-40, 84], [-24, 80]]],
  [6, [[-160, -34], [-230, -10], [-265, 15], [-282, 52], [-285, 99]]],
  [6, [[-345, 104], [-342, 170], [-332, 246]]],
  [6, [[-215, 99], [-212, 180], [-202, 258]]],
  // Beyoğlu: Haliç sahili–Karaköy–Kabataş–Beşiktaş, Galata, Taksim–Dolmabahçe, Cihangir, Tarlabaşı
  [7, [[-450, -106], [-380, -110], [-300, -117], [-220, -120], [-140, -117], [-62, -114], [0, -110], [40, -116], [56, -140], [54, -190], [46, -240], [20, -262], [16, -345], [32, -378], [40, -440]]],
  [6, [[-62, -114], [-80, -135], [-92, -152]]],
  [6, [[-124, -156], [-148, -136]]],
  [7, [[-124, -400], [-70, -382], [-20, -357], [16, -345]]],
  [6, [[-143, -262], [-90, -264], [-30, -264], [20, -262]]],
  [6, [[-157, -330], [-240, -330], [-320, -322]]],
  [6, [[-157, -205], [-250, -205], [-330, -196]]],
  // Asya: Boğaz sahili, Üsküdar–Çamlıca, Üsküdar–Kadıköy, Bağlarbaşı, Kadıköy çarşısı
  [7, [[170, -440], [172, -400], [175, -330], [181, -260], [189, -190], [195, -120], [199, -60], [222, -30], [250, -5], [258, 40], [258, 100], [244, 140], [236, 178], [252, 205], [300, 202], [322, 208]]],
  [6, [[246, -50], [290, -80], [335, -140], [385, -200], [408, -238]]],
  [6, [[250, -5], [300, -10], [330, 40], [332, 120], [322, 196]]],
  [6, [[189, -190], [260, -200], [330, -200], [370, -190]]],
  [6, [[360, 236], [400, 262], [420, 300]]],
];
const ROADSEG = []; AVENUES.forEach(([w, pts]) => { for (let i = 0; i + 1 < pts.length; i++) ROADSEG.push([pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w / 2 + 2.2]); });
const ISTIKLAL = [[-150, -122], [-150, -394]];
ROADSEG.push([-150, -122, -150, -394, 6.5]);
const roadDist = (x, z) => { let d = 1e9; for (const s of ROADSEG){ const v = segDist(x, z, s[0], s[1], s[2], s[3]) - s[4]; if (v < d) d = v; } return d; };

// mahalleler: sokak ızgarası (sx0, sz0: sokak çizgilerinin başlangıcı; px, pz: aralık)
const ZONES = [
  {name:'beyoglu', x0:-330, x1:25, z0:-335, z1:-122, sx0:-150, px:34, sz0:-128, pz:28},
  {name:'yarimada', x0:-440, x1:-15, z0:-28, z1:258, sx0:-104, px:30, sz0:-4, pz:26},
  {name:'uskudar', x0:196, x1:360, z0:-330, z1:150, sx0:222, px:30, sz0:-14, pz:26},
  {name:'kadikoy', x0:262, x1:440, z0:150, z1:330, sx0:266, px:32, sz0:154, pz:28},
];
const KEEP_C = [[...LM.sultanahmet.slice(0, 2), 34], [...LM.ayasofya.slice(0, 2), 24], [...LM.suleymaniye.slice(0, 2), 32], [...LM.galata.slice(0, 2), 20], [...LM.haydarpasa.slice(0, 2), 38], [PAD.x, PAD.z, 30], [-150, -405, 34], [410, -250, 22], [-90, -14, 30], [215, -45, 28]];
const KEEP_R = [[-150, 100, -82, 210], [-45, -40, 90, 210], [-275, 104, -215, 146], [-128, 6, -84, 40], [-160, -360, -140, -122], [184, 20, 250, 104], [-330, -470, 60, -345], [330, -470, 470, -120], [0, -340, 70, -255]];
const kept = (x, z, pad = 0) => KEEP_C.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + pad) || KEEP_R.some(([a, b, c, d]) => x > a - pad && x < c + pad && z > b - pad && z < d + pad);

const PINS = [['Sultanahmet Camii', 'sultanahmet'], ['Ayasofya', 'ayasofya'], ['Topkapı Sarayı', 'topkapi'], ['Süleymaniye', 'suleymaniye'], ['Galata Kulesi', 'galata'], ['Dolmabahçe', 'dolmabahce'], ['Kız Kulesi', 'kizkulesi'], ['Haydarpaşa', 'haydarpasa']]
  .map(([name, k]) => ({name, x:LM[k][0], z:LM[k][1]}))
  .concat([{name:'Kapalıçarşı', x:-245, z:125}, {name:'Mısır Çarşısı', x:-106, z:23}, {name:'Taksim', x:-150, z:-405}, {name:'Eminönü', x:-70, z:-18}, {name:'Salacak', x:215, z:60}, {name:'Üsküdar', x:215, z:-45}, {name:'Çamlıca', x:410, z:-250}, {name:'Kadıköy', x:360, z:250}]);

const SHOPS = ['BAKKAL', 'FIRIN', 'MANAV', 'BERBER', 'KAHVEHANE', 'LOKANTA', 'ÇİÇEKÇİ', 'KİTAPÇI', 'ECZANE', 'BÖREKÇİ', 'LOKUMCU', 'KURUYEMİŞ', 'BAHARATÇI', 'TUHAFİYE', 'KASAP', 'PASTANE'];
const SHOP_BG = ['#1d3a6a', '#7a2a1a', '#2a5a2a', '#3a3a3a', '#6a3a1a', '#8a1a2a', '#a04a7a', '#2a2a5a', '#1a6a4a', '#9a5a1a', '#8a2a5a', '#5a4a1a', '#7a3a0a', '#4a2a6a', '#6a1a1a', '#b05a7a'];
const PLACES_TXT = ['EMİNÖNÜ', 'KARAKÖY', 'ÜSKÜDAR', 'KADIKÖY', 'MISIR ÇARŞISI', 'KAPALIÇARŞI', 'İSTİKLAL CADDESİ', 'TAKSİM MEYDANI', 'DİVANYOLU CADDESİ', 'ÇAMLICA TEPESİ', 'EJDERHA İNİŞ ALANI', 'GALATA KÖPRÜSÜ', 'SALACAK SAHİLİ', 'GALATA KULESİ', 'KIZ KULESİ', 'SULTANAHMET MEYDANI'];

export default {
  id:'istanbul',
  name:'İstanbul Boğazı',
  theme:'Boğaz, Tarihî Yarımada ve Üsküdar; Pyra ile uçulur',
  author:'mehmetkahya0',
  description:'Boğaz\'ın simgelerini bul ve İstanbul\'un kedilerini sev.',
  order:20,
  seed:41,
  at:AT,
  coast:{radius:R, waves:[], ripple:[]},
  terrain:{groundColor:0x76884e, deep:0x0b3a56, shallow:0x1d7a86, rocks:0, seed:41},
  harbor:HARBOR,
  pierLength:46,
  map:{rings:() => RINGS.map(r => r.pts), pins:PINS},

  build(ctx){
    const { THREE, kit, C, root, rnd } = ctx;
    const store = ctx.store;
    store.cats = store.cats || [];
    const keep = (m) => { m.userData.keep = true; return m; };
    buildGrid();

    // üreticinin yuvarlak zemini, kumsalı, otları ve kayaları kapatılır: kara ve deniz bizim
    root.parent.children.forEach(ch => { if (ch !== root) ch.traverse(o => { if (o.isMesh && (o.name === 'Zemin' || o.userData.rock || o.isInstancedMesh || (o.material && o.material.vertexColors && o.material.map))) o.visible = false; }); });

    // bölge grupları: içindeki sabit parçalar malzeme başına tek parçada birleşir (az çizim çağrısı)
    const REG = {};
    const reg = (x, z) => {
      const k = x > 120 ? (z < -60 ? 'asyaK' : 'asyaG') : z < -70 ? (x < -150 ? 'beyB' : 'beyD') : x < -200 ? 'yarB' : 'yarD';
      if (!REG[k]){ const g = new THREE.Group(); g.userData.dyn = true; g.name = 'Bolge:' + k; root.add(g); REG[k] = g; }
      return REG[k];
    };

    /* ---------- kodla dokular ---------- */
    let sd = 911; const r2 = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const tex = (w, h, draw) => { const [c, g] = kit.canvas(w, h); draw(g); return kit.ctex(c, 1, 1); };
    const cobbleTex = tex(256, 256, g => {          // Arnavut kaldırımı
      g.fillStyle = '#5f584e'; g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 14) for (let x = -8 + (y / 14) % 2 * 7; x < 264; x += 14 + r2() * 3){
        const v = 105 + r2() * 55 | 0; g.fillStyle = `rgb(${v + 6},${v},${v - 12})`;
        g.beginPath(); g.ellipse(x, y + 7, 5.6 + r2() * 1.4, 5.2 + r2(), r2() * 3, 0, Math.PI * 2); g.fill();
      }
    });
    const groundTex = tex(256, 256, g => {
      g.fillStyle = '#76884e'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4200; i++){ const v = r2(), dirt = r2() < 0.18; g.fillStyle = dirt ? `rgba(${150 + v * 40 | 0},${130 + v * 30 | 0},${90 + v * 20 | 0},.35)` : `rgba(${70 + v * 50 | 0},${105 + v * 50 | 0},${45 + v * 25 | 0},.45)`; g.fillRect(r2() * 256, r2() * 256, 1.5, 2.5); }
    });
    const grassTex = tex(256, 256, g => {
      g.fillStyle = '#5e9440'; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 5000; i++){ const v = r2(); g.fillStyle = `rgba(${60 + v * 60 | 0},${110 + v * 70 | 0},${40 + v * 30 | 0},.5)`; g.fillRect(r2() * 256, r2() * 256, 1.5, 3); }
    });
    const asphaltTex = tex(64, 256, g => {         // asfalt: ortada kesik beyaz çizgi (u enine, v boyuna)
      g.fillStyle = '#3d3e42'; g.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 900; i++){ const v = 50 + r2() * 30 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},.5)`; g.fillRect(r2() * 64, r2() * 256, 1.2, 1.2); }
      g.fillStyle = '#e8e4d8'; g.fillRect(30.5, 0, 3, 128);
      g.fillStyle = '#c9b35a'; g.fillRect(1, 0, 2, 256); g.fillRect(61, 0, 2, 256);
    });
    const paveTex = tex(128, 128, g => {          // kaldırım taşı
      g.fillStyle = '#b8b2a6'; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = '#8f897e'; g.lineWidth = 2;
      for (let i = 0; i <= 128; i += 32){ g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
      for (let i = 0; i < 600; i++){ const v = 160 + r2() * 40 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 12},.4)`; g.fillRect(r2() * 128, r2() * 128, 2, 2); }
    });
    // tabela atlası: 16 satır, her satır bir tabela (u: 0..1, v: satır)
    const atlas = (names, bgs, fg = '#f6ecd0') => tex(512, 512, g => {
      names.forEach((t, i) => {
        const y = i * 32; g.fillStyle = bgs ? bgs[i % bgs.length] : '#1d3a8a'; g.fillRect(0, y, 512, 32);
        g.strokeStyle = bgs ? '#d4af37' : '#ffffff'; g.lineWidth = 2; g.strokeRect(3, y + 3, 506, 26);
        g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 22; do { g.font = 'bold ' + fs + 'px Georgia, serif'; fs--; } while (g.measureText(t).width > 470);
        g.fillText(t, 256, y + 17);
      });
    });
    const shopAtlas = atlas(SHOPS, SHOP_BG), placeAtlas = atlas(PLACES_TXT, null);
    const awnTex = tex(256, 256, g => {            // tente: 8 satır, çizgili
      const P = [['#c8202e', '#f4ece0'], ['#1d5a9a', '#f4ece0'], ['#2a7a3a', '#f4ece0'], ['#d8a020', '#7a3a1a'], ['#7a2a5a', '#f4ece0'], ['#1a1a1a', '#d8b45a'], ['#e07a2a', '#f4ece0'], ['#3a8a8a', '#f4ece0']];
      P.forEach(([a, b], i) => { for (let x = 0; x < 256; x += 16){ g.fillStyle = (x / 16) % 2 ? b : a; g.fillRect(x, i * 32, 16, 32); } });
    });
    const flagTex = tex(256, 170, g => {           // Türk bayrağı
      g.fillStyle = '#e30a17'; g.fillRect(0, 0, 256, 170);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(88, 85, 42, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e30a17'; g.beginPath(); g.arc(98.5, 85, 33.6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath();
      for (let i = 0; i < 10; i++){ const a = Math.PI + i * Math.PI / 5, rr = i % 2 ? 8.4 : 21; g.lineTo(140 + Math.cos(a) * rr, 85 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
    });
    [cobbleTex, groundTex, grassTex, paveTex].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
    asphaltTex.wrapS = THREE.ClampToEdgeWrapping; asphaltTex.wrapT = THREE.RepeatWrapping;
    const PO = (f) => ({polygonOffset:true, polygonOffsetFactor:f, polygonOffsetUnits:f});
    const groundM = new THREE.MeshStandardMaterial({map:groundTex, roughness:0.97});
    const grassM = new THREE.MeshStandardMaterial(Object.assign({map:grassTex, roughness:1}, PO(-2)));
    const cobbleM = new THREE.MeshStandardMaterial(Object.assign({map:cobbleTex, roughness:0.95}, PO(-3)));
    const paveM = new THREE.MeshStandardMaterial(Object.assign({map:paveTex, roughness:0.9}, PO(-4)));
    const asphaltM = new THREE.MeshStandardMaterial(Object.assign({map:asphaltTex, roughness:0.92}, PO(-5)));
    const shopSignM = new THREE.MeshStandardMaterial({map:shopAtlas, roughness:0.7, emissive:0xffffff, emissiveMap:shopAtlas, emissiveIntensity:0});
    const placeSignM = new THREE.MeshStandardMaterial({map:placeAtlas, roughness:0.6});
    const awnM = new THREE.MeshStandardMaterial({map:awnTex, roughness:0.85, side:THREE.DoubleSide});
    const flagM = new THREE.MeshStandardMaterial({map:flagTex, roughness:0.8, side:THREE.DoubleSide});
    const shopGlassM = new THREE.MeshStandardMaterial({color:0x9fbccc, metalness:0.3, roughness:0.15, emissive:0xffcf8a, emissiveIntensity:0});
    const worldUV = (g, s) => { const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / s, p.getZ(i) / s); return g; };
    const drape = (g, yAdd) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, Hs(p.getX(i), p.getZ(i)) + yAdd); g.computeVertexNormals(); return g; };
    const rowUV = (g, row, rows = 16) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (row + 1 - uv.getY(i)) / rows); return g; };

    /* ---------- deniz ---------- */
    const waterNormal = new THREE.TextureLoader().load('assets/textures/su_normal.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
    waterNormal.repeat.set(R / 7, R / 7);
    const sea = keep(new THREE.Mesh(new THREE.CircleGeometry(R - 10, 96).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({color:0x0e4560, roughness:0.08, metalness:0, normalMap:waterNormal, normalScale:new THREE.Vector2(0.6, 0.6)})));
    sea.position.y = SEA_Y; sea.receiveShadow = false; root.add(sea);

    /* ---------- kara: taş rıhtımlı düz taban + tepeli arazi örtüsü ---------- */
    const quayM = kit.mat(0x8f8a80, {roughness:0.9});
    RINGS.forEach(({pts}, i) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1]))), {depth:2.4, bevelEnabled:false});
      g.rotateX(Math.PI / 2); worldUV(g, 9);
      const m = keep(new THREE.Mesh(g, i === 3 ? [kit.mat(0x6c665e), quayM] : [groundM, quayM])); m.receiveShadow = true; root.add(m);
    });
    {
      // 5 m'lik ızgara; yalnız dört köşesi de karada olan hücreler (kıyıda yükseklik 0, alttaki düz tabana oturur)
      const S5 = 5, n = Math.ceil(RL * 2 / S5) + 1, idxOf = new Int32Array(n * n).fill(-1), pos = [], uv = [], ind = [];
      const vid = (i, j) => { const k = j * n + i; if (idxOf[k] < 0){ const x = -RL + i * S5, z = -RL + j * S5; idxOf[k] = pos.length / 3; pos.push(x, Hs(x, z) + 0.02, z); uv.push(x / 9, z / 9); } return idxOf[k]; };
      for (let j = 0; j + 1 < n; j++) for (let i = 0; i + 1 < n; i++){
        const x = -RL + i * S5, z = -RL + j * S5;
        if (!(landG(x, z) && landG(x + S5, z) && landG(x, z + S5) && landG(x + S5, z + S5))) continue;
        if (Math.max(Hs(x, z), Hs(x + S5, z), Hs(x, z + S5), Hs(x + S5, z + S5)) < 0.01) continue;
        const a = vid(i, j), b = vid(i + 1, j), c = vid(i, j + 1), d = vid(i + 1, j + 1);
        ind.push(a, c, b, b, c, d);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ind); g.computeVertexNormals();
      const m = keep(new THREE.Mesh(g, groundM)); m.receiveShadow = true; root.add(m);
    }
    // yürünebilir arazi
    C.heightFns.push((x, z) => landG(x, z) ? Hs(x, z) : null);
    // kıyı duvarı ve rıhtım taşı
    {
      const curb = [];
      RINGS.forEach(({pts, edge}) => {
        let area = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; });
        const s = area < 0 ? 1 : -1;
        pts.forEach((p, i) => {
          if (edge[i]) return;
          const q = pts[(i + 1) % pts.length], ex = q[0] - p[0], ez = q[1] - p[1], l = Math.hypot(ex, ez); if (l < 0.01) return;
          const nx = -ez / l * s, nz = ex / l * s;
          const b = C.box((p[0] + q[0]) / 2 + nx * 0.5, (p[1] + q[1]) / 2 + nz * 0.5, l / 2 + 0.3, 0.5, Math.atan2(-ez, ex)); b.y0 = WALL.y0; b.y1 = WALL.y1; b.low = true;
          const k = new THREE.BoxGeometry(l + 0.6, 0.2, 1.2); k.rotateY(Math.atan2(-ez, ex)); k.translate((p[0] + q[0]) / 2 - nx * 0.6, 0.0, (p[1] + q[1]) / 2 - nz * 0.6); curb.push(k);
        });
      });
      const m = keep(new THREE.Mesh(mergeBufferGeometries(curb), kit.mat(0xd2c8b4, {roughness:0.85}))); m.receiveShadow = true; m.castShadow = true; root.add(m);
    }

    /* ---------- şeritler: arazinin üstüne oturan yollar ---------- */
    const lists = new Map();
    const put = (mat, g) => { if (!lists.has(mat)) lists.set(mat, []); lists.get(mat).push(g); };
    /** polyline boyunca şerit; off: eksenden yana kayma; uvMode 'cross': u 0..1 enine; aksi halde dünya ölçüsü */
    function ribbon(pts, w, off, yAdd, mat, uvS = 3.2, uvMode = 'world', skip = null){
      const P = [];
      for (let i = 0; i + 1 < pts.length; i++){
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 3));
        for (let k = (i ? 1 : 0); k <= n; k++) P.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
      }
      if (P.length < 2) return;
      const pos = [], uv = [], ind = []; let along = 0;
      for (let i = 0; i < P.length; i++){
        const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1, nx = -tz / tl, nz = tx / tl;
        if (i) along += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
        [-1, 1].forEach((sgn, s) => {
          const x = P[i][0] + nx * (off + sgn * w / 2), z = P[i][1] + nz * (off + sgn * w / 2);
          pos.push(x, Hs(x, z) + yAdd, z);
          uv.push(uvMode === 'cross' ? s : x / uvS, uvMode === 'cross' ? along / 12 : z / uvS);
        });
        if (i){ const q = (i - 1) * 2, mx = (P[i][0] + P[i - 1][0]) / 2 + nx * off, mz = (P[i][1] + P[i - 1][1]) / 2 + nz * off; if (!(skip && skip(mx, mz))) ind.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
      }
      if (!ind.length) return;
      // sarma yönü: yukarı bakmayan üçgenleri çevir
      for (let i = 0; i < ind.length; i += 3){ const A = ind[i] * 3, B = ind[i + 1] * 3, Cc = ind[i + 2] * 3; const ux = pos[B] - pos[A], uz = pos[B + 2] - pos[A + 2], vx = pos[Cc] - pos[A], vz = pos[Cc + 2] - pos[A + 2]; if (uz * vx - ux * vz < 0){ const t = ind[i + 1]; ind[i + 1] = ind[i + 2]; ind[i + 2] = t; } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ind);
      g.computeVertexNormals(); put(mat, g);
    }
    const water = (x, z) => !landG(x, z);
    AVENUES.forEach(([w, pts]) => {
      ribbon(pts, w, 0, 0.09, asphaltM, 3.2, 'cross', water);
      [-1, 1].forEach(s => ribbon(pts, 2.2, s * (w / 2 + 1.1), 0.13, paveM, 2, 'world', water));
    });
    ribbon(ISTIKLAL, 12, 0, 0.08, cobbleM, 3.2, 'world');
    // meydanlar ve parklar: araziye oturan yamalar
    const patch = (mat, x0, z0, x1, z1, yAdd, s) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.ceil((x1 - x0) / 4), Math.ceil((z1 - z0) / 4)).rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2); worldUV(g, s); put(mat, drape(g, yAdd)); };
    const plaza = (mat, x, z, r, yAdd, s) => { const g = new THREE.RingGeometry(0.01, r, 40, Math.ceil(r / 4)).rotateX(-Math.PI / 2); g.translate(x, 0, z); worldUV(g, s); put(mat, drape(g, yAdd)); };
    patch(grassM, -40, -32, 66, 205, 0.05, 6);          // Gülhane ve Topkapı bahçeleri
    patch(grassM, -148, 112, -84, 205, 0.05, 6);        // Sultanahmet parkı
    patch(grassM, 184, 24, 250, 104, 0.05, 6);          // Salacak çay bahçesi
    plaza(grassM, 410, -250, 26, 0.05, 6);              // Çamlıca tepesi
    plaza(cobbleM, -150, -405, 30, 0.07, 3.2);          // Taksim Meydanı
    plaza(cobbleM, -108, -168, 19, 0.07, 3.2);          // Galata meydanı
    patch(cobbleM, -122, -44, -18, 6, 0.07, 3.2);       // Eminönü meydanı
    patch(cobbleM, -122, 128, -110, 205, 0.07, 3.2);    // Hipodrom
    patch(cobbleM, -148, 152, -84, 162, 0.07, 3.2);     // iki cami arası
    patch(cobbleM, 186, -72, 246, -18, 0.07, 3.2);      // Üsküdar meydanı
    patch(cobbleM, -275, 104, -215, 112, 0.07, 3.2);    // Kapalıçarşı önü
    plaza(paveM, PAD.x, PAD.z, 17, 0.08, 2);            // ejderha iniş alanı

    /* ---------- cumbalı İstanbul evleri ve dükkânlar ---------- */
    const WALLS = [0xd9a441, 0xe2a39a, 0x9cc3d5, 0xa9c29a, 0xf0e2c4, 0x8e3b2f, 0xece6da, 0xc98b5a, 0xb7c7d8, 0x8a6a4a, 0xd8c0a0].map(c => kit.mat(c, {roughness:0.85}));
    const stoneM = kit.mat(0xb9ab93, {roughness:0.9}), roofM = kit.mat(0xa5482f, {roughness:0.75}), eaveM = kit.mat(0xf3ead8, {roughness:0.7});
    const doorM = kit.mat(0x4a2c1a, {roughness:0.7}), shutM = kit.mat(0x2f5a3a, {roughness:0.8}), potM = kit.mat(0xa0522d, {roughness:0.9});
    const occ = new Set(); const cell = (x, z) => Math.floor(x / 6) + '|' + Math.floor(z / 6);
    const fronts = [];        // dükkân önleri, kedi ve insan yerleri: {x, z, ry, y}
    const boxes = [];         // saksılar
    const rows = new Map();   // çamaşır ipleri için karşılıklı sıralar
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
    let houses = 0;
    const houseList = [];     // modüller için: {x, z, w, d, ry, base, top, shop}
    function ev(x, z, w, d, ry, floors, wallM, shop, rowKey){
      const c = Math.cos(ry), s = Math.sin(ry), W = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
      const cs = [W(-w / 2, -d / 2), W(w / 2, -d / 2), W(-w / 2, d / 2), W(w / 2, d / 2)].map(([a, b]) => Hs(a, b));
      const base = Math.max(...cs), low = Math.min(...cs);
      const G = reg(x, z), g = new THREE.Group(); g.position.set(x, base, z); g.rotation.y = ry; G.add(g);
      const f1 = 3.1, fu = 2.9, top = f1 + fu * (floors - 1);
      kit.add(new THREE.BoxGeometry(w + 0.2, base - low + 0.8, d + 0.2), stoneM, 0, -(base - low + 0.8) / 2 + 0.05, 0, g);   // yamaçta temel
      kit.add(new THREE.BoxGeometry(w, f1, d), stoneM, 0, f1 / 2, 0, g);
      if (floors > 1){
        kit.add(new THREE.BoxGeometry(w + 0.4, top - f1, d + 0.6), wallM, 0, f1 + (top - f1) / 2, 0.1, g);
        const cw = Math.min(w * 0.46, 3.8);
        kit.add(new THREE.BoxGeometry(cw, top - f1 - 0.5, 1.0), wallM, 0, f1 + (top - f1) / 2 + 0.1, d / 2 + 0.9, g);
        for (let fl = 1; fl < floors; fl++){
          const y = f1 + fu * (fl - 0.5);
          kit.add(new THREE.PlaneGeometry(cw * 0.7, 1.3), kit.winMat, 0, y, d / 2 + 1.42, g, false);
          [-1, 1].forEach(sg => {
            const wx = sg * (cw / 2 + (w / 2 - cw / 2) / 2); if (Math.abs(wx) + 0.6 > w / 2) return;
            kit.add(new THREE.PlaneGeometry(0.9, 1.4), kit.winMat, wx, y, d / 2 + 0.42, g, false);
            kit.add(new THREE.BoxGeometry(0.28, 1.5, 0.06), shutM, wx - sg * 0.62, y, d / 2 + 0.43, g, false);
            if (rnd() < 0.35){ const [bx, bz] = W(wx, d / 2 + 0.6); boxes.push([bx, base + y - 0.85, bz, ry]); }
          });
          const back = kit.add(new THREE.PlaneGeometry(0.9, 1.4), kit.winMat, 0, y, -d / 2 - 0.22, g, false); back.rotation.y = Math.PI;
        }
      }
      kit.add(new THREE.BoxGeometry(w + 1.4, 0.24, d + 2.0), eaveM, 0, top + 0.12, 0.3, g);
      kit.add(kit.frustum(w + 1.4, d + 2.0, 2.1, Math.min(w, d) * 0.5), roofM, 0, top + 1.29, 0.3, g);
      if (rnd() < 0.3) kit.add(new THREE.BoxGeometry(0.6, 1.4, 0.6), stoneM, w * 0.3, top + 1.6, -d * 0.2, g);    // baca
      if (shop >= 0){
        // dükkân: vitrin, kapı, çizgili tente, tabela
        kit.add(new THREE.PlaneGeometry(w * 0.58, 1.75), shopGlassM, w * 0.12, 1.35, d / 2 + 0.03, g, false);
        kit.add(new THREE.BoxGeometry(1.1, 2.2, 0.1), doorM, -w * 0.32, 1.1, d / 2 + 0.03, g, false);
        const aw = w * 0.92, ag = new THREE.BufferGeometry(), row = Math.floor(rnd() * 8);
        ag.setAttribute('position', new THREE.Float32BufferAttribute([-aw / 2, 2.75, 0.05, aw / 2, 2.75, 0.05, -aw / 2, 2.3, 1.45, aw / 2, 2.3, 1.45], 3));
        ag.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1 - row / 8, aw / 4, 1 - row / 8, 0, 1 - (row + 1) / 8, aw / 4, 1 - (row + 1) / 8], 2));
        ag.setIndex([0, 2, 1, 1, 2, 3]); ag.computeVertexNormals();
        kit.add(ag, awnM, 0, 0, d / 2, g, false);
        kit.add(rowUV(new THREE.PlaneGeometry(w * 0.8, w * 0.8 / 16 * 1.8), shop), shopSignM, 0, 2.95, d / 2 + 0.06, g, false);
        const [fx, fz] = W(w * 0.12, d / 2 + 1.6); fronts.push({x:fx, z:fz, ry, y:Hs(fx, fz), shop:SHOPS[shop]});
      } else {
        kit.add(new THREE.BoxGeometry(1.15, 2.2, 0.12), doorM, -w * 0.25, 1.1, d / 2 + 0.03, g, false);
        kit.add(new THREE.PlaneGeometry(0.8, 1.0), kit.winMat, w * 0.22, 1.9, d / 2 + 0.03, g, false);
        if (rnd() < 0.2){ const [fx, fz] = W(-w * 0.25, d / 2 + 1.2); fronts.push({x:fx, z:fz, ry, y:Hs(fx, fz)}); }
      }
      C.box(x, z, w / 2 + 0.3, d / 2 + 1.0, ry);
      for (let a = -w / 2; a <= w / 2; a += 3) for (let b = -d / 2; b <= d / 2 + 1; b += 3){ const [cx, cz] = W(a, b); occ.add(cell(cx, cz)); }
      if (rowKey){ if (!rows.has(rowKey)) rows.set(rowKey, []); rows.get(rowKey).push({x, z:z + (ry === 0 ? d / 2 + 0.5 : -d / 2 - 0.5), w, y:base + top - 1.6}); }
      houseList.push({x, z, w, d, ry, base, top, shop:shop >= 0 ? SHOPS[shop] : null});
      houses++;
    }
    ZONES.forEach((Z, zi) => {
      const xs = []; for (let x = Z.sx0; x <= Z.x1; x += Z.px) xs.push(x); for (let x = Z.sx0 - Z.px; x >= Z.x0; x -= Z.px) xs.push(x); xs.sort((a, b) => a - b);
      const zs = []; for (let z = Z.sz0; z <= Z.z1; z += Z.pz) zs.push(z); for (let z = Z.sz0 - Z.pz; z >= Z.z0; z -= Z.pz) zs.push(z); zs.sort((a, b) => a - b);
      const edges = new Set();
      for (let i = 0; i + 1 < xs.length; i++) for (let j = 0; j + 1 < zs.length; j++){
        const bx0 = xs[i] + 3.2, bx1 = xs[i + 1] - 3.2, bz0 = zs[j] + 3.2, bz1 = zs[j + 1] - 3.2, d = Math.min(8, (bz1 - bz0) / 2 - 0.4);
        if (d < 5) continue;
        let any = 0;
        [[bz0 + d / 2 + 0.2, Math.PI, 'N'], [bz1 - d / 2 - 0.2, 0, 'S']].forEach(([zc, ry, side]) => {
          for (let x = bx0; x < bx1 - 5;){
            const w = Math.min(bx1 - x, 6.5 + rnd() * 3.5), cx = x + w / 2;
            x += w + 0.25;
            if (w < 5 || houses >= 1000) continue;
            const hr = Math.max(w, d) / 2 + 2;
            if (!inland(cx, zc, hr + 1) || kept(cx, zc, hr) || roadDist(cx, zc) < hr - 1) continue;
            const fl = 2 + (rnd() < 0.55 ? 1 : 0) + (rnd() < 0.15 ? 1 : 0);
            const frontZ = zc + (ry === 0 ? d / 2 + 4 : -d / 2 - 4), nearRoad = roadDist(cx, frontZ) < 6;
            const shop = nearRoad || rnd() < 0.18 ? Math.floor(rnd() * SHOPS.length) : -1;
            ev(cx, zc, w - 0.2, d, ry, fl, WALLS[Math.floor(rnd() * WALLS.length)], shop, zi + '|' + (side === 'S' ? j + 1 : j) + '|' + side);
            any++;
          }
        });
        // ara sokaklar: yalnız evi olan blokların çevresi (kopuk kare yollar kalmaz)
        if (any){ edges.add('v|' + i + '|' + j); edges.add('v|' + (i + 1) + '|' + j); edges.add('h|' + i + '|' + j); edges.add('h|' + i + '|' + (j + 1)); }
      }
      edges.forEach(k => {
        const [t, a, b] = k.split('|'), ia = +a, jb = +b;
        if (t === 'v') ribbon([[xs[ia], zs[jb] - 2.8], [xs[ia], zs[jb + 1] + 2.8]], 5.6, 0, 0.07, cobbleM, 3.2, 'world', water);
        else ribbon([[xs[ia] - 2.8, zs[jb]], [xs[ia + 1] + 2.8, zs[jb]]], 5.6, 0, 0.07, cobbleM, 3.2, 'world', water);
      });
    });
    // saksılar ve sardunyalar
    if (boxes.length){
      const pg = new THREE.BoxGeometry(1.0, 0.22, 0.3), fg = new THREE.SphereGeometry(0.11, 6, 4);
      const P = new THREE.InstancedMesh(pg, potM, boxes.length), F = new THREE.InstancedMesh(fg, kit.mat(0xffffff, {roughness:0.7}), boxes.length * 4);
      const col = new THREE.Color(), FC = [0xd8202e, 0xe85aa0, 0xf6f0e8, 0xf07a22, 0xc02060];
      boxes.forEach(([x, y, z, ry], i) => {
        m4.compose(p4.set(x, y, z), q4.setFromEuler(e4.set(0, ry, 0)), s4.set(1, 1, 1)); P.setMatrixAt(i, m4);
        const c = Math.cos(ry), s = Math.sin(ry), fc = FC[Math.floor(rnd() * FC.length)];
        for (let k = 0; k < 4; k++){ const lx = -0.36 + k * 0.24; m4.compose(p4.set(x + lx * c, y + 0.2, z - lx * s), q4.identity(), s4.set(1, 1, 1)); F.setMatrixAt(i * 4 + k, m4); F.setColorAt(i * 4 + k, col.set(rnd() < 0.2 ? 0x3d7a2e : fc).convertSRGBToLinear()); }
      });
      root.add(P, F);
    }
    // çamaşır ipleri: sokağın iki yanındaki evler arasında
    {
      const lines = [], cl = [];
      rows.forEach((list, k) => {
        if (!k.endsWith('|S')) return;
        const other = rows.get(k.slice(0, -1) + 'N'); if (!other) return;
        list.forEach(a => {
          if (rnd() > 0.22) return;
          const b = other.find(o => Math.abs(o.x - a.x) < (o.w + a.w) / 2 - 2); if (!b) return;
          const x = (a.x + b.x) / 2 + (rnd() - 0.5) * 2, y = Math.min(a.y, b.y), len = Math.abs(b.z - a.z);
          const l = new THREE.CylinderGeometry(0.012, 0.012, len, 3); l.rotateX(Math.PI / 2); l.translate(x, y, (a.z + b.z) / 2); lines.push(l);
          for (let t = 0.15; t < 0.9; t += 0.12 + rnd() * 0.1) cl.push([x, y - 0.32, a.z + (b.z - a.z) * t]);
        });
      });
      if (lines.length){
        kit.add(mergeBufferGeometries(lines), kit.mat(0xdddddd), 0, 0, 0, root, false);
        const I = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.6), kit.mat(0xffffff, {side:THREE.DoubleSide, roughness:0.9}), cl.length), col = new THREE.Color();
        const CC = [0xf2f0ea, 0x3a6ab0, 0xd84a3a, 0xf2c230, 0x5aa05a, 0xe8a0c0, 0x8a8a8a];
        cl.forEach(([x, y, z], i) => { m4.compose(p4.set(x, y, z), q4.setFromEuler(e4.set(0, Math.PI / 2, 0)), s4.set(0.7 + rnd() * 0.6, 0.7 + rnd() * 0.6, 1)); I.setMatrixAt(i, m4); I.setColorAt(i, col.set(CC[Math.floor(rnd() * CC.length)]).convertSRGBToLinear()); });
        root.add(I);
      }
    }

    /* ---------- simge yapılar (tepe düzlüklerinde) ---------- */
    root.updateMatrixWorld(true);
    const LMy = {}; Object.entries(LM).forEach(([k, v]) => { LMy[k] = [v[0], v[1], v[2], v[3], k === 'kizkulesi' ? 0 : Hs(v[0], v[1])]; });
    const lmCtx = Object.assign(Object.create(ctx), {place:(p) => ctx.place(p.id === 'kizkulesi' ? Object.assign({}, p, {r:70}) : p)});
    buildLandmarks(lmCtx, LMy);
    Object.values(LM).forEach(([x, z]) => { for (let a = -30; a <= 30; a += 6) for (let b = -30; b <= 30; b += 6) occ.add(cell(x + a, z + b)); });

    /* ---------- yardımcılar: tabela, bayrak, bank, çeşme ---------- */
    const lampPole = kit.mat(0x1f2124, {roughness:0.5});
    const signPost = (row, x, z, ry, w = 3.6) => {
      const G = reg(x, z), y = Hs(x, z), c = Math.cos(ry), s = Math.sin(ry);
      [-w / 2 + 0.2, w / 2 - 0.2].forEach(dx => kit.add(new THREE.BoxGeometry(0.12, 2.8, 0.12), lampPole, x + dx * c, y + 1.4, z - dx * s, G));
      const b = kit.add(rowUV(new THREE.BoxGeometry(w, w / 16 * 2, 0.08), row), placeSignM, x, y + 2.5, z, G); b.rotation.y = ry;
      C.circle(x, z, 0.3);
    };
    const flags = [];
    const flag = (x, z, h = 9) => {
      const y = Hs(x, z), G = reg(x, z);
      kit.add(new THREE.CylinderGeometry(0.07, 0.1, h, 8), kit.mat(0xd8d8d8, {metalness:0.6, roughness:0.3}), x, y + h / 2, z, G);
      kit.add(new THREE.SphereGeometry(0.14, 8, 6), kit.gold, x, y + h + 0.1, z, G);
      const f = keep(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6, 8, 1), flagM)); f.geometry.translate(1.2, 0, 0); f.position.set(x + 0.08, y + h - 0.9, z); f.castShadow = true; root.add(f); flags.push(f);
      C.circle(x, z, 0.2);
    };
    const benchM = kit.mat(0x6a4a2e, {roughness:0.85});
    const bench = (x, z, ry) => { const G = reg(x, z), y = Hs(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); kit.add(new THREE.BoxGeometry(2.0, 0.1, 0.55), benchM, 0, 0.48, 0, g); kit.add(new THREE.BoxGeometry(2.0, 0.5, 0.08), benchM, 0, 0.8, -0.26, g); [-0.85, 0.85].forEach(a => kit.add(new THREE.BoxGeometry(0.08, 0.48, 0.5), lampPole, a, 0.24, 0, g)); C.box(x, z, 1.0, 0.35, ry).low = true; };
    const cesme = (x, z, ry) => {   // Osmanlı sokak çeşmesi
      const G = reg(x, z), y = Hs(x, z), g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
      kit.add(new THREE.BoxGeometry(2.6, 3.0, 0.9), kit.marble, 0, 1.5, 0, g);
      kit.add(new THREE.BoxGeometry(3.0, 0.3, 1.2), kit.marble, 0, 3.15, 0, g);
      kit.add(new THREE.PlaneGeometry(1.2, 1.6), kit.mat(0x6a7a7a, {roughness:0.6}), 0, 1.5, 0.46, g, false);
      kit.add(new THREE.BoxGeometry(1.8, 0.45, 0.7), kit.marble, 0, 0.22, 0.7, g);
      kit.add(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), kit.gold, 0, 1.2, 0.6, g).rotation.x = Math.PI / 2;
      C.box(x, z, 1.4, 0.8, ry);
    };
    const lampList = [];

    /* ---------- köprüler: Galata (Haliç) ve Boğaziçi (asma köprü) ---------- */
    const deckM = kit.mat(0x6a6c70, {roughness:0.9}), railM = kit.mat(0x2b2d30, {roughness:0.6}), pierM = kit.mat(0x8a8478, {roughness:0.9});
    function bridge(x0, z0, x1, z1, w, rise, rails = true){
      const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, yaw = Math.atan2(ux, uz), N = Math.max(1, Math.ceil(L / 6));
      const e0 = Hs(x0, z0) + 0.45, e1 = Hs(x1, z1) + 0.45, h = t => e0 + (e1 - e0) * t + Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) * rise;
      for (let i = 0; i < N; i++){
        const t0 = i / N, t1 = (i + 1) / N, y0 = h(t0), y1 = h(t1), seg = Math.hypot(L / N, y1 - y0);
        const b = kit.add(new THREE.BoxGeometry(w, 0.6, seg + 0.05), deckM, x0 + dx * (t0 + t1) / 2, (y0 + y1) / 2 - 0.3, z0 + dz * (t0 + t1) / 2);
        b.rotation.order = 'YXZ'; b.rotation.y = yaw; b.rotation.x = -Math.atan2(y1 - y0, L / N);
        if (rails) [-1, 1].forEach(s => { const r = kit.add(new THREE.BoxGeometry(0.14, 0.95, seg + 0.05), railM, x0 + dx * (t0 + t1) / 2 - uz * s * (w / 2 - 0.08), (y0 + y1) / 2 + 0.45, z0 + dz * (t0 + t1) / 2 + ux * s * (w / 2 - 0.08)); r.rotation.order = 'YXZ'; r.rotation.y = yaw; r.rotation.x = -Math.atan2(y1 - y0, L / N); });
      }
      for (let d = 0; d <= L; d += 3) for (let o = -w / 2 - 3; o <= w / 2 + 3; o += 3) occ.add(cell(x0 + ux * d - uz * o, z0 + uz * d + ux * o));
      const cs = Math.cos(yaw), sn = Math.sin(yaw), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      C.heightFns.push((x, z) => { const ex = x - cx, ez = z - cz, lx = ex * cs - ez * sn, lz = ex * sn + ez * cs; return Math.abs(lx) < w / 2 - 0.2 && Math.abs(lz) < L / 2 ? h(lz / L + 0.5) : null; });
      if (rails) [-1, 1].forEach(s => { const o = C.box(cx - uz * s * (w / 2 + 0.1), cz + ux * s * (w / 2 + 0.1), L / 2, 0.25, Math.atan2(-uz, ux)); o.y0 = 0.3; o.y1 = 40; });
      return {h, ux, uz, L};
    }
    const GKb = bridge(-62, -30, -62, -110, 11, 0);
    for (let z = -100; z <= -38; z += 10) [-1, 1].forEach(s => lampList.push([-62 + s * 5.2, z, GKb.h((z + 30) / -80)]));
    for (let z = -95; z <= -45; z += 25) kit.add(new THREE.BoxGeometry(2.2, 4, 2.2), pierM, -62, -1.8, z);
    const BZ = {x0:30, x1:182, z:-400, top:7.5};
    const BZb = bridge(BZ.x0, BZ.z, BZ.x1, BZ.z, 12, BZ.top);
    {
      const towerM = kit.mat(0xb64a3c, {roughness:0.7}), cableM = kit.mat(0xc9c9c9, {roughness:0.4, metalness:0.6});
      const TX = [62, 154], TH = 36;
      TX.forEach(tx => [-1, 1].forEach(s => { kit.add(new THREE.BoxGeometry(1.6, TH, 1.6), towerM, tx, TH / 2 - 2, BZ.z + s * 6.6); C.circle(tx, BZ.z + s * 6.6, 1.1); }));
      TX.forEach(tx => [TH - 6, 14].forEach(y => kit.add(new THREE.BoxGeometry(1.2, 1.2, 14.4), towerM, tx, y, BZ.z)));
      const deckY = x => BZb.h((x - BZ.x0) / (BZ.x1 - BZ.x0));
      [-1, 1].forEach(s => {
        const z = BZ.z + s * 6.6, pts = [];
        for (let i = 0; i <= 40; i++){ const x = BZ.x0 - 10 + (BZ.x1 - BZ.x0 + 20) * i / 40;
          let y; if (x < TX[0]) y = Hs(BZ.x0 - 10, z) + 1 + (TH - 4 - Hs(BZ.x0 - 10, z)) * Math.pow((x - (BZ.x0 - 10)) / (TX[0] - BZ.x0 + 10), 1.4);
          else if (x > TX[1]) y = Hs(BZ.x1 + 10, z) + 1 + (TH - 4 - Hs(BZ.x1 + 10, z)) * Math.pow(((BZ.x1 + 10) - x) / (BZ.x1 + 10 - TX[1]), 1.4);
          else { const u = (x - TX[0]) / (TX[1] - TX[0]); y = TH - 2 - (TH - 14) * 4 * u * (1 - u); }
          pts.push(new THREE.Vector3(x, y, z)); }
        kit.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.22, 6), cableM, 0, 0, 0, root, false);
        for (let x = TX[0] + 6; x < TX[1]; x += 6){ const u = (x - TX[0]) / (TX[1] - TX[0]), yc = TH - 2 - (TH - 14) * 4 * u * (1 - u), yd = deckY(x); kit.add(new THREE.CylinderGeometry(0.05, 0.05, yc - yd, 4), cableM, x, (yc + yd) / 2, z, root, false); }
      });
      for (let x = BZ.x0 + 8; x < BZ.x1; x += 16) [-1, 1].forEach(s => lampList.push([x, BZ.z + s * 5.6, deckY(x)]));
    }
    ctx.place({id:'galatakoprusu', name:'Galata Köprüsü', x:-62, z:-70, r:12});
    ctx.place({id:'bogazici', name:'Boğaziçi Köprüsü', x:(BZ.x0 + BZ.x1) / 2, z:BZ.z, r:20});

    /* ---------- cadde fenerleri ve ağaçları ---------- */
    const treeSpots = [];
    AVENUES.forEach(([w, pts]) => {
      let acc = 0, side = 1;
      for (let i = 0; i + 1 < pts.length; i++){
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let d = 0; d < L; d += 4){
          acc += 4;
          const x = ax + ux * d, z = az + uz * d;
          if (acc % 24 === 0){ const lx = x - uz * side * (w / 2 + 1.9), lz = z + ux * side * (w / 2 + 1.9); if (landG(lx, lz) && inland(lx, lz, 1.5)) lampList.push([lx, lz, Hs(lx, lz)]); side = -side; }
          if (acc % 16 === 8) [-1, 1].forEach(s => treeSpots.push([x - uz * s * (w / 2 + 3.6), z + ux * s * (w / 2 + 3.6)]));
        }
      }
    });
    for (let z = -380; z <= -140; z += 20) [-1, 1].forEach(s => lampList.push([-150 + s * 5.4, z, Hs(-150 + s * 5.4, z)]));
    [[-110, 130], [-110, 190], [-85, 155], [190, 30], [190, 90], [196, -60], [236, -60], [-100, -10], [-30, -10], [PAD.x - 14, PAD.z], [PAD.x + 14, PAD.z], [-130, -405], [-170, -405], [400, -250], [420, -250]].forEach(([x, z]) => lampList.push([x, z, Hs(x, z)]));

    /* ---------- ağaçlar (çınar, servi), laleler, banklar, çeşmeler, bayraklar ---------- */
    {
      const plane = [], cyp = [];
      const tryTree = (x, z, kind) => { if (!landG(x, z) || !inland(x, z, 2.5) || occ.has(cell(x, z)) || roadDist(x, z) < 0.5) return; (kind ? cyp : plane).push([x, z, 0.8 + rnd() * 0.5]); occ.add(cell(x, z)); };
      const scatter = (x0, z0, x1, z1, n, cypress = 0.3) => { for (let i = 0; i < n; i++) tryTree(x0 + rnd() * (x1 - x0), z0 + rnd() * (z1 - z0), rnd() < cypress); };
      treeSpots.forEach(([x, z]) => tryTree(x, z, false));
      scatter(-40, -32, 66, 205, 70, 0.4);
      scatter(-148, 112, -84, 205, 16, 0.5);
      scatter(-330, -470, 40, -345, 170, 0.25);
      scatter(330, -470, 470, -120, 200, 0.3);
      scatter(184, 24, 250, 104, 12, 0.2);
      for (let i = 0; i < 300; i++){ const a = rnd() * Math.PI * 2, r = 405 + rnd() * 60; tryTree(Math.sin(a) * r, Math.cos(a) * r, rnd() < 0.35); }
      for (let i = 0; i < 260; i++) tryTree(-440 + rnd() * 880, -440 + rnd() * 880, rnd() < 0.3);   // mahalle aralarında tek tük
      for (let z = -380; z <= -140; z += 14) [-1, 1].forEach(s => tryTree(-150 + s * 8.6, z, true));
      const trunk = new THREE.CylinderGeometry(0.28, 0.42, 4.2, 7); trunk.translate(0, 2.1, 0);
      const crown = new THREE.IcosahedronGeometry(3.4, 1); crown.scale(1, 0.85, 1); crown.translate(0, 6.2, 0);
      const crown2 = new THREE.IcosahedronGeometry(2.4, 1); crown2.translate(1.6, 5.0, 0.8);
      const crownG = mergeBufferGeometries([crown, crown2]);
      const ctrunk = new THREE.CylinderGeometry(0.16, 0.22, 1.6, 6); ctrunk.translate(0, 0.8, 0);
      const ccone = new THREE.ConeGeometry(1.0, 8.5, 8); ccone.translate(0, 5.6, 0);
      const mk = (geo, m, list) => { const I = new THREE.InstancedMesh(geo, m, Math.max(1, list.length)); I.count = list.length; I.castShadow = true; I.receiveShadow = true; root.add(I); return I; };
      const T1 = mk(trunk, kit.mat(0x7a6a58, {roughness:0.95}), plane), K1 = mk(crownG, kit.mat(0xffffff, {roughness:0.9, flatShading:true}), plane);
      const T2 = mk(ctrunk, kit.mat(0x4a3424), cyp), K2 = mk(ccone, kit.mat(0xffffff, {roughness:0.9, flatShading:true}), cyp);
      const col = new THREE.Color();
      plane.forEach(([x, z, s], i) => { m4.compose(p4.set(x, Hs(x, z) - 0.1, z), q4.setFromEuler(e4.set(0, rnd() * 6, 0)), s4.set(s, s, s)); T1.setMatrixAt(i, m4); K1.setMatrixAt(i, m4); K1.setColorAt(i, col.setHSL(0.24 + rnd() * 0.06, 0.45, 0.3 + rnd() * 0.08).convertSRGBToLinear()); C.circle(x, z, 0.45 * s); });
      cyp.forEach(([x, z, s], i) => { m4.compose(p4.set(x, Hs(x, z) - 0.1, z), q4.identity(), s4.set(s, s * (0.9 + rnd() * 0.3), s)); T2.setMatrixAt(i, m4); K2.setMatrixAt(i, m4); K2.setColorAt(i, col.setHSL(0.3 + rnd() * 0.04, 0.4, 0.17 + rnd() * 0.05).convertSRGBToLinear()); C.circle(x, z, 0.3 * s); });
    }
    {
      // sokak fenerleri: hepsi iki InstancedMesh
      const pole = new THREE.CylinderGeometry(0.06, 0.09, 3.8, 6); pole.translate(0, 1.9, 0);
      const arm = new THREE.BoxGeometry(0.06, 0.06, 0.7); arm.translate(0, 3.7, 0.3);
      const poleG = mergeBufferGeometries([pole.toNonIndexed(), arm.toNonIndexed()]);
      const head = new THREE.CylinderGeometry(0.22, 0.14, 0.42, 6); head.translate(0, 3.5, 0.62);
      const PI = new THREE.InstancedMesh(poleG, lampPole, lampList.length), HI = new THREE.InstancedMesh(head, kit.lampMat, lampList.length);
      lampList.forEach(([x, z, y], i) => { m4.compose(p4.set(x, y, z), q4.setFromEuler(e4.set(0, Math.atan2(-x, -z), 0)), s4.set(1, 1, 1)); PI.setMatrixAt(i, m4); HI.setMatrixAt(i, m4); C.circle(x, z, 0.15); });
      PI.castShadow = true; root.add(PI, HI);
    }
    {
      // lale tarhları
      const beds = [[-35, 0, 22, 6], [-35, 20, 22, 6], [10, 150, 18, 6], [10, 120, 18, 6], [-140, 120, 14, 5], [-100, 120, 14, 5], [-140, 195, 14, 5], [-100, 195, 14, 5], [196, 30, 14, 4], [196, 92, 14, 4], [-175, -382, 10, 4], [-135, -382, 10, 4], [-175, -432, 10, 4], [-135, -432, 10, 4], [396, -232, 10, 3], [PAD.x - 22, PAD.z - 4, 6, 8]];
      const pts = [];
      beds.forEach(([x, z, w, d], bi) => { for (let a = 0; a < w; a += 0.45) for (let b = 0; b < d; b += 0.45) pts.push([x + a + (rnd() - 0.5) * 0.15, z + b + (rnd() - 0.5) * 0.15, bi]); });
      const stem = new THREE.CylinderGeometry(0.018, 0.022, 0.45, 4); stem.translate(0, 0.25, 0);
      const cup = new THREE.ConeGeometry(0.075, 0.16, 6, 1, true); cup.rotateX(Math.PI); cup.translate(0, 0.53, 0);
      const S = new THREE.InstancedMesh(stem, kit.mat(0x3d7a2e), pts.length), U = new THREE.InstancedMesh(cup, kit.mat(0xffffff, {roughness:0.6, side:THREE.DoubleSide}), pts.length);
      const PAL = [0xd8202e, 0xf2c230, 0xe85aa0, 0x7a3ab8, 0xf6f0e8, 0xf07a22], col = new THREE.Color();
      pts.forEach(([x, z, bi], i) => { const s = 0.9 + rnd() * 0.3; m4.makeScale(s, s, s).setPosition(x, Hs(x, z) + 0.1, z); S.setMatrixAt(i, m4); U.setMatrixAt(i, m4); U.setColorAt(i, col.set(PAL[(bi + (rnd() < 0.15 ? 1 : 0)) % PAL.length]).convertSRGBToLinear()); });
      root.add(S, U);
      beds.forEach(([x, z, w, d]) => { const cx = x + w / 2 - 0.2, cz = z + d / 2 - 0.2; kit.add(new THREE.BoxGeometry(w + 0.6, 0.3, d + 0.6), kit.mat(0x5a4632), cx, Hs(cx, cz) + 0.05, cz, reg(cx, cz), false); C.box(cx, cz, w / 2 + 0.3, d / 2 + 0.3).low = true; });
    }
    [[-118, 140, Math.PI / 2], [-118, 170, Math.PI / 2], [-90, 140, -Math.PI / 2], [-90, 170, -Math.PI / 2], [-130, -392, 0], [-170, -392, 0], [-130, -418, Math.PI], [-170, -418, Math.PI], [200, 50, -Math.PI / 2], [200, 80, -Math.PI / 2], [-20, 60, 0], [20, 60, 0], [-80, -8, Math.PI], [-40, -8, Math.PI], [394, -262, 0], [426, -262, 0], [-96, -182, Math.PI / 2]].forEach(b => bench(...b));
    [[200, -22, 0], [-100, 4, Math.PI], [-200, -210, 0], [300, -15, Math.PI], [-60, 110, Math.PI / 2], [-150, 104, 0]].forEach(c => cesme(...c));
    [[-150, -405, 14], [410, -250, 12], [-30, -36, 8], [-52, -104, 8], [-55, -26, 8], [215, -20, 8], [PAD.x + 18, PAD.z - 10, 10]].forEach(([x, z, h]) => flag(x, z, h));

    /* ---------- iskeleler: vapur iskele binaları ---------- */
    const DOCKS = [[-22, -41, Math.PI, 0], [22, -100, 0, 1], [184, -40, -Math.PI / 2, 2], [313, 284, -0.75, 3]];
    DOCKS.forEach(([x, z, ry, row]) => {
      const G = reg(x, z), g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      kit.add(new THREE.BoxGeometry(9, 0.4, 7), kit.mat(0x7a6a58), 0, 0.15, 3.5, g);
      kit.add(new THREE.BoxGeometry(10, 3.2, 4), kit.mat(0xece4d2, {roughness:0.8}), 0, 1.6, -1, g);
      kit.add(kit.frustum(11, 5, 1.4, 1.6), kit.mat(0x5a6a7a, {roughness:0.6}), 0, 3.9, -1, g);
      kit.add(rowUV(new THREE.BoxGeometry(6, 0.75, 0.1), row), placeSignM, 0, 2.9, 1.05, g);
      [-3.5, 3.5].forEach(px => kit.add(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), lampPole, px, 1.5, 6.6, g));
      for (let k = -2; k <= 2; k++) kit.add(new THREE.PlaneGeometry(1.2, 1.4), kit.winMat, k * 1.9, 1.7, 1.02, g, false);
      const c = Math.cos(ry), s = Math.sin(ry);
      C.box(x - s, z - c, 5, 2, ry);
    });

    /* ---------- Hipodrom: Dikilitaş ve Alman Çeşmesi ---------- */
    {
      const gran = kit.mat(0xb08a7a, {roughness:0.6}), y0 = Hs(-116, 196), G = reg(-116, 196);
      kit.add(new THREE.BoxGeometry(2.4, 1.2, 2.4), kit.marble, -116, y0 + 0.6, 196, G);
      kit.add(kit.frustum(1.6, 1.6, 11, 0.45), gran, -116, y0 + 6.7, 196, G); kit.add(new THREE.ConeGeometry(0.62, 1.1, 4), gran, -116, y0 + 12.75, 196, G).rotation.y = Math.PI / 4;
      C.circle(-116, 196, 1.6);
      const fx = -116, fz = 132, fy = Hs(fx, fz);
      kit.add(new THREE.CylinderGeometry(3.0, 3.2, 0.5, 8), kit.marble, fx, fy + 0.25, fz, G);
      for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; kit.add(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 10), kit.marble, fx + Math.sin(a) * 2.5, fy + 2.1, fz + Math.cos(a) * 2.5, G); }
      kit.add(new THREE.CylinderGeometry(3.0, 3.0, 0.5, 8), kit.marble, fx, fy + 3.9, fz, G);
      kit.add(new THREE.SphereGeometry(2.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), kit.mat(0x3f7a5a, {metalness:0.4, roughness:0.4}), fx, fy + 4.1, fz, G);
      kit.add(new THREE.CylinderGeometry(1.0, 1.1, 1.0, 8), kit.marble, fx, fy + 0.9, fz, G);
      C.circle(fx, fz, 3.2);
      ctx.place({id:'hipodrom', name:'Sultanahmet Meydanı', x:-110, z:160, r:22});
      signPost(15, -96, 120, -Math.PI / 2);
    }

    /* ---------- Kapalıçarşı ve Mısır Çarşısı: kubbeli çarşılar ---------- */
    const lift = (fn, y) => { const n = root.children.length; const r = fn(); root.children.slice(n).forEach(o => { o.position.y += y; }); return r; };
    const domeM = kit.mat(0x7d8a8e, {metalness:0.3, roughness:0.5});
    const doors = {};          // iç mekân girişleri (ada koordinatı): {x, z, ry}
    {
      const KC = {x:-245, z:125}, y = Hs(KC.x, KC.z);
      const hall = lift(() => kit.hall({x:KC.x, z:KC.z, w:50, d:26, h:7, rot:Math.PI, roof:'flat', wall:kit.mat(0xd8c7a2, {roughness:0.85}), door:true, doorW:3, doorStyle:'kemer'}), y);
      for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j += 2) kit.add(new THREE.SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeM, KC.x + i * 9.5, y + 7.6, KC.z + j * 6);
      kit.add(rowUV(new THREE.BoxGeometry(7, 0.9, 0.1), 5), placeSignM, KC.x, y + 5.8, KC.z - 13.2).rotation.y = Math.PI;
      ctx.place({id:'kapalicarsi', name:'Kapalıçarşı', x:KC.x, z:KC.z - 16, r:16});
      doors.kapalicarsi = {x:hall.front[0], z:hall.front[1], ry:Math.PI};
    }
    {
      const MC = {x:-106, z:23}, y = Hs(MC.x, MC.z);
      const mhall = lift(() => kit.hall({x:MC.x, z:MC.z, w:34, d:24, h:6.5, rot:Math.PI, roof:'flat', wall:kit.mat(0xcdb48a, {roughness:0.85}), door:true, doorW:3, doorStyle:'kemer'}), y);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j += 2) kit.add(new THREE.SphereGeometry(3.0, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeM, MC.x + i * 10, y + 7.0, MC.z + j * 5.5);
      kit.add(rowUV(new THREE.BoxGeometry(7, 0.9, 0.1), 4), placeSignM, MC.x, y + 5.4, MC.z - 12.2).rotation.y = Math.PI;
      ctx.place({id:'misircarsisi', name:'Mısır Çarşısı', x:MC.x, z:MC.z - 16, r:16});
      doors.misircarsisi = {x:mhall.front[0], z:mhall.front[1], ry:Math.PI};
      // çarşı önü tezgâhları: baharat yığınları, meyve
      const G = reg(MC.x, MC.z), cone = [], fruit = [];
      for (let k = 0; k < 6; k++){
        const x = MC.x - 15 + k * 6, z = MC.z - 18, sy = Hs(x, z);
        kit.add(new THREE.BoxGeometry(4, 0.9, 1.6), kit.mat(0x6a4a2e), x, sy + 0.45, z, G);
        const ag = new THREE.BufferGeometry(), row = k % 8;
        ag.setAttribute('position', new THREE.Float32BufferAttribute([-2.3, 2.6, -1.2, 2.3, 2.6, -1.2, -2.3, 2.1, 1.3, 2.3, 2.1, 1.3], 3));
        ag.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1 - row / 8, 1.2, 1 - row / 8, 0, 1 - (row + 1) / 8, 1.2, 1 - (row + 1) / 8], 2));
        ag.setIndex([0, 2, 1, 1, 2, 3]); ag.computeVertexNormals(); kit.add(ag, awnM, x, sy, z, G, false);
        [-1, 1].forEach(px => kit.add(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6), lampPole, x + px * 2.1, sy + 1.3, z + 1.2, G));
        for (let a = 0; a < 6; a++) (k % 3 === 2 ? fruit : cone).push([x - 1.6 + a * 0.64, sy + 0.9, z + (a % 2 ? 0.3 : -0.3)]);
        C.box(x, z, 2.1, 0.9).low = true;
      }
      const CN = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.42, 10), kit.mat(0xffffff, {roughness:0.95}), Math.max(1, cone.length));
      const FR = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), kit.mat(0xffffff, {roughness:0.6}), Math.max(1, fruit.length * 9));
      const SP = [0xc8202e, 0xe0a020, 0x8a4a1a, 0xd8601a, 0x6a8a2a, 0xa02a2a], FRC = [0xe8401a, 0xf0c020, 0x6aa02a, 0xd82050], col = new THREE.Color();
      cone.forEach(([x, y, z], i) => { m4.makeTranslation(x, y + 0.21, z); CN.setMatrixAt(i, m4); CN.setColorAt(i, col.set(SP[i % SP.length]).convertSRGBToLinear()); });
      fruit.forEach(([x, y, z], i) => { for (let f = 0; f < 9; f++){ m4.makeTranslation(x + (f % 3 - 1) * 0.18, y + 0.1 + Math.floor(f / 3) * 0.04, z + (Math.floor(f / 3) - 1) * 0.18); FR.setMatrixAt(i * 9 + f, m4); FR.setColorAt(i * 9 + f, col.set(FRC[i % FRC.length]).convertSRGBToLinear()); } });
      CN.count = cone.length; FR.count = fruit.length * 9;
      root.add(CN, FR);
    }

    /* ---------- Taksim: Cumhuriyet Anıtı ---------- */
    {
      const x = -150, z = -405, y = Hs(x, z), G = reg(x, z);
      kit.add(new THREE.CylinderGeometry(6, 6.4, 0.6, 32), kit.marble, x, y + 0.3, z, G);
      [-1, 1].forEach(s => kit.add(new THREE.BoxGeometry(1.4, 7, 1.4), kit.mat(0xa59b8c), x + s * 3.2, y + 4, z, G));
      kit.add(new THREE.BoxGeometry(8, 1.2, 1.6), kit.mat(0xa59b8c), x, y + 8, z, G);
      lift(() => kit.statue(x, z + 1.8, 1, 0, 1.2, 'Cumhuriyet Anıtı', 'Taksim Meydanı\'ndaki Cumhuriyet Anıtı 1928\'de açıldı. Bir yüzü İstiklal Caddesi\'ne, öbür yüzü Gezi Parkı\'na bakar.', kit.mat(0x5a6a5a, {metalness:0.6, roughness:0.4})), y);
      C.circle(x, z, 6.2);
      ctx.place({id:'taksim', name:'Taksim Meydanı', x, z, r:24});
      signPost(7, -126, -380, 0);
    }
    /* ---------- Çamlıca tepesi: seyir terası ---------- */
    {
      const x = 410, z = -250, y = Hs(x, z), G = reg(x, z);
      kit.add(new THREE.CylinderGeometry(9, 9.4, 0.5, 24), kit.mat(0xcfc6b4), x, y + 0.25, z + 14, G);
      for (let a = -1.2; a <= 1.2; a += 0.15) kit.add(new THREE.BoxGeometry(1.0, 0.9, 0.12), railM, x + Math.sin(a) * 9, y + 0.95, z + 14 + Math.cos(a) * 9, G).rotation.y = a;
      ctx.place({id:'camlica', name:'Çamlıca Tepesi', x, z, r:20});
      signPost(9, x - 12, z + 4, Math.PI / 2);
    }
    signPost(8, -104, 92, 0); signPost(11, -52, -24, Math.PI); signPost(12, 214, 18, -Math.PI / 2); signPost(13, -100, -146, Math.PI / 2); signPost(14, 186, 44, -Math.PI / 2); signPost(2, 210, -80, -Math.PI / 2);

    /* ---------- İstiklal tramvayı: raylar, havai hat, tekerlekli vagon ---------- */
    const tram = new THREE.Group(); tram.userData.dyn = true; root.add(tram);
    {
      const rails = [], wire = [];
      for (let z = -392; z < -124; z += 2) [-0.72, 0.72].forEach(s => { const g = new THREE.BoxGeometry(0.1, 0.1, 2.04); g.translate(-150 + s, (Hs(-150, z) + Hs(-150, z + 2)) / 2 + 0.17, z + 1); rails.push(g); });
      kit.add(mergeBufferGeometries(rails), kit.mat(0x8a8a8e, {metalness:0.7, roughness:0.35}), 0, 0, 0, root, false);
      for (let z = -385; z <= -130; z += 22){ const y = Hs(-156.2, z); kit.add(new THREE.CylinderGeometry(0.08, 0.1, 6.2, 6), lampPole, -156.2, y + 3.1, z); kit.add(new THREE.BoxGeometry(6.2, 0.06, 0.06), lampPole, -153.1, y + 5.9, z); C.circle(-156.2, z, 0.15); }
      for (let z = -392; z < -124; z += 8){ const g = new THREE.CylinderGeometry(0.015, 0.015, 8.05, 3); g.rotateX(Math.PI / 2); g.translate(-150, (Hs(-150, z) + Hs(-150, z + 8)) / 2 + 5.85, z + 4); wire.push(g); }
      kit.add(mergeBufferGeometries(wire), lampPole, 0, 0, 0, root, false);
      const red = kit.mat(0xb3202a, {roughness:0.5}), cream = kit.mat(0xf3ead8, {roughness:0.6}), dark = kit.mat(0x1c1c1e, {roughness:0.6});
      [-2.6, 2.6].forEach(bz => { kit.add(new THREE.BoxGeometry(1.7, 0.35, 2.0), dark, 0, 0.42, bz, tram); [-0.72, 0.72].forEach(s => [-0.6, 0.6].forEach(wz => { const w = kit.add(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12), dark, s, 0.32, bz + wz, tram); w.rotation.z = Math.PI / 2; })); });
      kit.add(new THREE.BoxGeometry(2.4, 1.2, 8.5), red, 0, 1.2, 0, tram);
      kit.add(new THREE.BoxGeometry(2.4, 1.3, 8.5), cream, 0, 2.45, 0, tram);
      kit.add(new THREE.BoxGeometry(2.6, 0.25, 8.9), red, 0, 3.22, 0, tram);
      [-1, 1].forEach(s => { for (let i = -3; i <= 3; i++){ const w = kit.add(new THREE.PlaneGeometry(0.85, 0.8), kit.winMat, s * 1.21, 2.5, i * 1.15, tram, false); w.rotation.y = s * Math.PI / 2; } });
      [-1, 1].forEach(s => { const w = kit.add(new THREE.PlaneGeometry(1.6, 0.9), kit.winMat, 0, 2.5, s * 4.26, tram, false); w.rotation.y = s > 0 ? 0 : Math.PI; });
      const p1 = kit.add(new THREE.BoxGeometry(0.05, 1.5, 0.05), dark, 0, 4.0, 0.4, tram); p1.rotation.x = 0.5;
      const p2 = kit.add(new THREE.BoxGeometry(0.05, 1.5, 0.05), dark, 0, 4.0, -0.4, tram); p2.rotation.x = -0.5;
      kit.add(new THREE.BoxGeometry(1.0, 0.05, 0.12), dark, 0, 4.66, 0, tram);
    }
    const tramPos = {z:-200, dir:-1};
    const placeTram = () => { const ya = Hs(-150, tramPos.z - 2.6), yb = Hs(-150, tramPos.z + 2.6); tram.position.set(-150, (ya + yb) / 2 + 0.21, tramPos.z); tram.rotation.x = -Math.atan2(yb - ya, 5.2); };
    placeTram();
    C.dynamics.push(() => [{x:AT.x - 150, z:AT.z + tramPos.z - 3, r:1.6}, {x:AT.x - 150, z:AT.z + tramPos.z, r:1.6}, {x:AT.x - 150, z:AT.z + tramPos.z + 3, r:1.6}]);
    ctx.place({id:'istiklal', name:'İstiklal Caddesi', x:-150, z:-260, r:14});

    /* ---------- vapurlar, kayıklar, martılar ---------- */
    const boats = [];
    {
      const kayik = kit.mat(0x2a6a9a, {roughness:0.7}), kayik2 = kit.mat(0xd8502a, {roughness:0.7});
      [[-40, -50, 0.3], [-20, -52, -0.2], [150, 40, 1.5], [158, 75, 1.2], [170, -30, 1.6], [90, 30, 0.6], [-90, -48, 0.1], [-120, -50, -0.3]].forEach(([x, z, ry], i) => {
        const g = new THREE.Group(); g.userData.dyn = true; g.position.set(x, SEA_Y, z); g.rotation.y = ry; root.add(g);
        kit.add(new THREE.BoxGeometry(1.6, 0.6, 5), i % 2 ? kayik : kayik2, 0, 0.2, 0, g); kit.add(new THREE.BoxGeometry(1.3, 0.08, 4.6), kit.mat(0xe0d4b8), 0, 0.5, 0, g);
        boats.push({g, ry, phase:i * 1.7});
      });
    }
    const gulls = [];
    {
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.22, -0.05, 0, 0, 0.12, 0, 0, -0.12, 0.55, 0.22, -0.05, 0, 0, 0.12, 0, 0, -0.12], 3)); gg.computeVertexNormals();
      const gm = new THREE.MeshStandardMaterial({color:0xf2f2f0, side:THREE.DoubleSide, roughness:0.6});
      for (let i = 0; i < 22; i++){ const m = keep(new THREE.Mesh(gg, gm)); root.add(m); gulls.push({m, cx:-60 + rnd() * 240, cz:-200 + rnd() * 320, r:8 + rnd() * 18, h:8 + rnd() * 12, w:(rnd() < 0.5 ? -1 : 1) * (0.2 + rnd() * 0.2), p:rnd() * 6}); }
    }

    /* ---------- insanlar ---------- */
    const HAT_Y = 1.94;
    function adam({coat = 0x3a4a5a, hat = 'kasket', apron = false, beard = false} = {}){
      const g = kit.npc({coat, hat:'yok', apron});
      if (hat === 'fes'){ kit.add(new THREE.CylinderGeometry(0.1, 0.125, 0.2, 14), kit.mat(0xb01c22, {roughness:0.6}), 0, HAT_Y + 0.02, 0, g); kit.add(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 4), kit.mat(0x111111), 0.06, HAT_Y + 0.04, -0.08, g); }
      if (hat === 'kasket'){ kit.add(new THREE.CylinderGeometry(0.135, 0.135, 0.07, 16), kit.mat(0x4a4a4a, {roughness:0.9}), 0, HAT_Y - 0.03, 0, g); kit.add(new THREE.BoxGeometry(0.2, 0.025, 0.1), kit.mat(0x3a3a3a), 0, HAT_Y - 0.06, 0.15, g); }
      if (beard) kit.add(new THREE.SphereGeometry(0.085, 10, 8), kit.mat(0x8a8a88, {roughness:0.9}), 0, HAT_Y - 0.3, 0.07, g).scale.set(1, 1.1, 0.6);
      return g;
    }
    function kadin(dress, scarf){
      const g = kit.lady(dress, 0x3a2416);
      if (scarf){ kit.add(new THREE.SphereGeometry(0.145, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), kit.mat(scarf, {roughness:0.8}), 0, 1.7, -0.015, g); kit.add(new THREE.ConeGeometry(0.17, 0.32, 14, 1, true), kit.mat(scarf, {roughness:0.8, side:THREE.DoubleSide}), 0, 1.5, -0.02, g); }
      return g;
    }
    const COATS = [0x3a4a5a, 0x5a3a2a, 0x2a5a4a, 0x6a2a3a, 0x4a4a6a, 0x7a6a4a, 0x2a2a3a, 0x8a5a3a];
    const DRESS = [0x7a2a4a, 0x2a5a7a, 0x8a6a2a, 0x3a6a3a, 0x9a3a2a, 0x5a3a7a], SCARF = [0xd8b060, 0x7a9ac0, 0xc87a8a, 0xf2efe8, null, null];
    const someone = (i) => i % 3 === 0 ? kadin(DRESS[i % DRESS.length], SCARF[i % SCARF.length]) : adam({coat:COATS[i % COATS.length], hat:i % 4 === 1 ? 'kasket' : 'yok', beard:i % 5 === 0});
    // kalabalık: hepsi tek grupta birleşir (oturan, alışveriş yapan, vapur bekleyen)
    const crowd = new THREE.Group(); crowd.userData.dyn = true; root.add(crowd);
    const sit = (g) => { const u = g.userData; if (u.legL && u.legR){ u.legL.rotation.set(-1.4, 0, 0); u.legR.rotation.set(-1.4, 0, 0); } g.position.y -= 0.42; return g; };
    const putP = (g, x, z, ry, y = Hs(x, z)) => { g.position.set(x, y + g.position.y, z); g.rotation.y = ry; crowd.add(g); C.circle(x, z, 0.35); return g; };
    // kahvehaneler: masa, tabure, tavla, çay bardakları
    const kahve = (x0, z0, n) => {
      for (let k = 0; k < n; k++){
        const x = x0 + (k % 3) * 3.6, z = z0 + Math.floor(k / 3) * 3.6, y = Hs(x, z), G = reg(x, z);
        kit.add(new THREE.BoxGeometry(1.0, 0.06, 0.8), kit.mat(0xd9d2c0), x, y + 0.72, z, G); kit.add(new THREE.CylinderGeometry(0.05, 0.06, 0.7, 6), lampPole, x, y + 0.35, z, G);
        kit.add(new THREE.BoxGeometry(0.62, 0.05, 0.42), kit.mat(0x7a4a22), x, y + 0.77, z, G); kit.add(new THREE.BoxGeometry(0.6, 0.012, 0.4), kit.mat(0xe8d8b0), x, y + 0.8, z, G);
        [-1, 1].forEach(s => { kit.add(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 8), kit.mat(0xa0301a, {transparent:true, opacity:0.85}), x + s * 0.4, y + 0.8, z + 0.25, G); kit.add(new THREE.BoxGeometry(0.4, 0.42, 0.4), kit.mat(0x9a4a2a), x + s * 0.95, y + 0.21, z, G); });
        if (k % 2 === 0){ putP(sit(adam({coat:COATS[k % 8], hat:k % 4 ? 'kasket' : 'yok', beard:k % 3 === 0})), x - 0.95, z, Math.PI / 2, y); putP(sit(adam({coat:COATS[(k + 3) % 8], hat:'yok'})), x + 0.95, z, -Math.PI / 2, y); }
        C.circle(x, z, 0.75).low = true;
      }
    };
    kahve(226, -66, 6);            // Üsküdar meydanı
    kahve(-115, -186, 3);          // Galata
    kahve(206, 70, 6);             // Salacak çay bahçesi
    [[-24, -36], [-18, -37], [-28, -35], [24, -104], [192, -48], [194, -44], [318, 280]].forEach(([x, z], i) => putP(someone(i), x, z, rnd() * 6));
    [[-120, 0], [-108, 2], [-95, 1], [-80, 3], [-122, -10], [-150, -380], [-140, -250], [-155, -170], [-110, 160], [-112, 168], [-90, 120], [-30, 60], [410, -238], [404, -238]].forEach(([x, z], i) => putP(someone(i + 2), x, z, rnd() * 6));
    for (let i = 0; i < fronts.length && i < 90; i += 3){ const f = fronts[i]; if (f.shop) putP(someone(i), f.x + Math.sin(f.ry) * 0.6, f.z + Math.cos(f.ry) * 0.6, f.ry + Math.PI, f.y); }

    const say = (name, lines) => () => ctx.ui.dialog(lines.map(text => ({name, text})));
    const npcAt = (g, x, z, ry, name, act, y = Hs(x, z)) => { const o = kit.placeNPC(g, x, z, ry, name, act); o.position.y = y; return o; };
    // Simitçi Hasan Amca
    {
      const g = adam({coat:0x6a5a3a, hat:'kasket', beard:true});
      const tray = new THREE.Group(); tray.position.y = 2.1; g.add(tray);
      kit.add(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 20), kit.mat(0x8a6a3a), 0, 0, 0, tray);
      for (let i = 0; i < 7; i++){ const a = i / 7 * Math.PI * 2, s = kit.add(new THREE.TorusGeometry(0.1, 0.035, 6, 14), kit.mat(0xc8873a, {roughness:0.7}), Math.sin(a) * 0.28, 0.05, Math.cos(a) * 0.28, tray); s.rotation.x = Math.PI / 2; }
      npcAt(g, -78, -16, 0.4, 'Simitçi Hasan Amca', async () => {
        if (!store.simit){ store.simit = true; ctx.save(); ctx.sfx('coin'); }
        await ctx.ui.dialog([{name:'Simitçi Hasan Amca', text:'Taze simit, sıcak simit! Al evladım, bu benden. Susamı bol, tam fırından.'}, {name:'Simitçi Hasan Amca', text:'Vapura binersen martılara atma ama; Eminönü martıları simit kapmakta ustadır!'}]);
      });
    }
    // simit arabaları
    [[-140, -150], [-60, 92], [230, -40], [330, 200]].forEach(([x, z]) => {
      const y = Hs(x, z), G = reg(x, z);
      kit.add(new THREE.BoxGeometry(1.4, 0.8, 0.8), kit.mat(0xb3202a), x, y + 0.85, z, G);
      kit.add(new THREE.BoxGeometry(1.3, 0.6, 0.7), kit.mat(0xddeeff, {transparent:true, opacity:0.45, roughness:0.1}), x, y + 1.55, z, G);
      for (let i = 0; i < 6; i++){ const s = kit.add(new THREE.TorusGeometry(0.11, 0.04, 6, 12), kit.mat(0xc8873a, {roughness:0.7}), x - 0.45 + (i % 3) * 0.45, y + 1.3 + Math.floor(i / 3) * 0.12, z, G); s.rotation.x = Math.PI / 2; }
      [-0.5, 0.5].forEach(s => { const w = kit.add(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12), lampPole, x + s, y + 0.22, z + 0.45, G); w.rotation.x = Math.PI / 2; });
      C.box(x, z, 0.75, 0.5).low = true;
    });
    // oltacılar
    [[-56.5, -60, 'Balıkçı Recep', ['Rast gele! Bugün istavrit bol. Lüfer mevsimi gelince bu köprü omuz omuza dolar.', 'Karaköy\'den Eminönü\'ne bakınca bütün camiler sıra sıra dizilir. Akşam ezanında bir dinle, başka hiçbir yere benzemez.']], [-67.5, -85, 'Oltacı Kemal', ['Bu köprü kaç kere yenilendi, biz hep buradaydık.', 'Su soğuk, akıntı güçlü. Boğaz\'ın akıntısı Karadeniz\'den Marmara\'ya iner.']]].forEach(([x, z, name, lines], i) => {
      const g = adam({coat:i ? 0x2a3a2a : 0x2a3a5a, hat:'kasket'});
      const rod = kit.add(new THREE.CylinderGeometry(0.012, 0.02, 3.2, 5), kit.mat(0x3a2a1a), i ? -0.9 : 0.9, 2.2, 0.8, g, false); rod.rotation.z = i ? 0.9 : -0.9;
      npcAt(g, x, z, i ? -Math.PI / 2 : Math.PI / 2, name, say(name, lines), GKb.h((z + 30) / -80));
    });
    for (let k = 0; k < 5; k++){ const x = k % 2 ? -67.3 : -56.7, z = -48 - k * 11, g = adam({coat:COATS[k], hat:k % 2 ? 'kasket' : 'yok'}); const rod = kit.add(new THREE.CylinderGeometry(0.012, 0.02, 3.0, 5), kit.mat(0x3a2a1a), k % 2 ? -0.9 : 0.9, 2.1, 0.7, g, false); rod.rotation.z = k % 2 ? 0.9 : -0.9; putP(g, x, z, k % 2 ? -Math.PI / 2 : Math.PI / 2, GKb.h((z + 30) / -80)); }
    npcAt(kadin(0x2a5a7a, null), -104, 150, -Math.PI / 2, 'Rehber Elif', say('Rehber Elif', ['Hoş geldiniz! Solunuzda Ayasofya, sağınızda Sultanahmet Camii. Altı minaresi yüzünden halk ona "Mavi Cami" der; içindeki İznik çinileri yüzünden.', 'Ayasofya bin beş yüz yıllık; kubbesi asırlarca dünyanın en büyük kubbesiydi.', 'Arkada Topkapı Sarayı var, Bab-ı Hümayun kapısından girilir. Gülhane Parkı\'ndaki lalelere de bakın, nisanda bütün park renk renk olur.']));
    {
      const x = 212, z = 62, y = Hs(x, z), G = reg(x, z);
      kit.add(new THREE.BoxGeometry(2.6, 1.0, 1.0), kit.mat(0x6a4a2e), x + 1.6, y + 0.5, z - 1.2, G);
      kit.add(new THREE.CylinderGeometry(0.22, 0.28, 0.55, 12), kit.mat(0xc0c4c8, {metalness:0.8, roughness:0.3}), x + 1.2, y + 1.28, z - 1.2, G);
      C.box(x + 1.6, z - 1.2, 1.3, 0.5).low = true;
      npcAt(kadin(0x8a2a3a, 0xe0c060), x, z - 2.4, -0.3, 'Çaycı Ayşe Abla', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Çaycı Ayşe Abla', text:'Otur bakalım, ince belli bardakta tavşan kanı bir çay! Şekerin yanında.'}, {name:'Çaycı Ayşe Abla', text:'Şu karşıdaki Kız Kulesi\'nin bir efsanesi var: bir padişah, kızını yılandan korumak için onu denizin ortasındaki bu kuleye kapatmış. Ama kader bu ya, bir üzüm sepetinin içinde gelen yılan yine de onu bulmuş.'}, {name:'Çaycı Ayşe Abla', text:'Gün batımında buradan bak; kule kızıla boyanır, vapurlar yanından geçer. İstanbul\'un en güzel manzarası.'}]);
      });
      ctx.place({id:'salacak', name:'Salacak Sahili', x:208, z:60, r:16});
    }
    npcAt(adam({coat:0x1d3a6a, hat:'kasket', beard:true}), 190, -36, -Math.PI / 2, 'Kayıkçı İsmail', say('Kayıkçı İsmail', ['Üsküdar\'a gider iken... Bilir misin bu şarkıyı? Bu iskeleden yüzyıllardır kayıklar kalkar.', 'Kız Kulesi\'ne kayıkla giderdik eskiden. Şimdi Boğaz\'da vapurlar dolu; şu sarı bacalı olan Eminönü\'ne gidiyor.', 'Kuzeydeki köprüyü gör: Avrupa\'yla Asya\'yı birleştirir. Üstünden yürüyerek karşıya geçebilirsin.']));
    ctx.place({id:'uskudar', name:'Üsküdar Meydanı', x:215, z:-45, r:18});
    {
      const g = adam({coat:0xf0eadc, hat:'fes', apron:0xb01c22});
      const stick = kit.add(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 5), kit.mat(0xc0c0c0, {metalness:0.8}), 0.4, 1.6, 0.4, g, false); stick.rotation.z = -0.5;
      kit.add(new THREE.BoxGeometry(1.4, 1.0, 0.8), kit.mat(0xb01c22), 0, 0.5, 0.9, g);
      let tries = 0;
      npcAt(g, -158, -365, Math.PI / 2, 'Dondurmacı Ali', async () => {
        tries++;
        if (tries < 3){ ctx.sfx('blip'); await ctx.ui.say('Dondurmacı Ali', tries === 1 ? 'Buyur, külahın! ...Hop! Kaçtı! Bir daha dene bakalım.' : 'Al, al... Ooo, yine kaçtı! Hızlı olman lazım!'); return; }
        tries = 0; ctx.sfx('coin');
        await ctx.ui.say('Dondurmacı Ali', 'Tamam tamam, bu sefer gerçek! Maraş usulü, salepli, dövme dondurma. Afiyet olsun!');
      });
    }
    npcAt(adam({coat:0x7a2a2a, hat:'yok', beard:true}), -112, -1, 0, 'Baharatçı Yusuf', say('Baharatçı Yusuf', ['Pul biber, sumak, kekik, tarçın... Mısır Çarşısı\'na hoş geldin! Koklamak bedava.', 'Bu çarşıya eskiden Mısır\'dan gelen gemilerin vergisiyle bakılırmış, adı oradan kalmış.']));
    npcAt(kadin(0x3a6a3a, 0xf2efe8), -146, -392, Math.PI / 2, 'Çiçekçi Fatma', say('Çiçekçi Fatma', ['Lale, karanfil, gül! Taksim\'de çiçekçiler eskiden beri vardır.', 'Laleyi bütün dünyaya biz tanıttık, bilir misin? Lale Devri diye bir dönemimiz bile var.']));
    npcAt(adam({coat:0x2a2a3a, hat:'yok'}), 404, -246, 0, 'Fotoğrafçı Murat', say('Fotoğrafçı Murat', ['Çamlıca\'dan bütün İstanbul ayağının altında: Boğaz, köprü, Tarihî Yarımada, Kız Kulesi...', 'Akşamüstü gel; güneş Sarayburnu\'nun arkasından batar.']));
    // gezen İstanbullular
    const walkers = [];
    [[[-150, -140], [-150, -385]], [[-146, -380], [-146, -150]], [[-120, 140], [-120, 200]], [[-60, -38], [-60, -100]], [[200, -60], [240, -25]], [[-100, -20], [-30, -20]], [[230, 30], [230, 100]], [[-160, 94], [-260, 96]], [[296, -6], [326, 100]], [[48, -130], [50, -250]]].forEach(([a, b], i) => {
      const g = someone(i + 5); g.userData.dyn = true; root.add(g);
      walkers.push({g, a, b, t:rnd(), speed:1.1 + rnd() * 0.4, dir:1, bridge:Math.abs(a[0] + 60) < 3});
    });
    C.dynamics.push(() => walkers.map(w => ({x:AT.x + w.g.position.x, z:AT.z + w.g.position.z, r:0.35})));

    /* ---------- İstanbul'un kedileri: sokaklarda, dükkân önlerinde ---------- */
    const CATS = [[-74, -10], [-112, 145], [-98, 178], [-160, -150], [-140, -300], [205, 58], [218, 70], [196, -48], [-240, 102], [10, 40], [-140, -395], [300, 230], [-30, -32], [410, -244]];
    for (let i = 0; i < fronts.length && CATS.length < 32; i += 7) CATS.push([fronts[i].x + Math.cos(fronts[i].ry) * 1.2, fronts[i].z - Math.sin(fronts[i].ry) * 1.2]);
    /* ---------- ejderha iniş alanı: Pyra burada da var ---------- */
    {
      const y = Hs(PAD.x, PAD.z), G = reg(PAD.x, PAD.z);
      signPost(10, PAD.x + 12, PAD.z + 12, HARBOR + Math.PI);
      const horn = kit.add(new THREE.CylinderGeometry(0.22, 0.7, 2.2, 12), kit.gold, PAD.x - 9, y + 1.1, PAD.z - 9, G); horn.rotation.z = 0.35;
      kit.add(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 12), kit.marble, PAD.x - 9, y + 0.2, PAD.z - 9, G);
      C.circle(PAD.x - 9, PAD.z - 9, 0.8);
      ctx.interact(PAD.x - 9, PAD.z - 9, 'Boruyu çal: Pyra\'ya bin ve uç', () => { ctx.sfx('whistle'); ctx.callDragon({x:PAD.x, z:PAD.z, yaw:HARBOR + Math.PI}); }, 3.0);
      ctx.place({id:'inis', name:'Ejderha İniş Alanı', x:PAD.x, z:PAD.z, r:14});
      signPost(3, Math.sin(HARBOR) * 445 - 8, Math.cos(HARBOR) * 445 + 6, HARBOR + Math.PI);
    }

    /* ---------- modüller: insanlar, taksiler, grafitiler, iç mekânlar, kediler, vapurlar, balıkçılar, güvercinler, kartpostallar, gece ---------- */
    const env = {AT, R, SEA_Y, HARBOR, PAD, KIZ, LM, Hs, landG, onLand, inland, roadDist, kept, reg, keep, occ, cell, AVENUES, ZONES, DOCKS, houseList, fronts, doors,
      CATS, store, say, adam, kadin, someone, npcAt, putP, sit, lift, signPost, bench, lampPole, crowd, walkers, bridges:{galata:GKb, bogazici:BZb}, SHOPS,
      mats:{stoneM, roofM, eaveM, doorM, shutM, cobbleM, paveM, asphaltM, awnM, placeSignM, shopSignM, shopGlassM, domeM}, rowUV, mergeBufferGeometries};
    [['insanlar', buildPeople], ['taksiler', buildTaxis], ['grafitiler', buildGraffiti], ['iç mekânlar', buildInteriors], ['kediler', buildCats], ['vapurlar', buildFerries], ['balıkçılar', buildBalik], ['güvercinler', buildGuvercin], ['kartpostallar', buildKartpostal], ['gece', buildGece]].forEach(([n, fn]) => {
      try { fn(ctx, env); } catch (e){ console.error('[istanbul] ' + n + ' kurulamadı:', e); }
    });

    // birleştirilmiş şeritler (yollar, kaldırımlar, meydanlar, parklar)
    lists.forEach((gs, mat) => { const m = keep(new THREE.Mesh(mergeBufferGeometries(gs), mat)); m.receiveShadow = true; root.add(m); });

    /* ---------- her kare ---------- */
    ctx.onUpdate((dt, t) => {
      const night = ctx.W.night > 0.45;
      waterNormal.offset.set(t * 0.004, t * 0.007);
      kit.winMat.emissiveIntensity = night ? 1.2 : 0;
      shopGlassM.emissiveIntensity = night ? 0.9 : 0;
      shopSignM.emissiveIntensity = night ? 0.35 : 0;
      boats.forEach(b => {
        b.g.position.y = SEA_Y + Math.sin(t * 1.1 + b.phase) * 0.06; b.g.rotation.z = Math.sin(t * 0.8 + b.phase) * 0.06;
      });
      tramPos.z += tramPos.dir * 3.2 * dt;
      if (tramPos.z < -375){ tramPos.z = -375; tramPos.dir = 1; } else if (tramPos.z > -142){ tramPos.z = -142; tramPos.dir = -1; }
      placeTram();
      walkers.forEach(w => {
        const dx = w.b[0] - w.a[0], dz = w.b[1] - w.a[1], len = Math.hypot(dx, dz);
        w.t += w.dir * w.speed * dt / len;
        if (w.t > 1){ w.t = 1; w.dir = -1; } else if (w.t < 0){ w.t = 0; w.dir = 1; }
        const x = w.a[0] + dx * w.t, z = w.a[1] + dz * w.t;
        w.g.position.set(x, (w.bridge ? GKb.h((z + 30) / -80) : Hs(x, z)) + Math.abs(Math.sin(t * 6 + w.speed * 9)) * 0.04, z);
        w.g.rotation.y = Math.atan2(dx * w.dir, dz * w.dir);
      });
      flags.forEach((f, i) => { f.rotation.y = Math.sin(t * 0.7 + i) * 0.35 + ctx.wind * 0.3; });
      const showG = ctx.W.night < 0.6 && ctx.W.rain < 0.5;
      gulls.forEach(q => {
        q.m.visible = showG; if (!showG) return;
        const a = t * q.w + q.p;
        q.m.position.set(q.cx + Math.cos(a) * q.r, q.h + Math.sin(t * 0.5 + q.p) * 1.5, q.cz + Math.sin(a) * q.r);
        q.m.rotation.set(0, Math.atan2(-Math.sin(a) * Math.sign(q.w), Math.cos(a) * Math.sign(q.w)), Math.sign(q.w) * 0.25);
        q.m.scale.set(1, Math.sin(t * 7 + q.p), 1);
      });
    });
  },
};
