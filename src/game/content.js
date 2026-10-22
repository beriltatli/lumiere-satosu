// Oyun içeriği: karakterler, rünler, madalyonlar, kule balkonu, Ay Kapısı, güneş saati
import { recolor } from './hero.js';
import { buildMaze } from './maze.js';

export const RUNES = [
  {id:'yakut',   name:'Yakut rün',   color:'#ff2a4a', where:'Fıskiye',          hint:'Fıskiyenin dibinde kırmızı bir ışık parlıyormuş.'},
  {id:'safir',   name:'Safir rün',   color:'#2f7bff', where:'Doğu kulesi',      hint:'Doğu kulesinin balkonunda mavi bir parıltı görülmüş.'},
  {id:'zumrut',  name:'Zümrüt rün',  color:'#22e08a', where:'Labirent',         hint:'Doğudaki çit labirentinin tam kalbinde yeşil bir taş.'},
  {id:'altin',   name:'Altın rün',   color:'#f2c14e', where:'Yüzbaşı Armand',   hint:'Yüzbaşı Armand altın rünü bilmecesini bilene verir.'},
  {id:'ametist', name:'Ametist rün', color:'#b35bff', where:'Ay Kapısı',        hint:'Tapınağın ardındaki Ay Kapısı yalnız geceleri açılır.'},
];
export const COIN_TOTAL = 30;

