// Lumière'in kuzeyi, şatonun arkası: Paris mahallesi ve Colmar.
//  Paris: şatodan gelen cadde, Haussmann bulvarı (krem taş cepheler, dökme demir balkonlar, çinko mansart çatılar),
//         kruvasancı (boulangerie), kafe terası, Wallace çeşmeleri, Morris ilan sütunu, metro girişi,
//         Champ de Mars çimeni ve sonunda Eiffel Kulesi (1/3,6 ölçek, ikinci kata asansör, gece pırıltısı).
//  Colmar: "Küçük Venedik" kanalı boyunca renkli yarı ahşap (colombage) evler, çiçekli köprüler,
//          sarp kiremit çatılar, St-Martin kilisesi, Schwendi çeşmesi, bacada leylek yuvası ve bir winstub.
import { makeKit } from './kit.js';
import { PLACES } from './court.js';
import { LUMIERE_COAST } from './sea.js';

export const PARIS = {
  ave:{x0:-7, x1:7, z0:-252, z1:-216},               // şatonun arkasından bulvara cadde
  blvd:{z:-262, w:20, x0:-58, x1:174},                // Haussmann bulvarı
  champ:{x0:18, x1:62, z0:-300, z1:-272},             // Champ de Mars
  eiffel:{x:40, z:-320},
  bakery:{x0:10, x1:26},                              // bulvarın güney sırasında, caddenin hemen doğusu
  cafe:{x0:64, x1:82},
};
export const COLMAR = {x0:-182, x1:-58, canalZ:-282, canalW:7, church:{x:-122, z:-244}, fountain:{x:-84, z:-246}};
// Ağaç dikilmeyecek alanlar [x0, z0, x1, z1] (world.js EXCLUDE)
export const PARIS_ZONES = [[-60, -345, 178, -216], [-186, -306, -54, -220]];

PLACES.push(
  {id:'bulvar', name:'Haussmann Bulvarı', x:90, z:PARIS.blvd.z, r:16},
  {id:'boulangerie', name:'Kruvasancı: Boulangerie Lumière', x:18, z:-250, r:8},
  {id:'eiffel', name:'Eiffel Kulesi', x:PARIS.eiffel.x, z:PARIS.eiffel.z + 22, r:16},
  {id:'colmar', name:'Colmar: Küçük Venedik', x:-120, z:COLMAR.canalZ, r:16},
);

