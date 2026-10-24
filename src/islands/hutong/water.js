// Su: Jiangnan kanal köyü (Suzhou/Wuzhen), ay köprüleri, wupeng kayıkları, koi göleti ve gece süzülen dilek fenerleri.
//
// Kanal köyü algoritması:
//  1. Köy alanı yerleşim matrisinde QUAY, kanallar CANAL olarak boyanır.
//  2. Zemin y = 0 olduğu için kanal kazılamaz: köy, kanalların arasında kalan taş bloklar üstünde "deck" metre yükselir.
//  3. Her kanalın iki kıyısı boyunca yürünür; bir ev yeri ancak önündeki hücreler isWaterChannel ise (grid.toChannel)
//     ve matriste boşsa ayrılır. A kıyısında evler doğrudan suya iner (水埠 su basamakları), B kıyısında 3 m'lik
//     rıhtım sokağı (河街) vardır. Kalan blok içleri sokaklı ev sıralarıyla dolar.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TAG } from './grid.js';
import { P } from './palette.js';

export function makeWater(ctx, A, grid){
  const { THREE, kit, C, root, rnd } = ctx;
  const { add, mat } = kit;
  const { M, box, lathe } = A;
  const heightFns = C.heightFns;
  const waterMat = new THREE.MeshStandardMaterial({color:P.water, roughness:0.05, metalness:0.35, transparent:true, opacity:0.86});
  const bedMat = mat(0x16241f, {roughness:1});
  const up = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const floatPaths = [];     // dilek fenerlerinin süzüleceği yollar: {pts:[[x, z]…], y, closed}
  const anims = [];

  /* ================= ay köprüsü (拱桥) ================= */
  // Yan görünüş bir Shape: üstte kavisli güverte, ortada tam daire delik. Suyun altında kalan yarım dairenin
  // yansımasıyla birlikte "dolunay" görünür. Yerel +z köprünün ekseni.
  function moonBridge({x, z, rot = 0, L = 15, w = 3.6, base = 1.0, top = 4.4, waterY = 0.4, ra = 3.4}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const deckY = t => base + (top - base) * Math.pow(Math.sin(Math.PI * t), 0.85);
    const s = new THREE.Shape(); s.moveTo(-L / 2, -4); s.lineTo(-L / 2, base);
    for (let i = 1; i <= 30; i++){ const t = i / 30; s.lineTo(-L / 2 + t * L, deckY(t)); }
    s.lineTo(L / 2, -4); s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, waterY, ra, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, {depth:w, bevelEnabled:false, curveSegments:40}); g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2); A.scaleUV(g, 0.5);
    add(g, M.stone, 0, 0, 0, G);
    // korkuluk duvarları ve güverte basamakları
    [-1, 1].forEach(sd => {
      const ps = new THREE.Shape(); ps.moveTo(-L / 2, base);
      for (let i = 0; i <= 30; i++){ const t = i / 30; ps.lineTo(-L / 2 + t * L, deckY(t) + 0.85); }
      for (let i = 30; i >= 0; i--){ const t = i / 30; ps.lineTo(-L / 2 + t * L, deckY(t) - 0.05); }
      const pg = new THREE.ExtrudeGeometry(ps, {depth:0.22, bevelEnabled:false}); pg.translate(0, 0, -0.11); pg.rotateY(Math.PI / 2); A.scaleUV(pg, 0.5);
      add(pg, M.stone, sd * (w / 2 - 0.11), 0, 0, G);
    });
    for (let zl = -L / 2 + 0.6; zl < L / 2 - 0.4; zl += 0.42){ const t = (zl + L / 2) / L; add(box(w - 0.5, 0.1, 0.3), M.paving, 0, deckY(t) + 0.04, zl, G, false); }
    const c = Math.cos(rot), sn = Math.sin(rot);
    heightFns.push((px, pz) => {
      const dx = px - x, dz = pz - z, lx = dx * c - dz * sn, lz = dx * sn + dz * c;
      return Math.abs(lx) < w / 2 - 0.15 && Math.abs(lz) < L / 2 ? deckY((lz + L / 2) / L) + 0.08 : null;
    });
    // korkuluk çarpışması yalnız su üstünde: karada köprü ayağının yanından geçilebilsin
    [-1, 1].forEach(sd => { const [cx, cz] = kit.toWorld(G, sd * (w / 2 - 0.1), 0); C.box(cx, cz, 0.16, ra + 0.6, rot).low = true; });
    return G;
  }

  /* ================= wupeng kayığı (乌篷船) ================= */
  const hullG = (() => {
    const s = new THREE.Shape(); s.moveTo(0, -3.2); s.quadraticCurveTo(0.95, -1.8, 0.85, 0); s.quadraticCurveTo(0.9, 2.0, 0, 3.0); s.quadraticCurveTo(-0.9, 2.0, -0.85, 0); s.quadraticCurveTo(-0.95, -1.8, 0, -3.2);
    const g = new THREE.ExtrudeGeometry(s, {depth:0.5, bevelEnabled:false, curveSegments:8}); g.rotateX(Math.PI / 2); g.translate(0, 0.5, 0); return g;
  })();
  const awningMat = mat(0x1c1a18, {roughness:0.85, side:THREE.DoubleSide}), strawMat = mat(0xc9ae6a, {roughness:0.85});
  function boat(path, {speed = 1.1, phase = 0} = {}){
    const G = new THREE.Group(); G.userData.dyn = true; root.add(G);
    add(hullG, M.woodDark, 0, -0.25, 0, G);
    const aw = add(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 12, 1, true, -Math.PI / 2, Math.PI), awningMat, 0, 0.35, 0.2, G); aw.rotation.x = Math.PI / 2;
    const man = kit.npc({coat:0x2a3a5a, hat:'yok'}); man.position.set(0, 0.25, -2.3); man.scale.setScalar(0.92); G.add(man);
    add(new THREE.ConeGeometry(0.42, 0.24, 14), strawMat, 0, 2.05, 0, man);
    const oar = add(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 5), M.wood, 0.3, 0.9, -2.9, G); oar.rotation.x = 0.9;
    const P0 = path.pts, segs = [];
    let total = 0; for (let i = 0; i + 1 < P0.length; i++){ const l = Math.hypot(P0[i + 1][0] - P0[i][0], P0[i + 1][1] - P0[i][1]); segs.push(l); total += l; }
    let s = phase * total, dir = 1;
    anims.push((dt, t) => {
      s += dir * speed * dt; if (s > total){ s = total; dir = -1; } else if (s < 0){ s = 0; dir = 1; }
      let r = s, i = 0; while (i < segs.length - 1 && r > segs[i]){ r -= segs[i]; i++; }
      const a = P0[i], b = P0[i + 1], k = r / segs[i];
      G.position.set(a[0] + (b[0] - a[0]) * k, path.y + Math.sin(t * 1.3 + phase * 9) * 0.04, a[1] + (b[1] - a[1]) * k);
      G.rotation.y = Math.atan2((b[0] - a[0]) * dir, (b[1] - a[1]) * dir); G.rotation.z = Math.sin(t * 0.9 + phase) * 0.02;
      oar.rotation.z = Math.sin(t * 1.6) * 0.35;
    });
    return G;
  }

  /* ================= kanal köyü ================= */
  /** canals: [{axis:'x' | 'z', c, w}] — 'x' doğu-batı akan kanal (z = c), 'z' kuzey-güney (x = c).
   *  bridges: [{canal:i, at}] köprünün kanal boyunca konumu. ramps: köy platformuna çıkan basamaklar. */
  function canalVillage({x0, x1, z0, z1, deck = 1.0, waterY = 0.4, canals, bridges = [], ramps = [], lanternsAt = [], trees = []}){
    grid.paint(x0, z0, x1, z1, TAG.QUAY);
    canals.forEach(cn => { cn.r = cn.axis === 'x' ? [x0, cn.c - cn.w / 2, x1, cn.c + cn.w / 2] : [cn.c - cn.w / 2, z0, cn.c + cn.w / 2, z1]; grid.fill(...cn.r, TAG.CANAL); });
    const cuts = (axis, a, b) => { const out = [a]; canals.filter(cn => cn.axis === axis).sort((p, q) => p.c - q.c).forEach(cn => out.push(cn.c - cn.w / 2, cn.c + cn.w / 2)); out.push(b); return out; };
    const xs = cuts('z', x0, x1), zs = cuts('x', z0, z1), blocks = [];
    for (let i = 0; i < xs.length; i += 2) for (let j = 0; j < zs.length; j += 2) blocks.push({x0:xs[i], x1:xs[i + 1], z0:zs[j], z1:zs[j + 1]});
    blocks.forEach(b => {
      const w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      add(box(w, deck + 0.4, d, 1.6), M.stone, cx, (deck - 0.4) / 2, cz);
      A.floor(w - 0.2, d - 0.2, M.paving, cx, deck + 0.012, cz);
    });
    // su ve kanal tabanı
    canals.forEach(cn => {
      const [a0, b0, a1, b1] = cn.r, w = a1 - a0, d = b1 - b0;
      kit.plane(w, d, bedMat, (a0 + a1) / 2, 0.03, (b0 + b1) / 2);
      kit.plane(w, d, waterMat, (a0 + a1) / 2, waterY, (b0 + b1) / 2).receiveShadow = true;
      const pts = cn.axis === 'x' ? [[x0 + 2, cn.c], [x1 - 2, cn.c]] : [[cn.c, z0 + 2], [cn.c, z1 - 2]];
      cn.path = {pts, y:waterY};
      floatPaths.push({pts:pts.map(([px, pz]) => [px + (cn.axis === 'z' ? 1.2 : 0), pz + (cn.axis === 'x' ? 1.2 : 0)]), y:waterY, closed:false});
    });
    // platform yüksekliği ve basamaklar
    const inV = (px, pz) => px > x0 && px < x1 && pz > z0 && pz < z1;
    heightFns.push((px, pz) => inV(px, pz) && !grid.isWaterChannel(px, pz) ? deck : null);
    ramps.forEach(r => {
      const n = 4, along = r.dir[0], sign = r.dir[1] === '+' ? 1 : -1;
      for (let k = 0; k < n; k++){
        const h = deck * (k + 1) / (n + 1), t0 = k / n, t1 = (k + 1) / n;
        const [ax0, ax1] = along === 'x' ? [r.x0, r.x1] : [r.z0, r.z1], len = ax1 - ax0;
        const a = sign > 0 ? ax0 + t0 * len : ax1 - t1 * len, b = a + len / n;
        if (along === 'x') add(box(b - a, h, r.z1 - r.z0), M.stone, (a + b) / 2, h / 2, (r.z0 + r.z1) / 2);
        else add(box(r.x1 - r.x0, h, b - a), M.stone, (r.x0 + r.x1) / 2, h / 2, (a + b) / 2);
      }
      heightFns.push((px, pz) => {
        if (px < r.x0 || px > r.x1 || pz < r.z0 || pz > r.z1) return null;
        const u = along === 'x' ? (px - r.x0) / (r.x1 - r.x0) : (pz - r.z0) / (r.z1 - r.z0), t = sign > 0 ? u : 1 - u;
        return deck * Math.min(n, Math.floor(t * n) + 1) / (n + 1);
      });
    });
    // köprüler ve köprü ayakları (ev konmasın)
    bridges.forEach(br => {
      const cn = canals[br.canal], L = cn.w + 7;
      const bx = cn.axis === 'x' ? br.at : cn.c, bz = cn.axis === 'x' ? cn.c : br.at;
      moonBridge({x:bx, z:bz, rot:cn.axis === 'x' ? 0 : Math.PI / 2, L, base:deck, top:deck + 3.6, waterY, ra:cn.w / 2 - 0.5});
      br.x = bx; br.z = bz; br.gap = 2.2;
      if (cn.axis === 'x') grid.fill(bx - 3, cn.c - L / 2 - 1, bx + 3, cn.c + L / 2 + 1, TAG.STREET); else grid.fill(cn.c - L / 2 - 1, bz - 3, cn.c + L / 2 + 1, bz + 3, TAG.STREET);
    });
    // kıyı çarpışması: kanal kenarları boyunca, köprü ayaklarında boşluk
    canals.forEach((cn, ci) => {
      const others = canals.filter(o => o !== cn && o.axis !== cn.axis), gaps = bridges.filter(b => b.canal === ci).map(b => [ (cn.axis === 'x' ? b.x : b.z) - b.gap, (cn.axis === 'x' ? b.x : b.z) + b.gap ]);
      others.forEach(o => gaps.push([o.c - o.w / 2, o.c + o.w / 2]));
      gaps.sort((p, q) => p[0] - q[0]);
      const [lo, hi] = cn.axis === 'x' ? [x0, x1] : [z0, z1], runs = []; let u = lo;
      gaps.forEach(([g0, g1]) => { if (g0 > u) runs.push([u, g0]); u = Math.max(u, g1); }); if (u < hi) runs.push([u, hi]);
      [-1, 1].forEach(sd => runs.forEach(([a, b]) => {
        const e = cn.c + sd * (cn.w / 2 - 0.1);
        (cn.axis === 'x' ? C.rect(a, e - 0.15, b, e + 0.15) : C.rect(e - 0.15, a, e + 0.15, b)).low = true;
      }));
    });

    // kanal kıyısı dizilimi: kıyı boyunca yürü, önü kanala bakan boş yerlere ev koy
    const houses = [];
    canals.forEach((cn, ci) => {
      [-1, 1].forEach(sd => {
        const flush = (sd < 0) === (ci % 2 === 0);              // kanal başına bir kıyı suya iner, öbürü rıhtım
        const set = flush ? 0.4 : 3.4, d = 6.4;
        const [lo, hi] = cn.axis === 'x' ? [x0, x1] : [z0, z1];
        for (let u = lo + 1; u < hi - 6;){
          const w = 6 + Math.floor(rnd() * 4) * 1.0, e = cn.c + sd * (cn.w / 2 + set), f = e + sd * d;
          const [rx0, rz0, rx1, rz1] = cn.axis === 'x' ? [u, Math.min(e, f), u + w, Math.max(e, f)] : [Math.min(e, f), u, Math.max(e, f), u + w];
          const fcx = (rx0 + rx1) / 2, fcz = (rz0 + rz1) / 2, nx = cn.axis === 'z' ? -sd : 0, nz = cn.axis === 'x' ? -sd : 0;
          // önü gerçekten kanala mı bakıyor? (evin ön yüzünden kanal yönüne ilerle)
          const fx = fcx + nx * d / 2, fz = fcz + nz * d / 2;
          if (grid.toChannel(fx, fz, nx, nz, set + 1.5) === Infinity || !grid.reserve(rx0, rz0, rx1, rz1, TAG.LOT, [TAG.QUAY])){ u += 2; continue; }
          const rot = Math.atan2(nx, nz), h = rnd() < 0.55 ? 5.2 : 3.4;
          const H = A.house({x:fcx, z:fcz, w:w - 0.4, d:d - 0.4, h, rot, y:deck, style:'jiangnan', plinth:0.25, cols:!flush, over:0.8});
          houses.push(H);
          const [lx, lz] = H.front;
          A.lantern(lx + (cn.axis === 'x' ? w * 0.3 : 0), deck + 2.6, lz + (cn.axis === 'z' ? w * 0.3 : 0), 0.65, deck);
          if (flush){
            // 水埠: evin önünden suya inen taş basamaklar
            for (let k = 0; k < 4; k++){
              const off = cn.w / 2 - 0.3 - k * 0.45, y = deck - (k + 1) * (deck - waterY) / 4;
              const sx = cn.axis === 'z' ? cn.c + sd * off : fcx, sz = cn.axis === 'x' ? cn.c + sd * off : fcz;
              add(cn.axis === 'x' ? box(2.4, 0.2, 0.45) : box(0.45, 0.2, 2.4), M.stone, sx, y, sz);
            }
          } else if (rnd() < 0.5) trees.push([fcx + nx * (d / 2 + 1.6), fcz + nz * (d / 2 + 1.6), 'sogut', deck]);
          u += w;
        }
        if (!flush){
          // rıhtım fenerleri
          const e = cn.c + sd * (cn.w / 2 + 0.8);
          for (let u = lo + 6; u < hi - 4; u += 9){ const [px, pz] = cn.axis === 'x' ? [u, e] : [e, u]; if (grid.get(px, pz) !== TAG.QUAY) continue; add(box(0.14, 2.6, 0.14), M.woodDark, px, deck + 1.3, pz); A.lantern(px, deck + 2.9, pz, 0.7, deck); C.circle(px, pz, 0.15); }
        }
      });
    });
    // blok içleri: güneye bakan ev sıraları, aralarında 3 m sokak
    blocks.forEach(b => {
      for (let z = b.z0 + 2; z + 7 < b.z1 - 1; z += 10){
        for (let x = b.x0 + 1.5; x + 6 < b.x1 - 1;){
          const w = 6 + Math.floor(rnd() * 3);
          if (grid.reserve(x, z, x + w, z + 7, TAG.LOT, [TAG.QUAY])) A.house({x:x + w / 2, z:z + 3.5, w:w - 0.6, d:6.2, h:rnd() < 0.4 ? 5.2 : 3.4, y:deck, style:'jiangnan', plinth:0.25, cols:false});
          x += w;
        }
      }
    });
    lanternsAt.forEach(([a, b, c2, d2, y]) => A.lanternLine(a, b, c2, d2, deck + y, 6, 0.8, 0.55));
    return {blocks, canals, houses, deck, inside:inV};
  }

  /* ================= koi göleti ================= */
  // Elips gölet, ortada adacık ve köşk, kıyıdan adaya 九曲 zikzak köprü. Su sığ ve yarı saydam: koiler altında görünür,
  // düşük pürüzlülük gökyüzünü (HDRI ortam haritası) yansıtır.
  function koiPond({x, z, rx, rz, isle = 6.5, bridge, waterY = 0.12, deckY = 0.38, trees = []}){
    const G = new THREE.Group(); G.position.set(x, 0, z); root.add(G);
    const disc = (r, m, y) => { const d = add(new THREE.CircleGeometry(1, 64), m, 0, y, 0, G, false); d.rotation.x = -Math.PI / 2; d.scale.set(rx * r, rz * r, 1); return d; };
    disc(1, bedMat, 0.03);
    const wm = disc(1, waterMat, waterY); wm.userData.keep = true;
    // kıyı taşları
    const rimPts = []; for (let i = 0; i < 64; i++){ const a = i / 64 * Math.PI * 2; rimPts.push(new THREE.Vector3(Math.cos(a) * (rx + 0.2), 0.14, Math.sin(a) * (rz + 0.2))); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 96, 0.5, 6, true), M.stone, 0, 0, 0, G);
    // zikzak köprü: her dirsekte dış korkuluk uzar, iç korkuluk kısalır
    const B = bridge.map(([bx, bz]) => [x + bx, z + bz]), bw = 2.2, segs = [];
    for (let i = 0; i + 1 < B.length; i++){
      const [ax, az] = B[i], [cx2, cz2] = B[i + 1], len = Math.hypot(cx2 - ax, cz2 - az), dx = (cx2 - ax) / len, dz = (cz2 - az) / len;
      segs.push({ax, az, bx:cx2, bz:cz2, len, dx, dz, ry:Math.atan2(dx, dz)});
    }
    segs.forEach((sg, i) => {
      const turn = (a, b) => a && b ? Math.sign(a.dx * b.dz - a.dz * b.dx) : 0;
      const tIn = turn(segs[i - 1], sg), tOut = turn(sg, segs[i + 1]);
      const ext0 = i > 0 ? bw / 2 : 0, ext1 = i < segs.length - 1 ? bw / 2 : 0;
      const cx2 = (sg.ax + sg.bx) / 2 + sg.dx * (ext1 - ext0) / 2, cz2 = (sg.az + sg.bz) / 2 + sg.dz * (ext1 - ext0) / 2, L = sg.len + ext0 + ext1;
      const g = new THREE.Group(); g.position.set(cx2, 0, cz2); g.rotation.y = sg.ry; root.add(g);
      add(box(bw, 0.16, L), M.wood, 0, deckY - 0.08, 0, g);
      for (let k = -1; k <= 1; k += 2) add(new THREE.CylinderGeometry(0.1, 0.1, deckY + 0.3, 6), M.stone, 0, (deckY - 0.3) / 2, k * L * 0.3, g);
      [-1, 1].forEach(side => {
        // side: yerel +x (sağ) / -x; dirsekte dışarıda kalan korkuluk uzar
        const outerIn = tIn !== 0 && side === tIn, outerOut = tOut !== 0 && side === tOut;
        const a = -L / 2 + (i > 0 ? (outerIn ? 0 : bw) : 0), b = L / 2 - (i < segs.length - 1 ? (outerOut ? 0 : bw) : 0);
        if (b - a < 0.3) return;
        const rl = add(box(0.1, 0.1, b - a), M.vermilion, side * (bw / 2 - 0.05), deckY + 0.8, (a + b) / 2, g);
        for (let zz = a; zz <= b + 0.01; zz += Math.max(0.5, (b - a) / Math.ceil((b - a) / 1.4))) add(box(0.1, 0.8, 0.1), M.vermilion, side * (bw / 2 - 0.05), deckY + 0.4, zz, g);
        const [wx, wz] = kit.toWorld(g, side * (bw / 2 - 0.05), (a + b) / 2); C.box(wx, wz, 0.12, (b - a) / 2, sg.ry).low = true;
        rl.castShadow = true;
      });
      heightFns.push((px, pz) => {
        const dx = px - cx2, dz = pz - cz2, c = Math.cos(sg.ry), s = Math.sin(sg.ry), lx = dx * c - dz * s, lz = dx * s + dz * c;
        return Math.abs(lx) < bw / 2 && Math.abs(lz) < L / 2 ? deckY : null;
      });
    });
    const nearBridge = (px, pz, m) => segs.some(sg => { const t = Math.max(0, Math.min(sg.len, (px - sg.ax) * sg.dx + (pz - sg.az) * sg.dz)); return Math.hypot(px - sg.ax - sg.dx * t, pz - sg.az - sg.dz * t) < m; });
    // gölet kenarı çarpışması (köprü girişinde boşluk)
    for (let i = 0; i < 120; i++){ const a = i / 120 * Math.PI * 2, px = x + Math.cos(a) * (rx + 0.1), pz = z + Math.sin(a) * (rz + 0.1); if (!nearBridge(px, pz, bw / 2 + 0.3)) C.circle(px, pz, 0.6).low = true; }
    // adacık
    add(new THREE.CylinderGeometry(isle, isle + 0.4, deckY + 0.1, 40), M.stone, 0, (deckY + 0.1) / 2 - 0.05, 0, G);
    const top = add(new THREE.CircleGeometry(isle - 0.2, 40), kit.grass, 0, deckY + 0.02, 0, G, false); top.rotation.x = -Math.PI / 2;
    heightFns.push((px, pz) => Math.hypot(px - x, pz - z) < isle ? deckY : null);
    for (let i = 0; i < 40; i++){ const a = i / 40 * Math.PI * 2, px = x + Math.sin(a) * (isle + 0.1), pz = z + Math.cos(a) * (isle + 0.1); if (!nearBridge(px, pz, bw / 2 + 0.2)) C.circle(px, pz, 0.35).low = true; }
    const pav = A.pavilion({x, z, y:deckY, n:6, r:3.0, h:3.0, roofMat:M.tileDark, base:0.3, openA:0});
    // lotus yaprakları ve çiçekler
    const lotusN = 60, leafG = new THREE.CircleGeometry(0.55, 14, 0.25, Math.PI * 2 - 0.5); leafG.rotateX(-Math.PI / 2);
    const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.6, side:THREE.DoubleSide}), lotusN);
    const flowerG = lathe([[0, 0], [0.12, 0.02], [0.2, 0.12], [0.16, 0.22], [0.05, 0.3]], 8);
    const flowers = new THREE.InstancedMesh(flowerG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.5}), 16);
    const col = new THREE.Color(); let nl = 0, nf = 0;
    for (let k = 0; k < 400 && nl < lotusN; k++){
      const a = rnd() * Math.PI * 2, rf = 0.55 + rnd() * 0.38, px = Math.cos(a) * rx * rf, pz = Math.sin(a) * rz * rf;
      if (Math.hypot(px, pz) < isle + 2 || nearBridge(x + px, z + pz, 2.6)) continue;
      const k2 = 0.6 + rnd() * 0.7; m4.compose(p3.set(px, waterY + 0.012, pz), q.setFromAxisAngle(up, rnd() * 6.3), s3.set(k2, 1, k2));
      leaves.setMatrixAt(nl, m4); leaves.setColorAt(nl, col.setHSL(0.27 + rnd() * 0.05, 0.5, 0.28 + rnd() * 0.1).convertSRGBToLinear()); nl++;
      if (nf < 16 && rnd() < 0.3){ m4.compose(p3.set(px + 0.2, waterY + 0.02, pz), q.identity(), s3.set(1.2, 1.2, 1.2)); flowers.setMatrixAt(nf, m4); flowers.setColorAt(nf, col.setHSL(0.93, 0.7, 0.8).convertSRGBToLinear()); nf++; }
    }
    leaves.count = nl; flowers.count = nf; G.add(leaves, flowers);
    // koiler: halka üzerinde yüzer, yem atılınca köşke doğru toplanır
    const fishG = (() => { const b = new THREE.SphereGeometry(0.12, 10, 6); b.scale(0.65, 0.45, 1.9); const t = new THREE.ConeGeometry(0.1, 0.2, 6); t.rotateX(-Math.PI / 2); t.scale(1, 0.25, 1); t.translate(0, 0, -0.3); return mergeBufferGeometries([b.toNonIndexed(), t.toNonIndexed()]); })();
    const NK = 40, koi = new THREE.InstancedMesh(fishG, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.35}), NK);
    const fish = [], rMin = (isle + 1.6) / Math.min(rx, rz);
    for (let i = 0; i < NK; i++){
      fish.push({a:rnd() * 6.3, rf:rMin + rnd() * (0.88 - rMin), w:(rnd() < 0.5 ? -1 : 1) * (0.08 + rnd() * 0.12), k:0.8 + rnd() * 0.7, x:0, z:0, yaw:0});
      koi.setColorAt(i, col.set(P.koi[i % P.koi.length]).convertSRGBToLinear());
    }
    koi.frustumCulled = false; G.add(koi);
    let feedT = 0;
    const tx = 0, tz = isle + 0.8;
    anims.push((dt, t) => {
      feedT = Math.max(0, feedT - dt);
      const pull = Math.min(1, feedT / 2);
      fish.forEach((f, i) => {
        f.a += f.w * dt * (1 + Math.sin(t * 0.7 + i) * 0.3);
        const wob = 1 + Math.sin(t * 0.5 + i * 1.7) * 0.06;
        let px = Math.cos(f.a) * rx * f.rf * wob, pz = Math.sin(f.a) * rz * f.rf * wob;
        if (pull > 0){ const ox = tx + Math.cos(i * 2.4) * (1 + i % 5 * 0.5), oz = tz + 1.2 + Math.abs(Math.sin(i * 1.3)) * 2.5; px += (ox - px) * pull; pz += (oz - pz) * pull; }
        const vx = px - f.x, vz = pz - f.z; if (vx * vx + vz * vz > 1e-6) f.yaw = Math.atan2(vx, vz);
        f.x = px; f.z = pz;
        m4.compose(p3.set(px, waterY - 0.05, pz), q.setFromAxisAngle(up, f.yaw + Math.sin(t * 6 + i) * 0.15), s3.set(f.k, f.k, f.k)); koi.setMatrixAt(i, m4);
      });
      koi.instanceMatrix.needsUpdate = true;
    });
    floatPaths.push({pts:Array.from({length:33}, (_, i) => { const a = i / 32 * Math.PI * 2; return [x + Math.cos(a) * rx * 0.74, z + Math.sin(a) * rz * 0.74]; }), y:waterY, closed:true});
    [[-rx - 3, -4], [-rx * 0.6, -rz - 3], [rx * 0.5, -rz - 3.5], [rx + 3, 5], [-rx * 0.4, rz + 3]].forEach(([px, pz]) => trees.push([x + px, z + pz, 'sogut', 0]));
    return {pav:{x, z:z + isle + 0.6, y:deckY}, feed(){ feedT = 12; }, bridgeStart:B[0]};
  }

  /* ================= dilek fenerleri (河灯) ================= */
  // Lotus biçimli küçük fenerler kanallarda ve gölette süzülür; yalnız akşam ve gece görünür.
  function riverLanterns(n = 70){
    if (!floatPaths.length) return;
    const cupG = lathe([[0, 0], [0.14, 0], [0.24, 0.08], [0.2, 0.12], [0.28, 0.18], [0.18, 0.2], [0.06, 0.12]], 10);
    const bodyMat = new THREE.MeshBasicMaterial({color:new THREE.Color(0xffb27a).convertSRGBToLinear(), toneMapped:false});
    const [c, g] = kit.canvas(64, 64), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,170,90,1)'); gr.addColorStop(1, 'rgba(255,120,60,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(c); glowTex.encoding = THREE.sRGBEncoding;
    const glowMat = new THREE.MeshBasicMaterial({map:glowTex, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
    const glowG = new THREE.PlaneGeometry(1.6, 1.6); glowG.rotateX(-Math.PI / 2);
    const body = new THREE.InstancedMesh(cupG, bodyMat, n), glow = new THREE.InstancedMesh(glowG, glowMat, n);
    body.frustumCulled = glow.frustumCulled = false; glow.renderOrder = 2; root.add(body, glow);
    const L = floatPaths.map(fp => { const seg = []; let tot = 0; for (let i = 0; i + 1 < fp.pts.length; i++){ const l = Math.hypot(fp.pts[i + 1][0] - fp.pts[i][0], fp.pts[i + 1][1] - fp.pts[i][1]); seg.push(l); tot += l; } return {seg, tot}; });
    const items = Array.from({length:n}, (_, i) => { const pi = i % floatPaths.length; return {pi, s:rnd() * L[pi].tot, v:0.25 + rnd() * 0.3, off:(rnd() - 0.5) * 2.2, ph:rnd() * 6}; });
    let shown = true;
    anims.push((dt, t) => {
      const vis = ctx.W.night > 0.25; if (vis !== shown){ body.visible = glow.visible = shown = vis; } if (!vis) return;
      items.forEach((it, i) => {
        const fp = floatPaths[it.pi], ln = L[it.pi];
        it.s += it.v * dt; if (it.s > ln.tot) it.s -= ln.tot;
        let r = it.s, k = 0; while (k < ln.seg.length - 1 && r > ln.seg[k]){ r -= ln.seg[k]; k++; }
        const a = fp.pts[k], b = fp.pts[k + 1], u = r / ln.seg[k], dx = (b[0] - a[0]) / ln.seg[k], dz = (b[1] - a[1]) / ln.seg[k];
        const px = a[0] + (b[0] - a[0]) * u - dz * (it.off + Math.sin(t * 0.3 + it.ph) * 0.3), pz = a[1] + (b[1] - a[1]) * u + dx * (it.off + Math.sin(t * 0.3 + it.ph) * 0.3);
        m4.compose(p3.set(px, fp.y + 0.02 + Math.sin(t * 1.5 + it.ph) * 0.015, pz), q.setFromAxisAngle(up, t * 0.2 + it.ph), s3.set(1, 1, 1)); body.setMatrixAt(i, m4);
        m4.compose(p3.set(px, fp.y + 0.03, pz), q.identity(), s3.set(1, 1, 1)); glow.setMatrixAt(i, m4);
      });
      body.instanceMatrix.needsUpdate = glow.instanceMatrix.needsUpdate = true;
    });
  }

  return {moonBridge, boat, canalVillage, koiPond, riverLanterns, waterMat, update:(dt, t) => anims.forEach(f => f(dt, t))};
}
