// Lumière Şatosu: Kılıcın Rünleri — oyun döngüsü ve durum makinesi
import { createWorld } from './world.js';
import { buildEstate } from './estate.js';
import { buildInterior, IN } from './interior.js';
import { buildSanctuary } from './sanctuary.js';
import { buildCourt } from './court.js';
import { buildRoyal } from './royal.js';
import { buildParis } from './paris.js';
import { buildTerroir } from './terroir.js';
import { createDragonRide } from './dragonride.js';
import { buildSea } from './sea.js';
import { buildChina, CHINA_COAST } from './china.js';
import { buildAmerica, AMERICA_COAST } from './america/index.js';
import { createRooms } from './rooms.js';
import { addLumiereRooms } from './rooms-lumiere.js';
import { createArchipelago, ANCHORED_COASTS } from './islands/index.js';
import { createMinimap } from './minimap.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as fflate from 'fflate';
import { buildWorldCollision } from './game/collision.js';
import { Input } from './game/input.js';
import { Hero } from './game/hero.js';
import { Audio } from './game/audio.js';
import { UI, fmtTime } from './game/ui.js';
import { buildContent, RUNES, COIN_TOTAL } from './game/content.js';
import { freshSave, loadGame, saveGame, clearGame, loadSettings, saveSettings } from './game/save.js';

const $ = id => document.getElementById(id);
const world = createWorld($('stage'));
const { THREE, camera, renderer, composer, TEMPLE } = world;
const C = buildWorldCollision(world);
const estate = buildEstate(world, C);
const input = new Input(renderer.domElement);
const audio = new Audio();
const ui = new UI(audio);
estate.ui = ui;
const hero = new Hero(world, C, input);
const interior = buildInterior(world, {
  ui, exit:() => leaveCastle(), gaze:() => startGaze(), playHarpsichord:() => playHarpsichord(),
  cook:() => talkCook(), showKitchen:() => S.notes.cookQuest && !S.notes.coinMap && (S.notes.oranges || []).length >= 3,
});
hero.Cin = interior.C;
const sea = buildSea(world, C, {others:[CHINA_COAST, AMERICA_COAST, ...ANCHORED_COASTS]});
const sanctuary = buildSanctuary(world, C, {ui, sfx:n => audio.sfx(n), save:() => save(), getS:() => S});
const court = buildCourt(world, C, {ui, audio, sfx:n => audio.sfx(n), save:() => save(), getS:() => S, gazeSky:p => startSkyGaze(p)});
const royal = buildRoyal(world, C, {ui, audio, sfx:n => audio.sfx(n), save:() => save(), getS:() => S, tour:T => startTour(T)});
// şatonun arkası: Paris mahallesi (Haussmann bulvarı, kruvasancı, Eiffel) ve Colmar
const paris = buildParis(world, C, {ui, audio, sfx:n => audio.sfx(n), save:() => save(), getS:() => S});
// kırlar: Provence, Normandiya, Bretanya, katedral, köy pazarı, Beauce, Mont-Saint-Michel, Côte d'Azur
const terroir = buildTerroir(world, C, {ui, audio, sfx:n => audio.sfx(n), save:() => save(), getS:() => S});
if (hero.horse && hero._horseObstacle) interior.C.dynamics.push(hero._horseObstacle(true));
// Yùlóng Adası: güneydoğuda, açık denizde Çin imparatorluk adası (Pyra ile gidilir)
// bina içleri (Yùlóng Adası'ndaki salonlar, atölyeler, köy evleri): kapıda E ile girilir
const rooms = createRooms(world, {ui, enter:r => enterRoom(r), exit:r => leaveRoom(r)});
// Lumière binalarının içleri (kütüphane, opera, rasathane, hamam, mutfak, atölyeler, mahzen, saat kulesi, av köşkü, haras, ahır…)
addLumiereRooms(rooms, Object.assign({}, court.doors, royal.doors, paris.doors, terroir.doors, estate.doors, {ahir:{x:-59.4, z:4, ry:Math.PI / 2}}), {ui, sfx:n => audio.sfx(n), getS:() => S, playHarpsichord:() => playHarpsichord()});
const china = buildChina(world, C, {ui, sfx:n => audio.sfx(n), save:() => save(), getS:() => S, callPyra:at => ride.start(at), rooms});
ui.extraQuests = [S => china.journal(S)];
// Yeni Dünya Adası: güneybatıda açık denizde, güney iskelesindeki feribotla (ya da Pyra ile) gidilir
const america = buildAmerica(world, C, {ui, sfx:n => audio.sfx(n), save:() => save(), getS:() => S, tour:T => startTour(T), pier:sea.pier});
america.setLumiereRoots([world.chateau, world.garden, world.temple, estate.root, court.root, royal.root, paris.root, terroir.root, sanctuary.root, china.root]);
ui.extraQuests.push(S => america.journal(S));
const ride = createDragonRide({world, C, hero, input, ui, audio, sanctuary, hooks:{
  setMode:m => setMode(m), nextWeather:() => setWeather(nextWeather(), true),
  photo:() => { composer.render(); renderer.domElement.toBlob(b => b && world.offer('lumiere-ejderha.png', b), 'image/png'); },
  landed:(from, to) => china.pyraLanded(from, to),
  away:() => !atHome(),
}});
// katkıcı adaları (src/islands/<ada>/island.js): Lumière iskelesindeki La Belle Étoile ile gidilir.
// Hepsi dünyanın merkezinde kurulur, aynı anda yalnız biri görünür; Lumière'in güncellemeleri ve işaretleri o sırada durur.
const islands = createArchipelago({world, hero, ui, audio, rooms, sea, getS:() => S, save:() => save(), env:{lumiereC:C, callPyra:at => ride.start(at)}});
const atHome = () => islands.current === 'lumiere';
// sağ altta minimap, M tuşuyla dünya haritası
const minimap = createMinimap({hero, getMode:() => mode, sea, china, islands,
  getLook:() => ride.active ? hero.yaw : Math.atan2(hero.camTarget.x - camera.position.x, hero.camTarget.z - camera.position.z)});
