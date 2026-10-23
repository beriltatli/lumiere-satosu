

# Lumière Şatosu: Kılıcın Rünleri

Île-de-France şatolarından esinlenen üçüncü şahıs bir keşif ve macera oyunu. Tapınaktaki kılıç yüz yıldır uyuyor. Şato çevresine saklanmış beş rünü bul, onu atölyede şekillendir ve uyandır. three.js r147 ve Vite ile yazıldı. Bütün sesler ve müzik Web Audio ile kodda üretiliyor.

## Tanıtım videosu


https://github.com/user-attachments/assets/b813c7f7-79e2-4376-a117-89be9dda47f2



[docs/tum-alanlar.mp4](docs/tum-alanlar.mp4) · 1 dk 55 sn, 960×540, 8,9 MB: Lumière'in ve Yùlóng Adası'nın bütün bölgeleri ve bina içleri. Kısa sürüm: [docs/tanitim.mp4](docs/tanitim.mp4) (61 sn).

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

## Ejderha Pyra ile uçuş

Ejderha kafesinin batı kapısının yanında **E** ile Pyra'ya binersin. Pyra kafesten çıkar, sen sırtındaki eyere oturursun.

| Tuş | Uçuşta |
|---|---|
| Boşluk | Havalan / yüksel |
| Shift | Dal (dalışta hızlanır) |
| W / S | Hızlan / yavaşla, havada asılı kal |
| A / D · fareyi sürükle | Dön (ejderha dönüşe yatar), fareyle yukarı aşağı da yönlendirilir |
| F | Ateş püskürt |
| C veya V | Kamera: binici gözü (sağ omuz üstü, boyun ve baş önde) / takip |
| T | Zamanı hızlandır (sonraki hava ve saat) |
| O | Fotoğraf kaydet |
| E | İn: Pyra yere konar, sen inersin, o kafesine döner |

Ekranda irtifa, hız ve yerden yükseklik ("24 m · 1,0 m/sn · yerden 20 m") ile altında bulunduğun yer ("Konum: Kız Kulesi" gibi) görünür. Bir yerin üstüne geldiğinde adı büyük harflerle belirir. Alçak uçarken binalara çarpmaz, uçtuğun yerler keşfedilmiş sayılır.

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

## Kraliyet yapıları

Saray bahçeleri listesine 12 yer daha eklendi (toplam 27). Hepsi pusulada ve görev günlüğünde izlenir.

**Güney girişi:**
- **Kuğu Deresi ve gondol iskelesi:** malikânenin güneyinden geçen 300 m'lik mermer kenarlı kanal. Çizgili gömlekli, hasır şapkalı gondolcuların kullandığı gondollar soylu çiftleri gezdirir, kanalın uçlarında dönüş yapar. Kuğular süzülür. İskelede Gondolcu Luigi ile ya da iskelede **E** ile gondola binip sinematik bir gezintiye çıkarsın (**E** ile inersin).
- **Kahramanlar Yolu:** kış bahçesinden kanala uzanan mermer yürüyüş yolu. 14 heykel (Augustus, Athena, Herakles, Nike, Şarlman, Leonidas, Orpheus…) servi ağaçları ve fenerlerle sıralanır; iki yanda İyon sütunlu Greko-Romen tapınakçıklar vardır. Her heykelin kaidesi okunur.
- **Zafer Takı ve dikilitaşlar:** kanalın üstündeki kemerli köprünün ardında 16 m'lik zafer takı. Kabartma panolar, altın kemer, "VICTORIIS · LVMINIS · MDCCXXIV" yazıtı ve tepede yeşil patinalı dört atlı zafer arabası var. Dört yanda hiyeroglifli, altın uçlu dikilitaşlar yükselir.
- **Işıldayan Gece Bahçesi:** yalnız gece açan mavi, mor ve yeşil çiçekler, ışıldayan mantarlar ve nilüferler, salkımları parlayan mor pergola, pirinç fenerler, kristal mumluklar ve ateşböcekleri. Gündüz çiçekler kapanır.

**Merkez:**
- **Saat kulesi ve çan:** 43 m'lik kule. Dört kadranı gerçek saati gösterir; ön cephedeki cam pencereden pirinç dişliler dönerken görünür. Her saat başı Lumière ezgisini çalar, sonra çan saati vurur (uzaklık arttıkça ses azalır). Saatçi Augustin ezgiyi istediğinde de çaldırır.

