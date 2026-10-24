// Modern cam kule: koyu çelik ve cam giydirme cephe, düz çatı, teknik kat ve anten.
import { CELL } from '../core/Materials.js';
export default {
  id:'chicagoModern', typology:'skyscraper', heights:[60, 165],
  palette:{wall:[0x8a9099, 0x6a7078]},
  cell:CELL.glass, topCell:CELL.steel, baseCell:CELL.glass, bay:3.2, floor:3.7,
  setback:{every:12, inset:0.06, minFrac:0.6}, crown:'glass', antenna:0.5,
};
