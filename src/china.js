// Yùlóng Adası (玉龍, "Yeşim Ejderha"): Lumière'in güneydoğusunda, kıyıdan ~570 m açıkta bir Çin imparatorluk adası.
// Pyra ile uçarak gidilir. Fransız sarayının simetrik barok düzenine karşılık doğa, zanaat ve Doğu felsefesi:
// Yasak Şehir tarzı saray (üç katlı mermer teras, sarı sırlı kiremitler, Öğle Kapısı, Paifang), sırt boyunca kıvrılıp
// denize inen Çin Seddi ve işaret kuleleri, dokuz katlı pagoda, dev çan ve Yin-Yang bahçesi, bambu ormanı ve pandalar,
// lotus-koi göleti ve Ay Köprüsü, teraslı çay tepesi, porselen / ipek / halı / yeşim atölyeleri, yüzen pazar ve
// ejderha kayıkları.
// Oyun: atölyelerde üretim (her aşamada doğru usulü seçmek kaliteyi belirler), ritüellerle kültür puanı, Pyra'nın
// heybesiyle gelen Fransız şarabı ve parfümünün Çin hazineleriyle takası, prestij ve diplomatik unvanlar.
// Ada Lumière ile aynı dünyada ve aynı çarpışma alanındadır. İçerik ada merkezine oturan G grubunda yerel
// koordinatlarla kurulur (x doğu, z güney); çarpışma ve etkileşimler dünya koordinatına çevrilir.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeCoast, buildIslandTerrain } from './coast.js';
import { makeKit } from './kit.js';

export const CHINA = {x:520, z:1080, name:'Yùlóng Adası', sub:'Çin İmparatorluk Adası'};
export const CHINA_COAST = makeCoast({cx:CHINA.x, cz:CHINA.z, radius:290, waves:[[3, 22, 1.9], [4, 10, 0.3], [7, 6, 2.5]], ripple:[[9, 4, 0.7], [23, 1.6, 2]], fn:'coastYL'});
// iskele Lumière'e (kuzeybatı) bakar
const HARBOR_A = Math.atan2(0 - CHINA.x, 10 - CHINA.z);

const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const inland = (lx, lz) => -CHINA_COAST.dist(CHINA.x + lx, CHINA.z + lz);
// doğu tepeleri: sırt çizgisi kuzey-güney uzanır, Sed sırtın üstünden geçer
const ridgeX = lz => 175 + 12 * Math.sin(lz / 55);
function hillRaw(lx, lz){
  if (lx < 105) return 0;
  const d = lx - ridgeX(lz), w = d < 0 ? 30 : 48;
  return (22 + 4 * Math.sin(lz / 23)) * Math.exp(-(d / w) * (d / w)) * smooth(18, 60, inland(lx, lz));
}
const hill = (lx, lz) => Math.max(0, hillRaw(lx, lz) - 0.3);
// Sed: sırt boyunca iki kıyı arasında, uçları denize uzanır (güney ucu "Yaşlı Ejderha Başı")
const WALL = (() => {
  let a = 0, b = 0;
  while (inland(ridgeX(a - 5), a - 5) > 3) a -= 5;
  while (inland(ridgeX(b + 5), b + 5) > 3) b += 5;
  return {z0:a - 14, z1:b + 14, gate:-20};
})();
const HARBOR_L = (() => { const [x, z] = CHINA_COAST.point(HARBOR_A, -14); return [x - CHINA.x, z - CHINA.z]; })();

// keşfedilecek yerler (yerel koordinat → dünya)
const PLACE_DEFS = [
  ['saray', 'Yasak Şehir', 'Yüce Uyum Salonu', 0, -38, 32],
  ['ogle', 'Öğle Kapısı ve Paifang', 'İmparatorluk yolu', 0, 100, 24],
  ['sed', 'Çin Seddi', 'Göğün Altındaki İlk Geçit', ridgeX(WALL.gate), WALL.gate, 24],
  ['ejderbasi', 'Yaşlı Ejderha Başı', 'Seddin denize indiği yer', ridgeX(WALL.z1 - 20), WALL.z1 - 20, 26],
  ['pagoda', 'Dokuz Katlı Pagoda', 'Bulut Çanı Tapınağı', 78, -168, 24],
  ['yinyang', 'Yin-Yang Denge Bahçesi', 'Taiji çakıl bahçesi', 108, -118, 14],
  ['bambu', 'Bambu Ormanı', 'Panda koruluğu', -168, -66, 30],
  ['lotus', 'Lotus ve Koi Göleti', 'Ay Köprüsü', -90, 75, 24],
  ['cay', 'Teraslı Çay Tepesi', 'Çay köşkü ve fermantasyon evi', -172, 108, 40],
  ['porselen', 'Porselen Atölyesi', 'Ejderha fırını', 82, 62, 16],
  ['ipek', 'İpek Evi', 'Dut bahçesi ve dokuma', 82, 102, 16],
  ['hali', 'Halı ve Kilim Atölyesi', 'Ejderha ve lotus desenleri', 82, 142, 14],
  ['yesim', 'Yeşim Oyma Atölyesi', 'Kraliyet taşı', 82, 182, 14],
  ['pazar', 'Yüzen Pazar', 'Ejderha kayığı iskelesi', HARBOR_L[0], HARBOR_L[1], 28],
  ['teras', 'Ejderha Terası', 'Pyra\'nın iniş yeri', -80, -205, 16],
];
export const CHINA_PLACES = PLACE_DEFS.map(([id, name, sub, lx, lz, r]) => ({id, name, sub, x:CHINA.x + lx, z:CHINA.z + lz, r}));
export const onChina = (x, z) => Math.hypot(x - CHINA.x, z - CHINA.z) < 400;

const GOODS = {
  porselen:{name:'Ming porseleni', value:10}, ipek:{name:'altın işlemeli ipek', value:9}, hali:{name:'ejderha halısı', value:11},
  yesim:{name:'yeşim heykel', value:14}, cay:{name:'yıllanmış çay', value:7},
};
const QUALITY = ['', 'Sıradan', 'İnce', 'İmparatorluk'];
const RANKS = [[0, 'Yabancı konuk'], [30, 'Saray misafiri'], [80, 'Fransız elçisi'], [160, 'Mandarin dostu'], [280, 'Ejderha Tahtı\'nın dostu']];
const DEALS = [
  {fr:'sarap', cn:'porselen', name:'Bordeaux şarabı ⇄ Ming porseleni'},
  {fr:'parfum', cn:'ipek', name:'Grasse parfümü ⇄ altın işlemeli ipek'},
  {fr:'sarap', cn:'yesim', name:'Bordeaux şarabı ⇄ yeşim heykel'},
  {fr:'parfum', cn:'hali', name:'Grasse parfümü ⇄ ejderha halısı'},
  {fr:'sarap', cn:'cay', name:'Bordeaux şarabı ⇄ yıllanmış Pu-erh'},
];
const FR = {sarap:'Bordeaux şarabı', parfum:'Grasse parfümü'};

// atölyeler: üretim zinciri ve her aşamada usta bir usul sorar (ilk seçenek doğru; gösterirken karıştırılır)
const CRAFTS = {
  porselen:{master:'Usta Lǐ Wén', chain:'Kaolin kili ve petuntse taşı yoğrulur, çarkta biçimlenir, gölgede kurur; kobalt mavisiyle desenlenir, sırlanır ve tepeye tırmanan ejderha fırınında pişer.', steps:[
    ['Hamuru nasıl hazırlayalım?', ['Kaolin kili ile petuntse taşını yarı yarıya karıştır', 'Yalnızca kırmızı nehir kili kullan', 'Kili kumla incelt']],
    ['Mavi-beyaz desen için hangi boya?', ['Kobalt mavisi, sırın altına', 'Altın varak, sırın üstüne', 'Kırmızı lake']],
    ['Ejderha fırını ne kadar ısınmalı?', ['1300 dereceye; ateş üç gün üç gece beslenir', 'Ekmek fırını kadar, birkaç saat', 'Hiç ateşe girmesin, güneşte kurusun']],
  ]},
  ipek:{master:'Madam Sū Lán', chain:'Dut yaprağıyla beslenen ipek böcekleri koza örer; kozalar sıcak suda yumuşatılıp tek iplik halinde çıkrığa sarılır, boyanır, dokunur ve altın simle işlenir.', steps:[
    ['İpek böceklerini ne ile besleriz?', ['Taze dut yaprağı', 'Bambu filizi', 'Pirinç kepeği']],
    ['Kozadan iplik nasıl çekilir?', ['Sıcak suda yumuşatıp ucunu bulur, kesintisiz sararız', 'Kozayı makasla açarız', 'Kurutup havanda döveriz']],
    ['İmparatorluk kumaşına hangi nakış?', ['Beş tırnaklı altın ejderha', 'Dört tırnaklı mavi ejderha', 'Nakışsız, sade']],
  ]},
  hali:{master:'Usta Zhāng Fù', chain:'Yün ve ipek yıkanıp eğrilir, bitkisel boyalarla renklendirilir; dikey tezgâhta sıra sıra düğümlenir, motifler makasla oyulup kabartılır, en son yıkanıp parlatılır.', steps:[
    ['Çivit mavisi hangi bitkiden?', ['Çivit otundan', 'Kökboyadan', 'Safrandan']],
    ['Halının ortasına hangi motif?', ['İnciyi kovalayan iki ejderha ve lotus', 'Fransız zambağı', 'Boş bırakalım']],
    ['Motifler nasıl kabartılır?', ['Kenarları makasla oyulur', 'Üstüne tutkal sürülür', 'Ütülenir']],
  ]},
  yesim:{master:'Usta Jīn Shí', chain:'Hotan nehrinden gelen nefrit taşı, tel ve sulu aşındırıcı kumla kesilir, biçimlenir, oyulur; günlerce bambu ve deriyle cilalanır.', steps:[
    ['Yeşim nasıl kesilir?', ['Tel ve sulu aşındırıcı kumla, sabırla', 'Çelik keskiyle tek darbede', 'Ateşte ısıtıp kırarak']],
    ['İmparator için ne oyalım?', ['Ejderha kulplu imparatorluk mührü', 'Zar takımı', 'Çorba kaşığı']],
    ['Son cila nasıl yapılır?', ['Bambu ve deriyle, günlerce', 'Vernikle', 'Kumla bir kez sürterek']],
  ]},
  cay:{master:'Çay ustası Bái Yún', chain:'Teraslardan sabah çiyiyle yaprak toplanır, soldurulur; yeşil çay sıcak wok\'ta kavrulur, Pu-erh nemli yığınlarda mayalanıp keklere preslenir ve yıllanır.', steps:[
    ['Hangi yaprakları toplayalım?', ['Bir tomurcuk, iki yaprak', 'En yaşlı alt yapraklar', 'Dalıyla birlikte hepsi']],
    ['Yaprakların yeşilini nasıl koruruz?', ['Sıcak wok\'ta elle kavurarak (shā qīng)', 'Güneşte haftalarca bekleterek', 'Suda kaynatarak']],
    ['Pu-erh nasıl olgunlaşır?', ['Nemli yığınlarda mayalanır, keklere preslenip yıllanır', 'Buzda saklanır', 'Şekerle kaynatılır']],
  ]},
};
const CEREMONY = [
  ['Gōngfū çayına nasıl başlanır?', ['Demlik ve fincanlar sıcak suyla ısıtılır', 'Yapraklar soğuk suya atılır', 'Fincanlar ters çevrilip beklenir']],
  ['İlk demleme ne olur?', ['Yaprakları uyandırmak için dökülür', 'Hemen misafire ikram edilir', 'Bir gün bekletilir']],
  ['Fincan misafire nasıl sunulur?', ['İki elle, hafifçe eğilerek', 'Masaya itilerek', 'Tek elle, ayakta']],
];

