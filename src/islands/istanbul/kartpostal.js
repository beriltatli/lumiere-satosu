// Eski İstanbul kartpostalları: Sahaf Nazım Efendi'nin fırtınada dağılan sekiz kartpostalı.
// Kartlar tek atlas dokuda çizilir; görev başlayınca süzülür, bulununca kaybolur.
const CARD_DEFS = [
  {
    id:'galata',
    title:'Galata Kulesi, 1910',
    semt:'Galata',
    clue:'Galata Kulesi\'nin çevresinde, taşların üstünde süzülen bir kart görürsün.',
    back:'Sevgili kardeşim, Galata Kulesi\'ni gördüm. Bu taş kule çok eskiden gözcülük için yapılmış; tepesinden Haliç ve Boğaz bir arada görünüyor. Sana buradan selam gönderiyorum.',
    summary:'Galata Kulesi: taş gövde, gözcü kulesi ve Haliç manzarası.'
  },
  {
    id:'sultanahmet',
    title:'Hipodrom ve Dikilitaş',
    semt:'Sultanahmet',
    clue:'Sultanahmet Meydanı\'nda, Dikilitaş\'a doğru bak.',
    back:'Sevgili kardeşim, Sultanahmet Meydanı\'ndaki Dikilitaş\'ın yanındayım. Bu taş, at arabalarının yarıştığı eski Hipodrom\'un ortasında yüzyıllardır duruyor. Üzerindeki eski yazılar hâlâ seçilebiliyor.',
    summary:'Sultanahmet: Hipodrom ve Dikilitaş, eski yarış alanı.'
  },
  {
    id:'eminonu',
    title:'Eminönü vapur iskelesi',
    semt:'Eminönü',
    clue:'Eminönü iskelesinin yanında, vapurların uğultusunu dinle.',
    back:'Sevgili kardeşim, Eminönü iskelesindeyim. Vapurlar düdük çalarak Boğaz\'a açılıyor, martılar peşlerinden uçuyor. Bu iskele şehrin denize açılan eski kapılarından biri.',
    summary:'Eminönü: vapur iskelesi, martılar ve Boğaz seferleri.'
  },
  {
    id:'taksim',
    title:'Taksim Meydanı',
    semt:'Taksim',
    clue:'Taksim Meydanı\'nda, anıtın çevresine bak.',
    back:'Sevgili kardeşim, Taksim Meydanı\'ndayım. İstiklal Caddesi\'nden kırmızı tramvay geçiyor, meydanda çiçekçiler var. Meydanın ortasındaki anıt, cumhuriyetin ilk yıllarını hatırlatıyor.',
    summary:'Taksim: meydan, anıt ve İstiklal tramvayı.'
  },
  {
    id:'uskudar',
    title:'Üsküdar iskelesi ve kayıkçılar',
    semt:'Üsküdar',
    clue:'Üsküdar iskelesinde, kayıkçıların yanında olmalı.',
    back:'Sevgili kardeşim, Üsküdar iskelesindeyim. Kayıkçılar kürek çekiyor, iskelede simit satan bir amca var. Karşıya geçen vapurların düdüğü bütün meydanda yankılanıyor.',
    summary:'Üsküdar: iskele, kayıkçılar ve simit.'
  },
  {
    id:'salacak',
    title:'Kız Kulesi manzarası',
    semt:'Salacak',
    clue:'Salacak sahilinde, Kız Kulesi\'ne bakan yerde ara.',
    back:'Sevgili kardeşim, Salacak\'tan Kız Kulesi\'ne bakıyorum. Küçük kule, denizin ortasındaki adacığın üstünde duruyor ve yüzyıllardır gemilere yol gösteriyor. Gün batarken kule kızıla boyanıyor.',
    summary:'Salacak: Kız Kulesi manzarası ve gün batımı.'
  },
  {
    id:'kadikoy',
    title:'Kadıköy çarşısı ve tramvay',
    semt:'Kadıköy',
    clue:'Kadıköy çarşısında, tramvay hattının yakınında.',
    back:'Sevgili kardeşim, Kadıköy çarşısındayım. Tezgâhlarda balık, meyve ve baharat var; sokakta eski usul tramvay geçiyor. Çarşı sabahın erken saatinden beri çok kalabalık.',
    summary:'Kadıköy: çarşı, tezgâhlar ve tramvay.'
  },
  {
    id:'camlica',
    title:'Çamlıca Tepesi\'nden Boğaz',
    semt:'Çamlıca',
    clue:'Çamlıca Tepesi\'nde, seyir terasına çıkan yolda ara.',
    back:'Sevgili kardeşim, Çamlıca Tepesi\'ne çıktım. Aşağıda Boğaz kıvrıla kıvrıla uzanıyor, vapurlar küçücük görünüyor. Karşıda Tarihî Yarımada, burada Asya yakası; iki yaka bir köprüyle birleşiyor.',
    summary:'Çamlıca: tepeden Boğaz ve köprü manzarası.'
  }
];

