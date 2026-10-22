// Saray bahçeleri ve yapıları: gül labirenti, kuğu ve tavus kuşu göleti, şarap mahzeni, şahin yuvası,
// opera ve sanat galerisi, balo salonu (orangerie), rasathane, kütüphane ve arşiv, binicilik maneji,
// hamam, okçuluk poligonu, satranç köşkü, saray mutfağı, parfüm laboratuvarı ve ipek atölyesi.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { doorway } from './doors.js';

export const ROSE = {x:-68, z:118};            // Jardin à la française (güneybatı)
export const SWAN = {x:-142, z:150, rx:20, rz:13};
export const ARENA = {x:-136, z:100, w:40, d:22};
export const CHESS = {x:-68, z:166};
export const BALL = {x:0, z:-95};              // şatonun arkası
export const OPERA = {x:-58, z:-95};
export const LIB = {x:58, z:-95};
export const OBS = {x:0, z:-142};
export const FALCON = {x:-120, z:-92};          // kuzeybatı
export const HAMAM = {x:124, z:-58};            // kuzeydoğu
export const ARCH = {x:128, z:4};
export const KITCHEN = {x:128, z:66};           // doğu: üretim
export const PERFUME = {x:160, z:66};
export const SILK = {x:202, z:82};
export const WINERY = {x:202, z:122};
// Ağaç dikilmeyecek alanlar [x0, z0, x1, z1]
export const COURT_ZONES = [[-172, 84, -30, 184], [-82, -172, 82, -58], [-150, -122, -88, -66], [96, -92, 176, 28], [96, 36, 232, 160]];

export const PLACES = [
  {id:'gul', name:'Gül labirenti', x:ROSE.x, z:ROSE.z, r:30},
  {id:'kugu', name:'Kuğu ve tavus kuşu göleti', x:SWAN.x, z:SWAN.z, r:26},
  {id:'sarap', name:'Şarap mahzeni', x:WINERY.x, z:WINERY.z, r:18},
  {id:'sahin', name:'Şahin yuvası', x:FALCON.x, z:FALCON.z, r:22},
  {id:'opera', name:'Saray operası ve galeri', x:OPERA.x, z:OPERA.z, r:24},
  {id:'balo', name:'Balo salonu ve orangerie', x:BALL.x, z:BALL.z, r:22},
  {id:'rasat', name:'Rasathane', x:OBS.x, z:OBS.z, r:18},
  {id:'kutup', name:'Kütüphane ve arşiv', x:LIB.x, z:LIB.z, r:22},
  {id:'manej', name:'Binicilik maneji', x:ARENA.x, z:ARENA.z, r:26},
  {id:'hamam', name:'Mermer hamam ve kaplıca', x:HAMAM.x, z:HAMAM.z, r:22},
  {id:'okculuk', name:'Okçuluk poligonu', x:ARCH.x, z:ARCH.z, r:26},
  {id:'satranc', name:'Satranç köşkü', x:CHESS.x, z:CHESS.z, r:14},
  {id:'mutfak', name:'Saray mutfağı ve fırın', x:KITCHEN.x, z:KITCHEN.z, r:16},
  {id:'parfum', name:'Parfüm laboratuvarı', x:PERFUME.x, z:PERFUME.z, r:14},
  {id:'ipek', name:'İpek ve kumaş atölyesi', x:SILK.x, z:SILK.z, r:18},
];

