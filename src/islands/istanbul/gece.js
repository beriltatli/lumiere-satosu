// İstanbul gecesi: Boğaziçi Köprüsü ışıkları, Kız Kulesi feneri ve Boğaz'da havai fişek.
// Yalnız gece çalışır; kare başına yeni nesne üretmez, ışıklar InstancedMesh ve tek Points havuzundadır.

const BZ = {x0:30, x1:182, z:-400, w:12};   // island.js: Boğaziçi Köprüsü güvertesi
const BZ_TX = [62, 154], BZ_TH = 36;        // island.js: kule x'leri ve yüksekliği
const BZ_KZ = 6.6;                          // island.js: kule ayakları ve asma kablolar z = -400 ± 6.6
const DUBA = {x:112, z:-175};               // Boğaz'daki fişek dubası

/* ================= 1) Boğaziçi ve Galata köprüsü ışıkları ================= */
function buildKopruIsiklari(ctx, env){
  const T = ctx.THREE, keep = env.keep;
  const BZb = env.bridges && env.bridges.bogazici;
  const kabloVar = !!(BZb && typeof BZb.h === 'function');
  const gvH = kabloVar ? BZb.h : () => 7.5;
  const m4 = new T.Matrix4(), v3 = new T.Vector3(), q4 = new T.Quaternion(), s3 = new T.Vector3(1, 1, 1);
  const renk = new T.Color();

  // iki sıra: asma kablo eğrisi boyunca 3 m aralıkla; kablo yoksa güverte kenarının 0.6 m üstü
  const px = [], py = [], pz = [], pn = [];
  for (let s = -1; s <= 1; s += 2){
    const z = BZ.z + s * BZ_KZ;
    for (let x = BZ.x0; x <= BZ.x1 + 0.01; x += 3){
      let y;
      if (!kabloVar) y = gvH((x - BZ.x0) / (BZ.x1 - BZ.x0)) + 0.6;
      else if (x < BZ_TX[0]){ const h0 = env.Hs(BZ.x0 - 10, z); y = h0 + 1 + (BZ_TH - 4 - h0) * Math.pow((x - (BZ.x0 - 10)) / (BZ_TX[0] - BZ.x0 + 10), 1.4); }
      else if (x > BZ_TX[1]){ const h1 = env.Hs(BZ.x1 + 10, z); y = h1 + 1 + (BZ_TH - 4 - h1) * Math.pow(((BZ.x1 + 10) - x) / (BZ.x1 + 10 - BZ_TX[1]), 1.4); }
      else { const u = (x - BZ_TX[0]) / (BZ_TX[1] - BZ_TX[0]); y = BZ_TH - 2 - (BZ_TH - 14) * 4 * u * (1 - u); }
      px.push(x); py.push(y); pz.push(z); pn.push((x - BZ.x0) / (BZ.x1 - BZ.x0));
    }
  }
  // kulelerin tepesi (iki ayak)
  for (let i = 0; i < BZ_TX.length; i++) for (let s = -1; s <= 1; s += 2){
    px.push(BZ_TX[i]); py.push(BZ_TH - 1.2); pz.push(BZ.z + s * BZ_KZ);
    pn.push((BZ_TX[i] - BZ.x0) / (BZ.x1 - BZ.x0));
  }

  const nokta = new T.SphereGeometry(0.34, 6, 5);
  const kopru = new T.InstancedMesh(nokta, new T.MeshBasicMaterial({color:0xffffff, toneMapped:false}), px.length);
  for (let i = 0; i < px.length; i++){
    m4.compose(v3.set(px[i], py[i], pz[i]), q4, s3);
    kopru.setMatrixAt(i, m4);
    let f = (pn[i] * 0.85) % 1;
    kopru.setColorAt(i, renk.setHSL(0.62 + f * 0.5, 0.9, 0.55).convertSRGBToLinear());
  }
  kopru.instanceMatrix.needsUpdate = true;
  kopru.instanceColor.needsUpdate = true;
  kopru.frustumCulled = false;
  kopru.visible = false;
  keep(kopru); ctx.root.add(kopru);

  // Galata Köprüsü korkulukları: sabit sıcak sarı, 4 m aralıkla
  let galata = null;
  const GK = env.bridges && env.bridges.galata;
  if (GK && typeof GK.h === 'function'){
    const gx = [], gy = [], gz = [];
    for (let s = -1; s <= 1; s += 2){
      const x = -62 + s * 5.4;
      for (let z = -30; z >= -110; z -= 4){ gx.push(x); gy.push(GK.h((z + 30) / -80) + 0.95); gz.push(z); }
    }
    galata = new T.InstancedMesh(nokta, new T.MeshBasicMaterial({color:0xffbe6a, toneMapped:false}), gx.length);
    for (let i = 0; i < gx.length; i++){
      m4.compose(v3.set(gx[i], gy[i], gz[i]), q4, s3);
      galata.setMatrixAt(i, m4);
    }
    galata.instanceMatrix.needsUpdate = true;
    galata.frustumCulled = false;
    galata.visible = false;
    keep(galata); ctx.root.add(galata);
  }

  const sayi = px.length;
  let acc = 0;
  ctx.onUpdate((dt, t) => {
    const gece = ctx.W.night > 0.45;
    kopru.visible = gece;
    if (galata) galata.visible = gece;
    if (!gece) return;
    acc += dt;
    if (acc < 1 / 15) return;          // en fazla saniyede 15 renk güncellemesi
    acc = 0;
    const hx = ctx.hero.x - (BZ.x0 + BZ.x1) / 2, hz = ctx.hero.z - BZ.z;
    if (hx * hx + hz * hz > 400 * 400) return;   // oyuncu 400 m'den uzaksa renk akışı durur
    for (let i = 0; i < sayi; i++){
      let f = (pn[i] * 0.85 - t * 0.055) % 1;
      if (f < 0) f += 1;
      renk.setHSL((0.62 + f * 0.5) % 1, 0.9, 0.55).convertSRGBToLinear();
      kopru.setColorAt(i, renk);
    }
    kopru.instanceColor.needsUpdate = true;
  });
}

