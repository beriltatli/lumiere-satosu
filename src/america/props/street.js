// Sokak öğeleri: araziye oturan yol şeritleri (otoyol, yokuş sokakları), düz bölgelerde cadde dikdörtgenleri, sokak lambaları.

export function makeStreet(THREE, M){
  /** Dünya koordinatında çoklu çizgi boyunca şerit; yükseklik heightAt(x, z) + off. */
  function ribbon(B, layer, key, pts, w, heightAt, off = 0.05, step = 4){
    const P = [];
    for (let i = 0; i + 1 < pts.length; i++){
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step));
      for (let k = i ? 1 : 0; k <= n; k++){ const t = k / n; P.push([ax + (bx - ax) * t, az + (bz - az) * t]); }
    }
    const pos = [], uv = [], idx = []; let acc = 0;
    for (let i = 0; i < P.length; i++){
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
      if (i) acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      for (const sd of [-1, 1]){ const x = P[i][0] + nx * sd * w / 2, z = P[i][1] + nz * sd * w / 2; pos.push(x, heightAt(x, z) + off, z); uv.push(sd < 0 ? 0 : w / 4, acc / 4); }
      if (i + 1 < P.length){ const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // ters üçgen sırası: normal yukarı baksın
    if (g.attributes.normal.getY(0) < 0){ const I = g.index.array; for (let i = 0; i < I.length; i += 3){ const t = I[i]; I[i] = I[i + 1]; I[i + 1] = t; } g.computeVertexNormals(); }
    return B.add(layer, key, g);
  }
  /** Otoyol: asfalt + sarı orta çizgi */
  function highway(B, pts, heightAt, w = 9){ ribbon(B, 'mass', 'asphalt', pts, w, heightAt, 0.12); ribbon(B, 'mass', 'lane', pts, 0.25, heightAt, 0.15); }
  /** Düz zeminde dikdörtgen yol/kaldırım parçası */
  function flat(B, layer, key, x, y, z, w, d, rot = 0){
    const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.rotateY(rot);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 4, uv.getY(i) * d / 4);
    g.translate(x, y, z); return B.add(layer, key, g);
  }
  // sokak lambası: direk + kol (tek parça) ve gece yanan baş
  const poleG = (() => { const a = new THREE.CylinderGeometry(0.08, 0.12, 5, 6).translate(0, 2.5, 0), b = new THREE.BoxGeometry(1.2, 0.08, 0.08).translate(0.55, 4.9, 0); return [a, b]; })();
  const lampGlow = new THREE.MeshBasicMaterial({color:0x222222, toneMapped:false});
  const headG = new THREE.BoxGeometry(0.45, 0.18, 0.3).translate(1.1, 4.8, 0);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  function lamp(B, x, y, z, rot){
    m4.compose(p.set(x, y, z), q.setFromEuler(e.set(0, rot, 0)), s);
    B.instance('mass', 'lamp:p', poleG[0], M.iron, m4); B.instance('mass', 'lamp:a', poleG[1], M.iron, m4, null, false); B.instance('mass', 'lamp:h', headG, lampGlow, m4, null, false);
  }
  return {ribbon, highway, flat, lamp, lampGlow, setNight(n){ lampGlow.color.setRGB(0.13 + n * 1.6, 0.13 + n * 1.2, 0.13 + n * 0.6); }};
}
