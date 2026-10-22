// Yapı kiti: bina, sütun, köşk, tabela, figür ve heykel yapıcıları; sabit parçaları birleştiren "pişirme" adımı.
// royal.js gibi bölge modülleri kendi kök grupları için bir kit örneği alır.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { doorway } from './doors.js';

export function makeKit(world, C, root, {seed = 1, interact = [], updaters = [], say = () => {}} = {}){
  const { THREE, materials:M } = world;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3();

  function add(geo, mat, x, y, z, parent = root, cast = true){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function ctex(c, rx = 1, ry = 1){ const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  function plane(w, d, mat, x, y, z, rot = 0, parent = root){
    const g = new THREE.PlaneGeometry(w, d);
    // çakıl dokusu büyük bahçe için 18 kez tekrar ediyor: dar yollarda karo boyunu (~4 m) koru
    if (mat === M.gravelMat){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 76, uv.getY(i) * d / 74); }
    const m = add(g, mat, x, y, z, parent, false); m.rotation.set(-Math.PI / 2, 0, rot); return m;
  }
  function disc(r, mat, x, y, z, parent = root, seg = 48){ const m = add(new THREE.CircleGeometry(r, seg), mat, x, y, z, parent, false); m.rotation.x = -Math.PI / 2; return m; }
  const toWorld = (G, lx, lz) => { const c = Math.cos(G.rotation.y), s = Math.sin(G.rotation.y); return [G.position.x + lx * c + lz * s, G.position.z - lx * s + lz * c]; };
  const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);

  // aynı renkteki malzemeleri paylaş (birleştirme sonrası daha az çizim çağrısı)
  const cache = new Map();
  const mat = (color, o = {}) => { const k = color + JSON.stringify(o); if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial(Object.assign({color, roughness:0.6}, o))); return cache.get(k); };
  const gold = M.goldMat, stone = M.stoneMat, marble = M.marbleMat, gravel = M.gravelMat, slate = M.slateMat;
  const cream = mat(0xf4ead6, {roughness:0.55}), plaster = mat(0xefe4cf, {roughness:0.8});
  const wood = mat(0x6b4a2e, {roughness:0.85}), darkWood = mat(0x3e2a1a, {roughness:0.7});
  const winMat = new THREE.MeshStandardMaterial({color:0x26313c, metalness:0.6, roughness:0.12, emissive:0xffb35a, emissiveIntensity:0});
  const lampMat = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
  const grass = new THREE.MeshStandardMaterial({map:M.lawnMat.map, color:0x9fbf7a, roughness:0.95});

  function signBoard(text, x, y, z, ry = 0, w = 3.4, parent = root){
    const [c, g] = canvas(512, 128); g.fillStyle = '#2c2016'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#d4af37'; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
    g.fillStyle = '#f6ecd0'; g.textAlign = 'center'; let fs = 60; do { g.font = fs + 'px Georgia, serif'; fs -= 2; } while (g.measureText(text).width > 470); g.fillText(text, 256, 64 + fs * 0.36);
    const b = add(new THREE.BoxGeometry(w, w / 4, 0.08), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.8}), x, y, z, parent); b.rotation.y = ry; return b;
  }
  function signPost(text, x, z, ry){
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
    [-1.4, 1.4].forEach(dx => add(new THREE.BoxGeometry(0.14, 2.8, 0.14), darkWood, dx, 1.4, 0, g));
    signBoard(text, 0, 2.5, 0, 0, 3.0, g); C.circle(x, z, 0.3);
  }
  function column(x, z, h, r = 0.3, parent = root, m = marble, cap = gold){
    add(new THREE.BoxGeometry(r * 3, 0.3, r * 3), m, x, 0.15, z, parent);
    add(new THREE.CylinderGeometry(r, r * 1.12, h - 0.6, 16), m, x, 0.3 + (h - 0.6) / 2, z, parent);
    add(new THREE.CylinderGeometry(r * 1.6, r * 1.05, 0.3, 16), cap, x, h - 0.15, z, parent);
  }
  function frustum(w, d, h, inset){ const g = new THREE.BoxGeometry(w, h, d); const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0){ p.setX(i, p.getX(i) * (1 - inset * 2 / w)); p.setZ(i, p.getZ(i) * (1 - inset * 2 / d)); } g.computeVertexNormals(); return g; }
  function gableGeo(w, d, h){ const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath(); const g = new THREE.ExtrudeGeometry(s, {depth:d, bevelEnabled:false}); g.translate(0, 0, -d / 2); return g; }
  function windows(G, w, d, h, rows = 1, skipFront = 0){
    const faces = [[0, d / 2 + 0.05, 0, w], [Math.PI, -d / 2 - 0.05, 0, w], [Math.PI / 2, 0, w / 2 + 0.05, d], [-Math.PI / 2, 0, -w / 2 - 0.05, d]];
    faces.forEach(([ry, fz, fx, len], fi) => {
      const n = Math.max(1, Math.floor(len / 3.2));
      for (let i = 0; i < n; i++){
        const u = -len / 2 + (i + 0.5) * len / n;
        for (let r = 0; r < rows; r++){
          if (fi === 0 && Math.abs(u) < skipFront && r === 0) continue;
          const wy = 1.2 + (h - 1.6) * (r + 0.5) / rows, wh = Math.min(2.6, (h - 1.6) / rows - 0.7);
          const wx = fi < 2 ? u : fx, wz = fi < 2 ? fz : u;
          const wm = add(new THREE.PlaneGeometry(1.1, wh), winMat, wx, wy, wz, G, false); wm.rotation.y = ry;
          const fr = add(new THREE.BoxGeometry(1.35, 0.14, 0.12), cream, wx, wy + wh / 2 + 0.1, wz, G, false); fr.rotation.y = ry;
        }
      }
    });
  }
  /** Dikdörtgen bina: kapı yerel +z yüzünde. */
  function hall({x, z, w, d, h, rot = 0, wall = plaster, roof = 'mansard', roofMat = slate, roofH = 3.4, door = true, doorW = 2.2, doorStyle = 'saray', winRows = 1, collide = true}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    add(new THREE.BoxGeometry(w + 0.4, 0.6, d + 0.4), stone, 0, 0.3, 0, G);
    add(new THREE.BoxGeometry(w, h, d), wall, 0, h / 2, 0, G);
    add(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), cream, 0, h + 0.2, 0, G);
    if (roof === 'mansard') add(frustum(w + 0.2, d + 0.2, roofH, Math.min(w, d) * 0.22), roofMat, 0, h + 0.42 + roofH / 2, 0, G);
    else if (roof === 'gable'){ const gr = add(gableGeo(d + 0.8, w + 0.6, roofH), roofMat, 0, h + 0.4, 0, G); gr.rotation.y = Math.PI / 2; }
    else if (roof === 'flat') add(new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2), cream, 0, h + 0.55, 0, G);
    windows(G, w, d, h, winRows, door ? doorW : 0);
    if (door){
      doorway(world, G, {z:d / 2, w:doorW, h:3.0, y0:0.3, style:doorStyle, pediment:h >= 7});
    }
    if (collide) C.box(x, z, w / 2 + 0.2, d / 2 + 0.2, rot);
    return {G, front:toWorld(G, 0, d / 2 + 1.6)};
  }

  /* ================= insanlar ================= */
  const eyeMat = new THREE.MeshBasicMaterial({color:0x2a1a12});
  function npc({coat = 0x3a2a5a, hat = 'tricorne', apron = false, chef = false, trim = gold}){
    const g = world.makeGuard(), u = g.userData;
    const cm = mat(chef ? 0xf4f2ee : coat);
    u.armR.remove(u.armR.children[u.armR.children.length - 1]);  // teber yok
    g.traverse(o => { if (o.material === M.coatMat) o.material = cm; if (o.material === M.redMat) o.material = trim; if ((hat !== 'tricorne' || chef) && o.position.y > 1.9) o.visible = false; });
    if (chef){ add(new THREE.CylinderGeometry(0.17, 0.13, 0.36, 14), cream, 0, 2.08, 0, g); add(new THREE.SphereGeometry(0.2, 14, 8), cream, 0, 2.28, 0, g).scale.y = 0.6; }
    if (apron) add(new THREE.BoxGeometry(0.42, 0.75, 0.02), apron === true ? cream : mat(apron), 0, 0.95, 0.17, g);
    return g;
  }
  function lady(gownC, hairC = 0x5a3a22){
    const g = new THREE.Group();
    const skin = mat(0xecc9ad, {roughness:0.62}), gown = mat(gownC, {roughness:0.45}), hair = mat(hairC, {roughness:0.55});
    add(lathe([[0, 1.06], [0.17, 1.06], [0.2, 0.95], [0.32, 0.65], [0.5, 0.25], [0.6, 0.02], [0, 0.02]], 28), gown, 0, 0, 0, g);
    add(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 14), gown, 0, 1.25, 0, g);
    add(new THREE.TorusGeometry(0.17, 0.02, 6, 24), gold, 0, 1.08, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.14, 10), skin, 0, 1.52, 0, g);
    add(new THREE.SphereGeometry(0.115, 18, 14), skin, 0, 1.68, 0, g).scale.set(0.95, 1.1, 1);
    add(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 1.7, -0.01, g);
    add(new THREE.SphereGeometry(0.09, 12, 10), hair, 0, 1.86, -0.06, g);
    [-1, 1].forEach(sd => { add(new THREE.SphereGeometry(0.016, 8, 6), eyeMat, sd * 0.04, 1.7, 0.105, g); const a = add(new THREE.CylinderGeometry(0.035, 0.03, 0.5, 8), skin, sd * 0.21, 1.2, 0.04, g); a.rotation.z = sd * 0.15; a.rotation.x = -0.35; });
    return g;
  }
  // Venedik maskesi (göz hizası 1.7-1.8 m)
  function mask(color = 0xd4af37, y = 1.8, z = 0.11){
    const g = new THREE.Group(); g.position.set(0, y, z);
    const m = add(new THREE.SphereGeometry(0.13, 16, 8, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.32, Math.PI * 0.22), mat(color, {metalness:0.7, roughness:0.3, side:THREE.DoubleSide}), 0, -0.02, -0.1, g, false);
    [-1, 1].forEach(sd => { const f = add(new THREE.ConeGeometry(0.02, 0.22, 5), mat(0xc8102e), sd * 0.1, 0.1, -0.04, g, false); f.rotation.z = -sd * 0.5; });
    return g;
  }
  function placeNPC(g, x, z, ry, name, act, r = 2.6){
    g.position.set(x, 0, z); g.rotation.y = ry; g.userData.dyn = true; root.add(g); C.circle(x, z, 0.4);
    updaters.push((dt, t, hero) => {
      const d = Math.hypot(hero.pos.x - x, hero.pos.z - z);
      world.turnToward(g, d < 5 ? Math.atan2(hero.pos.x - x, hero.pos.z - z) : ry, Math.min(1, dt * 3));
    });
    if (act) interact.push({x, z, r, label:'Konuş: ' + name, show:() => true, act});
    return g;
  }

  /* ================= heykeller ================= */
  // v: 0 togalı imparator (kol kalkık), 1 mızrak-kalkanlı savaşçı, 2 meşaleli tanrıça, 3 kanatlı Zafer, 4 lirli ozan, 5 aslanlı kahraman
  const statueGeos = [0, 1, 2, 3, 4, 5].map(v => {
    const parts = [];
    parts.push(v === 1 || v === 5 ? lathe([[0, 0], [0.3, 0], [0.26, 0.5], [0.24, 0.95], [0.2, 1.3], [0, 1.3]]) : lathe([[0, 0], [0.42, 0], [0.38, 0.4], [0.3, 0.95], [0.24, 1.3], [0, 1.3]]));
    const torso = new THREE.CylinderGeometry(0.19, 0.24, 0.55, 12); torso.translate(0, 1.55, 0); parts.push(torso);
    const head = new THREE.SphereGeometry(0.15, 14, 10); head.translate(0, 1.98, 0); parts.push(head);
    const arm = (side, rx, rz) => { const a = new THREE.CylinderGeometry(0.06, 0.05, 0.62, 8); a.translate(0, -0.31, 0); a.rotateX(rx); a.rotateZ(side * rz); a.translate(-side * 0.26, 1.78, 0); parts.push(a); };
    if (v === 0){ arm(1, 0, 0.3); arm(-1, -2.6, 0.2); const laurel = new THREE.TorusGeometry(0.15, 0.025, 6, 16); laurel.rotateX(Math.PI / 2); laurel.translate(0, 2.05, 0); parts.push(laurel); }
    if (v === 1){ arm(1, -0.9, 0.2); arm(-1, -1.2, -0.1); const sp = new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6); sp.translate(0.3, 1.6, 0.3); parts.push(sp); const sh = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 18); sh.rotateX(Math.PI / 2); sh.translate(-0.32, 1.45, 0.25); parts.push(sh); const hm = new THREE.ConeGeometry(0.16, 0.3, 10); hm.translate(0, 2.2, 0); parts.push(hm); }
    if (v === 2){ arm(1, 0, 0.2); arm(-1, -2.9, 0.1); const tc = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 6); tc.translate(0.26, 2.6, 0); parts.push(tc); const fl = new THREE.ConeGeometry(0.1, 0.25, 8); fl.translate(0.26, 2.95, 0); parts.push(fl); }
    if (v === 3){ arm(1, -2.4, 0.4); arm(-1, -2.4, 0.4); [-1, 1].forEach(sd => { const w = new THREE.ConeGeometry(0.45, 1.3, 4); w.rotateZ(sd * 0.5); w.scale(1, 1, 0.25); w.translate(sd * 0.4, 1.95, -0.3); parts.push(w); }); const wr = new THREE.TorusGeometry(0.16, 0.03, 6, 16); wr.translate(0, 3.0, 0.1); parts.push(wr); }
    if (v === 4){ arm(1, -1.0, 0.1); arm(-1, -1.2, 0.3); const ly = new THREE.TorusGeometry(0.18, 0.025, 6, 16, Math.PI * 1.3); ly.translate(0.05, 1.55, 0.35); parts.push(ly); }
    if (v === 5){ arm(1, -0.3, 0.6); arm(-1, 0, 0.25); const lion = new THREE.SphereGeometry(0.32, 12, 10); lion.scale(1.4, 0.8, 0.8); lion.translate(0.5, 0.3, 0.3); parts.push(lion); const club = new THREE.CylinderGeometry(0.07, 0.04, 1.1, 8); club.rotateZ(0.2); club.translate(-0.45, 0.9, 0); parts.push(club); }
    return mergeBufferGeometries(parts);
  });
  function statue(x, z, v, ry = 0, scale = 1, name, text, m = marble){
    add(new THREE.BoxGeometry(0.9 * scale, 1.1 * scale, 0.9 * scale), m, x, 0.55 * scale, z);
    add(new THREE.BoxGeometry(1.05 * scale, 0.14 * scale, 1.05 * scale), m, x, 1.12 * scale, z);
    const st = add(statueGeos[v % statueGeos.length], m, x, 1.19 * scale, z); st.rotation.y = ry; st.scale.setScalar(scale);
    C.circle(x, z, 0.55 * scale);
    if (name) interact.push({x, z, r:1.9, label:'Heykel: ' + name, show:() => true, act:() => say(name, text)});
    return st;
  }

  /* ================= sabit parçaları birleştir ================= */
  function bake(){
    root.updateMatrixWorld(true);
    const buckets = new Map(), drop = [];
    const mergable = o => o.isMesh && !o.isInstancedMesh && o.geometry.attributes.uv && !o.userData.keep;
    const flat = (g, mtx) => { g = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(mtx); Object.keys(g.attributes).forEach(k => { if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); }); return g; };
    const mergeLocal = G => {
      const inv = G.matrixWorld.clone().invert(), local = new Map(), gone = [], m = new THREE.Matrix4();
      const visit = o => o.children.forEach(c => {
        if (c.userData.dyn){ mergeLocal(c); return; }
        if (c.userData.anim) return;
        if (mergable(c) && c.visible){ const k = c.material.uuid + '|' + c.castShadow + '|' + c.layers.mask; let b = local.get(k); if (!b){ b = {mat:c.material, cast:c.castShadow, layers:c.layers.mask, geos:[]}; local.set(k, b); } b.geos.push(flat(c.geometry, m.multiplyMatrices(inv, c.matrixWorld))); gone.push(c); }
        visit(c);
      });
      visit(G);
      gone.forEach(o => o.parent.remove(o));
      local.forEach(b => { const mm = new THREE.Mesh(mergeBufferGeometries(b.geos), b.mat); mm.castShadow = b.cast; mm.receiveShadow = true; mm.layers.mask = b.layers; G.add(mm); });
    };
    const walk = o => {
      if (o.userData.dyn){ mergeLocal(o); return; }
      if (mergable(o)){
        const wp = o.getWorldPosition(L(0, 0, 0)), key = [o.material.uuid, o.castShadow, o.renderOrder, o.layers.mask, Math.floor(wp.x / 90), Math.floor(wp.z / 90)].join('|');
        let b = buckets.get(key); if (!b){ b = {mat:o.material, cast:o.castShadow, order:o.renderOrder, layers:o.layers.mask, geos:[]}; buckets.set(key, b); }
        b.geos.push(flat(o.geometry, o.matrixWorld)); drop.push(o);
      }
      o.children.forEach(walk);
    };
    root.children.slice().forEach(walk);
    drop.forEach(o => o.parent.remove(o));
    buckets.forEach(b => { const m = new THREE.Mesh(mergeBufferGeometries(b.geos), b.mat); m.castShadow = b.cast; m.receiveShadow = true; m.renderOrder = b.order; m.layers.mask = b.layers; root.add(m); });
  }
  // Renkler sRGB yazıldı; motorun doğrusal düzenine çevir (dünyanın paylaşılan malzemelerine dokunma).
  function fixColors(extra = []){
    const shared = new Set(Object.values(M)), done = new Set();
    const fix = m => { if (!m || shared.has(m) || done.has(m) || m.isMeshBasicMaterial || m.isPointsMaterial || m.isShaderMaterial) return; done.add(m); if (m.color) m.color.convertSRGBToLinear(); };
    [root, ...extra].forEach(r => r.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(fix); }));
  }

  return {THREE, M, rnd, L, m4, q4, s4, add, canvas, ctex, plane, disc, toWorld, lathe, mat, gold, stone, marble, gravel, slate, cream, plaster, wood, darkWood, winMat, lampMat, grass,
    doorway:(parent, o) => doorway(world, parent, o), signBoard, signPost, column, frustum, gableGeo, windows, hall, npc, lady, mask, placeNPC, statue, statueGeos, bake, fixColors, interact, updaters};
}
