// Boston Gürcü sıra evi: Flaman örgü kırmızı tuğla, beyaz pervaz, siyah panjur, arduvaz çatı ve tepe pencereleri.
import { CELL } from '../core/Materials.js';
export default {
  id:'bostonGeorgian', typology:'rowhouse', heights:[9, 18],
  palette:{wall:[0xffffff]},
  cell:CELL.brick, bay:2.8, floor:3.3, unit:[6.5, 9], floors:[3, 4],
  stoop:false, cornice:'white', roof:'dormer',
};
