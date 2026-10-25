// İstanbul meydanlarının güvercinleri ve kuş yemi satıcıları.
// Eminönü, Sultanahmet ve Üsküdar sürüleri; tek InstancedMesh gövde, kanatlar ve yanardöner boyun.
export function buildGuvercin(ctx, env){
  const { THREE, kit } = ctx;
  const store = env.store || ctx.store || {};
  const TAU = Math.PI * 2;

  store.yem = Math.max(0, Math.floor(Number(store.yem) || 0));

  const FLOCKS = [
    { x:-88, z:-12, r:12, n:70, ad:'Yemci Fatma Teyze',
      selam:'Yem mi istedin evladım? Yeni Cami\'nin güvercinleri pek oburdur; hepsi seni bekliyor.',
      bilgi:'Güvercinler aynada kendilerini tanır. Seni de yüzünden hatırlar; yem veren elleri hiç unutmazlar.',
      g:env.kadin(0x5a3a2a, 0xe8e0d0) },
    { x:-110, z:140, r:10, n:45, ad:'Yemci Hüsnü Amca',
      selam:'Meydanın kuşları benim tabaklarımdan yer. Bir tabak yem, kırk kanat mutluluk!',
      bilgi:'Güvercinler uçarken kanatlarını V biçiminde açar. Güneşi pusula gibi kullanıp yuvalarının yolunu bulurlar.',
      g:env.adam({ coat:0x4a5a3a, hat:'kasket', beard:true }) },
    { x:222, z:-40, r:9, n:35, ad:'Yemci Gülsüm Abla',
      selam:'Üsküdar\'ın güvercinleri sabah erkenden gelir. Yem veren çocukları hiç unutmazlar.',
      bilgi:'Güvercinler yavrularına güvercin sütü denilen özel bir süt verir. Kuşlar arasında bunu yapabilen pek az tür var.',
      g:env.kadin(0x7a2a4a, 0xf2efe8) },
  ];

  /* ---------- güvercin geometrisi: gövde + baş + gaga + kuyruk tek geometride ---------- */
  const bp = [];
  const kure = (rx, ry, rz, x, y, z) => {
    const g = new THREE.SphereGeometry(1, 8, 6);
    g.scale(rx, ry, rz); g.translate(x, y, z); bp.push(g);
  };
  kure(0.055, 0.062, 0.095, 0, 0.14, -0.005);        // gövde
  kure(0.048, 0.05, 0.052, 0, 0.235, 0.06);          // baş
  {
    const gaga = new THREE.ConeGeometry(0.015, 0.055, 5);
    gaga.rotateX(Math.PI / 2); gaga.translate(0, 0.232, 0.108);
    bp.push(gaga);
    const kuyruk = new THREE.BoxGeometry(0.055, 0.018, 0.13);
    kuyruk.rotateX(-0.18); kuyruk.translate(0, 0.16, -0.145);
    bp.push(kuyruk);
  }
  const birdGeo = env.mergeBufferGeometries(bp);

  // kanat: omuzda başlayan, uca doğru incelen ince levha
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, -0.055, 0, 0, 0.055, 0.19, 0.02, 0.032, 0.18, 0.02, -0.045,
  ], 3));
  wingGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 0.78, 1, 0.22], 2));
  wingGeo.setIndex([0, 2, 1, 1, 2, 3]);
  wingGeo.computeVertexNormals();

  // yanardöner boyun halkası (gövdeyle aynı matriste çizilir)
  const neckGeo = new THREE.SphereGeometry(0.043, 6, 5);
  neckGeo.scale(1, 0.6, 1); neckGeo.translate(0, 0.199, 0.032);

  const bodyM = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.76, metalness:0.04 });
  const wingM = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.82, side:THREE.DoubleSide });
  const neckM = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.34, metalness:0.55 });

  let total = 0;
  for (let f = 0; f < FLOCKS.length; f++) total += FLOCKS[f].n;

  const bodyMesh = new THREE.InstancedMesh(birdGeo, bodyM, Math.max(1, total));
  const wingMesh = new THREE.InstancedMesh(wingGeo, wingM, Math.max(2, total * 2));
  const neckMesh = new THREE.InstancedMesh(neckGeo, neckM, Math.max(1, total));
  bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  wingMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  neckMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bodyMesh.frustumCulled = false; wingMesh.frustumCulled = false; neckMesh.frustumCulled = false;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = false; wingMesh.receiveShadow = false; neckMesh.receiveShadow = false;
  env.keep(bodyMesh); env.keep(wingMesh); env.keep(neckMesh);
  ctx.root.add(bodyMesh, wingMesh, neckMesh);

  /* ---------- kuş verileri: kuş başına düz diziler ---------- */
  const bx = new Float32Array(total), by = new Float32Array(total), bz = new Float32Array(total);
  const btx = new Float32Array(total), btz = new Float32Array(total);
  const blx = new Float32Array(total), bly = new Float32Array(total), blz = new Float32Array(total);
  const byaw = new Float32Array(total), bscale = new Float32Array(total);
  const bri = new Float32Array(total), bai = new Float32Array(total), bhi = new Float32Array(total);
  const bsp = new Float32Array(total), bt = new Float32Array(total), bph = new Float32Array(total);
  const bpec = new Float32Array(total), bldur = new Float32Array(total);
  const bs = new Uint8Array(total), bmode = new Uint8Array(total), bdi = new Int8Array(total);
  const fstart = new Int32Array(FLOCKS.length), fend = new Int32Array(FLOCKS.length);
  const feedT = new Float32Array(FLOCKS.length);

  let N = 0;
  const col = new THREE.Color();
  const BODY_C = [0xb9c3cb, 0x8d99a2, 0xe9edf0, 0x9a8370, 0x7f8c96, 0xd6dde2];

  // geçici nesneler bir kez; her karede yenisi üretilmez
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();

  function yerYuru(i, f){
    const F = FLOCKS[f];
    btx[i] = bx[i]; btz[i] = bz[i];
    for (let a = 0; a < 10; a++){
      const ang = ctx.rnd() * TAU, rr = Math.sqrt(ctx.rnd()) * F.r * 0.82;
      const x = F.x + Math.sin(ang) * rr, z = F.z + Math.cos(ang) * rr;
      if (!env.landG(x, z) || !env.onLand(x, z)) continue;
      if (env.occ.has(env.cell(x, z))) continue;
      btx[i] = x; btz[i] = z; return;
    }
  }

  function inisNoktasi(i, f){
    const F = FLOCKS[f];
    btx[i] = F.x; btz[i] = F.z;
    for (let a = 0; a < 14; a++){
      const ang = ctx.rnd() * TAU, rr = Math.sqrt(ctx.rnd()) * F.r;
      const x = F.x + Math.sin(ang) * rr, z = F.z + Math.cos(ang) * rr;
      if (!env.landG(x, z) || !env.onLand(x, z)) continue;
      if (env.occ.has(env.cell(x, z))) continue;
      btx[i] = x; btz[i] = z; return;
    }
  }

  function ucusBaslat(i, f){
    const F = FLOCKS[f];
    const dx = bx[i] - F.x, dz = bz[i] - F.z;
    bs[i] = 1;
    bt[i] = 6 + ctx.rnd() * 6;
    bai[i] = Math.atan2(dx, dz);
    bri[i] = Math.max(4, Math.min(F.r + 8, Math.hypot(dx, dz) + 2.5));
    bdi[i] = ctx.rnd() < 0.5 ? -1 : 1;
    bsp[i] = 1.0 + ctx.rnd() * 0.65;
    bhi[i] = 8 + ctx.rnd() * 6;
    bph[i] = ctx.rnd() * TAU;
  }

  function urkut(i, f, t){
    let n = 0;
    for (let j = fstart[f]; j < fend[f]; j++){
      if (bs[j] !== 0) continue;
      const dx = bx[j] - bx[i], dz = bz[j] - bz[i];
      if (dx * dx + dz * dz > 25) continue;
      ucusBaslat(j, f); n++;
    }
    if (n && t - lastWhoosh > 1.5){ lastWhoosh = t; ctx.sfx('whoosh'); }
  }

  function iniseGec(i, f){
    bs[i] = 2;
    bt[i] = 0;
    bldur[i] = 2.4 + ctx.rnd() * 1.5;
    blx[i] = bx[i]; bly[i] = by[i]; blz[i] = bz[i];
    inisNoktasi(i, f);
  }

  function otur(i, pitch, roll, flap){
    const sc = bscale[i], x = bx[i], y = by[i], z = bz[i], yaw = byaw[i];
    e4.set(pitch, yaw, roll, 'YXZ'); q4.setFromEuler(e4); s4.set(sc, sc, sc);
    m4.compose(p4.set(x, y, z), q4, s4);
    bodyMesh.setMatrixAt(i, m4); neckMesh.setMatrixAt(i, m4);
    const c = Math.cos(yaw), s = Math.sin(yaw);
    for (let w = 0; w < 2; w++){
      const sd = w ? -1 : 1, lx = 0.045 * sd * sc;
      e4.set(pitch, yaw, flap * sd, 'YXZ'); q4.setFromEuler(e4);
      s4.set(sd * sc * 0.92, sc * 0.92, sc * 0.92);
      m4.compose(p4.set(x + lx * c, y + 0.165 * sc, z - lx * s), q4, s4);
      wingMesh.setMatrixAt(i * 2 + w, m4);
    }
  }

  /* ---------- sürüleri yerleştir ---------- */
  for (let f = 0; f < FLOCKS.length; f++){
    const F = FLOCKS[f];
    fstart[f] = N;
    for (let k = 0; k < F.n; k++){
      let x = 0, z = 0, ok = false;
      for (let a = 0; a < 32; a++){
        const ang = ctx.rnd() * TAU, rr = Math.sqrt(ctx.rnd()) * F.r;
        x = F.x + Math.sin(ang) * rr; z = F.z + Math.cos(ang) * rr;
        if (!env.landG(x, z) || !env.onLand(x, z)) continue;
        if (env.occ.has(env.cell(x, z))) continue;
        ok = true; break;
      }
      if (!ok) continue;
      const i = N++;
      bx[i] = x; bz[i] = z; by[i] = env.Hs(x, z);
      bs[i] = 0; bmode[i] = 0; bt[i] = 0.6 + ctx.rnd() * 2.2;
      byaw[i] = ctx.rnd() * TAU;
      bscale[i] = 0.98 + ctx.rnd() * 0.16;
      bph[i] = ctx.rnd() * TAU; bpec[i] = ctx.rnd() * TAU;
      btx[i] = x; btz[i] = z; bldur[i] = 3;

      col.set(BODY_C[(i * 3 + f) % BODY_C.length]).convertSRGBToLinear();
      col.multiplyScalar(0.92 + ctx.rnd() * 0.14);
      bodyMesh.setColorAt(i, col);
      col.multiplyScalar(0.82);
      wingMesh.setColorAt(i * 2, col); wingMesh.setColorAt(i * 2 + 1, col);
      col.setHSL(0.33 + (i % 6) * 0.09, 0.52, 0.44).convertSRGBToLinear();
      neckMesh.setColorAt(i, col);

      otur(i, 0, 0, -1.0);
    }
    fend[f] = N;
  }

  bodyMesh.count = N; wingMesh.count = N * 2; neckMesh.count = N;
  if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;
  if (wingMesh.instanceColor) wingMesh.instanceColor.needsUpdate = true;
  if (neckMesh.instanceColor) neckMesh.instanceColor.needsUpdate = true;
  bodyMesh.instanceMatrix.needsUpdate = true;
  wingMesh.instanceMatrix.needsUpdate = true;
  neckMesh.instanceMatrix.needsUpdate = true;

  /* ---------- yem tezgâhları ve satıcılar ---------- */
  const ahsapM = env.mats.doorM || kit.mat(0x4a2c1a, { roughness:0.7 });
  const yemM = kit.mat(0xe3b23c, { roughness:0.7 });

  for (let f = 0; f < FLOCKS.length; f++){
    const F = FLOCKS[f];
    let sx = F.x, sz = F.z, ok = false;
    for (let pass = 0; pass < 2 && !ok; pass++){
      for (let k = 0; k < 28; k++){
        const ang = k / 28 * TAU + 0.35, rad = F.r + 2 + (k % 2) * 0.7;
        const x = F.x + Math.sin(ang) * rad, z = F.z + Math.cos(ang) * rad;
        if (!env.landG(x, z) || !env.onLand(x, z) || !env.inland(x, z, 0.6)) continue;
        if (env.occ.has(env.cell(x, z))) continue;
        if (pass === 0 && env.roadDist(x, z) < 0.3) continue;
        sx = x; sz = z; ok = true; break;
      }
    }
    if (!ok) continue;

    const ry = Math.atan2(F.x - sx, F.z - sz);
    const gy = env.Hs(sx, sz);
    const G = env.reg(sx, sz);

    kit.add(new THREE.CylinderGeometry(0.33, 0.3, 0.08, 12), ahsapM, sx, gy + 0.56, sz, G, false);   // tabure
    for (let k = 0; k < 3; k++){
      const a = k / 3 * TAU;
      kit.add(new THREE.BoxGeometry(0.06, 0.52, 0.06), ahsapM,
        sx + Math.sin(a) * 0.2, gy + 0.26, sz + Math.cos(a) * 0.2, G, false);
    }
    const tabak = [[-0.18, 0.06], [0.02, 0.12], [0.2, -0.02]];
    for (let k = 0; k < tabak.length; k++){
      const ox = tabak[k][0], oz = tabak[k][1];
      const px = sx + ox * Math.cos(ry) + oz * Math.sin(ry);
      const pz = sz - ox * Math.sin(ry) + oz * Math.cos(ry);
      kit.add(new THREE.CylinderGeometry(0.14, 0.115, 0.035, 10), yemM, px, gy + 0.63, pz, G, false);  // yem tabağı
      kit.add(new THREE.ConeGeometry(0.095, 0.06, 8), yemM, px, gy + 0.665, pz, G, false);             // yem yığını
    }
    ctx.C.box(sx, sz, 0.5, 0.5, ry).low = true;

    let ex = sx - Math.sin(ry) * 0.82, ez = sz - Math.cos(ry) * 0.82;
    if (!env.landG(ex, ez) || !env.onLand(ex, ez) || env.occ.has(env.cell(ex, ez))){
      ex = sx + Math.sin(ry) * 0.82; ez = sz + Math.cos(ry) * 0.82;
    }

    const fi = f, ad = F.ad;
    env.npcAt(F.g, ex, ez, ry, ad, async () => {
      const pick = await ctx.ui.dialog([{
        name:ad,
        text:F.selam,
        choices:['Bir tabak yem al', 'Sadece bakıyorum'],
      }]);
      if (pick !== 0){ await ctx.ui.say(ad, F.bilgi); return; }

      ctx.sfx('coin');
      feedT[fi] = 25;
      store.yem = (Number(store.yem) || 0) + 1;
      ctx.save();
      if (store.yem >= 5 && !store.guvercinDost){
        store.guvercinDost = true;
        ctx.save();
        ctx.ui.toast('Güvercin Dostu oldun! İstanbul\'un güvercinleri seni tanıyor');
        ctx.sfx('quest');
      } else {
        ctx.ui.toast('Bir tabak yem aldın. Kuşlar etrafına toplanıyor...', 2200);
      }
    });
  }

  /* ---------- her kare ---------- */
  let hidden = false, lastX = ctx.hero.x, lastZ = ctx.hero.z, lastWhoosh = -10;

  ctx.onUpdate((dt, t) => {
    if (dt > 0.2) dt = 0.2;
    const hx = ctx.hero.x, hz = ctx.hero.z;
    let hsp = 0;
    if (dt > 0.0001) hsp = Math.hypot(hx - lastX, hz - lastZ) / dt;
    lastX = hx; lastZ = hz;
    if (hsp > 20) hsp = 20;

    for (let f = 0; f < FLOCKS.length; f++){
      if (feedT[f] <= 0) continue;
      feedT[f] -= dt;
      if (feedT[f] <= 0){
        feedT[f] = 0;
        ctx.ui.toast('Yem bitti; güvercinler dağılıyor');
      }
    }

    const hide = ctx.W.night > 0.6 || ctx.W.rain > 0.5;
    if (hide !== hidden){
      hidden = hide;
      bodyMesh.visible = !hide; wingMesh.visible = !hide; neckMesh.visible = !hide;
      bodyMesh.count = hide ? 0 : N;
      wingMesh.count = hide ? 0 : N * 2;
      neckMesh.count = hide ? 0 : N;
    }
    if (hide) return;

    for (let f = 0; f < FLOCKS.length; f++){
      const F = FLOCKS[f];
      const cdx = hx - F.x, cdz = hz - F.z;
      if (cdx * cdx + cdz * cdz > 8100) continue;      // 90 m uzağındaki sürüyü güncelleme
      const feeding = feedT[f] > 0;

      for (let i = fstart[f]; i < fend[f]; i++){
        let pitch = 0, roll = 0, flap = -1.0;

        if (bs[i] === 0){
          const dx = hx - bx[i], dz = hz - bz[i], d2 = dx * dx + dz * dz;
          const hizli = hsp > 4.6 && d2 < 12.25;   // yürüyüş 3.4, koşu 6.4 m/sn: yalnız koşana kaçarlar
          if (hizli || (!feeding && d2 < 2.56)) urkut(i, f, t);
        }

        if (bs[i] === 1){
          bt[i] -= dt;
          bai[i] += bdi[i] * bsp[i] * dt;
          const nx = F.x + Math.sin(bai[i]) * bri[i];
          const nz = F.z + Math.cos(bai[i]) * bri[i];
          const ty = env.Hs(nx, nz) + bhi[i] + Math.sin(bph[i] * 0.8) * 0.35;
          by[i] += (ty - by[i]) * Math.min(1, dt * 2.2);
          bx[i] = nx; bz[i] = nz;
          byaw[i] = bai[i] + bdi[i] * Math.PI / 2;
          bph[i] += dt * 20;
          flap = Math.sin(bph[i]); pitch = -0.18; roll = bdi[i] * 0.28;
          if (bt[i] <= 0) iniseGec(i, f);
        } else if (bs[i] === 2){
          bt[i] += dt;
          const k = Math.min(1, bt[i] / bldur[i]);
          const s = k * k * (3 - 2 * k);
          bx[i] = blx[i] + (btx[i] - blx[i]) * s;
          bz[i] = blz[i] + (btz[i] - blz[i]) * s;
          const gy = env.Hs(bx[i], bz[i]);
          by[i] = bly[i] * (1 - s) + gy * s + Math.sin(s * Math.PI) * 0.6;
          byaw[i] = Math.atan2(btx[i] - blx[i], btz[i] - blz[i]);
          bph[i] += dt * 7;
          flap = Math.sin(bph[i]) * 0.55; pitch = 0.14;
          if (k >= 1){
            bs[i] = 0; bmode[i] = 0; bt[i] = 0.8 + ctx.rnd() * 2.2;
            by[i] = gy; bpec[i] = ctx.rnd() * TAU;
          }
        } else if (feeding){
          const ang = i * 2.399963, ring = 1.2 + (i % 7) * 0.3;
          let tx = hx + Math.sin(ang) * ring, tz = hz + Math.cos(ang) * ring;
          const gecerli = env.landG(tx, tz) && env.onLand(tx, tz) && !env.occ.has(env.cell(tx, tz));
          if (!gecerli){ tx = bx[i]; tz = bz[i]; }
          const dx = tx - bx[i], dz = tz - bz[i], dd = Math.hypot(dx, dz);
          if (dd > 0.24){
            const stp = Math.min(dd, 2.1 * dt);
            bx[i] += dx / dd * stp; bz[i] += dz / dd * stp;
            byaw[i] = Math.atan2(dx, dz);
            bpec[i] += dt * 8;
            pitch = Math.sin(bpec[i]) * 0.06;
          } else {
            byaw[i] = Math.atan2(hx - bx[i], hz - bz[i]);
            bpec[i] += dt * 5;
            pitch = Math.max(0, Math.sin(bpec[i])) * 0.85;
          }
          by[i] = env.Hs(bx[i], bz[i]);
        } else {
          bt[i] -= dt;
          if (bt[i] <= 0){
            if (bmode[i] === 1){ bmode[i] = 0; bt[i] = 1.0 + ctx.rnd() * 2.2; }
            else { bmode[i] = 1; bt[i] = 0.6 + ctx.rnd() * 1.4; yerYuru(i, f); }
          }
          if (bmode[i] === 1){
            const dx = btx[i] - bx[i], dz = btz[i] - bz[i], dd = Math.hypot(dx, dz);
            if (dd > 0.12){
              const stp = Math.min(dd, 0.38 * dt);
              bx[i] += dx / dd * stp; bz[i] += dz / dd * stp;
              byaw[i] = Math.atan2(dx, dz);
            } else { bmode[i] = 0; bt[i] = 1.0 + ctx.rnd() * 2.2; }
            bph[i] += dt * 9;
            pitch = Math.sin(bph[i]) * 0.06;
          } else {
            bpec[i] += dt * 4.5;
            pitch = Math.max(0, Math.sin(bpec[i])) * 0.85;
          }
          by[i] = env.Hs(bx[i], bz[i]);
        }

        otur(i, pitch, roll, flap);
      }
    }

    bodyMesh.instanceMatrix.needsUpdate = true;
    wingMesh.instanceMatrix.needsUpdate = true;
    neckMesh.instanceMatrix.needsUpdate = true;
  });
}
