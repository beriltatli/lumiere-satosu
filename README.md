# Lumière Şatosu: Kılıcın Rünleri

Île-de-France şatolarından esinlenen üçüncü şahıs bir keşif ve macera oyunu. Tapınaktaki kılıç yüz yıldır uyuyor. Şato çevresine saklanmış beş rünü bul, onu atölyede şekillendir ve uyandır. three.js r147 ve Vite ile yazıldı. Bütün sesler ve müzik Web Audio ile kodda üretiliyor.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcı kendiliğinden `http://localhost:5173` adresinde açılır. Yayına hazır sürüm için `npm run build` (çıktı `dist/` klasörüne gider), denemek için `npm run preview`.

## Kontroller

| Tuş | İşlev |
|---|---|
| W A S D / oklar | Yürü |
| Shift | Koş · atla dörtnala |
| Boşluk | Zıpla |
| E | Konuş, incele, ata bin/in, kapıları kullan |
| H | Islık çal: at Étoile yanına gelir |
| V | Attayken birinci şahıs / üçüncü şahıs |
| Fareyi sürükle · tekerlek | Kamerayı çevir · yakınlaştır |
| J | Görev günlüğü |
| Esc | Menü (ses, kamera hassasiyeti, görüntü kalitesi, fotoğraf modu) |
| Telefon | Sol başparmak yürür, sağ başparmak kamerayı çevirir, sağ alttaki tuşlar |

## Görevler

1. **Ahır ustası Gaston** (batıdaki ahırın önünde): efsaneyi anlatır, atı Étoile'i verir ve görev günlüğünü açar.
2. **Yakut rün:** fıskiyenin dibinde. Yağmurda su bulanıktır, hava açılınca bakmak gerekir.
3. **Safir rün:** doğu kulesinin balkonunda. Kapı terasın doğu ucundadır.
4. **Zümrüt rün:** doğudaki çit labirentinin tam ortasında.
5. **Altın rün:** şato merdivenlerindeki Yüzbaşı Armand'ın iki bilmecesini bil.
6. **Ametist rün:** tapınağın ardındaki Ay Kapısı yalnız geceleri açılır. Bahçedeki güneş saatiyle zamanı ilerletebilirsin.
7. **Final:** beş rünle tapınaktaki kaideye dokun, kılıcı atölyede şekillendir (bıçak, balçak, malzeme, taş) ve uyandır.

8. **Yan görev, Pyra'nın yumurtası:** Cennet Bağı'ndaki Prenses Aurélie ile konuş, Kelebek Vadisi'ndeki şelalenin yanındaki mor yumurtayı al ve ejderha kafesinin batı kapısına götür.

At Étoile oyunun başından beri şato terasının yanında bekler; pusulada küçük bir işaretle görünür. **H** ile ıslık çalınca yanına gelir. Ata binince kamera binicinin gözüne geçer.

Ayrıca bahçeye, labirente, kuleye, seralara, kış bahçesine, harasa ve şatonun içine saçılmış **30 altın madalyon** var. En iyi süre ve madalyon sayısı kaydedilir.

## Şatonun içi

Terastaki ana kapıda **E** ile içeri girilir. Katlar arasında merdivenlerle yürüyerek çıkılır:

- **Zemin kat:** iki kat yüksekliğinde giriş holü, büyük avize, Kâhya Bernard. Batıda balo/yemek salonu (uzun masa, şömine), doğuda müzik salonu (çalınabilen klavsen).
- **1. kat:** büyük merdivenle holün kuzey balkonuna çıkılır. Batıda Aynalı Galeri, doğuda kontesin yatak odası (cibinlikli yatak, kontesin portresi).
- **2. kat:** balkonun doğusundaki ikinci merdivenle kütüphaneye çıkılır (kitap rafları, yerküre).
- **3. kat:** kütüphanenin ortasındaki döner merdiven kubbedeki rasathaneye çıkar. Teleskoptan bütün malikâne görünür.

İç mekânda 5 madalyon saklı. Çıkmak için holdeki kapıda **E**.

## Dünya

