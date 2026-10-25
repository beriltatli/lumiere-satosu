// Takımada: Lumière (Fransız adası) ve katkıcıların eklediği şehir adaları.
// Her ada src/islands/<ada-kimligi>/island.js dosyasında bir tanım dışa aktarır; Vite bu dosyaları kendiliğinden bulur,
// ana koda dokunmak gerekmez. "_" ile başlayan klasörler (ör. _sablon) yüklenmez.
// Adalar aynı dünyanın aynı noktasında (merkez 0, 0) kurulur ama aynı anda yalnız biri görünür: gemiyle gidilince
// eski ada gizlenir, yenisi ilk ziyarette kurulur. Kurallar ve API: ADA_TALIMATI.md
import { Collision } from '../game/collision.js';
import { makeCoast, buildIslandTerrain } from '../coast.js';
import { makeKit } from '../kit.js';

const modules = import.meta.glob(['./*/island.js', '!./_*/island.js'], {eager:true});
const ID_RE = /^[a-z][a-z0-9-]{1,30}$/;

/** Tanımları doğrular; hatalı olanları konsola yazıp dışarıda bırakır (oyun yine açılır). */
function collect(){
  const out = [];
  for (const [path, mod] of Object.entries(modules)){
    const folder = path.split('/')[1], def = mod && mod.default, bad = msg => console.error('[ada] ' + folder + ': ' + msg);
    if (!def || typeof def !== 'object'){ bad('island.js bir tanım nesnesini "export default" ile vermeli'); continue; }
    if (!ID_RE.test(def.id || '')){ bad('id küçük harf, rakam ve tire olmalı (ör. "kyoto")'); continue; }
    if (def.id !== folder){ bad('id (' + def.id + ') klasör adıyla aynı olmalı'); continue; }
    if (def.id === 'lumiere'){ bad('"lumiere" ana adanın kimliği'); continue; }
    if (typeof def.name !== 'string' || !def.name.trim()){ bad('name (adanın görünen adı) gerekli'); continue; }
    if (typeof def.build !== 'function'){ bad('build(ctx) işlevi gerekli'); continue; }
    if (def.at != null && !(Number.isFinite(def.at.x) && Number.isFinite(def.at.z))){ bad('at {x, z} sayı olmalı'); continue; }
    if (out.some(o => o.id === def.id)){ bad('aynı id iki kez'); continue; }
    out.push(def);
  }
  return out.sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name, 'tr'));
}
export const ISLANDS = collect();
// at:{x, z} veren adalar Lumière ve Yùlóng gibi dünyada sabit durur (hep görünür, ejderhayla uçulur); vermeyenler (0, 0)'da tek tek gösterilir.
export const ANCHORED = ISLANDS.filter(d => d.at);
const coastOf = (def, c = {}) => makeCoast(Object.assign({cx:0, cz:0, radius:300}, def.coast || {}, c));
export const ANCHORED_COASTS = ANCHORED.map((d, i) => coastOf(d, {cx:d.at.x, cz:d.at.z, fn:'coastAn' + i}));
/**
 * Harita şekli (minimap / M haritası): def.map = {rings:() => [[[x, z], ...], ...], pins:[{name, x, z}]} (adanın kendi koordinatlarında) verilirse o,
 * yoksa kıyı çizgisinin dairesi çizilir. Dönüş dünya koordinatlarındadır: {name, rings, pins}.
 */
const shapeCache = new Map();
export function mapShapeOf(def){
  if (shapeCache.has(def.id)) return shapeCache.get(def.id);
  const ax = def.at ? def.at.x : 0, az = def.at ? def.at.z : 0, M = def.map || {};
  let rings = M.rings ? M.rings() : null;
  if (!rings){ const c = coastOf(def), pts = []; for (let i = 0; i < 120; i++) pts.push(c.point(i / 120 * Math.PI * 2, 0)); rings = [pts]; }
  const out = {id:def.id, name:def.name, rings:rings.map(r => r.map(p => [p[0] + ax, p[1] + az])), pins:(M.pins || []).map(p => ({name:p.name, x:p.x + ax, z:p.z + az}))};
  shapeCache.set(def.id, out); return out;
}
/** (x, z) noktası hangi konumlu adanın kıyısına (+pay) giriyor? */
export const anchoredAt = (x, z, pad = 120) => { const i = ANCHORED_COASTS.findIndex(c => c.dist(x, z) < pad); return i < 0 ? null : ANCHORED[i]; };
export const LUMIERE = {id:'lumiere', name:'Lumière Adası', theme:'Fransız barok sarayı, 1720\'ler', author:'Lumière Şatosu'};

