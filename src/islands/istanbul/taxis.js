// İstanbul'un sarı taksileri: Taksim ve Eminönü'nde park etmiş üç taksi, caddelerde on hareketli taksi.
// Gövde profili ExtrudeGeometry ile çizilir; tekerlekler ayrı aks gruplarında döner, malzemeler ortaktır.
export function buildTaxis(ctx, env){
  const { THREE, kit, root, rnd } = ctx;
  if (!env || !env.AVENUES || !env.Hs) return;

  const wheelR = 0.33, wheelZ = 1.35, axleX = 0.78;
  const SURF = 0.09;                         // asfalt/plaza şeridi zeminin birkaç cm üstünde
  const night0 = ctx.W.night > 0.45;

  /* ---------- kodla dokular ---------- */
  const [sc, sg] = kit.canvas(128, 32);
  sg.fillStyle = '#101113'; sg.fillRect(0, 0, 128, 32);
  sg.strokeStyle = '#e8b21e'; sg.lineWidth = 3; sg.strokeRect(2.5, 2.5, 123, 27);
  sg.fillStyle = '#ffd34d'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
  sg.font = 'bold 20px Arial, sans-serif'; sg.fillText('TAKSİ', 64, 17);
  const signTex = kit.ctex(sc, 1, 1);

  const [cc, cg] = kit.canvas(256, 24);
  cg.fillStyle = '#121316'; cg.fillRect(0, 0, 256, 24);
  cg.fillStyle = '#eee9da';
  for (let y = 0; y < 24; y += 12) for (let x = 0; x < 256; x += 16) if (((x / 16) + (y / 12)) % 2 === 0) cg.fillRect(x, y, 16, 12);
  const checkTex = kit.ctex(cc, 1, 1);

  const [hc, hg] = kit.canvas(64, 64);
  hg.fillStyle = '#0b0b0d'; hg.fillRect(0, 0, 64, 64);
  hg.fillStyle = '#6f7379'; hg.beginPath(); hg.arc(32, 32, 26, 0, Math.PI * 2); hg.fill();
  hg.fillStyle = '#26282c'; hg.beginPath(); hg.arc(32, 32, 19, 0, Math.PI * 2); hg.fill();
  hg.fillStyle = '#9a9ea4';
  for (let i = 0; i < 6; i++){ hg.save(); hg.translate(32, 32); hg.rotate(i * Math.PI / 3); hg.fillRect(-2.2, -19, 4.4, 13); hg.restore(); }
  hg.fillStyle = '#3a3d42'; hg.beginPath(); hg.arc(32, 32, 6, 0, Math.PI * 2); hg.fill();
  const hubTex = kit.ctex(hc, 1, 1);

  /* ---------- paylaşılan malzemeler (bütün taksiler aynılarını kullanır) ---------- */
  const paintM = kit.mat(0xe7b21e, {roughness:0.42, metalness:0.18});
  const glassM = new THREE.MeshStandardMaterial({color:0x1c2c3a, metalness:0.6, roughness:0.15, transparent:true, opacity:0.62, side:THREE.DoubleSide, depthWrite:false});
  const trimM = kit.mat(0x17181b, {roughness:0.8});
  const grayM = kit.mat(0x74777c, {roughness:0.5, metalness:0.35});
  const skinM = kit.mat(0xd9a982, {roughness:0.72});
  const hairM = kit.mat(0x191512, {roughness:0.9});
  const shirtM = kit.mat(0x3e6c8e, {roughness:0.82});
  const headM = new THREE.MeshStandardMaterial({color:0xfff2cc, emissive:0xffdf9a, emissiveIntensity:night0 ? 2.1 : 0.3, roughness:0.3});
  const tailM = new THREE.MeshStandardMaterial({color:0x8f1218, emissive:0xff1b1f, emissiveIntensity:night0 ? 1.5 : 0.28, roughness:0.38});
  const signM = new THREE.MeshStandardMaterial({map:signTex, emissive:0xffffff, emissiveMap:signTex, emissiveIntensity:night0 ? 1.7 : 0.18, roughness:0.48});
  const checkM = new THREE.MeshStandardMaterial({map:checkTex, roughness:0.75});
  const wheelM = new THREE.MeshStandardMaterial({map:hubTex, roughness:0.88, metalness:0.1});

  /* ---------- geometri yardımcıları (hepsi yerel araç koordinatında) ---------- */
  const boxG = (w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz);
    g.translate(x, y, z); return g;
  };
  const cylG = (r1, r2, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const g = new THREE.CylinderGeometry(r1, r2, h, seg);
    if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); if (rz) g.rotateZ(rz);
    g.translate(x, y, z); return g;
  };
  const sphG = (r, seg, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7)));
    if (sx !== 1 || sy !== 1 || sz !== 1) g.scale(sx, sy, sz);
    g.translate(x, y, z); return g;
  };
  const planeG = (w, h, mat, x, y, z, rx = 0, ry = 0) => {
    const g = new THREE.PlaneGeometry(w, h);
    if (rx) g.rotateX(rx); if (ry) g.rotateY(ry);
    g.translate(x, y, z); return g;
  };
  const paneG = (pts, x) => {
    const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ShapeGeometry(sh);
    g.rotateY(-Math.PI / 2); g.translate(x, 0, 0); return g;
  };
  const merge = (arr) => {
    if (!arr.length) return null;
    const gs = arr.length === 1 ? arr : arr.map(g => g.index ? g.toNonIndexed() : g);
    return (arr.length === 1 ? gs[0] : env.mergeBufferGeometries(gs)) || gs[0];
  };
  const mergeParts = (parts) => {
    const out = [];
    parts.forEach((list, mat) => { const g = merge(list); if (g) out.push({g, m:mat}); });
    return out;
  };
  const addB = (parts, mat, g) => { let a = parts.get(mat); if (!a){ a = []; parts.set(mat, a); } a.push(g); };

  /* ---------- gövde: yandan profil, tekerlek yuvaları, kaput ve bagaj ---------- */
  const body = new Map();
  {
    const sh = new THREE.Shape();
    sh.moveTo(2.15, -0.10);
    sh.lineTo(2.15, 0.28);
    sh.lineTo(1.98, 0.36);
    sh.lineTo(1.05, 0.56);
    sh.lineTo(-1.10, 0.56);
    sh.lineTo(-2.00, 0.52);
    sh.lineTo(-2.15, 0.40);
    sh.lineTo(-2.15, -0.10);
    sh.lineTo(-1.78, -0.10);
    sh.lineTo(-1.78, 0.00);
    sh.absarc(-1.35, 0.00, 0.43, Math.PI, 0, true);
    sh.lineTo(-0.92, -0.10);
    sh.lineTo(0.92, -0.10);
    sh.lineTo(0.92, 0.00);
    sh.absarc(1.35, 0.00, 0.43, Math.PI, 0, true);
    sh.lineTo(1.78, -0.10);
    sh.lineTo(2.15, -0.10);
    const g = new THREE.ExtrudeGeometry(sh, {depth:1.70, bevelEnabled:false, steps:1, curveSegments:8});
    g.rotateY(-Math.PI / 2); g.translate(0.85, 0, 0);
    addB(body, paintM, g);

    // kabin camları: ön cam, arka cam, sağ ön ve iki arka yan cam (şoför camı açık)
    addB(body, glassM, planeG(1.42, 0.79, glassM, 0, 0.817, 0.77, -0.844));
    addB(body, glassM, planeG(1.42, 0.617, glassM, 0, 0.817, -0.95, -2.418));
    addB(body, glassM, paneG([[-0.98, 0.585], [-0.11, 0.585], [-0.11, 1.045], [-0.76, 1.045]], -0.752));
    addB(body, glassM, paneG([[-0.98, 0.585], [-0.11, 0.585], [-0.11, 1.045], [-0.76, 1.045]], 0.752));
    addB(body, glassM, paneG([[0.11, 0.585], [0.98, 0.585], [0.55, 1.045], [0.11, 1.045]], -0.752));

    // tavan ve siyah direkler
    addB(body, paintM, boxG(1.52, 0.06, 1.30, 0, 1.095, -0.16));
    [-1, 1].forEach(s => {
      addB(body, trimM, boxG(0.035, 0.46, 0.055, s * 0.755, 0.815, -0.10));
      addB(body, trimM, boxG(0.04, 0.78, 0.04, s * 0.723, 0.817, 0.77, -0.844));
      addB(body, trimM, boxG(0.04, 0.62, 0.04, s * 0.723, 0.817, -0.95, 0.583));
      addB(body, trimM, boxG(0.05, 0.05, 1.30, s * 0.752, 1.055, -0.16));
      addB(body, trimM, boxG(0.02, 0.035, 2.20, s * 0.856, 0.565, -0.03));
      // kapı dikişleri, kollar, aynalar
      addB(body, trimM, boxG(0.012, 0.56, 0.012, s * 0.856, 0.28, 0.25));
      addB(body, trimM, boxG(0.012, 0.56, 0.012, s * 0.856, 0.28, -0.55));
      addB(body, grayM, boxG(0.10, 0.03, 0.04, s * 0.857, 0.44, 0.58));
      addB(body, grayM, boxG(0.10, 0.03, 0.04, s * 0.857, 0.44, -0.38));
      addB(body, trimM, boxG(0.12, 0.035, 0.05, s * 0.90, 0.665, 0.71));
      addB(body, grayM, boxG(0.10, 0.09, 0.17, s * 0.965, 0.685, 0.70));
    });
    addB(body, trimM, boxG(1.46, 0.04, 0.06, 0, 1.055, 0.49));
    addB(body, trimM, boxG(1.46, 0.04, 0.06, 0, 1.055, -0.77));

    // alt gövde, tamponlar, ızgara, farlar ve stoplar
    addB(body, trimM, boxG(1.30, 0.24, 3.20, 0, -0.11, 0));
    addB(body, grayM, boxG(1.74, 0.16, 0.14, 0, -0.02, 2.16));
    addB(body, grayM, boxG(1.74, 0.16, 0.14, 0, -0.02, -2.16));
    addB(body, trimM, boxG(0.72, 0.12, 0.05, 0, 0.16, 2.185));
    addB(body, trimM, boxG(0.36, 0.11, 0.03, 0, 0.17, -2.185));
    [-1, 1].forEach(s => {
      addB(body, headM, boxG(0.34, 0.14, 0.05, s * 0.55, 0.255, 2.155));
      addB(body, tailM, boxG(0.30, 0.12, 0.05, s * 0.58, 0.34, -2.17));
    });

    // kapı dama şeridi
    addB(body, checkM, planeG(1.90, 0.13, checkM, 0.858, 0.35, 0.02, 0, Math.PI / 2));
    addB(body, checkM, planeG(1.90, 0.13, checkM, -0.858, 0.35, 0.02, 0, -Math.PI / 2));

    // iç mekân: koltuklar, torpido, direksiyon
    addB(body, trimM, boxG(0.32, 0.10, 0.30, 0.34, 0.49, 0.30));
    addB(body, trimM, boxG(0.30, 0.40, 0.12, 0.34, 0.58, 0.10));
    addB(body, trimM, boxG(1.28, 0.12, 0.26, 0, 0.57, 0.80));
    addB(body, trimM, new THREE.TorusGeometry(0.10, 0.018, 6, 12).translate(0.34, 0.67, 0.63));
    addB(body, trimM, cylG(0.022, 0.026, 0.22, 6, 0.34, 0.65, 0.74, Math.PI / 2));
    addB(body, trimM, boxG(1.16, 0.10, 0.38, 0, 0.50, -0.52));
    addB(body, trimM, boxG(1.16, 0.34, 0.10, 0, 0.66, -0.72));

    // ruhsat ışığı (TAKSİ tabelası)
    addB(body, trimM, boxG(0.94, 0.035, 0.20, 0, 1.125, -0.16));
    addB(body, signM, boxG(0.88, 0.16, 0.10, 0, 1.215, -0.16));
  }
  const bodyList = mergeParts(body);

  /* ---------- şoför (sol önde) ve arka yolcu ---------- */
  const drv = new Map(), pas = new Map();
  {
    // gövde, baş, bıyık, saç
    addB(drv, shirtM, boxG(0.30, 0.34, 0.22, 0.34, 0.68, 0.30));
    addB(drv, shirtM, boxG(0.38, 0.10, 0.22, 0.34, 0.815, 0.30));
    addB(drv, skinM, sphG(0.10, 12, 0.34, 0.885, 0.31));
    addB(drv, skinM, sphG(0.022, 6, 0.34, 0.872, 0.402));
    addB(drv, skinM, sphG(0.024, 6, 0.245, 0.885, 0.31, 0.6, 1, 0.7));
    addB(drv, skinM, sphG(0.024, 6, 0.435, 0.885, 0.31, 0.6, 1, 0.7));
    addB(drv, hairM, new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58).translate(0.34, 0.895, 0.305));
    addB(drv, hairM, sphG(0.075, 8, 0.34, 0.865, 0.245, 1, 1.05, 0.7));
    addB(drv, hairM, sphG(0.026, 6, 0.312, 0.854, 0.398, 1.25, 0.45, 0.55));
    addB(drv, hairM, sphG(0.026, 6, 0.368, 0.854, 0.398, 1.25, 0.45, 0.55));
    addB(drv, hairM, sphG(0.011, 5, 0.302, 0.895, 0.401));
    addB(drv, hairM, sphG(0.011, 5, 0.378, 0.895, 0.401));

    // sol kol camdan dışarı: omuz -> dirsek -> aşağı sarkan el
    addB(drv, skinM, cylG(0.052, 0.058, 0.44, 8, 0.71, 0.74, 0.30, 0, 0, -1.82));
    addB(drv, shirtM, cylG(0.070, 0.076, 0.16, 8, 0.56, 0.79, 0.30, 0, 0, -1.82));
    addB(drv, skinM, cylG(0.043, 0.047, 0.36, 8, 0.95, 0.51, 0.285, 0, 0, 0.17));
    addB(drv, skinM, sphG(0.055, 8, 0.98, 0.33, 0.275, 0.9, 1.1, 0.72));
    addB(drv, skinM, cylG(0.043, 0.048, 0.28, 8, 0.18, 0.60, 0.34, 0, 0, -0.10));

    // arka yolcu: yalnız baş ve omuz
    addB(pas, shirtM, boxG(0.42, 0.22, 0.26, -0.26, 0.72, -0.52));
    addB(pas, skinM, sphG(0.10, 12, -0.26, 0.875, -0.52));
    addB(pas, skinM, sphG(0.023, 6, -0.26, 0.862, -0.43));
    addB(pas, hairM, new THREE.SphereGeometry(0.104, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58).translate(-0.26, 0.885, -0.525));
    addB(pas, hairM, sphG(0.072, 8, -0.26, 0.855, -0.585, 1, 1.05, 0.7));
  }
  const drvList = mergeParts(drv);
  const pasList = mergeParts(pas);
  const both = new Map();
  drv.forEach((list, m) => { both.set(m, list.slice()); });
  pas.forEach((list, m) => { if (both.has(m)) both.get(m).push(...list); else both.set(m, list.slice()); });
  const bothList = mergeParts(both);

  /* ---------- tekerlekler: aks başına tek mesh, jant dokusu kapaklarda ---------- */
  const wheelGeo = (() => {
    const arr = [];
    [-axleX, axleX].forEach(x => {
      const g = new THREE.CylinderGeometry(wheelR, wheelR, 0.22, 16, 1, false);
      const uv = g.attributes.uv, n = g.attributes.normal;
      for (let i = 0; i < n.count; i++) if (Math.abs(n.getY(i)) < 0.5) uv.setXY(i, 0.02, 0.02);
      g.rotateZ(Math.PI / 2); g.translate(x, 0, 0); arr.push(g);
    });
    return merge(arr);
  })();

  const noCast = (m) => m === glassM || m === headM || m === tailM || m === checkM;
  const addList = (g, list) => { list.forEach(o => kit.add(o.g, o.m, 0, 0, 0, g, !noCast(o.m))); };
  const addWheels = (g, anim) => {
    const a = kit.add(wheelGeo, wheelM, 0, 0, wheelZ, g, true);
    const b = kit.add(wheelGeo, wheelM, 0, 0, -wheelZ, g, true);
    if (anim){ a.userData.anim = true; b.userData.anim = true; }
    return [a, b];
  };

  const carY = (x, z, ry) => {
    const fx = Math.sin(ry), fz = Math.cos(ry);
    const yf = env.Hs(x + fx * wheelZ, z + fz * wheelZ);
    const yr = env.Hs(x - fx * wheelZ, z - fz * wheelZ);
    return {y:(yf + yr) / 2 + wheelR + SURF, p:-Math.atan2(yf - yr, wheelZ * 2)};
  };

  /* ---------- cadde yolları: kara parçaları, şerit, teğet ---------- */
  const dense = (pts) => {
    const out = [];
    for (let i = 0; i + 1 < pts.length; i++){
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 2));
      for (let k = (i ? 1 : 0); k <= n; k++) out.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]);
    }
    return out;
  };
  const pathOf = (pts) => {
    const n = pts.length;
    if (n < 3) return null;
    const ss = [0];
    for (let i = 1; i < n; i++) ss[i] = ss[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const L0 = ss[n - 1];
    if (L0 < 20) return null;
    // uçlarda 5.5 m pay: dönerken araç gövdesi kıyıya taşmasın
    const cut = 5.5, i0 = ss.findIndex(v => v >= cut), i1 = n - 1 - ss.slice().reverse().findIndex(v => v <= L0 - cut);
    if (i0 < 0 || i1 <= i0 + 1) return null;
    const px = [], pz = [], tx = [], tz = [], nx = [], nz = [], s = [];
    for (let i = i0; i <= i1; i++){
      const a = pts[Math.max(i0, i - 1)], b = pts[Math.min(i1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      px.push(pts[i][0]); pz.push(pts[i][1]);
      tx.push(dx); tz.push(dz); nx.push(-dz); nz.push(dx);
      s.push(ss[i] - ss[i0]);
    }
    return {px, pz, tx, tz, nx, nz, s, L:s[s.length - 1]};
  };
  const laneRuns = (pts, w) => {
    const P = dense(pts), lane = w / 4, runs = [];
    let cur = [];
    for (let i = 0; i < P.length; i++){
      const [x, z] = P[i], a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      let dx = b[0] - a[0], dz = b[1] - a[1];
      const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      const rx = -dz, rz = dx;
      const ok = env.landG(x, z) && env.landG(x + rx * lane, z + rz * lane) && env.landG(x - rx * lane, z - rz * lane);
      if (ok) cur.push([x, z]);
      else if (cur.length){ runs.push(cur); cur = []; }
    }
    if (cur.length) runs.push(cur);
    return runs;
  };
  const sample = (p, s, out) => {
    const S = p.s;
    let lo = 0, hi = S.length - 1;
    while (lo + 1 < hi){ const mid = (lo + hi) >> 1; if (S[mid] <= s) lo = mid; else hi = mid; }
    const d = S[hi] - S[lo] || 1, u = Math.max(0, Math.min(1, (s - S[lo]) / d));
    out.x = p.px[lo] + (p.px[hi] - p.px[lo]) * u;
    out.z = p.pz[lo] + (p.pz[hi] - p.pz[lo]) * u;
    let tx = p.tx[lo] + (p.tx[hi] - p.tx[lo]) * u, tz = p.tz[lo] + (p.tz[hi] - p.tz[lo]) * u;
    const d2 = Math.hypot(tx, tz) || 1; tx /= d2; tz /= d2;
    out.tx = tx; out.tz = tz; out.nx = -tz; out.nz = tx;
  };

  // en uzun kara parçası >120 m olan caddeler (her cadde için bir aday)
  const cand = [];
  env.AVENUES.forEach(([w, pts], ai) => {
    let best = null;
    laneRuns(pts, w).forEach(run => {
      const p = pathOf(run);
      if (p && p.L > 120 && (!best || p.L > best.L)) best = p;
    });
    if (best) cand.push({ai, w, p:best});
  });
  cand.sort((a, b) => b.p.L - a.p.L);
  const use = cand.slice(0, 10);
  const taksimRoad = cand.find(c => c.ai === 10);
  if (taksimRoad && use.indexOf(taksimRoad) < 0){
    if (use.length >= 10) use[9] = taksimRoad; else use.push(taksimRoad);
  }
  const routes = use.slice(0, 10);

  /* ---------- hareketli taksiler ---------- */
  const cars = [], dyn = [];
  const pose = (m) => {
    const smp = m.smp;
    const x = smp.x + smp.nx * m.lat, z = smp.z + smp.nz * m.lat;
    const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);
    const yf = env.Hs(x + fx * wheelZ, z + fz * wheelZ);
    const yr = env.Hs(x - fx * wheelZ, z - fz * wheelZ);
    const y = (yf + yr) / 2 + wheelR + SURF;
    m.x = x; m.z = z; m.g.position.set(x, y, z);
    m.g.rotation.y = m.yaw; m.g.rotation.x = -Math.atan2(yf - yr, wheelZ * 2);
    // çarpışma daireleri: dünya koordinatı, nesneler bir kez oluşturulur
    m.dA.x = env.AT.x + x + fx * 1.15; m.dA.z = env.AT.z + z + fz * 1.15;
    m.dB.x = env.AT.x + x - fx * 1.15; m.dB.z = env.AT.z + z - fz * 1.15;
  };
  const wrapA = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };

  routes.forEach((c, i) => {
    const g = new THREE.Group();
    g.userData.dyn = true; g.name = 'Taksi' + (i + 1); g.rotation.order = 'YXZ';
    root.add(g);
    addList(g, bodyList);
    addList(g, (i % 2 === 0) ? bothList : drvList);
    const [fa, ra] = addWheels(g, true);
    const dir = rnd() < 0.5 ? 1 : -1, lane = c.w / 4;
    const s0 = 8 + rnd() * Math.max(1, c.p.L - 16);
    const smp = {x:0, z:0, tx:0, tz:0, nx:0, nz:0};
    sample(c.p, s0, smp);
    const m = {
      g, av:c.ai, path:c.p, lane, dir, s:s0, v:(6 + rnd() * 3) * 0.55, lat:dir * lane, latT:dir * lane,
      yaw:Math.atan2(smp.tx * dir, smp.tz * dir), smp, cruise:6 + rnd() * 3, turn:0, heroT:0, lastHorn:-30 - i * 0.7,
      fa, ra, spin:0, dA:{x:0, z:0, r:1.0}, dB:{x:0, z:0, r:1.0}, x:0, z:0,
    };
    pose(m);
    cars.push(m); dyn.push(m.dA, m.dB);
  });
  if (dyn.length) ctx.C.dynamics.push(() => dyn);

  /* ---------- park yerleri: meydan kenarı, yolun dışında ---------- */
  const carFits = (x, z, ry) => {
    const c = Math.cos(ry), s = Math.sin(ry);
    const pts = [[0, 0], [-0.92, -2.22], [0.92, -2.22], [-0.92, 2.22], [0.92, 2.22], [0, -2.22], [0, 2.22], [-0.92, 0], [0.92, 0]];
    for (let i = 0; i < pts.length; i++){
      const lx = pts[i][0], lz = pts[i][1];
      const wx = x + lx * c + lz * s, wz = z - lx * s + lz * c;
      if (!env.landG(wx, wz) || !env.inland(wx, wz, 0.6) || env.roadDist(wx, wz) < 0.35) return false;
      if (env.occ.has(env.cell(wx, wz))) return false;
    }
    return !ctx.C.blocked(x, z, 2.42);
  };
  const findPark = (cx, cz, ry) => {
    for (let r = 0; r <= 22; r += 1.2) for (let a = 0; a < Math.PI * 2; a += Math.PI / 28){
      if (r === 0 && a > 0) break;
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      if (carFits(x, z, ry)) return [x, z];
    }
    return null;
  };
  const parked = [];
  const addParked = (cx, cz, ry) => {
    const p = findPark(cx, cz, ry);
    if (!p) return null;
    const [x, z] = p;
    const yy = carY(x, z, ry);
    const g = new THREE.Group();
    g.rotation.order = 'YXZ'; g.position.set(x, yy.y, z); g.rotation.y = ry; g.rotation.x = yy.p;
    env.reg(x, z).add(g);
    addList(g, bodyList);
    addWheels(g, false);
    ctx.C.box(x, z, 0.95, 2.26, ry);
    const c = Math.cos(ry), s = Math.sin(ry);
    for (let lx = -1.1; lx <= 1.1; lx += 1.1) for (let lz = -2.2; lz <= 2.2; lz += 1.1) env.occ.add(env.cell(x + lx * c + lz * s, z - lx * s + lz * c));
    parked.push({x, z, ry});
    return parked[parked.length - 1];
  };
  addParked(-128, -392, 1.20);
  addParked(-141, -381, 1.20);
  addParked(-110, -8, 0.25);

  /* ---------- park eden taksinin yanındaki Taksici Kemal ---------- */
  if (parked.length){
    const q = parked[0], c = Math.cos(q.ry), s = Math.sin(q.ry);
    const spots = [[1.95, 0], [-1.95, 0], [1.9, 1.7], [-1.9, 1.7], [0, -3.1], [0, 3.2]];
    const npOk = (x, z) => env.landG(x, z) && env.inland(x, z, 0.5) && env.roadDist(x, z) > 0.4 && !ctx.C.blocked(x, z, 0.42);
    let np = null;
    for (let i = 0; i < spots.length && !np; i++){
      const side = spots[i][0], fwd = spots[i][1];
      const nx = q.x + c * side + s * fwd;
      const nz = q.z - s * side + c * fwd;
      if (npOk(nx, nz)) np = [nx, nz];
    }
    for (let r = 2.4; r <= 8 && !np; r += 1.2) for (let a = 0; a < Math.PI * 2; a += Math.PI / 12){
      const nx = q.x + Math.sin(a) * r, nz = q.z + Math.cos(a) * r;
      if (npOk(nx, nz)){ np = [nx, nz]; break; }
    }
    if (np){
      const kemal = env.say('Taksici Kemal', [
        'Trafik mi? Bu saatte Taksim\'den Eminönü\'ne yarım saatte gidilir... Yürüyerek on dakika sürer ama olsun.',
        'Boğaz\'ı sabah erkenden görsen, vapur düdükleriyle başlar gün. Bir çay, bir simit, tamamdır.',
        'Nereye abi? Sarayburnu\'na mı, Kapalıçarşı\'ya mı? Taksimetre açık, yol da bizden.',
      ]);
      env.npcAt(env.adam({coat:0x2a2a2a, hat:'yok'}), np[0], np[1], Math.atan2(q.x - np[0], q.z - np[1]), 'Taksici Kemal', kemal, env.Hs(np[0], np[1]) + 0.07);
    }
  }

  /* ---------- her kare: sürüş, korna, tekerlek, farlar ---------- */
  let night = night0;
  ctx.onUpdate((dt, t) => {
    const d = Math.min(Math.max(dt, 0), 0.08);
    const nt = ctx.W.night > 0.45;
    if (nt !== night){
      night = nt;
      headM.emissiveIntensity = night ? 2.1 : 0.3;
      tailM.emissiveIntensity = night ? 1.5 : 0.28;
      signM.emissiveIntensity = night ? 1.7 : 0.18;
    }
    const hx = ctx.hero ? ctx.hero.x : 1e9, hz = ctx.hero ? ctx.hero.z : 1e9;

    for (let i = 0; i < cars.length; i++){
      const m = cars[i];
      const fx = Math.sin(m.yaw), fz = Math.cos(m.yaw);

      // oyuncu önünde mi?
      const dx = hx - m.x, dz = hz - m.z;
      const fw = dx * fx + dz * fz, side = dx * fz - dz * fx;
      const heroBlock = fw > 0.8 && fw < 9.0 && Math.abs(side) < 2.8;

      // aynı caddede öndeki taksiye 8 m'den fazla yaklaşma
      let taxiBlock = false;
      for (let j = 0; j < cars.length; j++){
        if (j === i) continue;
        const n = cars[j];
        if (n.av !== m.av || n.dir !== m.dir) continue;
        const gap = (n.s - m.s) * m.dir;
        if (gap > 0 && gap < 8.5){ taxiBlock = true; break; }
      }

      // uçta yavaşla ve dön
      const endD = m.dir > 0 ? m.path.L - m.s : m.s;
      let tv = Math.min(m.cruise, Math.sqrt(2 * 2.6 * Math.max(0, endD - 0.45)));
      if (m.turn > 0 || heroBlock || taxiBlock) tv = 0;
      const acc = tv > m.v ? 2.0 : (heroBlock || taxiBlock ? 9.0 : 3.2);
      const dv = tv - m.v;
      m.v += Math.max(-acc * d, Math.min(acc * d, dv));
      if (m.v < 0.02 && tv === 0) m.v = 0;

      if (m.turn > 0){
        m.turn -= d;
        if (m.turn <= 0){ m.turn = 0; }
      } else {
        m.s += m.dir * m.v * d;
        if (m.s < 0){ m.s = 0; m.v = 0; }
        if (m.s > m.path.L){ m.s = m.path.L; m.v = 0; }
        const e2 = m.dir > 0 ? m.path.L - m.s : m.s;
        if (e2 < 0.45 && m.v < 0.5 && !heroBlock && !taxiBlock){
          m.turn = 1.15; m.dir = -m.dir; m.latT = m.dir * m.lane; m.v = 0;
        }
      }

      // korna: 1.5 sn sonra, en çok 4 sn'de bir
      if (heroBlock){
        m.heroT += d;
        if (m.heroT > 1.5 && t - m.lastHorn > 4){ ctx.sfx('blip'); m.lastHorn = t; }
      } else m.heroT = 0;

      // şerit ve yön yumuşak
      m.lat += (m.latT - m.lat) * Math.min(1, d * 2.6);
      sample(m.path, m.s, m.smp);
      const tyaw = Math.atan2(m.smp.tx * m.dir, m.smp.tz * m.dir);
      m.yaw += wrapA(tyaw - m.yaw) * Math.min(1, d * 3.4);
      pose(m);

      // tekerlek dönüşü
      m.spin = (m.spin + m.v * d / wheelR) % (Math.PI * 2);
      m.fa.rotation.x = m.spin; m.ra.rotation.x = m.spin;
    }
  });
}