/* ================= 2) Kız Kulesi feneri ================= */
function buildKizFeneri(ctx, env){
  const T = ctx.THREE, keep = env.keep;
  const lm = env.LM.kizkulesi;
  let boy = 26.6 * (lm[3] || 1);        // landmarks.js: yerel tepe (alemle) × ölçek

  // Sahnede yapı ölçeklenmemişse gerçek tepesini ölç: fener duvarın içinde kalmasın
  if (ctx.root && ctx.root.children){
    const kutu = new T.Box3();
    for (let i = 0; i < ctx.root.children.length; i++){
      const g = ctx.root.children[i];
      if (!g.isGroup || Math.abs(g.position.x - lm[0]) > 2 || Math.abs(g.position.z - lm[1]) > 2) continue;
      kutu.setFromObject(g);
      if (kutu.max.y > boy) boy = kutu.max.y;
    }
  }

  const x = lm[0], z = lm[1], y = boy - 1.3;

  // yanıp sönen kırmızı fener
  const kirmizi = new T.Mesh(new T.SphereGeometry(0.42, 8, 6), new T.MeshBasicMaterial({color:0xff2a1a, toneMapped:false}));
  kirmizi.position.set(x, y, z);
  kirmizi.visible = false;
  keep(kirmizi); ctx.root.add(kirmizi);

  const isik = new T.PointLight(0xffd0a0, 0, 30, 2);
  isik.position.set(x, y + 0.5, z);
  isik.visible = false;
  ctx.root.add(isik);

  // yavaş dönen huzme: ucu fenerde, 60 m uzunluğunda açık koni
  const huzme = new T.Group();
  huzme.position.set(x, y, z);
  const koni = new T.ConeGeometry(6, 60, 24, 1, true);
  koni.rotateX(-Math.PI / 2);
  koni.translate(0, 0, 30);             // tepe (uç) yerel sıfırda, ağız +z'ye bakar
  const hzM = new T.MeshBasicMaterial({color:0xfff0c8, transparent:true, opacity:0.12, depthWrite:false,
    blending:T.AdditiveBlending, side:T.DoubleSide, toneMapped:false});
  const hzMesh = new T.Mesh(koni, hzM);
  keep(hzMesh); huzme.add(hzMesh);
  huzme.visible = false;
  ctx.root.add(huzme);

  ctx.onUpdate((dt, t) => {
    const gece = ctx.W.night > 0.45;
    huzme.visible = gece;
    kirmizi.visible = gece && (t % 1.2) < 0.6;   // 1,2 sn'lik yanıp sönme
    isik.visible = gece;
    isik.intensity = gece ? 1.2 : 0;
    if (gece) huzme.rotation.y = t * (Math.PI * 2 / 10);   // 10 sn'de bir tur
  });
}

