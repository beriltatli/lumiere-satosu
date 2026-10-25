// Chicago Okulu: çelik iskelet, üç parçalı geniş "Chicago penceresi", terrakota kaplama, ağır korniş.
import { CELL } from '../core/Materials.js';
export default {
  id:'chicagoSchool', typology:'skyscraper', heights:[24, 70],
  palette:{wall:[0xc8a882, 0xb88f6a, 0xd6c2a4]},
  cell:CELL.chicago, topCell:CELL.chicago, baseCell:CELL.shop, bay:4.8, floor:3.9,
  setback:null, crown:'cornice',
};
