// Malzeme fabrikası: paylaşılan malzemeler ve canvas dokular burada bir kez üretilip önbelleğe alınır.
// Renk yönetimi "legacy": hex renkler sRGB düşünülür, lin() ile doğrusala çevrilir (sanctuary.js'deki fix() deseni).
//
// Cephe atlası: 4×4 pencere çeşidi tek dokuda. Cephe kutularında uv = (pencere bölmesi sayısı); gölgelendirici her bölmeyi
// fract(uv) ile kendi atlas hücresine eşler (textureGrad: mip dikişi yok). İkinci (maske) atlasta R = gece yanabilen cam,
// G = boyanabilir duvar: duvar köşe rengiyle (tint) boyanır, cam ve pervaz boyanmaz. Gece, tohumlu karma ile camların %35'i yanar.

export const CELL = {
  artDeco:0, glass:1, chicago:2, brownstone:3, brick:4, victorian:5, nola:6, miami:7,
  office:8, shop:9, adobe:10, marble:11, blank:12, steel:13, decoTop:14, roof:15,
};

export function makeMaterials(THREE){
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (w, h, fn, rep = [1, 1], srgb = true) => { const [c, g] = canvas(w, h); fn(g, w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 4; return t; };
  let seed = 9091; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const cache = new Map();
  const solid = (hex, o = {}) => { const k = hex + JSON.stringify(o); if (!cache.has(k)) cache.set(k, new THREE.MeshStandardMaterial(Object.assign({roughness:0.7}, o, {color:lin(hex)}))); return cache.get(k); };

  /* ================= cephe atlası ================= */
  const S = 128, rgba = (r, g, b, a = 1) => `rgba(${r},${g},${b},${a})`;
  function drawCell(g, k, lit){
    const ox = (k % 4) * S, oy = Math.floor(k / 4) * S;
    g.save(); g.translate(ox, oy); g.beginPath(); g.rect(0, 0, S, S); g.clip();
    const glass = (x, y, w, h, tone = [38, 52, 66]) => { if (lit){ g.fillStyle = '#ff0000'; g.fillRect(x, y, w, h); return; } const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, rgba(tone[0] + 40, tone[1] + 50, tone[2] + 60)); gr.addColorStop(1, rgba(...tone)); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    const frame = (x, y, w, h, c) => { g.fillStyle = lit ? '#000000' : c; g.fillRect(x, y, w, h); };
    const wall = (c, f, tintable = true) => { if (lit){ g.fillStyle = tintable ? '#00ff00' : '#000000'; g.fillRect(0, 0, S, S); return; } g.fillStyle = c; g.fillRect(0, 0, S, S); if (f) f(); };
    const grain = (n, a) => { if (lit) return; for (let i = 0; i < n; i++){ const v = 120 + rnd() * 100; g.fillStyle = rgba(v, v, v, a); g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2); } };
    switch (k){
      case CELL.artDeco: wall('#ffffff', () => { grain(120, 0.08); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 0, 14, S); g.fillRect(S - 14, 0, 14, S); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(30, 88, 68, 18); }); glass(30, 12, 68, 72); frame(62, 12, 4, 72, '#c8c8c8'); break;
      case CELL.decoTop: wall('#ffffff', () => { grain(100, 0.08); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 5; g.beginPath(); for (let x = 0; x <= S; x += 32){ g.moveTo(x, 110); g.lineTo(x + 16, 92); g.lineTo(x + 32, 110); } g.stroke(); }); glass(40, 14, 48, 64); break;
      case CELL.glass: wall('#ffffff'); glass(0, 0, S, S, [44, 64, 84]); for (let x = 0; x < S; x += 32) frame(x, 0, 3, S, '#9aa4ae'); frame(0, 0, S, 4, '#9aa4ae'); frame(0, 64, S, 3, '#9aa4ae'); break;
      case CELL.chicago: wall('#ffffff', () => { grain(80, 0.1); }); glass(10, 18, 108, 70); frame(40, 18, 5, 70, '#d8d0c0'); frame(83, 18, 5, 70, '#d8d0c0'); break;
      case CELL.brownstone: wall('#ffffff', () => { grain(200, 0.12); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(28, 8, 72, 12); g.fillRect(30, 102, 68, 8); }); glass(36, 22, 56, 78); frame(62, 22, 4, 78, '#2a1e18'); frame(36, 58, 56, 4, '#2a1e18'); break;
      case CELL.brick: {
        wall('#d9cfc0', () => { for (let y = 0; y < S; y += 8) for (let x = -((y / 8) % 2) * 6, i = 0; x < S; x += i % 2 ? 8 : 16, i++){ const hdr = i % 2 === 1, v = rnd() * 30; g.fillStyle = `rgb(${150 + v | 0},${70 + v * 0.5 | 0},${50 + v * 0.3 | 0})`; g.fillRect(x + 1, y + 1, hdr ? 6 : 14, 6); } }, false);
        frame(34, 14, 60, 92, '#f2efe8'); glass(40, 20, 48, 80); frame(63, 20, 3, 80, '#f2efe8'); frame(40, 46, 48, 3, '#f2efe8'); frame(40, 72, 48, 3, '#f2efe8');
        frame(16, 14, 16, 92, '#1d1d1f'); frame(96, 14, 16, 92, '#1d1d1f'); break;
      }
      case CELL.victorian: wall('#ffffff', () => { for (let y = 0; y < S; y += 8){ g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, y, S, 1); } }); frame(38, 6, 52, 108, '#f8f6f0'); glass(44, 16, 40, 88); frame(62, 16, 4, 88, '#f8f6f0'); frame(32, 2, 64, 8, '#f8f6f0'); break;
      case CELL.nola: wall('#ffffff', () => { grain(140, 0.1); }); glass(44, 10, 40, 108); frame(62, 10, 4, 108, '#2f5a3a'); frame(20, 10, 22, 108, '#2f5a3a'); frame(86, 10, 22, 108, '#2f5a3a'); if (!lit){ g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 14; y < 116; y += 6){ g.fillRect(22, y, 18, 2); g.fillRect(88, y, 18, 2); } } break;
      case CELL.miami: wall('#ffffff', () => { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 18, S, 8); g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 26, S, 4); }); glass(16, 36, 96, 52, [40, 70, 90]); frame(62, 36, 4, 52, '#fafafa'); break;
      case CELL.office: wall('#ffffff', () => { grain(60, 0.08); }); glass(14, 22, 100, 60); frame(46, 22, 3, 60, '#b8b8b8'); frame(80, 22, 3, 60, '#b8b8b8'); break;
      case CELL.shop: wall('#ffffff', () => { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, S, 22); }); glass(8, 30, 112, 98, [30, 40, 46]); frame(62, 30, 4, 98, '#2a2a2a'); break;
      case CELL.adobe: wall('#ffffff', () => { grain(220, 0.1); }); glass(48, 30, 32, 40); frame(44, 26, 40, 4, '#6a4a2a'); break;
      case CELL.marble: wall('#ffffff', () => { g.strokeStyle = 'rgba(120,120,120,.35)'; g.lineWidth = 1; for (let i = 0; i < 6; i++){ g.beginPath(); let x = rnd() * S, y = 0; g.moveTo(x, y); while (y < S){ x += (rnd() - 0.5) * 18; y += 8 + rnd() * 10; g.lineTo(x, y); } g.stroke(); } g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 0; y < S; y += 32) g.fillRect(0, y, S, 1); }); break;
      case CELL.blank: wall('#ffffff', () => grain(80, 0.06)); break;
      case CELL.steel: wall('#ffffff'); glass(0, 0, S, S, [30, 36, 44]); frame(0, 0, 6, S, '#3a4048'); frame(0, 0, S, 6, '#3a4048'); break;
      case CELL.roof: wall('#ffffff', () => grain(500, 0.25)); break;
    }
    g.restore();
  }
  const atlasCanvas = (lit) => { const [c, g] = canvas(512, 512); for (let k = 0; k < 16; k++) drawCell(g, k, lit); return c; };
  const atlas = new THREE.CanvasTexture(atlasCanvas(false)); atlas.encoding = THREE.sRGBEncoding; atlas.anisotropy = 8;
  const atlasLit = new THREE.CanvasTexture(atlasCanvas(true)); atlasLit.anisotropy = 4;     // maske: doğrusal kalır
  const night = {value:0};
  function facadeMat(o = {}){
    const m = new THREE.MeshStandardMaterial(Object.assign({map:atlas, emissiveMap:atlasLit, emissive:new THREE.Color(1, 0.62, 0.3), emissiveIntensity:0.85, roughness:0.7, metalness:0.05}, o));
    m.onBeforeCompile = sh => {
      sh.uniforms.uNight = night;
      sh.vertexShader = 'attribute vec2 cell;\nattribute vec3 tint;\nattribute float seed;\nvarying vec2 vCell;\nvarying vec3 vTint;\nvarying float vSeed;\n'
        + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n  vCell = cell; vTint = tint; vSeed = seed;');
      sh.fragmentShader = 'uniform float uNight;\nvarying vec2 vCell;\nvarying vec3 vTint;\nvarying float vSeed;\nfloat facHash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n'
        + sh.fragmentShader
          .replace('#include <map_fragment>', `
            vec2 aUv = vCell + (fract(vUv) * 0.96 + 0.02) * 0.25;
            vec2 aGx = dFdx(vUv) * 0.25, aGy = dFdy(vUv) * 0.25;
            vec4 fTex = textureGrad(map, aUv, aGx, aGy), aMask = textureGrad(emissiveMap, aUv, aGx, aGy);
            fTex.rgb = mix(fTex.rgb, fTex.rgb * vTint, aMask.g);
            diffuseColor.rgb *= fTex.rgb;`)
          .replace('#include <emissivemap_fragment>', `
            float lit = step(facHash(floor(vUv) + vec2(vSeed, vSeed * 1.7)), 0.35) * uNight;
            totalEmissiveRadiance *= aMask.r * lit;`);
    };
    m.customProgramCacheKey = () => 'amerikaCephe';
    return m;
  }
  const facade = facadeMat();

  /* ================= anıt ve yapı malzemeleri ================= */
  const patinaTex = tex(256, 256, (g) => {
    g.fillStyle = '#5fa38f'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++){ const x = rnd() * 256, y = rnd() * 200, l = 30 + rnd() * 120, w = 2 + rnd() * 6, gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(62,125,108,.7)'); gr.addColorStop(1, 'rgba(62,125,108,0)'); g.fillStyle = gr; g.fillRect(x, y, w, l); }
    for (let i = 0; i < 400; i++){ g.fillStyle = `rgba(${rnd() < 0.5 ? '120,190,170' : '40,90,80'},.25)`; g.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  });
  const veinTex = tex(256, 256, (g) => {
    g.fillStyle = '#eeeae2'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(140,140,140,.4)'; for (let i = 0; i < 9; i++){ g.lineWidth = 0.6 + rnd() * 1.4; g.beginPath(); let x = rnd() * 256, y = 0; g.moveTo(x, y); while (y < 256){ x += (rnd() - 0.5) * 30; y += 6 + rnd() * 14; g.lineTo(x, y); } g.stroke(); }
  });
  const graniteTex = tex(256, 256, (g) => {
    g.fillStyle = '#b9b4ac'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++){ const v = 140 + rnd() * 80; g.fillStyle = `rgba(${v | 0},${v * 0.98 | 0},${v * 0.95 | 0},.5)`; g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2); }
    g.strokeStyle = '#8f8a83'; for (let i = 0; i < 14; i++){ g.lineWidth = 1 + rnd() * 2; g.beginPath(); let x = rnd() * 256, y = rnd() * 256; g.moveTo(x, y); for (let k = 0; k < 6; k++){ x += (rnd() - 0.5) * 40; y += rnd() * 30; g.lineTo(x, y); } g.stroke(); }
  });
  const brickTex = tex(256, 256, (g) => {
    g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, 256, 256);
    // Flaman örgü: her sırada bir uzun (sedye) bir kısa (başlık) tuğla, sıralar yarım kaydırılmış
    for (let y = 0, r = 0; y < 256; y += 10, r++) for (let x = -(r % 2) * 12, i = 0; x < 256; i++){ const hdr = i % 2 === 1, w = hdr ? 10 : 22, v = rnd() * 30; g.fillStyle = hdr ? `rgb(${128 + v | 0},${58 + v * 0.4 | 0},${44 | 0})` : `rgb(${156 + v | 0},${74 + v * 0.5 | 0},${54 + v * 0.3 | 0})`; g.fillRect(x + 1, y + 1, w, 8); x += w + 2; }
  }, [1, 1]);
  const ironTex = tex(128, 64, (g) => {
    g.clearRect(0, 0, 128, 64); g.strokeStyle = '#ffffff'; g.lineWidth = 3;
    g.strokeRect(2, 2, 124, 60); for (let x = 8; x < 128; x += 8){ g.beginPath(); g.moveTo(x, 4); g.lineTo(x, 60); g.stroke(); }
    g.lineWidth = 2; for (let x = 16; x < 128; x += 32){ g.beginPath(); g.arc(x, 18, 9, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(x - 9, 46); g.quadraticCurveTo(x, 30, x + 9, 46); g.stroke(); }
  }, [1, 1], false);
  const M = {
    lin, solid, facade, night, atlas, atlasLit, tex, canvas, rnd,
    patina:new THREE.MeshStandardMaterial({map:patinaTex, metalness:0.35, roughness:0.55}),
    flame:new THREE.MeshBasicMaterial({color:lin(0xffc35a), toneMapped:false}),
    gilt:solid(0xd4af37, {metalness:1, roughness:0.25}), bronzeDark:solid(0x4a3a26, {metalness:0.8, roughness:0.4}),
    steel:solid(0x8a9099, {metalness:0.9, roughness:0.35}),
    curtain:solid(0x2b3d4f, {metalness:0.5, roughness:0.08, envMapIntensity:1.4}),
    stainless:solid(0xd0d4d8, {metalness:1.0, roughness:0.16}),
    orange:solid(0xc0362c, {roughness:0.6}),
    yule:new THREE.MeshStandardMaterial({map:veinTex, roughness:0.3}),
    obeliskLow:solid(0xe9e3d6, {roughness:0.4}), obeliskHigh:solid(0xdcd5c6, {roughness:0.42}),
    granite:new THREE.MeshStandardMaterial({map:graniteTex, roughness:0.95, flatShading:true}),
    graniteSmooth:new THREE.MeshStandardMaterial({map:graniteTex, roughness:0.95}),
    brick:new THREE.MeshStandardMaterial({map:brickTex, roughness:0.85}),
    brownstone:solid(0x6b4a3a, {roughness:0.85}),
    iron:solid(0x1b1b1d, {roughness:0.5, metalness:0.6}),
    ironwork:new THREE.MeshStandardMaterial({map:ironTex, color:lin(0x1b1b1d), alphaTest:0.5, side:THREE.DoubleSide, roughness:0.5, metalness:0.5}),
    trim:solid(0xf2efe8, {roughness:0.6}), shutter:solid(0x1d1d1f, {roughness:0.6}), limestone:solid(0xd8cfbf, {roughness:0.75}),
    // yol yüzeyleri zemin ağının üstünde çizilsin (eğimde zemin üçgenleriyle yol örneklemesi tam örtüşmez)
    asphalt:solid(0x3e3e40, {roughness:0.95, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-4}),
    lane:solid(0xe8c04a, {roughness:0.8, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-8}),
    sidewalk:solid(0xb8b4ac, {roughness:0.9, polygonOffset:true, polygonOffsetFactor:-3, polygonOffsetUnits:-6}),
    park:solid(0x5f8f3a, {roughness:1}), sand:solid(0xe6d6b0, {roughness:1}), desert:solid(0xc89a62, {roughness:1}),
    water:new THREE.MeshStandardMaterial({color:lin(0x24566a), roughness:0.05, metalness:0.3, transparent:true, opacity:0.9}),
    glassLobby:solid(0x22303a, {metalness:0.5, roughness:0.08}),
    chrome:solid(0xd8dce0, {metalness:1, roughness:0.12}),
    rail:solid(0x4a4e52, {metalness:0.6, roughness:0.5}),
    wood:solid(0x6b4a2e, {roughness:0.85}), white:solid(0xfafafa, {roughness:0.6}),
  };
  return M;
}
