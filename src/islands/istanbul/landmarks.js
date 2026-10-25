// İstanbul simge yapıları: hepsi kodla üretilir (dış model/doku yok).
// Her yapı kendi grubunda gerçek ölçüyle (metre) kurulur; grup LANDMARK_SCALE ile küçültülür.
// Pencere, sütun, pilastr ve küçük kubbeler tek bir InstancedMesh havuzunda toplanır (az çizim çağrısı).
import { project, LANDMARK_SCALE } from './geo.js';

let S = LANDMARK_SCALE;   // o an kurulan yapının ölçeği (pos[id][3] ile değişir)
const TAU = Math.PI * 2;
const U = 5;   // taş dokusunun bir karosu = 5 m

/* ================= dokular ve malzemeler ================= */

// 256 px taş duvar: sıralı kesme taş ve derzler
function stoneTex(k){
  const [c, g] = k.kit.canvas(256, 256);
  g.fillStyle = '#8a8478'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++){
    for (let x = -16 + (r % 2) * 16; x < 256; x += 32){
      const v = 205 + ((k.rnd() * 32) | 0);
      g.fillStyle = 'rgb(' + v + ',' + (v - 4) + ',' + (v - 14) + ')';
      g.fillRect(x + 1, r * 32 + 1, 30, 30);
    }
  }
  for (let i = 0; i < 160; i++){
    g.fillStyle = 'rgba(70,60,45,' + (k.rnd() * 0.06) + ')';
    g.fillRect(k.rnd() * 256, k.rnd() * 256, 2 + k.rnd() * 10, 2 + k.rnd() * 6);
  }
  return k.kit.ctex(c, 1, 1);
}

// 256 px kiremit çatı: şaşırtmalı sıralar
function tileTex(k){
  const [c, g] = k.kit.canvas(256, 256);
  g.fillStyle = '#6e3524'; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++){
    for (let x = -8 + (r % 2) * 8; x < 256; x += 16){
      const v = (k.rnd() * 26) | 0;
      g.fillStyle = 'rgb(' + (176 + v) + ',' + Math.floor(88 + v / 2) + ',' + Math.floor(58 + v / 3) + ')';
      g.fillRect(x + 1, r * 16 + 1, 14, 13);
      g.fillStyle = 'rgba(60,25,15,0.35)'; g.fillRect(x + 1, r * 16 + 13, 14, 3);
    }
  }
  return k.kit.ctex(c, 1, 1);
}

// 128 px saat kadranı
function clockTex(k){
  const [c, g] = k.kit.canvas(128, 128);
  g.fillStyle = '#d8c48a'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#f6f1e2'; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fill();
  g.strokeStyle = '#2a2a2e'; g.lineWidth = 4; g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 12; i++){
    const a = i * TAU / 12, s = Math.sin(a), co = Math.cos(a);
    g.beginPath(); g.moveTo(64 + s * 46, 64 - co * 46); g.lineTo(64 + s * 54, 64 - co * 54); g.stroke();
  }
  g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(2.1) * 28, 64 - Math.cos(2.1) * 28); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.sin(0.4) * 42, 64 - Math.cos(0.4) * 42); g.stroke();
  return k.kit.ctex(c, 1, 1);
}

function makeMats(k){
  const T = k.THREE, tex = stoneTex(k);
  const st = (color) => new T.MeshStandardMaterial({color, map:tex, roughness:0.88});
  const pl = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({color, roughness:0.7}, o));
  return {
    cream:st(0xe9dfca), grey:st(0xcfcabd), ochre:st(0xd5a07a), pink:st(0xd6c6ab), white:st(0xf0ebdf), rock:st(0x8f897d),
    trim:pl(0xf2eadb), minaret:pl(0xf3eee3, {roughness:0.75}),
    lead:pl(0x7d878d, {roughness:0.45, metalness:0.35}), slate:pl(0x535c64, {roughness:0.55, metalness:0.2}),
    tile:new T.MeshStandardMaterial({color:0xffffff, map:tileTex(k), roughness:0.8}),
    win:pl(0x1e2832, {roughness:0.2, metalness:0.5}), iron:pl(0x2b2c30, {roughness:0.5, metalness:0.5}),
    clock:new T.MeshStandardMaterial({color:0xffffff, map:clockTex(k), roughness:0.5}),
    gold:k.kit.gold,
  };
}

/* ================= InstancedMesh havuzu ================= */

