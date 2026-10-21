// Doğu köşesi: kubbeli dev kafeste ejderha ve yumurtaları, Kelebek Vadisi (botanik bahçe),
// Cennet Bağı (üzüm bağı ve pergola) ve Prenses Aurélie.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const CAGE = {x:78, z:62, R:11};
export const VALLEY = {x:80, z:122};
export const VINE = {x:136, z:122};

export function buildSanctuary(world, C, hooks){
  const { THREE, scene, materials:M, windMat } = world;
  const root = new THREE.Group(); root.name = 'DoguBahceleri'; scene.add(root);
  let seed = 707; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const interact = [], markers = [];
  function add(geo, mat, x, y, z, parent = root, cast = true){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
  function ctex(c, rx = 1, ry = 1){ const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
  function plane(w, d, mat, x, y, z, rot = 0){ const m = add(new THREE.PlaneGeometry(w, d), mat, x, y, z, root, false); m.rotation.set(-Math.PI / 2, 0, rot); return m; }

  const gold = M.goldMat, stone = M.stoneMat, marble = M.marbleMat, gravel = M.gravelMat;
  const wood = new THREE.MeshStandardMaterial({color:0x6b4a2e, roughness:0.85});
  const rock = new THREE.MeshStandardMaterial({color:0x7d7a76, roughness:0.95, flatShading:true});
  const water = new THREE.MeshStandardMaterial({color:0x2a5a68, metalness:0.3, roughness:0.05, transparent:true, opacity:0.92});
  const leafMat = new THREE.MeshStandardMaterial({color:0x2f6a2a, roughness:0.8, flatShading:true});

  /* ================= yollar ================= */
  plane(34, 3.6, gravel, 54, 0.05, 50.8);                       // bahçeden doğuya
  const plaza = add(new THREE.CircleGeometry(16, 64), gravel, CAGE.x, 0.03, CAGE.z, root, false); plaza.rotation.x = -Math.PI / 2;
  plane(3.6, 24, gravel, CAGE.x, 0.05, 88);                      // kafesten vadiye
  plane(66, 3.6, gravel, 128, 0.05, VINE.z);                     // vadiden bağa (ana yol)

  /* ================= kubbeli dev kafes ================= */
  const { R } = CAGE, WALL = 12, DOME = 10;
  const cage = new THREE.Group(); cage.position.set(CAGE.x, 0, CAGE.z); root.add(cage);
  add(new THREE.CylinderGeometry(R + 0.8, R + 1.1, 0.7, 72), marble, 0, 0.35, 0, cage);
  add(new THREE.TorusGeometry(R + 0.85, 0.12, 8, 96), gold, 0, 0.72, 0, cage).rotation.x = Math.PI / 2;
  // iç zemin: saman ve toprak
  const [hc, hg] = canvas(256, 256); hg.fillStyle = '#7a6a42'; hg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1400; i++){ hg.strokeStyle = `rgba(${170 + rnd() * 70 | 0},${140 + rnd() * 60 | 0},${60 + rnd() * 40 | 0},.6)`; hg.beginPath(); const x = rnd() * 256, y = rnd() * 256, a = rnd() * 6.28; hg.moveTo(x, y); hg.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); hg.stroke(); }
  const floor = add(new THREE.CircleGeometry(R + 0.6, 72), new THREE.MeshStandardMaterial({map:ctex(hc, 6, 6), roughness:1}), 0, 0.71, 0, cage, false); floor.rotation.x = -Math.PI / 2;
  // dikey parmaklıklar
  const NB = 84, barGeo = new THREE.CylinderGeometry(0.06, 0.06, WALL, 6); barGeo.translate(0, WALL / 2, 0);
  const bars = new THREE.InstancedMesh(barGeo, gold, NB), m4 = new THREE.Matrix4();
  for (let i = 0; i < NB; i++){ const a = i / NB * Math.PI * 2; m4.makeTranslation(Math.cos(a) * R, 0.7, Math.sin(a) * R); bars.setMatrixAt(i, m4); }
  bars.castShadow = true; cage.add(bars);
  [0.9, 4.5, 8.2, WALL + 0.7].forEach((y, k) => add(new THREE.TorusGeometry(R, k === 3 ? 0.16 : 0.09, 8, 120), gold, 0, y, 0, cage).rotation.x = Math.PI / 2);
  // kubbe kaburgaları
  const NR = 28;
  for (let i = 0; i < NR; i++){
    const a = i / NR * Math.PI * 2, pts = [];
    for (let k = 0; k <= 16; k++){ const t = k / 16 * Math.PI / 2; pts.push(L(Math.cos(a) * R * Math.cos(t), WALL + 0.7 + Math.sin(t) * DOME, Math.sin(a) * R * Math.cos(t))); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.07, 5), gold, 0, 0, 0, cage, false);
  }
  [0.4, 0.7, 0.9].forEach(f => { const t = f * Math.PI / 2; add(new THREE.TorusGeometry(R * Math.cos(t), 0.08, 6, 80), gold, 0, WALL + 0.7 + Math.sin(t) * DOME, 0, cage).rotation.x = Math.PI / 2; });
  add(new THREE.SphereGeometry(0.9, 20, 14), gold, 0, WALL + 0.7 + DOME + 0.5, 0, cage);
  add(new THREE.TorusGeometry(0.9, 0.16, 10, 32), gold, 0, WALL + 0.7 + DOME + 2.0, 0, cage);
  // kapı (batı) ve süslemeler
  const door = new THREE.Group(); door.position.set(-R - 0.05, 0.7, 0); cage.add(door);
  [-1.8, 1.8].forEach(z => add(new THREE.BoxGeometry(0.3, 5.6, 0.3), gold, 0, 2.8, z, door));
  add(new THREE.TorusGeometry(1.8, 0.12, 8, 32, Math.PI), gold, 0, 5.6, 0, door).rotation.y = Math.PI / 2;
  add(new THREE.BoxGeometry(0.35, 0.5, 0.3), new THREE.MeshStandardMaterial({color:0x2a2a2e, metalness:0.8, roughness:0.3}), -0.15, 2.4, 0.3, door);
  for (let i = 0; i < 8; i++){ const a = i / 8 * Math.PI * 2 + 0.2; const lamp = add(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false}), Math.cos(a) * (R + 0.9), 1.0, Math.sin(a) * (R + 0.9), cage, false); lamp.userData.lamp = true; }
  for (let i = 0; i < 64; i++){ const a = i / 64 * Math.PI * 2; C.circle(CAGE.x + Math.cos(a) * R, CAGE.z + Math.sin(a) * R, 0.55); }
  // kayalar, yuva ve yumurtalar
  [[4, -5, 2.0], [6.5, 2.5, 1.4], [-3, 6.5, 1.7], [-6.5, -4.5, 1.2]].forEach(([x, z, s]) => { const r = add(new THREE.DodecahedronGeometry(s, 0), rock, x, 0.7 + s * 0.5, z, cage); r.rotation.set(rnd(), rnd() * 3, rnd()); r.scale.y = 0.7; });
  const NEST = {x:2.5, z:3.5};
  const twig = new THREE.MeshStandardMaterial({color:0x5a3e22, roughness:1});
  add(new THREE.TorusGeometry(1.6, 0.45, 10, 32), twig, NEST.x, 1.0, NEST.z, cage).rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 24), new THREE.MeshStandardMaterial({color:0xb79a52, roughness:1}), NEST.x, 0.85, NEST.z, cage);
  function eggMat(base, spot){
    const [c, g] = canvas(128, 128); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 90; i++){ g.fillStyle = spot; g.globalAlpha = 0.3 + rnd() * 0.5; g.beginPath(); g.arc(rnd() * 128, rnd() * 128, 1 + rnd() * 4, 0, Math.PI * 2); g.fill(); }
    return new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.25, metalness:0.25, emissive:new THREE.Color(base), emissiveIntensity:0.08});
  }
  const eggGeo = new THREE.SphereGeometry(0.34, 24, 16); eggGeo.scale(1, 1.35, 1);
  const EGGS = [['#e9e2d2', '#7a6a52'], ['#2f8c84', '#0f3a36'], ['#d8a83a', '#6a4a12'], ['#c86a7a', '#5a1a2a'], ['#6a4ab0', '#24104a']];
  const eggMats = EGGS.map(([b, s]) => eggMat(b, s));
  const eggSlots = [[-0.6, -0.4], [0.5, -0.5], [0.0, 0.55], [-0.75, 0.45], [0.75, 0.45]];
  const nestEggs = eggSlots.map(([dx, dz], i) => { const e = add(eggGeo, eggMats[i], NEST.x + dx, 1.33, NEST.z + dz, cage); e.rotation.set((rnd() - 0.5) * 0.4, rnd() * 3, (rnd() - 0.5) * 0.4); return e; });

  /* ================= ejderha ================= */
  const dragon = makeDragon(); dragon.root.position.set(-0.5, 0.7, -2.6); dragon.root.rotation.y = -Math.PI / 2 + 0.35; cage.add(dragon.root);
  function makeDragon(){
    const g = new THREE.Group();
    const [sc, sg] = canvas(256, 256); sg.fillStyle = '#1d5a4c'; sg.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++){
      const px = x * 15 + (y % 2) * 7.5, py = y * 15, v = rnd() * 30;
      sg.fillStyle = `rgb(${30 + v | 0},${100 + v * 1.5 | 0},${84 + v | 0})`; sg.beginPath(); sg.arc(px, py, 8, 0, Math.PI); sg.fill();
      sg.strokeStyle = 'rgba(10,40,34,.6)'; sg.lineWidth = 1.2; sg.beginPath(); sg.arc(px, py, 8, 0, Math.PI); sg.stroke();
    }
    const scales = new THREE.MeshStandardMaterial({map:ctex(sc, 3, 3), roughness:0.45, metalness:0.25});
    const belly = new THREE.MeshStandardMaterial({color:0xc9a24a, roughness:0.5, metalness:0.3});
    const horn = new THREE.MeshStandardMaterial({color:0xe9dfc8, roughness:0.4});
    const membrane = new THREE.MeshStandardMaterial({color:0xb35a26, roughness:0.6, side:THREE.DoubleSide, transparent:true, opacity:0.92, emissive:0x3a1206, emissiveIntensity:0.4});
    const eye = new THREE.MeshBasicMaterial({color:new THREE.Color(2.2, 1.4, 0.2)});
    const body = new THREE.Group(); body.position.y = 2.6; g.add(body);
    const torso = add(new THREE.CapsuleGeometry(1.15, 2.6, 8, 16), scales, 0, 0, 0, body); torso.rotation.x = Math.PI / 2;
    const tb = add(new THREE.CapsuleGeometry(0.95, 2.3, 8, 16), belly, 0, -0.35, 0.1, body); tb.rotation.x = Math.PI / 2;
    // sırt dikenleri
    for (let i = 0; i < 7; i++){ const sp = add(new THREE.ConeGeometry(0.16, 0.6 - i * 0.03, 6), horn, 0, 1.15, -1.6 + i * 0.55, body); sp.rotation.x = -0.4; }
    // bacaklar
    const legs = [];
    [[-0.85, 1.2], [0.85, 1.2], [-0.95, -1.3], [0.95, -1.3]].forEach(([x, z], i) => {
      const hip = new THREE.Group(); hip.position.set(x, -0.4, z); body.add(hip);
      const up = new THREE.CylinderGeometry(0.42, 0.32, 1.4, 10); up.translate(0, -0.7, 0); add(up, scales, 0, 0, 0, hip).rotation.x = i < 2 ? 0.25 : -0.3;
      add(new THREE.SphereGeometry(0.34, 10, 8), scales, 0, -1.3, i < 2 ? 0.32 : -0.4, hip);
      const knee = new THREE.Group(); knee.position.set(0, -1.3, i < 2 ? 0.32 : -0.4); hip.add(knee);
      const lo = new THREE.CylinderGeometry(0.28, 0.22, 1.05, 10); lo.translate(0, -0.5, 0); add(lo, scales, 0, 0, 0, knee).rotation.x = i < 2 ? -0.3 : 0.35;
      for (let c = -1; c <= 1; c++){ const cl = add(new THREE.ConeGeometry(0.07, 0.4, 6), horn, c * 0.15, -1.05, 0.3, knee); cl.rotation.x = Math.PI / 2 + 0.3; }
      legs.push(hip);
    });
    // boyun zinciri
    const neck = []; let parent = body, cur = new THREE.Group(); cur.position.set(0, 0.5, 1.9); body.add(cur);
    for (let i = 0; i < 7; i++){
      const r = 0.62 - i * 0.045;
      add(new THREE.SphereGeometry(r, 14, 10), scales, 0, 0, 0, cur).scale.set(1, 1, 1.25);
      add(new THREE.SphereGeometry(r * 0.8, 10, 8), belly, 0, -r * 0.35, r * 0.25, cur);
      const sp = add(new THREE.ConeGeometry(0.1, 0.38, 6), horn, 0, r * 0.95, -0.1, cur); sp.rotation.x = -0.5;
      neck.push(cur);
      const nx = new THREE.Group(); nx.position.set(0, 0.34, 0.38); nx.rotation.x = i < 3 ? -0.08 : 0.2; nx.userData.bx = nx.rotation.x; cur.add(nx); cur = nx;
    }
    // kafa
    const head = cur; head.rotation.x = -0.45; head.scale.setScalar(1.35);
    add(new THREE.SphereGeometry(0.55, 16, 12), scales, 0, 0.1, 0.1, head).scale.set(1, 0.85, 1.15);
    const snout = add(new THREE.CylinderGeometry(0.28, 0.42, 1.1, 12), scales, 0, 0.0, 0.85, head); snout.rotation.x = Math.PI / 2;
    const jaw = new THREE.Group(); jaw.position.set(0, -0.2, 0.35); head.add(jaw);
    const jw = add(new THREE.CylinderGeometry(0.2, 0.32, 1.0, 10), belly, 0, -0.08, 0.5, jaw); jw.rotation.x = Math.PI / 2;
    for (let k = -1; k <= 1; k += 2){
      add(new THREE.SphereGeometry(0.11, 12, 8), eye, k * 0.32, 0.25, 0.42, head);
      const h1 = add(new THREE.ConeGeometry(0.13, 1.2, 8), horn, k * 0.3, 0.5, -0.4, head); h1.rotation.set(-1.0, 0, k * 0.35);
      const h2 = add(new THREE.ConeGeometry(0.08, 0.6, 6), horn, k * 0.45, 0.2, -0.3, head); h2.rotation.set(-1.2, 0, k * 0.9);
      add(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color:0x111111}), k * 0.12, 0.12, 1.4, head);
    }
    for (let i = 0; i < 4; i++){ const f = add(new THREE.ConeGeometry(0.06, 0.32, 6), horn, 0, 0.45, 0.3 - i * 0.2, head); f.rotation.x = -0.6; }
    // kuyruk
    const tail = []; let tc = new THREE.Group(); tc.position.set(0, 0.0, -2.2); body.add(tc);
    for (let i = 0; i < 11; i++){
      const r = 0.75 - i * 0.06;
      add(new THREE.SphereGeometry(Math.max(0.12, r), 12, 8), scales, 0, 0, 0, tc).scale.set(1, 0.9, 1.4);
      if (i % 2 === 0){ const sp = add(new THREE.ConeGeometry(0.1, 0.35, 6), horn, 0, Math.max(0.12, r) * 0.9, 0, tc); sp.rotation.x = 0.5; }
      tail.push(tc);
      const nx = new THREE.Group(); nx.position.set(0, -0.08, -Math.max(0.25, r * 0.9)); tc.add(nx); tc = nx;
    }
    const spade = add(new THREE.ConeGeometry(0.4, 0.8, 4), horn, 0, 0, -0.2, tc); spade.rotation.x = -Math.PI / 2; spade.scale.set(1, 1, 0.3);
    // kanatlar: kemikler + zar
    const wings = [];
    [-1, 1].forEach(sd => {
      const w = new THREE.Group(); w.position.set(sd * 0.9, 0.85, 0.9); body.add(w);
      const arm = new THREE.CylinderGeometry(0.12, 0.09, 2.6, 8); arm.translate(0, 1.3, 0);
      const ab = add(arm, scales, 0, 0, 0, w); ab.rotation.z = -sd * 1.05;
      const tip = L(sd * Math.sin(1.05) * 2.6, Math.cos(1.05) * 2.6, 0);
      const fingers = [[3.4, -0.4, -0.6], [3.0, -1.5, -1.5], [2.0, -2.4, -2.4]].map(([len, dy, dz]) => L(tip.x + sd * len * 0.85, tip.y + dy, tip.z + dz));
      fingers.forEach(f => { const d = f.clone().sub(tip), fb = add(new THREE.CylinderGeometry(0.06, 0.03, d.length(), 6), scales, 0, 0, 0, w); fb.position.copy(tip).add(d.clone().multiplyScalar(0.5)); fb.quaternion.setFromUnitVectors(L(0, 1, 0), d.normalize()); });
      const base = L(0, 0, -1.8), pts = [L(0, 0, 0), tip, ...fingers, base];
      const pos = [];
      const tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      tri(pts[0], pts[1], pts[5]); tri(pts[1], pts[2], pts[3]); tri(pts[1], pts[3], pts[4]); tri(pts[1], pts[4], pts[5]);
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mg.computeVertexNormals();
      add(mg, membrane, 0, 0, 0, w, true);
      w.scale.setScalar(0.85); wings.push({w, sd});
    });
    // ağız ateşi
    const FIRE = 220, fGeo = new THREE.BufferGeometry(), fPos = new Float32Array(FIRE * 3), fVel = new Float32Array(FIRE * 3), fLife = new Float32Array(FIRE);
    fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3));
    const [pc, pg] = canvas(32, 32); const gr = pg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(0.4, 'rgba(255,200,80,.9)'); gr.addColorStop(1, 'rgba(255,80,0,0)'); pg.fillStyle = gr; pg.fillRect(0, 0, 32, 32);
    const fireMat = new THREE.PointsMaterial({size:0.9, map:new THREE.CanvasTexture(pc), color:0xffa040, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false});
    const fire = new THREE.Points(fGeo, fireMat); fire.frustumCulled = false; scene.add(fire);
    const fireLight = new THREE.PointLight(0xff7a2a, 0, 26, 2); scene.add(fireLight);
    return {root:g, body, neck, head, jaw, tail, wings, legs, fire, fGeo, fPos, fVel, fLife, FIRE, fireLight, roar:0, nextRoar:12};
  }

  /* ================= Kelebek Vadisi (botanik bahçe) ================= */
  const V = VALLEY;
  const lawn = add(new THREE.CircleGeometry(26, 64), new THREE.MeshStandardMaterial({color:0x5c8a3a, roughness:1}), V.x, 0.02, V.z, root, false); lawn.rotation.x = -Math.PI / 2;
  // giriş kemeri
  {
    const ax = V.x, az = V.z - 25;
    [-2.2, 2.2].forEach(dx => add(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 10), wood, ax + dx, 1.7, az));
    const arch = add(new THREE.TorusGeometry(2.2, 0.16, 8, 32, Math.PI), wood, ax, 3.4, az);
    const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({roughness:0.6}), 70), c = new THREE.Color();
    for (let i = 0; i < 70; i++){ const a = rnd() * Math.PI, r = 2.2 + (rnd() - 0.5) * 0.4; m4.makeTranslation(ax + Math.cos(a) * r, 3.4 + Math.sin(a) * r, az + (rnd() - 0.5) * 0.4); fl.setMatrixAt(i, m4); c.set(['#ff70a6', '#ffd23f', '#ffffff', '#c77dff', '#ff8c42'][i % 5]); fl.setColorAt(i, c); }
    root.add(fl);
    const [sc2, sg2] = canvas(512, 128); sg2.fillStyle = '#3a2a1c'; sg2.fillRect(0, 0, 512, 128); sg2.strokeStyle = '#d4af37'; sg2.lineWidth = 6; sg2.strokeRect(8, 8, 496, 112); sg2.fillStyle = '#f6ecd0'; sg2.font = '58px Georgia, serif'; sg2.textAlign = 'center'; sg2.fillText('Kelebek Vadisi', 256, 84);
    add(new THREE.BoxGeometry(3.2, 0.8, 0.08), new THREE.MeshStandardMaterial({map:ctex(sc2), roughness:0.8}), ax, 5.0, az);
    C.circle(ax - 2.2, az, 0.3); C.circle(ax + 2.2, az, 0.3);
  }
  // şelale, havuz, dere ve köprü
  const POND = {x:V.x + 9, z:V.z + 8, r:5.5};
  {
    const pw = add(new THREE.CircleGeometry(POND.r, 48), water, POND.x, 0.08, POND.z, root, false); pw.rotation.x = -Math.PI / 2;
    add(new THREE.TorusGeometry(POND.r + 0.2, 0.45, 8, 48), rock, POND.x, 0.15, POND.z).rotation.x = Math.PI / 2;
    C.circle(POND.x, POND.z, POND.r + 0.3);
    for (let i = 0; i < 14; i++){ const a = -0.4 + i * 0.08, r = POND.r + 1 + rnd(); const s = 1.2 + rnd() * 1.6; const rk = add(new THREE.DodecahedronGeometry(s, 0), rock, POND.x + Math.cos(a) * r, s * 0.6 + (i % 4) * 0.8, POND.z + Math.sin(a) * r + 2); rk.rotation.set(rnd(), rnd() * 3, rnd()); }
    C.circle(POND.x + POND.r + 1.6, POND.z + 2.6, 3.0);
    for (let i = 0; i < 9; i++){ const lp = add(new THREE.CircleGeometry(0.4 + rnd() * 0.2, 14, 0.3, 5.8), new THREE.MeshStandardMaterial({color:0x4f8f3a, roughness:0.6}), POND.x - 2 + rnd() * 4, 0.1, POND.z - 2 + rnd() * 4, root, false); lp.rotation.x = -Math.PI / 2; }
    for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({color:0xffb6d0}), POND.x - 2 + rnd() * 4, 0.16, POND.z - 2 + rnd() * 4, root, false);
  }
  const fallMat = (() => {
    const [c, g] = canvas(64, 256); g.fillStyle = 'rgba(200,230,245,.55)'; g.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 80; i++){ g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.5})`; g.fillRect(rnd() * 64, rnd() * 256, 1 + rnd() * 2, 12 + rnd() * 30); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshBasicMaterial({map:t, transparent:true, depthWrite:false, side:THREE.DoubleSide});
  })();
  const fall = add(new THREE.PlaneGeometry(2.4, 4.2), fallMat, POND.x + POND.r - 0.2, 2.2, POND.z + 1.2, root, false); fall.rotation.y = -Math.PI / 2 + 0.25;
  const SPL = 120, spGeo = new THREE.BufferGeometry(), spPos = new Float32Array(SPL * 3), spVel = new Float32Array(SPL * 3);
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const splash = new THREE.Points(spGeo, new THREE.PointsMaterial({color:0xe8f4ff, size:0.12, transparent:true, opacity:0.8, depthWrite:false})); splash.frustumCulled = false; root.add(splash);
  const resetSplash = i => { spPos.set([POND.x + POND.r - 0.6 + (rnd() - 0.5) * 0.8, 0.2, POND.z + 1.2 + (rnd() - 0.5) * 2], i * 3); spVel.set([(rnd() - 0.8) * 1.2, 1.2 + rnd() * 1.8, (rnd() - 0.5) * 1.2], i * 3); };
  for (let i = 0; i < SPL; i++){ resetSplash(i); spPos[i * 3 + 1] = rnd() * 1.5; }
  // dere: havuzdan güneybatıya kıvrılan şerit
  const creek = new THREE.CatmullRomCurve3([L(POND.x - 4.5, 0.06, POND.z - 2), L(V.x, 0.06, V.z - 2), L(V.x - 8, 0.06, V.z + 2), L(V.x - 16, 0.06, V.z - 4), L(V.x - 24, 0.06, V.z - 2)]);
  {
    const N = 80, pos = [], idx = [];
    for (let i = 0; i <= N; i++){
      const p = creek.getPointAt(i / N), tg = creek.getTangentAt(i / N), nx = -tg.z, nz = tg.x, w = 1.1;
      pos.push(p.x + nx * w, 0.06, p.z + nz * w, p.x - nx * w, 0.06, p.z - nz * w);
      if (i < N){ const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    add(g, water, 0, 0.0, 0, root, false);
    // taş kenarlar
    const st = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.28, 0), rock, 140);
    for (let i = 0; i < 140; i++){ const t = (i >> 1) / 70, p = creek.getPointAt(t), tg = creek.getTangentAt(t), sd = i % 2 ? 1 : -1; m4.makeTranslation(p.x - tg.z * 1.25 * sd, 0.1, p.z + tg.x * 1.25 * sd); st.setMatrixAt(i, m4); }
    root.add(st);
    // ahşap kemer köprü
    const bp = creek.getPointAt(0.42), bt = creek.getTangentAt(0.42), ang = Math.atan2(bt.x, bt.z);
    const br = new THREE.Group(); br.position.set(bp.x, 0, bp.z); br.rotation.y = ang + Math.PI / 2; root.add(br);
    for (let i = 0; i < 9; i++){ const t = i / 8 - 0.5, y = 0.15 + Math.cos(t * Math.PI) * 0.55; add(new THREE.BoxGeometry(1.8, 0.1, 0.42), wood, 0, y, t * 3.6, br); }
    [-0.85, 0.85].forEach(x => { const pts = []; for (let i = 0; i <= 10; i++){ const t = i / 10 - 0.5; pts.push(L(x, 1.15 + Math.cos(t * Math.PI) * 0.55, t * 3.6)); } add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.05, 6), wood, 0, 0, 0, br); });
  }
  // bitkiler: palmiyeler, dev yapraklar, çiçek tarhları
  const frond = (() => { const g = new THREE.PlaneGeometry(0.55, 2.6, 1, 8); g.translate(0, 1.3, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++){ const y = p.getY(i), t = y / 2.6; p.setX(i, p.getX(i) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05))); p.setZ(i, -t * t * 1.4); } g.computeVertexNormals(); return g; })();
  const frondMat = new THREE.MeshStandardMaterial({color:0x3f7d2c, roughness:0.7, side:THREE.DoubleSide});
  const trunkMat = new THREE.MeshStandardMaterial({color:0x7a6248, roughness:0.95});
  function palm(x, z, H = 6, lean = 0.2){
    const pts = []; for (let i = 0; i <= 8; i++){ const t = i / 8; pts.push(L(x + Math.sin(t * 1.4) * lean * H * 0.4, t * H, z)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.18, 7), trunkMat, 0, 0, 0);
    const top = pts[8];
    for (let i = 0; i < 9; i++){ const f = add(frond, frondMat, top.x, top.y, top.z); f.rotation.order = 'YXZ'; f.rotation.y = i / 9 * Math.PI * 2 + rnd() * 0.3; f.rotation.x = 0.9 + rnd() * 0.35; f.scale.setScalar(1.2); }
    C.circle(x, z, 0.35);
  }
  [[-14, -10, 7], [-18, 6, 6], [12, -14, 6.5], [16, -4, 7.5], [-6, 14, 5.5], [4, 17, 6], [-20, -2, 5]].forEach(([dx, dz, h]) => palm(V.x + dx, V.z + dz, h, 0.15 + rnd() * 0.2));
  const bigLeaf = (() => {
    const [c, g] = canvas(128, 256); g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, 128, 256);
    g.fillStyle = '#3d7d34'; g.beginPath(); g.moveTo(64, 250); g.bezierCurveTo(-10, 180, 0, 40, 64, 6); g.bezierCurveTo(128, 40, 138, 180, 64, 250); g.fill();
    g.globalCompositeOperation = 'destination-out'; for (let k = 0; k < 6; k++){ [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(64 + sd * 44, 60 + k * 30, 16, 5, sd * 0.4, 0, Math.PI * 2); g.fill(); }); } g.globalCompositeOperation = 'source-over';
    g.strokeStyle = '#9bc77a'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 250); g.lineTo(64, 10); g.stroke();
    return new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(c), alphaTest:0.5, side:THREE.DoubleSide, roughness:0.7});
  })();
  bigLeaf.map.encoding = THREE.sRGBEncoding;
  const leafGeo = new THREE.PlaneGeometry(1.0, 2.0); leafGeo.translate(0, 1.0, 0);
  for (let k = 0; k < 16; k++){
    const a = rnd() * 6.28, r = 8 + rnd() * 15, bx = V.x + Math.cos(a) * r, bz = V.z + Math.sin(a) * r;
    if (Math.hypot(bx - POND.x, bz - POND.z) < POND.r + 2) continue;
    for (let i = 0; i < 6; i++){ const lf = add(leafGeo, bigLeaf, bx, 0, bz, root, false); lf.rotation.order = 'YXZ'; lf.rotation.y = i / 6 * Math.PI * 2 + rnd(); lf.rotation.x = -0.5 - rnd() * 0.4; lf.scale.setScalar(0.8 + rnd() * 0.6); }
  }
  // rüzgârla sallanan çiçek tarhları (vadide ve bağda)
  const FLOWERS = 5200;
  const stemG = new THREE.CylinderGeometry(0.008, 0.012, 0.7, 4); stemG.translate(0, 0.35, 0);
  const headG = new THREE.IcosahedronGeometry(0.07, 0); headG.translate(0, 0.72, 0);
  const fStem = new THREE.InstancedMesh(stemG, windMat(new THREE.MeshLambertMaterial({color:0x4a7a2e}), 1.5, false), FLOWERS);
  const fHead = new THREE.InstancedMesh(headG, windMat(new THREE.MeshLambertMaterial({}), 1.5, false), FLOWERS);
  const flowerSpots = [];
  {
    const PAL = ['#ff3b5c', '#ffd23f', '#ff8c42', '#ffffff', '#c77dff', '#ff70a6', '#4cc9f0', '#f72585'];
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color(); let n = 0;
    for (let b = 0; b < 26 && n < FLOWERS; b++){
      const a = rnd() * 6.28, r = 4 + rnd() * 20, bx = V.x + Math.cos(a) * r, bz = V.z + Math.sin(a) * r;
      if (Math.hypot(bx - POND.x, bz - POND.z) < POND.r + 2.5) continue;
      flowerSpots.push([bx, bz]);
      const pal = [PAL[b % PAL.length], PAL[(b * 3 + 1) % PAL.length]];
      for (let i = 0; i < 190 && n < FLOWERS; i++){
        const rr = Math.sqrt(rnd()) * 2.6, aa = rnd() * 6.28, sc = 0.7 + rnd() * 0.7;
        m4.compose(L(bx + Math.cos(aa) * rr, 0.02, bz + Math.sin(aa) * rr), q.identity(), s.set(sc, sc, sc)); fStem.setMatrixAt(n, m4); fHead.setMatrixAt(n, m4);
        c.set(pal[i % 2]).offsetHSL(0, 0, (rnd() - 0.5) * 0.1); fHead.setColorAt(n, c); n++;
      }
    }
    fStem.count = fHead.count = n; root.add(fStem, fHead);
  }

  /* ================= kelebekler ================= */
  const NBF = 280;
  const wingTex = (() => {
    const [c, g] = canvas(64, 64); g.clearRect(0, 0, 64, 64);
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(34, 22, 26, 18, -0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(26, 46, 16, 14, 0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(44, 18, 6, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(26, 48, 4, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(34, 22, 26, 18, -0.3, 0, Math.PI * 2); g.stroke();
    return new THREE.CanvasTexture(c);
  })();
  const wingMat = new THREE.MeshBasicMaterial({map:wingTex, alphaTest:0.4, side:THREE.DoubleSide});
  const wG = new THREE.PlaneGeometry(0.22, 0.22); wG.rotateX(-Math.PI / 2); wG.translate(0.11, 0, 0);
  const wGL = new THREE.PlaneGeometry(0.22, 0.22); wGL.rotateX(-Math.PI / 2); wGL.scale(-1, 1, 1); wGL.translate(-0.11, 0, 0);
  const bfR = new THREE.InstancedMesh(wG, wingMat, NBF), bfL = new THREE.InstancedMesh(wGL, wingMat, NBF);
  const bfs = [];
  {
    const COL = ['#ff9f1c', '#2ec4b6', '#e71d36', '#ffd23f', '#9b5de5', '#00bbf9', '#ffffff', '#f15bb5'], c = new THREE.Color();
    for (let i = 0; i < NBF; i++){
      const spot = i < NBF * 0.78 ? flowerSpots[i % flowerSpots.length] : [VINE.x + (rnd() - 0.5) * 30, VINE.z + (rnd() - 0.5) * 30];
      bfs.push({cx:spot[0], cz:spot[1], r:0.8 + rnd() * 2.6, w:0.4 + rnd() * 0.8, p:rnd() * 6.28, h:0.8 + rnd() * 1.6, f:14 + rnd() * 8});
      c.set(COL[i % COL.length]); bfR.setColorAt(i, c); bfL.setColorAt(i, c);
    }
    bfR.frustumCulled = bfL.frustumCulled = false; root.add(bfR, bfL);
  }

  /* ================= Cennet Bağı ================= */
  const P = VINE;
  const grassV = add(new THREE.PlaneGeometry(56, 50), new THREE.MeshStandardMaterial({color:0x6b8a3a, roughness:1}), P.x, 0.02, P.z, root, false); grassV.rotation.x = -Math.PI / 2;
  // üzüm salkımı geometrisi
  const bunchGeo = (() => {
    const parts = []; for (let k = 0; k < 16; k++){ const lvl = Math.floor(k / 4), a = (k % 4) / 4 * Math.PI * 2 + lvl, r = 0.09 * (1 - lvl * 0.2); const s = new THREE.SphereGeometry(0.055, 8, 6); s.translate(Math.cos(a) * r, -lvl * 0.08, Math.sin(a) * r); parts.push(s); }
    const s2 = new THREE.SphereGeometry(0.05, 8, 6); s2.translate(0, -0.34, 0); parts.push(s2);
    return mergeBufferGeometries(parts);
  })();
  const grapeP = new THREE.MeshStandardMaterial({color:0x4a2a6a, roughness:0.25, metalness:0.1});
  const grapeG = new THREE.MeshStandardMaterial({color:0x9ab84a, roughness:0.3});
  const rows = [], postsXZ = [];
  for (let x = P.x - 25; x <= P.x + 25; x += 3){
    [[P.z - 23, P.z - 3], [P.z + 3, P.z + 23]].forEach(([z0, z1]) => {
      if (Math.abs(x - P.x) < 8){ if (z1 < P.z) z1 = Math.min(z1, P.z - 8); else z0 = Math.max(z0, P.z + 8); }
      if (z1 - z0 < 2) return;
      rows.push([x, z0, z1]);
    });
  }
  {
    let leaves = 0, bunches = 0; rows.forEach(([x, z0, z1]) => { leaves += Math.round((z1 - z0) * 3.2); bunches += Math.round((z1 - z0) * 1.1); postsXZ.push(...Array.from({length:Math.floor((z1 - z0) / 4) + 1}, (_, k) => [x, z0 + k * 4])); });
    const postM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), wood, postsXZ.length);
    postsXZ.forEach(([x, z], i) => { m4.makeTranslation(x, 0.9, z); postM.setMatrixAt(i, m4); });
    root.add(postM);
    const wire = new THREE.MeshStandardMaterial({color:0x555555, metalness:0.6, roughness:0.4});
    const lv = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.32, 0), leafMat, leaves);
    const bP = new THREE.InstancedMesh(bunchGeo, grapeP, bunches), bG = new THREE.InstancedMesh(bunchGeo, grapeG, bunches);
    const q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
    let li = 0, pi = 0, gi = 0;
    rows.forEach(([x, z0, z1]) => {
      [0.9, 1.5].forEach(y => { const w = add(new THREE.CylinderGeometry(0.012, 0.012, z1 - z0, 4), wire, x, y, (z0 + z1) / 2, root, false); w.rotation.x = Math.PI / 2; });
      const nl = Math.round((z1 - z0) * 3.2);
      for (let k = 0; k < nl; k++){ const z = z0 + rnd() * (z1 - z0), sc = 0.7 + rnd() * 0.6; m4.compose(L(x + (rnd() - 0.5) * 0.5, 1.0 + rnd() * 0.75, z), q.setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, 0)), s.set(sc, sc * 0.7, sc)); lv.setMatrixAt(li, m4); c.setHSL(0.25 + rnd() * 0.06, 0.5, 0.2 + rnd() * 0.1); lv.setColorAt(li, c); li++; }
      const nb = Math.round((z1 - z0) * 1.1);
      for (let k = 0; k < nb; k++){ const z = z0 + rnd() * (z1 - z0), sd = rnd() < 0.5 ? -1 : 1; m4.compose(L(x + sd * 0.3, 0.95 + rnd() * 0.3, z), q.identity(), s.set(1, 1, 1)); if (rnd() < 0.72) bP.setMatrixAt(pi++, m4); else bG.setMatrixAt(gi++, m4); }
      C.box((x) , (z0 + z1) / 2, 0.3, (z1 - z0) / 2, 0);
    });
    lv.count = li; bP.count = pi; bG.count = gi; lv.castShadow = true; root.add(lv, bP, bG);
  }
  // pergola ve fıskiye
  {
    const N = 10, RR = 6.2;
    for (let i = 0; i < N; i++){
      const a = i / N * Math.PI * 2, x = P.x + Math.cos(a) * RR, z = P.z + Math.sin(a) * RR;
      add(new THREE.CylinderGeometry(0.22, 0.26, 3.4, 16), marble, x, 1.7, z); C.circle(x, z, 0.3);
      // sarmaşık
      for (let k = 0; k < 7; k++) add(new THREE.IcosahedronGeometry(0.26, 0), leafMat, x + Math.cos(k * 1.7) * 0.25, 0.4 + k * 0.42, z + Math.sin(k * 1.7) * 0.25, root, false);
    }
    add(new THREE.TorusGeometry(RR, 0.16, 8, 64), marble, P.x, 3.45, P.z).rotation.x = Math.PI / 2;
    for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI, b = add(new THREE.BoxGeometry(RR * 2 + 0.6, 0.14, 0.14), wood, P.x, 3.62, P.z); b.rotation.y = a; }
    const can = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.42, 0), leafMat, 220), bunch = new THREE.InstancedMesh(bunchGeo, grapeP, 60);
    const q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < 220; i++){ const a = rnd() * 6.28, r = Math.sqrt(rnd()) * (RR + 0.4); m4.compose(L(P.x + Math.cos(a) * r, 3.75 + rnd() * 0.25, P.z + Math.sin(a) * r), q.setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd())), s.set(1, 0.5, 1)); can.setMatrixAt(i, m4); }
    for (let i = 0; i < 60; i++){ const a = rnd() * 6.28, r = 2 + rnd() * (RR - 2); m4.compose(L(P.x + Math.cos(a) * r, 3.35, P.z + Math.sin(a) * r), q.identity(), s.set(1.4, 1.4, 1.4)); bunch.setMatrixAt(i, m4); }
    root.add(can, bunch);
    // fıskiye
    const prof = [[1.6, 0], [1.9, 0], [1.95, 0.5], [1.75, 0.6], [1.6, 0.35]].map(([x, y]) => new THREE.Vector2(x, y));
    add(new THREE.LatheGeometry(prof, 48), marble, P.x, 0, P.z);
    const fw = add(new THREE.CircleGeometry(1.65, 40), water, P.x, 0.45, P.z, root, false); fw.rotation.x = -Math.PI / 2;
    add(new THREE.CylinderGeometry(0.15, 0.3, 1.4, 12), marble, P.x, 0.9, P.z);
    add(new THREE.SphereGeometry(0.3, 16, 10), gold, P.x, 1.75, P.z);
    C.circle(P.x, P.z, 2.0);
    // gül çalıları ve banklar
    const roseC = ['#d1123f', '#ff8fab', '#ffffff', '#ffb703'];
    for (let i = 0; i < 16; i++){
      const a = i / 16 * Math.PI * 2 + 0.2, x = P.x + Math.cos(a) * 9, z = P.z + Math.sin(a) * 9;
      if (Math.abs(Math.sin(a)) < 0.25) continue;
      add(new THREE.IcosahedronGeometry(0.55, 1), leafMat, x, 0.5, z);
      for (let k = 0; k < 9; k++) add(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({color:roseC[i % 4], roughness:0.5}), x + (rnd() - 0.5) * 0.9, 0.55 + rnd() * 0.45, z + (rnd() - 0.5) * 0.9, root, false);
      C.circle(x, z, 0.55);
    }
    const [sc3, sg3] = canvas(512, 128); sg3.fillStyle = '#3a2a1c'; sg3.fillRect(0, 0, 512, 128); sg3.strokeStyle = '#d4af37'; sg3.lineWidth = 6; sg3.strokeRect(8, 8, 496, 112); sg3.fillStyle = '#f6ecd0'; sg3.font = '62px Georgia, serif'; sg3.textAlign = 'center'; sg3.fillText('Cennet Bağı', 256, 86);
    const sign = add(new THREE.BoxGeometry(3.0, 0.75, 0.08), new THREE.MeshStandardMaterial({map:ctex(sc3), roughness:0.8}), P.x - 27, 2.4, P.z - 2.6); sign.rotation.y = Math.PI / 2;
    [-1.3, 1.3].forEach(dz => add(new THREE.BoxGeometry(0.12, 2.6, 0.12), wood, P.x - 27, 1.3, P.z - 2.6 + dz));
  }

  /* ================= Prenses Aurélie ================= */
  const princess = makePrincess();
  princess.g.position.set(P.x + 4.5, 0, P.z); root.add(princess.g);
  function makePrincess(){
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({color:0xecc9ad, roughness:0.62});
    const hair = new THREE.MeshStandardMaterial({color:0x3a2416, roughness:0.55, side:THREE.DoubleSide});
    const gown = new THREE.MeshStandardMaterial({color:0x9db0e2, roughness:0.42, metalness:0.05});
    const trim = new THREE.MeshStandardMaterial({color:0xe8d6a8, roughness:0.4, metalness:0.4});
    const prof = [[0.0, 1.06], [0.17, 1.06], [0.2, 0.95], [0.32, 0.65], [0.5, 0.25], [0.62, 0.02], [0.0, 0.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const skirt = add(new THREE.LatheGeometry(prof, 32), gown, 0, 0, 0, g);
    add(new THREE.TorusGeometry(0.6, 0.025, 6, 40), trim, 0, 0.06, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.16, 0.18, 0.42, 16), gown, 0, 1.25, 0, g);
    add(new THREE.TorusGeometry(0.17, 0.02, 6, 24), trim, 0, 1.08, 0, g).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.17, 0.16, 0.08, 16), skin, 0, 1.47, 0, g);
    add(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 10), skin, 0, 1.53, 0, g);
    const head = new THREE.Group(); head.position.set(0, 1.68, 0); g.add(head);
    add(new THREE.SphereGeometry(0.115, 20, 16), skin, 0, 0, 0, head).scale.set(0.95, 1.12, 1.0);
    [-1, 1].forEach(sd => {
      add(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({color:0x2a1a12}), sd * 0.04, 0.02, 0.1, head);
      add(new THREE.BoxGeometry(0.035, 0.006, 0.01), new THREE.MeshBasicMaterial({color:0x2a1a12}), sd * 0.04, 0.05, 0.105, head);
    });
    add(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({color:0xb5646a, roughness:0.5}), 0, -0.055, 0.1, head).scale.set(1.4, 0.6, 0.6);
    // koyu kumral, düz, uzun saç
    add(new THREE.SphereGeometry(0.128, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.36), hair, 0, 0.012, -0.005, head);
    add(new THREE.SphereGeometry(0.13, 20, 14, Math.PI, Math.PI, 0, Math.PI * 0.62), hair, 0, 0.0, -0.012, head);
    const back = new THREE.CylinderGeometry(0.13, 0.15, 0.72, 20, 4, true, Math.PI * 0.5, Math.PI); back.translate(0, -0.36, 0);
    const hb = add(back, hair, 0, 0.02, -0.01, head); hb.scale.z = 0.8; hb.userData.hair = true;
    [-1, 1].forEach(sd => { const st = add(new THREE.BoxGeometry(0.035, 0.42, 0.06), hair, sd * 0.115, -0.15, 0.02, head); st.rotation.z = sd * 0.04; });
    add(new THREE.BoxGeometry(0.19, 0.035, 0.03), hair, 0, 0.088, 0.1, head).rotation.x = -0.35;
    // taç
    const tiara = add(new THREE.TorusGeometry(0.11, 0.012, 6, 24, Math.PI), gold, 0, 0.1, 0.02, head); tiara.rotation.x = -0.35;
    add(new THREE.ConeGeometry(0.02, 0.06, 4), gold, 0, 0.18, 0.06, head);
    add(new THREE.OctahedronGeometry(0.018, 0), new THREE.MeshStandardMaterial({color:0x1a2a8a, emissive:0x3050ff, emissiveIntensity:1.2, roughness:0.1}), 0, 0.15, 0.1, head);
    // kollar
    const arms = [-1, 1].map(sd => {
      const sh = new THREE.Group(); sh.position.set(sd * 0.19, 1.42, 0); g.add(sh);
      add(new THREE.SphereGeometry(0.075, 12, 10), gown, 0, -0.02, 0, sh);
      const ua = new THREE.CylinderGeometry(0.035, 0.03, 0.5, 8); ua.translate(0, -0.27, 0); add(ua, skin, 0, 0, 0, sh);
      add(new THREE.SphereGeometry(0.035, 8, 6), skin, 0, -0.54, 0, sh);
      sh.rotation.z = sd * 0.12; return sh;
    });
    return {g, head, arms, skirt};
  }
  const PR = {path:[], i:1, speed:0.75, wait:0, phase:0};
  for (let k = 0; k < 10; k++){ const a = k / 10 * Math.PI * 2; PR.path.push([P.x + Math.cos(a) * 4.5, P.z + Math.sin(a) * 4.5]); }
  C.dynamics.push(() => [{x:princess.g.position.x, z:princess.g.position.z, r:0.45}]);

  /* ================= kayıp yumurta ================= */
  const LOST = {x:POND.x - 3.5, z:POND.z + 6.2};
  const lostEgg = add(eggGeo, eggMats[4], LOST.x, 0.45, LOST.z);
  const lostGlow = new THREE.PointLight(0xb08aff, 1.5, 6, 2); lostGlow.position.set(LOST.x, 1.0, LOST.z); root.add(lostGlow);
  const carried = new THREE.Mesh(eggGeo, eggMats[4]); carried.scale.setScalar(0.8); carried.visible = false;
  nestEggs[4].visible = false;

  /* ================= etkileşimler ve işaretler ================= */
  const S = () => hooks.getS();
  const egg = () => S().notes.egg || 'kayip';
  interact.push({x:CAGE.x - R - 1.6, z:CAGE.z, r:3.2, label:'Kafes kapısı', show:() => true, act:async () => {
    if (egg() === 'tasiniyor'){
      await hooks.ui.dialog([{name:'', text:'Mor yumurtayı parmaklıkların arasından dikkatle yuvaya doğru yuvarladın. Ejderha başını eğip yumurtayı burnuyla diğerlerinin yanına itti.'}]);
      S().notes.egg = 'yuvada'; carried.visible = false; nestEggs[4].visible = true;
      dragon.roar = 3.2; dragon.happy = 6; hooks.sfx('roar'); hooks.ui.toast('Ejderha yumurtasına kavuştu!', 3500); hooks.save();
      return;
    }
    await hooks.ui.dialog([{name:'', text: egg() === 'yuvada'
      ? 'Ejderha yuvasının başında, beş yumurtasını kanatlarıyla sarıp kollamakta. Seni görünce gözleri yumuşadı.'
      : 'Altın parmaklıkların ardında zümrüt pullu bir ejderha yatıyor. Yuvasında dört yumurta var; beşinci çukur boş. Arada bir yuvaya bakıp huzursuzca homurdanıyor.'}]);
  }});
  interact.push({get x(){ return princess.g.position.x; }, get z(){ return princess.g.position.z; }, r:2.4, label:'Konuş', show:() => true, act:async () => {
    const st = S().notes;
    if (!st.princess){
      await hooks.ui.dialog([
        {name:'Prenses Aurélie', text:'Merhaba yolcu. Ben Aurélie; Kontes Éléonore\'un torunuyum. Bu bağın üzümlerini büyükannem diktirmişti.'},
        {name:'Prenses Aurélie', text:'Kafesteki ejderhanın adı Pyra. Yumurtalarından biri dün gece kayboldu. Kelebek Vadisi\'nde şelalenin yanında mor bir ışıltı gördüm…'},
        {name:'Prenses Aurélie', text:'Yumurtayı bulup kafese götürürsen Pyra sakinleşir. Ona yaklaşmaktan korkma; parmaklıklar sağlamdır.'},
      ]);
      st.princess = true; hooks.sfx('quest'); hooks.ui.toast('Yan görev: Pyra\'nın yumurtası', 2800); hooks.save(); return;
    }
    const lines = egg() === 'yuvada'
      ? ['Pyra\'nın sesini duydum! Teşekkür ederim. Yumurtalar yakında çatlayacak, o gün mutlaka gel.', 'Bağdaki en tatlı üzümler pergolanın üstünde. Bir salkım ister misin?', 'Kelebekler sabahları çiçeklerin üstünde dans eder. En güzeli mor olanlar.']
      : egg() === 'tasiniyor' ? ['Buldun mu? Çabuk, kafese götür! Pyra seni bekliyor.'] : ['Mor yumurta Kelebek Vadisi\'nde, şelalenin yanında olmalı.'];
    await hooks.ui.dialog([{name:'Prenses Aurélie', text:lines[Math.floor(rnd() * lines.length)]}]);
  }});
  markers.push(
    {id:'prenses', color:'#9db0e2', label:'Prenses Aurélie', get x(){ return princess.g.position.x; }, get z(){ return princess.g.position.z; }, show:() => !S().notes.princess && !!S().met},
    {id:'yumurta', color:'#b08aff', label:'Mor yumurta', x:LOST.x, z:LOST.z, show:() => !!S().notes.princess && egg() === 'kayip'},
    {id:'kafes', color:'#22e08a', label:'Ejderha kafesi', x:CAGE.x - R - 1.6, z:CAGE.z, show:() => egg() === 'tasiniyor'},
  );

  /* ================= güncelleme ================= */
  const up = L(0, 1, 0), tmpV = L(0, 0, 0), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler();
  let fallOff = 0;
  function update(dt, t, hero){
    const wind = world.state.wind, night = world.W.night, near = Math.hypot(hero.pos.x - V.x, hero.pos.z - V.z) < 140 && hero.zone !== 'ic';
    root.visible = hero.zone !== 'ic';
    if (!root.visible) return;
    // kafes fenerleri
    cage.children.forEach(o => { if (o.userData.lamp) o.material.color.setRGB(0.3 + night * 1.6, 0.2 + night * 1.0, 0.08 + night * 0.4); });
    // yumurta: taşıma
    const st = egg();
    lostEgg.visible = st === 'kayip'; lostGlow.intensity = st === 'kayip' ? 1.2 + Math.sin(t * 3) * 0.4 + night * 2 : 0;
    if (st === 'kayip'){ lostEgg.rotation.y += dt; lostEgg.position.y = 0.45 + Math.sin(t * 2) * 0.05;
      if (Math.hypot(hero.pos.x - LOST.x, hero.pos.z - LOST.z) < 1.5){ S().notes.egg = 'tasiniyor'; hooks.sfx('coin'); hooks.ui.toast('Mor yumurta sende! Ejderha kafesine götür.', 3000); hooks.save(); } }
    if (st === 'tasiniyor'){ if (carried.parent !== hero.obj){ hero.obj.add(carried); carried.position.set(0, 1.05, 0.32); } carried.visible = true; }
    else if (carried.parent) { carried.parent.remove(carried); }
    if (st === 'yuvada') nestEggs[4].visible = true;
    // ejderha
    const D = dragon, dr = D.root;
    const breath = Math.sin(t * 1.4);
    D.body.scale.set(1 + breath * 0.025, 1 + breath * 0.035, 1);
    // binildiğinde (dragonride.js) kafes animasyonu yerine uçuş animasyonu çalışır
    if (!D.riding){
      const wpos = dr.getWorldPosition(tmpV), dx = hero.pos.x - wpos.x, dz = hero.pos.z - wpos.z, dist = Math.hypot(dx, dz);
      const worldYaw = dr.rotation.y + cage.rotation.y;
      let look = 0; if (dist < 32){ look = Math.atan2(dx, dz) - worldYaw; look = Math.atan2(Math.sin(look), Math.cos(look)); look = Math.max(-1.1, Math.min(1.1, look)); }
      D.neck.forEach((n, i) => { n.rotation.y += ((look / D.neck.length) + Math.sin(t * 0.6 + i * 0.4) * 0.03 - n.rotation.y) * Math.min(1, dt * 2); n.rotation.x = (n.userData.bx ?? 0) + Math.sin(t * 0.8 + i * 0.5) * 0.03 - (D.roar > 0 ? 0.1 : 0); });
      D.tail.forEach((n, i) => { n.rotation.y = Math.sin(t * (D.happy > 0 ? 3 : 1.1) - i * 0.5) * (0.12 + (D.happy > 0 ? 0.08 : 0)); n.rotation.x = 0.05; });
      const flap = D.happy > 0 ? Math.sin(t * 6) * 0.5 - 0.2 : D.roar > 0 ? -0.35 : Math.sin(t * 0.5) * 0.06;
      D.wings.forEach(({w, sd}) => { w.rotation.z = sd * (0.5 + flap); w.rotation.y = -sd * 0.95; });
      D.happy = Math.max(0, (D.happy || 0) - dt);
      D.nextRoar -= dt; if (D.nextRoar <= 0 && dist < 60){ D.roar = 2.4; D.nextRoar = 25 + rnd() * 25; if (dist < 45) hooks.sfx('roar'); }
    }
    D.jaw.rotation.x = D.roar > 0 ? Math.min(0.55, D.jaw.rotation.x + dt * 3) : Math.max(0, D.jaw.rotation.x - dt * 2);
    // ateş
    const mouth = D.head.localToWorld(L(0, -0.05, 1.5)), dir = D.head.localToWorld(L(0, 0.5, 4.0)).sub(mouth).normalize();
    const breathing = D.roar > 0.3;
    D.roar = Math.max(0, D.roar - dt);
    D.fireLight.position.copy(mouth); D.fireLight.intensity = breathing ? 30 + Math.sin(t * 30) * 8 : Math.max(0, D.fireLight.intensity - dt * 60);
    for (let i = 0; i < D.FIRE; i++){
      D.fLife[i] -= dt;
      if (D.fLife[i] <= 0){
        if (breathing){ D.fPos.set([mouth.x, mouth.y, mouth.z], i * 3); const sp = 7 + rnd() * 5; D.fVel.set([dir.x * sp + (rnd() - 0.5) * 1.5, dir.y * sp + (rnd() - 0.5) * 1.5, dir.z * sp + (rnd() - 0.5) * 1.5], i * 3); D.fLife[i] = 0.5 + rnd() * 0.5; }
        else { D.fPos[i * 3 + 1] = -999; continue; }
      }
      D.fPos[i * 3] += D.fVel[i * 3] * dt; D.fPos[i * 3 + 1] += D.fVel[i * 3 + 1] * dt + dt * 1.5; D.fPos[i * 3 + 2] += D.fVel[i * 3 + 2] * dt;
      D.fVel[i * 3] *= 0.96; D.fVel[i * 3 + 1] *= 0.96; D.fVel[i * 3 + 2] *= 0.96;
    }
    D.fGeo.attributes.position.needsUpdate = true;
    if (!near) return;
    // şelale ve sıçrayan su
    fallMat.map.offset.y -= dt * 1.2;
    for (let i = 0; i < SPL; i++){ spVel[i * 3 + 1] -= 9.8 * dt; spPos[i * 3] += spVel[i * 3] * dt; spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt; spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt; if (spPos[i * 3 + 1] < 0.1) resetSplash(i); }
    spGeo.attributes.position.needsUpdate = true;
    // kelebekler (gece saklanırlar)
    const active = night > 0.6 || world.W.rain > 0.5 ? 0 : NBF;
    bfR.count = bfL.count = active;
    for (let i = 0; i < active; i++){
      const b = bfs[i], a = t * b.w + b.p;
      const x = b.cx + Math.cos(a) * b.r + Math.sin(t * 0.7 + b.p) * 0.6, z = b.cz + Math.sin(a * 0.8) * b.r, y = b.h + Math.sin(t * 2.3 + b.p) * 0.35;
      const yaw = Math.atan2(-Math.sin(a) * b.r * b.w, Math.cos(a * 0.8) * 0.8 * b.r * b.w);
      const fl = Math.sin(t * b.f + b.p) * 1.05;
      tmpE.set(0, yaw, fl, 'YXZ'); tmpQ.setFromEuler(tmpE); m4.compose(L(x, y, z), tmpQ, L(1, 1, 1)); bfR.setMatrixAt(i, m4);
      tmpE.set(0, yaw, -fl, 'YXZ'); tmpQ.setFromEuler(tmpE); m4.compose(L(x, y, z), tmpQ, L(1, 1, 1)); bfL.setMatrixAt(i, m4);
    }
    bfR.instanceMatrix.needsUpdate = bfL.instanceMatrix.needsUpdate = true;
    // prenses
    const ph = Math.hypot(hero.pos.x - princess.g.position.x, hero.pos.z - princess.g.position.z);
    let moving = 0;
    if (ph < 3){ world.turnToward(princess.g, Math.atan2(hero.pos.x - princess.g.position.x, hero.pos.z - princess.g.position.z), Math.min(1, dt * 3)); }
    else if (PR.wait > 0) PR.wait -= dt;
    else {
      const [tx, tz] = PR.path[PR.i], ddx = tx - princess.g.position.x, ddz = tz - princess.g.position.z, d = Math.hypot(ddx, ddz);
      if (d < 0.15){ PR.i = (PR.i + 1) % PR.path.length; if (PR.i % 3 === 0) PR.wait = 2.5; }
      else { const s = Math.min(d, PR.speed * dt); princess.g.position.x += ddx / d * s; princess.g.position.z += ddz / d * s; world.turnToward(princess.g, Math.atan2(ddx, ddz), Math.min(1, dt * 5)); moving = 1; }
    }
    PR.phase += dt * 6 * moving;
    princess.skirt.rotation.z = Math.sin(PR.phase) * 0.03 * moving + Math.sin(t * 1.3) * 0.01 * wind;
    princess.g.position.y = Math.abs(Math.sin(PR.phase)) * 0.015;
    princess.arms.forEach((a, k) => { a.rotation.x = Math.sin(PR.phase + k * Math.PI) * 0.25 * moving; });
    princess.head.children.forEach(c => { if (c.userData.hair) c.rotation.x = 0.06 * moving + Math.sin(t * 2) * 0.03 * (0.3 + wind); });
  }

  // Bu modülün renkleri sRGB yazıldı; motorun doğrusal renk düzenine çevir (dünyadan paylaşılan malzemelere dokunma).
  const shared = new Set(Object.values(M)), done = new Set();
  const fix = m => { if (!m || shared.has(m) || done.has(m) || m.isMeshBasicMaterial || m.isPointsMaterial) return; done.add(m); if (m.color) m.color.convertSRGBToLinear(); };
  root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(fix); });
  fix(carried.material);
  return {root, interact, markers, update, dragon, princess};
}