- **Şato ve barok bahçe:** dört çiçek parteri, fıskiye, koni çitler, fenerli yollar, muhafız devriyeleri ve atlı devriye.
- **Haras de Lumière (batı):** büyük ahşap ahır ve rüzgârgülü, saman sundurması, otlakta beş at, beyaz çitli manejde antrenman yapan binici, engeller, güvercinlik, su yalakları ve kır çiçekli çayırlar.
- **Seralar (bahçenin iki yanında):** solda portakal serası (portakal ve limon ağaçları), sağda tropik sera (palmiyeler, eğrelti otları, nilüfer havuzu).
- **Kış bahçesi (ana eksenin önünde, Ay Kapısı'nın ilerisinde):** cam ve demir kubbeli rotunda, iki kanat, palmiyeler, havuz, narenciye saksıları. Geceleri fenerleri yanar.
- **Ejderha kafesi (doğu, labirentin güneyi):** mermer kaide üzerinde altın parmaklıklı, kubbeli dev bir kuş kafesi. İçinde zümrüt pullu, kehribar kanatlı ejderha Pyra ve yuvasında renkli yumurtaları var. Pyra nefes alır, başıyla oyuncuyu izler, kuyruğunu sallar; arada kükreyip ateş püskürür.
- **Kelebek Vadisi:** çiçek kemerli giriş, şelaleli kaya havuzu, nilüferler, kıvrılan dere ve ahşap kemer köprü, palmiyeler, dev yapraklar, rüzgârda sallanan renk renk çiçek tarhları ve yüzlerce kelebek (gece ve yağmurda saklanırlar).
- **Cennet Bağı:** asma sıraları, mor ve yeşil üzüm salkımları, ortada üstü asmayla örtülü mermer pergola, fıskiye ve gül çalıları. Prenses Aurélie pergolanın çevresinde dolaşır.
- **Rüzgâr:** çimen, çiçek, çayır ve ağaçlar rüzgâr yönünde dünya uzayında eğilir. Esinti dalgaları çayır boyunca ilerler. Bayraklar rüzgâra döner ve dalgalanır, taç yaprakları uçuşur. Rüzgâr hava durumuna göre değişir: yağmurda en güçlüdür.
- **Hava ve saat:** güneşli, bulutlu, yağmurlu, gün batımı ve gece kendiliğinden döner. Her biri kendi HDRI ışığını kullanır. Yağmurda at yavaşlar ve fıskiye bulanır. Gece muhafızlar fener taşır, pencereler yanar, Ay Kapısı açılır.

## Saray bahçeleri ve yapıları

Malikâneye 15 yeni yer eklendi. Her birine ilk girdiğinde "Keşfedildi" bildirimi çıkar; keşfedilmemiş en yakın iki yer pusulada altın işaretle görünür, ilerleme görev günlüğünde (Saray bahçelerini keşfet, x/15) izlenir.

**Şatonun arkası (kuzey):**
- **Balo salonu ve kış bahçesi (Orangerie):** cam tonozlu, iki sıra altın başlıklı sütunlu, üç kristal avizeli büyük salon; sütunların arasında saksıda portakal ve limon ağaçları, dama mermer zemin. İçine yürüyerek girilir. Orkestra kürsüsünde **E**: vals çalar, dört çift dans eder.
- **Saray operası ve sanat galerisi (batı):** altı sütunlu portik, alınlık, bakır kubbe, çatıda heykeller. Maestro Valentin bir arya çaldırır ya da galeriyi gezdirir.
- **Kütüphane ve arşiv (doğu):** mansart çatı, gerçek saatle dönen kule saati. Arşivci Anselme el yazmalarını, şatonun tarihini ve henüz bulunmamış rünler için eski kroniklerden bir ipucu anlatır.
- **Rasathane:** 22 m'lik taş kule, yavaşça dönen bakır kubbe ve yarığından çıkan pirinç teleskop, sekizgen harita odası, dışarıda dönen armiller küre. Astronom Hélène ile konuşup teleskoptan gökyüzüne bakılır (gece yıldızlar görünür).

**Güneybatı bahçeleri:**
- **Gül labirenti (Jardin des Roses):** Fransız bahçesi düzeninde, dört çeyreği aynalanmış simetrik çit labirenti. Güllerle kaplı çitler, ortada üç katlı fıskiyeli büyük mermer havuz, caddelerde dört küçük fıskiye ve 16 heykellik galeri (her heykelin kaidesi okunabilir), çeyreklerin köşesinde gül çardakları.
- **Kuğu ve tavus kuşu göleti:** oval gölet, adada bakır kubbeli çay köşkü, adaya mermer kemer köprü, batıdaki dere üstünde ikinci köprü, kıyıda iki çay pavyonu. Yedi kuğu (biri siyah) yüzer; yem standında **E** ile beslenince kıyıya toplanırlar. Tavus kuşları kıyıda dolaşıp arada kuyruklarını açar.
- **Binicilik maneji ve engel parkuru:** kum pist, beyaz çit, dikey/okser/su engelleri, çizgili tenteli tribün. Bir binici parkuru dolaşıp engellerin üstünden atlar.
- **Satranç köşkü:** kubbeli köşkte fildişi ve abanoz takım, çimde dev satranç tahtası. Düşes Mathilde'nin tek hamlede mat problemini çöz.

**Kuzeybatı ve kuzeydoğu:**
- **Şahin yuvası (Fauconnerie):** yarı ahşap kuş evi, tüneklerde başlıklı şahinler, gökte daire çizen gökdoğanlar, dalgalanan av bayrağı. Şahinci Gaspard eldivenindeki "Mistral"ı uçurur; kuş tur atıp eldivene döner.
- **Mermer hamam ve kaplıca:** büyük ve dört küçük kubbeli hamam, mozaik zeminli açık hava sıcak su havuzu, sütunlu galeri, yükselen buhar.
- **Okçuluk ve bıçak atış poligonu:** dört hedefli atış alanı, tenteli atış pavyonu, bıçak tahtası. **E** ile ok at (5 okluk tur, en iyi skor kaydedilir) ya da bıçak fırlat.

**Doğu (üretim):**
- **Saray mutfağı ve gurme fırın:** tuğla mutfak, tüten bacalar, dışarıda taş ekmek fırını, ekmek tezgâhı, üzüm-portakal kasaları, sebze tarhları. Şef Antoine günün tabağını sunar.
- **Parfüm ve esans laboratuvarı:** cam verandada bakır imbik, renkli esans şişeleri, lavanta ve gül tarhları. Mlle Isabeau ile üst, kalp ve dip notayı seçip kendi parfümünü yap.
- **İpek ve kumaş atölyesi:** dut ağaçları, rüzgârda dalgalanan renkli ipek topları, dokuma tezgâhı. Madame Colette sana yeni bir pelerin diker; seçtiğin renk karakterin pelerinine uygulanır ve kaydedilir.
- **Şarap mahzeni (Chai & Caveau):** taş mimarili bina, kemerli mahzen girişi, meşe fıçılar, asma örtülü tadım terası. Sommelier Bastien üç rekolteden birini tattırır.

Sabit parçalar yükleme sırasında malzeme ve bölgeye göre tek ağlarda birleştirilir; böylece yeni alanlar çizim çağrısı sayısını az artırır.

## Atmosfer ve ışık

- **Hacimsel bulutlar:** gökyüzü, 700–1650 m arasındaki bir bulut katmanında ışın yürütülerek (ray marching) çizilir. Yoğunluk, açılışta üretilen döşenebilir 3B Perlin-Worley ve 2B örtü dokularından okunur. Güneş yönünde ışık örneklenir (Beer-Lambert, "powder" etkisi, çift yönlü Henyey-Greenstein saçılması): güneşe bakan kenarlar gümüş gibi parlar, tabanlar koyulaşır. Bulutlar rüzgâr yönünde sürüklenir, hava durumuyla örtüleri değişir: güneşlide dağınık kümülüs, bulutluda parçalı kapalı, yağmurda koyu ve kalın, gün batımında turuncu. Düşük çözünürlüklü bir hedefe çizilip sahnenin derinliğine göre birleştirilir.
- **Bulut gölgeleri:** aynı örtü haritası güneş yönünde yere izdüşürülür; bulutların gölgesi çayır ve binaların üstünden kayar.
- **Yüksekliğe bağlı sis:** uzaklıkla üstel artan, yükseldikçe incelen hava perspektifi; güneşe bakarken sis güneşin rengini alır.
- **Malzemeler:** bütün yüzeylere dünya uzayında renk ve pürüzlülük çeşitliliği eklenir (düz "plastik" görünümü kırar). Zemine yakın duvarlar ve alt yüzeyler daha az gök ışığı alır (temas gölgesi). Metal olmayan yüzeyler HDRI ortam ışığını daha çok yansıtır.
- **Gökyüzü ve güneş:** açık havada gökyüzü daha doygun mavi, zenit daha koyu. Güneş gün boyu güneyden gelir, şatonun ön cephesi aydınlanır.
- **Görüntü:** HDR ara arabellek, 4× MSAA kenar yumuşatma, sinematik renk düzenlemesi (yumuşak S eğrisi, sıcak parlaklar/serin gölgeler, vinyet, ince film greni).
- **Kalite ayarı:** Yüksek: yarım çözünürlüklü bulutlar, 48 adım, 4096 gölge haritası, 4× MSAA. Orta: daha az adım, 2× MSAA. Düşük: çeyrek çözünürlük, MSAA yok. WebGL2 olmayan tarayıcılarda eski düz bulut katmanı kullanılır.

## Klasörler

```
index.html            arayüz iskeleti (başlık, HUD, diyalog, menüler)
src/main.js           oyun döngüsü ve durum makinesi
src/world.js          şato, bahçe, tapınak, muhafızlar, atlar, hava, kılıç, rüzgâr gölgelendiricisi
src/estate.js         haras, seralar, kış bahçesi, çayırlar, bayraklar, uçuşan yapraklar
src/interior.js       şatonun içi: katlar, merdivenler, odalar, mobilyalar
src/sanctuary.js      ejderha kafesi, Kelebek Vadisi, Cennet Bağı, Prenses Aurélie
src/atmosphere.js     hacimsel bulutlar, bulut gölgeleri, sis, malzeme yaması, renk düzenlemesi
src/court.js          saray bahçeleri: gül labirenti, kuğu göleti, opera, balo salonu, rasathane, hamam, mahzen…
src/game/hero.js      oyuncu, binilebilir at, üçüncü şahıs kamera
src/game/content.js   karakterler, rünler, madalyonlar, kule, Ay Kapısı, güneş saati
src/game/maze.js      tohumlu labirent üretimi
src/game/collision.js çarpışma ve zemin yüksekliği
src/game/audio.js     ses ve müzik (Web Audio)
src/game/ui.js        HUD, pusula, diyalog, görev günlüğü
src/game/input.js     klavye, fare, dokunmatik
src/game/save.js      kayıt (tarayıcının yerel deposu)
public/assets/        HDRI, doku ve modeller
```

## Kaynaklar ve lisanslar

Tüm kaynaklar three.js deposunun `examples` klasöründen indirildi (r147).

| Dosya | Kaynak | Lisans |
|---|---|---|
| `hdri/*.hdr` | Poly Haven (royal_esplanade, quarry_01, pedestrian_overpass, venice_sunset, moonless_golf) | CC0 |
| `textures/cim*.jpg` | OpenGameArt, "dark grass" | CC BY 3.0 (atıf gerekir) |
| `textures/mermer_dama*.jpg`, `ahsap.jpg`, `su_normal.jpg` | three.js örnek dokuları | three.js deposu |
| `textures/flare_hex.png` | hackcraft.de | CC0 |
| `textures/flare0.png`, `models/at.glb`, `flamingo.glb`, `papagan.glb`, `leylek.glb` | ROME "3 Dreams of Black" (ro.me) | CC BY-NC-SA 3.0 (ticari olmayan kullanım) |
| `models/cicek.glb` | Kenney Nature Pack | CC0 |

Projeyi ticari olarak kullanacaksan at, kuş modelleri ve `flare0.png` yerine CC0 alternatifleri koymalısın (ör. Poly Haven, Kenney, Quaternius).
