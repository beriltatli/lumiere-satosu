// Şablon ada: yeni bir ada için başlangıç noktası. Bu klasör "_" ile başladığı için oyuna yüklenmez.
// Kopyala:  cp -r src/islands/_sablon src/islands/<ada-kimligi>   ve aşağıdaki id'yi klasör adıyla aynı yap.
// Kurallar, koordinatlar ve ctx API'sinin tamamı: src/islands/ADA_TALIMATI.md
//
// Bu örnekte küçük bir liman köyü var: taş meydan, fıskiye, içine girilebilen bir han, dönen bir yel değirmeni,
// konuşan bir köylü ve kaydedilen küçük bir görev (kayıp feneri bul, sahibine götür).

export default {
  id:'sablon',                         // klasör adıyla aynı; küçük harf, rakam, tire
  name:'Şablon Adası',                 // gemide ve bildirimlerde görünen ad
  theme:'Örnek liman köyü',            // kaptanın listesinde adın yanında
  author:'GitHub kullanıcı adın',
  description:'Köyün simgelerini bul ve kayıp feneri sahibine götür.',
  order:100,                           // gemi listesindeki sıra (küçük önce)
  seed:7,                              // rastgele sayı tohumu: aynı tohum her açılışta aynı adayı kurar

  // kıyı çizgisi (merkez her zaman 0, 0): bkz. makeCoast, src/coast.js
  coast:{radius:240, waves:[[3, 14, 0.4], [5, 7, 1.7]], ripple:[[11, 3, 0.2], [27, 1.2, 2.4]]},
  terrain:{groundColor:0xb8c98a, sand:0xc9b48a, grass:0x8fa45a, shallow:0x2aa4a0, deep:0x07304a, rocks:30},
  harbor:0,                            // iskelenin açısı: 0 güney, π/2 doğu, π kuzey, -π/2 batı
  pierLength:46,

  build(ctx){
    const { THREE, kit, C, root, rnd } = ctx;
    const store = ctx.store;            // kayda yazılan nesne: JSON'a çevrilebilen değerler koy
    store.lantern = store.lantern || 'kayip';   // 'kayip' → 'bulundu' → 'teslim'

    /* ---------- taş meydan ve fıskiye (0, 70) ---------- */
    const SQ = {x:0, z:70};
    kit.plane(36, 30, kit.gravel, SQ.x, 0.02, SQ.z);
    kit.add(new THREE.CylinderGeometry(3.6, 3.8, 0.7, 32), kit.stone, SQ.x, 0.35, SQ.z);
    kit.add(new THREE.CylinderGeometry(3.2, 3.2, 0.1, 32), kit.mat(0x3a8aa0, {roughness:0.1}), SQ.x, 0.66, SQ.z, root, false);
    kit.column(SQ.x, SQ.z, 2.6, 0.25);
    C.circle(SQ.x, SQ.z, 3.9);           // görünen her katı şeyin bir çarpışma şekli olmalı
    ctx.place({id:'meydan', name:'Köy meydanı', x:SQ.x, z:SQ.z, r:14});

    // yoldan meydana: iskeleye kadar çakıl yol
    kit.plane(5, 120, kit.gravel, 0, 0.015, 145);
    kit.signPost('Şablon Köyü', 4.5, 96, 0);

    /* ---------- han: dışı kit.hall, içi ctx.room ---------- */
    const inn = kit.hall({x:0, z:38, w:16, d:10, h:6, roof:'gable', roofMat:kit.mat(0x8a3a2a), wall:kit.mat(0xeadcc0), doorStyle:'kemer'});
    kit.signBoard('Han', 0, 4.4, 43.1, 0, 2.4);
    ctx.place({id:'han', name:'Yolcu hanı', x:0, z:44, r:10});
    ctx.room({
      id:'han', name:'Yolcu hanı',
      door:{x:inn.front[0], z:inn.front[1], ry:0},   // kapının önündeki nokta; ry: dışarı bakış (hall rot)
      w:12, d:9, h:4.4, floor:'ahsap', walls:'ahsap', ceiling:'kiris', lights:2,
      decor(R){
        R.table(-2.5, -1, {w:2.2, d:1});
        R.chair(-2.5, 0, Math.PI); R.chair(-2.5, -2, 0);
        R.table(2.5, -1, {round:true, w:1.2});
        R.counter(0, -3.6, {w:4});
        R.barrel(-5, -3.6); R.barrel(-4.2, -3.8, {s:0.8});
        R.fireplace(5.6, 0, -Math.PI / 2);
        R.lantern(0, -1);
        R.npc(0, -4.4, 0, 'Hancı Mira', ['Hoş geldin yolcu! Sıcak çorba ocakta.', 'Fenerci Oskar yine fenerini kaybetmiş; değirmenin oralarda bir yerde olmalı.']);
        R.note(-2.5, -1, 'Masadaki deftere bak', 'Konuk defteri', 'Son yazı: "Lumière\'den geldim, La Belle Étoile ile. — bir gezgin"');
      },
    });

    /* ---------- yel değirmeni: dönen kanatlar ---------- */
    const MILL = {x:-70, z:95};
    kit.add(new THREE.CylinderGeometry(2.4, 3.2, 9, 12), kit.mat(0xe8dcc4), MILL.x, 4.5, MILL.z);
    kit.add(new THREE.ConeGeometry(3.0, 2.6, 12), kit.mat(0x6a3a22), MILL.x, 10.3, MILL.z);
    C.circle(MILL.x, MILL.z, 3.3);
    // animasyonlu parça: userData.dyn olan grup birleştirmede (kit.bake) yerinde kalır, döndürülebilir
    const sails = new THREE.Group(); sails.position.set(MILL.x, 8.2, MILL.z + 3.2); sails.userData.dyn = true; root.add(sails);
    for (let i = 0; i < 4; i++){
      const arm = kit.add(new THREE.BoxGeometry(0.4, 7, 0.08), kit.mat(0xf2ead8), 0, 3.6, 0, sails);
      arm.position.set(Math.sin(i * Math.PI / 2) * 3.6, Math.cos(i * Math.PI / 2) * 3.6, 0); arm.rotation.z = -i * Math.PI / 2;
    }
    ctx.onUpdate((dt) => { sails.rotation.z += dt * (0.3 + ctx.wind * 1.2); });   // rüzgâr arttıkça hızlanır
    ctx.place({id:'degirmen', name:'Yel değirmeni', x:MILL.x, z:MILL.z, r:12});

    /* ---------- ağaçlar: çok tekrar eden şey InstancedMesh ile ---------- */
    {
      const N = 60, trunk = new THREE.CylinderGeometry(0.18, 0.25, 2.4, 6), crown = new THREE.SphereGeometry(1.6, 8, 6);
      trunk.translate(0, 1.2, 0); crown.translate(0, 3.4, 0);
      const T = new THREE.InstancedMesh(trunk, kit.mat(0x5a3a22), N), K = new THREE.InstancedMesh(crown, kit.mat(0x4f7a32, {roughness:0.9}), N);
      T.castShadow = K.castShadow = true;
      const m = new THREE.Matrix4(); let n = 0;
      for (let i = 0; i < 400 && n < N; i++){
        const x = (rnd() - 0.5) * 360, z = (rnd() - 0.5) * 360;
        if (ctx.coast.dist(x, z) > -30) continue;                                // kıyıya ve kumsala dikme
        if (Math.hypot(x - SQ.x, z - SQ.z) < 26 || Math.abs(x) < 8 && z > 30) continue;  // meydanı ve yolu boş bırak
        if (Math.hypot(x - MILL.x, z - MILL.z) < 8) continue;
        const s = 0.8 + rnd() * 0.6; m.makeScale(s, s, s).setPosition(x, 0, z);
        T.setMatrixAt(n, m); K.setMatrixAt(n, m); C.circle(x, z, 0.35 * s); n++;
      }
      T.count = K.count = n; root.add(T, K);
    }

    /* ---------- köylü ve görev ---------- */
    const LAMP = {x:-58, z:112};
    const lamp = kit.add(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8), kit.lampMat, LAMP.x, 0.25, LAMP.z);
    lamp.userData.keep = true;           // tek başına gizlenecek/hareket edecek mesh birleştirilmesin
    lamp.visible = store.lantern === 'kayip';
    ctx.interact(LAMP.x, LAMP.z, 'Feneri al', () => {
      store.lantern = 'bulundu'; lamp.visible = false;
      ctx.sfx('coin'); ctx.ui.toast('Oskar\'ın fenerini buldun', 2400); ctx.save();
    }, 2.0, () => store.lantern === 'kayip');

    const OSKAR = {x:9, z:66};
    kit.placeNPC(kit.npc({coat:0x2a4a6a, hat:'yok', apron:true}), OSKAR.x, OSKAR.z, -Math.PI / 2, 'Fenerci Oskar', async () => {
      if (store.lantern === 'teslim'){ await ctx.ui.say('Fenerci Oskar', 'Fenerim yine yanıyor. Gemiler yolunu bulur artık!'); return; }
      if (store.lantern === 'bulundu'){
        store.lantern = 'teslim'; ctx.sfx('quest'); ctx.save();
        await ctx.ui.dialog([{name:'Fenerci Oskar', text:'Fenerim! Nerede buldun onu? Değirmenin dibinde mi? Rüzgâr uçurmuş olmalı.'}, {name:'Fenerci Oskar', text:'Teşekkürler. Bu gece iskelenin feneri senin şerefine yanacak.'}]);
        return;
      }
      const c = await ctx.ui.dialog([{name:'Fenerci Oskar', text:'Fenerimi kaybettim! Rüzgâr değirmene doğru esiyordu…', choices:['Ararım', 'Sonra']}]);
      if (c === 0) ctx.ui.toast('Yel değirmeninin çevresine bak', 2600);
    });
    // görev işareti: pusulada yalnız gerektiğinde görünür
    ctx.marker({id:'fener', label:'Kayıp fener', color:'#f3c74c', x:LAMP.x, z:LAMP.z, minor:true, show:() => store.lantern === 'kayip'});
    ctx.marker({id:'oskar', label:'Fenerci Oskar', color:'#f3c74c', x:OSKAR.x, z:OSKAR.z, show:() => store.lantern === 'bulundu'});

    /* ---------- heykel (konuşulabilir) ---------- */
    kit.statue(-12, 70, 4, Math.PI / 2, 1, 'Ozan', 'Kaidede: "Denizden gelen her yolcu bir şarkı bırakır."');

    // her kare: gece meydanın lambası yanar (ctx.W: hava durumu; W.night 0..1)
    const glow = kit.add(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false}), SQ.x, 3.0, SQ.z, root, false);
    glow.userData.keep = true;
    return {
      update(dt, t, hero){ glow.visible = ctx.W.night > 0.5; },
    };
  },
};