**Kuzey (kültür mahallesi):**
- **Diplomasi ve ziyafet pavyonu:** yüksek tavanlı, boyalı gök tavanlı, revaklı konuk evi. İçinde uzun ziyafet masası, yaldızlı sandalyeler ve mumlar, taht kürsüsü, yabancı krallıkların sancakları, dünya haritaları ve yerküre var. Şansölye Delacroix ile Venedik, Osmanlı ve İspanya elçilerini ağırlayıp antlaşmalar yaparsın (x/3).
- **Maskeli balo ve Ayna Galerisi:** Versailles düzeninde, kemerli pencerelerin karşısında aynalarla kaplı bir duvar. Aynalar salonu gerçek zamanlı yansıtır; boyalı tavan ve beş kristal avize var. Maskeli çiftler dans eder (gece kendiliğinden, gündüz isteyince). Maske masasında kendine bir Venedik maskesi takabilirsin. Maskeli Markiz saray dedikodularını fısıldar.
- **Simya laboratuvarı (rasathanenin yanında):** yuvarlak taş kule, yeşil ışıklı kaynayan kazan, renkli iksir şişeleri, imbik ve şifalı ot tarhları. Simyacı Bertrand ile bir ot ve bir taş seçerek iksir yaparsın: Rüzgâr İksiri seni 75 saniye hızlandırır.
- **Kuyumcu ve terzi atölyesi:** vitrinlerde dönen elmas, safir, yakut ve zümrütler, revakta saray elbiseleri giymiş mankenler. Kuyumcu Lucien seçtiğin taşla bir kolye yapar; kolye karakterinin boynunda görünür.
- **Uşak ve hizmetkâr akademisi:** gümüş tepsili uşaklar ve nedimeler avluda tur atarak eğitim yapar. Baş Uşak Fernand'ın teftişinde sıraya girip selam verirler.

**Batı:**
- **Av köşkü ve av arazisi:** çitle çevrili korulukta geyikler (üçü boynuzlu) ve tavşanlar serbestçe dolaşır, yaklaşınca kaçarlar. Taş ve ahşap av köşkünün sundurması, odun yığını ve boynuzlu kapısı var. Avcıbaşı Mathurin köşkün tarihini anlatır.

**Yeraltı:**
- **Gizli geçitler ve yeraltı sığınağı:** kütüphanenin kapısındaki kırmızı ciltli kitabı çekince raf döner ve merdiven aşağı iner. Meşaleli, tonozlu taş koridorlar şarap mahzenine, av arazisindeki gizli kapağa ve ranzalı, erzaklı bir sığınak odasına çıkar. Sığınaktaki sandıkta Kontes'in notu saklıdır. Geçidi bulduktan sonra mahzenden ve av arazisindeki kapaktan da girilebilir.

## Bina içleri

Kapısı olan her binaya kapının önünde **E** ile girilir; içerideki kapıda **E** ile çıkılır. Odalar ilk girişte kurulur.

- **Lumière:** Saray Operası (sahne, localar, klavsen), Saray Kütüphanesi (iki katlı raflar, galeri), rasathanenin harita odası, şahin evi, mermer hamam, saray mutfağı, parfüm laboratuvarı, ipek atölyesi, şarap evi ve mahzen, saat kulesinin makine odası, av köşkü, kuyumcu ve terzi atölyesi, uşak akademisi, haras ahırı ve şato ahırı.
- **Yùlóng Adası:** Yüce Uyum Salonu (ejderha tahtı), Huzur Salonu (imparatorluk kütüphanesi), pagodanın Buda salonu, porselen, ipek, halı ve yeşim atölyeleri, çay fermantasyon evi ve on köy evi.

## Yùlóng Adası (Çin adası)

Lumière'in güneydoğusunda, güney kumsalından ~570 m açıkta, ufukta pagodası ve karst kuleleriyle görünen bir Çin imparatorluk adası. **Pyra ile uçarak** gidilir: kafesten kalk, güneydoğuya uç, adaya in (**E**). Pyra seni bırakıp Lumière'deki kafesine döner; dönmek için adanın kuzeybatısındaki **Ejderha Terası**'nda gonga vur.

