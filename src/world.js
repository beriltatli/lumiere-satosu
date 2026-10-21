// Dünya: şato, bahçe, tapınak, muhafızlar, atlar, hava durumu ve kılıç
import * as T from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import * as fflate from 'fflate';
import { COURT_ZONES } from './court.js';

const THREE = { ...T, Sky, GLTFExporter, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, GammaCorrectionShader };

export function createWorld(stage){
const say = t => console.info(t);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const TEMPLE = new THREE.Vector3(0, 0, 60);

/* ================= renderer ================= */
const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xbcd0e6, 150, 900);
const camera = new THREE.PerspectiveCamera(42, 1, 0.2, 3000);
camera.position.set(64, 32, 80);

/* sky */
const sky = new THREE.Sky(); sky.scale.setScalar(2500); scene.add(sky);
const envScene = new THREE.Scene(); const envSky = new THREE.Sky(); envSky.material = sky.material; envSky.scale.setScalar(10); envScene.add(envSky);
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;
let hdriEnv = null;
function refreshEnv(){
  if (hdriEnv){ scene.environment = hdriEnv[wKey] || scene.environment; return; }
  const rt = pmrem.fromScene(envScene, 0, 0.1, 100);
  scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt;
}

/* ================= textures ================= */
function canvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rx, ry, srgb){ const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; }
function speckle(g, w, h, n, alpha, light, dark){
  for (let i = 0; i < n; i++){ const v = rnd() < 0.5 ? light : dark; g.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`; g.fillRect(rnd()*w, rnd()*h, 1 + rnd()*3, 1 + rnd()*3); }
}
// grass
const [gc, gg] = canvas(256, 256);
gg.fillStyle = '#4f7a2e'; gg.fillRect(0,0,256,256);
for (let i = 0; i < 5000; i++){ const v = rnd(); gg.fillStyle = `hsla(${88 + v*30},${40 + v*20}%,${22 + rnd()*22}%,.55)`; gg.fillRect(rnd()*256, rnd()*256, 1, 2 + rnd()*4); }
const lawnMat = new THREE.MeshStandardMaterial({map:tex(gc, 6, 6, true), roughness:0.95});
const groundMat = new THREE.MeshStandardMaterial({map:tex(gc, 240, 240, true), roughness:1, color:0xd8e0c8});
// gravel
const [rc, rg] = canvas(256, 256);
rg.fillStyle = '#ab9c7e'; rg.fillRect(0,0,256,256);
for (let i = 0; i < 9000; i++){ const v = 120 + rnd()*80; rg.fillStyle = `rgba(${v},${v-8},${v-24},.7)`; rg.beginPath(); rg.arc(rnd()*256, rnd()*256, 0.6 + rnd()*1.4, 0, 6.283); rg.fill(); }
const gravelMat = new THREE.MeshStandardMaterial({map:tex(rc, 18, 18, true), roughness:0.92});
// limestone
const [sc, sg] = canvas(256, 256);
sg.fillStyle = '#dccfb4'; sg.fillRect(0,0,256,256); speckle(sg, 256, 256, 5000, 0.18, 255, 120);
sg.strokeStyle = 'rgba(120,105,80,.25)'; sg.lineWidth = 1;
for (let y = 0; y < 256; y += 32){ sg.beginPath(); sg.moveTo(0,y+.5); sg.lineTo(256,y+.5); sg.stroke(); for (let x = (y/32)%2 ? 0 : 32; x < 256; x += 64){ sg.beginPath(); sg.moveTo(x+.5,y); sg.lineTo(x+.5,y+32); sg.stroke(); } }
const stoneMat = new THREE.MeshStandardMaterial({map:tex(sc, 2, 2, true), roughness:0.85});
const marbleMat = new THREE.MeshStandardMaterial({color:0xe2ddd2, roughness:0.32, metalness:0.0});
// slate
const [lc, lg] = canvas(256, 256);
lg.fillStyle = '#3f4a5a'; lg.fillRect(0,0,256,256);
for (let y = 0; y < 256; y += 16) for (let x = ((y/16)%2) * 8 - 8; x < 256; x += 16){
  const v = 55 + rnd()*30; lg.fillStyle = `rgb(${v},${v+10},${v+26})`; lg.beginPath(); lg.moveTo(x, y); lg.lineTo(x+15, y); lg.lineTo(x+15, y+10); lg.quadraticCurveTo(x+7.5, y+17, x, y+10); lg.fill(); }
const slateMat = new THREE.MeshStandardMaterial({map:tex(lc, 1, 1, true), roughness:0.62, metalness:0.1});
const goldMat = new THREE.MeshStandardMaterial({color:0xd4af37, metalness:1, roughness:0.25});
const doorMat = new THREE.MeshStandardMaterial({color:0x3b2416, roughness:0.7, side:THREE.DoubleSide});
const darkMetal = new THREE.MeshStandardMaterial({color:0x1b1d22, metalness:0.8, roughness:0.4});
const hedgeMat = (() => { const [c, g] = canvas(128, 128); g.fillStyle = '#1f3d1a'; g.fillRect(0,0,128,128);
  for (let i = 0; i < 2600; i++){ const v = rnd(); g.fillStyle = `hsla(${100 + v*25},45%,${12 + rnd()*20}%,.8)`; g.beginPath(); g.arc(rnd()*128, rnd()*128, 1 + rnd()*2.4, 0, 6.283); g.fill(); }
  const t = tex(c, 1, 1, true); return new THREE.MeshStandardMaterial({map:t, bumpMap:tex(c,1,1), bumpScale:0.6, roughness:0.9}); })();

// facade: 4 bays x 2 floors per tile, with lit-window emissive map
const [fc, fg] = canvas(512, 384); const [ec, eg] = canvas(512, 384);
fg.drawImage(sc, 0, 0, 512, 384); fg.drawImage(sc, 256, 0, 256, 192);
fg.fillStyle = 'rgba(232,222,198,.35)'; fg.fillRect(0, 0, 512, 384);
eg.fillStyle = '#000'; eg.fillRect(0,0,512,384);
for (let f = 0; f < 2; f++) for (let b = 0; b < 4; b++){
  const x = b*128, y = f*192;
  fg.fillStyle = '#efe6d2'; fg.fillRect(x + 30, y + 22, 68, 150);              // surround
  fg.fillStyle = '#e8dcc2'; fg.fillRect(x + 24, y + 14, 80, 10);              // lintel cornice
  fg.fillStyle = '#273140'; fg.fillRect(x + 38, y + 30, 52, 136);             // glass
  fg.strokeStyle = '#f4efe4'; fg.lineWidth = 3;
  fg.beginPath(); fg.moveTo(x + 64, y + 30); fg.lineTo(x + 64, y + 166);
  for (let k = 1; k < 4; k++){ fg.moveTo(x + 38, y + 30 + k*34); fg.lineTo(x + 90, y + 30 + k*34); } fg.stroke();
  fg.fillStyle = 'rgba(160,190,220,.18)'; fg.fillRect(x + 40, y + 32, 22, 60);  // sky reflection
  fg.fillStyle = '#d6c8aa'; fg.fillRect(x, y + 184, 128, 8);                   // string course
  fg.fillStyle = '#8e8270'; fg.fillRect(x + 32, y + 166, 64, 6);               // sill
  const lit = rnd();
  if (lit > 0.25){ const k = 0.55 + rnd()*0.45; eg.fillStyle = `rgb(${255*k|0},${190*k|0},${105*k|0})`; eg.fillRect(x + 38, y + 30, 52, 136);
    eg.strokeStyle = '#000'; eg.lineWidth = 3; eg.beginPath(); eg.moveTo(x + 64, y + 30); eg.lineTo(x + 64, y + 166); for (let kk = 1; kk < 4; kk++){ eg.moveTo(x + 38, y + 30 + kk*34); eg.lineTo(x + 90, y + 30 + kk*34); } eg.stroke(); }
}
const facadeMats = [];
let dormerMat;
function facadeMat(bays, floors){
  const m = new THREE.MeshStandardMaterial({map:tex(fc, bays/4, floors/2, true), emissiveMap:tex(ec, bays/4, floors/2, true), emissive:0xffc477, emissiveIntensity:0, roughness:0.8});
  facadeMats.push(m); return m;
}

dormerMat = facadeMat(1, 1);
/* ================= world root groups ================= */
const chateau = new THREE.Group(); chateau.name = 'Sato';
const garden = new THREE.Group(); garden.name = 'Bahce';
const temple = new THREE.Group(); temple.name = 'Tapinak';
scene.add(chateau, garden, temple);
function mesh(geo, mat, x, y, z, parent, shadow = true){
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; (parent || scene).add(m); return m;
}

/* ground */
const ground = mesh(new THREE.PlaneGeometry(2400, 2400), groundMat, 0, 0, 0, scene, false); ground.rotation.x = -Math.PI/2;
const gravel = mesh(new THREE.PlaneGeometry(76, 74), gravelMat, 0, 0.03, 14, garden, false); gravel.rotation.x = -Math.PI/2;
gravelMat.map.repeat.set(20, 20);
const tGravel = mesh(new THREE.CircleGeometry(13, 64), gravelMat, TEMPLE.x, 0.05, TEMPLE.z, garden, false); tGravel.rotation.x = -Math.PI/2;
const fGravel = mesh(new THREE.CircleGeometry(9.5, 64), gravelMat, 0, 0.05, 10, garden, false); fGravel.rotation.x = -Math.PI/2;

/* ================= château ================= */
const CZ = -40; // centre line of the main block
function cornice(w, d, y, x, z){ mesh(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), stoneMat, x, y, z, chateau); }
function block(w, h, d, x, z, bays, floors){
  mesh(new THREE.BoxGeometry(w, h, d), facadeMat(bays, floors), x, h/2, z, chateau);
  mesh(new THREE.BoxGeometry(w + 0.3, 0.9, d + 0.3), stoneMat, x, 0.45, z, chateau); // plinth
  cornice(w, d, h, x, z);
}
function mansard(w, d, h, x, y, z, alongZ){
  const s = new THREE.Shape();
  s.moveTo(-d/2, 0); s.lineTo(d/2, 0); s.lineTo(d/2 - 1.1, h*0.72); s.lineTo(d/2 - 3.0, h); s.lineTo(-d/2 + 3.0, h); s.lineTo(-d/2 + 1.1, h*0.72); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth:w, bevelEnabled:false});
  g.translate(0, 0, -w/2); if (!alongZ) g.rotateY(Math.PI/2);
  const m = mesh(g, slateMat, x, y, z, chateau);
  // dormers
  const n = Math.max(2, Math.round(w / 3.6)), dg = new THREE.BoxGeometry(1.2, 1.7, 1.4), dorm = new THREE.InstancedMesh(dg, dormerMat, n * 2);
  const dm = new THREE.Matrix4(); let k = 0;
  for (let i = 0; i < n; i++){
    const t = -w/2 + (i + 0.5) * w / n;
    [-1, 1].forEach(side => {
      const off = side * (d/2 - 0.75);
      dm.makeTranslation(alongZ ? x + off : x + t, y + 1.5, alongZ ? z + t : z + off); dorm.setMatrixAt(k++, dm);
    });
  }
  dorm.castShadow = true; chateau.add(dorm);
  return m;
}
function hipRoof(w, d, h, x, y, z){
  const g = new THREE.ConeGeometry(1, h, 4, 1); g.rotateY(Math.PI/4); g.scale(w/1.41*1.04, 1, d/1.41*1.04); g.translate(0, h/2, 0);
  mesh(g, slateMat, x, y, z, chateau);
  mesh(new THREE.CylinderGeometry(0.04, 0.12, 2.2, 8), goldMat, x, y + h + 1, z, chateau);
}
function chimney(x, y, z){ mesh(new THREE.BoxGeometry(1.1, 3, 0.7), stoneMat, x, y, z, chateau); mesh(new THREE.BoxGeometry(1.3, 0.25, 0.9), stoneMat, x, y + 1.6, z, chateau); }

// centre pavilion
block(14, 16, 18, 0, CZ, 4, 4);
{
  const domeG = new THREE.SphereGeometry(6.2, 48, 24, 0, Math.PI*2, 0, Math.PI/2); domeG.scale(1, 1.35, 1);
  mesh(new THREE.CylinderGeometry(6.4, 6.6, 1.6, 48), stoneMat, 0, 17, CZ, chateau);
  mesh(domeG, slateMat, 0, 17.8, CZ, chateau);
  for (let i = 0; i < 6; i++){ // gilded ribs
    const rib = new THREE.Mesh(new THREE.TorusGeometry(6.24, 0.07, 6, 32, Math.PI), goldMat);
    rib.scale.set(1, 1.35, 1); rib.rotation.y = i / 6 * Math.PI; rib.position.set(0, 17.8, CZ); chateau.add(rib);
  }
  mesh(new THREE.CylinderGeometry(1.3, 1.4, 2.4, 16), stoneMat, 0, 27, CZ, chateau);
  const lantern = new THREE.SphereGeometry(1.5, 24, 12, 0, Math.PI*2, 0, Math.PI/2);
  mesh(lantern, slateMat, 0, 28.2, CZ, chateau);
  mesh(new THREE.ConeGeometry(0.25, 2.6, 10), goldMat, 0, 30.8, CZ, chateau);
  mesh(new THREE.SphereGeometry(0.35, 16, 10), goldMat, 0, 29.6, CZ, chateau);
  // pediment
  const ps = new THREE.Shape(); ps.moveTo(-7.2, 0); ps.lineTo(7.2, 0); ps.lineTo(0, 3.2); ps.closePath();
  const pg = new THREE.ExtrudeGeometry(ps, {depth:0.9, bevelEnabled:false});
  mesh(pg, stoneMat, 0, 16.2, CZ + 9 - 0.6, chateau);
  mesh(new THREE.TorusGeometry(0.9, 0.12, 8, 32), goldMat, 0, 17.4, CZ + 9.35, chateau);
  // door + columns
  const ds = new THREE.Shape(); ds.moveTo(-1.7, 0); ds.lineTo(1.7, 0); ds.lineTo(1.7, 3.6); ds.absarc(0, 3.6, 1.7, 0, Math.PI, false); ds.closePath();
  mesh(new THREE.ShapeGeometry(ds, 24), new THREE.MeshStandardMaterial({color:0x2a1c14, roughness:0.6}), 0, 1.0, CZ + 9.02, chateau, false);
  for (let i = -1; i <= 1; i += 2) for (let j = 0; j < 2; j++){
    const x = i * (2.6 + j * 2.4);
    mesh(new THREE.CylinderGeometry(0.42, 0.48, 7.2, 20), stoneMat, x, 4.6, CZ + 9.55, chateau);
    mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), stoneMat, x, 8.3, CZ + 9.55, chateau);
  }
  mesh(new THREE.BoxGeometry(12.4, 0.7, 1.4), stoneMat, 0, 8.8, CZ + 9.55, chateau);
}
// mid sections
[-1, 1].forEach(sx => {
  block(14, 12, 14, sx * 14, CZ, 4, 3);
  mansard(14, 14.2, 5.2, sx * 14, 12.2, CZ, false);
  chimney(sx * 10, 17.8, CZ - 2); chimney(sx * 18, 17.8, CZ + 2);
});
// end pavilions + towers
[-1, 1].forEach(sx => {
  block(10, 14, 18, sx * 26, CZ, 3, 4);
  hipRoof(10.6, 18.6, 7.5, sx * 26, 14.2, CZ);
  [-1, 1].forEach(sz => {
    const x = sx * 31.6, z = CZ + sz * 9.2;
    const tm = facadeMat(8, 4);
    mesh(new THREE.CylinderGeometry(3.3, 3.5, 18, 40), tm, x, 9, z, chateau);
    mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.5, 40), stoneMat, x, 18.1, z, chateau);
    mesh(new THREE.ConeGeometry(3.9, 8.5, 40), slateMat, x, 22.6, z, chateau);
    mesh(new THREE.CylinderGeometry(0.03, 0.1, 2.6, 8), goldMat, x, 28.1, z, chateau);
    mesh(new THREE.SphereGeometry(0.22, 12, 8), goldMat, x, 27.1, z, chateau);
  });
});
// terrace, steps, balustrade
mesh(new THREE.BoxGeometry(70, 1, 7), stoneMat, 0, 0.5, -27.5, chateau);
for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(12, (k + 1) * 0.25, 0.5), stoneMat, 0, (k + 1) * 0.125, -22.25 - k * 0.5, chateau);
{
  const bal = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.13, 0.75, 8), stoneMat, 140), bm = new THREE.Matrix4(); let n = 0;
  for (let x = -34.5; x <= 34.5; x += 0.5){ if (Math.abs(x) < 6.2) continue; bm.makeTranslation(x, 1.38, -24.25); bal.setMatrixAt(n++, bm); }
  bal.count = n; bal.castShadow = true; chateau.add(bal);
  [-1, 1].forEach(s => mesh(new THREE.BoxGeometry(28.6, 0.18, 0.45), stoneMat, s * 20.35, 1.82, -24.25, chateau));
}
// stables
{
  const st = new THREE.Group(); st.position.set(-66, 0, 4); chateau.add(st);
  mesh(new THREE.BoxGeometry(10, 6, 34), facadeMat(10, 2), 0, 3, 0, st);
  mesh(new THREE.BoxGeometry(10.5, 0.4, 34.5), stoneMat, 0, 6, 0, st);
  const s = new THREE.Shape(); s.moveTo(-5.2, 0); s.lineTo(5.2, 0); s.lineTo(4.2, 2.8); s.lineTo(2.2, 3.9); s.lineTo(-2.2, 3.9); s.lineTo(-4.2, 2.8); s.closePath();
  const rg2 = new THREE.ExtrudeGeometry(s, {depth:34.4, bevelEnabled:false}); rg2.translate(0, 0, -17.2);
  mesh(rg2, slateMat, 0, 6.2, 0, st);
  for (let i = -2; i <= 2; i++){ const dsh = new THREE.Shape(); dsh.moveTo(-1.2,0); dsh.lineTo(1.2,0); dsh.lineTo(1.2,2.4); dsh.absarc(0,2.4,1.2,0,Math.PI,false);
    const d = mesh(new THREE.ShapeGeometry(dsh, 16), doorMat, 5.08, 0.2, i * 6.5, st, false); d.rotation.y = Math.PI/2; }
}

/* ================= garden ================= */
const PARTERRES = [
  {x0:6, x1:30, z0:-20, z1:3, pal:['#d61f33','#ffcf2a','#ff6a1a']},
  {x0:-30, x1:-6, z0:-20, z1:3, pal:['#8f5bd6','#b48cff','#f2f2ff']},
  {x0:6, x1:30, z0:17, z1:46, pal:['#ff6fae','#ffffff','#e2385f']},
  {x0:-30, x1:-6, z0:17, z1:46, pal:['#ff8c1a','#e0349c','#ffd84a']},
];
const colliders = {boxes:[], circles:[]};
// Ek alanlar (haras, seralar, kış bahçesi) için ağaçsız bölgeler [x0, z0, x1, z1]
const EXCLUDE = [[-165, -62, -76, 82], [-47, 26, -33, 58], [33, 26, 47, 58], [-30, 96, 30, 142], [50, 36, 172, 158], ...COURT_ZONES];
const timeU = {value:0}, windU = {value:0.35};
// Rüzgâr: yer değiştirme dünya uzayında uygulanır (örnekler rastgele dönük olsa da hepsi aynı yöne eğilir).
// Rüzgâr yönünde ilerleyen esinti dalgaları çimen ve çiçeklerde "dalga" deseni oluşturur.
const WIND_DIR = new THREE.Vector2(0.82, 0.57).normalize();
const windDirU = {value:WIND_DIR};
const WIND_GLSL = `
  uniform float uTime; uniform float uWind; uniform vec2 uWindDir;
  vec3 windOffset(vec3 ip, float hh, float k, float tree){
    vec2 d = uWindDir;
    float along = dot(ip.xz, d);
    float gust = 0.5 + 0.5 * sin(along * 0.11 - uTime * 1.7) * sin(along * 0.037 - uTime * 0.6 + ip.x * 0.02);
    float flutter = sin(uTime * 6.5 + ip.x * 2.1 + ip.z * 1.7) * 0.18 + sin(uTime * 11.0 + ip.z * 3.3) * 0.08;
    float bend = uWind * (0.25 + 1.25 * gust) + uWind * flutter;
    vec3 o;
    if (tree > 0.5){
      float sway = sin(uTime * 1.3 + ip.x * 0.2 + ip.z * 0.15) * 0.35 + 0.65 * gust;
      o = vec3(d.x, 0.0, d.y) * uWind * sway * (ip.y * 0.07) * k + vec3(flutter * 0.08 * uWind);
    } else {
      o = vec3(d.x, 0.0, d.y) * bend * hh * hh * k;
      o.xz += vec2(-d.y, d.x) * flutter * uWind * hh * hh * k * 0.5;
      o.y -= bend * bend * hh * hh * k * 0.35;
    }
    return o;
  }
`;
function windMat(mat, k, tree){
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = timeU; sh.uniforms.uWind = windU; sh.uniforms.uWindDir = windDirU;
    sh.vertexShader = WIND_GLSL + sh.vertexShader.replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 ip = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #endif
      mvPosition.xyz += windOffset(ip, max(position.y, 0.0), ${k.toFixed(3)}, ${tree ? '1.0' : '0.0'});
      mvPosition = modelViewMatrix * mvPosition;
      gl_Position = projectionMatrix * mvPosition;`);
  };
  mat.customProgramCacheKey = () => 'wind' + k + (tree ? 't' : 'g');
  return mat;
}
const swayMat = (mat, k) => windMat(mat, k * 1.6, false);
// lawns + grass blades + hedges + flowers
const bladeGeo = new THREE.PlaneGeometry(0.07, 0.42, 1, 3); bladeGeo.translate(0, 0.21, 0);
{ const p = bladeGeo.attributes.position, nrm = bladeGeo.attributes.normal;
  for (let i = 0; i < p.count; i++){ const y = p.getY(i); p.setX(i, p.getX(i) * (1 - y / 0.46)); nrm.setXYZ(i, 0, 1, 0); } }
