// Hareketli öğeler: sarı taksiler (ızgara caddelerinde döngüler), Chicago "L" treni, SF teleferiği,
// Mississippi'de çarklı buharlı gemi ve Lumière–New York feribotu. Her biri update(dt, t) verir.
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const nonIdx = g => (g.index ? g.toNonIndexed() : g);
const merge = list => mergeBufferGeometries(list.map(nonIdx));

/** Kapalı ya da açık çoklu çizgi üzerinde uzunluk parametresiyle konum ve yön */
export function pathOf(pts, closed = false){
  const P = closed ? pts.concat([pts[0]]) : pts, L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const total = L[L.length - 1];
  return {total, at(s, out){
    s = closed ? ((s % total) + total) % total : Math.max(0, Math.min(total, s));
    let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1), a = P[i - 1], b = P[i];
    out.x = a[0] + (b[0] - a[0]) * k; out.z = a[1] + (b[1] - a[1]) * k; out.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    if (a.length > 2) out.y = a[2] + (b[2] - a[2]) * k;
    return out;
  }};
}

/** Taksiler: loops = [{pts:[[x,z]…], y}] dikdörtgen sokak döngüleri; her döngüde birkaç taksi. */
export function makeTaxis(THREE, M, parent, loops, perLoop = 3){
  const body = merge([new THREE.BoxGeometry(1.8, 0.7, 4.4).translate(0, 0.65, 0), new THREE.BoxGeometry(1.6, 0.55, 2.2).translate(0, 1.25, -0.2)]);
  const glass = merge([new THREE.BoxGeometry(1.62, 0.4, 2.0).translate(0, 1.25, -0.2), new THREE.BoxGeometry(0.7, 0.18, 0.3).translate(0, 1.62, -0.2)]);
  const wheels = merge([[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]].map(([x, z]) => new THREE.CylinderGeometry(0.34, 0.34, 0.24, 10).rotateZ(Math.PI / 2).translate(x, 0.34, z)));
  const cars = []; loops.forEach(lp => { const P = pathOf(lp.pts, true); for (let i = 0; i < perLoop; i++) cars.push({P, y:lp.y, s:i / perLoop * P.total + Math.random() * 10, v:7 + Math.random() * 4}); });
  const n = cars.length, mk = (g, m) => { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = true; im.frustumCulled = false; parent.add(im); return im; };
  const B = mk(body, M.solid(0xf2c12e, {roughness:0.35, metalness:0.2})), Gl = mk(glass, M.glassLobby), Wh = mk(wheels, M.solid(0x161616, {roughness:0.8}));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), o = {};
  return (dt) => {
    cars.forEach((c, i) => { c.s += c.v * dt; c.P.at(c.s, o); m4.compose(p.set(o.x, c.y, o.z), q.setFromAxisAngle(up, o.yaw), s); B.setMatrixAt(i, m4); Gl.setMatrixAt(i, m4); Wh.setMatrixAt(i, m4); });
    B.instanceMatrix.needsUpdate = Gl.instanceMatrix.needsUpdate = Wh.instanceMatrix.needsUpdate = true;
  };
}

