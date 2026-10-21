// Kraliyet yapıları: Kuğu Deresi ve gondol iskelesi, Kahramanlar Yolu, Zafer Takı ve dikilitaşlar, Işıldayan Gece Bahçesi,
// saat kulesi, diplomasi ve ziyafet pavyonu, maskeli balo ve Ayna Galerisi, av köşkü ve av arazisi,
// gizli geçitler ve yeraltı sığınağı, simya laboratuvarı, kuyumcu ve terzi atölyesi, uşak akademisi.
import { makeKit } from './kit.js';
import { PLACES } from './court.js';

export const CANAL = {z:205, x0:-150, x1:150, w:12};
export const WALK = {z0:132, z1:196};
export const ARCH = {x:0, z:230};
export const NIGHT = {x:48, z:168};
export const CLOCK = {x:40, z:90};
export const DIPLO = {x:-58, z:-142};
export const MASKH = {x:58, z:-142};
export const HUNT = {x0:-228, x1:-172, z0:-82, z1:40, lodge:{x:-196, z:-45}, hatch:{x:-208, z:-64}};
export const TUN = {x:0, z:-900, cell:2};
export const ALCH = {x:27, z:-153};
export const JEWEL = {x:-58, z:-196};
export const BUTLER = {x:58, z:-196};
// Ağaç dikilmeyecek alanlar [x0, z0, x1, z1]
export const ROYAL_ZONES = [[-160, 186, 160, 252], [26, 150, 70, 186], [-8, 128, 8, 200], [28, 78, 52, 102], [-82, -216, 82, -166], [-212, -60, -176, -28]];

const ROYAL_PLACES = [
  {id:'kanal', name:'Kuğu Deresi ve gondol iskelesi', x:26, z:CANAL.z, r:24},
  {id:'kahraman', name:'Kahramanlar Yolu', x:0, z:165, r:16},
  {id:'zafer', name:'Zafer Takı ve dikilitaşlar', x:ARCH.x, z:ARCH.z, r:18},
  {id:'gece', name:'Işıldayan Gece Bahçesi', x:NIGHT.x, z:NIGHT.z, r:18},
  {id:'saat', name:'Saat kulesi', x:CLOCK.x, z:CLOCK.z, r:14},
  {id:'diplomasi', name:'Diplomasi ve ziyafet pavyonu', x:DIPLO.x, z:DIPLO.z, r:18},
  {id:'maske', name:'Maskeli balo ve Ayna Galerisi', x:MASKH.x, z:MASKH.z, r:18},
  {id:'av', name:'Av köşkü ve av arazisi', x:-200, z:-20, r:34},
  {id:'simya', name:'Simya laboratuvarı', x:ALCH.x, z:ALCH.z, r:12},
  {id:'kuyumcu', name:'Kuyumcu ve terzi atölyesi', x:JEWEL.x, z:JEWEL.z, r:16},
  {id:'usak', name:'Uşak ve hizmetkâr akademisi', x:BUTLER.x, z:BUTLER.z + 10, r:18},
  {id:'gecit', name:'Gizli geçitler ve yeraltı sığınağı', x:61, z:-80, r:0},
];
PLACES.push(...ROYAL_PLACES);

