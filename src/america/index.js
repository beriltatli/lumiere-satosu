// Yeni Dünya Adası: Amerika'ya özgü mimariden oluşan, Lumière'in güneybatısında açık denizdeki ada.
// Tasarım ve kararlar: TASARIM.md. Koordinat tablosu: landmarks.json.
//
//   buildAmerica(world, C, hooks) → {root, C, interact, markers, places, focal, update, enter, leave, near, journal}
//
// Ada Yùlóng deseniyle aynı dünyada ve aynı çarpışma alanında kurulur (ejderha inişi, kıyı sınırı, kayıt kendiliğinden
// çalışır). Oyuncu ya da kamera adaya yaklaşınca enter(): Lumière'in ağır kökleri gizlenir; uzaklaşınca leave().
import { buildIslandTerrain } from '../coast.js';
import { makeKit } from '../kit.js';
import { Terrain, AMERICA, AMERICA_COAST, RIVER, LAKE } from './core/Terrain.js';
import { makeMaterials } from './core/Materials.js';
import { Batcher } from './core/Batcher.js';
import { District } from './core/District.js';
import { bindThree, Structure, box } from './core/Structure.js';
import * as F from './core/Focal.js';
import { Rng } from './core/Rng.js';
import { STYLES } from './styles/index.js';
import { makeFlora } from './props/flora.js';
import { makeStreet } from './props/street.js';
import { makeNeon, neonLights } from './props/neon.js';
import { makeTaxis, makeLTrain, makeCableCar, makeSteamboat, makeFerry, pathOf } from './props/vehicles.js';
import { StatueOfLiberty } from './landmarks/StatueOfLiberty.js';
import { LincolnMemorial } from './landmarks/LincolnMemorial.js';
import { WashingtonMonument } from './landmarks/WashingtonMonument.js';
import { CapitolDome } from './landmarks/CapitolDome.js';
import { GatewayArch } from './landmarks/GatewayArch.js';
import { GoldenGate } from './landmarks/GoldenGate.js';
import { MountRushmore } from './landmarks/MountRushmore.js';
import LM from './landmarks.json';

export { AMERICA, AMERICA_COAST };
const AX = AMERICA.x, AZ = AMERICA.z;
const W = (x, z) => [AX + x, AZ + z];

/* ================= bölgeler (yerel koordinat) ================= */
const DISTRICTS = [
  {id:'ny', name:'New York', sub:'Manhattan ızgarası', kind:'grid', rect:{x0:158, z0:-100, x1:312, z1:4}, center:{x:236, z:-48}, block:{w:70, d:20}, avenue:12, street:8, base:0.4,
    mix:{newYorkArtDeco:0.32, chicagoModern:0.12, brownstone:0.56}, height:{min:10, max:140, sigma:44, cx:276, cz:-44}, buffer:22, seed:11,
    parks:[{x0:158, z0:-72, x1:228, z1:-24}], skip:b => b.x0 === 240 && b.z0 === -44, taxis:true},
  {id:'boston', name:'Boston', sub:'Kırmızı tuğla ve dolambaçlı sokaklar', kind:'organic', rect:{x0:236, z0:-224, x1:330, z1:-114}, center:{x:282, z:-170}, cellSize:30, warp:16, streetW:6, lotDepth:9, lotW:[8, 14],
    mix:{bostonGeorgian:1}, height:{min:9, max:18, sigma:40}, base:0.4, parks:[{x0:262, z0:-152, x1:290, z1:-124}], parkTree:'sonbahar', seed:12},
  {id:'chicago', name:'Chicago', sub:'Çelik iskelet ve göl kıyısı', kind:'grid', rect:{x0:52, z0:-224, x1:172, z1:-104}, center:{x:112, z:-164}, block:{w:54, d:54}, avenue:12, street:12, alley:6, base:0.4,
    mix:{chicagoSchool:0.45, chicagoModern:0.55}, height:{min:24, max:160, sigma:38}, buffer:16, seed:13, taxis:true},
  {id:'dc', name:'Washington', sub:'National Mall', kind:'grid', rect:{x0:136, z0:14, x1:246, z1:66}, center:{x:205, z:40}, block:{w:24, d:12}, avenue:10, street:28, base:0.4,
    mix:{capitol:1}, height:{min:14, max:22, sigma:60}, seed:14, skip:b => b.x0 < 165},
  {id:'stl', name:'St. Louis', sub:'Mississippi kıyısı', kind:'grid', rect:{x0:-58, z0:-48, x1:-4, z1:28}, center:{x:-30, z:-10}, block:{w:22, d:22}, avenue:8, street:8, base:0.8,
    mix:{chicagoSchool:0.5, brownstone:0.5}, height:{min:10, max:44, sigma:22}, seed:15},
  {id:'sf', name:'San Francisco', sub:'Tepeler ve Viktorya evleri', kind:'grid', followTerrain:true, rect:{x0:-316, z0:8, x1:-248, z1:86}, center:{x:-284, z:46}, block:{w:28, d:16}, avenue:10, street:8,
    mix:{sfVictorian:1}, height:{min:8, max:14, sigma:40}, seed:16},
  {id:'nola', name:'New Orleans', sub:'French Quarter', kind:'organic', rect:{x0:122, z0:116, x1:188, z1:170}, center:{x:154, z:142}, cellSize:30, warp:8, streetW:6, lotDepth:10, lotW:[9, 13],
    mix:{nolaColonial:1}, height:{min:7, max:12, sigma:30}, base:0.3, parks:[{x0:146, z0:136, x1:162, z1:150}], parkTree:'mese', seed:17},
  {id:'miami', name:'Miami Beach', sub:'Tropikal Art Deco', kind:'strip', line:[[244, 168], [264, 250]], side:1, depth:14, lotW:[12, 18], rect:{x0:214, z0:186, x1:270, z1:254}, center:{x:248, z:220},
    mix:{miamiDeco:1}, height:{min:10, max:24, sigma:30}, base:0.3, seed:18},
  {id:'route66', name:'Route 66', sub:'Çöl yolu', kind:'strip', followTerrain:true, line:[[-226, 96], [-112, 104]], side:1, depth:16, lotW:[26, 36], rect:{x0:-240, z0:80, x1:-100, z1:140}, center:{x:-170, z:104},
    mix:{route66:1}, height:{min:4, max:7, sigma:60}, seed:19},
];
const FLATS = [
  ...DISTRICTS.filter(d => !d.followTerrain).map(d => ({x0:d.rect.x0 - 8, z0:d.rect.z0 - 8, x1:d.rect.x1 + 8, z1:d.rect.z1 + 8, y:d.base ?? 0.4, feather:22})),
  {x0:130, z0:28, x1:280, z1:52, y:0.4, feather:14},                        // Mall
  {x0:-10, z0:-50, x1:26, z1:32, y:0.8, feather:14},                        // Arch parkı
  {x0:-176, z0:-128, x1:-124, z1:-104, y:4, feather:16},                    // Rushmore seyir terası
];
const HILLS = [[-305, 20, 18, 14], [-282, 52, 15, 12], [-306, 72, 11, 10], [-262, 32, 9, 10], [-318, -96, 20, 18], [-300, -130, 16, 20],
  [-150, -168, 30, 30], [-118, -186, 22, 22], [-188, -140, 18, 20], [-128, -128, 8, 10], [-210, 20, 10, 30], [-60, 150, 6, 30]];
