// Neon: bütün tabelalar tek bir canvas atlasında (tek malzeme), tüpler renk başına bir malzeme.
// Gece rastgele titreşim: parlaklık *= 0.85 + 0.15·sin(t·30 + tohum) (köşe başına tohum, tek uniform).
// Gerçek ışık yok; en fazla 6 PointLight oyuncuya en yakın tabelalara taşınır.

const FONT = '"Futura","Avenir Next","Trebuchet MS",sans-serif';

export function makeNeon(THREE, M){
  const lin = M.lin;
  const U = {uTime:{value:0}, uNight:{value:0}};
  const flicker = mat => {
    mat.userData.attrs = ['seed'];
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'attribute float seed;\nvarying float vNeonSeed;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vNeonSeed = seed;');
      sh.fragmentShader = 'uniform float uTime;\nuniform float uNight;\nvarying float vNeonSeed;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n  float fl = mix(1.0, (0.85 + 0.15 * sin(uTime * 30.0 + vNeonSeed)) * step(0.03, fract(sin(floor(uTime * 3.0) + vNeonSeed * 7.1) * 91.7)), uNight);\n  gl_FragColor.rgb *= (0.3 + 1.3 * uNight) * fl;');
    };
    mat.customProgramCacheKey = () => 'neon';
    return mat;
  };
  /* ---------- tabela atlası: 8×8 birim (128 px); pano 2×1, dikey 1×2 ---------- */
  const [c, g] = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 1024; return [cv, cv.getContext('2d')]; })();
  g.fillStyle = '#0a0a10'; g.fillRect(0, 0, 1024, 1024);
  const atlas = new THREE.CanvasTexture(c); atlas.encoding = THREE.sRGBEncoding; atlas.anisotropy = 4;
  const signMat = flicker(new THREE.MeshBasicMaterial({map:atlas, toneMapped:false}));
  M.neonSign = signMat;
  let nextBoard = 0, nextVert = 0;
  const css = hex => '#' + new THREE.Color(hex).getHexString();
  function drawText(x, y, w, h, text, color, vertical){
    g.save(); g.fillStyle = '#0c0a14'; g.fillRect(x, y, w, h);
    g.strokeStyle = css(color); g.lineWidth = 6; g.shadowColor = css(color); g.shadowBlur = 18; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (vertical){
      const ch = [...text], fs = Math.min(w * 0.7, (h - 30) / ch.length * 0.95); g.font = 'bold ' + fs + 'px ' + FONT;
      ch.forEach((k, i) => { g.shadowBlur = 22; g.fillStyle = css(color); g.fillText(k, x + w / 2, y + 20 + (i + 0.5) * (h - 40) / ch.length); g.shadowBlur = 0; g.fillStyle = '#fff8f0'; g.fillText(k, x + w / 2, y + 20 + (i + 0.5) * (h - 40) / ch.length); });
    } else {
      let fs = h * 0.55; do { g.font = 'bold ' + fs + 'px ' + FONT; fs -= 2; } while (g.measureText(text).width > w - 40);
      g.shadowBlur = 24; g.fillStyle = css(color); g.fillText(text, x + w / 2, y + h / 2 + 2); g.shadowBlur = 0; g.fillStyle = '#fff8f0'; g.fillText(text, x + w / 2, y + h / 2 + 2);
    }
    g.restore(); atlas.needsUpdate = true;
  }
  function slot(vertical){
    if (vertical){ const i = nextVert++ % 8; return [i * 128, 768, 128, 256]; }
    const i = nextBoard++ % 24; return [(i % 4) * 256, Math.floor(i / 4) * 128, 256, 128];
  }
  function planeFor(rect, w, h){
    const p = new THREE.PlaneGeometry(w, h), uv = p.attributes.uv, [x, y, sw, sh] = rect;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * sw) / 1024, 1 - (y + (1 - uv.getY(i)) * sh) / 1024);
    return p;
  }
  const lights = [];   // {x, y, z, color}
  const tubeMats = new Map();
  const tubeMat = hex => { if (!tubeMats.has(hex)){ const m = flicker(new THREE.MeshBasicMaterial({color:lin(hex), toneMapped:false})); tubeMats.set(hex, m); M['neon' + hex] = m; } return 'neon' + hex; };
  const seedAttr = (geo, v) => { const n = geo.attributes.position.count; geo.setAttribute('seed', new THREE.BufferAttribute(new Float32Array(n).fill(v), 1)); return geo; };
  let B = null;
  const api = {
    U, signMat, lights,
    bind(batcher){ B = batcher; },
    /** Yatay pano (yapının yerel koordinatında) + çevresinde neon tüp çerçeve */
    board(st, lx, ly, lz, text, color, w = 4, h = 1.4, ry = 0){
      const rect = slot(false); drawText(...rect, text, color, false);
      const seed = (st.seed % 13) + lx;
      [-1, 1].forEach(side => { const p = planeFor(rect, w, h); if (side < 0) p.rotateY(Math.PI); seedAttr(p, seed); st.part(B, 'mass', 'neonSign', p, lx, ly, lz + side * 0.06, ry); });
      st.part(B, 'mass', 'rail', new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.1), lx, ly, lz, ry);
      const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]].map(([a, b]) => new THREE.Vector3(a * 1.06, b * 1.12, 0.12));
      const tube = seedAttr(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.01), 40, 0.05, 5), seed);
      st.part(B, 'mass', tubeMat(color), tube, lx, ly, lz, ry);
      const [wx, wz] = st.world(lx, lz); lights.push({x:wx, y:st.y + ly, z:wz, color});
    },
    /** Dikey tabela (Miami oteli) */
    vertical(st, lx, ly, lz, text, color, h = 8){
      const rect = slot(true); drawText(...rect, text || 'HOTEL', color, true);
      const w = h / 2.2, p = seedAttr(planeFor(rect, w, h), st.seed % 13);
      const p2 = seedAttr(planeFor(rect, w, h), st.seed % 13); p2.rotateY(Math.PI);
      st.part(B, 'mass', 'neonSign', p, lx, ly, lz); st.part(B, 'mass', 'neonSign', p2, lx, ly, lz - 0.1);
      const [wx, wz] = st.world(lx, lz); lights.push({x:wx, y:st.y + ly, z:wz, color});
    },
    /** Serbest tüp şekli (yıldız, ok, halka): noktalar yerel düzlemde */
    tube(st, pts2, lx, ly, lz, ry, color, r = 0.06){
      const pts = pts2.map(([a, b]) => new THREE.Vector3(a, b, 0));
      const t = seedAttr(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.01), pts.length * 6, r, 5), st.seed % 13);
      st.part(B, 'mass', tubeMat(color), t, lx, ly, lz, ry);
    },
    /** Times Square tipi büyük ekran: atlas panosu, ışıksız çerçeve */
    billboard(st, lx, ly, lz, ry, text, color, w, h){
      const rect = slot(false); drawText(...rect, text, color, false);
      const p = seedAttr(planeFor(rect, w, h), st.seed % 13 + ly);
      st.part(B, 'mass', 'neonSign', p, lx, ly, lz, ry);
      st.part(B, 'far', 'neonSign', seedAttr(planeFor(rect, w, h), 0), lx, ly, lz, ry);
      const [wx, wz] = st.world(lx, lz); lights.push({x:wx, y:st.y + ly, z:wz, color});
    },
  };
  return api;
}

/** Gece neon ışıkları: oyuncuya en yakın N tabelaya taşınan sabit sayıda PointLight (shader yeniden derlenmesin diye hep açık, yoğunluk 0). */
export function neonLights(THREE, parent, lights, n = 6){
  const pool = Array.from({length:n}, () => { const l = new THREE.PointLight(0xffffff, 0, 16, 2); parent.add(l); return l; });
  let timer = 0;
  return (dt, hero, night) => {
    timer -= dt;
    if (timer <= 0){
      timer = 0.5;
      const near = lights.map(L => [L, (L.x - hero.pos.x) ** 2 + (L.z - hero.pos.z) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, n);
      pool.forEach((l, i) => { const L = near[i] && near[i][0]; if (!L){ l.intensity = 0; return; } l.position.set(L.x, L.y, L.z); l.color.setHex(L.color).convertSRGBToLinear(); });
    }
    pool.forEach(l => { l.intensity = night * 4; });
  };
}