const PAPER = '#efe4c8';
const INK = '#4a3a28';
const INK2 = '#6b573d';

/* ---------- kodla çizilen sepya kartpostal ---------- */
function cardPaper(g, title){
  g.clearRect(0, 0, 256, 176);
  g.fillStyle = PAPER; g.fillRect(0, 0, 256, 176);
  g.strokeStyle = '#9a8158'; g.lineWidth = 2; g.strokeRect(5, 5, 246, 166);
  g.strokeStyle = 'rgba(90,70,45,.35)'; g.lineWidth = 1; g.strokeRect(10, 10, 236, 156);
  const sky = g.createLinearGradient(0, 14, 0, 118);
  sky.addColorStop(0, '#d9c8a5'); sky.addColorStop(0.65, '#c0a982'); sky.addColorStop(1, '#a98f68');
  g.fillStyle = sky; g.fillRect(14, 14, 228, 104);
  g.fillStyle = 'rgba(80,60,40,.07)';
  for (let y = 16; y < 118; y += 4) for (let x = 16; x < 242; x += 7) if ((x * 3 + y * 5) % 11 === 0) g.fillRect(x, y, 1.4, 1.4);
  g.fillStyle = PAPER; g.fillRect(14, 118, 228, 44);
  g.strokeStyle = 'rgba(90,70,45,.4)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(14, 118); g.lineTo(242, 118); g.stroke();
  g.strokeStyle = 'rgba(120,80,60,.35)'; g.strokeRect(214, 22, 20, 24);
  g.beginPath(); g.arc(224, 34, 7, 0, Math.PI * 2); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 22;
  for (;;){ g.font = 'italic ' + fs + 'px Georgia, serif'; if (g.measureText(title).width <= 214 || fs <= 11) break; fs--; }
  g.fillText(title, 128, 141);
}

function cardGround(g, y){
  g.fillStyle = '#7d6545'; g.fillRect(14, y, 228, 118 - y);
  g.fillStyle = 'rgba(240,228,200,.12)';
  for (let x = 18; x < 240; x += 9) g.fillRect(x, y + 3, 4, 1);
}

function cardSea(g, y){
  g.fillStyle = '#8f7a58'; g.fillRect(14, y, 228, 118 - y);
  g.strokeStyle = 'rgba(60,45,30,.28)'; g.lineWidth = 1;
  for (let k = 0; k < 5; k++){ const yy = y + 5 + k * 6; g.beginPath(); g.moveTo(18, yy); g.lineTo(238, yy); g.stroke(); }
}

