// Şatonun içi: giriş holü ve büyük merdiven, balo ve müzik salonu (zemin kat),
// Aynalı Galeri ve kontesin yatak odası (1. kat), kütüphane (2. kat), kubbe rasathanesi (3. kat).
// İç mekân dış dünyadan ayrı bir bölgede (yerin altında) kurulur; kapıdan geçince oraya ışınlanılır.
import { Collision } from './game/collision.js';

export const IN = {x:0, y:-80, z:-40};

export function buildInterior(world, hooks){
  const { THREE, scene, materials:M } = world;
  const O = IN;
  const root = new THREE.Group(); root.name = 'SatoIci'; root.position.set(O.x, O.y, O.z); root.visible = false; scene.add(root);
  const C = new Collision(); C.base = O.y;
  let seed = 31; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const interact = [], markers = [], coins = [], spinners = [], flames = [], fires = [], lights = [];

  /* ================= yardımcılar ================= */
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function ctex(c, rx = 1, ry = 1, srgb = true){ const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  function loadT(path, rep){ const t = world.texLoader.load('assets/' + path); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; return t; }
  function add(geo, mat, x, y, z, parent = root, cast = false){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  const col = (o, y0, y1, low) => { o.y0 = O.y + y0; o.y1 = O.y + y1; if (low) o.low = true; return o; };
  const rectC = (x0, z0, x1, z1, y0, y1, low) => col(C.rect(O.x + Math.min(x0, x1), O.z + Math.min(z0, z1), O.x + Math.max(x0, x1), O.z + Math.max(z0, z1)), y0, y1, low);
  const circC = (x, z, r, y0, y1, low) => col(C.circle(O.x + x, O.z + z, r), y0, y1, low);
  function uvBox(geo, w, h, d, s){
    const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
  }

  /* ================= malzemeler ================= */
  function damask(base, ink){
    const [c, g] = canvas(256, 256); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
    g.fillStyle = ink;
    const motif = (x, y, k) => {
      g.save(); g.translate(x, y); g.scale(k, k);
      g.beginPath(); g.moveTo(0, -44); g.bezierCurveTo(28, -26, 26, 14, 0, 44); g.bezierCurveTo(-26, 14, -28, -26, 0, -44); g.fill();
      [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 30, 6, 9, 22, s * 0.55, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(s * 18, -34, 6, 12, -s * 0.7, 0, Math.PI * 2); g.fill(); });
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(0, 0, 7, 16, 0, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = 'source-over';
      g.restore();
    };
    [[64, 64], [192, 192]].forEach(([x, y]) => motif(x, y, 1));
    [[192, 64], [64, 192]].forEach(([x, y]) => { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore(); });
    [[0, 0], [256, 0], [0, 256], [256, 256], [128, 128]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); });
    return c;
  }
  const wallMat = (base, ink, rough = 0.85) => new THREE.MeshStandardMaterial({map:ctex(damask(base, ink)), roughness:rough});
  const wHall = wallMat('#efe5cf', 'rgba(190,156,84,.55)');
  const wRed = wallMat('#741a22', 'rgba(214,170,90,.42)');
  const wBlue = wallMat('#2a4365', 'rgba(222,204,150,.36)');
  const wRose = wallMat('#c9a29d', 'rgba(255,242,232,.5)');
  const wGreen = wallMat('#2d4835', 'rgba(210,182,112,.36)');
  const wGold = wallMat('#eadcbc', 'rgba(186,146,66,.72)', 0.6);
  const panel = new THREE.MeshStandardMaterial({color:0xe2dccf, roughness:0.6});
  const cream = new THREE.MeshStandardMaterial({color:0xfbf6ea, roughness:0.6});
  const gold = new THREE.MeshStandardMaterial({color:0xd4af37, metalness:1, roughness:0.28});
  const darkWood = new THREE.MeshStandardMaterial({color:0x3a2416, roughness:0.55});
  const wood = new THREE.MeshStandardMaterial({color:0x6b4428, roughness:0.5});
  const marble = new THREE.MeshStandardMaterial({color:0xece6dc, roughness:0.22});
  const velvetR = new THREE.MeshStandardMaterial({color:0x8e1424, roughness:0.9});
  const velvetB = new THREE.MeshStandardMaterial({color:0x223e7a, roughness:0.9});
  const linen = new THREE.MeshStandardMaterial({color:0xf6f1e6, roughness:0.95});
  const mirrorMat = new THREE.MeshStandardMaterial({color:0xe6e6e6, metalness:1, roughness:0.03, envMapIntensity:1.4});
  // Pencere camı: dış dünyanın küp haritası (main.js şatonun yerinden çekip verir), bakış yönünde örneklenir
  const winMat = new THREE.MeshBasicMaterial({color:0xddeeff, combine:THREE.MultiplyOperation, reflectivity:1, refractionRatio:0.985});
  let envReady = false;
  const flameMat = new THREE.MeshBasicMaterial({color:new THREE.Color(2.2, 1.35, 0.5)});
  const fireMat = new THREE.MeshBasicMaterial({color:new THREE.Color(1.7, 0.6, 0.12), transparent:true, opacity:0.9, depthWrite:false});
  const marbleFloor = new THREE.MeshStandardMaterial({map:loadT('textures/mermer_dama.jpg', 1 / 3), color:0xc9c4bc, roughness:0.2, envMapIntensity:0.5});
  const parquet = new THREE.MeshStandardMaterial({map:loadT('textures/ahsap.jpg', 0.45), color:0xa8794c, roughness:0.4, envMapIntensity:0.5});
  const ceilMat = new THREE.MeshStandardMaterial({color:0xd8d1c2, roughness:0.95, side:THREE.BackSide});
  // tavan freski: gökyüzü, bulutlar, altın çerçeve
  const fresco = (() => {
    const [c, g] = canvas(1024, 1024);
    const gr = g.createRadialGradient(512, 512, 60, 512, 512, 700); gr.addColorStop(0, '#fff3d8'); gr.addColorStop(0.35, '#a9c9ec'); gr.addColorStop(1, '#4d79b8');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 70; i++){
      const x = rnd() * 1024, y = rnd() * 1024, r = 40 + rnd() * 110;
      const cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, 'rgba(255,250,240,.75)'); cg.addColorStop(1, 'rgba(255,250,240,0)');
      g.fillStyle = cg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = '#c9a240'; g.lineWidth = 34; g.strokeRect(17, 17, 990, 990);
    g.strokeStyle = '#8a6a22'; g.lineWidth = 6; g.strokeRect(46, 46, 932, 932);
    return new THREE.MeshStandardMaterial({map:ctex(c, 1 / 14, 1 / 18), color:0xd9d4cc, roughness:0.95, side:THREE.BackSide});
  })();
  fresco.map.offset.set(0.5, 0.5);

  /* ================= duvarlar ================= */
  const T = 0.3;
  function seg(ax, az, bx, bz, y0, h, mat, deco = true){
    const alongX = az === bz, len = alongX ? Math.abs(bx - ax) : Math.abs(bz - az);
    if (len < 0.01) return;
    const w = alongX ? len : T, d = alongX ? T : len;
    const g = new THREE.BoxGeometry(w, h, d); uvBox(g, w, h, d, 1.6);
    add(g, mat, (ax + bx) / 2, y0 + h / 2, (az + bz) / 2);
    if (deco && h > 2.5){
      add(new THREE.BoxGeometry(alongX ? w : T + 0.08, 1.1, alongX ? T + 0.08 : d), panel, (ax + bx) / 2, y0 + 0.55, (az + bz) / 2);
      add(new THREE.BoxGeometry(alongX ? w : T + 0.1, 0.06, alongX ? T + 0.1 : d), gold, (ax + bx) / 2, y0 + 1.12, (az + bz) / 2);
      add(new THREE.BoxGeometry(alongX ? w : T + 0.18, 0.26, alongX ? T + 0.18 : d), cream, (ax + bx) / 2, y0 + h - 0.13, (az + bz) / 2);
    }
    rectC(Math.min(ax, bx) - (alongX ? 0 : T / 2), Math.min(az, bz) - (alongX ? T / 2 : 0), Math.max(ax, bx) + (alongX ? 0 : T / 2), Math.max(az, bz) + (alongX ? T / 2 : 0), y0, y0 + h);
  }
  /** axis 'x': z = c sabit, x = u0..u1 boyunca; 'z': x = c sabit. gaps: [[u0, u1, kapıYüksekliği]] */
  function wall(axis, c, u0, u1, y0, h, mat, gaps = []){
    const P = (u, v) => axis === 'x' ? [u, c, v] : [c, u, v];
    let cur = u0;
    gaps.slice().sort((a, b) => a[0] - b[0]).forEach(([g0, g1, gh]) => {
      if (g0 > cur){ const [ax, az] = P(cur), [bx, bz] = P(g0); seg(ax, az, bx, bz, y0, h, mat); }
      const [ax, az] = P(g0), [bx, bz] = P(g1);
      seg(ax, az, bx, bz, y0 + gh, h - gh, mat, false);
      // altın kapı pervazı
      const mid = (g0 + g1) / 2, [mx, mz] = P(mid);
      add(new THREE.BoxGeometry(axis === 'x' ? g1 - g0 + 0.3 : T + 0.12, 0.18, axis === 'x' ? T + 0.12 : g1 - g0 + 0.3), gold, mx, y0 + gh + 0.09, mz);
      [g0, g1].forEach(u => { const [jx, jz] = P(u); add(new THREE.BoxGeometry(axis === 'x' ? 0.14 : T + 0.12, gh, axis === 'x' ? T + 0.12 : 0.14), cream, jx, y0 + gh / 2, jz); });
      cur = g1;
    });
    if (u1 > cur){ const [ax, az] = P(cur), [bx, bz] = P(u1); seg(ax, az, bx, bz, y0, h, mat); }
  }

  /* ================= döşemeler ve tavanlar ================= */
  function shapeOf(sh){
    const s = new THREE.Shape();
    if (sh.rect){ const [x0, z0, x1, z1] = sh.rect; s.moveTo(x0, -z0); s.lineTo(x1, -z0); s.lineTo(x1, -z1); s.lineTo(x0, -z1); s.closePath(); }
    else { const [cx, cz, r] = sh.circle; s.absarc(cx, -cz, r, 0, Math.PI * 2, false); }
    return s;
  }
  function holeOf(h){
    const p = new THREE.Path();
    if (h.rect){ const [x0, z0, x1, z1] = h.rect; p.moveTo(x0, -z0); p.lineTo(x0, -z1); p.lineTo(x1, -z1); p.lineTo(x1, -z0); p.closePath(); }
    else { const [cx, cz, r] = h.circle; p.absarc(cx, -cz, r, 0, Math.PI * 2, true); }
    return p;
  }
  function inside(sh, x, z){
    if (sh.rect){ const [x0, z0, x1, z1] = sh.rect; return x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && z >= Math.min(z0, z1) && z <= Math.max(z0, z1); }
    const [cx, cz, r] = sh.circle; return Math.hypot(x - cx, z - cz) <= r;
  }
  function slab(sh, y, topMat, botMat, holes = [], walk = true){
    const s = shapeOf(sh); holes.forEach(h => s.holes.push(holeOf(h)));
    const g = new THREE.ShapeGeometry(s, 48); g.rotateX(-Math.PI / 2);
    if (topMat) add(g, topMat, 0, y, 0);
    if (botMat) add(g, botMat, 0, y - 0.3, 0);
    if (walk) C.heightFns.push((x, z) => {
      const lx = x - O.x, lz = z - O.z;
      if (!inside(sh, lx, lz)) return null;
      for (const h of holes) if (inside(h, lx, lz)) return null;
      return O.y + y;
    });
  }
  // zemin kat
  slab({rect:[-7, -9, 7, 9]}, 0, marbleFloor, null);
  slab({rect:[-31, -7, -7, 7]}, 0, parquet, null);
  slab({rect:[7, -7, 31, 7]}, 0, parquet, null);
  // 1. kat: hol üstünde kuzey balkonu, kanatlarda tam kat
  slab({rect:[-7, -9, 7, -4.2]}, 5, parquet, ceilMat);
  slab({rect:[-31, -7, -7, 7]}, 5, parquet, ceilMat);
  slab({rect:[7, -7, 31, 7]}, 5, parquet, ceilMat);
  // 2. kat (kütüphane): doğu merdiven boşluğu ve döner merdiven deliği; altı freskli tavan
  const SP = {cx:0, cz:0, r0:0.3, r1:1.95};
  slab({rect:[-7, -9, 7, 9]}, 10, parquet, fresco, [{rect:[4.4, -4.4, 7, 6.2]}, {circle:[SP.cx, SP.cz, SP.r1]}]);
  // kanat tavanları
  slab({rect:[-31, -7, -7, 7]}, 10.3, null, ceilMat, [], false);
  slab({rect:[7, -7, 31, 7]}, 10.3, null, ceilMat, [], false);
  // 3. kat (kubbe) zemini ve kütüphane tavanı
  slab({circle:[0, 0, 6.2]}, 15, marbleFloor, ceilMat, [{circle:[SP.cx, SP.cz, SP.r1]}]);
  slab({rect:[-7, -9, 7, 9]}, 15.3, null, ceilMat, [{circle:[0, 0, 6.2]}], false);

  /* ================= duvarlar ================= */
  const DOOR = [-6.6, -4.6, 3.4];
  // orta blok
  wall('x', 9, -7, 7, 0, 5, wHall, [[-1.3, 1.3, 3.8]]);   // güney (giriş)
  wall('x', 9, -7, 7, 5, 5, wHall);
  wall('x', 9, -7, 7, 10, 5, wGreen);
  wall('x', -9, -7, 7, 0, 5, wHall);
  wall('x', -9, -7, 7, 5, 5, wHall);
  wall('x', -9, -7, 7, 10, 5, wGreen);
  [-1, 1].forEach(s => {
    wall('z', s * 7, -9, 9, 0, 5, wHall, [DOOR]);
    wall('z', s * 7, -9, 9, 5, 5, wHall, [DOOR]);
    wall('z', s * 7, -9, 9, 10, 5, wGreen);
  });
  // kanatlar
  wall('x', -7, -31, -7, 0, 5, wRed, [[-26.0, -24.2, 3.2], [-14.0, -12.2, 3.2]]); wall('x', 7, -31, -7, 0, 5, wRed); wall('z', -31, -7, 7, 0, 5, wRed);
  wall('x', -7, -31, -7, 5, 5, wGold); wall('x', 7, -31, -7, 5, 5, wGold); wall('z', -31, -7, 7, 5, 5, wGold);
  wall('x', -7, 7, 31, 0, 5, wBlue); wall('x', 7, 7, 31, 0, 5, wBlue); wall('z', 31, -7, 7, 0, 5, wBlue);
  wall('x', -7, 7, 31, 5, 5, wRose); wall('x', 7, 7, 31, 5, 5, wRose); wall('z', 31, -7, 7, 5, 5, wRose);

  /* ================= pencereler ================= */
  function windowAt(x, y, z, rot, w = 1.4, h = 2.6){
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; root.add(g);
    add(new THREE.PlaneGeometry(w, h), winMat, 0, 0, 0, g);
    const f = 0.09;
    [[0, h / 2, w + 0.2, f], [0, -h / 2, w + 0.2, f], [0, 0.35, w, 0.05]].forEach(([px, py, ww, hh]) => add(new THREE.BoxGeometry(ww, hh, 0.08), cream, px, py, 0.03, g));
    [-w / 2, w / 2, 0].forEach(px => add(new THREE.BoxGeometry(px ? f : 0.05, h, 0.08), cream, px, 0, 0.03, g));
    add(new THREE.BoxGeometry(w + 0.2, 0.08, 0.3), cream, 0, -h / 2 - 0.05, 0.12, g);
    // perdeler ve korniş
    const cm = velvetR;
    [-1, 1].forEach(s => { const c = add(new THREE.BoxGeometry(0.42, h + 0.5, 0.06), cm, s * (w / 2 + 0.28), 0.05, 0.12, g); c.rotation.y = s * 0.05; });
    add(new THREE.BoxGeometry(w + 1.3, 0.22, 0.14), gold, 0, h / 2 + 0.35, 0.14, g);
  }
  const IN_N = 0, IN_S = Math.PI, IN_W = Math.PI / 2, IN_E = -Math.PI / 2; // iç yüze bakış yönleri
  [-3.2, 3.2].forEach(x => { windowAt(x, 2.3, -8.82, IN_N); windowAt(x, 7.3, -8.82, IN_N); });
  [-4.4, 4.4].forEach(x => windowAt(x, 2.3, 8.82, IN_S));
  [-3, 0, 3].forEach(x => windowAt(x, 7.4, 8.82, IN_S));
  [-5, -1.6].forEach(x => windowAt(x, 12.3, 8.82, IN_S));
  [-28, -23, -18, -13, -9.6].forEach(x => {
    windowAt(x, 2.3, 6.82, IN_S);
    windowAt(-x, 2.3, -6.82, IN_N); windowAt(-x, 2.3, 6.82, IN_S);
    windowAt(x, 7.4, 6.82, IN_S);                                      // galeri: güneyde pencere, kuzeyde ayna
    windowAt(-x, 7.4, 6.82, IN_S);
  });
  windowAt(-30.82, 7.4, 0, IN_W);
  [-4.5, 4.5].forEach(z => windowAt(30.82, 7.4, z, IN_E));

  /* ================= tablolar ================= */
  function painting(x, y, z, rot, w, h, kind = 'manzara'){
    const [c, g] = canvas(256, Math.round(256 * h / w));
    const H = c.height;
    if (kind === 'manzara'){
      const sky = g.createLinearGradient(0, 0, 0, H); const warm = rnd() < 0.5;
      sky.addColorStop(0, warm ? '#e9b77a' : '#7ea6cf'); sky.addColorStop(0.6, warm ? '#f6e1b0' : '#dfe7e6'); g.fillStyle = sky; g.fillRect(0, 0, 256, H);
      for (let k = 0; k < 3; k++){ g.fillStyle = ['#5c6e3e', '#4a5c32', '#38482a'][k]; g.beginPath(); g.moveTo(0, H); for (let x2 = 0; x2 <= 256; x2 += 16) g.lineTo(x2, H * (0.55 + k * 0.12) + Math.sin(x2 * 0.03 + k * 2 + rnd()) * 12); g.lineTo(256, H); g.fill(); }
      for (let k = 0; k < 7; k++){ g.fillStyle = 'rgba(40,60,30,.9)'; const tx = rnd() * 256, ty = H * (0.62 + rnd() * 0.15); g.beginPath(); g.ellipse(tx, ty, 10 + rnd() * 10, 16 + rnd() * 10, 0, 0, Math.PI * 2); g.fill(); }
      if (rnd() < 0.6){ g.fillStyle = '#e8dcc0'; const bx = 80 + rnd() * 90, by = H * 0.6; g.fillRect(bx, by - 22, 46, 22); g.fillStyle = '#4a5468'; g.beginPath(); g.moveTo(bx - 4, by - 22); g.lineTo(bx + 23, by - 40); g.lineTo(bx + 50, by - 22); g.fill(); }
    } else { // kontesin portresi
      const bg = g.createRadialGradient(128, H * 0.4, 10, 128, H * 0.45, 220); bg.addColorStop(0, '#5a4636'); bg.addColorStop(1, '#1c140e'); g.fillStyle = bg; g.fillRect(0, 0, 256, H);
      g.fillStyle = '#2f4f86'; g.beginPath(); g.moveTo(40, H); g.quadraticCurveTo(60, H * 0.55, 128, H * 0.52); g.quadraticCurveTo(196, H * 0.55, 216, H); g.fill();
      g.fillStyle = '#e9d2bd'; g.beginPath(); g.ellipse(128, H * 0.52, 40, 16, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ecd6c2'; g.beginPath(); g.ellipse(128, H * 0.33, 30, 38, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#e8e2d8'; g.beginPath(); g.ellipse(128, H * 0.24, 44, 34, 0, Math.PI, Math.PI * 2); g.fill();
      [-1, 1].forEach(s => { g.beginPath(); g.ellipse(128 + s * 36, H * 0.3, 14, 26, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#3a2a22'; [-1, 1].forEach(s => { g.beginPath(); g.ellipse(128 + s * 11, H * 0.33, 3.5, 2.5, 0, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#b35a5a'; g.beginPath(); g.ellipse(128, H * 0.41, 7, 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; for (let k = 0; k < 13; k++){ const a = Math.PI * (0.15 + k * 0.054); g.beginPath(); g.arc(128 + Math.cos(a) * 34, H * 0.46 + Math.sin(a) * 12, 2.6, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#ff2a4a'; g.beginPath(); g.arc(128, H * 0.5, 4, 0, Math.PI * 2); g.fill();
    }
    const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = rot; root.add(grp);
    add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.75}), 0, 0, 0.06, grp);
    const fw = 0.14;
    [[0, h / 2 + fw / 2, w + fw * 2, fw], [0, -h / 2 - fw / 2, w + fw * 2, fw], [-w / 2 - fw / 2, 0, fw, h], [w / 2 + fw / 2, 0, fw, h]].forEach(([px, py, ww, hh]) => add(new THREE.BoxGeometry(ww, hh, 0.1), gold, px, py, 0.05, grp));
    return grp;
  }
  painting(-6.82, 7.0, 1.2, IN_W, 2.4, 1.8);
  painting(-30.82, 2.7, -4.3, IN_W, 1.5, 1.9); painting(-30.82, 2.7, 4.3, IN_W, 1.5, 1.9);
  painting(30.82, 2.6, 0, IN_E, 3.2, 2.0);
  painting(16.6, 7.4, -6.82, IN_N, 1.6, 1.2);
  painting(24, 7.7, -6.82, IN_N, 1.4, 1.9, 'portre');

  /* ================= avizeler ================= */
  function chandelier(x, y, z, s = 1, drop = 1.0){
    const g = new THREE.Group(); g.position.set(x, y, z); root.add(g);
    add(new THREE.CylinderGeometry(0.025, 0.025, drop, 6), gold, 0, drop / 2, 0, g);
    add(new THREE.SphereGeometry(0.2 * s, 16, 10), gold, 0, 0, 0, g);
    add(new THREE.TorusGeometry(0.85 * s, 0.035 * s, 8, 40), gold, 0, -0.15 * s, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.48 * s, 0.03 * s, 8, 32), gold, 0, 0.35 * s, 0, g).rotation.x = Math.PI / 2;
    const n = 10, cand = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025 * s, 0.025 * s, 0.16 * s, 6), cream, n * 2), fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035 * s, 8, 6), flameMat, n * 2), m4 = new THREE.Matrix4();
    for (let i = 0; i < n * 2; i++){
      const inner = i >= n, a = (i % n) / n * Math.PI * 2 + (inner ? 0.3 : 0), r = (inner ? 0.48 : 0.85) * s, yy = (inner ? 0.35 : -0.15) * s;
      m4.makeTranslation(Math.cos(a) * r, yy + 0.09 * s, Math.sin(a) * r); cand.setMatrixAt(i, m4);
      m4.makeTranslation(Math.cos(a) * r, yy + 0.2 * s, Math.sin(a) * r); fl.setMatrixAt(i, m4);
    }
    g.add(cand, fl);
    const drops = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.05 * s, 0), new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.1, roughness:0, envMapIntensity:2}), 24);
    for (let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; m4.makeTranslation(Math.cos(a) * 0.82 * s, -0.32 * s, Math.sin(a) * 0.82 * s); drops.setMatrixAt(i, m4); }
    g.add(drops);
    return g;
  }
  chandelier(0, 6.6, 3.2, 1.6, 3.1);
  [-25, -19, -13].forEach(x => chandelier(x, 3.9, 0, 0.9, 0.8));
  chandelier(19, 3.9, 0, 1.0, 0.8);
  [-28, -23, -18, -13, -9.6].forEach(x => chandelier(x, 8.9, 0, 0.75, 1.1));
  chandelier(22, 8.9, 0, 0.8, 1.1);
  chandelier(-3.5, 13.8, 4.5, 0.8, 0.9);

  // iç ışıklar (sahnede her zaman var; dışarıdayken kısık) — ışık sayısı değişmesin diye
  function pl(x, y, z, color, intensity, dist){ const l = new THREE.PointLight(color, 0, dist, 2); l.position.set(O.x + x, O.y + y, O.z + z); scene.add(l); lights.push({l, base:intensity}); return l; }
  pl(0, 6.2, 3.2, 0xffd9a0, 7, 22);
  const fireLight = pl(-29.6, 1.2, 0, 0xff8a3a, 6, 14);
  pl(-19, 8.4, 0, 0xffe2b0, 7, 20);
  pl(19, 3.6, 0, 0xffe2b0, 5, 14);
  pl(22, 8.4, 0, 0xffd6b0, 5, 14);
  pl(-2, 13.4, 3, 0xffe2b0, 6, 16);

  /* ================= merdivenler ================= */
  const carpet = new THREE.MeshStandardMaterial({color:0x8e1424, roughness:0.95});
  function stairs(x0, x1, zS, zE, yS, yE, base){
    const n = Math.round(Math.abs(yE - yS) / 0.25), dz = (zE - zS) / n, w = x1 - x0;
    const st = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), marble, n), cp = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), carpet, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++){
      const top = yS + (i + 1) * (yE - yS) / n, z = zS + (i + 0.5) * dz, hh = top - base;
      m4.compose(L((x0 + x1) / 2, base + hh / 2, z), q, L(w, hh, Math.abs(dz))); st.setMatrixAt(i, m4);
      m4.compose(L((x0 + x1) / 2, top + 0.012, z), q, L(w * 0.62, 0.025, Math.abs(dz))); cp.setMatrixAt(i, m4);
    }
    st.receiveShadow = true; root.add(st, cp);
    C.heightFns.push((x, z) => {
      const lx = x - O.x, lz = z - O.z;
      if (lx < x0 - 0.05 || lx > x1 + 0.05) return null;
      const t = (lz - zS) / (zE - zS); if (t < -0.03 || t > 1.03) return null;
      return O.y + yS + Math.max(0, Math.min(1, t)) * (yE - yS);
    });
  }
  stairs(-6.6, -4.6, 6.2, -4.2, 0, 5, 0);      // hol → 1. kat
  stairs(4.6, 6.6, -4.2, 6.2, 5, 10, 0);       // 1. kat → kütüphane
  rectC(-6.6, -4.2, -4.6, 4.0, 0, 0.5);        // merdiven altına zemin kattan girilmesin
  rectC(4.6, -4.2, 6.6, 6.2, 0, 4.5);

  /* ================= korkuluklar ================= */
  const balGeo = new THREE.CylinderGeometry(0.045, 0.06, 1, 8);
  function balustrade(ax, az, ay, bx, bz, by, cY0, cY1){
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(len / 0.32));
    const im = new THREE.InstancedMesh(balGeo, marble, n + 1), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i <= n; i++){ const t = i / n, y = ay + (by - ay) * t; m4.compose(L(ax + (bx - ax) * t, y + 0.45, az + (bz - az) * t), q, L(1, 0.9, 1)); im.setMatrixAt(i, m4); }
    root.add(im);
    const a = L(ax, ay + 0.95, az), b = L(bx, by + 0.95, bz), mid = a.clone().add(b).multiplyScalar(0.5);
    const rail = add(new THREE.CylinderGeometry(0.06, 0.06, a.distanceTo(b), 8), gold, mid.x, mid.y, mid.z);
    rail.quaternion.setFromUnitVectors(L(0, 1, 0), b.clone().sub(a).normalize());
    if (cY0 != null){
      const o = C.box(O.x + (ax + bx) / 2, O.z + (az + bz) / 2, len / 2, 0.1, -Math.atan2(bz - az, bx - ax));
      col(o, cY0, cY1, true);
    }
  }
  balustrade(-4.4, -4.2, 5, 4.4, -4.2, 5, 5, 6.6);              // balkon kenarı
  balustrade(-4.45, 6.2, 0, -4.45, -4.2, 5, 0, 6.4);           // batı merdiveni iç korkuluğu
  balustrade(4.45, -4.2, 5, 4.45, 6.2, 10, 0, 11.4);            // doğu merdiveni iç korkuluğu
  balustrade(4.4, -4.4, 10, 6.85, -4.4, 10, 10, 11.6);          // kütüphane: merdiven boşluğu
  balustrade(4.3, -4.4, 10, 4.3, 6.2, 10, 10, 11.6);

  /* ================= döner merdiven (kütüphane → kubbe) ================= */
  const turns = 1.25, total = turns * Math.PI * 2, A0 = Math.PI * 0.5, Y0 = 10, Y1 = 15, NS = 26;
  {
    // Her basamak: direğe bağlı dilim şeklinde dolu mermer blok + üstünde halı + ön kenarda altın şerit.
    // Bloklar bir önceki basamağın altına uzanır; alttan bakınca kesintisiz sarmal bir gövde görünür.
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = L(0, 1, 0);
    const da = total / NS, rise = (Y1 - Y0) / NS, TH = rise * 2.2;
    const wedge = new THREE.CylinderGeometry(SP.r1, SP.r1, TH, 6, 1, false, 0, da * 1.04); wedge.translate(0, -TH / 2, 0);
    const wedgeC = new THREE.CylinderGeometry(SP.r1 - 0.22, SP.r1 - 0.22, 0.03, 6, 1, false, da * 0.08, da * 0.84); wedgeC.translate(0, 0.015, 0);
    const nose = new THREE.BoxGeometry(SP.r1 - SP.r0, 0.05, 0.05); nose.translate((SP.r1 + SP.r0) / 2, -0.02, 0);
    const tread = new THREE.InstancedMesh(wedge, marble, NS), cp = new THREE.InstancedMesh(wedgeC, carpet, NS), ns = new THREE.InstancedMesh(nose, gold, NS);
    for (let i = 0; i < NS; i++){
      const aS = A0 + i * da, h = Y0 + (i + 1) * rise;
      // CylinderGeometry açısı +z'den +x'e doğru ölçülür: θ = π/2 − a. Dilim [aS, aS+da] aralığını kaplasın.
      q.setFromAxisAngle(up, Math.PI / 2 - (aS + da));
      m4.compose(L(SP.cx, h, SP.cz), q, L(1, 1, 1)); tread.setMatrixAt(i, m4); cp.setMatrixAt(i, m4);
      q.setFromAxisAngle(up, -aS); m4.compose(L(SP.cx, h, SP.cz), q, L(1, 1, 1)); ns.setMatrixAt(i, m4);
    }
    tread.castShadow = true; tread.receiveShadow = true;
    root.add(tread, cp, ns);
    add(new THREE.CylinderGeometry(0.22, 0.26, Y1 - Y0 + 1.2, 16), marble, SP.cx, (Y0 + Y1 + 1.2) / 2, SP.cz);
    add(new THREE.SphereGeometry(0.28, 16, 10), gold, SP.cx, Y1 + 1.35, SP.cz);
    circC(SP.cx, SP.cz, 0.32, Y0, Y1 + 1);
    // sarmal tırabzan
    const pts = []; for (let i = 0; i <= 80; i++){ const s = i / 80 * total, a = A0 + s; pts.push(L(SP.cx + Math.cos(a) * (SP.r1 + 0.02), Y0 + s / total * (Y1 - Y0) + 1.0, SP.cz + Math.sin(a) * (SP.r1 + 0.02))); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.05, 6), gold, 0, 0, 0);
    const bal = new THREE.InstancedMesh(balGeo, gold, NS);
    for (let i = 0; i < NS; i++){ const s = (i + 0.5) / NS * total, a = A0 + s, h = Y0 + (i + 1) / NS * (Y1 - Y0); m4.compose(L(SP.cx + Math.cos(a) * SP.r1, h + 0.5, SP.cz + Math.sin(a) * SP.r1), new THREE.Quaternion(), L(0.6, 1, 0.6)); bal.setMatrixAt(i, m4); }
    root.add(bal);
    C.heightFns.push((x, z) => {
      const lx = x - O.x - SP.cx, lz = z - O.z - SP.cz, r = Math.hypot(lx, lz);
      if (r < SP.r0 - 0.1 || r > SP.r1 + 0.12) return null;
      let s0 = Math.atan2(lz, lx) - A0; s0 = ((s0 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const out = [];
      for (let s = s0; s <= total + 1e-6; s += Math.PI * 2) out.push(O.y + Y0 + Math.min(1, s / total) * (Y1 - Y0));
      if (s0 > Math.PI * 2 - 0.12) out.push(O.y + Y0);
      return out;
    });
    // delik çevresi korkuluk (kütüphane girişi ve kubbe çıkışı açık)
    const angd = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const entry = A0 + 0.42, exit = A0 + total - 0.42, RING = 28;
    const ringBal2 = [], ringBal3 = [];
    for (let k = 0; k < RING; k++){
      const a = k / RING * Math.PI * 2, x = SP.cx + Math.cos(a) * 2.12, z = SP.cz + Math.sin(a) * 2.12;
      const isEntry = angd(a, entry) < 0.48, isExit = angd(a, exit) < 0.48;
      circC(x, z, 0.2, isEntry ? 12.4 : Y0, isExit ? 13.8 : Y1 + 0.6, true);
      if (!isEntry) ringBal2.push([x, z]); if (!isExit) ringBal3.push([x, z]);
    }
    [[ringBal2, Y0], [ringBal3, Y1]].forEach(([arr, y]) => {
      const im = new THREE.InstancedMesh(balGeo, marble, arr.length);
      arr.forEach(([x, z], i) => { m4.compose(L(x, y + 0.45, z), new THREE.Quaternion(), L(1, 0.9, 1)); im.setMatrixAt(i, m4); });
      root.add(im);
      const ring = add(new THREE.TorusGeometry(2.12, 0.05, 6, 64), gold, SP.cx, y + 0.95, SP.cz); ring.rotation.x = Math.PI / 2;
    });
  }

  /* ================= kubbe (rasathane) ================= */
  {
    const R = 6.3, DY = 4.6;
    const [c, g] = canvas(1024, 256); g.fillStyle = '#1b2a4a'; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = 'rgba(214,180,100,.6)'; g.lineWidth = 3; g.strokeRect(0, 8, 1024, 240);
    for (let i = 0; i < 16; i++){ g.fillStyle = 'rgba(214,180,100,.5)'; g.fillRect(i * 64 + 30, 20, 4, 216); }
    const drum = add(new THREE.CylinderGeometry(R, R, DY, 64, 1, true), new THREE.MeshStandardMaterial({map:ctex(c, 3, 1), roughness:0.8, side:THREE.BackSide}), 0, 15 + DY / 2, 0);
    // yıldız haritası
    const [sc, sg] = canvas(1024, 512);
    const bg = sg.createLinearGradient(0, 0, 0, 512); bg.addColorStop(0, '#0d1838'); bg.addColorStop(1, '#203a6e'); sg.fillStyle = bg; sg.fillRect(0, 0, 1024, 512);
    const stars = [];
    for (let i = 0; i < 520; i++){ const x = rnd() * 1024, y = rnd() * 470, r = rnd() < 0.08 ? 2.6 : 1 + rnd(); stars.push([x, y]); sg.fillStyle = `rgba(255,${230 + rnd() * 25 | 0},${170 + rnd() * 60 | 0},${0.6 + rnd() * 0.4})`; sg.beginPath(); sg.arc(x, y, r, 0, Math.PI * 2); sg.fill(); }
    sg.strokeStyle = 'rgba(230,200,120,.45)'; sg.lineWidth = 1.5;
    for (let k = 0; k < 14; k++){ sg.beginPath(); let p = stars[Math.floor(rnd() * stars.length)]; sg.moveTo(p[0], p[1]); for (let j = 0; j < 4; j++){ p = [p[0] + (rnd() - 0.5) * 120, p[1] + (rnd() - 0.5) * 80]; sg.lineTo(p[0], p[1]); sg.arc(p[0], p[1], 2.5, 0, Math.PI * 2); } sg.stroke(); }
    sg.strokeStyle = 'rgba(214,180,100,.35)'; sg.lineWidth = 2; for (let k = 1; k < 4; k++){ sg.beginPath(); sg.moveTo(0, k * 120); sg.lineTo(1024, k * 120); sg.stroke(); }
    const domeMat = new THREE.MeshBasicMaterial({map:ctex(sc), side:THREE.BackSide});
    domeMat.color.setScalar(1.15);
    add(new THREE.SphereGeometry(R, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), domeMat, 0, 15 + DY, 0);
    add(new THREE.CircleGeometry(0.9, 32), winMat, 0, 15 + DY + R - 0.05, 0).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(0.95, 0.08, 8, 40), gold, 0, 15 + DY + R - 0.06, 0).rotation.x = Math.PI / 2;
    add(new THREE.TorusGeometry(R - 0.05, 0.12, 8, 80), gold, 0, 15 + DY, 0).rotation.x = Math.PI / 2;
    // yuvarlak pencereler
    for (let i = 0; i < 8; i++){
      const a = i / 8 * Math.PI * 2 + 0.2, x = Math.cos(a) * (R - 0.04), z = Math.sin(a) * (R - 0.04);
      const w = add(new THREE.CircleGeometry(0.6, 24), winMat, x, 17.6, z); w.lookAt(root.position.x, 17.6 + root.position.y, root.position.z);
      const fr = add(new THREE.TorusGeometry(0.62, 0.06, 6, 24), gold, x, 17.6, z); fr.lookAt(root.position.x, 17.6 + root.position.y, root.position.z);
    }
    for (let i = 0; i < 64; i++){ const a = i / 64 * Math.PI * 2; circC(Math.cos(a) * 6.6, Math.sin(a) * 6.6, 0.45, 15, 24); }
    // teleskop
    const tg = new THREE.Group(); tg.position.set(0, 15, -4.4); root.add(tg);
    [0, 1, 2].forEach(k => { const leg = add(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 6), darkWood, 0, 0.75, 0, tg); const a = k / 3 * Math.PI * 2; leg.position.set(Math.cos(a) * 0.35, 0.72, Math.sin(a) * 0.35); leg.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); });
    const tube = add(new THREE.CylinderGeometry(0.11, 0.16, 2.2, 20), gold, 0, 1.75, 0.15, tg); tube.rotation.x = -0.75;
    add(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 20), darkWood, 0, 1.75 + Math.cos(0.75) * 1.05, 0.15 + Math.sin(0.75) * 1.05, tg).rotation.x = -0.75;
    circC(0, -4.4, 0.6, 15, 17, true);
    // armiller küre
    const arm = new THREE.Group(); arm.position.set(-3.6, 16.4, 2.6); root.add(arm);
    add(new THREE.CylinderGeometry(0.06, 0.25, 1.0, 12), gold, 0, -0.9, 0, arm);
    [0, 1, 2].forEach(k => { const r = add(new THREE.TorusGeometry(0.55 - k * 0.04, 0.025, 6, 48), gold, 0, 0, 0, arm); r.rotation.set(k * 1.0, k * 0.7, 0); spinners.push({o:r, s:0.2 + k * 0.15}); });
    add(new THREE.SphereGeometry(0.12, 16, 10), new THREE.MeshStandardMaterial({color:0x2f6fd0, roughness:0.4}), 0, 0, 0, arm);
    spinners.push({o:arm, s:0.1, axis:'y'});
    circC(-3.6, 2.6, 0.5, 15, 17, true);
  }

  /* ================= mobilyalar ================= */
  function chair(x, z, rot, y0 = 0, fab = velvetR){
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = rot; root.add(g);
    add(new THREE.BoxGeometry(0.5, 0.08, 0.5), wood, 0, 0.46, 0, g); add(new THREE.BoxGeometry(0.44, 0.06, 0.44), fab, 0, 0.52, 0, g);
    add(new THREE.BoxGeometry(0.5, 0.62, 0.06), wood, 0, 0.82, -0.23, g); add(new THREE.BoxGeometry(0.4, 0.46, 0.03), fab, 0, 0.84, -0.19, g);
    [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]].forEach(([a, b]) => add(new THREE.BoxGeometry(0.05, 0.46, 0.05), wood, a, 0.23, b, g));
  }
  function table(x0, z0, x1, z1, y0 = 0, cloth = true){
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    add(new THREE.BoxGeometry(w, 0.07, d), darkWood, cx, y0 + 0.76, cz);
    if (cloth) add(new THREE.BoxGeometry(w + 0.12, 0.3, d + 0.12), linen, cx, y0 + 0.66, cz);
    [[x0 + 0.1, z0 + 0.1], [x1 - 0.1, z0 + 0.1], [x0 + 0.1, z1 - 0.1], [x1 - 0.1, z1 - 0.1]].forEach(([a, b]) => add(new THREE.BoxGeometry(0.08, 0.74, 0.08), darkWood, a, y0 + 0.37, b));
    rectC(x0, z0, x1, z1, y0, y0 + 1, true);
  }
  function candelabra(x, y, z){
    add(new THREE.CylinderGeometry(0.03, 0.1, 0.5, 8), gold, x, y + 0.25, z);
    [-0.18, 0, 0.18].forEach(dx => { add(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), cream, x + dx, y + 0.6, z); add(new THREE.SphereGeometry(0.03, 8, 6), flameMat, x + dx, y + 0.72, z); });
    add(new THREE.BoxGeometry(0.4, 0.03, 0.03), gold, x, y + 0.5, z);
  }
  function sofa(x, z, rot, y0 = 0, fab = velvetB){
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = rot; root.add(g);
    add(new THREE.BoxGeometry(2.0, 0.42, 0.8), fab, 0, 0.32, 0, g); add(new THREE.BoxGeometry(2.0, 0.6, 0.18), fab, 0, 0.7, -0.33, g);
    [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.16, 0.55, 0.8), fab, s * 0.98, 0.45, 0, g));
    add(new THREE.BoxGeometry(2.1, 0.06, 0.86), gold, 0, 0.1, 0, g);
    col(C.box(O.x + x, O.z + z, 1.05, 0.45, -rot), y0, y0 + 1, true);
  }
  function rug(x, z, w, d, y0, c1, c2){
    const [c, g] = canvas(256, 256); g.fillStyle = c1; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = c2; g.lineWidth = 14; g.strokeRect(14, 14, 228, 228); g.lineWidth = 4; g.strokeRect(34, 34, 188, 188);
    g.fillStyle = c2; g.beginPath(); g.ellipse(128, 128, 54, 40, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = c1; g.beginPath(); g.ellipse(128, 128, 36, 24, 0, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 4; k++){ g.fillStyle = c2; g.save(); g.translate([60, 196, 60, 196][k], [60, 60, 196, 196][k]); g.rotate(Math.PI / 4); g.fillRect(-12, -12, 24, 24); g.restore(); }
    const m = add(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({map:ctex(c), roughness:1}), x, y0 + 0.012, z); m.rotation.x = -Math.PI / 2;
  }
  function fireplace(x, y0, z, rot){
    const g = new THREE.Group(); g.position.set(x, y0, z); g.rotation.y = rot; root.add(g);
    add(new THREE.BoxGeometry(2.6, 0.18, 0.6), marble, 0, 1.45, 0.1, g);
    [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.42, 1.4, 0.5), marble, s * 1.0, 0.7, 0.05, g));
    add(new THREE.BoxGeometry(1.6, 1.2, 0.3), new THREE.MeshStandardMaterial({color:0x140c08, roughness:1}), 0, 0.6, -0.1, g);
    add(new THREE.BoxGeometry(2.0, 1.4, 0.12), marble, 0, 2.3, -0.12, g);
    [-0.25, 0.25].forEach((dx, i) => { const lg = add(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8), wood, dx * 0.4, 0.12 + i * 0.06, 0.05, g); lg.rotation.z = Math.PI / 2; lg.rotation.y = dx; });
    for (let i = 0; i < 4; i++){ const f = add(new THREE.ConeGeometry(0.16 + i % 2 * 0.05, 0.6, 8), fireMat, -0.3 + i * 0.2, 0.42, 0.05, g); fires.push({o:f, p:rnd() * 6}); }
    return g;
  }
  function bust(x, z, y0 = 0){
    add(new THREE.BoxGeometry(0.55, 1.15, 0.55), marble, x, y0 + 0.575, z);
    add(new THREE.BoxGeometry(0.66, 0.08, 0.66), marble, x, y0 + 1.19, z);
    add(new THREE.BoxGeometry(0.5, 0.26, 0.28), marble, x, y0 + 1.36, z);
    add(new THREE.SphereGeometry(0.16, 16, 12), marble, x, y0 + 1.63, z).scale.y = 1.2;
    circC(x, z, 0.4, y0, y0 + 2, true);
  }
  function orangeTub(x, z, y0 = 0){
    add(new THREE.BoxGeometry(0.62, 0.62, 0.62), cream, x, y0 + 0.31, z);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => add(new THREE.SphereGeometry(0.05, 8, 6), gold, x + a * 0.31, y0 + 0.66, z + b * 0.31));
    add(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6), wood, x, y0 + 1.05, z);
    add(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshStandardMaterial({color:0x2c5a26, roughness:0.75, flatShading:true}), x, y0 + 1.75, z);
    for (let i = 0; i < 9; i++){ const a = rnd() * 6.28, p = rnd() * 2.2; add(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({color:0xff8a1a, roughness:0.5}), x + Math.sin(p) * Math.cos(a) * 0.6, y0 + 1.75 + Math.cos(p) * 0.6, z + Math.sin(p) * Math.sin(a) * 0.6); }
    circC(x, z, 0.42, y0, y0 + 2.4, true);
  }

  // --- giriş holü ---
  rug(0, 2.2, 5.5, 8, 0, '#7e1a22', '#d4af37');
  bust(-2.15, 8.45); bust(2.15, 8.45);
  orangeTub(-2.6, -7.6); orangeTub(2.6, -7.6);
  table(-6.5, 8.25, -5.0, 8.8, 0, false); table(5.0, 8.25, 6.5, 8.8, 0, false);
  candelabra(-5.75, 0.8, 8.5); candelabra(5.75, 0.8, 8.5);
  // kapı (çıkış)
  [-1, 1].forEach(s => { const d = add(new THREE.BoxGeometry(1.25, 3.7, 0.12), new THREE.MeshStandardMaterial({color:0x4a2c18, roughness:0.6}), s * 0.63, 1.85, 9.02); add(new THREE.SphereGeometry(0.06, 10, 8), gold, s * 0.12, 1.3, 8.92); });
  rectC(-1.3, 8.85, 1.3, 9.2, 0, 4);
  // kâhya
  const butler = world.makeGuard();
  butler.userData.armR.children.forEach(c => { if (c.isGroup) c.visible = false; });
  const black = new THREE.MeshStandardMaterial({color:0x17171c, roughness:0.6});
  butler.traverse(o => { if (o.isMesh){ if (o.material === M.coatMat) o.material = black; if (o.material === M.hatMat) o.visible = false; if (o.material === M.redMat) o.material = black; } });
  world.part(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshStandardMaterial({color:0xeeeae2, roughness:0.9}), 0, 1.86, -0.03, butler).scale.set(1.05, 0.9, 1.1);
  butler.position.set(2.6, 0, 4.2); butler.rotation.y = 0.2; root.add(butler); circC(2.6, 4.2, 0.45, 0, 2);

  // --- balo/yemek salonu (batı, zemin) ---
  rug(-19, 0, 18, 5, 0, '#5a1420', '#c9a24a');
  table(-27, -0.85, -11, 0.85, 0);
  for (let i = 0; i < 8; i++){ const x = -26 + i * 2.15; chair(x, -1.35, 0); chair(x, 1.35, Math.PI); }
  [-24, -19, -14].forEach(x => candelabra(x, 0.8, 0));
  fireplace(-30.8, 0, 0, Math.PI / 2); rectC(-31, -1.4, -30.2, 1.4, 0, 2.4);
  orangeTub(-29.6, -5.6); orangeTub(-29.6, 5.6);

  // --- müzik salonu (doğu, zemin) ---
  rug(19, 0, 10, 7, 0, '#1e2f55', '#d4af37');
  sofa(16, -4.6, 0); sofa(16, 4.6, Math.PI);
  table(15, -1, 17, 1, 0, false);
  // klavsen
  const hp = new THREE.Group(); hp.position.set(25, 0, 2.2); hp.rotation.y = -Math.PI / 2; root.add(hp);
  {
    const cs = new THREE.Shape(); cs.moveTo(-0.5, 0); cs.lineTo(0.5, 0); cs.lineTo(0.5, -1.0); cs.quadraticCurveTo(0.35, -1.9, 0.0, -2.1); cs.lineTo(-0.5, -2.1); cs.closePath();
    const cg = new THREE.ExtrudeGeometry(cs, {depth:0.32, bevelEnabled:false}); cg.rotateX(Math.PI / 2); cg.translate(0, 1.0, 0);
    add(cg, new THREE.MeshStandardMaterial({color:0x1d3b2a, roughness:0.35}), 0, 0, 0, hp);
    const lid = add(new THREE.ShapeGeometry(cs), gold, 0, 1.0, 0, hp); lid.rotation.x = -Math.PI / 2 - 0.0; lid.rotation.set(-Math.PI / 2 + 0.75, 0, 0); lid.position.set(-0.0, 1.02, 0.0);
    add(new THREE.BoxGeometry(0.98, 0.04, 0.22), new THREE.MeshStandardMaterial({color:0xf4efe2}), 0, 0.82, 0.1, hp);
    const bk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 0.03, 0.12), black, 20), m4 = new THREE.Matrix4();
    for (let i = 0; i < 20; i++){ m4.makeTranslation(-0.45 + i * 0.047, 0.85, 0.05); bk.setMatrixAt(i, m4); } hp.add(bk);
    [[-0.4, -0.2], [0.4, -0.2], [0, -1.8]].forEach(([a, b]) => add(new THREE.CylinderGeometry(0.04, 0.03, 0.68, 8), gold, a, 0.34, b, hp));
    add(new THREE.BoxGeometry(0.7, 0.08, 0.34), velvetB, 0, 0.48, 0.65, hp);
    rectC(23.5, 1.6, 27.4, 2.8, 0, 1.4, true);
  }
  orangeTub(29.6, -5.6); orangeTub(29.6, 5.6);

  // --- Aynalı Galeri (batı, 1. kat) ---
  [-28, -23, -18, -13, -9.6].forEach((x, i) => {
    const g = new THREE.Group(); g.position.set(x, 5, -6.82); root.add(g);
    add(new THREE.PlaneGeometry(1.6, 3.0), mirrorMat, 0, 2.1, 0.03, g);
    add(new THREE.CircleGeometry(0.8, 24, 0, Math.PI), mirrorMat, 0, 3.6, 0.03, g);
    add(new THREE.TorusGeometry(0.85, 0.07, 6, 24, Math.PI), gold, 0, 3.6, 0.06, g);
    [-0.86, 0.86].forEach(dx => add(new THREE.BoxGeometry(0.12, 3.0, 0.1), gold, dx, 2.1, 0.05, g));
    add(new THREE.BoxGeometry(1.84, 0.12, 0.1), gold, 0, 0.6, 0.05, g);
    if (i < 4){ add(new THREE.BoxGeometry(0.5, 4.4, 0.16), gold, 2.5, 2.4, 0.08, g); }
    // sıra
    if (i % 2 === 0){ add(new THREE.BoxGeometry(1.6, 0.42, 0.5), velvetR, x, 5.21, -5.9); add(new THREE.BoxGeometry(1.7, 0.06, 0.6), gold, x, 5.02, -5.9); rectC(x - 0.85, -6.2, x + 0.85, -5.6, 5, 6, true); }
  });
  [-25.5, -20.5, -15.5, -11].forEach(x => orangeTub(x, 0, 5));

  // --- kontesin yatak odası (doğu, 1. kat) ---
  rug(24, 0, 7, 6, 5, '#6c3a4a', '#e7cfa0');
  {
    const b = new THREE.Group(); b.position.set(28.8, 5, 0); b.rotation.y = -Math.PI / 2; root.add(b);
    add(new THREE.BoxGeometry(2.4, 0.5, 2.3), darkWood, 0, 0.3, 0, b);
    add(new THREE.BoxGeometry(2.3, 0.3, 2.2), linen, 0, 0.68, 0.0, b);
    add(new THREE.BoxGeometry(2.36, 0.12, 1.4), new THREE.MeshStandardMaterial({color:0x7a2a3c, roughness:0.9}), 0, 0.86, 0.38, b);
    [-0.6, 0.6].forEach(dx => add(new THREE.BoxGeometry(0.8, 0.2, 0.4), linen, dx, 0.92, -0.85, b));
    add(new THREE.BoxGeometry(2.5, 1.8, 0.14), darkWood, 0, 1.2, -1.15, b);
    add(new THREE.BoxGeometry(2.2, 1.4, 0.04), velvetR, 0, 1.35, -1.07, b);
    [[-1.2, -1.15], [1.2, -1.15], [-1.2, 1.15], [1.2, 1.15]].forEach(([px, pz]) => add(new THREE.CylinderGeometry(0.06, 0.07, 3.2, 10), gold, px, 1.6, pz, b));
    add(new THREE.BoxGeometry(2.6, 0.3, 2.5), velvetR, 0, 3.25, 0, b);
    [-1, 1].forEach(s => { const d = add(new THREE.BoxGeometry(0.06, 2.6, 0.7), velvetR, s * 1.28, 1.85, 1.0, b); d.rotation.y = s * 0.15; const d2 = add(new THREE.BoxGeometry(0.06, 2.6, 0.7), velvetR, s * 1.28, 1.85, -0.8, b); d2.rotation.y = -s * 0.1; });
    rectC(27.6, -1.3, 30.1, 1.3, 5, 8.5);
  }
  { // gardırop, makyaj masası, koltuk
    add(new THREE.BoxGeometry(2.0, 2.6, 0.7), darkWood, 13.2, 6.3, -6.25); add(new THREE.BoxGeometry(0.03, 2.3, 0.02), gold, 13.2, 6.3, -5.89);
    rectC(12.2, -6.7, 14.2, -5.8, 5, 8);
    table(18.6, -6.7, 20.4, -6.0, 5, false);
    const mir = add(new THREE.CircleGeometry(0.42, 24), mirrorMat, 19.5, 6.75, -6.78); mir.scale.y = 1.3;
    add(new THREE.TorusGeometry(0.44, 0.04, 6, 32), gold, 19.5, 6.75, -6.76).scale.y = 1.3;
    chair(19.5, -5.4, Math.PI, 5, velvetR);
    sofa(22, 5.6, Math.PI, 5, new THREE.MeshStandardMaterial({color:0xd8b4b0, roughness:0.9}));
  }

  // --- kütüphane (2. kat) ---
  {
    const shelfMat = darkWood;
    const books = [];
    function shelves(axis, c, u0, u1, face){
      const H = 4.3, D = 0.45, y0 = 10, rows = 9;
      const len = u1 - u0, mid = (u0 + u1) / 2;
      const off = face * (D / 2 + 0.16);
      if (axis === 'x'){ add(new THREE.BoxGeometry(len, H, D), shelfMat, mid, y0 + H / 2, c + off); rectC(u0, c + off - D / 2, u1, c + off + D / 2, 10, 15); }
      else { add(new THREE.BoxGeometry(D, H, len), shelfMat, c + off, y0 + H / 2, mid); rectC(c + off - D / 2, u0, c + off + D / 2, u1, 10, 15); }
      for (let r = 0; r < rows; r++){
        const by = y0 + 0.2 + r * 0.46;
        let u = u0 + 0.1;
        while (u < u1 - 0.12){
          const bw = 0.04 + rnd() * 0.06, bh = 0.26 + rnd() * 0.14, bd = 0.24 + rnd() * 0.08;
          if (rnd() < 0.04){ u += 0.25; continue; }
          books.push(axis === 'x' ? [u + bw / 2, by + bh / 2, c + off + face * (D / 2 + 0.005) - face * bd / 2, bw, bh, bd] : [c + off + face * (D / 2 + 0.005) - face * bd / 2, by + bh / 2, u + bw / 2, bd, bh, bw]);
          u += bw + 0.004;
        }
        if (axis === 'x') add(new THREE.BoxGeometry(len, 0.03, D + 0.02), gold, mid, by - 0.02, c + off + face * 0.01);
        else add(new THREE.BoxGeometry(D + 0.02, 0.03, len), gold, c + off + face * 0.01, by - 0.02, mid);
      }
    }
    shelves('x', -9, -6.8, 6.8, 1);
    shelves('z', -7, -8.7, 8.7, 1);
    shelves('z', 7, -8.7, -4.8, -1);
    shelves('x', 9, 0.3, 6.8, -1);
    const PAL = [0x7a1f24, 0x1f3a6a, 0x2f5a3a, 0x6a4a22, 0x3a2a4a, 0x8a6a2a, 0x5a1a1a, 0x22423a, 0xb08a4a];
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({roughness:0.7}), books.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    books.forEach(([x, y, z, w, h, d], i) => { m4.compose(L(x, y, z), q, L(w, h, d)); im.setMatrixAt(i, m4); c.setHex(PAL[Math.floor(rnd() * PAL.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.08); im.setColorAt(i, c); });
    root.add(im);
    // okuma masası, sandalyeler, koltuklar, yerküre
    table(-4.6, 3.6, -1.6, 5.4, 10, false);
    chair(-3.1, 2.9, 0, 10, velvetR); chair(-3.1, 6.1, Math.PI, 10, velvetR);
    candelabra(-3.1, 10.8, 4.5);
    sofa(1.8, -6.6, 0, 10, new THREE.MeshStandardMaterial({color:0x5a3a22, roughness:0.7}));
    const gl = new THREE.Group(); gl.position.set(-4.6, 10, -4.8); root.add(gl);
    add(new THREE.CylinderGeometry(0.05, 0.3, 0.9, 12), darkWood, 0, 0.45, 0, gl);
    const [gc, gg] = canvas(512, 256); gg.fillStyle = '#c9b88a'; gg.fillRect(0, 0, 512, 256);
    gg.fillStyle = '#7d8a5a'; for (let i = 0; i < 9; i++){ gg.beginPath(); const x = rnd() * 512, y = 40 + rnd() * 170; for (let k = 0; k < 10; k++) gg.lineTo(x + Math.cos(k / 10 * 6.28) * (20 + rnd() * 40), y + Math.sin(k / 10 * 6.28) * (14 + rnd() * 26)); gg.fill(); }
    gg.strokeStyle = 'rgba(80,60,30,.35)'; for (let k = 0; k < 12; k++){ gg.beginPath(); gg.moveTo(k * 43, 0); gg.lineTo(k * 43, 256); gg.stroke(); }
    gg.fillStyle = '#9c1b2a'; gg.font = 'bold 22px Georgia'; gg.fillText('★', 292, 98);
    const globe = add(new THREE.SphereGeometry(0.42, 32, 20), new THREE.MeshStandardMaterial({map:ctex(gc), roughness:0.55}), 0, 1.35, 0, gl);
    globe.rotation.z = 0.4; spinners.push({o:globe, s:0.15, axis:'y'});
    const mer = add(new THREE.TorusGeometry(0.47, 0.025, 6, 40), gold, 0, 1.35, 0, gl); mer.rotation.y = Math.PI / 2;
    circC(-4.6, -4.8, 0.5, 10, 12, true);
  }

  /* ================= servis bölümü: mutfak ve çalışan odası (balo salonunun kuzeyi) ================= */
  const wStone = (() => {
    const [c, g] = canvas(256, 256); g.fillStyle = '#e6dfd2'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(150,135,110,.35)'; g.lineWidth = 2;
    for (let y = 0; y < 256; y += 32){ const off = (y / 32) % 2 ? 0 : 40; for (let x = -off; x < 256; x += 80){ g.strokeRect(x + rnd() * 4, y + rnd() * 3, 76 + rnd() * 6, 30); } }
    for (let i = 0; i < 1500; i++){ g.fillStyle = `rgba(120,110,95,${rnd() * 0.08})`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.95});
  })();
  const tiles = (() => {
    const [c, g] = canvas(256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){ const v = rnd() * 18; g.fillStyle = `rgb(${168 + v | 0},${84 + v / 2 | 0},${52 + v / 3 | 0})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    g.fillStyle = '#8a7a66'; for (let k = 0; k <= 4; k++){ g.fillRect(k * 64 - 2, 0, 4, 256); g.fillRect(0, k * 64 - 2, 256, 4); }
    const t = ctex(c, 0.5, 0.5); return new THREE.MeshStandardMaterial({map:t, roughness:0.85});
  })();
  const iron = new THREE.MeshStandardMaterial({color:0x1d1d22, metalness:0.7, roughness:0.45});
  const copper = new THREE.MeshStandardMaterial({color:0xc06a3a, metalness:1, roughness:0.3});
  const beamMat = new THREE.MeshStandardMaterial({color:0x3e2a1c, roughness:0.8});
  slab({rect:[-31, -19, -7, -7]}, 0, tiles, null);
  slab({rect:[-31, -19, -7, -7]}, 5.3, null, ceilMat, [], false);
  for (let z = -18; z <= -8; z += 2) add(new THREE.BoxGeometry(24, 0.28, 0.24), beamMat, -19, 4.86, z);
  wall('z', -31, -19, -7, 0, 5, wStone);
  wall('x', -19, -31, -7, 0, 5, wStone);
  wall('z', -19, -19, -7, 0, 5, wStone, [[-14.2, -12.2, 3.2]]);
  wall('z', -7, -19, -9, 0, 5, wStone);
  // balo salonu duvarının mutfak tarafı: badana
  [[-31, -26], [-24.2, -14], [-12.2, -7]].forEach(([a, b]) => add(new THREE.BoxGeometry(b - a, 4.95, 0.02), wStone, (a + b) / 2, 2.48, -7.17));
  [-28, -23].forEach(x => windowAt(x, 2.3, -18.82, IN_N));
  [-16.25, -11.25].forEach(x => windowAt(x, 2.6, -18.82, IN_N));

  // --- mutfak ---
  { // ocak (şömine + kazan)
    const g = new THREE.Group(); g.position.set(-30.75, 0, -13); g.rotation.y = Math.PI / 2; root.add(g);
    const st = M.stoneMat;
    add(new THREE.BoxGeometry(3.6, 0.5, 1.1), st, 0, 2.75, 0.3, g);
    [-1, 1].forEach(sd => add(new THREE.BoxGeometry(0.6, 2.6, 1.0), st, sd * 1.5, 1.3, 0.25, g));
    add(new THREE.BoxGeometry(2.4, 2.5, 0.2), new THREE.MeshStandardMaterial({color:0x120a06, roughness:1}), 0, 1.25, -0.15, g);
    add(new THREE.BoxGeometry(3.0, 1.9, 0.9), st, 0, 3.95, 0.05, g);
    add(new THREE.BoxGeometry(2.4, 0.15, 0.9), st, 0, 0.08, 0.3, g);
    for (let i = 0; i < 5; i++){ const f = add(new THREE.ConeGeometry(0.2 + (i % 2) * 0.06, 0.75, 8), fireMat, -0.6 + i * 0.3, 0.5, 0.15, g); fires.push({o:f, p:rnd() * 6}); }
    const caul = add(new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65), iron, 0.2, 1.25, 0.25, g);
    add(new THREE.CircleGeometry(0.36, 18), new THREE.MeshStandardMaterial({color:0x8a5a2a, roughness:0.4}), 0.2, 1.42, 0.25, g).rotation.x = -Math.PI / 2;
    add(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), iron, 0.2, 2.0, 0.25, g);
    const spit = add(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), iron, 0, 0.85, 0.55, g); spit.rotation.z = Math.PI / 2;
    rectC(-31, -15, -29.7, -11, 0, 3);
  }
  const fireK = pl(-29.9, 1.2, -13, 0xff8a3a, 6, 14);
  { // demir fırın, üstünde bakır tencereler
    add(new THREE.BoxGeometry(3.0, 1.0, 1.0), iron, -25.5, 0.5, -18.3);
    add(new THREE.BoxGeometry(3.1, 0.06, 1.1), new THREE.MeshStandardMaterial({color:0x2a2a30, metalness:0.8, roughness:0.3}), -25.5, 1.03, -18.3);
    [-0.9, 0, 0.9].forEach((dx, i) => { add(new THREE.CylinderGeometry(0.22 - i * 0.03, 0.2 - i * 0.03, 0.26 + i * 0.05, 18), copper, -25.5 + dx, 1.2, -18.25); });
    add(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 10), iron, -24.4, 2.5, -18.6);
    rectC(-27.1, -18.85, -23.9, -17.7, 0, 2);
  }
  { // orta tezgâh ve yiyecekler
    table(-28.2, -14.0, -21.8, -12.4, 0, false);
    const bread = new THREE.MeshStandardMaterial({color:0xb7793a, roughness:0.8}), cheese = new THREE.MeshStandardMaterial({color:0xe9c24a, roughness:0.6});
    for (let i = 0; i < 5; i++){ const b = add(new THREE.CapsuleGeometry(0.1, 0.32, 4, 8), bread, -27.6 + i * 0.36, 0.9, -13.6); b.rotation.z = Math.PI / 2; b.rotation.y = rnd() * 0.4; }
    [[-25.6, -12.9], [-25.0, -13.0]].forEach(([x, z]) => add(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20), cheese, x, 0.87, z));
    [[0x5a8a2a, 0.17], [0x7a3a8a, 0.12], [0xc22a2a, 0.07], [0xd96a1a, 0.08]].forEach(([c, r], k) => { const m = new THREE.MeshStandardMaterial({color:c, roughness:0.6}); for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(r, 12, 8), m, -24.2 + (k % 2) * 0.6 + rnd() * 0.3, 0.8 + r, -13.7 + Math.floor(k / 2) * 0.7 + rnd() * 0.25); });
    add(new THREE.CylinderGeometry(0.26, 0.24, 0.1, 24), new THREE.MeshStandardMaterial({color:0xd9a65a, roughness:0.6}), -22.6, 0.86, -13.2);
    add(new THREE.BoxGeometry(0.5, 0.04, 0.32), wood, -26.6, 0.82, -12.8);
    // asılı bakır tencere askısı ve kurutulmuş otlar
    add(new THREE.BoxGeometry(5.4, 0.08, 0.08), iron, -25, 3.6, -13.2);
    for (let i = 0; i < 7; i++){ const x = -27.4 + i * 0.8; add(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4), iron, x, 3.38, -13.2); add(new THREE.CylinderGeometry(0.16 + (i % 3) * 0.04, 0.14 + (i % 3) * 0.04, 0.22, 16), copper, x, 3.06, -13.2); }
    const herb = new THREE.MeshStandardMaterial({color:0x6f8a3a, roughness:0.9});
    for (let i = 0; i < 12; i++){ const h = add(new THREE.ConeGeometry(0.08, 0.36, 6), herb, -30 + i * 0.9, 4.45, -16.1); h.rotation.x = Math.PI; }
  }
  { // tabak rafı, eviye, fıçılar
    add(new THREE.BoxGeometry(3.4, 2.6, 0.4), wood, -20.9, 1.3, -18.55);
    const plate = new THREE.MeshStandardMaterial({color:0xf2f0ea, roughness:0.3});
    for (let r = 0; r < 4; r++){ add(new THREE.BoxGeometry(3.4, 0.04, 0.42), darkWood, -20.9, 0.5 + r * 0.6, -18.5); for (let k = 0; k < 8; k++){ const pt = add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), plate, -22.3 + k * 0.4, 0.68 + r * 0.6, -18.45); pt.rotation.x = Math.PI / 2 - 0.25; } }
    rectC(-22.7, -18.85, -19.1, -18.2, 0, 3);
    add(new THREE.BoxGeometry(1.6, 0.85, 0.8), M.stoneMat, -29.6, 0.43, -18.35);
    const w = add(new THREE.PlaneGeometry(1.3, 0.55), new THREE.MeshStandardMaterial({color:0x3a5a6a, metalness:0.3, roughness:0.05}), -29.6, 0.86, -18.35); w.rotation.x = -Math.PI / 2;
    rectC(-30.4, -18.8, -28.8, -17.9, 0, 1.2);
    const barrel = new THREE.MeshStandardMaterial({color:0x6a4426, roughness:0.75});
    [[-30.3, -8.0], [-29.3, -8.0], [-30.3, -9.0]].forEach(([x, z]) => { add(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16), barrel, x, 0.55, z); [0.2, 0.9].forEach(y => add(new THREE.TorusGeometry(0.43, 0.02, 4, 24), iron, x, y, z).rotation.x = Math.PI / 2); circC(x, z, 0.45, 0, 1.2, true); });
  }

  // --- çalışan odası ---
  {
    rug(-13, -12, 6, 3.6, 0, '#5a4a32', '#b8a274');
    const wool = [0x8a2a2a, 0x2a4a7a, 0x4a6a3a, 0x7a5a2a];
    [-17.4, -14.9, -12.4, -9.9].forEach((x, i) => {
      add(new THREE.BoxGeometry(1.05, 0.4, 2.1), wood, x, 0.3, -17.75);
      add(new THREE.BoxGeometry(0.95, 0.18, 2.0), linen, x, 0.58, -17.75);
      add(new THREE.BoxGeometry(0.98, 0.08, 1.3), new THREE.MeshStandardMaterial({color:wool[i], roughness:0.95}), x, 0.7, -17.35);
      add(new THREE.BoxGeometry(0.6, 0.14, 0.35), linen, x, 0.72, -18.5);
      add(new THREE.BoxGeometry(1.05, 0.9, 0.08), wood, x, 0.75, -18.82);
      add(new THREE.BoxGeometry(0.85, 0.5, 0.5), darkWood, x, 0.25, -16.35);
      rectC(x - 0.55, -18.85, x + 0.55, -16.1, 0, 1);
    });
    table(-14.6, -12.2, -11.4, -11.0, 0, false);
    [-12.75, -10.45].forEach(z => { add(new THREE.BoxGeometry(3.0, 0.08, 0.35), wood, -13, 0.45, z); [-1.3, 1.3].forEach(dx => add(new THREE.BoxGeometry(0.08, 0.45, 0.3), wood, -13 + dx, 0.22, z)); rectC(-14.5, z - 0.2, -11.5, z + 0.2, 0, 0.6, true); });
    candelabra(-13, 0.8, -11.6);
    // lavabo ve sürahi
    add(new THREE.BoxGeometry(0.8, 0.85, 0.5), wood, -18.45, 0.43, -9.2);
    add(new THREE.CylinderGeometry(0.25, 0.18, 0.12, 18), new THREE.MeshStandardMaterial({color:0xf3f0e8, roughness:0.2}), -18.45, 0.92, -9.2);
    add(new THREE.CylinderGeometry(0.07, 0.1, 0.3, 12), new THREE.MeshStandardMaterial({color:0xf3f0e8, roughness:0.2}), -18.2, 1.05, -9.05);
    rectC(-18.9, -9.5, -18.0, -8.9, 0, 1.2);
    // askılık ve ceketler
    add(new THREE.BoxGeometry(0.06, 0.1, 3.0), wood, -7.2, 1.9, -14);
    [0x1d1d26, 0x2a3f7a, 0xf2efe8, 0x1d1d26].forEach((c, i) => add(new THREE.BoxGeometry(0.12, 0.9, 0.45), new THREE.MeshStandardMaterial({color:c, roughness:0.85}), -7.32, 1.42, -15.1 + i * 0.75));
  }
  pl(-13, 3.8, -13, 0xffd6a0, 4, 14);
  fireLight.userData.k = 1; fireK.userData.k = 1;

  /* ================= çalışanlar ================= */
  const staff = [];
  function staffMember(kind, name, lx, ly, lz, rot, opts = {}){
    const g = world.makeGuard();
    g.userData.armR.children.forEach(c => { if (c.isGroup) c.visible = false; });
    const look = {
      asci:{coat:0xf2efe8, legs:0x8a8a8a}, hizmetci:{coat:0x1d1d26, legs:0x1d1d26}, usak:{coat:0x2a3f7a, legs:0xf3f0e8},
      kutuphaneci:{coat:0x5a3a22, legs:0x3a2a1c}, seyis:{coat:0x6b4a2e, legs:0xcab89a},
    }[kind];
    const coatM = new THREE.MeshStandardMaterial({color:look.coat, roughness:0.75}), legM = new THREE.MeshStandardMaterial({color:look.legs, roughness:0.8});
    g.traverse(o => { if (!o.isMesh) return; if (o.material === M.coatMat) o.material = coatM; else if (o.material === M.whiteMat) o.material = legM; else if (o.material === M.redMat) o.material = coatM; if (o.material === M.hatMat) o.visible = false; });
    const white = new THREE.MeshStandardMaterial({color:0xf6f3ec, roughness:0.9});
    if (kind === 'asci'){ world.part(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 14), white, 0, 2.05, 0, g); world.part(new THREE.SphereGeometry(0.19, 14, 8), white, 0, 2.22, 0, g).scale.y = 0.6; }
    if (kind === 'hizmetci'){
      world.part(new THREE.CylinderGeometry(0.24, 0.42, 0.78, 16), coatM, 0, 0.66, 0, g);
      world.part(new THREE.SphereGeometry(0.15, 12, 8), white, 0, 1.9, -0.03, g).scale.set(1.05, 0.55, 1.05);
    }
    if (kind === 'asci' || kind === 'hizmetci') world.part(new THREE.BoxGeometry(0.4, 0.7, 0.03), white, 0, 1.0, 0.18, g);
    if (kind === 'usak' || kind === 'kutuphaneci') world.part(new THREE.SphereGeometry(0.16, 14, 10), white, 0, 1.86, -0.03, g).scale.set(1.05, 0.9, 1.1);
    if (kind === 'usak') world.part(new THREE.BoxGeometry(0.5, 0.04, 0.3), gold, 0, 1.3, 0, g);
    if (kind === 'kutuphaneci'){ [-1, 1].forEach(sd => world.part(new THREE.TorusGeometry(0.045, 0.008, 6, 14), gold, sd * 0.055, 1.82, 0.13, g)); const bk = world.part(new THREE.BoxGeometry(0.2, 0.26, 0.05), new THREE.MeshStandardMaterial({color:0x7a1f24}), 0, -0.55, 0.12, g.userData.armL); g.userData.armL.rotation.x = -0.9; }
    g.position.set(lx, ly, lz); g.rotation.y = rot; root.add(g);
    const st = {g, name, kind, y:ly, path:opts.path || null, i:1, dir:1, speed:opts.speed || 1.1, wait:0, waitAt:opts.waitAt || 0, phase:rnd() * 6, home:rot, lines:opts.lines || [], loop:opts.loop};
    staff.push(st);
    interact.push({zone:'ic', r:2.1, label:'Konuş', get x(){ return O.x + g.position.x; }, get z(){ return O.z + g.position.z; }, y:O.y + ly, show:() => true,
      act:() => opts.act ? opts.act() : hooks.ui.dialog([{name, text:st.lines[Math.floor(rnd() * st.lines.length)]}])});
    return st;
  }
  C.dynamics.push(() => staff.map(s => ({x:O.x + s.g.position.x, z:O.z + s.g.position.z, r:0.38, y0:O.y + s.y, y1:O.y + s.y + 2})));
  staffMember('asci', 'Aşçıbaşı Marcel', -25.4, 0, -11.6, Math.PI, {act:() => hooks.cook()});
  staffMember('hizmetci', 'Mutfak yamağı Lise', -29.4, 0, -11, 0, {path:[[-29.4, -11], [-22.6, -10.6], [-20.6, -11.2], [-20.6, -16.6], [-27.6, -16.4], [-29.0, -15.8]], loop:true, waitAt:2.5, speed:1.0,
    lines:['Ocağın ateşini sabaha kadar sönmeden tutmak benim işim.', 'Marcel bağırınca korkma, tatlısı her şeyi affettirir.', 'Fıçılardaki elma şarabına dokunma, kontes onu bayramlara saklıyor.']});
  staffMember('hizmetci', 'Hizmetçi Colette', -3.2, 0, -6.6, 0, {path:[[-3.2, -6.6], [3.2, -6.6], [3.4, 1.4], [-3.2, 1.4]], loop:true, waitAt:1.5,
    lines:['Avizenin bütün mumlarını her akşam tek tek yakıyorum. Tam yüz yirmi tane!', 'Aynalı Galeri\'yi silmek bütün bir sabahımı alıyor.', 'Kâhya Bernard görmeden biraz soluklanıyorum.']});
  staffMember('usak', 'Uşak Pierre', -27, 5, 3, Math.PI / 2, {path:[[-27, 3], [-10.5, 3]], waitAt:2, speed:0.9,
    lines:['Galerideki aynalar Venedik\'ten geldi. Her biri bir servet.', 'Akşam balosu için mumlar hazır, yalnız misafir eksik.', 'Kontesin odasına izinsiz girmeyin… ama madem girdiniz, portreye bir bakın.']});
  staffMember('hizmetci', 'Oda hizmetçisi Margot', 12.5, 5, 3, 0, {path:[[12.5, 3], [25.5, -3.6], [16.5, -3.2]], loop:true, waitAt:2.2, speed:0.9,
    lines:['Kontesin yatağını her gün yeniden yapıyorum, sanki bu gece dönecekmiş gibi.', 'Gardıropta hâlâ mavi ipek elbisesi asılı.']});
  staffMember('kutuphaneci', 'Kütüphaneci Aubert', -5.4, 10, -1.6, Math.PI / 2, {
    lines:['Bu raflarda dört bin cilt var. Yarısını okudum, öbür yarısını da okuyacağım.', 'Döner merdiven kubbeye çıkar. Halının başladığı yerden basın, yoksa korkuluğa takılırsınız.', 'Rünler hakkında tek bir kitap var, o da kayıp. Belki de tapınaktadır.']});
  staffMember('hizmetci', 'Hizmetçi Babette', -13, 0, -9.3, Math.PI, {
    lines:['Burası bizim odamız. Gün bitince hepimiz bu masada toplanırız.', 'Marcel\'in portakallı tartından bir dilim kalırsa kavga çıkar!']});
  staffMember('seyis', 'Seyis Jules', -9.0, 0, -15.6, -Math.PI / 2, {
    lines:['Étoile\'i ben yetiştirdim. Şatonun içinde at gezdirmek de nereden çıktı?', 'Harasta yeni doğan bir tay var, görmeye gidin.']});

  function updateStaff(dt, hero){
    staff.forEach(st => {
      const u = st.g.userData; let moving = 0;
      const hx = hero.pos.x - O.x, hz = hero.pos.z - O.z, near = Math.hypot(hx - st.g.position.x, hz - st.g.position.z) < 2.6 && Math.abs(hero.pos.y - O.y - st.y) < 1.5;
      if (near){ world.turnToward(st.g, Math.atan2(hx - st.g.position.x, hz - st.g.position.z), Math.min(1, dt * 4)); }
      else if (st.path){
        if (st.wait > 0) st.wait -= dt;
        else {
          const [tx, tz] = st.path[st.i], dx = tx - st.g.position.x, dz = tz - st.g.position.z, d = Math.hypot(dx, dz);
          if (d < 0.15){
            st.wait = st.waitAt;
            if (st.loop) st.i = (st.i + 1) % st.path.length; else { if (st.i + st.dir >= st.path.length || st.i + st.dir < 0) st.dir *= -1; st.i += st.dir; }
          } else {
            const step = Math.min(d, st.speed * dt); st.g.position.x += dx / d * step; st.g.position.z += dz / d * step;
            world.turnToward(st.g, Math.atan2(dx, dz), Math.min(1, dt * 6)); moving = 1;
          }
        }
      } else world.turnToward(st.g, st.home, Math.min(1, dt * 2));
      st.phase += dt * st.speed * 5.2 * moving;
      u.legL.rotation.x = Math.sin(st.phase) * 0.5 * moving; u.legR.rotation.x = -Math.sin(st.phase) * 0.5 * moving;
      if (st.kind !== 'kutuphaneci') u.armL.rotation.x = -Math.sin(st.phase) * 0.35 * moving;
      u.armR.rotation.x = Math.sin(st.phase) * 0.35 * moving;
    });
  }
  markers.push({id:'mutfak', color:'#ff8a1a', label:'Mutfak', ...{x:O.x - 25.4, z:O.z - 11.6, y:O.y}, show:() => hooks.showKitchen && hooks.showKitchen()});

  /* ================= madalyonlar (iç mekân) ================= */
  const coinGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.06, 28); coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({color:0xf3c74c, metalness:1, roughness:0.22, emissive:0x5a3c00, emissiveIntensity:0.8});
  [[-29.5, 0, -5.5], [-30, 5, 0], [10.2, 5, 5.4], [-5.8, 10, 7.6], [3.6, 15, 3.0]].forEach(([x, y, z], i) => {
    const g = add(coinGeo, coinMat, x, y + 1.0, z); coins.push({id:100 + i, g, x:O.x + x, y:O.y + y, z:O.z + z, ly:y});
  });

  /* ================= etkileşimler ================= */
  const W = (x, y, z) => ({x:O.x + x, y:O.y + y, z:O.z + z});
  function it(lx, ly, lz, r, label, act, show = () => true){ const p = W(lx, ly, lz); interact.push({x:p.x, y:p.y, z:p.z, r, label, act, show, zone:'ic'}); }
  it(0, 0, 7.6, 2.0, 'Bahçeye çık', () => hooks.exit());
  it(2.6, 0, 4.2, 2.4, 'Konuş', () => hooks.ui.dialog([
    {name:'Kâhya Bernard', text:'Lumière Şatosu\'na hoş geldiniz. Kontes yıllardır ortalarda yok ama şato her sabah onu bekliyormuş gibi hazırlanır.'},
    {name:'Kâhya Bernard', text:'Büyük merdiven sizi Aynalı Galeri\'ye ve kontesin odasına çıkarır. Doğudaki ikinci merdiven kütüphaneye, oradaki döner merdiven de kubbedeki rasathaneye gider.'},
    {name:'Kâhya Bernard', text:'Kubbedeki teleskoptan bütün malikâne görünür. Bir de… madalyonlar kontesin hazinesinden kalmaymış. Şatonun içinde de beş tane gördüm, söylemedi demeyin.'},
  ]));
  it(25, 0, 2.2, 2.4, 'Klavseni çal', () => hooks.playHarpsichord());
  it(24, 5, -6.0, 2.2, 'Portreye bak', () => hooks.ui.dialog([
    {name:'Kontes Éléonore de Lumière, 1724', text:'Mavi ipek elbiseli, inci kolyeli bir kadın. Boynundaki tek taş kırmızı ve tablonun içinden parlıyor gibi.'},
    {name:'', text:'Çerçevenin altına küçük harflerle bir not kazınmış: "Beş ışık bir olduğunda kılıç uyanır."'},
  ]));
  it(-4.6, 10, -4.8, 2.0, 'Yerküreye bak', () => hooks.ui.dialog([{name:'', text:'Eski bir yerküre. Biri Boğaz\'ın üstüne mürekkeple küçük kırmızı bir yıldız çizmiş: İstanbul.'}]));
  it(0, 15, -4.4, 2.2, 'Teleskoptan bak', () => hooks.gaze());
  it(-30, 0, 0, 2.6, 'Şömineye bak', () => hooks.ui.dialog([{name:'', text:'Ateş çıtırdıyor. Mermer rafta Kontes\'in kılıcı tapınağa götürdüğü günü anlatan küçük bir kabartma var.'}]));

  markers.push({id:'cikis', color:'#ffffff', label:'Çıkış', ...W(0, 0, 8.6), show:() => true});
  markers.push({id:'kubbe', color:'#7fb2ff', label:'Rasathane', ...W(0, 15, -4.4), show:() => true});

  /* ================= tavan yüksekliği (kamera için) ================= */
  C.ceiling = (x, z, y) => {
    const lx = x - O.x, lz = z - O.z, ly = y - O.y;
    if (ly >= 14.4) return O.y + 26;
    if (ly >= 9.4) return O.y + (Math.hypot(lx - SP.cx, lz - SP.cz) < 2.2 ? 24 : 14.7);
    if (ly >= 4.4) return O.y + 9.7;
    if (lx > -7 && lx < 7 && lz > -4.2 && lz < 9) return O.y + 9.7;
    return O.y + 4.7;
  };

  /* ================= güncelleme ================= */
  const tmp = new THREE.Color();
  function update(dt, t, hero, S, onCoin){
    const Wt = world.W, night = Wt.night, k = world.weatherKey;
    const day = Math.max(0, 1 - night) * (1 - 0.35 * Wt.clouds);
    tmp.setRGB(0.05 + 1.25 * day, 0.07 + 1.33 * day, 0.16 + 1.45 * day);
    if (k === 'gunbatimi') tmp.multiply(new THREE.Color(1.35, 0.82, 0.55));
    if (!envReady) winMat.color.copy(tmp); else winMat.color.setScalar(0.92);
    const indoor = hero.zone === 'ic';
    lights.forEach(({l, base}) => { l.intensity = indoor ? base * (0.75 + 0.5 * night) : 0; });
    if (!indoor) return;
    fireLight.intensity = 6 * (0.8 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.1);
    fires.forEach(f => { f.o.scale.set(1, 0.8 + Math.sin(t * 9 + f.p) * 0.2 + Math.sin(t * 17 + f.p) * 0.1, 1); });
    fireK.intensity = 6 * (0.8 + Math.sin(t * 11 + 1) * 0.1 + Math.sin(t * 6.1) * 0.1);
    updateStaff(dt, hero);
    spinners.forEach(s => { if (s.axis === 'y') s.o.rotation.y += dt * s.s; else s.o.rotation.z += dt * s.s; });
    // kâhya oyuncuya döner
    const bx = O.x + butler.position.x, bz = O.z + butler.position.z;
    if (Math.hypot(hero.pos.x - bx, hero.pos.z - bz) < 6 && Math.abs(hero.pos.y - O.y) < 1.5) world.turnToward(butler, Math.atan2(hero.pos.x - bx, hero.pos.z - bz), Math.min(1, dt * 3));
    coins.forEach(c => {
      if (S.coins.includes(c.id)){ c.g.visible = false; return; }
      c.g.rotation.y += dt * 2.2; c.g.position.y = c.ly + 1.0 + Math.sin(t * 2 + c.id) * 0.12;
      if (Math.hypot(c.x - hero.pos.x, c.z - hero.pos.z) < 1.3 && Math.abs(c.y - hero.pos.y) < 1.6){ c.g.visible = false; onCoin(c.id); }
    });
  }

  function setWindowEnv(tex){ winMat.envMap = tex; envReady = true; winMat.needsUpdate = true; }
  return {root, C, interact, markers, update, O, coins, setWindowEnv};
}
