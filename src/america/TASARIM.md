# Yeni Dünya Adası: tasarım

Amerika'ya özgü mimariden oluşan, Lumière'in güneybatısında açık denizde duran ayrı bir ada.
Bütün kod `src/america/` altında; ana koda yalnız bağlantı satırları eklenir (`main.js`, `dragonride.js`, `audio.js`).

## 0. Projeyle uyum: spesifikasyondan sapmalar

| Spesifikasyon | Projede durum | Karar |
|---|---|---|
| Ada merkezi ≈ (0, 1050) | Yùlóng Adası (520, 1080) merkezli, yarıçapı ~300 m; 700 m genişliğindeki bir ada onun batı yarısıyla çakışır | Merkez **(-600, 1020)**. Yùlóng kıyısına en az 450 m, Lumière'in güney kumsalına ~500 m. Lumière ile Yùlóng'dan siluet olarak görünür (sis 900–1100 m) |
| `SHORE_Z = 300`, iskele `{x:24, z0:292, z1:346}` | Lumière kıyısı `LUMIERE_COAST` (yarıçap 440, güney düzlüğü z ≈ 290); iskele `sea.pier` | Feribot `sea.pier.toW()` ile iskelenin batı yanına yanaşır |
| `hero.zone = 'ada'` ve ayrı `Collision` | `zone` bu projede kamera/iç mekân modu ('ic', 'kule', 'oda'); Yùlóng aynı dünyada aynı çarpışma alanını (`C.shores`) paylaşıyor. Ejderha inişi, kıyı sınırı (`C.bound`), kayıt (`S.player`) ve pusula bu desene bağlı | Ada **Yùlóng deseniyle** kurulur: `buildIslandTerrain(world, C, AMERICA_COAST, {ocean:false})`. Ejderhayla inilir, kıyıdan denize yürünmez, kayıt kendiliğinden çalışır. "Ayrı oyun bölgesi" işini mesafe tabanlı `america.near` yapar: oyuncu adadayken Lumière'in ağır kökleri gizlenir ve güncellenmez; adanın kendi keşif listesi, günlük satırı ve ses stili vardır |
| Anıtlar arası Poisson 120 m ve Mall'da 1 : 1.618 | 700 m'lik adada Lincoln–Washington–Kongre arası 120 m olursa Mall 314 m olur ve adanın yarısını keser | Mall üç yapılı **tek bir eksenel küme** sayılır: Poisson kuralı kümeler arasında uygulanır, küme içinde altın oran korunur (42 m : 68 m) |
| `PLACES` listesine ekle | `PLACES` Lumière'in "bütün bahçeleri keşfettin" sayacı | Adanın kendi listesi var, aynı "Keşfedildi (x/N)" bildirimiyle çalışır ve `S.notes.america.found` içinde tutulur. Ejderha başlıkları da bu listeyi okur |

## 1. Bölge haritası (yerel koordinat; x doğu, z güney; dünya = (-600 + x, 1020 + z))

```
 z
-260   ________________________________________________________________
      /  SEATTLE kıyısı           Göller          ___ BOSTON (organik) \
-200 |      .                 CHICAGO ▓▓ ~GÖL~   /    kırmızı tuğla     |
     |  RUSHMORE ▲▲▲          (60×60 + L treni)   |  NEW YORK ▒▒▒▒       |
-120 |   kayalık tepeler          |  Mississippi  |  Manhattan ızgarası  |
     |                           |                |  ● Times Square      |
 -40 |SF ≋≋ GOLDEN GATE            |                |  ■ Central Park   ◎ | Özgürlük Adası
  0  |(tepeler,      ∩ GATEWAY ARCH (St. Louis)     |  DC: Lincoln─Wash─Kongre (Mall)
     | Viktorya)                 |  ~~ çarklı gemi |                      |
  80 |  ROUTE 66 çölü (mesa, diner, benzinlik)    \                     |
     |                                             \  NEW ORLEANS         |
 160 |____________                 Meksika Körfezi  ▼ French Quarter   /
     \___________________________________________________   MIAMI ░░ /
 260                                                         \_____/
     -350        -200        -60        40        150        260   350  x
```

## 2. Koordinat tablosu (`landmarks.json`; yerel m)

