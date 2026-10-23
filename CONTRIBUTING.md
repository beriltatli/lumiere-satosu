# Katkı rehberi: Lumière'e yeni bir ada ekle

Lumière Şatosu bir takımadaya dönüşüyor. Lumière'in güney iskelesindeki **La Belle Étoile** gemisi, katkıcıların eklediği adalara sefer yapar: Venedik lagünü, Japon kıyıları, İstanbul, ya da hayal ettiğin herhangi bir yer. Bu rehber, kendi adanı eklemenin adımlarını sırayla anlatır.

- **Kurallar ve API:** [`src/islands/ADA_TALIMATI.md`](src/islands/ADA_TALIMATI.md)
- **Çalışan örnek:** [`src/islands/_sablon/island.js`](src/islands/_sablon/island.js) (taş meydan, giriş yapılan bir han, dönen bir yel değirmeni, konuşan bir köylü ve kayda yazılan küçük bir görev)

Bir ada yalnızca **tek bir klasörden** oluşur: `src/islands/<ada-kimligi>/island.js`. Ana koda dokunman gerekmez. Oyun klasörü kendisi bulur, gemi listesine ekler, kıyıyı, okyanusu, iskeleyi ve kaptanı kurar, keşif görevini ve kaydı yönetir.

## 0. Başlamadan önce

