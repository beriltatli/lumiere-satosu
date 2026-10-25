// Coğrafi izdüşüm: enlem/boylam -> ada metresi. x doğu, z güney. Merkez: Boğaz'ın güney girişi.
// SCALE: yatay küçültme (1/4). Simge yapılar LANDMARK_SCALE ile ölçeklenir, bu yüzden küçültülmüş haritada da seçilir.
export const CENTER = {lat:41.017, lon:29.003};
export const SCALE = 0.25;
export const LANDMARK_SCALE = 0.55;
const KLAT = 110574, KLON = 111320 * Math.cos(CENTER.lat * Math.PI / 180);
export function project(lat, lon){
  return [(lon - CENTER.lon) * KLON * SCALE, -(lat - CENTER.lat) * KLAT * SCALE];
}
