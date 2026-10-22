// Ayrıntılı kapılar: taş söveler, başlıklar, kilit taşı, tepe penceresi (fanlight), panolu çift kanat,
// pirinç kollar ve tokmak, demir menteşeler, basamaklar ve duvar fenerleri.
// Üç üslup: 'saray' (barok, panolu), 'rustik' (tahta ve demir), 'kemer' (taş kemerli, çivili).
// Kapı, verilen ebeveynin yerel uzayında (x, z) noktasında duvar yüzünde durur ve yerel +z yönüne (dışarı) bakar.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const cache = new WeakMap();
function mats(world){
  if (cache.has(world)) return cache.get(world);
  const { THREE, materials:M } = world;
  const S = c => new THREE.Color(c).convertSRGBToLinear();
  const m = {
    stone:new THREE.MeshStandardMaterial({color:S(0xe4dccb), roughness:0.75}),
    stoneDark:new THREE.MeshStandardMaterial({color:S(0xb8ae9a), roughness:0.85}),
    wood:M.doorMat,
    panel:new THREE.MeshStandardMaterial({color:S(0x5a3a24), roughness:0.6}),
    plank:[0x6b4a2e, 0x5e4128, 0x735034].map(c => new THREE.MeshStandardMaterial({color:S(c), roughness:0.85})),
    brass:new THREE.MeshStandardMaterial({color:S(0xd8b45a), metalness:1, roughness:0.28}),
    iron:new THREE.MeshStandardMaterial({color:S(0x2a2a2e), metalness:0.7, roughness:0.45}),
    glass:new THREE.MeshStandardMaterial({color:0x1e2a36, metalness:0.5, roughness:0.08, emissive:0xffb35a, emissiveIntensity:0.05}),
    lamp:new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false}),
    timber:new THREE.MeshStandardMaterial({color:S(0x3e2a1a), roughness:0.8}),
  };
  cache.set(world, m); return m;
}

/** Gece tepe pencereleri içeriden yanar (main döngüsünden çağrılır). */
export function updateDoors(world){
  const m = cache.get(world); if (!m) return;
  m.glass.emissiveIntensity = 0.05 + world.W.night * 0.9;
}

/**
 * @param {object} o x, z: duvar yüzündeki kapı ortası (yerel); ry: dönüş; w, h: kapı boşluğu;
 *   y0: eşik yüksekliği; style; steps: basamak sayısı; lanterns; pediment: alınlık (saray)
 * @returns {THREE.Group}
 */
