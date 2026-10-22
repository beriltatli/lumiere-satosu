// Atmosfer: hacimsel bulutlar (ışın yürütme), yere düşen bulut gölgeleri, yüksekliğe bağlı sis,
// malzemelere dünya uzayında doku ve renk çeşitliliği, temas gölgesi (AO) ve sinematik renk düzenlemesi.
// Bulutlar düşük çözünürlüklü bir hedefe çizilir, sonra gökyüzü kubbesinde sahnenin derinliğine göre birleştirilir.

const CLOUD_B = 700, CLOUD_T = 1650;   // bulut katmanı (metre)

// Ortak gürültü: dünya uzayında değer gürültüsü (GPU'da ucuz)
const NOISE_GLSL = /* glsl */`
  float cHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float cNoise(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(cHash(i), cHash(i + vec3(1,0,0)), f.x), mix(cHash(i + vec3(0,1,0)), cHash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(cHash(i + vec3(0,0,1)), cHash(i + vec3(1,0,1)), f.x), mix(cHash(i + vec3(0,1,1)), cHash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float cHash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float cNoise2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(cHash2(i), cHash2(i + vec2(1, 0)), f.x), mix(cHash2(i + vec2(0, 1)), cHash2(i + vec2(1, 1)), f.x), f.y); }
`;

// Döşenebilir (periyodik) gürültü dokuları: GPU'da her adımda prosedürel gürültü yerine tek doku okuması
function makeRnd(seed){ return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const sstep = t => t * t * (3 - 2 * t);
function valueNoise3D(N, L, rnd){
  const g = new Float32Array(L * L * L).map(rnd), out = new Float32Array(N * N * N), at = (x, y, z) => g[((z % L) * L + (y % L)) * L + (x % L)];
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    const fx = x / N * L, fy = y / N * L, fz = z / N * L, ix = fx | 0, iy = fy | 0, iz = fz | 0, tx = sstep(fx - ix), ty = sstep(fy - iy), tz = sstep(fz - iz);
    const a = at(ix, iy, iz) + (at(ix + 1, iy, iz) - at(ix, iy, iz)) * tx, b = at(ix, iy + 1, iz) + (at(ix + 1, iy + 1, iz) - at(ix, iy + 1, iz)) * tx;
    const c = at(ix, iy, iz + 1) + (at(ix + 1, iy, iz + 1) - at(ix, iy, iz + 1)) * tx, d = at(ix, iy + 1, iz + 1) + (at(ix + 1, iy + 1, iz + 1) - at(ix, iy + 1, iz + 1)) * tx;
    const ab = a + (b - a) * ty, cd = c + (d - c) * ty; out[(z * N + y) * N + x] = ab + (cd - ab) * tz;
  }
  return out;
}
function worley3D(N, C, rnd){
  const pts = new Float32Array(C * C * C * 3).map(rnd), out = new Float32Array(N * N * N), s = N / C;
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    const cx = Math.floor(x / s), cy = Math.floor(y / s), cz = Math.floor(z / s); let best = 9;
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){
      const nx = cx + dx, ny = cy + dy, nz = cz + dz, k = ((((nz + C) % C) * C + ((ny + C) % C)) * C + ((nx + C) % C)) * 3;
      const px = (nx + pts[k]) * s, py = (ny + pts[k + 1]) * s, pz = (nz + pts[k + 2]) * s, d = ((px - x) ** 2 + (py - y) ** 2 + (pz - z) ** 2) / (s * s);
      if (d < best) best = d;
    }
    out[(z * N + y) * N + x] = 1 - Math.min(1, Math.sqrt(best));
  }
  return out;
}
function bakeDetail3D(THREE){
  const N = 64, rnd = makeRnd(4242), v = [4, 8, 16].map(L => valueNoise3D(N, L, rnd)), w = [4, 8, 16].map(C => worley3D(N, C, rnd));
  const data = new Uint8Array(N * N * N);
  for (let i = 0; i < data.length; i++){
    const val = v[0][i] * 0.55 + v[1][i] * 0.3 + v[2][i] * 0.15, wor = w[0][i] * 0.55 + w[1][i] * 0.3 + w[2][i] * 0.15;
    data[i] = Math.max(0, Math.min(255, (val * 0.45 + wor * 0.55) * 255));
  }
  const t = new THREE.Data3DTexture(data, N, N, N); t.format = THREE.RedFormat; t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping; t.unpackAlignment = 1; t.needsUpdate = true; return t;
}
function bakeCoverage2D(THREE){
  const N = 256, rnd = makeRnd(777), data = new Uint8Array(N * N);
  const oct = [[8, 0.5], [16, 0.3], [32, 0.2]].map(([L, w]) => { const g = new Float32Array(L * L).map(rnd); return {L, w, g}; });
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    let s = 0;
    for (const {L, w, g} of oct){
      const fx = x / N * L, fy = y / N * L, ix = fx | 0, iy = fy | 0, tx = sstep(fx - ix), ty = sstep(fy - iy), at = (a, b) => g[(b % L) * L + (a % L)];
      const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * tx, b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * tx; s += (a + (b - a) * ty) * w;
    }
    data[y * N + x] = s * 255;
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RedFormat); t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.unpackAlignment = 1; t.needsUpdate = true; return t;
}

