// Lumière'in boş kalan kırları: Fransa'nın bölgeleri (terroir).
//  Batı:      Provence (lavanta tarlaları, mas evi, zeytin ve servi, petank sahası)
//             Normandiya (yarı ahşap saman çatılı çiftlik, elma bahçesi, elma şarabı, Normande inekleri)
//             Bretanya (Carnac menhirleri, deniz feneri, krepçi)
//  Doğu:      Notre-Dame de Lumière katedrali, köy pazarı (halles: peynirci, manav, balıkçı, çiçekçi)
//  Kuzeydoğu: Beauce buğday tarlaları, yel değirmeni, saman balyaları
//  Güneydoğu: Mont-Saint-Michel (gelgit kumsalında manastır kayası)
//  Güney:     Côte d'Azur plajı (çizgili kabinler, şemsiyeler, mavi sandalyeler, dondurmacı)
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeKit } from './kit.js';
import { PLACES } from './court.js';
import { LUMIERE_COAST } from './sea.js';

export const TERROIR = {
  provence:{x:-312, z:112},
  normandie:{x:-318, z:-52},
  bretagne:{x:-312, z:-168},
  cathedral:{x:316, z:-92},
  market:{x:312, z:62},
  beauce:{x:236, z:-196},
  msm:{x:286, z:196},
  riviera:{z:276},
};
// Ağaç dikilmeyecek alanlar [x0, z0, x1, z1]
export const TERROIR_ZONES = [[-400, 50, -236, 178], [-400, -118, -244, 14], [-410, -220, -268, -126], [262, -150, 380, -36], [256, 14, 372, 118], [176, -258, 300, -140], [232, 140, 350, 260], [-300, 258, 300, 300]];

PLACES.push(
  {id:'provence', name:'Provence: lavanta tarlaları', x:TERROIR.provence.x, z:TERROIR.provence.z, r:22},
  {id:'normandie', name:'Normandiya çiftliği', x:TERROIR.normandie.x, z:TERROIR.normandie.z, r:20},
  {id:'bretagne', name:'Bretanya: menhirler ve deniz feneri', x:TERROIR.bretagne.x, z:TERROIR.bretagne.z, r:18},
  {id:'katedral', name:'Notre-Dame de Lumière', x:TERROIR.cathedral.x, z:TERROIR.cathedral.z + 42, r:18},
  {id:'marche', name:'Köy pazarı (marché)', x:TERROIR.market.x, z:TERROIR.market.z, r:18},
  {id:'beauce', name:'Beauce: yel değirmeni ve buğday', x:TERROIR.beauce.x, z:TERROIR.beauce.z, r:20},
  {id:'msm', name:'Mont-Saint-Michel', x:TERROIR.msm.x - 34, z:TERROIR.msm.z, r:18},
  {id:'riviera', name:'Côte d\'Azur plajı', x:-90, z:TERROIR.riviera.z, r:16},
);