- **Gereken:** Node.js 18 ya da üstü, git, WebGL2 destekli bir tarayıcı (Chrome, Firefox, Safari).
- **Bilmen gereken:** biraz JavaScript ve [three.js](https://threejs.org/docs/) temeli (Mesh, Group, BufferGeometry, MeshStandardMaterial). Projede three.js **r147** kullanılıyor.
- **Önce bir issue aç:** başlığı "Yeni ada: <adın adı>" olsun. Adanın konusunu ve neler olacağını birkaç cümleyle yaz. Böylece iki kişi aynı adayı yapmaz ve kimlik (id) çakışmaz.

## 1. Depoyu hazırla

```bash
# GitHub'da depoyu fork'la, sonra:
git clone git@github.com:<kullanici-adin>/lumiere-satosu.git
cd lumiere-satosu
git remote add upstream git@github.com:beriltatli/lumiere-satosu.git
npm install
git checkout -b ada/<ada-kimligi>          # ör. ada/venedik
```

## 2. Şablonu kopyala

```bash
cp -r src/islands/_sablon src/islands/<ada-kimligi>
```

`src/islands/<ada-kimligi>/island.js` dosyasını aç ve şu alanları değiştir:

```js
id:'venedik',                 // klasör adıyla AYNI olmalı; küçük harf, rakam, tire
name:'Venedik Lagünü',
theme:'Kanallar ve maskeler, 1750\'ler',
author:'<github-kullanici-adin>',
description:'Lagünün simgelerini bul.',
seed:31,                      // herhangi bir tam sayı
```

Kimlik kuralı: `^[a-z][a-z0-9-]{1,30}$`. Türkçe karakter, büyük harf ve boşluk kullanılamaz (`istanbul` olur, `İstanbul` olmaz).

## 3. Oyunda aç

```bash
npm run dev
```

Tarayıcı `http://localhost:5173` adresinde açılır. Adana gitmenin iki yolu var:

- **Oyunun içinden:** Yeni oyun başlat, Lumière'in güneyindeki iskeleye yürü, iskelenin ucunda **E** ile gemiye bin ve listeden adanı seç.
- **Kısa yol (geliştirirken):** oyunu başlattıktan sonra tarayıcı konsolunda:

  ```js
  __game.islands.travel('venedik')
  ```

Dosyayı her kaydedişinde sayfa yenilenir. Kayıt tarayıcıda tutulduğu için oyun kaldığın adadan ve konumdan devam eder.

Yararlı konsol komutları:

```js
__game.hero.teleport(0, 0, 50, 0)            // adada (x, y, z, bakış) noktasına ışınlan
__game.setWeather('gece')                    // gunesli | bulutlu | yagmurlu | gunbatimi | gece
__game.world.renderer.info.render            // çizim çağrısı (calls) ve üçgen sayısı
__game.S.islands.venedik                     // adanın kaydı: found, store
```

Adanın kaydını sıfırlamak için: `delete __game.S.islands.venedik`, sonra sayfayı yenile. Bütün kaydı sıfırlamak için başlık ekranındaki "Yeni oyun" düğmesini kullan.

## 4. Adayı kur

[`ADA_TALIMATI.md`](src/islands/ADA_TALIMATI.md) dosyasında her şey ayrıntılı anlatılıyor. Önerilen sıra:

1. **Kıyı ve zemin:** `coast` ve `terrain` ile adanın biçimini ve renklerini ayarla. `harbor` ile iskelenin yönünü seç.
2. **Ana yapılar:** önce büyük kütleleri yerleştir (`kit.hall`, kendi geometrilerin). Her katı nesneye `ctx.C.box` / `ctx.C.circle` ekle.
3. **Keşfedilecek yerler:** 3 ile 10 arası `ctx.place(...)`. Bunlar adanın keşif görevini oluşturur.
4. **İnsanlar ve diyaloglar:** `kit.npc` ile `kit.placeNPC`, ya da `ctx.interact`.
5. **İç mekânlar (isteğe bağlı):** `ctx.room(...)`.
6. **Görev (isteğe bağlı):** durumu `ctx.store` içinde tut, `ctx.marker` ile yol göster.
7. **Canlılık:** `ctx.onUpdate` ile hareket (kayıklar, bayraklar, kuşlar), `ctx.W` ile gece ve yağmura tepki.
8. **Cilalama:** rüzgâr, gece ışıkları, sesler (`ctx.sfx`).

Dış model, doku ya da ses dosyası ekleme. Projenin tamamı gibi her şeyi kodla üret (ayrıntılar talimatta).

## 5. Göndermeden önce test et

Aşağıdakilerin hepsini kendin dene:

- [ ] `npm run build` hatasız tamamlanıyor.
- [ ] Konsolda `[ada]` ile başlayan ya da başka bir hata veya uyarı yok.
- [ ] Gemiyle adana gidiliyor, adadan Lumière'e geri dönülüyor ve Lumière her şeyiyle yerinde.
- [ ] Adadayken sayfayı yenileyip **Devam et** dendiğinde oyun aynı adada başlıyor ve görev durumu korunuyor.
- [ ] Bütün keşif yerleri bulunabiliyor ve görev günlüğünde (**J**) "<Ada>: keşif" görevi tamamlanıyor.
- [ ] Hiçbir binanın, ağacın ya da kayanın içinden geçilmiyor. Görünmez duvara çarpılmıyor.
- [ ] Varsa her odaya girilip çıkılabiliyor ve çıkınca kapının önüne dönülüyor.
- [ ] Gece, yağmur ve gün batımında ada düzgün görünüyor (`__game.setWeather(...)`).
- [ ] Menüde kalite **Orta** iken adanın en kalabalık yerinde `renderer.info.render.calls` 300'ün altında, kare hızı akıcı.
- [ ] Telefon boyutunda (tarayıcının cihaz görünümü) arayüz ve dokunmatik kontroller çalışıyor.
- [ ] Değişikliklerin yalnızca `src/islands/<ada-kimligi>/` içinde (`git status` ile kontrol et).

## 6. Pull request aç

```bash
git add src/islands/<ada-kimligi>
git commit -m "Yeni ada: <Adanın adı>"
git fetch upstream && git rebase upstream/main
git push -u origin ada/<ada-kimligi>
```

GitHub'da `beriltatli/lumiere-satosu` deposunun `main` dalına bir pull request aç. PR açıklamasına şunları yaz:

- Adanın kısa tanıtımı ve keşif yerlerinin listesi
- Varsa görevin özeti (nasıl tamamlanıyor?)
- En az 2 ekran görüntüsü (biri gündüz, biri gece). Fotoğraf modu: **Esc**, sonra "Fotoğraf modu", sonra "PNG"
- En kalabalık yerdeki `renderer.info.render` değerleri (calls, triangles)
- Açtığın issue'nun numarası (`Closes #12` gibi)

## 7. İnceleme

Bakımcı adayı oyunda gezer, kontrol listesine ve [kurallara](src/islands/ADA_TALIMATI.md#kurallar-pr-kontrol-listesi) bakar, gerekirse değişiklik ister. Değişiklikleri aynı dala commit'leyip push'larsan PR kendiliğinden güncellenir.

## Motorda bir şey eksikse

`ctx` API'sinde ihtiyacın olan bir şey yoksa (ör. adaya özel müzik, okçuluk hedefleri, yüzülebilir su), adanın içinde motoru değiştirmeye çalışma. Ayrı bir issue aç ve neye neden ihtiyaç duyduğunu yaz. Motor değişikliği kendi PR'ında incelenir, adan ise onun üzerine kurulur.

## Ada dışı katkılar

Hata düzeltmeleri ve Lumière'e yönelik iyileştirmeler de memnuniyetle karşılanır. Önce bir issue aç, sonra küçük ve tek konulu bir PR gönder. Kod biçemi için çevredeki koda uy: iki boşluk girinti, tek tırnak, Türkçe yorumlar ve kısa değişken adları.