/* ================= 3) Boğaz'da havai fişek ================= */
function buildHavaiFisek(ctx, env){
  if (env.onLand(DUBA.x, DUBA.z)) return;    // duba karaya oturmuşsa gösteriyi kurma

  const T = ctx.THREE, kit = ctx.kit, keep = env.keep, rnd = ctx.rnd, SU = env.SEA_Y;

  // küçük koyu duba: bölge grubuna (birleşir, ek çizim çağrısı getirmez)
  const G = env.reg(DUBA.x, DUBA.z);
  kit.add(new T.BoxGeometry(11, 1.2, 4.5), kit.mat(0x24262a, {roughness:0.7}), DUBA.x, SU + 0.5, DUBA.z, G);
  kit.add(new T.BoxGeometry(2.2, 0.8, 2.2), kit.mat(0x3a3c42, {roughness:0.6}), DUBA.x - 2, SU + 1.4, DUBA.z, G);

  // parçacık havuzu: konum, renk, hız, boy ve ömür dizileri bir kez
  const KAP = 1400;
  const dPos = new Float32Array(KAP * 3);
  const dRenk = new Float32Array(KAP * 3);
  const dCol = new Float32Array(KAP * 3);
  const dHiz = new Float32Array(KAP * 3);
  const dYasam = new Float32Array(KAP);
  const dOmur = new Float32Array(KAP);
  const dBoy = new Float32Array(KAP);
  for (let i = 0; i < KAP; i++) dPos[i * 3 + 1] = -999;

  const pg = new T.BufferGeometry();
  pg.setAttribute('position', new T.BufferAttribute(dPos, 3).setUsage(T.DynamicDrawUsage));
  pg.setAttribute('color', new T.BufferAttribute(dCol, 3).setUsage(T.DynamicDrawUsage));

  // yuvarlak kıvılcım dokusu
  const [cv, g2] = kit.canvas(64, 64);
  const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g2.fillStyle = grad; g2.fillRect(0, 0, 64, 64);

  const pm = new T.PointsMaterial({size:1.6, vertexColors:true, transparent:true, depthWrite:false,
    blending:T.AdditiveBlending, sizeAttenuation:true, toneMapped:false, map:kit.ctex(cv, 1, 1)});
  const noktalar = new T.Points(pg, pm);
  noktalar.frustumCulled = false;
  noktalar.visible = false;
  keep(noktalar); ctx.root.add(noktalar);

  const patlama = new T.PointLight(0xffffff, 0, 220, 2);
  patlama.position.set(DUBA.x, SU + 50, DUBA.z);
  patlama.visible = false;
  ctx.root.add(patlama);

  const geciciRenk = new T.Color();
  const PALET = [0xff2a2a, 0xffc23a, 0x3aff6a, 0x3a8cff, 0xb45aff, 0xffffff];
  const ALTIN = 0xffc23a, BEYAZ = 0xfff4d8;
  let sira = 0;

  // parçacık doğur: havuzdan sırayla, dolunca en eskiyi ezer
  function parca(px, py, pz, vx, vy, vz, hex, omur, boy){
    const i = sira;
    sira = (sira + 1) % KAP;
    const k = i * 3;
    dPos[k] = px; dPos[k + 1] = py; dPos[k + 2] = pz;
    dHiz[k] = vx; dHiz[k + 1] = vy; dHiz[k + 2] = vz;
    geciciRenk.set(hex);
    dRenk[k] = dCol[k] = geciciRenk.r;
    dRenk[k + 1] = dCol[k + 1] = geciciRenk.g;
    dRenk[k + 2] = dCol[k + 2] = geciciRenk.b;
    dYasam[i] = omur; dOmur[i] = omur; dBoy[i] = boy;
  }

  function yakin(x, z, r){
    const dx = ctx.hero.x - x, dz = ctx.hero.z - z;
    return dx * dx + dz * dz < r * r;
  }

  // roketler: 10 yuva yeter (gösteride en çok 10 roket)
  const ROKET = [];
  for (let i = 0; i < 10; i++) ROKET.push({basladi:false, aktif:false, bekle:1e9, t:0, sure:1, iz:0,
    x0:0, y0:0, z0:0, x1:0, y1:0, z1:0});

  let gosteri = false, bekle = 50 + rnd() * 60, sayi = 0;

  function roketBaslat(r){
    r.basladi = true; r.aktif = true; r.t = 0; r.iz = 0;
    r.sure = 1.15 + rnd() * 0.5;
    r.x0 = DUBA.x + (rnd() - 0.5) * 2.4;
    r.z0 = DUBA.z + (rnd() - 0.5) * 2.4;
    r.y0 = SU + 1.2;
    r.x1 = r.x0 + (rnd() - 0.5) * 14;
    r.z1 = r.z0 + (rnd() - 0.5) * 14;
    r.y1 = SU + 40 + rnd() * 30;
    if (yakin(DUBA.x, DUBA.z, 260)) ctx.sfx('whoosh');
  }

  function patlat(x, y, z){
    const adet = 90 + Math.floor(rnd() * 51);
    const ana = PALET[Math.floor(rnd() * PALET.length)];
    for (let i = 0; i < adet; i++){
      const ct = rnd() * 2 - 1, phi = rnd() * Math.PI * 2, st = Math.sqrt(1 - ct * ct);
      const xh = Math.cos(phi) * st, zh = Math.sin(phi) * st;
      const sogut = rnd() < 0.25;                    // söğüt gibi aşağı sarkan altın
      const hiz = sogut ? 2 + rnd() * 2.5 : 8 + rnd() * 9;
      const vy = sogut ? -1.2 - rnd() * 1.6 : ct * hiz;
      parca(x, y, z, xh * hiz, vy, zh * hiz, sogut ? ALTIN : (rnd() < 0.16 ? BEYAZ : ana),
        1.6 + rnd() * 0.8, 1.4 + rnd() * 0.7);
    }
    patlama.position.set(x, y, z);
    patlama.color.set(ana);
    patlama.intensity = 3.4;
    if (yakin(DUBA.x, DUBA.z, 260)) ctx.sfx('drum');
  }

  function gosteriBaslat(){
    if (gosteri) return;
    gosteri = true;
    sayi = 7 + Math.floor(rnd() * 4);
    let bkl = 0.5;
    for (let i = 0; i < ROKET.length; i++){
      const r = ROKET[i];
      r.basladi = false; r.aktif = false; r.t = 0; r.iz = 0;
      r.bekle = i < sayi ? bkl : 1e9;
      if (i < sayi) bkl += 0.35 + rnd() * 0.45;   // roketler arası 0,35–0,8 sn
    }
    if (yakin(DUBA.x, DUBA.z, 300)) ctx.ui.toast('Boğaz\'da havai fişek gösterisi başladı!', 2600);
  }

  function durdur(){
    gosteri = false;
    bekle = 50 + rnd() * 60;
    for (let i = 0; i < ROKET.length; i++){ ROKET[i].basladi = false; ROKET[i].aktif = false; ROKET[i].bekle = 1e9; }
    for (let i = 0; i < KAP; i++){ dYasam[i] = 0; dPos[i * 3 + 1] = -999; }
    pg.attributes.position.needsUpdate = true;
  }

  ctx.interact(208, 62, 'Gösteriyi başlat', () => { gosteriBaslat(); }, 2.8,
    () => ctx.W.night > 0.6 && ctx.W.rain < 0.3 && !gosteri);

  ctx.onUpdate((dt, t) => {
    const uygun = ctx.W.night > 0.6 && ctx.W.rain < 0.3 &&
      ctx.hero.x * ctx.hero.x + ctx.hero.z * ctx.hero.z < 520 * 520;
    if (!uygun){
      noktalar.visible = false;
      patlama.intensity = 0;
      patlama.visible = false;
      if (gosteri) durdur();
      return;
    }
    noktalar.visible = true;

    if (!gosteri){
      bekle -= dt;
      if (bekle <= 0) gosteriBaslat();
    }

    if (gosteri){
      let kalan = false;
      for (let i = 0; i < ROKET.length; i++){
        const r = ROKET[i];
        if (!r.basladi){
          if (i < sayi){ r.bekle -= dt; if (r.bekle <= 0) roketBaslat(r); }
          if (i < sayi && !r.basladi) kalan = true;
          continue;
        }
        if (!r.aktif) continue;
        r.t += dt;
        const u = r.t / r.sure, ym = 1 - (1 - u) * (1 - u);
        const px = r.x0 + (r.x1 - r.x0) * u, pz = r.z0 + (r.z1 - r.z0) * u;
        const py = r.y0 + (r.y1 - r.y0) * ym;
        parca(px, py, pz, 0, 0, 0, BEYAZ, 0.14, 1.1);          // roket başı
        r.iz += dt;
        if (r.iz > 0.045){                                      // kıvılcım izi
          r.iz = 0;
          parca(px + (rnd() - 0.5) * 0.7, py - 0.7 - rnd() * 0.5, pz + (rnd() - 0.5) * 0.7,
            (rnd() - 0.5) * 0.9, -1.5 - rnd() * 1.5, (rnd() - 0.5) * 0.9, ALTIN, 0.3 + rnd() * 0.3, 1.0);
        }
        if (u >= 1){ r.aktif = false; patlat(px, py, pz); }
        else kalan = true;
      }
      if (!kalan){ gosteri = false; bekle = 50 + rnd() * 60; }
    }

    // parçacıklar: yerçekimi, sönme, ölüler y = -999
    for (let i = 0; i < KAP; i++){
      if (dYasam[i] <= 0) continue;
      const k = i * 3;
      dYasam[i] -= dt;
      if (dYasam[i] <= 0){ dPos[k + 1] = -999; dCol[k] = dCol[k + 1] = dCol[k + 2] = 0; continue; }
      dHiz[k + 1] -= 7.5 * dt;
      dHiz[k] *= 0.995; dHiz[k + 2] *= 0.995;
      dPos[k] += dHiz[k] * dt; dPos[k + 1] += dHiz[k + 1] * dt; dPos[k + 2] += dHiz[k + 2] * dt;
      const f = dYasam[i] / dOmur[i];
      dCol[k] = dRenk[k] * f; dCol[k + 1] = dRenk[k + 1] * f; dCol[k + 2] = dRenk[k + 2] * f;
    }
    pg.attributes.position.needsUpdate = true;
    pg.attributes.color.needsUpdate = true;

    if (patlama.intensity > 0){
      patlama.intensity = Math.max(0, patlama.intensity - dt * 11);
      patlama.visible = patlama.intensity > 0.05;
    } else if (patlama.visible) patlama.visible = false;
  });
}

/* ================= dışa aktarılan tek işlev ================= */
export function buildGece(ctx, env){
  buildKopruIsiklari(ctx, env);
  buildKizFeneri(ctx, env);
  buildHavaiFisek(ctx, env);
}
