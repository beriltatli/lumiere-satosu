// İstanbul iç mekânları: Kapalıçarşı, Mısır Çarşısı, Topkapı Has Oda,
// Dolmabahçe Muayede Salonu, Haydarpaşa bekleme salonu ve seçilmiş dükkânlar.
// Odalar ilk girişte kurulur; bu dosya yalnızca tarifleri kaydeder.
export function buildInteriors(ctx, env){
  const T = ctx.THREE, K = ctx.kit;
  let seed = 9147;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const texCache = new Map(), matCache = new Map();

  /* ---------- dokular (hepsi kodla, en fazla 512 px) ---------- */
  function tex(key, w, h, draw, rx = 1, ry = 1){
    if (texCache.has(key)) return texCache.get(key);
    const [c, g] = K.canvas(w, h);
    try { draw(g, w, h); } catch (e){}
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 4;
    texCache.set(key, t);
    return t;
  }

  function tmat(key, opts = {}){
    if (matCache.has('m:' + key)) return matCache.get('m:' + key);
    const m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.8 }, opts));
    matCache.set('m:' + key, m);
    return m;
  }

  function carpetDraw(g, w, h){
    g.fillStyle = '#65101a'; g.fillRect(0, 0, w, h);
    const b = Math.max(7, Math.round(Math.min(w, h) * 0.035));
    g.strokeStyle = '#d8b45a'; g.lineWidth = b; g.strokeRect(b, b, w - b * 2, h - b * 2);
    g.strokeStyle = '#1b3a60'; g.lineWidth = Math.round(b * 0.55); g.strokeRect(b * 2.2, b * 2.2, w - b * 4.4, h - b * 4.4);
    g.fillStyle = '#17304f'; g.fillRect(b * 3, b * 3, w - b * 6, h - b * 6);
    // ortada madalyon
    g.fillStyle = '#8a1a24';
    g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.24, h * 0.3, 0, 0, 7); g.fill();
    g.strokeStyle = '#e2c274'; g.lineWidth = Math.max(2, b * 0.22);
    g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.19, h * 0.24, 0, 0, 7); g.stroke();
    g.fillStyle = '#d8b45a';
    g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.09, h * 0.12, 0, 0, 7); g.fill();
    g.fillStyle = '#65101a';
    g.beginPath(); g.ellipse(w / 2, h / 2, w * 0.04, h * 0.06, 0, 0, 7); g.fill();
    // bordürdeki baklava motifleri
    for (let x = b * 4; x < w - b * 3; x += b * 3.2){
      [b * 1.6, h - b * 1.6].forEach(y => {
        g.fillStyle = x % 2 ? '#d8b45a' : '#c25a50';
        g.beginPath(); g.moveTo(x, y - b * 0.55); g.lineTo(x + b * 0.7, y); g.lineTo(x, y + b * 0.55); g.lineTo(x - b * 0.7, y); g.fill();
      });
    }
    // küçük çiçekler
    for (let i = 0; i < 26; i++){
      const x = b * 4 + rnd() * (w - b * 8), y = b * 4 + rnd() * (h - b * 8);
      g.fillStyle = i % 2 ? '#e8d8a8' : '#8aa0b8'; g.fillRect(x, y, 4, 4);
    }
    for (let i = 0; i < 90; i++){ g.fillStyle = 'rgba(255,240,200,0.04)'; g.fillRect(rnd() * w, rnd() * h, 6, 2); }
  }

  function ciniDraw(g, w, h){
    g.fillStyle = '#f4f7f1'; g.fillRect(0, 0, w, h);
    const n = 8, s = w / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){
      const cx = (c + 0.5) * s, cy = (r + 0.5) * s;
      g.strokeStyle = '#9cb8c4'; g.lineWidth = 1;
      g.strokeRect(c * s, r * s, s, s);
      g.save(); g.translate(cx, cy);
      g.fillStyle = '#2d5a9e';
      for (let k = 0; k < 8; k++){
        g.rotate(Math.PI / 4);
        g.beginPath(); g.ellipse(0, -s * 0.22, s * 0.09, s * 0.18, 0, 0, 7); g.fill();
      }
      g.fillStyle = '#d86a3a';
      g.beginPath(); g.arc(0, 0, s * 0.1, 0, 7); g.fill();
      g.fillStyle = '#1e4478';
      g.beginPath(); g.arc(0, 0, s * 0.045, 0, 7); g.fill();
      // ince dallar
      g.strokeStyle = '#3f7a6a'; g.lineWidth = 1.5;
      for (let k = 0; k < 4; k++){
        const a = k * Math.PI / 2 + Math.PI / 4;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * s * 0.25, Math.sin(a) * s * 0.25, Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4); g.stroke();
      }
      g.restore();
    }
  }

  function stainedDraw(g, w, h){
    g.fillStyle = '#20222c'; g.fillRect(0, 0, w, h);
    const cols = ['#2a5a9a', '#b03a3a', '#d8a03a', '#3a8a5a', '#7a3a8a', '#d8d8c0', '#3a7a9a'];
    const n = 6, s = w / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){
      const cxo = c * s, cyo = r * s, k = (r + c) % 2;
      g.fillStyle = cols[(r * 3 + c * 2) % cols.length];
      g.beginPath();
      if (k) { g.moveTo(cxo + s / 2, cyo + 3); g.lineTo(cxo + s - 3, cyo + s / 2); g.lineTo(cxo + s / 2, cyo + s - 3); g.lineTo(cxo + 3, cyo + s / 2); }
      else { g.moveTo(cxo + 3, cyo + 3); g.lineTo(cxo + s - 3, cyo + 3); g.lineTo(cxo + s - 3, cyo + s - 3); g.lineTo(cxo + 3, cyo + s - 3); }
      g.closePath(); g.fill();
      g.strokeStyle = '#14161e'; g.lineWidth = 4; g.stroke();
      g.fillStyle = 'rgba(255,255,230,0.16)';
      g.beginPath(); g.arc(cxo + s * 0.35, cyo + s * 0.35, s * 0.1, 0, 7); g.fill();
    }
    g.strokeStyle = '#14161e'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
  }

  function boardDraw(g, w, h){
    g.fillStyle = '#16212a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8a24a'; g.fillRect(0, 0, w, 34);
    g.fillStyle = '#1a2630'; g.font = 'bold 19px Georgia'; g.textAlign = 'left';
    g.fillText('HAREKET', 18, 23); g.fillText('VARIŞ', 150, 23); g.fillText('TREN', 300, 23); g.fillText('DURUM', 420, 23);
    const rows = [
      ['08.15', 'ANKARA', '3. peron', 'HAZIR'],
      ['09.40', 'KONYA', '1. peron', 'HAZIR'],
      ['10.05', 'ESKİŞEHİR', '5. peron', 'GECİKME'],
      ['11.20', 'İZMİR', '2. peron', 'HAZIR'],
      ['12.10', 'BURSA', '4. peron', 'HAZIR'],
      ['13.35', 'EDİRNE', '6. peron', 'BEKLİYOR']
    ];
    g.font = '19px monospace';
    rows.forEach((r, i) => {
      const y = 60 + i * 31;
      if (i % 2) { g.fillStyle = 'rgba(255,255,255,0.035)'; g.fillRect(8, y - 20, w - 16, 28); }
      g.fillStyle = i === 2 ? '#e8b45a' : '#e8e2c8';
      g.fillText(r[0], 18, y); g.fillText(r[1], 150, y); g.fillText(r[2], 300, y); g.fillText(r[3], 420, y);
    });
    g.fillStyle = '#c8a24a'; g.fillRect(8, h - 8, w - 16, 3);
  }

  function clockDraw(g, w, h){
    g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.43;
    g.fillStyle = '#f2ead4'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 7; g.stroke();
    g.strokeStyle = '#3a2e20'; g.lineWidth = 3;
    for (let i = 0; i < 60; i++){
      const a = i * Math.PI / 30, r1 = i % 5 === 0 ? r * 0.82 : r * 0.9;
      g.beginPath(); g.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1); g.lineTo(cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95); g.stroke();
    }
    g.fillStyle = '#2a2018'; g.font = 'bold ' + Math.round(w * 0.1) + 'px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++){
      const a = i * Math.PI / 6;
      g.fillText(String(i), cx + Math.sin(a) * r * 0.68, cy - Math.cos(a) * r * 0.68);
    }
    // saat 10:10
    g.strokeStyle = '#1a1410'; g.lineCap = 'round';
    g.lineWidth = 7; g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.sin(-Math.PI / 3) * r * 0.46, cy - Math.cos(-Math.PI / 3) * r * 0.46); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.sin(Math.PI / 3) * r * 0.64, cy - Math.cos(Math.PI / 3) * r * 0.64); g.stroke();
    g.fillStyle = '#8a1a1a'; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill();
    g.textBaseline = 'alphabetic';
  }

  function tavlaDraw(g, w, h){
    g.fillStyle = '#5a3a22'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e2d4b4'; g.fillRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#3a2416'; g.fillRect(w / 2 - 6, 10, 12, h - 20);
    const ph = (h - 20) / 2, pw = (w - 32) / 12;
    for (let side = 0; side < 2; side++) for (let i = 0; i < 12; i++){
      const x0 = 16 + i * pw, y0 = 10 + side * ph;
      g.fillStyle = (i + side) % 2 ? '#8a1a24' : '#1b3a60';
      g.beginPath();
      if (side === 0){ g.moveTo(x0, y0); g.lineTo(x0 + pw, y0); g.lineTo(x0 + pw / 2, y0 + ph * 0.7); }
      else { g.moveTo(x0, y0 + ph); g.lineTo(x0 + pw, y0 + ph); g.lineTo(x0 + pw / 2, y0 + ph * 0.3); }
      g.closePath(); g.fill();
    }
    [[-1, 0], [1, 0]].forEach(([sd]) => {
      for (let i = 0; i < 5; i++){
        g.fillStyle = i % 2 ? '#f2ead8' : '#2a1a12';
        g.beginPath(); g.arc(w / 2 + sd * 22, h / 2 - 26 + i * 12, 5, 0, 7); g.fill();
      }
    });
  }

  function panelMat(key, title, lines, o = {}){
    if (matCache.has('p:' + key)) return matCache.get('p:' + key);
    const w = o.w || 512, h = o.h || 256;
    const t = tex('p:' + key, w, h, (g) => {
      g.fillStyle = o.bg || '#f2e6cc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = o.border || '#7a5a32'; g.lineWidth = o.bw || 10;
      g.strokeRect(7, 7, w - 14, h - 14);
      g.textAlign = 'center'; g.fillStyle = o.fg || '#2a1e14';
      g.font = 'bold ' + (o.ts || 44) + 'px Georgia';
      g.fillText(title, w / 2, h * (o.ty || 0.38));
      g.font = (o.fs || 24) + 'px Georgia';
      (lines || []).forEach((ln, i) => g.fillText(ln, w / 2, h * (o.ly || 0.58) + i * (o.lh || 32)));
    });
    const m = new T.MeshStandardMaterial({ map: t, roughness: o.rough || 0.85 });
    matCache.set('p:' + key, m);
    return m;
  }

  function signMat(text){
    return panelMat('sign:' + text, text, [], { w:512, h:128, bg:'#3a2414', fg:'#e8c874', border:'#c8a24a', ts:58, ty:0.67, bw:8 });
  }

  function plane(R, m, x, y, z, ry, w, h){
    const o = R.add(new T.PlaneGeometry(w, h), m, x, y, z, false);
    o.rotation.y = ry;
    return o;
  }

  function boardMat(){ return tmat('board', { map:tex('board', 512, 256, boardDraw), roughness:0.55 }); }
  function clockMat(){ return tmat('clock', { map:tex('clock', 256, 256, clockDraw), roughness:0.6 }); }
  function stainedMat(){ return tmat('stained', { map:tex('stained', 256, 256, stainedDraw), roughness:0.35, emissive:0x223344, emissiveIntensity:0.18 }); }
  function tavlaMat(){ return tmat('tavla', { map:tex('tavla', 256, 256, tavlaDraw), roughness:0.75 }); }
  function carpetMat(){ return tmat('carpet', { map:tex('carpet', 512, 384, carpetDraw), roughness:0.95 }); }
  function ciniMat(rx = 1, ry = 1){ return tmat('cini:' + rx + ':' + ry, { map:tex('cini', 256, 256, ciniDraw, rx, ry), roughness:0.28 }); }

  /* ---------- döşeme yardımcıları ---------- */
  function divan(R, x, z, len, ry = 0){
    const body = R.mat(0x4e2c18, { roughness:0.82 }), velvet = R.mat(0x7c1c26, { roughness:0.95 });
    const gold = R.mat(0xc8a24a, { metalness:0.55, roughness:0.4 });
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; R.G.add(g);
    R.box(len, 0.42, 1.2, body, 0, 0.21, 0, 0, g);
    R.box(len - 0.16, 0.2, 1.1, velvet, 0, 0.52, 0, 0, g);
    R.box(len, 0.78, 0.16, body, 0, 0.82, -0.55, 0, g);
    R.box(len + 0.04, 0.07, 0.18, gold, 0, 1.22, -0.55, 0, g);
    const n = Math.max(2, Math.floor(len / 1.25));
    for (let i = 0; i < n; i++){
      const u = -len / 2 + (i + 0.5) * len / n;
      const cu = R.box(0.52, 0.34, 0.18, velvet, u, 0.72, -0.38, 0, g);
      cu.rotation.x = -0.16;
      R.box(0.5, 0.025, 0.02, gold, u, 0.9, -0.29, 0, g);
    }
    [-1, 1].forEach(sd => {
      const bo = R.add(new T.SphereGeometry(0.19, 10, 8), velvet, sd * (len / 2 - 0.18), 0.68, -0.34, true, g);
      bo.scale.set(1, 0.72, 1.5);
    });
    R.collide(x, z, len / 2, 0.68, ry);
    return g;
  }

  function cushion(R, x, y, z, color, ry = 0, s = 1){
    const m = R.mat(color, { roughness:0.95 });
    const o = R.add(new T.SphereGeometry(0.26 * s, 12, 8), m, x, y, z, true);
    o.scale.set(1.25, 0.48, 0.92);
    o.rotation.y = ry;
    R.box(0.03 * s, 0.03 * s, 0.03 * s, R.mat(0xc8a24a, { metalness:0.5, roughness:0.45 }), x, y + 0.02, z + 0.24 * s);
    return o;
  }

  function grandChandelier(R, x, z){
    const gold = R.mat(0xc8a24a, { metalness:0.65, roughness:0.32 });
    const glass = R.mat(0xf4ead0, { roughness:0.25, transparent:true, opacity:0.55 });
    const y0 = R.room.h - 1.9;
    R.cyl(0.07, 0.09, 2.3, gold, x, y0 + 1.2, z, 8);
    R.add(new T.SphereGeometry(0.42, 14, 10), gold, x, y0 + 0.18, z);
    [0.95, 1.7, 2.45].forEach((rad, tier) => {
      const y = y0 - tier * 0.62;
      const ring = R.add(new T.TorusGeometry(rad, 0.045, 6, 28), gold, x, y, z);
      ring.rotation.x = Math.PI / 2;
      const n = 8 + tier * 4;
      for (let i = 0; i < n; i++){
        const a = i * Math.PI * 2 / n;
        const px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad;
        R.cyl(0.018, 0.022, 0.22, gold, px, y + 0.12, pz, 6);
        R.cyl(0.035, 0.035, 0.16, glass, px, y + 0.3, pz, 8);
        R.add(new T.SphereGeometry(0.038, 6, 4), R.glowMat, px, y + 0.41, pz, false);
        const drop = R.add(new T.OctahedronGeometry(0.055, 0), glass, px, y - 0.16, pz, false);
        drop.scale.y = 1.7;
      }
    });
    R.light(x, y0, z, 0xffdfae, 8, 18);
  }

  function displayCase(R, x, z, w, ry, colors){
    const wood = R.mat(0x5a3a22, { roughness:0.8 }), gold = R.mat(0xc8a24a, { metalness:0.5, roughness:0.45 });
    const glass = R.mat(0xcfe0ea, { roughness:0.05, metalness:0.15, transparent:true, opacity:0.22 });
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; R.G.add(g);
    R.box(w, 0.86, 0.95, wood, 0, 0.43, 0, 0, g);
    R.box(w + 0.06, 0.06, 1.0, gold, 0, 0.89, 0, 0, g);
    const gl = R.box(w - 0.08, 0.52, 0.86, glass, 0, 1.18, 0, 0, g); gl.castShadow = false;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => R.box(0.035, 0.54, 0.035, gold, a * (w / 2 - 0.05), 1.18, b * 0.41, 0, g));
    const n = Math.max(3, Math.floor(w / 0.34));
    for (let i = 0; i < n; i++){
      const px = -w / 2 + 0.2 + i * (w - 0.4) / Math.max(1, n - 1);
      R.box(0.26, 0.04, 0.42, R.mat(0xe8e0cc, { roughness:0.7 }), px, 0.95, 0, 0, g);
      const c = colors[i % colors.length];
      const bit = R.add(new T.BoxGeometry(0.12, 0.09, 0.12), R.mat(c, { roughness:0.55 }), px, 1.015, 0.02, true, g);
      bit.rotation.y = i * 0.7;
    }
    R.collide(x, z, w / 2 + 0.05, 0.5, ry);
    return g;
  }

  function barberChair(R, x, z, ry){
    const leather = R.mat(0x3a1a18, { roughness:0.7 }), chrome = R.mat(0x9aa4aa, { metalness:0.8, roughness:0.25 });
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; R.G.add(g);
    R.cyl(0.36, 0.42, 0.06, chrome, 0, 0.03, 0, 16, g);
    R.cyl(0.09, 0.12, 0.62, chrome, 0, 0.35, 0, 10, g);
    R.box(0.66, 0.14, 0.62, leather, 0, 0.72, 0, 0, g);
    const back = R.box(0.64, 0.9, 0.14, leather, 0, 1.14, -0.31, 0, g); back.rotation.x = -0.12;
    [-1, 1].forEach(sd => R.box(0.08, 0.09, 0.54, chrome, sd * 0.38, 0.86, 0.02, 0, g));
    R.box(0.6, 0.1, 0.1, chrome, 0, 0.36, 0.38, 0, g);
    R.collideC(x, z, 0.56);
    return g;
  }

  function bakeryOven(R, x, z){
    const stone = R.mat(0xb8a88e, { roughness:0.9 }), fire = R.mat(0x2a1208, { roughness:1 });
    const g = new T.Group(); g.position.set(x, 0, z); R.G.add(g);
    R.box(3.4, 1.5, 2.2, stone, 0, 0.75, 0, 0, g);
    const dome = R.add(new T.SphereGeometry(1.65, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), stone, 0, 1.5, 0, true, g);
    dome.scale.set(1.03, 0.72, 0.72);
    R.box(1.25, 0.72, 0.14, fire, 0, 0.46, 1.08, 0, g);
    R.add(new T.ConeGeometry(0.4, 0.9, 8), R.mat(0xff8a3a, { emissive:0xff5a1a, emissiveIntensity:0.9 }), 0, 0.45, 1.14, false, g);
    R.cyl(0.24, 0.3, 1.5, stone, 0.9, 2.2, -0.5, 10, g);
    R.collide(x, z, 1.75, 1.15);
    return g;
  }

  function spiceSack(R, x, z, color, s = 1){
    const cloth = R.mat(0xc8b894, { roughness:1 });
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * Math.PI; R.G.add(g);
    R.cyl(0.42 * s, 0.36 * s, 0.55 * s, cloth, 0, 0.28 * s, 0, 12, g);
    const m = R.add(new T.SphereGeometry(0.42 * s, 12, 8), R.mat(color, { roughness:1 }), 0, 0.56 * s, 0, true, g);
    m.scale.y = 0.42;
    R.collideC(x, z, 0.4 * s);
    return g;
  }

  function flowerBucket(R, x, z, color, n = 7){
    const g = new T.Group(); g.position.set(x, 0, z); R.G.add(g);
    R.cyl(0.24, 0.2, 0.42, R.mat(0x6a7a7a, { metalness:0.5, roughness:0.5 }), 0, 0.21, 0, 12, g);
    for (let i = 0; i < n; i++){
      const a = i * Math.PI * 2 / n, r = 0.1 + (i % 3) * 0.045;
      const px = Math.cos(a) * r, pz = Math.sin(a) * r;
      R.cyl(0.008, 0.008, 0.5 + (i % 2) * 0.14, R.mat(0x3a6a32, { roughness:0.9 }), px, 0.62, pz, 4, g);
      const fl = R.add(new T.SphereGeometry(0.075, 8, 6), R.mat(color, { roughness:0.7 }), px, 0.9 + (i % 2) * 0.1, pz, true, g);
      fl.scale.y = 0.65;
    }
    R.collideC(x, z, 0.3);
    return g;
  }

  function suitcase(R, x, z, color, ry = 0){
    const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; R.G.add(g);
    R.box(0.78, 0.5, 0.42, R.mat(color, { roughness:0.72 }), 0, 0.25, 0, 0, g);
    R.box(0.8, 0.07, 0.44, R.mat(0x3a2a1a, { roughness:0.8 }), 0, 0.42, 0, 0, g);
    R.box(0.78, 0.05, 0.44, R.mat(0x3a2a1a, { roughness:0.8 }), 0, 0.12, 0, 0, g);
    R.collide(x, z, 0.42, 0.26, ry);
    return g;
  }

  function bookStack(R, x, y, z, n = 4){
    const cols = [0x6a1a1a, 0x1a3a6a, 0x2a5a2a, 0x8a6a2a, 0x4a1a4a];
    for (let i = 0; i < n; i++){
      const b = R.box(0.42 - i * 0.02, 0.05, 0.3, R.mat(cols[i % cols.length], { roughness:0.78 }), x, y + i * 0.055, z, (i % 2) * 0.12);
    }
  }

  // Kapı noktası: simge yapının önüne, kara üzerine.
  const lmDoor = (p, dist) => p ? { x:p[0] + Math.sin(p[2]) * dist, z:p[1] + Math.cos(p[2]) * dist, ry:p[2] } : null;
  const LM = env.LM || {};
  const doors = {};
  doors.topkapi = lmDoor(LM.topkapi, 5.5 * ((LM.topkapi && LM.topkapi[3]) || 0.42) + 3);
  doors.dolmabahce = lmDoor(LM.dolmabahce, 48 * ((LM.dolmabahce && LM.dolmabahce[3]) || 0.25) + 3);
  doors.haydarpasa = lmDoor(LM.haydarpasa, 18 * ((LM.haydarpasa && LM.haydarpasa[3]) || 0.3) + 3);
  doors.kapalicarsi = env.doors && env.doors.kapalicarsi;
  doors.misircarsisi = env.doors && env.doors.misircarsisi;

  function addRoom(spec, decorate){
    const dr = spec.door;
    if (!dr || !env.landG(dr.x, dr.z)) return;
    try {
      const room = Object.assign({}, spec, {
        decor(R){
          try { decorate(R, R.room); } catch (e){}
        }
      });
      ctx.room(room);
    } catch (e){}
  }

  function spiceMound(R, x, y, z, color, s = 1){
    const o = R.add(new T.SphereGeometry(0.3 * s, 10, 6), R.mat(color, { roughness:1 }), x, y, z, true);
    o.scale.set(1, 0.55, 1);
    return o;
  }

  function brassPot(R, x, y, z, s = 1){
    R.add(new T.SphereGeometry(0.3 * s, 12, 8), R.mat(0xb08a3a, { metalness:0.6, roughness:0.38 }), x, y + 0.22 * s, z, true).scale.set(1, 0.75, 1);
    R.cyl(0.16 * s, 0.2 * s, 0.08 * s, R.mat(0x8a6a2a, { metalness:0.5, roughness:0.45 }), x, y + 0.46 * s, z, 12);
    R.box(0.04 * s, 0.12 * s, 0.26 * s, R.mat(0x8a6a2a, { metalness:0.5, roughness:0.45 }), x, y + 0.58 * s, z);
  }

  /* ================= Kapalıçarşı ================= */
  addRoom({
    id:'kapalicarsi', name:'Kapalıçarşı',
    door:doors.kapalicarsi,
    w:30, d:18, h:6, floor:'mozaik', walls:'tas', ceiling:'tonoz',
    windows:false, lamp:'fener', lights:3, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.82 }), dark = R.mat(0x3a2416, { roughness:0.85 });
    const cloth = [0x8a1a24, 0x1b3a60, 0xc8a24a, 0x2a6a4a, 0x7a3a6a, 0xe0d0b0];
    R.rug(0, 0.4, 13.6, 3.3, { ry:Math.PI / 2, c1:'#6e101a', c2:'#d8b45a', c3:'#17304f' });

    // iki sıra dükkân; tezgâhlar koridora bakar
    const zs = [-6.4, -3.2, 0, 3.2, 6.4];
    [-1, 1].forEach(sd => {
      zs.forEach((z, i) => {
        const x = sd * 12.55;
        R.stall(x, z, sd * Math.PI / 2, { w:2.9, d:3.5 });
        R.bolts(x + sd * 0.35, 1.05, z - 0.65, sd * Math.PI / 2, cloth.map(c => c).slice(0, 5));
        R.bolts(x + sd * 0.35, 1.05, z + 0.75, sd * Math.PI / 2, [cloth[(i + 2) % 6], cloth[(i + 4) % 6], 0xe0d0b0, 0x8a1a24]);
        R.cyl(0.24, 0.2, 0.32, R.mat(0x9a7a4a, { roughness:0.8 }), x - sd * 0.9, 0.16, z + 1.0, 12);
        spiceMound(R, x - sd * 0.9, 0.42, z + 1.0, cloth[(i + 3) % 6], 0.55);
        R.crate(x + sd * 0.9, z - 1.25, 0.6, sd * 0.3);
      });
    });

    // duvarlarda halılar ve çini kuşak
    const cm = carpetMat();
    [-14.84, 14.84].forEach((x, si) => {
      [-4.8, 0.4, 5.4].forEach(z => {
        plane(R, cm, x, 3.15, z, si ? -Math.PI / 2 : Math.PI / 2, 2.9, 3.7);
        const gold = R.mat(0xc8a24a, { metalness:0.4, roughness:0.55 });
        R.box(0.05, 0.08, 3.02, gold, x + (si ? -0.02 : 0.02), 1.29, z);
        R.box(0.05, 0.08, 3.02, gold, x + (si ? -0.02 : 0.02), 5.01, z);
        R.box(0.05, 3.78, 0.08, gold, x + (si ? -0.02 : 0.02), 3.15, z - 1.47);
        R.box(0.05, 3.78, 0.08, gold, x + (si ? -0.02 : 0.02), 3.15, z + 1.47);
      });
    });
    plane(R, cm, 0, 3.4, -8.84, 0, 4.6, 3.6);
    plane(R, ciniMat(2, 1), 0, 5.2, -8.83, 0, 8.0, 0.9);
    R.box(8.2, 0.08, 0.06, R.mat(0xc8a24a, { metalness:0.5, roughness:0.45 }), 0, 4.72, -8.82);
    R.box(8.2, 0.08, 0.06, R.mat(0xc8a24a, { metalness:0.5, roughness:0.45 }), 0, 5.68, -8.82);
    // giriş kitabesi
    plane(R, panelMat('kc-sign', 'KAPALIÇARŞI', ['El emeği, göz nuru'], { bg:'#3a2414', fg:'#e8c874', border:'#c8a24a', ts:46, fs:26, ty:0.4, ly:0.72 }), 0, 4.7, 8.84, Math.PI, 5.4, 1.5);

    // asılı fenerler (ışık sayısını artırmamak için sadece görsel)
    [-8, -2.5, 3, 8].forEach(z => {
      R.lantern(-7.4, z, { light:false, s:1.25 });
      R.lantern(7.4, z, { light:false, s:1.25 });
    });
    R.lantern(0, -7.6, { light:false, s:1.5 });

    // çay ocağı ve camekânlı vitrin
    R.table(3.4, 3.9, { round:true, w:1.15, top:wood });
    R.cyl(0.16, 0.18, 0.42, dark, 2.6, 0.21, 3.9, 8);
    R.cyl(0.16, 0.18, 0.42, dark, 4.2, 0.21, 3.9, 8);
    R.collideC(2.6, 3.9, 0.2); R.collideC(4.2, 3.9, 0.2);
    R.cyl(0.05, 0.06, 0.2, R.mat(0xc8a24a, { metalness:0.5, roughness:0.4 }), 3.15, 0.95, 3.9, 8);
    R.cyl(0.04, 0.05, 0.16, R.mat(0xc8a24a, { metalness:0.5, roughness:0.4 }), 3.6, 0.95, 3.9, 8);
    R.vitrine(6.4, -7.2, 0, [0x2f7bff, 0x22e08a, 0xff2a4a, 0xd8b45a]);

    // halı yığınları
    for (let i = 0; i < 3; i++){
      const b = R.box(1.7 - i * 0.14, 0.16, 1.1, R.mat(cloth[i], { roughness:0.95 }), -5.6, 0.08 + i * 0.16, -7.6, 0.1);
      R.box(1.5, 0.02, 0.9, R.mat(0xd8b45a, { roughness:0.9 }), -5.6, 0.17 + i * 0.16, -7.6, 0.1);
    }
    R.collide(-5.6, -7.6, 0.9, 0.65);

    R.npc(-9.3, 2.2, Math.PI / 2, 'Halıcı Mustafa', [
      'Hoş geldin! Bu halıların her düğümü ayrı bir hikâye anlatır.',
      'Yünü Anadolu’dan gelir; boyası kök ve çivit dendir. Acele etme, dokusuna bak.',
      'İstersen bir çay söyleyeyim; alışverişten önce sohbet gelir.'
    ], { coat:0x5a2e1a, hat:false, apron:false });
    R.npc(8.9, -3.1, -Math.PI / 2, 'Çinici Nesrin', [
      'Bu çinilerin mavisi, Boğaz’ın sabah renginden alınmış gibi derler.',
      'Her tabağın kenarı elle çizilir; bu yüzden iki tabak tam olarak aynı değildir.',
      'Kırığı olanı gönül alır, sağlamı eve gider. Sen hangisini seversin?'
    ], { coat:0x2a4a6a, hat:false, apron:'#e8dcc4' });
    R.npc(2.4, 4.5, 0, 'Çaycı Hüseyin', [
      'Çay demlikte bekler, sohbetin tadı ona göre ayarlanır.',
      'Kubbelerin altında çay bardağının sesi her zaman aynıdır: ince, sıcak, keyifli.',
      'Bir bardak daha? Buradan çıkmadan içmek âdettendir.'
    ], { coat:0x3a4a3a, hat:false, apron:'#f2ead8' });
    R.npc(9.2, 5.6, -Math.PI / 2, 'Kuyumcu Tarık', [
      'Altını tartarken terazi kadar söz de hassas olmalı.',
      'Bu vitrindeki taşların hepsi atölyemizde elden geçti. Gözünü kamaştırmasın, işçiliğe bak.',
      'Küçük bir hatıra arıyorsan sana ince bir bilezik gösterebilirim.'
    ], { coat:0x2a2a3a, hat:false, apron:false });
    R.npc(-4.1, -5.2, 0, 'Gezgin Elif', [
      'Bu çarşıyı ilk kez görüyorum; her köşede yeni bir koku var.',
      'Az önce bir halıcı bana desenlerin anlamını anlattı. Meğer her motifin bir cümlesi varmış.',
      'Haritamda beş durak daha var ama buradan gitmek hiç kolay değil.'
    ], { coat:0x4a6a5a, hat:false, apron:false });

    R.note(-4.0, 8.0, 'Kitabeye bak', 'Çarşı kitabesi', [
      'Çarşıya giren, bir çay içmeden çıkmaz.',
      'Sabah kepenkler dua ile, akşam kepenkler teşekkürle kapanır.'
    ]);
    R.note(-9.2, -8.0, 'Esnaf defterine bak', 'Kapalıçarşı esnaf defteri', [
      'Bugün: iki halı satıldı, bir çay ocağı yeni demlik aldı.',
      'Yarın sabah çarşı ustaları toplantısı var. Herkes bir çırak yetiştirmeyi konuşacak.'
    ]);
  });

  /* ================= Mısır Çarşısı ================= */
  addRoom({
    id:'misircarsisi', name:'Mısır Çarşısı',
    door:doors.misircarsisi,
    w:26, d:14, h:6, floor:'mozaik', walls:'tas', ceiling:'tonoz',
    windows:false, lamp:'fener', lights:3, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.82 });
    R.rug(0, 0.4, 10.6, 2.8, { ry:Math.PI / 2, c1:'#7a1820', c2:'#d8b45a', c3:'#1b3a60' });
    plane(R, panelMat('mc-sign', 'MISIR ÇARŞISI', ['Baharatın ve tatlı sohbetin yeri'], { bg:'#3a2414', fg:'#e8c874', border:'#c8a24a', ts:44, fs:24, ty:0.4, ly:0.72 }), 0, 4.15, 6.84, Math.PI, 5.0, 1.35);

    // tezgâhlar
    const zs = [-4.4, -1.5, 1.4, 4.3];
    [-1, 1].forEach(sd => {
      zs.forEach((z, i) => {
        R.stall(sd * 10.75, z, sd * Math.PI / 2, { w:2.8, d:3.0 });
        spiceMound(R, sd * 9.7, 1.02, z - 0.7, [0xc86a2a, 0xd8b45a, 0x8a3a1a, 0x6a7a3a][i % 4], 0.8);
        spiceMound(R, sd * 9.7, 1.02, z + 0.7, [0x8a2a2a, 0xe0c060, 0x4a6a3a, 0xa04a2a][i % 4], 0.8);
        R.cyl(0.26, 0.22, 0.36, R.mat(0x9a7a4a, { roughness:0.85 }), sd * 11.7, 0.18, z + 1.3, 12);
      });
    });

    // kese kese baharat ve pirinç teraziler
    const sacks = [[-8.2, -5.6, 0xc86a2a], [-8.2, 2.6, 0xd8b45a], [8.2, -5.6, 0x8a3a1a], [8.2, 2.6, 0x6a7a3a], [-8.2, 5.4, 0xa04a2a], [8.2, 5.4, 0xe0c060]];
    sacks.forEach(([x, z, c]) => spiceSack(R, x, z, c, 0.95));

    // arka duvar rafları ve çini kuşağı
    [-6.5, 0, 6.5].forEach(x => R.shelf(x, 2.25, -6.84, 0, 3.3, 'jars'));
    [-6.5, 0, 6.5].forEach(x => R.shelf(x, 2.95, -6.84, 0, 3.3, 'pots'));
    plane(R, ciniMat(3, 1), 0, 5.25, -6.83, 0, 9.0, 0.9);
    R.box(9.2, 0.07, 0.06, R.mat(0xc8a24a, { metalness:0.45, roughness:0.5 }), 0, 4.78, -6.82);
    R.box(9.2, 0.07, 0.06, R.mat(0xc8a24a, { metalness:0.45, roughness:0.5 }), 0, 5.72, -6.82);

    // kuru biber ve sarımsak demetleri
    for (let i = 0; i < 4; i++){
      const x = -3.6 + i * 2.4;
      R.cyl(0.012, 0.012, 1.5, R.mat(0x6a4a2a, { roughness:0.9 }), x, 4.3, -6.4, 5);
      for (let k = 0; k < 7; k++){
        const o = R.add(new T.ConeGeometry(0.06, 0.2, 6), R.mat(0xa02a1a, { roughness:0.85 }), x + Math.sin(k) * 0.06, 3.65 - k * 0.14, -6.38, true);
        o.rotation.x = Math.PI;
      }
    }

    // asılı fenerler
    [-5.2, -0.2, 4.8].forEach(z => {
      R.lantern(-6.2, z, { light:false, s:1.1 });
      R.lantern(6.2, z, { light:false, s:1.1 });
    });

    // tezgâh önünde pirinç terazi ve tartı ağırlıkları
    R.table(0, -5.9, { w:1.8, d:0.8, top:wood });
    R.cyl(0.035, 0.035, 1.5, R.mat(0xc8a24a, { metalness:0.6, roughness:0.35 }), 0, 1.5, -5.9, 8);
    R.box(1.15, 0.05, 0.05, R.mat(0xc8a24a, { metalness:0.6, roughness:0.35 }), 0, 2.2, -5.9);
    [-0.5, 0.5].forEach(sd => {
      R.cyl(0.22, 0.2, 0.06, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), sd * 1.0, 1.1, -5.9, 14);
      R.cyl(0.012, 0.012, 0.6, R.mat(0x8a6a2a, { metalness:0.5, roughness:0.45 }), sd * 0.5, 1.9, -5.9, 5);
      R.box(0.12, 0.18, 0.12, R.mat(0x2a2a2a, { metalness:0.6, roughness:0.5 }), sd * 0.44, 1.0, -5.9);
    });
    brassPot(R, 4.2, 0.02, -6.1, 0.8);
    brassPot(R, 5.2, 0.02, -6.1, 0.65);

    R.npc(-7.2, 3.9, Math.PI / 2, 'Baharatçı Zeynep', [
      'Kimyonu avucuna al, kokla; tazeyse hemen belli olur.',
      'Tarçın tatlıya, karabiber çorbaya, nane çaya... Her birinin yeri ayrıdır.',
      'Ölçüyü terazi tutar, lezzeti usta bilir. Sen ne pişirmeyi düşünüyorsun?'
    ], { coat:0x6a2a2a, hat:false, apron:'#e8dcc4' });
    R.npc(8.6, -3.0, -Math.PI / 2, 'Aktar Rıza', [
      'Kurutulmuş çiçekler, kökler, yapraklar... Hepsi bu raflarda sabırla bekler.',
      'Bir çay demlerken bile ölçüyü kaçırmamak gerek; fazlası acı olur.',
      'İhtiyacını söyle, sana en sadesini seçeyim.'
    ], { coat:0x3a5a3a, hat:false, apron:'#d8ccb4' });
    R.npc(2.8, 5.8, Math.PI, 'Çaycı Kâmil', [
      'Çarşının ortasında çay kokusu her şeyin üstüne siner.',
      'Tezgâhlar açılırken ilk demlik, kapanırken son demlik benim işim.',
      'Bir bardak al, alışverişe ondan sonra devam et.'
    ], { coat:0x4a3a2a, hat:false, apron:'#f2ead8' });

    R.note(-7.4, -6.7, 'Teraziye bak', 'Pirinç terazi', [
      'Terazi her sabah kontrol edilir; tartıda bir gram şaşmaz.',
      'Esnafın sözü de terazi gibi denk olmalı, derler.'
    ]);
    R.note(8.4, 5.8, 'Esnaf defterine bak', 'Mısır Çarşısı defteri', [
      'Bugün gelenler: tarçın, karanfil, safran, kuru nane.',
      'Akşam kapanışta kepenkler birlikte indirilir; son çay ocakta kalır.'
    ]);
  });

  function throne(R, x, z, y = 0, ry = 0){
    const gold = R.mat(0xc8a24a, { metalness:0.65, roughness:0.32 });
    const velvet = R.mat(0x7a1420, { roughness:0.95 });
    const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; R.G.add(g);
    R.box(2.0, 0.18, 1.55, gold, 0, 0.09, 0, 0, g);
    R.box(1.55, 0.46, 1.12, velvet, 0, 0.42, 0.02, 0, g);
    R.box(1.9, 2.3, 0.22, gold, 0, 1.45, -0.56, 0, g);
    R.box(1.5, 1.95, 0.17, velvet, 0, 1.42, -0.43, 0, g);
    [-0.42, 0, 0.42].forEach((u, i) => {
      R.add(new T.SphereGeometry(0.055, 8, 6), gold, u, 1.75 - (i % 2) * 0.2, -0.32, true, g);
    });
    [-1, 1].forEach(sd => {
      R.box(0.16, 0.55, 1.1, gold, sd * 0.88, 0.56, 0.04, 0, g);
      R.box(0.22, 0.08, 1.2, gold, sd * 0.88, 0.86, 0.04, 0, g);
      R.box(0.18, 1.05, 0.18, gold, sd * 0.84, 0.52, 0.62, 0, g);
    });
    R.box(1.6, 0.18, 0.1, gold, 0, 0.12, 0.74, 0, g);
    R.collide(x, z, 1.02, 0.82, ry);
    return g;
  }

  /* ================= Topkapı Sarayı — Has Oda ================= */
  addRoom({
    id:'topkapi-hasoda', name:'Topkapı Has Oda',
    door:doors.topkapi,
    w:22, d:16, h:7, floor:'mermer', walls:'saray', ceiling:'boyali',
    wallColor:0x35605e, curtain:0x7a1a24, lamp:'avize', lights:2,
    doorStyle:'saray', skipWindow:(x, z) => z < -7.7 && Math.abs(x) < 5.5
  }, (R) => {
    const wood = R.mat(0x4e2c18, { roughness:0.82 }), gold = R.mat(0xc8a24a, { metalness:0.6, roughness:0.35 });
    R.rug(0, 1.2, 8.4, 7.4, { c1:'#6e101a', c2:'#d8b45a', c3:'#1e4a52' });

    // arka duvarda çini pano ve taht
    plane(R, ciniMat(3, 1), 0, 4.5, -7.83, 0, 7.2, 2.3);
    R.box(7.5, 0.1, 0.08, gold, 0, 3.32, -7.8);
    R.box(7.5, 0.1, 0.08, gold, 0, 5.68, -7.8);
    R.box(0.1, 2.4, 0.08, gold, -3.62, 4.5, -7.8);
    R.box(0.1, 2.4, 0.08, gold, 3.62, 4.5, -7.8);

    // taht platformu ve basamaklar
    R.box(5.4, 0.18, 3.0, R.mat(0xe0d8c8, { roughness:0.3 }), 0, 0.09, -6.4);
    R.box(4.4, 0.18, 2.3, R.mat(0xe8e0d0, { roughness:0.3 }), 0, 0.27, -6.7);
    R.box(3.4, 0.24, 1.8, R.mat(0xf0e8d8, { roughness:0.28 }), 0, 0.45, -7.0);
    R.box(3.6, 0.07, 1.9, gold, 0, 0.6, -7.0);
    throne(R, 0, -7.15, 0.64);
    R.collide(0, -6.9, 2.9, 1.7);

    // sedirler
    divan(R, -7.6, 0.4, 8.6, Math.PI / 2);
    divan(R, 7.6, 0.4, 8.6, -Math.PI / 2);
    cushion(R, -7.55, 0.72, -3.2, 0xc8a24a, Math.PI / 2, 0.95);
    cushion(R, -7.55, 0.72, 3.4, 0x2a6a6a, Math.PI / 2, 0.95);
    cushion(R, 7.55, 0.72, -2.6, 0x2a6a6a, -Math.PI / 2, 0.95);
    cushion(R, 7.55, 0.72, 3.0, 0xc8a24a, -Math.PI / 2, 0.95);

    // orta sehpa
    R.table(0, 1.6, { w:2.7, d:1.25, h:0.43, top:wood });
    R.candles(-0.8, 0.45, 1.6);
    R.cyl(0.05, 0.06, 0.1, R.mat(0xf0e8d8, { roughness:0.4 }), 0.55, 0.52, 1.45, 10);
    R.cyl(0.05, 0.06, 0.1, R.mat(0xf0e8d8, { roughness:0.4 }), 0.85, 0.52, 1.75, 10);
    bookStack(R, 0.35, 0.5, 1.9, 3);

    // ocak, kitaplık, saksılar
    R.fireplace(-10.55, 3.7, Math.PI / 2, { w:2.2, m:R.mat(0xd8d0c0, { roughness:0.35 }) });
    R.collide(-10.55, 3.7, 1.25, 0.45, Math.PI / 2);
    R.bookcase(10.55, 3.7, -Math.PI / 2, { w:2.2, h:3.4, d:0.4, m:wood });
    R.plant(-3.9, -6.7, { s:1.15 });
    R.plant(3.9, -6.7, { s:1.15 });
    R.plant(-9.6, -5.9, { s:1.0 });

    // duvar aplikleri ve raflar
    R.sconce(-10.86, 4.2, -5.0, Math.PI / 2);
    R.sconce(10.86, 4.2, 2.2, -Math.PI / 2);
    R.sconce(0, 4.2, 7.86, Math.PI);
    R.shelf(-7.5, 2.4, -7.8, 0, 2.2, 'pots');
    R.shelf(7.5, 2.4, -7.8, 0, 2.2, 'books');

    R.npc(6.2, 5.4, -Math.PI / 2, 'Has Oda Görevlisi Nihal', [
      'Has Oda, sultanın dinlenmek ve devlet işlerini düşünmek için çekildiği yerdir.',
      'Buradaki her çini elde boyanmış; mavisi derinleştikçe odanın havası da ağırlaşır.',
      'Lütfen tahtın bulunduğu platforma çıkmayın; hatırasına saygı gösterelim.'
    ], { coat:0x2a4a5a, hat:false, apron:false });
    R.npc(-6.4, -2.8, Math.PI / 2, 'Divan Kâtibi Selim', [
      'Divan defterine bakarsanız, bu odada alınan kararların izini görebilirsiniz.',
      'Yazıyı güzel yazmak yetmez; sözü de yerinde söylemek gerekir.',
      'Bu akşam yine bir heyet gelecek. Çay ve kahve hazırlığı şimdiden başladı.'
    ], { coat:0x4a3a2a, hat:false, apron:false });

    R.note(0.4, 1.6, 'Divan defterine bak', 'Divan defteri', [
      'Bugün görüşülenler: su yolları, çarşı esnafı, gemi seferleri.',
      'Not: Has Oda’da yapılan sohbet, dışarıda anlatılmaz.'
    ]);
    R.note(-2.9, -6.5, 'Çini panoya bak', 'Çini pano', [
      'Pano, Boğaz’ın sabah mavisiyle akşam kızıllığını aynı çerçevede buluşturur.',
      'Her kare ayrı pişirilmiş; bu yüzden desenler birbirinin tam eşi değil.'
    ]);
  });

  /* ================= Dolmabahçe — Muayede Salonu ================= */
  addRoom({
    id:'dolmabahce-muayede', name:'Dolmabahçe Muayede Salonu',
    door:doors.dolmabahce,
    w:30, d:22, h:10, floor:'parke', walls:'saray', ceiling:'boyali',
    wallColor:0xe6dcc4, curtain:0x7a1a24, lamp:'avize', lights:2,
    doorStyle:'saray', skipWindow:(x, z) => z < -10.7 && Math.abs(x) < 5.8
  }, (R) => {
    const gold = R.mat(0xc8a24a, { metalness:0.65, roughness:0.32 });
    const velvet = R.mat(0x7a1420, { roughness:0.95 });
    const wood = R.mat(0x5a3a22, { roughness:0.8 });
    R.rug(0, 1.0, 11.0, 13.0, { c1:'#6a101a', c2:'#e0be6a', c3:'#243a52' });

    // büyük avize
    grandChandelier(R, 0, 0.5);

    // taht platformu, kanopi ve taht
    R.box(10.2, 0.22, 5.0, R.mat(0xd8ccb4, { roughness:0.45 }), 0, 0.11, -8.0);
    R.box(8.8, 0.22, 4.1, R.mat(0xe2d8c2, { roughness:0.42 }), 0, 0.33, -8.2);
    R.box(7.2, 0.22, 3.1, R.mat(0xeee6d4, { roughness:0.4 }), 0, 0.55, -8.4);
    R.box(10.2, 0.06, 1.0, gold, 0, 0.24, -5.55);
    R.collide(0, -8.0, 5.2, 2.6);
    throne(R, 0, -8.65, 0.84);
    [-1, 1].forEach(sd => {
      R.cyl(0.16, 0.2, 4.6, gold, sd * 3.2, 2.9, -9.3, 12);
      R.cyl(0.16, 0.2, 4.6, gold, sd * 3.2, 2.9, -6.8, 12);
    });
    R.box(6.7, 0.28, 0.28, gold, 0, 5.2, -8.05);
    R.box(6.9, 0.85, 0.22, velvet, 0, 5.35, -6.75);
    [-1, 1].forEach(sd => R.box(0.24, 3.0, 2.8, velvet, sd * 3.2, 3.9, -9.0));
    R.box(6.5, 0.12, 2.6, gold, 0, 5.72, -9.0);
    // arka duvarda kumaş pano
    R.box(9.2, 5.4, 0.12, velvet, 0, 4.2, -10.75);
    R.box(9.4, 0.14, 0.16, gold, 0, 6.95, -10.72);
    R.box(9.4, 0.14, 0.16, gold, 0, 1.45, -10.72);
    [-1, 1].forEach(sd => R.box(0.14, 5.6, 0.16, gold, sd * 4.7, 4.2, -10.72));

    // yan duvarlarda aynalar (pencere aralarına)
    [-3.75, 3.75, -7.5, 7.5].forEach(z => {
      R.mirror(-14.82, 3.5, z, Math.PI / 2, 1.1, 2.4);
      R.mirror(14.82, 3.5, z, -Math.PI / 2, 1.1, 2.4);
    });

    // tören sandalyeleri
    [-1, 1].forEach(sd => {
      [-3.0, 0.6, 4.2].forEach(z => {
        R.chair(sd * 7.6, z, sd > 0 ? -Math.PI / 2 : Math.PI / 2, { gilt:true, seat:velvet });
        R.collideC(sd * 7.6, z, 0.34);
      });
    });

    // yan sehpalar, vazolar, saksılar
    [[-10.8, -6.4], [10.8, -6.4], [-10.8, 6.4], [10.8, 6.4]].forEach(([x, z]) => {
      R.table(x, z, { round:true, w:1.1, top:wood });
      R.cyl(0.12, 0.18, 0.48, R.mat(0x2a5a5a, { roughness:0.35 }), x, 1.02, z, 12);
      R.add(new T.SphereGeometry(0.2, 10, 8), R.mat(0xd8b45a, { roughness:0.5 }), x, 1.36, z);
    });
    [[-12.6, -9.4], [12.6, -9.4], [-12.6, 9.4], [12.6, 9.4]].forEach(([x, z]) => R.plant(x, z, { s:1.25 }));
    [-6.2, 1.0, 8.2].forEach(z => {
      R.sconce(-14.8, 4.6, z, Math.PI / 2);
      R.sconce(14.8, 4.6, z, -Math.PI / 2);
    });

    R.npc(-5.4, 6.2, Math.PI / 2, 'Salon Sorumlusu Aylin', [
      'Muayede Salonu, devlet törenlerinde misafirleri ağırlamak için yapılmıştır.',
      'Avizenin ışığı akşamüstü parkenin üzerinde altın bir yol gibi uzanır.',
      'Tören sırasında herkesin yeri bellidir; biz de o düzeni bugün koruyoruz.'
    ], { coat:0x2a3a5a, hat:false, apron:false });
    R.npc(4.7, -4.4, -Math.PI / 2, 'Muayede Kâtibi Burak', [
      'Bugünkü tören için oturma düzeni hazırladım; isimleri tek tek kontrol ediyorum.',
      'Kırmızı kadife ve altın yalnızca süs değil; protokolün de dilidir.',
      'Tahtın önündeki basamaklara dikkat edin, mermer biraz kaygandır.'
    ], { coat:0x3a2a2a, hat:false, apron:false });
    R.npc(6.4, 6.8, Math.PI, 'Ziyaretçi Merve', [
      'Bu salona girdiğimde sesimi ister istemez fısıltıya çevirdim.',
      'Avizeye bakınca insanın başı dönüyor; ustaların işçiliği gerçekten hayranlık verici.',
      'Rehber, parkenin desenlerinin de elle döşendiğini söyledi.'
    ], { coat:0x4a5a4a, hat:false, apron:false });

    R.note(4.6, -5.0, 'Tören defterine bak', 'Tören defteri', [
      'Bu akşam: kabul merasimi, saat 19.00. Salon 18.30’da açılacak.',
      'Not: Tahtın çevresindeki halatlar kaldırılmayacak.'
    ]);
    R.note(-4.5, -5.0, 'Avize kitabesine bak', 'Avize kitabesi', [
      'Salonun ortasındaki avize, ışığını yüzlerce küçük camdan toplar.',
      'Bakımı her yıl aynı ustalar tarafından, tek tek sökülerek yapılır.'
    ]);
  });

  function floorPlane(R, m, x, y, z, w, h, rot = 0){
    const o = R.add(new T.PlaneGeometry(w, h), m, x, y, z, false);
    o.rotation.x = -Math.PI / 2;
    o.rotation.z = rot;
    return o;
  }

  function stool(R, x, z, color = 0x5a3a22){
    const m = R.mat(color, { roughness:0.85 });
    R.cyl(0.19, 0.22, 0.07, m, x, 0.46, z, 12);
    R.cyl(0.035, 0.045, 0.44, m, x, 0.22, z, 8);
    R.collideC(x, z, 0.22);
  }

  function plate(R, x, y, z){
    R.cyl(0.13, 0.13, 0.018, R.mat(0xf2ead8, { roughness:0.3 }), x, y, z, 16);
  }

  function bread(R, x, y, z, ry = 0){
    const m = R.mat(0xc89a52, { roughness:0.85 });
    const o = R.add(new T.SphereGeometry(0.22, 10, 8), m, x, y + 0.09, z, true);
    o.scale.set(1.7, 0.48, 0.78);
    o.rotation.y = ry;
    return o;
  }

  /* ================= Haydarpaşa Garı — bekleme salonu ================= */
  addRoom({
    id:'haydarpasa-bekleme', name:'Haydarpaşa Bekleme Salonu',
    door:doors.haydarpasa,
    w:26, d:16, h:9, floor:'mermer', walls:'tas', ceiling:'tonoz',
    lamp:'avize', lights:3, doorStyle:'kemer',
    skipWindow:(x, z) => z < -7.5
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.82 }), gold = R.mat(0xc8a24a, { metalness:0.55, roughness:0.42 });
    const dark = R.mat(0x3a2416, { roughness:0.85 });

    // hareket panosu, saat ve büyük kitabe
    plane(R, boardMat(), 0, 3.6, -7.78, 0, 10.0, 2.5);
    R.box(10.3, 0.16, 0.16, dark, 0, 4.9, -7.75);
    R.box(10.3, 0.16, 0.16, dark, 0, 2.3, -7.75);
    R.box(0.16, 2.8, 0.16, dark, -5.1, 3.6, -7.75);
    R.box(0.16, 2.8, 0.16, dark, 5.1, 3.6, -7.75);
    R.add(new T.CircleGeometry(1.0, 32), clockMat(), 0, 6.35, -7.79, false);
    R.add(new T.TorusGeometry(1.04, 0.06, 8, 32), gold, 0, 6.35, -7.77, false);
    plane(R, panelMat('hg-sign', 'HAYDARPAŞA', ['Anadolu’ya açılan kapı'], { bg:'#3a2414', fg:'#e8c874', border:'#c8a24a', ts:44, fs:23, ty:0.4, ly:0.73 }), 0, 7.75, -7.79, 0, 4.8, 1.15);

    // arka duvarda renkli cam panolar
    [-8.6, 8.6].forEach(x => {
      plane(R, stainedMat(), x, 3.6, -7.81, 0, 3.1, 4.4);
      R.box(3.35, 0.14, 0.14, dark, x, 5.85, -7.78);
      R.box(3.35, 0.14, 0.14, dark, x, 1.35, -7.78);
      R.box(0.14, 4.6, 0.14, dark, x - 1.62, 3.6, -7.78);
      R.box(0.14, 4.6, 0.14, dark, x + 1.62, 3.6, -7.78);
    });

    // sütunlar
    [[-10.7, -3.8], [-10.7, 3.4], [10.7, -3.8], [10.7, 3.4]].forEach(([x, z]) => {
      R.cyl(0.36, 0.46, 6.2, R.mat(0xd6cbb6, { roughness:0.55 }), x, 3.1, z, 14);
      R.box(1.05, 0.26, 1.05, gold, x, 6.32, z);
      R.box(1.2, 0.18, 1.2, R.mat(0xe4dac6, { roughness:0.5 }), x, 0.1, z);
      R.box(1.05, 0.22, 1.05, gold, x, 0.31, z);
      R.collideC(x, z, 0.5);
    });

    // ahşap banklar (orta koridor boş kalır)
    [-6.0, 6.0].forEach(x => {
      [-1.6, 1.2, 4.0].forEach(z => R.bench(x, z, 4.4, 0, wood));
    });
    // banklarda gazete ve valizler
    R.box(0.5, 0.04, 0.36, R.mat(0xe8e0cc, { roughness:0.8 }), -6.0, 0.5, -1.6, 0.12);
    suitcase(R, 7.9, 2.2, 0x6a4a2a, 0.2);
    suitcase(R, 8.5, 2.7, 0x3a4a5a, -0.15);
    suitcase(R, -8.4, -2.1, 0x6a3a2a, 0.1);

    // bilet gişeleri
    R.counter(10.0, 5.7, { w:4.4, d:0.8, h:0.95, ry:-Math.PI / 2, top:R.mat(0xd8d0c0, { roughness:0.35 }), body:wood });
    R.counter(-10.0, 5.7, { w:4.4, d:0.8, h:0.95, ry:Math.PI / 2, top:R.mat(0xd8d0c0, { roughness:0.35 }), body:wood });
    plane(R, signMat('BİLET'), 10.88, 2.5, 5.7, -Math.PI / 2, 1.7, 0.42);
    plane(R, signMat('BÜFE'), -10.88, 2.5, 5.7, Math.PI / 2, 1.7, 0.42);
    // büfe tezgâhında simit ve çay
    R.add(new T.TorusGeometry(0.3, 0.1, 8, 16), R.mat(0xb8863e, { roughness:0.85 }), -10.0, 1.05, 4.9, true).rotation.x = Math.PI / 2;
    R.cyl(0.05, 0.055, 0.12, R.mat(0xd8c8a8, { roughness:0.35 }), -10.0, 1.06, 6.3, 10);
    R.cyl(0.05, 0.055, 0.12, R.mat(0xd8c8a8, { roughness:0.35 }), -9.7, 1.06, 6.3, 10);

    // dergi rafı, saksılar, duvar aplikleri
    R.shelf(-12.3, 2.0, -5.8, Math.PI / 2, 2.8, 'books');
    R.shelf(12.3, 2.0, -5.8, -Math.PI / 2, 2.8, 'books');
    R.plant(-11.4, -6.2, { s:1.2 });
    R.plant(11.4, -6.2, { s:1.2 });
    [-5.4, 0.4, 6.0].forEach(z => {
      R.sconce(-12.82, 4.2, z, Math.PI / 2);
      R.sconce(12.82, 4.2, z, -Math.PI / 2);
    });
    R.cyl(0.24, 0.28, 0.9, R.mat(0x6a7a6a, { metalness:0.3, roughness:0.6 }), 2.6, 0.45, 1.0, 12);
    R.collideC(2.6, 1.0, 0.3);

    R.npc(11.4, 5.7, -Math.PI / 2, 'Gar Memuru Nazlı', [
      'Haydarpaşa’dan Ankara, Konya ve Eskişehir’e her gün tren kalkar.',
      'Biletinizi alırken peron numarasını da sorun; son dakikada koşmayın.',
      'Hareket panosundaki gecikmeler bazen hava yüzündendir, bazen de yol çalışması.'
    ], { coat:0x1e3a4a, hat:false, apron:false });
    R.npc(-11.4, 5.7, Math.PI / 2, 'Büfeci Osman', [
      'Simit sabah taze gelir; öğleden sonra kalanı çayla birlikte gider.',
      'Yolcuların çoğu acele eder ama çayı ayakta içmeyi kimse sevmez.',
      'Bir simit, bir çay... Yolculuk böyle başlar.'
    ], { coat:0x5a3a22, hat:false, apron:'#f2ead8' });
    R.npc(-2.9, 5.7, Math.PI, 'Yolcu Cem', [
      'Trenim birazdan kalkacak; valizimi bankın yanına bıraktım.',
      'Bu garın taşları, insanların telaşını yüzyıllardır aynı sabırla dinliyor.',
      'Konya’ya gidiyorum. Orada beni bir dostum bekliyor.'
    ], { coat:0x4a4a3a, hat:false, apron:false });

    R.note(0, -6.7, 'Tarife panosuna bak', 'Hareket panosu', [
      'Ankara 08.15, Konya 09.40, Eskişehir 10.05, İzmir 11.20.',
      'Gecikme bildirimleri gişeden de öğrenilebilir.'
    ]);
    R.note(-2.9, 4.0, 'Bankta unutulmuş mektuba bak', 'Unutulmuş mektup', [
      '“Sevgili kardeşim, trenin kalktığı gün burada olacağım.”',
      'Mektubun üstünde bir isim yok; zarfın köşesi çay lekesiyle sararmış.'
    ]);
  });

  /* ================= dükkânlar ================= */
  const shopDefs = [];
  function shop(def, decorate){
    shopDefs.push(Object.assign({ decor:decorate }, def));
  }

  shop({
    cat:'LOKANTA', id:'dukkan-lokanta', name:'Lokanta',
    w:10, d:8, h:3.6, floor:'ahsap', walls:'alci', ceiling:'kiris',
    wallColor:0xe8dcc4, windows:false, lights:2, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.82 }), marbleTop = R.mat(0xd8d0c0, { roughness:0.35 });
    R.counter(0, -3.0, { w:5.2, d:0.85, h:0.95, top:marbleTop, body:wood });
    plane(R, panelMat('lok-menu', 'GÜNÜN MENÜSÜ', ['Mercimek çorbası · 45', 'Izgara köfte · 120', 'Pilav · 40', 'Sütlaç · 35'], { bg:'#2a2a22', fg:'#f2e6c8', border:'#8a6a3a', ts:32, fs:21, ty:0.22, ly:0.42, lh:31, w:512, h:240 }), 0, 2.55, -3.93, 0, 3.0, 1.35);
    R.hangingPots(0, -3.15, 2.6);
    R.table(-2.9, 0.6, { w:1.6, d:0.9, top:wood });
    R.chair(-2.9, -0.25, 0); R.chair(-2.9, 1.45, Math.PI);
    R.chair(-3.55, 0.6, Math.PI / 2); R.chair(-2.25, 0.6, -Math.PI / 2);
    R.table(2.8, 1.2, { w:1.5, d:0.9, top:wood });
    R.chair(2.8, 0.35, 0); R.chair(2.8, 2.05, Math.PI);
    R.chair(2.15, 1.2, Math.PI / 2); R.chair(3.45, 1.2, -Math.PI / 2);
    [-3.55, -2.25].forEach(x => R.collideC(x, 0.6, 0.25));
    [2.15, 3.45].forEach(x => R.collideC(x, 1.2, 0.25));
    [[-2.9, -0.25], [-2.9, 1.45], [2.8, 0.35], [2.8, 2.05]].forEach(([x, z]) => R.collideC(x, z, 0.25));
    plate(R, -2.9, 0.81, 0.6); plate(R, 2.8, 0.81, 1.2);
    R.cyl(0.035, 0.045, 0.11, R.mat(0xe8e0cc, { roughness:0.35 }), -2.7, 0.86, 0.35, 10);
    R.cyl(0.035, 0.045, 0.11, R.mat(0xe8e0cc, { roughness:0.35 }), 2.95, 0.86, 0.95, 10);
    R.shelf(4.62, 2.2, -0.6, -Math.PI / 2, 2.6, 'jars');
    R.plant(-4.5, 2.7, { s:0.9 });
    R.sconce(-4.84, 2.5, 1.4, Math.PI / 2);

    R.npc(0, -3.65, 0, 'Lokantacı Nevzat', [
      'Bugün çorba mercimek, ana yemek ızgara köfte. Ekmeğimiz fırından yeni geldi.',
      'İsterseniz masayı pencere kenarına çekeyim; ama burada pencereden çok sohbet var.',
      'Afiyet olsun. Tabağınızı bitirmeden hesabı getirmem.'
    ], { coat:0x6a3a22, hat:false, apron:'#f2ead8' });
    R.note(1.6, -2.6, 'Menüye bak', 'Lokanta menüsü', [
      'Mercimek çorbası, ızgara köfte, pilav, sütlaç.',
      'Not: Bugünün çorbası limonla servis edilir.'
    ]);
  });

  shop({
    cat:'KAHVEHANE', id:'dukkan-kahvehane', name:'Kahvehane',
    w:10, d:8, h:3.6, floor:'ahsap', walls:'ahsap', ceiling:'kiris',
    windows:false, lights:2, doorStyle:'rustik'
  }, (R) => {
    const wood = R.mat(0x4e2c18, { roughness:0.85 }), copper = R.mat(0xb07838, { metalness:0.6, roughness:0.4 });
    R.counter(0, -3.05, { w:4.6, d:0.8, h:0.95, body:wood });
    R.table(-2.8, 0.6, { round:true, w:1.1, top:wood });
    R.table(2.7, 1.0, { w:1.5, d:0.9, top:wood });
    stool(R, -3.7, 0.6); stool(R, -2.8, 1.7); stool(R, -1.9, 0.6);
    R.chair(2.7, 0.2, 0); R.chair(2.7, 1.8, Math.PI);
    R.chair(2.0, 1.0, Math.PI / 2); R.chair(3.4, 1.0, -Math.PI / 2);
    [2.0, 3.4].forEach(x => R.collideC(x, 1.0, 0.25));
    [[2.7, 0.2], [2.7, 1.8]].forEach(([x, z]) => R.collideC(x, z, 0.25));
    floorPlane(R, tavlaMat(), -2.8, 0.825, 0.6, 0.72, 0.72, 0.15);
    for (let i = 0; i < 5; i++){
      const c = i % 2 ? 0xf2ead8 : 0x2a1a12;
      R.add(new T.SphereGeometry(0.032, 6, 4), R.mat(c, { roughness:0.5 }), -3.05 + i * 0.11, 0.86, 0.32, true);
      R.add(new T.SphereGeometry(0.032, 6, 4), R.mat(c, { roughness:0.5 }), -3.05 + i * 0.11, 0.86, 0.9, true);
    }
    brassPot(R, 0.2, 0.95, -3.05, 0.55);
    brassPot(R, -0.6, 0.95, -3.05, 0.45);
    R.cyl(0.09, 0.11, 0.12, copper, 1.1, 1.02, -3.05, 12);
    [-1.4, 0, 1.4].forEach(x => R.cyl(0.045, 0.055, 0.09, R.mat(0xf0e8d8, { roughness:0.35 }), x, 1.0, -2.75, 10));
    plane(R, signMat('KAHVEHANE'), 0, 3.18, -3.93, 0, 2.8, 0.6);
    R.shelf(4.62, 1.9, -1.2, -Math.PI / 2, 2.8, 'pots');
    R.shelf(4.62, 2.6, -1.2, -Math.PI / 2, 2.8, 'jars');
    R.painting(-4.84, 2.1, 0.8, Math.PI / 2, 1.15, 0.95, 'manzara', 3);
    R.painting(-4.84, 2.1, 2.4, Math.PI / 2, 1.15, 0.95, 'deniz', 5);
    R.sconce(-4.82, 2.7, -1.9, Math.PI / 2);

    R.npc(0, -3.7, 0, 'Kahveci Salih', [
      'Kahve cezvede ağır ağır pişer; acele edersen acı olur.',
      'Tavla tahtası hazır. İstersen bir el oynarız, ama ben şakacıktan kaybetmem.',
      'Duvardaki resimler eski İstanbul’dan. Her birinin bir köşesi bize bakıyor.'
    ], { coat:0x4a2e1a, hat:false, apron:'#d8ccb4' });
    R.note(-2.8, 0.6, 'Tavla tahtasına bak', 'Tavla tahtası', [
      'Pullar dizilmiş, zar ortada bekliyor.',
      'Tahtanın kenarına küçük harflerle “şans, hazır olana güler” yazılmış.'
    ]);
    R.note(-4.0, 2.4, 'Duvardaki resme bak', 'Eski İstanbul resimleri', [
      'Resimlerde Boğaz, vapurlar ve eski bir kahvehane görünüyor.',
      'Altlarındaki notta: “Sohbetin en güzeli, çayın en tazesiyle olur.”'
    ]);
  });

  shop({
    cat:'BERBER', id:'dukkan-berber', name:'Berber',
    w:10, d:8, h:3.6, floor:'mermer', walls:'alci', ceiling:'alci',
    windows:false, lights:2, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x4e2c18, { roughness:0.82 }), chrome = R.mat(0x9aa4aa, { metalness:0.75, roughness:0.28 });
    R.mirror(0, 2.15, -3.9, 0, 1.5, 2.3);
    R.box(1.75, 0.1, 0.08, R.mat(0xc8a24a, { metalness:0.5, roughness:0.4 }), 0, 3.33, -3.9);
    barberChair(R, 0, 0.2, Math.PI);
    R.counter(-3.2, -3.05, { w:3.2, d:0.8, h:0.95, body:wood });
    R.shelf(-4.62, 1.7, 0.4, Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 1.7, 0.4, -Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 2.35, 0.4, -Math.PI / 2, 3.0, 'jars');
    // havlu, fırça, ustura
    for (let i = 0; i < 4; i++){
      R.box(0.5, 0.07, 0.32, R.mat(i % 2 ? 0xf2ead8 : 0xdfe8ee, { roughness:0.95 }), -3.8 + i * 0.4, 1.0, -2.9, 0.04);
    }
    R.cyl(0.06, 0.08, 0.18, chrome, -4.4, 1.04, -2.95, 10);
    R.box(0.05, 0.02, 0.3, chrome, -2.4, 1.02, -2.9, 0.2);
    R.cyl(0.2, 0.22, 0.32, chrome, 3.9, 0.16, 2.9, 12);
    R.box(0.14, 0.55, 0.14, R.mat(0x2a2a2a, { metalness:0.4, roughness:0.5 }), 3.9, 0.55, 2.9);
    R.collideC(3.9, 2.9, 0.3);
    plane(R, signMat('BERBER'), 3.35, 3.05, -3.91, 0, 2.3, 0.55);

    R.npc(2.3, 0.3, -Math.PI / 2, 'Berber Kemal', [
      'Hoş geldiniz. Saç mı, sakal mı? İkisi de olur, acelemiz yok.',
      'Ustura her kullanımdan sonra kayışlanır; müşteriye hep temiz gider.',
      'Aynanın karşısında oturunca insan kendine başka türlü bakar, derler.'
    ], { coat:0x3a2a2a, hat:false, apron:'#e8e0d0' });
    R.note(-2.9, -2.65, 'Fiyat listesine bak', 'Berber fiyat listesi', [
      'Saç kesimi, sakal tıraşı, çocuk tıraşı.',
      'Not: Bugün ustura bileme günü; tıraşlar biraz gecikebilir.'
    ]);
  });

  shop({
    cat:'FIRIN', id:'dukkan-firin', name:'Fırın',
    w:10, d:8, h:3.6, floor:'tas', walls:'tugla', ceiling:'kiris',
    windows:false, lights:2, doorStyle:'rustik'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.85 }), stone = R.mat(0xc8b89a, { roughness:0.8 });
    bakeryOven(R, -2.7, -2.7);
    R.counter(2.0, -3.05, { w:4.2, d:0.8, h:0.95, body:wood });
    plane(R, signMat('FIRIN'), 2.0, 3.05, -3.93, 0, 2.4, 0.55);
    plane(R, panelMat('firin-list', 'BUGÜN FIRINDA', ['Köy ekmeği', 'Susamlı halka', 'Mısır ekmeği', 'Bazlama'], { bg:'#2a2a22', fg:'#f2e6c8', border:'#8a6a3a', ts:30, fs:20, ty:0.24, ly:0.44, lh:29, w:512, h:220 }), 2.0, 2.35, -3.92, 0, 2.4, 1.05);
    for (let i = 0; i < 6; i++) bread(R, 0.6 + i * 0.58, 1.0, -3.0, (i % 2) * 0.4);
    R.shelf(4.62, 1.45, 1.1, -Math.PI / 2, 3.0, 'pots');
    R.shelf(4.62, 2.15, 1.1, -Math.PI / 2, 3.0, 'jars');
    R.table(-3.3, 1.7, { round:true, w:1.1, top:wood });
    R.cyl(0.22, 0.26, 0.14, stone, -3.3, 0.86, 1.7, 14);
    R.add(new T.SphereGeometry(0.22, 10, 6), R.mat(0xd8c8a8, { roughness:0.95 }), -3.3, 0.98, 1.7, true).scale.set(1, 0.45, 1);
    R.barrel(-4.2, -0.1, { s:0.9 }); R.barrel(-4.2, 0.9, { s:0.8 });
    R.box(0.08, 2.1, 0.05, wood, -4.5, 1.05, 2.6, 0.14);
    R.collide(-4.5, 2.6, 0.2, 0.2);
    R.npc(2.0, -3.65, 0, 'Fırıncı Ayşe', [
      'Ekmek sabah erken çıkar; o saatte bütün sokak hamur kokar.',
      'Köy ekmeği taş fırında pişer, kabuğu kalın olur. İstersen sıcakken keseyim.',
      'Bugün mısır ekmeği de yaptım; biraz beklersen tazesi gelir.'
    ], { coat:0x7a4a2a, hat:false, apron:'#f2ead8' });
    R.note(3.7, 2.3, 'Günün ekmeğine bak', 'Fırın notu', [
      'Sabah: köy ekmeği, susamlı halka. Öğlen: mısır ekmeği.',
      'Not: Hamur mayası akşamdan hazırlanır; acele ettirilmez.'
    ]);
  });

  shop({
    cat:'PASTANE', id:'dukkan-pastane', name:'Pastane',
    w:10, d:8, h:3.6, floor:'mermer', walls:'alci', ceiling:'alci',
    wallColor:0xf0dce0, windows:false, lights:2, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x6a4a2e, { roughness:0.78 });
    displayCase(R, 0, -3.0, 5.2, 0, [0xe89ab0, 0xf2d27a, 0xc8e0b0, 0xe8b48a, 0xd8b0e0]);
    R.cabinet(-4.55, -2.2, Math.PI / 2, { w:2.0, h:2.2, d:0.45, items:'china', m:wood });
    R.table(-3.0, 0.9, { round:true, w:1.1, top:wood });
    R.chair(-3.9, 0.9, Math.PI / 2); R.chair(-2.1, 0.9, -Math.PI / 2);
    R.collideC(-3.9, 0.9, 0.25); R.collideC(-2.1, 0.9, 0.25);
    R.table(3.0, 1.2, { round:true, w:1.1, top:wood });
    R.chair(3.0, 0.3, 0); R.chair(3.0, 2.1, Math.PI);
    R.collideC(3.0, 0.3, 0.25); R.collideC(3.0, 2.1, 0.25);
    R.shelf(4.62, 1.75, -0.8, -Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 2.4, -0.8, -Math.PI / 2, 3.0, 'jars');
    // vitrin yanındaki masada pasta standı
    R.cyl(0.05, 0.07, 0.32, R.mat(0xc8a24a, { metalness:0.5, roughness:0.4 }), -3.0, 0.94, 0.9, 8);
    R.cyl(0.36, 0.36, 0.025, R.mat(0xc8a24a, { metalness:0.5, roughness:0.4 }), -3.0, 1.02, 0.9, 18);
    R.cyl(0.26, 0.3, 0.22, R.mat(0xf2d27a, { roughness:0.7 }), -3.0, 1.14, 0.9, 16);
    R.cyl(0.2, 0.24, 0.16, R.mat(0xe89ab0, { roughness:0.6 }), -3.0, 1.33, 0.9, 16);
    R.add(new T.SphereGeometry(0.05, 8, 6), R.mat(0xc82a3a, { roughness:0.5 }), -3.0, 1.46, 0.9);
    plane(R, signMat('PASTANE'), 0, 3.18, -3.93, 0, 2.6, 0.58);
    R.plant(4.3, 2.8, { s:0.8 });
    R.npc(0, -3.7, 0, 'Pastaneci Lale', [
      'Bugünün tatlısı gül lokumu pastası; gül suyunu kendim hazırladım.',
      'Vitrindeki her dilim sabah taze yapıldı. Hangisini denemek istersiniz?',
      'Yanında bir kahve iyi gider; pastanın şekerini o dengeler.'
    ], { coat:0x8a4a5a, hat:false, apron:'#f2ead8' });
    R.note(3.7, 2.3, 'Bugünün tatlısına bak', 'Pastane defteri', [
      'Bugün: gül lokumu pastası, fıstıklı tart, limonlu kek.',
      'Not: Pastalar sabah 08.00’de vitrine çıkar, öğleden sonra ikinci tepsi gelir.'
    ]);
  });

  shop({
    cat:'ECZANE', id:'dukkan-eczane', name:'Eczane',
    w:10, d:8, h:3.6, floor:'mermer', walls:'alci', ceiling:'alci',
    windows:false, lights:2, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x4a2e1a, { roughness:0.82 }), brass = R.mat(0xb08a3a, { metalness:0.6, roughness:0.38 });
    R.counter(0, -3.0, { w:5.0, d:0.85, h:0.95, body:wood });
    R.cabinet(-2.7, -3.72, 0, { w:2.4, h:2.5, d:0.45, items:'bottles', m:wood });
    R.cabinet(2.7, -3.72, 0, { w:2.4, h:2.5, d:0.45, items:'bottles', m:wood });
    R.shelf(-4.62, 1.7, -0.6, Math.PI / 2, 3.0, 'jars');
    R.shelf(-4.62, 2.35, -0.6, Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 1.7, -0.6, -Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 2.35, -0.6, -Math.PI / 2, 3.0, 'jars');
    // terazi
    R.cyl(0.04, 0.05, 0.55, brass, 1.8, 1.22, -3.0, 8);
    R.box(0.75, 0.035, 0.035, brass, 1.8, 1.46, -3.0);
    [-1, 1].forEach(sd => {
      R.cyl(0.16, 0.14, 0.045, brass, 1.8 + sd * 0.36, 1.15, -3.0, 14);
      R.cyl(0.008, 0.008, 0.28, brass, 1.8 + sd * 0.18, 1.32, -3.0, 5);
    });
    R.cyl(0.18, 0.22, 0.16, R.mat(0xe8e0d0, { roughness:0.5 }), -1.6, 1.03, -3.0, 14);
    R.cyl(0.05, 0.06, 0.32, brass, -1.6, 1.25, -3.0, 8);
    // cam kavanozlar
    [[-3.9, -2.7, 0x8ac8a8], [-4.2, -1.8, 0xe8b48a], [-3.6, -1.2, 0xc8b0e0]].forEach(([x, z, c]) => {
      R.cyl(0.11, 0.13, 0.3, R.mat(c, { roughness:0.12, transparent:true, opacity:0.55 }), x, 0.15, z, 12);
      R.cyl(0.09, 0.09, 0.04, R.mat(0x8a6a3a, { roughness:0.6 }), x, 0.32, z, 10);
      R.collideC(x, z, 0.16);
    });
    plane(R, signMat('ECZANE'), 0, 3.13, -3.93, 0, 2.4, 0.55);
    R.plant(4.2, 2.7, { s:0.85 });
    R.npc(0, -3.65, 0, 'Eczacı Feride', [
      'Hoş geldiniz. Reçeteniz varsa getirin; yoksa da dinleyelim, elimizden geleni söyleriz.',
      'Bu raflarda her kavanozun yeri bellidir; karışırsa işimiz zorlaşır.',
      'Şikâyetiniz geçmezse mutlaka bir hekime görünün. Burada yalnızca yol gösteririz.'
    ], { coat:0x2a5a4a, hat:false, apron:'#f2ead8' });
    R.note(0.6, -2.5, 'Reçete defterine bak', 'Eczane defteri', [
      'Bugün gelen reçeteler tek tek kaydedildi.',
      'Not: Çocuk ilaçlarında doz her zaman hekime sorulur.'
    ]);
  });

  shop({
    cat:'KİTAPÇI', id:'dukkan-kitapci', name:'Kitapçı',
    w:10, d:8, h:3.6, floor:'ahsap', walls:'ahsap', ceiling:'kiris',
    windows:false, lights:2, doorStyle:'rustik'
  }, (R) => {
    const wood = R.mat(0x4e2c18, { roughness:0.85 });
    R.bookcase(0, -3.7, 0, { w:5.2, h:2.9, d:0.4, m:wood });
    R.bookcase(-4.62, 0.6, Math.PI / 2, { w:4.4, h:2.7, d:0.4, m:wood });
    R.bookcase(4.62, 0.6, -Math.PI / 2, { w:4.4, h:2.7, d:0.4, m:wood });
    R.table(0, 0.7, { w:2.0, d:1.0, top:wood });
    R.chair(-1.5, 0.7, Math.PI / 2); R.chair(1.5, 0.7, -Math.PI / 2);
    R.collideC(-1.5, 0.7, 0.26); R.collideC(1.5, 0.7, 0.26);
    bookStack(R, 0.0, 0.84, 0.7, 4);
    bookStack(R, 0.2, 0.84, 0.35, 3);
    // merdiven
    [-0.35, 0.35].forEach(dx => {
      const o = R.box(0.08, 2.4, 0.08, wood, -4.1 + dx, 1.2, 2.9);
      o.rotation.z = dx > 0 ? -0.18 : -0.18;
    });
    for (let i = 0; i < 5; i++) R.box(0.78, 0.06, 0.1, wood, -4.1, 0.35 + i * 0.42, 2.9 - i * 0.07);
    R.collide(-4.1, 2.9, 0.45, 0.3);
    bookStack(R, 3.5, 0.0, 2.6, 5);
    bookStack(R, 3.8, 0.0, 2.2, 4);
    R.collide(3.65, 2.4, 0.45, 0.45);
    plane(R, signMat('KİTAPÇI'), 0, 3.18, -3.93, 0, 2.4, 0.55);
    R.plant(4.2, -2.7, { s:0.9 });
    R.npc(1.9, -2.8, -Math.PI / 2, 'Kitapçı Orhan', [
      'Yeni gelenler masanın üstünde; istediğiniz gibi bakabilirsiniz.',
      'Bu dükkânda kitap kadar sohbet de satılır, ama sohbetin fiyatı yoktur.',
      'Aradığınız bir şey varsa tarif edin; raflarda birlikte bakalım.'
    ], { coat:0x3a4a3a, hat:false, apron:false });
    R.note(0.6, 0.7, 'Yeni gelenlere bak', 'Yeni gelen kitaplar', [
      'Şiir, gezi yazısı, kısa öyküler ve bir de eski İstanbul albümü.',
      'Not: Albümün son sayfasında Boğaz’dan çekilmiş bir fotoğraf var.'
    ]);
    R.note(3.4, 2.6, 'Okuma köşesine bak', 'Okuma köşesi', [
      'Bir sandalye, bir masa ve yarım bırakılmış bir çay.',
      'Masaya not düşülmüş: “Kitabı bitirmeden kalkma.”'
    ]);
  });

  shop({
    cat:'LOKUMCU', id:'dukkan-lokumcu', name:'Lokumcu',
    w:10, d:8, h:3.6, floor:'mermer', walls:'alci', ceiling:'boyali',
    wallColor:0xf0e0d0, windows:false, lights:2, doorStyle:'kemer'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.8 });
    displayCase(R, 0, -3.0, 5.8, 0, [0xe89ab0, 0xf2d27a, 0xc8e0b0, 0xe8b48a, 0xd8b0e0, 0xf2ead8]);
    R.cabinet(-4.55, -2.0, Math.PI / 2, { w:2.0, h:2.2, d:0.45, items:'china', m:wood });
    R.table(3.0, 1.2, { round:true, w:1.1, top:wood });
    R.chair(3.0, 0.35, 0); R.chair(3.0, 2.05, Math.PI);
    R.collideC(3.0, 0.35, 0.25); R.collideC(3.0, 2.05, 0.25);
    // bakır tepside lokum dilimleri
    R.cyl(0.46, 0.46, 0.035, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), 3.0, 0.82, 1.2, 20);
    for (let i = 0; i < 5; i++){
      const a = i * Math.PI * 2 / 5;
      R.box(0.13, 0.09, 0.13, R.mat([0xe89ab0, 0xf2d27a, 0xc8e0b0, 0xe8b48a, 0xf2ead8][i], { roughness:0.6 }), 3.0 + Math.cos(a) * 0.25, 0.9, 1.2 + Math.sin(a) * 0.25, a);
    }
    R.cyl(0.04, 0.05, 0.1, R.mat(0xe8e0cc, { roughness:0.35 }), 2.6, 0.86, 1.4, 10);
    R.shelf(-4.62, 1.85, 0.6, Math.PI / 2, 2.8, 'jars');
    R.shelf(4.62, 1.85, -0.8, -Math.PI / 2, 2.8, 'jars');
    plane(R, signMat('LOKUMCU'), 0, 3.18, -3.93, 0, 2.6, 0.58);
    R.plant(-4.2, 2.8, { s:0.85 });
    R.npc(0, -3.7, 0, 'Lokumcu Sema', [
      'Lokumun sırrı, şekeri ve suyu sabırla kaynatmaktır.',
      'Gül, limon, nane ve fıstık... Hepsi ayrı tepside durur. Hangisini seversiniz?',
      'Üstüne pudra şekeri serperim; kutuyu da kurdeleyle bağlarım.'
    ], { coat:0x7a3a4a, hat:false, apron:'#f2ead8' });
    R.note(-3.8, 2.3, 'Lokum çeşitlerine bak', 'Lokum defteri', [
      'Bugün: gül, limon, nane, fıstıklı ve sade lokum.',
      'Not: Lokum serin yerde saklanır; kutunun kapağı açık bırakılmaz.'
    ]);
  });

  shop({
    cat:'BAHARATÇI', id:'dukkan-baharatci', name:'Baharatçı',
    w:10, d:8, h:3.6, floor:'tas', walls:'tugla', ceiling:'kiris',
    windows:false, lights:2, doorStyle:'rustik'
  }, (R) => {
    const wood = R.mat(0x5a3a22, { roughness:0.85 });
    R.counter(0, -3.05, { w:4.4, d:0.8, h:0.95, body:wood });
    R.shelf(-4.62, 1.8, -1.0, Math.PI / 2, 3.0, 'jars');
    R.shelf(-4.62, 2.45, -1.0, Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 1.8, -1.0, -Math.PI / 2, 3.0, 'jars');
    R.shelf(4.62, 2.45, -1.0, -Math.PI / 2, 3.0, 'jars');
    spiceSack(R, -3.5, -0.8, 0xc86a2a, 0.95);
    spiceSack(R, 3.5, -0.7, 0xd8b45a, 0.95);
    spiceSack(R, -3.5, 1.1, 0x8a3a1a, 0.85);
    spiceSack(R, 3.5, 1.2, 0x6a7a3a, 0.85);
    // asılı biber ve sarımsak demetleri
    [-1.6, 1.6].forEach(x => {
      R.cyl(0.01, 0.01, 1.2, R.mat(0x6a4a2a, { roughness:0.9 }), x, 2.7, -2.6, 5);
      for (let k = 0; k < 6; k++) R.add(new T.ConeGeometry(0.055, 0.18, 6), R.mat(0xa02a1a, { roughness:0.85 }), x + Math.sin(k) * 0.05, 2.1 - k * 0.13, -2.58, true).rotation.x = Math.PI;
    });
    // terazi ve kavanozlar
    R.cyl(0.035, 0.045, 0.5, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), 1.5, 1.2, -3.05, 8);
    R.box(0.65, 0.03, 0.03, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), 1.5, 1.43, -3.05);
    [-1, 1].forEach(sd => {
      R.cyl(0.14, 0.12, 0.04, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), 1.5 + sd * 0.32, 1.12, -3.05, 14);
      R.cyl(0.008, 0.008, 0.26, R.mat(0xb08a3a, { metalness:0.55, roughness:0.4 }), 1.5 + sd * 0.16, 1.28, -3.05, 5);
    });
    [[-1.6, -2.9, 0xc86a2a], [-1.1, -2.9, 0xd8b45a], [-0.6, -2.9, 0x8a3a1a]].forEach(([x, z, c]) => {
      R.cyl(0.12, 0.14, 0.28, R.mat(c, { roughness:0.9 }), x, 1.06, z, 12);
      R.cyl(0.1, 0.1, 0.04, R.mat(0x8a6a3a, { roughness:0.6 }), x, 1.22, z, 10);
    });
    plane(R, signMat('BAHARATÇI'), 0, 3.18, -3.93, 0, 2.8, 0.55);
    R.npc(0, -3.7, 0, 'Baharatçı Derya', [
      'Baharatı gözle değil, koklayarak seçmek gerekir. İsterseniz tek tek deneyelim.',
      'Karabiber, kimyon, tarçın... Her yemeğin kendi baharatı vardır.',
      'Fazlası yemeği bozar; ölçüyü kaçırmamak lazım.'
    ], { coat:0x6a3a2a, hat:false, apron:'#e8dcc4' });
    R.note(-3.8, 2.3, 'Baharat defterine bak', 'Baharat defteri', [
      'Bugün tazelenenler: kimyon, tarçın, karabiber, kuru nane.',
      'Not: Baharat serin ve karanlık yerde saklanır; kokusunu kaybetmemeli.'
    ]);
  });

  shop({
    cat:'ÇİÇEKÇİ', id:'dukkan-cicekci', name:'Çiçekçi',
    w:10, d:8, h:3.6, floor:'tas', walls:'ahsap', ceiling:'kiris',
    windows:false, lights:2, doorStyle:'rustik'
  }, (R) => {
    const wood = R.mat(0x4e2c18, { roughness:0.85 });
    R.counter(-2.7, -3.05, { w:3.2, d:0.8, h:0.95, body:wood });
    R.cyl(0.16, 0.2, 0.28, R.mat(0x7a8a7a, { metalness:0.4, roughness:0.5 }), -2.9, 1.08, -3.05);
    R.box(0.55, 0.03, 0.38, R.mat(0xe8e0cc, { roughness:0.85 }), -2.2, 0.99, -3.05, -0.18);
    R.box(0.05, 0.02, 0.24, R.mat(0x3a3a3a, { metalness:0.6, roughness:0.35 }), -1.9, 1.01, -3.0, 0.3);
    // kova kova çiçekler
    const cols = [0xc83a4a, 0xe8b43a, 0xd87ab0, 0xf2ead8, 0x8a6ab8, 0xe86a3a];
    [[2.7, -2.4, 0], [3.7, -2.3, 1], [2.6, -0.8, 2], [3.6, -0.7, 3], [2.7, 0.9, 4], [3.7, 1.0, 5], [2.7, 2.5, 2], [-4.3, 0.4, 0], [-4.3, 1.7, 3], [-4.3, 2.9, 5]].forEach(([x, z, c]) => flowerBucket(R, x, z, cols[c], 7));
    R.hangingPots(-0.6, -2.3, 2.4, 0);
    R.plant(-4.3, -1.8, { s:1.0 });
    R.plant(-4.3, 3.5, { s:0.9 });
    R.shelf(-4.62, 2.1, -2.6, Math.PI / 2, 2.4, 'pots');
    plane(R, signMat('ÇİÇEKÇİ'), -2.7, 3.18, -3.93, 0, 2.6, 0.55);
    R.npc(-2.7, -3.7, 0, 'Çiçekçi Nergis', [
      'Çiçek seçerken rengine değil, sapına ve yaprağına bakın; tazeliği oradan belli olur.',
      'Bu mevsimde gül, karanfil ve papatya en güzeli. Saksıda da verebilirim.',
      'Hediye edecekseniz kağıdı ve kurdeleyi ben sararım.'
    ], { coat:0x3a6a4a, hat:false, apron:'#e8e0cc' });
    R.note(-3.9, 2.8, 'Çiçek bakımına bak', 'Çiçek bakım notu', [
      'Suyu iki günde bir değiştirin; sapı çapraz kesin.',
      'Güneşi sevenler pencereye, gölge sevenler içeri.'
    ]);
  });

  /* ---------- dükkân cephelerini seç: her addan en fazla bir tane, üç yakaya dağıt ---------- */
  const fronts = (env.fronts || []).filter(f => f && f.shop && env.landG(f.x, f.z));
  const regionOf = f => f.z < -70 ? 0 : f.x > 120 ? 2 : 1;
  const regionCount = [0, 0, 0];
  shopDefs.forEach(def => {
    const list = fronts.filter(f => f.shop === def.cat);
    if (!list.length) return;
    const regions = [];
    list.forEach(f => { const r = regionOf(f); if (!regions.includes(r)) regions.push(r); });
    regions.sort((a, b) => regionCount[a] - regionCount[b] || a - b);
    const pickRegion = regions[0];
    const best = list.find(f => regionOf(f) === pickRegion);
    if (!best) return;
    regionCount[pickRegion]++;
    const spec = Object.assign({}, def);
    delete spec.decor; delete spec.cat;
    spec.door = { x:best.x, z:best.z, ry:best.ry };
    addRoom(spec, def.decor);
  });
}
