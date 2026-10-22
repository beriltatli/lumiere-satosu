// Lumière adası: dört yanı deniz. Güneyde düz bir kumsal (kraliyet yapılarının, Zafer Takı meydanının güneyinde),
// iskele, yelkenliler, martılar ve diğer adalara sefer yapan "La Belle Étoile" gemisi.
// Kıyı ve okyanus coast.js'teki ortak ada kurucusuyla çizilir; katkıcı adaları da aynısını kullanır.
import { makeCoast, buildIslandTerrain, makeBoat } from './coast.js';

// merkez fıskiye hizasında; güney kumsalı merkezden 280 m (z ≈ 290), diğer yönlerde ~440 m
export const LUMIERE_COAST = makeCoast({
  cx:0, cz:10, radius:440,
  waves:[[3, 16, 0.7], [5, 9, 2.1], [11, 5, 0.4]],
  flat:{angle:0, dist:280},
  ripple:[[10, 6, 0], [25, 2.2, 1.3]],
});
// iskele x ≈ 24'te güneye uzanır
const PIER_ANGLE = Math.atan2(24, 280);

export function buildSea(world, C){
  const { THREE } = world;
  const T = buildIslandTerrain(world, C, LUMIERE_COAST, {name:'Deniz', ground:world.materials.groundMat, seed:4242});
  const root = T.root;
  let seed = 977; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const pier = T.addPier(PIER_ANGLE, 54);
  // iskeleye bağlı sandal ve sefer gemisi
  T.addBoat(pier.boatAt[0], pier.boatAt[1], pier.yaw + 0.05, 0.55, false);
  const [sx, sz] = pier.toW(pier.hw + 5.2, pier.len - 10);
  const ship = T.addBoat(sx, sz, pier.yaw + Math.PI, 1.35, true, 0, 0x2a1a12);
  ship.bob = 0.8;
  // açıkta gezinen yelkenliler (kıyıdan uzaklık, açı sapması, ölçek, rota)
  [[60, -0.5, 2.2, 0.4], [300, 0.45, 2.6, -0.6], [880, 0.05, 3.0, 1.2], [640, -1.1, 3.0, 2.0], [140, 0.9, 1.6, 0.9], [420, 2.4, 2.4, -1.4], [520, -2.6, 2.8, 2.6]].forEach(([off, da, k, yaw]) => {
    const [x, z] = LUMIERE_COAST.point(PIER_ANGLE + da, 60 + off);
    T.addBoat(x, z, yaw, k, true, 0.6 + rnd() * 0.6);
  });

  /* ---------- martılar ---------- */
  const gullG = new THREE.BufferGeometry();
  gullG.setAttribute('position', new THREE.Float32BufferAttribute([-0.55, 0.22, -0.05, 0, 0.0, 0.12, 0, 0, -0.12, 0.55, 0.22, -0.05, 0, 0.0, 0.12, 0, 0, -0.12], 3)); gullG.computeVertexNormals();
  const gullMat = new THREE.MeshStandardMaterial({color:0xf2f2f0, side:THREE.DoubleSide, roughness:0.6});
  const gulls = [];
  for (let i = 0; i < 14; i++){
    const g = new THREE.Mesh(gullG, gullMat); root.add(g);
    const [cx, cz] = LUMIERE_COAST.point(PIER_ANGLE + (rnd() - 0.5) * 0.8, 15 + rnd() * 70);
    gulls.push({g, cx, cz, r:8 + rnd() * 20, h:9 + rnd() * 14, w:(rnd() < 0.5 ? -1 : 1) * (0.15 + rnd() * 0.2), p:rnd() * 6});
  }

  function update(dt, t, hero, indoor){
    if (indoor || !root.visible) return;
    T.update(dt, t);
    const W = world.W;
    const showGulls = W.night < 0.6 && W.rain < 0.5;
    gulls.forEach(q => {
      q.g.visible = showGulls; if (!showGulls) return;
      const a = t * q.w + q.p;
      q.g.position.set(q.cx + Math.cos(a) * q.r, q.h + Math.sin(t * 0.5 + q.p) * 1.5, q.cz + Math.sin(a) * q.r);
      q.g.rotation.set(0, Math.atan2(-Math.sin(a) * Math.sign(q.w), Math.cos(a) * Math.sign(q.w)), Math.sign(q.w) * 0.25);
      q.g.scale.set(1, Math.sin(t * 7 + q.p), 1);
    });
  }
  return {root, update, dist:T.dist, pier, ship:ship.g, coast:LUMIERE_COAST, makeBoat:(k, s) => makeBoat(world, k, s)};
}
