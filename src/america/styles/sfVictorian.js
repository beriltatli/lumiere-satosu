// San Francisco Viktorya evi ("Painted Ladies"): renkli ahşap kaplama, beyaz süs bantları, cumba, sivri alınlık.
import { CELL } from '../core/Materials.js';
export default {
  id:'sfVictorian', typology:'rowhouse', heights:[8, 14],
  palette:{wall:[0x7fb6c9, 0xf2c14e, 0xd96c6c, 0x8fbf8f, 0xb79ed6]},
  cell:CELL.victorian, bay:2.2, floor:3.4, unit:[6, 7.5], floors:[2, 3],
  bayWindow:true, cornice:'white', roof:'gable', stepBase:true,
};
