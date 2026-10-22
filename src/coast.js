// Ada kıyısı: merkezden açıya göre yarıçapı veren kapalı bir kıyı çizgisi, onun üstüne kurulan zemin diski,
// kumsal halkası, kıyı otları, kayalar, okyanus, iskele ve "kıyıdan öteye yürünmez" sınırı.
// Lumière (Fransız adası, sea.js) ve katkıcı adaları (src/islands/*) aynı kodu kullanır.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Kıyı çizgisi. Açı a = atan2(x - cx, z - cz): 0 güney (+z), π/2 doğu (+x).
 *  radius  ortalama yarıçap (m)
 *  waves   [[n, genlik, faz], ...] büyük girinti/çıkıntılar (n tam sayı olmalı ki eğri kapansın)
 *  flat    {angle, dist}: o yönde merkezden dist uzaklıkta düz bir kumsal (yumuşak birleşir)
 *  ripple  [[n, genlik, faz], ...] küçük dalgalanmalar
 */
export function makeCoast({cx = 0, cz = 0, radius = 300, waves = [[3, 14, 0.7], [5, 8, 2.1], [11, 4, 0.4]], flat = null, ripple = [[10, 5, 0], [25, 2, 1.3]], soft = 30} = {}){
  const sum = (list, a) => list.reduce((s, [n, A, p]) => s + A * Math.sin(n * a + p), 0);
  const R = a => {
    const rc = radius + sum(waves, a);
    let rf = 1e5; if (flat){ const c = Math.cos(a - flat.angle); if (c > 0.02) rf = flat.dist / c; }
    const m = Math.min(rc, rf);
    return m - soft * Math.log(Math.exp(-(rc - m) / soft) + Math.exp(-(rf - m) / soft)) + sum(ripple, a);
  };
  const angle = (x, z) => Math.atan2(x - cx, z - cz);
  /** Kıyıya işaretli uzaklık: + deniz tarafı, - kara tarafı. */
  const dist = (x, z) => Math.hypot(x - cx, z - cz) - R(angle(x, z));
  const point = (a, off = 0) => { const r = R(a) + off; return [cx + Math.sin(a) * r, cz + Math.cos(a) * r]; };
  const f = v => Number(v).toFixed(5);
  const terms = list => list.map(([n, A, p]) => ` + ${f(A)} * sin(${f(n)} * a + ${f(p)})`).join('');
  const glsl = `
    float coastR(vec2 p){
      vec2 d = p - vec2(${f(cx)}, ${f(cz)}); float a = atan(d.x, d.y);
      float rc = ${f(radius)}${terms(waves)};
      float rf = 1e5;${flat ? ` { float c = cos(a - ${f(flat.angle)}); if (c > 0.02) rf = ${f(flat.dist)} / c; }` : ''}
      float m = min(rc, rf);
      return m - ${f(soft)} * log(exp(-(rc - m) / ${f(soft)}) + exp(-(rf - m) / ${f(soft)}))${terms(ripple)};
    }
    float coastDist(vec2 p){ return length(p - vec2(${f(cx)}, ${f(cz)})) - coastR(p); }`;
  return {cx, cz, R, dist, angle, point, glsl, radius};
}

/* ---------- paylaşılan dokular ---------- */
const shared = new WeakMap();
function sharedFor(world){
  if (shared.has(world)) return shared.get(world);
  const { THREE } = world;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  let seed = 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const [sc, sg] = canvas(256, 256);
  sg.fillStyle = '#d9c7a0'; sg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++){ const v = 170 + rnd() * 70; sg.fillStyle = `rgba(${v | 0},${v * 0.9 | 0},${v * 0.72 | 0},.45)`; sg.fillRect(rnd() * 256, rnd() * 256, 1.4, 1.4); }
  for (let i = 0; i < 40; i++){ sg.strokeStyle = 'rgba(150,125,90,.12)'; sg.lineWidth = 2; sg.beginPath(); const y = rnd() * 256; sg.moveTo(0, y); for (let x = 0; x <= 256; x += 16) sg.lineTo(x, y + Math.sin(x / 20 + i) * 3); sg.stroke(); }
  const sandTex = new THREE.CanvasTexture(sc); sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.encoding = THREE.sRGBEncoding; sandTex.anisotropy = 8;
  const waterNormal = new THREE.TextureLoader().load('assets/textures/su_normal.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
  const s = {sandTex, waterNormal, canvas};
  shared.set(world, s); return s;
}