const grassMat = swayMat(new THREE.MeshLambertMaterial({side:THREE.DoubleSide}), 2.2);
const BLADES_PER = 6500;
const grass = new THREE.InstancedMesh(bladeGeo, grassMat, BLADES_PER * PARTERRES.length);
const stemGeo = new THREE.CylinderGeometry(0.007, 0.01, 0.44, 4); stemGeo.translate(0, 0.22, 0);
const headGeo = new THREE.IcosahedronGeometry(0.075, 0); headGeo.scale(1, 0.65, 1); headGeo.translate(0, 0.46, 0);
const stemMat = swayMat(new THREE.MeshLambertMaterial({color:0x3f6b2a}), 1.6);
const headMat = swayMat(new THREE.MeshStandardMaterial({roughness:0.55}), 1.6);
const MAX_FLOWERS = 9000;
const stems = new THREE.InstancedMesh(stemGeo, stemMat, MAX_FLOWERS), heads = new THREE.InstancedMesh(headGeo, headMat, MAX_FLOWERS);
const hedgeBox = new THREE.BoxGeometry(1, 1, 1);
const hedges = new THREE.InstancedMesh(hedgeBox, hedgeMat, 64);
const topiCone = new THREE.InstancedMesh(new THREE.ConeGeometry(0.75, 2.6, 16), hedgeMat, 64);
const topiBall = new THREE.InstancedMesh(new THREE.SphereGeometry(0.75, 16, 12), hedgeMat, 64);
const topiPot = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.35, 0.6, 12), stoneMat, 64);
{
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), yAxis = new THREE.Vector3(0,1,0);
  let gi = 0, fi = 0, hi = 0, ti = 0, bi = 0;
  const addHedge = (x, z, w, d) => { m.compose(p.set(x, 0.42, z), q.identity(), s.set(w, 0.85, d)); hedges.setMatrixAt(hi++, m); colliders.boxes.push({x, z, hw:w/2, hd:d/2, rot:0}); };
  const addFlower = (x, z, pal) => {
    if (fi >= MAX_FLOWERS) return;
    const sc = 0.75 + rnd() * 0.6;
    m.compose(p.set(x, 0.02, z), q.setFromAxisAngle(yAxis, rnd()*6.28), s.set(sc, sc, sc));
    stems.setMatrixAt(fi, m); heads.setMatrixAt(fi, m);
    c.set(pal[Math.floor(rnd() * pal.length)]).offsetHSL((rnd()-.5)*0.03, 0, (rnd()-.5)*0.08); heads.setColorAt(fi, c); fi++;
  };
  PARTERRES.forEach(P => {
    const w = P.x1 - P.x0, d = P.z1 - P.z0, cx = (P.x0 + P.x1)/2, cz = (P.z0 + P.z1)/2;
    const lawn = mesh(new THREE.PlaneGeometry(w, d), lawnMat, cx, 0.09, cz, garden, false); lawn.rotation.x = -Math.PI/2;
    for (let i = 0; i < BLADES_PER; i++){
      m.compose(p.set(P.x0 + 0.5 + rnd()*(w-1), 0.09, P.z0 + 0.5 + rnd()*(d-1)), q.setFromAxisAngle(yAxis, rnd()*6.28), s.set(1, 0.6 + rnd()*0.9, 1));
      grass.setMatrixAt(gi, m); c.setHSL(0.25 + rnd()*0.06, 0.5 + rnd()*0.2, 0.12 + rnd()*0.1); grass.setColorAt(gi, c); gi++;
    }
    // hedge frame with gaps at side centres
    const gap = 3;
    [[P.z0, true], [P.z1, true], [P.x0, false], [P.x1, false]].forEach(([v, horiz]) => {
      const len = horiz ? w : d, half = (len - gap) / 2;
      [-1, 1].forEach(sd => {
        const off = sd * (gap/2 + half/2);
        if (horiz) addHedge(cx + off, v, half, 0.6); else addHedge(v, cz + off, 0.6, half);
      });
    });
    // inner embroidery: diagonal hedge cross
    const inner = Math.min(w, d) * 0.3;
    [Math.PI/4, -Math.PI/4].forEach(a => { m.compose(p.set(cx, 0.3, cz), q.setFromAxisAngle(yAxis, a), s.set(inner * 2.2, 0.55, 0.4)); hedges.setMatrixAt(hi++, m); colliders.boxes.push({x:cx, z:cz, hw:inner*1.1, hd:0.2, rot:a}); });
    // flower borders (1.2 m strip inside the hedge)
    const strip = 1.3;
    for (let i = 0; i < (w + d) * 2 * strip * 14; i++){
      const side = Math.floor(rnd()*4); let x, z;
      if (side === 0){ x = P.x0 + 0.6 + rnd()*(w-1.2); z = P.z0 + 0.5 + rnd()*strip; }
      else if (side === 1){ x = P.x0 + 0.6 + rnd()*(w-1.2); z = P.z1 - 0.5 - rnd()*strip; }
      else if (side === 2){ x = P.x0 + 0.5 + rnd()*strip; z = P.z0 + 0.6 + rnd()*(d-1.2); }
      else { x = P.x1 - 0.5 - rnd()*strip; z = P.z0 + 0.6 + rnd()*(d-1.2); }
      if (side < 2 && Math.abs(x - cx) < 1.6) continue; if (side >= 2 && Math.abs(z - cz) < 1.6) continue;
      addFlower(x, z, P.pal);
    }
    // central rainbow rosette
    const rainbow = ['#e8213a','#ff8a1a','#ffd42a','#ff5fa8','#8a5bd6','#ffffff'];
    for (let i = 0; i < 520; i++){ const a = rnd()*6.283, r = Math.sqrt(rnd()) * 2.6, ring = Math.floor(r / 0.45);
      addFlower(cx + Math.cos(a)*r, cz + Math.sin(a)*r, [rainbow[ring % rainbow.length]]); }
    // quarter beds between cross and frame
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([qx, qz], k) => {
      const bx = cx + qx * w * 0.28, bz = cz + qz * d * 0.3;
      for (let i = 0; i < 160; i++){ const a = rnd()*6.283, r = Math.sqrt(rnd())*1.5; addFlower(bx + Math.cos(a)*r, bz + Math.sin(a)*r, [P.pal[k % P.pal.length]]); }
      m.compose(p.set(bx, 1.4, bz), q.identity(), s.set(1,1,1)); topiCone.setMatrixAt(ti++, m); colliders.circles.push({x:bx, z:bz, r:0.7});
    });
    // corner balls in pots
    [[P.x0, P.z0],[P.x1, P.z0],[P.x0, P.z1],[P.x1, P.z1]].forEach(([x, z]) => {
      m.compose(p.set(x, 0.3, z), q.identity(), s.set(1,1,1)); topiPot.setMatrixAt(bi, m); colliders.circles.push({x, z, r:0.75});
      m.compose(p.set(x, 1.3, z), q.identity(), s.set(1,1,1)); topiBall.setMatrixAt(bi++, m);
    });
  });
  // cone avenue along the central path
  for (let z = -18; z <= 46; z += 8){ if (z > -1 && z < 21) continue; [-1, 1].forEach(sd => { m.compose(p.set(sd * 5.2, 1.3, z), q.identity(), s.set(1, 1, 1)); topiCone.setMatrixAt(ti++, m); colliders.circles.push({x:sd*5.2, z, r:0.7}); }); }
  grass.count = gi; stems.count = heads.count = fi; hedges.count = hi; topiCone.count = ti; topiBall.count = topiPot.count = bi;
  [hedges, topiCone, topiBall, topiPot].forEach(o => { o.castShadow = true; o.receiveShadow = true; garden.add(o); });
  grass.receiveShadow = true; heads.receiveShadow = stems.receiveShadow = true;
  garden.add(grass, stems, heads);
}