function makeReg(k){
  const T = k.THREE, M = k.M;
  const box = new T.BoxGeometry(1, 1, 1); box.translate(0, 0.5, 0);
  const cyl = new T.CylinderGeometry(1, 1, 1, 12); cyl.translate(0, 0.5, 0);
  const hemi = new T.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI / 2);
  return {
    win:{geo:box, mat:M.win, shadow:false, list:[]},     // pencere
    pil:{geo:box, mat:M.trim, shadow:true, list:[]},     // pilastr, söve
    col:{geo:cyl, mat:M.trim, shadow:true, list:[]},     // sütun
    dome:{geo:hemi, mat:M.lead, shadow:true, list:[]},   // küçük kurşun kubbe
  };
}

// grup yerel koordinatında bir örnek ekler (taban y'de, x/z merkez)
function ins(k, key, G, x, y, z, sx, sy, sz, ry = 0){
  k.q.setFromAxisAngle(k.up, ry); k.v.set(x, y, z); k.s.set(sx, sy, sz);
  k.reg[key].list.push(new k.THREE.Matrix4().compose(k.v, k.q, k.s).premultiply(G.matrixWorld));
}

function flush(k){
  k.root.updateMatrixWorld(true);
  const inv = k.root.matrixWorld.clone().invert();
  Object.keys(k.reg).forEach(key => {
    const r = k.reg[key];
    if (!r.list.length) return;
    const im = new k.THREE.InstancedMesh(r.geo, r.mat, r.list.length);
    r.list.forEach((m, i) => im.setMatrixAt(i, m.premultiply(inv)));
    im.castShadow = r.shadow; im.receiveShadow = true;
    im.frustumCulled = false;   // örnekler haritaya yayılı: kendi sınır küresi yanlış olur
    k.root.add(im);
  });
}

/* ================= küçük yardımcılar ================= */

function mkG(k, p, ry){
  const G = new k.THREE.Group();
  G.position.set(p[0], p[4] || 0, p[1]); G.rotation.y = p[2] ?? ry;   // p: [x, z, dönüş?, ölçek?, zemin yüksekliği?] G.scale.setScalar(S);
  k.root.add(G); G.updateMatrixWorld(true);
  return G;
}
const wp = (k, G, x, z) => k.kit.toWorld(G, x * S, z * S);
function cb(k, G, x, z, hw, hd){ const [wx, wz] = wp(k, G, x, z); k.C.box(wx, wz, hw * S, hd * S, G.rotation.y); }
function cc(k, G, x, z, r){ const [wx, wz] = wp(k, G, x, z); k.C.circle(wx, wz, r * S); }

// kutu: y = taban; yüzey başına doku ölçeği (derzler her yerde aynı boyda kalır)
function bx(k, G, w, h, d, mat, x, y, z, ry = 0){
  const g = new k.THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const f = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++){ const s = f[(i / 4) | 0]; uv.setXY(i, uv.getX(i) * s[0] / U, uv.getY(i) * s[1] / U); }
  const m = k.kit.add(g, mat, x, y + h / 2, z, G); m.rotation.y = ry; return m;
}
function cy(k, G, rt, rb, h, seg, mat, x, y, z){
  const g = new k.THREE.CylinderGeometry(rt, rb, h, seg), uv = g.attributes.uv, su = TAU * Math.max(rt, rb) / U, sv = h / U;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return k.kit.add(g, mat, x, y + h / 2, z, G);
}
function cone(k, G, r, h, seg, mat, x, y, z, ry = 0){
  const g = new k.THREE.ConeGeometry(r, h, seg); g.rotateY(ry);
  return k.kit.add(g, mat, x, y + h / 2, z, G);
}
function dome(k, G, r, mat, x, y, z, sy = 1, seg = 24){
  const g = new k.THREE.SphereGeometry(r, seg, Math.ceil(seg / 2), 0, TAU, 0, Math.PI / 2); g.scale(1, sy, 1);
  return k.kit.add(g, mat, x, y, z, G);
}
// yarım kubbe: yönü a (0 = +z) olan tarafa doğru şişer
function semi(k, G, r, mat, x, y, z, a){
  const g = new k.THREE.SphereGeometry(r, 20, 10, 0, Math.PI, 0, Math.PI / 2); g.rotateY(a);
  return k.kit.add(g, mat, x, y, z, G);
}
function ball(k, G, r, x, y, z){ return k.kit.add(new k.THREE.SphereGeometry(r, 8, 6), k.M.gold, x, y, z, G, false); }
// alem: altın çubuk ve küreler
function alem(k, G, x, y, z, h){
  k.kit.add(new k.THREE.CylinderGeometry(0.12, 0.18, h, 6), k.M.gold, x, y + h / 2, z, G, false);
  ball(k, G, 0.55, x, y + h * 0.45, z); ball(k, G, 0.35, x, y + h * 0.8, z);
}
// silindirin çevresine pencere dizisi
function ring(k, G, n, r, y, w, h, off = 0){
  for (let i = 0; i < n; i++){ const a = off + i * TAU / n; ins(k, 'win', G, Math.sin(a) * r, y, Math.cos(a) * r, w, h, 0.6, a); }
}
// doğru boyunca pencere sıraları: rows = [[y, genişlik, yükseklik], ...]
function wl(k, G, x1, z1, x2, z2, rows, sp, ry){
  const n = Math.max(1, Math.floor(Math.hypot(x2 - x1, z2 - z1) / sp));
  for (let i = 0; i < n; i++){
    const t = (i + 0.5) / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t;
    rows.forEach(r => ins(k, 'win', G, x, r[0], z, r[1], r[2], 0.6, ry));
  }
}
function pediment(k, G, w, h, mat, x, y, z){ return k.kit.add(k.kit.gableGeo(w, 1.6, h), mat, x, y, z, G); }