export function doorway(world, parent, {x = 0, z = 0, ry = 0, w = 2.2, h = 3.0, y0 = 0.3, style = 'saray', steps = 2, lanterns = true, pediment = true, open = false, hood = true, merge = false} = {}){
  const { THREE } = world;
  const m = mats(world);
  const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; parent.add(G);
  const add = (geo, mat, px, py, pz, cast = true) => { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); o.castShadow = cast; o.receiveShadow = true; G.add(o); return o; };
  const box = (sx, sy, sz, mat, px, py, pz, cast) => add(new THREE.BoxGeometry(sx, sy, sz), mat, px, py, pz, cast);
  const top = y0 + h;

  // eşik ve basamaklar (yere iner)
  box(w + 0.5, 0.08, 0.5, m.stone, 0, y0 - 0.04, 0.2);
  for (let i = 0; i < steps; i++){
    const sh = y0 * (steps - i) / steps;
    box(w + 0.9 + i * 0.5, sh, 0.42, m.stone, 0, sh / 2, 0.45 + i * 0.42, false);
  }

  // kapı kanatları (iki kanat, ortada ince ayrım); open: içe açık bırakılmış kanatlar
  const leaf = (sd, build) => {
    const L = new THREE.Group(); L.position.set(sd * w / 2, y0, 0.05); G.add(L);
    if (open) L.rotation.y = -sd * 1.25;
    build(L, -sd); return L;
  };
  const lbox = (L, sx, sy, sz, mat, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); o.position.set(px, py, pz); o.castShadow = true; o.receiveShadow = true; L.add(o); return o; };
  const lw = w / 2 - 0.02;

  if (style === 'rustik'){
    // dikey tahtalar, üç demir menteşe kayışı, halka kol
    leaf(-1, (L, dir) => {
      const n = 3; for (let i = 0; i < n; i++) lbox(L, lw / n - 0.01, h, 0.08, m.plank[i % 3], dir * (lw / n) * (i + 0.5), h / 2, 0);
      [0.35, h / 2, h - 0.35].forEach(y => { lbox(L, lw * 0.85, 0.07, 0.02, m.iron, dir * lw * 0.42, y, 0.05); lbox(L, 0.06, 0.06, 0.03, m.iron, dir * lw * 0.8, y, 0.06); });
    });
    leaf(1, (L, dir) => {
      const n = 3; for (let i = 0; i < n; i++) lbox(L, lw / n - 0.01, h, 0.08, m.plank[(i + 1) % 3], dir * (lw / n) * (i + 0.5), h / 2, 0);
      [0.35, h / 2, h - 0.35].forEach(y => lbox(L, lw * 0.85, 0.07, 0.02, m.iron, dir * lw * 0.42, y, 0.05));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 16), m.iron); ring.position.set(dir * (lw - 0.18), h * 0.48, 0.08); L.add(ring);
    });
    // ahşap kasa ve lento, taş eşik altı
    [-1, 1].forEach(sd => box(0.24, h + 0.3, 0.28, m.timber, sd * (w / 2 + 0.12), y0 + (h + 0.3) / 2, 0.06));
    box(w + 0.9, 0.32, 0.34, m.timber, 0, top + 0.16, 0.08);
    // küçük saçak ve fener
    if (hood){
      const hd = box(w + 1.2, 0.08, 0.9, m.timber, 0, top + 0.62, 0.4); hd.rotation.x = 0.28;
      [-1, 1].forEach(sd => { const br = box(0.08, 0.5, 0.08, m.timber, sd * (w / 2 + 0.25), top + 0.3, 0.55); br.rotation.x = -0.7; });
    }
    if (lanterns) lantern(sd => sd > 0, 1);
    return done();
  }

  if (style === 'kemer'){
    // yarım daire kemer: kilit taşlı taş kemer, çivili kemerli kanatlar
    const r = w / 2, spring = top - r;
    leaf(-1, (L, dir) => {
      lbox(L, lw, h - r, 0.08, m.wood, dir * lw / 2, (h - r) / 2, 0);
      // kemerin bu kanada düşen çeyreği (merkez kapının ortasında)
      const cap = new THREE.Mesh(new THREE.CircleGeometry(lw, 16, dir > 0 ? Math.PI / 2 : 0, Math.PI / 2), m.wood); cap.position.set(dir * lw, h - r, 0.041); L.add(cap);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++){ const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), m.iron); s.position.set(dir * (0.18 + i * (lw - 0.3) / 2), 0.3 + j * (h - r - 0.5) / 4, 0.05); L.add(s); }
    });
    leaf(1, (L, dir) => {
      lbox(L, lw, h - r, 0.08, m.wood, dir * lw / 2, (h - r) / 2, 0);
      // kemerin bu kanada düşen çeyreği (merkez kapının ortasında)
      const cap = new THREE.Mesh(new THREE.CircleGeometry(lw, 16, dir > 0 ? Math.PI / 2 : 0, Math.PI / 2), m.wood); cap.position.set(dir * lw, h - r, 0.041); L.add(cap);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++){ const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), m.iron); s.position.set(dir * (0.18 + i * (lw - 0.3) / 2), 0.3 + j * (h - r - 0.5) / 4, 0.05); L.add(s); }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 6, 16), m.iron); ring.position.set(dir * (lw - 0.2), (h - r) * 0.55, 0.09); L.add(ring);
    });
    // söveler ve kemer taşları (voussoir)
    [-1, 1].forEach(sd => { box(0.42, h - r + 0.1, 0.36, m.stone, sd * (r + 0.21), y0 + (h - r) / 2, 0.08); box(0.56, 0.18, 0.44, m.stoneDark, sd * (r + 0.21), y0 + h - r, 0.08); });
    const N = 11;
    for (let i = 0; i < N; i++){
      const a = Math.PI * (i + 0.5) / N, key = i === (N - 1) / 2;
      const v = box(0.42, key ? 0.62 : 0.46, 0.38 + (key ? 0.06 : 0), key ? m.stoneDark : m.stone, Math.cos(a) * (r + 0.23), spring + Math.sin(a) * (r + 0.23), 0.08 + (key ? 0.03 : 0));
      v.rotation.z = a - Math.PI / 2;
    }
    if (lanterns) lantern(() => true, 2, r + 0.75);
    return done();
  }

  // 'saray': panolu çift kanat, tepe penceresi, pilastrlar, kilit taşı, alınlık
  const panelSet = (L, dir) => {
    lbox(L, lw, h, 0.08, m.wood, dir * lw / 2, h / 2, 0);
    // çerçeveli üç pano: alt, orta (uzun), üst
    [[0.18, 0.62], [0.9, h - 1.55], [h - 0.55, 0.38]].forEach(([y, ph]) => {
      const pw = lw - 0.24;
      lbox(L, pw, ph, 0.03, m.panel, dir * lw / 2, y + ph / 2, 0.045);
      lbox(L, pw - 0.12, ph - 0.12, 0.03, m.wood, dir * lw / 2, y + ph / 2, 0.06);
    });
  };
  leaf(-1, (L, dir) => {
    panelSet(L, dir);
    const lever = lbox(L, 0.16, 0.025, 0.03, m.brass, dir * (lw - 0.16), h * 0.47, 0.11); lever.rotation.z = 0.0;
    lbox(L, 0.05, 0.22, 0.015, m.brass, dir * (lw - 0.1), h * 0.47, 0.085);
  });
  leaf(1, (L, dir) => {
    panelSet(L, dir);
    lbox(L, 0.16, 0.025, 0.03, m.brass, dir * (lw - 0.16), h * 0.47, 0.11);
    lbox(L, 0.05, 0.22, 0.015, m.brass, dir * (lw - 0.1), h * 0.47, 0.085);
    // aslan başı tokmak
    const kn = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 18), m.brass); kn.position.set(dir * lw * 0.5, h * 0.66, 0.1); L.add(kn);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m.brass); boss.position.set(dir * lw * 0.5, h * 0.66 + 0.1, 0.09); L.add(boss);
  });
  if (!open) box(0.05, h, 0.03, m.brass, 0, y0 + h / 2, 0.1);
  // tepe penceresi: yarım elips cam, ışınsal kayıtlar
  const fr = w / 2, fh = 0.6;
  const fan = add(new THREE.CircleGeometry(fr, 24, 0, Math.PI), m.glass, 0, top + 0.08, 0.03, false); fan.scale.y = fh;
  for (let i = 1; i < 6; i++){ const a = Math.PI * i / 6, ex = Math.cos(a) * fr, ey = Math.sin(a) * fr * fh, len = Math.hypot(ex, ey); const b = box(0.035, len, 0.03, m.stone, ex / 2, top + 0.08 + ey / 2, 0.05, false); b.rotation.z = Math.atan2(ey, ex) - Math.PI / 2; }
  box(w, 0.1, 0.12, m.stone, 0, top + 0.04, 0.06);
  const arch = add(new THREE.TorusGeometry(fr + 0.08, 0.1, 8, 28, Math.PI), m.stone, 0, top + 0.08, 0.07); arch.scale.y = fh * 1.04;
  // pilastrlar (kaide, gövde, başlık)
  [-1, 1].forEach(sd => {
    const px = sd * (w / 2 + 0.3);
    box(0.5, 0.42, 0.34, m.stoneDark, px, y0 + 0.21, 0.1);
    box(0.38, h + fr * fh - 0.3, 0.24, m.stone, px, y0 + 0.42 + (h + fr * fh - 0.3) / 2, 0.08);
    for (let k = -1; k <= 1; k++) box(0.05, h + fr * fh - 0.6, 0.03, m.stoneDark, px + k * 0.1, y0 + 0.42 + (h + fr * fh - 0.3) / 2, 0.21, false);
    box(0.52, 0.22, 0.36, m.stone, px, top + fr * fh + 0.24, 0.1);
  });
  // saçaklık, kilit taşı, alınlık
  const eY = top + fr * fh + 0.42;
  box(w + 1.3, 0.3, 0.38, m.stone, 0, eY, 0.12);
  box(w + 1.6, 0.12, 0.5, m.stone, 0, eY + 0.21, 0.16);
  const key = new THREE.Shape(); key.moveTo(-0.16, 0); key.lineTo(0.16, 0); key.lineTo(0.24, 0.5); key.lineTo(-0.24, 0.5); key.closePath();
  const kg = new THREE.ExtrudeGeometry(key, {depth:0.3, bevelEnabled:false}); kg.translate(0, 0, -0.15);
  add(kg, m.stoneDark, 0, top + fr * fh - 0.08, 0.16);
  if (pediment){
    const ps = new THREE.Shape(), pw = (w + 1.6) / 2; ps.moveTo(-pw, 0); ps.lineTo(pw, 0); ps.lineTo(0, 0.7); ps.closePath();
    const hole = new THREE.Path(); hole.moveTo(-pw + 0.35, 0.12); hole.lineTo(pw - 0.35, 0.12); hole.lineTo(0, 0.55); hole.closePath(); ps.holes.push(hole);
    const pg = new THREE.ExtrudeGeometry(ps, {depth:0.36, bevelEnabled:false}); pg.translate(0, 0, -0.18);
    add(pg, m.stone, 0, eY + 0.27, 0.16);
    const tymp = new THREE.Shape(); tymp.moveTo(-pw + 0.35, 0.12); tymp.lineTo(pw - 0.35, 0.12); tymp.lineTo(0, 0.55); tymp.closePath();
    add(new THREE.ShapeGeometry(tymp), m.stoneDark, 0, eY + 0.27, 0.02, false);
    add(new THREE.CircleGeometry(0.12, 16), m.brass, 0, eY + 0.48, 0.03, false);
  }
  if (lanterns) lantern(() => true, 0, w / 2 + 0.95);
  return done();

  function done(){ if (merge) mergeStatic(world, G); return G; }

  // duvar feneri: dirsek, kafes, cam, tepelik (style: 0 saray pirinç, 1 rustik demir, 2 kemer demir)
  function lantern(which, kind, off = w / 2 + 0.7){
    [-1, 1].forEach(sd => {
      if (!which(sd)) return;
      const lx = sd * off, ly = y0 + h * 0.78, metal = kind === 0 ? m.brass : m.iron;
      box(0.06, 0.06, 0.42, metal, lx, ly + 0.36, 0.22);
      box(0.12, 0.2, 0.04, metal, lx, ly + 0.34, 0.02);
      const L = new THREE.Group(); L.position.set(lx, ly, 0.42); G.add(L);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.26, 0.17), m.lamp); L.add(glow); glow.userData.lamp = true;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.3, 0.025), metal); p.position.set(a * 0.1, 0, b * 0.1); L.add(p); });
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.16, 4), metal); cap.rotation.y = Math.PI / 4; cap.position.y = 0.23; L.add(cap);
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.22), metal); base.position.y = -0.16; L.add(base);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), metal); fin.position.y = 0.34; L.add(fin);
    });
  }
}