// fountain
const fountainWater = new THREE.MeshStandardMaterial({color:0x2c4f60, roughness:0.04, metalness:0.7, transparent:true, opacity:0.92});
{
  const prof = [[3.9,0],[4.7,0],[4.75,0.55],[4.6,0.75],[4.25,0.75],[4.2,0.4],[3.9,0.4]].map(([x,y]) => new THREE.Vector2(x,y));
  mesh(new THREE.LatheGeometry(prof, 64), stoneMat, 0, 0, 10, garden);
  const w = mesh(new THREE.CircleGeometry(4.25, 48), fountainWater, 0, 0.55, 10, garden, false); w.rotation.x = -Math.PI/2;
  mesh(new THREE.CylinderGeometry(0.35, 0.6, 1.8, 20), stoneMat, 0, 1.2, 10, garden);
  const bowl = [[0.2,0],[1.7,0.35],[1.75,0.5],[1.5,0.45],[0.3,0.2]].map(([x,y]) => new THREE.Vector2(x,y));
  mesh(new THREE.LatheGeometry(bowl, 40), stoneMat, 0, 2.0, 10, garden);
  mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.9, 12), goldMat, 0, 2.7, 10, garden);
}
const DROPS = 700; const dGeo = new THREE.BufferGeometry();
const dPos = new Float32Array(DROPS*3), dVel = new Float32Array(DROPS*3);
function resetDrop(i){ const a = rnd()*6.283, sp = 0.6 + rnd()*0.7; dPos.set([0, 3.1, 10], i*3); dVel.set([Math.cos(a)*sp, 3.6 + rnd()*1.4, Math.sin(a)*sp], i*3); }
for (let i = 0; i < DROPS; i++){ resetDrop(i); dPos[i*3+1] = 0.6 + rnd()*3; }
dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dropMat = new THREE.PointsMaterial({color:0xdaeeff, size:0.07, transparent:true, opacity:0.75, depthWrite:false});
const drops = new THREE.Points(dGeo, dropMat); drops.frustumCulled = false; garden.add(drops);