/* ================= minare ve şadırvan ================= */

// n şerefeli, kurşun külahlı minare (lathe gövde)
function minaret(k, G, x, z, h, r, n){
  const M = k.M, b = h * 0.16, pts = [[r * 1.25, b], [r, b + 1.5]];
  for (let i = 0; i < n; i++){
    const ys = h * (0.78 - 0.16 * (n - 1 - i));
    pts.push([r, ys - 1.2], [r * 1.75, ys - 0.4], [r * 1.8, ys + 0.9], [r * 1.55, ys + 0.9], [r * 1.55, ys + 0.2], [r, ys + 0.2]);
  }
  const top = h * 0.86;
  pts.push([r * 0.92, top]);
  bx(k, G, r * 3.2, b, r * 3.2, M.white, x, 0, z);
  k.kit.add(k.kit.lathe(pts, 12), M.minaret, x, 0, z, G);
  cone(k, G, r * 1.15, h - top, 12, M.lead, x, top, z);
  ball(k, G, r * 0.28, x, h, z);
  cc(k, G, x, z, r * 1.7);
}

function fountain(k, G, x, z){
  const M = k.M;
  cy(k, G, 4.0, 4.4, 1.2, 8, M.grey, x, 0, z);
  for (let i = 0; i < 8; i++){ const a = i * TAU / 8; cy(k, G, 0.22, 0.26, 3.6, 8, M.trim, x + Math.sin(a) * 3.3, 1.2, z + Math.cos(a) * 3.3); }
  cy(k, G, 4.3, 4.3, 0.5, 8, M.grey, x, 4.8, z);
  dome(k, G, 4.4, M.lead, x, 5.3, z, 0.75, 16);
  alem(k, G, x, 8.5, z, 1.6);
  cc(k, G, x, z, 4.4);
}

/* ================= cami iskeleti (Sultanahmet, Süleymaniye, Ayasofya) ================= */

// revaklı avlu: yan duvarlar ve ön duvar (ortada 9 m kapı boşluğu), üstü küçük kubbeler
function court(k, G, c){
  const M = k.M, cw = 6, zc = c.z0 + c.d / 2, sx = c.w / 2 - cw / 2;
  [-1, 1].forEach(sd => {
    bx(k, G, cw, c.h, c.d, c.wall, sd * sx, 0, zc); cb(k, G, sd * sx, zc, cw / 2, c.d / 2);
    const n = Math.round(c.d / 5.2);
    for (let i = 0; i < n; i++) ins(k, 'dome', G, sd * sx, c.h, c.z0 + (i + 0.5) * c.d / n, 2.5, 2.2, 2.5);
    for (let i = 0; i <= n; i++) ins(k, 'col', G, sd * (c.w / 2 - cw - 0.6), 0, c.z0 + i * c.d / n, 0.35, c.h - 0.6, 0.35);
  });
  const fw = (c.w - 9) / 2, zf = c.z0 + c.d - cw / 2;
  [-1, 1].forEach(sd => {
    const cx = sd * (4.5 + fw / 2);
    bx(k, G, fw, c.h, cw, c.wall, cx, 0, zf); cb(k, G, cx, zf, fw / 2, cw / 2);
    const n = Math.max(1, Math.round(fw / 5.2));
    for (let i = 0; i < n; i++) ins(k, 'dome', G, cx - fw / 2 + (i + 0.5) * fw / n, c.h, zf, 2.5, 2.2, 2.5);
  });
  fountain(k, G, 0, zc);
}

