# Ada talimatı: kurallar ve `ctx` API'si

Bu belge `src/islands/<ada-kimligi>/island.js` dosyasının nasıl yazılacağını anlatır. Katkı süreci (fork, dal, PR) için kök dizindeki [CONTRIBUTING.md](../../CONTRIBUTING.md) dosyasına bak. En hızlı başlangıç, çalışan bir örnek olan [`_sablon/island.js`](_sablon/island.js) dosyasını kopyalamaktır.

## Sistem nasıl çalışır?

- `src/islands/index.js` açılışta `src/islands/*/island.js` dosyalarını Vite ile kendiliğinden bulur. **Ana koda (`main.js`, `index.js` vb.) dokunman gerekmez.**
- `_` ile başlayan klasörler (ör. `_sablon`) yüklenmez.
- Oyuncu Lumière'in güney iskelesindeki **La Belle Étoile** gemisine (ya da Kaptan Jean-Baptiste'e) **E** ile gelince açılan listeden adanı seçer.
- Bütün katkıcı adaları dünyanın merkezinde (0, 0) kurulur ama **aynı anda yalnız bir ada görünür.** Gemiyle gidilince önceki ada gizlenir. Ada ilk ziyarette kurulur, bu yüzden oyunun açılışını yavaşlatmaz.
- Her adanın kendi çarpışma alanı (`ctx.C`), kıyısı, okyanusu, iskelesi, kaptanı ve gemisi vardır. İskele, kaptan ve gemi kendiliğinden eklenir.
- `build(ctx)` bir hata fırlatırsa oyun çökmez. Konsola `[ada] <id> kurulamadı` yazılır ve oyuncu Lumière'e döner. Her kare çalışan kodda hata çıkarsa adanın güncellemeleri durdurulur.

## Tanım nesnesi

`island.js` dosyası `export default` ile tek bir nesne verir:

| Alan | Zorunlu | Açıklama |
|---|---|---|
| `id` | evet | Klasör adıyla **aynı** olmalı. Küçük harf, rakam ve tire, 2–31 karakter, harfle başlar (ör. `venedik`, `kyoto-2`). `lumiere` kullanılamaz. |
| `name` | evet | Görünen ad (ör. `'Venedik Lagünü'`). |
| `build(ctx)` | evet | Adayı kuran işlev. Aşağıda ayrıntılı anlatılıyor. |
| `theme` | | Kaptanın listesinde adın yanında çıkan kısa açıklama. |
| `author` | | GitHub kullanıcı adın. |
| `description` | | Görev günlüğündeki "keşif" görevinin ipucu metni. |
| `order` | | Gemi listesindeki sıra (varsayılan 100, küçük olan önce gelir). |
| `seed` | | Tohum (tam sayı). `ctx.rnd` ve kit bununla tohumlanır: aynı tohum her açılışta aynı adayı kurar. |
| `coast` | | Kıyı çizgisi: `{radius, waves, flat, ripple, soft}`. Ayrıntısı aşağıda. |
| `terrain` | | `{groundColor, sand, grass, shallow, deep, rocks, seed}`: çim, kum, kıyı otu, sığ ve derin su renkleri (hex), kaya sayısı. |
| `harbor` | | İskelenin kıyıdaki açısı (radyan, varsayılan 0, yani güney). |
| `pierLength` | | İskelenin boyu (m, varsayılan 46). |

`coast` alanında `cx`, `cz` ve `fn` **verme**: ada her zaman merkezde kurulur.

## Koordinatlar ve ölçüler

- Birim metre. **x doğu, z güney** (+z güneye bakar), y yukarı.
- Açı `a = atan2(x, z)`: 0 güney, π/2 doğu, π kuzey, -π/2 batı. `harbor` ve kıyı açıları bu düzende.
- Dönüş (`rotation.y`, `ry`): 0 iken nesnenin önü +z'ye (güneye) bakar.
- Kıyı yarıçapı varsayılan 300 m'dir. Kumsal kıyıdan ~18 m içeride başlar. Bir noktanın karada mı olduğunu `ctx.coast.dist(x, z)` ile anlarsın: değer **negatifse karada**, pozitifse denizdedir. Yapıları `dist < -25` olan yerlere koy.
- Oyuncu iskelenin ucunda karaya dönük başlar (`ctx.harbor`).
- Zemin düzdür (y = 0). Tepe istiyorsan kendi geometrini yap ve yüksekliği `ctx.C.heightFns` ile bildir (aşağıda).

