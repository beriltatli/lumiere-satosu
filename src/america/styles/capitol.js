// Neoklasik resmi yapı (Washington): beyaz mermer, sütunlu cephe, alınlık. Mall çevresindeki bakanlık binaları.
import { CELL } from '../core/Materials.js';
export default {
  id:'capitol', typology:'skyscraper', heights:[14, 24],
  palette:{wall:[0xeeeae2, 0xe6e0d4]},
  cell:CELL.office, topCell:CELL.marble, baseCell:CELL.marble, bay:3.6, floor:4.4,
  setback:null, crown:'pediment',
};