ui.extraQuests.push(S => islands.journal(S));
// bütün malzemelere atmosfer yaması: sis, bulut gölgesi, yüzey çeşitliliği, temas gölgesi
world.atmo.patchScene();
const CASTLE_DOOR = {x:0, y:1, z:world.CZ + 10.6};
const castleDoorInteract = {x:0, y:1, z:world.CZ + 10.2, r:2.4, label:'Şatoya gir', show:() => true, act:() => enterCastle()};
let indoor = false, gaze = null;
// Pencerelerden görünen dış dünya: şatonun bulunduğu noktadan çekilen küp harita
const winRT = new THREE.WebGLCubeRenderTarget(256, {type:THREE.HalfFloatType});
winRT.texture.mapping = THREE.CubeRefractionMapping;
const winCam = new THREE.CubeCamera(2, 4000, winRT); winCam.position.set(0, 9, world.CZ + 2); world.scene.add(winCam);
interior.setWindowEnv(winRT.texture);
let winTimer = 0;
function captureOutside(){
  const exState = [world.chateau.visible, world.garden.visible, world.temple.visible, estate.root.visible];
  interior.root.visible = false; world.garden.visible = world.temple.visible = estate.root.visible = true; world.chateau.visible = false;
  world.applyWeather(false); world.rain.visible = false;
  const auto = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  winCam.update(renderer, world.scene);
  renderer.shadowMap.autoUpdate = auto;
  [world.chateau.visible, world.garden.visible, world.temple.visible, estate.root.visible] = exState;
  interior.root.visible = indoor;
  if (indoor) applyIndoorLight();
}
const settings = loadSettings();

let S = loadGame() || freshSave();
let mode = 'title';            // title | play | pause | workshop | cinematic | ending | photo
let content = null;
let photoCtl = null, photoBack = 'pause';
let weatherTimer = 140, nightTimer = 0, saveTimer = 0;
let gust = 0, gustT = 0;

/* ---------- muhafız fenerleri (gece) ---------- */
const lanternMat = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
world.guards.forEach(g => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lanternMat); l.position.set(0, -0.68, 0.08); g.obj.userData.armL.add(l); g.lantern = l; });
world.horses.forEach(h => { if (h.rider){ const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lanternMat); l.position.set(0, -0.68, 0.08); h.rider.userData.armL.add(l); h.lantern = l; } });
C.dynamics.push(() => world.guards.map(g => ({x:g.obj.position.x, z:g.obj.position.z, r:0.38})));
C.dynamics.push(() => world.horses.map(h => ({x:h.obj.position.x, z:h.obj.position.z, r:h.mounted ? 1.0 : 0.9})));

/* ---------- ayarlar ---------- */
function applyQuality(q){
  settings.quality = q;
  renderer.setPixelRatio(q === 'yuksek' ? Math.min(devicePixelRatio, 1.75) : q === 'orta' ? Math.min(devicePixelRatio, 1.25) : 1);
  renderer.shadowMap.enabled = q !== 'dusuk';
  world.scene.traverse(o => { if (o.material && o.material.needsUpdate !== undefined) o.material.needsUpdate = true; });
  estate.setDetail(q); world.setQuality(q);
  world.resize(); saveSettings(settings);
}
if (input.touch && !localStorage.getItem('lumiere-satosu-kayit-v1-ayar')) settings.quality = 'dusuk';
ui.chipGroup($('quality'), [['dusuk', {name:'Düşük'}], ['orta', {name:'Orta'}], ['yuksek', {name:'Yüksek'}]], settings.quality, applyQuality);
const vm = $('volMusic'), vs = $('volSfx'), sn = $('sens');
vm.value = Math.round(settings.music * 100); vs.value = Math.round(settings.sfx * 100); sn.value = Math.round(settings.sens * 100);
const syncVol = () => {
  settings.music = vm.value / 100; settings.sfx = vs.value / 100; settings.sens = sn.value / 100;
  $('volMusicOut').textContent = vm.value; $('volSfxOut').textContent = vs.value; $('sensOut').textContent = sn.value;
  audio.setVolumes(settings.music, settings.sfx); saveSettings(settings);
};
[vm, vs, sn].forEach(e => e.addEventListener('input', syncVol)); syncVol();
applyQuality(settings.quality);

/* ---------- başlık ekranı ---------- */
function refreshTitle(){
  $('btnContinue').hidden = !(S.started);
  $('bestLine').textContent = S.best ? 'En iyi süre: ' + fmtTime(S.best) + ' · ' + S.bestCoins + '/' + COIN_TOTAL + ' madalyon' : '';
}
refreshTitle();
$('btnControls').addEventListener('click', () => { $('controlsCard').hidden = !$('controlsCard').hidden; });
$('btnNew').addEventListener('click', () => newGame());
$('btnContinue').addEventListener('click', () => startPlay());
$('btnAgain').addEventListener('click', () => newGame());
$('btnFree').addEventListener('click', () => { $('ending').hidden = true; setMode('play'); });