function cardTower(g, cx, base, w, h){
  g.fillStyle = INK;
  g.beginPath(); g.moveTo(cx - w / 2, base); g.lineTo(cx - w * 0.36, base - h); g.lineTo(cx + w * 0.36, base - h); g.lineTo(cx + w / 2, base); g.closePath(); g.fill();
  g.fillRect(cx - w * 0.62, base - h - 2, w * 1.24, 3);
  g.beginPath(); g.moveTo(cx - w * 0.4, base - h - 2); g.lineTo(cx, base - h - 20); g.lineTo(cx + w * 0.4, base - h - 2); g.closePath(); g.fill();
  g.fillStyle = '#d9c8a5';
  for (let y = base - h + 8; y < base - 6; y += 11){ g.fillRect(cx - 4, y, 3, 6); g.fillRect(cx + 3, y, 3, 6); }
}

function cardMinaret(g, x, base, h){
  g.fillStyle = INK;
  g.fillRect(x - 2, base - h, 4, h);
  g.fillRect(x - 4, base - h + 6, 8, 2);
  g.beginPath(); g.moveTo(x - 3, base - h); g.lineTo(x, base - h - 12); g.lineTo(x + 3, base - h); g.closePath(); g.fill();
}

function cardDome(g, x, base, r){
  g.fillStyle = INK;
  g.beginPath(); g.arc(x, base, r, Math.PI, 0); g.fill();
  g.fillRect(x - r, base, r * 2, 8);
  g.fillRect(x - 1, base - r - 8, 2, 8);
}

function cardBoat(g, x, y, s){
  g.fillStyle = INK;
  g.beginPath(); g.moveTo(x - 16 * s, y); g.lineTo(x + 16 * s, y); g.lineTo(x + 11 * s, y + 7 * s); g.lineTo(x - 11 * s, y + 7 * s); g.closePath(); g.fill();
  g.fillRect(x - 9 * s, y - 7 * s, 18 * s, 7 * s);
  g.fillRect(x - 3 * s, y - 13 * s, 5 * s, 6 * s);
  g.fillStyle = '#e8d8b0';
  for (let k = -1; k <= 1; k++) g.fillRect(x + k * 6 * s - 1.5, y - 4 * s, 3, 2);
}

function cardTram(g, x, y, s){
  g.fillStyle = '#7a2a2a';
  g.fillRect(x - 15 * s, y - 18 * s, 30 * s, 14 * s);
  g.fillRect(x - 12 * s, y - 24 * s, 24 * s, 7 * s);
  g.fillStyle = '#e8d8b0';
  for (let k = -2; k <= 2; k++) g.fillRect(x + k * 5 * s - 1.5, y - 16 * s, 3, 4 * s);
  g.fillStyle = INK;
  g.fillRect(x - 13 * s, y - 4 * s, 26 * s, 3 * s);
  g.beginPath(); g.arc(x - 8 * s, y, 3 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x + 8 * s, y, 3 * s, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, y - 24 * s); g.lineTo(x + 8 * s, y - 34 * s); g.stroke();
}

function cardTree(g, x, y, s){
  g.fillStyle = '#5a4632';
  g.fillRect(x - 1.5 * s, y - 12 * s, 3 * s, 12 * s);
  g.beginPath(); g.arc(x, y - 16 * s, 8 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x - 5 * s, y - 13 * s, 6 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(x + 5 * s, y - 13 * s, 6 * s, 0, Math.PI * 2); g.fill();
}

function cardGull(g, x, y, s){
  g.strokeStyle = INK2; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x - 4 * s, y); g.quadraticCurveTo(x - 2 * s, y - 3 * s, x, y); g.quadraticCurveTo(x + 2 * s, y - 3 * s, x + 4 * s, y); g.stroke();
}