function mosque(k, G, o){
  const M = k.M, Y = o.bh + o.uh;
  bx(k, G, o.bw, o.bh, o.bd, o.wall, 0, 0, 0);
  bx(k, G, o.bw + 1, 0.8, o.bd + 1, M.trim, 0, o.bh - 0.4, 0);
  bx(k, G, o.uw, o.uh, o.ud, o.wall2, 0, o.bh, 0);
  cb(k, G, 0, 0, o.bw / 2, o.bd / 2);
  // orta kubbe: kasnak, pencereler, kurşun kubbe, alem
  cy(k, G, o.dr, o.dr + 0.4, o.dh, 28, o.wall2, 0, Y, 0);
  ring(k, G, o.nw, o.dr + 0.1, Y + 0.8, 1.1, o.dh - 1.6);
  dome(k, G, o.dr + 0.3, M.lead, 0, Y + o.dh, 0, o.dsy, 32);
  alem(k, G, 0, Y + o.dh + (o.dr + 0.3) * o.dsy - 0.2, 0, 3.4);
  // yarım kubbeler
  o.sem.forEach(s => semi(k, G, s.r, M.lead, Math.sin(s.a) * s.d, o.bh + 1, Math.cos(s.a) * s.d, s.a));
  // köşe kubbecikleri
  if (o.corner){
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      const x = sx * o.corner.c, z = sz * o.corner.c, r = o.corner.r;
      cy(k, G, r * 0.9, r * 0.95, 2.5, 12, o.wall2, x, o.bh, z);
      ins(k, 'dome', G, x, o.bh + 2.5, z, r, r * 0.9, r);
    }));
  }
  (o.bt || []).forEach(b => { bx(k, G, b.w, b.h, b.d, o.wall, b.x, 0, b.z); cb(k, G, b.x, b.z, b.w / 2, b.d / 2); });
  o.mins.forEach(m => minaret(k, G, m[0], m[1], m[2], m[3], m[4]));
  if (o.court) court(k, G, Object.assign({wall:o.wall}, o.court));
}

/* ================= yapılar ================= */

function buildKizKulesi(k, p){
  const M = k.M, T = k.THREE, G = mkG(k, p, 0), Y = 1.2;
  // kayalık ve taş kaide (suya inen)
  for (let i = 0; i < 9; i++){
    const a = i / 9 * TAU + k.rnd() * 0.4, rr = 12 + k.rnd() * 5, s = 3 + k.rnd() * 3.5;
    const g = new T.IcosahedronGeometry(s, 1); g.scale(1, 0.55, 1);
    k.kit.add(g, M.rock, Math.sin(a) * rr, -0.5, Math.cos(a) * rr, G);
  }
  cy(k, G, 13, 14.5, 6.8, 10, M.grey, 0, -6, 0);
  cy(k, G, 12.4, 12.4, 0.4, 10, M.cream, 0, 0.8, 0);
  // kule gövdesi, balkon, üst kat, fener
  cy(k, G, 4.2, 4.8, 10.5, 16, M.white, 0, Y, 0);
  cy(k, G, 5.6, 5.0, 0.9, 16, M.cream, 0, 11.7, 0);
  k.kit.add(k.kit.lathe([[5.1, 0], [5.6, 0], [5.6, 1], [5.1, 1], [5.1, 0]], 16), M.white, 0, 12.6, 0, G);
  cy(k, G, 3.6, 3.9, 5.2, 16, M.white, 0, 12.6, 0);
  cy(k, G, 4.4, 4.2, 0.7, 16, M.cream, 0, 17.8, 0);
  cy(k, G, 2.5, 2.7, 3.2, 12, M.white, 0, 18.5, 0);
  dome(k, G, 3.0, M.lead, 0, 21.7, 0, 0.95, 16);
  alem(k, G, 0, 24.4, 0, 2.2);
  ring(k, G, 6, 4.5, 5.5, 0.9, 2.2);
  ring(k, G, 8, 3.8, 14.0, 0.9, 2.6, 0.2);
  ring(k, G, 8, 2.62, 19.2, 0.8, 2.0, 0.4);
  // yan bina: kiremit beşik çatılı
  bx(k, G, 7, 4.2, 4.4, M.white, 7.5, Y, 2);
  const gr = k.kit.add(k.kit.gableGeo(5.2, 7.6, 2.2), M.tile, 7.5, Y + 4.2, 2, G); gr.rotation.y = Math.PI / 2;
  ins(k, 'win', G, 7.5, Y + 1.2, 4.3, 1, 1.8, 0.6, 0);
  cc(k, G, 0, 0, 13);
}

