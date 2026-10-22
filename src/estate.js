// Malikânenin ek alanları: at çiftliği (haras), iki sera, kış bahçesi,
// rüzgârla dalgalanan çayırlar, bayraklar ve uçuşan yapraklar.
export function buildEstate(world, C){
  const { THREE, scene, materials:M, windMat, timeU, windU, CZ } = world;
  const root = new THREE.Group(); root.name = 'Malikane'; scene.add(root);
  const doors = {};   // bina kapılarının önü: içleri rooms-lumiere.js bağlar
  let seed = 99; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const interact = [], markers = [], updaters = [];
  const meadows = [];

  /* ================= ortak malzemeler ================= */
  function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function tex(c, rx, ry){ const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  const glass = new THREE.MeshStandardMaterial({color:0xdff3f6, metalness:0.15, roughness:0.04, transparent:true, opacity:0.16, envMapIntensity:1.6, side:THREE.DoubleSide, depthWrite:false});
  const iron = new THREE.MeshStandardMaterial({color:0xf1efe8, metalness:0.35, roughness:0.4});
  const terracotta = new THREE.MeshStandardMaterial({color:0xb5643c, roughness:0.85});
  const leafDark = new THREE.MeshStandardMaterial({color:0x2c5a26, roughness:0.75, flatShading:true});
  const palmLeaf = new THREE.MeshStandardMaterial({color:0x3f7d2c, roughness:0.7, side:THREE.DoubleSide});
  const trunkMat = new THREE.MeshStandardMaterial({color:0x7a6248, roughness:0.95});
  const waterMat = new THREE.MeshStandardMaterial({color:0x234a52, metalness:0.3, roughness:0.05, transparent:true, opacity:0.9});
  // ahşap kaplama
  const [wc, wdg] = canvas(256, 256);
  for (let x = 0; x < 256; x += 16){ const v = 0.85 + rnd() * 0.3; wdg.fillStyle = `rgb(${120 * v | 0},${46 * v | 0},${32 * v | 0})`; wdg.fillRect(x, 0, 16, 256); wdg.fillStyle = 'rgba(0,0,0,.35)'; wdg.fillRect(x, 0, 1.5, 256);
    for (let k = 0; k < 6; k++){ wdg.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`; wdg.fillRect(x + 2 + rnd() * 12, rnd() * 256, 1, 20 + rnd() * 60); } }
  const barnWood = new THREE.MeshStandardMaterial({map:tex(wc, 3, 1), roughness:0.85});
  const [nc, ng] = canvas(256, 256);
  ng.fillStyle = '#7d6a52'; ng.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 21){ ng.fillStyle = `rgba(${90 + rnd() * 40 | 0},${70 + rnd() * 30 | 0},${50 + rnd() * 20 | 0},.6)`; ng.fillRect(x, 0, 20, 256); ng.fillStyle = 'rgba(0,0,0,.4)'; ng.fillRect(x, 0, 1, 256); }
  const greyWood = new THREE.MeshStandardMaterial({map:tex(nc, 2, 1), roughness:0.9});
  const whiteWood = new THREE.MeshStandardMaterial({color:0xf3efe6, roughness:0.6});
  // saman
  const [hc, hg] = canvas(128, 128); hg.fillStyle = '#c9a54e'; hg.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++){ hg.strokeStyle = `rgba(${150 + rnd() * 90 | 0},${110 + rnd() * 70 | 0},${30 + rnd() * 40 | 0},.8)`; hg.beginPath(); const x = rnd() * 128, y = rnd() * 128, a = rnd() * 0.6 - 0.3; hg.moveTo(x, y); hg.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); hg.stroke(); }
  const hayMat = new THREE.MeshStandardMaterial({map:tex(hc, 2, 1), roughness:1});
  // kum (manej)
  const [kc, kg] = canvas(256, 256); kg.fillStyle = '#cdb68e'; kg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++){ const v = 150 + rnd() * 80; kg.fillStyle = `rgba(${v},${v - 20 | 0},${v - 55 | 0},.5)`; kg.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5); }
  const sandMat = new THREE.MeshStandardMaterial({map:tex(kc, 10, 6), roughness:1});
  const dirtMat = new THREE.MeshStandardMaterial({map:M.gravelMat.map, color:0x9a8466, roughness:0.95});

  function add(geo, mat, x, y, z, parent = root, cast = true){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  function plane(w, d, mat, x, y, z, rot = 0){ const m = add(new THREE.PlaneGeometry(w, d), mat, x, y, z, root, false); m.rotation.set(-Math.PI / 2, 0, rot); return m; }

  /* ================= cam sera yapıcı ================= */
  // Uzun ekseni Z boyunca; tavanı yarım silindir (basık).
  function glasshouse({cx, cz, w, l, h, roofH, doors}){
    const g = new THREE.Group(); g.position.set(cx, 0, cz); root.add(g);
    const hw = w / 2, hl = l / 2;
    const ribs = [], posts = [];
    // kaide (taş) ve camlar; kapı boşluklarını atla
    const sides = [
      {id:'E', a:[hw, -hl], b:[hw, hl]}, {id:'W', a:[-hw, -hl], b:[-hw, hl]},
      {id:'N', a:[-hw, -hl], b:[hw, -hl]}, {id:'S', a:[-hw, hl], b:[hw, hl]},
    ];
    sides.forEach(sd => {
      const len = Math.hypot(sd.b[0] - sd.a[0], sd.b[1] - sd.a[1]), alongX = sd.a[1] === sd.b[1];
      const gaps = (doors || []).filter(d => d.side === sd.id).map(d => [d.at - d.width / 2, d.at + d.width / 2]);
      const segs = []; let s0 = -len / 2;
      gaps.sort((a, b) => a[0] - b[0]).forEach(([g0, g1]) => { if (g0 > s0) segs.push([s0, g0]); s0 = g1; }); if (s0 < len / 2) segs.push([s0, len / 2]);
      const mx = (sd.a[0] + sd.b[0]) / 2, mz = (sd.a[1] + sd.b[1]) / 2;
      segs.forEach(([u0, u1]) => {
        const sl = u1 - u0, um = (u0 + u1) / 2;
        const px = alongX ? mx + um : mx, pz = alongX ? mz : mz + um;
        const pl = add(new THREE.PlaneGeometry(sl, h - 0.6), glass, px, 0.6 + (h - 0.6) / 2, pz, g, false); pl.rotation.y = alongX ? 0 : Math.PI / 2; pl.renderOrder = 2;
        add(new THREE.BoxGeometry(alongX ? sl : 0.35, 0.6, alongX ? 0.35 : sl), M.stoneMat, px, 0.3, pz, g);
        C.box(cx + px, cz + pz, alongX ? sl / 2 : 0.2, alongX ? 0.2 : sl / 2);
        for (let u = u0; u <= u1 + 0.01; u += Math.max(1.2, sl / Math.max(1, Math.round(sl / 2)))) posts.push(alongX ? [mx + u, mz] : [mx, mz + u]);
      });
      gaps.forEach(([g0, g1]) => { // kapı kemeri
        const um = (g0 + g1) / 2, px = alongX ? mx + um : mx, pz = alongX ? mz : mz + um;
        const top = add(new THREE.BoxGeometry(alongX ? g1 - g0 + 0.3 : 0.15, 0.25, alongX ? 0.15 : g1 - g0 + 0.3), iron, px, 2.75, pz, g);
        [g0, g1].forEach(u => posts.push(alongX ? [mx + u, mz] : [mx, mz + u]));
        const ped = add(new THREE.BoxGeometry(alongX ? g1 - g0 : 0.6, 0.06, alongX ? 0.6 : g1 - g0), M.stoneMat, px, 0.03, pz, g, false);
      });
    });
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, h, 0.1), iron, posts.length), m4 = new THREE.Matrix4();
    posts.forEach(([x, z], i) => { m4.makeTranslation(x, h / 2, z); pm.setMatrixAt(i, m4); }); pm.castShadow = true; g.add(pm);
    // korniş
    [[0, -hl, w, 0.16], [0, hl, w, 0.16], [-hw, 0, 0.16, l], [hw, 0, 0.16, l]].forEach(([x, z, a, b]) => add(new THREE.BoxGeometry(a + 0.1, 0.18, b + 0.1), iron, x, h, z, g));
    // tavan
    const roofG = new THREE.CylinderGeometry(hw, hw, l, 28, 1, true, Math.PI / 2, Math.PI); roofG.rotateX(Math.PI / 2); roofG.scale(1, roofH / hw, 1);
    const roof = add(roofG, glass, 0, h, 0, g, false); roof.renderOrder = 2;
    const nR = Math.round(l / 2.4);
    for (let i = 0; i <= nR; i++){
      const r = add(new THREE.TorusGeometry(hw, 0.06, 6, 28, Math.PI), iron, 0, h, -hl + i * l / nR, g); r.scale.y = roofH / hw;
    }
    add(new THREE.BoxGeometry(0.12, 0.12, l), iron, 0, h + roofH, 0, g);
    // alın camları
    [-hl, hl].forEach(z => { const e = add(new THREE.CircleGeometry(hw, 28, 0, Math.PI), glass, 0, h, z, g, false); e.scale.y = roofH / hw; e.renderOrder = 2; });
    // zemin
    const fl = add(new THREE.PlaneGeometry(w - 0.4, l - 0.4), M.gravelMat, 0, 0.03, 0, g, false); fl.rotation.x = -Math.PI / 2;
    return g;
  }

  /* ================= bitkiler ================= */
  function orangeTree(parent, x, z, k = 1, fruit = 0xff8a1a){
    add(new THREE.CylinderGeometry(0.42 * k, 0.32 * k, 0.6 * k, 14), terracotta, x, 0.3 * k, z, parent);
    add(new THREE.CylinderGeometry(0.05 * k, 0.07 * k, 1.0 * k, 6), trunkMat, x, 1.0 * k, z, parent);
    const can = add(new THREE.IcosahedronGeometry(0.75 * k, 1), leafDark, x, 1.9 * k, z, parent);
    const fr = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075 * k, 8, 6), new THREE.MeshStandardMaterial({color:fruit, roughness:0.5}), 14), m4 = new THREE.Matrix4();
    for (let i = 0; i < 14; i++){ const th = rnd() * 6.28, ph = rnd() * 2.2; m4.makeTranslation(x + Math.sin(ph) * Math.cos(th) * 0.74 * k, 1.9 * k + Math.cos(ph) * 0.7 * k, z + Math.sin(ph) * Math.sin(th) * 0.74 * k); fr.setMatrixAt(i, m4); }
    parent.add(fr); return can;
  }
  const frondGeo = (() => {
    const g = new THREE.PlaneGeometry(0.55, 2.6, 1, 8); g.translate(0, 1.3, 0);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++){ const y = p.getY(i), t = y / 2.6; p.setX(i, p.getX(i) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05))); p.setZ(i, -t * t * 1.4); }
    g.computeVertexNormals(); return g;
  })();
  function palm(parent, x, z, H = 5, lean = 0.25){
    const segs = 8, pts = [];
    for (let i = 0; i <= segs; i++){ const t = i / segs; pts.push(new THREE.Vector3(x + Math.sin(t * 1.4) * lean * H * 0.4, t * H, z)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    add(new THREE.TubeGeometry(curve, 12, 0.16, 7), trunkMat, 0, 0, 0, parent);
    const top = pts[segs];
    for (let i = 0; i < 9; i++){
      const f = add(frondGeo, palmLeaf, top.x, top.y, top.z, parent);
      f.rotation.order = 'YXZ'; f.rotation.y = i / 9 * Math.PI * 2 + rnd() * 0.3; f.rotation.x = 0.9 + rnd() * 0.35;
    }
  }
  function fern(parent, x, z, k = 1){
    for (let i = 0; i < 6; i++){ const f = add(frondGeo, palmLeaf, x, 0.05, z, parent, false); f.scale.setScalar(0.35 * k); f.rotation.order = 'YXZ'; f.rotation.y = i / 6 * 6.28; f.rotation.x = 1.0; }
  }
  function flowerBed(parent, x0, z0, x1, z1, n, palette){
    const g = new THREE.IcosahedronGeometry(0.08, 0), im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({roughness:0.6}), n), m4 = new THREE.Matrix4(), c = new THREE.Color();
    for (let i = 0; i < n; i++){ m4.makeTranslation(x0 + rnd() * (x1 - x0), 0.15 + rnd() * 0.25, z0 + rnd() * (z1 - z0)); im.setMatrixAt(i, m4); c.set(palette[i % palette.length]); im.setColorAt(i, c); }
    parent.add(im);
    const soil = add(new THREE.BoxGeometry(x1 - x0 + 0.3, 0.2, z1 - z0 + 0.3), new THREE.MeshStandardMaterial({color:0x3b2a1e, roughness:1}), (x0 + x1) / 2, 0.1, (z0 + z1) / 2, parent, false);
  }
  function bench(parent, x, z, rot){
    const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = rot; parent.add(b);
    add(new THREE.BoxGeometry(1.8, 0.08, 0.45), greyWood, 0, 0.48, 0, b); add(new THREE.BoxGeometry(1.8, 0.4, 0.06), greyWood, 0, 0.78, -0.22, b);
    [-0.8, 0.8].forEach(s => add(new THREE.BoxGeometry(0.06, 0.48, 0.45), M.darkMetal, s, 0.24, 0, b));
    C.box(parent.position.x + x, parent.position.z + z, 0.95, 0.3, rot);
  }

  /* ================= seralar ================= */
  // Sol: Portakal serası (orangerie)
  const GH_L = {cx:-40, cz:42, w:9, l:24}, GH_R = {cx:40, cz:42, w:9, l:24};
  const ghL = glasshouse({...GH_L, h:4.2, roofH:2.8, doors:[{side:'E', at:0, width:2.4}, {side:'S', at:0, width:2.0}]});
  for (let i = 0; i < 5; i++){ [-2.6, 2.6].forEach(dx => { const z = -9 + i * 4.5; if (Math.abs(z) < 1.5 && dx > 0) return; orangeTree(ghL, dx, z, 1, i % 2 ? 0xffd23a : 0xff8a1a); C.circle(GH_L.cx + dx, GH_L.cz + z, 0.45); }); }
  flowerBed(ghL, -3.9, -11, -3.2, 11, 260, ['#ff3b5c', '#ffffff', '#ff70a6']);
  bench(ghL, 1.6, 10.2, Math.PI);
  // Sağ: Tropik sera
  const ghR = glasshouse({...GH_R, h:4.6, roofH:3.4, doors:[{side:'W', at:0, width:2.4}, {side:'S', at:0, width:2.0}]});
  [[-2.4, -8, 5.2, 0.3], [2.6, -3, 6.2, -0.25], [-2.6, 5, 5.8, 0.35], [2.3, 9, 4.6, -0.3]].forEach(([dx, dz, H, l]) => { palm(ghR, dx, dz, H, l); C.circle(GH_R.cx + dx, GH_R.cz + dz, 0.3); });
  for (let i = 0; i < 10; i++) fern(ghR, (rnd() > 0.5 ? 1 : -1) * (2.8 + rnd() * 1), -10 + rnd() * 20, 0.8 + rnd() * 0.6);
  { // küçük nilüfer havuzu
    const pool = add(new THREE.CylinderGeometry(1.6, 1.6, 0.35, 32), M.stoneMat, 1.2, 0.18, 2, ghR); C.circle(GH_R.cx + 1.2, GH_R.cz + 2, 1.7);
    const w = add(new THREE.CircleGeometry(1.45, 32), waterMat, 1.2, 0.37, 2, ghR, false); w.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 6; i++){ const lp = add(new THREE.CircleGeometry(0.22, 12, 0.3, 5.8), new THREE.MeshStandardMaterial({color:0x4f8f3a, roughness:0.6}), 1.2 + Math.cos(i) * 0.8, 0.39, 2 + Math.sin(i * 1.7) * 0.8, ghR, false); lp.rotation.x = -Math.PI / 2; }
  }
  flowerBed(ghR, 3.2, -11, 3.9, 11, 220, ['#ff8c42', '#ffd23f', '#c77dff']);

  /* ================= kış bahçesi (jardin d'hiver) ================= */
  const WG = {x:0, z:118};
  const wg = new THREE.Group(); wg.position.set(WG.x, 0, WG.z); root.add(wg);
  const lights = [];
  {
    const R = 9, WING = 20, D = 8, H = 6.5;
    // kanatlar (doğu-batı)
    [-1, 1].forEach(s => {
      const cxw = s * (R + (WING - R) / 2) - s * 2.2, lw = WING - R + 4.4;
      const wingG = new THREE.Group(); wingG.position.set(cxw, 0, 0); wg.add(wingG);
      // uzun duvarlar
      [-D, D].forEach(zz => {
        const pl = add(new THREE.PlaneGeometry(lw, H - 0.6), glass, 0, 0.6 + (H - 0.6) / 2, zz, wingG, false); pl.renderOrder = 2;
        add(new THREE.BoxGeometry(lw, 0.6, 0.4), M.stoneMat, 0, 0.3, zz, wingG);
        add(new THREE.BoxGeometry(lw + 0.2, 0.2, 0.2), iron, 0, H, zz, wingG);
        C.box(WG.x + cxw - s * 0.6, WG.z + zz, lw / 2 + 0.6, 0.2);
      });
      // uç duvar
      const ex = s * (lw / 2);
      const pl = add(new THREE.PlaneGeometry(2 * D, H - 0.6), glass, ex, 0.6 + (H - 0.6) / 2, 0, wingG, false); pl.rotation.y = Math.PI / 2; pl.renderOrder = 2;
      add(new THREE.BoxGeometry(0.4, 0.6, 2 * D), M.stoneMat, ex, 0.3, 0, wingG); C.box(WG.x + cxw + ex, WG.z, 0.2, D);
      const endG = add(new THREE.CircleGeometry(D, 28, 0, Math.PI), glass, ex, H, 0, wingG, false); endG.rotation.y = Math.PI / 2; endG.scale.y = 0.55; endG.renderOrder = 2;
      // tavan
      const rg = new THREE.CylinderGeometry(D, D, lw, 28, 1, true, Math.PI / 2, Math.PI); rg.rotateX(Math.PI / 2); rg.rotateY(Math.PI / 2); rg.scale(1, 0.55, 1);
      const roof = add(rg, glass, 0, H, 0, wingG, false); roof.renderOrder = 2;
      for (let i = 0; i <= 6; i++){ const r = add(new THREE.TorusGeometry(D, 0.07, 6, 28, Math.PI), iron, -lw / 2 + i * lw / 6, H, 0, wingG); r.rotation.y = Math.PI / 2; r.scale.y = 0.55; }
      const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, H, 0.12), iron, 24), m4 = new THREE.Matrix4(); let k = 0;
      for (let i = 0; i <= 5; i++) [-D, D].forEach(zz => { m4.makeTranslation(-lw / 2 + i * lw / 5, H / 2, zz); pm.setMatrixAt(k++, m4); });
      pm.count = k; wingG.add(pm);
    });
    // merkez rotunda + kubbe
    const ROT_H = 9;
    const nP = 20, pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, ROT_H, 0.16), iron, nP), m4 = new THREE.Matrix4();
    for (let i = 0; i < nP; i++){ const a = i / nP * Math.PI * 2; m4.makeTranslation(Math.cos(a) * R, ROT_H / 2, Math.sin(a) * R); pm.setMatrixAt(i, m4); }
    wg.add(pm);
    const rotWall = add(new THREE.CylinderGeometry(R, R, ROT_H - 0.6, 40, 1, true), glass, 0, 0.6 + (ROT_H - 0.6) / 2, 0, wg, false); rotWall.renderOrder = 2;
    add(new THREE.TorusGeometry(R, 0.12, 8, 64), iron, 0, ROT_H, 0, wg).rotation.x = Math.PI / 2;
    const dome = add(new THREE.SphereGeometry(R, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, ROT_H, 0, wg, false); dome.scale.y = 0.95; dome.renderOrder = 2;
    for (let i = 0; i < 12; i++){ const r = add(new THREE.TorusGeometry(R, 0.08, 6, 32, Math.PI), iron, 0, ROT_H, 0, wg); r.rotation.y = i / 12 * Math.PI; r.scale.y = 0.95; }
    add(new THREE.CylinderGeometry(1.1, 1.3, 1.4, 16), iron, 0, ROT_H + R * 0.95 + 0.5, 0, wg);
    add(new THREE.SphereGeometry(0.4, 16, 10), M.goldMat, 0, ROT_H + R * 0.95 + 1.5, 0, wg);
    // rotunda duvar çarpışması: kanatlara açılan ve kuzey kapısı hariç yaylar
    const segN = 28;
    for (let i = 0; i < segN; i++){
      const a = (i + 0.5) / segN * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R;
      if (Math.abs(z) < D + 0.2) continue;                 // kanat açıklığı
      if (z < 0 && Math.abs(x) < 1.6) continue;            // kuzey kapısı
      C.box(WG.x + x, WG.z + z, 1.05, 0.22, -a + Math.PI / 2);
    }
    // giriş saçağı
    add(new THREE.BoxGeometry(3.6, 0.2, 2.0), iron, 0, 3.4, -R - 0.8, wg);
    [-1.6, 1.6].forEach(s => add(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 8), iron, s, 1.7, -R - 1.6, wg));
    // zemin (dama mermer) ve iç süsleme
    const fl = add(new THREE.CircleGeometry(R - 0.2, 48), M.marbleMat, 0, 0.04, 0, wg, false); fl.rotation.x = -Math.PI / 2;
    world.texLoader.load('assets/textures/mermer_dama.jpg', t => { t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); const mm = M.marbleMat.clone(); mm.map = t; fl.material = mm; });
    [-1, 1].forEach(s => { const f = add(new THREE.PlaneGeometry(WING - R + 3, 2 * D - 0.4), M.gravelMat, s * (R + (WING - R) / 2 - 1.5), 0.035, 0, wg, false); f.rotation.x = -Math.PI / 2; });
    // merkezde havuz ve büyük palmiye
    add(new THREE.CylinderGeometry(3.2, 3.4, 0.6, 40), M.stoneMat, 0, 0.3, 0, wg); C.circle(WG.x, WG.z, 3.4);
    const pw = add(new THREE.CircleGeometry(3.0, 40), waterMat, 0, 0.58, 0, wg, false); pw.rotation.x = -Math.PI / 2;
    palm(wg, 0, 0, 11, 0.12); palm(wg, -1.2, 1.0, 8, -0.3);
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28 + 0.2; orangeTree(wg, Math.cos(a) * 6.4, Math.sin(a) * 6.4, 0.85, i % 2 ? 0xffd23a : 0xff8a1a); if (Math.abs(Math.sin(a) * 6.4) > 1.6 || Math.cos(a) > 0) C.circle(WG.x + Math.cos(a) * 6.4, WG.z + Math.sin(a) * 6.4, 0.4); }
    // kanatlarda palmiyeler, eğrelti otları, çiçek tarhları, banklar
    [-1, 1].forEach(s => {
      for (let i = 0; i < 3; i++){ const x = s * (11.5 + i * 3.2), z = (i % 2 ? 1 : -1) * 4.4; palm(wg, x, z, 5 + rnd() * 2, 0.3 * s); C.circle(WG.x + x, WG.z + z, 0.3); fern(wg, x + 0.5, z + 0.4 * Math.sign(z), 1); }
      flowerBed(wg, s > 0 ? 10.5 : -20.5, -7.4, s > 0 ? 20.5 : -10.5, -6.6, 220, ['#ff3b5c', '#ffd23f', '#ffffff', '#c77dff']);
      flowerBed(wg, s > 0 ? 10.5 : -20.5, 6.6, s > 0 ? 20.5 : -10.5, 7.4, 220, ['#ff70a6', '#4cc9f0', '#ffffff', '#ff8c42']);
      bench(wg, s * 15, 0.0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    });
    // asılı fenerler (gece yanar)
    for (let i = 0; i < 6; i++){
      const a = i / 6 * 6.28, x = Math.cos(a) * 6, z = Math.sin(a) * 6;
      add(new THREE.CylinderGeometry(0.01, 0.01, 2.4, 4), M.darkMetal, x, ROT_H - 1.2, z, wg, false);
      const lm = add(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({color:0x332211, toneMapped:false}), x, ROT_H - 2.5, z, wg, false);
      lights.push(lm);
    }
    const warm = new THREE.PointLight(0xffc27a, 0, 26, 1.6); warm.position.set(0, 6, 0); wg.add(warm); lights.warm = warm;
    // yol: Ay Kapısı'ndan kış bahçesine
    plane(4, 14, M.gravelMat, 0, 0.02, WG.z - R - 7);
  }

  /* ================= at çiftliği (haras) ================= */
  const FARM = {x0:-160, z0:-60, x1:-76, z1:80};
  // büyük ahır
  {
    const B = {x:-104, z:-18, w:14, l:28, h:6};
    const b = new THREE.Group(); b.position.set(B.x, 0, B.z); root.add(b);
    add(new THREE.BoxGeometry(B.w, B.h, B.l), barnWood, 0, B.h / 2, 0, b);
    C.rect(B.x - B.w / 2, B.z - B.l / 2, B.x + B.w / 2, B.z + B.l / 2);
    doors.haras = {x:B.x + B.w / 2 + 1.8, z:B.z, ry:Math.PI / 2};
    const s = new THREE.Shape(); const hw = B.w / 2 + 0.5;
    s.moveTo(-hw, 0); s.lineTo(-hw * 0.72, 3.0); s.lineTo(0, 5.2); s.lineTo(hw * 0.72, 3.0); s.lineTo(hw, 0); s.closePath();
    const rg = new THREE.ExtrudeGeometry(s, {depth:B.l + 1, bevelEnabled:false}); rg.translate(0, 0, -(B.l + 1) / 2);
    add(rg, M.slateMat, 0, B.h, 0, b);
    // beyaz çerçeveli büyük kapılar (doğu cephesi) ve "X" desenleri
    for (let i = -1; i <= 1; i++){
      const dz = i * 8.5;
      add(new THREE.BoxGeometry(0.2, 4.2, 4.2), barnWood, B.w / 2 + 0.05, 2.1, dz, b);
      [[0, 4.2, 0.18, 4.4], [0, 0.1, 0.18, 4.4]].forEach(([_, y, a, c]) => add(new THREE.BoxGeometry(a, 0.18, c), whiteWood, B.w / 2 + 0.16, y, dz, b));
      [-2.1, 2.1].forEach(zz => add(new THREE.BoxGeometry(0.18, 4.3, 0.18), whiteWood, B.w / 2 + 0.16, 2.15, dz + zz, b));
      [0.78, -0.78].forEach(r => { const x = add(new THREE.BoxGeometry(0.16, 5.6, 0.16), whiteWood, B.w / 2 + 0.17, 2.1, dz, b); x.rotation.x = r; });
    }
    // samanlık penceresi ve rüzgârgülü
    add(new THREE.BoxGeometry(0.2, 1.6, 2.2), new THREE.MeshStandardMaterial({color:0x1d140e}), B.w / 2 + 0.25, B.h + 2.1, 0, b);
    add(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), M.darkMetal, 0, B.h + 6.2, 0, b);
    const vane = new THREE.Group(); vane.position.set(B.x, B.h + 7.2, B.z); root.add(vane);
    add(new THREE.BoxGeometry(1.4, 0.04, 0.04), M.darkMetal, 0, 0, 0, vane);
    const tail = add(new THREE.BoxGeometry(0.02, 0.5, 0.5), M.darkMetal, -0.7, 0, 0, vane); tail.rotation.x = Math.PI / 4;
    add(new THREE.ConeGeometry(0.08, 0.3, 6), M.darkMetal, 0.75, 0, 0, vane).rotation.z = -Math.PI / 2;
    const horseSil = add(new THREE.BoxGeometry(0.6, 0.35, 0.03), M.darkMetal, 0, 0.35, 0, vane);
    updaters.push((dt, t) => { const d = Math.atan2(-0.57, 0.82); vane.rotation.y += ((d + Math.sin(t * 0.7) * 0.25 * world.state.wind) - vane.rotation.y) * Math.min(1, dt * 2); });
  }
  // açık saman sundurması
  {
    const S = {x:-128, z:-30};
    const g = new THREE.Group(); g.position.set(S.x, 0, S.z); root.add(g);
    for (let i = 0; i < 4; i++) [-4, 4].forEach(x => { add(new THREE.BoxGeometry(0.3, 4.4, 0.3), greyWood, x, 2.2, -6 + i * 4, g); C.circle(S.x + x, S.z - 6 + i * 4, 0.25); });
    const r = add(new THREE.BoxGeometry(9.6, 0.25, 13.6), M.slateMat, 0, 4.6, 0, g); r.rotation.z = 0.12;
    const bales = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.6, 0.6), hayMat, 60), m4 = new THREE.Matrix4(); let k = 0;
    for (let y = 0; y < 4; y++) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++){ if (y === 3 && i > 2) continue; m4.makeTranslation(-2.4 + j * 1.25, 0.3 + y * 0.62, -4.5 + i * 2.1 + (y % 2) * 0.3); bales.setMatrixAt(k++, m4); }
    bales.count = k; bales.castShadow = true; g.add(bales); C.rect(S.x - 3.2, S.z - 5.4, S.x + 0.4, S.z + 5);
  }
  // yuvarlak saman balyaları (tarlada)
  {
    const g = new THREE.CylinderGeometry(0.75, 0.75, 1.2, 20); g.rotateZ(Math.PI / 2);
    const pts = [[-145, -40], [-141, -44], [-150, -22], [-146, 66], [-138, 72], [-90, 66], [-150, 10]];
    const im = new THREE.InstancedMesh(g, hayMat, pts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    pts.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, 0.75, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 3), new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); C.circle(x, z, 0.85); });
    im.castShadow = true; root.add(im);
  }
  // çit yardımcı: dikdörtgen otlak (kapı boşluklu)
  function paddock(x0, z0, x1, z1, gate){
    const posts = [], rails = [];
    const edge = (ax, az, bx, bz, side) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.ceil(len / 3.2);
      for (let i = 0; i <= n; i++){
        const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const gp = gate && gate.side === side && Math.abs((side === 'E' || side === 'W' ? z : x) - gate.at) < gate.width / 2;
        if (!gp) posts.push([x, z]);
        if (i < n){
          const t2 = (i + 0.5) / n, mx = ax + (bx - ax) * t2, mz = az + (bz - az) * t2;
          if (!(gate && gate.side === side && Math.abs((side === 'E' || side === 'W' ? mz : mx) - gate.at) < gate.width / 2)) rails.push([mx, mz, len / n, Math.atan2(bz - az, bx - ax)]);
        }
      }
    };
    edge(x0, z0, x1, z0, 'N'); edge(x1, z0, x1, z1, 'E'); edge(x1, z1, x0, z1, 'S'); edge(x0, z1, x0, z0, 'W');
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), greyWood, posts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    posts.forEach(([x, z], i) => { m4.makeTranslation(x, 0.7, z); pm.setMatrixAt(i, m4); });
    const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.1, 0.07), greyWood, rails.length * 2); let k = 0;
    rails.forEach(([x, z, l, a]) => { [0.6, 1.15].forEach(y => { m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(l, 1, 1)); rm.setMatrixAt(k++, m4); }); C.box(x, z, l / 2, 0.08, -a); });
    pm.castShadow = rm.castShadow = true; root.add(pm, rm);
  }
  paddock(-140, 2, -94, 40, {side:'E', at:21, width:4});
  // otlayan atlar (GLB modeli yüklenince gerçek ata dönüşür)
  [[0x5a3b26, 0x1a1210], [0xe8e4dc, 0x9a958c], [0x2a2420, 0x0e0c0a], [0xb07a4a, 0xf0e2c8], [0x8a8a8a, 0x2a2a2a]].forEach(([coat, mane], k) => {
    const h = world.makeHorse(coat, mane); h.position.set(-130 + k * 7, 0, 10 + (k % 2) * 16); h.rotation.y = rnd() * 6; scene.add(h);
    world.horses.push({obj:h, wander:true, target:null, wait:rnd() * 4, speed:0.8, phase:rnd() * 6, area:[-137, 5, -97, 37]});
  });
  // manej (binicilik pisti)
  {
    const A = {x:-118, z:58, rx:20, rz:11};
    const sand = add(new THREE.CircleGeometry(1, 64), sandMat, A.x, 0.025, A.z, root, false); sand.rotation.x = -Math.PI / 2; sand.scale.set(A.rx + 1, A.rz + 1, 1);
    const N = 64, posts = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const pt = i => [A.x + Math.cos(i / N * Math.PI * 2) * A.rx, A.z + Math.sin(i / N * Math.PI * 2) * A.rz];
    const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.1, 0.08), whiteWood, N * 2); let k = 0;
    for (let i = 0; i < N; i++){
      const [x, z] = pt(i), [x2, z2] = pt(i + 1);
      if (i === 0 || i === N - 1) continue; // doğu kapısı
      posts.push([x, z]);
      const l = Math.hypot(x2 - x, z2 - z), a = Math.atan2(z2 - z, x2 - x);
      [0.55, 1.1].forEach(y => { m4.compose(new THREE.Vector3((x + x2) / 2, y, (z + z2) / 2), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(l, 1, 1)); rm.setMatrixAt(k++, m4); });
      C.box((x + x2) / 2, (z + z2) / 2, l / 2, 0.08, -a);
    }
    rm.count = k;
    const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), whiteWood, posts.length);
    posts.forEach(([x, z], i) => { m4.makeTranslation(x, 0.65, z); pm.setMatrixAt(i, m4); });
    root.add(pm, rm);
    // engeller (kırmızı-beyaz)
    const [sc, sg] = canvas(64, 8); for (let i = 0; i < 8; i++){ sg.fillStyle = i % 2 ? '#ffffff' : '#c8202f'; sg.fillRect(i * 8, 0, 8, 8); }
    const stripe = new THREE.MeshStandardMaterial({map:tex(sc, 1, 1), roughness:0.6});
    [[-8, 0, 0.3], [6, -4, -0.6], [4, 5, 0.9]].forEach(([dx, dz, r]) => {
      const j = new THREE.Group(); j.position.set(A.x + dx, 0, A.z + dz); j.rotation.y = r; root.add(j);
      [-1.6, 1.6].forEach(s => add(new THREE.BoxGeometry(0.25, 1.5, 0.25), whiteWood, s, 0.75, 0, j));
      [0.5, 0.95].forEach(y => { const p = add(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), stripe, 0, y, 0, j); p.rotation.z = Math.PI / 2; });
    });
    // pistte antrenman yapan binici
    const path = []; for (let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; path.push([A.x + Math.cos(a) * (A.rx - 4), A.z + Math.sin(a) * (A.rz - 3)]); }
    const h = world.makeHorse(0x3a2618, 0x111111), rider = world.makeGuard();
    rider.userData.armR.children.forEach(c => { if (c.isGroup) c.visible = false; });
    const red = new THREE.MeshStandardMaterial({color:0x9c1b2a, roughness:0.7}); rider.traverse(o => { if (o.isMesh && o.material === M.coatMat) o.material = red; });
    rider.position.set(0, 0.92, -0.08); rider.userData.legL.rotation.set(-0.5, 0, -0.55); rider.userData.legR.rotation.set(-0.5, 0, 0.55); rider.userData.armL.rotation.x = -0.6;
    h.add(rider); h.position.set(path[0][0], 0, path[0][1]); scene.add(h);
    world.horses.push({obj:h, path, i:1, dir:1, loop:true, speed:5, phase:0, mounted:true, rider});
  }
  // güvercinlik (pigeonnier)
  {
    const P = {x:-86, z:46};
    add(new THREE.CylinderGeometry(2.4, 2.6, 7, 24), M.stoneMat, P.x, 3.5, P.z); C.circle(P.x, P.z, 2.7);
    add(new THREE.CylinderGeometry(2.7, 2.7, 0.3, 24), M.stoneMat, P.x, 5.2, P.z);
    add(new THREE.ConeGeometry(3.0, 3.4, 24), M.slateMat, P.x, 8.7, P.z);
    add(new THREE.CylinderGeometry(0.4, 0.5, 1.0, 10), M.slateMat, P.x, 10.6, P.z);
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28; add(new THREE.BoxGeometry(0.3, 0.3, 0.1), new THREE.MeshStandardMaterial({color:0x111111}), P.x + Math.cos(a) * 2.42, 6.0, P.z + Math.sin(a) * 2.42, root, false).lookAt(P.x + Math.cos(a) * 9, 6, P.z + Math.sin(a) * 9); }
  }
  // su yalakları
  [[-96, 12], [-120, 38]].forEach(([x, z]) => {
    add(new THREE.BoxGeometry(2.6, 0.6, 0.9), M.stoneMat, x, 0.3, z); C.box(x, z, 1.3, 0.45);
    const w = add(new THREE.PlaneGeometry(2.4, 0.7), waterMat, x, 0.58, z, root, false); w.rotation.x = -Math.PI / 2;
  });
  // toprak yollar
  plane(4, 90, dirtMat, -88, 0.03, 10);                 // ana çiftlik yolu (kuzey-güney)
  plane(26, 4, dirtMat, -73, 0.045, 26);                // ahırdan çiftliğe
  plane(4, 22, dirtMat, -92, 0.06, -18, 0);            // büyük ahır önü
  // tabela
  {
    const g = new THREE.Group(); g.position.set(-77, 0, 29.5); g.rotation.y = -Math.PI / 2; root.add(g);
    [-1.2, 1.2].forEach(s => add(new THREE.BoxGeometry(0.15, 2.4, 0.15), greyWood, s, 1.2, 0, g));
    const [c, cg] = canvas(512, 160); cg.fillStyle = '#2b2018'; cg.fillRect(0, 0, 512, 160); cg.strokeStyle = '#d4af37'; cg.lineWidth = 6; cg.strokeRect(10, 10, 492, 140);
    cg.fillStyle = '#f1e6c8'; cg.font = '64px Georgia, serif'; cg.textAlign = 'center'; cg.fillText('Haras de Lumière', 256, 98);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    add(new THREE.BoxGeometry(2.8, 0.9, 0.1), new THREE.MeshStandardMaterial({map:t, roughness:0.8}), 0, 1.9, 0, g);
    C.circle(-77, 28.3, 0.2); C.circle(-77, 30.7, 0.2);
  }

  /* ================= çayır: rüzgârla dalgalanan uzun otlar ve kır çiçekleri ================= */
  {
    const blade = new THREE.PlaneGeometry(0.06, 0.85, 1, 4); blade.translate(0, 0.42, 0);
    const p = blade.attributes.position, nrm = blade.attributes.normal;
    for (let i = 0; i < p.count; i++){ const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y / 0.9)); nrm.setXYZ(i, 0, 1, 0); }
    const mat = windMat(new THREE.MeshLambertMaterial({side:THREE.DoubleSide}), 1.5, false);
    const zones = [
      {x0:-160, z0:-60, x1:-76, z1:82, n:30000, avoid:[[-112, -33, -96, -3], [-133, -37, -123, -23], [-140.5, 1.5, -93.5, 40.5, 0.35], [-139, 46, -97, 70], [-90.5, -35, -85.5, 56], [-89, 42.5, -83, 49.5]]},
      {x0:-34, z0:96, x1:34, z1:140, n:9000, avoid:[[-21, 108, 21, 128], [-2.5, 92, 2.5, 110]]},
    ];
    const total = zones.reduce((a, z) => a + z.n, 0);
    const im = new THREE.InstancedMesh(blade, mat, total), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), c = new THREE.Color(), up = new THREE.Vector3(0, 1, 0);
    const fl = 3200, stemG = new THREE.CylinderGeometry(0.008, 0.012, 0.7, 4); stemG.translate(0, 0.35, 0);
    const headG = new THREE.IcosahedronGeometry(0.06, 0); headG.translate(0, 0.72, 0);
    const fStem = new THREE.InstancedMesh(stemG, windMat(new THREE.MeshLambertMaterial({color:0x4a7a2e}), 1.5, false), fl);
    const fHead = new THREE.InstancedMesh(headG, windMat(new THREE.MeshStandardMaterial({roughness:0.6}), 1.5, false), fl);
    const WILD = ['#d8202f', '#d8202f', '#3a6fd8', '#ffffff', '#f2d23a', '#b35bff'];
    let k = 0, f = 0;
    zones.forEach(Z => {
      let made = 0, guard = 0;
      while (made < Z.n && guard++ < Z.n * 3){
        const x = Z.x0 + rnd() * (Z.x1 - Z.x0), z = Z.z0 + rnd() * (Z.z1 - Z.z0);
        if (Z.avoid.some(a => x > a[0] && x < a[2] && z > a[1] && z < a[3] && !(a[4] && rnd() < a[4]))) continue;
        if (Math.hypot((x + 118) / 21, (z - 58) / 12) < 1) continue; // manej kumu
        const sc = 0.6 + rnd() * 0.8;
        m4.compose(v.set(x, 0, z), q.setFromAxisAngle(up, rnd() * 6.28), s.set(1, sc, 1)); im.setMatrixAt(k, m4);
        c.setHSL(0.19 + rnd() * 0.08, 0.45 + rnd() * 0.2, 0.11 + rnd() * 0.12); if (rnd() < 0.12) c.setHSL(0.13, 0.45, 0.32 + rnd() * 0.1); im.setColorAt(k, c); k++; made++;
        if (f < fl && rnd() < 0.09){ m4.compose(v.set(x + 0.1, 0, z), q.identity(), s.set(1, 0.8 + rnd() * 0.5, 1)); fStem.setMatrixAt(f, m4); fHead.setMatrixAt(f, m4); c.set(WILD[Math.floor(rnd() * WILD.length)]); fHead.setColorAt(f, c); f++; }
      }
    });
    im.count = k; fStem.count = fHead.count = f; im.receiveShadow = true;
    root.add(im, fStem, fHead); meadows.push(im, fStem, fHead);
  }

  /* ================= bayraklar ================= */
  const flagU = {value:0};
  function flagMat(color){
    const m = new THREE.MeshStandardMaterial({color, roughness:0.7, side:THREE.DoubleSide});
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = timeU; sh.uniforms.uWind = windU;
      sh.vertexShader = 'uniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float u = clamp(position.x / 2.2, 0.0, 1.0);
        float w = clamp(uWind, 0.05, 1.4);
        transformed.z += sin(position.x * 2.6 - uTime * (4.0 + w * 9.0)) * u * (0.08 + w * 0.32) + sin(position.y * 3.0 + uTime * 5.0) * u * 0.05 * w;
        transformed.y -= u * u * (1.0 - min(w, 1.0)) * 1.1;
        transformed.x -= u * u * (1.0 - min(w, 1.0)) * 0.45;`);
    };
    m.customProgramCacheKey = () => 'flag';
    return m;
  }
  const flags = [];
  function flag(x, y, z, color, pole = 2.6){
    add(new THREE.CylinderGeometry(0.035, 0.045, pole, 6), M.darkMetal, x, y + pole / 2, z);
    add(new THREE.SphereGeometry(0.07, 8, 6), M.goldMat, x, y + pole + 0.05, z);
    const piv = new THREE.Group(); piv.position.set(x, y + pole - 0.7, z); root.add(piv);
    const fg = new THREE.PlaneGeometry(2.2, 1.3, 18, 6); fg.translate(1.1, 0, 0);
    const f = new THREE.Mesh(fg, flagMat(color)); f.castShadow = true; piv.add(f);
    flags.push(piv);
  }
  [[-31.6, CZ - 9.2], [-31.6, CZ + 9.2], [31.6, CZ - 9.2], [31.6, CZ + 9.2]].forEach(([x, z], i) => flag(x, 28.6, z, i % 2 ? 0xf2efe6 : 0x1d3a8a, 2.2));
  flag(0, 31.4, CZ, 0x1d3a8a, 3);
  flag(WG.x, 9 + 9 * 0.95 + 1.9, WG.z, 0xd4af37, 2.4);

  /* ================= rüzgârda uçuşan yapraklar ve taç yaprakları ================= */
  const PET = 900, petGeo = new THREE.BufferGeometry(), petPos = new Float32Array(PET * 3), petCol = new Float32Array(PET * 3), petSeed = new Float32Array(PET);
  {
    const pal = [[1, 0.42, 0.62], [1, 0.95, 0.95], [0.95, 0.75, 0.25], [0.55, 0.7, 0.3], [0.9, 0.4, 0.2]];
    for (let i = 0; i < PET; i++){ petPos.set([(rnd() - 0.5) * 70, rnd() * 12, (rnd() - 0.5) * 70], i * 3); petCol.set(pal[i % pal.length], i * 3); petSeed[i] = rnd() * 100; }
    petGeo.setAttribute('position', new THREE.BufferAttribute(petPos, 3)); petGeo.setAttribute('color', new THREE.BufferAttribute(petCol, 3));
  }
  const [pc, pg] = canvas(32, 32); pg.fillStyle = '#fff'; pg.beginPath(); pg.ellipse(16, 16, 13, 6, 0.6, 0, Math.PI * 2); pg.fill();
  const petMat = new THREE.PointsMaterial({size:0.16, map:new THREE.CanvasTexture(pc), vertexColors:true, transparent:true, alphaTest:0.3, depthWrite:false});
  const petals = new THREE.Points(petGeo, petMat); petals.frustumCulled = false; scene.add(petals);
  let petOrigin = new THREE.Vector3();

  /* ================= etkileşimler (bilgi diyalogları) ================= */
  const say = (name, text) => () => estate.ui && estate.ui.dialog([{name, text}]);
  interact.push(
    {x:-77, z:29.5, r:2.6, label:'Tabelayı oku', show:() => true, act:say('Tabela', 'Haras de Lumière — Şatonun atları burada yetiştirilir. Ziyaretçiler otlağa girebilir; lütfen kapıyı kapalı tutun.')},
    {x:GH_L.cx + 5.4, z:GH_L.cz, r:2.4, label:'Portakal serası', show:() => true, act:say('Portakal serası', 'Kontes kışları portakal ve limon ağaçlarını buraya taşıtırdı. İçerisi dışarıdan birkaç derece daha sıcak.')},
    {x:GH_R.cx - 5.4, z:GH_R.cz, r:2.4, label:'Tropik sera', show:() => true, act:say('Tropik sera', 'Uzak kolonilerden getirilen palmiyeler ve eğrelti otları. Nilüfer havuzunun suyu hiç donmaz.')},
    {x:WG.x, z:WG.z - 11, r:3, label:'Kış bahçesi', show:() => true, act:say('Kış bahçesi', 'Jardin d\'hiver: demir ve camdan bir saray. Geceleri fenerleri yandığında bahçenin en sıcak köşesi olur.')},
    {x:-120, z:47, r:2.6, label:'Manejı izle', show:() => true, act:say('Seyis Lucien', 'Étoile\'e binince Shift ile dörtnala koşabilirsin. Ama yağmurda çamura dikkat; atlar yavaşlar.')},
  );

  /* ================= güncelleme ================= */
  const windDir = Math.atan2(0.57, 0.82); // rüzgârın estiği yön (XZ)
  let detail = 'yuksek';
  function update(dt, t, hero){
    const wind = world.state.wind, W = world.W;
    // bayraklar rüzgâra döner
    flags.forEach((p, i) => { const want = -windDir + Math.sin(t * 0.5 + i) * 0.15 * wind; p.rotation.y += (want - p.rotation.y) * Math.min(1, dt * 1.5); });
    updaters.forEach(fn => fn(dt, t));
    // kış bahçesi fenerleri
    const n = W.night;
    lights.forEach(l => l.material.color.setRGB(0.2 + n * 1.6, 0.13 + n * 1.0, 0.07 + n * 0.45));
    lights.warm.intensity = n * 3.2;
    // yapraklar: oyuncu çevresinde, rüzgârla sürüklenir
    petals.visible = detail !== 'dusuk' && wind > 0.12 && !estate.indoor;
    if (petals.visible){
      const cx = world.camera.position.x, cz = world.camera.position.z;
      const vx = Math.cos(windDir) * (1 + wind * 7), vz = Math.sin(windDir) * (1 + wind * 7);
      const active = Math.floor(PET * Math.min(1, (wind - 0.1) * 1.2)) * (W.rain > 0.5 ? 0.4 : 1);
      petGeo.setDrawRange(0, active);
      for (let i = 0; i < active; i++){
        const s = petSeed[i], j = i * 3;
        petPos[j] += (vx + Math.sin(t * 2 + s) * 0.8) * dt; petPos[j + 2] += (vz + Math.cos(t * 1.7 + s) * 0.8) * dt;
        petPos[j + 1] += (Math.sin(t * 3 + s * 2) * 0.6 - 0.35) * dt;
        let dx = petPos[j] - cx, dz = petPos[j + 2] - cz;
        if (dx > 35) petPos[j] -= 70; if (dx < -35) petPos[j] += 70; if (dz > 35) petPos[j + 2] -= 70; if (dz < -35) petPos[j + 2] += 70;
        if (petPos[j + 1] < 0.05) petPos[j + 1] = 3 + rnd() * 9;
      }
      petGeo.attributes.position.needsUpdate = true;
    }
  }
  function setDetail(q){ detail = q; meadows.forEach(m => { m.visible = q !== 'dusuk'; }); }
  const isSoft = (x, z) => x < -76 || (z > 96 && Math.abs(x) > 21);

  const estate = {root, interact, markers, doors, update, setDetail, isSoft, windOverride:null, ui:null,
    coinSpots:[[GH_L.cx + 1.5, GH_L.cz + 4], [GH_R.cx - 1.5, GH_R.cz - 6], [WG.x + 15, WG.z - 3], [-92, -12], [-118, 64]]};
  return estate;
}
