// İstanbul'un insanları: simitçiler, sokak satıcıları, çalgıcılar, esnaf ve kalabalık.
// Her figür tek renkli vertex materyaline pişirilir: NPC başına tek çizim çağrısı.
export function buildPeople(ctx, env){
  const { THREE, kit, C, rnd } = ctx;
  const VCM = new THREE.MeshStandardMaterial({vertexColors:true, roughness:0.86});
  const GLASS = new THREE.MeshStandardMaterial({color:0xcfe6ef, transparent:true, opacity:0.42, roughness:0.08, metalness:0.15});
  const GOLDM = new THREE.MeshStandardMaterial({color:0xd4af37, metalness:0.7, roughness:0.3});
  const say = (name, lines) => () => ctx.ui.dialog(lines.map(text => ({name, text})));
  const m4 = new THREE.Matrix4();
  const claimedPts = [];
  const near = (x, z, arr, d) => {
    for (let i = 0; i < arr.length; i++){
      const dx = arr[i][0] - x, dz = arr[i][1] - z;
      if (dx * dx + dz * dz < d * d) return true;
    }
    return false;
  };


  /* ---------- konum: kara, iç bölge, boş hücre, yol dışı ---------- */
  const free = (x, z, pad = 2, road = -0.5) => env.landG(x, z) && env.inland(x, z, pad) &&
    !env.occ.has(env.cell(x, z)) && env.roadDist(x, z) > road;
  function spot(x, z, opt = {}){
    const pad = opt.pad == null ? 2 : opt.pad, road = opt.road == null ? -0.5 : opt.road;
    if (free(x, z, pad, road)) return [x, z];
    for (let r = 1.5; r <= 12; r += 1.5) for (let i = 0; i < 12; i++){
      const a = i * Math.PI / 6 + r, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
      if (free(px, pz, pad, road)) return [px, pz];
    }
    return null;
  }
  const claim = (x, z) => { env.occ.add(env.cell(x, z)); claimedPts.push([x, z]); };
  // Mevcut NPC ve kalabalığın üstüne yeni arka plan insanı koymamak için sabit noktalar.
  const existingPts = [
    [-78, -16], [-56.5, -60], [-67.5, -85], [-104, 150], [212, 62], [190, -36], [-158, -365], [-112, -1], [-146, -392], [404, -246],
    [-24, -36], [-18, -37], [-28, -35], [24, -104], [192, -48], [194, -44], [318, 280],
    [-120, 0], [-108, 2], [-95, 1], [-80, 3], [-122, -10], [-150, -380], [-140, -250], [-155, -170],
    [-110, 160], [-112, 168], [-90, 120], [-30, 60], [410, -238], [404, -238],
    [-115, -186], [-115, -182], [226, -66], [230, -66], [234, -66],
    [206, 70], [210, 70], [214, 70], [218, 70], [222, 70], [226, 70], [230, 70],
    [-56.7, -48], [-67.3, -59], [-56.7, -70], [-67.3, -81], [-56.7, -92]
  ];
  for (let i = 0; i < env.fronts.length && i < 90; i += 3){
    const f = env.fronts[i];
    if (f.shop) existingPts.push([f.x + Math.sin(f.ry) * 0.6, f.z + Math.cos(f.ry) * 0.6]);
  }

  /* ---------- figürü tek vertex renkli ağa yığ ---------- */
  function colored(mesh, inv, out){
    let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    g.applyMatrix4(m4.multiplyMatrices(inv, mesh.matrixWorld));
    const n = g.attributes.position.count, a = new Float32Array(n * 3);
    const c = new THREE.Color((mesh.material && mesh.material.color) || 0xffffff).convertSRGBToLinear();
    for (let i = 0; i < n; i++){ a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
    out.push(g);
  }
  function visible(o, top){ for (let p = o; p; p = p.parent){ if (!p.visible) return false; if (p === top) break; } return true; }
  function under(o, p){ for (let a = o; a; a = a.parent){ if (a === p) return true; } return false; }
  function bakeFig(g, opt = {}){
    g.updateMatrixWorld(true);
    const body = [], L = [], R = [], all = [];
    const aL = g.userData.armL, aR = g.userData.armR;
    g.traverse(o => { if (!o.isMesh || !visible(o, g)) return; all.push(o); });
    const bi = new THREE.Matrix4().copy(g.matrixWorld).invert();
    const li = aL ? new THREE.Matrix4().copy(aL.matrixWorld).invert() : null;
    const ri = aR ? new THREE.Matrix4().copy(aR.matrixWorld).invert() : null;
    for (const o of all){
      if (opt.arms && aL && under(o, aL)) colored(o, li, L);
      else if (opt.arms && aR && under(o, aR)) colored(o, ri, R);
      else colored(o, bi, body);
    }
    for (const o of all) o.parent.remove(o);
    const add = (arr, parent, m) => { if (!arr.length) return; const mesh = new THREE.Mesh(env.mergeBufferGeometries(arr), m); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.keep = true; parent.add(mesh); };
    add(body, g, opt.mat || VCM);
    if (opt.arms){ add(L, aL, opt.mat || VCM); add(R, aR, opt.mat || VCM); }
    if (opt.override){ g.traverse(o => { if (o.isMesh && o.userData.keep) o.material = opt.override; }); }
    return g;
  }

  /* ---------- sabit tezgâhları bölge başına tek ağa topla ---------- */
  const batches = new Map(), glasses = new Map();
  function collectWorld(g, regG){
    g.updateMatrixWorld(true);
    let rec = batches.get(regG);
    if (!rec){ rec = {geo:[], trans:[]}; batches.set(regG, rec); }
    g.traverse(o => {
      if (!o.isMesh || !visible(o, g)) return;
      let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal') geo.deleteAttribute(k);
      if (o.material && o.material.transparent){ rec.trans.push(geo); return; }
      const n = geo.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(o.material.color).convertSRGBToLinear();
      for (let i = 0; i < n; i++){ a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
      rec.geo.push(geo);
    });
  }
  function buildStatic(x, z, ry, fn){
    const g = new THREE.Group(); g.position.set(x, env.Hs(x, z), z); g.rotation.y = ry;
    fn(g);
    collectWorld(g, env.reg(x, z));
  }
  function flushStatic(){
    batches.forEach((rec, regG) => {
      if (rec.geo.length){ const m = new THREE.Mesh(env.mergeBufferGeometries(rec.geo), VCM); m.castShadow = true; m.receiveShadow = true; m.userData.keep = true; regG.add(m); }
      if (rec.trans.length){ const m = new THREE.Mesh(env.mergeBufferGeometries(rec.trans), GLASS); m.userData.keep = true; regG.add(m); }
    });
    batches.clear();
  }
  const add = (g, geo, color, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = kit.add(geo, kit.mat(color), x, y, z, g); m.rotation.set(rx, ry, rz); return m; };
  const P = (g, geo, color, x, y, z, rx, ry, rz) => add(g, geo, color, x, y, z, rx, ry, rz);
  const PG = (g, geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = kit.add(geo, kit.mat(0xddeeff, {transparent:true, opacity:0.45, roughness:0.1}), x, y, z, g); m.rotation.set(rx, ry, rz); return m; };

  /* ---------- insan ---------- */
  function person(opt = {}, extra){
    const g = env.adam({coat:opt.coat == null ? 0x3a4a5a : opt.coat, hat:opt.hat || 'yok', apron:opt.apron || false, beard:!!opt.beard});
    if (extra) extra(g);
    if (opt.sit && g.userData.legL && g.userData.legR){
      g.userData.legL.rotation.set(-1.4, 0, 0);
      g.userData.legR.rotation.set(-1.4, 0, 0);
    }
    bakeFig(g, {arms:!!opt.arms, override:opt.override || null});
    if (opt.scale) g.scale.setScalar(opt.scale);
    return g;
  }

  /* ---------- simit arabası ---------- */
  function simitCart(x, z, ry){
    buildStatic(x, z, ry, g => {
      P(g, new THREE.BoxGeometry(1.62, 0.72, 0.94), 0xb3202a, 0, 0.72, 0);
      P(g, new THREE.BoxGeometry(1.5, 0.08, 0.82), 0xf0e2c4, 0, 1.1, 0);
      PG(g, new THREE.BoxGeometry(1.44, 0.7, 0.76), 0, 1.5, 0);
      P(g, new THREE.BoxGeometry(1.52, 0.06, 0.82), 0xb3202a, 0, 1.87, 0);
      [-0.72, 0.72].forEach(s => {
        P(g, new THREE.CylinderGeometry(0.25, 0.25, 0.09, 14), 0x2a2a2c, s, 0.28, 0, 0, 0, Math.PI / 2);
        P(g, new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), 0x8a8478, s, 0.28, 0, 0, 0, Math.PI / 2);
      });
      P(g, new THREE.BoxGeometry(0.8, 0.06, 0.06), 0x6a4a2e, 0, 0.95, -0.55);
      for (let i = 0; i < 9; i++){
        const r = Math.floor(i / 3), cx = (i % 3 - 1) * 0.34 + (rnd() - 0.5) * 0.06, cz = (r % 2 - 0.5) * 0.22;
        P(g, new THREE.TorusGeometry(0.115, 0.038, 6, 14), 0xc8873a, cx, 1.2 + r * 0.14, cz, Math.PI / 2);
      }
      P(g, new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), 0xd8d8d0, -0.55, 2.02, 0.1, 0, 0, -0.5);
    });
    C.box(x, z, 0.95, 0.62, ry);
  }

  const SIMIT = [
    {n:'Simitçi Hüseyin Amca', x:-108, z:-18, ry:0.4, line:'Simit sıcak, çay demli. Eminönü\'nde gün böyle başlar; vapur düdüğüyle birlikte.', s:'Susamı bol olsun diye tepsiyi ters çevirip silkelerim. Acele et, martılar da erkenci.'},
    {n:'Simitçi Nazmiye Teyze', x:14, z:-104, ry:-1.2, line:'Karaköy rüzgârı simidi serinletir ama çayı sıcak tutar. Buyur yavrum.', s:'Bu arabayı kırk yıldır aynı köşeye çekerim; müşterim de, martım da bellidir.'},
    {n:'Simitçi Cemil', x:-54, z:-190, ry:0.9, line:'Galata Kulesi\'ne bakarak ye; susamı üstüne dökülmesin diye kâğıdı iki kat sararım.', s:'Kuleyi onaran ustalardan biri de bizim mahalledendi. Simidini hep buradan alırdı.'},
    {n:'Simitçi Sevgi Abla', x:-178, z:-398, ry:1.4, line:'İstiklal\'in tramvayına yetişen simidi kapar; acele et, sıcakken güzel.', s:'Beyoğlu\'nda gece de simit satılır. Sokak lambaları altında susamlar yıldız gibi parlar.'},
    {n:'Simitçi Rıza Dede', x:-120, z:160, ry:-0.6, line:'Ayasofya\'nın gölgesinde simit yemenin tadı başkadır; tarih sana eşlik eder.', s:'Çayı yudumla, acele etme. Bu meydanda acele eden çok, oturan az.'},
    {n:'Simitçi Gülsüm Teyze', x:208, z:-30, ry:2.6, line:'Vapurdan inen önce kokuyu alır. Buyur, simidin sıcacık.', s:'Martılara atma; onlar simidi senden hızlı kapar. Çayla ye, çayla.'},
    {n:'Simitçi Bülent', x:336, z:262, ry:-2.4, line:'Kadıköy\'ün simidi çayla, sohbeti uzundur. Bir tane al, sohbet bizden.', s:'Çarşıya gidersen sanatçılara selam söyle; akordeonun sesi buraya kadar gelir.'}
  ];
  function buySimit(name){
    const n = typeof env.store.simit === 'number' ? env.store.simit : (env.store.simit ? 1 : 0);
    env.store.simit = n + 1; ctx.save(); ctx.sfx('coin');
    ctx.ui.toast('Bir simit aldın! (çantanda ' + env.store.simit + ' simit)', 2600);
  }
  for (const s of SIMIT){
    const p = spot(s.x, s.z, {pad:2});
    if (!p) continue;
    const [x, z] = p; claim(x, z);
    simitCart(x, z, s.ry);
    const sx = x + Math.cos(s.ry) * 1.45, sz = z - Math.sin(s.ry) * 1.45;
    const g = person({coat:0x6a5a3a, hat:(s.n.length % 2 ? 'kasket' : 'yok'), beard:s.n.indexOf('Dede') > 0});
    const a = async () => {
      const r = await ctx.ui.dialog([{name:s.n, text:s.line, choices:['Simit al', 'Sonra']}]);
      if (r === 0){ buySimit(s.n); await ctx.ui.say(s.n, s.s); }
    };
    env.npcAt(g, sx, sz, s.ry + Math.PI / 2, s.n, a);
    claim(sx, sz);
  }

  /* ---------- dükkân önleri ---------- */
  const usedFronts = new Set();
  function frontPick(pred, nearX, nearZ){
    let best = -1, bd = 1e9;
    env.fronts.forEach((f, i) => {
      if (usedFronts.has(i) || !pred(f)) return;
      const d = Math.hypot(f.x - nearX, f.z - nearZ);
      if (d < bd){ bd = d; best = i; }
    });
    if (best < 0) return null;
    usedFronts.add(best); return env.fronts[best];
  }
  function shopFront(shop, x, z){ return frontPick(f => f.shop === shop, x, z); }
  function anyFront(x, z, test){ return frontPick(f => !test || test(f), x, z); }
  function standAtFront(f, name, act, dx = 0.9, dz = 0.6){
    const x = f.x + Math.sin(f.ry) * dz + Math.cos(f.ry) * dx;
    const z = f.z + Math.cos(f.ry) * dz - Math.sin(f.ry) * dx;
    const g = person({coat:0x4a3a2a, apron:0xe8d8b0});
    env.npcAt(g, x, z, f.ry, name, act, f.y);
    claim(x, z);
    return [x, z];
  }

  /* ---------- kestaneci ---------- */
  {
    const p = spot(0, -102, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 0.4, g => {
        P(g, new THREE.BoxGeometry(1.5, 0.6, 0.9), 0x6a4a2e, 0, 0.55, 0);
        P(g, new THREE.BoxGeometry(1.25, 0.28, 0.72), 0x2a2a2a, 0, 0.98, 0);
        P(g, new THREE.BoxGeometry(1.5, 0.06, 0.95), 0x8a8478, 0, 1.14, 0);
        for (let i = 0; i < 13; i++) P(g, new THREE.SphereGeometry(0.075, 7, 5), i % 2 ? 0x6a3a1a : 0x8a4a22, -0.45 + (i % 7) * 0.15, 1.08 + Math.floor(i / 7) * 0.05, -0.18 + (i % 2) * 0.3);
        [-0.55, 0.55].forEach(s => P(g, new THREE.CylinderGeometry(0.2, 0.2, 0.07, 10), 0x2a2a2c, s, 0.2, 0, 0, 0, Math.PI / 2));
      });
      C.box(x, z, 0.85, 0.55, 0.4).low = true;
      const g = person({coat:0x3a3a3a, hat:'kasket', beard:true}, q => P(q, new THREE.CylinderGeometry(0.035, 0.045, 0.8, 5), 0xb0a080, 0.6, 1.5, 0.25, 0, 0, -0.6));
      env.npcAt(g, x + 1.15, z + 0.35, -1.4, 'Kestaneci Veli Amca', say('Kestaneci Veli Amca', ['Kestane közde olacak; dışı kabuk, içi bal. Ellerini ısıt, sonra ye.', 'Bu mangal kırk yıllık. Karaköy\'ün kışı serttir, kestaneci olmadan geçmez.']));
      claim(x + 1.15, z + 0.35);
      const sm = new THREE.Group(); sm.userData.dyn = true; ctx.root.add(sm);
      const smM = new THREE.MeshStandardMaterial({color:0x9a9a96, transparent:true, opacity:0.22, roughness:1, depthWrite:false});
      const sI = new THREE.InstancedMesh(new THREE.SphereGeometry(0.34, 8, 6), smM, 4);
      sI.frustumCulled = false;
      sI.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      sm.add(sI);
      const sM = new THREE.Matrix4(), sS = new THREE.Vector3();
      ctx.onUpdate((dt, t) => {
        for (let i = 0; i < 4; i++){
          const u = (t * 0.18 + i * 0.25) % 1;
          sM.makeTranslation(x - 0.2 + Math.sin(t * 0.5 + i) * 0.2, 1.35 + u * 1.5, z + Math.cos(t * 0.4 + i) * 0.12);
          sM.scale(sS.set(0.8 + u, 0.8 + u, 0.8 + u));
          sI.setMatrixAt(i, sM);
        }
        sI.instanceMatrix.needsUpdate = true;
      });
    }
  }
  /* ---------- mısırcı ---------- */
  {
    const p = spot(-40, -22);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, -0.5, g => {
        P(g, new THREE.BoxGeometry(1.6, 0.65, 0.9), 0x2a5a7a, 0, 0.58, 0);
        P(g, new THREE.BoxGeometry(1.3, 0.45, 0.7), 0xb8bcc0, 0, 1.1, 0);
        for (let i = 0; i < 6; i++) P(g, new THREE.CylinderGeometry(0.07, 0.08, 0.3, 8), 0xf0c020, -0.45 + i * 0.18, 1.3, -0.1 + (i % 2) * 0.18, 0, 0, 1.2);
        P(g, new THREE.CylinderGeometry(0.19, 0.19, 0.06, 10), 0xe8e0c8, 0.55, 1.35, 0.1);
        P(g, new THREE.BoxGeometry(0.5, 0.5, 0.4), 0xf0e2c4, -0.55, 1.28, 0);
        [-0.6, 0.6].forEach(s => P(g, new THREE.CylinderGeometry(0.2, 0.2, 0.06, 10), 0x2a2a2c, s, 0.2, 0, 0, 0, Math.PI / 2));
      });
      C.box(x, z, 0.9, 0.55, -0.5).low = true;
      const g = person({coat:0x7a2a4a, apron:0xf0e8d8, hat:'yok'});
      env.npcAt(g, x - 1.2, z + 0.2, 1.8, 'Mısırcı Zehra', say('Mısırcı Zehra', ['Haşlanmış mı, közlenmiş mi? Közlenmişin üstüne tereyağı ve tuz...', 'Mısırı vapurda yeme, tuzu üstüne dökülür. İskelede otur, manzaraya bak.']));
      claim(x - 1.2, z + 0.2);
    }
  }
  /* ---------- midyeci ---------- */
  {
    const p = spot(44, -104);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 1.1, g => {
        P(g, new THREE.BoxGeometry(1.7, 0.75, 0.8), 0x5a3a2a, 0, 0.62, 0);
        P(g, new THREE.BoxGeometry(1.6, 0.1, 0.72), 0xd8d8d8, 0, 1.04, 0);
        for (let i = 0; i < 14; i++) P(g, new THREE.SphereGeometry(0.09, 7, 5), 0x1e1c1a, -0.65 + (i % 7) * 0.21, 1.12, -0.18 + Math.floor(i / 7) * 0.35, 0, 0, 0).scale.set(1.4, 0.5, 0.85);
        for (let i = 0; i < 4; i++) P(g, new THREE.SphereGeometry(0.085, 7, 5), 0xf0d040, 0.58, 1.14, -0.2 + i * 0.14).scale.set(1, 0.8, 1);
      });
      C.box(x, z, 0.9, 0.5, 1.1).low = true;
      const g = person({coat:0x2a5a4a, apron:0xd8d8c8});
      const sx = x - 1.1 * Math.cos(1.1), sz = z + 1.1 * Math.sin(1.1);
      env.npcAt(g, sx, sz, 2.2, 'Midyeci Cengiz', say('Midyeci Cengiz', ['Midye taze, limon bol. Karaköy\'de sabahçıların ilk durağı burasıdır.', 'Denizden çıkanı hemen buzla buluştururuz; tazeliği gözünden anlarsın.']));
      claim(sx, sz);
    }
  }
  /* ---------- şerbetçi ---------- */
  {
    const p = spot(-120, 112);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 0.2, g => {
        P(g, new THREE.BoxGeometry(1.5, 0.8, 0.8), 0x8a1a2a, 0, 0.6, 0);
        for (let i = 0; i < 4; i++){
          P(g, new THREE.CylinderGeometry(0.16, 0.2, 0.5, 12), 0xd8e8ee, -0.5 + i * 0.33, 1.28, 0);
          P(g, new THREE.SphereGeometry(0.13, 8, 6), [0xd83a4a, 0xe8a020, 0x8ac040, 0xd86090][i], -0.5 + i * 0.33, 1.28, 0);
        }
        P(g, new THREE.BoxGeometry(1.2, 0.07, 0.5), 0xf0e8d8, 0, 1.58, 0);
      });
      C.box(x, z, 0.8, 0.5, 0.2).low = true;
      const g = person({coat:0x8a2a5a, apron:0xf2efe8});
      env.npcAt(g, x + 1.1, z + 0.2, -1.4, 'Şerbetçi Hacer Abla', say('Şerbetçi Hacer Abla', ['Gül şerbeti, demirhindi, limon... Hangisini istersin?', 'Şerbet, Osmanlı sofralarının serinliğiydi. Buz gibi iç, yolun açık olsun.']));
      claim(x + 1.1, z + 0.2);
    }
  }
  /* ---------- salepçi ---------- */
  {
    const p = spot(218, -24);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 2.2, g => {
        P(g, new THREE.BoxGeometry(1.4, 0.7, 0.9), 0x5a3a2a, 0, 0.55, 0);
        P(g, new THREE.CylinderGeometry(0.3, 0.36, 0.8, 14), 0xb08a3a, 0, 1.28, 0);
        P(g, new THREE.ConeGeometry(0.31, 0.35, 14), 0xd4af37, 0, 1.85, 0);
        P(g, new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8), 0x8a6a2a, 0.45, 1.4, 0);
        P(g, new THREE.BoxGeometry(0.5, 0.08, 0.35), 0xf0e8d8, -0.45, 1.05, 0.1);
        for (let i = 0; i < 3; i++) P(g, new THREE.CylinderGeometry(0.055, 0.045, 0.12, 8), 0xf6f0e8, -0.58 + i * 0.15, 1.16, 0.1);
      });
      C.box(x, z, 0.8, 0.55, 2.2).low = true;
      const g = person({coat:0x3a5a6a, hat:'kasket', beard:true});
      env.npcAt(g, x - 1.1, z + 0.1, 1.8, 'Salepçi Osman Amca', say('Salepçi Osman Amca', ['Salep sıcak olacak, üstüne tarçın. Üsküdar sabahı sisli, iyi gider.', 'Salebin içine biraz süt, biraz sabır. Aceleyle olmaz.']));
      claim(x - 1.1, z + 0.1);
    }
  }
  /* ---------- ayakkabı boyacısı ---------- */
  {
    const p = spot(30, -120);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 0.8, g => {
        P(g, new THREE.BoxGeometry(0.9, 0.5, 0.55), 0xb08a3a, 0, 0.28, 0);
        P(g, new THREE.BoxGeometry(0.96, 0.07, 0.6), 0xd4af37, 0, 0.57, 0);
        P(g, new THREE.BoxGeometry(0.55, 0.06, 0.3), 0x3a2a1a, -0.1, 0.64, 0);
        P(g, new THREE.BoxGeometry(0.4, 0.45, 0.4), 0x6a4a2e, 0.85, 0.24, 0);
        P(g, new THREE.BoxGeometry(0.42, 0.06, 0.42), 0x8a5a3a, 0.85, 0.49, 0);
        [0xe8d8c0, 0x6a3a1a].forEach((c, i) => P(g, new THREE.CylinderGeometry(0.035, 0.035, 0.22, 5), c, 0.88 + i * 0.12, 0.64, 0.12, 0, 0, 0.4));
      });
      C.box(x, z, 0.55, 0.4, 0.8).low = true;
      const g = person({coat:0x5a3a2a, hat:'kasket'}, q => P(q, new THREE.BoxGeometry(0.5, 0.12, 0.2), 0xd4af37, 0, 0.62, 0.3));
      env.npcAt(g, x + 1.25, z - 0.2, -1.5, 'Boyacı İsmet', say('Boyacı İsmet', ['Boyayı parlatırım, ayakkabın ayna olur. Bir de güzel hikâye anlatırım.', 'Pirinç sandığım dedemden kalma. Karaköy\'de her mesleğin bir hikâyesi var.']));
      claim(x + 1.25, z - 0.2);
    }
  }
  /* ---------- hamal ---------- */
  {
    const p = spot(-44, -38);
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x3a2a1a, hat:'takke'}, q => {
        P(q, new THREE.BoxGeometry(0.9, 0.65, 0.5), 0x8a6a3a, 0, 1.55, -0.35);
        P(q, new THREE.BoxGeometry(1.0, 0.55, 0.6), 0x6a4a2e, 0, 1.25, -0.38);
        P(q, new THREE.BoxGeometry(0.08, 1.4, 0.08), 0x5a3a1a, -0.45, 0.7, -0.2, 0, 0, 0.2);
        P(q, new THREE.BoxGeometry(0.08, 1.4, 0.08), 0x5a3a1a, 0.45, 0.7, -0.2, 0, 0, -0.2);
      });
      env.npcAt(g, x, z, 1.2, 'Hamal Şaban', say('Hamal Şaban', ['Küfeyi sırtıma alınca Eminönü\'nün bütün yükü bana biner. Ama yüzüm güler.', 'Bu çarşıda her şey elle taşınır; koli değil, emek.']));
      }
  }
  /* ---------- seyyar çiçekçi ---------- */
  {
    const p = spot(-70, -160);
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x3a6a3a, hat:'yok'}, q => {
        P(q, new THREE.CylinderGeometry(0.3, 0.24, 0.45, 10), 0x8a6a3a, 0.5, 0.55, 0.25);
        for (let i = 0; i < 9; i++) P(q, new THREE.SphereGeometry(0.075, 6, 5), [0xd8202e, 0xe8a020, 0xe85aa0, 0xf6f0e8][i % 4], 0.34 + (i % 3) * 0.14, 0.92 + Math.floor(i / 3) * 0.08, 0.18 + (i % 2) * 0.14);
        P(q, new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), 0x3d7a2e, 0.55, 1.0, 0.2);
      });
      env.npcAt(g, x, z, -0.9, 'Seyyar Çiçekçi Zeynep', say('Seyyar Çiçekçi Zeynep', ['Lale, sümbül, papatya... Galata\'nın taşlarına renk lazım.', 'Bir demet al, sevdiğine götür. İstanbul\'da çiçek, sözden önce gelir.']));
    }
  }
  /* ---------- sahaf ---------- */
  {
    const f = frontPick(f => f.x < -330 && f.z > -40 && f.z < 130 && !['LOKANTA', 'BERBER', 'FIRIN', 'KAHVEHANE'].includes(f.shop), -360, 70);
    if (f){
      const sx = f.x + Math.sin(f.ry) * 1.4, sz = f.z + Math.cos(f.ry) * 1.4;
      buildStatic(sx, sz, f.ry, g => {
        P(g, new THREE.BoxGeometry(2.2, 0.08, 1.0), 0x6a4a2e, 0, 0.9, 0);
        [-0.9, 0.9].forEach(s => P(g, new THREE.BoxGeometry(0.1, 0.9, 0.1), 0x5a3a1a, s, 0.45, -0.35));
        P(g, new THREE.BoxGeometry(2.2, 0.1, 0.2), 0x6a4a2e, 0, 1.6, -0.4);
        for (let i = 0; i < 18; i++) P(g, new THREE.BoxGeometry(0.16, 0.26, 0.22), [0x8a1a2a, 0x1a4a7a, 0x2a5a2a, 0xd8b060, 0x6a2a5a, 0xe8e0c8][i % 6], -0.9 + (i % 9) * 0.22, 1.08 + Math.floor(i / 9) * 0.28, -0.28 + (i % 2) * 0.25, 0, 0.15 * (i % 3 - 1));
        P(g, new THREE.BoxGeometry(1.7, 0.5, 0.7), 0x6a4a2e, 0, 0.25, 0.5);
      });
      C.box(sx, sz, 1.2, 0.7, f.ry).low = true;
      claim(sx, sz);
      standAtFront(f, 'Sahaf Necip Amca', say('Sahaf Necip Amca', ['Eski kitapların kokusu yeni kitaplarda yok. Bak, burada bir 1960 baskısı var.', 'Balat\'ın sokakları kitap gibidir; her kapı bir sayfa, her pencere bir başlık.']), 1.5, 0.7);
    }
  }

  /* ---------- halılar: 4 motifli tek atlas ---------- */
  const [cc, cg] = kit.canvas(256, 256);
  {
    const BG = ['#7a1626', '#173a63', '#24553a', '#6a2a18'], CR = '#ead9b0';
    for (let i = 0; i < 4; i++){
      const ox = (i % 2) * 128, oy = Math.floor(i / 2) * 128;
      cg.fillStyle = BG[i]; cg.fillRect(ox, oy, 128, 128);
      cg.strokeStyle = CR; cg.lineWidth = 3; cg.strokeRect(ox + 5, oy + 5, 118, 118);
      cg.strokeStyle = '#c8a24a'; cg.lineWidth = 2; cg.strokeRect(ox + 12, oy + 12, 104, 104);
      cg.fillStyle = CR;
      cg.beginPath(); cg.moveTo(ox + 64, oy + 26); cg.lineTo(ox + 102, oy + 64); cg.lineTo(ox + 64, oy + 102); cg.lineTo(ox + 26, oy + 64); cg.closePath(); cg.fill();
      cg.fillStyle = BG[i];
      cg.beginPath(); cg.moveTo(ox + 64, oy + 42); cg.lineTo(ox + 86, oy + 64); cg.lineTo(ox + 64, oy + 86); cg.lineTo(ox + 42, oy + 64); cg.closePath(); cg.fill();
      cg.fillStyle = '#d8b060';
      for (let k = 0; k < 4; k++){ const a = k * Math.PI / 2 + Math.PI / 4; cg.beginPath(); cg.arc(ox + 64 + Math.cos(a) * 34, oy + 64 + Math.sin(a) * 34, 5, 0, Math.PI * 2); cg.fill(); }
      cg.strokeStyle = CR; cg.lineWidth = 2;
      for (let k = 0; k < 8; k++){ const x = ox + 18 + (k % 4) * 30, y = oy + 20 + Math.floor(k / 4) * 84; cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + 8, y + 8); cg.lineTo(x, y + 16); cg.lineTo(x - 8, y + 8); cg.closePath(); cg.stroke(); }
    }
  }
  const carpetM = new THREE.MeshStandardMaterial({map:kit.ctex(cc, 1, 1), roughness:0.92, side:THREE.DoubleSide});
  let carpetN = 0;
  function carpetShop(x, z, name, lines, dx){
    const f = frontPick(f => f.shop != null && !['LOKANTA', 'BERBER', 'FIRIN', 'KAHVEHANE'].includes(f.shop) && (dx < 0 ? f.x < 0 : f.x > 0), x, z);
    if (!f) return;
    const ox = f.x + Math.sin(f.ry) * 1.15, oz = f.z + Math.cos(f.ry) * 1.15, oy = f.y;
    buildStatic(ox, oz, f.ry, g => {
      P(g, new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), 0x3a2a1a, 0, 3.35, 0.08, 0, 0, Math.PI / 2);
      [-1.15, 1.15].forEach(s => P(g, new THREE.BoxGeometry(0.08, 3.35, 0.08), 0x3a2a1a, s, 1.68, 0.08));
      P(g, new THREE.BoxGeometry(2.3, 0.9, 0.3), 0x6a4a2e, 0, 0.45, 0.2);
    });
    const geos = [];
    for (let i = 0; i < 2; i++){
      const q = new THREE.PlaneGeometry(1.12, 1.85);
      const uv = q.attributes.uv, tile = (carpetN * 2 + i) % 4;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, ((tile % 2) + uv.getX(k)) / 2, (tile < 2 ? 0.5 : 0) + uv.getY(k) / 2);
      q.translate(-0.58 + i * 1.16, 0, 0);
      geos.push(q.index ? q.toNonIndexed() : q);
    }
    carpetN++;
    const m = new THREE.Mesh(env.mergeBufferGeometries(geos), carpetM);
    m.position.set(ox, oy + 2.35, oz); m.rotation.y = f.ry; m.castShadow = true; m.userData.keep = true;
    env.reg(ox, oz).add(m);
    C.box(ox, oz, 1.3, 0.3, f.ry).low = true;
    claim(ox, oz);
    standAtFront(f, name, say(name, lines), 1.5, 1.1);
  }
  carpetShop(-120, 190, 'Halıcı Hakkı Dede', ['Bu halıda Anadolu\'nun yolları var; her düğüm bir köy, her renk bir hikâye.', 'Yünü elle boyarız. Bak, bu motif nazara karşı; duvara asarsan evin bereketlenir.'], -1);
  carpetShop(370, 245, 'Halıcı Nazan', ['Halıya basmadan önce çoraplarını çıkar derler; biz yalnız bakmaya da izin veririz.', 'Bu dört motif: çiçek, kuş, su yolu ve nazar. Hangisi evine yakışır?'], 1);

  /* ---------- balık-ekmek teknesi ---------- */
  {
    const bx = -78, bz = -47;
    const boat = new THREE.Group(); boat.userData.dyn = true; boat.position.set(bx, env.SEA_Y + 0.04, bz); boat.rotation.y = Math.PI / 2; ctx.root.add(boat);
    const bg = new THREE.Group();
    P(bg, new THREE.BoxGeometry(1.9, 0.55, 5.4), 0x6a4a2e, 0, 0.25, 0);
    P(bg, new THREE.BoxGeometry(1.7, 0.12, 5.0), 0xb08a5a, 0, 0.55, 0);
    P(bg, new THREE.BoxGeometry(0.12, 0.4, 5.5), 0xe8e0d0, 0.95, 0.45, 0);
    P(bg, new THREE.BoxGeometry(0.12, 0.4, 5.5), 0xe8e0d0, -0.95, 0.45, 0);
    P(bg, new THREE.BoxGeometry(1.2, 0.35, 1.8), 0x2a2a2c, 0.1, 0.85, 0.7);
    P(bg, new THREE.BoxGeometry(1.0, 0.12, 1.5), 0x8a8a86, 0.1, 1.05, 0.7);
    for (let i = 0; i < 5; i++) P(bg, new THREE.SphereGeometry(0.11, 7, 5), 0xd8c8a8, -0.25 + i * 0.13, 1.12, 0.4 + (i % 2) * 0.35).scale.set(1.4, 0.6, 0.8);
    P(bg, new THREE.BoxGeometry(0.5, 0.06, 0.5), 0xf0e8d8, 0.05, 1.08, -0.6);
    for (let i = 0; i < 4; i++) P(bg, new THREE.CylinderGeometry(0.06, 0.06, 0.3, 7), 0xd8b060, -0.15 + (i % 2) * 0.3, 1.15, -0.72 + Math.floor(i / 2) * 0.24);
    const o = new THREE.Group(); o.add(bg); bg.updateMatrixWorld(true);
    boat.add(o);
    bakeFig(o);
    const cook = person({coat:0xf0eadc, apron:0xb01c22, hat:'fes'}, q => P(q, new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), 0x8a8a86, 0.35, 1.3, 0.35, 0, 0, -0.7));
    cook.position.set(0.45, 0.58, 0.9); boat.add(cook);
    const cook2 = person({coat:0xe8e0d0, apron:0x2a5a7a});
    cook2.position.set(-0.5, 0.58, -0.5); cook2.rotation.y = Math.PI; boat.add(cook2);
    const act = async () => {
      ctx.sfx('coin');
      await ctx.ui.dialog([{name:'Balık Ekmekçi Temel', text:'Balık ekmek! Izgaradan yeni çıktı, soğanı ve marulu bol.'}, {name:'Balık Ekmekçi Temel', text:'Tekne sallanır, sen ekmeği sıkı tut. Haliç\'in suyu bu saatte sakin olur.'}]);
    };
    ctx.interact(bx, bz + 5.2, 'Konuş: Balık Ekmekçi Temel', act, 6);
    ctx.onUpdate((dt, t) => { boat.position.y = env.SEA_Y + 0.04 + Math.sin(t * 1.4) * 0.045; boat.rotation.z = Math.sin(t * 1.05) * 0.035; });
  }

  /* ---------- sokak sanatçıları ---------- */
  let listenN = 0;
  const listenerFree = (x, z) => env.landG(x, z) && env.inland(x, z, 1) && env.roadDist(x, z) > -2.4 &&
    (!env.occ.has(env.cell(x, z)) || env.roadDist(x, z) > -2.2) &&
    !near(x, z, claimedPts, 1.0) && !near(x, z, existingPts, 1.0);
  function listeners(cx, cz, n){
    let placed = 0;
    for (let k = 0; k < n * 24 && placed < n; k++){
      const a = k * 2.399 + 0.4, r = 2.2 + (k % 5) * 0.55;
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      if (Math.hypot(x - cx, z - cz) > 7.5 || !listenerFree(x, z)) continue;
      claimedPts.push([x, z]);
      const g = env.someone(120 + listenN++);
      env.putP(g, x, z, Math.atan2(cx - x, cz - z));
      placed++;
    }
  }
  function animateArm(g, side, amp, sp){
    const a = side ? g.userData.armR : g.userData.armL;
    if (!a) return;
    const b = a.rotation.x;
    ctx.onUpdate((dt, t) => { a.rotation.x = b + Math.sin(t * sp) * amp; });
  }

  {
    const p = spot(-158, -250, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x6a2a3a, hat:'yok', arms:true}, q => {
        P(q, new THREE.SphereGeometry(0.2, 10, 8), 0x8a5a22, 0, 1.18, 0.38).scale.set(1, 1.3, 0.45);
        P(q, new THREE.BoxGeometry(0.07, 0.85, 0.08), 0x6a3a12, 0, 1.72, 0.38, 0.18);
        P(q, new THREE.BoxGeometry(0.12, 0.16, 0.05), 0x2a1a0a, 0, 2.12, 0.31, 0.18);
        for (let i = 0; i < 3; i++) P(q, new THREE.BoxGeometry(0.008, 0.8, 0.008), 0xe8e0c8, -0.03 + i * 0.03, 1.74, 0.42, 0.18);
        P(q, new THREE.BoxGeometry(1.1, 0.16, 0.42), 0x4a2a1a, 0, 0.08, 0.75);
      });
      env.npcAt(g, x, z, Math.PI / 2, 'Bağlamacı Cihan', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Bağlamacı Cihan', text:'Bu türküyü İstiklal\'in kalabalığına çalıyorum; herkes kendi hikâyesini duysun.'}, {name:'Bağlamacı Cihan', text:'Bağlamanın gövdesi dut ağacından. Teller eski, sesi hâlâ genç.'}]);
      });
      animateArm(g, 1, 0.22, 2.4);
      listeners(x, z, 5);
    }
  }
  {
    const p = spot(-160, -190, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x2a2a3a, hat:'yok', arms:true}, q => {
        P(q, new THREE.BoxGeometry(0.34, 0.2, 0.08), 0x7a4a1a, 0.2, 1.32, 0.42);
        P(q, new THREE.BoxGeometry(0.05, 0.5, 0.05), 0x3a1a0a, 0.35, 1.62, 0.42, 0, 0, -0.35);
        P(q, new THREE.BoxGeometry(0.012, 0.7, 0.012), 0xe8e0c8, -0.32, 1.4, 0.44, 0, 0, 0.6);
      });
      env.npcAt(g, x, z, -0.6, 'Kemancı Arif', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Kemancı Arif', text:'Galata\'nın taşları yankıyı sever; keman burada başka tınlar.'}, {name:'Kemancı Arif', text:'Kuleye bakarak çalıyorum. Rüzgâr notayı taşıyor, ben de peşinden.'}]);
      });
      animateArm(g, 1, 0.15, 3.1);
      listeners(x, z, 5);
    }
  }
  {
    const p = spot(356, 258, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x3a6a3a, hat:'yok', arms:true}, q => {
        P(q, new THREE.BoxGeometry(0.52, 0.5, 0.22), 0x8a1a2a, 0, 1.25, 0.38);
        P(q, new THREE.BoxGeometry(0.56, 0.1, 0.24), 0xf0e8d8, 0, 1.48, 0.38);
        for (let i = 0; i < 5; i++) P(q, new THREE.BoxGeometry(0.06, 0.02, 0.24), 0x1a1a1a, -0.18 + i * 0.09, 1.06, 0.38);
      });
      env.npcAt(g, x, z, -2.2, 'Akordeoncu Nadia', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Akordeoncu Nadia', text:'Kadıköy\'de her akşam bir melodi bulunur; bugünkü çarşıdan.'}, {name:'Akordeoncu Nadia', text:'Akordeon iki nefes ister: biri çalgıya, biri dinleyene.'}]);
      });
      animateArm(g, 0, 0.12, 2.2); animateArm(g, 1, 0.12, 2.2);
      listeners(x, z, 5);
    }
  }
  {
    const p = spot(-88, 174, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x8a6a4a, hat:'yok', arms:true}, q => {
        P(q, new THREE.BoxGeometry(0.05, 0.9, 0.05), 0x6a4a2e, -0.1, 1.4, 0.55, 0.2, 0, -0.5);
        P(q, new THREE.BoxGeometry(0.05, 0.9, 0.05), 0x6a4a2e, 0.1, 1.4, 0.55, 0.2, 0, 0.5);
        P(q, new THREE.CylinderGeometry(0.18, 0.18, 0.03, 12), 0x8a5a2a, 0.4, 1.2, 0.42);
        for (let i = 0; i < 4; i++) P(q, new THREE.SphereGeometry(0.05, 6, 4), [0xd8202e, 0xe8a020, 0x2a5a9a, 0xf0e8d8][i], 0.33 + (i % 2) * 0.12, 1.22 + Math.floor(i / 2) * 0.06, 0.44);
      });
      const [ec, eg] = kit.canvas(256, 192);
      const grd = eg.createLinearGradient(0, 0, 0, 192); grd.addColorStop(0, '#f2c27a'); grd.addColorStop(0.55, '#e89a6a'); grd.addColorStop(1, '#6a8aa0');
      eg.fillStyle = grd; eg.fillRect(0, 0, 256, 192);
      eg.fillStyle = '#2a2a3a'; eg.fillRect(18, 96, 46, 96); eg.fillRect(70, 76, 30, 116); eg.fillRect(110, 108, 54, 84);
      eg.fillStyle = '#c8b08a'; eg.fillRect(74, 54, 22, 28); eg.fillStyle = '#3a3a4a'; eg.beginPath(); eg.moveTo(72, 56); eg.lineTo(85, 36); eg.lineTo(98, 56); eg.closePath(); eg.fill();
      eg.fillStyle = '#3a6a8a'; eg.fillRect(0, 150, 256, 42);
      eg.strokeStyle = '#f6ecd0'; eg.lineWidth = 2;
      for (let i = 0; i < 5; i++){ eg.beginPath(); eg.moveTo(130 + i * 18, 70 + i * 9); eg.lineTo(140 + i * 18, 62 + i * 9); eg.lineTo(150 + i * 18, 70 + i * 9); eg.stroke(); }
      eg.strokeStyle = '#d8b060'; eg.lineWidth = 5; eg.strokeRect(4, 4, 248, 184);
      const pm = new THREE.MeshStandardMaterial({map:kit.ctex(ec, 1, 1), roughness:0.8});
      const paint = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.94), pm);
      paint.position.set(0, 1.42, 0.62); paint.userData.keep = true; g.add(paint);
      env.npcAt(g, x, z, Math.PI, 'Ressam Vedat', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Ressam Vedat', text:'Galata Kulesi\'ni ve Boğaz\'ı çiziyorum. Işık her saat başka bir İstanbul.'}, {name:'Ressam Vedat', text:'Tablo satılmazsa üzülmem; asıl mesele, güzel bir sabahı yakalamak.'}]);
      });
      listeners(x, z, 4);
    }
  }
  {
    const p = spot(-120, -420, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0xf2f2f0, hat:'yok'}, q => {
        for (let i = 0; i < 4; i++) P(q, new THREE.CylinderGeometry(0.25, 0.26, 0.09, 12), 0x1a1a1a, 0, 1.05 + i * 0.17, 0);
        P(q, new THREE.SphereGeometry(0.125, 12, 8), 0xf6f6f2, 0, 1.68, 0.06);
        P(q, new THREE.BoxGeometry(0.05, 0.2, 0.05), 0x1a1a1a, 0, 1.84, 0);
      });
      env.npcAt(g, x, z, 2.4, 'Mim Sanatçısı Poyraz', async () => {
        ctx.sfx('drum');
        await ctx.ui.dialog([{name:'Mim Sanatçısı Poyraz', text:'... (sessiz durur, sonra kıpırdar) Taksim\'in ortasında heykel olmak zor; insanlar fotoğraf çekiyor, ben gülmemeye çalışıyorum.'}, {name:'Mim Sanatçısı Poyraz', text:'Mim sanatı sessizliktir. Ama bir çocuk gülünce dayanamıyorum.'}]);
      });
      listeners(x, z, 5);
    }
  }
  {
    const p = spot(-56, -18, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 0.4, g => {
        P(g, new THREE.CylinderGeometry(0.9, 1.05, 0.45, 16), 0xc8b890, 0, 0.22, 0);
        P(g, new THREE.CylinderGeometry(0.95, 0.95, 0.08, 16), 0x8a7a5a, 0, 0.48, 0);
      });
      C.circle(x, z, 1.05).low = true;
      const g = person({coat:0xd4af37, hat:'yok', arms:true, override:GOLDM}, q => {
        P(q, new THREE.CylinderGeometry(0.03, 0.03, 0.55, 5), 0xc8a03a, 0.35, 1.25, 0.35, 0.3);
        P(q, new THREE.SphereGeometry(0.13, 10, 8), 0xc8a03a, 0.43, 1.53, 0.44);
      });
      env.npcAt(g, x, z, 1.0, 'Altın Heykel Sedat', async () => {
        ctx.sfx('chime');
        await ctx.ui.dialog([{name:'Altın Heykel Sedat', text:'(kıpırdamaz) ... Bir lira değil, bir gülümseme yeter. Ama önce fotoğraf.'}, {name:'Altın Heykel Sedat', text:'Altın boya sıcakta erir; ben de öğle vakti gölgeye kaçarım. Şimdi tam zamanı.'}]);
      }, env.Hs(x, z) + 0.52);
      listeners(x, z, 4);
    }
  }
  /* ---------- diğer konuşulabilenler ---------- */
  function npc(name, x, z, ry, opt, lines, act, y){
    const p = spot(x, z, {pad:2});
    if (!p) return null;
    const [px, pz] = p; claim(px, pz);
    const g = person(opt, opt.extra);
    const o = env.npcAt(g, px, pz, ry, name, act || say(name, lines), y == null ? undefined : y);
    if (y != null) o.position.y = y;
    return {g:o, x:px, z:pz};
  }
  {
    const a = npc('Üniversiteli Ece', 348, 222, 0.4, {coat:0x7a2a4a, hat:'yok'}, ['Kadıköy\'de kitapçılar, kahveler ve vapur... Üniversite hayatı burada başlar.', 'Sınavdan kaçıp çarşıya geldik. Mert\'e sor, o her zaman kaçacak bir yer bulur.']);
    if (a){ const g = person({coat:0x2a3a6a, hat:'yok'}); env.npcAt(g, a.x + 1.1, a.z + 0.45, -0.7, 'Üniversiteli Mert', say('Üniversiteli Mert', ['Ece\'ye göre Kadıköy\'ün en iyi kahvesi sahilde. Bana göre çarşıda.', 'Bu akşam akordeoncu var; ders çalışmayı yarına bıraktık.'])); claim(a.x + 1.1, a.z + 0.45); }
  }
  {
    const a = npc('Turist Mia', -110, 122, 2.6, {coat:0x8a2a3a, hat:'yok'}, ['Bu meydanda her taşın bir hikâyesi var. Rehberimiz anlattıkça daha çok şaşırıyorum.', 'İstanbul\'da zaman yavaşlıyor gibi. Bir çay içelim, sonra Ayasofya.']);
    if (a){ const g = person({coat:0x2a5a7a, hat:'yok'}); env.npcAt(g, a.x + 1.2, a.z - 0.3, -2.6, 'Turist Oliver', say('Turist Oliver', ['Fotoğraflar bu manzarayı anlatmıyor. Camiler, martılar, simit kokusu...', 'Mia haritayı tutuyor, ben yönümü kaybediyorum. Sanırım İstanbul\'da kaybolmak güzel.'])); claim(a.x + 1.2, a.z - 0.3); }
  }
  {
    const p = spot(208, -70, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 0.6, g => {
        P(g, new THREE.BoxGeometry(1.0, 0.06, 0.8), 0x6a4a2e, 0, 0.73, 0);
        P(g, new THREE.CylinderGeometry(0.05, 0.06, 0.7, 6), 0x3a2a1a, 0, 0.36, 0);
        P(g, new THREE.BoxGeometry(0.7, 0.05, 0.5), 0xe8d8b0, 0, 0.78, 0);
        for (let i = 0; i < 12; i++) P(g, new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), i % 2 ? 0xf0e8d8 : 0x3a2a1a, -0.26 + (i % 6) * 0.1, 0.81, -0.16 + Math.floor(i / 6) * 0.32);
        [-0.9, 0.9].forEach(s => { P(g, new THREE.BoxGeometry(0.4, 0.08, 0.4), 0x8a5a3a, s, 0.42, 0); P(g, new THREE.BoxGeometry(0.4, 0.06, 0.4), 0x6a4a2e, s, 0.78, -0.18); });
      });
      C.circle(x, z, 0.65).low = true;
      const g1 = person({coat:0x3a3a3a, hat:'kasket', beard:true, sit:true});
      const g2 = person({coat:0x5a3a2a, hat:'yok', beard:true, sit:true});
      const y = env.Hs(x, z) - 0.42;
      env.npcAt(g1, x - 1.0, z, Math.PI / 2, 'Emekli Rasim Amca', say('Emekli Rasim Amca', ['Tavla, sabır oyunu. Nuri her zaman zarı hızlı atar, ben her zaman düşünürüm.', 'Üsküdar\'da emekli olmak, vapur sesiyle uyanmak demek.']), y);
      env.npcAt(g2, x + 1.0, z, -Math.PI / 2, 'Emekli Nuri Amca', say('Emekli Nuri Amca', ['Rasim\'in tavlası iyidir ama benim zarlarım daha şanslı. Bir çay söyle, gör.', 'Bu meydanda kırk yıl önce de aynı kahvehane vardı; sadece sandalyeler yenilendi.']), y);
      claim(x - 1.0, z); claim(x + 1.0, z);
    }
  }
  {
    const f = frontPick(f => f.x < -330 && f.z > -30 && f.z < 120, -360, 50);
    if (f){
      const x1 = f.x + Math.sin(f.ry) * 1.0 - Math.cos(f.ry) * 0.9, z1 = f.z + Math.cos(f.ry) * 1.0 + Math.sin(f.ry) * 0.9;
      const x2 = f.x + Math.sin(f.ry) * 1.0 + Math.cos(f.ry) * 0.9, z2 = f.z + Math.cos(f.ry) * 1.0 - Math.sin(f.ry) * 0.9;
      const g1 = person({coat:0x7a2a4a, hat:'yok'}, q => P(q, new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), 0xd8b060, 0, 1.7, 0));
      const g2 = person({coat:0x2a5a6a, hat:'yok'}, q => P(q, new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), 0xc87a8a, 0, 1.7, 0));
      env.npcAt(g1, x1, z1, f.ry + Math.PI, 'Nurten Teyze', say('Nurten Teyze', ['Balat\'ta çamaşır ipi, komşuluk demektir. Karşı komşu bugün bize börek getirdi.', 'Bu sokakta herkes birbirinin çocuğunu tanır. Sıcaklık burada taşlara sinmiş.']), f.y);
      env.npcAt(g2, x2, z2, f.ry + Math.PI, 'Saniye Teyze', say('Saniye Teyze', ['Nurten\'le pencereden bakarız; kim gelir, kim gider, hepsini biliriz.', 'Balat\'ın renkli evlerini boyayanlar da bizim mahalleden. Bir çay iç, anlatayım.']), f.y);
      claim(x1, z1); claim(x2, z2);
    }
  }
  {
    let h = null;
    for (const q of env.houseList){ if (q.x < -330 && q.z > -30 && q.z < 120 && q.top > 5.5){ h = q; break; } }
    if (h){
      const c = Math.cos(h.ry), s = Math.sin(h.ry), lz = h.d / 2 + 1.42;
      const wx = h.x + lz * s, wz = h.z + lz * c, wy = h.base + 4.55;
      const g = env.adam({coat:0x8a2a5a, hat:'yok'});
      g.userData.legL.visible = false; g.userData.legR.visible = false;
      P(g, new THREE.BoxGeometry(0.5, 0.18, 0.3), 0x8a2a5a, 0, 0.98, 0);
      P(g, new THREE.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), 0xe0c060, 0, 1.7, 0);
      bakeFig(g);
      g.position.set(wx, wy - 0.9, wz); g.rotation.y = h.ry; g.userData.dyn = true; ctx.root.add(g);
      ctx.interact(wx, wz, 'Konuş: Balkondan Seslenen Melek Teyze', say('Balkondan Seslenen Melek Teyze', ['Aşağıdaki! Evet, sen! Çamaşırları toplarken gördüm, çay içmeye bekleriz.', 'İkinci kattan bakınca sokak daha güzel. Bir dakika, merdivenlerden ineyim... yok, inemem, börek pişiyor!']), 4.0);
    }
  }
  let bozaG = null, bozaN = null;
  {
    const p = spot(-150, -420);
    if (p){
      const [x, z] = p; claim(x, z);
      const sx = x + 1.05, sz = z + 0.2;
      bozaG = new THREE.Group(); bozaG.userData.dyn = true; bozaG.position.set(x, env.Hs(x, z), z); ctx.root.add(bozaG);
      P(bozaG, new THREE.BoxGeometry(1.2, 0.7, 0.8), 0x5a3a2a, 0, 0.55, 0);
      P(bozaG, new THREE.CylinderGeometry(0.2, 0.24, 0.7, 12), 0xc0b090, 0.25, 1.25, 0);
      P(bozaG, new THREE.SphereGeometry(0.21, 12, 8), 0xd4af37, 0.25, 1.62, 0);
      for (let i = 0; i < 3; i++) P(bozaG, new THREE.CylinderGeometry(0.055, 0.045, 0.16, 8), 0xf0e8d8, -0.4 + i * 0.16, 1.1, 0.1);
      bakeFig(bozaG);
      const g = person({coat:0x3a3a5a, hat:'takke', beard:true});
      g.position.set(sx, env.Hs(sx, sz), sz); g.rotation.y = -1.4;
      g.userData.dyn = true; ctx.root.add(g);
      bozaN = g; claim(sx, sz);
      // Gündüz görünmeyen bozacı ve arabası gündüz çarpışma da oluşturmaz.
      const bozaCol = [{x:env.AT.x + x, z:env.AT.z + z, r:0.65}, {x:env.AT.x + sx, z:env.AT.z + sz, r:0.4}], bozaNone = [];
      C.dynamics.push(() => ctx.W.night > 0.42 ? bozaCol : bozaNone);
      ctx.interact(sx, sz, 'Konuş: Bozacı Salih Dede', say('Bozacı Salih Dede', ['Boza! Buz gibi, tarçınlı. Kış gecelerinin en eski dostu.', 'Beyoğlu\'nda gece yarısı bozacı sesi duyarsan bil ki İstanbul hâlâ uyanık.']), 2.8, () => ctx.W.night > 0.42);
      ctx.onUpdate(() => { const v = ctx.W.night > 0.42; bozaG.visible = v; if (bozaN) bozaN.visible = v; });
    }
  }
  /* ---------- merdivenler ve oturanlar ---------- */
  {
    const sx = 6, sz = 178;
    buildStatic(sx, sz, 0, g => {
      for (let i = 0; i < 3; i++) P(g, new THREE.BoxGeometry(3.2, 0.18, 0.9), 0xb8ae9a, 0, 0.09 + i * 0.18, i * 0.9);
    });
    C.box(sx, sz + 0.9, 1.6, 1.4).low = true;
  }

  /* ---------- çocuklar, bekçi, esnaf ---------- */
  {
    const p = spot(-4, -36, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x2a6a8a, hat:'kasket', scale:0.65}, q => {
        P(q, new THREE.TorusGeometry(0.16, 0.05, 6, 12), 0xc8873a, 0.28, 1.38, 0.45, Math.PI / 2);
        P(q, new THREE.CylinderGeometry(0.025, 0.03, 0.55, 5), 0xe0b090, 0.24, 1.45, 0.22, 0, 0, -0.9);
      });
      env.npcAt(g, x, z, 0.8, 'Simit Atan Kerem', say('Simit Atan Kerem', ['Martılar simidi havada kapıyor! Annem kızmadan bir tane daha atsam mı?', 'En cesur martı hep en yükseğe uçan. Bak, şimdi de vapurun peşinden gidiyor.']));
    }
  }
  {
    const p = spot(20, 168, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x + 1.6, z - 0.8, 0, g => P(g, new THREE.SphereGeometry(0.22, 12, 8), 0xf2f0ea, 0, 0.22, 0));
      const g = person({coat:0xe8e0d0, hat:'yok', scale:0.65});
      env.npcAt(g, x, z, 0.7, 'Mahalle Maçı Efe', say('Mahalle Maçı Efe', ['Kaleci yok, ama Efe var! Topu bana at, golü atayım.', 'Büyükler parkta yürüyor, biz burada maç yapıyoruz. Top parkın çalısına kaçarsa kimse suçlu değil.']));
      [[x - 2.2, z + 1.2], [x + 2.0, z + 1.8]].forEach(([bx, bz], i) => { const k = person({coat:i ? 0x6a2a3a : 0x2a5a3a, scale:0.65}); env.putP(k, bx, bz, Math.atan2(x - bx, z - bz)); });
    }
  }
  {
    const p = spot(-400, 40, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x2a2a3a, hat:'kasket', beard:true}, q => {
        P(q, new THREE.BoxGeometry(0.14, 0.1, 0.03), 0xd4af37, 0.1, 1.33, 0.23);
        P(q, new THREE.CylinderGeometry(0.015, 0.015, 0.08, 5), 0xc0c0c0, 0.16, 1.3, 0.26);
      });
      env.npcAt(g, x, z, 1.2, 'Bekçi Rıfat Amca', say('Bekçi Rıfat Amca', ['Düdüğüm eski ama sesi hâlâ delikanlı. Balat\'ta akşam olunca sokak lambalarını ben kontrol ederim.', 'Mahalle bekçisi demek, herkesin adını bilen ve kimseyi incitmeyen biri demek.']));
    }
  }
  {
    const f = shopFront('LOKANTA', -200, 40) || anyFront(-200, 40);
    if (f) standAtFront(f, 'Lokantacı Şükrü', say('Lokantacı Şükrü', ['Bugün kuru fasulye, pilav, turşu... Ekmek taze, gel otur.', 'İstanbul\'da lokanta, sadece yemek yeri değil; mahallenin buluşma yeridir.']), 1.2, 0.5);
  }
  {
    const f = shopFront('BERBER', 280, -120) || anyFront(280, -120);
    if (f){
      buildStatic(f.x + Math.sin(f.ry) * 1.4 + Math.cos(f.ry) * 1.1, f.z + Math.cos(f.ry) * 1.4 - Math.sin(f.ry) * 1.1, f.ry, g => {
        P(g, new THREE.CylinderGeometry(0.13, 0.13, 1.6, 10), 0xf2f0ea, 0, 0.8, 0);
        for (let i = 0; i < 7; i++) P(g, new THREE.TorusGeometry(0.12, 0.03, 5, 10), i % 2 ? 0xb3202a : 0x1d5a9a, 0, 0.25 + i * 0.18, 0, Math.PI / 2);
      });
      standAtFront(f, 'Berber İlyas', say('Berber İlyas', ['Tıraş mı, saç mı? Aynayı tutarım, sohbeti de ben açarım.', 'Bu dükkânın babasından kalma makası hâlâ kutuda saklarım. Müşteri değişir, muhabbet aynı kalır.']), 1.1, 0.6);
    }
  }
  {
    const f = shopFront('FIRIN', 330, 250) || anyFront(330, 250);
    if (f){
      buildStatic(f.x + Math.sin(f.ry) * 1.7, f.z + Math.cos(f.ry) * 1.7, f.ry, g => {
        P(g, new THREE.BoxGeometry(1.1, 0.6, 0.5), 0x8a6a3a, 0, 0.35, 0);
        P(g, new THREE.BoxGeometry(0.95, 0.08, 0.4), 0xd8b878, 0, 0.68, 0);
        for (let i = 0; i < 5; i++) P(g, new THREE.SphereGeometry(0.11, 8, 6), 0xd8a050, -0.34 + i * 0.17, 0.8, 0).scale.set(1.25, 0.65, 0.9);
      });
      standAtFront(f, 'Fırıncı Hatice', say('Fırıncı Hatice', ['Ekmek fırından yeni çıktı; sıcakken al, kabuğu çıtırdasın.', 'Her sabah hamuru yoğururken mahalle uyanır. İstanbul\'un kokusu bence taze ekmektir.']), 1.3, 0.7);
    }
  }
  {
    const f = shopFront('KAHVEHANE', 215, -45) || anyFront(215, -45);
    if (f) standAtFront(f, 'Kahveci Sabri', say('Kahveci Sabri', ['Çayın demini, sohbetin dozunu ben ayarlarım. Otur, iki çay söyleyeyim.', 'Kahvehane İstanbul\'da ikinci evdir. Tavla sesi, çay bardağı ve gazete... Daha ne olsun?']), 1.1, 0.6);
  }
  {
    const p = spot(56, -104);
    if (p){
      const [x, z] = p; claim(x, z);
      buildStatic(x, z, 1.2, g => {
        P(g, new THREE.BoxGeometry(2.0, 0.75, 0.9), 0x7a7a76, 0, 0.45, 0);
        P(g, new THREE.BoxGeometry(1.9, 0.12, 0.82), 0xd8e8ee, 0, 0.84, 0);
        for (let i = 0; i < 9; i++) P(g, new THREE.SphereGeometry(0.1, 7, 5), 0xb8c0c4, -0.75 + (i % 5) * 0.36, 0.94, -0.18 + Math.floor(i / 5) * 0.34).scale.set(1.7, 0.5, 0.8);
        for (let i = 0; i < 3; i++) P(g, new THREE.SphereGeometry(0.09, 7, 5), 0xf0d040, 0.72, 0.94, -0.2 + i * 0.18).scale.set(1, 0.8, 1);
      });
      C.box(x, z, 1.05, 0.55, 1.2).low = true;
      const g = person({coat:0x1d5a6a, apron:0xf0e8d8, hat:'kasket'});
      env.npcAt(g, x - 1.3, z, 1.9, 'Balıkçı Cevdet', say('Balıkçı Cevdet', ['İstavrit, levrek, hamsi... Hangisi olsun? Bu sabahın balığı, gözü parlak.', 'Karaköy\'de balıkçılık sabır işidir. Deniz ne verirse, tezgâh onu söyler.']));
      claim(x - 1.3, z);
    }
  }
  {
    const p = spot(-88, -150, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x8a6a2a, hat:'yok'}, q => {
        P(q, new THREE.BoxGeometry(0.26, 0.18, 0.12), 0x1a1a1a, 0, 1.35, 0.28);
        P(q, new THREE.CylinderGeometry(0.08, 0.09, 0.14, 10), 0x2a2a2a, 0, 1.35, 0.38, Math.PI / 2);
      });
      env.npcAt(g, x, z, -3, 'Turist Clara', async () => {
        ctx.sfx('blip');
        await ctx.ui.dialog([{name:'Turist Clara', text:'Galata Kulesi\'ni kadraja sığdırmaya çalışıyorum; kule hep bir adım daha uzun.'}, {name:'Turist Clara', text:'Bir İstanbullu bana "aşağıdan çek" dedi. Haklıymış, şimdi daha güzel görünüyor.'}]);
      });
    }
  }
  {
    const p = spot(300, 268, {pad:2});
    if (p){
      const [x, z] = p; claim(x, z);
      const g = person({coat:0x2a4a6a, hat:'yok'}, q => {
        P(q, new THREE.BoxGeometry(0.16, 0.04, 0.22), 0x8a8a8a, 0.18, 1.15, 0.2);
        P(q, new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8), 0xd4af37, 0.18, 1.18, 0.2);
      });
      env.npcAt(g, x, z, 2.8, 'Jetonu Kaybetmiş Hakan', async () => {
        ctx.sfx('wrong');
        await ctx.ui.dialog([{name:'Jetonu Kaybetmiş Hakan', text:'Cebimde tek bir jeton vardı, o da buharlaştı. Kadıköy\'e yürüyerek gitsem mi?'}, {name:'Jetonu Kaybetmiş Hakan', text:'Şaka bir yana, iskele görevlisi "bir dahaki sefere cebini kontrol et" dedi. Haklı adam.'}]);
      });
    }
  }
  {
    const a = npc('Gün Batımı Bekleyen Defne', 388, -230, 2.6, {coat:0x8a2a5a, hat:'yok'}, ['Güneş birazdan Sarayburnu\'nun arkasına inecek. Çamlıca\'da en güzel saat bu.']);
    if (a){ const g = person({coat:0x2a3a5a, hat:'yok'}); env.npcAt(g, a.x + 1.0, a.z + 0.5, -2.8, 'Gün Batımı Bekleyen Onur', say('Gün Batımı Bekleyen Onur', ['Defne her akşam buraya gelir. Ben de onunla gelirim; gökyüzü her seferinde başka bir tablo.'])); claim(a.x + 1.0, a.z + 0.5); }
  }

  /* ---------- yeni gezen İstanbullular ---------- */
  const walkCells = new Set();
  function routeOK(a, b){
    const dx = b[0] - a[0], dz = b[1] - a[1];
    for (let i = 0; i <= 9; i++){
      const t = i / 9, x = a[0] + dx * t, z = a[1] + dz * t;
      if (!env.landG(x, z) || !env.inland(x, z, 1.2) || env.occ.has(env.cell(x, z))) return false;
      if (near(x, z, claimedPts, 1.05) || near(x, z, existingPts, 1.05)) return false;
      if (walkCells.has(env.cell(x, z))) return false;
    }
    return true;
  }
  const WALK_COATS = [0x3a4a5a, 0x5a3a2a, 0x2a5a4a, 0x6a2a3a, 0x4a4a6a, 0x7a6a4a, 0x2a2a3a, 0x8a5a3a];
  const WALK_DRESS = [0x7a2a4a, 0x2a5a7a, 0x8a6a2a, 0x3a6a3a, 0x9a3a2a, 0x5a3a7a];
  const WALK_SCARF = [0xd8b060, 0x7a9ac0, 0xc87a8a, 0xf2efe8, null, null];
  let walkN = 0;
  function addWalker(a, b){
    if (!routeOK(a, b)) return false;
    const i = walkN++;
    let g;
    if (i % 4 === 0){ g = env.kadin(WALK_DRESS[i % WALK_DRESS.length], WALK_SCARF[i % WALK_SCARF.length]); bakeFig(g); }
    else g = person({coat:WALK_COATS[i % WALK_COATS.length], hat:i % 3 === 0 ? 'kasket' : 'yok', beard:i % 7 === 0});
    g.userData.dyn = true; ctx.root.add(g);
    env.walkers.push({g, a, b, t:rnd(), speed:0.85 + rnd() * 0.4, dir:1});
    for (let k = 0; k <= 9; k++){
      const t = k / 9;
      walkCells.add(env.cell(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t));
    }
    return true;
  }
  const walkCands = [
    [[-62, -114], [-84, -126]],
    [[-147, -200], [-147, -280]],
    [[-120, -350], [-120, -390]],
    [[-100, 160], [-100, 196]],
    [[30, 30], [30, 58]],
    [[-250, 50], [-250, 82]],
    [[200, -20], [220, 0]],
    [[220, 80], [240, 110]],
    [[320, 240], [320, 270]],
    [[380, -230], [380, -200]],
    [[-350, 60], [-350, 90]],
    [[50, -190], [50, -220]],
    [[-90, 10], [-90, 40]],
    [[320, 210], [340, 210]]
  ];
  for (const [a, b] of walkCands){ if (walkN >= 10) break; addWalker(a, b); }
  function findRoute(cx, cz, ang, len){
    for (let k = 0; k < 16; k++){
      const a = ang + (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 0.32;
      const dx = Math.sin(a), dz = Math.cos(a);
      for (let off = 0; off <= 6; off += 2){
        const ax = cx + dx * off, az = cz + dz * off;
        if (routeOK([ax, az], [ax + dx * len, az + dz * len])) return [[ax, az], [ax + dx * len, az + dz * len]];
      }
    }
    return null;
  }
  if (walkN < 10){
    const em = [[-24, -10], [-100, 160], [-250, 60], [200, -10], [320, 250], [220, 90], [380, -220], [-350, 70], [50, -200], [-120, -360], [-60, -120], [-90, 10]];
    for (const [cx, cz] of em){
      for (let k = 0; k < 8 && walkN < 10; k++){
        const r = findRoute(cx, cz, k * Math.PI / 4, 16 + (k % 3) * 6);
        if (r) addWalker(r[0], r[1]);
      }
      if (walkN >= 10) break;
    }
  }
  // Eski gezenlerin güzergâhlarını da kalabalık yerleştirirken boş bırak.
  for (const w of env.walkers){
    for (let k = 0; k <= 9; k++){
      const t = k / 9;
      walkCells.add(env.cell(w.a[0] + (w.b[0] - w.a[0]) * t, w.a[1] + (w.b[1] - w.a[1]) * t));
    }
  }

  /* ---------- arka plan kalabalığı ---------- */
  const bgAnchors = [
    [-20, -20], [-36, -8], [-8, 8], [-50, -10], [-64, -24], [8, -8],
    [28, -112],
    [-88, -134], [-120, -128], [-140, -128], [-132, -146],
    [-136, -190], [-164, -210], [-136, -240], [-164, -270], [-136, -300],
    [-130, -320], [-170, -310], [-120, -350], [-180, -350],
    [-110, 150], [-100, 140], [-80, 150], [-120, 136], [-70, 138], [-125, 158],
    [-20, 100], [0, 100], [30, 40], [-50, 60], [30, 100],
    [-260, 50], [-250, 40], [-270, 60], [-240, 70], [-255, 75],
    [230, -20], [240, -10], [205, -20], [190, -20], [240, -60], [225, -75],
    [210, 80], [220, 90], [230, 110], [205, 110], [240, 130],
    [320, 250], [335, 240], [350, 260], [330, 220], [320, 270],
    [380, -220], [370, -230], [400, -210], [380, -260],
    [-360, 40], [-350, 60], [-370, 80], [-380, 30], [-340, 80],
    [54, -200], [46, -220], [40, -260],
    [-112, 10], [-100, -8], [-130, -5], [-90, 8], [-120, 20]
  ];
  let bgN = 0;
  function bgFree(x, z){
    if (!env.landG(x, z) || !env.inland(x, z, 2) || env.occ.has(env.cell(x, z)) || env.roadDist(x, z) <= -0.5) return false;
    if (near(x, z, claimedPts, 1.3) || near(x, z, existingPts, 1.3)) return false;
    if (walkCells.has(env.cell(x, z))) return false;
    return true;
  }
  function bgSpot(x, z){
    if (bgFree(x, z)) return [x, z];
    for (let r = 1.5; r <= 12; r += 1.5){
      for (let i = 0; i < 16; i++){
        const a = i * Math.PI / 8 + r * 0.7;
        const px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r;
        if (bgFree(px, pz)) return [px, pz];
      }
    }
    return null;
  }
  function bgAt(x, z){
    if (bgN >= 44) return;
    const p = bgSpot(x, z);
    if (!p) return;
    const [px, pz] = p;
    claim(px, pz);
    const g = env.someone(200 + bgN);
    env.putP(g, px, pz, rnd() * Math.PI * 2);
    bgN++;
  }
  const bgOff = [[0, 0], [1.8, -1.8], [-1.8, 1.8], [2.4, 0], [-2.4, 0]];
  for (const [ox, oz] of bgOff){
    for (const [x, z] of bgAnchors){ if (bgN >= 44) break; bgAt(x + ox, z + oz); }
    if (bgN >= 44) break;
  }
  if (bgN < 40){
    for (let gx = -420; gx <= 420 && bgN < 40; gx += 24){
      for (let gz = -420; gz <= 420 && bgN < 40; gz += 24) bgAt(gx, gz);
    }
  }

  // Kalabalığın malzemelerini küçük bir palete indir: birleştirme sonrası az çizim çağrısı.
  const CROWD_MATS = [0x3a4a5a, 0x5a3a2a, 0x2a5a4a, 0x6a2a3a, 0x4a4a6a, 0x7a6a4a, 0x2a2a3a, 0x8a5a3a,
    0xe0b094, 0xc89272, 0x3a2616, 0xe8e0d0, 0xd4af37, 0x8a8a88].map(c => kit.mat(c, {roughness:0.82}));
  const CROWD_COLS = CROWD_MATS.map(m => m.color);
  const crowdMat = m => {
    if (!m || Array.isArray(m) || m.transparent || m.map || m.vertexColors || !m.color) return m;
    const c = m.color;
    let best = CROWD_MATS[0], bd = 1e9;
    for (let i = 0; i < CROWD_MATS.length; i++){
      const d = (c.r - CROWD_COLS[i].r) ** 2 + (c.g - CROWD_COLS[i].g) ** 2 + (c.b - CROWD_COLS[i].b) ** 2;
      if (d < bd){ bd = d; best = CROWD_MATS[i]; }
    }
    return best;
  };
  env.crowd.traverse(o => { if (o.isMesh && !o.userData.keep) o.material = crowdMat(o.material); });
  flushStatic();
}