- **Yasak Şehir:** kırmızı surlar ve sarı sırlı kiremitler, Öğle Kapısı, köşe kuleleri, altın su deresi ve beş mermer köprü, üç katlı mermer teras üstünde çift saçaklı Yüce Uyum Salonu, bronz kazanlar ve aslanlar. Güneyde Paifang ve taş muhafızlı imparatorluk yolu.
- **Çin Seddi:** doğu sırtı boyunca kıvrılır, iki ucu denize dalar (güney ucu Yaşlı Ejderha Başı). Gözetleme kuleleri ve "Göğün Altındaki İlk Geçit"; Komutan Qī işaret ateşlerini kuleden kuleye yakar.
- **Bulut Çanı Tapınağı:** dokuz katlı pagoda, dev bronz çan, tütsü kazanı, Yin-Yang denge bahçesi.
- **Doğa:** bambu ormanı ve pandalar, Ay Köprülü lotus-koi göleti ve su köşkü, teraslı çay tepesi ve tepedeki çay köşkü, çam, erik çiçeği ve söğütler, denizden yükselen karst kuleleri.
- **Zanaat çarşısı:** porselen (ejderha fırını), ipek (dut bahçesi), halı ve yeşim atölyeleri; çay fermantasyon evi.
- **Yüzen pazar ve ejderha kayıkları:** Kayıkçı Lóng Bō ile Ejderha Kayığı Şenliği yarışı.
- **Yùlóng'un ejderhası:** ~46 m uzunluğunda, kanatsız, altın pullu Çin ejderhası; yeşil-kırmızı yeleleri, beş tırnaklı ayakları ve geyik boynuzlarıyla alevli inciyi kovalayarak adanın üstünde kıvrılır.
- **Dokuz Ejderha Duvarı** ve Öğle Kapısı önünde ejderha sarılı mermer **huabiao** sütunları; döşeli saray avlusu, bonsai saksıları, bronz turna ve kaplumbağa, sancaklar.
- **Yùlóng Köyü:** gri tuğlalı, kiremit çatılı on köylü evi (kapılarda kırmızı yeni yıl dizeleri, "福", fenerler, kuruyan mısır ve biberler), meydanda kuyu, dilek kurdeleli yaşlı ağaç, taş değirmen, tavuklar, sebze tarlaları ve köylüler.
- **Prenses Lìhuá** lotus göletinin kıyısında: beyaz saray makyajı, saç iğneleri, yelpaze; yelpaze dansı kültür puanı verir.
- **Bina içleri (E ile kapıdan girilir):** Yüce Uyum Salonu'nda ejderha tahtı ve İmparator, pagodada Buda salonu, dört zanaat atölyesi, çay fermantasyon evi ve on köy evinin her biri (tuğla yatak "kang", ocak, ata sunağı, ev sahibi).

**Oyun:** Ustalarla üretime başla; her aşamada doğru usulü seçmek ürünün kalitesini belirler (Sıradan / İnce / İmparatorluk). Pyra her Lumière'den gelişte heybesinde Bordeaux şarabı ve Grasse parfümü getirir; Bakan Wáng Ān'da bunları Çin hazineleriyle takas et. Takaslar **prestij**, ritüeller (çay seremonisi, çan, tütsü, meditasyon, koi, pandalar, işaret ateşleri, şenlik) **kültür puanı** kazandırır; kültür arttıkça takaslar daha değerli olur. Prestijle unvanlar açılır: Yabancı konuk → Saray misafiri → Fransız elçisi → Mandarin dostu → Ejderha Tahtı'nın dostu (Yeşim Ejderha Mührü). Ada müziği pentatoniktir.

## Adalar arası sefer: katkıcı adaları

Lumière'in güney iskelesinin ucundaki **La Belle Étoile** gemisine (ya da Kaptan Jean-Baptiste'e) **E** ile binilince katkıcıların eklediği adalara sefer yapılır. Her ada `src/islands/<ada>/island.js` dosyasında tek bir tanımdır. Oyun bu dosyaları kendiliğinden bulur ve ana koda dokunmak gerekmez. Adalar ilk ziyarette kurulur ve aynı anda yalnız biri görünür. Kıyı, okyanus, iskele, keşif görevi ve kayıt sistemden gelir.

Kendi adanı eklemek için: [CONTRIBUTING.md](CONTRIBUTING.md) (adım adım süreç) ve [src/islands/ADA_TALIMATI.md](src/islands/ADA_TALIMATI.md) (kurallar ve API). Çalışan örnek: [src/islands/_sablon/island.js](src/islands/_sablon/island.js).

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
src/royal.js          kanal ve gondollar, Kahramanlar Yolu, Zafer Takı, gece bahçesi, saat kulesi, Ayna Galerisi, gizli geçitler…
src/kit.js            ortak yapı kiti: bina, sütun, heykel, figür, tabela, birleştirme
src/court.js          saray bahçeleri: gül labirenti, kuğu göleti, opera, balo salonu, rasathane, hamam, mahzen…
src/china.js          Yùlóng Adası: Yasak Şehir, Çin Seddi, pagoda, bambu ve pandalar, çay tepesi, atölyeler, takas ve prestij
src/coast.js          ada kıyısı, kumsal, okyanus, iskele (aynı denizde birden çok ada)
src/longdragon.js     Yùlóng'un uzun Çin ejderhası (her karede yeniden dizilen gövde)
src/rooms.js          bina içleri: kapıdan girilen, ilk girişte kurulan odalar
src/islands/index.js  takımada: katkıcı adalarını bulur, doğrular, gemiyle sefer, ada başına çarpışma ve kayıt
src/islands/_sablon/  yeni ada şablonu (yüklenmez; kopyalanır)
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