function buildDolmabahce(k, p){
  const M = k.M, T = k.THREE, G = mkG(k, p, 1.75), Y = 0.9;
  bx(k, G, 296, Y, 66, M.grey, 0, 0, 4);
  // [x, genişlik, derinlik, yükseklik]: kanatlar, orta salon, uç ve ara köşkler
  const blocks = [[-83, 114, 36, 18], [83, 114, 36, 18], [0, 52, 52, 22], [-130, 24, 42, 21], [130, 24, 42, 21], [-68, 18, 40, 20], [68, 18, 40, 20]];
  blocks.forEach(b => {
    const [x, w, d, h] = b;
    bx(k, G, w, h, d, M.cream, x, Y, 0);
    bx(k, G, w + 1.4, 1.4, d + 1.4, M.trim, x, Y + h - 0.7, 0);
    bx(k, G, w - 1, 0.5, d - 1, M.lead, x, Y + h + 0.7, 0);
    cb(k, G, x, 0, w / 2, d / 2);
  });
  // Muayede Salonu kubbesi
  cy(k, G, 13, 13.4, 6, 24, M.cream, 0, Y + 22.5, -2);
  ring(k, G, 20, 13.1, Y + 23.3, 1.2, 3.6);
  dome(k, G, 13.6, M.lead, 0, Y + 28.5, -2, 0.95, 32);
  alem(k, G, 0, Y + 28.5 + 12.7, -2, 3.4);
  // orta revak: 8 sütun, arşitrav, alınlık
  for (let i = 0; i < 8; i++){
    const x = -21 + i * 6;
    ins(k, 'col', G, x, Y, 32, 1.05, 14, 1.05);
    bx(k, G, 3, 0.7, 3, M.trim, x, Y + 14, 32);
    cc(k, G, x, 32, 1.3);
  }
  bx(k, G, 48, 3.2, 8, M.trim, 0, Y + 14.7, 29);
  pediment(k, G, 48, 6, M.trim, 0, Y + 17.9, 32.5);
  // pilastrlı cepheler ve pencereler
  const bays = (x0, x1, zf, H) => {
    const n = Math.max(1, Math.round((x1 - x0) / 5.4)), sp = (x1 - x0) / n;
    for (let i = 0; i <= n; i++){
      ins(k, 'pil', G, x0 + i * sp, Y, zf + 0.4, 1.3, H - 0.2, 1.0);
      ins(k, 'pil', G, x0 + i * sp, Y, -zf - 0.4, 1.3, H - 0.2, 1.0);
    }
    for (let i = 0; i < n; i++){
      const cx = x0 + (i + 0.5) * sp;
      ins(k, 'win', G, cx, Y + 1.8, zf, 1.7, 4.0, 0.6, 0); ins(k, 'win', G, cx, Y + 8.8, zf, 1.7, 6.0, 0.6, 0);
      ins(k, 'win', G, cx, Y + 1.8, -zf, 1.7, 4.0, 0.6, Math.PI); ins(k, 'win', G, cx, Y + 8.8, -zf, 1.7, 6.0, 0.6, Math.PI);
    }
  };
  [-1, 1].forEach(sd => {
    const a = (x0, x1, zf, H) => bays(Math.min(sd * x0, sd * x1), Math.max(sd * x0, sd * x1), zf, H);
    a(141, 119, 21, 21); a(76, 60, 20, 20); a(117, 78, 18, 18); a(58, 27, 18, 18);
    [130, 68].forEach(x => pediment(k, G, x === 130 ? 22 : 16, 3.5, M.trim, sd * x, Y + (x === 130 ? 21 : 20) + 0.9, x === 130 ? 21.2 : 20.2));
  });
  bays(-25, 25, 26, 22);
  // anıtsal kapı sütunları
  [-9, 9].forEach(x => {
    bx(k, G, 3, 11, 3, M.trim, x, 0, 48); bx(k, G, 3.8, 0.8, 3.8, M.cream, x, 11, 48);
    ball(k, G, 0.95, x, 12.4, 48); cc(k, G, x, 48, 1.9);
  });
  // saat kulesi
  const tx = -172, tz = 14;
  bx(k, G, 8.4, 9, 8.4, M.cream, tx, 0, tz); bx(k, G, 9.2, 0.8, 9.2, M.trim, tx, 9, tz);
  bx(k, G, 6.6, 9.6, 6.6, M.cream, tx, 9.8, tz); bx(k, G, 7.4, 0.8, 7.4, M.trim, tx, 19.4, tz);
  bx(k, G, 6.6, 6.6, 6.6, M.cream, tx, 20.2, tz);
  [0, 1, 2, 3].forEach(i => {
    const a = i * Math.PI / 2, f = k.kit.add(new T.CircleGeometry(2.4, 20), M.clock, tx + Math.sin(a) * 3.35, 23.5, tz + Math.cos(a) * 3.35, G, false);
    f.rotation.y = a;
    ins(k, 'win', G, tx + Math.sin(a) * 2.9, 28.2, tz + Math.cos(a) * 2.9, 1.8, 2.4, 0.6, a);
  });
  bx(k, G, 7.4, 0.8, 7.4, M.trim, tx, 26.8, tz);
  bx(k, G, 5.6, 3.8, 5.6, M.cream, tx, 27.6, tz); bx(k, G, 6.4, 0.7, 6.4, M.trim, tx, 31.4, tz);
  cone(k, G, 4.6, 7.5, 4, M.lead, tx, 32.1, tz, Math.PI / 4);
  ball(k, G, 0.5, tx, 40.1, tz);
  cb(k, G, tx, tz, 4.3, 4.3);
}

