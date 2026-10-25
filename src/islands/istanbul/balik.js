// Eminönü balık-ekmek tekneleri, Galata Köprüsü'nde olta oyunu ve Boğaz'da atlayan yunuslar.
// Tekneler kendi sallanan gruplarında; sabit tabure, masa ve kovalar bölge grubunda birleşir.
export function buildBalik(ctx, env){
  if (!env || !env.Hs || !env.reg) return;
  buildTekneler(ctx, env);
  buildOlta(ctx, env);
  buildYunuslar(ctx, env);
}

/* ================= Eminönü balık-ekmek tekneleri ================= */

// kıyıdan suya doğru (kuzeye) ilerleyip ilk su noktasını bulur
function waterBelow(env, x, z){
  let k = 0;
  while (k < 80 && env.onLand(x, z)){ z -= 1; k++; }
  return z;
}

// sudan karaya doğru (güneye) ilerleyip kıyıdan birkaç metre içerideki noktayı bulur
function landAbove(env, x, zw){
  let z = zw + 1;
  for (let k = 0; k < 80; k++, z += 1){
    if (env.onLand(x, z) && env.inland(x, z, 1.0)) return z;
  }
  return null;
}

function buildTekneler(ctx, env){
  const { THREE, kit, root, rnd } = ctx;
  const store = env.store;
  const SEA = env.SEA_Y;
  const baseY = SEA - 0.12;

  const hullM = kit.mat(0xa8332a, {roughness:0.55});
  const greenM = kit.mat(0x2a6a4a, {roughness:0.6});
  const woodM = kit.mat(0xd9b98a, {roughness:0.82});
  const poleM = kit.darkWood;
  const coalM = new THREE.MeshStandardMaterial({color:0xff8a3a, emissive:0xff4a12, emissiveIntensity:1.1, roughness:0.9});

  // tekne gövdesi: üstten bakışta sivri baş, düz kıç; yukarı doğru ekstrüde
  const hullGeo = (() => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.95, 1.9);
    sh.lineTo(-0.95, -0.9);
    sh.lineTo(-0.62, -1.95);
    sh.lineTo(0, -2.55);
    sh.lineTo(0.62, -1.95);
    sh.lineTo(0.95, -0.9);
    sh.lineTo(0.95, 1.9);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {depth:0.88, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.05, bevelSegments:1, steps:1, curveSegments:4});
    g.rotateX(-Math.PI / 2);
    return g;
  })();
  const deckGeo = new THREE.BoxGeometry(1.52, 0.08, 3.5);
  const sternGeo = new THREE.BoxGeometry(1.3, 0.24, 0.8);
  const bowGeo = new THREE.BoxGeometry(0.9, 0.24, 0.7);
  const bandGeo = new THREE.BoxGeometry(0.05, 0.26, 3.7);
  const railGeo = new THREE.BoxGeometry(0.06, 0.06, 3.9);
  const tentPoleGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.34, 6);
  const canopyGeo = new THREE.BoxGeometry(1.8, 0.08, 2.15);
  const valanceGeo = new THREE.BoxGeometry(1.8, 0.16, 0.05);
  const grillGeo = new THREE.BoxGeometry(0.82, 0.2, 0.5);
  const coalGeo = new THREE.BoxGeometry(0.72, 0.06, 0.42);
  const crateGeo = new THREE.BoxGeometry(0.5, 0.3, 0.4);

  const spots = [[-138, -52], [-150, -53], [-162, -54]];
  const boats = [], smokeX = [], smokeZ = [], smokeY = [];
  let midShore = null, midX = spots[1][0];

  for (let i = 0; i < spots.length; i++){
    const x = spots[i][0], zw = waterBelow(env, spots[i][0], spots[i][1]);
    const z = zw - 2.5;   // gövde kıyı duvarına değmesin
    const g = new THREE.Group();
    g.userData.dyn = true;
    g.name = 'Balık teknesi ' + (i + 1);
    g.rotation.order = 'YXZ';
    g.rotation.y = Math.PI / 2;
    g.position.set(x, baseY, z);
    root.add(g);

    kit.add(hullGeo, hullM, 0, 0, 0, g);
    kit.add(deckGeo, woodM, 0, 0.8, 0.15, g);
    kit.add(sternGeo, woodM, 0, 0.94, -1.55, g);
    kit.add(bowGeo, woodM, 0, 0.94, 1.75, g);
    [-1, 1].forEach(s => {
      kit.add(bandGeo, greenM, s * 0.93, 0.6, 0.05, g);
      kit.add(railGeo, kit.gold, s * 0.96, 0.9, 0.05, g);
      [-0.9, 0.9].forEach(pz => kit.add(tentPoleGeo, poleM, s * 0.72, 1.55, pz, g));
    });
    // kırmızı tente ve altın saçak
    kit.add(canopyGeo, hullM, 0, 2.22, 0, g);
    [-1.05, 1.05].forEach(pz => kit.add(valanceGeo, kit.gold, 0, 2.12, pz, g));
    // ızgara ve közler
    kit.add(grillGeo, poleM, 0.25, 0.95, 0.4, g);
    kit.add(coalGeo, coalM, 0.25, 1.07, 0.4, g);
    // balık kasası
    kit.add(crateGeo, poleM, -0.35, 0.97, -0.35, g);

    // duman kaynağının dünya konumu (tekne yalpalaması ihmal edilir)
    const cs = Math.cos(Math.PI / 2), sn = Math.sin(Math.PI / 2);
    smokeX.push(x + 0.25 * cs + 0.4 * sn);
    smokeZ.push(z - 0.25 * sn + 0.4 * cs);
    smokeY.push(baseY + 1.12);

    boats.push({g, phase:i * 1.7, y:baseY});

    // kıyıdaki balıkçı: kıyıdan ~2 m içeride
    const zl = landAbove(env, x, zw);
    if (zl !== null){
      const y = env.Hs(x, zl);
      const coat = [0x3a4a3a, 0x4a3a2a, 0x2a3a4a][i % 3];
      const fig = env.adam({coat, hat:'kasket', apron:true});
      if (i === 0){
        const yasar = async () => {
          const pick = await ctx.ui.dialog([{name:'Balık-Ekmekçi Yaşar Reis', text:'Hoş geldin! Haliç\'in ortasında, teknede pişen balık-ekmeğin kokusu buraya kadar gelir. Bir tane ister misin?', choices:['Bir balık-ekmek ver', 'Sağ ol, sonra']}]);
          if (pick === 0){
            ctx.sfx('coin');
            store.balikEkmek = (store.balikEkmek || 0) + 1;
            ctx.save();
            await ctx.ui.say('Balık-Ekmekçi Yaşar Reis', 'Afiyet olsun! Balık bugün tutuldu, ekmek taze, limon da bol. Kıyıya otur, martılarla paylaşma ama!');
          } else {
            await ctx.ui.say('Balık-Ekmekçi Yaşar Reis', 'Canın sağ olsun. Tekneler akşama kadar burada; kokusu seni yine getirir.');
          }
        };
        env.npcAt(fig, x, zl, Math.PI, 'Balık-Ekmekçi Yaşar Reis', yasar, y);
      } else {
        const lines = i === 1
          ? ['Haliç\'in suyu sabah erkenden gümüş gibi parlar. Tekneler ızgarayı yakınca bütün kıyı kokar, dayanamazsın.', 'Uskumru mevsimi gelince bu tekneler sabaha kadar çalışır. Soğan, marul, limon... Hepsi taze olacak, yoksa balık-ekmek olmaz.']
          : ['Martılar bizden akıllı; ekmek kırıntısı nereye düşse ilk onlar görür. Ama ızgaranın kokusunu da bizden önce alırlar.', 'Balık-ekmek iki parmakla yenir, peçete de arkadan gelir. Afiyet olsun, limonu sıkarken gözüne kaçırmayasın!'];
        const ad = i === 1 ? 'Balıkçı Salih' : 'Balıkçı Nuri';
        env.npcAt(fig, x, zl, Math.PI, ad, env.say(ad, lines), y);
      }

      // her balıkçının önüne iki alçak tabure ve bir alçak masa
      const G = env.reg(x, zl + 3);
      const tx = x + 1.4, tz = zl + 3, ty = env.Hs(tx, tz);
      kit.add(new THREE.BoxGeometry(1.0, 0.06, 0.72), woodM, tx, ty + 0.7, tz, G);
      kit.add(new THREE.CylinderGeometry(0.05, 0.06, 0.68, 6), poleM, tx, ty + 0.34, tz, G);
      ctx.C.circle(tx, tz, 0.62).low = true;
      [[-0.55, 0], [0.55, 0]].forEach(([sx]) => {
        const px = tx + sx, pz = tz + 0.75, py = env.Hs(px, pz);
        kit.add(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 10), woodM, px, py + 0.44, pz, G);
        kit.add(new THREE.CylinderGeometry(0.05, 0.06, 0.44, 6), poleM, px, py + 0.22, pz, G);
        ctx.C.circle(px, pz, 0.24).low = true;
      });
    }
    if (i === 1) midShore = zl;
  }

  // tabela: orta teknenin kıyısında bir direk üstünde
  if (midShore !== null){
    const sx = midX + 2.3, sz = midShore + 0.4, sy = env.Hs(sx, sz);
    const G = env.reg(sx, sz);
    kit.add(new THREE.BoxGeometry(0.12, 2.5, 0.12), poleM, sx, sy + 1.25, sz, G);
    kit.signBoard('BALIK EKMEK', sx, sy + 2.55, sz, 0, 3, G);
    ctx.C.circle(sx, sz, 0.2).low = true;
  }

  /* ---------- ortak duman: en fazla 90 parçacık ---------- */
  const SN = 90;
  const sPos = new Float32Array(SN * 3);
  const sCol = new Float32Array(SN * 3);
  const sLife = new Float32Array(SN);
  const sMax = new Float32Array(SN);
  const sBoat = new Uint8Array(SN);
  const sDx = new Float32Array(SN);
  const sDz = new Float32Array(SN);
  const sH = new Float32Array(SN);
  const sPh = new Float32Array(SN);
  for (let i = 0; i < SN; i++){
    sBoat[i] = i % boats.length;
    sDx[i] = (rnd() - 0.5) * 0.45;
    sDz[i] = (rnd() - 0.5) * 0.45;
    sH[i] = 1.4 + rnd() * 1.3;
    sPh[i] = rnd() * Math.PI * 2;
    sMax[i] = 2.2 + rnd() * 1.6;
    sLife[i] = rnd() * sMax[i];
    sPos[i * 3 + 1] = -100;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3).setUsage(THREE.DynamicDrawUsage));
  const sMat = new THREE.PointsMaterial({color:0xffffff, size:0.34, vertexColors:true, transparent:true, opacity:0.5, depthWrite:false, sizeAttenuation:true});
  const smoke = new THREE.Points(sGeo, sMat);
  smoke.frustumCulled = false;
  root.add(smoke);

  ctx.onUpdate((dt, t) => {
    const d = Math.min(Math.max(dt, 0), 0.08);
    for (let i = 0; i < boats.length; i++){
      const b = boats[i];
      b.g.position.y = b.y + Math.sin(t * 1.05 + b.phase) * 0.045;
      b.g.rotation.z = Math.sin(t * 0.85 + b.phase) * 0.05;
    }
    for (let i = 0; i < SN; i++){
      sLife[i] += d;
      if (sLife[i] >= sMax[i]) sLife[i] = 0;
      const u = sLife[i] / sMax[i], b = sBoat[i], k = i * 3;
      sPos[k] = smokeX[b] + sDx[i] * (0.25 + u * 1.3) + Math.sin(t * 0.8 + sPh[i]) * 0.12 * u;
      sPos[k + 1] = smokeY[b] + u * sH[i];
      sPos[k + 2] = smokeZ[b] + sDz[i] * (0.25 + u * 1.3) + Math.cos(t * 0.7 + sPh[i]) * 0.12 * u;
      const c = 0.56 + u * 0.3;
      sCol[k] = c; sCol[k + 1] = c + 0.01; sCol[k + 2] = c + 0.02;
    }
    sGeo.attributes.position.needsUpdate = true;
    sGeo.attributes.color.needsUpdate = true;
  });

  if (midShore !== null) ctx.place({id:'balikekmek', name:'Eminönü Balık-Ekmek Tekneleri', x:midX, z:midShore, r:14});
}