const RIDGES = [{pts:[[-215, -230], [-225, -120], [-212, -20], [-230, 50]], h:14, w:18}];

export const AMERICA_PLACES = [
  ...DISTRICTS.map(d => ({id:d.id, name:d.name, sub:'Yeni Dünya · ' + d.sub, x:AX + d.center.x, z:AZ + d.center.z, r:34, height:d.height.max})),
  ...LM.landmarks.map(l => { const p = l.pos || [LM.mall.origin[0] + [0, 42, 110][l.mall], LM.mall.origin[1]]; return {id:'lm:' + l.id, name:l.name, sub:'Yeni Dünya · anıt', x:AX + p[0], z:AZ + p[1], r:22, height:l.height}; }),
];
export const onAmerica = (x, z) => Math.abs(x - AX) < 420 && Math.abs(z - AZ) < 330;

export function buildAmerica(world, C, hooks){
  const { THREE, scene } = world; bindThree(THREE);
  const root = new THREE.Group(); root.name = 'YeniDunya'; scene.add(root);
  const M = makeMaterials(THREE), lin = M.lin;
  const interact = [], markers = [], updaters = [];
  const say = (name, text) => hooks.ui.dialog([{name, text}]);
  const talk = (name, lines) => hooks.ui.dialog(lines.map(text => ({name, text})));
  const toast = (t, ms = 2800) => hooks.ui.toast(t, ms);
  const S = () => hooks.getS();
  const store = () => { const n = S().notes; n.america = n.america || {found:[], ferry:false}; return n.america; };
  const rng = new Rng(1776);

  /* ================= 1. ada zemini ================= */
  const T = new Terrain({flats:FLATS, hills:HILLS, ridges:RIDGES, desert:{x:-170, z:104, rx:78, rz:52}});
  const shore = buildIslandTerrain(world, C, AMERICA_COAST, {name:'YeniDunyaKiyi', ocean:false, sand:0xcdb68c, grass:0x8fa45a, rocks:70, seed:1776});
  root.add(shore.root);
  const flatGround = shore.root.getObjectByName('Zemin'); if (flatGround) flatGround.parent.remove(flatGround);
  const col = new THREE.Color();
  const ground = T.mesh(THREE, world.materials.groundMat.map, (lx, lz, y) => {
    const ds = T.isDesert(lx, lz); col.setRGB(0.86, 0.9, 0.8);
    if (ds < 1.25){ const k = Math.min(1, (1.25 - ds) * 2.2); col.lerp(new THREE.Color(1.25, 0.86, 0.55), k); }
    if (y > 8) col.lerp(new THREE.Color(0.62, 0.66, 0.55), Math.min(1, (y - 8) / 20));
    if (lx > 230 && lz < -110) col.multiply(new THREE.Color(1.05, 0.92, 0.75));                 // Boston: sonbahar
    if (lx > 200 && lz > 180) col.lerp(new THREE.Color(1.1, 1.05, 0.85), 0.25);                   // Florida
    return col.clone().convertSRGBToLinear();
  });
  root.add(ground);
  // yürünür zemin: yükseklik haritası (sınır kutusu dışında yok)
  C.heightFns.push((x, z) => { const lx = x - AX, lz = z - AZ; return lx > T.x0 && lx < -T.x0 && lz > T.z0 && lz < T.z0 + T.nz * T.cell ? T.at(lx, lz) : null; });

  /* ================= 2. su: göl, nehir, köprüler ================= */
  const BRIDGES = [{x:32, z:-10}, {x:34, z:-160}];
  const onBridge = (lx, lz) => BRIDGES.find(b => Math.abs(lx - b.x) < 13 && Math.abs(lz - b.z) < 4.2);
  const groundB = (x, z) => { const lx = x - AX, lz = z - AZ, b = onBridge(lx, lz); return b ? Math.max(T.at(lx, lz), 1.1) : T.at(lx, lz); };
  const waterB = new Batcher(THREE, M), street = makeStreet(THREE, M);
  { const g = new THREE.CircleGeometry(1, 48); g.rotateX(-Math.PI / 2); g.scale(LAKE.rx + 2, 1, LAKE.rz + 2); g.translate(AX + LAKE.x, -0.5, AZ + LAKE.z); waterB.add('always', 'water', g); }
  street.ribbon(waterB, 'always', 'water', RIVER.map(([x, z]) => W(x, z)), 14, () => -0.55, 0, 4);
  // kıyı çarpışması: nehir ve göl kenarları (köprülerde boşluk)
  {
    const P = pathOf(RIVER, false), o = {};
    for (let s = 0; s < P.total - 18; s += 2.4){
      P.at(s, o); const nx = Math.cos(o.yaw), nz = -Math.sin(o.yaw);
      [-1, 1].forEach(sd => { const lx = o.x + nx * sd * 7.4, lz = o.z + nz * sd * 7.4; if (onBridge(lx, lz) || T.coastDist(lx, lz) > -6) return; C.circle(AX + lx, AZ + lz, 0.9).low = true; });
    }
    for (let i = 0; i < 90; i++){ const a = i / 90 * Math.PI * 2; C.circle(AX + LAKE.x + Math.sin(a) * (LAKE.rx + 3), AZ + LAKE.z + Math.cos(a) * (LAKE.rz + 3), 1.4).low = true; }
    BRIDGES.forEach(b => {
      const g = box(28, 1.0, 9); g.translate(AX + b.x, 0.6, AZ + b.z); waterB.add('mass', 'rail', g);
      [-1, 1].forEach(sd => { const r = box(28, 1.0, 0.2); r.translate(AX + b.x, 1.6, AZ + b.z + sd * 4.4); waterB.add('mass', 'steel', r); const o2 = C.box(AX + b.x, AZ + b.z + sd * 4.4, 14, 0.15, 0); o2.low = true; });
      for (let k = -1; k <= 1; k++){ const p = new THREE.CylinderGeometry(0.7, 0.9, 3, 8); p.translate(AX + b.x + k * 9, -1.4, AZ + b.z); waterB.add('mass', 'graniteSmooth', p); }
      C.heightFns.push((x, z) => { const lx = x - AX, lz = z - AZ; return Math.abs(lx - b.x) < 14 && Math.abs(lz - b.z) < 4.3 ? 1.1 : null; });
    });
  }
  waterB.flush(root, 'su');

  /* ================= 3. odak noktaları ================= */
  const sunNoon = (() => { const el = 46 * Math.PI / 180, az = 28 * Math.PI / 180; return {x:Math.cos(el) * Math.sin(az), y:Math.sin(el), z:Math.cos(el) * Math.cos(az)}; })();
  const mall = F.axialPlan({x:AX + LM.mall.origin[0], z:AZ + LM.mall.origin[1]}, {x:LM.mall.dir[0], z:LM.mall.dir[1]}, LM.mall.length);
  // feribot rotası: Lumière iskelesinden New York iskelesine; Özgürlük Heykeli bu rotaya döner
  const NYDOCK = W(328, -34), ROUTE_IN = [-150, 640], ROUTE_LIB = W(398, -64);
  const focal = LM.landmarks.map(l => {
    const pos = l.pos ? {x:AX + l.pos[0], z:AZ + l.pos[1]} : {x:mall[l.mall].x, z:mall[l.mall].z};
    const f = {id:l.id, name:l.name, district:l.district, pos, height:l.height, viewRadius:l.viewRadius, cluster:l.cluster, approach:0, facing:0};
    if (l.facing === 'welcome') f.facing = F.welcomeYaw(pos, {x:ROUTE_LIB[0], z:ROUTE_LIB[1]});
    else if (l.facing === 'sun'){ const r = F.sunFacingYaw(sunNoon, Math.PI * 0.18); f.facing = r.yaw; f.sunDot = +r.dot.toFixed(3); }
    else f.facing = l.facing * Math.PI / 180;
    f.approach = l.approach === 'front' ? f.facing + Math.PI : l.approach * Math.PI / 180;
    if (l.mall != null) f.mallGap = +mall[l.mall].gap.toFixed(1);
    return f;
  });
  const FOC = Object.fromEntries(focal.map(f => [f.id, f]));

  /* ================= 4. bölgeler: parsel planı → görüş koridoru koruması → kurulum ================= */
  const flora = makeFlora(THREE, M, (m, k) => world.windMat(m, k, true));
  const neon = makeNeon(THREE, M);
  const X = {THREE, M, T, AX, AZ, styles:STYLES, street, flora, neon, trees:[], C};
  const districts = DISTRICTS.map(spec => new District(spec, X));
  // kıyıya taşan parseller düşer
  const lotOk = L => T.coastDist(L.lx, L.lz) < -Math.max(L.w, L.d) * 0.5 - 6 && !T.inLake(L.lx, L.lz, 8) && T.river(L.lx, L.lz).d > 12;
  districts.forEach(d => { d.plan(); d.lots = d.lots.filter(lotOk); if (d.id === 'route66') d.lots.forEach((L, i) => { L.kind = ['diner', 'gas', 'motel'][i % 3]; }); });
  // bina yüksekliği sorgusu (görünürlük taraması için): 8 m hücreli kova
  const allLots = districts.flatMap(d => d.lots), bucket = new Map(), key = (x, z) => Math.floor(x / 8) + ':' + Math.floor(z / 8);
  allLots.forEach(L => { const r = Math.hypot(L.w, L.d) / 2; for (let x = L.cx - r; x <= L.cx + r; x += 8) for (let z = L.cz - r; z <= L.cz + r; z += 8){ const k = key(x, z); if (!bucket.has(k)) bucket.set(k, []); bucket.get(k).push(L); } });
  const heightAt = (x, z) => { const list = bucket.get(key(x, z)); if (!list) return 0; let h = 0; for (const L of list){ const c = Math.cos(L.rot), s = Math.sin(L.rot), dx = x - L.cx, dz = z - L.cz, lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < L.w / 2 && Math.abs(lz) < L.d / 2) h = Math.max(h, L.h); } return h; };
  focal.forEach(f => { const before = F.occlusion(f, heightAt).ratio; const res = F.protectCorridor(f, allLots, heightAt, 0.4); f.occlusion = {before:+before.toFixed(2), after:+res.ratio.toFixed(2), passes:res.passes}; });
  const poissonBad = F.poissonCheck(focal, 120);
  F.separateApproaches(focal, 15);
  districts.forEach(d => {
    d.extra = (B, y0) => districtExtra(d, B, y0);
    d.build(root, C);
  });

  /* ---------- bölgeye özgü ekler ---------- */
  function plazaStruct(lx, lz, rot = 0){ return new Structure({id:'plaza', footprint:{x:AX + lx, z:AZ + lz, w:1, d:1, rot}, seed:rng.int(1, 999), y:T.at(lx, lz)}); }
  function districtExtra(d, B, y0){
    const P = (lx, lz, w, dd, keyM, layer = 'mass', y = y0 + 0.1, rot = 0) => street.flat(B, layer, keyM, AX + lx, y, AZ + lz, w, dd, rot);
    if (d.id === 'ny'){
      // Central Park: ağaçlar ve gölet; Times Square: neon panolar (uydurma adlar)
      for (let i = 0; i < 26; i++) X.trees.push([AX + 162 + rng.next() * 62, AZ - 70 + rng.next() * 44, 'park', y0]);
      P(196, -48, 18, 10, 'water', 'mass', y0 + 0.12);
      P(276, -34, 70, 20, 'sidewalk', 'mass', y0 + 0.11);
      const st = plazaStruct(276, -34); st.y = y0;
      [['STARLIGHT REVUE', 0xff3fa4], ['BIG APPLE PIE CO.', 0xffc35a], ['NEW WORLD TIMES', 0x29e3ff], ['JAZZ HALL', 0x9dff5c], ['SKYLINE SODA', 0xff5a3c], ['BROADWAY NIGHTS', 0xff3fa4], ['LIBERTY THEATRE', 0x29e3ff], ['CAFE MANHATTAN', 0xffc35a]]
        .forEach(([t, c], i) => { const side = i % 2 ? 1 : -1, lx = -28 + (i >> 1) * 18; st.part(B, 'mass', 'steel', box(0.4, 6 + (i % 3) * 4, 0.4), lx, (6 + (i % 3) * 4) / 2, side * 11); neon.billboard(st, lx, 8 + (i % 3) * 4, side * 10.6, side > 0 ? Math.PI : 0, t, c, 12, 5); });
      neon.tube(st, [[-3, 0], [0, 3], [3, 0], [0, -3], [-3, 0]], 0, 14, 0, 0, 0xff3fa4, 0.12);
    } else if (d.id === 'dc'){
      // Mall: çimen, yansıma havuzu (Lincoln ile Washington arası), yürüyüş yolları, ağaç sıraları
      P(205, 40, 140, 20, 'park', 'mass', y0 + 0.06);
      P(171, 40, 18, 6, 'water', 'mass', y0 + 0.12);
      [-8.5, 8.5].forEach(o => P(205, 40 + o, 140, 2.6, 'sidewalk', 'mass', y0 + 0.09));
      for (let x = 140; x < 276; x += 9) [29.5, 50.5].forEach(z => { if (Math.abs(x - 192) > 10 && x < 244) X.trees.push([AX + x, AZ + z, 'park', y0]); });
    } else if (d.id === 'boston'){
      // Old North tarzı beyaz çan kulesi: tuğla gövde, kademeli ahşap kule, sivri tepe
      const st = plazaStruct(250, -200);
      st.part(B, 'mass', 'brick', box(7, 14, 7), 0, 7, 0); st.part(B, 'mass', 'white', box(5, 5, 5), 0, 16.5, 0); st.part(B, 'mass', 'white', box(3.6, 4, 3.6), 0, 21, 0);
      st.part(B, 'mass', 'white', new THREE.CylinderGeometry(0.2, 2.2, 12, 8), 0, 29, 0); C.box(st.fp.x, st.fp.z, 3.6, 3.6);
    } else if (d.id === 'nola'){
      // Jackson Meydanı: üç sivri kuleli beyaz katedral, yosunlu meşeler, ortada atlı heykel kaidesi
      const st = plazaStruct(153, 134, 0);
      st.part(B, 'mass', 'white', box(18, 12, 10), 0, 6, 0);
      [-7, 0, 7].forEach((x, i) => { st.part(B, 'mass', 'white', box(i === 1 ? 4.6 : 3.6, i === 1 ? 18 : 15, 3.6), x, (i === 1 ? 18 : 15) / 2, 4); st.part(B, 'mass', 'rail', new THREE.ConeGeometry(i === 1 ? 2.6 : 2.0, i === 1 ? 8 : 6, 6), x, (i === 1 ? 18 : 15) + (i === 1 ? 4 : 3), 4); });
      C.box(st.fp.x, st.fp.z, 9.5, 6.5);
      for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2; X.trees.push([AX + 153 + Math.sin(a) * 7, AZ + 148 + Math.cos(a) * 7, 'mese', y0]); }
      st.part(B, 'mass', 'graniteSmooth', box(2, 2.4, 3), 0, 1.2, 14);
    } else if (d.id === 'miami'){
      // kumsal, gezinti yolu, palmiyeler, cankurtaran kulübesi
      street.ribbon(B, 'mass', 'sidewalk', d.line.map(([x, z]) => W(x, z)), 6, (x, z) => T.at(x - AX, z - AZ), 0.08);
      for (let s = 0; s < 1; s += 0.06){ const [ax, az] = d.line[0], [bx, bz] = d.line[1]; X.trees.push([AX + ax + (bx - ax) * s + 4.5, AZ + az + (bz - az) * s, 'palmiye', T.at(ax + (bx - ax) * s + 4.5, az + (bz - az) * s)]); }
      const st = plazaStruct(274, 222, -Math.PI / 2);
      ['orange', 'white'].forEach((k, i) => st.part(B, 'mass', k, box(3, 2.4, 3), 0, 2.4 + i * 0.01, 0));
      [-1, 1].forEach(a => [-1, 1].forEach(b => st.part(B, 'mass', 'white', box(0.15, 2.4, 0.15), a * 1.2, 1.2, b * 1.2)));
    } else if (d.id === 'route66'){
      // mesa kayalıkları ve saguarolar; yol tabelası
      const desertRock = M.solid(0xb5653a, {roughness:0.95, flatShading:true}); M.desertRock = desertRock;
      [[-200, 132, 16, 14], [-150, 70, 12, 10], [-120, 136, 18, 12], [-230, 66, 10, 9]].forEach(([x, z, r, h]) => {
        const g = new THREE.CylinderGeometry(r * 0.85, r, h, 9, 2), p = g.attributes.position; for (let i = 0; i < p.count; i++){ p.setX(i, p.getX(i) * (0.85 + rng.next() * 0.3)); p.setZ(i, p.getZ(i) * (0.85 + rng.next() * 0.3)); } g.computeVertexNormals();
        g.translate(AX + x, T.at(x, z) + h / 2 - 0.5, AZ + z); B.add('mass', 'desertRock', g); B.add('far', 'desertRock', g.clone()); C.circle(AX + x, AZ + z, r * 0.95);
      });
      for (let i = 0; i < 40; i++){ const x = -236 + rng.next() * 132, z = 70 + rng.next() * 68; if (Math.abs(z - 100) < 12) continue; X.trees.push([AX + x, AZ + z, 'kaktus', T.at(x, z)]); }
      const st = plazaStruct(-118, 92); st.y = T.at(-118, 92);
      st.part(B, 'mass', 'white', box(0.2, 3.4, 0.2), 0, 1.7, 0);
      neon.board(st, 0, 3.8, 0, 'ROUTE 66', 0xffc35a, 2.4, 1.4, 0);
    } else if (d.id === 'sf'){
      for (let i = 0; i < 18; i++){ const x = -326 + rng.next() * 40, z = -130 + rng.next() * 60; X.trees.push([AX + x, AZ + z, 'cam', T.at(x, z)]); }
    } else if (d.id === 'stl'){
      for (let i = 0; i < 14; i++){ const x = -6 + rng.next() * 30, z = -46 + rng.next() * 76; if (Math.abs(z + 10) < 6 || Math.abs(x - 12) < 6) continue; X.trees.push([AX + x, AZ + z, 'park', T.at(x, z)]); }
    }
  }

  /* ================= 5. anıtlar ================= */
  const LMB = {};
  const lmStructs = [];
  const mkLM = (Cls, f, extra = {}) => {
    const B = new Batcher(THREE, M), lx = f.pos.x - AX, lz = f.pos.z - AZ;
    const s = new Cls(Object.assign({THREE, focal:f, seed:rng.int(1, 999), y:extra.y ?? T.at(lx, lz)}, extra));
    s.build(B); s.colliders(C, T); lmStructs.push(s);
    LMB[f.id] = {s, groups:B.flush(root, 'anit:' + f.id), lod:null};
    if (s.inscription){ const [ix, iz] = s.world(s.inscription.lx, s.inscription.lz); interact.push({x:ix, z:iz, r:2.6, label:s.inscription.label, show:() => true, act:() => say(f.name, s.inscription.text)}); }
    return s;
  };
  // Özgürlük adacığı: kendi kıyısı olan küçük kara (kıyı sınırı oyuncuyu buraya bağlayabilsin)
  const LIB = FOC.liberty, LIB_R = 26;
  {
    const g = new THREE.CylinderGeometry(LIB_R, LIB_R + 3, 3, 40); g.translate(LIB.pos.x, -0.3, LIB.pos.z);
    const gb = new Batcher(THREE, M); gb.add('always', 'graniteSmooth', g);
    const top = new THREE.CircleGeometry(LIB_R - 1, 40); top.rotateX(-Math.PI / 2); top.translate(LIB.pos.x, 1.22, LIB.pos.z); gb.add('always', 'park', top);
    gb.flush(root, 'ozgurlukAdasi');
    C.heightFns.push((x, z) => Math.hypot(x - LIB.pos.x, z - LIB.pos.z) < LIB_R - 0.5 ? 1.2 : null);
    (C.shores = C.shores || []).push({coast:{cx:LIB.pos.x, cz:LIB.pos.z, dist:(x, z) => Math.hypot(x - LIB.pos.x, z - LIB.pos.z) - (LIB_R - 1.5)}, walkways:[]});
  }
  mkLM(StatueOfLiberty, LIB, {y:1.2});
  mkLM(LincolnMemorial, FOC.lincoln, {y:0.4});
  mkLM(WashingtonMonument, FOC.washington, {y:0.4});
  mkLM(CapitolDome, FOC.capitol, {y:0.4});
  mkLM(GatewayArch, FOC.arch, {y:0.8});
  mkLM(MountRushmore, FOC.rushmore, {y:T.at(FOC.rushmore.pos.x - AX, FOC.rushmore.pos.z - AZ) - 2});
  const GG = FOC.goldengate;
  mkLM(GoldenGate, GG, {y:0, span:38, len:62, deckY:9.5, ramp:{len:22, ground:T.at(-336, 6)}});
  // Golden Gate altındaki sis şeridi: körfez ağzı boyunca uzanan, yavaşça kayan yarı saydam katman
  const fogTex = M.tex(256, 64, (g) => { g.clearRect(0, 0, 256, 64); for (let i = 0; i < 60; i++){ const x = Math.random() * 256, y = 16 + Math.random() * 32, r = 10 + Math.random() * 24, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, [2, 1], true);
  const fogMat = new THREE.MeshBasicMaterial({map:fogTex, transparent:true, opacity:0.75, depthWrite:false, side:THREE.DoubleSide, color:0xf2f4f6});
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(140, 9), fogMat); fog.rotation.x = -Math.PI / 2 + 0.0; fog.position.set(GG.pos.x - 10, 4.5, GG.pos.z); fog.renderOrder = 3; root.add(fog);
  const fog2 = new THREE.Mesh(new THREE.PlaneGeometry(140, 7), fogMat); fog2.position.set(GG.pos.x - 10, 5, GG.pos.z); fog2.rotation.y = 0; root.add(fog2);

  /* ================= 6. otoyollar ve görüş kesimi caddeleri ================= */
  const hwB = new Batcher(THREE, M);
  const HIGHWAYS = [
    [[250, -102], [252, -118]], [[200, 4], [200, 14]], [[156, -30], [140, -60], [120, -102]],
    [[136, 40], [90, 10], [50, -10], [-4, -10]], [[-30, -48], [-62, -100], [-120, -122]], [[52, -160], [0, -160], [-60, -150], [-120, -130]],
    [[-56, 0], [-96, 56], [-112, 100]], [[-112, 100], [-170, 100], [-226, 96], [-246, 62]], [[230, 66], [200, 100], [170, 124]], [[188, 150], [222, 166], [244, 168]],
    [[-300, 8], [-336, 22]], [[-336, -82], [-320, -120], [-300, -200]],
  ];
  HIGHWAYS.forEach(pts => street.highway(hwB, pts.map(([x, z]) => W(x, z)), groundB, 9));
  // b) görüş kesimi: caddenin yönü = normalize(odak − başlangıç); cadde odağın önünde biter
  const VISTAS = [{from:[-58, -10], to:'arch', name:'Market Caddesi'}, {from:[-284, 46], to:'goldengate', name:'Lombard Yokuşu'}, {from:[-150, -60], to:'rushmore', name:'Rushmore yolu'}, {from:[300, -30], to:'liberty', name:'Battery gezinti yolu'}];
  VISTAS.forEach(v => {
    const f = FOC[v.to], start = {x:AX + v.from[0], z:AZ + v.from[1]}, dir = F.vistaDir(start, f.pos), L = Math.hypot(f.pos.x - start.x, f.pos.z - start.z) - Math.max(18, f.height * 0.5);
    if (v.to === 'liberty'){ v.dir = dir; return; }
    street.ribbon(hwB, 'mass', 'sidewalk', [[start.x, start.z], [start.x + dir.x * L, start.z + dir.z * L]], 7, groundB, 0.07, 4);
    v.dir = dir; v.length = Math.round(L);
  });
  hwB.flush(root, 'yollar');

  /* ================= 7. bitki örtüsü ================= */
  const flB = new Batcher(THREE, M);
  // genel ağaçlar: tepelerde çam, ovada park ağacı, kıyıya yakın palmiye (Florida)
  for (let k = 0; k < 2400 && X.trees.length < 900; k++){
    const lx = -340 + rng.next() * 690, lz = -240 + rng.next() * 500;
    if (T.coastDist(lx, lz) > -14 || T.river(lx, lz).d < 12 || T.inLake(lx, lz, 6) || heightAt(AX + lx, AZ + lz) > 0) continue;
    if (districts.some(d => lx > d.rect.x0 - 6 && lx < d.rect.x1 + 6 && lz > d.rect.z0 - 6 && lz < d.rect.z1 + 6) || T.isDesert(lx, lz) < 1.1) continue;
    if (HIGHWAYS.some(h => h.some(([x, z], i) => { const b = h[i + 1]; if (!b) return false; const dx = b[0] - x, dz = b[1] - z, l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((lx - x) * dx + (lz - z) * dz) / l2)); return Math.hypot(lx - x - dx * t, lz - z - dz * t) < 8; }))) continue;
    if (focal.some(f => Math.hypot(AX + lx - f.pos.x, AZ + lz - f.pos.z) < 40)) continue;
    const y = T.at(lx, lz), kind = lx > 200 && lz > 150 ? 'palmiye' : y > 9 ? 'cam' : lx > 230 && lz < -110 ? 'sonbahar' : rng.chance(0.25) ? 'cam' : 'park';
    X.trees.push([AX + lx, AZ + lz, kind, y]);
  }
  X.trees.forEach(([x, z, kind, y]) => { flora.plant(flB, kind, x, y ?? T.at(x - AX, z - AZ), z, 0.85 + rng.next() * 0.35, () => rng.next()); C.circle(x, z, kind === 'mese' ? 0.6 : 0.35); });
  // sokak lambaları: otoyol kenarları boyunca
  HIGHWAYS.forEach(h => { const P = pathOf(h.map(([x, z]) => W(x, z)), false), o = {}; for (let s = 10; s < P.total - 5; s += 34){ P.at(s, o); const nx = Math.cos(o.yaw), nz = -Math.sin(o.yaw); street.lamp(flB, o.x + nx * 5.6, groundB(o.x + nx * 5.6, o.z + nz * 5.6), o.z + nz * 5.6, o.yaw + Math.PI / 2); } });
  flB.flush(root, 'bitki');

  /* ================= 8. hareketli öğeler ================= */
  const movers = [];
  const loopsOf = (d, n) => { const out = [], R = d.rng.fork(3); const blocks = (d.blocks || []).filter(b => !b.park); for (let i = 0; i < n && blocks.length; i++){ const b = blocks[Math.floor(R.next() * blocks.length)], e = (d.street || 8) / 2 - 1.6; out.push({pts:[W(b.x0 - e, b.z0 - e), W(b.x1 + e, b.z0 - e), W(b.x1 + e, b.z1 + e), W(b.x0 - e, b.z1 + e)], y:(d.base ?? 0.4) + 0.08}); } return out; };
  const taxiLoops = districts.filter(d => d.taxis).flatMap(d => loopsOf(d, d.id === 'ny' ? 5 : 3));
  movers.push(makeTaxis(THREE, M, root, taxiLoops, 3));
  { const lb = new Batcher(THREE, M); movers.push(makeLTrain(THREE, M, lb, root, [W(45, -230), W(179, -230), W(179, -98), W(45, -98)], 0.4, 7)); lb.flush(root, 'L'); }
  {
    const sf = districts.find(d => d.id === 'sf'), x = sf.cols[1][0] - sf.avenue / 2, pts = [];
    for (let z = sf.rect.z0 - 2; z <= sf.rect.z1 + 2; z += 3){ const [wx, wz] = W(x, z); pts.push([wx, wz, T.at(x, z) + 0.12]); }
    const cb = new Batcher(THREE, M); movers.push(makeCableCar(THREE, M, cb, root, pts, n => hooks.sfx(n))); cb.flush(root, 'teleferik');
  }
  movers.push(makeSteamboat(THREE, M, root, RIVER.slice(2, 5).map(([x, z]) => W(x + 2, z)), -0.45));

  /* ================= 9. feribot: Lumière iskelesi ↔ New York ================= */
  const nyPier = shore.addPier(AMERICA_COAST.angle(NYDOCK[0], NYDOCK[1]), 30);
  const lumPier = hooks.pier;
  const ferryHome = lumPier.toW(-lumPier.hw - 6.4, lumPier.len - 14), ferry = makeFerry(THREE, M);
  ferry.position.set(ferryHome[0], -0.2, ferryHome[1]); ferry.rotation.y = lumPier.yaw + Math.PI; scene.add(ferry);
  const nyFerry = makeFerry(THREE, M); const [nfx, nfz] = nyPier.toW(nyPier.hw + 6.4, nyPier.len - 12); nyFerry.position.set(nfx, -0.2, nfz); nyFerry.rotation.y = nyPier.yaw; root.add(nyFerry);
  let heroRef = null;
  function ride(toAmerica){
    const hero = heroRef; if (!hero) return;
    if (hero.mounted) hero.dismount();
    const boat = toAmerica ? ferry : nyFerry, home = {p:boat.position.clone(), r:boat.rotation.y};
    const pts = toAmerica ? [[boat.position.x, boat.position.z], [lumPier.toW(-30, lumPier.len + 40)[0], lumPier.toW(-30, lumPier.len + 40)[1]], ROUTE_IN, [ROUTE_LIB[0] + 40, ROUTE_LIB[1] - 60], ROUTE_LIB, [LIB.pos.x + 38, LIB.pos.z + 20], [nfx + 18, nfz + 30], [nfx, nfz]]
                          : [[nfx, nfz], [nfx + 26, nfz + 20], [LIB.pos.x + 40, LIB.pos.z + 26], ROUTE_LIB, ROUTE_IN, [ferryHome[0] - 40, ferryHome[1] + 60], [ferryHome[0], ferryHome[1]]];
    const P = pathOf(pts, false), speed = 34, dur = P.total / speed, o = {}, look = new THREE.Vector3(), camP = new THREE.Vector3();
    hooks.sfx('quest'); toast(toAmerica ? 'Feribot: Yeni Dünya Adası · New York (E ile atla)' : 'Feribot: Lumière (E ile atla)', 3000);
    if (toAmerica){ const n = store(); if (!n.ferry){ n.ferry = true; hooks.save(); } }
    hooks.tour({dur, step:(t, cam) => {
      const d = Math.min(P.total, t * speed); P.at(d, o);
      boat.position.set(o.x, -0.2 + Math.sin(t * 1.2) * 0.12, o.z); boat.rotation.y = o.yaw; boat.rotation.z = Math.sin(t * 0.8) * 0.02;
      hero.obj.position.set(o.x - Math.sin(o.yaw) * 4, 3.5, o.z - Math.cos(o.yaw) * 4); hero.obj.rotation.y = o.yaw;
      // Özgürlük Heykeli'nin önünden geçerken kamera heykele döner
      const dl = Math.hypot(o.x - LIB.pos.x, o.z - LIB.pos.z), libK = Math.max(0, 1 - Math.max(0, dl - 60) / 140);
      const sx = Math.cos(o.yaw), sz = -Math.sin(o.yaw);
      camP.set(o.x - Math.sin(o.yaw) * 22 + sx * 10, 9 + libK * 8, o.z - Math.cos(o.yaw) * 22 + sz * 10);
      cam.position.lerp(camP, t < 0.1 ? 1 : 0.05);
      look.set(o.x + Math.sin(o.yaw) * 20, 4, o.z + Math.cos(o.yaw) * 20).lerp(new THREE.Vector3(LIB.pos.x, 30, LIB.pos.z), libK * 0.85);
      cam.lookAt(look);
      return d >= P.total;
    }, end:() => {
      boat.position.copy(home.p); boat.rotation.set(0, home.r, 0);
      const [ex, ez] = toAmerica ? nyPier.toW(0, nyPier.len - 4) : lumPier.toW(0, lumPier.len - 4);
      hero.teleport(ex, toAmerica ? nyPier.h : lumPier.h, ez, (toAmerica ? nyPier.yaw : lumPier.yaw) + Math.PI); hero.snapCamera = true;
      toast(toAmerica ? 'Yeni Dünya Adası\'na hoş geldin! New York, Battery iskelesi.' : 'Lumière\'e döndün.', 3000);
    }});
  }
  { const [ix, iz] = lumPier.toW(-lumPier.hw + 0.5, lumPier.len - 14); interact.push({x:ix, z:iz, r:2.8, label:'Feribota bin: Yeni Dünya Adası (New York)', show:() => !!heroRef, act:() => ride(true)}); }
  { const [ix, iz] = nyPier.toW(nyPier.hw - 0.5, nyPier.len - 12); interact.push({x:ix, z:iz, r:2.8, label:'Feribotla Lumière\'e dön', show:() => !!heroRef, act:() => ride(false)}); }
  // Özgürlük Adası'na küçük tekne
  {
    const [ix, iz] = nyPier.toW(-nyPier.hw + 0.5, nyPier.len - 6), lx = LIB.pos.x - 18, lz = LIB.pos.z + 6;
    interact.push({x:ix, z:iz, r:2.6, label:'Tekneyle Özgürlük Adası\'na geç', show:() => !!heroRef, act:() => { hooks.sfx('whoosh'); hooks.ui.fade(() => heroRef.teleport(lx, 1.2, lz, Math.PI / 2)); }});
    interact.push({x:lx, z:lz, r:2.6, label:'Tekneyle New York\'a dön', show:() => !!heroRef, act:() => { hooks.sfx('whoosh'); hooks.ui.fade(() => heroRef.teleport(ix, nyPier.h, iz, nyPier.yaw + Math.PI)); }});
  }

  /* ================= 10. rehberler ================= */
  const npcRoot = new THREE.Group(); npcRoot.name = 'YeniDunyaKisiler'; root.add(npcRoot);
  const K = makeKit(world, C, npcRoot, {seed:1492, interact, updaters, say});
  const GUIDES = [
    ['ny', 290, -18, 'Rehber Rosa (New York)', 0x2a2a3a, ['Manhattan bir ızgaradır: caddeler kuzey-güney, sokaklar doğu-batı. Bloklar uzun ve dar, üçe bir oranında.', 'Art Deco kuleleri her birkaç katta içeri çekilir; güneş sokağa insin diye. İpucu: Battery iskelesinden tekneyle Özgürlük Adası\'na geçebilirsin.']],
    ['boston', 262, -118, 'Rehber Silas (Boston)', 0x3a2a1a, ['Boston\'ın sokakları inek patikalarından doğmuş, derler; bu yüzden dolambaçlı. Tuğlalar Flaman örgüyle dizilir: bir uzun, bir kısa.', 'İpucu: sonbaharda parktaki akçaağaçlar kızıla döner. Beyaz çan kulesini bul.']],
    ['chicago', 112, -98, 'Rehber Marguerite (Chicago)', 0x1a2a3a, ['Dünyanın ilk çelik iskeletli gökdelenleri burada yükseldi. Geniş pencerelere hâlâ "Chicago penceresi" denir.', 'İpucu: yükseltilmiş "L" treni şehrin merkezini bir halka gibi çevirir; altından geçerken başını kaldır.']],
    ['dc', 205, 54, 'Rehber Benjamin (Washington)', 0x1d2a4a, ['Mall üç anıtı tek bir doğruya dizer. Lincoln ile Washington arası, Washington ile Kongre arasının altın oranla bölünmüş parçasıdır.', 'İpucu: Lincoln\'ün basamaklarına çık ve doğuya bak: dikilitaş havuzda yansır.']],
    ['stl', -8, -4, 'Rehber Josephine (St. Louis)', 0x3a1a2a, ['Kemer, ters çevrilmiş bir zincirdir. Ağırlığını yalnız basınçla taşır; bu yüzden ince görünür ama sağlamdır.', 'İpucu: nehirde çarklı gemi gezer. Market Caddesi doğrudan kemerin altına çıkar.']],
    ['rushmore', -150, -112, 'Rehber Elias (Black Hills)', 0x4a3a2a, ['Bu kayanın yüzleri öğle güneşini alacak yöne oyuldu; gün ortasında gölgeler en keskin hâlindedir.', 'İpucu: alttaki moloz eteği oymacıların dinamitle kopardığı taşlardır.']],
    ['sf', -276, 14, 'Rehber Lupe (San Francisco)', 0x2a4a3a, ['Yokuşlar o kadar dik ki teleferik kablosu sokağın altında hiç durmadan döner; araç ona kenetlenir.', 'İpucu: kuzeye yürü: turuncu köprü sisin içinden çıkar.']],
    ['route66', -168, 92, 'Rehber Hank (Route 66)', 0x6a4a2a, ['Bu yol bir zamanlar doğuyu batıya bağlardı. Diner\'da bir kahve, benzinlikte bir depo, motelde bir gece.', 'İpucu: mesalar, çölün ortasında tepesi düz kesilmiş kayalardır.']],
    ['nola', 160, 162, 'Rehber Celestine (New Orleans)', 0x2f5a3a, ['French Quarter\'ın evleri avluludur; sokağa bakan galeriler dökme demir korkulukludur. Akşam olunca caz başlar.', 'İpucu: Jackson Meydanı\'ndaki meşelerden İspanyol yosunu sarkar.']],
    ['miami', 256, 206, 'Rehber Coco (Miami Beach)', 0x29a3a0, ['Ocean Drive\'daki oteller pastel boyanır, kaş saçaklar pencereleri güneşten korur. Gece neonlar yanar.', 'İpucu: gün batımında kumsaldan otellere bak.']],
  ];
  GUIDES.forEach(([id, lx, lz, name, coat, lines], i) => {
    const g = i % 3 === 0 ? K.lady(coat, 0x3a2a1a) : K.npc({coat, hat:'yok'});
    K.placeNPC(g, AX + lx, AZ + lz, rng.next() * 6, name, () => talk(name.replace(/^Rehber /, '').replace(/ \(.*\)$/, ''), lines));
    g.position.y = groundB(AX + lx, AZ + lz);
  });
  K.bake(); K.fixColors();

  /* ================= 11. keşif ve pusula ================= */
  const places = AMERICA_PLACES;
  let top2 = new Set(), weightT = 0;
  places.forEach(p => markers.push({id:'am:' + p.id, color:'#d4af37', label:p.name, x:p.x, z:p.z, minor:true, show:() => top2.has(p.id)}));
  markers.push({id:'am:feribot', color:'#29a3e0', label:'Feribot: Yeni Dünya', x:lumPier.toW(0, lumPier.len - 14)[0], z:lumPier.toW(0, lumPier.len - 14)[1], minor:true, show:() => !!S().started && !store().ferry && !near});
  function journal(Sv){
    const n = (Sv.notes && Sv.notes.america) || {found:[]};
    return [{title:'Yeni Dünya\'yı keşfet', hint:n.ferry ? 'Bölgeleri ve anıtları bul (' + n.found.length + '/' + places.length + ')' : 'Güney iskelesindeki feribotla Yeni Dünya Adası\'na git.', done:n.found.length >= places.length, color:'#29a3e0'}];
  }

  /* ================= 12. LOD, gece, güncelleme ================= */
  const lights = neonLights(THREE, root, neon.lights, 6);
  let near = false, lumiere = [];
  const LOD_NEAR = 220, LOD_MID = 480;
  function enter(){ near = true; lumiere.forEach(o => { o.visible = false; }); }
  function leave(){ near = false; lumiere.forEach(o => { o.visible = true; }); }
  const camW = new THREE.Vector3();
  function update(dt, t, hero){
    heroRef = hero;
    const cam = world.camera; cam.getWorldPosition(camW);
    const dc = Math.hypot(camW.x - AX, camW.z - AZ), dh = Math.hypot(hero.pos.x - AX, hero.pos.z - AZ);
    const want = Math.min(dc, dh) < 470;
    if (want !== near){ want ? enter() : leave(); }
    // LOD: bölge ve anıt başına kamera uzaklığı
    districts.forEach(d => { const dd = Math.hypot(camW.x - d.centerW.x, camW.z - d.centerW.z); d.setLOD(dd < LOD_NEAR ? 'near' : dd < LOD_MID ? 'mid' : 'far'); });
    focal.forEach(f => { const L = LMB[f.id]; if (!L) return; const dd = Math.hypot(camW.x - f.pos.x, camW.z - f.pos.z), lv = dd < LOD_NEAR ? 'near' : 'far'; if (L.lod !== lv){ L.lod = lv; L.groups.detail.visible = lv === 'near'; L.groups.mass.visible = true; L.groups.far.visible = false; } });
    const night = world.W.night;
    M.night.value = night; neon.U.uNight.value = night; neon.U.uTime.value = t; street.setNight(night);
    fogTex.offset.x = t * 0.01; fogMat.opacity = 0.5 + world.W.rain * 0.3 + (world.W.clouds || 0) * 0.2;
    if (!near && dc > 900) return;
    shore.update(dt, t);
    movers.forEach(m => m(dt, t, hero));
    updaters.forEach(fn => fn(dt, t, hero));
    lights(dt, hero, night);
    // keşif
    if (S().started && dh < 520){
      const n = store();
      for (const p of places) if (!n.found.includes(p.id) && Math.hypot(hero.pos.x - p.x, hero.pos.z - p.z) < p.r){
        n.found.push(p.id); hooks.sfx('quest'); toast('Keşfedildi: ' + p.name + ' (' + n.found.length + '/' + places.length + ')', 3000); hooks.save();
        if (n.found.length === places.length) setTimeout(() => toast('Yeni Dünya\'nın bütün bölgelerini ve anıtlarını keşfettin! ★', 3600), 3000);
        break;
      }
      weightT -= dt;
      if (weightT <= 0){ weightT = 0.5; top2 = new Set(places.filter(p => !n.found.includes(p.id)).map(p => [p.id, F.focalWeight({pos:p, height:p.height}, hero.pos.x, hero.pos.z)]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0])); }
    } else if (top2.size) top2 = new Set();
  }

  const api = {
    root, C, interact, markers, places, focal, update, enter, leave, journal, districts,
    get near(){ return near; },
    /** Ana kod Lumière'in gizlenecek köklerini bildirir */
    setLumiereRoots(list){ lumiere = list; },
    /** Ses: şehir uğultusu ve dalga, oyuncunun bulunduğu yere göre */
    ambience(x, z){
      if (!near) return {city:0, surf:0};
      const lx = x - AX, lz = z - AZ, city = districts.reduce((m, d) => Math.max(m, d.height.max > 40 ? 1 - Math.min(1, Math.hypot(lx - d.center.x, lz - d.center.z) / 120) : 0), 0);
      return {city, surf:Math.max(0, 1 - Math.max(0, -T.coastDist(lx, lz)) / 40)};
    },
    regionName(x, z){ const lx = x - AX, lz = z - AZ; const d = districts.find(D => lx > D.rect.x0 - 20 && lx < D.rect.x1 + 20 && lz > D.rect.z0 - 20 && lz < D.rect.z1 + 20); return d ? d.name : 'Yeni Dünya Adası'; },
    stats(){ return {lots:allLots.length, structures:districts.reduce((s, d) => s + d.structures.length, 0), poisson:poissonBad, vistas:VISTAS.map(v => ({name:v.name, to:v.to, length:v.length, dir:v.dir && [+v.dir.x.toFixed(3), +v.dir.z.toFixed(3)]}))}; },
  };
  return api;
}