| Kimlik | Bölge | Konum (x, z) | Yükseklik | Yaklaşım (°) | Görüş yarıçapı |
|---|---|---|---|---|---|
| liberty | NY limanı adacığı | (372, -12) | 46 | feribot rotası (KD'den) | 160 |
| lincoln | DC Mall batısı | (186, 40) | 12 | doğudan (Mall) | 90 |
| washington | DC Mall ortası | (228, 40) | 56 | her yönden | 220 |
| capitol | DC Mall doğusu | (296, 40) | 34 | batıdan (Mall) | 160 |
| arch | St. Louis | (14, -6) | 60 | doğudan (nehir) | 240 |
| rushmore | Black Hills | (-150, -150) | 52 (kaya) | güneş yönü (noktasal çarpım > 0.6) | 200 |
| goldengate | SF körfez ağzı | (-338, -24) | 44 (kule) | batıdan ve doğudan | 220 |

Bölge merkezleri: NY (270, -60), Boston (290, -175), Chicago (130, -150) ve gölü (215, -170), St. Louis (40, -10), SF (-300, -40), Route 66 (-170, 95), New Orleans (140, 165), Miami (262, 225).

## 3. Sınıf diyagramı

```
index.js  buildAmerica(world, C, hooks) → {root, C, interact, markers, places, focal, update, enter, leave}
 ├─ core/Terrain.js      kıyı (Fourier serisine çevrilmiş ABD ana hattı → makeCoast), yükseklik haritası, göl, nehir
 ├─ core/Rng.js          Rng (mulberry32), hash2, valueNoise
 ├─ core/Materials.js    paylaşılan malzemeler, canvas dokular, cephe atlası (4×4) + gece pencere gölgelendiricisi
 ├─ core/Batcher.js      layer × malzeme anahtarı → tek merge; tekrar eden öğeler InstancedMesh
 ├─ core/District.js     ızgara / organik parselleme, yükseklik fonksiyonu, stil karışımı, LOD grupları
 ├─ core/Focal.js        eksenel plan, görüş kesimi, karşılama yönü, 64 ışın görünürlük, Poisson, ağırlık
 ├─ core/Structure.js    Structure (abstract): id, style, footprint, seed, lod, build(), colliders(), update()
 │    ├─ typologies/  Skyscraper · Rowhouse · Courtyard · Villa · Diner
 │    └─ landmarks/   StatueOfLiberty · MountRushmore · GoldenGate · WashingtonMonument · GatewayArch · LincolnMemorial · CapitolDome
 ├─ styles/*.js          StyleSpec: {id, typology, palette, ornament, floors, setback…}; import.meta.glob ile kendiliğinden kaydolur
 └─ props/               vehicles (taksi, teleferik, L treni, çarklı gemi, feribot) · neon · flora (palmiye, yosunlu meşe, sonbahar) · street (lamba, yol)
```

Yeni stil eklemek tek dosyadır: `styles/benimStilim.js` içinde bir StyleSpec dışa aktar ve bir bölgenin `mix` tablosuna adını yaz.

## 4. Palet (sRGB hex; kodda `lin()` ile doğrusala çevrilir)

| Malzeme | Renk | Ayar |
|---|---|---|
| Bakır patina (Özgürlük) | `5fa38f` / gölge `3e7d6c` | metalness 0.35, roughness 0.55, akıntı lekeli doku |
| Meşale alevi / yaldız | `ffc35a` (emissive) / `d4af37` | |
| Çelik (Chicago) | `8a9099` | metalness 0.9, roughness 0.35 |
| Cam giydirme cephe | `2b3d4f` | roughness 0.08, envMapIntensity 1.4 |
| Paslanmaz çelik (Arch) | `d0d4d8` | metalness 1.0, roughness 0.16 |
| International Orange | `c0362c` | roughness 0.6 |
| Yule mermeri (Lincoln) | `eeeae2` | roughness 0.3, gri damarlar |
| Washington Anıtı | alt `e9e3d6`, üst `dcd5c6` | taş değişimi 2/3 yükseklikte |
| Granit (Rushmore) | `b9b4ac`, çatlak `8f8a83` | flatShading, vertex displacement |
| Kırmızı tuğla (Boston) | `9c4a36`, harç `d9cfc0`, pervaz `f2efe8`, panjur `1d1d1f` | Flaman örgü doku |
| Brownstone | `6b4a3a`, ferforje `1b1b1d` | roughness 0.85 |
| New Orleans | sıva `e8c48a` / `e59a7e` / `f3e6c8`, panjur `2f5a3a` | alpha-test ferforje balkon dokusu |
| SF Viktorya | `7fb6c9` `f2c14e` `d96c6c` `8fbf8f` `b79ed6` | beyaz süs bantları |
| Miami | `f6c6c9` `a8e0d8` `fff1b8` `fafafa`; neon `ff3fa4` `29e3ff` `9dff5c` | neon toneMapped:false, titreşim |
| Art Deco kireçtaşı | `d8cfbf` | her 4 katta %8 kademe |

Pencereler: tek atlas (4×4 pencere çeşidi). Cephe gölgelendiricisi her pencere bölmesini `fract(uv)` ile atlas hücresine eşler (`textureGrad` ile dikişsiz). Duvar rengi köşe rengiyle boyanır, pencere camı boyanmaz. Gece pencerelerin tohumlu %35'i yanar.

## 5. Bütçe ve LOD

- Her bölgenin üç katmanı var: **yakın** (kütle + süsler), **orta** (kütle + pencere dokusu), **uzak** (bina başına tek kutu). Kamera–bölge uzaklığına göre değişir: 0–220 m, 220–480 m, 480 m ve ötesi.
- Lumière'den bakınca yalnız uzak katman çizilir. Adadayken Lumière'in ağır kökleri gizlenir.
- Hedef: ada görünürken en fazla +150 çizim çağrısı ve +1,5 M üçgen. Ölçüm başsız tarayıcıda `renderer.info` ile yapılır.
- Işık: yeni güneş ya da HDRI yok; en fazla 6 neon PointLight (oyuncuya en yakın olanlar yanar).
