// Yùlóng'un ejderhası: kanatsız, yılan gövdeli Çin ejderhası (lóng). ~46 m uzunluğunda altın pullu gövde,
// krem karın plakaları, sırtta kırmızı yüzgeçler ve alev yeleler, beş tırnaklı dört bacak, geyik boynuzları,
// uzun bıyıklar, açık ağız; önünde süzülen parlak inciyi kovalar. Gövde her karede bir uçuş yolunun üstüne
// yeniden dizilir (tek bir deforme olan tüp), dalgalanarak adanın üstünde süzülür.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function buildLongDragon(world, {cx, cz, sfx = () => {}}){
  const { THREE } = world;
  const lin = h => new THREE.Color(h).convertSRGBToLinear();
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group(); root.name = 'Ejderha:lóng';
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (c, rx = 1, ry = 1, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; return t; };
  let seed = 515; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const N = 150, M = 20, LEN = 46;                 // gövde halkaları, halka başına köşe, boy (m)
  const rad = u => u < 0.07 ? 0.62 + 0.42 * (u / 0.07) : u < 0.36 ? 1.04 + 0.1 * Math.sin((u - 0.07) / 0.29 * Math.PI) : 0.09 + 0.95 * Math.pow(1 - (u - 0.36) / 0.64, 1.25);

  /* ---------- dokular: pullar, karın plakaları ---------- */
  const scaleTex = (() => {
    const [c, g] = canvas(256, 256), [b, bg] = canvas(256, 256);
    g.fillStyle = '#c8901a'; g.fillRect(0, 0, 256, 256); bg.fillStyle = '#808080'; bg.fillRect(0, 0, 256, 256);
    // v (dikey) gövdenin çevresi: 0 sırt, 0.5 karın. Pullar sırt ve yanlarda, karında plakalar
    for (let row = -1; row < 18; row++) for (let col = -1; col < 9; col++){
      const x = col * 32 + (row % 2) * 16, y = row * 15;
      const gr = g.createRadialGradient(x + 16, y + 4, 2, x + 16, y + 10, 20); gr.addColorStop(0, '#ffe27a'); gr.addColorStop(0.6, '#e0a82a'); gr.addColorStop(1, '#8a5a10');
      g.fillStyle = gr; g.beginPath(); g.arc(x + 16, y, 17, 0, Math.PI); g.fill();
      g.strokeStyle = '#6a3e08'; g.lineWidth = 2; g.beginPath(); g.arc(x + 16, y, 17, 0, Math.PI); g.stroke();
      const br = bg.createRadialGradient(x + 16, y + 2, 1, x + 16, y + 6, 18); br.addColorStop(0, '#ffffff'); br.addColorStop(1, '#202020');
      bg.fillStyle = br; bg.beginPath(); bg.arc(x + 16, y, 17, 0, Math.PI); bg.fill();
    }
    const y0 = 256 * 0.34, y1 = 256 * 0.66;
    g.fillStyle = '#f2dc9a'; g.fillRect(0, y0, 256, y1 - y0); bg.fillStyle = '#c0c0c0'; bg.fillRect(0, y0, 256, y1 - y0);
    for (let x = 0; x < 256; x += 21){ g.fillStyle = '#b8964a'; g.fillRect(x, y0, 3, y1 - y0); bg.fillStyle = '#404040'; bg.fillRect(x, y0, 3, y1 - y0); const gr = g.createLinearGradient(x, 0, x + 21, 0); gr.addColorStop(0, 'rgba(255,255,230,.5)'); gr.addColorStop(1, 'rgba(160,120,60,.25)'); g.fillStyle = gr; g.fillRect(x + 3, y0, 18, y1 - y0); }
    g.fillStyle = '#8a5a10'; g.fillRect(0, y0 - 3, 256, 3); g.fillRect(0, y1, 256, 3);
    return {map:tex(c, LEN / 2.2, 1), bump:tex(b, LEN / 2.2, 1, false)};
  })();
  const bodyM = new THREE.MeshStandardMaterial({map:scaleTex.map, bumpMap:scaleTex.bump, bumpScale:0.035, roughness:0.32, metalness:0.55, side:THREE.DoubleSide});
  const redM = new THREE.MeshStandardMaterial({color:lin(0xc8102e), roughness:0.45, emissive:lin(0x400000), side:THREE.DoubleSide});
  const goldM = new THREE.MeshStandardMaterial({color:lin(0xe6b23a), roughness:0.28, metalness:0.75});
  const hornM = new THREE.MeshStandardMaterial({color:lin(0xd9c48e), roughness:0.45});
  const greenM = new THREE.MeshStandardMaterial({color:lin(0x2faa5a), roughness:0.4, emissive:lin(0x002a10), side:THREE.DoubleSide});
  const blueM = new THREE.MeshStandardMaterial({color:lin(0x2a8ad0), roughness:0.4, side:THREE.DoubleSide});
  const ivoryM = new THREE.MeshStandardMaterial({color:lin(0xf6efe0), roughness:0.3});
  const darkM = new THREE.MeshStandardMaterial({color:lin(0x1a0c06), roughness:0.3});
  const whiskM = new THREE.MeshStandardMaterial({color:lin(0xe8c040), roughness:0.35, metalness:0.5});
  const add = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  // eğik alev: ucu geriye kıvrılan koni (yele, yüzgeç, dirsek püskülleri)
  const flameGeo = (r, h, bend) => { const g = new THREE.ConeGeometry(r, h, 7, 6); g.translate(0, h / 2, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++){ const y = p.getY(i) / h; p.setZ(i, p.getZ(i) + bend * y * y * h); } g.computeVertexNormals(); return g; };

  /* ---------- gövde: her karede yeniden dizilen tüp ---------- */
  const pos = new Float32Array(N * (M + 1) * 3), nor = new Float32Array(N * (M + 1) * 3), uv = new Float32Array(N * (M + 1) * 2), idx = [];
  for (let i = 0; i < N; i++) for (let j = 0; j <= M; j++){ const k = i * (M + 1) + j; uv[k * 2] = i / (N - 1); uv[k * 2 + 1] = j / M; }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++){ const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const bodyG = new THREE.BufferGeometry();
  bodyG.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bodyG.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bodyG.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bodyG.setIndex(idx);
  const body = new THREE.Mesh(bodyG, bodyM); body.castShadow = true; body.frustumCulled = false; root.add(body);

  /* ---------- baş (yerel -z ileri, +y yukarı) ---------- */
  const head = new THREE.Group(); root.add(head);
  add(new THREE.SphereGeometry(0.95, 24, 18), bodyM, 0, 0.05, -0.5, head).scale.set(1.0, 0.82, 1.15);
  const snout = new THREE.CylinderGeometry(0.48, 0.78, 2.1, 18, 4); snout.rotateX(Math.PI / 2); snout.scale(1.1, 0.72, 1);
  add(snout, bodyM, 0, 0.0, -1.95, head);
  add(new THREE.SphereGeometry(0.46, 18, 12), bodyM, 0, 0.06, -3.0, head).scale.set(1.25, 0.78, 0.8);
  [-1, 1].forEach(sd => {
    add(new THREE.SphereGeometry(0.1, 10, 8), darkM, sd * 0.22, 0.2, -3.28, head).scale.set(1, 0.6, 0.6);
    // gözler: altın göz akı, dikey kırmızı bebek, kalın kaş çıkıntısı
    add(new THREE.SphereGeometry(0.24, 16, 12), new THREE.MeshStandardMaterial({color:lin(0xffd84a), roughness:0.15, emissive:lin(0x553300)}), sd * 0.52, 0.36, -1.15, head).scale.set(0.8, 1, 1.1);
    add(new THREE.SphereGeometry(0.12, 12, 10), darkM, sd * 0.68, 0.37, -1.18, head).scale.set(0.4, 1.2, 0.5);
    add(new THREE.SphereGeometry(0.035, 6, 5), new THREE.MeshBasicMaterial({color:0xffffff}), sd * 0.72, 0.45, -1.25, head);
    const brow = add(flameGeo(0.18, 1.3, -0.25), redM, sd * 0.5, 0.58, -1.3, head); brow.rotation.set(-1.25, sd * 0.25, -sd * 0.35);
    // yanak yüzgeçleri ve kulak alevleri
    for (let k = 0; k < 3; k++){ const f = add(flameGeo(0.16, 0.9 - k * 0.15, 0.4), k === 1 ? redM : greenM, sd * (0.82 - k * 0.05), -0.15 - k * 0.12, -0.3 + k * 0.25, head); f.rotation.set(1.3, 0, -sd * (1.2 + k * 0.15)); }
    // geyik boynuzları: ana dal ve iki çatal
    const a0 = [L(sd * 0.3, 0.62, -0.55), L(sd * 0.45, 1.25, -0.2), L(sd * 0.55, 1.75, 0.45), L(sd * 0.52, 2.0, 1.2)];
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a0), 16, 0.085, 7), hornM, 0, 0, 0, head);
    [[0.35, L(sd * 0.85, 1.75, -0.1)], [0.65, L(sd * 0.95, 2.2, 0.55)]].forEach(([t, tip]) => {
      const c = new THREE.CatmullRomCurve3(a0).getPoint(t);
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c, c.clone().lerp(tip, 0.5).add(L(0, 0.1, 0)), tip]), 8, 0.05, 6), hornM, 0, 0, 0, head);
    });
  });
  // ağız: üst dişler, köpek dişleri; ayrı çene (açılıp kapanır), dişler, dil, sakal
  for (let k = 0; k < 7; k++) [-1, 1].forEach(sd => { const tth = add(new THREE.ConeGeometry(0.05, 0.22 + (k === 1 ? 0.2 : 0), 6), ivoryM, sd * (0.42 - k * 0.03), -0.38, -2.95 + k * 0.28, head); tth.rotation.x = Math.PI; });
  const jaw = new THREE.Group(); jaw.position.set(0, -0.35, -0.75); head.add(jaw);
  const jg = new THREE.CylinderGeometry(0.34, 0.6, 2.0, 14, 3); jg.rotateX(Math.PI / 2); jg.scale(1.05, 0.45, 1);
  add(jg, bodyM, 0, -0.2, -1.15, jaw);
  for (let k = 0; k < 6; k++) [-1, 1].forEach(sd => add(new THREE.ConeGeometry(0.045, 0.2 + (k === 0 ? 0.18 : 0), 6), ivoryM, sd * (0.36 - k * 0.03), 0.06, -1.95 + k * 0.28, jaw));
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([L(0, -0.05, -0.6), L(0, 0.0, -1.6), L(0.1, 0.15, -2.4), L(0.25, 0.0, -2.8)]), 12, 0.09, 6), redM, 0, 0, 0, jaw);
  for (let k = 0; k < 7; k++){ const b = add(flameGeo(0.12, 0.9 + rnd() * 0.4, 0.5), k % 2 ? greenM : redM, (k - 3) * 0.09, -0.4, -1.6 + Math.abs(k - 3) * 0.12, jaw); b.rotation.set(Math.PI - 0.5, 0, (k - 3) * 0.15); }
  // ensedeki alev yele
  for (let k = 0; k < 22; k++){ const a = (k / 21 - 0.5) * 2.8, f = add(flameGeo(0.2, 1.5 + rnd() * 0.9, 0.9), [greenM, redM, greenM, blueM][k % 4], Math.sin(a) * 0.75, 0.45 + Math.cos(a) * 0.35, 0.25, head); f.rotation.set(1.15, 0, -a * 0.9); }
  add(new THREE.SphereGeometry(0.16, 12, 10), goldM, 0, 0.62, -0.95, head);      // alındaki kabartma
  // uzun bıyıklar: burun yanlarından çıkıp geriye savrulur (her karede dalgalanır)
  const whiskers = [-1, 1].map(sd => {
    const w = new THREE.Group(); w.position.set(sd * 0.45, 0.0, -3.0); head.add(w);
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([L(0, 0, 0), L(sd * 0.8, 0.2, 0.2), L(sd * 1.7, -0.3, 1.2), L(sd * 2.2, -0.9, 2.8), L(sd * 2.0, -1.5, 4.4)]), 30, 0.04, 5), whiskM, 0, 0, 0, w);
    return w;
  });

  /* ---------- bacaklar: beş tırnaklı ayaklar, dirsekte alev püskülü ---------- */
  const legs = [];
  [[0.15, 1], [0.15, -1], [0.44, 1], [0.44, -1]].forEach(([u, sd], li) => {
    const g = new THREE.Group(); root.add(g);
    const hip = new THREE.Group(); g.add(hip); hip.rotation.z = sd * 0.5;
    add(new THREE.SphereGeometry(0.38, 12, 10), bodyM, 0, 0, 0, hip);
    const th = new THREE.CylinderGeometry(0.28, 0.2, 1.3, 10); th.translate(0, -0.65, 0); add(th, bodyM, 0, 0, 0, hip);
    const knee = new THREE.Group(); knee.position.set(0, -1.3, 0); knee.rotation.x = li < 2 ? 1.0 : -0.9; hip.add(knee);
    add(new THREE.SphereGeometry(0.21, 10, 8), bodyM, 0, 0, 0, knee);
    for (let k = 0; k < 3; k++){ const f = add(flameGeo(0.12, 0.8, 0.6), k === 1 ? redM : greenM, 0, 0, 0.05, knee); f.rotation.set(1.6 + k * 0.25, (k - 1) * 0.5, 0); }
    const sh = new THREE.CylinderGeometry(0.19, 0.15, 1.1, 10); sh.translate(0, -0.55, 0); add(sh, bodyM, 0, 0, 0, knee);
    const foot = new THREE.Group(); foot.position.set(0, -1.15, 0); knee.add(foot);
    add(new THREE.SphereGeometry(0.22, 10, 8), bodyM, 0, 0, -0.08, foot).scale.set(1.1, 0.6, 1.3);
    for (let c = 0; c < 5; c++){
      const a = (c - 2) * 0.42, cl = new THREE.Group(); cl.position.set(Math.sin(a) * 0.18, -0.02, -Math.cos(a) * 0.18 - 0.05); cl.rotation.y = -a; foot.add(cl);
      add(new THREE.CylinderGeometry(0.06, 0.07, 0.35, 6), bodyM, 0, 0, -0.15, cl).rotation.x = Math.PI / 2;
      const claw = add(flameGeo(0.055, 0.42, -0.35), ivoryM, 0, 0, -0.32, cl); claw.rotation.x = -Math.PI / 2 - 0.5;
    }
    legs.push({g, hip, knee, u, sd, ph:li * 1.3});
  });

  /* ---------- sırt yüzgeçleri, yan yeleler, kuyruk alevi (örnekli, her karede dizilir) ---------- */
  const finG = flameGeo(0.3, 1.0, 0.7); finG.scale(0.25, 1, 1);
  const FINS = [], TUFTS = [];
  for (let i = 4; i < N - 4; i += 2) FINS.push(i);
  for (let i = 6; i < N * 0.8; i += 5) [-1, 1].forEach(sd => TUFTS.push([i, sd]));
  const finM = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.42, side:THREE.DoubleSide});
  const fins = new THREE.InstancedMesh(finG, finM, FINS.length); fins.frustumCulled = false; fins.castShadow = true; root.add(fins);
  const tuftTilt = {'-1':new THREE.Quaternion().setFromEuler(new THREE.Euler(1.1, 0, 1.2)), '1':new THREE.Quaternion().setFromEuler(new THREE.Euler(1.1, 0, -1.2))};
  const tufts = new THREE.InstancedMesh(flameGeo(0.16, 1.0, 0.8), finM, TUFTS.length); tufts.frustumCulled = false; root.add(tufts);
  const finCols = [0xc8102e, 0xe8401e, 0x2faa5a, 0x1f8a4a].map(lin), tuftCols = [0x2faa5a, 0x3ac06a, 0x2a8ad0, 0xc8102e].map(lin);
  FINS.forEach((_, n) => fins.setColorAt(n, finCols[n % finCols.length])); TUFTS.forEach((_, n) => tufts.setColorAt(n, tuftCols[Math.floor(n / 2) % tuftCols.length]));
  const tail = new THREE.Group(); root.add(tail);
  for (let k = 0; k < 9; k++){ const a = (k - 4) * 0.28, f = add(flameGeo(0.22, 2.2 + (4 - Math.abs(k - 4)) * 0.35, 1.1), redM, 0, 0, 0, tail); f.rotation.set(Math.PI / 2 - 0.2, 0, a); f.scale.set(1, 1, 0.6); }

  /* ---------- alevli inci ---------- */
  const pearl = new THREE.Group(); root.add(pearl);
  add(new THREE.SphereGeometry(0.75, 24, 16), new THREE.MeshBasicMaterial({color:new THREE.Color(1.6, 1.5, 1.3), toneMapped:false}), 0, 0, 0, pearl).castShadow = false;
  const halo = (() => { const [c, g] = canvas(128, 128), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.35, 'rgba(255,170,80,.45)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:halo, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false})); glow.scale.set(5, 5, 1); pearl.add(glow);
  const pflames = [];
  for (let k = 0; k < 6; k++){ const f = add(flameGeo(0.2, 1.2, 0.5), new THREE.MeshBasicMaterial({color:new THREE.Color(1.8, 0.7, 0.2), toneMapped:false, transparent:true, opacity:0.85}), 0, 0, 0, pearl); f.castShadow = false; pflames.push(f); }

  /* ---------- uçuş yolu: yay uzunluğuna göre örneklenmiş kapalı eğri ---------- */
  const pathAt = (s, out) => out.set(cx + 150 * Math.sin(s) + 38 * Math.sin(3 * s + 0.5), 64 + 14 * Math.sin(2 * s + 1) + 7 * Math.sin(5 * s), cz - 40 + 120 * Math.sin(2 * s) + 28 * Math.cos(s));
  const K = 3000, S = new Float32Array(K + 1), D = new Float32Array(K + 1), tp = L(0, 0, 0), tq = L(0, 0, 0);
  pathAt(0, tp);
  for (let k = 1; k <= K; k++){ S[k] = k / K * Math.PI * 2; pathAt(S[k], tq); D[k] = D[k - 1] + tq.distanceTo(tp); tp.copy(tq); }
  const PL = D[K];
  const atDist = (d, out) => {
    d = ((d % PL) + PL) % PL; let lo = 0, hi = K;
    while (hi - lo > 1){ const m = (lo + hi) >> 1; if (D[m] < d) lo = m; else hi = m; }
    const f = (d - D[lo]) / Math.max(1e-6, D[hi] - D[lo]); return pathAt(S[lo] + (S[hi] - S[lo]) * f, out);
  };

  /* ---------- her kare ---------- */
  const P = Array.from({length:N}, () => L(0, 0, 0)), T = Array.from({length:N}, () => L(0, 0, 0)), U = Array.from({length:N}, () => L(0, 0, 0)), SD = Array.from({length:N}, () => L(0, 0, 0));
  const Y = L(0, 1, 0), a = L(0, 0, 0), b = L(0, 0, 0), side = L(0, 0, 0), up = L(0, 0, 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = L(1, 1, 1), tmp = L(0, 0, 0);
  const SPEED = 15, SPACING = LEN / (N - 1);
  let dist = 0, roarT = 10;
  function frame(i, out){ // bir halkanın konumunda yerel çerçeveyi (yan, üst, kuyruğa doğru) matrise yaz
    return out.makeBasis(SD[i], U[i], T[i]).setPosition(P[i]);
  }
  function update(dt, t, hero){
    if (!root.visible) return;
    if (hero && Math.hypot(hero.pos.x - cx, hero.pos.z - cz) > 1500) return;
    dist += SPEED * dt;
    // omurga: yol üstünde ardışık noktalar + yana ve yukarı ilerleyen yılan dalgası
    for (let i = 0; i < N; i++){
      const u = i / (N - 1), d = dist - i * SPACING;
      atDist(d, a); atDist(d - 0.5, b);
      const tg = b.sub(a).normalize();                       // kuyruğa doğru
      side.crossVectors(tg, Y).normalize(); up.crossVectors(side, tg).normalize();
      const env = 0.25 + 0.75 * Math.min(1, u * 2.5);
      const lat = Math.sin(i * 0.17 - t * 2.3) * 2.4 * env, ver = Math.sin(i * 0.11 - t * 1.7 + 1) * 1.8 * env;
      P[i].copy(a).addScaledVector(side, lat).addScaledVector(up, ver);
    }
    // teğetler ve paralel taşınan çerçeveler (gövde bükülmeden kıvrılır)
    for (let i = 0; i < N; i++){ const j = Math.min(N - 1, i + 1), k = Math.max(0, i - 1); T[i].subVectors(P[j], P[k]).normalize(); }
    U[0].copy(Y).addScaledVector(T[0], -T[0].dot(Y)).normalize();
    for (let i = 1; i < N; i++){ U[i].copy(U[i - 1]).addScaledVector(T[i], -T[i].dot(U[i - 1])).normalize(); }
    for (let i = 0; i < N; i++) SD[i].crossVectors(U[i], T[i]).normalize();
    // tüp köşeleri
    for (let i = 0; i < N; i++){
      const r = rad(i / (N - 1));
      for (let j = 0; j <= M; j++){
        const th = j / M * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), k = (i * (M + 1) + j) * 3;
        const ny = cs * 0.92;        // karın biraz yassı
        tmp.copy(U[i]).multiplyScalar(ny).addScaledVector(SD[i], sn);
        pos[k] = P[i].x + tmp.x * r; pos[k + 1] = P[i].y + tmp.y * r; pos[k + 2] = P[i].z + tmp.z * r;
        tmp.normalize(); nor[k] = tmp.x; nor[k + 1] = tmp.y; nor[k + 2] = tmp.z;
      }
    }
    bodyG.attributes.position.needsUpdate = true; bodyG.attributes.normal.needsUpdate = true;
    // baş: ilk halkaya oturur, burnu ileri; çene nefesle açılıp kapanır, bıyıklar dalgalanır
    frame(0, m4); m4.decompose(head.position, head.quaternion, sc); head.position.addScaledVector(T[0], -0.4);
    jaw.rotation.x = 0.28 + Math.sin(t * 0.9) * 0.14;
    whiskers.forEach((w, k) => { w.rotation.y = Math.sin(t * 2.1 + k) * 0.18; w.rotation.x = Math.sin(t * 1.7 + k * 2) * 0.12; });
    // bacaklar: gövdenin altında, kürek çeker gibi
    legs.forEach(l => {
      const i = Math.round(l.u * (N - 1)), r = rad(l.u);
      frame(i, m4); m4.decompose(l.g.position, l.g.quaternion, sc);
      l.g.position.addScaledVector(SD[i], l.sd * r * 0.78).addScaledVector(U[i], -r * 0.45);
      l.hip.rotation.x = Math.sin(t * 1.8 + l.ph) * 0.45 + 0.25; l.knee.rotation.x = (l.u < 0.3 ? 1.0 : -0.9) + Math.sin(t * 1.8 + l.ph + 1) * 0.3;
    });
    // sırt yüzgeçleri ve yan alevler
    FINS.forEach((i, n) => { const r = rad(i / (N - 1)); frame(i, m4); tmp.copy(P[i]).addScaledVector(U[i], r * 0.8); m4.setPosition(tmp); m4.scale(sc.setScalar(0.45 + r * 0.9)); fins.setMatrixAt(n, m4); });
    TUFTS.forEach(([i, sd], n) => {
      const r = rad(i / (N - 1)); frame(i, m4); q.setFromRotationMatrix(m4);
      q.multiply(tuftTilt[sd]);
      tmp.copy(P[i]).addScaledVector(SD[i], sd * r * 0.85).addScaledVector(U[i], r * 0.25);
      m4.compose(tmp, q, sc.setScalar(0.5 + r * 0.8 + Math.sin(t * 6 + n) * 0.06)); tufts.setMatrixAt(n, m4);
    });
    fins.instanceMatrix.needsUpdate = true; tufts.instanceMatrix.needsUpdate = true;
    frame(N - 1, m4); m4.decompose(tail.position, tail.quaternion, sc); tail.rotation.z += Math.sin(t * 3) * 0.1;
    // inci: başın önünde süzülür, alevleri döner
    atDist(dist + 9 + Math.sin(t * 0.8) * 2, pearl.position); pearl.position.y += Math.sin(t * 1.3) * 1.2 + 1;
    pflames.forEach((f, k) => { const an = t * 2 + k / pflames.length * Math.PI * 2; f.position.set(Math.cos(an) * 0.7, Math.sin(t * 3 + k) * 0.2, Math.sin(an) * 0.7); f.rotation.set(Math.PI / 2, -an, 0); });
    // yakından geçerken kükrer
    roarT -= dt;
    if (hero && roarT <= 0 && P[0].distanceTo(hero.obj.position) < 75){ roarT = 30 + rnd() * 20; sfx('roar'); }
  }
  return {root, update, head:() => P[0]};
}