// lamp posts
const lampHeadMat = new THREE.MeshBasicMaterial({color:0x222222, toneMapped:false});
{
  const posts = [], gpost = new THREE.CylinderGeometry(0.05, 0.08, 3.2, 8);
  for (let z = -20; z <= 46; z += 9.5){ if (z > -2 && z < 22) continue; posts.push([-4.4, z], [4.4, z]); }
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const a = i / 8 * Math.PI * 2; posts.push([Math.cos(a) * 8.6, 10 + Math.sin(a) * 8.6]); });
  const pm = new THREE.InstancedMesh(gpost, darkMetal, posts.length), hm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.46, 0.32), lampHeadMat, posts.length), cap = new THREE.InstancedMesh(new THREE.ConeGeometry(0.3, 0.3, 4), darkMetal, posts.length);
  const m = new THREE.Matrix4();
  posts.forEach(([x, z], i) => { colliders.circles.push({x, z, r:0.2}); m.makeTranslation(x, 1.6, z); pm.setMatrixAt(i, m); m.makeTranslation(x, 3.4, z); hm.setMatrixAt(i, m); m.makeTranslation(x, 3.78, z); cap.setMatrixAt(i, m); });
  pm.castShadow = true; garden.add(pm, hm, cap);
}

// paddock fence
{
  const posts = []; const x0 = -58, x1 = -44, z0 = -12, z1 = 22;
  for (let x = x0; x <= x1; x += 3.5) posts.push([x, z0], [x, z1]);
  for (let z = z0 + 3.4; z < z1; z += 3.4) posts.push([x0, z], [x1, z]);
  const wood = new THREE.MeshStandardMaterial({color:0x6b4a2e, roughness:0.85});
  const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), wood, posts.length), m = new THREE.Matrix4();
  posts.forEach(([x, z], i) => { m.makeTranslation(x, 0.7, z); pm.setMatrixAt(i, m); }); pm.castShadow = true; garden.add(pm);
  [0.6, 1.15].forEach(y => {
    mesh(new THREE.BoxGeometry(x1 - x0, 0.1, 0.08), wood, (x0+x1)/2, y, z0, garden); mesh(new THREE.BoxGeometry(x1 - x0, 0.1, 0.08), wood, (x0+x1)/2, y, z1, garden);
    mesh(new THREE.BoxGeometry(0.08, 0.1, z1 - z0), wood, x0, y, (z0+z1)/2, garden); mesh(new THREE.BoxGeometry(0.08, 0.1, z1 - z0), wood, x1, y, (z0+z1)/2, garden);
  });
}

// trees
{
  const pts = [];
  for (let z = -18; z <= 70; z += 6.5) [-41, -47, 41, 47].forEach(x => pts.push([x + (rnd()-.5), z + (rnd()-.5), 1.0 + rnd()*0.25]));
  for (let a = 0.15; a < Math.PI - 0.1; a += 0.22) pts.push([TEMPLE.x + Math.cos(a)*20, TEMPLE.z + 3 + Math.sin(a)*16, 1.1 + rnd()*0.4]);
  for (let i = 0; i < 70; i++) pts.push([(rnd()-.5)*140, -62 - rnd()*45, 1 + rnd()*0.6]);
  for (let i = 0; i < 380; i++){ const a = rnd()*6.283, r = 115 + rnd()*260; pts.push([Math.cos(a)*r, 20 + Math.sin(a)*r, 1 + rnd()*0.8]); }
  for (let i = pts.length - 1; i >= 0; i--){ const [x, z] = pts[i]; if (EXCLUDE.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1)) pts.splice(i, 1); }
  const trunkG = new THREE.CylinderGeometry(0.16, 0.28, 3.2, 7); trunkG.translate(0, 1.6, 0);
  const leafG = new THREE.IcosahedronGeometry(1, 1);
  const trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({color:0x4a3626, roughness:0.9}), pts.length);
  const leaves = new THREE.InstancedMesh(leafG, windMat(new THREE.MeshStandardMaterial({roughness:0.85, flatShading:true}), 1.0, true), pts.length * 4);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  let li = 0;
  pts.forEach(([x, z, k], i) => {
    m.compose(p.set(x, 0, z), q.identity(), s.set(k, k, k)); trunks.setMatrixAt(i, m); if (Math.hypot(x, z - 10) < 140) colliders.circles.push({x, z, r:0.35 * k});
    const hue = 0.24 + rnd()*0.08, light = 0.17 + rnd()*0.09;
    for (let j = 0; j < 4; j++){
      const r = (1.5 + rnd()*0.9) * k;
      m.compose(p.set(x + (rnd()-.5)*1.8*k, (3.6 + j*0.9 + rnd()*0.6) * k, z + (rnd()-.5)*1.8*k), q.setFromEuler(new THREE.Euler(rnd()*3, rnd()*3, 0)), s.set(r, r*0.9, r));
      leaves.setMatrixAt(li, m); c.setHSL(hue, 0.45, light + (rnd()-.5)*0.04); leaves.setColorAt(li, c); li++;
    }
  });
  trunks.castShadow = leaves.castShadow = true; leaves.receiveShadow = true;
  garden.add(trunks, leaves);
}

/* ================= temple ================= */
temple.position.copy(TEMPLE);
{
  [[8.4, 0.4], [7.6, 0.8], [6.8, 1.2]].forEach(([r, y]) => mesh(new THREE.CylinderGeometry(r, r + 0.15, 0.4, 64), marbleMat, 0, y - 0.2, 0, temple));
  const N = 10;
  for (let i = 0; i < N; i++){
    const a = i / N * Math.PI * 2 + Math.PI / N, x = Math.cos(a) * 5.3, z = Math.sin(a) * 5.3;
    mesh(new THREE.CylinderGeometry(0.34, 0.4, 5.2, 24), marbleMat, x, 3.8, z, temple);
    mesh(new THREE.BoxGeometry(0.95, 0.3, 0.95), marbleMat, x, 1.35, z, temple);
    mesh(new THREE.CylinderGeometry(0.55, 0.36, 0.38, 24), goldMat, x, 6.55, z, temple);
  }
  mesh(new THREE.CylinderGeometry(6.1, 6.1, 0.9, 64, 1), marbleMat, 0, 7.15, 0, temple);
  mesh(new THREE.TorusGeometry(6.12, 0.06, 6, 96), goldMat, 0, 7.45, 0, temple).rotation.x = Math.PI/2;
  const dg = new THREE.SphereGeometry(5.9, 64, 24, 0, Math.PI*2, 0, Math.PI/2); dg.scale(1, 0.72, 1);
  const dome = mesh(dg, marbleMat, 0, 7.6, 0, temple); dome.material = marbleMat;
  mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.9, 20), marbleMat, 0, 12.0, 0, temple);
  mesh(new THREE.SphereGeometry(0.45, 16, 10), goldMat, 0, 12.7, 0, temple);
  mesh(new THREE.ConeGeometry(0.12, 1.4, 10), goldMat, 0, 13.6, 0, temple);
  // pedestal
  mesh(new THREE.CylinderGeometry(1.2, 1.35, 0.35, 8), marbleMat, 0, 1.55, 0, temple);
  mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.75, 8), marbleMat, 0, 2.1, 0, temple);
  mesh(new THREE.TorusGeometry(0.78, 0.04, 6, 48), goldMat, 0, 2.47, 0, temple).rotation.x = Math.PI/2;
}
const gemGlowMat = new THREE.MeshBasicMaterial({color:0xff2a4a, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide});
const skyBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.3, 140, 24, 1, true), gemGlowMat);
skyBeam.position.set(TEMPLE.x, 72, TEMPLE.z); scene.add(skyBeam);
const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 8, 64), new THREE.MeshBasicMaterial({color:0xff2a4a, toneMapped:false, transparent:true}));
ringGlow.rotation.x = Math.PI/2; ringGlow.position.set(TEMPLE.x, 2.5, TEMPLE.z); scene.add(ringGlow);
const templeLight = new THREE.PointLight(0xff2a4a, 1.5, 22, 1.6); templeLight.position.set(TEMPLE.x, 4.2, TEMPLE.z); scene.add(templeLight);

/* ================= sword workshop ================= */
const bladeMat = new THREE.MeshPhysicalMaterial({color:0xb8bcc4, metalness:1, roughness:0.16, clearcoat:0.5, clearcoatRoughness:0.15});
const hiltMat = new THREE.MeshStandardMaterial({color:0xd4af37, metalness:1, roughness:0.22});
const gripMat = new THREE.MeshStandardMaterial({color:0x3a1c12, roughness:0.7});
const gemMat = new THREE.MeshStandardMaterial({color:0x220006, emissive:0xff2a4a, emissiveIntensity:1.6, roughness:0.08, metalness:0.1});
function runeTex(){
  const [c, g] = canvas(64, 1024); g.fillStyle = '#000'; g.fillRect(0,0,64,1024); g.strokeStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round';
  let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let y = 40; y < 1000; y += 64){ g.beginPath(); g.moveTo(32, y); g.lineTo(32, y + 44); const k = Math.floor(r()*5);
    if (k === 0){ g.moveTo(32,y+6); g.lineTo(46,y+18); g.moveTo(32,y+20); g.lineTo(46,y+32); }
    if (k === 1){ g.moveTo(32,y+4); g.lineTo(46,y+16); g.lineTo(32,y+28); }
    if (k === 2){ g.moveTo(18,y+10); g.lineTo(46,y+34); }
    if (k === 3){ g.moveTo(32,y+12); g.lineTo(18,y+24); g.moveTo(32,y+12); g.lineTo(46,y+24); }
    if (k === 4){ g.moveTo(20,y+4); g.lineTo(32,y+22); g.lineTo(44,y+4); } g.stroke(); }
  return new THREE.CanvasTexture(c);
}
const runeMat = new THREE.MeshBasicMaterial({color:0xff2a4a, map:runeTex(), transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false});

