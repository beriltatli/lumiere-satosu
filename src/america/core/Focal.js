// Odak noktaları (landmark/focal point) matematiği.
// FocalPoint: {id, pos:{x, z} (dünya), height, facing (yaw), approach (yaw: kamera bu yönden bakar), viewRadius, weight}
// Yaw kuralı projeyle aynı: yaw = atan2(dx, dz); 0 güneye (+z) bakar.

export const PHI = (1 + Math.sqrt(5)) / 2;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

/** a) Eksenel plan (L'Enfant): başlangıç noktasından dir yönünde üç nokta; aralıklar 1 : φ, toplam uzunluk L. */
export function axialPlan(origin, dir, L){
  const d1 = L / (1 + PHI), d2 = L - d1, n = Math.hypot(dir.x, dir.z), ux = dir.x / n, uz = dir.z / n;
  return [{x:origin.x, z:origin.z}, {x:origin.x + ux * d1, z:origin.z + uz * d1}, {x:origin.x + ux * L, z:origin.z + uz * L}].map((p, i) => Object.assign(p, {gap:[0, d1, d2][i]}));
}
/** b) Görüş kesimi: cadde başlangıcından odak noktasına bakan birim yön. */
export function vistaDir(start, focal){ const dx = focal.x - start.x, dz = focal.z - start.z, n = Math.hypot(dx, dz) || 1; return {x:dx / n, z:dz / n, yaw:Math.atan2(dx, dz)}; }
/** c) Karşılama: anıt gelen rotaya döner (rota noktası → anıt yönünün tersi). */
export function welcomeYaw(focal, from){ return Math.atan2(from.x - focal.x, from.z - focal.z); }
/** c) Güneşe bakan yüz: yatay normal (yaw) ile güneş vektörü noktasal çarpımı; > min olan en yakın yaw'ı döndürür. */
export function sunFacingYaw(sun, preferYaw, min = 0.6, tilt = 0.25){
  const score = y => { const nx = Math.sin(y), nz = Math.cos(y), l = Math.hypot(1, tilt); return (nx * sun.x + tilt * sun.y + nz * sun.z) / l; };
  // tercih edilen yöne en yakın, eşiği geçen yaw; hiçbiri geçmezse en iyi skor
  let best = null, top = preferYaw;
  for (let k = 0; k <= 180; k++) for (const sg of [1, -1]){ const y = preferYaw + sg * k * Math.PI / 180; if (best === null && score(y) > min) best = y; if (score(y) > score(top)) top = y; }
  const yaw = wrap(best ?? top);
  return {yaw, dot:score(yaw)};
}

/** d) Görünürlük: 64 yönlü ışın taraması. heightAt(x, z) o noktadaki bina yüksekliği (yoksa 0).
 *  Görüş çizgisi: viewRadius uzaklıktaki 1.7 m göz yüksekliğinden anıtın tepesine. Engellenen ışın oranını döndürür. */
export function occlusion(f, heightAt, rays = 64, step = 4){
  let blocked = 0; const blockers = [];
  for (let r = 0; r < rays; r++){
    const a = r / rays * Math.PI * 2, dx = Math.sin(a), dz = Math.cos(a);
    for (let s = step * 2; s < f.viewRadius; s += step){
      const allow = f.height + (1.7 - f.height) * s / f.viewRadius, h = heightAt(f.pos.x + dx * s, f.pos.z + dz * s);
      if (h > allow){ blocked++; blockers.push({x:f.pos.x + dx * s, z:f.pos.z + dz * s, allow}); break; }
    }
  }
  return {ratio:blocked / rays, blockers};
}
/** d) Görüş koridoru koruması: oran > limit ise görüş yarıçapı içindeki parsellerin yüksekliği görüş çizgisine indirilir. */
export function protectCorridor(f, lots, heightAt, limit = 0.4){
  let res = occlusion(f, heightAt), passes = 0;
  while (res.ratio > limit && passes < 6){
    passes++;
    for (const lot of lots){
      const d = Math.hypot(lot.cx - f.pos.x, lot.cz - f.pos.z); if (d > f.viewRadius || d < 1) continue;
      const allow = f.height + (1.7 - f.height) * d / f.viewRadius;
      if (lot.h > allow) lot.h = Math.max(lot.hMinAbs || 6, allow * (1 - 0.1 * passes));
    }
    res = occlusion(f, heightAt);
  }
  return Object.assign(res, {passes});
}
/** e) Poisson-disk: her çift arası en az minD (aynı kümedekiler hariç). İhlalleri listeler. */
export function poissonCheck(list, minD = 120){
  const bad = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){
    const a = list[i], b = list[j]; if (a.cluster && a.cluster === b.cluster) continue;
    const d = Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z); if (d < minD) bad.push([a.id, b.id, Math.round(d)]);
  }
  return bad;
}
/** e) Kadraj ayrışması: her anıtın yaklaşım kamerasından bakınca başka bir anıt ≥ minDeg ayrık olmalı; değilse yaklaşım yönü döndürülür. */
export function separateApproaches(list, minDeg = 15, fogFar = 900){
  const min = minDeg * Math.PI / 180;
  for (const f of list){
    for (let tries = 0; tries < 24; tries++){
      const cam = camOf(f), dir = Math.atan2(f.pos.x - cam.x, f.pos.z - cam.z);
      const clash = list.find(o => o !== f && !(o.cluster && o.cluster === f.cluster) && Math.hypot(o.pos.x - cam.x, o.pos.z - cam.z) < fogFar && Math.abs(wrap(Math.atan2(o.pos.x - cam.x, o.pos.z - cam.z) - dir)) < min);
      if (!clash) break;
      f.approach = wrap(f.approach + (tries % 2 ? -1 : 1) * (tries + 1) * 5 * Math.PI / 180);
    }
    f.separation = minSeparation(f, list);
  }
}
/** Yaklaşım kamerası: anıtın approach yönünde, boyuna göre uzaklıkta */
export function camOf(f){ const r = Math.max(30, f.height * 1.6); return {x:f.pos.x - Math.sin(f.approach) * r, z:f.pos.z - Math.cos(f.approach) * r, y:Math.max(4, f.height * 0.45)}; }
function minSeparation(f, list){
  const cam = camOf(f), dir = Math.atan2(f.pos.x - cam.x, f.pos.z - cam.z); let m = 180;
  for (const o of list){ if (o === f || o.cluster && o.cluster === f.cluster) continue; m = Math.min(m, Math.abs(wrap(Math.atan2(o.pos.x - cam.x, o.pos.z - cam.z) - dir)) * 180 / Math.PI); }
  return Math.round(m);
}
/** f) Hiyerarşi: weight = height / log(1 + mesafe) */
export const focalWeight = (f, x, z) => f.height / Math.log(1 + Math.max(1, Math.hypot(f.pos.x - x, f.pos.z - z)));