export function createAtmosphere({THREE, renderer, scene, camera, sky}){
  /* ================= ortak uniform'lar ================= */
  const U = {
    uCamWorld:{value:camera.matrixWorld},
    uSunDir:{value:new THREE.Vector3(0, 1, 0)},
    uSunCol:{value:new THREE.Color(1, 1, 1)},
    uFogDensity:{value:0.0016},
    uFogFall:{value:0.011},
    uCover:{value:0.4},
    uCloudWind:{value:new THREE.Vector3()},
    uOutdoor:{value:1},
    uDetail:{value:1},
    uShadowK:{value:0.6},
    tCov:{value:bakeCoverage2D(THREE)},
  };
  const COV_SCALE = 0.00045 / 8;   // dünya metresi → örtü dokusu (14 km'de bir tekrarlar)

  /* ================= malzeme yaması ================= */
  const CLOUD2D = /* glsl */`
    float cCloud2D(vec2 p){
      float n = texture2D(tCov, (p + uCloudWind.xz) * ${COV_SCALE}).r;
      return smoothstep(1.0 - uCover, 1.0 - uCover + 0.3, n);
    }
  `;
  const FRAG_HEAD = /* glsl */`
    varying vec3 vCW;
    uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uFogDensity; uniform float uFogFall;
    uniform float uCover; uniform vec3 uCloudWind; uniform float uOutdoor; uniform float uDetail; uniform float uShadowK; uniform sampler2D tCov;
    ${NOISE_GLSL}
    ${CLOUD2D}
  `;
  const patched = new WeakSet();
  function patchMaterial(m){
    if (!m || patched.has(m)) return;
    if (!(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    patched.add(m);
    const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey.call(m);
    const lit = true, std = !!m.isMeshStandardMaterial;
    m.onBeforeCompile = function(sh, r){
      if (prev) prev.call(this, sh, r);
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vCW;\nuniform mat4 uCamWorld;\n' + sh.vertexShader.replace('#include <fog_vertex>', '#include <fog_vertex>\n  vCW = (uCamWorld * mvPosition).xyz;');
      let f = FRAG_HEAD + sh.fragmentShader;
      // dünya uzayında renk ve parlaklık çeşitliliği: düz, "plastik" yüzeyleri kırar
      f = f.replace('#include <color_fragment>', `#include <color_fragment>
        float cnA = cNoise(vCW * 0.42), cnB = cNoise(vCW * 2.7 + 11.0), cnL = cNoise(vCW * 0.045 + 3.0);
        float cVar = cnA * 0.6 + cnB * 0.4;
        diffuseColor.rgb *= mix(1.0, 0.84 + 0.3 * cVar, uDetail);
        diffuseColor.rgb *= mix(vec3(1.0), mix(vec3(1.05, 1.0, 0.93), vec3(0.95, 0.99, 1.05), cnL), 0.55 * uDetail);`);
      if (std) f = f.replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (cVar - 0.5) * 0.2 * uDetail, 0.03, 1.0);`);
      // ortam ışığı örtüsü: zemine yakın duvarlar ve alt yüzeyler daha az gökyüzü görür
      f = f.replace('#include <lights_fragment_end>', `
        vec3 cN = inverseTransformDirection(normal, viewMatrix);
        float cAO = mix(1.0, 0.5 + 0.5 * smoothstep(0.0, 1.8, vCW.y), (1.0 - abs(cN.y)) * uOutdoor);
        cAO *= 0.68 + 0.32 * (cN.y * 0.5 + 0.5);
        #if defined( RE_IndirectDiffuse )
          irradiance *= cAO; iblIrradiance *= cAO;
        #endif
        #if defined( RE_IndirectSpecular )
          radiance *= mix(1.0, cAO, 0.6);
        #endif
        #include <lights_fragment_end>
        // gökteki bulutların yere düşen gölgesi (güneş yönünde izdüşüm)
        if (uOutdoor > 0.5 && uSunDir.y > 0.02){
          vec2 cp = vCW.xz + uSunDir.xz / max(uSunDir.y, 0.12) * (${((CLOUD_B + CLOUD_T) / 2).toFixed(1)} - vCW.y);
          float cs = 1.0 - cCloud2D(cp) * uShadowK;
          reflectedLight.directDiffuse *= cs; reflectedLight.directSpecular *= cs;
        }`);
      // yüksekliğe bağlı üstel sis + güneş yönünde ışık saçılması
      f = f.replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          vec3 cV = vCW - cameraPosition; float cD = length(cV); vec3 cDir = cV / max(cD, 1e-3);
          float fy = cDir.y * cD * uFogFall;
          float hk = abs(fy) > 1e-3 ? (1.0 - exp(-fy)) / fy : 1.0;
          float od = uFogDensity * exp(-max(cameraPosition.y, 0.0) * uFogFall) * cD * hk;
          float cF = (1.0 - exp(-od)) * uOutdoor;
          float sAmt = pow(max(dot(cDir, uSunDir), 0.0), 6.0);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, uSunCol, sAmt * 0.55), cF);
        #endif`);
      sh.fragmentShader = f;
    };
    m.customProgramCacheKey = () => prevKey + '|atmo' + (lit ? 1 : 0);
    m.needsUpdate = true;
  }
  function patchScene(root = scene){
    root.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(patchMaterial); });
  }

  /* ================= hacimsel bulutlar ================= */
  const volumetric = renderer.capabilities.isWebGL2;
  const rt = new THREE.WebGLRenderTarget(4, 4, {type:THREE.HalfFloatType, depthBuffer:false});
  rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
  const CU = {
    uInvProj:{value:camera.projectionMatrixInverse}, uCamWorld:U.uCamWorld, uCamPos:{value:new THREE.Vector3()},
    uSunDir:U.uSunDir, uLight:{value:new THREE.Color()}, uAmbTop:{value:new THREE.Color()}, uAmbBot:{value:new THREE.Color()},
    uHaze:{value:new THREE.Color()}, uCover:U.uCover, uCloudWind:U.uCloudWind, uDensity:{value:1}, uSilver:{value:1},
    tCov:U.tCov, tDet:{value:volumetric ? bakeDetail3D(THREE) : null},
  };
  const steps = {yuksek:[48, 5], orta:[36, 4], dusuk:[24, 3]};
  const makeCloudMat = q => new THREE.ShaderMaterial({
    uniforms:CU, depthTest:false, depthWrite:false,
    defines:{STEPS:steps[q][0], LSTEPS:steps[q][1]},
    vertexShader:/* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader:/* glsl */`
      precision highp sampler3D;
      varying vec2 vUv;
      uniform mat4 uInvProj; uniform mat4 uCamWorld; uniform vec3 uCamPos; uniform vec3 uSunDir;
      uniform vec3 uLight; uniform vec3 uAmbTop; uniform vec3 uAmbBot; uniform vec3 uHaze;
      uniform float uCover; uniform vec3 uCloudWind; uniform float uDensity; uniform float uSilver;
      uniform sampler2D tCov; uniform sampler3D tDet;
      const float B = ${CLOUD_B.toFixed(1)}, T = ${CLOUD_T.toFixed(1)};
      float hash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float coverage(vec2 xz){ return texture(tCov, (xz + uCloudWind.xz) * ${COV_SCALE}).r; }
      float density(vec3 p, bool hi){
        float h = (p.y - B) / (T - B);
        if (h < 0.0 || h > 1.0) return 0.0;
        // geniş kümeler (yer gölgeleriyle aynı örtü haritası)
        float base = smoothstep(1.0 - uCover, 1.0 - uCover + 0.2, coverage(p.xz));
        // kümülüs profili: düz taban, yuvarlak tepe; örtü arttıkça kalınlaşır
        float top = mix(0.5, 1.0, uCover);
        float prof = smoothstep(0.0, 0.07, h) * smoothstep(top, top * 0.4, h);
        float d = base * prof;
        if (d <= 0.01) return 0.0;
        vec3 q = (p + uCloudWind * 1.3) * 0.0011;
        float n = texture(tDet, q).r;
        if (hi) n = n * 0.7 + texture(tDet, q * 3.1 + 0.37).r * 0.3;
        d = clamp((d - (1.0 - n) * 0.75) / 0.3, 0.0, 1.0);          // kabarık kenarlar
        return d * uDensity;
      }
      float hg(float c, float g){ float g2 = g * g; return (1.0 - g2) / (12.566 * pow(1.0 + g2 - 2.0 * g * c, 1.5)); }
      void main(){
        vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
        vec3 rd = normalize(mat3(uCamWorld) * (vp.xyz / vp.w));
        if (rd.y < 0.012){ gl_FragColor = vec4(0.0); return; }
        float t0 = (B - uCamPos.y) / rd.y, t1 = (T - uCamPos.y) / rd.y;
        t1 = min(t1, t0 + 3200.0);
        if (t0 > 26000.0){ gl_FragColor = vec4(0.0); return; }
        float len = t1 - t0, dt = len / float(STEPS);
        float jit = hash2(gl_FragCoord.xy);
        float t = t0 + dt * jit;
        float cosA = dot(rd, uSunDir);
        float phase = mix(hg(cosA, 0.62) * uSilver + hg(cosA, -0.2), 0.08, 0.25);
        vec3 col = vec3(0.0); float Tr = 1.0;
        for (int i = 0; i < STEPS; i++){
          vec3 p = uCamPos + rd * t;
          float d = density(p, true);
          if (d > 0.002){
            float ld = 0.0, ls = 55.0;
            for (int j = 0; j < LSTEPS; j++){ ld += density(p + uSunDir * ls * (float(j) + 0.5) * (1.0 + float(j) * 0.4), false); }
            float tau = ld * ls * 0.011;
            float beer = exp(-tau), powder = 1.0 - exp(-tau * 2.0 - d * 1.5);
            float h = clamp((p.y - B) / (T - B), 0.0, 1.0);
            vec3 sunL = uLight * beer * phase * mix(0.6, 1.0, powder) * 15.0;
            vec3 amb = mix(uAmbBot, uAmbTop, h) * 1.6 * (0.6 + 0.4 * h);
            float a = 1.0 - exp(-d * dt * 0.018);
            col += Tr * a * (sunL + amb);
            Tr *= 1.0 - a;
            if (Tr < 0.02) break;
          }
          t += dt;
        }
        float alpha = 1.0 - Tr;
        // uzaktaki bulutlar ufuk pusuna karışır
        float haze = 1.0 - exp(-t0 / 11000.0);
        col = mix(col, uHaze * alpha, haze);
        alpha *= smoothstep(0.012, 0.09, rd.y);
        col *= smoothstep(0.012, 0.09, rd.y);
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  let quality = 'yuksek', cloudMat = makeCloudMat(quality), scale = 0.5;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cloudMat); quad.frustumCulled = false;
  const cloudScene = new THREE.Scene(); cloudScene.add(quad);
  const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // gökyüzü kubbesi: bulut dokusunu ekran uzayında okur, sahnenin derinliği önündeki nesneleri korur
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
    uniforms:{tClouds:{value:rt.texture}, uRes:{value:new THREE.Vector2(1, 1)}},
    vertexShader:/* glsl */`void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader:/* glsl */`
      uniform sampler2D tClouds; uniform vec2 uRes;
      void main(){
        vec4 c = texture2D(tClouds, gl_FragCoord.xy / uRes);
        vec3 rgb = c.a > 1e-4 ? c.rgb / c.a : vec3(0.0);
        gl_FragColor = vec4(rgb, c.a);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
        gl_FragColor.rgb *= gl_FragColor.a;
      }`,
    side:THREE.BackSide, depthWrite:false, transparent:true, fog:false,
    blending:THREE.CustomBlending, blendSrc:THREE.OneFactor, blendDst:THREE.OneMinusSrcAlphaFactor,
  }));
  dome.renderOrder = -1; dome.frustumCulled = false; dome.userData.shared = true; scene.add(dome);
  dome.onBeforeRender = (r, s, cam) => { dome.position.copy(cam.position); dome.updateMatrixWorld(); };

  /* ================= renk düzenlemesi (son geçiş) ================= */
  const gradeShader = {
    uniforms:{tDiffuse:{value:null}, uTime:{value:0}, uRes:{value:new THREE.Vector2(1, 1)}, uVig:{value:0.42}, uGrain:{value:0.016}},
    vertexShader:/* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader:/* glsl */`
      uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uVig; uniform float uGrain; varying vec2 vUv;
      float h(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      void main(){
        vec4 tex = texture2D(tDiffuse, vUv);
        vec3 c = LinearTosRGB(tex).rgb;
        c = clamp(c, 0.0, 1.0);
        c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);                                   // yumuşak S eğrisi
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, 1.05);                                                  // hafif doygunluk
        c += vec3(0.018, 0.004, -0.02) * smoothstep(0.45, 1.0, l);                  // sıcak parlaklar
        c += vec3(-0.012, 0.002, 0.02) * (1.0 - smoothstep(0.0, 0.4, l));           // serin gölgeler
        vec2 v = vUv - 0.5; v.x *= uRes.x / uRes.y;
        c *= 1.0 - dot(v, v) * uVig;                                                 // vinyet
        c += (h(vUv * uRes + fract(uTime) * 91.7) - 0.5) * uGrain;                   // film greni (bantlaşmayı da kırar)
        gl_FragColor = vec4(c, tex.a);
      }`,
  };

  /* ================= güncelleme ================= */
  const tmpC = new THREE.Color(), size = new THREE.Vector2();
  function resize(){
    renderer.getDrawingBufferSize(size);
    const w = Math.max(16, Math.round(size.x * scale)), h = Math.max(16, Math.round(size.y * scale));
    rt.setSize(w, h); dome.material.uniforms.uRes.value.set(size.x, size.y);
  }
  /**
   * W: hava durumu durumu, light: {dir, color, intensity}, hemi: {sky, ground, intensity}, fogColor: Color
   */
  function update(dt, t, {W, lightDir, sunColor, sunI, hemiSky, hemiGround, hemiI, fogColor, wind, windDir}){
    // örtü ve yoğunluk: hava durumundan
    U.uCover.value = Math.min(0.97, 0.34 + W.clouds * 0.46 + W.rain * 0.2);
    CU.uDensity.value = 1.0 + W.rain * 1.6 + Math.max(0, W.clouds - 0.6) * 1.2;
    U.uShadowK.value = 0.62 * (1 - W.rain * 0.7) * (1 - Math.max(0, W.clouds - 0.75) * 2.5);
    // bulutlar rüzgâr yönünde metre/saniye ile sürüklenir; dikeyde yavaşça "kaynar"
    const sp = (5 + wind * 24) * dt;
    U.uCloudWind.value.x += windDir.x * sp; U.uCloudWind.value.z += windDir.y * sp; U.uCloudWind.value.y += dt * 1.5;
    U.uSunDir.value.copy(lightDir);
    // sis yoğunluğu: eski doğrusal sisin "far" uzaklığına denk düşecek şekilde
    U.uFogDensity.value = 1.45 / Math.max(120, W.fogF);
    U.uSunCol.value.set(sunColor).multiplyScalar(Math.min(1.2, sunI * 0.35) * (1 - W.night * 0.8));
    // bulut aydınlatması
    const day = 1 - W.night;
    CU.uLight.value.set(sunColor).multiplyScalar(sunI * (0.25 + 0.75 * day) * (lightDir.y > 0 ? 1 : 0.5) * (1 - W.rain * 0.75));
    CU.uAmbTop.value.set(hemiSky).multiplyScalar(hemiI * 0.9 * (1 - W.rain * 0.45));
    CU.uAmbBot.value.set(hemiSky).lerp(tmpC.set(hemiGround), 0.6).multiplyScalar(hemiI * 0.55 * (1 - W.rain * 0.5));
    CU.uHaze.value.set(fogColor).multiplyScalar(0.9);
    CU.uSilver.value = 1 - W.rain * 0.8;
    CU.uCamPos.value.copy(camera.position);
    gradeShader.uniforms.uTime.value = t;
  }
  function render(){
    if (!dome.visible || !volumetric) return;
    camera.updateMatrixWorld();
    const prev = renderer.getRenderTarget(), auto = renderer.autoClear;
    renderer.setRenderTarget(rt); renderer.autoClear = true; renderer.setClearColor(0x000000, 0); renderer.clear();
    renderer.render(cloudScene, orthoCam);
    renderer.setRenderTarget(prev); renderer.autoClear = auto;
  }
  function setQuality(q){
    quality = q; scale = q === 'yuksek' ? 0.5 : q === 'orta' ? 0.36 : 0.25;
    cloudMat.dispose(); cloudMat = makeCloudMat(q); quad.material = cloudMat;
    U.uDetail.value = q === 'dusuk' ? 0.7 : 1;
    resize();
  }
  function setOutdoor(v){ U.uOutdoor.value = v ? 1 : 0; dome.visible = v && volumetric; }
  dome.visible = volumetric;
  resize();
  return {U, volumetric, patchMaterial, patchScene, update, render, resize, setQuality, setOutdoor, dome, gradeShader, CLOUD_B, CLOUD_T};
}