### `coast` biçimi

```js
coast:{
  radius:260,                        // ortalama yarıçap (m)
  waves:[[3, 18, 0.4], [5, 8, 1.7]], // [n, genlik, faz]: büyük girinti ve çıkıntılar; n tam sayı olmalı
  ripple:[[11, 3, 0.2]],             // küçük dalgalanmalar
  flat:{angle:0, dist:220},          // isteğe bağlı: o yönde düz bir kumsal
}
```

## `ctx`: `build(ctx)` içinde kullanabileceklerin

| Ad | Açıklama |
|---|---|
| `ctx.THREE` | three.js (r147). Kendin `import * as THREE` yapma, bunu kullan. |
| `ctx.root` | Adanın içerik grubu. Eklediğin her şey bunun altına girer (`kit` zaten buraya ekler). |
| `ctx.kit` | Yapı kiti (`src/kit.js`). Ayrıntısı aşağıda. |
| `ctx.C` | Adanın çarpışma alanı (`src/game/collision.js`). |
| `ctx.coast` | Kıyı: `dist(x, z)`, `point(açı, kıyıdanUzaklık)` → `[x, z]`, `R(açı)`, `radius`. |
| `ctx.harbor` | `{x, z, angle, yaw}`: iskelenin ucu ve açısı. |
| `ctx.rnd()` | Tohumlu rastgele sayı (0–1). `Math.random()` yerine bunu kullan ki ada her açılışta aynı kurulsun. |
| `ctx.materials` | Dünyanın paylaşılan malzemeleri (`stoneMat`, `marbleMat`, `goldMat`, `gravelMat`, `slateMat`, `lawnMat`…). **Bunları değiştirme**, gerekirse `.clone()` ile kopyala. |
| `ctx.W` | O anki hava: `W.night` (0–1), `W.rain` (0–1), `W.clouds`, `W.elev` (güneş yüksekliği) gibi alanlar içerir. |
| `ctx.wind` | Rüzgâr gücü (~0.2–1.2). |
| `ctx.ui.say(ad, metin)` | Tek satırlık konuşma. Bir Promise döndürür. |
| `ctx.ui.dialog(satırlar)` | `[{name, text, choices?}]`. `choices` verilirse seçilen sıranın numarasıyla çözülür (Promise). |
| `ctx.ui.toast(metin, ms)` | Kısa bildirim. |
| `ctx.sfx(ad)` | Ses efekti: `coin`, `quest`, `rune`, `open`, `wrong`, `blip`, `bell`, `gong`, `chime`, `drum`, `wood`, `whoosh`, `whistle`, `roar`. |
| `ctx.store` | Adana ait, **kayda yazılan** nesne. Yalnız JSON'a çevrilebilen değerler koy (sayı, metin, dizi, düz nesne). |
| `ctx.save()` | Kaydı hemen yazar (görev adımlarından sonra çağır). |
| `ctx.interact(x, z, etiket, işlev, r = 2.4, göster = () => true)` | **E** ile tetiklenen etkileşim. `göster()` false döndürürse etkileşim gizlenir. |
| `ctx.marker({id, label, x, z, color, minor, show})` | Pusula işareti. `show()` false olunca görünmez. `minor: true` küçük işaret demektir. |
| `ctx.place({id, name, x, z, r})` | Keşfedilecek yer. Oyuncu `r` (varsayılan 14 m) içine girince "Keşfedildi" bildirimi çıkar ve kaydedilir. En yakın ikisi pusulada görünür. Görev günlüğüne "<Ada>: keşif" görevi kendiliğinden eklenir. |
| `ctx.room(spec)` | İçine girilebilen bina. Ayrıntısı aşağıda. |
| `ctx.onUpdate(fn)` | Her karede `fn(dt, t, hero)` çağrılır (yalnız ada görünürken). |
| `ctx.hero` | Oyuncunun konumu: `x`, `y`, `z` (salt okunur). |
| `ctx.world`, `ctx.audio` | Motorun kendisi. Yalnız gerçekten gerekirse kullan. Bunlarla Lumière'i ya da genel ayarları değiştiren PR kabul edilmez. |

`build` bir nesne döndürebilir:

- `update(dt, t, hero)`: her kare çağrılır (`ctx.onUpdate` ile aynı iş).
- `keepUnbaked: true`: kitin birleştirme adımını kapatır. Yalnız hata ayıklarken kullan.

## Yapı kiti (`ctx.kit`)