function buildTopkapi(k, p){
  const M = k.M, T = k.THREE, G = mkG(k, p, -0.68);
  // iki ayak ve geçit üstü kütle (geçit 6 m açık kalır)
  [-1, 1].forEach(sd => {
    bx(k, G, 6, 15, 10, M.grey, sd * 6, 0, 0); cb(k, G, sd * 6, 0, 3, 5);
    // sekizgen kuleler ve sivri külahlar
    const tx = sd * 14;
    cy(k, G, 5.2, 5.6, 20, 8, M.grey, tx, 0, 0);
    cy(k, G, 6.3, 6.1, 1.0, 8, M.cream, tx, 18, 0);
    cone(k, G, 7.0, 12, 8, M.lead, tx, 19, 0);
    ball(k, G, 0.6, tx, 31.4, 0);
    [8, 13].forEach((y, i) => ring(k, G, 8, 5.4, y, 0.7, 2.0, i * 0.4));
    cc(k, G, tx, 0, 5.8);
    // sur kanatları
    bx(k, G, 22, 9, 4, M.grey, sd * 30, 0, 0); bx(k, G, 22.6, 0.8, 4.6, M.cream, sd * 30, 9, 0); cb(k, G, sd * 30, 0, 11, 2);
  });
  bx(k, G, 12, 8.5, 10, M.grey, 0, 6.5, 0);
  bx(k, G, 28, 1.2, 11.4, M.cream, 0, 15, 0);
  const gr = k.kit.add(k.kit.gableGeo(10.6, 12.4, 3.2), M.tile, 0, 16.2, 0, G); gr.rotation.y = Math.PI / 2;
  // sivri kemerli giriş, kitabe
  [1, -1].forEach(f => {
    const sh = (w, h0, h1, h2) => { const s = new T.Shape(); s.moveTo(-w, h0); s.lineTo(-w, h1); s.quadraticCurveTo(-w, h2 - 2, 0, h2); s.quadraticCurveTo(w, h2 - 2, w, h1); s.lineTo(w, h0); s.closePath(); return new T.ExtrudeGeometry(s, {depth:0.25, bevelEnabled:false}); };
    const fr = k.kit.add(sh(3.9, 6.5, 7.5, 11.6), M.trim, 0, 0, f > 0 ? 5.02 : -5.27, G);
    const dk = k.kit.add(sh(3.0, 6.5, 7.5, 10.8), M.win, 0, 0, f > 0 ? 5.25 : -5.5, G);
    if (f < 0){ fr.rotation.y = 0; dk.rotation.y = 0; }
    bx(k, G, 6, 1.4, 0.3, M.gold, 0, 11.8, f * 5.2);
  });
  [-1, 1].forEach(sd => ins(k, 'col', G, sd * 4.2, 0, 5.5, 0.45, 6.4, 0.45));
}