/** Chicago "L": yükseltilmiş halka hat (çelik sehpalar, ray kirişi) ve üç vagonlu tren */
export function makeLTrain(THREE, M, B, parent, loop, y0, h = 7){
  const P = pathOf(loop, true), o = {};
  const col = new THREE.BoxGeometry(0.5, h, 0.5).translate(0, h / 2, 0), beam = new THREE.BoxGeometry(5.2, 0.4, 0.4).translate(0, h, 0);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s1 = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let d = 0; d < P.total; d += 9){ P.at(d, o); m4.compose(p.set(o.x, y0, o.z), q.setFromAxisAngle(up, o.yaw), s1); [-2.4, 2.4].forEach(dx => { const mm = m4.clone().multiply(new THREE.Matrix4().makeTranslation(dx, 0, 0)); B.instance('mass', 'L:col', col, M.steel, mm); }); B.instance('mass', 'L:beam', beam, M.steel, m4); }
  // ray kirişi: kapalı şerit
  const pts = loop.concat([loop[0]]);
  for (let i = 0; i + 1 < pts.length; i++){ const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), g = new THREE.BoxGeometry(4.6, 0.5, L + 4.6); g.rotateY(Math.atan2(bx - ax, bz - az)); g.translate((ax + bx) / 2, y0 + h + 0.45, (az + bz) / 2); B.add('mass', 'rail', g); }
  const train = new THREE.Group(); parent.add(train);
  const cars = [0, 1, 2].map(i => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 11), M.solid(0x9aa4ae, {metalness:0.6, roughness:0.4})); b.position.y = 1.9; b.castShadow = true; g.add(b); const st = new THREE.Mesh(new THREE.BoxGeometry(2.84, 0.5, 11.02), M.solid(0x8a1a2a)); st.position.y = 1.0; g.add(st); const w = new THREE.Mesh(new THREE.BoxGeometry(2.86, 0.8, 10), M.glassLobby); w.position.y = 2.3; g.add(w); train.add(g); return g; });
  let sPos = 0;
  return (dt) => { sPos += dt * 11; cars.forEach((g, i) => { P.at(sPos - i * 11.6, o); g.position.set(o.x, y0 + h + 0.7, o.z); g.rotation.y = o.yaw; }); };
}

/** SF teleferiği: yokuş sokakta ileri-geri; pts = [[x, z, y]…] (y araziden) */
export function makeCableCar(THREE, M, B, parent, pts, sfx){
  const P = pathOf(pts, false), o = {};
  const car = new THREE.Group(); parent.add(car);
  const add = (g, m, x, y, z) => { const me = new THREE.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; car.add(me); return me; };
  add(new THREE.BoxGeometry(2.4, 0.5, 8), M.solid(0x8a1a1a), 0, 0.6, 0);
  add(new THREE.BoxGeometry(2.3, 1.8, 5), M.solid(0xf2e6c8), 0, 1.8, 0);
  add(new THREE.BoxGeometry(2.32, 0.9, 4.6), M.glassLobby, 0, 2.0, 0);
  add(new THREE.BoxGeometry(2.6, 0.25, 8.2), M.solid(0x8a1a1a), 0, 2.85, 0);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), M.chrome, (i % 2 ? 1 : -1) * 1.15, 1.8, -3.5 + Math.floor(i / 2) * 3.5);
  // raylar
  for (let i = 0; i + 1 < pts.length; i++){ const [ax, az, ay] = pts[i], [bx, bz, by] = pts[i + 1], L = Math.hypot(bx - ax, bz - az, by - ay); [-0.7, 0.7].forEach(dx => { const g = new THREE.BoxGeometry(0.1, 0.06, L); const yaw = Math.atan2(bx - ax, bz - az), pitch = -Math.atan2(by - ay, Math.hypot(bx - ax, bz - az)); g.rotateX(pitch); g.translate(dx, 0, 0); g.rotateY(yaw); g.translate((ax + bx) / 2, (ay + by) / 2 + 0.06, (az + bz) / 2); B.add('mass', 'rail', g); }); }
  let sPos = 0, dir = 1, bellT = 3;
  return (dt, t, hero) => {
    sPos += dir * dt * 4.5; if (sPos > P.total){ sPos = P.total; dir = -1; } else if (sPos < 0){ sPos = 0; dir = 1; }
    P.at(sPos, o); const a = P.at(Math.min(P.total, sPos + 2), {}), b = P.at(Math.max(0, sPos - 2), {});
    car.position.set(o.x, o.y, o.z); car.rotation.set(0, o.yaw, 0); car.rotateX(-Math.atan2(a.y - b.y, 4));
    bellT -= dt; if (bellT < 0){ bellT = 6 + Math.random() * 6; if (hero && Math.hypot(hero.pos.x - o.x, hero.pos.z - o.z) < 40) sfx('chime'); }
  };
}