function cardScene(g, i){
  g.save();
  g.beginPath(); g.rect(14, 14, 228, 104); g.clip();
  g.fillStyle = 'rgba(246,234,204,.5)';
  g.beginPath(); g.arc(202, 40, 17, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(245,236,214,.28)';
  g.beginPath(); g.ellipse(60, 38, 24, 8, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(96, 32, 16, 6, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(170, 50, 20, 7, 0, 0, Math.PI * 2); g.fill();
  if (i === 0){
    cardGround(g, 104);
    g.fillStyle = INK2;
    g.fillRect(20, 88, 34, 16); g.fillRect(52, 92, 26, 12);
    g.fillRect(176, 90, 30, 14); g.fillRect(206, 94, 22, 10);
    cardTower(g, 120, 104, 32, 48);
    g.strokeStyle = INK; g.lineWidth = 1;
    g.beginPath(); g.moveTo(120, 36); g.lineTo(120, 24); g.stroke();
    g.fillStyle = '#7a2a2a';
    g.beginPath(); g.moveTo(120, 24); g.lineTo(130, 27); g.lineTo(120, 30); g.closePath(); g.fill();
  } else if (i === 1){
    cardGround(g, 104);
    cardDome(g, 86, 88, 26);
    cardDome(g, 120, 92, 14);
    cardMinaret(g, 42, 104, 58);
    cardMinaret(g, 138, 104, 58);
    g.fillStyle = INK;
    g.beginPath(); g.moveTo(166, 58); g.lineTo(174, 58); g.lineTo(178, 104); g.lineTo(162, 104); g.closePath(); g.fill();
    g.fillRect(158, 104, 24, 5);
    g.beginPath(); g.moveTo(166, 58); g.lineTo(170, 48); g.lineTo(174, 58); g.closePath(); g.fill();
    g.fillStyle = '#d9c8a5'; g.fillRect(168, 66, 4, 30);
  } else if (i === 2){
    cardSea(g, 92);
    g.fillStyle = INK2; g.fillRect(14, 82, 228, 10);
    cardDome(g, 60, 82, 14);
    cardMinaret(g, 88, 82, 34);
    g.fillStyle = INK;
    g.fillRect(28, 98, 92, 5);
    g.fillRect(36, 103, 5, 15); g.fillRect(100, 103, 5, 15);
    cardBoat(g, 176, 92, 1.5);
    cardGull(g, 60, 40, 1); cardGull(g, 84, 32, 0.8); cardGull(g, 150, 46, 1.1);
  } else if (i === 3){
    cardGround(g, 104);
    g.fillStyle = INK2;
    g.fillRect(18, 76, 44, 28); g.fillRect(194, 80, 44, 24);
    g.fillStyle = 'rgba(239,228,200,.5)';
    for (let x = 24; x < 58; x += 10) g.fillRect(x, 84, 4, 6);
    for (let x = 200; x < 234; x += 10) g.fillRect(x, 88, 4, 6);
    g.fillStyle = INK;
    g.fillRect(112, 96, 32, 8);
    g.fillRect(116, 72, 5, 24); g.fillRect(135, 72, 5, 24);
    g.fillRect(112, 68, 32, 5);
    g.beginPath(); g.arc(128, 60, 6, 0, Math.PI * 2); g.fill();
    cardTram(g, 58, 104, 1.1);
  } else if (i === 4){
    cardSea(g, 94);
    g.fillStyle = INK2;
    g.beginPath(); g.moveTo(14, 94); g.quadraticCurveTo(70, 60, 130, 94); g.closePath(); g.fill();
    g.fillStyle = INK;
    g.fillRect(150, 96, 88, 5);
    g.fillRect(158, 101, 5, 15); g.fillRect(224, 101, 5, 15);
    cardBoat(g, 60, 100, 1.1);
    cardBoat(g, 100, 104, 0.9);
    g.fillStyle = INK;
    g.beginPath(); g.arc(78, 86, 4, 0, Math.PI * 2); g.fill();
    g.fillRect(74, 90, 8, 12);
    g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(74, 96); g.lineTo(60, 100); g.stroke();
    cardGull(g, 180, 40, 1);
  } else if (i === 5){
    cardSea(g, 90);
    g.fillStyle = INK2; g.fillRect(14, 78, 228, 12);
    g.fillStyle = '#7d6545';
    g.beginPath(); g.ellipse(150, 104, 34, 7, 0, 0, Math.PI * 2); g.fill();
    cardTower(g, 150, 100, 18, 30);
    cardBoat(g, 60, 102, 1.0);
    cardGull(g, 80, 36, 1); cardGull(g, 210, 50, 0.9);
  } else if (i === 6){
    cardGround(g, 104);
    g.fillStyle = INK2;
    g.fillRect(16, 74, 48, 30); g.fillRect(190, 78, 48, 26);
    g.fillStyle = '#7a2a2a';
    g.fillRect(74, 88, 44, 4); g.fillRect(74, 92, 3, 12); g.fillRect(115, 92, 3, 12);
    g.fillStyle = '#1a4a7a';
    g.fillRect(128, 90, 44, 4); g.fillRect(128, 94, 3, 10); g.fillRect(169, 94, 3, 10);
    g.fillStyle = '#d8b060';
    g.fillRect(80, 96, 12, 8); g.fillRect(96, 96, 12, 8);
    g.fillStyle = '#8a1a2a';
    g.fillRect(136, 96, 12, 8); g.fillRect(152, 96, 12, 8);
    cardTram(g, 62, 104, 1.0);
  } else {
    g.fillStyle = '#7d6545';
    g.beginPath(); g.moveTo(14, 118); g.quadraticCurveTo(90, 58, 160, 118); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(130, 118); g.quadraticCurveTo(190, 70, 242, 118); g.closePath(); g.fill();
    cardTree(g, 58, 88, 1.1); cardTree(g, 78, 96, 0.9); cardTree(g, 196, 96, 1.0);
    cardSea(g, 104);
    g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(100, 86); g.quadraticCurveTo(150, 74, 210, 88); g.stroke();
    g.beginPath(); g.moveTo(120, 84); g.lineTo(120, 102); g.stroke();
    g.beginPath(); g.moveTo(190, 86); g.lineTo(190, 102); g.stroke();
    cardBoat(g, 220, 106, 0.7);
  }
  g.restore();
}

function drawCard(g, i, title){
  cardPaper(g, title);
  cardScene(g, i);
}

export function buildKartpostal(ctx, env){
  const { THREE, kit } = ctx;
  const store = env.store;

  /* ---------- kayıt durumu ---------- */
  const EMPTY = [];
  function started(){ const s = store.kart; return !!(s && s.basla); }
  function finished(){ const s = store.kart; return !!(s && s.bitti); }
  function foundArr(){ const s = store.kart; return s && Array.isArray(s.bulunan) ? s.bulunan : EMPTY; }
  function isFound(id){ return foundArr().indexOf(id) >= 0; }

  /* ---------- sahaft: İstiklal'in yakınında bir kapı önü ---------- */
  const istiklalDist = (x, z) => {
    const zz = Math.max(-394, Math.min(-122, z));
    return Math.hypot(x + 150, z - zz);
  };
  let sahaf = null, best = 1e9;
  for (let i = 0; i < env.fronts.length; i++){
    const f = env.fronts[i];
    if (f.shop != null) continue;
    if (istiklalDist(f.x, f.z) > 25) continue;
    const d = Math.hypot(f.x + 150, f.z + 290);
    if (d < best){ best = d; sahaf = f; }
  }
  if (!sahaf) sahaf = {x:-143, z:-290, ry:-Math.PI / 2, y:env.Hs(-143, -290)};

  const sry = sahaf.ry;
  const sx = sahaf.x + Math.cos(sry) * 1.0 + Math.sin(sry) * 0.8;
  const sz = sahaf.z - Math.sin(sry) * 1.0 + Math.cos(sry) * 0.8;
  const nx = sahaf.x - Math.cos(sry) * 0.9 + Math.sin(sry) * 0.4;
  const nz = sahaf.z + Math.sin(sry) * 0.9 + Math.cos(sry) * 0.4;
  const sy = env.Hs(sx, sz), ny = env.Hs(nx, nz);

  /* ---------- kartpostal tezgâhı ve SAHAF tabelası ---------- */
  {
    const G = env.reg(sx, sz);
    const sg = new THREE.Group();
    sg.position.set(sx, sy, sz); sg.rotation.y = sry; G.add(sg);
    kit.add(new THREE.BoxGeometry(1.8, 0.08, 0.85), kit.wood, 0, 0.9, 0, sg);
    [-0.75, 0.75].forEach(dx => {
      kit.add(new THREE.BoxGeometry(0.08, 0.9, 0.08), kit.darkWood, dx, 0.45, -0.3, sg);
      kit.add(new THREE.BoxGeometry(0.08, 0.9, 0.08), kit.darkWood, dx, 0.45, 0.3, sg);
    });
    kit.add(new THREE.BoxGeometry(1.6, 0.06, 0.65), kit.darkWood, 0, 0.32, 0, sg);
    kit.add(new THREE.BoxGeometry(1.8, 0.5, 0.06), kit.darkWood, 0, 0.62, -0.42, sg);
    const BOOK = [0x8a1a2a, 0x1a4a7a, 0x2a5a2a, 0xd8b060];
    for (let i = 0; i < 14; i++){
      const bx = -0.7 + (i % 7) * 0.22, bz = -0.2 + Math.floor(i / 7) * 0.28;
      kit.add(new THREE.BoxGeometry(0.18, 0.24, 0.13), kit.mat(BOOK[i % BOOK.length]), bx, 1.06, bz, sg);
    }
    for (let i = 0; i < 6; i++){
      kit.add(new THREE.BoxGeometry(0.22, 0.18, 0.16), kit.mat(BOOK[(i + 2) % BOOK.length]), -0.6 + (i % 3) * 0.25, 0.41, -0.1 + Math.floor(i / 3) * 0.2, sg);
    }
    ctx.C.box(sx, sz, 1.0, 0.5, sry).low = true;

    const bx = sx + Math.cos(sry) * 0.95, bz = sz - Math.sin(sry) * 0.95;
    const by = env.Hs(bx, bz);
    kit.add(new THREE.BoxGeometry(0.06, 1.8, 0.06), kit.darkWood, bx, by + 0.9, bz, G);
    kit.signBoard('SAHAF', bx, by + 1.85, bz, sry, 1.0, G);
    ctx.C.circle(bx, bz, 0.14).low = true;
  }

  const sahafNpc = env.adam({coat:0x4a3a2a, hat:'yok', beard:true});
  env.npcAt(sahafNpc, nx, nz, sry, 'Sahaf Nazım Efendi', sahafAct, ny);
  ctx.marker({id:'sahaf', label:'Sahaf Nazım Efendi', x:nx, z:nz, color:'#c9a24a', show:() => started() && !finished()});

  /* ---------- sekiz kartpostal: yaklaşık noktalar + spiral düzeltme ---------- */
  const spots = [
    [env.LM.galata[0] + 14, env.LM.galata[1] + 14],
    [-100, 172],
    [-34, -30],
    [-136, -398],
    [205, -30],
    [204, 70],
    [330, 262],
    [402, -238]
  ];
  function cardSpot(x0, z0){
    const ok = (x, z) => env.landG(x, z) && !env.occ.has(env.cell(x, z));
    if (ok(x0, z0)) return [x0, z0];
    for (let r = 2; r <= 44; r += 2){
      const n = Math.max(8, Math.ceil(Math.PI * 2 * r / 2));
      for (let k = 0; k < n; k++){
        const a = k / n * Math.PI * 2 + r * 0.37;
        const x = x0 + Math.sin(a) * r, z = z0 + Math.cos(a) * r;
        if (ok(x, z)) return [x, z];
      }
    }
    return [x0, z0];
  }

  const cards = [];
  for (let i = 0; i < CARD_DEFS.length; i++){
    const p = cardSpot(spots[i][0], spots[i][1]);
    const d = CARD_DEFS[i];
    cards.push({id:d.id, title:d.title, semt:d.semt, clue:d.clue, back:d.back, summary:d.summary,
      x:p[0], z:p[1], base:env.Hs(p[0], p[1]), phase:i * 0.9, mesh:null});
  }

  /* ---------- tek atlas: 2 sütun × 4 satır, 512 × 512 ---------- */
  const [ac, ag] = kit.canvas(512, 512);
  const [cc, cg] = kit.canvas(256, 176);
  for (let i = 0; i < cards.length; i++){
    drawCard(cg, i, cards[i].title);
    const col = i % 2, row = (i / 2) | 0;
    ag.drawImage(cc, 0, 0, 256, 176, col * 256, row * 128, 256, 128);
  }
  // arka yüz, ilk kartın başlık bandındaki düz krem noktadan örneklenir
  const BACK_U = 16 / 512, BACK_V = 1 - 158 / 512;

  const atlas = kit.ctex(ac, 1, 1);
  const cardMat = new THREE.MeshStandardMaterial({map:atlas, roughness:0.85, metalness:0,
    emissive:0x2a1e12, emissiveIntensity:0.22});

  function cardGeometry(i){
    const col = i % 2, row = (i / 2) | 0;
    const u0 = col * 0.5, u1 = u0 + 0.5;
    const v1 = 1 - row * 0.25, v0 = v1 - 0.25;
    const front = new THREE.PlaneGeometry(0.5, 0.34);
    const uv = front.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * (u1 - u0), v0 + uv.getY(k) * (v1 - v0));
    const back = new THREE.PlaneGeometry(0.5, 0.34);
    back.rotateY(Math.PI);
    back.translate(0, 0, -0.006);
    const buv = back.attributes.uv;
    for (let k = 0; k < buv.count; k++) buv.setXY(k, BACK_U, BACK_V);
    return env.mergeBufferGeometries([front, back]) || front;
  }

  for (let i = 0; i < cards.length; i++){
    const c = cards[i];
    const m = new THREE.Mesh(cardGeometry(i), cardMat);
    m.position.set(c.x, c.base + 1.1, c.z);
    m.rotation.y = c.phase;
    m.castShadow = false; m.receiveShadow = false;
    env.keep(m);
    ctx.root.add(m);
    c.mesh = m;
  }

  /* ---------- altın halkalar: tek InstancedMesh ---------- */
  const ringGeo = new THREE.RingGeometry(0.26, 0.4, 24);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({color:0xd8b45a, transparent:true, opacity:0.42,
    blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, toneMapped:false});
  const rings = new THREE.InstancedMesh(ringGeo, ringMat, cards.length);
  rings.frustumCulled = false; rings.renderOrder = 3;
  ctx.root.add(rings);

  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();
  function syncVisuals(){
    for (let i = 0; i < cards.length; i++){
      const c = cards[i];
      const on = started() && !isFound(c.id);
      c.mesh.visible = on;
      const sc = on ? 1 : 0;
      m4.compose(p4.set(c.x, c.base + 0.18, c.z), q4.identity(), s4.set(sc, sc, sc));
      rings.setMatrixAt(i, m4);
    }
    rings.instanceMatrix.needsUpdate = true;
  }
  syncVisuals();

  /* ---------- kartpostalı al ---------- */
  async function take(c){
    if (!started() || isFound(c.id)) return;
    ctx.sfx('chime');
    const s = store.kart;
    if (!s) return;
    if (!Array.isArray(s.bulunan)) s.bulunan = [];
    if (s.bulunan.indexOf(c.id) < 0) s.bulunan.push(c.id);
    ctx.save();
    syncVisuals();
    const n = s.bulunan.length;
    await ctx.ui.dialog([{name:c.title, text:c.back}]);
    ctx.ui.toast(n >= cards.length ? 'Bütün kartpostallar sende! İstiklal\'deki Sahaf Nazım Efendi\'ye götür' : 'Kartpostal ' + n + '/' + cards.length, n >= cards.length ? 3600 : 2600);
  }

  for (let i = 0; i < cards.length; i++){
    const c = cards[i];
    ctx.interact(c.x, c.z, 'Kartpostalı al', () => take(c), 1.8, () => started() && !isFound(c.id));
  }

  /* ---------- Sahaf Nazım Efendi'nin diyalogu ---------- */
  const summaryLines = cards.map(c => ({name:c.title, text:c.summary}));
  async function sahafAct(){
    if (!started()){
      const pick = await ctx.ui.dialog([
        {name:'Sahaf Nazım Efendi', text:'Hoş geldin evladım. Dedemin eski İstanbul kartpostalları vardı; tam sekiz taneydi. Geçen günkü fırtınada hepsi pencereden uçtu, şehrin dört bir yanına dağıldı.'},
        {name:'Sahaf Nazım Efendi', text:'Galata\'dan Çamlıca\'ya kadar savrulmuşlar. Onları bulup bana getirir misin? Her birinin arkasında eski bir selam yazıyor.', choices:['Bulurum!', 'Şimdi olmaz']}
      ]);
      if (pick === 0){
        store.kart = {basla:true, bulunan:[]};
        ctx.sfx('quest');
        ctx.save();
        syncVisuals();
        await ctx.ui.dialog([{name:'Sahaf Nazım Efendi', text:'Sağ ol evladım! Sekiz kartpostalın hepsi bu şehirde bir yerde süzülüyor. Yaklaşınca E\'ye basıp alabilirsin. Kolay gelsin!'}]);
      } else {
        await ctx.ui.dialog([{name:'Sahaf Nazım Efendi', text:'Canın sağ olsun. Kapım hep açık; kartpostallar da sabırla bekler.'}]);
      }
      return;
    }

    if (finished()){
      let open = true;
      while (open){
        const pick = await ctx.ui.dialog([{name:'Sahaf Nazım Efendi', text:'Koleksiyonum yine tam. Eski İstanbul\'un sekiz köşesi bir arada. Bir daha bakmak ister misin?', choices:['Kartlara yeniden bakalım', 'Hoşça kal']}]);
        if (pick === 0) await ctx.ui.dialog(summaryLines);
        else open = false;
      }
      return;
    }

    const f = foundArr();
    if (f.length >= cards.length){
      await ctx.ui.dialog([
        {name:'Sahaf Nazım Efendi', text:'Hepsi burada! Sekiz kartpostal, sekiz eski hatıra. Dedemin koleksiyonu yeniden tamamlandı. Sana ne kadar teşekkür etsem az.'},
        {name:'Sahaf Nazım Efendi', text:'Al, bu eski kitap senin olsun; İstanbul\'un sokaklarını anlatıyor. Kartpostalları da camekâna koyacağım, herkes görsün.'}
      ]);
      store.kart.bitti = true;
      ctx.sfx('quest');
      ctx.save();
      ctx.ui.toast('Görev tamamlandı: Eski İstanbul Kartpostalları', 3200);
      return;
    }

    let first = null;
    for (let i = 0; i < cards.length; i++) if (!isFound(cards[i].id)){ first = cards[i]; break; }
    const left = cards.length - f.length;
    await ctx.ui.dialog([
      {name:'Sahaf Nazım Efendi', text:'Şu an ' + f.length + '/' + cards.length + ' kartpostal buldun; ' + left + ' tanesi hâlâ sokaklarda süzülüyor.'},
      {name:'Sahaf Nazım Efendi', text:'Bir ipucu: ' + (first ? first.clue : 'Şehri dolaşmaya devam et.')}
    ]);
  }

  /* ---------- her kare: süzülme ve dönme ---------- */
  ctx.onUpdate((dt, t) => {
    ringMat.opacity = 0.32 + Math.sin(t * 2.2) * 0.1;
    for (let i = 0; i < cards.length; i++){
      const c = cards[i];
      if (!c.mesh.visible) continue;
      c.mesh.rotation.y = c.phase + t * 0.35;
      c.mesh.position.y = c.base + 1.1 + Math.sin(t * 1.1 + c.phase) * 0.06;
    }
  });
}
