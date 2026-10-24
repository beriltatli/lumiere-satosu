// Hútòng Adası: Pekin hutong mahallesi, siheyuan avluları, Tiān Tán, Beş Element Pagodası, Hakka tulou'su,
// Jiangnan su köyü, bambu denizinde bir han, İpek Yolu Pazarı, çeltik terasları ve sisli Zhangjiajie sütunları.
//
// Kod düzeni (hepsi bu klasörde):
//   palette.js  renk tokenları ve Wǔ Xíng elementleri
//   grid.js     yerleşim matrisi: her hücre tek etiket, yapılar önce yer ayırır sonra çizilir
//   hutong.js   hutong ağı ve siheyuan parselleri için plan algoritması (saf veri, adresler dahil)
//   arch.js     kavisli çatılar, siheyuan, tulou, Tiān Tán, pagoda, ay kapısı, paifang, köşk, tezgâh, fenerler
//   water.js    kanal köyü, ay köprüsü, kayık, koi göleti, dilek fenerleri
//   nature.js   bambu, ağaçlar, çeltik terasları, taş sütunlar, sis
//
// Yerleşim sırası önemlidir: anıtlar → su → hutong → yollar → doğa. Matriste önce yer ayıran kazanır.
import { SiteGrid, TAG } from './grid.js';
import { planHutong } from './hutong.js';
import { makeArch } from './arch.js';
import { makeWater } from './water.js';
import { makeNature } from './nature.js';
import { P, WU_XING } from './palette.js';

// Ada planı (metre; x doğu, z güney). İskele güneyde.
const SITE = {
  paifang:{x:0, z:292},
  hutong:{zTop:79, bands:3, xMax:126, zEnd:318},
  plaza:{x0:-18, x1:18, z0:146, z1:174},
  market:{x0:-46, x1:46, z0:22, z1:70},
  tiantan:{x:0, z:-80, wallR:48},
  bamboo:{x:-160, z:-62, r:60},
  inn:{x:-160, z:-72},
  zhang:{x:-60, z:-235, r:78},
  terraces:{x:115, z:-205, R:62},
  pagoda:{x:200, z:-60},
  pond:{x:215, z:30, rx:30, rz:20},
  village:{x0:146, x1:262, z0:96, z1:206},
  tulou:{x:-205, z:125, R:22},
};
const HUTONG_NAMES = [{py:'Dēnglong', tr:'Fener'}, {py:'Zhúzi', tr:'Bambu'}, {py:'Yúchí', tr:'Balık Havuzu'}, {py:'Cháyè', tr:'Çay Yaprağı'}];