const swordCfg = {blade:'uzun', guard:'hac', material:'celik', gem:'yakut'};
const swordPivot = new THREE.Group(); swordPivot.name = 'Kilic';
swordPivot.position.set(TEMPLE.x, 6.1, TEMPLE.z); scene.add(swordPivot);
let swordModel = null;
function bladeShape(type){
  const s = new THREE.Shape(), L = 2.1, N = 40;
  if (type === 'pala'){
    const left = [], right = [];
    for (let i = 0; i <= N; i++){ const t = i / N; left.push([-0.08 + 0.32*t*t, L*0.92*t]); right.push([0.1 + 0.3*t*t + 0.05*Math.sin(Math.PI*t), L*0.92*t]); }
    s.moveTo(left[0][0], left[0][1]); left.forEach(([x, y]) => s.lineTo(x, y)); s.lineTo(0.36, L*0.98);
    right.reverse().forEach(([x, y]) => s.lineTo(x, y)); s.closePath(); return s;
  }
  const half = t => type === 'genis' ? 0.15 - 0.03*t : type === 'alev' ? (0.085 + 0.03*Math.sin(t*Math.PI*9)) * (1 - 0.25*t) : 0.09 - 0.012*t;
  const tipStart = type === 'genis' ? 0.88 : 0.82;
  s.moveTo(-half(0), 0);
  for (let i = 1; i <= N; i++){ const t = i / N * tipStart; s.lineTo(-half(t), L*t); }
  s.lineTo(0, L);
  for (let i = N; i >= 0; i--){ const t = i / N * tipStart; s.lineTo(half(t), L*t); }
  s.closePath(); return s;
}
function buildSword(){
  if (swordModel){ swordPivot.remove(swordModel); swordModel.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  const g = new THREE.Group();
  const bg = new THREE.ExtrudeGeometry(bladeShape(swordCfg.blade), {depth:0.018, bevelEnabled:true, bevelThickness:0.028, bevelSize:0.035, bevelSegments:2, curveSegments:1});
  bg.translate(0, 0, -0.009); bg.computeVertexNormals();
  const blade = new THREE.Mesh(bg, bladeMat); blade.castShadow = true; g.add(blade);
  if (swordCfg.blade !== 'pala'){
    const rg = new THREE.PlaneGeometry(swordCfg.blade === 'genis' ? 0.09 : 0.05, 1.45);
    [0.0375, -0.0375].forEach((z, i) => { const r = new THREE.Mesh(rg, runeMat); r.position.set(0, 0.9, z); if (i) r.rotation.y = Math.PI; g.add(r); });
  }
  if (swordCfg.guard === 'hac'){
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.13), hiltMat); bar.position.y = -0.02; g.add(bar);
    [-1, 1].forEach(sx => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 10), hiltMat); b.position.set(sx*0.47, -0.02, 0); g.add(b); });
  } else if (swordCfg.guard === 'kanat'){
    const ws = new THREE.Shape(); ws.moveTo(0, -0.06); ws.quadraticCurveTo(0.3, -0.1, 0.62, 0.3); ws.quadraticCurveTo(0.42, 0.06, 0.32, 0.12); ws.quadraticCurveTo(0.22, 0.02, 0.12, 0.08); ws.quadraticCurveTo(0.06, 0.02, 0, 0.06); ws.closePath();
    const wg = new THREE.ExtrudeGeometry(ws, {depth:0.05, bevelEnabled:true, bevelThickness:0.015, bevelSize:0.012, bevelSegments:1, curveSegments:10}); wg.translate(0, 0, -0.025);
    [-1, 1].forEach(sx => { const w = new THREE.Mesh(wg, hiltMat); w.scale.x = sx; g.add(w); });
  } else {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.026, 10, 40), hiltMat); ring.position.y = 0.06; g.add(ring);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.1), hiltMat); bar.position.y = -0.03; g.add(bar);
  }
  [0.075, -0.075].forEach(z => { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), gemMat); gem.position.set(0, -0.02, z); gem.scale.set(1, 1.3, 0.55); g.add(gem); });
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.5, 20), gripMat); grip.position.y = -0.31; g.add(grip);
  for (let i = 0; i < 7; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.008, 6, 20), hiltMat); r.rotation.x = Math.PI/2; r.position.y = -0.1 - i*0.068; g.add(r); }
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), hiltMat); pommel.position.y = -0.64; pommel.scale.y = 1.15; g.add(pommel);
  const pg = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), gemMat); pg.position.y = -0.75; pg.scale.y = 1.4; g.add(pg);
  g.rotation.z = Math.PI; g.scale.setScalar(1.6);
  swordModel = g; swordPivot.add(g);
}
const MATERIALS = {
  celik:{name:'Çelik', sw:'#cfd3da', blade:{color:0xb8bcc4, metalness:1, roughness:0.16, transmission:0}, hilt:0xd4af37},
  altin:{name:'Altın', sw:'#e6b850', blade:{color:0xf0c35a, metalness:1, roughness:0.2, transmission:0}, hilt:0xc9c9c9},
  obsidyen:{name:'Obsidyen', sw:'#1c1820', blade:{color:0x141118, metalness:0.4, roughness:0.05, transmission:0}, hilt:0xd4af37},
  kristal:{name:'Kristal', sw:'#cdeeff', blade:{color:0xd8f2ff, metalness:0, roughness:0.03, transmission:0.95, thickness:0.5, ior:1.55}, hilt:0xe8e8f0},
};
const GEMS = {yakut:{name:'Yakut', c:'#ff2a4a'}, zumrut:{name:'Zümrüt', c:'#22e08a'}, safir:{name:'Safir', c:'#2f7bff'}, ametist:{name:'Ametist', c:'#b35bff'}};
function applyMaterial(){
  const M = MATERIALS[swordCfg.material];
  Object.entries(M.blade).forEach(([k, v]) => { if (k === 'color') bladeMat.color.setHex(v); else bladeMat[k] = v; });
  bladeMat.needsUpdate = true; hiltMat.color.setHex(M.hilt);
}
function applyGem(){
  const c = new THREE.Color(GEMS[swordCfg.gem].c);
  gemMat.emissive.copy(c); gemMat.color.copy(c).multiplyScalar(0.1); runeMat.color.copy(c); gemGlowMat.color.copy(c); ringGlow.material.color.copy(c); templeLight.color.copy(c); swirlMat.color.copy(c);
  document.documentElement.style.setProperty('--gem', GEMS[swordCfg.gem].c);
}
// power swirl
const SWIRL = 320; const swGeo = new THREE.BufferGeometry(); const swPos = new Float32Array(SWIRL*3), swSeed = new Float32Array(SWIRL*3);
for (let i = 0; i < SWIRL; i++){ swSeed[i*3] = rnd()*6.283; swSeed[i*3+1] = rnd(); swSeed[i*3+2] = 0.6 + rnd()*1.4; }
swGeo.setAttribute('position', new THREE.BufferAttribute(swPos, 3));
const [dc, dg2] = canvas(32, 32); const grd = dg2.createRadialGradient(16,16,0,16,16,16); grd.addColorStop(0,'#fff'); grd.addColorStop(1,'rgba(255,255,255,0)'); dg2.fillStyle = grd; dg2.fillRect(0,0,32,32);
const dotTex = new THREE.CanvasTexture(dc);
const swirlMat = new THREE.PointsMaterial({size:0.12, map:dotTex, color:0xff2a4a, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, toneMapped:false});
const swirl = new THREE.Points(swGeo, swirlMat); swirl.frustumCulled = false; scene.add(swirl);

