// Bina içleri: her kapının ardındaki oda ilk girişte kurulur (yükleme süresini uzatmaz).
// Odalar dünyanın altındaki bir cepte (y = ROOM_Y) yan yana durur. İçerideyken ada gizlenir, oyuncu odanın
// kendi çarpışma alanına geçer; çıkınca kapının önüne döner. Lumière ve katkıcı adaları aynı sistemi kullanır.
//
// Oda tanımı (rooms.add):
//   {id, name, owner, door:{x, z, ry},   kapının önünde durulan nokta (dünya) ve dışarı bakış yönü
//    w, d, h,                              iç ölçüler (m); giriş kapısı yerel +z duvarında
//    floor:'parke'|'mermer'|'tas'|'ahsap'|'toprak'|'mozaik'|'tatami', walls:'saray'|'alci'|'tas'|'ahsap'|'tugla'|'mermer'|'shoji',
//    ceiling:'alci'|'boyali'|'kiris'|'tonoz', wallColor, curtain, doorStyle, windows:true, lights:n,
//    decor(R, room)}                       mobilya kiti R ile odayı döşeyen işlev
import { Collision } from './game/collision.js';
import { doorway, mergeStatic } from './doors.js';

export const ROOM_Y = -300;

export function createRooms(world, hooks){
  const { THREE, scene, materials:M } = world;
  const C = new Collision(); C.base = ROOM_Y;
  const rooms = new Map(), outside = new Map(), inside = [], markers = [];
  let slot = 0, active = null;
  C.ceiling = () => active ? ROOM_Y + active.h - 0.15 : Infinity;
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  const cache = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial(Object.assign({color:lin(color), roughness:0.7}, o))); return cache.get(k); };
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const ctex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
  let seed = 6151; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // pencereler: gündüz gök ışığı, gece koyu mavi (her karede havaya göre)
  const winMat = new THREE.MeshStandardMaterial({color:0x0a0e14, roughness:0.2, emissive:0xdfe8f2, emissiveIntensity:1.2});
  const glowMat = new THREE.MeshBasicMaterial({color:0xffd08a, toneMapped:false});
  const fireMat = new THREE.MeshBasicMaterial({color:0xff7a2a, toneMapped:false});
  const gold = M.goldMat;

  /* ---------- dokular (bir kez üretilir) ---------- */
  const texCache = new Map();
  function texture(kind, color){
    const key = kind + '|' + (color || '');
    if (texCache.has(key)) return texCache.get(key);
    const [c, g] = canvas(512, 512);
    const hex = n => '#' + new THREE.Color(n).getHexString();
    if (kind === 'parke'){
      // balıksırtı parke
      g.fillStyle = '#6a4424'; g.fillRect(0, 0, 512, 512);
      for (let y = -64; y < 576; y += 32) for (let x = -64; x < 576; x += 64){
        const v = 0.85 + rnd() * 0.3, col = `rgb(${120 * v | 0},${78 * v | 0},${44 * v | 0})`;
        g.save(); g.translate(x + ((y / 32) % 2 ? 32 : 0), y); g.rotate(((y / 32) % 2 ? 1 : -1) * Math.PI / 4); g.fillStyle = col; g.fillRect(0, 0, 90, 28); g.strokeStyle = 'rgba(30,18,8,.5)'; g.lineWidth = 2; g.strokeRect(0, 0, 90, 28); g.restore();
      }
    } else if (kind === 'mermer'){
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){ g.fillStyle = (x + y) % 2 ? '#2a2a2e' : '#ece6da'; g.fillRect(x * 128, y * 128, 128, 128); }
      for (let i = 0; i < 60; i++){ g.strokeStyle = `rgba(150,140,130,${0.08 + rnd() * 0.12})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); let x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y); for (let k = 0; k < 6; k++){ x += (rnd() - 0.5) * 80; y += (rnd() - 0.5) * 80; g.lineTo(x, y); } g.stroke(); }
    } else if (kind === 'tas' || kind === 'tasDuvar'){
      g.fillStyle = '#8a8070'; g.fillRect(0, 0, 512, 512);
      const rows = kind === 'tas' ? 6 : 10;
      for (let r = 0; r < rows; r++){ const hh = 512 / rows; let x = r % 2 ? -40 : 0; while (x < 512){ const ww = 70 + rnd() * 70, v = 0.8 + rnd() * 0.35; g.fillStyle = `rgb(${168 * v | 0},${158 * v | 0},${138 * v | 0})`; g.fillRect(x + 3, r * hh + 3, ww - 6, hh - 6); x += ww; } }
    } else if (kind === 'ahsap'){
      for (let i = 0; i < 16; i++){ const v = 0.8 + rnd() * 0.35; g.fillStyle = `rgb(${130 * v | 0},${92 * v | 0},${58 * v | 0})`; g.fillRect(0, i * 32, 512, 31); g.fillStyle = 'rgba(40,24,12,.35)'; g.fillRect(rnd() * 512, i * 32, 2, 31); }
      for (let i = 0; i < 400; i++){ g.fillStyle = 'rgba(60,36,18,.15)'; g.fillRect(rnd() * 512, rnd() * 512, 20 + rnd() * 60, 1); }
    } else if (kind === 'toprak'){
      g.fillStyle = '#7a6448'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 4000; i++){ const v = rnd(); g.fillStyle = v < 0.5 ? `rgba(200,170,90,${0.3 + rnd() * 0.4})` : 'rgba(60,44,28,.3)'; g.fillRect(rnd() * 512, rnd() * 512, 6 + rnd() * 14, 1.5); }
    } else if (kind === 'mozaik'){
      const pal = ['#e8e2d4', '#3a7a8a', '#c8a050', '#9a3a2a', '#f4f0e6'];
      for (let y = 0; y < 512; y += 16) for (let x = 0; x < 512; x += 16){ const d = Math.hypot(x - 256, y - 256), k = Math.floor(d / 48) % 4; g.fillStyle = pal[(k + ((x + y) / 16 % 7 === 0 ? 1 : 0)) % pal.length]; g.fillRect(x + 1, y + 1, 14, 14); }
    } else if (kind === 'tatami'){
      g.fillStyle = '#c8c08a'; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 256; i++){ g.fillStyle = `rgba(120,110,60,${0.1 + rnd() * 0.15})`; g.fillRect(0, i * 2, 512, 1); }
      g.fillStyle = '#2a3a2a'; g.fillRect(0, 0, 512, 14); g.fillRect(0, 498, 512, 14);
    } else if (kind === 'saray'){
      // damask duvar kâğıdı
      g.fillStyle = hex(color || 0xa8bcd0); g.fillRect(0, 0, 512, 512);
      g.fillStyle = 'rgba(255,248,230,.22)';
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++){
        const cx = 128 + x * 256, cy = 128 + y * 256 + (x ? 128 : 0);
        g.beginPath(); g.ellipse(cx, cy, 34, 70, 0, 0, 7); g.fill();
        for (let k = 0; k < 6; k++){ const a = k / 6 * Math.PI * 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * 62, cy + Math.sin(a) * 82, 14, 26, a, 0, 7); g.fill(); }
      }
      g.strokeStyle = 'rgba(212,175,55,.35)'; g.lineWidth = 3; for (let x = 0; x < 512; x += 128){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    } else if (kind === 'tugla'){
      g.fillStyle = '#7a5a48'; g.fillRect(0, 0, 512, 512);
      for (let r = 0; r < 16; r++) for (let x = (r % 2) * -32; x < 512; x += 64){ const v = 0.8 + rnd() * 0.3; g.fillStyle = `rgb(${160 * v | 0},${78 * v | 0},${52 * v | 0})`; g.fillRect(x + 2, r * 32 + 2, 60, 28); }
    } else if (kind === 'shoji'){
      g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#5a4030';
      for (let i = 0; i <= 4; i++) g.fillRect(i * 128 - 4, 0, 8, 512); for (let i = 0; i <= 6; i++) g.fillRect(0, i * 85 - 3, 512, 6);
    } else if (kind === 'boyali'){
      // boyalı gök tavanı: bulutlar ve altın çerçeve
      const gr = g.createRadialGradient(256, 256, 20, 256, 256, 300); gr.addColorStop(0, '#d8e8f8'); gr.addColorStop(1, '#5a86c0'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 40; i++){ g.fillStyle = `rgba(255,250,240,${0.2 + rnd() * 0.3})`; g.beginPath(); g.ellipse(rnd() * 512, rnd() * 512, 30 + rnd() * 50, 14 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
      g.strokeStyle = '#c8a040'; g.lineWidth = 18; g.strokeRect(9, 9, 494, 494);
    } else {
      g.fillStyle = hex(color || 0xefe4cf); g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 2000; i++){ g.fillStyle = `rgba(120,100,80,${rnd() * 0.05})`; g.fillRect(rnd() * 512, rnd() * 512, 3, 3); }
    }
    const t = ctex(c); texCache.set(key, t); return t;
  }
  const texMat = (kind, color, rx, ry, o = {}) => new THREE.MeshStandardMaterial(Object.assign({map:(() => { const t = texture(kind, color).clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; })(), roughness:0.8}, o));

  // tablolar: yordamsal yağlı boya (manzara, portre, deniz, natürmort, av)
  function paintingTex(kind, s){
    let ps = s * 7919 + 13; const r = () => (ps = (ps * 16807) % 2147483647) / 2147483647;
    const [c, g] = canvas(256, 320);
    if (kind === 'portre'){
      g.fillStyle = '#2a1e16'; g.fillRect(0, 0, 256, 320);
      const dress = ['#2a4a8a', '#8a1a2a', '#2a6a4a', '#5a2a6a'][Math.floor(r() * 4)];
      g.fillStyle = dress; g.beginPath(); g.ellipse(128, 330, 110, 120, 0, 0, 7); g.fill();
      g.fillStyle = '#e8c4a4'; g.beginPath(); g.ellipse(128, 150, 44, 56, 0, 0, 7); g.fill(); g.fillRect(112, 196, 32, 30);
      g.fillStyle = r() < 0.5 ? '#e8e2d8' : '#3a2416'; g.beginPath(); g.ellipse(128, 118, 52, 44, 0, Math.PI, 0); g.fill(); g.fillRect(76, 118, 18, 60); g.fillRect(162, 118, 18, 60);
      g.fillStyle = '#2a1a12'; g.fillRect(108, 146, 10, 5); g.fillRect(138, 146, 10, 5); g.fillStyle = '#a04a4a'; g.fillRect(118, 180, 20, 4);
    } else if (kind === 'deniz'){
      const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#f2d8a8'); sky.addColorStop(1, '#a8c0d8'); g.fillStyle = sky; g.fillRect(0, 0, 256, 200);
      g.fillStyle = '#2a5a7a'; g.fillRect(0, 200, 256, 120);
      for (let i = 0; i < 30; i++){ g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(r() * 256, 200 + r() * 120, 20, 2); }
      g.fillStyle = '#3a2416'; g.beginPath(); g.moveTo(80, 210); g.lineTo(180, 210); g.lineTo(165, 230); g.lineTo(95, 230); g.fill();
      g.fillStyle = '#f2ead8'; g.beginPath(); g.moveTo(130, 90); g.lineTo(130, 205); g.lineTo(80, 200); g.fill(); g.beginPath(); g.moveTo(134, 100); g.lineTo(134, 205); g.lineTo(178, 200); g.fill();
    } else if (kind === 'naturmort'){
      g.fillStyle = '#1e1610'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#5a3a24'; g.fillRect(0, 230, 256, 90);
      [['#c8302a', 90, 210], ['#e8b030', 140, 215], ['#6a2a6a', 170, 205], ['#4a8a2a', 115, 200]].forEach(([col, x, y]) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, 18 + r() * 10, 0, 7); g.fill(); });
      g.fillStyle = '#c8c0b0'; g.beginPath(); g.ellipse(70, 170, 22, 60, 0, 0, 7); g.fill();
    } else if (kind === 'av'){
      g.fillStyle = '#4a5a3a'; g.fillRect(0, 0, 256, 320); g.fillStyle = '#c8d0b8'; g.fillRect(0, 0, 256, 110);
      for (let i = 0; i < 9; i++){ g.fillStyle = `rgb(${40 + r() * 30 | 0},${70 + r() * 40 | 0},${40 + r() * 20 | 0})`; g.beginPath(); g.arc(r() * 256, 90 + r() * 60, 30 + r() * 30, 0, 7); g.fill(); }
      g.fillStyle = '#7a4a2a'; g.fillRect(110, 220, 50, 22); g.fillRect(150, 200, 10, 24); g.fillRect(115, 240, 6, 30); g.fillRect(150, 240, 6, 30);
    } else {
      const sky = g.createLinearGradient(0, 0, 0, 180); sky.addColorStop(0, '#7aa0d0'); sky.addColorStop(1, '#f0e2c0'); g.fillStyle = sky; g.fillRect(0, 0, 256, 180);
      g.fillStyle = '#6a8a4a'; g.beginPath(); g.moveTo(0, 190); for (let x = 0; x <= 256; x += 16) g.lineTo(x, 170 + Math.sin(x / 30 + s) * 18); g.lineTo(256, 320); g.lineTo(0, 320); g.fill();
      g.fillStyle = '#3a5a2a'; for (let i = 0; i < 6; i++){ const x = r() * 256; g.beginPath(); g.arc(x, 190 + r() * 40, 16 + r() * 16, 0, 7); g.fill(); }
      g.fillStyle = '#e8dcc4'; g.fillRect(150, 150, 40, 30); g.fillStyle = '#4a5a6a'; g.beginPath(); g.moveTo(146, 150); g.lineTo(194, 150); g.lineTo(170, 130); g.fill();
    }
    // vernik ve fırça izleri
    for (let i = 0; i < 300; i++){ g.fillStyle = `rgba(255,240,200,${r() * 0.04})`; g.fillRect(r() * 256, r() * 320, 6, 2); }
    return ctex(c);
  }

  /* ---------- oda kaydı ---------- */
  function add(spec){
    const r = Object.assign({w:14, d:12, h:5, owner:'lumiere', floor:'parke', walls:'alci', ceiling:'alci', doorStyle:'saray', doorW:2.2, windows:true, curtain:0x8a1a2a, lights:0}, spec, {slot:slot++, built:false});
    r.ox = (r.slot % 10) * 80 - 360; r.oz = Math.floor(r.slot / 10) * 80 - 1600;
    rooms.set(r.id, r);
    let L = outside.get(r.owner); if (!L){ L = []; outside.set(r.owner, L); }
    L.push({x:r.door.x, z:r.door.z, r:2.3, label:'İçeri gir: ' + r.name, show:() => !r.locked || !r.locked(), act:() => hooks.enter(r)});
    return r;
  }

  /* ---------- kurulum ---------- */
  function build(r){
    const G = new THREE.Group(); G.position.set(r.ox, ROOM_Y, r.oz); G.visible = false; G.name = 'Oda:' + r.id; G.userData.room = true; scene.add(G);
    r.G = G; r.updaters = []; r.lightList = []; r.interact = [];
    const R = kit(r, G);
    shell(r, R);
    if (r.decor) r.decor(R, r);
    mergeStatic(world, G);
    world.atmo.patchScene(G);
    r.built = true;
  }

  function shell(r, R){
    const {w, d, h} = r, T = 0.3;
    // zemin ve süpürgelik
    const fl = R.add(new THREE.PlaneGeometry(w, d), texMat(r.floor, null, w / (r.floor === 'mermer' ? 4 : 3), d / (r.floor === 'mermer' ? 4 : 3), {roughness:r.floor === 'mermer' ? 0.25 : 0.7}), 0, 0.002, 0, false);
    fl.rotation.x = -Math.PI / 2;
    // duvarlar (giriş duvarında kapı boşluğu)
    const wallKind = r.walls === 'saray' ? 'saray' : r.walls === 'tas' ? 'tasDuvar' : r.walls;
    const wallM = len => texMat(wallKind, r.wallColor, len / 3, h / 3);
    const DW = r.doorW + 0.4, DH = 3.6;
    R.box(T, h, d, wallM(d), -w / 2 - T / 2, h / 2, 0); R.box(T, h, d, wallM(d), w / 2 + T / 2, h / 2, 0);
    R.box(w + T * 2, h, T, wallM(w), 0, h / 2, -d / 2 - T / 2);
    const side = (w - DW) / 2;
    [-1, 1].forEach(sd => R.box(side, h, T, wallM(side), sd * (DW / 2 + side / 2), h / 2, d / 2 + T / 2));
    R.box(DW, h - DH, T, wallM(DW), 0, DH + (h - DH) / 2, d / 2 + T / 2);
    R.box(DW, DH, 0.05, mat(0x1a120c), 0, DH / 2, d / 2 + T - 0.02);
    C.box(r.ox - w / 2 - T / 2, r.oz, T / 2, d / 2 + T); C.box(r.ox + w / 2 + T / 2, r.oz, T / 2, d / 2 + T);
    C.box(r.ox, r.oz - d / 2 - T / 2, w / 2 + T, T / 2); C.box(r.ox, r.oz + d / 2 + T / 2, w / 2 + T, T / 2);
    // lambri, sandalye kuşağı, süpürgelik, korniş
    if (['saray', 'alci', 'mermer'].includes(r.walls)){
      const pan = r.walls === 'mermer' ? mat(0xd8d0c0, {roughness:0.3}) : mat(r.walls === 'saray' ? 0xf2ead8 : 0x8a6a48, {roughness:0.6});
      const runs = [[-w / 2 + 0.03, 0, d, Math.PI / 2], [w / 2 - 0.03, 0, d, -Math.PI / 2], [0, -d / 2 + 0.03, w, 0]];
      runs.forEach(([x, z, len, ry]) => {
        const b = R.box(len, 1.0, 0.06, pan, x, 0.5, z); b.rotation.y = ry;
        const rail = R.box(len, 0.07, 0.1, r.walls === 'saray' ? gold : mat(0xe8dcc4), x, 1.03, z); rail.rotation.y = ry;
        const n = Math.max(1, Math.floor(len / 1.4));
        for (let i = 0; i < n; i++){ const u = -len / 2 + (i + 0.5) * len / n, px = ry ? x : u, pz = ry ? u : z; const p = R.box(len / n - 0.3, 0.6, 0.03, mat(r.walls === 'saray' ? 0xe6dcc6 : 0x7a5a3c), px + (ry ? Math.sign(-x) * 0.03 : 0), 0.5, pz + (ry ? 0 : 0.03)); p.rotation.y = ry; }
      });
      [-1, 1].forEach(sd => { const b = R.box(side, 1.0, 0.06, pan, sd * (DW / 2 + side / 2), 0.5, d / 2 - 0.03); const rl = R.box(side, 0.07, 0.1, r.walls === 'saray' ? gold : mat(0xe8dcc4), sd * (DW / 2 + side / 2), 1.03, d / 2 - 0.03); });
    }
    const corn = r.walls === 'saray' ? mat(0xf4ecd8) : r.walls === 'shoji' ? mat(0x4a3424) : mat(0xd8ccb4);
    const cy = r.ceiling === 'tonoz' ? h - 0.45 * w / 2 : h - 0.15;
    [[0, -d / 2 + 0.12, w, 0.24], [0, d / 2 - 0.12, w, 0.24]].forEach(([x, z, sx, sz]) => R.box(sx, 0.3, sz, corn, x, cy, z));
    [[-w / 2 + 0.12, 0, 0.24, d], [w / 2 - 0.12, 0, 0.24, d]].forEach(([x, z, sx, sz]) => R.box(sx, 0.3, sz, corn, x, cy, z));
    // tavan
    if (r.ceiling === 'tonoz'){
      // yarım silindir tonoz: yan duvarlardan doğar, tepesi h'de
      const rise = 0.45 * w / 2;
      const v = R.add(new THREE.CylinderGeometry(w / 2, w / 2, d, 24, 1, true, -Math.PI / 2, Math.PI), texMat('tasDuvar', null, d / 3, w / 2, {side:THREE.BackSide}), 0, h - rise, 0, false);
      v.rotation.x = -Math.PI / 2; v.scale.set(1, 1, 0.45);
    } else {
      const cm = r.ceiling === 'kiris' ? texMat('ahsap', null, w / 4, d / 4) : r.ceiling === 'boyali' ? texMat('boyali', null, 1, 1, {emissive:0x202830, emissiveIntensity:0.15}) : mat(0xf2eadb, {roughness:0.9});
      const ce = R.add(new THREE.PlaneGeometry(w, d), cm, 0, h, 0, false); ce.rotation.x = Math.PI / 2;
      if (r.ceiling === 'kiris'){ for (let x = -w / 2 + 1.2; x < w / 2; x += 2.4) R.box(0.3, 0.35, d, mat(0x3e2a1a, {roughness:0.85}), x, h - 0.18, 0); }
      else { R.add(new THREE.TorusGeometry(0.6, 0.08, 8, 28), gold, 0, h - 0.04, 0, false).rotation.x = Math.PI / 2; R.add(new THREE.CircleGeometry(0.5, 24), mat(0xf6efe0), 0, h - 0.03, 0, false).rotation.x = Math.PI / 2; }
    }
    // pencereler: yan ve arka duvarlarda; gündüz aydınlık, gece karanlık
    if (r.windows){
      const wh = Math.min(2.4, h - 2.2), wy = 1.25 + wh / 2;
      const faces = [[-w / 2 + 0.02, 0, d, Math.PI / 2], [w / 2 - 0.02, 0, d, -Math.PI / 2], [0, -d / 2 + 0.02, w, 0]];
      faces.forEach(([x, z, len, ry]) => {
        const n = Math.max(1, Math.floor(len / 3.6));
        for (let i = 0; i < n; i++){
          const u = -len / 2 + (i + 0.5) * len / n, px = ry ? x : u, pz = ry ? u : z;
          const nx = ry ? Math.sign(-x) : 0, nz = ry ? 0 : 1;
          if (r.skipWindow && r.skipWindow(px, pz)) continue;
          const pane = R.add(new THREE.PlaneGeometry(1.2, wh), winMat, px + nx * 0.01, wy, pz + nz * 0.01, false); pane.rotation.y = ry;
          const fm = r.walls === 'shoji' ? mat(0x4a3424) : mat(0xf4ecdc);
          [[0, wh / 2 + 0.05, 1.4, 0.1], [0, -wh / 2 - 0.05, 1.5, 0.12], [-0.65, 0, 0.1, wh], [0.65, 0, 0.1, wh], [0, 0, 0.05, wh], [0, wh * 0.18, 1.2, 0.05]].forEach(([a, b, sx, sy]) => {
            const f = R.box(sx, sy, 0.08, fm, px + nx * 0.04 + (ry ? 0 : a), wy + b, pz + nz * 0.04 + (ry ? -a * Math.sign(ry) : 0)); f.rotation.y = ry;
          });
          if (r.walls === 'saray' || r.curtain){
            [-1, 1].forEach(sd => { const cu = R.box(0.5, wh + 0.8, 0.08, mat(r.curtain, {roughness:0.9}), px + nx * 0.1 + (ry ? 0 : sd * 0.95), wy + 0.1, pz + nz * 0.1 + (ry ? -sd * 0.95 * Math.sign(ry) : 0)); cu.rotation.y = ry; });
            const val = R.box(2.4, 0.3, 0.14, mat(r.curtain, {roughness:0.9}), px + nx * 0.12, wy + wh / 2 + 0.45, pz + nz * 0.12); val.rotation.y = ry;
          }
        }
      });
    }
    // iç taraftaki kapı (dışarı çıkış)
    doorway(world, R.G, {z:d / 2, ry:Math.PI, w:r.doorW, h:3.0, y0:0.0, style:r.doorStyle, steps:0, pediment:h >= 6, lanterns:r.doorStyle !== 'rustik'});
    r.interact.push({x:r.ox, z:r.oz + d / 2 - 1.2, y:ROOM_Y, r:2.0, zone:'oda', label:'Dışarı çık', show:() => true, act:() => hooks.exit(r)});
    // avizeler: oda büyüklüğüne göre
    const n = r.lights || (w * d > 220 ? 3 : w * d > 110 ? 2 : 1);
    for (let i = 0; i < n; i++){ const z = n === 1 ? 0 : -d / 2 + (i + 0.5) * d / n; R.chandelier(0, z, {rustic:['ahsap', 'tas', 'tugla'].includes(r.walls)}); }
  }

  /* ---------- mobilya kiti (yerel koordinat: oda merkezi, y zeminden) ---------- */
  function kit(r, G){
    const R = {G, room:r, THREE, mat, gold, rnd, glowMat, fireMat, texture, paintingTex, world};
    R.add = (geo, m, x, y, z, cast = true, parent = G) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; parent.add(o); return o; };
    R.box = (sx, sy, sz, m, x, y, z, ry = 0, parent = G) => { const o = R.add(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z, true, parent); o.rotation.y = ry; return o; };
    R.cyl = (rt, rb, hh, m, x, y, z, seg = 14, parent = G) => R.add(new THREE.CylinderGeometry(rt, rb, hh, seg), m, x, y, z, true, parent);
    R.collide = (x, z, hw, hd, ry = 0) => C.box(r.ox + x, r.oz + z, hw, hd, ry);
    R.collideC = (x, z, rad) => C.circle(r.ox + x, r.oz + z, rad);
    R.anim = fn => { r.updaters.push(fn); };
    R.dyn = () => { const g = new THREE.Group(); g.userData.anim = true; G.add(g); return g; };
    R.light = (x, y, z, color = 0xffd9a0, intensity = 6, dist = 16) => { const l = new THREE.PointLight(color, 0, dist, 2); l.position.set(x, y, z); G.add(l); r.lightList.push({l, base:intensity}); return l; };
    R.interact = (x, z, label, act, rad = 2.0) => { r.interact.push({x:r.ox + x, z:r.oz + z, y:ROOM_Y, r:rad, zone:'oda', label, show:() => true, act}); };
    R.note = (x, z, label, name, lines) => R.interact(x, z, label, () => hooks.ui.dialog((Array.isArray(lines) ? lines : [lines]).map(text => ({name, text}))));
    const wood = mat(0x5a3a22, {roughness:0.6}), darkWood = mat(0x3a2414, {roughness:0.6}), brass = mat(0xd8b45a, {metalness:1, roughness:0.3});
    const copper = mat(0xb8643a, {metalness:0.9, roughness:0.35}), iron = mat(0x2a2a2e, {metalness:0.7, roughness:0.45}), linen = mat(0xf4f0e6, {roughness:0.9});
    Object.assign(R, {wood, darkWood, brass, copper, iron, linen});

    R.table = (x, z, {w = 1.8, d = 0.9, h = 0.78, ry = 0, top = wood, leg = darkWood, cloth = null, round = false, collide = true} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      if (round){ R.cyl(w / 2, w / 2, 0.06, top, 0, h, 0, 24, g); R.cyl(0.08, 0.12, h, leg, 0, h / 2, 0, 10, g); R.cyl(0.35, 0.4, 0.05, leg, 0, 0.03, 0, 16, g); if (cloth) R.cyl(w / 2 + 0.06, w / 2 + 0.1, 0.25, cloth, 0, h - 0.1, 0, 24, g); if (collide) R.collideC(x, z, w / 2 + 0.1); return g; }
      R.box(w, 0.06, d, top, 0, h, 0, 0, g);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => R.box(0.07, h, 0.07, leg, a * (w / 2 - 0.08), h / 2, b * (d / 2 - 0.08), 0, g));
      R.box(w - 0.2, 0.08, 0.03, leg, 0, h - 0.08, d / 2 - 0.08, 0, g); R.box(w - 0.2, 0.08, 0.03, leg, 0, h - 0.08, -d / 2 + 0.08, 0, g);
      if (cloth){ R.box(w + 0.1, 0.02, d + 0.1, cloth, 0, h + 0.035, 0, 0, g); R.box(w + 0.12, 0.3, 0.01, cloth, 0, h - 0.12, d / 2 + 0.06, 0, g); R.box(w + 0.12, 0.3, 0.01, cloth, 0, h - 0.12, -d / 2 - 0.06, 0, g); }
      if (collide) R.collide(x, z, w / 2 + 0.1, d / 2 + 0.1, ry);
      return g;
    };
    R.chair = (x, z, ry = 0, {seat = mat(0x8a1a2a, {roughness:0.85}), frame = wood, gilt = false} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      R.box(0.46, 0.08, 0.44, seat, 0, 0.47, 0, 0, g);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => R.box(0.05, 0.45, 0.05, gilt ? gold : frame, a * 0.19, 0.22, b * 0.18, 0, g));
      R.box(0.44, 0.6, 0.05, seat, 0, 0.82, -0.2, 0, g); R.box(0.48, 0.05, 0.06, gilt ? gold : frame, 0, 1.13, -0.2, 0, g);
      return g;
    };
    R.dining = (x, z, {w = 4, d = 1.1, ry = 0, cloth = linen, chairs = true, seat, gilt, place = true} = {}) => {
      R.table(x, z, {w, d, ry, cloth});
      const n = Math.max(1, Math.floor(w / 0.8)), c = Math.cos(ry), s = Math.sin(ry);
      for (let i = 0; i < n; i++){
        const u = -w / 2 + (i + 0.5) * w / n;
        [-1, 1].forEach(sd => {
          const lx = u, lz = sd * (d / 2 + 0.35), wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
          if (chairs) R.chair(wx, wz, ry + (sd > 0 ? Math.PI : 0), {seat, gilt});
          if (place){ const px = x + lx * c + sd * (d / 2 - 0.2) * s, pz = z - lx * s + sd * (d / 2 - 0.2) * c; R.cyl(0.13, 0.13, 0.015, linen, px, 0.82, pz, 16); R.cyl(0.03, 0.025, 0.14, mat(0xe8f0f8, {roughness:0.05, metalness:0.1, transparent:true, opacity:0.6}), px + 0.2 * c, 0.88, pz - 0.2 * s, 8); }
        });
      }
      R.candles(x, 0.82, z);
    };
    R.bench = (x, z, len = 2, ry = 0, m = wood) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); R.box(len, 0.08, 0.4, m, 0, 0.45, 0, 0, g); [-1, 1].forEach(sd => R.box(0.08, 0.45, 0.36, darkWood, sd * (len / 2 - 0.15), 0.22, 0, 0, g)); R.collide(x, z, len / 2, 0.25, ry); return g; };
    R.bookcase = (x, z, ry = 0, {w = 2.4, h = 3.2, d = 0.45, m = darkWood} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      R.box(w, h, 0.04, m, 0, h / 2, -d / 2 + 0.02, 0, g); [-1, 1].forEach(sd => R.box(0.06, h, d, m, sd * (w / 2 - 0.03), h / 2, 0, 0, g));
      const shelves = Math.floor(h / 0.42);
      const BOOK = ['#6a1a1a', '#1a3a6a', '#2a5a2a', '#6a4a1a', '#4a1a4a', '#1a1a1a', '#8a6a2a', '#5a2a1a'].map(c => mat(new THREE.Color(c).getHex(), {roughness:0.75}));
      for (let k = 0; k <= shelves; k++){
        const y = 0.06 + k * (h - 0.1) / shelves; R.box(w - 0.1, 0.04, d - 0.04, m, 0, y, 0, 0, g);
        if (k === shelves) break;
        let bx = -w / 2 + 0.1;
        while (bx < w / 2 - 0.15){ const bw = 0.04 + rnd() * 0.05, bh = 0.26 + rnd() * 0.1; if (rnd() < 0.08){ bx += 0.12; continue; } const b = R.box(bw, bh, d * 0.7, BOOK[Math.floor(rnd() * BOOK.length)], bx + bw / 2, y + 0.02 + bh / 2, 0.02, 0, g); if (rnd() < 0.1) b.rotation.z = 0.25; bx += bw + 0.005; }
      }
      R.box(w + 0.1, 0.12, d + 0.06, m, 0, h + 0.06, 0, 0, g);
      R.collide(x, z, w / 2, d / 2 + 0.05, ry); return g;
    };
    R.cabinet = (x, z, ry = 0, {w = 1.6, h = 2.0, d = 0.5, items = 'china', m = wood} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      R.box(w, 0.9, d, m, 0, 0.45, 0, 0, g); R.box(w + 0.05, 0.05, d + 0.05, m, 0, 0.92, 0, 0, g);
      R.box(w, h - 0.95, 0.03, m, 0, 0.95 + (h - 0.95) / 2, -d / 2 + 0.02, 0, g); [-1, 1].forEach(sd => R.box(0.04, h - 0.95, d * 0.6, m, sd * (w / 2 - 0.02), 0.95 + (h - 0.95) / 2, -d * 0.2, 0, g));
      R.box(w, 0.06, d * 0.6, m, 0, h, -d * 0.2, 0, g);
      const glass = R.box(w - 0.08, h - 1.0, 0.02, mat(0xcfe0ea, {roughness:0.05, metalness:0.2, transparent:true, opacity:0.25}), 0, 0.95 + (h - 0.95) / 2, d * 0.1, 0, g); glass.castShadow = false;
      const cols = items === 'bottles' ? [0x5aff9a, 0xff5ab0, 0x5ab0ff, 0xffd25a, 0xb05aff, 0xff8a3a] : items === 'gems' ? [0xff2a4a, 0x2f7bff, 0x22e08a, 0xb35bff] : [0xf4f0e6, 0x2a4a9a, 0xf4f0e6];
      for (let k = 0; k < 2; k++){ const y = 1.1 + k * (h - 1.1) / 2; R.box(w - 0.1, 0.03, d * 0.5, m, 0, y - 0.02, -d * 0.2, 0, g);
        for (let i = 0; i < Math.floor(w / 0.22); i++){ const c = cols[(i + k) % cols.length]; const o = items === 'china' ? R.add(new THREE.CylinderGeometry(0.07, 0.05, 0.18, 12), mat(c, {roughness:0.2}), -w / 2 + 0.15 + i * 0.22, y + 0.09, -d * 0.2, true, g) : R.add(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 8), mat(c, {roughness:0.05, emissive:c, emissiveIntensity:items === 'gems' ? 0.6 : 0.15, transparent:true, opacity:0.85}), -w / 2 + 0.15 + i * 0.22, y + 0.1, -d * 0.2, true, g); }
      }
      R.collide(x, z, w / 2, d / 2, ry); return g;
    };
    R.counter = (x, z, {w = 3, d = 0.8, h = 0.95, ry = 0, top = mat(0xd8d0c0, {roughness:0.35}), body = wood} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      R.box(w, h - 0.05, d, body, 0, (h - 0.05) / 2, 0, 0, g); R.box(w + 0.06, 0.06, d + 0.06, top, 0, h - 0.02, 0, 0, g);
      const n = Math.max(1, Math.floor(w / 0.8)); for (let i = 0; i < n; i++) R.box(w / n - 0.12, h - 0.3, 0.02, darkWood, -w / 2 + (i + 0.5) * w / n, (h - 0.05) / 2, d / 2 + 0.01, 0, g);
      R.collide(x, z, w / 2 + 0.05, d / 2 + 0.05, ry); return g;
    };
    const barrelGeo = new THREE.LatheGeometry([[0, -0.6], [0.42, -0.6], [0.5, -0.3], [0.53, 0], [0.5, 0.3], [0.42, 0.6], [0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b)), 18);
    R.barrel = (x, z, {lying = false, ry = 0, y = 0, s = 1, collide = true} = {}) => {
      const g = new THREE.Group(); g.position.set(x, y + (lying ? 0.53 * s : 0.6 * s), z); g.rotation.y = ry; G.add(g);
      const b = R.add(barrelGeo, mat(0x7a4a26, {roughness:0.75}), 0, 0, 0, true, g); b.scale.setScalar(s); if (lying) b.rotation.z = Math.PI / 2;
      [-0.4, 0, 0.4].forEach(o => { const hp = R.add(new THREE.TorusGeometry((o ? 0.48 : 0.535) * s, 0.025, 6, 20), iron, lying ? o * s : 0, lying ? 0 : o * s, 0, true, g); if (!lying) hp.rotation.x = Math.PI / 2; else hp.rotation.y = Math.PI / 2; });
      if (collide) R.collideC(x, z, 0.55 * s); return g;
    };
    R.crate = (x, z, s = 0.7, ry = 0, y = 0) => { const c = R.box(s, s, s, mat(0x9a7a4a, {roughness:0.9}), x, y + s / 2, z, ry); [-1, 1].forEach(sd => { const sl = R.box(s + 0.02, 0.06, 0.04, darkWood, x, y + s / 2 + sd * s * 0.3, z + s / 2, ry); }); if (!y) R.collide(x, z, s / 2, s / 2, ry); return c; };
    R.rug = (x, z, w, d, {c1 = '#8a1a2a', c2 = '#d8b45a', c3 = '#1a2a4a', ry = 0} = {}) => {
      const [c, g] = canvas(256, 256 * d / w | 0 || 128);
      g.fillStyle = c1; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = c2; g.lineWidth = 10; g.strokeRect(12, 12, c.width - 24, c.height - 24);
      g.fillStyle = c3; g.fillRect(30, 30, c.width - 60, c.height - 60); g.fillStyle = c2; g.beginPath(); g.ellipse(c.width / 2, c.height / 2, c.width * 0.25, c.height * 0.25, 0, 0, 7); g.fill();
      g.fillStyle = c1; g.beginPath(); g.ellipse(c.width / 2, c.height / 2, c.width * 0.15, c.height * 0.15, 0, 0, 7); g.fill();
      for (let i = 0; i < 40; i++){ g.fillStyle = c2; g.fillRect(40 + rnd() * (c.width - 80), 40 + rnd() * (c.height - 80), 4, 4); }
      const m = R.add(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.95}), x, 0.012, z, false); m.rotation.set(-Math.PI / 2, 0, ry); return m;
    };
    R.painting = (x, y, z, ry, w = 1.2, h = 1.5, kind = 'manzara', s = 1) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
      R.add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:paintingTex(kind, s), roughness:0.55}), 0, 0, 0.04, false, g);
      [[0, h / 2 + 0.06, w + 0.24, 0.12], [0, -h / 2 - 0.06, w + 0.24, 0.12], [-w / 2 - 0.06, 0, 0.12, h], [w / 2 + 0.06, 0, 0.12, h]].forEach(([a, b, sx, sy]) => R.box(sx, sy, 0.08, gold, a, b, 0.03, 0, g));
      return g;
    };
    R.mirror = (x, y, z, ry, w = 1.2, h = 2.2) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); R.add(new THREE.PlaneGeometry(w, h), mat(0xdfe8f0, {metalness:1, roughness:0.04}), 0, 0, 0.04, false, g); R.add(new THREE.TorusGeometry(w / 2 + 0.05, 0.06, 6, 20, Math.PI), gold, 0, h / 2, 0.04, true, g); [-1, 1].forEach(sd => R.box(0.1, h, 0.08, gold, sd * (w / 2 + 0.05), 0, 0.03, 0, g)); R.box(w + 0.2, 0.1, 0.08, gold, 0, -h / 2, 0.03, 0, g); return g; };
    R.chandelier = (x, z, {y = r.h - 0.25, rad = 0.85, rustic = false, light = true} = {}) => {
      const g = new THREE.Group(); g.position.set(x, y, z); G.add(g);
      if (rustic){
        R.cyl(0.02, 0.02, 0.9, iron, 0, -0.45, 0, 6, g); const ring = R.add(new THREE.TorusGeometry(rad, 0.04, 6, 24), iron, 0, -0.9, 0, true, g); ring.rotation.x = Math.PI / 2;
        for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; R.cyl(0.03, 0.03, 0.14, linen, Math.cos(a) * rad, -0.82, Math.sin(a) * rad, 6, g); R.add(new THREE.SphereGeometry(0.035, 6, 4), glowMat, Math.cos(a) * rad, -0.72, Math.sin(a) * rad, false, g); }
      } else {
        R.cyl(0.015, 0.015, 1.0, gold, 0, -0.5, 0, 6, g);
        [rad, rad * 0.65, rad * 0.35].forEach((rr, k) => {
          R.add(new THREE.TorusGeometry(rr, 0.03, 6, 28), gold, 0, -1.0 - k * 0.35, 0, true, g).rotation.x = Math.PI / 2;
          const n = 10 - k * 3; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; R.add(new THREE.SphereGeometry(0.045, 6, 4), glowMat, Math.cos(a) * rr, -0.92 - k * 0.35, Math.sin(a) * rr, false, g); R.add(new THREE.OctahedronGeometry(0.04, 0), mat(0xffffff, {roughness:0.02, metalness:0.2, transparent:true, opacity:0.7}), Math.cos(a) * rr, -1.12 - k * 0.35, Math.sin(a) * rr, false, g); }
        });
        R.add(new THREE.SphereGeometry(0.12, 12, 8), gold, 0, -1.9, 0, true, g);
      }
      if (light) R.light(x, y - 1.2, z, 0xffd9a0, Math.max(5, Math.min(9, r.w * r.d / 22)), Math.max(r.w, r.d) * 1.1);
      return g;
    };
    R.sconce = (x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); R.box(0.12, 0.3, 0.04, gold, 0, 0, 0.02, 0, g); R.box(0.04, 0.04, 0.22, gold, 0, -0.05, 0.13, 0, g); R.cyl(0.025, 0.025, 0.14, linen, 0, 0.04, 0.24, 6, g); R.add(new THREE.SphereGeometry(0.03, 6, 4), glowMat, 0, 0.14, 0.24, false, g); return g; };
    R.candles = (x, y, z) => { R.cyl(0.08, 0.1, 0.05, brass, x, y + 0.03, z, 10); R.cyl(0.02, 0.02, 0.28, brass, x, y + 0.18, z, 6); [-1, 0, 1].forEach(k => { R.box(0.18, 0.02, 0.02, brass, x, y + 0.3, z); R.cyl(0.018, 0.018, 0.16, linen, x + k * 0.09, y + 0.39, z, 6); R.add(new THREE.SphereGeometry(0.02, 6, 4), glowMat, x + k * 0.09, y + 0.49, z, false); }); };
    R.fireplace = (x, z, ry = 0, {w = 2.0, m = mat(0xe8e0d0, {roughness:0.35}), rustic = false} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      const st = rustic ? texMat('tasDuvar', null, 1, 1) : m;
      R.box(w + 0.8, 1.4, 0.6, st, 0, 0.7, 0, 0, g); R.box(w + 1.1, 0.12, 0.75, st, 0, 1.46, 0.05, 0, g);
      R.box(w, 1.0, 0.62, mat(0x120c08), 0, 0.5, 0.02, 0, g);
      if (!rustic) R.box(w + 0.4, 1.6, 0.08, st, 0, 2.3, -0.24, 0, g);
      const logs = [0, 1, 2].map(i => { const l = R.cyl(0.07, 0.07, 0.8, mat(0x4a2e18, {roughness:1}), (i - 1) * 0.18, 0.12 + (i === 1 ? 0.1 : 0), 0.1, 8, g); l.rotation.z = Math.PI / 2; l.rotation.y = (i - 1) * 0.4; return l; });
      const flame = new THREE.Group(); flame.userData.anim = true; flame.position.set(0, 0.2, 0.12); g.add(flame);
      const fl = [0, 1, 2].map(i => R.add(new THREE.ConeGeometry(0.12 - i * 0.02, 0.5 - i * 0.08, 8), fireMat, (i - 1) * 0.16, 0.25, 0, false, flame));
      const [lx, lz] = [x + Math.sin(ry) * 0.6, z + Math.cos(ry) * 0.6];
      const L = R.light(lx, 0.6, lz, 0xff8a3a, 5, 10);
      R.anim((dt, t) => { fl.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * 9 + i * 2) * 0.2 + Math.sin(t * 17 + i) * 0.1; }); L.userData.flick = 0.8 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.1; });
      R.collide(x, z, (w + 0.8) / 2, 0.4, ry); return g;
    };
    R.plant = (x, z, {s = 1, citrus = false} = {}) => {
      R.cyl(0.32 * s, 0.24 * s, 0.5 * s, mat(0xb8643a, {roughness:0.8}), x, 0.25 * s, z, 14);
      R.cyl(0.04, 0.05, 0.8 * s, darkWood, x, 0.8 * s, z, 6);
      const lm = mat(0x3f7d2c, {roughness:0.8, flatShading:true});
      for (let i = 0; i < 5; i++) R.add(new THREE.IcosahedronGeometry(0.32 * s, 0), lm, x + (rnd() - 0.5) * 0.4 * s, (1.2 + rnd() * 0.4) * s, z + (rnd() - 0.5) * 0.4 * s);
      if (citrus) for (let i = 0; i < 6; i++) R.add(new THREE.SphereGeometry(0.06 * s, 8, 6), mat(i % 2 ? 0xffa21a : 0xffd23a, {roughness:0.5}), x + (rnd() - 0.5) * 0.6 * s, (1.1 + rnd() * 0.5) * s, z + (rnd() - 0.5) * 0.6 * s);
      R.collideC(x, z, 0.35 * s);
    };
    R.bust = (x, z, ry = 0, m = mat(0xf2ede4, {roughness:0.4})) => { R.cyl(0.2, 0.26, 1.1, m, x, 0.55, z, 12); R.box(0.5, 0.08, 0.5, m, x, 1.14, z); const h = R.add(new THREE.SphereGeometry(0.16, 14, 10), m, x, 1.55, z); h.scale.set(0.9, 1.1, 1); const sh = R.add(new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m, x, 1.2, z); sh.scale.set(1.2, 0.8, 0.7); sh.rotation.y = ry; R.collideC(x, z, 0.3); };
    R.globe = (x, z) => {
      R.cyl(0.25, 0.32, 0.06, darkWood, x, 0.03, z, 12); R.cyl(0.04, 0.05, 0.9, darkWood, x, 0.5, z, 8);
      const [c, g] = canvas(256, 128); g.fillStyle = '#c8b890'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#8a6a3a'; for (let i = 0; i < 9; i++){ g.beginPath(); g.ellipse(rnd() * 256, 20 + rnd() * 88, 14 + rnd() * 30, 8 + rnd() * 20, rnd() * 3, 0, 7); g.fill(); }
      const ring = new THREE.Group(); ring.userData.anim = true; ring.position.set(x, 1.25, z); ring.rotation.z = 0.41; G.add(ring);
      R.add(new THREE.SphereGeometry(0.32, 24, 16), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.5}), 0, 0, 0, true, ring);
      R.add(new THREE.TorusGeometry(0.36, 0.015, 6, 32), brass, 0, 0, 0, true, ring).rotation.y = Math.PI / 2;
      R.anim(dt => { ring.rotation.y += dt * 0.15; }); R.collideC(x, z, 0.4);
    };
    R.shelf = (x, y, z, ry, w = 2, items = 'jars') => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g);
      R.box(w, 0.05, 0.32, wood, 0, 0, 0.16, 0, g); [-1, 1].forEach(sd => { const b = R.box(0.04, 0.25, 0.04, darkWood, sd * (w / 2 - 0.2), -0.12, 0.05, 0, g); b.rotation.x = 0.6; });
      const n = Math.floor(w / 0.2);
      for (let i = 0; i < n; i++){
        const px = -w / 2 + 0.12 + i * (w - 0.24) / Math.max(1, n - 1);
        if (items === 'bottles'){ const c = [0x5aff9a, 0xff5ab0, 0x5ab0ff, 0xffd25a, 0xb05aff, 0xff8a3a, 0xc8e8ff][i % 7]; R.add(new THREE.CylinderGeometry(0.03, 0.05, 0.18 + (i % 3) * 0.04, 8), mat(c, {roughness:0.05, emissive:c, emissiveIntensity:0.2, transparent:true, opacity:0.85}), px, 0.12, 0.16, true, g); }
        else if (items === 'pots') R.add(new THREE.SphereGeometry(0.09, 10, 8), copper, px, 0.1, 0.16, true, g).scale.y = 0.8;
        else if (items === 'books'){ R.box(0.05, 0.24, 0.18, mat([0x6a1a1a, 0x1a3a6a, 0x2a5a2a, 0x6a4a1a][i % 4]), px, 0.14, 0.16, 0, g); }
        else R.add(new THREE.CylinderGeometry(0.07, 0.06, 0.18, 10), mat([0xe8e0d0, 0x9a7a4a, 0x5a7a9a][i % 3], {roughness:0.5}), px, 0.11, 0.16, true, g);
      }
      return g;
    };
    R.hangingPots = (x, z, w = 2, ry = 0) => { const g = new THREE.Group(); g.position.set(x, r.h - 1.6, z); g.rotation.y = ry; G.add(g); R.box(w, 0.06, 0.06, iron, 0, 0, 0, 0, g); [-1, 1].forEach(sd => R.cyl(0.015, 0.015, 1.6, iron, sd * w / 2, 0.8, 0, 4, g)); for (let i = 0; i < Math.floor(w / 0.35); i++){ const px = -w / 2 + 0.2 + i * 0.35; R.cyl(0.005, 0.005, 0.2, iron, px, -0.1, 0, 4, g); const p = R.add(new THREE.CylinderGeometry(0.1 + (i % 3) * 0.03, 0.09, 0.14, 12), copper, px, -0.28, 0, true, g); } return g; };
    R.hay = (x, z, s = 1) => { const m = R.add(new THREE.SphereGeometry(0.9 * s, 10, 8), mat(0xc9a54e, {roughness:1, flatShading:true}), x, 0.3 * s, z); m.scale.set(1.3, 0.55, 1); R.collideC(x, z, 0.9 * s); };
    R.stall = (x, z, ry = 0, {w = 3, d = 3.6} = {}) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      [-1, 1].forEach(sd => { R.box(0.12, 1.5, d, wood, sd * w / 2, 0.75, 0, 0, g); for (let i = 0; i < 6; i++) R.box(0.04, 0.8, 0.04, iron, sd * w / 2, 1.9, -d / 2 + 0.3 + i * (d - 0.6) / 5, 0, g); R.box(0.14, 0.08, d, darkWood, sd * w / 2, 2.32, 0, 0, g); });
      R.box(w, 0.04, 0.04, darkWood, 0, 1.2, d / 2, 0, g);
      R.box(0.8, 0.4, 0.4, mat(0x6a4a2e), 0, 0.8, -d / 2 + 0.25, 0, g);
      R.box(w - 0.3, 0.06, d - 0.3, mat(0xc9a54e, {roughness:1}), 0, 0.03, 0, 0, g);
      [-1, 1].forEach(sd => { const [cx, cz] = [x + Math.cos(ry) * sd * w / 2, z - Math.sin(ry) * sd * w / 2]; R.collide(cx, cz, 0.08, d / 2, ry); });
      return g;
    };
    R.saddleRack = (x, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); R.box(0.1, 1.1, 0.1, darkWood, 0, 0.55, 0, 0, g); R.box(0.6, 0.08, 0.5, darkWood, 0, 1.1, 0, 0, g); const s = R.add(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x6a2a1a, {roughness:0.6}), 0, 1.12, 0, true, g); s.scale.set(1, 0.5, 1.3); R.collideC(x, z, 0.35); };
    R.horse = (x, z, ry, coat = 0x6a4a2e, mane = 0x1a120c) => { const h = world.makeHorse(coat, mane); h.position.set(x, 0, z); h.rotation.y = ry; h.userData.anim = true; G.add(h); const u = h.userData; R.anim((dt, t) => { if (u.neck) u.neck.rotation.x = 0.55 + Math.sin(t * 0.6 + x) * 0.08; if (u.tail) u.tail.rotation.z = Math.sin(t * 1.4 + z) * 0.2; }); R.collideC(x, z, 1.0); return h; };
    R.perch = (x, z, {bird = true, hooded = false} = {}) => {
      R.cyl(0.04, 0.05, 1.3, darkWood, x, 0.65, z, 8); R.box(0.5, 0.05, 0.08, darkWood, x, 1.3, z); R.cyl(0.2, 0.25, 0.05, darkWood, x, 0.03, z, 10);
      if (bird){ const g = new THREE.Group(); g.position.set(x, 1.35, z); g.userData.anim = true; G.add(g);
        R.add(new THREE.SphereGeometry(0.13, 10, 8), mat(0x6a4a2e), 0, 0.16, 0, true, g).scale.set(0.9, 1.3, 1); R.add(new THREE.SphereGeometry(0.1, 10, 8), mat(0xe2d4b8), 0, 0.14, 0.05, true, g).scale.set(0.8, 1.1, 0.7);
        const head = R.add(new THREE.SphereGeometry(0.08, 10, 8), hooded ? mat(0x6a2a1a) : mat(0x5a3a22), 0, 0.36, 0.02, true, g); R.add(new THREE.ConeGeometry(0.025, 0.06, 6), mat(0xe8c040), 0, 0.34, 0.1, true, g).rotation.x = Math.PI / 2;
        R.anim((dt, t) => { g.rotation.y = Math.sin(t * 0.4 + x) * 0.7; head.rotation.y = Math.sin(t * 1.3 + z) * 0.4; }); }
      R.collideC(x, z, 0.3);
    };
    R.loom = (x, z, ry = 0, color = 0x1d4fb8) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].forEach(([a, b]) => R.box(0.08, 1.8, 0.08, wood, a, 0.9, b, 0, g));
      [0.4, 1.0, 1.75].forEach(y => R.box(1.9, 0.08, 0.08, darkWood, 0, y, -0.7, 0, g)); R.box(1.9, 0.08, 0.08, darkWood, 0, 0.9, 0.7, 0, g);
      const cloth = R.box(1.6, 0.02, 1.3, mat(color, {roughness:0.8}), 0, 0.92, 0, 0, g); cloth.rotation.x = -0.15;
      for (let i = 0; i < 30; i++) R.box(0.005, 0.8, 0.005, linen, -0.75 + i * 0.052, 1.35, -0.7, 0, g);
      R.bench(x + Math.sin(ry) * 1.2, z + Math.cos(ry) * 1.2, 1.2, ry);
      R.collide(x, z, 1.0, 0.8, ry);
    };
    R.bolts = (x, y, z, ry, colors = [0xc8102e, 0x1d4fb8, 0xd4af37, 0x2a8a5a, 0x8a3ab8, 0xf2e6d0, 0xff8fab]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); colors.forEach((c, i) => { const b = R.cyl(0.12, 0.12, 1.2, mat(c, {roughness:0.75}), -((colors.length - 1) * 0.13) + i * 0.26, 0.12, 0, 14, g); b.rotation.x = Math.PI / 2; }); return g; };
    R.mannequin = (x, z, ry, color) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); R.cyl(0.2, 0.25, 0.05, darkWood, 0, 0.03, 0, 12, g); R.cyl(0.02, 0.02, 0.6, darkWood, 0, 0.3, 0, 6, g); R.add(new THREE.LatheGeometry([[0, 0.6], [0.5, 0.62], [0.38, 0.9], [0.22, 1.1], [0.15, 1.2], [0.18, 1.35], [0.19, 1.5], [0.13, 1.6], [0, 1.62]].map(([a, b]) => new THREE.Vector2(a, b)), 20), mat(color, {roughness:0.55}), 0, 0, 0, true, g); R.add(new THREE.SphereGeometry(0.07, 10, 8), darkWood, 0, 1.68, 0, true, g); R.collideC(x, z, 0.5); return g; };
    R.vitrine = (x, z, ry = 0, gems = [0xff2a4a, 0x2f7bff, 0x22e08a, 0xb35bff]) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g);
      R.box(1.4, 0.9, 0.7, darkWood, 0, 0.45, 0, 0, g); R.box(1.45, 0.05, 0.75, gold, 0, 0.92, 0, 0, g);
      R.box(1.4, 0.5, 0.7, mat(0xdfeaf2, {roughness:0.05, transparent:true, opacity:0.2}), 0, 1.2, 0, 0, g).castShadow = false;
      [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].forEach(([a, b]) => R.box(0.03, 0.5, 0.03, gold, a, 1.2, b, 0, g));
      const spin = new THREE.Group(); spin.userData.anim = true; spin.position.y = 1.02; g.add(spin);
      gems.forEach((c, i) => { const o = R.add(new THREE.OctahedronGeometry(0.07, 0), mat(c, {roughness:0.05, metalness:0.3, emissive:c, emissiveIntensity:0.5}), -0.45 + i * 0.3, 0.06, 0, false, spin); R.anim((dt, t) => { o.rotation.y = t * 1.2 + i; }); R.cyl(0.05, 0.06, 0.03, mat(0x1a1a3a), -0.45 + i * 0.3, -0.005, 0, 10, spin); });
      R.collide(x, z, 0.75, 0.4, ry);
    };
    R.gear = (x, y, z, rad, {axis = 'z', speed = 0.3, teeth = 18, m = brass} = {}) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.userData.anim = true; G.add(g);
      const wheel = R.add(new THREE.CylinderGeometry(rad, rad, 0.08, 32), m, 0, 0, 0, true, g); wheel.rotation.x = Math.PI / 2;
      for (let i = 0; i < teeth; i++){ const a = i / teeth * Math.PI * 2, t = R.box(0.08, rad * 0.18, 0.08, m, Math.cos(a) * rad, Math.sin(a) * rad, 0, 0, g); t.rotation.z = a - Math.PI / 2; }
      for (let i = 0; i < 4; i++){ const s = R.box(0.06, rad * 1.8, 0.06, iron, 0, 0, 0.05, 0, g); s.rotation.z = i * Math.PI / 4; }
      if (axis === 'x') g.rotation.y = Math.PI / 2;
      R.anim(dt => { if (axis === 'x') g.rotation.x += dt * speed; else g.rotation.z += dt * speed; });
      return g;
    };
    R.pool = (x, z, w, d, {color = 0x4ab0b0, steam = true} = {}) => {
      R.box(w + 0.8, 0.4, 0.4, mat(0xf2ede4, {roughness:0.3}), x, 0.2, z - d / 2 - 0.2); R.box(w + 0.8, 0.4, 0.4, mat(0xf2ede4, {roughness:0.3}), x, 0.2, z + d / 2 + 0.2);
      R.box(0.4, 0.4, d, mat(0xf2ede4, {roughness:0.3}), x - w / 2 - 0.2, 0.2, z); R.box(0.4, 0.4, d, mat(0xf2ede4, {roughness:0.3}), x + w / 2 + 0.2, 0.2, z);
      const water = R.add(new THREE.PlaneGeometry(w, d), mat(color, {metalness:0.2, roughness:0.05, transparent:true, opacity:0.85, emissive:0x0a3a3a, emissiveIntensity:0.4}), x, 0.3, z, false); water.rotation.x = -Math.PI / 2; water.userData.keep = true;
      R.collide(x, z, w / 2 + 0.4, d / 2 + 0.4);
      if (steam){
        const n = 60, pg = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) p.set([x + (rnd() - 0.5) * w, 0.4 + rnd() * 3, z + (rnd() - 0.5) * d], i * 3);
        pg.setAttribute('position', new THREE.BufferAttribute(p, 3));
        const [c, cg] = canvas(64, 64); const gr = cg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
        const pts = new THREE.Points(pg, new THREE.PointsMaterial({size:1.6, map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, opacity:0.35})); pts.userData.anim = true; G.add(pts);
        R.anim(dt => { for (let i = 0; i < n; i++){ p[i * 3 + 1] += dt * 0.4; if (p[i * 3 + 1] > 3.5) p[i * 3 + 1] = 0.4; } pg.attributes.position.needsUpdate = true; });
      }
    };
    R.stage = (z, w, d, {curtain = 0x8a1020, h = 1.0} = {}) => {
      R.box(w, h, d, darkWood, 0, h / 2, z); R.box(w + 0.2, 0.08, d + 0.2, mat(0x6a4a2a, {roughness:0.6}), 0, h, z);
      R.collide(0, z, w / 2, d / 2);
      const prosc = r.h - 0.6;
      [-1, 1].forEach(sd => { R.box(0.8, prosc, 0.6, gold, sd * (w / 2 + 0.2), prosc / 2, z + d / 2); const cu = R.box(w * 0.22, prosc - h - 0.4, 0.12, mat(curtain, {roughness:0.85}), sd * (w / 2 - w * 0.11), h + (prosc - h - 0.4) / 2, z + d / 2 - 0.25); });
      R.box(w + 1.4, 1.0, 0.6, gold, 0, prosc - 0.1, z + d / 2);
      R.box(w, 0.6, 0.15, mat(curtain, {roughness:0.85}), 0, prosc - 0.8, z + d / 2 - 0.25);
      // sahne dekoru: boyalı orman fonu ve ışıklar
      R.add(new THREE.PlaneGeometry(w - 0.4, prosc - h - 0.5), new THREE.MeshStandardMaterial({map:paintingTex('manzara', 3), roughness:0.8}), 0, h + (prosc - h - 0.5) / 2, z - d / 2 + 0.1, false);
      for (let i = 0; i < 9; i++) R.add(new THREE.SphereGeometry(0.06, 6, 4), glowMat, -w / 2 + 0.5 + i * (w - 1) / 8, h + 0.08, z + d / 2 - 0.1, false);
      R.light(0, h + 2.5, z, 0xffe0b0, 6, 14);
    };
    R.seats = (x, z, rows, cols, {ry = 0, gap = 0.7, rowGap = 0.95, seat = mat(0x8a1a2a, {roughness:0.85})} = {}) => {
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){ if (cols > 6 && i === Math.floor(cols / 2)) continue; R.chair(x - (cols - 1) * gap / 2 + i * gap, z + j * rowGap, ry, {seat, gilt:true}); }
      R.collide(x, z + (rows - 1) * rowGap / 2, cols * gap / 2, rows * rowGap / 2 * 0.95);
    };
    R.trophy = (x, y, z, ry) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; G.add(g); const sh = R.add(new THREE.CircleGeometry(0.3, 6), darkWood, 0, 0, 0.02, false, g); R.add(new THREE.SphereGeometry(0.14, 10, 8), mat(0x7a5a3a), 0, -0.05, 0.12, true, g).scale.set(0.8, 1, 1.4); const ant = mat(0xe8dcc4, {roughness:0.6}); [-1, 1].forEach(sd => { const b = R.cyl(0.02, 0.03, 0.5, ant, sd * 0.12, 0.22, 0.12, 6, g); b.rotation.z = -sd * 0.6; for (let k = 0; k < 3; k++){ const t = R.cyl(0.012, 0.02, 0.2, ant, sd * (0.18 + k * 0.05), 0.25 + k * 0.08, 0.12, 5, g); t.rotation.z = -sd * 0.1; } }); return g; };
    R.weaponRack = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; G.add(g); R.box(1.6, 0.1, 0.3, darkWood, 0, 0.5, 0, 0, g); R.box(1.6, 0.1, 0.3, darkWood, 0, 1.6, 0, 0, g); for (let i = 0; i < 5; i++){ R.cyl(0.02, 0.02, 1.7, wood, -0.6 + i * 0.3, 1.0, 0.05, 6, g); const b = R.add(new THREE.TorusGeometry(0.6, 0.02, 4, 16, Math.PI * 0.7), wood, -0.6 + i * 0.3, 1.1, 0.12, true, g); b.rotation.set(0, Math.PI / 2, -Math.PI * 0.35); } R.collide(x, z, 0.85, 0.25, ry); };
    R.npc = (x, z, ry, name, lines, {coat = 0x2a3a5a, hat = true, apron = false} = {}) => {
      const g = world.makeGuard(), u = g.userData;
      u.armR.remove(u.armR.children[u.armR.children.length - 1]);
      const cm = mat(coat, {roughness:0.6});
      g.traverse(o => { if (o.material === M.coatMat) o.material = cm; if (!hat && o.position.y > 1.9) o.visible = false; });
      if (apron) R.box(0.42, 0.75, 0.02, mat(apron === true ? 0xf4ead6 : apron), 0, 0.95, 0.17, 0, g);
      g.position.set(x, 0, z); g.rotation.y = ry; g.userData.anim = true; G.add(g); R.collideC(x, z, 0.4);
      R.anim((dt, t, hero) => { const hx = hero.pos.x - (r.ox + x), hz = hero.pos.z - (r.oz + z), dd = Math.hypot(hx, hz); world.turnToward(g, dd < 5 ? Math.atan2(hx, hz) : ry, Math.min(1, dt * 3)); });
      R.interact(x, z, 'Konuş: ' + name, () => hooks.ui.dialog((typeof lines === 'function' ? lines() : lines).map(text => typeof text === 'string' ? {name, text} : Object.assign({name}, text))), 2.4);
      return g;
    };
    return R;
  }

  /* ---------- giriş / çıkış (main.js çağırır) ---------- */
  function open(r){
    if (!r.built) build(r);
    rooms.forEach(o => { if (o.G) o.G.visible = o === r; });
    active = r;
    inside.length = 0; r.interact.forEach(o => inside.push(o));
    return {x:r.ox, y:ROOM_Y, z:r.oz + r.d / 2 - 1.8, yaw:Math.PI};
  }
  function close(){
    if (active && active.G) active.G.visible = false;
    active = null; inside.length = 0;
  }
  function update(dt, t, hero){
    if (!active) return;
    const W = world.W, day = Math.max(0, 1 - W.night) * (1 - 0.4 * W.clouds);
    winMat.emissiveIntensity = 0.12 + day * 1.3; winMat.emissive.setRGB(0.55 + day * 0.4, 0.62 + day * 0.33, 0.85 + day * 0.1);
    active.updaters.forEach(fn => fn(dt, t, hero));
    active.lightList.forEach(({l, base}) => { l.intensity = base * (0.8 + 0.45 * W.night) * (l.userData.flick || 1); });
  }
  return {C, add, open, close, update, rooms, outside:owner => outside.get(owner) || [], inside, markers, get active(){ return active; }, mat, texture};
}