function newGame(){
  const old = clearGame(); S = freshSave();
  if (old){ S.best = old.best; S.bestCoins = old.bestCoins; }
  saveGame(S); sessionStorage.setItem('lumiere-autostart', '1'); location.reload();
}
function setupContent(){
  content = buildContent(world, C, hero, ui, audio, S, {
    save, spawnHorse, setWeather, enterTower, leaveTower, openWorkshop, extraCoins:estate.coinSpots,
  });
}
function startPlay(){
  audio.start(); audio.setVolumes(settings.music, settings.sfx);
  $('title').hidden = true; $('hud').hidden = false; $('touch').hidden = !input.touch;
  if (!content) setupContent();
  // kaydı geri yükle
  ui.setRunes(S); ui.coins(S.coins.length);
  world.setWeather(S.weather || 'gunesli', true);
  spawnHorse(S.horse || {x:3.6, z:-11.5, yaw:-0.6});   // Étoile her zaman hazır
  const P = S.player; hero.teleport(P.x, C.height(P.x, P.z), P.z, P.yaw);
  if (S.mounted && hero.horse && !S.island) hero.mount();
  islands.restore(S);
  setTimeout(() => islands.warm(), 4000);   // konumlu adalar (İstanbul…) oyun açıldıktan sonra boşta kurulur
  if (S.finished){ applySword(); world.setPowerOn(true); }
  if (!S.started){ S.started = true; ui.toast('Ahır ustası Gaston\'u bul', 3600); }
  setMode('play'); save();
}

/* ---------- durum ---------- */
function setMode(m){
  mode = m;
  $('pause').hidden = m !== 'pause';
  $('workshop').hidden = m !== 'workshop';
  $('photo').hidden = m !== 'photo';
  $('hud').hidden = !['play'].includes(m);
  $('touch').hidden = !(input.touch && m === 'play');
  input.enabled = m === 'play' || m === 'fly';
  if (m !== 'play') ui.prompt(null);
  $('flyHud').hidden = m !== 'fly';
  if (m === 'pause' || m === 'title') save();
}
$('btnPause').addEventListener('click', () => togglePause());
$('btnResume').addEventListener('click', () => togglePause());
$('btnJournal').addEventListener('click', () => ui.journal(S, $('journal').hidden));
$('closeJournal').addEventListener('click', () => ui.journal(S, false));
$('btnTitle').addEventListener('click', () => { save(); location.reload(); });
$('btnReset').addEventListener('click', () => { $('confirmReset').hidden = false; });
$('btnResetNo').addEventListener('click', () => { $('confirmReset').hidden = true; });
$('btnResetYes').addEventListener('click', () => newGame());
/* ---------- yan görev: Aşçı Marcel'in portakalları ---------- */
const ORANGE_SPOTS = [[-41.6, 36.4], [-38.4, 46.6], [-41.4, 50.6]];
const orangeMeshes = ORANGE_SPOTS.map(([x, z]) => {
  const g = new THREE.Group(); g.position.set(x, 0.18, z);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshStandardMaterial({color:0xff8a1a, roughness:0.45, emissive:0x5a2000, emissiveIntensity:0.6})));
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), new THREE.MeshStandardMaterial({color:0x3f7d2c})); leaf.position.y = 0.17; leaf.rotation.z = 0.6; g.add(leaf);
  g.visible = false; world.scene.add(g); return g;
});
function updateOranges(dt, t){
  const got = S.notes.oranges || [];
  orangeMeshes.forEach((m, i) => {
    m.visible = !!S.notes.cookQuest && !got.includes(i) && !S.notes.coinMap && !hero.zone;
    if (!m.visible) return;
    m.position.y = 0.18 + Math.abs(Math.sin(t * 3 + i)) * 0.12; m.rotation.y += dt;
    if (Math.hypot(hero.pos.x - m.position.x, hero.pos.z - m.position.z) < 1.2){
      S.notes.oranges = got.concat(i); audio.sfx('coin');
      const n = S.notes.oranges.length; ui.toast(n < 3 ? 'Portakal ' + n + '/3' : 'Üç portakal tamam! Mutfağa götür.', 2400); save();
    }
  });
}
async function talkCook(){
  const n = (S.notes.oranges || []).length;
  if (S.notes.coinMap){ await ui.dialog([{name:'Aşçıbaşı Marcel', text:'Tart fırında! Haritayı iyi kullan; kontesin madalyonları seni bekliyor.'}]); return; }
  if (!S.notes.cookQuest){
    const c = await ui.dialog([
      {name:'Aşçıbaşı Marcel', text:'Mutfağıma kim girdi? Ah, misafir… Kusura bakma, akşam yemeği için telaştayım.'},
      {name:'Aşçıbaşı Marcel', text:'Kontesin en sevdiği portakallı tartı yapacağım ama portakal kalmadı. Portakal serasından üç olgun portakal getirir misin?', choices:['Getiririm.', 'Şimdi olmaz.']},
    ]);
    if (c === 0){ S.notes.cookQuest = true; S.notes.oranges = []; audio.sfx('quest'); ui.toast('Yan görev: Marcel\'in portakalları', 2600); save(); }
    return;
  }
  if (n < 3){ await ui.dialog([{name:'Aşçıbaşı Marcel', text:'Daha ' + (3 - n) + ' portakal lazım. Bahçenin solundaki portakal serasında, ağaçların dibine düşmüş olanlara bak.'}]); return; }
  await ui.dialog([
    {name:'Aşçıbaşı Marcel', text:'İşte bunlar! Kokusu bile yetiyor. Teşekkür ederim, dostum.'},
    {name:'Aşçıbaşı Marcel', text:'Karşılığında sana kontesin eski hazine defterini vereyim. Madalyonların yerini gösteriyor; artık pusulanda görünecekler.'},
  ]);
  S.notes.coinMap = true; audio.sfx('rune'); ui.toast('Madalyonlar pusulada!', 3000); save();
}
function coinMarkers(){
  if (!S.notes.coinMap || !content) return [];
  const list = hero.zone === 'ic'
    ? interior.coins.filter(c => !S.coins.includes(c.id) && Math.abs(c.y - hero.pos.y) < 3).map(c => ({id:'mc' + c.id, x:c.x, z:c.z}))
    : content.coins.filter(c => !c.taken && (c.zone || null) === hero.zone).map(c => ({id:'mc' + c.i, x:c.x, z:c.z}));
  return list.sort((a, b) => Math.hypot(a.x - hero.pos.x, a.z - hero.pos.z) - Math.hypot(b.x - hero.pos.x, b.z - hero.pos.z)).slice(0, 3)
    .map(c => Object.assign(c, {color:'#f3c74c', label:'Madalyon', minor:true, show:() => true}));
}