Kit, `src/kit.js` dosyasında. En çok kullanılanlar:

| İşlev | Açıklama |
|---|---|
| `add(geo, mat, x, y, z, parent = root, gölge = true)` | Mesh ekler ve döndürür. |
| `mat(renk, seçenekler)` | Önbellekli `MeshStandardMaterial`. Aynı renk aynı malzemeyi döndürür, bu da daha az çizim çağrısı demek. |
| `plane(w, d, mat, x, y, z, rot)` · `disc(r, mat, x, y, z)` | Zemin kaplaması (yol, meydan). Zeminle çakışmasın diye y = 0.01–0.03 ver. |
| `hall({x, z, w, d, h, rot, wall, roof, roofMat, roofH, door, doorW, doorStyle, winRows, collide})` | Dikdörtgen bina: pencereler, çatı (`'mansard'`, `'gable'`, `'flat'`), kapı ve çarpışma. Kapı yerel +z yüzündedir. `{G, front}` döndürür; `front` kapının 1.6 m önündeki `[x, z]` noktasıdır. |
| `column(x, z, h, r)` · `statue(x, z, çeşit 0–5, ry, ölçek, ad, metin)` | Sütun ve heykel. Heykele ad ve metin verilirse konuşulabilir olur. |
| `signPost(metin, x, z, ry)` · `signBoard(metin, x, y, z, ry, w)` | Tabela. |
| `npc({coat, hat, apron, chef, trim})` · `lady(elbiseRengi, saçRengi)` | Figür (Grup) döndürür. |
| `placeNPC(figür, x, z, ry, ad, işlev)` | Figürü yerleştirir: oyuncu yaklaşınca ona döner, "Konuş: <ad>" etkileşimi ve çarpışma ekler. |
| `canvas(w, h)` · `ctex(canvas, rx, ry)` | Kodla doku üretmek için tuval ve doku. |
| `lathe(noktalar)` · `frustum` · `gableGeo` | Geometri yardımcıları. |
| `stone`, `marble`, `gold`, `gravel`, `slate`, `cream`, `plaster`, `wood`, `darkWood`, `grass`, `lampMat` | Hazır malzemeler. |

**Renkler:** hex renkleri olduğu gibi (sRGB) yaz. `build` bittikten sonra adadaki bütün malzemelerin renkleri bir kez doğrusal düzene çevrilir. Bu yüzden `build` bittikten **sonra** oluşturduğun malzemelerin rengini kendin çevirmen gerekir (`color.convertSRGBToLinear()`).

**Birleştirme (bake):** `build` bittikten sonra kit, aynı malzemeli sabit mesh'leri birleştirir. Böylece binlerce parça birkaç çizim çağrısına iner. Sonuç olarak:

- Sonradan **hareket edecek, dönecek ya da gizlenecek** bir grubu `group.userData.dyn = true` ile işaretle. Grubun içi kendi içinde birleşir ama grup yerinde kalır ve döndürülebilir (örnek: şablondaki yel değirmeni).
- Tek başına gizlenecek ya da değişecek bir mesh için `mesh.userData.keep = true` kullan (örnek: şablondaki fener).
- `InstancedMesh` birleştirilmez. Ağaç, çit, taş gibi yüzlerce kez tekrar eden şeyler için onu kullan.

## Çarpışma (`ctx.C`)

Oyuncu yalnız senin tanımladığın engellere çarpar. **Görünen her katı nesneye bir çarpışma şekli ekle.**

```js
ctx.C.circle(x, z, r);                 // daire (ağaç gövdesi, sütun, fıskiye)
ctx.C.box(x, z, yarıGenişlik, yarıDerinlik, ry); // döndürülmüş kutu (duvar, bina)
ctx.C.rect(x0, z0, x1, z1);            // eksen hizalı kutu
const o = ctx.C.box(...); o.y0 = 2; o.y1 = 5; // yalnız bu yükseklik aralığında engel (köprü altı, balkon)
o.low = true;                          // kamera bu engeli yok saysın (alçak çit)
```

Basılabilir yüzey (merdiven, teras, köprü, tepe) eklemek için:

```js
ctx.C.heightFns.push((x, z) => (Math.abs(x) < 10 && z > 0 && z < 20) ? 1.2 : null); // null: burada yüzey yok
```

Oyuncu 0.6 m'ye kadar olan basamakları çıkar. Daha yüksek bir yüzeye merdivenle (art arda artan yükseklik) çıkılır. Kıyıdan öteye yürüme engeli kendiliğinden kurulur.