/* ================= Galata Köprüsü'nde olta ================= */

const FISH = [
  {k:'istavrit', ad:'İstavrit', w:40},
  {k:'hamsi', ad:'Hamsi', w:25},
  {k:'izmarit', ad:'İzmarit', w:15},
  {k:'lufer', ad:'Lüfer', w:8},
  {k:'palamut', ad:'Palamut', w:7},
  {k:'sise', ad:'Eski şişe', w:5},
];

function totalBalik(store){
  const b = store.balik;
  if (!b) return 0;
  let n = 0;
  for (let i = 0; i < FISH.length; i++){
    if (FISH[i].k === 'sise') continue;   // şişe balık sayılmaz
    n += b[FISH[i].k] || 0;
  }
  return n;
}

function buildOlta(ctx, env){
  const { THREE, kit, root, rnd } = ctx;
  const store = env.store;
  if (!store.balik || typeof store.balik !== 'object') store.balik = {};
  for (let i = 0; i < FISH.length; i++) if (typeof store.balik[FISH[i].k] !== 'number') store.balik[FISH[i].k] = 0;

  const GKb = env.bridges && env.bridges.galata;
  if (!GKb || !GKb.h) return;
  const deckY = (z) => GKb.h((z + 30) / -80);
  const spots = [[-57.2, -45], [-57.2, -72], [-66.8, -52], [-66.8, -97]];
  const bucketM = kit.mat(0x8a9aa2, {roughness:0.65, metalness:0.2});

  const rods = [];
  const linePos = new Float32Array(spots.length * 2 * 3);
  const lineGeo = new THREE.BufferGeometry();

  for (let i = 0; i < spots.length; i++){
    const x = spots[i][0], z = spots[i][1], y = deckY(z);
    const s = x > -62 ? 1 : -1;

    const g = new THREE.Group();
    g.userData.dyn = true;
    g.position.set(x, y, z);
    root.add(g);

    // korkuluğun üstüne yaslanmış ince uzun olta, ucu suya doğru
    const bx = s * 0.65, by = 0.98, bz = 0.45;
    const tx = s * 3.0, ty = 0.3, tz = 1.0;
    const dx = tx - bx, dy = ty - by, dz = tz - bz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const rodGeo = new THREE.CylinderGeometry(0.012, 0.032, len, 5);
    rodGeo.translate(0, len / 2, 0);
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    rodGeo.applyQuaternion(q);
    rodGeo.translate(bx, by, bz);
    kit.add(rodGeo, kit.darkWood, 0, 0, 0, g, false);

    // misina: uçtan suya (dört olta için tek LineSegments)
    const k = i * 6;
    linePos[k] = x + tx; linePos[k + 1] = y + ty; linePos[k + 2] = z + tz;
    linePos[k + 3] = x + s * 3.15; linePos[k + 4] = env.SEA_Y - 0.02; linePos[k + 5] = z + tz + 0.1;

    // yanında küçük kova
    const bxk = x - s * 0.7, bzk = z + 1.15, byk = deckY(bzk);
    const G = env.reg(bxk, bzk);
    kit.add(new THREE.CylinderGeometry(0.22, 0.18, 0.34, 10), bucketM, bxk, byk + 0.17, bzk, G);
    ctx.C.circle(bxk, bzk, 0.24).low = true;

    rods.push({x, z, g, st:'idle', tt:0, wait:0});
  }

  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const line = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({color:0xd6d6cc, transparent:true, opacity:0.55}));
  line.frustumCulled = false;
  root.add(line);

  const start = (i) => {
    const o = rods[i];
    if (o.st !== 'idle') return;
    o.st = 'bekliyor'; o.tt = 0; o.wait = 2.5 + rnd() * 4.5;
    ctx.ui.toast('Misina suda… sabırla bekle', 2000);
  };

  const catchFish = async () => {
    let roll = rnd() * 100, pick = FISH[0];
    for (let i = 0; i < FISH.length; i++){
      if (roll < FISH[i].w){ pick = FISH[i]; break; }
      roll -= FISH[i].w;
    }
    store.balik[pick.k] = (store.balik[pick.k] || 0) + 1;
    ctx.save();
    if (pick.k === 'lufer') ctx.sfx('quest');
    else ctx.sfx('chime');
    if (pick.k === 'sise'){
      ctx.ui.toast('Şişeyi açtın… içinden bir not çıktı', 2400);
      await ctx.ui.dialog([
        {name:'Eski şişe', text:'Şişenin içinde sararmış bir kâğıt var: "1903, Haliç. Bugün ilk defa babamla olta attım. Bir istavrit tuttu ama benimki daha büyüktü! Bu şişeyi denize bırakıyorum; bulan bana bir gülümseme borçlu." — Denizci bir çocuk.'},
        {name:'Eski şişe', text:'Kâğıdı dikkatle katlayıp cebine koyuyorsun. Yüz yıldan fazla olmuş; çocuk artık büyümüş ama gülümseme hâlâ duruyor.'},
      ]);
      return;
    }
    ctx.ui.toast(pick.ad + ' tuttun! (toplam ' + store.balik[pick.k] + ')', 2400);
  };

  const pull = (i) => {
    const o = rods[i];
    if (o.st !== 'vurdu') return;
    o.st = 'idle'; o.tt = 0; o.g.rotation.z = 0;
    catchFish();
  };

  for (let i = 0; i < rods.length; i++){
    const o = rods[i];
    ctx.interact(o.x, o.z, 'Olta at', () => start(i), 2.2, () => o.st === 'idle');
    ctx.interact(o.x, o.z, 'Çek!', () => pull(i), 2.2, () => o.st === 'vurdu');
  }

  // Yem satıcısı: köprünün ortasında, mevcut oltacıların uzağında
  {
    const x = -57.5, z = -64, y = deckY(z);
    const bayram = async () => {
      const b = store.balik;
      const n = totalBalik(store);
      ctx.sfx('chime');
      if (n === 0){
        await ctx.ui.say('Yem Satıcısı Bayram Amca', 'Önce bir olta at bakalım! Kovalar boş, misinalar kuru. Sabırlı ol; balık da seni bekler.');
      } else if (n > 10){
        await ctx.ui.say('Yem Satıcısı Bayram Amca', 'Sen artık köprünün ustasısın! Bu köprüde senden çok balık tutan yok. Bir gün bana da öğret.');
      } else {
        await ctx.ui.say('Yem Satıcısı Bayram Amca', 'Aha, kovan boş değil! ' + n + ' balık… Fena değil. Akşamüstü akıntı döner, o zaman istavrit sürüsü geçer.');
      }
      if (b && b.lufer > 0) await ctx.ui.say('Yem Satıcısı Bayram Amca', 'Lüfer mi tuttun? Aferin sana! O balık köprüde herkese nasip olmaz, maşallah.');
    };
    env.npcAt(env.adam({coat:0x4a5a3a, hat:'kasket'}), x, z, -Math.PI / 2, 'Yem Satıcısı Bayram Amca', bayram, y);
  }

  ctx.onUpdate((dt) => {
    const d = Math.min(Math.max(dt, 0), 0.08);
    const hx = ctx.hero.x, hz = ctx.hero.z;
    for (let i = 0; i < rods.length; i++){
      const o = rods[i];
      const dx = hx - o.x, dz = hz - o.z;
      if (o.st !== 'idle' && dx * dx + dz * dz > 16){
        o.st = 'idle'; o.tt = 0; o.g.rotation.z = 0;
        continue;
      }
      if (o.st === 'bekliyor'){
        o.tt += d;
        if (o.tt >= o.wait){
          o.st = 'vurdu'; o.tt = 0;
          ctx.sfx('blip');
          ctx.ui.toast('Vurdu! Hemen çek! (E)', 2200);
        }
      } else if (o.st === 'vurdu'){
        o.tt += d;
        o.g.rotation.z = Math.sin(o.tt * 34) * 0.045;
        if (o.tt > 1.4){
          o.st = 'idle'; o.tt = 0; o.g.rotation.z = 0;
          ctx.ui.toast('Kaçtı… balık yemi alıp gitti', 2200);
        }
      }
    }
  });
}