export function buildContent(world, C, hero, ui, audio, S, hooks){
  const { THREE, scene, materials:M, TEMPLE, CZ } = world;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const interact = [];   // {id, x, z, r, label, show(), act()}
  const markers = [];    // pusula işaretleri: {id, color, label, x, z, show()}

  /* ---------- labirent ---------- */
  const maze = buildMaze(world, C);

  /* ---------- NPC'ler ---------- */
  function npc(x, z, yaw, coatHex, opts = {}){
    const g = world.makeGuard(); g.position.set(x, opts.y || 0, z); g.rotation.y = yaw;
    const coat = new THREE.MeshStandardMaterial({color:coatHex, roughness:0.7}); recolor(g, M.coatMat, coat);
    if (opts.noHalberd) g.userData.armR.children.forEach(c => { if (c.isGroup) c.visible = false; });
    if (opts.legs) recolor(g, M.whiteMat, new THREE.MeshStandardMaterial({color:opts.legs, roughness:0.8}));
    if (opts.hat) recolor(g, M.hatMat, new THREE.MeshStandardMaterial({color:opts.hat, roughness:0.7}));
    if (opts.plume){
      const p = world.part(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshStandardMaterial({color:opts.plume, roughness:0.8}), -0.05, 2.06, -0.04, g);
      p.scale.set(0.6, 3.2, 1.2); p.rotation.set(-0.4, 0, 0.7);
    }
    scene.add(g); C.circle(x, z, 0.45);
    return g;
  }
  const master = npc(-56, 27, 0.6, 0x2a180c, {noHalberd:true, legs:0xcab89a, hat:0x3b2a1c});
  // ahır ustasının önlüğü
  world.part(new THREE.BoxGeometry(0.42, 0.7, 0.02), new THREE.MeshStandardMaterial({color:0x8a7a62, roughness:0.9}), 0, 1.05, 0.16, master);
  const captain = npc(0, -19.6, 0, 0x9c1b2a, {plume:0xffffff});
  { const gor = world.part(new THREE.TorusGeometry(0.075, 0.018, 6, 20, Math.PI), M.goldMat, 0, 1.585, 0.12, captain); gor.rotation.set(0.3, 0, Math.PI); gor.scale.set(1, 0.7, 1);
    const sash = world.part(new THREE.BoxGeometry(0.06, 0.78, 0.015), M.goldMat, 0, 1.25, 0.17, captain); sash.rotation.z = 0.55; }

  /* ---------- rün nesneleri ---------- */
  const runeObjs = {};
  function makeRune(id, color){
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({color:0x111111, emissive:new THREE.Color(color), emissiveIntensity:3, roughness:0.15, metalness:0.2});
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mat); gem.scale.y = 1.45; g.add(gem);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 48), new THREE.MeshBasicMaterial({color, toneMapped:false, transparent:true, opacity:0.8}));
    ring.rotation.x = Math.PI / 2; g.add(ring);
    const light = new THREE.PointLight(new THREE.Color(color), 2.5, 9, 2); g.add(light);
    const beamMat = new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.18, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide});
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.4, 7, 16, 1, true), beamMat); beam.position.y = 3.5; g.add(beam);
    g.userData = {gem, ring, light, beam, base:0};
    scene.add(g); runeObjs[id] = g; return g;
  }
  RUNES.forEach(r => makeRune(r.id, r.color));

  // Yakut: fıskiye havuzunda gizli; bulununca yükselir
  runeObjs.yakut.position.set(0, 0.2, 10); runeObjs.yakut.visible = false;
  // Zümrüt: labirent merkezi
  runeObjs.zumrut.position.set(maze.center[0], 1.2, maze.center[1]);
  // Altın: yüzbaşının yanında görünmez, verildiğinde belirir
  runeObjs.altin.visible = false;

  /* ---------- kule balkonu (safir) ---------- */
  const TW = {x:31.6, z:CZ + 9.2, floor:18.4, a0:-1.3, a1:2.95};
  {
    const span = TW.a1 - TW.a0;
    const fl = new THREE.Mesh(new THREE.RingGeometry(3.6, 5.0, 48, 1, TW.a0, span), M.stoneMat);
    fl.geometry.rotateX(Math.PI / 2); fl.material = M.stoneMat.clone(); fl.material.side = THREE.DoubleSide;
    fl.position.set(TW.x, TW.floor - 0.02, TW.z); fl.receiveShadow = true; scene.add(fl);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 4.4, 0.45, 48, 1, false, Math.PI / 2 - TW.a1, span), M.stoneMat);
    slab.position.set(TW.x, TW.floor - 0.25, TW.z); scene.add(slab);
    // TorusGeometry XY düzleminde; X etrafında +90° çevirince açı z = sin olur
    const rail = new THREE.Mesh(new THREE.TorusGeometry(4.95, 0.05, 6, 64, span), M.goldMat);
    rail.geometry.rotateZ(TW.a0); rail.rotation.set(Math.PI / 2, 0, 0); rail.position.set(TW.x, TW.floor + 0.95, TW.z); scene.add(rail);
    const n = 26, bm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.06, 0.95, 6), M.goldMat, n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++){ const a = TW.a0 + span * i / (n - 1); m4.makeTranslation(TW.x + Math.cos(a) * 4.95, TW.floor + 0.48, TW.z + Math.sin(a) * 4.95); bm.setMatrixAt(i, m4); }
    scene.add(bm);
    // kapı (kulede, yerde ve balkonda)
    const doorMat = M.doorMat;
    const groundDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), doorMat);
    const ga = 1.0; groundDoor.position.set(TW.x + Math.cos(ga) * 3.53, 2.3, TW.z + Math.sin(ga) * 3.53); groundDoor.lookAt(TW.x + Math.cos(ga) * 10, 2.3, TW.z + Math.sin(ga) * 10); scene.add(groundDoor);
    const topDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), doorMat); const ta = 1.6; topDoor.position.set(TW.x + Math.cos(ta) * 3.72, TW.floor + 0.95, TW.z + Math.sin(ta) * 3.72); topDoor.lookAt(TW.x + Math.cos(ta) * 10, TW.floor + 0.95, TW.z + Math.sin(ta) * 10); scene.add(topDoor);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.7), M.slateMat); hood.position.set(TW.x + Math.cos(ta) * 3.9, TW.floor + 2.0, TW.z + Math.sin(ta) * 3.9); hood.lookAt(TW.x + Math.cos(ta) * 10, TW.floor + 2.0, TW.z + Math.sin(ta) * 10); scene.add(hood);
    TW.groundDoor = {x:TW.x + Math.cos(ga) * 4.6, z:TW.z + Math.sin(ga) * 4.6, yaw:Math.atan2(Math.cos(ga), Math.sin(ga))};
    TW.topSpot = {x:TW.x + Math.cos(ta) * 4.45, z:TW.z + Math.sin(ta) * 4.45, yaw:Math.atan2(Math.cos(ta), Math.sin(ta))};
  }
  const sa = -0.95;
  runeObjs.safir.position.set(TW.x + Math.cos(sa) * 4.45, TW.floor + 1.1, TW.z + Math.sin(sa) * 4.45);
  runeObjs.safir.userData.beam.visible = false;

  /* ---------- Ay Kapısı (ametist) ---------- */
  const GATE = {x:0, z:88};
  const gateDoorMat = new THREE.MeshStandardMaterial({color:0x5b4a3c, roughness:0.85, emissive:0x8a4bff, emissiveIntensity:0});
  let gateDoor, gateCol, gateOpen = 0;
  {
    const g = new THREE.Group(); g.position.set(GATE.x, 0, GATE.z); scene.add(g);
    const wallMat = M.stoneMat;
    [-1, 1].forEach(s => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.6, 1.1), wallMat); w.position.set(s * 3.3, 2.3, 0); w.castShadow = true; w.receiveShadow = true; g.add(w);
      C.box(GATE.x + s * 3.3, GATE.z, 2.1, 0.55);
      // yan duvarlar (oyuk)
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.6, 3.6), wallMat); side.position.set(s * 1.6, 1.8, 2.3); g.add(side);
      C.box(GATE.x + s * 1.6, GATE.z + 2.3, 0.3, 1.8);
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.6, 0.6), wallMat); back.position.set(0, 1.8, 4.1); g.add(back); C.box(GATE.x, GATE.z + 4.1, 1.9, 0.3);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.4, 4.4), wallMat); roof.position.set(0, 3.7, 2.2); g.add(roof);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.28, 10, 32, Math.PI), wallMat); arch.position.set(0, 3.0, 0); g.add(arch);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 1.1), wallMat); lintel.position.set(0, 3.8, 0); g.add(lintel);
    // hilal kabartması
    const moonC = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 8, 24, Math.PI * 1.3), gateDoorMat); moonC.position.set(0, 3.95, -0.58); moonC.rotation.z = -0.6; g.add(moonC);
    gateDoor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.0, 0.2), gateDoorMat); gateDoor.position.set(0, 1.5, 0); gateDoor.castShadow = true; g.add(gateDoor);
    gateCol = C.box(GATE.x, GATE.z, 1.25, 0.3);
    // sarmaşıklar
    const ivy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.28, 0), M.hedgeMat, 70), m4 = new THREE.Matrix4();
    for (let i = 0; i < 70; i++){ const s = i % 2 ? 1 : -1; m4.makeTranslation(s * (2 + Math.random() * 3), 0.4 + Math.random() * 4.2, -0.6); ivy.setMatrixAt(i, m4); }
    g.add(ivy);
    // oyuk içindeki kaide
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12), M.marbleMat); ped.position.set(0, 0.45, 2.6); g.add(ped);
  }
  runeObjs.ametist.position.set(GATE.x, 1.4, GATE.z + 2.6);
  runeObjs.ametist.userData.beam.visible = false;

  /* ---------- güneş saati ---------- */
  const DIAL = {x:18, z:7};
  {
    const g = new THREE.Group(); g.position.set(DIAL.x, 0, DIAL.z); scene.add(g);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.1, 16), M.stoneMat); col.position.y = 0.55; g.add(col);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 32), M.goldMat); plate.position.y = 1.13; g.add(plate);
    const gnomon = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.5), M.darkMetal); gnomon.position.set(0, 1.3, 0); gnomon.rotation.x = 0.6; g.add(gnomon);
    C.circle(DIAL.x, DIAL.z, 0.5);
  }

  /* ---------- madalyonlar ---------- */
  const coinPos = [
    [-12, -27.5, 1], [12, -27.5, 1], [-18, -14], [18, 40], [-24, 10], [27, 10], [0, 30], [-38, -15], [38, 48], [-50, 32],
    [-51, 5], [-40, -40], [40, -55], [0, -60], [12, 66], [-12, 74], [6, 85],
    ['kule'], ['lab', 0], ['lab', 1],
    ...(hooks.extraCoins || []),
  ];
  const coinGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.06, 28); coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({color:0xf3c74c, metalness:1, roughness:0.22, emissive:0x5a3c00, emissiveIntensity:0.6});
  const fleurMat = new THREE.MeshStandardMaterial({color:0xfff1b8, metalness:1, roughness:0.3});
  const coins = coinPos.map((c, i) => {
    let x, z, y = 0;
    if (c[0] === 'kule'){ const a = 0.5; x = TW.x + Math.cos(a) * 4.45; z = TW.z + Math.sin(a) * 4.45; y = TW.floor; }
    else if (c[0] === 'lab'){ const d = maze.deadEnds[c[1] * 3] || maze.deadEnds[c[1]]; x = d[0]; z = d[1]; }
    else {
      x = c[0]; z = c[1]; y = c[2] || 0;
      // engel içindeyse boş bir yer ara
      for (let k = 0; k < 40 && C.blocked(x, z, 0.5); k++){ const a = k * 2.4, r = 0.6 + k * 0.25; x = c[0] + Math.cos(a) * r; z = c[1] + Math.sin(a) * r; }
      y = Math.max(y, C.height(x, z));
    }
    const g = new THREE.Group(); g.position.set(x, y + 1.0, z);
    const disc = new THREE.Mesh(coinGeo, coinMat); disc.castShadow = true; g.add(disc);
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 4), fleurMat); f.position.z = 0.04; g.add(f); const f2 = f.clone(); f2.position.z = -0.04; g.add(f2);
    scene.add(g);
    return {i, g, x, z, y, zone:c[0] === 'kule' ? 'kule' : null, taken:S.coins.includes(i)};
  });
  coins.forEach(c => { c.g.visible = !c.taken; });

  /* ---------- etkileşimler ---------- */
  const has = id => S.runes[id];
  const runeCount = () => RUNES.filter(r => S.runes[r.id]).length;

  async function talkMaster(){
    if (!S.met){
      await ui.dialog([
        {name:'Ahır ustası Gaston', text:'Ah, bir yolcu! Bu saatte bahçede pek kimse dolaşmaz.'},
        {name:'Ahır ustası Gaston', text:'Tapınaktaki kılıcı gördün mü? Yüz yıldır uyuyor. Efsaneye göre beş rün onu uyandırırmış.'},
        {name:'Ahır ustası Gaston', text:'Rünleri kimse bir araya getiremedi. Ama ben ahırda çok fısıltı duyarım…', choices:['Anlat bakalım.', 'Önce bir ata ihtiyacım var.']},
        {name:'Ahır ustası Gaston', text:'Fıskiyenin dibinde kırmızı bir ışık. Doğu kulesinin balkonunda mavi bir parıltı. Labirentin kalbinde yeşil bir taş.'},
        {name:'Ahır ustası Gaston', text:'Yüzbaşı Armand altın rünü saklar; bilmecelerine dikkat et. Mor olanı ise yalnız geceleri açılan Ay Kapısı\'nın ardında.'},
        {name:'Ahır ustası Gaston', text:'Al, Étoile seni kapının önünde bekliyor. Atın yanında E ile binip inebilirsin. Güneş saati de zamanı ilerletir, bunu unutma.'},
      ]);
      S.met = true; S.started = true; audio.sfx('quest');
      hooks.spawnHorse(); ui.toast('Görev günlüğü açıldı · J'); hooks.save();
    } else {
      const left = RUNES.filter(r => !S.runes[r.id]);
      const line = left.length ? 'Daha ' + left.length + ' rün kaldı. ' + left[Math.floor(Math.random() * left.length)].hint : 'Beş rün de sende! Hemen tapınağa git.';
      await ui.dialog([{name:'Ahır ustası Gaston', text:line}]);
    }
  }
  async function talkCaptain(){
    if (has('altin')){ await ui.dialog([{name:'Yüzbaşı Armand', text:'Altın rün emin ellerde. Kılıç uyandığında bütün muhafızlar selam duracak.'}]); return; }
    if (!S.met){ await ui.dialog([{name:'Yüzbaşı Armand', text:'Şato kapısı ziyaretçilere kapalı. Ahır ustası Gaston\'a uğra, o sana yol gösterir.'}]); return; }
    const a = await ui.dialog([
      {name:'Yüzbaşı Armand', text:'Demek rünlerin peşindesin. Altın rünü ancak aklını kullanan alır.'},
      {name:'Yüzbaşı Armand', text:'Birinci bilmece: Dişlerim var ama ısırmam. Kapıları açarım ama ev değilim. Neyim?', choices:['Tarak', 'Anahtar', 'Testere']},
    ]);
    if (a !== 1){ audio.sfx('wrong'); S.notes.captainTries++; await ui.dialog([{name:'Yüzbaşı Armand', text:'Hayır! Biraz dolaş, kafanı topla, sonra yine gel.'}]); return; }
    const b = await ui.dialog([
      {name:'Yüzbaşı Armand', text:'Hm, fena değil. İkinci bilmece: Benden ne kadar çok alırsan o kadar büyürüm. Neyim?', choices:['Hazine', 'Gölge', 'Çukur']},
    ]);
    if (b !== 2){ audio.sfx('wrong'); S.notes.captainTries++; await ui.dialog([{name:'Yüzbaşı Armand', text:'Yaklaştın ama olmadı. Tekrar dene.'}]); return; }
    await ui.dialog([{name:'Yüzbaşı Armand', text:'Bravo! Altın rün artık senin. Tapınağa yolun açık olsun.'}]);
    runeObjs.altin.position.set(captain.position.x, 2.2, captain.position.z + 0.6); runeObjs.altin.visible = true;
    collectRune('altin');
  }
  async function fountain(){
    if (has('yakut')){ await ui.dialog([{name:'', text:'Fıskiyenin suyu berrak ve sakin.'}]); return; }
    if (world.W.rain > 0.4){
      S.notes.yakutRain = true;
      await ui.dialog([{name:'', text:'Yağmur damlaları suyu bulandırıyor. Dipte bir şeyin kızıl ışıltısını görür gibi oluyorsun ama seçemiyorsun. Hava açılınca tekrar bakmalısın.'}]);
      return;
    }
    await ui.dialog([{name:'', text:'Su durgun. Havuzun dibinde kızıl bir ışık titreşiyor… Elini suya daldırıyorsun.'}]);
    runeObjs.yakut.visible = true; runeObjs.yakut.userData.rise = 1.0;
    setTimeout(() => collectRune('yakut'), 1400);
  }
  async function sundial(){
    const k = world.weatherKey;
    const c = await ui.dialog([{name:'Güneş saati', text:'Gölge şu an "' + world.WEATHER[k].name + '" saatini gösteriyor. İbreyi çevirirsen zaman ilerler.', choices:['Gün batımına ilerlet', 'Geceye ilerlet', 'Sabaha ilerlet', 'Vazgeç']}]);
    const to = ['gunbatimi', 'gece', 'gunesli'][c];
    if (to){ audio.sfx('whoosh'); hooks.setWeather(to, true); }
  }
  async function moonGate(){
    if (world.W.night > 0.8) return;
    S.notes.gateDay = true;
    await ui.dialog([{name:'', text:'Taş kapının üzerine bir hilal oyulmuş. Kapı kıpırdamıyor. Belki ay ışığında…'}]);
  }
  async function temple(){
    const n = runeCount();
    if (S.finished){ await ui.dialog([{name:'', text:'Kılıç uyanık. Işığı bütün bahçeye yayılıyor.'}]); return; }
    if (n < 5){ await ui.dialog([{name:'', text:'Kaidede beş oyuk var. ' + n + ' tanesine rün yerleştirebilirsin. Diğerlerini bulmalısın.'}]); return; }
    hooks.openWorkshop();
  }
  async function talkGuard(g){
    const LINES = [
      'Yüzbaşı Armand bilmecelere bayılır. Kapıları açan ama ev olmayan şey… hep onu sorar.',
      'Geceleri tapınağın ardında mor bir ışık gördüğümü sanıyorum.',
      'Labirentte kaybolursan bir elini çite koy ve hiç kaldırmadan yürü.',
      'Yağmur yağınca fıskiyenin dibi görünmez olur.',
      'Doğu kulesinin kapısı hep aralıktır. Balkondan bütün bahçe görünür.',
      'Gaston\'un atı Étoile bahçenin en hızlısıdır.',
      'Altın madalyonlar mı? Eski kontesin hazinesinden kalmışlar. Bahçenin her yerine saçılmışlar.',
    ];
    await ui.dialog([{name:'Muhafız', text:LINES[Math.floor(Math.random() * LINES.length)]}]);
  }

  const near = (o, x, z) => Math.hypot(o.x - x, o.z - z);
  interact.push(
    {id:'gaston', get x(){ return master.position.x; }, get z(){ return master.position.z; }, r:2.6, label:'Konuş', show:() => true, act:talkMaster},
    {id:'armand', x:captain.position.x, z:captain.position.z, r:2.6, label:'Konuş', show:() => true, act:talkCaptain},
    {id:'fiskiye', x:0, z:10, r:6.4, label:'Suya bak', show:() => !has('yakut'), act:fountain},
    {id:'gunes', x:DIAL.x, z:DIAL.z, r:2.2, label:'Güneş saatini çevir', show:() => true, act:sundial},
    {id:'kapi', x:GATE.x, z:GATE.z - 1, r:2.6, label:'Kapıyı incele', show:() => world.W.night <= 0.8 && !has('ametist'), act:moonGate},
    {id:'kule', x:0, z:0, r:2.2, label:'Kuleye çık', show:() => hero.zone !== 'kule', act:() => hooks.enterTower(TW), init(){ this.x = TW.groundDoor.x; this.z = TW.groundDoor.z; }},
    {id:'kuleIn', x:0, z:0, r:1.8, label:'Aşağı in', zone:'kule', show:() => hero.zone === 'kule', act:() => hooks.leaveTower(TW), init(){ this.x = TW.topSpot.x; this.z = TW.topSpot.z; }},
    {id:'kaide', x:TEMPLE.x, z:TEMPLE.z, r:3.4, label:'Kaideye dokun', show:() => true, act:temple},
  );
  interact.forEach(o => o.init && o.init());
  world.guards.forEach(g => interact.push({id:'muhafiz', get x(){ return g.obj.position.x; }, get z(){ return g.obj.position.z; }, r:2.0, label:'Konuş', show:() => true, act:() => talkGuard(g)}));

  /* ---------- pusula işaretleri ---------- */
  markers.push(
    {id:'gaston', color:'#e8d3a0', label:'Gaston', x:master.position.x, z:master.position.z, show:() => !S.met},
    {id:'yakut', color:'#ff2a4a', label:'Yakut', x:0, z:10, show:() => S.met && !has('yakut')},
    {id:'safir', color:'#2f7bff', label:'Safir', x:TW.groundDoor.x, z:TW.groundDoor.z, show:() => S.met && !has('safir')},
    {id:'zumrut', color:'#22e08a', label:'Zümrüt', x:maze.entry[0], z:maze.entry[1], show:() => S.met && !has('zumrut')},
    {id:'altin', color:'#f2c14e', label:'Armand', x:captain.position.x, z:captain.position.z, show:() => S.met && !has('altin')},
    {id:'ametist', color:'#b35bff', label:'Ay Kapısı', x:GATE.x, z:GATE.z, show:() => S.met && !has('ametist')},
    {id:'tapinak', color:'#ffffff', label:'Tapınak', x:TEMPLE.x, z:TEMPLE.z, show:() => runeCount() === 5 && !S.finished},
  );

  /* ---------- rün toplama ---------- */
  function collectRune(id){
    if (S.runes[id]) return;
    S.runes[id] = true; const r = RUNES.find(q => q.id === id);
    const o = runeObjs[id]; o.userData.fly = 1;
    audio.sfx('rune'); ui.runeFound(r, runeCount());
    hooks.save();
    if (runeCount() === 5) setTimeout(() => { ui.toast('Beş rün tamam! Tapınağa git.', 4000); audio.sfx('quest'); }, 1800);
  }

  function update(dt, t){
    const p = hero.pos, night = world.W.night;
    // rünler: dönme, parlama, toplama
    RUNES.forEach(r => {
      const o = runeObjs[r.id], u = o.userData;
      if (u.fly){ // oyuncuya doğru uçup kaybolur
        u.fly -= dt * 1.1; o.position.lerp(new THREE.Vector3(p.x, p.y + 1.8, p.z), Math.min(1, dt * 5)); o.scale.setScalar(Math.max(0.01, u.fly));
        if (u.fly <= 0){ o.visible = false; u.fly = 0; }
        return;
      }
      if (S.runes[r.id]){ o.visible = false; return; }
      if (u.rise){ u.rise -= dt; o.position.y += dt * 1.2; }
      u.gem.rotation.y += dt * 1.6; u.ring.rotation.z += dt * 0.8;
      u.gem.position.y = Math.sin(t * 2 + r.id.length) * 0.12;
      u.light.intensity = 2 + Math.sin(t * 3) * 0.6 + night * 2;
    });
    // proximity toplama
    if (!S.runes.zumrut && near(runeObjs.zumrut.position, p.x, p.z) < 1.6) collectRune('zumrut');
    if (!S.runes.safir && hero.zone === 'kule' && near(runeObjs.safir.position, p.x, p.z) < 1.4) collectRune('safir');
    if (!S.runes.ametist && gateOpen > 0.8 && near(runeObjs.ametist.position, p.x, p.z) < 1.5) collectRune('ametist');
    if (!S.runes.ametist && !runeObjs.ametist.userData.fly) runeObjs.ametist.visible = gateOpen > 0.3;

    // Ay Kapısı: gece açılır
    const want = night > 0.8 ? 1 : 0;
    const was = gateOpen; gateOpen += (want - gateOpen) * Math.min(1, dt * 0.8);
    if (was < 0.5 && gateOpen >= 0.5) { audio.sfx('open'); if (!S.runes.ametist) ui.toast('Ay Kapısı ay ışığında açıldı…', 3000); }
    gateDoor.position.x = gateOpen * 2.3; gateDoor.position.z = -gateOpen * 0.4;
    gateDoorMat.emissiveIntensity = night * (0.6 + Math.sin(t * 2) * 0.2);
    gateCol.on = gateOpen < 0.6;

    // madalyonlar
    const pick = hero.mounted ? 2.2 : 1.3;
    coins.forEach(c => {
      if (c.taken) return;
      c.g.rotation.y += dt * 2.2; c.g.position.y = c.y + 1.0 + Math.sin(t * 2 + c.i) * 0.12;
      coinMat.emissiveIntensity = 0.6 + night * 1.6;
      if ((c.zone === 'kule') !== (hero.zone === 'kule')) return;
      if (Math.hypot(c.x - p.x, c.z - p.z) < pick && Math.abs(c.y - p.y) < 3){
        c.taken = true; c.g.visible = false; S.coins.push(c.i); audio.sfx('coin'); ui.coins(S.coins.length, COIN_TOTAL); hooks.save();
        if (S.coins.length === COIN_TOTAL) ui.toast('Bütün madalyonları topladın!', 3500);
      }
    });
    // NPC'ler oyuncuya döner
    [master, captain].forEach(n => {
      const d = Math.hypot(p.x - n.position.x, p.z - n.position.z);
      if (d < 6) world.turnToward(n, Math.atan2(p.x - n.position.x, p.z - n.position.z), Math.min(1, dt * 3));
    });
  }

  return {interact, markers, update, runeObjs, coins, TW, GATE, maze, runeCount, master, captain, collectRune};
}