export function buildParis(world, C, hooks){
  const { THREE, scene, materials:Mw } = world;
  const root = new THREE.Group(); root.name = 'ParisColmar'; scene.add(root);
  const doors = {}, interact = [], updaters = [], markers = [];
  const say = (name, text, choices) => hooks.ui.dialog([{name, text, choices}]);
  const K = makeKit(world, C, root, {seed:1889, interact, updaters, say});
  const { rnd, add, canvas, ctex, mat, gold, stone, darkWood, wood, frustum, npc, lady, placeNPC, toWorld } = K;
  const S = () => hooks.getS();
  const notes = () => S().notes;
  let heroRef = null;
  const tex = (w, h, fn) => { const [c, g] = canvas(w, h); fn(g, w, h); return ctex(c); };
  function box(w, h, d, s = 2){
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / s, uv.getY(i) * dims[f][1] / s); }
    return g;
  }
  // cephe kutusu: dokunun bir karesi bir pencere bölmesi (bw × bh metre)
  function facadeBox(w, h, d, bw, bh){
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++){ const i = f * 4 + k; uv.setXY(i, uv.getX(i) * Math.max(1, Math.round(dims[f][0] / bw)), uv.getY(i) * Math.max(1, Math.round(dims[f][1] / bh))); }
    return g;
  }
  function floor(w, d, m, x, y, z, rot = 0, tile = 4){
    const g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
    const f = add(g, m, x, y, z, root, false); f.rotation.set(-Math.PI / 2, 0, rot); return f;
  }
  function plaqueMesh(text, w, h, {bg = '#1d2a4a', fg = '#e8c15a', font = 'Georgia, serif', italic = false} = {}){
    // geniş tabelalarda da harfler okunaklı kalsın: tuval en az 64 px yüksek, en fazla 1024 px geniş
    const cw2 = Math.min(1024, Math.max(256, Math.round(64 * w / h))), [c, g] = canvas(cw2, Math.max(64, Math.round(cw2 * h / w)));
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, c.width - 20, c.height - 20);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = c.height * 0.6; do { g.font = (italic ? 'italic ' : '') + 'bold ' + fs + 'px ' + font; fs -= 2; } while (g.measureText(text).width > c.width - 50);
    g.fillText(text, c.width / 2, c.height / 2 + 2);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:ctex(c), roughness:0.5}));
  }
  function putPlaque(text, x, y, z, ry, w, h, o, parent = root){ const m = plaqueMesh(text, w, h, o); m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; }

  /* ================= malzemeler ================= */
  // Haussmann cephesi: bir doku karesi = bir pencere bölmesi; pencereler ayrıca bir emissive maskede (gece yanar)
  const bayTex = (lit) => tex(128, 128, (g) => {
    g.fillStyle = lit ? '#000' : '#e6dcc4'; g.fillRect(0, 0, 128, 128);
    if (!lit){
      for (let y = 0; y < 128; y += 16){ g.fillStyle = 'rgba(150,135,110,.35)'; g.fillRect(0, y, 128, 1); }
      g.fillStyle = '#d8cbb0'; g.fillRect(0, 0, 128, 10);                         // kat silmesi
      g.fillStyle = '#c9bb9c'; g.fillRect(30, 18, 68, 8);                         // pencere alınlığı
      g.fillStyle = '#f2ece0'; g.fillRect(36, 26, 56, 86);                        // pencere çerçevesi
      g.fillStyle = '#2a3440'; g.fillRect(40, 30, 22, 78); g.fillRect(66, 30, 22, 78);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(42, 32, 6, 70); g.fillRect(68, 32, 6, 70);
      g.fillStyle = '#f2ece0'; g.fillRect(40, 66, 48, 3);
    } else { g.fillStyle = '#ffd59a'; g.fillRect(40, 30, 22, 78); g.fillRect(66, 30, 22, 78); }
  });
  const facadeMat = new THREE.MeshStandardMaterial({map:bayTex(false), emissive:0xffb060, emissiveMap:bayTex(true), emissiveIntensity:0, roughness:0.8});
  const zinc = mat(0x6f7a84, {roughness:0.45, metalness:0.55});
  const iron = mat(0x1c2220, {roughness:0.5, metalness:0.6});
  const terracotta = mat(0xb4593a, {roughness:0.8});
  const cobble = mat(0xffffff, {map:tex(256, 256, (g) => { g.fillStyle = '#6a6862'; g.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) for (let x = (y / 16 % 2) * 8; x < 272; x += 16){ const v = 120 + rnd() * 50; g.fillStyle = `rgb(${v | 0},${v * 0.98 | 0},${v * 0.93 | 0})`; g.beginPath(); g.ellipse(x, y + 8, 7, 6.5, 0, 0, Math.PI * 2); g.fill(); } }), roughness:0.92});
  const pavement = mat(0xffffff, {map:tex(128, 128, (g) => { g.fillStyle = '#b8b0a2'; g.fillRect(0, 0, 128, 128); g.strokeStyle = 'rgba(90,85,75,.5)'; g.lineWidth = 2; for (let i = 0; i <= 128; i += 64){ g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } }), roughness:0.85});
  const asphalt = mat(0x55524d, {roughness:0.9});
  const glassDark = mat(0x22303a, {roughness:0.08, metalness:0.5});
  const lampGlow = new THREE.MeshBasicMaterial({color:0x222222, toneMapped:false});
  const awningMats = [0x8a1a2a, 0x1f4a3a, 0x1d3a6e, 0x6a3a20].map(c => mat(c, {roughness:0.8, side:THREE.DoubleSide}));
  const shopMats = [0x1f3a2e, 0x1d2a4a, 0x5a1a1a, 0x2a2a2a].map(c => mat(c, {roughness:0.5}));

  /* ================= Haussmann binası ================= */
  // Zemin kat dükkân (4.4 m), dört kat taş cephe (3.4 m), 2. ve 5. katta boydan boya balkon, çinko mansart ve çatı pencereleri.
  // Yerel +z cephe.
  function haussmann({x, z, w, d = 14, rot = 0, shop = 0, awning = true}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const gh = 4.4, fh = 3.4, nf = 4, H = gh + fh * nf, bw = 3.4;
    add(box(w, gh, d), stone, 0, gh / 2, 0, G);
    add(facadeBox(w, fh * nf, d, bw, fh), facadeMat, 0, gh + fh * nf / 2, 0, G);
    add(box(w + 0.5, 0.35, d + 0.5), Mw.marbleMat, 0, gh, 0, G);
    // dükkân vitrini
    const n = Math.max(1, Math.round(w / bw));
    for (let i = 0; i < n; i++){
      const bx = -w / 2 + (i + 0.5) * w / n;
      add(box(w / n - 0.5, gh - 1.2, 0.12), shopMats[shop % shopMats.length], bx, (gh - 1.2) / 2 + 0.2, d / 2 + 0.06, G);
      add(new THREE.PlaneGeometry(w / n - 1.1, gh - 1.9), glassDark, bx, (gh - 1.9) / 2 + 0.5, d / 2 + 0.13, G, false);
    }
    if (awning){ const aw = add(new THREE.PlaneGeometry(w - 0.6, 1.8), awningMats[(shop + Math.floor(x)) % awningMats.length], 0, gh - 0.75, d / 2 + 0.75, G); aw.rotation.x = -1.05; }
    // balkonlar: 2. ve 5. kat, dökme demir korkuluk
    [gh + fh * 0, gh + fh * 3].forEach(y => {
      add(box(w + 0.1, 0.16, 0.8), Mw.marbleMat, 0, y + 0.08, d / 2 + 0.4, G);
      add(box(w + 0.1, 0.06, 0.06), iron, 0, y + 1.05, d / 2 + 0.78, G, false);
      for (let k = 0; k <= Math.floor(w / 0.22); k++) add(box(0.025, 0.9, 0.025), iron, -w / 2 + 0.05 + k * 0.22, y + 0.6, d / 2 + 0.78, G, false);
    });
    add(box(w + 0.6, 0.5, d + 0.6), Mw.marbleMat, 0, H + 0.25, 0, G);
    // mansart: alt dik eğim + çatı pencereleri, üstte bacalar
    const mh = 4.2;
    add(frustum(w + 0.2, d + 0.2, mh, 1.3), zinc, 0, H + 0.5 + mh / 2, 0, G);
    for (let i = 0; i < n; i++){
      const bx = -w / 2 + (i + 0.5) * w / n;
      [1, -1].forEach(sd => {
        const dz = sd * (d / 2 - 0.2);
        add(box(1.3, 1.8, 1.0), Mw.marbleMat, bx, H + 1.7, dz, G);
        add(new THREE.PlaneGeometry(0.8, 1.2), glassDark, bx, H + 1.65, dz + sd * 0.51, G, false).rotation.y = sd > 0 ? 0 : Math.PI;
        const cap = add(new THREE.ConeGeometry(0.95, 0.7, 4), zinc, bx, H + 2.95, dz, G); cap.rotation.y = Math.PI / 4; cap.scale.z = 0.8;
      });
    }
    for (let i = 0; i < Math.max(2, Math.round(w / 7)); i++){
      const cx = -w / 2 + 2 + i * (w - 4) / Math.max(1, Math.round(w / 7) - 1);
      add(box(1.2, 2.2, 0.7), terracotta, cx, H + 0.5 + mh + 0.6, 0, G);
      for (let k = 0; k < 3; k++) add(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8), terracotta, cx - 0.35 + k * 0.35, H + 0.5 + mh + 1.9, 0, G);
    }
    C.box(x, z, w / 2 + 0.1, d / 2 + 0.1, rot);
    return {G, front:toWorld(G, 0, d / 2 + 1.6)};
  }
  /** Bir sırayı farklı genişlikte binalarla doldurur. */
  function row(x0, x1, z, rot, skip = []){
    let x = x0, i = 0;
    while (x < x1 - 8){
      let w = 14 + Math.floor(rnd() * 3) * 4; if (x + w > x1) w = x1 - x;
      const s = skip.find(r => x < r.x1 && x + w > r.x0);
      if (s){ if (s.x0 > x + 8) w = s.x0 - x; else { x = s.x1; continue; } }
      haussmann({x:x + w / 2, z, w, rot, shop:i++});
      x += w;
    }
  }

  /* ================= Paris yolları ================= */
  const B = PARIS.blvd, bz0 = B.z - B.w / 2, bz1 = B.z + B.w / 2;
  floor(PARIS.ave.x1 - PARIS.ave.x0, PARIS.ave.z1 - PARIS.ave.z0, cobble, 0, 0.03, (PARIS.ave.z0 + PARIS.ave.z1) / 2, 0, 3);
  floor(B.x1 - B.x0, B.w - 8, asphalt, (B.x0 + B.x1) / 2, 0.03, B.z);
  [-1, 1].forEach(sd => {
    floor(B.x1 - B.x0, 4, pavement, (B.x0 + B.x1) / 2, 0.05, B.z + sd * (B.w / 2 - 2), 0, 2);
    add(box(B.x1 - B.x0, 0.12, 0.25), stone, (B.x0 + B.x1) / 2, 0.06, B.z + sd * (B.w / 2 - 4));
  });
  // bina sıraları: güney sıra kuzeye (bulvara), kuzey sıra güneye bakar
  const D = 14;
  row(B.x0, -PARIS.ave.x1 - 1, bz1 + D / 2, Math.PI);
  row(PARIS.ave.x1 + 1, B.x1, bz1 + D / 2, Math.PI, [PARIS.bakery]);
  row(B.x0, PARIS.champ.x0, bz0 - D / 2, 0);
  row(PARIS.champ.x1, B.x1, bz0 - D / 2, 0, [PARIS.cafe]);

  /* ---------- kruvasancı ---------- */
  {
    const bk = PARIS.bakery, w = bk.x1 - bk.x0, cx = (bk.x0 + bk.x1) / 2;
    const H = haussmann({x:cx, z:bz1 + D / 2, w, rot:Math.PI, shop:0, awning:false});
    const G = H.G;
    // mavi-yeşil boyalı ahşap vitrin ve altın harfli tabela
    add(box(w - 0.4, 1.0, 0.25), mat(0x1f4a5a, {roughness:0.4}), 0, 3.85, D / 2 + 0.2, G);
    putPlaque('BOULANGERIE · PÂTISSERIE', 0, 3.85, D / 2 + 0.34, 0, w - 1.2, 0.8, {bg:'#1f4a5a', fg:'#e8c15a'}, G);
    const aw = add(new THREE.PlaneGeometry(w - 0.6, 1.8), mat(0xf2e6c8, {roughness:0.8, side:THREE.DoubleSide}), 0, 3.2, D / 2 + 0.95, G); aw.rotation.x = -1.05;
    for (let i = 0; i < 9; i++) add(new THREE.PlaneGeometry((w - 0.6) / 18, 1.82), mat(0x2a5a6a, {roughness:0.8, side:THREE.DoubleSide}), -w / 2 + 0.3 + (i * 2 + 0.5) * (w - 0.6) / 18, 3.2, D / 2 + 0.96, G, false).rotation.x = -1.05;
    // vitrindeki kruvasanlar ve baguetteler
    const croG = (() => { const g = new THREE.TorusGeometry(0.13, 0.06, 8, 12, Math.PI * 1.25); g.rotateZ(-Math.PI * 0.12); g.scale(1, 1, 0.8); return g; })();
    const crust = mat(0xc8873a, {roughness:0.5});
    [-1, 1].forEach(sd => {
      add(box(3.2, 0.9, 0.9), darkWood, sd * 3.6, 0.45, D / 2 + 0.55, G);
      for (let k = 0; k < 8; k++){ const c = add(croG, crust, sd * 3.6 - 1.3 + (k % 4) * 0.85, 0.98, D / 2 + 0.35 + Math.floor(k / 4) * 0.4, G); c.rotation.x = -Math.PI / 2; }
      const basket = add(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 12, 1, true), wood, sd * 5.8, 1.15, D / 2 + 0.55, G); basket.material.side = THREE.DoubleSide;
      for (let k = 0; k < 4; k++){ const bg = add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6), crust, sd * 5.8 + (k - 1.5) * 0.08, 1.45, D / 2 + 0.55, G); bg.rotation.z = (k - 1.5) * 0.12; }
    });
    const [fx, fz] = H.front;
    doors.boulangerie = {x:fx, z:fz, ry:Math.PI};
    const baker = npc({chef:true, coat:0xf4f2ee}); baker.scale.setScalar(1.02);
    placeNPC(baker, fx + 3.2, fz - 0.6, Math.PI, 'Fırıncı Monsieur Delacroix', async () => {
      const n = notes();
      if (!n.croissantMet){
        n.croissantMet = true; hooks.save();
        await hooks.ui.dialog([
          {name:'Monsieur Delacroix', text:'Bonjour! Boulangerie Lumière\'e hoş geldiniz. Fırından az önce çıktılar, hâlâ sıcak!'},
          {name:'Monsieur Delacroix', text:'İyi bir kruvasanın sırrı tereyağıdır: hamuru katlar, soğutur, yine katlarım. Tam yirmi yedi kat olur.'},
          {name:'Monsieur Delacroix', text:'Bir tane ister misiniz?', choices:['Evet, lütfen!', 'Sonra uğrarım']},
        ]).then(c => { if (c === 0) eat(); });
        return;
      }
      const c = await say('Monsieur Delacroix', (n.croissants || 0) > 0 ? 'Yine mi siz! Demek beğendiniz. Bir tane daha?' : 'Taze kruvasan, pain au chocolat, baguette… Ne alırsınız?', ['Kruvasan', 'Pain au chocolat', 'Teşekkürler']);
      if (c === 0) eat(); else if (c === 1){ hooks.sfx('coin'); hooks.ui.toast('Pain au chocolat: içinde iki çubuk bitter çikolata!', 2800); }
    });
    function eat(){
      const n = notes(); n.croissants = (n.croissants || 0) + 1; hooks.save(); hooks.sfx('coin');
      hooks.ui.toast(n.croissants === 1 ? 'Kruvasan: dışı çıtır çıtır, içi yumuşacık. Parmakların tereyağı oldu!' : 'Kruvasan (' + n.croissants + '). Monsieur Delacroix gülümsüyor.', 3000);
    }
    markers.push({id:'kruvasan', color:'#e8b45a', label:'Kruvasancı', x:fx, z:fz, minor:true, show:() => !notes().croissantMet});
  }

  /* ---------- kafe terası ---------- */
  {
    const cf = PARIS.cafe, w = cf.x1 - cf.x0, cx = (cf.x0 + cf.x1) / 2, zf = bz0 - D / 2;
    const H = haussmann({x:cx, z:zf, w, rot:0, shop:2, awning:false});
    const aw = add(new THREE.PlaneGeometry(w - 0.4, 3.2), mat(0x8a1a2a, {roughness:0.8, side:THREE.DoubleSide}), 0, 3.4, D / 2 + 1.4, H.G); aw.rotation.x = -1.15;
    putPlaque('CAFÉ DE LUMIÈRE', 0, 4.0, D / 2 + 0.14, 0, w - 4, 0.8, {bg:'#5a1a1a', fg:'#f2e6c8', italic:true}, H.G);
    const rattan = mat(0xb08a52, {roughness:0.8}), marbleTop = Mw.marbleMat;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++){
      const tx = cf.x0 + 2.5 + i * (w - 5) / 3, tz = bz0 + 1.0 + j * 1.6;
      add(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16), marbleTop, tx, 0.78, tz); add(new THREE.CylinderGeometry(0.03, 0.03, 0.74, 6), iron, tx, 0.42, tz);
      [-1, 1].forEach(sd => { add(box(0.42, 0.06, 0.42), rattan, tx + sd * 0.6, 0.48, tz); add(box(0.42, 0.5, 0.05), rattan, tx + sd * 0.6, 0.75, tz - 0.2); });
      add(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 10), mat(0xf4f2ee), tx, 0.84, tz);
      C.circle(tx, tz, 0.5);
    }
    const garcon = npc({coat:0x1a1a1a, hat:'yok', apron:true});
    placeNPC(garcon, cf.x0 + 1.2, bz0 + 1.8, Math.PI / 2, 'Garson Émile', () => say('Garson Émile', 'Bir café crème mi? Burada herkes bir saat oturur, gelip geçeni seyreder. Paris\'te buna "flâner" deriz.'));
  }

  /* ---------- sokak eşyası: fenerler, platanlar, Wallace çeşmesi, Morris sütunu, metro ---------- */
  const lampHeads = [];
  for (let x = B.x0 + 6; x < B.x1 - 4; x += 14) [-1, 1].forEach(sd => {
    const z = B.z + sd * (B.w / 2 - 3.2);
    if (x > PARIS.ave.x0 - 2 && x < PARIS.ave.x1 + 2 && sd > 0) return;
    add(new THREE.CylinderGeometry(0.09, 0.16, 4.2, 8), iron, x, 2.1, z); add(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 8), iron, x, 0.25, z);
    const head = add(new THREE.CylinderGeometry(0.28, 0.16, 0.6, 6), lampGlow, x, 4.5, z, root, false); lampHeads.push(head);
    add(new THREE.ConeGeometry(0.36, 0.3, 6), iron, x, 4.95, z);
    C.circle(x, z, 0.2);
  });
  {
    // platan ağaçları: bulvarın iki yanında, fenerlerin arasında
    const pts = []; for (let x = B.x0 + 13; x < B.x1 - 4; x += 14) [-1, 1].forEach(sd => { if (!(x > PARIS.ave.x0 - 3 && x < PARIS.ave.x1 + 3 && sd > 0)) pts.push([x, B.z + sd * (B.w / 2 - 3.0)]); });
    const trunkG = new THREE.CylinderGeometry(0.18, 0.28, 4.4, 7); trunkG.translate(0, 2.2, 0);
    const crownG = new THREE.IcosahedronGeometry(2.6, 1); crownG.scale(1, 0.85, 1); crownG.translate(0, 6.2, 0);
    const T = new THREE.InstancedMesh(trunkG, mat(0x8a8068, {roughness:0.85}), pts.length), Cr = new THREE.InstancedMesh(crownG, world.windMat(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85}), 0.6, true), pts.length);
    const m = new THREE.Matrix4(), cl = new THREE.Color();
    pts.forEach(([x, z], i) => { const k = 0.9 + rnd() * 0.25; m.makeScale(k, k, k).setPosition(x, 0, z); T.setMatrixAt(i, m); Cr.setMatrixAt(i, m); Cr.setColorAt(i, cl.setHSL(0.25 + rnd() * 0.04, 0.42, 0.3 + rnd() * 0.06).convertSRGBToLinear()); C.circle(x, z, 0.3); });
    T.castShadow = Cr.castShadow = true; root.add(T, Cr);
  }
  const wallace = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const green = mat(0x1f4a32, {roughness:0.4, metalness:0.5});
    add(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 8), green, 0, 0.25, 0, g);
    for (let i = 0; i < 4; i++){ const a = i / 4 * Math.PI * 2 + Math.PI / 4; add(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 8), green, Math.sin(a) * 0.32, 1.2, Math.cos(a) * 0.32, g); }   // dört karyatid yerine ince sütunlar
    add(new THREE.CylinderGeometry(0.15, 0.15, 1.3, 10), green, 0, 1.2, 0, g);
    add(K.lathe([[0, 0], [0.55, 0], [0.5, 0.25], [0.2, 0.5], [0.06, 0.8], [0, 0.85]], 12), green, 0, 1.9, 0, g);
    C.circle(x, z, 0.6);
    interact.push({x, z, r:1.8, label:'Wallace çeşmesinden su iç', show:() => true, act:() => { hooks.sfx('blip'); hooks.ui.toast('Buz gibi su. Bu yeşil çeşmeler Paris\'in her köşesinde vardır.', 2600); }});
  };
  wallace(-11, B.z + B.w / 2 - 2.4); wallace(118, B.z - B.w / 2 + 2.4);
  { // Morris ilan sütunu
    const x = 100, z = B.z - B.w / 2 + 2.2, posterTex = tex(256, 128, (g) => { const cols = ['#c8102e', '#e8c15a', '#1d3a6e', '#f2e6c8']; for (let i = 0; i < 6; i++){ g.fillStyle = cols[i % 4]; g.fillRect(i * 43, 0, 43, 128); g.fillStyle = i % 4 === 3 ? '#1a1a1a' : '#f2e6c8'; g.font = 'bold 15px Georgia'; g.save(); g.translate(i * 43 + 22, 64); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.fillText(['OPÉRA', 'BAL', 'CIRQUE', 'THÉÂTRE', 'CONCERT', 'SALON'][i], 0, 5); g.restore(); } });
    const pm = mat(0xffffff, {map:posterTex, roughness:0.7}); pm.map.repeat.set(1, 1);
    add(new THREE.CylinderGeometry(0.75, 0.75, 3.0, 20), pm, x, 1.9, z); add(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 20), mat(0x1f4a32, {roughness:0.4}), x, 0.2, z);
    add(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x1f4a32, {roughness:0.4}), x, 3.4, z).scale.y = 0.7;
    C.circle(x, z, 0.85);
  }
  { // Guimard metro girişi: kıvrımlı yeşil demir, turuncu lambalar, "MÉTROPOLITAIN"
    const x = 140, z = B.z + B.w / 2 - 2.2, g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const green = mat(0x2f5a3a, {roughness:0.4, metalness:0.4});
    [-1, 1].forEach(sd => {
      const pts = []; for (let i = 0; i <= 12; i++){ const t = i / 12; pts.push(new THREE.Vector3(sd * (1.6 + Math.sin(t * Math.PI) * 0.2), t * 3.4, Math.sin(t * 2.5) * 0.25)); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.08, 6), green, 0, 0, 0, g);
      const l = add(new THREE.SphereGeometry(0.2, 10, 8), lampGlow, sd * 1.5, 3.5, 0.2, g, false); l.scale.y = 1.4; lampHeads.push(l);
      add(box(0.1, 1.0, 3.0), green, sd * 1.6, 0.5, -1.6, g); C.box(...toWorld(g, sd * 1.6, -1.6), 0.08, 1.5, 0);
    });
    putPlaque('MÉTROPOLITAIN', 0, 3.0, 0.02, 0, 2.6, 0.45, {bg:'#e8d8a8', fg:'#1f4a32', font:'Georgia, serif'}, g);
    add(box(3.0, 0.08, 3.2), mat(0x2a2a2a), 0, 0.02, -1.6, g, false);
    interact.push({x, z:z - 0.5, r:2.2, label:'Metro merdivenlerine bak', show:() => true, act:() => say('Tabela', 'Hat 1: Château de Lumière – Tour Eiffel. "Trenler henüz icat edilmedi; lütfen yürüyünüz." — Belediye')});
  }

  /* ---------- Champ de Mars ve Eiffel Kulesi ---------- */
  const CH = PARIS.champ, E = PARIS.eiffel;
  floor(CH.x1 - CH.x0, CH.z1 - CH.z0, K.grass, (CH.x0 + CH.x1) / 2, 0.025, (CH.z0 + CH.z1) / 2, 0, 6);
  [-1, 1].forEach(sd => floor(4, CH.z1 - CH.z0, Mw.gravelMat, E.x + sd * 12, 0.035, (CH.z0 + CH.z1) / 2));
  floor(40, 40, Mw.gravelMat, E.x, 0.03, E.z);
  const eiffel = (() => {
    const brown = 0x6b5640, latticeTex = tex(128, 128, (g) => {
      g.clearRect(0, 0, 128, 128); g.strokeStyle = '#fff'; g.lineCap = 'square';
      g.lineWidth = 10; g.strokeRect(5, 5, 118, 118);
      g.lineWidth = 6; g.beginPath(); g.moveTo(8, 8); g.lineTo(120, 120); g.moveTo(120, 8); g.lineTo(8, 120); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(64, 8); g.lineTo(64, 120); g.moveTo(8, 64); g.lineTo(120, 64); g.stroke();
    });
    const latMat = new THREE.MeshStandardMaterial({color:brown, map:latticeTex, alphaTest:0.5, side:THREE.DoubleSide, roughness:0.6, metalness:0.35, emissive:0xffa040, emissiveMap:latticeTex, emissiveIntensity:0});
    const solid = mat(brown, {roughness:0.55, metalness:0.4});
    const G = new THREE.Group(); G.position.set(E.x, 0, E.z); root.add(G);
    // kesit genişliği (kenar uzunluğu, m) yüksekliğe göre: alt bacaklar ayrı, 1. kattan sonra tek gövde
    const P1 = 16, P2 = 32, TOP = 76, Wd = y => y < P1 ? 34 - y * 0.62 : y < P2 ? 24 - (y - P1) * 0.62 : Math.max(2.4, 14 * Math.pow(1 - (y - P2) / (TOP - P2 + 6), 1.7));
    // iki kesit arası kafes gövde (dört yüz)
    const frustumLattice = (y0, y1, w0, w1, cx0 = 0, cz0 = 0, cx1 = 0, cz1 = 0) => {
      const pos = [], uv = [], idx = [], h = Math.hypot(y1 - y0, (w0 - w1) / 2);
      const c0 = [[-1, 1], [1, 1], [1, -1], [-1, -1]];
      for (let f = 0; f < 4; f++){
        const a = c0[f], b = c0[(f + 1) % 4], base = pos.length / 3;
        pos.push(cx0 + a[0] * w0 / 2, y0, cz0 + a[1] * w0 / 2, cx0 + b[0] * w0 / 2, y0, cz0 + b[1] * w0 / 2, cx1 + b[0] * w1 / 2, y1, cz1 + b[1] * w1 / 2, cx1 + a[0] * w1 / 2, y1, cz1 + a[1] * w1 / 2);
        const tu = Math.max(1, Math.round(w0 / 3)), tv = Math.max(1, Math.round(h / 3));
        uv.push(0, 0, tu, 0, tu * w1 / w0, tv, 0, tv);
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
    };
    const strut = (ax, ay, az, bx, by, bz, r = 0.35) => { const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz), l = a.distanceTo(b), m = add(new THREE.CylinderGeometry(r, r, l, 6), solid, 0, 0, 0, G); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m; };
    // dört bacak: köşede 7 m kare kesit, 1. kata doğru içe eğik
    const legW0 = 7, legW1 = 4.2;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
      const bx = sx * (Wd(0) / 2 - legW0 / 2), bzz = sz * (Wd(0) / 2 - legW0 / 2), tx = sx * (Wd(P1) / 2 - legW1 / 2), tz = sz * (Wd(P1) / 2 - legW1 / 2);
      add(frustumLattice(0, P1, legW0, legW1, bx, bzz, tx, tz), latMat, 0, 0, 0, G, true);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([cx, cz]) => strut(bx + cx * legW0 / 2, 0, bzz + cz * legW0 / 2, tx + cx * legW1 / 2, P1, tz + cz * legW1 / 2, 0.28));
      add(box(legW0 + 1.4, 1.2, legW0 + 1.4), stone, bx, 0.6, bzz, G);
      C.circle(E.x + bx, E.z + bzz, legW0 * 0.62);
    });
    // bacakların arasındaki süs kemerleri
    [0, 1, 2, 3].forEach(f => {
      const pts = []; for (let i = 0; i <= 16; i++){ const t = i / 16, u = (t - 0.5) * (Wd(0) - legW0 * 1.6), y = P1 - 7 + Math.cos((t - 0.5) * Math.PI) * 6; pts.push(f % 2 ? new THREE.Vector3((f === 1 ? 1 : -1) * (Wd(y) / 2 - 1.2), y, u) : new THREE.Vector3(u, y, (f === 0 ? 1 : -1) * (Wd(y) / 2 - 1.2))); }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.35, 6), solid, 0, 0, 0, G);
    });
    // katlar
    const deck = (y, w, rail = true) => {
      add(box(w + 2, 1.6, w + 2), solid, 0, y, 0, G);
      add(box(w + 2.2, 0.6, w + 2.2), mat(0xd8c8a0, {roughness:0.6}), 0, y + 0.95, 0, G).scale.set(1, 1, 1);
      if (rail) [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => { const rg = add(box(a ? 0.08 : w + 2, 1.1, a ? w + 2 : 0.08), latMat, a * (w / 2 + 1), y + 1.8, b * (w / 2 + 1), G, false); rg.castShadow = false; });
    };
    deck(P1, Wd(P1)); deck(P2, Wd(P2) + 4);
    add(frustumLattice(P1 + 0.8, P2 - 0.8, Wd(P1) - 2, Wd(P2) - 1), latMat, 0, 0, 0, G, true);
    let y = P2 + 0.8; const segs = 8;
    for (let i = 0; i < segs; i++){ const y1 = P2 + (TOP - P2) * (i + 1) / segs; add(frustumLattice(y, y1, Wd(y), Wd(y1)), latMat, 0, 0, 0, G, true); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([cx, cz]) => strut(cx * Wd(y) / 2, y, cz * Wd(y) / 2, cx * Wd(y1) / 2, y1, cz * Wd(y1) / 2, 0.22)); y = y1; }
    add(box(4.2, 3.0, 4.2), solid, 0, TOP + 1.5, 0, G);
    add(box(4.6, 0.3, 4.6), solid, 0, TOP + 3.1, 0, G);
    add(new THREE.CylinderGeometry(0.5, 0.9, 3.4, 8), solid, 0, TOP + 4.9, 0, G);
    add(new THREE.CylinderGeometry(0.08, 0.2, 7, 6), solid, 0, TOP + 10, 0, G);
    // ikinci kat: yürünebilir seyir terası; asansör
    const half = (Wd(P2) + 4) / 2 + 1;
    C.heightFns.push((px, pz) => Math.abs(px - E.x) < half && Math.abs(pz - E.z) < half ? P2 + 1.25 : null);
    [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => { const o = C.box(E.x + a * half, E.z + b * half, a ? 0.15 : half, a ? half : 0.15, 0); o.y0 = P2; o.y1 = P2 + 4; });
    // gece pırıltısı: kafes kenarlarında yanıp sönen altın noktalar (tek çizim, kendi küçük gölgelendiricisi)
    const NP = 700, pp = new Float32Array(NP * 3), ph = new Float32Array(NP);
    for (let i = 0; i < NP; i++){
      const yy = Math.pow(rnd(), 0.8) * (TOP + 2), w = (yy < P1 ? Wd(yy) - 2 : Wd(yy)) / 2, side = Math.floor(rnd() * 4), u = (rnd() * 2 - 1) * w;
      const [px, pz] = [[u, w], [w, u], [u, -w], [-w, u]][side];
      pp.set([px, yy, pz], i * 3); ph[i] = rnd() * 100;
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
    const sparkU = {uTime:{value:0}, uOn:{value:0}};
    const spark = new THREE.Points(pg, new THREE.ShaderMaterial({uniforms:sparkU, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`attribute float phase; uniform float uTime; uniform float uOn; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float f = fract(sin(floor(uTime * 9.0 + phase) * 12.9898 + phase) * 43758.5453);
          vA = uOn * step(0.78, f); gl_PointSize = vA * 160.0 / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader:`varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5 || vA < 0.01) discard; gl_FragColor = vec4(1.0, 0.92, 0.7, vA * (1.0 - d * 2.0)); }`}));
    spark.frustumCulled = false; G.add(spark);
    return {G, latMat, sparkU, P2, half};
  })();
  const liftDown = {x:E.x, z:E.z + 12};
  interact.push({x:E.x, z:E.z + 9, r:2.6, y:0, label:'Asansörle ikinci kata çık', show:() => !!heroRef, act:() => {
    hooks.sfx('whoosh');
    hooks.ui.fade(() => heroRef.teleport(E.x, eiffel.P2 + 1.25, E.z + eiffel.half - 2, Math.PI)).then(() => hooks.ui.toast('Eiffel Kulesi, ikinci kat: bütün Lumière ayaklarının altında!', 3200));
  }});
  interact.push({x:E.x, z:E.z + eiffel.half - 2, r:2.6, y:eiffel.P2 + 1.25, label:'Asansörle aşağı in', show:() => !!heroRef, act:() => { hooks.sfx('whoosh'); hooks.ui.fade(() => heroRef.teleport(liftDown.x, 0, liftDown.z, 0)); }});
  {
    const guide = lady(0x1d3a6e, 0x3a2a1a);
    placeNPC(guide, E.x + 6, E.z + 22, Math.PI, 'Mühendis Mlle Gustavine', () => hooks.ui.dialog([
      {name:'Mlle Gustavine', text:'Bu kule 18.038 demir parçadan ve 2,5 milyon perçinden yapıldı. Rüzgârda tepesi birkaç santim salınır ama asla devrilmez!'},
      {name:'Mlle Gustavine', text:'Sanatçılar önce "demir canavar" dediler. Bugün ise Paris\'in simgesi. Asansörle ikinci kata çıkabilirsin; geceleri her saat başı pırıl pırıl yanar.'},
    ]));
  }

  /* ================= COLMAR: Küçük Venedik ================= */
  const CO = COLMAR, cz = CO.canalZ, cw = CO.canalW;
  // yarı ahşap (colombage) duvar dokusu: bir kat = bir doku karesi; pencereler ve panjurlar boyalı, gece pencereler yanar
  const plasterCols = ['#f2b8a0', '#f4d58a', '#9ec3d8', '#b8d49a', '#e89a6a', '#f4ead6', '#d8a8c8'];
  const colTex = (bg, lit) => tex(128, 128, (g) => {
    g.fillStyle = lit ? '#000' : bg; g.fillRect(0, 0, 128, 128);
    if (lit){ g.fillStyle = '#ffcf8a'; g.fillRect(44, 40, 40, 46); return; }
    g.fillStyle = '#4a2e1c';
    g.fillRect(0, 0, 128, 9); g.fillRect(0, 119, 128, 9); g.fillRect(0, 0, 9, 128); g.fillRect(119, 0, 9, 128);
    g.lineWidth = 7; g.strokeStyle = '#4a2e1c'; g.beginPath(); g.moveTo(9, 119); g.lineTo(40, 40); g.moveTo(119, 119); g.lineTo(88, 40); g.moveTo(9, 100); g.lineTo(36, 92); g.moveTo(119, 100); g.lineTo(92, 92); g.stroke();
    g.fillRect(36, 34, 56, 6); g.fillRect(36, 88, 56, 6);
    g.fillStyle = '#f4f2ec'; g.fillRect(42, 40, 44, 48); g.fillStyle = '#2a3440'; g.fillRect(46, 44, 16, 40); g.fillRect(66, 44, 16, 40);
    g.fillStyle = ['#2f6a3a', '#1d3a6e', '#7a1a14'][Math.floor(rnd() * 3)]; g.fillRect(28, 40, 12, 48); g.fillRect(88, 40, 12, 48);
  });
  const colMats = plasterCols.map(c => new THREE.MeshStandardMaterial({map:colTex(c, false), emissive:0xffb060, emissiveMap:colTex(c, true), emissiveIntensity:0, roughness:0.85}));
  const roofTex = tex(128, 128, (g) => { g.fillStyle = '#7a3a26'; g.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 10) for (let x = (y / 10 % 2) * 8; x < 136; x += 16){ const v = 110 + rnd() * 50; g.fillStyle = `rgb(${v + 40 | 0},${v * 0.55 | 0},${v * 0.38 | 0})`; g.beginPath(); g.ellipse(x, y + 6, 7, 6, 0, 0, Math.PI); g.fill(); } });
  const roofMat = mat(0xffffff, {map:roofTex, roughness:0.8, side:THREE.DoubleSide});
  const sandstone = mat(0xc4887a, {map:Mw.stoneMat.map, roughness:0.85});           // Vosges pembe kumtaşı
  const flowerMat = mat(0xffffff, {map:tex(64, 32, (g) => { g.fillStyle = '#3f6a2a'; g.fillRect(0, 0, 64, 32); for (let i = 0; i < 40; i++){ g.fillStyle = ['#e8203a', '#ff5a7a', '#f4f2ec'][i % 3]; g.beginPath(); g.arc(rnd() * 64, rnd() * 20 + 4, 2.5 + rnd() * 2, 0, Math.PI * 2); g.fill(); } }), roughness:0.8});
  /** Colmar evi: taş zemin kat, her üst kat bir öncekinden taşkın; sarp beşik çatı, alın cephe öne bakar (yerel +z). */
  function colHouse({x, z, w, d, floors = 3, rot = 0, ci = 0}){
    const G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = rot; root.add(G);
    const gh = 3.0, fh = 2.8, m = colMats[ci % colMats.length];
    add(box(w, gh, d), sandstone, 0, gh / 2, 0, G);
    add(new THREE.PlaneGeometry(1.3, 2.3), mat(0x5a3a22, {roughness:0.6}), (rnd() - 0.5) * (w - 2), 1.15, d / 2 + 0.02, G, false);
    let y = gh, ww = w, dd = d;
    for (let f = 0; f < floors - 1; f++){
      ww += 0.35; dd += 0.35;
      add(facadeBox(ww, fh, dd, 2.6, fh), m, 0, y + fh / 2, 0.17 * (f + 1), G);
      add(box(ww + 0.1, 0.18, dd + 0.1), darkWood, 0, y + 0.05, 0.17 * (f + 1), G);
      // pencere altı çiçek saksıları
      const n = Math.max(1, Math.round(ww / 2.6));
      for (let i = 0; i < n; i++){ const bx = -ww / 2 + (i + 0.5) * ww / n; add(box(1.3, 0.3, 0.35), darkWood, bx, y + 0.65, dd / 2 + 0.17 * (f + 1) + 0.18, G); add(box(1.25, 0.28, 0.3), flowerMat, bx, y + 0.93, dd / 2 + 0.17 * (f + 1) + 0.18, G, false); }
      y += fh;
    }
    // alın üçgeni ve sarp çatı (eğim ~55°)
    const rh = ww * 0.72, zoff = 0.17 * (floors - 1);
    const s = new THREE.Shape(); s.moveTo(-ww / 2, 0); s.lineTo(ww / 2, 0); s.lineTo(0, rh); s.closePath();
    const gg = new THREE.ExtrudeGeometry(s, {depth:dd - 0.2, bevelEnabled:false}); gg.translate(0, 0, -(dd - 0.2) / 2);
    const uvs = gg.attributes.uv; for (let i = 0; i < uvs.count; i++) uvs.setXY(i, uvs.getX(i) / 2.6, uvs.getY(i) / fh);
    add(gg, m, 0, y, zoff, G);
    const slope = Math.hypot(ww / 2, rh) + 0.5, ang = Math.atan2(rh, ww / 2);
    [-1, 1].forEach(sd => { const r = add(box(slope, 0.16, dd + 0.9, 1.6), roofMat, sd * (ww / 4 + 0.05), y + rh / 2 + 0.1, zoff, G); r.rotation.z = -sd * ang; });
    add(box(0.3, 0.3, dd + 1), roofMat, 0, y + rh + 0.12, zoff, G);
    // çatı penceresi
    if (rnd() < 0.6){ const dm = add(box(1.0, 1.0, 1.2), m, ww * 0.18, y + rh * 0.35, zoff + dd * 0.15, G); dm.rotation.z = 0; }
    C.box(x, z, ww / 2 + 0.1, dd / 2 + 0.3, rot);
    return {G, top:y + rh, front:toWorld(G, 0, d / 2 + 1.6)};
  }
  // kanal: kumtaşı rıhtım, su, kayık
  const water = mat(0x2a5a5e, {roughness:0.05, metalness:0.3, transparent:true, opacity:0.88});
  floor(CO.x1 - CO.x0, cw, mat(0x1a2a24, {roughness:1}), (CO.x0 + CO.x1) / 2, 0.02, cz);
  floor(CO.x1 - CO.x0, cw, water, (CO.x0 + CO.x1) / 2, 0.06, cz);
  [-1, 1].forEach(sd => { add(box(CO.x1 - CO.x0, 0.4, 0.6, 1.6), sandstone, (CO.x0 + CO.x1) / 2, 0.2, cz + sd * (cw / 2 + 0.3)); floor(CO.x1 - CO.x0, 3, cobble, (CO.x0 + CO.x1) / 2, 0.03, cz + sd * (cw / 2 + 2.1), 0, 3); });
  const bridges = [-128, -88];
  [-1, 1].forEach(sd => { let a = CO.x0; bridges.forEach(bx => { C.rect(a, cz + sd * (cw / 2 + 0.3) - 0.3, bx - 1.8, cz + sd * (cw / 2 + 0.3) + 0.3).low = true; a = bx + 1.8; }); C.rect(a, cz + sd * (cw / 2 + 0.3) - 0.3, CO.x1, cz + sd * (cw / 2 + 0.3) + 0.3).low = true; });
  // kanal uçları kapalı
  [CO.x0, CO.x1].forEach(x => C.rect(x - 0.3, cz - cw / 2, x + 0.3, cz + cw / 2));
  bridges.forEach(bx => {
    const L = cw + 3, rise = 0.9, hy = t => rise * Math.sin(Math.PI * t);
    for (let i = 0; i < 14; i++){ const t = (i + 0.5) / 14, zz = cz - L / 2 + t * L; add(box(2.6, 0.25, L / 14 + 0.02), wood, bx, hy(t) + 0.1, zz); }
    [-1, 1].forEach(sd => {
      for (let i = 0; i <= 6; i++){ const t = i / 6, zz = cz - L / 2 + t * L; add(box(0.1, 1.0, 0.1), darkWood, bx + sd * 1.25, hy(t) + 0.6, zz); }
      for (let i = 0; i < 6; i++){ const t = (i + 0.5) / 6, zz = cz - L / 2 + t * L; add(box(0.3, 0.25, L / 6 - 0.1), flowerMat, bx + sd * 1.32, hy(t) + 1.15, zz, root, false); }
      C.box(bx + sd * 1.3, cz, 0.1, cw / 2, 0).low = true;
    });
    C.heightFns.push((x, z) => Math.abs(x - bx) < 1.2 && Math.abs(z - cz) < L / 2 ? hy((z - cz + L / 2) / L) + 0.22 : null);
  });
  // kıyı boyunca evler: kuzey kıyıdakiler güneye, güney kıyıdakiler kuzeye (kanala) bakar
  const houses = [];
  [-1, 1].forEach(sd => {
    let x = CO.x0 + 1, i = 0;
    while (x < CO.x1 - 7){
      const w = 6 + Math.floor(rnd() * 3), d = 9, zc = cz + sd * (cw / 2 + 3.6 + d / 2), xc = x + w / 2;
      if (bridges.some(bx => Math.abs(bx - xc) < w / 2 + 1.2) || LUMIERE_COAST.dist(xc, zc) > -32){ x += 2; continue; }
      houses.push(colHouse({x:xc, z:zc, w, d, floors:3 + (rnd() < 0.4 ? 1 : 0), rot:sd < 0 ? 0 : Math.PI, ci:i++ + (sd > 0 ? 3 : 0)}));
      x += w + 0.4;
    }
  });
  // kanalda düz tabanlı kayık
  const boat = new THREE.Group(); boat.userData.dyn = true; root.add(boat);
  add(box(1.3, 0.4, 4.6), darkWood, 0, 0.12, 0, boat); add(box(1.1, 0.1, 4.2), wood, 0, 0.33, 0, boat);
  const rower = npc({coat:0x2a3a5a, hat:'yok'}); rower.position.set(0, 0.3, -1.6); rower.scale.setScalar(0.95); boat.add(rower);
  updaters.push((dt, t) => { const u = (Math.sin(t * 0.035) * 0.5 + 0.5), x = CO.x0 + 6 + u * (CO.x1 - CO.x0 - 12); boat.position.set(x, 0.05, cz + 1.2); boat.rotation.y = Math.cos(t * 0.035) > 0 ? Math.PI / 2 : -Math.PI / 2; });
  // Grand Rue: bulvarın batı ucundan Colmar'a, kilise meydanı
  floor(CO.x1 - CO.x0 + 4, 7, cobble, (CO.x0 + CO.x1) / 2, 0.03, PARIS.blvd.z, 0, 3);
  floor(70, 26, cobble, CO.church.x + 20, 0.028, CO.church.z, 0, 3);
  { // St-Martin kilisesi: pembe kumtaşı, renkli sırlı kiremit desenli çatı, kule
    const g = new THREE.Group(); g.position.set(CO.church.x, 0, CO.church.z); root.add(g);
    const glazed = mat(0xffffff, {map:tex(128, 128, (gx) => { const cols = ['#7a3a26', '#2f6a3a', '#e8c15a', '#1d3a6e']; for (let y = 0; y < 128; y += 16) for (let x = 0; x < 128; x += 16){ gx.fillStyle = cols[((x + y) / 16 + (y / 32 | 0)) % 4]; gx.beginPath(); gx.moveTo(x + 8, y); gx.lineTo(x + 16, y + 8); gx.lineTo(x + 8, y + 16); gx.lineTo(x, y + 8); gx.fill(); } }), roughness:0.35, side:THREE.DoubleSide});
    add(box(30, 12, 12), sandstone, 0, 6, 0, g);
    const s = new THREE.Shape(); s.moveTo(-6.6, 0); s.lineTo(6.6, 0); s.lineTo(0, 9); s.closePath();
    const rg = new THREE.ExtrudeGeometry(s, {depth:31, bevelEnabled:false}); rg.translate(0, 0, -15.5); rg.rotateY(Math.PI / 2);
    const uv = rg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
    add(rg, glazed, 0, 12, 0, g);
    add(box(7, 30, 7), sandstone, 12, 15, 0, g);
    add(new THREE.ConeGeometry(4.6, 14, 4), glazed, 12, 37, 0, g).rotation.y = Math.PI / 4;
    for (let i = 0; i < 5; i++) add(new THREE.PlaneGeometry(1.6, 4.5), mat(0x3a4a8a, {roughness:0.1, metalness:0.4, emissive:0x8a5aff, emissiveIntensity:0.15}), -12 + i * 5, 6.5, 6.02, g, false);
    add(new THREE.CircleGeometry(2.4, 24), mat(0x8a3a6a, {roughness:0.1, emissive:0xff6aaa, emissiveIntensity:0.2}), -15.02, 8, 0, g, false).rotation.y = -Math.PI / 2;
    C.box(CO.church.x, CO.church.z, 15.2, 6.2); C.box(CO.church.x + 12, CO.church.z, 3.6, 3.6);
    // leylek yuvası kulenin tepesinde değil, kilisenin batı alnında: Alsas'ın simgesi
    const nest = new THREE.Group(); nest.position.set(-15.5, 21.5, 0); g.add(nest);
    add(new THREE.CylinderGeometry(1.3, 1.0, 0.6, 14), mat(0x6a5030, {roughness:1}), 0, 0, 0, nest);
    const white = mat(0xf4f2ee, {roughness:0.6}), blackF = mat(0x1a1a1a), beak = mat(0xd8401a);
    add(new THREE.SphereGeometry(0.4, 12, 8), white, 0, 0.75, 0, nest).scale.set(0.8, 0.9, 1.5);
    add(new THREE.SphereGeometry(0.2, 10, 8), white, 0, 1.4, 0.45, nest);
    add(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), white, 0, 1.05, 0.3, nest).rotation.x = 0.5;
    const bk = add(new THREE.ConeGeometry(0.05, 0.5, 6), beak, 0, 1.38, 0.82, nest); bk.rotation.x = Math.PI / 2;
    [-1, 1].forEach(sd => add(new THREE.SphereGeometry(0.22, 8, 6), blackF, sd * 0.3, 0.75, -0.25, nest).scale.set(0.4, 0.7, 1.5));
  }
  { // Schwendi çeşmesi
    const { x, z } = CO.fountain;
    add(K.lathe([[0, 0], [3.2, 0], [3.2, 0.7], [2.9, 0.7], [2.9, 0.15]], 28), sandstone, x, 0, z);
    add(new THREE.CircleGeometry(2.9, 28), water, x, 0.5, z, root, false).rotation.x = -Math.PI / 2;
    K.statue(x, z, 1, Math.PI, 0.7, 'Lazarus von Schwendi', 'Kaidede: "Alsas\'a Tokay üzümünü getiren general." Colmarlılar onu her bağ bozumunda anar.');
    C.circle(x, z, 3.3);
  }
  { // winstub: geleneksel Alsas şarap evi
    const h = colHouse({x:-70, z:CO.church.z, w:10, d:10, floors:3, rot:-Math.PI / 2, ci:1});
    putPlaque('Winstub Au Koïfhus', 0, 3.6, 5.05, 0, 3.4, 0.6, {bg:'#5a1a1a', fg:'#f2e6c8', italic:true}, h.G);
    doors.winstub = {x:h.front[0], z:h.front[1], ry:-Math.PI / 2};
  }
  {
    const lotte = lady(0x8a1a2a, 0x5a3a22);
    // Alsas başlığı: büyük siyah fiyonk
    [-1, 1].forEach(sd => { const b = add(new THREE.SphereGeometry(0.22, 10, 8), mat(0x111111, {roughness:0.4}), sd * 0.24, 1.9, -0.02, lotte); b.scale.set(1.3, 0.8, 0.25); });
    add(new THREE.SphereGeometry(0.08, 8, 6), mat(0x111111), 0, 1.88, 0, lotte);
    placeNPC(lotte, -104, cz - cw / 2 - 2, 0, 'Lotte', () => hooks.ui.dialog([
      {name:'Lotte', text:'Grüss Gott! Colmar\'a hoş geldin. Buraya "Küçük Venedik" derler: bahçıvanlar sebzelerini bu kanaldan kayıkla pazara taşırdı.'},
      {name:'Lotte', text:'Evlerimizi renkli boyarız ki her lonca kendi evini tanısın. Ahşap iskelet duvarın kemiğidir; arası kil ve samanla doldurulur.'},
      {name:'Lotte', text:'Kilisenin alnındaki yuvaya bak: leylekler her bahar Afrika\'dan döner. Leylek gören eve uğur gelir!'},
    ]));
  }

  /* ================= bitiş ================= */
  K.bake();
  K.fixColors();
  // emissive maskeli malzemelerin renkleri bake'ten sonra da aynı: fixColors renkleri doğrusala çevirdi
  let lastNight = -1;
  function update(dt, t, hero){
    heroRef = hero;
    root.visible = hero.zone !== 'ic';
    if (!root.visible) return;
    const night = world.W.night;
    if (Math.abs(night - lastNight) > 0.01){
      lastNight = night;
      facadeMat.emissiveIntensity = night * 0.9; colMats.forEach(m => { m.emissiveIntensity = night * 0.9; });
      lampGlow.color.setRGB(0.13 + night * 1.6, 0.13 + night * 1.05, 0.13 + night * 0.45);
      eiffel.latMat.emissiveIntensity = night * 0.55;
    }
    // her saat başı (oyun saatiyle değil, gerçek dakikada bir) beş dakikalık pırıltı yerine: gece boyunca her 40 sn'de 10 sn
    eiffel.sparkU.uTime.value = t; eiffel.sparkU.uOn.value = night > 0.5 && (t % 40) < 10 ? 1 : 0;
    updaters.forEach(fn => fn(dt, t, hero));
  }
  return {root, interact, markers, update, doors};
}
