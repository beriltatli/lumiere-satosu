// New York Art Deco gökdeleni: kireçtaşı, dikey pilastr ritmi, her 4 katta %8 kademe, paslanmaz çelik ışınlı tepe tacı.
import { CELL } from '../core/Materials.js';
export default {
  id:'newYorkArtDeco', typology:'skyscraper', heights:[40, 150],
  palette:{wall:[0xd8cfbf, 0xcfc3ad, 0xe0d6c4], accent:'stainless'},
  cell:CELL.artDeco, topCell:CELL.decoTop, baseCell:CELL.shop, bay:3.4, floor:3.8,
  setback:{every:4, inset:0.08, minFrac:0.34}, crown:'deco', antenna:0.6,
};