/** Çarklı buharlı gemi: iki güverte, iki baca, arkada dönen çark */
export function makeSteamboat(THREE, M, parent, pts, y){
  const P = pathOf(pts, false), o = {}, g = new THREE.Group(); parent.add(g);
  const add = (geo, m, x, yy, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, yy, z); me.castShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(5, 1.2, 16), M.white, 0, 0.5, 0);
  add(new THREE.BoxGeometry(4.6, 1.8, 11), M.white, 0, 2.0, -0.5); add(new THREE.BoxGeometry(5.2, 0.15, 12), M.solid(0x8a1a2a), 0, 2.95, -0.5);
  add(new THREE.BoxGeometry(3.4, 1.6, 6), M.white, 0, 3.8, -1); add(new THREE.BoxGeometry(2, 1.2, 2), M.white, 0, 5.2, 1.5);
  [-0.8, 0.8].forEach(x => { add(new THREE.CylinderGeometry(0.35, 0.35, 6, 10), M.solid(0x1a1a1a), x, 6.5, 2.6); add(new THREE.CylinderGeometry(0.6, 0.35, 0.6, 10), M.solid(0x1a1a1a), x, 9.6, 2.6); });
  const wheel = new THREE.Group(); wheel.position.set(0, 1.6, -9.2); g.add(wheel);
  for (let i = 0; i < 10; i++){ const pd = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 1.3), M.solid(0x8a1a2a)); pd.position.set(0, Math.sin(i / 10 * Math.PI * 2) * 1.6, Math.cos(i / 10 * Math.PI * 2) * 1.6); pd.rotation.x = -i / 10 * Math.PI * 2; wheel.add(pd); }
  [-2.2, 2.2].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.08, 6, 20), M.solid(0x8a1a2a)); r.rotation.y = Math.PI / 2; r.position.x = x; wheel.add(r); });
  let sPos = P.total * 0.3, dir = 1;
  return (dt, t) => {
    sPos += dir * dt * 3.2; if (sPos > P.total){ sPos = P.total; dir = -1; } else if (sPos < 0){ sPos = 0; dir = 1; }
    P.at(sPos, o); g.position.set(o.x, y + Math.sin(t * 0.8) * 0.05, o.z); g.rotation.y = o.yaw + (dir < 0 ? Math.PI : 0);
    wheel.rotation.x -= dt * 2.2;
  };
}

/** Feribot: iki katlı yolcu gemisi (Lumière–New York hattı) */
export function makeFerry(THREE, M){
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  add(new THREE.BoxGeometry(7, 2, 24), M.solid(0x1d3a6e, {roughness:0.5}), 0, 0.4, 0);
  add(new THREE.ConeGeometry(3.5, 6, 4, 1, false, Math.PI / 4), M.solid(0x1d3a6e, {roughness:0.5}), 0, 0.4, 14.9).rotation.x = Math.PI / 2;
  add(new THREE.BoxGeometry(6.4, 2.4, 16), M.white, 0, 2.6, -1.5); add(new THREE.BoxGeometry(6.5, 1.0, 15.6), M.glassLobby, 0, 2.9, -1.5);
  add(new THREE.BoxGeometry(5, 2.2, 9), M.white, 0, 4.9, -3); add(new THREE.BoxGeometry(5.1, 0.8, 8.6), M.glassLobby, 0, 5.1, -3);
  add(new THREE.CylinderGeometry(0.7, 0.8, 3, 12), M.solid(0xc0362c), 0, 7.4, -5);
  add(new THREE.CylinderGeometry(0.72, 0.72, 0.6, 12), M.solid(0x1a1a1a), 0, 9.1, -5);
  return g;
}