function buildGalata(k, p){
  const M = k.M, G = mkG(k, p, 0);
  cy(k, G, 9.0, 9.6, 1.2, 20, M.grey, 0, 0, 0);
  cy(k, G, 7.9, 8.6, 44, 24, M.grey, 0, 1.2, 0);
  [12, 24, 36].forEach(y => cy(k, G, 8.3, 8.3, 0.5, 24, M.cream, 0, y, 0));
  [[10, 4], [18, 4], [26, 4], [34, 4], [41, 6]].forEach((l, i) => ring(k, G, l[1], 8.35 - l[0] * 0.016, l[0], 0.7, 1.7, i * 0.5));
  // balkon: konsollu kasnak, döşeme, korkuluk
  cy(k, G, 10.2, 8.0, 2.0, 24, M.grey, 0, 44.2, 0);
  cy(k, G, 10.4, 10.4, 0.5, 24, M.cream, 0, 46.2, 0);
  k.kit.add(k.kit.lathe([[9.7, 0], [10.3, 0], [10.3, 1.2], [9.7, 1.2], [9.7, 0]], 24), M.cream, 0, 46.7, 0, G);
  // üst gövde, saçak ve konik kurşun çatı
  cy(k, G, 7.4, 7.6, 8.5, 20, M.cream, 0, 46.7, 0);
  ring(k, G, 8, 7.45, 49.3, 1.0, 2.6);
  cy(k, G, 8.2, 7.6, 0.8, 20, M.trim, 0, 55.2, 0);
  cone(k, G, 8.4, 12, 20, M.lead, 0, 56, 0);
  alem(k, G, 0, 67.6, 0, 3.0);
  cc(k, G, 0, 0, 9.8);
}

function buildHaydarpasa(k, p){
  const M = k.M, G = mkG(k, p, -1.3), Y = 1;
  const rows = [[Y + 1.2, 1.6, 3.6], [Y + 6, 1.6, 3.6], [Y + 10.8, 1.6, 3.4]];
  // U planı: arka gövde ve denize uzanan iki kanat
  bx(k, G, 98, Y, 30, M.grey, 0, 0, 0); [-1, 1].forEach(sd => bx(k, G, 26, Y - 0.05, 74, M.grey, sd * 37, 0, 22));
  bx(k, G, 94, 17, 26, M.pink, 0, Y, 0);
  [-1, 1].forEach(sd => bx(k, G, 22, 17.4, 69.5, M.pink, sd * 37, Y, 22.25));
  bx(k, G, 98, 1.2, 30, M.trim, 0, Y + 16.8, 0);
  [-1, 1].forEach(sd => bx(k, G, 26, 1.2, 74, M.trim, sd * 37, Y + 17, 22));
  k.kit.add(k.kit.frustum(96, 28, 7, 5), M.slate, 0, Y + 18 + 3.5, 0, G);
  [-1, 1].forEach(sd => k.kit.add(k.kit.frustum(24, 72, 7, 5), M.slate, sd * 37, Y + 18.2 + 3.5, 22, G));
  cb(k, G, 0, 0, 47, 13); [-1, 1].forEach(sd => cb(k, G, sd * 37, 22.25, 11, 34.75));
  // köşe kuleleri: dört köşe, sivri piramit çatı
  [[-1, -10.5], [1, -10.5], [-1, 55.5], [1, 55.5]].forEach(t => {
    const x = t[0] * 46.5, z = t[1];
    bx(k, G, 9, 27, 9, M.pink, x, Y, z); bx(k, G, 10, 1, 10, M.trim, x, Y + 26, z);
    cone(k, G, 7.5, 10, 4, M.slate, x, Y + 27, z, Math.PI / 4); ball(k, G, 0.5, x, Y + 37.4, z);
    [0, 1, 2, 3].forEach(i => { const a = i * Math.PI / 2; ins(k, 'win', G, x + Math.sin(a) * 4.5, Y + 18, z + Math.cos(a) * 4.5, 1.4, 3.2, 0.6, a); });
    cb(k, G, x, z, 4.8, 4.8);
  });
  // ana giriş (avluya bakan)
  bx(k, G, 15, 12, 4.5, M.trim, 0, Y, 15.25); cb(k, G, 0, 15.25, 7.5, 2.25);
  bx(k, G, 5, 7, 0.4, M.win, 0, Y + 0.5, 17.6);
  pediment(k, G, 16, 3.5, M.trim, 0, Y + 12, 15.8);
  [-6.2, 6.2].forEach(x => ins(k, 'col', G, x, Y, 18, 0.6, 11, 0.6));
  // pencereler
  wl(k, G, -26, 13, -9.5, 13, rows, 4.2, 0); wl(k, G, 9.5, 13, 26, 13, rows, 4.2, 0);
  wl(k, G, -44, -13, 44, -13, rows, 4.2, Math.PI);
  wl(k, G, -26, 15, -26, 54, rows, 4.2, Math.PI / 2); wl(k, G, 26, 15, 26, 54, rows, 4.2, -Math.PI / 2);
  wl(k, G, -48, -7, -48, 50, rows, 4.2, -Math.PI / 2); wl(k, G, 48, -7, 48, 50, rows, 4.2, Math.PI / 2);
  wl(k, G, -46, 57, -29, 57, rows, 4.2, 0); wl(k, G, 29, 57, 46, 57, rows, 4.2, 0);
}

