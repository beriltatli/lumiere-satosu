// Tarlabaşı, Balat/Fener ve Kadıköy–Moda sokaklarında duvar resimleri.
// Sekiz hücrelik tek atlas: altı söz, bir kedi, bir martı-vapur resmi. Bütün düzlemler tek mesh'te birleşir.

export function buildGraffiti(ctx, env){
  const { THREE, kit, root } = ctx;
  const { houseList, fronts, reg, keep, Hs, landG, inland, kept, mergeBufferGeometries } = env;
  if (!houseList || !houseList.length) return;

  let sd = 4127;
  const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

  /* ================= 8 hücrelik sprey atlası (2 x 4) ================= */
  const CW = 256, CH = 128;
  const [cv, g] = kit.canvas(512, 512);
  g.clearRect(0, 0, 512, 512);

  const cellXY = (i) => [(i % 2) * CW, ((i / 2) | 0) * CH];
  const rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };
  const roundPath = (x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y);
    g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h);
    g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r);
    g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  };

  // sprey halesi
  function halo(x, y, r, col, a){
    g.save();
    g.translate(x, y);
    g.scale(1.9, 0.8);
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, r);
    gr.addColorStop(0, rgba(col, a));
    gr.addColorStop(0.55, rgba(col, a * 0.5));
    gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    g.restore();
  }

  // çok sayıda küçük yarı saydam boya zerresi
  function dots(x0, y0, pal, n){
    for (let i = 0; i < n; i++){
      const x = x0 + 8 + rnd() * (CW - 16);
      const y = y0 + 8 + rnd() * (CH - 16);
      g.fillStyle = rnd() < 0.22 ? '#ffffff' : pal[(rnd() * pal.length) | 0];
      g.globalAlpha = 0.06 + rnd() * 0.24;
      g.beginPath(); g.arc(x, y, 0.4 + rnd() * 1.6, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  // aşağı akan boya damlaları
  function drips(x0, y0, pal, n, top){
    for (let i = 0; i < n; i++){
      const x = x0 + 26 + rnd() * (CW - 52);
      const y = y0 + top + rnd() * 8;
      const room = y0 + CH - 5 - y;
      if (room < 5) continue;
      const len = Math.min(room, 7 + rnd() * 30);
      const bw = 1.5 + rnd() * 2.4;
      g.save();
      g.fillStyle = pal[(rnd() * pal.length) | 0];
      g.strokeStyle = 'rgba(18,14,22,0.8)';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x - bw / 2, y); g.lineTo(x - bw / 2, y + len);
      g.arc(x, y + len, bw / 2, Math.PI, 0, true);
      g.lineTo(x + bw / 2, y); g.closePath();
      g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath(); g.arc(x - bw * 0.15, y + len * 0.34, 0.55, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }

  // kalın balon harfler: siyah dış hat, renkli dolgu, beyaz parlama
  function drawWord(text, cx, cy, maxW, base, pal){
    const font = (s) => '900 ' + s + 'px Arial, sans-serif';
    const fs = base;
    g.font = font(fs);
    const chars = Array.from(text);
    const widths = chars.map(ch => g.measureText(ch).width);
    const gap = fs * 0.02;
    let total = gap * Math.max(0, chars.length - 1);
    for (let i = 0; i < widths.length; i++) total += widths[i];
    const fit = Math.min(1, maxW / Math.max(1, total));
    g.save();
    g.translate(cx, cy);
    g.scale(fit, 1);
    let x = -total / 2;
    for (let i = 0; i < chars.length; i++){
      const ch = chars[i], w = widths[i], lx = x + w / 2;
      g.save();
      g.translate(lx, (i % 2 ? -1 : 1) * fs * 0.018);
      g.rotate((i % 2 ? 1 : -1) * 0.03);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineJoin = 'round'; g.lineCap = 'round';
      const gr = g.createLinearGradient(-w * 0.5, -fs * 0.55, w * 0.5, fs * 0.45);
      gr.addColorStop(0, pal[(i + 1) % pal.length]);
      gr.addColorStop(0.5, pal[i % pal.length]);
      gr.addColorStop(1, pal[(i + 2) % pal.length]);
      g.save();
      g.shadowColor = 'rgba(18,10,20,0.55)';
      g.shadowBlur = fs * 0.12; g.shadowOffsetY = fs * 0.08;
      g.strokeStyle = '#19121b'; g.lineWidth = Math.max(3, fs * 0.2);
      g.strokeText(ch, 0, 0);
      g.restore();
      g.fillStyle = gr; g.fillText(ch, 0, 0);
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(0.9, fs * 0.03);
      g.strokeText(ch, -0.7, -1.1);
      g.restore();
      x += w + gap;
    }
    g.restore();
    return fs;
  }

  function heart(x, y, s, col){
    g.save();
    g.translate(x, y); g.scale(s, s);
    g.beginPath();
    g.moveTo(0, 0.36);
    g.bezierCurveTo(-0.18, 0.15, -0.62, -0.08, -0.62, -0.38);
    g.bezierCurveTo(-0.62, -0.66, -0.26, -0.73, 0, -0.44);
    g.bezierCurveTo(0.26, -0.73, 0.62, -0.66, 0.62, -0.38);
    g.bezierCurveTo(0.62, -0.08, 0.18, 0.15, 0, 0.36);
    g.closePath();
    g.fillStyle = col; g.fill();
    g.strokeStyle = 'rgba(30,18,28,0.85)'; g.lineWidth = 0.07; g.stroke();
    g.restore();
  }

  function star(x, y, s, col){
    g.save();
    g.translate(x, y);
    g.beginPath();
    for (let i = 0; i < 8; i++){
      const a = i * Math.PI / 4, r = i % 2 ? s * 0.34 : s;
      const px = Math.sin(a) * r, py = -Math.cos(a) * r;
      if (i) g.lineTo(px, py); else g.moveTo(px, py);
    }
    g.closePath(); g.fillStyle = col; g.fill();
    g.restore();
  }

  function note(x, y, s, col){
    g.save();
    g.translate(x, y); g.scale(s, s);
    g.fillStyle = col; g.strokeStyle = '#1a121b'; g.lineWidth = 0.07;
    g.beginPath(); g.ellipse(0, 0, 0.24, 0.17, -0.35, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = col; g.lineWidth = 0.09; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0.19, -0.02); g.lineTo(0.19, -1.0); g.quadraticCurveTo(0.36, -0.96, 0.48, -0.72); g.stroke();
    g.restore();
  }

  function gull(x, y, s, col){
    g.strokeStyle = col; g.lineWidth = 1.8; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - s, y);
    g.quadraticCurveTo(x - s * 0.45, y - s * 0.8, x, y - s * 0.12);
    g.quadraticCurveTo(x + s * 0.45, y - s * 0.8, x + s, y);
    g.stroke();
  }

  function textCell(i, words, pal){
    const [x0, y0] = cellXY(i);
    halo(x0 + 126, y0 + 62, 92, pal[0], 0.3);
    halo(x0 + 66, y0 + 42, 50, pal[1], 0.22);
    halo(x0 + 196, y0 + 84, 46, pal[2], 0.18);
    g.save();
    g.translate(x0 + 128, y0 + 64); g.rotate(-0.14);
    g.fillStyle = rgba(pal[1], 0.16); g.fillRect(-108, -26, 216, 9);
    g.fillStyle = rgba(pal[3], 0.13); g.fillRect(-102, 19, 204, 7);
    g.restore();
    dots(x0, y0, pal, 62);
    let lastY = 84;
    for (let k = 0; k < words.length; k++){
      const q = words[k];
      const fs = drawWord(q[0], x0 + q[1], y0 + q[2], q[3], q[4], pal);
      lastY = q[2] + fs * 0.42;
    }
    drips(x0, y0, pal, 7, lastY);
    dots(x0, y0, pal, 24);
  }

  // 0–5: sözler (her biri ayrı palet)
  textCell(0, [['İSTANBUL', 128, 62, 224, 62]], ['#ff3f8e', '#ffd23f', '#26d7e8', '#7c5cff']);
  textCell(1, [['MERHABA', 128, 62, 224, 62]], ['#ff7a1a', '#39d98a', '#2ea8ff', '#ffe03a']);
  textCell(2, [['SEVGİ', 128, 62, 196, 66]], ['#ff2e63', '#ff8ab3', '#ffd166', '#ff5f1f']);
  textCell(3, [['HAYAL', 128, 40, 214, 58], ['ET', 128, 88, 168, 46]], ['#9b5cff', '#31d0ff', '#ffd93d', '#ff6ec7']);
  textCell(4, [['SOKAK', 128, 62, 206, 64]], ['#28c76f', '#0ea5e9', '#f6e05e', '#ff7f50']);
  textCell(5, [['MÜZİK', 128, 62, 196, 64]], ['#e879f9', '#facc15', '#22d3ee', '#fb7185']);
  note(cellXY(5)[0] + 218, cellXY(5)[1] + 106, 13, '#facc15');
  note(cellXY(5)[0] + 38, cellXY(5)[1] + 28, 9, '#22d3ee');
  star(cellXY(3)[0] + 224, cellXY(3)[1] + 22, 7, '#ffd93d');
  star(cellXY(3)[0] + 30, cellXY(3)[1] + 102, 6, '#31d0ff');
  star(cellXY(0)[0] + 32, cellXY(0)[1] + 100, 5, '#ffd23f');

  // 6: oturan kedi ve kalpler
  {
    const [x0, y0] = cellXY(6);
    halo(x0 + 130, y0 + 62, 88, '#ff7a9a', 0.3);
    halo(x0 + 72, y0 + 42, 42, '#ffd166', 0.2);
    dots(x0, y0, ['#ff7a9a', '#ffd166', '#8ef0c0', '#ffffff'], 46);
    g.save();
    g.translate(x0, y0);
    g.fillStyle = 'rgba(255,224,120,0.32)';
    g.beginPath(); g.arc(196, 36, 32, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(40,30,50,0.16)';
    g.beginPath(); g.ellipse(132, 114, 68, 6, 0, 0, Math.PI * 2); g.fill();
    // kuyruk
    g.strokeStyle = '#2a2230'; g.lineWidth = 13; g.lineCap = 'round';
    g.beginPath(); g.moveTo(158, 102); g.bezierCurveTo(198, 105, 209, 82, 196, 60); g.stroke();
    // gövde ve patiler
    g.fillStyle = '#2a2230';
    g.beginPath(); g.ellipse(142, 83, 34, 30, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(158, 89, 24, 22, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(116, 89, 16, 24, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(110, 105, 7, 10, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(122, 106, 6.5, 9, 0, 0, Math.PI * 2); g.fill();
    // kafa ve kulaklar
    g.beginPath(); g.arc(129, 49, 22, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(112, 40); g.lineTo(107, 15); g.lineTo(127, 31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(141, 30); g.lineTo(155, 14); g.lineTo(153, 40); g.closePath(); g.fill();
    g.fillStyle = '#e98a9c';
    g.beginPath(); g.moveTo(112, 35); g.lineTo(110, 21); g.lineTo(121, 31); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(144, 30); g.lineTo(152, 20); g.lineTo(151, 35); g.closePath(); g.fill();
    // gözler
    g.fillStyle = '#a8ffd9';
    g.beginPath(); g.ellipse(121, 48, 3.1, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(137, 48, 3.1, 2.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#142026';
    g.beginPath(); g.arc(121.4, 48, 1.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(137.4, 48, 1.2, 0, Math.PI * 2); g.fill();
    // burun ve bıyıklar
    g.fillStyle = '#ff9ab0';
    g.beginPath(); g.moveTo(129, 54); g.lineTo(126, 57); g.lineTo(132, 57); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.72)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(126, 56); g.lineTo(110, 52); g.stroke();
    g.beginPath(); g.moveTo(126, 59); g.lineTo(109, 60); g.stroke();
    g.beginPath(); g.moveTo(132, 56); g.lineTo(148, 52); g.stroke();
    g.beginPath(); g.moveTo(132, 59); g.lineTo(149, 60); g.stroke();
    // tasma
    g.strokeStyle = '#ff5f7a'; g.lineWidth = 3;
    g.beginPath(); g.arc(130, 68, 17, 0.25, Math.PI - 0.25); g.stroke();
    g.restore();
    heart(x0 + 80, y0 + 28, 13, '#ff5f7a');
    heart(x0 + 102, y0 + 88, 8, '#ffd166');
    heart(x0 + 184, y0 + 76, 10, '#8ef0c0');
    heart(x0 + 195, y0 + 22, 9, '#ff9ab0');
    heart(x0 + 74, y0 + 70, 6, '#ffd166');
    heart(x0 + 208, y0 + 96, 7, '#ff5f7a');
    dots(x0, y0, ['#ff7a9a', '#ffd166', '#8ef0c0', '#ffffff'], 20);
  }

  // 7: martılar ve vapur
  {
    const [x0, y0] = cellXY(7);
    halo(x0 + 128, y0 + 66, 90, '#57cfe0', 0.26);
    dots(x0, y0, ['#57cfe0', '#8fd6ff', '#ffffff', '#ffcf5a'], 36);
    g.save();
    g.translate(x0, y0);
    const sky = g.createLinearGradient(0, 6, 0, 122);
    sky.addColorStop(0, 'rgba(168,221,255,0.88)');
    sky.addColorStop(1, 'rgba(232,248,255,0.88)');
    roundPath(6, 6, 244, 116, 11);
    g.fillStyle = sky; g.fill();
    g.strokeStyle = 'rgba(23,58,94,0.55)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#ffcf5a';
    g.beginPath(); g.arc(204, 34, 17, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e08a2a'; g.lineWidth = 1.3; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.72)';
    g.beginPath(); g.ellipse(58, 29, 22, 7, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(80, 25, 14, 6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(142, 30, 18, 6, 0, 0, Math.PI * 2); g.fill();
    g.save();
    roundPath(8, 86, 240, 34, 8); g.clip();
    const sea = g.createLinearGradient(0, 86, 0, 122);
    sea.addColorStop(0, '#37b6d3'); sea.addColorStop(1, '#126a93');
    g.fillStyle = sea; g.fillRect(8, 86, 240, 34);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.5;
    for (let w = 0; w < 5; w++){
      const wy = 91 + w * 6;
      g.beginPath(); g.moveTo(8, wy);
      for (let wx = 10; wx < 246; wx += 18) g.quadraticCurveTo(wx + 4, wy - 2.5, wx + 9, wy);
      g.stroke();
    }
    g.restore();
    // vapur
    g.strokeStyle = '#183348'; g.lineWidth = 1.6; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(47, 83); g.lineTo(198, 83); g.lineTo(184, 101); g.lineTo(63, 101); g.closePath();
    g.fillStyle = '#1d4f78'; g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(50, 88, 144, 4.5);
    roundPath(63, 68, 120, 15, 3); g.fillStyle = '#f7edd6'; g.fill(); g.stroke();
    roundPath(88, 53, 76, 15, 3); g.fillStyle = '#f7edd6'; g.fill(); g.stroke();
    g.fillStyle = '#33708f'; g.fillRect(61, 66, 124, 3); g.fillRect(86, 51, 80, 3);
    g.fillStyle = '#e05a45'; g.fillRect(116, 38, 10, 15);
    g.fillStyle = '#24303c'; g.fillRect(114, 36, 14, 4);
    g.strokeStyle = '#24303c'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(96, 53); g.lineTo(96, 42); g.stroke();
    g.fillStyle = '#2c5d7d';
    for (let wx = 70; wx < 176; wx += 11) g.fillRect(wx, 72, 6, 5);
    for (let wx = 94; wx < 160; wx += 9) g.fillRect(wx, 57, 5, 4);
    g.fillStyle = '#ffffff';
    for (let wx = 66; wx < 180; wx += 16){ g.beginPath(); g.arc(wx, 93, 2.1, 0, Math.PI * 2); g.fill(); }
    // duman
    g.fillStyle = 'rgba(240,245,250,0.7)';
    g.beginPath(); g.arc(130, 30, 5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(141, 24, 7, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(155, 20, 9, 0, Math.PI * 2); g.fill();
    // martılar
    gull(43, 44, 10, '#243447');
    gull(68, 56, 7, '#243447');
    gull(214, 60, 9, '#243447');
    gull(190, 76, 6, '#243447');
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.beginPath(); g.ellipse(43, 45, 3.4, 2, -0.15, 0, Math.PI * 2); g.fill();
    // köpük
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(44, 105); g.quadraticCurveTo(74, 111, 114, 105); g.stroke();
    g.beginPath(); g.moveTo(116, 107); g.quadraticCurveTo(152, 112, 196, 105); g.stroke();
    g.restore();
    dots(x0, y0, ['#57cfe0', '#8fd6ff', '#ffffff', '#ffcf5a'], 18);
  }

  const tex = kit.ctex(cv, 1, 1);
  const mat = new THREE.MeshStandardMaterial({map:tex, transparent:true, alphaTest:0.08, roughness:0.9,
    polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});

  /* ================= yerleşim yardımcıları ================= */
  const geos = [];
  const sideFace = (h, sign) => ({key:sign > 0 ? 'x+' : 'x-', rot:sign * Math.PI / 2,
    px:sign * (h.w / 2 + 0.03), pz:0, n:[sign, 0], t:[0, 1], span:h.d});
  const backFace = (h) => ({key:'z-', rot:Math.PI, px:0, pz:-h.d / 2 - 0.03, n:[0, -1], t:[1, 0], span:h.w});
  const frontFace = (h) => ({key:'z+', rot:0, px:0, pz:h.d / 2 + 0.03, n:[0, 1], t:[1, 0], span:h.w});

  // yüzün önündeki en yakın ev duvarına boşluk (m)
  function clearGap(h, f){
    const c = Math.cos(h.ry), s = Math.sin(h.ry);
    const nx = f.n[0] * c + f.n[1] * s, nz = -f.n[0] * s + f.n[1] * c;
    const tx = f.t[0] * c + f.t[1] * s, tz = -f.t[0] * s + f.t[1] * c;
    const fx = h.x + f.px * c + f.pz * s, fz = h.z - f.px * s + f.pz * c;
    let gap = 100;
    for (let i = 0; i < houseList.length; i++){
      const o = houseList[i];
      if (o === h) continue;
      const dx = o.x - fx, dz = o.z - fz;
      const along = dx * nx + dz * nz;
      if (along <= 0.02) continue;
      const lat = Math.abs(dx * tx + dz * tz);
      const oc = Math.cos(o.ry), os = Math.sin(o.ry);
      const en = Math.abs(oc * nx - os * nz) * o.w / 2 + Math.abs(os * nx + oc * nz) * o.d / 2;
      const et = Math.abs(oc * tx - os * tz) * o.w / 2 + Math.abs(os * tx + oc * tz) * o.d / 2;
      if (lat - et > f.span / 2 + 0.05) continue;
      const q = along - en;
      if (q < gap) gap = q;
    }
    return gap;
  }

  const faceUse = new Map();
  const useFace = (h, f) => {
    let s = faceUse.get(h);
    if (!s){ s = new Set(); faceUse.set(h, s); }
    s.add(f.key);
  };

  function pickFace(h){
    const opts = [];
    if (h.d >= 2.8){
      [1, -1].forEach(sign => {
        const f = sideFace(h, sign);
        if (clearGap(h, f) > 1.2) opts.push({f, wgt:0.62});
      });
    }
    if (h.w >= 2.8){
      const f = backFace(h);
      if (clearGap(h, f) > 1.1) opts.push({f, wgt:0.34});
    }
    if (!h.shop && h.w / 2 - 0.5 >= 2.2){
      const f = frontFace(h);
      if (clearGap(h, f) > 1.0) opts.push({f, wgt:0.08});
    }
    const used = faceUse.get(h);
    const avail = opts.filter(o => !used || !used.has(o.f.key));
    if (!avail.length) return null;
    let total = 0;
    for (let i = 0; i < avail.length; i++) total += avail[i].wgt;
    let q = rnd() * total;
    for (let i = 0; i < avail.length; i++){
      q -= avail[i].wgt;
      if (q <= 0) return avail[i].f;
    }
    return avail[avail.length - 1].f;
  }

  function planSpot(h, f){
    const room = f.key[0] === 'x' ? h.d : h.w;
    let wMax = Math.min(3.5, room - 0.5);
    if (f.key === 'z+') wMax = Math.min(3.5, h.w / 2 - 0.5);
    if (wMax < 2.2) return null;
    const w = 2.2 + rnd() * Math.max(0, wMax - 2.2);
    let tall = 1.1 + rnd() * 0.6, low = 0.3 + rnd() * 0.5, off = 0;
    if (f.key === 'z+'){
      tall = 1.1; low = 0.3;
      const min = w / 2 + 0.15, max = h.w / 2 - w / 2 - 0.15;
      if (max < min) return null;
      off = min + rnd() * (max - min);
    } else {
      const room2 = Math.max(0, (room - w) / 2 - 0.2);
      off = (rnd() * 2 - 1) * room2;
    }
    return {w, tall, low, off};
  }

  const hm = new THREE.Matrix4();
  function addFlat(h, f, off, low, w, tall, cell){
    const geo = new THREE.PlaneGeometry(w, tall);
    // atlas hücresi (kenarda 2 px pay: komşu hücreye taşma yok)
    const c = cell % 2, r = (cell / 2) | 0;
    const u0 = c * 0.5 + 2 / 512, u1 = (c + 1) * 0.5 - 2 / 512;
    const v1 = 1 - r * 0.25 - 2 / 512, v0 = 1 - (r + 1) * 0.25 + 2 / 512;
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
    geo.rotateY(f.rot);
    const lx = f.key[0] === 'x' ? f.px : f.px + off;
    const lz = f.key[0] === 'x' ? f.pz + off : f.pz;
    geo.translate(lx, low + tall / 2, lz);
    hm.makeRotationY(h.ry);
    hm.setPosition(h.x, h.base, h.z);
    geo.applyMatrix4(hm);
    geos.push(geo);
  }

  /* ================= Kadıköy'de iki büyük duvar resmi ================= */
  const muralPlan = [];
  for (let i = 0; i < houseList.length; i++){
    const h = houseList[i];
    if (!(h.x > 360 && h.z > 170) || h.d < 6.35) continue;
    const f1 = sideFace(h, 1), f2 = sideFace(h, -1);
    const g1 = clearGap(h, f1), g2 = clearGap(h, f2);
    if (g1 < 1.2 && g2 < 1.2) continue;
    muralPlan.push({h, f:g1 >= g2 ? f1 : f2, gap:Math.max(g1, g2)});
  }
  muralPlan.sort((a, b) => b.h.d - a.h.d || b.gap - a.gap);
  const murals = [];
  for (let i = 0; i < muralPlan.length && murals.length < 2; i++){
    const s = muralPlan[i];
    if (murals.some(o => Math.hypot(o.h.x - s.h.x, o.h.z - s.h.z) < 14)) continue;
    murals.push(s);
  }
  for (let i = 0; i < muralPlan.length && murals.length < 2; i++){
    if (murals.indexOf(muralPlan[i]) < 0) murals.push(muralPlan[i]);
  }
  // hiç uygun yan duvar yoksa arka duvarda dene (yine 6 x 3)
  if (murals.length < 2){
    for (let i = 0; i < houseList.length && murals.length < 2; i++){
      const h = houseList[i];
      if (!(h.x > 360 && h.z > 170) || h.w < 6.4) continue;
      if (murals.some(o => o.h === h)) continue;
      const f = backFace(h);
      if (clearGap(h, f) > 1.0) murals.push({h, f, gap:clearGap(h, f)});
    }
  }
  for (let i = 0; i < murals.length; i++){
    const s = murals[i], pair = i === 0 ? [6, 7] : [3, 5];
    addFlat(s.h, s.f, -1.5, 0.08, 3, 3, pair[0]);
    addFlat(s.h, s.f, 1.5, 0.08, 3, 3, pair[1]);
    useFace(s.h, s.f);
  }

  /* ================= ev seçimi: bölgelerin ~%40'ı ================= */
  const cand = [];
  for (let i = 0; i < houseList.length; i++){
    const h = houseList[i];
    if ((h.x < -190 && h.z > -340 && h.z < -140) ||
        (h.x < -320 && h.z > -30 && h.z < 140) ||
        (h.x > 360 && h.z > 170)) cand.push(h);
  }
  const chosen = [];
  for (let i = 0; i < cand.length; i++) if (rnd() < 0.4) chosen.push(cand[i]);
  if (!chosen.length && cand.length) chosen.push(cand[0]);

  const artOrder = [0, 1, 2, 3, 4, 5];
  for (let i = artOrder.length - 1; i > 0; i--){
    const j = (rnd() * (i + 1)) | 0, t = artOrder[i];
    artOrder[i] = artOrder[j]; artOrder[j] = t;
  }
  let artN = 0;
  const decoHouses = [];

  for (let i = 0; i < chosen.length; i++){
    const h = chosen[i];
    const count = rnd() < 0.32 ? 2 : 1;
    let made = 0;
    for (let k = 0; k < count; k++){
      const f = pickFace(h);
      if (!f) break;
      const s = planSpot(h, f);
      if (!s){ useFace(h, f); continue; }
      addFlat(h, f, s.off, s.low, s.w, s.tall, artOrder[artN++ % artOrder.length]);
      useFace(h, f);
      made++;
    }
    if (made && rnd() < 0.3) decoHouses.push(h);
  }

  /* ================= sokak detayları: çöp bidonu ve mama kabı ================= */
  function nearestFront(h){
    if (!fronts || !fronts.length) return null;
    const c = Math.cos(h.ry), s = Math.sin(h.ry);
    let best = null, bd = 1e9;
    for (let i = 0; i < fronts.length; i++){
      const f = fronts[i], dx = f.x - h.x, dz = f.z - h.z;
      const along = dx * s + dz * c, lat = Math.abs(dx * c - dz * s);
      if (along < h.d / 2 - 0.1 || along > h.d / 2 + 2.8 || lat > h.w / 2 + 0.8) continue;
      const d = dx * dx + dz * dz;
      if (d < bd){ bd = d; best = f; }
    }
    return bd < 100 ? best : null;
  }

  const binM = kit.mat(0x2f7a3a, {roughness:0.8});
  const lidM = kit.mat(0x225c2c, {roughness:0.7});
  const bowlM = kit.mat(0xb4663c, {roughness:0.85});
  const foodM = kit.mat(0xc89a5a, {roughness:0.95});

  for (let i = 0; i < decoHouses.length && i < 10; i++){
    const f = nearestFront(decoHouses[i]);
    if (!f) continue;
    const nx = Math.sin(f.ry), nz = Math.cos(f.ry);
    const tx = Math.cos(f.ry), tz = -Math.sin(f.ry);
    const bx = f.x + tx * 0.9 - nx * 0.6, bz = f.z + tz * 0.9 - nz * 0.6;
    if (landG(bx, bz) && inland(bx, bz, 0.4) && !kept(bx, bz, 0)){
      const by = Hs(bx, bz), G = reg(bx, bz);
      kit.add(new THREE.CylinderGeometry(0.27, 0.31, 0.82, 10), binM, bx, by + 0.41, bz, G);
      kit.add(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 10), lidM, bx, by + 0.855, bz, G);
      ctx.C.circle(bx, bz, 0.34).low = true;
    }
    const wx = f.x - tx * 0.8 - nx * 0.55, wz = f.z - tz * 0.8 - nz * 0.55;
    if (landG(wx, wz) && inland(wx, wz, 0.3) && !kept(wx, wz, 0)){
      const wy = Hs(wx, wz), G = reg(wx, wz);
      kit.add(new THREE.CylinderGeometry(0.2, 0.16, 0.09, 12), bowlM, wx, wy + 0.045, wz, G);
      kit.add(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 12), foodM, wx, wy + 0.09, wz, G);
      ctx.C.circle(wx, wz, 0.22).low = true;
    }
  }

  /* ================= tek mesh ================= */
  if (!geos.length) return;
  const merged = mergeBufferGeometries(geos);
  if (!merged) return;
  const mesh = new THREE.Mesh(merged, mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  keep(mesh);
  root.add(mesh);
}