/* ================= guards & horses ================= */
const coatMat = new THREE.MeshStandardMaterial({color:0x1d3a8a, roughness:0.7});
const whiteMat = new THREE.MeshStandardMaterial({color:0xece6d8, roughness:0.75});
const bootMat = new THREE.MeshStandardMaterial({color:0x111114, roughness:0.35, metalness:0.2});
const skinMat = new THREE.MeshStandardMaterial({color:0xd8a688, roughness:0.7});
const hatMat = new THREE.MeshStandardMaterial({color:0x15151a, roughness:0.6});
const redMat = new THREE.MeshStandardMaterial({color:0xa8182a, roughness:0.6});
const shaftMat = new THREE.MeshStandardMaterial({color:0x5a3a22, roughness:0.7});
const steelMat = new THREE.MeshStandardMaterial({color:0xc8ccd2, metalness:1, roughness:0.25});
function part(geo, mat, x, y, z, parent){ const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }
function makeGuard(){
  const g = new THREE.Group(), u = {};
  ['L', 'R'].forEach((side, i) => {
    const sx = i ? 0.11 : -0.11, leg = new THREE.Group(); leg.position.set(sx, 0.95, 0); g.add(leg);
    part(new THREE.BoxGeometry(0.16, 0.5, 0.18), whiteMat, 0, -0.25, 0, leg);
    part(new THREE.BoxGeometry(0.17, 0.46, 0.21), bootMat, 0, -0.72, 0.02, leg);
    u['leg' + side] = leg;
    const arm = new THREE.Group(); arm.position.set(i ? 0.3 : -0.3, 1.56, 0); g.add(arm);
    part(new THREE.BoxGeometry(0.13, 0.5, 0.15), coatMat, 0, -0.25, 0, arm);
    part(new THREE.BoxGeometry(0.14, 0.1, 0.16), redMat, 0, -0.5, 0, arm);
    part(new THREE.SphereGeometry(0.055, 8, 6), skinMat, 0, -0.6, 0, arm);
    u['arm' + side] = arm;
  });
  part(new THREE.BoxGeometry(0.48, 0.64, 0.28), coatMat, 0, 1.3, 0, g);
  part(new THREE.BoxGeometry(0.52, 0.34, 0.31), coatMat, 0, 0.9, -0.01, g);
  part(new THREE.BoxGeometry(0.2, 0.5, 0.02), whiteMat, 0, 1.3, 0.145, g);
  [-1, 1].forEach(s => { const b = part(new THREE.BoxGeometry(0.05, 0.78, 0.02), whiteMat, 0, 1.28, 0.152, g); b.rotation.z = s * 0.62; });
  part(new THREE.BoxGeometry(0.5, 0.06, 0.3), whiteMat, 0, 1.0, 0, g);
  [-1, 1].forEach(s => part(new THREE.BoxGeometry(0.14, 0.04, 0.14), goldMat, s * 0.27, 1.63, 0, g));
  part(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10), whiteMat, 0, 1.66, 0, g);
  part(new THREE.SphereGeometry(0.13, 16, 12), skinMat, 0, 1.8, 0, g);
  const hat = part(new THREE.CylinderGeometry(0.26, 0.26, 0.15, 3, 1), hatMat, 0, 1.96, 0, g); hat.scale.set(1.3, 1, 0.55); hat.rotation.y = Math.PI/2;
  part(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), redMat, 0.0, 1.97, 0.13, g).rotation.x = Math.PI/2;
  const hal = new THREE.Group(); hal.position.set(0, -0.6, 0.07); u.armR.add(hal);
  part(new THREE.CylinderGeometry(0.022, 0.022, 2.4, 6), shaftMat, 0, 0.5, 0, hal);
  part(new THREE.BoxGeometry(0.03, 0.3, 0.2), steelMat, 0, 1.6, 0.08, hal);
  part(new THREE.ConeGeometry(0.04, 0.32, 6), steelMat, 0, 1.85, 0, hal);
  g.userData = u; return g;
}
function makeHorse(coat, mane){
  const g = new THREE.Group(), u = {legs:[]};
  const cm = new THREE.MeshStandardMaterial({color:coat, roughness:0.6}), mm = new THREE.MeshStandardMaterial({color:mane, roughness:0.8});
  const body = part(new THREE.CapsuleGeometry(0.42, 1.15, 6, 14), cm, 0, 1.45, 0, g); body.rotation.x = Math.PI/2;
  part(new THREE.SphereGeometry(0.46, 14, 10), cm, 0, 1.5, -0.62, g);
  [[-0.22, 0.6], [0.22, 0.6], [-0.22, -0.62], [0.22, -0.62]].forEach(([x, z]) => {
    const leg = new THREE.Group(); leg.position.set(x, 1.25, z); g.add(leg);
    const lg = new THREE.CylinderGeometry(0.085, 0.06, 1.1, 8); lg.translate(0, -0.55, 0);
    part(lg, cm, 0, 0, 0, leg); part(new THREE.CylinderGeometry(0.08, 0.095, 0.12, 8), bootMat, 0, -1.13, 0, leg);
    u.legs.push(leg);
  });
  const neck = new THREE.Group(); neck.position.set(0, 1.62, 0.78); neck.rotation.x = 0.55; g.add(neck);
  const ng = new THREE.CylinderGeometry(0.17, 0.27, 0.95, 10); ng.translate(0, 0.47, 0); part(ng, cm, 0, 0, 0, neck);
  part(new THREE.BoxGeometry(0.07, 0.85, 0.12), mm, 0, 0.5, -0.17, neck);
  const head = new THREE.Group(); head.position.set(0, 0.9, 0); head.rotation.x = 0.95; neck.add(head);
  const hg = new THREE.BoxGeometry(0.24, 0.62, 0.3); hg.translate(0, 0.28, 0.02); part(hg, cm, 0, 0, 0, head);
  [-1, 1].forEach(s => { const e = part(new THREE.ConeGeometry(0.05, 0.16, 6), cm, s * 0.08, -0.02, -0.14, head); e.rotation.x = -1.2; });
  const tail = new THREE.Group(); tail.position.set(0, 1.62, -1.02); tail.rotation.x = 0.35; g.add(tail);
  const tg = new THREE.CylinderGeometry(0.04, 0.13, 0.85, 8); tg.translate(0, -0.42, 0); part(tg, mm, 0, 0, 0, tail);
  u.neck = neck; u.tail = tail; g.userData = u; return g;
}
const guards = [], horses = [];
function addGuard(x, z, ry, path, opts){
  const g = makeGuard(); g.position.set(x, opts && opts.y || 0, z); g.rotation.y = ry; scene.add(g);
  guards.push(Object.assign({obj:g, path, i:1, dir:1, speed:1.25, phase:rnd()*6, home:ry, loop:false}, opts || {})); return g;
}
// static sentries
addGuard(-2.6, -30.2, 0, null, {y:1.0}); addGuard(2.6, -30.2, 0, null, {y:1.0});
addGuard(-7, -21.4, 0, null); addGuard(7, -21.4, 0, null);
addGuard(-3.6, TEMPLE.z - 9.3, Math.PI, null); addGuard(3.6, TEMPLE.z - 9.3, Math.PI, null);
// foot patrols
addGuard(-2.6, -20, 0, [[-2.6,-20],[-2.6,-1],[-8.8,4.2],[-10.6,10],[-8.8,15.8],[-2.6,21],[-2.6,48]]);
addGuard(2.6, 48, Math.PI, [[2.6,48],[2.6,21],[8.8,15.8],[10.6,10],[8.8,4.2],[2.6,-1],[2.6,-20]]);
addGuard(-31, 10, Math.PI/2, [[-31,10],[-11,10]]);
addGuard(31, 10, -Math.PI/2, [[31,10],[11,10]]);
// mounted patrols
const LOOP = [[33.5,-21],[33.5,49],[-33.5,49],[-33.5,-21]];
[[0, 0x5a3b26, 0x1a1210], [2, 0xe8e4dc, 0x9a958c]].forEach(([start, coat, mane]) => {
  const h = makeHorse(coat, mane), rider = makeGuard();
  rider.position.set(0, 0.92, -0.08); rider.userData.legL.rotation.set(-0.5, 0, -0.55); rider.userData.legR.rotation.set(-0.5, 0, 0.55);
  rider.userData.armL.rotation.x = -0.6; rider.userData.armR.rotation.x = -0.3;
  part(new THREE.BoxGeometry(0.62, 0.1, 0.7), redMat, 0, 1.88, -0.05, h);
  h.add(rider);
  const [x, z] = LOOP[start]; h.position.set(x, 0, z); scene.add(h);
  horses.push({obj:h, path:LOOP, i:(start + 1) % 4, dir:1, loop:true, speed:2.3, phase:rnd()*6, mounted:true, rider});
});
// grazing horses in the paddock
[[0x6b4428, 0x1c140e], [0x2a2420, 0x0e0c0a], [0xb07a4a, 0xf0e2c8], [0xdcd6cc, 0x8a8478]].forEach(([coat, mane], k) => {
  const h = makeHorse(coat, mane); h.position.set(-54 + k * 3, 0, -6 + k * 7); h.rotation.y = rnd()*6; scene.add(h);
  horses.push({obj:h, wander:true, target:null, wait:rnd()*4, speed:0.7, phase:rnd()*6});
});

/* ================= lights ================= */
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x5a6a3a, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-95, right:95, top:95, bottom:-95, near:1, far:500});
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
sun.target.position.set(0, 0, 10); scene.add(sun, sun.target);

/* stars, moon, clouds, rain */
const starGeo = new THREE.BufferGeometry(); const spos = [];
for (let i = 0; i < 1800; i++){ const a = rnd()*6.283, y = 0.06 + rnd()*0.94, r = Math.sqrt(1-y*y); spos.push(Math.cos(a)*r*1200, y*1200, Math.sin(a)*r*1200); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(spos, 3));
const starMat = new THREE.PointsMaterial({size:1.5, sizeAttenuation:false, color:0xdfe6ff, transparent:true, opacity:0, fog:false, depthWrite:false});
scene.add(new THREE.Points(starGeo, starMat));
const MOON_DIR = new THREE.Vector3(-0.5, 0.55, 0.65).normalize();
const moonMat = new THREE.SpriteMaterial({map:dotTex, color:0xeef2ff, fog:false, transparent:true, opacity:0, depthWrite:false});
const moon = new THREE.Sprite(moonMat); moon.position.copy(MOON_DIR).multiplyScalar(1100); moon.scale.setScalar(60); scene.add(moon);

