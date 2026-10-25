// İstanbul vapurları: üç hat, iskele etkileşimleri, güvertede yolculuk.
// Hat noktaları su üstünde ve Kız Kulesi'nden en az 22 m uzakta tutulur.
export function buildFerries(ctx, env){
  const T = ctx.THREE, kit = ctx.kit, DOCKS = env.DOCKS || [];
  if (DOCKS.length < 4) return;
  const SEA_Y = env.SEA_Y, AT = env.AT, KIZ = env.KIZ;
  const NAMES = ['Eminönü', 'Karaköy', 'Üsküdar', 'Kadıköy'];
  const DECK_Y = SEA_Y + 1.2, HW = 2.6, HL = 11, KMIN = 22;

  /* ---------- iskele yerel -> ada koordinatı ---------- */
  const toW = (d, lx, lz) => {
    const x = DOCKS[d][0], z = DOCKS[d][1], ry = DOCKS[d][2];
    const c = Math.cos(ry), s = Math.sin(ry);
    return [x + lx * c + lz * s, z - lx * s + lz * c];
  };
  const S = [], BOARD = [], LAND = [];
  for (let d = 0; d < 4; d++){
    S.push(toW(d, 0, 15));       // yanaşma noktası
    BOARD.push(toW(d, 0, 6));    // binme etkileşimi (platform ucu)
    LAND.push(toW(d, 0, -4));    // inme noktası (kara tarafı)
  }

  /* ---------- rota noktalarını doğrula: su + Kız Kulesi'ne 22 m ---------- */
  const clear = (x, z) => !env.onLand(x, z) && Math.hypot(x - KIZ.x, z - KIZ.z) > KMIN;
  function fixPoint(x, z){
    for (let n = 0; n < 28; n++){
      if (clear(x, z)) break;
      if (Math.hypot(x - KIZ.x, z - KIZ.z) <= KMIN){
        const dx = x - KIZ.x, dz = z - KIZ.z, d = Math.hypot(dx, dz) || 1;
        x = KIZ.x + dx / d * (KMIN + 3); z = KIZ.z + dz / d * (KMIN + 3);
      }
      if (env.onLand(x, z)){
        let done = false;
        for (let r = 4; r <= 90 && !done; r += 4){
          for (let a = 0; a < 20; a++){
            const q = a / 20 * Math.PI * 2;
            const nx = x + Math.cos(q) * r, nz = z + Math.sin(q) * r;
            if (clear(nx, nz)){ x = nx; z = nz; done = true; break; }
          }
        }
        if (!done) break;
      }
    }
    return [x, z];
  }
  // Uç noktalar (iskele yanaşmaları) sabit kalır; ara noktalar ve örnekler düzeltilir.
  function routeSafe(src){
    const p = src.map(q => [q[0], q[1]]);
    for (let i = 1; i < p.length - 1; i++){
      const q = fixPoint(p[i][0], p[i][1]); p[i][0] = q[0]; p[i][1] = q[1];
    }
    for (let pass = 0; pass < 3; pass++){
      let bad = false;
      for (let i = 0; i < p.length - 1; i++){
        const a = p[i], b = p[i + 1];
        const n = Math.max(4, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
        for (let k = 1; k < n; k++){
          const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n;
          if (clear(x, z)) continue;
          bad = true;
          const j = i + 1 < p.length - 1 ? i + 1 : (i > 0 ? i : -1);
          if (j > 0 && j < p.length - 1){
            const q = fixPoint(p[j][0] + (p[j][0] - x), p[j][1] + (p[j][1] - z));
            p[j][0] = q[0]; p[j][1] = q[1];
          }
        }
      }
      if (!bad) break;
    }
    return p;
  }

  // Yanaşma öncesi nokta: iskele hattı boyunca 24 m (vapur yan yana yaklaşır).
  const PRE = [-24, 24, -24, -24];
  const pre = (d) => toW(d, PRE[d], 15);
  const raw = [
    {a:0, b:2, pts:[S[0], pre(0), [60, -55], pre(2), S[2]]},
    // (104,60) Kız Kulesi'ne 22 m'den fazla kalmak için eklendi.
    {a:1, b:3, pts:[S[1], pre(1), [100, -80], [100, -20], [104, 60], [120, 150], [200, 240], pre(3), S[3]]},
    // (89,60) Kız Kulesi'nin batısında geniş geçiş; (200,300) Kadıköy'e
    // güneybatıdan yaklaştırır, B hattının son yaklaşmasıyla çakışmaz.
    {a:0, b:3, pts:[S[0], pre(0), [100, -30], [89, 60], [105, 150], [200, 300], pre(3), S[3]]}
  ];

  /* ---------- paylaşılan malzemeler ---------- */
  const M = {
    hull: kit.mat(0x14161a, {roughness:0.52, metalness:0.25}),
    white: kit.mat(0xf3efe4, {roughness:0.62}),
    deck: kit.mat(0x8a6a45, {roughness:0.85}),
    rail: kit.mat(0xc3c7c9, {metalness:0.55, roughness:0.32}),
    dark: kit.mat(0x2a2c30, {roughness:0.6}),
    yellow: kit.mat(0xe6b22e, {roughness:0.55}),
    orange: kit.mat(0xef6f24, {roughness:0.6}),
    tea: kit.mat(0xb8481a, {transparent:true, opacity:0.82, roughness:0.25}),
    door: new T.MeshBasicMaterial({color:0x0a0a0c, side:T.DoubleSide}),
    skin: null, hair: null
  };

  /* ---------- bayrak dokusu ---------- */
  const flagTex = (() => {
    const [c, g] = kit.canvas(256, 170);
    g.fillStyle = '#d21c2c'; g.fillRect(0, 0, 256, 170);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(86, 85, 42, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d21c2c'; g.beginPath(); g.arc(97, 85, 33.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath();
    for (let i = 0; i < 10; i++){ const a = Math.PI + i * Math.PI / 5, r = i % 2 ? 8.4 : 21; g.lineTo(142 + Math.cos(a) * r, 85 + Math.sin(a) * r); }
    g.closePath(); g.fill();
    return kit.ctex(c, 1, 1);
  })();
  M.flag = new T.MeshStandardMaterial({map:flagTex, roughness:0.85, side:T.DoubleSide});

  /* ---------- paylaşılan geometriler ---------- */
  // Çift uçlu vapur: 26 m boy, 7 m genişlik; iki uç da 2 m'lik sivri burun.
  const sh = new T.Shape();
  sh.moveTo(-3.5, 11); sh.lineTo(0, 13); sh.lineTo(3.5, 11); sh.lineTo(3.5, -11);
  sh.lineTo(0, -13); sh.lineTo(-3.5, -11); sh.closePath();
  const hullGeo = new T.ExtrudeGeometry(sh, {depth:1.55, bevelEnabled:false});
  hullGeo.rotateX(-Math.PI / 2);
  const G = {
    hull: hullGeo,
    deck: new T.BoxGeometry(5.6, 0.14, 22.1),
    wall: new T.BoxGeometry(0.14, 2.46, 21.4),
    sideDeck: new T.BoxGeometry(0.95, 0.14, 22),
    endDeck: new T.BoxGeometry(5.7, 0.14, 1.0),
    endDeckBow: new T.BoxGeometry(4.7, 0.14, 1.0),
    post: new T.BoxGeometry(0.07, 1.05, 0.07),
    barX: new T.BoxGeometry(0.06, 0.06, 21.6),
    barZ: new T.BoxGeometry(5.6, 0.06, 0.06),
    window: new T.PlaneGeometry(1.5, 0.88),
    port: new T.CylinderGeometry(0.23, 0.23, 0.06, 12),
    bench: new T.BoxGeometry(0.72, 0.09, 5.6),
    benchBack: new T.BoxGeometry(0.07, 0.5, 5.6),
    benchLeg: new T.BoxGeometry(0.08, 0.42, 0.08),
    house: new T.BoxGeometry(3.4, 1.55, 3.0),
    houseWin: new T.PlaneGeometry(2.5, 0.7),
    houseSideWin: new T.PlaneGeometry(2.0, 0.62),
    roof: new T.BoxGeometry(3.8, 0.12, 3.4),
    funnel: new T.CylinderGeometry(0.55, 0.72, 2.1, 12),
    funnelTop: new T.CylinderGeometry(0.58, 0.58, 0.34, 12),
    ring: new T.TorusGeometry(0.31, 0.075, 7, 16),
    pole: new T.CylinderGeometry(0.045, 0.055, 4.9, 7),
    flag: new T.PlaneGeometry(1.45, 0.95),
    tray: new T.CylinderGeometry(0.32, 0.32, 0.035, 12),
    glass: new T.CylinderGeometry(0.045, 0.036, 0.1, 7)
  };

  // Yolcu/vendör malzemelerini vapurun paylaşılan paletine indir: kişi başına
  // onlarca ayrı çizim çağrısı yerine gemi başına tek palto + ten + saç kalır.
  function dress(p){
    const u = p.userData;
    if (u.skin && !M.skin){ M.skin = u.skin; M.hair = u.hair; }
    if (!u.armL) return p;               // kadın figürünün yüzünü/kumaşını koru
    const coat = u.armL.children[0] && u.armL.children[0].material;
    p.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (u.skin && m === u.skin){ o.material = M.skin; return; }
      if (u.hair && m === u.hair){ o.material = M.hair; return; }
      if (m === coat) return;
      if (m && m.color){
        const c = m.color;
        o.material = (c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722 > 0.42) ? M.white : M.dark;
      }
    });
    return p;
  }

  /* ---------- vapur modeli ---------- */
  function makeFerry(fi, route, pts){
    const g = new T.Group(); g.userData.dyn = true; ctx.root.add(g);
    const add = (geo, mat, x, y, z, cast = true) => kit.add(geo, mat, x, y, z, g, cast);
    const coat = [0x5a3a2a, 0x2a5a4a, 0x4a4a6a][fi];

    // siyah alt gövde (su çizgisinin 0.35 m altına iner)
    add(G.hull, M.hull, 0, -0.36, 0);
    // alt güverte (yürünebilir yüzey y=1.2)
    add(G.deck, M.deck, 0, 1.13, 0);
    [-1, 1].forEach(s => {
      add(G.wall, M.white, s * 2.85, 2.43, 0);
      // lombozlar (kara gövde) ve pencere sırası
      for (let k = -2; k <= 2; k++){
        const p = add(G.port, kit.winMat, s * 3.52, 0.72, k * 3.0, false);
        p.rotation.z = Math.PI / 2;
      }
      for (let k = -3.5; k <= 3.5; k++){
        const w = add(G.window, kit.winMat, s * 2.93, 2.3, k * 2.85, false);
        w.rotation.y = s * Math.PI / 2;
      }
      // can simitleri
      [-1, 1].forEach(e => {
        const r = add(G.ring, M.orange, s * 2.94, 1.75, e * 7.0);
        r.rotation.y = s * Math.PI / 2;
      });
    });
    // baş/kıç düşük duvar ve korkuluk
    [-1, 1].forEach(e => {
      add(new T.BoxGeometry(5.5, 0.8, 0.12), M.white, 0, 1.6, e * 11.1);
      add(new T.BoxGeometry(5.5, 0.06, 0.06), M.rail, 0, 2.12, e * 11.1);
      for (let k = -2; k <= 2; k++) add(new T.BoxGeometry(0.06, 0.5, 0.06), M.rail, k * 1.2, 1.95, e * 11.1);
    });

    // üst güverte: ortası açık halka (kamera ve ışık için)
    [-1, 1].forEach(s => add(G.sideDeck, M.white, s * 2.95, 3.72, 0));
    add(G.endDeckBow, M.white, 0, 3.72, 10.55);
    add(G.endDeck, M.white, 0, 3.72, -10.55);
    // üst güverte korkulukları
    [-1, 1].forEach(s => {
      for (let k = -5; k <= 5; k++) add(G.post, M.rail, s * 3.28, 4.34, k * 2.05);
      add(G.barX, M.rail, s * 3.28, 4.3, 0);
      add(G.barX, M.rail, s * 3.28, 4.78, 0);
      [-1, 1].forEach(e => { const r = add(G.ring, M.orange, s * 3.33, 4.2, e * 5.2); r.rotation.y = s * Math.PI / 2; });
    });
    [-1, 1].forEach(e => {
      for (let k = -2; k <= 2; k++) add(G.post, M.rail, k * 1.3, 4.34, e * 10.8);
      add(G.barZ, M.rail, 0, 4.3, e * 10.8);
      add(G.barZ, M.rail, 0, 4.78, e * 10.8);
    });

    // kaptan köşkü (üst güverte, ön); altındaki platform yan güvertelere oturur
    add(new T.BoxGeometry(5.2, 0.14, 3.4), M.white, 0, 3.72, 8.0);
    add(G.house, M.white, 0, 4.57, 8.0);
    add(G.houseWin, kit.winMat, 0, 4.82, 9.52, false);
    [-1, 1].forEach(s => { const w = add(G.houseSideWin, kit.winMat, s * 1.71, 4.82, 8.0, false); w.rotation.y = s * Math.PI / 2; });
    add(G.roof, M.white, 0, 5.41, 8.0);
    add(new T.CylinderGeometry(0.035, 0.045, 1.1, 5), M.dark, 0.7, 5.98, 7.6);

    // sarı-siyah tek baca (üst güverte halkasının ortasında bir kaide üzerinde)
    add(new T.BoxGeometry(5.9, 0.14, 2.2), M.white, 0, 3.72, -7.7);
    add(new T.BoxGeometry(2.1, 0.55, 2.0), M.white, 0, 3.98, -7.7);
    add(G.funnel, M.yellow, 0, 5.05, -7.7);
    add(G.funnelTop, M.hull, 0, 6.12, -7.7);
    add(new T.CylinderGeometry(0.63, 0.63, 0.08, 12), M.hull, 0, 6.31, -7.7);

    // kıçta Türk bayrağı; direk alt güverteden yükselir
    add(G.pole, M.rail, 0, 3.6, -11.55);
    const fl = add(G.flag, M.flag, 0, 5.2, -12.25, false);
    fl.rotation.y = Math.PI / 2;

    // alt güverte sıraları (yolcular için)
    [-1, 1].forEach(s => {
      const bx = s * 2.2;
      add(G.bench, M.deck, bx, 1.575, -3.0);
      add(G.benchBack, M.white, s * 2.55, 1.9, -3.0);
      add(G.benchLeg, M.dark, bx - 0.28, 1.36, -5.4);
      add(G.benchLeg, M.dark, bx + 0.28, 1.36, -5.4);
      add(G.benchLeg, M.dark, bx - 0.28, 1.36, -0.6);
      add(G.benchLeg, M.dark, bx + 0.28, 1.36, -0.6);
    });

    // yolcular: env.someone ile; 4 oturan + 1 ayakta
    const base = [1, 2, 4][fi];
    const seats = [[-2.18, -5.3, Math.PI / 2], [-2.18, -1.2, Math.PI / 2], [2.18, -4.7, -Math.PI / 2], [2.18, -0.6, -Math.PI / 2]];
    for (let k = 0; k < 4; k++){
      const p = env.someone(base + 24 * k);
      env.sit(p);
      p.position.set(seats[k][0], 0.78, seats[k][1]); p.rotation.y = seats[k][2];
      dress(p); g.add(p);
    }
    {
      const p = env.someone(base + 24 * 4);
      p.position.set(-0.8, 1.2, 5.7); p.rotation.y = Math.PI;
      dress(p); g.add(p);
    }
    // çaycı: aynı palto rengi, önlük ve çay tepsisi
    {
      const p = env.adam({coat, hat:'yok', beard:true});
      dress(p);
      p.position.set(1.2, 1.2, 5.2); p.rotation.y = -Math.PI / 2;
      kit.add(new T.BoxGeometry(0.42, 0.75, 0.02), M.white, 0, 0.95, 0.17, p, false);
      const tray = new T.Group(); tray.position.set(0.0, 1.24, 0.34); p.add(tray);
      kit.add(G.tray, M.rail, 0, 0, 0, tray, false);
      for (let k = 0; k < 4; k++){
        const a = k / 4 * Math.PI * 2;
        kit.add(G.glass, M.tea, Math.cos(a) * 0.19, 0.07, Math.sin(a) * 0.19, tray, false);
      }
      g.add(p);
    }

    // baş/kıç açık güverte parçaları (sivri burunların içinde kalır)
    add(new T.BoxGeometry(4.0, 0.14, 0.9), M.deck, 0, 1.13, 11.35);
    add(new T.BoxGeometry(4.0, 0.14, 0.9), M.deck, 0, 1.13, -11.35);
    return g;
  }

  /* ---------- üç vapur ---------- */
  const ferries = [], berth = [null, null, null, null];  // iskele başına tek vapur
  for (let i = 0; i < raw.length; i++){
    const r = raw[i], pts = routeSafe(r.pts);
    const fwd = pts.map(p => ({x:p[0], z:p[1]}));
    const rev = fwd.slice().reverse();
    const remF = new Array(fwd.length), remR = new Array(rev.length);
    remF[fwd.length - 1] = 0;
    for (let k = fwd.length - 2; k >= 0; k--) remF[k] = remF[k + 1] + Math.hypot(fwd[k + 1].x - fwd[k].x, fwd[k + 1].z - fwd[k].z);
    remR[rev.length - 1] = 0;
    for (let k = rev.length - 2; k >= 0; k--) remR[k] = remR[k + 1] + Math.hypot(rev[k + 1].x - rev[k].x, rev[k + 1].z - rev[k].z);
    const outA = Math.atan2(fwd[1].x - fwd[0].x, fwd[1].z - fwd[0].z);
    const n = fwd.length;
    const outB = Math.atan2(fwd[n - 2].x - fwd[n - 1].x, fwd[n - 2].z - fwd[n - 1].z);
    const g = makeFerry(i, r, pts);
    // Eminönü berth'ini iki vapur paylaşmasın: C hattı Kadıköy'den başlar.
    const start = i === 2 ? r.b : r.a;
    const startFwd = start === r.a;
    const f = {
      g, a:r.a, b:r.b, fwd, rev, remF, remR, outA, outB,
      dock:start, state:0, waitT:14 + i * 5, seg:1,
      path:startFwd ? fwd : rev, rem:startFwd ? remF : remR,
      dest:startFwd ? r.b : r.a,
      x:S[start][0], z:S[start][1], yaw:startFwd ? outA : outB, speed:0, phase:i * 2.3,
      noSteer:0, catchUp:false,
      cols:[{x:0, z:0, r:3.2}, {x:0, z:0, r:3.2}, {x:0, z:0, r:3.2}],
      colZ:[-9, 0, 9]
    };
    // Çarpışma dairelerini ilk kareden önce doğru yere koy (aksi hâlde bir
    // kare boyunca (0,0) çevresinde görünmez engel oluşur).
    for (let k = 0; k < 3; k++){
      const lz = f.colZ[k];
      f.cols[k].x = AT.x + f.x + Math.sin(f.yaw) * lz;
      f.cols[k].z = AT.z + f.z + Math.cos(f.yaw) * lz;
    }
    g.position.set(f.x, SEA_Y, f.z); g.rotation.y = f.yaw;
    ferries.push(f);
    berth[start] = f;
  }

  /* ---------- iskele sefer tabelaları ---------- */
  const lines = DOCKS.map(() => []);
  raw.forEach(r => {
    lines[r.a].push(NAMES[r.a] + ' – ' + NAMES[r.b]);
    lines[r.b].push(NAMES[r.b] + ' – ' + NAMES[r.a]);
  });
  function signMat(arr){
    const [c, g] = kit.canvas(256, 128);
    g.fillStyle = '#10233f'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#d4af37'; g.lineWidth = 5; g.strokeRect(5, 5, 246, 118);
    g.fillStyle = '#d4af37'; g.textAlign = 'center'; g.font = 'bold 14px Georgia';
    g.fillText('VAPUR SEFERLERİ', 128, 26);
    g.fillStyle = '#f7f0dd';
    arr.forEach((s, i) => {
      let fs = arr.length > 1 ? 17 : 20;
      do { g.font = 'bold ' + fs + 'px Georgia'; fs--; } while (g.measureText(s).width > 224 && fs > 10);
      g.fillText(s, 128, arr.length > 1 ? 56 + i * 24 : 68);
    });
    g.fillStyle = '#c9b578'; g.font = '12px Georgia'; g.fillText('her 15 dk', 128, 108);
    return new T.MeshStandardMaterial({map:kit.ctex(c, 1, 1), roughness:0.75});
  }
  for (let d = 0; d < 4; d++){
    const dockX = DOCKS[d][0], dockZ = DOCKS[d][1], ry = DOCKS[d][2];
    const R = env.reg(dockX, dockZ);
    // sefer tabelası: iskele yerel (2.5, 1.2)
    const [bx, bz] = toW(d, 2.5, 1.16), [px, pz] = toW(d, 2.5, 1.2);
    const back = kit.add(new T.BoxGeometry(2.2, 1.06, 0.06), M.dark, bx, 1.35, bz, R, false);
    back.rotation.y = ry;
    const p = kit.add(new T.PlaneGeometry(2.04, 0.92), signMat(lines[d]), px, 1.35, pz, R, false);
    p.rotation.y = ry;
    [-0.8, 0.8].forEach(ox => {
      const [sx, sz] = toW(d, 2.5 + ox, 1.14);
      kit.add(new T.BoxGeometry(0.07, 0.55, 0.07), M.dark, sx, 0.62, sz, R, false);
    });

    // İskele binasının ortasına geçit aç: bina çarpışmasını iki yana böl,
    // kara tarafından (0, -4) platforma (0, 6) yürüyerek geçilebilsin.
    const [wx, wz] = toW(d, 0, -1);
    for (const o of ctx.C.statics){
      if (o.type === 'b' && Math.abs(o.x - (wx + AT.x)) < 0.05 && Math.abs(o.z - (wz + AT.z)) < 0.05 &&
          Math.abs(o.hw - 5) < 0.01 && Math.abs(o.hd - 2) < 0.01) o.on = false;
    }
    [-3.1, 3.1].forEach(lx => {
      const [qx, qz] = toW(d, lx, -1);
      ctx.C.box(qx, qz, 1.9, 2, ry);
    });
    const [sx, sz] = toW(d, 0, 1.05), [nx, nz] = toW(d, 0, -3.03);
    const sd = kit.add(new T.PlaneGeometry(2.3, 2.1), M.door, sx, 1.4, sz, R, false); sd.rotation.y = ry;
    const nd = kit.add(new T.PlaneGeometry(2.3, 2.1), M.door, nx, 1.4, nz, R, false); nd.rotation.y = ry + Math.PI;
    [-1.22, 1.22].forEach(lx => {
      [1.06, -3.06].forEach(lz => {
        const [qx, qz] = toW(d, lx, lz);
        kit.add(new T.BoxGeometry(0.09, 2.25, 0.09), M.rail, qx, 1.42, qz, R, false);
      });
    });
    [1.06, -3.06].forEach(lz => {
      const [qx, qz] = toW(d, 0, lz);
      kit.add(new T.BoxGeometry(2.53, 0.08, 0.09), M.rail, qx, 2.46, qz, R, false);
    });
    const [fx, fz] = toW(d, 0, -1.55);
    // Geçit zemini platformla üst üste binmesin (z=0'da birleşir): z-fighting yok.
    kit.add(new T.BoxGeometry(2.6, 0.08, 3.1), M.deck, fx, 0.31, fz, R, false);
    [-1.27, 1.27].forEach(lx => {
      const [qx, qz] = toW(d, lx, -1);
      kit.add(new T.BoxGeometry(0.08, 2.4, 4.2), M.dark, qx, 1.55, qz, R, false);
    });
    kit.add(new T.BoxGeometry(2.6, 0.08, 4.2), M.dark, fx, 2.72, fz, R, false);
  }

  /* ---------- etkileşimler ---------- */
  let aboard = false, ride = null;
  const boardShown = (f, d) => () => !aboard && f.dock === d && f.state === 0;
  const offShown = (f, d) => () => aboard && ride === f && f.dock === d && f.state === 0;

  for (let i = 0; i < ferries.length; i++){
    const f = ferries[i], r = raw[i];
    [[r.a, r.b], [r.b, r.a]].forEach(([d, to]) => {
      const [x, z] = BOARD[d];
      ctx.interact(x, z, 'Vapura bin: ' + NAMES[to], () => {
        if (aboard || f.state !== 0 || f.dock !== d) return;
        aboard = true; ride = f;
        ctx.teleport(f.x, f.z, f.yaw, DECK_Y);
        ctx.ui.toast('Vapura bindin. Martılara simit atmayı unutma!', 2600);
      }, 3, boardShown(f, d));
    });
    [r.a, r.b].forEach(d => {
      const [x, z] = S[d];
      ctx.interact(x, z, 'Vapurdan in', () => {
        if (!aboard || ride !== f || f.dock !== d) return;
        aboard = false; ride = null;
        ctx.teleport(LAND[d][0], LAND[d][1], DOCKS[d][2] + Math.PI);
        ctx.ui.toast(NAMES[d] + ' iskelesine vardın.', 2200);
      }, 14, offShown(f, d));
    });
  }

  /* ---------- güverte yüksekliği ve vapur çarpışması ---------- */
  ctx.C.heightFns.push((x, z) => {
    if (!aboard || !ride) return null;
    const f = ride, c = Math.cos(f.yaw), s = Math.sin(f.yaw);
    const dx = x - f.x, dz = z - f.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c;
    return (Math.abs(lx) < HW && Math.abs(lz) < HL) ? DECK_Y : null;
  });

  const NO_COLS = [];
  for (let i = 0; i < ferries.length; i++){
    const f = ferries[i];
    ctx.C.dynamics.push(() => {
      if (aboard && ride === f) return NO_COLS;
      for (let k = 0; k < 3; k++){
        const lz = f.colZ[k];
        f.cols[k].x = AT.x + f.x + Math.sin(f.yaw) * lz;
        f.cols[k].z = AT.z + f.z + Math.cos(f.yaw) * lz;
      }
      return f.cols;
    });
  }

  /* ---------- her kare ---------- */
  const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  ctx.onUpdate((dt, t) => {
    const hx = ctx.hero.x, hz = ctx.hero.z;
    for (let i = 0; i < ferries.length; i++){
      const f = ferries[i];
      const ox = f.x, oz = f.z, oyaw = f.yaw;

      if (f.state === 0){
        // iskelede bekle; sonra düdük ve sefer
        f.waitT -= dt;
        if (f.waitT <= 0){
          ctx.sfx('whistle');
          f.state = 1; f.speed = 0; f.seg = 1;
          if (f.dock === f.a){ f.path = f.fwd; f.rem = f.remF; f.dest = f.b; }
          else { f.path = f.rev; f.rem = f.remR; f.dest = f.a; }
          // Geliş yönü tersse 180° dönüşü iskeleden uzakta yap: ilk 50 m
          // yön korunur. Vapur çift uçlu olduğundan diğer başı önde gider.
          const q = f.path[1];
          const dy0 = Math.abs(ang(Math.atan2(q.x - f.x, q.z - f.z) - f.yaw));
          f.noSteer = dy0 > Math.PI / 2 ? 50 : 0;
          f.catchUp = false;
        }
      } else {
        const p = f.path[f.seg];
        if (!p){ f.state = 0; f.waitT = 14; }
        else if (f.seg === f.path.length - 2 && berth[f.dest] && berth[f.dest] !== f){
          // Hedef iskele doluysa son ara noktada bekle; kalkan vapurun yolunu kesme.
          f.speed = 0;
        } else {
          // Son yaklaşmaya girerken iskele hakkını al.
          if (f.seg === f.path.length - 2 && !berth[f.dest]) berth[f.dest] = f;
          const ddx = p.x - f.x, ddz = p.z - f.z, dd = Math.hypot(ddx, ddz);
          const want = Math.atan2(ddx, ddz);
          let dy = ang(want - f.yaw);
          if (f.noSteer > 0){
            // İskeleden uzaklaşana kadar yönü değiştirme.
            dy = 0;
          } else {
            const mt = 0.85 * dt;
            f.yaw += Math.max(-mt, Math.min(mt, dy));
            if (f.catchUp && Math.abs(dy) < 0.12) f.catchUp = false;
          }
          const remain = dd + f.rem[f.seg];
          let target = Math.min(8, Math.max(0.5, remain * 0.55));
          if (f.catchUp) target = Math.min(target, 6);
          else if (Math.abs(dy) > 0.5) target = Math.min(target, 1.15);
          if (target > f.speed) f.speed = Math.min(target, f.speed + 2.0 * dt);
          else f.speed = Math.max(target, f.speed - 3.2 * dt);
          const step = f.speed * dt;
          if (f.noSteer > 0){
            f.noSteer -= step;
            if (f.noSteer <= 0) f.catchUp = true;
          }
          if (dd <= step + 0.02){
            f.x = p.x; f.z = p.z; f.seg++;
            // İskeleden ayrıldıktan sonra yanaşma hakkını bırak.
            if (f.seg === 2 && berth[f.dock] === f) berth[f.dock] = null;
            if (f.seg >= f.path.length){
              // vardı: iskeleye yan dön, bekle
              f.state = 0; f.waitT = 14; f.dock = f.dest; f.speed = 0;
              const out = f.dock === f.a ? f.outA : f.outB;
              f.yaw = out + Math.PI;
            }
          } else {
            f.x += ddx / dd * step; f.z += ddz / dd * step;
          }
        }
      }

      // sallanma
      f.g.position.set(f.x, SEA_Y + Math.sin(t * 1.05 + f.phase) * 0.09, f.z);
      f.g.rotation.set(Math.sin(t * 0.55 + f.phase) * 0.012, f.yaw, Math.sin(t * 0.75 + f.phase) * 0.02);

      // yüzde: vapurla birlikte taşı, dönerse yerel konumu koru, güverteden taşma
      if (aboard && ride === f){
        const c0 = Math.cos(oyaw), s0 = Math.sin(oyaw);
        const dx = hx - ox, dz = hz - oz;
        let lx = dx * c0 - dz * s0, lz = dx * s0 + dz * c0;
        // HeightFn sınırı dışına (|lx|=2.6, |lz|=11) tam düşmemek için 5 cm içeride tut.
        const BX = HW - 0.05, BZ = HL - 0.05;
        if (lx > BX) lx = BX; else if (lx < -BX) lx = -BX;
        if (lz > BZ) lz = BZ; else if (lz < -BZ) lz = -BZ;
        const c1 = Math.cos(f.yaw), s1 = Math.sin(f.yaw);
        const nx = f.x + lx * c1 + lz * s1, nz = f.z - lx * s1 + lz * c1;
        ctx.carry(nx - hx, nz - hz);
      }
    }
  });

  // İskele platformları ve bina geçidi yürünebilir (binme noktası platform ucunda).
  ctx.C.heightFns.push((x, z) => {
    for (let d = 0; d < 4; d++){
      const dx = x - DOCKS[d][0], dz = z - DOCKS[d][1], ry = DOCKS[d][2];
      const c = Math.cos(ry), s = Math.sin(ry);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < 4.4 && lz > -0.5 && lz < 7.1) return 0.35;
      if (Math.abs(lx) < 1.3 && lz > -3.4 && lz <= 1.2) return 0.35;
    }
    return null;
  });
}