/* ================= Boğaz'da yunuslar ================= */

function pickWater(ctx, env, d, cx, cz, rad){
  for (let k = 0; k < 28; k++){
    const a = ctx.rnd() * Math.PI * 2, r = 4 + ctx.rnd() * rad;
    const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
    if (x < 95 || x > 145 || z < -330 || z > -20) continue;
    if (!env.onLand(x, z)){ d.ex = x; d.ez = z; return true; }
  }
  return false;
}

function buildYunuslar(ctx, env){
  const { THREE, kit, root, rnd } = ctx;
  const SEA = env.SEA_Y;

  const bodyGeo = (() => {
    const parts = [];
    const body = new THREE.SphereGeometry(0.5, 12, 10);
    body.scale(0.85, 0.78, 1.9);
    parts.push(body);
    const fin = new THREE.ConeGeometry(0.2, 0.42, 4);
    fin.scale(1, 1, 0.55); fin.translate(0, 0.45, -0.1);
    parts.push(fin);
    [-1, 1].forEach(s => {
      const f = new THREE.ConeGeometry(0.14, 0.38, 4);
      f.scale(1, 1, 0.45); f.rotateZ(s * 1.1); f.translate(s * 0.4, -0.18, 0.25);
      parts.push(f);
    });
    const tail = new THREE.ConeGeometry(0.3, 0.5, 4);
    tail.scale(1, 0.35, 1); tail.rotateX(-Math.PI / 2); tail.translate(0, 0.04, -0.95);
    parts.push(tail);
    const beak = new THREE.ConeGeometry(0.11, 0.34, 6);
    beak.rotateX(Math.PI / 2); beak.translate(0, 0.02, 1.05);
    parts.push(beak);
    return env.mergeBufferGeometries(parts) || body;
  })();
  const dM = kit.mat(0x6a8aa0, {roughness:0.55});

  const centers = [[118, -150], [102, -70], [136, -250], [112, -310]];
  const dolphins = [];
  for (let i = 0; i < centers.length; i++){
    const d = {g:new THREE.Group(), x:0, z:0, sx:0, sz:0, ex:0, ez:0, wait:0, prog:0, jumping:false, ry:0};
    d.g.userData.dyn = true;
    d.g.rotation.order = 'YXZ';
    d.g.visible = false;
    const m = new THREE.Mesh(bodyGeo, dM);
    m.castShadow = true; m.receiveShadow = true;
    d.g.add(m);
    root.add(d.g);
    // ilk su noktası
    d.x = centers[i][0]; d.z = centers[i][1];
    for (let k = 0; k < 28 && env.onLand(d.x, d.z); k++) d.x -= 1;
    d.wait = 8 + rnd() * 12;
    d.g.position.set(d.x, SEA - 0.5, d.z);
    dolphins.push(d);
  }

  /* ---------- ortak su sıçraması: 60 parçacık ---------- */
  const PN = 60;
  const pPos = new Float32Array(PN * 3);
  const pvx = new Float32Array(PN);
  const pvy = new Float32Array(PN);
  const pvz = new Float32Array(PN);
  const pLife = new Float32Array(PN);
  for (let i = 0; i < PN; i++) pPos[i * 3 + 1] = -100;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.PointsMaterial({color:0xdff2f7, size:0.18, transparent:true, opacity:0.85, depthWrite:false});
  const splash = new THREE.Points(pGeo, pMat);
  splash.frustumCulled = false;
  root.add(splash);

  const burst = (x, z, n) => {
    let made = 0;
    for (let i = 0; i < PN && made < n; i++){
      if (pLife[i] > 0) continue;
      pLife[i] = 0.35 + rnd() * 0.4;
      pPos[i * 3] = x + (rnd() - 0.5) * 0.5;
      pPos[i * 3 + 1] = SEA + 0.05;
      pPos[i * 3 + 2] = z + (rnd() - 0.5) * 0.5;
      pvx[i] = (rnd() - 0.5) * 2.4;
      pvy[i] = 1.4 + rnd() * 1.9;
      pvz[i] = (rnd() - 0.5) * 2.4;
      made++;
    }
  };

  ctx.onUpdate((dt) => {
    const d = Math.min(Math.max(dt, 0), 0.08);
    const hx = ctx.hero.x, hz = ctx.hero.z;

    for (let i = 0; i < dolphins.length; i++){
      const o = dolphins[i];
      const ddx = hx - o.x, ddz = hz - o.z;
      if (ddx * ddx + ddz * ddz > 14400) continue;   // 120 m'den uzakta güncelleme yok

      if (!o.jumping){
        o.wait -= d;
        if (o.wait <= 0){
          o.sx = o.x; o.sz = o.z;
          if (pickWater(ctx, env, o, o.x, o.z, 12)){
            o.ry = Math.atan2(o.ex - o.sx, o.ez - o.sz);
            o.jumping = true; o.prog = 0;
            o.g.visible = true;
            burst(o.sx, o.sz, 9);
          } else o.wait = 2;
        }
      } else {
        o.prog += d / 1.2;
        const u = Math.min(1, o.prog);
        const x = o.sx + (o.ex - o.sx) * u, z = o.sz + (o.ez - o.sz) * u;
        o.g.position.set(x, SEA + Math.sin(Math.PI * u) * 2.0, z);
        o.g.rotation.y = o.ry;
        o.g.rotation.x = -Math.cos(Math.PI * u) * 0.55;
        if (o.prog >= 1){
          o.jumping = false;
          o.g.visible = false;
          o.x = o.ex; o.z = o.ez;
          o.wait = 8 + rnd() * 12;
          burst(o.x, o.z, 13);
        }
      }
    }

    for (let i = 0; i < PN; i++){
      if (pLife[i] <= 0) continue;
      pLife[i] -= d;
      if (pLife[i] <= 0){ pPos[i * 3 + 1] = -100; continue; }
      const k = i * 3;
      pPos[k] += pvx[i] * d;
      pPos[k + 1] += pvy[i] * d;
      pPos[k + 2] += pvz[i] * d;
      pvy[i] -= 7 * d;
      if (pPos[k + 1] < SEA){ pPos[k + 1] = -100; pLife[i] = 0; }
    }
    pGeo.attributes.position.needsUpdate = true;
  });
}