const [cc, cg] = canvas(512, 512);
for (let i = 0; i < 260; i++){
  const x = rnd()*512, y = rnd()*512, r = 20 + rnd()*70;
  for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]){
    const gr = cg.createRadialGradient(x+ox, y+oy, 0, x+ox, y+oy, r); gr.addColorStop(0, `rgba(255,255,255,${0.18 + rnd()*0.12})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    cg.fillStyle = gr; cg.fillRect(x+ox-r, y+oy-r, r*2, r*2);
  }
}
const cloudTex = tex(cc, 3, 3, false);
const cloudMat = new THREE.MeshBasicMaterial({map:cloudTex, alphaMap:cloudTex, transparent:true, opacity:0.2, fog:false, depthWrite:false, side:THREE.DoubleSide});
const clouds = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), cloudMat); clouds.rotation.x = Math.PI/2; clouds.position.y = 320; scene.add(clouds);

const RAIN = 3000; const rGeo = new THREE.BufferGeometry();
const rPos = new Float32Array(RAIN*6), rOff = new Float32Array(RAIN*3);
for (let i = 0; i < RAIN; i++){ rOff[i*3] = (rnd()-0.5)*70; rOff[i*3+1] = rnd()*36; rOff[i*3+2] = (rnd()-0.5)*70; }
rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
const rainMat = new THREE.LineBasicMaterial({color:0xaabbcc, transparent:true, opacity:0.35, depthWrite:false});
const rain = new THREE.LineSegments(rGeo, rainMat); rain.frustumCulled = false; scene.add(rain);

/* ================= weather ================= */
const WEATHER = {
  gunesli:  {name:'Güneşli', time:'13:10', temp:23, elev:52, azim:200, turb:3.2, rayl:1.0, mie:0.004, mieG:0.8, sunI:3.0, sunC:0xfff1dc, hemiI:0.6, hemiS:0xbfd8ff, hemiG:0x5d6b3c, clouds:0.18, cloudC:0xffffff, rain:0, fogN:160, fogF:1100, fogC:0xc4d6ea, exp:0.55, night:0, bloom:0.18, wet:0},
  bulutlu:  {name:'Bulutlu', time:'11:40', temp:17, elev:40, azim:170, turb:12, rayl:2.4, mie:0.008, mieG:0.75, sunI:1.1, sunC:0xe8ecf0, hemiI:0.95, hemiS:0xc9d1dc, hemiG:0x4d5741, clouds:0.9, cloudC:0xdde1e6, rain:0, fogN:90, fogF:650, fogC:0xb2bbc5, exp:0.62, night:0, bloom:0.12, wet:0},
  yagmurlu: {name:'Yağmurlu', time:'16:20', temp:13, elev:28, azim:230, turb:20, rayl:3.2, mie:0.012, mieG:0.7, sunI:0.35, sunC:0xc8d0dc, hemiI:0.85, hemiS:0x8e99a8, hemiG:0x384030, clouds:1, cloudC:0x6d7581, rain:1, fogN:25, fogF:300, fogC:0x7e8896, exp:0.72, night:0.25, bloom:0.22, wet:1},
  gunbatimi:{name:'Gün batımı', time:'20:45', temp:19, elev:2.2, azim:262, turb:8, rayl:3.2, mie:0.008, mieG:0.96, sunI:2.2, sunC:0xff9748, hemiI:0.45, hemiS:0xffb48c, hemiG:0x3a3040, clouds:0.38, cloudC:0xffa274, rain:0, fogN:110, fogF:800, fogC:0xd89c7c, exp:0.6, night:0.55, bloom:0.45, wet:0},
  gece:     {name:'Gece', time:'23:30', temp:12, elev:-9, azim:262, turb:2, rayl:0.4, mie:0.003, mieG:0.8, sunI:0.45, sunC:0x9fb4ff, hemiI:0.3, hemiS:0x34466e, hemiG:0x0f131c, clouds:0.22, cloudC:0x2b3448, rain:0, fogN:80, fogF:520, fogC:0x0e1526, exp:0.8, night:1, bloom:0.95, wet:0},
};
const W = Object.assign({}, WEATHER.gunesli); let wFrom = null, wTo = WEATHER.gunesli, wT = 1, wKey = 'gunesli';
const NUM_KEYS = ['elev','azim','turb','rayl','mie','mieG','sunI','hemiI','clouds','rain','fogN','fogF','exp','night','bloom','wet','temp'];
const COL_KEYS = ['sunC','hemiS','hemiG','cloudC','fogC'];
const cA = new THREE.Color(), cB = new THREE.Color();
function setWeather(k){ wFrom = Object.assign({}, W); wTo = WEATHER[k]; wT = 0; wKey = k; if (hdriEnv) scene.environment = hdriEnv[k]; }
const sunVec = new THREE.Vector3();
let envTimer = 0;
function updateWeather(dt){
  if (wT < 1){
    wT = Math.min(1, wT + dt / 2.4); const e = wT * wT * (3 - 2 * wT);
    NUM_KEYS.forEach(k => { W[k] = lerp(wFrom[k], wTo[k], e); });
    COL_KEYS.forEach(k => { W[k] = cA.set(wFrom[k]).lerp(cB.set(wTo[k]), e).getHex(); });
    envTimer -= dt; if (envTimer <= 0 || wT >= 1){ applyWeather(true); envTimer = 0.3; } else applyWeather(false);
  }
}
function applyWeather(env){
  const u = sky.material.uniforms;
  u.turbidity.value = W.turb; u.rayleigh.value = W.rayl; u.mieCoefficient.value = W.mie; u.mieDirectionalG.value = W.mieG;
  sunVec.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - W.elev), THREE.MathUtils.degToRad(W.azim));
  u.sunPosition.value.copy(sunVec);
  const lightDir = W.elev > 0 ? sunVec : MOON_DIR;
  sun.position.copy(sun.target.position).addScaledVector(lightDir, 250);
  sun.intensity = W.sunI; sun.color.setHex(W.sunC);
  hemi.intensity = W.hemiI; hemi.color.setHex(W.hemiS); hemi.groundColor.setHex(W.hemiG);
  cloudMat.opacity = W.clouds * 0.95; cloudMat.color.setHex(W.cloudC);
  scene.fog.color.setHex(W.fogC); scene.fog.near = W.fogN; scene.fog.far = W.fogF;
  renderer.toneMappingExposure = W.exp;
  starMat.opacity = clamp(W.night * 1.2 - W.clouds * 0.6, 0, 1); moonMat.opacity = clamp(W.night * 1.1 - 0.1, 0, 1);
  facadeMats.forEach(m => { m.emissiveIntensity = W.night * 1.25; });
  const lk = clamp(W.night * 1.8, 0, 1.8); lampHeadMat.color.setRGB(0.13 + lk * 1.1, 0.13 + lk * 0.78, 0.13 + lk * 0.4);
  groundMat.roughness = lawnMat.roughness = 1 - W.wet * 0.55; gravelMat.roughness = 0.92 - W.wet * 0.6; stoneMat.roughness = 0.85 - W.wet * 0.45;
  bloom.strength = W.bloom;
  if (env) refreshEnv();
}

/* ================= post ================= */
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(1, 1), 0.2, 0.5, 0.92);
composer.addPass(bloom);
composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w < 720 ? 55 : 42; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();
scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
  ms.forEach(m => { if (m.isMeshStandardMaterial) m.envMapIntensity = m.metalness > 0.5 ? 0.9 : 0.3; }); });
bladeMat.envMapIntensity = 1.3; grassMat.envMapIntensity = 0.12;
applyWeather(true);

function offer(filename, data){
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
/* ================= kılıç durumu ================= */
let power = 0, powerOn = false;
buildSword(); applyMaterial(); applyGem();
const state = {wind:0.35};

/* ================= simulation ================= */
function walkAnim(u, phase, amt){
  if (u.legL){ u.legL.rotation.x = Math.sin(phase) * 0.5 * amt; u.legR.rotation.x = -Math.sin(phase) * 0.5 * amt; }
}
function turnToward(obj, target, k){ let d = target - obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); obj.rotation.y += d * k; }
function followPath(a, dt){
  const [tx, tz] = a.path[a.i], o = a.obj;
  const dx = tx - o.position.x, dz = tz - o.position.z, d = Math.hypot(dx, dz);
  if (d < 0.25){
    if (a.loop) a.i = (a.i + 1) % a.path.length;
    else { if (a.i + a.dir >= a.path.length || a.i + a.dir < 0) a.dir *= -1; a.i += a.dir; }
    return 0;
  }
  const step = Math.min(d, a.speed * dt);
  o.position.x += dx / d * step; o.position.z += dz / d * step;
  turnToward(o, Math.atan2(dx, dz), Math.min(1, dt * 6));
  return 1;
}
function updateGuards(dt){
  const salute = power > 0.4;
  guards.forEach(a => {
    const u = a.obj.userData;
    let moving = 0;
    if (salute){
      turnToward(a.obj, Math.atan2(TEMPLE.x - a.obj.position.x, TEMPLE.z - a.obj.position.z), Math.min(1, dt * 3));
      u.armR.rotation.x = lerp(u.armR.rotation.x, -2.5, dt * 4);
    } else {
      u.armR.rotation.x = lerp(u.armR.rotation.x, a.path ? 0 : -0.15, dt * 4);
      if (a.path) moving = followPath(a, dt); else turnToward(a.obj, a.home, Math.min(1, dt * 2));
    }
    a.phase += dt * a.speed * 5.2 * moving;
    walkAnim(u, a.phase, moving);
    u.armL.rotation.x = -Math.sin(a.phase) * 0.4 * moving;
    a.obj.position.y = (a.y || 0) + Math.abs(Math.sin(a.phase)) * 0.03 * moving;
  });
}
function updateHorses(dt, t){
  horses.forEach(h => {
    const u = h.obj.userData; let moving = 0;
    if (h.mounted){
      const halt = power > 0.4;
      if (!halt) moving = followPath(h, dt);
      const ru = h.rider.userData; ru.armR.rotation.x = lerp(ru.armR.rotation.x, halt ? -2.5 : -0.3, dt * 4);
      u.neck.rotation.x = lerp(u.neck.rotation.x, halt ? 0.3 : 0.55, dt * 3);
    } else {
      if (h.wait > 0){ h.wait -= dt; u.neck.rotation.x = lerp(u.neck.rotation.x, 2.0, dt * 1.5); }
      else {
        if (!h.target) h.target = h.area ? [h.area[0] + rnd()*(h.area[2]-h.area[0]), h.area[1] + rnd()*(h.area[3]-h.area[1])] : [-56 + rnd()*10, -10 + rnd()*30];
        u.neck.rotation.x = lerp(u.neck.rotation.x, 0.55, dt * 2);
        const fake = {path:[h.target], i:0, obj:h.obj, speed:h.speed, loop:true};
        moving = followPath(fake, dt);
        if (!moving){ h.target = null; h.wait = 3 + rnd()*7; }
      }
    }
    h.phase += dt * h.speed * 3.4 * moving;
    const s = Math.sin(h.phase) * 0.42 * moving;
    u.legs[0].rotation.x = s; u.legs[3].rotation.x = s; u.legs[1].rotation.x = -s; u.legs[2].rotation.x = -s;
    u.tail.rotation.x = 0.35 + Math.sin(t * 2 + h.phase) * 0.08;
    u.tail.rotation.z = Math.sin(t * 1.3 + h.phase) * 0.15;
  });
}

/* ================= güncelleme (her kare) ================= */
let swordSpin = 0;
function update(dt, t){
  timeU.value = t;
  const windTarget = state.wind * (1 + W.rain * 0.8);
  windU.value = lerp(windU.value, reduceMotion ? 0 : windTarget, dt * 2);
  updateWeather(dt);
  cloudTex.offset.x += dt * 0.004 * (0.3 + windU.value);

  for (let i = 0; i < DROPS; i++){
    dVel[i*3+1] -= 9.8 * dt;
    dPos[i*3] += dVel[i*3] * dt + windU.value * 0.4 * dt; dPos[i*3+1] += dVel[i*3+1] * dt; dPos[i*3+2] += dVel[i*3+2] * dt;
    if (dPos[i*3+1] < 0.6) resetDrop(i);
  }
  dGeo.attributes.position.needsUpdate = true;

  power = lerp(power, powerOn ? 1 : 0, dt * 1.4);
  swordSpin += dt * (0.3 + power * 2.2);
  swordPivot.rotation.y = swordSpin;
  swordPivot.position.y = 6.1 + power * 0.55 + (reduceMotion ? 0 : Math.sin(t * 1.3) * 0.05);
  const pulse = 0.85 + Math.sin(t * 2.4) * 0.15;
  gemMat.emissiveIntensity = (1.6 + power * 6 + W.night * 1.5) * pulse;
  runeMat.opacity = (0.35 + power * 0.65) * pulse;
  gemGlowMat.opacity = power * (0.35 + 0.08 * Math.sin(t * 5));
  skyBeam.visible = power > 0.02;
  ringGlow.material.opacity = 0.3 + power * 0.7; ringGlow.scale.setScalar(1 + power * 0.6 + Math.sin(t * 3) * 0.05 * power);
  templeLight.intensity = 0.3 + W.night * 1.2 + power * 3.5;
  swirlMat.opacity = power;
  if (power > 0.01){
    for (let i = 0; i < SWIRL; i++){
      const a = swSeed[i*3] + t * (1.2 + swSeed[i*3+2]), h = ((swSeed[i*3+1] + t * 0.25 * swSeed[i*3+2]) % 1), r = (0.4 + (1 - h) * 1.6) * (0.5 + power * 0.5);
      swPos[i*3] = TEMPLE.x + Math.cos(a) * r; swPos[i*3+1] = 2.4 + h * 6.5; swPos[i*3+2] = TEMPLE.z + Math.sin(a) * r;
    }
    swGeo.attributes.position.needsUpdate = true;
  }

  updateGuards(dt);
  updateHorses(dt, t);
  updateExtras(dt, t);

  const nRain = Math.floor(RAIN * W.rain);
  rGeo.setDrawRange(0, nRain * 2); rain.visible = nRain > 0;
  if (nRain){
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, slant = 0.15 + windU.value * 0.6, fall = 26 * dt;
    for (let i = 0; i < nRain; i++){
      rOff[i*3+1] -= fall; rOff[i*3] += slant * fall * 0.4;
      if (rOff[i*3+1] < -12){ rOff[i*3+1] += 36; rOff[i*3] = (rnd()-0.5)*70; }
      const x = cx + rOff[i*3], y = cy + rOff[i*3+1], z = cz + rOff[i*3+2];
      rPos[i*6] = x; rPos[i*6+1] = y; rPos[i*6+2] = z; rPos[i*6+3] = x + slant*0.5; rPos[i*6+4] = y + 1.0; rPos[i*6+5] = z;
    }
    rGeo.attributes.position.needsUpdate = true;
  }
  rainMat.opacity = 0.18 + W.rain * 0.22;
}

/* ================= yüklenen kaynaklar (HDRI, doku, model) ================= */
const loaderEl = document.getElementById('loader');
const manager = new THREE.LoadingManager();
manager.onProgress = (_url, done, total) => { if (loaderEl) loaderEl.textContent = 'Kaynaklar yükleniyor… ' + done + '/' + total; };
manager.onLoad = () => { if (loaderEl) loaderEl.hidden = true; };
manager.onError = url => { console.warn('Yüklenemedi:', url); };
const texLoader = new THREE.TextureLoader(manager);
const gltfLoader = new GLTFLoader(manager);
const rgbeLoader = new RGBELoader(manager);
const A = 'assets/';
const maxAniso = renderer.capabilities.getMaxAnisotropy();
function loadTex(path, rx, ry, srgb, cb){
  return texLoader.load(A + path, t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = Math.min(8, maxAniso);
    if (srgb) t.encoding = THREE.sRGBEncoding; if (cb) cb(t);
  });
}

// 1) HDRI ortam ışığı — her hava durumu kendi gökyüzünü yansıtır
const HDRI = {gunesli:'gunesli.hdr', bulutlu:'bulutlu.hdr', yagmurlu:'yagmurlu.hdr', gunbatimi:'gunbatimi.hdr', gece:'gece.hdr'};
const hdriTmp = {};
Object.entries(HDRI).forEach(([k, f]) => rgbeLoader.load(A + 'hdri/' + f, t => {
  t.mapping = THREE.EquirectangularReflectionMapping;
  hdriTmp[k] = pmrem.fromEquirectangular(t).texture; t.dispose();
  if (Object.keys(hdriTmp).length === Object.keys(HDRI).length){ hdriEnv = hdriTmp; scene.environment = hdriEnv[wKey]; }
}));

// 2) Gerçek çim dokusu (normal haritalı)
loadTex('textures/cim.jpg', 260, 260, true, t => { groundMat.map = t; groundMat.color.set(0xb8c6a8); groundMat.needsUpdate = true; });
loadTex('textures/cim_normal.jpg', 260, 260, false, t => { groundMat.normalMap = t; groundMat.normalScale.set(0.6, 0.6); groundMat.needsUpdate = true; });
loadTex('textures/cim.jpg', 3, 3, true, t => { lawnMat.map = t; lawnMat.color.set(0xa9c290); lawnMat.needsUpdate = true; });
loadTex('textures/cim_normal.jpg', 3, 3, false, t => { lawnMat.normalMap = t; lawnMat.needsUpdate = true; });

// 3) Fıskiye suyu: kayan dalga normali
let waterNormal = null;
loadTex('textures/su_normal.jpg', 2, 2, false, t => {
  waterNormal = t; fountainWater.normalMap = t; fountainWater.normalScale.set(0.35, 0.35);
  fountainWater.metalness = 0.2; fountainWater.roughness = 0.03; fountainWater.color.set(0x23495a); fountainWater.needsUpdate = true;
});

// 4) Tapınak zemini: damalı mermer
{
  const floorMat = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.18, metalness:0.0});
  loadTex('textures/mermer_dama.jpg', 4, 4, true, t => { floorMat.map = t; floorMat.needsUpdate = true; });
  loadTex('textures/mermer_dama_normal.jpg', 4, 4, false, t => { floorMat.normalMap = t; floorMat.normalScale.set(0.4, 0.4); floorMat.needsUpdate = true; });
  const f = new THREE.Mesh(new THREE.CircleGeometry(6.78, 64), floorMat); f.rotation.x = -Math.PI/2; f.position.set(0, 1.205, 0); f.receiveShadow = true; temple.add(f);
}

// 5) Ahır kapıları: ahşap
loadTex('textures/ahsap.jpg', 1, 1, true, t => { doorMat.map = t; doorMat.color.set(0x8a6a50); doorMat.needsUpdate = true; });

// 6) Güneş parlaması (lens flare)
const flareLight = new THREE.PointLight(0xffffff, 0, 1); scene.add(flareLight);
{
  const f0 = texLoader.load(A + 'textures/flare0.png'), fh = texLoader.load(A + 'textures/flare_hex.png');
  const lf = new Lensflare();
  lf.addElement(new LensflareElement(f0, 380, 0, new THREE.Color(1, 0.94, 0.82)));
  [[60, 0.6], [70, 0.7], [120, 0.9], [70, 1.0]].forEach(([sz, d]) => lf.addElement(new LensflareElement(fh, sz, d, new THREE.Color(1, 0.9, 0.7))));
  flareLight.add(lf); flareLight.userData.lf = lf;
}

// 7) Animasyonlu atlar (GLB, morph animasyonu)
const mixers = [];
const horseLook = [];
let resolveHorse; const horseModel = new Promise(r => { resolveHorse = r; });
gltfLoader.load(A + 'models/at.glb', gltf => {
  const src = gltf.scene.children[0], clip = gltf.animations[0];
  resolveHorse({src, clip});
  const SC = 0.0125;
  horses.forEach(h => {
    const keep = h.rider || null;
    h.obj.children.slice().forEach(c => { if (c !== keep) c.visible = false; });
    const m = src.clone(); m.scale.setScalar(SC); m.castShadow = true; m.receiveShadow = true;
    m.material = src.material.clone(); m.material.vertexColors = true;
    if (!h.mounted) m.material.color.set(h.wander ? [0xcaa27a, 0x6b5240, 0xffffff, 0x8a8a8a][horseLook.length % 4] : 0xffffff);
    h.obj.add(m);
    const mixer = new THREE.AnimationMixer(m); const act = mixer.clipAction(clip); act.play(); act.time = Math.random() * clip.duration;
    mixers.push(mixer); h.anim = act; horseLook.push(m);
    if (keep){ keep.position.set(0, 1.18, -0.25); }
    if (h.mounted) h.speed = 6.0;
  });
});

// 8) Kuşlar: flamingo, papağan, leylek sürüleri
const birds = [];
function addFlock(file, count, cx, cz, radius, height, speed, scale){
  gltfLoader.load(A + 'models/' + file, gltf => {
    const src = gltf.scene.children[0], clip = gltf.animations[0];
    for (let i = 0; i < count; i++){
      const m = src.clone(); m.scale.setScalar(scale); m.castShadow = true;
      const pivot = new THREE.Group(); pivot.add(m); scene.add(pivot);
      const mixer = new THREE.AnimationMixer(m); const act = mixer.clipAction(clip); act.play(); act.time = Math.random() * clip.duration;
      mixers.push(mixer);
      birds.push({pivot, cx, cz, r:radius * (0.85 + Math.random() * 0.3), h:height + (Math.random() - 0.5) * 4, w:speed / radius * (0.9 + Math.random() * 0.2), a:i / count * Math.PI * 2 + Math.random() * 0.4});
    }
  });
}
addFlock('flamingo.glb', 3, 0, 10, 46, 26, 9, 0.022);
addFlock('papagan.glb', 4, 0, 60, 16, 14, 7, 0.02);
addFlock('leylek.glb', 2, -20, -10, 80, 40, 11, 0.02);

// 9) Tapınak çevresine çiçek halkası (Kenney çiçek modeli, CC0)
gltfLoader.load(A + 'models/cicek.glb', gltf => {
  gltf.scene.updateMatrixWorld(true);
  const parts = []; gltf.scene.traverse(o => { if (o.isMesh) parts.push(o); });
  const box = new THREE.Box3().setFromObject(gltf.scene), size = box.getSize(new THREE.Vector3());
  const k = 0.75 / size.y, N = 900;
  const PAL = ['#ff3b5c','#ffd23f','#ff8c42','#ffffff','#c77dff','#ff70a6','#4cc9f0'];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), base = new THREE.Matrix4();
  parts.forEach(part => {
    const geo = part.geometry.clone(); geo.applyMatrix4(part.matrixWorld); geo.translate(-(box.min.x + box.max.x)/2, -box.min.y, -(box.min.z + box.max.z)/2);
    const mat = part.material.clone();
    const im = new THREE.InstancedMesh(geo, mat, N); im.castShadow = false; im.receiveShadow = true;
    let r = 1234;
    const rr = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++){
      const a = rr() * Math.PI * 2, rad = 9.2 + rr() * 2.6, sc = k * (0.7 + rr() * 0.6);
      if (Math.sin(a) < 0 && Math.abs(Math.cos(a)) < 0.3) { m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); continue; } // şatoya bakan giriş yolu
      m4.compose(p.set(TEMPLE.x + Math.cos(a) * rad, 0.02, TEMPLE.z + Math.sin(a) * rad), q.setFromAxisAngle(new THREE.Vector3(0,1,0), rr() * 6.28), s.set(sc, sc, sc));
      im.setMatrixAt(i, m4);
      if (/blossom/i.test(part.name)) { c.set(PAL[Math.floor(rr() * PAL.length)]); im.setColorAt(i, c); }
    }
    garden.add(im);
  });
});

function updateExtras(dt, t){
  mixers.forEach(m => m.update(dt));
  horses.forEach(h => {
    if (!h.anim) return;
    const moving = h.mounted ? (power > 0.4 ? 0 : 1) : (h.wait > 0 ? 0 : 1);
    h.anim.timeScale = lerp(h.anim.timeScale, moving ? (h.mounted ? 1.0 : 0.45) : 0, Math.min(1, dt * 4));
  });
  const hideBirds = W.night > 0.6 || W.rain > 0.5;
  birds.forEach(b => {
    b.a += b.w * dt;
    b.pivot.visible = !hideBirds;
    b.pivot.position.set(b.cx + Math.cos(b.a) * b.r, b.h + Math.sin(t * 0.7 + b.a * 3) * 1.2, b.cz + Math.sin(b.a) * b.r);
    b.pivot.rotation.set(0, -b.a, -0.25);
  });
  if (waterNormal){ waterNormal.offset.x += dt * 0.03; waterNormal.offset.y += dt * 0.02; }
  // güneş parlaması sadece güneş görünürken
  const sunUp = W.elev > 0 && W.clouds < 0.6;
  flareLight.visible = sunUp;
  if (sunUp){ flareLight.position.copy(camera.position).addScaledVector(sunVec, 1500); }
}


return {
  THREE, renderer, scene, camera, composer, bloom, sky, pmrem, TEMPLE, CZ, PARTERRES, colliders, state,
  chateau, garden, temple, guards, horses, mixers, gltfLoader, texLoader, manager, horseModel,
  materials:{stoneMat, slateMat, marbleMat, goldMat, darkMetal, hedgeMat, gravelMat, coatMat, whiteMat, bootMat, skinMat, hatMat, redMat, shaftMat, steelMat, doorMat, lawnMat},
  makeGuard, makeHorse, part, addGuard, turnToward, followPath,
  WEATHER, W, setWeather, get weatherKey(){ return wKey; }, sunVec,
  MATERIALS, GEMS, swordCfg, buildSword, applyMaterial, applyGem, swordPivot,
  get power(){ return power; }, setPowerOn(v){ powerOn = v; },
  update, resize, offer, timeU, windU, windMat, EXCLUDE, sun, hemi, rain, flareLight, applyWeather, MOON_DIR,
};
}