/* ---------- şatonun içi ---------- */
const exteriorGroups = [world.chateau, world.garden, world.temple, estate.root];
function setIndoor(v){
  indoor = v; interior.root.visible = v; world.atmo.setOutdoor(!v);
  exteriorGroups.forEach(g => { g.visible = !v; });
  if (!v){ world.applyWeather(true); world.flareLight.visible = true; }
}
function applyIndoorLight(){
  world.sun.intensity = 0;
  world.hemi.intensity = 0.32; world.hemi.color.set(0xfff0dc); world.hemi.groundColor.set(0x7a5a40);
  world.scene.fog.near = 400; world.scene.fog.far = 3000;
  world.rain.visible = false; world.flareLight.visible = false;
  renderer.toneMappingExposure = 0.52; world.bloom.strength = 0.14;
}
async function enterCastle(){
  await ui.fade(() => {
    hero.zone = 'ic'; setIndoor(true);
    hero.teleport(IN.x, IN.y, IN.z + (hero.mounted ? 5.6 : 7.0), Math.PI); hero.camDistT = hero.mounted ? 6 : 4.4; hero.camPitch = 0.22;
    if (hero.mounted) hero.horse.position.copy(hero.pos);
    captureOutside(); winTimer = 2;
  });
  ui.toast('Lumière Şatosu', 2200);
  if (!S.notes.castle){ S.notes.castle = true; setTimeout(() => ui.toast('Büyük merdiven yukarı çıkar', 2600), 2600); }
}
async function enterRoom(r){
  await ui.fade(() => {
    if (hero.mounted) hero.dismount();
    const sp = rooms.open(r);
    hero.zone = 'oda'; hero.C = rooms.C; indoor = true; world.atmo.setOutdoor(false);
    hero.teleport(sp.x, sp.y, sp.z, sp.yaw); hero.camDistT = 4.4; hero.camPitch = 0.22; hero.snapCamera = true;
  });
  ui.toast(r.name, 2200);
}
async function leaveRoom(r){
  await ui.fade(() => {
    rooms.close();
    hero.zone = null; hero.C = islands.collision(); indoor = false; world.atmo.setOutdoor(true); world.applyWeather(true); world.flareLight.visible = true;
    hero.teleport(r.door.x, hero.C.height(r.door.x, r.door.z), r.door.z, r.door.ry); hero.camDistT = 7.5; hero.camPitch = 0.3; hero.snapCamera = true;
  });
}
async function leaveCastle(){
  await ui.fade(() => {
    hero.zone = null; setIndoor(false);
    hero.teleport(CASTLE_DOOR.x, 1, CASTLE_DOOR.z + (hero.mounted ? 0.8 : 0), 0); hero.camDistT = hero.mounted ? 10 : 7.5; hero.camPitch = 0.32;
    if (hero.mounted) hero.horse.position.copy(hero.pos);
    else if (hero.horse && hero.horse.position.y < -20){ hero.horse.position.set(3.2, 1, CASTLE_DOOR.z + 0.5); hero.horse.rotation.y = 0; }
  });
}
function startGaze(){
  setIndoor(false); gaze = {t:0}; setMode('gaze');
  ui.toast('Teleskop · E ile dön', 2600);
}
function endGaze(){
  const g = gaze; gaze = null;
  if (g && g.tour) g.tour.end(); else if (!(g && g.sky)) setIndoor(true);
  setMode('play'); hero.snapCamera = true;
}
// sinematik gezinti (ör. gondol): T = {dur, step(t, camera) -> bitti mi, end()}
function startTour(T){ gaze = {t:0, tour:T}; setMode('gaze'); }
// rasathanenin teleskobu: kulenin tepesinden gökyüzüne bakış
function startSkyGaze(p){
  if (hero.mounted) hero.dismount();
  gaze = {t:0, sky:p}; setMode('gaze');
  ui.toast(world.W.night > 0.5 ? 'Teleskop · E ile dön' : 'Gündüz gökyüzü · E ile dön', 2600);
}
function playHarpsichord(){
  if (!audio.ctx) return;
  const m = [74, 67, 69, 71, 72, 74, 67, 67, 76, 72, 74, 76, 78, 79, 67, 67, 72, 74, 72, 71, 69, 71, 72, 71, 69, 67, 66, 67, 69, 71, 67, 69];
  const t0 = audio.ctx.currentTime + 0.05, mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  m.forEach((n, i) => { audio.pluck(mtof(n), t0 + i * 0.28, 0.16, 0.9); if (i % 4 === 0) audio.pluck(mtof(n - 24), t0 + i * 0.28, 0.12, 1.4); });
  ui.toast('♪ Minuet', 2200);
}
let pauseBack = 'play';
function togglePause(){ if (mode === 'play' || mode === 'fly'){ pauseBack = mode; setMode('pause'); } else if (mode === 'pause') setMode(pauseBack); }

