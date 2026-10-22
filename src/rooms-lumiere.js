// Lumière adasındaki binaların içleri. Kapı noktaları court.js, royal.js ve estate.js'ten (doors) gelir.
// Yerel koordinatlar: oda merkezi (0, 0); giriş kapısı +z duvarında, arka duvar -z.
// Yön: ry = 0 arka duvara dayalı (+z'ye bakar), π/2 sol duvara (+x'e bakar), -π/2 sağ duvara.

export function addLumiereRooms(rooms, doors, hooks){
  const say = (name, text) => hooks.ui.dialog([{name, text}]);
  const add = (id, door, spec) => { if (door) rooms.add(Object.assign({id, owner:'lumiere', door}, spec)); };
  const side = (len, n) => Array.from({length:n}, (_, i) => -len / 2 + (i + 0.5) * len / n);

  /* ---------- Saray Operası ---------- */
  add('opera', doors.opera, {name:'Saray Operası', w:22, d:28, h:12, floor:'parke', walls:'saray', wallColor:0x7a1a2a, ceiling:'boyali', windows:false, lights:2, curtain:0x8a1020,
    decor(R, r){
      const {w, d} = r;
      R.stage(-d / 2 + 3, 14, 6, {curtain:0x8a1020});
      R.seats(0, -4, 8, 12, {ry:Math.PI, gap:0.75, rowGap:1.0});
      R.rug(0, 9, 3, 8, {c1:'#7a1020', c2:'#d8b45a', c3:'#5a0a18'});
      // yan localar: iki kat, altın korkuluklu
      [-1, 1].forEach(sd => [4.2, 7.4].forEach(y => side(18, 3).forEach(z => {
        const x = sd * (w / 2 - 1.1);
        R.box(2.0, 0.2, 2.6, R.mat(0x5a0a18), x, y, z - 2); R.box(0.12, 0.9, 2.6, R.gold, x - sd * 1.0, y + 0.5, z - 2);
        R.box(0.08, 0.7, 2.4, R.mat(0x8a1a2a, {roughness:0.85}), x - sd * 1.0, y + 0.45, z - 2);
        R.sconce(sd * (w / 2 - 0.02), y + 1.4, z - 2, -sd * Math.PI / 2);
      })));
      // orkestra çukuru ve klavsen
      R.box(10, 0.5, 2, R.darkWood, 0, 0.25, -6.6); R.collide(0, -6.6, 5, 1);
      R.box(1.6, 0.25, 0.8, R.mat(0x1a120c, {roughness:0.3}), 4, 0.95, -6.6); R.box(1.5, 0.06, 0.25, R.linen, 4, 1.1, -6.3);
      [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].forEach(([a, b]) => R.box(0.05, 0.36, 0.05, R.mat(0x1a120c), 4 + a, 0.68, -6.6 + b));
      R.interact(4, -5.0, 'Klavseni çal', () => hooks.playHarpsichord && hooks.playHarpsichord());
      const sop = R.npc(5.6, -9.0, 0.6, 'Soprano Mlle Fleury', ['Bu akşam Orphée\'de Eurydice\'i söylüyorum. Prova arası, ama siz sahneye kadar geldiniz, hoş geldiniz!', 'Sahnenin ardındaki orman dekoru Venedikli bir ressamın işi. Kubbeye boyanan gökyüzünü fark ettiniz mi? Gece mumlar yanınca bulutlar kıpırdıyor sanırsınız.'], {coat:0xd8b4e2, hat:false});
      sop.position.y = 1.0;
      R.note(-6, 10, 'Afişi oku', 'Afiş', ['"Orphée aux Enfers" · Bu akşam saat sekizde · Soprano Mlle Fleury, orkestra şefi Maestro Valentin.', 'Altta küçük harflerle: Localar kontesin misafirlerine ayrılmıştır.']);
    }});

  /* ---------- Kütüphane ve arşiv ---------- */
  add('kutuphane', doors.kutuphane, {name:'Saray Kütüphanesi', w:22, d:26, h:10, floor:'parke', walls:'saray', wallColor:0x2a4a3a, ceiling:'boyali', curtain:0x1a3a2a,
    skipWindow:(x, z) => Math.abs(x) > 10 || (z < -12 && Math.abs(x) < 3),
    decor(R, r){
      const {w, d} = r;
      // iki katlı raflar: altta zeminde, üstte galeride
      [-1, 1].forEach(sd => side(d - 4, 8).forEach(z => {
        R.bookcase(sd * (w / 2 - 0.25), z - 1, sd > 0 ? -Math.PI / 2 : Math.PI / 2, {w:2.4, h:3.6});
        const up = R.bookcase(sd * (w / 2 - 0.25), z - 1, sd > 0 ? -Math.PI / 2 : Math.PI / 2, {w:2.4, h:3.4}); up.position.y = 4.3;
      }));
      [-1, 1].forEach(sd => { R.box(1.4, 0.2, d - 2, R.darkWood, sd * (w / 2 - 0.7), 4.2, -1); R.box(0.06, 0.9, d - 2, R.gold, sd * (w / 2 - 1.4), 4.75, -1); for (let i = 0; i < 18; i++) R.box(0.04, 0.9, 0.04, R.gold, sd * (w / 2 - 1.4), 4.75, -d / 2 + 1 + i * (d - 2) / 17); });
      // sürgülü merdiven
      [-1, 1].forEach(sd => { const x = sd * (w / 2 - 1.0); R.box(0.06, 4.2, 0.06, R.wood, x, 2.1, -2.3); R.box(0.06, 4.2, 0.06, R.wood, x, 2.1, -1.7); for (let i = 0; i < 12; i++) R.box(0.05, 0.04, 0.6, R.wood, x, 0.3 + i * 0.33, -2); });
      // okuma masaları
      [-5, 0, 5].forEach((z, i) => { R.dining(0, z - 2, {w:5, d:1.3, cloth:R.mat(0x2a4a3a, {roughness:0.9}), seat:R.mat(0x2a4a3a, {roughness:0.85}), place:false}); R.box(0.4, 0.05, 0.3, R.linen, -1.2, 0.83, z - 2); R.box(0.4, 0.05, 0.3, R.linen, 1.4, 0.83, z - 2.2).rotation.y = 0.3; });
      R.globe(-5, 6); R.globe(5, 6);
      R.fireplace(0, -d / 2 + 0.35, 0, {w:2.4});
      R.painting(0, 4.5, -d / 2 + 0.05, 0, 1.6, 2.0, 'portre', 4);
      R.rug(0, -2, 8, 16, {c1:'#1a3a2a', c2:'#d8b45a', c3:'#2a1a12'});
      R.npc(-4, 8, Math.PI * 0.8, 'Kütüphaneci Sœur Agathe', () => [
        'Fısıldayın lütfen. Üst galerideki ciltlere merdivenle ulaşılır ama izin almadan çıkmayın!',
        hooks.getS && hooks.getS().notes.secret ? 'Kırmızı ciltli kitabı siz mi çektiniz? Raf hâlâ biraz yamuk duruyor… Kimseye söylemem.' : 'Kapının yanındaki raflarda eski bir harita kitabı vardı. Bazen biri onu çekip yerine koyuyor, garip şey.',
      ], {coat:0x1a1a1a, hat:false});
      R.note(2.2, -2, 'Kroniği oku', 'Lumière Kroniği, 1712', ['"Kılıç tapınağa konduğunda beş rün dört bir yana saklandı: biri suyun dibine, biri kulenin başına, biri yolların kaybolduğu yere…"', '"…biri sorulara cevap verene, sonuncusu da yalnız ayın açtığı kapının ardına."']);
    }});

  /* ---------- Rasathane harita odası ---------- */
  add('rasathane', doors.rasathane, {name:'Rasathanenin harita odası', w:8, d:8, h:5.2, floor:'parke', walls:'alci', wallColor:0x1a2a4a, ceiling:'boyali', curtain:0x1a2a4a, lights:1,
    skipWindow:(x, z) => x < -3.5 && z > 0,
    decor(R, r){
      const [c, g] = (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320; return [cv, cv.getContext('2d')]; })();
      g.fillStyle = '#e8dcb8'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#7a5a3a'; g.lineWidth = 2;
      for (let i = 0; i < 12; i++){ g.beginPath(); g.moveTo(0, i * 28); g.lineTo(512, i * 28); g.stroke(); g.beginPath(); g.moveTo(i * 46, 0); g.lineTo(i * 46, 320); g.stroke(); }
      g.fillStyle = '#5a7a4a'; [[140, 150, 90, 60], [330, 120, 70, 90], [250, 240, 60, 30]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.4, 0, 7); g.fill(); });
      g.fillStyle = '#c8102e'; g.font = 'bold 22px Georgia'; g.fillText('Lumière', 120, 155); g.fillText('✶', 330, 125);
      const tex = new R.THREE.CanvasTexture(c); tex.encoding = R.THREE.sRGBEncoding;
      R.table(0, -0.6, {w:2.4, d:1.5});
      R.add(new R.THREE.PlaneGeometry(2.2, 1.35), new R.THREE.MeshStandardMaterial({map:tex, roughness:0.8}), 0, 0.82, -0.6, false).rotation.x = -Math.PI / 2;
      R.candles(-0.9, 0.81, -1.1);
      // pirinç teleskop ve üç ayak
      [0, 2.1, 4.2].forEach(a => { const l = R.cyl(0.025, 0.03, 1.4, R.darkWood, 2.4 + Math.cos(a) * 0.3, 0.68, -2 + Math.sin(a) * 0.3, 6); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); });
      const tel = R.cyl(0.08, 0.12, 1.4, R.brass, 2.4, 1.5, -2, 14); tel.rotation.set(0.9, 0, 0.3); R.collideC(2.4, -2, 0.45);
      R.globe(-2.6, -2.2);
      R.bookcase(-3.75, 1.6, Math.PI / 2, {w:2.0, h:2.6});
      R.painting(0, 2.8, -3.95, 0, 1.4, 1.0, 'deniz', 7);
      R.note(0, 0.4, 'Haritaya bak', 'Haritacının notu', ['Adanın güneyinde iskele, iskelenin ucunda "La Belle Étoile" yazıyor. Kenara düşülmüş not: "Kaptan, yeni adaların haritaları geldikçe sefer açacak."', 'Haritanın kenarında doğuya doğru çizilmiş, adı henüz yazılmamış bir ada silueti var.']);
    }});

  /* ---------- Şahin evi ---------- */
  add('sahin', doors.sahin, {name:'Şahin evi (Fauconnerie)', w:18, d:8, h:4.6, floor:'toprak', walls:'ahsap', ceiling:'kiris', doorStyle:'rustik', curtain:0, lights:2,
    decor(R, r){
      side(16, 6).forEach((x, i) => R.perch(x, -2.6, {hooded:i % 2 === 0}));
      R.table(-5, 1.4, {w:2.2, d:0.9}); [-5.6, -4.8, -4.0].forEach((x, i) => R.box(0.14, 0.3, 0.1, R.mat(0x6a3a1a), x, 0.95, 1.4).rotation.y = i * 0.4);
      R.hay(6.5, 1.6, 0.9); R.barrel(4.6, 2.4, {s:0.7}); R.crate(7.2, -0.2, 0.6, 0.3);
      R.shelf(-8.85, 2.0, 0, Math.PI / 2, 2.4, 'pots');
      R.note(-5, 2.4, 'Eldivenlere bak', 'Şahinci defteri', ['"Mistral: gökdoğan, dişi, üç yaşında. Sabah tur atar, öğleden sonra uyur."', '"Başlık takılan kuş sakinleşir. Başlığı yalnız uçuştan önce çıkar."']);
    }});

  /* ---------- Hamam ---------- */
  add('hamam', doors.hamam, {name:'Mermer hamam', w:16, d:12, h:9, floor:'mozaik', walls:'mermer', ceiling:'tonoz', curtain:0, lights:2,
    decor(R, r){
      R.pool(0, -1, 8, 5, {color:0x4ab0b0});
      [[-5.5, -4], [5.5, -4], [-5.5, 2.2], [5.5, 2.2]].forEach(([x, z]) => { R.cyl(0.35, 0.4, 5.2, R.mat(0xf2ede4, {roughness:0.3}), x, 2.6, z, 18); R.cyl(0.55, 0.45, 0.35, R.gold, x, 5.3, z, 18); R.collideC(x, z, 0.5); });
      [-1, 1].forEach(sd => { R.bench(sd * 7.2, -1, 4, Math.PI / 2, R.mat(0xe8e2d6, {roughness:0.3})); R.box(0.6, 0.05, 1.2, R.linen, sd * 7.2, 0.52, -2.5); });
      R.plant(-6.5, 4.2, {s:1.1}); R.plant(6.5, 4.2, {s:1.1});
      R.interact(0, 2.6, 'Sıcak suya gir', () => { hooks.ui.toast('Ilık su ve okaliptüs kokusu… Dinlendin ♨', 2600); hooks.sfx && hooks.sfx('quest'); });
    }});

  /* ---------- Saray mutfağı ---------- */
  add('mutfak', doors.mutfak, {name:'Saray mutfağı', w:18, d:10, h:6, floor:'tas', walls:'tugla', ceiling:'kiris', doorStyle:'rustik', curtain:0, lights:2,
    skipWindow:(x, z) => (z < -4.5 && Math.abs(x) < 2.5) || (Math.abs(x) > 8.5 && z < 0),
    decor(R, r){
      R.fireplace(0, -4.65, 0, {w:3.2, rustic:true});
      const pot = R.add(new R.THREE.SphereGeometry(0.45, 16, 12), R.iron, 0, 0.7, -4.4); pot.scale.y = 0.8;
      R.table(0, 0, {w:6, d:1.4, top:R.mat(0x9a7a52, {roughness:0.85})});
      [[-2, 0.1, 0xc8302a], [-1.6, -0.2, 0xff8a1a], [1.2, 0.3, 0x5a8a2a], [1.6, -0.1, 0xe8b030]].forEach(([x, z, c]) => R.add(new R.THREE.SphereGeometry(0.09, 10, 8), R.mat(c, {roughness:0.5}), x, 0.9, z));
      for (let i = 0; i < 4; i++){ const b = R.add(new R.THREE.CapsuleGeometry(0.1, 0.35, 4, 10), R.mat(0xc8904a, {roughness:0.8}), -0.4 + i * 0.3, 0.92, 0.2); b.rotation.z = Math.PI / 2; }
      R.hangingPots(0, 0, 5);
      R.shelf(-8.85, 1.6, -2, Math.PI / 2, 3, 'jars'); R.shelf(-8.85, 2.4, -2, Math.PI / 2, 3, 'pots'); R.shelf(8.85, 1.6, -2, -Math.PI / 2, 3, 'jars');
      [[-7, 3], [-6, 3.6], [7.2, 3.4]].forEach(([x, z]) => R.barrel(x, z, {s:0.8}));
      R.crate(6, 3.5, 0.6); R.crate(6.2, 3.5, 0.5, 0.4, 0.6);
      R.counter(5.5, -3.8, {w:4, d:0.9, top:R.mat(0x8a8a86, {roughness:0.6})});
      R.npc(-3, 2.2, 0, 'Aşçı kalfası Paulette', ['Şef Antoine dışarıda fırının başında; bana kalan hamur yoğurmak! Ekmekler sabaha, tartlar akşama.', 'Kontesin en sevdiği? Portakallı tart. Portakallar seradan gelir, limonlar kış bahçesinden.'], {coat:0xf4f2ee, hat:false, apron:true});
    }});

  /* ---------- Parfüm laboratuvarı ---------- */
  add('parfum', doors.parfum, {name:'Parfüm laboratuvarı', w:11, d:8, h:5, floor:'parke', walls:'saray', wallColor:0xe8c8d4, ceiling:'alci', curtain:0xb85a7a, lights:1,
    skipWindow:(x, z) => z < -3 || x > 5,
    decor(R, r){
      [1.0, 1.6, 2.2].forEach(y => R.shelf(0, y, -3.85, 0, 8, 'bottles'));
      R.counter(0, -0.6, {w:4, d:1.0, top:R.mat(0xf2ede4, {roughness:0.3})});
      const still = R.cyl(0.3, 0.38, 0.6, R.copper, -1.2, 1.25, -0.6, 16); R.cyl(0.04, 0.04, 1.0, R.copper, -0.7, 1.5, -0.6, 8).rotation.z = 1.1;
      R.add(new R.THREE.SphereGeometry(0.2, 12, 10), R.copper, -1.2, 1.65, -0.6);
      R.cabinet(5.2, -1.6, -Math.PI / 2, {w:1.8, items:'bottles'});
      [[-4.3, 2.2], [-4.3, -1.2]].forEach(([x, z]) => { R.plant(x, z, {s:0.7}); for (let i = 0; i < 8; i++) R.add(new R.THREE.SphereGeometry(0.05, 6, 4), R.mat(0x8a5ac8), x + (R.rnd() - 0.5) * 0.4, 1.0 + R.rnd() * 0.3, z + (R.rnd() - 0.5) * 0.4); });
      R.mirror(5.45, 2.0, 1.6, -Math.PI / 2, 1.0, 1.8);
      R.note(1.2, 0.4, 'Esans defterini oku', 'Mlle Isabeau\'nun defteri', ['"Üst nota: bergamot, ilk on dakika. Kalp: gül ve lavanta, bir saat. Dip: amber ve sandal, akşama kadar."', '"Kontes için: portakal çiçeği, yasemin ve bir damla vanilya. Adını \'Lumière\' koyacağım."']);
    }});

  /* ---------- İpek atölyesi ---------- */
  add('ipek', doors.ipek, {name:'İpek atölyesi', w:20, d:9, h:5.5, floor:'ahsap', walls:'alci', wallColor:0xefe4cf, ceiling:'kiris', curtain:0x1d4fb8, lights:2,
    skipWindow:(x, z) => x < -9,
    decor(R, r){
      [-6, 0, 6].forEach((x, i) => R.loom(x, -2.2, 0, [0xc8102e, 0x1d4fb8, 0xd4af37][i]));
      R.bolts(-9.6, 1.0, 1.4, Math.PI / 2); R.bolts(-9.6, 1.4, 1.4, Math.PI / 2, [0xf2e6d0, 0xff8fab, 0x2a8a5a, 0x8a3ab8]);
      R.box(0.5, 1.6, 2.4, R.darkWood, -9.7, 0.8, 1.4); R.collide(-9.7, 1.4, 0.3, 1.2);
      R.table(3, 2.4, {w:3, d:1.2}); R.box(2.2, 0.01, 0.9, R.mat(0xc8102e, {roughness:0.8}), 3, 0.82, 2.4);
      [6.8, 8.4].forEach((x, i) => R.mannequin(x, 2.6, Math.PI, [0xd8b4e2, 0x2a6a4a][i]));
      // ipek böceği tepsileri
      for (let i = 0; i < 3; i++){ R.box(1.4, 0.06, 0.8, R.wood, -3, 0.5 + i * 0.45, 3.4); for (let k = 0; k < 8; k++) R.add(new R.THREE.CapsuleGeometry(0.03, 0.06, 3, 6), R.linen, -3.5 + k * 0.14, 0.56 + i * 0.45, 3.4 + (k % 2 ? 0.1 : -0.1)).rotation.z = Math.PI / 2; }
      R.collide(-3, 3.4, 0.75, 0.45);
      R.npc(1, 1.2, Math.PI, 'Dokumacı Lison', ['Her tezgâhta bir renk: kırmızı kontesin balo elbisesi, mavi muhafız pelerinleri, altın sarısı perdeler için.', 'İpek böcekleri dut yaprağıyla beslenir; dışarıdaki dut ağaçları onlar için. Bir koza bin metre iplik verir!'], {coat:0x8a3ab8, hat:false, apron:0xf4ead6});
    }});

  /* ---------- Şarap mahzeni ---------- */
  add('sarap', doors.sarap, {name:'Şarap evi ve mahzen', w:18, d:12, h:6.5, floor:'tas', walls:'tas', ceiling:'tonoz', doorStyle:'kemer', windows:false, curtain:0, lights:2,
    decor(R, r){
      [-1, 1].forEach(sd => side(10, 6).forEach(z => { R.barrel(sd * 7.9, z - 0.5, {lying:true, ry:0, collide:false}); R.barrel(sd * 7.9, z - 0.5, {lying:true, y:1.06, collide:false}); }));
      [-1, 1].forEach(sd => R.collide(sd * 7.9, -0.5, 0.6, 5.2));
      R.table(0, 0.5, {w:3, d:1.2, top:R.mat(0x6a4a2a, {roughness:0.7})});
      [-1.0, -0.5, 0.2, 0.8].forEach((x, i) => { R.cyl(0.035, 0.04, 0.3, R.mat([0x3a0a14, 0x1a2a10, 0x5a1020, 0xd8c070][i], {roughness:0.1}), x, 0.97, 0.4, 10); R.cyl(0.03, 0.025, 0.12, R.mat(0xe8f0f8, {roughness:0.05, transparent:true, opacity:0.5}), x + 0.15, 0.88, 0.7, 8); });
      [-1, 1].forEach(sd => R.chair(sd * 2, 0.5, -sd * Math.PI / 2));
      // üzüm presi
      R.cyl(0.8, 0.85, 0.9, R.mat(0x6a4a26), 0, 0.45, -4.6, 18); R.cyl(0.08, 0.08, 1.8, R.iron, 0, 1.6, -4.6, 8); R.box(1.8, 0.12, 0.12, R.darkWood, 0, 2.3, -4.6); R.collideC(0, -4.6, 0.9);
      R.crate(4.5, 4.2, 0.6); R.crate(5.2, 4.2, 0.6, 0.2); R.crate(4.8, 4.2, 0.55, 0.4, 0.6);
      R.npc(-2.8, 2.8, Math.PI * 0.85, 'Mahzen bekçisi Rémy', ['Burada sıcaklık yaz kış aynı kalır. Fıçılar Limousin meşesinden; her biri ayrı bir yılı saklar.', 'Sommelier Bastien dışarıdaki terasta tadım yaptırır. Bu fıçılar ise satılık değil: kontesin düğün yılı, 1722.'], {coat:0x3a2414, hat:false, apron:0x6a1a2a});
    }});

  /* ---------- Saat kulesi ---------- */
  add('saat', doors.saat, {name:'Saat kulesinin makine odası', w:6, d:6, h:5.5, floor:'tas', walls:'tas', ceiling:'kiris', doorStyle:'kemer', windows:false, curtain:0, lights:1,
    decor(R, r){
      R.gear(-1.2, 3.2, -2.9, 1.0, {speed:0.25, teeth:24}); R.gear(0.6, 3.9, -2.85, 0.55, {speed:-0.45, teeth:14}); R.gear(1.6, 2.4, -2.9, 0.75, {speed:0.33, teeth:18, m:R.copper});
      R.gear(-2.9, 2.6, 0, 0.7, {axis:'x', speed:0.4, teeth:16});
      const pend = R.dyn(); pend.position.set(0.6, 4.6, -2.4);
      R.cyl(0.02, 0.02, 3.2, R.brass, 0, -1.6, 0, 6, pend); R.cyl(0.25, 0.25, 0.06, R.brass, 0, -3.2, 0, 20, pend).rotation.x = Math.PI / 2;
      R.anim((dt, t) => { pend.rotation.z = Math.sin(t * 2.2) * 0.3; });
      R.table(2.0, 0.8, {w:1.6, d:0.7}); [1.6, 2.0, 2.4].forEach(x => R.box(0.03, 0.03, 0.25, R.iron, x, 0.83, 0.8));
      for (let i = 0; i < 14; i++) R.box(0.6, 0.04, 0.05, R.wood, -2.6, 0.3 + i * 0.35, 2.2);
      [-2.3, -2.9].forEach(x => R.box(0.05, 5, 0.05, R.wood, x, 2.5, 2.2));
      R.note(2.0, 1.8, 'Ayar defterini oku', 'Saatçi Augustin', ['"Sarkaç: 1,75 saniye. Her pazar ağırlıklar kurulur. Çan saat başı, Lumière ezgisi her saatte bir kez."', '"Dişli oranı 60:1. Yağ: kemik yağı, kışın biraz kafur."']);
    }});

  /* ---------- Av köşkü ---------- */
  add('av', doors.av, {name:'Av köşkü', w:13, d:9, h:3.8, floor:'ahsap', walls:'ahsap', ceiling:'kiris', doorStyle:'rustik', curtain:0x4a2a1a, lights:1,
    skipWindow:(x, z) => Math.abs(x) > 6 || (z < -4 && Math.abs(x) < 2),
    decor(R, r){
      R.fireplace(0, -4.15, 0, {w:2.4, rustic:true});
      R.trophy(0, 2.6, -4.45, 0); R.trophy(-6.45, 2.4, -1.5, Math.PI / 2); R.trophy(6.45, 2.4, -1.5, -Math.PI / 2);
      R.rug(0, -1.2, 3, 2.2, {c1:'#4a2e1a', c2:'#7a5a3a', c3:'#3a2414'});
      R.table(-3.5, 1.2, {w:2.2, d:1.1}); [-1, 1].forEach(sd => R.chair(-3.5 + sd * 0.6, 2.1, Math.PI));
      R.weaponRack(5.8, 1.6, -Math.PI / 2);
      R.bench(2.5, -2.5, 2.2, 0); R.barrel(5.8, -3.5, {s:0.7});
      R.painting(-6.45, 2.0, 2.4, Math.PI / 2, 1.2, 0.9, 'av', 2);
      R.note(-3.5, 2.6, 'Av defterini oku', 'Avcıbaşı Mathurin', ['"Bu sezon: üç boynuzlu geyik, on iki tavşan. Kontes avlanmayı değil izlemeyi sever; geyikleri saymak yeter."', '"Kapağın yerini kimseye söyleme. Kuşatmada şato halkı o yoldan kurtuldu."']);
    }});

  /* ---------- Kuyumcu ve terzi ---------- */
  add('kuyumcu', doors.kuyumcu, {name:'Kuyumcu ve terzi atölyesi', w:18, d:10, h:6.5, floor:'mermer', walls:'saray', wallColor:0xd8c0d8, ceiling:'alci', curtain:0x5a2a6a, lights:2,
    skipWindow:(x, z) => Math.abs(x) > 8.5 || (z < -4.5 && Math.abs(x) < 1.5),
    decor(R, r){
      [-5.5, -1.8, 1.8, 5.5].forEach(x => R.vitrine(x, 0.6, 0));
      R.counter(0, -3.6, {w:5, d:0.8, top:R.mat(0x2a1a12, {roughness:0.3})});
      R.candles(-1.5, 0.95, -3.6); R.cyl(0.06, 0.08, 0.3, R.brass, 1.2, 1.1, -3.6, 10);
      R.cabinet(-8.6, -1.5, Math.PI / 2, {w:1.8, items:'gems'}); R.cabinet(8.6, -1.5, -Math.PI / 2, {w:1.8, items:'gems'});
      [-7, 7].forEach((x, i) => R.mannequin(x, 3.2, Math.PI, [0x1d3a8a, 0xc8102e][i]));
      R.mirror(0, 2.4, -4.95, 0, 1.4, 2.4);
      R.npc(2.6, -2.6, 0, 'Kalfa Margot', ['Usta Lucien dışarıda müşteri ağırlıyor. Ben taşları kesiyorum: bir elmas, otuz iki yüz.', 'Vitrindeki safir Seylan\'dan gelmiş; ışığı gece bile toplar. Kolyeni Lucien\'e yaptırdıysan, taşı ben parlattım!'], {coat:0x5a2a6a, hat:false, apron:0x2a1a12});
    }});

  /* ---------- Uşak akademisi ---------- */
  add('usak', doors.usak, {name:'Uşak akademisi', w:20, d:10, h:7.5, floor:'parke', walls:'saray', wallColor:0xc8d4b8, ceiling:'alci', curtain:0x2a4a2a, lights:2,
    skipWindow:(x, z) => (z < -4.5 && Math.abs(x) < 2) || (Math.abs(x) > 9.5 && z < 0),
    decor(R, r){
      R.dining(0, -0.6, {w:8, d:1.3, cloth:R.linen, gilt:true, seat:R.mat(0x2a4a2a, {roughness:0.85})});
      R.cabinet(-9.6, -2, Math.PI / 2, {w:2, items:'china'}); R.cabinet(9.6, -2, -Math.PI / 2, {w:2, items:'china'});
      // zil panosu: her odaya bir zil
      R.box(3.2, 1.2, 0.06, R.darkWood, 0, 3.4, -4.95);
      for (let i = 0; i < 8; i++){ R.add(new R.THREE.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), R.brass, -1.4 + i * 0.4, 3.3, -4.88).rotation.x = Math.PI; R.box(0.3, 0.06, 0.02, R.linen, -1.4 + i * 0.4, 3.75, -4.9); }
      [-6.5, -5.2].forEach(x => R.mannequin(x, 3.4, Math.PI, 0x111114));
      R.painting(-6, 3.2, -4.95, 0, 1.4, 1.1, 'naturmort', 5); R.painting(6, 3.2, -4.95, 0, 1.4, 1.1, 'manzara', 9);
      R.npc(4, 2.6, Math.PI, 'Kâhya yardımcısı Honoré', () => [
        {text:'Bir uşağın üç kuralı: sessiz yürü, tepsiyi omuz hizasında tut, misafirin bardağı asla boş kalmasın.', choices:['Bir ders daha!', 'Teşekkürler.']},
        'Çatal sol, bıçak sağ, kaşık bıçağın sağında. Tatlı kaşığı tabağın üstünde yatar. Kontes, yanlış dizilmiş bir sofrayı kapıdan fark eder!',
      ], {coat:0x111114, hat:false});
    }});

  /* ---------- Haras ahırı ---------- */
  add('haras', doors.haras, {name:'Haras ahırı', w:13, d:26, h:5.5, floor:'toprak', walls:'ahsap', ceiling:'kiris', doorStyle:'rustik', curtain:0, lights:3,
    decor(R, r){
      const coats = [[0x6a4a2e, 0x1a120c], [0xf1ece2, 0xb8b0a2], [0x2a1a10, 0x0a0806], [0x9a6a3a, 0x3a2414]];
      [-1, 1].forEach(sd => side(20, 5).forEach((z, i) => {
        R.stall(sd * 4.6, z - 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, {w:3.6, d:3.4});
        if ((i + (sd > 0 ? 1 : 0)) % 2 === 0){ const [c, m] = coats[(i + (sd > 0 ? 2 : 0)) % 4]; R.horse(sd * 5.0, z - 2, sd > 0 ? -Math.PI / 2 : Math.PI / 2, c, m); }
      }));
      R.hay(-1.5, 9.5, 0.9); R.hay(1.8, -11.5, 1.0); R.saddleRack(2.6, 9.6, Math.PI); R.saddleRack(3.6, 9.6, Math.PI);
      R.barrel(-2.6, -11.5, {s:0.7}); R.barrel(-1.6, -11.8, {s:0.7});
      R.note(0, 8.5, 'Ahır tahtasını oku', 'Haras de Lumière', ['"Étoile: beyaz, yedi yaş. Mizacı: sabırlı ama meraklı. Islık sesine gelir."', '"Sabah yulaf, öğle saman, akşam havuç. Pazar günleri nal kontrolü."']);
    }});

  /* ---------- Şato ahırı ---------- */
  add('ahir', doors.ahir, {name:'Şato ahırı', w:9, d:30, h:5.5, floor:'toprak', walls:'tas', ceiling:'kiris', doorStyle:'kemer', curtain:0, lights:3,
    skipWindow:(x, z) => Math.abs(x) > 3,
    decor(R, r){
      [-1, 1].forEach(sd => side(24, 6).forEach((z, i) => {
        R.stall(sd * 2.8, z - 2.5, sd > 0 ? -Math.PI / 2 : Math.PI / 2, {w:3.6, d:3.0});
        if ((i + (sd > 0 ? 0 : 1)) % 3 !== 0) R.horse(sd * 3.1, z - 2.5, sd > 0 ? -Math.PI / 2 : Math.PI / 2, [0x3a2416, 0x8a5a3a, 0x1a120c][i % 3], 0x0e0a08);
      }));
      R.saddleRack(-0.8, 12, Math.PI); R.saddleRack(0.8, 12, Math.PI); R.hay(0, -13.5, 0.9);
      R.npc(1.2, 9.5, Math.PI, 'Seyis Jacques', ['Muhafız atları burada kalır. Devriyeden dönen at önce kurulanır, sonra yemlenir; tersi olmaz!', 'Étoile mi? O Gaston\'un harasında doğdu. Kontes ona kendi elleriyle isim verdi.'], {coat:0x5a4a3a, hat:false, apron:0x6a5a44});
    }});
}
