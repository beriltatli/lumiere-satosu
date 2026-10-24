// Brownstone sıra ev: kahverengi kumtaşı, girişe çıkan stoop merdiveni, ferforje korkuluk, profilli korniş.
import { CELL } from '../core/Materials.js';
export default {
  id:'brownstone', typology:'rowhouse', heights:[10, 20],
  palette:{wall:[0x6b4a3a, 0x7a5644, 0x5f4234]},
  cell:CELL.brownstone, bay:2.6, floor:3.4, unit:[6, 8], floors:[3, 5],
  stoop:true, cornice:'limestone', roof:'flat',
};