export function buildTerroir(world, C, hooks){
  const { THREE, scene, materials:Mw } = world;
  const root = new THREE.Group(); root.name = 'Terroir'; scene.add(root);
  const doors = {}, interact = [], updaters = [], markers = [];
  const say = (name, text, choices) => hooks.ui.dialog([{name, text, choices}]);
  const talk = (name, lines) => hooks.ui.dialog(lines.map(text => ({name, text})));
  const toast = (t, ms = 2800) => hooks.ui.toast(t, ms);
  const K = makeKit(world, C, root, {seed:1515, interact, updaters, say});
  const { rnd, add, canvas, ctex, mat, stone, darkWood, wood, gableGeo, npc, lady, placeNPC, toWorld, lathe } = K;
  const S = () => hooks.getS(), notes = () => S().notes;
  const land = (x, z, m = 20) => LUMIERE_COAST.dist(x, z) < -m;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  const tex = (w, h, fn) => { const [c, g] = canvas(w, h); fn(g, w, h); return ctex(c); };
  function box(w, h, d, s = 2){
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
    return g;
  }
  function floor(w, d, m, x, y, z, rot = 0, tile = 4){
    const g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
    const f = add(g, m, x, y, z, root, false); f.rotation.set(-Math.PI / 2, 0, rot); return f;
  }
  function sign(text, x, y, z, ry, w = 3, h = 0.7, bg = '#2c2016', fg = '#f6ecd0', parent = root){
    const cw = Math.min(1024, Math.max(256, Math.round(64 * w / h))), [c, g] = canvas(cw, Math.max(64, Math.round(cw * h / w)));
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = c.height * 0.6; do { g.font = 'bold ' + fs + 'px Georgia, serif'; fs -= 2; } while (g.measureText(text).width > c.width - 40); g.fillText(text, c.width / 2, c.height / 2 + 2);
    const m = add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.6}), x, y, z, parent, false); m.rotation.y = ry; return m;
  }
  const act = (x, z, label, fn, r = 2.4, show = () => true, y) => interact.push({x, z, r, label, show, act:fn, ...(y != null ? {y} : {})});
  const person = (g, x, z, ry, name, fn) => placeNPC(g, x, z, ry, name, fn);
  const beret = g => { add(new THREE.CylinderGeometry(0.17, 0.15, 0.06, 14), mat(0x1a1a1e), 0, 1.92, 0, g).rotation.z = 0.15; return g; };
  const villager = (coat, opts = {}) => { const g = npc(Object.assign({coat, hat:'yok'}, opts)); if (opts.beret !== false) beret(g); return g; };

  /* ================= ortak malzemeler ================= */
  const terracotta = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#b25a36'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 12) for (let x = (y / 12 % 2) * 8; x < 136; x += 16){ const v = 150 + rnd() * 50; g.fillStyle = `rgb(${v + 40 | 0},${v * 0.5 | 0},${v * 0.3 | 0})`; g.beginPath(); g.ellipse(x, y + 6, 7, 6, 0, 0, Math.PI); g.fill(); } }), roughness:0.8, side:THREE.DoubleSide});
  const slateRoof = mat(0x4a525a, {map:Mw.slateMat.map, roughness:0.6, side:THREE.DoubleSide});
  const thatch = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#8a7044'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++){ const v = 110 + rnd() * 80; g.strokeStyle = `rgba(${v + 30 | 0},${v * 0.85 | 0},${v * 0.5 | 0},.7)`; g.lineWidth = 1 + rnd(); const x = rnd() * 128, y = rnd() * 128; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y + 10 + rnd() * 10); g.stroke(); } }), roughness:1, side:THREE.DoubleSide});
  const ochre = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#e2c08a'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 60; i++){ const x = rnd() * 128, y = rnd() * 128, r = 4 + rnd() * 14; g.fillStyle = `rgba(${150 + rnd() * 60 | 0},${110 + rnd() * 40 | 0},70,.18)`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); } }), roughness:0.9});
  const granite = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#8d8a84'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++){ const v = 90 + rnd() * 90; g.fillStyle = `rgba(${v | 0},${v | 0},${v * 0.97 | 0},.5)`; g.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 2, 1 + rnd() * 2); } for (let i = 0; i < 18; i++){ g.fillStyle = 'rgba(110,130,80,.25)'; g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 3 + rnd() * 8, 0, Math.PI * 2); g.fill(); } }), roughness:0.95});
  const timberTex = (bg) => tex(128, 128, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, 128, 128); g.fillStyle = '#4a2e1c';
    g.fillRect(0, 0, 128, 8); g.fillRect(0, 120, 128, 8); for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 7, 128);
    g.lineWidth = 6; g.strokeStyle = '#4a2e1c'; g.beginPath(); g.moveTo(7, 120); g.lineTo(32, 64); g.moveTo(71, 120); g.lineTo(96, 64); g.stroke();
    g.fillStyle = '#2a3440'; g.fillRect(40, 30, 18, 26); g.fillStyle = '#f4f2ec'; g.fillRect(48, 30, 2, 26);
  });
  const shutterBlue = mat(0x5a7a9a, {roughness:0.6}), shutterGreen = mat(0x3a6a4a, {roughness:0.6});
  const water = mat(0x2a5a6a, {roughness:0.05, metalness:0.3, transparent:true, opacity:0.88});
  const dirt = mat(0x8a7454, {roughness:1}), gravelPath = Mw.gravelMat;
  function road(pts, w = 3.5, m = gravelPath){
    pts.forEach((a, i) => { const b = pts[i + 1]; if (!b) return; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); floor(w, l + w * 0.5, m, (a[0] + b[0]) / 2, 0.02 + i * 0.001, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1]), 4); });
  }
  /** Beşik çatılı ev: yerel +z önü; roof: malzeme, pitch: çatı yüksekliği / genişlik */
  function cottage({x, z, w, d, h = 3.2, rot = 0, wall = ochre, roof = terracotta, pitch = 0.32, shutters = shutterBlue, over = 0.5, door = 'rustik', chimney = true}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    add(box(w, h, d), wall, 0, h / 2, 0, G);
    // sırt x boyunca (uzun kenar), saçaklar önde ve arkada; alın üçgenleri iki yanda
    const rh = d * pitch * 1.4, r = add(gableGeo(d + over * 2, w + over * 2, rh), roof, 0, h, 0, G);
    r.rotation.y = Math.PI / 2;
    const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, rh * d / (d + over * 2)); tri.closePath();
    [-1, 1].forEach(sd => { const tg = add(new THREE.ShapeGeometry(tri), wall, sd * (w / 2 + 0.01), h, 0, G, false); tg.rotation.y = sd * Math.PI / 2; });
    K.doorway(G, {z:d / 2, w:1.3, h:2.2, y0:0, style:door});
    const n = Math.max(1, Math.round(w / 3));
    for (let i = 0; i < n; i++){
      const wx = -w / 2 + (i + 0.5) * w / n; if (Math.abs(wx) < 1.2) continue;
      add(new THREE.PlaneGeometry(0.9, 1.1), K.winMat, wx, h * 0.55, d / 2 + 0.02, G, false);
      if (shutters) [-1, 1].forEach(sd => add(new THREE.PlaneGeometry(0.45, 1.15), shutters, wx + sd * 0.7, h * 0.55, d / 2 + 0.03, G, false));
    }
    if (chimney) add(box(0.7, 1.6, 0.7), stone, w * 0.28, h + rh * 0.6, -d * 0.2, G);
    C.box(x, z, w / 2 + 0.1, d / 2 + 0.1, rot);
    return {G, front:toWorld(G, 0, d / 2 + 1.6), top:h + rh};
  }
  /** Ağaç kümeleri: tür başına tek InstancedMesh (gövde + tepe), rüzgârda sallanır. */
  function grove(list, crownG, color, {trunkH = 2, trunkR = 0.18, crownY = 2.6, wind = 0.6, trunkColor = 0x5a4430, collide = 0.3} = {}){
    if (!list.length) return;
    const tg = new THREE.CylinderGeometry(trunkR * 0.7, trunkR, trunkH, 6); tg.translate(0, trunkH / 2, 0);
    const T = new THREE.InstancedMesh(tg, mat(trunkColor, {roughness:0.9}), list.length);
    const Cr = new THREE.InstancedMesh(crownG, world.windMat(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85}), wind, true), list.length);
    list.forEach(([x, z, k = 1], i) => {
      m4.compose(p3.set(x, 0, z), q.setFromEuler(e3.set((rnd() - 0.5) * 0.12, rnd() * 6.3, (rnd() - 0.5) * 0.12)), s3.set(k, k, k)); T.setMatrixAt(i, m4);
      m4.compose(p3.set(x, crownY * k, z), q.setFromEuler(e3.set(0, rnd() * 6.3, 0)), s3.set(k, k, k)); Cr.setMatrixAt(i, m4);
      Cr.setColorAt(i, col.set(typeof color === 'function' ? color() : color).convertSRGBToLinear());
      if (collide) C.circle(x, z, collide * k);
    });
    T.castShadow = Cr.castShadow = true; Cr.receiveShadow = true; root.add(T, Cr);
  }

  /* =====================================================================
     1. PROVENCE
     ===================================================================== */
  {
    const P0 = TERROIR.provence;
    // lavanta tarlası: sıralar halinde yuvarlak çalılar (tek InstancedMesh), aralarında toprak
    const fx0 = P0.x - 56, fx1 = P0.x + 6, fz0 = P0.z - 34, fz1 = P0.z + 46;
    floor(fx1 - fx0, fz1 - fz0, dirt, (fx0 + fx1) / 2, 0.015, (fz0 + fz1) / 2);
    const bushG = new THREE.IcosahedronGeometry(0.55, 1); bushG.scale(1, 0.7, 1); bushG.translate(0, 0.32, 0);
    const pts = [];
    for (let x = fx0 + 1; x < fx1 - 0.5; x += 1.7) for (let z = fz0 + 0.8; z < fz1 - 0.5; z += 1.05){ if (land(x, z, 24)) pts.push([x + (rnd() - 0.5) * 0.15, z]); }
    const lav = new THREE.InstancedMesh(bushG, world.windMat(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.9}), 1.2, false), pts.length);
    pts.forEach(([x, z], i) => { const k = 0.8 + rnd() * 0.4; m4.compose(p3.set(x, 0, z), q.setFromEuler(e3.set(0, rnd() * 6.3, 0)), s3.set(k, k * (0.9 + rnd() * 0.3), k)); lav.setMatrixAt(i, m4); lav.setColorAt(i, col.setHSL(0.74 + rnd() * 0.04, 0.45 + rnd() * 0.15, 0.48 + rnd() * 0.1).convertSRGBToLinear()); });
    lav.castShadow = true; lav.receiveShadow = true; root.add(lav);
    // mas: aşı boyalı taş ev, alçak kiremit çatı, mavi panjurlar; önünde çınar ve çeşme
    const mas = cottage({x:P0.x + 30, z:P0.z + 6, w:14, d:8, h:4.2, rot:-Math.PI / 2, pitch:0.22});
    cottage({x:P0.x + 34, z:P0.z - 12, w:7, d:6, h:3.2, rot:-Math.PI / 2, pitch:0.22, chimney:false});
    sign('Mas des Lavandes', 0, 3.7, 4.06, 0, 2.6, 0.5, '#5a7a9a', '#f4f2ec', mas.G);
    {
      const fx = P0.x + 18, fz = P0.z + 22;
      add(lathe([[0, 0], [1.6, 0], [1.6, 0.7], [1.4, 0.7], [1.4, 0.1]], 20), stone, fx, 0, fz);
      add(new THREE.CircleGeometry(1.4, 20), water, fx, 0.55, fz, root, false).rotation.x = -Math.PI / 2;
      add(new THREE.CylinderGeometry(0.22, 0.3, 1.8, 10), stone, fx, 0.9, fz); add(new THREE.SphereGeometry(0.3, 12, 8), stone, fx, 1.9, fz);
      C.circle(fx, fz, 1.7);
    }
    // zeytin ve servi
    const oliveG = mergeBufferGeometries([[0, 0, 0, 1.5], [0.9, -0.2, 0.4, 1.1], [-0.8, 0.1, -0.4, 1.2]].map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z)));
    const olives = []; for (let i = 0; i < 26; i++){ const x = P0.x + 14 + rnd() * 28, z = P0.z - 40 + rnd() * 30; if (land(x, z, 24)) olives.push([x, z, 0.8 + rnd() * 0.3]); }
    grove(olives, oliveG, () => col.setHSL(0.2, 0.18, 0.42 + rnd() * 0.08).getHex(), {trunkH:2.2, trunkR:0.22, crownY:2.8, trunkColor:0x6a5a48});
    const cypG = new THREE.ConeGeometry(0.9, 7, 8); cypG.translate(0, 3.5, 0);
    const cyp = []; for (let z = fz0; z < fz1; z += 7) cyp.push([fx1 + 4, z, 0.9 + rnd() * 0.25]);
    grove(cyp, cypG, () => col.setHSL(0.33, 0.45, 0.16 + rnd() * 0.04).getHex(), {trunkH:1, trunkR:0.15, crownY:0.6, wind:0.4});
    // petank sahası ve oyuncular
    const pk = {x:P0.x + 24, z:P0.z + 40};
    floor(4, 16, gravelPath, pk.x, 0.03, pk.z, 0, 2);
    [[-2, 0, 0.1, 16], [2, 0, 0.1, 16], [0, -8, 4, 0.1], [0, 8, 4, 0.1]].forEach(([dx, dz, w, d]) => add(box(w, 0.2, d), wood, pk.x + dx, 0.1, pk.z + dz));
    const steel = mat(0xb8bcc4, {metalness:1, roughness:0.3});
    [[0.4, -5], [-0.6, -4.6], [0.2, -5.6]].forEach(([dx, dz]) => add(new THREE.SphereGeometry(0.04, 10, 8), mat(0xd8a030), pk.x + dx * 0.1, 0.07, pk.z + dz, root, false));
    [[0.5, -4.4], [-0.7, -5.3], [0.9, -6.1], [-0.3, -3.9]].forEach(([dx, dz]) => add(new THREE.SphereGeometry(0.075, 12, 8), steel, pk.x + dx, 0.1, pk.z + dz, root, false));
    person(villager(0xe8dcc4), pk.x - 2.8, pk.z + 2, Math.PI / 2, 'Marius', async () => {
      const best = notes().petanque || 0;
      const c = await say('Marius', best ? 'Rövanş mı? Senin en iyin cochonnet\'ye ' + best.toFixed(2) + ' m. Yen beni!' : 'Bir parti petank? Küçük tahta topa, cochonnet\'ye, en yakın atan kazanır. Ayaklarını kaldırma!', ['Topu at', 'Kurallar', 'Sonra']);
      if (c === 1){ await talk('Marius', ['Daireden atarsın, iki ayak yerde. Her oyuncu çelik topunu cochonnet\'ye en yakın yere bırakmaya çalışır.', 'Rakibin topunu vurup uzaklaştırmaya "tirer" denir, yaklaştırmaya "pointer". Provence\'ta öğle sıcağında, çınarların gölgesinde oynanır.']); return; }
      if (c !== 0) return;
      const mine = Math.max(0.05, Math.abs((rnd() + rnd() + rnd()) / 3 - 0.5) * 3.2), his = 0.25 + rnd() * 0.6;
      hooks.sfx('wood');
      if (!notes().petanque || mine < notes().petanque){ notes().petanque = mine; hooks.save(); }
      await say('Marius', mine < his ? 'Oh fan! ' + mine.toFixed(2) + ' m, benimki ' + his.toFixed(2) + ' m. Sen kazandın, pastis benden!' : mine.toFixed(2) + ' m… benimki ' + his.toFixed(2) + ' m. Bu sefer ben! Bir daha?');
    });
    person(villager(0x5a7a9a), pk.x + 2.8, pk.z - 3, -Math.PI / 2, 'Fanny', () => talk('Fanny', ['Lavanta temmuzda biçilir, sonra imbikte damıtılır. Bir hektardan ancak birkaç litre esans çıkar.', 'Rüzgâr kuzeyden esince ona mistral deriz: gökyüzünü temizler, servileri eğer. Bu yüzden servileri tarlaların kuzeyine dikeriz.']));
    act(P0.x - 20, P0.z + 4, 'Lavanta kokla', () => { hooks.sfx('blip'); toast('Lavanta kokusu ve ağustosböceklerinin sesi… Provence\'tasın.'); }, 3.2);
    road([[-232, 112], [P0.x + 22, P0.z + 14], [pk.x, pk.z - 10]]);
  }

  /* =====================================================================
     2. NORMANDİYA ÇİFTLİĞİ
     ===================================================================== */
  {
    const N0 = TERROIR.normandie;
    const wallT = mat(0xffffff, {map:timberTex('#efe6d2'), roughness:0.85});
    // longère: uzun, alçak, yarı ahşap, kalın saman çatı, sırtında iris çiçekleri
    const farm = cottage({x:N0.x, z:N0.z, w:18, d:7, h:3.4, rot:0, wall:wallT, roof:thatch, pitch:0.55, over:0.8, shutters:shutterGreen});
    add(box(18.5, 0.5, 0.8), mat(0x5a7a3a, {roughness:1}), N0.x, farm.top + 0.15, N0.z);
    cottage({x:N0.x + 18, z:N0.z - 4, w:9, d:7, h:3.6, rot:-Math.PI / 2, wall:wallT, roof:thatch, pitch:0.6, over:0.8, shutters:false, chimney:false});
    sign('Ferme du Pressoir', N0.x - 5, 2.6, N0.z + 3.53, 0, 2.6, 0.5, '#3a2a1a', '#f2e6c8');
    // elma bahçesi: kırmızı noktalı tepeler
    const appleTex = tex(64, 64, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64); for (let i = 0; i < 14; i++){ g.fillStyle = '#c8202a'; g.beginPath(); g.arc(rnd() * 64, rnd() * 64, 2.5, 0, Math.PI * 2); g.fill(); } });
    const appleG = new THREE.IcosahedronGeometry(1.7, 1); appleG.scale(1, 0.85, 1);
    const apples = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++){ const x = N0.x - 30 + i * 7 + (rnd() - 0.5), z = N0.z + 14 + j * 7 + (rnd() - 0.5); if (land(x, z, 24)) apples.push([x, z, 0.85 + rnd() * 0.2]); }
    {
      const tg = new THREE.CylinderGeometry(0.15, 0.24, 2.2, 6); tg.translate(0, 1.1, 0);
      const T = new THREE.InstancedMesh(tg, mat(0x5a4430), apples.length), Cr = new THREE.InstancedMesh(appleG, world.windMat(new THREE.MeshStandardMaterial({color:0xffffff, map:appleTex, roughness:0.85}), 0.6, true), apples.length);
      apples.forEach(([x, z, k], i) => { m4.compose(p3.set(x, 0, z), q.identity(), s3.set(k, k, k)); T.setMatrixAt(i, m4); m4.compose(p3.set(x, 3.1 * k, z), q.setFromEuler(e3.set(0, rnd() * 6, 0)), s3.set(k, k, k)); Cr.setMatrixAt(i, m4); Cr.setColorAt(i, col.setHSL(0.27, 0.45, 0.32 + rnd() * 0.06).convertSRGBToLinear()); C.circle(x, z, 0.3 * k); });
      T.castShadow = Cr.castShadow = true; root.add(T, Cr);
    }
    // elma şarabı fıçıları ve pres
    [[3, 4.6], [4.2, 4.6], [3.6, 5.6]].forEach(([dx, dz]) => { add(lathe([[0, 0], [0.42, 0], [0.5, 0.45], [0.42, 0.9], [0, 0.9]], 14), darkWood, N0.x + dx + 6, 0, N0.z + dz); C.circle(N0.x + dx + 6, N0.z + dz, 0.5); });
    // Normande inekleri: beyaz üstüne kahve lekeler, "gözlüklü" yüz
    const cowTex = tex(128, 64, (g) => { g.fillStyle = '#f2ece0'; g.fillRect(0, 0, 128, 64); for (let i = 0; i < 9; i++){ g.fillStyle = '#6a3a20'; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 64, 8 + rnd() * 12, 6 + rnd() * 9, rnd() * 3, 0, Math.PI * 2); g.fill(); } });
    const cowMat = mat(0xffffff, {map:cowTex, roughness:0.85}), hoof = mat(0x2a2420), brownF = mat(0x6a3a20, {roughness:0.85}), pinkN = mat(0xe8b0a0);
    const pen = {x0:N0.x - 6, x1:N0.x + 26, z0:N0.z - 36, z1:N0.z - 12};
    for (let x = pen.x0; x <= pen.x1; x += 2.5) [pen.z0, pen.z1].forEach(z => add(box(0.12, 1.2, 0.12), wood, x, 0.6, z));
    for (let z = pen.z0; z <= pen.z1; z += 2.5) [pen.x0, pen.x1].forEach(x => add(box(0.12, 1.2, 0.12), wood, x, 0.6, z));
    [0.5, 1.0].forEach(y => { [pen.z0, pen.z1].forEach(z => add(box(pen.x1 - pen.x0, 0.08, 0.06), wood, (pen.x0 + pen.x1) / 2, y, z)); [pen.x0, pen.x1].forEach(x => add(box(0.06, 0.08, pen.z1 - pen.z0), wood, x, y, (pen.z0 + pen.z1) / 2)); });
    C.rect(pen.x0, pen.z0 - 0.1, pen.x1, pen.z0 + 0.1).low = true; C.rect(pen.x0 - 0.1, pen.z0, pen.x0 + 0.1, pen.z1).low = true; C.rect(pen.x1 - 0.1, pen.z0, pen.x1 + 0.1, pen.z1).low = true;
    C.rect(pen.x0, pen.z1 - 0.1, (pen.x0 + pen.x1) / 2 - 1.5, pen.z1 + 0.1).low = true; C.rect((pen.x0 + pen.x1) / 2 + 1.5, pen.z1 - 0.1, pen.x1, pen.z1 + 0.1).low = true;
    const cows = [];
    for (let i = 0; i < 6; i++){
      const g = new THREE.Group(); g.userData.dyn = true; root.add(g);
      add(box(1.0, 0.95, 2.0, 1), cowMat, 0, 1.05, 0, g);
      const head = new THREE.Group(); head.position.set(0, 1.25, 1.05); head.userData.dyn = true; g.add(head);
      add(box(0.45, 0.5, 0.6, 0.6), cowMat, 0, 0, 0.22, head); add(box(0.4, 0.22, 0.2), pinkN, 0, -0.14, 0.55, head);
      [-1, 1].forEach(sd => { add(box(0.12, 0.12, 0.14), brownF, sd * 0.2, 0.08, 0.42, head); add(new THREE.ConeGeometry(0.04, 0.22, 6), mat(0xe8dcc4), sd * 0.2, 0.32, 0.12, head).rotation.z = -sd * 0.7; });
      [[-0.35, 0.7], [0.35, 0.7], [-0.35, -0.7], [0.35, -0.7]].forEach(([lx, lz]) => { add(new THREE.CylinderGeometry(0.09, 0.08, 0.62, 6), cowMat, lx, 0.31, lz, g); add(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 6), hoof, lx, 0.04, lz, g); });
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4), cowMat, 0, 1.0, -1.05, g).rotation.x = 0.25;
      const c = {g, head, x:pen.x0 + 4 + rnd() * (pen.x1 - pen.x0 - 8), z:pen.z0 + 3 + rnd() * (pen.z1 - pen.z0 - 6), yaw:rnd() * 6.3, t:rnd() * 10, ph:rnd() * 6};
      g.position.set(c.x, 0, c.z); g.rotation.y = c.yaw; cows.push(c);
    }
    C.dynamics.push(() => cows.map(c => ({x:c.x, z:c.z, r:1.1})));
    updaters.push((dt, t) => cows.forEach(c => {
      c.t -= dt; if (c.t < 0){ c.t = 6 + rnd() * 10; c.yaw += (rnd() - 0.5) * 2; }
      const walk = c.t > 3 ? 0.35 : 0, nx = c.x + Math.sin(c.yaw) * walk * dt, nz = c.z + Math.cos(c.yaw) * walk * dt;
      if (nx > pen.x0 + 1.5 && nx < pen.x1 - 1.5 && nz > pen.z0 + 1.5 && nz < pen.z1 - 1.5){ c.x = nx; c.z = nz; } else c.yaw += Math.PI * 0.6;
      c.g.position.set(c.x, 0, c.z); world.turnToward(c.g, c.yaw, Math.min(1, dt * 1.5));
      c.head.rotation.x = walk ? 0.1 : 0.55 + Math.sin(t * 1.2 + c.ph) * 0.15;     // durunca otlar
    }));
    act(pen.x0 + (pen.x1 - pen.x0) / 2, pen.z1 + 0.8, 'İnekleri seyret', () => { hooks.sfx('blip'); toast('Normande inekleri: gözlerinin çevresindeki kahverengi "gözlükleri"yle tanınırlar. Sütlerinden Camembert yapılır.'); }, 2.6);
    person(villager(0x3a4a2a, {apron:true}), N0.x + 4, N0.z + 6, 0, 'Çiftçi Gaspard', () => talk('Gaspard', [
      'Normandiya\'ya hoş geldin! Elmalarımızdan elma şarabı (cidre) yaparız, damıtınca calvados olur.',
      'Çatımız saman: yazın serin, kışın sıcak tutar. Sırtındaki irisler kökleriyle samanı birbirine bağlar.',
      'İnekler mi? Sabah ve akşam sağılır. Bu sütle yapılan peynir köy pazarında satılır.',
    ]));
    act(N0.x + 7.5, N0.z + 5.2, 'Bir bardak elma şarabı iç', () => { hooks.sfx('coin'); toast('Cidre: hafif köpüklü, tatlı-ekşi. Elma bahçesinin tadı!'); }, 2.2);
    road([[-232, -40], [N0.x + 10, N0.z + 8]]);
  }

  /* =====================================================================
     3. BRETANYA: CARNAC MENHİRLERİ, DENİZ FENERİ, KREPÇİ
     ===================================================================== */
  let beam = null, beamMat = null;
  {
    const B0 = TERROIR.bretagne;
    // menhir sıraları: doğu-batı uzanan paralel diziler, batıya doğru boylar büyür
    const stones = [];
    for (let r = 0; r < 5; r++) for (let i = 0; i < 11; i++){
      const x = B0.x + 30 - i * 5.5 + (rnd() - 0.5) * 1.2, z = B0.z + 10 + r * 4.2 + (rnd() - 0.5) * 0.8;
      if (!land(x, z, 22)) continue;
      const h = 1.2 + i * 0.22 + rnd() * 0.6, w = 0.6 + rnd() * 0.4;
      const g = new THREE.CylinderGeometry(w * 0.6, w, h, 6, 2); const p = g.attributes.position;
      for (let k = 0; k < p.count; k++){ p.setX(k, p.getX(k) * (1 + (rnd() - 0.5) * 0.25)); p.setZ(k, p.getZ(k) * (0.6 + (rnd() - 0.5) * 0.2)); }
      g.computeVertexNormals();
      const m = add(g, granite, x, h / 2, z); m.rotation.y = rnd() * 0.6 - 0.3; m.rotation.z = (rnd() - 0.5) * 0.08;
      C.circle(x, z, w * 0.75);
      stones.push([x, z]);
    }
    act(B0.x + 8, B0.z + 18, 'Menhire dokun', () => { hooks.sfx('chime'); toast('Carnac\'ın taşları 6000 yıllık. Kimin, neden dizdiğini kimse bilmiyor.', 3200); }, 3);
    // deniz feneri: siyah-beyaz çizgili kule, dönen ışık huzmesi
    const [lx, lz] = LUMIERE_COAST.point(-2.0, -26);
    const LH = {x:lx, z:lz, h:24};
    const stripes = mat(0xffffff, {map:tex(64, 256, (g) => { for (let y = 0; y < 256; y += 64){ g.fillStyle = '#f4f2ec'; g.fillRect(0, y, 64, 32); g.fillStyle = '#1a1a1e'; g.fillRect(0, y + 32, 64, 32); } }), roughness:0.6});
    add(new THREE.CylinderGeometry(4.2, 5, 1.2, 20), granite, LH.x, 0.6, LH.z);
    add(new THREE.CylinderGeometry(2.0, 2.8, LH.h, 20), stripes, LH.x, 1.2 + LH.h / 2, LH.z);
    add(new THREE.CylinderGeometry(3.0, 3.0, 0.4, 20), mat(0x1a1a1e), LH.x, 1.2 + LH.h + 0.2, LH.z);
    add(new THREE.CylinderGeometry(1.5, 1.5, 2.4, 16, 1, true), mat(0xfff6d0, {roughness:0.1, emissive:0xffe8a0, emissiveIntensity:0.4, transparent:true, opacity:0.8}), LH.x, 1.6 + LH.h + 1.2, LH.z, root, false);
    add(new THREE.ConeGeometry(1.9, 1.6, 16), mat(0xa8201a, {roughness:0.5}), LH.x, 1.6 + LH.h + 3.2, LH.z);
    for (let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; add(box(0.06, 0.9, 0.06), mat(0x1a1a1e), LH.x + Math.sin(a) * 2.9, 1.6 + LH.h + 0.45, LH.z + Math.cos(a) * 2.9, root, false); }
    C.circle(LH.x, LH.z, 4.4);
    beamMat = new THREE.MeshBasicMaterial({color:0xfff2c0, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
    beam = new THREE.Group(); beam.position.set(LH.x, 1.6 + LH.h + 1.2, LH.z); beam.userData.dyn = true; root.add(beam);
    [0, Math.PI].forEach(a => { const cg = new THREE.ConeGeometry(4, 90, 16, 1, true); cg.translate(0, -45, 0); cg.rotateZ(Math.PI / 2); const m = new THREE.Mesh(cg, beamMat); m.rotation.y = a; m.userData.keep = true; beam.add(m); });
    // fener bekçisinin evi ve krepçi
    const keeper = cottage({x:LH.x + 14, z:LH.z + 6, w:8, d:6, h:3, wall:granite, roof:slateRoof, pitch:0.5, shutters:shutterBlue});
    const crep = cottage({x:B0.x + 30, z:B0.z - 8, w:9, d:6.5, h:3, rot:0, wall:granite, roof:slateRoof, pitch:0.55, shutters:shutterBlue});
    sign('Crêperie', B0.x + 30, 2.6, B0.z - 8 + 3.27, 0, 2.2, 0.5, '#1d3a6e', '#f4f2ec');
    doors.creperie = {x:crep.front[0], z:crep.front[1], ry:0};
    person(villager(0x1d3a6e), keeper.front[0] + 2, keeper.front[1] + 1, 0, 'Fener bekçisi Yann', () => talk('Yann', [
      'Kenavo! Bu fener her gece denizcilere yol gösterir: iki beyaz çakış, her on saniyede bir.',
      'Bretanya\'nın kıyıları kayalıktır, sisi yoğundur. Atalarım bu kayalarda batan gemilerin ışığını gördü.',
    ]));
    road([[-232, -150], [B0.x + 30, B0.z - 3], [B0.x - 10, B0.z + 4], [LH.x + 14, LH.z + 12]]);
  }

  /* =====================================================================
     4. NOTRE-DAME DE LUMIÈRE
     ===================================================================== */
  {
    const D0 = TERROIR.cathedral, G = new THREE.Group(); G.position.set(D0.x, 0, D0.z); root.add(G);
    const lime = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#d8cfbc'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) for (let x = (y / 16 % 2) * 16; x < 160; x += 32){ const v = 195 + rnd() * 30; g.fillStyle = `rgb(${v | 0},${v * 0.96 | 0},${v * 0.88 | 0})`; g.fillRect(x - 32 + 1, y + 1, 30, 14); } }), roughness:0.85});
    // gül pencere: vitray, gece içeriden yanar
    const roseTex = tex(256, 256, (g) => {
      g.fillStyle = '#1a1420'; g.fillRect(0, 0, 256, 256); const c = 128, cols = ['#1d3a8a', '#a8201a', '#e8b030', '#2f7a4a', '#6a2a8a'];
      for (let ring = 5; ring > 0; ring--) for (let i = 0; i < 16; i++){ const a0 = i / 16 * Math.PI * 2, a1 = (i + 1) / 16 * Math.PI * 2; g.fillStyle = cols[(i + ring) % cols.length]; g.beginPath(); g.moveTo(c, c); g.arc(c, c, ring * 24, a0 + 0.02, a1 - 0.02); g.closePath(); g.fill(); }
      g.strokeStyle = '#2a2420'; g.lineWidth = 4; for (let ring = 1; ring <= 5; ring++){ g.beginPath(); g.arc(c, c, ring * 24, 0, Math.PI * 2); g.stroke(); }
    });
    const rose = new THREE.MeshStandardMaterial({map:roseTex, emissive:0xffffff, emissiveMap:roseTex, emissiveIntensity:0.15, roughness:0.2});
    const lancet = new THREE.MeshStandardMaterial({color:0x3a4a8a, emissive:0x8a6aff, emissiveIntensity:0.12, roughness:0.15, metalness:0.3});
    const L = 70, W = 22, H = 24;
    // nef ve çatı, transept, apsis
    add(box(W, H, L), lime, 0, H / 2, -L / 2, G);
    add(gableGeo(W + 1, L, 12), slateRoof, 0, H, -L / 2, G);
    add(box(W + 22, H, 16), lime, 0, H / 2, -L * 0.62, G);
    { const tr = add(gableGeo(17, W + 23, 11), slateRoof, 0, H, -L * 0.62, G); tr.rotation.y = Math.PI / 2; }
    add(new THREE.CylinderGeometry(W / 2, W / 2, H, 16, 1, false, Math.PI / 2, Math.PI), lime, 0, H / 2, -L, G);
    add(new THREE.ConeGeometry(W / 2 + 0.5, 11, 16, 1, false, Math.PI / 2, Math.PI), slateRoof, 0, H + 5.5, -L, G);
    // dik pencereler (lancet) ve uçan payandalar
    for (let i = 0; i < 7; i++){
      const z = -6 - i * 9;
      if (Math.abs(z + L * 0.62) < 9) continue;
      [-1, 1].forEach(sd => {
        const w = add(new THREE.PlaneGeometry(2.2, 9), lancet, sd * (W / 2 + 0.02), H * 0.55, z, G, false); w.rotation.y = sd * Math.PI / 2;
        add(box(1.4, H * 0.85, 2.2), lime, sd * (W / 2 + 6), H * 0.42, z, G);
        const arc = []; for (let k = 0; k <= 8; k++){ const t = k / 8; arc.push(new THREE.Vector3(sd * (W / 2 + 6 - t * 6), H * 0.78 + Math.sin(t * Math.PI / 2) * H * 0.12, z)); }
        add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), 10, 0.45, 5), lime, 0, 0, 0, G);
        add(new THREE.ConeGeometry(0.9, 3, 6), lime, sd * (W / 2 + 6), H * 0.85 + 1.5, z, G);
      });
    }
    // batı cephesi: iki kare kule, üç kapı, gül pencere, krallar galerisi
    const T = 12;
    add(box(W + 2 * T - 4, H + 8, 6), lime, 0, (H + 8) / 2, 3, G);
    [-1, 1].forEach(sd => {
      add(box(T, H + 30, T), lime, sd * (W / 2 + T / 2 - 2), (H + 30) / 2, 3, G);
      add(box(T + 1, 1.2, T + 1), lime, sd * (W / 2 + T / 2 - 2), H + 30, 3, G);
      // çan kulesi: iki uzun sivri açıklık, kule başında korkuluklu galeri, köşelerde payanda
      for (let k = 0; k < 2; k++) add(new THREE.PlaneGeometry(1.6, 9), mat(0x1a1612), sd * (W / 2 + T / 2 - 2) + (k - 0.5) * 3.6, H + 18, 3 + T / 2 + 0.02, G, false);
      for (let k = 0; k < 2; k++) add(new THREE.ConeGeometry(0.85, 1.6, 4), lime, sd * (W / 2 + T / 2 - 2) + (k - 0.5) * 3.6, H + 23.3, 3 + T / 2 - 0.3, G).rotation.y = Math.PI / 4;
      [-1, 1].forEach(k => add(box(1.2, H + 26, 1.4), lime, sd * (W / 2 + T / 2 - 2) + k * (T / 2 - 0.3), (H + 26) / 2, 3 + T / 2 + 0.5, G));
      for (let i = 0; i < 7; i++) add(box(0.3, 1.4, 0.3), lime, sd * (W / 2 + T / 2 - 2) - T / 2 + 0.6 + i * (T - 1.2) / 6, H + 31.3, 3 + T / 2 + 0.2, G);
    });
    add(new THREE.CircleGeometry(5.2, 40), rose, 0, H - 2, 6.05, G, false);
    add(new THREE.TorusGeometry(5.4, 0.45, 8, 40), lime, 0, H - 2, 6.1, G);
    for (let i = 0; i < 9; i++) add(box(1.1, 2.6, 0.8), lime, -10 + i * 2.5, H + 4.5, 6.3, G);
    add(box(W + 2 * T - 4, 0.6, 1.4), lime, 0, H + 2.8, 6.4, G); add(box(W + 2 * T - 4, 0.6, 1.4), lime, 0, 10.8, 6.4, G);
    [-1, 0, 1].forEach(k => {
      const w = k ? 4 : 5.2, x = k * (W / 2 + T / 2 - 2);
      const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, 5); s.quadraticCurveTo(-w / 2, 8.5, 0, 9.5); s.quadraticCurveTo(w / 2, 8.5, w / 2, 5); s.lineTo(w / 2, 0); s.closePath();
      add(new THREE.ShapeGeometry(s), mat(0x3e2a1a, {roughness:0.6}), x, 0, 6.05, G, false);
      for (let r = 0; r < 3; r++){ const pts = []; for (let i = 0; i <= 12; i++){ const t = i / 12 * Math.PI; pts.push(new THREE.Vector3(x - Math.cos(t) * (w / 2 + 0.4 + r * 0.45), 5 + Math.sin(t) * (4.5 + r * 0.45), 6.2 + r * 0.25)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.2, 5), lime, 0, 0, 0, G); }
    });
    // haç kesişiminde kurşun kaplı ince sivri kule (flèche)
    add(new THREE.CylinderGeometry(1.6, 2.2, 6, 8), lime, 0, H + 13, -L * 0.62, G);
    add(new THREE.ConeGeometry(1.8, 26, 8), mat(0x5a6068, {metalness:0.6, roughness:0.4}), 0, H + 16 + 13, -L * 0.62, G);
    // çörtenler (gargoyle): kule köşelerinde
    [-1, 1].forEach(sd => [-1, 1].forEach(k => { const g2 = add(box(0.6, 0.6, 2.2), granite, sd * (W / 2 + T / 2 - 2) + k * (T / 2), H + 29, 3 + T / 2 + 0.6, G); g2.rotation.x = -0.3; }));
    C.box(D0.x, D0.z - L / 2, W / 2 + 7, L / 2 + 1); C.box(D0.x, D0.z - L * 0.62, (W + 22) / 2, 8); C.box(D0.x, D0.z + 3, W / 2 + T - 2, 3.4);
    // meydan (parvis), çan ve iç mekân
    floor(60, 40, mat(0xd8d0c0, {map:Mw.stoneMat.map, roughness:0.85}), D0.x, 0.03, D0.z + 26, 0, 3);
    doors.katedral = {x:D0.x, z:D0.z + 7.6, ry:0};
    person(villager(0x1a1a1e, {beret:false}), D0.x + 7, D0.z + 14, Math.PI, 'Peder Anselme', () => talk('Peder Anselme', [
      'Notre-Dame de Lumière, Paris\'teki kardeşi gibi gotik bir katedral. Duvarları ince, pencereleri büyük: ağırlığı dışarıdaki uçan payandalar taşır.',
      'Batı cephesindeki gül pencere, güneş batarken nefin içini kırmızı ve maviye boyar.',
      'Kulelerin köşelerinde çörtenler var: yağmur suyunu duvardan uzağa fışkırtırlar. Halk onlardan biraz korkar!',
    ]));
    act(D0.x - 9, D0.z + 10, 'Çanı çal', () => { hooks.sfx('bell'); setTimeout(() => hooks.sfx('bell'), 900); toast('Ding… dong… Çan sesi bütün Lumière\'e yayılıyor.'); }, 2.4);
    updaters.push(() => { const n = world.W.night; rose.emissiveIntensity = 0.15 + n * 0.9; lancet.emissiveIntensity = 0.12 + n * 0.7; });
    road([[230, -60], [D0.x, D0.z + 40]], 5, mat(0xd8d0c0, {map:Mw.stoneMat.map, roughness:0.85}));
  }

  /* =====================================================================
     5. KÖY PAZARI (MARCHÉ)
     ===================================================================== */
  {
    const M0 = TERROIR.market;
    floor(64, 54, mat(0xb8b0a2, {map:Mw.stoneMat.map, roughness:0.9}), M0.x, 0.03, M0.z, 0, 3);
    // halles: açık ahşap direkli pazar holü, büyük kiremit çatı
    const HL = {w:30, d:16, h:4.2}, Hg = new THREE.Group(); Hg.position.set(M0.x, 0, M0.z); root.add(Hg);
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 3; j++){ const x = -HL.w / 2 + i * HL.w / 6, z = -HL.d / 2 + j * HL.d / 3; if (j > 0 && j < 3 && i > 0 && i < 6) continue; add(box(0.4, HL.h, 0.4), darkWood, x, HL.h / 2, z, Hg); add(box(0.7, 0.4, 0.7), stone, x, 0.2, z, Hg); C.circle(M0.x + x, M0.z + z, 0.35); }
    add(box(HL.w + 0.6, 0.4, HL.d + 0.6), darkWood, 0, HL.h + 0.2, 0, Hg);
    add(gableGeo(HL.d + 3, HL.w + 3, 5.2), terracotta, 0, HL.h + 0.4, 0, Hg).rotation.y = Math.PI / 2;
    // tezgâhlar
    const cheese = mat(0xf0c050, {roughness:0.55}), rind = mat(0xd8a040, {roughness:0.7}), white = mat(0xf4efe0, {roughness:0.6});
    const stallT = (x, z, items, label) => {
      add(box(4.4, 0.9, 1.4), wood, M0.x + x, 0.45, M0.z + z); C.box(M0.x + x, M0.z + z, 2.2, 0.7);
      items(M0.x + x, 0.9, M0.z + z);
      sign(label, M0.x + x, 1.25, M0.z + z + 0.72, 0, 1.8, 0.4, '#f4efe0', '#2a2016');
    };
    stallT(-9, -3, (x, y, z) => { for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 18), i % 2 ? cheese : rind, x - 1.6 + (i % 3) * 0.8, y + 0.09 + Math.floor(i / 3) * 0.19, z - 0.2); for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 14), white, x + 0.9 + (i % 2) * 0.3, y + 0.03, z + 0.1 - Math.floor(i / 2) * 0.3); const w = add(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 4), cheese, x + 1.7, y + 0.15, z + 0.2); w.rotation.y = 0.4; }, 'FROMAGERIE');
    stallT(0, -3, (x, y, z) => { const cols = [0xc8202a, 0xff8a1a, 0x5a8a2a, 0xe8c030, 0x8a3a8a]; for (let i = 0; i < 5; i++){ add(box(0.8, 0.25, 0.6), wood, x - 1.7 + i * 0.85, y + 0.12, z); for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.09, 8, 6), mat(cols[i], {roughness:0.5}), x - 1.9 + i * 0.85 + (k % 3) * 0.15, y + 0.3, z - 0.15 + Math.floor(k / 3) * 0.25); } }, 'PRIMEUR');
    stallT(9, -3, (x, y, z) => { add(box(4, 0.12, 1.2), mat(0xe8f4f8, {roughness:0.1, metalness:0.2}), x, y + 0.06, z); for (let i = 0; i < 7; i++){ const f = add(new THREE.SphereGeometry(0.12, 8, 6), mat(0x9aa8b0, {metalness:0.5, roughness:0.3}), x - 1.6 + i * 0.5, y + 0.16, z); f.scale.set(1, 0.4, 2.6); f.rotation.y = 0.2; } }, 'POISSONNERIE');
    stallT(-9, 4, (x, y, z) => { const cols = [0xe8203a, 0xffd040, 0xf4f2ec, 0xff7aa0, 0x8a5aff]; for (let i = 0; i < 5; i++){ add(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 10), mat(0x5a6068, {metalness:0.6}), x - 1.6 + i * 0.8, y + 0.2, z); for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.08, 6, 4), mat(cols[i]), x - 1.6 + i * 0.8 + Math.sin(k * 1.3) * 0.12, y + 0.55 + (k % 2) * 0.08, z + Math.cos(k * 1.3) * 0.12); } }, 'FLEURISTE');
    stallT(0, 4, (x, y, z) => { for (let i = 0; i < 6; i++) add(lathe([[0, 0], [0.09, 0], [0.09, 0.32], [0.04, 0.42], [0.04, 0.55], [0.05, 0.56]], 10), mat(i % 2 ? 0x2a4a2a : 0x5a1a2a, {roughness:0.15, metalness:0.2}), x - 1.7 + i * 0.68, y, z); }, 'VINS');
    person(villager(0xf4efe0, {apron:0x2a4a6a}), M0.x - 9, M0.z - 4.6, 0, 'Peynirci Madame Marguerite', () => talk('Madame Marguerite', [
      'Fransa\'da her köyün bir peyniri var: Normandiya\'dan Camembert, dağlardan Comté, mağaralarda olgunlaşan Roquefort… Yılın her günü için bir peynir!',
      'Bu yuvarlak beyazları her sabah çiftçi Gaspard\'ın sütünden yapıyorum. Bir dilim tadına bak: önce kokla, sonra ekmekle ye.',
    ]));
    act(M0.x - 9, M0.z - 1.6, 'Peynir tadına bak', () => { hooks.sfx('coin'); toast('Kremamsı, hafif fındıksı… Taze bagetle mükemmel.'); }, 2.2);
    person(villager(0x2a4a6a, {apron:true}), M0.x + 9, M0.z - 4.6, 0, 'Balıkçı Loïc', () => talk('Loïc', ['Bu sabah Bretanya kıyısından geldi: uskumru, levrek, istiridye! Cuma günleri bütün köy balık alır.']));
    person(lady(0x8a3a5a, 0x3a2a1a), M0.x - 9, M0.z + 6, Math.PI, 'Çiçekçi Rose', () => talk('Rose', ['Pazar günü ayini bitince herkes buraya gelir: bir demet çiçek, bir şişe şarap, bir parça peynir. Fransız usulü pazar!']));
    // meydan: çeşme, belediye binası, kafe-tütüncü
    add(lathe([[0, 0], [2.4, 0], [2.4, 0.6], [2.1, 0.6], [2.1, 0.1]], 24), stone, M0.x, 0, M0.z + 18); add(new THREE.CircleGeometry(2.1, 24), water, M0.x, 0.5, M0.z + 18, root, false).rotation.x = -Math.PI / 2;
    add(new THREE.CylinderGeometry(0.3, 0.4, 2.4, 10), stone, M0.x, 1.2, M0.z + 18); C.circle(M0.x, M0.z + 18, 2.5);
    const mairie = K.hall({x:M0.x + 26, z:M0.z + 2, w:14, d:9, h:7, rot:-Math.PI / 2, roof:'mansard', roofH:3, doorStyle:'saray'});
    sign('MAIRIE', 0, 6.2, 4.56, 0, 2.6, 0.6, '#f4efe0', '#1d2a4a', mairie.G);
    const cafe = cottage({x:M0.x - 26, z:M0.z + 4, w:10, d:8, h:4, rot:Math.PI / 2, pitch:0.3});
    sign('CAFÉ · TABAC', 0, 3.4, 4.03, 0, 2.6, 0.5, '#8a1a2a', '#f4f2ec', cafe.G);
    const plane = new THREE.IcosahedronGeometry(2.4, 1); plane.scale(1, 0.85, 1);
    grove([[M0.x - 20, M0.z - 20], [M0.x - 6, M0.z - 22], [M0.x + 8, M0.z - 22], [M0.x + 20, M0.z - 20], [M0.x - 20, M0.z + 22], [M0.x + 20, M0.z + 22]], plane, () => col.setHSL(0.25, 0.42, 0.3 + rnd() * 0.05).getHex(), {trunkH:4, trunkR:0.24, crownY:5.6, trunkColor:0x8a8068});
    road([[232, 60], [M0.x - 32, M0.z]], 5);
  }

  /* =====================================================================
     6. BEAUCE: BUĞDAY TARLALARI VE YEL DEĞİRMENİ
     ===================================================================== */
  let sails = null;
  {
    const B0 = TERROIR.beauce;
    // buğday: altın başaklı demetler, rüzgârda dalgalanır (tek InstancedMesh)
    const tuftG = mergeBufferGeometries([0, 1, 2].map(i => { const g = new THREE.PlaneGeometry(0.7, 1.1, 1, 2); g.rotateY(i * Math.PI / 3); g.translate(0, 0.55, 0); return g; }));
    const wheatTex = tex(64, 64, (g) => { g.clearRect(0, 0, 64, 64); for (let i = 0; i < 18; i++){ const x = 3 + rnd() * 58; g.strokeStyle = '#c8a040'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 64); g.lineTo(x + (rnd() - 0.5) * 6, 14); g.stroke(); g.fillStyle = '#e8c060'; g.beginPath(); g.ellipse(x + (rnd() - 0.5) * 6, 10 + rnd() * 6, 2.2, 6, 0, 0, Math.PI * 2); g.fill(); } });
    const fields = [[B0.x - 58, B0.z - 40, B0.x - 8, B0.z + 2], [B0.x + 8, B0.z - 40, B0.x + 58, B0.z - 6], [B0.x - 58, B0.z + 12, B0.x - 6, B0.z + 52]];
    const tufts = [];
    fields.forEach(([x0, z0, x1, z1]) => { floor(x1 - x0, z1 - z0, mat(0x9a7a44, {roughness:1}), (x0 + x1) / 2, 0.015, (z0 + z1) / 2); for (let x = x0 + 0.5; x < x1; x += 0.95) for (let z = z0 + 0.5; z < z1; z += 0.95) if (land(x, z, 24)) tufts.push([x + (rnd() - 0.5) * 0.4, z + (rnd() - 0.5) * 0.4]); });
    const wheat = new THREE.InstancedMesh(tuftG, world.windMat(new THREE.MeshLambertMaterial({map:wheatTex, alphaTest:0.4, side:THREE.DoubleSide}), 2.0, false), tufts.length);
    tufts.forEach(([x, z], i) => { const k = 0.85 + rnd() * 0.35; m4.compose(p3.set(x, 0, z), q.setFromEuler(e3.set(0, rnd() * 6.3, 0)), s3.set(k, k, k)); wheat.setMatrixAt(i, m4); wheat.setColorAt(i, col.setHSL(0.11 + rnd() * 0.02, 0.6, 0.62 + rnd() * 0.1).convertSRGBToLinear()); });
    wheat.receiveShadow = true; root.add(wheat);
    // saman balyaları: biçilmiş tarlada
    const baleG = new THREE.CylinderGeometry(0.75, 0.75, 1.2, 14); baleG.rotateZ(Math.PI / 2);
    floor(50, 30, mat(0xc8a860, {roughness:1}), B0.x + 33, 0.016, B0.z + 30);
    for (let i = 0; i < 9; i++){ const x = B0.x + 14 + (i % 3) * 14 + rnd() * 4, z = B0.z + 20 + Math.floor(i / 3) * 9 + rnd() * 2; if (!land(x, z, 24)) continue; const b = add(baleG, mat(0xd8b864, {map:thatch.map, roughness:1}), x, 0.75, z); b.rotation.y = rnd() * 3; C.circle(x, z, 0.85); }
    // yel değirmeni: taş gövde, döner başlık, dört kanat
    const ml = {x:B0.x, z:B0.z + 6};
    add(new THREE.CylinderGeometry(4.6, 5.6, 1.6, 24), K.grass, ml.x, -0.3, ml.z);
    C.heightFns.push((x, z) => Math.hypot(x - ml.x, z - ml.z) < 5.4 ? 0.5 : null);
    add(new THREE.CylinderGeometry(2.6, 3.4, 10, 18), mat(0xe8e0d0, {map:Mw.stoneMat.map, roughness:0.9}), ml.x, 0.5 + 5, ml.z);
    add(new THREE.ConeGeometry(3.2, 3.4, 18), thatch, ml.x, 0.5 + 10 + 1.6, ml.z);
    add(new THREE.PlaneGeometry(1.2, 2.2), mat(0x4a2e1c), ml.x, 0.5 + 1.1, ml.z + 3.42, root, false);
    C.circle(ml.x, ml.z, 3.5);
    sails = new THREE.Group(); sails.position.set(ml.x, 0.5 + 9.4, ml.z + 3.4); sails.userData.dyn = true; root.add(sails);
    add(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8), darkWood, 0, 0, -0.3, sails).rotation.x = Math.PI / 2;
    const lattice = mat(0xffffff, {map:tex(64, 256, (g) => { g.clearRect(0, 0, 64, 256); g.strokeStyle = '#6a4a2a'; g.lineWidth = 4; g.strokeRect(2, 2, 60, 252); for (let y = 16; y < 256; y += 16){ g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); } g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 256); g.stroke(); g.fillStyle = 'rgba(240,232,210,.92)'; g.fillRect(8, 8, 48, 240); }), alphaTest:0.4, side:THREE.DoubleSide, roughness:0.8});
    for (let i = 0; i < 4; i++){ const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 2; sails.add(arm); add(box(0.2, 8, 0.15), darkWood, 0, 4.2, 0, arm); add(new THREE.PlaneGeometry(1.8, 7), lattice, 1.0, 4.6, 0.05, arm, false); }
    person(villager(0xd8d0c0, {apron:true}), ml.x + 5, ml.z + 8, 0, 'Değirmenci Mathurin', () => talk('Mathurin', [
      'Beauce, Fransa\'nın ambarıdır: göz alabildiğine buğday! Rüzgâr esince değirmenim döner, taşlar buğdayı un yapar.',
      'Rüzgâr dönerse başlığı da döndürürüm ki kanatlar hep rüzgâra baksın. Bu un Paris\'teki kruvasancıya gider!',
    ]));
    act(ml.x + 2.5, ml.z + 4.5, 'Un çuvalını taşı', () => { hooks.sfx('wood'); toast('Ağır bir çuval! Mathurin: "Merci! Bu akşam ekmek bol olacak."'); }, 2.2);
    road([[178, -200], [ml.x - 4, ml.z + 12], [ml.x, ml.z + 6]]);
  }

  /* =====================================================================
     7. MONT-SAINT-MICHEL
     ===================================================================== */
  {
    const M0 = TERROIR.msm;
    // gelgit kumsalı: ıslak, parlak kum ve su birikintileri
    const wetSand = mat(0xa89c84, {roughness:0.25, metalness:0.15});
    add(new THREE.CircleGeometry(58, 48), wetSand, M0.x, 0.02, M0.z, root, false).rotation.x = -Math.PI / 2;
    for (let i = 0; i < 12; i++){ const a = rnd() * 6.3, r = 26 + rnd() * 26; const p = add(new THREE.CircleGeometry(2 + rnd() * 5, 16), water, M0.x + Math.sin(a) * r, 0.035, M0.z + Math.cos(a) * r, root, false); p.rotation.x = -Math.PI / 2; p.scale.y = 0.5 + rnd() * 0.5; }
    // kaya: gürültülü koni
    // kaya: tepesi düzlük (manastır), gövdesi gürültülü kesik koni; yarıçap y'ye göre: 26 → 9
    const rockR = y => 26 - 17 * y / 36;
    const rockG = new THREE.CylinderGeometry(9, 26, 36, 28, 10); { const p = rockG.attributes.position; for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), f = 1 + 0.08 * Math.sin(a * 5 + y * 0.2) + 0.05 * Math.sin(a * 13); p.setX(i, x * f); p.setZ(i, z * f); } rockG.computeVertexNormals(); rockG.translate(0, 18, 0); }
    add(rockG, granite, M0.x, 0, M0.z);
    // köy: kayanın eteğinde basamaklı taş evler, arduvaz çatılar
    for (let ring = 0; ring < 3; ring++){
      const y = ring * 7, r = rockR(y) + 1.2, n = 14 - ring * 3;
      for (let i = 0; i < n; i++){
        const a = i / n * Math.PI * 1.6 + Math.PI * 0.2 + ring * 0.3;
        const x = M0.x + Math.sin(a) * r, z = M0.z + Math.cos(a) * r, g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = a; root.add(g);
        add(box(4, 5, 4), ring ? granite : mat(0xe8e0d0, {map:Mw.stoneMat.map}), 0, 2.5, 0, g);
        add(gableGeo(4.6, 4.6, 2.4), slateRoof, 0, 5, 0, g);
        add(new THREE.PlaneGeometry(0.8, 1), K.winMat, 0, 3, 2.02, g, false);
      }
    }
    // surlar ve kuleler
    const wallR = 30;
    for (let i = 0; i < 20; i++){
      const a0 = i / 20 * Math.PI * 2, a1 = (i + 1) / 20 * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a0 + 0.16 + Math.PI / 2), Math.cos(a0 + 0.16 + Math.PI / 2))) < 0.2) continue;
      const x0 = M0.x + Math.sin(a0) * wallR, z0 = M0.z + Math.cos(a0) * wallR, x1 = M0.x + Math.sin(a1) * wallR, z1 = M0.z + Math.cos(a1) * wallR, len = Math.hypot(x1 - x0, z1 - z0);
      const w = add(box(len + 0.4, 6, 1.6), granite, (x0 + x1) / 2, 3, (z0 + z1) / 2); w.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
      C.box((x0 + x1) / 2, (z0 + z1) / 2, len / 2 + 0.2, 0.8, -Math.atan2(z1 - z0, x1 - x0));
      if (i % 4 === 0){ add(new THREE.CylinderGeometry(2.4, 2.6, 9, 12), granite, x0, 4.5, z0); add(new THREE.ConeGeometry(2.8, 3, 12), slateRoof, x0, 10.5, z0); C.circle(x0, z0, 2.6); }
    }
    // manastır kilisesi kayanın tepesinde: gotik koro, ince kule, altın Aziz Mikail
    const top = 36;
    add(box(18, 10, 8), mat(0xd8d0bc, {map:Mw.stoneMat.map}), M0.x, top + 5, M0.z);
    add(gableGeo(9, 19, 5), slateRoof, M0.x, top + 10, M0.z).rotation.y = Math.PI / 2;
    add(box(5, 10, 5), mat(0xd8d0bc, {map:Mw.stoneMat.map}), M0.x, top + 15, M0.z);
    add(new THREE.ConeGeometry(2.6, 22, 8), slateRoof, M0.x, top + 31, M0.z);
    const mich = new THREE.Group(); mich.position.set(M0.x, top + 42.4, M0.z); root.add(mich);
    add(new THREE.CylinderGeometry(0.2, 0.35, 1.4, 8), K.gold, 0, 0.7, 0, mich); add(new THREE.SphereGeometry(0.22, 10, 8), K.gold, 0, 1.6, 0, mich);
    [-1, 1].forEach(sd => { const wg = add(new THREE.ConeGeometry(0.35, 1.4, 4), K.gold, sd * 0.4, 1.3, -0.1, mich); wg.rotation.z = -sd * 0.5; wg.scale.z = 0.3; });
    add(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), K.gold, 0.4, 1.6, 0.2, mich).rotation.z = -0.4;
    C.circle(M0.x, M0.z, 27.5);
    // ana kapı (batı) ve Büyük Merdiven: kapıdaki görevli seni manastırın terasına çıkarır
    const gateA = -Math.PI / 2, gx = M0.x + Math.sin(gateA) * (wallR + 1.5), gz = M0.z + Math.cos(gateA) * (wallR + 1.5);
    add(box(2, 7, 5), granite, gx, 3.5, gz - 3); add(box(2, 7, 5), granite, gx, 3.5, gz + 3); add(box(2, 2, 11), granite, gx, 7, gz);
    sign('Porte du Roy', gx - 1.02, 5, gz, -Math.PI / 2, 2.4, 0.5, '#3a3630', '#f2e6c8');
    const terrace = {x:M0.x - 10, z:M0.z, y:top};
    C.heightFns.push((x, z) => Math.abs(x - terrace.x) < 3.5 && Math.abs(z - terrace.z) < 6 ? top : null);
    add(box(7, 0.5, 12), granite, terrace.x, top - 0.25, terrace.z);
    [[-3.5, 0, 0.1, 6], [3.5, 0, 0.1, 6], [0, -6, 3.5, 0.1], [0, 6, 3.5, 0.1]].forEach(([dx, dz, hw, hd]) => { add(box(hw * 2 + 0.1, 1, hd * 2 + 0.1), granite, terrace.x + dx, top + 0.5, terrace.z + dz); const o = C.box(terrace.x + dx, terrace.z + dz, hw, hd); o.y0 = top - 1; o.y1 = top + 3; });
    person(villager(0x3a2a1a, {beret:false}), gx - 3, gz + 5, -Math.PI / 2, 'Hacı Frère Michel', async () => {
      const c = await say('Frère Michel', 'Mont-Saint-Michel\'e hoş geldin, hacı! Gelgit burada çok hızlı gelir: "dörtnala koşan bir at kadar". Büyük Merdiven\'den manastıra çıkalım mı?', ['Çıkalım', 'Gelgit nedir?', 'Sonra']);
      if (c === 1){ await talk('Frère Michel', ['Ay suyu çeker, deniz çekilir: kaya kumsalın ortasında kalır. Altı saat sonra deniz geri gelir ve kaya bir ada olur.', 'Bu yüzden hacılar rehbersiz yürümezdi. Kum bazen bir bataklık gibi ayağını tutar!']); return; }
      if (c !== 0 || !heroRef) return;
      hooks.sfx('whoosh'); hooks.ui.fade(() => heroRef.teleport(terrace.x, top, terrace.z + 3, Math.PI / 2)).then(() => toast('Manastırın terası: ufukta Lumière\'in kuleleri…', 3000));
    });
    act(terrace.x, terrace.z + 3, 'Merdivenden aşağı in', () => { hooks.sfx('whoosh'); hooks.ui.fade(() => heroRef.teleport(gx - 4, 0, gz + 2, -Math.PI / 2)); }, 2.4, () => !!heroRef, top);
    road([[150, 196], [gx - 4, gz]], 4, wetSand);
  }

  /* =====================================================================
     8. CÔTE D'AZUR PLAJI
     ===================================================================== */
  {
    const z0 = TERROIR.riviera.z;
    const stripeM = (a, b) => mat(0xffffff, {map:tex(64, 64, (g) => { for (let x = 0; x < 64; x += 16){ g.fillStyle = a; g.fillRect(x, 0, 8, 64); g.fillStyle = b; g.fillRect(x + 8, 0, 8, 64); } }), roughness:0.7, side:THREE.DoubleSide});
    const stripes = [stripeM('#1d4fb8', '#f4f2ec'), stripeM('#e8203a', '#f4f2ec'), stripeM('#f2c14e', '#f4f2ec')];
    const chairBlue = mat(0x3a7acf, {roughness:0.5, metalness:0.3});
    const spots = []; for (let x = -150; x <= 150; x += 9) if (Math.abs(x - 24) > 14 && LUMIERE_COAST.dist(x, z0) < -4 && LUMIERE_COAST.dist(x, z0) > -26) spots.push(x);
    spots.forEach((x, i) => {
      const z = z0 - 1;
      if (i % 3 === 0){
        // çizgili plaj kabini
        const g = new THREE.Group(); g.position.set(x, 0, z - 4); root.add(g);
        add(box(2, 2.4, 2), stripes[i % 3], 0, 1.4, 0, g); add(gableGeo(2.4, 2.4, 0.8), mat(0xf4f2ec), 0, 2.6, 0, g);
        add(box(2.2, 0.2, 2.2), wood, 0, 0.1, 0, g); C.box(x, z - 4, 1.1, 1.1);
      } else {
        // şemsiye ve mavi şezlong
        const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
        add(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6), mat(0xf4f2ec), 0, 1.3, 0, g);
        add(new THREE.ConeGeometry(1.6, 0.6, 12, 1, true), stripes[i % 3], 0, 2.5, 0, g);
        const ch = add(box(0.7, 0.08, 1.8), chairBlue, 1.2, 0.35, 0.4, g); ch.rotation.x = -0.08;
        add(box(0.7, 0.7, 0.08), chairBlue, 1.2, 0.7, -0.45, g).rotation.x = 0.5;
        C.circle(x, z, 0.15);
        if (i % 4 === 1) add(new THREE.PlaneGeometry(0.9, 1.7), stripes[(i + 1) % 3], -1.2, 0.02, 0.6, g, false).rotation.x = -Math.PI / 2;
      }
    });
    // dondurmacı
    const gx = -60, gz = z0 - 10;
    const cart = new THREE.Group(); cart.position.set(gx, 0, gz); root.add(cart);
    add(box(1.6, 1.0, 0.9), mat(0xf4f2ec), 0, 0.9, 0, cart); add(box(1.7, 0.08, 1.0), mat(0x3a7acf), 0, 1.44, 0, cart);
    [-1, 1].forEach(sd => { const w = add(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 14), mat(0x1a1a1e), sd * 0.6, 0.35, 0.5, cart); w.rotation.x = Math.PI / 2; });
    add(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), mat(0xf4f2ec), 0, 2.2, 0, cart); add(new THREE.ConeGeometry(1.1, 0.4, 10, 1, true), stripes[1], 0, 3.0, 0, cart);
    C.box(gx, gz, 0.85, 0.5);
    person(villager(0xf4f2ec, {beret:false}), gx + 1.6, gz + 0.2, Math.PI / 2, 'Dondurmacı Lucien', async () => {
      const c = await say('Lucien', 'Bonjour! Sıcak bir günde bir dondurma? Lavanta, çilek ya da çikolata?', ['Lavanta', 'Çilek', 'Çikolata', 'Teşekkürler']);
      if (c < 3){ hooks.sfx('coin'); toast(['Lavantalı dondurma: Provence tarlalarının kokusu!', 'Çilekli dondurma: buz gibi ve tatlı.', 'Çikolatalı dondurma: güneşte hemen erimeye başladı!'][c]); }
    });
  }

  /* ================= bitiş ================= */
  K.bake();
  K.fixColors();
  let heroRef = null;
  function update(dt, t, hero){
    heroRef = hero;
    root.visible = hero.zone !== 'ic';
    if (!root.visible) return;
    const night = world.W.night, wnd = world.state.wind;
    if (sails) sails.rotation.z -= dt * (0.3 + wnd * 1.1);
    if (beam){ beam.rotation.y += dt * 0.63; beamMat.opacity = Math.max(0, night - 0.3) * 0.22; }
    K.winMat.emissiveIntensity = night * 1.8;
    updaters.forEach(fn => fn(dt, t, hero));
  }
  return {root, interact, markers, update, doors};
}