export function buildRoyal(world, C, hooks){
  const { THREE, scene, materials:M } = world;
  const root = new THREE.Group(); root.name = 'KraliyetYapilari'; scene.add(root);
  const interact = [], updaters = [], markers = [];
  const say = (name, text, choices) => hooks.ui.dialog([{name, text, choices}]);
  const K = makeKit(world, C, root, {seed:1789, interact, updaters, say});
  const { rnd, L, m4, q4, s4, add, canvas, ctex, plane, disc, toWorld, lathe, mat, gold, stone, marble, gravel, slate, cream, plaster, wood, darkWood, winMat, lampMat, grass,
    signBoard, signPost, column, gableGeo, hall, npc, lady, mask, placeNPC, statue } = K;
  const S = () => hooks.getS();
  const col = new THREE.Color();
  let heroRef = null;
  const water = mat(0x24505e, {metalness:0.3, roughness:0.04, transparent:true, opacity:0.9});
  const brass = mat(0xc9933a, {metalness:0.95, roughness:0.3});
  const bronze = mat(0x4f7a68, {metalness:0.6, roughness:0.45});
  const crystal = mat(0xffffff, {metalness:0.2, roughness:0.02, transparent:true, opacity:0.7, emissive:0xfff0d0, emissiveIntensity:0.3});
  const glass = mat(0xdff3f6, {metalness:0.15, roughness:0.04, transparent:true, opacity:0.2, side:THREE.DoubleSide, depthWrite:false});
  const flameMat = new THREE.MeshBasicMaterial({color:0xffb050, toneMapped:false});
  const flames = [];
  function candle(x, y, z, parent = root, h = 0.22){
    add(new THREE.CylinderGeometry(0.03, 0.03, h, 8), cream, x, y + h / 2, z, parent);
    const f = add(new THREE.ConeGeometry(0.025, 0.08, 6), flameMat, x, y + h + 0.05, z, parent, false); f.userData.dyn = true; flames.push(f); return f;
  }
  function chandelier(x, y, z, parent, s = 1){
    const ch = new THREE.Group(); ch.position.set(x, y, z); parent.add(ch);
    add(new THREE.CylinderGeometry(0.02, 0.02, 3, 6), gold, 0, 1.5, 0, ch);
    [1.1, 0.7, 0.35].forEach((r, k) => {
      add(new THREE.TorusGeometry(r * s, 0.035, 6, 28), gold, 0, -k * 0.4, 0, ch).rotation.x = Math.PI / 2;
      const n = 10 - k * 3; for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; add(new THREE.SphereGeometry(0.06, 8, 6), lampMat, Math.cos(a) * r * s, -k * 0.4 + 0.1, Math.sin(a) * r * s, ch, false); add(new THREE.OctahedronGeometry(0.05, 0), crystal, Math.cos(a + 0.3) * r * s, -k * 0.4 - 0.16, Math.sin(a + 0.3) * r * s, ch, false).scale.y = 2.2; }
    });
    add(new THREE.OctahedronGeometry(0.2, 0), crystal, 0, -1.25, 0, ch, false).scale.y = 1.8;
    return ch;
  }

  /* =====================================================================
     1. KUĞU DERESİ VE VENEDİK TARZI GONDOL İSKELESİ
     ===================================================================== */
  const gondolas = [];
  const JETTY = {x:26, z:CANAL.z - CANAL.w / 2};
  {
    const {z, x0, x1, w} = CANAL, len = x1 - x0, cx = (x0 + x1) / 2;
    plane(len + 30, w + 26, grass, cx, 0.004, z);
    plane(len, w, water, cx, 0.1, z);
    [-1, 1].forEach(sd => {
      add(new THREE.BoxGeometry(len + 1.2, 0.5, 0.6), stone, cx, 0.2, z + sd * (w / 2 + 0.3));
      add(new THREE.BoxGeometry(len + 1.2, 0.12, 0.8), marble, cx, 0.5, z + sd * (w / 2 + 0.35));
    });
    [x0, x1].forEach(x => add(new THREE.BoxGeometry(0.6, 0.5, w + 1.2), stone, x + (x === x0 ? -0.3 : 0.3), 0.2, z));
    // iskele kazıkları ve çizgili gondol direkleri
    const [pc, pg] = canvas(32, 128); for (let i = 0; i < 8; i++){ pg.fillStyle = i % 2 ? '#ffffff' : '#1d3a8a'; pg.save(); pg.translate(0, i * 16); pg.transform(1, 0.4, 0, 1, 0, 0); pg.fillRect(-20, 0, 80, 16); pg.restore(); }
    const poleMat = new THREE.MeshStandardMaterial({map:ctex(pc), roughness:0.6});
    // ahşap iskele (kıyıdan suya 3 m)
    add(new THREE.BoxGeometry(8, 0.25, 3.5), wood, JETTY.x, 0.4, JETTY.z + 1.2);
    for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.06, 0.02, 3.5), darkWood, JETTY.x - 3.6 + i * 1.8, 0.53, JETTY.z + 1.2, root, false);
    [-4.6, -1.5, 1.5, 4.6].forEach(dx => { add(new THREE.CylinderGeometry(0.12, 0.12, 3.4, 10), poleMat, JETTY.x + dx, 1.4, JETTY.z + 3.4); add(new THREE.SphereGeometry(0.16, 10, 8), gold, JETTY.x + dx, 3.15, JETTY.z + 3.4); });
    // iskele feneri ve tabela
    add(new THREE.CylinderGeometry(0.07, 0.1, 3.2, 8), M.darkMetal, JETTY.x - 5.5, 1.6, JETTY.z - 1.2); add(new THREE.SphereGeometry(0.22, 12, 8), lampMat, JETTY.x - 5.5, 3.35, JETTY.z - 1.2, root, false);
    signPost('Embarcadère des Gondoles', JETTY.x + 6.5, JETTY.z - 3.5, 0);
    // kemerli taş köprü (Kahramanlar Yolu'nu Zafer Takı'na bağlar)
    const bz0 = z - w / 2 - 3, bz1 = z + w / 2 + 3, bl = bz1 - bz0, arch = zz => 0.3 + Math.sin(Math.max(0, Math.min(1, (zz - bz0) / bl)) * Math.PI) * 1.5;
    for (let i = 0; i <= 18; i++){ const zz = bz0 + i / 18 * bl; add(new THREE.BoxGeometry(5.2, 0.3, bl / 18 + 0.05), marble, 0, arch(zz) - 0.15, zz); }
    [-2.5, 2.5].forEach(dx => {
      const pts = []; for (let i = 0; i <= 18; i++){ const zz = bz0 + i / 18 * bl; pts.push(L(dx, arch(zz) + 0.85, zz)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.1, 6), marble, 0, 0, 0);
      for (let i = 0; i <= 14; i++){ const zz = bz0 + i / 14 * bl; add(lathe([[0, 0], [0.1, 0], [0.06, 0.25], [0.11, 0.5], [0.06, 0.75], [0.1, 0.85], [0, 0.85]], 8), marble, dx, arch(zz), zz); }
      C.box(dx * 1.04, (bz0 + bz1) / 2, 0.1, bl / 2);
    });
    C.heightFns.push((x, zz) => (Math.abs(x) < 2.6 && zz > bz0 && zz < bz1) ? arch(zz) : null);
    // su: yürünmez (köprü ve iskele hariç)
    const wz = z, hd = w / 2;
    C.rect(x0, wz - hd, -2.7, wz + hd); C.rect(2.7, wz - hd, JETTY.x - 4, wz + hd); C.rect(JETTY.x + 4, wz - hd, x1, wz + hd); C.rect(JETTY.x - 4, JETTY.z + 2.9, JETTY.x + 4, wz + hd);
    C.heightFns.push((x, zz) => (Math.abs(x - JETTY.x) < 4 && zz > JETTY.z - 0.6 && zz < JETTY.z + 2.95) ? 0.53 : null);
    [x0 - 0.6, x1 + 0.6].forEach(x => C.box(x, z, 0.3, hd + 0.6));
    // gondol yapıcı
    const hullMat = mat(0x0c0c10, {roughness:0.15, metalness:0.3}), velvet = mat(0x7a0f1c, {roughness:0.9});
    const [sc, sg] = canvas(64, 64); for (let i = 0; i < 8; i++){ sg.fillStyle = i % 2 ? '#ffffff' : '#1a1a2a'; sg.fillRect(0, i * 8, 64, 8); }
    const stripeMat = new THREE.MeshStandardMaterial({map:ctex(sc, 1, 2), roughness:0.7});
    function gondola(withCouple){
      const g = new THREE.Group(); g.userData.dyn = true;
      const sh = new THREE.Shape(); sh.moveTo(-5.2, 1.1); sh.quadraticCurveTo(-4.4, 0, -3, 0); sh.lineTo(3, 0); sh.quadraticCurveTo(4.6, 0, 5.3, 1.45); sh.lineTo(4.9, 1.45); sh.quadraticCurveTo(4.2, 0.6, 3, 0.6); sh.lineTo(-3, 0.6); sh.quadraticCurveTo(-4.1, 0.6, -4.8, 1.1); sh.closePath();
      const hg = new THREE.ExtrudeGeometry(sh, {depth:1.3, bevelEnabled:true, bevelSize:0.06, bevelThickness:0.06, bevelSegments:2}); hg.translate(0, -0.15, -0.65);
      add(hg, hullMat, 0, 0, 0, g);
      add(new THREE.BoxGeometry(1.6, 0.35, 1.1), velvet, 0.6, 0.62, 0, g); add(new THREE.BoxGeometry(0.2, 0.6, 1.1), velvet, -0.3, 0.8, 0, g);
      add(new THREE.TorusGeometry(0.5, 0.04, 6, 16, Math.PI), gold, 0.6, 0.62, 0.62, g); add(new THREE.TorusGeometry(0.5, 0.04, 6, 16, Math.PI), gold, 0.6, 0.62, -0.62, g);
      // ferro: pruvadaki gümüş tarak
      const ferro = new THREE.Group(); ferro.position.set(5.0, 1.3, 0); g.add(ferro);
      add(new THREE.BoxGeometry(0.08, 0.9, 0.06), M.steelMat, 0, 0.35, 0, ferro); for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.32, 0.05, 0.05), M.steelMat, 0.16, 0.05 + i * 0.12, 0, ferro);
      // gondolcu: çizgili gömlek, hasır şapka
      const gd = npc({coat:0xfefefe, hat:'none', trim:mat(0xc8102e)});
      gd.traverse(o => { if (o.material === mat(0xfefefe)) o.material = stripeMat; });
      add(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16), mat(0xe8d08a, {roughness:0.9}), 0, 1.98, 0, gd); add(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 20), mat(0xe8d08a, {roughness:0.9}), 0, 1.93, 0, gd); add(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 16), mat(0xc8102e), 0, 1.95, 0, gd);
      gd.position.set(-4.0, 0.6, 0); gd.rotation.y = Math.PI / 2; g.add(gd);
      const oar = new THREE.Group(); oar.position.set(-3.6, 1.6, 0.25); oar.userData.anim = true; g.add(oar);
      const o1 = add(new THREE.CylinderGeometry(0.03, 0.03, 4.2, 6), wood, 0, -1.5, 0, oar); add(new THREE.BoxGeometry(0.04, 0.6, 0.16), wood, 0, -3.5, 0, oar);
      oar.rotation.z = 0.5;
      if (withCouple){
        const la = lady([0xd8b4e2, 0x9db0e2, 0xf2c6b4][gondolas.length % 3]); la.position.set(0.9, 0.35, 0.25); la.rotation.y = -Math.PI / 2; g.add(la);
        const gm = npc({coat:[0x1d2a5a, 0x5a1a2a, 0x2a4a2a][gondolas.length % 3]}); gm.position.set(0.9, 0.0, -0.3); gm.rotation.y = -Math.PI / 2; gm.scale.y = 0.85; g.add(gm);
      }
      root.add(g); return {g, oar};
    }
    [[-80, 1, 1], [40, -1, 1], [110, 1, 1]].forEach(([x, dir, cpl]) => { const o = gondola(cpl); gondolas.push(Object.assign(o, {x, dir, lane:z - dir * 2.2, turn:-1, speed:2.4 + rnd() * 0.8, ph:rnd() * 6})); o.g.position.set(x, 0.12, z - dir * 2.2); o.g.rotation.y = dir > 0 ? 0 : Math.PI; });
    // kiralık gondol (iskelede bekler)
    const rideG = gondola(false); rideG.g.position.set(JETTY.x, 0.12, JETTY.z + 4.1); rideG.dock = {x:JETTY.x, z:JETTY.z + 4.1};
    gondolas.ride = rideG;
    // gondolcu Luigi
    const luigi = npc({coat:0xfefefe, hat:'none', trim:mat(0xc8102e)});
    luigi.traverse(o => { if (o.material === mat(0xfefefe)) o.material = stripeMat; });
    add(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 16), mat(0xe8d08a, {roughness:0.9}), 0, 1.98, 0, luigi); add(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 20), mat(0xe8d08a, {roughness:0.9}), 0, 1.93, 0, luigi);
    placeNPC(luigi, JETTY.x + 2.5, JETTY.z - 1.0, 0, 'Gondolcu Luigi', async () => {
      const c = await hooks.ui.dialog([{name:'Gondolcu Luigi', text:'Buongiorno! Kuğu Deresi\'nde bir tur ister misiniz? Venedik\'ten getirttiğimiz gondollarla soylular her akşam burada gezinir.', choices:['Gondola bin', 'Kanal hakkında anlat', 'Sonra']}]);
      if (c === 0) startRide();
      else if (c === 1) await say('Gondolcu Luigi', 'Kontes bu kanalı Venedik balayısının hatırasına kazdırdı. Kuğular kışın da burada kalır; su, kaynaktan geldiği için hiç donmaz. Köprünün altından geçerken dilek tutmayı unutmayın!');
    });
    interact.push({x:JETTY.x - 1.5, z:JETTY.z + 1.6, r:2.4, label:'Gondola bin', show:() => true, act:() => startRide()});
    // kanal kıyısında kuğular
    const white = mat(0xf7f5ef, {roughness:0.5}), beak = mat(0xe8702a);
    for (let i = 0; i < 6; i++){
      const g = new THREE.Group(); g.userData.dyn = true;
      add(new THREE.SphereGeometry(0.42, 14, 10), white, 0, 0.25, 0, g).scale.set(0.85, 0.6, 1.35);
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([L(0, 0.35, 0.38), L(0, 0.75, 0.48), L(0, 1.05, 0.32), L(0, 1.18, 0.42)]), 10, 0.07, 6), white, 0, 0, 0, g);
      add(new THREE.SphereGeometry(0.1, 10, 8), white, 0, 1.2, 0.46, g); const b = add(new THREE.ConeGeometry(0.045, 0.2, 8), beak, 0, 1.17, 0.62, g); b.rotation.x = Math.PI / 2 + 0.3;
      root.add(g); gondolas.swans = gondolas.swans || []; gondolas.swans.push({g, x:x0 + 20 + rnd() * (len - 40), z:z + (rnd() - 0.5) * 7, tx:0, tz:0, t:0});
    }
  }
  // gezinti: iskeleden doğuya, dönüş, iskeleye
  function startRide(){
    const R = gondolas.ride, z = CANAL.z;
    const path = [[R.dock.x, R.dock.z], [R.dock.x + 6, z - 2.2], [118, z - 2.2], [126, z], [118, z + 2.2], [-60, z + 2.2], [-70, z], [-60, z - 2.2], [R.dock.x - 8, z - 2.2], [R.dock.x, R.dock.z]];
    const lens = [0]; for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const total = lens[lens.length - 1], speed = 7.5, dur = total / speed;
    const at = d => { let i = 1; while (i < lens.length - 1 && lens[i] < d) i++; const k = (d - lens[i - 1]) / (lens[i] - lens[i - 1]); return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k]; };
    const hero = heroRef; if (!hero) return;
    if (hero.mounted) hero.dismount();
    R.riding = true; hooks.sfx('quest'); hooks.ui.toast('Gondol gezintisi · E ile in', 2600);
    const camP = new THREE.Vector3(), look = new THREE.Vector3();
    hooks.tour({dur, step:(t, cam) => {
      const d = Math.min(total, t * speed), [x, zz] = at(d), [nx, nz] = at(Math.min(total, d + 2));
      R.g.position.set(x, 0.12 + Math.sin(t * 1.3) * 0.03, zz); R.g.rotation.y = Math.atan2(-(nz - zz), nx - x);
      R.g.rotation.z = Math.sin(t * 0.9) * 0.02;
      R.oar.rotation.x = Math.sin(t * 1.6) * 0.35;
      // oyuncu kadife koltukta oturur
      hero.obj.position.set(x + Math.cos(R.g.rotation.y) * 0.6, 0.3, zz - Math.sin(R.g.rotation.y) * 0.6); hero.obj.rotation.y = R.g.rotation.y + Math.PI / 2;
      const fx = Math.cos(R.g.rotation.y), fz = -Math.sin(R.g.rotation.y), orbit = Math.sin(t * 0.12) * 0.9;
      camP.set(x - (fx * Math.cos(orbit) - fz * Math.sin(orbit)) * 8, 3.2, zz - (fz * Math.cos(orbit) + fx * Math.sin(orbit)) * 8);
      cam.position.lerp(camP, t < 0.1 ? 1 : 0.06); look.set(x + fx * 3, 1.2, zz + fz * 3); cam.lookAt(look);
      return d >= total;
    }, end:() => {
      R.riding = false; R.g.position.set(R.dock.x, 0.12, R.dock.z); R.g.rotation.set(0, 0, 0);
      hero.teleport(JETTY.x, 0.53, JETTY.z + 0.6, Math.PI); hero.snapCamera = true;
      hooks.ui.toast('Grazie! Yine bekleriz.', 2200);
    }});
  }

  /* =====================================================================
     2. MERMER HEYKEL YOLU: KAHRAMANLAR YOLU
     ===================================================================== */
  {
    const z0 = WALK.z0, z1 = WALK.z1, len = z1 - z0, zc = (z0 + z1) / 2;
    plane(30, 189 - z0, grass, 0, 0.01, (z0 + 189) / 2);
    const [pc, pg] = canvas(256, 256); pg.fillStyle = '#e6e0d4'; pg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++){ const v = 215 + rnd() * 30; pg.fillStyle = `rgb(${v},${v - 6 | 0},${v - 16 | 0})`; pg.fillRect(x * 64 + 1, y * 64 + 1, 62, 62); }
    pg.strokeStyle = 'rgba(120,110,95,.5)'; for (let i = 0; i <= 4; i++){ pg.beginPath(); pg.moveTo(i * 64, 0); pg.lineTo(i * 64, 256); pg.moveTo(0, i * 64); pg.lineTo(256, i * 64); pg.stroke(); }
    plane(9, len, new THREE.MeshStandardMaterial({map:ctex(pc, 2, len / 4.5), roughness:0.4}), 0, 0.07, zc);
    [-1, 1].forEach(sd => add(new THREE.BoxGeometry(0.4, 0.18, len), mat(0x9e9586), sd * 4.7, 0.09, zc));
    const HEROES = [
      ['Augustus', 0, 'Roma\'nın ilk imparatoru. "Kerpiçten bir şehir buldum, mermerden bir şehir bıraktım."'],
      ['Athena', 1, 'Bilgelik ve savaşın tanrıçası; Lumière\'in arması onun baykuşundan esinlenir.'],
      ['Herakles', 5, 'On iki görevi tamamlayan kahraman. Ayağının dibinde Nemea aslanı yatar.'],
      ['Nike', 3, 'Zafer tanrıçası. Kanatlarıyla Zafer Takı\'na doğru bakar.'],
      ['Apollon', 4, 'Müzik ve ışığın tanrısı; elindeki lir gün doğumunda parlar.'],
      ['Prometheus', 2, 'İnsanlığa ateşi getiren titan. Meşalesi Gece Bahçesi\'ne yol gösterir.'],
      ['Şarlman', 0, 'Frankların büyük kralı. Defne tacı, birleşmiş Avrupa\'nın sembolü.'],
      ['Leonidas', 1, 'Thermopylae\'nin kahramanı. Kaidede: "Molon labe — gel de al."'],
      ['Marcus Aurelius', 0, 'Filozof imparator. "Gücün sende; dışarıda değil."'],
      ['Orpheus', 4, 'Sesiyle taşları ağlatan ozan. Opera binasındaki "Orphée" onun hikâyesidir.'],
      ['Vercingetorix', 1, 'Galyalıların cesur şefi; Lumière toprakları bir zamanlar onun yurduydu.'],
      ['Selene', 2, 'Ay tanrıçası. Meşalesi Ay Kapısı\'nın gece açılan yolunu simgeler.'],
      ['Hermes', 3, 'Haberci tanrı. Diplomasi pavyonundaki elçilerin koruyucusu sayılır.'],
      ['Akhilleus', 5, 'Truva\'nın yenilmez savaşçısı; topuğu dışında.'],
    ];
    for (let i = 0; i < 7; i++) [-1, 1].forEach((sd, k) => {
      const [nm, v, txt] = HEROES[i * 2 + k], z = z0 + 6 + i * 8.5;
      statue(sd * 6.2, z, v, -sd * Math.PI / 2, 1.0, nm, txt);
      const cy = add(new THREE.ConeGeometry(0.75, 5.5, 10), M.hedgeMat, sd * 9.2, 2.75, z + 4.2); C.circle(sd * 9.2, z + 4.2, 0.6);
      add(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8), M.darkMetal, sd * 5.2, 1.6, z + 4.2); add(new THREE.SphereGeometry(0.2, 10, 8), lampMat, sd * 5.2, 3.3, z + 4.2, root, false); C.circle(sd * 5.2, z + 4.2, 0.2);
    });
    // iki yanda Greko-Romen tapınakçıklar (prostil, İyon sütunlu)
    [-1, 1].forEach(sd => {
      const G = new THREE.Group(); G.position.set(sd * 17, 0, zc); G.rotation.y = -sd * Math.PI / 2; root.add(G);
      for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(9 - k * 0.5, 0.3, 11 - k * 0.5), marble, 0, 0.15 + k * 0.3, 0, G);
      add(new THREE.BoxGeometry(7.6, 5.5, 6), marble, 0, 0.9 + 2.75, -1.6, G);
      for (let i = 0; i < 4; i++){ column(-3 + i * 2, 3.2, 5.6, 0.28, G, marble, marble); }
      G.children.slice(-12).forEach(o => { o.position.y += 0.9; });
      add(new THREE.BoxGeometry(8.2, 0.6, 9.6), marble, 0, 6.8, -0.4, G);
      const pd = add(gableGeo(8.4, 9.8, 1.8), marble, 0, 7.1, -0.4, G);
      statue(...toWorld(G, 0, -1.6 + 3.05), 2, -sd * Math.PI / 2, 0.6);
      C.box(sd * 17, zc, 4.5, 5.5, -sd * Math.PI / 2);
    });
    signPost('Allée des Héros', 7, z1 + 1.5, 0);
  }

  /* =====================================================================
     3. ZAFER TAKI (Triumphal Arch) VE DİKİLİTAŞLAR
     ===================================================================== */
  {
    const A = ARCH;
    const [pc, pg] = canvas(256, 256); pg.fillStyle = '#d9d0bd'; pg.fillRect(0, 0, 256, 256); for (let i = 0; i < 2000; i++){ const v = 180 + rnd() * 60; pg.fillStyle = `rgba(${v},${v - 8 | 0},${v - 22 | 0},.5)`; pg.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
    plane(44, 34, new THREE.MeshStandardMaterial({map:ctex(pc, 6, 5), roughness:0.6}), A.x, 0.06, A.z);
    const archStone = mat(0xe8e0cc, {roughness:0.55});
    // kabartma panoları: alay, savaş ve taç giyme sahneleri
    function relief(seed2, title){
      const [c, g] = canvas(512, 256); g.fillStyle = '#d8ceb6'; g.fillRect(0, 0, 512, 256);
      g.strokeStyle = '#b8ac90'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 244);
      let r2 = seed2; const rr = () => (r2 = (r2 * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9; i++){
        const x = 40 + i * 52 + rr() * 10, h = 120 + rr() * 30, base = 220;
        g.fillStyle = 'rgba(90,80,62,.55)'; g.beginPath(); g.ellipse(x + 3, base - h + 3, 13, 15, 0, 0, Math.PI * 2); g.fill(); g.fillRect(x - 13, base - h + 18, 32, h - 18);
        g.fillStyle = '#efe6d2'; g.beginPath(); g.ellipse(x, base - h, 13, 15, 0, 0, Math.PI * 2); g.fill(); g.fillRect(x - 15, base - h + 15, 30, h - 15);
        g.strokeStyle = '#efe6d2'; g.lineWidth = 6; g.beginPath(); g.moveTo(x + 12, base - h + 30); g.lineTo(x + 30, base - h + 5 - rr() * 30); g.stroke();
        if (rr() < 0.4){ g.lineWidth = 3; g.beginPath(); g.moveTo(x + 30, base - h - 40); g.lineTo(x + 30, base); g.stroke(); }
      }
      if (title){ g.fillStyle = '#6a5d48'; g.font = 'bold 22px Georgia, serif'; g.textAlign = 'center'; g.fillText(title, 256, 30); }
      const t = ctex(c); return new THREE.MeshStandardMaterial({map:t, bumpMap:t, bumpScale:2.5, roughness:0.6});
    }
    const G = new THREE.Group(); G.position.set(A.x, 0, A.z); root.add(G);
    const W = 17, D = 6, H = 15, OW = 6.2, OH = 10;
    [-1, 1].forEach(sd => {
      const px = sd * (OW / 2 + (W - OW) / 4);
      add(new THREE.BoxGeometry((W - OW) / 2, 11.2, D), archStone, px, 5.6, 0, G);
      // yan yüzlerde sütunlar ve kabartmalar
      [-1, 1].forEach(fz => {
        [-1, 1].forEach(k => { const cx = px + k * ((W - OW) / 4 - 0.5); const c2 = add(new THREE.CylinderGeometry(0.42, 0.48, 10.5, 16), archStone, cx, 5.25 + 0.5, fz * (D / 2 + 0.45), G); add(new THREE.BoxGeometry(1.2, 0.5, 1.2), archStone, cx, 0.25, fz * (D / 2 + 0.45), G); add(new THREE.CylinderGeometry(0.62, 0.45, 0.5, 16), gold, cx, 11.25, fz * (D / 2 + 0.45), G); });
        const rp = add(new THREE.PlaneGeometry(2.6, 3.4), relief(97 + sd * 13 + fz * 7), px, 7.2, fz * (D / 2 + 0.02), G, false); if (fz < 0) rp.rotation.y = Math.PI;
        const rp2 = add(new THREE.PlaneGeometry(2.6, 1.6), relief(311 + sd * 5 + fz * 3), px, 2.6, fz * (D / 2 + 0.02), G, false); if (fz < 0) rp2.rotation.y = Math.PI;
      });
      C.box(A.x + px, A.z, (W - OW) / 4 + 0.6, D / 2 + 1);
    });
    // kemer köşelikleri ve atik (yazıt): yarım daire kemer, üstü 11.2 m'ye kadar dolu
    const AR = OW / 2, AY = OH - AR, Hs = 11.2 - AY;
    const sp = new THREE.Shape(); sp.moveTo(-AR, 0); sp.lineTo(-AR, Hs); sp.lineTo(AR, Hs); sp.lineTo(AR, 0); sp.absarc(0, 0, AR, 0, Math.PI, false);
    const sg = new THREE.ExtrudeGeometry(sp, {depth:D, bevelEnabled:false, curveSegments:24}); sg.translate(0, AY, -D / 2);
    add(sg, archStone, 0, 0, 0, G);
    add(new THREE.TorusGeometry(AR, 0.22, 8, 32, Math.PI), gold, 0, AY, D / 2 + 0.05, G); add(new THREE.TorusGeometry(AR, 0.22, 8, 32, Math.PI), gold, 0, AY, -D / 2 - 0.05, G);
    add(new THREE.BoxGeometry(W + 0.8, 0.8, D + 0.8), archStone, 0, 11.6, 0, G);
    add(new THREE.BoxGeometry(W - 1, 3.4, D - 0.6), archStone, 0, 13.7, 0, G);
    add(new THREE.BoxGeometry(W + 0.6, 0.5, D + 0.6), archStone, 0, 15.6, 0, G);
    const [ic, ig] = canvas(1024, 160); ig.fillStyle = '#d8ceb6'; ig.fillRect(0, 0, 1024, 160); ig.fillStyle = '#7a6040'; ig.font = 'bold 64px Georgia, serif'; ig.textAlign = 'center'; ig.fillText('VICTORIIS · LVMINIS', 512, 72); ig.font = '44px Georgia, serif'; ig.fillText('MDCCXXIV', 512, 132);
    [-1, 1].forEach(fz => { const ins = add(new THREE.PlaneGeometry(W - 3, 2.4), new THREE.MeshStandardMaterial({map:ctex(ic), roughness:0.5}), 0, 13.7, fz * ((D - 0.6) / 2 + 0.02), G, false); if (fz < 0) ins.rotation.y = Math.PI; });
    // dört atlı zafer arabası (bronz, yeşil patinalı)
    const Q = new THREE.Group(); Q.position.set(0, 15.85, 0); G.add(Q);
    for (let i = 0; i < 4; i++){ const h = world.makeHorse(0x4f7a68, 0x3a5a4a); h.traverse(o => { if (o.isMesh) o.material = bronze; }); h.position.set(-2.1 + i * 1.4, 0, 1.0); h.userData.neck.rotation.x = 0.2 + (i % 2) * 0.15; h.scale.setScalar(1.15); Q.add(h); }
    add(lathe([[0, 0], [1.1, 0], [1.2, 0.9], [0.9, 1.0], [0, 1.0]], 18), bronze, 0, 0.3, -1.4, Q).scale.z = 0.6;
    [-1, 1].forEach(sd => add(new THREE.TorusGeometry(0.8, 0.08, 6, 20), bronze, sd * 1.25, 0.8, -1.4, Q).rotation.y = Math.PI / 2);
    const ch = add(K.statueGeos[3], bronze, 0, 1.0, -1.4, Q); ch.scale.setScalar(1.1);
    interact.push({x:A.x + 4, z:A.z - D / 2 - 2.5, r:3, label:'Zafer Takı\'nı incele', show:() => true, act:() => hooks.ui.dialog([
      {name:'Zafer Takı', text:'Atikteki yazıt: "VICTORIIS · LVMINIS · MDCCXXIV" — Işığın zaferlerine, 1724.'},
      {name:'Zafer Takı', text:'Kabartmalar Lumière kontlarının tarihini anlatır: av köşkünün kuruluşu, büyük kuşatma, kılıcın tapınağa yerleştirilişi ve Kontes Éléonore\'un taç giyişi.'},
      {name:'Zafer Takı', text:'Tepedeki dört atlı zafer arabasını Nike sürer. Bronz zamanla yeşil bir patina tutmuş.'},
    ])});
    // dikilitaşlar
    const [oc, og] = canvas(64, 512); og.fillStyle = '#b8a888'; og.fillRect(0, 0, 64, 512); og.fillStyle = 'rgba(80,66,44,.6)';
    for (let y = 16; y < 500; y += 22){ const k = Math.floor(rnd() * 5); og.beginPath(); if (k === 0) og.arc(32, y, 7, 0, 7); else if (k === 1){ og.moveTo(24, y - 7); og.lineTo(40, y - 7); og.lineTo(32, y + 7); } else if (k === 2) og.fillRect(22, y - 3, 20, 6); else if (k === 3){ og.ellipse(32, y, 10, 5, 0, 0, 7); } else { og.moveTo(26, y + 7); og.lineTo(32, y - 8); og.lineTo(38, y + 7); } og.fill(); }
    const obMat = new THREE.MeshStandardMaterial({map:ctex(oc), bumpMap:ctex(oc), bumpScale:1.5, roughness:0.7});
    [[-12, -10], [12, -10], [-12, 10], [12, 10]].forEach(([dx, dz]) => {
      const x = A.x + dx, z = A.z + dz;
      add(new THREE.BoxGeometry(2.6, 1.2, 2.6), archStone, x, 0.6, z); add(new THREE.BoxGeometry(2.0, 0.6, 2.0), archStone, x, 1.5, z);
      const og2 = new THREE.CylinderGeometry(0.42, 0.7, 13, 4, 1); og2.rotateY(Math.PI / 4);
      add(og2, obMat, x, 1.8 + 6.5, z);
      const py = new THREE.ConeGeometry(0.46, 1.0, 4); py.rotateY(Math.PI / 4); add(py, gold, x, 1.8 + 13.5, z);
      C.circle(x, z, 1.5);
    });
    interact.push({x:A.x - 12, z:A.z - 12.6, r:2.4, label:'Dikilitaşı incele', show:() => true, act:() => say('Dikilitaş', 'Mısır\'dan gemiyle getirilen dört dikilitaştan biri. Hiyeroglifleri okuyan saray âlimleri bunları "güneşin ışınları" diye çevirmiş; tepeleri gerçek altın varakla kaplı.')});
    signPost('Arc de Triomphe de Lumière', 8, A.z + 14, Math.PI);
  }

  /* =====================================================================
     4. IŞILDAYAN GECE BAHÇESİ (Bioluminescent Flora)
     ===================================================================== */
  const glow = {mats:[], heads:[], open:0, flies:null};
  {
    const P = NIGHT, W = 34, D = 26;
    plane(W + 4, D + 4, mat(0x2f4a2c, {roughness:1}), P.x, 0.012, P.z);
    plane(W, 2.6, gravel, P.x, 0.08, P.z); plane(2.6, D, gravel, P.x, 0.085, P.z);
    plane(26, 3.6, gravel, 17, 0.08, P.z);
    // ay havuzu
    disc(3.6, water, P.x, 0.3, P.z); add(new THREE.TorusGeometry(3.7, 0.25, 8, 40), marble, P.x, 0.3, P.z).rotation.x = Math.PI / 2; C.circle(P.x, P.z, 3.9);
    statue(P.x, P.z, 2, 0, 0.7, 'Selene', 'Ay tanrıçası; bahçe onun onuruna yalnızca gece uyanır.');
    // ışıldayan çiçekler: üç renk, gece açılır
    const GLOW = [[0x3ee6ff, 0x1a9ab0], [0xb06aff, 0x6a2ab0], [0x8aff6a, 0x3a9a2a]];
    const headG = new THREE.IcosahedronGeometry(0.11, 0), stemG = new THREE.CylinderGeometry(0.01, 0.014, 0.6, 4); stemG.translate(0, 0.3, 0);
    const stems = new THREE.InstancedMesh(stemG, mat(0x2a5a2a), 1800); let si = 0;
    GLOW.forEach(([em, base], k) => {
      const m = new THREE.MeshStandardMaterial({color:base, emissive:em, emissiveIntensity:0, roughness:0.4}); glow.mats.push(m);
      const im = new THREE.InstancedMesh(headG, m, 600), pts = [];
      for (let b = 0; b < 8; b++){
        const qx = (b % 2 ? 1 : -1), qz = (b % 4 < 2 ? 1 : -1), bx = P.x + qx * (5 + rnd() * 10), bz = P.z + qz * (3.5 + rnd() * 7.5);
        for (let i = 0; i < 75 && pts.length < 600; i++){ const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 2.2; pts.push([bx + Math.cos(a) * r, bz + Math.sin(a) * r, 0.5 + rnd() * 0.5]); }
      }
      im.count = pts.length; root.add(im); glow.heads.push({im, pts});
      pts.forEach(([x, z, h], i) => { m4.compose(L(x, h * 0.84, z), q4.identity(), s4.set(0.35, 0.21, 0.35)); im.setMatrixAt(i, m4); });
      pts.forEach(([x, z, h]) => { if (si < 1800){ m4.compose(L(x, 0, z), q4.identity(), s4.set(1, h * 1.4, 1)); stems.setMatrixAt(si++, m4); } });
    });
    stems.count = si; root.add(stems);
    // ışıldayan mantarlar ve nilüferler
    const shroom = new THREE.MeshStandardMaterial({color:0x2a4aa8, emissive:0x4a8aff, emissiveIntensity:0, roughness:0.5}); glow.mats.push(shroom);
    const sm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), shroom, 80);
    for (let i = 0; i < 80; i++){ const a = rnd() * 6.28, r = 12 + rnd() * 5; const s = 0.6 + rnd() * 0.9; m4.compose(L(P.x + Math.cos(a) * r * 1.2, 0.05, P.z + Math.sin(a) * r * 0.8), q4.identity(), s4.set(s, s * 0.7, s)); sm.setMatrixAt(i, m4); }
    root.add(sm);
    const lily = new THREE.MeshStandardMaterial({color:0x6a3a8a, emissive:0xff7ae6, emissiveIntensity:0, roughness:0.4}); glow.mats.push(lily);
    for (let i = 0; i < 8; i++){ const a = i / 8 * 6.28 + 0.3, r = 1.6 + (i % 3) * 0.5; add(new THREE.IcosahedronGeometry(0.16, 0), lily, P.x + Math.cos(a) * r, 0.34, P.z + Math.sin(a) * r, root, false).scale.y = 0.5; }
    // mor salkımlı (wisteria) pergola: sarkan ışıklı salkımlar
    const wis = new THREE.MeshStandardMaterial({color:0x8a6ad8, emissive:0xc08aff, emissiveIntensity:0, roughness:0.5}); glow.mats.push(wis);
    for (let i = 0; i < 6; i++){ const x = P.x - 14 + i * 2.4; [-1.6, 1.6].forEach(dz => { add(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), darkWood, x, 1.5, P.z + dz); C.circle(x, P.z + dz, 0.15); }); add(new THREE.BoxGeometry(0.12, 0.12, 3.8), darkWood, x, 3.05, P.z); }
    add(new THREE.BoxGeometry(12.5, 0.1, 0.1), darkWood, P.x - 8, 3.15, P.z - 1.6); add(new THREE.BoxGeometry(12.5, 0.1, 0.1), darkWood, P.x - 8, 3.15, P.z + 1.6);
    const drop = new THREE.ConeGeometry(0.12, 0.7, 6); drop.rotateX(Math.PI); const wm = new THREE.InstancedMesh(drop, wis, 70);
    for (let i = 0; i < 70; i++){ m4.makeTranslation(P.x - 14 + rnd() * 12, 2.6 + rnd() * 0.3, P.z - 1.8 + rnd() * 3.6); wm.setMatrixAt(i, m4); }
    root.add(wm);
    // pirinç fenerler
    const lantGlass = new THREE.MeshStandardMaterial({color:0xffe0a0, emissive:0xffb050, emissiveIntensity:0, roughness:0.2, transparent:true, opacity:0.9}); glow.mats.push(lantGlass);
    [[-15, -1.6], [-15, 1.6], [15, -1.6], [15, 1.6], [-1.6, -11], [1.6, -11], [-1.6, 11], [1.6, 11], [-8, 8], [8, -8], [8, 8], [-8, -8]].forEach(([dx, dz]) => {
      const x = P.x + dx, z = P.z + dz;
      add(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 8), brass, x, 1.1, z); add(new THREE.BoxGeometry(0.34, 0.45, 0.34), lantGlass, x, 2.45, z);
      add(new THREE.ConeGeometry(0.3, 0.3, 4), brass, x, 2.82, z).rotation.y = Math.PI / 4; [-1, 1].forEach(a => [-1, 1].forEach(b => add(new THREE.BoxGeometry(0.03, 0.47, 0.03), brass, x + a * 0.17, 2.45, z + b * 0.17)));
      C.circle(x, z, 0.15);
    });
    // kristal mumluklar (dört masa)
    [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(([dx, dz]) => {
      const x = P.x + dx, z = P.z + dz;
      add(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 18), marble, x, 0.9, z); add(new THREE.CylinderGeometry(0.08, 0.2, 0.85, 10), marble, x, 0.45, z);
      add(lathe([[0, 0], [0.18, 0], [0.06, 0.1], [0.05, 0.4], [0.2, 0.5], [0, 0.52]], 12), crystal, x, 0.93, z, root, false);
      [0, 1, 2].forEach(k => { const a = k * 2.1; add(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 4), crystal, x + Math.cos(a) * 0.18, 1.38, z + Math.sin(a) * 0.18, root, false); candle(x + Math.cos(a) * 0.2, 1.5, z + Math.sin(a) * 0.2); });
      candle(x, 1.45, z, root, 0.28); C.circle(x, z, 0.65);
    });
    // ateşböcekleri
    const NF = 160, fg = new THREE.BufferGeometry(), fp = new Float32Array(NF * 3), fs = [];
    for (let i = 0; i < NF; i++) fs.push({x:P.x + (rnd() - 0.5) * W, z:P.z + (rnd() - 0.5) * D, y:0.5 + rnd() * 2.2, ph:rnd() * 6, w:0.3 + rnd() * 0.6});
    fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const [fc, fgc] = canvas(32, 32); const gr = fgc.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(200,255,120,.8)'); gr.addColorStop(1, 'rgba(120,255,60,0)'); fgc.fillStyle = gr; fgc.fillRect(0, 0, 32, 32);
    const flyMat = new THREE.PointsMaterial({size:0.35, map:new THREE.CanvasTexture(fc), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false, opacity:0});
    const flies = new THREE.Points(fg, flyMat); flies.frustumCulled = false; root.add(flies); glow.flies = {flies, fp, fs, flyMat, fg};
    const sera = lady(0x2a5a3a, 0xa86a3a);
    placeNPC(sera, P.x + 4.5, P.z - 3.2, 0, 'Bahçıvan Séraphine', () => say('Bahçıvan Séraphine', world.W.night > 0.5
      ? 'İşte! Ay ışığı çiçekleri uyandırdı. Mavi olanlar Peru\'dan gelen "ay laleleri", morlar ise Japon salkımları. Fenerleri bile bu ışıkta kıskanırım.'
      : 'Bu bahçe gündüz uyur. Çiçekler yalnızca gece açar ve kendi ışıklarıyla parlar. Güneş saatiyle zamanı geceye ilerletip tekrar gel.'));
    signPost('Jardin de Nuit', P.x - W / 2 - 1.5, P.z + 4, Math.PI / 2);
  }

  /* =====================================================================
     5. SAAT KULESİ VE ÇAN
     ===================================================================== */
  const clock = {faces:[], gears:[], bell:null, lastHour:-1, swing:0};
  {
    const P = CLOCK;
    disc(10, gravel, P.x, 0.07, P.z);
    plane(3.6, 20, gravel, P.x, 0.075, P.z - 19); plane(30, 3.6, gravel, P.x - 25, 0.075, P.z - 4);
    const G = new THREE.Group(); G.position.set(P.x, 0, P.z); root.add(G);
    add(new THREE.BoxGeometry(8, 1, 8), stone, 0, 0.5, 0, G);
    add(new THREE.BoxGeometry(7, 5, 7), stone, 0, 3.5, 0, G);
    add(new THREE.BoxGeometry(6, 16, 6), mat(0xe8dcc4, {roughness:0.8}), 0, 14, 0, G);
    [6, 12, 18].forEach(y => add(new THREE.BoxGeometry(6.4, 0.35, 6.4), cream, 0, y, 0, G));
    for (let i = 0; i < 4; i++){ const a = i * Math.PI / 2; [-1, 1].forEach(s => { const x = Math.sin(a) * 3.05 + Math.cos(a) * s * 3.05, z = Math.cos(a) * 3.05 - Math.sin(a) * s * 3.05; add(new THREE.BoxGeometry(0.35, 16, 0.35), cream, x, 14, z, G); }); }
    // dişli penceresi (önde): dönen pirinç dişliler
    const gw = add(new THREE.PlaneGeometry(3.4, 4.2), mat(0x1a1410, {roughness:0.9}), 0, 14.2, 3.03, G, false);
    function gear(r, teeth){ const g = new THREE.Group(); g.userData.dyn = true; add(new THREE.CylinderGeometry(r, r, 0.12, 24), brass, 0, 0, 0, g).rotation.x = Math.PI / 2; for (let i = 0; i < teeth; i++){ const a = i / teeth * Math.PI * 2; const t = add(new THREE.BoxGeometry(0.14, 0.2, 0.12), brass, Math.cos(a) * (r + 0.08), Math.sin(a) * (r + 0.08), 0, g); t.rotation.z = a; } add(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), M.darkMetal, 0, 0, 0, g).rotation.x = Math.PI / 2; return g; }
    [[0.9, 18, -0.6, 14.9, 1], [0.55, 11, 0.85, 13.6, -1.64], [0.4, 8, 0.2, 12.7, 2.25]].forEach(([r, n, x, y, w]) => { const g = gear(r, n); g.position.set(x, y, 3.1); G.add(g); clock.gears.push({g, w}); });
    const gl = add(new THREE.PlaneGeometry(3.4, 4.2), glass, 0, 14.2, 3.25, G, false); gl.renderOrder = 2;
    add(new THREE.BoxGeometry(3.7, 0.2, 0.2), brass, 0, 16.4, 3.2, G); add(new THREE.BoxGeometry(3.7, 0.2, 0.2), brass, 0, 12.0, 3.2, G);
    // saat katı: dört kadran
    add(new THREE.BoxGeometry(7, 6, 7), mat(0xe8dcc4, {roughness:0.8}), 0, 25, 0, G);
    const [cc, cg] = canvas(256, 256); cg.fillStyle = '#f4ead6'; cg.beginPath(); cg.arc(128, 128, 124, 0, 7); cg.fill(); cg.strokeStyle = '#c9a24a'; cg.lineWidth = 8; cg.stroke();
    cg.fillStyle = '#1d2a5a'; cg.font = 'bold 26px Georgia, serif'; cg.textAlign = 'center'; cg.textBaseline = 'middle';
    ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((t, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2; cg.fillText(t, 128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96); });
    const faceMat = new THREE.MeshStandardMaterial({map:ctex(cc), roughness:0.5, emissive:0xffe8b0, emissiveIntensity:0});
    clock.faceMat = faceMat;
    for (let i = 0; i < 4; i++){
      const a = i * Math.PI / 2, fx = Math.sin(a) * 3.53, fz = Math.cos(a) * 3.53;
      const f = add(new THREE.CircleGeometry(2.3, 40), faceMat, fx, 25, fz, G, false); f.rotation.y = a;
      add(new THREE.TorusGeometry(2.35, 0.14, 8, 40), gold, fx, 25, fz, G).rotation.y = a;
      const hands = new THREE.Group(); hands.position.set(Math.sin(a) * 3.62, 25, Math.cos(a) * 3.62); hands.rotation.y = a; hands.userData.dyn = true; G.add(hands);
      const hh = new THREE.Group(), hm = new THREE.Group(); hh.userData.anim = hm.userData.anim = true; hands.add(hh, hm);
      add(new THREE.BoxGeometry(0.16, 1.2, 0.05), M.darkMetal, 0, 0.5, 0, hh, false); add(new THREE.BoxGeometry(0.1, 1.85, 0.05), M.darkMetal, 0, 0.8, 0.04, hm, false);
      clock.faces.push({hh, hm});
    }
    // açık çan katı ve çan
    add(new THREE.BoxGeometry(7.4, 0.5, 7.4), cream, 0, 28.2, 0, G);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => column(a * 3, b * 3, 5.5, 0.38, (() => { const g = new THREE.Group(); g.position.set(0, 28.4, 0); G.add(g); return g; })(), cream, gold));
    add(new THREE.BoxGeometry(7.4, 0.6, 7.4), cream, 0, 34.1, 0, G);
    const bellP = new THREE.Group(); bellP.position.set(0, 33.2, 0); bellP.userData.dyn = true; G.add(bellP);
    add(lathe([[0, 0], [0.3, 0], [0.55, -0.4], [0.75, -1.3], [1.05, -1.9], [1.1, -2.0], [0, -2.0]], 24), brass, 0, 0, 0, bellP);
    add(new THREE.BoxGeometry(2.6, 0.2, 0.2), darkWood, 0, 0.1, 0, bellP);
    clock.bell = bellP;
    // kubbe ve sivri tepe
    add(new THREE.SphereGeometry(3.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), slate, 0, 34.4, 0, G).scale.y = 0.9;
    add(new THREE.CylinderGeometry(0.4, 0.6, 2.4, 10), cream, 0, 38.6, 0, G); add(new THREE.ConeGeometry(0.4, 3, 10), gold, 0, 41.3, 0, G); add(new THREE.SphereGeometry(0.3, 10, 8), gold, 0, 43, 0, G);
    add(new THREE.BoxGeometry(2, 3.2, 0.15), M.doorMat, 0, 2.6, 3.56, G);
    C.box(P.x, P.z, 4, 4);
    signBoard('Tour de l\'Horloge', 0, 6.8, 3.56, 0, 4, G);
    const aug = npc({coat:0x3a2a1a, apron:0x6a4a2e});
    placeNPC(aug, P.x + 3.2, P.z + 5.5, 0, 'Saatçi Augustin', async () => {
      const c = await hooks.ui.dialog([{name:'Saatçi Augustin', text:'Bu saat tam kırk yıldır bir saniye bile şaşmadı! Pirinç dişlileri elle dövdüm. Her saat başı Lumière ezgisini çalar. Dinlemek ister misin?', choices:['Ezgiyi çal', 'Dişlileri anlat']}]);
      if (c === 0){ chime(new Date().getHours(), 0); hooks.ui.toast('♪ Saat kulesi çalıyor', 2400); }
      else await say('Saatçi Augustin', 'Büyük çark saatte bir döner, küçükler onu takip eder. Ağırlıklar her pazar sabahı kurulur; o gün bana çay getiren olursa çan sesini de ona ithaf ederim.');
    });
  }
  function chime(hour, dist){
    const A = hooks.audio; if (!A || !A.ctx) return;
    const vol = Math.max(0, 1 - dist / 260); if (vol <= 0) return;
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12), b = 0.55;
    const bell = (f, at, v) => { [[1, 1], [2.0, 0.5], [2.4, 0.35], [3.0, 0.25], [4.2, 0.15]].forEach(([k, a]) => A.tone(f * k, 2.8 / k + 0.6, 'sine', v * a * 0.09 * vol, at, A.musicBus)); };
    // Lumière ezgisi (dört dörtlük) ve ardından saat vuruşları
    const Q = [[68, 66, 64, 59], [64, 68, 66, 59], [64, 66, 68, 64], [68, 64, 66, 59]];
    Q.forEach((q, k) => q.forEach((n, i) => bell(mtof(n), (k * 5 + i) * b, 1)));
    const h = ((hour % 12) || 12);
    for (let i = 0; i < h; i++) bell(mtof(52), (21 + i * 2.2) * b, 1.4);
    clock.swing = 21 * b + h * 2.2 * b + 2;
  }

  /* =====================================================================
     6. DİPLOMASİ VE ZİYAFET PAVYONU
     ===================================================================== */
  {
    const P = DIPLO, W = 30, D = 20, H = 9;
    const G = new THREE.Group(); G.position.set(P.x, 0, P.z); root.add(G);
    const wallM = mat(0xeee2c8, {roughness:0.8});
    add(new THREE.BoxGeometry(W + 1, 0.5, D + 1), stone, 0, 0.25, 0, G);
    plane(W - 0.4, D - 0.4, mat(0x8a5a3a, {roughness:0.35}), P.x, 0.51, P.z);
    C.heightFns.push((x, z) => (Math.abs(x - P.x) < W / 2 + 0.5 && Math.abs(z - P.z) < D / 2 + 0.5) ? 0.5 : null);
    add(new THREE.BoxGeometry(W, H, 0.6), wallM, 0, H / 2, -D / 2 + 0.3, G); C.box(P.x, P.z - D / 2 + 0.3, W / 2, 0.35);
    [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.6, H, D), wallM, sd * (W / 2 - 0.3), H / 2, 0, G); C.box(P.x + sd * (W / 2 - 0.3), P.z, 0.35, D / 2); });
    // ön cephe: açık revak
    for (let i = 0; i < 8; i++){ const x = -W / 2 + 1.5 + i * (W - 3) / 7; column(x, D / 2 - 0.6, H, 0.4, G, marble, gold); C.circle(P.x + x, P.z + D / 2 - 0.6, 0.5); }
    add(new THREE.BoxGeometry(W + 0.6, 1.2, D + 0.6), cream, 0, H + 0.6, 0, G);
    add(new THREE.BoxGeometry(W - 1, 0.2, D - 1), mat(0xd8c49a, {roughness:0.6, side:THREE.DoubleSide}), 0, H - 0.1, 0, G);
    const [pc, pg] = canvas(512, 256); const gr = pg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#8ab0d8'); gr.addColorStop(1, '#f2e2c0'); pg.fillStyle = gr; pg.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 30; i++){ pg.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.4})`; pg.beginPath(); pg.ellipse(rnd() * 512, rnd() * 256, 30 + rnd() * 50, 10 + rnd() * 15, 0, 0, 7); pg.fill(); }
    pg.strokeStyle = '#c9a24a'; pg.lineWidth = 14; pg.strokeRect(7, 7, 498, 242);
    const ceil = add(new THREE.PlaneGeometry(W - 2, D - 2), new THREE.MeshStandardMaterial({map:ctex(pc), roughness:0.8}), 0, H - 0.22, 0, G, false); ceil.rotation.x = Math.PI / 2;
    add(gableGeo(D + 1.2, W + 1, 3.2), slate, 0, H + 1.2, 0, G).rotation.y = Math.PI / 2;
    add(gableGeo(W * 0.6, 1.2, 2.4), cream, 0, H + 1.2, D / 2 + 0.3, G);
    signBoard('Pavillon des Ambassadeurs', 0, H + 0.6, D / 2 + 0.32, 0, 7, G);
    // uzun ziyafet masası, sandalyeler, mumlar
    add(new THREE.BoxGeometry(16, 0.12, 1.8), darkWood, 0, 1.32, 0, G); add(new THREE.BoxGeometry(16.2, 0.04, 2.0), mat(0xf4f0e6), 0, 1.39, 0, G);
    [-7.4, 7.4].forEach(x => [-0.7, 0.7].forEach(z => add(new THREE.BoxGeometry(0.12, 0.8, 0.12), darkWood, x, 0.9, z, G)));
    C.box(P.x, P.z, 8.2, 1.1);
    for (let i = 0; i < 8; i++) [-1, 1].forEach(sd => { const x = -7 + i * 2; const ch = new THREE.Group(); ch.position.set(x, 0.5, sd * 1.5); ch.rotation.y = sd > 0 ? Math.PI : 0; G.add(ch); add(new THREE.BoxGeometry(0.55, 0.08, 0.5), mat(0x7a0f1c, {roughness:0.9}), 0, 0.5, 0, ch); add(new THREE.BoxGeometry(0.55, 0.9, 0.08), gold, 0, 0.95, -0.25, ch); [-0.22, 0.22].forEach(a => [-0.2, 0.2].forEach(b => add(new THREE.BoxGeometry(0.05, 0.5, 0.05), gold, a, 0.25, b, ch))); });
    for (let i = 0; i < 5; i++){ const x = -6 + i * 3; add(lathe([[0, 0], [0.12, 0], [0.04, 0.1], [0.03, 0.4], [0.1, 0.45], [0, 0.46]], 10), gold, x, 1.4, 0, G); [-0.15, 0, 0.15].forEach(dx => candle(x + dx + P.x, 1.86, P.z, root, 0.18)); }
    for (let i = 0; i < 10; i++) [-0.5, 0.5].forEach(z => add(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16), mat(0xffffff, {roughness:0.2}), -7 + i * 1.6, 1.42, z, G));
    // taht kürsüsü ve sayvan
    add(new THREE.BoxGeometry(6, 0.4, 3), mat(0x7a0f1c, {roughness:0.9}), 0, 0.7, -D / 2 + 2.4, G); C.box(P.x, P.z - D / 2 + 2.4, 3, 1.5);
    [-1, 1].forEach(sd => { const th = new THREE.Group(); th.position.set(sd * 1.2, 0.9, -D / 2 + 2.4); G.add(th); add(new THREE.BoxGeometry(1, 0.15, 0.9), mat(0x1d3a8a, {roughness:0.9}), 0, 0.5, 0, th); add(new THREE.BoxGeometry(1.1, 2.2, 0.15), gold, 0, 1.4, -0.4, th); add(new THREE.SphereGeometry(0.14, 10, 8), gold, 0, 2.55, -0.4, th); });
    add(new THREE.BoxGeometry(5, 0.1, 2), mat(0x7a0f1c, {roughness:0.9, side:THREE.DoubleSide}), 0, 5.4, -D / 2 + 1.6, G);
    // yabancı krallıkların sancakları
    const FLAGS = [['#c8102e', '#ffffff', 'cross'], ['#1d3a8a', '#d4af37', 'lily'], ['#c8102e', '#d4af37', 'stripe'], ['#2a6a3a', '#ffffff', 'moon'], ['#d4af37', '#1a1a1a', 'eagle'], ['#ffffff', '#c8102e', 'cross']];
    FLAGS.forEach(([a, b, k], i) => {
      const [fc, fg] = canvas(128, 256); fg.fillStyle = a; fg.fillRect(0, 0, 128, 256); fg.fillStyle = b;
      if (k === 'cross'){ fg.fillRect(52, 0, 24, 220); fg.fillRect(0, 70, 128, 24); }
      else if (k === 'lily'){ for (let j = 0; j < 3; j++){ fg.beginPath(); fg.arc(64, 50 + j * 60, 16, 0, 7); fg.fill(); } }
      else if (k === 'stripe'){ for (let j = 0; j < 4; j++) fg.fillRect(12 + j * 30, 0, 14, 230); }
      else if (k === 'moon'){ fg.beginPath(); fg.arc(64, 100, 34, 0, 7); fg.fill(); fg.fillStyle = a; fg.beginPath(); fg.arc(76, 94, 30, 0, 7); fg.fill(); }
      else { fg.beginPath(); fg.moveTo(64, 50); fg.lineTo(110, 120); fg.lineTo(64, 100); fg.lineTo(18, 120); fg.fill(); }
      fg.fillStyle = a; fg.beginPath(); fg.moveTo(0, 256); fg.lineTo(64, 216); fg.lineTo(128, 256); fg.fill();
      fg.clearRect(0, 240, 128, 16);
      const x = -W / 2 + 3 + i * (W - 6) / 5, side = i < 3;
      const fl = add(new THREE.PlaneGeometry(1.4, 2.8), new THREE.MeshStandardMaterial({map:ctex(fc), roughness:0.8, side:THREE.DoubleSide, transparent:true, alphaTest:0.5}), x, H - 2.4, -D / 2 + 0.65, G, false);
      add(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 6), gold, x, H - 0.95, -D / 2 + 0.68, G).rotation.z = Math.PI / 2;
    });
    // dünya haritası tablosu ve yerküre
    const [mc, mg] = canvas(512, 256); mg.fillStyle = '#d8c8a0'; mg.fillRect(0, 0, 512, 256); mg.fillStyle = '#9ab07a';
    [[90, 80, 70, 50], [140, 170, 40, 60], [250, 70, 60, 40], [270, 150, 45, 60], [380, 90, 90, 55], [430, 190, 40, 25]].forEach(([x, y, a, b]) => { mg.beginPath(); mg.ellipse(x, y, a, b, rnd(), 0, 7); mg.fill(); });
    mg.strokeStyle = '#6a5a3a'; mg.lineWidth = 1; for (let i = 0; i < 12; i++){ mg.beginPath(); mg.moveTo(i * 43, 0); mg.lineTo(i * 43, 256); mg.moveTo(0, i * 22); mg.lineTo(512, i * 22); mg.stroke(); }
    mg.strokeStyle = '#c9a24a'; mg.lineWidth = 10; mg.strokeRect(5, 5, 502, 246);
    [-1, 1].forEach(sd => { const mp = add(new THREE.PlaneGeometry(8, 4), new THREE.MeshStandardMaterial({map:ctex(mc), roughness:0.7}), sd * (W / 2 - 0.62), 4.4, 0, G, false); mp.rotation.y = -sd * Math.PI / 2; });
    add(new THREE.SphereGeometry(0.6, 20, 14), mat(0x6a8ab0, {roughness:0.5}), W / 2 - 3, 1.7, 3, G); add(new THREE.TorusGeometry(0.68, 0.04, 6, 24), brass, W / 2 - 3, 1.7, 3, G); add(new THREE.CylinderGeometry(0.1, 0.35, 1.1, 10), darkWood, W / 2 - 3, 0.95, 3, G); C.circle(P.x + W / 2 - 3, P.z + 3, 0.6);
    const chanc = npc({coat:0x1d2a5a});
    placeNPC(chanc, P.x - 4, P.z + 4.2, 0, 'Şansölye Delacroix', async () => {
      const st = S().notes;
      const c = await hooks.ui.dialog([
        {name:'Şansölye Delacroix', text:'Burada krallıkların kaderi bir kadeh şarabın üzerinde belirlenir. Bu akşam üç elçi kabul bekliyor. Kimi önce ağırlayalım?', choices:['Venedik Doçu\'nun elçisi', 'Osmanlı sefiri', 'İspanya dükü']},
      ]);
      const R = [
        ['Venedik elçisi kanal için gondolcularına teşekkür etti ve karşılığında Murano camından iki avize armağan etti. Ayna Galerisi\'ne asılacak.', 'Venedik ile ticaret anlaşması'],
        ['Osmanlı sefiri lale soğanları ve bir sandık kahve getirdi. Kontes, Gece Bahçesi\'ne lale ekilmesini emretti. Dostluk mektupları mühürlendi.', 'Osmanlı ile dostluk mektubu'],
        ['İspanya dükü at yetiştiriciliğine hayran kaldı; Endülüs atlarından bir çift Haras\'a gönderilecek. Karşılığında Lumière şarabı isteniyor!', 'İspanya ile at ve şarap takası'],
      ][c];
      hooks.sfx('quest'); await say('Şansölye Delacroix', R[0]);
      st.treaties = Array.from(new Set((st.treaties || []).concat(c))); hooks.ui.toast('Diplomasi: ' + R[1] + ' (' + st.treaties.length + '/3)', 2800); hooks.save();
    });
  }

  /* =====================================================================
     7. MASKELİ BALO SALONU VE AYNA GALERİSİ
     ===================================================================== */
  const masq = {couples:[], t:0, cube:null, cam:null, timer:0, heroMask:null};
  {
    const P = MASKH, W = 34, D = 16, H = 10;
    const G = new THREE.Group(); G.position.set(P.x, 0, P.z); root.add(G);
    const wallM = mat(0xf0e4c8, {roughness:0.6});
    add(new THREE.BoxGeometry(W + 1, 0.5, D + 1), stone, 0, 0.25, 0, G);
    C.heightFns.push((x, z) => (Math.abs(x - P.x) < W / 2 + 0.5 && Math.abs(z - P.z) < D / 2 + 0.5) ? 0.5 : null);
    const floorM = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.15});
    new THREE.TextureLoader().load('assets/textures/ahsap.jpg', t => { t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 5); floorM.map = t; floorM.needsUpdate = true; });
    floorM.color.set(0xc89a6a);
    plane(W - 0.4, D - 0.4, floorM, P.x, 0.51, P.z);
    // duvarlar (ön ortada kapı)
    add(new THREE.BoxGeometry(W, H, 0.6), wallM, 0, H / 2, -D / 2 + 0.3, G); C.box(P.x, P.z - D / 2 + 0.3, W / 2, 0.35);
    [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.6, H, D), wallM, sd * (W / 2 - 0.3), H / 2, 0, G); C.box(P.x + sd * (W / 2 - 0.3), P.z, 0.35, D / 2); });
    [-1, 1].forEach(sd => { const w2 = W / 2 - 1.6; add(new THREE.BoxGeometry(w2, H, 0.6), wallM, sd * (1.6 + w2 / 2), H / 2, D / 2 - 0.3, G); C.box(P.x + sd * (1.6 + w2 / 2), P.z + D / 2 - 0.3, w2 / 2, 0.35); });
    add(new THREE.BoxGeometry(3.2, H - 4, 0.6), wallM, 0, 4 + (H - 4) / 2, D / 2 - 0.3, G);
    add(new THREE.TorusGeometry(1.6, 0.15, 8, 24, Math.PI), gold, 0, 4, D / 2 + 0.02, G).scale.y = 0.5;
    add(new THREE.BoxGeometry(W + 0.8, 0.8, D + 0.8), cream, 0, H + 0.4, 0, G);
    add(K.frustum(W + 0.6, D + 0.6, 3.6, 4), slate, 0, H + 0.8 + 1.8, 0, G);
    // ön duvarda kemerli pencereler, arka duvarda karşılarında aynalar (Versailles düzeni)
    const N = 9, step = (W - 4) / N;
    const cubeRT = new THREE.WebGLCubeRenderTarget(256, {type:THREE.HalfFloatType}); masq.cube = cubeRT;
    const cubeCam = new THREE.CubeCamera(0.3, 90, cubeRT); cubeCam.position.set(P.x, 2.6, P.z); cubeCam.layers.set(2); cubeCam.children.forEach(c => c.layers.set(2)); scene.add(cubeCam); masq.cam = cubeCam;
    world.sun.layers.enable(2); world.hemi.layers.enable(2);   // ayna kamerası da güneşi ve gök ışığını görsün
    const mirror = new THREE.MeshStandardMaterial({color:0xfffaf0, metalness:1, roughness:0.04, envMap:cubeRT.texture, envMapIntensity:1.5});
    // iç taraftaki pencereler gündüz dışarıdan gelen ışıkla parlar
    const dayWin = new THREE.MeshStandardMaterial({color:0x101418, roughness:0.2, emissive:0xdce8f2, emissiveIntensity:1.2}); masq.dayWin = dayWin;
    masq.mirror = mirror;
    for (let i = 0; i < N; i++){
      const x = -W / 2 + 2 + (i + 0.5) * step;
      // ayna kemeri (arka duvar): küçük parçalara bölünmüş ayna camları
      for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 2; c2++){ add(new THREE.PlaneGeometry(1.1, 1.3), mirror, x - 0.58 + c2 * 1.16, 1.7 + r * 1.36, -D / 2 + 0.62, G, false); }
      add(new THREE.CircleGeometry(1.15, 20, 0, Math.PI), mirror, x, 7.1, -D / 2 + 0.62, G, false);
      add(new THREE.TorusGeometry(1.2, 0.08, 6, 20, Math.PI), gold, x, 7.1, -D / 2 + 0.66, G);
      [-1.25, 1.25].forEach(dx => add(new THREE.BoxGeometry(0.16, 6.1, 0.12), gold, x + dx, 4.0, -D / 2 + 0.66, G));
      add(new THREE.BoxGeometry(2.6, 0.14, 0.12), gold, x, 1.0, -D / 2 + 0.66, G);
      // pilaster (aralar)
      add(new THREE.BoxGeometry(0.5, H - 1, 0.2), mat(0xe8c87a, {metalness:0.6, roughness:0.35}), x + step / 2, (H - 1) / 2 + 0.5, -D / 2 + 0.7, G);
      // ön duvar pencereleri (kapı açıklığı hariç)
      if (Math.abs(x) > 2.4){ const wp = add(new THREE.PlaneGeometry(2.2, 5.4), dayWin, x, 4.0, D / 2 - 0.62, G, false); wp.rotation.y = Math.PI; const wp2 = add(new THREE.PlaneGeometry(2.2, 5.4), winMat, x, 4.0, D / 2 + 0.02, G, false); add(new THREE.TorusGeometry(1.1, 0.08, 6, 20, Math.PI), gold, x, 6.7, D / 2 + 0.05, G); }
    }
    // boyalı tavan
    const [pc, pg] = canvas(1024, 512); const gr = pg.createRadialGradient(512, 256, 50, 512, 256, 520); gr.addColorStop(0, '#f6e7c2'); gr.addColorStop(0.5, '#9ab8d8'); gr.addColorStop(1, '#5a6a8a'); pg.fillStyle = gr; pg.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 40; i++){ pg.fillStyle = `rgba(255,250,240,${0.25 + rnd() * 0.4})`; pg.beginPath(); pg.ellipse(rnd() * 1024, rnd() * 512, 40 + rnd() * 80, 15 + rnd() * 25, rnd(), 0, 7); pg.fill(); }
    for (let i = 0; i < 12; i++){ const x = 100 + rnd() * 824, y = 80 + rnd() * 350; pg.fillStyle = '#e8c8a8'; pg.beginPath(); pg.ellipse(x, y, 10, 22, rnd(), 0, 7); pg.fill(); pg.fillStyle = '#c8102e'; pg.beginPath(); pg.ellipse(x + 8, y + 10, 18, 8, rnd(), 0, 7); pg.fill(); }
    pg.strokeStyle = '#d4af37'; pg.lineWidth = 22; pg.strokeRect(11, 11, 1002, 490); pg.lineWidth = 8; for (let i = 1; i < 4; i++){ pg.strokeRect(i * 256 - 120, 60, 240, 392); }
    const ceil = add(new THREE.PlaneGeometry(W - 1.2, D - 1.2), new THREE.MeshStandardMaterial({map:ctex(pc), roughness:0.8, emissive:0xffffff, emissiveMap:ctex(pc), emissiveIntensity:0.15}), 0, H - 0.05, 0, G, false); ceil.rotation.x = Math.PI / 2;
    for (let i = 0; i < 5; i++) chandelier(-W / 2 + 4 + i * (W - 8) / 4, H - 1.3, 0, G, 1.1);
    const hallLight = new THREE.PointLight(0xffd8a0, 0, 28, 1.6); hallLight.position.set(P.x, H - 2, P.z); root.add(hallLight); hallLight.layers.enable(2); masq.light = hallLight;
    // maske masası
    add(new THREE.BoxGeometry(2.2, 0.08, 0.9), gold, W / 2 - 3, 1.4, D / 2 - 2, G); add(new THREE.BoxGeometry(2, 0.9, 0.7), mat(0x7a0f1c, {roughness:0.9}), W / 2 - 3, 0.95, D / 2 - 2, G);
    [0xd4af37, 0x1a1a2a, 0xffffff, 0xc8102e].forEach((c, i) => { const mk = mask(c, 1.52, 0); mk.position.set(W / 2 - 3.8 + i * 0.55, 1.5, D / 2 - 2); mk.rotation.x = -1.2; G.add(mk); });
    C.box(P.x + W / 2 - 3, P.z + D / 2 - 2, 1.1, 0.45);
    // maskeli dansçılar
    const gowns = [0xd8b4e2, 0x1a1a2a, 0xc8102e, 0xd4af37, 0x9db0e2], coats = [0x1a1a1a, 0x5a1a2a, 0x1d2a5a, 0x2a2a2a, 0x3a2a1a];
    for (let i = 0; i < 5; i++){
      const c = new THREE.Group(); c.userData.dyn = true; G.add(c);
      const l = lady(gowns[i]); l.position.set(0.32, 0.5, 0); l.rotation.y = -Math.PI / 2; l.add(mask([0xd4af37, 0xffffff, 0x1a1a2a, 0xc8102e, 0xffffff][i], 1.7, 0.1)); c.add(l);
      const m = npc({coat:coats[i]}); m.position.set(-0.32, 0.5, 0); m.rotation.y = Math.PI / 2; m.userData.armL.rotation.x = -1.2; m.userData.armR.rotation.z = 0.9; m.add(mask([0x1a1a2a, 0xd4af37, 0xc8102e, 0xffffff, 0xd4af37][i], 1.8, 0.11)); c.add(m);
      const a = i / 5 * Math.PI * 2; c.position.set(Math.cos(a) * 7, 0, Math.sin(a) * 3); masq.couples.push({c, a, base:[Math.cos(a) * 7, Math.sin(a) * 3]});
    }
    C.dynamics.push(() => masq.couples.map(({c}) => ({x:P.x + c.position.x, z:P.z + c.position.z, r:0.7})));
    G.traverse(o => { o.layers.enable(2); });
    signBoard('Galerie des Glaces · Bal Masqué', 0, H - 1.2, D / 2 + 0.33, 0, 7, G);
    interact.push({x:P.x + W / 2 - 3, z:P.z + D / 2 - 3.2, r:2.2, label:'Maske tak / çıkar', show:() => true, act:() => { const st = S().notes; st.mask = !st.mask; applyMask(); hooks.sfx('blip'); hooks.ui.toast(st.mask ? 'Maskeni taktın. Kimse seni tanımıyor…' : 'Maskeni çıkardın', 2200); hooks.save(); }});
    interact.push({x:P.x, z:P.z, r:3.2, label:'Maskeli baloyu başlat', show:() => masq.t <= 0, act:() => { masq.t = 26; playMinuet(); hooks.ui.toast('♪ Maskeli balo başladı', 2400); }});
    const marq = lady(0x5a1a4a, 0xd8d0c0); marq.add(mask(0x1a1a2a, 1.7, 0.1));
    placeNPC(marq, P.x - W / 2 + 4, P.z + 2, Math.PI / 2, 'Maskeli Markiz', async () => {
      const lines = [
        'Ah, yabancı… Burada kimse adını söylemez. Şunu duydun mu? Şansölye, İspanya düküyle gizlice buluşmuş. Elbette ben söylemedim.',
        'Aynalara iyi bak: Kontes bu galeriyi gerçeği görmek için yaptırdığını söyler. Herkes kendini görür ama kimse yüzünü göstermez.',
        'Kütüphanedeki kırmızı ciltli kitabı hiç çektin mi? Derler ki şarap mahzenine kadar uzanan bir yol varmış. Pşşt!',
      ];
      const k = Math.floor(rnd() * lines.length); if (k === 2) S().notes.secretHint = true;
      await say('Maskeli Markiz', lines[k]);
    });
  }
  function captureMirrors(){
    if (!masq.mirrorMeshes){ masq.mirrorMeshes = []; root.traverse(o => { if (o.material === masq.mirror) masq.mirrorMeshes.push(o); }); }
    masq.mirrorMeshes.forEach(o => { o.visible = false; });
    masq.cam.update(world.renderer, scene);
    masq.mirrorMeshes.forEach(o => { o.visible = true; });
  }
  function applyMask(){
    if (!heroRef) return;
    if (!masq.heroMask){ masq.heroMask = mask(0xd4af37, 1.8, 0.12); heroRef.obj.add(masq.heroMask); masq.heroMask.traverse(o => { o.layers.enable(2); if (o.material) world.atmo && world.atmo.patchMaterial(o.material); }); }
    masq.heroMask.visible = !!S().notes.mask;
  }
  function playMinuet(){
    const A = hooks.audio; if (!A || !A.ctx) return;
    const mtof = n => 440 * Math.pow(2, (n - 69) / 12), t0 = A.ctx.currentTime + 0.05, b = 0.36;
    const mel = [74, 0, 67, 69, 71, 72, 74, 0, 67, 0, 67, 0, 76, 0, 72, 74, 76, 78, 79, 0, 67, 0, 67, 0, 72, 0, 74, 72, 71, 69, 71, 0, 72, 71, 69, 67, 66, 0, 67, 69, 71, 67, 69, 0, 0, 0, 0, 0];
    mel.forEach((n, i) => { if (n) A.pluck(mtof(n), t0 + i * b, 0.1, 1.0); });
    [55, 59, 57, 55, 52, 55, 50, 55, 55, 59, 57, 55, 60, 55, 62, 55].forEach((n, k) => A.pluck(mtof(n - 12), t0 + k * 3 * b, 0.09, 1.3));
  }

  /* =====================================================================
     8. AV KÖŞKÜ VE AV ARAZİSİ
     ===================================================================== */
  const deer = [], rabbits = [];
  {
    const H = HUNT, LG = H.lodge;
    // çit (doğu kapısı z = lodge.z)
    const rails = [], add2 = (x, z, l, a) => rails.push([x, z, l, a]);
    for (let x = H.x0; x < H.x1; x += 4){ add2(x + 2, H.z0, 4, 0); add2(x + 2, H.z1, 4, 0); }
    for (let z = H.z0; z < H.z1; z += 4){ add2(H.x0, z + 2, 4, Math.PI / 2); if (Math.abs(z + 2 - LG.z) > 3) add2(H.x1, z + 2, 4, Math.PI / 2); }
    const rm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.14, 0.1), wood, rails.length * 2), pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 1.7, 0.18), darkWood, rails.length);
    rails.forEach(([x, z, l, a], i) => { [0.6, 1.3].forEach((y, k) => { m4.compose(L(x, y, z), q4.setFromAxisAngle(L(0, 1, 0), a), s4.set(l, 1, 1)); rm.setMatrixAt(i * 2 + k, m4); }); m4.makeTranslation(x - Math.cos(a) * l / 2, 0.85, z + Math.sin(a) * l / 2); pm.setMatrixAt(i, m4); C.box(x, z, a ? 0.1 : l / 2, a ? l / 2 : 0.1); });
    rm.castShadow = pm.castShadow = true; root.add(rm, pm);
    // kapı direkleri ve geyik boynuzlu kemer
    [-3, 3].forEach(dz => { add(new THREE.BoxGeometry(0.5, 4, 0.5), stone, H.x1, 2, LG.z + dz); C.circle(H.x1, LG.z + dz, 0.4); });
    add(new THREE.BoxGeometry(0.4, 0.5, 6.6), darkWood, H.x1, 4.1, LG.z);
    const antler = mat(0xd8c8a8, {roughness:0.6});
    function antlers(x, y, z, s = 1, ry = 0, parent = root){
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g);
      [-1, 1].forEach(sd => { const b = add(new THREE.CylinderGeometry(0.04, 0.06, 0.9, 6), antler, sd * 0.25, 0.4, 0, g); b.rotation.z = -sd * 0.6; for (let k = 0; k < 3; k++){ const t = add(new THREE.CylinderGeometry(0.02, 0.035, 0.35, 5), antler, sd * (0.3 + k * 0.12), 0.45 + k * 0.17, 0.05, g); t.rotation.z = -sd * (k % 2 ? 0.1 : 1.1); } });
      return g;
    }
    antlers(H.x1 + 0.1, 4.4, LG.z, 1.6, Math.PI / 2);
    signPost('Réserve de Chasse', H.x1 + 4, LG.z + 6, -Math.PI / 2);
    // orman: ek ağaçlar (açıklık ve yol hariç)
    const trunks = [], crowns = [];
    for (let i = 0; i < 90; i++){
      const x = H.x0 + 3 + rnd() * (H.x1 - H.x0 - 6), z = H.z0 + 3 + rnd() * (H.z1 - H.z0 - 6);
      if (Math.hypot(x - LG.x, z - LG.z) < 16 || Math.abs(z - LG.z) < 3) continue;
      const k = 0.9 + rnd() * 0.7; trunks.push([x, z, k]); C.circle(x, z, 0.35 * k);
      for (let j = 0; j < 4; j++) crowns.push([x + (rnd() - 0.5) * 2 * k, (3.8 + j * 0.9) * k, z + (rnd() - 0.5) * 2 * k, (1.5 + rnd()) * k, 0.22 + rnd() * 0.08]);
    }
    const tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.3, 3.4, 7).translate(0, 1.7, 0), mat(0x4a3626, {roughness:0.9}), trunks.length);
    trunks.forEach(([x, z, k], i) => { m4.compose(L(x, 0, z), q4.identity(), s4.set(k, k, k)); tm.setMatrixAt(i, m4); });
    const cm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), world.windMat(new THREE.MeshStandardMaterial({roughness:0.85, flatShading:true}), 1.0, true), crowns.length);
    crowns.forEach(([x, y, z, r, h], i) => { m4.compose(L(x, y, z), q4.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), s4.set(r, r * 0.9, r)); cm.setMatrixAt(i, m4); cm.setColorAt(i, col.setHSL(h, 0.42, 0.16 + rnd() * 0.08)); });
    tm.castShadow = cm.castShadow = true; root.add(tm, cm);
    plane(H.x1 - H.x0, H.z1 - H.z0, mat(0x4f6a34, {roughness:1}), (H.x0 + H.x1) / 2, 0.006, (H.z0 + H.z1) / 2);
    plane(112, 3.6, gravel, -116, 0.08, LG.z); plane(22, 3.6, gravel, H.x1 - 11, 0.08, LG.z);
    // av köşkü: taş zemin kat, ahşap üst kat
    const G = new THREE.Group(); G.position.set(LG.x, 0, LG.z); G.rotation.y = Math.PI / 2; root.add(G);
    const rubble = new THREE.MeshStandardMaterial({map:M.stoneMat.map, color:0xa89880, roughness:0.95});
    add(new THREE.BoxGeometry(14, 4, 10), rubble, 0, 2, 0, G);
    add(new THREE.BoxGeometry(14.6, 3.2, 10.6), mat(0x6a4a2e, {roughness:0.85}), 0, 5.6, 0, G);
    for (let i = 0; i <= 7; i++){ add(new THREE.BoxGeometry(0.25, 3.2, 0.12), darkWood, -7.2 + i * 2.06, 5.6, 5.36, G); }
    add(new THREE.BoxGeometry(14.8, 0.25, 0.14), darkWood, 0, 4.1, 5.37, G); add(new THREE.BoxGeometry(14.8, 0.25, 0.14), darkWood, 0, 7.1, 5.37, G);
    add(gableGeo(11.6, 15.4, 4.2), slate, 0, 7.2, 0, G).rotation.y = Math.PI / 2;
    add(new THREE.BoxGeometry(1.4, 5, 1.4), rubble, 4.5, 10.2, -1.5, G);
    K.windows(G, 14, 10, 4, 1, 2.4);
    add(new THREE.BoxGeometry(2.2, 3, 0.12), M.doorMat, 0, 1.5, 5.06, G);
    antlers(0, 3.6, 5.2, 1.3, 0, G);
    // sundurma, banklar ve odun yığını
    add(new THREE.BoxGeometry(8, 0.2, 3), wood, 0, 0.1, 6.6, G);
    [-3.8, 3.8].forEach(x => add(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 8), darkWood, x, 1.8, 7.9, G));
    const pr = add(new THREE.BoxGeometry(8.6, 0.15, 3.4), slate, 0, 3.75, 6.7, G); pr.rotation.x = 0.25;
    for (let i = 0; i < 18; i++){ const lg = add(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 8), mat(0x8a6a4a, {roughness:1}), -6.5 + (i % 6) * 0.34, 0.2 + Math.floor(i / 6) * 0.3, 6.2, G); lg.rotation.x = Math.PI / 2; }
    C.box(LG.x, LG.z, 7.2, 5.2, Math.PI / 2);
    C.box(...toWorld(G, -6.5, 6.2), 1.2, 0.5, Math.PI / 2);
    // gizli kaçış kapağı (yeraltı geçidinin çıkışı)
    add(new THREE.BoxGeometry(1.6, 0.12, 1.6), darkWood, H.hatch.x, 0.06, H.hatch.z); add(new THREE.TorusGeometry(0.16, 0.03, 6, 16), M.darkMetal, H.hatch.x, 0.14, H.hatch.z).rotation.x = Math.PI / 2;
    interact.push({x:H.hatch.x, z:H.hatch.z, r:2, label:'Yosunlu tahta kapak', show:() => true, act:async () => {
      if (!S().notes.secret){ await say('', 'Yaprakların altında demir halkalı, ağır bir tahta kapak. Sıkıca kilitli; aşağıdan sürgülenmiş olmalı.'); return; }
      enterTunnel('E');
    }});
    // geyikler ve tavşanlar
    const fur = mat(0x8a5a32, {roughness:0.85}), belly = mat(0xe8dcc4, {roughness:0.9}), dark = mat(0x2a1a12);
    for (let i = 0; i < 8; i++){
      const g = new THREE.Group(); g.userData.dyn = true;
      add(new THREE.CapsuleGeometry(0.32, 0.9, 6, 10), fur, 0, 1.05, 0, g).rotation.x = Math.PI / 2;
      add(new THREE.SphereGeometry(0.2, 8, 6), belly, 0, 1.0, -0.62, g);
      const nk = add(new THREE.CylinderGeometry(0.12, 0.18, 0.7, 8), fur, 0, 1.45, 0.55, g); nk.rotation.x = 0.55;
      const hd = new THREE.Group(); hd.position.set(0, 1.75, 0.78); g.add(hd);
      const hg = new THREE.ConeGeometry(0.14, 0.45, 8); hg.rotateX(Math.PI / 2); add(hg, fur, 0, 0, 0.12, hd);
      [-1, 1].forEach(sd => { const e = add(new THREE.ConeGeometry(0.06, 0.2, 6), fur, sd * 0.12, 0.12, -0.05, hd); e.rotation.z = -sd * 0.9; add(new THREE.SphereGeometry(0.025, 6, 4), dark, sd * 0.08, 0.04, 0.12, hd); });
      if (i % 3 === 0) antlers(0, 0.08, -0.04, 0.55, 0, hd);
      const legs = [];
      [[-0.15, 0.4], [0.15, 0.4], [-0.15, -0.42], [0.15, -0.42]].forEach(([x, z]) => { const lg = new THREE.Group(); lg.position.set(x, 0.85, z); lg.userData.anim = true; g.add(lg); const lgg = new THREE.CylinderGeometry(0.05, 0.035, 0.85, 6); lgg.translate(0, -0.42, 0); add(lgg, fur, 0, 0, 0, lg); legs.push(lg); });
      g.position.set(H.x0 + 8 + rnd() * (H.x1 - H.x0 - 16), 0, H.z0 + 8 + rnd() * (H.z1 - H.z0 - 16)); root.add(g);
      deer.push({g, legs, hd, target:null, wait:rnd() * 4, phase:0, speed:0, flee:0});
    }
    for (let i = 0; i < 12; i++){
      const g = new THREE.Group(); g.userData.dyn = true; const rf = mat(i % 2 ? 0x9a8a72 : 0x7a6a58, {roughness:0.9});
      add(new THREE.SphereGeometry(0.16, 10, 8), rf, 0, 0.16, 0, g).scale.set(0.9, 0.85, 1.25);
      add(new THREE.SphereGeometry(0.1, 8, 6), rf, 0, 0.27, 0.17, g);
      [-1, 1].forEach(sd => { const e = add(new THREE.CapsuleGeometry(0.025, 0.16, 4, 6), rf, sd * 0.04, 0.42, 0.14, g); e.rotation.z = -sd * 0.15; });
      add(new THREE.SphereGeometry(0.05, 6, 4), belly, 0, 0.2, -0.2, g);
      g.position.set(H.x0 + 6 + rnd() * (H.x1 - H.x0 - 12), 0, H.z0 + 6 + rnd() * (H.z1 - H.z0 - 12)); root.add(g);
      rabbits.push({g, target:null, wait:rnd() * 3, hop:0, flee:0});
    }
    const hunt = npc({coat:0x2a4a2a, apron:0x6a4a2e});
    placeNPC(hunt, ...toWorld(G, 2.5, 7.4), Math.PI / 2, 'Avcıbaşı Mathurin', async () => {
      const c = await hooks.ui.dialog([{name:'Avcıbaşı Mathurin', text:'Hoş geldin, köşke! Bu korulukta geyikler ve tavşanlar özgürce yaşar; Kontes artık av yerine onları izlemeyi seviyor. Ne öğrenmek istersin?', choices:['Hayvanlar', 'Köşkün tarihi', 'Kapağın sırrı']}]);
      if (c === 0) await say('Avcıbaşı Mathurin', 'Sekiz geyik var; üçü boynuzlu erkek. Yaklaşırsan kaçarlar, sessizce yürü. Tavşanlar daha meraklıdır ama onlar da tetikte durur.');
      else if (c === 1) await say('Avcıbaşı Mathurin', 'Burası 1580\'de ilk kontun av köşküydü; şato sonradan geldi. Kapının üstündeki boynuzlar o zamandan kalma, on altı çatallı bir geyikten.');
      else { S().notes.secretHint = true; await say('Avcıbaşı Mathurin', 'O yosunlu kapak mı? Kuşatma zamanından kalma bir kaçış yolu derler. Aşağıdan sürgülü; yolu bilen ancak içeriden açabilir. Şatonun eski kâhyası kütüphanedeki kırmızı ciltli kitaptan söz ederdi…'); }
    });
  }

  /* =====================================================================
     9. GİZLİ GEÇİTLER VE YERALTI SIĞINAĞI
     ===================================================================== */
  const tunnel = {light:null};
  const TMAP = [
    '################################',
    '#####.....######################',
    '#####.....######################',
    '#####.....######################',
    '#####.....######################',
    '#####.....######################',
    '#######.########################',
    '#LL.....................CC######',
    '#LL.....................CC######',
    '#############.##################',
    '#############.##################',
    '#############.##################',
    '#############.##################',
    '############EEE#################',
    '############EEE#################',
    '################################',
  ];
  const TC = TUN.cell, tx = c => TUN.x + c * TC + TC / 2, tz = r => TUN.z + r * TC + TC / 2;
  const tfloor = (r, c) => TMAP[r] && TMAP[r][c] && TMAP[r][c] !== '#';
  const TSPOT = {L:{x:tx(1.5), z:tz(7.5)}, C:{x:tx(24.5), z:tz(7.5)}, E:{x:tx(13), z:tz(13.5)}};
  {
    const TH = 3.4;
    const [bc, bg] = canvas(256, 256); bg.fillStyle = '#5a5248'; bg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++){ const v = 70 + rnd() * 40; bg.fillStyle = `rgb(${v + 10 | 0},${v | 0},${v - 10 | 0})`; bg.fillRect(x * 64 + (y % 2) * 32 + 2, y * 32 + 2, 60, 28); }
    const brickM = new THREE.MeshStandardMaterial({map:ctex(bc, 1, 1.5), roughness:0.95});
    const flagM = new THREE.MeshStandardMaterial({map:M.stoneMat.map, color:0x7a7066, roughness:0.9});
    const walls = [], floors = [];
    TMAP.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== '#'){ floors.push([r, c]); return; }
      let near = false; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (tfloor(r + dr, c + dc)) near = true;
      if (near) walls.push([r, c]);
    }));
    const wm = new THREE.InstancedMesh(new THREE.BoxGeometry(TC, TH + 0.4, TC), brickM, walls.length);
    walls.forEach(([r, c], i) => { m4.makeTranslation(tx(c), (TH + 0.4) / 2, tz(r)); wm.setMatrixAt(i, m4); C.box(tx(c), tz(r), TC / 2, TC / 2); });
    const fm = new THREE.InstancedMesh(new THREE.BoxGeometry(TC, 0.1, TC), flagM, floors.length), cm = new THREE.InstancedMesh(new THREE.BoxGeometry(TC, 0.5, TC), brickM, floors.length);
    floors.forEach(([r, c], i) => { m4.makeTranslation(tx(c), 0.05, tz(r)); fm.setMatrixAt(i, m4); m4.makeTranslation(tx(c), TH + 0.25, tz(r)); cm.setMatrixAt(i, m4); });
    wm.castShadow = cm.castShadow = true; wm.receiveShadow = fm.receiveShadow = cm.receiveShadow = true; root.add(wm, fm, cm);
    // tonoz kaburgaları ve meşaleler (koridor boyunca)
    for (let c = 3; c < 24; c += 3){ const rib = add(new THREE.TorusGeometry(TC, 0.12, 6, 16, Math.PI), brickM, tx(c), TH - 1.5, tz(7.5)); rib.rotation.y = Math.PI / 2; rib.scale.y = 0.7; }
    const torch = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 1.9, z); g.rotation.y = ry; root.add(g); add(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6), darkWood, 0, 0, 0.1, g).rotation.x = 0.5; const f = add(new THREE.ConeGeometry(0.1, 0.3, 6), flameMat, 0, 0.3, 0.22, g, false); f.userData.dyn = true; flames.push(f); };
    for (let c = 4; c < 24; c += 5){ torch(tx(c), tz(6.55), 0); torch(tx(c + 2), tz(8.45), Math.PI); }
    torch(tx(13.45), tz(10.5), -Math.PI / 2); torch(tx(5.55), tz(3), Math.PI / 2); torch(tx(9.45), tz(3), -Math.PI / 2);
    // kütüphane ucu: döner merdiven ve kitaplığın arkası
    for (let i = 0; i < 10; i++){ const a = i * 0.6; add(new THREE.BoxGeometry(1.6, 0.15, 0.6), stone, tx(1.5) - 1.2 + Math.cos(a) * 0.4, 0.2 + i * 0.34, tz(7.5) + Math.sin(a) * 0.4).rotation.y = -a; }
    add(new THREE.BoxGeometry(0.2, TH, 3.6), darkWood, TUN.x + TC + 0.2, TH / 2, tz(7.5));
    // mahzen ucu: basamaklar ve fıçılar
    for (let i = 0; i < 6; i++) add(new THREE.BoxGeometry(0.6, 0.3 + i * 0.3, 3.6), stone, tx(25.5) - 0.2 + i * 0.4, (0.3 + i * 0.3) / 2, tz(7.5));
    const barrel = lathe([[0, -0.6], [0.42, -0.6], [0.5, -0.3], [0.53, 0], [0.5, 0.3], [0.42, 0.6], [0, 0.6]], 14);
    [[22.5, 6.6], [23.2, 6.6]].forEach(([c, r]) => { const b = add(barrel, mat(0x7a4a26, {roughness:0.75}), tx(c), 0.55, tz(r)); b.rotation.z = Math.PI / 2; C.circle(tx(c), tz(r), 0.5); });
    // kaçış ucu: tırmanma merdiveni
    for (let i = 0; i < 8; i++) add(new THREE.BoxGeometry(0.9, 0.06, 0.06), M.darkMetal, tx(13), 0.4 + i * 0.4, tz(14.4));
    [-0.45, 0.45].forEach(dx => add(new THREE.BoxGeometry(0.06, TH, 0.06), M.darkMetal, tx(13) + dx, TH / 2, tz(14.4)));
    // sığınak odası: ranzalar, erzak, masa ve harita, silah rafı, sandık
    const R0 = {x:tx(7), z:tz(3)};
    [[-3.2, -3.4], [3.2, -3.4]].forEach(([dx, dz]) => { add(new THREE.BoxGeometry(2.0, 0.4, 0.9), wood, R0.x + dx, 0.5, R0.z + dz); add(new THREE.BoxGeometry(1.9, 0.15, 0.8), mat(0x8a7a5a, {roughness:1}), R0.x + dx, 0.78, R0.z + dz); add(new THREE.BoxGeometry(2.0, 0.4, 0.9), wood, R0.x + dx, 1.8, R0.z + dz); [-0.95, 0.95].forEach(a => add(new THREE.BoxGeometry(0.1, 2.2, 0.1), darkWood, R0.x + dx + a, 1.1, R0.z + dz + 0.4)); C.box(R0.x + dx, R0.z + dz, 1.05, 0.5); });
    add(new THREE.BoxGeometry(2, 0.1, 1.2), wood, R0.x, 1.0, R0.z); [-0.9, 0.9].forEach(a => [-0.5, 0.5].forEach(b => add(new THREE.BoxGeometry(0.08, 1, 0.08), darkWood, R0.x + a, 0.5, R0.z + b))); C.box(R0.x, R0.z, 1.05, 0.65);
    const [mc, mg] = canvas(256, 160); mg.fillStyle = '#d8c8a0'; mg.fillRect(0, 0, 256, 160); mg.strokeStyle = '#6a3a1a'; mg.lineWidth = 3; mg.beginPath(); mg.moveTo(20, 80); mg.lineTo(120, 80); mg.lineTo(160, 40); mg.moveTo(120, 80); mg.lineTo(130, 140); mg.moveTo(120, 80); mg.lineTo(230, 80); mg.stroke(); mg.fillStyle = '#c8102e'; mg.font = '16px Georgia'; mg.fillText('X', 225, 86); mg.fillText('Bibl.', 10, 70); mg.fillText('Cave', 200, 70);
    plane(1.1, 0.7, new THREE.MeshStandardMaterial({map:ctex(mc), roughness:0.8}), R0.x - 0.2, 1.06, R0.z, 0.2);
    candle(R0.x + 0.6, 1.05, R0.z - 0.3);
    for (let i = 0; i < 6; i++){ const c3 = add(new THREE.BoxGeometry(0.8, 0.6, 0.6), wood, R0.x - 4 + (i % 2) * 0.85, 0.3 + Math.floor(i / 2) * 0.62, R0.z + 3.6); }
    C.box(R0.x - 3.6, R0.z + 3.6, 0.9, 0.4);
    [0, 1, 2].forEach(i => { const b = add(barrel, mat(0x6a4a2a, {roughness:0.8}), R0.x + 3 + i * 0.6, 0.6, R0.z + 3.8); C.circle(R0.x + 3 + i * 0.6, R0.z + 3.8, 0.4); });
    add(new THREE.BoxGeometry(1.4, 0.7, 0.8), mat(0x5a3a1a, {roughness:0.6}), R0.x + 4.2, 0.35, R0.z - 0.5); add(new THREE.CylinderGeometry(0.4, 0.4, 1.4, 12, 1, false, 0, Math.PI), mat(0x5a3a1a, {roughness:0.6}), R0.x + 4.2, 0.7, R0.z - 0.5).rotation.z = Math.PI / 2;
    C.box(R0.x + 4.2, R0.z - 0.5, 0.75, 0.45);
    tunnel.light = new THREE.PointLight(0xffa860, 0, 14, 1.5); root.add(tunnel.light);
    // geçit bölgesi tavanı (kamera tavanın üstüne çıkmasın)
    const bx0 = TUN.x, bx1 = TUN.x + 32 * TC, bz0 = TUN.z, bz1 = TUN.z + 16 * TC;
    const prevCeil = C.ceiling;
    C.ceiling = (x, z, y) => (x > bx0 && x < bx1 && z > bz0 && z < bz1) ? TH : (prevCeil ? prevCeil(x, z, y) : 1e9);
    // geçit etkileşimleri (bölge: gecit)
    interact.push({x:TSPOT.L.x, z:TSPOT.L.z, r:2.6, zone:'gecit', label:'Kütüphaneye çık', show:() => true, act:() => leaveTunnel('L')});
    interact.push({x:TSPOT.C.x, z:TSPOT.C.z, r:2.6, zone:'gecit', label:'Şarap mahzenine çık', show:() => true, act:() => leaveTunnel('C')});
    interact.push({x:TSPOT.E.x, z:TSPOT.E.z, r:2.4, zone:'gecit', label:'Kaçış yolu: yukarı tırman', show:() => true, act:() => leaveTunnel('E')});
    interact.push({x:R0.x + 4.2, z:R0.z + 0.5, r:2, zone:'gecit', label:'Sandığı aç', show:() => true, act:async () => {
      const st = S().notes;
      await hooks.ui.dialog([
        {name:'Sığınak', text:'Sandıkta mühürlü mektuplar, bir kese eski altın, kuşatma döneminden bir kaçış haritası ve Kontes Éléonore\'un el yazısıyla bir not var.'},
        {name:'Not', text:'"Bu taşların altında Lumière\'in kalbi saklı. Kılıç uyanırsa bu yollar bir daha kapanmasın; ışık her yere ulaşsın." — É.'},
      ]);
      if (!st.shelter){ st.shelter = true; hooks.sfx('rune'); hooks.ui.toast('Sığınağın sırrını buldun!', 2800); hooks.save(); }
    }});
  }
  // girişler: kütüphane rafı ve şarap mahzeni
  interact.push({x:61, z:-80, r:2.6, label:'Kütüphane: kırmızı ciltli kitabı çek', show:() => true, act:async () => {
    const st = S().notes;
    if (!st.secret){ await say('', 'Kapının yanındaki rafta, diğerlerinden biraz dışarı taşan kırmızı ciltli bir kitap… Çektiğinde raf gıcırdayarak döndü ve ardında aşağı inen dar bir merdiven belirdi!'); st.secret = true; hooks.sfx('open'); hooks.save(); }
    enterTunnel('L');
  }});
  interact.push({x:193, z:131, r:2.4, label:'Mahzendeki gizli kapı', show:() => !!S().notes.secret, act:() => enterTunnel('C')});
  async function enterTunnel(at){
    const hero = heroRef; if (!hero) return;
    await hooks.ui.fade(() => {
      if (hero.mounted) hero.dismount();
      hero.zone = 'gecit'; const p = TSPOT[at];
      hero.teleport(p.x + (at === 'L' ? 2.5 : at === 'C' ? -2.5 : 0), 0.1, p.z + (at === 'E' ? -2.5 : 0), at === 'L' ? Math.PI / 2 : at === 'C' ? -Math.PI / 2 : Math.PI);
      hero.camDistT = 3.2; hero.camPitch = 0.18; hero.snapCamera = true;
    });
    const f = S().notes.places || (S().notes.places = []);
    if (!f.includes('gecit')){ f.push('gecit'); hooks.sfx('quest'); hooks.ui.toast('Keşfedildi: Gizli geçitler ve yeraltı sığınağı (' + f.length + '/' + PLACES.length + ')', 3000); hooks.save(); }
    else hooks.ui.toast('Gizli geçit', 1800);
  }
  async function leaveTunnel(at){
    const hero = heroRef; if (!hero) return;
    const OUT = {L:[61, -78, 0], C:[191.5, 131, -Math.PI / 2], E:[HUNT.hatch.x + 1.6, HUNT.hatch.z + 1.6, 0]}[at];
    await hooks.ui.fade(() => { hero.zone = null; hero.teleport(OUT[0], C.height(OUT[0], OUT[1]), OUT[1], OUT[2]); hero.camDistT = 7.5; hero.camPitch = 0.32; hero.snapCamera = true; });
  }

  /* =====================================================================
     10. SİMYA VE İKSİR LABORATUVARI
     ===================================================================== */
  const alch = {bubbles:null, buff:0};
  {
    const P = ALCH;
    plane(18, 16, grass, P.x, 0.01, P.z);
    add(new THREE.CylinderGeometry(3.2, 3.4, 8, 20), M.stoneMat, P.x + 3, 4, P.z - 3);
    add(new THREE.ConeGeometry(3.8, 4.5, 20), slate, P.x + 3, 10.25, P.z - 3); add(new THREE.SphereGeometry(0.25, 10, 8), gold, P.x + 3, 12.6, P.z - 3);
    for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2 + 0.3, w = add(new THREE.PlaneGeometry(0.7, 1.3), winMat, P.x + 3 + Math.sin(a) * 3.36, 5.5, P.z - 3 + Math.cos(a) * 3.36, root, false); w.rotation.y = a; }
    C.circle(P.x + 3, P.z - 3, 3.5);
    // ahşap saçak altında çalışma tezgâhı
    [[-4, 0], [2, 0], [-4, 4], [2, 4]].forEach(([dx, dz]) => add(new THREE.BoxGeometry(0.15, 3, 0.15), darkWood, P.x + dx, 1.5, P.z + dz));
    const aw = add(new THREE.BoxGeometry(6.6, 0.12, 4.6), mat(0x2a5a3a, {roughness:0.8}), P.x - 1, 3.05, P.z + 2); aw.rotation.x = 0.1;
    add(new THREE.BoxGeometry(4, 0.12, 1.1), wood, P.x - 1, 1.0, P.z + 0.6); [-1.8, 1.8].forEach(dx => add(new THREE.BoxGeometry(0.1, 1, 1), darkWood, P.x - 1 + dx, 0.5, P.z + 0.6));
    C.box(P.x - 1, P.z + 0.6, 2.05, 0.6);
    const POT = [0x5aff9a, 0xff5ab0, 0x5ab0ff, 0xffd25a, 0xb05aff];
    for (let i = 0; i < 9; i++){ const c = POT[i % 5], gm = mat(c, {emissive:c, emissiveIntensity:0.9, transparent:true, opacity:0.85, roughness:0.05}); const f = add(lathe([[0, 0], [0.12, 0], [0.14, 0.1], [0.05, 0.2], [0.04, 0.32], [0, 0.32]], 10), gm, P.x - 2.8 + i * 0.42, 1.06, P.z + 0.5 + (i % 2) * 0.25, root, false); }
    add(new THREE.SphereGeometry(0.35, 14, 10), glass, P.x + 0.4, 1.4, P.z + 0.6, root, false); add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([L(P.x + 0.4, 1.75, P.z + 0.6), L(P.x + 0.9, 1.9, P.z + 0.6), L(P.x + 1.3, 1.2, P.z + 0.6)]), 10, 0.03, 6), brass, 0, 0, 0);
    // kazan: kaynayan yeşil iksir
    const KX = P.x - 3, KZ = P.z + 3;
    add(new THREE.SphereGeometry(0.8, 18, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.darkMetal, KX, 0.95, KZ);
    const liquid = mat(0x3aff6a, {emissive:0x3aff6a, emissiveIntensity:1.4, roughness:0.1});
    disc(0.72, liquid, KX, 0.92, KZ);
    [-1, 1].forEach(a => [-1, 1].forEach(b => { const lg = add(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), M.darkMetal, KX + a * 0.5, 0.3, KZ + b * 0.5); }));
    const fire = add(new THREE.ConeGeometry(0.35, 0.5, 8), flameMat, KX, 0.25, KZ, root, false); fire.userData.dyn = true; flames.push(fire);
    C.circle(KX, KZ, 0.9);
    const NB = 40, bgeo = new THREE.BufferGeometry(), bp = new Float32Array(NB * 3), bv = new Float32Array(NB);
    for (let i = 0; i < NB; i++){ bp.set([KX + (rnd() - 0.5) * 1.2, 0.95 + rnd() * 1.5, KZ + (rnd() - 0.5) * 1.2], i * 3); bv[i] = 0.4 + rnd() * 0.6; }
    bgeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    const bub = new THREE.Points(bgeo, new THREE.PointsMaterial({color:0x9affb0, size:0.12, transparent:true, opacity:0.8, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false})); bub.frustumCulled = false; root.add(bub);
    alch.bubbles = {bp, bv, bgeo, NB, KX, KZ};
    // şifalı ot tarhları
    for (let i = 0; i < 4; i++){ plane(4, 1.2, mat(0x5a4030, {roughness:1}), P.x - 4.5 + (i % 2) * 5, 0.05, P.z + 6.5 + Math.floor(i / 2) * 1.8); for (let k = 0; k < 8; k++) add(new THREE.IcosahedronGeometry(0.22, 0), mat([0x4a8a3a, 0x8a6ad8, 0x6aa86a, 0xd8c85a][i], {roughness:0.8, flatShading:true}), P.x - 6.2 + (i % 2) * 5 + k * 0.48, 0.25, P.z + 6.5 + Math.floor(i / 2) * 1.8); }
    signPost('Laboratoire d\'Alchimie', P.x - 6, P.z - 3, 0);
    const bert = npc({coat:0x3a1a4a, hat:'none'});
    add(new THREE.ConeGeometry(0.22, 0.6, 10), mat(0x3a1a4a), 0, 2.15, 0, bert); add(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 16), mat(0x3a1a4a), 0, 1.9, 0, bert);
    placeNPC(bert, P.x - 1, P.z + 2.1, 0, 'Simyacı Bertrand', async () => {
      const st = S().notes;
      await say('Simyacı Bertrand', 'Ah, bir çırak mı? Yıldızların altında topladığım otlar ve taşlarla saray için iksirler hazırlarım. Gel, birlikte bir tane karalım.');
      const herb = await hooks.ui.dialog([{name:'Simyacı Bertrand', text:'Önce bir ot seç:', choices:['Adamotu (mandragora)', 'Adaçayı', 'Ay lalesi']}]);
      const gem = await hooks.ui.dialog([{name:'Simyacı Bertrand', text:'Şimdi kazana bir taş tozu:', choices:['Ametist', 'Kuvars', 'Yakut']}]);
      const k = (herb + gem) % 3;
      const R = [
        ['Rüzgâr İksiri', 'Ayakların tüy gibi hafifleyecek! Bir süre çok daha hızlı koşacaksın.'],
        ['Şifa Serumu', 'Saray hekimi bundan bir şişe istemişti. Yorgunluğun anında geçti, değil mi?'],
        ['Gençlik Esansı', 'Kontesin en sevdiği! Yüzün bir anlığına ışıldadı; tek damlası on yıl gençleştirir derler.'],
      ][k];
      hooks.sfx('rune'); await say('Simyacı Bertrand', 'Kazan köpürdü… "' + R[0] + '"! ' + R[1]);
      st.elixirs = (st.elixirs || 0) + 1;
      if (k === 0){ alch.buff = 75; if (heroRef) heroRef.speedMul = 1.45; hooks.ui.toast('Rüzgâr İksiri: 75 sn boyunca hızlısın!', 3000); }
      else if (k === 2) hooks.ui.toast('Gençlik Esansı içtin ✨', 2600);
      else hooks.ui.toast('Şifa Serumu içtin', 2400);
      hooks.save();
    });
  }

  /* =====================================================================
     11. KRALİYET TERZİSİ VE MÜCEVHERAT ATÖLYESİ
     ===================================================================== */
  const jewel = {pendant:null, gems:[]};
  const GEMS = [['Elmas', 0xeaf6ff], ['Safir', 0x2a5ae6], ['Yakut', 0xe0103a], ['Zümrüt', 0x10b05a]];
  {
    const P = JEWEL;
    const {G} = hall({x:P.x, z:P.z, w:20, d:12, h:7, wall:mat(0xe8d8c8, {roughness:0.7}), roof:'mansard', roofMat:slate, roofH:3, doorW:2.2});
    signBoard('Joaillerie & Couture Royale', 0, 6.2, 6.12, 0, 6, G);
    // vitrinler: ışıldayan taşlar
    [-6.5, -3.8, 3.8, 6.5].forEach((x, i) => {
      add(new THREE.BoxGeometry(2.2, 1.0, 0.8), darkWood, x, 0.5, 6.7, G); const v = add(new THREE.BoxGeometry(2.2, 0.8, 0.8), glass, x, 1.4, 6.7, G, false); v.renderOrder = 2;
      for (let k = 0; k < 4; k++){ const [, c] = GEMS[(i + k) % 4]; const g = add(new THREE.OctahedronGeometry(0.09, 0), mat(c, {metalness:0.1, roughness:0.02, emissive:c, emissiveIntensity:0.5, transparent:true, opacity:0.9}), x - 0.75 + k * 0.5, 1.22, 6.7, G, false); g.userData.dyn = true; jewel.gems.push(g); }
      C.box(...toWorld(G, x, 6.7), 1.15, 0.45);
    });
    // revakta elbiseli mankenler
    const GW = [0xd8b4e2, 0x1d3a8a, 0xc8102e, 0xf2e6d0, 0x2a6a4a];
    GW.forEach((c, i) => { const m = lady(c, 0xe8e0d0); m.position.set(P.x - 9 + i * 4.5, 0, P.z + 10.5); root.add(m); add(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 16), gold, P.x - 9 + i * 4.5, 0.05, P.z + 10.5); C.circle(P.x - 9 + i * 4.5, P.z + 10.5, 0.55); });
    plane(24, 6, mat(0xd8cdb8, {roughness:0.5}), P.x, 0.06, P.z + 10);
    const lucien = npc({coat:0x2a1a2a});
    placeNPC(lucien, P.x + 2.5, P.z + 8, 0, 'Kuyumcu Lucien', async () => {
      const st = S().notes;
      const c = await hooks.ui.dialog([{name:'Kuyumcu Lucien', text:'Kontesin tacını ben işledim! Saray halkının elmasları, safirleri burada kesilir. Sana bir kolye taşı yerleştireyim mi?', choices:GEMS.map(g => g[0]).concat(['Belki sonra'])}]);
      if (c < GEMS.length){ st.jewel = c; applyJewel(); hooks.sfx('coin'); hooks.ui.toast(GEMS[c][0] + ' kolye boynunda ✦', 2600); hooks.save(); }
    });
    const hort = lady(0x4a2a5a, 0x2a1a12);
    placeNPC(hort, P.x - 3, P.z + 8, 0, 'Terzi Hortense', () => say('Terzi Hortense', 'Bu ipekler Madame Colette\'in atölyesinden geliyor; ben de onları saray için elbiseye çeviriyorum. Maskeli balo için yirmi elbise yetişecek, iğnem hiç durmuyor!'));
  }
  function applyJewel(){
    const j = S().notes.jewel; if (j == null || !heroRef) return;
    if (!jewel.pendant){
      jewel.pendant = new THREE.Group(); jewel.pendant.position.set(0, 1.42, 0.16); heroRef.obj.add(jewel.pendant);
      const ch = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 4, 24, Math.PI), M.goldMat); ch.rotation.z = Math.PI; ch.position.y = 0.12; jewel.pendant.add(ch);
      jewel.gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), new THREE.MeshStandardMaterial({roughness:0.02, metalness:0.1})); jewel.pendant.add(jewel.gem);
    }
    jewel.gem.material.color.setHex(GEMS[j][1]).convertSRGBToLinear(); jewel.gem.material.emissive.setHex(GEMS[j][1]).convertSRGBToLinear(); jewel.gem.material.emissiveIntensity = 0.4;
  }

  /* =====================================================================
     12. UŞAK VE HİZMETKÂR AKADEMİSİ
     ===================================================================== */
  const butlers = {list:[], inspect:0};
  {
    const P = BUTLER;
    const {G} = hall({x:P.x, z:P.z, w:22, d:12, h:8, wall:mat(0xd8c8b0, {roughness:0.75}), roof:'mansard', roofMat:slate, roofH:3.2, doorW:2.4, winRows:2});
    signBoard('Académie des Majordomes', 0, 7.0, 6.12, 0, 6, G);
    // avlu: şimşir çitler, eğitim masası
    const Y = {x:P.x, z:P.z + 13};
    plane(20, 12, mat(0xc8bca4, {roughness:0.7}), Y.x, 0.06, Y.z);
    [[-10, 0, 0.4, 12], [10, 0, 0.4, 12], [-6.5, 6, 7, 0.4], [6.5, 6, 7, 0.4]].forEach(([dx, dz, w, d]) => { add(new THREE.BoxGeometry(w, 0.8, d), M.hedgeMat, Y.x + dx, 0.4, Y.z + dz); C.box(Y.x + dx, Y.z + dz, w / 2, d / 2); });
    add(new THREE.BoxGeometry(3, 0.08, 1.1), mat(0xf4f0e6), Y.x, 1.0, Y.z - 3); add(new THREE.BoxGeometry(2.9, 0.95, 1), darkWood, Y.x, 0.5, Y.z - 3); C.box(Y.x, Y.z - 3, 1.55, 0.6);
    for (let i = 0; i < 6; i++){ add(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8), crystal, Y.x - 1.2 + i * 0.48, 1.13, Y.z - 3, root, false); add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 14), mat(0xffffff, {roughness:0.2}), Y.x - 1.2 + i * 0.48, 1.05, Y.z - 2.7); }
    const tray = mat(0xd8dce0, {metalness:1, roughness:0.2});
    const loop = [[-6, -1], [6, -1], [6, 4], [-6, 4]].map(([x, z]) => [Y.x + x, Y.z + z]);
    for (let i = 0; i < 7; i++){
      const maid = i % 3 === 2;
      const g = maid ? lady(0x1a1a1a, 0x3a2416) : npc({coat:0x111114, hat:'none', trim:mat(0xf4f0e6)});
      if (maid) add(new THREE.BoxGeometry(0.4, 0.6, 0.02), cream, 0, 0.8, 0.33, g);
      else { add(new THREE.BoxGeometry(0.14, 0.14, 0.02), cream, 0, 1.52, 0.15, g); g.userData.armL.rotation.x = -1.4; }
      const tr = add(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 18), tray, maid ? -0.25 : -0.3, maid ? 1.25 : 1.3, 0.35, g); add(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), tray, maid ? -0.25 : -0.3, maid ? 1.26 : 1.31, 0.35, g);
      g.userData.dyn = true; root.add(g);
      const b = {g, i:(i * 2) % 4, d:i / 7, maid, phase:0}; const [x, z] = loop[0]; g.position.set(x, 0, z); butlers.list.push(b);
    }
    butlers.loop = loop; butlers.Y = Y;
    C.dynamics.push(() => butlers.list.map(b => ({x:b.g.position.x, z:b.g.position.z, r:0.35})));
    const fern = npc({coat:0x111114, hat:'none', trim:gold});
    placeNPC(fern, Y.x + 4, Y.z - 3.6, 0, 'Baş Uşak Fernand', async () => {
      const c = await hooks.ui.dialog([{name:'Baş Uşak Fernand', text:'Bir uşak görünmez olmalı, ama her şey onun sayesinde kusursuz işlemeli. Akademimizde gümüş tepsi, sofra düzeni ve sessiz yürüyüş öğretilir. Teftiş etmek ister misiniz?', choices:['Öğrencileri teftiş et', 'Akademiyi anlat']}]);
      if (c === 0){ butlers.inspect = 8; hooks.sfx('quest'); hooks.ui.toast('Uşaklar sıraya girdi ve selam verdi', 2400); }
      else await say('Baş Uşak Fernand', 'Kırk iki uşak, on sekiz nedime, altı aşçı yamağı. Her biri sabah beşte kalkar; ayakkabılar aynayı kıskandıracak kadar parlak olmalıdır. Tepsi asla eğilmez, çay asla dökülmez.');
    });
  }

  /* ================= yollar ================= */
  plane(124, 3.6, gravel, 0, 0.08, -167);
  [-1, 1].forEach(sd => plane(3.6, 62, gravel, sd * 38, 0.08, -137));
  plane(3.6, 18, gravel, 0, 0.08, -158);
  plane(3.6, 14, gravel, ALCH.x - 8, 0.08, -159);

  /* ================= işaretler ================= */
  markers.push({id:'gizli-kitap', color:'#c8102e', label:'Kırmızı kitap', x:61, z:-80, minor:true, show:() => !!S().notes.secretHint && !S().notes.secret});

  /* ================= toplu birleştirme ve renk düzeni ================= */
  K.bake();
  K.fixColors();

  /* ================= güncelleme ================= */
  let applied = false;
  const tmpV = L(0, 0, 0);
  function update(dt, t, hero){
    heroRef = hero;
    root.visible = hero.zone !== 'ic';
    if (!applied && S().started){ applied = true; applyMask(); applyJewel(); hero.obj.traverse(o => o.layers.enable(2)); }
    if (!root.visible) return;
    const W = world.W, night = W.night, px = hero.pos.x, pz = hero.pos.z, wnd = world.state.wind;
    const near = (x, z, r) => Math.abs(px - x) + Math.abs(pz - z) < r;
    updaters.forEach(fn => fn(dt, t, hero));
    winMatSync(night);
    flames.forEach((f, i) => { f.scale.set(1, 0.85 + Math.sin(t * 17 + i * 2.3) * 0.15 + Math.sin(t * 7 + i) * 0.08, 1); });
    // yeraltı: yağmur ve gökyüzü yok, oyuncunun taşıdığı meşale
    if (hero.zone === 'gecit'){ world.rain.visible = false; tunnel.light.intensity = 3.2 + Math.sin(t * 11) * 0.3; tunnel.light.position.set(px + 0.3, hero.pos.y + 2.1, pz + 0.3); }
    else tunnel.light.intensity = 0;
    // iksir etkisi
    if (alch.buff > 0){ alch.buff -= dt; if (alch.buff <= 0){ hero.speedMul = 1; hooks.ui.toast('Rüzgâr İksiri\'nin etkisi geçti', 2000); } }
    // gondollar
    if (near(0, CANAL.z, 260)){
      gondolas.forEach(o => {
        const g = o.g;
        if (o.turn >= 0){
          o.turn += dt / 5; const a = Math.min(1, o.turn) * Math.PI, cx = o.x, r = 2.2;
          g.position.x = cx + Math.sin(a) * r * o.dir; g.position.z = CANAL.z - Math.cos(a) * r * o.dir;
          g.rotation.y = (o.dir > 0 ? 0 : Math.PI) - a;
          if (o.turn >= 1){ o.turn = -1; o.dir *= -1; o.x = g.position.x; }
        } else {
          o.x += o.dir * o.speed * dt; g.position.x = o.x; g.position.z += ((CANAL.z - o.dir * 2.2) - g.position.z) * Math.min(1, dt);
          g.rotation.y = o.dir > 0 ? 0 : Math.PI;
          if ((o.dir > 0 && o.x > CANAL.x1 - 10) || (o.dir < 0 && o.x < CANAL.x0 + 10)) o.turn = 0;
        }
        g.position.y = 0.12 + Math.sin(t * 1.3 + o.ph) * 0.03; g.rotation.z = Math.sin(t * 0.9 + o.ph) * 0.02;
        o.oar.rotation.x = Math.sin(t * 1.6 + o.ph) * 0.35;
      });
      const R = gondolas.ride; if (!R.riding){ R.g.position.y = 0.12 + Math.sin(t * 1.1) * 0.025; R.g.rotation.z = Math.sin(t * 0.7) * 0.015; }
      (gondolas.swans || []).forEach(s => {
        s.t -= dt; if (s.t <= 0){ s.tx = Math.max(CANAL.x0 + 4, Math.min(CANAL.x1 - 4, s.x + (rnd() - 0.5) * 20)); s.tz = CANAL.z + (rnd() - 0.5) * 8; s.t = 6 + rnd() * 6; }
        const dx = s.tx - s.x, dz = s.tz - s.z, d = Math.hypot(dx, dz);
        if (d > 0.1){ const sp = Math.min(d, dt * 0.7); s.x += dx / d * sp; s.z += dz / d * sp; world.turnToward(s.g, Math.atan2(dx, dz), Math.min(1, dt * 1.5)); }
        s.g.position.set(s.x, 0.12 + Math.sin(t * 1.4 + s.tx) * 0.02, s.z);
      });
    }
    // gece bahçesi: çiçekler gece açar ve ışıldar
    if (near(NIGHT.x, NIGHT.z, 200)){
      const open = Math.min(1, Math.max(0, (night - 0.25) / 0.6)), pulse = 0.85 + Math.sin(t * 1.5) * 0.15;
      glow.mats.forEach((m, i) => { m.emissiveIntensity = open * (i < 3 ? 0.75 * pulse : i === 6 ? 1.4 : 0.9); });
      if (Math.abs(open - glow.open) > 0.02){
        glow.open = open; const s = 0.35 + open * 0.75;
        glow.heads.forEach(({im, pts}) => { pts.forEach(([x, z, h], i) => { m4.compose(L(x, h * 0.84, z), q4.identity(), s4.set(s, s * (0.6 + open * 0.4), s)); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; });
      }
      const F = glow.flies; F.flyMat.opacity = open;
      if (open > 0.01){ F.fs.forEach((f, i) => { F.fp.set([f.x + Math.sin(t * f.w + f.ph) * 1.5, f.y + Math.sin(t * 1.7 + f.ph) * 0.4, f.z + Math.cos(t * f.w * 0.8 + f.ph) * 1.5], i * 3); }); F.fg.attributes.position.needsUpdate = true; }
    }
    // saat kulesi: gerçek saat, dişliler, saat başı çan
    const now = new Date(), sec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
    clock.faces.forEach(f => { f.hm.rotation.z = -sec / 3600 * Math.PI * 2; f.hh.rotation.z = -sec / 43200 * Math.PI * 2; });
    clock.faceMat.emissiveIntensity = night * 0.9;
    clock.gears.forEach(gq => { gq.g.rotation.z += dt * 0.25 * gq.w; });
    if (now.getMinutes() === 0 && clock.lastHour !== now.getHours()){ clock.lastHour = now.getHours(); chime(now.getHours(), Math.hypot(px - CLOCK.x, pz - CLOCK.z)); }
    if (clock.swing > 0){ clock.swing -= dt; clock.bell.rotation.x = Math.sin(t * 2.6) * 0.35 * Math.min(1, clock.swing); } else clock.bell.rotation.x *= 0.95;
    // maskeli balo: dansçılar ve aynalar
    masq.t = Math.max(0, masq.t - dt);
    const dancing = masq.t > 0 || night > 0.7;
    masq.couples.forEach((o, i) => {
      if (dancing){ o.a += dt * 0.3; o.c.position.set(Math.cos(o.a) * 7.5, Math.abs(Math.sin(t * 3.6 + i)) * 0.03, Math.sin(o.a) * 3.2); o.c.rotation.y = t * 2.0 + i; }
      else { o.c.position.x += (o.base[0] - o.c.position.x) * Math.min(1, dt); o.c.position.z += (o.base[1] - o.c.position.z) * Math.min(1, dt); }
    });
    const inHall = Math.abs(px - MASKH.x) < 19 && Math.abs(pz - MASKH.z) < 10;
    masq.light.intensity = inHall ? 6 + night * 10 : 0;
    masq.dayWin.emissiveIntensity = (1 - night) * 1.3 + 0.05;
    masq.timer -= dt;
    if ((inHall && masq.timer <= 0) || (!masq.primed && near(MASKH.x, MASKH.z, 60))){ masq.timer = 0.25; masq.primed = true; captureMirrors(); }
    // av arazisi: geyikler ve tavşanlar (yaklaşınca kaçarlar)
    if (near(-200, -20, 170)){
      const H = HUNT, inside = (x, z, m) => x > H.x0 + m && x < H.x1 - m && z > H.z0 + m && z < H.z1 - m;
      const pick = (o, m) => { for (let k = 0; k < 8; k++){ const x = H.x0 + m + rnd() * (H.x1 - H.x0 - 2 * m), z = H.z0 + m + rnd() * (H.z1 - H.z0 - 2 * m); if (Math.hypot(x - H.lodge.x, z - H.lodge.z) > 12) return [x, z]; } return [o.g.position.x, o.g.position.z]; };
      deer.forEach((d, i) => {
        const g = d.g, hx = g.position.x - px, hz = g.position.z - pz, hd = Math.hypot(hx, hz);
        if (hd < 10 && hero.zone == null){ d.flee = 3; const ax = g.position.x + hx / hd * 14, az = g.position.z + hz / hd * 14; d.target = inside(ax, az, 3) ? [ax, az] : pick(d, 4); d.wait = 0; }
        let moving = 0;
        if (d.wait > 0){ d.wait -= dt; d.hd.rotation.x += ((Math.sin(t * 0.7 + i) > 0.3 ? 0.9 : 0) - d.hd.rotation.x) * Math.min(1, dt * 2); }
        else {
          if (!d.target) d.target = pick(d, 4);
          const dx = d.target[0] - g.position.x, dz = d.target[1] - g.position.z, dist = Math.hypot(dx, dz), sp = d.flee > 0 ? 7 : 1.1;
          if (dist < 0.4){ d.target = null; d.wait = 3 + rnd() * 6; }
          else { const s = Math.min(dist, sp * dt); g.position.x += dx / dist * s; g.position.z += dz / dist * s; world.turnToward(g, Math.atan2(dx, dz), Math.min(1, dt * 5)); moving = sp; }
          d.hd.rotation.x += (-0.2 - d.hd.rotation.x) * Math.min(1, dt * 3);
        }
        d.flee = Math.max(0, d.flee - dt);
        d.phase += dt * moving * 2.6;
        const sw = Math.sin(d.phase) * Math.min(0.7, moving * 0.12);
        d.legs[0].rotation.x = sw; d.legs[3].rotation.x = sw; d.legs[1].rotation.x = -sw; d.legs[2].rotation.x = -sw;
        g.position.y = d.flee > 0 ? Math.abs(Math.sin(d.phase)) * 0.35 : 0;
      });
      rabbits.forEach((r2, i) => {
        const g = r2.g, hx = g.position.x - px, hz = g.position.z - pz, hd = Math.hypot(hx, hz);
        if (hd < 6 && hero.zone == null && r2.flee <= 0){ r2.flee = 2.5; const ax = g.position.x + hx / hd * 8, az = g.position.z + hz / hd * 8; r2.target = inside(ax, az, 2) ? [ax, az] : pick(r2, 3); r2.wait = 0; }
        if (r2.wait > 0){ r2.wait -= dt; g.position.y = 0; return; }
        if (!r2.target) r2.target = pick(r2, 3);
        const dx = r2.target[0] - g.position.x, dz = r2.target[1] - g.position.z, dist = Math.hypot(dx, dz), sp = r2.flee > 0 ? 6 : 1.4;
        if (dist < 0.3){ r2.target = null; r2.wait = 1 + rnd() * 4; return; }
        const s = Math.min(dist, sp * dt); g.position.x += dx / dist * s; g.position.z += dz / dist * s; world.turnToward(g, Math.atan2(dx, dz), Math.min(1, dt * 8));
        r2.hop += dt * (r2.flee > 0 ? 12 : 7); g.position.y = Math.abs(Math.sin(r2.hop)) * 0.25; r2.flee = Math.max(0, r2.flee - dt);
      });
    }
    // simya: kabarcıklar ve gençlik ışıltısı
    if (near(ALCH.x, ALCH.z, 120)){
      const B = alch.bubbles; for (let i = 0; i < B.NB; i++){ B.bp[i * 3 + 1] += B.bv[i] * dt; if (B.bp[i * 3 + 1] > 2.6){ B.bp.set([B.KX + (rnd() - 0.5) * 1.1, 0.95, B.KZ + (rnd() - 0.5) * 1.1], i * 3); } } B.bgeo.attributes.position.needsUpdate = true;
    }
    // mücevherler döner
    jewel.gems.forEach((g, i) => { g.rotation.y += dt * (0.8 + (i % 3) * 0.3); });
    if (jewel.gem) jewel.gem.rotation.y += dt * 1.5;
    // uşaklar: tur atar; teftişte sıraya girip selam verir
    if (near(BUTLER.x, BUTLER.z, 140)){
      butlers.inspect = Math.max(0, butlers.inspect - dt);
      const LP = butlers.loop, per = [12, 5, 12, 5], tot = 34;
      butlers.list.forEach((b, i) => {
        const g = b.g;
        if (butlers.inspect > 0){
          const tx2 = butlers.Y.x - 4.8 + i * 1.6, tz2 = butlers.Y.z + 1.2, dx = tx2 - g.position.x, dz = tz2 - g.position.z, d = Math.hypot(dx, dz);
          if (d > 0.1){ const s = Math.min(d, dt * 2.5); g.position.x += dx / d * s; g.position.z += dz / d * s; world.turnToward(g, Math.atan2(dx, dz), Math.min(1, dt * 6)); b.phase += dt * 8; }
          else { world.turnToward(g, Math.PI, Math.min(1, dt * 4)); g.rotation.x = 0; }
          const bow = d <= 0.1 && butlers.inspect < 6 ? Math.sin(Math.min(1, (6 - butlers.inspect) / 1.2) * Math.PI) * 0.35 : 0;
          g.rotation.order = 'YXZ'; g.rotation.x = bow;
        } else {
          g.rotation.x = 0;
          b.d = (b.d + dt * 1.1 / tot) % 1; let u = b.d * tot, k = 0; while (u > per[k]){ u -= per[k]; k = (k + 1) % 4; }
          const [x0, z0] = LP[k], [x1, z1] = LP[(k + 1) % 4], f = u / per[k];
          const nx = x0 + (x1 - x0) * f, nz = z0 + (z1 - z0) * f;
          world.turnToward(g, Math.atan2(nx - g.position.x, nz - g.position.z), Math.min(1, dt * 8));
          g.position.x = nx; g.position.z = nz; b.phase += dt * 6;
        }
        if (!b.maid && g.userData.legL){ g.userData.legL.rotation.x = Math.sin(b.phase) * 0.35; g.userData.legR.rotation.x = -Math.sin(b.phase) * 0.35; }
        g.position.y = Math.abs(Math.sin(b.phase)) * 0.02;
      });
    }
  }
  let lastNight = -1;
  function winMatSync(night){ if (Math.abs(night - lastNight) > 0.01){ lastNight = night; K.winMat.emissiveIntensity = night * 1.8; K.lampMat.color.setRGB(0.25 + night * 1.6, 0.2 + night * 1.0, 0.1 + night * 0.4); } }

  return {root, interact, markers, update, inTunnel:() => heroRef && heroRef.zone === 'gecit', libraryExit:{x:61, y:0, z:-78, yaw:0}};
}