/** Sandal ya da yelkenli (k: ölçek). */
export function makeBoat(world, k, sail, hullColor){
  const { THREE } = world;
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:lin(hullColor || (sail ? 0x3a2a20 : 0x5a3a24)), roughness:0.7});
  const prof = [];
  for (let i = 0; i <= 10; i++){ const t = i / 10; prof.push(new THREE.Vector2(Math.sin(t * Math.PI) * 1.0 + 0.02, t * 2 - 1)); }
  const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, 16, Math.PI * 0.5, Math.PI), hullMat);
  hull.rotation.set(Math.PI / 2, 0, 0); hull.scale.set(1.0 * k, 3.6 * k, 0.75 * k); hull.position.y = 0.55 * k; g.add(hull);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.85 * k, 0.06, 6.4 * k), new THREE.MeshStandardMaterial({color:lin(0x9a7a52), roughness:0.8})); deck.position.y = 0.55 * k; g.add(deck);
  if (sail){
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * k, 0.1 * k, 9 * k, 8), hullMat); mast.position.set(0, 5 * k, 0.4 * k); g.add(mast);
    const sm = new THREE.MeshStandardMaterial({color:lin(0xf2ead8), roughness:0.85, side:THREE.DoubleSide});
    const main = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 6, 6), sm);
    const p = main.geometry.attributes.position;
    for (let i = 0; i < p.count; i++){ const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5; p.setXYZ(i, Math.sin(u * Math.PI) * 0.35 * (1 - v * 0.5), v * 7.4 * k + 1.0 * k, -u * 3.6 * k * (1 - v * 0.7)); }
    main.geometry.computeVertexNormals(); main.position.z = 0.25 * k; g.add(main);
    const jib = new THREE.Mesh(new THREE.BufferGeometry(), sm);
    jib.geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 8.8 * k, 0.4 * k, 0, 1.0 * k, 0.5 * k, 0.3 * k, 1.0 * k, 3.2 * k], 3)); jib.geometry.computeVertexNormals(); g.add(jib);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * k, 0.5 * k), new THREE.MeshStandardMaterial({color:lin(0x1d3a8a), side:THREE.DoubleSide})); flag.position.set(0, 9.4 * k, 0.0); flag.rotation.y = Math.PI / 2; g.add(flag);
    g.userData.flag = flag.material;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/**
 * Bir kıyı çizgisinin üstüne adayı kurar.
 *  opts.ground   zemin malzemesi (verilmezse dünyanın çimi)
 *  opts.sand     kumsal rengi, opts.grass kıyı otu rengi, opts.rocks kaya sayısı
 *  opts.shallow / opts.deep  sığ ve derin su rengi
 * Dönüş: {root, dist, addPier, boats, update}
 */