## İçine girilen binalar (`ctx.room`)

```js
const inn = kit.hall({x:0, z:38, w:16, d:10, h:6, roof:'gable'});
ctx.room({
  id:'han', name:'Yolcu hanı',
  door:{x:inn.front[0], z:inn.front[1], ry:0},  // dışarıdaki giriş noktası; ry: kapıdan dışarı bakış (binanın rot değeri)
  w:12, d:9, h:4.4,                             // iç ölçüler; giriş kapısı odanın yerel +z duvarında
  floor:'ahsap', walls:'ahsap', ceiling:'kiris', lights:2,
  decor(R){ R.table(0, -1); R.npc(0, -4, 0, 'Hancı', ['Hoş geldin!']); },
});
```

- `floor`: `parke`, `mermer`, `tas`, `ahsap`, `toprak`, `mozaik`, `tatami`
- `walls`: `saray`, `alci`, `tas`, `ahsap`, `tugla`, `mermer`, `shoji`
- `ceiling`: `alci`, `boyali`, `kiris`, `tonoz`
- Ayrıca: `wallColor`, `curtain`, `windows`, `lamp: 'avize' | 'fener'`, `plain: true`

Oda ilk girişte kurulur. `decor(R)` içindeki koordinatlar odanın merkezine göredir (+z giriş duvarı). Kullanabileceğin mobilya kitinin (`R`) tamamı `src/rooms.js` içindeki `kit()` işlevinde. Başlıcaları: `table`, `chair`, `dining`, `bench`, `bookcase`, `cabinet`, `counter`, `barrel`, `crate`, `rug`, `painting`, `mirror`, `chandelier`, `lantern`, `candles`, `fireplace`, `plant`, `bust`, `globe`, `shelf`, `loom`, `vitrine`, `pool`, `stage`, `seats`, `npc(x, z, ry, ad, satırlar)`, `note(x, z, etiket, ad, satırlar)`, `interact(x, z, etiket, işlev)`, `collide(x, z, hw, hd, ry)`, `anim(fn)`, `light(...)`.

## Kayıt ve görevler

- Kayıtta adana ait iki şey tutulur: `found` (keşfedilen yerlerin kimlikleri) ve `ctx.store`.
- Görev durumunu `ctx.store` içinde tut (ör. `store.lantern = 'kayip' | 'bulundu' | 'teslim'`). Değiştirdikten sonra `ctx.save()` çağır.
- `build` her oyun açılışında yeniden çalışır. Bu yüzden görünümü `store` değerine göre kur (ör. fener daha önce alındıysa gizli başlasın).
- **Lumière'in kaydına** (`runes`, `coins`, `notes`, `china`…) dokunma.

## Kurallar (PR kontrol listesi)

1. **Yalnız kendi klasörün:** değişiklikler `src/islands/<id>/` içinde olmalı. Motorda bir eksik varsa ayrı bir issue ya da PR aç.
2. **Dış dosya yok:** model, doku ve ses dahil her şey kodla üretilmeli (projenin geri kalanı da böyle yazıldı). Çok gerekliyse önce bir issue aç; lisansı CC0 olmayan kaynak kabul edilmez.
3. **Bağımlılık yok:** `package.json` değişmez. Yalnız `ctx.THREE` ve three.js'in `examples/jsm` modülleri kullanılabilir.
4. **Performans:** adan Orta kalitede, sıradan bir dizüstünde 60 fps'e yakın kalmalı. Kabaca sınırlar: birleştirme sonrası 300'den az çizim çağrısı (`renderer.info.render.calls`), 1,5 milyondan az üçgen. Tekrarlanan nesnelerde `InstancedMesh` kullan. Dinamik ışık (PointLight) en fazla 4 olsun. Her kare çalışan kodda yeni nesne (`new Vector3`, dizi) üretme.
5. **Kodla üretilen dokular küçük olsun:** tuval en fazla 512×512, mümkünse 256.
6. **Metinler Türkçe:** diyaloglar, tabelalar ve yer adları Türkçe olmalı. Özel adlar özgün dilinde kalabilir.
7. **İçerik:** saygılı ve her yaşa uygun olmalı. Gerçek kişileri hedef alan ya da marka logosu taşıyan içerik kabul edilmez.
8. **Konsol temiz:** adayı kurarken ve gezerken konsolda hata ya da uyarı çıkmamalı.
9. **`npm run build` hatasız tamamlanmalı.**
