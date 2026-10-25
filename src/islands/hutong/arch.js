// Çin mimarisi kiti: kavisli çatılar, siheyuan, tulou, Tiān Tán, Beş Element Pagodası, ay kapısı, paifang, köşk,
// pazar tezgâhı ve fenerler. Hepsi ctx.kit üzerine kurulur; her yapı yerleşim matrisinden aldığı alana çizilir.
//
// Çizim stratejisi:
//  - Az sayıda paylaşılan malzeme (tek kiremit dokusu, renkleri farklı): kit.bake aynı malzemeli parçaları birleştirir.
//  - Kavisli çatı = parametrik yüzey: y(t) = H·(0.3t + 0.7t²) içbükey eğim, köşelerde lift·|2u−1|⁶ saçak kalkışı.
//  - Fenerler tek InstancedMesh; gece rengi, hale ve yerdeki ışık havuzları tek bir uniform/opaklıkla yanar.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { P, FONT } from './palette.js';

export function makeArch(ctx){
  const { THREE, kit, C, root, rnd } = ctx;
  const { add, mat, canvas, ctex } = kit;
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const nonIdx = g => g.index ? g.toNonIndexed() : g;
  const merge = parts => mergeBufferGeometries(parts.map(nonIdx));
  const heightFns = C.heightFns;

  /* ================= dokular ================= */
  const tex = (w, h, fn, rx = 1, ry = 1) => { const [c, g] = canvas(w, h); fn(g, w, h); return ctex(c, rx, ry); };
  // oluklu kil kiremit: gri tonlu, rengi malzeme verir (tek doku, birçok renk)
  const tileTex = tex(128, 128, (g) => {
    for (let x = 0; x < 128; x++){ const k = Math.sin((x % 16) / 16 * Math.PI), v = 110 + k * 145; g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(x, 0, 1, 128); }
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 3);
  });
  const brickTex = tex(256, 256, (g) => {
    g.fillStyle = '#b8b8b2'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 16; x < 288; x += 32){ const v = 200 + rnd() * 50; g.fillStyle = `rgb(${v | 0},${v | 0},${v + 4 | 0})`; g.fillRect(x - 32 + 1, y + 1, 30, 14); }
  });
  const plasterTex = tex(256, 256, (g) => {
    g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++){ const x = rnd() * 256, y = rnd() * 256, r = 6 + rnd() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(120,118,105,.10)'); gr.addColorStop(1, 'rgba(120,118,105,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const dr = g.createLinearGradient(0, 200, 0, 256); dr.addColorStop(0, 'rgba(80,90,80,0)'); dr.addColorStop(1, 'rgba(80,90,80,.28)'); g.fillStyle = dr; g.fillRect(0, 200, 256, 56);
  });
  // sıkıştırılmış toprak: kalıp katmanları (版筑) kalın bantlar, bantların içinde lekeler ve çakıl
  const earthTex = tex(256, 256, (g) => {
    g.fillStyle = '#e6d2b0'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32){ const v = 214 + rnd() * 22; g.fillStyle = `rgb(${v | 0},${v * 0.88 | 0},${v * 0.7 | 0})`; g.fillRect(0, y, 256, 30); g.fillStyle = 'rgba(120,90,60,.35)'; g.fillRect(0, y + 30, 256, 2); }
    for (let i = 0; i < 900; i++){ const v = 150 + rnd() * 80; g.fillStyle = `rgba(${v | 0},${v * 0.8 | 0},${v * 0.6 | 0},.35)`; g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 3, 1 + rnd() * 2); }
    for (let i = 0; i < 30; i++){ const x = rnd() * 256, y = rnd() * 256, r = 10 + rnd() * 30, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(110,80,50,.16)'); gr.addColorStop(1, 'rgba(110,80,50,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  });
  const stoneTex = tex(256, 256, (g) => {
    g.fillStyle = '#9a978f'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = (y / 32 % 2) * 40; x < 336; x += 80){ const v = 170 + rnd() * 45; g.fillStyle = `rgb(${v | 0},${v | 0},${v * 0.96 | 0})`; g.fillRect(x - 80 + 2, y + 2, 76, 28); }
  });
  const latticeTex = tex(128, 128, (g) => {
    g.fillStyle = '#f2e3c0'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#6a1a12'; g.lineWidth = 4;
    for (let x = 12; x < 120; x += 13){ g.beginPath(); g.moveTo(x, 8); g.lineTo(x, 84); g.stroke(); }
    for (let y = 8; y < 86; y += 13){ g.beginPath(); g.moveTo(8, y); g.lineTo(120, y); g.stroke(); }
    g.fillStyle = '#7a1a14'; g.fillRect(0, 86, 128, 42); g.fillRect(0, 0, 128, 8); g.fillRect(0, 0, 8, 128); g.fillRect(120, 0, 8, 128);
    g.strokeStyle = '#d4af37'; g.lineWidth = 2; g.strokeRect(16, 96, 96, 22);
  });
  const doorTex = tex(128, 256, (g) => {
    g.fillStyle = '#8a1c14'; g.fillRect(0, 0, 128, 256);
    g.fillStyle = '#d4af37'; for (let y = 30; y < 240; y += 28) for (let x = 18; x < 120; x += 23){ g.beginPath(); g.arc(x, y, 4.5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#5a120c'; g.fillRect(62, 0, 4, 256);
  });
  const bandTex = tex(256, 64, (g) => {
    g.fillStyle = '#1f4a6e'; g.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 32){ g.fillStyle = '#2f7a5c'; g.fillRect(x + 2, 8, 28, 48); g.fillStyle = '#d4af37'; g.beginPath(); g.ellipse(x + 16, 32, 10, 14, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1f4a6e'; g.beginPath(); g.ellipse(x + 16, 32, 5, 8, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#9c2219'; g.fillRect(0, 0, 256, 6); g.fillRect(0, 58, 256, 6);
  });
  const fuTex = tex(64, 64, (g) => {
    g.fillStyle = '#c8102e'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#1a0a06'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 46px ' + FONT; g.fillText('福', 32, 35);
  });
  // kapı numarası atlası: 8×8 mavi Pekin plakası tek dokuda, her parsel kendi hücresinin UV'sini alır → tek malzeme, tek çizim
  const PLATE_N = 64;
  const plateTex = tex(512, 256, (g) => {
    for (let i = 0; i < PLATE_N; i++){
      const cx = (i % 8) * 64, cy = Math.floor(i / 8) * 32;
      g.fillStyle = '#1f3f8a'; g.fillRect(cx, cy, 64, 32); g.strokeStyle = '#e8eef6'; g.lineWidth = 2; g.strokeRect(cx + 3, cy + 3, 58, 26);
      g.fillStyle = '#f4f6fa'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 18px ' + FONT; g.fillText((i + 1) + '号', cx + 32, cy + 17);
    }
  });
  plateTex.wrapS = plateTex.wrapT = THREE.ClampToEdgeWrapping;

  /* ================= malzemeler ================= */
  const tileMat = (c) => mat(c, {map:tileTex, roughness:0.42, metalness:0.08, side:THREE.DoubleSide});
  const M = {
    tile:tileMat(P.tile), tileDark:tileMat(0x34383c), heaven:tileMat(P.heaven), tileGold:tileMat(0xe2a82a), tileGreen:tileMat(0x3f7a58),
    brick:mat(P.brick, {map:brickTex, roughness:0.92}), brickDark:mat(P.brickDark, {map:brickTex, roughness:0.95}),
    plaster:mat(0xffffff, {map:plasterTex, roughness:0.9}), earth:mat(P.rammedEarth, {map:earthTex, roughness:1}),
    stone:mat(0xffffff, {map:stoneTex, roughness:0.9}), paving:mat(P.paving, {map:stoneTex, roughness:0.92}),
    courtyard:mat(P.courtyard, {map:brickTex, roughness:0.9}), mortar:mat(P.mortar, {roughness:0.9}),
    vermilion:mat(P.vermilion, {roughness:0.45}), lacquer:mat(P.lacquer, {roughness:0.5}),
    door:mat(0xffffff, {map:doorTex, roughness:0.5}), fu:mat(0xffffff, {map:fuTex, roughness:0.6}),
    band:mat(0xffffff, {map:bandTex, roughness:0.55}), marble:mat(P.marble, {roughness:0.38}),
    wood:mat(P.wood, {roughness:0.8}), woodDark:mat(P.woodDark, {roughness:0.75}), gold:kit.gold, bronze:mat(0x5a4526, {metalness:0.85, roughness:0.38}),
    plate:mat(0xffffff, {map:plateTex, roughness:0.4}), rope:mat(0x2a1e14, {roughness:0.9}),
  };
  M.bandD = mat(0xffffff, {map:bandTex, roughness:0.55, side:THREE.DoubleSide});
  M.earthIn = mat(P.rammedEarth, {map:earthTex, roughness:1, side:THREE.BackSide});
  M.lacquerD = mat(P.lacquer, {roughness:0.5, side:THREE.DoubleSide});
  M.dragonWay = mat(0xd8d2c0, {roughness:0.4});
  M.imperialWay = mat(0xd2cab6, {map:stoneTex, roughness:0.85});
  // kafesli pencere kâğıdı: gece içeriden yanar (tek malzeme, tek uniform)
  M.paper = new THREE.MeshStandardMaterial({map:latticeTex, roughness:0.7, emissive:0xffa64a, emissiveMap:latticeTex, emissiveIntensity:0});
  M.paperIn = new THREE.MeshStandardMaterial({map:latticeTex, roughness:0.7, emissive:0xffa64a, emissiveMap:latticeTex, emissiveIntensity:0, side:THREE.BackSide});

  /* ================= geometri yardımcıları ================= */
  // dokunun ölçeği yüzün metre ölçüsüne göre: duvar uzasa da tuğla boyu aynı kalır
  function box(w, h, d, s = 2){
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
    return g;
  }
  /** Zemin kaplaması: doku metre ölçüsünde tekrar eder (kit.plane'deki gibi tek karoya gerilmez). */
  function floor(w, d, m, x, y, z, rot = 0, tile = 4){ const g = scaleUV(new THREE.PlaneGeometry(w, d), w / tile, d / tile); const f = add(g, m, x, y, z, root, false); f.rotation.set(-Math.PI / 2, 0, rot); return f; }
  function scaleUV(g, su, sv = su){ const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g; }
  const colGeo = (r, h) => new THREE.CylinderGeometry(r, r * 1.08, h, 10);
  function plaque(text, w, h, {bg = '#1d3a6e', fg = '#e8c15a', vertical = false} = {}){
    const [c, g] = canvas(vertical ? 128 : 512, vertical ? 512 : 128);
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = '#d4af37'; g.lineWidth = 10; g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (vertical){ const n = [...text].length, fs = Math.min(100, 440 / n); g.font = 'bold ' + fs + 'px ' + FONT; [...text].forEach((ch, i) => g.fillText(ch, 64, 36 + fs / 2 + i * (440 / n))); }
    else { let fs = 84; do { g.font = 'bold ' + fs + 'px ' + FONT; fs -= 4; } while (g.measureText(text).width > c.width - 60); g.fillText(text, c.width / 2, c.height / 2 + 4); }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.5}));
  }
  function putPlaque(text, x, y, z, ry, w, h, o, parent = root){ const m = plaque(text, w, h, o); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; }

  /* ================= çatılar ================= */
  // 硬山 beşik çatı (siheyuan, Jiangnan evleri): sırt x ekseninde, saçaklar ±z'de, içbükey eğim
  function gableRoof(W, D, H, {lift = 0.25, nu = 8, nv = 16, ts = 1.6, ridge = true} = {}){
    const pos = [], uv = [], idx = [], slope = Math.hypot(H, D / 2);
    for (let j = 0; j <= nv; j++){
      const s = j / nv * 2 - 1, t = 1 - Math.abs(s);
      for (let i = 0; i <= nu; i++){
        const u = i / nu, e = Math.pow(Math.abs(2 * u - 1), 6);
        pos.push((u - 0.5) * W, H * (0.3 * t + 0.7 * t * t) + lift * e * (1 - t) * (1 - t), s * D / 2);
        uv.push((u - 0.5) * W / ts, s * slope / ts);
      }
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++){ const a = j * (nu + 1) + i, b = a + nu + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    let rg = null;
    if (ridge){
      const parts = [box(W + 0.25, 0.36, 0.34).translate(0, H + 0.1, 0)];
      [-1, 1].forEach(sd => { const tail = box(0.22, 0.6, 0.3); tail.rotateZ(sd * 0.55); tail.translate(sd * (W / 2 + 0.05), H + 0.38, 0); parts.push(tail); });
      rg = merge(parts);
    }
    return {roof:g, ridge:rg, y:s => { const t = 1 - Math.abs(s); return H * (0.3 * t + 0.7 * t * t); }};
  }
  // 庑殿/攒尖 kalça ve çokgen çatı (salon, köşk, pagoda, Tiān Tán): china.js'teki roofGeo'nun eşi
  // shape: {type:'rect', W, D} (W ≥ D) | {type:'poly', n, R, rTop}; t: saçaktan (0) mahyaya (1)
  function hipRoof(shape, H, {lift = 1, tMax = 1, rings = 10, seg = 8, fascia = 0.3} = {}){
    const per = shape.type === 'rect' ? 4 : shape.n, N = per * seg, pos = [], uv = [], idx = [], corner = [];
    const perim = shape.type === 'rect' ? 2 * (shape.W + shape.D) : shape.n * 2 * shape.R * Math.sin(Math.PI / shape.n);
    const slope = Math.hypot(H, shape.type === 'rect' ? shape.D / 2 : shape.R - (shape.rTop || 0));
    const ring = (t, dy) => {
      for (let i = 0; i <= N; i++){
        const e = Math.min(per - 1, Math.floor(i / seg)), u = (i - e * seg) / seg, c = Math.pow(Math.abs(u * 2 - 1), 6), k = Math.pow(Math.max(0, 1 - t / 0.6), 2);
        let x, z;
        if (shape.type === 'rect'){
          const hx = shape.W / 2 - t * shape.D / 2, hz = shape.D / 2 * (1 - t), s = u * 2 - 1;
          if (e === 0){ x = s * hx; z = hz; } else if (e === 1){ x = hx; z = -s * hz; } else if (e === 2){ x = -s * hx; z = -hz; } else { x = -hx; z = s * hz; }
        } else {
          const r = shape.R + ((shape.rTop || 0) - shape.R) * t, a0 = e / per * Math.PI * 2, a1 = (e + 1) / per * Math.PI * 2;
          x = r * (Math.sin(a0) * (1 - u) + Math.sin(a1) * u); z = r * (Math.cos(a0) * (1 - u) + Math.cos(a1) * u);
        }
        const fl = 1 + 0.07 * c * k, y = H * (0.3 * t + 0.7 * t * t) + lift * c * k + dy;
        pos.push(x * fl, y, z * fl); uv.push(i / N * perim / 1.6, t * slope / 1.6);
        if (dy === 0 && u === 0 && i < N) (corner[e] = corner[e] || []).push(L(x * fl, y + 0.12, z * fl));
      }
    };
    const R = Math.max(2, Math.round(rings * tMax));
    ring(0, -fascia);
    for (let r = 0; r <= R; r++) ring(r / R * tMax, 0);
    const row = N + 1;
    for (let j = 0; j < R + 1; j++) for (let i = 0; i < N; i++){ const a = j * row + i, b = a + row; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const ridges = corner.filter(p => p && p.length > 1).map(p => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 8, 0.12 + H * 0.008, 5));
    if (shape.type === 'rect' && tMax >= 1){ const len = shape.W - shape.D + 0.8; ridges.push(box(len, 0.5, 0.4).translate(0, H + 0.18, 0)); }
    return {roof:g, ridge:ridges.length ? merge(ridges) : null};
  }
  function putHip(parent, shape, H, y, m, o = {}){
    const {roof:rg, ridge} = hipRoof(shape, H, o);
    add(rg, m, 0, y, 0, parent); if (ridge) add(ridge, o.ridgeMat || m, 0, y, 0, parent);
  }
  // 马头墙 at başı duvarı: Jiangnan evlerinin beşik ucundan yükselen basamaklı beyaz duvar, her basamakta kiremit başlık
  function horseHead(parent, x, D, H, y0, steps = 3){
    for (let k = 0; k < steps; k++){
      const half = D / 2 * (1 - k / steps) + 0.3, top = y0 + H * (k + 1) / steps + 0.55, h = top - y0 + 0.2;
      add(box(0.36, h, half * 2), M.plaster, x, y0 + h / 2 - 0.2, 0, parent);
      const cap = add(box(0.62, 0.16, half * 2 + 0.3), M.tileDark, x, top + 0.06, 0, parent, false);
      [-1, 1].forEach(sd => { const t = add(box(0.5, 0.14, 0.4), M.tileDark, x, top + 0.16, sd * (half + 0.2), parent, false); t.rotation.x = sd * 0.5; });
      cap.userData.k = k;
    }
  }

  /* ================= fenerler ================= */
  // [x, y, z, ölçek, yerdeki ışık havuzunun yüksekliği | null]
  const LAN = [];
  const lantern = (x, y, z, k = 1, poolY = 0) => { LAN.push([x, y, z, k, poolY]); };
  /** Döndürülmüş bir grubun yerel noktasına fener */
  const lanternAt = (G, lx, y, lz, k, poolY) => { const [x, z] = kit.toWorld(G, lx, lz); lantern(x, y, z, k, poolY); };
  /** İki nokta arasında sarkan ip ve üzerinde fener dizisi */
  function lanternLine(ax, az, bx, bz, y, n, sag = 0.7, k = 0.6){
    const pts = [];
    for (let i = 0; i <= 12; i++){ const t = i / 12; pts.push(L(ax + (bx - ax) * t, y - sag * 4 * t * (1 - t), az + (bz - az) * t)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.025, 4), M.rope, 0, 0, 0, root, false);
    for (let i = 1; i <= n; i++){ const t = i / (n + 1); lantern(ax + (bx - ax) * t, y - sag * 4 * t * (1 - t) - 0.38 * k, az + (bz - az) * t, k, null); }
  }
  function finishLanterns(){
    const N = LAN.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const bodyG = new THREE.SphereGeometry(0.3, 12, 8); bodyG.scale(1, 1.15, 1);
    const capG = merge([new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10).translate(0, 0.38, 0), new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10).translate(0, -0.38, 0), new THREE.CylinderGeometry(0.03, 0.05, 0.32, 6).translate(0, -0.6, 0)]);
    const dayC = new THREE.Color(P.lanternDay).convertSRGBToLinear(), nightC = new THREE.Color(P.lanternNight).convertSRGBToLinear();
    const bodyMat = new THREE.MeshBasicMaterial({color:dayC.clone(), toneMapped:false});
    const haloMat = new THREE.MeshBasicMaterial({color:new THREE.Color(0xff5a20).convertSRGBToLinear(), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
    // yerdeki sıcak ışık havuzu: dairesel gradyan, toplamalı karışım; yüzlerce fener ama sıfır gerçek ışık
    const [pc, pg] = canvas(128, 128), gr = pg.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,150,80,1)'); gr.addColorStop(0.4, 'rgba(255,110,50,.45)'); gr.addColorStop(1, 'rgba(255,90,40,0)'); pg.fillStyle = gr; pg.fillRect(0, 0, 128, 128);
    const poolTex = new THREE.CanvasTexture(pc); poolTex.encoding = THREE.sRGBEncoding;
    const poolMat = new THREE.MeshBasicMaterial({map:poolTex, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});
    const pools = LAN.filter(l => l[4] != null);
    const body = new THREE.InstancedMesh(bodyG, bodyMat, N), caps = new THREE.InstancedMesh(capG, M.gold, N);
    const halo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.85, 10, 6), haloMat, N);
    const poolG = new THREE.PlaneGeometry(1, 1); poolG.rotateX(-Math.PI / 2);
    const pool = new THREE.InstancedMesh(poolG, poolMat, Math.max(1, pools.length));
    LAN.forEach(([x, y, z, k], i) => { m4.compose(p.set(x, y, z), q, s.set(k, k, k)); body.setMatrixAt(i, m4); caps.setMatrixAt(i, m4); halo.setMatrixAt(i, m4); });
    pools.forEach(([x, y, z, k, py], i) => { const r = 5 + k * 2; m4.compose(p.set(x, py + 0.04 + i % 7 * 0.002, z), q, s.set(r, 1, r)); pool.setMatrixAt(i, m4); });
    pool.count = pools.length;
    caps.castShadow = true; halo.renderOrder = 2; pool.renderOrder = 1;
    [body, caps, halo, pool].forEach(o => { o.frustumCulled = false; root.add(o); });
    return {count:N, update(night){
      bodyMat.color.copy(dayC).lerp(nightC, night);
      haloMat.opacity = 0.32 * night; poolMat.opacity = 0.6 * night;
      M.paper.emissiveIntensity = M.paperIn.emissiveIntensity = night * 0.85;
    }};
  }

  /* ================= duvar, ev, kapı ================= */
  /** Gri tuğla (ya da beyaz sıva) duvar, kiremit başlıklı; çarpışmalı. */
  function wall(x0, z0, x1, z1, {h = 3, t = 0.5, m = M.brick, cap = M.tile, y = 0} = {}){
    const len = Math.hypot(x1 - x0, z1 - z0); if (len < 0.2) return;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ry = Math.atan2(z1 - z0, x1 - x0);
    const G = new THREE.Group(); G.position.set(cx, y, cz); G.rotation.y = -ry; root.add(G);
    add(box(len, h, t), m, 0, h / 2, 0, G);
    add(box(len + 0.1, 0.14, t + 0.12), M.mortar, 0, h + 0.07, 0, G, false);
    const c = add(gableRoof(len + 0.2, t + 0.5, 0.28, {lift:0, nu:2, nv:4, ridge:false}).roof, cap, 0, h + 0.12, 0, G, false); c.castShadow = true;
    C.box(cx, cz, len / 2, t / 2 + 0.05, -ry);
  }
  /** Ev: yerel +z önü (kafesli cephe, kırmızı sütunlar), beşik çatı.
   *  style: 'north' gri tuğla | 'jiangnan' beyaz sıva, koyu kiremit, at başı duvarı | 'wood' ahşap köy evi. h > 4.6 iki katlı cephe. */
  function house({x, z, w, d, h = 3.2, rot = 0, y = 0, roofH, over = 0.7, style = 'north', plinth = 0.45, cols = true, collide = true, parent = root}){
    const G = new THREE.Group(); G.position.set(x, y, z); G.rotation.y = rot; parent.add(G);
    const jn = style === 'jiangnan', wallM = {north:M.brick, jiangnan:M.plaster, wood:M.wood}[style], roofM = style === 'north' ? M.tile : M.tileDark;
    add(box(w + 0.5, plinth, d + 0.5), M.stone, 0, plinth / 2, 0, G);
    add(box(w, h, d), wallM, 0, plinth + h / 2, 0, G);
    const fw = w - (jn ? 1.2 : 0.8), fp = add(scaleUV(new THREE.PlaneGeometry(fw, h - 0.4), Math.max(1, Math.round(fw / 1.4)), 1), M.paper, 0, plinth + (h - 0.4) / 2 + 0.05, d / 2 + 0.03, G, false);
    fp.userData.front = true;
    if (cols){
      const n = Math.max(2, Math.round(w / 3.2)), cg = colGeo(0.15, h);
      for (let i = 0; i <= n; i++) add(cg, jn ? M.woodDark : M.vermilion, -w / 2 + 0.2 + i * (w - 0.4) / n, plinth + h / 2, d / 2 + 0.2, G);
      add(box(w + 0.1, 0.3, 0.28), jn ? M.woodDark : M.vermilion, 0, plinth + h - 0.12, d / 2 + 0.2, G);
      if (!jn) add(box(w + 0.1, 0.24, 0.3), M.band, 0, plinth + h - 0.4, d / 2 + 0.21, G, false);
    }
    if (h > 4.6){
      // iki kat: ara kiriş ve üst katın balkon korkuluğu
      add(box(w + 0.1, 0.22, 0.5), M.woodDark, 0, plinth + h / 2, d / 2 + 0.25, G);
      add(box(w - 0.2, 0.08, 0.08), jn ? M.woodDark : M.vermilion, 0, plinth + h / 2 + 0.9, d / 2 + 0.45, G);
      const n = Math.round(w / 0.5); for (let i = 0; i <= n; i++) add(box(0.06, 0.9, 0.06), M.woodDark, -w / 2 + 0.1 + i * (w - 0.2) / n, plinth + h / 2 + 0.45, d / 2 + 0.45, G);
    }
    const RH = roofH || d * 0.32, R = gableRoof(w + 0.3, d + over * 2, RH, {lift:jn ? 0.12 : 0.25});
    add(R.roof, roofM, 0, plinth + h - 0.08, 0, G); add(R.ridge, roofM, 0, plinth + h - 0.08, 0, G);
    if (jn) [-1, 1].forEach(sd => horseHead(G, sd * (w / 2 + 0.05), d + 0.4, RH, plinth + h));
    else [-1, 1].forEach(sd => {
      // gable duvarı: çatının eğrisini izleyen tuğla üçgen
      const s = new THREE.Shape(), D2 = d / 2 + over * 0.4;
      s.moveTo(-D2, 0); for (let i = 0; i <= 12; i++){ const v = i / 6 - 1; s.lineTo(v * D2, R.y(v * D2 / (d / 2 + over)) + 0.05); } s.lineTo(D2, 0); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, {depth:0.32, bevelEnabled:false}); g.translate(0, 0, -0.16); g.rotateY(Math.PI / 2); scaleUV(g, 0.5);
      add(g, style === 'wood' ? M.wood : M.brick, sd * (w / 2 + 0.02), plinth + h - 0.08, 0, G);
    });
    if (collide){ const o = C.box(x, z, w / 2 + 0.3, d / 2 + 0.3, rot); if (y > 0.5){ o.y0 = y; o.y1 = y + h + plinth + RH; } }
    return {G, front:kit.toWorld(G, 0, d / 2 + 1.6), w, d};
  }
  /** 门楼 kapı evi: iki tuğla ayak, açık kırmızı kanatlar, küçük kavisli çatı, kapı taşları, fener, numara plakası. */
  function gateHouse({x, z, rot = 0, w = 2.4, no = 0, lanterns = true, poolY = 0}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const ph = 3.4;
    [-1, 1].forEach(sd => {
      add(box(0.8, ph, 1.0), M.brick, sd * (w / 2 + 0.4), ph / 2, 0, G);
      const drum = add(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14), M.stone, sd * (w / 2 - 0.25), 0.5, 0.75, G); drum.rotation.x = Math.PI / 2;
      add(box(0.3, 0.4, 0.5), M.stone, sd * (w / 2 - 0.25), 0.2, 0.75, G);
      // kanat içeri doğru açık
      const leaf = new THREE.Group(); leaf.position.set(sd * w / 2, 0, -0.1); leaf.rotation.y = sd * 1.25; G.add(leaf);
      add(box(w / 2 - 0.05, 2.8, 0.09), M.door, -sd * (w / 4), 1.45, 0, leaf);
      add(new THREE.PlaneGeometry(0.42, 0.42), M.fu, -sd * (w / 4), 1.9, 0.06, leaf, false).rotation.z = Math.PI / 4;
      if (lanterns) lanternAt(G, sd * (w / 2 + 0.4), 2.9, 0.95, 0.8, poolY);
    });
    add(box(w + 0.3, 0.5, 0.9), M.vermilion, 0, ph - 0.45, 0, G);
    add(box(w + 0.3, 0.22, 0.95), M.band, 0, ph - 0.82, 0, G, false);
    const R = gableRoof(w + 2.2, 2.6, 0.95, {lift:0.3, nu:6, nv:10});
    add(R.roof, M.tile, 0, ph, 0, G); add(R.ridge, M.tile, 0, ph, 0, G);
    if (no >= 1 && no <= PLATE_N){
      const g = new THREE.PlaneGeometry(0.5, 0.25), uv = g.attributes.uv, i = no - 1, cx = i % 8, cy = Math.floor(i / 8);
      for (let k = 0; k < uv.count; k++) uv.setXY(k, (cx + uv.getX(k)) / 8, 1 - (cy + 1 - uv.getY(k)) / 8);
      add(g, M.plate, w / 2 + 0.4, 2.3, 0.52, G, false);
    }
    [-1, 1].forEach(sd => { const [cx, cz] = kit.toWorld(G, sd * (w / 2 + 0.4), 0); C.box(cx, cz, 0.42, 0.52, rot); });
    return G;
  }
  /** 月亮门 ay kapısı: dairesel geçitli duvar. Arkadaki bahçeyi bir tablo gibi çerçeveler. */
  function moonGate({x, z, rot = 0, len = 10, h = 3.8, r = 1.55, t = 0.5, m = M.plaster, cap = M.tileDark, text = null}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const s = new THREE.Shape(); s.moveTo(-len / 2, 0); s.lineTo(len / 2, 0); s.lineTo(len / 2, h); s.lineTo(-len / 2, h); s.closePath();
    const cy = r + 0.12, hole = new THREE.Path(); hole.absarc(0, cy, r, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, {depth:t, bevelEnabled:false, curveSegments:36}); g.translate(0, 0, -t / 2); scaleUV(g, 0.5);
    add(g, m, 0, 0, 0, G);
    [-1, 1].forEach(sd => add(new THREE.TorusGeometry(r, 0.11, 6, 40), M.stone, 0, cy, sd * (t / 2 + 0.02), G, false));
    add(box(len + 0.1, 0.14, t + 0.12), M.mortar, 0, h + 0.07, 0, G, false);
    add(gableRoof(len + 0.4, t + 0.7, 0.35, {lift:0.12, nu:4, nv:4, ridge:false}).roof, cap, 0, h + 0.12, 0, G);
    if (text) [-1, 1].forEach(sd => putPlaque(text, 0, cy + r + 0.55, sd * (t / 2 + 0.03), sd > 0 ? 0 : Math.PI, 1.8, 0.45, {bg:'#f4f2ec', fg:'#2a2a2a'}, G));
    const seg = len / 2 - r * 0.78;
    [-1, 1].forEach(sd => { const [cx, cz] = kit.toWorld(G, sd * (r * 0.78 + seg / 2), 0); C.box(cx, cz, seg / 2, t / 2 + 0.05, rot); });
    return G;
  }
  /** 牌坊 üç açıklıklı tören kapısı. */
  function paifang({x, z, rot = 0, W = 13, text = '胡同', sub = null}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const xs = [-W * 0.42, -W * 0.14, W * 0.14, W * 0.42];
    xs.forEach((cx, i) => {
      const h = i === 1 || i === 2 ? 7 : 5.6;
      add(colGeo(0.3, h), M.vermilion, cx, h / 2, 0, G);
      add(box(0.9, 0.9, 1.6), M.stone, cx, 0.45, 0, G);
      const [wx, wz] = kit.toWorld(G, cx, 0); C.box(wx, wz, 0.48, 0.82, rot);
    });
    const beam = (x0, x1, y) => { add(box(x1 - x0 + 0.8, 0.45, 0.5), M.vermilion, (x0 + x1) / 2, y, 0, G); add(box(x1 - x0 + 0.6, 0.6, 0.55), M.band, (x0 + x1) / 2, y - 0.6, 0, G, false); };
    beam(xs[1], xs[2], 6.6); beam(xs[0], xs[1], 5.2); beam(xs[2], xs[3], 5.2);
    const roofAt = (cx, w, y) => { const g = new THREE.Group(); g.position.set(cx, y, 0); G.add(g); putHip(g, {type:'rect', W:w, D:2.4}, 1.0, 0, M.tileGold, {lift:0.45, fascia:0.15}); };
    roofAt(0, xs[2] - xs[1] + 2.6, 6.85); roofAt((xs[0] + xs[1]) / 2, xs[1] - xs[0] + 2, 5.45); roofAt((xs[2] + xs[3]) / 2, xs[3] - xs[2] + 2, 5.45);
    [-1, 1].forEach(sd => putPlaque(text, 0, 5.75, sd * 0.3, sd > 0 ? 0 : Math.PI, 2.8, 0.85, {}, G));
    if (sub) [-1, 1].forEach(sd => putPlaque(sub, xs[0] * 0.5 + xs[1] * 0.5, 4.5, sd * 0.28, sd > 0 ? 0 : Math.PI, 2.0, 0.5, {bg:'#7a1a14'}, G));
    return G;
  }
  /** 亭 köşk: n köşeli, kırmızı sütunlu, çokgen kavisli çatı; tabanı basılabilir. */
  function pavilion({x, z, y = 0, n = 6, r = 3.2, h = 3.2, roofMat = M.tile, base = 0.45, benches = true, openA = 0, lanterns = true}){
    const G = new THREE.Group(); G.position.set(x, y, z); root.add(G);
    add(new THREE.CylinderGeometry(r + 0.6, r + 0.8, base, n), M.stone, 0, base / 2, 0, G).rotation.y = Math.PI / n;
    const cg = colGeo(0.16, h);
    for (let i = 0; i < n; i++){
      const a = i / n * Math.PI * 2, cx = Math.sin(a) * r, cz = Math.cos(a) * r;
      add(cg, M.vermilion, cx, base + h / 2, cz, G);
      const o = C.circle(x + cx, z + cz, 0.22); if (y > 0.5){ o.y0 = y - 1; o.y1 = y + h + 2; }
      const a2 = (i + 0.5) / n * Math.PI * 2, mid = r * Math.cos(Math.PI / n);
      if (benches && Math.abs(Math.atan2(Math.sin(a2 - openA), Math.cos(a2 - openA))) > 0.5){
        const b = add(box(2 * r * Math.sin(Math.PI / n) - 0.4, 0.12, 0.4), M.wood, Math.sin(a2) * (mid - 0.2), base + 0.48, Math.cos(a2) * (mid - 0.2), G); b.rotation.y = a2;
        const rl = add(box(2 * r * Math.sin(Math.PI / n) - 0.3, 0.08, 0.08), M.vermilion, Math.sin(a2) * mid, base + 0.85, Math.cos(a2) * mid, G); rl.rotation.y = a2;
      }
      if (lanterns && i % 2 === 0) lantern(x + Math.sin(a) * (r + 0.4), y + base + h - 0.4, z + Math.cos(a) * (r + 0.4), 0.7, null);
    }
    add(new THREE.CylinderGeometry(r + 0.2, r + 0.2, 0.5, n, 1, true), M.bandD, 0, base + h, 0, G, false);
    putHip(G, {type:'poly', n, R:r + 1.4, rTop:0}, r * 0.75, base + h + 0.2, roofMat, {lift:0.7, rings:8, seg:6});
    add(lathe([[0, 0], [0.22, 0.05], [0.16, 0.4], [0.24, 0.6], [0.05, 1.1], [0, 1.2]]), M.gold, 0, base + h + 0.2 + r * 0.75 - 0.1, 0, G);
    heightFns.push((px, pz) => Math.hypot(px - x, pz - z) < r + 0.6 ? y + base : null);
    return G;
  }
  const lathe = (pts, seg = 14) => new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg);

  /* ================= siheyuan: dört yanı kapalı avlulu ev ================= */
  // Parsel içi: kuzeyde ana salon (正房, güneye bakar), doğu ve batıda yan salonlar (厢房, avluya bakar),
  // güney duvarı boyunca 倒座房. Kapı güney sırada GD köşede, kuzey sırada KB köşede; köşe hep boş bırakılır.
  function siheyuan(lot, {trees = []} = {}){
    const m = 0.3, t = 0.5, {x0, x1, z0, z1, gate} = lot;
    const ix0 = x0 + m + t, ix1 = x1 - m - t, iz0 = z0 + m + t, iz1 = z1 - m - t, IW = ix1 - ix0, ID = iz1 - iz0;
    const gw = 2.4, gx = lot.door.x, wallZ = gate === 'S' ? z1 - m - t / 2 : z0 + m + t / 2;
    // dış duvar: kapı boşluğu hariç
    const runs = [[x0 + m, z0 + m + t / 2, x1 - m, z0 + m + t / 2], [x0 + m, z1 - m - t / 2, x1 - m, z1 - m - t / 2]];
    const [north, south] = runs;
    const split = r => [[r[0], r[1], gx - gw / 2 - 0.8, r[3]], [gx + gw / 2 + 0.8, r[1], r[2], r[3]]];
    (gate === 'S' ? [north, ...split(south)] : [...split(north), south]).forEach(r => wall(...r));
    wall(x0 + m + t / 2, z0 + m + t, x0 + m + t / 2, z1 - m - t); wall(x1 - m - t / 2, z0 + m + t, x1 - m - t / 2, z1 - m - t);
    gateHouse({x:gx, z:wallZ, rot:gate === 'S' ? 0 : Math.PI, no:lot.no});
    // ana salon
    const md = Math.min(7.5, Math.max(5.5, ID * 0.3)), left = gate === 'N' ? 4.4 : 1.2;
    const mw = Math.min(15, IW - left - 1.2), mcx = ix0 + left + mw / 2;
    const main = house({x:mcx, z:iz0 + md / 2 + 0.2, w:mw, d:md, h:3.4});
    lot.mainFront = main.front;
    // yan salonlar
    // kuzey kapılı evde avluya KB köşeden girilir: yan salonla ana salon arasında daha geniş geçit
    const sl = Math.min(9, Math.max(5, ID * 0.34)), sd = 4.4, sz = iz0 + md + (gate === 'N' ? 2.8 : 1.6) + sl / 2;
    if (IW > 15){
      house({x:ix1 - sd / 2 - 0.2, z:sz, w:sl, d:sd, h:3.0, rot:-Math.PI / 2, cols:sl > 6});
      house({x:ix0 + sd / 2 + 0.2, z:sz, w:sl, d:sd, h:3.0, rot:Math.PI / 2, cols:sl > 6});
    }
    // 倒座房 güney duvarı boyunca, kuzeye bakar
    if (ID >= 19){
      const dw = gate === 'S' ? IW - 5.2 : IW - 2.4, dcx = gate === 'S' ? ix0 + 0.8 + dw / 2 : (ix0 + ix1) / 2;
      if (dw > 5) house({x:dcx, z:iz1 - 2.2, w:dw, d:3.8, h:2.8, rot:Math.PI, cols:false});
    }
    // avlu: tuğla döşeme, ağaç ve balık küpü
    const cz0 = iz0 + md + 0.6, cz1 = ID >= 19 ? iz1 - 4.4 : iz1 - 0.4;
    floor(IW - (IW > 15 ? sd * 2 + 0.6 : 0.4), cz1 - cz0, M.courtyard, (ix0 + ix1) / 2, 0.025, (cz0 + cz1) / 2, 0, 3);
    const cx = (ix0 + ix1) / 2, czc = (cz0 + cz1) / 2;
    if (rnd() < 0.8) trees.push([cx + (rnd() < 0.5 ? -1 : 1) * Math.min(3, IW * 0.12), czc + (rnd() - 0.5) * 2, rnd() < 0.5 ? 'hurma' : 'nar']);
    if (rnd() < 0.5){ add(lathe([[0, 0], [0.4, 0], [0.62, 0.45], [0.58, 0.8], [0.52, 0.82]], 16), M.bronze, cx + 1.4, 0, czc - 0.6); C.circle(cx + 1.4, czc - 0.6, 0.65); }
    return lot;
  }

  /* ================= tulou: Hakka halkasal toprak kalesi ================= */
  function tulou({x, z, R = 22, H = 11.5, floors = 4, gateA = Math.PI / 2, name = '承启楼'}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = gateA; root.add(G);   // yerel +z = kapı yönü
    const T = 1.6, rIn = R - T, rRoom = rIn - 4.2, rGal = rRoom - 1.5, gap = 3.6 / R;   // kapı açısı (radyan)
    const seg = 64, a0 = gap / 2, span = Math.PI * 2 - gap;
    const shell = (r, side, y0, h, ts = a0, tl = span) => { const g = new THREE.CylinderGeometry(r, r * (side === 'out' ? 1.015 : 1), h, seg, 1, true, ts, tl); scaleUV(g, r * tl / 2, h / 2); const mm = add(g, side === 'out' ? M.earth : M.earthIn, 0, y0 + h / 2, 0, G); return mm; };
    shell(R, 'out', 0, H); shell(rIn, 'in', 0, H);
    // kapının üstü: lento ve duvar
    shell(R, 'out', 3.6, H - 3.6, -a0, gap); shell(rIn, 'in', 3.6, H - 3.6, -a0, gap);
    const top = new THREE.RingGeometry(rIn, R, seg, 1); top.rotateX(-Math.PI / 2); add(top, M.earth, 0, H, 0, G, false);
    // granit kapı çerçevesi ve kanatlar
    [-1, 1].forEach(sd => add(box(0.5, 3.8, T + 0.2), M.stone, sd * 1.95, 1.9, R - T / 2, G));
    add(box(4.4, 0.5, T + 0.2), M.stone, 0, 3.85, R - T / 2, G);
    const rAt = y => R * (1 + 0.015 * (1 - y / H)) + 0.06;     // duvar hafif içe eğik: yüzeyin o yükseklikteki yarıçapı
    putPlaque(name, 0, 4.9, rAt(4.9) + 0.05, 0, 3.6, 0.9, {bg:'#2a2016', fg:'#e8c15a'}, G);
    // küçük pencereler: yalnız üst katlarda (savunma)
    for (let f = 2; f < floors; f++) for (let i = 0; i < 28; i++){
      const a = a0 + 0.12 + i / 28 * (span - 0.24), y = 1 + f * (H / floors);
      const w = add(new THREE.PlaneGeometry(0.5, 0.75), M.woodDark, Math.sin(a) * rAt(y), y, Math.cos(a) * rAt(y), G, false); w.rotation.y = a;
    }
    // halka çatı: içe ve dışa taşan saçaklar
    const prof = [[rGal - 0.6, H - 1.2], [rRoom + 0.4, H - 0.2], [(rRoom + R) / 2, H + 2.4], [R + 1.7, H - 0.6]];
    const rg = lathe(prof.map(([r, y]) => [r, y]), seg); scaleUV(rg, 2 * Math.PI * R / 1.6, 6); add(rg, M.tile, 0, 0, 0, G);
    // iç cephe: ahşap oda duvarı, galeriler, korkuluk ve direkler
    const wallIn = new THREE.CylinderGeometry(rRoom, rRoom, H - 0.6, seg, 1, true); scaleUV(wallIn, Math.round(2 * Math.PI * rRoom / 1.4), floors);
    add(wallIn, M.paperIn, 0, (H - 0.6) / 2, 0, G, false);
    for (let f = 1; f < floors; f++){
      const y = f * (H / floors);
      const slab = new THREE.RingGeometry(rGal, rRoom, seg, 1); slab.rotateX(-Math.PI / 2); add(slab, M.wood, 0, y, 0, G, false);
      const slabU = new THREE.RingGeometry(rGal, rRoom, seg, 1); slabU.rotateX(Math.PI / 2); add(slabU, M.woodDark, 0, y - 0.05, 0, G, false);
      add(new THREE.CylinderGeometry(rGal + 0.05, rGal + 0.05, 0.9, seg, 1, true), M.lacquerD, 0, y + 0.45, 0, G, false);
      for (let i = 0; i < 16; i++){ const a = (i + 0.5) / 16 * Math.PI * 2; lantern(x + Math.sin(a + gateA) * (rGal - 0.3), y - 0.5, z + Math.cos(a + gateA) * (rGal - 0.3), 0.6, f === 1 ? 0 : null); }
    }
    for (let i = 0; i < 32; i++){ const a = (i + 0.5) / 32 * Math.PI * 2; add(colGeo(0.13, H - 0.6), M.woodDark, Math.sin(a) * rGal, (H - 0.6) / 2, Math.cos(a) * rGal, G); C.circle(x + Math.sin(a + gateA) * rGal, z + Math.cos(a + gateA) * rGal, 0.2); }
    // avlu ve ortadaki ata salonu (祖堂)
    kit.disc(rRoom, M.paving, x, 0.02, z, root, 48);
    const hall = new THREE.Group(); hall.position.set(x, 0, z); hall.rotation.y = gateA; root.add(hall);
    add(box(8, 0.5, 6), M.stone, 0, 0.25, 0, hall); add(box(7, 3.2, 5), M.vermilion, 0, 2.1, 0, hall);
    add(new THREE.PlaneGeometry(5.6, 2.8), M.paper, 0, 2.0, 2.53, hall, false);
    putHip(hall, {type:'rect', W:9.6, D:7.4}, 2.4, 3.7, M.tile, {lift:0.6});
    C.box(x, z, 4.2, 3.2, gateA);
    // halka çarpışması: kapı boşluğu hariç, rRoom ile R arası dolu
    const N = 44;
    for (let i = 0; i < N; i++){
      const a = (i + 0.5) / N * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gap / 2 + 0.03) continue;
      const rm = (rRoom + R) / 2, wa = a + gateA;
      C.box(x + Math.sin(wa) * rm, z + Math.cos(wa) * rm, Math.PI * R / N + 0.3, (R - rRoom) / 2, wa);
    }
    // kapı geçidinin yan duvarları
    [-1, 1].forEach(sd => { const [cx, cz] = kit.toWorld(G, sd * 2.0, (rRoom + R) / 2); C.box(cx, cz, 0.3, (R - rRoom) / 2, gateA); });
    return {gate:kit.toWorld(G, 0, R + 3), hall:kit.toWorld(G, 0, 4.6), rGal};
  }

  /* ================= Tiān Tán: Gök Tapınağı (祈年殿) ================= */
  // Üç katlı yuvarlak mermer teras, üç saçaklı lacivert çatı. Dış duvar kuzeyde yarım daire, güneyde kare: 天圆地方
  // (gök yuvarlak, yer kare). Terasa güneydeki merdivenle çıkılır.
  function tiantan({x, z, wallR = 48}){
    const tiers = [27, 22, 17], step = 1.5, stairW = 2.8, run = 4.2;
    tiers.forEach((r, i) => {
      const y0 = i * step;
      add(new THREE.CylinderGeometry(r, r + 0.3, step, 64), M.marble, x, y0 + step / 2, z);
      // korkuluk: direkler ve tırabzan halkası (merdiven boşluğu hariç)
      const posts = Math.round(r * 2.4);
      for (let k = 0; k < posts; k++){
        const a = k / posts * Math.PI * 2; if (Math.abs(Math.sin(a)) * r < stairW + 0.4 && Math.cos(a) > 0) continue;
        add(box(0.22, 0.95, 0.22), M.marble, x + Math.sin(a) * (r - 0.3), y0 + step + 0.47, z + Math.cos(a) * (r - 0.3));
      }
      const rail = new THREE.TorusGeometry(r - 0.3, 0.07, 4, 96, Math.PI * 2 - 2 * Math.asin((stairW + 0.4) / r)); rail.rotateX(Math.PI / 2); rail.rotateY(-(Math.PI / 2 + Math.asin((stairW + 0.4) / r)));
      add(rail, M.marble, x, y0 + step + 0.9, z, root, false);
      // merdiven: terasın güney kenarından dışarı
      const n = 5;
      for (let k = 0; k < n; k++) add(box(stairW * 2, step / n * (k + 1), run / n), M.marble, x, y0 + step / n * (k + 1) / 2, z + r + run - (k + 0.5) * run / n);
      add(box(stairW * 2 - 1.2, 0.05, run * 1.05), M.dragonWay, x, y0 + step / 2 + 0.03, z + r + run / 2, root, false).rotation.x = Math.atan2(step, run);
    });
    heightFns.push((px, pz) => {
      const dx = px - x, dz = pz - z, r = Math.hypot(dx, dz); if (r > tiers[0] + run + 1) return null;
      let h = 0;
      tiers.forEach((R, i) => {
        if (r < R) h = Math.max(h, (i + 1) * step);
        else if (Math.abs(dx) < stairW && dz > 0 && dz < R + run && r >= R) h = Math.max(h, i * step + Math.ceil(Math.max(0, Math.min(1, (R + run - dz) / run)) * 5) * step / 5);
      });
      return h > 0 ? h : null;
    });
    // salon: 12 dış sütun (günün 12 saati), kafesli duvar, üç saçak
    const top = tiers.length * step, Rh = 10, hh = 5.2;
    const G = new THREE.Group(); G.position.set(x, top, z); root.add(G);
    add(new THREE.CylinderGeometry(Rh + 1.6, Rh + 1.8, 0.4, 48), M.marble, 0, 0.2, 0, G);
    for (let i = 0; i < 12; i++){ const a = (i + 0.5) / 12 * Math.PI * 2; add(colGeo(0.36, hh), M.vermilion, Math.sin(a) * (Rh + 0.9), 0.4 + hh / 2, Math.cos(a) * (Rh + 0.9), G); const c = C.circle(x + Math.sin(a) * (Rh + 0.9), z + Math.cos(a) * (Rh + 0.9), 0.42); c.y0 = top - 0.5; c.y1 = top + 20; }
    const hw = new THREE.CylinderGeometry(Rh, Rh, hh, 48, 1, true); scaleUV(hw, 40, 1.4);
    add(hw, M.paper, 0, 0.4 + hh / 2, 0, G, false);
    add(new THREE.CylinderGeometry(Rh - 0.1, Rh - 0.1, hh, 24), M.vermilion, 0, 0.4 + hh / 2, 0, G);
    const o = C.circle(x, z, Rh + 0.3); o.y0 = top - 0.5; o.y1 = top + 20;
    let y = 0.4 + hh;
    [[Rh + 3.2, Rh - 1.2, 2.6], [Rh + 0.6, Rh - 3.2, 2.4], [Rh - 1.8, 0, 4.4]].forEach(([R0, R1, H], i) => {
      add(new THREE.CylinderGeometry(R0 - 2.6, R0 - 2.6, 0.7, 48, 1, true), M.bandD, 0, y + 0.35, 0, G, false);
      putHip(G, {type:'poly', n:32, R:R0, rTop:R1}, H, y + 0.6, M.heaven, {lift:0.25, rings:i === 2 ? 10 : 5, seg:3, ridgeMat:M.heaven});
      y += H + (i < 2 ? 1.4 : 0);
      if (i < 2) add(new THREE.CylinderGeometry(R1 + 0.2, R1 + 0.2, 1.4, 48), M.vermilion, 0, y - 0.7 + 0.6, 0, G);
    });
    add(lathe([[0, 0], [0.7, 0.05], [0.5, 0.8], [0.9, 1.2], [0.3, 2.2], [0, 2.6]], 16), M.gold, 0, y + 0.3, 0, G);
    putPlaque('祈年殿', 0, 0.4 + hh + 0.9, Rh + 3.3, 0, 1.0, 3.0, {vertical:true}, G);
    // 天圆地方 dış duvar: kuzeyde yarım daire, güneyde kare köşeler; güney kapısında paifang
    const wh = 3.2, wseg = 28;
    for (let i = 0; i < wseg; i++){
      const a0 = Math.PI / 2 + i / wseg * Math.PI, a1 = Math.PI / 2 + (i + 1) / wseg * Math.PI;
      wall(x + Math.sin(a0) * wallR, z + Math.cos(a0) * wallR, x + Math.sin(a1) * wallR, z + Math.cos(a1) * wallR, {h:wh, m:M.vermilion, cap:M.heaven});
    }
    const sq = wallR;
    wall(x + sq, z, x + sq, z + sq, {h:wh, m:M.vermilion, cap:M.heaven}); wall(x - sq, z, x - sq, z + sq, {h:wh, m:M.vermilion, cap:M.heaven});
    wall(x - sq, z + sq, x - 7.5, z + sq, {h:wh, m:M.vermilion, cap:M.heaven}); wall(x + 7.5, z + sq, x + sq, z + sq, {h:wh, m:M.vermilion, cap:M.heaven});
    paifang({x, z:z + sq, W:13, text:'天坛'});
    // teras önünde bronz tütsü kazanları
    [-1, 1].forEach(sd => { add(lathe([[0, 0], [0.5, 0], [0.4, 0.3], [0.9, 0.9], [0.95, 1.4], [0.7, 1.5]], 18), M.bronze, x + sd * 6, 0, z + tiers[0] + run + 5); C.circle(x + sd * 6, z + tiers[0] + run + 5, 1.0); });
    return {top, altar:{x, z:z + Rh + 2.8}, gate:{x, z:z + sq + 3}};
  }

  /* ================= Wǔ Xíng Tǎ: Beş Element Pagodası ================= */
  // Sekizgen beş kat, alttan üste 相生 sırası: 木 → 火 → 土 → 金 → 水. Her katın kiremidi kendi elementinin renginde.
  function wuxingTa({x, z, elements}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = -Math.PI / 8; root.add(G);
    add(new THREE.CylinderGeometry(9, 9.6, 0.5, 8), M.marble, 0, 0.25, 0, G);
    let y = 0.5, r = 5.2;
    const glows = [];
    elements.forEach((el, i) => {
      const h = i === 0 ? 4.6 : 3.4, rn = r * 0.86;
      add(new THREE.CylinderGeometry(r, r, h, 8), i % 2 ? M.vermilion : M.plaster, 0, y + h / 2, 0, G);
      add(new THREE.CylinderGeometry(r + 0.15, r + 0.15, 0.4, 8), M.band, 0, y + h - 0.2, 0, G, false);
      // element kuşağı: bulmaca çözülünce kendi renginde yanar
      const gm = new THREE.MeshBasicMaterial({color:new THREE.Color(0x2a2420).convertSRGBToLinear(), toneMapped:false});
      const gl = add(new THREE.CylinderGeometry(r + 0.06, r + 0.06, 0.28, 8, 1, true), gm, 0, y + h * 0.42, 0, G, false); gl.userData.keep = true;
      glows.push({mat:gm, on:new THREE.Color(el.color).offsetHSL(0, 0.1, 0.12).convertSRGBToLinear()});
      putHip(G, {type:'poly', n:8, R:r + 1.8, rTop:i < elements.length - 1 ? rn - 0.2 : 0}, i < elements.length - 1 ? 1.2 : 3.4, y + h, tileMat(el.color), {lift:0.55, rings:i < elements.length - 1 ? 4 : 9, seg:4});
      const ap = r * Math.cos(Math.PI / 8);
      putPlaque(el.hanzi, Math.sin(Math.PI / 8) * (ap + 0.06), y + h * 0.62, Math.cos(Math.PI / 8) * (ap + 0.06), Math.PI / 8, 1.5, 1.5, {bg:'#1d1a16', fg:'#e8c15a'}, G);
      for (let k = 0; k < 8; k += 2){ const a = (k / 8) * Math.PI * 2; lantern(x + Math.sin(a - Math.PI / 8) * (r + 1.5), y + h + 0.1, z + Math.cos(a - Math.PI / 8) * (r + 1.5), 0.55, null); }
      y += h + 1.2; r = rn;
    });
    add(lathe([[0, 0], [0.35, 0], [0.2, 1], [0.4, 1.3], [0.12, 2.6], [0.25, 3], [0, 4.2]], 12), M.gold, 0, y + 2.0, 0, G);
    C.circle(x, z, 5.6);
    heightFns.push((px, pz) => Math.hypot(px - x, pz - z) < 9.2 ? 0.5 : null);
    return {glows, height:y};
  }

  /* ================= pazar tezgâhı ================= */
  // kırmızı ipek topları, asılı kumaşlar, mavi-beyaz porselen; tente kırmızı bez
  const silkColors = [0xc8102e, 0xa8261d, 0xe2a82a, 0x2f7a5c, 0x1f4a8a, 0xf2e3c0, 0x8a2a6a];
  const porcelainTex = tex(128, 128, (g) => {
    g.fillStyle = '#f4f6fa'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#1f3f8a'; g.lineWidth = 3;
    for (let y = 10; y < 128; y += 22){ g.beginPath(); for (let x = 0; x <= 128; x += 4) g.lineTo(x, y + Math.sin(x / 10) * 4); g.stroke(); }
    g.fillStyle = '#1f3f8a'; for (let i = 0; i < 6; i++){ g.beginPath(); g.arc(20 + i * 18, 64, 5, 0, Math.PI * 2); g.fill(); }
  });
  M.porcelain = mat(0xffffff, {map:porcelainTex, roughness:0.15, metalness:0.05});
  M.cloth = new Map();
  const clothMat = c => { if (!M.cloth.has(c)) M.cloth.set(c, mat(c, {roughness:0.75, side:THREE.DoubleSide})); return M.cloth.get(c); };
  const silk = i => silkColors[((Math.floor(i) % silkColors.length) + silkColors.length) % silkColors.length];   // negatif koordinatta da geçerli sıra
  function stall({x, z, rot = 0, kind = 'ipek'}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const w = 3.6, d = 2.4, h = 2.6;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(box(0.12, h + (sz < 0 ? 0.5 : 0), 0.12), M.woodDark, sx * w / 2, (h + (sz < 0 ? 0.5 : 0)) / 2, sz * d / 2, G));
    const can = add(new THREE.PlaneGeometry(w + 0.6, d + 0.8), clothMat(rnd() < 0.7 ? 0xb3261e : 0xe2a82a), 0, h + 0.25, 0, G); can.rotation.x = -Math.PI / 2 + 0.2;
    add(box(w - 0.2, 0.9, 0.8), M.wood, 0, 0.45, d / 2 - 0.4, G);
    if (kind === 'ipek'){
      for (let i = 0; i < 6; i++){ const r = add(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 10), clothMat(silk(i + x)), -1.4 + i * 0.56, 1.02, d / 2 - 0.4, G); r.rotation.x = Math.PI / 2; }
      for (let i = 0; i < 4; i++) add(new THREE.PlaneGeometry(0.55, 1.6), clothMat(silk(i * 3 + z)), -1.3 + i * 0.85, h - 0.8, -d / 2 + 0.1, G, false);
    } else if (kind === 'porselen'){
      for (let i = 0; i < 5; i++){ const k = 0.5 + rnd() * 0.4; add(lathe([[0, 0], [0.12, 0], [0.18, 0.12], [0.22, 0.4], [0.16, 0.62], [0.08, 0.72], [0.1, 0.8]], 14), M.porcelain, -1.4 + i * 0.7, 0.9, d / 2 - 0.4, G).scale.setScalar(k * 1.6); }
    } else {
      for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.22, 10, 8), mat(0xffffff, {roughness:0.6, emissive:0x000000}), -1.4 + i * 0.7, 1.02, d / 2 - 0.4, G).scale.y = 1.2;
      for (let i = 0; i < 3; i++) lanternAt(G, -1.2 + i * 1.2, h - 0.4, -0.2, 0.55, null);
    }
    lanternAt(G, w / 2 + 0.1, h - 0.2, d / 2 + 0.1, 0.6, 0);
    C.box(x, z, w / 2 + 0.1, d / 2 + 0.1, rot);
    return G;
  }

  return {M, P, box, scaleUV, floor, lathe, colGeo, plaque, putPlaque, gableRoof, hipRoof, putHip, horseHead,
    lantern, lanternAt, lanternLine, finishLanterns, wall, house, gateHouse, moonGate, paifang, pavilion, siheyuan, tulou, tiantan, wuxingTa, stall, tex, tileMat, clothMat};
}
