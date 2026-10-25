// Hútòng Adası renk paleti. Bütün yapılar renklerini buradan alır; tonu değiştirmek için yalnız bu dosyaya dokun.
// Renkler sRGB hex (ADA_TALIMATI.md: build bitince kit hepsini bir kez doğrusal düzene çevirir).
//
// Oran kuralı (Pekin mahallesi): yüzeylerin ~%70'i gri (tuğla, kiremit, taş), ~%20'si ahşap ve toprak,
// ~%10'u kırmızı ve altın vurgu (kapı, sütun, fener, kuşak). Kırmızı az kullanıldıkça daha çok göze çarpar.

export const P = {
  /* ---------- gri katman: hutong duvarları, siheyuan çatıları, kaldırım ---------- */
  brick:      0x7c8085,   // 青砖 gök-gri tuğla
  brickDark:  0x5a5e63,   // duvar dibi, gölgede kalan tuğla
  mortar:     0xb4b4ae,   // derz, duvar başlığı
  tile:       0x575d62,   // 灰瓦 gri kil kiremit
  paving:     0x8e8b83,   // sokak taşı
  courtyard:  0x9d978b,   // avlu tuğla döşemesi

  /* ---------- kırmızı vurgu ---------- */
  vermilion:  0xa8261d,   // 朱红 sütun ve kiriş
  lacquer:    0x7a1a14,   // 漆 kapı kanadı, koyu kırmızı
  lanternDay: 0xb0201a,   // fener: gündüz mat kırmızı
  lanternNight:0xff6a2a,  // fener: gece içten yanan turuncu-kırmızı

  /* ---------- altın ve boyalı kuşak ---------- */
  gold:       0xd4af37,
  lapis:      0x1f4a6e,   // dougong kuşağının mavisi
  malachite:  0x2f7a5c,   // dougong kuşağının yeşili
  paper:      0xf2e3c0,   // kafesli pencere kâğıdı

  /* ---------- anıtlar ---------- */
  heaven:     0x2b4f9a,   // Tiān Tán'ın lacivert sırlı kiremidi (gök)
  marble:     0xeeebe3,   // 汉白玉 beyaz mermer teras
  rammedEarth:0xc39b66,   // 夯土 tulou'nun sıkıştırılmış toprak duvarı
  wood:       0x6b4428,
  woodDark:   0x3e2618,

  /* ---------- doğa ---------- */
  bamboo:     0x8fae4a,
  bambooOld:  0xa9a35a,
  bambooLeaf: 0x4f8a34,
  water:      0x173d3b,
  lotus:      0x3f7a3a,
  koi:        [0xff6a1a, 0xffffff, 0xe8381c, 0xffb21a, 0xf4f0e8, 0x1a1a1a],

  /* ---------- zemin ---------- */
  ground:     0xb7b98e,
  sand:       0xcdb68c,
  grass:      0x8a9f58,
  shallow:    0x2a9c98,
  deep:       0x0a3348,
};

// Wǔ Xíng (五行): beş element, 相生 (üretme) döngüsü sırasıyla. Pagodanın katları alttan üste bu sırayla dizilir.
export const WU_XING = [
  {key:'mu',   hanzi:'木', name:'Ağaç',  color:0x3f7a4a},
  {key:'huo',  hanzi:'火', name:'Ateş',  color:0xb3261e},
  {key:'tu',   hanzi:'土', name:'Toprak', color:0xd9a62a},
  {key:'jin',  hanzi:'金', name:'Metal', color:0xe8e4da},
  {key:'shui', hanzi:'水', name:'Su',    color:0x1c2a3a},
];

export const FONT = '"PingFang SC","Hiragino Sans GB","Songti SC","Noto Serif SC",serif';