export function buildChina(world, C, hooks){
  const { THREE, scene, materials:M } = world;
  const CX = CHINA.x, CZ = CHINA.z;
  const root = new THREE.Group(); root.name = 'Yulong'; scene.add(root);
  const G = new THREE.Group(); G.name = 'Yulong:yerel'; G.position.set(CX, 0, CZ); root.add(G);
  const interact = [], markers = [], updaters = [];
  const kit = makeKit(world, C, G, {seed:8861, interact, updaters});
  const { add, mat, lathe, canvas, ctex, rnd } = kit;
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const st = () => {
    const S = hooks.getS();
    return S.china || (S.china = {found:[], goods:{porselen:[], ipek:[], hali:[], yesim:[], cay:[]}, french:{sarap:0, parfum:0}, prestige:0, culture:0, trades:0, cargo:0, rank:0, met:false, seal:false});
  };
  const ui = hooks.ui, sfx = n => hooks.sfx(n);
  const trees = {pine:[], bloom:[], willow:[]};
  const flutter = [];        // rüzgârda dalgalanan kumaşlar ve bayraklar

  /* ================= zemin, kıyı, iskele ================= */
  const ground = M.groundMat.clone(); ground.color.setRGB(0.86, 0.88, 0.74);
  const T = buildIslandTerrain(world, C, CHINA_COAST, {name:'Yùlóng kıyısı', ground, ocean:false, sand:0xb3a27e, grass:0x8ea85c, rocks:60, seed:6262});
  root.add(T.root);
  const pier = T.addPier(HARBOR_A, 40);
  {
    const x0 = 100, x1 = 320, z0 = -320, z1 = 320, st2 = 4, nx = (x1 - x0) / st2 + 1, nz = (z1 - z0) / st2 + 1;
    const pos = [], uv = [], idx = [], hv = [];
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      const lx = x0 + i * st2, lz = z0 + j * st2, h = hillRaw(lx, lz); hv.push(h);
      pos.push(CHINA.x + lx, h - 0.3, CHINA.z + lz); uv.push((CHINA.x + lx + 1200) / 2400, (1200 - CHINA.z - lz) / 2400);
    }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++){
      const a = j * nx + i, b = a + nx;
      if (Math.max(hv[a], hv[a + 1], hv[b], hv[b + 1]) < 0.3) continue;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, ground); m.receiveShadow = true; m.name = 'Yulong:tepeler'; T.root.add(m);
  }

  const cBox = (lx, lz, hw, hd, rot = 0) => C.box(CX + lx, CZ + lz, hw, hd, rot);
  const cCircle = (lx, lz, r) => C.circle(CX + lx, CZ + lz, r);
  const hfns = [];
  C.heightFns.push((x, z) => {
    const lx = x - CX, lz = z - CZ;
    if (lx * lx + lz * lz > 345 * 345) return null;
    let h = null;
    for (const f of hfns){ const v = f(lx, lz); if (v != null && (h == null || v > h)) h = v; }
    return h;
  });
  hfns.push((lx, lz) => { const v = hill(lx, lz); return v > 0.01 ? v : null; });
  const gy = (lx, lz) => Math.max(0, C.height(CX + lx, CZ + lz));
  const act = (lx, lz, label, fn, r = 2.6, show = () => true) => { const o = {x:CX + lx, z:CZ + lz, y:gy(lx, lz), r, label, show, act:fn}; interact.push(o); return o; };

  /* ================= dokular ve malzemeler ================= */
  const FONT = '"PingFang SC","Hiragino Sans GB","Songti SC","Noto Serif SC",serif';
  function tileMat(hex){
    const [c, g] = canvas(128, 128);
    for (let x = 0; x < 128; x++){ const k = Math.sin((x % 16) / 16 * Math.PI), v = 95 + k * 160; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(x, 0, 1, 128); }
    g.fillStyle = 'rgba(0,0,0,.4)'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 3);
    return new THREE.MeshStandardMaterial({map:ctex(c), color:hex, roughness:0.32, metalness:0.12, side:THREE.DoubleSide});
  }
  const tileY = tileMat(0xe2a82a), tileG = tileMat(0x3f7a58), tileGray = tileMat(0x70767a), tileB = tileMat(0x2e5c8c);
  const red = mat(0x9c2219, {roughness:0.42}), redDark = mat(0x6a1611, {roughness:0.5});
  const marbleW = mat(0xeeebe3, {roughness:0.38}), stoneG = mat(0x8e8c85, {roughness:0.92}), stoneD = mat(0x5f5d58, {roughness:0.9});
  const woodD = mat(0x4a2e1c, {roughness:0.75}), woodL = mat(0x8a6236, {roughness:0.8}), bamboo = mat(0xb6a05c, {roughness:0.7});
  const bronze = mat(0x5a4526, {metalness:0.85, roughness:0.38}), black = mat(0x19181a, {roughness:0.6});
  const jadeM = new THREE.MeshPhysicalMaterial({color:0x3fa070, roughness:0.15, clearcoat:0.6, clearcoatRoughness:0.2, sheen:0.3});
  const gold = M.goldMat;
  const whiteWall = mat(0xebe2cf, {roughness:0.85});
  // ahşap kafesli kâğıt kapılar: gece içeriden sıcak ışık
  const lattice = (() => {
    const [c, g] = canvas(128, 256);
    g.fillStyle = '#f2e3c0'; g.fillRect(0, 0, 128, 256);
    g.strokeStyle = '#7a1c14'; g.lineWidth = 5;
    for (let x = 8; x < 128; x += 16){ g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 170); g.stroke(); }
    for (let y = 10; y < 172; y += 16){ g.beginPath(); g.moveTo(4, y); g.lineTo(124, y); g.stroke(); }
    g.fillStyle = '#7a1c14'; g.fillRect(0, 172, 128, 84); g.fillRect(0, 0, 128, 8); g.fillRect(0, 0, 6, 256); g.fillRect(122, 0, 6, 256);
    g.strokeStyle = '#d4af37'; g.lineWidth = 3; g.strokeRect(14, 186, 100, 56);
    return ctex(c);
  })();
  const paperMat = new THREE.MeshStandardMaterial({map:lattice, color:0xffffff, roughness:0.7, emissive:0xffa64a, emissiveMap:lattice, emissiveIntensity:0});
  // dougong (tavan altı konsolları): mavi-yeşil-altın boyalı kuşak
  const bandMat = (() => {
    const [c, g] = canvas(256, 64);
    g.fillStyle = '#1f4a6e'; g.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 32){
      g.fillStyle = '#2f7a5c'; g.fillRect(x + 2, 8, 28, 48);
      g.fillStyle = '#d4af37'; g.beginPath(); g.ellipse(x + 16, 32, 10, 14, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1f4a6e'; g.beginPath(); g.ellipse(x + 16, 32, 5, 8, 0, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#9c2219'; g.fillRect(0, 0, 256, 6); g.fillRect(0, 58, 256, 6);
    return new THREE.MeshStandardMaterial({map:ctex(c, 4, 1), roughness:0.55});
  })();
  const paving = (() => {
    const [c, g] = canvas(256, 256);
    g.fillStyle = '#7d7a72'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32 % 2) * 32; x < 256 + 64; x += 64){
      const v = 150 + rnd() * 40; g.fillStyle = `rgb(${v | 0},${v * 0.97 | 0},${v * 0.92 | 0})`; g.fillRect(x - 64 + 2, y + 2, 60, 28);
    }
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.9});
  })();
  const wallBrick = (() => {
    const [c, g] = canvas(256, 256);
    g.fillStyle = '#6d665a'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 16; x < 288; x += 32){ const v = 120 + rnd() * 50; g.fillStyle = `rgb(${v | 0},${v * 0.95 | 0},${v * 0.86 | 0})`; g.fillRect(x - 32 + 1, y + 1, 30, 14); }
    return new THREE.MeshStandardMaterial({map:ctex(c, 2, 1), roughness:0.95});
  })();
  function plaque(text, w, h, bg = '#1d3a6e', fg = '#e8c15a'){
    const [c, g] = canvas(512, Math.round(512 * h / w));
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#d4af37'; g.lineWidth = 14; g.strokeRect(10, 10, c.width - 20, c.height - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = c.height * 0.62; do { g.font = 'bold ' + fs + 'px ' + FONT; fs -= 4; } while (g.measureText(text).width > c.width - 70);
    g.fillText(text, c.width / 2, c.height / 2 + 4);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.5}));
    m.userData.keep = true; return m;
  }

  /* ================= çatı geometrisi: kalkık saçaklı kalça çatı ve çokgen pagoda çatısı ================= */
  // shape: {type:'rect', W, D} (W ≥ D, sırt x ekseninde) | {type:'poly', n, R, rTop}
  // t: saçaktan (0) mahyaya (1); içbükey eğri ve köşelerde yukarı kıvrılan saçak
  function roofGeo(shape, H, {lift = 1, tMax = 1, rings = 10, seg = 10, fascia = 0.3} = {}){
    const per = shape.type === 'rect' ? 4 : shape.n, N = per * seg, pos = [], uv = [], idx = [];
    const perim = shape.type === 'rect' ? 2 * (shape.W + shape.D) : shape.n * 2 * shape.R * Math.sin(Math.PI / shape.n);
    const slope = Math.hypot(H, shape.type === 'rect' ? shape.D / 2 : shape.R - (shape.rTop || 0));
    const corner = [];
    const ring = (t, dy) => {
      for (let i = 0; i <= N; i++){
        const e = Math.min(per - 1, Math.floor(i / seg)), u = (i - e * seg) / seg, c = Math.pow(Math.abs(u * 2 - 1), 6), k = Math.pow(Math.max(0, 1 - t / 0.6), 2);
        let x, z;
        if (shape.type === 'rect'){
          const hx = shape.W / 2 - t * shape.D / 2, hz = shape.D / 2 * (1 - t), s = u * 2 - 1;
          if (e === 0){ x = s * hx; z = hz; } else if (e === 1){ x = hx; z = -s * hz; } else if (e === 2){ x = -s * hx; z = -hz; } else { x = -hx; z = s * hz; }
        } else {
          const r = shape.R + ((shape.rTop || 0) - shape.R) * t, a0 = e / per * Math.PI * 2, a1 = (e + 1) / per * Math.PI * 2;
          x = r * (Math.sin(a0) * (1 - u) + Math.sin(a1) * u); z = r * (Math.cos(a0) * (1 - u) + Math.cos(a1) * u);
        }
        const fl = 1 + 0.07 * c * k, y = H * (0.3 * t + 0.7 * t * t) + lift * c * k + dy;
        pos.push(x * fl, y, z * fl); uv.push(i / N * perim / 3.2, t * slope / 2);
        if (dy === 0 && u === 0 && i < N) (corner[e] = corner[e] || []).push(L(x * fl, y + 0.12, z * fl));
      }
    };
    const R = Math.max(2, Math.round(rings * tMax));
    ring(0, -fascia);
    for (let r = 0; r <= R; r++) ring(r / R * tMax, 0);
    const row = N + 1;
    for (let j = 0; j < R + 1; j++) for (let i = 0; i < N; i++){ const a = j * row + i, b = a + row; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // köşe mahyaları (kalça sırtları) ve ana mahya
    const ridges = corner.filter(p => p && p.length > 1).map(p => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 10, 0.13 + H * 0.008, 5));
    if (shape.type === 'rect' && tMax >= 1){
      const len = shape.W - shape.D + 0.8, rg = new THREE.BoxGeometry(len, 0.55, 0.42); rg.translate(0, H + 0.2, 0); ridges.push(rg);
      [-1, 1].forEach(sd => { const ch = new THREE.TorusGeometry(0.42, 0.14, 6, 10, Math.PI * 1.25); ch.rotateZ(sd > 0 ? -0.3 : Math.PI * 0.3 + 0.3); ch.translate(sd * len / 2, H + 0.75, 0); ridges.push(ch); });
    }
    return {roof:g, ridge:ridges.length ? mergeBufferGeometries(ridges.map(r => r.index ? r.toNonIndexed() : r)) : null};
  }
  function roof(parent, shape, H, roofMat, y, o = {}){
    const {roof:rg, ridge} = roofGeo(shape, H, o);
    const m = add(rg, roofMat, 0, y, 0, parent); m.castShadow = true;
    if (ridge) add(ridge, o.ridgeMat || roofMat, 0, y, 0, parent);
    return m;
  }

  /* ================= kırmızı sütunlu salon ================= */
  const lanterns = [];       // [x, y, z, ölçek] yerel
  function hallC({x, z, w, d, h = 5, rot = 0, y = 0, base = 0.6, roofMat = tileGray, roofH, lift = 1.1, over = 1.6, double = false, collide = true, parent = G, lanternsAt = true, walls = red, open = false}){
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; parent.add(g);
    add(new THREE.BoxGeometry(w + 2.4, base, d + 2.4), stoneG, 0, base / 2, 0, g);
    const nx = Math.max(2, Math.round(w / 3.6)), nz = Math.max(1, Math.round(d / 3.6)), col = new THREE.CylinderGeometry(0.3, 0.34, h, 12);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++){
      if (i > 0 && i < nx && j > 0 && j < nz) continue;
      const px = -w / 2 + i * w / nx, pz = -d / 2 + j * d / nz;
      add(col, red, px, base + h / 2, pz, g); add(new THREE.CylinderGeometry(0.46, 0.5, 0.22, 12), marbleW, px, base + 0.11, pz, g);
    }
    const iw = w - 1.4, id = d - 1.4;
    if (!open){
      add(new THREE.BoxGeometry(iw, h, id), walls, 0, base + h / 2, 0, g);
      [1, -1].forEach(sd => { const p = add(new THREE.PlaneGeometry(iw * 0.7, h * 0.86), paperMat, 0, base + h * 0.45, sd * (id / 2 + 0.03), g, false); if (sd < 0) p.rotation.y = Math.PI; });
    }
    add(new THREE.BoxGeometry(w + 0.8, 0.85, d + 0.8), bandMat, 0, base + h + 0.42, 0, g);
    let ry = base + h + 0.85;
    const W = w + over * 2, D = d + over * 2, H = roofH || D * 0.4;
    if (double){
      roof(g, {type:'rect', W, D}, H * 0.85, roofMat, ry, {lift, tMax:0.34, fascia:0.25});
      const uh = Math.max(1.8, h * 0.32);
      add(new THREE.BoxGeometry(iw - 1.6, uh, id - 1.6), walls, 0, ry + uh / 2, 0, g);
      add(new THREE.BoxGeometry(iw - 0.8, 0.7, id - 0.8), bandMat, 0, ry + uh + 0.1, 0, g);
      ry += uh + 0.4;
      roof(g, {type:'rect', W:W - over * 1.2, D:D - over * 1.2}, H * 0.95, roofMat, ry, {lift:lift * 0.9});
    } else roof(g, {type:'rect', W, D}, H, roofMat, ry, {lift});
    if (lanternsAt){ const [ax, az] = [Math.cos(rot), -Math.sin(rot)], [bx, bz] = [Math.sin(rot), Math.cos(rot)];
      [-1, 1].forEach(sd => { const lx = sd * (w / 2 - 0.2), lz = d / 2 + 0.6; lanterns.push([x + lx * ax + lz * bx, y + base + h - 0.9, z + lx * az + lz * bz, 1]); }); }
    if (collide) cBox(x, z, w / 2 + 0.45, d / 2 + 0.45, rot);
    return g;
  }

  /* ================= insanlar ================= */
  const skins = [0xe9c6a2, 0xdcb48e, 0xf0d2b2]; let figN = 0;
  const eyeM = new THREE.MeshBasicMaterial({color:0x1a120c});
  function figure({robe = 0x2b4a7a, trim = 0xd4af37, hat = 'resmi', sash} = {}){
    const g = new THREE.Group(), R = mat(robe, {roughness:0.55}), Tm = mat(trim, {roughness:0.45}), skin = mat(skins[figN++ % 3], {roughness:0.6}), hair = mat(0x15110e, {roughness:0.5});
    add(lathe([[0, 0.02], [0.34, 0.02], [0.3, 0.35], [0.25, 0.8], [0.22, 1.15], [0.2, 1.38], [0.12, 1.5], [0, 1.5]], 20), R, 0, 0, 0, g);
    add(new THREE.CylinderGeometry(0.232, 0.24, 0.12, 20), mat(sash ?? trim, {roughness:0.5}), 0, 0.98, 0, g);
    [-1, 1].forEach(sd => { const c = add(new THREE.BoxGeometry(0.05, 0.42, 0.02), Tm, sd * 0.05, 1.3, 0.19, g, false); c.rotation.z = sd * 0.45; });
    add(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 10), skin, 0, 1.55, 0, g);
    add(new THREE.SphereGeometry(0.115, 16, 12), skin, 0, 1.69, 0, g).scale.set(0.95, 1.08, 1);
    [-1, 1].forEach(sd => add(new THREE.SphereGeometry(0.014, 6, 5), eyeM, sd * 0.04, 1.71, 0.105, g, false));
    [-1, 1].forEach(sd => { const s = add(new THREE.CylinderGeometry(0.075, 0.17, 0.56, 10), R, sd * 0.17, 1.2, 0.13, g); s.rotation.set(-0.55, 0, -sd * 0.3); });
    add(new THREE.SphereGeometry(0.06, 8, 6), skin, 0, 1.0, 0.33, g);
    if (hat !== 'kesis') add(new THREE.SphereGeometry(0.122, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 1.71, -0.01, g);
    if (hat === 'resmi'){ add(new THREE.ConeGeometry(0.24, 0.13, 16), black, 0, 1.84, 0, g); add(new THREE.ConeGeometry(0.12, 0.12, 12), mat(0xb3121e), 0, 1.9, 0, g); add(new THREE.SphereGeometry(0.035, 8, 6), gold, 0, 1.97, 0, g); }
    else if (hat === 'hasir') add(new THREE.ConeGeometry(0.4, 0.22, 18), bamboo, 0, 1.88, 0, g);
    else if (hat === 'hanim'){ add(new THREE.SphereGeometry(0.09, 12, 10), hair, 0, 1.86, -0.04, g).scale.set(1.6, 0.8, 1); const p = add(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6), gold, 0, 1.88, -0.03, g); p.rotation.z = Math.PI / 2; add(new THREE.SphereGeometry(0.035, 8, 6), mat(0xe0457a), 0.13, 1.87, 0.02, g); }
    else if (hat === 'bilgin') add(new THREE.BoxGeometry(0.2, 0.1, 0.2), black, 0, 1.83, -0.01, g);
    else if (hat === 'komutan'){ add(new THREE.ConeGeometry(0.15, 0.3, 12), mat(0x8a8f96, {metalness:0.8, roughness:0.3}), 0, 1.92, 0, g); add(new THREE.ConeGeometry(0.04, 0.22, 6), mat(0xb3121e), 0, 2.12, 0, g); }
    return g;
  }
  function person(lx, lz, ry, name, opts, fn, r = 2.6){
    const g = figure(opts), y = gy(lx, lz);
    g.position.set(lx, y, lz); g.rotation.y = ry; g.userData.dyn = true; G.add(g); cCircle(lx, lz, 0.4);
    updaters.push((dt, t, hero) => {
      const dx = hero.pos.x - CX - lx, dz = hero.pos.z - CZ - lz;
      if (Math.abs(dx) + Math.abs(dz) > 40) return;
      world.turnToward(g, Math.hypot(dx, dz) < 5 ? Math.atan2(dx, dz) : ry, Math.min(1, dt * 3));
    });
    if (fn) act(lx, lz, 'Konuş: ' + name, fn, r);
    return g;
  }
  const say = (name, lines) => ui.dialog((Array.isArray(lines) ? lines : [lines]).map(text => ({name, text})));

  /* ================= küçük yapı parçaları ================= */
  function lion(lx, lz, ry, k = 1, m = stoneG){
    const g = new THREE.Group(); g.position.set(lx, gy(lx, lz), lz); g.rotation.y = ry; g.scale.setScalar(k); G.add(g);
    add(new THREE.BoxGeometry(1.3, 1.1, 1.6), m, 0, 0.55, 0, g);
    add(new THREE.SphereGeometry(0.5, 12, 10), m, 0, 1.55, -0.15, g).scale.set(1, 1.1, 1.2);
    add(new THREE.SphereGeometry(0.46, 12, 10), m, 0, 2.15, 0.28, g);
    add(new THREE.SphereGeometry(0.32, 12, 10), m, 0, 2.12, 0.58, g).scale.set(1, 0.85, 0.8);
    [-1, 1].forEach(sd => add(new THREE.CylinderGeometry(0.13, 0.15, 0.9, 8), m, sd * 0.28, 1.45, 0.45, g));
    add(new THREE.SphereGeometry(0.28, 12, 8), m, 0.38, 1.25, 0.6, g);    // ayak altında top
    cCircle(lx, lz, 0.95 * k);
  }
  function ding(lx, lz, k = 1){
    const g = new THREE.Group(); g.position.set(lx, gy(lx, lz), lz); g.scale.setScalar(k); G.add(g);
    add(lathe([[0, 0.7], [0.55, 0.72], [0.7, 0.95], [0.72, 1.4], [0.8, 1.5], [0.66, 1.52], [0.6, 1.45]], 20), bronze, 0, 0, 0, g);
    for (let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2; add(new THREE.CylinderGeometry(0.08, 0.11, 0.85, 8), bronze, Math.sin(a) * 0.45, 0.42, Math.cos(a) * 0.45, g); }
    [-1, 1].forEach(sd => { const h = add(new THREE.TorusGeometry(0.16, 0.04, 6, 12, Math.PI), bronze, sd * 0.62, 1.55, 0, g); h.rotation.y = Math.PI / 2; });
    cCircle(lx, lz, 0.85 * k);
    return g;
  }
  function lanternPost(lx, lz, h = 3.2){
    const y = gy(lx, lz);
    add(new THREE.BoxGeometry(0.3, 0.3, 0.3), stoneG, lx, y + 0.15, lz);
    add(new THREE.CylinderGeometry(0.07, 0.09, h, 8), woodD, lx, y + h / 2, lz);
    add(new THREE.BoxGeometry(0.9, 0.08, 0.08), woodD, lx + 0.35, y + h - 0.1, lz);
    lanterns.push([lx + 0.7, y + h - 0.65, lz, 0.9]);
    cCircle(lx, lz, 0.25);
  }
  // kıyı boyunca, iki direk arasında sarkan fener dizisi
  function lanternString(ax, az, bx, bz, h = 4.5, n = 7){
    [[ax, az], [bx, bz]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(0.08, 0.1, h, 8), woodD, x, gy(x, z) + h / 2, z); cCircle(x, z, 0.2); });
    const ya = gy(ax, az) + h - 0.2, yb = gy(bx, bz) + h - 0.2, pts = [];
    for (let i = 0; i <= 12; i++){ const t = i / 12; pts.push(L(ax + (bx - ax) * t, ya + (yb - ya) * t - Math.sin(t * Math.PI) * 1.1, az + (bz - az) * t)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.015, 4), black, 0, 0, 0);
    for (let i = 1; i <= n; i++){ const t = i / (n + 1); lanterns.push([ax + (bx - ax) * t, ya + (yb - ya) * t - Math.sin(t * Math.PI) * 1.1 - 0.4, az + (bz - az) * t, 0.65]); }
  }
  // yolları zemine serilmiş taş şeritler olarak çiz (tepelerde araziyi izler)
  function road(points, w = 5){
    const pos = [], uv = [], idx = []; let len = 0, n = 0;
    for (let k = 0; k < points.length - 1; k++){
      const [ax, az] = points[k], [bx, bz] = points[k + 1], sl = Math.hypot(bx - ax, bz - az), steps = Math.max(1, Math.ceil(sl / 2));
      const nx = -(bz - az) / sl, nz = (bx - ax) / sl;
      for (let s = (k ? 1 : 0); s <= steps; s++){
        const t = s / steps, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        [-1, 1].forEach(sd => { const px = x + nx * sd * w / 2, pz = z + nz * sd * w / 2; pos.push(px, gy(px, pz) + 0.035, pz); uv.push(sd * w / 8, (len + sl * t) / 8); });
        if (n > 0){ const a = (n - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
        n++;
      }
      len += sl;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = add(g, paving, 0, 0, 0, G, false); m.receiveShadow = true;
  }

  /* ================= YASAK ŞEHİR ================= */
  const PX0 = -60, PX1 = 60, PZ0 = -130, PZ1 = 44, WH = 7;
  function terraces(cx, cz, tiers, stairW, stairLen){
    let y = 0;
    const post = new THREE.BoxGeometry(0.24, 0.95, 0.24);
    tiers.forEach(([w, d, h]) => {
      add(new THREE.BoxGeometry(w, h, d), marbleW, cx, y + h / 2, cz);
      add(new THREE.BoxGeometry(w + 0.3, 0.18, d + 0.3), marbleW, cx, y + h - 0.09, cz);
      y += h;
      // korkuluk (önde merdiven boşluğu)
      const edge = (x0, z0, x1, z1) => {
        const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 2.2), yaw = Math.atan2(x1 - x0, z1 - z0);
        for (let i = 0; i <= n; i++){ const px = x0 + (x1 - x0) * i / n, pz = z0 + (z1 - z0) * i / n; if (Math.abs(px - cx) < stairW / 2 + 0.3 && pz > cz) continue; add(post, marbleW, px, y + 0.47, pz); }
        const rail = add(new THREE.BoxGeometry(0.14, 0.12, len), marbleW, (x0 + x1) / 2, y + 0.82, (z0 + z1) / 2); rail.rotation.y = yaw;
        return rail;
      };
      const hw = w / 2 - 0.3, hd = d / 2 - 0.3;
      edge(cx - hw, cz - hd, cx + hw, cz - hd); edge(cx - hw, cz - hd, cx - hw, cz + hd); edge(cx + hw, cz - hd, cx + hw, cz + hd);
      [-1, 1].forEach(sd => { const a = cx + sd * (stairW / 2 + 0.3), b = cx + sd * hw, r = add(new THREE.BoxGeometry(Math.abs(b - a), 0.12, 0.14), marbleW, (a + b) / 2, y + 0.82, cz + hd); for (let x = Math.min(a, b); x <= Math.max(a, b) + 0.01; x += 2.2) add(post, marbleW, x, y + 0.47, cz + hd); return r; });
    });
    const top = y, zf0 = cz + tiers[0][1] / 2, zfT = cz + tiers[tiers.length - 1][1] / 2, zs = zf0 + stairLen;
    // basamaklar ve ortada ejderha kabartmalı imparator rampası
    const n = Math.ceil(top / 0.28), depth = (zs - zfT) / n;
    for (let i = 0; i < n; i++){ const hh = top * (i + 1) / n; add(new THREE.BoxGeometry(stairW, hh, depth + 0.02), marbleW, cx, hh / 2, zs - (i + 0.5) * depth); }
    const ramp = add(new THREE.PlaneGeometry(stairW * 0.32, Math.hypot(top, zs - zfT)), dragonRelief, cx, top / 2 + 0.06, (zs + zfT) / 2, G, false);
    ramp.rotation.x = -Math.PI / 2 + Math.atan2(top, zs - zfT);
    hfns.push((lx, lz) => {
      let h = null, yy = 0;
      for (const [w, d, th] of tiers){ if (Math.abs(lx - cx) < w / 2 && Math.abs(lz - cz) < d / 2){ yy += th; h = yy; } else break; }
      if (Math.abs(lx - cx) < stairW / 2 && lz > zfT - 0.5 && lz < zs){ const s = Math.min(top, Math.max(0, top * (zs - lz) / (zs - zfT))); h = Math.max(h ?? 0, s); }
      return h;
    });
    return top;
  }
  const dragonRelief = (() => {
    const [c, g] = canvas(128, 512);
    g.fillStyle = '#e9e5da'; g.fillRect(0, 0, 128, 512);
    g.strokeStyle = 'rgba(120,110,95,.55)'; g.lineWidth = 7;
    g.beginPath(); for (let y = 20; y < 500; y += 4) g.lineTo(64 + Math.sin(y / 38) * 34, y); g.stroke();
    g.lineWidth = 2; for (let y = 30; y < 490; y += 22){ g.beginPath(); g.arc(64 + Math.sin(y / 38) * 34, y, 9, 0, Math.PI * 2); g.stroke(); }
    for (let i = 0; i < 9; i++){ g.beginPath(); g.arc(20 + (i % 2) * 88, 40 + i * 52, 12, 0, Math.PI * 1.4); g.stroke(); }
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.45});
  })();
  // kırmızı sur: sarı kiremit başlıklı
  function redWall(x0, z0, x1, z1){
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0), g = new THREE.Group();
    g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.rotation.y = yaw + Math.PI / 2; G.add(g);
    add(new THREE.BoxGeometry(len, 0.6, 2.8), stoneG, 0, 0.3, 0, g);
    add(new THREE.BoxGeometry(len, WH, 2.2), red, 0, WH / 2, 0, g);
    add(new THREE.BoxGeometry(len + 0.2, 0.4, 2.6), bandMat, 0, WH + 0.1, 0, g);
    roof(g, {type:'rect', W:len + 1.6, D:3.6}, 1.0, tileY, WH + 0.3, {lift:0, seg:4, rings:4});
    cBox((x0 + x1) / 2, (z0 + z1) / 2, len / 2, 1.2, yaw + Math.PI / 2);
  }
  // kapı kulesi: kemerli geçitli kırmızı kaide ve üstünde salon
  function gateTower({x, z, rot = 0, w, d, h, open, hall:hallOpt, name}){
    const g = new THREE.Group(); g.position.set(x, gy(x, z), z); g.rotation.y = rot; G.add(g);
    const side = (w - open) / 2, yc = open * 0.75;
    const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(-open / 2, 0); sh.lineTo(-open / 2, yc);
    sh.absarc(0, yc, open / 2, Math.PI, 0, true); sh.lineTo(open / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
    const body = new THREE.ExtrudeGeometry(sh, {depth:d, bevelEnabled:false, curveSegments:16}); body.translate(0, 0, -d / 2);
    add(body, red, 0, 0, 0, g);
    [-1, 1].forEach(sd => {
      const [wx, wz] = [x + Math.cos(rot) * sd * (open / 2 + side / 2), z - Math.sin(rot) * sd * (open / 2 + side / 2)];
      cBox(wx, wz, side / 2, d / 2, rot);
    });
    add(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), marbleW, 0, h + 0.25, 0, g);
    hallC(Object.assign({x:0, z:0, y:h + 0.5, base:0.2, parent:g, collide:false, lanternsAt:false, roofMat:tileY, double:true}, hallOpt));
    if (name){ const p = plaque(name, 3.8, 1.3); p.position.set(0, h - 1.2, d / 2 + 0.06); g.add(p); }
    return g;
  }
  {
    // surlar ve kapılar
    redWall(PX0, PZ1, -22, PZ1); redWall(22, PZ1, PX1, PZ1);
    redWall(PX0, PZ0, -13, PZ0); redWall(13, PZ0, PX1, PZ0);
    redWall(PX0, PZ0, PX0, PZ1);
    redWall(PX1, PZ0, PX1, -39); redWall(PX1, -21, PX1, PZ1);
    gateTower({x:0, z:PZ1, w:44, d:14, h:9, open:6.5, hall:{w:30, d:9, h:5, roofH:6.5}, name:'午門'});
    gateTower({x:0, z:PZ0, rot:Math.PI, w:26, d:11, h:7.5, open:5, hall:{w:17, d:7, h:4, roofH:5}, name:'神武門'});
    gateTower({x:PX1, z:-30, rot:Math.PI / 2, w:18, d:10, h:7, open:5, hall:{w:12, d:6, h:3.6, roofH:4.2}, name:'東華門'});
    // köşe kuleleri
    [[PX0, PZ0], [PX1, PZ0], [PX0, PZ1], [PX1, PZ1]].forEach(([x, z]) => {
      add(new THREE.BoxGeometry(8, WH, 8), red, x, WH / 2, z); cBox(x, z, 4, 4);
      hallC({x, z, y:WH, w:6, d:6, h:3.2, base:0.4, roofMat:tileY, double:true, collide:false, lanternsAt:false, roofH:3.6});
    });
    // altın su deresi ve beş mermer köprü
    const streamZ = x => 22 + 5 * (x / 44) * (x / 44), bridgesX = [-12, -6, 0, 6, 12], waterM = mat(0x2a5a55, {roughness:0.08, metalness:0.1});
    for (let x = -44; x < 44; x += 4){
      const z0 = streamZ(x), z1 = streamZ(x + 4), len = Math.hypot(4, z1 - z0), yaw = Math.atan2(4, z1 - z0);
      const w = add(new THREE.PlaneGeometry(3.2, len + 0.2), waterM, x + 2, 0.12, (z0 + z1) / 2, G, false); w.rotation.set(-Math.PI / 2, 0, yaw);
      [-1, 1].forEach(sd => { const b = add(new THREE.BoxGeometry(0.5, 0.5, len + 0.3), marbleW, x + 2, 0.25, (z0 + z1) / 2 + sd * 1.85); b.rotation.y = yaw; });
      if (!bridgesX.some(bx => Math.abs(x + 2 - bx) < 3.2)){ const o = C.box(CX + x + 2, CZ + (z0 + z1) / 2, 2.1, 2.0, yaw - Math.PI / 2); o.y0 = -5; o.y1 = 0.3; }
    }
    bridgesX.forEach(bx => {
      const z = streamZ(bx);
      for (let i = -3; i <= 3; i++){ const s = i * 0.9, y = 0.75 * Math.cos(s / 3.2 * Math.PI / 2); add(new THREE.BoxGeometry(3.4, 0.25, 0.95), marbleW, bx, y, z + s); }
      [-1, 1].forEach(sd => { for (let i = -3; i <= 3; i++){ const s = i * 0.9; add(new THREE.BoxGeometry(0.18, 0.7, 0.18), marbleW, bx + sd * 1.6, 0.75 * Math.cos(s / 3.2 * Math.PI / 2) + 0.45, z + s); } });
      hfns.push((lx, lz) => Math.abs(lx - bx) < 1.7 && Math.abs(lz - z) < 3.2 ? 0.12 + 0.75 * Math.cos((lz - z) / 3.2 * Math.PI / 2) : null);
    });
    // Yüce Uyum Salonu: üç katlı mermer teras üstünde, çift saçaklı imparatorluk çatısı
    const top = terraces(0, -40, [[64, 46, 1.3], [56, 40, 1.3], [48, 34, 1.3]], 10, 12);
    const throne = hallC({x:0, z:-42, y:top, w:36, d:18, h:7.2, base:0.5, roofMat:tileY, double:true, lift:1.7, roofH:8.5});
    { const p = plaque('太和殿', 4.6, 1.6); p.position.set(0, 0.5 + 7.2 - 0.6, 18 / 2 + 0.95); throne.add(p); }
    [-1, 1].forEach(sd => { ding(sd * 15, -25, 1.1); lion(sd * 7.5, 6, 0, 1.2, mat(0x8a6a2a, {metalness:0.8, roughness:0.35})); });
    // güneş saati ve bronz turna
    { const y = top; const s = add(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 24), marbleW, -20, y + 1.6, -26); s.rotation.x = 0.7; add(new THREE.BoxGeometry(1.2, 1.5, 1.2), marbleW, -20, y + 0.75, -26); cCircle(-20, -26, 1); }
    // Huzur salonu (arkada)
    const top2 = terraces(0, -100, [[34, 20, 1.0]], 8, 4);
    hallC({x:0, z:-101, y:top2, w:26, d:12, h:5.6, roofMat:tileY, lift:1.3});
    // avlu fenerleri
    [-2, 8, 34].forEach(z => [-1, 1].forEach(sd => lanternPost(sd * 24, z)));
  }

  /* ================= imparatorluk yolu, Paifang ================= */
  function paifang(lx, lz){
    const g = new THREE.Group(); g.position.set(lx, 0, lz); G.add(g);
    const posts = [-10, -3.6, 3.6, 10];
    posts.forEach((x, i) => {
      const h = i === 1 || i === 2 ? 9 : 7;
      add(new THREE.CylinderGeometry(0.42, 0.46, h, 14), red, x, h / 2, 0, g);
      add(new THREE.BoxGeometry(1.4, 1.2, 1.6), marbleW, x, 0.6, 0, g);
      cCircle(lx + x, lz, 0.75);
    });
    [[0, 8.2, 7.2], [-6.8, 6.3, 6.4], [6.8, 6.3, 6.4]].forEach(([x, y, w]) => {
      add(new THREE.BoxGeometry(w + 0.8, 0.7, 0.7), bandMat, x, y, 0, g);
      add(new THREE.BoxGeometry(w + 0.8, 0.5, 0.6), red, x, y - 0.8, 0, g);
      roof(g, {type:'rect', W:w + 2.6, D:2.6}, 1.4, tileB, y + 0.35, {lift:0.7, seg:6, rings:6});
    });
    const p = plaque('玉龍門', 4.2, 1.4); p.position.set(0, 7.2, 0.37); g.add(p);
    const q = plaque('玉龍門', 4.2, 1.4); q.position.set(0, 7.2, -0.37); q.rotation.y = Math.PI; g.add(q);
  }
  {
    road([[0, 48], [0, 200]], 11);
    paifang(0, 126);
    [-1, 1].forEach(sd => { lion(sd * 8, 56, 0, 1.05); lion(sd * 12.5, 130, 0, 1.1); });
    for (let z = 62; z <= 196; z += 13) [-1, 1].forEach(sd => lanternPost(sd * 7.5, z));
    // ruh yolu: iki yanda taş muhafızlar
    for (let z = 145; z <= 190; z += 15) [-1, 1].forEach(sd => {
      const y = 0; add(new THREE.BoxGeometry(1.1, 0.5, 1.1), stoneG, sd * 10, y + 0.25, z);
      const f = figure({robe:0x8a877e, trim:0x77746c, hat:'komutan', sash:0x77746c}); f.traverse(o => { if (o.isMesh && o.material !== eyeM) o.material = stoneG; });
      f.position.set(sd * 10, 0.5, z); f.scale.setScalar(1.6); f.rotation.y = -sd * Math.PI / 2; G.add(f); cCircle(sd * 10, z, 0.8);
    });
  }

  /* ================= ÇİN SEDDİ ================= */
  const beacons = [];
  {
    const gateLz = WALL.gate, merlon = new THREE.BoxGeometry(0.75, 1.0, 0.5);
    const wy = lz => { const x = ridgeX(lz); return inland(x, lz) > 0 ? hill(x, lz) : -1.6; };
    const pts = []; for (let lz = WALL.z0; lz <= WALL.z1 + 0.1; lz += 5) pts.push([ridgeX(lz), lz, wy(lz)]);
    const towerAt = new Set(); for (let i = 2; i < pts.length - 1; i += 13) towerAt.add(i);
    towerAt.add(pts.length - 1); towerAt.add(0);
    for (let i = 0; i < pts.length - 1; i++){
      const [ax, az, ay] = pts[i], [bx, bz, by] = pts[i + 1];
      if (Math.abs((az + bz) / 2 - gateLz) < 8) continue;
      const len = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), pitch = -Math.atan2(by - ay, len);
      const g = new THREE.Group(); g.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); g.rotation.set(pitch, yaw, 0, 'YXZ'); G.add(g);
      add(new THREE.BoxGeometry(6, 11, len + 0.6), wallBrick, 0, 1.5, 0, g);
      add(new THREE.BoxGeometry(5.2, 0.12, len + 0.6), stoneD, 0, 7.04, 0, g);
      [-1, 1].forEach(sd => { for (let s = -len / 2 + 0.6; s < len / 2; s += 1.6) add(merlon, wallBrick, sd * 2.75, 7.5, s, g); });
      cBox((ax + bx) / 2, (az + bz) / 2, 3, len / 2 + 0.3, yaw);
    }
    // gözetleme ve işaret kuleleri
    towerAt.forEach(i => {
      const [x, z, y] = pts[i];
      if (Math.abs(z - gateLz) < 20) return;
      add(new THREE.BoxGeometry(9, 15, 9), wallBrick, x, y + 3.5, z);
      for (let k = -4; k <= 4; k += 1.6) [-1, 1].forEach(sd => { add(merlon, wallBrick, x + k, y + 11.5, z + sd * 4.3); add(merlon, wallBrick, x + sd * 4.3, y + 11.5, z + k); });
      [-1, 1].forEach(sd => { const a = add(new THREE.PlaneGeometry(1.6, 2.4), black, x, y + 8.4, z + sd * 4.52, G, false); if (sd < 0) a.rotation.y = Math.PI; });
      add(lathe([[0, 0], [0.8, 0.1], [1.0, 0.7], [0.9, 0.75]], 16), bronze, x, y + 11, z);
      const flame = add(new THREE.ConeGeometry(0.7, 2.2, 10), new THREE.MeshBasicMaterial({color:0xff8a2a, toneMapped:false, transparent:true, opacity:0.9}), x, y + 12.6, z);
      flame.userData.keep = true; flame.visible = false;
      beacons.push({flame, z, t:0});
      cBox(x, z, 4.6, 4.6);
    });
    // Göğün Altındaki İlk Geçit: kemerli geçitli kale kapısı ve iki katlı kule
    const gx = ridgeX(gateLz), yawG = Math.atan2(ridgeX(gateLz + 1) - ridgeX(gateLz - 1), 2);
    gateTower({x:gx, z:gateLz, rot:yawG + Math.PI / 2, w:20, d:12, h:9, open:5, hall:{w:14, d:8, h:4.4, roofH:5.5, roofMat:tileG}, name:'天下第一關'});
    beacons.sort((a, b) => Math.abs(a.z - gateLz) - Math.abs(b.z - gateLz));
    // Yaşlı Ejderha Başı: denize uzanan son burç
    const [ex, ez] = pts[pts.length - 1];
    add(new THREE.BoxGeometry(12, 4, 12), stoneD, ex, -1, ez + 3);
  }

  /* ================= DOKUZ KATLI PAGODA, ÇAN, YIN-YANG ================= */
  const bell = {log:null, swing:0}, smoke = [];
  {
    const PX = 78, PZ = -168;
    add(new THREE.CylinderGeometry(12, 12.4, 0.5, 8), marbleW, PX, 0.25, PZ);
    add(new THREE.CylinderGeometry(10, 10, 0.5, 8), marbleW, PX, 0.75, PZ);
    hfns.push((lx, lz) => { const r = Math.hypot(lx - PX, lz - PZ); return r < 10 ? 1.0 : r < 12.2 ? 0.5 : null; });
    let y = 1.0, rb = 6.2;
    const bellG = new THREE.ConeGeometry(0.16, 0.4, 8);
    for (let k = 0; k < 9; k++){
      const h = k === 0 ? 5.4 : 3.5;
      add(new THREE.CylinderGeometry(rb, rb, h, 8), whiteWall, PX, y + h / 2, PZ);
      for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; add(new THREE.CylinderGeometry(0.22, 0.22, h, 8), red, PX + Math.sin(a) * rb, y + h / 2, PZ + Math.cos(a) * rb); }
      add(new THREE.CylinderGeometry(rb + 0.35, rb + 0.35, 0.6, 8), bandMat, PX, y + h + 0.3, PZ);
      const R = rb + 2.3 - k * 0.08, eh = 1.7;
      const e = new THREE.Group(); e.position.set(PX, 0, PZ); G.add(e);
      if (k < 8) roof(e, {type:'poly', n:8, R, rTop:rb * 0.92}, eh, tileG, y + h + 0.6, {lift:0.75, seg:6, rings:6});
      else roof(e, {type:'poly', n:8, R, rTop:0}, 4.2, tileG, y + h + 0.6, {lift:0.8, seg:6, rings:8});
      for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; add(bellG, gold, PX + Math.sin(a) * R * 1.07, y + h + 0.6 + 0.35, PZ + Math.cos(a) * R * 1.07); }
      y += h + 0.6 + eh * 0.55; rb *= 0.9;
    }
    // altın tepelik
    [[0.7, 0.25], [0.6, 0.25], [0.5, 0.25], [0.4, 0.25]].forEach(([r], i) => add(new THREE.TorusGeometry(r, 0.09, 6, 16), gold, PX, y + 2.4 + i * 0.6, PZ).rotation.x = Math.PI / 2);
    add(new THREE.CylinderGeometry(0.1, 0.16, 5, 8), gold, PX, y + 3.2, PZ);
    add(new THREE.SphereGeometry(0.42, 14, 10), gold, PX, y + 5.9, PZ);
    { const d = add(new THREE.PlaneGeometry(2.2, 3.4), black, PX, 2.7, PZ + 6.25, G, false); const p = plaque('雲鐘塔', 2.8, 0.9); p.position.set(PX, 5.2, PZ + 6.3); G.add(p); d.renderOrder = 1; }
    cCircle(PX, PZ, 7.2);
    // çan köşkü
    const BX = 46, BZ = -146;
    hallC({x:BX, z:BZ, w:6.5, d:6.5, h:4.6, base:0.4, roofMat:tileG, lanternsAt:false, collide:false, open:true});
    hfns.push((lx, lz) => Math.abs(lx - BX) < 4.4 && Math.abs(lz - BZ) < 4.4 ? 0.4 : null);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => cCircle(BX + sx * 3.25, BZ + sz * 3.25, 0.4));
    const bellM = mat(0x4a3a22, {metalness:0.9, roughness:0.35});
    add(lathe([[0, 3.9], [0.55, 3.85], [0.95, 3.4], [1.05, 2.4], [1.25, 1.35], [1.3, 1.25], [0, 1.25]], 28), bellM, BX, 0, BZ);
    add(new THREE.TorusGeometry(0.25, 0.08, 8, 12), bellM, BX, 4.05, BZ);
    cCircle(BX, BZ, 1.4);
    const logG = new THREE.Group(); logG.position.set(BX + 1.6, 4.4, BZ); logG.userData.dyn = true; G.add(logG);
    [-0.7, 0.7].forEach(dz => add(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 4), woodL, 0, -1.0, dz, logG));
    const lg = add(new THREE.CylinderGeometry(0.2, 0.2, 2.6, 10), woodL, 1.0, -2.1, 0, logG); lg.rotation.z = Math.PI / 2;
    bell.log = logG;
    // tütsü kazanı ve duman
    ding(78, -146, 1.5);
    const smokeG = new THREE.BufferGeometry(), SN = 60, sp = new Float32Array(SN * 3);
    smokeG.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sm = new THREE.Points(smokeG, new THREE.PointsMaterial({color:0xd8d4cc, size:0.5, transparent:true, opacity:0.35, depthWrite:false}));
    sm.position.set(78, 2.2, -146); sm.frustumCulled = false; G.add(sm);
    for (let i = 0; i < SN; i++) smoke.push({i, t:rnd() * 6});
    smoke.geo = smokeG; smoke.boost = 0;
    // Yin-Yang denge bahçesi: taraklı çakıldan Taiji, iki taş, çevresinde bambu ve çam
    const YX = 108, YZ = -118;
    const [c, g] = canvas(512, 512);
    g.fillStyle = '#d9d3c4'; g.fillRect(0, 0, 512, 512);
    g.save(); g.translate(256, 256);
    g.fillStyle = '#2b2a28'; g.beginPath(); g.arc(0, 0, 230, -Math.PI / 2, Math.PI / 2); g.arc(0, 115, 115, Math.PI / 2, -Math.PI / 2, true); g.arc(0, -115, 115, Math.PI / 2, -Math.PI / 2); g.fill();
    g.fillStyle = '#e8e3d6'; g.beginPath(); g.arc(0, -115, 115, -Math.PI / 2, Math.PI / 2, true); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let r = 20; r < 250; r += 12){ g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 10; g.strokeStyle = '#6b665c'; g.beginPath(); g.arc(0, 0, 238, 0, Math.PI * 2); g.stroke();
    g.restore();
    const yy = new THREE.Mesh(new THREE.CircleGeometry(11, 64), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.95})); yy.rotation.x = -Math.PI / 2; yy.position.set(YX, 0.04, YZ); yy.userData.keep = true; G.add(yy);
    add(new THREE.SphereGeometry(1.2, 14, 10), mat(0x232220, {roughness:0.6}), YX, 0.4, YZ - 5.5).scale.y = 0.6;
    add(new THREE.SphereGeometry(1.2, 14, 10), mat(0xeeeae0, {roughness:0.6}), YX, 0.4, YZ + 5.5).scale.y = 0.6;
    cCircle(YX, YZ - 5.5, 1.1); cCircle(YX, YZ + 5.5, 1.1);
    add(new THREE.BoxGeometry(3, 0.45, 0.8), woodL, YX - 13, 0.45, YZ); cBox(YX - 13, YZ, 1.5, 0.4);
    road([[0, -136], [30, -140], [60, -150], [78, -154]], 5);
    road([[78, -154], [100, -132]], 3.5);
  }

  /* ================= BAMBU ORMANI ve PANDALAR ================= */
  const pandas = [];
  const BAM = {x:-168, z:-66, r:52}, CLEAR = {x:-158, z:-60, r:13};
  const BAM_PATH = [[-80, -196], [-120, -150], [BAM.x + 22, BAM.z - 2], [CLEAR.x, CLEAR.z]];
  function nearPath(x, z, pts, w){
    for (let k = 0; k < pts.length - 1; k++){
      const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) < w) return true;
    }
    return false;
  }
  {
    const N = 1300, stalkG = new THREE.CylinderGeometry(1, 1, 1, 6, 1); stalkG.translate(0, 0.5, 0);
    const [c, g] = canvas(32, 256); g.fillStyle = '#6f9a3a'; g.fillRect(0, 0, 32, 256); for (let y = 0; y < 256; y += 32){ g.fillStyle = '#9ab865'; g.fillRect(0, y, 32, 4); g.fillStyle = 'rgba(40,60,20,.35)'; g.fillRect(0, y + 4, 32, 2); }
    const stalkM = world.windMat(new THREE.MeshLambertMaterial({map:ctex(c, 1, 3)}), 0.55, false);
    const stalks = new THREE.InstancedMesh(stalkG, stalkM, N);
    const leafParts = []; for (let i = 0; i < 6; i++){ const p = new THREE.PlaneGeometry(0.16, 1.1); p.translate(0, 0.5, 0); p.rotateZ(-0.9 - rnd() * 0.6); p.rotateY(i / 6 * Math.PI * 2); leafParts.push(p); }
    const leafG = mergeBufferGeometries(leafParts);
    const leafM = world.windMat(new THREE.MeshLambertMaterial({side:THREE.DoubleSide}), 1.2, true);
    const leaves = new THREE.InstancedMesh(leafG, leafM, N * 3);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    let n = 0, nl = 0;
    for (let k = 0; k < N * 3 && n < N; k++){
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * BAM.r, x = BAM.x + Math.sin(a) * rr, z = BAM.z + Math.cos(a) * rr;
      if (Math.hypot(x - CLEAR.x, z - CLEAR.z) < CLEAR.r || inland(x, z) < 22) continue;
      if (nearPath(x, z, BAM_PATH, 2.6)) continue;   // içinden geçen patika
      const h = 7 + rnd() * 7, r = 0.05 + rnd() * 0.06, y = gy(x, z);
      e.set((rnd() - 0.5) * 0.08, 0, (rnd() - 0.5) * 0.08);
      m4.compose(p.set(x, y, z), q.setFromEuler(e), s.set(r, h, r)); stalks.setMatrixAt(n, m4);
      for (let j = 0; j < 3 && nl < N * 3; j++){
        const ly = y + h * (0.55 + j * 0.16), k2 = 0.9 + rnd() * 0.8;
        m4.compose(p.set(x, ly, z), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s.set(k2, k2, k2)); leaves.setMatrixAt(nl, m4);
        leaves.setColorAt(nl, col.setHSL(0.24 + rnd() * 0.06, 0.45, 0.28 + rnd() * 0.12).convertSRGBToLinear()); nl++;
      }
      if (n % 3 === 0) cCircle(x, z, r + 0.25);
      n++;
    }
    stalks.count = n; leaves.count = nl; stalks.castShadow = leaves.castShadow = true;
    G.add(stalks, leaves);
    road(BAM_PATH, 3.5);
    // panda koruluğu: alçak bambu çit
    for (let i = 0; i < 40; i++){ const a = i / 40 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a - 2.16), Math.cos(a - 2.16))) < 0.2) continue; add(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), bamboo, CLEAR.x + Math.sin(a) * (CLEAR.r + 1), 0.55, CLEAR.z + Math.cos(a) * (CLEAR.r + 1)); }
    // pandalar
    const Wt = mat(0xf1eee4, {roughness:0.95}), Bk = mat(0x1d1c1e, {roughness:0.95});
    for (let i = 0; i < 4; i++){
      const g = new THREE.Group(), body = new THREE.Group(); body.position.y = 0.62; g.add(body); body.userData.anim = true;
      add(new THREE.SphereGeometry(0.5, 16, 12), Wt, 0, 0, 0, body).scale.set(1, 0.9, 1.35);
      add(new THREE.SphereGeometry(0.52, 16, 8), Bk, 0, 0.02, 0.28, body).scale.set(1.02, 0.92, 0.42);
      const head = new THREE.Group(); head.position.set(0, 0.32, 0.72); body.add(head);
      add(new THREE.SphereGeometry(0.36, 16, 12), Wt, 0, 0, 0, head).scale.set(1.08, 0.95, 1);
      [-1, 1].forEach(sd => { add(new THREE.SphereGeometry(0.11, 10, 8), Bk, sd * 0.25, 0.27, -0.02, head); const ep = add(new THREE.SphereGeometry(0.09, 10, 8), Bk, sd * 0.13, 0.04, 0.3, head); ep.scale.set(1, 1.4, 0.6); ep.rotation.z = sd * 0.5; add(new THREE.SphereGeometry(0.025, 6, 5), eyeM, sd * 0.13, 0.06, 0.35, head); });
      add(new THREE.SphereGeometry(0.06, 8, 6), Bk, 0, -0.06, 0.36, head);
      add(new THREE.SphereGeometry(0.16, 10, 8), Wt, 0, -0.07, 0.3, head).scale.set(1, 0.7, 0.8);
      const legs = [];
      [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => { const l = new THREE.Group(); l.position.set(sx * 0.3, 0.5, sz * 0.38); g.add(l); add(new THREE.CylinderGeometry(0.15, 0.14, 0.55, 10), Bk, 0, -0.25, 0, l); l.userData.anim = true; legs.push(l); });
      const stick = add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6), mat(0x7aa04a), 0.15, -0.1, 0.42, head); stick.rotation.set(0.3, 0, 1.2); stick.visible = false;
      const a = i * 1.6, x = CLEAR.x + Math.sin(a) * 6, z = CLEAR.z + Math.cos(a) * 6;
      g.position.set(x, 0, z); g.rotation.y = rnd() * 6; g.userData.dyn = true; G.add(g);
      pandas.push({g, body, head, legs, stick, x, z, yaw:g.rotation.y, tx:x, tz:z, wait:rnd() * 4, sit:0, phase:rnd() * 6});
    }
    C.dynamics.push(() => pandas.map(p => ({x:CX + p.x, z:CZ + p.z, r:0.7})));
  }

  /* ================= LOTUS-KOİ GÖLETİ ve AY KÖPRÜSÜ ================= */
  const koi = {mesh:null, fish:[], feedT:0, feed:null};
  const LOBES = [{x:-105, z:75, rx:16, rz:13}, {x:-75, z:75, rx:16, rz:13}];
  const inPond = (x, z, m = 0) => LOBES.some(l => ((x - l.x) / (l.rx - m)) ** 2 + ((z - l.z) / (l.rz - m)) ** 2 < 1);
  {
    const waterM = mat(0x22504a, {roughness:0.06, metalness:0.15}), bedM = mat(0x1d3328, {roughness:1});
    LOBES.forEach(l => {
      const w = add(new THREE.CircleGeometry(1, 48), waterM, l.x, 0.12, l.z, G, false); w.rotation.x = -Math.PI / 2; w.scale.set(l.rx, l.rz, 1);
      // kenar taşları: öbür lobun içine düşmeyen yay
      const pts = []; const flush = () => { const arr = pts.splice(0); if (arr.length > 2) add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arr), arr.length * 2, 0.5, 6), stoneG, 0, 0, 0); };
      for (let i = 0; i <= 96; i++){ const a = i / 96 * Math.PI * 2, x = l.x + Math.cos(a) * l.rx, z = l.z + Math.sin(a) * l.rz; const other = LOBES.find(o => o !== l); if (((x - other.x) / other.rx) ** 2 + ((z - other.z) / other.rz) ** 2 < 0.98){ flush(); continue; } pts.push(L(x, 0.15, z)); }
      flush();
      // su: hafif çukur zemin değil, çarpışma halkası (köprüde yükseklik bunu aşar)
      for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, o = C.circle(CX + l.x + Math.cos(a) * (l.rx - 3), CZ + l.z + Math.sin(a) * (l.rz - 3), 3.4); o.y0 = -5; o.y1 = 0.5; }
      const o = C.circle(CX + l.x, CZ + l.z, Math.min(l.rx, l.rz) - 3); o.y0 = -5; o.y1 = 0.5;
    });
    // Ay Köprüsü: yarım ay kemerli, sırtı yükselen mermer köprü (suyla birlikte dolunay yapar)
    const BX = -90, BZ = 75, S = 8, H = 4.2, deck = s => 0.2 + H * Math.cos(Math.PI * s / (2 * S));
    const shape = new THREE.Shape(); shape.moveTo(-S, -0.7);
    for (let i = 0; i <= 32; i++){ const s = -S + 2 * S * i / 32; if (i === 0) shape.lineTo(s, deck(s)); else shape.lineTo(s, deck(s)); }
    shape.lineTo(S, -0.7); shape.lineTo(-S, -0.7);
    const hole = new THREE.Path(); for (let i = 0; i <= 32; i++){ const a = i / 32 * Math.PI; const x = Math.cos(a) * 3.3, y = -0.55 + Math.sin(a) * 3.3; if (i === 0) hole.moveTo(x, y); else hole.lineTo(x, y); }
    shape.holes.push(hole);
    const bg = new THREE.ExtrudeGeometry(shape, {depth:2.6, bevelEnabled:false, curveSegments:8}); bg.translate(0, 0, -1.3); bg.rotateY(Math.PI / 2);
    add(bg, marbleW, BX, 0, BZ);
    [-1, 1].forEach(sd => { for (let i = -7; i <= 7; i++){ const s = i; add(new THREE.BoxGeometry(0.16, 0.8, 0.16), marbleW, BX + sd * 1.2, deck(s) + 0.4, BZ - s); } const pts = []; for (let i = -16; i <= 16; i++){ const s = i / 2; pts.push(L(BX + sd * 1.2, deck(s) + 0.82, BZ - s)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 5), marbleW, 0, 0, 0); });
    hfns.push((lx, lz) => Math.abs(lx - BX) < 1.25 && Math.abs(lz - BZ) < S ? deck(lz - BZ) : null);
    // göl kıyısında su köşkü
    const TX = -109, TZ = 95;
    hallC({x:TX, z:TZ, w:5, d:5, h:3.4, base:0.45, roofMat:tileG, rot:Math.PI, lanternsAt:false, collide:false, open:true});
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => cCircle(TX + sx * 2.5, TZ + sz * 2.5, 0.35));
    hfns.push((lx, lz) => Math.abs(lx - TX) < 3.7 && Math.abs(lz - TZ) < 3.7 ? 0.45 : null);
    // lotus yaprakları ve çiçekleri
    const leafG = new THREE.CircleGeometry(1, 14, 0.25, Math.PI * 2 - 0.5); leafG.rotateX(-Math.PI / 2);
    const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.55, side:THREE.DoubleSide}), 90);
    const flowerG = lathe([[0, 0], [0.12, 0.05], [0.22, 0.2], [0.18, 0.32], [0.05, 0.22], [0, 0.2]], 10);
    const flowers = new THREE.InstancedMesh(flowerG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.5}), 26);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    let nl = 0, nf = 0;
    for (let k = 0; k < 600 && (nl < 90 || nf < 26); k++){
      const l = LOBES[k % 2], a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.9, x = l.x + Math.cos(a) * l.rx * rr, z = l.z + Math.sin(a) * l.rz * rr;
      if (Math.abs(x - (-90)) < 4 || !inPond(x, z, 1.5)) continue;
      if (nl < 90){ const k2 = 0.35 + rnd() * 0.5; m4.compose(p.set(x, 0.14, z), q.setFromAxisAngle(L(0, 1, 0), rnd() * 6.3), s.set(k2, 1, k2)); leaves.setMatrixAt(nl, m4); leaves.setColorAt(nl, col.setHSL(0.27 + rnd() * 0.05, 0.5, 0.3 + rnd() * 0.1).convertSRGBToLinear()); nl++; }
      if (nf < 26 && rnd() < 0.3){ const k2 = 0.9 + rnd() * 0.6; m4.compose(p.set(x + 0.2, 0.16, z), q.identity(), s.set(k2, k2, k2)); flowers.setMatrixAt(nf, m4); flowers.setColorAt(nf, col.setHSL(0.92 + rnd() * 0.05, 0.7, 0.75 + rnd() * 0.1).convertSRGBToLinear()); nf++; }
    }
    leaves.count = nl; flowers.count = nf; G.add(leaves, flowers);
    // koi balıkları
    const fishG = (() => { const b = new THREE.SphereGeometry(0.1, 10, 6); b.scale(0.65, 0.45, 1.9); const t = new THREE.ConeGeometry(0.09, 0.18, 6); t.rotateX(-Math.PI / 2); t.scale(1, 0.25, 1); t.translate(0, 0, -0.26); return mergeBufferGeometries([b.toNonIndexed(), t.toNonIndexed()]); })();
    const NK = 34, km = new THREE.InstancedMesh(fishG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.35}), NK);
    const palette = [0xff6a1a, 0xffffff, 0xe8381c, 0xffb21a, 0xf4f0e8];
    for (let i = 0; i < NK; i++){
      const l = i % 2, f = {l, a:rnd() * 6.3, rf:0.3 + rnd() * 0.55, w:(rnd() < 0.5 ? -1 : 1) * (0.12 + rnd() * 0.18), x:0, z:0, yaw:0, k:0.8 + rnd() * 0.6};
      f.x = LOBES[l].x + Math.cos(f.a) * LOBES[l].rx * f.rf; f.z = LOBES[l].z + Math.sin(f.a) * LOBES[l].rz * f.rf; koi.fish.push(f);
      m4.compose(p.set(f.x, 0.135, f.z), q.identity(), s.set(f.k, f.k, f.k)); km.setMatrixAt(i, m4);
      km.setColorAt(i, col.set(palette[i % palette.length]).convertSRGBToLinear());
    }
    km.frustumCulled = false; G.add(km); koi.mesh = km;
    // söğütler
    [[-130, 64], [-124, 92], [-58, 60], [-52, 90], [-96, 55], [-80, 98]].forEach(([x, z]) => willow(x, z));
    road([[0, 100], [-50, 103], [-90, 104], [-122, 108]], 4.5);
  }

  /* ================= TERASLI ÇAY TEPESİ ================= */
  const TEA = {x:-172, z:108, R0:42, tiers:6};
  {
    const ring = 6, earth = mat(0x7a5b3a, {roughness:1}), teaTop = mat(0x6f8a3e, {roughness:0.95});
    for (let k = 0; k < TEA.tiers; k++){
      const r = TEA.R0 - k * ring;
      add(new THREE.CylinderGeometry(r, r + 0.4, 1.0, 64), k % 2 ? stoneG : earth, TEA.x, k + 0.5, TEA.z);
      const top = add(new THREE.CircleGeometry(r, 64), teaTop, TEA.x, k + 1.01, TEA.z, G, false); top.rotation.x = -Math.PI / 2;
    }
    const stairW = 3.6, topR = TEA.R0 - (TEA.tiers - 1) * ring;
    const stairH = (lx) => TEA.tiers * Math.min(1, Math.max(0, (TEA.x + TEA.R0 + 6 - lx) / (TEA.R0 + 6 - topR)));
    hfns.push((lx, lz) => {
      const r = Math.hypot(lx - TEA.x, lz - TEA.z); let h = null;
      if (r < TEA.R0) h = Math.min(TEA.tiers, Math.floor((TEA.R0 - r) / ring) + 1);
      if (Math.abs(lz - TEA.z) < stairW / 2 && lx > TEA.x + topR - 1 && lx < TEA.x + TEA.R0 + 6) h = Math.max(h ?? 0, stairH(lx));
      return h;
    });
    // doğu yüzünde taş merdiven
    for (let lx = TEA.x + topR; lx < TEA.x + TEA.R0 + 6; lx += 0.9){ const h = stairH(lx + 0.45); add(new THREE.BoxGeometry(0.92, h, stairW), stoneG, lx + 0.45, h / 2, TEA.z); }
    // çay çalıları
    const bushG = new THREE.SphereGeometry(0.6, 8, 6); bushG.scale(1, 0.62, 1);
    const bushes = new THREE.InstancedMesh(bushG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), 900);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    let n = 0;
    for (let k = 0; k < TEA.tiers - 1; k++){
      const rr = TEA.R0 - k * ring - 3, cnt = Math.floor(rr * Math.PI * 2 / 1.25);
      for (let i = 0; i < cnt && n < 900; i++){
        const a = i / cnt * Math.PI * 2, x = TEA.x + Math.sin(a) * rr, z = TEA.z + Math.cos(a) * rr;
        if (Math.abs(z - TEA.z) < 3 && x > TEA.x) continue;
        const k2 = 0.9 + rnd() * 0.25; m4.compose(p.set(x, k + 1.25, z), q.identity(), s.set(k2, k2, k2)); bushes.setMatrixAt(n, m4);
        bushes.setColorAt(n, col.setHSL(0.26 + rnd() * 0.04, 0.5, 0.24 + rnd() * 0.07).convertSRGBToLinear()); n++;
      }
    }
    bushes.count = n; bushes.castShadow = true; G.add(bushes);
    // tepede altıgen çay köşkü
    const ty = TEA.tiers;
    const pav = new THREE.Group(); pav.position.set(TEA.x, ty, TEA.z); G.add(pav);
    add(new THREE.CylinderGeometry(4.4, 4.6, 0.4, 6), marbleW, 0, 0.2, 0, pav);
    for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; add(new THREE.CylinderGeometry(0.18, 0.2, 3.4, 10), red, Math.sin(a) * 3.8, 2.1, Math.cos(a) * 3.8, pav); cCircle(TEA.x + Math.sin(a) * 3.8, TEA.z + Math.cos(a) * 3.8, 0.3); }
    add(new THREE.CylinderGeometry(4.0, 4.0, 0.6, 6), bandMat, 0, 4.1, 0, pav);
    roof(pav, {type:'poly', n:6, R:5.6, rTop:0}, 3.2, tileG, 4.4, {lift:0.9, seg:6, rings:8});
    add(new THREE.SphereGeometry(0.3, 10, 8), gold, 0, 7.8, 0, pav);
    add(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 18), woodD, 0, 1.05, 0, pav); add(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 10), woodD, 0, 0.7, 0, pav);
    add(lathe([[0, 0], [0.12, 0], [0.15, 0.1], [0.12, 0.18], [0.04, 0.22], [0, 0.22]], 12), mat(0x7a3b22, {roughness:0.3}), 0, 1.09, 0, pav);
    for (let i = 0; i < 4; i++){ const a = i / 4 * Math.PI * 2 + 0.4; add(new THREE.CylinderGeometry(0.035, 0.03, 0.05, 10), mat(0xf4f1ea, {roughness:0.2}), Math.sin(a) * 0.4, 1.11, Math.cos(a) * 0.4, pav); }
    hfns.push((lx, lz) => Math.hypot(lx - TEA.x, lz - TEA.z) < 4.5 ? ty + 0.4 : null);
    // fermantasyon evi (tepenin güneydoğu eteğinde)
    hallC({x:-126, z:136, w:12, d:8, h:4, rot:Math.PI, roofMat:tileGray});
    for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), mat(0x5a3a22, {roughness:0.8}), -133 + i * 1.1, 0.9 + (i % 2) * 0.14, 128.6);
    add(new THREE.BoxGeometry(7, 0.8, 1.2), woodL, -130, 0.4, 128.6); cBox(-130, 128.6, 3.5, 0.6);
    road([[-122, 108], [TEA.x + TEA.R0 + 6, TEA.z], [-126, 130]], 4);
  }

  /* ================= ZANAAT ÇARŞISI ================= */
  const vaseMat = (() => {
    const [c, g] = canvas(256, 128); g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#1f3f9a'; g.lineWidth = 3; g.fillStyle = '#2a4caf';
    g.fillRect(0, 8, 256, 6); g.fillRect(0, 114, 256, 6);
    for (let x = 0; x < 256; x += 32){ g.beginPath(); g.moveTo(x, 64); g.bezierCurveTo(x + 8, 30, x + 24, 98, x + 32, 64); g.stroke(); g.beginPath(); g.arc(x + 16, 64, 7, 0, Math.PI * 2); g.fill(); }
    for (let x = 0; x < 256; x += 16){ g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 8, 32); g.lineTo(x + 16, 20); g.stroke(); }
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.12, metalness:0.05});
  })();
  function vase(lx, y, lz, k = 1, type = 0){
    const prof = [[[0, 0], [0.18, 0], [0.24, 0.12], [0.32, 0.45], [0.28, 0.72], [0.12, 0.86], [0.1, 1.0], [0.14, 1.06]], [[0, 0], [0.14, 0], [0.26, 0.2], [0.28, 0.5], [0.18, 0.7], [0.08, 0.8], [0.08, 1.1], [0.12, 1.15]], [[0, 0], [0.22, 0], [0.3, 0.15], [0.32, 0.35], [0.25, 0.42]]][type % 3];
    add(lathe(prof, 18), vaseMat, lx, y, lz).scale.setScalar(k);
  }
  function carpetMat(kind){
    const [c, g] = canvas(256, 384);
    g.fillStyle = kind === 0 ? '#8c1c1c' : kind === 1 ? '#1d3a6e' : '#d4b04a'; g.fillRect(0, 0, 256, 384);
    g.strokeStyle = '#e8d7a8'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 356); g.lineWidth = 3; g.strokeRect(30, 30, 196, 324);
    g.fillStyle = kind === 2 ? '#1d3a6e' : '#e8c15a';
    for (let i = 0; i < 14; i++){ g.beginPath(); g.arc(22 + (i % 2) * 212, 30 + i * 25, 5, 0, Math.PI * 2); g.fill(); }
    g.save(); g.translate(128, 192);
    if (kind === 1){ for (let i = 0; i < 8; i++){ g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, -40, 16, 40, 0, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#8c1c1c'; g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.fill(); }
    else { g.lineWidth = 9; g.strokeStyle = kind === 2 ? '#1d3a6e' : '#e8c15a'; [-1, 1].forEach(sd => { g.beginPath(); for (let t = 0; t < 1; t += 0.02) g.lineTo(sd * (70 - t * 60) * Math.cos(t * 6), sd * (-120 + t * 110) + Math.sin(t * 9) * 12); g.stroke(); }); g.beginPath(); g.arc(0, 0, 16, 0, Math.PI * 2); g.fill(); }
    g.restore();
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.95, side:THREE.DoubleSide});
  }
  {
    const SX = 62, WX = 84;
    road([[5, 62], [SX, 62], [SX, 196]], 6); road([[5, 142], [SX, 142]], 4);
    for (let z = 70; z <= 190; z += 20) lanternPost(SX - 4, z);
    const shop = (z, name, hanzi, roofMat) => {
      const g = hallC({x:WX, z, w:15, d:9, h:4.2, rot:-Math.PI / 2, roofMat, lift:0.9});
      const p = plaque(hanzi, 2.8, 1.0); p.position.set(0, 4.0, 4.5 + 0.9); g.add(p);
      return g;
    };
    // porselen: mavi-beyaz vazolar, kurutma rafları ve tepeye tırmanan ejderha fırını
    shop(62, 'Porselen', '景德瓷坊', tileB);
    add(new THREE.BoxGeometry(1.4, 0.8, 6), woodL, 72, 0.4, 70); cBox(72, 70, 0.7, 3);
    for (let i = 0; i < 5; i++) vase(72, 0.8, 67.6 + i * 1.2, 0.8 + (i % 2) * 0.25, i);
    [-1, 1].forEach(sd => { vase(78, 0, 62 + sd * 5.6, 1.9, 1); cCircle(78, 62 + sd * 5.6, 0.6); });
    for (let i = 0; i < 8; i++){
      const x = 100 + i * 4.4, y = gy(x, 52) + i * 0.4;
      const ch = new THREE.CylinderGeometry(2.3, 2.3, 4.6, 14, 1, false, 0, Math.PI); ch.rotateZ(Math.PI / 2);
      add(ch, mat(0x8a5a3c, {roughness:0.95}), x, y, 52); add(new THREE.CircleGeometry(0.5, 10), black, x, y + 0.8, 54.32, G, false);
    }
    add(new THREE.CylinderGeometry(0.9, 1.2, 7, 10), mat(0x7a4a32, {roughness:0.95}), 137, gy(137, 52) + 5.5, 52);
    cBox(116, 52, 18.5, 2.4);
    // ipek: dut ağaçları, renk renk kuruyan ipekler ve dokuma tezgâhı
    shop(102, 'İpek', '蘇氏絲坊', tileGray);
    [[104, 92], [110, 102], [104, 114], [118, 90], [120, 112], [126, 100]].forEach(([x, z]) => mulberry(x, z));
    const silkCols = [0xc8102e, 0xe8b82a, 0x2a6ac8, 0x2f9a6a, 0xe0457a, 0x7a3ab8];
    for (let i = 0; i < 6; i++){
      const x = 70 + (i % 3) * 3.2, z = 92 + Math.floor(i / 3) * 18;
      [-1, 1].forEach(sd => { add(new THREE.CylinderGeometry(0.05, 0.05, 3, 6), woodD, x + sd * 1.3, 1.5, z); cCircle(x + sd * 1.3, z, 0.15); });
      add(new THREE.CylinderGeometry(0.03, 0.03, 2.7, 6), woodD, x, 2.95, z).rotation.z = Math.PI / 2;
      const silk = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.2), new THREE.MeshStandardMaterial({color:silkCols[i], roughness:0.35, metalness:0.1, side:THREE.DoubleSide}));
      silk.geometry.translate(0, -1.1, 0);
      silk.position.set(x, 2.95, z); silk.userData.keep = true; silk.castShadow = true; G.add(silk);
      flutter.push({m:silk, axis:'x', ph:i * 1.3, k:0.22});
    }
    // halı: askıda ejderha ve lotus desenli halılar, dikey tezgâh
    shop(142, 'Halı', '張氏地毯', tileGray);
    for (let i = 0; i < 3; i++){
      const z = 134 + i * 7, x = 70;
      [-1, 1].forEach(sd => { add(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 6), woodD, x, 1.8, z + sd * 1.6); cCircle(x, z + sd * 1.6, 0.15); });
      add(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 6), woodD, x, 3.55, z).rotation.x = Math.PI / 2;
      const cp = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.2), carpetMat(i)); cp.position.set(x, 1.95, z); cp.rotation.y = -Math.PI / 2; cp.userData.keep = true; cp.castShadow = true; G.add(cp);
    }
    { const lx = 100, lz = 142; add(new THREE.BoxGeometry(0.2, 3.4, 0.2), woodD, lx, 1.7, lz - 1.8); add(new THREE.BoxGeometry(0.2, 3.4, 0.2), woodD, lx, 1.7, lz + 1.8); add(new THREE.BoxGeometry(0.2, 0.2, 3.8), woodD, lx, 3.3, lz); const w = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.2), carpetMat(1)); w.position.set(lx, 2.0, lz); w.rotation.y = Math.PI / 2; w.userData.keep = true; G.add(w); cBox(lx, lz, 0.4, 2); }
    // yeşim: kaide üstünde yeşim ejderha, bi diskleri ve mühür
    shop(182, 'Yeşim', '金石玉作', tileG);
    { const x = 70, z = 186; add(new THREE.BoxGeometry(1.8, 1.0, 1.8), marbleW, x, 0.5, z); cBox(x, z, 0.9, 0.9);
      const pts = []; for (let i = 0; i <= 24; i++){ const t = i / 24; pts.push(L(x + Math.sin(t * 9) * 0.45, 1.1 + t * 1.6, z + Math.cos(t * 9) * 0.45)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.13, 8), jadeM, 0, 0, 0);
      add(new THREE.SphereGeometry(0.22, 12, 10), jadeM, x + Math.sin(9) * 0.45, 2.78, z + Math.cos(9) * 0.45).scale.set(1, 0.8, 1.5);
      [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.5, 1.1, 0.5), woodD, x, 0.55, z + sd * 3); const bi = add(new THREE.TorusGeometry(0.32, 0.16, 8, 20), jadeM, x, 1.5, z + sd * 3); bi.rotation.y = Math.PI / 2; cCircle(x, z + sd * 3, 0.35); }); }
  }

  /* ================= EJDERHA TERASI ================= */
  const DT = {x:-80, z:-205};
  {
    const [c, g] = canvas(512, 512); g.fillStyle = '#c9c2b2'; g.fillRect(0, 0, 512, 512);
    g.translate(256, 256);
    for (let r = 60; r < 256; r += 34){ g.strokeStyle = r % 68 ? '#8a7a5a' : '#9c2219'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#1f6a4a'; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath(); for (let t = 0; t < 1; t += 0.01){ const a = t * Math.PI * 3.4, r = 200 - t * 150; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke();
    g.fillStyle = '#d4af37'; g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fill();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(10.6, 48), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.8})); disc.rotation.x = -Math.PI / 2; disc.position.set(DT.x, 0.52, DT.z); disc.userData.keep = true; G.add(disc);
    add(new THREE.CylinderGeometry(11, 11.4, 0.5, 48), marbleW, DT.x, 0.25, DT.z);
    hfns.push((lx, lz) => Math.hypot(lx - DT.x, lz - DT.z) < 11 ? 0.5 : null);
    for (let i = 0; i < 4; i++){
      const a = i / 4 * Math.PI * 2 + Math.PI / 4, x = DT.x + Math.sin(a) * 10, z = DT.z + Math.cos(a) * 10;
      add(new THREE.CylinderGeometry(0.3, 0.35, 8, 10), red, x, 4.4, z); add(new THREE.SphereGeometry(0.4, 10, 8), gold, x, 8.6, z); cCircle(x, z, 0.4);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 4.5), new THREE.MeshStandardMaterial({color:i % 2 ? 0xd4af37 : 0xb3121e, side:THREE.DoubleSide, roughness:0.6}));
      flag.geometry.translate(0.65, -2.4, 0); flag.position.set(x, 8.2, z); flag.rotation.y = a; flag.userData.keep = true; G.add(flag);
      flutter.push({m:flag, axis:'y', base:a, ph:i * 2.1, k:0.35});
    }
    // Pyra'yı çağıran gong
    const GX = DT.x + 6.5, GZ = DT.z + 6.5;
    [-1, 1].forEach(sd => add(new THREE.CylinderGeometry(0.12, 0.14, 3.4, 8), woodD, GX + sd * 1.3, 0.5 + 1.7, GZ));
    add(new THREE.BoxGeometry(3.2, 0.25, 0.25), woodD, GX, 0.5 + 3.35, GZ);
    const gong = add(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 32), mat(0x9a7a3a, {metalness:0.9, roughness:0.3}), GX, 0.5 + 2.2, GZ); gong.rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(1.0, 0.06, 8, 32), bronze, GX, 0.5 + 2.2, GZ);
    cBox(GX, GZ, 1.5, 0.3);
    act(GX, GZ + 1.6, 'Gonga vur: Pyra\'yı çağır', () => { sfx('gong'); hooks.callPyra({x:CX + DT.x, z:CZ + DT.z - 2, yaw:HARBOR_A}); }, 2.8);
    road([[DT.x, DT.z + 11], [-40, -160], [-8, -136], [0, -136]], 5);
  }

  /* ================= YÜZEN PAZAR ve EJDERHA KAYIKLARI ================= */
  const sampans = [], dboats = [];
  const race = {on:false, t:0, drumT:0, done:false};
  {
    const [hx, hz] = HARBOR_L;
    const tan = [Math.cos(HARBOR_A), -Math.sin(HARBOR_A)];       // kıyıya teğet
    const out = [Math.sin(HARBOR_A), Math.cos(HARBOR_A)];        // denize doğru
    road([[DT.x, DT.z], [hx + tan[0] * 4 - out[0] * 4, hz + tan[1] * 4 - out[1] * 4]], 5);
    // kıyıda fener dizileri
    for (let i = -2; i < 2; i++) lanternString(hx + tan[0] * i * 11 - out[0] * 2, hz + tan[1] * i * 11 - out[1] * 2, hx + tan[0] * (i + 1) * 11 - out[0] * 2, hz + tan[1] * (i + 1) * 11 - out[1] * 2);
    // kayıklar
    const goodsCol = [0xff8a1a, 0xe03a3a, 0xf6f4ee, 0x2a6ac8, 0x7ab84a, 0xe8c15a];
    for (let i = 0; i < 9; i++){
      const sd = i < 5 ? -1 : 1, k = i < 5 ? i : i - 5;
      const along = sd * (12 + k * 7), off = 23 + (k % 2) * 6;
      const x = hx + tan[0] * along + out[0] * off, z = hz + tan[1] * along + out[1] * off;
      const g = new THREE.Group(); g.position.set(x, -0.22, z); g.rotation.y = Math.atan2(tan[0], tan[1]) + (rnd() - 0.5) * 0.3; g.userData.dyn = true; G.add(g);
      const hull = add(lathe([[0, -2.6], [0.55, -2.0], [0.8, 0], [0.55, 2.0], [0, 2.7]].map(([r, y]) => [r, y]), 10), woodD, 0, 0.25, 0, g); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.45);
      add(new THREE.BoxGeometry(1.3, 0.06, 4.2), woodL, 0, 0.5, 0, g);
      const can = new THREE.CylinderGeometry(0.75, 0.75, 1.8, 12, 1, true, -Math.PI / 2, Math.PI); can.rotateX(Math.PI / 2); add(can, bamboo, 0, 0.75, -0.6, g);
      for (let j = 0; j < 5; j++) add(new THREE.SphereGeometry(0.14 + rnd() * 0.08, 8, 6), mat(goodsCol[(i + j) % goodsCol.length], {roughness:0.6}), (rnd() - 0.5) * 0.7, 0.62, 0.6 + rnd() * 1.1, g);
      const v = figure({robe:[0x3a5a7a, 0x6a4a2a, 0x2f6a5a][i % 3], trim:0xf4f1ea, hat:'hasir'}); v.scale.setScalar(0.9); v.position.set(0, 0.3, -0.4); g.add(v);
      lanterns.push([x, 1.6, z, 0.5]);
      sampans.push({g, y0:-0.22, ph:rnd() * 6});
    }
    // ejderha kayıkları (iskelenin öbür yanında, yarışa hazır)
    const dragonHead = (g, len, colr) => {
      const pts = [L(0, 0.6, len / 2 - 0.4), L(0, 1.4, len / 2 + 0.2), L(0, 2.0, len / 2 + 0.4)];
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.22, 8), colr, 0, 0, 0, g);
      add(new THREE.BoxGeometry(0.5, 0.42, 0.9), colr, 0, 2.1, len / 2 + 0.75, g);
      const jaw = add(new THREE.BoxGeometry(0.42, 0.12, 0.7), mat(0xc8102e), 0, 1.8, len / 2 + 0.8, g); jaw.rotation.x = 0.35;
      [-1, 1].forEach(sd => { const h = add(new THREE.ConeGeometry(0.06, 0.6, 6), gold, sd * 0.18, 2.55, len / 2 + 0.5, g); h.rotation.x = -0.6; add(new THREE.SphereGeometry(0.07, 8, 6), mat(0xffd84a), sd * 0.23, 2.22, len / 2 + 0.95, g); });
      const tail = [L(0, 0.6, -len / 2 + 0.3), L(0, 1.2, -len / 2 - 0.3), L(0, 1.9, -len / 2 - 0.2), L(0, 2.1, -len / 2 + 0.2)];
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tail), 10, 0.12, 6), colr, 0, 0, 0, g);
    };
    [0x2f8a4a, 0xc8102e, 0xd4a020].forEach((hex, i) => {
      const len = 11, along = 22 + i * 4.5, off = 27 + i * 5;
      const x = hx - tan[0] * along + out[0] * off, z = hz - tan[1] * along + out[1] * off, yaw = Math.atan2(-tan[0], -tan[1]);
      const g = new THREE.Group(); g.position.set(x, -0.22, z); g.rotation.y = yaw; g.userData.dyn = true; G.add(g);
      const cm = mat(hex, {roughness:0.45});
      const hull = add(lathe([[0, -len / 2], [0.5, -len / 2 + 1.5], [0.62, 0], [0.5, len / 2 - 1.5], [0, len / 2]], 10), cm, 0, 0.3, 0, g); hull.rotation.x = Math.PI / 2; hull.scale.set(1, 1, 0.5);
      add(new THREE.BoxGeometry(1.0, 0.05, len - 2), woodL, 0, 0.6, 0, g);
      dragonHead(g, len, cm);
      const oars = new THREE.Group(); oars.userData.anim = true; g.add(oars);
      const rowers = [];
      for (let j = 0; j < 5; j++) [-1, 1].forEach(sd => {
        const zz = -3 + j * 1.4, f = new THREE.Group(); f.position.set(sd * 0.3, 0.62, zz); oars.add(f);
        add(new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8), mat(0xf4f1ea), 0, 0.28, 0, f); add(new THREE.SphereGeometry(0.1, 8, 6), mat(0xdcb48e), 0, 0.65, 0, f);
        add(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 10), mat(0xc8102e), 0, 0.76, 0, f);
        const oar = new THREE.Group(); oar.position.set(sd * 0.28, 0.35, 0); f.add(oar);
        const o = add(new THREE.CylinderGeometry(0.025, 0.025, 1.7, 5), woodL, sd * 0.55, -0.4, 0, oar); o.rotation.z = sd * 0.9;
        rowers.push({oar, sd});
      });
      add(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 14), mat(0xc8102e), 0, 0.85, 3.2, g);
      dboats.push({g, x, z, yaw, rowers, speed:0, home:[x, z], lane:i, pos:0});
    });
    race.dir = [-tan[0], -tan[1]];
    // tüccar ve kayıkçı
    person(hx - out[0] * 3 + tan[0] * 6, hz - out[1] * 3 + tan[1] * 6, HARBOR_A, 'Tüccar Hóng Fā', {robe:0x7a2a1a, trim:0xe8c15a, hat:'bilgin'}, () => market());
    person(hx - out[0] * 3 - tan[0] * 14, hz - out[1] * 3 - tan[1] * 14, HARBOR_A, 'Kayıkçı Lóng Bō', {robe:0x2a4a6a, trim:0xc8102e, hat:'hasir'}, () => festival());
  }

  /* ================= KARST KULELERİ (denizde ve doğu kıyısında) ================= */
  {
    const peakMat = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.95, flatShading:true});
    const peak = (wx, wz, h, r, inSea) => {
      const prof = []; for (let i = 0; i <= 10; i++){ const t = i / 10; prof.push(new THREE.Vector2(r * (0.62 + 0.38 * Math.sin(t * Math.PI * 0.9 + 0.2)) * (1 - Math.pow(t, 3) * 0.7) + (rnd() - 0.5) * r * 0.08, t * h)); }
      prof.push(new THREE.Vector2(0, h + r * 0.15));
      const g = new THREE.LatheGeometry(prof, 11).toNonIndexed(), p = g.attributes.position, colA = [], c = new THREE.Color();
      for (let i = 0; i < p.count; i++){ const y = p.getY(i) / h, n = Math.sin(p.getX(i) * 0.7) * Math.cos(p.getZ(i) * 0.6); const green = y > 0.25 && n > -0.3 - y * 0.6; c.set(green ? 0x3f6a3a : 0x8a8a80).convertSRGBToLinear(); if (!green) c.multiplyScalar(0.8 + y * 0.3); colA.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, peakMat); m.position.set(wx - CX, inSea ? -6 : 0, wz - CZ); m.rotation.y = rnd() * 6; m.castShadow = m.receiveShadow = true; m.userData.keep = true; G.add(m);
      C.circle(wx, wz, r * 0.85);
    };
    [[0.55, 70, 70, 26], [0.8, 140, 95, 34], [1.0, 60, 55, 22], [1.25, 120, 80, 30], [1.5, 75, 60, 24], [1.8, 150, 100, 36], [2.1, 90, 70, 26], [0.25, 110, 58, 22], [2.45, 70, 52, 20]].forEach(([a, d, h, r]) => { const [x, z] = CHINA_COAST.point(a, d); peak(x, z, h, r, true); });
    [[1.15, -40, 34, 14], [1.75, -45, 40, 15]].forEach(([a, d, h, r]) => { const [x, z] = CHINA_COAST.point(a, d); peak(x, z, h, r, false); });
  }

  /* ================= AĞAÇLAR: çam, erik çiçeği, söğüt ================= */
  function willow(lx, lz){ trees.willow.push([lx, lz]); cCircle(lx, lz, 0.5); }
  function mulberry(lx, lz){ trees.bloom.push([lx, lz, 0x5f8f3a]); cCircle(lx, lz, 0.45); }
  {
    const busy = (x, z) =>
      (x > -66 && x < 66 && z > -136 && z < 52) || (Math.abs(x) < 16 && z > 40 && z < 206) || (x > 45 && x < 140 && z > 40 && z < 200) ||
      inPond(x, z, -8) || Math.hypot(x - TEA.x, z - TEA.z) < TEA.R0 + 8 || Math.hypot(x - BAM.x, z - BAM.z) < BAM.r + 4 ||
      Math.hypot(x - DT.x, z - DT.z) < 22 || (x > 25 && x < 125 && z > -195 && z < -100) || Math.abs(x - ridgeX(z)) < 14 ||
      Math.hypot(x - HARBOR_L[0], z - HARBOR_L[1]) < 40 || (x > -140 && x < -110 && z > 120 && z < 150);
    for (let k = 0; k < 2400 && trees.pine.length + trees.bloom.length < 330; k++){
      const x = (rnd() - 0.5) * 600, z = (rnd() - 0.5) * 600;
      if (inland(x, z) < 26 || busy(x, z)) continue;
      if (rnd() < 0.72){ trees.pine.push([x, z]); cCircle(x, z, 0.5); } else { trees.bloom.push([x, z, rnd() < 0.5 ? 0xf2a6c0 : 0xf6e0ea]); cCircle(x, z, 0.45); }
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    const trunkG = new THREE.CylinderGeometry(0.16, 0.3, 1, 7); trunkG.translate(0, 0.5, 0);
    const trunkM = mat(0x4a3424, {roughness:0.9});
    const total = trees.pine.length + trees.bloom.length + trees.willow.length;
    const trunks = new THREE.InstancedMesh(trunkG, trunkM, total);
    // çam: yatay katmanlı yassı tepe
    const pineG = mergeBufferGeometries([[0, 0, 0, 2.6], [0.6, 1.3, 0.3, 2.0], [-0.4, 2.4, -0.2, 1.4]].map(([x, y, z, r]) => { const g = new THREE.SphereGeometry(r, 9, 6); g.scale(1, 0.32, 1); g.translate(x, y, z); return g.toNonIndexed(); }));
    const pines = new THREE.InstancedMesh(pineG, world.windMat(new THREE.MeshLambertMaterial({color:0xffffff}), 0.7, true), trees.pine.length);
    const bloomG = mergeBufferGeometries([[0, 0, 0, 1.9], [1.0, -0.3, 0.4, 1.3], [-0.9, -0.2, -0.3, 1.4], [0.2, 0.9, -0.4, 1.2]].map(([x, y, z, r]) => { const g = new THREE.IcosahedronGeometry(r, 1); g.translate(x, y, z); return g; }));
    const blooms = new THREE.InstancedMesh(bloomG, world.windMat(new THREE.MeshLambertMaterial({color:0xffffff}), 0.8, true), trees.bloom.length);
    const willowG = (() => { const parts = []; for (let i = 0; i < 14; i++){ const a = i / 14 * Math.PI * 2, g = new THREE.CylinderGeometry(0.9, 0.15, 4.2, 5, 1, true); g.translate(Math.sin(a) * 1.6, -2.1, Math.cos(a) * 1.6); parts.push(g.toNonIndexed()); } const top = new THREE.SphereGeometry(2.4, 10, 6); top.scale(1, 0.45, 1); parts.push(top.toNonIndexed()); return mergeBufferGeometries(parts); })();
    const willows = new THREE.InstancedMesh(willowG, world.windMat(new THREE.MeshLambertMaterial({color:0xffffff, side:THREE.DoubleSide}), 1.0, true), trees.willow.length);
    let n = 0;
    const put = (x, z, h, lean) => { const y = gy(x, z); e.set(lean[0], rnd() * 6.3, lean[1]); m4.compose(p.set(x, y - 0.1, z), q.setFromEuler(e), s.set(1, h, 1)); trunks.setMatrixAt(n++, m4); return y; };
    trees.pine.forEach(([x, z], i) => {
      const h = 4 + rnd() * 3, lean = [(rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25], y = put(x, z, h, lean), k = 0.8 + rnd() * 0.5;
      m4.compose(p.set(x + lean[1] * -h * 0.5, y + h, z + lean[0] * h * 0.5), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s.set(k, k, k)); pines.setMatrixAt(i, m4);
      pines.setColorAt(i, col.setHSL(0.3 + rnd() * 0.05, 0.4, 0.18 + rnd() * 0.06).convertSRGBToLinear());
    });
    trees.bloom.forEach(([x, z, c2], i) => {
      const h = 2.2 + rnd() * 1.4, y = put(x, z, h, [(rnd() - 0.5) * 0.15, (rnd() - 0.5) * 0.15]), k = 0.8 + rnd() * 0.4;
      m4.compose(p.set(x, y + h + 0.9, z), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s.set(k, k, k)); blooms.setMatrixAt(i, m4);
      blooms.setColorAt(i, col.set(c2).offsetHSL(0, 0, (rnd() - 0.5) * 0.06).convertSRGBToLinear());
    });
    trees.willow.forEach(([x, z], i) => {
      const y = put(x, z, 5.2, [0, 0]);
      m4.compose(p.set(x, y + 5.4, z), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s.set(1, 1, 1)); willows.setMatrixAt(i, m4);
      willows.setColorAt(i, col.setHSL(0.22, 0.45, 0.38).convertSRGBToLinear());
    });
    [trunks, pines, blooms, willows].forEach(m => { m.castShadow = true; m.receiveShadow = true; G.add(m); });
  }

  /* ================= fenerler (tek örnekli ağ; gece parlar) ================= */
  const lanternMat = new THREE.MeshBasicMaterial({color:0xffffff, toneMapped:false});
  const lanternMesh = (() => {
    const body = new THREE.SphereGeometry(0.3, 12, 8); body.scale(1, 1.2, 1);
    const im = new THREE.InstancedMesh(body, lanternMat, lanterns.length);
    const capG = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), tasselG = new THREE.CylinderGeometry(0.03, 0.05, 0.35, 6);
    const caps = new THREE.InstancedMesh(mergeBufferGeometries([capG.clone().translate(0, 0.38, 0).toNonIndexed(), capG.clone().translate(0, -0.38, 0).toNonIndexed(), tasselG.translate(0, -0.6, 0).toNonIndexed()]), gold, lanterns.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    lanterns.forEach(([x, y, z, k], i) => { m4.compose(p.set(x, y, z), q, s.set(k, k, k)); im.setMatrixAt(i, m4); caps.setMatrixAt(i, m4); });
    G.add(im, caps); return im;
  })();

  /* ================= kişiler ve oyun ================= */
  const now = () => hooks.getS().elapsed || 0;
  const cool = {};
  const ready = (key, secs, busyText) => { if ((cool[key] || 0) > now()){ if (busyText) ui.toast(busyText, 2200); return false; } cool[key] = now() + secs; return true; };
  const rankOf = p => { let k = 0; RANKS.forEach(([v], i) => { if (p >= v) k = i; }); return k; };
  const mult = () => 1 + Math.min(2, st().culture / 60);
  function gain({prestige = 0, culture = 0, why = ''}){
    const s = st();
    s.prestige += prestige; s.culture += culture;
    const parts = []; if (prestige) parts.push('+' + prestige + ' prestij'); if (culture) parts.push('+' + culture + ' kültür');
    if (parts.length) ui.toast((why ? why + ' · ' : '') + parts.join(', '), 2600);
    const r = rankOf(s.prestige);
    if (r > s.rank){ s.rank = r; setTimeout(() => { sfx('quest'); ui.toast('Yeni unvan: ' + RANKS[r][1] + ' 🐉', 3600); }, 2400);
      if (r === RANKS.length - 1 && !s.seal){ s.seal = true; setTimeout(() => ui.dialog([{name:'Bakan Wáng Ān', text:'Ejderha Tahtı, iki sarayın dostluğunu onurlandırıyor. Bu Yeşim Ejderha Mührü artık senin: Lumière ile Yùlóng\'un ebedî dostluğunun nişanı.'}]), 4200); } }
    hooks.save();
  }
  const shuffle = arr => { const order = arr.map((_, i) => i); for (let i = order.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } return order; };
  // sırayla usul sorusu sor; doğru cevap sayısını döndür (iptal: -1)
  async function quiz(name, steps){
    let right = 0;
    for (const [qText, opts] of steps){
      const order = shuffle(opts), c = await ui.dialog([{name, text:qText, choices:order.map(i => opts[i])}]);
      if (c < 0) return -1;
      if (order[c] === 0){ right++; sfx('blip'); } else sfx('wrong');
    }
    return right;
  }
  async function craft(key){
    const C2 = CRAFTS[key], s = st();
    const first = !s['met_' + key];
    const c = await ui.dialog([
      ...(first ? [{name:C2.master, text:C2.chain}] : []),
      {name:C2.master, text:'Elimizde ' + s.goods[key].length + ' ' + GOODS[key].name + ' var. Bugün birlikte çalışalım mı?', choices:['Üretime başla', 'Üretim zincirini anlat', 'Sonra']},
    ]);
    s['met_' + key] = true;
    if (c === 1){ await say(C2.master, C2.chain); return; }
    if (c !== 0) return;
    if (!ready('craft_' + key, 40, C2.master + ': Fırın / tezgâh dinleniyor, biraz sonra gel.')) return;
    const right = await quiz(C2.master, C2.steps);
    if (right < 0) return;
    const q = right >= 3 ? 3 : right === 2 ? 2 : 1;
    s.goods[key].push(q); sfx('coin');
    await say(C2.master, q === 3 ? 'Kusursuz! Bu ' + GOODS[key].name + ' İmparatorluk kalitesinde; sarayın en seçkin hazineleri arasına girer.' : q === 2 ? 'İyi iş. İnce kalitede bir ' + GOODS[key].name + ' oldu.' : 'Usul eksik kaldı; sıradan bir ' + GOODS[key].name + ' çıktı. Bir dahakine ustanın sözünü dinle.');
    gain({culture:q, why:QUALITY[q] + ' ' + GOODS[key].name});
  }
  function goodsLine(){
    const s = st();
    return Object.keys(GOODS).map(k => GOODS[k].name + ' ' + s.goods[k].length).join(' · ') + '. Fransız malları: şarap ' + s.french.sarap + ', parfüm ' + s.french.parfum + '.';
  }
  async function minister(){
    const s = st(), name = 'Bakan Wáng Ān';
    if (!s.met){
      s.met = true;
      await ui.dialog([
        {name, text:'Uzak Lumière\'den ejderhayla gelen konuk! Göğün Oğlu adına Yùlóng Adası\'na hoş geldin.'},
        {name, text:'Burada zanaat, sabır ve dengeyle yaşarız. Atölyelerimiz porselen, ipek, halı, yeşim ve çay üretir; ustaların usulünü bilen, en ince hazineyi çıkarır.'},
        {name, text:'Ejderhan Pyra her gelişinde Lumière mahzenlerinden şarap ve parfüm getirir. Onları bana getir, Çin hazineleriyle takas edelim: iki saray da prestij kazanır.'},
        {name, text:'Tapınağın çanı, çay seremonisi, koi ve pandalar, Sed\'in işaret ateşleri ve ejderha kayığı şenliği ruhu besler: kültür puanın arttıkça takaslar daha değerli olur.'},
      ]);
      hooks.save();
    }
    for (;;){
      const c = await ui.dialog([{name, text:'Unvanın: ' + RANKS[s.rank][1] + '. Prestij ' + s.prestige + ' · Kültür ' + s.culture + ' (takas çarpanı ×' + mult().toFixed(2).replace('.', ',') + ').', choices:['İpek Yolu takas defteri', 'Ambar ve hazine', 'Ada hakkında', 'Hoşça kalın']}]);
      if (c === 0){
        const choices = DEALS.map(d => d.name + ' (' + s.french[d.fr] + ' / ' + s.goods[d.cn].length + ')').concat(['Geri']);
        const k = await ui.dialog([{name, text:'Hangi takası yapalım? (parantezde: Fransız malı / Çin hazinesi)', choices}]);
        if (k < 0 || k >= DEALS.length) continue;
        const d = DEALS[k];
        if (s.french[d.fr] < 1){ await say(name, 'Ambarda ' + FR[d.fr] + ' kalmadı. Pyra ile Lumière\'e uçup dönersen heybesi yeniden dolar.'); continue; }
        if (!s.goods[d.cn].length){ await say(name, 'Önce atölyede ' + GOODS[d.cn].name + ' üretmelisin.'); continue; }
        const list = s.goods[d.cn], bi = list.indexOf(Math.max(...list)), q = list.splice(bi, 1)[0];
        s.french[d.fr]--; s.trades++; s.cargo++;
        const p = Math.round(GOODS[d.cn].value * (0.6 + 0.4 * q) * mult());
        sfx('quest');
        await say(name, QUALITY[q] + ' kalitede ' + GOODS[d.cn].name + ' Lumière\'e, ' + FR[d.fr] + ' Yasak Şehir\'e. Pyra hazineyi bir sonraki uçuşta Lumière\'e taşıyacak.');
        gain({prestige:p, culture:2, why:'Takas'});
      } else if (c === 1) await say(name, 'Ambarda: ' + goodsLine() + ' Bugüne dek ' + s.trades + ' takas yapıldı' + (s.seal ? '; Yeşim Ejderha Mührü sende.' : '.'));
      else if (c === 2) await ui.dialog([
        {name, text:'Kuzeyde Yasak Şehir: üç katlı mermer terasın üstünde Yüce Uyum Salonu. Sarı kiremit yalnızca imparatorun çatısına yakışır.'},
        {name, text:'Doğu sırtında Çin Seddi uzanır; güney ucu denize dalar, ona Yaşlı Ejderha Başı deriz. Geçitteki komutan işaret ateşlerini yakar.'},
        {name, text:'Kuzeydoğuda dokuz katlı pagoda, çan köşkü ve Yin-Yang bahçesi; batıda bambu ormanında pandalar, Ay Köprüsü\'yle lotus göleti ve teraslı çay tepesi.'},
        {name, text:'Güneydoğuda zanaat çarşısı, kuzeybatı kıyısında yüzen pazar ve ejderha kayıkları. Ejderha Terası\'ndaki gongu çalarsan Pyra gelir.'},
      ]);
      else return;
    }
  }
  async function teaCeremony(){
    const name = 'Çay ustası Bái Yún';
    if (!ready('tore', 60, name + ': Su yeniden ısınıyor; biraz bahçeyi seyret.')) return;
    const c = await ui.dialog([{name, text:'Gōngfū çay seremonisine hoş geldin. Bugün hangi çayı demleyelim?', choices:['Lóngjǐng yeşil çayı', 'Yıllanmış Pu-erh', 'Oolong', 'Sonra']}]);
    if (c < 0 || c > 2){ cool.tore = 0; return; }
    const right = await quiz(name, CEREMONY);
    if (right < 0) return;
    const tea = ['Lóngjǐng', 'Pu-erh', 'Oolong'][c];
    await say(name, right === 3 ? 'Bir fincan ' + tea + ', bir an huzur. Sen artık çayın dilini konuşuyorsun.' : 'Çay sabrı öğretir; usulün bir kısmı eksikti ama ' + tea + ' yine de ruhu ısıtır.');
    gain({culture:2 + right * 2, why:'Çay seremonisi'});
  }
  async function market(){
    const name = 'Tüccar Hóng Fā', s = st();
    const c = await ui.dialog([{name, text:'Yüzen pazara hoş geldin! Kayıklarda mandalina, liçi, ipek kurdele, porselen kâse… Ne istersin?', choices:['Bir lotus feneri al ve suya bırak', 'Pazarda ne konuşuluyor?', 'Hiçbir şey']}]);
    if (c === 0){
      if (!ready('fener', 30, name + ': Fenerler yeniden yapıştırılıyor, az sonra gel.')) return;
      sfx('chime'); gain({culture:1, why:'Lotus feneri dileği'});
    } else if (c === 1) await say(name, [
      s.prestige < 30 ? 'Saray seni henüz tanımıyor. Bakan Wáng Ān ile konuş; takas yaptıkça kapılar açılır.' : 'Herkes Lumière\'in elçisini konuşuyor! Takasların sarayda ses getirdi.',
      'Kayıkçı Lóng Bō ejderha kayığı yarışını başlatmak için davul sesine hazır. Şenlik kültürü besler.',
    ]);
  }
  async function festival(){
    const name = 'Kayıkçı Lóng Bō';
    if (race.on){ ui.toast('Yarış sürüyor!', 1500); return; }
    const c = await ui.dialog([{name, text:'Duānwǔ, Ejderha Kayığı Şenliği! Yeşil, kırmızı ve altın kayık hazır. Davulları çaldıralım mı?', choices:['Yarışı başlat', 'Şenliğin hikâyesi', 'Sonra']}]);
    if (c === 1){ await say(name, ['Şair Qū Yuán ülkesinin yıkımına dayanamayıp nehre atlamış. Halk onu kurtarmak için kayıklarla kürek çekmiş, balıklar ona dokunmasın diye suya pirinç atmış.', 'O günden beri her yaz kayıklar ejderha başlarıyla yarışır, davullar kötü ruhları kovar.']); return; }
    if (c !== 0) return;
    if (!ready('festival', 120, name + ': Kürekçiler dinleniyor, biraz sonra yeniden yarışalım.')) return;
    race.on = true; race.t = 0; race.drumT = 0; race.done = false;
    dboats.forEach(b => { b.speed = 0; b.pos = 0; b.pow = 6.5 + rnd() * 1.6; });
    ui.toast('Davullar çalıyor: ejderha kayıkları yarışıyor!', 2600);
  }
  async function bellRing(){
    if (!ready('can', 25, 'Çanın sesi hâlâ vadide yankılanıyor…')) return;
    bell.swing = 1; sfx('bell');
    gain({culture:2, why:'Bulut Çanı'});
  }
  async function incense(){
    if (!ready('tutsu', 20)) { ui.toast('Tütsü hâlâ yanıyor', 1600); return; }
    smoke.boost = 8; sfx('chime'); gain({culture:1, why:'Tütsü sunusu'});
  }
  async function meditate(){
    if (!ready('denge', 40, 'Zihin hâlâ dingin; biraz yürü, sonra yeniden otur.')) return;
    const Q = [
      'Yin ve Yang birbirini kovalamaz, birbirini doğurur: gecenin içinde gün, günün içinde gece saklıdır.',
      'Su en yumuşak şeydir, ama en sert taşı o oyar. — Laozi',
      'Feng Shui: dağ arkanı korur, su önünü besler. Saray kuzeye yaslanır, güneye bakar.',
      'Bin millik yolculuk tek bir adımla başlar. — Laozi',
    ];
    await ui.dialog([{name:'Yin-Yang Denge Bahçesi', text:Q[Math.floor(rnd() * Q.length)]}]);
    gain({culture:2, why:'Denge'});
  }
  async function feedKoi(){
    if (!ready('koi', 20, 'Koiler hâlâ tok; biraz sonra.')) return;
    koi.feedT = 12; koi.feed = {x:-104, z:86}; sfx('blip');
    gain({culture:1, why:'Koi göleti: huzur'});
  }
  async function feedPandas(){
    const name = 'Bakıcı Méi Méi';
    const c = await ui.dialog([{name, text:'Pandalarımız günde on dört saat bambu yer! Onları taze filizle beslemek ister misin?', choices:['Bambu filizi ver', 'Pandalar hakkında', 'Sonra']}]);
    if (c === 1){ await say(name, 'Dev pandalar yalnızca dağ bambu ormanlarında yaşar; imparatorlar onları barışın simgesi olarak dost saraylara hediye ederdi. Belki bir gün Lumière\'e de bir yavru gider.'); return; }
    if (c !== 0) return;
    if (!ready('panda', 40, name + ': Pandalar karnını doyurdu, şimdi şekerleme vakti.')) return;
    pandas.forEach((p, i) => { p.feed = 10; p.tx = CLEAR.x + 3 + Math.sin(i * 1.7) * 2; p.tz = CLEAR.z - 8 + Math.cos(i * 1.7) * 2; p.sit = 0; p.wait = 0; });
    sfx('blip'); gain({prestige:2, culture:1, why:'Pandalar beslendi'});
  }
  async function beacon(){
    const name = 'Komutan Qī Jìguāng';
    const c = await ui.dialog([{name, text:'Sed\'in on bin li\'si boyunca kuleler göz göze bakar. Gündüz kurt tezeği dumanı, gece ateş: haber atlıdan hızlı gider.', choices:['İşaret ateşlerini yak', 'Sed hakkında', 'Sonra']}]);
    if (c === 1){ await say(name, ['Sed\'i hanedanlar boyunca yüz binlerce el ördü. Bu sırt boyunca kıvrılıp güneyde denize dalan ucu, Yaşlı Ejderha Başı\'dır.', 'Gücü yalnız taşta değil, kuleler arasındaki düzende: biri görürse herkes bilir.']); return; }
    if (c !== 0) return;
    if (!ready('isaret', 90, name + ': Kuleler yeniden odun topluyor.')) return;
    beacons.forEach((b, i) => { b.t = 1 + i * 0.9; b.lit = 0; });
    sfx('roar'); gain({prestige:4, why:'İşaret ateşleri'});
  }
  {
    // bakan, ustalar ve diğer kişiler
    person(4, -2.5, 0, 'Bakan Wáng Ān', {robe:0x7a1c1c, trim:0xd4af37, hat:'resmi', sash:0x1d3a6e}, () => minister(), 3);
    [['porselen', 62, 0x1d3a6e, 'bilgin'], ['ipek', 102, 0x9a2a5a, 'hanim'], ['hali', 142, 0x6a3a1a, 'bilgin'], ['yesim', 182, 0x2f6a4a, 'bilgin']].forEach(([k, z, robe, hat]) =>
      person(76, z - 6, -Math.PI / 2, CRAFTS[k].master, {robe, trim:0xe8d7a8, hat}, () => craft(k)));
    person(-121, 128, Math.PI / 2, CRAFTS.cay.master, {robe:0x3f6a3a, trim:0xe8d7a8, hat:'hanim'}, () => craft('cay'));
    const tp = person(TEA.x + 1.6, TEA.z - 1.6, Math.PI * 0.75, 'Çay ustası Bái Yún (seremoni)', {robe:0x6a8a5a, trim:0xf4f1ea, hat:'hanim'}, () => teaCeremony());
    tp.scale.setScalar(0.98);
    [[TEA.x - 20, TEA.z + 8, 1.1], [TEA.x + 6, TEA.z + 26, 2.1]].forEach(([x, z, ry]) => person(x, z, ry, 'Çay toplayıcı', {robe:0x4a6a8a, trim:0xf4f1ea, hat:'hasir'}, () => say('Çay toplayıcı', 'Sabah çiyi kurumadan toplarız: bir tomurcuk, iki yaprak. Fermantasyon evindeki usta gerisini bilir.')));
    person(64, -143, Math.PI * 0.8, 'Rahip Huìnéng', {robe:0xd88a1a, trim:0x8a2a1a, hat:'kesis', sash:0x8a2a1a}, () => say('Rahip Huìnéng', ['Bulut Çanı Tapınağı\'na hoş geldin. Dokuz kat, göğün dokuz katmanıdır; saçaklardaki çanlar rüzgârla dua eder.', 'Çanı çal, tütsü yak, sonra Yin-Yang bahçesinde otur: denge, dışarıda değil içeride kurulur.']));
    act(46 + 3.4, -146, 'Bulut Çanı\'nı çal', () => bellRing(), 2.6);
    act(78, -143.6, 'Tütsü yak', () => incense(), 2.4);
    act(108 - 13, -118 + 1.4, 'Taş bankta otur: meditasyon', () => meditate(), 2.2);
    act(-107, 90.5, 'Koi balıklarını besle', () => feedKoi(), 3);
    person(CLEAR.x + 4, CLEAR.z - 10, Math.PI, 'Bakıcı Méi Méi', {robe:0x2f6a5a, trim:0xf4f1ea, hat:'hanim'}, () => feedPandas());
    const gx = ridgeX(WALL.gate) - 11;
    person(gx, WALL.gate + 4.5, -Math.PI / 2, 'Komutan Qī Jìguāng', {robe:0x5a1c1c, trim:0x8a8f96, hat:'komutan'}, () => beacon());
    road([[PX1 + 6, -30], [110, -28], [ridgeX(WALL.gate) - 10, WALL.gate], [ridgeX(WALL.gate) + 30, WALL.gate]], 5);
    // muhafızlar
    [[-4.5, 56], [4.5, 56], [-3.5, PZ0 - 8], [3.5, PZ0 - 8]].forEach(([x, z]) => person(x, z, z > 0 ? 0 : Math.PI, 'Saray muhafızı', {robe:0x8a1c1c, trim:0xd4af37, hat:'komutan'}, () => say('Saray muhafızı', 'Yasak Şehir\'e hoş geldiniz, elçi. Bakan Wáng Ān Yüce Uyum Salonu\'nun merdiveninde sizi bekliyor.')));
    // iskele başı: Lumière'den gelenlere yol gösteren tabela
    const sg = plaque('玉龍島 · Yùlóng Adası', 4.2, 1.0, '#7a1c14'); const [px, pz] = [pier.x - CX, pier.z - CZ]; sg.position.set(px - Math.sin(HARBOR_A) * 6, 3, pz - Math.cos(HARBOR_A) * 6); sg.rotation.y = HARBOR_A; G.add(sg);
    [-1, 1].forEach(sd => add(new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8), red, sg.position.x + Math.cos(HARBOR_A) * sd * 2.2, 1.7, sg.position.z - Math.sin(HARBOR_A) * sd * 2.2));
  }

  /* ================= Pyra'nın heybesi: iki ada arası ticaret ================= */
  function pyraLanded(from, to){
    const s = st();
    if (!onChina(from.x, from.z) && onChina(to.x, to.z)){
      const before = s.french.sarap + s.french.parfum;
      s.french.sarap = Math.min(8, s.french.sarap + 2); s.french.parfum = Math.min(8, s.french.parfum + 1);
      if (s.french.sarap + s.french.parfum > before) setTimeout(() => ui.toast('Pyra\'nın heybesi: Lumière mahzeninden şarap ve parfüm (şarap ' + s.french.sarap + ', parfüm ' + s.french.parfum + ')', 3600), 2600);
      hooks.save();
    } else if (onChina(from.x, from.z) && !onChina(to.x, to.z) && s.cargo > 0){
      const n = s.cargo; s.cargo = 0;
      setTimeout(() => gain({prestige:n * 2, why:'Pyra ' + n + ' Çin hazinesini Lumière galerisine taşıdı'}), 2600);
    }
  }

  /* ================= güncelleme ================= */
  const markIsland = {id:'yulong', color:'#c8102e', label:'Yùlóng Adası (Pyra ile uç)', x:CX, z:CZ, show:() => !!hooks.getS().started && !near};
  markers.push(markIsland);
  let near = false, near2 = [], bambooT = 0;
  CHINA_PLACES.forEach(p => markers.push({id:'yl-' + p.id, color:'#d4af37', label:p.name, x:p.x, z:p.z, minor:true, show:() => near && !!hooks.getS().started && !st().found.includes(p.id) && near2.includes(p.id)}));
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(1, 1, 1), tmpP = new THREE.Vector3();
  function update(dt, t, hero){
    root.visible = hero.zone !== 'ic';
    if (!root.visible) return;
    const W = world.W, px = hero.pos.x - CX, pz = hero.pos.z - CZ, dist = Math.hypot(px, pz);
    near = dist < 420;
    T.update(dt, t);
    // gece: fenerler ve kâğıt kapılar yanar
    const nl = W.night;
    lanternMat.color.setRGB(0.45 + nl * 2.2, 0.06 + nl * 0.55, 0.04 + nl * 0.12);
    paperMat.emissiveIntensity = nl * 1.4;
    if (dist > 650) return;
    // keşif
    const S = hooks.getS();
    if (S.started && hero.zone == null){
      const f = st().found;
      for (const p of CHINA_PLACES) if (!f.includes(p.id) && Math.hypot(hero.pos.x - p.x, hero.pos.z - p.z) < p.r){
        f.push(p.id); sfx('quest'); ui.toast('Keşfedildi: ' + p.name + ' (' + f.length + '/' + CHINA_PLACES.length + ')', 2800);
        if (f.length === CHINA_PLACES.length) setTimeout(() => { ui.toast('Yùlóng Adası\'nın bütün köşelerini keşfettin! 🐉', 3600); gain({culture:10}); }, 3000);
        hooks.save(); break;
      }
      near2 = CHINA_PLACES.filter(p => !f.includes(p.id)).sort((a, b) => Math.hypot(a.x - hero.pos.x, a.z - hero.pos.z) - Math.hypot(b.x - hero.pos.x, b.z - hero.pos.z)).slice(0, 2).map(p => p.id);
    }
    updaters.forEach(fn => fn(dt, t, hero));
    if (!near) return;
    // koi
    koi.feedT = Math.max(0, koi.feedT - dt);
    koi.fish.forEach((f, i) => {
      const l = LOBES[f.l]; let tx, tz;
      if (koi.feedT > 0 && f.l === 0){ tx = koi.feed.x + Math.sin(i * 2.1 + t * 0.6) * 1.6; tz = koi.feed.z - 3 + Math.cos(i * 1.3 + t * 0.5) * 1.2; }
      else { f.a += dt * f.w; tx = l.x + Math.cos(f.a) * l.rx * f.rf; tz = l.z + Math.sin(f.a) * l.rz * f.rf; }
      const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
      if (d > 0.01){ const sp = Math.min(d, dt * (koi.feedT > 0 ? 2.2 : 1.1)); f.x += dx / d * sp; f.z += dz / d * sp; f.yaw += (Math.atan2(Math.sin(Math.atan2(dx, dz) - f.yaw), Math.cos(Math.atan2(dx, dz) - f.yaw))) * Math.min(1, dt * 4); }
      tmpQ.setFromAxisAngle(L(0, 1, 0), f.yaw + Math.sin(t * 6 + i) * 0.15); tmpS.setScalar(f.k);
      tmpM.compose(tmpP.set(f.x, 0.135, f.z), tmpQ, tmpS); koi.mesh.setMatrixAt(i, tmpM);
    });
    koi.mesh.instanceMatrix.needsUpdate = true;
    // pandalar: dolaş, otur ve bambu kemir; beslenince bakıcıya gel
    pandas.forEach(p => {
      if (p.feed > 0) p.feed -= dt;
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz);
      if (d > 0.4){
        const sp = Math.min(d, dt * (p.feed > 0 ? 1.1 : 0.55)); p.x += dx / d * sp; p.z += dz / d * sp;
        p.yaw += Math.atan2(Math.sin(Math.atan2(dx, dz) - p.yaw), Math.cos(Math.atan2(dx, dz) - p.yaw)) * Math.min(1, dt * 2.5);
        p.phase += dt * 5; p.sit = Math.max(0, p.sit - dt * 2);
      } else {
        p.wait -= dt; p.sit = Math.min(1, p.sit + dt * 1.2);
        if (p.wait <= 0 && !(p.feed > 0)){ const a = rnd() * 6.3, r = rnd() * (CLEAR.r - 3); p.tx = CLEAR.x + Math.sin(a) * r; p.tz = CLEAR.z + Math.cos(a) * r; p.wait = 6 + rnd() * 10; }
      }
      p.g.position.set(p.x, 0, p.z); p.g.rotation.y = p.yaw;
      p.legs.forEach((l, i) => { l.rotation.x = p.sit > 0.5 ? (i < 2 ? -1.2 : 0) : Math.sin(p.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.4 * (1 - p.sit); });
      p.body.rotation.x = -p.sit * 0.75; p.body.position.y = 0.62 - p.sit * 0.12;
      p.head.rotation.x = p.sit * 0.55 + Math.sin(t * 3 + p.phase) * 0.06 * p.sit;
      p.stick.visible = p.sit > 0.6;
    });
    // çan kütüğü sallanır
    if (bell.swing > 0){ bell.swing = Math.max(0, bell.swing - dt * 0.35); bell.log.rotation.z = Math.sin((1 - bell.swing) * 9) * 0.35 * bell.swing; }
    // tütsü dumanı
    { smoke.boost = Math.max(0, smoke.boost - dt); const a = smoke.geo.attributes.position.array, k = smoke.boost > 0 ? 1.8 : 1;
      smoke.forEach(s => { s.t += dt * k; if (s.t > 6) s.t -= 6; const h = s.t * 0.8; a[s.i * 3] = Math.sin(s.t * 1.3 + s.i) * h * 0.18 + world.state.wind * h * 0.6; a[s.i * 3 + 1] = h; a[s.i * 3 + 2] = Math.cos(s.t * 1.1 + s.i) * h * 0.15; });
      smoke.geo.attributes.position.needsUpdate = true; }
    // işaret ateşleri: geçitten iki yöne sırayla yanar
    beacons.forEach(b => {
      if (b.t > 0){ b.t -= dt; if (b.t <= 0){ b.lit = 40; b.flame.visible = true; } }
      if (b.lit > 0){ b.lit -= dt; const f = 1 + Math.sin(t * 13 + b.z) * 0.12 + Math.sin(t * 23) * 0.06; b.flame.scale.set(f, f * (0.9 + Math.sin(t * 9 + b.z) * 0.15), f); if (b.lit <= 0) b.flame.visible = false; }
    });
    flutter.forEach(f => { const w = world.state.wind, v = Math.sin(t * 2.3 + f.ph) * 0.6 + Math.sin(t * 5.1 + f.ph * 2) * 0.25; if (f.axis === 'x') f.m.rotation.x = v * f.k * (0.3 + w); else f.m.rotation.y = f.base + v * f.k * (0.4 + w); });
    // pazar kayıkları
    sampans.forEach(s => { s.g.position.y = s.y0 + Math.sin(t * 0.9 + s.ph) * 0.06; s.g.rotation.z = Math.sin(t * 0.7 + s.ph) * 0.04; });
    // ejderha kayığı yarışı
    if (race.on){
      race.t += dt; race.drumT -= dt;
      if (race.drumT <= 0){ race.drumT = 0.42; sfx('drum'); }
      let lead = null;
      dboats.forEach(b => {
        b.speed += ((b.pow + Math.sin(race.t * 0.7 + b.lane * 2) * 0.8) - b.speed) * Math.min(1, dt * 0.8);
        b.pos += b.speed * dt;
        b.g.position.set(b.home[0] + race.dir[0] * b.pos, -0.22 + Math.sin(t * 2 + b.lane) * 0.04, b.home[1] + race.dir[1] * b.pos);
        b.rowers.forEach((r, j) => { r.oar.rotation.x = Math.sin(race.t * 9 + j * 0.1) * 0.7; });
        if (!lead || b.pos > lead.pos) lead = b;
      });
      if (!race.done && lead.pos > 170){
        race.done = true; const nm = ['Yeşil Ejderha', 'Kızıl Ejderha', 'Altın Ejderha'][lead.lane];
        sfx('quest'); ui.toast(nm + ' kazandı! Şenlik bitti.', 3200); gain({prestige:3, culture:5, why:'Ejderha Kayığı Şenliği'});
      }
      if (race.done && race.t > 40){ race.on = false; dboats.forEach(b => { b.pos = 0; b.g.position.set(b.home[0], -0.22, b.home[1]); b.rowers.forEach(r => { r.oar.rotation.x = 0; }); }); }
    } else dboats.forEach(b => { b.g.position.y = -0.22 + Math.sin(t * 0.8 + b.lane) * 0.05; });
    // bambu ormanında tıkırtılar
    if (Math.hypot(px - BAM.x, pz - BAM.z) < BAM.r){ bambooT -= dt; if (bambooT <= 0){ bambooT = 0.8 + rnd() * 2.5 / (0.3 + world.state.wind); sfx('wood'); } }
  }

  function journal(S){
    const s = S.china; if (!s) return [];
    const out = [{title:'Yùlóng Adası\'nı keşfet', hint:'Yasak Şehir, Çin Seddi, pagoda, bambu ormanı, çay tepesi… Pusuladaki altın işaretleri izle. (' + s.found.length + '/' + CHINA_PLACES.length + ')', done:s.found.length >= CHINA_PLACES.length, color:'#c8102e'}];
    if (s.met) out.push({title:'İpek Yolu: ' + RANKS[s.rank][1], hint:'Atölyelerde üret, Pyra\'nın getirdiği şarap ve parfümle Bakan Wáng Ān\'da takas et. Prestij ' + s.prestige + ' · Kültür ' + s.culture + (s.rank < RANKS.length - 1 ? ' · sonraki unvan: ' + RANKS[s.rank + 1][1] + ' (' + RANKS[s.rank + 1][0] + ')' : ''), done:!!s.seal, color:'#d4af37'});
    return out;
  }

  kit.bake();
  kit.fixColors();
  return {root, interact, markers, update, journal, pyraLanded, places:CHINA_PLACES, coast:CHINA_COAST,
    dist:(x, z) => Math.max(0, -CHINA_COAST.dist(x, z)), get near(){ return near; }};
}