export function buildIslandTerrain(world, C, coast, opts = {}){
  const { THREE, scene } = world;
  const S = sharedFor(world);
  const root = new THREE.Group(); root.name = opts.name || 'Ada'; scene.add(root);
  let seed = opts.seed || 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  const uT = {value:0}, uDark = {value:0};
  const SEA_Y = -0.22, NA = 900;
  const boats = [], walkways = [];
  const {cx, cz} = coast;

  /* ---------- zemin: kıyının 16 m gerisinde biten disk ---------- */
  {
    const NR = 40, NG = 360, pos = [], uv = [], idx = [];
    for (let j = 0; j <= NR; j++){
      const t = Math.pow(j / NR, 0.75);
      for (let i = 0; i <= NG; i++){
        const a = i / NG * Math.PI * 2, r = (coast.R(a) - 16) * t, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
        pos.push(x, 0, z); uv.push((x + 1200) / 2400, (1200 - z) / 2400);
      }
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NG; i++){ const a = j * (NG + 1) + i, b = a + NG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, k) => k % 3 === 1 ? 1 : 0), 3));
    const ground = new THREE.Mesh(g, opts.ground || world.materials.groundMat); ground.receiveShadow = true; ground.name = 'Zemin'; root.add(ground);
  }

  /* ---------- kumsal halkası ---------- */
  const sandMat = new THREE.MeshStandardMaterial({map:S.sandTex, color:opts.sand || 0x9c8c70, roughness:0.95, vertexColors:true});
  {
    const rows = [[-18.4, 0.035], [-1.2, 0.035], [2.5, -0.55], [9, -1.6], [40, -4]];
    const pos = [], uv = [], col = [], idx = [];
    for (let i = 0; i <= NA; i++){
      const a = i / NA * Math.PI * 2, s = coast.R(a);
      rows.forEach(([dr, y], r) => {
        const rr = s + dr + (r === 0 ? Math.sin(a * 140) * 1.4 + Math.sin(a * 340) * 0.7 : 0);
        const x = cx + Math.sin(a) * rr, z = cz + Math.cos(a) * rr;
        pos.push(x, y, z); uv.push(x / 7, z / 7);
        const wet = r >= 2 ? 0.62 : r === 1 ? 0.85 : 1.0, green = r === 0 ? 0.88 : 1;
        col.push(wet * green, wet, wet * green);
      });
    }
    const RW = rows.length;
    for (let i = 0; i < NA; i++) for (let r = 0; r < RW - 1; r++){ const a = i * RW + r, b = a + RW; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const sand = new THREE.Mesh(g, sandMat); sand.receiveShadow = true; root.add(sand);
  }
  // kıyı otları ve kayalar
  {
    const blade = new THREE.ConeGeometry(0.03, 0.7, 3); blade.translate(0, 0.35, 0);
    const N = 3600, grass = new THREE.InstancedMesh(blade, world.windMat(new THREE.MeshLambertMaterial({color:lin(opts.grass || 0x9aa463)}), 1.6, false), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), c = new THREE.Color();
    let n = 0;
    for (let k = 0; k < 170 && n < N; k++){
      const a = rnd() * Math.PI * 2, [px, pz] = coast.point(a, -12 + rnd() * 9);
      for (let i = 0; i < 22 && n < N; i++){
        const sc2 = 0.6 + rnd() * 0.8; e.set((rnd() - 0.5) * 0.6, rnd() * 6, (rnd() - 0.5) * 0.6);
        m4.compose(new THREE.Vector3(px + (rnd() - 0.5) * 3, 0, pz + (rnd() - 0.5) * 2.5), q.setFromEuler(e), s.set(sc2, sc2, sc2)); grass.setMatrixAt(n, m4);
        c.setHSL(0.15 + rnd() * 0.05, 0.3, 0.45 + rnd() * 0.15); grass.setColorAt(n, c); n++;
      }
    }
    grass.count = n; root.add(grass);
    const rockMat = new THREE.MeshStandardMaterial({color:lin(0x77726b), roughness:0.85, flatShading:true});
    const rockG = new THREE.SphereGeometry(1, 7, 5);
    for (let i = 0; i < (opts.rocks ?? 40); i++){
      const a = rnd() * Math.PI * 2, [x, z] = coast.point(a, 1 + rnd() * 8), sz = 0.6 + rnd() * 1.8;
      const r = new THREE.Mesh(rockG, rockMat); r.position.set(x, -0.3 + sz * 0.25, z); r.scale.set(sz * (0.8 + rnd() * 0.6), sz * 0.6, sz); r.rotation.set(rnd(), rnd() * 6, rnd()); r.castShadow = true; root.add(r);
      r.userData.rock = true;
    }
  }

  /* ---------- okyanus: adanın çevresinde kutupsal ızgara ---------- */
  const seaMat = new THREE.MeshStandardMaterial({color:lin(0x0f4a62), roughness:0.09, metalness:0.0, envMapIntensity:1.25});
  {
    const NG = 360, NR = 120, RMAX = 3200;
    const pos = new Float32Array((NG + 1) * (NR + 1) * 3), uvs = new Float32Array((NG + 1) * (NR + 1) * 2), idx = [];
    for (let j = 0; j <= NR; j++) for (let i = 0; i <= NG; i++){
      const a = i / NG * Math.PI * 2, r0 = coast.R(a) - 14, t = j / NR, r = r0 + Math.pow(t, 2.3) * (RMAX - r0), k = j * (NG + 1) + i;
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      pos[k * 3] = x; pos[k * 3 + 1] = SEA_Y; pos[k * 3 + 2] = z; uvs[k * 2] = x / 9; uvs[k * 2 + 1] = z / 9;
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NG; i++){ const a = j * (NG + 1) + i, b = a + NG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const shallow = {value:lin(opts.shallow || 0x2a9a9a)}, deep = {value:lin(opts.deep || 0x06283c)}, foamC = {value:new THREE.Color(0.95, 0.97, 1.0)};
    seaMat.normalMap = S.waterNormal; seaMat.normalScale.set(0.55, 0.55);
    seaMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, {uT, uShallow:shallow, uDeep:deep, uFoam:foamC, uDark});
      const head = coast.glsl + `
        vec3 wave(vec2 p, float t){
          // yönlü dalgalar: yükseklik ve türevleri
          vec3 r = vec3(0.0);
          vec4 dirs[4]; dirs[0] = vec4(0.12, 0.99, 0.55, 0.42); dirs[1] = vec4(-0.45, 0.89, 0.30, 0.75); dirs[2] = vec4(0.70, 0.71, 0.16, 1.30); dirs[3] = vec4(-0.2, 0.98, 0.09, 2.10);
          for (int i = 0; i < 4; i++){
            vec2 d = normalize(dirs[i].xy); float a = dirs[i].z, k = dirs[i].w * 0.35, w = sqrt(9.8 * k);
            float ph = dot(d, p) * k - t * w;
            r.x += a * sin(ph); r.y += a * k * cos(ph) * d.x; r.z += a * k * cos(ph) * d.y;
          }
          return r;
        }
        varying float vDist; varying vec3 vWP;\n`;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uT;\n' + head)
        .replace('#include <beginnormal_vertex>', `
          float dist0 = coastDist(position.xz);
          float amp0 = smoothstep(-2.0, 30.0, dist0) * 0.85 + 0.15;
          vec3 wv = wave(position.xz, uT) * amp0;
          vec3 objectNormal = normalize(vec3(-wv.y, 1.0, -wv.z));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`)
        .replace('#include <begin_vertex>', `vec3 transformed = vec3(position.x, position.y + wv.x, position.z); vDist = dist0; vWP = transformed;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uT; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uFoam; uniform float uDark;\nvarying float vDist; varying vec3 vWP;\nfloat foamAmt;\n')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float dd = max(vDist, 0.0);
          diffuseColor.rgb = mix(uShallow, uDeep, smoothstep(0.0, 70.0, dd)) * (1.0 - uDark * 0.75);
          float surf = sin(dd * 0.9 - uT * 1.6 + sin((vWP.x + vWP.z) * 0.05) * 2.0) * 0.5 + 0.5;
          foamAmt = (1.0 - smoothstep(0.0, 4.5, dd)) * (0.45 + 0.55 * surf) + (1.0 - smoothstep(0.0, 1.2, dd)) * 0.6;
          foamAmt = clamp(foamAmt, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, uFoam * (1.0 - uDark * 0.7), foamAmt * 0.8);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.7, foamAmt);')
        .replace('#include <normal_fragment_maps>', `
          #ifdef USE_NORMALMAP
            vec3 n1 = texture2D(normalMap, vUv * 0.7 + vec2(uT * 0.012, uT * 0.02)).xyz * 2.0 - 1.0;
            vec3 n2 = texture2D(normalMap, vUv * 1.9 + vec2(-uT * 0.017, uT * 0.009)).xyz * 2.0 - 1.0;
            vec3 n3 = texture2D(normalMap, vUv * 0.08 + vec2(uT * 0.002, uT * 0.003)).xyz * 2.0 - 1.0;
            vec3 mapN = normalize(vec3(n1.xy + n2.xy + n3.xy * 1.5, n1.z * n2.z * n3.z));
            float fade = 1.0 - smoothstep(60.0, 900.0, length(vViewPosition));
            mapN.xy *= normalScale * (0.25 + 0.75 * fade);
            normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
          #endif`);
    };
    const key = 'okyanus|' + coast.glsl.length + '|' + cx + '|' + cz + '|' + coast.radius;
    seaMat.customProgramCacheKey = () => key;
    const sea = new THREE.Mesh(geo, seaMat); sea.receiveShadow = false; sea.frustumCulled = false; sea.name = 'Okyanus'; root.add(sea);
  }

  /* ---------- iskele: kıyıdan dışa doğru, yürünebilir ---------- */
  const wood = new THREE.MeshStandardMaterial({color:lin(0x7a5a3c), roughness:0.85});
  const woodDark = new THREE.MeshStandardMaterial({color:lin(0x4a3424), roughness:0.9});
  const lampMat = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
  const lamps = [];
  /** a: kıyı açısı; len: denize uzanan boy. Dönüş: {x, z, yaw, end:[x,z], side:[x,z]} (yaw: denize bakış) */
  function addPier(a, len = 54, hw = 1.4){
    const h = 0.5, [sx, sz] = coast.point(a, -8), yaw = a, ca = Math.cos(yaw), sa = Math.sin(yaw);
    const G = new THREE.Group(); G.position.set(sx, 0, sz); G.rotation.y = yaw; root.add(G);
    const parts = [], dark = [];
    for (let z = 0; z < len; z += 0.34){ const g = new THREE.BoxGeometry(hw * 2, 0.07, 0.3); g.translate((rnd() - 0.5) * 0.04, h - 0.035, z); parts.push(g); }
    for (let z = 1; z <= len; z += 3) [-1, 1].forEach(sd => { const g = new THREE.CylinderGeometry(0.13, 0.15, 3.6, 8); g.translate(sd * (hw - 0.1), h - 1.6, z); dark.push(g); const p = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8); p.translate(sd * (hw - 0.08), h + 0.5, z); dark.push(p); });
    [-1, 1].forEach(sd => { const r = new THREE.BoxGeometry(0.08, 0.08, len - 1); r.translate(sd * (hw - 0.08), h + 0.95, len / 2 + 0.5); parts.push(r); });
    const deck = new THREE.Mesh(mergeBufferGeometries(parts), wood); deck.castShadow = deck.receiveShadow = true; G.add(deck);
    const piles = new THREE.Mesh(mergeBufferGeometries(dark), woodDark); piles.castShadow = true; G.add(piles);
    [10, 30, len - 1].forEach(z => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), woodDark); post.position.set(hw - 0.08, h + 1.1, z); G.add(post);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lampMat.clone()); l.position.set(hw - 0.08, h + 2.3, z); G.add(l); lamps.push(l);
    });
    // yerel koordinata çevir (iskele ekseni +z)
    const local = p => { const dx = p.x - sx, dz = p.z - sz; return [dx * ca - dz * sa, dx * sa + dz * ca]; };
    const toW = (lx, lz) => [sx + lx * ca + lz * sa, sz - lx * sa + lz * ca];
    walkways.push({local, toW, hw, len});
    C.heightFns.push((x, z) => { const [lx, lz] = local({x, z}); return (Math.abs(lx) < hw && lz > 0 && lz < len) ? h : null; });
    const [ex, ez] = toW(0, len - 2.2), [bx, bz] = toW(-hw - 1.4, len - 8);
    return {x:sx, z:sz, yaw, len, hw, h, end:[ex, ez], boatAt:[bx, bz], toW, group:G};
  }

  // kıyıdan öteye yürünmez; iskelelerde iskelenin ucuna kadar
  C.bound = p => {
    for (const w of walkways){
      const [lx, lz] = w.local(p);
      if (lz > -2 && lz < w.len + 2 && Math.abs(lx) < w.hw + 0.6 && coast.dist(p.x, p.z) > 0.6){
        const cl = Math.max(-w.hw + 0.36, Math.min(w.hw - 0.36, lx)), cz2 = Math.min(lz, w.len - 0.4);
        const [x, z] = w.toW(cl, cz2); p.x = x; p.z = z; return;
      }
    }
    const d = coast.dist(p.x, p.z);
    if (d > 0.6){ const dx = p.x - cx, dz = p.z - cz, l = Math.hypot(dx, dz) || 1; p.x -= dx / l * (d - 0.6); p.z -= dz / l * (d - 0.6); }
  };

  function addBoat(x, z, yaw, k = 2.2, sail = true, drift = 0, color){
    const b = makeBoat(world, k, sail, color); b.position.set(x, SEA_Y, z); b.rotation.y = yaw; root.add(b);
    const o = {g:b, bob:sail ? 1.2 : 0.6, drift, yaw, phase:rnd() * 6, home:[x, z]}; boats.push(o); return o;
  }

  function update(dt, t){
    if (!root.visible) return;
    uT.value = t;
    const W = world.W;
    uDark.value = Math.min(1, W.night * 0.9 + W.rain * 0.35);
    seaMat.roughness = 0.09 + W.rain * 0.2;
    boats.forEach(b => {
      b.g.position.y = SEA_Y + Math.sin(t * 0.9 + b.phase) * 0.08 * b.bob;
      b.g.rotation.z = Math.sin(t * 0.7 + b.phase) * 0.05 * b.bob; b.g.rotation.x = Math.sin(t * 0.55 + b.phase) * 0.03 * b.bob;
      if (b.drift){
        b.g.position.x += Math.sin(b.yaw) * b.drift * dt; b.g.position.z += Math.cos(b.yaw) * b.drift * dt;
        if (Math.hypot(b.g.position.x - b.home[0], b.g.position.z - b.home[1]) > 900) b.g.position.set(b.home[0] - Math.sin(b.yaw) * 400, b.g.position.y, b.home[1] - Math.cos(b.yaw) * 400);
      }
    });
    const nl = W.night > 0.5;
    lamps.forEach(l => { l.material.color.setRGB(nl ? 2.2 : 0.35, nl ? 1.5 : 0.3, nl ? 0.6 : 0.2); });
  }
  /** Oyuncunun kıyıya uzaklığı (ses için, karada pozitif). */
  const dist = (x, z) => Math.max(0, -coast.dist(x, z));
  return {root, coast, dist, addPier, addBoat, boats, update, seaY:SEA_Y, rnd};
}