/* ---------- kayıt ---------- */
function save(){
  if (!S.started) return;
  S.player = {x:hero.pos.x, y:hero.pos.y, z:hero.pos.z, yaw:hero.yaw};
  if (hero.zone === 'kule' && content) S.player = {x:content.TW.groundDoor.x, y:1, z:content.TW.groundDoor.z, yaw:content.TW.groundDoor.yaw};
  if (hero.zone === 'ic') S.player = {x:CASTLE_DOOR.x, y:1, z:CASTLE_DOOR.z, yaw:0};
  if (hero.zone === 'oda' && rooms.active){ const d = rooms.active.door; S.player = {x:d.x, y:islands.collision().height(d.x, d.z), z:d.z, yaw:d.ry}; }
  if (hero.zone === 'gecit') S.player = Object.assign({}, royal.libraryExit);
  S.mounted = hero.mounted; S.horse = hero.horse ? (hero.horse.position.y < -20 ? {x:3.2, z:CASTLE_DOOR.z + 0.5, yaw:0} : {x:hero.horse.position.x, z:hero.horse.position.z, yaw:hero.horse.rotation.y}) : null;
  S.weather = world.weatherKey; S.sword = Object.assign({}, world.swordCfg);
  saveGame(S);
}
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => { if (document.hidden){ save(); if (mode === 'play') setMode('pause'); } });

/* ---------- kancalar ---------- */
function spawnHorse(at){
  const h = at || {x:-47, z:28, yaw:0.4};
  hero.spawnHorse(h.x, h.z, h.yaw);
}
function whistleHorse(){
  if (!hero.horse || hero.mounted) return;
  if (!atHome()){ ui.toast('Étoile Lumière\'de kaldı', 1800); return; }
  if (hero.zone === 'kule'){ ui.toast('Étoile kuleye çıkamaz', 1800); return; }
  if (hero.zone === 'gecit'){ ui.toast('Étoile gizli geçide sığmaz', 1800); return; }
  const Cz = hero.zone === 'ic' ? interior.C : C, s = Math.sin(hero.yaw), c = Math.cos(hero.yaw);
  audio.sfx('whistle');
  for (const [ox, oz] of [[2.4, -1.5], [-2.4, -1.5], [0, -3], [3, 1], [-3, 1], [0, 3]]){
    const x = hero.pos.x + c * ox + s * oz, z = hero.pos.z - s * ox + c * oz;
    if (Cz.blocked(x, z, 1.0)) continue;
    const y = Cz.height(x, z, hero.pos.y + 0.5); if (Math.abs(y - hero.pos.y) > 0.8) continue;
    hero.horse.position.set(x, y, z); hero.horse.rotation.y = hero.yaw; audio.sfx('gallop');
    ui.toast('Étoile geldi · E ile bin', 2000); return;
  }
  ui.toast('Burada Étoile\'e yer yok', 1800);
}
const WEATHER_MSG = {gunesli:'Güneş açtı', bulutlu:'Gökyüzü bulutlandı', yagmurlu:'Yağmur başladı', gunbatimi:'Gün batıyor', gece:'Gece çöktü'};
function setWeather(k, announce){
  world.setWeather(k); S.weather = k; weatherTimer = 120 + Math.random() * 60; nightTimer = 0;
  if (announce) ui.toast(WEATHER_MSG[k], 2600);
}
function nextWeather(){
  const k = world.weatherKey;
  if (k === 'gunbatimi') return 'gece';
  if (k === 'gece') return 'gunesli';
  const pool = ['gunesli', 'gunesli', 'bulutlu', 'yagmurlu', 'gunbatimi'].filter(x => x !== k);
  return pool[Math.floor(Math.random() * pool.length)];
}
async function enterTower(TW){
  await ui.fade(() => {
    if (hero.mounted) hero.dismount();
    hero.zone = 'kule'; hero.teleport(TW.topSpot.x, TW.floor, TW.topSpot.z, TW.topSpot.yaw); hero.camDistT = 6;
  });
  ui.toast('Doğu kulesi balkonu', 2200);
}
async function leaveTower(TW){
  await ui.fade(() => { hero.zone = null; hero.teleport(TW.groundDoor.x, C.height(TW.groundDoor.x, TW.groundDoor.z), TW.groundDoor.z, TW.groundDoor.yaw); hero.camDistT = 7.5; });
}