export default {
  id:'hutong',
  name:'Hútòng Adası',
  theme:'Pekin sokakları, su köyü ve sisli sütunlar',
  author:'beriltatli',
  description:'Hutongların arasında kaybolmadan adanın simgelerini bul: Tiān Tán, Beş Element Pagodası, tulou, su köyü, bambu hanı ve Zhangjiajie sütunlarındaki Taocu tapınak.',
  order:20,
  seed:88,
  coast:{radius:390, waves:[[3, 12, 0.9], [5, 7, 2.2]], ripple:[[13, 2.5, 0.4], [29, 1, 1.9]], flat:{angle:0, dist:340}},
  terrain:{groundColor:P.ground, sand:P.sand, grass:P.grass, shallow:P.shallow, deep:P.deep, rocks:26},
  harbor:0,
  pierLength:46,

  build(ctx){
    const { THREE, kit, C, root, rnd } = ctx;
    const store = ctx.store;
    store.letter = store.letter || 'yok';           // 'yok' → 'tasiniyor' → 'teslim'
    const grid = new SiteGrid({size:820, cell:2, coast:ctx.coast, margin:25});
    const A = makeArch(ctx), Wt = makeWater(ctx, A, grid), N = makeNature(ctx, A, grid);
    const { M } = A, trees = [];
    const talk = (name, lines) => ctx.ui.dialog(lines.map(text => ({name, text})));
    const toast = (t, ms = 2800) => ctx.ui.toast(t, ms);
    // kit.interact listesine y ile eklemek: sütun tepesindeki etkileşim yerdekiyle karışmasın
    const interactAt = (x, y, z, label, act, r = 2.4, show = () => true) => kit.interact.push({x, y, z, r, label, act, show});
    const strawMat = kit.mat(0xc9ae6a, {roughness:0.85});
    // figür: Lumière'in figür kiti + başlık (hasır şapka ya da takke)
    const person = (x, z, ry, name, opts, act, y = 0) => {
      const g = kit.npc(Object.assign({hat:'yok'}, opts));
      if (opts.straw) kit.add(new THREE.ConeGeometry(0.42, 0.24, 14), strawMat, 0, 2.05, 0, g);
      else if (opts.cap !== false) kit.add(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), kit.mat(opts.capColor || 0x1a1a1e), 0, 1.86, 0, g);
      kit.placeNPC(g, x, z, ry, name, y > 0 ? null : act);
      if (y > 0){ g.position.y = y; interactAt(x, y, z, 'Konuş: ' + name, act, 2.6); }
      return g;
    };

    /* ================= 1. anıtlar matriste yer ayırır ================= */
    const T = SITE.tiantan, Z = SITE.zhang, R = SITE.terraces, PG = SITE.pagoda, PD = SITE.pond, TL = SITE.tulou, MK = SITE.market;
    grid.fill(T.x - T.wallR - 2, T.z - T.wallR - 2, T.x + T.wallR + 2, T.z + T.wallR + 4, TAG.LANDMARK);
    grid.reserveCircle(Z.x, Z.z, Z.r, TAG.LANDMARK, [TAG.FREE, TAG.SEA]);
    grid.reserveCircle(R.x, R.z, R.R * 1.18, TAG.LANDMARK);
    grid.reserveCircle(PG.x, PG.z, 22, TAG.LANDMARK);
    grid.reserveCircle(PD.x, PD.z, PD.rx + 4, TAG.WATER);
    grid.reserveCircle(TL.x, TL.z, TL.R + 6, TAG.LANDMARK);
    grid.reserveCircle(SITE.inn.x, SITE.inn.z + 6, 20, TAG.LANDMARK);
    grid.fill(MK.x0, MK.z0, MK.x1, MK.z1, TAG.PLAZA);

    /* ================= 2. hutong mahallesi ================= */
    const H = SITE.hutong;
    const plan = planHutong(grid, rnd, {xMax:H.xMax, zTop:H.zTop, zEnd:H.zEnd, bands:H.bands, rowDepth:24, hutongW:6, dajieW:12, xiangW:4, lotMin:16, lotMax:26, names:HUTONG_NAMES, plazas:[SITE.plaza]});
    plan.streets.forEach(s => {
      const w = s.x1 - s.x0, d = s.z1 - s.z0; if (w <= 0 || d <= 0) return;
      A.floor(w, d, s.kind === 'xiang' ? M.courtyard : M.paving, (s.x0 + s.x1) / 2, s.kind === 'dajie' ? 0.022 : 0.018, (s.z0 + s.z1) / 2);
    });
    plan.lots.forEach(l => A.siheyuan(l, {trees}));
    // hutong girişlerinde tabela, sokak boyunca asılı fener dizileri
    plan.streets.filter(s => s.kind === 'hutong').forEach(s => {
      kit.signPost(s.tr, s.side * 4.4, s.z0 - 1.6, 0);
      for (let u = 16; u < s.reach - 10; u += 26) A.lanternLine(s.side * u, s.z0 - 0.4, s.side * u, s.z1 + 0.4, 4.8, 3, 0.5, 0.55);
    });
    // ana cadde: iki yanda fener direkleri
    for (let z = H.zTop + 8; z < H.zEnd - 20; z += 16) [-1, 1].forEach(sd => { kit.add(A.box(0.2, 3.4, 0.2), M.vermilion, sd * 5.6, 1.7, z); A.lantern(sd * 5.6, 3.6, z, 0.75, 0); C.circle(sd * 5.6, z, 0.18); });
    A.paifang({x:SITE.paifang.x, z:SITE.paifang.z, text:'胡同', sub:'Hútòng'});
    ctx.place({id:'kapi', name:'Hutong kapısı (牌坊)', x:SITE.paifang.x, z:SITE.paifang.z, r:12});

    /* ---------- ulu akasya meydanı ---------- */
    const PL = SITE.plaza, plc = {x:(PL.x0 + PL.x1) / 2, z:(PL.z0 + PL.z1) / 2};
    A.floor(PL.x1 - PL.x0, PL.z1 - PL.z0, M.courtyard, plc.x, 0.024, plc.z, 0, 3);
    trees.push([plc.x - 9, plc.z - 5, 'hurma'], [plc.x + 10, plc.z + 7, 'hurma']);
    { // 古槐 ulu akasya: kalın gövde, geniş tepe
      kit.add(new THREE.CylinderGeometry(0.7, 1.1, 5.5, 10), kit.mat(0x4a3424, {roughness:0.95}), plc.x - 6, 2.75, plc.z + 4);
      const cr = kit.add(new THREE.IcosahedronGeometry(5.5, 1), kit.mat(0x52722e, {roughness:0.9}), plc.x - 6, 8.2, plc.z + 4); cr.scale.set(1.2, 0.7, 1.1);
      C.circle(plc.x - 6, plc.z + 4, 1.2);
      // dilek kurdeleleri
      for (let i = 0; i < 14; i++){ const a = i / 14 * Math.PI * 2; kit.add(new THREE.PlaneGeometry(0.12, 1.2), A.clothMat(0xc8102e), plc.x - 6 + Math.sin(a) * 3.6, 5.2, plc.z + 4 + Math.cos(a) * 3.6, root, false).rotation.y = a; }
    }
    { // kuyu ve taş satranç masası
      kit.add(A.lathe([[0, 0], [1.0, 0], [1.0, 0.8], [0.8, 0.8], [0.8, 0.05]], 18), M.stone, plc.x + 7, 0, plc.z - 6); C.circle(plc.x + 7, plc.z - 6, 1.05);
      [-1, 1].forEach(sd => kit.add(A.box(0.12, 2.2, 0.12), M.woodDark, plc.x + 7 + sd * 0.9, 1.1, plc.z - 6));
      kit.add(A.box(2.0, 0.12, 0.2), M.woodDark, plc.x + 7, 2.2, plc.z - 6);
      kit.add(new THREE.CylinderGeometry(0.6, 0.5, 0.75, 14), M.stone, plc.x + 4, 0.375, plc.z + 6); C.circle(plc.x + 4, plc.z + 6, 0.6);
      [-1, 1].forEach(sd => kit.add(new THREE.CylinderGeometry(0.25, 0.25, 0.45, 10), M.stone, plc.x + 4 + sd * 1.1, 0.225, plc.z + 6));
    }
    A.lanternLine(PL.x0, plc.z - 8, PL.x1, plc.z - 8, 5.2, 7, 0.9, 0.6);
    A.lanternLine(PL.x0, plc.z + 8, PL.x1, plc.z + 8, 5.2, 7, 0.9, 0.6);
    ctx.place({id:'meydan', name:'Ulu Akasya Meydanı', x:plc.x, z:plc.z, r:14});
    person(plc.x + 2.6, plc.z + 6, -Math.PI / 2, 'Xiàngqí oyuncusu Lǎo Zhào', {coat:0x3a4a5a}, () => talk('Lǎo Zhào', ['Şşş… Çin satrancında fil nehri geçemez. Ben de otuz yıldır bu meydandan dışarı adım atmadım!']));

    /* ---------- mektup görevi: adres sistemiyle labirentte ev bulmak ---------- */
    const pool = plan.lots.filter(l => l.street.k === 2 && l.side < 0 && l.gate === 'N').sort((a, b) => Math.abs(a.door.x) - Math.abs(b.door.x));
    const target = pool[Math.floor(pool.length * 0.6)] || plan.lots[plan.lots.length - 1];
    const LI = {x:plc.x + 3, z:plc.z - 3};
    person(LI.x, LI.z, 0, 'Lǐ Dàye', {coat:0x2a3a5a}, async () => {
      if (store.letter === 'teslim'){ await talk('Lǐ Dàye', ['Méi mektubu almış, yarın çaya gelecekmiş! Hutonglarda kaybolmadın demek, aferin.']); return; }
      if (store.letter === 'tasiniyor'){ await talk('Lǐ Dàye', ['Adres: ' + target.street.name + ' No. ' + target.no + '. Hutongun adı girişteki tabelada, numara kapının yanındaki mavi plakada yazar.']); return; }
      const c = await ctx.ui.dialog([
        {name:'Lǐ Dàye', text:'Hoş geldin yabancı! Hutonglarımız bir labirent gibidir ama aslında bir düzeni var.'},
        {name:'Lǐ Dàye', text:'Her hutong ana caddeden doğuya ve batıya uzanır: batı yanı "Xī", doğu yanı "Dōng". Kuzey yakadaki kapılar tek, güney yakadakiler çift numara alır ve numaralar caddeden uzaklaştıkça büyür.'},
        {name:'Lǐ Dàye', text:'Torunum Xiǎo Méi\'ye bir mektup yazdım ama bacaklarım artık o kadar yürümüyor. Götürür müsün?', choices:['Götürürüm', 'Sonra']},
      ]);
      if (c !== 0) return;
      store.letter = 'tasiniyor'; ctx.sfx('quest'); ctx.save();
      await talk('Lǐ Dàye', ['Adres: ' + target.street.name + ' No. ' + target.no + ' (' + target.street.tr + '). Kapı, avlunun kuzeybatı köşesinde.']);
    });
    {
      const [mx, mz] = target.mainFront;
      person(mx + 2.5, mz + 1.5, Math.PI, 'Xiǎo Méi', {coat:0x8a2a4a, capColor:0x1a1010}, async () => {
        if (store.letter === 'tasiniyor'){
          store.letter = 'teslim'; ctx.sfx('quest'); ctx.save();
          await ctx.ui.dialog([{name:'Xiǎo Méi', text:'Dedemden mi? Bu el yazısını her yerde tanırım!'}, {name:'Xiǎo Méi', text:'Hutongu bulmak kolay, ama doğru kapıyı bulmak ustalık ister. Teşekkürler! İçeri gel, bir çay iç.'}]);
          return;
        }
        await talk('Xiǎo Méi', [store.letter === 'teslim' ? 'Dedeme yarın çaya gideceğimi söyle!' : 'Avlumuza hoş geldin. Kuzeydeki salon dedemin dedesinden kalma.']);
      });
      ctx.room({id:'mei-evi', name:'Méi ailesinin evi', door:{x:mx, z:mz, ry:0}, w:11, d:6.4, h:3.6, floor:'tas', walls:'ahsap', ceiling:'kiris', lamp:'fener', lights:2,
        decor(R2){
          R2.table(0, -0.8, {w:1.8, d:0.9}); R2.chair(-0.9, -0.8, Math.PI / 2); R2.chair(0.9, -0.8, -Math.PI / 2);
          R2.cabinet(-4.4, -2.6, 0); R2.shelf(4.2, 1.2, -2.9, 0); R2.lantern(0, -1); R2.plant(-4.6, 2.2); R2.rug(0, 0.6, 3, 2);
          R2.npc(2.4, -2.2, 0, 'Méi\'nin annesi', ['Hoş geldin! Bu salonun adı 正房: avlunun kuzeyinde durur, güneye bakar, kışın güneşi içeri alır.']);
          R2.note(0, -0.8, 'Masadaki çaya bak', 'Yasemin çayı', 'Pekin\'in hutonglarında misafire önce yasemin çayı ikram edilir.');
        }});
    }
    ctx.marker({id:'mektup', label:target.street.tr, color:'#f3c74c', x:target.street.side * 10, z:(target.street.z0 + target.street.z1) / 2, show:() => store.letter === 'tasiniyor'});
    ctx.marker({id:'li', label:'Lǐ Dàye', color:'#f3c74c', x:LI.x, z:LI.z, minor:true, show:() => store.letter === 'yok'});

    /* ================= 3. İpek Yolu Pazarı (丝绸市场) ================= */
    {
      const zc = (MK.z0 + MK.z1) / 2;
      A.floor(MK.x1 - MK.x0, MK.z1 - MK.z0, M.courtyard, 0, 0.02, zc, 0, 3);
      [-1, 1].forEach(sd => {
        const xi = sd * 8, xo = sd * 46;
        const W2 = (a, b, c2, d2) => A.wall(a, b, c2, d2, {m:M.plaster, cap:M.tileDark, h:3.2});
        W2(xi, MK.z0, xo, MK.z0); W2(xi, MK.z1, xo, MK.z1);
        W2(xi, MK.z0, xi, zc - 6); W2(xi, zc + 6, xi, MK.z1);
        W2(xo, MK.z0, xo, zc - 5); W2(xo, zc + 5, xo, MK.z1);      // dış duvarda geniş açıklık: bambu ve pagoda yolları
        A.moonGate({x:xi, z:zc, rot:Math.PI / 2, len:12, text:sd < 0 ? '丝绸市场' : '瓷灯市'});
        for (let i = 0; i < 6; i++){
          const x = sd * (13 + i * 5.4);
          A.stall({x, z:zc - 9, rot:0, kind:sd < 0 ? 'ipek' : i % 2 ? 'porselen' : 'fener'});
          A.stall({x, z:zc + 9, rot:Math.PI, kind:sd < 0 ? (i % 3 === 2 ? 'porselen' : 'ipek') : i % 2 ? 'fener' : 'porselen'});
        }
        for (let i = 0; i < 3; i++) A.lanternLine(sd * (12 + i * 12), zc - 6, sd * (12 + i * 12), zc + 6, 4.6, 3, 0.4, 0.6);
        A.lanternLine(xi + sd * 1, zc, xo - sd * 1, zc, 5.0, 9, 1.0, 0.6);
      });
      person(-24, zc - 5.6, 0, 'İpekçi Hóng Niáng', {coat:0xa8261d, apron:0xe2a82a}, () => talk('Hóng Niáng', [
        'İpek, dut yaprağıyla beslenen ipek böceklerinin kozasından çekilir; tek bir kozadan bir kilometreye yakın iplik çıkar.',
        'Kırmızı uğurdur, düğünlerde ve yeni yılda giyilir. Altın sarısı ise eskiden yalnız imparatora aitti!',
      ]));
      person(24, zc + 5.6, Math.PI, 'Porselenci Lǎo Chén', {coat:0x1f3f8a}, () => talk('Lǎo Chén', [
        'Mavi-beyaz porselen kobalt boyayla çizilir, sonra 1300 derecede pişirilir. Avrupalılar bu kaba "china" der, bilir misin?',
        'Kervanlar ipeği ve porseleni İpek Yolu\'ndan batıya taşırdı; Lumière\'in salonlarındaki vazolar da belki buradan gitmiştir.',
      ]));
      person(36, zc - 5.6, 0, 'Fenerci Xiǎo Liú', {coat:0x5a2a1a}, () => talk('Xiǎo Liú', ['Bu kırmızı fenerler bambu iskeletli, ipek kaplı. Gece olunca bütün hutong onlarla yanar; Fener Bayramı\'nda gökyüzüne bile uçururuz!']));
      ctx.place({id:'pazar', name:'İpek Yolu Pazarı (丝绸市场)', x:-24, z:zc, r:14});
    }

    /* ================= 4. Tiān Tán ================= */
    const TT = A.tiantan(T);
    { const za = T.z + T.wallR, zb = H.zTop - 3; A.floor(10, zb - za, M.imperialWay, 0, 0.026, (za + zb) / 2); }
    A.floor(8, T.wallR - 31, M.imperialWay, 0, 0.03, T.z + 31 + (T.wallR - 31) / 2);
    ctx.place({id:'tiantan', name:'Tiān Tán: Gök Tapınağı', x:T.x, z:T.z, r:24});
    person(T.x + 6, T.z + T.wallR - 6, Math.PI, 'Tapınak bekçisi Zhōu', {coat:0x2b4f9a}, () => talk('Bekçi Zhōu', [
      'Duvara dikkat et: kuzeyde yuvarlak, güneyde kare. "Gök yuvarlaktır, yer karedir" (天圆地方). İmparator her bahar buraya gelip iyi hasat için dua ederdi.',
      'Salonun 28 sütunu var: içteki 4 sütun dört mevsim, ortadaki 12 sütun on iki ay, dıştaki 12 sütun günün on iki saatidir.',
      'Çatıdaki lacivert kiremit göğün rengidir. Terasa çık, salonun önünde dua edebilirsin.',
    ]));
    interactAt(TT.altar.x, TT.top, TT.altar.z, 'Bereket için dua et', async () => {
      ctx.sfx('gong'); store.dua = (store.dua || 0) + 1; ctx.save();
      toast(store.dua === 1 ? 'Gong sesi göğe yükseliyor. Bu yılın hasadı bereketli olsun!' : 'Gong yeniden çalıyor (' + store.dua + ')', 3200);
    }, 3.2);

    /* ================= 5. Beş Element Pagodası ================= */
    const WX = A.wuxingTa({x:PG.x, z:PG.z, elements:WU_XING});
    {
      const order = [2, 4, 0, 3, 1];          // çember üzerindeki sıra karışık: bulmaca döngüyü bilmeyi ister
      let next = 0;
      const lightUp = n => WX.glows.forEach((g, i) => g.mat.color.copy(i < n ? g.on : new THREE.Color(0x2a2420).convertSRGBToLinear()));
      if (store.wuxing) lightUp(5);
      order.forEach((ei, k) => {
        const a = k / 5 * Math.PI * 2, sx = PG.x + Math.sin(a) * 15, sz = PG.z + Math.cos(a) * 15, el = WU_XING[ei];
        const G = new THREE.Group(); G.position.set(sx, 0, sz); G.rotation.y = a; root.add(G);
        kit.add(A.box(1.6, 0.5, 0.9), M.stone, 0, 0.25, 0, G); kit.add(A.box(1.2, 2.2, 0.32), M.stone, 0, 1.6, 0, G);
        A.putPlaque(el.hanzi + ' · ' + el.name, 0, 1.9, 0.17, 0, 1.0, 0.36, {bg:'#3a3630', fg:'#' + new THREE.Color(el.color).offsetHSL(0, 0, 0.15).getHexString()}, G);
        C.box(sx, sz, 0.8, 0.45, a);
        const [ix, iz] = kit.toWorld(G, 0, 1.3);
        ctx.interact(ix, iz, 'Taşa dokun: ' + el.hanzi + ' (' + el.name + ')', () => {
          if (store.wuxing){ toast('Beş element dengede: ' + WU_XING.map(w => w.hanzi).join(' → ')); return; }
          if (ei === next){
            next++; lightUp(next); ctx.sfx('chime');
            if (next === 5){ store.wuxing = true; ctx.save(); ctx.sfx('gong'); toast('Beş element uyandı! Pagodanın katları sırayla parlıyor.', 3600); }
            else toast(el.name + ' uyandı (' + next + '/5)', 1800);
          } else { next = 0; lightUp(0); ctx.sfx('wrong'); toast('Taşlar sustu. Elementler birbirini doğurur: hangisi hangisini besler?', 3000); }
        }, 2.2);
      });
      person(PG.x - 4, PG.z + 11, Math.PI * 0.9, 'Keşiş Míngxīn', {coat:0xc8862a, cap:false}, () => talk('Keşiş Míngxīn', store.wuxing ? ['Elementler dengede. Unutma: üreten döngünün tersi yıkan döngüdür; su ateşi söndürür, ateş metali eritir…'] : [
        'Bu pagodanın beş katı Wǔ Xíng\'in beş elementidir: alttan üste ağaç, ateş, toprak, metal, su.',
        'Ağaç ateşi besler. Ateş küle, yani toprağa döner. Toprak metali doğurur. Metal soğukta çiy, yani su toplar. Su da ağacı büyütür.',
        'Çevredeki beş taşa bu döngünün sırasıyla dokunursan katlar sırayla uyanır.',
      ]));
      ctx.marker({id:'wuxing', label:'Beş Element taşları', color:'#f3c74c', x:PG.x, z:PG.z, minor:true, show:() => !store.wuxing});
    }
    ctx.place({id:'wuxing', name:'Wǔ Xíng Tǎ: Beş Element Pagodası', x:PG.x, z:PG.z, r:20});

    /* ================= 6. koi göleti ================= */
    const pond = Wt.koiPond({x:PD.x, z:PD.z, rx:PD.rx, rz:PD.rz, isle:6.5, bridge:[[0, 23], [4.25, 18.75], [0, 14.5], [4.25, 10.25], [0, 6]], trees});
    interactAt(pond.pav.x, pond.pav.y, pond.pav.z, 'Koilere yem at', () => { pond.feed(); ctx.sfx('blip'); toast('Koiler köşkün önünde toplanıyor…', 2200); }, 2.6);
    A.moonGate({x:PD.x - 34, z:PD.z + 23, rot:Math.PI / 2, len:14, text:'映月'});
    ctx.place({id:'koi', name:'Koi Yansıma Göleti', x:PD.x, z:PD.z, r:24});

    /* ================= 7. Jiangnan su köyü ================= */
    const VG = SITE.village;
    const village = Wt.canalVillage({x0:VG.x0, x1:VG.x1, z0:VG.z0, z1:VG.z1, deck:1.0, waterY:0.4,
      canals:[{axis:'x', c:150, w:8}, {axis:'z', c:204, w:8}],
      bridges:[{canal:0, at:172}, {canal:0, at:238}, {canal:1, at:120}, {canal:1, at:184}],
      ramps:[{x0:140, x1:146, z0:174, z1:182, dir:'x+'}, {x0:228, x1:236, z0:90, z1:96, dir:'z+'}],
      lanternsAt:[[150, 145.6, 200, 145.6, 3.6], [208.4, 110, 208.4, 145, 3.6]], trees});
    village.canals.forEach((cn, i) => Wt.boat(cn.path, {speed:0.9 + i * 0.3, phase:0.3 + i * 0.4}));
    Wt.boat(village.canals[0].path, {speed:0.7, phase:0.8});
    A.moonGate({x:134, z:178, rot:Math.PI / 2, len:12, m:M.plaster, text:'水乡'});
    person(196, 145, Math.PI / 2, 'Çaycı Sūn Sǎo', {coat:0x2a5a6a, straw:true}, () => talk('Sūn Sǎo', [
      'Wuzhen\'de, Suzhou\'da evler kanala sırtını değil yüzünü döner: kapıdan çıkan basamaklardan doğrudan suya inersin.',
      'Beyaz duvarların ucundaki basamaklı yüksek duvarlara "at başı duvarı" (马头墙) deriz: yangın bir evden ötekine atlamasın diye.',
      'Gece kanala lotus fenerleri bırakılır. Her fener bir dilek taşır; akıntı onları denize götürür.',
    ]), 1.0);
    ctx.place({id:'sukoyu', name:'Jiangnan Su Köyü', x:204, z:150, r:22});

    /* ================= 8. bambu denizi ve Bambu Sisi Hanı (竹林餐馆) ================= */
    const IN = SITE.inn;
    {
      const G = new THREE.Group(); G.position.set(IN.x, 0, IN.z); root.add(G);
      kit.add(A.box(16, 0.4, 11), M.stone, 0, 0.2, 0, G);
      C.heightFns.push((px, pz) => Math.abs(px - IN.x) < 8 && Math.abs(pz - IN.z) < 5.5 ? 0.4 : null);
      kit.add(A.box(14, 3.6, 9), M.wood, 0, 0.4 + 1.8, 0, G);
      kit.add(A.scaleUV(new THREE.PlaneGeometry(12, 3.0), 8, 1), M.paper, 0, 0.4 + 1.6, 4.53, G, false);
      for (let i = 0; i <= 6; i++) kit.add(A.colGeo(0.16, 3.6), M.vermilion, -6.8 + i * 13.6 / 6, 2.2, 4.8, G);
      kit.add(A.box(15, 0.35, 10), M.bandD, 0, 4.2, 0, G, false);
      A.putHip(G, {type:'rect', W:17.6, D:12.4}, 2.6, 4.3, M.tileDark, {lift:0.9, tMax:0.36, fascia:0.25});
      kit.add(A.box(11, 2.8, 6.4), M.wood, 0, 5.4 + 1.4, 0, G);
      kit.add(A.scaleUV(new THREE.PlaneGeometry(9.6, 2.2), 6, 1), M.paper, 0, 5.4 + 1.3, 3.23, G, false);
      kit.add(A.box(12.2, 0.08, 0.08), M.vermilion, 0, 6.4, 3.9, G);
      for (let i = 0; i <= 24; i++) kit.add(A.box(0.06, 0.9, 0.06), M.vermilion, -6 + i * 0.5, 5.95, 3.9, G);
      A.putHip(G, {type:'rect', W:14.4, D:9.6}, 3.0, 8.2, M.tileDark, {lift:1.0});
      A.putPlaque('竹林餐馆', 0, 3.4, 4.9, 0, 3.4, 0.85, {bg:'#1a120c', fg:'#e8c15a'}, G);
      A.putPlaque('Bambu Sisi Hanı', 0, 7.6, 3.24, 0, 3.2, 0.5, {bg:'#7a1a14', fg:'#f2e3c0'}, G);
      C.box(IN.x, IN.z, 7.2, 4.7);
      for (let i = 0; i < 8; i++){ A.lantern(IN.x - 7.2 + i * 14.4 / 7, 4.0, IN.z + 5.4, 0.75, 0.4); A.lantern(IN.x - 5.4 + i * 10.8 / 7, 7.9, IN.z + 3.9, 0.6, null); }
      // ön verandada masalar, bambuya gerilmiş fener ipleri
      for (let i = 0; i < 4; i++){
        const tx = IN.x - 6 + i * 4, tz = IN.z + 9;
        kit.add(new THREE.CylinderGeometry(0.75, 0.75, 0.08, 16), M.wood, tx, 0.78, tz); kit.add(new THREE.CylinderGeometry(0.12, 0.2, 0.74, 8), M.woodDark, tx, 0.37, tz); C.circle(tx, tz, 0.8);
        [0, 2.1, 4.2].forEach(a => kit.add(new THREE.CylinderGeometry(0.22, 0.22, 0.45, 10), M.wood, tx + Math.sin(a) * 1.1, 0.225, tz + Math.cos(a) * 1.1));
        kit.add(A.lathe([[0, 0], [0.09, 0], [0.12, 0.08], [0.07, 0.16], [0.05, 0.2]], 10), M.porcelain, tx, 0.82, tz);
      }
      [[-8.5, 13], [8.5, 13]].forEach(([dx, dz]) => { kit.add(A.box(0.16, 5, 0.16), M.woodDark, IN.x + dx, 2.5, IN.z + dz); C.circle(IN.x + dx, IN.z + dz, 0.15); });
      A.lanternLine(IN.x - 8.5, IN.z + 13, IN.x + 8.5, IN.z + 13, 4.9, 8, 1.0, 0.55);
      A.lanternLine(IN.x - 8.5, IN.z + 13, IN.x - 7, IN.z + 5.2, 4.9, 3, 0.4, 0.5);
      A.lanternLine(IN.x + 8.5, IN.z + 13, IN.x + 7, IN.z + 5.2, 4.9, 3, 0.4, 0.5);
      A.moonGate({x:IN.x, z:IN.z + 17, len:16, text:'竹林'});
      person(IN.x + 3, IN.z + 6.4, 0, 'Hancı Zhú Ā Mā', {coat:0x3f6a3a, apron:true}, () => talk('Zhú Ā Mā', [
        'Bambu Sisi Hanı\'na hoş geldin! Sabahları sis bambuların arasından süzülür, akşamları fenerlerimiz yanar.',
        'Şair Sū Shì demiş ki: "Etsiz yaşanır, bambusuz yaşanmaz" (宁可食无肉，不可居无竹). İçeri gir, aşçımız bambu filizi çorbası yaptı.',
      ]));
      ctx.room({id:'han', name:'Bambu Sisi Hanı', door:{x:IN.x, z:IN.z + 6.1, ry:0}, w:13, d:8, h:3.6, floor:'ahsap', walls:'shoji', ceiling:'kiris', lamp:'fener', lights:2,
        decor(R2){
          [[-4, -1.2], [0, -1.2], [4, -1.2], [-4, 1.8], [4, 1.8]].forEach(([x, z]) => { R2.table(x, z, {round:true, w:1.3}); R2.chair(x - 1.0, z, Math.PI / 2); R2.chair(x + 1.0, z, -Math.PI / 2); });
          R2.counter(0, -3.4, {w:4.5}); R2.lantern(-3, -1); R2.lantern(3, -1, {light:false}); R2.lantern(0, 1.6, {light:false}); R2.plant(-6, 3.2); R2.plant(6, 3.2);
          R2.npc(0, -3.9, 0, 'Aşçı Lǎo Wáng', ['Bugün menüde: bambu filizi çorbası, buharda jiaozi (餃子) ve yasemin çayı.', 'Bambu filizi ilkbaharda topraktan çıkar çıkmaz toplanır; bir gecede yarım metre uzayabilir!']);
          R2.interact(0, -2.6, 'Bambu filizi çorbası iç', () => { ctx.sfx('coin'); toast('Sıcak çorba içini ısıttı. Bambu filizinin tadı taze ve hafif tatlı.', 3000); });
        }});
      ctx.place({id:'han', name:'Bambu Sisi Hanı (竹林餐馆)', x:IN.x, z:IN.z + 8, r:14});
    }
    const bambooPath = [[-46, 40], [-80, 24], [-104, 6], [-124, -14], [-146, -34], [-160, -46], [-182, -50], [-200, -74], [-206, -100]];
    N.bambooSea({x:SITE.bamboo.x, z:SITE.bamboo.z, r:SITE.bamboo.r, path:bambooPath, clear:[{x:IN.x, z:IN.z + 6, r:19}], n:1500});
    ctx.place({id:'zhuhai', name:'Zhú Hǎi: Bambu Denizi', x:-128, z:-24, r:16});

    /* ================= 9. tulou ================= */
    const TU = A.tulou({x:TL.x, z:TL.z, R:TL.R, gateA:Math.PI / 2});
    person(TL.x + 4.5, TL.z + 3, Math.PI / 2, 'Zhāng Pópo', {coat:0x2a2a4a}, () => talk('Zhāng Pópo', [
      'Biz Hakka\'yız, "konuk halk" demektir: atalarımız kuzeyden güneye göçtü. Yabancı topraklarda korunmak için evlerimizi kale gibi yaptık.',
      'Bu tulou\'nun duvarı toprak, kireç ve pirinç lapasıyla sıkıştırılmış; bir buçuk metre kalınlığında. Dört katında seksen aile yaşardı.',
      'Ortadaki salon atalarımızındır. Bir tütsü yakmak istersen orada.',
    ]));
    ctx.interact(TU.hall[0], TU.hall[1], 'Ata salonunda tütsü yak', () => { ctx.sfx('bell'); toast('Tütsünün dumanı galerilere doğru yükseliyor.', 2600); }, 2.4);
    ctx.place({id:'tulou', name:'Hakka Tulou\'su (土楼)', x:TL.x, z:TL.z, r:14});

    /* ================= 10. çeltik terasları ================= */
    const RT = N.riceTerraces({x:R.x, z:R.z, R:R.R, N:13, step:0.5});
    A.house({x:R.x, z:R.z - 1, w:6, d:4.6, h:3.0, y:RT.top.y, style:'wood', plinth:0.3, cols:false});
    person(R.x + 2.8, R.z + 3.6, 0, 'Çiftçi Yáo Bó', {coat:0x1f2a4a, straw:true}, () => talk('Yáo Bó', [
      'Lóngjǐ, "ejderhanın sırtı" demek. Atalarımız dağı yedi yüz yıl boyunca basamak basamak oydu.',
      'Baharda tarlalar suyla dolar: o zaman her teras bir ayna olur, gökyüzünü yansıtır. Yazın yeşil, güzün altın sarısı…',
      'Su en tepedeki tarladan aşağıya, bir terastan ötekine akar. Hiçbir damla boşa gitmez.',
    ]), RT.top.y);
    ctx.place({id:'teras', name:'Lóngjǐ Çeltik Terasları', x:R.x, z:R.z, r:22});

    /* ================= 11. Zhangjiajie sütunları ve Taocu tapınak ================= */
    {
      const PA = N.pillar(Z.x, Z.z, 13, 30, {walk:true, amp:0.4});
      const PB = N.pillar(Z.x + 38, Z.z - 33, 9, 36, {walk:true, amp:0.5});
      const PC = N.pillar(Z.x - 38, Z.z - 31, 8, 27, {walk:true, amp:0.5});
      const stair = N.spiralStair(PA, {a0:0, turns:1.3});
      N.ropeBridge(PA, PB, {sag:2.2}); N.ropeBridge(PA, PC, {sag:1.8});
      // diğer sütunlar: merdivene, köprülere ve birbirine yer bırakarak
      const placed = [PA, PB, PC];
      for (let k = 0; k < 400 && placed.length < 20; k++){
        const a = rnd() * Math.PI * 2, rr = 20 + rnd() * (Z.r - 26), px = Z.x + Math.sin(a) * rr, pz = Z.z + Math.cos(a) * rr, r = 5 + rnd() * 6;
        const segD = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - a.x - dx * t, pz - a.z - dz * t); };
        if (ctx.coast.dist(px, pz) > -20 || placed.some(p => Math.hypot(p.x - px, p.z - pz) < p.r * 1.5 + r * 1.5 + 8) || Math.abs(px - Z.x) < 9 && pz > Z.z) continue;
        if (segD(PA, PB) < r * 1.5 + 3 || segD(PA, PC) < r * 1.5 + 3) continue;
        placed.push(N.pillar(px, pz, r, 38 + rnd() * 34));
      }
      // denizden yükselen sütunlar
      for (let k = 0; k < 9; k++){ const a = Math.PI + (k - 4) * 0.12, [px, pz] = ctx.coast.point(a, 40 + (k % 3) * 35); N.pillar(px, pz, 6 + rnd() * 7, 45 + rnd() * 40, {inSea:true}); }
      // Taocu tapınak: 紫霄宫 (Mor Bulut Sarayı), kırmızı duvar, yeşil sırlı kiremit
      const top = PA.h + 0.15, G = new THREE.Group(); G.position.set(Z.x, top, Z.z - 3); root.add(G);
      kit.add(A.box(10, 0.4, 7), M.stone, 0, 0.2, 0, G);
      kit.add(A.box(8.4, 3.4, 5.6), M.vermilion, 0, 0.4 + 1.7, 0, G);
      kit.add(A.scaleUV(new THREE.PlaneGeometry(6.8, 2.8), 5, 1), M.paper, 0, 0.4 + 1.5, 2.83, G, false);
      kit.add(A.box(9, 0.3, 6.2), M.bandD, 0, 3.95, 0, G, false);
      A.putHip(G, {type:'rect', W:11.6, D:8.6}, 2.6, 4.0, M.tileGreen, {lift:1.0});
      A.putPlaque('紫霄宫', 0, 4.3, 3.6, 0, 2.6, 0.7, {bg:'#1d3a2e', fg:'#e8c15a'}, G);
      const tc = C.box(Z.x, Z.z - 3, 4.6, 3.2); tc.y0 = top - 0.5; tc.y1 = top + 8;
      // yin-yang taşı: tapınağın önünde
      const taiji = A.tex(256, 256, g => {
        g.fillStyle = '#8e8b83'; g.fillRect(0, 0, 256, 256); const c = 128, r = 120;
        g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(c, c, r, -Math.PI / 2, Math.PI / 2); g.fill();
        g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(c, c, r, Math.PI / 2, Math.PI * 1.5); g.fill();
        g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(c, c + r / 2, r / 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(c, c - r / 2, r / 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(c, c + r / 2, r / 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(c, c - r / 2, r / 7, 0, Math.PI * 2); g.fill();
      });
      const td = kit.add(new THREE.CircleGeometry(2.6, 40), kit.mat(0xffffff, {map:taiji, roughness:0.6}), Z.x, top + 0.03, Z.z + 5, root, false); td.rotation.x = -Math.PI / 2;
      kit.add(A.lathe([[0, 0], [0.5, 0], [0.4, 0.3], [0.8, 0.8], [0.85, 1.2], [0.6, 1.3]], 16), M.bronze, Z.x - 4.5, top, Z.z + 4.5);
      const bc = C.circle(Z.x - 4.5, Z.z + 4.5, 0.9); bc.y0 = top - 0.5; bc.y1 = top + 4;
      [-1, 1].forEach(sd => A.lantern(Z.x + sd * 4.6, top + 3.1, Z.z, 0.7, top));
      person(Z.x + 3, Z.z + 3.5, 0, 'Taocu rahip Qīngxū', {coat:0x2a3a5a, capColor:0x1a1a2a}, () => talk('Qīngxū Dàozhǎng', [
        'Tao, yol demektir. Su gibi ol: yumuşaktır ama taşı oyar. Bu sütunları da milyonlarca yıl boyunca su ve rüzgâr oydu.',
        'Atalarımız göğe yakın olmak için tapınaklarını en yüksek kayalara kurdu. Sis yükselince sanki bulutların üstünde yüzeriz.',
        'Asma köprülerden komşu sütunlara geçebilirsin; birinde münzevi Yún yaşar.',
      ]), top);
      A.pavilion({x:PB.x, z:PB.z, y:PB.h + 0.15, n:6, r:2.6, h:2.8, roofMat:M.tileDark, base:0.3});
      person(PB.x + 1.2, PB.z + 3.4, 0, 'Münzevi Yún', {coat:0xd8d2c0, cap:false}, () => talk('Münzevi Yún', [
        'Kırk yıldır bu kayanın üstündeyim. Bulutlar sabah gelir, akşam gider; ben kalırım.',
        'Aşağıdaki dünya gürültülüdür. Burada yalnız rüzgâr ve çam ağaçları konuşur. Dinle…',
      ]), PB.h + 0.15);
      { const g = new THREE.Group(); g.position.set(PC.x, PC.h + 0.15, PC.z); root.add(g); kit.add(A.box(2.6, 2.2, 2.0), M.wood, 0, 1.1, 0, g); A.putHip(g, {type:'rect', W:3.8, D:3.2}, 1.2, 2.2, M.tileGreen, {lift:0.5}); const o = C.box(PC.x, PC.z, 1.4, 1.1); o.y0 = PC.h - 0.5; o.y1 = PC.h + 4; A.lantern(PC.x, PC.h + 2.0, PC.z + 1.4, 0.6, PC.h + 0.15); }
      interactAt(PC.x, PC.h + 0.15, PC.z + 2.2, 'Küçük sunağa tütsü bırak', () => { ctx.sfx('chime'); toast('Tütsü sise karışıyor. Aşağıda bambular rüzgârda dalgalanıyor.', 2800); }, 2.2);
      N.mist({x:Z.x, z:Z.z - 10, r:100, layers:[11, 19], puffs:36});
      N.finishPines();
      ctx.place({id:'zhangjiajie', name:'Zhangjiajie Taş Sütunları', x:stair.start[0], z:stair.start[2], r:16});
      ctx.place({id:'tapinak', name:'Zǐxiāo Gōng: Taocu tapınak', x:Z.x, z:Z.z - 3, r:8});
      ctx.marker({id:'merdiven', label:'Sütun merdiveni', color:'#d4af37', x:stair.start[0], z:stair.start[2], minor:true});
    }

    /* ================= 12. yollar ================= */
    function road(pts, w = 4, m = M.courtyard){
      pts.forEach((a, i) => {
        const b = pts[i + 1]; if (!b) return;
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        A.floor(w, l + w * 0.6, m, (a[0] + b[0]) / 2, 0.016, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1]), 3);
        for (let t = 0; t <= l; t += 2) grid.paint(a[0] + (b[0] - a[0]) * t / l - w / 2, a[1] + (b[1] - a[1]) * t / l - w / 2, a[0] + (b[0] - a[0]) * t / l + w / 2, a[1] + (b[1] - a[1]) * t / l + w / 2, TAG.STREET, [TAG.FREE, TAG.NATURE]);
      });
    }
    road([[-H.xMax, H.zTop + 54], [-150, 128], [TL.x + TL.R + 4, TL.z]]);
    road([[-5, -26], [-62, -26], [-66, -90], [-66, -160], [Z.x, Z.z + 26]]);
    road([[5, -26], [62, -26], [70, -100], [100, -138]]);
    road([[46, 46], [120, 22], [180, -36]]);
    road([[120, 22], [175, 53], [PD.x, PD.z + 23]]);
    road([[PD.x, PD.z + 23], [232, 70], [232, 90]]);
    road([[H.xMax, H.zTop + 108], [134, 178], [140, 178]]);
    road([[-6, 318], [-6, 300]], 2);

    /* ================= 13. ağaçlar ve ışıklar ================= */
    for (let k = 0; k < 4000 && trees.length < 420; k++){
      const x = (rnd() - 0.5) * 720, z = (rnd() - 0.5) * 720;
      if (grid.get(x, z) !== TAG.FREE || ctx.coast.dist(x, z) > -30) continue;
      const nearWater = Math.hypot(x - PD.x, z - PD.z) < 60;
      trees.push([x, z, nearWater ? (rnd() < 0.6 ? 'sogut' : 'erik') : rnd() < 0.55 ? 'cam' : rnd() < 0.5 ? 'erik' : 'hurma']);
      grid.paint(x - 3, z - 3, x + 3, z + 3, TAG.NATURE);
    }
    N.trees(trees);
    Wt.riverLanterns(80);
    const lan = A.finishLanterns();
    const glow = [[plc.x, 6, plc.z], [IN.x, 5, IN.z + 8], [204, 7, 150], [TL.x, 7, TL.z]].map(([x, y, z]) => { const l = new THREE.PointLight(0xff8a4a, 0, 30, 2); l.position.set(x, y, z); root.add(l); return l; });

    return {
      update(dt, t){
        const night = ctx.W.night;
        lan.update(night);
        glow.forEach(l => { l.intensity = night * 5; });
        Wt.update(dt, t); N.update(dt, t);
      },
    };
  },
};
