// Güney kıyısı: ufka uzanan deniz, kumsal, iskele, yelkenliler.
// Su ucuz bir gölgelendirici: dalga yer değiştirmesi + iki katmanlı kayan normal haritası +
// sahnenin HDRI ortam yansıması. Ayrı bir yansıma çizimi yok, bu yüzden hızlı.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// kıyı, kraliyet yapılarının (Kuğu Deresi z 205, Zafer Takı meydanı z ≤ 252) güneyinde
export const SHORE_Z = 290;
export function shoreZ(x){ return SHORE_Z + Math.sin(x / 41) * 6 + Math.sin(x / 17 + 1.3) * 2.2; }
const SEA_Y = -0.22;
export const PIER = {x:24, z0:SHORE_Z - 8, z1:SHORE_Z + 46, hw:1.4, h:0.5};

export function buildSea(world, C){
  const { THREE, scene, renderer } = world;
  const root = new THREE.Group(); root.name = 'Deniz'; scene.add(root);
  let seed = 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const uT = {value:0};
  const boats = [];

  /* ---------- kumsal ---------- */
  const [sc, sg] = canvas(256, 256);
  sg.fillStyle = '#d9c7a0'; sg.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++){ const v = 170 + rnd() * 70; sg.fillStyle = `rgba(${v | 0},${v * 0.9 | 0},${v * 0.72 | 0},.45)`; sg.fillRect(rnd() * 256, rnd() * 256, 1.4, 1.4); }
  for (let i = 0; i < 40; i++){ sg.strokeStyle = 'rgba(150,125,90,.12)'; sg.lineWidth = 2; sg.beginPath(); const y = rnd() * 256; sg.moveTo(0, y); for (let x = 0; x <= 256; x += 16) sg.lineTo(x, y + Math.sin(x / 20 + i) * 3); sg.stroke(); }
  const sandTex = new THREE.CanvasTexture(sc); sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping; sandTex.encoding = THREE.sRGBEncoding; sandTex.anisotropy = 8;
  const sandMat = new THREE.MeshStandardMaterial({map:sandTex, color:0x9c8c70, roughness:0.95, vertexColors:true});
  {
    const X0 = -1300, X1 = 1300, NX = 520, rows = [[-12, 0.035], [-1.2, 0.035], [2.5, -0.55], [9, -1.6], [40, -4]];
    const pos = [], uv = [], col = [], idx = [];
    for (let i = 0; i <= NX; i++){
      const x = X0 + (X1 - X0) * i / NX, s = shoreZ(x);
      rows.forEach(([dz, y], r) => {
        const z = r === 0 ? SHORE_Z - 18.4 + Math.sin(x / 9) * 1.4 + Math.sin(x / 3.7) * 0.7 : s + dz;
        pos.push(x, y, z); uv.push(x / 7, z / 7);
        const wet = r >= 2 ? 0.62 : r === 1 ? 0.85 : 1.0, green = r === 0 ? 0.88 : 1;
        col.push(wet * green, wet, wet * green);
      });
    }
    const R = rows.length;
    for (let i = 0; i < NX; i++) for (let r = 0; r < R - 1; r++){ const a = i * R + r, b = a + R; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx); g.computeVertexNormals();
    const sand = new THREE.Mesh(g, sandMat); sand.receiveShadow = true; root.add(sand);
  }
  // kumsal otları ve kayalar
  {
    const blade = new THREE.ConeGeometry(0.03, 0.7, 3); blade.translate(0, 0.35, 0);
    const N = 2600, grass = new THREE.InstancedMesh(blade, world.windMat(new THREE.MeshLambertMaterial({color:lin(0x9aa463)}), 1.6, false), N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), c = new THREE.Color();
    let n = 0;
    for (let k = 0; k < 120 && n < N; k++){
      const cx = -260 + rnd() * 520, cz = shoreZ(cx) - 12 + rnd() * 9;
      if (Math.abs(cx - PIER.x) < 4) continue;
      for (let i = 0; i < 22 && n < N; i++){
        const sc2 = 0.6 + rnd() * 0.8; e.set((rnd() - 0.5) * 0.6, rnd() * 6, (rnd() - 0.5) * 0.6);
        m4.compose(new THREE.Vector3(cx + (rnd() - 0.5) * 3, 0, cz + (rnd() - 0.5) * 2.5), q.setFromEuler(e), s.set(sc2, sc2, sc2)); grass.setMatrixAt(n, m4);
        c.setHSL(0.15 + rnd() * 0.05, 0.3, 0.45 + rnd() * 0.15); grass.setColorAt(n, c); n++;
      }
    }
    grass.count = n; root.add(grass);
    const rockMat = new THREE.MeshStandardMaterial({color:lin(0x77726b), roughness:0.85, flatShading:true});
    const rockG = new THREE.SphereGeometry(1, 7, 5);
    for (let i = 0; i < 26; i++){
      const x = -200 + rnd() * 400; if (Math.abs(x - PIER.x) < 8) continue;
      const z = shoreZ(x) + 1 + rnd() * 8, sz = 0.6 + rnd() * 1.8;
      const r = new THREE.Mesh(rockG, rockMat); r.position.set(x, -0.3 + sz * 0.25, z); r.scale.set(sz * (0.8 + rnd() * 0.6), sz * 0.6, sz); r.rotation.set(rnd(), rnd() * 6, rnd()); r.castShadow = true; root.add(r);
    }
  }

  /* ---------- deniz ---------- */
  const NX = 260, NZ = 170, W = 7000, D = 3200;
  const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), uvs = new Float32Array((NX + 1) * (NZ + 1) * 2), idx = [];
  for (let j = 0; j <= NZ; j++){
    const t = j / NZ, z = SHORE_Z - 14 + Math.pow(t, 2.3) * D;
    for (let i = 0; i <= NX; i++){
      const u = i / NX - 0.5, x = Math.sign(u) * Math.pow(Math.abs(u) * 2, 1.8) * W / 2, k = (j * (NX + 1) + i);
      pos[k * 3] = x; pos[k * 3 + 1] = SEA_Y; pos[k * 3 + 2] = z; uvs[k * 2] = x / 9; uvs[k * 2 + 1] = z / 9;
    }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++){ const a = j * (NX + 1) + i, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const seaGeo = new THREE.BufferGeometry();
  seaGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); seaGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); seaGeo.setIndex(idx); seaGeo.computeVertexNormals();
  seaGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, SHORE_Z + D / 2), W);
  const seaMat = new THREE.MeshStandardMaterial({color:lin(0x0f4a62), roughness:0.09, metalness:0.0, envMapIntensity:1.25});
  const nTex = new THREE.TextureLoader().load('assets/textures/su_normal.jpg', t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; seaMat.normalMap = t; seaMat.normalScale.set(0.55, 0.55); seaMat.needsUpdate = true; });
  const shallow = {value:lin(0x2a9a9a)}, deep = {value:lin(0x06283c)}, foamC = {value:new THREE.Color(0.95, 0.97, 1.0)}, uDark = {value:0};
  seaMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, {uT, uShallow:shallow, uDeep:deep, uFoam:foamC, uDark});
    const shoreGLSL = `float shoreZ(float x){ return ${SHORE_Z.toFixed(1)} + sin(x / 41.0) * 6.0 + sin(x / 17.0 + 1.3) * 2.2; }
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
      .replace('#include <common>', '#include <common>\nuniform float uT;\n' + shoreGLSL)
      .replace('#include <beginnormal_vertex>', `
        float dist0 = position.z - shoreZ(position.x);
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
        float surf = sin(dd * 0.9 - uT * 1.6 + sin(vWP.x * 0.05) * 2.0) * 0.5 + 0.5;
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
  seaMat.customProgramCacheKey = () => 'deniz-v1';
  const sea = new THREE.Mesh(seaGeo, seaMat); sea.receiveShadow = false; sea.frustumCulled = false; root.add(sea);

  /* ---------- iskele ---------- */
  const wood = new THREE.MeshStandardMaterial({color:lin(0x7a5a3c), roughness:0.85});
  const woodDark = new THREE.MeshStandardMaterial({color:lin(0x4a3424), roughness:0.9});
  {
    const parts = [], dark = [];
    for (let z = PIER.z0; z < PIER.z1; z += 0.34){ const g = new THREE.BoxGeometry(PIER.hw * 2, 0.07, 0.3); g.translate((rnd() - 0.5) * 0.04, PIER.h - 0.035, z); parts.push(g); }
    for (let z = PIER.z0 + 1; z <= PIER.z1; z += 3) [-1, 1].forEach(sd => { const g = new THREE.CylinderGeometry(0.13, 0.15, 3.6, 8); g.translate(sd * (PIER.hw - 0.1), PIER.h - 1.6, z); dark.push(g); const p = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8); p.translate(sd * (PIER.hw - 0.08), PIER.h + 0.5, z); dark.push(p); });
    [-1, 1].forEach(sd => { const r = new THREE.BoxGeometry(0.08, 0.08, PIER.z1 - PIER.z0 - 1); r.translate(sd * (PIER.hw - 0.08), PIER.h + 0.95, (PIER.z0 + PIER.z1) / 2 + 0.5); parts.push(r); });
    const deck = new THREE.Mesh(mergeBufferGeometries(parts), wood); deck.castShadow = deck.receiveShadow = true; root.add(deck);
    const piles = new THREE.Mesh(mergeBufferGeometries(dark), woodDark); piles.castShadow = true; root.add(piles);
    // iskele fenerleri
    const lampMat = new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false});
    root.userData.lamps = [];
    [PIER.z0 + 10, PIER.z0 + 30, PIER.z1 - 1].forEach(z => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 8), woodDark); post.position.set(PIER.x + PIER.hw - 0.08, PIER.h + 1.1, z); root.add(post);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lampMat); l.position.set(PIER.x + PIER.hw - 0.08, PIER.h + 2.3, z); root.add(l); root.userData.lamps.push(l);
    });
    // iskeleye bağlı sandal
    const boat = makeBoat(0.55, false); boat.position.set(PIER.x - PIER.hw - 1.4, SEA_Y, PIER.z1 - 8); boat.rotation.y = 0.05; root.add(boat); boats.push({g:boat, bob:0.6, moor:true});
  }
  // iskele: yürünebilir yüzey; deniz: görünmez sınır
  C.heightFns.push((x, z) => (Math.abs(x - PIER.x) < PIER.hw && z > PIER.z0 && z < PIER.z1) ? PIER.h : null);
  C.shoreLimit = p => {
    const onPier = Math.abs(p.x - PIER.x) < PIER.hw - 0.35 && p.z < PIER.z1 - 0.4;
    const s = shoreZ(p.x) + 0.6;
    if (p.z > s && !onPier){
      if (Math.abs(p.x - PIER.x) < PIER.hw + 0.6 && p.z < PIER.z1) p.x = PIER.x + Math.sign(p.x - PIER.x || 1) * (PIER.hw - 0.36);
      else p.z = s;
    }
    if (p.z > PIER.z1 - 0.4) p.z = PIER.z1 - 0.4;
  };

  /* ---------- yelkenliler ---------- */
  function makeBoat(k, sail){
    const g = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({color:lin(sail ? 0x3a2a20 : 0x5a3a24), roughness:0.7});
    const prof = [];
    for (let i = 0; i <= 10; i++){ const t = i / 10; prof.push(new THREE.Vector2(Math.sin(t * Math.PI) * 1.0 + 0.02, t * 2 - 1)); }
    const hull = new THREE.Mesh(new THREE.LatheGeometry(prof, 16, Math.PI * 0.5, Math.PI), hullMat);
    hull.rotation.set(Math.PI / 2, 0, 0); hull.scale.set(1.0 * k, 3.6 * k, 0.75 * k); hull.position.y = 0.55 * k; g.add(hull);
    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(1.85 * k, 0.06, 6.4 * k), new THREE.MeshStandardMaterial({color:lin(0x9a7a52), roughness:0.8})); deck2.position.y = 0.55 * k; g.add(deck2);
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
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  [[-160, 344, 2.2, 0.4], [210, 584, 2.6, -0.6], [40, 1174, 3.0, 1.2], [-520, 924, 3.0, 2.0], [420, 124, 1.6, 0.9]].forEach(([x, dz, k, yaw]) => {
    const b = makeBoat(k, true); b.position.set(x, SEA_Y, SHORE_Z + dz); b.rotation.y = yaw; root.add(b);
    boats.push({g:b, bob:1.2, drift:0.6 + rnd() * 0.6, yaw, phase:rnd() * 6});
  });

  /* ---------- martılar ---------- */
  const gullG = new THREE.BufferGeometry();
  gullG.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.22, -0.05, 0, 0.0, 0.12, 0, 0, -0.12, 0.55, 0.22, -0.05, 0, 0.0, 0.12, 0, 0, -0.12], 3)); gullG.computeVertexNormals();
  const gullMat = new THREE.MeshStandardMaterial({color:0xf2f2f0, side:THREE.DoubleSide, roughness:0.6});
  const gulls = [];
  for (let i = 0; i < 14; i++){
    const g = new THREE.Mesh(gullG, gullMat); root.add(g);
    gulls.push({g, cx:-80 + rnd() * 220, cz:SHORE_Z + 15 + rnd() * 70, r:8 + rnd() * 20, h:9 + rnd() * 14, w:(rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.2), p:rnd() * 6});
  }

  /* ---------- güncelleme ---------- */
  function update(dt, t, hero, indoor){
    root.visible = !indoor;
    if (indoor) return;
    uT.value = t;
    const W = world.W;
    uDark.value = Math.min(1, W.night * 0.9 + W.rain * 0.35);
    seaMat.roughness = 0.09 + W.rain * 0.2;
    boats.forEach(b => {
      b.g.position.y = SEA_Y + Math.sin(t * 0.9 + (b.phase || 0)) * 0.08 * b.bob;
      b.g.rotation.z = Math.sin(t * 0.7 + (b.phase || 0)) * 0.05 * b.bob; b.g.rotation.x = Math.sin(t * 0.55 + (b.phase || 0)) * 0.03 * b.bob;
      if (b.drift){ b.g.position.x += Math.sin(b.yaw) * b.drift * dt; b.g.position.z += Math.cos(b.yaw) * b.drift * dt; const cz = SHORE_Z + 524; if (Math.hypot(b.g.position.x, b.g.position.z - cz) > 1500) b.g.position.set(-Math.sin(b.yaw) * 500, b.g.position.y, cz - Math.cos(b.yaw) * 500); }
    });
    const nl = W.night > 0.5;
    root.userData.lamps.forEach(l => { l.material.color.setRGB(nl ? 2.2 : 0.35, nl ? 1.5 : 0.3, nl ? 0.6 : 0.2); });
    const showGulls = W.night < 0.6 && W.rain < 0.5;
    gulls.forEach(q => {
      q.g.visible = showGulls; if (!showGulls) return;
      const a = t * q.w + q.p;
      q.g.position.set(q.cx + Math.cos(a) * q.r, q.h + Math.sin(t * 0.5 + q.p) * 1.5, q.cz + Math.sin(a) * q.r);
      q.g.rotation.set(0, Math.atan2(-Math.sin(a) * Math.sign(q.w), Math.cos(a) * Math.sign(q.w)), Math.sign(q.w) * 0.25);
      q.g.scale.set(1, Math.sin(t * 7 + q.p), 1);
    });
  }
  /** Oyuncunun kıyıya uzaklığı (ses için). */
  const dist = (x, z) => Math.max(0, shoreZ(x) - z);
  return {root, update, dist};
}
