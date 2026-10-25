// Doğa: Zhú Hǎi bambu denizi, ağaçlar, Lóngjǐ çeltik terasları ve Zhangjiajie taş sütunları (sis, asma köprü, Taocu tapınak).
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TAG } from './grid.js';
import { P } from './palette.js';

export function makeNature(ctx, A, grid){
  const { THREE, kit, C, root, rnd, world } = ctx;
  const { add, mat, canvas, ctex } = kit;
  const { M, box, lathe } = A;
  const heightFns = C.heightFns;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), col = new THREE.Color();
  const anims = [];
  const windy = (m, k) => (world && world.windMat ? world.windMat(m, k, true) : m);

  /* ================= bambu denizi (竹海) ================= */
  // Binlerce kamış iki InstancedMesh'te: gövde (boğumlu doku) ve rüzgârda salınan yaprak kümeleri.
  function bambooSea({x, z, r, path = [], clear = [], n = 1500}){
    const nodeTex = (() => { const [c, g] = canvas(16, 256); g.fillStyle = '#d8e0b0'; g.fillRect(0, 0, 16, 256); for (let y = 0; y < 256; y += 32){ g.fillStyle = 'rgba(60,70,30,.55)'; g.fillRect(0, y, 16, 3); g.fillStyle = 'rgba(255,255,230,.35)'; g.fillRect(0, y + 3, 16, 2); } g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(3, 0, 3, 256); return ctex(c, 1, 6); })();
    const leafTex = (() => {
      const [c, g] = canvas(128, 128);
      for (let i = 0; i < 46; i++){
        const px = 10 + rnd() * 108, py = 10 + rnd() * 108, a = rnd() * Math.PI * 2, L = 14 + rnd() * 12;
        g.save(); g.translate(px, py); g.rotate(a); g.fillStyle = `hsl(${92 + rnd() * 20},${45 + rnd() * 20}%,${28 + rnd() * 14}%)`;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -3.2, L, 0); g.quadraticCurveTo(L * 0.5, 3.2, 0, 0); g.fill(); g.restore();
      }
      const t = ctex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
    })();
    const culmG = new THREE.CylinderGeometry(0.06, 0.08, 1, 6, 1, true); culmG.translate(0, 0.5, 0);
    const leafG = mergeBufferGeometries([0, 1, 2].map(i => { const g = new THREE.PlaneGeometry(2.6, 3.2); g.rotateY(i * Math.PI / 3); g.translate(0, 1.5, 0); return g; }));
    const culms = new THREE.InstancedMesh(culmG, mat(0xffffff, {map:nodeTex, roughness:0.55}), n);
    const leafMat = windy(new THREE.MeshStandardMaterial({map:leafTex, alphaTest:0.45, side:THREE.DoubleSide, roughness:0.8}), 0.5);
    const leaves = new THREE.InstancedMesh(leafG, leafMat, n * 2);
    const nearPath = (px, pz, m) => path.some((a, i) => { const b = path[i + 1]; if (!b) return false; const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2)); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t) < m; });
    let k = 0, kl = 0;
    for (let tries = 0; tries < n * 6 && k < n; tries++){
      const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * r, px = x + Math.sin(a) * rr, pz = z + Math.cos(a) * rr;
      if (grid.get(px, pz) !== TAG.FREE && grid.get(px, pz) !== TAG.NATURE) continue;
      if (nearPath(px, pz, 2.4) || clear.some(c => Math.hypot(px - c.x, pz - c.z) < c.r)) continue;
      const h = 7 + rnd() * 7 * (1 - rr / r * 0.4), th = 0.8 + rnd() * 0.6, lean = (rnd() - 0.5) * 0.08;
      m4.compose(p3.set(px, 0, pz), q.setFromEuler(e.set(lean, rnd() * 6.3, -lean)), s3.set(th, h, th)); culms.setMatrixAt(k, m4);
      culms.setColorAt(k, col.set(rnd() < 0.2 ? P.bambooOld : P.bamboo).offsetHSL(0, 0, (rnd() - 0.5) * 0.08).convertSRGBToLinear());
      for (let j = 0; j < 2; j++){
        const ls = 0.8 + rnd() * 0.5; m4.compose(p3.set(px + lean * h * 0.5, h * (0.62 + j * 0.24), pz), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s3.set(ls, ls, ls)); leaves.setMatrixAt(kl, m4);
        leaves.setColorAt(kl, col.set(P.bambooLeaf).offsetHSL((rnd() - 0.5) * 0.03, 0, (rnd() - 0.5) * 0.1).convertSRGBToLinear()); kl++;
      }
      grid.paint(px - 1, pz - 1, px + 1, pz + 1, TAG.NATURE);
      C.circle(px, pz, 0.12 * th);
      k++;
    }
    culms.count = k; leaves.count = kl; culms.castShadow = leaves.castShadow = true; culms.receiveShadow = leaves.receiveShadow = true;
    root.add(culms, leaves);
    // patika: sıkıştırılmış toprak
    const dirt = mat(0x8a7454, {roughness:1});
    path.forEach((a, i) => { const b = path[i + 1]; if (!b) return; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); kit.plane(2.6, l + 1, dirt, (a[0] + b[0]) / 2, 0.015, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1])); });
    return {count:k, inside:(px, pz) => Math.hypot(px - x, pz - z) < r};
  }

  /* ================= ağaçlar ================= */
  // [x, z, tür, y]: hurma (jujube), nar, sogut (söğüt), cam (çam), erik (erik çiçeği). Her tür tek InstancedMesh.
  function trees(list){
    const kinds = {
      hurma:{crown:(() => { const g = new THREE.IcosahedronGeometry(1.7, 1); g.scale(1, 0.8, 1); return g; })(), h:2.6, color:() => col.setHSL(0.24 + rnd() * 0.04, 0.45, 0.28 + rnd() * 0.06)},
      nar:{crown:new THREE.IcosahedronGeometry(1.4, 1), h:2.0, color:() => col.setHSL(0.28, 0.5, 0.26 + rnd() * 0.05)},
      erik:{crown:mergeBufferGeometries([[0, 0, 0, 1.6], [0.9, -0.2, 0.3, 1.1], [-0.8, -0.1, -0.3, 1.2]].map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).translate(x, y, z))), h:2.2, color:() => col.set(rnd() < 0.5 ? 0xf2a6c0 : 0xf6e0ea)},
      cam:{crown:mergeBufferGeometries([[0, 0, 0, 2.6], [0.6, 1.3, 0.3, 2.0], [-0.4, 2.4, -0.2, 1.4]].map(([x, y, z, r]) => { const g = new THREE.SphereGeometry(r, 9, 6); g.scale(1, 0.32, 1); g.translate(x, y, z); return g.toNonIndexed(); })), h:4.5, color:() => col.setHSL(0.3 + rnd() * 0.05, 0.4, 0.18 + rnd() * 0.06)},
      sogut:{crown:(() => { const parts = []; for (let i = 0; i < 26; i++){ const a = i / 26 * Math.PI * 2 + (i % 2) * 0.1, rr = 1.2 + (i % 3) * 0.45, l = 2.6 + (i % 4) * 0.5, g = new THREE.CylinderGeometry(0.3, 0.06, l, 3, 1, true); g.translate(Math.sin(a) * rr, -l / 2 + 0.2, Math.cos(a) * rr); parts.push(g.toNonIndexed()); } const top = new THREE.SphereGeometry(2.3, 10, 6); top.scale(1, 0.45, 1); parts.push(top.toNonIndexed()); return mergeBufferGeometries(parts); })(), h:4.8, color:() => col.setHSL(0.22, 0.45, 0.36 + rnd() * 0.05)},
    };
    const trunkG = new THREE.CylinderGeometry(0.14, 0.26, 1, 7); trunkG.translate(0, 0.5, 0);
    const trunks = new THREE.InstancedMesh(trunkG, mat(0x4a3424, {roughness:0.9}), Math.max(1, list.length));
    let nt = 0;
    Object.entries(kinds).forEach(([key, K]) => {
      const mine = list.filter(t => t[2] === key); if (!mine.length) return;
      const im = new THREE.InstancedMesh(K.crown, windy(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85, side:key === 'sogut' ? THREE.DoubleSide : THREE.FrontSide}), key === 'sogut' ? 1.0 : 0.7), mine.length);
      mine.forEach(([x, z, , y = 0], i) => {
        const h = K.h * (0.8 + rnd() * 0.45), k2 = 0.8 + rnd() * 0.45;
        m4.compose(p3.set(x, y - 0.1, z), q.setFromEuler(e.set((rnd() - 0.5) * 0.15, rnd() * 6.3, (rnd() - 0.5) * 0.15)), s3.set(1, h, 1)); trunks.setMatrixAt(nt++, m4);
        m4.compose(p3.set(x, y + h + (key === 'sogut' ? 0.6 : 0.8), z), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s3.set(k2, k2, k2)); im.setMatrixAt(i, m4);
        im.setColorAt(i, K.color().convertSRGBToLinear());
        const o = C.circle(x, z, 0.4); if (y > 0.5){ o.y0 = y - 0.5; o.y1 = y + 10; }
      });
      im.castShadow = im.receiveShadow = true; root.add(im);
    });
    trunks.count = nt; trunks.castShadow = true; root.add(trunks);
  }

  /* ================= çeltik terasları (龙脊梯田) ================= */
  // Yükseklik eş eğrileri: R_k(θ) = R·(1 − k/N)·(1 + dalgalanma). Bir noktanın yüksekliği, içinde kaldığı eğri sayısı × basamak.
  // Basamak 0.5 m: oyuncu 0.6 m'ye kadar çıkabildiği için her terasa yürüyerek çıkılır.
  function riceTerraces({x, z, R = 64, N = 13, step = 0.5}){
    const Rk = (k, a) => { const f = 1 - k / (N + 1.2); return R * f * (1 + 0.075 * Math.sin(3 * a + k * 0.15 + 0.7) + 0.045 * Math.sin(5 * a + 1.3 + k * 0.25) + 0.02 * Math.sin(11 * a + k)); };
    const hAt = (px, pz) => { const dx = px - x, dz = pz - z, r = Math.hypot(dx, dz); if (r >= R * 1.15) return 0; const a = Math.atan2(dx, dz); let n = 0; for (let k = 0; k <= N; k++){ if (r < Rk(k, a)) n++; else break; } return n * step; };
    heightFns.push((px, pz) => { const h = hAt(px, pz); return h > 0 ? h : null; });
    const S = 120;
    const paddyTex = (() => { const [c, g] = canvas(128, 128); g.fillStyle = '#6f9a3a'; g.fillRect(0, 0, 128, 128); for (let y = 2; y < 128; y += 6) for (let xx = 2; xx < 128; xx += 6){ g.fillStyle = `hsl(${85 + rnd() * 20},55%,${36 + rnd() * 16}%)`; g.fillRect(xx, y, 3, 3); } return ctex(c); })();
    const wet = new THREE.MeshStandardMaterial({color:0x8ab0b4, roughness:0.06, metalness:0.3});
    const green = mat(0xffffff, {map:paddyTex, roughness:0.85}), mud = mat(0x7a6244, {roughness:1}), bund = mat(0x5f7a34, {roughness:0.95});
    for (let k = 0; k <= N; k++){
      const y = (k + 1) * step, pos = [], uv = [], idx = [], rpos = [], ruv = [], ridx = [];
      for (let i = 0; i <= S; i++){
        const a = i / S * Math.PI * 2, ro = Rk(k, a), ri = k < N ? Rk(k + 1, a) : 0, sx = Math.sin(a), cz = Math.cos(a);
        pos.push(sx * ro, y, cz * ro, sx * ri, y, cz * ri); uv.push(sx * ro / 4, cz * ro / 4, sx * ri / 4, cz * ri / 4);
        rpos.push(sx * ro, y, cz * ro, sx * ro, y - step - 0.05, cz * ro); ruv.push(i / S * ro * 6.28 / 2, 0, i / S * ro * 6.28 / 2, step / 2);
        if (i < S){ const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); ridx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
      }
      const mk = (P0, U, I) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P0, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g; };
      add(mk(pos, uv, idx), k % 3 === 0 && k < N ? wet : green, x, 0, z, root, false).receiveShadow = true;
      add(mk(rpos, ruv, ridx), mud, x, 0, z);
      // set (bund): her terasın dış kenarında ince çimenli sırt
      const pts = []; for (let i = 0; i <= 48; i++){ const a = i / 48 * Math.PI * 2, ro = Rk(k, a) - 0.15; pts.push(new THREE.Vector3(x + Math.sin(a) * ro, y + 0.03, z + Math.cos(a) * ro)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 96, 0.12, 4, true), bund, 0, 0, 0, root, false);
    }
    return {top:{x, z, y:(N + 1) * step}, hAt};
  }

  /* ================= Zhangjiajie taş sütunları ================= */
  const rockTex = (() => {
    const [c, g] = canvas(128, 256); g.fillStyle = '#8f8676'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++){ const xx = rnd() * 128, w = 1 + rnd() * 5, v = 100 + rnd() * 90; g.fillStyle = `rgba(${v + 20 | 0},${v | 0},${v * 0.82 | 0},.55)`; g.fillRect(xx, 0, w, 256); }
    // kumtaşının dikey çatlakları ve aşağı akan koyu izler; yatay çizgi yok (tekrar eden ızgara görünmesin)
    for (let i = 0; i < 26; i++){ const xx = rnd() * 128, y0 = rnd() * 256, l = 40 + rnd() * 160, gr = g.createLinearGradient(0, y0, 0, y0 + l); gr.addColorStop(0, 'rgba(50,44,36,.45)'); gr.addColorStop(1, 'rgba(50,44,36,0)'); g.fillStyle = gr; g.fillRect(xx, y0, 1 + rnd() * 2, l); }
    for (let i = 0; i < 24; i++){ g.fillStyle = `rgba(70,${95 + rnd() * 40 | 0},45,.35)`; g.beginPath(); g.ellipse(rnd() * 128, rnd() * 256, 2 + rnd() * 4, 4 + rnd() * 10, 0, 0, Math.PI * 2); g.fill(); }
    return ctex(c);
  })();
  const rockMat = mat(0xffffff, {map:rockTex, roughness:0.95});
  const mossMat = mat(0x3f5f2a, {roughness:1});
  function pillarGeo(r, h, seed, amp = 1){
    const g = new THREE.CylinderGeometry(r * 0.92, r * 1.15, h, 18, 14, false), p = g.attributes.position;
    for (let i = 0; i < p.count; i++){
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), t = y / h + 0.5;
      const f = 1 + amp * (0.1 * Math.sin(a * 5 + seed) + 0.06 * Math.sin(a * 11 + seed * 2) + 0.08 * Math.sin(t * 7 + a * 2 + seed) * Math.sin(a * 3 + seed));
      p.setX(i, x * f); p.setZ(i, z * f); p.setY(i, y + h / 2);
    }
    g.computeVertexNormals(); A.scaleUV(g, Math.max(2, Math.round(r * 0.3)), h / 34);
    return g;
  }
  const pines = [];
  /** Tek sütun: taş gövde, yosunlu tepe, tepede birkaç çam. Basılabilir tepe yüzeyi döndürür. */
  function pillar(x, z, r, h, {walk = false, amp = 1, inSea = false} = {}){
    const seed = rnd() * 10, rMax = r * 1.15 * (1 + 0.24 * amp);
    add(pillarGeo(r, h, seed, amp), rockMat, x, inSea ? -6 : 0, z);
    // yosunlu tepe: basılan yüzeyle (h + 0.15) aynı hizada ince bir disk, kenarında sarkan çalılar
    add(new THREE.CylinderGeometry(r * 0.9, r * 0.95, 0.4, 18), mossMat, x, (inSea ? -6 : 0) + h - 0.05, z);
    for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2 + rnd(), b = add(new THREE.IcosahedronGeometry(0.9 + rnd() * 0.8, 0), mossMat, x + Math.sin(a) * r * 0.86, (inSea ? -6 : 0) + h - 0.2, z + Math.cos(a) * r * 0.86); b.scale.y = 0.6; }
    const np = Math.round(r * 0.5 + rnd() * 2);
    for (let i = 0; i < np; i++){ const a = rnd() * 6.3, rr = r * (0.3 + rnd() * 0.5); pines.push([x + Math.sin(a) * rr, (inSea ? -6 : 0) + h + 0.2, z + Math.cos(a) * rr, 0.5 + rnd() * 0.4]); }
    if (!inSea){ const o = C.circle(x, z, walk ? rMax : r * 1.3); if (walk){ o.y1 = h - 0.6; o.y0 = -1; } }
    if (walk) heightFns.push((px, pz) => Math.hypot(px - x, pz - z) < r * 0.88 ? h + 0.15 : null);
    return {x, z, r, h, rMax};
  }
  /** Sütunun çevresinde yükselen ahşap merdiven (栈道): sarmal yükseklik fonksiyonu, dış korkuluk yükseklik aralıklı. */
  function spiralStair(P0, {a0 = 0, turns = 1.3, w = 2.0}){
    const rIn = P0.rMax + 0.3, rOut = rIn + w, span = turns * Math.PI * 2, H = P0.h + 0.15;
    const at = u => { const a = a0 + u * span, rr = (rIn + rOut) / 2; return [P0.x + Math.sin(a) * rr, H * u, P0.z + Math.cos(a) * rr, a]; };
    const steps = Math.ceil(span * (rIn + w / 2) / 0.55);
    for (let i = 0; i < steps; i++){
      const u = (i + 0.5) / steps, [px, py, pz, a] = at(u);
      const b = add(box(w + 0.3, 0.12, 0.6), M.wood, px, py - 0.06, pz); b.rotation.y = a + Math.PI / 2;
      if (i % 4 === 0){
        const ox = P0.x + Math.sin(a) * (rOut - 0.08), oz = P0.z + Math.cos(a) * (rOut - 0.08);
        add(box(0.1, 1.1, 0.1), M.woodDark, ox, py + 0.5, oz);
        const o = C.circle(ox, oz, 0.35); o.y0 = py - 0.4; o.y1 = py + 2.2; o.low = true;
        const bracket = add(box(0.1, 0.1, w + 0.4), M.woodDark, (ox + px) / 2, py - 0.3, (oz + pz) / 2); bracket.rotation.y = a;
      }
      if (i % 2 === 1 && i < steps - 3){ const ox = P0.x + Math.sin(a) * (rOut + 0.05), oz = P0.z + Math.cos(a) * (rOut + 0.05); const o = C.circle(ox, oz, 0.3); o.y0 = py - 0.4; o.y1 = py + 2.2; o.low = true; }
    }
    const railPts = []; for (let i = 0; i <= 80; i++){ const u = i / 80, a = a0 + u * span; railPts.push(new THREE.Vector3(P0.x + Math.sin(a) * (rOut - 0.08), H * u + 1.05, P0.z + Math.cos(a) * (rOut - 0.08))); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 160, 0.05, 4), M.vermilion, 0, 0, 0, root, false);
    heightFns.push((px, pz) => {
      const dx = px - P0.x, dz = pz - P0.z, rr = Math.hypot(dx, dz); if (rr < rIn - 0.6 || rr > rOut + 0.2) return null;
      let a = Math.atan2(dx, dz) - a0; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const out = []; for (let k = 0; k < 3; k++){ const u = (a + k * Math.PI * 2) / span; if (u <= 1) out.push(H * u); }
      // tepe sahanlığı: merdivenin bittiği açıda sütun yüzeyine bağlanır
      if (Math.abs(Math.atan2(Math.sin(a - span), Math.cos(a - span))) < 0.3) out.push(H);
      return out.length ? out : null;
    });
    // sahanlık: merdivenin sonundan tepeye geçiş
    { const ae = a0 + span, rm = (P0.r * 0.8 + rIn + w) / 2, len = rIn + w - P0.r * 0.8; const d = add(box(2.6, 0.18, len), M.wood, P0.x + Math.sin(ae) * rm, H - 0.09, P0.z + Math.cos(ae) * rm); d.rotation.y = ae; }
    heightFns.push((px, pz) => {
      const dx = px - P0.x, dz = pz - P0.z, rr = Math.hypot(dx, dz); if (rr > rIn + 0.5 || rr < P0.r * 0.8) return null;
      const a = Math.atan2(dx, dz) - (a0 + span); return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.25 ? H : null;
    });
    return {start:at(0), H};
  }
  /** İki sütun tepesi arasında sarkan tahta asma köprü. */
  function ropeBridge(a, b, {w = 1.6, sag = 2.2} = {}){
    const dx = b.x - a.x, dz = b.z - a.z, D = Math.hypot(dx, dz), ux = dx / D, uz = dz / D;
    const s0 = a.r * 0.8, s1 = D - b.r * 0.8, L = s1 - s0, ry = Math.atan2(ux, uz);
    const hy = t => a.h + 0.15 + (b.h - a.h) * t - sag * 4 * t * (1 - t);
    const n = Math.ceil(L / 0.32);
    for (let i = 0; i < n; i++){
      const t = (i + 0.5) / n, sx = a.x + ux * (s0 + t * L), sz = a.z + uz * (s0 + t * L);
      const pl = add(box(w, 0.07, 0.24), M.wood, sx, hy(t) - 0.04, sz); pl.rotation.y = ry;
    }
    [-1, 1].forEach(sd => {
      const pts = []; for (let i = 0; i <= 20; i++){ const t = i / 20; pts.push(new THREE.Vector3(a.x + ux * (s0 + t * L) + uz * sd * w / 2, hy(t) + 1.0, a.z + uz * (s0 + t * L) - ux * sd * w / 2)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.04, 4), M.rope, 0, 0, 0, root, false);
      for (let i = 0; i <= 20; i += 2){ const t = i / 20, px = a.x + ux * (s0 + t * L) + uz * sd * w / 2, pz = a.z + uz * (s0 + t * L) - ux * sd * w / 2; const o = C.circle(px, pz, 0.32); o.y0 = hy(t) - 0.5; o.y1 = hy(t) + 2.2; o.low = true; }
    });
    // köprünün başındaki iki kırmızı direk ve fener
    [[a, 0], [b, 1]].forEach(([Pp, t]) => [-1, 1].forEach(sd => {
      const px = a.x + ux * (s0 + t * L) + uz * sd * (w / 2 + 0.2), pz = a.z + uz * (s0 + t * L) - ux * sd * (w / 2 + 0.2);
      add(box(0.2, 1.8, 0.2), M.vermilion, px, Pp.h + 0.9, pz); A.lantern(px, Pp.h + 1.6, pz, 0.5, null);
    }));
    heightFns.push((px, pz) => {
      const rx = px - a.x, rz = pz - a.z, along = rx * ux + rz * uz, side = rx * uz - rz * ux;
      if (Math.abs(side) > w / 2 + 0.1 || along < s0 - 0.4 || along > s1 + 0.4) return null;
      return hy(Math.max(0, Math.min(1, (along - s0) / L)));
    });
  }
  /** Sis: sütunların arasında süzülen yumuşak bulut perdeleri ve alçak "bulut denizi" katmanları. */
  function mist({x, z, r, layers = [11, 19], puffs = 36}){
    const [c, g] = canvas(256, 256);
    const id = g.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++){
      const u = i / 256 * Math.PI * 2, v = j / 256 * Math.PI * 2;
      const n = 0.5 + 0.25 * Math.sin(u * 3 + Math.sin(v * 2) * 1.5) + 0.15 * Math.sin(v * 5 + u * 2) + 0.1 * Math.sin(u * 9 - v * 7);
      const k = (j * 256 + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = Math.max(0, Math.min(255, (n - 0.35) * 380));
    }
    g.putImageData(id, 0, 0);
    const noise = new THREE.CanvasTexture(c); noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
    const [rc, rg] = canvas(128, 128), gr = rg.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.6, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); rg.fillStyle = gr; rg.fillRect(0, 0, 128, 128);
    const soft = new THREE.CanvasTexture(rc);
    // bulut denizi: gürültü dokusu kayar (map dönüşümü), kenar yumuşaklığı köşe alfasında (doku dönüşümünden bağımsız)
    const sheetG = new THREE.RingGeometry(0.5, r, 48, 8); sheetG.rotateX(-Math.PI / 2);
    const sp = sheetG.attributes.position, ca = new Float32Array(sp.count * 4);
    for (let i = 0; i < sp.count; i++){ const rr = Math.hypot(sp.getX(i), sp.getZ(i)) / r; ca.set([1, 1, 1, Math.max(0, 1 - rr * rr)], i * 4); }
    sheetG.setAttribute('color', new THREE.BufferAttribute(ca, 4)); A.scaleUV(sheetG, 3);
    const sheetMats = layers.map(() => { const m = new THREE.MeshBasicMaterial({color:0xf2f4f6, map:noise.clone(), vertexColors:true, transparent:true, opacity:0.4, depthWrite:false, side:THREE.DoubleSide}); m.map.needsUpdate = true; return m; });
    layers.forEach((y, i) => { const d = new THREE.Mesh(sheetG, sheetMats[i]); d.position.set(x, y, z); d.renderOrder = 3; root.add(d); });
    const puffG = mergeBufferGeometries([0, 1].map(i => { const pg = new THREE.PlaneGeometry(1, 1); pg.rotateY(i * Math.PI / 2); return pg; }));
    const puffMat = new THREE.MeshBasicMaterial({color:0xf4f6f8, map:soft, transparent:true, opacity:0.32, depthWrite:false, side:THREE.DoubleSide});
    const im = new THREE.InstancedMesh(puffG, puffMat, puffs); im.frustumCulled = false; im.renderOrder = 3; root.add(im);
    const P0 = Array.from({length:puffs}, () => ({a:rnd() * 6.3, rr:r * (0.15 + rnd() * 0.8), y:5 + rnd() * 24, sx:16 + rnd() * 18, sy:5 + rnd() * 5, w:(rnd() - 0.5) * 0.02, ph:rnd() * 6}));
    anims.push((dt, t) => {
      const W = ctx.W, dense = 0.75 + W.rain * 0.5 + (W.clouds || 0) * 0.3 - W.night * 0.25;
      sheetMats.forEach((m, i) => { m.map.offset.set(t * 0.004 * (i + 1), t * 0.0025); m.opacity = 0.34 * dense; });
      puffMat.opacity = 0.3 * dense;
      P0.forEach((pf, i) => {
        pf.a += pf.w * dt;
        m4.compose(p3.set(x + Math.sin(pf.a) * pf.rr, pf.y + Math.sin(t * 0.2 + pf.ph) * 1.2, z + Math.cos(pf.a) * pf.rr), q.setFromAxisAngle(s3.set(0, 1, 0), pf.a + t * 0.01), s3.set(pf.sx, pf.sy, pf.sx));
        im.setMatrixAt(i, m4);
      });
      im.instanceMatrix.needsUpdate = true;
    });
  }
  function finishPines(){
    if (!pines.length) return;
    const crown = mergeBufferGeometries([[0, 0, 0, 2.2], [0.5, 1.0, 0.3, 1.6], [-0.4, 1.9, -0.2, 1.1]].map(([px, py, pz, r]) => { const g = new THREE.SphereGeometry(r, 8, 5); g.scale(1, 0.3, 1); g.translate(px, py, pz); return g.toNonIndexed(); }));
    const trunk = new THREE.CylinderGeometry(0.1, 0.2, 2.6, 6); trunk.translate(0, 1.3, 0);
    const T = new THREE.InstancedMesh(trunk, mat(0x3a2a1c, {roughness:0.9}), pines.length), K = new THREE.InstancedMesh(crown, windy(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85}), 0.6), pines.length);
    pines.forEach(([px, py, pz, k], i) => {
      m4.compose(p3.set(px, py, pz), q.setFromEuler(e.set((rnd() - 0.5) * 0.3, rnd() * 6.3, (rnd() - 0.5) * 0.3)), s3.set(k, k, k)); T.setMatrixAt(i, m4);
      m4.compose(p3.set(px, py + 2.6 * k, pz), q.setFromEuler(e.set(0, rnd() * 6.3, 0)), s3.set(k, k, k)); K.setMatrixAt(i, m4);
      K.setColorAt(i, col.setHSL(0.31 + rnd() * 0.04, 0.4, 0.16 + rnd() * 0.06).convertSRGBToLinear());
    });
    T.castShadow = K.castShadow = true; root.add(T, K);
  }

  return {bambooSea, trees, riceTerraces, pillar, spiralStair, ropeBridge, mist, finishPines, update:(dt, t) => anims.forEach(f => f(dt, t))};
}