export function buildCourt(world, C, hooks){
  const { THREE, scene, materials:M, windMat } = world;
  const root = new THREE.Group(); root.name = 'SarayBahceleri'; scene.add(root);
  const doors = {};   // bina kapılarının önü: içleri rooms-lumiere.js bağlar
  let seed = 1724; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const interact = [], markers = [], updaters = [];
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), col = new THREE.Color();
  function add(geo, mat, x, y, z, parent = root, cast = true){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function ctex(c, rx = 1, ry = 1){ const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  function plane(w, d, mat, x, y, z, rot = 0, parent = root){
    const g = new THREE.PlaneGeometry(w, d);
    // çakıl dokusu büyük bahçe için 18 kez tekrar ediyor: dar yollarda karo boyunu (~4 m) koru
    if (mat === M.gravelMat){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 76, uv.getY(i) * d / 74); }
    const m = add(g, mat, x, y, z, parent, false); m.rotation.set(-Math.PI / 2, 0, rot); return m;
  }
  function disc(r, mat, x, y, z, parent = root, seg = 48){ const m = add(new THREE.CircleGeometry(r, seg), mat, x, y, z, parent, false); m.rotation.x = -Math.PI / 2; return m; }
  // grup içindeki yerel noktayı dünyaya çevir (yalnız Y ekseninde dönüş)
  const toWorld = (G, lx, lz) => { const c = Math.cos(G.rotation.y), s = Math.sin(G.rotation.y); return [G.position.x + lx * c + lz * s, G.position.z - lx * s + lz * c]; };
  const S = () => hooks.getS();
  const say = (name, text, choices) => hooks.ui.dialog([{name, text, choices}]);

  /* ================= malzemeler ================= */
  const gold = M.goldMat, stone = M.stoneMat, marble = M.marbleMat, gravel = M.gravelMat, slate = M.slateMat, hedge = M.hedgeMat;
  const wood = new THREE.MeshStandardMaterial({color:0x6b4a2e, roughness:0.85});
  const darkWood = new THREE.MeshStandardMaterial({color:0x3e2a1a, roughness:0.7});
  const plaster = new THREE.MeshStandardMaterial({color:0xefe4cf, roughness:0.8});
  const cream = new THREE.MeshStandardMaterial({color:0xf4ead6, roughness:0.55});
  const brick = (() => {
    const [c, g] = canvas(256, 256); g.fillStyle = '#c9b9a0'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++){ const v = 150 + rnd() * 50; g.fillStyle = `rgb(${v + 25 | 0},${v * 0.85 | 0},${v * 0.65 | 0})`; g.fillRect(x * 32 + (y % 2) * 16 + 1, y * 16 + 1, 30, 14); }
    return new THREE.MeshStandardMaterial({map:ctex(c, 2, 2), roughness:0.9});
  })();
  const tiles = (() => {
    const [c, g] = canvas(128, 128); g.fillStyle = '#9a4a2a'; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++){ g.fillStyle = `rgba(${150 + rnd() * 50 | 0},${60 + rnd() * 30 | 0},${30 + rnd() * 20 | 0},1)`; g.beginPath(); g.arc(x * 16 + (y % 2) * 8 + 8, y * 16 + 4, 8, 0, Math.PI); g.fill(); }
    return new THREE.MeshStandardMaterial({map:ctex(c, 6, 4), roughness:0.8});
  })();
  const copper = new THREE.MeshStandardMaterial({color:0x5fa58e, metalness:0.5, roughness:0.45});
  const brass = new THREE.MeshStandardMaterial({color:0xc9933a, metalness:0.95, roughness:0.3});
  const red = new THREE.MeshStandardMaterial({color:0x8a1424, roughness:0.6});
  const navy = new THREE.MeshStandardMaterial({color:0x1d2a5a, roughness:0.6});
  const water = new THREE.MeshStandardMaterial({color:0x2a5a68, metalness:0.3, roughness:0.05, transparent:true, opacity:0.9});
  const leafMat = new THREE.MeshStandardMaterial({color:0x2f6a2a, roughness:0.8, flatShading:true});
  const grassMat = new THREE.MeshStandardMaterial({map:M.lawnMat.map, color:0x9fbf7a, roughness:0.95});
  const sand = (() => { const [c, g] = canvas(256, 256); g.fillStyle = '#cdb68e'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 7000; i++){ const v = 150 + rnd() * 80; g.fillStyle = `rgba(${v},${v - 20 | 0},${v - 55 | 0},.5)`; g.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5); } return new THREE.MeshStandardMaterial({map:ctex(c, 8, 5), roughness:1}); })();
  const glass = new THREE.MeshStandardMaterial({color:0xdff3f6, metalness:0.15, roughness:0.04, transparent:true, opacity:0.18, envMapIntensity:1.6, side:THREE.DoubleSide, depthWrite:false});
  // gece yanan pencereler
  const winMat = new THREE.MeshStandardMaterial({color:0x26313c, metalness:0.6, roughness:0.12, emissive:0xffb35a, emissiveIntensity:0});
  const lampMat = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
  const floorMat = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.2});
  new THREE.TextureLoader().load('assets/textures/mermer_dama.jpg', t => { t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 3); floorMat.map = t; floorMat.needsUpdate = true; });
  const mosaic = (() => {
    const [c, g] = canvas(256, 256); g.fillStyle = '#e9dfc8'; g.fillRect(0, 0, 256, 256);
    const P = ['#1f5f8b', '#2f8c84', '#c9a24a', '#a83a2a', '#e9dfc8'];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++){ const d = Math.max(Math.abs(x - 15.5), Math.abs(y - 15.5)) | 0, k = (d + ((x + y) % 4 === 0 ? 1 : 0)) % 5; g.fillStyle = P[k]; g.fillRect(x * 8 + 0.5, y * 8 + 0.5, 7, 7); }
    return new THREE.MeshStandardMaterial({map:ctex(c, 3, 3), roughness:0.5});
  })();
  const blooms = [], bushes = [], fruits = [];
  // aynı renkteki malzemeleri paylaş (birleştirme sonrası daha az çizim çağrısı)
  const matCache = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({color, roughness:0.6}, o))); return matCache.get(k); };

  /* ================= ortak yapı parçaları ================= */
  function signBoard(text, x, y, z, ry = 0, w = 3.4, parent = root){
    const [c, g] = canvas(512, 128); g.fillStyle = '#2c2016'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#d4af37'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
    g.fillStyle = '#f6ecd0'; g.textAlign = 'center'; let fs = 60; do { g.font = fs + 'px Georgia, serif'; fs -= 2; } while (g.measureText(text).width > 470); g.fillText(text, 256, 64 + fs * 0.36);
    const b = add(new THREE.BoxGeometry(w, w / 4, 0.08), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.8}), x, y, z, parent); b.rotation.y = ry; return b;
  }
  function signPost(text, x, z, ry){
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
    [-1.4, 1.4].forEach(dx => add(new THREE.BoxGeometry(0.14, 2.8, 0.14), darkWood, dx, 1.4, 0, g));
    signBoard(text, 0, 2.5, 0, 0, 3.0, g); C.circle(x, z, 0.3);
  }
  function column(x, z, h, r = 0.3, parent = root, mat = marble, cap = gold){
    add(new THREE.BoxGeometry(r * 3, 0.3, r * 3), mat, x, 0.15, z, parent);
    add(new THREE.CylinderGeometry(r, r * 1.12, h - 0.6, 16), mat, x, 0.3 + (h - 0.6) / 2, z, parent);
    add(new THREE.CylinderGeometry(r * 1.6, r * 1.05, 0.3, 16), cap, x, h - 0.15, z, parent);
  }
  // kesik piramit (mansart çatı)
  function frustum(w, d, h, inset){ const g = new THREE.BoxGeometry(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0){ p.setX(i, p.getX(i) * (1 - inset * 2 / w)); p.setZ(i, p.getZ(i) * (1 - inset * 2 / d)); } g.computeVertexNormals(); return g; }
  function gableGeo(w, d, h){ const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, {depth:d, bevelEnabled:false}); g.translate(0, 0, -d / 2); return g; }
  /** Dikdörtgen bina: kapı yerel +z yüzünde. Çarpışma kutusu ve pencereler dahil. */
  function hall({x, z, w, d, h, rot = 0, wall = plaster, roof = 'mansard', roofMat = slate, roofH = 3.4, door = true, doorW = 2.2, doorStyle = 'saray', pil = true, winRows = 1}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    add(new THREE.BoxGeometry(w + 0.4, 0.6, d + 0.4), stone, 0, 0.3, 0, G);
    add(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0, G);
    add(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), cream, 0, h + 0.2, 0, G);
    if (roof === 'mansard'){ add(frustum(w + 0.2, d + 0.2, roofH, Math.min(w, d) * 0.22), roofMat, 0, h + 0.42 + roofH / 2, 0, G); add(new THREE.BoxGeometry(w * 0.5, 0.12, 0.12), gold, 0, h + roofH + 0.45, 0, G); }
    else if (roof === 'gable'){ const gr = add(gableGeo(d + 0.8, w + 0.6, roofH), roofMat, 0, h + 0.4, 0, G); gr.rotation.y = Math.PI / 2; }
    else if (roof === 'flat') add(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2), cream, 0, h + 0.55, 0, G);
    // pencereler ve plasterler
    const faces = [[0, d / 2 + 0.05, 0, w], [Math.PI, -d / 2 - 0.05, 0, w], [Math.PI / 2, 0, w / 2 + 0.05, d], [-Math.PI / 2, 0, -w / 2 - 0.05, d]];
    faces.forEach(([ry, fz, fx, len], fi) => {
      const n = Math.max(1, Math.floor(len / 3.2));
      for (let i = 0; i < n; i++){
        const u = -len / 2 + (i + 0.5) * len / n;
        for (let r = 0; r < winRows; r++){
          if (door && fi === 0 && Math.abs(u) < doorW && r === 0) continue;
          const wy = 1.2 + (h - 1.6) * (r + 0.5) / winRows, wh = Math.min(2.6, (h - 1.6) / winRows - 0.7);
          const wx = fi < 2 ? u : fx, wz = fi < 2 ? fz : u;
          const wm = add(new THREE.PlaneGeometry(1.1, wh), winMat, wx, wy, wz, G, false); wm.rotation.y = ry;
          const fr = add(new THREE.BoxGeometry(1.35, 0.14, 0.12), cream, wx, wy + wh / 2 + 0.1, wz, G, false); fr.rotation.y = ry;
        }
        if (pil && i > 0){ const px = fi < 2 ? -len / 2 + i * len / n : fx, pz = fi < 2 ? fz : -len / 2 + i * len / n; const pl = add(new THREE.BoxGeometry(0.4, h, 0.16), cream, px, h / 2, pz, G, false); pl.rotation.y = ry; }
      }
    });
    if (door){
      doorway(world, G, {z:d / 2, w:doorW, h:3.0, y0:0.3, style:doorStyle, pediment:h >= 7});
    }
    C.box(x, z, w / 2 + 0.2, d / 2 + 0.2, rot);
    const front = toWorld(G, 0, d / 2 + 1.6);
    return {G, front};
  }
  /** Sütunlu yuvarlak köşk (gazebo); kubbe ya da sivri çatı. */
  function gazebo({x, z, r = 3, n = 8, h = 3.2, roofMat = copper, dome = true, floor = marble, open = true}){
    const G = new THREE.Group(); G.position.set(x, 0, z); root.add(G);
    add(new THREE.CylinderGeometry(r + 0.6, r + 0.8, 0.3, 32), floor, 0, 0.15, 0, G);
    for (let i = 0; i < n; i++){ const a = (i + 0.5) / n * Math.PI * 2; column(Math.cos(a) * r, Math.sin(a) * r, h, 0.14, G); C.circle(x + Math.cos(a) * r, z + Math.sin(a) * r, 0.25); }
    add(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.4, 32), cream, 0, h + 0.2, 0, G);
    if (dome){ const dm = add(new THREE.SphereGeometry(r + 0.3, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), roofMat, 0, h + 0.4, 0, G); dm.scale.y = 0.7; }
    else add(new THREE.ConeGeometry(r + 0.6, 2.4, n), roofMat, 0, h + 1.6, 0, G);
    add(new THREE.SphereGeometry(0.22, 12, 8), gold, 0, h + 0.4 + (dome ? (r + 0.3) * 0.7 : 2.4) + 0.1, 0, G);
    platforms.push({x, z, r:r + 0.7, h:0.3});
    if (!open) C.circle(x, z, r);
    return G;
  }
  const platforms = [];
  C.heightFns.push((x, z) => { for (const p of platforms) if (p.r ? Math.hypot(x - p.x, z - p.z) < p.r : Math.abs(x - p.x) < p.hw && Math.abs(z - p.z) < p.hd) return p.h; return null; });

  /* ================= fıskiyeler (su parçacıkları) ================= */
  const jetMat = new THREE.PointsMaterial({color:0xe8f4ff, size:0.13, transparent:true, opacity:0.85, depthWrite:false});
  const jets = [];
  function jet(x, y, z, n = 90, power = 3.2, spread = 0.7, water = 0.5){
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const J = {x, y, z, n, pos, vel, geo, power, spread, water};
    J.reset = i => { pos.set([x, y, z], i * 3); const a = rnd() * 6.28, s = spread * (0.6 + rnd() * 0.4); vel.set([Math.cos(a) * s, power * (0.85 + rnd() * 0.3), Math.sin(a) * s], i * 3); };
    for (let i = 0; i < n; i++){ J.reset(i); const k = rnd() * 1.2; for (let a = 0; a < 3; a++) pos[i * 3 + a] += vel[i * 3 + a] * k; vel[i * 3 + 1] -= 9.8 * k; }
    const P = new THREE.Points(geo, jetMat); P.frustumCulled = false; root.add(P); jets.push(J); return J;
  }
  function fountain(x, z, r, tiers = 2, parent = root){
    const prof = [[r - 0.35, 0], [r, 0], [r + 0.05, 0.55], [r - 0.15, 0.65], [r - 0.35, 0.4]].map(([a, b]) => new THREE.Vector2(a, b));
    add(new THREE.LatheGeometry(prof, 56), marble, x, 0, z, parent);
    disc(r - 0.3, water, x, 0.45, z, parent);
    let top = 0.5;
    for (let t = 0; t < tiers; t++){
      const br = r * (0.42 - t * 0.14), ph = 1.1 - t * 0.2;
      add(new THREE.CylinderGeometry(0.14 + 0.1 * (tiers - t), 0.22 + 0.1 * (tiers - t), ph, 14), marble, x, top + ph / 2, z, parent);
      top += ph;
      const bowl = [[0.1, 0], [br, 0.12], [br + 0.05, 0.32], [br - 0.08, 0.3], [0.1, 0.1]].map(([a, b]) => new THREE.Vector2(a, b));
      add(new THREE.LatheGeometry(bowl, 40), marble, x, top, z, parent);
      disc(br - 0.1, water, x, top + 0.27, z, parent);
      top += 0.3;
    }
    add(new THREE.SphereGeometry(0.18, 12, 8), gold, x, top + 0.2, z, parent);
    jet(x, top + 0.35, z, Math.round(70 + r * 14), 2.6 + tiers * 0.7, 0.55 + r * 0.06, 0.45);
    C.circle(x, z, r + 0.15);
  }

  /* ================= heykeller ================= */
  const statueGeos = [0, 1, 2, 3].map(v => {
    const parts = [];
    const robe = new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.38, 0.4], [0.3, 0.95], [0.24, 1.3], [0, 1.3]].map(([a, b]) => new THREE.Vector2(a, b)), 16);
    parts.push(robe);
    const torso = new THREE.CylinderGeometry(0.19, 0.24, 0.55, 12); torso.translate(0, 1.55, 0); parts.push(torso);
    const head = new THREE.SphereGeometry(0.15, 14, 10); head.translate(0, 1.98, 0); parts.push(head);
    const arms = [[-0.6, 0.3 + v * 0.5], [0.4 + v * 0.6, -0.4]];
    arms.forEach(([rz, rx], k) => { const a = new THREE.CylinderGeometry(0.06, 0.05, 0.62, 8); a.translate(0, -0.31, 0); a.rotateX(rx); a.rotateZ((k ? -1 : 1) * Math.abs(rz)); a.translate((k ? 1 : -1) * 0.26, 1.78, 0); parts.push(a); });
    if (v === 1){ const t = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6); t.translate(0.38, 1.9, 0.2); parts.push(t); }       // asa
    if (v === 2){ const u = new THREE.LatheGeometry([[0, 0], [0.14, 0.05], [0.18, 0.25], [0.1, 0.4], [0.13, 0.48], [0, 0.48]].map(([a, b]) => new THREE.Vector2(a, b)), 12); u.translate(-0.42, 2.0, 0.15); parts.push(u); } // testi
    if (v === 3){ const w = new THREE.ConeGeometry(0.5, 0.9, 4); w.rotateX(-0.4); w.translate(0, 1.7, -0.32); parts.push(w); }       // kanat
    return mergeBufferGeometries(parts);
  });
  const STATUE_NAMES = [['Flora', 'Bahar ve çiçeklerin tanrıçası. Kaidesinde: "Her gül bir mevsimi taşır."'], ['Apollon', 'Müzik ve ışığın tanrısı. Elindeki asa güneş ışınlarını simgeler.'], ['Hebe', 'Gençliğin sakisi; testisinden tanrılara ambrosia döker.'], ['Zefir', 'Batı rüzgârı. Kanatları baharı Lumière\'e getirir.'], ['Diana', 'Avcıların koruyucusu. Şahinciler ona selam verir.'], ['Pomona', 'Meyve bahçelerinin perisi. Bağın ilk salkımı ona sunulur.']];
  function statue(x, z, v, ry = 0, scale = 1, withPlaque = true){
    add(new THREE.BoxGeometry(0.9 * scale, 1.1 * scale, 0.9 * scale), marble, x, 0.55 * scale, z);
    add(new THREE.BoxGeometry(1.05 * scale, 0.14 * scale, 1.05 * scale), marble, x, 1.12 * scale, z);
    const st = add(statueGeos[v % 4], marble, x, 1.19 * scale, z); st.rotation.y = ry; st.scale.setScalar(scale);
    C.circle(x, z, 0.55 * scale);
    if (withPlaque){ const [nm, txt] = STATUE_NAMES[(v + statues.length) % STATUE_NAMES.length]; statues.push({x, z, nm, txt}); interact.push({x, z, r:1.9, label:'Heykel: ' + nm, show:() => true, act:() => say(nm, txt)}); }
  }
  const statues = [];

  /* ================= insanlar ================= */
  function npc({coat = 0x3a2a5a, hat = 'tricorne', apron = false, chef = false}){
    const g = world.makeGuard(), u = g.userData;
    const cm = mat(chef ? 0xf4f2ee : coat);
    u.armR.remove(u.armR.children[u.armR.children.length - 1]);  // teber yok
    g.traverse(o => { if (o.material === M.coatMat) o.material = cm; if (o.material === M.redMat) o.material = gold; if ((hat !== 'tricorne' || chef) && o.position.y > 1.9) o.visible = false; });
    if (chef){ add(new THREE.CylinderGeometry(0.17, 0.13, 0.36, 14), cream, 0, 2.08, 0, g); add(new THREE.SphereGeometry(0.2, 14, 8), cream, 0, 2.28, 0, g).scale.y = 0.6; }
    if (apron) add(new THREE.BoxGeometry(0.42, 0.75, 0.02), apron === true ? cream : mat(apron), 0, 0.95, 0.17, g);
    return g;
  }
  const eyeMat = new THREE.MeshBasicMaterial({color:0x2a1a12});
  function lady(gownC, hairC = 0x5a3a22){
    const g = new THREE.Group();
    const skin = mat(0xecc9ad, {roughness:0.62}), gown = mat(gownC, {roughness:0.45}), hair = mat(hairC, {roughness:0.55});
    add(new THREE.LatheGeometry([[0, 1.06], [0.17, 1.06], [0.2, 0.95], [0.32, 0.65], [0.5, 0.25], [0.6, 0.02], [0, 0.02]].map(([a, b]) => new THREE.Vector2(a, b)), 28), gown, 0, 0, 0, g);
    add(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 14), gown, 0, 1.25, 0, g);
    add(new THREE.TorusGeometry(0.17, 0.02, 6, 24), gold, 0, 1.08, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.14, 10), skin, 0, 1.52, 0, g);
    const head = add(new THREE.SphereGeometry(0.115, 18, 14), skin, 0, 1.68, 0, g); head.scale.set(0.95, 1.1, 1);
    add(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 1.7, -0.01, g);
    add(new THREE.SphereGeometry(0.09, 12, 10), hair, 0, 1.86, -0.06, g);
    [-1, 1].forEach(sd => { add(new THREE.SphereGeometry(0.016, 8, 6), eyeMat, sd * 0.04, 1.7, 0.105, g); const a = add(new THREE.CylinderGeometry(0.035, 0.03, 0.5, 8), skin, sd * 0.21, 1.2, 0.04, g); a.rotation.z = sd * 0.15; a.rotation.x = -0.35; });
    return g;
  }
  function placeNPC(g, x, z, ry, name, lines, r = 2.6){
    g.position.set(x, 0, z); g.rotation.y = ry; g.userData.dyn = true; root.add(g); C.circle(x, z, 0.4);
    const home = ry, o = {g, home, x, z};
    updaters.push((dt, t, hero) => {
      const d = Math.hypot(hero.pos.x - x, hero.pos.z - z);
      world.turnToward(g, d < 5 ? Math.atan2(hero.pos.x - x, hero.pos.z - z) : home, Math.min(1, dt * 3));
      g.position.y = Math.sin(t * 1.6 + x) * 0.005;
    });
    if (lines) interact.push({x, z, r, label:'Konuş: ' + name, show:() => true, act:lines});
    return o;
  }

  /* ================= bitkiler ================= */
  const trunkMat = new THREE.MeshStandardMaterial({color:0x6a5038, roughness:0.95});
  function citrus(x, z, s = 1, color = 0xff8a1a, parent = root, pot = true){
    if (pot){ add(new THREE.CylinderGeometry(0.55 * s, 0.4 * s, 0.7 * s, 12), mat(0xf2efe8, {roughness:0.5}), x, 0.35 * s, z, parent); add(new THREE.TorusGeometry(0.55 * s, 0.05, 6, 20), gold, x, 0.7 * s, z, parent).rotation.x = Math.PI / 2; }
    add(new THREE.CylinderGeometry(0.06 * s, 0.09 * s, 1.4 * s, 7), trunkMat, x, (pot ? 0.7 : 0) * s + 0.7 * s, z, parent);
    const crownY = (pot ? 0.7 : 0) * s + 1.9 * s;
    add(new THREE.IcosahedronGeometry(0.85 * s, 1), leafMat, x, crownY, z, parent);
    for (let i = 0; i < 9; i++){ const a = rnd() * 6.28, b = (rnd() - 0.3) * 1.4; fruits.push([parent, x + Math.cos(a) * Math.cos(b) * 0.82 * s, crownY + Math.sin(b) * 0.7 * s, z + Math.sin(a) * Math.cos(b) * 0.82 * s, color]); }
  }
  function bush(x, z, r, color, n = 8, h = 0.5){
    bushes.push([x, h, z, r]);
    for (let i = 0; i < n; i++){ const a = rnd() * 6.28, rr = r * (0.5 + rnd() * 0.5); blooms.push([x + Math.cos(a) * rr, h + (rnd() - 0.2) * r * 0.9, z + Math.sin(a) * rr, color, 1]); }
  }
  function tree(x, z, k = 1, hue = 0.27){
    bushes.push([x, 3.6 * k, z, 1.8 * k, hue]);
    add(new THREE.CylinderGeometry(0.16 * k, 0.28 * k, 3.4 * k, 7), trunkMat, x, 1.7 * k, z);
    C.circle(x, z, 0.35 * k);
  }

  /* =====================================================================
     1. GÜL LABİRENTİ: Jardin à la française
     ===================================================================== */
  {
    const R = ROSE, AV = 3.5, CELL = 4, N = 6, H = AV + N * CELL;           // yarı genişlik: AV + N * CELL
    plane(H * 2 + 8, H * 2 + 8, grassMat, R.x, 0.008, R.z);
    plane(AV * 2, H * 2 + 6, gravel, R.x, 0.08, R.z); plane(H * 2 + 6, AV * 2, gravel, R.x, 0.08, R.z);
    // tohumlu çeyrek labirent; dört yöne aynalanır → simetrik desen
    const walls = {h:[], v:[]};  // h[u][v]: hücrenin "v+1" tarafındaki duvar, v[u][v]: "u+1" tarafındaki duvar
    for (let u = 0; u < N; u++){ walls.h.push(Array(N).fill(true)); walls.v.push(Array(N).fill(true)); }
    const seen = Array.from({length:N}, () => Array(N).fill(false)), stack = [[0, 0]]; seen[0][0] = true;
    while (stack.length){
      const [u, v] = stack[stack.length - 1], nb = [];
      if (u > 0 && !seen[u - 1][v]) nb.push([u - 1, v, 'v', u - 1, v]);
      if (u < N - 1 && !seen[u + 1][v]) nb.push([u + 1, v, 'v', u, v]);
      if (v > 0 && !seen[u][v - 1]) nb.push([u, v - 1, 'h', u, v - 1]);
      if (v < N - 1 && !seen[u][v + 1]) nb.push([u, v + 1, 'h', u, v]);
      if (!nb.length){ stack.pop(); continue; }
      const [nu, nv, k, wu, wv] = nb[Math.floor(rnd() * nb.length)];
      walls[k][wu][wv] = false; seen[nu][nv] = true; stack.push([nu, nv]);
    }
    // merkez meydan: her çeyreğin (0,0) hücresi açık
    walls.h[0][0] = false; walls.v[0][0] = false;
    const segs = [];  // [u0,v0,u1,v1] yerel (çeyrek) metre
    const at = i => AV + i * CELL;
    for (let u = 0; u < N; u++) for (let v = 0; v < N; v++){
      if (walls.h[u][v] && v < N - 1) segs.push([at(u), at(v + 1), at(u + 1), at(v + 1)]);
      if (walls.v[u][v] && u < N - 1) segs.push([at(u + 1), at(v), at(u + 1), at(v + 1)]);
    }
    for (let i = 0; i < N; i++){
      segs.push([at(i), H, at(i + 1), H], [H, at(i), H, at(i + 1)]);          // dış çit
      if (i !== 3 && i !== 0) segs.push([at(i), AV, at(i + 1), AV]);          // cadde kenarı (girişler: 3)
      if (i !== 3 && i !== 0) segs.push([AV, at(i), AV, at(i + 1)]);
    }
    const HH = 2.3, TH = 0.9, ROSEC = ['#c8102e', '#ff8fab', '#ffffff', '#ffb703', '#e0475b'];
    const hedgeSegs = [];
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => segs.forEach(([u0, v0, u1, v1]) => hedgeSegs.push([R.x + sx * u0, R.z + sz * v0, R.x + sx * u1, R.z + sz * v1])));
    const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hedge, hedgeSegs.length);
    hedgeSegs.forEach(([x0, z0, x1, z1], i) => {
      const len = Math.hypot(x1 - x0, z1 - z0) + TH, alongX = Math.abs(z1 - z0) < 0.01, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      m4.compose(L(cx, HH / 2, cz), q4.identity(), s4.set(alongX ? len : TH, HH, alongX ? TH : len)); hm.setMatrixAt(i, m4);
      C.box(cx, cz, (alongX ? len : TH) / 2, (alongX ? TH : len) / 2);
      for (let k = 0; k < 7; k++){ const f = rnd() - 0.5, sd = rnd() < 0.5 ? -1 : 1; blooms.push([cx + (alongX ? f * len : sd * (TH / 2 + 0.02)), 0.6 + rnd() * (HH - 0.5), cz + (alongX ? sd * (TH / 2 + 0.02) : f * len), ROSEC[Math.floor(rnd() * ROSEC.length)], 1]); }
    });
    hm.castShadow = hm.receiveShadow = true; root.add(hm);
    // merkezdeki büyük mermer havuz, cadde havuzları ve heykel galerisi
    fountain(R.x, R.z, 5.2, 3);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz], i) => {
      fountain(R.x + dx * 16, R.z + dz * 16, 1.3, 1);
      [9.5, 22.5].forEach((d, k) => [-1, 1].forEach(sd => statue(R.x + dx * d + (dz ? sd * 2.2 : 0), R.z + dz * d + (dx ? sd * 2.2 : 0), i + k * 2 + (sd > 0 ? 1 : 0), Math.atan2(-dx, -dz) + (dx ? sd : 0) * 0.6, 0.8, true)));
    });
    // her çeyreğin dış köşesinde ödül: gül çardağı ve bank
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => {
      const cx = R.x + sx * (H - CELL / 2), cz = R.z + sz * (H - CELL / 2);
      const arch = add(new THREE.TorusGeometry(1.3, 0.08, 6, 24, Math.PI), darkWood, cx, 0.5, cz); arch.rotation.y = Math.PI / 4 * (sx * sz);
      for (let k = 0; k < 18; k++){ const a = k / 17 * Math.PI; blooms.push([cx + Math.cos(a) * 1.3 * Math.cos(Math.PI / 4), 0.5 + Math.sin(a) * 1.3, cz + Math.cos(a) * 1.3 * Math.sin(Math.PI / 4) * sx * sz, ROSEC[k % 5], 1.4]); }
      add(new THREE.SphereGeometry(0.4, 16, 10), gold, cx, 0.4, cz);
    });
    // giriş kapıları: taş ayaklar ve vazolar
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dz]) => {
      [-1, 1].forEach(sd => {
        const x = R.x + dx * (H + 0.6) + (dz ? sd * (AV + 0.5) : 0), z = R.z + dz * (H + 0.6) + (dx ? sd * (AV + 0.5) : 0);
        add(new THREE.BoxGeometry(1, 2.6, 1), stone, x, 1.3, z); add(new THREE.LatheGeometry([[0, 0], [0.3, 0.05], [0.42, 0.35], [0.25, 0.6], [0.35, 0.75], [0, 0.75]].map(([a, b]) => new THREE.Vector2(a, b)), 16), marble, x, 2.6, z);
        bush(x, z, 0.3, ROSEC[(dx + 2 + sd) % 5], 6, 3.15); C.circle(x, z, 0.7);
      });
    });
    signPost('Jardin des Roses', R.x + 6, R.z - H - 2.5, 0);
    // dış parter: gül tarhları
    for (let i = 0; i < 40; i++){ const side = i % 4, f = (Math.floor(i / 4) + 0.5) / 10 * 2 - 1; if (Math.abs(f) < 0.2) continue; const x = R.x + (side < 2 ? f * (H + 1) : (side === 2 ? -1 : 1) * (H + 2.4)), z = R.z + (side < 2 ? (side ? 1 : -1) * (H + 2.4) : f * (H + 1)); bush(x, z, 0.55, ROSEC[i % 5], 10); C.circle(x, z, 0.55); }
    // yollar: kış bahçesine ve kuzeye
    plane(20, 3.6, gravel, -31, 0.08, R.z);
    plane(3.6, 30, gravel, R.x, 0.08, R.z - H - 18); plane(32, 3.6, gravel, R.x + 16, 0.08, R.z - H - 33);
    plane(3.6, 16, gravel, R.x, 0.08, R.z + H + 8);
    plane(18, 3.6, gravel, R.x - H - 10, 0.08, R.z);
  }

  /* =====================================================================
     2. KUĞU VE TAVUS KUŞU GÖLETİ
     ===================================================================== */
  const swans = [], peacocks = [];
  let feedT = 0, feedAt = null;
  {
    const P = SWAN, ISL = 3.8;
    plane(P.rx * 2 + 26, P.rz * 2 + 22, grassMat, P.x, 0.008, P.z);
    const pw = disc(1, water, P.x, 0.08, P.z, root, 72); pw.scale.set(P.rx, P.rz, 1);
    const rim = add(new THREE.TorusGeometry(1, 0.035, 6, 96), marble, P.x, 0.12, P.z); rim.rotation.x = Math.PI / 2; rim.scale.set(P.rx + 0.15, P.rz + 0.15, 4);
    // kıyı çarpışması (köprü boşluğu hariç)
    for (let i = 0; i < 110; i++){ const a = i / 110 * Math.PI * 2, x = P.x + Math.cos(a) * (P.rx + 0.2), z = P.z + Math.sin(a) * (P.rz + 0.2); if (Math.abs(x - P.x) < 1.6 && z < P.z) continue; C.circle(x, z, 0.75); }
    // ada ve çay köşkü
    disc(ISL + 0.8, grassMat, P.x, 0.22, P.z);
    add(new THREE.CylinderGeometry(ISL + 0.8, ISL + 1.0, 0.3, 40), stone, P.x, 0.05, P.z);
    gazebo({x:P.x, z:P.z, r:2.6, n:8, h:3.0, roofMat:copper});
    for (let i = 0; i < 28; i++){ const a = i / 28 * Math.PI * 2; if (Math.abs(Math.cos(a)) < 0.25 && Math.sin(a) < 0) continue; C.circle(P.x + Math.cos(a) * (ISL + 0.9), P.z + Math.sin(a) * (ISL + 0.9), 0.4); }
    add(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 20), marble, P.x, 0.95, P.z); add(new THREE.CylinderGeometry(0.08, 0.2, 0.65, 10), marble, P.x, 0.6, P.z);
    [0, 1, 2].forEach(k => { const a = k * 2.1; add(new THREE.CylinderGeometry(0.06, 0.045, 0.08, 12), cream, P.x + Math.cos(a) * 0.35, 1.02, P.z + Math.sin(a) * 0.35); });
    add(new THREE.SphereGeometry(0.13, 12, 8), cream, P.x, 1.08, P.z).scale.y = 1.2; C.circle(P.x, P.z, 0.75);
    // mermer kemer köprü (kuzey kıyısından adaya)
    const z0 = P.z - P.rz - 0.6, z1 = P.z - ISL - 0.6, len = z1 - z0, arch = zz => 0.3 + Math.sin(Math.max(0, Math.min(1, (zz - z0) / len)) * Math.PI) * 0.9;
    for (let i = 0; i <= 14; i++){ const zz = z0 + i / 14 * len; add(new THREE.BoxGeometry(2.4, 0.18, len / 14 + 0.05), marble, P.x, arch(zz) - 0.09, zz); }
    [-1.15, 1.15].forEach(dx => { const pts = []; for (let i = 0; i <= 14; i++){ const zz = z0 + i / 14 * len; pts.push(L(P.x + dx, arch(zz) + 0.75, zz)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.07, 6), marble, 0, 0, 0);
      for (let i = 0; i <= 10; i++){ const zz = z0 + i / 10 * len; add(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 8), marble, P.x + dx, arch(zz) + 0.36, zz); }
      C.box(P.x + dx * 1.07, (z0 + z1) / 2, 0.08, len / 2); });
    C.heightFns.push((x, z) => (Math.abs(x - P.x) < 1.25 && z > z0 && z < z1) ? arch(z) : null);
    platforms.push({x:P.x, z:P.z, r:ISL + 0.6, h:0.3});
    // ikinci köprü: batıdan gelen dere üstünde
    const sx0 = P.x - P.rx - 16, sx1 = P.x - P.rx + 1;
    plane(sx1 - sx0, 2.4, water, (sx0 + sx1) / 2, 0.07, P.z);
    [-1.3, 1.3].forEach(dz => add(new THREE.BoxGeometry(sx1 - sx0, 0.22, 0.25), stone, (sx0 + sx1) / 2, 0.08, P.z + dz));
    {
      const bx = P.x - P.rx - 8, bl = 4.4, ba = xx => 0.25 + Math.sin(Math.max(0, Math.min(1, (xx - (bx - bl / 2)) / bl)) * Math.PI) * 0.7;
      const B = new THREE.Group(); root.add(B);
      for (let i = 0; i <= 8; i++){ const xx = bx - bl / 2 + i / 8 * bl; add(new THREE.BoxGeometry(bl / 8 + 0.05, 0.16, 2.0), marble, xx, ba(xx) - 0.08, P.z, B); }
      [-0.95, 0.95].forEach(dz => { const pts = []; for (let i = 0; i <= 8; i++){ const xx = bx - bl / 2 + i / 8 * bl; pts.push(L(xx, ba(xx) + 0.7, P.z + dz)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.06, 6), marble, 0, 0, 0, B); });
      C.heightFns.push((x, z) => (Math.abs(z - P.z) < 1.0 && Math.abs(x - bx) < bl / 2) ? ba(x) : null);
      C.box((sx0 + bx - bl / 2) / 2, P.z, (bx - bl / 2 - sx0) / 2, 1.2); C.box((bx + bl / 2 + sx1) / 2, P.z, (sx1 - bx - bl / 2) / 2, 1.2);
    }
    // kıyıdaki iki çay köşkü (pavyon)
    [[-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const gx = P.x + sx * (P.rx - 2), gz = P.z + sz * (P.rz + 5);
      gazebo({x:gx, z:gz, r:2.4, n:6, h:2.9, roofMat:tiles, dome:false});
      add(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 18), cream, gx, 0.95, gz); add(new THREE.CylinderGeometry(0.06, 0.15, 0.65, 8), darkWood, gx, 0.62, gz);
      [0, 1, 2, 3].forEach(k => { const a = k * Math.PI / 2 + 0.4; add(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 10), cream, gx + Math.cos(a) * 0.35, 1.01, gz + Math.sin(a) * 0.35); });
      interact.push({x:gx, z:gz, r:3.0, label:'Çay iç', show:() => true, act:async () => {
        await say('', 'Gümüş demlikten yasemin kokulu bir çay doldurdun. Gölde kuğular süzülüyor, tavus kuşları kıyıda tüylerini kabartıyor.');
        hooks.ui.toast('Çayın tadını çıkardın ☕', 2200);
      }});
    });
    // kıyı kenarında yem standı
    const FX = P.x + 6, FZ = P.z - P.rz - 2.4;
    add(new THREE.BoxGeometry(0.9, 0.9, 0.6), darkWood, FX, 0.45, FZ); add(new THREE.CylinderGeometry(0.32, 0.26, 0.3, 12), new THREE.MeshStandardMaterial({color:0xc9a54e, roughness:1}), FX, 1.05, FZ); C.circle(FX, FZ, 0.5);
    interact.push({x:FX, z:FZ, r:2.6, label:'Kuğuları besle', show:() => true, act:() => { feedT = 14; feedAt = {x:FX, z:P.z - P.rz + 2.2}; hooks.sfx('blip'); hooks.ui.toast('Ekmek kırıntılarını suya serptin', 2000); }});
    // kuğular
    const white = new THREE.MeshStandardMaterial({color:0xf7f5ef, roughness:0.5}), black = new THREE.MeshStandardMaterial({color:0x17171b, roughness:0.45}), beak = new THREE.MeshStandardMaterial({color:0xe8702a, roughness:0.5}), beakR = new THREE.MeshStandardMaterial({color:0xc8202f, roughness:0.5});
    for (let i = 0; i < 7; i++){
      const g = new THREE.Group(), bm = i === 6 ? black : white;
      add(new THREE.SphereGeometry(0.42, 16, 12), bm, 0, 0.25, 0, g).scale.set(0.85, 0.6, 1.35);
      const wg = add(new THREE.SphereGeometry(0.36, 12, 10), bm, 0, 0.42, -0.12, g); wg.scale.set(0.95, 0.45, 1.25);
      const neck = new THREE.CatmullRomCurve3([L(0, 0.35, 0.38), L(0, 0.75, 0.48), L(0, 1.05, 0.32), L(0, 1.18, 0.42)]);
      add(new THREE.TubeGeometry(neck, 12, 0.07, 8), bm, 0, 0, 0, g);
      add(new THREE.SphereGeometry(0.1, 10, 8), bm, 0, 1.2, 0.46, g);
      const bk = add(new THREE.ConeGeometry(0.045, 0.2, 8), i === 6 ? beakR : beak, 0, 1.17, 0.62, g); bk.rotation.x = Math.PI / 2 + 0.3;
      add(new THREE.ConeGeometry(0.16, 0.3, 8), bm, 0, 0.4, -0.62, g).rotation.x = -2.1;
      g.scale.setScalar(1.05); g.userData.dyn = true; root.add(g);
      const a = i / 7 * Math.PI * 2, rx = 12 + (i % 3) * 1.6, rz = 7.2 + (i % 3) * 1.1;
      swans.push({g, a, rx, rz, w:0.045 + rnd() * 0.02, bob:rnd() * 6, x:P.x + Math.cos(a) * rx, z:P.z + Math.sin(a) * rz});
    }
    // tavus kuşları
    const feather = (() => {
      const [c, g] = canvas(64, 256); g.clearRect(0, 0, 64, 256);
      const gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, '#2a5a2a'); gr.addColorStop(1, '#3c8a3a'); g.fillStyle = gr;
      g.beginPath(); g.moveTo(32, 256); g.quadraticCurveTo(-4, 120, 32, 4); g.quadraticCurveTo(68, 120, 32, 256); g.fill();
      [['#c9a24a', 22], ['#1f8a7a', 16], ['#1a3aa8', 10], ['#0a0a2a', 5]].forEach(([cc, r]) => { g.fillStyle = cc; g.beginPath(); g.ellipse(32, 46, r, r * 1.25, 0, 0, Math.PI * 2); g.fill(); });
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return new THREE.MeshStandardMaterial({map:t, alphaTest:0.4, side:THREE.DoubleSide, roughness:0.5, metalness:0.2});
    })();
    const fg = new THREE.PlaneGeometry(0.34, 1.5); fg.translate(0, 0.75, 0);
    const blue = new THREE.MeshStandardMaterial({color:0x1d4fb8, roughness:0.35, metalness:0.3}), bronze = new THREE.MeshStandardMaterial({color:0x4a5a2a, roughness:0.5, metalness:0.3}), legM = new THREE.MeshStandardMaterial({color:0x8a8070, roughness:0.8});
    for (let i = 0; i < 5; i++){
      const g = new THREE.Group();
      add(new THREE.SphereGeometry(0.26, 14, 10), blue, 0, 0.62, 0, g).scale.set(0.8, 0.85, 1.25);
      add(new THREE.SphereGeometry(0.24, 12, 10), bronze, 0, 0.64, -0.18, g).scale.set(0.85, 0.7, 1.1);
      const nk = add(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 10), blue, 0, 0.95, 0.2, g); nk.rotation.x = 0.35;
      add(new THREE.SphereGeometry(0.08, 10, 8), blue, 0, 1.22, 0.3, g);
      const bk = add(new THREE.ConeGeometry(0.025, 0.1, 6), legM, 0, 1.2, 0.41, g); bk.rotation.x = Math.PI / 2;
      for (let k = -2; k <= 2; k++){ const cr = add(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 4), blue, k * 0.015, 1.34, 0.28, g); cr.rotation.z = k * 0.2; add(new THREE.SphereGeometry(0.018, 6, 4), blue, k * 0.03, 1.41, 0.28, g); }
      [-1, 1].forEach(sd => add(new THREE.CylinderGeometry(0.018, 0.015, 0.45, 6), legM, sd * 0.08, 0.24, 0, g));
      const fan = new THREE.Group(); fan.position.set(0, 0.68, -0.28); fan.userData.anim = true; g.add(fan);
      const fs = []; for (let k = 0; k < 21; k++){ const f = add(fg, feather, 0, 0, 0, fan, false); fs.push(f); }
      const a = rnd() * 6.28, rr = 4 + rnd() * 6;
      g.position.set(P.x + Math.cos(a) * (P.rx + rr), 0, P.z + Math.sin(a) * (P.rz + rr)); g.userData.dyn = true; root.add(g);
      peacocks.push({g, fan, fs, ang:a, rr, target:null, wait:rnd() * 3, show:0, nextShow:4 + rnd() * 10, phase:0, spread:0});
    }
    signPost('Étang des Cygnes', P.x + 25, P.z - P.rz - 4.5, 0);
    plane(3.6, 22, gravel, P.x + 22, 0.08, P.z - P.rz - 14);
  }

  /* =====================================================================
     3. BİNİCİLİK MANEJİ VE ENGEL PARKURU
     ===================================================================== */
  let rider = null;
  {
    const A = ARENA, hw = A.w / 2, hd = A.d / 2;
    plane(A.w + 2, A.d + 2, sand, A.x, 0.03, A.z);
    // beyaz çit (doğu kapısı açık)
    const rails = [];
    for (let x = -hw; x < hw; x += 2.5){ rails.push([A.x + x + 1.25, A.z - hd, 2.5, 0]); rails.push([A.x + x + 1.25, A.z + hd, 2.5, 0]); }
    for (let z = -hd; z < hd; z += 2.75){ if (Math.abs(z + 1.375) > 2.5) rails.push([A.x + hw, A.z + z + 1.375, 2.75, Math.PI / 2]); rails.push([A.x - hw, A.z + z + 1.375, 2.75, Math.PI / 2]); }
    const white = new THREE.MeshStandardMaterial({color:0xf3efe6, roughness:0.6});
    const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.1, 0.08), white, rails.length * 2), pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), white, rails.length);
    rails.forEach(([x, z, l, a], i) => { [0.55, 1.1].forEach((y, k) => { m4.compose(L(x, y, z), q4.setFromAxisAngle(L(0, 1, 0), a), s4.set(l, 1, 1)); rm.setMatrixAt(i * 2 + k, m4); }); m4.makeTranslation(x - Math.cos(a) * l / 2, 0.65, z + Math.sin(a) * l / 2); pm.setMatrixAt(i, m4); C.box(x, z, a ? 0.08 : l / 2, a ? l / 2 : 0.08); });
    root.add(rm, pm);
    // engeller: dikey, okser, üçlü ve su engeli
    const [pc, pg] = canvas(64, 8); for (let i = 0; i < 8; i++){ pg.fillStyle = i % 2 ? '#ffffff' : '#c8202f'; pg.fillRect(i * 8, 0, 8, 8); }
    const poleMat = new THREE.MeshStandardMaterial({map:ctex(pc), roughness:0.6}), wingMat = new THREE.MeshStandardMaterial({color:0x1d4a8a, roughness:0.6});
    const JUMPS = [[-12, -5, 0, 1], [0, -6, 0, 2], [12, -5, 0, 1], [12, 5, Math.PI, 3], [0, 6, Math.PI, 1], [-12, 5, Math.PI, 2]];
    JUMPS.forEach(([dx, dz, ry, kind]) => {
      const J = new THREE.Group(); J.position.set(A.x + dx, 0, A.z + dz); J.rotation.y = ry + Math.PI / 2; root.add(J);
      [-1.8, 1.8].forEach(x => { add(new THREE.BoxGeometry(0.25, 1.7, 0.35), wingMat, x, 0.85, 0, J); add(new THREE.ConeGeometry(0.2, 0.3, 4), gold, x, 1.85, 0, J); });
      const rows = kind === 2 ? [-0.5, 0.5] : [0];
      rows.forEach(zz => { [0.5, 0.9, 1.25].forEach((y, k) => { if (kind === 3 && k > 0) return; const p = add(new THREE.CylinderGeometry(0.05, 0.05, 3.4, 8), poleMat, 0, y, zz, J); p.rotation.z = Math.PI / 2; }); });
      if (kind === 3){ const w = plane(3.2, 2.2, water, 0, 0.06, 1.4, 0, J); }
      if (kind === 1) for (let k = 0; k < 6; k++) blooms.push([A.x + dx + (k - 2.5) * 0.6, 0.25, A.z + dz + 0.4, ['#ff3b5c', '#ffd23f', '#ffffff'][k % 3], 1.6]);
    });
    // tribün: basamaklı oturma, çizgili tente, bayraklar
    const T = new THREE.Group(); T.position.set(A.x, 0, A.z + hd + 4.5); root.add(T);
    for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(18, 0.45, 1.1), k % 2 ? cream : wood, 0, 0.22 + k * 0.45, -1.6 + k * 1.05, T);
    add(new THREE.BoxGeometry(18, 2.0, 0.3), cream, 0, 1.0, 2.6, T);
    [-8.8, -2.9, 2.9, 8.8].forEach(x => add(new THREE.CylinderGeometry(0.14, 0.16, 4.8, 12), marble, x, 2.4, 2.5, T));
    [-8.8, -2.9, 2.9, 8.8].forEach(x => add(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 12), marble, x, 1.8, -2.4, T));
    const [sc, sg] = canvas(256, 64); for (let i = 0; i < 16; i++){ sg.fillStyle = i % 2 ? '#f4ead6' : '#1d3a8a'; sg.fillRect(i * 16, 0, 16, 64); }
    const canopy = add(new THREE.PlaneGeometry(19, 6), new THREE.MeshStandardMaterial({map:ctex(sc, 2, 1), side:THREE.DoubleSide, roughness:0.8}), 0, 4.3, 0.05, T); canopy.rotation.x = -Math.PI / 2 - 0.22;
    for (let i = 0; i < 12; i++){ const v = add(new THREE.ConeGeometry(0.4, 0.6, 3), mat(i % 2 ? 0xf4ead6 : 0x1d3a8a, {side:THREE.DoubleSide}), -8.7 + i * 1.58, 3.38 - 0.05, -2.95, T); v.rotation.x = Math.PI; }
    C.box(A.x, A.z + hd + 4.5, 9.2, 3);
    signPost('Manège Royal', A.x + hw + 4, A.z - 3, -Math.PI / 2);
    plane(28, 3.6, gravel, A.x + hw + 14, 0.08, A.z);
    plane(3.6, 18, gravel, A.x + hw + 2, 0.08, A.z + hd + 9);
    // parkuru dönen binici
    const h = world.makeHorse(0x3a2416, 0x0e0a08), rd = world.makeGuard(), ru = rd.userData;
    ru.armR.remove(ru.armR.children[ru.armR.children.length - 1]);
    const jc = new THREE.MeshStandardMaterial({color:0x1d3a8a, roughness:0.6});
    rd.traverse(o => { if (o.material === M.coatMat) o.material = jc; });
    rd.position.set(0, 0.92, -0.08); ru.legL.rotation.set(-0.5, 0, -0.55); ru.legR.rotation.set(-0.5, 0, 0.55); ru.armL.rotation.x = -0.6; ru.armR.rotation.x = -0.6;
    add(new THREE.BoxGeometry(0.62, 0.1, 0.7), navy, 0, 1.88, -0.05, h); h.add(rd);
    const path = [[-15, -5], [-6, -6.5], [6, -6.5], [15, -5], [17.5, 0], [15, 5], [6, 6.5], [-6, 6.5], [-15, 5], [-17.5, 0]].map(([x, z]) => [A.x + x, A.z + z]);
    h.position.set(path[0][0], 0, path[0][1]); scene.add(h);
    rider = {obj:h, path, i:1, dir:1, loop:true, speed:6.5, phase:0, mounted:true, rider:rd, jumps:JUMPS.map(([dx, dz]) => [A.x + dx, A.z + dz])};
    world.horses.push(rider);
    interact.push({x:A.x + 10.6, z:A.z + hd + 3.5, r:3.0, label:'Gösteriyi izle', show:() => true, act:() => say('Seyis Henri', 'Bu sabah Comte de Brissac\'ın aygırı "Tonnerre" parkuru hatasız geçti! Dikeyler, okser, sonra su engeli… Atına binip pistte sen de dene: Shift ile dörtnala, Boşluk ile atla.')});
  }

  /* =====================================================================
     4. SATRANÇ KÖŞKÜ
     ===================================================================== */
  {
    const P = CHESS;
    plane(26, 30, grassMat, P.x, 0.008, P.z + 4);
    const K = gazebo({x:P.x, z:P.z, r:3.4, n:8, h:3.4, roofMat:copper});
    // köşk içinde mermer masa ve fildişi-abanoz takım
    add(new THREE.BoxGeometry(1.4, 0.08, 1.4), marble, P.x, 1.0, P.z); add(new THREE.CylinderGeometry(0.15, 0.3, 0.7, 10), marble, P.x, 0.65, P.z); C.circle(P.x, P.z, 0.8);
    const [bc, bg] = canvas(256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++){ bg.fillStyle = (x + y) % 2 ? '#2a1a12' : '#efe6d2'; bg.fillRect(x * 32, y * 32, 32, 32); }
    const boardMat = new THREE.MeshStandardMaterial({map:ctex(bc), roughness:0.3});
    plane(1.1, 1.1, boardMat, P.x, 1.045, P.z);
    const ivory = new THREE.MeshStandardMaterial({color:0xf3ead2, roughness:0.3}), ebony = new THREE.MeshStandardMaterial({color:0x1a1412, roughness:0.25});
    const pieceGeo = k => new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.42, 0.1], [0.25, 0.2], [0.18, 0.6 + k * 0.12], [0.28, 0.7 + k * 0.12], [0.2 + (k === 4 ? 0.08 : 0), 0.85 + k * 0.15], [0, 1.0 + k * 0.18]].map(([a, b]) => new THREE.Vector2(a, b)), 14);
    const PG = [0, 1, 2, 3, 4, 5].map(pieceGeo), BACK = [3, 1, 2, 4, 5, 2, 1, 3];
    for (let side = 0; side < 2; side++) for (let i = 0; i < 8; i++){
      [0, 1].forEach(r => { const k = r ? 0 : BACK[i], x = P.x - 0.48 + i * 0.1375, z = P.z + (side ? 1 : -1) * (0.48 - r * 0.1375); add(PG[k], side ? ebony : ivory, x, 1.05, z, root, false).scale.setScalar(0.09); });
    }
    [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.6, 0.08, 0.6), red, P.x, 0.6, P.z + sd * 1.25); add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8), gold, P.x, 0.3, P.z + sd * 1.25); });
    // çimde dev satranç tahtası
    const BX = P.x, BZ = P.z + 10.5, SQ = 1.3;
    const [gc, gg] = canvas(256, 256); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++){ gg.fillStyle = (x + y) % 2 ? '#5a6a4a' : '#e9e2d0'; gg.fillRect(x * 32, y * 32, 32, 32); }
    plane(SQ * 8, SQ * 8, new THREE.MeshStandardMaterial({map:ctex(gc), roughness:0.7}), BX, 0.05, BZ);
    [[0, 0, 3, 0], [3, 0, 5, 0], [4, 0, 4, 0], [3, 1, 0, 0], [5, 2, 2, 0], [2, 3, 1, 0], [4, 7, 5, 1], [3, 7, 4, 1], [6, 5, 0, 1], [1, 6, 0, 1], [6, 7, 3, 1], [2, 5, 1, 1]].forEach(([fx, fz, k, side]) => {
      const x = BX - SQ * 3.5 + fx * SQ, z = BZ - SQ * 3.5 + fz * SQ;
      add(PG[k], side ? ebony : marble, x, 0.05, z).scale.setScalar(0.85); C.circle(x, z, 0.4);
    });
    const knotDuchess = lady(0x6a2a4a, 0xd8d0c0);
    placeNPC(knotDuchess, P.x + 2.2, P.z - 1.4, -0.8, 'Düşes Mathilde', async () => {
      const st = S().notes;
      if (st.chess){ await say('Düşes Mathilde', 'Matı bulan zihne her zaman yer var bu köşkte. Yarın akşam yeniden oynayalım mı?'); return; }
      const c = await hooks.ui.dialog([
        {name:'Düşes Mathilde', text:'Bu köşkte yalnız sessizlik ve satranç vardır. Bir problemim var: beyaz oynar ve tek hamlede mat eder.'},
        {name:'Düşes Mathilde', text:'Siyah şah g8\'de; önünde f7, g7, h7 piyonları. Beyaz kale a1\'de, beyaz şah g1\'de. Hangi hamle?', choices:['Ka8 (kale a8)', 'Kxh7', 'Şf2']},
      ]);
      if (c === 0){ st.chess = true; hooks.sfx('rune'); await say('Düşes Mathilde', 'Kale a8, mat! Arka sıra matı; piyonlar kendi şahlarını hapsetti. Aferin.'); hooks.ui.toast('Satranç problemi çözüldü ♞', 2600); hooks.save(); }
      else { hooks.sfx('wrong'); await say('Düşes Mathilde', 'Hımm, öyle değil. Şahın kaçacak karesi kalmamalı. Bir daha düşün.'); }
    });
    signPost('Pavillon des Échecs', P.x - 6, P.z - 6, 0);
  }

  /* =====================================================================
     5. BALO SALONU VE KIŞ BAHÇESİ (Orangerie)
     ===================================================================== */
  const couples = [];
  let waltzT = 0;
  {
    const B = BALL, W = 36, D = 20, H = 8.5;
    const G = new THREE.Group(); G.position.set(B.x, 0, B.z); root.add(G);
    plane(W + 2, D + 2, floorMat, B.x, 0.09, B.z);
    // taş kaide şeridi, cam duvarlar ve demir kaburgalar (güney ve kuzey ortasında kapı)
    const ribs = [];
    [[0, D / 2, W, 0], [0, -D / 2, W, 0], [W / 2, 0, D, 1], [-W / 2, 0, D, 1]].forEach(([cx, cz, len, vert]) => {
      const n = Math.round(len / 3);
      for (let i = 0; i < n; i++){
        const u = -len / 2 + (i + 0.5) * len / n, isDoor = !vert && Math.abs(u) < 2;
        const x = vert ? cx : u, z = vert ? u : cz, segL = len / n;
        if (!isDoor){
          add(new THREE.BoxGeometry(vert ? 0.4 : segL, 0.8, vert ? segL : 0.4), stone, x, 0.4, z, G);
          const gp = add(new THREE.PlaneGeometry(segL, H - 0.8), glass, x, 0.8 + (H - 0.8) / 2, z, G, false); gp.rotation.y = vert ? Math.PI / 2 : 0; gp.renderOrder = 2;
          C.box(B.x + x, B.z + z, vert ? 0.25 : segL / 2, vert ? segL / 2 : 0.25);
        } else {
          const dg = add(new THREE.PlaneGeometry(segL, H - 4.0), glass, x, 4.0 + (H - 4.0) / 2, z, G, false); dg.renderOrder = 2;
          const fr = add(new THREE.TorusGeometry(1.5, 0.12, 8, 24, Math.PI), gold, x, 3.0, z, G); fr.scale.y = 0.6;
        }
        ribs.push([vert ? cx : -len / 2 + i * len / n, vert ? -len / 2 + i * len / n : cz]);
      }
    });
    const ribM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, H, 0.16), cream, ribs.length);
    ribs.forEach(([x, z], i) => { m4.makeTranslation(x, H / 2, z); ribM.setMatrixAt(i, m4); }); G.add(ribM);
    add(new THREE.BoxGeometry(W + 0.6, 0.5, D + 0.6), cream, 0, H + 0.25, 0, G);
    // cam beşik tonoz çatı
    const vault = add(new THREE.CylinderGeometry(D / 2, D / 2, W, 40, 1, true, 0, Math.PI), glass, 0, H + 0.5, 0, G, false); vault.rotation.z = Math.PI / 2; vault.scale.set(0.45, 1, 1); vault.renderOrder = 2;
    for (let i = 0; i <= 12; i++){ const r = add(new THREE.TorusGeometry(D / 2, 0.08, 6, 32, Math.PI), cream, -W / 2 + i * W / 12, H + 0.5, 0, G); r.rotation.y = Math.PI / 2; r.scale.y = 0.45; }
    [-1, 1].forEach(s => { const e = add(new THREE.CircleGeometry(D / 2, 32, 0, Math.PI), glass, s * W / 2, H + 0.5, 0, G, false); e.rotation.y = Math.PI / 2; e.scale.y = 0.45; e.renderOrder = 2; });
    add(new THREE.BoxGeometry(W, 0.2, 0.2), gold, 0, H + 0.5 + D / 2 * 0.45, 0, G);
    // iç mekân: sütun sıraları, avizeler, narenciye ağaçları
    for (let i = 0; i < 6; i++){ const x = -W / 2 + 4 + i * (W - 8) / 5; [-1, 1].forEach(sd => { column(x, sd * 6, H, 0.32, G); C.circle(B.x + x, B.z + sd * 6, 0.4); citrus(x, sd * 8.2, 0.9, i % 2 ? 0xffd23a : 0xff8a1a, G); C.circle(B.x + x, B.z + sd * 8.2, 0.55); }); }
    const crystal = new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.2, roughness:0.02, transparent:true, opacity:0.75, emissive:0xfff0d0, emissiveIntensity:0.3});
    const chand = [];
    [-11, 0, 11].forEach(x => {
      const ch = new THREE.Group(); ch.position.set(x, H - 1.2, 0); G.add(ch);
      add(new THREE.CylinderGeometry(0.02, 0.02, 6, 6), gold, 0, 3, 0, ch);
      [1.3, 0.85, 0.45].forEach((r, k) => {
        add(new THREE.TorusGeometry(r, 0.04, 6, 32), gold, 0, -k * 0.45, 0, ch).rotation.x = Math.PI / 2;
        const n = 10 - k * 2; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; add(new THREE.SphereGeometry(0.07, 8, 6), lampMat, Math.cos(a) * r, -k * 0.45 + 0.12, Math.sin(a) * r, ch, false); const dr = add(new THREE.OctahedronGeometry(0.06, 0), crystal, Math.cos(a + 0.3) * r, -k * 0.45 - 0.18, Math.sin(a + 0.3) * r, ch, false); dr.scale.y = 2.2; }
      });
      add(new THREE.OctahedronGeometry(0.22, 0), crystal, 0, -1.4, 0, ch, false).scale.y = 1.8;
      if (x === 0){ const pl = new THREE.PointLight(0xffd8a0, 0, 26, 2); pl.position.set(0, -0.5, 0); ch.add(pl); chand.push({ch, pl}); }
    });
    // orkestra kürsüsü ve harp
    add(new THREE.BoxGeometry(5, 0.4, 3), darkWood, W / 2 - 3.5, 0.26, 0, G);
    const harp = add(new THREE.TorusGeometry(0.7, 0.05, 6, 24, Math.PI * 1.2), gold, W / 2 - 3.5, 1.4, 0.6, G); harp.rotation.z = 1.2;
    C.box(B.x + W / 2 - 3.5, B.z, 2.5, 1.5);
    // dans eden çiftler
    const gowns = [0xd8b4e2, 0x9db0e2, 0xf2c6b4, 0xe8e2a8];
    for (let i = 0; i < 4; i++){
      const c = new THREE.Group(); c.userData.dyn = true; G.add(c);
      const l = lady(gowns[i]); l.position.set(0.32, 0, 0); l.rotation.y = -Math.PI / 2; c.add(l);
      const m = npc({coat:[0x1d2a5a, 0x5a1a2a, 0x2a4a2a, 0x3a2a1a][i]}); m.position.set(-0.32, 0, 0); m.rotation.y = Math.PI / 2; m.userData.armL.rotation.x = -1.2; m.userData.armR.rotation.z = 0.9; c.add(m);
      const a = i / 4 * Math.PI * 2; c.position.set(Math.cos(a) * 5, 0, Math.sin(a) * 2.6);
      couples.push({c, a, base:[Math.cos(a) * 5, Math.sin(a) * 2.6]});
    }
    C.dynamics.push(() => couples.map(({c}) => ({x:B.x + c.position.x, z:B.z + c.position.z, r:0.7})));
    signPost('Salle de Bal · Orangerie', B.x + 5, B.z + D / 2 + 4, 0);
    interact.push({x:B.x + W / 2 - 5.5, z:B.z, r:3.0, label:'Orkestraya vals çaldır', show:() => true, act:() => { waltzT = 22; playWaltz(); hooks.ui.toast('♪ Vals: Lumière\'in Işıkları', 2400); }});
    updaters.push((dt, t) => {
      const n = world.W.night;
      chand.forEach(({pl}) => { pl.intensity = 4 + n * 30; });
      crystal.emissiveIntensity = 0.2 + n * 0.8;
      waltzT = Math.max(0, waltzT - dt);
      couples.forEach((o, i) => {
        if (waltzT > 0){ o.a += dt * 0.35; const spin = t * 2.4 + i; o.c.position.set(Math.cos(o.a) * 5.5, Math.abs(Math.sin(t * 4.2 + i)) * 0.04, Math.sin(o.a) * 2.8); o.c.rotation.y = spin; }
        else { o.c.position.x += (o.base[0] - o.c.position.x) * Math.min(1, dt); o.c.position.z += (o.base[1] - o.c.position.z) * Math.min(1, dt); }
      });
    });
  }
  function playWaltz(){
    const A = hooks.audio; if (!A || !A.ctx) return;
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12), t0 = A.ctx.currentTime + 0.05, b = 0.42;
    const mel = [76, 0, 0, 79, 0, 76, 74, 0, 0, 72, 0, 0, 71, 0, 72, 74, 0, 76, 74, 0, 0, 67, 0, 0, 72, 0, 0, 76, 0, 72, 69, 0, 0, 72, 0, 76, 79, 0, 81, 79, 0, 76, 74, 0, 0, 72, 0, 0];
    const bass = [48, 43, 48, 43, 41, 43, 48, 48, 45, 41, 43, 48, 48, 43, 41, 43];
    mel.forEach((n, i) => { if (n) A.pluck(mtof(n), t0 + i * b, 0.11, 1.1); });
    bass.forEach((n, k) => { A.pluck(mtof(n), t0 + k * 3 * b, 0.1, 1.4); [1, 2].forEach(j => A.pluck(mtof(n + 16), t0 + (k * 3 + j) * b, 0.04, 0.4)); });
  }

  /* =====================================================================
     6. SARAY OPERASI VE ÖZEL SANAT GALERİSİ
     ===================================================================== */
  {
    const P = OPERA;
    const {G, front} = hall({x:P.x, z:P.z, w:24, d:32, h:13, rot:0, wall:cream, roof:'flat', winRows:2, doorW:2.6});
    // portik: altı Korint sütunu ve alınlık
    for (let i = 0; i < 6; i++) column(-8 + i * 3.2, 19.2, 11, 0.45, G, marble);
    add(new THREE.BoxGeometry(18, 0.8, 4.2), cream, 0, 11.3, 18, G);
    const ped = add(gableGeo(18.6, 4.4, 3.2), cream, 0, 11.7, 18, G);
    add(new THREE.BoxGeometry(18, 0.4, 4.6), stone, 0, 0.2, 18.3, G);
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(14 - i * 0.8, 0.22, 0.6), stone, 0, 0.11, 20.6 + i * 0.55 - 0.2, G).position.y = 0.4 - i * 0.12;
    C.box(P.x, P.z + 18, 9, 2.4);
    // çatı: kubbe ve heykeller
    const dm = add(new THREE.SphereGeometry(7, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), copper, 0, 13.8, -4, G); dm.scale.y = 0.75;
    add(new THREE.CylinderGeometry(7.2, 7.2, 1.0, 32), cream, 0, 13.3, -4, G);
    add(new THREE.SphereGeometry(0.6, 16, 10), gold, 0, 19.3, -4, G); add(new THREE.ConeGeometry(0.15, 1.4, 8), gold, 0, 20.4, -4, G);
    [-10, -6, 6, 10].forEach((x, k) => { const s = add(statueGeos[k % 4], marble, x, 13.6, 15.8, G); s.scale.setScalar(0.8); });
    // lir amblemi ve afiş
    const lyre = add(new THREE.TorusGeometry(1.0, 0.14, 8, 24, Math.PI * 1.4), gold, 0, 12.7, 20.25, G); lyre.rotation.z = -Math.PI * 0.2;
    signBoard('Opéra Royal de Lumière', 0, 10.2, 16.3, 0, 7.5, G);
    const [pc, pg] = canvas(256, 384); pg.fillStyle = '#5a1020'; pg.fillRect(0, 0, 256, 384); pg.strokeStyle = '#d4af37'; pg.lineWidth = 8; pg.strokeRect(10, 10, 236, 364); pg.fillStyle = '#f6ecd0'; pg.textAlign = 'center';
    pg.font = '30px Georgia, serif'; pg.fillText('Ce soir', 128, 70); pg.font = 'bold 40px Georgia, serif'; pg.fillText('Orphée', 128, 150); pg.font = '28px Georgia, serif'; pg.fillText('aux Enfers', 128, 190); pg.font = '22px Georgia, serif'; pg.fillText('tragédie lyrique', 128, 260); pg.fillText('· 1724 ·', 128, 320);
    [-1, 1].forEach(sd => add(new THREE.BoxGeometry(1.6, 2.4, 0.06), new THREE.MeshStandardMaterial({map:ctex(pc), roughness:0.7}), sd * 4.5, 2.4, 16.06, G));
    const maestro = npc({coat:0x2a1a3a});
    const [mx, mz] = toWorld(G, 4, 22.5);
    placeNPC(maestro, mx, mz, 0, 'Maestro Valentin', async () => {
      const c = await hooks.ui.dialog([{name:'Maestro Valentin', text:'Hoş geldiniz! Bu akşam "Orphée" sahnede. İçeride kontesin galerisi de açık. Ne arzu edersiniz?', choices:['Bir arya dinlemek', 'Galeriyi gezmek', 'Sonra gelirim']}]);
      if (c === 0){ playAria(); hooks.ui.toast('♪ Arya: "Ô nuit, rends-moi le jour"', 3000); await say('Maestro Valentin', 'Orphée\'nin yakarışı… Soprano Mlle Fleury\'nin sesi salonu titretir. Gözlerinizi kapatın.'); }
      else if (c === 1){
        await hooks.ui.dialog([
          {name:'Galeri', text:'Birinci salon: Kontes Éléonore\'un portresi. Mavi ipek elbisesi ve elindeki altın pusula, şatonun haritacılığa olan merakını anlatıyor.'},
          {name:'Galeri', text:'İkinci salon: Venedik\'ten getirilmiş Murano camı bir avize ve Çin porseleni vazolar. Vazolardan birinde bir ejderha kıvrılıyor; Pyra\'ya ne kadar benziyor!'},
          {name:'Galeri', text:'Son salon: "Kılıcın Uyanışı" adlı büyük bir tuval. Tapınağın kubbesinden yükselen beş renkli ışık… Ressam bunu bir rüyada gördüğünü yazmış.'},
        ]);
      }
    });
    doors.opera = {x:front[0], z:front[1] + 4.6, ry:0};
  }
  function playAria(){
    const A = hooks.audio; if (!A || !A.ctx) return;
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12), t0 = A.ctx.currentTime + 0.05, b = 0.5;
    const mel = [[69, 2], [72, 1], [71, 1], [69, 2], [64, 2], [65, 1.5], [67, 0.5], [69, 1], [71, 1], [72, 3], [0, 1], [74, 1.5], [72, 0.5], [71, 1], [69, 1], [68, 2], [69, 1], [71, 1], [64, 4]];
    let t = 0;
    mel.forEach(([n, d]) => { if (n){ A.tone(mtof(n), d * b * 1.1, 'sine', 0.06, t0 - A.ctx.currentTime + t, A.musicBus); A.tone(mtof(n) * 2.01, d * b, 'sine', 0.012, t0 - A.ctx.currentTime + t, A.musicBus); } t += d * b; });
    [[45, 57, 60, 64], [41, 57, 60, 65], [40, 56, 59, 64], [45, 57, 60, 64], [38, 57, 62, 65], [40, 56, 59, 64]].forEach((ch, k) => ch.forEach((n, j) => A.pluck(mtof(n), t0 + k * 4 * b + j * 0.12, j ? 0.05 : 0.09, 2.0)));
  }

  /* =====================================================================
     7. SARAY KÜTÜPHANESİ VE ARŞİV
     ===================================================================== */
  {
    const P = LIB;
    const {G, front} = hall({x:P.x, z:P.z, w:24, d:28, h:11, rot:0, wall:plaster, roof:'mansard', roofH:4.2, winRows:2, doorW:2.4});
    doors.kutuphane = {x:front[0] - 1, z:front[1] - 0.2, ry:0};
    for (let i = 0; i < 5; i++){ const dx = -8 + i * 4; const dmr = add(new THREE.BoxGeometry(1.4, 1.6, 1.2), slate, dx, 12.4, 12.4, G); add(new THREE.PlaneGeometry(0.8, 1.0), winMat, dx, 12.4, 13.02, G, false); }
    // saat kulesi
    add(new THREE.BoxGeometry(4, 4, 4), cream, 0, 17.4, 0, G); add(new THREE.ConeGeometry(3.2, 4, 4), slate, 0, 21.4, 0, G).rotation.y = Math.PI / 4;
    const [cc, cg] = canvas(128, 128); cg.fillStyle = '#f4ead6'; cg.beginPath(); cg.arc(64, 64, 60, 0, 7); cg.fill(); cg.strokeStyle = '#2a1a12'; cg.lineWidth = 4; cg.stroke();
    for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; cg.fillStyle = '#2a1a12'; cg.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
    const clockFace = add(new THREE.CircleGeometry(1.5, 32), new THREE.MeshStandardMaterial({map:ctex(cc), roughness:0.5}), 0, 17.4, 2.03, G, false);
    const hands = new THREE.Group(); hands.position.set(0, 17.4, 2.08); hands.userData.dyn = true; G.add(hands);
    const hH = new THREE.Group(), hM = new THREE.Group(); hH.userData.anim = hM.userData.anim = true; hands.add(hH, hM);
    add(new THREE.BoxGeometry(0.1, 0.8, 0.03), darkWood, 0, 0.35, 0, hH, false); add(new THREE.BoxGeometry(0.07, 1.2, 0.03), darkWood, 0, 0.55, 0.02, hM, false);
    updaters.push(() => { const tt = Date.now() / 1000; hM.rotation.z = -tt / 3600 * Math.PI * 2; hH.rotation.z = -tt / 43200 * Math.PI * 2; });
    signBoard('Bibliothèque & Archives', 0, 8.6, 14.06, 0, 6, G);
    // dış merdivende kitap arabası
    const cart = new THREE.Group(); const [cx, cz] = toWorld(G, 5, 17); cart.position.set(cx, 0, cz); root.add(cart);
    add(new THREE.BoxGeometry(1.4, 0.8, 0.7), darkWood, 0, 0.7, 0, cart);
    for (let i = 0; i < 9; i++) add(new THREE.BoxGeometry(0.12, 0.38 + rnd() * 0.12, 0.5), mat([0x7a1a1a, 0x1a3a6a, 0x2a5a2a, 0x6a4a1a][i % 4]), -0.55 + i * 0.135, 1.3, 0, cart);
    C.circle(cx, cz, 0.8);
    const arch = npc({coat:0x3a2a1a, hat:'none'});
    const [ax, az] = toWorld(G, -4, 16.8);
    placeNPC(arch, ax, az, 0, 'Arşivci Anselme', async () => {
      const c = await hooks.ui.dialog([{name:'Arşivci Anselme', text:'Sessiz olun lütfen… Tavana kadar uzanan raflarda dört bin cilt ve iki yüz yıllık el yazmaları var. Ne arıyorsunuz?', choices:['Nadir el yazmaları', 'Rünler hakkında', 'Şatonun tarihi']}]);
      if (c === 0) await say('Arşivci Anselme', 'Altın varaklı bir "Saatler Kitabı", Endülüs\'ten gelmiş bir yıldız atlası ve Kontes Éléonore\'un bahçe defteri. Defterde her gül türünün yanına küçük bir şiir yazmış.');
      else if (c === 1){
        const st = S(), miss = ['yakut', 'safir', 'zumrut', 'altin', 'ametist'].filter(id => st.runes && !st.runes[id]);
        const H = {yakut:'Fıskiyenin dibindeki kırmızı ışığı ancak su durulunca görürsün.', safir:'Mavi taş doğu kulesinin balkonunda, rüzgâra bakar.', zumrut:'Yeşil taş çit labirentinin tam kalbinde.', altin:'Altın taşı merdivendeki yüzbaşı bilmecelerle korur.', ametist:'Mor taş Ay Kapısı\'nın ardında; kapı yalnız gece açılır.'};
        await say('Arşivci Anselme', miss.length ? 'Eski kronik şöyle der: "' + H[miss[0]] + '"' : 'Beş rünün hepsini bulmuşsunuz! Kronikler sizden söz edecek.');
      } else await say('Arşivci Anselme', 'Lumière 1580\'de bir av köşkü olarak kuruldu. Büyük Kontes onu bir saraya çevirdi: bahçeler, opera, rasathane… Hepsi bu arşivdeki planlarla başladı.');
    });
  }

  /* =====================================================================
     8. ASTRONOMİ GÖZLEMEVİ (Rasathane)
     ===================================================================== */
  let obsDome = null, orrery = [];
  {
    const P = OBS, R = 4.2, H = 22;
    const G = new THREE.Group(); G.position.set(P.x, 0, P.z); root.add(G);
    add(new THREE.CylinderGeometry(R + 0.8, R + 1.0, 1.0, 32), stone, 0, 0.5, 0, G);
    add(new THREE.CylinderGeometry(R, R + 0.3, H, 32), stone, 0, H / 2, 0, G);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2 + k * 0.5, y = 4 + k * 4.5, wr = R + 0.3 * (1 - y / H) + 0.08; const w = add(new THREE.PlaneGeometry(0.7, 1.6), winMat, Math.sin(a) * wr, y, Math.cos(a) * wr, G, false); w.rotation.y = a; }
    [6.5, 11, 15.5].forEach(y => add(new THREE.TorusGeometry(R + 0.15, 0.12, 6, 40), cream, 0, y, 0, G).rotation.x = Math.PI / 2);
    // balkon ve korkuluk
    add(new THREE.CylinderGeometry(R + 1.6, R + 1.2, 0.5, 32), cream, 0, H + 0.25, 0, G);
    for (let i = 0; i < 40; i++){ const a = i / 40 * Math.PI * 2; add(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 6), cream, Math.cos(a) * (R + 1.45), H + 0.95, Math.sin(a) * (R + 1.45), G, false); }
    add(new THREE.TorusGeometry(R + 1.45, 0.07, 6, 48), cream, 0, H + 1.4, 0, G).rotation.x = Math.PI / 2;
    // dönen bakır kubbe, yarık ve pirinç teleskop
    obsDome = new THREE.Group(); obsDome.position.set(0, H + 0.5, 0); obsDome.userData.dyn = true; G.add(obsDome);
    add(new THREE.SphereGeometry(R, 32, 16, 0.3, Math.PI * 2 - 0.6, 0, Math.PI / 2), copper, 0, 0, 0, obsDome).rotation.y = Math.PI / 2;
    const slit = add(new THREE.BoxGeometry(1.1, R * 0.95, 0.2), darkWood, 0, R * 0.5, R * 0.6, obsDome); slit.rotation.x = -0.75;
    const tel = new THREE.Group(); tel.position.set(0, 1.4, 0); tel.rotation.x = 0.8; obsDome.add(tel);
    add(new THREE.CylinderGeometry(0.35, 0.5, 7.5, 18), brass, 0, 3.0, 0, tel);
    [0.8, 2.6, 4.4, 6.2].forEach(y => add(new THREE.TorusGeometry(0.47 - y * 0.015, 0.06, 6, 20), darkWood, 0, y, 0, tel).rotation.x = Math.PI / 2);
    add(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 10), brass, 0.5, 0.6, 0, tel).rotation.z = 0.5;
    add(new THREE.SphereGeometry(0.4, 14, 10), gold, 0, R + 0.1, 0, obsDome);
    // harita odası (sekizgen ek bina)
    // sekizgenin bir yüzü kapıya (güneye) baksın
    const mapRoom = add(new THREE.CylinderGeometry(4.2, 4.2, 5.5, 8), cream, 0, 2.75, R + 4.6, G); mapRoom.rotation.y = Math.PI / 8;
    add(new THREE.ConeGeometry(4.8, 2.2, 8), slate, 0, 6.6, R + 4.6, G).rotation.y = Math.PI / 8;
    for (let i = 0; i < 5; i++){ const a = (i - 2) * 0.62; const w = add(new THREE.PlaneGeometry(1.0, 2.2), winMat, Math.sin(a) * 4.0, 2.8, R + 4.6 + Math.cos(a) * 4.0, G, false); w.rotation.y = a; }
    doorway(world, G, {z:R + 4.6 + 4.2 * Math.cos(Math.PI / 8), w:1.8, h:2.7, y0:0.05, style:'kemer', steps:0});
    doors.rasathane = {x:P.x, z:P.z + R + 4.6 + 4.2 * Math.cos(Math.PI / 8) + 1.6, ry:0};
    C.circle(P.x, P.z, R + 1.0); C.circle(P.x, P.z + R + 4.6, 4.4);
    // dışarıda dönen armiller küre (orrery)
    const OX = P.x + 9, OZ = P.z + 10;
    add(new THREE.CylinderGeometry(0.6, 0.9, 1.2, 12), marble, OX, 0.6, OZ); add(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), brass, OX, 1.9, OZ);
    add(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({color:0xffc04a, toneMapped:false}), OX, 2.8, OZ);
    [[1.0, 0.09, 0x8a8a8a], [1.45, 0.12, 0xd8a85a], [1.95, 0.13, 0x3a7ad8], [2.5, 0.11, 0xc84a2a]].forEach(([r, s, c], k) => {
      const g = new THREE.Group(); g.position.set(OX, 2.8, OZ); g.rotation.x = 0.05 * k; g.userData.dyn = true; root.add(g);
      add(new THREE.TorusGeometry(r, 0.02, 6, 48), brass, 0, 0, 0, g, false).rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(s, 12, 10), mat(c, {roughness:0.5}), r, 0, 0, g);
      orrery.push({g, w:1.2 / (k + 1)});
    });
    C.circle(OX, OZ, 1.0);
    signPost('Observatoire Royal', P.x - 7, P.z + 12, 0);
    const astro = lady(0x1d2a5a, 0x2a1a12);
    placeNPC(astro, P.x - 4.5, P.z + 16, 0, 'Astronom Hélène', async () => {
      const night = world.W.night > 0.5;
      const c = await hooks.ui.dialog([{name:'Astronom Hélène', text: night ? 'Gökyüzü bu gece berrak! Teleskop Satürn\'e ayarlı. Bakmak ister misiniz?' : 'Gündüz yıldızlar saklanır, ama teleskop yine de bulutları ve kuşları yakalar. Bakmak ister misiniz?', choices:['Teleskoptan bak', 'Harita odasını sor']}]);
      if (c === 0){ hooks.sfx('whoosh'); hooks.gazeSky && hooks.gazeSky({x:P.x, y:H + 3, z:P.z}); }
      else await say('Astronom Hélène', 'Harita odasında Lumière\'in ilk kadastrosu, Paris rasathanesinin meridyen çizgileri ve gökyüzünün bakır bir küresi var. Kontes buraya "yıldızların kütüphanesi" derdi.');
    });
  }

  /* =====================================================================
     9. DOĞAN/ŞAHİN YUVASI (Falconry Center)
     ===================================================================== */
  const falcons = [];
  let falconFlight = null;
  {
    const P = FALCON;
    plane(44, 36, grassMat, P.x, 0.008, P.z);
    // yarı ahşap kuş evi (mews)
    const {G, front} = hall({x:P.x, z:P.z - 8, w:20, d:9, h:5, rot:0, wall:plaster, roof:'gable', roofMat:tiles, roofH:3.6, pil:false, doorW:2, doorStyle:'rustik'});
    for (let i = 0; i <= 8; i++) add(new THREE.BoxGeometry(0.22, 5, 0.1), darkWood, -10 + i * 2.5, 2.8, 4.56, G);
    add(new THREE.BoxGeometry(20, 0.22, 0.1), darkWood, 0, 3.2, 4.56, G); add(new THREE.BoxGeometry(20, 0.22, 0.1), darkWood, 0, 5.2, 4.56, G);
    for (let i = 0; i < 8; i++){ const b = add(new THREE.BoxGeometry(0.1, 2.0, 0.1), darkWood, -9 + i * 2.57, 1.9, 4.6, G); b.rotation.z = (i % 2 ? 1 : -1) * 0.75; }
    signBoard('Fauconnerie Royale', 0, 6.2, 4.7, 0, 4.4, G);
    doors.sahin = {x:front[0], z:front[1], ry:0};
    // tüneklerde kuşlar
    const brown = new THREE.MeshStandardMaterial({color:0x6a4a2e, roughness:0.7}), chest = new THREE.MeshStandardMaterial({color:0xe2d4b8, roughness:0.7}), beakM = new THREE.MeshStandardMaterial({color:0xe8c040, roughness:0.4}), hood = new THREE.MeshStandardMaterial({color:0x8a2a1a, roughness:0.5});
    function bird(hooded){
      const g = new THREE.Group(); g.userData.dyn = true;
      add(new THREE.SphereGeometry(0.2, 12, 10), brown, 0, 0, 0, g).scale.set(0.85, 1.3, 0.9);
      add(new THREE.SphereGeometry(0.15, 10, 8), chest, 0, 0.02, 0.08, g).scale.set(0.9, 1.3, 0.6);
      add(new THREE.SphereGeometry(0.12, 12, 10), hooded ? hood : brown, 0, 0.3, 0.02, g);
      const bk = add(new THREE.ConeGeometry(0.035, 0.1, 6), beakM, 0, 0.28, 0.14, g); bk.rotation.x = Math.PI / 2 + 0.6;
      add(new THREE.ConeGeometry(0.1, 0.36, 6), brown, 0, -0.32, -0.08, g).rotation.x = Math.PI + 0.25;
      const wings = [-1, 1].map(sd => { const w = new THREE.Group(); w.position.set(sd * 0.14, 0.1, 0); w.userData.anim = true; g.add(w); const wg = new THREE.PlaneGeometry(0.75, 0.28); wg.translate(sd * 0.37, 0, 0); add(wg, new THREE.MeshStandardMaterial({color:0x5a3a22, roughness:0.7, side:THREE.DoubleSide}), 0, 0, 0, w, false); w.rotation.z = sd * -1.3; return w; });
      return {g, wings};
    }
    const perches = [];
    for (let i = 0; i < 5; i++){
      const x = P.x - 10 + i * 5, z = P.z + 2;
      add(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), darkWood, x, 0.7, z); const cr = add(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), darkWood, x, 1.4, z); cr.rotation.z = Math.PI / 2;
      const b = bird(i % 2 === 0); b.g.position.set(x, 1.72, z); b.g.scale.setScalar(1.3); root.add(b.g); perches.push(b); C.circle(x, z, 0.3);
    }
    // gökte daire çizen şahinler
    for (let i = 0; i < 3; i++){ const b = bird(false); b.g.scale.setScalar(1.8); root.add(b.g); falcons.push({b, a:i * 2.1, r:14 + i * 5, h:26 + i * 6, w:0.25 + i * 0.05}); }
    // av köşkü süsleri: ahşap tribün, av boruları, ganimet panosu
    const pole = add(new THREE.CylinderGeometry(0.1, 0.12, 7, 8), darkWood, P.x + 12, 3.5, P.z + 4); C.circle(P.x + 12, P.z + 4, 0.3);
    const [fc, fg2] = canvas(128, 64); fg2.fillStyle = '#1d3a2a'; fg2.fillRect(0, 0, 128, 64); fg2.fillStyle = '#d4af37'; fg2.beginPath(); fg2.moveTo(64, 10); fg2.lineTo(88, 32); fg2.lineTo(64, 54); fg2.lineTo(40, 32); fg2.fill();
    const flag = add(new THREE.PlaneGeometry(2.2, 1.2, 10, 2), new THREE.MeshStandardMaterial({map:ctex(fc), side:THREE.DoubleSide, roughness:0.8}), P.x + 13.1, 6.3, P.z + 4, root, false);
    flag.userData.dyn = true;
    updaters.push((dt, t) => { const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++){ const x = p.getX(i) + 1.1; p.setZ(i, Math.sin(t * 5 + x * 2.5) * 0.15 * x * (0.4 + world.state.wind)); } p.needsUpdate = true; });
    const gaspard = npc({coat:0x2a4a2a, apron:0x6a4a2e});
    add(new THREE.SphereGeometry(0.1, 8, 6), mat(0x8a6a3a), 0, -0.6, 0.05, gaspard.userData.armL);
    gaspard.userData.armL.rotation.x = -1.2;
    const glove = bird(true); glove.g.scale.setScalar(1.1); glove.g.position.set(0, -0.48, 0.18); gaspard.userData.armL.add(glove.g);
    placeNPC(gaspard, P.x - 3, P.z + 6, 0, 'Şahinci Gaspard', async () => {
      if (falconFlight){ await say('Şahinci Gaspard', 'Bakın! Rüzgârı nasıl da yakalıyor. Az sonra eldivene dönecek.'); return; }
      const c = await hooks.ui.dialog([{name:'Şahinci Gaspard', text:'Kralların hobisi derler şahinciliğe. Bu gökdoğan "Mistral"; Lumière\'in en hızlısı. Uçurayım mı?', choices:['Evet, uçur!', 'Kuşlar hakkında anlat']}]);
      if (c === 0){ falconFlight = {t:0, b:glove, start:null}; hooks.sfx('whistle'); hooks.ui.toast('Mistral havalandı!', 2000); }
      else await say('Şahinci Gaspard', 'Gökdoğan dalışta saatte yüz kilometreyi aşar. Başlık takınca sakinleşirler; çan sesinden de yerlerini buluruz. Kontes, avdan dönen şahinlere hep bir parça tavuk saklardı.');
    });
    signPost('Fauconnerie', P.x + 12, P.z + 12, 0);
    plane(3.6, 16, gravel, P.x + 8, 0.08, P.z + 14); plane(52, 3.6, gravel, P.x + 32, 0.08, -70);
  }

  /* =====================================================================
     10. MERMER HAMAM VE KAPLICA
     ===================================================================== */
  let steam = null;
  {
    const P = HAMAM;
    plane(46, 40, grassMat, P.x, 0.008, P.z);
    // kubbeli hamam binası
    const B = new THREE.Group(); B.position.set(P.x, 0, P.z - 9); root.add(B);
    add(new THREE.BoxGeometry(18, 7, 14), marble, 0, 3.5, 0, B);
    add(new THREE.BoxGeometry(18.6, 0.6, 14.6), cream, 0, 7.2, 0, B);
    add(new THREE.CylinderGeometry(5.2, 5.6, 1.4, 16), marble, 0, 8.2, 0, B);
    const dm = add(new THREE.SphereGeometry(5.2, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xb8b8bc, {roughness:0.45, metalness:0.4}), 0, 8.9, 0, B);
    for (let i = 0; i < 14; i++){ const a = i / 14 * Math.PI * 2, b = 0.5 + (i % 2) * 0.35; add(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({color:0xfff2c0, toneMapped:false}), Math.cos(a) * 5.2 * Math.cos(b), 8.9 + 5.2 * Math.sin(b), Math.sin(a) * 5.2 * Math.cos(b), B, false); }
    add(new THREE.ConeGeometry(0.2, 1.4, 8), gold, 0, 14.8, 0, B); add(new THREE.TorusGeometry(0.4, 0.06, 6, 16, Math.PI * 1.6), gold, 0, 15.5, 0, B).rotation.z = 1.9;
    [[-6, 4.5], [6, 4.5], [-6, -4.5], [6, -4.5]].forEach(([x, z]) => { const d = add(new THREE.SphereGeometry(2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xb8b8bc, {roughness:0.45, metalness:0.4}), x, 7.5, z, B); });
    for (let i = 0; i < 5; i++){ const x = -6 + i * 3; if (i === 2) continue; const w = add(new THREE.PlaneGeometry(1.2, 2.6), winMat, x, 3.4, 7.02, B, false); add(new THREE.TorusGeometry(0.6, 0.08, 6, 16, Math.PI), cream, x, 4.7, 7.05, B); }
    doorway(world, B, {z:7.0, w:2.4, h:3.6, y0:0.15, style:'kemer', steps:1});
    doors.hamam = {x:P.x, z:P.z - 9 + 7 + 1.8, ry:0};
    C.box(P.x, P.z - 9, 9.2, 7.2);
    signBoard('Thermes de Lumière', 0, 6.0, 7.1, 0, 5, B);
    // açık hava kaplıcası: mozaik zemin, sütunlu galeri, sıcak su havuzu
    disc(11, mosaic, P.x, 0.05, P.z + 10);
    const pool = disc(6.2, new THREE.MeshStandardMaterial({color:0x4ab0b0, metalness:0.2, roughness:0.05, transparent:true, opacity:0.85, emissive:0x0a3a3a, emissiveIntensity:0.4}), P.x, 0.2, P.z + 10);
    add(new THREE.TorusGeometry(6.4, 0.3, 8, 64), marble, P.x, 0.2, P.z + 10).rotation.x = Math.PI / 2;
    C.circle(P.x, P.z + 10, 6.6);
    for (let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; if (Math.abs(a - Math.PI * 1.5) < 0.25 || Math.abs(a - Math.PI * 0.5) < 0.25) continue; const x = P.x + Math.cos(a) * 10, z = P.z + 10 + Math.sin(a) * 10; column(x, z, 4.6, 0.26); C.circle(x, z, 0.35); }
    add(new THREE.TorusGeometry(10, 0.3, 6, 64), cream, P.x, 4.7, P.z + 10).rotation.x = Math.PI / 2;
    // aslan başlı çeşme
    add(new THREE.BoxGeometry(1.4, 2, 0.6), marble, P.x, 1, P.z + 1.4); add(new THREE.SphereGeometry(0.3, 12, 10), gold, P.x, 1.5, P.z + 1.8);
    jet(P.x, 1.45, P.z + 2.0, 50, 1.2, 0.2, 0.2);
    // buhar
    const NS = 160, sg = new THREE.BufferGeometry(), sp = new Float32Array(NS * 3), sv = new Float32Array(NS);
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const [pc, pg] = canvas(64, 64); const gr = pg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); pg.fillStyle = gr; pg.fillRect(0, 0, 64, 64);
    const smat = new THREE.PointsMaterial({size:2.2, map:new THREE.CanvasTexture(pc), transparent:true, depthWrite:false, opacity:0.5});
    const reset = i => { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 5.8; sp.set([P.x + Math.cos(a) * r, 0.3, P.z + 10 + Math.sin(a) * r], i * 3); sv[i] = 0.4 + rnd() * 0.5; };
    for (let i = 0; i < NS; i++){ reset(i); sp[i * 3 + 1] = rnd() * 4; }
    const pts = new THREE.Points(sg, smat); pts.frustumCulled = false; root.add(pts);
    steam = {sp, sv, sg, NS, reset};
    interact.push({x:P.x, z:P.z + 1, r:3.0, label:'Sıcak suda dinlen', show:() => true, act:async () => {
      await hooks.ui.fade(() => {});
      await say('', 'Doğal kaynaktan gelen ılık suya gömüldün. Mozaikteki mavi dalgalar buharın ardında kıpırdıyor gibi. Bütün yorgunluğun aktı gitti.');
      hooks.ui.toast('Dinlendin ♨', 2200);
    }});
    plane(3.6, 16, gravel, P.x, 0.08, -29); plane(84, 3.6, gravel, 80, 0.08, -20);
  }

  /* =====================================================================
     11. OKÇULUK VE BIÇAK ATIŞ POLİGONU
     ===================================================================== */
  const arch = {shots:0, score:0, arrows:[], flying:[], knives:0};
  {
    const P = ARCH, LEN = 44;
    plane(LEN + 12, 18, grassMat, P.x, 0.008, P.z);
    for (let k = -4; k <= 4; k += 2) plane(LEN, 0.08, new THREE.MeshBasicMaterial({color:0xf2efe6}), P.x, 0.035, P.z + k * 1.5);
    // hedefler
    const [tc, tg] = canvas(256, 256); [['#ffffff', 128], ['#1a1a1a', 102], ['#2a6ad8', 77], ['#d8202f', 51], ['#ffd23f', 26]].forEach(([c, r]) => { tg.fillStyle = c; tg.beginPath(); tg.arc(128, 128, r, 0, 7); tg.fill(); });
    const tm = new THREE.MeshStandardMaterial({map:ctex(tc), roughness:0.8}), straw = new THREE.MeshStandardMaterial({color:0xc9a54e, roughness:1});
    arch.targets = [];
    for (let i = 0; i < 4; i++){
      const z = P.z - 4.5 + i * 3, x = P.x + LEN / 2 - 2;
      const bale = add(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 24), straw, x, 1.3, z); bale.rotation.z = Math.PI / 2;
      const face = add(new THREE.CircleGeometry(0.85, 32), tm, x - 0.26, 1.3, z, root, false); face.rotation.y = -Math.PI / 2;
      [-1, 1].forEach(sd => { const l = add(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), darkWood, x + 0.4, 1.05, z + sd * 0.5); l.rotation.x = sd * 0.2; l.rotation.z = -0.25; });
      C.circle(x, z, 0.8); arch.targets.push({x:x - 0.27, y:1.3, z});
    }
    // atış pavyonu
    const T = new THREE.Group(); T.position.set(P.x - LEN / 2 - 1, 0, P.z); root.add(T);
    [[-1.8, -7.5], [-1.8, 7.5], [1.8, -7.5], [1.8, 7.5]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.15, 0.18, 3.6, 10), darkWood, x, 1.8, z, T));
    const [sc, sg2] = canvas(256, 64); for (let i = 0; i < 16; i++){ sg2.fillStyle = i % 2 ? '#f4ead6' : '#2a5a2a'; sg2.fillRect(i * 16, 0, 16, 64); }
    const can = add(new THREE.BoxGeometry(4.4, 0.1, 16), new THREE.MeshStandardMaterial({map:ctex(sc, 1, 4), roughness:0.8}), 0, 3.65, 0, T); can.rotation.z = 0.08;
    add(new THREE.BoxGeometry(0.4, 1.5, 3), darkWood, -1.6, 0.75, 4, T);
    for (let i = 0; i < 5; i++){ const b = add(new THREE.TorusGeometry(0.7, 0.025, 4, 16, Math.PI), darkWood, -1.45, 1.6, 2.9 + i * 0.5, T); b.rotation.z = Math.PI / 2; }
    add(new THREE.BoxGeometry(0.06, 1.2, 0.06), darkWood, 1.5, 0.6, -5.5, T);
    [[-1.8, -7.5], [-1.8, 7.5], [1.8, -7.5], [1.8, 7.5]].forEach(([x, z]) => C.circle(T.position.x + x, T.position.z + z, 0.25));
    C.box(T.position.x - 1.6, P.z + 4, 0.25, 1.5);
    // bıçak tahtası (yan şeritte)
    const KX = P.x - 8, KZ = P.z + 10;
    add(new THREE.BoxGeometry(0.25, 2.2, 2.2), wood, KX, 1.3, KZ); [-1, 1].forEach(sd => add(new THREE.BoxGeometry(0.2, 2.6, 0.2), darkWood, KX + 0.1, 1.3, KZ + sd * 1.1));
    const kf = add(new THREE.CircleGeometry(0.7, 32), tm, KX - 0.13, 1.3, KZ, root, false); kf.rotation.y = -Math.PI / 2;
    C.box(KX, KZ, 0.2, 1.2); arch.board = {x:KX - 0.14, y:1.3, z:KZ};
    signPost('Tir à l\'arc', P.x - LEN / 2 - 5, P.z - 9, Math.PI / 2);
    const basile = npc({coat:0x2a5a2a});
    placeNPC(basile, P.x - LEN / 2 + 1.5, P.z - 7.6, Math.PI / 2, 'Okçu Basile', () => say('Okçu Basile', arch.best ? 'En iyi turun ' + arch.best + ' puan! Kontesin okçuları bile kıskanır.' : 'Beş ok, tek tur. Sarı merkez on puan. Atış çizgisinde E ile yayı al; fareyi basılı tuttukça yay gerilir, bırakınca ok uçar. Çok uzun gergin tutarsan kolun titrer! Rüzgârı da hesaba kat. Yayı bir kez aldın mı, B ile her yerde atabilirsin.'));
    // birinci şahıs okçuluk (game/archery.js); kanca yoksa eski otomatik atış
    arch.line = {x:P.x - LEN / 2 + 1.6, z:P.z};
    interact.push({x:P.x - LEN / 2 + 1.6, z:P.z, r:4.5, label:'Yayı al (birinci şahıs okçuluk)', show:() => !arch.flying.length, act:() => hooks.archery ? hooks.archery({targets:arch.targets.map(t => ({x:t.x, y:t.y, z:t.z, nx:-1, ny:0, nz:0, r:0.85})), at:arch.line, yaw:Math.PI / 2}) : shoot('ok')});
    interact.push({x:KX - 6, z:KZ, r:2.6, label:'Bıçak at', show:() => !arch.flying.length, act:() => shoot('bicak')});
    plane(3.6, 18, gravel, P.x - LEN / 2 - 5, 0.08, P.z - 16);
  }
  const arrowGeo = (() => { const s = new THREE.CylinderGeometry(0.012, 0.012, 0.8, 5); s.rotateZ(Math.PI / 2); const h = new THREE.ConeGeometry(0.025, 0.08, 6); h.rotateZ(-Math.PI / 2); h.translate(0.43, 0, 0); const f = new THREE.BoxGeometry(0.12, 0.06, 0.004); f.translate(-0.36, 0, 0); return mergeBufferGeometries([s.toNonIndexed(), h.toNonIndexed(), f.toNonIndexed()]); })();
  const knifeGeo = (() => { const b = new THREE.BoxGeometry(0.22, 0.04, 0.008); b.translate(0.11, 0, 0); const h = new THREE.BoxGeometry(0.12, 0.035, 0.02); h.translate(-0.06, 0, 0); return mergeBufferGeometries([b.toNonIndexed(), h.toNonIndexed()]); })();
  const arrowMat = new THREE.MeshStandardMaterial({color:0xe8e2d0, roughness:0.6}), knifeMat = new THREE.MeshStandardMaterial({color:0xc8ccd2, metalness:1, roughness:0.3});
  let heroRef = null;
  function shoot(kind){
    const hero = heroRef; if (!hero) return;
    if (kind === 'ok' && arch.shots >= 5){ arch.arrows.forEach(a => root.remove(a)); arch.arrows = []; arch.shots = 0; arch.score = 0; }
    if (kind === 'bicak' && arch.knives >= 3){ arch.arrows.filter(a => a.userData.knife).forEach(a => root.remove(a)); arch.arrows = arch.arrows.filter(a => !a.userData.knife); arch.knives = 0; }
    const tgt = kind === 'ok' ? arch.targets.reduce((b, t) => Math.abs(t.z - hero.pos.z) < Math.abs(b.z - hero.pos.z) ? t : b) : arch.board;
    const rr = Math.min(0.95, Math.abs((rnd() + rnd() + rnd()) / 3 - 0.5) * 2.4 * (kind === 'ok' ? 0.9 : 0.7)), aa = rnd() * 6.28;
    const end = L(tgt.x, tgt.y + Math.sin(aa) * rr * 0.85, tgt.z + Math.cos(aa) * rr * 0.85), start = L(hero.pos.x + 0.4, hero.pos.y + 1.5, hero.pos.z);
    const m = new THREE.Mesh(kind === 'ok' ? arrowGeo : knifeGeo, kind === 'ok' ? arrowMat : knifeMat); m.castShadow = true; m.userData.knife = kind !== 'ok'; root.add(m); arch.arrows.push(m);
    const dur = Math.max(0.3, start.distanceTo(end) / (kind === 'ok' ? 38 : 14));
    arch.flying.push({m, start, end, t:0, dur, kind, rr});
    hooks.sfx('whoosh');
  }

  /* =====================================================================
     12. SARAY MUTFAĞI VE GURME FIRIN
     ===================================================================== */
  const smokes = [];
  function smokeAt(x, y, z, n = 40){
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), life = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    for (let i = 0; i < n; i++){ p.set([x, y + rnd() * 6, z], i * 3); life[i] = rnd(); }
    const [c, cg] = canvas(64, 64); const gr = cg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(200,200,200,.6)'); gr.addColorStop(1, 'rgba(200,200,200,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
    const P = new THREE.Points(g, new THREE.PointsMaterial({size:1.8, map:new THREE.CanvasTexture(c), transparent:true, depthWrite:false, opacity:0.55})); P.frustumCulled = false; root.add(P);
    smokes.push({x, y, z, n, p, life, g});
  }
  {
    const P = KITCHEN;
    plane(30, 26, grassMat, P.x, 0.008, P.z);
    const {G, front} = hall({x:P.x, z:P.z - 2, w:20, d:12, h:6.5, rot:0, wall:brick, roof:'gable', roofMat:slate, roofH:4, doorW:2.2, doorStyle:'rustik'});
    [-6.5, 6.5].forEach(x => { add(new THREE.BoxGeometry(1.4, 6, 1.4), brick, x, 9.5, -2, G); add(new THREE.BoxGeometry(1.7, 0.4, 1.7), stone, x, 12.6, -2, G); smokeAt(P.x + x, 12.9, P.z - 4); });
    signBoard('Cuisines Royales', 0, 5.6, 6.1, 0, 4.6, G);
    doors.mutfak = {x:front[0], z:front[1], ry:0};
    // dış ekmek fırını
    const OX = P.x - 8, OZ = P.z + 9;
    const ov = add(new THREE.SphereGeometry(1.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), brick, OX, 0.9, OZ); add(new THREE.CylinderGeometry(1.8, 1.9, 0.9, 20), stone, OX, 0.45, OZ);
    const mouth = add(new THREE.CircleGeometry(0.55, 16, 0, Math.PI), new THREE.MeshBasicMaterial({color:0xff7a2a, toneMapped:false}), OX, 0.95, OZ + 1.62, root, false);
    add(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8), brick, OX, 3.0, OZ - 0.6); smokeAt(OX, 3.7, OZ - 0.6, 20);
    C.circle(OX, OZ, 1.9);
    // tezgâh: ekmekler, sepetler ve meyve kasaları (bağdan üzüm, seradan portakal)
    const TX = P.x + 2, TZ = P.z + 8;
    add(new THREE.BoxGeometry(4, 0.12, 1.2), wood, TX, 0.95, TZ); [-1.8, 1.8].forEach(dx => add(new THREE.BoxGeometry(0.12, 0.95, 1.1), darkWood, TX + dx, 0.47, TZ));
    for (let i = 0; i < 7; i++){ const br = add(new THREE.CapsuleGeometry(0.1, 0.4, 4, 8), mat(0xc8862a, {roughness:0.7}), TX - 1.6 + i * 0.5, 1.1, TZ - 0.2); br.rotation.z = Math.PI / 2; }
    for (let i = 0; i < 4; i++){ const c = add(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe8c27a), TX - 1.2 + i * 0.8, 1.01, TZ + 0.3); c.scale.y = 0.6; }
    C.box(TX, TZ, 2.1, 0.7);
    const CR = [[0x4a2a6a, 0.08], [0xff8a1a, 0.11], [0xc8202f, 0.1], [0x9ab84a, 0.08]];
    CR.forEach(([c, s], k) => { const x = P.x + 7 + (k % 2) * 1.3, z = P.z + 7 + Math.floor(k / 2) * 1.3; add(new THREE.BoxGeometry(1.1, 0.5, 0.8), wood, x, 0.25, z); for (let i = 0; i < 10; i++) fruits.push([root, x - 0.4 + rnd() * 0.8, 0.55 + rnd() * 0.08, z - 0.25 + rnd() * 0.5, c, 0, s]); C.circle(x, z, 0.6); });
    // sebze tarhları
    for (let r = 0; r < 4; r++){ plane(8, 1.2, mat(0x5a4030, {roughness:1}), P.x - 8, 0.04, P.z + 14 + r * 1.8); for (let i = 0; i < 10; i++) bushes.push([P.x - 11.6 + i * 0.8, 0.22, P.z + 14 + r * 1.8, 0.28, 0.25 + r * 0.04]); }
    const chef = npc({chef:true, apron:true});
    placeNPC(chef, P.x - 3, P.z + 6.4, 0, 'Şef Antoine', async () => {
      const MENU = [
        ['Cennet Bağı üzümleriyle kızarmış bıldırcın ve kestane püresi', 'Üzümleri sabah Prenses Aurélie\'nin bağından kopardık.'],
        ['Portakal serasının portakallarıyla "canard à l\'orange"', 'Sosun sırrı: bir tutam kış bahçesi limonu.'],
        ['Yaban mersinli mille-feuille ve gül suyu kreması', 'Gül suyu parfüm laboratuvarından geliyor, Mlle Isabeau damıttı.'],
        ['Taş fırında kızarmış somun, keçi peyniri ve ballı incir', 'Fırın şafaktan beri yanıyor. Kokusunu duydunuz mu?'],
      ];
      const [dish, note] = MENU[Math.floor(rnd() * MENU.length)];
      const c = await hooks.ui.dialog([{name:'Şef Antoine', text:'Haute cuisine! Mülkün her köşesinden gelen en taze ürünler buraya, benim tabaklarıma gelir. Günün tabağı: ' + dish + '.', choices:['Tadına bak', 'Teşekkürler']}]);
      if (c === 0){ hooks.sfx('coin'); await say('Şef Antoine', 'Nasıl? ' + note + ' Bon appétit!'); hooks.ui.toast('Leziz! 🍽', 2000); }
    });
  }

  /* =====================================================================
     13. PARFÜM VE ESANS LABORATUVARI
     ===================================================================== */
  {
    const P = PERFUME;
    plane(24, 26, grassMat, P.x, 0.008, P.z);
    const {G, front} = hall({x:P.x, z:P.z - 4, w:12, d:9, h:5.5, rot:0, wall:new THREE.MeshStandardMaterial({color:0xf2dfe4, roughness:0.7}), roof:'mansard', roofMat:copper, roofH:2.6, doorW:2});
    signBoard('Parfumerie', 0, 4.8, 4.62, 0, 3.4, G);
    doors.parfum = {x:front[0], z:front[1], ry:0};
    // önde cam veranda ve damıtma imbiği
    const V = new THREE.Group(); V.position.set(P.x, 0, P.z + 3); root.add(V);
    add(new THREE.BoxGeometry(8, 0.3, 4), marble, 0, 0.15, 0, V);
    [[-3.9, -1.9], [3.9, -1.9], [-3.9, 1.9], [3.9, 1.9]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.12, 3.4, 0.12), brass, x, 1.85, z, V));
    const roofG = add(new THREE.BoxGeometry(8.2, 0.08, 4.2), glass, 0, 3.55, 0, V, false); roofG.renderOrder = 2;
    platforms.push({x:P.x, z:P.z + 3, hw:4, hd:2, h:0.3});
    const still = new THREE.Group(); still.position.set(-1.8, 0.3, 0); V.add(still);
    add(new THREE.CylinderGeometry(0.75, 0.9, 0.6, 16), brick, 0, 0.3, 0, still);
    add(new THREE.SphereGeometry(0.7, 20, 14), brass, 0, 1.15, 0, still);
    add(new THREE.ConeGeometry(0.35, 0.8, 16), brass, 0, 2.1, 0, still);
    const pipe = new THREE.CatmullRomCurve3([L(0, 2.4, 0), L(0.8, 2.5, 0), L(1.6, 1.9, 0), L(2.0, 1.2, 0)]);
    add(new THREE.TubeGeometry(pipe, 16, 0.05, 6), brass, 0, 0, 0, still);
    add(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 14), brass, 2.0, 0.75, 0, still);
    add(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({color:0xff9fc0, transparent:true, opacity:0.7, roughness:0.05}), 2.0, 0.25 + 0.16, 0.45, still);
    const fire = add(new THREE.ConeGeometry(0.3, 0.4, 8), new THREE.MeshBasicMaterial({color:0xff8a2a, toneMapped:false}), 0, 0.15, 0.7, still, false);
    fire.userData.dyn = true; updaters.push((dt, t) => { fire.scale.y = 0.8 + Math.sin(t * 13) * 0.2; });
    // şişe rafı
    add(new THREE.BoxGeometry(2.6, 0.08, 0.6), darkWood, 1.8, 1.3, -1.5, V); add(new THREE.BoxGeometry(2.6, 0.08, 0.6), darkWood, 1.8, 2.0, -1.5, V);
    const BOT = [0xff9fc0, 0xb58aff, 0xffd23f, 0x8ad8ff, 0xffffff, 0xff7a5a];
    for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++){ const b = add(new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.1, 0.12], [0.04, 0.2], [0.03, 0.27], [0, 0.27]].map(([a, b]) => new THREE.Vector2(a, b)), 10), mat(BOT[(i + k) % 6], {transparent:true, opacity:0.75, roughness:0.05, metalness:0.1}), 0.75 + i * 0.4, 1.34 + k * 0.7, -1.5, V, false); }
    C.box(P.x - 1.8, P.z + 3, 1.3, 1.0); C.box(P.x + 1.8, P.z + 1.5, 1.4, 0.4);
    // gül ve lavanta tarhları
    const lav = new THREE.InstancedMesh(new THREE.ConeGeometry(0.05, 0.35, 5), new THREE.MeshStandardMaterial({color:0x8a6ad8, roughness:0.6}), 900);
    let li = 0;
    for (let r = 0; r < 5; r++) for (let i = 0; i < 180 && li < 900; i++){ const x = P.x - 10 + i * 0.11, z = P.z + 8 + r * 1.2; m4.compose(L(x, 0.55 + rnd() * 0.15, z + (rnd() - 0.5) * 0.4), q4.identity(), s4.set(1, 1, 1)); lav.setMatrixAt(li++, m4); }
    root.add(lav);
    for (let r = 0; r < 5; r++) bushes.push(...Array.from({length:20}, (_, i) => [P.x - 10 + i, 0.25, P.z + 8 + r * 1.2, 0.35, 0.3]));
    for (let i = 0; i < 10; i++) bush(P.x + 9, P.z - 9 + i * 2, 0.6, ['#ff8fab', '#c8102e', '#ffffff'][i % 3], 9);
    const isabeau = lady(0xe8b4c8, 0xc89a5a);
    placeNPC(isabeau, P.x + 1.8, P.z + 6.4, 0, 'Mlle Isabeau', async () => {
      const st = S().notes;
      if (st.perfume){ await say('Mlle Isabeau', '"' + st.perfume + '" bugün de saray koridorlarında dolaşıyor. Kontes çok beğendi!'); return; }
      await say('Mlle Isabeau', 'Seradaki nadide çiçekleri burada damıtıyorum; bir şişe parfüm için bin gül yaprağı gerekir. Sizin için bir esans yapalım mı?');
      const top = await hooks.ui.dialog([{name:'Mlle Isabeau', text:'Önce üst nota. Hangisi?', choices:['Bergamot', 'Portakal çiçeği', 'Limon kabuğu']}]);
      const heart = await hooks.ui.dialog([{name:'Mlle Isabeau', text:'Şimdi kalp notası…', choices:['Damask gülü', 'Yasemin', 'Lavanta']}]);
      const base = await hooks.ui.dialog([{name:'Mlle Isabeau', text:'Ve dip nota, kalıcı olan:', choices:['Sandal ağacı', 'Amber', 'Meşe yosunu']}]);
      const N = [['Aube', 'Soleil', 'Zeste'], ['de Rose', 'de Jasmin', 'de Provence'], ['Dorée', 'Ambrée', 'Sauvage']];
      st.perfume = N[0][top] + ' ' + N[1][heart] + ' ' + N[2][base];
      hooks.sfx('rune'); await say('Mlle Isabeau', 'Mükemmel bir uyum! Adını "' + st.perfume + '" koyalım. Kristal şişesi sizin.'); hooks.ui.toast('Parfüm: ' + st.perfume, 3000); hooks.save();
    });
  }

  /* =====================================================================
     14. İPEK VE KUMAŞ DOKUMA ATÖLYESİ
     ===================================================================== */
  const cloths = [];
  {
    const P = SILK;
    plane(34, 30, grassMat, P.x, 0.008, P.z);
    const {G, front} = hall({x:P.x, z:P.z - 4, w:22, d:10, h:6, rot:0, wall:new THREE.MeshStandardMaterial({color:0xe9dcc4, roughness:0.8}), roof:'mansard', roofMat:slate, roofH:3, doorW:2.2, winRows:1});
    signBoard('Soieries de Lumière', 0, 5.3, 5.12, 0, 4.4, G);
    doors.ipek = {x:front[0], z:front[1], ry:0};
    // dut ağaçları (ipek böcekleri için)
    for (let i = 0; i < 6; i++){ const x = P.x - 14 + (i % 3) * 4, z = P.z + 6 + Math.floor(i / 3) * 4; tree(x, z, 0.8, 0.26); }
    // kurutma iplerinde renkli ipekler
    const SILKC = [0xc8102e, 0x1d4fb8, 0xd4af37, 0x2a8a5a, 0x8a3ab8, 0xf2e6d0, 0xff8fab];
    [0, 1].forEach(r => {
      const z = P.z + 4 + r * 4.5, x0 = P.x + 1, x1 = P.x + 14;
      [x0, x1].forEach(x => { add(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), darkWood, x, 1.6, z); C.circle(x, z, 0.2); });
      add(new THREE.CylinderGeometry(0.015, 0.015, x1 - x0, 4), darkWood, (x0 + x1) / 2, 3.0, z, root, false).rotation.z = Math.PI / 2;
      for (let i = 0; i < 5; i++){
        const cg = new THREE.PlaneGeometry(1.9, 2.0, 6, 8); cg.translate(0, -1.0, 0);
        const cm = add(cg, new THREE.MeshStandardMaterial({color:SILKC[(i + r * 3) % SILKC.length], roughness:0.35, metalness:0.15, side:THREE.DoubleSide}), x0 + 1.5 + i * 2.5, 3.0, z, root, true);
        cm.userData.dyn = true; cloths.push({m:cm, base:cg.attributes.position.array.slice(), ph:rnd() * 6});
      }
    });
    plane(16, 3.6, gravel, 183, 0.08, P.z + 2);
    // dokuma tezgâhı (dışarıda, tentenin altında)
    const LX = P.x - 6, LZ = P.z + 4;
    [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]].forEach(([x, z]) => add(new THREE.BoxGeometry(0.12, 1.8, 0.12), wood, LX + x, 0.9, LZ + z));
    [0.4, 1.7].forEach(y => add(new THREE.BoxGeometry(2.2, 0.1, 0.1), wood, LX, y, LZ - 0.6));
    const warp = add(new THREE.PlaneGeometry(1.9, 1.2), new THREE.MeshStandardMaterial({color:0xd4af37, roughness:0.3, metalness:0.3, side:THREE.DoubleSide}), LX, 1.05, LZ - 0.1); warp.rotation.x = -0.4;
    C.box(LX, LZ, 1.2, 0.8);
    const colette = lady(0x2a5a8a, 0x3a2416);
    placeNPC(colette, P.x - 2.5, P.z + 4.5, 0, 'Madame Colette', async () => {
      const C2 = [['Kraliyet kırmızısı', 0x7a0f1c], ['Gece mavisi', 0x14245a], ['Zümrüt yeşili', 0x0f4a2a], ['Altın brokar', 0x8a6a1a]];
      const c = await hooks.ui.dialog([
        {name:'Madame Colette', text:'İpek böceklerimiz dut yapraklarıyla beslenir, kozalarından tek tel ipek çekeriz; bir pelerin için binlerce koza gerekir.'},
        {name:'Madame Colette', text:'Pelerininiz yolculuktan yıpranmış. Size yenisini dikeyim mi? Renk seçin:', choices:C2.map(x => x[0]).concat(['Şimdilik kalsın'])},
      ]);
      if (c < C2.length){ S().notes.cape = C2[c][1]; applyCape(); hooks.sfx('quest'); hooks.ui.toast('Yeni pelerin: ' + C2[c][0], 2600); hooks.save(); }
    });
  }
  function applyCape(){ const c = S().notes.cape; if (c == null || !heroRef) return; const cape = heroRef.obj.userData.cape; if (cape) cape.material.color.setHex(c); }

  /* =====================================================================
     15. ŞARAP MAHZENİ (Winery & Cellar)
     ===================================================================== */
  {
    const P = WINERY;
    plane(32, 30, grassMat, P.x, 0.008, P.z);
    const {G, front} = hall({x:P.x, z:P.z, w:20, d:14, h:7, rot:-Math.PI / 2, wall:new THREE.MeshStandardMaterial({map:M.stoneMat.map, color:0xd8c8a8, roughness:0.9}), roof:'gable', roofMat:tiles, roofH:4.2, pil:false, doorStyle:'kemer', doorW:2.6});
    doors.sarap = {x:front[0], z:front[1], ry:-Math.PI / 2};
    // kemerli mahzen girişi ve inen basamaklar
    const [ex, ez] = toWorld(G, 6, 7.0);
    const cellar = new THREE.Group(); cellar.position.set(ex, 0, ez); cellar.rotation.y = -Math.PI / 2; root.add(cellar);
    add(new THREE.BoxGeometry(3.6, 2.4, 0.6), stone, 0, 1.2, 0.3, cellar);
    add(new THREE.CircleGeometry(1.1, 20, 0, Math.PI), new THREE.MeshBasicMaterial({color:0x0a0806}), 0, 1.2, 0.62, cellar, false);
    add(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({color:0x0a0806}), 0, 0.6, 0.62, cellar, false);
    add(new THREE.TorusGeometry(1.15, 0.14, 8, 20, Math.PI), stone, 0, 1.2, 0.65, cellar); C.circle(ex + 0.3, ez, 1.6);
    // fıçılar (meşe), kasnaklar
    const barrel = new THREE.LatheGeometry([[0, -0.6], [0.42, -0.6], [0.5, -0.3], [0.53, 0], [0.5, 0.3], [0.42, 0.6], [0, 0.6]].map(([a, b]) => new THREE.Vector2(a, b)), 18);
    const oak = new THREE.MeshStandardMaterial({color:0x7a4a26, roughness:0.75}), hoop = new THREE.MeshStandardMaterial({color:0x2a2a2e, metalness:0.7, roughness:0.4});
    const placeBarrel = (x, y, z, ry) => { const b = add(barrel, oak, x, y, z); b.rotation.set(0, ry, Math.PI / 2); [-0.4, 0.4].forEach(o => { const h = add(new THREE.TorusGeometry(0.5, 0.03, 6, 20), hoop, x + Math.cos(ry) * o, y, z - Math.sin(ry) * o); h.rotation.y = ry + Math.PI / 2; }); };
    for (let i = 0; i < 4; i++){ placeBarrel(P.x - 11, 0.55, P.z - 4 + i * 1.15, 0); if (i < 3) placeBarrel(P.x - 11, 1.5, P.z - 3.4 + i * 1.15, 0); }
    C.box(P.x - 11, P.z - 2.3, 0.6, 2.4);
    // tadım terası: pergola, masalar, şişeler
    const T = new THREE.Group(); T.position.set(P.x - 14, 0, P.z + 6); root.add(T);
    add(new THREE.BoxGeometry(8, 0.2, 7), stone, 0, 0.1, 0, T);
    [[-3.6, -3.2], [3.6, -3.2], [-3.6, 3.2], [3.6, 3.2]].forEach(([x, z]) => { add(new THREE.BoxGeometry(0.25, 3, 0.25), stone, x, 1.6, z, T); C.circle(T.position.x + x, T.position.z + z, 0.25); });
    for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(0.12, 0.14, 7), darkWood, -3.6 + i * 1.2, 3.15, 0, T);
    const vine = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.35, 0), leafMat, 90);
    for (let i = 0; i < 90; i++){ m4.compose(L(T.position.x - 3.6 + rnd() * 7.2, 3.35 + rnd() * 0.2, T.position.z - 3.3 + rnd() * 6.6), q4.setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd())), s4.set(1, 0.5, 1)); vine.setMatrixAt(i, m4); }
    root.add(vine);
    const bottle = new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.07, 0.2], [0.025, 0.28], [0.022, 0.36], [0, 0.36]].map(([a, b]) => new THREE.Vector2(a, b)), 10);
    const wineG = new THREE.MeshStandardMaterial({color:0x2a0a12, roughness:0.1, metalness:0.3});
    [[-1.6, -1.2], [1.6, 1.2]].forEach(([x, z]) => {
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 18), cream, x, 0.95, z, T); add(new THREE.CylinderGeometry(0.06, 0.2, 0.8, 8), darkWood, x, 0.55, z, T);
      add(bottle, wineG, x, 0.98, z, T); [0, 1].forEach(k => add(new THREE.LatheGeometry([[0, 0], [0.05, 0], [0.01, 0.01], [0.01, 0.1], [0.05, 0.14], [0.05, 0.2], [0, 0.17]].map(([a, b]) => new THREE.Vector2(a, b)), 10), glass, x + (k ? 0.3 : -0.3), 0.98, z + 0.2, T, false));
      C.circle(T.position.x + x, T.position.z + z, 0.75);
    });
    signPost('Chai & Caveau', P.x - 18, P.z - 4, Math.PI / 2);
    plane(28, 3.6, gravel, 175, 0.08, P.z);
    const bastien = npc({coat:0x5a1a2a, apron:0x2a1a12});
    placeNPC(bastien, P.x - 9, P.z - 6, -Math.PI / 2, 'Sommelier Bastien', async () => {
      const VINT = [
        ['Château Lumière Rouge, 1719', 'Cennet Bağı\'nın mor salkımları, Fransız meşesinde beş yıl. Böğürtlen, tütün ve hafif bir menekşe kokusu.'],
        ['Blanc de l\'Orangerie, 1722', 'Yeşil üzümlerden; taze, narenciye çiçeği gibi. Kontes yazın kuğu göletinde bunu içerdi.'],
        ['Cuvée du Dragon, 1700', 'Mahzenin en dibindeki fıçıdan. Efsaneye göre Pyra\'nın ilk kükremesinin yılı… Baharatlı, sıcak, uzun.'],
      ];
      const c = await hooks.ui.dialog([{name:'Sommelier Bastien', text:'Mahzene hoş geldiniz. Aşağıda taş tonozların altında iki yüz meşe fıçı uyur. Hangi rekolteyi tatmak istersiniz?', choices:VINT.map(v => v[0])}]);
      hooks.sfx('blip'); await say('Sommelier Bastien', VINT[c][1]); hooks.ui.toast('Santé! 🍷', 1800);
    });
    interact.push({x:ex - 1.4, z:ez, r:2.4, label:'Mahzene bak', show:() => true, act:() => say('', 'Serin, loş taş basamaklar aşağıya iniyor. Mum ışığında sıra sıra meşe fıçılar ve tozlu şişeler… Tadım odasının kemerlerinden yankılanan kahkahalar duyuluyor.')});
  }

  /* ================= yollar ve bölge bağlantıları ================= */
  plane(3.6, 50, gravel, 0, 0.08, -75);                    // şatonun arkasından balo salonuna
  plane(3.6, 26, gravel, 0, 0.08, -119);                   // balo salonundan rasathaneye
  plane(124, 3.6, gravel, 0, 0.08, -70);                   // kültür caddesi
  plane(3.6, 10, gravel, OPERA.x, 0.08, -74.5); plane(3.6, 10, gravel, LIB.x, 0.08, -76);
  [-1, 1].forEach(sx => plane(3.6, 50, gravel, sx * 62, 0.08, -45));   // şatonun iki yanından kuzeye
  plane(3.6, 36, gravel, KITCHEN.x + 13, 0.08, 58); plane(104, 3.6, gravel, 123, 0.08, 40); plane(3.6, 11, gravel, 71, 0.08, 45.5); plane(3.6, 50, gravel, 175, 0.08, 64);
  // bulvar boyunca konik çitler (topiary)
  for (let z = -80; z >= -132; z -= 8) [-3.6, 3.6].forEach(dx => { if (Math.abs(z + 95) < 12) return; const c = add(new THREE.ConeGeometry(0.8, 2.6, 12), hedge, dx, 1.3, z); C.circle(dx, z, 0.6); });
  for (let x = -45; x <= 45; x += 9) if (Math.abs(x) > 6) [-73, -67].forEach(z => { add(new THREE.SphereGeometry(0.7, 12, 10), hedge, x, 0.7, z); C.circle(x, z, 0.6); });
  // gece fenerleri yolların kenarında
  const lampPosts = [];
  [[0, -60], [0, -84], [0, -108], [0, -128], [-30, -70], [30, -70], [ROSE.x, 86], [ROSE.x + 26, 62], [SWAN.x + 10, 130], [ARENA.x + 32, ARENA.z], [FALCON.x + 8, -70], [HAMAM.x - 18, -20], [ARCH.x - 28, -10], [KITCHEN.x, 46], [160, 40], [175, 90]].forEach(([x, z]) => {
    add(new THREE.CylinderGeometry(0.07, 0.1, 3.4, 8), M.darkMetal, x + 2.4, 1.7, z); const h = add(new THREE.SphereGeometry(0.22, 12, 8), lampMat, x + 2.4, 3.55, z, root, false); h.userData.lamp = true; lampPosts.push(h); C.circle(x + 2.4, z, 0.2);
  });

  /* ================= toplu örnekler: çiçek, çalı, meyve ================= */
  {
    const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({roughness:0.55}), blooms.length);
    blooms.forEach(([x, y, z, c, s], i) => { m4.compose(L(x, y, z), q4.identity(), s4.setScalar(s)); bm.setMatrixAt(i, m4); bm.setColorAt(i, col.set(c)); });
    root.add(bm);
    const bu = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), windMat(new THREE.MeshStandardMaterial({roughness:0.8, flatShading:true}), 1.0, true), bushes.length);
    bushes.forEach(([x, y, z, r, hue], i) => { m4.compose(L(x, y, z), q4.setFromEuler(new THREE.Euler(rnd(), rnd() * 3, 0)), s4.set(r, r * 0.85, r)); bu.setMatrixAt(i, m4); bu.setColorAt(i, col.setHSL(hue || 0.28, 0.45, 0.18 + rnd() * 0.06)); });
    bu.castShadow = true; root.add(bu);
    root.updateMatrixWorld(true);
    const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({roughness:0.45}), fruits.length), v = L(0, 0, 0);
    fruits.forEach(([parent, x, y, z, c, _o, s], i) => { v.set(x, y, z); if (parent !== root) parent.localToWorld(v); m4.compose(v, q4.identity(), s4.setScalar(s || 0.1)); fm.setMatrixAt(i, m4); fm.setColorAt(i, col.set(c)); });
    root.add(fm);
  }

  /* ================= keşif, işaretler ================= */
  const found = () => S().notes.places || (S().notes.places = []);
  PLACES.forEach(p => markers.push({id:'yer-' + p.id, color:'#d4af37', label:p.name, x:p.x, z:p.z, minor:true, show:() => !!S().met && !found().includes(p.id) && near2.includes(p.id)}));
  let near2 = [];

  /* ================= güncelleme ================= */
  let capeDone = false;
  function update(dt, t, hero){
    heroRef = hero;
    root.visible = hero.zone !== 'ic';
    if (!capeDone && S().started){ capeDone = true; applyCape(); arch.best = S().notes.archery || 0; }
    if (!root.visible) return;
    const night = world.W.night, px = hero.pos.x, pz = hero.pos.z;
    winMat.emissiveIntensity = night * 1.8;
    lampPosts.forEach(l => l.material.color.setRGB(0.25 + night * 1.6, 0.2 + night * 1.0, 0.1 + night * 0.4));
    // keşif
    if (hero.zone == null && S().started){
      const f = found();
      for (const p of PLACES) if (!f.includes(p.id) && Math.hypot(px - p.x, pz - p.z) < p.r){
        f.push(p.id); hooks.sfx('quest'); hooks.ui.toast('Keşfedildi: ' + p.name + ' (' + f.length + '/' + PLACES.length + ')', 2800);
        if (f.length === PLACES.length) setTimeout(() => hooks.ui.toast('Lumière\'in bütün saray bahçelerini keşfettin! ⚜', 3600), 3000);
        hooks.save(); break;
      }
      near2 = PLACES.filter(p => !f.includes(p.id)).sort((a, b) => Math.hypot(a.x - px, a.z - pz) - Math.hypot(b.x - px, b.z - pz)).slice(0, 2).map(p => p.id);
    }
    updaters.forEach(fn => fn(dt, t, hero));
    // fıskiyeler (yakındakiler)
    for (const J of jets){
      if (Math.abs(J.x - px) + Math.abs(J.z - pz) > 130) continue;
      const {pos, vel, n} = J;
      for (let i = 0; i < n; i++){ vel[i * 3 + 1] -= 9.8 * dt; pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt; if (pos[i * 3 + 1] < J.water) J.reset(i); }
      J.geo.attributes.position.needsUpdate = true;
    }
    // kuğular
    feedT = Math.max(0, feedT - dt);
    swans.forEach((s, i) => {
      let tx, tz;
      if (feedT > 0){ tx = feedAt.x + Math.cos(i * 0.9) * (1.2 + i * 0.25); tz = feedAt.z + 0.6 + Math.abs(Math.sin(i * 1.3)) * 1.6; }
      else { s.a += dt * s.w; tx = SWAN.x + Math.cos(s.a) * s.rx; tz = SWAN.z + Math.sin(s.a) * s.rz; }
      const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz), sp = Math.min(d, dt * (feedT > 0 ? 1.6 : 0.9));
      if (d > 0.05){ s.x += dx / d * sp; s.z += dz / d * sp; world.turnToward(s.g, Math.atan2(dx, dz), Math.min(1, dt * 2)); }
      s.g.position.set(s.x, 0.02 + Math.sin(t * 1.5 + s.bob) * 0.03, s.z);
      s.g.rotation.z = Math.sin(t + s.bob) * 0.04;
    });
    // tavus kuşları
    const wnd = world.state.wind;
    peacocks.forEach((p, i) => {
      let moving = 0;
      p.nextShow -= dt;
      if (p.nextShow <= 0 && p.show <= 0){ p.show = 6 + rnd() * 5; p.nextShow = 18 + rnd() * 20; }
      if (p.show > 0){ p.show -= dt; p.spread = Math.min(1, p.spread + dt * 0.8); if (Math.hypot(px - p.g.position.x, pz - p.g.position.z) < 12) world.turnToward(p.g, Math.atan2(px - p.g.position.x, pz - p.g.position.z), Math.min(1, dt)); }
      else {
        p.spread = Math.max(0, p.spread - dt * 0.6);
        if (p.wait > 0) p.wait -= dt;
        else {
          if (!p.target){ p.ang += (rnd() - 0.5) * 1.2; p.rr = 2.5 + rnd() * 7; p.target = [SWAN.x + Math.cos(p.ang) * (SWAN.rx + p.rr), SWAN.z + Math.sin(p.ang) * (SWAN.rz + p.rr)]; }
          const dx = p.target[0] - p.g.position.x, dz = p.target[1] - p.g.position.z, d = Math.hypot(dx, dz);
          if (d < 0.2){ p.target = null; p.wait = 2 + rnd() * 5; }
          else { const s = Math.min(d, dt * 0.7); p.g.position.x += dx / d * s; p.g.position.z += dz / d * s; world.turnToward(p.g, Math.atan2(dx, dz), Math.min(1, dt * 4)); moving = 1; }
        }
      }
      p.phase += dt * 7 * moving;
      p.g.position.y = Math.abs(Math.sin(p.phase)) * 0.03;
      const sp = 0.12 + p.spread * 0.88;
      p.fan.rotation.x = -1.35 + p.spread * 1.15;
      p.fs.forEach((f, k) => { const a = (k / 20 - 0.5) * Math.PI * 1.15 * sp; f.rotation.z = a; f.scale.setScalar(0.85 + p.spread * 0.35); f.rotation.y = Math.sin(t * 9 + k) * 0.05 * p.spread * (0.5 + wnd); });
    });
    // binici: engellerin üstünde zıplar
    if (rider){
      const o = rider.obj; let y = 0;
      for (const [jx, jz] of rider.jumps){ const d = Math.hypot(o.position.x - jx, o.position.z - jz); if (d < 2.6) y = Math.max(y, Math.cos(d / 2.6 * Math.PI / 2) * 1.25); }
      o.position.y = y; o.rotation.x = 0;
      rider.rider.userData.armR.rotation.x = -0.6;
    }
    // şahinler
    falcons.forEach((f, i) => {
      f.a += dt * f.w;
      f.b.g.position.set(FALCON.x + Math.cos(f.a) * f.r, f.h + Math.sin(t * 0.4 + i) * 2, FALCON.z + Math.sin(f.a) * f.r);
      f.b.g.rotation.set(-Math.PI / 2 + 0.3, 0, 0); f.b.g.rotation.order = 'YXZ'; f.b.g.rotation.y = Math.PI - f.a; f.b.g.rotation.z = 0.35;
      f.b.wings.forEach((w, k) => { w.rotation.z = (k ? 1 : -1) * (0.15 + Math.sin(t * 3 + i) * 0.12); });
    });
    if (falconFlight){
      const F = falconFlight; F.t += dt;
      const g = F.b.g;
      if (!F.start){ F.parent = g.parent; F.start = g.getWorldPosition(L(0, 0, 0)); root.add(g); g.scale.setScalar(1.5); }
      const T = 14, k = F.t / T;
      if (k < 1){
        const a = k * Math.PI * 4, r = Math.sin(k * Math.PI) * 22, hgt = Math.sin(k * Math.PI) * 20;
        const tx = F.start.x + Math.sin(a) * r, tz = F.start.z - (1 - Math.cos(a)) * r * 0.5 + Math.sin(k * Math.PI) * 8, ty = F.start.y + hgt;
        const prev = g.position.clone(); g.position.set(tx, ty, tz);
        const dv = g.position.clone().sub(prev); g.rotation.order = 'YXZ'; g.rotation.set(-Math.PI / 2 + 0.3, Math.atan2(-dv.x, -dv.z), 0);
        F.b.wings.forEach((w, j) => { w.rotation.z = (j ? 1 : -1) * Math.sin(t * 14) * 0.7; });
      } else {
        F.parent.add(g); g.position.set(0, -0.48, 0.18); g.rotation.set(0, 0, 0); g.scale.setScalar(1.1); F.b.wings.forEach((w, j) => { w.rotation.z = (j ? 1 : -1) * -1.3; });
        falconFlight = null; hooks.ui.toast('Mistral eldivene döndü', 1800); hooks.sfx('coin');
      }
    }
    // rasathane kubbesi ve orrery
    if (obsDome) obsDome.rotation.y += dt * 0.05;
    orrery.forEach(o => { o.g.rotation.y += dt * o.w; });
    // hamam buharı
    if (steam && Math.abs(px - HAMAM.x) + Math.abs(pz - HAMAM.z) < 120){
      const {sp, sv, NS, reset} = steam;
      for (let i = 0; i < NS; i++){ sp[i * 3 + 1] += sv[i] * dt; sp[i * 3] += (0.3 + wnd) * dt * 0.6; if (sp[i * 3 + 1] > 4.5) reset(i); }
      steam.sg.attributes.position.needsUpdate = true;
    }
    // baca dumanı
    for (const S2 of smokes){
      if (Math.abs(px - S2.x) + Math.abs(pz - S2.z) > 140) continue;
      for (let i = 0; i < S2.n; i++){ S2.life[i] += dt * 0.18; if (S2.life[i] > 1){ S2.life[i] = 0; S2.p.set([S2.x + (rnd() - 0.5) * 0.4, S2.y, S2.z + (rnd() - 0.5) * 0.4], i * 3); }
        S2.p[i * 3] += (0.4 + wnd * 2.2) * dt; S2.p[i * 3 + 1] += 1.2 * dt; }
      S2.g.attributes.position.needsUpdate = true;
    }
    // ipekler rüzgârda
    if (Math.abs(px - SILK.x) + Math.abs(pz - SILK.z) < 100) cloths.forEach(c => {
      const p = c.m.geometry.attributes.position, b = c.base;
      for (let i = 0; i < p.count; i++){ const y = -b[i * 3 + 1]; p.setZ(i, Math.sin(t * 3 + c.ph + b[i * 3] * 2 + y) * 0.12 * y * (0.4 + wnd)); }
      p.needsUpdate = true;
    });
    // oklar ve bıçaklar
    for (let i = arch.flying.length - 1; i >= 0; i--){
      const F = arch.flying[i]; F.t += dt; const k = Math.min(1, F.t / F.dur);
      const pos = F.start.clone().lerp(F.end, k); pos.y += Math.sin(k * Math.PI) * (F.kind === 'ok' ? 1.6 : 0.3);
      const nxt = F.start.clone().lerp(F.end, Math.min(1, k + 0.02)); nxt.y += Math.sin(Math.min(1, k + 0.02) * Math.PI) * (F.kind === 'ok' ? 1.6 : 0.3);
      F.m.position.copy(pos);
      if (F.kind === 'ok'){ F.m.rotation.order = 'YZX'; F.m.rotation.set(0, Math.atan2(-(nxt.z - pos.z), nxt.x - pos.x), Math.atan2(nxt.y - pos.y, Math.hypot(nxt.x - pos.x, nxt.z - pos.z))); }
      else F.m.rotation.set(0, 0, -F.t * 18);
      if (k >= 1){
        arch.flying.splice(i, 1);
        if (F.kind !== 'ok') F.m.rotation.set(0, 0, 0.15);
        const pts = Math.max(0, 10 - Math.floor(F.rr / 0.085));
        hooks.sfx(pts >= 9 ? 'coin' : 'land');
        if (F.kind === 'ok'){
          arch.shots++; arch.score += pts;
          if (arch.shots >= 5){ arch.best = Math.max(arch.best || 0, arch.score); S().notes.archery = arch.best; hooks.ui.toast('Tur bitti: ' + arch.score + '/50 puan' + (arch.score >= 40 ? ' · Usta okçu!' : ''), 3200); hooks.save(); }
          else hooks.ui.toast((pts ? pts + ' puan' : 'Iska!') + ' · ok ' + arch.shots + '/5 · toplam ' + arch.score, 1600);
        } else { arch.knives++; hooks.ui.toast(pts >= 8 ? 'Tam isabet! ' + pts : pts ? pts + ' puan' : 'Tahtaya saplandı', 1500); }
      }
    }
  }

  /* ================= sabit parçaları birleştir (çizim çağrısı sayısını düşürür) ================= */
  {
    root.updateMatrixWorld(true);
    const buckets = new Map(), drop = [];
    const mergable = o => o.isMesh && !o.isInstancedMesh && o.geometry.attributes.uv;
    const bake = (g, mtx) => { g = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(mtx); Object.keys(g.attributes).forEach(k => { if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); }); return g; };
    // hareketli grup: kendi yerel uzayında birleştir (animasyonlu alt parçalar hariç)
    const mergeLocal = G => {
      const inv = G.matrixWorld.clone().invert(), local = new Map(), gone = [], m = new THREE.Matrix4();
      const visit = o => o.children.forEach(c => {
        if (c.userData.dyn){ mergeLocal(c); return; }
        if (c.userData.anim) return;
        if (mergable(c) && c.visible){ const k = c.material.uuid + '|' + c.castShadow; let b = local.get(k); if (!b){ b = {mat:c.material, cast:c.castShadow, geos:[]}; local.set(k, b); } b.geos.push(bake(c.geometry, m.multiplyMatrices(inv, c.matrixWorld))); gone.push(c); }
        visit(c);
      });
      visit(G);
      gone.forEach(o => o.parent.remove(o));
      local.forEach(b => { const mm = new THREE.Mesh(mergeBufferGeometries(b.geos), b.mat); mm.castShadow = b.cast; mm.receiveShadow = true; G.add(mm); b.geos.forEach(g => g.dispose()); });
    };
    const walk = o => {
      if (o.userData.dyn){ mergeLocal(o); return; }
      if (mergable(o)){
        const wp = o.getWorldPosition(L(0, 0, 0)), key = [o.material.uuid, o.castShadow, o.renderOrder, Math.floor(wp.x / 90), Math.floor(wp.z / 90)].join('|');
        let b = buckets.get(key); if (!b){ b = {mat:o.material, cast:o.castShadow, order:o.renderOrder, geos:[]}; buckets.set(key, b); }
        b.geos.push(bake(o.geometry, o.matrixWorld)); drop.push(o);
      }
      o.children.forEach(walk);
    };
    root.children.slice().forEach(walk);
    drop.forEach(o => o.parent.remove(o));
    buckets.forEach(b => {
      const m = new THREE.Mesh(mergeBufferGeometries(b.geos), b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.renderOrder = b.order; root.add(m);
      b.geos.forEach(g => g.dispose());
    });
  }

  // Bu modülün renkleri sRGB yazıldı; motorun doğrusal renk düzenine çevir (dünyadan paylaşılan malzemelere dokunma).
  const shared = new Set(Object.values(M)), done = new Set();
  const fix = m => { if (!m || shared.has(m) || done.has(m) || m.isMeshBasicMaterial || m.isPointsMaterial) return; done.add(m); if (m.color) m.color.convertSRGBToLinear(); };
  root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(fix); });
  if (rider) rider.obj.traverse(o => { if (o.material) fix(o.material); });
  return {root, interact, markers, update, places:PLACES, doors, archeryTargets:() => arch.targets.map(t => ({x:t.x, y:t.y, z:t.z, nx:-1, ny:0, nz:0, r:0.85}))};
}