function buildSultanahmet(k, p){
  const M = k.M, G = mkG(k, p, -2.35);
  mosque(k, G, {
    bw:60, bd:60, bh:17, uw:40, ud:40, uh:9, dr:11.8, dh:4.5, dsy:0.95, nw:24, wall:M.grey, wall2:M.grey,
    sem:[0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => ({a, d:20, r:10})),
    corner:{c:23, r:4.4},
    mins:[[-31, -31, 64, 1.55, 3], [31, -31, 64, 1.55, 3], [-31, 31, 64, 1.55, 3], [31, 31, 64, 1.55, 3], [-28.5, 79, 50, 1.45, 2], [28.5, 79, 50, 1.45, 2]],
    court:{w:57, d:50, z0:30, h:6.5},
  });
}

function buildSuleymaniye(k, p){
  const M = k.M, G = mkG(k, p, -2.5);
  mosque(k, G, {
    bw:62, bd:62, bh:20, uw:36, ud:36, uh:9, dr:13.2, dh:5, dsy:0.95, nw:24, wall:M.cream, wall2:M.cream,
    sem:[{a:0, d:19, r:12}, {a:Math.PI, d:19, r:12}, {a:Math.PI / 2, d:22, r:9}, {a:-Math.PI / 2, d:22, r:9}],
    corner:{c:24, r:4.6},
    mins:[[-33, 31, 72, 1.7, 3], [33, 31, 72, 1.7, 3], [-29, 77, 58, 1.5, 2], [29, 77, 58, 1.5, 2]],
    court:{w:58, d:46, z0:31, h:7},
  });
}

function buildAyasofya(k, p){
  const M = k.M, G = mkG(k, p, 0.75);
  const bt = [];
  [-27, -9, 9, 27].forEach(x => [-1, 1].forEach(sz => bt.push({x, z:sz * 37, w:7, d:10, h:30})));
  mosque(k, G, {
    bw:70, bd:64, bh:26, uw:44, ud:44, uh:10, dr:15.6, dh:5.5, dsy:0.55, nw:40, wall:M.ochre, wall2:M.ochre,
    sem:[{a:Math.PI / 2, d:22, r:14}, {a:-Math.PI / 2, d:22, r:14}],
    bt,
    mins:[[-42, -26, 56, 1.8, 2], [-42, 26, 56, 1.8, 2], [42, -26, 60, 1.8, 2], [42, 26, 60, 1.8, 2]],
  });
}

/* ================= dışa aktarılan işlev ================= */

export function buildLandmarks(ctx, pos){
  const T = ctx.THREE;
  const k = {THREE:T, kit:ctx.kit, C:ctx.C, root:ctx.root, rnd:ctx.rnd, q:new T.Quaternion(), v:new T.Vector3(), s:new T.Vector3(), up:new T.Vector3(0, 1, 0)};
  k.M = makeMats(k); k.reg = makeReg(k);
  // [kimlik, enlem, boylam, kurucu, ad, keşif yarıçapı]
  const list = [
    ['kizkulesi', 41.0212, 29.0041, buildKizKulesi, 'Kız Kulesi', 45],
    ['dolmabahce', 41.0391, 29.0003, buildDolmabahce, 'Dolmabahçe Sarayı', 90],
    ['topkapi', 41.0115, 28.9833, buildTopkapi, 'Topkapı Sarayı', 40],
    ['galata', 41.0256, 28.9741, buildGalata, 'Galata Kulesi', 35],
    ['haydarpasa', 41.0003, 29.0189, buildHaydarpasa, 'Haydarpaşa Garı', 80],
    ['sultanahmet', 41.0054, 28.9768, buildSultanahmet, 'Sultanahmet Camii', 70],
    ['suleymaniye', 41.0161, 28.9640, buildSuleymaniye, 'Süleymaniye Camii', 70],
    ['ayasofya', 41.0086, 28.9802, buildAyasofya, 'Ayasofya', 65],
  ];
  // pos[id] = [x, z, dönüş?, ölçek?]; pos verilip id verilmezse o yapı kurulmaz
  list.forEach(([id, lat, lon, fn, name, r]) => {
    const p = pos ? pos[id] : project(lat, lon);
    if (!p) return;
    S = p[3] ?? LANDMARK_SCALE;
    try { fn(k, p); } catch (e) { console.warn('[istanbul] ' + id + ' kurulamadı', e); return; }
    ctx.place({id, name, x:p[0], z:p[1], r:Math.max(14, r * S / LANDMARK_SCALE)});
  });
  S = LANDMARK_SCALE;
  flush(k);
}