/* ---------- kılıç atölyesi ve final ---------- */
function applySword(){
  Object.assign(world.swordCfg, S.sword || {}); world.buildSword(); world.applyMaterial(); world.applyGem();
}
function openWorkshop(){
  applySword();
  const cfg = world.swordCfg;
  ui.chipGroup($('wsBlade'), [['uzun', {name:'Uzun kılıç'}], ['pala', {name:'Pala'}], ['alev', {name:'Alev'}], ['genis', {name:'Geniş'}]], cfg.blade, k => { cfg.blade = k; world.buildSword(); });
  ui.chipGroup($('wsGuard'), [['hac', {name:'Haç'}], ['kanat', {name:'Kanat'}], ['halka', {name:'Halka'}]], cfg.guard, k => { cfg.guard = k; world.buildSword(); });
  ui.chipGroup($('wsMaterial'), Object.entries(world.MATERIALS), cfg.material, k => { cfg.material = k; world.applyMaterial(); }, p => p.sw);
  ui.chipGroup($('wsGem'), Object.entries(world.GEMS), cfg.gem, k => { cfg.gem = k; world.applyGem(); }, p => p.c);
  if (hero.mounted) hero.dismount();
  setMode('workshop');
  cine = {kind:'workshop', t:0};
}
$('btnAwaken').addEventListener('click', () => {
  S.sword = Object.assign({}, world.swordCfg);
  setMode('cinematic'); cine = {kind:'awaken', t:0};
  // beş rün kaideden kılıca süzülür
  orbs = RUNES.map((r, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 10), new THREE.MeshBasicMaterial({color:r.color, toneMapped:false}));
    m.userData.a = i / 5 * Math.PI * 2; world.scene.add(m); return m;
  });
  audio.sfx('awaken');
});
let cine = null, orbs = [];
function finishGame(){
  S.finished = true;
  const t = S.elapsed;
  if (!S.best || t < S.best){ S.best = t; S.bestCoins = S.coins.length; }
  $('endTime').textContent = fmtTime(t); $('endCoins').textContent = S.coins.length + '/' + COIN_TOTAL; $('endBest').textContent = fmtTime(S.best);
  save(); setMode('ending'); $('ending').hidden = false;
}

/* ---------- fotoğraf modu ---------- */
$('btnPhoto').addEventListener('click', () => {
  photoBack = 'pause'; setMode('photo');
  photoCtl = new OrbitControls(camera, renderer.domElement); photoCtl.target.copy(hero.camTarget); photoCtl.enableDamping = true; photoCtl.maxPolarAngle = Math.PI * 0.49;
  ui.chipGroup($('phWeather'), Object.entries(world.WEATHER), world.weatherKey, k => setWeather(k));
});
$('closePhoto').addEventListener('click', () => { photoCtl.dispose(); photoCtl = null; setMode(photoBack); hero.snapCamera = true; });
$('btnPng').addEventListener('click', () => { composer.render(); renderer.domElement.toBlob(b => b && world.offer('lumiere-satosu.png', b), 'image/png'); });
$('btnGlb').addEventListener('click', async () => {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const root = new THREE.Group(); root.name = 'LumiereSatosu';
  [world.chateau, world.temple, world.swordPivot, estate.root].forEach(o => root.add(o.clone(true)));
  const drop = []; root.traverse(o => { if (o.isInstancedMesh || o.isLight || o.isPoints) drop.push(o); }); drop.forEach(o => o.parent && o.parent.remove(o));
  new GLTFExporter().parse(root, buf => world.offer('lumiere-satosu-glb.zip', new Blob([fflate.zipSync({'lumiere-satosu.glb': new Uint8Array(buf)})])), e => console.error(e), {binary:true});
});

/* ---------- etkileşim seçimi ---------- */
function pickInteract(){
  const p = hero.pos; let best = null;
  const consider = (o, d) => { if (!best || d < best.d) best = {o, d}; };
  const lists = hero.zone === 'ic' ? [interior.interact] : hero.zone === 'oda' ? [rooms.inside] : !atHome() ? [rooms.outside(islands.current), islands.interact()] : [islands.interact(), rooms.outside('yulong'), rooms.outside('lumiere'), content.interact, sanctuary.interact, court.interact, royal.interact, paris.interact, terroir.interact, america.interact, china.interact, estate.interact.map(o => Object.assign(o, {zone:o.zone || null})), [castleDoorInteract]];
  for (const list of lists) for (const o of list){
    if ((o.zone || null) !== hero.zone || !o.show()) continue;
    if (o.y != null && Math.abs(p.y - o.y) > 2.2) continue;
    const d = Math.hypot(o.x - p.x, o.z - p.z); if (d < o.r) consider(o, d);
  }
  if (hero.horse && hero.zone !== 'kule' && atHome()){
    if (!hero.mounted){ const d = Math.hypot(hero.horse.position.x - p.x, hero.horse.position.z - p.z); if (d < 2.6 && Math.abs(hero.horse.position.y - p.y) < 1.5) consider({label:'Étoile\'e bin', act:() => { hero.mount(); audio.sfx('hoof'); }}, d - 1); }
    else if (!best) best = {o:{label:'Attan in', act:() => hero.dismount()}, d:0};
  }
  return best && best.o;
}