export function createArchipelago({world, hero, ui, audio, rooms, archery = null, sea, getS, save, env}){
  const { THREE, scene } = world;
  const built = new Map();          // id -> {def, root, C, interact, markers, updaters, update, targets, places, spawn}
  let current = 'lumiere', lumiereRoot = null, busy = false;
  const lumiereHarbor = [];          // Lumière'in iskelesi + konumlu adaların (at) etkileşimleri: onlar Lumière dünyasının parçası
  const homeMarkers = [];            // konumlu adaların pusula işaretleri (Lumière dünyasında görünür)
  /** Oyuncunun bulunduğu ada kimliği: konumlu adaların kıyısında ise o, değilse current. */
  const hereId = () => { if (current !== 'lumiere') return current; const d = anchoredAt(hero.pos.x, hero.pos.z); return d ? d.id : 'lumiere'; };

  /* ---------- liman: iskele ucunda kaptan ve gemiye biniş ---------- */
  function harbor(root, pier, list, flag){
    const cap = world.makeGuard(), u = cap.userData;
    u.armR.remove(u.armR.children[u.armR.children.length - 1]);
    const coat = new THREE.MeshStandardMaterial({color:new THREE.Color(0x1d2a4a).convertSRGBToLinear(), roughness:0.6});
    cap.traverse(o => { if (o.material === world.materials.coatMat) o.material = coat; });
    const [cx, cz] = pier.toW(-pier.hw + 0.5, pier.len - 4.5);
    cap.position.set(cx, pier.h, cz); cap.rotation.y = pier.yaw + Math.PI * 0.6; root.add(cap);
    const act = () => voyage();
    list.push({x:pier.end[0], z:pier.end[1], r:3.2, label:'Gemiye bin: adalar arası sefer', show:() => !busy, act});
    list.push({x:cx, z:cz, r:2.4, label:'Konuş: Kaptan Jean-Baptiste', show:() => !busy, act});
    if (flag) flag.color.set(0x1d3a8a);
  }

  /** Lumière'in iskelesi (sea.js) */
  harbor(sea.root, sea.pier, lumiereHarbor);

  async function voyage(){
    const here = hereId();
    const all = [LUMIERE, ...ISLANDS].filter(d => d.id !== here);
    if (!ISLANDS.length){
      await ui.dialog([
        {name:'Kaptan Jean-Baptiste', text:'La Belle Étoile yelken açmaya hazır, ama haritalarımızda henüz başka bir ada yok.'},
        {name:'Kaptan Jean-Baptiste', text:'Derler ki uzak denizlerden haritacılar geliyor: Japon kıyıları, Venedik lagünü, belki İstanbul… Yeni bir ada çizildiğinde ilk seferi ben yapacağım!'},
      ]);
      return;
    }
    let page = 0;
    for (;;){
      const slice = all.slice(page * 3, page * 3 + 3), more = all.length > (page + 1) * 3;
      const choices = slice.map(d => d.name + (d.theme ? ' · ' + d.theme : '')).concat(more ? ['Diğer adalar…'] : [], ['Vazgeç']);
      const c = await ui.dialog([{name:'Kaptan Jean-Baptiste', text:'Rüzgâr uygun! Hangi adaya yelken açalım?', choices}]);
      if (c < slice.length){ await travel(slice[c].id); return; }
      if (more && c === slice.length){ page++; continue; }
      if (!more || c === slice.length + 1) return;
      page = 0;
    }
  }

  /* ---------- Lumière'i tek kökte topla (ilk yolculukta) ---------- */
  function gatherLumiere(){
    if (lumiereRoot) return;
    lumiereRoot = new THREE.Group(); lumiereRoot.name = 'Lumiere';
    const keep = o => o.userData.shared || o.userData.island || o.userData.room || o === hero.obj || o.isCamera && !o.isCubeCamera;
    scene.children.slice().forEach(o => { if (!keep(o)) lumiereRoot.add(o); });
    lumiereRoot.userData.island = 'lumiere'; scene.add(lumiereRoot);
  }

  /* ---------- ada kurulumu ---------- */
  function buildIsland(def){
    const root = new THREE.Group(); root.name = 'Ada:' + def.id; root.userData.island = def.id; scene.add(root);
    const A = def.at || null, ax = A ? A.x : 0, az = A ? A.z : 0;     // konumlu ada: dünyada sabit, Lumière'in çarpışma alanını paylaşır
    const C = A ? env.lumiereC : new Collision();
    const T = def.terrain || {};
    const coast = A ? ANCHORED_COASTS[ANCHORED.indexOf(def)] : coastOf(def);   // dünya kıyısı (zemin, iskele)
    const lcoast = A ? coastOf(def) : coast;                                   // adanın kendi koordinatlarındaki kıyı (ctx.coast)
    const ground = world.materials.groundMat.clone(); if (T.groundColor != null) ground.color.set(T.groundColor);
    const terrain = buildIslandTerrain(world, C, coast, {name:'Kiyi:' + def.id, ground, sand:T.sand, grass:T.grass, shallow:T.shallow, deep:T.deep, rocks:T.rocks, seed:T.seed || 77, ocean:A ? false : undefined});
    root.add(terrain.root);
    const harborAngle = def.harbor ?? 0;
    const pier = terrain.addPier(harborAngle, def.pierLength || 46);
    const [sx, sz] = pier.toW(pier.hw + 5.2, pier.len - 10);
    const ship = terrain.addBoat(sx, sz, pier.yaw + Math.PI, 1.35, true, 0, 0x2a1a12); ship.bob = 0.8;
    const content = new THREE.Group(); content.name = 'Icerik:' + def.id; content.position.set(ax, 0, az); root.add(content);
    const interact = [], markers = [], updaters = [], targets = [], places = [];
    const say = (name, text) => ui.dialog([{name, text}]);
    // konumlu adada katkıcı yine kendi (0, 0) merkezli koordinatlarıyla yazar: çarpışma ve etkileşimler dünyaya kaydırılır
    const Cx = !A ? C : Object.assign(Object.create(C), {
      circle:(x, z, r, tag) => C.circle(x + ax, z + az, r, tag),
      box:(x, z, hw, hd, rot, tag) => C.box(x + ax, z + az, hw, hd, rot, tag),
      rect:(x0, z0, x1, z1, tag) => C.rect(x0 + ax, z0 + az, x1 + ax, z1 + az, tag),
      height:(x, z, y) => C.height(x + ax, z + az, y),
      blocked:(x, z, r) => C.blocked(x + ax, z + az, r),
      heightFns:{push:fn => C.heightFns.push((x, z) => fn(x - ax, z - az))},
    });
    // kitin kendi eklediği etkileşimler (placeNPC, heykel) ve kare işlevleri de ada koordinatında çalışır
    const kitInteract = !A ? interact : {push:(...o) => interact.push(...o.map(i => Object.assign(i, {x:i.x + ax, z:i.z + az})))};
    const kit = makeKit(world, Cx, content, {seed:(def.seed || 1) * 7 + 3, interact:kitInteract, updaters, say});
    const lhero = !A ? hero : {pos:{get x(){ return hero.pos.x - ax; }, get y(){ return hero.pos.y; }, get z(){ return hero.pos.z - az; }}};   // ada koordinatında oyuncu
    const island = {lhero, def, root, C, terrain, coast, pier, interact, markers, updaters, targets, places, update:null, spawn:{x:pier.end[0], z:pier.end[1], yaw:pier.yaw + Math.PI}};
    harbor(root, pier, interact, ship.g.userData.flag);
    const S = getS(); S.islands = S.islands || {}; const rec = S.islands[def.id] = S.islands[def.id] || {found:[], store:{}};
    // katkıcının kullanacağı bağlam: ADA_TALIMATI.md "ctx API" bölümü
    const ctx = {
      THREE, world, kit, root:content, C:Cx, coast:lcoast, harbor:{x:pier.end[0] - ax, z:pier.end[1] - az, angle:harborAngle, yaw:pier.yaw},
      materials:world.materials, rnd:kit.rnd,
      get W(){ return world.W; }, get wind(){ return world.state.wind; },
      ui:{say, dialog:lines => ui.dialog(lines), toast:(t, ms) => ui.toast(t, ms)},
      sfx:n => audio.sfx(n), audio,
      store:rec.store, save:() => save(),
      interact:(x, z, label, act, r = 2.4, show = () => true) => { interact.push({x:x + ax, z:z + az, r, label, show, act}); },
      marker:m => { markers.push(Object.assign({id:def.id + ':' + (m.id || markers.length), color:'#d4af37', show:() => true}, m, {x:m.x + ax, z:m.z + az})); },
      place:p => { places.push(Object.assign({}, p, {x:p.x + ax, z:p.z + az})); },
      target:t => { targets.push(Object.assign({nx:0, ny:0, nz:1, r:0.85}, t, {x:t.x + ax, z:t.z + az})); },
      room:spec => rooms.add(Object.assign({}, spec, {id:def.id + ':' + spec.id, owner:A ? 'lumiere' : def.id}, A && spec.door ? {door:Object.assign({}, spec.door, {x:spec.door.x + ax, z:spec.door.z + az})} : {})),
      callDragon:at => { if (env.callPyra) env.callPyra({x:at.x + ax, z:at.z + az, yaw:at.yaw}); },   // Pyra'yı bu noktaya çağırır
      teleport:(x, z, yaw, y) => { const wx = x + ax, wz = z + az; hero.teleport(wx, y ?? C.height(wx, wz), wz, yaw); },   // oyuncuyu adanın bir noktasına taşır
      carry:(dx, dz) => { hero.pos.x += dx; hero.pos.z += dz; },                                                       // oyuncuyu kaydırır (ör. vapur güvertesinde)
      onUpdate:fn => { updaters.push(fn); },
      hero:{get x(){ return hero.pos.x - ax; }, get z(){ return hero.pos.z - az; }, get y(){ return hero.pos.y; }},
    };
    const ret = def.build(ctx) || {};
    if (typeof ret.update === 'function') island.update = ret.update;
    // keşfedilecek yerler: ilk girişte bildirim, en yakın ikisi pusulada
    places.forEach(p => markers.push({id:def.id + ':yer:' + p.id, color:'#d4af37', label:p.name, x:p.x, z:p.z, show:() => !rec.found.includes(p.id) && nearestTwo(island).includes(p)}));
    if (!ret.keepUnbaked) kit.bake();
    kit.fixColors();
    world.atmo.patchScene(root);
    built.set(def.id, island);
    if (A){ lumiereHarbor.push(...interact); homeMarkers.push(...markers); }
    return island;
  }
  function nearestTwo(I){
    const rec = getS().islands[I.def.id];
    return I.places.filter(p => !rec.found.includes(p.id)).sort((a, b) => Math.hypot(a.x - hero.pos.x, a.z - hero.pos.z) - Math.hypot(b.x - hero.pos.x, b.z - hero.pos.z)).slice(0, 2);
  }

  /* ---------- yolculuk ---------- */
  function show(id){
    gatherLumiere();
    lumiereRoot.visible = id === 'lumiere';
    built.forEach((I, k) => { I.root.visible = k === id || id === 'lumiere' && !!I.def.at; });   // konumlu adalar Lumière dünyasında hep görünür
  }
  async function travel(id, {instant = false, at = null} = {}){
    if (busy || id === current && !at && !(id === 'lumiere' && hereId() !== 'lumiere')) return;
    const def = id === 'lumiere' ? LUMIERE : ISLANDS.find(d => d.id === id);
    if (!def){ ui.toast('Bu ada haritalarda yok', 2200); return; }
    busy = true;
    const go = () => {
      if (hero.mounted) hero.dismount();
      if (archery) archery.clear();
      let I = null;
      if (id !== 'lumiere'){
        try { I = built.get(id) || buildIsland(def); }
        catch (e){ console.error('[ada] ' + id + ' kurulamadı:', e); ui.toast(def.name + ' yüklenemedi; Lumière\'e dönülüyor', 3600); id = 'lumiere'; at = null; }
      }
      const region = id === 'lumiere' || I.def.at ? 'lumiere' : id;     // konumlu adalar Lumière dünyasının parçası
      current = region; show(region);
      hero.zone = null;
      hero.C = region === 'lumiere' ? env.lumiereC : I.C;
      const sp = at || (id === 'lumiere' ? {x:sea.pier.end[0], z:sea.pier.end[1], yaw:sea.pier.yaw + Math.PI} : I.spawn);
      hero.teleport(sp.x, hero.C.height(sp.x, sp.z), sp.z, sp.yaw); hero.camDistT = 7.5; hero.camPitch = 0.3;
      const S = getS(); S.island = id === 'lumiere' ? null : id;
      env.changed && env.changed(id);
    };
    try {
      if (instant) go();
      else { ui.toast('La Belle Étoile yelken açıyor…', 2000); await ui.fade(go); }
    } finally { busy = false; }
    if (!instant){ ui.toast(id === 'lumiere' ? 'Lumière Adası · eve hoş geldin' : def.name + (def.theme ? ' · ' + def.theme : ''), 3200); audio.sfx('quest'); save(); }
  }

  /* ---------- her kare (aktif ada) ---------- */
  function update(dt, t){
    if (current !== 'lumiere'){ const I = built.get(current); if (I) run(I, dt, t); return; }
    // Lumière dünyası: konumlu adalar her kare çalışır; oyuncu birinin kıyısındaysa kayıtta oraya yazılır
    built.forEach(I => { if (I.def.at) run(I, dt, t); });
    const S = getS(), d = anchoredAt(hero.pos.x, hero.pos.z); S.island = d ? d.id : null;
  }
  function run(I, dt, t){
    I.terrain.update(dt, t);
    try {
      I.updaters.forEach(fn => fn(dt, t, I.lhero));
      if (I.update) I.update(dt, t, I.lhero);
    } catch (e){ console.error('[ada] ' + I.def.id + ' güncellenemedi:', e); I.updaters.length = 0; I.update = null; ui.toast('Adada bir hata oldu; ayrıntı konsolda', 3000); }
    const rec = getS().islands[I.def.id];
    for (const p of I.places){
      if (rec.found.includes(p.id)) continue;
      if (Math.hypot(hero.pos.x - p.x, hero.pos.z - p.z) < (p.r || 14)){ rec.found.push(p.id); audio.sfx('quest'); ui.toast('Keşfedildi: ' + p.name + ' (' + rec.found.length + '/' + I.places.length + ')', 3000); save(); }
    }
  }
  /** Kayıttan devam: kaydedilen adadaysa oraya anında geç. */
  function restore(S){
    if (S.island && S.island !== 'lumiere'){
      if (!ISLANDS.some(d => d.id === S.island)){ S.island = null; const p = sea.pier; hero.teleport(p.end[0], hero.C.height(p.end[0], p.end[1]), p.end[1], p.yaw + Math.PI); return; }
      if (ISLANDS.some(d => d.id === S.island)) travel(S.island, {instant:true, at:S.player});
      else { S.island = null; const p = sea.pier; hero.teleport(p.end[0], hero.C.height(p.end[0], p.end[1]), p.end[1], p.yaw + Math.PI); }
    }
  }
  /** Konumlu adaları (at) sırayla kurar: oyun açıldıktan sonra boşta çağrılır, ilk uçuşta takılma olmasın. */
  function warm(){
    const next = ANCHORED.find(d => !built.has(d.id)); if (!next) return;
    gatherLumiere();
    try { buildIsland(next); show(current); } catch (e){ console.error('[ada] ' + next.id + ' kurulamadı:', e); }
    if (ANCHORED.some(d => !built.has(d.id))) setTimeout(warm, 1500);
  }
  function setVisible(v){ gatherLumiere(); if (current === 'lumiere') lumiereRoot.visible = v; else { const I = built.get(current); if (I) I.root.visible = v; } }
  function journal(S){
    const out = [];
    [...built.values()].forEach(I => { const rec = S.islands && S.islands[I.def.id]; if (!rec || !I.places.length) return; out.push({title:I.def.name + ': keşif', hint:I.def.description || 'Adanın simgelerini bul. (' + rec.found.length + '/' + I.places.length + ')', done:rec.found.length >= I.places.length, color:'#d4af37'}); });
    return out;
  }
  return {
    get current(){ return current; }, get busy(){ return busy; },
    list:() => [LUMIERE, ...ISLANDS], travel, update, restore, setVisible, journal, voyage, warm, hereId,
    interact:() => current === 'lumiere' ? lumiereHarbor : (built.get(current) || {interact:[]}).interact,
    markers:() => current === 'lumiere' ? [] : (built.get(current) || {markers:[]}).markers,
    /** Haritada çizilecek ada şekilleri: Lumière dünyasında konumlu adalar, başka bir adadaysa o ada. */
    mapShapes:() => current === 'lumiere' ? ANCHORED.map(mapShapeOf) : [mapShapeOf(ISLANDS.find(d => d.id === current))],
    /** Lumière dünyasında görünen konumlu adaların pusula işaretleri. */
    homeMarkers:() => homeMarkers,
    targets:() => current === 'lumiere' ? [] : (built.get(current) || {targets:[]}).targets,
    collision:() => current === 'lumiere' ? env.lumiereC : built.get(current).C,
    /** Oyuncunun aktif katkıcı adasının kıyısına uzaklığı (ses için; Lumière'de 0). */
    dist:(x, z) => current === 'lumiere' ? 0 : built.get(current).terrain.dist(x, z),
  };
}