/** Sabit bir grubun bütün mesh'lerini malzemeye göre birleştirir (birleştirme adımı olmayan yerlerde çizim çağrısını düşürür). */
export function mergeStatic(world, G){
  const { THREE } = world;
  G.updateMatrixWorld(true);
  const inv = G.matrixWorld.clone().invert(), buckets = new Map(), gone = [], mtx = new THREE.Matrix4();
  // animasyonlu ya da ayrı tutulacak alt ağaçlara (userData.anim / keep) dokunma
  const walk = o => { if (o !== G && (o.userData.anim || o.userData.keep)) return; visit(o); o.children.forEach(walk); };
  const visit = o => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible) return;
    const k = o.material.uuid + '|' + o.castShadow;
    let b = buckets.get(k); if (!b){ b = {mat:o.material, cast:o.castShadow, geos:[]}; buckets.set(k, b); }
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    Object.keys(g.attributes).forEach(a => { if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); });
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    b.geos.push(g.applyMatrix4(mtx.multiplyMatrices(inv, o.matrixWorld))); gone.push(o);
  };
  walk(G);
  gone.forEach(o => o.parent.remove(o));
  buckets.forEach(b => { const mm = new THREE.Mesh(mergeBufferGeometries(b.geos), b.mat); mm.castShadow = b.cast; mm.receiveShadow = true; G.add(mm); });
  return G;
}