const _hm = {id:'etoile', color:'#f0e2c4', label:'Étoile', minor:true, x:0, z:0, show:() => true};
function horseMarker(){
  if (!hero.horse || hero.mounted || hero.horse.position.y < -20) return [];
  _hm.x = hero.horse.position.x; _hm.z = hero.horse.position.z; return [_hm];
}

/* ---------- döngü ---------- */
const clock = new THREE.Clock();
let titleAng = 0;
function frame(){
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  input.poll();
  const W = world.W;

  // rüzgâr: hava durumuna göre taban + esintiler
  gustT -= dt; if (gustT <= 0){ gust = Math.random() * (0.35 + W.rain * 0.4); gustT = 2 + Math.random() * 5; }
  const baseWind = {gunesli:0.28, bulutlu:0.5, yagmurlu:0.85, gunbatimi:0.32, gece:0.2}[world.weatherKey] ?? 0.3;
  const wantWind = estate.windOverride != null ? estate.windOverride : baseWind + gust;
  world.state.wind += (wantWind - world.state.wind) * Math.min(1, dt * 0.8);

  if (input.take('pause')){
    if (mode === 'play' || mode === 'pause' || mode === 'fly') togglePause();
    else if (mode === 'photo') $('closePhoto').click();
    else if (mode === 'gaze') endGaze();
    if (!$('journal').hidden) ui.journal(S, false);
  }

  if (mode === 'title'){
    titleAng += dt * 0.04;
    camera.position.set(Math.sin(titleAng) * 95, 34 + Math.sin(titleAng * 2) * 6, 20 + Math.cos(titleAng) * 95);
    camera.lookAt(0, 8, 0);
  } else if (mode === 'photo'){
    photoCtl.update();
  } else if (mode === 'gaze'){
    // teleskop: kubbenin tepesinden malikâneye geniş bir bakış
    gaze.t += dt;
    if (gaze.tour){
      if (gaze.tour.step(gaze.t, camera)){ endGaze(); }
    } else if (gaze.sky){
      const P = gaze.sky, a = gaze.t * 0.05;
      camera.position.set(P.x, P.y, P.z);
      camera.lookAt(P.x + Math.sin(a) * 40, P.y + 70 + Math.sin(gaze.t * 0.15) * 10, P.z - Math.cos(a) * 40);
    } else {
    const a = gaze.t * 0.12 + 0.6, r = 70 + Math.sin(gaze.t * 0.3) * 10;
    camera.position.set(Math.sin(a) * r, 46 + Math.sin(gaze.t * 0.2) * 6, world.CZ + 20 + Math.cos(a) * r);
    camera.lookAt(0, 4, 10);
    }
    if (gaze && gaze.t > 0.3 && (input.take('interact') || input.take('pause') || (!gaze.tour && gaze.t > 16))) endGaze();
  } else if (mode === 'play' && !ui.dialogOpen){
    hero.frozen = false;
    const rainSlow = 1 - 0.28 * W.rain;
    const sfx = (n, pos) => {
      if (n === 'step'){ const soft = pos && (estate.isSoft(pos.x, pos.z) || world.PARTERRES.some(P => pos.x > P.x0 && pos.x < P.x1 && pos.z > P.z0 && pos.z < P.z1)); audio.sfx('step', {soft}); }
      else audio.sfx(n);
    };
    hero.camYaw += 0; input.look.dx *= settings.sens; input.look.dy *= settings.sens;
    hero.update(dt, t, {rainSlow, sfx, towerCenter:content.TW, towerFloor:content.TW.floor});
    if (atHome()) content.update(dt, t);
    S.elapsed += dt;
    // etkileşim
    const it = pickInteract(); ui.prompt(it ? it.label : null);
    const fresh = performance.now() - ui.closedAt > 300;
    if (input.take('interact') && it && fresh){ ui.prompt(null); Promise.resolve(it.act()).then(() => ui.journal(S)); }
    if (input.take('journal')) ui.journal(S, $('journal').hidden);
    if (input.take('view') && hero.mounted){ hero.fp = !hero.fp; hero.snapCamera = true; ui.toast(hero.fp ? 'Birinci şahıs' : 'Üçüncü şahıs', 1200); }
    if (input.take('whistle')) whistleHorse();
    // hava döngüsü
    weatherTimer -= dt; if (weatherTimer <= 0) setWeather(nextWeather(), true);
    saveTimer -= dt; if (saveTimer <= 0){ save(); saveTimer = 6; }
    ui.stats(S.elapsed, world.WEATHER[world.weatherKey].name + ' · rüzgâr ' + Math.round(6 + world.state.wind * 40) + ' km/s');
    const look = Math.atan2(hero.camTarget.x - camera.position.x, hero.camTarget.z - camera.position.z);
    ui.compass(look, hero.pos.x, hero.pos.z, (hero.zone === 'ic' ? interior.markers : !atHome() ? islands.markers() : content.markers.concat(estate.markers || [], sanctuary.markers, court.markers, royal.markers, paris.markers, terroir.markers, america.markers, china.markers, horseMarker(), islands.homeMarkers())).concat(atHome() ? coinMarkers() : []));
    if (atHome()) updateOranges(dt, t);
  } else if (mode === 'play' && ui.dialogOpen){
    hero.frozen = true; hero.update(dt, t, {rainSlow:1, sfx:() => {}, towerCenter:content.TW, towerFloor:content.TW.floor});
    if (atHome()) content.update(dt, t);
  } else if (mode === 'fly'){
    // ejderha uçuşu: kamera ve hareket dragonride.js'te
    ride.update(dt, t);
    if (atHome()) content.update(dt, t);
    S.elapsed += dt;
    weatherTimer -= dt; if (weatherTimer <= 0) setWeather(nextWeather(), true);
    saveTimer -= dt; if (saveTimer <= 0){ save(); saveTimer = 6; }
  } else if (mode === 'workshop' || mode === 'cinematic'){
    // tapınak çevresinde yavaş dönen kamera
    cine.t += dt;
    const a = cine.t * (mode === 'cinematic' ? 0.25 : 0.12) + 0.3, r = mode === 'cinematic' ? 9 + cine.t * 0.6 : 7.5;
    camera.position.set(TEMPLE.x + Math.sin(a) * r, 4.2 + (mode === 'cinematic' ? cine.t * 0.5 : 0), TEMPLE.z - Math.cos(a) * r);
    camera.lookAt(TEMPLE.x, 5.4 + (mode === 'cinematic' ? cine.t * 0.2 : 0), TEMPLE.z);
    if (mode === 'cinematic'){
      const k = Math.min(1, cine.t / 3.2);
      orbs.forEach((o, i) => {
        const a2 = o.userData.a + cine.t * 3, rr = 1.6 * (1 - k);
        o.position.set(TEMPLE.x + Math.cos(a2) * rr, 2.6 + k * 3.6, TEMPLE.z + Math.sin(a2) * rr); o.visible = k < 1;
      });
      if (cine.t > 3.2 && !cine.lit){ cine.lit = true; world.setPowerOn(true); ui.toast('Kılıç uyandı!', 3500); }
      if (cine.t > 11){ orbs.forEach(o => world.scene.remove(o)); orbs = []; cine = null; finishGame(); }
    }
    if (atHome()) content.update(dt, t);
  }

  // fenerler
  const night = W.night > 0.5;
  world.guards.forEach(g => { g.lantern.visible = night; }); world.horses.forEach(h => { if (h.lantern) h.lantern.visible = night; });

  // gölge kutusu oyuncuyu izler (8 m ızgaraya oturur, titremez)
  if (!indoor && mode !== 'title'){
    world.sun.target.position.set(Math.round(hero.pos.x / 8) * 8, 0, Math.round(hero.pos.z / 8) * 8);
    world.sun.position.copy(world.sun.target.position).addScaledVector(W.elev > 0 ? world.sunVec : world.MOON_DIR, 250);
  }
  world.update(dt, t);
  if (atHome()){
    america.update(dt, t, hero);
    // Yeni Dünya'dayken Lumière'in kökleri gizli: güncellemeleri de durur
    if (!america.near){
      sanctuary.update(dt, t, hero);
      court.update(dt, t, hero);
      royal.update(dt, t, hero);
      paris.update(dt, t, hero);
      terroir.update(dt, t, hero);
    }
    sea.update(dt, t, hero, indoor);
    if (!america.near) china.update(dt, t, hero);
    estate.indoor = indoor;
    estate.update(dt, t, hero);
    interior.update(dt, t, hero, S, id => {
      if (S.coins.includes(id)) return;
      S.coins.push(id); audio.sfx('coin'); ui.coins(S.coins.length); save();
      if (S.coins.length === COIN_TOTAL) ui.toast('Bütün madalyonları topladın!', 3500);
    });
  }
  islands.update(dt, t);
  minimap.update(dt);
  audio.style = atHome() && america.near ? 'amerika' : atHome() && china.near ? 'cin' : 'fr';
  rooms.update(dt, t, hero);
  if (indoor){ applyIndoorLight(); if (hero.zone === 'ic'){ winTimer -= dt; if (winTimer <= 0){ captureOutside(); winTimer = 6; } } }
  if (audio.started){
    audio.ambience(dt, {...(atHome() ? america.ambience(hero.pos.x, hero.pos.z) : {}), wind:world.state.wind, rain:W.rain, night:W.night, fountainDist:atHome() ? Math.min(Math.hypot(hero.pos.x, hero.pos.z - 10), Math.max(sea.dist(hero.pos.x, hero.pos.z), china.dist(hero.pos.x, hero.pos.z)) * 0.45) : islands.dist(hero.pos.x, hero.pos.z) * 0.45, indoorsHigh:hero.zone === 'kule', indoor});
  }
  input.endFrame();
  composer.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// "Yeni oyun" sonrası doğrudan başla
if (sessionStorage.getItem('lumiere-autostart')){
  sessionStorage.removeItem('lumiere-autostart'); history.replaceState(null, '', location.pathname);
  $('title').hidden = true;
  addEventListener('pointerdown', () => audio.start(), {once:true});
  addEventListener('keydown', () => audio.start(), {once:true});
  startPlay();
}
window.__game = { world, hero, input, interior, enterCastle, leaveCastle, startGaze, startTour, get S(){ return S; }, setWeather, get mode(){ return mode; }, startPlay, content:() => content, estate, sanctuary, court, royal, paris, terroir, america, ride, sea, china, islands, rooms, enterRoom, whistleHorse, pickInteract };
